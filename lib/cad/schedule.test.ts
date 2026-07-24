/**
 * lib/cad/schedule.test.ts — C1 Hệ Legend: buildSchedule() đếm/group + scheduleToEntities()
 * đóng dấu bảng. Chạy:
 *   node_modules/.bin/sucrase-node lib/cad/schedule.test.ts
 */
import { buildSchedule, scheduleToEntities, SCHEDULE_TABLE_W, ELEMENT_TYPE_LABELS } from './schedule';
import { emptyDoc, type Doc, type BlockEntity, type Entity, entityBox } from './model';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

let seq = 0;
function blk(block: string, extra?: Partial<BlockEntity>): BlockEntity {
  seq += 1;
  return { id: `b${seq}`, type: 'block', layer: 'l-furniture', block, at: { x: seq * 3000, y: 0 }, rot: 0, sx: 1, sy: 1, ...extra };
}

function planDoc(): Doc {
  const doc = emptyDoc();
  doc.entities.push(
    blk('sofa3', { specId: 'spec-sofa' }),
    blk('sofa3'),
    blk('bedD'),
    blk('bedD', { variant: 'king-1800' }),
    blk('door', { elementType: 'door' }),
  );
  // tường vẽ bằng line có elementType
  doc.entities.push({ id: 'w1', type: 'line', layer: 'l-wall', elementType: 'wall', a: { x: 0, y: 0 }, b: { x: 5000, y: 0 } } as Entity);
  doc.entities.push({ id: 'w2', type: 'line', layer: 'l-wall', elementType: 'wall', a: { x: 0, y: 0 }, b: { x: 0, y: 4000 } } as Entity);
  // hatch KHÔNG elementType → "Chưa phân loại"
  doc.entities.push({ id: 'h1', type: 'hatch', layer: 'l-wall', solid: true, points: [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }] } as Entity);
  // text trang trí — không đếm
  doc.entities.push({ id: 't1', type: 'text', layer: 'l-text', at: { x: 0, y: 0 }, text: 'PHÒNG KHÁCH', h: 200 } as Entity);
  return doc;
}

/* ═══ [1] doc trống ═══ */
console.log('\n[1] doc trống');
ok('0 hàng', buildSchedule(emptyDoc()).length === 0);

/* ═══ [2] đếm + group ═══ */
console.log('\n[2] đếm + group');
const rows = buildSchedule(planDoc());
const byKey = new Map(rows.map((r) => [r.key, r]));
ok('sofa3 đếm 2', byKey.get('block:sofa3')?.count === 2);
ok('sofa3 label từ BlockDef', byKey.get('block:sofa3')?.label === 'Sofa 3 chỗ');
ok('sofa3 giữ specId đã gán', byKey.get('block:sofa3')?.specId === 'spec-sofa');
ok('sofa3 kèm KT danh nghĩa 2100', byKey.get('block:sofa3')?.w === 2100);
ok('bedD tách theo variant (2 hàng)', byKey.has('block:bedD') && byKey.has('block:bedD:king-1800'));
ok('variant king-1800 lấy KT variant 1800', byKey.get('block:bedD:king-1800')?.w === 1800);
ok('tường group elem:wall = 2', byKey.get('elem:wall')?.count === 2);
ok('nhãn wall song ngữ', byKey.get('elem:wall')?.label === ELEMENT_TYPE_LABELS.wall);
ok('hatch thiếu elementType → Chưa phân loại', byKey.get('unclassified')?.count === 1);
ok('text trang trí không đếm', ![...byKey.keys()].some((k) => k.includes('text')));
ok('ids đủ để highlight (sofa3 2 id)', byKey.get('block:sofa3')?.ids.length === 2);

/* ═══ [3] filter theo elementType ═══ */
console.log('\n[3] filter');
const doors = buildSchedule(planDoc(), 'door');
ok('filter door: 1 hàng', doors.length === 1 && doors[0].count === 1);
const walls = buildSchedule(planDoc(), 'wall');
ok('filter wall: chỉ tường', walls.length === 1 && walls[0].key === 'elem:wall');

/* ═══ [4] đóng dấu bảng lên bản vẽ ═══ */
console.log('\n[4] scheduleToEntities');
const ents = scheduleToEntities(rows, { x: 10000, y: 0 }, { notes: { 'block:sofa3': 'MU-OUT-3S · Muuto' } });
ok('có entity', ents.length > 0);
ok('chỉ text/line/rect (entity thường — DXF/PDF export được)', ents.every((e) => e.type === 'text' || e.type === 'line' || e.type === 'rect'));
const texts = ents.filter((e) => e.type === 'text') as Extract<Entity, { type: 'text' }>[];
ok('có tiêu đề song ngữ', texts.some((t) => t.text === 'THỐNG KÊ · SCHEDULE'));
ok('có ghi chú sku từ notes', texts.some((t) => t.text.includes('MU-OUT-3S')));
ok('có hàng đếm sofa (SL 2)', texts.some((t) => t.text === 'Sofa 3 chỗ'));
const frame = ents.find((e) => e.type === 'rect') as Extract<Entity, { type: 'rect' }>;
ok('khung rộng đúng tổng cột', frame.w === SCHEDULE_TABLE_W);
ok('bảng nằm dưới điểm đặt (Y-up)', frame.y < 0 && entityBox(frame).maxY === 0);

/* ═══ [5] id không trùng ═══ */
console.log('\n[5] id duy nhất');
const ids = new Set(ents.map((e) => e.id));
ok('id entity không trùng', ids.size === ents.length);

console.log(`\nKẾT QUẢ: ${pass} pass, ${fail} fail`);
if (fail) process.exit(1);
