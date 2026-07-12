/**
 * lib/gu/color-psychology.test.ts — kiểm ánh xạ tâm-lý-màu + trộn LAB (PHA 1 Gu Engine). Chạy:
 *   node_modules/.bin/sucrase-node lib/gu/color-psychology.test.ts
 */
import {
  hexToRgb, rgbToHex, rgbToLab, labToRgb, deltaE, rgbToHsl,
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

testHexParse();
testLabRoundtrip();
testHsl();
testColorMood();
testPaletteMood();
testDeterministic();
testMixPaletteLab();
testMixLab();

console.log(`\n${pass} ok, ${fail} fail`);
if (fail > 0) process.exit(1);
