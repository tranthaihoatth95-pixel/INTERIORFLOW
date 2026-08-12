'use client';

/**
 * components/materials/MaterialPbrEditor.tsx — VIỆC 5 PHẦN B (07/08, Hoà chốt): lớp chỉnh vật
 * liệu "GỌN VÀ ĐÚNG" — 4 núm nhìn thấy (① loại · ② màu · ③ độ nhám · ④ độ trong CHỈ với kính),
 * 2 khoá vật lý hiện-nhưng-không-sửa-được (metallic 0/1 theo loại · specular 0.04), 3 map ảnh
 * NẠP ẢNH không nhập số, phần hiếm dùng ẩn sau "Nâng cao". Logic thuần ở
 * `lib/materials/material-edit.ts` (test riêng) — file này chỉ là mặt bàn phím.
 *
 * Lưu theo matId (= `ProductSpec.sku`) vào kho studio `lib/materials/pbr-store.ts`. Khuôn modal
 * chép theo `MaterialFormModal.tsx` cùng thư mục (inputStyle/labelStyle/khung dialog) — một
 * ngôn ngữ giao diện, không sáng tác khung mới.
 */
import { useMemo, useRef, useState } from 'react';
import { X, Lock, Upload, ChevronRight, Sparkles, RotateCcw, Download } from 'lucide-react';
import { useT } from '@/lib/i18n';
import type { MaterialPbr } from '@/lib/materials/schema';
import { DEFAULT_PBR } from '@/lib/materials/schema';
import { toVRayMtl } from '@/lib/materials/export-vray';
import { toD5Material } from '@/lib/materials/export-d5';
import {
  MATERIAL_TYPES,
  materialTypeOf,
  applyMaterialType,
  setRoughness,
  setBaseColor,
  setTransparency,
  type MaterialTypeId,
} from '@/lib/materials/material-edit';
import { inferPbrFromCategory } from '@/lib/materials/pbr-from-category';
import { getPbr, savePbr, removePbr } from '@/lib/materials/pbr-store';
import MaterialSphere from '@/components/three/MaterialSphere';
import type { PreviewSpec } from '@/components/three/material-preview';
import { pbrCacheKey } from '@/lib/three/pbr-three';

const inputStyle: React.CSSProperties = {
  width: '100%', height: 'var(--tap)', padding: '0 10px', borderRadius: 10,
  border: '1px solid var(--border)', background: 'var(--field)', color: 'var(--t1)', fontSize: 'var(--fs-ui)',
};
const labelStyle: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: 'var(--t3)', display: 'block', marginBottom: 4 };
const lockRow: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--t3)' };

/** Đọc 1 file ảnh → data-URI (map lưu thẳng trong pbr, không upload server — kho studio cục bộ). */
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

