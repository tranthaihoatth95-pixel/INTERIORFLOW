'use client';

/**
 * components/present-editor/EditorCanvas.tsx — Sân khấu chứa các element.
 *
 * Giữ ĐÚNG tỉ lệ khổ trình bày đang chọn (PS-4 — mặc định 16:9, có thể là A4/A3 ngang/dọc)
 * bằng aspect-ratio (CSS) + width 100%. `containerType:'size'` để cỡ chữ dùng đơn vị cqh
 * (co giãn theo sân khấu). Vẽ guide căn khi kéo.
 *
 * Thao tác chọn kiểu Canva:
 *   - Click nền = bỏ chọn.
 *   - RÊ trên nền = MARQUEE (khung chọn) → chọn mọi phần tử giao với khung.
 *   - Shift/⌘-click phần tử = thêm/bớt khỏi nhóm (onToggle).
 *   - Kéo khi nhiều phần tử chọn = dời cả nhóm.
 * Sửa chữ: nhấp đúp → textarea phủ khung. Sửa ảnh: nhấp đúp → onEditImage.
 */

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import type { EditorSlide, Frame, TextElement, ShapeElement, SlideElement, DeckWatermark } from '@/lib/present-editor/model';
import { adjustToCssFilter } from '@/lib/present-editor/model';
import { STAGE_PRESETS, type StageSize } from '@/lib/present-editor/stage-presets';
import { extractTextFormat, applyTextFormat, type TextFormat } from '@/lib/present-editor/format-painter';
import { groupBoundingBox } from '@/lib/present-editor/resize-group';
import { useFloatingToolbarVisibility } from '@/lib/useFloatingToolbarVisibility';
import { readImageRegion } from '@/lib/adaptive-contrast';
import { findTextBackdrop, resolveAutoTextColor } from '@/lib/present-editor/text-contrast';
import Element, { textOverImage, type Guides } from './Element';
import TextToolbar from './TextToolbar';
import ShapeQuickPanel from './ShapeQuickPanel';
import Popover from '@/components/ui/Popover';

/** Bộ chữ hiển thị trên canvas (khớp Element.tsx + render.ts). */
const CANVAS_FONT: Record<string, string> = {
  Editorial: '"Avenir Next", "Helvetica Neue", Helvetica, Arial, sans-serif',
  Modern: '"Helvetica Neue", Helvetica, Arial, sans-serif',
  Elegant: 'Optima, "Avenir Next", "Helvetica Neue", sans-serif',
};

interface Props {
  slide: EditorSlide;
  /** rộng sân khấu (px) — do PresentEditor tính (fit-to-view × zoom). aspect-ratio (theo
   * `stage`) tự suy ra chiều cao. Element vẫn định vị theo % nên KHÔNG cần đổi logic khi
   * zoom (góp ý zoom canvas, tham khảo Photoshop/Figma). */
  widthPx: number;
  /** khổ trình bày đang chọn (PS-4) — quyết định tỉ lệ khung. Bỏ trống = 16:9 (mặc định cũ). */
  stage?: StageSize;
  fonts: string;
  selectedIds: string[];
  onSelect: (id: string | null) => void;
  onToggleSelect: (id: string) => void;
  onSelectMany: (ids: string[]) => void;
  onFrame: (id: string, frame: Frame, live: boolean) => void;
  /** dời cả nhóm đang chọn theo delta % (cộng dồn từ frame lúc bắt đầu). */
  onFrameMany: (dxPct: number, dyPct: number, live: boolean) => void;
  /** E1 bổ sung (02/08) — kéo GÓC khung bao cả cụm (multi) → scale theo tỉ lệ. Không truyền =
   * không hiện khung bao/handle resize nhóm (chỉ còn dời cả nhóm qua onFrameMany như cũ). */
  onGroupResize?: (handle: 'nw' | 'ne' | 'sw' | 'se', dxPct: number, live: boolean) => void;
  onAltDrag: (id: string) => void;
  onEditTextCommit: (id: string, text: string) => void;
  onEditImage: (id: string) => void;
  /** mở trình chỉnh ảnh nâng cao (Photoshop-level, /photo-editor) cho đúng ảnh `id`. */
  onEditImageAdvanced?: (id: string) => void;
  /** mở hộp thoại "Thay ảnh…" (VIỆC 2d) cho đúng ảnh `id`. */
  onReplaceImage?: (id: string) => void;
  /** thả ảnh Reference (drag từ panel) lên sân khấu → thêm image element. */
  onDropRefImage?: (url: string) => void;
  /** thao tác cho menu chuột phải trên element. */
  onDuplicate: () => void;
  onDelete: () => void;
  onZOrder: (dir: 'front' | 'back' | 'forward' | 'backward') => void;
  onToggleLock: () => void;
  /** P2/E1 (nhóm) — gộp ≥2 phần tử đang chọn / rã cụm hiện tại. */
  onGroup?: () => void;
  onUngroup?: () => void;
  /** cập nhật 1 text element cụ thể (cho thanh chữ nổi). */
  onUpdateText?: (id: string, mutate: (el: TextElement) => void, live?: boolean) => void;
  /** cập nhật 1 shape cụ thể (cho bảng chỉnh shape khi chuột phải). */
  onUpdateShape?: (id: string, mutate: (el: ShapeElement) => void, live?: boolean) => void;
  /** ngữ cảnh deck để AI "Tạo content" viết đúng giọng. */
  brand?: string;
  project?: string;
  /** palette gu của deck (6 màu) — cho bảng màu chữ nhanh của TextToolbar. */
  palette?: string[];
  /** logo/watermark cấp deck (PS-1/G.7) — hiện xem-trước ở góc, không tương tác. */
  watermark?: DeckWatermark;
}

