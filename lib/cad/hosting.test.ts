/**
 * lib/cad/hosting.test.ts — "cửa/cửa sổ hosted" (SO-KIEM-TONG §7). Chạy:
 *   node_modules/.bin/sucrase-node lib/cad/hosting.test.ts
 */
import { emptyDoc, type Doc, type Entity, type BlockEntity } from './model';
import { wallSegment } from './commands';
import {
  isHostableBlock,
  inferWallHost,
  estimateWallThicknessMm,
  buildOpeningCutter,
  syncHostedOpenings,
  expandDeleteWithHostedChildren,
  openingCutterId,
  OPENING_CUTTER_PREFIX,
} from './hosting';

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

/** tường 4m dày 200, tim y=0, dọc trục X (0,0)→(4000,0) — thickness = trục Y ∈[-100,100]. */
function wallDoc(): { doc: Doc; wallId: string } {
  const doc = emptyDoc();
  const [hatch, poly] = wallSegment({ x: 0, y: 0 }, { x: 4000, y: 0 }, 200, 'l-wall');
  doc.entities.push(hatch, poly);
  return { doc, wallId: hatch.id };
}

function doorBlock(id: string, at: { x: number; y: number }, rot = 0): BlockEntity {
  return { id, type: 'block', layer: 'l-furniture', block: 'door', at, rot, sx: 1, sy: 1 };
}
function windowBlock(id: string, at: { x: number; y: number }, rot = 0): BlockEntity {
  return { id, type: 'block', layer: 'l-furniture', block: 'window', at, rot, sx: 1, sy: 1 };
}

/* ── 1) isHostableBlock ── */
function testIsHostableBlock() {
  console.log('\n[1] isHostableBlock — đúng 9 block cửa/cửa sổ, KHÔNG phải nội thất thường');
  ok("'door' → 'door'", isHostableBlock('door') === 'door');
  ok("'doubleDoor' → 'door'", isHostableBlock('doubleDoor') === 'door');
  ok("'slidingWindow' → 'window'", isHostableBlock('slidingWindow') === 'window');
  ok("'sofa2' → undefined", isHostableBlock('sofa2') === undefined);
}

/* ── 2) inferWallHost ── */
function testInferWallHost() {
  console.log('\n[2] inferWallHost — điểm trong dải bề dày tường → đúng id tường; ngoài → undefined');
  const { doc, wallId } = wallDoc();
  ok('điểm giữa tường (2000,0) → đúng wallId', inferWallHost({ x: 2000, y: 0 }, doc) === wallId);
  ok('điểm cách xa tường (2000,5000) → undefined', inferWallHost({ x: 2000, y: 5000 }, doc) === undefined);
}

/* ── 3) estimateWallThicknessMm ── */
function testEstimateThickness() {
  console.log('\n[3] estimateWallThicknessMm — suy đúng bề dày 200 từ hình học poché');
  const { doc } = wallDoc();
  const wall = doc.entities.find((e) => e.type === 'hatch')!;
  ok('bề dày ≈ 200', Math.abs(estimateWallThicknessMm((wall as { points: { x: number; y: number }[] }).points) - 200) < 1e-6);
}

/* ── 4) buildOpeningCutter ── */
function testBuildOpeningCutter() {
  console.log('\n[4] buildOpeningCutter — polyline đóng kín, elevation/height đúng theo loại');
  const { doc } = wallDoc();
  const wall = doc.entities.find((e) => e.type === 'hatch') as Extract<Entity, { type: 'hatch' }>;
  const door = doorBlock('door-1', { x: 2000, y: 0 });
  const cutter = buildOpeningCutter(door, wall, 'door');
  ok('id mang tiền tố opening-', cutter.id === openingCutterId('door-1') && cutter.id.startsWith(OPENING_CUTTER_PREFIX));
  ok('type polyline, đóng kín, 4 điểm', cutter.type === 'polyline' && (cutter as { closed: boolean }).closed === true && (cutter as { points: unknown[] }).points.length === 4);
  ok('cửa: elevationMm=0, heightMm=2100', cutter.elevationMm === 0 && cutter.heightMm === 2100);

  const win = windowBlock('win-1', { x: 1000, y: 0 });
  const cutterWin = buildOpeningCutter(win, wall, 'window');
  ok('cửa sổ: elevationMm=900, heightMm=1200 (đỉnh 2100 − bệ 900)', cutterWin.elevationMm === 900 && cutterWin.heightMm === 1200);
}

