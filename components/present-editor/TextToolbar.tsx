'use client';

/**
 * components/present-editor/TextToolbar.tsx — Thanh chỉnh CHỮ nổi (pill) tự hiện khi chọn
 * đúng 1 text layer (góp ý #1 & #10, ảnh qab3/wzvd).
 *
 * Dạng pill nổi quiet-luxury (neomorphic nhẹ): ✨ Tạo content · cỡ chữ · B/I/U · căn lề
 * (trái/giữa/phải) · bullet · đánh số · màu chữ. Bám gần khung text đang chọn (đặt phía trên,
 * tự lật xuống nếu chạm mép trên). Không đụng model trực tiếp — mọi thay đổi qua onUpdate.
 *
 * "Tạo content": gọi /api/present/text (NVIDIA LLM free). Chưa có key / hết free → hiện báo
 * ngắn ngay trên pill (human-in-loop, không tự bịa).
 */

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { TextElement, TextAlign, ListStyle } from '@/lib/present-editor/model';
import { effectiveListStyle } from '@/lib/present-editor/model';
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Sparkles,
  Loader2,
  Minus,
  Plus,
  Paintbrush,
} from 'lucide-react';

interface Props {
  el: TextElement;
  /** vị trí pill theo % sân khấu (căn tâm ngang của element; mép trên hoặc dưới). */
  leftPct: number;
  topPct: number;
  /** true = đặt pill BÊN DƯỚI element (khi sát mép trên). */
  below?: boolean;
  /** rộng sân khấu (px) hiện tại — CHỈ dùng để buộc đo lại clamp-viewport khi zoom đổi (leftPct/
   * topPct không đổi lúc zoom vì vẫn là % sân khấu, nhưng vị trí PX thật thì đổi). */
  stageWidthPx?: number;
  onUpdate: (mutate: (el: TextElement) => void, live?: boolean) => void;
  /** ngữ cảnh để AI viết đúng giọng. */
  brand?: string;
  project?: string;
  /** palette gu của deck (6 màu, `EditorDeck.palette`) — cho bảng màu chữ nhanh. */
  palette?: string[];
  /** Format Painter (sao chép định dạng) — trạng thái + toggle do EditorCanvas quản lý vì cần
   * biết click TIẾP THEO rơi vào element nào (áp định dạng) trước khi tới lượt TextToolbar. */
  paintActive?: boolean;
  onTogglePaint?: () => void;
}

