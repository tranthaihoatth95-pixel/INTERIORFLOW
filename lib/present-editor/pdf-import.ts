/**
 * lib/present-editor/pdf-import.ts — Smart Convert BẬC 1: ĐỌC file `.pdf` (vector, có text layer
 * thật) THÀNH slide của chặng Trình chiếu (`lib/present-editor/model.ts`).
 *
 * `docs/phieu-giao/smart-convert-pdf.md`: PDF vector chứa SẴN chữ thật (nội dung + toạ độ + cỡ)
 * — moi ra thành text SỐNG là TẤT ĐỊNH, không AI. Đọc bằng `unpdf` (đã có trong package.json,
 * cùng thư viện `lib/notebook/extract.ts` dùng cho brief/notebook — KHÔNG thêm dependency mới).
 *
 * ─────────────────────────────────────────────────────────────────────────────────────────
 * ⚠️ LỆCH SO VỚI PHIẾU GỐC — nói thẳng ngay đầu file, đừng để ai tưởng bở
 * ─────────────────────────────────────────────────────────────────────────────────────────
 * Phiếu gốc mô tả BA lớp: Nền (raster cả trang) · Chữ (text sống) · Ảnh (XObject nhúng lớn).
 * Sau khi đọc kỹ `unpdf` (README + `.d.ts`, xem lịch sử NC lúc làm phiếu này), CHỈ LÀM ĐƯỢC lớp
 * CHỮ trong bậc 1 này — lý do KỸ THUẬT, không phải lười:
 *
 *   1. **Không có lớp NỀN raster.** `unpdf.renderPageAsImage()` là hàm DUY NHẤT có thể "chụp"
 *      cả trang PDF ra PNG — nhưng theo README của chính `unpdf`, hàm này **BẮT BUỘC** gói
 *      `@napi-rs/canvas` để có Canvas ở Node (`renderPageAsImage` ký nhận
 *      `canvasImport: () => import('@napi-rs/canvas')`). Gói này KHÔNG có trong package.json,
 *      KHÔNG có trong `node_modules` (đã kiểm `ls node_modules/@napi-rs` — rỗng), và phiếu ⑤ cấm
 *      "KHÔNG thêm dependency mới". Không có cách nào rasterize cả trang PDF (đường nét vector +
 *      màu) chỉ bằng `unpdf` không kèm canvas backend. ⇒ Slide KHÔNG có element ảnh "Nền gốc" đáy
 *      dưới như phiếu mô tả — nền slide là màu trắng phẳng (`background: '#ffffff'`).
 *   2. **Không có lớp ẢNH (XObject nhúng).** `unpdf.extractImages(pdf, pageNumber)` CÓ trích được
 *      pixel thô của ảnh nhúng, nhưng KHÔNG trả toạ độ/kích thước ĐẶT trên trang (không có ma
 *      trận biến đổi `cm`/transform của khối `Do`) — API chỉ cho biết "trang này có ảnh gì",
 *      không cho biết "ảnh đó nằm ở đâu". Đặt bừa ảnh lên slide (vd full-bleed) là ĐOÁN, không
 *      phải TẤT ĐỊNH — đúng câu phiếu ①.3 cho phép: "không moi được thì bỏ qua (nền đã chứa) —
 *      KHÔNG cố, ghi thật trong báo cáo." ⇒ Đã bỏ, không làm lớp Ảnh ở bậc 1 này.
 *   3. **Hệ quả trực tiếp lên lớp Chữ:** phiếu ①.2 định "mặc định lớp chữ ẨN vì nền raster đã có
 *      chữ sẵn" — giả định đó KHÔNG còn đúng vì không có nền raster nào để nhìn thấy chữ. Nếu vẫn
 *      ẩn lớp Chữ theo đúng câu chữ phiếu, slide sẽ TRẮNG TRƠN, vô dụng. Quyết định: **lớp Chữ
 *      MẶC ĐỊNH HIỆN** — đây là lựa chọn ĐƠN GIẢN NHẤT giữ đúng tinh thần "nhập PDF ra deck nhìn
 *      thấy được, sửa tiếp trong IF" (luật nền §7②) khi tiền đề "đã có nền" không còn.
 *
 * Những phần này (raster nền thật, đặt ảnh đúng vị trí, OCR trang scan) CẦN: (a) gói
 * `@napi-rs/canvas` HOẶC một backend render PDF khác, (b) đọc operator-list của PDF.js (biến đổi
 * `cm`/`Do`) để suy toạ độ ảnh — cả hai NGOÀI PHẠM VI bậc 1 (⑤ cấm dependency mới), để dành bậc 2.
 *
 * ─────────────────────────────────────────────────────────────────────────────────────────
 * CÁCH GOM CHỮ THÀNH KHỐI (SỐNG đúng vị trí/cỡ)
 * ─────────────────────────────────────────────────────────────────────────────────────────
 * `unpdf.extractTextItems()` trả từng "item" (chuỗi cùng font/cỡ liên tục) kèm x,y (gốc DƯỚI-TRÁI
 * trang, đơn vị PDF point), width/height, fontSize, fontFamily (dạng generic CSS: 'sans-serif' /
 * 'serif' / 'monospace' — KHÔNG phải tên font thật, PDF.js không lộ tên font nhúng qua API này),
 * `hasEOL` (item này có xuống dòng ngay sau không). Đã DÒ THẬT bằng PDF tự viết tay (xem
 * `pdf-import.test.ts`): `hasEOL` chỉ đáng tin trong CÙNG một khối `BT…ET` — giữa hai khối `BT`
 * riêng (rất phổ biến: mỗi textbox PDF thường là một `BT…ET`) không có `hasEOL=true` báo hiệu,
 * phải dựa thêm vào KHOẢNG CÁCH TRỤC Y để bắt đúng ranh giới dòng. Vì vậy gom 2 tầng:
 *   ① `groupIntoLines` — 1 DÒNG: các item liên tiếp có y gần nhau (< 35% chiều cao) HOẶC bị cắt
 *      bởi `hasEOL=true`.
 *   ② `linesToBlocks` — 1 KHỐI (đoạn/tiêu đề): các dòng liên tiếp có khoảng trắng dọc (đáy dòng
 *      trên → đỉnh dòng dưới) < 1× cỡ chữ dòng trên VÀ mép trái không trôi quá xa (< 3× cỡ chữ —
 *      chặn gộp nhầm 2 cột cạnh nhau). Vượt ngưỡng = đoạn mới = 1 TextElement mới.
 * Đây LÀ đúng "GOM items thành khối theo dòng/cận kề (khoảng cách < ngưỡng theo cỡ chữ)" phiếu
 * ①.2 yêu cầu — chỉ khác chỗ áp cho lớp Chữ trực tiếp (không có lớp Nền để so sánh).
 *
 * ĐƠN VỊ: PDF point (1/72 inch) là đơn vị GỐC — `Frame.x/y/w/h` (model.ts) là % SÂN KHẤU, quy đổi
 * theo W/H THẬT của từng trang (`page.view`, KHÔNG giả định A4/16:9 — mỗi trang PDF có thể khác
 * kích thước). `TextElement.fontSize` = % CHIỀU CAO sân khấu, công thức GIỐNG HỆT
 * `pptx-import.ts#szToFontSizePct` (fontSizePt / pageHeightPt × 100) — chỉ khác đơn vị nguồn đã
 * là point sẵn (PDF), không cần quy đổi EMU→pt như OOXML.
 *
 * AN TOÀN KHUNG CHỮ: khung tính từ bounding-box CHỮ trong PDF thường KHÍT hơn cách trình duyệt
 * dựng chữ thật (font thay thế khác PDF gốc + `line-height:1.2` cộng thêm khoảng trên/dưới mỗi
 * dòng) — cộng đệm `WIDTH_PAD`/`HEIGHT_PAD` để tránh chữ bị cắt (`overflow:hidden`,
 * `components/present-editor/Element.tsx:686`).
 *
 * TRANG SCAN (0 text item thật): theo phiếu ②, KHÔNG bịa chữ — slide chỉ có 1 TextElement cảnh
 * báo "Trang scan — chữ cần OCR (bậc 2)", nền trắng, `templateId: 'pdf-import-scan'`.
 *
 * PROVENANCE (phiếu ④): `EditorDeck`/`EditorSlide` không có field "nguồn/note" chung — ghi vào 1
 * TextElement ẨN (`hidden:true`, `locked:true`) ở SLIDE ĐẦU TIÊN import (không chiếm chỗ nhìn
 * thấy/không lọt vào export, vẫn đi theo dữ liệu deck, xem được qua panel Lớp nếu bật hiện).
 */

