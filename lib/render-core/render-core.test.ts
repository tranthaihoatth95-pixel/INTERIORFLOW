/**
 * lib/render-core/render-core.test.ts — kiểm 4 TẦNG LÕI TẤT ĐỊNH của bộ node render v2:
 * text2image (SVG concept) · ID mask (median-cut) · tách nội thất (bg viền) · chỉnh cục bộ (mask).
 * Chạy: node_modules/.bin/sucrase-node lib/render-core/render-core.test.ts
 */
import { text2imageCore, detectRoom, detectPalette, sizeForRatio, hashSeed } from './text2image-core';
import { quantizeIdMap, renderIdMap, maskForRegion, refineWithAlpha, ID_COLORS } from './idmask-core';
import { estimateBackground, extractForeground, alphaToMask } from './furniture-extract-core';
import { adjustPixel, applyMaskedAdjust } from './local-edit-core';

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

/* ───────── text2image ───────── */
console.log('text2imageCore — concept sketch tất định từ prompt');
{
  const a = text2imageCore('japandi bedroom, oak wood, warm light', '16:9');
  const b = text2imageCore('japandi bedroom, oak wood, warm light', '16:9');
  ok('tất định: cùng prompt = cùng ảnh', a.dataUri === b.dataUri);
  ok('đọc đúng phòng ngủ', a.room === 'bedroom');
  ok('đọc đúng style Japandi', a.styleName === 'Japandi');
  ok('là SVG data-URI', a.dataUri.startsWith('data:image/svg+xml'));
  ok('ảnh mang nhãn lõi tất định', decodeURIComponent(a.dataUri).includes('LÕI TẤT ĐỊNH'));
  ok('note nhắc thêm key', a.note.includes('NVIDIA_API_KEY'));

  const c = text2imageCore('phòng khách indochine, gạch bông', '16:9');
  ok('VI: phòng khách → living', c.room === 'living');
  ok('VI: indochine nhận style', c.styleName === 'Indochine');
  ok('prompt khác → ảnh khác', c.dataUri !== a.dataUri);

  ok('detectRoom mặc định living', detectRoom('abstract corridor') === 'living');
  ok('detectPalette mặc định Neutral', detectPalette('plain space').name === 'Neutral');
  ok('ratio 9:16 ra khổ dọc', sizeForRatio('9:16').h > sizeForRatio('9:16').w);
  ok('hashSeed ổn định', hashSeed('abc') === hashSeed('abc') && hashSeed('abc') !== hashSeed('abd'));
}

/* ───────── ID mask ───────── */
console.log('quantizeIdMap — median-cut phân vùng tất định');
{
  // ảnh 8×4: nửa trái đỏ, nửa phải xanh
  const w = 8;
  const h = 4;
  const data = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    const x = i % w;
    const o = i * 4;
    if (x < 4) {
      data[o] = 200;
      data[o + 1] = 30;
      data[o + 2] = 30;
    } else {
      data[o] = 30;
      data[o + 1] = 60;
      data[o + 2] = 200;
    }
    data[o + 3] = 255;
  }
  const r1 = quantizeIdMap(data, w, h, 2);
  const r2 = quantizeIdMap(data, w, h, 2);
  ok('k=2 ra đúng 2 vùng', r1.k === 2);
  ok('tất định: 2 lần chạy giống nhau', r1.assign.join(',') === r2.assign.join(','));
  ok('2 nửa vào 2 vùng khác nhau', r1.assign[0] !== r1.assign[7]);
  ok('share mỗi vùng = 0.5', Math.abs(r1.share[0] - 0.5) < 1e-9 && Math.abs(r1.share[1] - 0.5) < 1e-9);

  const idmap = renderIdMap(r1.assign, w, h);
  const c0 = ID_COLORS[r1.assign[0]];
  ok('idmap tô đúng màu ID vùng 0', idmap[0] === c0[0] && idmap[1] === c0[1] && idmap[2] === c0[2] && idmap[3] === 255);

  const mask = maskForRegion(r1.assign, w, h, r1.assign[0]);
  ok('mask: vùng chọn trắng', mask[0] === 255 && mask[1] === 255 && mask[2] === 255);
  ok('mask: vùng khác đen', mask[7 * 4] === 0);

  // refineWithAlpha: alpha thấp nửa trái → nửa trái về vùng 0 (nền), phải dồn lên ≥1
  const alpha = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < w * h; i++) alpha[i * 4 + 3] = i % w < 4 ? 10 : 255;
  const refined = refineWithAlpha(r1.assign, alpha);
  ok('refine: nền (alpha thấp) → vùng 0', refined[0] === 0);
  ok('refine: foreground dồn lên ≥1', refined[7] >= 1);

  ok('k kẹp trong [2..8]', quantizeIdMap(data, w, h, 99).k <= ID_COLORS.length);
}

