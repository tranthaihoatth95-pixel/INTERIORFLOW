/**
 * lib/cad/campath.test.ts — chạy: node_modules/.bin/sucrase-node lib/cad/campath.test.ts
 * LUẬT TRUNG TÍNH: toạ độ hư cấu, không gắn dự án/khách thật.
 */
import { roundPolylineCorners, sampleByLength, smoothDirections, planCamPath } from './campath';
import type { Pt } from './model';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}
function near(a: number, b: number, eps = 1e-6): boolean {
  return Math.abs(a - b) < eps;
}
function nearPt(a: Pt, b: Pt, eps = 1e-6): boolean {
  return near(a.x, b.x, eps) && near(a.y, b.y, eps);
}
function circDist(a: number, b: number): number {
  let d = (a - b) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return Math.abs(d);
}

/* ── [1] roundPolylineCorners — ca 90° tường minh (spec yêu cầu riêng ca này) ── */
function test90DegreeCorner() {
  console.log('\n[1] roundPolylineCorners — góc 90°, đoạn đủ dài (không bị clamp)');
  const pts: Pt[] = [{ x: 0, y: 0 }, { x: 2000, y: 0 }, { x: 2000, y: 2000 }];
  const R = 600;
  const out = roundPolylineCorners(pts, R, 12);

  ok('tổng điểm = 1(đầu) + 13(cung: p1+11 giữa+p2) + 1(cuối) = 15', out.length === 15);
  ok('điểm đầu giữ nguyên (0,0)', nearPt(out[0], { x: 0, y: 0 }));
  ok('điểm cuối giữ nguyên (2000,2000)', nearPt(out[out.length - 1], { x: 2000, y: 2000 }));
  ok('điểm tiếp tuyến p1 = (1400,0) — d=R/tan(45°)=600, lùi từ đỉnh (2000,0)', nearPt(out[1], { x: 1400, y: 0 }, 1e-6));
  ok('điểm tiếp tuyến p2 = (2000,600)', nearPt(out[13], { x: 2000, y: 600 }, 1e-6));

  const center = { x: 1400, y: 600 };
  let allOnArc = true;
  for (let i = 1; i <= 13; i++) {
    if (!near(Math.hypot(out[i].x - center.x, out[i].y - center.y), R, 1e-6)) allOnArc = false;
  }
  ok('mọi điểm cung (index 1..13) cách tâm (1400,600) đúng bán kính 600', allOnArc);
}

/* ── [2] roundPolylineCorners — suy biến ── */
function testDegenerateCorners() {
  console.log('\n[2] roundPolylineCorners — ca suy biến');
  const straight: Pt[] = [{ x: 0, y: 0 }, { x: 1000, y: 0 }, { x: 2000, y: 0 }];
  const outStraight = roundPolylineCorners(straight, 600, 12);
  ok('3 điểm thẳng hàng (θ≈180°) → KHÔNG bo, giữ nguyên 3 điểm', outStraight.length === 3 && nearPt(outStraight[1], { x: 1000, y: 0 }));

  const short: Pt[] = [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }];
  const outShort = roundPolylineCorners(short, 600, 12);
  const p1 = outShort[1];
  ok('đoạn ngắn (100mm) hơn 2×R(600) → d bị CLAMP, p1 vẫn nằm trong đoạn gốc (x∈[0,100])', p1.x >= 0 && p1.x <= 100);
  ok('đoạn ngắn → cung vẫn không throw / không NaN', outShort.every((p) => Number.isFinite(p.x) && Number.isFinite(p.y)));

  ok('< 3 điểm → trả nguyên (không xử lý bo góc)', roundPolylineCorners([{ x: 0, y: 0 }, { x: 1, y: 1 }], 600).length === 2);
  ok('radiusMm = 0 → trả nguyên', roundPolylineCorners(straight, 0).length === 3);
}

