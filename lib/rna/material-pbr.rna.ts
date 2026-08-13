/**
 * lib/rna/material-pbr.rna.ts — IfRna v0: ĐỊNH NGHĨA TỰ MÔ TẢ của MaterialPbr — NGUỒN DUY NHẤT
 * cho nhãn · đơn vị · miền · bước · nhóm của mọi ô nhập vật liệu. Sửa 1 dòng ở đây là panel
 * (`components/materials/RnaPanel.tsx` + phần giữ tay của `MaterialPbrEditor.tsx`) đổi theo [T2].
 *
 * Nhãn/miền/bước CHÉP ĐÚNG từ panel tay `MaterialPbrEditor.tsx` bản 332 dòng (đó là hành vi
 * chuẩn Hoà đã duyệt 07/08 — không sáng tác). Nhóm chép đúng cụm panel cũ đang xếp.
 *
 * Đủ 19 key của MaterialPbr — test `rna.test.ts` + `MATERIAL_PBR_KEYS` (schema.ts) canh drift
 * 2 chiều. Field nào panel v0 CHƯA tự sinh được (object sub-path · enum cần options · điều kiện
 * hiển thị · layout ghép với quả cầu) ghi rõ trong moTa — editor giữ tay nhưng vẫn ĐỌC NHÃN từ
 * đây (một nguồn, không chép đôi chuỗi).
 */
import type { MaterialPbr } from '../materials/schema';
import type { IfRnaField, IfRnaText } from './types';

// ---- Nhóm — chép đúng cụm panel tay đang xếp (thứ tự = thứ tự render). EXPORT để callsite
// (soCot/nhomDong của RnaPanel) trỏ CÙNG nguồn, không chép tay chuỗi tên nhóm. ----
export const NHOM_NHAN_DIEN: IfRnaText = { vi: 'Nhận diện', en: 'Identity' };
export const NHOM_BE_MAT: IfRnaText = { vi: 'Bề mặt', en: 'Surface' };
export const NHOM_ANH_VAN: IfRnaText = { vi: 'Ảnh vân', en: 'Material maps' };
export const NHOM_MAP_KY_THUAT: IfRnaText = { vi: 'Map kỹ thuật', en: 'Technical maps' };
export const NHOM_NANG_CAO: IfRnaText = { vi: 'Nâng cao', en: 'Advanced' };

