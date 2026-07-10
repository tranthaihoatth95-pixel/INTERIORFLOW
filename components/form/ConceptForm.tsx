'use client';

/**
 * components/form/ConceptForm.tsx — Form Concept (moodboard).
 *
 * Chọn N ảnh Reference (KHÔNG giới hạn) + dạng moodboard (Vật liệu/Không gian/Câu chuyện)
 * → dựng COLLAGE local (canvas, 0 AI) từ đúng ảnh đã chọn + palette + tag gu. Style: preset
 * hoặc NHẬN DIỆN từ 1 ảnh tải lên (local, dựa palette). Toàn bộ chạy không cần AI.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Download, Sparkles, Upload } from 'lucide-react';
import { guProfileFromPicked, guToPrompt } from '@/lib/gu';
import { USAGES, type RefUsage } from '@/lib/refingest';
import {
  renderMoodboard,
  inferStyleFromImage,
  autoLayout,
  STYLE_PRESETS,
  BOARD_VARIANTS,
  type BoardVariant,
  type BoardImage,
  type StyleGuess,
  type Placement,
} from '@/lib/moodboard-boards';
import { DraftBoard } from './DraftBoard';
import { downloadImage } from '@/lib/present-demo';
import {
  BigButton,
  ErrorNote,
  Field,
  ImagePreview,
  ProgressBar,
  StepCard,
  fileToDataUrl,
  useLibrary,
  type LibAsset,
} from './shared';

const MOOD_USAGES: RefUsage[] = ['ref-render', 'slide', 'material'];
// Nhãn ngắn cho chip lọc (rút từ USAGES của refingest — 1 nguồn sự thật).
const USAGE_CHIP: { id: RefUsage; label: string; tone: string }[] = MOOD_USAGES.map((id) => {
  const u = USAGES.find((x) => x.id === id);
  const short: Record<string, string> = { 'ref-render': 'Nội thất', slide: 'Mood', material: 'Vật liệu' };
  return { id, label: short[id] ?? u?.label ?? id, tone: u?.tone ?? 'var(--t4)' };
});

const HASH_RE = /^[0-9a-f]{16,}$/i;
/** Nhãn thân thiện cho swatch vật liệu: caption > tên (bỏ tên-hash) > 'Vật liệu N'. */
function friendlyLabel(a: LibAsset, i: number): string {
  const cap = a.caption?.trim();
  if (cap) return cap;
  const base = (a.name || '').replace(/\.(jpe?g|png|webp)$/i, '').trim();
  if (base && !HASH_RE.test(base)) return base;
  const tag = (a.tags || '').split(',')[0]?.trim();
  if (tag) return tag;
  return `Vật liệu ${i + 1}`;
}

