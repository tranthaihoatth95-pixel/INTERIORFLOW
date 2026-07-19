'use client';

/**
 * components/present-editor/MotionPanel.tsx — Chọn HIỆU ỨNG chuyển động (kiểu Apple).
 *
 * User (round 2): thêm hiệu ứng chuyển slide/element kiểu Apple (spring, ease Apple),
 * có cơ chế chọn cho slide/deck. Tab này ở panel trái:
 *   - Chuyển slide (transition) + build-in phần tử (reveal) cho SLIDE hiện tại.
 *   - Nút "Áp cho cả deck" đặt cùng hiệu ứng cho mọi slide.
 *   - Nút "Trình chiếu thử" mở SlidePlayer để xem động.
 *
 * Round 3 — Animation Pane THEO OBJECT: danh sách mọi phần tử của slide (pattern UI mượn từ
 * LayerPanel.tsx — icon loại + tên + kéo-thả đổi thứ tự), mỗi dòng chỉnh RIÊNG:
 *   - kiểu build-in ("Theo slide" = kế thừa mục "Phần tử xuất hiện" ở trên, hoặc ghi đè riêng).
 *   - thứ tự xuất hiện (revealOrder, kéo-thả HOẶC gõ số) + độ trễ riêng (revealDelay, giây).
 * Field mới đều OPTIONAL — không đụng gì thì slide chạy y hệt trước (xem
 * lib/present-editor/motion-present.ts#computeElementRevealTimings).
 */

import { useState } from 'react';
import type {
  EditorSlide,
  EditorDeck,
  SlideTransition,
  ElementReveal,
} from '@/lib/present-editor/model';
import { TRANSITION_OPTIONS, REVEAL_OPTIONS } from '@/lib/present-editor/motion-present';
import { KindIcon, displayName } from './LayerPanel';
import { Play, Layers, GripVertical } from 'lucide-react';

interface Props {
  slide: EditorSlide;
  deck: EditorDeck;
  onSetSlideTransition: (t: SlideTransition) => void;
  onSetSlideReveal: (r: ElementReveal) => void;
  onApplyDeck: (t: SlideTransition, r: ElementReveal) => void;
  onPlay: () => void;
  /** Animation Pane theo object (mới) — chỉnh 1 element BẤT KỲ, không cần đang chọn. */
  onSetElementReveal: (id: string, reveal: ElementReveal | undefined) => void;
  onSetElementRevealOrder: (id: string, order: number | undefined) => void;
  onSetElementRevealDelay: (id: string, delaySec: number | undefined) => void;
  onReorderElementReveal: (orderedIds: string[]) => void;
}

