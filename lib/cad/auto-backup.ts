'use client';

/**
 * lib/cad/auto-backup.ts — B1 (30/07, docs/KE_HOACH_3_NGAY_SHIP_IF1.md + phát hiện Cowork
 * `docs/CAT-PHAM-VI-3-NGAY-2026-07-30.md` §1): `buildIfpack()` đã có nhưng KHÔNG có
 * `setInterval` nào — chỉ gọi tay từ menu Xuất (`CadSheets.tsx`). Đây là lỗ hổng CHẶN mọi thứ
 * khác: mất máy/xoá nhầm/hỏng ổ đĩa = mất TOÀN BỘ dự án CAD.
 *
 * Backup ra **thư mục thứ 2 trên máy** (khác nơi IndexedDB lưu — 1 ổ hỏng không mất cả 2 bản),
 * chạy mỗi 10 phút + mỗi lần autosave THẬT SỰ ghi xong (app này không có nút "Lưu tay" riêng —
 * mọi lưu đều qua autosave debounce ở `lib/sheets-persist.ts`, nên đó chính là tín hiệu "vừa lưu"
 * gần nhất với ý "mỗi lần lưu tay" của yêu cầu).
 *
 * B3 (30/07, SỬA TRƯỚC KHI THỬ SẬP — Hoà chốt): bỏ "giữ 5 bản" (chỉ 50 phút lịch sử — sai từ hôm
 * qua là mất). Thay bằng THANG THỜI GIAN + LƯU CHÊNH LỆCH (`backup-diff.ts`, phần THUẦN — mọi bất
 * biến "mốc đầy đủ tự đứng được"/"gãy chuỗi không crash" nằm ở đó, có test riêng nặng — 50 test).
 * File này CHỈ là lớp keo mỏng chạm File System Access API thật — quyết định NỘI DUNG ghi gì/xoá
 * gì đều đi qua `planRetention()`/`diffSheets()`/`reconstructUpTo()`, không tự chế logic ở đây
 * lần 2. `reconstructUpTo()` đòi đọc ĐỒNG BỘ (thuần, test không cần await) — file thật luôn đọc
 * BẤT ĐỒNG BỘ, nên `reconstructAsync()` dưới đây là bản SONG SINH đọc thật, đi ĐÚNG cùng thuật
 * toán (anchor full gần nhất → lùi tiếp nếu hỏng → áp diff xuôi → dừng ngay khi gãy) — không đổi
 * chữ ký hàm thuần chỉ để chiều 1 chỗ gọi bất đồng bộ.
 *
 * Dùng File System Access API (`showDirectoryPicker`) — chạy được cả trong Electron (Chromium
 * thật) lẫn Chrome/Edge thường, KHÔNG cần thêm cầu IPC nào (`electron/preload.js` cố ý không mở
 * quyền filesystem, xem file đó). Safari/Firefox chưa hỗ trợ → `backupSupported()` báo rõ,
 * không im lặng hỏng. KHÔNG cloud, KHÔNG cấu hình — đúng "mức tối thiểu chấp nhận" đã chốt.
 */

import { buildIfpack, restoreIfpack } from './ifpack';
import type { IdfSheetData } from './idf';
import {
  diffSheets, applyDiff, planRetention, backupFileName, parseBackupFileName,
  FULL_SNAPSHOT_EVERY, type BackupEntry, type BackupDiff, type BackupKind,
} from './backup-diff';

const HANDLE_DB = 'interiorflow-backup';
const HANDLE_STORE = 'handles';
const HANDLE_KEY = 'backupDir';
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

interface WritableHandle {
  getFileHandle: (name: string, opts: { create: boolean }) => Promise<{
    createWritable: () => Promise<{ write: (data: Blob | string) => Promise<void>; close: () => Promise<void> }>;
    getFile: () => Promise<File>;
  }>;
  removeEntry: (name: string) => Promise<void>;
  entries: () => AsyncIterableIterator<[string, unknown]>;
}

/** Liệt kê backup của 1 dự án đã có trong thư mục, đã parse tên → `BackupEntry[]`, sort theo
 * thời gian tăng dần. File lạ/không đúng quy ước tên bị bỏ qua (không đoán mò). */
