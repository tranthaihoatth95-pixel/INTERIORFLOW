// lib/filemanager/types.ts — File Manager ("chợ đầu mối"), mock cục bộ.
// Nguồn: docs/SPEC-FILE-MANAGER.md (cây thư mục + 3 tầng phân quyền) +
// docs/CHOT-FILEMANAGER-SETTINGS-2026-08-02.md (layout 3 khu).

export type FmSource = 'local' | 'drive' | 'notion' | 'git';

export type FmFileKind =
  | 'idf'
  | 'image'
  | 'cad'
  | 'pdf'
  | 'doc'
  | 'sheet'
  | 'video'
  | 'material'
  | 'archive'
  | 'other';

/** Vòng đời file — SPEC-FILE-MANAGER §4 việc 4. */
export type FmLifecycle = 'nhap' | 'chinh_thuc' | 'luu_tru';

export type FmRootKind = 'projects' | 'library' | 'knowledge' | 'system' | 'backups';

/** Quyền theo tầng — SPEC-FILE-MANAGER §7. */
export type FmPermission = 'rw' | 'ro' | 'locked';

export interface FmFolder {
  id: string;
  parentId: string | null;
  name: string;
  root: FmRootKind;
  permission: FmPermission;
  /** cộng sự có mặt trong thư mục dự án — hiện avatar trên thẻ folder. */
  collaboratorIds?: string[];
  /** icon nguồn nếu thư mục đồng bộ từ ngoài (Drive/Notion/git bridge). */
  source?: FmSource;
}

export interface FmComment {
  id: string;
  author: string;
  text: string;
  createdAt: number;
}

export interface FmFile {
  id: string;
  folderId: string;
  name: string;
  ext: string;
  kind: FmFileKind;
  sizeBytes: number;
  addedById: string;
  addedByName: string;
  source: FmSource;
  lifecycle: FmLifecycle;
  /** ảnh/preview — 2 màu gradient thay ảnh thật (mock, không cần asset nhị phân). */
  thumbnail?: [string, string];
  description: string;
  /** chỉ có ở file loại 'material' — khớp matId ATLAS dùng chung với Kệ Thư viện (G4). */
  matId?: string;
  brand?: string;
  price?: string;
}

export const FM_ROOT_META: Record<FmRootKind, { label: string; permission: FmPermission; hint: string }> = {
  projects: { label: 'Projects', permission: 'rw', hint: 'Đọc-ghi — dự án của bạn.' },
  library: { label: 'Library', permission: 'rw', hint: 'Đọc-ghi — dùng chung mọi dự án.' },
  knowledge: { label: 'Knowledge', permission: 'ro', hint: 'Chỉ đọc — quy chuẩn Vitals dựa vào, studio tự nạp thêm nhưng không sửa/xoá.' },
  system: { label: '_System', permission: 'locked', hint: 'Khoá — .idf gốc, cache, backup nội bộ.' },
  backups: { label: '_Backups', permission: 'ro', hint: 'Chỉ đọc — bản sao lưu tự động định kỳ.' },
};

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let value = bytes / 1024;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i++;
  }
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[i]}`;
}