export default function MotionPanel({
  slide,
  deck,
  onSetSlideTransition,
  onSetSlideReveal,
  onApplyDeck,
  onPlay,
  onSetElementReveal,
  onSetElementRevealOrder,
  onSetElementRevealDelay,
  onReorderElementReveal,
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
        <p style={{ fontSize: 10, color: 'var(--t4)', lineHeight: 1.4, margin: '6px 0 0' }}>
          Mặc định cho MỌI phần tử của slide này — chỉnh riêng từng phần tử ở danh sách dưới.
        </p>
      </section>

      <section>
        <Head>Thứ tự · độ trễ từng phần tử (Animation Pane)</Head>
        <ElementRevealList
          slide={slide}
          onSetReveal={onSetElementReveal}
          onSetOrder={onSetElementRevealOrder}
          onSetDelay={onSetElementRevealDelay}
          onReorder={onReorderElementReveal}
        />
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

/** Danh sách phần tử của slide hiện tại — mỗi dòng chỉnh reveal/thứ tự/độ trễ RIÊNG. */
function ElementRevealList({
  slide,
  onSetReveal,
  onSetOrder,
  onSetDelay,
  onReorder,
}: {
  slide: EditorSlide;
  onSetReveal: (id: string, reveal: ElementReveal | undefined) => void;
  onSetOrder: (id: string, order: number | undefined) => void;
  onSetDelay: (id: string, delaySec: number | undefined) => void;
  onReorder: (orderedIds: string[]) => void;
}) {
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);

  // Thứ tự hiển thị = thứ tự xuất hiện HIỆU DỤNG (revealOrder nếu có, không thì chỉ số mảng gốc)
  // — khớp đúng lô-gic computeElementRevealTimings để danh sách phản ánh thứ tự trình chiếu thật.
  const rows = slide.elements
    .map((el, index) => ({ el, index }))
    .sort((a, b) => {
      const oa = a.el.revealOrder ?? a.index;
      const ob = b.el.revealOrder ?? b.index;
      if (oa !== ob) return oa - ob;
      return a.index - b.index;
    });

  if (rows.length === 0) {
    return <p style={{ fontSize: 11, color: 'var(--t4)', margin: '2px 0' }}>Slide chưa có phần tử.</p>;
  }

  function commitReorder(fromPos: number, toPos: number) {
    const ids = rows.map((r) => r.el.id);
    const [moved] = ids.splice(fromPos, 1);
    ids.splice(toPos, 0, moved);
    onReorder(ids);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {rows.map(({ el }, pos) => {
        const isOver = overIdx === pos && dragIdx !== null && dragIdx !== pos;
        return (
          <div
            key={el.id}
            draggable
            onDragStart={() => setDragIdx(pos)}
            onDragOver={(e) => {
              e.preventDefault();
              setOverIdx(pos);
            }}
            onDrop={(e) => {
              e.preventDefault();
              if (dragIdx !== null && dragIdx !== pos) commitReorder(dragIdx, pos);
              setDragIdx(null);
              setOverIdx(null);
            }}
            onDragEnd={() => {
              setDragIdx(null);
              setOverIdx(null);
            }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              padding: '7px 8px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: isOver ? 'var(--hover)' : 'var(--field)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <GripVertical size={12} style={{ color: 'var(--t4)', cursor: 'grab', flexShrink: 0 }} />
              <KindIcon kind={el.kind} />
              <span
                style={{
                  flex: 1,
                  fontSize: 11.5,
                  color: 'var(--t2)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={displayName(el)}
              >
                {pos + 1}. {displayName(el)}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 64px 72px', gap: 5 }}>
              <select
                value={el.elementReveal ?? ''}
                onChange={(e) => onSetReveal(el.id, e.target.value ? (e.target.value as ElementReveal) : undefined)}
                title="Kiểu build-in riêng — bỏ trống = theo slide"
                style={selectStyle}
              >
                <option value="">Theo slide</option>
                {REVEAL_OPTIONS.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={el.revealOrder ?? ''}
                placeholder={String(pos)}
                onChange={(e) => onSetOrder(el.id, e.target.value === '' ? undefined : Number(e.target.value))}
                title="Thứ tự xuất hiện — số nhỏ hơn ra trước (bỏ trống = theo thứ tự này)"
                style={inputStyle}
              />
              <input
                type="number"
                step={0.1}
                min={0}
                value={el.revealDelay ?? ''}
                placeholder="auto"
                onChange={(e) => onSetDelay(el.id, e.target.value === '' ? undefined : Number(e.target.value))}
                title="Độ trễ riêng (giây) — bỏ trống = tự tính theo thứ tự"
                style={inputStyle}
              />
            </div>
          </div>
        );
      })}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 64px 72px', gap: 5, padding: '0 8px' }}>
        <Label>Kiểu</Label>
        <Label>Thứ tự</Label>
        <Label>Trễ (s)</Label>
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <span style={{ fontSize: 9.5, color: 'var(--t4)', textAlign: 'center' }}>{children}</span>;
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

const selectStyle: React.CSSProperties = {
  padding: '5px 4px',
  borderRadius: 6,
  border: '1px solid var(--border)',
  background: 'var(--panel)',
  color: 'var(--t2)',
  fontSize: 11,
  minWidth: 0,
};

const inputStyle: React.CSSProperties = {
  padding: '5px 4px',
  borderRadius: 6,
  border: '1px solid var(--border)',
  background: 'var(--panel)',
  color: 'var(--t2)',
  fontSize: 11,
  minWidth: 0,
  width: '100%',
};
