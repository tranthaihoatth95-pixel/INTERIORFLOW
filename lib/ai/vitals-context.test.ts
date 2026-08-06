/**
 * lib/ai/vitals-context.test.ts — VIỆC 5 (Vitals đọc trạng thái bản vẽ + quy chuẩn).
 * Chạy: node_modules/.bin/sucrase-node lib/ai/vitals-context.test.ts
 *
 * Dùng HÌNH HỌC THẬT (tường + nhãn phòng như `checker.test.ts` dựng) để diện tích là số ĐO ĐƯỢC,
 * không phải số cắm tay — nếu không thì test chỉ nghiệm lại chính cái mock của mình (§0/N1).
 */
import { emptyDoc } from '../cad/model';
import type { Doc, LineEntity, TextEntity } from '../cad/model';
import { newId } from '../cad/store';
import {
  MAX_DOC_CONTEXT_CHARS,
  MAX_ROOMS_FOR_AREA,
  docContextPromptBlock,
  sanitizeDocContext,
  summarizeDoc,
} from './doc-context';
import { sanitizeViolations, topViolations, violationsPromptBlock } from './violations-context';
import { chatSystemPromptFor } from './chat-assist';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

const LAY = 'l-wall';
function rectWalls(x0: number, y0: number, x1: number, y1: number): LineEntity[] {
  const p = [{ x: x0, y: y0 }, { x: x1, y: y0 }, { x: x1, y: y1 }, { x: x0, y: y1 }];
  return [0, 1, 2, 3].map((i) => ({ id: newId('e'), type: 'line' as const, layer: LAY, a: p[i], b: p[(i + 1) % 4] }));
}
function label(at: { x: number; y: number }, text: string): TextEntity {
  return { id: newId('e'), type: 'text', layer: 'l-text', at, text, h: 200 };
}

/** Phòng ngủ 2,5×3m = 7,5m² — DƯỚI chuẩn 9m² của TCVN ⇒ chắc chắn sinh violation thật. */
function docPhongNguNho(): Doc {
  const doc = emptyDoc();
  doc.entities.push(...rectWalls(0, 0, 2500, 3000));
  doc.entities.push(label({ x: 1250, y: 1500 }, 'PHÒNG NGỦ'));
  return doc;
}

/* ── [1] summarizeDoc — số ĐO ĐƯỢC từ hình học thật ── */
function testSummarizeReal() {
  console.log('\n[1] summarizeDoc — đo diện tích thật từ hình học');
  const ctx = summarizeDoc(docPhongNguNho());
  console.log(`      (đo được: ${ctx.roomCount} phòng · ${ctx.rooms.map((r) => `${r.name}=${r.areaM2}m²`).join(',')} · tổng ${ctx.totalAreaM2}m²)`);
  ok('đếm đúng 1 phòng', ctx.roomCount === 1);
  ok('tên phòng đúng', ctx.rooms[0].name === 'PHÒNG NGỦ');
  ok('diện tích ĐO ĐƯỢC = 7,5m² (2,5×3)', ctx.rooms[0].areaM2 === 7.5);
  ok('tổng diện tích = 7,5m²', ctx.totalAreaM2 === 7.5);
  ok('đếm đúng số entity', ctx.entityCount === 5);
  ok('không bỏ qua bước đo', ctx.areasSkipped === false);
}

/* ── [2] vật liệu đã/chưa gán ── */
function testMaterials() {
  console.log('\n[2] Vật liệu đã/chưa gán — chỉ đếm loại CÓ CHỖ gắn specId');
  const doc = emptyDoc();
  doc.entities.push(
    { id: 'h1', type: 'hatch', layer: LAY, points: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }], specId: 'sp-go' },
    { id: 'h2', type: 'hatch', layer: LAY, points: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }] },
    { id: 'b1', type: 'block', layer: LAY, block: 'sofa', at: { x: 0, y: 0 }, rot: 0, sx: 1, sy: 1, specId: 'sp-sofa' },
    { id: 'b2', type: 'block', layer: LAY, block: 'ban', at: { x: 0, y: 0 }, rot: 0, sx: 1, sy: 1 },
    { id: 'l1', type: 'line', layer: LAY, a: { x: 0, y: 0 }, b: { x: 1, y: 0 } }, // KHÔNG có chỗ gắn
  );
  const ctx = summarizeDoc(doc);
  ok('2 đã gán', ctx.materialsAssigned === 2);
  ok('2 chưa gán', ctx.materialsMissing === 2);
  ok('line KHÔNG bị tính là "thiếu vật liệu" (schema không có specId)', ctx.materialsAssigned + ctx.materialsMissing === 4);
}

