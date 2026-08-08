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
 *   - Shift khi resize góc: GIỮ TỈ LỆ (text/shape) — riêng ẢNH thì NGƯỢC LẠI: mặc định GIỮ TỈ
 *     LỆ, Shift để BẺ (01/08, chặn lỗi ảnh méo im lặng, xem nhánh `keepRatio` bên dưới).
 *   - Nhấp đúp ẢNH: mở chế độ chỉnh ảnh (onEditImage). Nhấp đúp CHỮ: sửa nội dung.
 *
 * Snap/căn: phát ra guide khi mép/tâm gần mốc sân khấu (0/25/50/75/100) HOẶC gần mép/tâm của
 * element KHÁC trên cùng slide (smart guide kiểu PowerPoint/Figma — góp ý "khoảng cách rõ so
 * với PowerPoint/Figma"). Mốc "element khác" nhận qua prop `others` (mảng Frame, EditorCanvas
 * lọc sẵn — loại chính nó + phần tử ẩn). Chỉ áp khi kéo ĐƠN (handle 'move', không phải group —
 * dời cả nhóm cố tình KHÔNG snap để giữ tương quan, xem nhánh `st.group` bên dưới).
 */

import { useEffect, useRef, useState } from 'react';
import type { SlideElement, ImageElement, TextElement, ShapeElement, Frame } from '@/lib/present-editor/model';
import { adjustToCssFilter, decorateListText, effectiveListStyle, elementFilterToCssFilter } from '@/lib/present-editor/model';
import { resizeCornerKeepRatio, shouldKeepRatio } from '@/lib/present-editor/resize-corner';
import { shapeClipPath, gradientOverlayCss, imageMaskClipPath, fillOverlayCss } from '@/lib/present-editor/shape-geometry';
import { applyTransform, gradientCss, isCurved, shadowCss } from '@/lib/present-editor/text-fx';
import { framesOverlap, planFallback, toneForColor } from '@/lib/adaptive-contrast';
import { autoShadowCss } from '@/lib/present-editor/text-contrast';

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
  /** chữ đang đè lên ảnh → bật tương phản thích ứng (xem `textOverImage`). */
  overImage?: boolean;
  /** chuột phải trên element → mở menu ngữ cảnh. */
  onContextMenu?: (e: React.MouseEvent) => void;
  /**
   * T2 (`docs/SPEC-TRINH-ONG-KINH-DU-LIEU.md` §3) — ẢNH này liên kết tới 1 `LinkedAsset` có
   * `recipe` (sinh từ Doc CAD) VÀ Doc đã đổi từ lúc render → hiện badge góc "Cũ hơn bản vẽ".
   * Chỉ có Ý NGHĨA cho `el.kind === 'image'`, bỏ qua ở text/shape. Optional — CHƯA caller nào
   * (EditorCanvas.tsx) tính + truyền cờ này ở phiên 08/08 (đo staleness cần `deck.linkedAssets` +
   * vân tay Doc sống, Element.tsx không có 2 thứ đó — ngoài vùng file được sửa của việc này, xem
   * báo cáo phiên). Component ĐÃ SẴN SÀNG dùng ngay khi được nối, không đổi hành vi khi vắng mặt
   * (mọi ảnh hiện tại render y hệt trước — additive).
   */
  assetStale?: boolean;
  /** P5/2.2.91 — báo NGOÀI (EditorCanvas) khi thao tác kéo (di chuyển HOẶC tay nắm resize/xoay)
   * đã vượt ngưỡng ~4px, để toolbar-nổi-theo-selection (TextToolbar…) tự thu lại — KHÔNG gọi ở
   * pointerdown (bấm để CHỌN sẽ làm thanh chớp tắt, xem `useFloatingToolbarVisibility.ts`).
   * Gọi ĐÚNG 1 lần `true` khi vừa vượt ngưỡng, 1 lần `false` ở pointerup nếu đã từng vượt. */
  onDragActiveChange?: (active: boolean) => void;
}

/** Ngưỡng PIXEL con trỏ (không phải % sân khấu) trước khi coi 1 thao tác pointerdown→move là
 * "đang kéo" thật sự — khớp `docs/IF-FEATURE-TREE.md` mã 2.2.91 chi tiết ①. */
