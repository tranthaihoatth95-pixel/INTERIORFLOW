'use client';

/**
 * lib/cad/auto-backup.ts — B1 (30/07, docs/KE_HOACH_3_NGAY_SHIP_IF1.md + phát hiện Cowork
 * `docs/CAT-PHAM-VI-3-NGAY-2026-07-30.md` §1): `buildIfpack()` đã có nhưng KHÔNG có
 * `setInterval` nào — chỉ gọi tay từ menu Xuất (`CadSheets.tsx`). Đây là lỗ hổng CHẶN mọi thứ
 * khác: mất máy/xoá nhầm/hỏng ổ đĩa = mất TOÀN BỘ dự án CAD.
 *
 * Backup ra **thư mục thứ 2 trên máy** (khác nơi IndexedDB lưu — 1 ổ hỏng không mất cả 2 bản),
 * giữ 5 bản gần nhất, chạy mỗi 10 phút + mỗi lần autosave THẬT SỰ ghi xong (app này không có
 * nút "Lưu tay" riêng — mọi lưu đều qua autosave debounce ở `lib/sheets-persist.ts`, nên đó
 * chính là tín hiệu "vừa lưu" gần nhất với ý "mỗi lần lưu tay" của yêu cầu).
 *
 * Dùng File System Access API (`showDirectoryPicker`) — chạy được cả trong Electron (Chromium
 * thật) lẫn Chrome/Edge thường, KHÔNG cần thêm cầu IPC nào (`electron/preload.js` cố ý không mở
 * quyền filesystem, xem file đó). Safari/Firefox chưa hỗ trợ → `backupSupported()` báo rõ,
 * không im lặng hỏng. KHÔNG cloud, KHÔNG cấu hình — đúng "mức tối thiểu chấp nhận" đã chốt.
 */

import { buildIfpack } from './ifpack';
import type { IdfSheetData } from './idf';

const HANDLE_DB = 'interiorflow-backup';
const HANDLE_STORE = 'handles';
const HANDLE_KEY = 'backupDir';
const KEEP = 5;
const INTERVAL_MS = 10 * 60 * 1000; // 10 phút
const MIN_GAP_MS = 30_000; // chặn spam nếu autosave bắn liên tục lúc đang vẽ

export function backupSupported(): boolean {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
}

function openHandleDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(HANDLE_DB, 1);
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains(HANDLE_STORE)) req.result.createObjectStore(HANDLE_STORE);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
      req.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function storeHandle(handle: FileSystemDirectoryHandle): Promise<void> {
  const db = await openHandleDb();
  if (!db) return;
  await new Promise<void>((resolve) => {
    const tx = db.transaction(HANDLE_STORE, 'readwrite');
    tx.objectStore(HANDLE_STORE).put(handle, HANDLE_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
  db.close();
}

async function loadHandle(): Promise<FileSystemDirectoryHandle | null> {
  const db = await openHandleDb();
  if (!db) return null;
  const handle = await new Promise<FileSystemDirectoryHandle | null>((resolve) => {
    const req = db.transaction(HANDLE_STORE, 'readonly').objectStore(HANDLE_STORE).get(HANDLE_KEY);
    req.onsuccess = () => resolve((req.result as FileSystemDirectoryHandle | undefined) ?? null);
    req.onerror = () => resolve(null);
  });
  db.close();
  return handle;
}

/** Đã bật backup chưa (có thư mục đã chọn) — dùng để UI hiện đúng trạng thái nút. */
export async function backupFolderChosen(): Promise<boolean> {
  return (await loadHandle()) !== null;
}

/** Bấm 1 lần — mở hộp chọn thư mục thật (BẮT BUỘC gesture người dùng, không tự động hoá được). */
export async function chooseBackupFolder(): Promise<boolean> {
  if (!backupSupported()) return false;
  try {
    const picker = (window as unknown as { showDirectoryPicker: (opts: { mode: string }) => Promise<FileSystemDirectoryHandle> })
      .showDirectoryPicker;
    const handle = await picker({ mode: 'readwrite' });
    await storeHandle(handle);
    return true;
  } catch {
    return false; // user bấm Huỷ hộp thoại chọn thư mục — không phải lỗi thật
  }
}

interface PermissibleHandle {
  queryPermission: (opts: { mode: string }) => Promise<string>;
  requestPermission: (opts: { mode: string }) => Promise<string>;
}

async function ensurePermission(handle: FileSystemDirectoryHandle): Promise<boolean> {
  const h = handle as unknown as PermissibleHandle;
  if ((await h.queryPermission({ mode: 'readwrite' })) === 'granted') return true;
  try {
    return (await h.requestPermission({ mode: 'readwrite' })) === 'granted';
  } catch {
    return false; // requestPermission cần gesture — timer nền không có, bỏ qua lượt này
  }
}

function timestamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

interface WritableHandle {
  getFileHandle: (name: string, opts: { create: boolean }) => Promise<{
    createWritable: () => Promise<{ write: (data: Blob) => Promise<void>; close: () => Promise<void> }>;
  }>;
  removeEntry: (name: string) => Promise<void>;
  entries: () => AsyncIterableIterator<[string, unknown]>;
}

/**
 * Từ danh sách tên file backup (cùng dự án) đang có, trả về những tên CẦN XOÁ để chỉ còn tối
 * đa `keep` bản gần nhất. Hàm THUẦN — test được không cần IndexedDB/File System Access API
 * (timestamp nằm trong tên dạng `<projectId>_<YYYYMMDD-HHmmss>.ifpack` → sort chuỗi = sort
 * theo thời gian, không cần parse ngày).
 */
export function namesToPrune(names: string[], keep: number): string[] {
  const sorted = [...names].sort();
  const excess = sorted.length - keep;
  return excess > 0 ? sorted.slice(0, excess) : [];
}

/** Ghi 1 bản backup rồi xoá bớt cho còn tối đa `KEEP` bản gần nhất (cùng dự án). */
async function writeAndPrune(handle: FileSystemDirectoryHandle, blob: Blob, projectId: string): Promise<void> {
  const dir = handle as unknown as WritableHandle;
  const fileName = `${projectId}_${timestamp()}.ifpack`;
  const fileHandle = await dir.getFileHandle(fileName, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(blob);
  await writable.close();

  const names: string[] = [];
  for await (const [name] of dir.entries()) {
    if (name.startsWith(`${projectId}_`) && name.endsWith('.ifpack')) names.push(name);
  }
  for (const name of namesToPrune(names, KEEP)) {
    await dir.removeEntry(name).catch(() => {});
  }
}

export interface AutoBackupSession {
  /** Gọi mỗi khi vừa có 1 lượt lưu thật (autosave `onSaved`) — nền, không throw, có chặn spam. */
  triggerNow: () => void;
  dispose: () => void;
}

/**
 * Bắt đầu phiên backup tự động cho 1 dự án CAD đang mở. Chưa bật (chưa chọn thư mục) hoặc mất
 * quyền → im lặng bỏ qua mỗi lượt — KHÔNG popup phiền, KHÔNG chặn editor (đúng luật "backup là
 * tiện nghi nền, không bao giờ được làm gãy thao tác vẽ", cùng tinh thần với autosaver IDB).
 */
export function startAutoBackup(
  getSheets: () => { sheets: IdfSheetData[]; projectId: string; projectName: string },
): AutoBackupSession {
  let lastRun = 0;
  let running = false;

  const run = async () => {
    const now = Date.now();
    if (running || now - lastRun < MIN_GAP_MS) return;
    running = true;
    lastRun = now;
    try {
      const handle = await loadHandle();
      if (!handle) return;
      if (!(await ensurePermission(handle))) return;
      const { sheets, projectId, projectName } = getSheets();
      if (!sheets.length) return;
      const blob = await buildIfpack(sheets, { id: projectId, name: projectName });
      await writeAndPrune(handle, blob, projectId);
    } catch {
      /* backup nền — không throw, không chặn editor */
    } finally {
      running = false;
    }
  };

  const timer = setInterval(run, INTERVAL_MS);

  return {
    triggerNow: () => void run(),
    dispose: () => clearInterval(timer),
  };
}
