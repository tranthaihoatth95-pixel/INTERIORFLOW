/**
 * lib/cad/standards/wall-type.test.ts — kiểm `wallKind`/`wallStructural`/`wallThicknessMm`
 * persisted trên Base (T2, Semantic Room sprint — sibling của room-type.test.ts/T1). Chạy:
 *   node_modules/.bin/sucrase-node lib/cad/standards/wall-type.test.ts
 *
 * 3 mảng test theo acceptance criteria của task:
 *  1. Entity wall-like đã gán wallKind → wallKindSummary() đếm ĐÚNG (round-trip đơn giản, cùng
 *     lúc chứng minh isWallLikeEntity() nhận diện đúng CẢ 3 kiểu entity: line/polyline-l-wall/
 *     hatch-l-wall — và LOẠI những entity KHÔNG wall-like dù cùng type, VD hatch màu vật liệu
 *     không nằm trên layer tường).
 *  2. Doc kiểu cũ (tường không có wallKind) → wallKindSummary() báo TOÀN BỘ là 'unclassified',
 *     TUYỆT ĐỐI KHÔNG tự suy đoán thành 'interior' — đây là hành vi "không đoán mò" cốt lõi,
 *     khác hẳn cách T1 backfill roomType từ text (ở đây KHÔNG có backfill tương đương vì không
 *     có tín hiệu hình học đáng tin cậy để suy luận tường ngoài/vách ngăn).
 *  3. Doc trộn: một phần exterior, một phần interior, một phần chưa gán — đếm CHÍNH XÁC cả 3.
 */
import { wallKindSummary, isWallLikeEntity } from './checker';
import { emptyDoc, WALL_KIND_OPTIONS } from '../model';
import type { Doc, LineEntity, PolylineEntity, HatchEntity, TextEntity } from '../model';
import { newId } from '../store';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

const WALL_LAYER = 'l-wall';

function wallLine(a: { x: number; y: number }, b: { x: number; y: number }, extra: Partial<LineEntity> = {}): LineEntity {
  return { id: newId('e'), type: 'line', layer: WALL_LAYER, a, b, ...extra };
}
function wallPolyline(points: { x: number; y: number }[], layer = WALL_LAYER, extra: Partial<PolylineEntity> = {}): PolylineEntity {
  return { id: newId('e'), type: 'polyline', layer, points, closed: true, ...extra };
}
function wallHatch(points: { x: number; y: number }[], layer = WALL_LAYER, extra: Partial<HatchEntity> = {}): HatchEntity {
  return { id: newId('e'), type: 'hatch', layer, points, solid: true, ...extra };
}
function label(at: { x: number; y: number }, text: string): TextEntity {
  return { id: newId('e'), type: 'text', layer: 'l-text', at, text, h: 200 };
}

function testClassifiedWallCountsCorrectly() {
  console.log('\n[1] wallKind đã gán → wallKindSummary() đếm đúng + isWallLikeEntity() phân biệt đúng type/layer');
  const doc: Doc = emptyDoc();

  const extLine = wallLine({ x: 0, y: 0 }, { x: 5000, y: 0 }, { wallKind: 'exterior', wallStructural: true, wallThicknessMm: 220 });
  const intPolyline = wallPolyline([{ x: 0, y: 0 }, { x: 1000, y: 0 }, { x: 1000, y: 100 }, { x: 0, y: 100 }], WALL_LAYER, { wallKind: 'interior', wallThicknessMm: 100 });
  const intHatch = wallHatch([{ x: 0, y: 0 }, { x: 1000, y: 0 }, { x: 1000, y: 100 }, { x: 0, y: 100 }], WALL_LAYER, { wallKind: 'interior' });
  // Đối chứng: hatch CÙNG hình dạng nhưng KHÔNG nằm trên layer tường (VD vùng tô vật liệu sàn) —
  // isWallLikeEntity() PHẢI loại, dù type === 'hatch' giống hệt intHatch ở trên.
  const materialHatch = wallHatch([{ x: 2000, y: 0 }, { x: 3000, y: 0 }, { x: 3000, y: 1000 }, { x: 2000, y: 1000 }], 'l-material', { wallKind: 'interior' });
  // Đối chứng: polyline KHÔNG trên layer tường (VD đường bao zone) — cũng phải bị loại.
  const nonWallPolyline = wallPolyline([{ x: 0, y: 0 }, { x: 200, y: 0 }, { x: 200, y: 200 }], 'l-furniture', { wallKind: 'exterior' });

  doc.entities.push(extLine, intPolyline, intHatch, materialHatch, nonWallPolyline, label({ x: 500, y: 500 }, 'PHÒNG KHÁCH'));

  ok('LineEntity trên bất kỳ layer nào → wall-like', isWallLikeEntity(extLine));
  ok('PolylineEntity trên layer tường → wall-like', isWallLikeEntity(intPolyline));
  ok('HatchEntity trên layer tường → wall-like', isWallLikeEntity(intHatch));
  ok('HatchEntity KHÔNG trên layer tường → KHÔNG wall-like (dù cùng type)', !isWallLikeEntity(materialHatch));
  ok('PolylineEntity KHÔNG trên layer tường → KHÔNG wall-like', !isWallLikeEntity(nonWallPolyline));
  ok('TextEntity không bao giờ wall-like', !isWallLikeEntity(label({ x: 0, y: 0 }, 'X')));

  const summary = wallKindSummary(doc);
  ok('đếm đúng 1 tường ngoài', summary.exterior === 1);
  ok('đếm đúng 2 vách ngăn (polyline + hatch cùng layer tường)', summary.interior === 2);
  ok('không đếm 2 entity KHÔNG wall-like (materialHatch/nonWallPolyline) dù chúng có wallKind', summary.exterior + summary.interior === 3);
  ok('unclassified = 0 (mọi entity wall-like trong doc này đều đã gán)', summary.unclassified === 0);
}

