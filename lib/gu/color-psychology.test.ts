/**
 * lib/gu/color-psychology.test.ts — kiểm ánh xạ tâm-lý-màu + trộn LAB (PHA 1 Gu Engine). Chạy:
 *   node_modules/.bin/sucrase-node lib/gu/color-psychology.test.ts
 */
import {
  hexToRgb, rgbToHex, rgbToLab, labToRgb, deltaE, deltaE2000, rgbToHsl,
  colorMood, paletteMood, mixPaletteLab, mixLab,
} from './color-psychology';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}
function approx(a: number, b: number, eps = 1): boolean { return Math.abs(a - b) <= eps; }

function testHexParse() {
  console.log('\n[1] hexToRgb / rgbToHex');
  ok('#ffffff → 255,255,255', JSON.stringify(hexToRgb('#ffffff')) === JSON.stringify({ r: 255, g: 255, b: 255 }));
  ok('không # vẫn parse', JSON.stringify(hexToRgb('000000')) === JSON.stringify({ r: 0, g: 0, b: 0 }));
  ok('shorthand #abc nở ra', JSON.stringify(hexToRgb('#abc')) === JSON.stringify(hexToRgb('#aabbcc')));
  ok('sai định dạng → null', hexToRgb('#zzz') === null);
  ok('roundtrip rgbToHex', rgbToHex({ r: 192, g: 138, b: 90 }) === '#c08a5a');
}

function testLabRoundtrip() {
  console.log('\n[2] LAB roundtrip + trắng/đen chuẩn');
  const white = rgbToLab({ r: 255, g: 255, b: 255 });
  ok('trắng L≈100', approx(white.L, 100, 0.5));
  ok('trắng a≈0,b≈0', approx(white.a, 0, 1) && approx(white.b, 0, 1));
  const black = rgbToLab({ r: 0, g: 0, b: 0 });
  ok('đen L≈0', approx(black.L, 0, 0.5));
  // roundtrip 1 màu bất kỳ
  const c = { r: 140, g: 90, b: 60 };
  const back = labToRgb(rgbToLab(c));
  ok('rgb→lab→rgb sai lệch ≤2', approx(back.r, c.r, 2) && approx(back.g, c.g, 2) && approx(back.b, c.b, 2));
}

function testHsl() {
  console.log('\n[3] rgbToHsl');
  const red = rgbToHsl({ r: 255, g: 0, b: 0 });
  ok('đỏ h≈0', approx(red.h, 0, 1));
  ok('đỏ bão hoà cao', red.s > 0.9);
  const gray = rgbToHsl({ r: 128, g: 128, b: 128 });
  ok('xám s≈0', approx(gray.s, 0, 0.01));
}

function testColorMood() {
  console.log('\n[4] colorMood — ánh xạ tất định 1 màu');
  ok('nâu ấm #8a5a3c → warm-inviting', colorMood('#8a5a3c') === 'warm-inviting');
  ok('cam #e07b39 → warm-inviting', colorMood('#e07b39') === 'warm-inviting');
  ok('lục #4c8a5a → calm-restorative', colorMood('#4c8a5a') === 'calm-restorative');
  ok('lam nhạt #9fc3e0 → serene-cool', colorMood('#9fc3e0') === 'serene-cool');
  ok('gần đen #14110f → dramatic-moody', colorMood('#14110f') === 'dramatic-moody');
  ok('kem #efe7d6 → luxe-neutral', colorMood('#efe7d6') === 'luxe-neutral');
  ok('greige #b8b0a2 → luxe-neutral', colorMood('#b8b0a2') === 'luxe-neutral');
  ok('tím #6a4c8a → dramatic-moody', colorMood('#6a4c8a') === 'dramatic-moody');
  ok('hex sai → null', colorMood('nope') === null);
}

