/**
 * lib/vision/single-view-metrology.test.ts — 2.2.87. "Ảnh tổng hợp" = cảnh 3D dựng bằng tay,
 * chiếu qua 1 camera pinhole biết trước (helper `projectPoint`/`projectDirection` dưới đây) ra
 * toạ độ ảnh, rồi xác nhận pipeline suy ngược đúng kích thước gốc — xem giải thích ở đầu
 * single-view-metrology.ts vì sao đây ĐÚNG là ý nghĩa test toán học tất định, không cần ảnh thật.
 *
 * Chạy: node_modules/.bin/sucrase-node lib/vision/single-view-metrology.test.ts
 */
import {
  calibrateFromVanishingPoints,
  anchorScale,
  measureObject,
  vanishingPointFromLines,
  measureObjectTiered,
  type Pt2D,
  type ScaleAnchorInput,
  type ObjectSilhouette,
  type RgbaImage,
} from './single-view-metrology';

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

/* ── Camera synthetic — pinhole thuần, world Z-up, sàn z=0 ── */

type Vec3 = [number, number, number];
type Mat3 = [Vec3, Vec3, Vec3];

function matVec3(m: Mat3, v: Vec3): Vec3 {
  return [
    m[0][0] * v[0] + m[0][1] * v[1] + m[0][2] * v[2],
    m[1][0] * v[0] + m[1][1] * v[1] + m[1][2] * v[2],
    m[2][0] * v[0] + m[2][1] * v[1] + m[2][2] * v[2],
  ];
}
function matMul3(a: Mat3, b: Mat3): Mat3 {
  const r: number[][] = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) for (let k = 0; k < 3; k++) r[i][j] += a[i][k] * b[k][j];
  return r as Mat3;
}

const IMG_W = 1600;
const IMG_H = 1200;
const PP: Pt2D = { x: IMG_W / 2, y: IMG_H / 2 };
const F = 1400; // px
const CAM_HEIGHT_MM = 1550;
const CAM_C: Vec3 = [0, 0, CAM_HEIGHT_MM];

// Pitch 8° (xuống) quanh trục X + yaw 20° quanh trục Z world — GÓC XIÊN thật (không trục nào
// song song mặt phẳng ảnh), đúng tình huống ảnh thật. Camera pitch-only (yaw=0) là suy biến: world
// X khi đó vuông góc trục quang, điểm tụ của nó rơi ĐÚNG tại vô cực (chia cho 0) — không phải bug,
// là hình học thật, nhưng không phải cảnh test hữu ích (đã xác nhận bằng debug script trước khi
// thêm yaw — xem lịch sử: NaN chỉ biến mất sau khi thêm yaw).
const THETA = (8 * Math.PI) / 180;
const PSI = (20 * Math.PI) / 180;
const R_PITCH: Mat3 = [
  [1, 0, 0],
  [0, Math.sin(THETA), -Math.cos(THETA)],
  [0, Math.cos(THETA), Math.sin(THETA)],
];
const R_YAW: Mat3 = [
  [Math.cos(PSI), -Math.sin(PSI), 0],
  [Math.sin(PSI), Math.cos(PSI), 0],
  [0, 0, 1],
];
const R: Mat3 = matMul3(R_PITCH, R_YAW);

function projectPoint(world: Vec3): Pt2D | null {
  const rel: Vec3 = [world[0] - CAM_C[0], world[1] - CAM_C[1], world[2] - CAM_C[2]];
  const cam = matVec3(R, rel);
  if (cam[2] <= 0) return null;
  return { x: PP.x + (F * cam[0]) / cam[2], y: PP.y + (F * cam[1]) / cam[2] };
}

function projectDirection(dir: Vec3): Pt2D {
  const cam = matVec3(R, dir);
  return { x: PP.x + (F * cam[0]) / cam[2], y: PP.y + (F * cam[1]) / cam[2] };
}

