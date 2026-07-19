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

console.log(`\n${passed} test pass\n`);
