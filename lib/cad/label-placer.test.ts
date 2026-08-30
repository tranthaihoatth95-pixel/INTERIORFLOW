/**
 * lib/cad/label-placer.test.ts — VIỆC 3 `label-ne-hinh` (docs/CHUAN-DAU-RA-NGHE.md §1):
 * nhãn không đè hình học/không đè nhau; thứ tự ưu tiên giữ chỗ → dịch → leader.
 *
 * Chạy: node_modules/.bin/sucrase-node lib/cad/label-placer.test.ts
 */
import assert from 'node:assert';
import type { Box, Doc, Entity, TextEntity, DimEntity, BlockEntity, Layer } from './model';
import { emptyDoc } from './model';
import { newId } from './id';
import {
  avoidLabelCollision,
  boxesOverlap,
  countUnresolvedLabelCollisions,
  dimOutsideRoom,
  labelInRoomBounds,
  planExportLabelShifts,
  stripInternalJargon,
} from './label-placer';

let pass = 0;
function test(name: string, fn: () => void) {
  fn();
  pass++;
  console.log(`  ✓ ${name}`);
}

const box = (minX: number, minY: number, maxX: number, maxY: number): Box => ({ minX, minY, maxX, maxY });

/* ───────────── avoidLabelCollision — 6 ca thuần hình học ───────────── */

test('① không đè gì → GIỮ NGUYÊN chỗ (moved=false, box y hệt)', () => {
  const labels = [{ id: 'a', box: box(0, 0, 1000, 200) }];
  const out = avoidLabelCollision(labels, [box(5000, 5000, 6000, 6000)]);
  assert.strictEqual(out.length, 1);
  assert.strictEqual(out[0].moved, false);
  assert.deepStrictEqual(out[0].box, labels[0].box);
});

test('② hai nhãn đè nhau → nhãn SAU dịch, sau khi né không còn giao', () => {
  const out = avoidLabelCollision(
    [
      { id: 'a', box: box(0, 0, 1000, 200) },
      { id: 'b', box: box(100, 50, 1100, 250) },
    ],
    [],
  );
  assert.strictEqual(out[0].moved, false, 'nhãn đứng trước giữ chỗ');
  assert.strictEqual(out[1].moved, true, 'nhãn sau phải dịch');
  assert.ok(!boxesOverlap(out[0].box, out[1].box), 'sau né không còn đè nhau');
});

test('③ nhãn đè hình học (block giường) → dịch ra chỗ trống', () => {
  const giuong = box(-500, -500, 1500, 700); // trùm lên nhãn
  const out = avoidLabelCollision([{ id: 'a', box: box(0, 0, 1000, 200) }], [giuong]);
  assert.strictEqual(out[0].moved, true);
  assert.ok(!boxesOverlap(out[0].box, giuong), 'không còn gạch qua hình');
});

test('④ bounds chật kín + allowLeader → kéo LEADER ra ngoài, trỏ về điểm gốc', () => {
  const bounds = box(-100, -100, 1100, 300); // phòng chỉ vừa đúng nhãn, không còn chỗ dịch
  const obstacle = box(-100, -100, 1100, 300); // hình chiếm trọn phòng
  const out = avoidLabelCollision([{ id: 'a', box: box(0, 0, 1000, 200), bounds, allowLeader: true }], [obstacle]);
  assert.strictEqual(out[0].moved, true);
  assert.ok(out[0].leader, 'phải có leader');
  // leader trỏ về ĐÚNG tâm nhãn gốc (điểm nó chú thích).
  assert.deepStrictEqual(out[0].leader!.to, { x: 500, y: 100 });
  assert.ok(!boxesOverlap(out[0].box, obstacle), 'nhãn leader đứng ngoài hình');
});

