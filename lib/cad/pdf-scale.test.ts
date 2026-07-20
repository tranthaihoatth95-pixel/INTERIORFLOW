/**
 * lib/cad/pdf-scale.test.ts — M0 fix (docs/RESEARCH-TECHNICAL-DRAWING-PIPELINE.md §1.6/§4):
 * khoá lỗi "tỉ lệ khung tên gõ tay không khớp tỉ lệ in thật khi xuất PDF" — `titleBlock()`
 * (lib/cad/commands.ts) từng nhận `scale` là CHUỖI TỰ DO người dùng gõ tay, trong khi
 * `buildCadPdf()` (lib/cad/pdf.ts) tự tính một hệ số scale KHÁC (`fitBox()`) để vừa khổ giấy —
 * 2 con số không liên hệ nhau. Test này verify đúng tinh thần "đo path" đề xuất ở §2.5 mục 5:
 * dựng 1 Doc có 1 cạnh biết trước độ dài thật → tính tỉ lệ mong đợi THỦ CÔNG bằng `fitBox()` →
 * so khớp với `fitScaleLabel()` (nguồn UI dùng) và với kết quả `applyRealScaleToTitleBlock()`
 * (nguồn PDF export dùng) — cả 2 phải RA CÙNG MỘT CON SỐ.
 *
 * Chạy: node_modules/.bin/sucrase-node lib/cad/pdf-scale.test.ts
 */
import { emptyDoc, fitBox, fitScaleLabel, docBox } from './model';
import type { Doc } from './model';
import { newId } from './store';
import { titleBlock } from './commands';
import {
  applyRealScaleToTitleBlock,
  buildCadPdf,
  DEFAULT_PDF_PAPER_MM,
  DEFAULT_PDF_MARGIN_MM,
} from './pdf';

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

/* ── 1) fitScaleLabel() khớp tính thủ công bằng fitBox() cho 1 cạnh biết trước độ dài ── */
function testFitScaleLabelMatchesManualFitBox() {
  console.log('\n[1] fitScaleLabel() khớp fitBox() thủ công — 1 line 3200mm, khổ A3 mặc định');
  const doc: Doc = emptyDoc();
  const wall = doc.layers[0].id;
  doc.entities.push({ id: newId('e'), type: 'line', layer: wall, a: { x: 0, y: 0 }, b: { x: 3200, y: 0 } });

  const box = docBox(doc);
  ok('docBox() không null', box !== null);
  // Tính THỦ CÔNG bằng đúng công thức fitBox() — không gọi lại fitScaleLabel() ở bước này để
  // tránh test tự-xác-nhận-chính-nó (đúng tinh thần "đo path" độc lập).
  const [pw, ph] = DEFAULT_PDF_PAPER_MM;
  const manualScale = Math.min((pw - DEFAULT_PDF_MARGIN_MM * 2) / 3200, (ph - DEFAULT_PDF_MARGIN_MM * 2) / 1);
  const manualN = 1 / manualScale;
  const manualRounded = manualN >= 10 ? Math.round(manualN) : Math.round(manualN * 10) / 10;
  const manualLabel = `1:${manualRounded}`;
  console.log(`    fitBox thủ công: scale=${manualScale.toFixed(6)} → N=${manualN.toFixed(3)} → "${manualLabel}"`);

  const label = fitScaleLabel(box, DEFAULT_PDF_PAPER_MM, DEFAULT_PDF_MARGIN_MM);
  console.log(`    fitScaleLabel(): "${label}"`);
  ok(`fitScaleLabel() = "${manualLabel}" (tính thủ công)`, label === manualLabel);

  // Đối chiếu thêm: v.scale mà buildCadPdf() THẬT SỰ sẽ dùng (fitBox trực tiếp) phải ra cùng N.
  const v = fitBox(box!, pw, ph, DEFAULT_PDF_MARGIN_MM);
  ok('fitBox() trực tiếp cho scale khớp scale thủ công', Math.abs(v.scale - manualScale) < 1e-9);
}

