'use client';

/**
 * components/form/shared.tsx — mảnh dùng chung cho Form mode.
 *
 * Form mode = giao diện cảm ứng (foldable/điện thoại) chạy TRÊN CÙNG engine với node canvas.
 * File này gom: chạy AI job (mock-tolerant), image picker (thư viện + upload máy), và vài
 * primitive UI to-tap-target. KHÔNG tự chế AI — dùng lại /api/jobs qua runImageJob.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, Upload, ImageIcon, Check } from 'lucide-react';
import { runImageJob, AiJobError } from '@/lib/ai/client';
import type { AiTask } from '@/lib/ai/models';
import { useFlowStore } from '@/lib/store';
import { readRenderImage, ImageIngestError } from '@/lib/images/ingest';

/* ───────────────────────── AI job (mock-tolerant) ───────────────────────── */

/**
 * Placeholder "render" xác định (SVG gradient nội thất) — dùng khi ComfyUI/fal chưa nối.
 * Copy tinh thần từ lib/nodes/registry.placeholderRender để Form không phụ thuộc file private.
 */
export function placeholderImage(label: string, seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const hue1 = h % 360;
  const hue2 = (hue1 + 40) % 360;
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="768" height="512" viewBox="0 0 768 512">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="hsl(${hue1},32%,72%)"/>
      <stop offset="1" stop-color="hsl(${hue2},26%,48%)"/>
    </linearGradient>
    <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="hsl(${hue2},18%,34%)"/>
      <stop offset="1" stop-color="hsl(${hue2},20%,22%)"/>
    </linearGradient>
  </defs>
  <rect width="768" height="340" fill="url(#sky)"/>
  <rect y="340" width="768" height="172" fill="url(#floor)"/>
  <rect x="90" y="120" width="180" height="220" rx="4" fill="hsl(${hue1},20%,88%)" opacity="0.85"/>
  <rect x="110" y="140" width="140" height="180" rx="2" fill="hsl(${hue1},45%,62%)" opacity="0.7"/>
  <rect x="430" y="250" width="240" height="16" rx="8" fill="hsl(${hue2},15%,80%)"/>
  <rect x="450" y="266" width="12" height="80" fill="hsl(${hue2},12%,70%)"/>
  <rect x="640" y="266" width="12" height="80" fill="hsl(${hue2},12%,70%)"/>
  <circle cx="560" cy="120" r="34" fill="hsl(45,90%,80%)" opacity="0.9"/>
  <text x="384" y="480" text-anchor="middle" font-family="system-ui" font-size="22" fill="rgba(255,255,255,0.85)">${label}</text>
</svg>`.trim();
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function mockJob(
  label: string,
  seed: string,
  onProgress: (p: number) => void,
  count: number,
): Promise<string[]> {
  const out: string[] = [];
  for (let n = 0; n < count; n++) {
    for (let i = 1; i <= 8; i++) {
      await wait(220);
      onProgress((n + i / 8) / count);
    }
    out.push(placeholderImage(count > 1 ? `${label} · mock ${n + 1}` : `${label} · mock`, `${seed}#${n}`));
  }
  return out;
}

/**
 * Chạy 1 AI task qua job API THẬT (giống node): submit + poll. Provider chưa nối
 * (PROVIDER_NOT_CONFIGURED) hoặc mức "Không AI" (tier 1) → rơi về ảnh mock, KHÔNG crash.
 * Trả mảng URL (render: 1, moodboard: nhiều). Lỗi thật khác vẫn throw để form hiện lỗi.
 */
export async function runFormJob(
  task: AiTask,
  input: Record<string, unknown>,
  mockLabel: string,
  onProgress: (p: number) => void,
  count = 1,
): Promise<string[]> {
  const { aiTier, oneAiEngine } = useFlowStore.getState();
  const seed = `${JSON.stringify(input).slice(0, 200)}`;
  // Mức 1 (Không AI): API sẽ từ chối → khỏi gọi, mock thẳng cho mượt.
  if (aiTier === 1) return mockJob(mockLabel, seed, onProgress, count);
  try {
    const urls = await runImageJob(task, input, onProgress, aiTier, oneAiEngine);
    return urls.length ? urls : mockJob(mockLabel, seed, onProgress, count);
  } catch (err) {
    if (err instanceof AiJobError && err.code === 'PROVIDER_NOT_CONFIGURED') {
      return mockJob(mockLabel, seed, onProgress, count);
    }
    throw err;
  }
}