test('⑤ allowLeader=false + hết chỗ → GIỮ vị trí gốc (không âm thầm chồng lên nhãn khác)', () => {
  const a = { id: 'a', box: box(0, 0, 1000, 200) };
  // b bị kẹp: mọi hướng dịch trong 1 vòng đều đụng chướng ngại to.
  const b = { id: 'b', box: box(0, 0, 1000, 200), maxRings: 0, allowLeader: false };
  const out = avoidLabelCollision([a, b], []);
  assert.strictEqual(out[1].moved, false);
  assert.deepStrictEqual(out[1].box, b.box);
});

test('⑥ thuần + deterministic: không mutate input, 2 lần chạy ra y hệt', () => {
  const labels = [
    { id: 'a', box: box(0, 0, 1000, 200) },
    { id: 'b', box: box(200, 0, 1200, 200) },
  ];
  const snapshot = JSON.stringify(labels);
  const r1 = avoidLabelCollision(labels, []);
  const r2 = avoidLabelCollision(labels, []);
  assert.strictEqual(JSON.stringify(labels), snapshot, 'input không đổi');
  assert.deepStrictEqual(r1, r2, 'deterministic');
});

/* ───────────── planExportLabelShifts — trích từ Doc thật ───────────── */

const layer = (id: string): Layer => ({ id, name: id, color: '#000', visible: true, locked: false });

function docCoNhanDeGiuong(): Doc {
  const d = emptyDoc();
  const lay = d.layers[0].id;
  // Nhãn phòng "PHÒNG NGỦ" (classifyRoom → bedroom) đặt NGAY TRÊN block giường — ca lỗi 11/08.
  const label: TextEntity = { id: 'lbl', type: 'text', layer: lay, at: { x: 0, y: 0 }, text: 'PHÒNG NGỦ', h: 200 };
  const bed: BlockEntity = { id: 'bed', type: 'block', layer: lay, block: 'bed-double', at: { x: 500, y: 100 }, rot: 0, sx: 1, sy: 1 } as BlockEntity;
  d.entities.push(label, bed);
  return d;
}

test('nhãn phòng đè block → planExportLabelShifts trả độ dời cho đúng entity đó', () => {
  const d = docCoNhanDeGiuong();
  const shifts = planExportLabelShifts({ entities: d.entities, layers: d.layers }, { textHeight: 120, dimScale: 1 });
  const s = shifts.get('lbl');
  assert.ok(s, 'nhãn phòng phải có kế hoạch dời');
  assert.ok(Math.abs(s!.dx) + Math.abs(s!.dy) > 0);
  assert.ok(!shifts.has('bed'), 'hình học không bao giờ bị dời');
});

test('chữ khung tên viết hoa ("DỰ ÁN") KHÔNG bị coi là nhãn phòng', () => {
  const d = emptyDoc();
  const lay = d.layers[0].id;
  const tb: TextEntity = { id: 't1', type: 'text', layer: lay, at: { x: 0, y: 0 }, text: 'DỰ ÁN', h: 300 };
  const bed: BlockEntity = { id: 'bed', type: 'block', layer: lay, block: 'bed-double', at: { x: 0, y: 0 }, rot: 0, sx: 1, sy: 1 } as BlockEntity;
  d.entities.push(tb, bed);
  const shifts = planExportLabelShifts({ entities: d.entities, layers: d.layers }, { textHeight: 120, dimScale: 1 });
  assert.ok(!shifts.has('t1'), 'không dời chữ khung tên');
});

test('hai chuỗi dim chồng nhau → một chuỗi được dời, dim không nhận leader', () => {
  const d = emptyDoc();
  const lay = d.layers[0].id;
  const d1: DimEntity = { id: 'd1', type: 'dim', layer: lay, a: { x: 0, y: 0 }, b: { x: 1850, y: 0 }, off: 400 };
  const d2: DimEntity = { id: 'd2', type: 'dim', layer: lay, a: { x: 0, y: 50 }, b: { x: 1850, y: 50 }, off: 350 };
  d.entities.push(d1, d2);
  const shifts = planExportLabelShifts({ entities: d.entities, layers: d.layers }, { textHeight: 120, dimScale: 1 });
  assert.strictEqual(shifts.size, 1, 'đúng 1 chuỗi phải dời');
  const s = [...shifts.values()][0];
  assert.strictEqual(s.leader, undefined, 'chuỗi dim không dùng leader');
});

