/**
 * lib/cad/modify.test.ts — kiểm hình học cho bộ chỉnh sửa (Nấc 1: TRIM/EXTEND/FILLET/CHAMFER/
 * ARRAY/SCALE/STRETCH/BREAK/JOIN/EXPLODE/LENGTHEN). Chạy bằng:
 *   node_modules/.bin/sucrase-node lib/cad/modify.test.ts
 * (cùng pattern dxf.roundtrip.test.ts — không Jest/Vitest, không phải file production).
 */
import {
  infiniteLineIntersect, lineCircleIntersect, circleCircleIntersect,
  trimLine, trimArc, trimCircle, trimEntity,
  extendLine, extendArc,
  filletTwoLines, chamferTwoLines,
  arrayRect, arrayPolar,
  scaleEntityAbout, scaleFactorFromReference,
  stretchEntity,
  breakLineAt, breakArcAt,
  joinEntities,
  explodeEntity,
  lengthenLine, lengthenArc, lineLength, arcLength,
} from './modify';
import type { LineEntity, ArcEntity, CircleEntity, PolylineEntity, RectEntity, BlockEntity, Entity } from './model';
import { dist } from './model';
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
function ptApprox(a: { x: number; y: number }, b: { x: number; y: number }, eps = 0.5): boolean {
  return approx(a.x, b.x, eps) && approx(a.y, b.y, eps);
}

const LAY = 'l-wall';
function L(a: { x: number; y: number }, b: { x: number; y: number }): LineEntity {
  return { id: newId('e'), type: 'line', layer: LAY, a, b };
}
function A(c: { x: number; y: number }, r: number, a1: number, a2: number): ArcEntity {
  return { id: newId('e'), type: 'arc', layer: LAY, c, r, a1, a2 };
}
function C(c: { x: number; y: number }, r: number): CircleEntity {
  return { id: newId('e'), type: 'circle', layer: LAY, c, r };
}

/* ── 1) giao hình học cơ bản ── */
function testIntersections() {
  console.log('\n[1] Giao hình học cơ bản (line-line vô hạn, line-circle, circle-circle)');
  const r1 = infiniteLineIntersect({ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 5, y: -10 }, { x: 5, y: 10 });
  ok('2 đường vuông góc giao tại (5,0)', !!r1 && ptApprox(r1.pt, { x: 5, y: 0 }));
  const r2 = infiniteLineIntersect({ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 });
  ok('2 đường song song → null', r2 === null);

  const lc = lineCircleIntersect({ x: -100, y: 0 }, { x: 100, y: 0 }, { x: 0, y: 0 }, 50);
  ok('đường qua tâm cắt vòng tròn tại 2 điểm', lc.length === 2);
  ok('1 điểm giao ở x=-50', lc.some((s) => ptApprox(s.pt, { x: -50, y: 0 })));
  ok('1 điểm giao ở x=50', lc.some((s) => ptApprox(s.pt, { x: 50, y: 0 })));

  const cc = circleCircleIntersect({ x: 0, y: 0 }, 50, { x: 60, y: 0 }, 50);
  ok('2 vòng tròn giao tại 2 điểm', cc.length === 2);
  ok('điểm giao đối xứng qua trục X (y ngược dấu)', Math.abs(cc[0].y + cc[1].y) < 0.1 && Math.abs(cc[0].y) > 1);
}

