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

/* ───────────────────── B3 (31/07, mã 4.1.c) — thư mục 1 dự án + đọc/ghi tệp ─────────────────────
 * Hạ tầng CHUNG cho mọi thứ sẽ nối vào thư mục dự án (brand-kit.json ở B3, .idf/.idfp/.sao-luu/
 * ở B4) — viết 1 lần ở đây, không lặp lại cho từng loại tệp.
 */

interface PermissibleHandle {
  queryPermission: (opts: { mode: string }) => Promise<string>;
  requestPermission: (opts: { mode: string }) => Promise<string>;
}

/**
 * Cùng khuôn `ensurePermission()` (`auto-backup.ts`) — quyền File System Access có thể bị trình
 * duyệt thu hồi giữa các phiên (mỗi lần TẢI LẠI TRANG/điều hướng mới, quyền `readwrite` đã cấp lúc
 * chọn thư mục RESET về 'prompt' — đây KHÔNG phải lỗi hiếm, là hành vi CHUẨN của File System Access
 * API). `requestPermission()` cần "user activation" thật — gọi được nhưng KHÔNG có gesture đủ mới
 * (vd bên trong 1 chuỗi await sau khi bấm nút) thì Chrome ÂM THẦM trả 'denied', KHÔNG hiện hộp
 * thoại nào cả (đây CHÍNH LÀ nguyên nhân lỗi mất-dữ-liệu-im-lặng Hoà bắt được 31/07 — xem
 * `docs/QUYET-DINH-HA-TANG-2026-07-31.md` mục sự cố). Không throw nếu bị từ chối, trả `false` —
 * NHƯNG callers ở lớp trên (B3/B4) BẮT BUỘC phải biến `false` này thành thông báo THẤY ĐƯỢC cho
 * người dùng, không được nuốt im lặng nữa (đúng yêu cầu sửa lỗi 31/07).
 */
async function ensurePermission(handle: FileSystemDirectoryHandle): Promise<boolean> {
  const h = handle as unknown as PermissibleHandle;
  try {
    if ((await h.queryPermission({ mode: 'readwrite' })) === 'granted') return true;
  } catch {
    return false; // queryPermission tự nó hiếm khi throw nhưng vẫn phòng thủ — không để rơi unhandled
  }
  try {
    return (await h.requestPermission({ mode: 'readwrite' })) === 'granted';
  } catch {
    return false; // requestPermission cần gesture — không có thì bỏ qua lượt này
  }
}

/** Tên thư mục 1 dự án — khớp sơ đồ Hoà chốt `<mã dự án> — <tên>/`. Lọc ký tự hệ điều hành cấm
 * trong tên thư mục (`/ \ : * ? " < > |`) khỏi TÊN (mã dự án là id kỹ thuật, luôn an toàn sẵn). */
