/**
 * lib/materials/export-vray.ts — dịch `MaterialPbr` (matId, chuẩn glTF metal/rough) sang tham số
 * VRayMtl, ĐÚNG bảng dịch đã tra doc Chaos trong `docs/SPEC-VAT-LIEU-PBR-IF.md` §1 (03/08/2026,
 * CHỐT). 6 dòng bảng gốc:
 *   roughness → bật "Use Roughness" (đảo nghĩa glossiness, khỏi bake map đảo) + BRDF GGX
 *   metallic  → Metalness — CHỈ 0 hoặc 1 (giá trị giữa không ứng vật liệu vật lý nào, theo doc Chaos)
 *   specular  → Fresnel IOR, F0=((n−1)/(n+1))² · mặc định IOR 1.5 ≈ 0.04
 *   normal    → Bump slot mode Normal, tangent space, NẠP LINEAR (gamma 1.0)
 *   emissive  → Self-Illumination + GI toggle
 *   glass     → Refraction Color + IOR + Fog
 * ⚠️ Chỉ baseColor/emissive.color là sRGB — roughness/metallic/normal/height phải nạp LINEAR
 * (sai chỗ này là vật liệu "trông sai" không rõ vì sao — trích nguyên văn cảnh báo spec §1).
 *
 * Thuần hàm — không đụng V-Ray SDK/DOM, test được độc lập (export-vray.test.ts). Ai nối vào V-Ray
 * thật (plugin/API) tự map object trả về sang lời gọi SDK tương ứng.
 */
import type { MaterialPbr } from './schema';
import { DEFAULT_PBR } from './schema';

export interface VRayMtlExport {
  diffuse: { colorSrgb: string };
  reflection: {
    /** Luôn true — §1 chốt bật cố định, không có nhánh tắt (khỏi bake map đảo glossiness). */
    useRoughness: true;
    brdf: 'GGX';
    /** Truyền THẲNG giá trị roughness — vì "Use Roughness" đã bật nên KHÔNG đảo (1 − x). */
    roughness: number;
    /** 0 hoặc 1 — ép kiểu tại nguồn (`MaterialPbr.metallic` đã đúng kiểu, đây chỉ truyền qua). */
    metalness: 0 | 1;
    /**
     * Fresnel IOR suy từ specular F0, dùng CHỈ khi metalness=0 (vật liệu điện môi). Khi
     * metalness=1, V-Ray dùng phản xạ theo Metalness/baseColor thay vì Fresnel-từ-IOR thuần —
     * field này vẫn điền cho đủ tham số nhưng bên nhận nên bỏ qua khi metalness=1.
     */
    fresnelIor: number;
    /** roughness/metallic/normal/height đọc LINEAR — cảnh báo nguyên văn §1. */
    gammaMode: 'linear';
  };
  bump?: {
    mode: 'normal';
    space: 'tangent';
    gammaMode: 'linear';
    mapUrl: string;
  };
  displacement?: {
    gammaMode: 'linear';
    mapUrl: string;
  };
  selfIllumination?: {
    colorSrgb: string;
    intensity: number;
    /** Bật khi intensity>0 — đúng ý "Self-Illumination + GI toggle" trong bảng §1. */
    giToggle: boolean;
  };
  /** "glass" trong bảng §1 — chỉ điền khi matId có `transmission`. */
  refraction?: {
    /**
     * ⚠️ CHƯA XÁC MINH kỹ với doc Chaos: matId không có trường "màu khúc xạ" riêng — tạm DÙNG
     * LẠI baseColor làm màu tint khúc xạ (diễn giải hợp lý, không phải trích dẫn trực tiếp).
     */
    colorSrgb: string;
    ior: number;
    /** Bật fog khi có transmission — KHÔNG có dữ liệu mật độ fog trong matId nên để V-Ray mặc định. */
    fogEnabled: true;
  };
  /** Truyền qua trực tiếp — bảng §1 không có dòng riêng cho opacity, chỉ nêu ở phần schema §1. */
  opacityMode?: 'cutout' | 'blend';
  /**
   * clearcoat/sheen có trong matId (phần "[mở rộng]" §1) nhưng bảng dịch V-Ray §1 KHÔNG liệt kê
   * — CỐ Ý không xuất để khỏi bịa tên tham số VRayMtl chưa tra doc. Liệt kê ở đây cho ai đọc code
   * biết đang thiếu, không phải quên.
   */
  chuaXuatDoThieuDoc: ('clearcoat' | 'sheen')[];
}

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

/** F0=((n−1)/(n+1))² đảo ngược: n=(1+√F0)/(1−√F0). Kẹp F0 để tránh IOR vô cực khi F0→1. */
function iorFromSpecular(f0: number): number {
  const clamped = Math.min(0.99, Math.max(0, f0));
  const s = Math.sqrt(clamped);
  return (1 + s) / (1 - s);
}

export function toVRayMtl(pbr: MaterialPbr, baseColorFallback: string): VRayMtlExport {
  const roughness = clamp01(pbr.roughness ?? DEFAULT_PBR.roughness);
  const metalness = pbr.metallic ?? DEFAULT_PBR.metallic;
  const specular = clamp01(pbr.specular ?? DEFAULT_PBR.specular);
  const baseColor = pbr.baseColor ?? baseColorFallback;

  const out: VRayMtlExport = {
    diffuse: { colorSrgb: baseColor },
    reflection: {
      useRoughness: true,
      brdf: 'GGX',
      roughness,
      metalness,
      fresnelIor: iorFromSpecular(specular),
      gammaMode: 'linear',
    },
    chuaXuatDoThieuDoc: ['clearcoat', 'sheen'],
  };

  if (pbr.normalUrl) {
    out.bump = { mode: 'normal', space: 'tangent', gammaMode: 'linear', mapUrl: pbr.normalUrl };
  }
  if (pbr.heightUrl) {
    out.displacement = { gammaMode: 'linear', mapUrl: pbr.heightUrl };
  }
  if (pbr.emissive) {
    out.selfIllumination = {
      colorSrgb: pbr.emissive.color,
      intensity: pbr.emissive.intensity,
      giToggle: pbr.emissive.intensity > 0,
    };
  }
  if (pbr.transmission) {
    out.refraction = {
      colorSrgb: baseColor,
      ior: pbr.transmission.ior,
      fogEnabled: true,
    };
  }
  if (pbr.opacity) {
    out.opacityMode = pbr.opacity.mode;
  }

  return out;
}
