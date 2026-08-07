/**
 * lib/print/lineweight.ts — phần THUẦN của Bảng nét in (Màn 8, mock `docs/mocks/BangNetIn.dc.html`).
 * Tách khỏi `.tsx` để test chạy được bằng sucrase-node (xem lý do đủ ở `lib/print/radial.ts`).
 */

/**
 * Chiều cao (px) của vạch minh hoạ độ đậm — 3 bậc theo mm, khớp đúng mock:
 * 0.50 → 3px · 0.35 và 0.25 → 2px · 0.18 / 0.13 / 0.09 → 1px.
 *
 * Đây là VẠCH MINH HOẠ trên màn hình, KHÔNG phải bề dày in thật (bề dày in là mm trên giấy, do
 * `lib/cad/pdf.ts` xử lý cùng sàn `MIN_PRINTABLE_LINE_MM`). Hai thứ khác nhau, đừng gộp.
 */
export function lineweightBarHeightPx(mm: number): number {
  if (mm >= 0.5) return 3;
  if (mm >= 0.25) return 2;
  return 1;
}
