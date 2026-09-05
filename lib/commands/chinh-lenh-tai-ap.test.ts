/**
 * lib/commands/chinh-lenh-tai-ap.test.ts — chạy: node_modules/.bin/sucrase-node lib/commands/chinh-lenh-tai-ap.test.ts
 * Kế hoạch tái áp với hình học THẬT (wallChain · offsetEntity · rotateEntity · hosting) + store THẬT
 * (`replaceEntities`): đổi dày tường không mất đoạn nào · có cửa thì từ chối · offset thay đúng bản
 * đã sinh · xoay từ gốc không cộng dồn · mỗi lần tái áp = 1 nấc undo, undo về đúng bản trước.
 */
import { taiApOffset, taiApTuong, taiApXoay } from './chinh-lenh-tai-ap';
import { wallChain } from '../cad/commands';
import { emptyDoc, type Entity, type LineEntity } from '../cad/model';
import { WALL_LAYER_ID } from '../cad/shape-interactions';
import { useCadStore } from '../cad/store';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}
const near = (a: number, b: number, eps = 1e-6) => Math.abs(a - b) < eps;

console.log('\n[1] Tường — dựng lại chuỗi, không mất đoạn');
{
  const pts = [{ x: 0, y: 0 }, { x: 3000, y: 0 }, { x: 3000, y: 2000 }];
  const es = wallChain(pts, 200, WALL_LAYER_ID, false);
  const doc = { ...emptyDoc(), entities: es };
  const ctx = { pts, closed: false, layer: WALL_LAYER_ID, createdIds: es.map((e) => e.id) };
  const plan = taiApTuong(doc, ctx, { kind: 'tuong', thicknessMm: 110, closed: false, segmentCount: 2 });
  ok('kế hoạch = replace', plan.ok && plan.kieu === 'replace');
  if (plan.ok && plan.kieu === 'replace') {
    ok('gỡ đúng các id đã sinh (không hơn không kém)', plan.removeIds.length === es.length && plan.removeIds.every((id) => ctx.createdIds.includes(id)));
    ok('số entity mới = số cũ (2 đoạn × hatch+polyline)', plan.add.length === es.length && es.length === 4);
    const hatch = plan.add.find((e) => e.type === 'hatch');
    const w = hatch && hatch.type === 'hatch' ? Math.abs(hatch.points[0].y - hatch.points[3].y) : NaN;
    ok('bề dày mới = 110 (đo cạnh ngang đoạn đầu)', near(w, 110));
    ok('kín giữ kín / hở giữ hở', plan.add.filter((e) => e.type === 'polyline').every((e) => e.type === 'polyline' && e.closed === true));
  }
  ok('sai lệnh → từ chối', !taiApTuong(doc, ctx, { kind: 'xoay', angleDeg: 1 }).ok);

  // Có cửa bám tường → từ chối, không xoá cửa.
  const door: Entity = { id: 'cua1', type: 'block', layer: 'l-arch', block: 'door', at: { x: 1500, y: 0 }, rot: 0, sx: 1, sy: 1 };
  const docCoCua = { ...doc, entities: [...es, door] };
  const tuChoi = taiApTuong(docCoCua, ctx, { kind: 'tuong', thicknessMm: 110, closed: false, segmentCount: 2 });
  ok('tường có cửa → từ chối kèm lý do', !tuChoi.ok && tuChoi.lyDo[0].includes('cửa'));

  // Tường kín: 3 điểm → 3 đoạn.
  const kin = wallChain(pts, 200, WALL_LAYER_ID, true);
  const planKin = taiApTuong({ ...doc, entities: kin }, { ...ctx, closed: true, createdIds: kin.map((e) => e.id) }, { kind: 'tuong', thicknessMm: 90, closed: true, segmentCount: 3 });
  ok('tường kín dựng lại đủ 3 đoạn', planKin.ok && planKin.kieu === 'replace' && planKin.add.length === 6);
}

