/**
 * lib/cad/label-placer.test.ts — VIỆC 3 `label-ne-hinh` (docs/CHUAN-DAU-RA-NGHE.md §1):
 * nhãn không đè hình học/không đè nhau; thứ tự ưu tiên giữ chỗ → dịch → leader.
 *
 * Chạy: node_modules/.bin/sucrase-node lib/cad/label-placer.test.ts
 */
import assert from 'node:assert';
import type { Box, Doc, TextEntity, DimEntity, BlockEntity, Layer } from './model';
import { emptyDoc } from './model';
import { newId } from './store';
import {
  avoidLabelCollision,
  boxesOverlap,
  countUnresolvedLabelCollisions,
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
