'use client';

/**
 * components/present-editor/TemplatePicker.tsx — Chọn template (Gợi ý + theo nhóm).
 *
 * Thumbnail = PREVIEW THẬT: build EditorSlide từ template (nội dung mẫu + palette gu),
 * render qua renderEditorSlide → dataURL. Nhờ vậy mọi template (builtin + mới + thư viện)
 * hiển thị đúng bố cục, khỏi vẽ glyph tay. Ô ảnh trống = khối placeholder trong chính
 * template nên preview vẫn "đọc" được ngay.
 *
 * Nhóm hiển thị:
 *  - "Gợi ý" (từ suggestTemplate) đặt lên đầu.
 *  - builtin gom theo category (CATEGORY_ORDER).
 *  - "Thư viện" (từ Reference layout/slide).
 * Áp template = build EditorSlide mới thay slide hiện tại (human-in-the-loop).
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import type { EditorTemplate, TemplateCategory } from '@/lib/present-editor/templates';
import { CATEGORY_ORDER } from '@/lib/present-editor/templates';
import type { FontPairing } from '@/lib/slides';
import { renderEditorSlide } from '@/lib/present-editor/render';
import { Sparkles, Search } from 'lucide-react';

interface Props {
  templates: EditorTemplate[];
  suggestedId: string | null;
  suggestReason: string | null;
  onApply: (t: EditorTemplate) => void;
  palette?: string[];
  fonts?: FontPairing;
}

/** Nội dung mẫu để render preview (không đụng deck thật). */
const PREVIEW_CTX = {
  kicker: 'Concept',
  title: 'Không gian sống',
  body: ['Ánh sáng tự nhiên', 'Vật liệu ấm', 'Tỉ lệ cân bằng', 'Chi tiết tinh tế'],
  images: [] as string[],
};

export default function TemplatePicker({
  templates,
  suggestedId,
  suggestReason,
  onApply,
  palette,
  fonts,
}: Props) {
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const match = (t: EditorTemplate) =>
    !q || t.name.toLowerCase().includes(q) || (t.category ?? '').toLowerCase().includes(q);

  const suggested = q ? null : templates.find((t) => t.id === suggestedId) ?? null;
  const allBuiltin = templates.filter((t) => t.group === 'builtin');
  const builtin = allBuiltin.filter(match);
  const library = templates.filter((t) => t.group === 'library' && match(t));

  // Render preview cho từng builtin template → dataURL (cache theo id + palette).
  // Render TẤT CẢ builtin (không phụ thuộc bộ lọc tìm kiếm) để gõ tìm không render lại.
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const paletteKey = (palette ?? []).join(',');
  const doneRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    // đổi palette → render lại
    doneRef.current = new Set();
    setPreviews({});
    let alive = true;
    (async () => {
      for (const t of allBuiltin) {
        if (!alive) return;
        if (doneRef.current.has(t.id)) continue;
        try {
          const slide = t.build({ ...PREVIEW_CTX, palette, fonts });
          const url = await renderEditorSlide(slide, fonts ?? 'Editorial');
          if (!alive) return;
          doneRef.current.add(t.id);
          setPreviews((p) => ({ ...p, [t.id]: url }));
        } catch {
          /* bỏ qua template lỗi preview */
        }
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paletteKey, fonts, allBuiltin.length]);

  // builtin gom theo category, giữ thứ tự CATEGORY_ORDER.
  const grouped = useMemo(() => {
    const map = new Map<TemplateCategory, EditorTemplate[]>();
    for (const t of builtin) {
      const cat = (t.category ?? 'Nội dung') as TemplateCategory;
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(t);
    }
    return CATEGORY_ORDER.filter((c) => map.has(c)).map((c) => ({ cat: c, items: map.get(c)! }));
  }, [builtin]);

  const empty = !builtin.length && !library.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* ô tìm mẫu */}
      <div style={{ position: 'relative' }}>
        <Search
          size={14}
          style={{ position: 'absolute', left: 9, top: 9, color: 'var(--t4)', pointerEvents: 'none' }}
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm mẫu (bìa, moodboard, so sánh…)"
          style={{
            width: '100%',
            padding: '7px 9px 7px 28px',
            borderRadius: 8,
            border: '1px solid var(--border)',
            background: 'var(--field)',
            color: 'var(--t1)',
            fontSize: 12,
          }}
        />
      </div>

      {empty && (
        <p style={{ fontSize: 12, color: 'var(--t4)', lineHeight: 1.5 }}>
          Không có mẫu khớp “{query}”. Xoá từ khoá để xem tất cả.
        </p>
      )}

      {suggested && (
        <section>
          <Header icon={<Sparkles size={13} />}>Gợi ý cho slide này</Header>
          <Card t={suggested} highlight onApply={onApply} preview={previews[suggested.id]} />
          {suggestReason && (
            <p style={{ fontSize: 11, color: 'var(--t3)', margin: '6px 2px 0', lineHeight: 1.4 }}>
              {suggestReason}
            </p>
          )}
        </section>
      )}

      {grouped.map(({ cat, items }) => (
        <section key={cat}>
          <Header>{cat}</Header>
          <Grid>
            {items.map((t) => (
              <Card key={t.id} t={t} onApply={onApply} preview={previews[t.id]} />
            ))}
          </Grid>
        </section>
      ))}

      {library.length > 0 && (
        <section>
          <Header>Từ thư viện Reference</Header>
          <Grid>
            {library.map((t) => (
              <Card key={t.id} t={t} onApply={onApply} preview={t.thumb ?? undefined} />
            ))}
          </Grid>
        </section>
      )}
      {library.length === 0 && !q && (
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
  preview,
}: {
  t: EditorTemplate;
  onApply: (t: EditorTemplate) => void;
  highlight?: boolean;
  preview?: string;
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
          overflow: 'hidden',
          background: preview
            ? `center/cover no-repeat url("${preview}")`
            : 'var(--field)',
          display: 'grid',
          placeItems: 'center',
          color: 'var(--t4)',
          fontSize: 10,
        }}
      >
        {!preview && <span style={{ opacity: 0.6 }}>…</span>}
      </div>
      <span style={{ fontSize: 11, color: 'var(--t2)', lineHeight: 1.25 }}>{t.name}</span>
    </button>
  );
}