/* ── [3] tầng — ưu tiên Level thật, lùi về nhãn storey ── */
function testLevels() {
  console.log('\n[3] Tầng — Level thật thắng, chưa có thì lùi về nhãn storey');
  const withLevels: Doc = {
    ...emptyDoc(),
    entities: [{ id: 'l1', type: 'line', layer: LAY, a: { x: 0, y: 0 }, b: { x: 1, y: 0 } }],
    levels: [
      { id: 'lv-gf', name: 'Trệt', elevationMm: 0, order: 0 },
      { id: 'lv-1', name: 'Lầu 1', elevationMm: 3600, order: 1 },
    ],
  };
  ok('đọc Level thật', summarizeDoc(withLevels).levelCount === 2 && summarizeDoc(withLevels).levelNames.join(',') === 'Trệt,Lầu 1');

  const onlyStorey: Doc = {
    ...emptyDoc(),
    entities: [
      { id: 'a', type: 'line', layer: LAY, a: { x: 0, y: 0 }, b: { x: 1, y: 0 }, storey: 'GF' },
      { id: 'b', type: 'line', layer: LAY, a: { x: 0, y: 0 }, b: { x: 1, y: 0 }, storey: 'GF' },
      { id: 'c', type: 'line', layer: LAY, a: { x: 0, y: 0 }, b: { x: 1, y: 0 }, storey: 'L1' },
    ],
  };
  ok('.idf v1 chưa nâng — lùi về nhãn storey, dedupe đúng', summarizeDoc(onlyStorey).levelCount === 2);
  ok('doc không tầng nào → 0, không bịa', summarizeDoc(emptyDoc()).levelCount === 0);
}

/* ── [4] selection — không có thì KHÔNG bịa ── */
function testSelection() {
  console.log('\n[4] Đang chọn gì');
  const doc = docPhongNguNho();
  const ids = doc.entities.slice(0, 2).map((e) => e.id);
  const ctx = summarizeDoc(doc, { selectedIds: ids });
  ok('đếm đúng số đang chọn', ctx.selection?.count === 2);
  ok('gom đúng loại', ctx.selection?.kinds.join(',') === 'line');
  ok('không truyền selectedIds → KHÔNG có field selection (không bịa "bạn chưa chọn gì")', summarizeDoc(doc).selection === undefined);
  ok('id không tồn tại → bỏ qua, không sập', summarizeDoc(doc, { selectedIds: ['khong-co'] }).selection === undefined);
}

