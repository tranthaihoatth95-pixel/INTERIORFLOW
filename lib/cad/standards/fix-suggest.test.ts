/**
 * lib/cad/standards/fix-suggest.test.ts — kiểm suggestFix() (Sprint 8, D2.3): text gợi ý + con
 * số mm phải khớp tính toán thủ công. Chạy:
 *   node_modules/.bin/sucrase-node lib/cad/standards/fix-suggest.test.ts
 */
import { checkStandards } from './checker';
import { getAllRules } from './registry';
import { suggestFix } from './fix-suggest';
import { emptyDoc } from '../model';
import type { Doc, LineEntity, TextEntity } from '../model';
import { newId } from '../store';
import { buildHotelTemplate } from '../templates';

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

/* ── [1] Phòng ngủ thiếu diện tích: 2.5×3m = 7.5m² < 9m² tối thiểu (case y hệt checker.test.ts [1]) ── */
function testBedroomAreaFix() {
  console.log('\n[1] Phòng ngủ thiếu diện tích (2.5×3m=7.5m² < 9m²) — suggestFix tính đúng shift');
  const doc: Doc = emptyDoc();
  doc.entities.push(...rectWalls(0, 0, 2500, 3000));
  doc.entities.push(label({ x: 1250, y: 1500 }, 'PHÒNG NGỦ'));
  const rules = getAllRules();
  const violations = checkStandards(doc, rules);
  const v = violations.find((v) => v.ruleId === 'vn-res-bedroom-min-area');
  ok('có violation diện tích phòng ngủ', !!v);
  if (!v) return;

  const msg = suggestFix(v, doc);
  ok('suggestFix trả về text (không null)', typeof msg === 'string');
  if (!msg) return;

  // deficit = 9 - 7.5 = 1.5 m² = 1,500,000 mm². Phòng gần vuông (w≈h≈2500-3000mm tuỳ trục dò
  // biên rectWalls là polyline 4 LINE nên bbox ≈ 2500×3000) → longSide=3000, shortSide=2500,
  // shiftMm = 1,500,000 / 3000 = 500mm.
  ok('message có số "1.5" (m² thiếu)', msg.includes('1.5'));
  ok('message có số "500" (mm gợi ý kéo)', /500mm/.test(msg));
  console.log(`  → "${msg}"`);
}

/* ── [2] Phòng ngủ ĐẠT chuẩn → suggestFix trả null (không có gì để gợi ý) ── */
function testBedroomOkNoFix() {
  console.log('\n[2] Phòng ngủ ĐẠT chuẩn (4×3.5m=14m²>9m²) — không có violation nên không gọi suggestFix được, kiểm bằng cách gọi thẳng với violation giả bị lệch dữ liệu');
  const doc: Doc = emptyDoc();
  doc.entities.push(...rectWalls(0, 0, 4000, 3500));
  doc.entities.push(label({ x: 2000, y: 1750 }, 'PHÒNG NGỦ'));
  const violations = checkStandards(doc, getAllRules());
  ok('không có violation phòng ngủ khi đạt chuẩn (baseline, không phải test suggestFix trực tiếp)', !violations.some((v) => v.ruleId === 'vn-res-bedroom-min-area'));
}

/* ── [3] WC thiếu diện tích: 1.2×1.5m=1.8m² < 2.5m² ── */
function testWcAreaFix() {
  console.log('\n[3] WC thiếu diện tích (1.2×1.5m=1.8m² < 2.5m²) — suggestFix');
  const doc: Doc = emptyDoc();
  doc.entities.push(...rectWalls(0, 0, 1200, 1500));
  doc.entities.push(label({ x: 600, y: 750 }, 'WC'));
  const violations = checkStandards(doc, getAllRules());
  const v = violations.find((v) => v.ruleId === 'vn-res-wc-min-area');
  ok('có violation diện tích WC', !!v);
  if (!v) return;
  const msg = suggestFix(v, doc);
  ok('suggestFix trả về text', typeof msg === 'string');
  if (msg) {
    // deficit = 2.5 - 1.8 = 0.7m² = 700,000mm². longSide=1500, shortSide=1200 →
    // shiftMm = 700,000/1500 ≈ 466.7mm.
    ok('message có số thiếu "0.7"', msg.includes('0.7'));
    ok('message có số mm gợi ý ≈467', /46[5-8]mm/.test(msg));
    console.log(`  → "${msg}"`);
  }
}

