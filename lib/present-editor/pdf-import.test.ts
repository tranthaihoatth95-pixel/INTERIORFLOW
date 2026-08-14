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
 *
 * D1 (phiếu `docs/phieu-giao/demo-d1-pdf-anh.md`) thêm tầng ②b + round-trip ẢNH: (d) unit PNG
 * encoder/hash/CTM thuần; (e) fixture PDF CÓ ẢNH NHÚNG dựng NGAY TRONG TEST (`buildImagePdf` —
 * PDF viết tay bằng code, ảnh 2×2 DeviceRGB không filter, KHÔNG file nhị phân mới, KHÔNG mạng):
 * trang 1 = ảnh đặt `200 0 0 100 50 600 cm` + 1 dòng chữ; trang 2 = CÙNG ảnh (XObject dùng
 * chung), KHÔNG chữ → trang scan có ảnh. Kiểm: n ảnh vào → n element, assetId TẤT ĐỊNH (2 trang
 * trùng ảnh = 1 asset, 2 lần chạy = cùng id), provenance file/trang/bbox đúng, z ảnh dưới chữ.
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
  rawPixelsToPngDataUrl,
  pdfImageAssetId,
  ctmToImageBbox,
  mtxConcat,
  imageBboxToFrame,
  PDF_RANGE_PROMPT_THRESHOLD,
  type PdfMatrix,
  type PdfTextItem,
} from './pdf-import';
import type { ImageElement, TextElement } from './model';

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

/* ══════════════ D1 — fixture PDF CÓ ẢNH, dựng ngay trong test ══════════════
 * PDF viết tay bằng code (không file nhị phân mới, không mạng): 2 trang 400×800pt dùng CHUNG một
 * XObject ảnh 2×2 DeviceRGB 8-bit KHÔNG filter (12 byte pixel thô — pdf.js giải mã tất định).
 *   trang 1: `q 200 0 0 100 50 600 cm /Im1 Do Q` (bbox 50,600→250,700) + chữ "Tieu de anh" 20pt.
 *   trang 2: `q 100 0 0 50 150 200 cm /Im1 Do Q` — KHÔNG chữ → trang scan CÓ ảnh.
 * Offset xref tính thật từng byte (pdf.js vẫn tự phục hồi được nếu lệch, nhưng ta không dựa vào đó). */
function latin1(s: string): Uint8Array {
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i += 1) out[i] = s.charCodeAt(i) & 0xff;
  return out;
}

