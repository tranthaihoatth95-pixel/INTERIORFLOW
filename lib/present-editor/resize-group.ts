/**
 * lib/present-editor/resize-group.ts — toán SCALE CẢ NHÓM khi kéo GÓC của khung bao quanh
 * nhiều phần tử đang chọn (E1 bổ sung, chốt 02/08 — docs/CHOT-NGUYEN-LIEU-EDITOR-2026-08-01.md):
 * kéo góc → CẢ CỤM co giãn THEO TỈ LỆ (KHÔNG phải "khung đổi, con giữ nguyên") — mọi phần tử
 * con giữ NGUYÊN vị trí tương đối bên trong khung bao (offset tới mép trái/trên khung bao nhân
 * theo hệ số scale) + kích thước riêng cũng nhân CÙNG hệ số đó. TextElement.fontSize (đơn vị %
 * chiều cao sân khấu, xem model.ts) cũng nhân theo `scale` — chữ to/nhỏ theo đúng tỉ lệ cụm,
 * chuẩn Figma/Canva multi-select resize (khác hẳn resize 1 phần tử tự do biến dạng, xem
 * `resize-corner.ts`: ở đó Shift mới giữ tỉ lệ, còn nhóm thì LUÔN giữ tỉ lệ, không có lựa chọn
 * tự do — kéo góc nhóm mà biến dạng méo bố cục là lỗi, không phải tính năng).
 *
 * Tách THUẦN (không đụng DOM/canvas) khỏi component để test bằng sucrase-node, cùng chỗ đứng
 * với `resize-corner.ts`.
 */

export interface GroupFrame {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Khung bao (bounding box) NHỎ NHẤT chứa hết các frame — hợp toạ độ % sân khấu. */
export function groupBoundingBox(frames: GroupFrame[]): GroupFrame {
  if (frames.length === 0) return { x: 0, y: 0, w: 0, h: 0 };
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const f of frames) {
    minX = Math.min(minX, f.x);
    minY = Math.min(minY, f.y);
    maxX = Math.max(maxX, f.x + f.w);
    maxY = Math.max(maxY, f.y + f.h);
  }
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

/**
 * Khung bao MỚI khi kéo GÓC `handle` của cả cụm — LUÔN giữ tỉ lệ (delta CHỈ lấy theo trục
 * ngang `dxPct`, chiều cao suy theo cùng hệ số — giống cách `resize-corner.ts#resizeCornerKeepRatio`
 * suy `h` từ `w`, nhưng ở đây hệ số `scale` còn dùng lại để áp cho TỪNG phần tử con). Góc đối
 * diện `handle` đứng yên (neo), khớp quy ước resize 1 phần tử — kéo nw thì góc se của cụm không
 * xê dịch, v.v. `newW` chặn dưới 3 (đơn vị %, tránh cụm co về 0/âm).
 */
export function scaleGroupByCorner(
  bbox: GroupFrame,
  handle: 'nw' | 'ne' | 'sw' | 'se',
  dxPct: number,
): { bbox: GroupFrame; scale: number } {
  const signW = handle.includes('w') ? -1 : 1;
  const newW = Math.max(3, bbox.w + dxPct * signW);
  const scale = bbox.w > 0 ? newW / bbox.w : 1;
  const newH = Math.max(3, bbox.h * scale);
  const x = handle.includes('w') ? bbox.x + (bbox.w - newW) : bbox.x;
  const y = handle.includes('n') ? bbox.y + (bbox.h - newH) : bbox.y;
  return { bbox: { x, y, w: newW, h: newH }, scale };
}

/**
 * Frame MỚI của 1 phần tử con khi cụm scale từ `oldBbox` → `newBbox` theo hệ số `scale` — giữ
 * NGUYÊN vị trí tương đối bên trong khung bao (khoảng cách tới mép trái/trên `oldBbox` nhân
 * `scale` rồi cộng vào mép `newBbox`) + kích thước riêng nhân `scale`. Truyền `fontSize` gốc
 * (TextElement) → trả `fontSize` mới nhân cùng `scale`; bỏ trống (shape/image) → trả
 * `fontSize: undefined`, gọi nơi dùng tự bỏ qua.
 */
export function scaleMemberFrame(
  frame: GroupFrame,
  oldBbox: GroupFrame,
  newBbox: GroupFrame,
  scale: number,
  fontSize?: number,
): { frame: GroupFrame; fontSize?: number } {
  const relX = frame.x - oldBbox.x;
  const relY = frame.y - oldBbox.y;
  return {
    frame: {
      x: newBbox.x + relX * scale,
      y: newBbox.y + relY * scale,
      w: Math.max(3, frame.w * scale),
      h: Math.max(3, frame.h * scale),
    },
    fontSize: fontSize !== undefined ? Math.max(1, fontSize * scale) : undefined,
  };
}
