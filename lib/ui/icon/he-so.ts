/**
 * lib/ui/icon/he-so.ts — HỆ SỐ HÌNH HỌC của bộ ký hiệu IF. Thuần số, không React, không DOM
 * (chạy được trong test `sucrase-node` như `lib/ui/design-tokens.ts`).
 *
 * VÌ SAO TỒN TẠI — gốc bệnh đo được ngày 05/09, KHÔNG phải chuyện gu:
 *   · 1.188 lượt vẽ ký hiệu trong `components/`, trải trên **35 cỡ khác nhau** (1…520).
 *   · **92%** số lượt render ở cỡ **≤16px**, trên một bộ vẽ cho lưới **24px**.
 *   · **91%** số lượt KHÔNG khai `strokeWidth`, tức giữ nguyên nét 2 trong lưới 24
 *     ⇒ nét hiệu dụng: 12px→1,00 · 13px→1,08 · 14px→1,17 · 15px→1,25 · 16px→1,33.
 *     Năm cỡ đó chiếm 85% số lượt và cho **năm bề dày nét khác nhau, không cỡ nào tròn pixel**.
 * ⇒ Cùng một màn có tới năm "độ đậm" ký hiệu chen nhau, không cái nào ăn lưới điểm ảnh.
 *   Đó là thứ mắt đọc ra là "xấu" mà không chỉ được tên. Cách chữa của cả ngành là
 *   **cỡ quang học** (optical size): nét khai theo ĐƠN VỊ LƯỚI, không theo pixel.
 *
 * LUẬT NỀN: nét = 1 đơn vị trên lưới 16 (6,25% bề ngang). SVG co giãn thì nét co theo
 * ⇒ 16px→1,00 · 20px→1,25 · 24px→1,50. **Tỉ lệ nét/lưới là HẰNG SỐ** — độ đậm không bao
 * giờ trôi nữa, dù đặt ở đâu.
 *
 * Ba nguồn của con số (đo tại nguồn, không chép từ sổ):
 *   ① 6,25% là tỉ lệ của Phosphor bản regular — đo từ `assets/regular/circle.svg`:
 *      lưới 256, vành ngoài r=104 / trong r=88 ⇒ nét 16/256 = 6,25%.
 *   ② Hình khoá cân diện tích — đo từ Material Symbols (lưới 960 = 24dp):
 *      tròn ⌀20dp · vuông 18 · dọc 16×20 · ngang 20×16 (xem README mục "Đo được gì").
 *   ③ Bo trong ký hiệu = ĐÚNG BỀ DÀY NÉT — luật chung của cả ba hệ đã tra
 *      (Material 2dp bo / 2dp nét · Carbon 2px / 2px · Lucide 2px / 2px).
 *
 * ⚠️ Thang bo NÀY KHÔNG PHẢI thang bo giao diện (`--r-1..4` = 6/10/14/20). Hai thang khác
 *    hệ quy chiếu: một cái bo VỎ ĐIỀU KHIỂN (đo bằng px màn hình), một cái bo NÉT VẼ BÊN
 *    TRONG ký hiệu (đo bằng đơn vị lưới 16). Trộn hai thang là lỗi hệ quy chiếu.
 */

/** Lưới gốc. Mọi ký hiệu vẽ trong `0 0 16 16`, KHÔNG bộ nào vẽ lưới khác. */
export const LUOI = 16;

/** Đệm mỗi phía. Vùng an toàn = LUOI − 2×DEM = 14. */
export const DEM = 1;

/** Vùng an toàn — nét KHÔNG được ra ngoài khoảng [DEM, LUOI−DEM]. */
export const VUNG_AN_TOAN = LUOI - 2 * DEM;

/**
 * BA BỀ DÀY NÉT — kế thừa NGUYÊN TỈ LỆ bảng nét bản vẽ của chính IF, không tự chế:
 *   `lib/three/section-entities.ts:61-63` — cắt 0,7 · thấy 0,35 · xa 0,18  ⇒ **4 : 2 : 1**
 *   (ba giá trị đều nằm trong `STANDARD_LINEWEIGHTS` của `lib/cad/model.ts:42`, tức thang
 *    ISO 128 mà IF đã dùng để in bản vẽ thật.)
 * Quy về đơn vị lưới 16: cắt 1,0 · thấy 0,5 · xa 0,25.
 *
 * ⛔ `XA` CỐ Ý KHÔNG DÙNG Ở LƯỚI 16: 0,25 đơn vị = 0,25px khi render 16px, dưới sàn hiển
 *    thị của mọi màn (kể cả 2× nó chỉ là 0,5 điểm ảnh vật lý) ⇒ vẽ ra là một vệt xám câm.
 *    Bỏ chi tiết khi cỡ nhỏ lại chính là điều cỡ quang học phải làm. Nấc này chỉ mở khi
 *    render từ 32px trở lên (0,25×2 = 0,5px). Khai ra ở đây để nấc thứ ba có TÊN và có
 *    ngưỡng, thay vì để phiên sau tự chế một con số thứ tư.
 */