function testOldDocReportsUnclassifiedNotInterior() {
  console.log('\n[2] doc cũ KHÔNG có wallKind → wallKindSummary() báo unclassified, KHÔNG suy đoán thành interior');
  const doc: Doc = emptyDoc();
  // 4 cạnh tường của 1 phòng vẽ bằng LINE đơn (kiểu cũ, giống test T1 rectWalls) — không set
  // wallKind cho bất kỳ cạnh nào, mô phỏng dữ liệu trước khi field này tồn tại.
  const p = [{ x: 0, y: 0 }, { x: 4000, y: 0 }, { x: 4000, y: 3000 }, { x: 0, y: 3000 }];
  for (let i = 0; i < 4; i++) doc.entities.push(wallLine(p[i], p[(i + 1) % 4]));
  doc.entities.push(label({ x: 2000, y: 1500 }, 'PHÒNG NGỦ'));

  const summary = wallKindSummary(doc);
  ok('cả 4 cạnh tường đều unclassified', summary.unclassified === 4);
  ok('exterior = 0 — KHÔNG tự suy đoán bất kỳ cạnh nào là tường ngoài', summary.exterior === 0);
  ok('interior = 0 — KHÔNG tự suy đoán mặc định là vách ngăn (đây là điểm mấu chốt: undefined ≠ interior)', summary.interior === 0);
}

function testMixedDocCountsExactly() {
  console.log('\n[3] doc trộn exterior/interior/chưa phân loại → đếm chính xác cả 3');
  const doc: Doc = emptyDoc();
  // 2 tường ngoài (bao nhà), 1 vách ngăn nội bộ, 1 tường chưa ai phân loại.
  doc.entities.push(
    wallLine({ x: 0, y: 0 }, { x: 6000, y: 0 }, { wallKind: 'exterior' }),
    wallLine({ x: 6000, y: 0 }, { x: 6000, y: 4000 }, { wallKind: 'exterior' }),
    wallLine({ x: 3000, y: 0 }, { x: 3000, y: 4000 }, { wallKind: 'interior', wallStructural: false }),
    wallLine({ x: 0, y: 0 }, { x: 0, y: 4000 }), // chưa gán
  );
  const summary = wallKindSummary(doc);
  ok('exterior = 2', summary.exterior === 2);
  ok('interior = 1', summary.interior === 1);
  ok('unclassified = 1', summary.unclassified === 1);
  ok('tổng đúng bằng số entity wall-like trong doc (4)', summary.exterior + summary.interior + summary.unclassified === 4);

  // WALL_KIND_OPTIONS có đúng 2 giá trị (exterior/interior) — chốt danh mục UI khớp WallKind.
  ok('WALL_KIND_OPTIONS có đúng 2 lựa chọn (exterior, interior)', WALL_KIND_OPTIONS.length === 2);
  ok('WALL_KIND_OPTIONS chứa exterior', WALL_KIND_OPTIONS.some((o) => o.value === 'exterior'));
  ok('WALL_KIND_OPTIONS chứa interior', WALL_KIND_OPTIONS.some((o) => o.value === 'interior'));
}

testClassifiedWallCountsCorrectly();
testOldDocReportsUnclassifiedNotInterior();
testMixedDocCountsExactly();

console.log(`\n${pass} ok, ${fail} fail`);
if (fail > 0) process.exit(1);
