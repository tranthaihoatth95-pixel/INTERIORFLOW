/**
 * lib/gu/inspiration-gate.test.ts — chạy: `node_modules/.bin/sucrase-node lib/gu/inspiration-gate.test.ts`
 */
import assert from 'assert';
import { canApply, gateInspiration, type GateAnalysisLike } from './inspiration-gate';

let n = 0;
function it(name: string, fn: () => void) {
  fn();
  n++;
  console.log(`  ✓ ${name}`);
}

/** bản đọc ảnh giả lập tối thiểu — chỉ những trường cổng cần (`GateAnalysisLike`). */
function analysis(over: Partial<GateAnalysisLike> = {}): GateAnalysisLike {
  const off = { available: false };
  return {
    overallConfidence: 0.6,
    geometry: { calibrated: true },
    furniture: off,
    surfaces: { ceiling: off, wall: off, floor: off },
    semantic: { confidence: 0 },
    ...over,
  };
}

console.log('inspiration-gate');

it('ảnh CC-BY đủ lớn, đã phân tích → ok, chỉ info ghi công, áp được không cần xác nhận', () => {
  const g = gateInspiration({ license: 'cc-by-4.0', width: 1600, height: 1067, analysis: analysis() });
  assert.strictEqual(g.verdict, 'ok');
  assert.deepStrictEqual(g.issues.map((i) => i.code), ['attribution-required']);
  assert.strictEqual(g.needsRightsAck, false);
  assert.strictEqual(canApply(g, false), true);
});

it('link TRANG Pinterest → block, không xác nhận nào cứu được', () => {
  const g = gateInspiration({ license: 'user', source: 'https://www.pinterest.com/pin/123/', width: 1200, height: 800, analysis: analysis() });
  assert.strictEqual(g.verdict, 'block');
  assert.ok(g.issues.some((i) => i.code === 'rights-pinterest'));
  assert.strictEqual(canApply(g, true), false);
});

it('ảnh dán URL (user) → warn + cần xác nhận quyền; xác nhận rồi mới áp được', () => {
  const g = gateInspiration({ license: 'user', width: 1200, height: 800, analysis: analysis() });
  assert.strictEqual(g.verdict, 'warn');
  assert.strictEqual(g.needsRightsAck, true);
  assert.strictEqual(canApply(g, false), false);
  assert.strictEqual(canApply(g, true), true);
});

it('giấy phép thiếu → warn rights-unknown + cần xác nhận', () => {
  const g = gateInspiration({ license: null, width: 1200, height: 800, analysis: analysis() });
  assert.ok(g.issues.some((i) => i.code === 'rights-unknown'));
  assert.strictEqual(g.needsRightsAck, true);
});

it('ảnh quá nhỏ → block too-small; tỉ lệ cực đoan → warn', () => {
  const small = gateInspiration({ license: 'cc0', width: 200, height: 300, analysis: analysis() });
  assert.strictEqual(small.verdict, 'block');
  assert.ok(small.issues.some((i) => i.code === 'too-small'));
  const pano = gateInspiration({ license: 'cc0', width: 4000, height: 600, analysis: analysis() });
  assert.strictEqual(pano.verdict, 'warn');
  assert.ok(pano.issues.some((i) => i.code === 'extreme-aspect'));
});

it('chưa phân tích → block not-analyzed', () => {
  const g = gateInspiration({ license: 'cc0', width: 1200, height: 800, analysis: null });
  assert.strictEqual(g.verdict, 'block');
  assert.ok(g.issues.some((i) => i.code === 'not-analyzed'));
});

it('độ tin quá thấp → block; chỉ màu/ánh sáng → warn thin-evidence', () => {
  const low = gateInspiration({ license: 'cc0', width: 1200, height: 800, analysis: analysis({ overallConfidence: 0.1 }) });
  assert.ok(low.issues.some((i) => i.code === 'low-confidence'));
  assert.strictEqual(low.verdict, 'block');
  const thin = gateInspiration({
    license: 'cc0',
    width: 1200,
    height: 800,
    analysis: analysis({ overallConfidence: 0.3, geometry: { calibrated: false } }),
  });
  assert.ok(thin.issues.some((i) => i.code === 'thin-evidence'));
  assert.strictEqual(thin.verdict, 'warn');
  assert.strictEqual(canApply(thin, false), true);
});

it('ảnh AI sinh → warn ai-generated, không cần xác nhận quyền nhưng cảnh báo hình học', () => {
  const g = gateInspiration({ license: 'ai', width: 1200, height: 800, analysis: analysis() });
  assert.ok(g.issues.some((i) => i.code === 'ai-generated' && i.severity === 'warn'));
  assert.strictEqual(g.needsRightsAck, false);
});

it('mọi issue đều có chữ VI và EN', () => {
  const g = gateInspiration({ license: null, source: 'https://pin.it/abc', width: 100, height: 100, analysis: null });
  for (const i of g.issues) {
    assert.ok(i.vi.length > 10 && i.en.length > 10, i.code);
  }
});

console.log(`${n} test PASS — inspiration-gate`);
