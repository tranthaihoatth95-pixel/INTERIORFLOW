/**
 * lib/cad/operator-profile.test.ts — kiểm phân loại operator (PHA 1 Gu Engine). Chạy:
 *   node_modules/.bin/sucrase-node lib/cad/operator-profile.test.ts
 */
import {
  classifyOperator, blockCategory, rulesForOperator, ruleGroupIdsForOperator,
} from './operator-profile';
import type { OperatorType } from './operator-profile';
import { emptyDoc } from './model';
import type { Doc } from './model';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

/* helper: dựng Doc từ danh sách block id + text (đủ cho classifier, không cần solver thật). */
function docWith(blocks: string[], texts: string[] = []): Doc {
  const d = emptyDoc();
  blocks.forEach((b, i) =>
    d.entities.push({ id: `b${i}`, type: 'block', layer: 'l-furniture', block: b, at: { x: i * 100, y: 0 }, rot: 0, sx: 1, sy: 1 }),
  );
  texts.forEach((t, i) =>
    d.entities.push({ id: `t${i}`, type: 'text', layer: 'l-text', at: { x: 0, y: i * 100 }, text: t, h: 200 }),
  );
  return d;
}

function testBlockCategory() {
  console.log('\n[1] blockCategory — rút danh mục từ id block');
  ok('bedD → bed', blockCategory('bedD') === 'bed');
  ok('id .dxf thư viện phong-ngu → bed', blockCategory('bedroom-bed-queen') === 'bed');
  ok('desk → desk', blockCategory('desk') === 'desk');
  ok('dining6 → dining', blockCategory('dining6') === 'dining');
  ok('kitchenI → kitchen', blockCategory('kitchenI') === 'kitchen');
  ok('sofa3 → sofa', blockCategory('sofa3') === 'sofa');
  ok('toilet → sanitary', blockCategory('toilet') === 'sanitary');
  ok('door → other', blockCategory('door') === 'other');
}

function testOfficeFromDoc() {
  console.log('\n[2] Cụm bàn làm việc từ Doc → office');
  const doc = docWith(['desk', 'desk', 'desk', 'desk', 'toilet']);
  const p = classifyOperator({ doc });
  ok('operator = office', p.operator === 'office');
  ok('confidence > 0.5', p.confidence > 0.5);
  ok('có evidence block bàn làm việc', p.evidence.some((e) => e.signal === 'block' && e.operator === 'office'));
  ok('ruleGroupIds gồm intl-egress', p.ruleGroupIds.includes('intl-egress'));
  ok('KHÔNG gồm vn-residential', !p.ruleGroupIds.includes('vn-residential'));
}

function testResidentialFromDoc() {
  console.log('\n[3] Giường + sofa + bếp → nhà ở');
  const doc = docWith(['bedD', 'bedS', 'sofa3', 'wardrobe', 'kitchenI', 'toilet']);
  const p = classifyOperator({ doc });
  ok('operator = residential', p.operator === 'residential');
  ok('ruleGroupIds gồm vn-residential', p.ruleGroupIds.includes('vn-residential'));
}

function testFnbFromBlocksAndText() {
  console.log('\n[4] Nhiều bàn ăn + từ khoá nhà hàng → F&B');
  const p = classifyOperator({
    blocks: { dining4: 6, kitchenI: 2 },
    text: 'Mặt bằng nhà hàng tầng 1 — khu bếp công nghiệp',
  });
  ok('operator = f&b', p.operator === 'f&b');
  ok('có evidence text nhà hàng', p.evidence.some((e) => e.signal === 'text' && e.operator === 'f&b'));
  ok('điểm f&b > residential', p.scores['f&b'] > p.scores.residential);
}

function testTextOnly() {
  console.log('\n[5] Chỉ text (chưa có Doc) — retail / hospitality / clinic');
  ok('showroom → retail', classifyOperator({ text: 'thiết kế showroom trưng bày' }).operator === 'retail');
  ok('khách sạn → hospitality', classifyOperator({ text: 'sảnh lễ tân khách sạn 5 sao' }).operator === 'hospitality');
  ok('phòng khám → clinic', classifyOperator({ text: 'phòng khám nha khoa' }).operator === 'clinic');
}

function testRoomsSignal() {
  console.log('\n[6] Tín hiệu tập phòng (RoomFunction) độc lập');
  const p = classifyOperator({ rooms: ['office', 'office', 'phòng họp'] });
  ok('rooms office → operator office', p.operator === 'office');
  ok('evidence có signal room', p.evidence.some((e) => e.signal === 'room'));
}

function testEmptyGeneric() {
  console.log('\n[7] Không đủ tín hiệu → generic, confidence 0');
  const p = classifyOperator({ doc: emptyDoc() });
  ok('operator = generic', p.operator === 'generic');
  ok('confidence = 0', p.confidence === 0);
  ok('generic chỉ áp iso-drafting', p.ruleGroupIds.length === 1 && p.ruleGroupIds[0] === 'iso-drafting');
}

function testDeterministic() {
  console.log('\n[8] Tất định — cùng input ra cùng nhãn & điểm');
  const mk = () => classifyOperator({ doc: docWith(['desk', 'desk', 'desk']), text: 'coworking' });
  const a = mk();
  const b = mk();
  ok('operator giống nhau', a.operator === b.operator);
  ok('scores giống nhau', JSON.stringify(a.scores) === JSON.stringify(b.scores));
}

function testRulesForOperator() {
  console.log('\n[9] rulesForOperator — lọc BUILTIN_GROUPS đúng, không sửa registry');
  const ops: OperatorType[] = ['residential', 'office', 'f&b', 'retail', 'hospitality', 'clinic', 'generic'];
  for (const op of ops) {
    const groups = rulesForOperator(op);
    const ids = ruleGroupIdsForOperator(op);
    ok(`${op}: số group khớp id map (${groups.length})`, groups.length === ids.length);
    ok(`${op}: mọi group id nằm trong map`, groups.every((g) => ids.includes(g.id)));
  }
  ok('generic chỉ có iso-drafting', rulesForOperator('generic').every((g) => g.id === 'iso-drafting'));
  ok('residential có vn-residential', rulesForOperator('residential').some((g) => g.id === 'vn-residential'));
}

testBlockCategory();
testOfficeFromDoc();
testResidentialFromDoc();
testFnbFromBlocksAndText();
testTextOnly();
testRoomsSignal();
testEmptyGeneric();
testDeterministic();
testRulesForOperator();

console.log(`\n${pass} ok, ${fail} fail`);
if (fail > 0) process.exit(1);