import { makeText, newId, type EditorSlide, type Frame, type TextElement } from './model';

/* ══════════════════════════════════════════════════════════════════════════════════════════
 * ①  GOM TEXT ITEM → DÒNG → KHỐI (THUẦN — không đụng unpdf/PDF thật, test được bằng tay)
 * ════════════════════════════════════════════════════════════════════════════════════════ */

/** Tập con field của `unpdf.StructuredTextItem` mà module này cần — tránh phụ thuộc kiểu runtime
 * của `unpdf` ở lớp thuần (dễ test bằng object viết tay, không cần gọi `unpdf` thật). */
export interface PdfTextItem {
  str: string;
  /** gốc DƯỚI-TRÁI trang (PDF point). */
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontFamily: string;
  hasEOL: boolean;
}

/** Ngưỡng coi 2 item là CÙNG DÒNG — % chiều cao item (dòng cách nhau > ngưỡng này thì tách). */
export const LINE_Y_TOL_FACTOR = 0.35;
/** Khoảng trắng dọc (đáy dòng trên → đỉnh dòng dưới) tính theo LẦN cỡ chữ dòng trên — vượt
 * ngưỡng này thì bắt đầu KHỐI mới (đoạn văn/tiêu đề khác). */
export const BLOCK_GAP_FACTOR = 1;
/** Mép trái 2 dòng lệch quá bấy nhiêu LẦN cỡ chữ → luôn tách khối (chặn gộp nhầm 2 cột). */
export const BLOCK_LEFT_DRIFT_FACTOR = 3;
/** Đệm an toàn khung chữ — xem docstring đầu file "AN TOÀN KHUNG CHỮ". */
export const FRAME_WIDTH_PAD = 1.08;
export const FRAME_HEIGHT_PAD = 1.35;

