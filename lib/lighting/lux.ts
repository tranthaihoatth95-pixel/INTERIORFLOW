/**
 * lib/lighting/lux.ts — HÀM LUX L6 (08/08, mở kho §1#8 `DOI-CHIEU-42-SPEC-2026-08-08.md`):
 * ước lượng độ rọi trung bình của phòng bằng PHƯƠNG PHÁP QUANG THÔNG (lumen method):
 *
 *     E = (Φ · UF · MF) / A
 *
 *   E  : độ rọi trung bình trên mặt phẳng làm việc (lux = lm/m²)
 *   Φ  : TỔNG quang thông các đèn trong phòng (lm) — đọc từ `RoomLight.lumens`
 *        (`lib/three/lighting.ts:87`, đúng số in trên hộp đèn)
 *   UF : hệ số sử dụng (utilization factor) — phần quang thông thực sự tới mặt làm việc,
 *        phụ thuộc hình phòng + hệ số phản xạ trần/tường/sàn
 *   MF : hệ số duy trì (maintenance factor) — bụi bẩn + già hoá bóng theo thời gian
 *   A  : diện tích sàn phòng (m²) — dùng `roomAreaM2()` (`lib/cad/room.ts:30`) làm mẫu số
 *
 * NGUỒN CÔNG THỨC + MẶC ĐỊNH (ghi rõ để khỏi thành số bịa):
 * - Công thức lumen method (average illuminance / zonal cavity) — IESNA Lighting Handbook,
 *   10th ed., chương "Lighting Calculations"; cùng dạng trong CIBSE Code for Lighting.
 * - UF mặc định 0.4: mức THẬN TRỌNG cho phòng nội thất thường (UF thực tế dao động ~0.3–0.6
 *   tuỳ chỉ số phòng RI và phản xạ trần/tường; 0.4 là giá trị thực hành phổ biến khi chưa tra
 *   bảng UF của nhà sản xuất đèn). KHÔNG phải trích bảng chuẩn nào — là mặc định ngành ghi rõ.
 * - MF mặc định 0.8: CIE 97:2005 (Guide on the maintenance of indoor electric lighting
 *   systems) — môi trường trong nhà sạch, chu kỳ bảo trì bình thường.
 *
 * BẢN 1 CỐ Ý ĐƠN GIẢN: UF là THAM SỐ người gọi chỉnh được, KHÔNG tự tính từ hình phòng/hệ số
 * phản xạ bề mặt. `MaterialPbr.reflectance` (schema.ts) đã khai chỗ cho bản sau tính UF thật
 * theo zonal cavity — bản này CHƯA đọc trường đó (ghi rõ ở docstring trường ấy).
 *
 * ⛔ `lib/three/lighting.ts` là vùng phiên p7 — file này CHỈ `import type` (sucrase xoá lúc
 * chạy, không kéo runtime của module đó vào), TUYỆT ĐỐI không sửa nó.
 *
 * Đối chiếu ngưỡng: dùng thẳng `VN_LIGHTING` (`lib/cad/standards/vn-lighting.ts`) — dữ liệu
 * tham khảo advisory, `verified:false` (KHÔNG phải trích nguyên văn QCVN/TCVN — cảnh báo nguồn
 * nằm trong chính file đó). Verdict trả về vì thế cũng chỉ là GÓP Ý, không bao giờ chặn
 * (đúng luật 2 lớp kiểm 07/08 §12: lớp góp ý không trộn với lớp luật).
 */
import type { RoomLight } from '../three/lighting';
import { VN_LIGHTING } from '../cad/standards/vn-lighting';

/** UF mặc định — thực hành phổ biến, xem docblock đầu file (KHÔNG phải trích bảng chuẩn). */
export const DEFAULT_UTILIZATION_FACTOR = 0.4;
/** MF mặc định — CIE 97:2005, môi trường trong nhà sạch. */
export const DEFAULT_MAINTENANCE_FACTOR = 0.8;

export interface LuxEstimateOptions {
  /** Hệ số sử dụng 0–1. Không truyền/không hữu hạn → DEFAULT_UTILIZATION_FACTOR; ngoài [0,1] bị kẹp. */
  uf?: number;
  /** Hệ số duy trì 0–1. Không truyền/không hữu hạn → DEFAULT_MAINTENANCE_FACTOR; ngoài [0,1] bị kẹp. */
  mf?: number;
}

