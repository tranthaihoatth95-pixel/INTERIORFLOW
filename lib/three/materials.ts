// lib/three/materials.ts — CATALOG VẬT LIỆU cho mode Vẽ 3D.
//
// ⭐ MOAT (docs/SPEC-CHANG2-UI-2MODE.md): dù người dùng đang xem catalog của engine nào
// (IF·ATLAS / V-Ray / D5), thứ LƯU XUỐNG luôn là `matId`. Đổi engine, xuất sang D5 hay V-Ray —
// `matId` giữ nguyên, không phải gán lại. Engine chỉ đổi CÁCH HIỂN THỊ tên/thumbnail, KHÔNG đổi
// dữ liệu gán vào khối.
//
// Số liệu là mock (chưa nối ATLAS thật) — mã `matId` chép từ `docs/mocks/mock-ve-3d.html`.

export type MaterialEngine = 'if' | 'vray' | 'd5';

export const ENGINES: { id: MaterialEngine; label: string }[] = [
  // Thứ tự theo brief 03/08 (IF·ATLAS trước — engine gốc, cũng là nơi `matId` sinh ra).
  { id: 'if', label: 'IF · ATLAS' },
  { id: 'vray', label: 'V-Ray' },
  { id: 'd5', label: 'D5' },
];

export type MaterialGroup = 'go' | 'da' | 'son-vai';

export const MATERIAL_GROUPS: { id: MaterialGroup; label: string }[] = [
  { id: 'go', label: 'Gỗ' },
  { id: 'da', label: 'Đá' },
  { id: 'son-vai', label: 'Sơn · vải' },
];

export interface MaterialSwatch {
  /** KHOÁ THẬT lưu vào khối — không phải tên engine. */
  matId: string;
  name: string;
  group: MaterialGroup;
  /** gradient thumbnail — chép nguyên văn mock; trang trí, không theo theme. */
  swatch: string;
  /** tên trong từng engine — chỉ để HIỂN THỊ, `matId` mới là thứ được lưu. */
  engineName: Record<MaterialEngine, string>;
}

// Brief chốt đúng 3 nhóm (Gỗ · Đá · Sơn·vải). Thép xước (M-011) và Kính mờ (G-020) không có nhóm
// riêng nên xếp theo bề mặt gần nhất: kim loại → "Đá" (bề mặt cứng), kính → "Sơn · vải" (bề mặt
// phủ). Ghi rõ ở đây để sau này thêm nhóm thì biết đường tách, không phải đoán lại.
export const MATERIALS: MaterialSwatch[] = [
  { matId: 'W-102', name: 'Gỗ óc chó', group: 'go', swatch: 'linear-gradient(135deg,#8a5a34,#6a4526)', engineName: { if: 'Gỗ óc chó', vray: 'Walnut Satin', d5: 'Wood_Walnut_01' } },
  { matId: 'W-210', name: 'Gỗ sồi tự nhiên', group: 'go', swatch: 'linear-gradient(135deg,#c9a27a,#8a6a44)', engineName: { if: 'Gỗ sồi tự nhiên', vray: 'Oak Natural', d5: 'Wood_Oak_Nat' } },
  { matId: 'W-150', name: 'Gỗ tần bì', group: 'go', swatch: 'linear-gradient(135deg,#d8c3a5,#a58a68)', engineName: { if: 'Gỗ tần bì', vray: 'Ash Light', d5: 'Wood_Ash_02' } },
  { matId: 'S-044', name: 'Travertine', group: 'da', swatch: 'linear-gradient(135deg,#d8cbb8,#b7a687)', engineName: { if: 'Travertine', vray: 'Travertine Beige', d5: 'Stone_Trav_01' } },
  { matId: 'S-101', name: 'Đá Calacatta', group: 'da', swatch: 'linear-gradient(135deg,#eeeae4,#c6c1b8)', engineName: { if: 'Đá Calacatta', vray: 'Calacatta Gold', d5: 'Marble_Cala' } },
  { matId: 'M-011', name: 'Thép xước', group: 'da', swatch: 'linear-gradient(135deg,#b8bcc0,#8b9096)', engineName: { if: 'Thép xước', vray: 'Brushed Steel', d5: 'Metal_Steel_Br' } },
  { matId: 'P-070', name: 'Sơn xanh rêu', group: 'son-vai', swatch: 'linear-gradient(135deg,#6f7a70,#4c554d)', engineName: { if: 'Sơn xanh rêu', vray: 'Paint Moss', d5: 'Paint_Moss' } },
  { matId: 'P-001', name: 'Vữa trắng', group: 'son-vai', swatch: 'linear-gradient(135deg,#e8e4dd,#cfc9bf)', engineName: { if: 'Vữa trắng', vray: 'Plaster White', d5: 'Plaster_W' } },
  { matId: 'F-030', name: 'Vải lanh be', group: 'son-vai', swatch: 'linear-gradient(135deg,#cfc3ad,#9d9179)', engineName: { if: 'Vải lanh be', vray: 'Linen Beige', d5: 'Fabric_Linen' } },
  { matId: 'G-020', name: 'Kính mờ', group: 'son-vai', swatch: 'linear-gradient(135deg,#cfe0e6,#a7c3cc)', engineName: { if: 'Kính mờ', vray: 'Glass Frosted', d5: 'Glass_Frost' } },
];

/** Tên hiển thị của 1 matId trong engine đang xem — `matId` không đổi. */
export function displayName(m: MaterialSwatch, engine: MaterialEngine): string {
  return m.engineName[engine];
}

export function materialsIn(group: MaterialGroup, query = ''): MaterialSwatch[] {
  const q = query.trim().toLowerCase();
  return MATERIALS.filter(
    (m) => m.group === group && (!q || m.name.toLowerCase().includes(q) || m.matId.toLowerCase().includes(q)),
  );
}

export function findMaterial(matId: string): MaterialSwatch | undefined {
  return MATERIALS.find((m) => m.matId === matId);
}
