'use client';

/**
 * components/photo-editor/ImageSpecPanel.tsx — Ô "Đọc ảnh → phiếu thông số" (Image→Spec, marker
 * ImageSpec) trong trục phải của trình chỉnh ảnh. Người bấm → composite tài liệu (CÙNG `exportDoc`
 * của nút xuất, không dựng đường xuất riêng) → `/api/vision/analyze` → hiện 6 mục, MỖI DÒNG có
 * nhãn xuất xứ (đo pixel · máy suy chờ duyệt · đã sửa tay) + độ tin cậy CHỈ khi đo được.
 * Sửa dòng nào → dòng đó thành 'verified' (người thắng máy). Hai nút chép: phiếu 4 cấp (JSON —
 * dán thẳng vào ô "Duyệt/sửa phiếu" của node Render bám ý) và chỉ dẫn từng mảng.
 *
 * Không AI = vẫn có việc: nút "Chỉ đo pixel" chạy 0 AI, 0 credit; tầng AI không chạy được thì
 * panel ghi LÝ DO ngay dưới, không giả kết quả. Không dùng `title` cho lý do (câm trên cảm ứng).
 */
import { useCallback, useMemo, useState } from 'react';
import {
  SPEC_SECTION_META,
  encodeImageSpec,
  materialDrafts,
  originLabel,
  regionInstructions,
  setFieldByUser,
  specToReferenceSheet,
  type ImageSpec,
  type SpecField,
} from '@/lib/vision/image-spec';
import { encodeReferenceSheet } from '@/lib/grounded-render/types';
import { readImageSpec } from '@/lib/grounded-render/reference-sheet';

interface Props {
  /** ảnh hiện tại của tài liệu (composite) — caller truyền đúng engine export sẵn có. */
  getImage: () => Promise<string>;
  imageId: string;
}