/** Trạng thái menu chuột phải: toạ độ VIEWPORT (Popover tự quy đổi + lật hướng) + id element. */
interface MenuState {
  clientX: number;
  clientY: number;
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
  stage = STAGE_PRESETS['16:9'],
  fonts,
  selectedIds,
  onSelect,
  onToggleSelect,
  onSelectMany,
  onFrame,
  onFrameMany,
  onGroupResize,
  onAltDrag,
  onEditTextCommit,
  onEditImage,
  onEditImageAdvanced,
  onDropRefImage,
  onDuplicate,
  onDelete,
  onZOrder,
  onToggleLock,
  onGroup,
  onUngroup,
  onUpdateText,
  onUpdateShape,
  onReplaceImage,
  brand,
  project,
  palette,
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

  // Format Painter (Việc 1) — định dạng đã "sao chép" từ 1 text element, chờ áp vào element
  // KHÁC khi click tiếp theo. Sống ở đây (không phải PresentEditor/useEditor) vì đây là trạng
  // thái tạm thời của thao tác chuột trên canvas, không phải dữ liệu deck cần lưu/khôi phục.
  const [paintFormat, setPaintFormat] = useState<TextFormat | null>(null);

  // Esc → huỷ Format Painter đang bật.
  useEffect(() => {
    if (!paintFormat) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setPaintFormat(null);
    }
    window.addEventListener('keydown', onKeyDown); // esc-only: chỉ xử Escape huỷ Format Painter — lệnh đóng/huỷ, không cần né ô nhập
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [paintFormat]);

  /** Bấm nút Format Painter trên TextToolbar: bật (copy định dạng của element đang chọn) hoặc
   * tắt (đang bật → bấm lại = huỷ). */
  function toggleFormatPainter(source: TextElement) {
    setPaintFormat((cur) => (cur ? null : extractTextFormat(source)));
  }

  /** Chọn 1 element — nếu Format Painter đang bật VÀ element là text (chưa khoá) thì áp định
   * dạng đã copy vào đó thay vì chọn thường (Việc 1: "click text khác → áp định dạng"). Vẫn
   * chọn lại element sau khi áp để thấy toolbar cập nhật theo — luồng tự nhiên như Canva. */
  function selectOrPaint(el: SlideElement) {
    if (paintFormat && el.kind === 'text' && !el.locked && onUpdateText) {
      onUpdateText(el.id, (t) => applyTextFormat(t, paintFormat));
    }
    onSelect(el.id);
  }

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