/* ── [3] sampleByLength — mẫu đều theo độ dài, luôn có đầu/cuối ── */
function testSampleByLength() {
  console.log('\n[3] sampleByLength');
  const line: Pt[] = [{ x: 0, y: 0 }, { x: 1000, y: 0 }];
  const s1 = sampleByLength(line, 300);
  ok('step=300 trên đoạn 1000mm → 5 mẫu [0,300,600,900,1000]', s1.length === 5 && s1.every((s, i) => near(s.cumLenMm, [0, 300, 600, 900, 1000][i])));
  ok('không mẫu nào trùng lặp cumLenMm', new Set(s1.map((s) => s.cumLenMm)).size === s1.length);

  const s2 = sampleByLength(line, 500);
  ok('step=500 chia hết 1000mm → đúng 3 mẫu [0,500,1000], KHÔNG lặp điểm cuối', s2.length === 3 && near(s2[2].cumLenMm, 1000));

  ok('điểm cuối luôn khớp toạ độ thật (1000,0)', nearPt(s1[s1.length - 1].point, { x: 1000, y: 0 }));
  ok('mảng rỗng → trả rỗng', sampleByLength([], 100).length === 0);
  ok('1 điểm → trả đúng 1 mẫu cumLen=0', sampleByLength([{ x: 5, y: 5 }], 100).length === 1);

  const zigzag: Pt[] = [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }];
  const s3 = sampleByLength(zigzag, 60);
  ok('mẫu giữa (nội suy) nằm ĐÚNG trên đoạn 2 (x=100) sau khi qua hết đoạn 1 (dài 100)',
    s3.some((s) => near(s.point.x, 100) && s.cumLenMm > 100 && s.cumLenMm < 200));
}

/* ── [4] smoothDirections — trung bình trượt CÓ CHU KỲ (không vỡ ở biên ±π) ── */
function testSmoothDirections() {
  console.log('\n[4] smoothDirections — không vỡ khi góc quấn qua ±π');
  const dirs = [3.0, 3.1, -3.1, -3.0, -2.9]; // quay liên tục qua biên ±π
  const sm = smoothDirections(dirs, 3);
  ok('mẫu giữa (idx 2) sau làm mượt vẫn gần π (không nhảy giá trị vô nghĩa do trung bình thô)', circDist(sm[2], Math.PI) < 0.2);

  const flat = [1.0, 1.0, 1.0, 1.0, 1.0];
  ok('hướng đã đều → trung bình trượt không đổi', smoothDirections(flat, 5).every((d) => near(d, 1.0, 1e-9)));

  ok('mảng rỗng → trả rỗng', smoothDirections([], 5).length === 0);
  ok('window=1 → trả nguyên (mỗi mẫu tự trung bình với chính nó)', smoothDirections([0.5, 1.5], 1).every((d, i) => near(d, [0.5, 1.5][i])));
}

/* ── [5] planCamPath — tích hợp đủ 3 bước, đúng thứ tự §2.2 ── */
function testPlanCamPath() {
  console.log('\n[5] planCamPath — end-to-end (bo góc → lấy mẫu → làm mượt hướng)');
  const pts: Pt[] = [{ x: 0, y: 0 }, { x: 2000, y: 0 }, { x: 2000, y: 2000 }];
  const r = planCamPath(pts, { speedMmPerSec: 1200, filletRadiusMm: 600, stepMm: 100, arcSegments: 12 });

  const expectedLen = 1400 + (Math.PI / 2) * 600 + 1400; // 2 đoạn thẳng đã cắt góc + 1/4 cung R=600
  ok(`totalLengthMm ≈ ${expectedLen.toFixed(1)} (2×1400 đoạn thẳng + 1/4 chu vi R=600, NGẮN hơn polyline gốc 4000mm)`, near(r.totalLengthMm, expectedLen, 1));
  ok('totalDurationSec = totalLengthMm / 1200', near(r.totalDurationSec, r.totalLengthMm / 1200, 1e-9));
  ok('mẫu đầu tSec=0', near(r.samples[0].tSec, 0));
  ok('mẫu cuối tSec ≈ totalDurationSec', near(r.samples[r.samples.length - 1].tSec, r.totalDurationSec, 1e-6));
  ok('mọi mẫu có dirRad hữu hạn, không NaN', r.samples.every((s) => Number.isFinite(s.dirRad)));
  ok('tSec tăng đơn điệu không giảm dọc đường (đi 1 chiều, tốc độ không đổi)', r.samples.every((s, i) => i === 0 || s.tSec >= r.samples[i - 1].tSec));
  ok('hướng đoạn đầu (đi dọc +X) ≈ 0 rad', circDist(r.samples[0].dirRad, 0) < 0.15);
  ok('hướng đoạn cuối (đi dọc +Y) ≈ π/2 rad', circDist(r.samples[r.samples.length - 1].dirRad, Math.PI / 2) < 0.15);

  ok('< 2 điểm → không throw, trả rỗng/1 mẫu hợp lệ', planCamPath([{ x: 0, y: 0 }]).samples.length === 1 && planCamPath([]).samples.length === 0);

  const straight = planCamPath([{ x: 0, y: 0 }, { x: 1000, y: 0 }], { stepMm: 250 });
  ok('đường thẳng 1000mm, tốc độ mặc định 1200mm/s → totalDurationSec ≈ 0.833s', near(straight.totalDurationSec, 1000 / 1200, 1e-9));
}