const DRAG_ACTIVE_THRESHOLD_PX = 4;

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
  overImage,
  onContextMenu,
  onDragActiveChange,
  assetStale,
}: Props) {
  // Giữ bản mới nhất qua ref — dragState sống suốt 1 lượt kéo (không phụ thuộc re-render), gọi
  // callback qua ref để không phải liệt kê onDragActiveChange vào dep của các hàm pointer* bên
  // dưới (chúng đọc dragState.current trực tiếp, không phải closure theo props).
  const onDragActiveChangeRef = useRef(onDragActiveChange);
  onDragActiveChangeRef.current = onDragActiveChange;

  const dragState = useRef<{
    handle: Handle;
    startX: number;
    startY: number;
    frame: Frame;
    group: boolean; // dời cả nhóm
    alt: boolean; // đã nhân bản (Alt)
    moved: boolean; // đã vượt ngưỡng để coi là "kéo"
    /** P5/2.2.91 — đã báo `onDragActiveChange(true)` cho lượt kéo NÀY chưa (gọi đúng 1 lần khi
     * vượt ngưỡng `DRAG_ACTIVE_THRESHOLD_PX`, không gọi lặp lại mỗi pointermove). */
    activeNotified: boolean;
    /** frame MỚI NHẤT tính trong onPointerMove (live) — pointerUp commit từ đây, KHÔNG
     * đọc `el.frame` (prop): prop chỉ chắc chắn phản ánh live-update cuối cùng SAU khi
     * React re-render xong; nếu pointerup tới trước khi re-render kịp chạy (kéo/thả rất
     * nhanh, hoặc nhiều pointermove dồn trong cùng 1 tick), `el.frame` vẫn là snapshot
     * TRƯỚC lúc kéo → commit đè lại giá trị cũ, xoá mất thao tác vừa làm (xoay là dễ thấy
     * nhất vì mỗi lần chỉ đổi 1 trường, nhưng lỗi tương tự có thể ảnh hưởng move/resize). */
    lastFrame: Frame | null;
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
      activeNotified: false,
      lastFrame: null,
    };
  }

  function onPointerMove(e: React.PointerEvent) {
    const st = dragState.current;
    const rect = stageRect();
    if (!st || !rect) return;
    const dxPct = ((e.clientX - st.startX) / rect.width) * 100;
    const dyPct = ((e.clientY - st.startY) / rect.height) * 100;
    if (Math.abs(dxPct) > 0.1 || Math.abs(dyPct) > 0.1) st.moved = true;

    // P5/2.2.91 — báo "đang kéo" (di chuyển HOẶC bất kỳ tay nắm resize/xoay nào — chi tiết ②) ra
    // ngoài đúng 1 lần khi vượt ngưỡng PIXEL thật (không phải %, ngưỡng % co giãn theo cỡ sân
    // khấu zoom mà cảm giác tay bấm là pixel màn hình thật). Đo TRƯỚC khi tính toán snap/resize
    // bên dưới — không đổi hành vi các nhánh đó.
    if (!st.activeNotified) {
      const dxPx = Math.abs(e.clientX - st.startX);
      const dyPx = Math.abs(e.clientY - st.startY);
      if (dxPx >= DRAG_ACTIVE_THRESHOLD_PX || dyPx >= DRAG_ACTIVE_THRESHOLD_PX) {
        st.activeNotified = true;
        onDragActiveChangeRef.current?.(true);
      }
    }

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
      // resize theo handle. Shift = giữ tỉ lệ (với góc) — TRỪ ẢNH: ẢNH mặc định GIỮ TỈ LỆ ở
      // góc, Shift để BẺ (đảo ngược, 01/08 P2 — docs/NGHIEN-CUU-PRESENT-VS-DOI-THU-2026-08-01.md
      // §5). Lý do: méo ảnh là lỗi im lặng, không ai thấy tới lúc in — không ai kéo méo ảnh CỐ
      // Ý mà quên giữ Shift, nên mặc định an toàn phải là GIỮ. Text/shape giữ hành vi cũ nguyên vẹn.
      let { x, y, w, h } = st.frame;
      const H = st.handle;
      const corner = H.length === 2; // nw/ne/sw/se
      if (shouldKeepRatio(el.kind, e.shiftKey) && corner) {
        ({ x, y, w, h } = resizeCornerKeepRatio(st.frame, H, dxPct));
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
    st.lastFrame = f;
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
    // Dùng st.lastFrame (frame MỚI NHẤT vừa tính trong onPointerMove) thay vì el.frame —
    // el.frame là prop, chỉ chắc chắn cập nhật SAU khi React re-render xong; pointerup có
    // thể tới trước đó (kéo/thả nhanh) khiến el.frame vẫn là snapshot cũ và đè mất thao
    // tác vừa làm. Không có lastFrame (chưa từng move, vd chỉ click) → fallback el.frame.
    if (st.group) onFrameMany!(0, 0, false);
    else onFrame(st.lastFrame ?? { ...el.frame }, false);
    // P5/2.2.91 — "vừa thả": chỉ báo false nếu đã từng báo true cho lượt kéo này (click đơn
    // thuần không vượt ngưỡng thì chưa từng gọi true, không cần gọi false vô ích).
    if (st.activeNotified) onDragActiveChangeRef.current?.(false);
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
    // P4/E4 — filter CHUNG mọi loại phần tử, đặt ở NGOÀI CÙNG (khớp `render.ts#drawTextEl/
    // drawShapeEl/drawImageEl` áp SAU CÙNG, xem đó) — với ẢNH, filter riêng `el.adjust` nằm ở
    // <img> BÊN TRONG (dòng ~441) nên 2 filter GHÉP CHỒNG đúng thứ tự CSS (trong trước, ngoài
    // sau), không phải đè lẫn nhau.
    filter: elementFilterToCssFilter(el.filter),
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
      <Inner el={el} fonts={fonts} overImage={overImage} assetStale={assetStale} />

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

/**
 * Nội dung hiển thị của từng loại element — XUẤT để dùng lại ở nơi khác cần vẽ 1 element
 * KHÔNG cần khung kéo/resize/xoay (vd PlayerElements.tsx — trình chiếu, mỗi element build-in
 * độc lập). Giữ 1 nguồn vẽ text/ảnh/shape duy nhất cho canvas chỉnh sửa.
 */
export function Inner({
  el,
  fonts,
  overImage,
  assetStale,
}: {
  el: SlideElement;
  fonts: string;
  /** chữ này có nằm CHỒNG lên một ảnh phía dưới không (xem `textOverImage`). */
  overImage?: boolean;
  /** T2 — xem docblock `assetStale` ở `Props` của `Element` (component mặc định) phía trên. */
  assetStale?: boolean;
}) {
  if (el.kind === 'image') return <ImageInner el={el} assetStale={assetStale} />;
  if (el.kind === 'shape') return <ShapeInner el={el} />;
  return <TextInner el={el} fonts={fonts} overImage={overImage} />;
}

/**
 * Chữ có đè lên ẢNH không? Phần tử vẽ theo THỨ TỰ MẢNG (sau = nằm trên), nên chỉ tính
 * các ảnh đứng TRƯỚC nó trong mảng và có khung giao nhau. Chữ trên nền phẳng (không ảnh
 * nào bên dưới) KHÔNG cần scrim — giữ nguyên như cũ, đúng chỉ đạo.
 */
export function textOverImage(
  el: SlideElement,
  elements: SlideElement[],
  /** slide có ảnh nền full-bleed → MỌI chữ đều đang nằm trên ảnh. */
  hasBackgroundImage = false,
): boolean {
  if (el.kind !== 'text') return false;
  if (hasBackgroundImage) return true;
  const i = elements.findIndex((e) => e.id === el.id);
  if (i < 0) return false;
  for (let k = 0; k < i; k++) {
    const below = elements[k];
    if (below.kind === 'image' && !below.hidden && framesOverlap(el.frame, below.frame)) return true;
  }
  return false;
}

function ImageInner({ el, assetStale }: { el: ImageElement; assetStale?: boolean }) {
  const crop = el.crop || { x: 0, y: 0, w: 1, h: 1 };
  // Mô phỏng crop bằng background-size/position (cover trong khung).
  const bgSize = `${(1 / crop.w) * 100}% ${(1 / crop.h) * 100}%`;
  const bgPos = `${crop.w >= 1 ? 50 : (crop.x / (1 - crop.w)) * 100}% ${
    crop.h >= 1 ? 50 : (crop.y / (1 - crop.h)) * 100
  }%`;
  // P1/E2 — mask theo hình (tròn/tam giác/đa giác/mũi tên). Có mask → clip-path chiếm quyền,
  // bo góc chữ nhật (radius) bị bỏ qua (2 cơ chế cắt không cộng dồn, xem ImageElement.mask).
  const maskClip = imageMaskClipPath(el.mask);
  const overlay = el.fillOverlay;
  return (
    <>
      <div
        style={{
          width: '100%',
          height: '100%',
          backgroundImage: `url("${el.src}")`,
          backgroundSize: crop.w < 1 || crop.h < 1 ? bgSize : 'cover',
          backgroundPosition: bgPos,
          backgroundRepeat: 'no-repeat',
          filter: adjustToCssFilter(el.adjust),
          borderRadius: maskClip ? 0 : `${((el.radius ?? 0) / 100) * 50}%`,
          clipPath: maskClip,
          WebkitClipPath: maskClip,
          overflow: 'hidden',
        }}
      />
      {/* P3/E3 — lớp phủ FILL: cùng vùng clip (mask/bo góc) với ảnh ở trên, đè lên trên cùng. */}
      {overlay && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            background: overlay.kind === 'gradient' ? fillOverlayCss(overlay) : overlay.color,
            opacity: overlay.opacity,
            mixBlendMode: overlay.blend && overlay.blend !== 'normal' ? overlay.blend : undefined,
            borderRadius: maskClip ? 0 : `${((el.radius ?? 0) / 100) * 50}%`,
            clipPath: maskClip,
            WebkitClipPath: maskClip,
            pointerEvents: 'none',
          }}
        />
      )}
      {/* T2 (SPEC-TRINH-ONG-KINH-DU-LIEU §3) — badge "ảnh có công thức đã cũ hơn bản vẽ". Cùng
          khuôn cảnh báo `--warning` đã dùng ở BoqTable.tsx (chip "suy đoán theo vị trí") — không
          bịa màu/kiểu mới. `pointerEvents:none` — không cản kéo/resize/chọn ảnh phía dưới. */}
      {assetStale && (
        <span
          aria-hidden
          title="Bản vẽ Thiết kế 2D đã đổi từ lúc ảnh này được dựng — mở Inspector để làm mới."
          style={{
            position: 'absolute',
            top: 6,
            right: 6,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '3px 7px',
            borderRadius: 999,
            background: 'var(--warning)',
            color: '#1a1400',
            fontSize: 10,
            fontWeight: 700,
            lineHeight: 1,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            zIndex: 3,
          }}
        >
          Cũ hơn bản vẽ
        </span>
      )}
    </>
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
  const overlay = el.fillOverlay;
  if (!overlay) return <div style={fillLayer} />;
  return (
    <>
      <div style={fillLayer} />
      {/* P3/E3 — lớp phủ FILL: cùng vùng clip (clip-path đa giác / bo góc) với fill gốc ở trên. */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background: overlay.kind === 'gradient' ? fillOverlayCss(overlay) : overlay.color,
          opacity: overlay.opacity,
          mixBlendMode: overlay.blend && overlay.blend !== 'normal' ? overlay.blend : undefined,
          borderRadius: clip ? 0 : el.shape === 'ellipse' ? '50%' : `${((el.radius ?? 0) / 100) * 50}%`,
          clipPath: clip,
          WebkitClipPath: clip,
          pointerEvents: 'none',
        }}
      />
    </>
  );
}

