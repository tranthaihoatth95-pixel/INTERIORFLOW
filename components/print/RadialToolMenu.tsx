'use client';

/**
 * components/print/RadialToolMenu.tsx — Màn 9. Port nguyên văn `docs/mocks/BangTron.dc.html`.
 *
 * Bảng TRÒN chọn công cụ bút quanh 1 điểm (kiểu radial menu). Đĩa kính mờ 236px, tâm hiện tên công
 * cụ đang chọn, 6 nút xếp quanh theo đúng toạ độ mock — tính từ bán kính 82 + 6 góc cách đều 60°
 * bắt đầu từ đỉnh (-90°), KHÔNG hardcode 6 cặp số rời, nhưng kết quả làm tròn khớp nguyên văn mock:
 * (0,-82) (71,-41) (71,41) (0,82) (-71,41) (-71,-41).
 *
 * Portal ra `document.body` (luật K4: panel kính nổi không lồng trong chrome kính) — mở tại toạ độ
 * con trỏ qua props `x`/`y`. Đóng bằng Esc hoặc bấm ra ngoài (`useDismissable`, cùng cơ chế toàn app).
 */

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useDismissable } from '@/lib/useDismissable';
// Phần THUẦN (toạ độ · kẹp khung nhìn · keyframes) sống ở `lib/print/radial.ts` để test chạy được
// bằng sucrase-node — xem `lib/print/radial.test.ts`, có ca chặn hồi quy bug "keyframes nuốt translate".
import {
  radialPositions,
  clampToViewport,
  RADIAL_DISC_SIZE as DISC_SIZE,
  RADIAL_BTN_RADIUS as BTN_RADIUS,
  RADIAL_MENU_KEYFRAMES,
} from '@/lib/print/radial';

const FONT = "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, sans-serif";

export interface RadialTool {
  id: string;
  /** ký tự/glyph hiện làm icon — mock dùng glyph Unicode thuần, không phải bộ icon lucide. */
  icon: string;
  label: string;
}

/** 6 công cụ mặc định đúng mock, theo ĐÚNG thứ tự vị trí (Bút ở đỉnh, xuôi theo chiều kim đồng hồ). */
export const DEFAULT_RADIAL_TOOLS: RadialTool[] = [
  { id: 'pen', icon: '✎', label: 'Bút' },
  { id: 'shape', icon: '▱', label: 'Hình' },
  { id: 'eraser', icon: '⌫', label: 'Gôm' },
  { id: 'undo', icon: '↺', label: 'Hoàn tác' },
  { id: 'measure', icon: '⤢', label: 'Đo' },
  { id: 'text', icon: 'T', label: 'Chữ' },
];

export interface RadialToolMenuProps {
  /** toạ độ con trỏ (viewport, px) — tâm đĩa mở tại đây. */
  x: number;
  y: number;
  tools?: RadialTool[];
  selectedId?: string;
  onPick: (toolId: string) => void;
  onClose: () => void;
}

export default function RadialToolMenu({
  x,
  y,
  tools = DEFAULT_RADIAL_TOOLS,
  selectedId,
  onPick,
  onClose,
}: RadialToolMenuProps) {
  const [mounted, setMounted] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => setMounted(true), []);
  useDismissable({ open: true, onDismiss: onClose, refs: [rootRef] });

  if (!mounted) return null;

  const activeId = selectedId ?? tools[0]?.id;
  const activeTool = tools.find((t) => t.id === activeId) ?? tools[0];
  const positions = radialPositions(tools.length, BTN_RADIUS);

  return createPortal(
    <div
      ref={rootRef}
      className="if-bt-root"
      style={{
        position: 'fixed',
        // Kẹp tâm đĩa vào trong khung nhìn: bấm sát mép phải/dưới mà không kẹp thì nửa bảng
        // (và 2-3 nút) nằm ngoài màn hình, bấm không tới.
        left: clampToViewport(x, typeof window === 'undefined' ? DISC_SIZE : window.innerWidth),
        top: clampToViewport(y, typeof window === 'undefined' ? DISC_SIZE : window.innerHeight),
        width: DISC_SIZE,
        height: DISC_SIZE,
        transform: 'translate(-50%,-50%)',
        fontFamily: FONT,
        zIndex: 9999,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background: 'var(--nen-mo-card)',
          backdropFilter: 'saturate(180%) blur(22px)',
          WebkitBackdropFilter: 'saturate(180%) blur(22px)',
          border: '1px solid var(--nen-mo-hairline)',
          boxShadow: 'var(--shadow-pop)',
        }}
      />

      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: 58,
          height: 58,
          transform: 'translate(-50%,-50%)',
          borderRadius: '50%',
          border: '1px solid var(--nen-mo-hairline)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '.14em',
          textTransform: 'uppercase',
          color: 'var(--t3)',
          textAlign: 'center',
          lineHeight: 1.3,
        }}
      >
        {activeTool?.label}
      </div>

      {tools.map((tool, i) => {
        const pos = positions[i];
        const active = tool.id === activeId;
        return (
          <button
            key={tool.id}
            type="button"
            onClick={() => onPick(tool.id)}
            title={tool.label}
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: 'var(--tap-lg)',
              height: 'var(--tap-lg)',
              margin: 'calc(var(--tap-lg) / -2)',
              borderRadius: 14,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              transform: `translate(${pos.x}px,${pos.y}px)`,
              background: active ? 'var(--accent)' : 'transparent',
              color: active ? 'var(--on-accent)' : 'var(--t3)',
              border: active ? '1px solid var(--accent-strong)' : '1px solid transparent',
              cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: 15, fontWeight: 700, lineHeight: 1 }}>{tool.icon}</span>
            <span style={{ fontSize: 8, fontWeight: 600, letterSpacing: '.04em', whiteSpace: 'nowrap' }}>{tool.label}</span>
          </button>
        );
      })}

      <style jsx>{`
        ${RADIAL_MENU_KEYFRAMES}
        .if-bt-root {
          animation: bt-in var(--dur-base) var(--ease-apple);
        }
        @media (prefers-reduced-motion: reduce) {
          .if-bt-root {
            animation: none;
          }
        }
      `}</style>
    </div>,
    document.body,
  );
}