/* ── 5) syncHostedOpenings ── */
function testSyncBasic() {
  console.log('\n[5] syncHostedOpenings — đặt cửa lên tường: hostId + wall.ops + cutter đều đúng, MỘT lần');
  const { doc, wallId } = wallDoc();
  doc.entities.push(doorBlock('door-1', { x: 2000, y: 0 }));
  const synced = syncHostedOpenings(doc);
  const block = synced.entities.find((e) => e.id === 'door-1') as BlockEntity;
  const wall = synced.entities.find((e) => e.id === wallId)!;
  const cutterId = openingCutterId('door-1');
  const cutter = synced.entities.find((e) => e.id === cutterId);
  ok('block.hostId = đúng tường', block.hostId === wallId);
  ok('wall.ops có đúng 1 bậc boolean subtract trỏ cutter', (wall.ops ?? []).length === 1 && wall.ops![0].op === 'boolean' && (wall.ops![0] as { withRef: string }).withRef === cutterId);
  ok('cutter entity tồn tại trong Doc', !!cutter);

  const syncedAgain = syncHostedOpenings(synced);
  ok('gọi lại lần 2 KHÔNG đổi số entity (idempotent)', syncedAgain.entities.length === synced.entities.length);
  const wall2 = syncedAgain.entities.find((e) => e.id === wallId)!;
  ok('gọi lại lần 2 vẫn đúng 1 op (không nhân đôi)', (wall2.ops ?? []).length === 1);
}

function testSyncMoveOffWall() {
  console.log('\n[6] syncHostedOpenings — kéo cửa RA KHỎI tường: hostId/cutter/op tự dọn sạch');
  const { doc, wallId } = wallDoc();
  doc.entities.push(doorBlock('door-1', { x: 2000, y: 0 }));
  const synced1 = syncHostedOpenings(doc);
  const moved = {
    ...synced1,
    entities: synced1.entities.map((e) => (e.id === 'door-1' ? { ...(e as BlockEntity), at: { x: 2000, y: 9000 } } : e)),
  };
  const synced2 = syncHostedOpenings(moved);
  const block = synced2.entities.find((e) => e.id === 'door-1') as BlockEntity;
  const wall = synced2.entities.find((e) => e.id === wallId)!;
  const cutter = synced2.entities.find((e) => e.id === openingCutterId('door-1'));
  ok('hostId bị xoá', block.hostId === undefined);
  ok('wall.ops rỗng trở lại (field bị bỏ hẳn)', wall.ops === undefined);
  ok('cutter mồ côi bị xoá khỏi Doc', !cutter);
}

function testSyncKeepsManualCutter() {
  console.log('\n[7] syncHostedOpenings — KHÔNG đụng cutter tay "Khoét hốc" (tiền tố khác)');
  const { doc, wallId } = wallDoc();
  const wallIdx = doc.entities.findIndex((e) => e.id === wallId);
  const manualCutter: Entity = { id: 'cutter-manual-1', type: 'rect', layer: 'l-wall', x: 3000, y: -100, w: 300, h: 200, heightMm: 1200 };
  doc.entities[wallIdx] = {
    ...doc.entities[wallIdx],
    ops: [{ op: 'boolean', kind: 'subtract', withRef: 'cutter-manual-1' }],
  };
  doc.entities.push(manualCutter, doorBlock('door-1', { x: 1000, y: 0 }));
  const synced = syncHostedOpenings(doc);
  const wall = synced.entities.find((e) => e.id === wallId)!;
  const ops = wall.ops ?? [];
  ok('wall.ops có ĐỦ 2 bậc (tay + managed)', ops.length === 2);
  ok('op tay (withRef=cutter-manual-1) còn nguyên', ops.some((op) => op.op === 'boolean' && (op as { withRef: string }).withRef === 'cutter-manual-1'));
  ok('cutter tay vẫn còn trong Doc, không bị đổi', !!synced.entities.find((e) => e.id === 'cutter-manual-1' && e.type === 'rect' && e.x === 3000));
}

/* ── 8) expandDeleteWithHostedChildren ── */
function testExpandDelete() {
  console.log('\n[8] expandDeleteWithHostedChildren — xoá tường kéo theo đúng cửa + cutter con');
  const { doc, wallId } = wallDoc();
  doc.entities.push(doorBlock('door-1', { x: 2000, y: 0 }), windowBlock('win-1', { x: 5000, y: 5000 })); // win-1 không host (xa tường)
  const synced = syncHostedOpenings(doc);
  const expanded = expandDeleteWithHostedChildren([wallId], synced);
  ok('gồm chính tường', expanded.has(wallId));
  ok('gồm cửa con', expanded.has('door-1'));
  ok('gồm cutter của cửa', expanded.has(openingCutterId('door-1')));
  ok('KHÔNG đụng cửa sổ không liên quan', !expanded.has('win-1'));
  ok('tổng đúng 3 id (tường + cửa + cutter)', expanded.size === 3);
}

function testExpandDeleteUnrelated() {
  console.log('\n[9] expandDeleteWithHostedChildren — xoá id không phải tường thì không mở rộng gì thêm');
  const { doc } = wallDoc();
  doc.entities.push(doorBlock('door-1', { x: 2000, y: 0 }));
  const synced = syncHostedOpenings(doc);
  const expanded = expandDeleteWithHostedChildren(['door-1'], synced);
  ok('chỉ còn đúng id đã truyền vào (xoá cửa không kéo theo gì)', expanded.size === 1 && expanded.has('door-1'));
}

testIsHostableBlock();
testInferWallHost();
testEstimateThickness();
testBuildOpeningCutter();
testSyncBasic();
testSyncMoveOffWall();
testSyncKeepsManualCutter();
testExpandDelete();
testExpandDeleteUnrelated();

console.log(`\n${pass} ok, ${fail} fail`);
if (fail > 0) process.exit(1);
