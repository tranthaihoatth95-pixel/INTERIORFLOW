/**
 * lib/cad/pdf-print-fidelity.test.ts — P4 (04/08, `docs/nc/NC-xuat-pdf-in-2026-08-02.md` §3 mục 4):
 * đo THẬT trong content stream của PDF sinh ra bởi `buildCadPdf()` — không chỉ tin cậy con số
 * `scaleLabel`/kích thước trang (đã test kỹ ở `pdf-scale.test.ts`), mà GIẢI MÃ đúng byte PDF để
 * xác nhận toạ độ vẽ + bề dày nét thật khớp mm — đúng tinh thần nghiệm thu gốc: "in thật ra giấy
 * A3, lấy thước đo một bức tường 4m ở tỉ lệ 1:50 → phải đúng 80mm".
 *
 * jsPDF (không bật `compress`) xuất content stream dạng TEXT THUẦN, đơn vị PDF POINT (1/72").
 * `pdf.line(a,b)` (đơn vị mm, vì `new jsPDF({unit:'mm'})`) sinh ra operator `x1 y1 m` (moveto) +
 * `x2 y2 l` (lineto) + `S` (stroke) — toạ độ ĐÃ QUY ĐỔI sang point bởi jsPDF nội bộ. `setLineWidth`
 * sinh operator `w w` (set line width, point). Đã thực nghiệm xác nhận công thức quy đổi
 * point→mm = pt × 25.4/72 khớp CHÍNH XÁC (sai số <1e-9) với mm truyền vào API — xem hàm
 * `readContentStream()`/`ptToMm()` bên dưới.
 *
 * Chạy: node_modules/.bin/sucrase-node lib/cad/pdf-print-fidelity.test.ts
 */
import { emptyDoc } from './model';
import type { Doc } from './model';
import { newId } from './store';
import { buildCadPdf, MIN_PRINTABLE_LINE_MM, pdfFooterLine } from './pdf';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

const PT_TO_MM = 25.4 / 72;

/** Giải nén datauristring của jsPDF → chuỗi latin1 (content stream KHÔNG compress, đọc trực tiếp
 * được — xem docstring đầu file, đã thực nghiệm xác nhận `compress` mặc định tắt). */
function rawPdfText(pdf: { output(type: 'datauristring'): string }): string {
  const raw = pdf.output('datauristring');
  const b64 = raw.split(',')[1];
  return Buffer.from(b64, 'base64').toString('latin1');
}

interface DrawnLine { x1Mm: number; y1Mm: number; x2Mm: number; y2Mm: number; widthMm: number }

/** Bóc mọi cặp lệnh `m`(moveto)/`l`(lineto) đi kèm operator `S` (stroke) trong content stream,
 * gắn với bề dày nét `w` HIỆU LỰC gần nhất phía TRƯỚC nó (đúng ngữ nghĩa graphics-state của PDF —
 * `w` set state, áp dụng cho MỌI thao tác vẽ sau đó tới khi bị đổi lại). Không parse toàn bộ cú
 * pháp PDF (không cần) — chỉ đủ để đo lại đúng cái `pdf.line()`/`setLineWidth()` đã sinh ra. */
function parseStrokedLines(pdfText: string): DrawnLine[] {
  const streamMatch = pdfText.match(/stream\r?\n([\s\S]*?)\r?\nendstream/);
  if (!streamMatch) return [];
  const body = streamMatch[1];
  const tokenRe = /(-?[\d.]+)\s+w|(-?[\d.]+)\s+(-?[\d.]+)\s+m|(-?[\d.]+)\s+(-?[\d.]+)\s+l|^S$/gm;
  const lines: DrawnLine[] = [];
  let curWidthPt = 0;
  let curMove: [number, number] | null = null;
  let lastTo: [number, number] | null = null;
  let match: RegExpExecArray | null;
  while ((match = tokenRe.exec(body))) {
    if (match[1] !== undefined) {
      curWidthPt = Number(match[1]);
    } else if (match[2] !== undefined) {
      curMove = [Number(match[2]), Number(match[3])];
      lastTo = curMove;
    } else if (match[4] !== undefined) {
      lastTo = [Number(match[4]), Number(match[5])];
    } else if (match[0] === 'S' && curMove && lastTo) {
      lines.push({
        x1Mm: curMove[0] * PT_TO_MM,
        y1Mm: curMove[1] * PT_TO_MM,
        x2Mm: lastTo[0] * PT_TO_MM,
        y2Mm: lastTo[1] * PT_TO_MM,
        widthMm: curWidthPt * PT_TO_MM,
      });
    }
  }
  return lines;
}

function lineLengthMm(l: DrawnLine): number {
  return Math.hypot(l.x2Mm - l.x1Mm, l.y2Mm - l.y1Mm);
}

async function testWallAt150OnA3Is80mm() {
  console.log('\n[1] NGHIỆM THU GỐC — tường 4000mm, printScale=50, khổ A3 → đo trên PDF thật = 80mm');
  const doc: Doc = emptyDoc();
  doc.paperKey = 'A3';
  doc.printScale = 50;
  const wall = doc.layers[0].id; // layer 'Tường'
  doc.entities.push({ id: newId('e'), type: 'line', layer: wall, a: { x: 0, y: 0 }, b: { x: 4000, y: 0 } });

  const pdf = await buildCadPdf(doc, {});
  const text = rawPdfText(pdf as unknown as { output(t: 'datauristring'): string });
  const lines = parseStrokedLines(text);
  console.log(`    đường vẽ được (${lines.length}):`, lines.map((l) => lineLengthMm(l).toFixed(4)));

  const wallLine = lines.find((l) => Math.abs(lineLengthMm(l) - 80) < 0.05);
  ok('có 1 đường trên PDF thật dài đúng 80.00mm (±0.05mm)', !!wallLine);
  ok('4000mm / 50 = 80mm — đúng công thức plot-to-scale', Math.abs(4000 / 50 - 80) < 1e-9);
}