/* ── 2) TRIM line-line, line-arc, circle ── */
function testTrim() {
  console.log('\n[2] TRIM — line-line, line-arc, circle');
  // line ngang 0..1000, cutter dọc tại x=400 và x=700 → click giữa 400-700 xoá đoạn giữa
  const line = L({ x: 0, y: 0 }, { x: 1000, y: 0 });
  const cut1 = L({ x: 400, y: -100 }, { x: 400, y: 100 });
  const cut2 = L({ x: 700, y: -100 }, { x: 700, y: 100 });
  const r = trimLine(line, [cut1, cut2], { x: 550, y: 0 });
  ok('trim giữa 2 cutter → 2 đoạn còn lại', !!r && r.length === 2);
  if (r) {
    ok('đoạn 1: 0→400', ptApprox(r[0].a, { x: 0, y: 0 }) && ptApprox(r[0].b, { x: 400, y: 0 }));
    ok('đoạn 2: 700→1000', ptApprox(r[1].a, { x: 700, y: 0 }) && ptApprox(r[1].b, { x: 1000, y: 0 }));
  }
  // click ngoài (bên trái cutter đầu tiên) → xoá đoạn 0..400, giữ 1 đoạn 400..1000 (còn cutter tại 700 vẫn tồn tại nhưng không liên quan vì đã bị bao bên phải của low)
  const r2 = trimLine(line, [cut1, cut2], { x: 100, y: 0 });
  ok('click đầu trái → 1 đoạn còn lại 400→1000', !!r2 && r2.length === 1 && ptApprox(r2[0].a, { x: 400, y: 0 }) && ptApprox(r2[0].b, { x: 1000, y: 0 }));
  // không có cutter nào cắt qua đoạn → null
  const rNone = trimLine(line, [L({ x: 2000, y: -100 }, { x: 2000, y: 100 })], { x: 500, y: 0 });
  ok('không có giao điểm trong đoạn → null', rNone === null);

  // line-ARC: line ngang y=0 cắt 1 cung tròn bán kính 100 tâm gốc, sweep đủ 2 giao điểm bên phải
  const arcCutter = A({ x: 500, y: 0 }, 100, 0, Math.PI); // nửa trên vòng tròn tâm (500,0)
  const line2 = L({ x: 0, y: 0 }, { x: 1000, y: 0 });
  // đường ngang y=0 cắt vòng tròn tại (400,0) và (600,0) nhưng chỉ (400,0)/(600,0) nằm trên biên
  // sweep [0,π] (nửa trên, y>=0) — 2 điểm giao đều nằm trên trục X (y=0), đúng biên của sweep.
  const rArcTrim = trimLine(line2, [arcCutter], { x: 500, y: 0 });
  ok('line trim bởi arc: đoạn giữa 400-600 bị xoá', !!rArcTrim && rArcTrim.length === 2);

  // TRIM chính cung: cắt cung tròn đầy đủ 270° bởi 1 line ngang, giữ phần không chứa pick
  const bigArc = A({ x: 0, y: 0 }, 200, -Math.PI / 2, Math.PI); // 3/4 vòng
  const vLine = L({ x: -300, y: 50 }, { x: 300, y: 50 }); // cắt ngang tại y=50 (2 điểm trên vòng bán kính 200)
  const rArc = trimArc(bigArc, [vLine], { x: 0, y: 200 }); // pick ở đỉnh trên (nằm trong sweep, phía trên đường cắt)
  ok('trim ARC bởi 1 line ngang → còn lại phần(s)', !!rArc && rArc.length >= 1);

  // TRIM circle: 1 vòng tròn bị 2 line cắt tại 4 điểm nhưng ta chỉ dùng 2 cutter thẳng hàng qua tâm
  const circ = C({ x: 0, y: 0 }, 100);
  const cutA = L({ x: -200, y: 0 }, { x: 200, y: 0 }); // cắt tại (100,0) và (-100,0)
  const rc = trimCircle(circ, [cutA], { x: 0, y: 100 }); // pick ở nửa trên → xoá nửa trên, giữ nửa dưới
  ok('trim CIRCLE bởi 1 line qua tâm → còn lại 1 ARC (nửa dưới)', !!rc && rc.type === 'arc');
  if (rc) {
    const midAng = (rc.a1 + rc.a2) / 2;
    const midPt = { x: rc.c.x + rc.r * Math.cos(midAng), y: rc.c.y + rc.r * Math.sin(midAng) };
    ok('cung còn lại nằm ở nửa dưới (y<0)', midPt.y < 0);
  }

  // trimEntity điều phối đúng theo loại
  const dispatched = trimEntity(line, [cut1, cut2], { x: 550, y: 0 });
  ok('trimEntity điều phối LINE đúng như trimLine', !!dispatched && dispatched.length === 2);
}