function testPaletteMood() {
  console.log('\n[5] paletteMood — tổng hợp palette');
  const warm = paletteMood(['#8a5a3c', '#c08a5a', '#e07b39', '#efe7d6']);
  ok('palette ấm → dominant warm-inviting', warm.dominant === 'warm-inviting');
  ok('có tỉ trọng luxe-neutral (kem)', warm.moods.some((m) => m.mood === 'luxe-neutral'));
  ok('tổng weight ≈ 1', approx(warm.moods.reduce((s, m) => s + m.weight, 0), 1, 0.001));
  ok('có reasons', warm.reasons.length > 0);

  const cool = paletteMood(['#9fc3e0', '#7fb0d8', '#14110f']);
  ok('palette mát+tối → dominant serene-cool hoặc moody', cool.dominant === 'serene-cool' || cool.dominant === 'dramatic-moody');

  const empty = paletteMood([]);
  ok('rỗng → mặc định luxe-neutral, moods rỗng', empty.dominant === 'luxe-neutral' && empty.moods.length === 0);
}

function testDeterministic() {
  console.log('\n[6] Tất định — cùng palette ra cùng kết quả');
  const p = ['#8a5a3c', '#9fc3e0', '#4c8a5a', '#efe7d6'];
  ok('paletteMood ổn định', JSON.stringify(paletteMood(p)) === JSON.stringify(paletteMood(p)));
  ok('mixPaletteLab ổn định', JSON.stringify(mixPaletteLab(p)) === JSON.stringify(mixPaletteLab(p)));
}

function testMixPaletteLab() {
  console.log('\n[7] mixPaletteLab — gom màu gần nhau theo ΔE');
  // 3 sắc nâu gần + 1 lam xa → gộp còn 2 cụm; nâu (3 phiếu) đứng trước lam
  const merged = mixPaletteLab(['#8a5a3c', '#8b5b3d', '#895939', '#9fc3e0'], { mergeDeltaE: 12 });
  ok('gộp về 2 màu', merged.length === 2);
  ok('màu đầu là nâu (cụm đông) — R>B', hexToRgb(merged[0])!.r > hexToRgb(merged[0])!.b);
  ok('màu sau là lam — B>R', hexToRgb(merged[1])!.b > hexToRgb(merged[1])!.r);

  // ngưỡng nhỏ → không gộp
  const noMerge = mixPaletteLab(['#8a5a3c', '#8b5b3d', '#895939', '#9fc3e0'], { mergeDeltaE: 0.5 });
  ok('ΔE=0.5 → giữ gần hết màu riêng', noMerge.length >= 3);

  ok('maxColors cắt đúng', mixPaletteLab(['#111111', '#ffffff', '#8a5a3c', '#9fc3e0'], { mergeDeltaE: 5, maxColors: 2 }).length === 2);
  ok('bỏ hex sai', mixPaletteLab(['#8a5a3c', 'nope', '#9fc3e0'], { mergeDeltaE: 5 }).length === 2);
}

function testMixLab() {
  console.log('\n[8] mixLab — trộn 2 màu trong LAB');
  const mid = mixLab('#000000', '#ffffff', 0.5);
  ok('đen×trắng t=0.5 → xám trung', mid !== null && approx(hexToRgb(mid!)!.r, hexToRgb(mid!)!.g, 2));
  ok('t=0 → trả về màu A', mixLab('#8a5a3c', '#9fc3e0', 0) === rgbToHex(labToRgb(rgbToLab(hexToRgb('#8a5a3c')!))));
  ok('hex sai → null', mixLab('nope', '#fff', 0.5) === null);
  ok('deltaE 2 màu khác > 0', deltaE(rgbToLab({ r: 0, g: 0, b: 0 }), rgbToLab({ r: 255, g: 255, b: 255 })) > 50);
}

/**
 * [9] ΔE00 (CIEDE2000) — đối chiếu **BỘ SỐ KIỂM CHUẨN của Sharma-Wu-Dalal (2005)**, đúng 28 cặp
 * dùng để chứng minh cài đặt CIEDE2000 không sai (bộ này cố ý gài các ca hiểm: chroma ~0, hue
 * vắt qua mốc 0°/360°, và **vùng lam h′≈275°** nơi số hạng xoay R_T mới lộ ra). Sai cài đặt là
 * lệch ở đúng mấy cặp đó chứ không lệch đều — nên test bằng bộ này, không tự bịa cặp.
 */