export function projectFolderName(projectId: string, projectName: string): string {
  /* soi-mien-tru: F-NHAN-BIA — đây KHÔNG phải bịa danh tính. Một thư mục trên đĩa **bắt buộc**
     phải có tên; rỗng thì hệ tệp từ chối tạo. Đây là lùi THẬT ở tầng lưu trữ, không phải một
     nhãn trình bày cho người dùng đọc như tên dự án. */
  const safeName = projectName.replace(/[/\\:*?"<>|]/g, '').trim() || 'Không tên';
  return `${projectId} — ${safeName}`;
}

/** Lý do KHÔNG mở/ghi/đọc được thư mục — callers dùng để hiện ĐÚNG thông báo cho người dùng, không
 * được gộp chung thành "lỗi chung chung" hay im lặng nữa (bài học sự cố 31/07). */
export type FolderAccessFailure = 'no-root' | 'no-permission' | 'no-project-id' | 'error';

export type FolderAccessResult =
  | { ok: true; dir: FileSystemDirectoryHandle }
  | { ok: false; reason: FolderAccessFailure };

/**
 * Thư mục của 1 dự án dưới thư mục gốc — tự tạo nếu `create:true` và chưa có. Trả lý do CỤ THỂ khi
 * thất bại (KHÔNG còn `null` mập mờ như bản cũ 31/07 — đó chính là chỗ nuốt lỗi khiến `brand-kit.json`
 * "lưu" mà không ghi xuống đĩa, người dùng không hề biết). Không throw — mọi hàm ở đây là tiện nghi,
 * không được làm gãy editor, cùng triết lý `auto-backup.ts`; nhưng "không throw" khác "không báo".
 */
export async function getProjectFolderHandle(
  projectId: string,
  projectName: string,
  opts?: { create?: boolean },
): Promise<FolderAccessResult> {
  if (!projectId) return { ok: false, reason: 'no-project-id' };
  const root = await loadRootFolderHandle();
  if (!root) return { ok: false, reason: 'no-root' };
  if (!(await ensurePermission(root))) return { ok: false, reason: 'no-permission' };
  try {
    const dir = root as unknown as { getDirectoryHandle: (name: string, o: { create: boolean }) => Promise<FileSystemDirectoryHandle> };
    const handle = await dir.getDirectoryHandle(projectFolderName(projectId, projectName), { create: opts?.create ?? false });
    return { ok: true, dir: handle };
  } catch {
    return { ok: false, reason: 'error' }; // create:false + thư mục chưa tồn tại → NotFoundError, coi như "chưa có"
  }
}

interface WritableFileHandle {
  getFileHandle: (name: string, opts: { create: boolean }) => Promise<{
    createWritable: () => Promise<{ write: (data: Blob | string) => Promise<void>; close: () => Promise<void> }>;
    getFile: () => Promise<File>;
  }>;
}

/** Ghi 1 tệp văn bản vào thư mục đã có handle — `true` nếu ghi thành công. Cùng khuôn `writeFile`
 * nội bộ của `auto-backup.ts`, xuất công khai vì B3/B4 đều cần. */
export async function writeTextFile(dir: FileSystemDirectoryHandle, name: string, text: string): Promise<boolean> {
  try {
    const d = dir as unknown as WritableFileHandle;
    const fileHandle = await d.getFileHandle(name, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(text);
    await writable.close();
    return true;
  } catch {
    return false;
  }
}

/** Đọc 1 tệp văn bản từ thư mục đã có handle — `null` nếu thiếu tệp/lỗi đọc (không throw). */
export async function readTextFile(dir: FileSystemDirectoryHandle, name: string): Promise<string | null> {
  try {
    const d = dir as unknown as WritableFileHandle;
    const fileHandle = await d.getFileHandle(name, { create: false });
    const file = await fileHandle.getFile();
    return await file.text();
  } catch {
    return null;
  }
}

/* ═══════════ Sự cố 31/07 — "Kiểm tra kết nối thư mục" ═══════════
 * Hoà bắt được: chọn thư mục xong, Settings hiện đã chọn, bấm "Lưu Brand Kit" báo ĐÃ LƯU — nhưng
 * KHÔNG có tệp nào ghi xuống đĩa thật, KHÔNG có hộp xin quyền nào hiện ra. Verify độc lập (thay
 * `showDirectoryPicker()` thật bằng handle OPFS thật qua cùng đường IndexedDB — không cần hộp
 * thoại OS, vẫn là FileSystemDirectoryHandle thật, không phải mock) xác nhận: LOGIC ghi/đọc/đặt
 * tên thư mục ĐÚNG (file lên đúng chỗ, đúng nội dung) — lỗi nằm 100% ở TẦNG QUYỀN: sau khi điều
 * hướng/tải lại trang, quyền `readwrite` đã cấp lúc chọn thư mục RESET về 'prompt' (đúng đặc tả,
 * không phải bug trình duyệt), `requestPermission()` gọi lại không đủ "user activation" mới ⇒
 * Chrome ÂM THẦM trả 'denied', không hiện hộp thoại — `ensurePermission()` nuốt gọn thành `false`,
 * không ai báo cho người dùng biết. Hàm dưới đây là CÁCH DUY NHẤT chứng minh tầng đĩa còn sống:
 * ghi thật 1 tệp, đọc lại, so khớp, dọn rác — gọi TRỰC TIẾP từ nút bấm (gesture thật, tối thiểu
 * await trước khi chạm `requestPermission` bên trong `ensurePermission`).
 */

const CONNECTION_TEST_FILE = '.interiorflow-connection-test';

export type ConnectionTestResult =
  | { ok: true }
  | { ok: false; reason: 'no-root' | 'no-permission' | 'write-failed' | 'read-mismatch' };

/** "Kiểm tra kết nối thư mục" (Settings) — ghi/đọc/dọn 1 tệp thật vào thư mục gốc, báo ĐÚNG kết
 * quả. Đồng thời đây chính là lối "xin lại quyền" khi quyền đã bị thu hồi — click này CHÍNH LÀ
 * gesture cần thiết để `ensurePermission()` bên trong xin lại thành công. */
export async function testStorageConnection(): Promise<ConnectionTestResult> {
  const root = await loadRootFolderHandle();
  if (!root) return { ok: false, reason: 'no-root' };
  if (!(await ensurePermission(root))) return { ok: false, reason: 'no-permission' };
  const token = `if-test-${Math.random().toString(36).slice(2)}`;
  const wrote = await writeTextFile(root, CONNECTION_TEST_FILE, token);
  if (!wrote) return { ok: false, reason: 'write-failed' };
  const read = await readTextFile(root, CONNECTION_TEST_FILE);
  try {
    const d = root as unknown as { removeEntry: (name: string) => Promise<void> };
    await d.removeEntry(CONNECTION_TEST_FILE);
  } catch {
    /* dọn rác thất bại không quan trọng, không chặn kết quả test */
  }
  if (read !== token) return { ok: false, reason: 'read-mismatch' };
  return { ok: true };
}
