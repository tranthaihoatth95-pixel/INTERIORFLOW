/**
 * lib/materials/material-edit.ts — VIỆC 5 PHẦN B (07/08, Hoà chốt): LỚP CHỈNH VẬT LIỆU "GỌN VÀ
 * ĐÚNG". 14 thông số PBR của `MaterialPbr` là quá nhiều cho người dùng thường — rút xuống 4 thứ
 * NHÌN THẤY (① loại · ② màu · ③ độ nhám · ④ độ trong — ④ CHỈ với kính), phần còn lại hoặc KHOÁ
 * (đúng vật lý) hoặc ẩn sau "Nâng cao".
 *
 * HAI KHOÁ VẬT LÝ — không cho sửa tay, đây là chỗ dễ sai vật lý nhất (Hoà chốt nguyên văn):
 *  · `metallic` CHỈ 0 hoặc 1, suy từ LOẠI — thực tế không có vật liệu nửa kim loại (doc Chaos đã
 *    trích ở `schema.ts`: giá trị giữa "không ứng với vật liệu vật lý nào"). Cho kéo trượt là sai
 *    vật lý ngay lập tức.
 *  · `specular` khoá `DEFAULT_PBR.specular` (0.04 = F0 của IOR 1.5) trừ khi biết IOR thật —
 *    nguồn số DUY NHẤT là `DEFAULT_PBR`, không chép số ra đây.
 *
 * 11 LOẠI khớp 1-1 với nhóm `CATEGORY_RULES` của `pbr-from-category.ts` — số roughness khởi tạo
 * phải BẰNG số bảng suy đoán đó (test `material-edit.test.ts` khoá cứng từng cặp qua
 * `inferPbrFromCategory`, đổi một bên là test đỏ — 2 file không lệch nhau thầm lặng).
 *
 * KHÁC `inferPbrFromCategory` một điểm ngữ nghĩa quan trọng: hàm suy đoán LUÔN trả
 * `suyDoan: true`; còn ở đây người dùng TỰ CHỌN loại/kéo núm ⇒ giá trị là KHAI BÁO (K3),
 * `suyDoan` bị xoá. UI chỉ hiện cờ "suy đoán" khi giá trị còn nguyên gốc máy đoán.
 *
 * Thuần TS — không DOM/FS/network, test chạy sucrase-node trực tiếp.
 */
import type { MaterialPbr } from './schema';
import { DEFAULT_PBR } from './schema';

export type MaterialTypeId =
  | 'kim-loai' | 'da-bong' | 'da-tu-nhien' | 'go' | 'vai' | 'tham'
  | 'da' | 'kinh' | 'gach-men' | 'son-bong' | 'son';

/** Trùng literal `PreviewKind` của `components/three/material-preview.ts` — khai LẠI ở đây (chuỗi
 * thường) vì lib KHÔNG được import ngược từ components; test UI-side tự khớp khi dùng. */
export type MaterialPreviewKind = 'wood' | 'stone' | 'metal' | 'paint' | 'fabric' | 'glass';

export interface MaterialTypeDef {
  id: MaterialTypeId;
  label: [string, string];
  /** khoá cứng theo loại — UI KHÔNG render control cho trường này */
  metallic: 0 | 1;
  /** roughness KHỞI TẠO khi đổi sang loại này (người dùng kéo lại được sau đó) */
  roughnessInit: number;
  /** cụm từ ĐẠI DIỆN của nhóm trong `CATEGORY_RULES` — test dùng để khoá 2 bảng không lệch nhau */
  categoryProbe: string;
  /** true = loại trong suốt ⇒ núm ④ "độ trong" hiện ra (transmission + ior) */
  transparent?: true;
  /** cảnh quả cầu xem trước (`MaterialSphere`) */
  previewKind: MaterialPreviewKind;
}

export const MATERIAL_TYPES: readonly MaterialTypeDef[] = [
  { id: 'kim-loai', label: ['Kim loại', 'Metal'], metallic: 1, roughnessInit: 0.3, categoryProbe: 'kim loại', previewKind: 'metal' },
  { id: 'da-bong', label: ['Đá bóng', 'Polished stone'], metallic: 0, roughnessInit: 0.15, categoryProbe: 'đá bóng', previewKind: 'stone' },
  { id: 'da-tu-nhien', label: ['Đá tự nhiên', 'Natural stone'], metallic: 0, roughnessInit: 0.5, categoryProbe: 'đá tự nhiên', previewKind: 'stone' },
  { id: 'go', label: ['Gỗ', 'Wood'], metallic: 0, roughnessInit: 0.6, categoryProbe: 'gỗ tự nhiên', previewKind: 'wood' },
  { id: 'vai', label: ['Vải', 'Fabric'], metallic: 0, roughnessInit: 0.9, categoryProbe: 'vải', previewKind: 'fabric' },
  { id: 'tham', label: ['Thảm', 'Carpet'], metallic: 0, roughnessInit: 0.95, categoryProbe: 'thảm', previewKind: 'fabric' },
  { id: 'da', label: ['Da', 'Leather'], metallic: 0, roughnessInit: 0.45, categoryProbe: 'da thật', previewKind: 'fabric' },
  { id: 'kinh', label: ['Kính', 'Glass'], metallic: 0, roughnessInit: 0.05, categoryProbe: 'kính trong', transparent: true, previewKind: 'glass' },
  { id: 'gach-men', label: ['Gạch men', 'Ceramic tile'], metallic: 0, roughnessInit: 0.25, categoryProbe: 'gạch men', previewKind: 'stone' },
  { id: 'son-bong', label: ['Sơn bóng', 'Gloss paint'], metallic: 0, roughnessInit: 0.35, categoryProbe: 'sơn bóng', previewKind: 'paint' },
  { id: 'son', label: ['Sơn', 'Paint'], metallic: 0, roughnessInit: 0.55, categoryProbe: 'sơn nước', previewKind: 'paint' },
] as const;

