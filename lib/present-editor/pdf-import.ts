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
 *   2. **Lớp ẢNH (XObject nhúng) — ĐÃ CÓ từ D1 (14/08, phiếu `docs/phieu-giao/demo-d1-pdf-anh.md`,
 *      bậc 1c).** Ghi chú cũ ở đây từng nói toạ độ ảnh "không moi được" — đúng với WRAPPER
 *      `unpdf.extractImages` (nó vứt transform đi), nhưng toạ độ vẫn moi được TẤT ĐỊNH từ chính
 *      operator-list mà hàm đó đang duyệt: bám `save`/`restore`/`transform` (ma trận `cm`) tới lúc
 *      gặp `paintImageXObject` thì CTM hiện hành chính là phép đặt ảnh (ô vuông đơn vị → vùng trên
 *      trang). Xem `extractImagesWithBbox` — CÙNG vòng lặp + CÙNG phép kiểm hợp lệ với
 *      `unpdf.extractImages` (đọc từ node_modules/unpdf/dist/index.mjs#extractImages$1), chỉ thêm
 *      bám CTM; không dep mới, chỉ gọi API sẵn của unpdf (`getResolvedPDFJS` để lấy bảng `OPS`).
 *      Ảnh XOAY/NGHIÊNG (ma trận có thành phần b/c đáng kể) → bbox chữ-nhật-thẳng-trục không còn
 *      thật → đặt FULL-SLIDE dưới đáy + cờ `inferred` trong provenance (khai thật, không đoán mò).
 *      `paintImageXObjectRepeat`/ảnh inline: unpdf cũng không trích — ghi vào `imageWarnings`.
 *      Pixel trích là pixel ĐÃ GIẢI MÃ của pdf.js (byte JPEG nén gốc KHÔNG lấy lại được qua API
 *      này) — đóng gói LOSSLESS thành PNG thuần (`rawPixelsToPngDataUrl`, không canvas, không dep):
 *      không mất thêm chất lượng, KHÔNG downscale [T0]; đổi lại dataURL có thể NẶNG (PNG không
 *      nén deflate-stored + base64 ≈ ×4 so với JPEG gốc — cảnh báo trong báo cáo phiếu D1).
 *      Mỗi ảnh = 1 `ImageElement` (z DƯỚI lớp chữ) + 1 `LinkedAsset` trong `PdfImportResult.
 *      linkedAssets` — assetId TẤT ĐỊNH theo hash NỘI DUNG pixel (`pdfImageAssetId`): cùng ảnh
 *      xuất hiện 2 trang = CÙNG asset [T1], provenance ghi file/trang-đầu-thấy/bbox [T0]. Caller
 *      (Toolbar/PresentEditor) phải merge `linkedAssets` vào `deck.linkedAssets` khi nhận slides.
 *   3. **Hệ quả trực tiếp lên lớp Chữ:** phiếu ①.2 định "mặc định lớp chữ ẨN vì nền raster đã có
 *      chữ sẵn" — giả định đó KHÔNG còn đúng vì không có nền raster nào để nhìn thấy chữ. Nếu vẫn
 *      ẩn lớp Chữ theo đúng câu chữ phiếu, slide sẽ TRẮNG TRƠN, vô dụng. Quyết định: **lớp Chữ
 *      MẶC ĐỊNH HIỆN** — đây là lựa chọn ĐƠN GIẢN NHẤT giữ đúng tinh thần "nhập PDF ra deck nhìn
 *      thấy được, sửa tiếp trong IF" (luật nền §7②) khi tiền đề "đã có nền" không còn.
 *
 * Phần còn nợ (raster NỀN cả trang, OCR trang scan) CẦN gói `@napi-rs/canvas` HOẶC một backend
 * render PDF khác — NGOÀI PHẠM VI bậc 1 (⑤ cấm dependency mới), vẫn để dành bậc 2 (nợ 1b).
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

import {
  makeImage,
  makeText,
  newId,
  type EditorDeck,
  type EditorSlide,
  type Frame,
  type ImageElement,
  type LinkedAsset,
  type TextElement,
} from './model';
import { attachElementToAsset } from './linked-assets';

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
 * ②b  D1 — LỚP ẢNH, phần THUẦN (PNG encoder · hash tất định · ma trận CTM → bbox)
 *     Không DOM, không canvas, không dep — test bằng sucrase-node y như tầng ①②.
 * ════════════════════════════════════════════════════════════════════════════════════════ */

/* ---- PNG encoder thuần (deflate STORED — không nén nhưng là PNG hợp lệ, tất định 100%) ---- */

let CRC_TABLE: Uint32Array | null = null;
function crc32(bytes: Uint8Array, start: number, end: number): number {
  if (!CRC_TABLE) {
    CRC_TABLE = new Uint32Array(256);
    for (let n = 0; n < 256; n += 1) {
      let c = n;
      for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      CRC_TABLE[n] = c >>> 0;
    }
  }
  let crc = 0xffffffff;
  for (let i = start; i < end; i += 1) crc = CRC_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function adler32(bytes: Uint8Array): number {
  // chuẩn zlib RFC 1950 — mod 65521; cộng dồn từng byte (đủ nhanh cho ảnh vài MB, thuần tất định).
  let a = 1;
  let b = 0;
  for (let i = 0; i < bytes.length; i += 1) {
    a = (a + bytes[i]) % 65521;
    b = (b + a) % 65521;
  }
  return ((b << 16) | a) >>> 0;
}

function writeU32BE(buf: Uint8Array, off: number, v: number): void {
  buf[off] = (v >>> 24) & 0xff;
  buf[off + 1] = (v >>> 16) & 0xff;
  buf[off + 2] = (v >>> 8) & 0xff;
  buf[off + 3] = v & 0xff;
}

/** 1 chunk PNG: [len BE32][type 4 ký tự][body][crc32(type+body)]. */
function pngChunk(type: string, body: Uint8Array): Uint8Array {
  const out = new Uint8Array(12 + body.length);
  writeU32BE(out, 0, body.length);
  for (let i = 0; i < 4; i += 1) out[4 + i] = type.charCodeAt(i);
  out.set(body, 8);
  writeU32BE(out, 8 + body.length, crc32(out, 4, 8 + body.length));
  return out;
}

/** zlib stream KHÔNG nén (deflate stored blocks ≤65535 byte) — hợp lệ mọi trình đọc PNG. */
function zlibStored(raw: Uint8Array): Uint8Array {
  const blocks = Math.max(1, Math.ceil(raw.length / 65535));
  const out = new Uint8Array(2 + raw.length + blocks * 5 + 4);
  out[0] = 0x78;
  out[1] = 0x01;
  let o = 2;
  for (let i = 0; i < blocks; i += 1) {
    const start = i * 65535;
    const len = Math.min(65535, raw.length - start);
    out[o] = i === blocks - 1 ? 1 : 0; // BFINAL
    out[o + 1] = len & 0xff;
    out[o + 2] = (len >>> 8) & 0xff;
    out[o + 3] = ~len & 0xff;
    out[o + 4] = (~len >>> 8) & 0xff;
    out.set(raw.subarray(start, start + len), o + 5);
    o += 5 + len;
  }
  writeU32BE(out, o, adler32(raw));
  return out;
}

const B64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
/** base64 thuần (không Buffer/btoa — chạy y hệt Node lẫn browser, tất định). */
function bytesToBase64(bytes: Uint8Array): string {
  const parts: string[] = [];
  let chunk = '';
  let i = 0;
  for (; i + 2 < bytes.length; i += 3) {
    const n = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];
    chunk +=
      B64_ALPHABET[n >>> 18] + B64_ALPHABET[(n >>> 12) & 63] + B64_ALPHABET[(n >>> 6) & 63] + B64_ALPHABET[n & 63];
    if (chunk.length >= 24000) {
      parts.push(chunk);
      chunk = '';
    }
  }
  if (i < bytes.length) {
    const b0 = bytes[i];
    const b1 = i + 1 < bytes.length ? bytes[i + 1] : 0;
    chunk += B64_ALPHABET[b0 >>> 2] + B64_ALPHABET[((b0 & 3) << 4) | (b1 >>> 4)];
    chunk += i + 1 < bytes.length ? B64_ALPHABET[(b1 & 15) << 2] : '=';
    chunk += '=';
  }
  parts.push(chunk);
  return parts.join('');
}

/**
 * Pixel thô (từ pdf.js: 1=grayscale · 3=RGB · 4=RGBA, 8-bit) → BYTE PNG LOSSLESS.
 * KHÔNG canvas (chạy được trong test Node lẫn browser), KHÔNG nén (deflate stored) — giữ nguyên
 * từng pixel [T0], tất định từng byte [T6]. Giá phải trả: file to (xem docstring đầu file, mục 2).
 * D1b: TÁCH RA từ `rawPixelsToPngDataUrl` để đường `storeImage` (ảnh ra KHO ngoài deck — luật
 * Smart Ingest) nhận thẳng byte, không phải giải base64 ngược lại.
 */
export function rawPixelsToPngBytes(
  data: Uint8Array | Uint8ClampedArray,
  width: number,
  height: number,
  channels: 1 | 3 | 4,
): Uint8Array {
  const colorType = channels === 1 ? 0 : channels === 3 ? 2 : 6;
  const rowBytes = width * channels;
  // mỗi scanline PNG mở đầu bằng 1 byte filter (0 = None).
  const raw = new Uint8Array((rowBytes + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const o = y * (rowBytes + 1);
    raw[o] = 0;
    for (let x = 0; x < rowBytes; x += 1) raw[o + 1 + x] = data[y * rowBytes + x];
  }
  const ihdr = new Uint8Array(13);
  writeU32BE(ihdr, 0, width);
  writeU32BE(ihdr, 4, height);
  ihdr[8] = 8; // bit depth
  ihdr[9] = colorType;
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter method
  ihdr[12] = 0; // interlace
  const sig = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
  const chunks = [sig, pngChunk('IHDR', ihdr), pngChunk('IDAT', zlibStored(raw)), pngChunk('IEND', new Uint8Array(0))];
  let total = 0;
  for (const c of chunks) total += c.length;
  const png = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) {
    png.set(c, off);
    off += c.length;
  }
  return png;
}

/** Vỏ dataURL của `rawPixelsToPngBytes` — đường NHÚNG THẲNG vào deck (hành vi cũ, giữ cho fixture
 * nhỏ/test/fallback khi không có `storeImage` — xem `PdfImportOptions.storeImage`). */
export function rawPixelsToPngDataUrl(
  data: Uint8Array | Uint8ClampedArray,
  width: number,
  height: number,
  channels: 1 | 3 | 4,
): string {
  return `data:image/png;base64,${bytesToBase64(rawPixelsToPngBytes(data, width, height, channels))}`;
}

/* ---- assetId tất định theo NỘI DUNG ảnh (phiếu ④.1: trùng ảnh 2 trang = CÙNG asset) ---- */

/**
 * Hash FNV-1a kép 32-bit (2 seed khác nhau → 16 hex) trên pixel + kích thước + số kênh — thuần,
 * tất định, không crypto (không cần chống chủ đích, chỉ cần trùng-nội-dung ⇒ trùng-id và xác suất
 * va chạm ngẫu nhiên ~2⁻⁶⁴ đủ nhỏ cho registry 1 deck). Tiền tố `img_pdf_` chỉ để người đọc debug
 * nhận ra nguồn — KHÔNG nơi nào parse tiền tố assetId (xem linked-assets.ts#newAssetId).
 */
export function pdfImageAssetId(
  data: Uint8Array | Uint8ClampedArray,
  width: number,
  height: number,
  channels: number,
): string {
  let h1 = (0x811c9dc5 ^ width) >>> 0;
  let h2 = (0xcbf29ce4 ^ height) >>> 0;
  for (let i = 0; i < data.length; i += 1) {
    const b = data[i];
    h1 = Math.imul(h1 ^ b, 16777619) >>> 0;
    h2 = Math.imul(h2 ^ b, 0x85ebca6b) >>> 0;
  }
  h1 = Math.imul(h1 ^ channels, 16777619) >>> 0;
  h2 = Math.imul(h2 ^ channels, 0x85ebca6b) >>> 0;
  return `img_pdf_${h1.toString(16).padStart(8, '0')}${h2.toString(16).padStart(8, '0')}`;
}

/* ---- ma trận CTM của PDF (toán tử `cm`) → bbox điểm đặt ảnh ---- */

/** [a, b, c, d, e, f] — điểm (x,y) ↦ (ax + cy + e, bx + dy + f). */
export type PdfMatrix = [number, number, number, number, number, number];
const MTX_ID: PdfMatrix = [1, 0, 0, 1, 0, 0];

/** Ghép `cm` vào CTM: điểm đi qua `m` TRƯỚC rồi `ctm` — đúng ngữ nghĩa toán tử `cm` của PDF. */
export function mtxConcat(ctm: PdfMatrix, m: PdfMatrix): PdfMatrix {
  return [
    m[0] * ctm[0] + m[1] * ctm[2],
    m[0] * ctm[1] + m[1] * ctm[3],
    m[2] * ctm[0] + m[3] * ctm[2],
    m[2] * ctm[1] + m[3] * ctm[3],
    m[4] * ctm[0] + m[5] * ctm[2] + ctm[4],
    m[4] * ctm[1] + m[5] * ctm[3] + ctm[5],
  ];
}

/** bbox điểm PDF (gốc DƯỚI-trái, như text item) của 1 ảnh đặt qua CTM. */
export interface PdfImageBboxPt {
  left: number;
  bottom: number;
  right: number;
  top: number;
}

/**
 * `paintImageXObject` vẽ ảnh vào Ô VUÔNG ĐƠN VỊ (0,0)–(1,1) rồi CTM đặt nó lên trang. Ma trận có
 * xoay/nghiêng (|b|+|c| đáng kể so với |a|+|d|) → hình đặt KHÔNG còn là chữ nhật thẳng trục, bbox
 * min/max sẽ NÓI DỐI về vị trí thật ⇒ trả null để caller đặt full-slide + cờ `inferred` (phiếu
 * ④.2 — khai thật). Lật/scale âm (d<0 rất phổ biến vì PDF y hướng lên) thì bbox 4 góc vẫn CHÍNH
 * XÁC — xử lý bằng min/max, không phải ca inferred.
 */
export function ctmToImageBbox(m: PdfMatrix): PdfImageBboxPt | null {
  const skew = Math.abs(m[1]) + Math.abs(m[2]);
  const scale = Math.abs(m[0]) + Math.abs(m[3]);
  if (!(scale > 0) || skew > scale * 0.001) return null;
  const x0 = m[4];
  const x1 = m[0] + m[4]; // c ≈ 0 nên bỏ qua thành phần c/b trong 4 góc
  const y0 = m[5];
  const y1 = m[3] + m[5];
  const left = Math.min(x0, x1);
  const right = Math.max(x0, x1);
  const bottom = Math.min(y0, y1);
  const top = Math.max(y0, y1);
  if (right - left < 0.01 || top - bottom < 0.01) return null; // suy biến — không tin
  return { left, bottom, right, top };
}

/** Quy đổi bbox điểm PDF → `Frame` % sân khấu (KHÔNG đệm — ảnh không có vấn đề font thay thế). */
export function imageBboxToFrame(b: PdfImageBboxPt, pageW: number, pageH: number): Frame {
  return {
    x: (b.left / pageW) * 100,
    y: ((pageH - b.top) / pageH) * 100,
    w: Math.max(0.5, ((b.right - b.left) / pageW) * 100),
    h: Math.max(0.5, ((b.top - b.bottom) / pageH) * 100),
    rotation: 0,
  };
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
  /**
   * D1 — registry tài sản ảnh trích từ PDF: key = assetId TẤT ĐỊNH theo nội dung pixel
   * (`pdfImageAssetId` — trùng ảnh nhiều trang = 1 asset [T1]), value mang `provenance`
   * file/trang/bbox [T0]. CALLER (Toolbar/PresentEditor) PHẢI merge vào `deck.linkedAssets`
   * khi nhận slides — không merge thì element vẫn hiển thị đúng (src đã gán) nhưng mất tính
   * "sửa 1 lần đổi mọi nơi" của linked asset.
   */
  linkedAssets: Record<string, LinkedAsset>;
  /**
   * D1 — sự cố TRÍCH ẢNH lẻ (ảnh lặp/inline/mask không hỗ trợ, lỗi giải mã…). TÁCH KHỎI
   * `warnings` vì trang vẫn ra slide chữ bình thường — không được tính vào `converted` 2 lần.
   */
  imageWarnings: PdfImportWarning[];
}

export interface PdfPageRange {
  start: number;
  end: number;
}

/** D1b — metadata kèm theo mỗi lần gọi `storeImage` (đủ để caller đặt tên/ghi nguồn ở kho). */
export interface PdfStoredImageMeta {
  /** assetId tất định theo nội dung pixel (`pdfImageAssetId`) — caller muốn khử trùng lặp ở kho
   * thì dùng khoá này. */
  assetId: string;
  /** tên gợi nhớ, vd `Ảnh PDF trang 15 — hồ-sơ.pdf`. */
  name: string;
  /** trang 1-based nơi ảnh xuất hiện LẦN ĐẦU. */
  page: number;
  width: number;
  height: number;
  /** luôn `image/png` ở bậc 1 (PNG lossless thuần — xem `rawPixelsToPngBytes`). */
  mime: 'image/png';
}

export interface PdfImportOptions {
  /** phạm vi trang 1-based, 2 đầu bao gồm — bỏ trống = TẤT CẢ trang. */
  pageRange?: PdfPageRange;
  /**
   * D1b — DANH SÁCH trang 1-based tuỳ ý (vd [15,16,22] — chọn đúng trang bếp/khách, không phải
   * dải liên tục). CÓ `pages` thì `pageRange` BỊ BỎ QUA (2 cách khai cùng lúc là mơ hồ — ưu tiên
   * cách cụ thể hơn). Lọc qua `normalizePages`: số lẻ/lặp/ngoài [1,total] bị loại; lọc xong RỖNG
   * thì coi như không khai (cả file) — cùng triết lý `clampPageRange` "đầu vào rỗng/lạ → cả file,
   * không chặn".
   */
  pages?: number[];
  /**
   * D1b — vá DF2-F1 theo luật Smart Ingest (chốt 11/08: gốc bất biến + proxy hiển thị): ảnh nhúng
   * ĐẨY RA KHO qua callback này thay vì nhúng dataURL vào deck (file 47 trang toàn raster → deck
   * JSON >1GB, "Invalid string length"). Lib này THUẦN — KHÔNG tự gọi API/fs; CALLER truyền hàm
   * upload (Toolbar dùng POST /api/library sẵn có; script Node ghi file). Nhận byte PNG + meta,
   * trả URL → `LinkedAsset.src`. NÉM LỖI ở 1 ảnh → ảnh đó fallback dataURL + ghi `imageWarnings`
   * (khai thật, không nuốt); KHÔNG truyền → hành vi cũ y nguyên (dataURL, test cũ không vỡ) +
   * cảnh báo tổng dung lượng nhúng khi vượt `EMBEDDED_IMAGE_WARN_BYTES`.
   */
  storeImage?: (bytes: Uint8Array, meta: PdfStoredImageMeta) => Promise<string>;
  /** gọi sau mỗi trang xử lý xong (`done` luôn ≤ `total` của phạm vi đã chọn) — nuôi LightArc. */
  onProgress?: (done: number, total: number) => void;
  /** tên file gốc — CHỈ dùng để ghi provenance (xem `provenanceNote`). Bỏ trống = "PDF" chung chung. */
  fileName?: string;
}

/** D1b — tổng byte ảnh NHÚNG dataURL vào deck vượt ngưỡng này (~20MB) thì ghi 1 dòng
 * `imageWarnings` cảnh báo deck nặng (chỉ khi KHÔNG có đường `storeImage` hoặc nó fail). */
export const EMBEDDED_IMAGE_WARN_BYTES = 20 * 1024 * 1024;

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
 * D1b — chuẩn hoá danh sách trang tuỳ ý: giữ số NGUYÊN trong [1,total], bỏ lặp, SẮP TĂNG DẦN
 * (slide ra đúng thứ tự trang trong file — cùng bất biến "ĐÚNG thứ tự trang" của `PdfImportResult`).
 * Lọc xong rỗng → `[]` (caller `pdfToDeck` hiểu là "không khai" = cả file, xem `PdfImportOptions.pages`).
 */
export function normalizePages(pages: number[] | undefined, total: number): number[] {
  if (!pages || total <= 0) return [];
  const seen = new Set<number>();
  for (const p of pages) {
    const n = Math.floor(p);
    if (Number.isFinite(n) && n >= 1 && n <= total) seen.add(n);
  }
  return [...seen].sort((a, b) => a - b);
}

/**
 * D1b — phân tích chuỗi CHỌN TRANG dạng danh sách: "15-22", "5", "1,3,7-9" (dấu phẩy/chấm phẩy
 * tách cụm, mỗi cụm là 1 số hoặc 1 dải a-b). Trả danh sách đã `normalizePages`; rỗng/không hiểu
 * cụm nào → null (caller coi như "tất cả" — cùng triết lý `parsePageRangeInput`, không chặn vì
 * gõ sai cú pháp). Cụm hiểu được thì giữ, cụm rác thì bỏ qua (khoan dung từng phần).
 */
export function parsePagesInput(input: string, total: number): number[] | null {
  const t = (input ?? '').trim();
  if (!t) return null;
  const out: number[] = [];
  for (const part of t.split(/[,;]/)) {
    const p = part.trim();
    if (!p) continue;
    const range = /^(\d+)\s*-\s*(\d+)$/.exec(p);
    if (range) {
      const r = clampPageRange({ start: Number(range[1]), end: Number(range[2]) }, total);
      for (let n = r.start; n <= r.end; n += 1) out.push(n);
      continue;
    }
    const single = /^(\d+)$/.exec(p);
    if (single) out.push(Number(single[1]));
  }
  const norm = normalizePages(out, total);
  return norm.length > 0 ? norm : null;
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

/** Badge trang scan — D1 tách khỏi hàm dựng slide vì trang scan giờ CÓ THỂ kèm ảnh trích được
 * (trang scan điển hình = 1 ảnh raster cả trang: ảnh hiện được ngay, chữ trong ảnh vẫn cần OCR). */
function scanBadgeText(pageNumber: number): TextElement {
  return makeText({
    text: `Trang ${pageNumber} — trang scan, chữ cần OCR (bậc 2)`,
    frame: { x: 8, y: 44, w: 84, h: 12, rotation: 0 },
    fontSize: 2.8,
    color: IF_DEFAULT_INK,
    colorAuto: false,
    align: 'center',
    role: 'body',
  });
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

/* ---- D1: trích ảnh nhúng + bbox từ operator-list (xem docstring đầu file, mục 2) ---- */

/** Ảnh nhúng đã trích từ 1 trang — pixel ĐÃ GIẢI MÃ + vị trí đặt (null = không tin cậy). */
export interface PdfPageImage {
  data: Uint8Array | Uint8ClampedArray;
  width: number;
  height: number;
  channels: 1 | 3 | 4;
  /** khoá XObject trong operator-list (vd "img_p0_1") — chỉ để debug/đối chiếu. */
  key: string;
  /** null = transform xoay/nghiêng/suy biến → caller đặt full-slide + `inferred` (phiếu ④.2). */
  bboxPt: PdfImageBboxPt | null;
}

/** Tập con PDFPageProxy (pdf.js) mà việc trích ảnh cần — structural typing để test/tsc không phải
 * kéo nguyên bộ type pdf.js vào đây (cùng lý do `PdfTextItem` ở tầng ①). */
interface PdfPageLike {
  getOperatorList(): Promise<{ fnArray: number[]; argsArray: unknown[][] }>;
  objs: { get(key: string, callback: (obj: unknown) => void): unknown };
  commonObjs: { get(key: string, callback: (obj: unknown) => void): unknown };
}

interface RawPdfImage {
  data?: Uint8Array | Uint8ClampedArray;
  width?: number;
  height?: number;
}

/**
 * CÙNG vòng lặp + CÙNG phép kiểm hợp lệ với `unpdf.extractImages` (đọc thật từ
 * node_modules/unpdf/dist/index.mjs#extractImages$1: duyệt operator-list, gặp `paintImageXObject`
 * thì lấy object đã giải mã từ `page.objs`/`page.commonObjs`, bỏ qua ảnh thiếu data/kênh lạ) —
 * KHÁC duy nhất: bám CTM qua `save`/`restore`/`transform` để biết ảnh ĐẶT Ở ĐÂU (thứ wrapper của
 * unpdf vứt đi). `skipped` = toán tử ảnh KHÔNG trích được (repeat/inline — unpdf cũng bỏ).
 */
export async function extractImagesWithBbox(
  page: PdfPageLike,
  OPS: Record<string, number | undefined>,
): Promise<{ images: PdfPageImage[]; skipped: string[] }> {
  const list = await page.getOperatorList();
  let ctm: PdfMatrix = MTX_ID;
  const stack: PdfMatrix[] = [];
  const images: PdfPageImage[] = [];
  const skipped: string[] = [];
  for (let i = 0; i < list.fnArray.length; i += 1) {
    const fn = list.fnArray[i];
    if (fn === OPS.save) {
      stack.push(ctm);
    } else if (fn === OPS.restore) {
      ctm = stack.pop() ?? MTX_ID;
    } else if (fn === OPS.transform) {
      ctm = mtxConcat(ctm, list.argsArray[i] as PdfMatrix);
    } else if (fn === OPS.paintImageXObject) {
      const key = String((list.argsArray[i] ?? [])[0] ?? '');
      if (!key) continue;
      // getOperatorList đã resolve xong mọi obj của trang — callback get() gọi đồng bộ/ngay sau.
      const image = await new Promise<RawPdfImage | null>((resolve) =>
        (key.startsWith('g_') ? page.commonObjs : page.objs).get(key, (obj) => resolve(obj as RawPdfImage | null)),
      );
      if (!image || !image.data || !image.width || !image.height) {
        skipped.push(`${key}: pdf.js không trả pixel giải mã (mask/pattern hoặc dạng bitmap không data)`);
        continue;
      }
      const calculated = image.data.length / (image.width * image.height);
      if (calculated !== 1 && calculated !== 3 && calculated !== 4) {
        skipped.push(`${key}: số kênh lạ (${calculated}) — cùng phép loại của unpdf.extractImages`);
        continue;
      }
      images.push({
        data: image.data,
        width: image.width,
        height: image.height,
        channels: calculated,
        key,
        bboxPt: ctmToImageBbox(ctm),
      });
    } else if (fn === OPS.paintImageXObjectRepeat || fn === OPS.paintInlineImageXObject) {
      skipped.push(
        fn === OPS.paintImageXObjectRepeat
          ? 'ảnh lặp (paintImageXObjectRepeat) — chưa hỗ trợ, unpdf cũng bỏ'
          : 'ảnh inline (paintInlineImageXObject) — chưa hỗ trợ, unpdf cũng bỏ',
      );
    }
  }
  return { images, skipped };
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
    // D1: `isOffscreenCanvasSupported:false` — trong BROWSER pdf.js mặc định giải mã ảnh thành
    // ImageBitmap (không có `.data`) khi OffscreenCanvas sẵn có ⇒ vòng trích ảnh (cùng phép kiểm
    // với unpdf.extractImages: `!image.data → bỏ`) sẽ RỖNG dù PDF đầy ảnh. Tắt cờ này ép pdf.js
    // trả pixel dạng typed-array ở CẢ Node lẫn browser — một đường chạy duy nhất, test được thật.
    pdf = await unpdf.getDocumentProxy(bytes, { isOffscreenCanvasSupported: false });
  } catch (err) {
    throw new Error(openDocFailedMessage(err));
  }

  const total = pdf.numPages;
  if (total <= 0) throw new Error('PDF không có trang nào.');
  // D1b — `pages` (danh sách tuỳ ý) thắng `pageRange` (dải liên tục); cả hai vắng/rỗng = cả file.
  const explicitPages = normalizePages(opts.pages, total);
  const range = clampPageRange(opts.pageRange, total);
  const pageList: number[] =
    explicitPages.length > 0
      ? explicitPages
      : Array.from({ length: range.end - range.start + 1 }, (_, i) => range.start + i);
  const rangeCount = pageList.length;

  let itemsByPage: PdfTextItem[][];
  try {
    const res = await unpdf.extractTextItems(pdf);
    itemsByPage = res.items as unknown as PdfTextItem[][];
  } catch (err) {
    throw new Error(`Không trích được chữ từ PDF (${err instanceof Error ? err.message : String(err)}).`);
  }

  const slides: EditorSlide[] = [];
  const warnings: PdfImportWarning[] = [];
  const imageWarnings: PdfImportWarning[] = [];
  const scanPages: number[] = [];
  const linkedAssets: Record<string, LinkedAsset> = {};
  const pendingAttach: Array<{ slideId: string; elementId: string; assetId: string }> = [];
  const fileLabel = opts.fileName || 'PDF';
  let done = 0;
  // D1b — tổng byte PNG NHÚNG dataURL vào deck (đường storeImage KHÔNG tính — ảnh đã ra kho).
  let embeddedBytes = 0;

  // D1 — bảng mã toán tử pdf.js, lấy 1 lần cho cả file (extractImagesWithBbox cần so `fnArray`).
  const { OPS } = await unpdf.getResolvedPDFJS();

  for (const n of pageList) {
    try {
      const page = await pdf.getPage(n);
      const view = page.view; // [x0, y0, x1, y1] point — KHÔNG giả định A4/16:9 (xem docstring)
      const pageW = Math.max(1, view[2] - view[0]);
      const pageH = Math.max(1, view[3] - view[1]);
      const rawItems = itemsByPage[n - 1] ?? [];
      const blocks = groupItemsIntoBlocks(rawItems);

      // ── D1 lớp ẢNH: trích ảnh nhúng + bbox. Sự cố ảnh KHÔNG giết trang — chữ vẫn ra,
      // ghi `imageWarnings` (khai thật, không nuốt lỗi im lặng).
      const imageEls: ImageElement[] = [];
      const imageAssetIds: string[] = []; // song song imageEls — nuôi pendingAttach khi có slideId
      try {
        const { images, skipped } = await extractImagesWithBbox(
          page as unknown as Parameters<typeof extractImagesWithBbox>[0],
          OPS as unknown as Record<string, number | undefined>,
        );
        for (const s of skipped) imageWarnings.push({ page: n, reason: s });
        for (const im of images) {
          const assetId = pdfImageAssetId(im.data, im.width, im.height, im.channels);
          const frame: Frame = im.bboxPt
            ? imageBboxToFrame(im.bboxPt, pageW, pageH)
            : { x: 0, y: 0, w: 100, h: 100, rotation: 0 }; // không bbox tin cậy → full-slide (phiếu ④.2)
          if (!linkedAssets[assetId]) {
            // ảnh mới gặp lần đầu — encode PNG 1 LẦN cho mỗi nội dung (trang sau trùng ảnh
            // dùng lại src qua asset, không encode lại — trùng ảnh 2 trang = CÙNG asset [T1]).
            const pngBytes = rawPixelsToPngBytes(im.data, im.width, im.height, im.channels);
            const assetName = `Ảnh PDF trang ${n}`;
            // D1b — đường KHO (Smart Ingest): có storeImage thì src = URL kho, deck chỉ giữ con
            // trỏ; lỗi/thiếu → fallback dataURL (hành vi cũ) + khai vào imageWarnings.
            let src = '';
            if (opts.storeImage) {
              try {
                src = await opts.storeImage(pngBytes, {
                  assetId,
                  name: assetName,
                  page: n,
                  width: im.width,
                  height: im.height,
                  mime: 'image/png',
                });
              } catch (err) {
                imageWarnings.push({
                  page: n,
                  reason: `không lưu được ảnh ra kho (${err instanceof Error ? err.message : String(err)}) — nhúng dataURL thay thế, deck sẽ nặng hơn`,
                });
              }
            }
            if (!src) {
              src = `data:image/png;base64,${bytesToBase64(pngBytes)}`;
              embeddedBytes += pngBytes.length;
            }
            linkedAssets[assetId] = {
              id: assetId,
              src,
              name: assetName,
              updatedAt: Date.now(),
              provenance: {
                loai: 'pdf',
                file: fileLabel,
                page: n,
                bbox: { x: frame.x, y: frame.y, w: frame.w, h: frame.h },
                ...(im.bboxPt ? {} : { inferred: true }),
              },
            };
          }
          // src gán tạm bằng src asset — pass `attachElementToAsset` cuối hàm mới là đường gán
          // CHÍNH THỨC (API chuẩn linked-assets, phiếu ④.1); ở đây chỉ để element tự đứng được.
          imageEls.push(makeImage(linkedAssets[assetId].src, { frame, name: `Ảnh PDF trang ${n}` }));
          imageAssetIds.push(assetId);
        }
      } catch (err) {
        imageWarnings.push({
          page: n,
          reason: `không trích được ảnh nhúng — ${err instanceof Error ? err.message : String(err)}`,
        });
      }

      const slideId = newId('sld');
      if (blocks.length === 0) {
        // trang scan: ảnh (nếu trích được) nằm DƯỚI, badge OCR đè trên — xem `scanBadgeText`.
        slides.push({
          id: slideId,
          background: '#ffffff',
          backgroundImage: null,
          templateId: 'pdf-import-scan',
          elements: [...imageEls, scanBadgeText(n)],
        });
        scanPages.push(n);
      } else {
        let maxFontSize = -Infinity;
        for (const b of blocks) maxFontSize = Math.max(maxFontSize, b.fontSize);
        const textEls = blocks.map((b) => blockToTextElement(b, pageW, pageH, b.fontSize === maxFontSize));
        slides.push({
          id: slideId,
          background: '#ffffff',
          backgroundImage: null,
          templateId: 'pdf-import',
          // thứ tự mảng = thứ tự vẽ (model.ts) — ảnh TRƯỚC chữ ⇒ ảnh DƯỚI chữ (phiếu ④.2).
          elements: [...imageEls, ...textEls],
        });
      }
      for (let k = 0; k < imageEls.length; k += 1) {
        pendingAttach.push({ slideId, elementId: imageEls[k].id, assetId: imageAssetIds[k] });
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

  // D1 — gắn element ↔ asset qua API CHUẨN `attachElementToAsset` (phiếu ④.1): đồng bộ src từ
  // asset + reset crop, đúng một đường với mọi chỗ khác của app. Deck "vỏ" chỉ mượn 2 field
  // slides + linkedAssets — 2 field DUY NHẤT hàm đó đọc/ghi (đã đọc linked-assets.ts xác nhận);
  // cast có chủ ý, không rò ra ngoài hàm này.
  if (pendingAttach.length > 0) {
    let shell = { slides: [...slides], linkedAssets } as unknown as EditorDeck;
    for (const p of pendingAttach) shell = attachElementToAsset(shell, p.slideId, p.elementId, p.assetId);
    slides.splice(0, slides.length, ...shell.slides);
  }

  if (slides.length > 0) {
    slides[0] = { ...slides[0], elements: [provenanceNote(fileLabel), ...slides[0].elements] };
  }

  // D1b — deck ôm quá nhiều byte ảnh nhúng (không có/không dùng được đường kho) → cảnh báo 1 dòng,
  // khai thật thay vì để người dùng gặp "Invalid string length"/tab chết mà không biết vì sao.
  // page: 0 = cảnh báo CẤP FILE, không thuộc trang nào.
  if (embeddedBytes > EMBEDDED_IMAGE_WARN_BYTES) {
    imageWarnings.push({
      page: 0,
      reason: `tổng ảnh nhúng thẳng vào deck ~${Math.round(embeddedBytes / 1048576)}MB (ngưỡng ${Math.round(EMBEDDED_IMAGE_WARN_BYTES / 1048576)}MB) — nên nhập qua app (ảnh tự đẩy ra Thư viện) hoặc chọn ít trang hơn`,
    });
  }

  return { slides, total, converted: slides.length + warnings.length, scanPages, warnings, linkedAssets, imageWarnings };
}

/**
 * Câu báo kết quả cho người dùng — 1 nguồn duy nhất (Toolbar gọi), khuôn giống hệt
 * `pptx-import.ts#importSummary`. Nói THẲNG giới hạn còn lại (nền raster nợ 1b) — không giấu.
 * D1: có lớp ảnh rồi thì câu chữ phải nói đúng — "CHỈ lớp CHỮ" chỉ còn đúng khi file 0 ảnh.
 */
export function pdfImportSummary(fileName: string, res: PdfImportResult): string {
  const rangeNote = res.slides.length + res.warnings.length < res.total ? ` (đã chọn ${res.slides.length + res.warnings.length}/${res.total} trang)` : '';
  let imgCount = 0;
  for (const s of res.slides) for (const e of s.elements) if (e.kind === 'image') imgCount += 1;
  const layerNote = imgCount > 0 ? `lớp CHỮ sống + ${imgCount} ảnh nhúng` : 'CHỈ lớp CHỮ sống';
  const scanNote = res.scanPages.length
    ? ` ${res.scanPages.length} trang scan cần OCR (bậc 2): trang ${res.scanPages.join(', ')}.`
    : '';
  const warnNote = res.warnings.length
    ? ` Bỏ qua ${res.warnings.length} trang lỗi: ${res.warnings.map((w) => w.page).join(', ')}.`
    : '';
  const imgWarnNote = res.imageWarnings.length
    ? ` ${res.imageWarnings.length} ảnh nhúng không trích được (trang vẫn giữ nguyên phần chữ).`
    : '';
  return (
    `Đã nhập ${res.slides.length} trang từ "${fileName}"${rangeNote} — ${layerNote} ` +
    `(chưa raster hoá nền gốc, cần thêm bộ render ảnh — xem báo cáo).${scanNote}${warnNote}${imgWarnNote}`
  );
}
