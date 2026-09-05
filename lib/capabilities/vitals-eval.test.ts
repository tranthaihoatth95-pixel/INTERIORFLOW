/**
 * lib/capabilities/vitals-eval.test.ts — kiểm LÕI ĐÁNH GIÁ Vitals + harness. Chạy:
 *   node_modules/.bin/sucrase-node lib/capabilities/vitals-eval.test.ts
 *
 * Bốn thứ được canh, mỗi thứ là một luật ở đầu `vitals-eval-core.ts`:
 *  ① TẤT ĐỊNH — cùng Doc chạy 2 lần ra cùng JSON; id không phụ thuộc thời gian.
 *  ② BA LỚP TÁCH BẰNG KIỂU — lớp gu/AI/học không mang severity; ngưỡng thông lệ không là error.
 *  ③ LỚP HỌC KHÔNG VÙI LỖI MÁY ĐO — bỏ lỗi quy chuẩn 30 lần, nó vẫn đứng đầu (đối kháng).
 *  ④ KHÔNG GHI ĐÈ NGUỒN SỰ THẬT — Doc/Thẻ DNA/bản ghi cũ nguyên vẹn sau mọi thao tác.
 *
 * Ca kiểm là BẢN VẼ TỔNG HỢP NHỎ dựng trong test (unit fixture) — KHÔNG phải bộ dữ liệu thật,
 * KHÔNG phải benchmark. Harness chỉ chứng minh máy chạy đúng hợp đồng trên ca đưa vào.
 */
import { emptyDoc, type Doc, type HatchEntity, type LineEntity, type TextEntity } from '../cad/model';
import type { DesignDnaCard } from '../dna/types';
import { emptyDnaLayers } from '../dna/types';
import { PairwisePerceptron } from '../gu/pairwise-perceptron';
import {
  CONFIDENCE_THONG_LE,
  EVAL_ENGINE_VERSION,
  EVAL_MODEL,
  MAX_RECORDS_PER_PROJECT,
  MAX_SUMMARY_LINES,
  applyFeedback,
  buildEvalRecord,
  chuanDauRaRuleId,
  evaluateCadDoc,
  evaluateTaste,
  findingFeatures,
  hashDoc,
  isEvalRecord,
  isRecordStale,
  learnDelta,
  learnFromRecord,
  mergeRecordIntoList,
  rankFindings,
  recordId,
  sanitizeAiFindings,
  summarizeRecord,
  summaryForVitals,
  verdictOf,
  type EvalFinding,
  type EvalFindingDeterministic,
  type EvalRecord,
} from './vitals-eval-core';
import { checkFindingContract, runEvalHarness } from './vitals-eval-harness';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

/* ───────────────────────── fixture: bản vẽ tổng hợp nhỏ ───────────────────────── */
let seq = 0;
const nid = (p = 'e') => `${p}_${(++seq).toString(36).padStart(4, '0')}`;
function rectWalls(x0: number, y0: number, x1: number, y1: number): LineEntity[] {
  const p = [{ x: x0, y: y0 }, { x: x1, y: y0 }, { x: x1, y: y1 }, { x: x0, y: y1 }];
  return [0, 1, 2, 3].map((i) => ({ id: nid(), type: 'line' as const, layer: 'l-wall', a: p[i], b: p[(i + 1) % 4] }));
}
function label(at: { x: number; y: number }, text: string): TextEntity {
  return { id: nid('t'), type: 'text', layer: 'l-text', at, text, h: 200 };
}
function hatch(x0: number, y0: number, x1: number, y1: number, specId?: string): HatchEntity {
  return {
    id: nid('h'),
    type: 'hatch',
    layer: 'l-furniture',
    points: [{ x: x0, y: y0 }, { x: x1, y: y0 }, { x: x1, y: y1 }, { x: x0, y: y1 }],
    solid: true,
    ...(specId ? { specId } : {}),
  };
}

