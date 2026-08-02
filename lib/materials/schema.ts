/**
 * lib/materials/schema.ts — CHỐT LƯU TRỮ matId PBR, theo `docs/SPEC-VAT-LIEU-PBR-IF.md` §1
 * (03/08/2026, trạng thái CHỐT). Nghiên cứu 3 engine (V-Ray/D5/Enscape) kết luận: D5 và Enscape
 * đã là PBR **metal/rough chuẩn glTF** thuần — matId lưu đúng chuẩn đó là khớp 2/3 engine không
 * cần dịch; chỉ V-Ray cần một lớp dịch mỏng (xem `export-vray.ts`).
 *
 * Đây là type THỊ GIÁC/RENDER — không phải type THƯƠNG MẠI. Không nhồi giá/NCC/hao hụt vào đây
 * (đúng luật 2.1.9.i 30/07 đã chốt trong `lib/cad/materials.ts`: MaterialDef=thị giác,
 * ProductSpec=thương mại, cố ý không trộn). `MaterialPbr` này CHỈ mở rộng phần thị giác thêm
 * chiều render-thật (trước giờ `MaterialDef` chỉ có màu phẳng/hatch 2D).
 *
 * Mọi trường đều optional — 1 preset có thể chỉ set vài trường, phần còn lại engine export tự
 * dùng mặc định hợp lý (xem DEFAULT_PBR).
 */

/** sRGB — baseColor và emissive.color đọc theo gamma màn hình bình thường. */
export type SrgbHex = string;

/** Chế độ trong suốt của matId (không phải glass — glass dùng `transmission`). */
export type OpacityMode = 'cutout' | 'blend';

export interface MaterialPbr {
  /** sRGB. Nếu bỏ trống, phía gọi tự fallback sang MaterialDef.color (đã có sẵn). */
  baseColor?: SrgbHex;
  /** linear, 0(bóng gương)–1(nhám hoàn toàn). */
  roughness?: number;
  /**
   * glTF metal/rough: chỉ 0 hoặc 1 — KHÔNG phải thang liên tục (doc Chaos: giá trị giữa
   * "không ứng với vật liệu vật lý nào", xem §1 bảng dịch V-Ray).
   */
  metallic?: 0 | 1;
  /** F0 — phản xạ trực diện, 0–1. Mặc định vật liệu điện môi thường ≈0.04 (IOR 1.5). */
  specular?: number;
  /** Normal map (tangent-space), NẠP LINEAR — không phải sRGB. Để URL/data-URI, thuần dữ liệu. */
  normalUrl?: string;
  /** Height/displacement map, NẠP LINEAR. */
  heightUrl?: string;
  /** Ambient occlusion map. */
  aoUrl?: string;
  emissive?: {
    /** sRGB. */
    color: SrgbHex;
    /** Cường độ tự phát sáng, ≥0 (0 = tắt). */
    intensity: number;
    /** Nhiệt độ màu tham chiếu (K) — tuỳ chọn, chỉ để hiển thị/gợi ý UI chọn màu. */
    kelvin?: number;
  };
  opacity?: {
    /** 0(trong suốt hoàn toàn)–1(đục hoàn toàn). */
    value: number;
    mode: OpacityMode;
  };
  /** [mở rộng §1] Kính/trong suốt thật (khác opacity — có khúc xạ). */
  transmission?: {
    value: number;
    /** Index of refraction — kính thường ~1.5, nước ~1.33. */
    ior: number;
  };
  /** [mở rộng §1] Lớp phủ bóng thứ 2 (sơn xe, gỗ sơn mài…). */
  clearcoat?: {
    value: number;
    roughness: number;
  };
  /** [mở rộng §1] Vải/sợi — ánh sheen ở rìa (nhung, lụa…). 0–1. */
  sheen?: number;
  /**
   * Đánh dấu các trường ở trên là GIÁ TRỊ SUY ĐOÁN (vd từ `inferPbrFromCategory` khi ATLAS chưa
   * có dữ liệu PBR đo thật) — KHÔNG PHẢI đo/nhập tay. UI phải hiện rõ badge/ghi chú khi cờ này
   * true, đúng yêu cầu spec §4-2: "Ghi rõ đây là giá trị suy đoán, người dùng chỉnh sau."
   */
  suyDoan?: boolean;
}

/**
 * Mặc định trung tính khi 1 trường PBR bị bỏ trống — dùng ở export-vray.ts/export-d5.ts để mỗi
 * hàm export luôn ra đủ tham số, không phải tự đoán rải rác nhiều chỗ. Giá trị chọn theo vật
 * liệu điện môi (dielectric) thường gặp nhất, không phải "trung bình cộng" của bảng suy đoán
 * theo Danh mục (xem pbr-from-category.ts — 2 bảng phục vụ 2 mục đích khác nhau, cố ý tách).
 */
export const DEFAULT_PBR: Required<Pick<MaterialPbr, 'roughness' | 'metallic' | 'specular'>> = {
  roughness: 0.5,
  metallic: 0,
  specular: 0.04, // F0 IOR 1.5 — đúng trích dẫn §1
};