/* ── [5] TRẦN KÝ TỰ — cấm nhét cả Doc vào prompt ── */
function testCharCap() {
  console.log('\n[5] Trần ký tự — cắt THẬT và đánh dấu đã cắt');
  const doc = emptyDoc();
  // 40 phòng, mỗi phòng tên dài — thừa sức vượt trần.
  for (let i = 0; i < 40; i++) {
    doc.entities.push(...rectWalls(i * 5000, 0, i * 5000 + 4000, 3000));
    doc.entities.push(label({ x: i * 5000 + 2000, y: 1500 }, `PHÒNG TÊN RẤT DÀI SỐ ${i} ĐỂ THỬ TRẦN`));
  }
  const block = docContextPromptBlock(summarizeDoc(doc));
  console.log(`      (40 phòng tên vừa → khối prompt: ${block.length} ký tự)`);
  ok('khối prompt KHÔNG phình vô hạn', block.length < MAX_DOC_CONTEXT_CHARS + 300);
  ok('KHÔNG chứa dữ liệu thô của Doc (không có id entity)', !block.includes(doc.entities[0].id));
  // TẦNG CHẶN 1 — số phòng liệt kê: `MAX_ROOMS_LISTED` cắt TRƯỚC trần ký tự, và phải nói ra
  // phần bị bỏ chứ không im (§9 "cấm giấu ô trống").
  ok('chỉ liệt kê 12 phòng đầu', block.split('SỐ ').length - 1 <= 12);
  ok('nói rõ còn bao nhiêu phòng chưa liệt kê', block.includes('phòng khác'));

  // TẦNG CHẶN 2 — trần ký tự. Với 40 phòng tên vừa thì `MAX_ROOMS_LISTED` đã chặn xong nên trần
  // ký tự KHÔNG chạm tới (đo được: 786 < 900) — nó là lớp phòng thủ thứ hai cho ca tên phòng CỰC
  // DÀI. Dựng đúng ca đó để chứng minh nó có chạy thật, không phải code chết.
  const tenDai = emptyDoc();
  for (let i = 0; i < 12; i++) {
    tenDai.entities.push(...rectWalls(i * 9000, 0, i * 9000 + 4000, 3000));
    tenDai.entities.push(label({ x: i * 9000 + 2000, y: 1500 }, `PHÒNG ${i} ${'TÊN CỰC DÀI '.repeat(9)}`));
  }
  const blockDai = docContextPromptBlock(summarizeDoc(tenDai));
  console.log(`      (12 phòng tên cực dài → khối prompt: ${blockDai.length} ký tự)`);
  ok('tên phòng cực dài → trần ký tự CÓ chạy thật', blockDai.length <= MAX_DOC_CONTEXT_CHARS + 200);
  ok('… và đánh dấu đã cắt, không cắt lén', blockDai.includes('(đã cắt bớt)'));

  // Bản vẽ quá nhiều nhãn → bỏ đo diện tích (chặn treo findHatchBoundary), và NÓI RA.
  const nang = emptyDoc();
  for (let i = 0; i < MAX_ROOMS_FOR_AREA + 5; i++) nang.entities.push(label({ x: i * 100, y: 0 }, `P${i}`));
  const ctxNang = summarizeDoc(nang);
  ok('vượt trần nhãn phòng → bỏ đo diện tích', ctxNang.areasSkipped === true);
  ok('vẫn đếm được số nhãn', ctxNang.roomCount === MAX_ROOMS_FOR_AREA + 5);
  ok('prompt nói THẲNG là chưa đo, không im lặng bỏ', docContextPromptBlock(ctxNang).includes('CHƯA đo diện tích'));
  ok('cờ skipAreas thủ công cũng chặn được', summarizeDoc(docPhongNguNho(), { skipAreas: true }).areasSkipped === true);
}

/* ── [6] prompt block — rào chắn cấm bịa số ── */
function testDocPromptBlock() {
  console.log('\n[6] Khối prompt — có rào chắn cấm model tự đẻ số');
  const block = docContextPromptBlock(summarizeDoc(docPhongNguNho()));
  ok('có con số thật 7.5m²', block.includes('7.5m²'));
  ok('có câu cấm tự tính/ước lượng', block.includes('không tự tính hay ước lượng'));
  ok('doc RỖNG → trả chuỗi rỗng (không bơm khối vô nghĩa)', docContextPromptBlock(summarizeDoc(emptyDoc())) === '');
  ok('null → chuỗi rỗng', docContextPromptBlock(null) === '');

  // Phòng có nhãn nhưng KHÔNG dò được biên (nhãn lơ lửng, không tường bao) → nói "chưa dò được".
  const hoLung = emptyDoc();
  hoLung.entities.push(label({ x: 0, y: 0 }, 'PHÒNG LƠ LỬNG'));
  hoLung.entities.push(...rectWalls(50000, 50000, 54000, 53000));
  const ctx = summarizeDoc(hoLung);
  const r = ctx.rooms.find((x) => x.name === 'PHÒNG LƠ LỬNG');
  ok('nhãn không có biên → areaM2 null, KHÔNG đoán', r !== undefined && r.areaM2 === null);
  ok('prompt nói "chưa dò được biên"', docContextPromptBlock(ctx).includes('chưa dò được biên'));
}