function docBedroomSmall(): Doc {
  const d = emptyDoc();
  d.entities.push(...rectWalls(0, 0, 2500, 3000), label({ x: 1250, y: 1500 }, 'PHÒNG NGỦ'));
  return d;
}
function docBedroomOk(): Doc {
  const d = emptyDoc();
  d.entities.push(...rectWalls(0, 0, 4000, 3500), label({ x: 2000, y: 1750 }, 'PHÒNG NGỦ'));
  return d;
}
function docLongRoom(): Doc {
  const d = emptyDoc();
  d.entities.push(...rectWalls(0, 0, 8000, 2000), label({ x: 4000, y: 1000 }, 'KHO'));
  return d;
}
function docMaterials(withSpec: boolean): Doc {
  const d = docBedroomOk();
  d.entities.push(hatch(500, 500, 1500, 1500, withSpec ? 'mat-oak' : undefined));
  d.entities.push(hatch(2000, 500, 3000, 1500, withSpec ? 'mat-walnut' : undefined));
  return d;
}

/* ───────────────────────── ① harness: hit/miss + tất định + hợp đồng ───────────────────────── */
console.log('\n[1] harness trên 4 ca tổng hợp');
const summary = runEvalHarness([
  { id: 'bedroom-small', doc: docBedroomSmall(), mustHave: ['vn-res-bedroom-min-area', 'chuan-dau-ra.khung-ten'] },
  { id: 'bedroom-ok', doc: docBedroomOk(), mustNotHave: ['vn-res-bedroom-min-area', 'proportion.room-aspect', 'material.unassigned'] },
  { id: 'long-room', doc: docLongRoom(), mustHave: ['proportion.room-aspect'] },
  { id: 'materials-missing', doc: docMaterials(false), mustHave: ['material.unassigned'] },
]);
for (const c of summary.cases) {
  ok(`ca ${c.id}: ${c.findings} phát hiện · hit ${c.hits.length} · miss ${c.misses.join(',') || '0'} · báo oan ${c.falseAlarms.join(',') || '0'}`, c.pass);
}
ok('không ca nào bất định', summary.nonDeterministic === 0);
ok('0 lỗi hợp đồng trên mọi phát hiện', summary.contractIssues === 0);
ok('vật liệu đã gán đủ thì KHÔNG báo material.unassigned', !evaluateCadDoc(docMaterials(true)).some((f) => f.rule.id === 'material.unassigned'));

/* ───────────────────────── ② nội dung phát hiện máy đo ───────────────────────── */
console.log('\n[2] nội dung phát hiện lớp máy đo');
const det = evaluateCadDoc(docBedroomSmall());
const bed = det.find((f) => f.rule.id === 'vn-res-bedroom-min-area');
ok('phát hiện phòng ngủ có entityId nhãn phòng làm bằng chứng', !!bed && bed.evidence.entityIds.length === 1 && bed.evidence.entityIds[0].startsWith('t_'));
ok('hành động là chọn trên bản vẽ (lùi được)', !!bed && bed.action.kind === 'select' && bed.action.reversible === true);
ok('nguồn dẫn TCVN + phiên bản lõi', !!bed && /TCVN/.test(bed.rule.source) && bed.rule.version === EVAL_ENGINE_VERSION);
ok('miền spatial-layout cho luật diện tích phòng', !!bed && bed.domain === 'spatial-layout');
ok('moTa giữ NGUYÊN VĂN số đo của checker (có m²)', !!bed && /m²/.test(bed.moTa));
const longRoom = evaluateCadDoc(docLongRoom()).find((f) => f.rule.id === 'proportion.room-aspect');
ok('tỷ lệ phòng: basis thông lệ · severity info · confidence < 1', !!longRoom && longRoom.basis === 'measured-convention' && longRoom.severity === 'info' && longRoom.confidence === CONFIDENCE_THONG_LE);
ok('tỷ lệ phòng: metrics ghi đúng 4.0:1', !!longRoom && longRoom.evidence.metrics?.ratio === 4);
ok('mọi id không chứa dấu thời gian (tất định)', det.every((f) => !/\d{4}-\d{2}-\d{2}/.test(f.id)));
ok('bản vẽ trống ⇒ không phát hiện nào (không bịa)', evaluateCadDoc(emptyDoc()).length === 0);
ok('chuanDauRaRuleId ánh xạ ổn định', chuanDauRaRuleId('Tỷ lệ 1:47 không thuộc dãy chuẩn') === 'chuan-dau-ra.ty-le' && chuanDauRaRuleId('Bản vẽ chưa có khung tên') === 'chuan-dau-ra.khung-ten' && chuanDauRaRuleId('3 nhãn còn đè') === 'chuan-dau-ra.nhan' && chuanDauRaRuleId('xyz') === 'chuan-dau-ra.khac');

