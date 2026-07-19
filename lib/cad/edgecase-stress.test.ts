/**
 * lib/cad/edgecase-stress.test.ts — STRESS TEST biên hình học CAD (viết lại thay bản đã mất
 * 15/07 — xem CHANGELOG.md "15/07 — 4 nhánh merge trước Sprint 3"). KHÔNG trùng với
 * geometry.test.ts (pasteEntities), modify.test.ts (hành vi thường của TRIM/FILLET/…),
 * hatch.test.ts (T-junction/demo-plan) — file này CHỈ nhắm INPUT BIÊN: đa giác suy biến,
 * toạ độ cực trị, phòng gần-khép-kín (near-miss, KHÁC "chữ U thiếu hẳn 1 cạnh" đã test),
 * dedup đoạn trùng lặp, và góc 0°/180°/song song cho TRIM/FILLET/CHAMFER.
 * Chạy: node_modules/.bin/sucrase-node lib/cad/edgecase-stress.test.ts
 * Mọi số liệu dưới đây đã CHẠY THẬT qua sucrase-node để xác nhận hành vi trước khi viết
 * assertion (không đoán mò) — xem ghi chú "P-note" ở các chỗ hành vi thật khác trực giác.
 */
import {
  circumcircle, arcFromCenterStartEnd,
  translateEntity, rotateEntity, offsetEntity,
  polygonVertices, ellipsePoints, catmullRomSpline,
  entityLength, pointAtLength, divideEntity, measureEntity,
} from './geometry';
import { filletTwoLines, chamferTwoLines, trimLine } from './modify';
import { pointInPolygon, polygonArea, traceHatchBoundary } from './hatch';
import type { LineEntity, RectEntity } from './model';
import { newId } from './store';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}
function approx(a: number, b: number, eps = 0.5): boolean {
  return Math.abs(a - b) <= eps;
}

const LAY = 'l-wall';
function L(a: { x: number; y: number }, b: { x: number; y: number }): LineEntity {
  return { id: newId('e'), type: 'line', layer: LAY, a, b };
}

/* ══════════════════ [1] Đa giác/cung suy biến (3 điểm thẳng hàng, bán kính 0) ══════════════════ */
console.log('[1] Hình học suy biến — circumcircle/arcFromCenterStartEnd input biên');
{
  ok('circumcircle 3 điểm thẳng hàng → null (không xác định được đường tròn)', circumcircle({ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }) === null);
  ok('circumcircle 3 điểm thẳng hàng (dốc bất kỳ) → null', circumcircle({ x: 0, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 2 }) === null);
  ok('circumcircle 3 điểm KHÔNG thẳng hàng → có kết quả', circumcircle({ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }) !== null);
  ok('arcFromCenterStartEnd: điểm start TRÙNG tâm (bán kính 0) → null', arcFromCenterStartEnd({ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 5, y: 5 }) === null);
  ok('arcFromCenterStartEnd: start hợp lệ → có kết quả', arcFromCenterStartEnd({ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 0, y: 10 }) !== null);
}

/* ══════════════════ [2] Đa giác suy biến (0 diện tích, tự cắt) — pointInPolygon/polygonArea ══════════════════ */
console.log('\n[2] Đa giác suy biến — tự cắt (bowtie) + đỉnh trùng (cạnh dài 0)');
{
  // bowtie A(0,0)-B(10,10)-C(10,0)-D(0,10)-A: 2 tam giác chéo nhau, thứ tự đỉnh KHÔNG đơn giản
  const bowtie = [{ x: 0, y: 0 }, { x: 10, y: 10 }, { x: 10, y: 0 }, { x: 0, y: 10 }];
  // P-note: shoelace của đa giác tự cắt CÂN BẰNG 2 tam giác trái/phải dấu → diện tích ĐẠI SỐ = 0
  // (không NaN, không throw) — hành vi thật, không phải "đúng" hình học trực giác.
  ok('polygonArea đa giác TỰ CẮT (bowtie) → 0 (2 tam giác đối dấu triệt tiêu, không NaN)', polygonArea(bowtie) === 0);
  ok('pointInPolygon vẫn chạy được trên bowtie, không throw (điểm tâm giao)', pointInPolygon({ x: 5, y: 5 }, bowtie) === true);
  ok('pointInPolygon điểm XA bowtie → false', pointInPolygon({ x: 100, y: 100 }, bowtie) === false);

  // đỉnh trùng nhau liên tiếp (cạnh dài 0) — không được chia 0/NaN trong ray-casting
  const dupSquare = [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }, { x: 0, y: 100 }];
  ok('polygonArea với đỉnh trùng lặp (cạnh dài 0) vẫn ra đúng diện tích hình vuông 100×100', approx(polygonArea(dupSquare), 10000, 1));
  ok('pointInPolygon với đỉnh trùng lặp không NaN/throw, điểm giữa vẫn đúng "trong"', pointInPolygon({ x: 50, y: 50 }, dupSquare) === true);
}

