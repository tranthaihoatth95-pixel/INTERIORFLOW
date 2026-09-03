/**
 * lib/present-editor/boq-appendix.ts — PHỤ LỤC BOQ TRONG HỒ SƠ TRÌNH BÀY (02/09, slice
 * "Present + BOQ + voice"): dựng BẢNG KHỐI LƯỢNG thành TRANG của deck từ đúng nguồn mà màn BOQ
 * đang dùng — `computeBoq` (Doc 2D + Kho giá) → `applyBoqOverrides` (sửa tay) → `groupBoqRows`
 * (tầng/phòng). Đây là mắt xích CUỐI của "một nguồn": trước 02/09 Story Set chương ⑧ chỉ là ô
 * placeholder "Thả bảng BOQ vào đây" (`story-set.ts`) và KHÔNG có đường nào đưa dòng BOQ vào slide.
 *
 * QUYẾT ĐỊNH THIẾT KẾ (ghi để phiên sau không mở lại):
 *  · Trang dựng bằng element TEXT + SHAPE thường của model (không đẻ ElementKind 'table'): sửa
 *    tay từng ô ngay trong editor; PDF/PNG/trình chiếu đi NGUYÊN đường `render.ts`/`PlayerElements`
 *    — không viết renderer thứ hai [T2]. Toạ độ theo % sân khấu nên đúng ở mọi khổ (16:9 · A4 ·
 *    A3, ngang/dọc); số dòng/trang tự tính theo hướng khổ.
 *  · ⚠️ PPTX: `export.ts#toContentSlide` chỉ map 3 vai kicker/title/body thành 3 khối chữ — một
 *    BẢNG đi đường đó sẽ MẤT HẾT dòng (chỉ còn tiêu đề + chân trang). Vì thế mọi chữ trên trang
 *    (trừ kicker) mang role 'free' ⇒ trang phụ lục xuất PPTX dạng ẢNH y bố cục (cùng cách bản vẽ
 *    CAD vào deck). Bảng PPTX NATIVE (pptxgenjs `addTable`, chữ sửa được) cần thêm kind ở
 *    `lib/pptx.ts` — ngoài vùng slice này, ghi nhận là việc kế tiếp, KHÔNG hứa suông ở nhãn menu.
 *  · MỖI DÒNG MANG NHÃN NGUỒN nhìn thấy được: "Bản vẽ" (máy đo từ Doc) ↔ "Sửa tay ✎" (override,
 *    kèm SỐ MÁY trong ngoặc) — số suy/sửa KHÔNG BAO GIỜ đội lốt số đo (luật 15/08 "BOQ chỉ nhận
 *    số đo được, người sửa tay sửa sau"). Lỗi engine (thiếu giá/thiếu mã…) in thành khối "Chưa
 *    đủ nguồn" trên trang cuối + đếm ở kicker — không giấu.
 *  · Không hardcode thương hiệu: màu lấy từ `paletteRoles(deck.palette)` (= Brand Kit đã seed vào
 *    deck), font không đặt (theo `deck.fonts`). Chỉ có chữ nghiệp vụ VI/EN.
 *  · Meta `EditorSlide.boqAppendix` ghi vân tay Doc lúc dựng → báo cũ + "Làm mới" thay ĐÚNG cụm
 *    trang (một lượt undo), xem `replaceBoqAppendixSlides`.
 *
 * THUẦN — không React/DOM/fetch/IDB, import tương đối (test bằng sucrase-node như story-set).
 */
import type { EditorDeck, EditorSlide, SlideElement, BoqAppendixMeta } from './model';
import type { StagePresetId } from './stage-presets';
import { makeText, makeShape, newId } from './model';
import { paletteRoles } from './theme-roles';
import { stageFor, isLandscape } from './stage-presets';
import type { BoqError } from '../boq/model';
import type { BoqDisplayRow } from './boq-overrides';
import type { BoqGroup, BoqGroupMode } from './boq-group';

export type AppendixLang = 'vi' | 'en';

