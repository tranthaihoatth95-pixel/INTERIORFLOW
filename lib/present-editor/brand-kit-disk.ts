'use client';

/**
 * lib/present-editor/brand-kit-disk.ts — B3 (31/07, ĐỢT B lớp lưu trữ, mã `4.1.c`): cầu nối
 * Brand Kit (`brand-kit.ts`, THUẦN + localStorage) sang thư mục dự án trên đĩa (`root-folder.ts`).
 *
 * `brand-kit.ts` CỐ Ý giữ nguyên — không nhét File System Access API vào đó (module đó đã tách
 * hàm THUẦN `buildBrandKitExport`/`parseBrandKitExport`/`mergeBrandKits` đúng để B3 TÁI DÙNG
 * nguyên, không viết lại parse/merge lần 2 — comment `BrandKitPanel.tsx` dòng ~154-157 đã ghi rõ
 * ý định này từ lúc làm `7.1.25`). File này CHỈ lo phần "đọc/ghi VÀO ĐÂU" (thư mục dự án), tái
 * dùng `exportBrandKitsJson()`/`importBrandKitsJson()` cho phần NỘI DUNG.
 *
 * "Nối với đường Nhập .json đã có ở 0b" (yêu cầu B3) = `importBrandKitFromProjectFolder()` dưới
 * đây gọi THẲNG `importBrandKitsJson()` — cùng logic merge/overwrite/dedup-id với nút "Nhập
 * .json…" thủ công, chỉ khác nguồn đọc JSON (tệp trong thư mục dự án thay vì hộp thoại chọn tệp).
 */

import { exportBrandKitsJson, importBrandKitsJson } from './brand-kit';
import { getProjectFolderHandle, writeTextFile, readTextFile } from '../root-folder';

const FILE_NAME = 'brand-kit.json';

/** Ghi Brand Kit (mọi kit + kit đang chọn) vào `brand-kit.json` trong thư mục dự án. `true` nếu
 * ghi thành công — `false` khi chưa chọn thư mục gốc (B1)/quyền bị từ chối/lỗi đĩa (không throw,
 * gọi từ UI như 1 tiện nghi nền, không được làm gãy thao tác Lưu Brand Kit chính). */
export async function writeBrandKitToProjectFolder(projectId: string, projectName: string): Promise<boolean> {
  const dir = await getProjectFolderHandle(projectId, projectName, { create: true });
  if (!dir) return false;
  return writeTextFile(dir, FILE_NAME, exportBrandKitsJson());
}

/** `true` nếu thư mục dự án đang có sẵn `brand-kit.json` (dùng cho UI quyết có hiện nút "Nhập từ
 * thư mục dự án" hay không — không hiện nút dẫn tới lỗi chắc chắn). */
export async function projectFolderHasBrandKit(projectId: string, projectName: string): Promise<boolean> {
  const dir = await getProjectFolderHandle(projectId, projectName);
  if (!dir) return false;
  return (await readTextFile(dir, FILE_NAME)) !== null;
}

/** Nhập Brand Kit TỪ `brand-kit.json` trong thư mục dự án — tái dùng nguyên `importBrandKitsJson()`
 * (0b/`7.1.25`), không viết logic merge/parse lần 2. */
export async function importBrandKitFromProjectFolder(
  projectId: string,
  projectName: string,
  mode: 'merge' | 'overwrite',
): Promise<{ ok: true; addedCount: number; totalCount: number } | { ok: false; error: string }> {
  const dir = await getProjectFolderHandle(projectId, projectName);
  if (!dir) return { ok: false, error: 'Chưa chọn thư mục gốc InteriorFlow (xem Cài đặt → Lưu trữ).' };
  const json = await readTextFile(dir, FILE_NAME);
  if (json === null) return { ok: false, error: 'Thư mục dự án chưa có brand-kit.json.' };
  return importBrandKitsJson(json, mode);
}