function isBlank(it: PdfTextItem): boolean {
  return !it.str || !it.str.trim();
}

/** ① Gom item liên tiếp thành DÒNG — dựa vào độ gần trục Y VÀ `hasEOL` (xem docstring đầu file). */
export function groupIntoLines(items: PdfTextItem[]): PdfTextItem[][] {
  const lines: PdfTextItem[][] = [];
  let current: PdfTextItem[] = [];
  for (const it of items) {
    if (isBlank(it)) continue; // item rỗng — pdf.js hay chèn marker ngắt khối, không phải chữ thật
    if (current.length > 0) {
      const last = current[current.length - 1];
      const tol = Math.max(last.height, it.height, 1) * LINE_Y_TOL_FACTOR;
      const sameLine = Math.abs(it.y - last.y) < tol;
      if (!sameLine) {
        lines.push(current);
        current = [];
      }
    }
    current.push(it);
    if (it.hasEOL) {
      lines.push(current);
      current = [];
    }
  }
  if (current.length) lines.push(current);
  return lines;
}

/** Nối chữ trong CÙNG 1 dòng (nhiều item do đổi font/kiểu giữa dòng) — thêm dấu cách khi có
 * khoảng hở đáng kể giữa 2 item, không thì nối liền (item bị PDF tách do đổi style giữa từ). */
function joinLineText(line: PdfTextItem[]): string {
  let out = '';
  for (let i = 0; i < line.length; i += 1) {
    const it = line[i];
    if (i === 0) {
      out += it.str;
      continue;
    }
    const prev = line[i - 1];
    const gap = it.x - (prev.x + prev.width);
    const spaceThreshold = Math.max(1, prev.fontSize * 0.15);
    out += gap > spaceThreshold ? ` ${it.str}` : it.str;
  }
  return out;
}

interface LineInfo {
  text: string;
  left: number;
  right: number;
  top: number; // PDF y (đỉnh — điểm cao nhất, gần đầu trang hơn)
  bottom: number; // PDF y (đáy — điểm thấp nhất)
  fontSize: number;
  fontFamily: string;
}

