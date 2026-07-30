/**
 * lib/cad/pdf-sheetset.test.ts — 2.1.8.k: xuất BỘ HỒ SƠ nhiều tờ thành 1 PDF có mục lục.
 * Cây khai trước đây "chưa xác minh cơ chế mục lục" — verify: `buildSheetSetPdf()` dựng ĐÚNG
 * 1 (trang mục lục) + N (1 trang/tờ) trang, mỗi tờ giữ paperKey/printScale RIÊNG (không ép
 * chung 1 khổ), và outline (bookmark) trỏ đúng thứ tự trang.
 *
 * 2.1.8.m (30/07, Luật #10) — PaperKey nay đủ A0-A4, khổ/hướng TÁCH TRỤC ĐỘC LẬP (xem model.ts).
 * Test [1] dùng đúng 3 khổ A2/A3/A4 như brief gốc yêu cầu (A4 lúc viết `2.1.8.k` CHƯA tồn tại,
 * nay đã có) — VÀ trộn cả hướng mặc định lẫn hướng ghi đè tường minh, đúng tinh thần "3 tờ khác
 * khổ khác hướng" của `2.1.8.m`.
 *
 * Chạy: node_modules/.bin/sucrase-node lib/cad/pdf-sheetset.test.ts
 */
import { emptyDoc, paperSizeMm, defaultPaperOrientation } from './model';
import type { Doc, PaperKey, PaperOrientation } from './model';
import { newId } from './store';
import { buildSheetSetPdf, paperKeyOrientationLabel, type SheetSetEntry } from './pdf';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) {
    pass += 1;
    console.log(`  ok  - ${label}`);
  } else {
    fail += 1;
    console.log(`  FAIL - ${label}`);
  }
}

function docWithLine(paperKey: PaperKey, len: number, orientation?: PaperOrientation): Doc {
  const doc: Doc = emptyDoc();
  doc.paperKey = paperKey;
  if (orientation) doc.paperOrientation = orientation;
  const wall = doc.layers[0].id;
  doc.entities.push({ id: newId('e'), type: 'line', layer: wall, a: { x: 0, y: 0 }, b: { x: len, y: 0 } });
  return doc;
}

async function testThreeSheetsDifferentPaperAndOrientationFourPages() {
  console.log('\n[1] 3 tờ khác khổ KHÁC HƯỚNG (A2 ngang mặc định · A4 dọc mặc định · A1 ngang ghi đè) → 4 trang đúng khổ đúng hướng, đúng thứ tự');
  const sheets: SheetSetEntry[] = [
    { id: 's1', name: 'Mặt bằng tầng 1', doc: docWithLine('A2', 3200) }, // mặc định NGANG (ISO 5457)
    { id: 's2', name: 'Bảng vật liệu', doc: docWithLine('A4', 1000) }, // mặc định DỌC (ISO 5457)
    { id: 's3', name: 'Mặt cắt A-A', doc: docWithLine('A1', 5000, 'landscape') }, // ghi đè tường minh
  ];

  const pdf = await buildSheetSetPdf(sheets, { title: 'Bộ hồ sơ — dự án test' });
  ok('buildSheetSetPdf() trả về instance có .output()', typeof pdf?.output === 'function');

  const totalPages = (pdf as unknown as { internal: { pages: unknown[] } }).internal.pages.length - 1;
  // jsPDF nội bộ: pages[0] rỗng (placeholder), pages[1..N] là N trang thật — trừ đi 1.
  console.log(`    tổng số trang thật: ${totalPages}`);
  ok('4 trang: 1 mục lục + 3 tờ', totalPages === 4);

  // Mỗi trang khớp ĐÚNG khổ giấy + hướng RIÊNG của tờ đó (không ép chung 1 khổ/1 hướng) — trang 1
  // là mục lục A4 dọc (210×297), trang 2/3/4 theo đúng thứ tự sheets[] (đúng "thứ tự tab").
  // mediaBox là PDF POINT (1/72"), không phải mm — đổi lại mm (25.4/72) trước khi so khớp.
  const PT_TO_MM = 25.4 / 72;
  const getPageInfo = (pdf as unknown as { internal: { getPageInfo(n: number): { pageContext: { mediaBox: { topRightX: number; topRightY: number } } } } }).internal.getPageInfo;
  const dims = (n: number) => {
    const mb = getPageInfo(n).pageContext.mediaBox;
    return [Math.round(mb.topRightX * PT_TO_MM), Math.round(mb.topRightY * PT_TO_MM)];
  };
  const [tocW, tocH] = dims(1);
  ok(`trang 1 (mục lục) = A4 dọc 210×297mm — thật ${tocW}×${tocH}`, tocW === 210 && tocH === 297);

  const expectedPaper: Record<number, [number, number]> = {
    2: paperSizeMm('A2', defaultPaperOrientation('A2')), // ngang mặc định
    3: paperSizeMm('A4', defaultPaperOrientation('A4')), // dọc mặc định — khác hướng trang 2/4
    4: paperSizeMm('A1', 'landscape'), // ghi đè tường minh
  };
  for (const pageNo of [2, 3, 4]) {
    const [w, h] = dims(pageNo);
    const [ew, eh] = expectedPaper[pageNo];
    console.log(`    trang ${pageNo}: mong đợi ${ew}×${eh} — thật ${w}×${h}`);
    ok(`trang ${pageNo} đúng khổ giấy + hướng riêng của tờ (không ép chung)`, w === ew && h === eh);
  }
  // Xác nhận trang 3 (A4) THẬT SỰ dọc (w<h) trong khi trang 2/4 ngang (w>h) — đúng nghĩa "khác hướng".
  ok('trang 2 (A2) NGANG — w > h', dims(2)[0] > dims(2)[1]);
  ok('trang 3 (A4) DỌC — w < h', dims(3)[0] < dims(3)[1]);
  ok('trang 4 (A1) NGANG — w > h', dims(4)[0] > dims(4)[1]);

  // Bookmark (outline) — 1 mục cho mục lục + 3 mục cho 3 tờ, đúng tên + đúng số trang.
  const outlineChildren = (pdf as unknown as { outline: { root: { children: { title: string; options: { pageNumber: number } }[] } } }).outline.root.children;
  ok('outline có 4 mục (mục lục + 3 tờ)', outlineChildren.length === 4);
  ok('bookmark trang 1 = tiêu đề mục lục truyền vào', outlineChildren[0].options.pageNumber === 1 && outlineChildren[0].title === 'Bộ hồ sơ — dự án test');
  ok('bookmark tờ 1 → tên "Mặt bằng tầng 1", trang 2', outlineChildren[1].title === 'Mặt bằng tầng 1' && outlineChildren[1].options.pageNumber === 2);
  ok('bookmark tờ 2 → tên "Bảng vật liệu", trang 3', outlineChildren[2].title === 'Bảng vật liệu' && outlineChildren[2].options.pageNumber === 3);
  ok('bookmark tờ 3 → tên "Mặt cắt A-A", trang 4', outlineChildren[3].title === 'Mặt cắt A-A' && outlineChildren[3].options.pageNumber === 4);
}

