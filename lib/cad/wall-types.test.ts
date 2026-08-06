/**
 * lib/cad/wall-types.test.ts — VIỆC 3 (Type vs Instance).
 * Chạy: node_modules/.bin/sucrase-node lib/cad/wall-types.test.ts
 *
 * Trọng tâm nghiệm thu: **giá trị trên INSTANCE THẮNG Type** (đúng Revit), và đổi 1 Type thì mọi
 * entity trỏ vào nó đổi theo — TRỪ chỗ instance đã override.
 */
import { emptyDoc } from './model';
import type { Doc, Entity, WallType } from './model';
import { resolveWallParams, resolveWallRunParams, wallTypeById, wallTypeLayerCheck } from './wall-types';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) {
    pass += 1;
    console.log(`  ok  - ${label}`);
  } else {
    fail += 1;
    console.log(`  FAIL - ${label}`);
  }
}

function hatch(id: string, extra: Record<string, unknown> = {}): Entity {
  return { id, type: 'hatch', layer: 'l-wall', points: [], ...extra } as Entity;
}

const T_GACH100: WallType = { id: 'wt-100', name: 'Gạch 100', thicknessMm: 100, kind: 'interior', specId: 'spec-gach' };
const T_BAO220: WallType = {
  id: 'wt-220',
  name: 'Bao che 220',
  thicknessMm: 220,
  kind: 'exterior',
  layers: [
    { name: 'Vữa trát ngoài', thicknessMm: 15 },
    { name: 'Gạch đặc', thicknessMm: 190, core: true, specId: 'spec-gach-dac' },
    { name: 'Vữa trát trong', thicknessMm: 15 },
  ],
};

function docWith(entities: Entity[], wallTypes: WallType[] = [T_GACH100, T_BAO220]): Doc {
  return { ...emptyDoc(), entities, wallTypes };
}

/* ── [1] tra cứu Type ── */
function testLookup() {
  console.log('\n[1] wallTypeById');
  const doc = docWith([]);
  ok('tra đúng id', wallTypeById(doc, 'wt-220')?.thicknessMm === 220);
  ok('id không tồn tại → undefined', wallTypeById(doc, 'wt-x') === undefined);
  ok('id undefined → undefined', wallTypeById(doc, undefined) === undefined);
  ok('doc chưa có catalog → undefined', wallTypeById(emptyDoc(), 'wt-220') === undefined);
}

/* ── [2] thuần instance (hiện trạng hôm nay) — KHÔNG đổi hành vi ── */
function testInstanceOnly() {
  console.log('\n[2] TRUNG TÍNH — entity không typeId chạy y như trước');
  const doc = docWith([]);
  const r = resolveWallParams(hatch('a', { wallThicknessMm: 110, wallKind: 'interior', specId: 'spec-a' }), doc);
  ok('bề dày = số trên entity', r.thicknessMm === 110 && r.thicknessFrom === 'instance');
  ok('loại tường = số trên entity', r.kind === 'interior' && r.kindFrom === 'instance');
  ok('specId = số trên entity', r.specId === 'spec-a' && r.specIdFrom === 'instance');
  ok('không có Type nào dính vào', r.type === undefined);

  const bare = resolveWallParams(hatch('b'), doc);
  ok('entity trắng trơn → mọi field undefined', bare.thicknessMm === undefined && bare.kind === undefined && bare.specId === undefined);
  ok('nguồn đều là none (KHÔNG bịa mặc định)', bare.thicknessFrom === 'none' && bare.kindFrom === 'none' && bare.specIdFrom === 'none');

  // Entity không có field specId trong schema (line KHÔNG phải hatch/block) — không được sập.
  const line = resolveWallParams({ id: 'l1', type: 'line', layer: 'l-wall', a: { x: 0, y: 0 }, b: { x: 1, y: 0 } } as Entity, doc);
  ok('LineEntity (schema không có specId) → specIdFrom none, không sập', line.specIdFrom === 'none');
}