function TextInner({ el, fonts, overImage }: { el: TextElement; fonts: string; overImage?: boolean }) {
  // Danh sách: bullet "•  " hoặc số "1.  " đầu mỗi dòng logic (khớp render.ts khi export).
  // Hiệu ứng `transform` (hoa/thường) áp ở TẦNG CHUỖI — không dùng CSS text-transform — để
  // DOM và canvas (render.ts) chắc chắn ra cùng một chuỗi khi export.
  const shown = applyTransform(decorateListText(el.text, effectiveListStyle(el)), el.fx);
  const fx = el.fx;

  // Chữ uốn cung đi ĐƯỜNG RIÊNG (SVG textPath) — xem CurvedText. Chỉ 1 dòng, có chủ ý.
  if (isCurved(fx)) return <CurvedText el={el} fonts={fonts} text={shown} />;

  /* Tương phản thích ứng — CHỈ khi chữ nằm CHỒNG lên ảnh.
     P6a (04/08, TICKET-PRESENT-UI-GON, Hoà chốt) — CARVE-OUT có điều kiện của luật cũ "không tự
     đổi màu chữ": màu HIỆN TẠI (`el.color`) đã được chốt SẴN ở nơi khác (EditorCanvas.tsx — đo
     nền THẬT qua text-contrast.ts#resolveAutoTextColor, ghi thẳng vào element MỘT LẦN khi
     `colorAuto === true` VÀ màu đang có KHÔNG đạt AA; giữ nguyên nếu người dùng đã tự chỉnh tay
     [colorAuto → false vĩnh viễn] hoặc màu hiện có đã đủ AA rồi). TextInner ở đây KHÔNG tự đo/tự
     đổi màu gì — chỉ VẼ đúng những gì đã chốt, y hệt trước 04/08. `el.autoShadow` (bật kèm lúc
     chốt màu, khi ngay cả ứng viên tốt nhất vẫn không đạt AA) quyết định có thêm bóng đổ mảnh.

     Vệt SƯƠNG (scrim) — trước 04/08 LUÔN bật ngầm khi `overImage`; nay mặc định TẮT, chỉ bật khi
     `el.scrimEnabled === true` (tuỳ chọn tay, xem Inspector.tsx) — giữ nguyên năng lực+công thức
     cũ (suy tone TỪ màu chữ hiện có, đắp sương CSS thuần không đo pixel — không đổi khi bật). */
  const plan =
    overImage && el.scrimEnabled === true
      ? planFallback(toneForColor(el.color), { shape: 'halo', baseAlpha: 0.3 })
      : null;

  /* Hiệu ứng chữ (#2). Mọi khoảng cách của TextFx tính theo % chiều cao sân khấu, mà `cqh`
     CHÍNH LÀ đơn vị đó (khung sân khấu đặt containerType:'size') ⇒ dùng thẳng, không quy đổi.
     Nhờ vậy cùng một đoạn style chạy đúng ở editor, player VÀ thumbnail 150px. */
  const fxShadow = shadowCss(fx?.shadows, { unit: 'cqh' });
  /* L3 (phiếu 03/08 — "thumbnail slide 3 chữ đè ảnh, không nền/không tương phản"):
     `resolveAutoTextColor` chỉ chạy trong `EditorCanvas` cho slide ĐANG MỞ, nên slide chưa ai mở
     (và bản thu nhỏ của nó ở SlideStrip) vẫn giữ màu gốc của template — chữ trắng trên ảnh sáng =
     không đọc được. Khi chữ ĐANG đè ảnh mà màu VẪN chưa ai chốt (`colorAuto === true`), đắp bóng
     AA mảnh — đúng bóng mà P6a dùng, chỉ là bật sớm hơn. Màu chốt xong (`colorAuto` false) thì
     điều kiện tắt, không chồng thêm gì; ai đã bật `autoShadow` cũng không bị nhân đôi. */
  const shadowNow = el.autoShadow || (overImage && el.colorAuto === true);
  // thứ tự: hiệu ứng chữ TRƯỚC (trên cùng) → sương tương phản (nếu bật tay) → bóng AA mảnh P6a
  const textShadow =
    [fxShadow, plan?.textShadow, shadowNow ? autoShadowCss(el.color) : undefined]
      .filter(Boolean)
      .join(', ') || undefined;
  const hasStroke = Boolean(fx?.strokeWidth && fx.strokeWidth > 0);
  const gradFill = fx?.gradient;

  const body = (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        // Chữ rỗng = ruột trong suốt, chỉ còn viền. Gradient = tô chuyển sắc vào lòng chữ
        // bằng background-clip:text (ruột phải trong suốt để lộ nền gradient bên dưới).
        color: fx?.outlineOnly || gradFill ? 'transparent' : el.color,
        ...(gradFill
          ? {
              backgroundImage: gradientCss(gradFill),
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
            }
          : {}),
        ...(hasStroke
          ? {
              WebkitTextStrokeWidth: `${fx!.strokeWidth}cqh`,
              WebkitTextStrokeColor: fx!.strokeColor ?? el.color,
            }
          : {}),
        wordSpacing: fx?.wordSpacing ? `${fx.wordSpacing}cqh` : undefined,
        mixBlendMode: fx?.blend && fx.blend !== 'normal' ? fx.blend : undefined,
        textShadow,
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

  if (!plan) return body;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* sương mềm toả rộng hơn khung chữ, tan hẳn ở mép — không tạo khối nền nhìn thấy được */}
      <span
        aria-hidden
        style={{
          position: 'absolute',
          inset: '-8% -6%',
          background: plan.scrim,
          pointerEvents: 'none',
        }}
      />
      {body}
    </div>
  );
}

