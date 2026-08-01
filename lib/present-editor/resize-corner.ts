/**
 * lib/present-editor/resize-corner.ts — toán kéo GÓC (corner handle) giữ tỉ lệ, tách khỏi
 * Element.tsx (component DOM/pointer, không test trực tiếp bằng sucrase-node) để test được.
 *
 * P2 (01/08, `docs/NGHIEN-CUU-PRESENT-VS-DOI-THU-2026-08-01.md` §5): ẢNH đảo ngược quy tắc —
 * mặc định GIỮ TỈ LỆ ở góc, Shift để BẺ (text/shape giữ nguyên: Shift = giữ tỉ lệ). Lý do: méo
 * ảnh là lỗi im lặng, không ai thấy tới lúc in — mặc định an toàn phải là GIỮ.
 */

/** Chỉ cần x/y/w/h — `rotation` của `Frame` thật (model.ts) không liên quan phép tính này. */
export type ResizableFrame = { x: number; y: number; w: number; h: number };

/** true nếu góc kéo NÀY nên giữ tỉ lệ, theo loại element (`SlideElement.kind`) + Shift. */
export function shouldKeepRatio(elementKind: string, shiftKey: boolean): boolean {
  return elementKind === 'image' ? !shiftKey : shiftKey;
}

/**
 * Frame mới khi kéo góc GIỮ TỈ LỆ — lấy delta theo trục ngang (`dxPct`), suy chiều cao từ tỉ lệ
 * gốc. `handle` là 1 trong 'nw'/'ne'/'sw'/'se' (2 ký tự: hàng dọc n/s + hàng ngang w/e).
 */
export function resizeCornerKeepRatio(frame: ResizableFrame, handle: string, dxPct: number): ResizableFrame {
  const ratio = frame.w / Math.max(frame.h, 0.001);
  const signW = handle.includes('w') ? -1 : 1;
  const dw = dxPct * signW;
  const w = Math.max(3, frame.w + dw);
  const h = Math.max(3, w / ratio);
  const x = handle.includes('w') ? frame.x + (frame.w - w) : frame.x;
  const y = handle.includes('n') ? frame.y + (frame.h - h) : frame.y;
  return { x, y, w, h };
}
