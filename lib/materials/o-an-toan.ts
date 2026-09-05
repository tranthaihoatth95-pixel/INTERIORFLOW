/**
 * lib/materials/o-an-toan.ts — MỘT Ô XEM TRƯỚC HỎNG CHỈ ĐƯỢC LÀM HỎNG CHÍNH NÓ.
 *
 * ⛔ CA THẬT ĐÃ BẮT ĐƯỢC (V1–V4, 05/09): tắt WebGL ⇒ một lượt render ngã ⇒ **unhandled
 * rejection** ⇒ ở Next dev/Electron thứ đó nổ ra lỗi toàn trang ⇒ **MỘT ô hỏng làm TRẮNG CẢ kho
 * vật liệu**. Van chi phí (`hang-doi-xem-truoc.ts`) đã vá đường của nó bằng `.catch`, nhưng
 * `MaterialSphere` còn **nhánh mặc định** đi thẳng qua `requestAnimationFrame` — bảy nơi gọi cũ
 * (kệ Thư viện · widget Home · panel 3D · ô chỉnh PBR…) vẫn đi đường đó và **vẫn hở**.
 * ⇒ Tệp này là chỗ DUY NHẤT bọc lượt vẽ, để cả hai nhánh cùng đi qua một cái van.
 *
 * ⭐ HAI VIỆC, KHÔNG HƠN — và việc thứ hai mới là việc khó:
 *  ① **KHÔNG BAO GIỜ NÉM RA NGOÀI.** `veOAnToan` luôn `resolve`. Đây là phần chống sập.
 *  ② **KHÔNG BAO GIỜ IM LẶNG.** Ngã thì phải trả về một CÂU tiếng người. Nuốt lỗi rồi để ô đứng
 *     trơ là đúng thứ đã ngốn "cả buổi đi tìm vì sao ô trống" (chú thích `material-preview.ts`),
 *     và nó vi phạm luật *"nút mờ phải kèm lý do"* ở mức tệ hơn: ô này còn không mờ, nó chỉ sai.
 *
 * 🔴 PHÂN BIỆT HAI NGÃ KHÁC HẲN NHAU — gộp chúng là nói dối một trong hai:
 *   · **`null`** từ máy render = WebGL không dựng được (máy tắt WebGL · hết context · SSR).
 *     Dữ liệu vật liệu LÀNH; chỉ mất mặt quả cầu.
 *   · **`throw`** = tham số hỏng/tải map thất bại. Đây là chuyện của MÓN NÀY, không phải của máy.
 *
 * THUẦN — không DOM, không WebGL, không React. Test bằng sucrase-node.
 */

/** Kết quả một lượt vẽ ô. `url === null` ⇒ `lyDo` luôn có câu, không bao giờ `null`. */
export type KetQuaO =
  | { url: string; lyDo: null }
  | { url: null; lyDo: string };

/** Câu cho ca WebGL không dựng được — dùng chung để mọi ô nói cùng một lời. */
export const LY_DO_KHONG_WEBGL = 'máy này chưa dựng được ảnh 3D (WebGL)';

/**
 * Bọc MỘT lượt vẽ ô. Không bao giờ ném; không bao giờ trả về ngã-mà-không-có-lý-do.
 * `ve` trả `null` là hợp lệ (máy render khai thẳng "không có WebGL"), không phải lỗi lập trình.
 */
export async function veOAnToan(ve: () => Promise<string | null>): Promise<KetQuaO> {
  try {
    const url = await ve();
    if (typeof url === 'string' && url.length > 0) return { url, lyDo: null };
    return { url: null, lyDo: LY_DO_KHONG_WEBGL };
  } catch (e) {
    /* Lấy `message` chứ không `String(e)`: `String(Error)` ra "Error: …" — hai chữ thừa đứng
       đầu một câu người dùng đọc. Không có message thì vẫn phải có CÂU, không được rỗng. */
    const chi = e instanceof Error && e.message ? e.message : String(e ?? '');
    return { url: null, lyDo: chi ? `không vẽ được mẫu vật: ${chi}` : 'không vẽ được mẫu vật' };
  }
}

/** Ô còn lại gì sau khi lượt vẽ ngã. Quyết định NÓI TO tới đâu — thuần, để nơi gọi khỏi tự nghĩ. */
export type NangLoiO = 'khong' | 'nhe' | 'nang';

export interface LoiO {
  nang: NangLoiO;
  /** câu hiện cho người dùng; `null` khi không có chuyện gì. */
  cau: string | null;
}

/**
 * ⭐ VÌ SAO KHÔNG PHẢI CỨ NGÃ LÀ BÁO ĐỘNG: ô vẫn còn **vân procedural** thì người dùng vẫn đang
 * nhìn một mẫu vật THẬT — thứ mất đi là mặt bóng của quả cầu, không phải cả ô. Kêu to như nhau
 * cho hai ca khác hẳn nhau là cách nhanh nhất để người ta học cách bỏ qua cảnh báo.
 *  · `nhe`  — còn vân: nói ở chỗ người dùng ĐANG SOI (panel), không dán cờ đỏ lên bảng.
 *  · `nang` — trống trơn, chỉ còn màu phẳng: ô này KHÔNG còn là mẫu vật, phải nói tại chỗ.
 */
export function loiOMau(coVan: boolean, lyDo: string | null): LoiO {
  if (!lyDo) return { nang: 'khong', cau: null };
  if (coVan) return { nang: 'nhe', cau: `${lyDo} — đang hiện vân 2D thật của mã này` };
  /* Câu phải ĐÚNG cho CẢ HAI ngã dẫn tới đây — mã chưa có ký hiệu 2D, và ký hiệu có nhưng máy
     không dựng nổi tấm vân. Nói "mã này chưa có vân 2D" là đoán một trong hai. */
  return { nang: 'nang', cau: `${lyDo}, và cũng chưa dựng được vân 2D — ô này chỉ còn màu phẳng` };
}
