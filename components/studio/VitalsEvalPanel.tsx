'use client';

/**
 * components/studio/VitalsEvalPanel.tsx — MẶT của lõi đánh giá Vitals (Slice 12, 03/09).
 *
 * Vẽ một `EvalRecord` (lib/capabilities/vitals-eval-core) thành các thẻ, gom theo LỚP với DẤU
 * khác nhau — người dùng nhìn là biết mục nào MÁY ĐO (đúng/sai có số, có nguồn), mục nào là GU
 * (Thẻ DNA, không phải luật), mục nào AI (xác suất). Mỗi thẻ: mức (chỉ lớp máy đo) · tin cậy ·
 * luật/phiên bản/nguồn · vì sao · hành động LÙI ĐƯỢC (chọn trên bản vẽ = trạng thái UI, không
 * sửa hình học) · Nhận/Bỏ.
 *
 * Panel KHÔNG tự tính gì — mọi quyết định (thứ tự, nhóm, nhãn) ở lõi + `vitals-eval-ui.ts` để
 * test khoá được. Không có nút nào sửa Doc. Không có chữ "tự động" ở nhãn hành động AI.
 * Nút cao ≥32px, bấm được bằng bàn phím (button thật) — dùng được trên tablet.
 */

import { CheckCircle2, MessageCircleQuestion, MousePointerClick, X, XCircle } from 'lucide-react';
import { useT } from '@/lib/i18n';
import type { EvalFinding, EvalRecord, EvalVerdict } from '@/lib/capabilities/vitals-eval-core';
import { verdictOf } from '@/lib/capabilities/vitals-eval-core';
import {
  BASIS_LABEL,
  SEVERITY_LABEL,
  VERDICT_LABEL,
  confidencePct,
  groupByLayer,
  ruleLine,
  summaryLine,
} from './vitals-eval-ui';

const ACCENT = 'var(--accent)';

function SeverityChip({ f }: { f: EvalFinding }) {
  const t = useT();
  if (f.layer !== 'deterministic') return null;
  const tone =
    f.severity === 'error' ? 'var(--danger, #c8402a)' : f.severity === 'warning' ? 'var(--warning, #d9a34a)' : 'var(--t3)';
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        height: 18,
        padding: '0 7px',
        borderRadius: 999,
        border: `1px solid ${tone}`,
        color: tone,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
      }}
    >
      {t(...SEVERITY_LABEL[f.severity])}
    </span>
  );
}

function LayerMark({ f }: { f: EvalFinding }) {
  // Dấu lớp: máy đo = chấm vuông xám · gu/AI/học = dấu Magic tím (CHOT-TACH-AI §2).
  if (f.layer === 'deterministic') {
    return <span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: 1.5, background: 'var(--t3)', flex: 'none' }} />;
  }
  return <span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: 999, background: ACCENT, flex: 'none' }} />;
}