/* ── [3] Type cấp giá trị khi instance để trống ── */
function testTypeFallback() {
  console.log('\n[3] Type cấp mặc định khi instance để trống');
  const doc = docWith([]);
  const r = resolveWallParams(hatch('a', { typeId: 'wt-100' }), doc);
  ok('bề dày lấy từ Type', r.thicknessMm === 100 && r.thicknessFrom === 'type');
  ok('loại tường lấy từ Type', r.kind === 'interior' && r.kindFrom === 'type');
  ok('specId lấy từ Type', r.specId === 'spec-gach' && r.specIdFrom === 'type');
  ok('trả về cả object Type để UI hiện tên', r.type?.name === 'Gạch 100');

  const noSpec = resolveWallParams(hatch('b', { typeId: 'wt-220' }), doc);
  ok('Type không khai specId → specIdFrom vẫn none', noSpec.specId === undefined && noSpec.specIdFrom === 'none');
}

/* ── [4] NGHIỆM THU: INSTANCE THẮNG TYPE ── */
function testInstanceWins() {
  console.log('\n[4] NGHIỆM THU — instance override THẮNG Type (đúng Revit)');
  const doc = docWith([]);
  const r = resolveWallParams(hatch('a', { typeId: 'wt-220', wallThicknessMm: 250 }), doc);
  ok('bề dày instance 250 THẮNG type 220', r.thicknessMm === 250 && r.thicknessFrom === 'instance');
  ok('field KHÔNG override vẫn lấy từ Type', r.kind === 'exterior' && r.kindFrom === 'type');

  const flip = resolveWallParams(hatch('b', { typeId: 'wt-220', wallKind: 'interior' }), doc);
  ok('loại tường instance THẮNG type', flip.kind === 'interior' && flip.kindFrom === 'instance');
  ok('bề dày vẫn theo Type', flip.thicknessMm === 220 && flip.thicknessFrom === 'type');

  const all = resolveWallParams(hatch('c', { typeId: 'wt-100', wallThicknessMm: 80, wallKind: 'exterior', specId: 'spec-rieng' }), doc);
  ok('override cả 3 field → nguồn đều instance', all.thicknessFrom === 'instance' && all.kindFrom === 'instance' && all.specIdFrom === 'instance');
  ok('Type vẫn trả về (UI cần biết đang gắn type nào dù đã override hết)', all.type?.id === 'wt-100');
}

/* ── [5] NGHIỆM THU: đổi 1 Type → mọi bản sao đổi theo ── */
function testTypePropagation() {
  console.log('\n[5] NGHIỆM THU — đổi 1 Type, mọi entity trỏ vào đổi theo');
  const ents: Entity[] = [];
  for (let i = 0; i < 8; i++) ents.push(hatch(`e${i}`, { typeId: 'wt-100' }));
  ents.push(hatch('override', { typeId: 'wt-100', wallThicknessMm: 60 })); // đã override — PHẢI đứng yên
  ents.push(hatch('khac-type', { typeId: 'wt-220' })); // type khác — PHẢI đứng yên

  const before = docWith(ents);
  ok('trước: 8 entity đều 100mm', ents.slice(0, 8).every((e) => resolveWallParams(e, before).thicknessMm === 100));

  // ĐỔI Type: 100 → 150 (một chỗ).
  const after = docWith(ents, [{ ...T_GACH100, thicknessMm: 150 }, T_BAO220]);
  ok('sau: CẢ 8 entity thành 150mm (1 chỗ đổi, cả dự án đổi)', ents.slice(0, 8).every((e) => resolveWallParams(e, after).thicknessMm === 150));
  ok('entity đã override ĐỨNG YÊN ở 60mm', resolveWallParams(ents[8], after).thicknessMm === 60);
  ok('entity gắn Type khác ĐỨNG YÊN ở 220mm', resolveWallParams(ents[9], after).thicknessMm === 220);
  ok('không sửa entity nào tại chỗ', ents[0].typeId === 'wt-100' && ents[0].wallThicknessMm === undefined);
}

