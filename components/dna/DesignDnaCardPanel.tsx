'use client';

/**
 * components/dna/DesignDnaCardPanel.tsx — UI Thẻ DNA Thiết kế trong Tổng quan dự án
 * (phiếu `docs/phieu-giao/dna-card.md` ④.5).
 *
 * N thẻ / dự án (mỗi phương án 1 thẻ) · 8 lớp cố định (`lib/dna/types.ts`) · badge trạng
 * thái 3 nấc measured/inferred/verified (màu theo quy ước ĐÃ CÓ ở `ToolModeForm.tsx`:
 * 🟢 ĐO = --success, 🟡 SUY = --warning; verified thêm ✓ --accent vì đây là lớp "người đã
 * xác nhận", khác `measured` "đo/đọc trực tiếp") · nút "Chưng cất từ ảnh dự án" (chọn tay
 * ảnh trong Thư viện, chạy Distiller v1 rule-based 0-key) · sửa tay từng lớp (gõ, phân
 * cách dấu phẩy → verified) · tạo thẻ mới.
 *
 * CẤM chấm điểm (luật 12.3: không "7/10") — không có trường số nào trong UI này.
 * CẤM nói xu hướng không dẫn nguồn — mọi giá trị hiển thị kèm badge NGUỒN (đếm số ảnh).
 * Trung tính: layer rỗng lúc khởi tạo, không có gu mặc định nào bơm sẵn.
 *
 * QUAN TRỌNG (ghi rõ để phiên sau không ngỡ ngàng): `LibraryAsset` (prisma/schema.prisma:278)
 * KHÔNG có cột `projectId` — thư viện là kho DÙNG CHUNG CẢ TEAM, không tách theo dự án ở tầng
 * DB. Vì vậy "Chưng cất từ ảnh dự án" ở đây là NGƯỜI TỰ CHỌN ảnh từ toàn bộ Thư viện của mình
 * (không tự động quét "ảnh của dự án X" — thứ đó không tồn tại được cho tới khi có field nối,
 * việc CẤM ở phiếu này). Đây là quyết định CÓ CHỦ Ý, không phải thiếu sót — xem báo cáo phiên
 * `docs/bao-cao-phien/2026-08-12-V2-dna-card.md`.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, ChevronDown, ChevronUp, ImagePlus, Loader2, Plus, Sparkles, Trash2 } from 'lucide-react';
import { useT } from '@/lib/i18n';
import { distillDnaFromAssets, mergeDistilledIntoCard, type DnaSourceAsset } from '@/lib/dna/distiller';
import { DNA_LAYER_KEYS, DNA_LAYER_LABEL, newDnaCard, type DesignDnaCard, type DnaLayerKey } from '@/lib/dna/types';
import type { TrangThaiNguon } from '@/lib/distill/types';

interface LibraryAssetLite {
  id: string;
  name: string;
  url: string;
  palette: string[];
  caption: string;
  tags: string;
}

const STATE_META: Record<TrangThaiNguon, { icon: typeof CheckCircle2; label: (vi: boolean) => string; color: string }> = {
  measured: { icon: CheckCircle2, label: (vi) => (vi ? 'Đo được' : 'Measured'), color: 'var(--success)' },
  inferred: { icon: Sparkles, label: (vi) => (vi ? 'Máy gợi ý' : 'Suggested'), color: 'var(--warning)' },
  verified: { icon: CheckCircle2, label: (vi) => (vi ? 'Đã xác nhận' : 'Confirmed'), color: 'var(--accent)' },
};

function fieldStyle(): React.CSSProperties {
  return {
    width: '100%',
    padding: '8px 10px',
    borderRadius: 'var(--r-2)',
    border: '1px solid var(--border)',
    background: 'var(--field)',
    color: 'var(--t1)',
    fontSize: 12.5,
    fontFamily: 'inherit',
    resize: 'vertical',
    minHeight: 40,
  };
}

async function fetchDnaCards(projectId: string): Promise<DesignDnaCard[]> {
  const r = await fetch(`/api/projects/${encodeURIComponent(projectId)}/dna`);
  if (!r.ok) throw new Error('load-failed');
  const j = (await r.json()) as { cards: DesignDnaCard[] };
  return j.cards;
}

async function putDnaCard(projectId: string, card: DesignDnaCard): Promise<DesignDnaCard[]> {
  const r = await fetch(`/api/projects/${encodeURIComponent(projectId)}/dna`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ card }),
  });
  if (!r.ok) throw new Error('save-failed');
  const j = (await r.json()) as { cards: DesignDnaCard[] };
  return j.cards;
}

async function deleteDnaCardApi(projectId: string, cardId: string): Promise<DesignDnaCard[]> {
  const r = await fetch(`/api/projects/${encodeURIComponent(projectId)}/dna?cardId=${encodeURIComponent(cardId)}`, {
    method: 'DELETE',
  });
  if (!r.ok) throw new Error('delete-failed');
  const j = (await r.json()) as { cards: DesignDnaCard[] };
  return j.cards;
}

export default function DesignDnaCardPanel({ projectId }: { projectId: string }) {
  const t = useT();
  const [cards, setCards] = useState<DesignDnaCard[] | null>(null);
  const [state, setState] = useState<'loading' | 'ok' | 'error'>('loading');
  const [busyCardId, setBusyCardId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    let alive = true;
    setState('loading');
    fetchDnaCards(projectId)
      .then((c) => {
        if (!alive) return;
        setCards(c);
        setState('ok');
      })
      .catch(() => alive && setState('error'));
    return () => {
      alive = false;
    };
  }, [projectId]);

  const createCard = useCallback(async () => {
    const name = t('Phương án mới', 'New option');
    const card = newDnaCard(projectId, `${name} ${(cards?.length ?? 0) + 1}`);
    setBusyCardId(card.id);
    try {
      const next = await putDnaCard(projectId, card);
      setCards(next);
    } finally {
      setBusyCardId(null);
    }
  }, [projectId, cards, t]);

  const saveCard = useCallback(
    async (card: DesignDnaCard) => {
      setBusyCardId(card.id);
      try {
        const next = await putDnaCard(projectId, { ...card, updatedAt: new Date().toISOString() });
        setCards(next);
      } finally {
        setBusyCardId(null);
      }
    },
    [projectId],
  );

  const removeCard = useCallback(
    async (cardId: string) => {
      setBusyCardId(cardId);
      try {
        const next = await deleteDnaCardApi(projectId, cardId);
        setCards(next);
      } finally {
        setBusyCardId(null);
      }
    },
    [projectId],
  );

  return (
    <section
      style={{
        marginTop: 32,
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-3)',
        background: 'var(--field)',
        overflow: 'hidden',
      }}
    >
      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          padding: '14px 16px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--t1)',
          textAlign: 'left',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sparkles size={20} style={{ color: 'var(--accent)' }} />
          <span style={{ fontSize: 13, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--t3)' }}>
            {t('Thẻ DNA Thiết kế', 'Design DNA Card')}
          </span>
          {cards && cards.length > 0 && (
            <span style={{ fontSize: 11, color: 'var(--t4)' }}>· {cards.length}</span>
          )}
        </span>
        {collapsed ? <ChevronDown size={16} style={{ color: 'var(--t4)' }} /> : <ChevronUp size={16} style={{ color: 'var(--t4)' }} />}
      </button>

      {!collapsed && (
        <div style={{ padding: '0 16px 16px' }}>
          {state === 'loading' && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}>
              <Loader2 size={18} className="animate-spin" style={{ color: 'var(--t4)' }} />
            </div>
          )}
          {state === 'error' && (
            <p style={{ fontSize: 12.5, color: 'var(--danger)' }}>
              {t('Không tải được Thẻ DNA — thử lại.', 'Could not load Design DNA cards — try again.')}
            </p>
          )}
          {state === 'ok' && cards && (
            <>
              {cards.length === 0 ? (
                <div style={{ padding: '20px 4px', textAlign: 'center' }}>
                  <p style={{ fontSize: 12.5, color: 'var(--t3)', marginBottom: 12 }}>
                    {t(
                      'Chưa có Thẻ DNA nào — chưng cất gu của dự án từ ảnh tham khảo.',
                      'No Design DNA card yet — distill this project’s look from reference images.',
                    )}
                  </p>
                  <button type="button" onClick={createCard} style={primaryBtn}>
                    <Plus size={18} /> {t('Tạo thẻ đầu tiên', 'Create first card')}
                  </button>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 4 }}>
                    {cards.map((c) => (
                      <DnaCardEditor
                        key={c.id}
                        card={c}
                        busy={busyCardId === c.id}
                        onSave={saveCard}
                        onDelete={() => removeCard(c.id)}
                      />
                    ))}
                  </div>
                  <button type="button" onClick={createCard} style={{ ...secondaryBtn, marginTop: 12 }}>
                    <Plus size={18} /> {t('Thêm phương án khác', 'Add another option')}
                  </button>
                </>
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
}

const primaryBtn: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '8px 14px',
  borderRadius: 'var(--r-2)',
  border: 'none',
  background: 'var(--accent)',
  color: '#fff',
  fontSize: 12.5,
  cursor: 'pointer',
};

const secondaryBtn: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '8px 14px',
  borderRadius: 'var(--r-2)',
  border: '1px solid var(--border)',
  background: 'var(--panel, var(--card))',
  color: 'var(--t2)',
  fontSize: 12.5,
  cursor: 'pointer',
};

function DnaCardEditor({
  card,
  busy,
  onSave,
  onDelete,
}: {
  card: DesignDnaCard;
  busy: boolean;
  onSave: (card: DesignDnaCard) => void;
  onDelete: () => void;
}) {
  const t = useT();
  const [draft, setDraft] = useState(card);
  const [pickerOpen, setPickerOpen] = useState(false);
  const dirty = draft !== card;

  useEffect(() => setDraft(card), [card]);

  const setLayerText = (key: DnaLayerKey, text: string) => {
    const values = text
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
    setDraft((d) => ({
      ...d,
      layers: { ...d.layers, [key]: { values, trangThai: 'verified', nguon: ['manual'] } },
    }));
  };

  const applyDistilled = (assets: DnaSourceAsset[]) => {
    const distilled = distillDnaFromAssets(assets);
    setDraft((d) => ({ ...d, layers: mergeDistilledIntoCard(d.layers, distilled) }));
    setPickerOpen(false);
  };

  return (
    <div
      style={{
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-3)',
        background: 'var(--card, var(--panel))',
        padding: 14,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <input
          value={draft.name}
          onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
          placeholder={t('Tên phương án', 'Option name')}
          style={{
            flex: 1,
            padding: '6px 8px',
            borderRadius: 'var(--r-1)',
            border: '1px solid transparent',
            background: 'transparent',
            color: 'var(--t1)',
            fontSize: 14,
            fontWeight: 600,
          }}
        />
        <button
          type="button"
          onClick={() => setPickerOpen((v) => !v)}
          title={t('Chưng cất từ ảnh dự án', 'Distill from project images')}
          style={{ ...secondaryBtn, padding: '6px 10px' }}
        >
          <ImagePlus size={16} /> {t('Chưng cất từ ảnh', 'Distill from images')}
        </button>
        <button
          type="button"
          onClick={onDelete}
          title={t('Xoá thẻ', 'Delete card')}
          style={{ ...secondaryBtn, padding: '6px 8px', color: 'var(--danger)', borderColor: 'var(--danger)' }}
        >
          <Trash2 size={16} />
        </button>
      </div>

      {pickerOpen && (
        <AssetPicker onDistill={applyDistilled} onClose={() => setPickerOpen(false)} />
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10, marginTop: 10 }}>
        {DNA_LAYER_KEYS.map((key) => {
          const field = draft.layers[key];
          const meta = STATE_META[field.trangThai];
          const Icon = meta.icon;
          const isEmpty = field.values.length === 0;
          return (
            <div key={key}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 11, color: 'var(--t3)', letterSpacing: '0.03em' }}>
                  {t(DNA_LAYER_LABEL[key].vi, DNA_LAYER_LABEL[key].en)}
                </span>
                {!isEmpty && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 3,
                      fontSize: 10,
                      color: meta.color,
                    }}
                    title={`${meta.label(true)} · ${field.nguon.length} ${t('nguồn', 'source(s)')}`}
                  >
                    <Icon size={14} />
                    {meta.label(true)}
                  </span>
                )}
              </div>
              <textarea
                value={field.values.join(', ')}
                onChange={(e) => setLayerText(key, e.target.value)}
                placeholder={t('Chưa có — gõ tay hoặc chưng cất từ ảnh', 'Empty — type manually or distill from images')}
                style={fieldStyle()}
                rows={2}
              />
            </div>
          );
        })}
      </div>

      {dirty && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 10 }}>
          <button type="button" onClick={() => setDraft(card)} style={secondaryBtn} disabled={busy}>
            {t('Huỷ sửa', 'Discard')}
          </button>
          <button type="button" onClick={() => onSave(draft)} style={primaryBtn} disabled={busy}>
            {busy ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
            {t('Lưu thẻ', 'Save card')}
          </button>
        </div>
      )}
    </div>
  );
}

/** Chọn ảnh TAY từ toàn bộ Thư viện của người dùng (không có cột projectId trên LibraryAsset
 * — xem ghi chú đầu file) rồi chạy Distiller v1 rule-based 0-key ngay trên trình duyệt. */