export const MATERIAL_PBR_RNA: readonly IfRnaField<MaterialPbr>[] = [
  // ---- Nhận diện — GIỮ TAY (layout ghép quả cầu xem trước + select cần options MATERIAL_TYPES
  //      + transform applyMaterialType), nhãn vẫn đọc từ đây ----
  {
    key: 'typeId', kind: 'enum', group: NHOM_NHAN_DIEN,
    label: { vi: '① Loại vật liệu', en: '① Material type' },
    moTa: { vi: 'Options từ MATERIAL_TYPES + transform applyMaterialType — v0 giữ tay', en: 'Options from MATERIAL_TYPES + applyMaterialType transform — hand-held in v0' },
    anTheo: ['metallic', 'roughness', 'specular', 'transmission', 'suyDoan'],
  },
  {
    key: 'baseColor', kind: 'color', group: NHOM_NHAN_DIEN,
    label: { vi: '② Màu', en: '② Color' },
    moTa: { vi: 'Đứng cạnh quả cầu xem trước (layout ghép) — v0 giữ tay; KHÔNG xoá cờ suy đoán (setBaseColor)', en: 'Sits beside the preview sphere — hand-held in v0; does NOT clear the inferred flag' },
  },
  {
    key: 'suyDoan', kind: 'bool', group: NHOM_NHAN_DIEN,
    label: { vi: 'Suy đoán', en: 'Inferred' },
    moTa: { vi: 'Cờ máy đoán — hiện badge cảnh báo, không phải ô nhập', en: 'Machine-guessed flag — shown as a warning badge, not an input' },
  },

  // ---- Bề mặt ----
  {
    key: 'roughness', kind: 'number', group: NHOM_BE_MAT,
    label: { vi: '③ Độ nhám', en: '③ Roughness' },
    min: 0, max: 1, step: 0.01,
    anTheo: ['suyDoan'],
  },
  {
    key: 'transmission', kind: 'number', group: NHOM_BE_MAT,
    label: { vi: '④ Độ trong', en: '④ Transparency' },
    min: 0, max: 1, step: 0.01,
    moTa: { vi: 'Chỉ hiện với loại trong suốt; ghi transmission.value giữ ior (setTransparency) — v0 giữ tay', en: 'Only for transparent types; writes transmission.value keeping ior — hand-held in v0' },
    anTheo: ['suyDoan'],
  },
  {
    key: 'metallic', kind: 'number', group: NHOM_BE_MAT,
    label: { vi: 'metallic', en: 'metallic' },
    min: 0, max: 1, step: 1,
    moTa: { vi: 'KHOÁ theo loại (0/1, doc Chaos) — hiện để hiểu, không có control', en: 'LOCKED by type (0/1 per Chaos doc) — displayed, no control' },
  },
  {
    key: 'specular', kind: 'number', group: NHOM_BE_MAT,
    label: { vi: 'specular', en: 'specular' },
    min: 0, max: 1, step: 0.01,
    moTa: { vi: 'KHOÁ 0.04 (F0 của IOR 1.5, DEFAULT_PBR) — hiện để hiểu, không có control', en: 'LOCKED at 0.04 (F0 of IOR 1.5) — displayed, no control' },
  },

  // ---- Ảnh vân — 3 map người dùng cần nhất (G-M17-03), lưới 3 cột ----
  {
    key: 'baseColorMapUrl', kind: 'texture', group: NHOM_ANH_VAN,
    label: { vi: 'Ảnh vân màu', en: 'Color map' },
    moTa: { vi: 'Nạp sRGB — khác 5 map linear (colorSpace gán ở pbr-three.ts)', en: 'Loaded as sRGB — unlike the 5 linear maps' },
  },
  { key: 'roughnessMapUrl', kind: 'texture', group: NHOM_ANH_VAN, label: { vi: 'Ảnh nhám', en: 'Roughness map' } },
  { key: 'metallicMapUrl', kind: 'texture', group: NHOM_ANH_VAN, label: { vi: 'Ảnh kim loại', en: 'Metallic map' } },

  // ---- Map kỹ thuật — lưới 3 cột + bước lặp vân ----
  { key: 'normalUrl', kind: 'texture', group: NHOM_MAP_KY_THUAT, label: { vi: 'Normal', en: 'Normal' } },
  { key: 'aoUrl', kind: 'texture', group: NHOM_MAP_KY_THUAT, label: { vi: 'AO', en: 'AO' } },
  { key: 'heightUrl', kind: 'texture', group: NHOM_MAP_KY_THUAT, label: { vi: 'Height', en: 'Height' } },
  {
    key: 'uvScaleMm', kind: 'number', unit: 'mm', group: NHOM_MAP_KY_THUAT,
    label: { vi: 'Bước lặp vân (mm)', en: 'Pattern repeat (mm)' },
    moTa: { vi: '1 chu kỳ ảnh phủ bao nhiêu mm thật', en: 'real mm covered by one image tile' },
  },

  // ---- Nâng cao — collapse mặc định đóng (panel tay: advancedOpen=false) ----
  {
    key: 'clearcoat', kind: 'number', group: NHOM_NANG_CAO,
    label: { vi: 'Clearcoat', en: 'Clearcoat' },
    min: 0, max: 1, step: 0.01,
    moTa: { vi: 'Ghi clearcoat.value giữ roughness (mặc định 0.1) — v0 giữ tay', en: 'Writes clearcoat.value keeping roughness (default 0.1) — hand-held in v0' },
  },
  {
    key: 'sheen', kind: 'number', group: NHOM_NANG_CAO,
    label: { vi: 'Sheen', en: 'Sheen' },
    min: 0, max: 1, step: 0.01,
  },
  {
    key: 'emissive', kind: 'number', group: NHOM_NANG_CAO,
    label: { vi: 'Tự phát sáng', en: 'Emissive' },
    min: 0, max: 10, step: 0.1,
    moTa: { vi: 'Ghi emissive.intensity giữ/khởi tạo color — v0 giữ tay', en: 'Writes emissive.intensity keeping/initialising color — hand-held in v0' },
  },
  {
    key: 'opacity', kind: 'enum', group: NHOM_NANG_CAO,
    label: { vi: 'Chế độ đục', en: 'Opacity mode' },
    moTa: { vi: 'Ghi opacity.mode (blend/cutout) giữ value — v0 giữ tay', en: 'Writes opacity.mode (blend/cutout) keeping value — hand-held in v0' },
  },
  {
    key: 'reflectance', kind: 'number', group: NHOM_NANG_CAO,
    label: { vi: 'Hệ số phản xạ ρ', en: 'Reflectance ρ' },
    min: 0, max: 1, step: 0.01,
    moTa: { vi: 'L6 chiếu sáng đọc, render bỏ qua — panel tay CHƯA từng có ô nhập, v0 không tự thêm', en: 'Read by lighting calc, ignored by render — the hand panel never had a control, v0 adds none' },
  },
];
