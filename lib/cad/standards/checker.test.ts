/**
 * lib/cad/standards/checker.test.ts — kiểm rule-engine (đo hình học thật, không đoán mò). Chạy:
 *   node_modules/.bin/sucrase-node lib/cad/standards/checker.test.ts
 */
import { checkStandards } from './checker';
import { getAllRules } from './registry';
import { emptyDoc } from '../model';
import type { Doc, LineEntity, TextEntity } from '../model';
import { newId } from '../store';
import { wallChain } from '../commands';
import { buildDemoPlan } from '../demo-plan';

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

function testCorridorIntlEgressAndNeufertTwo() {
  console.log('\n[4b] Hành lang 1050mm — vi phạm IBC (1118mm) + Neufert 2 người (1400mm), KHÔNG vi phạm TCVN (1000mm) hay Neufert 1 người (750mm)');
  const doc: Doc = emptyDoc();
  doc.entities.push(...rectWalls(0, 0, 1050, 4000));
  doc.entities.push(label({ x: 525, y: 2000 }, 'HANH LANG'));
  const violations = checkStandards(doc, getAllRules());
  ok('có vi phạm intl-egress-corridor-min-width', violations.some((v) => v.ruleId === 'intl-egress-corridor-min-width'));
  ok('có vi phạm neufert-circulation-two-persons', violations.some((v) => v.ruleId === 'neufert-circulation-two-persons'));
  ok('KHÔNG vi phạm vn-fire-corridor-min-width-general (1050mm > 1000mm)', !violations.some((v) => v.ruleId === 'vn-fire-corridor-min-width-general'));
  ok('KHÔNG vi phạm neufert-circulation-one-person (1050mm > 750mm)', !violations.some((v) => v.ruleId === 'neufert-circulation-one-person'));
}

function testCorridorNeufertTwoOnly() {
  console.log('\n[4c] Hành lang 1200mm — CHỈ vi phạm Neufert 2 người (1400mm), đạt cả TCVN/IBC/Neufert 1 người');
  const doc: Doc = emptyDoc();
  doc.entities.push(...rectWalls(0, 0, 1200, 4000));
  doc.entities.push(label({ x: 600, y: 2000 }, 'HANH LANG'));
  const violations = checkStandards(doc, getAllRules());
  ok('có vi phạm neufert-circulation-two-persons', violations.some((v) => v.ruleId === 'neufert-circulation-two-persons'));
  ok('KHÔNG vi phạm intl-egress-corridor-min-width (1200mm > 1118mm)', !violations.some((v) => v.ruleId === 'intl-egress-corridor-min-width'));
  ok('KHÔNG vi phạm vn-fire-corridor-min-width-general (1200mm > 1000mm)', !violations.some((v) => v.ruleId === 'vn-fire-corridor-min-width-general'));
  ok('KHÔNG vi phạm neufert-circulation-one-person (1200mm > 750mm)', !violations.some((v) => v.ruleId === 'neufert-circulation-one-person'));
}

function testCorridorAllFourViolated() {
  console.log('\n[4d] Hành lang rất hẹp (700mm < 750mm) — vi phạm CẢ 4 rule corridor (TCVN + IBC + Neufert 1 người + Neufert 2 người)');
  const doc: Doc = emptyDoc();
  doc.entities.push(...rectWalls(0, 0, 700, 4000));
  doc.entities.push(label({ x: 350, y: 2000 }, 'HANH LANG'));
  const violations = checkStandards(doc, getAllRules());
  ok('vi phạm vn-fire-corridor-min-width-general', violations.some((v) => v.ruleId === 'vn-fire-corridor-min-width-general'));
  ok('vi phạm intl-egress-corridor-min-width', violations.some((v) => v.ruleId === 'intl-egress-corridor-min-width'));
  ok('vi phạm neufert-circulation-one-person', violations.some((v) => v.ruleId === 'neufert-circulation-one-person'));
  ok('vi phạm neufert-circulation-two-persons', violations.some((v) => v.ruleId === 'neufert-circulation-two-persons'));
}