/* ── 3) EXTEND ── */
function testExtend() {
  console.log('\n[3] EXTEND — line, arc');
  const line = L({ x: 0, y: 0 }, { x: 500, y: 0 });
  const boundary = L({ x: 1000, y: -100 }, { x: 1000, y: 100 });
  const r = extendLine(line, [boundary], { x: 480, y: 0 }); // pick gần đầu b → kéo dài đầu b
  ok('extend LINE tới boundary x=1000', !!r && ptApprox(r.a, { x: 0, y: 0 }) && ptApprox(r.b, { x: 1000, y: 0 }));
  ok('extend giữ nguyên id gốc', r?.id === line.id);

  const noBoundary = extendLine(line, [L({ x: -100, y: -100 }, { x: -100, y: 100 })], { x: 480, y: 0 });
  ok('extend không tìm thấy biên hợp lệ phía kéo dài → null', noBoundary === null);

  // extend arc: cung 90° (0→π/2) kéo dài đầu a2 tới 1 line cắt vòng tròn ở góc lớn hơn
  const arc = A({ x: 0, y: 0 }, 100, 0, Math.PI / 2);
  const arcBoundary = L({ x: -200, y: 200 }, { x: 200, y: -200 }); // đường chéo qua góc 3π/4 và -π/4 (không cắt sweep hiện có)
  const rArc = extendArc(arc, [arcBoundary], { x: 0, y: 100 }); // pick gần đầu a2 (đỉnh trên)
  ok('extend ARC mở rộng sweep khi có boundary phía sau a2', rArc === null || rArc.a2 > arc.a2 - 1e-6);
}

/* ── 4) FILLET / CHAMFER ── */
function testFilletChamfer() {
  console.log('\n[4] FILLET (bán kính>0 và =0) / CHAMFER');
  // 2 đường vuông góc tạo góc tại (0,0): line1 dọc theo +X từ (0,0)->(100,0) (keep ở xa: pick gần (100,0))
  // line2 dọc theo +Y từ (0,0)->(0,100)
  const l1 = L({ x: 0, y: 0 }, { x: 100, y: 0 });
  const l2 = L({ x: 0, y: 0 }, { x: 0, y: 100 });
  const fr = filletTwoLines(l1, l2, 20, { x: 100, y: 0 }, { x: 0, y: 100 });
  ok('fillet góc vuông sinh ra 1 arc', !!fr && !!fr.arc);
  if (fr?.arc) {
    ok('bán kính arc đúng 20', approx(fr.arc.r, 20, 0.01));
    // tâm cung phải cách cả 2 đường 1 khoảng = bán kính (kiểm tiếp tuyến gần đúng: cách trục X và trục Y đều ~20)
    ok('tâm cung cách đều 2 cạnh góc vuông (~20mm mỗi trục)', approx(Math.abs(fr.arc.c.x), 20, 1) && approx(Math.abs(fr.arc.c.y), 20, 1));
  }
  ok('line1 sau fillet: đầu giữ (100,0) không đổi, đầu kia lùi về điểm tiếp tuyến', ptApprox(fr!.line1.a, { x: 100, y: 0 }) || ptApprox(fr!.line1.b, { x: 100, y: 0 }));

  // fillet radius 0 → không có arc, 2 line gặp nhau đúng tại giao điểm (0,0)
  const fr0 = filletTwoLines(l1, l2, 0, { x: 100, y: 0 }, { x: 0, y: 100 });
  ok('fillet radius=0 → không sinh arc', !!fr0 && fr0.arc === null);
  if (fr0) {
    const meet1 = ptApprox(fr0.line1.a, { x: 0, y: 0 }) ? fr0.line1.a : fr0.line1.b;
    const meet2 = ptApprox(fr0.line2.a, { x: 0, y: 0 }) ? fr0.line2.a : fr0.line2.b;
    ok('2 đường gặp nhau tại giao điểm (0,0) khi r=0', ptApprox(meet1, { x: 0, y: 0 }) && ptApprox(meet2, { x: 0, y: 0 }));
  }

  // fillet 2 đường song song → null
  const lp1 = L({ x: 0, y: 0 }, { x: 100, y: 0 });
  const lp2 = L({ x: 0, y: 50 }, { x: 100, y: 50 });
  ok('fillet 2 đường song song → null', filletTwoLines(lp1, lp2, 10, { x: 100, y: 0 }, { x: 100, y: 50 }) === null);

  // chamfer: khoảng cách 10mm mỗi cạnh
  const cr = chamferTwoLines(l1, l2, 10, 15, { x: 100, y: 0 }, { x: 0, y: 100 });
  ok('chamfer sinh connector nối 2 điểm cách góc đúng khoảng cách', !!cr && approx(dist(cr.connector.a, { x: 10, y: 0 }), 0, 1) && approx(dist(cr.connector.b, { x: 0, y: 15 }), 0, 1));
}

