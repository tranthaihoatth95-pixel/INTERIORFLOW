/**
 * lib/present-editor/table-doc-xlsx.ts — xuất 1 `TableDocEngine` (dòng đã áp override) ra `.xlsx`
 * THẬT. TÁI DÙNG máy dựng OOXML TỔNG QUÁT `buildXlsxBuffer()` (`lib/boq/xlsx.ts` ①, "không biết
 * gì về BOQ" — đúng file đó tự khai) — KHÔNG viết bộ dựng .xlsx lần 2, KHÔNG sửa `lib/boq/xlsx.ts`
 * (ngoài vùng file được sửa của phiếu này, chỉ đọc).
 *
 * File xuất ra là ô chữ/số THƯỜNG (không khoá/không bảo vệ sheet) — người nhận mở Excel sửa được
 * ngay (luật "đích đến phải sửa được", `docs/00-CHOT.md` chốt 07/08 mục 7).
 */
import { buildXlsxBuffer, STYLE, type XlsxRow, type XlsxCell } from '@/lib/boq/xlsx';
import { groupTableRows, type TableColumnDef, type TableDisplayRow } from './table-doc-engine';

function cellFor(col: TableColumnDef, value: string | number | null | undefined, bold = false): XlsxCell {
  if (value === null || value === undefined || value === '') return { t: 'blank' };
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return { t: 'blank' };
    return { t: 'num', v: value, style: bold ? STYLE.BOLD : col.kind === 'currency' ? STYLE.NUM_VND : STYLE.NUM_M2 };
  }
  return { t: 'text', v: String(value), style: bold ? STYLE.BOLD : STYLE.NORMAL };
}

/**
 * Dựng buffer .xlsx — 1 sheet, nhóm theo `groupTableRows` (mỗi nhóm 1 hàng tiêu đề + dòng tổng
 * nếu có cột `summable`). `lang` chọn nhãn cột song ngữ có sẵn ở `TableColumnDef.label`.
 */
export async function tableDocToXlsxBuffer(
  sheetName: string,
  columns: TableColumnDef[],
  rows: TableDisplayRow[],
  lang: 'vi' | 'en' = 'vi',
): Promise<Uint8Array> {
  const li = lang === 'en' ? 1 : 0;
  const header: XlsxRow = { cells: columns.map((c) => ({ t: 'text', v: c.label[li], style: STYLE.BOLD })) };
  const body: XlsxRow[] = [];
  const groups = groupTableRows(rows, columns);

  for (const g of groups) {
    const groupHeadCells: XlsxCell[] = columns.map((c, i) => (i === 0 ? { t: 'text', v: g.label, style: STYLE.BOLD } : { t: 'blank' }));
    body.push({ cells: groupHeadCells });

    for (const row of g.rows) {
      const rowLabel = row.orphaned ? '⚠ ' : '';
      body.push({
        cells: columns.map((c, i) => {
          const raw = row.cells[c.key];
          if (i === 0 && rowLabel && typeof raw === 'string') return cellFor(c, `${rowLabel}${raw}`);
          return cellFor(c, raw);
        }),
      });
    }

    if (Object.keys(g.totals).length > 0) {
      body.push({
        cells: columns.map((c, i) => {
          if (i === 0) return { t: 'text', v: `Tổng ${g.count} · Total ${g.count}`, style: STYLE.BOLD };
          if (g.totals[c.key] !== undefined) return cellFor(c, g.totals[c.key], true);
          return { t: 'blank' };
        }),
      });
    }
  }

  return buildXlsxBuffer({ name: sheetName, colWidths: columns.map(() => 22), rows: [header, ...body] });
}