export interface BoqAppendixInput {
  /** dòng ĐÃ áp override (`applyBoqOverrides`) — nguồn duy nhất của số trên trang. */
  rows: BoqDisplayRow[];
  errors: BoqError[];
  /** nhóm theo tầng/phòng (`groupBoqRows`) — bỏ trống = bảng phẳng, không dòng nhóm. */
  groups?: BoqGroup<BoqDisplayRow>[];
  groupMode?: BoqGroupMode;
  projectId: string;
  /** vân tay ĐẦY ĐỦ của Doc (`boqFingerprint`) — hàm tự rút gọn khi ghi vào meta. */
  fingerprint: string;
  generatedAt: number;
  lang: AppendixLang;
  /** palette deck (đã seed Brand Kit) — bỏ trống = fallback quiet-luxury của theme-roles. */
  palette?: string[];
  stagePreset?: StagePresetId | string | null;
  /** tên dự án in ở tiêu đề — bỏ trống = tiêu đề chung. */
  projectName?: string;
}

export const BOQ_APPENDIX_TEMPLATE_ID = 'boq-appendix';

/** Vân tay ngắn (djb2 hex) — meta không ôm cả chuỗi entity dài hàng KB vào `.idfp`. Cùng đầu vào →
 * cùng kết quả, đủ để so "bản vẽ đổi từ lúc dựng". Không phải hash mật mã, không cần. */
export function shortBoqFingerprint(full: string): string {
  let h = 5381;
  for (let i = 0; i < full.length; i++) h = ((h * 33) ^ full.charCodeAt(i)) >>> 0;
  return `${h.toString(16).padStart(8, '0')}:${full.length.toString(36)}`;
}

/** Nhãn nguồn của 1 dòng — 'measured' = mọi ô theo máy đo từ Doc; 'hand-edited' = có ô sửa tay. */
export type BoqRowGrade = 'measured' | 'hand-edited';
export function rowGrade(row: BoqDisplayRow): BoqRowGrade {
  return row.m2Override || row.donGiaOverride ? 'hand-edited' : 'measured';
}

/* ------------------------------------------------------------------ */
/* Định dạng số — khớp BoqTable.tsx (2 số lẻ m², số nguyên cái, ₫ cách nghìn bằng khoảng trắng). */
/* ------------------------------------------------------------------ */
export function fmtVnd(n: number): string {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}
export function fmtQty(row: { kind?: 'area' | 'count' }, n: number): string {
  return row.kind === 'count' && Number.isInteger(n) ? String(n) : n.toFixed(2);
}
function unitLabel(unit: string, lang: AppendixLang): string {
  if (unit === 'm2') return 'm²';
  if (unit === 'cai') return lang === 'vi' ? 'cái' : 'pc';
  if (unit === 'bo') return lang === 'vi' ? 'bộ' : 'set';
  return unit;
}

/* ------------------------------------------------------------------ */
/* Bố cục — % sân khấu. Cột cộng đúng 90 (lề 5/95).                    */
/* ------------------------------------------------------------------ */
interface Col { key: string; w: number; align: 'left' | 'right' | 'center'; label: [string, string] }
const COLS: Col[] = [
  { key: 'no', w: 3, align: 'right', label: ['#', '#'] },
  { key: 'code', w: 10, align: 'left', label: ['Mã', 'Code'] },
  { key: 'name', w: 25, align: 'left', label: ['Hạng mục', 'Item'] },
  { key: 'unit', w: 5, align: 'center', label: ['ĐVT', 'Unit'] },
  { key: 'qty', w: 12, align: 'right', label: ['Khối lượng', 'Qty'] },
  { key: 'price', w: 12, align: 'right', label: ['Đơn giá ₫', 'Unit price ₫'] },
  { key: 'amount', w: 14, align: 'right', label: ['Thành tiền ₫', 'Amount ₫'] },
  { key: 'src', w: 9, align: 'center', label: ['Nguồn số', 'Source'] },
];
const LEFT = 5;
const WIDTH = 90;
const HEADER_Y = 19;
const HEADER_H = 4.2;
const FOOTER_Y = 90.5;

interface Layout {
  rowH: number;
  bodyFont: number;
  rowsPerPage: number;
  bodyTop: number;
  bodyBottom: number;
}
function layoutFor(stagePreset: BoqAppendixInput['stagePreset']): Layout {
  const land = isLandscape(stageFor(stagePreset));
  // Khổ dọc cao hơn ⇒ 1% chiều cao là nhiều px hơn ⇒ dòng mảnh hơn theo %, chữ nhỏ hơn theo %.
  const rowH = land ? 3.3 : 2.35;
  const bodyFont = land ? 1.45 : 1.0;
  const bodyTop = HEADER_Y + HEADER_H + 0.6;
  const bodyBottom = FOOTER_Y - 6.5; // chừa khối "Chưa đủ nguồn"/tổng ở trang cuối
  return { rowH, bodyFont, rowsPerPage: Math.max(4, Math.floor((bodyBottom - bodyTop) / rowH)), bodyTop, bodyBottom };
}

