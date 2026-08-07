/**
 * lib/library/spec-panel.ts — CỘT THÔNG SỐ ④ của tấm Thư viện (236px).
 *
 * Nguồn thiết kế: `docs/mocks/Thư viện.dc.html` khối "CotThongSo" (06/08 đã nội hoá vào file mẹ,
 * trước đó là `<dc-import>` trỏ vào file KHÔNG tồn tại — xem `docs/M-APPLY-A-OUT.md` §A3).
 * Mock liệt kê đúng 6 dòng: Hãng · Mã · Đơn vị · Giá mỗi <đơn vị> · Độ nhám · Độ bóng.
 *
 * ⛔ LUẬT CỦA FILE NÀY: **KHÔNG BỊA SỐ.** Giá/hãng/đơn vị là dữ liệu người dùng mang đi dự toán —
 * một con số bịa trong cột này đi thẳng vào báo giá gửi khách. Trường nào chưa có nguồn thật thì
 * trả `value: null` để giao diện hiện ô trống KÈM LÝ DO (§9 `00-BAT-DAU-DOC-DAY`: vẽ ra chỗ trống,
 * cấm nút giả, cấm xoá ô trống cho gọn mắt), KHÔNG rơi về số mẫu của mock.
 *
 * Vì sao 4/6 dòng hiện chưa có nguồn: `SheetItem` (`lib/library/shelves.ts`) chỉ mang
 * `name`/`code`/`kind`/`scope`/`mechanic` — nó là danh mục KỆ. Hãng · đơn vị · giá sống ở
 * `ProductSpec` (`prisma/schema.prisma`, đọc qua `GET /api/specs`); nhám/bóng sống ở matId PBR
 * (`lib/materials/schema.ts`). Ba kho này **cố ý không trộn** (STATUS.md 04/08, mục kho vật liệu).
 * Nối được = khi `SheetItem.code` khớp `ProductSpec.sku` — xem `matchSpec()`.
 */

/** Một dòng trong cột thông số. `value === null` ⇒ chưa có nguồn, giao diện hiện lý do. */
export interface SpecRow {
  /** Nhãn tiếng Việt · English — cột này đi qua i18n như mọi chỗ khác. */
  label: [string, string];
  value: string | null;
  /** Chữ đơn vị/hậu tố hiện mờ sau giá trị (vd "m²"). */
  suffix?: string;
  /** Giá trị 0..1 để vẽ thanh mức (nhám/bóng của mock). `null` = không vẽ thanh. */
  bar?: number | null;
}

/** Phần dữ liệu THẬT lấy được từ `GET /api/specs` cho một món (khớp theo mã). */
export interface SpecSource {
  /** Tên hãng đã giải ra chữ (không phải `supplierId` thô). */
  supplier?: string | null;
  unit?: string | null;
  priceVnd?: number | null;
}

/** Vật liệu PBR (matId) — nhám/bóng. Tách riêng vì KHÁC KHO với `ProductSpec`. */
export interface SurfaceSource {
  roughness?: number | null;
  gloss?: number | null;
}

/**
 * Khớp món trên kệ với một spec trong kho.
 * Khớp theo MÃ, chuẩn hoá hoa/thường + bỏ khoảng trắng hai đầu (kho nhập tay từ Excel nên
 * "oak-114 " và "OAK-114" là một). KHÔNG khớp mờ theo tên: trùng tên mà khác mã là hai món khác
 * nhau trong dự toán.
 */
export function matchSpec<T extends { sku?: string | null }>(code: string, specs: readonly T[]): T | undefined {
  const key = code.trim().toLowerCase();
  if (!key) return undefined;
  return specs.find((s) => (s.sku ?? '').trim().toLowerCase() === key);
}

/** Tiền VND — nhóm 3 chữ số bằng DẤU CÁCH đúng mock ("1 480 000"), không dấu chấm/phẩy: hồ sơ
 *  nội thất VN dùng cả `.` lẫn `,` lẫn lộn, dấu cách không gây đọc nhầm ở cả hai thói quen. */
export function formatVnd(n: number): string {
  const whole = Math.round(Math.abs(n));
  const s = String(whole).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return n < 0 ? `-${s}` : s;
}

/** 0..1 → "0.42" đúng mock (2 chữ số thập phân, mono). */
export function formatUnitScalar(n: number): string {
  return n.toFixed(2);
}

/**
 * 6 dòng thông số theo đúng thứ tự mock. Thiếu nguồn thì `value: null` — KHÔNG bỏ dòng đi:
 * ô trống là bằng chứng "còn việc", xoá đi là giấu mất khoảng trống (§9).
 */
export function buildSpecRows(
  item: { code: string },
  spec?: SpecSource,
  surface?: SurfaceSource,
): SpecRow[] {
  const unit = (spec?.unit ?? '').trim() || null;
  const price = typeof spec?.priceVnd === 'number' && Number.isFinite(spec.priceVnd) ? spec.priceVnd : null;
  const rough = typeof surface?.roughness === 'number' ? surface.roughness : null;
  const gloss = typeof surface?.gloss === 'number' ? surface.gloss : null;

  return [
    { label: ['Hãng', 'Brand'], value: (spec?.supplier ?? '').trim() || null },
    // Mã LUÔN có — nó là khoá của chính món, không phụ thuộc kho nào.
    { label: ['Mã', 'Code'], value: item.code.trim() || null },
    { label: ['Đơn vị', 'Unit'], value: unit },
    {
      // Nhãn giá NÓI RÕ theo đơn vị nào (mock: "Giá mỗi mét vuông"). Chưa biết đơn vị thì nói
      // "Giá" trơn, không đoán bừa "mỗi m²".
      label: unit ? [`Giá mỗi ${unit}`, `Price per ${unit}`] : ['Giá', 'Price'],
      value: price === null ? null : formatVnd(price),
    },
    { label: ['Độ nhám', 'Roughness'], value: rough === null ? null : formatUnitScalar(rough), bar: rough },
    { label: ['Độ bóng', 'Gloss'], value: gloss === null ? null : formatUnitScalar(gloss), bar: gloss },
  ];
}

/** Số dòng CÒN TRỐNG — giao diện dùng để quyết định có hiện câu lý do hay không. */
export function missingSpecCount(rows: readonly SpecRow[]): number {
  return rows.filter((r) => r.value === null).length;
}
