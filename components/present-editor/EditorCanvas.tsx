'use client';

/**
 * components/present-editor/EditorCanvas.tsx — Sân khấu 16:9 chứa các element.
 *
 * Giữ tỉ lệ 16:9 bằng aspect-ratio + width 100%. `containerType:'size'` để cỡ chữ
 * dùng đơn vị cqh (co giãn theo sân khấu). Vẽ guide căn khi kéo.
 *
 * Thao tác chọn kiểu Canva:
 *   - Click nền = bỏ chọn.
 *   - RÊ trên nền = MARQUEE (khung chọn) → chọn mọi phần tử giao với khung.
 *   - Shift/⌘-click phần tử = thêm/bớt khỏi nhóm (onToggle).
 *   - Kéo khi nhiều phần tử chọn = dời cả nhóm.
 * Sửa chữ: nhấp đúp → textarea phủ khung. Sửa ảnh: nhấp đúp → onEditImage.
 */

import { useRef, useState, type CSSProperties } from 'react';
import type { EditorSlide, Frame, TextElement, ShapeElement, DeckWatermark } from '@/lib/present-editor/model';
import { adjustToCssFilter } from '@/lib/present-editor/model';
import Element, { type Guides } from './Element';
import TextToolbar from './TextToolbar';
import ShapeQuickPanel from './ShapeQuickPanel';

/** Bộ chữ hiển thị trên canvas (khớp Element.tsx + render.ts). */
const CANVAS_FONT: Record<string, string> = {
  Editorial: '"Avenir Next", "Helvetica Neue", Helvetica, Arial, sans-serif',
  Modern: '"Helvetica Neue", Helvetica, Arial, sans-serif',
  Elegant: 'Optima, "Avenir Next", "Helvetica Neue", sans-serif',
};

interface Props {
  slide: EditorSlide;
  /** rộng sân khấu (px) — do PresentEditor tính (fit-to-view × zoom). aspect-ratio 16:9 tự
   * suy ra chiều cao. Element vẫn định vị theo % nên KHÔNG cần đổi logic khi zoom (góp ý zoom
   * canvas, tham khảo Photoshop/Figma). */
  widthPx: number;
  fonts: string;
  selectedIds: string[];
  onSelect: (id: string | null) => void;
  onToggleSelect: (id: string) => void;
  onSelectMany: (ids: string[]) => void;
  onFrame: (id: string, frame: Frame, live: boolean) => void;
  /** dời cả nhóm đang chọn theo delta % (cộng dồn từ frame lúc bắt đầu). */
  onFrameMany: (dxPct: number, dyPct: number, live: boolean) => void;
  onAltDrag: (id: string) => void;
  onEditTextCommit: (id: string, text: string) => void;
  onEditImage: (id: string) => void;
  /** mở trình chỉnh ảnh nâng cao (Photoshop-level, /photo-editor) cho đúng ảnh `id`. */
  onEditImageAdvanced?: (id: string) => void;
  /** thả ảnh Reference (drag từ panel) lên sân khấu → thêm image element. */
  onDropRefImage?: (url: string) => void;
  /** thao tác cho menu chuột phải trên element. */
  onDuplicate: () => void;
  onDelete: () => void;
  onZOrder: (dir: 'front' | 'back' | 'forward' | 'backward') => void;
  onToggleLock: () => void;
  /** cập nhật 1 text element cụ thể (cho thanh chữ nổi). */
  onUpdateText?: (id: string, mutate: (el: TextElement) => void, live?: boolean) => void;
  /** cập nhật 1 shape cụ thể (cho bảng chỉnh shape khi chuột phải). */
  onUpdateShape?: (id: string, mutate: (el: ShapeElement) => void, live?: boolean) => void;
  /** ngữ cảnh deck để AI "Tạo content" viết đúng giọng. */
  brand?: string;
  project?: string;
  /** logo/watermark cấp deck (PS-1/G.7) — hiện xem-trước ở góc, không tương tác. */
  watermark?: DeckWatermark;
}

/** Trạng thái menu chuột phải: vị trí (px trong khung stage) + id element. */
interface MenuState {
  x: number;
  y: number;
  id: string;
  locked: boolean;
  /** loại element (để hiện mục "Chỉnh ảnh" khi là ảnh). */
  kind: 'image' | 'text' | 'shape';
}