/* ───────────────────────── ③ lớp gu từ Thẻ DNA ───────────────────────── */
console.log('\n[3] lớp gu — Thẻ DNA');
function card(values: string[], trangThai: 'measured' | 'inferred' | 'verified'): DesignDnaCard {
  const layers = emptyDnaLayers();
  layers.vatLieuMatId = { values, trangThai, nguon: ['img_1'] };
  return { id: 'dna_1', projectId: 'p1', name: 'Phương án A', createdAt: '2026-09-01T00:00:00.000Z', updatedAt: '2026-09-02T00:00:00.000Z', layers };
}
const tasteNone = evaluateTaste(docMaterials(true), null);
ok('không thẻ ⇒ 0 phát hiện + lý do bị chặn', tasteNone.findings.length === 0 && !!tasteNone.biChan);
const tasteEmpty = evaluateTaste(docMaterials(true), card([], 'inferred'));
ok('thẻ chưa khai vật liệu ⇒ bị chặn có lý do, không đoán', tasteEmpty.findings.length === 0 && /trống/.test(tasteEmpty.biChan ?? ''));
const taste = evaluateTaste(docMaterials(true), card(['mat-oak', 'mat-brass'], 'inferred'));
ok('thẻ khai brass chưa dùng ⇒ 1 quan sát not-used', taste.findings.filter((f) => f.rule.id === 'dna.material-not-used').length === 1);
ok('bản vẽ dùng walnut ngoài thẻ ⇒ 1 quan sát outside-card, có entityIds', taste.findings.some((f) => f.rule.id === 'dna.material-outside-card' && f.evidence.entityIds.length === 1));
ok('lớp gu KHÔNG có severity (rào kiểu + runtime)', taste.findings.every((f) => !('severity' in f)));
ok('độ tin cậy theo trạng thái nguồn: inferred = 0.5', taste.findings.every((f) => f.confidence === 0.5));
ok('gu: nguồn thẻ được chép vào evidence.nguon', taste.findings.every((f) => f.evidence.nguon?.[0] === 'img_1'));
ok('gu người ký (verified) tin cậy 0.9', evaluateTaste(docMaterials(true), card(['mat-oak', 'mat-x'], 'verified')).findings.every((f) => f.confidence === 0.9));
ok('0 lỗi hợp đồng ở lớp gu', taste.findings.flatMap(checkFindingContract).length === 0);

