/**
 * lib/colors/build.ts — phần THUẦN của tầng màu: ghép cột → `ColorSource`.
 *
 * Tách khỏi `user-csv.ts` CỐ Ý: `user-csv.ts` kéo theo `xlsx` (SheetJS) để đọc tệp, mà đường
 * Larkbase (`larkbase.ts` + route server) KHÔNG cần SheetJS — hai cửa nạp khác nhau nhưng phải
 * đi CHUNG một bộ kiểm tra/chuẩn hoá/báo lỗi dòng, nếu không sẽ có hai luật "hex thế nào là hợp
 * lệ" lệch nhau. File này là bộ chung đó. Không DOM, không React, không dep nặng.
 */

import { hexToRgb, rgbToHex, rgbToLab } from '../gu/color-psychology';
import type { ColorEntry, ColorSource, ColorSourceOrigin, ColorSourceScope } from './types';

export interface ParsedGrid {
  headers: string[];
  rows: string[][];
}

/* ═══════════════════════ CỘT ═══════════════════════ */

export const COLOR_FIELDS = ['name', 'code', 'hex', 'brand', 'note'] as const;
export type ColorField = (typeof COLOR_FIELDS)[number];

export const COLOR_FIELD_LABEL: Record<ColorField, { vi: string; en: string; required?: boolean }> = {
  name: { vi: 'Tên màu', en: 'Colour name' },
  code: { vi: 'Mã màu', en: 'Colour code' },
  hex: { vi: 'Mã hex', en: 'Hex', required: true },
  brand: { vi: 'Hãng', en: 'Brand' },
  note: { vi: 'Ghi chú', en: 'Note' },
};

/** cột nguồn → field đích. `null` = cột đó không map vào đâu. */
export type ColorColumnMapping = Record<ColorField, number | null>;

export const EMPTY_COLOR_MAPPING: ColorColumnMapping = { name: null, code: null, hex: null, brand: null, note: null };

const KEYWORDS: Record<ColorField, string[]> = {
  name: ['ten mau', 'ten son', 'colour name', 'color name', 'ten', 'name', 'mau', 'colour', 'color'],
  code: ['ma mau', 'ma son', 'colour code', 'color code', 'ma', 'code', 'sku', 'ref', 'so hieu'],
  hex: ['hex', 'ma hex', 'hex code', 'rgb hex', 'html', 'hexa'],
  brand: ['hang', 'thuong hieu', 'brand', 'nha san xuat', 'manufacturer', 'hang son'],
  note: ['ghi chu', 'note', 'remark', 'mo ta', 'description'],
};

const COMBINING_DIACRITICS = /[̀-ͯ]/g;

function normalizeHeader(h: string): string {
  return (h || '')
    .normalize('NFD')
    .replace(COMBINING_DIACRITICS, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/**
 * Đoán mapping từ dòng tiêu đề. Mỗi field lấy CỘT ĐẦU TIÊN khớp và một cột chỉ gán cho MỘT field
 * (khớp nguyên văn ưu tiên hơn khớp chứa — nếu không, tiêu đề "Mã màu" dễ bị `code` ăn trước
 * `name` chỉ vì từ khoá ngắn "ma" nằm trong nó).
 */
export function guessColorMapping(headers: string[]): ColorColumnMapping {
  const norm = headers.map(normalizeHeader);
  const used = new Set<number>();
  const out: ColorColumnMapping = { ...EMPTY_COLOR_MAPPING };

  const claim = (field: ColorField, exact: boolean) => {
    if (out[field] !== null) return;
    for (const kw of KEYWORDS[field]) {
      for (let i = 0; i < norm.length; i++) {
        if (used.has(i) || !norm[i]) continue;
        const hit = exact ? norm[i] === kw : norm[i].includes(kw);
        if (hit) { out[field] = i; used.add(i); return; }
      }
    }
  };
  // Vòng 1 khớp NGUYÊN VĂN cho cả 5 field, vòng 2 mới nới ra khớp-chứa.
  for (const f of COLOR_FIELDS) claim(f, true);
  for (const f of COLOR_FIELDS) claim(f, false);
  return out;
}

/** Chữ ký hàng tiêu đề — nhớ mapping theo bảng giá của cùng NCC mà không cần đặt tên. */
export function headerSignature(headers: string[]): string {
  return headers.map(normalizeHeader).join('|');
}

/* ═══════════════════════ LƯỚI → ColorSource ═══════════════════════ */

export interface ColorRowError {
  /** Số dòng NGƯỜI DÙNG thấy trong Excel (1 = tiêu đề) — không phải index mảng. */
  row: number;
  reason: string;
}

export interface BuildColorSourceResult {
  source: ColorSource;
  errors: ColorRowError[];
}

export interface BuildColorSourceInput extends ParsedGrid {
  mapping: ColorColumnMapping;
  id: string;
  name: string;
  origin: ColorSourceOrigin;
  scope: ColorSourceScope;
  projectId?: string;
  licenseNote?: string;
  /** Tiêm được để test tất định (không gọi Date.now() trong hàm thuần). */
  now?: number;
}

/**
 * Chuẩn hoá hex: nhận `#a1b2c3` · `a1b2c3` · `#abc` · `ABC`; trả `#a1b2c3` thường hoá.
 * `null` nếu không đọc được. (Không tự đoán `rgb(…)`/tên màu CSS — đoán sai một mã sơn là sai
 * đơn hàng thật; thà báo dòng lỗi rõ để người dùng sửa tệp nguồn.)
 */
export function normalizeHex(raw: string): string | null {
  const rgb = hexToRgb((raw || '').trim());
  return rgb ? rgbToHex(rgb).toLowerCase() : null;
}

export function buildColorSource(input: BuildColorSourceInput): BuildColorSourceResult {
  const { rows, mapping } = input;
  const errors: ColorRowError[] = [];
  const colors: ColorEntry[] = [];
  const at = (r: string[], f: ColorField): string => {
    const i = mapping[f];
    return i === null || i === undefined ? '' : (r[i] ?? '').trim();
  };

  rows.forEach((r, idx) => {
    const rowNo = idx + 2; // +1 bỏ index-0, +1 vì dòng 1 là tiêu đề
    const hexRaw = at(r, 'hex');
    const name = at(r, 'name');
    const code = at(r, 'code');
    if (!hexRaw && !name && !code) return; // dòng trống hoàn toàn — bỏ im lặng, không tính là lỗi

    if (!hexRaw) { errors.push({ row: rowNo, reason: 'Thiếu mã hex' }); return; }
    const hex = normalizeHex(hexRaw);
    if (!hex) { errors.push({ row: rowNo, reason: `Mã hex không đọc được: "${hexRaw}"` }); return; }
    if (!name && !code) { errors.push({ row: rowNo, reason: 'Thiếu cả tên màu lẫn mã màu' }); return; }

    const rgb = hexToRgb(hex)!; // đã qua normalizeHex ⇒ chắc chắn hợp lệ
    colors.push({
      code,
      name: name || code, // bảng chỉ có mã thì lấy mã làm tên hiển thị, không để trống
      hex,
      lab: rgbToLab(rgb),
      brand: at(r, 'brand') || undefined,
      note: at(r, 'note') || undefined,
    });
  });

  return {
    source: {
      id: input.id,
      name: input.name,
      colors,
      origin: input.origin,
      scope: input.scope,
      projectId: input.projectId,
      updatedAt: input.now ?? Date.now(),
      licenseNote: input.licenseNote,
    },
    errors,
  };
}
