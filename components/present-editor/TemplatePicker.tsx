'use client';

/**
 * components/present-editor/TemplatePicker.tsx — Chọn template (Gợi ý + Tất cả).
 *
 * Hiển thị:
 *  - "Gợi ý" (từ suggestTemplate) đặt lên đầu + lý do.
 *  - "Bố cục" (builtin) và "Thư viện" (từ Reference layout/slide).
 * Áp template = build EditorSlide mới thay cho slide hiện tại (human-in-the-loop:
 * người dùng sửa tiếp tuỳ ý).
 */

import type { EditorTemplate } from '@/lib/present-editor/templates';
import { Sparkles } from 'lucide-react';

interface Props {
  templates: EditorTemplate[];
  suggestedId: string | null;
  suggestReason: string | null;
  onApply: (t: EditorTemplate) => void;
}

export default function TemplatePicker({ templates, suggestedId, suggestReason, onApply }: Props) {
  const suggested = templates.find((t) => t.id === suggestedId) ?? null;
  const builtin = templates.filter((t) => t.group === 'builtin');
  const library = templates.filter((t) => t.group === 'library');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {suggested && (
        <section>
          <Header icon={<Sparkles size={13} />}>Gợi ý cho slide này</Header>
          <Card t={suggested} highlight onApply={onApply} />
          {suggestReason && (
            <p style={{ fontSize: 11, color: 'var(--t3)', margin: '6px 2px 0', lineHeight: 1.4 }}>
              {suggestReason}
            </p>
          )}
        </section>
      )}

      <section>
        <Header>Bố cục dựng sẵn</Header>
        <Grid>
          {builtin.map((t) => (
            <Card key={t.id} t={t} onApply={onApply} />
          ))}
        </Grid>
      </section>

      {library.length > 0 && (
        <section>
          <Header>Từ thư viện Reference</Header>
          <Grid>
            {library.map((t) => (
              <Card key={t.id} t={t} onApply={onApply} />
            ))}
          </Grid>
        </section>
      )}
      {library.length === 0 && (
        <p style={{ fontSize: 11, color: 'var(--t4)', lineHeight: 1.4 }}>
          Chưa có ảnh bố cục trong thư viện. Gắn thẻ usage “layout” cho ảnh trong Reference để
          dùng làm template.
        </p>
      )}
    </div>
  );
}

function Header({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <h4
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: 0.4,
        textTransform: 'uppercase',
        color: 'var(--t3)',
        margin: '0 0 8px',
      }}
    >
      {icon}
      {children}
    </h4>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>{children}</div>
  );
}

function Card({
  t,
  onApply,
  highlight,
}: {
  t: EditorTemplate;
  onApply: (t: EditorTemplate) => void;
  highlight?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => onApply(t)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        padding: 8,
        borderRadius: 8,
        border: highlight ? '1.5px solid var(--accent)' : '1px solid var(--border)',
        background: highlight ? 'var(--accent-soft)' : 'var(--card)',
        cursor: 'pointer',
        textAlign: 'left',
        width: '100%',
      }}
    >
      <div
        style={{
          aspectRatio: '16 / 9',
          borderRadius: 5,
          border: '1px solid var(--border)',
          background: t.thumb ? `center/cover no-repeat url("${t.thumb}")` : 'var(--field)',
          display: 'grid',
          placeItems: 'center',
          color: 'var(--t4)',
          fontSize: 10,
        }}
      >
        {!t.thumb && <TemplateGlyph id={t.id} />}
      </div>
      <span style={{ fontSize: 11, color: 'var(--t2)', lineHeight: 1.25 }}>{t.name}</span>
    </button>
  );
}

/** Ký hoạ đơn giản gợi bố cục cho các preset builtin. */
function TemplateGlyph({ id }: { id: string }) {
  const stroke = 'var(--t4)';
  const box = (x: number, y: number, w: number, h: number, fill = 'var(--t5)') => (
    <rect x={x} y={y} width={w} height={h} rx={1.5} fill={fill} />
  );
  const line = (x: number, y: number, w: number) => (
    <rect x={x} y={y} width={w} height={2} rx={1} fill={stroke} />
  );
  let content: React.ReactNode = null;
  if (id === 'cover')
    content = (
      <>
        {line(6, 10, 22)}
        {line(6, 16, 16)}
        {box(50, 4, 44, 42)}
      </>
    );
  else if (id === 'content-image')
    content = (
      <>
        {line(6, 10, 20)}
        {line(6, 16, 24)}
        {line(6, 22, 22)}
        {box(56, 8, 38, 34)}
      </>
    );
  else if (id === 'two-column')
    content = (
      <>
        {line(6, 8, 30)}
        {line(6, 16, 34)}
        {line(6, 22, 30)}
        {line(54, 16, 34)}
        {line(54, 22, 30)}
      </>
    );
  else if (id === 'grid')
    content = (
      <>
        {box(6, 8, 40, 16)}
        {box(54, 8, 40, 16)}
        {box(6, 28, 40, 16)}
        {box(54, 28, 40, 16)}
      </>
    );
  else if (id === 'quote')
    content = (
      <>
        {line(30, 18, 40)}
        {line(34, 26, 32)}
      </>
    );
  else if (id === 'full-bleed')
    content = (
      <>
        {box(0, 0, 100, 50, 'var(--t4)')}
        {line(8, 38, 30)}
      </>
    );
  return (
    <svg viewBox="0 0 100 50" width="100%" height="100%" style={{ display: 'block' }}>
      {content}
    </svg>
  );
}