console.log('\n[2] Tường qua store THẬT — 1 undo/lần, undo về đúng bản trước');
{
  const st = useCadStore.getState();
  st.reset();
  const pts = [{ x: 0, y: 0 }, { x: 4000, y: 0 }];
  const es = wallChain(pts, 200, WALL_LAYER_ID, false);
  useCadStore.getState().addEntities(es);
  const n0 = useCadStore.getState().doc.entities.length;
  const pastAfterAdd = useCadStore.getState().past.length;
  const ctx = { pts, closed: false, layer: WALL_LAYER_ID, createdIds: es.map((e) => e.id) };
  const p1 = taiApTuong(useCadStore.getState().doc, ctx, { kind: 'tuong', thicknessMm: 150, closed: false, segmentCount: 1 });
  if (p1.ok && p1.kieu === 'replace') {
    useCadStore.getState().replaceEntities(p1.removeIds, p1.add);
    const s1 = useCadStore.getState();
    ok('số entity không đổi sau tái áp', s1.doc.entities.length === n0);
    ok('id cũ đã gỡ, id mới có mặt', !s1.doc.entities.some((e) => ctx.createdIds.includes(e.id)) && p1.add.every((a) => s1.doc.entities.some((e) => e.id === a.id)));
    ok('đúng 1 nấc undo thêm', s1.past.length === pastAfterAdd + 1);
    const ctx2 = { ...ctx, createdIds: p1.add.map((e) => e.id) };
    const p2 = taiApTuong(s1.doc, ctx2, { kind: 'tuong', thicknessMm: 300, closed: false, segmentCount: 1 });
    if (p2.ok && p2.kieu === 'replace') useCadStore.getState().replaceEntities(p2.removeIds, p2.add);
    const s2 = useCadStore.getState();
    const hatch2 = s2.doc.entities.find((e) => e.type === 'hatch');
    ok('lần 2 đổi 300 → đo được 300 (từ điểm gốc, không cộng dồn)', hatch2?.type === 'hatch' && near(Math.abs(hatch2.points[0].y - hatch2.points[3].y), 300));
    useCadStore.getState().undo();
    const h1 = useCadStore.getState().doc.entities.find((e) => e.type === 'hatch');
    ok('undo 1 lần → về bản 150', h1?.type === 'hatch' && near(Math.abs(h1.points[0].y - h1.points[3].y), 150));
    useCadStore.getState().undo();
    const h0 = useCadStore.getState().doc.entities.find((e) => e.type === 'hatch');
    ok('undo 2 lần → về bản 200 gốc', h0?.type === 'hatch' && near(Math.abs(h0.points[0].y - h0.points[3].y), 200));
  } else ok('kế hoạch tường qua store thất bại', false);
  useCadStore.getState().reset();
}

console.log('\n[3] Offset');
{
  const src: LineEntity = { id: 'src', type: 'line', layer: 'l-wall', a: { x: 0, y: 0 }, b: { x: 1000, y: 0 } };
  const cu: LineEntity = { id: 'cu', type: 'line', layer: 'l-wall', a: { x: 0, y: 120 }, b: { x: 1000, y: 120 } };
  const doc = { ...emptyDoc(), entities: [src, cu] };
  const ctx = { sourceId: 'src', side: { x: 500, y: 500 }, createdId: 'cu' };
  const plan = taiApOffset(doc, ctx, { kind: 'offset', distMm: 150 });
  ok('kế hoạch = replace bản cũ', plan.ok && plan.kieu === 'replace' && plan.removeIds[0] === 'cu' && plan.add.length === 1);
  if (plan.ok && plan.kieu === 'replace') {
    const l = plan.add[0];
    ok('bản mới cách gốc 150 về phía đã click', l.type === 'line' && near(l.a.y, 150) && near(l.b.y, 150));
    ok('không đụng entity gốc', plan.add[0].id !== 'src');
  }
  ok('gốc bị xoá → từ chối kèm lý do', !taiApOffset({ ...doc, entities: [cu] }, ctx, { kind: 'offset', distMm: 150 }).ok);
  ok('sai lệnh → từ chối', !taiApOffset(doc, ctx, { kind: 'doi', stepMm: 1, baseSpanMm: 1 }).ok);
}

console.log('\n[4] Xoay');
{
  const orig: LineEntity = { id: 'l', type: 'line', layer: 'l-wall', a: { x: 0, y: 0 }, b: { x: 100, y: 0 } };
  const ctx = { originals: [orig], center: { x: 0, y: 0 } };
  const p90 = taiApXoay(ctx, { kind: 'xoay', angleDeg: 90 });
  ok('90° → b nằm trên trục y, cách 100', p90.ok && p90.kieu === 'update' && p90.entities[0].type === 'line' && near(Math.abs(p90.entities[0].b.x), 0) && near(Math.abs(p90.entities[0].b.y), 100));
  const p180 = taiApXoay(ctx, { kind: 'xoay', angleDeg: 180 });
  ok('180° tính từ GỐC (không cộng dồn lên 90°)', p180.ok && p180.kieu === 'update' && p180.entities[0].type === 'line' && near(p180.entities[0].b.x, -100) && near(Math.abs(p180.entities[0].b.y), 0));
  ok('gốc không bị đột biến', orig.b.x === 100 && orig.b.y === 0);
  ok('sai lệnh → từ chối', !taiApXoay(ctx, { kind: 'offset', distMm: 1 }).ok);
}

console.log(`\n${pass} pass, ${fail} fail`);
if (fail) process.exit(1);
