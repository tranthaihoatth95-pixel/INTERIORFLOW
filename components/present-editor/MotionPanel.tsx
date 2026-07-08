'use client';

/**
 * components/present-editor/MotionPanel.tsx — Chọn HIỆU ỨNG chuyển động (kiểu Apple).
 *
 * User (round 2): thêm hiệu ứng chuyển slide/element kiểu Apple (spring, ease Apple),
 * có cơ chế chọn cho slide/deck. Tab này ở panel trái:
 *   - Chuyển slide (transition) + build-in phần tử (reveal) cho SLIDE hiện tại.
 *   - Nút "Áp cho cả deck" đặt cùng hiệu ứng cho mọi slide.
 *   - Nút "Trình chiếu thử" mở SlidePlayer để xem động.
 */

import type { EditorSlide, EditorDeck, SlideTransition, ElementReveal } from '@/lib/present-editor/model';
import { TRANSITION_OPTIONS, REVEAL_OPTIONS } from '@/lib/present-editor/motion-present';
import { Play, Layers } from 'lucide-react';

interface Props {
  slide: EditorSlide;
  deck: EditorDeck;
  onSetSlideTransition: (t: SlideTransition) => void;
  onSetSlideReveal: (r: ElementReveal) => void;
  onApplyDeck: (t: SlideTransition, r: ElementReveal) => void;
  onPlay: () => void;
}

export default function MotionPanel({
  slide,
  deck,
  onSetSlideTransition,
  onSetSlideReveal,
  onApplyDeck,
  onPlay,
}: Props) {
  const curT = slide.transition ?? deck.transition ?? 'fade';
  const curR = slide.reveal ?? deck.reveal ?? 'none';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <button type="button" onClick={onPlay} style={playBtn} title="Trình chiếu thử để xem hiệu ứng động">
        <Play size={14} /> Trình chiếu thử
      </button>

      <section>
        <Head>Chuyển vào slide này</Head>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {TRANSITION_OPTIONS.map((o) => (
            <OptBtn key={o.id} active={curT === o.id} onClick={() => onSetSlideTransition(o.id)} hint={o.hint}>
              {o.label}
            </OptBtn>
          ))}
        </div>
      </section>

      <section>
        <Head>Phần tử xuất hiện (build-in)</Head>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {REVEAL_OPTIONS.map((o) => (
            <OptBtn key={o.id} active={curR === o.id} onClick={() => onSetSlideReveal(o.id)} hint={o.hint}>
              {o.label}
            </OptBtn>
          ))}
        </div>
      </section>

      <button
        type="button"
        onClick={() => onApplyDeck(curT, curR)}
        style={deckBtn}
        title="Đặt hiệu ứng này cho tất cả slide trong deck"
      >
        <Layers size={13} /> Áp cho cả deck
      </button>

      <p style={{ fontSize: 10, color: 'var(--t4)', lineHeight: 1.4, margin: 0 }}>
        Hiệu ứng theo nhịp Apple (spring iOS + ease keynote). Chỉ hiển thị khi TRÌNH CHIẾU —
        không đổi bố cục tĩnh nên PDF/PPTX vẫn giữ nguyên.
      </p>
    </div>
  );
}

function Head({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 11,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: 0.4,
        color: 'var(--t3)',
        margin: '0 0 8px',
      }}
    >
      {children}
    </div>
  );
}

function OptBtn({
  active,
  onClick,
  hint,
  children,
}: {
  active: boolean;
  onClick: () => void;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={hint}
      style={{
        padding: '8px 6px',
        borderRadius: 8,
        border: active ? '1.5px solid var(--accent)' : '1px solid var(--border)',
        background: active ? 'var(--accent-soft)' : 'var(--field)',
        color: active ? 'var(--accent)' : 'var(--t2)',
        fontSize: 12,
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  );
}

const playBtn: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  padding: '9px',
  borderRadius: 8,
  border: '1px solid var(--accent)',
  background: 'var(--accent)',
  color: '#fff',
  fontSize: 13,
  cursor: 'pointer',
};

const deckBtn: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  padding: '8px',
  borderRadius: 8,
  border: '1px solid var(--border)',
  background: 'var(--field)',
  color: 'var(--t2)',
  fontSize: 12,
  cursor: 'pointer',
};
