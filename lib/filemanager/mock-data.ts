// lib/filemanager/mock-data.ts — ĐÃ RÚT RUỘT 12/08 (entry `fm-data-that`).
//
// Trước đây file này bịa 2 dự án demo ("Nord Villa", "Riverside Office") + ~20 file mẫu, và
// `queries.ts` bày chúng như hàng thật. Nay File Manager đọc nguồn THẬT:
//   · cây thư mục chuẩn: `./queries.ts` (5 root + kệ Library)
//   · file: đĩa thật qua `./real-fs.ts` + file phiên qua `./local-state.ts`
// Ba export giữ lại RỖNG để không vỡ import cũ (`app/settings/_components/StorageCard.tsx` còn
// đọc `FM_FILES.length` — nay ra 0, đúng sự thật). Khi StorageCard đổi sang đo đĩa thật thì xoá
// hẳn file này.

import type { FmFile, FmFolder } from './types';

export const FM_COLLABORATORS: { id: string; name: string }[] = [];

export const FM_FOLDERS: FmFolder[] = [];

export const FM_FILES: FmFile[] = [];
