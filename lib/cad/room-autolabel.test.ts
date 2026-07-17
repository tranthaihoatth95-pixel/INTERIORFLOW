/**
 * lib/cad/room-autolabel.test.ts — kiểm suggestRoomNames() (Sprint 4, VIỆC 2 — auto-label
 * phòng CHƯA có nhãn TEXT). Chạy bằng:
 *   node_modules/.bin/sucrase-node lib/cad/room-autolabel.test.ts
 * (cùng pattern hatch.test.ts/modify.test.ts — không Jest/Vitest, không phải file production).
 */
import { suggestRoomNames } from './room-autolabel';
import { emptyDoc } from './model';
import type { Doc, LineEntity, BlockEntity, TextEntity } from './model';
import { newId } from './store';
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

function rectWalls(x0: number, y0: number, x1: number, y1: number, layer: string): LineEntity[] {
  const p = [{ x: x0, y: y0 }, { x: x1, y: y0 }, { x: x1, y: y1 }, { x: x0, y: y1 }];
  return [
    { id: newId('e'), type: 'line', layer, a: p[0], b: p[1] },
    { id: newId('e'), type: 'line', layer, a: p[1], b: p[2] },
    { id: newId('e'), type: 'line', layer, a: p[2], b: p[3] },
    { id: newId('e'), type: 'line', layer, a: p[3], b: p[0] },
  ];
}
function block(at: { x: number; y: number }, blockId: string, layer: string): BlockEntity {
  return { id: newId('e'), type: 'block', layer, block: blockId, at, rot: 0, sx: 1, sy: 1 };
}
function text(at: { x: number; y: number }, s: string, layer: string): TextEntity {
  return { id: newId('e'), type: 'text', layer, at, text: s, h: 200 };
}

function buildDoc(): Doc {
  const doc = emptyDoc();
  const wallLayer = doc.layers.find((l) => l.id === 'l-wall')?.id ?? doc.layers[0].id;
  const textLayer = doc.layers.find((l) => l.id === 'l-text')?.id ?? doc.layers[0].id;

  // Room A: 4000x3000 (12 m²) — 1 giường đôi bên trong, KHÔNG có nhãn TEXT.
  const roomA = rectWalls(0, 0, 4000, 3000, wallLayer);
  const bedA = block({ x: 2000, y: 1500 }, 'bedD', wallLayer);

  // Room B: 4000x3000, cách xa room A, ĐÃ có nhãn TEXT "PHÒNG KHÁCH" + 1 sofa bên trong
  // → phải bị LOẠI khỏi đề xuất vì đã có tên.
  const roomB = rectWalls(10000, 0, 14000, 3000, wallLayer);
  const sofaB = block({ x: 12000, y: 1500 }, 'sofa2', wallLayer);
  const labelB = text({ x: 12000, y: 1500 }, 'PHÒNG KHÁCH', textLayer);

  // Room C: dài & hẹp (aspect ≥ 3), KHÔNG có đồ nội thất đặc trưng phòng — chỉ có 1 block
  // 'ceilingFan' (nhóm 'Thiết bị', KHÔNG dùng để phân loại, và KHÁC nhóm 'Kiến trúc' nên vẫn
  // được dùng làm pick-point — xem room-autolabel.ts vì sao cửa/cửa sổ bị loại khỏi pick-point)
  // → phải rơi vào nhánh fallback "shape" (đoán theo hình dạng) = Hành lang.
  const roomC = rectWalls(0, 10000, 6000, 11200, wallLayer); // 6000x1200 → aspect 5
  const fanC = block({ x: 3000, y: 10600 }, 'ceilingFan', wallLayer);

  // Room D: nhỏ (< 5 m²), cũng chỉ có 1 'ceilingFan' làm pick-point → fallback "shape" = WC/Kho.
  const roomD = rectWalls(20000, 0, 22000, 2000, wallLayer); // 2000x2000 = 4 m²
  const fanD = block({ x: 21000, y: 1000 }, 'ceilingFan', wallLayer);

  // Room E: 1 giường đơn + 1 sofa (số lượng bằng nhau, 1-1) → tie-break ưu tiên "Phòng ngủ".
  const roomE = rectWalls(30000, 0, 34000, 3000, wallLayer);
  const bedE = block({ x: 31000, y: 1500 }, 'bedS', wallLayer);
  const sofaE = block({ x: 33000, y: 1500 }, 'sofa2', wallLayer);

  // Room F: CHỈ có 1 block 'door' (nhóm 'Kiến trúc') bên trong, không đồ nội thất khác — verify
  // UI thật (Sprint 4) phát hiện cửa/cửa sổ làm pick-point sinh đề xuất giả (rơi vào khe tường
  // quanh ô mở cửa) → phải KHÔNG xuất hiện trong kết quả (cửa bị loại khỏi pick-point).
  const roomF = rectWalls(40000, 0, 44000, 3000, wallLayer);
  const doorF = block({ x: 42000, y: 1500 }, 'door', wallLayer);

  doc.entities = [
    ...roomA, bedA,
    ...roomB, sofaB, labelB,
    ...roomC, fanC,
    ...roomD, fanD,
    ...roomE, bedE, sofaE,
    ...roomF, doorF,
  ];
  return doc;
}

