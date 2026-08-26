/**
 * lib/render-studio/form-recipe.test.ts — lớp Ý ĐỊNH của Công Thức Hình.
 * Chạy: node_modules/.bin/sucrase-node lib/render-studio/form-recipe.test.ts
 */
import assert from 'node:assert';
import type { BuildOp, BuildRecipeStep } from '../cad/model';
import { yDinhCuaOp, nhomTheoYDinh, THU_TU_Y_DINH, suaDuocThamSo, Y_DINH_CHUA_CO } from './form-recipe';

let n = 0;
function ok(ten: string, dieu: boolean) {
  n += 1;
  assert.ok(dieu, ten);
  console.log(`  ok  - ${ten}`);
}

const buoc = (id: string, op: BuildOp): BuildRecipeStep => ({ id, op, enabled: true });

/* ── ánh xạ ý định ───────────────────────────────────────────────────────────────────── */
ok('extrude thuộc Hình chính', yDinhCuaOp({ op: 'extrude', h: 2700 }) === 'hinhChinh');
ok('taper thuộc Hình chính', yDinhCuaOp({ op: 'taper', polyMm: [], topInsetMm: 100 }) === 'hinhChinh');
ok('boolean thuộc Khoét', yDinhCuaOp({ op: 'boolean', kind: 'subtract', withRef: 'c1' }) === 'khoet');
ok('bevelEx thuộc Chi tiết', yDinhCuaOp({ op: 'bevelEx', polyMm: [], radiusMm: 12, segments: 4, edges: 'all' }) === 'chiTiet');
ok('arrayLinear thuộc Hoa văn', yDinhCuaOp({ op: 'arrayLinear', n: 3, dx: 300, dy: 0, dz: 0 }) === 'hoaVan');
ok('mirror thuộc Hoa văn', yDinhCuaOp({ op: 'mirror', axis: 'x', atMm: 0 }) === 'hoaVan');

/* ── gom nhóm ────────────────────────────────────────────────────────────────────────── */
const steps: BuildRecipeStep[] = [
  buoc('s0', { op: 'extrude', h: 1050 }),
  buoc('s1', { op: 'boolean', kind: 'subtract', withRef: 'cut1' }),
  buoc('s2', { op: 'bevelEx', polyMm: [], radiusMm: 12, segments: 4, edges: 'all' }),
  buoc('s3', { op: 'taper', polyMm: [], topInsetMm: 80 }),
  buoc('s4', { op: 'arrayLinear', n: 4, dx: 400, dy: 0, dz: 0 }),
];
const nhom = nhomTheoYDinh(steps);

ok('gom đúng 4 nhóm có thật', nhom.length === 4);
ok(
  'thứ tự BÀY theo ý định, không theo thứ tự mảng',
  JSON.stringify(nhom.map((g) => g.yDinh)) === JSON.stringify(THU_TU_Y_DINH),
);
ok('Hình chính gom cả extrude lẫn taper', nhom[0].buoc.length === 2);
ok(
  'GIỮ chỉ số gốc — taper vẫn là bậc 3 dù bày ở nhóm đầu',
  nhom[0].buoc[1].index === 3 && nhom[0].buoc[1].step.id === 's3',
);
ok('giữ thứ tự tương đối trong nhóm', nhom[0].buoc[0].index === 0);
ok('nhóm rỗng KHÔNG được bày', !nhomTheoYDinh([buoc('x', { op: 'extrude', h: 100 })]).some((g) => g.buoc.length === 0));
ok('không bước nào rơi mất khi gom', nhom.reduce((s, g) => s + g.buoc.length, 0) === steps.length);
ok('danh sách rỗng ra nhóm rỗng', nhomTheoYDinh([]).length === 0);

/* ── sửa tham số / khai thật phần chưa có ────────────────────────────────────────────── */
ok('arrayLinear sửa được tham số', suaDuocThamSo({ op: 'arrayLinear', n: 2, dx: 1, dy: 0, dz: 0 }));
ok('extrude CHƯA có form sửa tại chỗ', !suaDuocThamSo({ op: 'extrude', h: 100 }));
ok('có khai phần chưa làm (Bend/Shell), không im lặng', Y_DINH_CHUA_CO.length >= 2);

console.log(`\n${n} ok, 0 fail`);
