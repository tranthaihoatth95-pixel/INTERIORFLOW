/**
 * lib/present-editor/schedule-table.test.ts — chạy bằng `sucrase-node` thẳng, import TƯƠNG ĐỐI
 * (cùng khuôn `boq-group.test.ts` — sucrase-node không resolve alias `@/`).
 */
import assert from 'node:assert/strict';
import type { Doc, BlockEntity, RoomEntity } from '../cad/model';
import { emptyDoc } from '../cad/model';
import { buildScheduleRowSeeds, SCHEDULE_GROUP_DOOR, SCHEDULE_GROUP_ROOM } from './schedule-table';
import { buildTableRows, resyncTableRows, applyTableOverrides, setTableOverride, groupTableRows } from './table-doc-engine';
import { SCHEDULE_COLUMNS } from './schedule-table';

let pass = 0;
function check(name: string, fn: () => void) {
  fn();
  pass += 1;
  console.log(`  ok ${pass}. ${name}`);
}

function doorEntity(id: string, storey?: string): BlockEntity {
  return {
    id, type: 'block', layer: 'l-block', block: 'doorRoom', elementType: 'door',
    at: { x: 0, y: 0 }, rot: 0, sx: 1, sy: 1, storey,
  };
}

function roomEntity(id: string, name: string, wMm: number, hMm: number, storey?: string): RoomEntity {
  return {
    id, type: 'room', layer: 'l-room',
    boundary: [{ x: 0, y: 0 }, { x: wMm, y: 0 }, { x: wMm, y: hMm }, { x: 0, y: hMm }],
    name, storey,
  };
}

// ── [1] Doc trống → mảng seed rỗng, KHÔNG lỗi (luật X2 — empty state, không chặn).
check('buildScheduleRowSeeds: Doc trống trả mảng rỗng', () => {
  const seeds = buildScheduleRowSeeds(emptyDoc());
  assert.deepEqual(seeds, []);
});

// ── [2] Doc có 1 cửa + 1 phòng → seed đúng nhóm, đúng entityId, đúng diện tích (mm² → m²).
check('buildScheduleRowSeeds: gieo đúng cửa (spec = rộng×cao mm) + phòng (diện tích m²)', () => {
  const doc: Doc = { ...emptyDoc(), entities: [doorEntity('door-1', 'L1'), roomEntity('room-1', 'PHÒNG KHÁCH', 5000, 4920, 'L1')] };
  const seeds = buildScheduleRowSeeds(doc);
  assert.equal(seeds.length, 2);
  const door = seeds.find((s) => s.entityId === 'door-1')!;
  assert.equal(door.groupKey, SCHEDULE_GROUP_DOOR);
  assert.equal(door.cells.spec, '800 × 2100 mm'); // doorRoom = 800mm rộng danh nghĩa (furniture.ts)
  assert.equal(door.cells.storey, 'L1');

  const room = seeds.find((s) => s.entityId === 'room-1')!;
  assert.equal(room.groupKey, SCHEDULE_GROUP_ROOM);
  assert.equal(room.cells.label, 'PHÒNG KHÁCH');
  assert.equal(room.cells.areaM2, 24.6); // 5000mm × 4920mm = 24 600 000 mm² = 24.6 m²
});

// ── [3] entity không phải cửa/phòng (vd tường/line) → KHÔNG lọt vào bảng thống kê v1.
check('buildScheduleRowSeeds: bỏ qua entity không phải cửa/phòng', () => {
  const doc: Doc = {
    ...emptyDoc(),
    entities: [
      { id: 'l1', type: 'line', layer: 'l-wall', a: { x: 0, y: 0 }, b: { x: 1000, y: 0 } } as never,
      doorEntity('door-1'),
    ],
  };
  const seeds = buildScheduleRowSeeds(doc);
  assert.equal(seeds.length, 1);
  assert.equal(seeds[0].entityId, 'door-1');
});

// ── [4] round-trip qua TableDocEngine: build → resync (đo lại hiện trường, cửa đổi 700→900) →
// override tay "Ghi chú" → giá trị tay vẫn còn sau resync lần 2.
check('kết hợp TableDocEngine: gieo từ Doc mẫu → resync giữ ô tay → nhóm đúng cửa/phòng', () => {
  const docV1: Doc = { ...emptyDoc(), entities: [doorEntity('door-1', 'L1'), roomEntity('room-1', 'PHÒNG NGỦ', 4000, 3500, 'L1')] };
  let rows = buildTableRows(buildScheduleRowSeeds(docV1));
  let overrides = setTableOverride({}, 'entity:door-1', 'note', 'Đã đặt hàng, không đổi mã cửa', 1000);

  // Đo lại hiện trường: phòng ngủ rộng hơn thực đo (4000×4000 thay vì 4000×3500).
  const docV2: Doc = { ...emptyDoc(), entities: [doorEntity('door-1', 'L1'), roomEntity('room-1', 'PHÒNG NGỦ', 4000, 4000, 'L1')] };
  const r = resyncTableRows(rows, buildScheduleRowSeeds(docV2));
  rows = r.rows;
  assert.equal(r.matched, 2);
  assert.equal(r.added, 0);

  const display = applyTableOverrides(rows, overrides);
  const room = display.find((x) => x.entityId === 'room-1')!;
  assert.equal(room.cells.areaM2, 16); // 4000×4000mm = 16 m², số MÁY đã cập nhật
  const door = display.find((x) => x.entityId === 'door-1')!;
  assert.equal(door.cells.note, 'Đã đặt hàng, không đổi mã cửa'); // ô TAY còn nguyên qua re-sync

  const groups = groupTableRows(display, SCHEDULE_COLUMNS);
  assert.equal(groups.length, 2);
  assert.equal(groups.find((g) => g.key === SCHEDULE_GROUP_ROOM)?.totals.areaM2, 16);
});

console.log(`\nschedule-table: ${pass}/${pass} PASS`);