export default function TextToolbar({
  el,
  leftPct,
  topPct,
  below,
  stageWidthPx,
  onUpdate,
  brand,
  project,
  palette,
  paintActive,
  onTogglePaint,
}: Props) {
  const [aiBusy, setAiBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [colorOpen, setColorOpen] = useState(false);
  const noteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [dx, setDx] = useState(0);

  useEffect(() => {
    return () => {
      if (noteTimer.current) clearTimeout(noteTimer.current);
    };
  }, []);

  // Đóng popover màu khi bấm ra ngoài TOÀN BỘ toolbar (nền/element khác) hoặc Esc. Dùng
  // wrapRef (cả pill) chứ không phải riêng nút màu — popover render NGOÀI `.pe-pill` (là
  // container cuộn ngang overflowX:auto, mà CSS quy đổi overflowY thành 'auto' theo — sẽ CẮT
  // mất popover nếu lồng bên trong, xem ColorPopover bên dưới).
  useEffect(() => {
    if (!colorOpen) return;
    function onDocPointerDown(e: PointerEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setColorOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setColorOpen(false);
    }
    window.addEventListener('pointerdown', onDocPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('pointerdown', onDocPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [colorOpen]);

  /* Clamp trong VIEWPORT BROWSER thật (không chỉ trong slide) — nếu textbox nằm sát mép
   * PHẢI/TRÁI slide, toolbar (canh giữa theo textbox bằng translate(-50%,...)) có thể tràn
   * ra ngoài màn hình nhìn thấy được (không phải bị cha overflow:hidden cắt, mà đơn giản là
   * ở ngoài viewport). Đo bằng getBoundingClientRect sau khi render rồi dịch lại bằng
   * translateX(dx) nếu tràn (góp ý ảnh chụp thật: chấm màu cuối toolbar mất ở mép phải). */
  useLayoutEffect(() => {
    const node = wrapRef.current;
    if (!node) return;
    const margin = 8;

    function recompute() {
      if (!node) return;
      const rect = node.getBoundingClientRect();
      // rect đã bao gồm dx hiện tại — quy về vị trí "gốc" (dx=0) trước khi tính lại.
      setDx((prevDx) => {
        const baseLeft = rect.left - prevDx;
        const baseRight = baseLeft + rect.width;
        const minLeft = margin;
        const maxRight = window.innerWidth - margin;
        let next = prevDx;
        if (baseLeft < minLeft) next = minLeft - baseLeft;
        else if (baseRight > maxRight) next = maxRight - baseRight;
        return Math.abs(next - prevDx) < 0.5 ? prevDx : next;
      });
    }

    recompute();
    const ro = new ResizeObserver(recompute);
    ro.observe(node);
    window.addEventListener('resize', recompute);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', recompute);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leftPct, topPct, below, el.id, stageWidthPx]);

  const flash = (msg: string) => {
    setNote(msg);
    if (noteTimer.current) clearTimeout(noteTimer.current);
    noteTimer.current = setTimeout(() => setNote(null), 4200);
  };

  const list = effectiveListStyle(el);
  const setList = (s: ListStyle) =>
    onUpdate((t) => {
      t.listStyle = s;
      t.bullet = s === 'bullet'; // giữ đồng bộ field cũ
    });

  async function onGenerate() {
    if (aiBusy) return;
    setAiBusy(true);
    setNote(null);
    try {
      const r = await fetch('/api/present/text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: el.role ?? 'free',
          current: el.text,
          brand,
          project,
        }),
      });
      const d = await r.json().catch(() => ({}));
      if (r.ok && d.text) {
        onUpdate((t) => (t.text = d.text));
        flash('Đã đề xuất nội dung — sửa tiếp nếu cần.');
      } else if (d.code === 'NVIDIA_NOT_CONFIGURED') {
        flash('Chưa nối NVIDIA. Thêm NVIDIA_API_KEY (build.nvidia.com) để bật Tạo content.');
      } else if (d.code === 'NVIDIA_FREE_EXHAUSTED') {
        flash('NVIDIA free hết lượt — thử lại sau.');
      } else {
        flash(d.error || 'Không tạo được nội dung.');
      }
    } catch {
      flash('Lỗi mạng khi tạo nội dung.');
    } finally {
      setAiBusy(false);
    }
  }

  const size = el.fontSize;
  const bumpSize = (d: number) =>
    onUpdate((t) => (t.fontSize = Math.max(1, Math.min(20, +(t.fontSize + d).toFixed(1)))));

  return (
    <div
      ref={wrapRef}
      className="pe-textbar"
      // chặn pointerdown xuống canvas (tránh bỏ chọn / bắt đầu marquee).
      onPointerDown={(e) => e.stopPropagation()}
      style={{
        position: 'absolute',
        left: `${leftPct}%`,
        top: `${topPct}%`,
        transform: `translate(calc(-50% + ${dx}px), ${below ? '0' : '-100%'})`,
        marginTop: below ? 10 : -10,
        zIndex: 40,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        pointerEvents: 'auto',
      }}
    >
      <div className="pe-pill" style={pillWrap}>
        {/* ✨ Tạo content */}
        <button
          type="button"
          onClick={onGenerate}
          disabled={aiBusy}
          title="Tạo / gợi ý nội dung (AI)"
          style={{ ...pillBtn, ...aiBtn }}
        >
          {aiBusy ? <Loader2 size={13} className="pe-spin" /> : <Sparkles size={13} />}
          <span style={{ fontSize: 11.5, fontWeight: 600 }}>Tạo content</span>
        </button>

        <Sep />

        {/* cỡ chữ */}
        <button type="button" onClick={() => bumpSize(-0.4)} title="Giảm cỡ chữ" style={pillIcon}>
          <Minus size={13} />
        </button>
        <span style={{ fontSize: 11, color: GLASS_TEXT_DIM, minWidth: 26, textAlign: 'center' }}>
          {size.toFixed(1)}
        </span>
        <button type="button" onClick={() => bumpSize(0.4)} title="Tăng cỡ chữ" style={pillIcon}>
          <Plus size={13} />
        </button>

        <Sep />

        {/* B / I / U */}
        <Toggle active={el.bold} onClick={() => onUpdate((t) => (t.bold = !t.bold))} title="Đậm (B)">
          <Bold size={14} />
        </Toggle>
        <Toggle active={el.italic} onClick={() => onUpdate((t) => (t.italic = !t.italic))} title="Nghiêng (I)">
          <Italic size={14} />
        </Toggle>
        <Toggle active={!!el.underline} onClick={() => onUpdate((t) => (t.underline = !t.underline))} title="Gạch chân (U)">
          <Underline size={14} />
        </Toggle>

        <Sep />

        {/* căn lề */}
        <Toggle active={el.align === 'left'} onClick={() => setAlign('left')} title="Căn trái">
          <AlignLeft size={14} />
        </Toggle>
        <Toggle active={el.align === 'center'} onClick={() => setAlign('center')} title="Căn giữa">
          <AlignCenter size={14} />
        </Toggle>
        <Toggle active={el.align === 'right'} onClick={() => setAlign('right')} title="Căn phải">
          <AlignRight size={14} />
        </Toggle>

        <Sep />

        {/* danh sách: bullet / đánh số */}
        <Toggle active={list === 'bullet'} onClick={() => setList(list === 'bullet' ? 'none' : 'bullet')} title="Gạch đầu dòng">
          <List size={14} />
        </Toggle>
        <Toggle active={list === 'number'} onClick={() => setList(list === 'number' ? 'none' : 'number')} title="Đánh số tự động">
          <ListOrdered size={14} />
        </Toggle>

        <Sep />

        {/* màu chữ — bấm mở bảng màu nhanh (palette gu deck + đen/trắng + tuỳ chỉnh) */}
        <button
          type="button"
          onClick={() => setColorOpen((v) => !v)}
          title="Màu chữ"
          style={pillIcon}
        >
          <span
            style={{
              width: 16,
              height: 16,
              borderRadius: '50%',
              background: /^#[0-9a-fA-F]{6}$/.test(el.color) ? el.color : '#221f1a',
              border: '1.5px solid rgba(255,255,255,.7)',
              boxShadow: '0 0 0 1px var(--border)',
            }}
          />
        </button>

        {onTogglePaint && (
          <>
            <Sep />
            {/* Format Painter — copy định dạng (font/cỡ/màu/đậm/nghiêng/gạch chân/căn lề/
                tracking/lineHeight/bullet) của element này để áp sang element khác. Bấm lại
                hoặc Esc để huỷ (xử lý ở EditorCanvas — cần biết click TIẾP THEO). */}
            <Toggle active={!!paintActive} onClick={onTogglePaint} title="Format Painter — sao chép định dạng">
              <Paintbrush size={14} />
            </Toggle>
          </>
        )}
      </div>

      {/* Bảng màu chữ nhanh — render NGOÀI `.pe-pill` (sibling, dòng chảy bình thường như
          `note` bên dưới), KHÔNG lồng absolute bên trong pill: pill cuộn ngang (overflowX:
          auto) khiến CSS tự quy overflowY thành 'auto' luôn → sẽ CẮT MẤT popover nếu đặt absolute
          bên trong nó. */}
      {colorOpen && (
        <ColorPopover
          color={el.color}
          palette={palette}
          onPick={(c) => {
            onUpdate((t) => (t.color = c));
            setColorOpen(false);
          }}
        />
      )}

      {note && <div style={noteStyle}>{note}</div>}
    </div>
  );

  function setAlign(a: TextAlign) {
    onUpdate((t) => (t.align = a));
  }
}

/** Lưới màu nhanh: palette gu deck (tối đa 6) + đen + trắng + 1 ô "màu tuỳ chỉnh" — tái dùng
 * đúng pattern `input[type=color]` của `ColorRow` (Inspector.tsx/BrandKitPanel.tsx), chỉ đổi
 * vỏ ngoài cho khớp pill kính mờ tối của TextToolbar. */
function ColorPopover({
  color,
  palette,
  onPick,
}: {
  color: string;
  palette?: string[];
  onPick: (c: string) => void;
}) {
  const swatches = [...new Set([...(palette || []), '#ffffff', '#000000'])].slice(0, 8);
  const customValue = /^#[0-9a-fA-F]{6}$/.test(color) ? color : '#221f1a';
  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 22px)',
        gap: 6,
        padding: 8,
        borderRadius: 10,
        background: 'rgba(18,16,14,0.86)',
        backdropFilter: 'blur(28px) saturate(150%)',
        WebkitBackdropFilter: 'blur(28px) saturate(150%)',
        border: '1px solid rgba(255,255,255,.14)',
        boxShadow: '0 8px 28px rgba(0,0,0,.38)',
      }}
    >
      {swatches.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onPick(c)}
          title={c}
          style={{
            width: 22,
            height: 22,
            borderRadius: 5,
            background: c,
            border:
              color.toLowerCase() === c.toLowerCase()
                ? '2px solid var(--accent)'
                : '1px solid rgba(255,255,255,.3)',
            cursor: 'pointer',
            padding: 0,
          }}
        />
      ))}
      {/* ô "màu tuỳ chỉnh" — ĐÚNG pattern input[type=color] của ColorRow (Inspector.tsx/
          BrandKitPanel.tsx), chỉ thu nhỏ cho khớp lưới 22px của popover này. */}
      <input
        type="color"
        title="Màu tuỳ chỉnh"
        value={customValue}
        onChange={(e) => onPick(e.target.value)}
        aria-label="Chọn màu chữ tuỳ chỉnh"
        style={{
          width: 22,
          height: 22,
          borderRadius: 5,
          border: '1px solid rgba(255,255,255,.3)',
          background: 'none',
          padding: 0,
          cursor: 'pointer',
        }}
      />
    </div>
  );
}