/* ── [7] topViolations — xếp hạng nặng→nhẹ, số đo là của checker ── */
function testViolations() {
  console.log('\n[7] topViolations — vi phạm THẬT từ checker, xếp nặng trước');
  const res = topViolations(docPhongNguNho());
  console.log(`      (tổng ${res.total} mục: ${res.countsBySeverity.error} lỗi · ${res.countsBySeverity.warning} cảnh báo · ${res.countsBySeverity.info} lưu ý)`);
  ok('bắt được vi phạm thật', res.total > 0);
  ok('có mục diện tích phòng ngủ', res.items.some((v) => v.ruleId === 'vn-res-bedroom-min-area'));

  const v = res.items.find((x) => x.ruleId === 'vn-res-bedroom-min-area')!;
  ok('message giữ NGUYÊN VĂN số đo của checker (7.5m²)', v.message.includes('7.5') && v.message.includes('9'));
  ok('có source tra ngược được tới điều khoản', v.source.length > 0);
  ok('xếp nặng trước (error đứng trên warning/info)', res.items.every((x, i) => i === 0 || rank(res.items[i - 1].severity) <= rank(x.severity)));
  ok('cắt đúng trần 5 mục', topViolations(docPhongNguNho(), undefined, 5).items.length <= 5);
  ok('limit 2 → đúng 2 mục nhưng total giữ số thật', topViolations(docPhongNguNho(), undefined, 2).items.length <= 2 && topViolations(docPhongNguNho(), undefined, 2).total === res.total);
  ok('doc rỗng → 0 vi phạm, không sập', topViolations(emptyDoc()).total === 0);

  function rank(s: string) { return s === 'error' ? 0 : s === 'warning' ? 1 : 2; }
}

/* ── [8] khối prompt vi phạm — không trấn an sai sự thật ── */
function testViolationsPromptBlock() {
  console.log('\n[8] Khối prompt vi phạm');
  const block = violationsPromptBlock(topViolations(docPhongNguNho()));
  ok('liệt kê ruleId để tra ngược', block.includes('vn-res-bedroom-min-area'));
  ok('giữ số đo nguyên văn', block.includes('7.5'));
  ok('có câu cấm bịa số/tên tiêu chuẩn', block.includes('không tự nghĩ ra số đo'));
  ok('CẢNH BÁO "0 vi phạm ≠ đạt chuẩn"', block.includes('không có nghĩa hồ sơ đã đạt chuẩn'));
  ok('không vi phạm nào → chuỗi RỖNG (không trấn an "bản vẽ sạch")', violationsPromptBlock(topViolations(emptyDoc())) === '');
  ok('null → chuỗi rỗng', violationsPromptBlock(null) === '');
}

