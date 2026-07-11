/**
 * lib/cad/standards/checker.test.ts — kiểm rule-engine (đo hình học thật, không đoán mò). Chạy:
 *   node_modules/.bin/sucrase-node lib/cad/standards/checker.test.ts
 */
import { checkStandards } from './checker';
import { getAllRules } from './registry';
import { emptyDoc } from '../model';
import type { Doc, LineEntity, TextEntity } from '../model';
import { newId } from '../store';

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

function testUndersizedBedroom() {
  console.log('\n[1] Phòng ngủ dưới chuẩn (8×3m = 24m²... test với phòng NHỎ THẬT, 2.5×3=7.5m² < 9m²)');
  const doc: Doc = emptyDoc();
  doc.entities.push(...rectWalls(0, 0, 2500, 3000)); // 2.5x3m = 7.5m² < 9m² TCVN
  doc.entities.push(label({ x: 1250, y: 1500 }, 'PHÒNG NGỦ'));
  const rules = getAllRules();
  const violations = checkStandards(doc, rules);
  const v = violations.find((v) => v.ruleId === 'vn-res-bedroom-min-area');
  ok('phát hiện vi phạm diện tích phòng ngủ', !!v);
  ok('violation có nguồn TCVN 4451:2012', !!v?.source.includes('TCVN 4451'));
  ok('violation gắn đúng vị trí (at) để zoom tới', !!v?.at && Math.abs(v.at.x - 1250) < 1);
}

function testOkBedroom() {
  console.log('\n[2] Phòng ngủ ĐẠT chuẩn (4×3.5m = 14m² > 9m²) → không có violation');
  const doc: Doc = emptyDoc();
  doc.entities.push(...rectWalls(0, 0, 4000, 3500));
  doc.entities.push(label({ x: 2000, y: 1750 }, 'PHÒNG NGỦ'));
  const violations = checkStandards(doc, getAllRules());
  ok('không có violation phòng ngủ khi đạt chuẩn', !violations.some((v) => v.ruleId === 'vn-res-bedroom-min-area'));
}

function testWcUndersized() {
  console.log('\n[3] WC dưới chuẩn (1.2×1.5m=1.8m² < 2.5m²)');
  const doc: Doc = emptyDoc();
  doc.entities.push(...rectWalls(0, 0, 1200, 1500));
  doc.entities.push(label({ x: 600, y: 750 }, 'WC'));
  const violations = checkStandards(doc, getAllRules());
  ok('phát hiện vi phạm diện tích WC', violations.some((v) => v.ruleId === 'vn-res-wc-min-area'));
}

function testCorridorNarrow() {
  console.log('\n[4] Hành lang hẹp (900mm < 1000mm tối thiểu)');
  const doc: Doc = emptyDoc();
  doc.entities.push(...rectWalls(0, 0, 900, 4000)); // dải dài 900×4000mm
  doc.entities.push(label({ x: 450, y: 2000 }, 'HANH LANG'));
  const violations = checkStandards(doc, getAllRules());
  const v = violations.find((v) => v.ruleId === 'vn-fire-corridor-min-width-general');
  ok('phát hiện hành lang hẹp hơn 1.0m', !!v);
  ok('message có số đo bề rộng thật', !!v?.message.includes('900') || !!v?.message.match(/9\d\dmm/));
}

function testNoRoomNoViolation() {
  console.log('\n[5] Không có nhãn phòng nào → không sinh violation nào (không đoán mò)');
  const doc: Doc = emptyDoc();
  doc.entities.push({ id: newId('e'), type: 'line', layer: LAY, a: { x: 0, y: 0 }, b: { x: 1000, y: 0 } });
  const violations = checkStandards(doc, getAllRules());
  ok('0 violation khi không có nhãn phòng nào', violations.length === 0);
}

function testRegistryIntegrity() {
  console.log('\n[6] Registry — mọi rule verified=false PHẢI có note giải thích');
  const rules = getAllRules();
  ok('có rule (không rỗng)', rules.length > 0);
  const badUnverified = rules.filter((r) => !r.verified && !r.note);
  ok('mọi rule chưa verified đều có note lý do', badUnverified.length === 0);
  const ids = rules.map((r) => r.id);
  ok('không có id trùng lặp giữa các nhóm', new Set(ids).size === ids.length);
}

testUndersizedBedroom();
testOkBedroom();
testWcUndersized();
testCorridorNarrow();
testNoRoomNoViolation();
testRegistryIntegrity();

console.log(`\n${pass} ok, ${fail} fail`);
if (fail > 0) process.exit(1);
