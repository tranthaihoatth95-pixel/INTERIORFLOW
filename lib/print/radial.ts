/**
 * lib/print/radial.ts — phần THUẦN của Bảng tròn chọn bút (Màn 9, mock `docs/mocks/BangTron.dc.html`).
 *
 * Tách khỏi `components/print/RadialToolMenu.tsx` để test được: file `.tsx` kéo theo React/DOM,
 * còn `npm test` chạy từng `*.test.ts` bằng sucrase-node thuần. Cùng lối `lib/cad/dwg-map.ts` đã
 * tách khỏi `dwg.ts` vì lý do y hệt.
 */

/** đường kính đĩa (px) — mock `BangTron.dc.html` khai 236px cho cả khối. */
export const RADIAL_DISC_SIZE = 236;

/** bán kính đặt nút quanh tâm — mock đặt nút đỉnh ở `translate(0px,-82px)`. */
export const RADIAL_BTN_RADIUS = 82;

/**
 * Toạ độ (x,y) từng nút quanh tâm — góc cách đều, bắt đầu từ ĐỈNH (-90°), làm tròn tới số nguyên.
 * Với 6 nút phải ra ĐÚNG bộ số của mock: (0,-82) (71,-41) (71,41) (0,82) (-71,41) (-71,-41).
 */
export function radialPositions(count: number, radius: number): { x: number; y: number }[] {
  const out: { x: number; y: number }[] = [];
  for (let i = 0; i < count; i++) {
    const angleDeg = -90 + (360 / count) * i;
    const rad = (angleDeg * Math.PI) / 180;
    out.push({ x: Math.round(Math.cos(rad) * radius), y: Math.round(Math.sin(rad) * radius) });
  }
  return out;
}

/**
 * Kẹp TÂM đĩa vào trong khung nhìn: tâm phải cách mọi mép ít nhất nửa đường kính, nếu không thì
 * nửa bảng (kèm 2-3 nút) nằm ngoài màn hình, bấm không tới. Khung nhìn hẹp hơn cả đĩa ⇒ về giữa,
 * vì lúc đó không có vị trí nào thoả cả hai mép.
 */
export function clampToViewport(v: number, extent: number): number {
  const half = RADIAL_DISC_SIZE / 2;
  if (extent <= RADIAL_DISC_SIZE) return extent / 2;
  return Math.min(Math.max(v, half), extent - half);
}

/**
 * CSS animation mở đĩa — để Ở ĐÂY (không phải trong `.tsx`) để test khoá được hồi quy thật.
 *
 * ⚠️ BẪY ĐÃ SẬP MỘT LẦN (06/08): mốc keyframe CHỈ có `scale()` thì animation **thắng inline style**
 * trong cascade và **nuốt mất** `transform: translate(-50%,-50%)` mà component đặt để dịch tâm ⇒
 * suốt thời gian chạy, đĩa 236px nhảy lệch nửa thân (118px) xuống-phải rồi giật về chỗ.
 * ⇒ `translate(-50%,-50%)` PHẢI có mặt ở CẢ HAI mốc `from`/`to`. `radial.test.ts` chặn hồi quy này.
 */
export const RADIAL_MENU_KEYFRAMES = `
@keyframes bt-in {
  from { transform: translate(-50%, -50%) scale(0.86); opacity: 0; }
  to { transform: translate(-50%, -50%) scale(1); opacity: 1; }
}
`;
