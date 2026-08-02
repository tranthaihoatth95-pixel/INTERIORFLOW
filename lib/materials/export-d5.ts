/**
 * lib/materials/export-d5.ts — dịch `MaterialPbr` (matId) sang tham số D5 Render, theo kết luận
 * `docs/SPEC-VAT-LIEU-PBR-IF.md` §1: "D5 và Enscape đã là PBR metal/rough THUẦN → matId lưu theo
 * chuẩn đó là khớp 2/3 engine KHÔNG CẦN DỊCH". Vì vậy hàm này gần như PASSTHROUGH (không có bảng
 * dịch công tắc-đổi-nghĩa như V-Ray ở `export-vray.ts`) — khác biệt DUY NHẤT với matId gốc là
 * đặt tên field theo quy ước D5 (baseColor→albedo, đổi shape cho gọn phía nhận) + set mặc định
 * khi thiếu, giống hệt cách export-vray.ts làm.
 *
 * ⚠️ THÀNH THẬT VỀ GIỚI HẠN: spec chỉ trích dẫn nguồn "D5 Material manual" ở mức Ý (kết luận
 * metal/rough thuần), KHÔNG có bảng tên-field chính xác từng nút UI/API D5 như đã tra cho V-Ray
 * (6 dòng công tắc Chaos §1). Tên field dưới đây (`albedo`/`metalness`/`roughnessValue`...) là
 * ĐẶT HỢP LÝ theo quy ước D5 UI công khai quan sát được (Base Color/Roughness/Metalness/Normal/
 * Emissive đúng thuật ngữ D5 dùng), KHÔNG PHẢI trích dẫn field-name API đã xác minh — nếu sau này
 * nối D5 SDK/plugin thật, phải đối chiếu lại tên field với doc D5 chính thức trước khi tin.
 *
 * Thuần hàm — test được độc lập (export-d5.test.ts).
 */
import type { MaterialPbr } from './schema';
import { DEFAULT_PBR } from './schema';

export interface D5MaterialExport {
  /** sRGB — đúng matId, D5 không cần dịch gamma cho baseColor. */
  albedoSrgb: string;
  /** linear — D5 đọc thẳng, KHÔNG cần đảo như "Use Roughness" của V-Ray. */
  roughness: number;
  /** 0 hoặc 1 — passthrough, D5 vốn đã metal/rough chuẩn glTF. */
  metalness: number;
  normalMapUrl?: string;
  heightMapUrl?: string;
  aoMapUrl?: string;
  emissive?: {
    colorSrgb: string;
    intensity: number;
  };
  opacity?: {
    value: number;
    mode: 'cutout' | 'blend';
  };
  /** Kính/trong suốt — D5 gọi "Transmission" đúng thuật ngữ glTF, không cần dịch tên. */
  transmission?: {
    value: number;
    ior: number;
  };
  clearcoat?: {
    value: number;
    roughness: number;
  };
  sheen?: number;
  /** Đánh dấu lại nếu nguồn matId có `suyDoan: true` — để UI D5-preview vẫn hiện badge suy đoán. */
  suyDoan?: boolean;
}

export function toD5Material(pbr: MaterialPbr, baseColorFallback: string): D5MaterialExport {
  const out: D5MaterialExport = {
    albedoSrgb: pbr.baseColor ?? baseColorFallback,
    roughness: pbr.roughness ?? DEFAULT_PBR.roughness,
    metalness: pbr.metallic ?? DEFAULT_PBR.metallic,
  };
  if (pbr.normalUrl) out.normalMapUrl = pbr.normalUrl;
  if (pbr.heightUrl) out.heightMapUrl = pbr.heightUrl;
  if (pbr.aoUrl) out.aoMapUrl = pbr.aoUrl;
  if (pbr.emissive) out.emissive = { colorSrgb: pbr.emissive.color, intensity: pbr.emissive.intensity };
  if (pbr.opacity) out.opacity = { value: pbr.opacity.value, mode: pbr.opacity.mode };
  if (pbr.transmission) out.transmission = { value: pbr.transmission.value, ior: pbr.transmission.ior };
  if (pbr.clearcoat) out.clearcoat = { value: pbr.clearcoat.value, roughness: pbr.clearcoat.roughness };
  if (pbr.sheen !== undefined) out.sheen = pbr.sheen;
  if (pbr.suyDoan) out.suyDoan = true;
  return out;
}