/* ───────────────────────── Thư viện (Reference) ───────────────────────── */

export interface LibAsset {
  id: string;
  name: string;
  url: string;
  usage: string;
  palette: string[];
  caption: string;
  tags: string;
}

/** Kéo asset thư viện từ /api/library, lọc theo usage nếu truyền. */
export function useLibrary(usage?: string[]) {
  const [assets, setAssets] = useState<LibAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch('/api/library');
        const d = r.ok ? await r.json() : { assets: [] };
        if (!alive) return;
        const all: LibAsset[] = (d.assets ?? []).map((a: Record<string, unknown>) => ({
          id: String(a.id),
          name: String(a.name ?? ''),
          url: String(a.url ?? ''),
          usage: String(a.usage ?? 'ref-render'),
          palette: Array.isArray(a.palette) ? (a.palette as string[]) : [],
          caption: String(a.caption ?? ''),
          tags: String(a.tags ?? ''),
        }));
        setAssets(usage?.length ? all.filter((a) => usage.includes(a.usage)) : all);
      } catch {
        if (alive) setError('Không tải được thư viện Reference.');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
    // usage là mảng literal cố định từ caller — join làm key ổn định
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usage?.join(',')]);

  return { assets, loading, error };
}

/** File máy → dataURL (dùng cho control_image_url / image_url của job). */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result));
    fr.onerror = () => reject(new Error('Không đọc được file.'));
    fr.readAsDataURL(file);
  });
}

/* ───────────────────────── UI primitives (to-tap) ───────────────────────── */

export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <span className="text-[13px] font-medium text-[var(--t2)]">{label}</span>
        {hint && <span className="text-[11px] text-[var(--t4)]">{hint}</span>}
      </div>
      {children}
    </label>
  );
}

/** Nút to (min 44px) — variant chính (accent) / phụ (viền). */
export function BigButton({
  children,
  onClick,
  disabled,
  busy,
  variant = 'primary',
  type = 'button',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  busy?: boolean;
  variant?: 'primary' | 'secondary';
  type?: 'button' | 'submit';
}) {
  const base =
    'flex min-h-[48px] w-full items-center justify-center gap-2 rounded-[14px] px-4 text-[15px] font-semibold transition-colors disabled:opacity-50 active:scale-[0.99]';
  const tone =
    variant === 'primary'
      ? 'bg-[var(--accent-strong)] text-white hover:bg-[var(--accent)]'
      : 'border border-[var(--border)] bg-[var(--card)] text-[var(--t1)] hover:bg-[var(--hover)]';
  return (
    <button type={type} onClick={onClick} disabled={disabled || busy} className={`${base} ${tone}`}>
      {busy && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  );
}

/** Nút phụ nhỏ hơn nhưng vẫn 44px cho ngón tay. */
export function ChipButton({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`min-h-[44px] flex-1 rounded-[12px] border px-3 text-[13px] font-medium transition-colors ${
        active
          ? 'border-[var(--accent-ring)] bg-[var(--accent-soft)] text-[var(--accent)]'
          : 'border-[var(--border)] bg-[var(--card)] text-[var(--t2)] hover:bg-[var(--hover)]'
      }`}
    >
      {children}
    </button>
  );
}

export function ProgressBar({ value, label }: { value: number; label?: string }) {
  return (
    <div className="space-y-1.5">
      {label && (
        <div className="flex items-center gap-2 text-[13px] text-[var(--t3)]">
          <Loader2 size={14} className="animate-spin" />
          {label}
        </div>
      )}
      <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--field)]">
        <div
          className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-300"
          style={{ width: `${Math.round(Math.max(0.02, Math.min(1, value)) * 100)}%` }}
        />
      </div>
    </div>
  );
}

export function ErrorNote({ children }: { children: React.ReactNode }) {
  if (!children) return null;
  return (
    <p className="rounded-[12px] border border-red-500/30 bg-red-500/10 px-3 py-2 text-[13px] text-red-300">
      {children}
    </p>
  );
}

/** Card bọc mỗi bước — nền panel, bo tròn, tiêu đề số thứ tự. */
export function StepCard({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[16px] border border-[var(--border)] bg-[var(--panel)] p-3.5">
      <h3 className="mb-3 flex items-center gap-2 text-[14px] font-semibold text-[var(--t1)]">
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[var(--accent-soft)] text-[12px] font-bold text-[var(--accent)]">
          {n}
        </span>
        {title}
      </h3>
      {children}
    </section>
  );
}