function testDeltaE2000() {
  console.log('\n[9] deltaE2000 — 28 cặp kiểm chuẩn Sharma (2005)');
  const L = (v: number[]) => ({ L: v[0], a: v[1], b: v[2] });
  const PAIRS: [number[], number[], number][] = [
    [[50, 2.6772, -79.7751], [50, 0, -82.7485], 2.0425],
    [[50, 3.1571, -77.2803], [50, 0, -82.7485], 2.8615],
    [[50, 2.8361, -74.0200], [50, 0, -82.7485], 3.4412],
    [[50, -1.3802, -84.2814], [50, 0, -82.7485], 1.0000],
    [[50, -1.1848, -84.8006], [50, 0, -82.7485], 1.0000],
    [[50, -0.9009, -85.5211], [50, 0, -82.7485], 1.0000],
    [[50, 0, 0], [50, -1, 2], 2.3669],
    [[50, -1, 2], [50, 0, 0], 2.3669],
    [[50, 2.49, -0.001], [50, -2.49, 0.0009], 7.1792],
    [[50, 2.5, 0], [50, 0, -2.5], 4.3065],
    [[50, 2.5, 0], [73, 25, -18], 27.1492],
    [[50, 2.5, 0], [61, -5, 29], 22.8977],
    [[50, 2.5, 0], [56, -27, -3], 31.9030],
    [[50, 2.5, 0], [58, 24, 15], 19.4535],
    [[50, 2.5, 0], [50, 3.1736, 0.5854], 1.0000],
    [[50, 2.5, 0], [50, 3.2972, 0], 1.0000],
    [[50, 2.5, 0], [50, 1.8634, 0.5757], 1.0000],
    [[50, 2.5, 0], [50, 3.2592, 0.3350], 1.0000],
    [[60.2574, -34.0099, 36.2677], [60.4626, -34.1751, 39.4387], 1.2644],
    [[63.0109, -31.0961, -5.8663], [62.8187, -29.7946, -4.0864], 1.2630],
    [[61.2901, 3.7196, -5.3901], [61.4292, 2.2480, -4.9620], 1.8731],
    [[35.0831, -44.1164, 3.7933], [35.0232, -40.0716, 1.5901], 1.8645],
    [[22.7233, 20.0904, -46.6940], [23.0331, 14.9730, -42.5619], 2.0373],
    [[36.4612, 47.8580, 18.3852], [36.2715, 50.5065, 21.2231], 1.4146],
    [[90.8027, -2.0831, 1.4410], [91.1528, -1.6435, 0.0447], 1.4441],
    [[90.9257, -0.5406, -0.9208], [88.6381, -0.8985, -0.7239], 1.5381],
    [[6.7747, -0.2908, -2.4247], [5.8714, -0.0985, -2.2286], 0.6377],
    [[2.0776, 0.0795, -1.1350], [0.9033, -0.0636, -0.5514], 0.9082],
  ];
  let worst = 0;
  for (const [x, y, exp] of PAIRS) worst = Math.max(worst, Math.abs(deltaE2000(L(x), L(y)) - exp));
  ok(`cả 28 cặp khớp trong 1e-4 (lệch lớn nhất ${worst.toExponential(2)})`, worst < 1e-4);

  ok('ΔE00(x,x) = 0', deltaE2000(L([55, 12, -30]), L([55, 12, -30])) === 0);
  ok('đối xứng ΔE00(a,b) = ΔE00(b,a)',
    Math.abs(deltaE2000(L([50, 2.5, 0]), L([73, 25, -18])) - deltaE2000(L([73, 25, -18]), L([50, 2.5, 0]))) < 1e-12);

  // Lý do đổi thước đo (xem docblock deltaE2000): ΔE76 ĐÁNH GIÁ THẤP sai lệch vùng lam. Cặp
  // Sharma #1 là đúng ca đó — ΔE76 ≈ 4.0 (nghe như "khác rõ") trong khi mắt thấy ≈ 2.04.
  const blueA = L([50, 2.6772, -79.7751]);
  const blueB = L([50, 0, -82.7485]);
  ok('vùng lam: ΔE76 phóng đại so với ΔE00 (đúng lý do bỏ ΔE76)', deltaE(blueA, blueB) > deltaE2000(blueA, blueB) * 1.5);
}

testHexParse();
testLabRoundtrip();
testHsl();
testColorMood();
testPaletteMood();
testDeterministic();
testMixPaletteLab();
testMixLab();
testDeltaE2000();

console.log(`\n${pass} ok, ${fail} fail`);
if (fail > 0) process.exit(1);
