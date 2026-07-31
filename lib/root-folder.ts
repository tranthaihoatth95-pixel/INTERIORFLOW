'use client';

/**
 * lib/root-folder.ts — B1 (31/07, ĐỢT B lớp lưu trữ, `docs/QUYET-DINH-HA-TANG-2026-07-31.md`
 * ⑥, mã `4.1.a`): chọn + cất handle thư mục gốc `~/InteriorFlow` MỘT LẦN.
 *
 * ⚠️ B1 CHƯA ĐỔI NGUỒN SỰ THẬT GÌ CẢ (theo đúng yêu cầu) — file này chỉ cất giữ handle thư mục,
 * KHÔNG đọc/ghi bất kỳ dữ liệu dự án nào. `.idf`/`.idfp`/`brand-kit.json`/`.sao-luu` sẽ nối vào
 * đây ở B2/B3/B4 (từng pha báo riêng, đợi gật riêng — không làm trước).
 *
 * KHUÔN CHÉP TỪ `lib/cad/auto-backup.ts:70,78` (`storeHandle()`/`loadHandle()`, Hoà chỉ đích
 * danh "đừng nghĩ khuôn mới") — CÙNG cơ chế File System Access API + IndexedDB cất handle, chạy
 * được cả Electron lẫn Chrome/Edge thường, KHÔNG cần cầu IPC (`electron/preload.js` cố ý không
 * mở quyền filesystem, giữ nguyên). Dùng IndexedDB/key RIÊNG (`interiorflow-root`/`rootDir`),
 * KHÔNG dùng chung `interiorflow-backup`/`backupDir` của auto-backup.ts — 2 khái niệm khác nhau
 * dù người dùng có thể chọn cùng 1 thư mục vật lý cho cả hai (backup hiện là thư mục THỨ HAI
 * tách biệt để 1 ổ hỏng không mất cả 2 bản; root ở đây sẽ là NGUỒN SỰ THẬT từ B4 — trộn chung 1
 * khoá sẽ làm lộn 2 vai trò).
 */

const HANDLE_DB = 'interiorflow-root';
const HANDLE_STORE = 'handles';
const HANDLE_KEY = 'rootDir';

export function rootFolderSupported(): boolean {
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

/** Export (khác `auto-backup.ts` giữ private) — B2/B3/B4 sẽ cần đọc lại handle này để ghi file
 * dự án thật vào. Bản thân việc export KHÔNG phải "đổi nguồn sự thật" — chỉ là hạ tầng đọc handle,
 * chưa có chỗ nào gọi tới để ghi/đọc dữ liệu dự án ở B1. */
export async function loadRootFolderHandle(): Promise<FileSystemDirectoryHandle | null> {
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

/** Đã chọn thư mục gốc chưa — dùng để UI hiện đúng trạng thái. */
export async function rootFolderChosen(): Promise<boolean> {
  return (await loadRootFolderHandle()) !== null;
}

/** Tên thư mục đã chọn (chỉ để hiện cho người dùng xem, KHÔNG phải đường dẫn đầy đủ — trình
 * duyệt không cấp đường dẫn tuyệt đối qua File System Access API, chỉ cấp `.name`). `null` nếu
 * chưa chọn hoặc quyền đã bị thu hồi (không throw). */
export async function rootFolderName(): Promise<string | null> {
  const handle = await loadRootFolderHandle();
  return handle?.name ?? null;
}

/** Bấm 1 lần — mở hộp chọn thư mục thật (BẮT BUỘC gesture người dùng, không tự động hoá được).
 * Cùng khuôn `chooseBackupFolder()` (`auto-backup.ts`). */
export async function chooseRootFolder(): Promise<boolean> {
  if (!rootFolderSupported()) return false;
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
