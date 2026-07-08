'use client';

/**
 * components/present-editor/LayoutShelf.tsx — Chọn bố cục theo 3 HÀNG cuộn ngang.
 *
 * User (round 2): gợi ý bố cục gọn 3 hàng — Bìa · Bìa phụ · Trang nội dung — mỗi hàng
 * CUỘN NGANG (tiết kiệm diện tích, không đổ dọc). Cho TẠO THÊM bố cục + GENERATE thêm
 * biến thể. Kèm bảng hỏi số liệu (SpecForm) áp thẳng vào bố cục sinh ra.
 *
 * Thumbnail = preview thật (renderEditorSlide). Gợi ý (suggestTemplate) ghim đầu hàng
 * phù hợp. Human-in-loop: bấm = áp (build slide mới) rồi user sửa tự do.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import type { EditorTemplate, LayoutShelf as Shelf } from '@/lib/present-editor/templates';
import { SHELF_LABEL, SHELF_ORDER, shelfOf, makeVariants } from '@/lib/present-editor/templates';
import type { FontPairing } from '@/lib/slides';
import type { LayoutSpec } from '@/lib/present-editor/spec';
import { renderEditorSlide } from '@/lib/present-editor/render';
import SpecForm from './SpecForm';
import { Sparkles, Search, Plus, Shuffle, SlidersHorizontal, ChevronDown } from 'lucide-react';

interface Props {
  templates: EditorTemplate[];
  suggestedId: string | null;
  suggestReason: string | null;
  onApply: (t: EditorTemplate) => void;
  /** tạo bố cục trắng (trang nội dung rỗng để tự dàn). */
  onCreateBlank: () => void;
  palette: string[];
  fonts: FontPairing;
  spec: LayoutSpec;
  onSpecChange: (s: LayoutSpec) => void;
}

const PREVIEW_CTX = {
  kicker: 'Concept',
  title: 'Không gian sống',
  body: ['Ánh sáng tự nhiên', 'Vật liệu ấm', 'Tỉ lệ cân bằng', 'Chi tiết tinh tế'],
  images: [] as string[],
};

