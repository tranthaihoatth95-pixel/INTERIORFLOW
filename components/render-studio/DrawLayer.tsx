'use client';

/**
 * components/render-studio/DrawLayer.tsx — G2 phần (3) (`docs/SPEC-CHANG2-UI-2MODE.md` §3
 * "Tablet + bút ĐẦY ĐỦ"): vẽ toàn bộ `DrawStroke` đã lưu (flow-space) bằng SVG bọc
 * `ViewportPortal` — cùng khuôn `GroupOverlay.tsx` (KHÔNG tự tính transform tay, ăn theo pan/zoom
 * tự động vì sống trong hệ toạ độ flow của React Flow).
 *
 * 3 tool tạo nét khác biệt bằng độ trong suốt + blend mode (không phải màu khác nhau):
 *   - pen: đặc màu, opacity 1 — mực thật.
 *   - marker: opacity ~0.55, nét dày hơn — marker phớt.
 *   - highlight: opacity ~0.3, RẤT dày, `mixBlendMode:'multiply'` — hiệu ứng dạ quang kinh điển
 *     (chồng lên nội dung bên dưới thay vì che kín).
 *
 * `liveStroke` (đang vẽ dở, chưa thả chuột) truyền riêng từ `FlowCanvas.tsx` — render đè lên
 * cùng cách, không đợi tới lúc `addStroke()` mới thấy nét.
 */

import { ViewportPortal } from '@xyflow/react';
import { useFlowStore, type DrawStroke } from '@/lib/store';

function strokeStyle(tool: DrawStroke['tool']) {
  switch (tool) {
    case 'marker':
      return { opacity: 0.55, widthMul: 1.6 };
    case 'highlight':
      return { opacity: 0.3, widthMul: 4, mixBlendMode: 'multiply' as const };
    default:
      return { opacity: 1, widthMul: 1 };
  }
}

function StrokePolyline({ stroke }: { stroke: DrawStroke }) {
  if (stroke.points.length < 2) return null;
  const { opacity, widthMul, mixBlendMode } = strokeStyle(stroke.tool);
  const pts = stroke.points.map((p) => `${p.x},${p.y}`).join(' ');
  return (
    <polyline
      points={pts}
      fill="none"
      stroke={stroke.color}
      strokeWidth={stroke.width * widthMul}
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity={opacity}
      style={mixBlendMode ? { mixBlendMode } : undefined}
    />
  );
}

export function DrawLayer({ liveStroke }: { liveStroke: DrawStroke | null }) {
  const strokes = useFlowStore((s) => s.strokes);
  if (!strokes.length && !liveStroke) return null;
  return (
    <ViewportPortal>
      {/* overflow visible cỡ lớn — nét vẽ có thể vượt xa bbox node, không giới hạn viewBox cố định */}
      <svg
        style={{ position: 'absolute', overflow: 'visible', pointerEvents: 'none', left: 0, top: 0 }}
      >
        {strokes.map((s) => (
          <StrokePolyline key={s.id} stroke={s} />
        ))}
        {liveStroke && <StrokePolyline stroke={liveStroke} />}
      </svg>
    </ViewportPortal>
  );
}
