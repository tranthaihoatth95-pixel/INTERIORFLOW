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
 *
 * IfRna v0 (14/08, phiếu if-rna-v0): phần Ô NHẬP không còn code tay từng trường — nhãn/miền/
 * bước/nhóm đọc từ `MATERIAL_PBR_RNA` (lib/rna), UI sinh bởi `RnaPanel`. Sửa 1 dòng trong
 * registry là panel đổi theo [T2]. GIỮ TAY (khai thật, [T0]): khối ①②+quả cầu (layout ghép +
 * options/transform), hàng khoá vật lý, các trường giá trị object (qua renderer tuỳ chỉnh —
 * nhãn vẫn từ registry), badge suy đoán, nút xuất V-Ray/D5, footer.
 */
import { useMemo, useState } from 'react';
import { X, Lock, Sparkles, RotateCcw, Download } from 'lucide-react';
import { useT } from '@/lib/i18n';
import type { MaterialPbr } from '@/lib/materials/schema';
import { DEFAULT_PBR } from '@/lib/materials/schema';
import { MATERIAL_PBR_RNA, NHOM_NANG_CAO } from '@/lib/rna/material-pbr.rna';
import { ifRnaField } from '@/lib/rna/types';
import { RnaPanel, rnaInputStyle, rnaLabelStyle, type RnaRenderer } from './RnaPanel';
import { toVRayMtl } from '@/lib/materials/export-vray';
import { toD5Material } from '@/lib/materials/export-d5';
import {
  MATERIAL_TYPES,
  materialTypeOf,
  applyMaterialType,
  setBaseColor,
  setTransparency,
  type MaterialTypeId,
} from '@/lib/materials/material-edit';
import { inferPbrFromCategory } from '@/lib/materials/pbr-from-category';
import { loadPbrMap, savePbr, removePbr } from '@/lib/materials/pbr-store';
import { phanGiaiPbr } from '@/lib/materials/tang-phan-giai';
import MaterialSphere from '@/components/three/MaterialSphere';
import type { PreviewSpec } from '@/components/three/material-preview';
import { pbrCacheKey } from '@/lib/three/pbr-three';

// Khuôn ô nhập dời sang RnaPanel.tsx (một nguồn style) — alias giữ tên cũ cho phần giữ tay.
const inputStyle = rnaInputStyle;
const labelStyle = rnaLabelStyle;
const lockRow: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--t3)' };