export function ConceptForm() {
  const { assets, loading, error: libError } = useLibrary(MOOD_USAGES);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [variant, setVariant] = useState<BoardVariant>('space');
  const [title, setTitle] = useState('');
  const [style, setStyle] = useState('');
  const [body, setBody] = useState('');
  const [filter, setFilter] = useState<RefUsage | 'all'>('all');

  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [palette, setPalette] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [board, setBoard] = useState<string | null>(null);
  const [guess, setGuess] = useState<StyleGuess | null>(null);
  const styleFileRef = useRef<HTMLInputElement>(null);
  // Bố cục tay từ bảng draft — key theo id ảnh (giữ chỉnh khi thêm/bớt ảnh khác).
  const [place, setPlace] = useState<Record<string, Placement>>({});
  const lastVariant = useRef<BoardVariant>(variant);

  const pickedAssets = useMemo(() => assets.filter((a) => picked.has(a.id)), [assets, picked]);
  const visibleAssets = useMemo(
    () => (filter === 'all' ? assets : assets.filter((a) => a.usage === filter)),
    [assets, filter],
  );
  const usageCounts = useMemo(() => {
    const m = new Map<RefUsage, number>();
    for (const a of assets) m.set(a.usage as RefUsage, (m.get(a.usage as RefUsage) ?? 0) + 1);
    return m;
  }, [assets]);

  // Đồng bộ bố cục: mỗi ảnh chọn phải có 1 placement. Đổi DẠNG → reset auto; thêm/bớt
  // ảnh → giữ chỉnh cũ, cấp auto cho ảnh mới.
  const pickedIds = pickedAssets.map((a) => a.id).join(',');
  useEffect(() => {
    const n = pickedAssets.length;
    if (n === 0) {
      setPlace({});
      return;
    }
    const variantChanged = lastVariant.current !== variant;
    lastVariant.current = variant;
    const auto = autoLayout(variant, n);
    setPlace((prev) => {
      const next: Record<string, Placement> = {};
      pickedAssets.forEach((a, i) => {
        next[a.id] = !variantChanged && prev[a.id] ? prev[a.id] : auto[i];
      });
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickedIds, variant]);

  const draftImages = useMemo(() => pickedAssets.map((a) => ({ id: a.id, url: a.url })), [pickedAssets]);
  const draftPlacements = useMemo(() => {
    const auto = autoLayout(variant, pickedAssets.length);
    return pickedAssets.map((a, i) => place[a.id] ?? auto[i]);
  }, [pickedAssets, place, variant]);

  function onDraftChange(next: Placement[]) {
    setPlace((prev) => {
      const m = { ...prev };
      pickedAssets.forEach((a, i) => {
        if (next[i]) m[a.id] = next[i];
      });
      return m;
    });
  }
  function onAutoArrange() {
    const auto = autoLayout(variant, pickedAssets.length);
    const m: Record<string, Placement> = {};
    pickedAssets.forEach((a, i) => (m[a.id] = auto[i]));
    setPlace(m);
  }
  function onDraftRemove(i: number) {
    const a = pickedAssets[i];
    if (a) toggle(a);
  }

  function toggle(a: LibAsset) {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(a.id)) next.delete(a.id);
      else next.add(a.id);
      return next;
    });
  }

  /** Nhận diện style từ 1 ảnh tải lên (local, dựa palette). */
  async function onDetectStyle(file: File | undefined) {
    if (!file) return;
    setError(null);
    try {
      const url = await fileToDataUrl(file);
      const gs = await inferStyleFromImage(url);
      setGuess(gs);
      // gộp vào ô style (không đè nếu user đã gõ — nối thêm)
      setStyle((s) => (s.trim() ? `${s.trim()}, ${gs.tags.slice(0, 3).join(', ')}` : gs.descriptor));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không nhận diện được style.');
    }
  }

  async function onBuild() {
    if (pickedAssets.length === 0) {
      setError('Chọn ít nhất 1 ảnh Reference.');
      return;
    }
    setBusy(true);
    setError(null);
    setBoard(null);
    setProgress(0.05);
    try {
      // 1) gu (palette · vật liệu · phong cách) TỪ ĐÚNG ảnh đã chọn (0 AI).
      //    DEDUPE hex/tag để không trùng React key (khối "Bảng màu" tự ẩn khi rỗng).
      const gu = guProfileFromPicked(pickedAssets);
      setPalette([...new Set(gu.palette)].slice(0, 6));
      setTags([...new Set([...gu.styles, ...gu.materials])].slice(0, 12));
      setProgress(0.25);

      // 2) Dựng COLLAGE local từ TẤT CẢ ảnh đã chọn (không giới hạn số ảnh), theo
      //    ĐÚNG bố cục bảng draft (placements) user đã chỉnh → ra sát ý.
      const images: BoardImage[] = pickedAssets.map((a, i) => ({ url: a.url, label: friendlyLabel(a, i) }));
      const styleTags = [style.trim(), ...gu.styles].filter(Boolean).join(', ');
      const url = await renderMoodboard(images, {
        variant,
        eyebrow: defaultEyebrow(variant),
        title: title.trim() || defaultTitle(variant),
        // enso: dùng tagline (body/ô câu chuyện) làm phụ đề tâm; khác: gộp style tags.
        sub: variant === 'enso' ? body.trim() || 'Vòng tuần hoàn vô cực' : styleTags.slice(0, 60),
        body: body.trim() || (variant === 'story' ? guToPrompt(gu) : undefined),
        mark: 'INTERIORFLOW',
        palette: gu.palette,
        placements: draftPlacements,
      });
      setProgress(0.95);
      setBoard(url);
      setProgress(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Dựng moodboard lỗi.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <StepCard n={1} title="Chọn dạng moodboard">
        <div className="grid grid-cols-3 gap-2">
          {BOARD_VARIANTS.map((v) => (
            <button
              key={v.id}
              onClick={() => setVariant(v.id)}
              className={`rounded-[12px] border-2 px-2.5 py-2.5 text-left transition-colors ${
                variant === v.id
                  ? 'border-[var(--accent)] bg-[var(--accent-soft)]'
                  : 'border-[var(--border)] bg-[var(--field)] hover:border-[var(--t4)]'
              }`}
            >
              <p className={`text-[13px] font-semibold ${variant === v.id ? 'text-[var(--accent)]' : 'text-[var(--t1)]'}`}>
                {v.label}
              </p>
              <p className="mt-0.5 text-[10px] leading-snug text-[var(--t4)]">{v.hint}</p>
            </button>
          ))}
        </div>
      </StepCard>

      <StepCard n={2} title="Chọn ảnh Reference (không giới hạn)">
        {loading && <p className="py-4 text-center text-[13px] text-[var(--t4)]">Đang tải thư viện…</p>}
        {libError && <ErrorNote>{libError}</ErrorNote>}
        {!loading && !libError && assets.length === 0 && (
          <p className="py-4 text-center text-[13px] text-[var(--t4)]">
            Thư viện trống — thêm ảnh Reference ở chế độ Node trước.
          </p>
        )}
        {assets.length > 0 && (
          <div className="mb-2.5 flex flex-wrap gap-1.5">
            <FilterChip active={filter === 'all'} onClick={() => setFilter('all')}>
              Tất cả · {assets.length}
            </FilterChip>
            {USAGE_CHIP.filter((u) => (usageCounts.get(u.id) ?? 0) > 0).map((u) => (
              <FilterChip key={u.id} active={filter === u.id} tone={u.tone} onClick={() => setFilter(u.id)}>
                {u.label} · {usageCounts.get(u.id)}
              </FilterChip>
            ))}
          </div>
        )}
        <div className="grid grid-cols-3 gap-2 lg:grid-cols-5">
          {visibleAssets.map((a) => {
            const on = picked.has(a.id);
            return (
              <button
                key={a.id}
                onClick={() => toggle(a)}
                title={a.name}
                className={`relative aspect-square overflow-hidden rounded-[12px] border-2 transition-colors ${
                  on ? 'border-[var(--accent)]' : 'border-[var(--border)] hover:border-[var(--t4)]'
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={a.url} alt={a.name} className="h-full w-full object-cover" loading="lazy" />
                {on && (
                  <span className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-[var(--accent)] text-white">
                    <Check size={12} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
        {assets.length > 0 && visibleAssets.length === 0 && (
          <p className="py-4 text-center text-[13px] text-[var(--t4)]">Không có ảnh loại này.</p>
        )}
        {pickedAssets.length > 0 && (
          <p className="mt-2 text-[12px] text-[var(--t4)]">Đã chọn {pickedAssets.length} ảnh.</p>
        )}
      </StepCard>

      {pickedAssets.length > 0 && (
        <StepCard n={3} title="Bố cục nháp — kéo chỉnh trước khi dựng">
          <DraftBoard
            images={draftImages}
            placements={draftPlacements}
            onChange={onDraftChange}
            onAuto={onAutoArrange}
            onRemove={onDraftRemove}
          />
        </StepCard>
      )}

      <StepCard n={4} title="Nội dung & phong cách">
        <Field label="Tiêu đề" hint="để trống = mặc định theo dạng">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={defaultTitle(variant)}
            className="w-full rounded-[12px] border border-[var(--border)] bg-[var(--field)] px-3 py-3 text-[14px] text-[var(--t1)] outline-none placeholder:text-[var(--t5)] focus:border-[var(--accent-ring)]"
          />
        </Field>

        <div className="mt-3">
          <Field label="Phong cách" hint="chọn preset, gõ, hoặc nhận diện từ 1 ảnh">
            <input
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              placeholder="Japandi ấm, đá travertine, gỗ sồi…"
              className="w-full rounded-[12px] border border-[var(--border)] bg-[var(--field)] px-3 py-3 text-[14px] text-[var(--t1)] outline-none placeholder:text-[var(--t5)] focus:border-[var(--accent-ring)]"
            />
          </Field>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {STYLE_PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => setStyle(p.prompt)}
                className="rounded-full border border-[var(--border)] bg-[var(--field)] px-2.5 py-1 text-[12px] text-[var(--t3)] transition-colors hover:border-[var(--accent-ring)] hover:text-[var(--t1)]"
              >
                {p.label}
              </button>
            ))}
            <input ref={styleFileRef} type="file" accept="image/*" className="hidden" onChange={(e) => onDetectStyle(e.target.files?.[0])} />
            <button
              onClick={() => styleFileRef.current?.click()}
              className="flex items-center gap-1.5 rounded-full border border-dashed border-[var(--accent-ring)] px-2.5 py-1 text-[12px] font-medium text-[var(--accent)] transition-colors hover:bg-[var(--accent-soft)]"
            >
              <Sparkles size={12} /> Nhận diện từ ảnh
            </button>
          </div>
          {guess && (
            <div className="mt-2 flex items-center gap-2 rounded-[10px] border border-[var(--border)] bg-[var(--panel)] px-2.5 py-1.5">
              <div className="flex gap-1">
                {guess.palette.slice(0, 6).map((c, i) => (
                  <span key={`${c}-${i}`} className="h-4 w-4 rounded-[3px] border border-[var(--border)]" style={{ background: c }} />
                ))}
              </div>
              <p className="text-[11px] text-[var(--t3)]">{guess.descriptor}</p>
            </div>
          )}
        </div>

        {(variant === 'story' || variant === 'enso') && (
          <div className="mt-3">
            <Field
              label={variant === 'enso' ? 'Câu tagline (ở tâm vòng)' : 'Đoạn văn kể chuyện'}
              hint={variant === 'enso' ? 'dòng chữ dưới ENSŌ' : 'dạng Câu chuyện — mô tả cảm hứng'}
            >
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={variant === 'enso' ? 2 : 3}
                placeholder={
                  variant === 'enso'
                    ? 'Vòng tuần hoàn vô cực — thiên nhiên · con người · công nghệ'
                    : 'Không gian mời gọi sự tĩnh lặng, nơi ánh sáng và vật liệu tự nhiên…'
                }
                className="w-full resize-none rounded-[12px] border border-[var(--border)] bg-[var(--field)] px-3 py-3 text-[14px] text-[var(--t1)] outline-none placeholder:text-[var(--t5)] focus:border-[var(--accent-ring)]"
              />
            </Field>
          </div>
        )}
      </StepCard>

      {error && <ErrorNote>{error}</ErrorNote>}
      {busy && <ProgressBar value={progress} label="Đang dựng moodboard…" />}

      <BigButton onClick={onBuild} busy={busy} disabled={pickedAssets.length === 0}>
        <Upload size={16} /> Dựng moodboard
      </BigButton>

      {(palette.length > 0 || tags.length > 0 || board) && (
        <section className="space-y-4 rounded-[16px] border border-[var(--border)] bg-[var(--panel)] p-3.5">
          {board && (
            <div>
              <h3 className="mb-2 text-[14px] font-semibold text-[var(--t1)]">Moodboard</h3>
              <ImagePreview url={board} alt="moodboard" />
              <div className="mt-2">
                <BigButton variant="secondary" onClick={() => downloadImage(board, 'moodboard.png')}>
                  <Download size={16} /> Tải moodboard
                </BigButton>
              </div>
            </div>
          )}
          {palette.length > 0 && (
            <div>
              <h3 className="mb-2 text-[14px] font-semibold text-[var(--t1)]">Bảng màu</h3>
              <div className="flex gap-1.5">
                {palette.map((c, i) => (
                  <div key={`${c}-${i}`} className="flex-1">
                    <div className="h-14 rounded-[10px] border border-[var(--border)]" style={{ background: c }} />
                    <p className="mt-1 text-center text-[10px] text-[var(--t4)]">{c}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {tags.length > 0 && (
            <div>
              <h3 className="mb-2 text-[14px] font-semibold text-[var(--t1)]">Vật liệu &amp; phong cách</h3>
              <div className="flex flex-wrap gap-1.5">
                {tags.map((t, i) => (
                  <span
                    key={`${t}-${i}`}
                    className="rounded-full border border-[var(--border)] bg-[var(--field)] px-2.5 py-1 text-[12px] text-[var(--t2)]"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function defaultTitle(v: BoardVariant): string {
  return v === 'enso'
    ? 'ENSŌ'
    : v === 'material'
      ? 'BẢNG VẬT LIỆU'
      : v === 'space'
        ? 'Không Gian'
        : 'Câu Chuyện Thiết Kế';
}
function defaultEyebrow(v: BoardVariant): string {
  return v === 'enso'
    ? 'ĐỊNH HƯỚNG THIẾT KẾ Ý TƯỞNG'
    : v === 'material'
      ? 'BẢNG VẬT LIỆU'
      : v === 'space'
        ? 'ĐỊNH HƯỚNG KHÔNG GIAN'
        : 'CẢM HỨNG THIẾT KẾ';
}

/** Chip lọc loại ảnh — chấm màu tone của usage + nhãn ngắn. */
function FilterChip({
  active,
  tone,
  onClick,
  children,
}: {
  active: boolean;
  tone?: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-medium transition-colors ${
        active
          ? 'border-[var(--accent-ring)] bg-[var(--accent-soft)] text-[var(--accent)]'
          : 'border-[var(--border)] bg-[var(--field)] text-[var(--t3)] hover:bg-[var(--hover)]'
      }`}
    >
      {tone && <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: tone }} />}
      {children}
    </button>
  );
}
