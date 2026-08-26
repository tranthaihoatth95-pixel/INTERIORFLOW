/**
 * lib/cad/luu-len-may-chu.ts — SAO LƯU BẢN VẼ 2D LÊN MÁY CHỦ (21/08).
 *
 * VÌ SAO CÓ: cùng gốc rủi ro vừa vá cho chặng Trình bày, nhưng NẶNG HƠN. Bản vẽ 2D là SỰ THẬT
 * NGHỀ NGHIỆP — mất deck thì dựng lại được, mất bản vẽ là mất công việc. Đo tại nguồn: `Doc` chỉ
 * sống ở IndexedDB (`lib/sheets-persist.ts`); đồng bộ đĩa CÓ (`resolveAndSyncCadDisk`) nhưng mặc
 * định TẮT vì đòi người dùng tự chọn thư mục gốc. Xoá dữ liệu duyệt web là mất trắng — đã chứng
 * minh thật khi xoá IndexedDB để thử khôi phục deck.
 *
 * ⛔ KHÔNG đẻ mô hình tài liệu CAD thứ hai, KHÔNG nhân bản sự thật hình học. Dùng ĐÚNG hai mảnh
 * đã có và đã có test: `exportIdf()`/`importIdf()` (định dạng `.idf` v2, có bảng nâng cấp) và
 * `POST /api/project-files`. Đây là HẠ TẦNG KHÔI PHỤC, không phải engine dựng hình.
 * Cùng khuôn `lib/present-editor/luu-len-may-chu.ts` — cố ý KHÔNG gộp code: chữ ký `exportIdf`
 * (không brandKit) khác `exportIdfp`, y như lý do `resolveAndSyncCadDisk` không dùng chung với
 * bản Present.
 */
import { exportIdf, importIdf, type IdfSheetData } from './idf';

/** Tên CỐ ĐỊNH → mỗi lần lưu là một BẢN GHI MỚI cùng tên (API không ghi đè hàng cũ), nên lịch sử
 *  còn nguyên để lùi về khi một bản hỏng/cụt. */
export const TEN_TEP_SAO_LUU_2D = 'ban-ve.idf';

export interface KetQuaSaoLuu2D {
  ok: boolean;
  fileId?: string;
  loi?: string;
}

/**
 * ⛔ CỔNG CHẶN GHI ĐÈ BẰNG TRẠNG THÁI HỎNG — bài học trả giá ở Present: nhịp sao lưu chạy ngay
 * sau khi kho cục bộ bị xoá, lúc bộ nhớ còn rỗng, và ghi đè bản tốt bằng bản rỗng.
 *
 * ⚠️ KHÔNG dùng "đếm entity = 0" làm cớ từ chối: bản vẽ TRỐNG CÓ CHỦ Ý là trạng thái hợp lệ
 * (vừa tạo tờ mới, hoặc vừa xoá hết để vẽ lại) — từ chối lưu nó là mất luôn thao tác xoá của
 * người dùng. Thứ phải phân biệt là **CHƯA HYDRATE / VỪA BỊ XOÁ SẠCH** với **TRỐNG CÓ CHỦ Ý**,
 * và dấu hiệu đó là DANH TÍNH TÀI LIỆU chứ không phải số lượng hình:
 *   · `daHydrate` — nơi gọi chỉ bật sau khi nạp xong kho cục bộ (cờ `hydrated` của CadSheets);
 *   · mỗi tờ phải có `id` + `name` thật và `doc` là object (serialize được).
 * Chưa hydrate thì bộ nhớ chưa phải trạng thái của người dùng — nó là số 0 của máy.
 */
export function duDieuKienSaoLuu(sheets: IdfSheetData[], daHydrate: boolean): { ok: boolean; lyDo?: string } {
  if (!daHydrate) return { ok: false, lyDo: 'chưa nạp xong kho cục bộ — số 0 của máy, không phải của người dùng' };
  if (!sheets.length) return { ok: false, lyDo: 'không có tờ nào' };
  const hong = sheets.find((s) => !s.id || !s.name || !s.doc || typeof s.doc !== 'object');
  if (hong) return { ok: false, lyDo: 'tờ thiếu danh tính (id/name/doc)' };
  return { ok: true };
}

/** Ghi bộ tờ 2D lên máy chủ dưới dạng `.idf`. Im lặng trả `ok:false` khi lỗi — sao lưu là lưới
 *  đỡ, không bao giờ được làm gãy trình vẽ. */
export async function saoLuuBanVeLenMayChu(
  projectId: string,
  sheets: IdfSheetData[],
  daHydrate: boolean,
  projectName?: string,
): Promise<KetQuaSaoLuu2D> {
  if (!projectId) return { ok: false, loi: 'thiếu dự án' };
  const cong = duDieuKienSaoLuu(sheets, daHydrate);
  if (!cong.ok) return { ok: false, loi: cong.lyDo };
  try {
    const json = exportIdf(sheets, { projectName });
    // Tự kiểm bằng CHÍNH bộ đọc: chuỗi không nhập lại được thì đừng đem nó đi ghi đè lịch sử.
    if (!importIdf(json)) return { ok: false, loi: 'chuỗi xuất ra không tự đọc lại được' };
    const dataUrl = `data:application/json;base64,${btoa(unescape(encodeURIComponent(json)))}`;
    const r = await fetch('/api/project-files', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, name: TEN_TEP_SAO_LUU_2D, dataUrl }),
    });
    if (!r.ok) return { ok: false, loi: `máy chủ trả ${r.status}` };
    const d = await r.json().catch(() => null);
    return { ok: true, fileId: d?.file?.id };
  } catch (e) {
    return { ok: false, loi: String(e).slice(0, 120) };
  }
}

/**
 * Tìm bản sao lưu DÙNG ĐƯỢC mới nhất. Duyệt từ mới xuống, lấy bản ĐẦU TIÊN đọc lại được —
 * không lấy cứng bản mới nhất: một bản cụt/hỏng lọt lên trên mà lấy cứng là khôi phục ra bản vẽ
 * trắng, tức mất bài lần hai bằng chính cơ chế sinh ra để chống mất bài.
 * `null` = chưa từng sao lưu hoặc không bản nào đọc được ⇒ nơi gọi giữ nguyên trạng thái hiện
 * tại, KHÔNG dựng tờ trắng đè lên việc đang làm.
 */
export async function taiBanVeTuMayChu(projectId: string): Promise<IdfSheetData[] | null> {
  if (!projectId) return null;
  try {
    const ds = await fetch(`/api/project-files?projectId=${encodeURIComponent(projectId)}`)
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null);
    // Trường thời gian THẬT của API là `uploadedAt` (không phải `updatedAt` — đã dính một lần).
    const files: { id: string; name: string; uploadedAt?: string }[] = ds?.files ?? [];
    const ungVien = files
      .filter((f) => f.name === TEN_TEP_SAO_LUU_2D)
      .sort((a, b) => new Date(b.uploadedAt ?? 0).getTime() - new Date(a.uploadedAt ?? 0).getTime());
    for (const f of ungVien.slice(0, 8)) {
      // Đường đọc nội dung là `/file`; `/api/project-files/<id>` trần trả 405.
      const json = await fetch(`/api/project-files/${f.id}/file`).then((r) => (r.ok ? r.text() : ''));
      if (!json) continue;
      const parsed = importIdf(json);
      if (parsed?.sheets?.length) return parsed.sheets;
    }
    return null;
  } catch {
    return null;
  }
}