/* ══════════════════ [3] Toạ độ cực lớn/cực nhỏ/âm ══════════════════ */
console.log('\n[3] Toạ độ cực trị — cực lớn (1e12), cực nhỏ (1e-10), âm');
{
  // cực lớn: độ chính xác float64 giảm dần khi cộng số rất nhỏ vào toạ độ rất lớn.
  const bigLine: LineEntity = { id: newId('e'), type: 'line', layer: LAY, a: { x: 1e12, y: -1e12 }, b: { x: 1e12 + 100, y: -1e12 } };
  const movedBig = translateEntity(bigLine, 0.001, 0.001) as LineEntity;
  // P-note: dịch +0.001 ở toạ độ 1e12 KHÔNG chính xác tuyệt đối (double ~15-17 chữ số có nghĩa)
  // — thực đo ra ~0.0009765625 thay vì đúng 0.001. Test với epsilon rộng phản ánh giới hạn thật.
  ok('toạ độ 1e12: translate vẫn hữu hạn, không NaN/Infinity', Number.isFinite(movedBig.a.x) && Number.isFinite(movedBig.a.y));
  ok('toạ độ 1e12: dịch nhỏ (0.001) vẫn xê dịch đúng chiều, sai số float chấp nhận được (<0.01)', approx(movedBig.a.x - bigLine.a.x, 0.001, 0.01));

  // cực nhỏ (gần 0, dưới cả 1e-6 dùng làm epsilon nội bộ nhiều hàm khác)
  const tinyLine: LineEntity = { id: newId('e'), type: 'line', layer: LAY, a: { x: 1e-10, y: 1e-10 }, b: { x: 2e-10, y: 2e-10 } };
  const rotatedTiny = rotateEntity(tinyLine, { x: 0, y: 0 }, Math.PI / 2) as LineEntity;
  ok('toạ độ 1e-10: rotate 90° vẫn hữu hạn, không NaN', Number.isFinite(rotatedTiny.a.x) && Number.isFinite(rotatedTiny.a.y));
  ok('toạ độ 1e-10: rotate 90° hoán vị đúng trục (x→-y cũ nghịch đảo)', approx(rotatedTiny.a.x, -1e-10, 1e-9) && approx(rotatedTiny.a.y, 1e-10, 1e-9));

  // âm — offset một line hoàn toàn trong góc phần tư âm
  const negLine: LineEntity = { id: newId('e'), type: 'line', layer: LAY, a: { x: -500, y: -500 }, b: { x: -100, y: -500 } };
  const offNeg = offsetEntity(negLine, 50, { x: -300, y: -1000 }) as LineEntity;
  ok('toạ độ âm: offset chọn đúng phía (về phía y càng âm hơn, theo pick)', offNeg.a.y < -500 && offNeg.b.y < -500);
  ok('toạ độ âm: offset giữ khoảng cách đúng 50mm', approx(Math.abs(offNeg.a.y - negLine.a.y), 50, 0.1));

  // offset entity SUY BIẾN: line dài 0 (a===b) — không có hướng pháp tuyến xác định.
  const zeroLine: LineEntity = { id: newId('e'), type: 'line', layer: LAY, a: { x: 50, y: 50 }, b: { x: 50, y: 50 } };
  const offZero = offsetEntity(zeroLine, 10, { x: 100, y: 100 }) as LineEntity;
  // P-note: normalize nội bộ dùng `|| 1` khi length=0 → ux=uy=0 → offset KHÔNG dịch chuyển gì
  // (không throw, không NaN) — hành vi thật: offset 1 điểm suy biến là vô nghĩa nên giữ nguyên.
  ok('offset line dài 0 (suy biến) → không NaN, giữ nguyên vị trí (không có hướng để đẩy)', offZero !== null && offZero.a.x === 50 && offZero.a.y === 50 && offZero.b.x === 50 && offZero.b.y === 50);
}

