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
 *
 * SỬA SỰ CỐ 31/07 (mất-dữ-liệu-im-lặng): trước đây `writeBrandKitToProjectFolder` trả `boolean`
 * trơn — thất bại (kể cả mất quyền truy cập) chỉ là `false`, không lý do, caller ở `BrandKitPanel`
 * coi là "tiện nghi nền" rồi bỏ qua luôn, không báo gì cho người dùng. Giờ trả LÝ DO CỤ THỂ
 * (`FolderAccessFailure` từ `root-folder.ts`) — `BrandKitPanel` BẮT BUỘC hiện thông báo khác với
 * "đã lưu" khi ghi đĩa thất bại (xem `docs/QUYET-DINH-HA-TANG-2026-07-31.md` mục sự cố).
 */

import { exportBrandKitsJson, importBrandKitsJson } from './brand-kit';
import { getProjectFolderHandle, writeTextFile, readTextFile, type FolderAccessFailure } from '../root-folder';

const FILE_NAME = 'brand-kit.json';

export type WriteBrandKitResult = { ok: true } | { ok: false; reason: FolderAccessFailure | 'write-failed' };

/** Ghi Brand Kit (mọi kit + kit đang chọn) vào `brand-kit.json` trong thư mục dự án — trả lý do cụ
 * thể khi thất bại, KHÔNG còn `boolean` mập mờ (caller PHẢI phân biệt "chưa bật lưu trữ" — im lặng
 * đúng, tính năng opt-in — với "đã bật nhưng ghi lỗi" — BẮT BUỘC báo, đây là sự cố 31/07). */
export async function writeBrandKitToProjectFolder(projectId: string, projectName: string): Promise<WriteBrandKitResult> {
  const res = await getProjectFolderHandle(projectId, projectName, { create: true });
  if (!res.ok) return res;
  const wrote = await writeTextFile(res.dir, FILE_NAME, exportBrandKitsJson());
  return wrote ? { ok: true } : { ok: false, reason: 'write-failed' };
}

/** `true` nếu thư mục dự án đang có sẵn `brand-kit.json` (dùng cho UI quyết có hiện nút "Nhập từ
 * thư mục dự án" hay không — không hiện nút dẫn tới lỗi chắc chắn). */
export async function projectFolderHasBrandKit(projectId: string, projectName: string): Promise<boolean> {
  const res = await getProjectFolderHandle(projectId, projectName);
  if (!res.ok) return false;
  return (await readTextFile(res.dir, FILE_NAME)) !== null;
}

/** Nhập Brand Kit TỪ `brand-kit.json` trong thư mục dự án — tái dùng nguyên `importBrandKitsJson()`
 * (0b/`7.1.25`), không viết logic merge/parse lần 2. */
export async function importBrandKitFromProjectFolder(
  projectId: string,
  projectName: string,
  mode: 'merge' | 'overwrite',
): Promise<{ ok: true; addedCount: number; totalCount: number } | { ok: false; error: string }> {
  const res = await getProjectFolderHandle(projectId, projectName);
  if (!res.ok) {
    const error =
      res.reason === 'no-root'
        ? 'Chưa chọn thư mục gốc InteriorFlow (xem Cài đặt → Lưu trữ).'
        : res.reason === 'no-permission'
          ? 'Mất quyền truy cập thư mục gốc — vào Cài đặt → Lưu trữ, bấm "Kiểm tra kết nối thư mục" để cấp lại.'
          : 'Không mở được thư mục dự án.';
    return { ok: false, error };
  }
  const json = await readTextFile(res.dir, FILE_NAME);
  if (json === null) return { ok: false, error: 'Thư mục dự án chưa có brand-kit.json.' };
  return importBrandKitsJson(json, mode);
}
