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

import { useEffect, useRef, useState } from 'react';
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
} from 'lucide-react';

interface Props {
  el: TextElement;
  /** vị trí pill theo % sân khấu (căn tâm ngang của element; mép trên hoặc dưới). */
  leftPct: number;
  topPct: number;
  /** true = đặt pill BÊN DƯỚI element (khi sát mép trên). */
  below?: boolean;
  onUpdate: (mutate: (el: TextElement) => void, live?: boolean) => void;
  /** ngữ cảnh để AI viết đúng giọng. */
  brand?: string;
  project?: string;
}

export default function TextToolbar({ el, leftPct, topPct, below, onUpdate, brand, project }: Props) {
  const [aiBusy, setAiBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [colorOpen, setColorOpen] = useState(false);
  const noteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (noteTimer.current) clearTimeout(noteTimer.current);
    };
  }, []);

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
      className="pe-textbar"
      // chặn pointerdown xuống canvas (tránh bỏ chọn / bắt đầu marquee).
      onPointerDown={(e) => e.stopPropagation()}
      style={{
        position: 'absolute',
        left: `${leftPct}%`,
        top: `${topPct}%`,
        transform: `translate(-50%, ${below ? '0' : '-100%'})`,
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
        <span style={{ fontSize: 11, color: 'var(--t3)', minWidth: 26, textAlign: 'center' }}>
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

        {/* màu chữ trực tiếp */}
        <button
          type="button"
          onClick={() => setColorOpen((v) => !v)}
          title="Màu chữ"
          style={{ ...pillIcon, position: 'relative' }}
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
          <input
            type="color"
            value={/^#[0-9a-fA-F]{6}$/.test(el.color) ? el.color : '#221f1a'}
            onChange={(e) => onUpdate((t) => (t.color = e.target.value))}
            aria-label="Chọn màu chữ"
            style={{
              position: 'absolute',
              inset: 0,
              opacity: 0,
              cursor: 'pointer',
              // giữ open khi bấm swatch (một số trình duyệt cần click input)
              pointerEvents: colorOpen ? 'auto' : 'auto',
            }}
          />
        </button>
      </div>

      {note && <div style={noteStyle}>{note}</div>}
    </div>
  );

  function setAlign(a: TextAlign) {
    onUpdate((t) => (t.align = a));
  }
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
        color: active ? 'var(--accent)' : 'var(--t2)',
        boxShadow: active ? 'inset 0 0 0 1px var(--accent-ring)' : 'none',
      }}
    >
      {children}
    </button>
  );
}

function Sep() {
  return <span style={{ width: 1, height: 18, background: 'var(--border)', margin: '0 1px', flexShrink: 0 }} />;
}

const pillWrap: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 3,
  padding: '5px 8px',
  borderRadius: 999,
  background: 'var(--panel)',
  border: '1px solid var(--border)',
  boxShadow: '0 8px 28px rgba(0,0,0,.32), 0 1px 0 rgba(255,255,255,.04) inset',
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
  color: 'var(--t2)',
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
  color: 'var(--t2)',
  cursor: 'pointer',
  flexShrink: 0,
};

const noteStyle: React.CSSProperties = {
  maxWidth: 320,
  padding: '6px 10px',
  borderRadius: 8,
  background: 'var(--card)',
  border: '1px solid var(--border)',
  color: 'var(--t2)',
  fontSize: 11,
  lineHeight: 1.4,
  boxShadow: '0 6px 20px rgba(0,0,0,.3)',
  textAlign: 'center',
};