/* ── [1] calibrateFromVanishingPoints() khôi phục ĐÚNG f + hướng camera từ 3 điểm tụ world-axis ── */
function testCalibrationRecoversKnownCamera() {
  console.log('\n[1] calibrateFromVanishingPoints() khôi phục đúng f + hướng camera (camera synthetic biết trước)');
  const vpX = projectDirection([1, 0, 0]); // world X — hướng NGANG 1
  const vpY = projectDirection([0, 1, 0]); // world Y — hướng NGANG 2
  const vpZ = projectDirection([0, 0, 1]); // world Z — hướng ĐỨNG

  const calib = calibrateFromVanishingPoints(vpZ, vpX, vpY, IMG_W, IMG_H);
  ok('calibrateFromVanishingPoints() không trả null', !!calib);
  if (!calib) return;
  console.log(`    f thật=${F} — f suy=${calib.focalLengthPx.toFixed(1)}`);
  ok('tiêu cự suy ra khớp thật trong 5%', Math.abs(calib.focalLengthPx - F) / F < 0.05);
  ok('confidence cao (>0.9) khi 3 điểm tụ trực giao hoàn hảo', calib.confidence > 0.9);

  // Kiểm hướng: R suy ra áp lên world Z phải cho ra hướng GẦN camera-frame giống R thật áp lên world Z.
  const camZ_true = matVec3(R, [0, 0, 1]);
  const camZ_est = matVec3(calib.rotationWorldToCam as Mat3, [0, 0, 1]);
  const dot = camZ_true[0] * camZ_est[0] + camZ_true[1] * camZ_est[1] + camZ_true[2] * camZ_est[2];
  console.log(`    dot(world Z thật, world Z suy) trong hệ camera = ${dot.toFixed(4)} (kỳ vọng ≈1)`);
  ok('hướng trục dọc suy ra khớp thật (dot > 0.98)', dot > 0.98);
}

/* ── [2] anchorScale() — nhiều nguồn khớp → tin; ảnh không neo → needsManualScale; lệch nhau → cảnh báo ── */
function calibForAnchorTests() {
  const vpX = projectDirection([1, 0, 0]);
  const vpY = projectDirection([0, 1, 0]);
  const vpZ = projectDirection([0, 0, 1]);
  return calibrateFromVanishingPoints(vpZ, vpX, vpY, IMG_W, IMG_H)!;
}

function testAnchorScaleThreeSourcesAgree() {
  console.log('\n[2a] anchorScale() — cameraHeight + cửa 2100mm cùng khung → khớp, tin cậy cao');
  const calib = calibForAnchorTests();

  // Cửa thật: đứng tại world (600, 2000, 0) tới (600, 2000, 2100mm) — cách camera 2m theo world Y.
  const doorBase: Vec3 = [600, 2000, 0];
  const doorTop: Vec3 = [600, 2000, 2100];
  const doorBaseImg = projectPoint(doorBase)!;
  const doorTopImg = projectPoint(doorTop)!;
  ok('cửa synthetic chiếu ra điểm ảnh hợp lệ (trong khung)', !!doorBaseImg && !!doorTopImg);

  const anchors: ScaleAnchorInput[] = [
    { kind: 'cameraHeight', realLengthMm: CAM_HEIGHT_MM, imagePoints: [{ x: 0, y: 0 }, { x: 0, y: 0 }], vertical: true },
    { kind: 'door', realLengthMm: 2100, imagePoints: [doorBaseImg, doorTopImg], vertical: true },
  ];
  const scale = anchorScale(calib, anchors);
  console.log(`    mmPerWorldUnit=${scale.mmPerWorldUnit.toFixed(1)} (kỳ vọng ≈${CAM_HEIGHT_MM}) — needsManualScale=${scale.needsManualScale}`);
  ok('2 nguồn khớp → KHÔNG cần chọn tay', !scale.needsManualScale);
  ok('mmPerWorldUnit khớp camera height trong 5%', Math.abs(scale.mmPerWorldUnit - CAM_HEIGHT_MM) / CAM_HEIGHT_MM < 0.05);
  ok('confidence cao khi 2 nguồn đồng thuận', scale.confidence >= 0.85);
  ok('cả 2 nguồn đều agreesWithinTolerance', scale.sources.every((s) => s.agreesWithinTolerance));
}

function testAnchorScaleNoAnchorNeedsManual() {
  console.log('\n[2b] anchorScale() — KHÔNG có neo nào → needsManualScale, KHÔNG đoán bừa');
  const calib = calibForAnchorTests();
  const scale = anchorScale(calib, []);
  ok('0 neo → needsManualScale=true', scale.needsManualScale === true);
  ok('0 neo → có reason giải thích', !!scale.reason && scale.reason.length > 0);
  ok('0 neo → mmPerWorldUnit=0 (không bịa số)', scale.mmPerWorldUnit === 0);
}

