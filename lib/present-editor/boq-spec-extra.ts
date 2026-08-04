/**
 * lib/present-editor/boq-spec-extra.ts — cột "Quy cách" + "Đơn vị" cho bảng BOQ (yêu cầu 04/08).
 * THUẦN, lớp JOIN hiển thị — KHÔNG đụng `lib/boq/*` (tầng tính): `BoqRow` (`lib/boq/model.ts`)
 * cố tình không mang `unit`/kích thước (xem ghi chú `MaterialSpecLite.unit` "thuần hiển thị,
 * KHÔNG rẽ nhánh logic"), nên 2 cột này được JOIN lại ở tầng UI theo `matId`, giống cách
 * `lib/present-editor/boq-overrides.ts` phủ lớp hiển thị lên `BoqRow` mà không sửa engine.
 *
 * "Quy cách" (quy ước dự toán VN — kích thước/mô tả thương mại): ưu tiên `packagingSpec`
 * (ProductSpec đã có field này, đúng nghĩa "quy cách đóng gói/thương mại" — prisma/schema.prisma
 * dòng field `packagingSpec`), rơi về kích thước danh nghĩa `w×d×hUp` (mm) nếu thiếu, cuối cùng '—'.
 */
export interface BoqSpecExtraDto {
  id: string;
  unit?: string | null;
  packagingSpec?: string | null;
  w?: number | null;
  d?: number | null;
  hUp?: number | null;
}

export interface BoqSpecExtra {
  unit: string;
  quyCach: string;
}

/** Nhãn đơn vị hiển thị — `ProductSpec.unit` là text tự do (không ràng buộc enum, ATLAS có thể
 * thêm đơn vị mới bất kỳ lúc nào — xem ghi chú prisma/schema.prisma), nên chỉ dịch vài mã hay gặp
 * còn lại HIỆN NGUYÊN VĂN, không rơi về '—' (mất thông tin ATLAS đã gửi). */
const UNIT_LABELS: Record<string, string> = {
  m2: 'm²',
  m3: 'm³',
  m: 'm',
  cai: 'cái',
  bo: 'bộ',
  tam: 'tấm',
  cay: 'cây',
};

export function boqUnitLabel(unit: string | null | undefined): string {
  const s = (unit ?? '').trim();
  if (!s) return '—';
  return UNIT_LABELS[s] ?? s;
}

export function boqQuyCach(spec: BoqSpecExtraDto): string {
  const packaging = (spec.packagingSpec ?? '').trim();
  if (packaging) return packaging;
  const dims = [spec.w, spec.d, spec.hUp].filter((n): n is number => typeof n === 'number' && n > 0);
  if (dims.length) return `${dims.join('×')}mm`;
  return '—';
}

export function buildBoqSpecExtraMap(specs: BoqSpecExtraDto[]): Map<string, BoqSpecExtra> {
  const m = new Map<string, BoqSpecExtra>();
  for (const s of specs) {
    m.set(s.id, { unit: boqUnitLabel(s.unit), quyCach: boqQuyCach(s) });
  }
  return m;
}
