'use client';

/**
 * components/form/RenderForm.tsx — Form Render (ưu tiên cao nhất).
 *
 * Sketch/Clay → ảnh render, chạy qua CÙNG job API với node (sketch2render / clay2render).
 * Các bước: (1) chọn ảnh (Reference hoặc upload) → (2) Sketch vs Clay → (3) style →
 * (4) Bám sketch Thoáng/Vừa/Chặt → (5) Render. Xong: xem to + Lưu gallery + Tải.
 * Mock-tolerant: ComfyUI/fal tắt vẫn ra ảnh placeholder.
 */

import { useState } from 'react';
import { Download, Save, Wand2 } from 'lucide-react';
import { fetchGuProfile, guToPrompt } from '@/lib/gu';
import { saveToGallery } from '@/lib/gallery';
import { downloadImage } from '@/lib/present-demo';
import {
  BigButton,
  ChipButton,
  ErrorNote,
  Field,
  ImagePicker,
  ImagePreview,
  ProgressBar,
  StepCard,
  runFormJob,
  type PickedImage,
} from './shared';

const STYLES = ['Scandinavian', 'Japandi', 'Indochine', 'Modern Luxury', 'Wabi-sabi', 'Industrial'];

// Negative mặc định (registry.RENDER_NEGATIVE không export) — chặn defect render hình-học.
const RENDER_NEGATIVE =
  'extra legs, duplicated furniture, cloned furniture, deformed furniture, malformed, warped geometry, ' +
  'floating objects, broken chair legs, cluttered, messy, clashing colors, oversaturated, ' +
  'blurry, lowres, distorted, watermark, text, signature, cartoon, cgi, overexposed';

type InputKind = 'sketch' | 'clay';
const ADHERENCE: { label: string; value: number }[] = [
  { label: 'Thoáng', value: 0.4 },
  { label: 'Vừa', value: 0.6 },
  { label: 'Chặt', value: 0.8 },
];

export function RenderForm() {
  const [img, setImg] = useState<PickedImage | null>(null);
  const [kind, setKind] = useState<InputKind>('sketch');
  const [style, setStyle] = useState('Japandi');
  const [extra, setExtra] = useState('');
  const [strength, setStrength] = useState(0.6);

  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function onRender() {
    if (!img) {
      setError('Chọn ảnh sketch / clay trước đã.');
      return;
    }
    setBusy(true);
    setError(null);
    setResult(null);
    setSaved(false);
    setProgress(0.02);
    try {
      const gu = guToPrompt(await fetchGuProfile(['ref-render']));
      const base = `${style} interior, ${extra.trim() || 'warm quiet-luxury editorial photography, natural light'}`;
      const prompt = gu ? `${base}, ${gu}` : base;
      const task = kind === 'sketch' ? 'sketch2render' : 'clay2render';
      // Sketch → canny (control_image_url) · Clay → depth (image_url). Cả hai đều mock-tolerant.
      const input: Record<string, unknown> =
        kind === 'sketch'
          ? { control_image_url: img.url, prompt, negative_prompt: RENDER_NEGATIVE, strength, num_images: 1 }
          : { image_url: img.url, prompt, negative_prompt: RENDER_NEGATIVE, strength, num_images: 1 };
      const urls = await runFormJob(task, input, `${style} ${kind}`, setProgress, 1);
      setResult(urls[0] ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Render thất bại.');
    } finally {
      setBusy(false);
    }
  }

  function onSave() {
    if (!result) return;
    try {
      saveToGallery({ name: `Render ${style} · ${kind}`, url: result });
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lưu gallery lỗi.');
    }
  }

  return (
    <div className="space-y-3">
      <StepCard n={1} title="Ảnh đầu vào">
        <ImagePicker usage={['ref-render']} selectedUrl={img?.source === 'library' ? img.url : null} onPick={setImg} />
        {img && (
          <div className="mt-3">
            <ImagePreview url={img.url} alt={img.name} />
          </div>
        )}
      </StepCard>

      <StepCard n={2} title="Loại ảnh gốc">
        <div className="flex gap-2">
          <ChipButton active={kind === 'sketch'} onClick={() => setKind('sketch')}>
            Sketch (nét vẽ)
          </ChipButton>
          <ChipButton active={kind === 'clay'} onClick={() => setKind('clay')}>
            Clay (khối trắng)
          </ChipButton>
        </div>
        <p className="mt-2 text-[12px] text-[var(--t4)]">
          {kind === 'sketch' ? 'Khoá hình học bằng ControlNet Canny.' : 'Khoá khối bằng ControlNet Depth (hợp render 3ds Max).'}
        </p>
      </StepCard>

      <StepCard n={3} title="Phong cách">
        <Field label="Style" hint="chọn nhanh">
          <div className="grid grid-cols-2 gap-2">
            {STYLES.map((s) => (
              <ChipButton key={s} active={style === s} onClick={() => setStyle(s)}>
                {s}
              </ChipButton>
            ))}
          </div>
        </Field>
        <div className="mt-3">
          <Field label="Mô tả thêm (không bắt buộc)" hint="vật liệu · ánh sáng · đồ nội thất">
            <textarea
              value={extra}
              onChange={(e) => setExtra(e.target.value)}
              rows={3}
              placeholder="oak herringbone floor, linen curtains, warm 2700K light…"
              className="w-full rounded-[12px] border border-[var(--border)] bg-[var(--field)] px-3 py-2.5 text-[14px] text-[var(--t1)] outline-none placeholder:text-[var(--t5)] focus:border-[var(--accent-ring)]"
            />
          </Field>
        </div>
      </StepCard>

      <StepCard n={4} title="Bám sketch">
        <div className="flex gap-2">
          {ADHERENCE.map((a) => (
            <ChipButton key={a.value} active={strength === a.value} onClick={() => setStrength(a.value)}>
              {a.label}
            </ChipButton>
          ))}
        </div>
        <p className="mt-2 text-[12px] text-[var(--t4)]">Càng chặt càng bám sát hình gốc, càng thoáng AI càng tự do.</p>
      </StepCard>

      {error && <ErrorNote>{error}</ErrorNote>}
      {busy && <ProgressBar value={progress} label="Đang render — có thể mất 1–3 phút…" />}

      <BigButton onClick={onRender} busy={busy} disabled={!img}>
        Render
      </BigButton>

      {/* Lối vào editor ảnh raster (hậu kỳ ảnh render): xoá vật thể, relight, grade, ghép/blend. */}
      <BigButton variant="secondary" onClick={() => { window.location.href = '/photo-editor'; }}>
        <Wand2 size={16} /> Mở chỉnh ảnh (hậu kỳ)
      </BigButton>

      {result && (
        <section className="space-y-3 rounded-[16px] border border-[var(--border)] bg-[var(--panel)] p-3.5">
          <h3 className="text-[14px] font-semibold text-[var(--t1)]">Kết quả</h3>
          <ImagePreview url={result} alt="render" />
          <div className="flex gap-2">
            <BigButton variant="secondary" onClick={onSave}>
              <Save size={16} /> {saved ? 'Đã lưu' : 'Lưu'}
            </BigButton>
            <BigButton variant="secondary" onClick={() => downloadImage(result, `render-${style}.png`)}>
              <Download size={16} /> Tải
            </BigButton>
          </div>
        </section>
      )}
    </div>
  );
}
