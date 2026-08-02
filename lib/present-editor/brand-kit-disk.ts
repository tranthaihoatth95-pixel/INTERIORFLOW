'use client';

/**
 * lib/present-editor/brand-kit-disk.ts — B3 (31/07, ĐỢT B lớp lưu trữ, mã `4.1.c`): cầu nối
 * Brand Kit (`brand-kit.ts`, THUẦN + localStorage) sang thư mục dự án trên đĩa (`root-folder.ts`).
 *
 * `brand-kit.ts` CỐ Ý giữ nguyên — không nhét File System Access API vào đó (module đó đã tách
 * hàm THUẦN `buildBrandKitExport`/`parseBrandKitExport`/`mergeBrandKits` đúng để B3 TÁI DÙNG
 * nguyên, không viết lại parse/merge lần 2 — comment `BrandKitPanel.tsx` dòng ~154-157 đã ghi rõ
 * ý định này từ lúc làm `7.1.25`). File này CHỈ lo phần "đọc/ghi VÀO ĐÂU" (thư mục dự án), tái
 * dùng `getActiveBrandKit()`/`importBrandKitsJson()` cho phần NỘI DUNG.
 *
 * "Nối với đường Nhập .json đã có ở 0b" (yêu cầu B3) = `importBrandKitFromProjectFolder()` dưới
 * đây gọi THẲNG `importBrandKitsJson()` (qua `normalizeProjectBrandKitJson()`, VIỆC 5) — cùng
 * logic merge/overwrite/dedup-id với nút "Nhập .json…" thủ công, chỉ khác nguồn đọc JSON (tệp
 * trong thư mục dự án thay vì hộp thoại chọn tệp).
 *
 * SỬA SỰ CỐ 31/07 (mất-dữ-liệu-im-lặng): trước đây `writeBrandKitToProjectFolder` trả `boolean`
 * trơn — thất bại (kể cả mất quyền truy cập) chỉ là `false`, không lý do, caller ở `BrandKitPanel`
 * coi là "tiện nghi nền" rồi bỏ qua luôn, không báo gì cho người dùng. Giờ trả LÝ DO CỤ THỂ
 * (`FolderAccessFailure` từ `root-folder.ts`) — `BrandKitPanel` BẮT BUỘC hiện thông báo khác với
 * "đã lưu" khi ghi đĩa thất bại (xem `docs/QUYET-DINH-HA-TANG-2026-07-31.md` mục sự cố).
 */

import { importBrandKitsJson, getActiveBrandKit, type BrandKit, type BrandKitExport } from './brand-kit';
import { getProjectFolderHandle, writeTextFile, readTextFile, type FolderAccessFailure } from '../root-folder';

/*
 * VIỆC 5 (01/08, `docs/CHOT-BRAND-KIT-2026-08-01.md` ràng buộc ②) — đổi hình dạng tệp:
 * trước đây `brand-kit.json` là bản xuất TOÀN BỘ danh sách kit toàn cục (nguy hiểm — dự án nào
 * cũng ghi đè cùng 1 tệp mang cả thư viện). Từ giờ tệp CHỈ chứa kit ĐANG CHỌN của dự án đó (hình
 * dạng v2, `ProjectBrandKitFile`). Đọc vẫn phải nuốt được hình dạng CŨ (v1, mảng toàn cục) — dự
 * án nào đã có tệp cũ trên đĩa KHÔNG được mất kit khi nhập lại, xem `normalizeProjectBrandKitJson`
 * + `brand-kit-disk.test.ts`. KHÔNG áp `resolveSourceOfTruth()` ở việc này (ràng buộc ①) —
 * localStorage vẫn là nguồn, tệp đĩa chỉ là bản mang đi/nhập thủ công như trước.
 */

const FILE_NAME = 'brand-kit.json';

/** Hình dạng MỚI (v2) — chỉ 1 kit, của đúng dự án đang mở. */
export interface ProjectBrandKitFile {
  version: 2;
  exportedAt: number;
  kit: BrandKit;
}

export type WriteBrandKitResult = { ok: true } | { ok: false; reason: FolderAccessFailure | 'write-failed' | 'no-kit' };

/** Ghi CHỈ kit đang chọn (active) vào `brand-kit.json` trong thư mục dự án — KHÔNG còn dump cả
 * thư viện (ràng buộc ②). Trả lý do cụ thể khi thất bại, KHÔNG còn `boolean` mập mờ (caller PHẢI
 * phân biệt "chưa bật lưu trữ" — im lặng đúng, tính năng opt-in — với "đã bật nhưng ghi lỗi" —
 * BẮT BUỘC báo, đây là sự cố 31/07). Chưa có kit nào đang chọn (localStorage rỗng) → 'no-kit',
 * không ghi tệp rác xuống đĩa. Caller duy nhất (`BrandKitPanel.tsx` `onSave()`) luôn gọi
 * `saveBrandKit()` (đặt active) NGAY TRƯỚC khi gọi hàm này nên nhánh này gần như không rơi vào
 * trong thực tế — nhưng hàm vẫn tự bảo đảm, không giả định phía gọi luôn đúng thứ tự. */
export async function writeBrandKitToProjectFolder(projectId: string, projectName: string): Promise<WriteBrandKitResult> {
  const kit = getActiveBrandKit();
  if (!kit) return { ok: false, reason: 'no-kit' };
  const res = await getProjectFolderHandle(projectId, projectName, { create: true });
  if (!res.ok) return res;
  const payload: ProjectBrandKitFile = { version: 2, exportedAt: Date.now(), kit };
  const wrote = await writeTextFile(res.dir, FILE_NAME, JSON.stringify(payload, null, 2));
  return wrote ? { ok: true } : { ok: false, reason: 'write-failed' };
}

/** Nhận diện hình dạng tệp (THUẦN — test được bằng sucrase-node, không đụng File System Access
 * API/localStorage): v2 (1 kit) thì BỌC LẠI thành hình dạng v1 trong bộ nhớ rồi trả JSON đó; v1
 * (mảng cũ) hoặc bất kỳ gì khác thì trả NGUYÊN VĂN. Mục đích: KHÔNG viết lại logic gộp/khử trùng —
 * `importBrandKitsJson()`/`mergeBrandKits()` ở `brand-kit.ts` đã có sẵn và đã có test riêng, đi
 * qua đúng con đường đó là cách rẻ nhất để "không mất kit nào" (ràng buộc ②) mà không nhân đôi rủi
 * ro lỗi. JSON hỏng/thiếu field → trả nguyên văn để `parseBrandKitExport()` tự báo lỗi như cũ,
 * không nuốt lỗi thêm 1 lớp ở đây. */
export function normalizeProjectBrandKitJson(json: string): string {
  try {
    const parsed = JSON.parse(json) as { version?: unknown; kit?: unknown };
    if (parsed && parsed.version === 2 && parsed.kit && typeof parsed.kit === 'object') {
      const kit = parsed.kit as Partial<BrandKit>;
      const activeId = typeof kit.id === 'string' && kit.id.length > 0 ? kit.id : null;
      const wrapped: BrandKitExport = { version: 1, exportedAt: Date.now(), kits: [parsed.kit as BrandKit], activeId };
      return JSON.stringify(wrapped);
    }
  } catch {
    // JSON hỏng — để nguyên, importBrandKitsJson()/parseBrandKitExport() tự báo lỗi như cũ.
  }
  return json;
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
  return importBrandKitsJson(normalizeProjectBrandKitJson(json), mode);
}
