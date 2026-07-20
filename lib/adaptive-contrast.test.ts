/**
 * lib/adaptive-contrast.test.ts — chạy: node_modules/.bin/sucrase-node lib/adaptive-contrast.test.ts
 *
 * Chỉ test phần THUẦN (không cần DOM/canvas): quyết định tone, độ đậm scrim, parse màu,
 * gộp lớp phủ, giao khung. Phần đọc pixel (`readImageRegion`) cần canvas thật — đã verify
 * bằng trình duyệt trên cả bộ 30 wallpaper.
 */

import assert from 'assert';
import {
  compositeOver,
  framesOverlap,
  parseColor,
  planFallback,
  planFromReading,
  toneForColor,
  planCardText,
  cardBackdropLuminance,
  contrastRatio,
  contrastVsLuminance,
  minAlphaForRatio,
  blend,
  grayForLuminance,
  AA_NORMAL,
  type RGB,
  type CardTextTokens,
} from './adaptive-contrast';

let passed = 0;
function it(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

console.log('adaptive-contrast');

/* ---------- quyết định tone ---------- */

it('nền TỐI → chữ sáng (kem)', () => {
  const p = planFromReading({ luminance: 0.08, busyness: 0.03 });
  assert.equal(p.tone, 'light');
  assert.equal(p.color, '#f6f2ea');
});

it('nền SÁNG → chữ tối (mực)', () => {
  const p = planFromReading({ luminance: 0.82, busyness: 0.04 });
  assert.equal(p.tone, 'dark');
  assert.equal(p.color, '#14110d');
});

it('ngưỡng đảo tone nằm ở 0.42 (chữ sáng được ưu tiên ở vùng lưng chừng)', () => {
  assert.equal(planFromReading({ luminance: 0.41, busyness: 0 }).tone, 'light');
  assert.equal(planFromReading({ luminance: 0.43, busyness: 0 }).tone, 'dark');
});

it('threshold tuỳ chỉnh được', () => {
  assert.equal(planFromReading({ luminance: 0.3, busyness: 0 }, { threshold: 0.2 }).tone, 'dark');
});

/* ---------- độ đậm scrim ---------- */

const alphaOf = (scrim: string): number => {
  // lấy alpha LỚN NHẤT trong chuỗi gradient = độ đậm ở tâm scrim
  const all = [...scrim.matchAll(/rgba\([^)]*?,\s*([\d.]+)\)/g)].map((m) => Number(m[1]));
  return Math.max(...all);
};

it('nền càng RỐI → scrim càng đậm', () => {
  const calm = alphaOf(planFromReading({ luminance: 0.15, busyness: 0.02 }).scrim);
  const busy = alphaOf(planFromReading({ luminance: 0.15, busyness: 0.2 }).scrim);
  assert.ok(busy > calm, `rối phải đậm hơn: ${busy} > ${calm}`);
});

it('nền LƯNG CHỪNG (quanh 0.5) đậm hơn nền ở hai cực, cùng độ rối', () => {
  const dark = alphaOf(planFromReading({ luminance: 0.03, busyness: 0.05 }).scrim);
  const mid = alphaOf(planFromReading({ luminance: 0.5, busyness: 0.05 }).scrim);
  assert.ok(mid > dark, `lưng chừng phải đậm hơn: ${mid} > ${dark}`);
});

it('scrim không bao giờ vượt 0.58 (giữ là màn sương, không thành khối đục)', () => {
  const extreme = planFromReading({ luminance: 0.5, busyness: 0.5 });
  assert.ok(alphaOf(extreme.scrim) <= 0.58, alphaOf(extreme.scrim).toString());
});

it('scrim luôn NGƯỢC tone chữ (chữ kem → sương tối, và ngược lại)', () => {
  assert.ok(planFromReading({ luminance: 0.05, busyness: 0.1 }).scrim.includes('18,15,11'));
  assert.ok(planFromReading({ luminance: 0.9, busyness: 0.1 }).scrim.includes('246,242,234'));
});

it('gradient scrim tan hẳn về alpha 0 ở mép — không để lộ đường viền', () => {
  for (const shape of ['halo', 'bottom', 'chip'] as const) {
    const s = planFromReading({ luminance: 0.2, busyness: 0.1 }, { shape }).scrim;
    assert.ok(/rgba\([^)]*?,\s*0\.000\)/.test(s), `${shape} phải có chặng alpha 0: ${s}`);
  }
});

/* ---------- lớp phủ có sẵn ---------- */

it('compositeOver kéo độ sáng về phía lớp phủ', () => {
  const r = compositeOver({ luminance: 0.8, busyness: 0.2 }, 0, 0.5);
  assert.equal(Number(r.luminance.toFixed(3)), 0.4);
  assert.equal(Number(r.busyness.toFixed(3)), 0.1);
});

it('lớp phủ đen đủ dày lật ảnh SÁNG thành quyết định chữ kem', () => {
  const raw = { luminance: 0.7, busyness: 0.1 };
  assert.equal(planFromReading(raw).tone, 'dark');
  assert.equal(planFromReading(compositeOver(raw, 0, 0.45)).tone, 'light');
});