/* ── [6] cấu tạo lớp (WallTypeLayer) — tổng lớp vs bề dày tổng ── */
function testLayers() {
  console.log('\n[6] cấu tạo lớp — tổng lớp khớp/lệch bề dày tổng');
  const doc = docWith([]);
  const r = resolveWallParams(hatch('a', { typeId: 'wt-220' }), doc);
  ok('cộng đúng tổng 3 lớp (15+190+15)', r.layerThicknessSumMm === 220);
  ok('khớp bề dày tổng → KHÔNG có cờ lệch', r.layersMismatchMm === undefined);

  const wrong: WallType = { ...T_BAO220, id: 'wt-sai', layers: [{ name: 'Gạch', thicknessMm: 190 }] };
  const rw = resolveWallParams(hatch('b', { typeId: 'wt-sai' }), docWith([], [wrong]));
  ok('lệch 30mm → báo layersMismatchMm = −30', rw.layersMismatchMm === -30);
  ok('bề dày trả về VẪN là số chính thức của Type (không tự sửa theo tổng lớp)', rw.thicknessMm === 220);

  ok('Type không khai layers → không có 2 field lớp', resolveWallParams(hatch('c', { typeId: 'wt-100' }), doc).layerThicknessSumMm === undefined);
  ok('wallTypeLayerCheck gọi thẳng cũng ra đúng số', wallTypeLayerCheck(T_BAO220).sumMm === 220);
  ok('layers rỗng → coi như không khai', wallTypeLayerCheck({ ...T_GACH100, layers: [] }).sumMm === undefined);
  ok('lớp có thicknessMm NaN → tính như 0, không lây NaN ra ngoài', wallTypeLayerCheck({ ...T_GACH100, thicknessMm: 100, layers: [{ name: 'x', thicknessMm: NaN }, { name: 'y', thicknessMm: 100 }] }).sumMm === 100);
}

/* ── [7] typeId mồ côi (type bị xoá) ── */
function testDangling() {
  console.log('\n[7] typeId mồ côi — không sập, có cảnh báo');
  const doc = docWith([]);
  const r = resolveWallParams(hatch('a', { typeId: 'wt-da-xoa', wallThicknessMm: 90 }), doc);
  ok('lùi về thuần instance', r.thicknessMm === 90 && r.thicknessFrom === 'instance');
  ok('ghi đúng id mồ côi', r.danglingTypeId === 'wt-da-xoa');
  ok('không có object Type', r.type === undefined);
  ok('field không override → none, KHÔNG bịa', r.kind === undefined && r.kindFrom === 'none');
  ok('dữ liệu lành → KHÔNG có field danglingTypeId', resolveWallParams(hatch('b', { typeId: 'wt-100' }), doc).danglingTypeId === undefined);
}

/* ── [8] WallRun — hiện trạng 100% instance, khai thật ── */
function testWallRun() {
  console.log('\n[8] WallRun — nói thật là còn 100% instance');
  const doc = docWith([]);
  const r = resolveWallRunParams({ id: 'wr-1', path: [{ x: 0, y: 0 }, { x: 3000, y: 0 }], closed: false, thicknessMm: 200, locationLine: 'center', layer: 'l-wall', entityIds: [] }, doc);
  ok('bề dày = số trên run', r.thicknessMm === 200);
  ok('nguồn khai đúng là instance (chưa nối Type — xem docstring)', r.thicknessFrom === 'instance');
}

