/**
 * lib/cad/standards/rule-effective-date.test.ts — T2 (05/08): chiều THỜI GIAN của StandardRule.
 * Kiểm `resolveRulesAsOf()` (registry.ts) + đường nối vào `checkStandards()` (checker.ts).
 * Chạy: node_modules/.bin/sucrase-node lib/cad/standards/rule-effective-date.test.ts
 *
 * Ca thật đứng sau bộ test này: QCVN 10:2024/BXD (Thông tư 06/2024/TT-BXD) hiệu lực 01/02/2025,
 * dự án đã thẩm định TRƯỚC mốc đó vẫn theo QCVN 10:2014 ⇒ hai dự án mở cùng lúc phải được kiểm
 * bằng hai bộ số khác nhau. Số dùng trong test là số GIẢ ĐỊNH của rule dựng riêng cho test —
 * KHÔNG lấy trị số quy chuẩn thật, để test không bị đọc nhầm thành nguồn số liệu.
 */
import { resolveRulesAsOf } from './registry';
import type { StandardRule } from './registry';
import { checkStandards } from './checker';
import { emptyDoc } from '../model';
import type { Doc, LineEntity, TextEntity } from '../model';
import { newId } from '../store';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

const base = {
  category: 'room-size' as const,
  severity: 'error' as const,
  params: { minAreaM2: 9 },
  verified: false,
  note: 'Rule GIẢ ĐỊNH chỉ dùng cho test, không phải trị số quy chuẩn thật.',
};

/** Bản CŨ: có hiệu lực từ 2014, bị bản 2024 thay thế. */
const OLD: StandardRule = {
  ...base,
  id: 'test-old',
  source: 'Quy chuẩn giả định bản 2014 (test)',
  description: 'Bản cũ.',
  params: { minAreaM2: 8 },
  effectiveFrom: '2014-07-01',
  supersededBy: 'test-new',
};
/** Bản MỚI: hiệu lực 01/02/2025 (đúng mốc thật của QCVN 10:2024/BXD). */
const NEW: StandardRule = {
  ...base,
  id: 'test-new',
  source: 'Quy chuẩn giả định bản 2024 (test)',
  description: 'Bản mới.',
  params: { minAreaM2: 10 },
  effectiveFrom: '2025-02-01',
};
/** Rule KHÔNG khai chiều thời gian — phải giữ nguyên hành vi cũ ở mọi ngày mốc. */
const TIMELESS: StandardRule = {
  ...base,
  id: 'test-timeless',
  source: 'Không khai hiệu lực (test)',
  description: 'Rule cũ chưa khai effectiveFrom.',
};
const SET = [OLD, NEW, TIMELESS];
const ids = (rs: StandardRule[]) => rs.map((r) => r.id).sort().join(',');

function testTransitional() {
  console.log('\n[1] Dự án thẩm định TRƯỚC 01/02/2025 → vẫn áp bản CŨ (điều khoản chuyển tiếp)');
  const r = resolveRulesAsOf(SET, '2024-12-31');
  ok('chỉ còn bản cũ + rule không-thời-gian', ids(r.rules) === 'test-old,test-timeless');
  ok('bản mới bị loại vì chưa có hiệu lực', !r.rules.some((x) => x.id === 'test-new'));
  ok('có ghi chú chuyển tiếp cho đúng rule cũ', (r.noteByRuleId['test-old'] ?? '').includes('chuyển tiếp'));
  ok('ghi chú nêu rõ ngày hiệu lực của bản thay thế', (r.noteByRuleId['test-old'] ?? '').includes('2025-02-01'));
  ok('không cảnh báo "chưa khai ngày" khi đã có ngày', r.note === undefined);
  ok('asOfDate trả về đúng ngày đã dùng', r.asOfDate === '2024-12-31');
}

function testAfterEffective() {
  console.log('\n[2] Dự án thẩm định SAU 01/02/2025 → bản MỚI thay hẳn bản cũ');
  const r = resolveRulesAsOf(SET, '2025-02-01'); // đúng NGÀY hiệu lực: đã áp bản mới
  ok('đúng ngày hiệu lực đã áp bản mới (biên <=)', ids(r.rules) === 'test-new,test-timeless');
  const r2 = resolveRulesAsOf(SET, '2026-08-05');
  ok('ngày sau đó vẫn là bản mới', ids(r2.rules) === 'test-new,test-timeless');
  ok('không còn ghi chú chuyển tiếp', Object.keys(r2.noteByRuleId).length === 0);
}

