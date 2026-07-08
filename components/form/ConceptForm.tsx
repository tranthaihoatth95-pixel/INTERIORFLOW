'use client';

/**
 * components/form/ConceptForm.tsx — Form Concept (moodboard).
 *
 * Chọn 1+ ảnh Reference + style text → palette (từ palette lưu sẵn, hoặc extractPalette)
 * + tag vật liệu (từ gu) + moodboard AI (task 'moodboard', mock-tolerant). Phần palette + gu
 * CHẠY ĐƯỢC KHÔNG CẦN AI — AI chỉ là phần thêm.
 */

import { useMemo, useState } from 'react';
import { Check, Download } from 'lucide-react';
import { extractPalette } from '@/lib/imaging';
import { fetchGuProfile, guToPrompt } from '@/lib/gu';
import { downloadImage } from '@/lib/present-demo';
import {
  BigButton,
  ErrorNote,
  Field,
  ImagePreview,
  ProgressBar,
  StepCard,
  runFormJob,
  useLibrary,
  type LibAsset,
} from './shared';

const MOOD_USAGES = ['ref-render', 'slide', 'material'];

export function ConceptForm() {
  const { assets, loading, error: libError } = useLibrary(MOOD_USAGES);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [style, setStyle] = useState('');

  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [palette, setPalette] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [board, setBoard] = useState<string | null>(null);

  const pickedAssets = useMemo(() => assets.filter((a) => picked.has(a.id)), [assets, picked]);

  function toggle(a: LibAsset) {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(a.id)) next.delete(a.id);
      else next.add(a.id);
      return next;
    });
  }

  async function onBuild() {
    if (pickedAssets.length === 0) {
      setError('Chọn ít nhất 1 ảnh Reference.');
      return;
    }
    setBusy(true);
    setError(null);
    setBoard(null);
    setProgress(0.02);
    try {
      // 1) Palette — ưu tiên palette lưu sẵn của asset; thiếu thì extract từ ảnh (mất phí 0đ).
      const stored = pickedAssets.flatMap((a) => a.palette).filter(Boolean);
      let pal = dedupeHex(stored).slice(0, 6);
      if (pal.length < 4) {
        for (const a of pickedAssets.slice(0, 3)) {
          try {
            pal = dedupeHex([...pal, ...(await extractPalette(a.url))]).slice(0, 6);
          } catch {
            /* CORS/ảnh lỗi — bỏ qua, vẫn còn palette lưu sẵn */
          }
        }
      }
      setPalette(pal);

      // 2) Tag vật liệu / phong cách từ gu (0 AI).
      const gu = await fetchGuProfile(MOOD_USAGES);
      setTags([...gu.styles, ...gu.materials].slice(0, 12));

      // 3) Moodboard AI (thêm) — mock-tolerant.
      const prompt = `interior moodboard, ${style.trim() || gu.styles.join(', ') || 'quiet luxury'} · ${guToPrompt(gu)}`;
      const urls = await runFormJob('moodboard', { prompt, num_images: 1 }, 'Moodboard', setProgress, 1);
      setBoard(urls[0] ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Tạo moodboard lỗi.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <StepCard n={1} title="Chọn ảnh Reference">
        {loading && <p className="py-4 text-center text-[13px] text-[var(--t4)]">Đang tải thư viện…</p>}
        {libError && <ErrorNote>{libError}</ErrorNote>}
        {!loading && !libError && assets.length === 0 && (
          <p className="py-4 text-center text-[13px] text-[var(--t4)]">
            Thư viện trống — thêm ảnh Reference ở chế độ Node trước.
          </p>
        )}
        <div className="grid grid-cols-3 gap-2">
          {assets.map((a) => {
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
        {pickedAssets.length > 0 && (
          <p className="mt-2 text-[12px] text-[var(--t4)]">Đã chọn {pickedAssets.length} ảnh.</p>
        )}
      </StepCard>

      <StepCard n={2} title="Phong cách (không bắt buộc)">
        <Field label="Style" hint="vd: Japandi ấm, quiet luxury">
          <input
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            placeholder="Japandi ấm, đá travertine, gỗ sồi…"
            className="w-full rounded-[12px] border border-[var(--border)] bg-[var(--field)] px-3 py-3 text-[14px] text-[var(--t1)] outline-none placeholder:text-[var(--t5)] focus:border-[var(--accent-ring)]"
          />
        </Field>
      </StepCard>

      {error && <ErrorNote>{error}</ErrorNote>}
      {busy && <ProgressBar value={progress} label="Đang tạo moodboard…" />}

      <BigButton onClick={onBuild} busy={busy} disabled={pickedAssets.length === 0}>
        Tạo moodboard
      </BigButton>

      {(palette.length > 0 || tags.length > 0 || board) && (
        <section className="space-y-4 rounded-[16px] border border-[var(--border)] bg-[var(--panel)] p-3.5">
          {palette.length > 0 && (
            <div>
              <h3 className="mb-2 text-[14px] font-semibold text-[var(--t1)]">Bảng màu</h3>
              <div className="flex gap-1.5">
                {palette.map((c) => (
                  <div key={c} className="flex-1">
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
                {tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-[var(--border)] bg-[var(--field)] px-2.5 py-1 text-[12px] text-[var(--t2)]"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}
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
        </section>
      )}
    </div>
  );
}

function dedupeHex(list: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of list) {
    const hex = (raw || '').toLowerCase().trim();
    if (!/^#?[0-9a-f]{6}$/.test(hex)) continue;
    const key = hex.startsWith('#') ? hex : `#${hex}`;
    if (!seen.has(key)) {
      seen.add(key);
      out.push(key);
    }
  }
  return out;
}