/** Một "dòng in" — hạng mục · đầu nhóm · tổng nhóm · tổng cộng. */
type Line =
  | { t: 'row'; row: BoqDisplayRow; no: number }
  | { t: 'group'; label: string; inferred: boolean }
  | { t: 'subtotal'; label: string; amount: number }
  | { t: 'total'; amount: number };

function flatten(input: BoqAppendixInput): Line[] {
  const L = (vi: string, en: string) => (input.lang === 'vi' ? vi : en);
  const lines: Line[] = [];
  let no = 0;
  if (input.groups && input.groups.length) {
    for (const g of input.groups) {
      lines.push({ t: 'group', label: g.label, inferred: g.inferred });
      for (const row of g.rows) lines.push({ t: 'row', row, no: ++no });
      lines.push({ t: 'subtotal', label: `${L('Cộng', 'Subtotal')} · ${g.label}`, amount: g.rows.reduce((s, r) => s + r.thanhTien, 0) });
    }
  } else {
    for (const row of input.rows) lines.push({ t: 'row', row, no: ++no });
  }
  lines.push({ t: 'total', amount: input.rows.reduce((s, r) => s + r.thanhTien, 0) });
  return lines;
}

/** Chia dòng in thành trang — tất định. Dòng "group" không bao giờ đứng cuối trang (kéo sang trang sau). */
export function paginateLines(lines: Line[], perPage: number): Line[][] {
  const pages: Line[][] = [];
  let cur: Line[] = [];
  for (const ln of lines) {
    if (cur.length >= perPage) {
      // đầu nhóm mồ côi cuối trang → đẩy sang trang mới
      const last = cur[cur.length - 1];
      if (last && last.t === 'group') { cur.pop(); pages.push(cur); cur = [last]; } else { pages.push(cur); cur = []; }
    }
    cur.push(ln);
  }
  if (cur.length) pages.push(cur);
  return pages.length ? pages : [[]];
}

/* ------------------------------------------------------------------ */
/* Dựng trang                                                          */
/* ------------------------------------------------------------------ */
type Roles = ReturnType<typeof paletteRoles>;

function cellX(colIdx: number): { x: number; w: number } {
  let x = LEFT;
  for (let i = 0; i < colIdx; i++) x += COLS[i].w;
  return { x, w: COLS[colIdx].w };
}

function cellText(colIdx: number, y: number, h: number, text: string, opts: {
  size: number; color: string; bold?: boolean; italic?: boolean; opacity?: number; name?: string; align?: Col['align'];
}): SlideElement {
  const { x, w } = cellX(colIdx);
  const pad = 0.35;
  return makeText({
    text,
    role: 'free',
    frame: { x: x + pad, y, w: w - pad * 2, h, rotation: 0 },
    fontSize: opts.size,
    color: opts.color,
    align: opts.align ?? COLS[colIdx].align,
    bold: !!opts.bold,
    italic: !!opts.italic,
    lineHeight: 1.15,
    opacity: opts.opacity,
    name: opts.name,
  });
}

/** Chữ trải qua NHIỀU cột (đầu nhóm) — tránh nhãn dài gãy dòng đè lên dòng sau. */
function spanText(fromCol: number, toCol: number, y: number, h: number, text: string, opts: {
  size: number; color: string; bold?: boolean; opacity?: number; name?: string; align?: Col['align'];
}): SlideElement {
  const a = cellX(fromCol);
  const b = cellX(toCol);
  const pad = 0.35;
  return makeText({
    text,
    role: 'free',
    frame: { x: a.x + pad, y, w: b.x + b.w - a.x - pad * 2, h, rotation: 0 },
    fontSize: opts.size,
    color: opts.color,
    align: opts.align ?? 'left',
    bold: !!opts.bold,
    italic: false,
    lineHeight: 1.15,
    opacity: opts.opacity,
    name: opts.name,
  });
}

function band(y: number, h: number, fill: string, opacity: number, name: string): SlideElement {
  return makeShape('rect', {
    frame: { x: LEFT, y, w: WIDTH, h, rotation: 0 },
    fill,
    stroke: 'transparent',
    strokeWidth: 0,
    radius: 0,
    opacity,
    name,
  });
}