  // P5/2.2.91 — toolbar-nổi-theo-selection (hiện chỉ TextToolbar, nguyên liệu dùng chung cho
  // CAD/Render sau này) tự thu khi kéo (di chuyển HOẶC tay nắm resize/xoay) — `dragActive` do
  // MỌI <Element> báo qua `onDragActiveChange` (chỉ 1 element kéo được tại 1 thời điểm nhờ
  // pointer capture, không cần phân biệt element nào). Vị trí "sống" tính lại mỗi render như cũ
  // (không đổi công thức, giữ NGUYÊN `Math.max/min` clamp + luật lật xuống `y < 16`) — hook LO
  // phần đóng băng trong lúc kéo (chi tiết ④, xem `useFloatingToolbarVisibility.ts`).
  const [dragActive, setDragActive] = useState(false);
  // PHẢI memo theo các số thật: object literal mới ở mỗi render làm effect trong
  // useFloatingToolbarVisibility thấy `livePos` đổi → setPos → render → object mới vô hạn
  // (`Maximum update depth exceeded`, bắt được sau khi nhập PPTX có text).
  const liveTextToolbarPos = useMemo(
    () =>
      soleTextEl
        ? {
            left: Math.max(14, Math.min(86, soleTextEl.frame.x + soleTextEl.frame.w / 2)),
            top:
              soleTextEl.frame.y < 16
                ? soleTextEl.frame.y + soleTextEl.frame.h
                : soleTextEl.frame.y,
            below: soleTextEl.frame.y < 16,
          }
        : { left: 0, top: 0, below: false },
    [
      soleTextEl?.frame.x,
      soleTextEl?.frame.y,
      soleTextEl?.frame.w,
      soleTextEl?.frame.h,
    ],
  );
  const { hidden: textToolbarHidden, pos: textToolbarPos } = useFloatingToolbarVisibility(
    dragActive,
    liveTextToolbarPos,
  );

  // P6a — tự sửa màu chữ khi FAIL contrast WCAG AA với nền/ảnh đo được (chỉ áp cho text có
  // colorAuto === true, tức text MỚI tạo qua makeText() — file cũ colorAuto=undefined KHÔNG bị
  // đụng tới; user tự chọn màu qua TextToolbar/Inspector → colorAuto khoá về false VĨNH VIỄN nên
  // hiệu ứng này không bao giờ đè lên lựa chọn tay). "Đo một lần, ghi vào dữ liệu" — SlideStrip/
  // PlayerElements/render.ts/export.ts đều chỉ ĐỌC `el.color`/`el.autoShadow` đã lưu, không cần
  // đo lại. Chữ ký phụ thuộc là CHUỖI đã làm tròn % khung (không phải object `slide` sống) để
  // effect KHÔNG chạy lại mỗi khung hình khi đang kéo/resize — chỉ chạy lại khi vị trí/kích thước
  // đổi ĐỦ để lệch số nguyên %, hoặc khi danh sách text/ảnh nền thực sự đổi.
  const autoColorSignature = useMemo(
    () =>
      JSON.stringify(
        slide.elements
          .filter((e): e is TextElement => e.kind === 'text' && e.colorAuto === true)
          .map((e) => [
            e.id,
            e.color,
            Math.round(e.frame.x),
            Math.round(e.frame.y),
            Math.round(e.frame.w),
            Math.round(e.frame.h),
          ]),
      ) + '|' + (slide.backgroundImage ?? ''),
    [slide.elements, slide.backgroundImage],
  );