/* ───────── furniture extract ───────── */
console.log('extractForeground — tách nội thất trên nền phẳng');
{
  // ảnh 16×16 nền trắng, khối gỗ nâu 6×6 ở giữa
  const w = 16;
  const h = 16;
  const data = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    const x = i % w;
    const y = Math.floor(i / w);
    const o = i * 4;
    const inBox = x >= 5 && x < 11 && y >= 5 && y < 11;
    data[o] = inBox ? 120 : 245;
    data[o + 1] = inBox ? 85 : 243;
    data[o + 2] = inBox ? 60 : 240;
    data[o + 3] = 255;
  }
  const bg = estimateBackground(data, w, h);
  ok('bg ước lượng ≈ trắng', bg.color[0] > 230 && bg.color[1] > 230 && bg.color[2] > 230);
  ok('nền phẳng → spread nhỏ', bg.spread < 10);

  const r = extractForeground(data, w, h, 0.25);
  ok('nền thành trong suốt', r.data[3] === 0);
  const centerO = (8 * w + 8) * 4;
  ok('khối gỗ giữ alpha 255', r.data[centerO + 3] === 255);
  ok('fgRatio ≈ 36/256', Math.abs(r.fgRatio - 36 / 256) < 0.02);
  ok('bbox đúng khối 6×6', !!r.bbox && r.bbox.w === 6 && r.bbox.h === 6 && r.bbox.x === 5);
  ok('nền phẳng → không cảnh báo', r.warnings.length === 0);

  const mask = alphaToMask(r.data, w, h);
  ok('mask từ alpha: tâm trắng, góc đen', mask[centerO] === 255 && mask[0] === 0);

  // ảnh đồng màu → bbox null + cảnh báo
  const flat = new Uint8ClampedArray(w * h * 4).fill(200);
  const rf = extractForeground(flat, w, h, 0.25);
  ok('ảnh đồng màu → bbox null + cảnh báo', rf.bbox === null && rf.warnings.length > 0);
}

/* ───────── local edit ───────── */
console.log('applyMaskedAdjust — chỉnh cục bộ theo mask');
{
  const w = 4;
  const h = 2;
  const img = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    const o = i * 4;
    img[o] = 100;
    img[o + 1] = 100;
    img[o + 2] = 100;
    img[o + 3] = 255;
  }
  // mask: nửa trái trắng (chỉnh), nửa phải đen (giữ)
  const mask = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    const v = i % w < 2 ? 255 : 0;
    const o = i * 4;
    mask[o] = v;
    mask[o + 1] = v;
    mask[o + 2] = v;
    mask[o + 3] = 255;
  }
  const r = applyMaskedAdjust(img, mask, w, h, { brightness: 1.5 });
  ok('trong mask: sáng lên (100→150)', r.data[0] === 150);
  ok('ngoài mask: giữ nguyên', r.data[2 * 4] === 100);
  ok('editedRatio = 0.5', Math.abs(r.editedRatio - 0.5) < 1e-9);
  ok('alpha giữ nguyên', r.data[3] === 255 && r.data[2 * 4 + 3] === 255);

  const rAll = applyMaskedAdjust(img, null, w, h, { brightness: 1.2 });
  ok('mask null → áp toàn ảnh', rAll.data[0] === 120 && rAll.data[(w * h - 1) * 4] === 120 && rAll.editedRatio === 1);

  const [rr, gg, bb] = adjustPixel(100, 100, 100, { temperature: 1 });
  ok('temperature ấm: R tăng, B giảm', rr > 100 && bb < 100 && gg === 100);
  const [cr] = adjustPixel(200, 50, 50, { saturate: 0 });
  const [cg] = adjustPixel(200, 50, 50, { saturate: 0 });
  ok('saturate 0 → xám (R=G)', cr === cg);
  const hueSame = adjustPixel(180, 90, 40, { hueShiftDeg: 0 });
  ok('hue 0 → giữ nguyên', hueSame[0] === 180 && hueSame[1] === 90 && hueSame[2] === 40);
  const hue180 = adjustPixel(180, 90, 40, { hueShiftDeg: 180 });
  ok('hue 180 → đổi màu thật', hue180[0] !== 180 || hue180[2] !== 40);
}

console.log(`\n${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
