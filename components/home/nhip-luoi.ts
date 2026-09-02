/**
 * components/home/nhip-luoi.ts — NHỊP LƯỚI HOME: cạnh ô, số cột, khe. Lõi THUẦN, không React.
 *
 * ── VÌ SAO TÁCH RA KHỎI `BeMatHome.tsx` ──────────────────────────────────────────────────────
 * Luật này là số học, và số học thì phải có cổng chấm được. Để nó nằm trong `.tsx` thì cổng
 * không nhập được (`sucrase-node` không giải bí danh `@/`, mà `BeMatHome` thì đầy import UI),
 * và đường duy nhất còn lại là CHÉP công thức sang test — tức hai bản của một luật, bản trong
 * test xanh mãi kể cả khi bản thật đã đổi. Đúng thứ bàn 06 gọi là *cổng hoá mù khi vật bị dời
 * khỏi tầm đo*. Tách ra là để chỉ còn MỘT bản.
 *
 * ── LUẬT (chốt 14 Hoà: "widget y chang iPad" · phân giải cl:00 02/09) ────────────────────────
 * Springboard iPad phủ hết bề ngang mà widget vẫn đúng MỘT cỡ. Cách nó làm:
 *   **số cột** theo màn · **khe** giãn ra nuốt phần dư · **ô** KHÔNG đổi.
 * Ba đường sai đã bị loại tường minh, ghi lại để không ai đề xuất lại:
 *   · giữ 4 cột rồi bám trái  ⇒ 43% màn trống dồn một bên (đo trên ảnh 18:28, vùng 1276px)
 *   · thêm cột rỗng           ⇒ chỉ dời chỗ trống, không lấp gì (chỉ có 5 widget)
 *   · nới cỡ ô theo màn       ⇒ phạm thẳng H-4 — cỡ ô lại đi theo bề ngang cửa sổ, đúng thứ
 *                               chốt 14 vừa bỏ
 */

/* MỘT NGUỒN cho cạnh ô, HAI nơi tiêu thụ (chuỗi CSS + phép tính px). Trước đây cỡ ô chỉ tồn
 * tại dưới dạng chuỗi CSS, nên JS muốn biết ô rộng bao nhiêu thì phải viết lại công thức — hai
 * bản của cùng một con số, và chúng lệch nhau ở lần sửa thứ hai. */
export const O_MIN = 148;
export const O_VW = 11.5;
export const O_MAX = 188;

/** Chuỗi CSS của cạnh ô. Dựng từ ba hằng trên, không gõ tay lần thứ hai. */
export const O_DON_VI = `clamp(${O_MIN}px, ${O_VW}vw, ${O_MAX}px)`;

/** Cạnh ô THẬT (px) ở một bề ngang CỬA SỔ — gương của `clamp` trên, cùng ba hằng.
 *  ⚠️ Tham số là bề ngang CỬA SỔ, không phải bề ngang vùng nội dung: `vw` trong CSS đo cửa sổ.
 *  Truyền nhầm vùng vào đây là làm ô co theo cột trái — tức phạm H-4 mà không ai thấy. */
export function oPx(rongCuaSo: number): number {
  return Math.min(O_MAX, Math.max(O_MIN, (O_VW / 100) * rongCuaSo));
}

/** Khe tối thiểu — nhịp thở cơ bản giữa hai ô. */
export const GAP_O = 20;
/** Khe không được nới vô hạn: màn càng rộng thì THÊM CỘT, không giãn khe (cách iPad làm).
 *  Thiếu trần này thì trên màn 4K lưới hở toác và widget trôi thành các đảo rời. */
export const GAP_TOI_DA = 64;
/** Sàn cột — dưới ngưỡng này Home đã rơi về `stackedList`, nhưng giữ sàn để không bao giờ ra
 *  một lưới 2–3 cột trông như danh sách đội lốt springboard. */
export const COT_TOI_THIEU = 4;

/**
 * Số cột và khe, tính từ bề ngang THẬT của vùng nội dung.
 *
 *   cột = floor((rộng + khe_tối_thiểu) / (ô + khe_tối_thiểu))   — kẹp sàn `COT_TOI_THIEU`
 *   khe = (rộng − cột × ô) / (cột − 1)                          — kẹp [`GAP_O`, `GAP_TOI_DA`]
 *
 * Đo lại ba khổ thật: 1276 ⇒ 6 cột · khe 56,5 · 1033 ⇒ 6 cột · khe 29 · 915 ⇒ 5 cột · khe 43,8.
 */
export function nhipLuoi(rongVung: number, rongCuaSo: number): { cot: number; gap: number } {
  const o = oPx(rongCuaSo);
  const cot = Math.max(COT_TOI_THIEU, Math.floor((rongVung + GAP_O) / (o + GAP_O)));
  if (cot < 2) return { cot: 1, gap: GAP_O };
  const gap = (rongVung - cot * o) / (cot - 1);
  return { cot, gap: Math.min(GAP_TOI_DA, Math.max(GAP_O, gap)) };
}