function testCorridorFullyCompliant() {
  console.log('\n[4e] Hành lang rộng rãi (1500mm) — đạt cả 4 rule, không sinh violation corridor nào');
  const doc: Doc = emptyDoc();
  doc.entities.push(...rectWalls(0, 0, 1500, 4000));
  doc.entities.push(label({ x: 750, y: 2000 }, 'HANH LANG'));
  const violations = checkStandards(doc, getAllRules());
  const corridorRuleIds = ['vn-fire-corridor-min-width-general', 'intl-egress-corridor-min-width', 'neufert-circulation-one-person', 'neufert-circulation-two-persons'];
  ok('không có violation corridor nào khi đạt hết 4 ngưỡng', !violations.some((v) => corridorRuleIds.includes(v.ruleId)));
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

function testTJunctionRoomMeasured() {
  console.log('\n[7] Phòng dưới chuẩn có vách chữ T đâm vào tường bao (quad tường dày) — trước đây dò biên null nên BỎ SÓT vi phạm');
  const doc: Doc = emptyDoc();
  // tường quad dày thật (wallChain) thay vì 4 LINE mảnh: bao 5600×3200 t=200, vách giữa tim
  // x=2800 t=100 đâm chữ T vào tường Nam+Bắc → phòng trái thông thuỷ 2650×3000 = 7.95m² < 9m².
  doc.entities.push(...wallChain([{ x: 0, y: 0 }, { x: 5600, y: 0 }, { x: 5600, y: 3200 }, { x: 0, y: 3200 }], 200, LAY, true));
  doc.entities.push(...wallChain([{ x: 2800, y: 0 }, { x: 2800, y: 3200 }], 100, LAY));
  doc.entities.push(label({ x: 1400, y: 1600 }, 'PHÒNG NGỦ'));
  const violations = checkStandards(doc, getAllRules());
  const v = violations.find((v) => v.ruleId === 'vn-res-bedroom-min-area');
  ok('đo được diện tích phòng kề chữ T → phát hiện vi phạm (hết false negative)', !!v);
  ok('diện tích trong message là số đo thật ~7.9-8.0m²', !!v && /7\.9|8\.0/.test(v.message));
}

function testDemoPlanMeasuresAllRooms() {
  console.log('\n[8] Demo-plan thật: đo được MỌI phòng (kể cả 2 phòng kề chữ T từng bị bỏ qua)');
  const violations = checkStandards(buildDemoPlan(), getAllRules());
  const roomViolations = violations.filter((v) => v.ruleId.startsWith('vn-res-') || v.ruleId === 'vn-fire-corridor-min-width-general');
  // Ngủ 12.2m²/WC 3.6m²/Khách 36.7m²/hành lang 1100mm đều đạt → không violation. Riêng BẾP:
  // 5.7m² < 10m² là violation THẬT theo rule bếp+ăn gộp (demo tách ăn về phòng khách — message
  // rule đã ghi rõ caveat này). Trước đây dò biên null nên vi phạm này bị NUỐT — giờ phải thấy.
  ok('đúng 1 violation phòng: bếp+ăn (caveat bếp tách ăn)', roomViolations.length === 1 && roomViolations[0].ruleId === 'vn-res-kitchen-dining-min-area');
  ok('diện tích bếp trong message là số đo thật 5.7m²', !!roomViolations[0]?.message.includes('5.7'));

  // Hành lang demo-plan đo được 1100mm (XW-XP-PART = 1200-100): ĐẠT TCVN (≥1000mm) nhưng DƯỚI
  // ngưỡng IBC (1118mm) và Neufert 2 người (1400mm) — 2 rule mới nối phải bắt được điều này,
  // trong khi Neufert 1 người (750mm) vẫn đạt vì 1100mm > 750mm.
  ok('hành lang demo-plan 1100mm sinh violation intl-egress-corridor-min-width (< 1118mm)', violations.some((v) => v.ruleId === 'intl-egress-corridor-min-width'));
  ok('hành lang demo-plan 1100mm sinh violation neufert-circulation-two-persons (< 1400mm)', violations.some((v) => v.ruleId === 'neufert-circulation-two-persons'));
  ok('hành lang demo-plan 1100mm KHÔNG sinh violation neufert-circulation-one-person (> 750mm)', !violations.some((v) => v.ruleId === 'neufert-circulation-one-person'));
}

function testAccessDoorWcTooNarrow() {
  console.log('\n[9] D1.7 accessibility — cửa doorWC 700mm < 800mm ngưỡng cửa phòng chức năng (QCVN 10:2024) → violation');
  const doc: Doc = emptyDoc();
  doc.entities.push({ id: newId('e'), type: 'block', layer: 'l-wall', block: 'doorWC', at: { x: 1000, y: 0 }, rot: 0, sx: 1, sy: 1 });
  const violations = checkStandards(doc, getAllRules());
  const v = violations.find((v) => v.ruleId === 'vn-access-door-functional-room-min-width');
  ok('phát hiện cửa doorWC 700mm hẹp hơn 800mm', !!v);
  ok('message có số đo bề rộng thật 700', !!v?.message.includes('700'));
}

function testAccessDoorRoomMeetsThreshold() {
  console.log('\n[10] D1.7 accessibility — cửa doorRoom 800mm ĐẠT ngưỡng 800mm → không violation');
  const doc: Doc = emptyDoc();
  doc.entities.push({ id: newId('e'), type: 'block', layer: 'l-wall', block: 'doorRoom', at: { x: 1000, y: 0 }, rot: 0, sx: 1, sy: 1 });
  const violations = checkStandards(doc, getAllRules());
  ok('không có violation khi cửa doorRoom đạt đúng 800mm', !violations.some((v) => v.ruleId === 'vn-access-door-functional-room-min-width'));
}

function testAccessMainDoorTooNarrow() {
  console.log('\n[11] D1.7 accessibility — cửa chính scale xuống 700mm thật (900mm × sx=0.777...) < 900mm ngưỡng cửa chính → violation');
  const doc: Doc = emptyDoc();
  doc.entities.push({ id: newId('e'), type: 'block', layer: 'l-wall', block: 'door', at: { x: 1000, y: 0 }, rot: 0, sx: 800 / 900, sy: 1 });
  const violations = checkStandards(doc, getAllRules());
  const v = violations.find((v) => v.ruleId === 'vn-access-door-main-min-width');
  ok('phát hiện cửa chính bị scale hẹp hơn 900mm', !!v);
}

function testAccessMainDoorMeetsThreshold() {
  console.log('\n[12] D1.7 accessibility — cửa chính 900mm nguyên bản (sx=1) ĐẠT ngưỡng → không violation');
  const doc: Doc = emptyDoc();
  doc.entities.push({ id: newId('e'), type: 'block', layer: 'l-wall', block: 'door', at: { x: 1000, y: 0 }, rot: 0, sx: 1, sy: 1 });
  const violations = checkStandards(doc, getAllRules());
  ok('không có violation khi cửa chính đạt đúng 900mm', !violations.some((v) => v.ruleId === 'vn-access-door-main-min-width'));
}

function testAccessCorridorTwoWay() {
  console.log('\n[13] D1.7 accessibility — hành lang 1400mm < 1500mm ngưỡng 2 chiều xe lăn (QCVN 10:2024) → violation, nhưng ĐẠT TCVN (1000mm)');
  const doc: Doc = emptyDoc();
  doc.entities.push(...rectWalls(0, 0, 1400, 4000));
  doc.entities.push(label({ x: 700, y: 2000 }, 'HANH LANG'));
  const violations = checkStandards(doc, getAllRules());
  ok('vi phạm vn-access-corridor-two-way-min-width (1400mm < 1500mm)', violations.some((v) => v.ruleId === 'vn-access-corridor-two-way-min-width'));
  ok('KHÔNG vi phạm vn-fire-corridor-min-width-general (1400mm > 1000mm)', !violations.some((v) => v.ruleId === 'vn-fire-corridor-min-width-general'));
}

function testAccessCorridorTwoWayCompliant() {
  console.log('\n[14] D1.7 accessibility — hành lang 1500mm ĐẠT ngưỡng 2 chiều xe lăn → không violation');
  const doc: Doc = emptyDoc();
  doc.entities.push(...rectWalls(0, 0, 1500, 4000));
  doc.entities.push(label({ x: 750, y: 2000 }, 'HANH LANG'));
  const violations = checkStandards(doc, getAllRules());
  ok('không có violation khi hành lang đạt đúng 1500mm', !violations.some((v) => v.ruleId === 'vn-access-corridor-two-way-min-width'));
}

function testOccupantLoadLivingRoomInfo() {
  console.log('\n[15] Occupant load info — phòng khách demo-plan 36.7m² → ước tính ~1.97 người (IBC/NFPA Residential 18.58 m²/người)');
  const violations = checkStandards(buildDemoPlan(), getAllRules());
  const v = violations.find((v) => v.ruleId === 'intl-occupant-load-residential');
  ok('sinh violation info occupant-load cho phòng khách', !!v);
  ok('severity là info', v?.severity === 'info');
  // Diện tích hiển thị làm tròn "36.7m²" nhưng số đo hình học thật hơi khác 36.700 chẵn nên kết
  // quả chia thực tế ra 1.97 (không phải 1.98 nếu tính từ số làm tròn) — dùng đúng số checker in ra.
  ok('message chứa số ước tính đúng ~1.97 (tính từ diện tích đo thật, không phải số làm tròn hiển thị)', !!v?.message.includes('1.97'));
  ok('message chứa disclaimer không dùng thay occupant load chính thức', !!v?.message.includes('KHÔNG dùng thay occupant load calc chính thức'));
}

function testOccupantLoadCustomLivingRoom() {
  console.log('\n[16] Occupant load info — phòng khách nhỏ 6×3.1m=18.6m² → ước tính ~1.00 người');
  const doc: Doc = emptyDoc();
  doc.entities.push(...rectWalls(0, 0, 6000, 3100)); // 6.0 x 3.1m = 18.6m²
  doc.entities.push(label({ x: 3000, y: 1550 }, 'PHÒNG KHÁCH'));
  const violations = checkStandards(doc, getAllRules());
  const v = violations.find((v) => v.ruleId === 'intl-occupant-load-residential');
  ok('sinh violation info occupant-load', !!v);
  ok('message chứa số ước tính đúng ~1.00', !!v?.message.includes('1.00'));
}

function testOccupantLoadOfficeInfo() {
  console.log('\n[17] Occupant load info — "VĂN PHÒNG" 6.0×5.0m=30.0m² → ước tính dải ~2.15–3.23 người (IBC/NFPA Business-general, verified=false)');
  const doc: Doc = emptyDoc();
  doc.entities.push(...rectWalls(0, 0, 6000, 5000)); // 6.0 x 5.0m = 30.0m²
  doc.entities.push(label({ x: 3000, y: 2500 }, 'VĂN PHÒNG'));
  const violations = checkStandards(doc, getAllRules());
  const v = violations.find((v) => v.ruleId === 'intl-occupant-load-business-general');
  ok('sinh violation info occupant-load cho phòng "VĂN PHÒNG"', !!v);
  ok('severity là info', v?.severity === 'info');
  ok('verified=false (2 nguồn mâu thuẫn, KHÔNG chọn đại 1 số)', v?.verified === false);
  ok('message chứa cận dưới ước tính ~2.15', !!v?.message.includes('2.15'));
  ok('message chứa cận trên ước tính ~3.23', !!v?.message.includes('3.23'));
  ok('message nêu rõ số liệu chưa thống nhất giữa 2 nguồn IBC/NFPA', !!v?.message.includes('CHƯA THỐNG NHẤT giữa 2 nguồn IBC/NFPA'));
}

function testOccupantLoadAssemblyInfo() {
  console.log('\n[18] Occupant load info — "PHÒNG HỌP" 5.0×2.0m=10.0m² → ước tính ~7.19 người (IBC/NFPA Assembly – bàn & ghế, mặc định)');
  const doc: Doc = emptyDoc();
  doc.entities.push(...rectWalls(0, 0, 5000, 2000)); // 5.0 x 2.0m = 10.0m²
  doc.entities.push(label({ x: 2500, y: 1000 }, 'PHÒNG HỌP'));
  const violations = checkStandards(doc, getAllRules());
  const v = violations.find((v) => v.ruleId === 'intl-occupant-load-assembly-tables-chairs');
  ok('sinh violation info occupant-load cho phòng "PHÒNG HỌP"', !!v);
  ok('severity là info', v?.severity === 'info');
  ok('message chứa số ước tính đúng ~7.19', !!v?.message.includes('7.19'));
  ok('message chứa disclaimer không dùng thay occupant load chính thức', !!v?.message.includes('KHÔNG dùng thay occupant load calc chính thức'));
}

function outletBlock(at: { x: number; y: number }): import('../model').BlockEntity {
  return { id: newId('e'), type: 'block', layer: 'l-furniture', block: 'outlet', at, rot: 0, sx: 1, sy: 1 };
}

function testOutletDensityBedroomTooFew() {
  console.log('\n[19] D2.2 — phòng ngủ 4×3.5m KHÔNG có ổ cắm nào (0 < 2 khuyến nghị TCVN 9206:2012) → warning');
  const doc: Doc = emptyDoc();
  doc.entities.push(...rectWalls(0, 0, 4000, 3500));
  doc.entities.push(label({ x: 2000, y: 1750 }, 'PHÒNG NGỦ'));
  const violations = checkStandards(doc, getAllRules());
  const v = violations.find((v) => v.ruleId === 'vn-electrical-outlet-density-living-bedroom');
  ok('phát hiện thiếu ổ cắm phòng ngủ', !!v);
  ok('severity warning', v?.severity === 'warning');
  ok('message có số đếm 0', !!v?.message.includes('0 ổ cắm'));
}

function testOutletDensityBedroomEnough() {
  console.log('\n[20] D2.2 — phòng ngủ 4×3.5m có 2 ổ cắm bên trong → ĐẠT, không warning');
  const doc: Doc = emptyDoc();
  doc.entities.push(...rectWalls(0, 0, 4000, 3500));
  doc.entities.push(label({ x: 2000, y: 1750 }, 'PHÒNG NGỦ'));
  doc.entities.push(outletBlock({ x: 500, y: 500 }));
  doc.entities.push(outletBlock({ x: 3500, y: 3000 }));
  const violations = checkStandards(doc, getAllRules());
  ok('không có warning khi đủ 2 ổ cắm', !violations.some((v) => v.ruleId === 'vn-electrical-outlet-density-living-bedroom'));
}

function testOutletDensityKitchenTooFew() {
  console.log('\n[21] D2.2 — bếp 4×3m có 1 ổ cắm (1 < 2 khuyến nghị) → warning, rule bếp riêng');
  const doc: Doc = emptyDoc();
  doc.entities.push(...rectWalls(0, 0, 4000, 3000));
  doc.entities.push(label({ x: 2000, y: 1500 }, 'BẾP'));
  doc.entities.push(outletBlock({ x: 500, y: 500 }));
  const violations = checkStandards(doc, getAllRules());
  const v = violations.find((v) => v.ruleId === 'vn-electrical-outlet-density-kitchen');
  ok('phát hiện thiếu ổ cắm bếp', !!v);
  ok('message có số đếm 1', !!v?.message.includes('1 ổ cắm'));
}

function testOutletDensityOutsideRoomNotCounted() {
  console.log('\n[22] D2.2 — ổ cắm đặt NGOÀI biên phòng ngủ không được tính vào phòng đó');
  const doc: Doc = emptyDoc();
  doc.entities.push(...rectWalls(0, 0, 4000, 3500));
  doc.entities.push(label({ x: 2000, y: 1750 }, 'PHÒNG NGỦ'));
  doc.entities.push(outletBlock({ x: 500, y: 500 }));
  doc.entities.push(outletBlock({ x: 6000, y: 6000 })); // xa hẳn ngoài phòng — không được đếm
  const violations = checkStandards(doc, getAllRules());
  const v = violations.find((v) => v.ruleId === 'vn-electrical-outlet-density-living-bedroom');
  ok('vẫn cảnh báo thiếu (chỉ đếm được 1 ổ cắm trong biên, ổ cắm ngoài phòng không tính)', !!v && v.message.includes('1 ổ cắm'));
}

testUndersizedBedroom();
testOkBedroom();
testWcUndersized();
testCorridorNarrow();
testCorridorIntlEgressAndNeufertTwo();
testCorridorNeufertTwoOnly();
testCorridorAllFourViolated();
testCorridorFullyCompliant();
testNoRoomNoViolation();
testRegistryIntegrity();
testTJunctionRoomMeasured();
testDemoPlanMeasuresAllRooms();
testAccessDoorWcTooNarrow();
testAccessDoorRoomMeetsThreshold();
testAccessMainDoorTooNarrow();
testAccessMainDoorMeetsThreshold();
testAccessCorridorTwoWay();
testAccessCorridorTwoWayCompliant();
testOccupantLoadLivingRoomInfo();
testOccupantLoadCustomLivingRoom();
testOccupantLoadOfficeInfo();
testOccupantLoadAssemblyInfo();
testOutletDensityBedroomTooFew();
testOutletDensityBedroomEnough();
testOutletDensityKitchenTooFew();
testOutletDensityOutsideRoomNotCounted();

console.log(`\n${pass} ok, ${fail} fail`);
if (fail > 0) process.exit(1);
