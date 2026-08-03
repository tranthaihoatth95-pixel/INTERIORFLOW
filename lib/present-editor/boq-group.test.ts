/**
 * lib/present-editor/boq-group.test.ts — kiểm B6 group theo tầng (logic thuần). Chạy:
 *   node_modules/.bin/sucrase-node lib/present-editor/boq-group.test.ts
 */
import { groupBoqRowsByStorey, NO_STOREY_LABEL, MULTI_STOREY_LABEL } from './boq-group';
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

console.log(`\nKẾT QUẢ: ${pass} pass, ${fail} fail`);
if (fail) process.exit(1);