test('layer ẨN bị bỏ qua (khớp hành vi xuất PDF: layer ẩn không vẽ)', () => {
  const d = docCoNhanDeGiuong();
  d.layers = d.layers.map((l): Layer => ({ ...l, visible: false }));
  const shifts = planExportLabelShifts({ entities: d.entities, layers: d.layers }, { textHeight: 120, dimScale: 1 });
  assert.strictEqual(shifts.size, 0);
});

test('countUnresolvedLabelCollisions: doc sạch = 0 · doc nhãn đè máy né được cũng = 0', () => {
  assert.strictEqual(countUnresolvedLabelCollisions({ entities: [], layers: [layer('l1')] }, { textHeight: 120, dimScale: 1 }), 0);
  const d = docCoNhanDeGiuong();
  // máy né được (quanh giường còn chỗ trống) → sau né không còn ca nào "chịu thua".
  assert.strictEqual(countUnresolvedLabelCollisions({ entities: d.entities, layers: d.layers }, { textHeight: 120, dimScale: 1 }), 0);
});

/* ───────────── v2: labelInRoomBounds — ràng biên phòng ───────────── */

// 4 tường quanh phòng (2000..5000)×(1000..4000), bề dày 100 — bbox poché như wallSegment sinh.
const WALLS_1ROOM: Box[] = [
  box(1900, 900, 5100, 1000), // Nam
  box(1900, 4000, 5100, 4100), // Bắc
  box(1900, 900, 2000, 4100), // Tây
  box(5000, 900, 5100, 4100), // Đông
];
const ENV_1ROOM = box(1900, 900, 5100, 4100);

test('v2 labelInRoomBounds: ray-cast 4 hướng vào tường → bbox phòng (có pad, nằm trong 4 mặt tường)', () => {
  const b = labelInRoomBounds({ x: 3500, y: 2500 }, WALLS_1ROOM, ENV_1ROOM, []);
  assert.ok(b, 'phải suy được biên phòng');
  assert.ok(b!.minX >= 2000 && b!.maxX <= 5000 && b!.minY >= 1000 && b!.maxY <= 4000, 'biên nằm giữa các mặt tường trong');
});

test('v2 labelInRoomBounds: anchor NGOÀI tường bao → null (không ràng bừa)', () => {
  assert.strictEqual(labelInRoomBounds({ x: 9000, y: 9000 }, WALLS_1ROOM, ENV_1ROOM, []), null);
});

test('v2 labelInRoomBounds: RoomEntity.boundary chứa anchor thắng ray-cast', () => {
  const poly = [{ x: 0, y: 0 }, { x: 1000, y: 0 }, { x: 1000, y: 800 }, { x: 0, y: 800 }];
  const b = labelInRoomBounds({ x: 500, y: 400 }, WALLS_1ROOM, ENV_1ROOM, [poly]);
  assert.ok(b && b.maxX <= 1000 && b.maxY <= 800, 'bbox lấy từ boundary phòng');
});

/* ───────────── v2: dimOutsideRoom — dời cụm dim ra ngoài nhà ───────────── */

const dimV = (id: string, x: number, y1: number, y2: number, off: number): DimEntity =>
  ({ id, type: 'dim', layer: 'l1', a: { x, y: y1 }, b: { x, y: y2 }, off });

