/**
 * lib/three/uv-chieu-hop.test.ts — CANH PHÉP CHIẾU HỘP + đoạn dây `geometryOf → uv`.
 *
 * ⛔ VÌ SAO TỆP NÀY PHẢI TỒN TẠI, nói thẳng: thiếu `uv` là loại lỗi **im lặng tuyệt đối** — đo trên
 * WebGL thật 05/09 cho thấy `material.map` trên hình học không `uv` ra ĐÚNG MỘT MÀU toàn mặt và
 * KHÔNG ném lỗi nào. `tsc` sạch, test cũ xanh, ảnh chụp "trông như cũ". Không có test này thì
 * không có gì canh: một lần ai đó dựng `BufferGeometry` bỏ quên `uv` là cả app lặng lẽ phẳng lại.
 *
 * Ca ĐẮT NHẤT ở đây là "10 chu kỳ" — nó kiểm **tỉ lệ vật lý**, thứ mà mắt không phán được trên ảnh
 * gỗ (một mảng nâu sai tỉ lệ vẫn "trông như gỗ") nhưng máy đếm được chính xác.
 *
 * Chạy: node_modules/.bin/sucrase-node lib/three/uv-chieu-hop.test.ts
 */
import { chieuHopUv } from './uv-chieu-hop';
import { boxPositionsMm } from './cad-to-obj';
import { geometryOf } from './build-ops';
import { uvRepeatOf } from './pbr-three';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean, chiTiet?: string) {
  if (cond) {
    pass += 1;
    console.log(`  ok  - ${label}`);
  } else {
    fail += 1;
    console.log(`  FAIL - ${label}${chiTiet ? ` — ${chiTiet}` : ''}`);
  }
}

/* ─────────── ① ĐỘ DÀI + KHÔNG NaN ─────────── */
console.log('chieuHopUv — hình dạng mảng ra và tính hữu hạn');

const tuong = boxPositionsMm([{ x: 0, y: 0 }, { x: 4000, y: 0 }, { x: 4000, y: 200 }, { x: 0, y: 200 }], 0, 2700);
const uvTuong = chieuHopUv(tuong);
ok('mỗi 3 số vị trí ra đúng 2 số uv', uvTuong.length === (tuong.length / 3) * 2, `${uvTuong.length} vs ${(tuong.length / 3) * 2}`);
ok('không có NaN/Infinity nào lọt ra', Array.from(uvTuong).every((n) => Number.isFinite(n)));

// Tam giác suy biến (3 đỉnh trùng nhau) — pháp tuyến 0. Một NaN ở đây là cả mesh biến mất, im lặng.
const suyBien = chieuHopUv([1, 1, 1, 1, 1, 1, 1, 1, 1]);
ok('tam giác suy biến vẫn ra số hữu hạn, không NaN', Array.from(suyBien).every((n) => Number.isFinite(n)));
ok('mảng rỗng ra mảng rỗng', chieuHopUv([]).length === 0);

/* ─────────── ② TỈ LỆ VẬT LÝ — ca đắt nhất ─────────── */
console.log('\ntỉ lệ vật lý — tường 4000 mm với bước vân 400 mm phải đếm ĐÚNG 10 chu kỳ');

// Mặt lớn của bức tường trên nằm vuông góc trục Z (three.js), trải theo X: 0 → 4 m.
// `uvRepeatOf({uvScaleMm:{w:400,h:400}})` = 1000/400 = 2,5 chu kỳ trên mỗi đơn vị UV.
// Đơn vị UV là MÉT ⇒ 4 m × 2,5 = 10 chu kỳ. Nếu ai đó "chuẩn hoá UV về 0..1" thì số này tụt về 2,5
// và ca này đỏ — đó chính là việc nó sinh ra để canh.
/* 🔧 SỬA CÁCH ĐO — lần viết đầu tệp này đo max−min trên TOÀN khối và ra 8 chứ không phải 4. Không
   phải phép chiếu sai: một bức tường là khối hộp kín, mặt trước (pháp tuyến −Z) cho u = −x trải
   −4…0 còn mặt sau (+Z) cho u = +x trải 0…4 — đúng như quy ước không-lật-gương đòi hỏi. Gộp cả
   hai mặt lại rồi trừ đầu-cuối là đo một con số không có nghĩa vật lý nào.
   ⇒ Phải đo TỪNG MẶT. Giữ lại ghi chú này vì đây đúng loại nhầm mà nghiệm thu "một ô xanh" hay mắc:
   con số ra đẹp hay xấu đều không nói lên điều gì nếu đo sai đối tượng. */