function testAnchorScaleDisagreeingSourcesWarns() {
  console.log('\n[2c] anchorScale() — 2 nguồn lệch nhau >5% → cảnh báo, KHÔNG tự chọn 1 nguồn');
  const calib = calibForAnchorTests();
  const doorBase: Vec3 = [600, 2000, 0];
  const doorTop: Vec3 = [600, 2000, 2100];
  const doorBaseImg = projectPoint(doorBase)!;
  const doorTopImg = projectPoint(doorTop)!;

  const anchors: ScaleAnchorInput[] = [
    { kind: 'cameraHeight', realLengthMm: CAM_HEIGHT_MM, imagePoints: [{ x: 0, y: 0 }, { x: 0, y: 0 }], vertical: true },
    // Khai SAI kích thước cửa thật (2600mm thay vì 2100mm thật của hình học) → 2 nguồn PHẢI lệch nhau nhiều.
    { kind: 'door', realLengthMm: 2600, imagePoints: [doorBaseImg, doorTopImg], vertical: true },
  ];
  const scale = anchorScale(calib, anchors);
  console.log(`    nguồn cameraHeight=${scale.sources[0]?.mmPerWorldUnit.toFixed(1)} vs door=${scale.sources[1]?.mmPerWorldUnit.toFixed(1)}`);
  ok('2 nguồn lệch >5% → needsManualScale=true', scale.needsManualScale === true);
  ok('có ít nhất 1 nguồn KHÔNG agreesWithinTolerance', scale.sources.some((s) => !s.agreesWithinTolerance));
  ok('reason nhắc tới lệch/xác nhận', /lệch|xác nhận/.test(scale.reason ?? ''));
}

function testAnchorScaleDepthMetricNeverDrivesDecision() {
  console.log('\n[2d] anchorScale() — depthMetric CHỈ kiểm chéo, KHÔNG BAO GIỜ tự làm nguồn chính (dù khớp 2 nguồn kia)');
  const calib = calibForAnchorTests();
  const doorBase: Vec3 = [600, 2000, 0];
  const doorTop: Vec3 = [600, 2000, 2100];
  const doorBaseImg = projectPoint(doorBase)!;
  const doorTopImg = projectPoint(doorTop)!;

  // 2 nguồn ĐO khớp nhau (cameraHeight+door), CỘNG 1 nguồn depthMetric CỐ Ý lệch xa (2× thật) —
  // nếu depthMetric lỡ lọt vào candidates chính, mean sẽ bị kéo lệch và cameraHeight/door sẽ báo
  // "không khớp" oan — kiểm depthMetric KHÔNG làm hỏng kết quả 2 nguồn đo thật.
  const anchors: ScaleAnchorInput[] = [
    { kind: 'cameraHeight', realLengthMm: CAM_HEIGHT_MM, imagePoints: [{ x: 0, y: 0 }, { x: 0, y: 0 }], vertical: true },
    { kind: 'door', realLengthMm: 2100, imagePoints: [doorBaseImg, doorTopImg], vertical: true },
    { kind: 'depthMetric', realLengthMm: CAM_HEIGHT_MM * 2, imagePoints: [{ x: 0, y: 0 }, { x: 0, y: 0 }], vertical: true },
  ];
  const scale = anchorScale(calib, anchors);
  console.log(`    mmPerWorldUnit=${scale.mmPerWorldUnit.toFixed(1)} — needsManualScale=${scale.needsManualScale}, 3 sources: ${scale.sources.map((s) => `${s.kind}=${s.mmPerWorldUnit.toFixed(0)}(${s.agreesWithinTolerance})`).join(', ')}`);
  ok('depthMetric lệch xa KHÔNG kéo cameraHeight/door thành needsManualScale', !scale.needsManualScale);
  ok('mmPerWorldUnit vẫn suy từ 2 nguồn đo thật (≈1550), KHÔNG bị depthMetric kéo lệch', Math.abs(scale.mmPerWorldUnit - CAM_HEIGHT_MM) / CAM_HEIGHT_MM < 0.05);
  const depthSource = scale.sources.find((s) => s.kind === 'depthMetric');
  ok('depthMetric có mặt trong sources (để hiển thị/kiểm chéo) nhưng agreesWithinTolerance=false (đúng — nó lệch thật)', !!depthSource && depthSource.agreesWithinTolerance === false);
}