/**
 * CHỮ UỐN CUNG (TextFx.curve) — dựng bằng SVG <textPath> trên một cung tròn.
 *
 * Vì sao phải đo px thật (ResizeObserver) thay vì dùng `cqh` như phần chữ phẳng: dữ liệu
 * `d` của <path> KHÔNG nhận đơn vị tương đối — cung phải viết bằng số user-unit cụ thể. Nên
 * ở đây quy ra px: đo chiều cao px của chính element rồi suy ngược chiều cao sân khấu
 * (frame.h là % của sân khấu) ⇒ fontSize px = fontSize% × chiều cao sân khấu. Cách suy này
 * giữ đúng tỉ lệ ở MỌI cỡ hiển thị (thumbnail 150px hay canvas full) mà không cần biết
 * sân khấu là ai.
 *
 * Xuống dòng bị bỏ (thay bằng dấu cách): cung tròn chỉ có một đường.
 */
function CurvedText({ el, fonts, text }: { el: TextElement; fonts: string; text: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<{ w: number; h: number }>({ w: 0, h: 0 });

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(([entry]) => {
      const r = entry.contentRect;
      setBox({ w: r.width, h: r.height });
    });
    ro.observe(node);
    return () => ro.disconnect();
  }, []);

  const fx = el.fx!;
  const line = text.replace(/\s*\n\s*/g, ' ');
  const pathId = `arc-${el.id}`;

  // chiều cao sân khấu suy từ chiều cao px của element (frame.h = % sân khấu)
  const stageH = el.frame.h > 0 ? box.h / (el.frame.h / 100) : 0;
  const fontPx = (el.fontSize / 100) * stageH;

  /* Cung tròn: dây cung = bề ngang element, góc ở tâm = |curve| độ.
     R = (dây/2) / sin(góc/2). Dương = cong lên (tâm nằm DƯỚI), âm = cong xuống. */
  const deg = Math.max(-350, Math.min(350, fx.curve ?? 0));
  const up = deg > 0;
  const rad = (Math.abs(deg) * Math.PI) / 180;
  const chord = Math.max(1, box.w * 0.92);
  const R = chord / 2 / Math.max(0.0001, Math.sin(rad / 2));
  const sagitta = R - Math.sqrt(Math.max(0, R * R - (chord / 2) ** 2)); // độ vồng của cung
  const cx = box.w / 2;
  const midY = box.h / 2 + (up ? sagitta / 2 : -sagitta / 2);
  const x0 = cx - chord / 2;
  const x1 = cx + chord / 2;
  const yEnd = up ? midY + sagitta : midY - sagitta;
  // sweep 1 = cung uốn LÊN khi đi từ trái sang phải (hệ toạ độ SVG y hướng xuống)
  const d = `M ${x0} ${yEnd} A ${R} ${R} 0 0 ${up ? 1 : 0} ${x1} ${yEnd}`;

  const anchor = el.align === 'left' ? 'start' : el.align === 'right' ? 'end' : 'middle';
  const offset = el.align === 'left' ? '2%' : el.align === 'right' ? '98%' : '50%';

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%', height: '100%', overflow: 'visible' }}>
      {box.w > 0 && box.h > 0 && fontPx > 0 && (
        <svg
          width={box.w}
          height={box.h}
          viewBox={`0 0 ${box.w} ${box.h}`}
          style={{ position: 'absolute', inset: 0, overflow: 'visible' }}
        >
          <defs>
            <path id={pathId} d={d} fill="none" />
            {fx.gradient && (
              <linearGradient id={`${pathId}-g`} gradientTransform={`rotate(${fx.gradient.angle})`}>
                <stop offset="0%" stopColor={fx.gradient.from} />
                <stop offset="100%" stopColor={fx.gradient.to} />
              </linearGradient>
            )}
          </defs>
          <text
            textAnchor={anchor}
            style={{
              fontFamily: el.fontFamily || CANVAS_FONT[fonts] || CANVAS_FONT.Editorial,
              fontSize: `${fontPx}px`,
              fontWeight: el.bold ? 700 : 400,
              fontStyle: el.italic ? 'italic' : 'normal',
              letterSpacing: el.tracking ? `${(el.tracking / 100) * stageH}px` : undefined,
              wordSpacing: fx.wordSpacing ? `${(fx.wordSpacing / 100) * stageH}px` : undefined,
            }}
            fill={fx.outlineOnly ? 'none' : fx.gradient ? `url(#${pathId}-g)` : el.color}
            stroke={fx.strokeWidth ? (fx.strokeColor ?? el.color) : undefined}
            strokeWidth={fx.strokeWidth ? (fx.strokeWidth / 100) * stageH : undefined}
          >
            <textPath href={`#${pathId}`} startOffset={offset}>
              {line}
            </textPath>
          </text>
        </svg>
      )}
    </div>
  );
}