function nhipTheoMat(positions: number[], phapTuyen: [number, number, number]): { u: number; v: number } {
  let minU = Infinity, maxU = -Infinity, minV = Infinity, maxV = -Infinity;
  const uv = chieuHopUv(positions);
  for (let t = 0; t + 8 < positions.length; t += 9) {
    const e1 = [positions[t + 3] - positions[t], positions[t + 4] - positions[t + 1], positions[t + 5] - positions[t + 2]];
    const e2 = [positions[t + 6] - positions[t], positions[t + 7] - positions[t + 1], positions[t + 8] - positions[t + 2]];
    const n = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
    const len = Math.hypot(n[0], n[1], n[2]) || 1;
    const cham = (n[0] * phapTuyen[0] + n[1] * phapTuyen[1] + n[2] * phapTuyen[2]) / len;
    if (cham < 0.99) continue; // chỉ lấy tam giác của ĐÚNG mặt đang hỏi
    const o = (t / 9) * 6;
    for (let k = 0; k < 3; k++) {
      minU = Math.min(minU, uv[o + k * 2]); maxU = Math.max(maxU, uv[o + k * 2]);
      minV = Math.min(minV, uv[o + k * 2 + 1]); maxV = Math.max(maxV, uv[o + k * 2 + 1]);
    }
  }
  return { u: maxU - minU, v: maxV - minV };
}

// Mặt lớn quay về phía −Z của three.js (= phía −Y trong CAD, cạnh dài 4000 mm của tường).
const matLon = nhipTheoMat(tuong, [0, 0, -1]);
const [repeatU, repeatV] = uvRepeatOf({ uvScaleMm: { w: 400, h: 400 } });
const soChuKyNgang = matLon.u * repeatU;
const soChuKyDoc = matLon.v * repeatV;
ok('nhịp u của MẶT LỚN trải đúng 4,0 đơn vị UV (= 4 m)', Math.abs(matLon.u - 4) < 1e-6, `nhịp=${matLon.u}`);
ok('đếm được ĐÚNG 10 chu kỳ vân ngang tường 4000 mm', Math.abs(soChuKyNgang - 10) < 1e-6, `đếm=${soChuKyNgang}`);
ok('nhịp v của mặt lớn = 2,7 (tường cao 2700 mm)', Math.abs(matLon.v - 2.7) < 1e-6, `nhịp=${matLon.v}`);
ok('đếm được 6,75 chu kỳ vân dọc tường 2700 mm', Math.abs(soChuKyDoc - 6.75) < 1e-6 /* dung sai float32: uv lưu Float32Array */, `đếm=${soChuKyDoc}`);

// Mặt đầu hồi (dày 200 mm, pháp tuyến +X) — cùng bước vân 400 mm ⇒ nửa chu kỳ. Kiểm ca này vì nó
// chứng minh tỉ lệ đến từ KÍCH THƯỚC THẬT chứ không từ "mỗi mặt một ảnh trải 0..1".
const matHoi = nhipTheoMat(tuong, [1, 0, 0]);
ok('mặt đầu hồi dày 200 mm chỉ được 0,5 chu kỳ', Math.abs(matHoi.u * repeatU - 0.5) < 1e-6, `đếm=${matHoi.u * repeatU}`);

