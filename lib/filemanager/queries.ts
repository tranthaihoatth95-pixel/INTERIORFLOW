// lib/filemanager/queries.ts — hàm thuần đọc CÂY THƯ MỤC CHUẨN của File Manager, không side-effect.
//
// 12/08 (entry `fm-data-that`) — BỎ MOCK: trước đây file này đọc `./mock-data` (2 dự án demo
// "Nord Villa"/"Riverside" + ~20 file bịa + hằng số dung lượng cộng bù 2,1GB…). Nay:
//   · CÂY THƯ MỤC = cấu trúc CHUẨN của app (5 root theo SPEC-FILE-MANAGER §3 + các kệ Library) —
//     đây là khung cố định app tự tạo trên đĩa, không phải dữ liệu bịa.
//   · FILE = 100% từ đĩa thật: `FileManagerShell` gọi `listRealFiles()` (`./real-fs.ts`, File
//     System Access API) cho thư mục đang mở + file tải lên trong phiên (`./local-state.ts`).
//     `filesInFolder()` vì thế trả RỖNG — không còn file tĩnh nào để kể.
//   · DUNG LƯỢNG = chỉ đếm được phần đã thấy (không cộng bù số bịa). Đo toàn bộ đĩa cần walk đệ
//     quy qua File System Access — TODO entry sau (cùng chỗ với quyền per-folder bên dưới).
//
// QUYỀN: tầng ROOT theo `FM_ROOT_META` (rw/ro/locked — SPEC-FILE-MANAGER §7, mô hình thật).
// Quyền PER-FOLDER dưới root chưa có nguồn thật (chưa có ACL trong DB) → mặc định theo quyền của
// root, KHÔNG bịa quyền lạ. TODO (entry fm quyền): đọc ACL thật khi có model.

import { FM_ROOT_META, type FmFile, type FmFolder, type FmRootKind } from './types';

/** 5 root chuẩn — id giữ nguyên `root-*` như trước để không vỡ state/localStorage đang trỏ vào. */
const ROOTS: FmFolder[] = (Object.keys(FM_ROOT_META) as FmRootKind[]).map((root) => ({
  id: `root-${root}`,
  parentId: null,
  name: FM_ROOT_META[root].label,
  root,
  permission: FM_ROOT_META[root].permission,
}));

/** Kệ chuẩn dưới Library — trùng tên thư mục thật mà `real-fs.walk()` sẽ tạo/đọc trên đĩa. */
const LIBRARY_SHELVES = ['Materials', 'Blocks', 'Templates', 'Images', 'Fonts'] as const;

const FOLDERS: FmFolder[] = [
  ...ROOTS,
  ...LIBRARY_SHELVES.map((name): FmFolder => ({
    id: `lib-${name.toLowerCase()}`,
    parentId: 'root-library',
    name,
    root: 'library',
    permission: 'rw', // theo quyền root Library — xem TODO quyền per-folder ở đầu file
  })),
];

export function childFolders(parentId: string | null): FmFolder[] {
  return FOLDERS.filter((f) => f.parentId === parentId);
}

/** File tĩnh trong 1 thư mục — luôn RỖNG từ 12/08: file thật đọc từ đĩa qua `real-fs.ts`
 * (`FileManagerShell.refreshReal()`), file phiên từ `local-state.ts`. Hàm giữ lại cho nơi gọi cũ. */
export function filesInFolder(_folderId: string): FmFile[] {
  return [];
}

export function folderById(id: string | null): FmFolder | undefined {
  return FOLDERS.find((f) => f.id === id);
}

/** Đường dẫn từ root tới folder hiện tại — dùng vẽ breadcrumb. */
export function folderPath(id: string | null): FmFolder[] {
  const path: FmFolder[] = [];
  let cur = folderById(id);
  while (cur) {
    path.unshift(cur);
    cur = cur.parentId ? folderById(cur.parentId) : undefined;
  }
  return path;
}

/** Tổng dung lượng theo root — chỉ tính phần THẤY THẬT (không còn hằng số cộng bù). Hiện chưa walk
 * đệ quy toàn đĩa nên trả 0; con số từng-thư-mục thật hiển thị theo `listRealFiles` ở Shell. */
export function storageByRoot(): Record<FmRootKind, number> {
  return { projects: 0, library: 0, knowledge: 0, system: 0, backups: 0 };
}

export const STORAGE_QUOTA_BYTES = 10 * 1024 * 1024 * 1024; // 10 GB — mốc hiển thị, chưa enforce.

/** Số file + tổng dung lượng trong 1 thư mục (đệ quy cây chuẩn) — nay chỉ còn nguồn `extra`
 * (file phiên/đĩa mà nơi gọi đưa vào); không còn file tĩnh nào để cộng. */
export function folderStats(folderId: string, extra: FmFile[] = []): { count: number; bytes: number } {
  const descendantIds = new Set<string>([folderId]);
  let frontier = [folderId];
  while (frontier.length) {
    const next = FOLDERS.filter((f) => f.parentId && frontier.includes(f.parentId)).map((f) => f.id);
    next.forEach((id) => descendantIds.add(id));
    frontier = next;
  }
  const files = extra.filter((f) => descendantIds.has(f.folderId));
  return { count: files.length, bytes: files.reduce((sum, f) => sum + f.sizeBytes, 0) };
}
