/**
 * lib/vision/hough-line.test.ts — T, 15/08. Chốt cái bug mà HZ phát hiện và T xác minh:
 * `detectLineSegments()` vote bằng góc TIẾP TUYẾN nhưng tính rho bằng công thức của góc PHÁP
 * TUYẾN ⇒ điểm trên cùng một đường rải khắp bin, không đỉnh nào hình thành, hàm luôn trả rỗng.
 *
 * VÌ SAO BUG SỐNG LÂU: test cũ duy nhất chạm tới đường này
 * (`single-view-metrology.test.ts:262`) lại KHẲNG ĐỊNH `calibrateFromImage()` trả
 * `needsManualScale` — tức nó ghi nhận ĐÚNG hành vi hỏng làm kỳ vọng. Test xanh, bug vẫn sống.
 * File này kiểm THẲNG `detectLineSegments` bằng ảnh tự dựng có đường thẳng biết trước, nên
 * không thể xanh giả lần nữa.
 */

import { detectLineSegments } from './single-view-metrology';

let pass = 0;
let fail = 0;
function ok(name: string, cond: boolean) {
  if (cond) { pass++; console.log(`  ok  - ${name}`); }
  else { fail++; console.log(`  FAIL - ${name}`); }
}

/** Ảnh xám trên nền trắng: vẽ 1 vạch đen dày `thick` px theo đường y = m·x + b. */
function imgWithLine(w: number, h: number, m: number, b: number, thick = 2) {
  const data = new Uint8ClampedArray(w * h * 4).fill(255);
  for (let x = 0; x < w; x++) {
    const y0 = Math.round(m * x + b);
    for (let t = 0; t < thick; t++) {
      const y = y0 + t;
      if (y < 0 || y >= h) continue;
      const i = (y * w + x) * 4;
      data[i] = 0; data[i + 1] = 0; data[i + 2] = 0;
    }
  }
  return { width: w, height: h, data };
}

/** Ảnh có 1 vạch NGANG và 1 vạch DỌC — ca tối thiểu của "khung phòng". */
function imgCross(w: number, h: number) {
  const data = new Uint8ClampedArray(w * h * 4).fill(255);
  const yRow = Math.floor(h * 0.6);
  for (let x = 0; x < w; x++) for (let t = 0; t < 2; t++) {
    const i = ((yRow + t) * w + x) * 4; data[i] = 0; data[i + 1] = 0; data[i + 2] = 0;
  }
  const xCol = Math.floor(w * 0.35);
  for (let y = 0; y < h; y++) for (let t = 0; t < 2; t++) {
    const i = (y * w + xCol + t) * 4; data[i] = 0; data[i + 1] = 0; data[i + 2] = 0;
  }
  return { width: w, height: h, data };
}

/** Góc đoạn thẳng (độ, 0..180). */
function angDeg(l: { a: { x: number; y: number }; b: { x: number; y: number } }) {
  const a = (Math.atan2(l.b.y - l.a.y, l.b.x - l.a.x) * 180) / Math.PI;
  return ((a % 180) + 180) % 180;
}

console.log('detectLineSegments — Hough phải dò được đường (bug rho dùng tiếp tuyến, sửa 15/08)');
{
  // ① Ca xương sống: một vạch ngang thẳng. Bản LỖI trả [] ở đây.
  const lines = detectLineSegments(imgWithLine(160, 120, 0, 70), { maxLines: 8 });
  ok('ảnh có 1 vạch NGANG → dò ra ít nhất 1 đoạn (bản lỗi trả rỗng)', lines.length >= 1);
  const near0 = lines.filter((l) => { const d = angDeg(l); return d < 8 || d > 172; });
  ok('đoạn dò được đúng phương NGANG (±8°)', near0.length >= 1);
  if (near0.length) {
    const ys = [near0[0].a.y, near0[0].b.y];
    ok('đoạn nằm đúng cao độ vạch đã vẽ (y≈70, sai số ≤4px)', ys.every((y) => Math.abs(y - 70) <= 4));
    ok('đoạn trải hết bề ngang ảnh (≥60% chiều rộng)', Math.abs(near0[0].b.x - near0[0].a.x) >= 160 * 0.6);
  }
}
{
  // ② Đường xiên — kiểm rho/theta còn khớp nhau ở góc bất kỳ, không chỉ 0°/90°.
  const lines = detectLineSegments(imgWithLine(160, 160, 0.5, 20), { maxLines: 8 });
  const near = lines.filter((l) => Math.abs(angDeg(l) - 26.57) < 8); // atan(0.5)=26.57°
  ok('vạch xiên hệ số 0,5 → dò ra đoạn đúng phương (±8°)', near.length >= 1);
}
{
  // ③ Hai phương cùng lúc — điều kiện tối thiểu để calibrateFromImage có cái mà gom cụm.
  const lines = detectLineSegments(imgCross(160, 160), { maxLines: 12 });
  const horiz = lines.filter((l) => { const d = angDeg(l); return d < 12 || d > 168; });
  const vert = lines.filter((l) => Math.abs(angDeg(l) - 90) < 12);
  ok('ảnh chữ thập → dò ra CẢ đường ngang lẫn đường dọc', horiz.length >= 1 && vert.length >= 1);
}
{
  // ④ Ảnh trắng trơn KHÔNG được đẻ đường ma — chống "sửa quá tay" thành dò bừa.
  const blank = { width: 120, height: 120, data: new Uint8ClampedArray(120 * 120 * 4).fill(255) };
  ok('ảnh trắng trơn → KHÔNG dò ra đường nào (không bịa)', detectLineSegments(blank).length === 0);
}

console.log(`\n${pass} pass · ${fail} fail`);
if (fail > 0) process.exit(1);
