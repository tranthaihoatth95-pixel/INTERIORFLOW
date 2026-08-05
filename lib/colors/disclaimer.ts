/**
 * lib/colors/disclaimer.ts — VIỆC 4: câu cảnh báo độ chính xác màu.
 *
 * ⛔ VĂN BẢN LÀ HỢP ĐỒNG, KHÔNG PHẢI CHỖ VIẾT LẠI CHO GỌN.
 *   - Bản tiếng Việt chép NGUYÊN VĂN từ NC-16 §9 (mẫu Hoà dán 05/08). Không rút gọn, không đảo
 *     câu, không "làm cho thân thiện hơn". Nó vừa là cảnh báo kỹ thuật (màn hình ≠ sơn thật) vừa
 *     là câu phủ nhận liên kết thương hiệu — bỏ vế sau là mất phần bảo vệ pháp lý.
 *   - **KHÔNG CHO TẮT.** Không prop `dismissible`, không lưu "đã đọc", không thu vào tooltip.
 *     Đặt cạnh MỌI nút chỉ định / xuất / đặt hàng. Chỗ nào bấm xong là ra tiền thật thì chỗ đó
 *     phải có câu này đang hiện trên màn.
 *   - Bản EN là bản SONG SONG (cùng nội dung), không phải bản tóm tắt.
 *
 * Để ở `lib/` chứ không nhét thẳng vào component: cùng một chuỗi còn phải đi vào PDF/BOQ/tệp xuất
 * sau này — một nguồn chữ, nhiều mặt tiền.
 */

export interface BilingualText {
  vi: string;
  en: string;
}

/** Câu đầy đủ — mặc định dùng bản này. */
export const COLOR_ACCURACY_NOTICE: BilingualText = {
  vi:
    'Màu trên màn hình chỉ là xấp xỉ. Một mã hex không thể diễn tả sơn thật — kết quả phụ thuộc ' +
    'ánh sáng, độ bóng, bề mặt và màn hình. Hai màu khớp trên máy vẫn có thể lệch trên tường. ' +
    'Luôn đối chiếu bảng màu thật hoặc mẫu sơn thử trước khi đặt hàng. Chúng tôi không liên kết ' +
    'với bất kỳ hãng sơn nào; tên và mã màu thuộc về chủ sở hữu tương ứng.',
  en:
    'On-screen colour is an approximation only. A hex value cannot describe real paint — what you ' +
    'get depends on lighting, sheen, surface and display. Two colours that match on screen can ' +
    'still differ on the wall. Always check a physical fan deck or a test patch before ordering. ' +
    'We are not affiliated with any paint manufacturer; colour names and codes belong to their ' +
    'respective owners.',
};

/**
 * Bản MỘT DÒNG cho chỗ hẹp (chú thích dưới bảng kết quả). Dùng KÈM bản đầy đủ ở đâu đó trên cùng
 * màn — KHÔNG được dùng thay thế ở màn có nút đặt hàng/xuất hồ sơ.
 */
export const COLOR_ACCURACY_NOTICE_SHORT: BilingualText = {
  vi: 'Màu trên màn hình chỉ là xấp xỉ — luôn đối chiếu mẫu sơn thật trước khi đặt hàng.',
  en: 'On-screen colour is an approximation — always check a physical sample before ordering.',
};

/** Câu hiện khi không có màu nào đủ gần (ΔE00 > ngưỡng) — xem `DEFAULT_MAX_DELTA_E`. */
export const NO_CLOSE_MATCH_NOTICE: BilingualText = {
  vi: 'Không có màu nào đủ gần trong thư viện này.',
  en: 'No colour in this library is close enough.',
};