function summarizeLine(line: PdfTextItem[]): LineInfo {
  let left = Infinity;
  let right = -Infinity;
  let top = -Infinity;
  let bottom = Infinity;
  let fontSizeSum = 0;
  for (const it of line) {
    left = Math.min(left, it.x);
    right = Math.max(right, it.x + it.width);
    top = Math.max(top, it.y + it.height);
    bottom = Math.min(bottom, it.y);
    fontSizeSum += it.fontSize;
  }
  return {
    text: joinLineText(line),
    left,
    right,
    top,
    bottom,
    fontSize: fontSizeSum / line.length,
    fontFamily: line[0].fontFamily || 'sans-serif',
  };
}

/** Một khối chữ đã gom xong — toạ độ VẪN Ở HỆ PDF (point, gốc dưới-trái), chưa quy đổi % sân khấu. */
export interface TextBlock {
  text: string;
  left: number;
  right: number;
  top: number;
  bottom: number;
  fontSize: number;
  fontFamily: string;
}

/** ② Gom DÒNG liên tiếp thành KHỐI (đoạn/tiêu đề) — xem docstring đầu file. */
export function linesToBlocks(lines: PdfTextItem[][]): TextBlock[] {
  const infos = lines.map(summarizeLine);
  const blocks: TextBlock[] = [];
  let cur: LineInfo[] = [];
  for (const li of infos) {
    if (cur.length > 0) {
      const prev = cur[cur.length - 1];
      const vGap = prev.bottom - li.top; // khoảng trắng giữa 2 dòng (có thể âm nếu chữ đè nhau)
      const gapThreshold = Math.max(1, prev.fontSize) * BLOCK_GAP_FACTOR;
      const leftDrift = Math.abs(li.left - prev.left);
      const driftThreshold = Math.max(1, prev.fontSize) * BLOCK_LEFT_DRIFT_FACTOR;
      const sameBlock = vGap < gapThreshold && leftDrift < driftThreshold;
      if (!sameBlock) {
        blocks.push(flushBlock(cur));
        cur = [];
      }
    }
    cur.push(li);
  }
  if (cur.length) blocks.push(flushBlock(cur));
  return blocks;
}

function flushBlock(lines: LineInfo[]): TextBlock {
  let left = Infinity;
  let right = -Infinity;
  let top = -Infinity;
  let bottom = Infinity;
  let fontSizeSum = 0;
  for (const li of lines) {
    left = Math.min(left, li.left);
    right = Math.max(right, li.right);
    top = Math.max(top, li.top);
    bottom = Math.min(bottom, li.bottom);
    fontSizeSum += li.fontSize;
  }
  return {
    text: lines.map((l) => l.text).join('\n'),
    left,
    right,
    top,
    bottom,
    fontSize: fontSizeSum / lines.length,
    fontFamily: lines[0].fontFamily,
  };
}

/** Tiện ích gộp ①+② — dùng thẳng cho `pdfToDeck`. */
export function groupItemsIntoBlocks(items: PdfTextItem[]): TextBlock[] {
  return linesToBlocks(groupIntoLines(items));
}

/* ══════════════════════════════════════════════════════════════════════════════════════════
 * ②  QUY ĐỔI KHỐI → TextElement (% sân khấu = % TRANG PDF, xem docstring đơn vị đầu file)
 * ════════════════════════════════════════════════════════════════════════════════════════ */

const IF_DEFAULT_INK = '#221f1a';

export function blockToFrame(b: TextBlock, pageW: number, pageH: number): Frame {
  const rawW = ((b.right - b.left) / pageW) * 100;
  const rawH = ((b.top - b.bottom) / pageH) * 100;
  const w = Math.max(0.5, rawW * FRAME_WIDTH_PAD);
  const h = Math.max(0.5, rawH * FRAME_HEIGHT_PAD);
  const x = (b.left / pageW) * 100;
  const y = ((pageH - b.top) / pageH) * 100; // Frame.y = % TỪ TRÊN; PDF y tăng lên trên
  return { x, y, w, h, rotation: 0 };
}

/** Cùng công thức `pptx-import.ts#szToFontSizePct` (% CHIỀU CAO sân khấu), nguồn đã là point. */
export function fontSizeToPct(fontSizePt: number, pageH: number): number {
  if (!Number.isFinite(fontSizePt) || fontSizePt <= 0 || pageH <= 0) return 0;
  return +((fontSizePt / pageH) * 100).toFixed(4);
}

