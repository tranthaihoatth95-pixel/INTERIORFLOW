/**
 * lib/cad/templates.test.ts — Sprint 8, VIỆC 2: kiểm 2 template mới (office/hotel) có tường
 * khép kín + room label hợp lệ. Chạy:
 *   node_modules/.bin/sucrase-node lib/cad/templates.test.ts
 *
 * Pattern giống hatch.test.ts [8] (demo-plan thật): lọc dim/text/layer trục khỏi hình học (y hệt
 * wallLikeDoc của standards/checker.ts) rồi findHatchBoundary tại pick-point trong mỗi phòng.
 */
import { findHatchBoundary, polygonArea } from './hatch';
import type { Doc } from './model';
import { buildOfficeTemplate, buildHotelTemplate } from './templates';
import { classifyRoom, findRoomLabels } from './standards/checker';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}
function approx(a: number, b: number, eps = 1): boolean {
  return Math.abs(a - b) <= eps;
}

function wallLikeDoc(full: Doc): Doc {
  const axisLayerIds = new Set(full.layers.filter((l) => l.name === 'Trục' || l.id === 'l-axis').map((l) => l.id));
  return {
    layers: full.layers,
    entities: full.entities.filter((e) => e.type !== 'dim' && e.type !== 'text' && !axisLayerIds.has(e.layer)),
  };
}

/* ═══════════════════════════ Văn phòng ═══════════════════════════ */

function testOfficeTemplate() {
  console.log('\n[1] buildOfficeTemplate — tường khép kín + 3 phòng dò được biên');
  const full = buildOfficeTemplate();
  const doc = wallLikeDoc(full);

  const cases: { name: string; pick: { x: number; y: number }; m2: number }[] = [
    { name: 'VĂN PHÒNG (open office)', pick: { x: 1800, y: 5600 }, m2: ((7000 - 210 / 2 - 100 / 2) * (6000 - 210)) / 1e6 },
    { name: 'PHÒNG HỌP 1', pick: { x: 7300, y: 1600 }, m2: ((10000 - 7000 - 100 / 2 - 210 / 2) * (3000 - 100 / 2 - 210 / 2)) / 1e6 },
    { name: 'PHÒNG HỌP 2', pick: { x: 7300, y: 4600 }, m2: ((10000 - 7000 - 100 / 2 - 210 / 2) * (6000 - 3000 - 100 / 2 - 210 / 2)) / 1e6 },
  ];
  for (const c of cases) {
    const poly = findHatchBoundary(doc, c.pick);
    ok(`${c.name}: dò được vòng kín`, !!poly);
    if (poly) {
      const m2 = polygonArea(poly) / 1e6;
      ok(`${c.name}: diện tích ≈ ${c.m2.toFixed(1)} m² (đo được ${m2.toFixed(2)})`, approx(m2, c.m2, 0.15));
    }
  }

  // room label + classifyRoom hoạt động đúng qua findRoomLabels (đường vào thật của checker.ts/
  // room-autolabel.ts/mep-suggest.ts) — không chỉ TEXT hiển thị suông.
  const rooms = findRoomLabels(full);
  const office = rooms.find((r) => r.name === 'VĂN PHÒNG');
  const meeting1 = rooms.find((r) => r.name === 'PHÒNG HỌP 1');
  const meeting2 = rooms.find((r) => r.name === 'PHÒNG HỌP 2');
  ok('findRoomLabels dò được "VĂN PHÒNG"', !!office && office.areaM2 !== null);
  ok('findRoomLabels dò được "PHÒNG HỌP 1"', !!meeting1 && meeting1.areaM2 !== null);
  ok('findRoomLabels dò được "PHÒNG HỌP 2"', !!meeting2 && meeting2.areaM2 !== null);
  ok('classifyRoom("VĂN PHÒNG") = office', classifyRoom('VĂN PHÒNG') === 'office');
  ok('classifyRoom("PHÒNG HỌP 1") = assembly', classifyRoom('PHÒNG HỌP 1') === 'assembly');

  // có ít nhất 1 cửa chính + 2 cửa nội bộ (block 'door'/'doorRoom')
  const doors = full.entities.filter((e) => e.type === 'block' && (e.block === 'door' || e.block === 'doorRoom'));
  ok('có ít nhất 3 block cửa (1 chính + 2 phòng họp)', doors.length >= 3);
}

/* ═══════════════════════════ Khách sạn ═══════════════════════════ */

function testHotelTemplate() {
  console.log('\n[2] buildHotelTemplate — tường khép kín + hành lang + 2 phòng ngủ dò được biên');
  const full = buildHotelTemplate();
  const doc = wallLikeDoc(full);

  const corridorH = 1400 - 210 / 2 - 100 / 2;
  const room1W = 4000 - 100 / 2 - 210 / 2;
  const room2W = 8000 - 4000 - 100 / 2 - 210 / 2;
  const roomH = 5200 - 1400 - 100 / 2 - 210 / 2;

  const cases: { name: string; pick: { x: number; y: number }; m2: number }[] = [
    { name: 'HÀNH LANG', pick: { x: 4000, y: 700 }, m2: ((8000 - 210) * corridorH) / 1e6 },
    { name: 'PHÒNG NGỦ 1', pick: { x: 2000, y: 3300 }, m2: (room1W * roomH) / 1e6 },
    { name: 'PHÒNG NGỦ 2', pick: { x: 6000, y: 3300 }, m2: (room2W * roomH) / 1e6 },
  ];
  for (const c of cases) {
    const poly = findHatchBoundary(doc, c.pick);
    ok(`${c.name}: dò được vòng kín`, !!poly);
    if (poly) {
      const m2 = polygonArea(poly) / 1e6;
      ok(`${c.name}: diện tích ≈ ${c.m2.toFixed(1)} m² (đo được ${m2.toFixed(2)})`, approx(m2, c.m2, 0.15));
    }
  }

  const rooms = findRoomLabels(full);
  const corridor = rooms.find((r) => r.name === 'HÀNH LANG');
  const room1 = rooms.find((r) => r.name === 'PHÒNG NGỦ 1');
  const room2 = rooms.find((r) => r.name === 'PHÒNG NGỦ 2');
  ok('findRoomLabels dò được "HÀNH LANG"', !!corridor && corridor.areaM2 !== null && corridor.minWidthMm !== null);
  ok('findRoomLabels dò được "PHÒNG NGỦ 1"', !!room1 && room1.areaM2 !== null);
  ok('findRoomLabels dò được "PHÒNG NGỦ 2"', !!room2 && room2.areaM2 !== null);
  ok('classifyRoom("HÀNH LANG") = corridor', classifyRoom('HÀNH LANG') === 'corridor');
  ok('classifyRoom("PHÒNG NGỦ 1") = bedroom', classifyRoom('PHÒNG NGỦ 1') === 'bedroom');
  ok('2 phòng ngủ đều ≥9m² (đạt TCVN 4451 tối thiểu, xem docstring)', !!room1 && room1.areaM2! >= 9 && !!room2 && room2.areaM2! >= 9);

  const doors = full.entities.filter((e) => e.type === 'block' && (e.block === 'door' || e.block === 'doorRoom'));
  ok('có ít nhất 3 block cửa (1 chính + 2 phòng)', doors.length >= 3);
}

testOfficeTemplate();
testHotelTemplate();

console.log(`\n${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
