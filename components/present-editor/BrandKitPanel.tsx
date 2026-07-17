'use client';

/**
 * components/present-editor/BrandKitPanel.tsx — Panel NHẬN DIỆN (Brand Kit) — PS-1 / G.5·G.6·G.7.
 *
 * Modal gọn: logo · bộ màu (6) · cặp font · watermark. Thao tác:
 *   - "Lưu Brand Kit"           → persist localStorage (lib/present-editor/brand-kit), đặt active.
 *   - "Áp lại theme cho cả deck" → NHUỘM LẠI mọi slide theo palette + font + watermark của kit.
 *   - chọn/xoá kit đã lưu (danh sách phẳng — TTT chỉ cần 1–vài brand, KHÔNG kiểu Canva 100 brand).
 *
 * Panel KHÔNG tự đọc localStorage lúc render (hydration-safe): nạp danh sách kit trong effect khi mở.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import type { EditorDeck } from '@/lib/present-editor/model';
import type { FontPairing } from '@/lib/slides';
import {
  type BrandKit,
  type BrandWatermark,
  DEFAULT_BRAND_WATERMARK,
  getBrandKits,
  getActiveBrandKit,
  saveBrandKit,
  deleteBrandKit,
  setActiveBrandKit,
} from '@/lib/present-editor/brand-kit';

const FONT_OPTIONS: FontPairing[] = ['Editorial', 'Modern', 'Elegant'];
const CORNERS: { v: BrandWatermark['corner']; label: string }[] = [
  { v: 'tl', label: '↖' },
  { v: 'tr', label: '↗' },
  { v: 'bl', label: '↙' },
  { v: 'br', label: '↘' },
];

interface Props {
  deck: EditorDeck;
  onClose: () => void;
  /** áp Brand Kit hiện trên panel vào deck (nhuộm lại + font + watermark). */
  onApply: (kit: BrandKit, watermarkEnabled: boolean) => void;
}

function normHex(v: string): string {
  const s = v.trim();
  return /^#[0-9a-fA-F]{6}$/.test(s) ? s.toLowerCase() : s;
}