/* ───────────────────────── ④ đặc trưng + xếp hạng + học (đối kháng) ───────────────────────── */
console.log('\n[4] lớp học — xếp hạng không vùi lỗi máy đo');
function synth(ruleId: string, severity: 'error' | 'warning' | 'info', i: number): EvalFindingDeterministic {
  return {
    id: `deterministic:${ruleId}:#${i}`,
    layer: 'deterministic',
    domain: 'cad-drawing',
    basis: 'standard',
    severity,
    rule: { id: ruleId, version: '1', source: 'test' },
    confidence: 1,
    moTa: `${ruleId} ${i}`,
    why: 'test',
    evidence: { entityIds: [] },
    action: { kind: 'none', label: ['-', '-'], reversible: true },
  };
}
const F: EvalFinding[] = [synth('r.err', 'error', 1), synth('r.warn', 'warning', 1), synth('r.info', 'info', 1), synth('r.err', 'error', 2)];
ok('mọi feature nằm trong [0,1]', F.every((f) => Object.values(findingFeatures(f)).every((v) => v >= 0 && v <= 1)));
const fresh = new PairwisePerceptron();
const r0 = rankFindings(F, fresh);
ok('chưa học: error trước (giữ thứ tự sinh), rồi warning, rồi info', r0.map((f) => f.id).join('|') === 'deterministic:r.err:#1|deterministic:r.err:#2|deterministic:r.warn:#1|deterministic:r.info:#1');
// đối kháng: người dùng BỎ mọi error, NHẬN info — 30 lượt
const adv = new PairwisePerceptron();
let rec: EvalRecord = {
  version: 1, id: 'x', createdAt: '2026-09-03T00:00:00.000Z', stage: 'concept',
  subject: { kind: 'cad-doc', hash: 'h', projectId: null, entityCount: 0 },
  engine: { name: 'vitals-eval-core', version: EVAL_ENGINE_VERSION }, dna: null, findings: F, feedback: [],
};
rec = applyFeedback(rec, 'deterministic:r.err:#1', 'reject', '2026-09-03T00:00:01.000Z');
rec = applyFeedback(rec, 'deterministic:r.err:#2', 'reject', '2026-09-03T00:00:02.000Z');
rec = applyFeedback(rec, 'deterministic:r.info:#1', 'accept', '2026-09-03T00:00:03.000Z');
for (let i = 0; i < 15; i++) learnFromRecord(adv, rec);
ok('mô hình đã đủ cặp để cầm lái', adv.ready());
const r1 = rankFindings(F, adv);
ok('ĐỐI KHÁNG: bỏ error 30 lần, error VẪN đứng đầu', r1[0].id === 'deterministic:r.err:#1' && r1[1].id === 'deterministic:r.err:#2');
ok('học có tác dụng thật: info được nhận xếp trên warning', r1[2].id === 'deterministic:r.info:#1' && r1[3].id === 'deterministic:r.warn:#1');
ok('xếp hạng tất định (2 lần y hệt)', JSON.stringify(rankFindings(F, adv)) === JSON.stringify(r1));
// learnDelta chỉ học phần mới
const d1 = new PairwisePerceptron();
let rec2: EvalRecord = { ...rec, feedback: [] };
rec2 = applyFeedback(rec2, 'deterministic:r.err:#1', 'reject', '2026-09-03T00:00:01.000Z');
ok('learnDelta: reject đầu tiên chưa có accept ⇒ 0 cặp', learnDelta(d1, rec2, 'deterministic:r.err:#1') === 0);
rec2 = applyFeedback(rec2, 'deterministic:r.info:#1', 'accept', '2026-09-03T00:00:02.000Z');
ok('learnDelta: accept mới × 1 reject cũ ⇒ 1 cặp', learnDelta(d1, rec2, 'deterministic:r.info:#1') === 1 && d1.pairsSeen === 1);
rec2 = applyFeedback(rec2, 'deterministic:r.warn:#1', 'reject', '2026-09-03T00:00:03.000Z');
ok('learnDelta: reject mới × 1 accept cũ ⇒ 1 cặp', learnDelta(d1, rec2, 'deterministic:r.warn:#1') === 1 && d1.pairsSeen === 2);