/* ── [3] measureObject() — hộp world biết trước kích thước → sai số <5% ── */
function testMeasureObjectKnownBoxUnder5PercentError() {
  console.log('\n[3] measureObject() — hộp 600×400×800mm (R×S×C) → suy lại sai số <5%');
  const calib = calibForAnchorTests();
  const scale = anchorScale(calib, [
    { kind: 'cameraHeight', realLengthMm: CAM_HEIGHT_MM, imagePoints: [{ x: 0, y: 0 }, { x: 0, y: 0 }], vertical: true },
  ]);
  ok('scale từ cameraHeight đơn lẻ vẫn dùng được (không needsManualScale)', !scale.needsManualScale);

  // Hộp thật: rộng(X)=600mm, sâu(Y)=400mm, cao(Z)=800mm — đặt tâm world (0, 1800, ·), đối diện camera.
  const trueW = 600;
  const trueH = 800;
  const cx = 0;
  const cyFront = 1800; // mặt trước hộp cách camera 1.8m theo Y
  const leftBottom: Vec3 = [cx - trueW / 2, cyFront, 0];
  const rightBottom: Vec3 = [cx + trueW / 2, cyFront, 0];
  const topCenter: Vec3 = [cx, cyFront, trueH];

  const pLeft = projectPoint(leftBottom)!;
  const pRight = projectPoint(rightBottom)!;
  const pTop = projectPoint(topCenter)!;
  ok('3 điểm hộp chiếu ra ảnh hợp lệ', !!pLeft && !!pRight && !!pTop);

  // Mặt nạ front = hình chữ nhật xấp xỉ mặt trước hộp (4 góc, đáy=leftBottom/rightBottom, đỉnh khớp pTop.y).
  const front: Pt2D[] = [
    { x: pLeft.x, y: pLeft.y },
    { x: pRight.x, y: pRight.y },
    { x: pRight.x, y: pTop.y },
    { x: pLeft.x, y: pTop.y },
  ];
  const silhouette: ObjectSilhouette = { front };
  const m = measureObject(calib, scale, silhouette);

  console.log(`    Rộng thật=${trueW}mm — suy=${m.width.valueMm.toFixed(1)}mm (±${m.width.toleranceMm.toFixed(1)})`);
  console.log(`    Cao thật=${trueH}mm — suy=${m.height.valueMm.toFixed(1)}mm (±${m.height.toleranceMm.toFixed(1)})`);
  console.log(`    Sâu (SUY, không có mặt bên): ${m.depth.valueMm.toFixed(1)}mm, kind=${m.depth.kind}`);

  ok('width.kind = measured (🟢)', m.width.kind === 'measured');
  ok('height.kind = measured (🟢)', m.height.kind === 'measured');
  ok('depth.kind = inferred (🟡) — không có mặt bên trong mặt nạ', m.depth.kind === 'inferred');
  ok('Rộng suy sai số < 5%', Math.abs(m.width.valueMm - trueW) / trueW < 0.05);
  ok('Cao suy sai số < 5%', Math.abs(m.height.valueMm - trueH) / trueH < 0.05);
  ok('mỗi số đều có basis (kiểm được nguồn)', !!m.width.basis && !!m.height.basis && !!m.depth.basis);
}

/* ── phụ: vanishingPointFromLines() — bình phương tối thiểu đúng cho cụm đường hội tụ biết trước ── */
function testVanishingPointFromLinesMatchesKnownVP() {
  console.log('\n[4] vanishingPointFromLines() — cụm đường hội tụ về đúng điểm tụ world X đã biết');
  const vpTrue = projectDirection([1, 0, 0]);
  // Sinh 5 đoạn thẳng ảnh "đi qua" vpTrue từ 5 điểm gốc khác nhau trên sàn (world X, các world Y khác nhau).
  const lines = [1000, 1400, 1800, 2200, 2600].map((y) => {
    const p0 = projectPoint([-300, y, 0])!;
    const p1 = projectPoint([300, y, 0])!;
    return { a: p0, b: p1 };
  });
  const result = vanishingPointFromLines(lines);
  ok('vanishingPointFromLines() không null', !!result);
  if (!result) return;
  const dist = Math.hypot(result.vp.x - vpTrue.x, result.vp.y - vpTrue.y);
  console.log(`    VP thật=(${vpTrue.x.toFixed(1)},${vpTrue.y.toFixed(1)}) — VP suy=(${result.vp.x.toFixed(1)},${result.vp.y.toFixed(1)}), cách ${dist.toFixed(2)}px`);
  ok('điểm tụ suy ra cách điểm tụ thật < 2px (5 đường hình học chính xác, không nhiễu)', dist < 2);
}

