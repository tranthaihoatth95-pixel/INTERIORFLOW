'use client';

/**
 * components/materials/MaterialFormModal.tsx — VIỆC 3 (`docs/PHIEU-CODE-IF-KHO-VAT-LIEU-V1.md`):
 * form thêm/sửa 1 vật liệu. Ghi qua API sẵn có `POST/PATCH /api/specs` (không route riêng) — ảnh
 * qua `uploadMaterialImage()` (cùng contract `uploadCover()` ở `ProjectSelect.tsx`).
 */
import { useRef, useState } from 'react';
import { X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useT } from '@/lib/i18n';
import { uploadMaterialImage } from '@/lib/materials/warehouse/image-match';
import { imageUrlOf, type MaterialSpecDto } from '@/lib/materials/warehouse/dto';

export interface MaterialFormValues {
  name: string;
  sku: string;
  brand: string;
  unit: string;
  priceVnd: string; // giữ dạng chuỗi trong form, ép số lúc submit
  w: string;
  d: string;
  hUp: string;
  note: string;
  imageAssetId: string;
}

function toFormValues(m: MaterialSpecDto | null): MaterialFormValues {
  return {
    name: m?.name ?? '',
    sku: m?.sku ?? '',
    brand: m?.brand ?? '',
    unit: m?.unit ?? '',
    priceVnd: m?.priceVnd != null ? String(m.priceVnd) : '',
    w: m?.w != null ? String(m.w) : '',
    d: m?.d != null ? String(m.d) : '',
    hUp: m?.hUp != null ? String(m.hUp) : '',
    note: m?.note ?? '',
    imageAssetId: m?.imageAssetId ?? '',
  };
}

const inputStyle: React.CSSProperties = {
  width: '100%', height: 32, padding: '0 10px', borderRadius: 10,
  border: '1px solid var(--border)', background: 'var(--field)', color: 'var(--t1)', fontSize: 13,
};
const labelStyle: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: 'var(--t3)', display: 'block', marginBottom: 4 };