export function MaterialPbrEditor({
  matId,
  name,
  categoryHint,
  onClose,
}: {
  /** = ProductSpec.sku — món không có SKU thì nút mở editor không hiện (MaterialTable). */
  matId: string;
  name: string;
  /** chuỗi gợi ý loại khi CHƯA có pbr lưu — thường là tên/danh mục món (suy đoán, có cờ). */
  categoryHint?: string | null;
  onClose: () => void;
}) {
  const tr = useT();
  const [pbr, setPbr] = useState<MaterialPbr>(() => {
    const saved = getPbr(matId);
    if (saved) return saved;
    // chưa từng chỉnh — khởi tạo bằng SUY ĐOÁN từ danh mục/tên, GIỮ cờ suyDoan để UI hiện rõ
    return { ...inferPbrFromCategory(categoryHint ?? name) };
  });
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  /**
   * §1#7 (08/08) — bản PBR ĐÃ LƯU trong pbr-store: nguồn duy nhất cho 2 nút Xuất V-Ray/D5.
   * Xuất bản ĐÃ LƯU chứ không xuất state đang gõ dở — file tải về phải khớp cái kho đang giữ
   * (cùng cái quả cầu ở Thư viện/scene sẽ đọc), không phải bản nháp chưa bấm Lưu. Chưa từng
   * lưu (chỉ có suy đoán) → nút khoá kèm lý do (luật §9: disabled phải nói vì sao).
   */
  const [savedPbr, setSavedPbr] = useState<MaterialPbr | null>(() => getPbr(matId));
  const normalRef = useRef<HTMLInputElement>(null);
  const aoRef = useRef<HTMLInputElement>(null);
  const heightRef = useRef<HTMLInputElement>(null);
  const baseMapRef = useRef<HTMLInputElement>(null);
  const roughMapRef = useRef<HTMLInputElement>(null);
  const metalMapRef = useRef<HTMLInputElement>(null);

  const typeDef = materialTypeOf(pbr.typeId);

  const preview: PreviewSpec = useMemo(() => {
    const c = pbr.baseColor ?? '#9a9a9a';
    // id trộn pbrCacheKey — MaterialSphere chỉ nghe spec.id, mọi thay đổi pbr (kể cả nạp map)
    // phải làm id đổi thì quả cầu mới render lại (VIỆC 2: quả cầu PHẢI hiện vân sau khi nạp).
    return { id: `pbr-edit:${matId}:${pbrCacheKey(pbr)}`, colorA: c, colorB: c,
      kind: typeDef?.previewKind ?? 'paint', pbr };
  }, [matId, pbr, typeDef]);

  const update = (next: MaterialPbr) => { setPbr(next); setSavedFlash(false); };

  type MapField = 'normalUrl' | 'aoUrl' | 'heightUrl' | 'baseColorMapUrl' | 'roughnessMapUrl' | 'metallicMapUrl';
  const pickMap = async (which: MapField, file: File) => {
    const url = await fileToDataUrl(file);
    update({ ...pbr, [which]: url });
  };

  const save = () => {
    savePbr(matId, pbr);
    setSavedPbr(pbr);
    setSavedFlash(true);
  };
  const reset = () => {
    removePbr(matId); // KS4 — lùi về "chưa có PBR"
    setSavedPbr(null);
    update({ ...inferPbrFromCategory(categoryHint ?? name) });
  };

  /**
   * Xuất tham số engine (§1#7 — mở kho `toVRayMtl`/`toD5Material`, trước giờ 0 caller).
   * File là JSON THAM SỐ (đuôi .vray.json/.d5mat.json) — KHÔNG phải file .vrmat nhị phân của
   * Chaos hay format nội bộ D5: 2 hàm export tự khai trong docblock "ai nối vào engine thật tự
   * map object trả về sang SDK", nên đặt đuôi .vrmat giả là lừa người dùng mở bằng V-Ray thật.
   * Khuôn tải Blob chép theo `ColorMatchPanel.tsx:52` (cùng họ a.click + revokeObjectURL).
   */
  const exportEngine = (engine: 'vray' | 'd5') => {
    if (!savedPbr) return;
    const fallback = savedPbr.baseColor ?? '#9a9a9a'; // cùng fallback màu với quả cầu preview
    const payload = {
      format: engine === 'vray' ? 'if-vraymtl-params@1' : 'if-d5-material-params@1',
      matId,
      name,
      exportedAt: new Date().toISOString(),
      data: engine === 'vray' ? toVRayMtl(savedPbr, fallback) : toD5Material(savedPbr, fallback),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${matId}.${engine === 'vray' ? 'vray' : 'd5mat'}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const mapBtn = (which: MapField, ref: React.RefObject<HTMLInputElement>, label: string) => (
    <div>
      <label style={labelStyle}>{label}</label>
      <button type="button" onClick={() => ref.current?.click()}
        style={{ ...inputStyle, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: pbr[which] ? 'var(--t1)' : 'var(--t4)' }}>
        <Upload size={13} />
        {pbr[which] ? tr('Đã nạp — bấm đổi', 'Loaded — click to replace') : tr('Nạp ảnh…', 'Load image…')}
      </button>
      <input ref={ref} type="file" accept="image/*" className="hidden"
        onChange={(e) => e.target.files?.[0] && void pickMap(which, e.target.files[0])} />
    </div>
  );

  return (
    <div role="dialog" aria-modal
      style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(10,8,6,0.4)' }}
      onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}
        style={{ width: 480, maxHeight: '86vh', overflowY: 'auto', background: 'var(--panel)', borderRadius: 14, border: '1px solid var(--border)', padding: 20 }}>

        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--t1)' }}>{tr('Chất liệu render', 'Render material')}</span>
          <button type="button" onClick={onClose} style={{ marginLeft: 'auto', width: 26, height: 26, display: 'grid', placeItems: 'center', border: 0, borderRadius: 6, background: 'transparent', color: 'var(--t4)', cursor: 'pointer' }}>
            <X size={14} />
          </button>
        </div>
        <div style={{ fontSize: 12, color: 'var(--t3)', marginBottom: 12, lineHeight: 1.5 }}>
          {name} · <span style={{ fontFamily: 'ui-monospace, Menlo, monospace' }}>{matId}</span>
        </div>

        {pbr.suyDoan && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, padding: '7px 10px', borderRadius: 10, background: 'color-mix(in srgb, var(--warning) 14%, var(--panel))', color: 'var(--t1)', fontSize: 12, lineHeight: 1.5 }}>
            <Sparkles size={13} />
            {tr('Số liệu đang là SUY ĐOÁN từ tên/danh mục — chưa ai đo hay chọn tay. Chỉnh một núm là hết suy đoán.', 'Values are GUESSED from the name/category — not measured. Adjust any control to confirm them.')}
          </div>
        )}

        <div style={{ display: 'flex', gap: 14, marginBottom: 14 }}>
          <MaterialSphere spec={preview} fallback={`radial-gradient(circle at 35% 30%, ${pbr.baseColor ?? '#9a9a9a'}, #555)`}
            size={96} resolution={1} fit="contain" title={typeDef ? typeDef.label[0] : tr('Chưa chọn loại', 'No type yet')}
            style={{ width: 96, height: 96, borderRadius: 10, flexShrink: 0, border: '1px solid var(--border)' }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <label style={labelStyle}>{tr('① Loại vật liệu', '① Material type')}</label>
              <select style={{ ...inputStyle, cursor: 'pointer' }} value={pbr.typeId ?? ''}
                onChange={(e) => e.target.value && update(applyMaterialType(pbr, e.target.value as MaterialTypeId))}>
                <option value="" disabled>{tr('— chọn loại —', '— pick a type —')}</option>
                {MATERIAL_TYPES.map((t) => <option key={t.id} value={t.id}>{tr(t.label[0], t.label[1])}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>{tr('② Màu', '② Color')}</label>
              <input type="color" value={pbr.baseColor ?? '#9a9a9a'}
                onChange={(e) => update(setBaseColor(pbr, e.target.value))}
                style={{ ...inputStyle, padding: 2, cursor: 'pointer' }} />
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 10 }}>
          <label style={labelStyle}>
            {tr('③ Độ nhám', '③ Roughness')} · {(pbr.roughness ?? DEFAULT_PBR.roughness).toFixed(2)}
          </label>
          <input type="range" min={0} max={1} step={0.01} value={pbr.roughness ?? DEFAULT_PBR.roughness}
            onChange={(e) => update(setRoughness(pbr, Number(e.target.value)))} style={{ width: '100%' }} />
        </div>

        {typeDef?.transparent && (
          <div style={{ marginBottom: 10 }}>
            <label style={labelStyle}>
              {tr('④ Độ trong', '④ Transparency')} · {(pbr.transmission?.value ?? 0).toFixed(2)}
            </label>
            <input type="range" min={0} max={1} step={0.01} value={pbr.transmission?.value ?? 0}
              onChange={(e) => update(setTransparency(pbr, Number(e.target.value)))} style={{ width: '100%' }} />
          </div>
        )}

        {/* 2 khoá vật lý — HIỆN để người dùng hiểu, KHÔNG có control chỉnh (Hoà chốt: cho kéo là sai vật lý) */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 14, padding: '8px 10px', borderRadius: 10, background: 'var(--field)' }}>
          <span style={lockRow}><Lock size={11} /> metallic = {pbr.metallic ?? 0} {tr('(theo loại)', '(by type)')}</span>
          <span style={lockRow}><Lock size={11} /> specular = {DEFAULT_PBR.specular} (IOR 1.5)</span>
        </div>

        {/* G-M17-03: hàng đầu = 3 map người dùng CẦN NHẤT (ảnh vân màu — thiếu nó mọi vật liệu
            thật đều ra cầu trơn); hàng hai = 3 map kỹ thuật cũ. Cùng khuôn mapBtn, nạp ảnh không
            nhập số. Màu vân nạp sRGB, 5 map còn lại linear — colorSpace gán ở pbr-three.ts. */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
          {mapBtn('baseColorMapUrl', baseMapRef, tr('Ảnh vân màu', 'Color map'))}
          {mapBtn('roughnessMapUrl', roughMapRef, tr('Ảnh nhám', 'Roughness map'))}
          {mapBtn('metallicMapUrl', metalMapRef, tr('Ảnh kim loại', 'Metallic map'))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
          {mapBtn('normalUrl', normalRef, 'Normal')}
          {mapBtn('aoUrl', aoRef, 'AO')}
          {mapBtn('heightUrl', heightRef, 'Height')}
        </div>
        {/* Bước lặp vân bằng MM THẬT — không có nó viên gạch 600mm hiện thành 3m (schema.ts). Chỉ
            hiện khi đã có ít nhất 1 map (chưa có ảnh thì số này chưa có nghĩa gì để chỉnh). */}
        {(pbr.baseColorMapUrl || pbr.roughnessMapUrl || pbr.metallicMapUrl || pbr.normalUrl || pbr.aoUrl || pbr.heightUrl) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--gap)', marginBottom: 14 }}>
            <label style={{ ...labelStyle, marginBottom: 0, flex: 'none' }}>{tr('Bước lặp vân (mm)', 'Pattern repeat (mm)')}</label>
            <input style={{ ...inputStyle, width: 90 }} inputMode="numeric" placeholder={tr('rộng', 'w')}
              value={pbr.uvScaleMm?.w ?? ''}
              onChange={(e) => { const w = Number(e.target.value); update({ ...pbr, uvScaleMm: { w: Number.isFinite(w) && w > 0 ? w : 0, h: pbr.uvScaleMm?.h ?? (Number.isFinite(w) && w > 0 ? w : 0) } }); }} />
            <span style={{ color: 'var(--t4)', fontSize: 12 }}>×</span>
            <input style={{ ...inputStyle, width: 90 }} inputMode="numeric" placeholder={tr('cao', 'h')}
              value={pbr.uvScaleMm?.h ?? ''}
              onChange={(e) => { const h = Number(e.target.value); update({ ...pbr, uvScaleMm: { w: pbr.uvScaleMm?.w ?? (Number.isFinite(h) && h > 0 ? h : 0), h: Number.isFinite(h) && h > 0 ? h : 0 } }); }} />
            <span style={{ color: 'var(--t4)', fontSize: 11.5, lineHeight: 1.5 }}>{tr('1 chu kỳ ảnh phủ bao nhiêu mm thật', 'real mm covered by one image tile')}</span>
          </div>
        )}

        <button type="button" onClick={() => setAdvancedOpen((v) => !v)}
          style={{ display: 'flex', alignItems: 'center', gap: 4, border: 0, background: 'transparent', color: 'var(--t3)', fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: 0, marginBottom: advancedOpen ? 10 : 14 }}>
          <ChevronRight size={13} style={{ transform: advancedOpen ? 'rotate(90deg)' : undefined, transition: 'transform 120ms' }} />
          {tr('Nâng cao', 'Advanced')}
        </button>

        {advancedOpen && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
            <div>
              <label style={labelStyle}>Clearcoat · {(pbr.clearcoat?.value ?? 0).toFixed(2)}</label>
              <input type="range" min={0} max={1} step={0.01} value={pbr.clearcoat?.value ?? 0}
                onChange={(e) => update({ ...pbr, clearcoat: { value: Number(e.target.value), roughness: pbr.clearcoat?.roughness ?? 0.1 } })} style={{ width: '100%' }} />
            </div>
            <div>
              <label style={labelStyle}>Sheen · {(pbr.sheen ?? 0).toFixed(2)}</label>
              <input type="range" min={0} max={1} step={0.01} value={pbr.sheen ?? 0}
                onChange={(e) => update({ ...pbr, sheen: Number(e.target.value) })} style={{ width: '100%' }} />
            </div>
            <div>
              <label style={labelStyle}>{tr('Tự phát sáng', 'Emissive')} · {(pbr.emissive?.intensity ?? 0).toFixed(1)}</label>
              <input type="range" min={0} max={10} step={0.1} value={pbr.emissive?.intensity ?? 0}
                onChange={(e) => update({ ...pbr, emissive: { color: pbr.emissive?.color ?? (pbr.baseColor ?? '#ffffff'), intensity: Number(e.target.value) } })} style={{ width: '100%' }} />
            </div>
            <div>
              <label style={labelStyle}>{tr('Chế độ đục', 'Opacity mode')}</label>
              <select style={{ ...inputStyle, cursor: 'pointer' }} value={pbr.opacity?.mode ?? 'blend'}
                onChange={(e) => update({ ...pbr, opacity: { value: pbr.opacity?.value ?? 1, mode: e.target.value as 'cutout' | 'blend' } })}>
                <option value="blend">blend</option>
                <option value="cutout">cutout</option>
              </select>
            </div>
          </div>
        )}

        {/* §1#7 — 2 cửa xuất engine, đứng NGAY trong lớp chỉnh PBR (đây là nơi duy nhất người
            dùng nhìn thấy/sửa PBR của matId đang chọn — xuất phải đứng cạnh nguồn, không rải ra
            bảng kho nơi mỗi hàng phải tự dò localStorage mới biết có gì để xuất). */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--gap)', marginBottom: 10 }}>
          {(['vray', 'd5'] as const).map((engine) => (
            <button key={engine} type="button" disabled={!savedPbr} onClick={() => exportEngine(engine)}
              title={!savedPbr
                ? tr('Chưa có chất liệu đã lưu cho mã này — bấm "Lưu chất liệu" trước rồi mới xuất được.',
                    'No saved material for this SKU yet — press "Save material" first, then export.')
                : savedPbr !== pbr
                  ? tr('Xuất bản ĐÃ LƯU (chỉnh sửa đang dở chưa lưu sẽ không vào file).',
                      'Exports the SAVED version (unsaved edits are not included).')
                  : tr('Tải file JSON tham số cho engine render.', 'Download the engine parameter JSON file.')}
              style={{ height: 30, padding: '0 10px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--field)', color: savedPbr ? 'var(--t2)' : 'var(--t4)', fontSize: 12, fontWeight: 600, cursor: savedPbr ? 'pointer' : 'not-allowed', opacity: savedPbr ? 1 : 0.55, display: 'flex', alignItems: 'center', gap: 5 }}>
              <Download size={12} /> {engine === 'vray' ? tr('Xuất V-Ray', 'Export V-Ray') : tr('Xuất D5', 'Export D5')}
            </button>
          ))}
          {!savedPbr && (
            <span style={{ fontSize: 11.5, color: 'var(--t4)', lineHeight: 1.4 }}>
              {tr('Khoá vì chưa lưu — lưu rồi mới có gì để xuất.', 'Locked until saved — nothing to export yet.')}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button type="button" onClick={reset} title={tr('Xoá bản chỉnh, quay về suy đoán', 'Discard edits, back to inferred')}
            style={{ height: 'var(--tap)', padding: '0 10px', borderRadius: 10, border: '1px solid var(--border)', background: 'transparent', color: 'var(--t3)', fontSize: 12.5, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
            <RotateCcw size={12} /> {tr('Về mặc định', 'Reset')}
          </button>
          {savedFlash && <span style={{ fontSize: 12, color: 'var(--success)' }}>{tr('Đã lưu.', 'Saved.')}</span>}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button type="button" onClick={onClose} style={{ height: 'var(--tap)', padding: '0 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'transparent', color: 'var(--t2)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>
              {tr('Đóng', 'Close')}
            </button>
            <button type="button" onClick={save}
              style={{ height: 'var(--tap)', padding: '0 16px', borderRadius: 10, border: 0, background: 'var(--accent)', color: '#fff', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>
              {tr('Lưu chất liệu', 'Save material')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
