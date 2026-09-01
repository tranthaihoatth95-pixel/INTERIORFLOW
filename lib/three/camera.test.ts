/**
 * Test `lib/three/camera.ts` — chạy: node_modules/.bin/sucrase-node lib/three/camera.test.ts
 * (nằm sẵn trên đường `npm test`: `test:sweep` gom mọi `*.test.ts`.)
 *
 * Trọng tâm: LÁT HAI ĐIỂM TỤ. Mỗi ca dưới đây là một CA ĐỘT BIẾN — sửa hỏng đúng
 * một dòng trong `camera.ts` thì phải có ít nhất một dòng ở đây đỏ lên.
 * Ca gốc (`fovFromLens`/`presetCamera`/`placeCamera`) chỉ neo đủ để lát mới không
 * lặng lẽ đổi nghĩa của chúng.
 */
import {
  CAP_TRAN_MAC_DINH_M,
  NGUONG_CHINH_DIEN_DEG,
  TRAN_DICH_ONG_KINH,
  datCameraHaiDiemTu,
  dichOngKinh,
  fovDocFromLens,
  fovFromLens,
  laTrucNgang,
  presetCamera,
  promptHaiDiemTu,
  soDiemTu,
} from './camera';
import type { BboxMm, PlacedCamera } from './camera';

let pass = 0;
let fail = 0;
function ok(name: string, cond: boolean) {
  if (cond) {
    pass++;
    console.log('  ok  -', name);
  } else {
    fail++;
    console.log('  FAIL-', name);
  }
}

const gan = (a: number, b: number, eps = 1e-9) => Math.abs(a - b) <= eps;

/** Thế máy trần trụi để thử THƯỚC — không đi qua hàm đặt máy. */
function the(pos: [number, number, number], target: [number, number, number]): PlacedCamera {
  return { pos, target, lensMm: 35 };
}

// ── ① FOV đứng ────────────────────────────────────────────────────────────────
console.log('① fovDocFromLens');
ok('khung 1:1 ⇒ FOV đứng == FOV ngang (cảm biến vuông 36×36)',
  gan(fovDocFromLens(50, '1:1'), fovFromLens(50), 1e-9));
ok('16:9 hẹp hơn 4:3 theo chiều đứng',
  fovDocFromLens(35, '16:9') < fovDocFromLens(35, '4:3'));
ok('4:3 hẹp hơn 1:1 theo chiều đứng',
  fovDocFromLens(35, '4:3') < fovDocFromLens(35, '1:1'));
ok('ống dài hơn ⇒ FOV đứng nhỏ hơn',
  fovDocFromLens(85, '16:9') < fovDocFromLens(24, '16:9'));
ok('tỉ lệ rác ⇒ lùi về 16:9, không NaN',
  gan(fovDocFromLens(35, 'rác'), fovDocFromLens(35, '16:9'), 1e-9));

// ── ② THƯỚC số điểm tụ ────────────────────────────────────────────────────────
console.log('② soDiemTu — thước hình học');
ok('trục nghiêng lên ⇒ 3 điểm tụ (đường đứng đổ)',
  soDiemTu(the([0, 0, 1.5], [4, 0, 2.6])) === 3);
ok('trục nghiêng xuống ⇒ 3 điểm tụ',
  soDiemTu(the([0, 0, 1.5], [4, 0, 0.2])) === 3);
ok('ngang + nhìn dọc trục +X ⇒ 1 điểm tụ',
  soDiemTu(the([0, 0, 1.5], [4, 0, 1.5])) === 1);
ok('ngang + nhìn dọc trục +Y ⇒ 1 điểm tụ',
  soDiemTu(the([0, 0, 1.5], [0, 4, 1.5])) === 1);
ok('ngang + nhìn dọc trục -X ⇒ 1 điểm tụ',
  soDiemTu(the([0, 0, 1.5], [-4, 0, 1.5])) === 1);
ok('ngang + nhìn dọc trục -Y ⇒ 1 điểm tụ',
  soDiemTu(the([0, 0, 1.5], [0, -4, 1.5])) === 1);
ok('ngang + chéo 45° ⇒ 2 điểm tụ',
  soDiemTu(the([0, 0, 1.5], [4, 4, 1.5])) === 2);