export default function ImageSpecPanel({ getImage, imageId }: Props) {
  const [spec, setSpec] = useState<ImageSpec | null>(null);
  const [busy, setBusy] = useState<'ai' | 'pixel' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const run = useCallback(
    async (ai: boolean) => {
      setBusy(ai ? 'ai' : 'pixel');
      setError(null);
      try {
        const image = await getImage();
        const r = await readImageSpec(image, imageId, { ai });
        if (!r.ok) {
          setError(r.error ?? `Máy đọc ảnh lỗi (HTTP ${r.status}).`);
          return;
        }
        setSpec(r.spec);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Không đọc được ảnh.');
      } finally {
        setBusy(null);
      }
    },
    [getImage, imageId],
  );

  const copy = useCallback(async (label: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(null), 1600);
    } catch {
      setError('Không chép được vào clipboard.');
    }
  }, []);

  const drafts = useMemo(() => (spec ? materialDrafts(spec) : []), [spec]);
  const regions = useMemo(() => (spec ? regionInstructions(spec) : []), [spec]);

  const onEdit = (id: string, value: string) => {
    if (!spec) return;
    setSpec(setFieldByUser(spec, id, value));
  };

  return (
    <section aria-labelledby="imgspec-h" style={{ borderTop: '1px solid var(--border)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <h3 id="imgspec-h" style={{ margin: 0, fontSize: 12, fontWeight: 600, color: 'var(--t2)' }}>Đọc ảnh → phiếu thông số</h3>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <Btn onClick={() => run(true)} disabled={busy !== null}>{busy === 'ai' ? 'Đang đọc…' : 'Đọc ảnh (đo + AI)'}</Btn>
        <Btn onClick={() => run(false)} disabled={busy !== null}>{busy === 'pixel' ? 'Đang đo…' : 'Chỉ đo pixel (0 AI)'}</Btn>
      </div>
      {busy && (
        <div role="status" aria-live="polite" style={{ fontSize: 11, color: 'var(--t3)' }}>
          {busy === 'ai' ? 'Đo pixel rồi hỏi model thị giác — thời gian không đo trước được.' : 'Đang đo pixel…'}
        </div>
      )}
      {error && (
        <div role="alert" style={{ fontSize: 11, color: 'var(--danger)', whiteSpace: 'pre-wrap' }}>{error}</div>
      )}

      {spec && (
        <>
          <div style={{ fontSize: 11, color: 'var(--t3)' }}>
            {spec.width}×{spec.height} ·{' '}
            {spec.ai.tier === 'none' ? (
              <span>AI không chạy — {spec.ai.reason}</span>
            ) : (
              <span>AI: {spec.ai.tier} · {spec.ai.model}</span>
            )}
          </div>

          {SPEC_SECTION_META.map((m) => {
            const fs = spec.fields.filter((f) => f.section === m.section);
            if (fs.length === 0) return null;
            return (
              <div key={m.section} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--t2)' }}>{m.label}</div>
                {fs.map((f) => (
                  <FieldRow key={f.id} f={f} onEdit={onEdit} />
                ))}
              </div>
            );
          })}

          {drafts.length > 0 && (
            <div style={{ fontSize: 11, color: 'var(--t3)' }}>
              <div style={{ fontWeight: 600, color: 'var(--t2)' }}>PBR nháp cho 3D (suy từ tên, chưa đo)</div>
              {drafts.map((d) => (
                <div key={d.ten}>{d.ten}: roughness {d.pbr.roughness} · metallic {d.pbr.metallic}</div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <Btn onClick={() => copy('sheet', encodeReferenceSheet(specToReferenceSheet(spec)))}>
              {copied === 'sheet' ? 'Đã chép' : 'Chép phiếu 4 cấp (JSON)'}
            </Btn>
            <Btn
              onClick={() => copy('regions', regions.map((r) => `${r.label}: ${r.instruction}`).join('\n'))}
              disabled={regions.length === 0}
              reason={regions.length === 0 ? 'Chưa có dòng trần/tường/sàn nào để làm chỉ dẫn mảng.' : undefined}
            >
              {copied === 'regions' ? 'Đã chép' : `Chép chỉ dẫn mảng (${regions.length})`}
            </Btn>
            <Btn onClick={() => copy('spec', encodeImageSpec(spec))}>{copied === 'spec' ? 'Đã chép' : 'Chép spec đầy đủ'}</Btn>
          </div>
        </>
      )}
    </section>
  );
}

function FieldRow({ f, onEdit }: { f: SpecField; onEdit: (id: string, v: string) => void }) {
  const swatches = f.id === 'bang-mau.chu-dao' && Array.isArray(f.data?.swatches) ? (f.data!.swatches as Array<{ hex: string; share: number }>) : null;
  const reason = !f.value && f.data && typeof f.data.reason === 'string' ? f.data.reason : null;
  const badgeColor = f.origin === 'user' ? 'var(--success)' : f.origin === 'pixel' ? 'var(--t3)' : 'var(--accent)';
  const inputId = `imgspec-${f.id.replace(/[^a-z0-9-]/gi, '-')}`;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <label htmlFor={inputId} style={{ fontSize: 11, color: 'var(--t3)', display: 'flex', justifyContent: 'space-between', gap: 6 }}>
        <span>{f.label}</span>
        <span style={{ color: badgeColor, whiteSpace: 'nowrap' }}>{originLabel(f)}</span>
      </label>
      {swatches && (
        <div style={{ display: 'flex', gap: 4 }} aria-hidden="true">
          {swatches.map((s) => (
            <span key={s.hex} style={{ flex: Math.max(0.05, s.share), height: 14, background: s.hex, borderRadius: 4, border: '1px solid var(--border)' }} />
          ))}
        </div>
      )}
      <input
        id={inputId}
        value={f.value}
        placeholder={reason ?? '(trống — điền tay nếu biết)'}
        onChange={(e) => onEdit(f.id, e.target.value)}
        style={{
          fontSize: 12,
          padding: '5px 8px',
          borderRadius: 8,
          border: '1px solid var(--border)',
          background: 'var(--field)',
          color: 'var(--t1)',
          width: '100%',
          boxSizing: 'border-box',
        }}
      />
    </div>
  );
}

function Btn({ children, onClick, disabled, reason }: { children: React.ReactNode; onClick: () => void; disabled?: boolean; reason?: string }) {
  const rid = reason ? `imgspec-reason-${Math.abs(hash(reason))}` : undefined;
  return (
    <>
      <button
        type="button"
        onClick={() => { if (!disabled) onClick(); }}
        aria-disabled={disabled || undefined}
        aria-describedby={rid}
        style={{
          fontSize: 12,
          padding: '6px 10px',
          borderRadius: 10,
          border: '1px solid var(--border)',
          background: 'var(--field)',
          color: 'var(--t2)',
          cursor: disabled ? 'default' : 'pointer',
          opacity: disabled ? 'var(--mo-vo-hieu, 0.5)' : 1,
        }}
      >
        {children}
      </button>
      {reason && rid && (
        <span id={rid} style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>{reason}</span>
      )}
    </>
  );
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}