function buildPage(
  input: BoqAppendixInput,
  page: Line[],
  pageNo: number,
  pageCount: number,
  c: Roles,
  lay: Layout,
  meta: Omit<BoqAppendixMeta, 'page' | 'pages'>,
): EditorSlide {
  const L = (vi: string, en: string) => (input.lang === 'vi' ? vi : en);
  const els: SlideElement[] = [];
  const isLast = pageNo === pageCount;

  // Kicker + tiêu đề + số trang
  const errNote = input.errors.length ? ` · ${input.errors.length} ${L('mục chưa đủ nguồn', 'items missing a source')}` : '';
  els.push(makeText({
    text: `${L('PHỤ LỤC · BẢNG KHỐI LƯỢNG', 'APPENDIX · BILL OF QUANTITIES')}${errNote}`.toUpperCase(),
    role: 'kicker', frame: { x: LEFT, y: 5.5, w: 66, h: 3.6, rotation: 0 },
    fontSize: 1.6, color: c.accent, bold: true, tracking: 0.5, name: 'BOQ · kicker',
  }));
  els.push(makeText({
    text: `${L('TRANG', 'PAGE')} ${pageNo}/${pageCount}`,
    role: 'kicker', frame: { x: 71, y: 5.5, w: 24, h: 3.6, rotation: 0 },
    fontSize: 1.6, color: c.dark, bold: true, tracking: 0.4, align: 'right', opacity: 0.7, name: 'BOQ · trang',
  }));
  els.push(makeText({
    text: (input.projectName || '').trim() || L('Khối lượng & nguồn giá', 'Quantities & price sources'),
    role: 'free', frame: { x: LEFT, y: 9.5, w: 90, h: 8, rotation: 0 },
    fontSize: 3.6, color: c.dark, name: 'BOQ · tiêu đề',
  }));

  // Đầu bảng
  els.push(band(HEADER_Y, HEADER_H, c.dark, 1, 'BOQ · đầu bảng'));
  COLS.forEach((col, i) => {
    els.push(cellText(i, HEADER_Y + 0.9, HEADER_H - 1.2, input.lang === 'vi' ? col.label[0] : col.label[1], {
      size: lay.bodyFont * 0.92, color: c.light, bold: true, name: `BOQ · cột ${col.key}`,
    }));
  });

  // Thân bảng
  let y = lay.bodyTop;
  let zebra = 0;
  for (const ln of page) {
    const h = lay.rowH;
    const textY = y + (h - lay.bodyFont * 1.35) / 2;
    const textH = lay.bodyFont * 1.5;
    if (ln.t === 'group') {
      els.push(band(y, h, c.muted, 0.35, 'BOQ · nhóm'));
      const inferred = ln.inferred ? ` · ${L('suy đoán theo vị trí', 'inferred from position')}` : '';
      els.push(spanText(1, 7, textY, textH, `${ln.label}${inferred}`.toUpperCase(), {
        size: lay.bodyFont * 0.95, color: c.dark, bold: true, name: 'BOQ · tên nhóm', align: 'left',
      }));
      zebra = 0;
    } else if (ln.t === 'subtotal') {
      els.push(cellText(2, textY, textH, ln.label, { size: lay.bodyFont, color: c.dark, italic: true, opacity: 0.85, name: 'BOQ · cộng nhóm', align: 'right' }));
      els.push(cellText(6, textY, textH, fmtVnd(ln.amount), { size: lay.bodyFont, color: c.dark, bold: true, name: 'BOQ · cộng nhóm ₫' }));
    } else if (ln.t === 'total') {
      els.push(band(y, h, c.dark, 1, 'BOQ · tổng'));
      els.push(cellText(2, textY, textH, L('TỔNG CỘNG', 'GRAND TOTAL'), { size: lay.bodyFont, color: c.light, bold: true, name: 'BOQ · tổng', align: 'right' }));
      els.push(cellText(6, textY, textH, fmtVnd(ln.amount), { size: lay.bodyFont, color: c.light, bold: true, name: 'BOQ · tổng ₫' }));
    } else {
      const r = ln.row;
      if (zebra % 2 === 1) els.push(band(y, h, c.muted, 0.18, `BOQ · nền dòng ${ln.no}`));
      zebra += 1;
      const grade = rowGrade(r);
      const ink = c.dark;
      const qtyTxt = r.m2Override
        ? `${fmtQty(r, r.qty)} ✎ (${fmtQty(r, r.m2Override.machineValue)})`
        : fmtQty(r, r.qty);
      const priceTxt = r.donGiaOverride
        ? `${fmtVnd(r.donGia)} ✎ (${fmtVnd(r.donGiaOverride.machineValue)})`
        : fmtVnd(r.donGia);
      const cells: Array<[number, string, Partial<{ bold: boolean; color: string; opacity: number; shrink: boolean }>]> = [
        [0, String(ln.no), {}],
        [1, r.ma || '—', {}],
        // Tên rất dài (>32 ký tự) co chữ 1 nấc thay vì gãy dòng đè lên dòng dưới (khổ dọc cột hẹp hơn).
        [2, r.ten, r.ten.length > 32 ? { shrink: true } : {}],
        [3, unitLabel(r.unit, input.lang), {}],
        [4, qtyTxt, r.m2Override ? { color: c.accent, bold: true, shrink: true } : {}],
        [5, priceTxt, r.donGiaOverride ? { color: c.accent, bold: true, shrink: true } : {}],
        [6, fmtVnd(r.thanhTien), { bold: true }],
        [7, grade === 'measured' ? L('Bản vẽ', 'Drawing') : L('Sửa tay ✎', 'Edited ✎'),
          grade === 'measured' ? { opacity: 0.75 } : { color: c.accent, bold: true }],
      ];
      for (const [ci, txt, extra] of cells) {
        els.push(cellText(ci, textY, textH, txt, {
          size: extra.shrink ? lay.bodyFont * 0.86 : lay.bodyFont, color: extra.color ?? ink, bold: extra.bold, opacity: extra.opacity,
          name: `BOQ · d${ln.no} · ${COLS[ci].key}`,
        }));
      }
    }
    y += h;
  }

  // Khối "Chưa đủ nguồn" — trang cuối, không giấu lỗi engine.
  if (isLast && input.errors.length) {
    const top = Math.min(y + 0.8, lay.bodyBottom + 0.2);
    const shown = input.errors.slice(0, 4);
    const more = input.errors.length - shown.length;
    const body = shown.map((e) => `• ${e.message}`).concat(more > 0 ? [`• … ${L(`và ${more} mục khác — xem Bảng tính BOQ`, `and ${more} more — see the BOQ sheet`)}`] : []).join('\n');
    els.push(makeText({
      text: `${L('CHƯA ĐỦ NGUỒN — số dưới đây KHÔNG có trong tổng', 'MISSING SOURCE — items below are NOT in the total')}\n${body}`,
      role: 'free', frame: { x: LEFT, y: top, w: WIDTH, h: Math.max(4, FOOTER_Y - top - 0.6), rotation: 0 },
      fontSize: lay.bodyFont * 0.85, color: c.dark, lineHeight: 1.35, opacity: 0.9, name: 'BOQ · chưa đủ nguồn',
    }));
  }

  // Chân trang — nguồn số + vân tay + thời điểm. Người đọc bản in vẫn truy được về đâu.
  const when = new Date(input.generatedAt);
  const stamp = Number.isFinite(when.getTime()) ? when.toISOString().slice(0, 16).replace('T', ' ') : '';
  const legend = L(
    `Nguồn số: đo từ bản vẽ 2D của dự án + Kho giá vật liệu · ${meta.rowCount - meta.handEdited} dòng theo máy · ${meta.handEdited} dòng sửa tay (✎, số máy trong ngoặc)`,
    `Sources: measured from the project's 2D drawing + material price library · ${meta.rowCount - meta.handEdited} machine rows · ${meta.handEdited} hand-edited rows (✎, machine value in brackets)`,
  );
  els.push(makeText({
    text: `${legend}\n${L('Vân tay bản vẽ', 'Drawing fingerprint')} ${meta.fingerprint} · ${L('dựng lúc', 'built')} ${stamp} UTC`,
    role: 'free', frame: { x: LEFT, y: FOOTER_Y, w: WIDTH, h: 6, rotation: 0 },
    fontSize: lay.bodyFont * 0.78, color: c.dark, lineHeight: 1.35, opacity: 0.65, name: 'BOQ · chân trang',
  }));

  return {
    id: newId('sld'),
    background: c.light,
    elements: els,
    templateId: BOQ_APPENDIX_TEMPLATE_ID,
    boqAppendix: { ...meta, page: pageNo, pages: pageCount },
  };
}