test('v2 dimOutsideRoom: chuỗi dọc TRONG nhà → dời cả chuỗi ra ngoài mép gần nhất, cùng 1 dx', () => {
  const env = box(0, 0, 9000, 7200);
  // 2 dim cùng chuỗi (cùng đường dim x = 9000-900 = 8100, vì a→b đi +y nên n=(-1,0))
  const dims = [dimV('d1', 9000, 0, 1800, 900), dimV('d2', 9000, 1800, 3500, 900)];
  const r = dimOutsideRoom(dims, env, { stepWorld: 800 });
  assert.strictEqual(r.skipped, 0);
  const s1 = r.shifts.get('d1')!;
  const s2 = r.shifts.get('d2')!;
  assert.ok(s1 && s2, 'cả chuỗi phải dời');
  assert.deepStrictEqual(s1, s2, 'cả chuỗi dời CHUNG một độ dời');
  assert.strictEqual(s1.dy, 0, 'chuỗi dọc chỉ dời ngang');
  assert.strictEqual(8100 + s1.dx, 9800, 'đường dim mới = mép Đông 9000 + 1 bậc 800');
});

test('v2 dimOutsideRoom: 2 chuỗi cùng phía xếp bậc thang, giữ thứ tự chi tiết→tổng', () => {
  const env = box(0, 0, 9000, 7200);
  const dims = [dimV('tong', 9000, 0, 7200, 900), dimV('chitiet', 9000, 0, 7200, 450)];
  const r = dimOutsideRoom(dims, env, { stepWorld: 800 });
  const lineTong = 8100 + r.shifts.get('tong')!.dx;
  const lineChiTiet = 8550 + r.shifts.get('chitiet')!.dx;
  assert.strictEqual(lineChiTiet, 9800, 'chuỗi chi tiết (gần tường hơn) vào lớp trong cùng');
  assert.strictEqual(lineTong, 10600, 'chuỗi tổng ra lớp ngoài');
});

test('v2 dimOutsideRoom: dim NGOÀI nhà giữ nguyên · dim XIÊN trong nhà → skipped, không dời bừa', () => {
  const env = box(0, 0, 9000, 7200);
  const ngoai = dimV('ngoai', 0, 0, 7200, 500); // n=(-1,0), line x=-500 → ngoài
  const xien: DimEntity = { id: 'xien', type: 'dim', layer: 'l1', a: { x: 1000, y: 1000 }, b: { x: 3000, y: 2500 }, off: 200 };
  const r = dimOutsideRoom([ngoai, xien], env, { stepWorld: 800 });
  assert.ok(!r.shifts.has('ngoai'), 'dim người vẽ đặt ngoài nhà không đụng');
  assert.ok(!r.shifts.has('xien'), 'dim xiên không dời');
  assert.strictEqual(r.skipped, 1, 'dim xiên trong nhà đếm vào gate warn');
});

test('v2 dimOutsideRoom: hết chỗ trên giấy (pageWorldBox) → giữ nguyên + skipped', () => {
  const env = box(0, 0, 9000, 7200);
  const dims = [dimV('d1', 9000, 0, 7200, 900)];
  const r = dimOutsideRoom(dims, env, { stepWorld: 800, pageWorldBox: box(-500, -500, 9500, 7700) });
  assert.strictEqual(r.shifts.size, 0, '9800 vượt mép giấy 9500 → không dời');
  assert.strictEqual(r.skipped, 1);
});

/* ───────────── v2: planExportLabelShifts — cặp tên + m², wholeDim ───────────── */

function docPhongCoTuong(): Doc {
  const d = emptyDoc();
  const lay = d.layers[0].id;
  const wallHatch = (b: Box): Entity => ({
    id: newId('e'), type: 'hatch', layer: lay, solid: true, hostId: 'x',
    points: [{ x: b.minX, y: b.minY }, { x: b.maxX, y: b.minY }, { x: b.maxX, y: b.maxY }, { x: b.minX, y: b.maxY }],
  } as Entity);
  for (const b of WALLS_1ROOM) d.entities.push(wallHatch(b));
  return d;
}