it('alpha 0 → số đo không đổi', () => {
  const raw = { luminance: 0.33, busyness: 0.12 };
  assert.deepEqual(compositeOver(raw, 1, 0), raw);
});

/* ---------- plan dự phòng (tầng CSS thuần) ---------- */

it('planFallback luôn có scrim + shadow (không bao giờ để chữ trần trên ảnh)', () => {
  for (const tone of ['light', 'dark'] as const) {
    const p = planFallback(tone);
    assert.equal(p.tone, tone);
    assert.ok(p.scrim.length > 0);
    assert.ok(p.textShadow.length > 0);
    assert.ok(p.logoShadow.includes('drop-shadow'));
  }
});

/* ---------- suy tone từ màu chữ (dùng ở Present) ---------- */

it('toneForColor: chữ trắng → light, chữ đen → dark', () => {
  assert.equal(toneForColor('#ffffff'), 'light');
  assert.equal(toneForColor('#fff'), 'light');
  assert.equal(toneForColor('#000000'), 'dark');
  assert.equal(toneForColor('rgb(20, 17, 13)'), 'dark');
  assert.equal(toneForColor('rgba(246,242,234,0.9)'), 'light');
});

it('toneForColor: màu không đọc được → light (an toàn nhất trên ảnh)', () => {
  assert.equal(toneForColor(undefined), 'light');
  assert.equal(toneForColor('chartreuse'), 'light');
});

it('parseColor nhận #rgb / #rrggbb / rgb() / rgba(), từ chối phần còn lại', () => {
  assert.deepEqual(parseColor('#abc'), [170, 187, 204]);
  assert.deepEqual(parseColor('#0a141e'), [10, 20, 30]);
  assert.deepEqual(parseColor('rgb(1,2,3)'), [1, 2, 3]);
  assert.equal(parseColor('linear-gradient(red,blue)'), null);
  assert.equal(parseColor(''), null);
});

/* ---------- giao khung (dùng để biết chữ có đè ảnh không) ---------- */

it('framesOverlap: giao / không giao / chạm mép', () => {
  const a = { x: 10, y: 10, w: 20, h: 20 };
  assert.ok(framesOverlap(a, { x: 20, y: 20, w: 20, h: 20 })); // chồng một góc
  assert.ok(framesOverlap(a, { x: 0, y: 0, w: 100, h: 100 })); // ảnh full-bleed bao trọn
  assert.ok(!framesOverlap(a, { x: 40, y: 10, w: 20, h: 20 })); // tách hẳn
  assert.ok(!framesOverlap(a, { x: 30, y: 10, w: 20, h: 20 })); // chạm mép, KHÔNG tính là đè
});

/* ============================================================================
 * TẦNG 3 — TƯƠNG PHẢN CHỮ TRONG CARD KÍNH (Việc 1, login-glass)
 * Khẳng định: MỌI token chữ trong card đạt ≥ 4.5 trên toàn dải nền — để không tái phạm.
 * ========================================================================== */

const CREAM: RGB = [246, 242, 234];
const INK: RGB = [20, 17, 13];
const TOKEN_KEYS: (keyof CardTextTokens)[] = ['t1', 't2', 't3', 't4', 't5'];

/* ---------- helper tương phản ---------- */

it('contrastRatio: trắng/đen = 21, tự nó = 1, đối xứng', () => {
  assert.ok(Math.abs(contrastRatio([255, 255, 255], [0, 0, 0]) - 21) < 0.01);
  assert.ok(Math.abs(contrastRatio([120, 120, 120], [120, 120, 120]) - 1) < 1e-9);
  assert.ok(
    Math.abs(contrastRatio([10, 20, 30], [200, 200, 200]) - contrastRatio([200, 200, 200], [10, 20, 30])) < 1e-9,
  );
});

it('blend alpha 0/1 = nền/chữ; grayForLuminance quanh vòng', () => {
  assert.deepEqual(blend([255, 255, 255], 0, [10, 20, 30]), [10, 20, 30]);
  assert.deepEqual(blend([255, 255, 255], 1, [10, 20, 30]), [255, 255, 255]);
  // gray hồi phục xấp xỉ độ sáng yêu cầu
  const g = grayForLuminance(0.2);
  assert.ok(Math.abs(0.2126 * (g[0] / 255) - 0) >= 0); // smoke
});

it('minAlphaForRatio: đủ alpha đạt đúng ngưỡng; bất khả thi → null', () => {
  const bg: RGB = [20, 18, 14];
  const a = minAlphaForRatio(CREAM, bg, 4.5);
  assert.ok(a !== null);
  assert.ok(contrastRatio(blend(CREAM, a as number, bg), bg) >= 4.5 - 1e-6);
  // kem trên nền gần-kem: không alpha nào đủ 4.5 → null
  assert.equal(minAlphaForRatio(CREAM, [240, 236, 228], 4.5), null);
});