/* ───────────────────────── Image picker (library + upload) ───────────────────────── */

export interface PickedImage {
  url: string; // dùng để hiển thị + submit (dataURL cho upload; /api/library URL cho ref)
  name: string;
  source: 'library' | 'upload';
  palette?: string[];
}

/**
 * Chọn 1 ảnh đầu vào: tab Reference (thumbnail từ /api/library) hoặc Upload máy.
 * onPick trả PickedImage. `usage` lọc thư viện. `selectedUrl` để tô ảnh đang chọn.
 */
export function ImagePicker({
  usage,
  selectedUrl,
  onPick,
}: {
  usage?: string[];
  selectedUrl?: string | null;
  onPick: (img: PickedImage) => void;
}) {
  const { assets, loading, error } = useLibrary(usage);
  const [tab, setTab] = useState<'library' | 'upload'>('library');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const onFile = useCallback(
    async (file: File | undefined) => {
      if (!file) return;
      try {
        const url = await readRenderImage(file);
        setUploadError(null);
        onPick({ url, name: file.name || 'ảnh máy', source: 'upload' });
      } catch (err) {
        setUploadError(err instanceof ImageIngestError ? err.message : 'Không nạp được ảnh.');
      }
    },
    [onPick],
  );

  return (
    <div className="space-y-3">
      <div className="flex gap-0.5 rounded-[12px] border border-[var(--border)] bg-[var(--field)] p-0.5">
        <button
          onClick={() => setTab('library')}
          className={`flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-[10px] text-[13px] font-medium transition-colors ${
            tab === 'library' ? 'bg-[var(--card)] text-[var(--t1)] shadow-sm' : 'text-[var(--t4)]'
          }`}
        >
          <ImageIcon size={14} /> Reference
        </button>
        <button
          onClick={() => setTab('upload')}
          className={`flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-[10px] text-[13px] font-medium transition-colors ${
            tab === 'upload' ? 'bg-[var(--card)] text-[var(--t1)] shadow-sm' : 'text-[var(--t4)]'
          }`}
        >
          <Upload size={14} /> Từ máy
        </button>
      </div>

      {tab === 'library' ? (
        <div>
          {loading && <p className="py-4 text-center text-[13px] text-[var(--t4)]">Đang tải thư viện…</p>}
          {error && <ErrorNote>{error}</ErrorNote>}
          {!loading && !error && assets.length === 0 && (
            <p className="py-4 text-center text-[13px] text-[var(--t4)]">
              Thư viện Reference trống — chuyển sang “Từ máy” để tải ảnh lên.
            </p>
          )}
          <div className="grid grid-cols-3 gap-2 lg:grid-cols-5">
            {assets.map((a) => {
              const on = selectedUrl === a.url;
              return (
                <button
                  key={a.id}
                  onClick={() => onPick({ url: a.url, name: a.name, source: 'library', palette: a.palette })}
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
        </div>
      ) : (
        <div>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = '';
              void onFile(f);
            }}
          />
          <button
            onClick={() => fileRef.current?.click()}
            className="flex min-h-[120px] w-full flex-col items-center justify-center gap-2 rounded-[14px] border-2 border-dashed border-[var(--border)] bg-[var(--card)] text-[var(--t3)] transition-colors hover:border-[var(--t4)]"
          >
            <Upload size={22} />
            <span className="text-[13px] font-medium">Chụp ảnh hoặc chọn từ máy</span>
            <span className="text-[11px] text-[var(--t4)]">JPG · PNG · WEBP · tối đa 25MB</span>
          </button>
          {uploadError && <div className="mt-2"><ErrorNote>{uploadError}</ErrorNote></div>}
        </div>
      )}
    </div>
  );
}

/** Ô xem trước ảnh đã chọn / kết quả — tỉ lệ 3:2, bo tròn. */
export function ImagePreview({ url, alt }: { url: string; alt?: string }) {
  return (
    <div className="overflow-hidden rounded-[14px] border border-[var(--border)] bg-[var(--field)]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt={alt ?? ''} className="block max-h-[52vh] w-full object-contain" />
    </div>
  );
}