/**
 * Dựng TRỌN cụm trang phụ lục (≥1 trang). Tất định với cùng input (trừ `id` element — `newId`).
 * Không có dòng nào vẫn ra 1 trang: bảng trống + khối lỗi (nếu có) — người xem biết là CHƯA có
 * dữ liệu, không phải "trang mất".
 */
export function buildBoqAppendixSlides(input: BoqAppendixInput): EditorSlide[] {
  const c = paletteRoles(input.palette);
  const lay = layoutFor(input.stagePreset);
  const lines = flatten(input);
  const pages = paginateLines(lines, lay.rowsPerPage);
  let handEdited = 0;
  for (const r of input.rows) if (rowGrade(r) === 'hand-edited') handEdited += 1;
  const meta: Omit<BoqAppendixMeta, 'page' | 'pages'> = {
    projectId: input.projectId,
    fingerprint: shortBoqFingerprint(input.fingerprint),
    generatedAt: input.generatedAt,
    rowCount: input.rows.length,
    handEdited,
    errorCount: input.errors.length,
    groupMode: input.groupMode,
    lang: input.lang,
  };
  return pages.map((p, i) => buildPage(input, p, i + 1, pages.length, c, lay, meta));
}

/* ------------------------------------------------------------------ */
/* Cụm trang trong deck — tìm · thay · báo cũ                           */
/* ------------------------------------------------------------------ */