async function listProjectEntries(handle: FileSystemDirectoryHandle, projectId: string): Promise<BackupEntry[]> {
  const dir = handle as unknown as WritableHandle;
  const out: BackupEntry[] = [];
  for await (const [name] of dir.entries()) {
    if (!name.startsWith(`${projectId}_`)) continue;
    const parsed = parseBackupFileName(name);
    if (parsed) out.push(parsed);
  }
  return out.sort((a, b) => a.timestampMs - b.timestampMs);
}

/** Đọc + parse nội dung 1 file backup (full → giải nén .ifpack; diff → parse JSON). `null` nếu
 * thiếu file, hỏng zip, hoặc JSON vỡ — KHÔNG throw (đúng luật "gãy chuỗi không crash"). */
async function loadBackupContent(handle: FileSystemDirectoryHandle, name: string, kind: BackupKind): Promise<IdfSheetData[] | BackupDiff | null> {
  const dir = handle as unknown as WritableHandle;
  try {
    const fileHandle = await dir.getFileHandle(name, { create: false });
    const file = await fileHandle.getFile();
    if (kind === 'full') {
      const restored = await restoreIfpack(await file.arrayBuffer());
      return restored ? restored.sheets : null;
    }
    const text = await file.text();
    return JSON.parse(text) as BackupDiff;
  } catch {
    return null;
  }
}