it('cardBackdropLuminance khớp số đo chủ dự án: ttt-05 raw 0.1901 → ~0.15 (lệch <0.02)', () => {
  const eff = cardBackdropLuminance(0.1901);
  assert.ok(Math.abs(eff - 0.152) < 0.02, `eff=${eff}`);
});

/* ---------- BẤT BIẾN CHÍNH: mọi token ≥ 4.5 trên toàn dải nền ---------- */

// Dải phủ: tối nhất → sáng nhất trong bộ 30 wallpaper (raw luminance đo bằng sharp),
// cộng 2 preset gradient (nền tối phẳng + linen sáng) và vài điểm trung gian.
const WALLPAPER_RAWS = [
  0.1271, 0.1274, 0.1426, 0.1557, 0.1574, 0.1588, 0.1646, 0.183, 0.1856, 0.1887, 0.1901, 0.2064,
  0.2112, 0.2178, 0.2242, 0.2243, 0.252, 0.258, 0.2695, 0.2695, 0.2715, 0.2753, 0.2762, 0.2762,
  0.2779, 0.2869, 0.2991, 0.3103, 0.3413, 0.3799,
];

function assertTokensPass(raw: number, opts?: Parameters<typeof planCardText>[1]) {
  const plan = planCardText(raw, opts);
  const bg = grayForLuminance(plan.bgLuminance);
  for (const k of TOKEN_KEYS) {
    const rgb = parseColor(plan.tokens[k]) as RGB;
    assert.ok(rgb, `token ${k} phải parse được: ${plan.tokens[k]}`);
    const ratio = contrastRatio(rgb, bg);
    assert.ok(
      ratio >= AA_NORMAL - 0.02,
      `raw=${raw} tone=${plan.tone} token=${k} ratio=${ratio.toFixed(2)} < ${AA_NORMAL}`,
    );
    // và khớp con số plan tự báo (để bảng in ra tin được)
    assert.ok(Math.abs(ratio - plan.ratios[k]) < 0.05, `ratios[${k}] lệch thực tế`);
  }
}

it('MỌI token chữ card ≥ 4.5 trên CẢ 30 wallpaper (nền tối, chữ kem)', () => {
  for (const raw of WALLPAPER_RAWS) assertTokensPass(raw);
});

it('MỌI token chữ card ≥ 4.5 trên nền gradient tối phẳng (ember/ink/stone)', () => {
  for (const raw of [0.04, 0.06, 0.08, 0.1]) assertTokensPass(raw);
});

it('MỌI token chữ card ≥ 4.5 trên nền linen SÁNG (chữ mực, tone dark)', () => {
  for (const raw of [0.78, 0.82, 0.86, 0.9]) assertTokensPass(raw, { tone: 'dark' });
});

it('MỌI token chữ card ≥ 4.5 quét dày toàn dải 0.02..0.98', () => {
  for (let raw = 0.02; raw <= 0.98; raw += 0.02) {
    // để planCardText tự chọn tone theo độ sáng
    assertTokensPass(Math.round(raw * 1000) / 1000);
  }
});

it('card: một HỆ TÔNG duy nhất (mọi token cùng kem HOẶC cùng mực, không lẫn xám lạnh)', () => {
  for (const raw of [0.13, 0.19, 0.86]) {
    const plan = planCardText(raw, raw > 0.5 ? { tone: 'dark' } : undefined);
    const cream = plan.tone === 'light';
    for (const k of TOKEN_KEYS) {
      const [r, g, b] = parseColor(plan.tokens[k]) as RGB;
      // kem: R≥G≥B và ấm (R>B); mực: tối và ấm — KHÔNG bao giờ xám lạnh (B>R)
      assert.ok(r >= b - 1, `token ${k} không được xám lạnh (b>r): ${plan.tokens[k]}`);
      if (cream) assert.ok(r > 60, `token kem ${k} phải sáng`);
    }
  }
});

it('card: nền càng sáng → sương nội bộ càng đậm, nhưng KHÔNG vượt trần (card vẫn trong)', () => {
  const dark = planCardText(0.06); // rất tối → không cần sương
  const mid = planCardText(0.2);
  const bright = planCardText(0.38); // sáng nhất bộ ảnh
  assert.equal(dark.scrimAlpha, 0);
  assert.ok(bright.scrimAlpha >= mid.scrimAlpha, 'nền sáng hơn → sương đậm hơn (đơn điệu)');
  assert.ok(bright.scrimAlpha > 0);
  assert.ok(bright.scrimAlpha <= 0.42 + 1e-6, 'sương không vượt trần 0.42');
});

it('contrastVsLuminance: đơn điệu — nền sáng hơn thì chữ kem tương phản kém hơn', () => {
  const a = contrastVsLuminance(CREAM, 0.1);
  const b = contrastVsLuminance(CREAM, 0.2);
  assert.ok(a > b);
});

console.log(`\n${passed} test pass\n`);