/** Khung marquee đang vẽ (theo % sân khấu). */
interface Marquee {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export default function EditorCanvas({
  slide,
  widthPx,
  fonts,
  selectedIds,
  onSelect,
  onToggleSelect,
  onSelectMany,
  onFrame,
  onFrameMany,
  onAltDrag,
  onEditTextCommit,
  onEditImage,
  onEditImageAdvanced,
  onDropRefImage,
  onDuplicate,
  onDelete,
  onZOrder,
  onToggleLock,
  onUpdateText,
  onUpdateShape,
  brand,
  project,
  watermark,
}: Props) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [guides, setGuides] = useState<Guides | null>(null);
  const [editing, setEditing] = useState<{ id: string; text: string } | null>(null);
  const [menu, setMenu] = useState<MenuState | null>(null);
  const [marquee, setMarquee] = useState<Marquee | null>(null);
  const marqueeRef = useRef<{ x0: number; y0: number } | null>(null);
  // giữ khung marquee mới nhất (không lệ thuộc re-render) để pointerup đọc chính xác.
  const lastMarquee = useRef<Marquee | null>(null);

  const editingEl =
    editing && (slide.elements.find((e) => e.id === editing.id) as TextElement | undefined);
  const multi = selectedIds.length > 1;

  // Thanh chữ nổi: hiện khi CHỌN ĐÚNG 1 text layer (mở khoá) và KHÔNG đang sửa inline.
  const soleTextEl =
    !multi && selectedIds.length === 1 && !editing && onUpdateText
      ? (slide.elements.find((e) => e.id === selectedIds[0] && e.kind === 'text' && !e.locked) as
          | TextElement
          | undefined)
      : undefined;

  // px trong stage → % sân khấu.
  function toPct(clientX: number, clientY: number) {
    const r = stageRef.current?.getBoundingClientRect();
    if (!r) return { x: 0, y: 0 };
    return { x: ((clientX - r.left) / r.width) * 100, y: ((clientY - r.top) / r.height) * 100 };
  }

