/**
 * lib/ui/tooltip-position.ts — logic thuần tính lệch ngang (px) để tag của
 * <Tooltip> (components/ui/Tooltip.tsx) không tràn ra ngoài viewport.
 *
 * Tag mặc định canh giữa icon (translateX(-50%)); với icon sát mép trái/phải
 * toolbar, tag có thể lòi ra ngoài màn hình. Hàm này trả về độ lệch cần cộng
 * thêm vào transform để kéo tag về trong vùng an toàn (margin px mỗi bên).
 */
export function clampHorizontalOffset(
  centerX: number,
  halfWidth: number,
  viewportWidth: number,
  margin = 8,
): number {
  const left = centerX - halfWidth;
  const right = centerX + halfWidth;
  if (left < margin) return margin - left;
  if (right > viewportWidth - margin) return viewportWidth - margin - right;
  return 0;
}

/**
 * LỖI 4 (P8, 04/08) — tag `side='right'` (neo cạnh PHẢI nút, vd lưới nút nhỏ 3 cột trong
 * `Command3DPanel.tsx` — tag `top`/`bottom` canh GIỮA nút theo chiều ngang nên tràn sang đè
 * đúng nút bên cạnh trong lưới hẹp). Trả về CẠNH nào đủ chỗ hiện tag mà không vượt viewport —
 * ưu tiên phải, hết chỗ mới lật trái. `gap` = khoảng hở giữa nút và tag (khác `margin` — khoảng
 * hở an toàn với mép viewport).
 */
export function pickHorizontalSide(
  anchorLeft: number,
  anchorRight: number,
  tagWidth: number,
  viewportWidth: number,
  margin = 8,
  gap = 8,
): 'right' | 'left' {
  const roomRight = viewportWidth - margin - (anchorRight + gap);
  if (roomRight >= tagWidth) return 'right';
  return 'left';
}