export function materialTypeOf(id: string | undefined | null): MaterialTypeDef | null {
  return MATERIAL_TYPES.find((t) => t.id === id) ?? null;
}

/** Độ trong mặc định khi vừa chuyển sang loại kính — 0.9 (kính kiến trúc thường), IOR 1.5 (kính
 * thường, cùng mốc F0 0.04 của `DEFAULT_PBR` — 2 số này là MỘT sự thật vật lý). */
export const GLASS_TRANSMISSION_INIT = { value: 0.9, ior: 1.5 } as const;

/**
 * Đổi LOẠI vật liệu (núm ①) — trả `MaterialPbr` MỚI (không sửa tại chỗ, KS4 lùi được):
 *  · `typeId` ghi lại để lần mở sau biết đang ở loại nào.
 *  · `metallic` NHẢY theo loại (0↔1) — không có đường nào khác đổi được trường này.
 *  · `roughness` reset về mốc khởi tạo của loại (đổi loại = đổi hệ quy chiếu nhám).
 *  · `specular` ép về khoá `DEFAULT_PBR.specular`.
 *  · kính: giữ transmission cũ nếu có, chưa có thì `GLASS_TRANSMISSION_INIT`; loại khác: XOÁ
 *    transmission (sơn không có khúc xạ — giữ lại là sai vật lý âm thầm).
 *  · `suyDoan` xoá — người dùng vừa KHAI BÁO (K3).
 *  · màu + 3 map ảnh + phần "Nâng cao" (clearcoat/sheen/emissive/opacity) GIỮ NGUYÊN.
 */
export function applyMaterialType(pbr: MaterialPbr | undefined, typeId: MaterialTypeId): MaterialPbr {
  const def = materialTypeOf(typeId);
  if (!def) return { ...(pbr ?? {}) };
  const next: MaterialPbr = {
    ...(pbr ?? {}),
    typeId,
    metallic: def.metallic,
    roughness: def.roughnessInit,
    specular: DEFAULT_PBR.specular,
  };
  if (def.transparent) {
    next.transmission = pbr?.transmission ?? { ...GLASS_TRANSMISSION_INIT };
  } else {
    delete next.transmission;
  }
  delete next.suyDoan;
  return next;
}

/** Núm ③ — kéo roughness 0→1, clamp, xoá cờ suy đoán (người dùng vừa đo/chọn tay). */
export function setRoughness(pbr: MaterialPbr, v: number): MaterialPbr {
  const next: MaterialPbr = { ...pbr, roughness: Math.min(1, Math.max(0, v)) };
  delete next.suyDoan;
  return next;
}

/** Núm ② — màu tự do (sRGB hex). Không đụng cờ suy đoán: màu và bảng roughness/metallic suy đoán
 * là 2 chuyện độc lập (đổi màu gỗ không làm số nhám "bớt suy đoán" đi). */
export function setBaseColor(pbr: MaterialPbr, hex: string): MaterialPbr {
  return { ...pbr, baseColor: hex };
}

/**
 * Núm ④ — độ trong, CHỈ có nghĩa với loại trong suốt (`transparent` trong bảng loại). Gọi trên
 * loại đục ⇒ trả NGUYÊN pbr (no-op, không throw): UI đúng thì không render núm này cho loại đục,
 * đây là lưới đỡ cho caller gọi nhầm — sửa transmission cho sơn là sai vật lý, thà bỏ qua.
 */
export function setTransparency(pbr: MaterialPbr, value: number): MaterialPbr {
  const def = materialTypeOf(pbr.typeId);
  if (!def?.transparent) return pbr;
  const next: MaterialPbr = {
    ...pbr,
    transmission: { value: Math.min(1, Math.max(0, value)), ior: pbr.transmission?.ior ?? GLASS_TRANSMISSION_INIT.ior },
  };
  delete next.suyDoan;
  return next;
}

/** Trạng thái 4 núm cho UI — mảnh thiếu trả mốc mặc định NHƯNG kèm nguồn (`fromDefault`) để UI
 * phân biệt "số người dùng đặt" với "số đang tạm lấy mặc định", không bày mặc định như số thật. */
export interface PbrKnobView {
  typeId: MaterialTypeId | null;
  baseColor: string | null;
  roughness: number;
  roughnessFromDefault: boolean;
  /** null = loại hiện tại không trong suốt ⇒ ẨN núm ④ */
  transmission: number | null;
  /** cờ suy đoán còn nguyên trên pbr — UI phải hiện badge (KS5 "nói được vì sao") */
  suyDoan: boolean;
}

export function pbrKnobView(pbr: MaterialPbr | undefined): PbrKnobView {
  const def = materialTypeOf(pbr?.typeId);
  const roughness = pbr?.roughness ?? def?.roughnessInit ?? DEFAULT_PBR.roughness;
  return {
    typeId: def?.id ?? null,
    baseColor: pbr?.baseColor ?? null,
    roughness,
    roughnessFromDefault: pbr?.roughness === undefined,
    transmission: def?.transparent ? (pbr?.transmission?.value ?? GLASS_TRANSMISSION_INIT.value) : null,
    suyDoan: pbr?.suyDoan === true,
  };
}
