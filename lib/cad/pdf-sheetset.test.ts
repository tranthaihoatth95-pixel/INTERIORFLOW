/**
 * lib/cad/pdf-sheetset.test.ts — 2.1.8.k: xuất BỘ HỒ SƠ nhiều tờ thành 1 PDF có mục lục.
 * Cây khai trước đây "chưa xác minh cơ chế mục lục" — verify: `buildSheetSetPdf()` dựng ĐÚNG
 * 1 (trang mục lục) + N (1 trang/tờ) trang, mỗi tờ giữ paperKey/printScale RIÊNG (không ép
 * chung 1 khổ), và outline (bookmark) trỏ đúng thứ tự trang.
 *
 * PaperKey thật chỉ có 'A3'|'A2'|'A1' (lib/cad/model.ts:490) — ticket gốc ghi "A2/A3/A4" nhưng
 * A4 KHÔNG tồn tại trong type này (xác nhận 30/07); dùng A1/A2/A3 (3 khổ thật, vẫn đúng tinh
 * thần "3 tờ khác khổ").
 *
 * Chạy: node_modules/.bin/sucrase-node lib/cad/pdf-sheetset.test.ts
 */
import { emptyDoc, PAPER_SIZES_MM } from './model';
import type { Doc } from './model';
import { newId } from './store';
import { buildSheetSetPdf, type SheetSetEntry } from './pdf';

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

function docWithLine(paperKey: 'A1' | 'A2' | 'A3', len: number): Doc {
  const doc: Doc = emptyDoc();
  doc.paperKey = paperKey;
  const wall = doc.layers[0].id;
  doc.entities.push({ id: newId('e'), type: 'line', layer: wall, a: { x: 0, y: 0 }, b: { x: len, y: 0 } });
  return doc;
}

async function testThreeSheetsDifferentPaperFourPages() {
  console.log('\n[1] 3 tờ khác khổ (A1/A2/A3) → 4 trang (1 mục lục + 3 tờ), đúng thứ tự');
  const sheets: SheetSetEntry[] = [
    { id: 's1', name: 'Mặt bằng tầng 1', doc: docWithLine('A2', 3200) },
    { id: 's2', name: 'Mặt bằng tầng 2', doc: docWithLine('A3', 4000) },
    { id: 's3', name: 'Mặt cắt A-A', doc: docWithLine('A1', 5000) },
  ];

  const pdf = await buildSheetSetPdf(sheets, { title: 'Bộ hồ sơ — dự án test' });
  ok('buildSheetSetPdf() trả về instance có .output()', typeof pdf?.output === 'function');

  const totalPages = (pdf as unknown as { internal: { pages: unknown[] } }).internal.pages.length - 1;
  // jsPDF nội bộ: pages[0] rỗng (placeholder), pages[1..N] là N trang thật — trừ đi 1.
  console.log(`    tổng số trang thật: ${totalPages}`);
  ok('4 trang: 1 mục lục + 3 tờ', totalPages === 4);

  // Mỗi trang khớp ĐÚNG khổ giấy RIÊNG của tờ đó (không ép chung 1 khổ) — trang 1 là mục lục A4
  // dọc (210×297), trang 2/3/4 là A2/A3/A1 theo đúng thứ tự sheets[] (đúng "thứ tự tab").
  // mediaBox là PDF POINT (1/72"), không phải mm — đổi lại mm (25.4/72) trước khi so khớp.
  const PT_TO_MM = 25.4 / 72;
  const getPageInfo = (pdf as unknown as { internal: { getPageInfo(n: number): { pageContext: { mediaBox: { topRightX: number; topRightY: number } } } } }).internal.getPageInfo;
  const dims = (n: number) => {
    const mb = getPageInfo(n).pageContext.mediaBox;
    return [Math.round(mb.topRightX * PT_TO_MM), Math.round(mb.topRightY * PT_TO_MM)];
  };
  const [tocW, tocH] = dims(1);
  ok(`trang 1 (mục lục) = A4 dọc 210×297mm — thật ${tocW}×${tocH}`, tocW === 210 && tocH === 297);

  const expectedPaper: Record<number, [number, number]> = { 2: PAPER_SIZES_MM.A2, 3: PAPER_SIZES_MM.A3, 4: PAPER_SIZES_MM.A1 };
  for (const pageNo of [2, 3, 4]) {
    const [w, h] = dims(pageNo);
    const [ew, eh] = expectedPaper[pageNo];
    console.log(`    trang ${pageNo}: mong đợi ${ew}×${eh} — thật ${w}×${h}`);
    ok(`trang ${pageNo} đúng khổ giấy riêng của tờ (không ép chung 1 khổ)`, w === ew && h === eh);
  }

  // Bookmark (outline) — 1 mục cho mục lục + 3 mục cho 3 tờ, đúng tên + đúng số trang.
  const outlineChildren = (pdf as unknown as { outline: { root: { children: { title: string; options: { pageNumber: number } }[] } } }).outline.root.children;
  ok('outline có 4 mục (mục lục + 3 tờ)', outlineChildren.length === 4);
  ok('bookmark trang 1 = tiêu đề mục lục truyền vào', outlineChildren[0].options.pageNumber === 1 && outlineChildren[0].title === 'Bộ hồ sơ — dự án test');
  ok('bookmark tờ 1 → tên "Mặt bằng tầng 1", trang 2', outlineChildren[1].title === 'Mặt bằng tầng 1' && outlineChildren[1].options.pageNumber === 2);
  ok('bookmark tờ 2 → tên "Mặt bằng tầng 2", trang 3', outlineChildren[2].title === 'Mặt bằng tầng 2' && outlineChildren[2].options.pageNumber === 3);
  ok('bookmark tờ 3 → tên "Mặt cắt A-A", trang 4', outlineChildren[3].title === 'Mặt cắt A-A' && outlineChildren[3].options.pageNumber === 4);
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
  await testThreeSheetsDifferentPaperFourPages();
  await testEmptySheetsStillProducesTocOnly();
  console.log(`\n${pass} ok, ${fail} fail`);
  if (fail > 0) process.exit(1);
}

void main();
