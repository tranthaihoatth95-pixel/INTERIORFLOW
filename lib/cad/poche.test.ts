/**
 * lib/cad/poche.test.ts — A3 · G-M1-08 "poché neo vào đường bao". Chạy:
 *   node_modules/.bin/sucrase-node lib/cad/poche.test.ts
 *
 * Ca gốc tái hiện đúng số đo trong `docs/M2-OUT.md` §2: dời MỘT nửa của quad tường đi 450mm.
 * Trước A3 → hai nửa lệch 450mm (tường rách). Sau A3 → nửa kia đi theo, lệch 0.
 */
import { emptyDoc, type Doc, type Entity, type HatchEntity, type PolylineEntity, type Pt } from './model';
import { wallSegment, wallSegmentOutline } from './commands';
import {
  ringKey,
  sameRing,
  pochePartnerId,
  syncPocheAnchors,
  expandIdsWithPoche,
  propagatePocheEdits,
  findBrokenPocheePairs,
} from './poche';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean, extra?: string) {
  if (cond) {
    pass += 1;
    console.log(`  ok  - ${label}`);
  } else {
    fail += 1;
    console.log(`  FAIL - ${label}${extra ? ` :: ${extra}` : ''}`);
  }
}

const move = (pts: Pt[], dx: number, dy: number): Pt[] => pts.map((p) => ({ x: p.x + dx, y: p.y + dy }));
const get = (doc: Doc, id: string) => doc.entities.find((e) => e.id === id)!;
const pts = (doc: Doc, id: string) => (get(doc, id) as HatchEntity | PolylineEntity).points;

/** Tường 4m dày 200 — cặp hatch (poché) + polyline (đường bao) do lệnh WALL sinh. */
function wallDoc(): { doc: Doc; hatchId: string; outlineId: string } {
  const doc = emptyDoc();
  const [hatch, poly] = wallSegment({ x: 0, y: 0 }, { x: 4000, y: 0 }, 200, 'l-wall');
  doc.entities.push(hatch, poly);
  return { doc, hatchId: hatch.id, outlineId: poly.id };
}

/* ───────────────────────── [1] SINH RA ĐÃ NEO SẴN ───────────────────────── */
console.log('\n[1] wallSegment/wallSegmentOutline sinh cặp ĐÃ neo (không đợi reconcile)');
{
  const { doc, hatchId, outlineId } = wallDoc();
  ok('hatch.hostId trỏ đúng polyline đường bao', (get(doc, hatchId) as HatchEntity).hostId === outlineId);
  ok('polyline KHÔNG mang hostId (nó là CHỦ, không phải con)', (get(doc, outlineId) as PolylineEntity).hostId === undefined);
  ok('pochePartnerId(hatch) → outline', pochePartnerId(doc, hatchId) === outlineId);
  ok('pochePartnerId(outline) → hatch (tra được cả 2 chiều)', pochePartnerId(doc, outlineId) === hatchId);

  const [h2, p2] = wallSegmentOutline({ x: 0, y: 0 }, { x: 3000, y: 0 }, 220, 'l-wall', 'left');
  ok('wallSegmentOutline (mode Revit) cũng neo', (h2 as HatchEntity).hostId === p2.id);
  ok('wallSegmentOutline giữ nguyên elementType/wallThicknessMm cũ', h2.elementType === 'wall' && h2.wallThicknessMm === 220);
}

/* ───────────────────────── [2] DỜI MỘT NỬA — CA GỐC M2-OUT §2 ───────────────────────── */
console.log('\n[2] CA GỐC: dời MỘT nửa 450mm → nửa kia đi theo (trước A3 lệch 450mm)');
{
  const { doc, hatchId, outlineId } = wallDoc();
  const before = pts(doc, outlineId);

  // dời riêng POCHÉ 450mm theo Y (đúng kiểu người dùng chọn trúng mảng tô rồi kéo)
  const movedHatch = { ...(get(doc, hatchId) as HatchEntity), points: move(pts(doc, hatchId), 0, 450) } as Entity;
  const after = propagatePocheEdits({ ...doc, entities: doc.entities.map((e) => (e.id === hatchId ? movedHatch : e)) }, [hatchId]);

  ok('đường bao đã đi theo poché', sameRing(pts(after, hatchId), pts(after, outlineId)));
  ok('đường bao dịch đúng 450mm', Math.abs(pts(after, outlineId)[0].y - before[0].y - 450) < 1e-9);
  ok('không còn cặp rách nào', findBrokenPocheePairs(after).length === 0);

  // chiều ngược lại: dời riêng ĐƯỜNG BAO → poché đi theo
  const movedOutline = { ...(get(doc, outlineId) as PolylineEntity), points: move(pts(doc, outlineId), -300, 0) } as Entity;
  const after2 = propagatePocheEdits({ ...doc, entities: doc.entities.map((e) => (e.id === outlineId ? movedOutline : e)) }, [outlineId]);
  ok('dời đường bao → poché đi theo (neo 2 chiều)', sameRing(pts(after2, hatchId), pts(after2, outlineId)));
  ok('poché dịch đúng -300mm', Math.abs(pts(after2, hatchId)[0].x - pts(doc, hatchId)[0].x + 300) < 1e-9);
}