/* ─────────── ③ CHỌN TRỤC THEO PHÁP TUYẾN ─────────── */
console.log('\nchọn trục trội — mặt nằm và mặt đứng KHÔNG được dùng chung một phép chiếu');

// Mặt nằm (sàn) ngửa lên: pháp tuyến +Y ⇒ trục trội Y ⇒ (u,v) = (x, −z). v phải đổi theo Z, KHÔNG
// đứng yên. Đây đúng ca mà "planar một trục" hỏng: chiếu theo Z thì sàn co thành một vệt.
const san = chieuHopUv([0, 0, 0, 2, 0, 0, 2, 0, -3]);
const sanV = [san[1], san[3], san[5]];
ok('sàn nằm ngang: v biến thiên theo Z, không bẹp thành 0', Math.max(...sanV) - Math.min(...sanV) > 0.5, JSON.stringify(sanV));
ok('sàn nằm ngang: u lấy theo X', Math.abs(san[0] - 0) < 1e-6 && Math.abs(san[2] - 2) < 1e-6);

// Mặt đứng vuông góc X (pháp tuyến +X) ⇒ (u,v) = (−z, y). u phải đổi theo Z.
const macX = chieuHopUv([0, 0, 0, 0, 2, 0, 0, 2, -3]);
const macXU = [macX[0], macX[2], macX[4]];
ok('mặt đứng ⟂X: u biến thiên theo Z', Math.max(...macXU) - Math.min(...macXU) > 0.5, JSON.stringify(macXU));
ok('mặt đứng ⟂X: v lấy theo Y', Math.abs(macX[1] - 0) < 1e-6 && Math.abs(macX[3] - 2) < 1e-6);

/* ─────────── ④ KHÔNG LẬT GƯƠNG ─────────── */
console.log('\nkhông lật gương — nhìn thẳng vào mặt thì u tăng sang phải');

// Mặt +Z nhìn từ +Z: phải màn hình = +X ⇒ u phải TĂNG theo x.
const matZDuong = chieuHopUv([0, 0, 0, 1, 0, 0, 1, 1, 0]);
ok('mặt +Z: u tăng cùng chiều X', matZDuong[2] > matZDuong[0]);
// Mặt −Z nhìn từ −Z: phải màn hình = −X ⇒ u phải GIẢM theo x. Sai dấu ở đây là chữ "IF" của ảnh
// chẩn đoán hiện ngược — mắt bắt được ngay, nhưng chỉ khi có người nhìn; máy bắt được luôn.
const matZAm = chieuHopUv([0, 0, 0, 1, 1, 0, 1, 0, 0]);
ok('mặt −Z: u ngược chiều X (không bị lật gương)', matZAm[2] < matZAm[0]);

/* ─────────── ⑤ LIÊN TỤC QUA RANH GIỚI MESH ─────────── */
console.log('\nUV neo thế giới — hai mảnh rời cùng mặt phẳng phải nối liền vân');

const manhA = chieuHopUv([0, 0, 0, 2, 0, 0, 2, 2, 0]);
const manhB = chieuHopUv([2, 0, 0, 4, 0, 0, 4, 2, 0]);
ok('điểm x=2 cho cùng một u ở cả hai mảnh', Math.abs(manhA[2] - manhB[0]) < 1e-6, `${manhA[2]} vs ${manhB[0]}`);

/* ─────────── ⑥ ĐOẠN DÂY THẬT: geometryOf ─────────── */
console.log('\ngeometryOf — nơi DUY NHẤT dựng BufferGeometry phải luôn gắn uv');

const g = geometryOf(tuong);
const attrUv = g.getAttribute('uv');
ok('geometryOf gắn attribute `uv`', !!attrUv);
ok('uv có đúng 2 thành phần mỗi đỉnh', !!attrUv && attrUv.itemSize === 2);
ok('số đỉnh của uv khớp số đỉnh của position', !!attrUv && attrUv.count === g.getAttribute('position').count);

console.log(`\n${pass} pass · ${fail} fail`);
if (fail > 0) process.exit(1);