export default function LayoutShelf({
  templates,
  suggestedId,
  suggestReason,
  onApply,
  onCreateBlank,
  palette,
  fonts,
  spec,
  onSpecChange,
}: Props) {
  const [query, setQuery] = useState('');
  const [specOpen, setSpecOpen] = useState(false);
  // biến thể sinh thêm theo template gốc (id gốc → danh sách biến thể).
  const [variants, setVariants] = useState<Record<string, EditorTemplate[]>>({});

  const q = query.trim().toLowerCase();
  const match = (t: EditorTemplate) => !q || t.name.toLowerCase().includes(q);

  // gom template builtin + variant sinh thêm theo 3 kệ.
  const allTemplates = useMemo(() => {
    const flatVariants = Object.values(variants).flat();
    return [...templates.filter((t) => t.group === 'builtin'), ...flatVariants];
  }, [templates, variants]);

  const byShelf = useMemo(() => {
    const map: Record<Shelf, EditorTemplate[]> = { cover: [], subcover: [], content: [] };
    for (const t of allTemplates) {
      if (!match(t)) continue;
      map[shelfOf(t)].push(t);
    }
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allTemplates, q]);

  const library = templates.filter((t) => t.group === 'library' && match(t));

  // preview cho mọi template (builtin + variant) — cache theo id + palette.
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const paletteKey = (palette ?? []).join(',');
  const doneRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    doneRef.current = new Set();
    setPreviews({});
    let alive = true;
    (async () => {
      for (const t of allTemplates) {
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
  }, [paletteKey, fonts, allTemplates.length]);

  function genVariants(base: EditorTemplate) {
    const v = makeVariants(base, palette);
    setVariants((prev) => ({ ...prev, [base.id]: [...(prev[base.id] ?? []), ...v] }));
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minHeight: 0 }}>
      {/* ô tìm + tạo mới */}
      <div style={{ display: 'flex', gap: 6 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={13} style={{ position: 'absolute', left: 8, top: 8, color: 'var(--t4)', pointerEvents: 'none' }} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm bố cục…"
            style={{
              width: '100%',
              padding: '6px 8px 6px 26px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'var(--field)',
              color: 'var(--t1)',
              fontSize: 12,
            }}
          />
        </div>
        <button type="button" onClick={onCreateBlank} title="Tạo trang nội dung trắng để tự dàn" style={createBtn}>
          <Plus size={14} /> Tạo
        </button>
      </div>

      {/* bảng hỏi số liệu (thu gọn được) */}
      <div style={{ border: '1px solid var(--border)', borderRadius: 10, background: 'var(--card)' }}>
        <button
          type="button"
          onClick={() => setSpecOpen((v) => !v)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            width: '100%',
            padding: '8px 10px',
            background: 'transparent',
            border: 'none',
            color: 'var(--t2)',
            fontSize: 11.5,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <SlidersHorizontal size={13} style={{ color: 'var(--accent)' }} />
          <span style={{ flex: 1, textAlign: 'left' }}>
            Bảng hỏi số liệu · {spec.minImages}–{spec.maxImages} hình · {toneLabel(spec.tone)} · {spec.background === 'image' ? 'nền ảnh' : 'nền màu'}
          </span>
          <ChevronDown size={14} style={{ transform: specOpen ? 'rotate(180deg)' : 'none', transition: 'transform .18s', color: 'var(--t4)' }} />
        </button>
        {specOpen && (
          <div style={{ padding: '2px 10px 12px' }}>
            <SpecForm spec={spec} palette={palette} onChange={onSpecChange} />
          </div>
        )}
      </div>

      {/* 3 kệ cuộn ngang */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto', minHeight: 0 }}>
        {SHELF_ORDER.map((shelf) => {
          const items = byShelf[shelf];
          if (!items.length) return null;
          return (
            <section key={shelf}>
              <ShelfHead shelf={shelf} count={items.length} />
              <div className="pe-shelf-row" style={rowScroll}>
                {items.map((t) => (
                  <ShelfCard
                    key={t.id}
                    t={t}
                    highlight={t.id === suggestedId}
                    preview={previews[t.id]}
                    onApply={() => onApply(t)}
                    onVariant={() => genVariants(t)}
                  />
                ))}
              </div>
              {shelf === shelfOfSuggested(suggestedId, allTemplates) && suggestReason && (
                <p style={{ fontSize: 10.5, color: 'var(--t3)', margin: '6px 2px 0', lineHeight: 1.4, display: 'flex', gap: 4 }}>
                  <Sparkles size={12} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 1 }} /> {suggestReason}
                </p>
              )}
            </section>
          );
        })}

        {/* từ thư viện Reference (nếu có) */}
        {library.length > 0 && (
          <section>
            <div style={headStyle}>Từ thư viện Reference</div>
            <div className="pe-shelf-row" style={rowScroll}>
              {library.map((t) => (
                <ShelfCard key={t.id} t={t} preview={t.thumb ?? undefined} onApply={() => onApply(t)} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

/* ------------------------------- helpers ------------------------------- */
function toneLabel(t: LayoutSpec['tone']): string {
  return { light: 'sáng', warm: 'ấm', dark: 'tối', accent: 'nhấn' }[t];
}
function shelfOfSuggested(id: string | null, all: EditorTemplate[]): Shelf | null {
  if (!id) return null;
  const t = all.find((x) => x.id === id);
  return t ? shelfOf(t) : null;
}

function ShelfHead({ shelf, count }: { shelf: Shelf; count: number }) {
  return (
    <div style={headStyle}>
      <span style={{ flex: 1 }}>{SHELF_LABEL[shelf]}</span>
      <span style={{ color: 'var(--t4)', fontWeight: 400 }}>{count}</span>
    </div>
  );
}

function ShelfCard({
  t,
  preview,
  highlight,
  onApply,
  onVariant,
}: {
  t: EditorTemplate;
  preview?: string;
  highlight?: boolean;
  onApply: () => void;
  onVariant?: () => void;
}) {
  return (
    <div className="pe-shelf-card" style={{ position: 'relative', flex: '0 0 auto', width: 140 }}>
      <button
        type="button"
        onClick={onApply}
        title={`Áp bố cục: ${t.name}`}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 5,
          padding: 6,
          width: '100%',
          borderRadius: 8,
          border: highlight ? '1.5px solid var(--accent)' : '1px solid var(--border)',
          background: highlight ? 'var(--accent-soft)' : 'var(--card)',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <div
          style={{
            aspectRatio: '16 / 9',
            borderRadius: 5,
            border: '1px solid var(--border)',
            overflow: 'hidden',
            background: preview ? `center/cover no-repeat url("${preview}")` : 'var(--field)',
            display: 'grid',
            placeItems: 'center',
            color: 'var(--t4)',
            fontSize: 10,
          }}
        >
          {!preview && <span style={{ opacity: 0.6 }}>…</span>}
          {highlight && (
            <span style={badge}>
              <Sparkles size={9} /> Gợi ý
            </span>
          )}
        </div>
        <span style={{ fontSize: 10.5, color: 'var(--t2)', lineHeight: 1.2, minHeight: 26 }}>{t.name}</span>
      </button>
      {onVariant && (
        <button
          type="button"
          onClick={onVariant}
          title="Sinh thêm biến thể (lật · nền tối)"
          className="pe-variant-btn"
          style={variantBtn}
        >
          <Shuffle size={11} />
        </button>
      )}
    </div>
  );
}

const headStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: 0.4,
  textTransform: 'uppercase',
  color: 'var(--t3)',
  margin: '0 0 8px',
};

const rowScroll: React.CSSProperties = {
  display: 'flex',
  gap: 8,
  overflowX: 'auto',
  paddingBottom: 6,
  scrollbarWidth: 'thin',
};

const createBtn: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  padding: '6px 10px',
  borderRadius: 8,
  border: '1px solid var(--accent)',
  background: 'var(--accent-soft)',
  color: 'var(--accent)',
  fontSize: 12,
  cursor: 'pointer',
  flexShrink: 0,
};

const badge: React.CSSProperties = {
  position: 'absolute',
  top: 4,
  left: 4,
  display: 'flex',
  alignItems: 'center',
  gap: 3,
  padding: '2px 6px',
  borderRadius: 20,
  background: 'var(--accent)',
  color: '#fff',
  fontSize: 8.5,
  fontWeight: 600,
};

const variantBtn: React.CSSProperties = {
  position: 'absolute',
  top: 10,
  right: 10,
  width: 22,
  height: 22,
  display: 'grid',
  placeItems: 'center',
  borderRadius: 6,
  border: '1px solid var(--border)',
  background: 'rgba(20,20,24,.72)',
  color: '#fff',
  cursor: 'pointer',
};