/** Kẹp hệ số về [0,1]; giá trị không hữu hạn rơi về mặc định — hàm thuần không được throw vì input xấu. */
function factorOrDefault(v: number | undefined, fallback: number): number {
  if (v === undefined || !Number.isFinite(v)) return fallback;
  return Math.min(1, Math.max(0, v));
}

/**
 * E = (Σ lumens · UF · MF) / A — độ rọi trung bình ước lượng (lux).
 *
 * - `lights`: chỉ cần trường `lumens` (Pick từ `RoomLight` để gọi được bằng cả mock lẫn đèn
 *   thật) — đèn có `lumens` ≤ 0 hoặc không hữu hạn bị BỎ QUA (cùng cách `buildLightRig` cảnh
 *   báo "không phát sáng", nhưng đây là hàm thuần nên bỏ qua lặng lẽ thay vì đẩy warning).
 * - `areaM2` không hữu hạn hoặc ≤ 0 → trả `NaN` (không có "độ rọi của phòng 0 m²" — trả 0 sẽ
 *   giả vờ là số đo thật; NaN buộc UI xử lý rõ ràng).
 */
export function roomLuxEstimate(
  lights: readonly Pick<RoomLight, 'lumens'>[],
  areaM2: number,
  opts: LuxEstimateOptions = {},
): number {
  if (!Number.isFinite(areaM2) || areaM2 <= 0) return NaN;
  const uf = factorOrDefault(opts.uf, DEFAULT_UTILIZATION_FACTOR);
  const mf = factorOrDefault(opts.mf, DEFAULT_MAINTENANCE_FACTOR);
  let totalLm = 0;
  for (const l of lights) {
    if (Number.isFinite(l.lumens) && l.lumens > 0) totalLm += l.lumens;
  }
  return (totalLm * uf * mf) / areaM2;
}

/** 3 loại phòng có ngưỡng tham khảo trong VN_LIGHTING (05/08) — chưa có bảng cho loại khác. */
export type LuxRoomKind = 'living' | 'bedroom' | 'kitchen';

const RULE_ID_BY_KIND: Record<LuxRoomKind, string> = {
  living: 'vn-lighting-living-room-lux-reference',
  bedroom: 'vn-lighting-bedroom-lux-reference',
  kitchen: 'vn-lighting-kitchen-lux-reference',
};

export interface LuxVerdict {
  /** id rule trong VN_LIGHTING — để UI dẫn nguồn được (luật lớp góp ý: nói được lý do). */
  ruleId: string;
  minLux: number;
  maxLux: number;
  status: 'below' | 'within' | 'above';
  /** Luôn true — ngưỡng là advisory (VN_LIGHTING binding 'advisory'), KHÔNG BAO GIỜ chặn. */
  advisory: true;
  /** Luôn false — nguồn tự khai chưa xác minh với văn bản pháp quy (xem vn-lighting.ts). */
  verified: false;
  /** Chuỗi nguồn nguyên văn từ rule — UI hiện kèm để không mạo danh QCVN. */
  source: string;
}

/**
 * So `lux` với dải tham khảo của loại phòng. Trả `null` khi: lux không hữu hạn (vd NaN từ
 * `roomLuxEstimate` phòng 0 m²) hoặc rule không tìm thấy — KHÔNG bịa verdict khi thiếu dữ liệu.
 */
export function luxVerdict(lux: number, roomKind: LuxRoomKind): LuxVerdict | null {
  if (!Number.isFinite(lux)) return null;
  const rule = VN_LIGHTING.rules.find((r) => r.id === RULE_ID_BY_KIND[roomKind]);
  if (!rule) return null;
  const minLux = rule.params.minLux;
  const maxLux = rule.params.maxLux;
  if (!Number.isFinite(minLux) || !Number.isFinite(maxLux)) return null;
  return {
    ruleId: rule.id,
    minLux,
    maxLux,
    status: lux < minLux ? 'below' : lux > maxLux ? 'above' : 'within',
    advisory: true,
    verified: false,
    source: rule.source,
  };
}

/** Tiện gộp: ước lượng + đối chiếu một nhịp. `roomKind` bỏ trống → chỉ trả số, verdict null. */
export function roomLuxReport(
  lights: readonly Pick<RoomLight, 'lumens'>[],
  areaM2: number,
  roomKind?: LuxRoomKind,
  opts: LuxEstimateOptions = {},
): { lux: number; verdict: LuxVerdict | null } {
  const lux = roomLuxEstimate(lights, areaM2, opts);
  return { lux, verdict: roomKind ? luxVerdict(lux, roomKind) : null };
}
