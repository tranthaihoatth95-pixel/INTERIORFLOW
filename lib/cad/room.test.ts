/**
 * lib/cad/room.test.ts — G-M2-04/03 · RoomEntity + dò phòng + biên cũ.
 * Chạy: node_modules/.bin/sucrase-node lib/cad/room.test.ts
 */
import type { Doc, Entity, RoomEntity, TextEntity } from './model';
import { emptyDoc } from './model';
import { detectRooms, roomAreaM2, roomLabel, staleRoomBoundaries, totalRoomAreaM2 } from './room';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean, extra = '') {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}${extra ? ` :: ${extra}` : ''}`); }
}

const line = (id: string, layer: string, ax: number, ay: number, bx: number, by: number): Entity =>
  ({ id, type: 'line', layer, a: { x: ax, y: ay }, b: { x: bx, y: by } });
const label = (id: string, layer: string, x: number, y: number, text: string): Entity =>
  ({ id, type: 'text', layer, at: { x, y }, text, h: 250 });

/** Phòng chữ nhật 4×5 m kín bằng 4 line trên layer tường + 1 nhãn giữa phòng. */
function roomDoc(): Doc {
  const d = emptyDoc();
  const wall = d.layers[0].id;
  d.entities.push(
    line('w1', wall, 0, 0, 4000, 0),
    line('w2', wall, 4000, 0, 4000, 5000),
    line('w3', wall, 4000, 5000, 0, 5000),
    line('w4', wall, 0, 5000, 0, 0),
    label('t1', wall, 2000, 2500, 'PHÒNG KHÁCH'),
  );
  return d;
}

console.log('\n[1] detectRooms — nhãn + biên kín → đề xuất RoomEntity, KHÔNG tự ghi');
{
  const d = roomDoc();
  const r = detectRooms(d);
  ok('ra đúng 1 đề xuất', r.proposals.length === 1, String(r.proposals.length));
  ok('không nhãn nào bế tắc', r.unresolved.length === 0);
  const p = r.proposals[0];
  ok('tên lấy từ nhãn', p.room.name === 'PHÒNG KHÁCH');
  ok('diện tích đúng 20 m² (4×5)', Math.abs(p.areaM2 - 20) < 0.01, p.areaM2.toFixed(3));
  ok('đề xuất trỏ đúng TextEntity sẽ thay', p.replacesTextId === 't1');
  ok('elementType = space (IfcSpace)', p.room.elementType === 'space');
  ok('Doc gốc KHÔNG bị đụng (thuần)', !d.entities.some((e) => e.type === 'room'));
}

console.log('\n[2] Nhãn KHÔNG có biên kín → unresolved KÈM LÝ DO, không im lặng (K3)');
{
  const d = roomDoc();
  // nhãn thứ hai đứng ngoài trời — không tường nào bao quanh
  d.entities.push(label('t2', d.layers[0].id, 20000, 20000, 'SÂN VƯỜN'));
  const r = detectRooms(d);
  ok('vẫn 1 đề xuất cho phòng kín', r.proposals.length === 1);
  ok('nhãn ngoài trời vào unresolved', r.unresolved.length === 1 && r.unresolved[0].name === 'SÂN VƯỜN');
  ok('lý do là câu chữ người dùng, không rỗng', r.unresolved[0].reason.length > 20);
}

console.log('\n[3] Idempotent — phòng đã tạo rồi thì KHÔNG đề xuất trùng');
{
  const d = roomDoc();
  const first = detectRooms(d).proposals[0];
  const applied: Doc = {
    ...d,
    entities: [...d.entities.filter((e) => e.id !== first.replacesTextId), first.room],
  };
  const again = detectRooms(applied);
  ok('lần 2 không còn đề xuất', again.proposals.length === 0, String(again.proposals.length));
}

console.log('\n[4] roomAreaM2/roomLabel — m² SỐNG, đổi biên là số đổi (G-M2-03)');
{
  const d = roomDoc();
  const room = detectRooms(d).proposals[0].room;
  ok('20 m²', Math.abs(roomAreaM2(room) - 20) < 0.01);
  ok('nhãn format VN', roomLabel(room).area === '20,00 m²', roomLabel(room).area);
  const grown: RoomEntity = { ...room, boundary: room.boundary.map((p) => ({ x: p.x * 2, y: p.y })) };
  ok('kéo biên rộng gấp đôi → m² tự nhân đôi, không sửa chữ nào', Math.abs(roomAreaM2(grown) - 40) < 0.01);
  ok('biên suy biến (<3 đỉnh) → 0, không NaN', roomAreaM2({ boundary: room.boundary.slice(0, 2) }) === 0);
}

console.log('\n[5] staleRoomBoundaries — tường dời thì BÁO, không tự sửa (L5)');
{
  const d = roomDoc();
  const room = detectRooms(d).proposals[0].room;
  const applied: Doc = { ...d, entities: [...d.entities.filter((e) => e.id !== 't1'), room] };
  ok('tường chưa đổi → không phòng nào stale', staleRoomBoundaries(applied).length === 0);
  // dời tường phải w2 ra thêm 1m (phòng thật thành 5×5) — biên đóng băng vẫn 4×5
  const widened: Doc = {
    ...applied,
    entities: applied.entities.map((e) =>
      e.id === 'w2' ? line('w2', e.layer, 5000, 0, 5000, 5000)
      : e.id === 'w1' ? line('w1', e.layer, 0, 0, 5000, 0)
      : e.id === 'w3' ? line('w3', e.layer, 5000, 5000, 0, 5000)
      : e,
    ),
  };
  const stale = staleRoomBoundaries(widened);
  ok('phòng bị báo biên cũ', stale.length === 1, String(stale.length));
  ok('số cũ 20 m², số mới 25 m²', stale.length === 1 && Math.abs(stale[0].frozenAreaM2 - 20) < 0.01 && Math.abs(stale[0].currentAreaM2 - 25) < 0.01,
    stale.length ? `${stale[0].frozenAreaM2}→${stale[0].currentAreaM2}` : '');
  ok('kèm biên mới để UI áp', stale.length === 1 && stale[0].newBoundary.length >= 3);
  ok('Doc KHÔNG bị tự sửa', (widened.entities.find((e) => e.id === room.id) as RoomEntity).boundary === room.boundary);
}

console.log('\n[6] totalRoomAreaM2 — tổng lòng phòng cho G-M1-05');
{
  const d = roomDoc();
  ok('chưa có phòng → 0', totalRoomAreaM2(d) === 0);
  const room = detectRooms(d).proposals[0].room;
  const applied: Doc = { ...d, entities: [...d.entities, room] };
  ok('1 phòng 20 m² → 20', Math.abs(totalRoomAreaM2(applied) - 20) < 0.01);
}

console.log(`\n${fail === 0 ? 'PASS' : 'FAIL'} — ${pass} ok, ${fail} fail`);
if (fail) process.exit(1);