/**
 * Mục lục phải in CẢ khổ LẪN hướng ("A4 · Dọc"), không chỉ tên khổ. `buildSheetSetPdf()` gọi
 * `paperKeyOrientationLabel()` (export riêng ở pdf.ts) để dựng chuỗi này — test THẲNG hàm thuần
 * đó, KHÔNG spy `jsPDF.prototype.text` (đã thử, KHÔNG hoạt động: jsPDF gắn `text` làm
 * own-property mỗi instance trong constructor, không qua prototype — patch prototype là no-op,
 * xác nhận bằng `node -e` 30/07). Test hàm nguồn trực tiếp vừa đúng vừa mạnh hơn spy rendering.
 */
function testTocPrintsOrientationLabel() {
  console.log('\n[3] Mục lục in "Khổ · Hướng" (VD "A4 · Dọc"), không chỉ tên khổ');
  const docDefault = docWithLine('A4', 1000); // không set paperOrientation → mặc định ISO 5457
  ok('A4 mặc định → "A4 · Dọc"', paperKeyOrientationLabel(docDefault) === 'A4 · Dọc');
  const docLandscape = docWithLine('A4', 1000, 'landscape');
  ok('A4 + landscape ghi đè → "A4 · Ngang"', paperKeyOrientationLabel(docLandscape) === 'A4 · Ngang');
  const docA2 = docWithLine('A2', 1000);
  ok('A2 mặc định → "A2 · Ngang"', paperKeyOrientationLabel(docA2) === 'A2 · Ngang');
}

async function testEmptySheetsStillProducesTocOnly() {
  console.log('\n[2] 0 tờ — vẫn dựng được PDF chỉ có trang mục lục (không throw, không crash)');
  let threw = false;
  let pdf: Awaited<ReturnType<typeof buildSheetSetPdf>> | null = null;
  try {
    pdf = await buildSheetSetPdf([], {});
  } catch (err) {
    threw = true;
    console.log('    lỗi:', err);
  }
  ok('buildSheetSetPdf([]) không throw', !threw);
  const totalPages = pdf ? (pdf as unknown as { internal: { pages: unknown[] } }).internal.pages.length - 1 : 0;
  ok('0 tờ → đúng 1 trang (chỉ mục lục)', totalPages === 1);
}

async function main() {
  await testThreeSheetsDifferentPaperAndOrientationFourPages();
  await testEmptySheetsStillProducesTocOnly();
  testTocPrintsOrientationLabel();
  console.log(`\n${pass} ok, ${fail} fail`);
  if (fail > 0) process.exit(1);
}

void main();
