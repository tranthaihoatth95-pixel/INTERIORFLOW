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

/**
 * Nguồn hình học của 1 dòng BOQ (G-M3-09, 06/08):
 *  - 'area'  — gộp từ `HatchEntity` (vùng tô) ⇒ khối lượng là DIỆN TÍCH m², số thập phân.
 *  - 'count' — gộp từ `BlockEntity` (món rời: ghế/bàn/đèn…) ⇒ khối lượng là SỐ CÁI, số NGUYÊN.
 * Hai loại KHÔNG cộng chung được (m² + cái = vô nghĩa) nên chúng là 2 dòng riêng kể cả khi cùng
 * `specId` — xem `computeBoq` và lỗi `specId-both-kinds`.
 */
export type BoqRowKind = 'area' | 'count';

/** 1 dòng BOQ đã gộp theo vật liệu — tên field tiếng Việt khớp yêu cầu gốc
 * `{matId, tên, NCC, mã, m², đơn giá, hao hụt %, thành tiền}`. */
export interface BoqRow {
  matId: string;
  ten: string;
  ncc: string;
  ma: string;
  /**
   * @deprecated dùng `qty` + `unit`. GIỮ LẠI vì override sửa-tay (`lib/present-editor/
   * boq-overrides.ts` field `'m2'`), bảng UI và test cũ đều bám tên này — đổi tên là vỡ dữ liệu
   * override đã lưu trong IndexedDB của người dùng. LUÔN BẰNG `qty`; với dòng `kind:'count'`
   * con số này là SỐ CÁI, KHÔNG phải mét vuông (đọc `unit` trước khi in ra bất cứ đâu).
   */
  m2: number;
  /** Khối lượng THẬT của dòng — đọc CÙNG `unit`. 'm2' ⇒ diện tích; đơn vị đếm ⇒ số nguyên cái/bộ. */
  qty: number;
  /** Đơn vị của `qty`: 'm2' cho vùng tô · 'cai'/'bo'/… cho món rời (lấy từ `ProductSpec.unit`
   * khi đó là đơn vị ĐẾM, ngược lại rơi về `FFE_DEFAULT_UNIT`). Chuỗi tự do như `ProductSpec.unit`. */
  unit: string;
  kind: BoqRowKind;
  donGia: number;
  haoHutPhanTram: number;
  thanhTien: number;
  /** id các entity đã gộp vào dòng này (HatchEntity hoặc BlockEntity) — để UI highlight/trace
   * ngược bản vẽ. */
  entityIds: string[];
}