/* ───────────────────────── ⑤ bản ghi: dựng · phản hồi · bất biến ───────────────────────── */
console.log('\n[5] bản ghi đánh giá');
const doc = docMaterials(true);
const before = JSON.stringify(doc);
const cardA = card(['mat-oak', 'mat-brass'], 'verified');
const cardBefore = JSON.stringify(cardA);
const NOW = '2026-09-03T10:20:30.000Z';
const record = buildEvalRecord({ doc, stage: 'concept', projectId: 'p1', card: cardA, model: new PairwisePerceptron(), now: NOW });
ok('Doc KHÔNG bị sửa sau khi đánh giá', JSON.stringify(doc) === before);
ok('Thẻ DNA KHÔNG bị sửa sau khi đánh giá', JSON.stringify(cardA) === cardBefore);
ok('id bản ghi tất định theo băm + thời điểm', record.id === recordId(hashDoc(doc), NOW) && record.id === `eval_${hashDoc(doc)}_20260903102030`);
ok('bản ghi không chứa Doc, chỉ băm + số entity', !('doc' in record) && record.subject.entityCount === doc.entities.length && record.subject.hash.length === 8);
ok('bản ghi mang thẻ DNA đã dùng + phiên bản lõi', record.dna?.cardId === 'dna_1' && record.engine.version === EVAL_ENGINE_VERSION);
ok('bản ghi gộp cả máy đo lẫn gu', record.findings.some((f) => f.layer === 'deterministic') && record.findings.some((f) => f.layer === 'taste'));
const s = summarizeRecord(record);
ok('summarizeRecord đếm khớp danh sách', s.total === record.findings.length && s.taste === record.findings.filter((f) => f.layer === 'taste').length);
const fid = record.findings[0].id;
const after = applyFeedback(record, fid, 'accept', NOW);
ok('applyFeedback trả bản ghi MỚI, bản cũ nguyên feedback rỗng', after !== record && record.feedback.length === 0 && after.feedback.length === 1);
const again = applyFeedback(after, fid, 'reject', NOW);
ok('bấm lại cùng finding ⇒ THAY, không nhân đôi', again.feedback.length === 1 && verdictOf(again, fid) === 'reject');
ok('findingId lạ ⇒ trả nguyên bản ghi', applyFeedback(again, 'khong-co', 'accept', NOW) === again);
ok('feedback chép ruleId/layer/domain để tự đủ khi huấn luyện offline', again.feedback[0].ruleId === record.findings[0].rule.id && again.feedback[0].layer === record.findings[0].layer);
ok('JSON round-trip qua isEvalRecord', isEvalRecord(JSON.parse(JSON.stringify(again))));
ok('isEvalRecord từ chối rác', !isEvalRecord({ version: 1 }) && !isEvalRecord(null) && !isEvalRecord({ ...again, findings: [{ id: 1 }] }));
ok('chưa đổi Doc ⇒ không cũ', !isRecordStale(record, doc));
const doc2 = docMaterials(true);
doc2.entities.push(label({ x: 100, y: 100 }, 'BẾP'));
ok('đổi Doc ⇒ bản ghi thành CŨ (băm khác)', isRecordStale(record, doc2));
let list: EvalRecord[] = [];
for (let i = 0; i < MAX_RECORDS_PER_PROJECT + 5; i++) {
  list = mergeRecordIntoList(list, { ...record, id: `r${i}`, createdAt: `2026-09-03T00:00:${String(i).padStart(2, '0')}.000Z` });
}
ok(`danh sách bản ghi giữ trần ${MAX_RECORDS_PER_PROJECT}, cũ nhất rơi trước`, list.length === MAX_RECORDS_PER_PROJECT && list[0].id === 'r5');
ok('gộp cùng id ⇒ thay, không nhân đôi', mergeRecordIntoList(list, { ...list[3] }).length === MAX_RECORDS_PER_PROJECT);
ok('bản ghi không dùng Date bên trong (createdAt = now truyền vào)', record.createdAt === NOW);

/* ───────────────────────── ⑥ lớp AI: sanitize + tóm tắt ───────────────────────── */
console.log('\n[6] lớp AI tuỳ chọn + tóm tắt');
const ai = sanitizeAiFindings(
  [
    { moTa: 'Bố cục lệch trái', why: 'trọng tâm', domain: 'composition', confidence: 7, severity: 'error', entityIds: ['e1', 2] },
    { moTa: '' },
    'rác',
    { moTa: 'Ánh sáng phẳng', domain: 'khong-co', ruleId: 'ai.light' },
  ],
  EVAL_MODEL,
);
ok('AI: chỉ giữ mục có moTa, bỏ rác', ai.length === 2);
ok('AI: KHÔNG mang severity dù đầu vào có', ai.every((f) => !('severity' in f)));
ok('AI: confidence kẹp [0,1], entityIds chỉ chuỗi', ai[0].confidence === 1 && ai[0].evidence.entityIds.join() === 'e1');
ok('AI: miền lạ rơi về composition, why thiếu thì ghi rõ là xác suất', ai[1].domain === 'composition' && /xác suất/.test(ai[1].why));
ok('AI: 0 lỗi hợp đồng', ai.flatMap(checkFindingContract).length === 0);
const text = summaryForVitals(record);
ok('tóm tắt chứa nguyên văn moTa đầu tiên + nguồn', text.includes(record.findings[0].moTa) && text.includes(record.findings[0].rule.source));
ok(`tóm tắt không quá ${MAX_SUMMARY_LINES + 4} dòng`, text.split('\n').length <= MAX_SUMMARY_LINES + 4);
ok('tóm tắt kết bằng lời dặn không thêm số đo mới', /Không thêm số đo mới/.test(text));

console.log(`\n${pass} ok · ${fail} fail`);
if (fail > 0) process.exit(1);