/* ───────────────────────── [3] SỬA CẢ CẶP → KHÔNG ĐÈ ───────────────────────── */
console.log('\n[3] sửa CẢ HAI nửa cùng lúc → propagate KHÔNG đụng (caller đã tự lo)');
{
  const { doc, hatchId, outlineId } = wallDoc();
  const nextH = { ...(get(doc, hatchId) as HatchEntity), points: move(pts(doc, hatchId), 100, 100) } as Entity;
  const nextP = { ...(get(doc, outlineId) as PolylineEntity), points: move(pts(doc, outlineId), 100, 100) } as Entity;
  const applied = { ...doc, entities: doc.entities.map((e) => (e.id === hatchId ? nextH : e.id === outlineId ? nextP : e)) };
  const after = propagatePocheEdits(applied, [hatchId, outlineId]);
  ok('trả về CHÍNH Doc đã áp (không sinh bản mới vô ích)', after === applied);
  ok('cả hai nửa đều ở vị trí mới', sameRing(pts(after, hatchId), pts(after, outlineId)) && pts(after, hatchId)[0].x === 100);
}

/* ───────────────────────── [4] NỞ TẬP ID (chọn / xoá) ───────────────────────── */
console.log('\n[4] expandIdsWithPoche — chọn/xoá một nửa là cầm cả hai');
{
  const { doc, hatchId, outlineId } = wallDoc();
  ok('chọn poché → ra 2 id', expandIdsWithPoche([hatchId], doc).size === 2);
  ok('chọn đường bao → ra 2 id', expandIdsWithPoche([outlineId], doc).size === 2);
  ok('id lạ giữ nguyên, không mất', expandIdsWithPoche(['khong-co-that'], doc).has('khong-co-that'));
  const both = expandIdsWithPoche([hatchId, outlineId], doc);
  ok('truyền sẵn cả 2 → vẫn đúng 2 (idempotent)', both.size === 2);
}

/* ───────────────────────── [5] RECONCILE — DỮ LIỆU CŨ ───────────────────────── */
console.log('\n[5] syncPocheAnchors — .idf/DXF CŨ không có hostId vẫn tự ghép lại');
{
  const { doc, hatchId, outlineId } = wallDoc();
  // giả lập dữ liệu cũ: gỡ hết hostId
  const legacy: Doc = {
    ...doc,
    entities: doc.entities.map((e) => {
      const { hostId: _d, ...rest } = e as Entity & { hostId?: string };
      return rest as Entity;
    }),
  };
  ok('dữ liệu cũ: chưa có liên kết nào', pochePartnerId(legacy, hatchId) === undefined);
  const fixed = syncPocheAnchors(legacy);
  ok('reconcile tự ghép lại đúng cặp', (get(fixed, hatchId) as HatchEntity).hostId === outlineId);
  ok('idempotent — gọi lần 2 trả CHÍNH Doc cũ', syncPocheAnchors(fixed) === fixed);

  // liên kết TRỎ HỤT (đường bao đã bị xoá bằng đường khác) → phải tự dọn
  const orphan: Doc = { ...doc, entities: doc.entities.filter((e) => e.id !== outlineId) };
  const cleaned = syncPocheAnchors(orphan);
  ok('hostId trỏ vào entity không còn → tự xoá, không giữ rác', (get(cleaned, hatchId) as HatchEntity).hostId === undefined);
}