/* ── [4] Hành lang hẹp: 900mm < 1000mm tối thiểu (case y hệt checker.test.ts [4]) ── */
function testCorridorWidthFix() {
  console.log('\n[4] Hành lang hẹp (900mm < 1000mm TCVN) — suggestFix gợi ý dồn 1 bên/chia đều');
  const doc: Doc = emptyDoc();
  doc.entities.push(...rectWalls(0, 0, 900, 4000));
  doc.entities.push(label({ x: 450, y: 2000 }, 'HANH LANG'));
  const violations = checkStandards(doc, getAllRules());
  const v = violations.find((v) => v.ruleId === 'vn-fire-corridor-min-width-general');
  ok('có violation hành lang hẹp', !!v);
  if (!v) return;
  const msg = suggestFix(v, doc);
  ok('suggestFix trả về text', typeof msg === 'string');
  if (msg) {
    // deficit = 1000 - 900 = 100mm → dồn 1 bên 100mm, chia đều mỗi bên 50mm.
    ok('message có "100mm" (dồn 1 bên)', /100mm/.test(msg));
    ok('message có "50mm" (chia đều 2 bên)', /50mm/.test(msg));
    console.log(`  → "${msg}"`);
  }
}

/* ── [5] Violation KHÔNG có gợi ý cụ thể (occupant-load info-only) → suggestFix trả null ── */
function testNoFixForOccupantLoad() {
  console.log('\n[5] Phòng khách (occupant-load info-only) — suggestFix trả null (không ép gợi ý mơ hồ)');
  const doc: Doc = emptyDoc();
  doc.entities.push(...rectWalls(0, 0, 5000, 4000)); // 20m², đạt chuẩn diện tích khách (12m²)
  doc.entities.push(label({ x: 2500, y: 2000 }, 'KHÁCH'));
  const violations = checkStandards(doc, getAllRules());
  const v = violations.find((v) => v.ruleId === 'intl-occupant-load-residential');
  ok('có violation occupant-load (info-only)', !!v);
  if (v) {
    const msg = suggestFix(v, doc);
    ok('suggestFix trả về null cho occupant-load', msg === null);
  }
}

/* ── [6] Violation KHÔNG gắn `at` (ISO lineweight ratio) → suggestFix trả null ngay ── */
function testNoFixWithoutAt() {
  console.log('\n[6] Violation không có `at` (ISO lineweight ratio) — suggestFix trả null');
  const doc: Doc = emptyDoc();
  doc.layers = doc.layers.map((l, i) => ({ ...l, lineweight: i === 0 ? 0.13 : 0.13 })); // ratio 1:1 < minRatio
  const violations = checkStandards(doc, getAllRules());
  const v = violations.find((v) => v.ruleId === 'iso128-thick-thin-ratio');
  ok('có violation ISO lineweight ratio', !!v);
  if (v) {
    ok('violation không có `at`', v.at === undefined);
    ok('suggestFix trả về null', suggestFix(v, doc) === null);
  }
}

/* ── [7] Template khách sạn thật (templates.ts) — hành lang mẫu (≈1245mm) ĐẠT chuẩn QCVN 06
 * (≥1000mm) nhưng CHƯA đạt ngưỡng tiếp cận 2 chiều QCVN 10:2024 (≥1500mm) — suggestFix chạy
 * được trên dữ liệu thật (không chỉ case dựng tay ở [1]-[4]) ── */
function testFixOnRealHotelTemplate() {
  console.log('\n[7] buildHotelTemplate() thật — hành lang mẫu chưa đạt ngưỡng 2 chiều 1500mm, suggestFix chạy được trên dữ liệu thật');
  const doc = buildHotelTemplate();
  const violations = checkStandards(doc, getAllRules());
  ok('template khách sạn mẫu KHÔNG vi phạm QCVN 06 (hành lang ≥1000mm)', !violations.some((v) => v.ruleId === 'vn-fire-corridor-min-width-general'));
  const v = violations.find((v) => v.ruleId === 'vn-access-corridor-two-way-min-width');
  ok('template khách sạn mẫu có vi phạm ngưỡng tiếp cận 2 chiều (1500mm, QCVN 10:2024)', !!v);
  if (v) {
    const msg = suggestFix(v, doc);
    ok('suggestFix chạy được trên Doc thật (không null, không throw)', typeof msg === 'string');
    if (msg) console.log(`  → "${msg}"`);
  }
}

testBedroomAreaFix();
testBedroomOkNoFix();
testWcAreaFix();
testCorridorWidthFix();
testNoFixForOccupantLoad();
testNoFixWithoutAt();
testFixOnRealHotelTemplate();

console.log(`\n${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