async function writeFile(handle: FileSystemDirectoryHandle, name: string, data: Blob | string): Promise<void> {
  const dir = handle as unknown as WritableHandle;
  const fileHandle = await dir.getFileHandle(name, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(data);
  await writable.close();
}

async function removeFile(handle: FileSystemDirectoryHandle, name: string): Promise<void> {
  const dir = handle as unknown as WritableHandle;
  await dir.removeEntry(name).catch(() => {});
}

export interface AsyncReconstructResult {
  sheets: IdfSheetData[];
  degraded: boolean;
  recoveredAsOf: string | null;
}

/** Bản song sinh ĐỌC THẬT của `reconstructUpTo()` (backup-diff.ts) — CÙNG thuật toán, khác mỗi
 * chỗ đọc file là `await` thay vì tra bảng thuần. Xem docstring khối đầu file lý do không đổi
 * chữ ký hàm thuần. */
async function reconstructAsync(handle: FileSystemDirectoryHandle, entries: BackupEntry[], targetIndex: number): Promise<AsyncReconstructResult> {
  if (targetIndex < 0 || targetIndex >= entries.length) return { sheets: [], degraded: true, recoveredAsOf: null };

  let anchorIdx = targetIndex;
  while (anchorIdx >= 0 && entries[anchorIdx].kind !== 'full') anchorIdx--;

  while (anchorIdx >= 0) {
    const anchorContent = await loadBackupContent(handle, entries[anchorIdx].name, 'full');
    if (anchorContent) {
      let state = anchorContent as IdfSheetData[];
      let lastGoodIdx = anchorIdx;
      let brokeMidway = false;
      for (let i = anchorIdx + 1; i <= targetIndex; i++) {
        const diffContent = await loadBackupContent(handle, entries[i].name, 'diff');
        if (!diffContent) {
          brokeMidway = true;
          break;
        }
        state = applyDiff(state, diffContent as BackupDiff);
        lastGoodIdx = i;
      }
      return { sheets: state, degraded: brokeMidway, recoveredAsOf: entries[lastGoodIdx].name };
    }
    anchorIdx--;
    while (anchorIdx >= 0 && entries[anchorIdx].kind !== 'full') anchorIdx--;
  }

  return { sheets: [], degraded: true, recoveredAsOf: null };
}

/**
 * Ghi 1 lượt backup mới (đầy đủ hoặc chênh lệch, tự quyết theo `FULL_SNAPSHOT_EVERY`) rồi tỉa
 * theo thang thời gian (`planRetention`) — đúc TRƯỚC, xoá SAU, đúng thứ tự bắt buộc để không bao
 * giờ để lại 1 bản không tự đứng được.
 */
async function writeAndPrune(handle: FileSystemDirectoryHandle, sheets: IdfSheetData[], project: { id: string; name: string }, nowMs: number): Promise<void> {
  const entries = await listProjectEntries(handle, project.id);
  const lastFullIdx = [...entries].map((e) => e.kind).lastIndexOf('full');
  const diffsSinceLastFull = lastFullIdx >= 0 ? entries.length - 1 - lastFullIdx : Infinity;
  const mustWriteFull = lastFullIdx < 0 || diffsSinceLastFull >= FULL_SNAPSHOT_EVERY - 1;

  let wroteFull = mustWriteFull;
  if (!mustWriteFull) {
    const prev = await reconstructAsync(handle, entries, entries.length - 1);
    if (prev.degraded && prev.sheets.length === 0) {
      // Không ráp được trạng thái trước (chuỗi hỏng nặng) — an toàn nhất là ghi FULL mới, không
      // cố diff lên nền không chắc chắn (đúng luật "mốc đầy đủ khi nghi ngờ", không đoán mò).
      wroteFull = true;
    } else {
      const diff = diffSheets(prev.sheets, sheets);
      await writeFile(handle, backupFileName(project.id, nowMs, 'diff'), JSON.stringify(diff));
    }
  }
  if (wroteFull) {
    const blob = await buildIfpack(sheets, project);
    await writeFile(handle, backupFileName(project.id, nowMs, 'full'), blob);
  }

  // Tỉa — đọc lại danh sách (vừa thêm 1 file), đọc trước nội dung mọi entry (còn nguyên vẹn,
  // chưa xoá gì), lập kế hoạch, đúc TRƯỚC rồi mới xoá.
  const afterWrite = await listProjectEntries(handle, project.id);
  const preloaded = new Map<string, IdfSheetData[] | BackupDiff>();
  for (const e of afterWrite) {
    const c = await loadBackupContent(handle, e.name, e.kind);
    if (c) preloaded.set(e.name, c);
  }
  const plan = planRetention(afterWrite, nowMs, (name) => preloaded.get(name)!);

  for (const m of plan.materialize) {
    const blob = await buildIfpack(m.sheets, project);
    const fullName = m.name.replace(/\.ifdiff\.json$/, '.ifpack');
    await writeFile(handle, fullName, blob);
    await removeFile(handle, m.name);
  }
  for (const name of plan.deleteNames) {
    // entry đã đúc ở trên đổi TÊN KHÁC (.ifpack) — deleteNames vẫn liệt kê tên GỐC (diff hoặc
    // full cũ), xoá đúng tên gốc đó là đủ, không đụng file .ifpack vừa đúc (tên khác hẳn).
    await removeFile(handle, name);
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
      await writeAndPrune(handle, sheets, { id: projectId, name: projectName }, now);
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

/* ═══════════════════════════ Duyệt + phục hồi (B3 — lối vào UI mới) ═══════════════════════════ */

export interface BackupListItem {
  name: string;
  timestampMs: number;
  kind: BackupKind;
}

/** Liệt kê backup của 1 dự án cho UI chọn — KHÔNG đọc nội dung (nhẹ, chỉ tên+thời gian). Mới nhất
 * trước (đúng thứ tự người dùng quét từ trên xuống khi tìm "bản trước khi tôi làm hỏng"). */
export async function listBackupsForUi(projectId: string): Promise<BackupListItem[]> {
  const handle = await loadHandle();
  if (!handle) return [];
  const entries = await listProjectEntries(handle, projectId);
  return [...entries].reverse();
}

export interface RecoveredBackup {
  sheets: IdfSheetData[];
  degraded: boolean;
  recoveredAsOf: string | null;
}

/** Ráp trạng thái tại 1 mục cụ thể người dùng chọn từ `listBackupsForUi()` — gãy chuỗi tự lùi về
 * mốc gần nhất TRƯỚC ĐÓ ráp được, KHÔNG throw, KHÔNG im lặng trả bản sai mà giả vờ đúng. */
export async function recoverBackup(projectId: string, targetName: string): Promise<RecoveredBackup | null> {
  const handle = await loadHandle();
  if (!handle) return null;
  const entries = await listProjectEntries(handle, projectId);
  const targetIndex = entries.findIndex((e) => e.name === targetName);
  if (targetIndex < 0) return null;
  return reconstructAsync(handle, entries, targetIndex);
}
