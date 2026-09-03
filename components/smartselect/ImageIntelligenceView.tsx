'use client';

/**
 * components/smartselect/ImageIntelligenceView.tsx — MẶT TIỀN của `lib/smartselect/image-intelligence.ts`
 * trên bề mặt Cảm hứng: đọc ảnh NGAY TRONG TRÌNH DUYỆT (canvas, 0-key), bày kết quả kèm cờ nguồn
 * measured/inferred, bộ lọc xem (chỉ đồ rời · cắt nền · trần/tường/sàn · vật liệu) CHỈ bật khi có
 * bằng chứng — nút mờ mang lý do (không nút giả).
 *
 * Ảnh tải từ cùng origin (`/api/library/:id/file`) nên canvas không bị taint; ảnh ngoài phải đi qua
 * `/api/stock-photos/proxy` (tầng gọi tự quyết). Thu nhỏ ≤ 480px trước khi đọc — Hough O(N²).
 *
 * VLM (semantic sâu hơn) là key-gated: gọi `/api/vision/caption`; 503 (chưa có NVIDIA_API_KEY) /
 * 429 (hết free) → hiện nguyên thông báo của route, KHÔNG tự tụt sang nguồn khác.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, ScanSearch, Sparkles } from 'lucide-react';
import { useLang, useT } from '@/lib/i18n';
import {
  analyzeImagePixels,
  availableViews,
  summarize,
  viewMask,
  type ImageIntelligence,
  type ImageIntelligenceSummary,
  type InspirationView,
  type VlmRead,
} from '@/lib/smartselect/image-intelligence';
import { FACET_LABEL, SURFACE_KINDS, SURFACE_LABEL, parseInspirationTags, tagsToFreeText, type FacetKind } from '@/lib/gu/inspiration-facets';
import type { TrangThaiNguon } from '@/lib/distill/types';

export interface IntelligenceAssetLite {
  id: string;
  imgId: string;
  name: string;
  /** URL cùng origin (thư viện) — hoặc URL đã qua proxy. */
  url: string;
  caption?: string;
  tags?: string;
}

interface Props {
  asset: IntelligenceAssetLite;
  /** bản tóm tắt (không mask) — tầng trên lưu localStorage + đưa vào cổng/áp. */
  onAnalyzed: (summary: ImageIntelligenceSummary) => void;
}

const MAX_SIDE = 480;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (!src.startsWith('data:') && !src.startsWith('/')) img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('load'));
    img.src = src;
  });
}

function stateBadge(t: TrangThaiNguon, tr: (vi: string, en: string) => string) {
  const label = t === 'measured' ? tr('Đo', 'Measured') : t === 'verified' ? tr('Đã xác nhận', 'Confirmed') : tr('Máy suy', 'Inferred');
  return <span className={`ins-badge ${t}`}>{label}</span>;
}

