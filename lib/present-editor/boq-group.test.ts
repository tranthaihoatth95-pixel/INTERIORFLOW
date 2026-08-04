/**
 * lib/present-editor/boq-group.test.ts — kiểm B6 group theo tầng (logic thuần). Chạy:
 *   node_modules/.bin/sucrase-node lib/present-editor/boq-group.test.ts
 */
import { groupBoqRowsByStorey, groupBoqRowsByRoom, groupBoqRows, NO_STOREY_LABEL, MULTI_STOREY_LABEL, NO_ROOM_LABEL, MULTI_ROOM_LABEL } from './boq-group';
import type { BoqRow } from '../boq/model';
import type { Doc, Entity } from '../cad/model';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

function hatch(id: string, storey?: string): Entity {
  return { id, type: 'hatch', layer: 'L', storey, points: [] } as unknown as Entity;
}

const doc: Doc = {
  entities: [hatch('h1', 'GF'), hatch('h2', 'GF'), hatch('h3', 'L1'), hatch('h4'), hatch('h5', 'GF')],
  layers: [],
};

const rows: BoqRow[] = [
  { matId: 'm1', ten: 'A', ncc: '', ma: '', m2: 10, donGia: 100_000, haoHutPhanTram: 0, thanhTien: 1_000_000, entityIds: ['h1'] },
  { matId: 'm2', ten: 'B', ncc: '', ma: '', m2: 20, donGia: 200_000, haoHutPhanTram: 0, thanhTien: 4_000_000, entityIds: ['h2'] },
  { matId: 'm3', ten: 'C', ncc: '', ma: '', m2: 5, donGia: 300_000, haoHutPhanTram: 0, thanhTien: 1_500_000, entityIds: ['h3'] },
  { matId: 'm4', ten: 'D', ncc: '', ma: '', m2: 8, donGia: 50_000, haoHutPhanTram: 0, thanhTien: 400_000, entityIds: ['h4'] },
  { matId: 'm5', ten: 'E-vắt-2-tầng', ncc: '', ma: '', m2: 3, donGia: 10_000, haoHutPhanTram: 0, thanhTien: 30_000, entityIds: ['h3', 'h5'] },
];

console.log('\n[1] nhóm đúng theo storey');
{
  const groups = groupBoqRowsByStorey(rows, doc);
  ok('có 4 nhóm (GF, L1, chưa gán, nhiều tầng)', groups.length === 4);
  const gf = groups.find((g) => g.key === 'GF');
  ok('GF gồm 2 dòng (m1,m2)', gf?.rows.length === 2);
  ok('GF subtotalM2 = 30', gf?.subtotalM2 === 30);
  ok('GF subtotalAmount = 5.000.000', gf?.subtotalAmount === 5_000_000);
}

console.log('\n[2] chưa gán tầng + nhiều tầng đúng nhãn, KHÔNG chia đôi số');
{
  const groups = groupBoqRowsByStorey(rows, doc);
  const none = groups.find((g) => g.label === NO_STOREY_LABEL);
  ok('nhãn "Chưa gán tầng" đúng', !!none);
  ok('dòng D vào nhóm chưa gán', none?.rows[0]?.matId === 'm4');
  const multi = groups.find((g) => g.label === MULTI_STOREY_LABEL);
  ok('nhãn "Nhiều tầng" đúng', !!multi);
  ok('dòng E vẫn giữ NGUYÊN thanhTien 30.000 (không chia đôi)', multi?.rows[0]?.thanhTien === 30_000);
  ok('multiStorey=true', multi?.multiStorey === true);
}

console.log('\n[3] Σ subtotal các nhóm = tổng thanhTien toàn bộ rows (N3)');
{
  const groups = groupBoqRowsByStorey(rows, doc);
  const sumGroups = groups.reduce((s, g) => s + g.subtotalAmount, 0);
  const sumRows = rows.reduce((s, r) => s + r.thanhTien, 0);
  ok(`Σ nhóm (${sumGroups}) = Σ rows (${sumRows})`, sumGroups === sumRows);
}

console.log('\n[4] thứ tự nhóm ổn định = thứ tự gặp lần đầu trong rows');
{
  const groups = groupBoqRowsByStorey(rows, doc);
  ok('thứ tự GF, L1, chưa-gán, nhiều-tầng', groups.map((g) => g.key).join(',') === 'GF,L1,__none__,__multi__');
}

// ─── nhóm theo PHÒNG (04/08, mở rộng) — không có tường khép kín ⇒ findHatchBoundary luôn null
// ⇒ MỌI gán phòng đi qua nhánh "nhãn gần nhất", đúng ca thật phổ biến (bản vẽ demo/đơn giản chưa
// đủ tường khép để dò biên) — test khoá đúng hành vi fallback + cờ inferred, không giả vờ chắc.
function textRoom(id: string, at: { x: number; y: number }, text: string): Entity {
  return { id, type: 'text', layer: 'L', at, text, h: 200 } as unknown as Entity;
}
function hatchAt(id: string, cx: number, cy: number): Entity {
  const s = 100;
  return { id, type: 'hatch', layer: 'L', points: [{ x: cx - s, y: cy - s }, { x: cx + s, y: cy - s }, { x: cx + s, y: cy + s }, { x: cx - s, y: cy + s }] } as unknown as Entity;
}