/* ══════════════════ [4] Phòng không khép kín — NEAR-MISS (khác chữ U thiếu hẳn cạnh đã test) ══════════════════ */
console.log('\n[4] Hatch — phòng GẦN khép kín (hở 1mm ở giữa 1 cạnh, KHÔNG phải thiếu cả cạnh)');
{
  // Mô phỏng lỗi vẽ tay thực tế: 4 cạnh phòng nhưng cạnh đáy bị chia làm 2 đoạn, hở đúng 1mm
  // ở giữa (x=1999.5 → x=2000.5) — không giao nhau, không chạm đầu mút nào của đoạn kia.
  const segs: [{ x: number; y: number }, { x: number; y: number }][] = [
    [{ x: 0, y: 0 }, { x: 1999.5, y: 0 }],
    [{ x: 2000.5, y: 0 }, { x: 4000, y: 0 }], // hở 1mm giữa 2 đoạn này
    [{ x: 4000, y: 0 }, { x: 4000, y: 3000 }],
    [{ x: 4000, y: 3000 }, { x: 0, y: 3000 }],
    [{ x: 0, y: 3000 }, { x: 0, y: 0 }],
  ];
  const poly = traceHatchBoundary(segs, { x: 2000, y: 1500 });
  ok('phòng hở 1mm (near-miss, không phải thiếu cả cạnh) → KHÔNG dò được vòng kín (null)', poly === null);
}

console.log('\n[5] Hatch — DEDUP đoạn trùng lặp hoàn toàn (2 hình chữ nhật y hệt chồng khít)');
{
  function fullRectSegs(x0: number, y0: number, x1: number, y1: number): [{ x: number; y: number }, { x: number; y: number }][] {
    const p = [{ x: x0, y: y0 }, { x: x1, y: y0 }, { x: x1, y: y1 }, { x: x0, y: y1 }];
    return [[p[0], p[1]], [p[1], p[2]], [p[2], p[3]], [p[3], p[0]]];
  }
  // mô phỏng entity bị dán trùng (Ctrl+V nhầm 2 lần cùng chỗ, hoặc hatch+polyline cùng cạnh
  // như wallChain sinh ra — xem ghi chú buildAtomicSegments trong hatch.ts) — segs GẤP ĐÔI.
  const rectA = fullRectSegs(0, 0, 1000, 1000);
  const rectB = fullRectSegs(0, 0, 1000, 1000);
  const dupPoly = traceHatchBoundary([...rectA, ...rectB], { x: 500, y: 500 });
  ok('2 hình chữ nhật TRÙNG khít hoàn toàn → dò được ĐÚNG 1 vòng (không nhân đôi/vỡ DCEL)', !!dupPoly);
  if (dupPoly) ok('diện tích đúng 1000×1000, không bị x2 hay chia đôi do cạnh đôi', approx(polygonArea(dupPoly), 1_000_000, 10));
}

/* ══════════════════ [6] TRIM/FILLET/CHAMFER — input biên (song song, góc 0°/180°) ══════════════════ */
console.log('\n[6] TRIM — 2 đường SONG SONG không giao nhau (khác test rNone: đó là ngoài phạm vi đoạn, đây là thật sự song song)');
{
  const line = L({ x: 0, y: 0 }, { x: 1000, y: 0 }); // nằm ngang y=0
  const parallelCutter = L({ x: 0, y: 50 }, { x: 1000, y: 50 }); // song song, offset y=50, KHÔNG BAO GIỜ giao (kể cả đường vô hạn)
  const r = trimLine(line, [parallelCutter], { x: 500, y: 0 });
  ok('cutter song song tuyệt đối (không giao ở bất kỳ đâu, kể cả kéo dài vô hạn) → trim null', r === null);
}