function buildImagePdf(): Uint8Array {
  const pixels = new Uint8Array([255, 0, 0, 0, 255, 0, 0, 0, 255, 255, 255, 255]); // 2×2 RGB
  const content1 = 'q\n200 0 0 100 50 600 cm\n/Im1 Do\nQ\nBT /F1 20 Tf 72 300 Td (Tieu de anh) Tj ET\n';
  const content2 = 'q\n100 0 0 50 150 200 cm\n/Im1 Do\nQ\n';
  const chunks: Uint8Array[] = [];
  let offset = 0;
  const offsets: number[] = [];
  const push = (b: Uint8Array | string) => {
    const u = typeof b === 'string' ? latin1(b) : b;
    chunks.push(u);
    offset += u.length;
  };
  const obj = (n: number, body: string) => {
    offsets[n] = offset;
    push(`${n} 0 obj\n${body}\nendobj\n`);
  };
  push('%PDF-1.4\n');
  obj(1, '<< /Type /Catalog /Pages 2 0 R >>');
  obj(2, '<< /Type /Pages /Kids [3 0 R 5 0 R] /Count 2 >>');
  obj(3, '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 400 800] /Resources << /XObject << /Im1 7 0 R >> /Font << /F1 8 0 R >> >> /Contents 4 0 R >>');
  obj(4, `<< /Length ${content1.length} >>\nstream\n${content1}endstream`);
  obj(5, '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 400 800] /Resources << /XObject << /Im1 7 0 R >> >> /Contents 6 0 R >>');
  obj(6, `<< /Length ${content2.length} >>\nstream\n${content2}endstream`);
  offsets[7] = offset; // obj 7 chứa byte NHỊ PHÂN — ghép tay, không đi qua template chuỗi
  push(`7 0 obj\n<< /Type /XObject /Subtype /Image /Width 2 /Height 2 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Length ${pixels.length} >>\nstream\n`);
  push(pixels);
  push('\nendstream\nendobj\n');
  obj(8, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  const xrefOff = offset;
  let xref = 'xref\n0 9\n0000000000 65535 f \n';
  for (let n = 1; n <= 8; n += 1) xref += `${String(offsets[n]).padStart(10, '0')} 00000 n \n`;
  push(`${xref}trailer\n<< /Size 9 /Root 1 0 R >>\nstartxref\n${xrefOff}\n%%EOF\n`);
  const out = new Uint8Array(offset);
  let o = 0;
  for (const c of chunks) {
    out.set(c, o);
    o += c.length;
  }
  return out;
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

  /* ══════════════ D1 — LỚP ẢNH ══════════════ */

  /* ── ②b PNG encoder thuần: tất định + đúng khuôn PNG ── */
  {
    const px = new Uint8Array([255, 0, 0, 0, 255, 0, 0, 0, 255, 255, 255, 255]); // 2×2 RGB
    const url1 = rawPixelsToPngDataUrl(px, 2, 2, 3);
    const url2 = rawPixelsToPngDataUrl(px, 2, 2, 3);
    ok('PNG dataURL đúng tiền tố chữ ký PNG (iVBOR = \\x89PNG)', url1.startsWith('data:image/png;base64,iVBOR'));
    ok('PNG encoder tất định — 2 lần encode y hệt nhau', url1 === url2);
    ok('grayscale 1 kênh cũng encode được', rawPixelsToPngDataUrl(new Uint8Array([0, 128, 200, 255]), 2, 2, 1).startsWith('data:image/png;base64,iVBOR'));
  }

  /* ── ②b hash assetId tất định theo NỘI DUNG ── */
  {
    const a = new Uint8Array([1, 2, 3, 4, 5, 6]);
    const b = new Uint8Array([1, 2, 3, 4, 5, 7]);
    ok('cùng pixel → cùng assetId', pdfImageAssetId(a, 2, 1, 3) === pdfImageAssetId(a.slice(), 2, 1, 3));
    ok('khác pixel → khác assetId', pdfImageAssetId(a, 2, 1, 3) !== pdfImageAssetId(b, 2, 1, 3));
    ok('assetId đúng khuôn img_pdf_ + 16 hex', /^img_pdf_[0-9a-f]{16}$/.test(pdfImageAssetId(a, 2, 1, 3)));
  }

  /* ── ②b CTM → bbox ── */
  {
    const bb = ctmToImageBbox([200, 0, 0, 100, 50, 600]);
    ok('CTM thẳng trục → bbox chính xác', !!bb && bb.left === 50 && bb.bottom === 600 && bb.right === 250 && bb.top === 700);
    const flipped = ctmToImageBbox([200, 0, 0, -100, 50, 700]); // d âm (lật dọc — rất phổ biến)
    ok('CTM lật dọc (d<0) vẫn ra bbox đúng qua min/max', !!flipped && flipped.bottom === 600 && flipped.top === 700);
    ok('CTM xoay 90° → null (không tin bbox thẳng trục)', ctmToImageBbox([0, 100, -200, 0, 50, 600]) === null);
    ok('CTM suy biến (w=0) → null', ctmToImageBbox([0, 0, 0, 100, 50, 600]) === null);
    // ghép q/cm lồng nhau: dịch (10,20) rồi scale 2× → điểm (1,1) phải ra (12,22)... kiểm qua bbox
    const nested = mtxConcat([1, 0, 0, 1, 10, 20] as PdfMatrix, [2, 0, 0, 2, 0, 0] as PdfMatrix);
    const nbb = ctmToImageBbox(nested);
    ok('mtxConcat đúng thứ tự PDF (cm sau áp trước)', !!nbb && nbb.left === 10 && nbb.right === 12 && nbb.bottom === 20 && nbb.top === 22);
    const fr = imageBboxToFrame({ left: 50, bottom: 600, right: 250, top: 700 }, 400, 800);
    ok('imageBboxToFrame quy % đúng (x12.5 y12.5 w50 h12.5)', near(fr.x, 12.5, 0.01) && near(fr.y, 12.5, 0.01) && near(fr.w, 50, 0.01) && near(fr.h, 12.5, 0.01));
  }

  /* ── (e) round-trip ẢNH trên fixture dựng trong test ── */
  {
    const bytes = buildImagePdf();
    const res = await pdfToDeck(bytes, { fileName: 'concept-anh.pdf' });

    ok('[ảnh] 2 trang → 2 slide, 0 trang lỗi', res.slides.length === 2 && res.warnings.length === 0);
    ok('[ảnh] không sự cố trích ảnh (imageWarnings rỗng)', res.imageWarnings.length === 0);

    const assetIds = Object.keys(res.linkedAssets);
    ok('[ảnh] CÙNG ảnh 2 trang → đúng 1 asset trong registry [T1]', assetIds.length === 1);
    const asset = res.linkedAssets[assetIds[0]];
    ok('[ảnh] assetId tất định theo hash nội dung (img_pdf_…)', /^img_pdf_[0-9a-f]{16}$/.test(asset?.id ?? ''));
    ok('[ảnh] asset.src là PNG dataURL', (asset?.src ?? '').startsWith('data:image/png;base64,iVBOR'));

    const prov = asset?.provenance;
    ok('[ảnh] provenance loai=pdf + đúng tên file [T0]', prov?.loai === 'pdf' && prov?.file === 'concept-anh.pdf');
    ok('[ảnh] provenance ghi trang ĐẦU TIÊN thấy ảnh (1)', prov?.page === 1);
    ok('[ảnh] provenance bbox đọc THẬT từ cm (12.5/12.5/50/12.5), không inferred',
      !!prov && !prov.inferred && near(prov.bbox.x, 12.5, 0.01) && near(prov.bbox.y, 12.5, 0.01) && near(prov.bbox.w, 50, 0.01) && near(prov.bbox.h, 12.5, 0.01));

    // slide 1: ảnh + chữ — ảnh phải DƯỚI chữ (index nhỏ hơn = vẽ trước = nằm dưới)
    const s1 = res.slides[0];
    const imgIdx = s1.elements.findIndex((e) => e.kind === 'image');
    const txtIdx = s1.elements.findIndex((e) => e.kind === 'text' && !(e as TextElement).hidden);
    ok('[ảnh] slide 1 có đúng 1 element ảnh', s1.elements.filter((e) => e.kind === 'image').length === 1);
    ok('[ảnh] z-order: ảnh DƯỚI chữ (phiếu ④.2)', imgIdx >= 0 && txtIdx >= 0 && imgIdx < txtIdx);
    const img1 = s1.elements[imgIdx] as ImageElement;
    ok('[ảnh] element gắn đúng assetId qua attachElementToAsset', img1.assetId === asset?.id);
    ok('[ảnh] element.src = src của asset (instance đồng bộ)', img1.src === asset?.src);
    ok('[ảnh] frame slide 1 đặt ĐÚNG bbox trang (x12.5 y12.5 w50 h12.5)',
      near(img1.frame.x, 12.5, 0.05) && near(img1.frame.y, 12.5, 0.05) && near(img1.frame.w, 50, 0.05) && near(img1.frame.h, 12.5, 0.05));

    // slide 2: KHÔNG chữ → vẫn là trang scan, nhưng giờ CÓ ảnh dưới badge
    const s2 = res.slides[1];
    ok('[ảnh] trang 2 (0 chữ) vẫn tính scan', res.scanPages.length === 1 && res.scanPages[0] === 2);
    ok('[ảnh] slide scan = ảnh + badge OCR (ảnh dưới, badge trên)',
      s2.elements.length === 2 && s2.elements[0].kind === 'image' && s2.elements[1].kind === 'text');
    const img2 = s2.elements[0] as ImageElement;
    ok('[ảnh] trang 2 dùng CÙNG assetId (trùng nội dung = trùng asset)', img2.assetId === asset?.id);
    ok('[ảnh] frame slide 2 đúng bbox riêng của nó (x37.5 y68.75 w25 h6.25)',
      near(img2.frame.x, 37.5, 0.05) && near(img2.frame.y, 68.75, 0.05) && near(img2.frame.w, 25, 0.05) && near(img2.frame.h, 6.25, 0.05));

    // tất định giữa 2 LẦN CHẠY [T6]
    const res2 = await pdfToDeck(buildImagePdf(), { fileName: 'concept-anh.pdf' });
    ok('[ảnh] chạy lần 2 → CÙNG assetId (tất định)', Object.keys(res2.linkedAssets)[0] === asset?.id);

    const summary = pdfImportSummary('concept-anh.pdf', res);
    ok('[ảnh] summary nêu số ảnh nhúng', summary.includes('2 ảnh nhúng'));
  }

  /* ── fixture CŨ (không ảnh) — lớp ảnh mới KHÔNG đổi hành vi cũ ── */
  {
    const fixturePath = join(process.cwd(), 'lib/present-editor/__fixtures__/pdf-import-sample.pdf');
    const res = await pdfToDeck(new Uint8Array(readFileSync(fixturePath)));
    ok('[ảnh] PDF không ảnh → linkedAssets rỗng', Object.keys(res.linkedAssets).length === 0);
    ok('[ảnh] PDF không ảnh → imageWarnings rỗng', res.imageWarnings.length === 0);
    ok('[ảnh] summary PDF không ảnh vẫn "CHỈ lớp CHỮ"', pdfImportSummary('x.pdf', res).includes('CHỈ lớp CHỮ'));
  }

  console.log(`\n${pass} pass · ${fail} fail`);
  if (fail > 0) process.exit(1);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