test('v2: nhãn phòng + dòng m² dời CHUNG một độ dời (cặp), leader chỉ gắn nhãn tên', () => {
  const d = docPhongCoTuong();
  const lay = d.layers[0].id;
  const name: TextEntity = { id: 'ten', type: 'text', layer: lay, at: { x: 2500, y: 2500 }, text: 'PHÒNG NGỦ', h: 200 };
  const area: TextEntity = { id: 'dt', type: 'text', layer: lay, at: { x: 2500, y: 2250 }, text: '12.2 m²', h: 150 };
  // block đè đúng chỗ cặp nhãn → phải dời
  const bed: BlockEntity = { id: 'bed', type: 'block', layer: lay, block: 'khong-co-trong-map', at: { x: 3100, y: 2500 }, rot: 0, sx: 1, sy: 1 } as BlockEntity;
  d.entities.push(name, area, bed);
  const shifts = planExportLabelShifts({ entities: d.entities, layers: d.layers }, { textHeight: 120, dimScale: 1 });
  const sN = shifts.get('ten');
  const sA = shifts.get('dt');
  assert.ok(sN && sA, 'cả tên lẫn dòng m² phải có kế hoạch dời');
  assert.strictEqual(sN!.dx, sA!.dx);
  assert.strictEqual(sN!.dy, sA!.dy);
  assert.ok(!sA!.leader, 'leader (nếu có) không gắn vào dòng m²');
});

test('v2: nhãn dời KHÔNG trôi ra ngoài phòng (ràng labelInRoomBounds)', () => {
  const d = docPhongCoTuong();
  const lay = d.layers[0].id;
  const name: TextEntity = { id: 'ten', type: 'text', layer: lay, at: { x: 2500, y: 2500 }, text: 'PHÒNG NGỦ', h: 200 };
  const bed: BlockEntity = { id: 'bed', type: 'block', layer: lay, block: 'khong-co', at: { x: 3100, y: 2500 }, rot: 0, sx: 1, sy: 1 } as BlockEntity;
  d.entities.push(name, bed);
  const shifts = planExportLabelShifts({ entities: d.entities, layers: d.layers }, { textHeight: 120, dimScale: 1 });
  const s = shifts.get('ten');
  if (s && !s.leader) {
    const nx = 2500 + s.dx;
    const ny = 2500 + s.dy;
    assert.ok(nx >= 2000 && nx + 9 * 0.6 * 200 <= 5000 && ny >= 1000 && ny + 200 <= 4000, 'nhãn dịch vẫn nằm trong phòng');
  }
});

test('v2: chuỗi dim trong nhà qua planExportLabelShifts nhận wholeDim=true', () => {
  const d = docPhongCoTuong();
  const lay = d.layers[0].id;
  // dim dọc trong lòng phòng: a→b đi +y tại x=4800, off 900 → đường dim x=3900 (trong nhà)
  const dim: DimEntity = { id: 'dim1', type: 'dim', layer: lay, a: { x: 4800, y: 1000 }, b: { x: 4800, y: 4000 }, off: 900 };
  d.entities.push(dim);
  const shifts = planExportLabelShifts({ entities: d.entities, layers: d.layers }, { textHeight: 120, dimScale: 1 });
  const s = shifts.get('dim1');
  assert.ok(s, 'dim trong nhà phải được dời');
  assert.strictEqual(s!.wholeDim, true, 'dời CẢ CỤM, không phải chỉ chữ');
  assert.ok(3900 + s!.dx > 5100, 'đường dim mới nằm ngoài tường bao Đông');
});

/* ───────────── stripInternalJargon ───────────── */

test('gỡ "(đã rà công năng)" — đúng chuỗi bắt được trên layout.pdf 11/08', () => {
  assert.strictEqual(
    stripInternalJargon('MẶT BẰNG BỐ TRÍ NỘI THẤT — SƠ PHÁC DD (đã rà công năng)'),
    'MẶT BẰNG BỐ TRÍ NỘI THẤT — SƠ PHÁC DD',
  );
  assert.strictEqual(stripInternalJargon('Mặt bằng (rà công năng) tầng 2'), 'Mặt bằng tầng 2');
  assert.strictEqual(stripInternalJargon('Chuỗi sạch giữ nguyên'), 'Chuỗi sạch giữ nguyên');
});

console.log(`\n${pass} ok`);