ok('ngang + chéo 30° ⇒ 2 điểm tụ',
  soDiemTu(the([0, 0, 1.5], [Math.cos(Math.PI / 6) * 4, Math.sin(Math.PI / 6) * 4, 1.5])) === 2);
{
  // biên: đúng ngưỡng còn là chính diện, quá ngưỡng là hai điểm tụ
  const goc = (deg: number) =>
    the([0, 0, 1.5], [Math.cos((deg * Math.PI) / 180) * 4, Math.sin((deg * Math.PI) / 180) * 4, 1.5]);
  ok(`lệch đúng ${NGUONG_CHINH_DIEN_DEG}° vẫn là 1 điểm tụ`, soDiemTu(goc(NGUONG_CHINH_DIEN_DEG)) === 1);
  ok(`lệch ${NGUONG_CHINH_DIEN_DEG + 1}° đã là 2 điểm tụ`, soDiemTu(goc(NGUONG_CHINH_DIEN_DEG + 1)) === 2);
  ok('ngưỡng nới rộng ⇒ chéo 20° đọc thành chính diện', soDiemTu(goc(20), 25) === 1);
}
ok('máy trùng điểm nhìn ⇒ 1, không NaN',
  soDiemTu(the([1, 1, 1.5], [1, 1, 1.5])) === 1);

console.log('③ laTrucNgang');
ok('cùng cao độ ⇒ ngang', laTrucNgang(the([0, 0, 1.5], [3, 3, 1.5])));
ok('lệch 1mm ⇒ KHÔNG ngang', !laTrucNgang(the([0, 0, 1.5], [3, 3, 1.501])));

// ── ④ Dịch ống kính ───────────────────────────────────────────────────────────
console.log('④ dichOngKinh');
{
  const d = 5;
  const lens = 35;
  const ratio = '16:9';
  const nuaKhung = d * Math.tan((fovDocFromLens(lens, ratio) * Math.PI) / 360);
  ok('máy thấp hơn nửa trần ⇒ dịch LÊN (dương)',
    dichOngKinh(1.0, 3.0, d, lens, ratio) > 0);
  ok('máy cao hơn nửa trần ⇒ dịch XUỐNG (âm)',
    dichOngKinh(1.6, 2.8, d, lens, ratio) < 0);
  ok('máy đúng nửa trần ⇒ không cần dịch',
    gan(dichOngKinh(1.4, 2.8, d, lens, ratio), 0, 1e-12));
  ok('giá trị khớp phép tính tay (canDich / nửa khung)',
    gan(dichOngKinh(1.0, 3.0, d, lens, ratio), (3.0 / 2 - 1.0) / nuaKhung, 1e-9));
  ok('đứng sát tường ⇒ kẹp ở trần vật lý, không trả số vô lý',
    gan(dichOngKinh(0.5, 3.0, 0.05, lens, ratio), TRAN_DICH_ONG_KINH, 1e-12));
  ok('kẹp cả chiều âm',
    gan(dichOngKinh(3.0, 0.5, 0.05, lens, ratio), -TRAN_DICH_ONG_KINH, 1e-12));
  ok('khoảng cách 0 ⇒ không chia cho 0',
    Number.isFinite(dichOngKinh(1.2, 2.8, 0, lens, ratio)));
  ok('ống rộng hơn ⇒ cùng cảnh cần dịch ÍT hơn (khung đã cao sẵn)',
    Math.abs(dichOngKinh(1.0, 3.0, d, 24, ratio)) < Math.abs(dichOngKinh(1.0, 3.0, d, 85, ratio)));
}

