/**
 * lib/boq/model.ts — BOQ ENGINE (02/08), kiểu dữ liệu THUẦN (không React/DOM/Prisma/store-
 * instance) — cùng nguyên tắc `lib/cad/schedule.ts` (test bằng sucrase-node).
 *
 * Đọc trước khi sửa: `docs/SPEC-SEMANTIC-MODEL.md` §4+§7 (nguồn "matId" — hiện thân thật trong
 * code là `HatchEntity.specId`, xem model.ts), `docs/SPEC-MODE-PER-STAGE.md` §4 (BOQ là editor
 * RIÊNG ở Present, việc NÀY chỉ là lớp tính-thuần bên dưới, không phải editor đó).
 *
 * Phạm vi v1 (khoá theo 4 điểm lệnh gốc 02/08): quét vùng tô (`HatchEntity`) → gộp theo
 * `specId` → m² (dùng `polygonArea` có sẵn `lib/cad/hatch.ts`) → nhân đơn giá `ProductSpec`
 * + hao hụt %. KHÔNG trừ lỗ mở cửa/sổ (`openingsAreaInPolygon` đã có sẵn cho việc khác — BOQ
 * tường sau này — nhưng KHÔNG áp mặc định ở đây vì brief không yêu cầu và không có test case nào
 * xác nhận hành vi trừ lỗ mở là đúng cho vùng tô nói chung, vd sàn/trần không có "lỗ mở"). Số
 * học dùng `number` JS thường (KHÔNG thêm package decimal.js) — tài liệu kiến trúc `2.1.9.p`
 * trong `IF-FEATURE-TREE.md` có nhắc `Decimal(12,4) nội bộ` cho 1 BOQ engine ĐẦY ĐỦ 5 bước
 * (qty_geom→qty_design→qty_exec→qty_order→amount) — đó là thiết kế cho lượt làm SAU (chưa
 * greenlight), v1 này chỉ là "logic thuần, chưa làm UI" theo đúng 4 điểm lệnh, phạm vi hẹp hơn.
 */

/** Hình lát tối thiểu của `ProductSpec{kind:'material'}` mà BOQ cần — caller (route/UI) tự tra
 * qua `GET /api/specs?kind=material` (đã vá `specToDto` trả đủ field 02/08) rồi truyền vào,
 * KHÔNG để `computeBoq` tự fetch (giữ module THUẦN, test không cần mock network/DB). */
export interface MaterialSpecLite {
  /** = ProductSpec.id, khớp `HatchEntity.specId`. */
  id: string;
  name: string;
  vendor?: string | null;
  sku?: string | null;
  /** đơn vị tính, vd 'm2' — v1 CHỈ tính diện tích m², field này thuần hiển thị, KHÔNG rẽ nhánh
   * logic theo giá trị này (chưa có UI đổi đơn vị/loại tính theo chiều dài hay thể tích). */
  unit?: string | null;
  /** null = "chưa có giá" — theo đúng ghi chú Prisma schema, BOQ PHẢI báo lỗi rõ, không đoán. */
  priceVnd: number | null;
  /** null = coi như 0% (không hao hụt) — khác priceVnd (null giá thì KHÔNG được coi như 0). */
  wastagePercent: number | null;
}

/** 1 dòng BOQ đã gộp theo vật liệu — tên field tiếng Việt khớp yêu cầu gốc
 * `{matId, tên, NCC, mã, m², đơn giá, hao hụt %, thành tiền}`. */
export interface BoqRow {
  matId: string;
  ten: string;
  ncc: string;
  ma: string;
  m2: number;
  donGia: number;
  haoHutPhanTram: number;
  thanhTien: number;
  /** id các HatchEntity đã gộp vào dòng này — để UI sau này highlight/trace ngược bản vẽ. */
  entityIds: string[];
}

export type BoqErrorReason =
  | 'missing-specId'
  | 'spec-not-found'
  | 'missing-priceVnd'
  /** BOQ v2 (Việc 3a, 02/08) — 2+ vùng tô CÙNG vật liệu chồng lấn lên nhau (đè hẳn, không phải
   * chỉ chung 1 cạnh) — không cộng gộp diện tích (sẽ tính khống), báo lỗi để người vẽ tách lại.
   * Xem `lib/boq/compute.ts` hàm `overlaps()`/`findOverlappingPairs()` cho giới hạn heuristic. */
  | 'overlapping-region';

/** 1 lỗi/vùng KHÔNG tính được — thay vì tính bừa hoặc âm thầm bỏ qua. */
export interface BoqError {
  reason: BoqErrorReason;
  /** id các HatchEntity liên quan tới lỗi này. */
  entityIds: string[];
  /** specId liên quan (nếu có — thiếu hẳn specId thì undefined). */
  matId?: string;
  /** câu tiếng Việt giải thích, hiện thẳng cho Hoà/user — không mã lỗi trần trụi. */
  message: string;
}

export interface BoqResult {
  rows: BoqRow[];
  errors: BoqError[];
  /** tổng thành tiền CÁC DÒNG HỢP LỆ (rows) — vùng lỗi KHÔNG cộng vào, tránh báo giá thiếu mà
   * không ai biết. */
  totalAmount: number;
}