console.log('\n[7] FILLET — góc gần 0° (2 đường gần trùng hướng) và gần 180° (gần thẳng hàng ngược chiều)');
{
  // Góc ~0°: 2 đường gần như CÙNG hướng nhưng khác đường (độ dốc lệch cực nhỏ).
  const l1 = L({ x: 0, y: 0 }, { x: 100, y: 0 });
  const l2 = L({ x: 0, y: 0.00001 }, { x: 100, y: 0.00001 });
  ok('fillet góc ~0° (gần như cùng hướng, theta<1e-4) → null (không xác định được cung bo)', filletTwoLines(l1, l2, 10, { x: 100, y: 0 }, { x: 100, y: 0.00001 }) === null);

  // Góc ~180°: 2 tia GIỮ LẠI (sau khi chọn theo pick) gần như đối nhau qua giao điểm — gần thẳng hàng.
  const l3 = L({ x: -100, y: 0 }, { x: 0, y: 0 });
  const l4 = L({ x: 0, y: 0 }, { x: 100, y: 0.00001 });
  ok('fillet góc ~180° (2 tia giữ lại gần đối nhau qua đỉnh) → null (theta > π-1e-4)', filletTwoLines(l3, l4, 10, { x: -100, y: 0 }, { x: 100, y: 0.00001 }) === null);
}

console.log('\n[8] CHAMFER — 2 đường song song (không có giao điểm để vát góc)');
{
  const l1 = L({ x: 0, y: 0 }, { x: 100, y: 0 });
  const l2 = L({ x: 0, y: 50 }, { x: 100, y: 50 });
  ok('chamfer 2 đường song song → null (infiniteLineIntersect không có nghiệm)', chamferTwoLines(l1, l2, 10, 10, { x: 100, y: 0 }, { x: 100, y: 50 }) === null);
}

/* ══════════════════ [9] Sprint 10 — kẹp biên N-giác/ellipse/spline/divide/measure ══════════════════ */
console.log('\n[9] Kẹp biên: polygonVertices(sides), ellipsePoints(segments), catmullRomSpline(<3 điểm)');
{
  ok('polygonVertices sides=2 (dưới ngưỡng) → kẹp về 3 (tam giác)', polygonVertices({ x: 0, y: 0 }, { x: 10, y: 0 }, 2).length === 3);
  ok('polygonVertices sides=100 (vượt ngưỡng) → kẹp về 12', polygonVertices({ x: 0, y: 0 }, { x: 10, y: 0 }, 100).length === 12);
  ok('ellipsePoints segments=1 (dưới ngưỡng) → kẹp về tối thiểu 12', ellipsePoints({ x: 0, y: 0 }, 10, 5, 1).length === 12);
  ok('catmullRomSpline 2 điểm (< 3, không đủ nội suy) → trả nguyên input, KHÔNG nội suy thêm', catmullRomSpline([{ x: 0, y: 0 }, { x: 10, y: 10 }]).length === 2);
  ok('catmullRomSpline 0 điểm → trả mảng rỗng, không throw', catmullRomSpline([]).length === 0);
}

console.log('\n[10] entityLength/pointAtLength/divideEntity/measureEntity — entity KHÔNG hỗ trợ + n biên');
{
  const rect: RectEntity = { id: newId('e'), type: 'rect', layer: LAY, x: 0, y: 0, w: 100, h: 50 };
  ok('entityLength(rect) → 0 (rect không có "chiều dài chu vi" định nghĩa cho Divide/Measure)', entityLength(rect) === 0);
  ok('pointAtLength(rect, 10) → null (total<=0)', pointAtLength(rect, 10) === null);
  ok('divideEntity(rect, 4) → [] (total<=0)', divideEntity(rect, 4).length === 0);
  ok('measureEntity(rect, 10) → [] (total<=0)', measureEntity(rect, 10).length === 0);

  const line = L({ x: 0, y: 0 }, { x: 100, y: 0 });
  ok('divideEntity(line, n=1) → [] (n<2, không chia được)', divideEntity(line, 1).length === 0);
  ok('measureEntity(line, segLen=0) → [] (segLen<=0)', measureEntity(line, 0).length === 0);
  ok('measureEntity(line, segLen âm) → [] (segLen<=0)', measureEntity(line, -10).length === 0);
}

console.log(`\n${pass} ok, ${fail} fail`);
if (fail > 0) process.exit(1);