export type BoqErrorReason =
  | 'missing-specId'
  | 'spec-not-found'
  | 'missing-priceVnd'
  /** BOQ v2 (Việc 3a, 02/08) — 2+ vùng tô CÙNG vật liệu chồng lấn lên nhau (đè hẳn, không phải
   * chỉ chung 1 cạnh) — không cộng gộp diện tích (sẽ tính khống), báo lỗi để người vẽ tách lại.
   * Xem `lib/boq/compute.ts` hàm `overlaps()`/`findOverlappingPairs()` cho giới hạn heuristic. */
  | 'overlapping-region'
  /** G-M3-09 (06/08) — MÓN RỜI (`BlockEntity`: ghế/bàn/đèn…) chưa gán `specId`. Trước 06/08
   * `computeBoq` chỉ quét `hatch` nên những món này rơi khỏi báo giá **không một tiếng nào** —
   * bảng vẫn trông "đủ". Nay luôn có lỗi này để người dùng thấy mình đang thiếu bao nhiêu món. */
  | 'missing-specId-item'
  /** G-M3-09 — CÙNG 1 `specId` vừa được dùng cho vùng tô vừa được gán cho món rời ⇒ engine sinh 2
   * dòng (m² và cái, không cộng chung được) NHƯNG chúng trùng `matId` ⇒ sửa tay 1 ô sẽ áp cho cả
   * hai dòng (override key theo `matId`). Báo rõ thay vì để người dùng sửa 1 dòng thấy 2 dòng đổi. */
  | 'specId-both-kinds'
  /* ─── 4 lý do dưới đây thêm ở vòng KIỂM PHẢN BIỆN 06/08: cùng họ "tiền sai mà KHÔNG có lỗi"
     với G-M3-09 — engine cho ra con số TRÔNG NHƯ ĐÚNG. Nguyên tắc: thà báo lỗi còn hơn ra số sai. */
  /**
   * ĐỐI TƯỢNG TRÊN BẢN VẼ tự nó không dùng được để tính khối lượng ⇒ bị loại khỏi phép tính. Hai
   * ca, cùng một việc phải làm (soi đúng những đối tượng đó trên bản vẽ rồi sửa/xoá):
   *  (a) vùng tô có `specId` nhưng hình học KHÔNG có diện tích (dưới 3 đỉnh, hoặc các đỉnh thẳng
   *      hàng ⇒ `polygonArea` = 0). Trước đây ra 1 dòng `0.00 m²`, thành tiền 0đ, `errors: []` —
   *      bảng trông đủ, tiền thiếu.
   *  (b) (06/08 vòng 3) hai đối tượng mang CÙNG một `id` — `Doc.entities` là mảng, không có ràng
   *      buộc id duy nhất, nên gộp sheet/nhập file/undo lỗi đều có thể để lọt bản trùng. Trước đây
   *      `computeBoq` cộng cả hai: đo được 2 vùng tô cùng id ⇒ **18 m²/1.800.000đ thay vì
   *      9 m²/900.000đ**, 2 block cùng id ⇒ **qty 2 thay vì 1**, `errors: []`. Nay giữ bản gặp
   *      ĐẦU TIÊN, bỏ bản sau, và nói rõ đã bỏ mấy bản.
   * ⚠️ Vì sao (b) KHÔNG có lý do riêng: mọi `BoqErrorReason` mới đều phải khai thêm một nhánh
   * `case` trong `actionLabel()` (`components/present-editor/boq/BoqErrors.tsx` — switch KHÔNG có
   * `default`, thiếu nhánh là vỡ `tsc` toàn repo), mà `components/**` nằm ngoài vùng file của đợt
   * sửa này. Việc còn thiếu, làm khi đụng được vùng đó: tách `'duplicate-entity-id'` thành lý do
   * riêng + thêm 1 `case` ở `actionLabel` (nhãn nút: "Xem N đối tượng trùng id").
   */
  | 'invalid-geometry'
  /** MÓN RỜI trỏ vào spec khai đơn vị ĐO (m2/m/m3/kg…). "1 cái × đơn giá mỗi m²" là con số bịa.
   * KHÔNG tạo dòng — bắt người dùng sửa đơn vị trong kho hoặc gỡ mã khỏi món. */
  | 'unit-mismatch'
  /** Đơn vị IF chưa biết ('thùng', 'kiện'…). VẪN tạo dòng và GIỮ NGUYÊN chữ người dùng viết (không
   * nuốt thành 'cai'), nhưng cảnh báo để họ đối chiếu đơn giá có đúng theo đơn vị đó không. */
  | 'unknown-unit'
  /**
   * TIỀN không tính được vì SỐ hỏng. Hai ca:
   *  (a) `priceVnd`/`wastagePercent` ÂM hoặc không phải số hữu hạn (NaN/undefined lọt qua JSON,
   *      hoặc người dùng gõ `-100000` ở cửa nhập Excel). Trước đây ra thành tiền ÂM / `NaN`,
   *      tổng `NaN`, `errors: []`.
   *  (b) (06/08 vòng 3) KẾT QUẢ phép nhân TRÀN SỐ (`Infinity`) dù mọi ĐẦU VÀO đều hữu hạn — vd
   *      `wastagePercent = 1e308`: `priceProblem` cho qua vì nó chỉ soi đầu vào, `thanhTien` ra
   *      `Infinity` với `errors: []`, rồi `buildXlsxBuffer` NÉM LỖI bằng tiếng lập trình viên
   *      đúng lúc người dùng bấm "Xuất .xlsx". Nay chặn tại nguồn, câu lỗi nêu rõ 3 số đã nhân.
   * Cùng một việc phải làm (sửa giá/hao hụt trong kho vật liệu) nên dùng chung lý do — nhãn nút
   * "Sửa trong kho vật liệu" của `BoqErrors.tsx` đúng cho cả hai.
   */
  | 'invalid-price';

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
