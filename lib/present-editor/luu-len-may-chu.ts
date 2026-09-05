/**
 * lib/present-editor/luu-len-may-chu.ts — SAO LƯU DECK LÊN MÁY CHỦ (21/08).
 *
 * VÌ SAO CÓ: 21/08 một deck 24 trang MẤT trắng khi hồ sơ trình duyệt bị làm mới. Đo tại nguồn thì hiểu
 * vì sao — deck CHỈ sống ở IndexedDB (`lib/sheets-persist.ts`); toàn repo KHÔNG có model Prisma
 * nào cho deck, KHÔNG có route API nào cho deck. Mọi thứ người dùng dựng ở chặng Trình bày đều
 * là tài sản không có bản sao.
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
 *
 * ⚠️ PHỤ THUỘC BẮT BUỘC: `lib/server/mime-sniff.ts` phải nhận kind `idfp`. Thiếu nó thì
 * `luuProjectFile()` trả **415** và cả file này là tính năng chết.
 */
import { exportIdfp, importIdfp, type IdfpSheetData } from './idfp';
import type { BrandKit } from './brand-kit';

/**
 * Tên bản sao lưu TRÊN MÁY CHỦ (`ProjectFile.name`).
 *
 * Hậu tố `.sao-luu.` là QUY ƯỚC CHUNG với `lib/cad/luu-len-may-chu.ts`: mọi tệp do nhịp sao lưu
 * nền đẻ ra đều mang hậu tố này. Hai lý do, cả hai đã đo:
 *   ① đường ĐĨA CỤC BỘ của chặng này ghi tên `trinh-bay.idfp` (`PresentSheets.tsx`) — khác tên
 *      sẵn, nhưng đặt cùng quy ước để người đọc danh sách Files phân biệt được ngay hàng nào là
 *      của máy, không phải tra từng chặng một;
 *   ② `taiDeckTuMayChu()` lọc theo TÊN. Sau khi mime-sniff mở cửa cho `.idfp`, người dùng tự tải
 *      được một tệp `.idfp` vào Files; trùng tên là bản khôi phục tự động nuốt nhầm tệp đó.
 * Mỗi lần ghi tạo BẢN GHI MỚI cùng tên (API không ghi đè hàng cũ) nên lịch sử còn nguyên để lùi
 * về — lịch sử "có tên" thì thuộc `FlowVersion`, đây chỉ là lưới đỡ.
 */
export const TEN_TEP_SAO_LUU = 'present-deck.sao-luu.idfp';

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
   * ⛔ CHẶN GHI ĐÈ BẰNG BẢN RỖNG — lỗi THẬT đã tự gây ra rồi bắt được 21/08: nhịp sao lưu định kỳ chạy
   * NGAY SAU khi IndexedDB bị xoá, lúc deck trong bộ nhớ còn rỗng ⇒ ghi đè bản tốt 55.500 byte
   * bằng bản 415 byte. Sao lưu mà giết mất bản sao thì tệ hơn không sao lưu.
   * Tờ không có slide nào = KHÔNG phải trạng thái đáng lưu.
   *
   * ⚠️ Cổng này THÔ HƠN cổng của chặng 2D (`duDieuKienSaoLuu` — phân biệt "chưa hydrate" với
   * "trống có chủ ý"): ở đây deck rỗng bị từ chối trong CẢ HAI ca, nên người dùng xoá sạch slide
   * thì thao tác xoá đó KHÔNG được đẩy lên máy chủ. Đánh đổi CÓ Ý: bản sao cũ ở lại là phiền,
   * bản sao bị bản rỗng đè là mất bài — và mất bài là sự cố đã xảy ra thật. Nơi gọi gate thêm
   * bằng cờ `hydrated` của `PresentSheets` nên ca "chưa hydrate" bị chặn ở hai lớp.
   */
  const tongSlide = sheets.reduce((n, s) => n + ((s.deck?.slides?.length as number) ?? 0), 0);
  if (tongSlide === 0) return { ok: false, loi: 'deck rỗng — không ghi đè bản sao đang có' };
  try {
    const json = exportIdfp(sheets, brandKit, { projectName });
    // Tự kiểm bằng CHÍNH bộ đọc trước khi gửi — cùng kỷ luật `writeIdfpToDisk` (ghi rồi đọc lại):
    // chuỗi không nhập lại được thì đừng đem nó đi làm bản sao.
    if (!importIdfp(json)) return { ok: false, loi: 'chuỗi xuất ra không tự đọc lại được' };
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