function testSuggestRoomNames() {
  console.log('\n[Sprint4] suggestRoomNames — auto-label phòng chưa có nhãn TEXT');
  const doc = buildDoc();
  const suggestions = suggestRoomNames(doc);

  ok('không đề xuất trùng số phòng đã có sẵn nhãn (roomB bị loại) + roomF (chỉ có cửa) không dò được → tổng 4 đề xuất (A/C/D/E)', suggestions.length === 4);

  const byArea = (m2: number) => suggestions.find((s) => approx(s.areaM2, m2, 0.3));

  // Regex y hệt checker.ROOM_NAME_RE — mọi suggestedName PHẢI khớp (nếu không, TEXT chèn vào sẽ
  // không được findRoomLabels/GFA/room-count nhận diện dù nhìn giống 1 nhãn phòng).
  const ROOM_NAME_RE = /^[\p{Lu}0-9\s.+]+$/u;
  ok('MỌI suggestedName đều khớp quy ước nhãn phòng (chữ hoa, không dấu "/"/ngoặc)', suggestions.every((s) => ROOM_NAME_RE.test(s.suggestedName)));

  const a = byArea(12);
  ok('Room A (12m², có giường đôi) → đề xuất "PHÒNG NGỦ"', !!a && a.suggestedName === 'PHÒNG NGỦ');
  ok('Room A → basis = furniture', a?.basis === 'furniture');
  ok('Room A → có evidenceBlockIds (id block giường)', (a?.evidenceBlockIds.length ?? 0) === 1);
  ok('Room A → note nêu rõ số đồ nội thất', a?.note === 'theo 1 đồ nội thất');

  const c = byArea(7.2);
  ok('Room C (6000×1200, không đồ nội thất đặc trưng) → fallback "shape"', !!c && c.basis === 'shape');
  ok('Room C dài hẹp → đề xuất "HÀNH LANG"', !!c && c.suggestedName === 'HÀNH LANG');

  const d = byArea(4);
  ok('Room D (4m², không đồ nội thất đặc trưng) → fallback "shape"', !!d && d.basis === 'shape');
  ok('Room D nhỏ → đề xuất "WC"', !!d && d.suggestedName === 'WC');

  const e = byArea(12);
  // Room A và Room E đều 12m² — lọc theo suggestedName để phân biệt.
  const eSug = suggestions.find((s) => approx(s.areaM2, 12, 0.3) && s.suggestedName === 'PHÒNG NGỦ' && s.evidenceBlockIds.length === 1 && s !== a);
  ok('Room E (1 giường + 1 sofa, hoà số lượng) → tie-break ưu tiên "PHÒNG NGỦ"', !!eSug);

  ok('Room F (chỉ có 1 block "door", nhóm Kiến trúc) → KHÔNG có đề xuất nào gần đó (cửa bị loại khỏi pick-point)', !suggestions.some((s) => Math.abs(s.at.x - 42000) < 2000 && Math.abs(s.at.y - 1500) < 2000));

  // Không đột biến — gọi lại nhiều lần cho kết quả ổn định (tất định).
  const again = suggestRoomNames(doc);
  ok('gọi lại suggestRoomNames() cho cùng doc → cùng số lượng đề xuất (tất định)', again.length === suggestions.length);

  // TÍCH HỢP THẬT: mô phỏng đúng luồng UI — user bấm "Áp dụng" cho Room A → addEntity() 1 TEXT
  // mới đúng suggestedName. Sau đó checker.findRoomLabels()/classifyRoom() (dùng cho GFA + room
  // count + checkStandards) PHẢI nhận diện được phòng này y hệt 1 nhãn phòng user tự gõ tay —
  // đây là lý do suggestedName phải "sạch" (không lẫn ghi chú/basis vào text chèn).
  const docAfterApply: Doc = {
    ...doc,
    entities: [
      ...doc.entities,
      { id: newId('e'), type: 'text', layer: 'l-text', at: a!.at, text: a!.suggestedName, h: 200 } as TextEntity,
    ],
  };
  const roomsAfter = findRoomLabels(docAfterApply);
  const appliedRoom = roomsAfter.find((r) => r.name === 'PHÒNG NGỦ' && approx(r.areaM2 ?? -1, 12, 0.3));
  ok('Sau khi áp dụng: findRoomLabels() nhận diện đúng "PHÒNG NGỦ" vừa chèn (diện tích khớp)', !!appliedRoom);
  ok('Sau khi áp dụng: classifyRoom("PHÒNG NGỦ") = kind "bedroom" (dùng để đếm room-count)', classifyRoom('PHÒNG NGỦ') === 'bedroom');
  ok('classifyRoom("WC") = kind "wc"', classifyRoom('WC') === 'wc');
  ok('classifyRoom("HÀNH LANG") = kind "corridor"', classifyRoom('HÀNH LANG') === 'corridor');
}

testSuggestRoomNames();

console.log(`\n${pass} ok, ${fail} fail`);
if (fail > 0) process.exit(1);