function FindingCard({
  f,
  verdict,
  onFeedback,
  onSelect,
}: {
  f: EvalFinding;
  verdict: EvalVerdict | null;
  onFeedback: (id: string, v: EvalVerdict) => void;
  onSelect: (ids: string[]) => void;
}) {
  const t = useT();
  const canSelect = f.evidence.entityIds.length > 0;
  const btn = (active: boolean): React.CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    minHeight: 32,
    padding: '0 10px',
    borderRadius: 999,
    border: `1px solid ${active ? ACCENT : 'rgba(127,127,127,0.25)'}`,
    background: active ? 'var(--accent-soft)' : 'transparent',
    color: active ? ACCENT : 'var(--t2)',
    fontSize: 11,
    fontWeight: 600,
    cursor: 'pointer',
  });
  return (
    <li
      data-vitals-eval-finding={f.id}
      data-layer={f.layer}
      style={{
        listStyle: 'none',
        padding: '8px 10px',
        borderRadius: 12,
        background: 'color-mix(in srgb, var(--panel) 70%, transparent)',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        opacity: verdict === 'reject' ? 0.55 : 1,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <LayerMark f={f} />
        <SeverityChip f={f} />
        <span style={{ fontSize: 10, color: 'var(--t4)' }}>
          {t('tin cậy', 'confidence')} {confidencePct(f)}% · {t(...BASIS_LABEL[f.basis])}
          {f.chuaKiemChung ? ` · ${t('chưa kiểm chứng', 'unverified')}` : ''}
        </span>
      </div>
      <div style={{ fontSize: 12, lineHeight: 1.5, color: 'var(--t1)' }}>{f.moTa}</div>
      <div style={{ fontSize: 10.5, lineHeight: 1.45, color: 'var(--t3)' }}>
        <span style={{ fontWeight: 700 }}>{t('Vì sao', 'Why')}:</span> {f.why}
      </div>
      {f.cachSua && (
        <div style={{ fontSize: 10.5, lineHeight: 1.45, color: 'var(--t3)' }}>
          <span style={{ fontWeight: 700 }}>{t('Cách sửa', 'Fix')}:</span> {f.cachSua}
        </div>
      )}
      <div style={{ fontSize: 9.5, color: 'var(--t4)', wordBreak: 'break-word' }} title={ruleLine(f)}>
        {ruleLine(f)}
        {f.evidence.at ? ` · @${Math.round(f.evidence.at.x)},${Math.round(f.evidence.at.y)}mm` : ''}
        {f.evidence.entityIds.length ? ` · ${f.evidence.entityIds.length} ${t('đối tượng', 'objects')}` : ''}
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {canSelect && (
          <button type="button" onClick={() => onSelect(f.evidence.entityIds)} style={btn(false)} aria-label={t(...f.action.label)}>
            <MousePointerClick size={12} />
            {t(...f.action.label)}
          </button>
        )}
        <button
          type="button"
          onClick={() => onFeedback(f.id, 'accept')}
          aria-pressed={verdict === 'accept'}
          style={btn(verdict === 'accept')}
        >
          <CheckCircle2 size={12} />
          {t(...VERDICT_LABEL.accept)}
        </button>
        <button
          type="button"
          onClick={() => onFeedback(f.id, 'reject')}
          aria-pressed={verdict === 'reject'}
          style={btn(verdict === 'reject')}
        >
          <XCircle size={12} />
          {t(...VERDICT_LABEL.reject)}
        </button>
      </div>
    </li>
  );
}

export default function VitalsEvalPanel({
  record,
  stale,
  saved,
  onFeedback,
  onSelect,
  onAsk,
  onClose,
}: {
  record: EvalRecord;
  /** Doc đã đổi sau khi đánh giá — chỉ đánh dấu, không tự chạy lại. */
  stale: boolean;
  /** null = chưa ghi · true/false = kết quả ghi IDB. */
  saved: boolean | null;
  onFeedback: (findingId: string, verdict: EvalVerdict) => void;
  onSelect: (entityIds: string[]) => void;
  /** Hỏi Vitals (AI tuỳ chọn) về kết quả — đi đường chat sẵn có. */
  onAsk: () => void;
  onClose: () => void;
}) {
  const t = useT();
  const groups = groupByLayer(record.findings);
  const summary = summaryLine(record);
  return (
    <section data-vitals-eval="" aria-label={t('Kết quả đánh giá', 'Evaluation result')} style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '8px 10px 4px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--t1)' }}>{t('Đánh giá bản vẽ', 'Drawing evaluation')}</div>
          <div style={{ fontSize: 10.5, color: 'var(--t3)' }}>{t(...summary)}</div>
          <div style={{ fontSize: 9.5, color: 'var(--t4)' }}>
            {record.engine.name} v{record.engine.version} · {record.dna ? `${t('Thẻ DNA', 'DNA card')}: ${record.dna.name}` : t('chưa có Thẻ DNA', 'no DNA card')}
            {stale ? ` · ${t('bản vẽ đã đổi — kết quả cũ', 'drawing changed — result is stale')}` : ''}
            {saved === false ? ` · ${t('chưa lưu được vào máy', 'could not save locally')}` : ''}
          </div>
        </div>
        <button
          type="button"
          aria-label={t('Đóng kết quả đánh giá', 'Close evaluation')}
          onClick={onClose}
          style={{ display: 'grid', placeItems: 'center', width: 32, height: 32, borderRadius: 999, border: 'none', background: 'transparent', color: 'var(--t4)', cursor: 'pointer', flex: 'none' }}
        >
          <X size={12} />
        </button>
      </div>

      {record.tasteBiChan && (
        <div style={{ fontSize: 10.5, lineHeight: 1.45, color: 'var(--t3)', padding: '6px 8px', borderRadius: 10, border: '1px dashed rgba(127,127,127,0.3)' }}>
          <span style={{ fontWeight: 700, color: ACCENT }}>{t('Lớp gu', 'Taste layer')}:</span> {record.tasteBiChan}
        </div>
      )}

      {record.findings.length === 0 && (
        <div style={{ fontSize: 11.5, color: 'var(--t2)', padding: '4px 0' }}>
          {t('Máy đo không thấy gì cần nói ở bản vẽ này.', 'The measured layer found nothing to report on this drawing.')}
        </div>
      )}

      <div style={{ maxHeight: '38vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {groups.map((g) => (
          <div key={g.layer}>
            <div style={{ fontSize: 9.5, letterSpacing: '0.16em', textTransform: 'uppercase', color: g.layer === 'deterministic' ? 'var(--t4)' : ACCENT, margin: '2px 0 6px' }}>
              {t(...g.label)} · {g.findings.length}
            </div>
            <ul style={{ margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {g.findings.map((f) => (
                <FindingCard key={f.id} f={f} verdict={verdictOf(record, f.id)} onFeedback={onFeedback} onSelect={onSelect} />
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={onAsk}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, minHeight: 32, padding: '0 12px', borderRadius: 999, border: `1px solid ${ACCENT}`, background: 'transparent', color: ACCENT, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
        >
          <MessageCircleQuestion size={12} />
          {t('Hỏi Vitals về kết quả (AI tuỳ chọn)', 'Ask Vitals about this (optional AI)')}
        </button>
      </div>
    </section>
  );
}