  function onStageDown(e: React.PointerEvent) {
    if (e.target !== stageRef.current) return; // chỉ khi nhấn trúng nền
    setMenu(null);
    if (!e.shiftKey) onSelect(null);
    const p = toPct(e.clientX, e.clientY);
    marqueeRef.current = { x0: p.x, y0: p.y };
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      /* pointer capture không bắt buộc — bỏ qua nếu môi trường chặn */
    }
  }
  function onStageMove(e: React.PointerEvent) {
    if (!marqueeRef.current) return;
    const p = toPct(e.clientX, e.clientY);
    const m = { x0: marqueeRef.current.x0, y0: marqueeRef.current.y0, x1: p.x, y1: p.y };
    lastMarquee.current = m;
    setMarquee(m);
  }
  function onStageUp(e: React.PointerEvent) {
    if (!marqueeRef.current) return;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    const m = lastMarquee.current;
    marqueeRef.current = null;
    lastMarquee.current = null;
    setMarquee(null);
    if (!m) return;
    const rx0 = Math.min(m.x0, m.x1);
    const ry0 = Math.min(m.y0, m.y1);
    const rx1 = Math.max(m.x0, m.x1);
    const ry1 = Math.max(m.y0, m.y1);
    // khung quá nhỏ = coi như click nền (đã bỏ chọn ở down).
    if (rx1 - rx0 < 1.2 && ry1 - ry0 < 1.2) return;
    const hit = slide.elements
      .filter((el) => !el.locked)
      .filter((el) => {
        const f = el.frame;
        // giao nhau (overlap) giữa khung marquee và bbox element.
        return f.x < rx1 && f.x + f.w > rx0 && f.y < ry1 && f.y + f.h > ry0;
      })
      .map((el) => el.id);
    if (hit.length) onSelectMany(hit);
  }

  return (
    // Wrapper KHÔNG overflow:hidden — chỉ giữ kích thước 16:9 để lớp overlay (toolbar nổi)
    // dùng chung hệ toạ độ % với stage mà không bị cắt ở mép slide (góp ý ảnh qab3/wzvd).
    <div
      style={{
        width: widthPx,
        flex: `0 0 ${widthPx}px`,
        margin: '0 auto',
        aspectRatio: '16 / 9',
        position: 'relative',
      }}
    >
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: slide.background,
        containerType: 'size',
        boxShadow: '0 10px 40px rgba(0,0,0,.35)',
        borderRadius: 8,
        overflow: 'hidden',
        userSelect: 'none',
      }}
      ref={stageRef}
      onPointerDown={onStageDown}
      onPointerMove={onStageMove}
      onPointerUp={onStageUp}
      onDragOver={(e) => {
        if (onDropRefImage) {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'copy';
        }
      }}
      onDrop={(e) => {
        if (!onDropRefImage) return;
        const url =
          e.dataTransfer.getData('application/interiorflow-ref') ||
          e.dataTransfer.getData('text/uri-list');
        if (url) {
          e.preventDefault();
          onDropRefImage(url);
        }
      }}
      onContextMenu={(e) => {
        if (e.target === stageRef.current) {
          e.preventDefault();
          setMenu(null);
        }
      }}
    >
      {/* ảnh nền full-bleed */}
      {slide.backgroundImage && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url("${slide.backgroundImage}")`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: adjustToCssFilter(slide.backgroundAdjust),
            pointerEvents: 'none',
          }}
        />
      )}

      {/* logo/watermark cấp deck — xem-trước ở góc, trên element, không bắt sự kiện (G.7). */}
      {watermark?.enabled && watermark.src && (
        <img
          src={watermark.src}
          alt=""
          aria-hidden
          style={{
            position: 'absolute',
            width: `${watermark.sizePct}%`,
            height: 'auto',
            opacity: watermark.opacity,
            pointerEvents: 'none',
            zIndex: 3,
            ...cornerStyle(watermark.corner, watermark.marginPct ?? 3),
          }}
        />
      )}

      {slide.elements.map((el) =>
        el.hidden ? null : (
        <Element
          key={el.id}
          el={el}
          fonts={fonts}
          selected={selectedIds.includes(el.id)}
          multi={multi && selectedIds.includes(el.id)}
          stageRef={stageRef}
          onSelect={() => onSelect(el.id)}
          onToggle={() => onToggleSelect(el.id)}
          onFrame={(frame, live) => onFrame(el.id, frame, live)}
          onFrameMany={onFrameMany}
          onAltDrag={() => onAltDrag(el.id)}
          onGuides={setGuides}
          onEditText={(id) => {
            const t = slide.elements.find((x) => x.id === id) as TextElement | undefined;
            if (t) setEditing({ id, text: t.text });
          }}
          onEditImage={onEditImage}
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!selectedIds.includes(el.id)) onSelect(el.id);
            const rect = stageRef.current?.getBoundingClientRect();
            setMenu({
              x: rect ? e.clientX - rect.left : 0,
              y: rect ? e.clientY - rect.top : 0,
              id: el.id,
              locked: !!el.locked,
              kind: el.kind,
            });
          }}
        />
        ),
      )}

      {/* khung marquee */}
      {marquee && (
        <div
          style={{
            position: 'absolute',
            left: `${Math.min(marquee.x0, marquee.x1)}%`,
            top: `${Math.min(marquee.y0, marquee.y1)}%`,
            width: `${Math.abs(marquee.x1 - marquee.x0)}%`,
            height: `${Math.abs(marquee.y1 - marquee.y0)}%`,
            border: '1px solid var(--accent)',
            background: 'var(--accent-soft)',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* menu chuột phải trên element */}
      {menu && (
        <div
          style={{
            position: 'absolute',
            left: menu.x,
            top: menu.y,
            zIndex: 20,
            minWidth: 160,
            background: 'var(--panel)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: 4,
            boxShadow: '0 8px 24px rgba(0,0,0,.35)',
            userSelect: 'none',
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {menu.kind === 'image' && (
            <>
              <MenuItem onClick={() => { onEditImage(menu.id); setMenu(null); }}>Chỉnh ảnh (crop · lọc · thay)</MenuItem>
              {onEditImageAdvanced && (
                <MenuItem onClick={() => { onEditImageAdvanced(menu.id); setMenu(null); }}>Chỉnh ảnh nâng cao (Photoshop)</MenuItem>
              )}
              <MenuSep />
            </>
          )}
          {/* Chuột phải SHAPE → bảng chỉnh cạnh/góc bo/số cạnh ngay tại đây (góp ý #6). */}
          {menu.kind === 'shape' && onUpdateShape && (() => {
            const sh = slide.elements.find((e) => e.id === menu.id);
            if (!sh || sh.kind !== 'shape') return null;
            return (
              <>
                <ShapeQuickPanel el={sh as ShapeElement} onUpdate={(m, live) => onUpdateShape(menu.id, m, live)} />
                <MenuSep />
              </>
            );
          })()}
          <MenuItem onClick={() => { onDuplicate(); setMenu(null); }}>Nhân bản</MenuItem>
          <MenuItem onClick={() => { onZOrder('front'); setMenu(null); }}>Đưa lên trước</MenuItem>
          <MenuItem onClick={() => { onZOrder('forward'); setMenu(null); }}>Tiến 1 bậc</MenuItem>
          <MenuItem onClick={() => { onZOrder('backward'); setMenu(null); }}>Lùi 1 bậc</MenuItem>
          <MenuItem onClick={() => { onZOrder('back'); setMenu(null); }}>Đưa ra sau</MenuItem>
          <MenuItem onClick={() => { onToggleLock(); setMenu(null); }}>
            {menu.locked ? 'Mở khoá' : 'Khoá'}
          </MenuItem>
          <MenuItem danger onClick={() => { onDelete(); setMenu(null); }}>Xoá</MenuItem>
        </div>
      )}

      {/* guide căn */}
      {guides?.v.map((v, i) => (
        <div
          key={`v${i}`}
          style={{
            position: 'absolute',
            left: `${v}%`,
            top: 0,
            bottom: 0,
            width: 1,
            background: 'var(--accent)',
            opacity: 0.9,
            pointerEvents: 'none',
          }}
        />
      ))}
      {guides?.h.map((h, i) => (
        <div
          key={`h${i}`}
          style={{
            position: 'absolute',
            top: `${h}%`,
            left: 0,
            right: 0,
            height: 1,
            background: 'var(--accent)',
            opacity: 0.9,
            pointerEvents: 'none',
          }}
        />
      ))}

      {/* editor text inline */}
      {editing && editingEl && (
        <textarea
          autoFocus
          value={editing.text}
          onChange={(e) => setEditing({ id: editing.id, text: e.target.value })}
          onBlur={() => {
            onEditTextCommit(editing.id, editing.text);
            setEditing(null);
          }}
          style={{
            position: 'absolute',
            left: `${editingEl.frame.x}%`,
            top: `${editingEl.frame.y}%`,
            width: `${editingEl.frame.w}%`,
            height: `${editingEl.frame.h}%`,
            transform: `rotate(${editingEl.frame.rotation}deg)`,
            color: editingEl.color,
            fontFamily: editingEl.fontFamily || CANVAS_FONT[fonts] || CANVAS_FONT.Editorial,
            fontSize: `${editingEl.fontSize}cqh`,
            fontWeight: editingEl.bold ? 700 : 400,
            fontStyle: editingEl.italic ? 'italic' : 'normal',
            textDecoration: editingEl.underline ? 'underline' : undefined,
            textAlign: editingEl.align,
            letterSpacing: editingEl.tracking ? `${editingEl.tracking * 0.09}vh` : undefined,
            lineHeight: editingEl.lineHeight ?? 1.2,
            background: 'rgba(255,255,255,.06)',
            border: '1.5px dashed var(--accent)',
            outline: 'none',
            resize: 'none',
            padding: 0,
            zIndex: 30,
          }}
        />
      )}
    </div>

      {/* lớp overlay NGOÀI stage (overflow: visible) — cùng hệ toạ độ % vì cùng kích thước
          với stage (position:absolute inset:0 trong wrapper). Tránh bị overflow:hidden của
          stage cắt khi textbox sát mép slide (góp ý ảnh qab3/wzvd). */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'visible', pointerEvents: 'none' }}>
        {soleTextEl && onUpdateText && (
          <TextToolbar
            el={soleTextEl}
            leftPct={Math.max(14, Math.min(86, soleTextEl.frame.x + soleTextEl.frame.w / 2))}
            topPct={
              soleTextEl.frame.y < 16
                ? soleTextEl.frame.y + soleTextEl.frame.h
                : soleTextEl.frame.y
            }
            below={soleTextEl.frame.y < 16}
            stageWidthPx={widthPx}
            onUpdate={(mutate, live) => onUpdateText(soleTextEl.id, mutate, live)}
            brand={brand}
            project={project}
          />
        )}
      </div>
    </div>
  );
}

/** Đường ngăn giữa nhóm mục trong menu chuột phải. */
function MenuSep() {
  return <div style={{ height: 1, background: 'var(--border)', margin: '4px 6px' }} />;
}

/**
 * Vị trí góc cho watermark. marginPct = % chiều RỘNG sân khấu (khớp render.ts). Trục dọc quy
 * đổi sang % chiều cao (× 16/9) để lề trên/dưới bằng lề trái/phải theo mắt trên khung 16:9.
 */
function cornerStyle(
  corner: 'tl' | 'tr' | 'bl' | 'br',
  marginPct: number,
): CSSProperties {
  const mx = `${marginPct}%`;
  const my = `${marginPct * (16 / 9)}%`;
  const left = corner === 'tl' || corner === 'bl';
  const top = corner === 'tl' || corner === 'tr';
  return {
    [left ? 'left' : 'right']: mx,
    [top ? 'top' : 'bottom']: my,
  } as CSSProperties;
}

/** 1 dòng trong menu chuột phải. */
function MenuItem({
  children,
  onClick,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        padding: '7px 10px',
        borderRadius: 6,
        border: 'none',
        background: 'transparent',
        color: danger ? '#e5674f' : 'var(--t2)',
        fontSize: 13,
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--field)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      {children}
    </button>
  );
}