export const NET = { cat: 1, thay: 0.5, xa: 0.25 } as const;

/** Cỡ nhỏ nhất mà nét `xa` mới được phép dùng (0,25 đơn vị × 32/16 = 0,5px). */
export const NGUONG_NET_XA = 32;

/**
 * BO GÓC BÊN TRONG KÝ HIỆU = ĐÚNG BỀ DÀY NÉT CHÍNH.
 * Không phải quy ước đẹp mắt: bo bằng nét thì khúc cua có bán kính đúng bằng nửa bề rộng
 * nét ở mặt trong ⇒ mặt trong khép lại thành điểm, không hở khe cũng không chồng mực.
 */
export const BO = NET.cat;

/** Đầu nét VUÔNG và góc nối NHỌN — ngôn ngữ nét bản vẽ kỹ thuật, không phải nét bo tròn
 *  của bộ ký hiệu web đa dụng. Đây là chỗ đổi MỘT tham số mà đổi cảm giác cả sản phẩm. */
export const DAU_NET = 'butt' as const;
export const GOC_NOI = 'miter' as const;

/**
 * THANG CỠ — bốn nấc, hết. Mỗi nấc một CÔNG NĂNG, không phải một cỡ to nhỏ:
 *   16 · dày đặc  — hàng danh sách, chip, ô nhập, ký hiệu cạnh chữ `--fs-ui`
 *   20 · thoáng   — nút thanh công cụ, mục thanh điều hướng nấc "điều hướng"
 *   24 · nổi bật  — nút hành động chính, tiêu đề khối
 *   32 · trưng    — màn trống, minh hoạ; nấc DUY NHẤT mở khoá nét `xa`
 * ⛔ Cấm cỡ ngoài thang. Ba mươi lăm cỡ hiện nay chính là bệnh — thêm một cỡ "cho vừa chỗ
 *    này" là tái phát.
 */
export const THANG_CO = [16, 20, 24, 32] as const;
export type CoIcon = (typeof THANG_CO)[number];

/**
 * BỐN HÌNH KHOÁ — cân DIỆN TÍCH QUANG HỌC, không cân bề ngang.
 * Vì sao cần: một hình vuông 14×14 và một hình tròn ⌀14 có cùng bề ngang nhưng hình tròn
 * mất 21% diện tích ⇒ đặt cạnh nhau thì hình tròn đọc ra là "nhỏ hơn". Hình khoá là cách
 * cả ngành trả lại phần diện tích đó.
 *
 * Số của IF (đơn vị lưới 16, tính theo MÉP NGOÀI của nét):
 *   tròn ⌀13,5 → 143,1 · vuông 12×12 → 144,0 · dọc 10×14 → 140,0 · ngang 14×10 → 140,0
 *   ⇒ chênh lệch lớn nhất **2,8%** (Material đo được là 3,2% — IF chặt hơn một chút).
 *
 * Kiểm chéo: nhân tỉ lệ của IF lên vùng an toàn 20 (tức lưới 24) ra
 *   tròn ⌀20 · vuông ~18 · dọc ~16×20 — **trùng khít hình khoá đo được từ Material Symbols**.
 *   Bộ số này không phải bịa cho vừa; nó tái lập được hệ đã có.
 */
export const HINH_KHOA = {
  tron: { d: 13.5 },
  vuong: { w: 12, h: 12 },
  doc: { w: 10, h: 14 },
  ngang: { w: 14, h: 10 },
} as const;

/** Diện tích quang học của một hình khoá — dùng cho test cân diện tích. */
export function dienTich(k: keyof typeof HINH_KHOA): number {
  if (k === 'tron') return (Math.PI * HINH_KHOA.tron.d ** 2) / 4;
  const h = HINH_KHOA[k];
  return h.w * h.h;
}

/** Chênh lệch diện tích lớn nhất giữa bốn hình khoá, theo phần trăm. */
export function lechDienTich(): number {
  const ds = (Object.keys(HINH_KHOA) as (keyof typeof HINH_KHOA)[]).map(dienTich);
  return ((Math.max(...ds) - Math.min(...ds)) / Math.min(...ds)) * 100;
}

/** Bề dày nét THẬT (px) khi một ký hiệu lưới 16 được render ở cỡ `co`. */
export function netThuc(co: number, net: number = NET.cat): number {
  return (net * co) / LUOI;
}