// Nhãn phòng đặt XA hẳn mọi vùng tô (findHatchBoundary tìm mặt khép kín BAO quanh `t.at` trong
// TOÀN BỘ entity không-phải-text/block — kể cả chính các hatch này, xem collectBoundarySegments —
// nên nếu đặt nhãn TRONG 1 hatch, hatch đó vô tình trở thành "biên phòng" và test hoá ra kiểm
// nhánh khác (chắc chắn) thay vì nhánh suy đoán muốn kiểm ở đây). Không hatch nào bao quanh nhãn
// ⇒ poly luôn null ⇒ MỌI gán đi qua đúng nhánh "nhãn gần nhất", đúng ý test.
const roomDoc: Doc = {
  entities: [
    textRoom('t1', { x: 0, y: -1000 }, 'PHÒNG NGỦ'),
    textRoom('t2', { x: 3000, y: -1000 }, 'PHÒNG KHÁCH'),
    hatchAt('hr1', 50, 50), // gần PHÒNG NGỦ
    hatchAt('hr2', 2950, 50), // gần PHÒNG KHÁCH
  ],
  layers: [],
};

const roomRows: BoqRow[] = [
  { matId: 'r1', ten: 'Sàn ngủ', ncc: '', ma: '', m2: 10, donGia: 100_000, haoHutPhanTram: 0, thanhTien: 1_000_000, entityIds: ['hr1'] },
  { matId: 'r2', ten: 'Sàn khách', ncc: '', ma: '', m2: 20, donGia: 200_000, haoHutPhanTram: 0, thanhTien: 4_000_000, entityIds: ['hr2'] },
  { matId: 'r3', ten: 'Vắt 2 phòng', ncc: '', ma: '', m2: 3, donGia: 10_000, haoHutPhanTram: 0, thanhTien: 30_000, entityIds: ['hr1', 'hr2'] },
  { matId: 'r4', ten: 'Không tìm thấy vùng tô', ncc: '', ma: '', m2: 1, donGia: 1_000, haoHutPhanTram: 0, thanhTien: 1_000, entityIds: ['khong-ton-tai'] },
];

console.log('\n[5] nhóm theo phòng — gán đúng phòng GẦN NHẤT khi không có biên khép kín, cờ inferred=true');
{
  const groups = groupBoqRowsByRoom(roomRows, roomDoc);
  const ngu = groups.find((g) => g.key === 'PHÒNG NGỦ');
  const khach = groups.find((g) => g.key === 'PHÒNG KHÁCH');
  ok('có nhóm PHÒNG NGỦ', !!ngu);
  ok('có nhóm PHÒNG KHÁCH', !!khach);
  ok('PHÒNG NGỦ gồm đúng dòng r1', ngu?.rows.map((r) => r.matId).join(',') === 'r1');
  ok('PHÒNG KHÁCH gồm đúng dòng r2', khach?.rows.map((r) => r.matId).join(',') === 'r2');
  ok('inferred=true (không có tường khép để dò biên thật)', ngu?.inferred === true && khach?.inferred === true);
}

console.log('\n[6] nhóm theo phòng — dòng vắt 2 phòng ra nhóm "Nhiều phòng", KHÔNG chia đôi số');
{
  const groups = groupBoqRowsByRoom(roomRows, roomDoc);
  const multi = groups.find((g) => g.label === MULTI_ROOM_LABEL);
  ok('nhãn "Nhiều phòng" đúng', !!multi);
  ok('dòng r3 giữ nguyên thanhTien 30.000', multi?.rows[0]?.thanhTien === 30_000);
}

console.log('\n[7] nhóm theo phòng — entityIds không khớp hatch nào ⇒ "Chưa gán phòng"');
{
  const groups = groupBoqRowsByRoom(roomRows, roomDoc);
  const none = groups.find((g) => g.label === NO_ROOM_LABEL);
  ok('nhãn "Chưa gán phòng" đúng', !!none);
  ok('dòng r4 vào nhóm chưa gán', none?.rows[0]?.matId === 'r4');
}

console.log('\n[8] nhóm theo phòng — dự án KHÔNG có nhãn phòng nào ⇒ tất cả "Chưa gán phòng", không suy đoán mù');
{
  const noRoomDoc: Doc = { entities: [hatchAt('h1', 0, 0)], layers: [] };
  const rows: BoqRow[] = [{ matId: 'x', ten: 'X', ncc: '', ma: '', m2: 1, donGia: 1, haoHutPhanTram: 0, thanhTien: 1, entityIds: ['h1'] }];
  const groups = groupBoqRowsByRoom(rows, noRoomDoc);
  ok('1 nhóm "Chưa gán phòng"', groups.length === 1 && groups[0].label === NO_ROOM_LABEL);
  ok('KHÔNG bật inferred khi không có gì để suy đoán từ', groups[0].inferred === false);
}

console.log('\n[9] Σ subtotal nhóm-theo-phòng = tổng thanhTien (N3, cùng bất biến như nhóm-theo-tầng)');
{
  const groups = groupBoqRowsByRoom(roomRows, roomDoc);
  const sumGroups = groups.reduce((s, g) => s + g.subtotalAmount, 0);
  const sumRows = roomRows.reduce((s, r) => s + r.thanhTien, 0);
  ok(`Σ nhóm (${sumGroups}) = Σ rows (${sumRows})`, sumGroups === sumRows);
}

console.log('\n[10] groupBoqRows(mode) điều phối đúng hàm');
{
  ok('mode=storey', groupBoqRows(rows, doc, 'storey').length === groupBoqRowsByStorey(rows, doc).length);
  ok('mode=room', groupBoqRows(roomRows, roomDoc, 'room').length === groupBoqRowsByRoom(roomRows, roomDoc).length);
}

console.log(`\nKẾT QUẢ: ${pass} pass, ${fail} fail`);
if (fail) process.exit(1);