/* ── [6] planCamPath — lookAt V2.1 (§2.1 chế độ 2/3, 02/08) ── */
function testLookAtModes() {
  console.log('\n[6] planCamPath — lookAt chế độ 2 (khoá điểm) / 3 (khoá zone)');
  const pts: Pt[] = [{ x: 0, y: 0 }, { x: 2000, y: 0 }, { x: 2000, y: 2000 }];

  // mặc định KHÔNG truyền lookAt vẫn = tangent — hành vi cũ y hệt (test [5] đã phủ), chỉ xác nhận
  // truyền tường minh { kind: 'tangent' } ra CÙNG kết quả.
  const implicit = planCamPath(pts, { speedMmPerSec: 1200 });
  const explicitTangent = planCamPath(pts, { speedMmPerSec: 1200, lookAt: { kind: 'tangent' } });
  ok('lookAt tường minh "tangent" === không truyền lookAt (mặc định)', implicit.samples.every((s, i) => near(s.dirRad, explicitTangent.samples[i].dirRad, 1e-9)));

  // chế độ 2 — khoá điểm cố định (1000, 5000): mọi mẫu phải nhìn ĐÚNG hướng điểm đó, bất kể
  // đường cam đang đi hướng nào (khác hẳn tangent — không còn "đi tới đâu nhìn tới đó").
  const lockPt: Pt = { x: 1000, y: 5000 };
  const point = planCamPath(pts, { speedMmPerSec: 1200, lookAt: { kind: 'point', at: lockPt } });
  ok(
    'mọi mẫu chế độ khoá-điểm nhìn ĐÚNG hướng atan2(target-point)',
    point.samples.every((s) => circDist(s.dirRad, Math.atan2(lockPt.y - s.point.y, lockPt.x - s.point.x)) < 1e-6),
  );
  ok('chế độ khoá-điểm KHÁC tangent ở đoạn cuối (không còn nhìn theo hướng đi +Y)', circDist(point.samples[point.samples.length - 1].dirRad, Math.PI / 2) > 0.3);

  // chế độ 3 — khoá tâm zone (centroid truyền sẵn, campath.ts không cần biết ZoneEntity).
  const centroid: Pt = { x: -2000, y: 1000 };
  const zone = planCamPath(pts, { speedMmPerSec: 1200, lookAt: { kind: 'zone', centroid } });
  ok(
    'mọi mẫu chế độ khoá-zone nhìn ĐÚNG hướng atan2(centroid-point)',
    zone.samples.every((s) => circDist(s.dirRad, Math.atan2(centroid.y - s.point.y, centroid.x - s.point.x)) < 1e-6),
  );

  // vị trí điểm/thời gian KHÔNG đổi theo lookAt — chỉ hướng nhìn đổi, đường đi vật lý giữ nguyên.
  ok('đổi lookAt KHÔNG đổi vị trí điểm dọc đường', point.samples.every((s, i) => nearPt(s.point, implicit.samples[i].point)));
  ok('đổi lookAt KHÔNG đổi tSec/tốc độ', point.samples.every((s, i) => near(s.tSec, implicit.samples[i].tSec)));

  // ca suy biến: camera trùng đúng điểm khoá → atan2(0,0) vô nghĩa, rơi về tiếp tuyến (không NaN).
  const onTarget = planCamPath([{ x: 5, y: 5 }, { x: 100, y: 5 }], { lookAt: { kind: 'point', at: { x: 5, y: 5 } } });
  ok('camera trùng điểm khoá → rơi về tiếp tuyến, không NaN', Number.isFinite(onTarget.samples[0].dirRad));

  // 1 điểm duy nhất vẫn tính được hướng theo lookAt (trước đây luôn hardcode 0).
  const single = planCamPath([{ x: 0, y: 0 }], { lookAt: { kind: 'point', at: { x: 0, y: 10 } } });
  ok('1 điểm + lookAt point → hướng nhìn đúng thẳng lên +Y (π/2)', single.samples.length === 1 && circDist(single.samples[0].dirRad, Math.PI / 2) < 1e-6);
}

test90DegreeCorner();
testDegenerateCorners();
testSampleByLength();
testSmoothDirections();
testPlanCamPath();
testLookAtModes();

console.log(`\n${pass} ok, ${fail} fail`);
if (fail > 0) process.exit(1);
