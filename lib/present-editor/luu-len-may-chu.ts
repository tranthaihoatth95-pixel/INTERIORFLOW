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
  /**
   * ⛔ CHẶN GHI ĐÈ BẰNG BẢN RỖNG — lỗi THẬT đã tự gây ra rồi bắt được 21/08: nhịp sao lưu định
   * kỳ chạy NGAY SAU khi IndexedDB bị xoá, lúc deck trong bộ nhớ còn rỗng ⇒ ghi đè bản tốt
   * 55.500 byte bằng bản 415 byte. Sao lưu mà giết mất bản sao thì tệ hơn không sao lưu.
   * Tờ không có slide nào = KHÔNG phải trạng thái đáng lưu.
   */
  const tongSlide = sheets.reduce((n, s) => n + ((s.deck?.slides?.length as number) ?? 0), 0);
  if (tongSlide === 0) return { ok: false, loi: 'deck rỗng — không ghi đè bản sao đang có' };
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
    // Trường thời gian THẬT của API là `uploadedAt` (đo tại nguồn: id·projectId·name·mime·path·
    // contentHash·uploadedBy·uploadedAt). Dùng `updatedAt` như bản đầu là luôn ra 0 ⇒ thứ tự tuỳ ý.
    const files: { id: string; name: string; uploadedAt?: string }[] = ds?.files ?? [];
    const ungVien = files
      .filter((f) => f.name === TEN_TEP_SAO_LUU)
      .sort((a, b) => new Date(b.uploadedAt ?? 0).getTime() - new Date(a.uploadedAt ?? 0).getTime());
    /**
     * Duyệt từ MỚI NHẤT xuống, lấy bản ĐẦU TIÊN CÓ SLIDE. Không lấy cứng bản mới nhất: nếu một
     * bản rỗng từng lọt lên trên (đã xảy ra), lấy cứng là khôi phục ra deck trắng — tức mất bài
     * lần thứ hai, ngay bằng chính cơ chế sinh ra để chống mất bài.
     * Mỗi lần ghi tạo BẢN GHI MỚI (không ghi đè hàng cũ) nên lịch sử còn nguyên để lùi về.
     */
    for (const f of ungVien.slice(0, 8)) {
      // Đường đọc nội dung là `/file`; `/api/project-files/<id>` trần trả 405 (đo thật).
      const json = await fetch(`/api/project-files/${f.id}/file`).then((r) => (r.ok ? r.text() : ''));
      if (!json) continue;
      const sheets = importIdfp(json)?.sheets;
      const co = sheets?.some((s) => ((s.deck?.slides?.length as number) ?? 0) > 0);
      if (sheets && co) return sheets;
    }
    return null;
  } catch {
    return null;
  }
}
