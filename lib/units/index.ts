/**
 * lib/units/index.ts — MARKER unitSystem
 *
 * Nguồn DUY NHẤT cho đơn vị đo cấp app (Phiếu P-A `docs/phieu-giao/P-A-don-vi-ty-le.md`,
 * chốt 15/08 `docs/00-CHOT.md` mục "ĐƠN VỊ ĐO + TỈ LỆ..." + A7 `docs/CHOT-PHIEN-15-08-CAN-SOAT.md`).
 *
 * RÀNG BUỘC CỨNG: lưu trữ nội bộ (Doc, entity, CAD) LUÔN LÀ mm — file này KHÔNG đổi đơn vị lưu,
 * chỉ đổi lớp HIỂN THỊ (`formatLength`) và lớp NHẬP (`parseLength`). Không có nơi nào khác được
 * tự chế công thức quy đổi mm↔đơn vị khác — đúng luật [Đ2] "nhìn vào trong trước, cấm đẻ khuôn mới".
 *
 * `formatLength`/`parseLength` là HAI MẶT của MỘT quy đổi — sửa hằng số ở đây thì cả app đổi theo.
 */

export type UnitId = 'mm' | 'cm' | 'm' | 'in' | 'ft-in';

export const UNIT_IDS: readonly UnitId[] = ['mm', 'cm', 'm', 'in', 'ft-in'];

/** Nhãn hiển thị song ngữ [vi, en] — đúng khuôn `tr()` dùng khắp `components/settings/`. */
export const UNIT_LABELS: Record<UnitId, [string, string]> = {
  mm: ['Milimét (mm)', 'Millimeters (mm)'],
  cm: ['Centimét (cm)', 'Centimeters (cm)'],
  m: ['Mét (m)', 'Meters (m)'],
  in: ['Inch (in)', 'Inches (in)'],
  'ft-in': ['Feet-inch (5′6″)', 'Feet-inch (5′6″)'],
};

type FlatUnit = Exclude<UnitId, 'ft-in'>;

const MM_PER_UNIT: Record<FlatUnit, number> = { mm: 1, cm: 10, m: 1000, in: 25.4 };
const MM_PER_INCH = 25.4;
const MM_PER_FOOT = 304.8;

const UNIT_SUFFIX: Record<FlatUnit, string> = { mm: 'mm', cm: 'cm', m: 'm', in: '"' };

function roundTo(v: number, precision: number): number {
  const p = 10 ** precision;
  return Math.round(v * p) / p;
}

/**
 * Cách nghìn bằng KHOẢNG TRẮNG (5 200 · 24.60 m²) — luật hiển thị số đo kỹ thuật đã ghi ở
 * `docs/IF-design-system-seed.html` mục "Luật bất biến" #3. `toLocaleString('vi-VN')` SAI luật
 * này (in dấu chấm, dễ đọc nhầm số thập phân) — KHÔNG dùng.
 */
export function groupThousands(numStr: string): string {
  const [intPart, dec] = numStr.split('.');
  const negative = intPart.startsWith('-');
  const digits = negative ? intPart.slice(1) : intPart;
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return (negative ? '-' : '') + grouped + (dec !== undefined ? '.' + dec : '');
}

export interface FormatLengthOpts {
  /** Đơn vị hiển thị — mặc định 'mm' nếu không truyền (KHÔNG tự đọc cài đặt người dùng ở đây,
   * để hàm thuần khiết/test được — nơi gọi tự truyền `unit` từ `useUnitsSettings()`). */
  unit?: UnitId;
  /** Số chữ số thập phân — mặc định theo đơn vị (mm/cm/in nguyên vì thợ đo mm không cần lẻ · m: 2). */
  precision?: number;
  /** Có kèm hậu tố đơn vị (mm/cm/m/") không — feet-inch LUÔN có ′/″, không tắt được. */
  withUnitLabel?: boolean;
}

