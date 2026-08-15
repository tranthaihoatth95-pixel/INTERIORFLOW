/**
 * lib/vision/horizon.test.ts — HZ, 15/08. Tất định, không cần ảnh thật — dùng lại ĐÚNG kiểu camera
 * synthetic của `single-view-metrology.test.ts` (chiếu hướng world qua camera pinhole biết trước
 * ra điểm tụ ảnh) để có 1 `CameraCalib` hợp lệ, thật, không phải fixture bịa tay.
 *
 * Chạy: node_modules/.bin/sucrase-node lib/vision/horizon.test.ts
 */
import { calibrateFromVanishingPoints, type Pt2D, type CameraCalib } from './single-view-metrology';
import {
  horizonFromCalib,
  applyUserHorizon,
  horizonConfidenceLabel,
  addGuideLine,
  updateGuideLineEndpoint,
  removeGuideLine,
  canAddGuideLine,
  MAX_GUIDE_LINES,
  type GuideLine,
} from './horizon';

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

/* ── Camera synthetic — copy nguyên khối math từ single-view-metrology.test.ts (Đ2: tái dùng
   cách dựng cảnh đã kiểm chứng, không phát minh cảnh test mới) ── */
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
const F = 1400;
const CAM_HEIGHT_MM = 1550;
const CAM_C: Vec3 = [0, 0, CAM_HEIGHT_MM];
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
function projectDirection(dir: Vec3): Pt2D {
  const cam = matVec3(R, dir);
  return { x: PP.x + (F * cam[0]) / cam[2], y: PP.y + (F * cam[1]) / cam[2] };
}
function syntheticCalib(): CameraCalib {
  const vpX = projectDirection([1, 0, 0]); // horizA
  const vpY = projectDirection([0, 1, 0]); // horizB
  const vpZ = projectDirection([0, 0, 1]); // vertical
  const calib = calibrateFromVanishingPoints(vpZ, vpX, vpY, IMG_W, IMG_H);
  if (!calib) throw new Error('setup hỏng — calib synthetic phải hợp lệ (đã kiểm ở single-view-metrology.test.ts)');
  return calib;
}

/* ── [1] Ảnh đủ 2 điểm tụ ngang → ra đường, source='derived', confidence = calib.confidence ── */
function testDerivedFromValidCalib() {
  console.log('\n[1] horizonFromCalib() — calib hợp lệ (2 điểm tụ ngang) → ra đường chân trời');
  const calib = syntheticCalib();
  const h = horizonFromCalib(calib);
  ok('không trả null khi calib hợp lệ', !!h);
  if (!h) return;
  ok("source='derived'", h.source === 'derived');
  ok('confidence = calib.confidence (không tính lại riêng)', h.confidence === calib.confidence);
  ok('y0 là số hữu hạn', Number.isFinite(h.y0));
  ok('y1 là số hữu hạn', Number.isFinite(h.y1));
  // Đường nối 2 điểm tụ ngang của 1 camera pitch 8°/yaw 20° phải nằm GẦN vùng ảnh hợp lý
  // (không đòi trong [0,1] chặt — camera có thể tilt để chân trời ở ngoài khung, đúng hình học).
  console.log(`    y0=${h.y0.toFixed(3)} y1=${h.y1.toFixed(3)} confidence=${h.confidence.toFixed(3)}`);
  ok('confidence trong [0,1]', h.confidence >= 0 && h.confidence <= 1);
}

/* ── [2] Ảnh thiếu dữ kiện → trả null, KHÔNG đoán ── */
function testMissingCalibReturnsNull() {
  console.log('\n[2] horizonFromCalib() — thiếu calib/suy biến → null, cấm đoán');
  ok('calib=null → null', horizonFromCalib(null) === null);
  ok('calib=undefined → null', horizonFromCalib(undefined) === null);

  // 2 điểm tụ ngang trùng hoành độ (camera roll ~90°) — suy biến, không biểu diễn được bằng
  // {y tại x=0, y tại x=W}. Fixture DỮ LIỆU thuần (không gọi lại thuật toán calibrate) — chỉ để
  // kiểm nhánh bảo vệ của horizonFromCalib, không kiểm calibrateFromVanishingPoints (đã có test riêng).
  const degenerate: CameraCalib = {
    focalLengthPx: 1400,
    principalPoint: { x: 800, y: 600 },
    rotationWorldToCam: [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ],
    vanishingPoints: { vertical: { x: 800, y: -5000 }, horizA: { x: 500, y: 100 }, horizB: { x: 500, y: 900 } },
    imageWidth: 1600,
    imageHeight: 1200,
    confidence: 0.9,
  };
  ok('horizA.x === horizB.x (suy biến) → null', horizonFromCalib(degenerate) === null);
}

/* ── [3] Đè tay → source:'user', confidence=1, kẹp [0,1] ── */
function testUserOverride() {
  console.log("\n[3] applyUserHorizon() — đè tay → source='user', thắng máy");
  const line = applyUserHorizon({ y0: 0.3, y1: 0.42 });
  ok("source='user'", line.source === 'user');
  ok('confidence=1 (người xác nhận, không phải máy đoán)', line.confidence === 1);
  ok('giữ đúng y0 trong khoảng hợp lệ', Math.abs(line.y0 - 0.3) < 1e-9);
  ok('giữ đúng y1 trong khoảng hợp lệ', Math.abs(line.y1 - 0.42) < 1e-9);

  const clamped = applyUserHorizon({ y0: -0.4, y1: 1.8 });
  ok('kẹp y0 về 0 khi kéo ra ngoài mép trên', clamped.y0 === 0);
  ok('kẹp y1 về 1 khi kéo ra ngoài mép dưới', clamped.y1 === 1);
}

