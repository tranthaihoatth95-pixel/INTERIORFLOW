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