/* ── [9] sanitize — KHÔNG tin payload client ── */
function testSanitize() {
  console.log('\n[9] sanitize — không tin dữ liệu client gửi lên');
  ok('không phải object → null', sanitizeDocContext('hack') === null && sanitizeDocContext(null) === null && sanitizeDocContext([1]) === null);
  ok('entityCount = 0 → null (không có gì để nói)', sanitizeDocContext({ entityCount: 0 }) === null);

  const bom = sanitizeDocContext({
    entityCount: 10,
    rooms: Array.from({ length: 500 }, (_, i) => ({ name: 'X'.repeat(5000), areaM2: i })),
    levelNames: Array.from({ length: 500 }, () => 'Y'.repeat(5000)),
    selection: { count: 3, kinds: Array.from({ length: 500 }, () => 'Z'.repeat(500)) },
  })!;
  ok('cắt số phòng về trần', bom.rooms.length <= 12);
  ok('cắt độ dài tên phòng', bom.rooms[0].name.length <= 60);
  ok('cắt số tầng + độ dài tên tầng', bom.levelNames.length <= 20 && bom.levelNames[0].length <= 60);
  ok('cắt danh sách loại đang chọn', (bom.selection?.kinds.length ?? 0) <= 10);
  ok('số âm bị ép về 0', sanitizeDocContext({ entityCount: 5, roomCount: -99 })!.roomCount === 0);
  ok('areaM2 không phải số → null, không NaN', sanitizeDocContext({ entityCount: 5, rooms: [{ name: 'A', areaM2: 'nhiều' }] })!.rooms[0].areaM2 === null);

  ok('violations: không phải object → null', sanitizeViolations('x') === null && sanitizeViolations({ items: 'x' }) === null);
  ok('violations: severity lạ bị loại', sanitizeViolations({ items: [{ severity: 'catastrophe', message: 'a' }] }) === null);
  ok('violations: message rỗng bị loại', sanitizeViolations({ items: [{ severity: 'error', message: '   ' }] }) === null);
  const vb = sanitizeViolations({ items: Array.from({ length: 50 }, () => ({ severity: 'error', message: 'M'.repeat(9999) })) })!;
  ok('violations: cắt về 5 mục', vb.items.length === 5);
  ok('violations: cắt độ dài message', vb.items[0].message.length <= 220);
  ok('violations: total không bao giờ nhỏ hơn số mục thật', vb.total >= vb.items.length);

  // Vòng tròn: summarize → JSON (như client gửi) → sanitize → phải giữ được số thật.
  const goc = summarizeDoc(docPhongNguNho());
  const qua = sanitizeDocContext(JSON.parse(JSON.stringify(goc)))!;
  ok('round-trip JSON giữ đúng diện tích 7,5m²', qua.rooms[0].areaM2 === 7.5 && qua.totalAreaM2 === 7.5);
}

/* ── [10] chatSystemPromptFor — THÊM tầng, KHÔNG phá chữ ký cũ ── */
function testPromptIntegration() {
  console.log('\n[10] chatSystemPromptFor — additive, không hồi quy');
  const cu = chatSystemPromptFor('concept', null);
  ok('gọi kiểu CŨ (2 tham số) vẫn chạy', cu.length > 0);
  ok('… và KHÔNG mọc thêm khối nào', !cu.includes('TRẠNG THÁI BẢN VẼ') && !cu.includes('KẾT QUẢ KIỂM QUY CHUẨN'));
  ok('truyền undefined/null cũng ra prompt Y HỆT bản cũ', chatSystemPromptFor('concept', null, null, null) === cu);

  const doc = docPhongNguNho();
  const moi = chatSystemPromptFor('concept', null, summarizeDoc(doc), topViolations(doc));
  ok('có khối trạng thái bản vẽ', moi.includes('TRẠNG THÁI BẢN VẼ'));
  ok('có khối kiểm quy chuẩn', moi.includes('KẾT QUẢ KIỂM QUY CHUẨN'));
  ok('giữ nguyên phần prompt cũ (danh tính Vitals)', moi.includes('Bạn là Vitals'));
  ok('giữ nguyên giới hạn 3 câu ở CUỐI', moi.trimEnd().endsWith('không lan man.'));
  ok('chỉ có bản vẽ, không có vi phạm → chỉ mọc 1 khối', (() => {
    const p = chatSystemPromptFor('concept', null, summarizeDoc(doc), null);
    return p.includes('TRẠNG THÁI BẢN VẼ') && !p.includes('KẾT QUẢ KIỂM QUY CHUẨN');
  })());
}

testSummarizeReal();
testMaterials();
testLevels();
testSelection();
testCharCap();
testDocPromptBlock();
testViolations();
testViolationsPromptBlock();
testSanitize();
testPromptIntegration();

console.log(`\nvitals-context.test.ts — ${pass} pass, ${fail} fail`);
if (fail) process.exit(1);