function blockToTextElement(b: TextBlock, pageW: number, pageH: number, isTitle: boolean): TextElement {
  const fontSize = fontSizeToPct(b.fontSize, pageH);
  return makeText({
    text: b.text,
    frame: blockToFrame(b, pageW, pageH),
    fontSize: fontSize > 0 ? fontSize : 2.2,
    color: IF_DEFAULT_INK,
    colorAuto: false, // chữ đọc từ PDF là ý người tạo tài liệu gốc — không cho hệ tự dò lại màu
    fontFamily: b.fontFamily, // 'sans-serif'/'serif'/'monospace' — CSS generic hợp lệ, không phải tên font thật (xem docstring)
    role: isTitle ? 'title' : 'body',
  });
}

/* ══════════════════════════════════════════════════════════════════════════════════════════
 * ③  LỚP UNPDF (đụng file thật — nạp động, không nặng cold-start các route không dùng PDF import)
 * ════════════════════════════════════════════════════════════════════════════════════════ */

export interface PdfImportWarning {
  page: number;
  reason: string;
}

export interface PdfImportResult {
  /** slide dựng được, ĐÚNG thứ tự trang trong phạm vi đã chọn. */
  slides: EditorSlide[];
  /** tổng số trang CÓ TRONG FILE (không phụ thuộc phạm vi đã chọn). */
  total: number;
  /** số trang ĐÃ THỬ chuyển (= slides.length + warnings.length trong phạm vi). */
  converted: number;
  /** số trang trong `slides` là trang SCAN (0 chữ — badge OCR bậc 2), theo số trang 1-based. */
  scanPages: number[];
  warnings: PdfImportWarning[];
}

export interface PdfPageRange {
  start: number;
  end: number;
}

export interface PdfImportOptions {
  /** phạm vi trang 1-based, 2 đầu bao gồm — bỏ trống = TẤT CẢ trang. */
  pageRange?: PdfPageRange;
  /** gọi sau mỗi trang xử lý xong (`done` luôn ≤ `total` của phạm vi đã chọn) — nuôi LightArc. */
  onProgress?: (done: number, total: number) => void;
  /** tên file gốc — CHỈ dùng để ghi provenance (xem `provenanceNote`). Bỏ trống = "PDF" chung chung. */
  fileName?: string;
}

/** Trên ngưỡng này (số trang CỦA FILE, không phải phạm vi), UI phải hỏi phạm vi trước khi convert
 * (phiếu ③, SPEC-NGON-NGU) — hằng số DÙNG CHUNG giữa module này và UI, 1 nguồn duy nhất. */
export const PDF_RANGE_PROMPT_THRESHOLD = 30;

/** Khoá phạm vi về [1, total], đảm bảo start ≤ end. Đầu vào rỗng/lạ → cả file. */
export function clampPageRange(range: PdfPageRange | undefined, total: number): PdfPageRange {
  if (total <= 0) return { start: 1, end: 1 };
  if (!range) return { start: 1, end: total };
  const start = Math.max(1, Math.min(Math.floor(range.start) || 1, total));
  const endRaw = Math.floor(range.end) || total;
  const end = Math.max(start, Math.min(endRaw, total));
  return { start, end };
}

/**
 * Phân tích chuỗi người dùng gõ vào hộp thoại phạm vi (`window.prompt`, xem Toolbar.tsx) —
 * "1-10" hoặc "5" hoặc rỗng (= tất cả). Không hiểu được → null (caller coi như "tất cả", KHÔNG
 * chặn convert vì gõ sai định dạng — luật nền §7② không được là hộp đen, nhưng cũng không được
 * cứng nhắc bắt gõ đúng cú pháp mới cho chạy).
 */
export function parsePageRangeInput(input: string, total: number): PdfPageRange | null {
  const t = (input ?? '').trim();
  if (!t) return null;
  const range = /^(\d+)\s*-\s*(\d+)$/.exec(t);
  if (range) return clampPageRange({ start: Number(range[1]), end: Number(range[2]) }, total);
  const single = /^(\d+)$/.exec(t);
  if (single) return clampPageRange({ start: Number(single[1]), end: Number(single[1]) }, total);
  return null;
}

