/**
 * lib/ui/nhip.ts — NHỊP CHUYỂN ĐỘNG + PHÉP MỌC-TỪ-NGUỒN. Đây là NƠI DUY NHẤT khai nhịp
 * cho lớp bề mặt nổi; mọi nơi dùng ĐỌC từ đây, cấm gõ số ms tại chỗ.
 *
 * ⭐ LUẬT MỌC TỪ NGUỒN (source-origin), Hoà chốt: bề mặt nổi phải NỞ RA TỪ CHÍNH VẬT ĐÃ GỌI NÓ
 * và ĐÓNG THÌ THU NGƯỢC VỀ ĐÚNG CHỖ ĐÓ. Giữ trí nhớ không gian — người dùng thấy "nó nở ra"
 * chứ không phải "một hộp lạ hiện lên rồi cái cũ biến mất".
 * ⛔ CẤM: hộp thoại mọc từ hư không · panel trượt từ mép chẳng liên quan · cắt phựt giữa hai
 * hình chữ nhật xa lạ · nảy tưng cho vui.
 *
 * [Đ2] EXTEND không NEW: `--ease-apple` + `--dur-fast/--dur-base` đã có sẵn trong
 * app/globals.css:97-99 — file này KHÔNG đẻ đường cong thứ hai, chỉ khai thang thời lượng
 * theo VAI TRÒ (bấm · viên · bảng · ngữ cảnh · biến hình) mà token cũ chưa phủ.
 */

/** Đường cong duy nhất của app — bí danh của `--ease-apple` (globals.css:97). */
export const DUONG_CONG = 'cubic-bezier(0.32, 0.72, 0, 1)';

/**
 * THANG NHỊP theo VAI TRÒ, không theo cỡ hình. Số ms là hợp đồng, đổi ở đây là đổi toàn app.
 * - `bam`    100-160ms · phản hồi bấm/rê — phải cảm thấy tức thì
 * - `vien`   140-200ms · viên ngữ cảnh hiện ra cạnh vật
 * - `bang`   180-260ms · bảng nở từ viên
 * - `nguCanh` 240-380ms · chuyển ngữ cảnh sâu (bảng → bảng sâu)
 * - `bienHinh` 300-700ms · biến hình lớn, CHỈ khi đáng (đổi hẳn bố cục)
 */
export const NHIP = {
  bam: 130,
  vien: 170,
  bang: 220,
  nguCanh: 300,
  bienHinh: 460,
} as const;

export type BacNhip = keyof typeof NHIP;

/** Bốn nấc của họ bề mặt nổi. Mỗi nấc là MỘT CÔNG NĂNG, không phải một cỡ. */
export const BAC_BE_MAT = ['nguon', 'vien', 'bang', 'bangSau'] as const;
export type BacBeMat = (typeof BAC_BE_MAT)[number];

/** Nhịp tương ứng khi ĐI TỚI một nấc (mở). */
export const nhipToiBac = (bac: BacBeMat): number =>
  bac === 'nguon' ? NHIP.bam : bac === 'vien' ? NHIP.vien : bac === 'bang' ? NHIP.bang : NHIP.nguCanh;

/**
 * Đóng luôn NHANH HƠN mở (~0.8) — vào chậm ra nhanh, luật hover/focus đã chốt 02/08.
 * Người dùng đã quyết định xong thì đừng bắt họ chờ xem hiệu ứng.
 */
export const nhipDong = (bac: BacBeMat): number => Math.round(nhipToiBac(bac) * 0.8);

/** Hộp chữ nhật theo VIEWPORT (đúng đơn vị `getBoundingClientRect`). */
export interface HopNguon {
  x: number;
  y: number;
  rong: number;
  cao: number;
}

/**
 * PHÉP MỌC TỪ NGUỒN — trả về `transform-origin` (theo % của chính bề mặt) để bề mặt nở ra
 * từ tâm của VẬT ĐÃ GỌI nó. Đóng thì dùng lại đúng gốc này ⇒ thu về đúng chỗ cũ.
 *
 * Vì sao tính bằng %, không dùng px: `transform-origin` px đo từ mép trái-trên của CHÍNH bề mặt;
 * bề mặt đổi cỡ (ba nấc) là gốc trôi. Tính ra % thì gốc bám theo tỉ lệ, ba nấc dùng chung một
 * công thức. Kẹp trong [-40, 140] để nguồn nằm xa ngoài màn không quăng bề mặt bay đi.
 */
export const gocMocTuNguon = (
  nguon: HopNguon,
  beMat: HopNguon,
): { originX: number; originY: number } => {
  const tamNguonX = nguon.x + nguon.rong / 2;
  const tamNguonY = nguon.y + nguon.cao / 2;
  const kep = (v: number) => Math.min(140, Math.max(-40, v));
  // Bề mặt chưa đo được (cỡ 0) ⇒ lấy tâm, không chia cho 0.
  if (beMat.rong <= 0 || beMat.cao <= 0) return { originX: 50, originY: 50 };
  return {
    originX: kep(((tamNguonX - beMat.x) / beMat.rong) * 100),
    originY: kep(((tamNguonY - beMat.y) / beMat.cao) * 100),
  };
};

/**
 * Tỉ lệ lúc ĐÓNG (bề mặt co về phía nguồn). KHÔNG co về 0 — co hết cỡ đọc ra là "biến mất",
 * mất luôn cảm giác thu-về-nguồn. Nấc càng lớn co càng sâu vì quãng đường về nguồn dài hơn.
 */
export const tiLeDong = (bac: BacBeMat): number =>
  bac === 'bangSau' ? 0.9 : bac === 'bang' ? 0.93 : 0.96;

/** Có đang bật "giảm chuyển động" không. `prefers-reduced-motion` THẮNG TUYỆT ĐỐI. */
export const giamChuyenDong = (): boolean =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Thời lượng thực tế đem dùng. Giảm-chuyển-động ⇒ 0ms (hiện thẳng, KHÔNG phải "chậm lại").
 * Đây là chỗ duy nhất quyết định, nơi gọi không được tự kiểm rồi tự chế nhánh riêng.
 */
export const thoiLuong = (ms: number, giam = giamChuyenDong()): number => (giam ? 0 : ms);