// Nhãn phần GIỮ TAY cũng đọc từ registry RNA — chuỗi không chép đôi, sửa 1 chỗ lan cả tay lẫn máy.
const F_TYPE = ifRnaField(MATERIAL_PBR_RNA, 'typeId');
const F_COLOR = ifRnaField(MATERIAL_PBR_RNA, 'baseColor');
const F_UV = ifRnaField(MATERIAL_PBR_RNA, 'uvScaleMm');

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
    /* ⚡ 04/09 — ĐỌC BA TẦNG, KHÔNG CHỈ TẦNG STUDIO.
       Đo được trên app thật: mở cửa này cho vật liệu SHIP KÈM BẢN CÀI (vd `Gỗ sồi tự nhiên`,
       baseColor `#b98a54`) thì ô màu hiện `#9a9a9a` — vì `getPbr()` chỉ tra `localStorage` của
       studio, thấy rỗng rồi rơi thẳng xuống `inferPbrFromCategory(tên)`, tức ĐOÁN TỪ CHỮ trong
       khi tham số thật đã nằm sẵn trong repo. Người dùng mở ra thấy một vật liệu xám lạ, bấm Lưu
       là ĐOÁN ĐÓ ĐÈ LÊN bản gốc. `phanGiaiPbr` là cửa đã có sẵn cho đúng việc này (dự án → studio
       → hạt giống) và còn trả về TẦNG THẮNG. Suy đoán lùi về đúng vai của nó: chỗ dựa CUỐI CÙNG,
       chỉ khi cả ba tầng đều không có gì. */
    const baTang = phanGiaiPbr(matId, { studio: loadPbrMap() });
    if (baTang.pbr) return baTang.pbr;
    // chưa tầng nào có — khởi tạo bằng SUY ĐOÁN từ danh mục/tên, GIỮ cờ suyDoan để UI hiện rõ
    return { ...inferPbrFromCategory(categoryHint ?? name) };
  });
  const [savedFlash, setSavedFlash] = useState(false);
  /**
   * §1#7 (08/08) — bản PBR ĐÃ LƯU trong pbr-store: nguồn duy nhất cho 2 nút Xuất V-Ray/D5.
   * Xuất bản ĐÃ LƯU chứ không xuất state đang gõ dở — file tải về phải khớp cái kho đang giữ
   * (cùng cái quả cầu ở Thư viện/scene sẽ đọc), không phải bản nháp chưa bấm Lưu. Chưa từng
   * lưu (chỉ có suy đoán) → nút khoá kèm lý do (luật §9: disabled phải nói vì sao).
   */
  /* Cũng đọc BA TẦNG, cùng lý do trên — và ở đây hậu quả nhìn thấy được: với vật liệu ship kèm
     bản cài, `getPbr()` trả `null` ⇒ hai nút Xuất V-Ray/D5 bị khoá kèm câu *"chưa lưu — lưu rồi
     mới có gì để xuất"*, mà câu đó KHÔNG ĐÚNG: tham số thật có sẵn trong repo, chỉ là nó không
     nằm ở `localStorage`. Người mua mở vật liệu ship sẵn ra và không xuất được sang V-Ray/D5 cho
     tới khi tự lưu lại một lần vô nghĩa. Bất biến *"xuất bản ĐÃ LƯU, không xuất bản đang gõ dở"*
     giữ nguyên: đây vẫn là ảnh chụp lúc mở/lúc lưu, không phải state đang gõ. */
  const [savedPbr, setSavedPbr] = useState<MaterialPbr | null>(
    () => phanGiaiPbr(matId, { studio: loadPbrMap() }).pbr,
  );

  const typeDef = materialTypeOf(pbr.typeId);

  const preview: PreviewSpec = useMemo(() => {
    const c = pbr.baseColor ?? '#9a9a9a';
    // id trộn pbrCacheKey — MaterialSphere chỉ nghe spec.id, mọi thay đổi pbr (kể cả nạp map)
    // phải làm id đổi thì quả cầu mới render lại (VIỆC 2: quả cầu PHẢI hiện vân sau khi nạp).
    return { id: `pbr-edit:${matId}:${pbrCacheKey(pbr)}`, colorA: c, colorB: c,
      kind: typeDef?.previewKind ?? 'paint', pbr };
  }, [matId, pbr, typeDef]);

  const update = (next: MaterialPbr) => { setPbr(next); setSavedFlash(false); };

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

  /**
   * IfRna v0 — renderer TUỲ CHỈNH cho field panel chưa tự sinh được [T0 khai thật]:
   * trường giá trị OBJECT (ghi sub-path giữ mảnh còn lại) + điều kiện hiển thị. Nhãn nhận từ
   * registry qua ctx.nhan — logic ghi vẫn là các hàm cũ (setTransparency…), hành vi giữ nguyên.
   */
  const anyMap = !!(pbr.baseColorMapUrl || pbr.roughnessMapUrl || pbr.metallicMapUrl || pbr.normalUrl || pbr.aoUrl || pbr.heightUrl);
  const tuyChinh: Partial<Record<keyof MaterialPbr & string, RnaRenderer<MaterialPbr>>> = {
    // ④ chỉ hiện với loại trong suốt — setTransparency giữ ior, xoá cờ suy đoán (như cũ).
    transmission: ({ nhan }) => !typeDef?.transparent ? null : (
      <div>
        <label style={labelStyle}>{nhan} · {(pbr.transmission?.value ?? 0).toFixed(2)}</label>
        <input type="range" min={0} max={1} step={0.01} value={pbr.transmission?.value ?? 0}
          onChange={(e) => update(setTransparency(pbr, Number(e.target.value)))} style={{ width: '100%' }} />
      </div>
    ),
    // 2 khoá vật lý — HIỆN để người dùng hiểu, KHÔNG có control chỉnh (Hoà chốt: cho kéo là sai
    // vật lý). Một hàng gộp cả metallic + specular; def `specular` nằm trong danh sách `an`.
    metallic: () => (
      <div style={{ display: 'flex', gap: 16, padding: '8px 10px', borderRadius: 10, background: 'var(--field)' }}>
        <span style={lockRow}><Lock size={14} /> metallic = {pbr.metallic ?? 0} {tr('(theo loại)', '(by type)')}</span>
        <span style={lockRow}><Lock size={14} /> specular = {DEFAULT_PBR.specular} (IOR 1.5)</span>
      </div>
    ),
    // Bước lặp vân mm — cặp {w,h}, chỉ hiện khi đã có ít nhất 1 map (như cũ).
    uvScaleMm: ({ nhan }) => !anyMap ? null : (
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--gap)' }}>
        <label style={{ ...labelStyle, marginBottom: 0, flex: 'none' }}>{nhan}</label>
        <input style={{ ...inputStyle, width: 90 }} inputMode="numeric" placeholder={tr('rộng', 'w')}
          value={pbr.uvScaleMm?.w ?? ''}
          onChange={(e) => { const w = Number(e.target.value); update({ ...pbr, uvScaleMm: { w: Number.isFinite(w) && w > 0 ? w : 0, h: pbr.uvScaleMm?.h ?? (Number.isFinite(w) && w > 0 ? w : 0) } }); }} />
        <span style={{ color: 'var(--t4)', fontSize: 12 }}>×</span>
        <input style={{ ...inputStyle, width: 90 }} inputMode="numeric" placeholder={tr('cao', 'h')}
          value={pbr.uvScaleMm?.h ?? ''}
          onChange={(e) => { const h = Number(e.target.value); update({ ...pbr, uvScaleMm: { w: pbr.uvScaleMm?.w ?? (Number.isFinite(h) && h > 0 ? h : 0), h: Number.isFinite(h) && h > 0 ? h : 0 } }); }} />
        <span style={{ color: 'var(--t4)', fontSize: 11.5, lineHeight: 1.5 }}>{F_UV.moTa ? tr(F_UV.moTa.vi, F_UV.moTa.en) : null}</span>
      </div>
    ),
    clearcoat: ({ nhan }) => (
      <div>
        <label style={labelStyle}>{nhan} · {(pbr.clearcoat?.value ?? 0).toFixed(2)}</label>
        <input type="range" min={0} max={1} step={0.01} value={pbr.clearcoat?.value ?? 0}
          onChange={(e) => update({ ...pbr, clearcoat: { value: Number(e.target.value), roughness: pbr.clearcoat?.roughness ?? 0.1 } })} style={{ width: '100%' }} />
      </div>
    ),
    emissive: ({ nhan }) => (
      <div>
        <label style={labelStyle}>{nhan} · {(pbr.emissive?.intensity ?? 0).toFixed(1)}</label>
        <input type="range" min={0} max={10} step={0.1} value={pbr.emissive?.intensity ?? 0}
          onChange={(e) => update({ ...pbr, emissive: { color: pbr.emissive?.color ?? (pbr.baseColor ?? '#ffffff'), intensity: Number(e.target.value) } })} style={{ width: '100%' }} />
      </div>
    ),
    opacity: ({ nhan }) => (
      <div>
        <label style={labelStyle}>{nhan}</label>
        <select style={{ ...inputStyle, cursor: 'pointer' }} value={pbr.opacity?.mode ?? 'blend'}
          onChange={(e) => update({ ...pbr, opacity: { value: pbr.opacity?.value ?? 1, mode: e.target.value as 'cutout' | 'blend' } })}>
          <option value="blend">blend</option>
          <option value="cutout">cutout</option>
        </select>
      </div>
    ),
  };

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
            <Sparkles size={16} />
            {tr('Số liệu đang là SUY ĐOÁN từ tên/danh mục — chưa ai đo hay chọn tay. Chỉnh một núm là hết suy đoán.', 'Values are GUESSED from the name/category — not measured. Adjust any control to confirm them.')}
          </div>
        )}

        <div style={{ display: 'flex', gap: 14, marginBottom: 14 }}>
          <MaterialSphere spec={preview} fallback={`radial-gradient(circle at 35% 30%, ${pbr.baseColor ?? '#9a9a9a'}, #555)`}
            size={96} resolution={1} fit="contain" title={typeDef ? typeDef.label[0] : tr('Chưa chọn loại', 'No type yet')}
            style={{ width: 96, height: 96, borderRadius: 10, flexShrink: 0, border: '1px solid var(--border)' }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <label style={labelStyle}>{tr(F_TYPE.label.vi, F_TYPE.label.en)}</label>
              <select style={{ ...inputStyle, cursor: 'pointer' }} value={pbr.typeId ?? ''}
                onChange={(e) => e.target.value && update(applyMaterialType(pbr, e.target.value as MaterialTypeId))}>
                <option value="" disabled>{tr('— chọn loại —', '— pick a type —')}</option>
                {MATERIAL_TYPES.map((t) => <option key={t.id} value={t.id}>{tr(t.label[0], t.label[1])}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>{tr(F_COLOR.label.vi, F_COLOR.label.en)}</label>
              <input type="color" value={pbr.baseColor ?? '#9a9a9a'}
                onChange={(e) => update(setBaseColor(pbr, e.target.value))}
                style={{ ...inputStyle, padding: 2, cursor: 'pointer' }} />
            </div>
          </div>
        </div>

        {/* IfRna v0 — TOÀN BỘ Ô NHẬP dưới đây sinh từ MATERIAL_PBR_RNA. Sửa nhãn/miền/nhóm ở
            lib/rna/material-pbr.rna.ts là UI đổi theo — file này không còn chuỗi nhãn nào của
            các trường. `an` = phần giữ tay/không có control (khai thật): ①② ở khối trên,
            specular gộp vào hàng khoá của metallic, suyDoan là badge, reflectance chưa từng có
            ô nhập. `tuyChinh` = trường object/điều kiện (logic ghi giữ nguyên hàm cũ). */}
        <RnaPanel
          defs={MATERIAL_PBR_RNA}
          value={pbr}
          onChange={update}
          an={['typeId', 'baseColor', 'suyDoan', 'specular', 'reflectance']}
          tuyChinh={tuyChinh}
          soMacDinh={{ roughness: DEFAULT_PBR.roughness }}
          soCot={{ [NHOM_NANG_CAO.vi]: 2 }}
          nhomDong={[NHOM_NANG_CAO.vi]}
        />

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
              <Download size={18} /> {engine === 'vray' ? tr('Xuất V-Ray', 'Export V-Ray') : tr('Xuất D5', 'Export D5')}
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
            <RotateCcw size={18} /> {tr('Về mặc định', 'Reset')}
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