export function MaterialFormModal({
  editing,
  onClose,
  onSaved,
}: {
  /** null = thêm mới, có giá trị = sửa (đã có `id`). */
  editing: MaterialSpecDto | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const tr = useT();
  const [values, setValues] = useState<MaterialFormValues>(() => toFormValues(editing));
  const [saving, setSaving] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof MaterialFormValues>(k: K, v: MaterialFormValues[K]) =>
    setValues((prev) => ({ ...prev, [k]: v }));

  const pickImage = async (file: File) => {
    setUploadingImg(true);
    setError(null);
    try {
      const { imageAssetId } = await uploadMaterialImage(file);
      set('imageAssetId', imageAssetId);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setUploadingImg(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const submit = async () => {
    if (!values.name.trim()) {
      setError(tr('Thiếu tên vật liệu.', 'Missing material name.'));
      return;
    }
    setSaving(true);
    setError(null);
    const numOrUndef = (s: string) => (s.trim() ? Number(s.trim().replace(',', '.')) : undefined);
    const priceVnd = numOrUndef(values.priceVnd);
    if (values.priceVnd.trim() && (priceVnd === undefined || Number.isNaN(priceVnd))) {
      setSaving(false);
      setError(tr('Giá không đọc được thành số.', 'Price is not a valid number.'));
      return;
    }
    const body = {
      kind: 'material',
      name: values.name.trim(),
      sku: values.sku.trim() || undefined,
      brand: values.brand.trim() || undefined,
      unit: values.unit.trim() || undefined,
      priceVnd,
      note: values.note.trim() || undefined,
      w: numOrUndef(values.w),
      d: numOrUndef(values.d),
      hUp: numOrUndef(values.hUp),
      imageAssetId: values.imageAssetId || undefined,
      currency: 'VND',
    };
    try {
      const res = await fetch(editing ? `/api/specs/${editing.id}` : '/api/specs', {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        throw new Error(j?.error || `HTTP ${res.status}`);
      }
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  const previewUrl = values.imageAssetId ? imageUrlOf({ imageAssetId: values.imageAssetId }) : null;

  return (
    <div
      role="dialog"
      aria-modal
      style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(10,8,6,0.4)' }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: 480, maxHeight: '86vh', overflowY: 'auto', background: 'var(--panel)', borderRadius: 14, border: '1px solid var(--border)', padding: 20 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14 }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--t1)' }}>
            {editing ? tr('Sửa vật liệu', 'Edit material') : tr('Thêm vật liệu', 'Add material')}
          </span>
          <button type="button" onClick={onClose} style={{ marginLeft: 'auto', width: 26, height: 26, display: 'grid', placeItems: 'center', border: 0, borderRadius: 10, background: 'transparent', color: 'var(--t4)', cursor: 'pointer' }}>
            <X size={14} />
          </button>
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploadingImg}
            style={{
              width: 72, height: 72, flexShrink: 0, borderRadius: 10, border: '1px dashed var(--border)',
              background: previewUrl ? `var(--field) url(${previewUrl}) center/cover no-repeat` : 'var(--field)',
              display: 'grid', placeItems: 'center', color: 'var(--t4)', cursor: 'pointer', overflow: 'hidden',
            }}
            title={tr('Bấm để chọn ảnh', 'Click to pick an image')}
          >
            {uploadingImg ? <Loader2 size={16} className="animate-spin" /> : !previewUrl && <ImageIcon size={18} />}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && void pickImage(e.target.files[0])} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, justifyContent: 'center' }}>
            <label style={labelStyle}>{tr('Tên vật liệu *', 'Material name *')}</label>
            <input style={inputStyle} value={values.name} onChange={(e) => set('name', e.target.value)} placeholder={tr('vd. Gạch Terrazzo 60x60', 'e.g. Terrazzo tile 60x60')} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
          <div>
            <label style={labelStyle}>{tr('Mã (SKU)', 'SKU')}</label>
            <input style={{ ...inputStyle, fontFamily: 'ui-monospace, Menlo, monospace' }} value={values.sku} onChange={(e) => set('sku', e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>{tr('Hãng', 'Brand')}</label>
            <input style={inputStyle} value={values.brand} onChange={(e) => set('brand', e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>{tr('Giá (₫)', 'Price (₫)')}</label>
            <input style={inputStyle} value={values.priceVnd} onChange={(e) => set('priceVnd', e.target.value)} inputMode="decimal" placeholder="1250000" />
          </div>
          <div>
            <label style={labelStyle}>{tr('Đơn vị', 'Unit')}</label>
            <input style={inputStyle} value={values.unit} onChange={(e) => set('unit', e.target.value)} placeholder="m2 / cái / bộ" />
          </div>
        </div>

        <label style={labelStyle}>{tr('Kích thước (mm) — rộng · sâu · cao', 'Size (mm) — width · depth · height')}</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
          <input style={inputStyle} value={values.w} onChange={(e) => set('w', e.target.value)} inputMode="numeric" placeholder="600" />
          <input style={inputStyle} value={values.d} onChange={(e) => set('d', e.target.value)} inputMode="numeric" placeholder="600" />
          <input style={inputStyle} value={values.hUp} onChange={(e) => set('hUp', e.target.value)} inputMode="numeric" placeholder="10" />
        </div>

        <label style={labelStyle}>{tr('Ghi chú', 'Note')}</label>
        <textarea
          style={{ ...inputStyle, height: 60, padding: '8px 10px', resize: 'vertical', marginBottom: 14 }}
          value={values.note}
          onChange={(e) => set('note', e.target.value)}
        />

        {error && (
          <div style={{ marginBottom: 12, padding: '8px 10px', borderRadius: 10, background: 'color-mix(in srgb, var(--danger) 14%, var(--panel))', color: 'var(--t1)', fontSize: 12 }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button type="button" onClick={onClose} style={{ height: 32, padding: '0 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'transparent', color: 'var(--t2)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>
            {tr('Huỷ', 'Cancel')}
          </button>
          <button
            type="button"
            onClick={() => void submit()}
            disabled={saving}
            style={{ height: 32, padding: '0 16px', borderRadius: 10, border: 0, background: 'var(--accent)', color: '#fff', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            {saving && <Loader2 size={13} className="animate-spin" />}
            {editing ? tr('Lưu', 'Save') : tr('Thêm', 'Add')}
          </button>
        </div>
      </div>
    </div>
  );
}