/* ── [9] NGHIỆM THU NGUYÊN VĂN VIỆC 3e: 5 tường cùng type, override 1, đổi type → 4 đổi, 1 giữ ── */
function testFiveWallsOneOverride() {
  console.log('\n[9] NGHIỆM THU 3e — 5 tường cùng Type, override 1 → đổi Type: 4 đổi, 1 giữ');
  const walls: Entity[] = [
    hatch('t1', { typeId: 'wt-100' }),
    hatch('t2', { typeId: 'wt-100' }),
    hatch('t3', { typeId: 'wt-100', wallThicknessMm: 90 }), // ← tường DUY NHẤT bị override
    hatch('t4', { typeId: 'wt-100' }),
    hatch('t5', { typeId: 'wt-100' }),
  ];

  const before = docWith(walls);
  ok('trước: cả 5 tường cùng Type "Gạch 100"', walls.every((w) => resolveWallParams(w, before).type?.id === 'wt-100'));
  ok('trước: 4 tường không override = 100mm', [0, 1, 3, 4].every((i) => resolveWallParams(walls[i], before).thicknessMm === 100));
  ok('trước: tường t3 override = 90mm', resolveWallParams(walls[2], before).thicknessMm === 90);
  ok('trước: overridden[] rỗng ở 4 tường không đè', [0, 1, 3, 4].every((i) => resolveWallParams(walls[i], before).overridden.length === 0));
  ok('trước: overridden[] của t3 = ["wallThicknessMm"]', resolveWallParams(walls[2], before).overridden.join(',') === 'wallThicknessMm');

  // ĐỔI TYPE ở MỘT chỗ: 100 → 150.
  const after = docWith(walls, [{ ...T_GACH100, thicknessMm: 150 }, T_BAO220]);
  const got = walls.map((w) => resolveWallParams(w, after).thicknessMm);
  ok('sau: ĐÚNG 4 tường đổi sang 150mm', got.filter((t) => t === 150).length === 4);
  ok('sau: ĐÚNG 1 tường giữ nguyên 90mm (t3)', got.filter((t) => t === 90).length === 1 && got[2] === 90);
  ok('sau: thứ tự đúng — t1,t2,t4,t5 = 150', got[0] === 150 && got[1] === 150 && got[3] === 150 && got[4] === 150);
  ok('sau: t3 vẫn báo overridden, 4 tường kia vẫn rỗng', resolveWallParams(walls[2], after).overridden.length === 1 && resolveWallParams(walls[0], after).overridden.length === 0);
  ok('KHÔNG sửa entity nào tại chỗ (Doc là nguồn duy nhất)', walls[2].wallThicknessMm === 90 && walls[0].wallThicknessMm === undefined);

  // ⚠️ wallKind/wallThicknessMm KHÔNG bị xoá — nay đóng vai "giá trị override" (dặn của phiếu).
  ok('field cũ wallThicknessMm còn sống, nay là giá trị override', walls[2].wallThicknessMm === 90);
}

/* ── [10] overridden[] — chỉ chấm dấu khi CÓ Type để mà đè ── */
function testOverriddenSemantics() {
  console.log('\n[10] overridden[] — không chấm dấu bừa lên tường 100% instance');
  const doc = docWith([]);
  ok('entity KHÔNG typeId dù khai đủ 3 field → overridden rỗng', resolveWallParams(hatch('a', { wallThicknessMm: 100, wallKind: 'interior', specId: 's' }), doc).overridden.length === 0);
  ok('override cả 3 field trên Type có đủ 3 → overridden đủ 3', resolveWallParams(hatch('b', { typeId: 'wt-100', wallThicknessMm: 1, wallKind: 'exterior', specId: 's' }), doc).overridden.length === 3);
  // Type KHÔNG khai specId ⇒ instance khai specId KHÔNG phải "đè" (không có gì để đè).
  ok('Type thiếu specId → instance khai specId KHÔNG tính là override', resolveWallParams(hatch('c', { typeId: 'wt-220', specId: 's' }), doc).overridden.includes('specId') === false);
  ok('… nhưng thicknessFrom vẫn nói đúng nguồn là instance', resolveWallParams(hatch('d', { typeId: 'wt-220', specId: 's' }), doc).specIdFrom === 'instance');
  ok('typeId mồ côi → overridden rỗng (không có Type nào để đè)', resolveWallParams(hatch('e', { typeId: 'wt-xoa', wallThicknessMm: 90 }), doc).overridden.length === 0);
  ok('overridden LUÔN là mảng, không bao giờ undefined', Array.isArray(resolveWallParams(hatch('f'), doc).overridden));
}

testLookup();
testInstanceOnly();
testTypeFallback();
testInstanceWins();
testTypePropagation();
testLayers();
testDangling();
testWallRun();
testFiveWallsOneOverride();
testOverriddenSemantics();

console.log(`\nwall-types.test.ts — ${pass} pass, ${fail} fail`);
if (fail) process.exit(1);