function testNoDate() {
  console.log('\n[3] KHÔNG có ngày mốc → dùng bộ MỚI NHẤT + ghi chú rõ (không được đoán ngày)');
  const r = resolveRulesAsOf(SET);
  ok('bộ mới nhất: bản cũ nhường chỗ', ids(r.rules) === 'test-new,test-timeless');
  ok('asOfDate = null', r.asOfDate === null);
  ok('có ghi chú "BỘ QUY CHUẨN MỚI NHẤT"', (r.note ?? '').includes('MỚI NHẤT'));
  ok('ghi chú nhắc điều khoản chuyển tiếp', (r.note ?? '').includes('bản cũ'));
}

function testNoTimeDimension() {
  console.log('\n[4] Bộ rule KHÔNG có chiều thời gian → không đổi gì, không cảnh báo thừa');
  const only = [TIMELESS];
  const r = resolveRulesAsOf(only);
  ok('giữ nguyên đủ rule', ids(r.rules) === 'test-timeless');
  ok('KHÔNG cảnh báo khi bộ rule không có chiều thời gian', r.note === undefined);
  const r2 = resolveRulesAsOf(only, '2020-01-01');
  ok('rule không khai effectiveFrom áp cho mọi mốc (kể cả rất cũ)', ids(r2.rules) === 'test-timeless');
}

function testBadInput() {
  console.log('\n[5] Dữ liệu vào hỏng → an toàn, không nuốt rule âm thầm');
  ok('ngày sai định dạng ⇒ coi như không có ngày', resolveRulesAsOf(SET, '05/08/2026').asOfDate === null);
  ok('chuỗi rỗng ⇒ không có ngày', resolveRulesAsOf(SET, '').asOfDate === null);
  ok('tháng 13 ⇒ không hợp lệ', resolveRulesAsOf(SET, '2025-13-01').asOfDate === null);
  ok('chuỗi ISO đầy đủ vẫn đọc được phần ngày', resolveRulesAsOf(SET, '2024-12-31T10:20:30Z').asOfDate === '2024-12-31');

  const orphan: StandardRule = { ...OLD, id: 'test-orphan', supersededBy: 'khong-ton-tai' };
  const r = resolveRulesAsOf([orphan], '2026-01-01');
  ok('supersededBy trỏ id không tồn tại ⇒ GIỮ rule, không throw', ids(r.rules) === 'test-orphan');

  const badFrom: StandardRule = { ...TIMELESS, id: 'test-badfrom', effectiveFrom: 'hôm qua' };
  ok('effectiveFrom hỏng ⇒ giữ rule (không âm thầm loại)', ids(resolveRulesAsOf([badFrom], '2026-01-01').rules) === 'test-badfrom');
}

/* ── Đường nối thật: checkStandards() phải dùng đúng bộ rule theo ngày mốc ─────────────────── */

const LAY = 'l-wall';
function rectWalls(x0: number, y0: number, x1: number, y1: number): LineEntity[] {
  const p = [{ x: x0, y: y0 }, { x: x1, y: y0 }, { x: x1, y: y1 }, { x: x0, y: y1 }];
  return [0, 1, 2, 3].map((i) => ({ id: newId('e'), type: 'line' as const, layer: LAY, a: p[i], b: p[(i + 1) % 4] }));
}
function bedroomDoc(wMm: number, hMm: number): Doc {
  const doc: Doc = emptyDoc();
  doc.entities.push(...rectWalls(0, 0, wMm, hMm));
  const t: TextEntity = { id: newId('e'), type: 'text', layer: 'l-text', at: { x: wMm / 2, y: hMm / 2 }, text: 'PHÒNG NGỦ', h: 200 };
  doc.entities.push(t);
  return doc;
}
/** Hai phiên bản của CÙNG rule diện tích phòng ngủ có thật trong registry (`vn-res-bedroom-min-area`),
 * dựng riêng cho test để đo đúng nhánh bedroom của checkStandards. Số 8/10 m² là GIẢ ĐỊNH. */