function scanBadgeSlide(pageNumber: number): EditorSlide {
  return {
    id: newId('sld'),
    background: '#ffffff',
    backgroundImage: null,
    templateId: 'pdf-import-scan',
    elements: [
      makeText({
        text: `Trang ${pageNumber} — trang scan, chữ cần OCR (bậc 2)`,
        frame: { x: 8, y: 44, w: 84, h: 12, rotation: 0 },
        fontSize: 2.8,
        color: IF_DEFAULT_INK,
        colorAuto: false,
        align: 'center',
        role: 'body',
      }),
    ],
  };
}

function provenanceNote(fileName: string): TextElement {
  return makeText({
    text: `Nguồn: "${fileName}" — chuyển đổi bậc 1 (Smart Convert PDF), ${new Date().toISOString().slice(0, 10)}.`,
    frame: { x: 2, y: 2, w: 60, h: 4, rotation: 0 },
    fontSize: 1.2,
    color: IF_DEFAULT_INK,
    colorAuto: false,
    hidden: true, // không chiếm chỗ nhìn thấy/không vào export — chỉ đi kèm dữ liệu deck
    locked: true,
    name: 'Nguồn nhập PDF',
  });
}

function openDocFailedMessage(err: unknown): string {
  return `Không mở được PDF — tệp có thể hỏng hoặc đặt mật khẩu (${err instanceof Error ? err.message : String(err)}).`;
}

/**
 * BẮT THẬT bằng browser sống (13/08): `unpdf.getDocumentProxy()` (qua PDF.js) CHUYỂN QUYỀN SỞ HỮU
 * (`transfer`) `ArrayBuffer` gốc sang worker nội bộ để tránh copy — hệ quả là buffer gốc bị
 * **DETACH**, dùng lại (`new Uint8Array(buf)`) ở lần gọi SAU ném `TypeError: Cannot perform
 * Construct on a detached ArrayBuffer`. UI gọi `pdfPageCount(buf)` RỒI `pdfToDeck(buf, …)` — CÙNG
 * MỘT buffer — nên trúng NGAY LỖI NÀY (Toolbar.tsx#openPdfFile). Sửa tại NGUỒN: luôn COPY bytes
 * bằng `.slice()` (cấp bộ nhớ MỚI, không phải view) trước khi đưa cho `unpdf` — buffer của CALLER
 * không bao giờ chạm tới `unpdf`, an toàn khi gọi lại nhiều lần trên CÙNG một `ArrayBuffer`/
 * `Uint8Array` gốc.
 */
function ownedCopy(data: ArrayBuffer | Uint8Array): Uint8Array {
  const view = data instanceof Uint8Array ? data : new Uint8Array(data);
  return view.slice();
}

/**
 * Đếm nhanh số trang (KHÔNG trích chữ) — UI gọi trước để quyết định có cần hỏi phạm vi trang hay
 * không (`PDF_RANGE_PROMPT_THRESHOLD`), tránh phải chạy `pdfToDeck` đầy đủ chỉ để biết tổng trang.
 * Mọi lệnh gọi `unpdf` của module này tập trung ở ĐÂY + `pdfToDeck` — UI (Toolbar.tsx) KHÔNG tự
 * import `unpdf`, chỉ gọi 2 hàm này.
 */
export async function pdfPageCount(data: ArrayBuffer | Uint8Array): Promise<number> {
  const bytes = ownedCopy(data);
  const unpdf = await import('unpdf');
  try {
    const pdf = await unpdf.getDocumentProxy(bytes);
    return pdf.numPages;
  } catch (err) {
    throw new Error(openDocFailedMessage(err));
  }
}

/**
 * Đọc CẢ FILE `.pdf`. Ném lỗi CHỈ khi cả file không mở được (hỏng/mật khẩu/không phải PDF); trang
 * lỗi lẻ thì vào `warnings` và BỎ QUA đúng trang đó (cùng nguyên tắc `importPptx`).
 */