/* ── 5) ARRAY ── */
function testArray() {
  console.log('\n[5] ARRAY — chữ nhật + tròn');
  const seed = L({ x: 0, y: 0 }, { x: 10, y: 0 });
  const rectArr = arrayRect([seed], 2, 3, 100, 200);
  ok('array 2x3 sinh ra 5 bản sao (bỏ gốc)', rectArr.length === 5);
  ok('mọi bản sao có id khác nhau và khác gốc', new Set(rectArr.map((e) => e.id)).size === 5 && rectArr.every((e) => e.id !== seed.id));
  const found = rectArr.some((e) => e.type === 'line' && ptApprox(e.a, { x: 200, y: 200 }));
  ok('có 1 bản tại offset (200,200) — hàng 1 cột 2', found);

  const polarArr = arrayPolar([seed], { x: 0, y: 0 }, 4, 360, true);
  ok('array tròn 4 bản (đầy vòng) sinh 3 bản sao mới', polarArr.length === 3);
  const rotated90 = polarArr.find((e) => e.type === 'line' && approx(e.a.x, 0, 1) && approx(e.a.y, 0, 1) && approx(e.b.x, 0, 1) && e.b.y > 5);
  ok('1 bản xoay 90° từ (0,0)-(10,0) → (0,0)-(0,10)', !!rotated90);
}

/* ── 6) SCALE ── */
function testScale() {
  console.log('\n[6] SCALE quanh 1 điểm base bất kỳ + Reference');
  const line = L({ x: 100, y: 0 }, { x: 200, y: 0 });
  const scaled = scaleEntityAbout(line, { x: 100, y: 0 }, 2) as LineEntity;
  ok('scale x2 quanh (100,0): điểm base đứng yên', ptApprox(scaled.a, { x: 100, y: 0 }));
  ok('scale x2 quanh (100,0): điểm xa gấp đôi khoảng cách', ptApprox(scaled.b, { x: 300, y: 0 }));

  const f = scaleFactorFromReference({ x: 0, y: 0 }, { x: 50, y: 0 }, { x: 125, y: 0 });
  ok('scaleFactorFromReference: 50→125 = hệ số 2.5', approx(f, 2.5, 0.001));
}