/* ------------------------------- UI bits ------------------------------- */
function Toggle({
  children,
  active,
  onClick,
  title,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      style={{
        ...pillIcon,
        background: active ? 'var(--accent-soft)' : 'transparent',
        color: active ? 'var(--accent)' : GLASS_TEXT,
        boxShadow: active ? 'inset 0 0 0 1px var(--accent-ring)' : 'none',
      }}
    >
      {children}
    </button>
  );
}

function Sep() {
  return <span style={{ width: 1, height: 18, background: 'rgba(255,255,255,.16)', margin: '0 1px', flexShrink: 0 }} />;
}

/* Vật liệu "kính mờ tối" (dark frosted glass) — CỐ Ý không dùng --panel/--t2 theo theme:
 * pill nổi TRÊN slide có thể ở BẤT KỲ nền màu nào (be/kem quiet-luxury hay tối), nên chữ/icon
 * cần tương phản CỐ ĐỊNH bất kể theme sáng/tối của app (giống cách LoginBackdrop.tsx và
 * CadToolbar.tsx xử lý chrome nổi). Đã thử mắt qua browser vài mức blur/alpha trước khi chốt. */
const GLASS_TEXT = 'rgba(245,242,236,0.95)'; // chữ/icon — ấm nhẹ, khớp gu quiet-luxury
const GLASS_TEXT_DIM = 'rgba(245,242,236,0.62)';