const BEDROOM_OLD: StandardRule = { ...OLD, id: 'vn-res-bedroom-min-area', params: { minAreaM2: 8 }, supersededBy: 'test-bedroom-2024' };
const BEDROOM_NEW: StandardRule = { ...NEW, id: 'test-bedroom-2024', params: { minAreaM2: 10 } };

function testCheckerUsesDate() {
  console.log('\n[6] checkStandards() chọn bộ số theo NGÀY MỐC DỰ ÁN, không theo ngày hệ thống');
  const doc = bedroomDoc(3000, 3000); // 9 m²: ĐẠT bản cũ (≥8), TRƯỢT bản mới (<10)
  const rules = [BEDROOM_OLD, BEDROOM_NEW];

  const before = checkStandards(doc, rules, { asOfDate: '2024-12-31' });
  ok('dự án cũ (9m² ≥ 8m² bản cũ) → KHÔNG vi phạm', !before.some((v) => v.ruleId === 'vn-res-bedroom-min-area'));

  const after = checkStandards(doc, rules, { asOfDate: '2025-06-01' });
  const v = after.find((v) => v.ruleId === 'test-bedroom-2024');
  ok('dự án mới (9m² < 10m² bản mới) → CÓ vi phạm', !!v);
  ok('vi phạm không kèm ghi chú thời gian khi đã khai ngày', v?.asOfNote === undefined);

  const noDate = checkStandards(doc, rules);
  const v2 = noDate.find((v) => v.ruleId === 'test-bedroom-2024');
  ok('không khai ngày → dùng bản mới', !!v2);
  ok('không khai ngày → violation kèm asOfNote cảnh báo', (v2?.asOfNote ?? '').includes('MỚI NHẤT'));
}

function testBackwardCompat() {
  console.log('\n[7] Không hồi quy: gọi checkStandards 2 tham số như cũ vẫn chạy y nguyên');
  const doc = bedroomDoc(2500, 3000); // 7.5 m² — trượt cả hai bản
  const rules = [BEDROOM_OLD, BEDROOM_NEW];
  const legacy = checkStandards(doc, rules);
  ok('vẫn sinh violation như trước', legacy.length > 0);
  ok('rule KHÔNG khai chiều thời gian ⇒ asOfNote undefined', checkStandards(doc, [TIMELESS]).every((v) => v.asOfNote === undefined));
}

function testAliasChain() {
  console.log('\n[8] Chuỗi thay thế nhiều đời + chuỗi vòng hỏng');
  const v1: StandardRule = { ...base, id: 'r-2014', source: 's', description: 'd', effectiveFrom: '2014-01-01', supersededBy: 'r-2024' };
  const v2: StandardRule = { ...base, id: 'r-2024', source: 's', description: 'd', effectiveFrom: '2024-01-01', supersededBy: 'r-2031' };
  const v3: StandardRule = { ...base, id: 'r-2031', source: 's', description: 'd', effectiveFrom: '2031-01-01' };
  const r = resolveRulesAsOf([v1, v2, v3], '2032-01-01');
  ok('chỉ còn bản cuối cùng', ids(r.rules) === 'r-2031');
  ok('id đời 1 trỏ THẲNG tới bản đang hiệu lực', r.aliasByOldId['r-2014'] === 'r-2031');
  ok('id đời 2 cũng trỏ đúng', r.aliasByOldId['r-2024'] === 'r-2031');

  const mid = resolveRulesAsOf([v1, v2, v3], '2025-06-01');
  ok('mốc giữa: đang áp bản 2024', ids(mid.rules) === 'r-2024');
  ok('mốc giữa: id đời 1 trỏ tới bản 2024', mid.aliasByOldId['r-2014'] === 'r-2024');

  const a: StandardRule = { ...base, id: 'cyc-a', source: 's', description: 'd', supersededBy: 'cyc-b' };
  const b: StandardRule = { ...base, id: 'cyc-b', source: 's', description: 'd', supersededBy: 'cyc-a' };
  const cyc = resolveRulesAsOf([a, b], '2026-01-01');
  ok('chuỗi VÒNG không treo vòng lặp, không throw', Array.isArray(cyc.rules));
}

console.log('=== rule-effective-date.test.ts (T2 — chiều thời gian của StandardRule) ===');
testTransitional();
testAfterEffective();
testNoDate();
testNoTimeDimension();
testBadInput();
testCheckerUsesDate();
testBackwardCompat();
testAliasChain();
console.log(`\n${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
