/**
 * lib/gu/pairwise-perceptron.test.ts — kiểm learning-to-rank online (A-5). Chạy:
 *   node_modules/.bin/sucrase-node lib/gu/pairwise-perceptron.test.ts
 */
import { PairwisePerceptron, type FeatureVector } from './pairwise-perceptron';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

/** LCG seeded — dữ liệu tổng hợp TẤT ĐỊNH (không Math.random). */
function lcg(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

const FEATS = ['mood:warm', 'mood:cool', 'op:office', 'op:residential', 'nImg', 'textLen'];

/** "Gu thật" ẩn của user — model phải học lại được thứ hạng này từ cặp Nhận/Bỏ. */
const TRUE_W: FeatureVector = {
  'mood:warm': 2.0, 'mood:cool': -1.0, 'op:office': 0.5, 'op:residential': 1.2, nImg: 0.8, textLen: -0.6,
};

function randFeature(rnd: () => number): FeatureVector {
  const f: FeatureVector = {};
  for (const k of FEATS) f[k] = Math.round(rnd() * 20) / 10; // 0..2, bước 0.1 — tất định
  return f;
}

const trueScore = (f: FeatureVector) => FEATS.reduce((s, k) => s + (TRUE_W[k] ?? 0) * (f[k] ?? 0), 0);

function testConvergence() {
  console.log('\n[1] Hội tụ trên dữ liệu tổng hợp — học lại "gu ẩn" từ 300 cặp Nhận/Bỏ');
  const m = new PairwisePerceptron({ minPairs: 10 });
  const rnd = lcg(42);
  for (let i = 0; i < 300; i++) {
    const a = randFeature(rnd);
    const b = randFeature(rnd);
    if (Math.abs(trueScore(a) - trueScore(b)) < 0.3) continue; // cặp mập mờ — user thật cũng bỏ qua
    if (trueScore(a) > trueScore(b)) m.update(a, b);
    else m.update(b, a);
  }
  ok('đã đủ dữ liệu (ready)', m.ready());
  // đo pairwise-accuracy trên 200 cặp KIỂM TRA chưa từng thấy
  const test = lcg(7);
  let correct = 0;
  let total = 0;
  for (let i = 0; i < 200; i++) {
    const a = randFeature(test);
    const b = randFeature(test);
    if (Math.abs(trueScore(a) - trueScore(b)) < 0.3) continue;
    total += 1;
    if ((m.score(a) > m.score(b)) === (trueScore(a) > trueScore(b))) correct += 1;
  }
  const acc = correct / total;
  console.log(`      pairwise accuracy = ${(acc * 100).toFixed(1)}% (${correct}/${total})`);
  ok('accuracy ≥ 85% trên cặp chưa thấy', acc >= 0.85);
}

function testDegrade() {
  console.log('\n[2] Degrade — dưới minPairs, rank() theo HEURISTIC (model không cầm lái)');
  const m = new PairwisePerceptron({ minPairs: 5 });
  // dạy model 2 cặp NGƯỢC heuristic (chưa đủ 5) — rank vẫn phải theo heuristic
  m.update({ x: 1 }, { y: 1 });
  m.update({ x: 1 }, { y: 1 });
  const items = [{ id: 'A', h: 1 }, { id: 'B', h: 3 }, { id: 'C', h: 2 }];
  const byHeur = m.rank(items, (it) => ({ [it.id]: 1 }), (it) => it.h).map((i) => i.id);
  ok('chưa ready', !m.ready());
  ok('rank = thứ tự heuristic B,C,A', byHeur.join(',') === 'B,C,A');
  // đủ cặp → model cầm lái
  for (let i = 0; i < 5; i++) m.update({ A: 1 }, { B: 1 });
  ok('đủ cặp → ready', m.ready());
  const byModel = m.rank(items, (it) => ({ [it.id]: 1 } as FeatureVector), (it) => it.h).map((i) => i.id);
  ok('model đẩy A lên trước B', byModel.indexOf('A') < byModel.indexOf('B'));
}

function testMarginAndClamp() {
  console.log('\n[3] Margin update + clamp trọng số');
  const m = new PairwisePerceptron({ learningRate: 1, margin: 1, maxWeight: 2, minPairs: 1 });
  ok('cặp chưa tách → CÓ update', m.update({ a: 1 }, { b: 1 }) === true);
  // lặp 100 lần cùng cặp — trọng số phải bị kẹp ở ±2, không phình vô hạn
  for (let i = 0; i < 100; i++) m.update({ a: 1 }, { b: 1 });
  const st = m.toState();
  ok('|w| ≤ maxWeight (clamp chống drift)', Math.abs(st.weights.a) <= 2 && Math.abs(st.weights.b) <= 2);
  // cặp đã tách đủ margin → KHÔNG update nữa
  ok('cặp đã tách đủ margin → không update', m.update({ a: 1 }, { b: 1 }) === false);
}

function testSerializeRoundTrip() {
  console.log('\n[4] Serialize round-trip (localStorage/IndexedDB đều dùng chuỗi này)');
  const m = new PairwisePerceptron({ minPairs: 2 });
  m.update({ 'mood:warm': 1, nImg: 2 }, { 'mood:cool': 1 });
  m.update({ 'mood:warm': 1 }, { textLen: 3 });
  const json = m.serialize();
  const m2 = PairwisePerceptron.deserialize(json, { minPairs: 2 });
  ok('pairsSeen giữ nguyên', m2.pairsSeen === m.pairsSeen);
  const probe: FeatureVector = { 'mood:warm': 1, 'mood:cool': 0.5, nImg: 1, textLen: 1 };
  ok('score y hệt sau round-trip', Math.abs(m2.score(probe) - m.score(probe)) < 1e-12);
  ok('ready giữ nguyên', m2.ready() === m.ready());
}

function testCorruptData() {
  console.log('\n[5] Dữ liệu hỏng → model mới tinh, không ném (degrade an toàn)');
  ok('JSON rác', PairwisePerceptron.deserialize('{oops').pairsSeen === 0);
  ok('null/undefined', PairwisePerceptron.deserialize(null).pairsSeen === 0);
  ok('version lạ', PairwisePerceptron.deserialize('{"version":99,"weights":{"a":1}}').score({ a: 1 }) === 0);
  ok('weight Infinity bị bỏ', PairwisePerceptron.deserialize('{"version":1,"weights":{"a":null,"b":1e999},"pairsSeen":3}').score({ a: 1, b: 1 }) === 0);
  // node không có localStorage → load phải trả model mới, không ném
  ok('loadFromLocalStorage không có localStorage → model mới', PairwisePerceptron.loadFromLocalStorage('k').pairsSeen === 0);
}

function testDeterministic() {
  console.log('\n[6] Tất định — cùng chuỗi cặp ra cùng trọng số + cùng rank');
  const run = () => {
    const m = new PairwisePerceptron();
    const rnd = lcg(123);
    for (let i = 0; i < 50; i++) {
      const a = randFeature(rnd);
      const b = randFeature(rnd);
      m.update(a, b);
    }
    return m.serialize().replace(/"updatedAt":\d+/, '');
  };
  ok('2 lần chạy giống hệt', run() === run());
}

testConvergence();
testDegrade();
testMarginAndClamp();
testSerializeRoundTrip();
testCorruptData();
testDeterministic();

console.log(`\n${pass} ok, ${fail} fail`);
if (fail > 0) process.exit(1);
