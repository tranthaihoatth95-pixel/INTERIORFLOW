'use client';

/**
 * components/present-editor/Element.tsx — 1 phần tử trên sân khấu + handle kéo/resize/xoay.
 *
 * Robust: dùng POINTER EVENTS + setPointerCapture (không vỡ khi con trỏ ra ngoài).
 * Toạ độ model là % sân khấu → mọi phép tính quy về % dựa trên bounding rect của stage.
 * Trong lúc kéo dùng `live` (không tạo undo); pointerup mới commit.
 *
 * Snap/căn: phát ra guide khi mép/tâm gần mép/tâm sân khấu hoặc 50%.
 */

import { useRef } from 'react';
import type { SlideElement, ImageElement, TextElement, ShapeElement, Frame } from '@/lib/present-editor/model';
import { adjustToCssFilter } from '@/lib/present-editor/model';

const CANVAS_FONT: Record<string, string> = {
  Editorial: '"Avenir Next", "Helvetica Neue", Helvetica, Arial, sans-serif',
  Modern: '"Helvetica Neue", Helvetica, Arial, sans-serif',
  Elegant: 'Optima, "Avenir Next", "Helvetica Neue", sans-serif',
};

export interface Guides {
  v: number[]; // vị trí % dọc (đường thẳng đứng)
  h: number[];
}

interface Props {
  el: SlideElement;
  fonts: string;
  selected: boolean;
  stageRef: React.RefObject<HTMLDivElement>;
  onSelect: () => void;
  /** cập nhật frame (live=true khi đang kéo). */
  onFrame: (frame: Frame, live: boolean) => void;
  onGuides: (g: Guides | null) => void;
  /** double-click text → chỉnh nội dung inline. */
  onEditText?: (id: string) => void;
  /** chuột phải trên element → mở menu ngữ cảnh. */
  onContextMenu?: (e: React.MouseEvent) => void;
}

const SNAP = 1.2; // ngưỡng snap theo %
const TARGETS = [0, 25, 50, 75, 100];

function snap(val: number, targets: number[]): { v: number; hit: number | null } {
  for (const t of targets) {
    if (Math.abs(val - t) <= SNAP) return { v: t, hit: t };
  }
  return { v: val, hit: null };
}

type Handle = 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w' | 'rot' | 'move';

