/**
 * lib/cad/plan-drawon.test.ts — chạy: node_modules/.bin/sucrase-node lib/cad/plan-drawon.test.ts
 *
 * LUẬT TRUNG TÍNH: mọi id/tên/nhãn trong fixture HƯ CẤU 100% (không tên studio/khách thật).
 */
import {
  classifyDrawOnBatch, planDrawOn, findMainDoor, DRAW_ON_BATCH_ORDER, DRAW_ON_BATCH_DURATION_SEC,
} from './plan-drawon';
import type { Doc, Entity, Layer, LineEntity, PolylineEntity, TextEntity, DimEntity, ZoneEntity, HatchEntity, BlockEntity } from './model';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

/* ── fixture helpers (hư cấu 100%, khớp khuôn backup-diff.test.ts) ── */
function layer(id: string, lineweight?: number): Layer {
  return { id, name: id, visible: true, locked: false, color: '#000000', lineweight };
}
function line(id: string, layerId: string, extra?: Partial<LineEntity>): LineEntity {
  return { id, type: 'line', layer: layerId, a: { x: 0, y: 0 }, b: { x: 100, y: 0 }, ...extra };
}
function poly(id: string, layerId: string, extra?: Partial<PolylineEntity>): PolylineEntity {
  return { id, type: 'polyline', layer: layerId, points: [{ x: 0, y: 0 }, { x: 100, y: 0 }], closed: false, ...extra };
}
function text(id: string, layerId: string, t = 'PHÒNG NGỦ'): TextEntity {
  return { id, type: 'text', layer: layerId, at: { x: 0, y: 0 }, text: t, h: 250 };
}
function dim(id: string, layerId: string): DimEntity {
  return { id, type: 'dim', layer: layerId, a: { x: 0, y: 0 }, b: { x: 100, y: 0 }, off: 50 };
}
function zone(id: string, layerId: string): ZoneEntity {
  return {
    id, type: 'zone', layer: layerId, polygon: [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }],
    label: 'KHU MẪU', group: 'social', opacity: 0.4,
  };
}
function docOf(entities: Entity[], layers: Layer[]): Pick<Doc, 'entities' | 'layers'> {
  return { entities, layers };
}
function hatch(id: string, layerId: string, points: { x: number; y: number }[], elementType?: Entity['elementType']): HatchEntity {
  return { id, type: 'hatch', layer: layerId, points, solid: true, elementType };
}
function block(id: string, layerId: string, blockId: string, at: { x: number; y: number }, extra?: Partial<BlockEntity>): BlockEntity {
  return { id, type: 'block', layer: layerId, block: blockId, at, rot: 0, sx: 1, sy: 1, elementType: blockId.startsWith('door') ? 'door' : 'furniture', ...extra };
}

/* ── [1] classifyDrawOnBatch — đúng bảng §1.1, đủ 8 elementType + null/undefined ── */
function testClassify() {
  console.log('\n[1] classifyDrawOnBatch — đúng bảng §1.1');
  const wall = line('e-wall', 'l1', { elementType: 'wall' });
  const column = line('e-col', 'l1', { elementType: 'column' });
  const slab = poly('e-slab', 'l1', { elementType: 'slab' });
  const beam = line('e-beam', 'l1', { elementType: 'beam' });
  const door = line('e-door', 'l1', { elementType: 'door' });
  const window = line('e-win', 'l1', { elementType: 'window' });
  const furn = line('e-furn', 'l1', { elementType: 'furniture' });
  const space = poly('e-space', 'l1', { elementType: 'space' });
  const zoneEnt = zone('e-zone', 'l1');
  const dimEnt = dim('e-dim', 'l1');
  const textEnt = text('e-text', 'l1');
  const nullEt = line('e-null', 'l1', { elementType: null });
  const undefEt = line('e-undef', 'l1');

  ok('wall → shell', classifyDrawOnBatch(wall, 0.25) === 'shell');
  ok('column → shell', classifyDrawOnBatch(column, 0.25) === 'shell');
  ok('slab → shell', classifyDrawOnBatch(slab, 0.25) === 'shell');
  ok('beam → shell (spec thiếu, suy luận)', classifyDrawOnBatch(beam, 0.25) === 'shell');
  ok('door → openings', classifyDrawOnBatch(door, 0.25) === 'openings');
  ok('window → openings', classifyDrawOnBatch(window, 0.25) === 'openings');
  ok('furniture → furniture', classifyDrawOnBatch(furn, 0.25) === 'furniture');
  ok('space (elementType) → zones', classifyDrawOnBatch(space, 0.25) === 'zones');
  ok('type=zone (bất kể elementType) → zones', classifyDrawOnBatch(zoneEnt, 0.25) === 'zones');
  ok('type=dim → annotations', classifyDrawOnBatch(dimEnt, 0.25) === 'annotations');
  ok('type=text → annotations', classifyDrawOnBatch(textEnt, 0.25) === 'annotations');

  // dim/text PHẢI thắng elementType nếu (giả định) có gán lẫn — đúng luật "bất kể elementType".
  const dimWithElementType = { ...dim('e-dim2', 'l1'), elementType: 'wall' as const };
  ok('type=dim dù elementType=wall vẫn → annotations (dim/text thắng)', classifyDrawOnBatch(dimWithElementType, 0.25) === 'annotations');

  ok('elementType=null, layer MỎNG (0.25) → annotations (fallback)', classifyDrawOnBatch(nullEt, 0.25) === 'annotations');
  ok('elementType=null, layer DÀY (0.5) → shell (fallback)', classifyDrawOnBatch(nullEt, 0.5) === 'shell');
  ok('elementType=null, layer DÀY hơn (0.7) → shell (fallback)', classifyDrawOnBatch(nullEt, 0.7) === 'shell');
  ok('elementType=undefined (chưa gán field) → xử lý giống null', classifyDrawOnBatch(undefEt, 0.6) === 'shell');
  ok('elementType=null, ngưỡng biên 0.49 → annotations', classifyDrawOnBatch(nullEt, 0.49) === 'annotations');
  ok('elementType=null, ngưỡng biên đúng 0.5 → shell', classifyDrawOnBatch(nullEt, 0.5) === 'shell');
}

