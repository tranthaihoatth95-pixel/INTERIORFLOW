'use client';

/**
 * components/present-editor/Element.tsx — 1 phần tử trên sân khấu + handle kéo/resize/xoay.
 *
 * Robust: dùng POINTER EVENTS + setPointerCapture (không vỡ khi con trỏ ra ngoài).
 * Toạ độ model là % sân khấu → mọi phép tính quy về % dựa trên bounding rect của stage.
 * Trong lúc kéo dùng `live` (không tạo undo); pointerup mới commit.
 *
 * Thao tác kiểu Canva:
 *   - Shift-click: thêm/bớt vào nhóm chọn (onToggle).
 *   - Kéo khi nhiều phần tử được chọn: DỜI CẢ NHÓM (onFrameMany).
 *   - Alt/⌥ kéo: NHÂN BẢN rồi kéo bản mới (onAltDrag một lần khi bắt đầu).
 *   - Shift khi resize góc: GIỮ TỈ LỆ.
 *   - Nhấp đúp ẢNH: mở chế độ chỉnh ảnh (onEditImage). Nhấp đúp CHỮ: sửa nội dung.
 *
 * Snap/căn: phát ra guide khi mép/tâm gần mốc sân khấu (0/25/50/75/100) HOẶC gần mép/tâm của
 * element KHÁC trên cùng slide (smart guide kiểu PowerPoint/Figma — góp ý "khoảng cách rõ so
 * với PowerPoint/Figma"). Mốc "element khác" nhận qua prop `others` (mảng Frame, EditorCanvas
 * lọc sẵn — loại chính nó + phần tử ẩn). Chỉ áp khi kéo ĐƠN (handle 'move', không phải group —
 * dời cả nhóm cố tình KHÔNG snap để giữ tương quan, xem nhánh `st.group` bên dưới).
 */

import { useRef } from 'react';
import type { SlideElement, ImageElement, TextElement, ShapeElement, Frame } from '@/lib/present-editor/model';
import { adjustToCssFilter, decorateListText, effectiveListStyle } from '@/lib/present-editor/model';
import { shapeClipPath, gradientOverlayCss } from '@/lib/present-editor/shape-geometry';

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
  /** có nhiều hơn 1 phần tử đang chọn → kéo = dời cả nhóm. */
  multi?: boolean;
  stageRef: React.RefObject<HTMLDivElement>;
  /** frame của các element KHÁC trên cùng slide (đã loại chính nó + phần tử ẩn) — dùng để tính
   * smart guide khi kéo (canh mép/tâm với element khác, không chỉ mốc sân khấu cố định). */
  others?: Frame[];
  /** click thường: chọn riêng. */
  onSelect: () => void;
  /** shift/cmd-click: thêm/bớt khỏi nhóm chọn. */
  onToggle?: () => void;
  /** cập nhật frame (live=true khi đang kéo). */
  onFrame: (frame: Frame, live: boolean) => void;
  /** dời CẢ NHÓM theo delta % (khi multi). */
  onFrameMany?: (dxPct: number, dyPct: number, live: boolean) => void;
  /** Alt-kéo: nhân bản element này, trả về để tiếp tục kéo bản mới. */
  onAltDrag?: () => void;
  onGuides: (g: Guides | null) => void;
  /** double-click text → chỉnh nội dung inline. */
  onEditText?: (id: string) => void;
  /** double-click image → mở chế độ chỉnh ảnh. */
  onEditImage?: (id: string) => void;
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

/** Mốc mép/tâm (dọc = x, ngang = y) rút ra từ frame của các element KHÁC trên slide. */
function edgeTargets(others: Frame[] | undefined, axis: 'x' | 'y'): number[] {
  if (!others?.length) return [];
  const out: number[] = [];
  for (const o of others) {
    if (axis === 'x') {
      out.push(o.x, o.x + o.w, o.x + o.w / 2);
    } else {
      out.push(o.y, o.y + o.h, o.y + o.h / 2);
    }
  }
  return out;
}

type Handle = 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w' | 'rot' | 'move';