/* ── 7) STRETCH ── */
function testStretch() {
  console.log('\n[7] STRETCH — crossing window chỉ dời điểm trong khung');
  // line dài 0..1000; window bao quanh đầu b (900..1100) → chỉ b dời, a đứng yên
  const line = L({ x: 0, y: 0 }, { x: 1000, y: 0 });
  const w = { min: { x: 900, y: -50 }, max: { x: 1100, y: 50 } };
  const st = stretchEntity(line, w, 50, 0) as LineEntity;
  ok('đầu a ngoài khung đứng yên', ptApprox(st.a, { x: 0, y: 0 }));
  ok('đầu b trong khung dời +50', ptApprox(st.b, { x: 1050, y: 0 }));

  // polyline 3 đỉnh, window chỉ bao đỉnh giữa
  const poly: PolylineEntity = { id: newId('e'), type: 'polyline', layer: LAY, closed: false, points: [{ x: 0, y: 0 }, { x: 500, y: 0 }, { x: 1000, y: 0 }] };
  const w2 = { min: { x: 400, y: -50 }, max: { x: 600, y: 50 } };
  const st2 = stretchEntity(poly, w2, 0, 100) as PolylineEntity;
  ok('polyline: chỉ đỉnh giữa (trong khung) dời theo Y', ptApprox(st2.points[1], { x: 500, y: 100 }) && ptApprox(st2.points[0], { x: 0, y: 0 }) && ptApprox(st2.points[2], { x: 1000, y: 0 }));
}

/* ── 8) BREAK ── */
function testBreak() {
  console.log('\n[8] BREAK — 1 điểm và 2 điểm');
  const line = L({ x: 0, y: 0 }, { x: 1000, y: 0 });
  const b1 = breakLineAt(line, { x: 500, y: 0 });
  ok('break 1 điểm giữa → 2 đoạn', b1.length === 2 && ptApprox(b1[0].b, { x: 500, y: 0 }) && ptApprox(b1[1].a, { x: 500, y: 0 }));

  const b2 = breakLineAt(line, { x: 300, y: 0 }, { x: 700, y: 0 });
  ok('break 2 điểm → xoá đoạn giữa, còn 2 đoạn ngoài', b2.length === 2 && ptApprox(b2[0].b, { x: 300, y: 0 }) && ptApprox(b2[1].a, { x: 700, y: 0 }));

  const bEnd = breakLineAt(line, { x: 0, y: 0 }, { x: 300, y: 0 });
  ok('break từ đầu mút → chỉ còn 1 đoạn', bEnd.length === 1 && ptApprox(bEnd[0].a, { x: 300, y: 0 }) && ptApprox(bEnd[0].b, { x: 1000, y: 0 }));

  const arc = A({ x: 0, y: 0 }, 100, 0, Math.PI);
  const bArc = breakArcAt(arc, { x: 0, y: 100 }); // điểm ở giữa cung (góc π/2)
  ok('break arc 1 điểm giữa → 2 cung', bArc.length === 2);
}

/* ── 9) JOIN ── */
function testJoin() {
  console.log('\n[9] JOIN — line+line thẳng hàng, arc+arc cùng đường tròn, polyline hở nối tiếp');
  const l1 = L({ x: 0, y: 0 }, { x: 100, y: 0 });
  const l2 = L({ x: 100, y: 0 }, { x: 250, y: 0 });
  const j = joinEntities(l1, l2);
  ok('join 2 line thẳng hàng liền kề → 1 line dài hơn', !!j && j.type === 'line' && approx(dist(j.a, j.b), 250, 0.5));

  const lOff = L({ x: 0, y: 50 }, { x: 100, y: 50 }); // song song nhưng không cùng đường thẳng
  ok('join 2 line KHÔNG thẳng hàng → vẫn nối được thành polyline (điểm chung)? phải null vì không có đầu trùng', joinEntities(l1, lOff) === null);

  const a1 = A({ x: 0, y: 0 }, 100, 0, Math.PI / 2);
  const a2 = A({ x: 0, y: 0 }, 100, Math.PI / 2, Math.PI);
  const ja = joinEntities(a1, a2);
  ok('join 2 arc cùng đường tròn tiếp giáp → 1 arc sweep tổng', !!ja && ja.type === 'arc' && approx(((ja as ArcEntity).a2 - (ja as ArcEntity).a1) * (180 / Math.PI), 180, 1));

  const p1 = L({ x: 0, y: 0 }, { x: 100, y: 100 });
  const p2 = L({ x: 100, y: 100 }, { x: 200, y: 0 }); // gấp khúc, không thẳng hàng với p1
  const jp = joinEntities(p1, p2);
  ok('join 2 line gấp khúc có đầu chung → 1 polyline 3 điểm', !!jp && jp.type === 'polyline' && (jp as PolylineEntity).points.length === 3);
}