/* ── [2] planDrawOn — thứ tự đợt, mốc thời gian, cấu trúc feed ── */
function testPlanBasic() {
  console.log('\n[2] planDrawOn — thứ tự đợt + mốc thời gian');
  const layers = [layer('l1', 0.5), layer('l2', 0.25)];
  const entities: Entity[] = [
    line('w1', 'l1', { elementType: 'wall' }),
    line('w2', 'l1', { elementType: 'wall' }),
    line('d1', 'l1', { elementType: 'door' }),
    line('f1', 'l1', { elementType: 'furniture' }),
    line('f2', 'l1', { elementType: 'furniture' }),
    line('f3', 'l1', { elementType: 'furniture' }),
    zone('z1', 'l1'),
    text('t1', 'l2'),
  ];
  const plan = planDrawOn(docOf(entities, layers));

  ok('5 đợt, đúng thứ tự shell→openings→furniture→zones→annotations',
    plan.groups.map((g) => g.batch).join(',') === DRAW_ON_BATCH_ORDER.join(','));

  ok('đợt shell có đúng 2 entity (w1,w2)', plan.groups[0].entityIds.join(',') === 'w1,w2');
  ok('đợt openings có đúng 1 entity (d1)', plan.groups[1].entityIds.join(',') === 'd1');
  ok('đợt furniture có đúng 3 entity', plan.groups[2].entityIds.length === 3);
  ok('đợt zones có đúng 1 entity (z1)', plan.groups[3].entityIds.join(',') === 'z1');
  ok('đợt annotations có đúng 1 entity (t1)', plan.groups[4].entityIds.join(',') === 't1');

  // mốc bắt đầu cộng dồn đúng theo DRAW_ON_BATCH_DURATION_SEC.
  const expectedStarts = [0, 3.0, 4.5, 7.0, 8.0];
  ok('mốc bắt đầu 5 đợt cộng dồn đúng', plan.groups.every((g, i) => Math.abs(g.startSec - expectedStarts[i]) < 1e-9));
  const expectedTotal = Object.values(DRAW_ON_BATCH_DURATION_SEC).reduce((a, b) => a + b, 0);
  ok(`tổng thời lượng = ${expectedTotal}s (tổng bảng §1.1)`, Math.abs(plan.totalDurationSec - expectedTotal) < 1e-9);

  // revealDelay của từng entity nằm trong đúng cửa sổ đợt của nó (KHÔNG tràn qua đợt sau).
  const delayById = new Map(plan.slide.elements.map((e) => [e.id, e.revealDelay]));
  ok('w1 delay trong [0,3.0)', delayById.get('w1')! >= 0 && delayById.get('w1')! < 3.0);
  ok('w2 delay trong [0,3.0), SAU w1 (rải đều)', delayById.get('w2')! > delayById.get('w1')! && delayById.get('w2')! < 3.0);
  ok('d1 delay trong [3.0,4.5)', delayById.get('d1')! >= 3.0 && delayById.get('d1')! < 4.5);
  ok('f1/f2/f3 delay trong [4.5,7.0), tăng dần', delayById.get('f1')! < delayById.get('f2')! && delayById.get('f2')! < delayById.get('f3')! && delayById.get('f3')! < 7.0);
  ok('z1 delay trong [7.0,8.0)', delayById.get('z1')! >= 7.0 && delayById.get('z1')! < 8.0);
  ok('t1 delay trong [8.0,9.5)', delayById.get('t1')! >= 8.0 && delayById.get('t1')! < 9.5);

  // đợt chỉ có 1 entity → delay = đúng startSec (không chia 0).
  ok('đợt 1-entity (openings) → delay = startSec đúng (không NaN)', delayById.get('d1') === plan.groups[1].startSec);

  // batchOf tra đúng.
  ok('batchOf tra đúng cho w1', plan.batchOf['w1'] === 'shell');
  ok('batchOf tra đúng cho f2', plan.batchOf['f2'] === 'furniture');

  // timings TÁI DÙNG computeElementRevealTimings — id khớp, delaySec khớp EXACT revealDelay đã set
  // (vì revealDelay tường minh GHI ĐÈ auto-stagger, đúng cơ chế đã đọc trong motion-present.ts).
  ok('timings có đủ 8 phần tử', plan.timings.length === 8);
  const timingById = new Map(plan.timings.map((t) => [t.id, t]));
  ok('timings.delaySec KHỚP EXACT revealDelay đã tính (computeElementRevealTimings không tự tính lại)',
    plan.slide.elements.every((e) => timingById.get(e.id)!.delaySec === e.revealDelay));
  ok('timings.reveal khớp elementReveal đã gán (furniture → rise)', timingById.get('f1')!.reveal === 'rise');
  ok('timings.reveal khớp elementReveal đã gán (annotations → fade)', timingById.get('t1')!.reveal === 'fade');
}

