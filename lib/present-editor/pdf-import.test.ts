/**
 * lib/present-editor/pdf-import.test.ts — kiểm việc ĐỌC `.pdf` thành slide IF. Chạy:
 *   node_modules/.bin/sucrase-node lib/present-editor/pdf-import.test.ts
 * (cùng lệnh mà `npm test` dùng cho mọi *.test.ts — xem package.json "test").
 *
 * Fixture `__fixtures__/pdf-import-sample.pdf` (960 byte) là PDF VIẾT TAY (không phải file dự án
 * khách — tự soạn, xem lệnh dựng ở cuối comment này để tái tạo nếu cần) — 2 trang, khổ 400×800pt:
 *   trang 1 — tiêu đề "Cà Phê Sáng" (28pt, có dấu tiếng Việt trong bảng WinAnsiEncoding) tại
 *             (72,700); khối thân 2 dòng "Ly ca cao nay" / "rat la ngon" (14pt, cách nhau 18pt —
 *             CÙNG khối); đoạn tách rời "Doan tach rieng biet" (12pt) cách xa phía dưới.
 *   trang 2 — content stream RỖNG (không toán tử vẽ chữ nào) → trang SCAN, phải ra badge OCR.
 *
 * Test tầng ①②③: (a) unit gom DÒNG/KHỐI bằng item object viết tay (không đụng `unpdf`) — kiểm
 * đúng ranh giới hasEOL/khoảng cách Y; (b) `pdfToDeck` chạy THẬT trên fixture — soi số trang, số
 * khối, text/frame/fontSize từng khối, trang scan ra badge, dấu tiếng Việt giữ nguyên, provenance
 * ẩn ở slide đầu; (c) `parsePageRangeInput`/`clampPageRange` thuần.
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  pdfToDeck,
  pdfPageCount,
  pdfImportSummary,
  groupIntoLines,
  linesToBlocks,
  groupItemsIntoBlocks,
  blockToFrame,
  fontSizeToPct,
  clampPageRange,
  parsePageRangeInput,
  PDF_RANGE_PROMPT_THRESHOLD,
  type PdfTextItem,
} from './pdf-import';
import type { TextElement } from './model';

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
function near(a: number, b: number, eps = 0.5) {
  return Math.abs(a - b) <= eps;
}

function item(partial: Partial<PdfTextItem>): PdfTextItem {
  return {
    str: '',
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    fontSize: 12,
    fontFamily: 'sans-serif',
    hasEOL: false,
    ...partial,
  };
}

(async () => {
  /* ── ① gom DÒNG (thuần, item viết tay) ── */
  {
    // 2 item cùng dòng nối bởi hasEOL=false ở item cuối dòng (dòng vẫn chưa đóng cho tới hasEOL
    // hoặc y nhảy) — mô phỏng 1 dòng bị tách do đổi style giữa dòng.
    const items = [
      item({ str: 'Hello ', x: 0, y: 100, width: 30, height: 12, hasEOL: false }),
      item({ str: 'World', x: 30, y: 100, width: 30, height: 12, hasEOL: true }),
      item({ str: 'Dong hai', x: 0, y: 80, width: 40, height: 12, hasEOL: true }),
    ];
    const lines = groupIntoLines(items);
    ok('gom đúng 2 dòng', lines.length === 2);
    ok('dòng 1 gồm 2 item (nối bởi vị trí Y gần nhau)', lines[0]?.length === 2);
    ok('dòng 2 tách đúng theo hasEOL của item trước', lines[1]?.[0]?.str === 'Dong hai');
  }

  /* ── item rỗng (marker ngắt khối của pdf.js) bị lọc khỏi dòng ── */
  {
    const items = [
      item({ str: '', x: 0, y: 50, width: 0, height: 0, hasEOL: true }),
      item({ str: 'Chu that', x: 0, y: 50, width: 40, height: 12 }),
    ];
    const lines = groupIntoLines(items);
    ok('item str rỗng bị lọc, không sinh dòng trống', lines.length === 1 && lines[0].length === 1);
  }

  /* ── ② gom KHỐI theo khoảng cách dọc + trôi mép trái ── */
  {
    const closeLines = [
      [item({ str: 'Dong 1', x: 10, y: 100, width: 40, height: 14, fontSize: 14 })],
      [item({ str: 'Dong 2', x: 10, y: 84, width: 40, height: 14, fontSize: 14 })], // cách 2pt < 14pt ngưỡng
    ];
    const blocks = linesToBlocks(closeLines);
    ok('2 dòng sát nhau gộp 1 khối', blocks.length === 1 && blocks[0].text === 'Dong 1\nDong 2');

    const farLines = [
      [item({ str: 'Dong 1', x: 10, y: 100, width: 40, height: 14, fontSize: 14 })],
      [item({ str: 'Dong xa', x: 10, y: 40, width: 40, height: 14, fontSize: 14 })], // cách rất xa
    ];
    ok('2 dòng cách xa tách 2 khối', linesToBlocks(farLines).length === 2);

    const driftLines = [
      [item({ str: 'Cot trai', x: 10, y: 100, width: 40, height: 14, fontSize: 14 })],
      [item({ str: 'Cot phai', x: 300, y: 98, width: 40, height: 14, fontSize: 14 })], // gần Y nhưng lệch trái xa (2 cột)
    ];
    ok('2 dòng cùng hàng nhưng lệch cột không gộp (chặn nhầm 2 cột)', linesToBlocks(driftLines).length === 2);
  }

  /* ── quy đổi frame/fontSize % sân khấu ── */
  {
    const blocks = groupItemsIntoBlocks([
      item({ str: 'Tieu de', x: 100, y: 700, width: 80, height: 20, fontSize: 20 }),
    ]);
    const frame = blockToFrame(blocks[0], 400, 800);
    // x=100/400=25% · w padded > 80/400=20% · y=(800-720)/800=10% · h padded > 20/800=2.5%
    ok('frame.x đúng %', near(frame.x, 25, 0.5));
    ok('frame.y đúng % (quy đổi từ gốc dưới-trái PDF sang top-left Frame)', near(frame.y, 10, 0.5));
    ok('frame.w có đệm an toàn (>= raw)', frame.w >= 20);
    ok('frame.h có đệm an toàn (>= raw)', frame.h >= 2.5);
    ok('fontSizeToPct đúng công thức % chiều cao', near(fontSizeToPct(20, 800), 2.5, 0.01));
  }

  /* ── phạm vi trang ── */
  {
    ok('clampPageRange rỗng = cả file', JSON.stringify(clampPageRange(undefined, 50)) === '{"start":1,"end":50}');
    ok('clampPageRange kẹp trong [1,total]', JSON.stringify(clampPageRange({ start: -5, end: 999 }, 50)) === '{"start":1,"end":50}');
    ok('clampPageRange start>end tự sửa', clampPageRange({ start: 40, end: 10 }, 50).end >= 40);
    ok('parsePageRangeInput "5-10"', JSON.stringify(parsePageRangeInput('5-10', 50)) === '{"start":5,"end":10}');
    ok('parsePageRangeInput "5"', JSON.stringify(parsePageRangeInput('5', 50)) === '{"start":5,"end":5}');
    ok('parsePageRangeInput rỗng = null (tất cả)', parsePageRangeInput('', 50) === null);
    ok('parsePageRangeInput không hiểu = null (không chặn)', parsePageRangeInput('lung tung', 50) === null);
    ok('ngưỡng hỏi phạm vi = 30 trang', PDF_RANGE_PROMPT_THRESHOLD === 30);
  }

  /* ── vòng tròn thật: đọc fixture PDF viết tay ── */
  {
    const fixturePath = join(process.cwd(), 'lib/present-editor/__fixtures__/pdf-import-sample.pdf');
    const bytes = new Uint8Array(readFileSync(fixturePath));
    const progressCalls: Array<[number, number]> = [];
    const res = await pdfToDeck(bytes, {
      fileName: 'ho-so-mau.pdf',
      onProgress: (done, total) => progressCalls.push([done, total]),
    });

    ok('total = 2 trang', res.total === 2);
    ok('2 slide ra đời', res.slides.length === 2);
    ok('không trang nào lỗi', res.warnings.length === 0);
    ok('trang 2 được đánh dấu scan', res.scanPages.length === 1 && res.scanPages[0] === 2);
    ok('onProgress gọi đúng 2 lần (2 trang)', progressCalls.length === 2);
    ok('onProgress báo done cuối = total phạm vi', progressCalls[1]?.[0] === 2 && progressCalls[1]?.[1] === 2);

    const slide1 = res.slides[0];
    ok('slide 1 templateId = pdf-import', slide1.templateId === 'pdf-import');
    ok('slide 1 nền trắng phẳng (không có ảnh nền — xem docstring lệch phiếu)', slide1.background === '#ffffff' && !slide1.backgroundImage);

    const texts = slide1.elements.filter((e): e is TextElement => e.kind === 'text');
    // element đầu là provenance ẨN, không tính vào "khối chữ thấy được"
    const provenance = texts[0];
    ok('provenance note ẩn + khoá', provenance.hidden === true && provenance.locked === true);
    ok('provenance có tên file thật', provenance.text.includes('ho-so-mau.pdf'));

    const visible = texts.slice(1);
    ok('3 khối chữ thấy được (tiêu đề · khối 2 dòng · đoạn riêng)', visible.length === 3);
    ok('tiêu đề giữ ĐÚNG dấu tiếng Việt "Cà Phê Sáng"', visible[0]?.text === 'Cà Phê Sáng');
    ok('tiêu đề được gán role title (cỡ chữ lớn nhất trang)', visible[0]?.role === 'title');
    ok('khối thân 2 dòng gộp đúng \\n', visible[1]?.text === 'Ly ca cao nay\nrat la ngon');
    ok('đoạn tách rời không lẫn vào khối thân', visible[2]?.text === 'Doan tach rieng biet');
    ok('khối thân role=body (không phải title)', visible[1]?.role === 'body');
    ok('cỡ chữ tiêu đề (28pt/800pt) > cỡ chữ đoạn thân (14pt/800pt)', (visible[0]?.fontSize ?? 0) > (visible[1]?.fontSize ?? 0));

    const slide2 = res.slides[1];
    ok('slide 2 (scan) templateId = pdf-import-scan', slide2.templateId === 'pdf-import-scan');
    const badge = slide2.elements[0] as TextElement;
    ok('slide 2 có badge "cần OCR (bậc 2)"', badge.text.includes('cần OCR (bậc 2)'));
    ok('slide 2 không bịa chữ nào khác ngoài badge', slide2.elements.length === 1);

    const summary = pdfImportSummary('ho-so-mau.pdf', res);
    ok('summary nói thẳng "CHỈ lớp CHỮ"', summary.includes('CHỈ lớp CHỮ'));
    ok('summary nêu trang scan', summary.includes('trang scan cần OCR'));
  }

  /* ── pdfPageCount đếm nhanh không trích chữ ── */
  {
    const fixturePath = join(process.cwd(), 'lib/present-editor/__fixtures__/pdf-import-sample.pdf');
    const bytes = new Uint8Array(readFileSync(fixturePath));
    ok('pdfPageCount = 2', (await pdfPageCount(bytes)) === 2);
  }

  /* ── phạm vi trang cắt đúng khi chỉ chọn 1 trang trong 2 ── */
  {
    const fixturePath = join(process.cwd(), 'lib/present-editor/__fixtures__/pdf-import-sample.pdf');
    const bytes = new Uint8Array(readFileSync(fixturePath));
    const res = await pdfToDeck(bytes, { pageRange: { start: 1, end: 1 } });
    ok('phạm vi chỉ 1 trang → 1 slide, total vẫn = 2', res.slides.length === 1 && res.total === 2);
  }

  /* ── BẮT THẬT bằng browser sống 13/08: gọi pdfPageCount RỒI pdfToDeck trên CÙNG một buffer
   * (đúng thứ tự Toolbar.tsx#openPdfFile làm) từng ném "Cannot perform Construct on a detached
   * ArrayBuffer" vì unpdf/pdf.js transfer buffer gốc sang worker (detach nó). Sửa bằng `ownedCopy`
   * (.slice() trước khi đưa unpdf) — test này KHOÁ LẠI hành vi, không cho tái phát. ── */
  {
    const fixturePath = join(process.cwd(), 'lib/present-editor/__fixtures__/pdf-import-sample.pdf');
    const sharedBuf = readFileSync(fixturePath).buffer as ArrayBuffer; // 1 ArrayBuffer DÙNG CHUNG
    let threw = false;
    let total = 0;
    let slideCount = 0;
    try {
      total = await pdfPageCount(sharedBuf);
      const res2 = await pdfToDeck(sharedBuf); // CÙNG buffer — trước đây detach ở đây
      slideCount = res2.slides.length;
    } catch {
      threw = true;
    }
    ok('gọi lại pdfPageCount→pdfToDeck trên CÙNG buffer KHÔNG ném lỗi detached', !threw);
    ok('cả 2 lệnh gọi vẫn ra đúng số liệu (2 trang, 2 slide)', total === 2 && slideCount === 2);
  }

  /* ── file không phải PDF hợp lệ → ném lỗi rõ ràng ── */
  {
    let threw = false;
    try {
      await pdfToDeck(new Uint8Array([0, 1, 2, 3]));
    } catch (err) {
      threw = err instanceof Error && /Không mở được PDF/.test(err.message);
    }
    ok('bytes rác → ném lỗi tiếng Việt rõ ràng', threw);
  }

  console.log(`\n${pass} pass · ${fail} fail`);
  if (fail > 0) process.exit(1);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