export async function pdfToDeck(
  data: ArrayBuffer | Uint8Array,
  opts: PdfImportOptions = {},
): Promise<PdfImportResult> {
  const bytes = ownedCopy(data); // xem docstring `ownedCopy` — tránh detached-ArrayBuffer khi gọi lại
  const unpdf = await import('unpdf');

  let pdf: Awaited<ReturnType<typeof unpdf.getDocumentProxy>>;
  try {
    pdf = await unpdf.getDocumentProxy(bytes);
  } catch (err) {
    throw new Error(openDocFailedMessage(err));
  }

  const total = pdf.numPages;
  if (total <= 0) throw new Error('PDF không có trang nào.');
  const range = clampPageRange(opts.pageRange, total);
  const rangeCount = range.end - range.start + 1;

  let itemsByPage: PdfTextItem[][];
  try {
    const res = await unpdf.extractTextItems(pdf);
    itemsByPage = res.items as unknown as PdfTextItem[][];
  } catch (err) {
    throw new Error(`Không trích được chữ từ PDF (${err instanceof Error ? err.message : String(err)}).`);
  }

  const slides: EditorSlide[] = [];
  const warnings: PdfImportWarning[] = [];
  const scanPages: number[] = [];
  let done = 0;

  for (let n = range.start; n <= range.end; n += 1) {
    try {
      const page = await pdf.getPage(n);
      const view = page.view; // [x0, y0, x1, y1] point — KHÔNG giả định A4/16:9 (xem docstring)
      const pageW = Math.max(1, view[2] - view[0]);
      const pageH = Math.max(1, view[3] - view[1]);
      const rawItems = itemsByPage[n - 1] ?? [];
      const blocks = groupItemsIntoBlocks(rawItems);

      if (blocks.length === 0) {
        slides.push(scanBadgeSlide(n));
        scanPages.push(n);
      } else {
        let maxFontSize = -Infinity;
        for (const b of blocks) maxFontSize = Math.max(maxFontSize, b.fontSize);
        const elements = blocks.map((b) => blockToTextElement(b, pageW, pageH, b.fontSize === maxFontSize));
        slides.push({
          id: newId('sld'),
          background: '#ffffff',
          backgroundImage: null,
          templateId: 'pdf-import',
          elements,
        });
      }
    } catch (err) {
      warnings.push({ page: n, reason: `không đọc được, bỏ qua — ${err instanceof Error ? err.message : String(err)}` });
    }
    done += 1;
    opts.onProgress?.(done, rangeCount);
    // Luật ⑤ "số trang lớn không treo UI" — nhường event loop mỗi 5 trang (nhóm gom chữ là phần
    // CPU-bound trong vòng lặp này; bản thân `extractTextItems` ở trên là 1 await của unpdf,
    // không chia nhỏ được thêm từ phía module này — xem hạn chế trong báo cáo).
    if (done % 5 === 0) await new Promise((resolve) => setTimeout(resolve, 0));
  }

  if (slides.length > 0) {
    slides[0] = { ...slides[0], elements: [provenanceNote(opts.fileName || 'PDF'), ...slides[0].elements] };
  }

  return { slides, total, converted: slides.length + warnings.length, scanPages, warnings };
}

/**
 * Câu báo kết quả cho người dùng — 1 nguồn duy nhất (Toolbar gọi), khuôn giống hệt
 * `pptx-import.ts#importSummary`. Nói THẲNG giới hạn "chỉ lớp chữ" ngay trong câu đầu — không giấu.
 */
export function pdfImportSummary(fileName: string, res: PdfImportResult): string {
  const rangeNote = res.slides.length + res.warnings.length < res.total ? ` (đã chọn ${res.slides.length + res.warnings.length}/${res.total} trang)` : '';
  const scanNote = res.scanPages.length
    ? ` ${res.scanPages.length} trang scan cần OCR (bậc 2): trang ${res.scanPages.join(', ')}.`
    : '';
  const warnNote = res.warnings.length
    ? ` Bỏ qua ${res.warnings.length} trang lỗi: ${res.warnings.map((w) => w.page).join(', ')}.`
    : '';
  return (
    `Đã nhập ${res.slides.length} trang từ "${fileName}"${rangeNote} — CHỈ lớp CHỮ sống ` +
    `(chưa raster hoá nền gốc, cần thêm bộ render ảnh — xem báo cáo).${scanNote}${warnNote}`
  );
}
