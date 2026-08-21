/**
 * lib/present-editor/luu-len-may-chu.ts — SAO LƯU DECK LÊN MÁY CHỦ (21/08).
 *
 * VÌ SAO CÓ: 21/08 deck 24 trang MẤT trắng khi hồ sơ trình duyệt bị làm mới. Đo tại nguồn thì
 * hiểu vì sao — deck CHỈ sống ở IndexedDB (`lib/sheets-persist.ts`); toàn repo KHÔNG có model
 * Prisma nào cho deck, KHÔNG có route API nào cho deck. Mọi thứ người dùng dựng ở chặng Trình
 * bày đều là tài sản không có bản sao.
 *
 * ⛔ KHÔNG đẻ kho deck thứ hai. Hai mảnh cần thiết ĐÃ CÓ SẴN và đã có test:
 *   · `exportIdfp()`/`importIdfp()` — định dạng `.idfp` có version + bảng nâng cấp
 *     (`lib/present-editor/idfp.ts`, round-trip test ở `idfp.test.ts`);
 *   · `POST /api/project-files` — ghi tệp thuộc DỰ ÁN vào `./uploads` + bảng `ProjectFile`,
 *     có kiểm quyền `assertProjectAccess`.
 * File này chỉ NỐI hai mảnh đó lại. IndexedDB vẫn là bộ nhớ làm việc (nhanh, chịu được ảnh
 * dataURL hàng MB); máy chủ là BẢN SAO BỀN — sống qua đóng trình duyệt, đăng xuất, xoá `.next`,
 * dựng lại dev server.
 *
 * KHÔNG đụng schema: `ProjectFile` đã tồn tại và đang chạy. Đây là lý do chọn đường này thay vì
 * thêm bảng `Deck` — thêm bảng là phải migrate, mà migrate đang chờ tay Hoà.
 */
import { exportIdfp, importIdfp, type IdfpSheetData } from './idfp';
import type { BrandKit } from './brand-kit';

/** Tên tệp sao lưu trong dự án. CỐ ĐỊNH để mỗi lần lưu là GHI ĐÈ bản cũ, không rải hàng chục
 *  bản nháp vào Files — người dùng cần "bản mới nhất", không cần lịch sử ở đây (lịch sử là việc
 *  của `FlowVersion`). */
export const TEN_TEP_SAO_LUU = 'present-deck.idfp';

export interface KetQuaSaoLuu {
  ok: boolean;
  /** id ProjectFile vừa ghi — dùng để tải lại. */
  fileId?: string;
  loi?: string;
}

/**
 * Ghi bộ sheet hiện tại lên máy chủ dưới dạng `.idfp`. Im lặng trả `ok:false` khi lỗi —
 * sao lưu là LƯỚI ĐỠ, tuyệt đối không được làm gãy editor (cùng luật với `sheets-persist`).
 */
export async function saoLuuDeckLenMayChu(
  projectId: string,
  sheets: IdfpSheetData[],
  brandKit: BrandKit | null,
  projectName?: string,
): Promise<KetQuaSaoLuu> {
  if (!projectId || !sheets.length) return { ok: false, loi: 'thiếu dự án hoặc chưa có tờ nào' };
  try {
    const json = exportIdfp(sheets, brandKit, { projectName });
    // `dataUrl` là đường nhận tệp mà route đã có; mime do SERVER tự sniff (§6.2) nên nhãn ở đây
    // chỉ để đóng gói base64 đúng khuôn, không phải thứ quyết định kiểu tệp.
    const dataUrl = `data:application/json;base64,${btoa(unescape(encodeURIComponent(json)))}`;
    const r = await fetch('/api/project-files', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, name: TEN_TEP_SAO_LUU, dataUrl }),
    });
    if (!r.ok) return { ok: false, loi: `máy chủ trả ${r.status}` };
    const d = await r.json().catch(() => null);
    return { ok: true, fileId: d?.file?.id };
  } catch (e) {
    return { ok: false, loi: String(e).slice(0, 120) };
  }
}

/**
 * Tìm bản sao lưu mới nhất của dự án và trả về bộ sheet đã parse. `null` = chưa từng sao lưu,
 * hoặc tệp hỏng/quá mới — nơi gọi lùi về IndexedDB, KHÔNG dựng deck rỗng đè lên việc đang làm.
 */
export async function taiDeckTuMayChu(projectId: string): Promise<IdfpSheetData[] | null> {
  if (!projectId) return null;
  try {
    const ds = await fetch(`/api/project-files?projectId=${encodeURIComponent(projectId)}`)
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null);
    const files: { id: string; name: string; updatedAt?: string }[] = ds?.files ?? [];
    const hit = files
      .filter((f) => f.name === TEN_TEP_SAO_LUU)
      .sort((a, b) => new Date(b.updatedAt ?? 0).getTime() - new Date(a.updatedAt ?? 0).getTime())[0];
    if (!hit) return null;
    const json = await fetch(`/api/project-files/${hit.id}`).then((r) => (r.ok ? r.text() : ''));
    if (!json) return null;
    return importIdfp(json)?.sheets ?? null;
  } catch {
    return null;
  }
}