  useEffect(() => {
    if (!onUpdateText) return;
    let cancelled = false;
    for (const el of slide.elements) {
      if (el.kind !== 'text' || el.colorAuto !== true) continue;
      const backdrop = findTextBackdrop(el, slide.elements, slide.backgroundImage ?? null);
      if (!backdrop) continue;
      readImageRegion(backdrop.src, backdrop.region).then((reading) => {
        if (cancelled || !reading) return;
        const fix = resolveAutoTextColor(el, reading, palette?.[0]);
        if (!fix) return;
        onUpdateText(el.id, (t) => {
          // Trong lúc chờ đo, user có thể đã tự chọn màu (colorAuto → false) — bỏ qua, không đè.
          if (t.colorAuto !== true) return;
          t.color = fix.color;
          t.autoShadow = fix.autoShadow;
        });
      });
    }
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- phụ thuộc thật là autoColorSignature (đã làm tròn), không phải slide sống.
  }, [autoColorSignature, onUpdateText, palette]);

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
    // Wrapper KHÔNG overflow:hidden — chỉ giữ kích thước theo khổ đang chọn để lớp overlay
    // (toolbar nổi) dùng chung hệ toạ độ % với stage mà không bị cắt ở mép slide (góp ý ảnh
    // qab3/wzvd).
    <div
      style={{
        width: widthPx,
        flex: `0 0 ${widthPx}px`,
        margin: '0 auto',
        aspectRatio: `${stage.w} / ${stage.h}`,
        position: 'relative',
      }}
    >
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: slide.background,
        containerType: 'size',
        // "Giấy thì vuông, vỏ thì bo" (docs/SPEC-UI-SHELL.md §3B) — trang slide đại diện cho
        // PDF/PPTX/in thật, PHẢI vuông góc (borderRadius: 0). Bo góc ở đây từng làm ảnh
        // full-bleed bị cắt góc giả (WYSIWYG sai — xuất ra vẫn vuông). Tách trang khỏi canvas
        // bằng box-shadow nổi + viền 1px sáng nhẹ thay vì bo góc.
        borderRadius: 0,
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 20px 60px -12px rgba(0,0,0,.5), 0 4px 16px rgba(0,0,0,.25)',
        overflow: 'hidden',
        userSelect: 'none',
        // Format Painter đang bật (Việc 1) — báo con trỏ "đang có định dạng để dán".
        cursor: paintFormat ? 'copy' : undefined,
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
        // Đang sửa TEXT này tại chỗ (textarea nổi bên dưới đè đúng khung `frame`) →
        // KHÔNG vẽ Element tĩnh nữa, nếu không chữ cũ (chưa commit) và chữ đang gõ trong
        // textarea sẽ chồng lên nhau (2 lớp gần như cùng vị trí/cỡ chữ, lệch vài pixel do
        // khác box-model div/textarea) → đúng hiện tượng "chữ chồng/echo" user báo khi sửa
        // TRÊN CANVAS (khác đường Inspector — Inspector chỉ có 1 lớp nên luôn sạch).
        el.hidden || editing?.id === el.id ? null : (
        <Element
          key={el.id}
          el={el}
          fonts={fonts}
          selected={selectedIds.includes(el.id)}
          multi={multi && selectedIds.includes(el.id)}
          stageRef={stageRef}
          others={slide.elements.filter((o) => o.id !== el.id && !o.hidden).map((o) => o.frame)}
          overImage={textOverImage(el, slide.elements, !!slide.backgroundImage)}
          onSelect={() => selectOrPaint(el)}
          onToggle={() => onToggleSelect(el.id)}
          onFrame={(frame, live) => onFrame(el.id, frame, live)}
          onFrameMany={onFrameMany}
          onAltDrag={() => onAltDrag(el.id)}
          onGuides={setGuides}
          onDragActiveChange={setDragActive}
          onEditText={(id) => {
            const t = slide.elements.find((x) => x.id === id) as TextElement | undefined;
            if (t) setEditing({ id, text: t.text });
          }}
          onEditImage={onEditImage}
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!selectedIds.includes(el.id)) onSelect(el.id);
            setMenu({
              clientX: e.clientX,
              clientY: e.clientY,
              id: el.id,
              locked: !!el.locked,
              kind: el.kind,
            });
          }}
        />
        ),
      )}

      {/* E1 bổ sung (02/08) — khung bao + 4 handle góc khi chọn NHIỀU phần tử: kéo góc = scale
          cả cụm theo tỉ lệ (khác kéo thân element = dời cả nhóm, xem Element.tsx#onFrameMany). */}
      {multi && onGroupResize && (
        <GroupResizeOverlay
          bbox={groupBoundingBox(
            slide.elements.filter((e) => selectedIds.includes(e.id)).map((e) => e.frame),
          )}
          stageRef={stageRef}
          onGroupResize={onGroupResize}
        />
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

      {/* menu chuột phải trên element — Popover tự lật hướng + chừa mép viewport (VIỆC 2, 28/07) */}
      {menu && (
        <Popover
          anchorX={menu.clientX}
          anchorY={menu.clientY}
          onDismiss={() => setMenu(null)}
          style={{
            // width CỐ ĐỊNH (không minWidth/maxWidth auto) — cố ý: box position:fixed có `left`
            // + width auto sẽ shrink-to-fit theo KHÔNG GIAN CÒN LẠI từ `left` tới mép viewport,
            // mà `left` lại tính TỪ chính width đó → vòng lặp phản hồi (test DOM thật bắt được
            // width tự phình 200→210→211px qua nhiều lần đo). max-width 240 (VIỆC 2b) áp cố định.
            width: 220,
            background: 'var(--panel)',
            border: '1px solid var(--border)',
            borderRadius: 14,
            padding: 4,
            boxShadow: '0 8px 24px rgba(0,0,0,.35)',
            userSelect: 'none',
          }}
        >
          {menu.kind === 'image' ? (
            // Menu ẢNH — nội dung + thứ tự chốt riêng (VIỆC 2c), KHÔNG dùng chung khối dưới.
            <>
              {onReplaceImage && (
                <MenuItem onClick={() => { onReplaceImage(menu.id); setMenu(null); }}>Thay ảnh…</MenuItem>
              )}
              <MenuItem onClick={() => { onEditImage(menu.id); setMenu(null); }}>Chỉnh ảnh (crop, màu)</MenuItem>
              {onEditImageAdvanced && (
                <MenuItem onClick={() => { onEditImageAdvanced(menu.id); setMenu(null); }}>Chỉnh nâng cao (Photoshop)</MenuItem>
              )}
              <MenuSep />
              <MenuItem shortcut="⌘D" onClick={() => { onDuplicate(); setMenu(null); }}>Nhân bản</MenuItem>
              <MenuItem shortcut="⌫" danger onClick={() => { onDelete(); setMenu(null); }}>Xoá</MenuItem>
              <MenuSep />
              <MenuItem shortcut="⌘⇧]" onClick={() => { onZOrder('front'); setMenu(null); }}>Đưa lên trước</MenuItem>
              <MenuItem shortcut="⌘⇧[" onClick={() => { onZOrder('back'); setMenu(null); }}>Đưa xuống sau</MenuItem>
              {(onGroup || onUngroup) && (selectedIds.length > 1 || slide.elements.some((e) => selectedIds.includes(e.id) && e.groupId)) && (
                <>
                  <MenuSep />
                  {onGroup && selectedIds.length > 1 && <MenuItem onClick={() => { onGroup(); setMenu(null); }}>Nhóm</MenuItem>}
                  {onUngroup && slide.elements.some((e) => selectedIds.includes(e.id) && e.groupId) && (
                    <MenuItem onClick={() => { onUngroup(); setMenu(null); }}>Bỏ nhóm</MenuItem>
                  )}
                </>
              )}
            </>
          ) : (
            <>
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
              <MenuItem shortcut="⌘D" onClick={() => { onDuplicate(); setMenu(null); }}>Nhân bản</MenuItem>
              <MenuItem onClick={() => { onZOrder('front'); setMenu(null); }}>Đưa lên trước</MenuItem>
              <MenuItem onClick={() => { onZOrder('forward'); setMenu(null); }}>Tiến 1 bậc</MenuItem>
              <MenuItem onClick={() => { onZOrder('backward'); setMenu(null); }}>Lùi 1 bậc</MenuItem>
              <MenuItem onClick={() => { onZOrder('back'); setMenu(null); }}>Đưa ra sau</MenuItem>
              <MenuItem onClick={() => { onToggleLock(); setMenu(null); }}>
                {menu.locked ? 'Mở khoá' : 'Khoá'}
              </MenuItem>
              {(onGroup || onUngroup) && (selectedIds.length > 1 || slide.elements.some((e) => selectedIds.includes(e.id) && e.groupId)) && (
                <>
                  <MenuSep />
                  {onGroup && selectedIds.length > 1 && <MenuItem onClick={() => { onGroup(); setMenu(null); }}>Nhóm</MenuItem>}
                  {onUngroup && slide.elements.some((e) => selectedIds.includes(e.id) && e.groupId) && (
                    <MenuItem onClick={() => { onUngroup(); setMenu(null); }}>Bỏ nhóm</MenuItem>
                  )}
                </>
              )}
              <MenuItem danger shortcut="⌫" onClick={() => { onDelete(); setMenu(null); }}>Xoá</MenuItem>
            </>
          )}
        </Popover>
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
            leftPct={textToolbarPos.left}
            topPct={textToolbarPos.top}
            below={textToolbarPos.below}
            hidden={textToolbarHidden}
            stageWidthPx={widthPx}
            onUpdate={(mutate, live) => onUpdateText(soleTextEl.id, mutate, live)}
            brand={brand}
            project={project}
            palette={palette}
            paintActive={!!paintFormat}
            onTogglePaint={() => toggleFormatPainter(soleTextEl)}
          />
        )}
      </div>
    </div>
  );
}