export default function Element({
  el,
  fonts,
  selected,
  stageRef,
  onSelect,
  onFrame,
  onGuides,
  onEditText,
  onContextMenu,
}: Props) {
  const dragState = useRef<{
    handle: Handle;
    startX: number;
    startY: number;
    frame: Frame;
  } | null>(null);

  function stageRect() {
    return stageRef.current?.getBoundingClientRect();
  }

  function onPointerDown(e: React.PointerEvent, handle: Handle) {
    if (el.locked) return;
    e.stopPropagation();
    onSelect();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragState.current = {
      handle,
      startX: e.clientX,
      startY: e.clientY,
      frame: { ...el.frame },
    };
  }

  function onPointerMove(e: React.PointerEvent) {
    const st = dragState.current;
    const rect = stageRect();
    if (!st || !rect) return;
    const dxPct = ((e.clientX - st.startX) / rect.width) * 100;
    const dyPct = ((e.clientY - st.startY) / rect.height) * 100;
    const f = { ...st.frame };

    if (st.handle === 'move') {
      let nx = st.frame.x + dxPct;
      let ny = st.frame.y + dyPct;
      const guides: Guides = { v: [], h: [] };
      // snap mép trái / tâm / mép phải
      const sxL = snap(nx, TARGETS);
      const sxC = snap(nx + f.w / 2, TARGETS);
      const sxR = snap(nx + f.w, TARGETS);
      if (sxL.hit != null) {
        nx = sxL.v;
        guides.v.push(sxL.hit);
      } else if (sxC.hit != null) {
        nx = sxC.v - f.w / 2;
        guides.v.push(sxC.hit);
      } else if (sxR.hit != null) {
        nx = sxR.v - f.w;
        guides.v.push(sxR.hit);
      }
      const syT = snap(ny, TARGETS);
      const syC = snap(ny + f.h / 2, TARGETS);
      const syB = snap(ny + f.h, TARGETS);
      if (syT.hit != null) {
        ny = syT.v;
        guides.h.push(syT.hit);
      } else if (syC.hit != null) {
        ny = syC.v - f.h / 2;
        guides.h.push(syC.hit);
      } else if (syB.hit != null) {
        ny = syB.v - f.h;
        guides.h.push(syB.hit);
      }
      f.x = nx;
      f.y = ny;
      onGuides(guides.v.length || guides.h.length ? guides : null);
    } else if (st.handle === 'rot') {
      const cx = rect.left + ((st.frame.x + st.frame.w / 2) / 100) * rect.width;
      const cy = rect.top + ((st.frame.y + st.frame.h / 2) / 100) * rect.height;
      const ang = (Math.atan2(e.clientY - cy, e.clientX - cx) * 180) / Math.PI + 90;
      f.rotation = Math.round(ang / 5) * 5; // snap 5°
    } else {
      // resize theo handle
      let { x, y, w, h } = st.frame;
      const H = st.handle;
      if (H.includes('e')) w = st.frame.w + dxPct;
      if (H.includes('s')) h = st.frame.h + dyPct;
      if (H.includes('w')) {
        w = st.frame.w - dxPct;
        x = st.frame.x + dxPct;
      }
      if (H.includes('n')) {
        h = st.frame.h - dyPct;
        y = st.frame.y + dyPct;
      }
      w = Math.max(3, w);
      h = Math.max(3, h);
      f.x = x;
      f.y = y;
      f.w = w;
      f.h = h;
    }
    onFrame(f, true);
  }

  function onPointerUp(e: React.PointerEvent) {
    if (!dragState.current) return;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    // commit lần cuối (không live)
    onFrame({ ...el.frame }, false);
    dragState.current = null;
    onGuides(null);
  }

  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${el.frame.x}%`,
    top: `${el.frame.y}%`,
    width: `${el.frame.w}%`,
    height: `${el.frame.h}%`,
    transform: `rotate(${el.frame.rotation}deg)`,
    opacity: el.opacity ?? 1,
    cursor: el.locked ? 'default' : 'move',
    touchAction: 'none',
  };

  return (
    <div
      style={style}
      onPointerDown={(e) => onPointerDown(e, 'move')}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onDoubleClick={() => el.kind === 'text' && onEditText?.(el.id)}
      onContextMenu={onContextMenu}
    >
      <Inner el={el} fonts={fonts} />

      {selected && !el.locked && (
        <>
          {/* viền chọn */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              outline: '1.5px solid var(--accent)',
              pointerEvents: 'none',
            }}
          />
          {/* handle resize */}
          {(['nw', 'ne', 'sw', 'se', 'n', 's', 'e', 'w'] as Handle[]).map((h) => (
            <span
              key={h}
              className="pe-handle"
              onPointerDown={(e) => onPointerDown(e, h)}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              style={handleStyle(h)}
            />
          ))}
          {/* handle xoay */}
          <span
            className="pe-handle"
            onPointerDown={(e) => onPointerDown(e, 'rot')}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            style={{
              position: 'absolute',
              left: '50%',
              top: -26,
              width: 14,
              height: 14,
              marginLeft: -7,
              borderRadius: '50%',
              background: 'var(--accent)',
              border: '2px solid var(--panel)',
              cursor: 'grab',
            }}
          />
        </>
      )}
    </div>
  );
}

function handleStyle(h: Handle): React.CSSProperties {
  const size = 12;
  const base: React.CSSProperties = {
    position: 'absolute',
    width: size,
    height: size,
    background: 'var(--panel)',
    border: '2px solid var(--accent)',
    borderRadius: 3,
    zIndex: 2,
  };
  const off = -size / 2;
  const map: Record<string, React.CSSProperties> = {
    nw: { left: off, top: off, cursor: 'nwse-resize' },
    ne: { right: off, top: off, cursor: 'nesw-resize' },
    sw: { left: off, bottom: off, cursor: 'nesw-resize' },
    se: { right: off, bottom: off, cursor: 'nwse-resize' },
    n: { left: '50%', marginLeft: off, top: off, cursor: 'ns-resize' },
    s: { left: '50%', marginLeft: off, bottom: off, cursor: 'ns-resize' },
    e: { right: off, top: '50%', marginTop: off, cursor: 'ew-resize' },
    w: { left: off, top: '50%', marginTop: off, cursor: 'ew-resize' },
  };
  return { ...base, ...map[h] };
}

/** Nội dung hiển thị của từng loại element. */
function Inner({ el, fonts }: { el: SlideElement; fonts: string }) {
  if (el.kind === 'image') return <ImageInner el={el} />;
  if (el.kind === 'shape') return <ShapeInner el={el} />;
  return <TextInner el={el} fonts={fonts} />;
}

function ImageInner({ el }: { el: ImageElement }) {
  const crop = el.crop || { x: 0, y: 0, w: 1, h: 1 };
  // Mô phỏng crop bằng background-size/position (cover trong khung).
  const bgSize = `${(1 / crop.w) * 100}% ${(1 / crop.h) * 100}%`;
  const bgPos = `${crop.w >= 1 ? 50 : (crop.x / (1 - crop.w)) * 100}% ${
    crop.h >= 1 ? 50 : (crop.y / (1 - crop.h)) * 100
  }%`;
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundImage: `url("${el.src}")`,
        backgroundSize: crop.w < 1 || crop.h < 1 ? bgSize : 'cover',
        backgroundPosition: bgPos,
        backgroundRepeat: 'no-repeat',
        filter: adjustToCssFilter(el.adjust),
        borderRadius: `${((el.radius ?? 0) / 100) * 50}%`,
        overflow: 'hidden',
      }}
    />
  );
}

function ShapeInner({ el }: { el: ShapeElement }) {
  const sw = `${el.strokeWidth * 0.09}vw`;
  if (el.shape === 'line') {
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center' }}>
        <div style={{ width: '100%', height: 0, borderTop: `${sw} solid ${el.stroke}` }} />
      </div>
    );
  }
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: el.fill === 'transparent' ? 'transparent' : el.fill,
        border: el.strokeWidth > 0 ? `${sw} solid ${el.stroke}` : 'none',
        borderRadius: el.shape === 'ellipse' ? '50%' : `${((el.radius ?? 0) / 100) * 50}%`,
      }}
    />
  );
}

function TextInner({ el, fonts }: { el: TextElement; fonts: string }) {
  // Bullet: thêm "•  " đầu mỗi dòng logic (khớp cách render.ts vẽ khi export).
  const shown = el.bullet
    ? el.text
        .split('\n')
        .map((l) => (l.trim() ? `•  ${l}` : l))
        .join('\n')
    : el.text;
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        color: el.color,
        // ưu tiên bộ chữ riêng của element (chuỗi CSS), không thì dùng bộ chữ của deck
        fontFamily: el.fontFamily || CANVAS_FONT[fonts] || CANVAS_FONT.Editorial,
        fontSize: `${el.fontSize}cqh`,
        fontWeight: el.bold ? 700 : 400,
        fontStyle: el.italic ? 'italic' : 'normal',
        textDecoration: el.underline ? 'underline' : undefined,
        textAlign: el.align,
        letterSpacing: el.tracking ? `${el.tracking * 0.09}vh` : undefined,
        lineHeight: el.lineHeight ?? 1.2,
        whiteSpace: 'pre-wrap',
        overflow: 'hidden',
        wordBreak: 'break-word',
      }}
    >
      {shown}
    </div>
  );
}