/* ── [3] KHÔNG bỏ sót entity — tổng vào = tổng ra, đủ MỌI kiểu entity + layer thiếu/lạ ── */
function testNoEntityDropped() {
  console.log('\n[3] KHÔNG bỏ sót entity nào — tổng vào = tổng ra');

  const layers = [layer('thick', 0.7), layer('thin', 0.13), layer('no-lw')]; // 'no-lw' không khai lineweight
  const entities: Entity[] = [
    // đủ 8 giá trị ElementType + null + undefined, trộn nhiều EntityType.
    line('a1', 'thick', { elementType: 'wall' }),
    line('a2', 'thick', { elementType: 'slab' }),
    poly('a3', 'thick', { elementType: 'column' }),
    line('a4', 'thick', { elementType: 'beam' }),
    line('a5', 'thin', { elementType: 'door' }),
    line('a6', 'thin', { elementType: 'window' }),
    line('a7', 'thin', { elementType: 'furniture' }),
    poly('a8', 'thin', { elementType: 'space' }),
    line('a9', 'thin', { elementType: null }),
    line('a10', 'thin'), // undefined
    zone('a11', 'thin'),
    dim('a12', 'thin'),
    text('a13', 'thin'),
    // layer KHÔNG khai lineweight → fallback DEFAULT_LINEWEIGHT_MM (0.25, mỏng) → annotations.
    line('a14', 'no-lw'),
    // layer id KHÔNG TỒN TẠI trong doc.layers (dữ liệu hỏng/tham chiếu treo) — vẫn KHÔNG được rơi.
    line('a15', 'layer-khong-ton-tai'),
    // entity tự override lineweight riêng (hiếm, model.ts Base.lineweight) dù layer mỏng.
    line('a16', 'thin', { lineweight: 0.7 }),
  ];

  const plan = planDrawOn(docOf(entities, layers));

  const totalIn = entities.length;
  const totalOutGroups = plan.groups.reduce((sum, g) => sum + g.entityIds.length, 0);
  const totalOutSlide = plan.slide.elements.length;
  const totalOutBatchOf = Object.keys(plan.batchOf).length;
  const totalOutTimings = plan.timings.length;

  ok(`tổng entity vào (${totalIn}) = tổng trong groups[]`, totalOutGroups === totalIn);
  ok(`tổng entity vào (${totalIn}) = tổng trong slide.elements`, totalOutSlide === totalIn);
  ok(`tổng entity vào (${totalIn}) = tổng trong batchOf`, totalOutBatchOf === totalIn);
  ok(`tổng entity vào (${totalIn}) = tổng trong timings`, totalOutTimings === totalIn);

  // không trùng lặp id giữa các đợt (mỗi entity xuất hiện ĐÚNG 1 đợt).
  const allIdsAcrossGroups = plan.groups.flatMap((g) => g.entityIds);
  ok('không có id trùng lặp giữa các đợt', new Set(allIdsAcrossGroups).size === allIdsAcrossGroups.length);

  // xác nhận vài ca fallback cụ thể (đọc bằng lệnh, không suy đoán):
  ok('a14 (layer không khai lineweight) → annotations (fallback 0.25 mỏng)', plan.batchOf['a14'] === 'annotations');
  ok('a15 (layer id không tồn tại) → annotations (fallback 0.25 mỏng), KHÔNG throw', plan.batchOf['a15'] === 'annotations');
  ok('a16 (override lineweight riêng 0.7 dù layer mỏng) → shell', plan.batchOf['a16'] === 'shell');
  ok('a9 (elementType=null tường minh, layer mỏng) → annotations', plan.batchOf['a9'] === 'annotations');
  ok('a10 (elementType chưa gán, layer mỏng) → annotations', plan.batchOf['a10'] === 'annotations');
}

