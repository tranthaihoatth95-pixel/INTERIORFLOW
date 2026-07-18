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

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { EditorTemplate, LayoutShelf as Shelf } from '@/lib/present-editor/templates';
import { SHELF_LABEL, SHELF_ORDER, shelfOf, makeVariants } from '@/lib/present-editor/templates';
import type { EditorSlide } from '@/lib/present-editor/model';
import type { FontPairing } from '@/lib/slides';
import type { LayoutSpec, ToneKey } from '@/lib/present-editor/spec';
import { renderEditorSlide } from '@/lib/present-editor/render';
import type { GuProfile } from '@/lib/gu';
import type { GridGeometryInput } from '@/lib/present-editor/suggest';
import { PairwisePerceptron } from '@/lib/gu/pairwise-perceptron';
import {
  PRESENT_TEMPLATE_MODEL_KEY,
  templateTraits,
  presentTemplateFeatures,
  explainTemplateChoice,
  type TemplateTraits,
  type PresentFeatureContext,
} from '@/lib/gu/feature-dict';
import {
  getCustomTemplates,
  saveCustomTemplate,
  deleteCustomTemplate,
  toEditorTemplate,
  type CustomTemplate,
} from '@/lib/present-editor/custom-templates';
import SpecForm from './SpecForm';
import GenerateFlow, { type GenerateResult } from './GenerateFlow';
import type { RefImage } from './LibraryBrowser';
import {
  Sparkles,
  Search,
  Plus,
  Shuffle,
  SlidersHorizontal,
  ChevronDown,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  BookmarkPlus,
  Trash2,
  Check,
  X,
} from 'lucide-react';

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
  /** ảnh reference để "đính kèm" trong flow generate. */
  refImages: RefImage[];
  /** máy đã học được quy tắc + ảnh nội dung/text → container tiếp nhận (palette, v.v.). */
  onGenerated?: (r: GenerateResult) => void;
  /** (M-1, optional) gu hiện hành — nuôi feature ΔE palette. Thiếu = bỏ tín hiệu màu. */
  gu?: GuProfile | null;
  /** (M-1, optional) lưới ảnh mẫu (detectRegions) — nuôi feature archetype/gutter. */
  refGrid?: GridGeometryInput | null;
  /** (M-1, optional) thống kê nội dung slide hiện tại (#ảnh, độ dài chữ). */
  content?: { nImages: number; textLen: number } | null;
  /** (PS-2) slide đang hiển thị trên canvas — nguồn cho "Lưu slide này thành template". */
  activeSlide?: EditorSlide | null;
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
  refImages,
  onGenerated,
  gu,
  refGrid,
  content,
  activeSlide,
}: Props) {
  const [query, setQuery] = useState('');
  const [specOpen, setSpecOpen] = useState(false);
  // PS-2: template người dùng tự lưu ("Của tôi") — nạp trong effect (hydration-safe, cùng
  // quy ước BrandKitPanel: không tự đọc localStorage lúc render).
  const [customs, setCustoms] = useState<CustomTemplate[]>([]);
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveBusy, setSaveBusy] = useState(false);
  useEffect(() => {
    setCustoms(getCustomTemplates());
  }, []);

  const handleSaveTemplate = useCallback(async () => {
    if (!activeSlide || saveBusy) return;
    setSaveBusy(true);
    let thumb: string | null = null;
    try {
      thumb = await renderEditorSlide(activeSlide, fonts ?? 'Editorial');
    } catch {
      /* preview lỗi (ảnh hỏng…) — vẫn lưu template, chỉ thiếu thumb */
    }
    const ct = saveCustomTemplate({
      name: saveName,
      slide: activeSlide,
      palette,
      thumb,
    });
    setCustoms((prev) => [ct, ...prev]);
    setSaveOpen(false);
    setSaveName('');
    setSaveBusy(false);
  }, [activeSlide, saveBusy, saveName, palette, fonts]);

  const handleDeleteCustom = useCallback((id: string) => {
    deleteCustomTemplate(id);
    setCustoms((prev) => prev.filter((c) => c.id !== id));
  }, []);
  // biến thể sinh thêm theo template gốc (id gốc → danh sách biến thể).
  const [variants, setVariants] = useState<Record<string, EditorTemplate[]>>({});
  // Flow generate: chỉ hiện kệ 4 cột SAU khi Generate (góp ý #1 & #12). Trước đó = GenerateFlow.
  const [generated, setGenerated] = useState(false);
  const [learnedNotes, setLearnedNotes] = useState<string[] | null>(null);

  /* ─────────────── M-1: PERCEPTRON FEEDBACK (Nhận/Bỏ → learning-to-rank) ───────────────
   * Model pairwise (lib/gu/pairwise-perceptron) nạp từ localStorage SAU mount (SSR-safe).
   * - 👎 Bỏ: ghi nhớ trong phiên (mờ card), CHƯA update — chờ có "bên thắng".
   * - 👍 Nhận / bấm áp bố cục: tạo CẶP (được-chọn ≻ từng-cái-bị-bỏ cùng kệ) → update → lưu.
   * - Xếp hạng: model.rank() tự degrade về heuristic (thứ tự gốc + ghim gợi ý) khi < minPairs. */
  const [model, setModel] = useState<PairwisePerceptron | null>(null);
  const [modelTick, setModelTick] = useState(0); // model mutate tại chỗ — tick để re-rank/re-render
  const [rejected, setRejected] = useState<Record<string, string[]>>({}); // shelf → id bị Bỏ (phiên này)
  useEffect(() => {
    setModel(PairwisePerceptron.loadFromLocalStorage(PRESENT_TEMPLATE_MODEL_KEY));
  }, []);

  const paletteKeyForTraits = (palette ?? []).join(',');
  // traits tĩnh mỗi template (build thử 1 lần) — cache theo id + palette.
  const traitsMap = useMemo(() => {
    const m = new Map<string, TemplateTraits>();
    for (const t of templates) m.set(t.id, templateTraits(t, palette));
    return m;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templates, paletteKeyForTraits]);

  const featCtx: PresentFeatureContext = useMemo(
    () => ({
      nImages: content?.nImages ?? 0,
      textLen: content?.textLen ?? 0,
      palette: gu?.palette?.length ? gu.palette : palette,
      tone: spec.tone,
      gridCells: refGrid?.cells?.length || undefined,
      gutterPct: refGrid?.gutterXPct,
    }),
    [content?.nImages, content?.textLen, gu, palette, spec.tone, refGrid],
  );

  const traitsOf = useCallback(
    (t: EditorTemplate): TemplateTraits => traitsMap.get(t.id) ?? templateTraits(t, palette),
    [traitsMap, palette],
  );
  const featOf = useCallback(
    (t: EditorTemplate) => presentTemplateFeatures(traitsOf(t), featCtx),
    [traitsOf, featCtx],
  );
  /** tooltip explainable 2-3 lý do (dùng trọng số đã học khi có). */
  const reasonsOf = useCallback(
    (t: EditorTemplate): string[] =>
      explainTemplateChoice(traitsOf(t), featCtx, model ? model.toState().weights : undefined),
    [traitsOf, featCtx, model],
  );

  /** 👎 Bỏ — nhớ trong phiên theo kệ (tối đa 4 gần nhất), chờ ghép cặp với lựa chọn kế tiếp. */
  const rejectTemplate = useCallback((t: EditorTemplate) => {
    const shelf = shelfOf(t);
    setRejected((prev) => {
      const cur = prev[shelf] ?? [];
      if (cur.includes(t.id)) return { ...prev, [shelf]: cur.filter((id) => id !== t.id) }; // bấm lại = bỏ Bỏ
      return { ...prev, [shelf]: [...cur, t.id].slice(-4) };
    });
  }, []);

  /** 👍 Nhận (hoặc áp bố cục) — ghép cặp với các template đã Bỏ CÙNG KỆ rồi update + lưu. */
  const acceptTemplate = useCallback(
    (t: EditorTemplate, all: EditorTemplate[]) => {
      if (!model) return;
      const shelf = shelfOf(t);
      const rejIds = (rejected[shelf] ?? []).filter((id) => id !== t.id);
      if (rejIds.length) {
        const acceptedF = featOf(t);
        for (const id of rejIds) {
          const rej = all.find((x) => x.id === id);
          if (rej) model.update(acceptedF, featOf(rej));
        }
        model.saveToLocalStorage(PRESENT_TEMPLATE_MODEL_KEY);
        setRejected((prev) => ({ ...prev, [shelf]: [] }));
        setModelTick((v) => v + 1);
      }
    },
    [model, rejected, featOf],
  );

  /** Xếp lại 1 hàng kệ: model ĐỦ dữ liệu (≥ minPairs) → re-rank theo điểm học được; chưa đủ →
   *  rank() degrade heuristic-0 + tie-break thứ tự vào = GIỮ NGUYÊN thứ tự gốc (y hành vi cũ). */
  const rankRow = useCallback(
    (items: EditorTemplate[]): EditorTemplate[] => {
      void modelTick; // dependency tường minh — trọng số đổi thì rank lại
      if (!model) return items;
      return model.rank(items, featOf, () => 0);
    },
    [model, modelTick, featOf],
  );

  function handleGenerated(r: GenerateResult) {
    // áp quy tắc rút được vào bảng hỏi số liệu (spec) — điểm xuất phát khớp gu ref.
    if (r.rules) {
      const tone: ToneKey = r.rules.tone === 'dark' ? 'dark' : r.rules.tone === 'warm' ? 'warm' : 'light';
      onSpecChange({
        ...spec,
        minImages: r.rules.minImages,
        maxImages: r.rules.maxImages,
        tone,
        background: r.contentImages.length ? 'image' : spec.background,
      });
      setLearnedNotes(r.rules.notes);
    }
    setGenerated(true);
    onGenerated?.(r);
  }

  const q = query.trim().toLowerCase();
  const match = (t: EditorTemplate) => !q || t.name.toLowerCase().includes(q);

  // gom template builtin + variant sinh thêm theo 3 kệ.
  const allTemplates = useMemo(() => {
    const flatVariants = Object.values(variants).flat();
    return [...templates.filter((t) => t.group === 'builtin'), ...flatVariants];
  }, [templates, variants]);

  const byShelf = useMemo(() => {
    const map: Record<Shelf, EditorTemplate[]> = { cover: [], subcover: [], content: [], closing: [] };
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

  // Trước khi Generate: hiện flow mở đầu (import ảnh → text → reference → generate).
  if (!generated) {
    return <GenerateFlow refImages={refImages} onComplete={handleGenerated} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minHeight: 0 }}>
      {/* dòng máy-học-được + generate lại */}
      {learnedNotes && (
        <div style={{ border: '1px solid var(--accent-ring)', borderRadius: 10, background: 'var(--accent-soft)', padding: '9px 11px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
            <Sparkles size={12} style={{ color: 'var(--accent)' }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent)', flex: 1 }}>Máy đã học từ reference</span>
            <button
              type="button"
              onClick={() => { setGenerated(false); setLearnedNotes(null); }}
              title="Nhập lại reference / nội dung"
              style={{ display: 'flex', alignItems: 'center', gap: 4, border: 'none', background: 'transparent', color: 'var(--accent)', fontSize: 10.5, cursor: 'pointer' }}
            >
              <RefreshCw size={11} /> Làm lại
            </button>
          </div>
          <ul style={{ margin: 0, paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {learnedNotes.slice(0, 4).map((n, i) => (
              <li key={i} style={{ fontSize: 10.5, color: 'var(--t2)', lineHeight: 1.4 }}>{n}</li>
            ))}
          </ul>
        </div>
      )}
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
        {activeSlide && (
          <button
            type="button"
            onClick={() => setSaveOpen((v) => !v)}
            title="Lưu slide này thành template — dùng lại được, gom vào mục Của tôi"
            style={saveBtn}
          >
            <BookmarkPlus size={14} /> Lưu mẫu
          </button>
        )}
      </div>

      {/* Lưu slide này thành template (PS-2 / B.8) — form gọn, đặt tên rồi Lưu. */}
      {saveOpen && activeSlide && (
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <input
            autoFocus
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveTemplate();
              else if (e.key === 'Escape') setSaveOpen(false);
            }}
            placeholder="Tên template (VD: Bìa dự án khách sạn)"
            style={{
              flex: 1,
              padding: '6px 8px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'var(--field)',
              color: 'var(--t1)',
              fontSize: 12,
            }}
          />
          <button
            type="button"
            onClick={handleSaveTemplate}
            disabled={saveBusy}
            title="Lưu template"
            style={saveConfirmBtn}
          >
            <Check size={13} />
          </button>
          <button type="button" onClick={() => setSaveOpen(false)} title="Huỷ" style={saveCancelBtn}>
            <X size={13} />
          </button>
        </div>
      )}

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
          const items = rankRow(byShelf[shelf]);
          if (!items.length) return null;
          const rejHere = rejected[shelf] ?? [];
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
                    dimmed={rejHere.includes(t.id)}
                    reasons={reasonsOf(t)}
                    onApply={() => {
                      acceptTemplate(t, allTemplates); // áp = Nhận (dạy máy nếu có cặp chờ)
                      onApply(t);
                    }}
                    onReject={() => rejectTemplate(t)}
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
        {/* trạng thái model — kín đáo, chỉ hiện khi đã học đủ cặp để cầm lái thứ tự */}
        {model?.ready() && (
          <p style={{ fontSize: 10, color: 'var(--t4)', margin: '0 2px', lineHeight: 1.4 }}>
            Đã học {model.pairsSeen} cặp Nhận/Bỏ — thứ tự bố cục xếp theo gu của bạn.
          </p>
        )}

        {/* Của tôi (PS-2) — template người dùng tự lưu từ slide đã dàn. */}
        {customs.length > 0 && (
          <section>
            <div style={headStyle}>Của tôi</div>
            <div className="pe-shelf-row" style={rowScroll}>
              {customs.map((ct) => (
                <ShelfCard
                  key={ct.id}
                  t={toEditorTemplate(ct)}
                  preview={ct.thumb ?? undefined}
                  onApply={() => onApply(toEditorTemplate(ct))}
                  onDelete={() => handleDeleteCustom(ct.id)}
                />
              ))}
            </div>
          </section>
        )}

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
  dimmed,
  reasons,
  onApply,
  onReject,
  onVariant,
  onDelete,
}: {
  t: EditorTemplate;
  preview?: string;
  highlight?: boolean;
  /** đã bấm 👎 trong phiên — mờ đi chờ ghép cặp học. */
  dimmed?: boolean;
  /** 2-3 lý do explainable (tooltip). */
  reasons?: string[];
  onApply: () => void;
  onReject?: () => void;
  onVariant?: () => void;
  /** (PS-2) xoá template tự lưu — chỉ mục "Của tôi" có nút này. */
  onDelete?: () => void;
}) {
  const tip = reasons?.length ? `\nVì sao hợp:\n• ${reasons.join('\n• ')}` : '';
  return (
    <div className="pe-shelf-card" style={{ position: 'relative', flex: '0 0 auto', width: 140, opacity: dimmed ? 0.45 : 1, transition: 'opacity .15s' }}>
      <button
        type="button"
        onClick={onApply}
        title={`Áp bố cục: ${t.name}${tip}`}
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
      {onDelete && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          title="Xoá template này"
          className="pe-variant-btn"
          style={variantBtn}
        >
          <Trash2 size={11} />
        </button>
      )}
      {/* M-1: cặp nút Nhận/Bỏ kín đáo (hover mới hiện — quiet-luxury). Nhận = áp + dạy máy;
          Bỏ = đánh dấu chờ ghép cặp với lựa chọn kế tiếp cùng kệ. */}
      {onReject && (
        <div className="pe-variant-btn" style={fbRow}>
          <button
            type="button"
            onClick={onApply}
            title={`Nhận gợi ý này (áp bố cục + dạy máy)${tip}`}
            style={fbBtn}
          >
            <ThumbsUp size={10} />
          </button>
          <button
            type="button"
            onClick={onReject}
            title={dimmed ? 'Bỏ đánh dấu' : 'Bỏ gợi ý này (dạy máy khi bạn chọn cái khác)'}
            style={{ ...fbBtn, ...(dimmed ? fbBtnActive : null) }}
          >
            <ThumbsDown size={10} />
          </button>
        </div>
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

/* PS-2: "Lưu slide này thành template" — nút gọn cạnh "Tạo", mở form đặt tên inline. */
const saveBtn: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  padding: '6px 10px',
  borderRadius: 8,
  border: '1px solid var(--border)',
  background: 'var(--card)',
  color: 'var(--t2)',
  fontSize: 12,
  cursor: 'pointer',
  flexShrink: 0,
  whiteSpace: 'nowrap',
};

const saveConfirmBtn: React.CSSProperties = {
  width: 26,
  height: 26,
  display: 'grid',
  placeItems: 'center',
  borderRadius: 6,
  border: '1px solid var(--accent)',
  background: 'var(--accent)',
  color: '#fff',
  cursor: 'pointer',
  flexShrink: 0,
};

const saveCancelBtn: React.CSSProperties = {
  width: 26,
  height: 26,
  display: 'grid',
  placeItems: 'center',
  borderRadius: 6,
  border: '1px solid var(--border)',
  background: 'var(--card)',
  color: 'var(--t3)',
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

/* cặp nút Nhận/Bỏ — góc dưới-phải preview, hover card mới hiện (class pe-variant-btn). */
const fbRow: React.CSSProperties = {
  position: 'absolute',
  right: 10,
  bottom: 40,
  display: 'flex',
  gap: 4,
};

const fbBtn: React.CSSProperties = {
  width: 20,
  height: 20,
  display: 'grid',
  placeItems: 'center',
  borderRadius: 6,
  border: '1px solid var(--border)',
  background: 'rgba(20,20,24,.72)',
  color: '#fff',
  cursor: 'pointer',
};

const fbBtnActive: React.CSSProperties = {
  background: 'var(--accent)',
  // giữ NGUYÊN shorthand `border` (không dùng borderColor riêng) — trộn shorthand +
  // longhand cùng thuộc tính giữa 2 lần render là warning của React.
  border: '1px solid var(--accent)',
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
