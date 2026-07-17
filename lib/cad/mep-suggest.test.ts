/**
 * lib/cad/mep-suggest.test.ts — Sprint 6, kiểm MEP sơ cấp (chiếu sáng + ổ cắm/AC). Chạy:
 *   node_modules/.bin/sucrase-node lib/cad/mep-suggest.test.ts
 */
import {
  estimateLightingSuggestion, toLightingRoomKind, suggestLightGridPositions,
  suggestRoomLightingPlan, suggestRoomLightingPlans,
  suggestSwitchPositions, suggestCircuitGroups, suggestOutletPlacements,
  checkAcUnitBedProximity, AC_MIN_DISTANCE_FROM_BED_HEAD_MM,
} from './mep-suggest';
import { emptyDoc } from './model';
import type { Doc, LineEntity, TextEntity, BlockEntity } from './model';
import { newId } from './store';
import { findRoomLabels } from './standards/checker';

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
function block(block_: string, at: { x: number; y: number }, extra: Partial<BlockEntity> = {}): BlockEntity {
  return { id: newId('e'), type: 'block', layer: 'l-furniture', block: block_, at, rot: 0, sx: 1, sy: 1, ...extra };
}

/* ─────────────── D1.1 lux suggest ─────────────── */

function testLuxLivingRoom() {
  console.log('\n[1] D1.1 — phòng khách 20m² → target 225 lux, 4500 lumen, 5 đèn (4500/900)');
  const s = estimateLightingSuggestion(20, 'living');
  ok('không null', !!s);
  ok('minLux=150 maxLux=300 (tái dùng vn-lighting.ts)', s?.minLux === 150 && s?.maxLux === 300);
  ok('targetLux=225', s?.targetLux === 225);
  ok('totalLumensTarget=4500', s?.totalLumensTarget === 4500);
  ok('recommendedDownlightCount=5', s?.recommendedDownlightCount === 5);
}

function testLuxBedroom() {
  console.log('\n[2] D1.1 — phòng ngủ 12m² → target 125 lux, 1500 lumen → round(1.67)=2 đèn');
  const s = estimateLightingSuggestion(12, 'bedroom');
  ok('targetLux=125', s?.targetLux === 125);
  ok('recommendedDownlightCount=2', s?.recommendedDownlightCount === 2);
}

function testLuxKitchen() {
  console.log('\n[3] D1.1 — bếp 8m² → target 400 lux, 3200 lumen → round(3.56)=4 đèn');
  const s = estimateLightingSuggestion(8, 'kitchen');
  ok('targetLux=400', s?.targetLux === 400);
  ok('recommendedDownlightCount=4', s?.recommendedDownlightCount === 4);
}

function testLuxInvalidArea() {
  console.log('\n[4] D1.1 — diện tích <= 0 → null (không đoán mò)');
  ok('areaM2=0 → null', estimateLightingSuggestion(0, 'living') === null);
  ok('areaM2=-5 → null', estimateLightingSuggestion(-5, 'bedroom') === null);
}

function testToLightingRoomKind() {
  console.log('\n[5] toLightingRoomKind — chỉ 3 loại có số liệu tham khảo, còn lại null');
  ok('living → living', toLightingRoomKind('living') === 'living');
  ok('bedroom → bedroom', toLightingRoomKind('bedroom') === 'bedroom');
  ok('kitchen → kitchen', toLightingRoomKind('kitchen') === 'kitchen');
  ok('wc → null (không có số liệu tham khảo)', toLightingRoomKind('wc') === null);
  ok('corridor → null', toLightingRoomKind('corridor') === null);
  ok('office → null', toLightingRoomKind('office') === null);
}

/* ─────────────── D1.2 light grid placement ─────────────── */