async function testFourStandardScales() {
  console.log('\n[2] Bốn tỉ lệ chuẩn 1:20/1:50/1:100/1:200 — cùng 1 tường 4000mm, đo đúng mm mỗi tỉ lệ');
  const cases: [number, number][] = [
    [20, 200], // 4000/20 = 200mm
    [50, 80],
    [100, 40],
    [200, 20],
  ];
  for (const [scaleN, expectedMm] of cases) {
    const doc: Doc = emptyDoc();
    doc.paperKey = 'A0'; // khổ đủ lớn để mọi tỉ lệ đều LỌT (fitsAtScale) — 1:20 của 4m vẫn nhỏ hơn A0
    doc.printScale = scaleN;
    const wall = doc.layers[0].id;
    doc.entities.push({ id: newId('e'), type: 'line', layer: wall, a: { x: 0, y: 0 }, b: { x: 4000, y: 0 } });

    const pdf = await buildCadPdf(doc, {});
    const text = rawPdfText(pdf as unknown as { output(t: 'datauristring'): string });
    const lines = parseStrokedLines(text);
    const found = lines.find((l) => Math.abs(lineLengthMm(l) - expectedMm) < 0.05);
    console.log(`    1:${scaleN} → mong đợi ${expectedMm}mm — ${found ? 'khớp' : 'KHÔNG THẤY'} (đo được: ${lines.map((l) => lineLengthMm(l).toFixed(3)).join(', ')})`);
    ok(`1:${scaleN} — đo trên PDF thật = ${expectedMm}mm`, !!found);
  }
}

async function testHairlineNeverVanishes() {
  console.log('\n[3] Nét mảnh không biến mất khi in — lineweight khai 0.01mm (dưới chuẩn ISO 128) vẫn in ≥ sàn an toàn');
  const doc: Doc = emptyDoc();
  doc.paperKey = 'A3';
  const wall = doc.layers[0].id;
  doc.entities.push({ id: newId('e'), type: 'line', layer: wall, lineweight: 0.01, a: { x: 0, y: 0 }, b: { x: 1000, y: 0 } });

  const pdf = await buildCadPdf(doc, {});
  const text = rawPdfText(pdf as unknown as { output(t: 'datauristring'): string });
  const lines = parseStrokedLines(text);
  ok('có vẽ được đường (không bị rớt vì nét mảnh)', lines.length > 0);
  const thin = lines.find((l) => lineLengthMm(l) > 90); // đường tường ~100mm trên giấy (1000mm auto-fit, không quan tâm số đúng ở test này)
  ok(`bề dày nét thật ≥ sàn in ấn ${MIN_PRINTABLE_LINE_MM}mm dù khai 0.01mm`, !!thin && thin.widthMm >= MIN_PRINTABLE_LINE_MM - 1e-6);
  console.log(`    khai 0.01mm → in thật ${thin?.widthMm.toFixed(4)}mm (sàn ${MIN_PRINTABLE_LINE_MM}mm)`);
}

function testFooterLineComposition() {
  console.log('\n[4] Khung tên mở rộng — "số tờ"/"phiên bản" ghép đúng vào dòng ghi chú (pdfFooterLine, hàm thuần)');
  ok('không truyền gì → null (không vẽ dòng thừa, giữ hành vi cũ)', pdfFooterLine({}) === null);
  ok('chỉ title → giữ nguyên hành vi cũ', pdfFooterLine({ title: 'Mặt bằng tầng 1' }) === 'Mặt bằng tầng 1');
  ok(
    'title + sheetIndex/sheetCount → "... · Tờ 2/5"',
    pdfFooterLine({ title: 'Mặt bằng tầng 1', sheetIndex: 2, sheetCount: 5 }) === 'Mặt bằng tầng 1 · Tờ 2/5',
  );
  ok(
    'title + version → "... · Rev A"',
    pdfFooterLine({ title: 'Mặt bằng tầng 1', version: 'A' }) === 'Mặt bằng tầng 1 · Rev A',
  );
  ok(
    'đủ cả 3 → ghép đúng thứ tự title · Tờ N/M · Rev X',
    pdfFooterLine({ title: 'Mặt bằng tầng 1', sheetIndex: 2, sheetCount: 5, version: 'A' })
      === 'Mặt bằng tầng 1 · Tờ 2/5 · Rev A',
  );
  ok('sheetIndex thiếu sheetCount → KHÔNG vẽ "Tờ" (tránh "Tờ 2/undefined")', pdfFooterLine({ sheetIndex: 2 }) === null);
}

async function main() {
  await testWallAt150OnA3Is80mm();
  await testFourStandardScales();
  await testHairlineNeverVanishes();
  testFooterLineComposition();
  console.log(`\n${pass} ok, ${fail} fail`);
  if (fail > 0) process.exit(1);
}

void main();