/** Chỉ số các slide phụ lục của dự án `projectId` (theo thứ tự trong deck). */
export function findBoqAppendixSlides(deck: Pick<EditorDeck, 'slides'>, projectId: string): number[] {
  const out: number[] = [];
  deck.slides.forEach((s, i) => { if (s.boqAppendix && s.boqAppendix.projectId === projectId) out.push(i); });
  return out;
}

/**
 * Vị trí chèn khi deck CHƯA có phụ lục: ngay SAU trang Story Set "story-appendix" (nơi đang có ô
 * placeholder BOQ) nếu có, không thì sau trang đang đứng (`afterIndex`), không thì cuối deck.
 */
export function boqAppendixInsertIndex(deck: Pick<EditorDeck, 'slides'>, afterIndex: number | null | undefined): number {
  const story = deck.slides.findIndex((s) => s.templateId === 'story-appendix');
  if (story >= 0) return story + 1;
  if (typeof afterIndex === 'number' && afterIndex >= 0 && afterIndex < deck.slides.length) return afterIndex + 1;
  return deck.slides.length;
}

/**
 * MUTATE deck: gỡ mọi slide phụ lục cũ của cùng dự án, chèn cụm mới vào chỗ cụm cũ (hoặc chỗ
 * `boqAppendixInsertIndex` khi chưa có). Gọi trong MỘT `ed.update` ⇒ một lượt undo trả lại y
 * nguyên. Trả chỉ số slide đầu của cụm mới để editor nhảy tới.
 */
export function replaceBoqAppendixSlides(deck: EditorDeck, slides: EditorSlide[], projectId: string, afterIndex?: number | null): number {
  const old = findBoqAppendixSlides(deck, projectId);
  let at: number;
  if (old.length) {
    at = old[0];
    for (let i = old.length - 1; i >= 0; i--) deck.slides.splice(old[i], 1);
  } else {
    at = boqAppendixInsertIndex(deck, afterIndex);
  }
  deck.slides.splice(at, 0, ...slides);
  return at;
}

/** true = Doc SỐNG đã khác Doc lúc dựng (so vân tay ngắn). `null` = không biết (không có Doc sống). */
export function isBoqAppendixStale(meta: BoqAppendixMeta, liveFullFingerprint: string | null): boolean | null {
  if (liveFullFingerprint === null) return null;
  return shortBoqFingerprint(liveFullFingerprint) !== meta.fingerprint;
}

/** Một câu tóm tắt meta cho Inspector/navigator — VI/EN. */
export function describeBoqAppendix(meta: BoqAppendixMeta, lang: AppendixLang): string {
  const L = (vi: string, en: string) => (lang === 'vi' ? vi : en);
  const machine = meta.rowCount - meta.handEdited;
  return `${L('Phụ lục BOQ', 'BOQ appendix')} · ${L('trang', 'page')} ${meta.page}/${meta.pages} · ${meta.rowCount} ${L('dòng', 'rows')} (${machine} ${L('theo máy', 'machine')} · ${meta.handEdited} ${L('sửa tay', 'hand-edited')})${meta.errorCount ? ` · ${meta.errorCount} ${L('chưa đủ nguồn', 'missing source')}` : ''}`;
}
