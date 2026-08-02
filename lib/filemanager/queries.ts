// lib/filemanager/queries.ts — hàm thuần đọc cây thư mục mock, không side-effect.

import { FM_FILES, FM_FOLDERS } from './mock-data';
import type { FmFile, FmFolder, FmRootKind } from './types';

export function childFolders(parentId: string | null): FmFolder[] {
  return FM_FOLDERS.filter((f) => f.parentId === parentId);
}

export function filesInFolder(folderId: string): FmFile[] {
  return FM_FILES.filter((f) => f.folderId === folderId);
}

export function folderById(id: string | null): FmFolder | undefined {
  return FM_FOLDERS.find((f) => f.id === id);
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

/** Tổng dung lượng (file mock + hằng số bù cho ảnh/asset không liệt kê hết) theo từng root. */
export function storageByRoot(): Record<FmRootKind, number> {
  const totals: Record<FmRootKind, number> = { projects: 0, library: 0, knowledge: 0, system: 0, backups: 0 };
  for (const file of FM_FILES) {
    const folder = folderById(file.folderId);
    if (!folder) continue;
    totals[folder.root] += file.sizeBytes;
  }
  // Bù cho phần không liệt kê hết trong mock (project khác, asset nhị phân thật) — giữ số hiển thị
  // đáng tin thay vì chỉ = tổng vài file mẫu.
  totals.projects += 2_100_000_000;
  totals.library += 640_000_000;
  totals.knowledge += 42_000_000;
  totals.system += 180_000_000;
  totals.backups += 1_450_000_000;
  return totals;
}

export const STORAGE_QUOTA_BYTES = 10 * 1024 * 1024 * 1024; // 10 GB — mốc tầng free, mock.

/** Số file + tổng dung lượng trong 1 thư mục, ĐỆ QUY xuống mọi thư mục con — hiện trên chip folder
 * (giống Finder: "n mục" của 1 folder tính cả bên trong con, không chỉ file nằm trực tiếp).
 * `extra` = file tải lên trong phiên (session-only) cần cộng thêm vào, xem lib/filemanager/local-state.ts. */
export function folderStats(folderId: string, extra: FmFile[] = []): { count: number; bytes: number } {
  const allFiles = [...FM_FILES, ...extra];
  const descendantIds = new Set<string>([folderId]);
  let frontier = [folderId];
  while (frontier.length) {
    const next = FM_FOLDERS.filter((f) => f.parentId && frontier.includes(f.parentId)).map((f) => f.id);
    next.forEach((id) => descendantIds.add(id));
    frontier = next;
  }
  const files = allFiles.filter((f) => descendantIds.has(f.folderId));
  return { count: files.length, bytes: files.reduce((sum, f) => sum + f.sizeBytes, 0) };
}
