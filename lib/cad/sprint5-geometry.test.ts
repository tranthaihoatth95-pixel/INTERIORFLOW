/**
 * lib/cad/sprint5-geometry.test.ts — Sprint 5 (Việc 2 Circle 3-điểm + Việc 3 Arc tâm+góc):
 * kiểm 2 hàm hình học THUẦN trong geometry.ts (circumcircle, arcFromCenterStartEnd).
 * Chạy: node_modules/.bin/sucrase-node lib/cad/sprint5-geometry.test.ts
 * (cùng pattern geometry.test.ts — không Jest/Vitest).
 */
import { circumcircle, arcFromCenterStartEnd } from './geometry';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}
function approx(a: number, b: number, eps = 0.01): boolean {
  return Math.abs(a - b) <= eps;
}

/* ── Việc 2: circumcircle — tâm+bán kính đường tròn qua 3 điểm ── */
function testCircumcircle() {
  console.log('\n[Sprint5] circumcircle — Circle 3-điểm');

  // Đường tròn đơn vị chuẩn: (1,0), (0,1), (-1,0) → tâm (0,0) bán kính 1.
  const cc1 = circumcircle({ x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 });
  ok('unit circle: tồn tại', !!cc1);
  if (cc1) {
    ok('unit circle: tâm x≈0', approx(cc1.c.x, 0));
    ok('unit circle: tâm y≈0', approx(cc1.c.y, 0));
    ok('unit circle: bán kính≈1', approx(cc1.r, 1));
  }

  // Đường tròn tâm (100,200) bán kính 50mm — 3 điểm bất kỳ trên đó (0°, 90°, 210°).
  const C = { x: 100, y: 200 };
  const R = 50;
  const pAt = (deg: number) => ({ x: C.x + R * Math.cos((deg * Math.PI) / 180), y: C.y + R * Math.sin((deg * Math.PI) / 180) });
  const cc2 = circumcircle(pAt(0), pAt(90), pAt(210));
  ok('circle mm: tồn tại', !!cc2);
  if (cc2) {
    ok('circle mm: tâm x đúng', approx(cc2.c.x, C.x, 0.5));
    ok('circle mm: tâm y đúng', approx(cc2.c.y, C.y, 0.5));
    ok('circle mm: bán kính đúng', approx(cc2.r, R, 0.5));
    // xác nhận cả 3 điểm gốc thực sự nằm CÁCH tâm mới tính đúng bán kính (đi qua đúng cả 3 điểm)
    for (const deg of [0, 90, 210]) {
      const p = pAt(deg);
      const d = Math.hypot(p.x - cc2.c.x, p.y - cc2.c.y);
      ok(`circle mm: điểm ${deg}° cách tâm = bán kính`, approx(d, cc2.r, 0.5));
    }
  }

  // 3 điểm thẳng hàng → không xác định được đường tròn → null.
  const ccNull = circumcircle({ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 20, y: 0 });
  ok('3 điểm thẳng hàng: trả về null', ccNull === null);
}

/* ── Việc 3: arcFromCenterStartEnd — cung từ tâm + điểm đầu + điểm cuối ── */
function testArcFromCenterStartEnd() {
  console.log('\n[Sprint5] arcFromCenterStartEnd — Arc tâm+góc');

  const c = { x: 500, y: 500 };
  // điểm đầu ở góc 0° cách tâm 80mm, điểm cuối ở góc 90° (bán kính bất kỳ — chỉ lấy góc).
  const s = { x: c.x + 80, y: c.y };
  const e = { x: c.x, y: c.y + 999 }; // xa tâm nhưng cùng hướng 90° — bán kính KHÔNG lấy từ đây

  const arc = arcFromCenterStartEnd(c, s, e);
  ok('arc: tồn tại', !!arc);
  if (arc) {
    ok('arc: tâm đúng', approx(arc.c.x, c.x) && approx(arc.c.y, c.y));
    ok('arc: bán kính lấy từ điểm ĐẦU (80mm), không phải điểm cuối', approx(arc.r, 80, 0.01));
    ok('arc: góc đầu ≈ 0 rad', approx(arc.a1, 0, 0.001));
    ok('arc: góc cuối ≈ 90° (π/2 rad)', approx(arc.a2, Math.PI / 2, 0.001));

    // điểm trên cung tại góc a1 phải trùng điểm start gốc (đúng bán kính+góc đầu)
    const onArcStart = { x: arc.c.x + arc.r * Math.cos(arc.a1), y: arc.c.y + arc.r * Math.sin(arc.a1) };
    ok('arc: điểm tại a1 trùng điểm start', approx(onArcStart.x, s.x, 0.01) && approx(onArcStart.y, s.y, 0.01));
  }

  // điểm bắt đầu trùng tâm → bán kính suy biến (0) → null.
  const degenerate = arcFromCenterStartEnd(c, { x: c.x, y: c.y }, e);
  ok('arc: điểm đầu trùng tâm → null', degenerate === null);

  // góc âm/quá 360 vẫn hợp lệ, chỉ cần a1/a2 nhất quán với atan2 (-π..π)
  const s2 = { x: c.x - 60, y: c.y - 1 }; // ~góc 180°+ chút
  const arc2 = arcFromCenterStartEnd(c, s2, s);
  ok('arc: cặp góc khác vẫn tính ra bán kính đúng theo start', !!arc2 && approx(arc2!.r, Math.hypot(s2.x - c.x, s2.y - c.y), 0.01));
}

testCircumcircle();
testArcFromCenterStartEnd();

console.log(`\n[Sprint5] geometry: ${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