export function ImageIntelligenceView({ asset, onAnalyzed }: Props) {
  const tr = useT();
  const lang = useLang();
  const vi = lang !== 'en';
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const baseRef = useRef<ImageData | null>(null);
  const [result, setResult] = useState<ImageIntelligence | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [view, setView] = useState<InspirationView>('original');
  const [reason, setReason] = useState<string>('');
  const [vlm, setVlm] = useState<VlmRead | null>(null);
  const [vlmMsg, setVlmMsg] = useState<string | null>(null);
  const [vlmBusy, setVlmBusy] = useState(false);

  // Chữ nạp cho semantic: tên · caption · tag tự do · GIÁ TRỊ của tag có cấu trúc (space:/style:/…) —
  // không nạp tag thô kèm tiền tố (khớp nhầm substring, xem `tagsToFreeText`).
  const structured = parseInspirationTags(asset.tags).facets;
  const text = [
    asset.name,
    asset.caption ?? '',
    tagsToFreeText(asset.tags),
    ...structured.space, ...structured.surface, ...structured.material, ...structured.light, ...structured.style,
  ].filter(Boolean).join(' · ');

  const run = useCallback(
    async (vlmRead: VlmRead | null) => {
      setBusy(true);
      setErr(null);
      try {
        let img = imgRef.current;
        if (!img) {
          img = await loadImage(asset.url);
          imgRef.current = img;
        }
        const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
        const w = Math.max(1, Math.round(img.naturalWidth * scale));
        const h = Math.max(1, Math.round(img.naturalHeight * scale));
        const c = document.createElement('canvas');
        c.width = w;
        c.height = h;
        const ctx = c.getContext('2d')!;
        ctx.drawImage(img, 0, 0, w, h);
        const data = ctx.getImageData(0, 0, w, h);
        baseRef.current = data;
        // Hough trên ảnh ≤480px: vài trăm ms — chạy trong tick riêng để spinner kịp vẽ.
        await new Promise((r) => setTimeout(r, 0));
        const r = analyzeImagePixels(
          { width: w, height: h, data: data.data },
          { text, vlm: vlmRead, originalSize: { width: img.naturalWidth, height: img.naturalHeight } },
        );
        setResult(r);
        onAnalyzed(summarize(r));
      } catch {
        setErr(tr('Không đọc được ảnh (URL hỏng hoặc bị chặn CORS).', 'Could not read the image (bad URL or CORS-blocked).'));
      } finally {
        setBusy(false);
      }
    },
    [asset.url, text, onAnalyzed, tr],
  );

  useEffect(() => {
    imgRef.current = null;
    baseRef.current = null;
    setResult(null);
    setVlm(null);
    setVlmMsg(null);
    setView('original');
    setReason('');
    void run(null);
    // asset đổi → đọc lại; `run` đã khoá theo asset.url/text
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asset.id]);

  /* vẽ preview theo bộ lọc */
  useEffect(() => {
    const canvas = canvasRef.current;
    const base = baseRef.current;
    if (!canvas || !base || !result) return;
    const { width: w, height: h } = base;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    const out = ctx.createImageData(w, h);
    const src = base.data;
    const mask = viewMask(result, view);
    for (let p = 0; p < w * h; p++) {
      const i = p * 4;
      const keep = !mask || mask[p] >= 128;
      if (keep) {
        out.data[i] = src[i];
        out.data[i + 1] = src[i + 1];
        out.data[i + 2] = src[i + 2];
        out.data[i + 3] = 255;
      } else if (view === 'bg-removed') {
        out.data[i] = out.data[i + 1] = out.data[i + 2] = 0;
        out.data[i + 3] = 0;
      } else {
        const l = 0.2126 * src[i] + 0.7152 * src[i + 1] + 0.0722 * src[i + 2];
        out.data[i] = out.data[i + 1] = out.data[i + 2] = Math.round(l * 0.35 + 40);
        out.data[i + 3] = 255;
      }
    }
    ctx.putImageData(out, 0, 0);
    if (view === 'floor' && result.geometry.horizon) {
      const { y0, y1 } = result.geometry.horizon;
      ctx.strokeStyle = 'rgba(255,255,255,.9)';
      ctx.setLineDash([6, 4]);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, y0 * h);
      ctx.lineTo(w, y1 * h);
      ctx.stroke();
    }
    if (view === 'material') {
      const sw = result.palette.value;
      const bar = Math.max(14, Math.round(h * 0.08));
      let x = 0;
      for (const s of sw) {
        const ww = Math.round(s.share * w);
        ctx.fillStyle = s.hex;
        ctx.fillRect(x, h - bar, ww, bar);
        x += ww;
      }
    }
  }, [result, view]);

  const askVlm = useCallback(async () => {
    const base = baseRef.current;
    if (!base) return;
    setVlmBusy(true);
    setVlmMsg(null);
    try {
      const c = document.createElement('canvas');
      c.width = base.width;
      c.height = base.height;
      c.getContext('2d')!.putImageData(base, 0, 0);
      const dataUrl = c.toDataURL('image/jpeg', 0.85);
      const res = await fetch('/api/vision/caption', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ image: dataUrl }),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string; caption?: string; style?: string; materials?: string[]; room?: string };
      if (!res.ok) {
        setVlmMsg(j.error ?? tr('VLM không phản hồi.', 'VLM did not respond.'));
        return;
      }
      const read: VlmRead = { caption: j.caption, style: j.style, materials: j.materials, room: j.room, model: 'nvidia-vlm' };
      setVlm(read);
      await run(read);
    } catch {
      setVlmMsg(tr('Không gọi được VLM.', 'Could not reach the VLM.'));
    } finally {
      setVlmBusy(false);
    }
  }, [run, tr]);

  const views = result ? availableViews(result) : [];
  const L = (pair: [string, string]) => (vi ? pair[0] : pair[1]);

  return (
    <div className="ins-sec" data-marker="image-intelligence">
      <div className="ins-preview" aria-busy={busy}>
        <canvas ref={canvasRef} aria-label={tr('Xem trước ảnh theo bộ lọc', 'Filtered preview')} />
        {busy && (
          <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', background: 'var(--scrim)' }}>
            <Loader2 size={18} className="animate-spin" />
          </div>
        )}
      </div>
      {err && <p className="ins-note" style={{ color: 'var(--danger)' }}>{err}</p>}

      {result && (
        <>
          <div className="ins-views" role="group" aria-label={tr('Bộ lọc xem', 'View filters')}>
            {views.map((v) => (
              <button
                key={v.id}
                type="button"
                className={view === v.id ? 'ins-view on' : 'ins-view'}
                aria-pressed={view === v.id}
                aria-disabled={!v.available}
                onClick={() => {
                  if (!v.available) {
                    setReason(L(v.reason));
                    return;
                  }
                  setReason(v.id === 'original' ? '' : L(v.reason));
                  setView(v.id);
                }}
              >
                {L(v.label)}
                {v.available && v.id !== 'original' && v.id !== 'material' && (
                  <span className="sr">{v.trangThai === 'measured' ? tr('đo', 'measured') : tr('máy suy', 'inferred')}</span>
                )}
              </button>
            ))}
          </div>
          <p className="ins-reason" aria-live="polite">{reason}</p>

          <div className="ins-sec">
            <h4>{tr('Không gian & ngữ nghĩa', 'Space & semantics')}</h4>
            {result.semantic.source ? (
              <dl className="ins-kv">
                {(Object.keys(FACET_LABEL) as FacetKind[]).map((k) =>
                  result.semantic.facets[k].length ? (
                    <FacetRow key={k} label={L(FACET_LABEL[k])} values={result.semantic.facets[k]} />
                  ) : null,
                )}
                <dt>{tr('Nguồn', 'Source')}</dt>
                <dd>
                  <span className="ins-tag">{result.semantic.source}</span>
                  {stateBadge(result.semantic.trangThai, tr)}
                </dd>
              </dl>
            ) : (
              <p className="ins-note">{tr('Chưa có chữ để đọc ngữ nghĩa (tên/caption/tag). Đọc bằng VLM hoặc đặt tên ảnh rõ hơn.', 'No text to read semantics from (name/caption/tags). Ask the VLM or name the image more clearly.')}</p>
            )}
            {result.semantic.caption && <p className="ins-note">“{result.semantic.caption}”</p>}
            <div className="ins-actions" style={{ marginTop: 6 }}>
              <button type="button" className="ins-btn" onClick={askVlm} disabled={vlmBusy || !!vlm}>
                {vlmBusy ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                {vlm ? tr('Đã đọc bằng VLM', 'VLM read done') : tr('Đọc sâu bằng VLM', 'Deep read with VLM')}
              </button>
              {vlmMsg && <span className="ins-note" style={{ color: 'var(--warning)' }}>{vlmMsg}</span>}
            </div>
          </div>

          <div className="ins-sec">
            <h4>{tr('Bố cục & hình học', 'Composition & geometry')}</h4>
            <dl className="ins-kv">
              <dt>{tr('Khung', 'Frame')}</dt>
              <dd>
                <span className="ins-tag">{result.composition.value.orientation}</span>
                <span className="ins-tag">{tr('điểm sáng', 'bright focus')} {result.composition.value.brightCentroid.x}-{result.composition.value.brightCentroid.y}</span>
                {stateBadge('measured', tr)}
              </dd>
              <dt>{tr('Chân trời', 'Horizon')}</dt>
              <dd>
                {result.geometry.calibrated ? (
                  <>
                    <span className="ins-tag">{result.composition.value.horizonBand}</span>
                    <span className="ins-tag">{tr('3 điểm tụ', '3 vanishing points')}</span>
                    <span className="ins-badge measured">{Math.round(result.geometry.confidence * 100)}%</span>
                  </>
                ) : (
                  <span className="ins-note">{result.geometry.reason}</span>
                )}
              </dd>
              <dt>{tr('Kích thước', 'Dimensions')}</dt>
              <dd><span className="ins-note">{result.geometry.note}</span></dd>
            </dl>
          </div>

          <div className="ins-sec">
            <h4>{tr('Ánh sáng & màu', 'Light & colour')}</h4>
            <dl className="ins-kv">
              <dt>{tr('Ánh sáng', 'Light')}</dt>
              <dd>
                <span className="ins-tag">{result.light.value.temperature}</span>
                <span className="ins-tag">{result.light.value.key}</span>
                <span className="ins-tag">{tr('tương phản', 'contrast')} {Math.round(result.light.value.contrast)}</span>
                {stateBadge('measured', tr)}
              </dd>
              <dt>{tr('Palette', 'Palette')}</dt>
              <dd>
                <span className="ins-swatches" aria-label={result.palette.value.map((s) => s.hex).join(', ')}>
                  {result.palette.value.map((s) => (
                    <span key={s.hex} className="ins-swatch" style={{ background: s.hex }} title={`${s.hex} · ${Math.round(s.share * 100)}%`} />
                  ))}
                </span>
                {stateBadge('measured', tr)}
              </dd>
            </dl>
          </div>

          <div className="ins-sec">
            <h4>{tr('Bề mặt & đồ rời', 'Surfaces & furniture')}</h4>
            <dl className="ins-kv">
              {SURFACE_KINDS.map((k) => {
                const s = result.surfaces[k];
                return (
                  <FacetStatus key={k} label={L(SURFACE_LABEL[k])} ok={s.available} coverage={s.coverage} state={s.trangThai} reason={L(s.reason)} tr={tr} />
                );
              })}
              <FacetStatus
                label={tr('Đồ rời', 'Furniture')}
                ok={result.furniture.available}
                coverage={result.furniture.coverage}
                state={result.furniture.trangThai}
                reason={L(result.furniture.reason)}
                tr={tr}
              />
            </dl>
          </div>

          <p className="ins-note">
            <ScanSearch size={11} style={{ verticalAlign: '-1px', marginRight: 4 }} />
            {tr('Độ tin tổng hợp', 'Overall confidence')} {Math.round(result.overallConfidence * 100)}% — {tr('dùng cho cổng đầu vào, không phải điểm chấm.', 'used by the input gate, not a score.')}
          </p>
        </>
      )}
    </div>
  );
}

function FacetRow({ label, values }: { label: string; values: string[] }) {
  return (
    <>
      <dt>{label}</dt>
      <dd>
        {values.map((v) => (
          <span key={v} className="ins-tag">{v}</span>
        ))}
      </dd>
    </>
  );
}

function FacetStatus({
  label, ok, coverage, state, reason, tr,
}: { label: string; ok: boolean; coverage: number; state: TrangThaiNguon; reason: string; tr: (vi: string, en: string) => string }) {
  return (
    <>
      <dt>{label}</dt>
      <dd>
        {ok ? (
          <>
            <span className="ins-tag">{Math.round(coverage * 100)}%</span>
            {stateBadge(state, tr)}
            <span className="ins-note" style={{ margin: 0 }}>{reason}</span>
          </>
        ) : (
          <span className="ins-note" style={{ margin: 0 }}>— {reason}</span>
        )}
      </dd>
    </>
  );
}