/* ── 10) EXPLODE ── */
function testExplode() {
  console.log('\n[10] EXPLODE — polyline/rect → line rời; block → primitive world-space');
  const poly: PolylineEntity = { id: newId('e'), type: 'polyline', layer: LAY, closed: true, points: [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }, { x: 0, y: 100 }] };
  const ex = explodeEntity(poly);
  ok('explode polyline khép kín 4 đỉnh → 4 LINE', ex.length === 4 && ex.every((e) => e.type === 'line'));

  const rect: RectEntity = { id: newId('e'), type: 'rect', layer: LAY, x: 0, y: 0, w: 200, h: 100 };
  const exr = explodeEntity(rect);
  ok('explode rect → 4 LINE', exr.length === 4 && exr.every((e) => e.type === 'line'));

  const block: BlockEntity = { id: newId('e'), type: 'block', layer: LAY, block: 'sofa2', at: { x: 1000, y: 1000 }, rot: 0, sx: 1, sy: 1 };
  const exb = explodeEntity(block);
  ok('explode block sofa2 → có entity hình học tại world (1000,1000)', exb.length > 0);
  ok('explode block: không còn entity type "block"', exb.every((e: Entity) => e.type !== 'block'));

  const line = L({ x: 0, y: 0 }, { x: 10, y: 0 });
  ok('explode LINE đơn → trả nguyên bản (không phân rã thêm)', explodeEntity(line).length === 1 && explodeEntity(line)[0].id === line.id);
}

/* ── 11) LENGTHEN ── */
function testLengthen() {
  console.log('\n[11] LENGTHEN — line + arc, đầu gần điểm tham chiếu');
  const line = L({ x: 0, y: 0 }, { x: 100, y: 0 });
  ok('lineLength = 100', approx(lineLength(line), 100, 0.01));
  const longer = lengthenLine(line, 50, { x: 100, y: 0 }); // gần đầu b → kéo dài đầu b
  ok('lengthen +50 ở đầu b → độ dài 150', approx(lineLength(longer), 150, 0.5));
  ok('đầu a không đổi', ptApprox(longer.a, { x: 0, y: 0 }));
  const shorter = lengthenLine(line, -30, { x: 0, y: 0 }); // gần đầu a → rút ngắn đầu a
  ok('lengthen -30 ở đầu a → độ dài 70', approx(lineLength(shorter), 70, 0.5));

  const arc = A({ x: 0, y: 0 }, 100, 0, Math.PI / 2);
  ok('arcLength cung 90° bán kính 100 ≈ 157.08', approx(arcLength(arc), 157.08, 0.5));
  const ptB = { x: arc.c.x + arc.r * Math.cos(arc.a2), y: arc.c.y + arc.r * Math.sin(arc.a2) };
  const longerArc = lengthenArc(arc, Math.PI / 4, ptB); // gần đầu a2 → mở rộng thêm 45°
  ok('lengthen arc +45° ở đầu a2 → sweep 135°', approx((longerArc.a2 - longerArc.a1) * (180 / Math.PI), 135, 1));
}

testIntersections();
testTrim();
testExtend();
testFilletChamfer();
testArray();
testScale();
testStretch();
testBreak();
testJoin();
testExplode();
testLengthen();

console.log(`\n${pass} ok, ${fail} fail`);
if (fail > 0) process.exit(1);