/* ── [4] Lùi lại được về bản suy ra — calib gốc KHÔNG bị đè-tay đụng vào, gọi lại vẫn ra y hệt ── */
function testResetBackToDerived() {
  console.log('\n[4] lùi lại — applyUserHorizon() KHÔNG mutate calib gốc, horizonFromCalib(calib) gọi lại vẫn ra derived y hệt');
  const calib = syntheticCalib();
  const before = horizonFromCalib(calib);
  ok('có đường suy ra trước khi đè tay', !!before);

  const userLine = applyUserHorizon({ y0: 0.1, y1: 0.15 });
  ok('đè tay xong đúng là user', userLine.source === 'user');

  const after = horizonFromCalib(calib); // "lùi lại" = gọi lại đúng calib gốc
  ok('lùi lại → source trở về derived', after?.source === 'derived');
  ok('lùi lại → y0 giống hệt bản suy ra ban đầu (calib không bị mutate)', after?.y0 === before?.y0);
  ok('lùi lại → y1 giống hệt bản suy ra ban đầu (calib không bị mutate)', after?.y1 === before?.y1);
  ok('lùi lại → confidence giống hệt bản suy ra ban đầu', after?.confidence === before?.confidence);
}

/* ── [5] Nhãn độ tin cậy — chữ người đọc được, CẤM chữ "tự động" ── */
function testConfidenceLabelWording() {
  console.log('\n[5] horizonConfidenceLabel() — cấm chữ "tự động", có số % khi derived');
  const high = horizonFromCalib(syntheticCalib())!;
  const labelHigh = horizonConfidenceLabel(high);
  ok('nhãn derived không chứa "tự động"', !labelHigh.includes('tự động'));
  ok('nhãn derived có số phần trăm', /%/.test(labelHigh));

  const userLabel = horizonConfidenceLabel(applyUserHorizon({ y0: 0.2, y1: 0.2 }));
  ok('nhãn user không chứa "tự động"', !userLabel.includes('tự động'));
  ok('nhãn user nói rõ đã chỉnh tay', /tay/.test(userLabel));

  const lowConf = horizonConfidenceLabel({ y0: 0.5, y1: 0.5, source: 'derived', confidence: 0.1 });
  ok('nhãn tin cậy thấp không chứa "tự động"', !lowConf.includes('tự động'));
  ok('nhãn tin cậy thấp có gợi ý kiểm lại', /kiểm lại/.test(lowConf));
}

/* ── [6] Đường gióng phụ — tối đa 4, thêm/sửa/xoá thuần, không mutate mảng gốc ── */
function testGuideLines() {
  console.log('\n[6] đường gióng phụ — trần MAX_GUIDE_LINES=4, thao tác thuần (immutable)');
  ok('MAX_GUIDE_LINES = 4', MAX_GUIDE_LINES === 4);
  let lines: GuideLine[] = [];
  for (let i = 0; i < 4; i++) {
    ok(`canAddGuideLine() còn chỗ ở lượt ${i + 1}`, canAddGuideLine(lines));
    const before = lines;
    lines = addGuideLine(lines, { id: `g${i}`, a: { x: 0, y: i }, b: { x: 100, y: i } });
    ok(`thêm đường ${i + 1} → mảng dài ${i + 1}`, lines.length === i + 1);
    ok('không mutate mảng cũ (thuần)', before.length === i);
  }
  ok('đủ 4 đường → canAddGuideLine() = false', canAddGuideLine(lines) === false);
  const overflowed = addGuideLine(lines, { id: 'g4', a: { x: 0, y: 0 }, b: { x: 1, y: 1 } });
  ok('thêm đường thứ 5 → bị chặn, mảng KHÔNG đổi (không tự xoá bớt âm thầm)', overflowed.length === 4 && overflowed === lines);

  const moved = updateGuideLineEndpoint(lines, 'g1', 'a', { x: 42, y: 42 });
  ok('sửa đầu a của g1', moved.find((l) => l.id === 'g1')?.a.x === 42);
  ok('g1.b không đổi', moved.find((l) => l.id === 'g1')?.b.y === 1);
  ok('đường khác không đổi', moved.find((l) => l.id === 'g0')?.a.y === 0);

  const removed = removeGuideLine(lines, 'g2');
  ok('xoá g2 → còn 3 đường', removed.length === 3);
  ok('g2 không còn trong mảng', !removed.some((l) => l.id === 'g2'));
  ok('canAddGuideLine() lại true sau khi xoá bớt', canAddGuideLine(removed) === true);
}

function main() {
  testDerivedFromValidCalib();
  testMissingCalibReturnsNull();
  testUserOverride();
  testResetBackToDerived();
  testConfidenceLabelWording();
  testGuideLines();
  console.log(`\n${pass} ok, ${fail} fail`);
  if (fail > 0) process.exit(1);
}

main();