/* ── [4] ĐO: mặt bằng ~2000 entity — chạy hết bao lâu (đầu ra của lệnh, không suy đoán) ── */
function testMeasure2000() {
  console.log('\n[4] Đo thời gian chạy planDrawOn() với ~2000 entity');
  const layers = [layer('l1', 0.6), layer('l2', 0.2)];
  const N = 2000;
  const entities: Entity[] = [];
  const kinds: (Entity['elementType'])[] = ['wall', 'column', 'slab', 'beam', 'door', 'window', 'furniture', 'space', null, undefined];
  for (let i = 0; i < N; i++) {
    const et = kinds[i % kinds.length];
    if (i % 37 === 0) entities.push(zone(`z${i}`, 'l1'));
    else if (i % 23 === 0) entities.push(dim(`d${i}`, 'l1'));
    else if (i % 19 === 0) entities.push(text(`t${i}`, 'l2'));
    else entities.push(line(`e${i}`, i % 2 === 0 ? 'l1' : 'l2', { elementType: et ?? undefined }));
  }

  const t0 = process.hrtime.bigint();
  const plan = planDrawOn(docOf(entities, layers));
  const t1 = process.hrtime.bigint();
  const ms = Number(t1 - t0) / 1e6;

  const totalOut = plan.groups.reduce((s, g) => s + g.entityIds.length, 0);
  ok(`~${N} entity → 0 bỏ sót (vào ${entities.length}, ra ${totalOut})`, totalOut === entities.length);
  ok('thời gian chạy planDrawOn() < 500ms (bảo vệ hồi quy hiệu năng thô)', ms < 500);
  console.log(`  💭 ĐO ĐƯỢC: planDrawOn() cho ${entities.length} entity chạy ${ms.toFixed(2)} ms (tính toán, KHÔNG phải thời lượng video).`);
  console.log(`  💭 Thời lượng VIDEO (totalDurationSec) = ${plan.totalDurationSec}s — CỐ ĐỊNH theo thiết kế, không phụ thuộc N entity (xem JSDoc planDrawOn).`);
}

/* ── [5] V1.1 — so le nội thất theo khoảng cách tới cửa chính (C5, 02/08) ── */
function roomWalls(layerId = 'l1'): HatchEntity[] {
  // phòng 6000×4000mm, mỗi tường 1 hatch mỏng dọc biên — union bbox ≈ (-100,-100)..(6100,4100)
  return [
    hatch('wS', layerId, [{ x: 0, y: -100 }, { x: 6000, y: -100 }, { x: 6000, y: 0 }, { x: 0, y: 0 }], 'wall'),
    hatch('wN', layerId, [{ x: 0, y: 4000 }, { x: 6000, y: 4000 }, { x: 6000, y: 4100 }, { x: 0, y: 4100 }], 'wall'),
    hatch('wW', layerId, [{ x: -100, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 4000 }, { x: -100, y: 4000 }], 'wall'),
    hatch('wE', layerId, [{ x: 6000, y: 0 }, { x: 6100, y: 0 }, { x: 6100, y: 4000 }, { x: 6000, y: 4000 }], 'wall'),
  ];
}