/** formatLength — mm (nguồn lưu trữ) → chuỗi hiển thị theo đơn vị người dùng chọn. */
export function formatLength(mm: number, opts: FormatLengthOpts = {}): string {
  if (!Number.isFinite(mm)) return '—';
  const unit = opts.unit ?? 'mm';
  if (unit === 'ft-in') return formatFeetInch(mm);

  const factor = MM_PER_UNIT[unit];
  const value = mm / factor;
  const precision = opts.precision ?? (unit === 'm' ? 2 : unit === 'in' ? 2 : 0);
  const rounded = roundTo(value, precision);
  const numStr = groupThousands(precision > 0 ? rounded.toFixed(precision) : String(rounded));
  return opts.withUnitLabel === false ? numStr : `${numStr}${UNIT_SUFFIX[unit]}`;
}

function formatFeetInch(mm: number): string {
  const totalInches = mm / MM_PER_INCH;
  const negative = totalInches < 0;
  const abs = Math.abs(totalInches);
  let feet = Math.floor(abs / 12 + 1e-9);
  let inches = roundTo(abs - feet * 12, 2);
  if (inches >= 12 - 1e-9) {
    // làm tròn tràn (vd 11.999 → 12.00) đẩy lên feet kế, tránh in "5′12.00″" vô nghĩa.
    feet += 1;
    inches = 0;
  }
  const inchStr = Number.isInteger(inches) ? String(inches) : inches.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
  return `${negative ? '-' : ''}${feet}′${inchStr}″`;
}

/**
 * parseLength — chuỗi người gõ → mm. Nhận HẬU TỐ TƯỜNG MINH (mm/cm/m/in/"/′/″/ft) bất kể đơn vị
 * ngầm định; không có hậu tố thì dùng `opts.unit` (đơn vị nhập mặc định của người dùng).
 * Trả `null` nếu không đọc được (KHÔNG throw — để UI tự quyết cách báo lỗi, đúng khuôn ux-copy
 * "nói cái gì sai + cách sửa" thay vì crash).
 */
export function parseLength(input: string, opts: { unit?: UnitId } = {}): number | null {
  // Bỏ khoảng trắng NGĂN CÁCH HÀNG NGHÌN giữa hai chữ số (đúng định dạng `groupThousands` in ra,
  // vd "123 456mm") — để formatLength(...) gõ lại nguyên văn vẫn parse được (round-trip thật).
  const raw = input.trim().replace(/(?<=\d)\s+(?=\d)/g, '');
  if (!raw) return null;

  // feet-inch: 5'6" · 5′6″ · 5ft 6in · 5' (chỉ feet, không inch)
  const hasFootMark = raw.includes("'") || raw.includes('′') || /ft/i.test(raw);
  if (hasFootMark) {
    const ftIn = raw.match(/^(-?\d+(?:[.,]\d+)?)\s*(?:'|′|ft)\s*(\d+(?:[.,]\d+)?)?\s*(?:"|″|in)?\s*$/i);
    if (!ftIn) return null;
    const feet = parseFloat(ftIn[1].replace(',', '.'));
    const inches = ftIn[2] ? parseFloat(ftIn[2].replace(',', '.')) : 0;
    if (!Number.isFinite(feet) || !Number.isFinite(inches)) return null;
    const sign = feet < 0 ? -1 : 1;
    return sign * (Math.abs(feet) * MM_PER_FOOT + inches * MM_PER_INCH);
  }

  // hậu tố tường minh: 320cm · 1.5m · 12in · 12" · 500mm
  const suffixMatch = raw.match(/^(-?\d+(?:[.,]\d+)?)\s*(mm|cm|m|in|"|″)$/i);
  if (suffixMatch) {
    const num = parseFloat(suffixMatch[1].replace(',', '.'));
    if (!Number.isFinite(num)) return null;
    const suf = suffixMatch[2].toLowerCase();
    const unit: FlatUnit = suf === '"' || suf === '″' ? 'in' : (suf as FlatUnit);
    return num * MM_PER_UNIT[unit];
  }

  // số trần — dùng đơn vị NHẬP ngầm định
  const bare = raw.replace(',', '.');
  if (!/^-?\d+(\.\d+)?$/.test(bare)) return null;
  const num = parseFloat(bare);
  if (!Number.isFinite(num)) return null;
  const unit = opts.unit ?? 'mm';
  if (unit === 'ft-in') return num * MM_PER_INCH; // ft-in mặc định: số trần hiểu là inch nguyên
  return num * MM_PER_UNIT[unit];
}