// ── ⑤ Đặt máy hai điểm tụ ─────────────────────────────────────────────────────
console.log('⑤ datCameraHaiDiemTu');
{
  const bbox: BboxMm = { minX: 0, minY: 0, maxX: 6000, maxY: 4000 };
  const spec = presetCamera('Tầm mắt (đứng trong phòng)', '35mm', '16:9');
  const cam = datCameraHaiDiemTu(bbox, spec);

  ok('KHẲNG ĐỊNH CỐT LÕI — thế máy trả về đúng HAI điểm tụ', cam.soDiemTu === 2);
  ok('trục nhìn NGANG ⇒ đường đứng còn đứng', laTrucNgang(cam));
  ok('thước độc lập cũng đọc ra 2', soDiemTu(cam) === 2);
  ok('máy nằm TRONG bbox (không lọt ra ngoài tường)',
    cam.pos[0] > bbox.minX / 1000 && cam.pos[0] < bbox.maxX / 1000 &&
    cam.pos[1] > bbox.minY / 1000 && cam.pos[1] < bbox.maxY / 1000);
  ok('cao máy lấy đúng từ CameraSpec', gan(cam.pos[2], spec.heightM));
  ok('điểm nhìn cùng cao độ với máy', gan(cam.target[2], cam.pos[2]));
  ok('trần mặc định 2,8m khi không khai', gan(cam.capTranM, CAP_TRAN_MAC_DINH_M));
  ok('tiêu cự đi thẳng từ spec', cam.lensMm === spec.lensMm);
  ok('máy tầm mắt 1,5m trong phòng trần 2,8m ⇒ phải dịch XUỐNG một chút', cam.shiftY < 0);

  const cao = datCameraHaiDiemTu(bbox, spec, { capTranM: 4.2 });
  ok('trần cao hơn ⇒ dịch ống kính đi lên so với trần thấp', cao.shiftY > cam.shiftY);
  ok('trần khai được ghi lại nguyên văn', gan(cao.capTranM, 4.2));

  // CHỐNG ĐI LẠC VỀ MỘT ĐIỂM TỤ — hàm mang tên "hai điểm tụ" thì phải giữ lời
  for (const goc of [0, 90, 180, 270, -90, 3, 87]) {
    const c = datCameraHaiDiemTu(bbox, spec, { gocCheoDeg: goc });
    ok(`góc chính diện ${goc}° bị ép ra khỏi một-điểm-tụ`, c.soDiemTu === 2);
  }
  for (const goc of [30, 35, 60, 120]) {
    const c = datCameraHaiDiemTu(bbox, spec, { gocCheoDeg: goc });
    ok(`góc chéo ${goc}° được giữ nguyên`, gan(c.yawDeg, goc) && c.soDiemTu === 2);
  }

  // phòng suy biến: bbox dẹt vẫn không sinh NaN
  const det = datCameraHaiDiemTu({ minX: 0, minY: 0, maxX: 0, maxY: 0 }, spec);
  ok('bbox suy biến ⇒ vẫn ra số hữu hạn',
    det.pos.every(Number.isFinite) && det.target.every(Number.isFinite) && Number.isFinite(det.shiftY));
  ok('bbox suy biến ⇒ vẫn giữ hai điểm tụ', det.soDiemTu === 2);

  // bbox lệch gốc toạ độ — máy phải đi theo, không neo cứng vào 0
  const dich = datCameraHaiDiemTu({ minX: 10000, minY: 20000, maxX: 16000, maxY: 24000 }, spec);
  ok('bbox dời đi thì máy dời theo', dich.pos[0] > 10 && dich.pos[1] > 20);

  console.log('⑥ promptHaiDiemTu');
  ok('prompt nói đúng tên hình học', promptHaiDiemTu(cam).includes('two-point perspective'));
  ok('prompt khoá điều kiện đường đứng',
    promptHaiDiemTu(cam).includes('vertical lines strictly parallel'));
  ok('prompt chở tiêu cự thật', promptHaiDiemTu(cam).includes(`${spec.lensMm}mm`));
  ok('dịch xuống ⇒ nói "fall"', promptHaiDiemTu(cam).includes('tilt-shift lens fall'));
  const len = datCameraHaiDiemTu(bbox, presetCamera('Tầm mắt (đứng trong phòng)', '35mm', '16:9'), { capTranM: 6 });
  ok('dịch lên ⇒ nói "rise"', len.shiftY > 0 && promptHaiDiemTu(len).includes('tilt-shift lens rise'));
}

// ── ⑦ Neo phần cũ — lát mới không được đổi nghĩa hàm cũ ────────────────────────
console.log('⑦ neo hành vi cũ');
ok('fovFromLens(50) ≈ 39,6°', gan(Math.round(fovFromLens(50) * 10) / 10, 39.6));
ok('preset "Góc rộng" vẫn ép tiêu cự về ≤24mm',
  presetCamera('Góc rộng (thấy cả phòng)', '85mm', '16:9').lensMm === 24);

console.log(`\ncamera.test.ts — pass ${pass} · fail ${fail}`);
if (fail > 0) process.exit(1);
