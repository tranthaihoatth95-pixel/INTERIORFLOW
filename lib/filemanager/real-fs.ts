'use client';

/**
 * lib/filemanager/real-fs.ts — GHI/ĐỌC FILE THẬT xuống thư mục người dùng đã chọn ở Cài đặt.
 *
 * Khác `lib/filemanager/local-state.ts` (mock, chỉ ghi localStorage): file này dùng File System
 * Access API THẬT qua handle đã lưu trong IndexedDB (`lib/root-folder.ts` — hạ tầng có sẵn, KHÔNG
 * viết lại chọn-thư-mục ở đây, chỉ dùng `loadRootFolderHandle()` đã export).
 *
 * ⚠️ Bài học 31/07 (`docs/QUYET-DINH-HA-TANG-2026-07-31.md`): quyền `readwrite` RESET về 'prompt'
 * mỗi lần tải lại trang — đây là hành vi CHUẨN của API, không phải lỗi hiếm. `requestPermission()`
 * cần "user activation" thật; gọi sau một chuỗi `await` dài thì Chrome ÂM THẦM trả 'denied' không
 * hiện hộp thoại. Vì vậy mọi hàm ở đây trả LÝ DO CỤ THỂ (không `null` mập mờ, không nuốt lỗi) để
 * lớp UI biến thành thông báo THẤY ĐƯỢC — đúng yêu cầu sửa lỗi mất-dữ-liệu-im-lặng.
 */

import { loadRootFolderHandle, rootFolderSupported } from '@/lib/root-folder';

export type RealFsFailure =
  | 'unsupported'   // trình duyệt không có File System Access API
  | 'no-root'       // chưa chọn thư mục gốc ở Cài đặt
  | 'no-permission' // quyền ghi bị từ chối/thu hồi
  | 'io';           // lỗi đọc/ghi thật

export type RealFsResult<T> =
  | { ok: true; value: T }
  | { ok: false; reason: RealFsFailure };

/** Thông báo tiếng Việt cho từng lý do — 1 nguồn, tránh mỗi nơi tự chế câu khác nhau. */
export function realFsMessage(reason: RealFsFailure): string {
  switch (reason) {
    case 'unsupported':
      return 'Trình duyệt này chưa hỗ trợ ghi thẳng ra thư mục (cần Chrome/Edge hoặc bản Electron).';
    case 'no-root':
      return 'Chưa chọn nơi lưu file — mở Cài đặt để chọn thư mục trước.';
    case 'no-permission':
      return 'Chưa được cấp quyền ghi — mở Cài đặt, bấm "Đổi…" và chọn lại đúng thư mục đó.';
    case 'io':
      return 'Ghi file xuống đĩa thất bại.';
  }
}

interface PermissibleHandle {
  queryPermission: (opts: { mode: string }) => Promise<string>;
  requestPermission: (opts: { mode: string }) => Promise<string>;
}

interface DirHandleLike {
  getDirectoryHandle: (name: string, opts: { create: boolean }) => Promise<FileSystemDirectoryHandle>;
  getFileHandle: (name: string, opts: { create: boolean }) => Promise<FileHandleLike>;
  values: () => AsyncIterable<FileSystemHandle>;
}

interface FileHandleLike {
  createWritable: () => Promise<{ write: (data: Blob | string) => Promise<void>; close: () => Promise<void> }>;
  getFile: () => Promise<File>;
}

/** Xin/kiểm quyền ghi — cùng khuôn `ensurePermission()` nội bộ của `lib/root-folder.ts`
 * (không export được nên viết lại đúng 1 lần ở đây, không sửa file ngoài vùng G4). */
async function ensureRw(handle: FileSystemDirectoryHandle): Promise<boolean> {
  const h = handle as unknown as PermissibleHandle;
  try {
    if ((await h.queryPermission({ mode: 'readwrite' })) === 'granted') return true;
  } catch {
    return false;
  }
  try {
    return (await h.requestPermission({ mode: 'readwrite' })) === 'granted';
  } catch {
    return false;
  }
}

/** Thư mục gốc đã sẵn sàng ghi (đủ hỗ trợ + đã chọn + đã có quyền). */
async function readyRoot(): Promise<RealFsResult<FileSystemDirectoryHandle>> {
  if (!rootFolderSupported()) return { ok: false, reason: 'unsupported' };
  const root = await loadRootFolderHandle();
  if (!root) return { ok: false, reason: 'no-root' };
  if (!(await ensureRw(root))) return { ok: false, reason: 'no-permission' };
  return { ok: true, value: root };
}

/** Lọc ký tự hệ điều hành cấm trong tên thư mục/tệp — cùng quy ước `projectFolderName()`. */
function safeSegment(name: string): string {
  return name.replace(/[/\\:*?"<>|]/g, '').trim();
}

/** Đi (và tạo nếu thiếu) theo chuỗi thư mục con dưới gốc. */
async function walk(
  root: FileSystemDirectoryHandle,
  segments: string[],
  create: boolean,
): Promise<RealFsResult<FileSystemDirectoryHandle>> {
  let dir = root;
  for (const raw of segments) {
    const seg = safeSegment(raw);
    if (!seg) continue;
    try {
      dir = await (dir as unknown as DirHandleLike).getDirectoryHandle(seg, { create });
    } catch {
      return { ok: false, reason: 'io' }; // create:false + chưa tồn tại ⇒ coi như chưa có
    }
  }
  return { ok: true, value: dir };
}

/**
 * Ghi 1 File (nhị phân) vào `<gốc>/<segments…>/<file.name>` — tự tạo thư mục con còn thiếu.
 * `write()` của File System Access nhận thẳng Blob nên KHÔNG cần đọc vào bộ nhớ trước (quan trọng
 * với file .idf/render vài trăm MB — đọc hết vào RAM sẽ treo tab).
 */
export async function writeFileToRoot(segments: string[], file: File): Promise<RealFsResult<void>> {
  const root = await readyRoot();
  if (!root.ok) return root;
  const dir = await walk(root.value, segments, true);
  if (!dir.ok) return dir;
  try {
    const handle = await (dir.value as unknown as DirHandleLike).getFileHandle(safeSegment(file.name) || 'khong-ten', { create: true });
    const w = await handle.createWritable();
    await w.write(file);
    await w.close();
    return { ok: true, value: undefined };
  } catch {
    return { ok: false, reason: 'io' };
  }
}

export interface RealFileEntry {
  name: string;
  sizeBytes: number;
  lastModified: number;
}

/** Liệt kê file THẬT trong `<gốc>/<segments…>` — thư mục con bỏ qua (cây thư mục vẫn theo mock). */
export async function listRealFiles(segments: string[]): Promise<RealFsResult<RealFileEntry[]>> {
  const root = await readyRoot();
  if (!root.ok) return root;
  const dir = await walk(root.value, segments, false);
  if (!dir.ok) return { ok: true, value: [] }; // thư mục chưa tồn tại dưới đĩa ⇒ chưa có file thật
  try {
    const out: RealFileEntry[] = [];
    for await (const entry of (dir.value as unknown as DirHandleLike).values()) {
      if (entry.kind !== 'file') continue;
      const f = await (entry as unknown as FileHandleLike).getFile();
      out.push({ name: f.name, sizeBytes: f.size, lastModified: f.lastModified });
    }
    return { ok: true, value: out };
  } catch {
    return { ok: false, reason: 'io' };
  }
}