function AssetPicker({ onDistill, onClose }: { onDistill: (assets: DnaSourceAsset[]) => void; onClose: () => void }) {
  const t = useT();
  const [assets, setAssets] = useState<LibraryAssetLite[] | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    let alive = true;
    fetch('/api/library')
      .then((r) => r.json())
      .then((j: { assets: LibraryAssetLite[] }) => {
        if (alive) setAssets(j.assets ?? []);
      })
      .catch(() => alive && setAssets([]));
    return () => {
      alive = false;
    };
  }, []);

  const toggle = (id: string) => {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const run = () => {
    const chosen = (assets ?? []).filter((a) => selected.has(a.id));
    const mapped: DnaSourceAsset[] = chosen.map((a) => ({ id: a.id, palette: a.palette, caption: a.caption, tags: a.tags }));
    onDistill(mapped);
  };

  return (
    <div
      style={{
        border: '1px dashed var(--border)',
        borderRadius: 'var(--r-2)',
        padding: 10,
        marginBottom: 10,
        background: 'var(--field)',
      }}
    >
      <p style={{ fontSize: 11, color: 'var(--t4)', marginBottom: 8 }}>
        {t(
          'Chọn ảnh tham khảo từ Thư viện của bạn — máy chưng cất màu/vật liệu/ánh sáng theo tag, không đoán bừa.',
          'Pick reference images from your Library — the engine distills color/material/lighting from tags, no guessing.',
        )}
      </p>
      {assets === null ? (
        <Loader2 size={14} className="animate-spin" style={{ color: 'var(--t4)' }} />
      ) : assets.length === 0 ? (
        <p style={{ fontSize: 11.5, color: 'var(--t4)' }}>{t('Thư viện chưa có ảnh nào.', 'Your library has no images yet.')}</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(64px, 1fr))', gap: 6, maxHeight: 180, overflowY: 'auto' }}>
          {assets.map((a) => {
            const on = selected.has(a.id);
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => toggle(a.id)}
                title={a.name}
                style={{
                  padding: 0,
                  border: `2px solid ${on ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: 'var(--r-1)',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  aspectRatio: '1 / 1',
                  background: 'var(--card, var(--panel))',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={a.url} alt={a.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </button>
            );
          })}
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
        <button type="button" onClick={onClose} style={secondaryBtn}>
          {t('Đóng', 'Close')}
        </button>
        <button type="button" onClick={run} disabled={selected.size === 0} style={primaryBtn}>
          <Sparkles size={18} /> {t(`Chưng cất (${selected.size})`, `Distill (${selected.size})`)}
        </button>
      </div>
    </div>
  );
}