/* ───────────────────────── [6] KHÔNG GHÉP BỪA ───────────────────────── */
console.log('\n[6] KHÔNG ghép nhầm — hatch vật liệu, cặp đã lệch, hai ứng viên mơ hồ');
{
  // hatch vật liệu giữa phòng, KHÔNG có polyline anh em
  const doc = emptyDoc();
  const mat: HatchEntity = {
    id: 'h-son', type: 'hatch', layer: 'l-hatch', pattern: 'ANSI31',
    points: [{ x: 0, y: 0 }, { x: 1000, y: 0 }, { x: 1000, y: 1000 }, { x: 0, y: 1000 }],
  } as HatchEntity;
  const other: PolylineEntity = {
    id: 'p-khac', type: 'polyline', layer: 'l-anno', closed: true,
    points: [{ x: 0, y: 0 }, { x: 1000, y: 0 }, { x: 1000, y: 1000 }, { x: 0, y: 1000 }],
  };
  doc.entities.push(mat, other);
  const r = syncPocheAnchors(doc);
  ok('trùng hình nhưng KHÁC layer ⇒ không ghép', (get(r, 'h-son') as HatchEntity).hostId === undefined);

  // hai polyline trùng khít cùng layer ⇒ mơ hồ, không đoán (K3)
  const doc2 = emptyDoc();
  const h: HatchEntity = { id: 'h1', type: 'hatch', layer: 'l-wall', solid: true, points: mat.points } as HatchEntity;
  doc2.entities.push(
    h,
    { id: 'pa', type: 'polyline', layer: 'l-wall', closed: true, points: mat.points },
    { id: 'pb', type: 'polyline', layer: 'l-wall', closed: true, points: mat.points },
  );
  ok('2 ứng viên trùng khít ⇒ KHÔNG neo (thà không biết còn hơn đoán)', (get(syncPocheAnchors(doc2), 'h1') as HatchEntity).hostId === undefined);

  // cặp ĐÃ lệch sẵn từ trước (bệnh cũ) ⇒ không ghép bừa
  const doc3 = emptyDoc();
  doc3.entities.push(
    { id: 'h2', type: 'hatch', layer: 'l-wall', solid: true, points: mat.points } as HatchEntity,
    { id: 'p2', type: 'polyline', layer: 'l-wall', closed: true, points: move(mat.points, 0, 450) },
  );
  ok('cặp cũ đã lệch 450mm ⇒ không ghép (đoán mò là kéo nhầm 2 mảng)', (get(syncPocheAnchors(doc3), 'h2') as HatchEntity).hostId === undefined);
}

/* ───────────────────────── [7] ringKey — bất biến điểm đầu / chiều quay ───────────────────────── */
console.log('\n[7] ringKey — cùng một vòng ghi theo thứ tự khác nhau vẫn là MỘT');
{
  const a: Pt[] = [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 50 }, { x: 0, y: 50 }];
  const rotated: Pt[] = [a[2], a[3], a[0], a[1]];
  const reversed = [...a].reverse();
  ok('xoay điểm bắt đầu ⇒ cùng khoá', ringKey(a) === ringKey(rotated));
  ok('đảo chiều quay ⇒ cùng khoá (DXF lật gương)', ringKey(a) === ringKey(reversed));
  ok('vòng khác ⇒ khoá khác', ringKey(a) !== ringKey(move(a, 1, 0)));
  ok('dưới 3 điểm ⇒ khoá rỗng, không bao giờ ghép', ringKey([{ x: 0, y: 0 }, { x: 1, y: 1 }]) === '');
  ok('sameRing khác số điểm ⇒ false', !sameRing(a, [...a, { x: 5, y: 5 }]));
}

/* ───────────────────────── [8] KHÔNG PHÁ hosting cửa/cửa sổ ───────────────────────── */
console.log('\n[8] hostId của BLOCK (cửa/cửa sổ) KHÔNG bị syncPocheAnchors đụng tới');
{
  const { doc, hatchId } = wallDoc();
  doc.entities.push({ id: 'b-cua', type: 'block', layer: 'l-furniture', block: 'door', at: { x: 1000, y: 0 }, rot: 0, sx: 1, sy: 1, hostId: hatchId } as Entity);
  const r = syncPocheAnchors(doc);
  const b = get(r, 'b-cua') as Entity & { hostId?: string };
  ok('block giữ nguyên hostId trỏ tường', b.hostId === hatchId);
}

console.log(`\n${fail === 0 ? 'PASS' : 'FAIL'} — ${pass} ok, ${fail} fail`);
if (fail) process.exit(1);