function testFindMainDoor() {
  console.log('\n[5a] findMainDoor — door rộng nhất TRÊN BIÊN NGOÀI, bỏ qua door nội bộ dù rộng hơn');
  const walls = roomWalls();
  const shellBox = { minX: -100, minY: -100, maxX: 6100, maxY: 4100 };

  const doorMain = block('doorMain', 'l1', 'door', { x: 3000, y: 0 }); // biên Nam, w=900
  const doorWc = block('doorWc', 'l1', 'doorWC', { x: 0, y: 2000 }); // biên Tây, w=700 — hẹp hơn
  const doorInteriorWide = block('doorInterior', 'l1', 'door', { x: 3000, y: 2000 }, { sx: 1.5 }); // GIỮA phòng, w hiệu dụng 1350 — RỘNG NHẤT nhưng KHÔNG chạm biên

  const found = findMainDoor([doorMain, doorWc, doorInteriorWide], shellBox);
  ok('chọn đúng door biên Nam (rộng nhất TRONG SỐ door chạm biên), bỏ qua door nội bộ rộng hơn', !!found && found.x === 3000 && found.y === 0);

  ok('không door nào → null', findMainDoor([], shellBox) === null);
  ok('shellBox null (bản vẽ không tường) → null', findMainDoor([doorMain], null) === null);
  ok('chỉ toàn door nội bộ (không door nào chạm biên) → null', findMainDoor([doorInteriorWide], shellBox) === null);
  void walls;
}

function testFurnitureStagger() {
  console.log('\n[5b] planDrawOn — đợt ③ so le theo khoảng cách tới cửa chính');
  const layers = [layer('l1')];
  const walls = roomWalls();
  const mainDoor = block('doorMain', 'l1', 'door', { x: 3000, y: 0 });
  // Thêm doc THEO THỨ TỰ f1,f2,f3 — nhưng khoảng cách tới cửa (3000,0) là f2 < f1 < f3, nên nếu
  // so le đúng, thứ tự OUTPUT phải là f2,f1,f3 (KHÁC thứ tự input — chứng minh có sắp lại thật,
  // không phải trùng hợp giữ nguyên thứ tự mảng gốc).
  const f1 = block('f1', 'l1', 'sofa2', { x: 5500, y: 3500 }); // xa cửa nhất trong 3 món (~4301mm)
  const f2 = block('f2', 'l1', 'coffeeTable', { x: 3200, y: 300 }); // gần cửa nhất (~360mm)
  const f3 = block('f3', 'l1', 'armchair', { x: 100, y: 3800 }); // xa nhất (~4780mm)

  const plan = planDrawOn(docOf([...walls, mainDoor, f1, f2, f3], layers));
  const furnitureGroup = plan.groups.find((g) => g.batch === 'furniture')!;
  ok(`thứ tự output = [f2,f1,f3] theo khoảng cách tăng dần tới cửa chính (được [${furnitureGroup.entityIds.join(',')}])`, furnitureGroup.entityIds.join(',') === 'f2,f1,f3');

  // ca fallback: KHÔNG có door nào → V1.1 rơi về V1 (giữ nguyên thứ tự mảng gốc f1,f2,f3)
  const planNoDoor = planDrawOn(docOf([...walls, f1, f2, f3], layers));
  const furnitureNoDoor = planNoDoor.groups.find((g) => g.batch === 'furniture')!;
  ok('không có cửa chính → rơi về V1 (giữ thứ tự mảng gốc f1,f2,f3)', furnitureNoDoor.entityIds.join(',') === 'f1,f2,f3');

  // đổi thứ tự KHÔNG đổi mốc thời gian đợt (vẫn 4 đợt, vẫn 9.5s tổng, chỉ đổi entity NÀO ở vị trí nào)
  ok('tổng thời lượng KHÔNG đổi dù so le nội thất', planDrawOn(docOf([...walls, mainDoor, f1, f2, f3], layers)).totalDurationSec === DRAW_ON_BATCH_DURATION_SEC.shell + DRAW_ON_BATCH_DURATION_SEC.openings + DRAW_ON_BATCH_DURATION_SEC.furniture + DRAW_ON_BATCH_DURATION_SEC.zones + DRAW_ON_BATCH_DURATION_SEC.annotations);
}

testClassify();
testPlanBasic();
testNoEntityDropped();
testMeasure2000();
testFindMainDoor();
testFurnitureStagger();

console.log(`\n${pass} ok, ${fail} fail`);
if (fail > 0) process.exit(1);