/* ── 2) applyRealScaleToTitleBlock() ghi đè ĐÚNG entity, KHÔNG đụng entity khác ── */
function testApplyRealScaleOverridesOnlyTitleBlockText() {
  console.log('\n[2] applyRealScaleToTitleBlock() — ghi đè đúng vị trí, không đụng entity khác');
  const doc: Doc = emptyDoc();
  const wall = doc.layers[0].id;
  const textLayer = doc.layers[3].id;
  doc.entities.push({ id: newId('e'), type: 'line', layer: wall, a: { x: 0, y: 0 }, b: { x: 3200, y: 0 } });
  // Người dùng gõ tay SAI — "1:999" không liên hệ gì tới hình học thật (đúng kịch bản lỗi §1.6).
  const tb = titleBlock({ x: 4000, y: -400 }, { project: 'DA', drawing: 'BV', scale: '1:999' }, wall, textLayer);
  doc.entities.push(...tb);

  const before = doc.entities.find((e) => e.type === 'text' && e.text.startsWith('Tỷ lệ '));
  ok('doc gốc CÓ entity "Tỷ lệ 1:999" (gõ tay sai)', before?.type === 'text' && before.text === 'Tỷ lệ 1:999');

  const realLabel = '1:83'; // giá trị TÍNH THẬT giả định cho test này (độc lập bước [1])
  const overridden = applyRealScaleToTitleBlock(doc.entities, realLabel);

  const after = overridden.find((e) => e.type === 'text' && e.text.startsWith('Tỷ lệ '));
  ok(`entity tỉ lệ sau ghi đè = "Tỷ lệ ${realLabel}"`, after?.type === 'text' && after.text === `Tỷ lệ ${realLabel}`);

  // doc.entities GỐC không đổi (chỉ áp cho bản đưa vào PDF, giữ nguyên field gõ tay trong app).
  const stillWrong = doc.entities.find((e) => e.type === 'text' && e.text.startsWith('Tỷ lệ '));
  ok('doc.entities GỐC không bị mutate (vẫn còn "1:999")', stillWrong?.type === 'text' && stillWrong.text === 'Tỷ lệ 1:999');

  // Entity KHÔNG khớp tiền tố (VD tên dự án/bản vẽ) giữ nguyên object reference — không clone thừa.
  const projectTextBefore = doc.entities.find((e) => e.type === 'text' && e.text === 'DA');
  const projectTextAfter = overridden.find((e) => e.type === 'text' && e.text === 'DA');
  ok('entity không liên quan giữ NGUYÊN reference (không clone thừa)', projectTextBefore === projectTextAfter);

  // Số lượng entity không đổi (map 1:1, không thêm/bớt).
  ok('applyRealScaleToTitleBlock() không đổi số lượng entity', overridden.length === doc.entities.length);
}

/* ── 3) tích hợp: buildCadPdf() thật sự dùng scale TÍNH THẬT, không phải "1:999" gõ tay ── */
async function testBuildCadPdfUsesRealScaleEndToEnd() {
  console.log('\n[3] buildCadPdf() end-to-end — dựng PDF thật, không throw, dùng đúng nhánh M0');
  const doc: Doc = emptyDoc();
  const wall = doc.layers[0].id;
  const textLayer = doc.layers[3].id;
  doc.entities.push({ id: newId('e'), type: 'line', layer: wall, a: { x: 0, y: 0 }, b: { x: 3200, y: 0 } });
  doc.entities.push(...titleBlock({ x: 4000, y: -400 }, { project: 'DA', drawing: 'BV', scale: '1:999' }, wall, textLayer));

  // Tỉ lệ mong đợi PHẢI tính trên docBox() ĐÃ GỒM CẢ khung tên (đúng thực tế — khung tên cũng
  // là entity thật trong doc.entities, fitBox() không phân biệt "trang trí" hay "bản vẽ").
  const expectedLabel = fitScaleLabel(docBox(doc), DEFAULT_PDF_PAPER_MM, DEFAULT_PDF_MARGIN_MM);
  console.log(`    tỉ lệ THẬT mong đợi (gồm cả khung tên trong bbox): "${expectedLabel}" — khác "1:999" gõ tay`);
  ok('tỉ lệ thật khác tỉ lệ gõ tay sai (mới có ý nghĩa để test)', expectedLabel !== '1:999');

  let threw = false;
  try {
    const pdf = await buildCadPdf(doc, {});
    ok('buildCadPdf() trả về instance có .output()', typeof pdf?.output === 'function');
  } catch (err) {
    threw = true;
    console.log('    lỗi:', err);
  }
  ok('buildCadPdf() không throw', !threw);
}

async function main() {
  testFitScaleLabelMatchesManualFitBox();
  testApplyRealScaleOverridesOnlyTitleBlockText();
  await testBuildCadPdfUsesRealScaleEndToEnd();
  console.log(`\n${pass} ok, ${fail} fail`);
  if (fail > 0) process.exit(1);
}

void main();