/**
 * E1 bổ sung (02/08) — khung bao quanh CẢ NHÓM đang chọn (multi) + 4 handle GÓC: kéo → scale cả
 * cụm theo tỉ lệ (docs/CHOT-NGUYEN-LIEU-EDITOR-2026-08-01.md, chốt giữa chuỗi 02/08 — "kéo góc
 * nhóm → SCALE CẢ CỤM theo tỉ lệ, KHÔNG phải khung đổi con giữ nguyên"). Khác Element.tsx (resize
 * 1 phần tử, 8 handle + xoay): ở đây CHỈ 4 GÓC — không có cạnh (n/s/e/w) và không có xoay, chuẩn
 * multi-select resize Figma/Canva (chỉ góc mới scale đồng bộ 2 trục, tránh resize tự do 1 trục
 * làm méo bố cục tương đối giữa các phần tử con). Khung bao tự vẽ NGOÀI (không chiếm pointer),
 * chỉ 4 handle góc bắt sự kiện — giống cách Element.tsx tách outline (pointerEvents:'none') khỏi
 * handle bắt kéo.
 */
function GroupResizeOverlay({
  bbox,
  stageRef,
  onGroupResize,
}: {
  bbox: { x: number; y: number; w: number; h: number };
  stageRef: React.RefObject<HTMLDivElement>;
  onGroupResize: (handle: 'nw' | 'ne' | 'sw' | 'se', dxPct: number, live: boolean) => void;
}) {
  const dragRef = useRef<{ handle: 'nw' | 'ne' | 'sw' | 'se'; startX: number; lastDx: number } | null>(null);

  function onDown(e: React.PointerEvent, handle: 'nw' | 'ne' | 'sw' | 'se') {
    e.stopPropagation();
    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      /* con trỏ không còn active (hiếm) — bỏ qua, vẫn kéo được qua move handler */
    }
    dragRef.current = { handle, startX: e.clientX, lastDx: 0 };
  }
  function onMove(e: React.PointerEvent) {
    const st = dragRef.current;
    const rect = stageRef.current?.getBoundingClientRect();
    if (!st || !rect) return;
    const dxPct = ((e.clientX - st.startX) / rect.width) * 100;
    st.lastDx = dxPct;
    onGroupResize(st.handle, dxPct, true);
  }
  function onUp(e: React.PointerEvent) {
    const st = dragRef.current;
    if (!st) return;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    // commit lần cuối bằng delta THẬT của lần move gần nhất (không dùng hack "0 = giữ nguyên"
    // như onFrameMany — ở đây đơn giản hơn: cứ truyền đúng số đo được).
    onGroupResize(st.handle, st.lastDx, false);
    dragRef.current = null;
  }

  const handles: Array<'nw' | 'ne' | 'sw' | 'se'> = ['nw', 'ne', 'sw', 'se'];
  const off = -6;
  const pos: Record<string, CSSProperties> = {
    nw: { left: off, top: off, cursor: 'nwse-resize' },
    ne: { right: off, top: off, cursor: 'nesw-resize' },
    sw: { left: off, bottom: off, cursor: 'nesw-resize' },
    se: { right: off, bottom: off, cursor: 'nwse-resize' },
  };

  return (
    <div
      style={{
        position: 'absolute',
        left: `${bbox.x}%`,
        top: `${bbox.y}%`,
        width: `${bbox.w}%`,
        height: `${bbox.h}%`,
        pointerEvents: 'none',
      }}
    >
      <div style={{ position: 'absolute', inset: 0, outline: '1.5px dashed var(--accent-ring)' }} />
      {handles.map((h) => (
        <span
          key={h}
          onPointerDown={(e) => onDown(e, h)}
          onPointerMove={onMove}
          onPointerUp={onUp}
          style={{
            position: 'absolute',
            width: 12,
            height: 12,
            background: 'var(--panel)',
            border: '2px solid var(--accent)',
            borderRadius: 3,
            zIndex: 2,
            pointerEvents: 'auto',
            ...pos[h],
          }}
        />
      ))}
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
export function cornerStyle(
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
  shortcut,
}: {
  children: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  /** gợi ý phím tắt, căn phải, chữ mờ (vd "⌘D") — chỉ hiển thị, phím thật đăng ký ở PresentEditor. */
  shortcut?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
        width: '100%',
        height: 34,
        textAlign: 'left',
        padding: '0 12px',
        borderRadius: 10,
        border: 'none',
        background: 'transparent',
        color: danger ? '#e5674f' : 'var(--t2)',
        fontSize: 13,
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--field)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      <span>{children}</span>
      {/* mã app không có token --text-muted riêng — dùng --t4 (chữ mờ nhất trong thang t1..t5). */}
      {shortcut && <span style={{ fontSize: 12, color: 'var(--t4)' }}>{shortcut}</span>}
    </button>
  );
}