export default function BrandKitPanel({ deck, onClose, onApply }: Props) {
  // giá trị đang chỉnh trên panel (khởi từ deck để "áp lại" trực quan với gu hiện tại).
  const [name, setName] = useState(deck.brand || 'TTT');
  const [logo, setLogo] = useState<string | null>(deck.watermark?.src ?? null);
  const [palette, setPalette] = useState<string[]>(() => {
    const p = [...deck.palette];
    while (p.length < 6) p.push('#cccccc');
    return p.slice(0, 6);
  });
  const [fonts, setFonts] = useState<FontPairing>(deck.fonts);
  const [wm, setWm] = useState<BrandWatermark>(
    deck.watermark
      ? {
          corner: deck.watermark.corner,
          sizePct: deck.watermark.sizePct,
          opacity: deck.watermark.opacity,
          marginPct: deck.watermark.marginPct ?? DEFAULT_BRAND_WATERMARK.marginPct,
        }
      : { ...DEFAULT_BRAND_WATERMARK },
  );
  const [wmEnabled, setWmEnabled] = useState<boolean>(deck.watermark?.enabled ?? false);
  const [editingId, setEditingId] = useState<string>(''); // id kit đang chỉnh ('' = kit mới)
  const [kits, setKits] = useState<BrandKit[]>([]);
  const [saved, setSaved] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Nạp danh sách kit + active khi mở (sau mount).
  useEffect(() => {
    const list = getBrandKits();
    setKits(list);
    const active = getActiveBrandKit();
    if (active) loadKit(active);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function loadKit(k: BrandKit) {
    setEditingId(k.id);
    setName(k.name);
    setLogo(k.logo);
    const p = [...k.palette];
    while (p.length < 6) p.push('#cccccc');
    setPalette(p.slice(0, 6));
    setFonts(k.fonts);
    setWm(k.watermark);
    setWmEnabled(!!k.logo);
  }

  const currentKit: BrandKit = useMemo(
    () => ({
      id: editingId,
      name,
      logo,
      palette: palette.map(normHex),
      fonts,
      watermark: wm,
      updatedAt: Date.now(),
    }),
    [editingId, name, logo, palette, fonts, wm],
  );

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      setLogo(String(reader.result));
      setWmEnabled(true);
    };
    reader.readAsDataURL(f);
    e.target.value = '';
  }

  function onSave() {
    const k = saveBrandKit({ ...currentKit, id: editingId || undefined });
    setEditingId(k.id);
    setKits(getBrandKits());
    setSaved('Đã lưu Brand Kit ✓');
    setTimeout(() => setSaved(null), 1800);
  }

  function onApplyClick() {
    // áp kit hiện trên panel + cờ bật/tắt watermark (parent nhuộm lại cả deck).
    onApply(currentKit, wmEnabled && !!logo);
  }

  function onPickKit(id: string) {
    const k = kits.find((x) => x.id === id);
    if (k) {
      setActiveBrandKit(id);
      loadKit(k);
    }
  }

  function onDelete(id: string) {
    deleteBrandKit(id);
    const list = getBrandKits();
    setKits(list);
    if (id === editingId) {
      setEditingId('');
    }
  }

  return (
    <div
      role="dialog"
      aria-label="Brand Kit — Nhận diện"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 80,
        background: 'rgba(0,0,0,.45)',
        display: 'grid',
        placeItems: 'center',
      }}
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: 460,
          maxWidth: '94vw',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 14,
          padding: 18,
          boxShadow: '0 24px 70px rgba(0,0,0,.5)',
          color: 'var(--t1)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <strong style={{ fontSize: 15 }}>Brand Kit — Nhận diện</strong>
          <button type="button" onClick={onClose} title="Đóng" style={xBtn}>
            ×
          </button>
        </div>

        {/* Kit đã lưu */}
        {kits.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <Label>Brand Kit đã lưu</Label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {kits.map((k) => (
                <div key={k.id} style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <button
                    type="button"
                    onClick={() => onPickKit(k.id)}
                    style={{
                      ...chip,
                      borderColor: k.id === editingId ? 'var(--accent)' : 'var(--border)',
                      color: k.id === editingId ? 'var(--accent)' : 'var(--t2)',
                    }}
                  >
                    {k.name || 'Không tên'}
                  </button>
                  <button type="button" onClick={() => onDelete(k.id)} title="Xoá kit" style={xMini}>
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tên */}
        <div style={{ marginBottom: 14 }}>
          <Label>Tên Brand Kit</Label>
          <input value={name} onChange={(e) => setName(e.target.value)} style={input} placeholder="TTT Architects" />
        </div>

        {/* Logo */}
        <div style={{ marginBottom: 14 }}>
          <Label>Logo</Label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 72,
                height: 44,
                border: '1px dashed var(--border)',
                borderRadius: 8,
                display: 'grid',
                placeItems: 'center',
                overflow: 'hidden',
                background: 'var(--field)',
              }}
            >
              {logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logo} alt="logo" style={{ maxWidth: '100%', maxHeight: '100%' }} />
              ) : (
                <span style={{ fontSize: 10, color: 'var(--t4)' }}>chưa có</span>
              )}
            </div>
            <button type="button" onClick={() => fileRef.current?.click()} style={btn}>
              Tải logo…
            </button>
            {logo && (
              <button
                type="button"
                onClick={() => {
                  setLogo(null);
                  setWmEnabled(false);
                }}
                style={btnGhost}
              >
                Gỡ
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile} />
          </div>
        </div>

        {/* Palette */}
        <div style={{ marginBottom: 14 }}>
          <Label>Bộ màu (6)</Label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {palette.map((c, i) => (
              <label key={i} style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <input
                  type="color"
                  value={/^#[0-9a-fA-F]{6}$/.test(c) ? c : '#cccccc'}
                  onChange={(e) => setPalette((p) => p.map((x, j) => (j === i ? e.target.value : x)))}
                  style={{ width: 40, height: 34, border: '1px solid var(--border)', borderRadius: 6, background: 'transparent', cursor: 'pointer' }}
                  title={`Màu ${i + 1}`}
                />
              </label>
            ))}
          </div>
        </div>

        {/* Font */}
        <div style={{ marginBottom: 14 }}>
          <Label>Cặp font</Label>
          <div style={{ display: 'flex', gap: 6 }}>
            {FONT_OPTIONS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFonts(f)}
                style={{ ...chip, borderColor: fonts === f ? 'var(--accent)' : 'var(--border)', color: fonts === f ? 'var(--accent)' : 'var(--t2)' }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Watermark */}
        <div style={{ marginBottom: 16, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, cursor: logo ? 'pointer' : 'default', opacity: logo ? 1 : 0.5 }}>
            <input type="checkbox" checked={wmEnabled} disabled={!logo} onChange={(e) => setWmEnabled(e.target.checked)} />
            <span style={{ fontSize: 13, fontWeight: 600 }}>Hiện logo/watermark trên mọi slide</span>
          </label>
          {logo && wmEnabled && (
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div>
                <Label>Góc</Label>
                <div style={{ display: 'flex', gap: 4 }}>
                  {CORNERS.map((c) => (
                    <button
                      key={c.v}
                      type="button"
                      onClick={() => setWm((w) => ({ ...w, corner: c.v }))}
                      style={{ ...cornerBtn, borderColor: wm.corner === c.v ? 'var(--accent)' : 'var(--border)', color: wm.corner === c.v ? 'var(--accent)' : 'var(--t2)' }}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Cỡ {wm.sizePct}%</Label>
                <input type="range" min={4} max={30} value={wm.sizePct} onChange={(e) => setWm((w) => ({ ...w, sizePct: Number(e.target.value) }))} />
              </div>
              <div>
                <Label>Mờ {Math.round(wm.opacity * 100)}%</Label>
                <input type="range" min={10} max={100} value={Math.round(wm.opacity * 100)} onChange={(e) => setWm((w) => ({ ...w, opacity: Number(e.target.value) / 100 }))} />
              </div>
            </div>
          )}
        </div>

        {/* Hành động */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button type="button" onClick={onSave} style={btn}>
            Lưu Brand Kit
          </button>
          <button type="button" onClick={onApplyClick} style={btnPrimary}>
            Áp lại theme cho cả deck
          </button>
          <div style={{ flex: 1 }} />
          {saved && <span style={{ fontSize: 12, color: 'var(--accent)' }}>{saved}</span>}
        </div>
        <p style={{ fontSize: 11, color: 'var(--t4)', marginTop: 10, lineHeight: 1.5 }}>
          "Áp lại theme" nhuộm lại nền + màu chữ + hình khối của MỌI slide theo bộ màu này (giữ nội
          dung/bố cục). Deck mới sẽ tự nạp Brand Kit đang chọn.
        </p>
      </div>
    </div>
  );
}

/* ------------------------------- styles ------------------------------- */
function Label({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 6, fontWeight: 600 }}>{children}</div>;
}
const input: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  borderRadius: 8,
  border: '1px solid var(--border)',
  background: 'var(--field)',
  color: 'var(--t1)',
  fontSize: 13,
};
const btn: React.CSSProperties = {
  padding: '8px 12px',
  borderRadius: 8,
  border: '1px solid var(--border)',
  background: 'var(--field)',
  color: 'var(--t2)',
  fontSize: 13,
  cursor: 'pointer',
};
const btnGhost: React.CSSProperties = { ...btn, borderColor: 'transparent', color: 'var(--t3)' };
const btnPrimary: React.CSSProperties = {
  ...btn,
  border: '1px solid var(--accent)',
  background: 'var(--accent)',
  color: '#fff',
  fontWeight: 600,
};
const chip: React.CSSProperties = {
  padding: '6px 12px',
  borderRadius: 999,
  border: '1px solid var(--border)',
  background: 'var(--field)',
  fontSize: 12.5,
  cursor: 'pointer',
};
const cornerBtn: React.CSSProperties = {
  width: 34,
  height: 30,
  borderRadius: 6,
  border: '1px solid var(--border)',
  background: 'var(--field)',
  cursor: 'pointer',
  fontSize: 14,
};
const xBtn: React.CSSProperties = {
  border: 'none',
  background: 'transparent',
  color: 'var(--t3)',
  cursor: 'pointer',
  fontSize: 20,
  lineHeight: 1,
};
const xMini: React.CSSProperties = {
  border: 'none',
  background: 'transparent',
  color: 'var(--t4)',
  cursor: 'pointer',
  fontSize: 14,
  lineHeight: 1,
  padding: '0 2px',
};