function testGridBasicRectangle() {
  console.log('\n[6] D1.2 — phòng chữ nhật 4000×3000, count=4 → 4 điểm, đều nằm trong biên, không trùng nhau');
  const poly = [{ x: 0, y: 0 }, { x: 4000, y: 0 }, { x: 4000, y: 3000 }, { x: 0, y: 3000 }];
  const pts = suggestLightGridPositions(poly, 4);
  ok('trả về đúng 4 điểm', pts.length === 4);
  const keys = new Set(pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`));
  ok('không có điểm trùng nhau', keys.size === 4);
  ok('mọi điểm nằm trong biên bbox (không ra ngoài phòng)', pts.every((p) => p.x > 0 && p.x < 4000 && p.y > 0 && p.y < 3000));
}

function testGridZeroCount() {
  console.log('\n[7] D1.2 — count=0 → mảng rỗng');
  const poly = [{ x: 0, y: 0 }, { x: 1000, y: 0 }, { x: 1000, y: 1000 }, { x: 0, y: 1000 }];
  ok('count=0 → []', suggestLightGridPositions(poly, 0).length === 0);
}

function testGridWideCorridorLikeRoom() {
  console.log('\n[8] D1.2 — phòng dài & hẹp 6000×1500, count=3 → vẫn 3 điểm, dàn dọc theo chiều dài');
  const poly = [{ x: 0, y: 0 }, { x: 6000, y: 0 }, { x: 6000, y: 1500 }, { x: 0, y: 1500 }];
  const pts = suggestLightGridPositions(poly, 3);
  ok('trả về đúng 3 điểm', pts.length === 3);
  const xs = pts.map((p) => p.x).sort((a, b) => a - b);
  ok('3 điểm dàn trải theo X (không dồn 1 chỗ)', xs[2] - xs[0] > 2000);
}

/* ─────────────── D1.1+D1.2 gộp qua Doc thật ─────────────── */

function testRoomLightingPlanBedroom() {
  console.log('\n[9] suggestRoomLightingPlan — phòng ngủ 4×3m=12m² thật (đo qua findHatchBoundary) → 2 đèn, vị trí trong biên');
  const doc: Doc = emptyDoc();
  doc.entities.push(...rectWalls(0, 0, 4000, 3000));
  doc.entities.push(label({ x: 2000, y: 1500 }, 'PHÒNG NGỦ'));
  const rooms = findRoomLabels(doc);
  ok('dò được 1 phòng', rooms.length === 1);
  const plan = suggestRoomLightingPlan(doc, rooms[0]);
  ok('có plan', !!plan);
  ok('recommendedDownlightCount=2', plan?.lighting.recommendedDownlightCount === 2);
  ok('positions.length <= count và > 0', !!plan && plan.positions.length > 0 && plan.positions.length <= plan.lighting.recommendedDownlightCount);
}

function testRoomLightingPlansSkipsUnsupportedKind() {
  console.log('\n[10] suggestRoomLightingPlans — phòng "WC" (không có số liệu lux tham khảo) bị bỏ qua, không sinh plan giả');
  const doc: Doc = emptyDoc();
  doc.entities.push(...rectWalls(0, 0, 2000, 1500));
  doc.entities.push(label({ x: 1000, y: 750 }, 'WC'));
  const plans = suggestRoomLightingPlans(doc);
  ok('0 plan cho phòng WC', plans.length === 0);
}

/* ─────────────── D1.4 switch position ─────────────── */

function testSwitchPositionDoor() {
  console.log('\n[11] D1.4 — cửa "door" 900mm tại (1000,0), rot=0 → công tắc ở (1000+450+175, 175)=(1625,175)');
  const doc: Doc = emptyDoc();
  doc.entities.push(block('door', { x: 1000, y: 0 }));
  const sug = suggestSwitchPositions(doc);
  ok('có 1 gợi ý', sug.length === 1);
  ok('vị trí X đúng 1625', Math.abs(sug[0].at.x - 1625) < 1e-6);
  ok('vị trí Y đúng 175', Math.abs(sug[0].at.y - 175) < 1e-6);
  ok('không có ghi chú giới hạn (cửa 1 cánh có bản lề rõ)', !sug[0].note.includes('không có "phía bản lề"'));
}

function testSwitchPositionDoubleDoorHasLimitNote() {
  console.log('\n[12] D1.4 — cửa 2 cánh (doubleDoor) → note phải nêu rõ giới hạn "không có phía bản lề"');
  const doc: Doc = emptyDoc();
  doc.entities.push(block('doubleDoor', { x: 0, y: 0 }));
  const sug = suggestSwitchPositions(doc);
  ok('có ghi chú giới hạn', sug[0]?.note.includes('không có "phía bản lề"'));
}

function testSwitchPositionIgnoresNonDoorBlocks() {
  console.log('\n[13] D1.4 — block không phải cửa (vd sofa2) → không sinh gợi ý công tắc');
  const doc: Doc = emptyDoc();
  doc.entities.push(block('sofa2', { x: 0, y: 0 }));
  ok('0 gợi ý', suggestSwitchPositions(doc).length === 0);
}

/* ─────────────── D1.5 circuit group hint ─────────────── */

function testCircuitGroupHint() {
  console.log('\n[14] D1.5 — 2 downlight + 1 pendant (mạch chính) + 1 track (mạch phụ)');
  const doc: Doc = emptyDoc();
  doc.entities.push(block('lightDownlight', { x: 0, y: 0 }));
  doc.entities.push(block('lightDownlight', { x: 500, y: 0 }));
  doc.entities.push(block('lightPendant', { x: 1000, y: 0 }));
  doc.entities.push(block('lightTrack', { x: 1500, y: 0 }));
  const hint = suggestCircuitGroups(doc);
  ok('mainCircuitCount=3', hint.mainCircuitCount === 3);
  ok('accentCircuitCount=1', hint.accentCircuitCount === 1);
  ok('note nêu đúng số lượng', hint.note.includes('3 đèn') && hint.note.includes('1 đèn'));
}

function testCircuitGroupHintEmpty() {
  console.log('\n[15] D1.5 — bản vẽ chưa có đèn nào → note báo rõ chưa có gì để gợi ý');
  const doc: Doc = emptyDoc();
  const hint = suggestCircuitGroups(doc);
  ok('main=0 accent=0', hint.mainCircuitCount === 0 && hint.accentCircuitCount === 0);
  ok('note báo chưa có đèn', hint.note.includes('Chưa có đèn nào'));
}

/* ─────────────── D2.1 outlet placement ─────────────── */

function testOutletPlacementNightstand() {
  console.log('\n[16] D2.1 — tủ đầu giường (nightstand, w=450) tại (0,0) → ổ cắm gợi ý ở (225+150, 0)=(375,0)');
  const doc: Doc = emptyDoc();
  doc.entities.push(block('nightstand', { x: 0, y: 0 }));
  const sug = suggestOutletPlacements(doc);
  ok('có 1 gợi ý', sug.length === 1);
  ok('vị trí X đúng 375', Math.abs(sug[0].at.x - 375) < 1e-6);
  ok('vị trí Y đúng 0', Math.abs(sug[0].at.y - 0) < 1e-6);
}

function testOutletPlacementKitchenAndDesk() {
  console.log('\n[17] D2.1 — bàn làm việc (desk) + bếp chữ I (kitchenI) đều được gợi ý, đồ khác (armchair) thì không');
  const doc: Doc = emptyDoc();
  doc.entities.push(block('desk', { x: 0, y: 0 }));
  doc.entities.push(block('kitchenI', { x: 5000, y: 0 }));
  doc.entities.push(block('armchair', { x: 9000, y: 0 }));
  const sug = suggestOutletPlacements(doc);
  ok('2 gợi ý (desk + kitchenI, KHÔNG armchair)', sug.length === 2);
  ok('không có gợi ý nào cho armchair', !sug.some((s) => s.forBlock === 'armchair'));
}

/* ─────────────── D2.6 AC unit proximity ─────────────── */

function testAcUnitTooCloseToBedHead() {
  console.log('\n[18] D2.6 — máy lạnh đặt NGAY tại đầu giường (bedS, headboard tại y=1000) → cảnh báo quá gần');
  const doc: Doc = emptyDoc();
  doc.entities.push(block('bedS', { x: 0, y: 0 }));
  doc.entities.push(block('acUnit', { x: 0, y: 1000 }));
  const checks = checkAcUnitBedProximity(doc);
  ok('có 1 cặp kiểm tra', checks.length === 1);
  ok('khoảng cách ≈0', checks[0].distanceMm < 1);
  ok('tooClose=true', checks[0].tooClose === true);
}

function testAcUnitFarEnoughFromBedHead() {
  console.log('\n[19] D2.6 — máy lạnh cách đầu giường 2000mm (> ngưỡng 1800mm) → ĐẠT, không cảnh báo');
  const doc: Doc = emptyDoc();
  doc.entities.push(block('bedS', { x: 0, y: 0 })); // headboard world tại (0,1000)
  doc.entities.push(block('acUnit', { x: 0, y: 3000 })); // cách đầu giường đúng 2000mm
  const checks = checkAcUnitBedProximity(doc);
  ok('khoảng cách ≈2000', Math.abs(checks[0].distanceMm - 2000) < 1e-6);
  ok('tooClose=false', checks[0].tooClose === false);
  ok('ngưỡng mặc định là 1800mm', AC_MIN_DISTANCE_FROM_BED_HEAD_MM === 1800);
}

function testAcUnitNoBedsNoAc() {
  console.log('\n[20] D2.6 — không có giường/máy lạnh nào → mảng rỗng, không báo sai');
  const doc: Doc = emptyDoc();
  doc.entities.push(block('sofa2', { x: 0, y: 0 }));
  ok('0 kết quả', checkAcUnitBedProximity(doc).length === 0);
}

testLuxLivingRoom();
testLuxBedroom();
testLuxKitchen();
testLuxInvalidArea();
testToLightingRoomKind();
testGridBasicRectangle();
testGridZeroCount();
testGridWideCorridorLikeRoom();
testRoomLightingPlanBedroom();
testRoomLightingPlansSkipsUnsupportedKind();
testSwitchPositionDoor();
testSwitchPositionDoubleDoorHasLimitNote();
testSwitchPositionIgnoresNonDoorBlocks();
testCircuitGroupHint();
testCircuitGroupHintEmpty();
testOutletPlacementNightstand();
testOutletPlacementKitchenAndDesk();
testAcUnitTooCloseToBedHead();
testAcUnitFarEnoughFromBedHead();
testAcUnitNoBedsNoAc();

console.log(`\n${pass} ok, ${fail} fail`);
if (fail > 0) process.exit(1);