/* ── [5] measureObjectTiered() — 30/07 sửa: KHÔNG BAO GIỜ "tay không", kể cả ảnh mềm/1 màu ── */

/** Ảnh gradient mượt, KHÔNG có cạnh thẳng nào — mô phỏng render nội thất đẹp (rèm/thảm cong/ánh
 * sáng loang) mà Hoà chỉ ra: Sobel không dò được biên rõ ⇒ Hough không đủ đường ⇒
 * `calibrateFromImage()` phải trả `needsManualScale`, KHÔNG throw. */
function softGradientImage(w: number, h: number): RgbaImage {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const v = 180 + Math.round(20 * Math.sin(x / 37) * Math.cos(y / 53)); // biến thiên rất mượt, không biên
      data[i] = v;
      data[i + 1] = v - 5;
      data[i + 2] = v - 10;
      data[i + 3] = 255;
    }
  }
  return { width: w, height: h, data };
}

/** Ảnh nền trắng đều tuyệt đối + 1 khối màu tương phản — mô phỏng ảnh sản phẩm/nền phẳng
 * catalogue: `extractForeground()` tách được (viền đồng màu), nhưng KHÔNG có cạnh kiến trúc nào
 * cho vanishing-point calibration (chỉ có 1 khối, không phải cảnh nội thất). */
function flatBackgroundWithObjectImage(w: number, h: number): RgbaImage {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const inObj = x > w * 0.3 && x < w * 0.7 && y > h * 0.4 && y < h * 0.8;
      const v = inObj ? 60 : 245;
      data[i] = v;
      data[i + 1] = v;
      data[i + 2] = v;
      data[i + 3] = 255;
    }
  }
  return { width: w, height: h, data };
}

function testSoftImageNoStraightEdgesStillReturnsNumbers() {
  console.log('\n[5a] Ảnh render mềm KHÔNG cạnh thẳng — measureObjectTiered() PHẢI ra số, không lỗi');
  const image = softGradientImage(640, 480);
  const silhouette: ObjectSilhouette = {
    front: [{ x: 200, y: 200 }, { x: 400, y: 200 }, { x: 400, y: 380 }, { x: 200, y: 380 }],
  };
  const result = measureObjectTiered({ category: 'sofa3', silhouette, image, cameraHeightMm: 1550 });
  console.log(`    tier=${result.tier} (${result.tierLabel}) — width=${result.width.valueMm.toFixed(0)}mm, height=${result.height.valueMm.toFixed(0)}mm, confidence=${result.confidencePercent}%`);
  ok('width.valueMm là số hữu hạn > 0 (không phải NaN/0/undefined)', Number.isFinite(result.width.valueMm) && result.width.valueMm > 0);
  ok('height.valueMm là số hữu hạn > 0', Number.isFinite(result.height.valueMm) && result.height.valueMm > 0);
  ok('depth.valueMm là số hữu hạn > 0', Number.isFinite(result.depth.valueMm) && result.depth.valueMm > 0);
  ok('tụt xuống phương pháp ≤2 (không có cạnh thẳng ⇒ không đạt bậc 4/3)', result.tier <= 2);
  ok('needsManualAnchor=true (gợi ý khoanh vật neo để tăng độ tin)', result.needsManualAnchor === true);
  ok('confidencePercent là số hợp lệ 0-100', result.confidencePercent >= 0 && result.confidencePercent <= 100);
}

