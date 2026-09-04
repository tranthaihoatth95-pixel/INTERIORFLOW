'use client';

/**
 * components/dna/InspirationApplyPanel.tsx — CỔNG + PHIẾU ĐỀ XUẤT "Áp vào Thẻ DNA" (khuôn
 * ProposalSheet, chốt 13/08): máy dựng intent → người xem thay đổi từng lớp → xác nhận quyền nếu
 * cần → Áp (PUT `/api/projects/:id/dna`, route sẵn có) → Hoàn tác (PUT lại bản `before`).
 *
 * Không sao chép hình học, không khai kích thước: `intentHasNoGeometry()` chặn trước khi Áp.
 * Không tự chạy — mọi ghi đều sau một nút bấm rõ ràng ([T5]).
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Check, Info, Loader2, RotateCcw, Sparkles, XCircle } from 'lucide-react';
import { useLang, useT } from '@/lib/i18n';
import { DNA_LAYER_LABEL, newDnaCard, type DesignDnaCard } from '@/lib/dna/types';
import { canApply, gateInspiration, type GateResult } from '@/lib/gu/inspiration-gate';
import { applyIntent, buildIntent, describeChanges, intentHasNoGeometry, INTENT_ASPECTS, type IntentAspect } from '@/lib/gu/apply-intent';
import type { ImageIntelligenceSummary } from '@/lib/smartselect/image-intelligence';
import type { IntentLogEntry } from '@/lib/gu/inspiration-store';

interface Props {
  asset: { id: string; imgId: string; name: string };
  summary: ImageIntelligenceSummary | null;
  license: string | null;
  source: string | null;
  projectId: string | null;
  projectName?: string;
  intents: IntentLogEntry[];
  onApplied: (entry: IntentLogEntry) => void;
  onReverted: (id: string) => void;
  onToast: (text: string) => void;
}

async function fetchCards(projectId: string): Promise<DesignDnaCard[]> {
  const r = await fetch(`/api/projects/${encodeURIComponent(projectId)}/dna`);
  if (!r.ok) throw new Error('load');
  return ((await r.json()) as { cards: DesignDnaCard[] }).cards;
}

async function putCard(projectId: string, card: DesignDnaCard): Promise<DesignDnaCard[]> {
  const r = await fetch(`/api/projects/${encodeURIComponent(projectId)}/dna`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ card }),
  });
  if (!r.ok) throw new Error('save');
  return ((await r.json()) as { cards: DesignDnaCard[] }).cards;
}

const ICON: Record<GateResult['issues'][number]['severity'], typeof Info> = { block: XCircle, warn: AlertTriangle, info: Info };

export function InspirationApplyPanel({ asset, summary, license, source, projectId, projectName, intents, onApplied, onReverted, onToast }: Props) {
  const tr = useT();
  const vi = useLang() !== 'en';
  const [ack, setAck] = useState(false);
  const [aspects, setAspects] = useState<IntentAspect[]>(INTENT_ASPECTS.map((a) => a.id));
  const [cards, setCards] = useState<DesignDnaCard[] | null>(null);
  const [cardId, setCardId] = useState<string>('');
  const [newName, setNewName] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setAck(false);
  }, [asset.id]);

  useEffect(() => {
    if (!projectId) {
      setCards(null);
      return;
    }
    let alive = true;
    fetchCards(projectId)
      .then((c) => {
        if (!alive) return;
        setCards(c);
        setCardId((cur) => (c.some((x) => x.id === cur) ? cur : c[0]?.id ?? '__new'));
      })
      .catch(() => alive && setCards([]));
    return () => {
      alive = false;
    };
  }, [projectId]);

  const gate = useMemo(
    () => gateInspiration({ license, source, width: summary?.width, height: summary?.height, analysis: summary ?? null }),
    [license, source, summary],
  );

  const intent = useMemo(
    () => (summary ? buildIntent({ imgId: asset.imgId, assetName: asset.name, analysis: summary, license, source, rightsAcknowledged: ack, aspects }) : null),
    [summary, asset.imgId, asset.name, license, source, ack, aspects],
  );

  const targetCard = useMemo(() => {
    if (!projectId) return null;
    if (cardId === '__new' || !cards) return newDnaCard(projectId, newName.trim() || tr('Phương án từ cảm hứng', 'Option from inspiration'));
    return cards.find((c) => c.id === cardId) ?? null;
  }, [cards, cardId, newName, projectId, tr]);

  const changes = useMemo(() => (intent && targetCard ? describeChanges(targetCard, intent) : []), [intent, targetCard]);
  const geometryClean = intent ? intentHasNoGeometry(intent) : false;
  const applicable = !!projectId && !!intent && !!targetCard && canApply(gate, ack) && geometryClean && changes.some((c) => c.added.length > 0);

  const toggleAspect = (id: IntentAspect) =>
    setAspects((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  const apply = useCallback(async () => {
    if (!applicable || !projectId || !intent || !targetCard) return;
    setBusy(true);
    setErr(null);
    try {
      const res = applyIntent(targetCard, intent);
      const next = await putCard(projectId, res.after);
      setCards(next);
      setCardId(res.after.id);
      onApplied({
        id: intent.id,
        imgId: asset.imgId,
        assetName: asset.name,
        projectId,
        cardId: res.after.id,
        cardName: res.after.name,
        before: res.before,
        appliedAt: new Date().toISOString(),
        layers: res.changes.filter((c) => c.added.length > 0).map((c) => c.layer),
      });
      onToast(tr(`Đã góp vào "${res.after.name}" — hoàn tác được bên dưới.`, `Contributed to "${res.after.name}" — undo below.`));
    } catch {
      setErr(tr('Không lưu được Thẻ DNA — thử lại.', 'Could not save the DNA card — try again.'));
    } finally {
      setBusy(false);
    }
  }, [applicable, projectId, intent, targetCard, asset.imgId, asset.name, onApplied, onToast, tr]);

  const revert = useCallback(
    async (entry: IntentLogEntry) => {
      setBusy(true);
      setErr(null);
      try {
        const next = await putCard(entry.projectId, { ...entry.before, updatedAt: new Date().toISOString() });
        if (entry.projectId === projectId) setCards(next);
        onReverted(entry.id);
        onToast(tr(`Đã hoàn tác "${entry.cardName}".`, `Reverted "${entry.cardName}".`));
      } catch {
        setErr(tr('Không hoàn tác được — thử lại.', 'Could not revert — try again.'));
      } finally {
        setBusy(false);
      }
    },
    [projectId, onReverted, onToast, tr],
  );

  const mine = intents.filter((i) => i.imgId === asset.imgId);

  return (
    <div className="ins-sec" data-marker="inspiration-apply">
      <h4>{tr('Cổng đầu vào', 'Input gate')}</h4>
      <div className="ins-gate" role="list">
        {gate.issues.length === 0 && (
          <div className="ins-issue info" role="listitem"><Check size={12} /> {tr('Không có vấn đề — ảnh dùng được.', 'No issues — image is usable.')}</div>
        )}
        {gate.issues.map((i) => {
          const Icon = ICON[i.severity];
          return (
            <div key={i.code} className={`ins-issue ${i.severity}`} role="listitem">
              <Icon size={12} style={{ flex: 'none', marginTop: 2 }} />
              <span>{vi ? i.vi : i.en}</span>
            </div>
          );
        })}
        {gate.needsRightsAck && (
          <label className="ins-check">
            <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} />
            <span>{tr('Tôi có quyền dùng ảnh này làm tham khảo thiết kế nội bộ.', 'I have the right to use this image as an internal design reference.')}</span>
          </label>
        )}
      </div>

      <h4 style={{ marginTop: 12 }}>{tr('Áp vào Thẻ DNA', 'Apply to DNA card')}</h4>
      {!projectId ? (
        <p className="ins-note">{tr('Chọn dự án ở thanh trên để áp.', 'Pick a project in the bar above to apply.')}</p>
      ) : (
        <>
          <dl className="ins-kv">
            <dt>{tr('Dự án', 'Project')}</dt>
            <dd><span className="ins-tag">{projectName ?? projectId}</span></dd>
            <dt>{tr('Thẻ', 'Card')}</dt>
            <dd>
              <select className="ins-select" value={cardId} onChange={(e) => setCardId(e.target.value)} aria-label={tr('Chọn Thẻ DNA', 'Choose DNA card')}>
                {(cards ?? []).map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
                <option value="__new">{tr('＋ Thẻ mới', '＋ New card')}</option>
              </select>
            </dd>
            {cardId === '__new' && (
              <>
                <dt>{tr('Tên thẻ', 'Card name')}</dt>
                <dd>
                  <input className="ins-select" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder={tr('Phương án từ cảm hứng', 'Option from inspiration')} />
                </dd>
              </>
            )}
            <dt>{tr('Góp mặt', 'Contribute')}</dt>
            <dd>
              <span className="ins-aspects" role="group" aria-label={tr('Mặt sẽ góp', 'Aspects to contribute')}>
                {INTENT_ASPECTS.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    className={aspects.includes(a.id) ? 'ins-view on' : 'ins-view'}
                    aria-pressed={aspects.includes(a.id)}
                    onClick={() => toggleAspect(a.id)}
                  >
                    {vi ? a.label[0] : a.label[1]}
                  </button>
                ))}
              </span>
            </dd>
          </dl>

          {intent && targetCard && (
            <div className="ins-diff" style={{ marginTop: 8 }} aria-live="polite">
              {changes.length === 0 && <span className="ins-note">{tr('Không có gì mới để góp (thẻ đã có các giá trị này).', 'Nothing new to contribute (card already has these values).')}</span>}
              {changes.map((c) => (
                <div key={c.layer} className={c.skippedVerified ? 'row skip' : 'row'}>
                  <b>{vi ? DNA_LAYER_LABEL[c.layer].vi : DNA_LAYER_LABEL[c.layer].en}</b>
                  <span>
                    {c.skippedVerified
                      ? tr('đã xác nhận — máy không đụng', 'confirmed — machine leaves it')
                      : `+${c.added.length}: ${c.added.slice(0, 4).join(' · ')}${c.added.length > 4 ? ' …' : ''}`}
                  </span>
                </div>
              ))}
              <span className="ins-note">
                {tr('Chỉ mô tả (màu · ánh sáng · ngôn ngữ · vật liệu · khung hình). Không sao chép hình học, không khai kích thước.', 'Descriptive only (colour · light · language · material · framing). No geometry copied, no dimensions claimed.')}
                {!geometryClean && ` ⛔ ${tr('Intent chứa số đo — bị chặn.', 'Intent contains measurements — blocked.')}`}
              </span>
            </div>
          )}

          <div className="ins-actions" style={{ marginTop: 10 }}>
            <button type="button" className="ins-btn primary" onClick={apply} disabled={!applicable || busy} aria-disabled={!applicable || busy}>
              {busy ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
              {tr('Áp vào Thẻ DNA', 'Apply to DNA card')}
            </button>
            {err && <span className="ins-note" style={{ color: 'var(--danger)' }}>{err}</span>}
          </div>
        </>
      )}

      {mine.length > 0 && (
        <div className="ins-undo" style={{ marginTop: 12 }}>
          <h4>{tr('Đã áp từ ảnh này', 'Applied from this image')}</h4>
          {mine.map((e) => (
            <div key={e.id} className="row">
              <span>
                {e.cardName} · {e.layers.length} {tr('lớp', 'layers')} · {new Date(e.appliedAt).toLocaleString()}
              </span>
              <button type="button" className="ins-btn" onClick={() => revert(e)} disabled={busy}>
                <RotateCcw size={12} /> {tr('Hoàn tác', 'Undo')}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
