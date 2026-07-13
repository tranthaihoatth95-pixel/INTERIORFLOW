/**
 * lib/gu/feature-dict.test.ts — kiểm từ điển FEATURE + tích hợp perceptron (M-1). Chạy:
 *   node_modules/.bin/sucrase-node lib/gu/feature-dict.test.ts
 */
import {
  templateTraits, presentTemplateFeatures, explainTemplateChoice, baseTemplateId, nearestDeltaE,
  type PresentFeatureContext,
} from './feature-dict';
import { PairwisePerceptron } from './pairwise-perceptron';
import { BUILTIN_TEMPLATES } from '../present-editor/templates';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

const tpl = (id: string) => {
  const t = BUILTIN_TEMPLATES.find((x) => x.id === id);
  if (!t) throw new Error(`thiếu template ${id}`);
  return t;
};

function testTraits() {
  console.log('\n[1] templateTraits — slots + nền sáng/tối rút từ build thật');
  const grid = templateTraits(tpl('grid'));
  ok('grid có 4 ô ảnh', grid.imageSlots === 4);
  ok('grid nền sáng', grid.darkBg === false);
  const dark = templateTraits(tpl('dark-cover'));
  ok('dark-cover nền tối', dark.darkBg === true);
  const quote = templateTraits(tpl('quote'));
  ok('quote 0 ô ảnh', quote.imageSlots === 0);
  ok('baseTemplateId bỏ hậu tố biến thể', baseTemplateId('grid__mir') === 'grid' && baseTemplateId('grid__mir__dark') === 'grid' && baseTemplateId('grid') === 'grid');
}

function testFeatures() {
  console.log('\n[2] presentTemplateFeatures — thang 0..1, thưa, tất định');
  const ctx: PresentFeatureContext = { nImages: 4, textLen: 80, tone: 'dark', gridCells: 4, gutterPct: 2 };
  const g = presentTemplateFeatures(templateTraits(tpl('grid')), ctx);
  ok('img.slotFit = 1 khi 4 ô khớp 4 ảnh', g['img.slotFit'] === 1);
  ok('grid.cellMatch = 1 khi lưới mẫu 4 ô', g['grid.cellMatch'] === 1);
  ok('grid.tightMulti > 0 (gutter khít + ≥4 ô)', (g['grid.tightMulti'] ?? 0) > 0);
  ok('one-hot tpl: + shelf:', g['tpl:grid'] === 1 && g['shelf:content'] === 1);
  ok('feature = 0 bị loại khỏi vector (thưa)', !('pal.toneMatch' in g)); // grid nền sáng ≠ tone dark → 0 → xoá
  const d = presentTemplateFeatures(templateTraits(tpl('dark-cover')), ctx);
  ok('pal.toneMatch = 1 cho nền tối khi tone=dark', d['pal.toneMatch'] === 1 && d['pal.darkBg'] === 1);
  ok('mọi giá trị ∈ [0,1]', [...Object.values(g), ...Object.values(d)].every((v) => v >= 0 && v <= 1));
  ok('tất định — chạy lại y hệt', JSON.stringify(presentTemplateFeatures(templateTraits(tpl('grid')), ctx)) === JSON.stringify(g));

  const quote = presentTemplateFeatures(templateTraits(tpl('quote')), { nImages: 0, textLen: 400 });
  ok('bố cục thiên chữ × slide dày chữ → text.fit cao', (quote['text.fit'] ?? 0) >= 0.9);
}

function testDeltaE() {
  console.log('\n[3] nearestDeltaE — ΔE*76 tới màu gu gần nhất');
  ok('trùng màu → 0', nearestDeltaE('#221f1a', ['#f5f1ea', '#221f1a']) === 0);
  const far = nearestDeltaE('#221f1a', ['#ffffff']);
  ok('màu xa → ΔE lớn', far !== null && far > 40);
  ok('thiếu palette → null (bỏ tín hiệu)', nearestDeltaE('#221f1a', []) === null && nearestDeltaE('xx', ['#fff']) === null);
}

function testExplain() {
  console.log('\n[4] explainTemplateChoice — 2-3 lý do người đọc được');
  const ctx: PresentFeatureContext = { nImages: 4, textLen: 40, tone: 'light', gridCells: 4, gutterPct: 2 };
  const rs = explainTemplateChoice(templateTraits(tpl('grid')), ctx);
  ok('≤ 3 lý do', rs.length > 0 && rs.length <= 3);
  ok('nêu khớp ô ảnh', rs.some((r) => r.includes('4 ô ảnh')));
  const rsW = explainTemplateChoice(templateTraits(tpl('grid')), ctx, { 'tpl:grid': 1.5 });
  ok('có trọng số học → lý do "hay Nhận" nổi lên', rsW.some((r) => r.includes('hay Nhận')));
  const none = explainTemplateChoice(templateTraits(tpl('quote')), { nImages: 0, textLen: 10 });
  ok('tín hiệu yếu → có thể 0 lý do, không ném', Array.isArray(none));
}

function testPerceptronIntegration() {
  console.log('\n[5] tích hợp perceptron — Nhận/Bỏ đổi thứ tự rank, degrade giữ thứ tự gốc');
  const ctx: PresentFeatureContext = { nImages: 1, textLen: 60, tone: 'dark' };
  const cover = tpl('cover');
  const darkCover = tpl('dark-cover');
  const feat = (t: typeof cover) => presentTemplateFeatures(templateTraits(t), ctx);

  const m = new PairwisePerceptron({ minPairs: 3 });
  const before = m.rank([cover, darkCover], feat, () => 0);
  ok('CHƯA đủ cặp → giữ thứ tự gốc (degrade heuristic)', before[0].id === 'cover');

  // user Nhận dark-cover, Bỏ cover — 3 lần (như 3 phiên feedback)
  for (let i = 0; i < 3; i++) m.update(feat(darkCover), feat(cover));
  ok('đủ cặp → ready', m.ready());
  const after = m.rank([cover, darkCover], feat, () => 0);
  ok('re-rank: dark-cover leo lên đầu', after[0].id === 'dark-cover');

  // serialize vòng tròn — trọng số sống qua localStorage (ở đây kiểm JSON thuần).
  // LƯU Ý: minPairs là OPTION của instance (không nằm trong state) — nạp lại phải truyền lại.
  const m2 = PairwisePerceptron.deserialize(m.serialize(), { minPairs: 3 });
  ok('state sống qua serialize', m2.rank([cover, darkCover], feat, () => 0)[0].id === 'dark-cover');
}

testTraits();
testFeatures();
testDeltaE();
testExplain();
testPerceptronIntegration();

console.log(`\n${pass} ok, ${fail} fail`);
if (fail > 0) process.exit(1);