export default function Element({
  el,
  fonts,
  selected,
  multi,
  stageRef,
  others,
  onSelect,
  onToggle,
  onFrame,
  onFrameMany,
  onAltDrag,
  onGuides,
  onEditText,
  onEditImage,
  onContextMenu,
}: Props) {
  const dragState = useRef<{
    handle: Handle;
    startX: number;
    startY: number;
    frame: Frame;
    group: boolean; // dời cả nhóm
    alt: boolean; // đã nhân bản (Alt)
    moved: boolean; // đã vượt ngưỡng để coi là "kéo"
  } | null>(null);

  function stageRect() {
    return stageRef.current?.getBoundingClientRect();
  }

  function onPointerDown(e: React.PointerEvent, handle: Handle) {
    if (el.locked) return;
    e.stopPropagation();
    // Shift/⌘-click phần tử → toggle chọn (không bắt đầu kéo ngay để tránh nhảy).
    if (handle === 'move' && (e.shiftKey || e.metaKey || e.ctrlKey) && onToggle) {
      onToggle();
      return;
    }
    if (!selected) onSelect();
    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      /* con trỏ không còn active (hiếm) — bỏ qua, vẫn kéo được qua move handler */
    }
    // Alt-kéo khối 'move' → nhân bản trước rồi kéo bản mới.
    const alt = handle === 'move' && e.altKey && !!onAltDrag;
    if (alt) onAltDrag!();
    dragState.current = {
      handle,
      startX: e.clientX,
      startY: e.clientY,
      frame: { ...el.frame },
      group: handle === 'move' && !!multi && !!onFrameMany && !e.altKey,
      alt,
      moved: false,
    };
  }

  function onPointerMove(e: React.PointerEvent) {
    const st = dragState.current;
    const rect = stageRect();
    if (!st || !rect) return;
    const dxPct = ((e.clientX - st.startX) / rect.width) * 100;
    const dyPct = ((e.clientY - st.startY) / rect.height) * 100;
    if (Math.abs(dxPct) > 0.1 || Math.abs(dyPct) > 0.1) st.moved = true;

    // Dời cả nhóm (nhiều phần tử) — không snap để giữ tương quan.
    if (st.group) {
      onFrameMany!(dxPct, dyPct, true);
      return;
    }

    const f = { ...st.frame };

    if (st.handle === 'move') {
      let nx = st.frame.x + dxPct;
      let ny = st.frame.y + dyPct;
      const guides: Guides = { v: [], h: [] };
      // mốc sân khấu cố định (0/25/50/75/100) + mốc mép/tâm của element KHÁC (smart guide).
      const xTargets = [...TARGETS, ...edgeTargets(others, 'x')];
      const yTargets = [...TARGETS, ...edgeTargets(others, 'y')];
      const sxL = snap(nx, xTargets);
      const sxC = snap(nx + f.w / 2, xTargets);
      const sxR = snap(nx + f.w, xTargets);
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
      const syT = snap(ny, yTargets);
      const syC = snap(ny + f.h / 2, yTargets);
      const syB = snap(ny + f.h, yTargets);
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
      // resize theo handle. Shift = giữ tỉ lệ (với góc).
      let { x, y, w, h } = st.frame;
      const H = st.handle;
      const ratio = st.frame.w / Math.max(st.frame.h, 0.001);
      const corner = H.length === 2; // nw/ne/sw/se
      if (e.shiftKey && corner) {
        // giữ tỉ lệ: lấy delta lớn hơn theo trục ngang, suy chiều cao.
        const signW = H.includes('w') ? -1 : 1;
        const dw = dxPct * signW;
        w = Math.max(3, st.frame.w + dw);
        h = Math.max(3, w / ratio);
        if (H.includes('w')) x = st.frame.x + (st.frame.w - w);
        if (H.includes('n')) y = st.frame.y + (st.frame.h - h);
      } else {
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
      }
      f.x = x;
      f.y = y;
      f.w = w;
      f.h = h;
    }
    onFrame(f, true);
  }

  function onPointerUp(e: React.PointerEvent) {
    const st = dragState.current;
    if (!st) return;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    // commit lần cuối (không live). Nhóm: commit delta 0 để chốt snapshot.
    if (st.group) onFrameMany!(0, 0, false);
    else onFrame({ ...el.frame }, false);
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
      onDoubleClick={() => {
        if (el.kind === 'text') onEditText?.(el.id);
        else if (el.kind === 'image') onEditImage?.(el.id);
      }}
      onContextMenu={onContextMenu}
    >
      <Inner el={el} fonts={fonts} />

      {selected && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            outline: multi ? '1.5px solid var(--accent-ring)' : '1.5px solid var(--accent)',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* handle chỉ hiện khi chọn ĐƠN + mở khoá (nhóm: không hiện để đỡ rối) */}
      {selected && !multi && !el.locked && (
        <>
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

  const clip = shapeClipPath(el.shape, el.sides);
  // Lớp mask gradient mờ (nếu có) — áp lên chính khối fill.
  const maskCss = el.gradient ? gradientOverlayCss(el.gradient) : undefined;

  const fillLayer: React.CSSProperties = {
    width: '100%',
    height: '100%',
    background: el.fill === 'transparent' ? 'transparent' : el.fill,
    // rect/ellipse dùng border-radius; polygon/tam giác/mũi tên dùng clip-path.
    border: !clip && el.strokeWidth > 0 ? `${sw} solid ${el.stroke}` : 'none',
    borderRadius: clip ? 0 : el.shape === 'ellipse' ? '50%' : `${((el.radius ?? 0) / 100) * 50}%`,
    clipPath: clip,
    WebkitClipPath: clip,
    ...(maskCss
      ? { maskImage: maskCss, WebkitMaskImage: maskCss, maskMode: 'alpha' as const }
      : {}),
  };
  return <div style={fillLayer} />;
}

function TextInner({ el, fonts }: { el: TextElement; fonts: string }) {
  // Danh sách: bullet "•  " hoặc số "1.  " đầu mỗi dòng logic (khớp render.ts khi export).
  const shown = decorateListText(el.text, effectiveListStyle(el));
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