const pillWrap: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 3,
  padding: '5px 8px',
  borderRadius: 999,
  background: 'rgba(18,16,14,0.62)',
  backdropFilter: 'blur(28px) saturate(150%)',
  WebkitBackdropFilter: 'blur(28px) saturate(150%)',
  border: '1px solid rgba(255,255,255,.14)',
  boxShadow: '0 8px 28px rgba(0,0,0,.38), 0 1px 0 rgba(255,255,255,.06) inset',
  maxWidth: '92vw',
  overflowX: 'auto',
  scrollbarWidth: 'none',
};

const pillBtn: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 5,
  padding: '5px 9px',
  borderRadius: 999,
  border: 'none',
  background: 'transparent',
  color: GLASS_TEXT,
  cursor: 'pointer',
  flexShrink: 0,
};

const aiBtn: React.CSSProperties = {
  background: 'var(--accent-soft)',
  color: 'var(--accent)',
};

const pillIcon: React.CSSProperties = {
  display: 'grid',
  placeItems: 'center',
  gap: 4,
  width: 30,
  height: 30,
  borderRadius: 999,
  border: 'none',
  background: 'transparent',
  color: GLASS_TEXT,
  cursor: 'pointer',
  flexShrink: 0,
};

const noteStyle: React.CSSProperties = {
  maxWidth: 320,
  padding: '6px 10px',
  borderRadius: 8,
  background: 'rgba(18,16,14,0.72)',
  backdropFilter: 'blur(24px) saturate(150%)',
  WebkitBackdropFilter: 'blur(24px) saturate(150%)',
  border: '1px solid rgba(255,255,255,.14)',
  color: GLASS_TEXT,
  fontSize: 11,
  lineHeight: 1.4,
  boxShadow: '0 6px 20px rgba(0,0,0,.3)',
  textAlign: 'center',
};
