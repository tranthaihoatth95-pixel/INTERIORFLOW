/**
 * lib/materials/warehouse/column-mapping.ts — ghép cột tay (VIỆC 4): đoán mapping ban đầu từ
 * tên tiêu đề cột, để người dùng CHỈNH TAY, rồi NHỚ lại theo chữ ký hàng tiêu đề (không cần đặt
 * tên nhà cung cấp) — lần sau nhập đúng file cùng NCC (tiêu đề y hệt) thì tự điền lại.
 */

export const MATERIAL_FIELDS = [
  'name', 'sku', 'brand', 'unit', 'priceVnd', 'w', 'd', 'hUp', 'note',
] as const;
export type MaterialField = (typeof MATERIAL_FIELDS)[number];

export const MATERIAL_FIELD_LABEL: Record<MaterialField, { vi: string; en: string; required?: boolean }> = {
  name: { vi: 'Tên', en: 'Name', required: true },
  sku: { vi: 'Mã (SKU)', en: 'SKU' },
  brand: { vi: 'Hãng', en: 'Brand' },
  unit: { vi: 'Đơn vị', en: 'Unit' },
  priceVnd: { vi: 'Giá', en: 'Price' },
  w: { vi: 'Rộng (mm)', en: 'Width (mm)' },
  d: { vi: 'Sâu (mm)', en: 'Depth (mm)' },
  hUp: { vi: 'Cao (mm)', en: 'Height (mm)' },
  note: { vi: 'Ghi chú', en: 'Note' },
};

/** cột nguồn → field đích. `null` = cột đó không map vào đâu (bỏ qua khi nhập). */
export type ColumnMapping = Record<MaterialField, number | null>;

const EMPTY_MAPPING: ColumnMapping = { name: null, sku: null, brand: null, unit: null, priceVnd: null, w: null, d: null, hUp: null, note: null };

/** Từ khoá đoán cột theo tên tiêu đề (chuẩn hoá: bỏ dấu, thường hoá) — VN + EN, đúng thói quen
 * bảng giá thật của NCC VN (thường xen tiếng Anh). Thứ tự trong mảng = ưu tiên khi nhiều cột
 * cùng khớp — nhưng thực tế mỗi field chỉ gán CỘT ĐẦU TIÊN khớp (xem `guessMapping`). */
const KEYWORDS: Record<MaterialField, string[]> = {
  name: ['ten san pham', 'ten hang', 'product name', 'ten', 'name', 'item', 'description', 'mo ta'],
  sku: ['ma sp', 'ma san pham', 'sku', 'ma hang', 'ma', 'code', 'item code', 'part no', 'part number'],
  brand: ['hang', 'thuong hieu', 'brand', 'nha san xuat', 'manufacturer'],
  unit: ['dvt', 'don vi tinh', 'don vi', 'unit', 'uom'],
  priceVnd: ['gia', 'don gia', 'price', 'unit price', 'gia tham khao', 'gia ban'],
  w: ['rong', 'w', 'width', 'ngang'],
  d: ['sau', 'd', 'depth', 'dai', 'length', 'dai mm'],
  hUp: ['cao', 'h', 'height', 'chieu cao'],
  note: ['ghi chu', 'note', 'remark'],
};

const COMBINING_DIACRITICS = /[̀-ͯ]/g;

function normalizeHeader(h: string): string {
  return h
    .normalize('NFD')
    .replace(COMBINING_DIACRITICS, '') // bỏ dấu tiếng Việt (combining marks sau NFD)
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

/** Đoán mapping ban đầu từ tiêu đề cột — khớp CHÍNH XÁC chuỗi chuẩn hoá trước, rồi mới khớp
 * "chứa" (contains) để không vồ nhầm cột dài chứa từ khoá ngắn của field khác (vd "đơn vị" vs
 * "đơn giá" đều chứa "đơn" — so khớp cả cụm tránh lẫn). */
export function guessMapping(headers: string[]): ColumnMapping {
  const norm = headers.map(normalizeHeader);
  const out: ColumnMapping = { ...EMPTY_MAPPING };
  const used = new Set<number>();
  for (const field of MATERIAL_FIELDS) {
    const kws = KEYWORDS[field];
    // vòng 1: khớp đúng nguyên cụm
    let idx = norm.findIndex((h, i) => !used.has(i) && kws.includes(h));
    // vòng 2: khớp chứa (dài nhất trước — ưu tiên từ khoá đặc hiệu hơn "ten"/"ma" trơn)
    if (idx < 0) {
      const sortedKws = [...kws].sort((a, b) => b.length - a.length);
      idx = norm.findIndex((h, i) => !used.has(i) && sortedKws.some((k) => h.includes(k)));
    }
    if (idx >= 0) {
      out[field] = idx;
      used.add(idx);
    }
  }
  return out;
}

const STORAGE_PREFIX = 'if-materials-import-mapping:';

/** Chữ ký hàng tiêu đề — cùng 1 NCC xuất file lần sau gần như chắc chắn CÙNG tiêu đề, đủ làm
 * khoá nhớ mapping mà không cần hỏi tên NCC. */
export function headerSignature(headers: string[]): string {
  return headers.map(normalizeHeader).join('|');
}

export function loadSavedMapping(headers: string[]): ColumnMapping | null {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + headerSignature(headers));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ColumnMapping>;
    return { ...EMPTY_MAPPING, ...parsed };
  } catch {
    return null;
  }
}

export function saveMapping(headers: string[], mapping: ColumnMapping): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + headerSignature(headers), JSON.stringify(mapping));
  } catch {
    /* private mode / quota — tiện nghi, không chặn import nếu lưu lỗi */
  }
}

export function emptyMapping(): ColumnMapping {
  return { ...EMPTY_MAPPING };
}