function testWhiteBackgroundSingleObjectReachesTier1Or2() {
  console.log('\n[5b] Ảnh nền trắng 1 món — phải ra số ở bậc 1 hoặc 2');
  const image = flatBackgroundWithObjectImage(640, 480);
  // KHÔNG truyền silhouette — mô phỏng trường hợp còn chưa tách được món (mới có ảnh gốc).
  const resultNoSilhouette = measureObjectTiered({ category: 'coffeeTable', image, cameraHeightMm: 1550 });
  ok('không silhouette → tier 1 (chỉ dải chuẩn nghề)', resultNoSilhouette.tier === 1);
  ok('vẫn ra số hữu hạn > 0', Number.isFinite(resultNoSilhouette.width.valueMm) && resultNoSilhouette.width.valueMm > 0);

  // CÓ silhouette (giả lập đã tách được món) nhưng ảnh không đủ cạnh kiến trúc để lên bậc 3/4.
  const silhouette: ObjectSilhouette = {
    front: [{ x: 192, y: 192 }, { x: 448, y: 192 }, { x: 448, y: 384 }, { x: 192, y: 384 }],
  };
  const resultWithSilhouette = measureObjectTiered({ category: 'coffeeTable', silhouette, image, cameraHeightMm: 1550 });
  console.log(`    không mặt nạ: tier=${resultNoSilhouette.tier} · có mặt nạ: tier=${resultWithSilhouette.tier}`);
  ok('có silhouette (đã tách món) → tier 1 hoặc 2, đúng yêu cầu', resultWithSilhouette.tier === 1 || resultWithSilhouette.tier === 2);
  ok('có mặt nạ → width vẫn số hữu hạn > 0', Number.isFinite(resultWithSilhouette.width.valueMm) && resultWithSilhouette.width.valueMm > 0);
}

function testNoImageEverReturnsCannotMeasure() {
  console.log('\n[5c] KHÔNG có ảnh nào cho ra "không đo được" — kể cả 0 tham số ngoài category');
  const result = measureObjectTiered({ category: 'other' });
  ok('0 ảnh, 0 mặt nạ, 0 neo → vẫn trả object hợp lệ (không null/undefined/throw)', !!result);
  ok('width/depth/height đều có valueMm số hữu hạn > 0', [result.width, result.depth, result.height].every((v) => Number.isFinite(v.valueMm) && v.valueMm > 0));
  ok('tier = 1 (đáy — chỉ còn dải chuẩn nghề)', result.tier === 1);
  ok('mọi giá trị đều kind hợp lệ (measured/inferred, không rỗng)', [result.width, result.depth, result.height].every((v) => v.kind === 'measured' || v.kind === 'inferred'));
}

function testManualAnchorReachesTier3() {
  console.log('\n[5d] Neo tay 2 điểm (vd giường 1600mm) → lên bậc 3, W/H measured');
  const image = softGradientImage(640, 480); // ảnh không đủ cạnh thẳng — bậc 4 vẫn fail
  const silhouette: ObjectSilhouette = {
    front: [{ x: 260, y: 300 }, { x: 380, y: 300 }, { x: 380, y: 400 }, { x: 260, y: 400 }],
  };
  const result = measureObjectTiered({
    category: 'nightstand',
    silhouette,
    image,
    manualAnchor: { kind: 'bed', points: [{ x: 100, y: 350 }, { x: 500, y: 350 }], realMm: 1600 },
  });
  console.log(`    tier=${result.tier} — width=${result.width.valueMm.toFixed(0)}mm (kind=${result.width.kind})`);
  ok('có neo tay → tier 3', result.tier === 3);
  ok('width.kind = measured nhờ neo tay', result.width.kind === 'measured');
  ok('height.kind = measured nhờ neo tay', result.height.kind === 'measured');
  ok('depth vẫn inferred (neo tay không giải quyết được chiều sâu)', result.depth.kind === 'inferred');
}

function main() {
  testCalibrationRecoversKnownCamera();
  testAnchorScaleThreeSourcesAgree();
  testAnchorScaleNoAnchorNeedsManual();
  testAnchorScaleDisagreeingSourcesWarns();
  testAnchorScaleDepthMetricNeverDrivesDecision();
  testMeasureObjectKnownBoxUnder5PercentError();
  testVanishingPointFromLinesMatchesKnownVP();
  testSoftImageNoStraightEdgesStillReturnsNumbers();
  testWhiteBackgroundSingleObjectReachesTier1Or2();
  testNoImageEverReturnsCannotMeasure();
  testManualAnchorReachesTier3();
  console.log(`\n${pass} ok, ${fail} fail`);
  if (fail > 0) process.exit(1);
}

main();
