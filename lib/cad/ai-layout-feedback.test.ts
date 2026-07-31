/**
 * lib/cad/ai-layout-feedback.test.ts — kiểm feature vector CAD layout option + khoá bộ học Gu
 * theo người dùng (0a, 31/07). Chạy:
 *   node_modules/.bin/sucrase-node lib/cad/ai-layout-feedback.test.ts
 */
import {
  layoutOptionFeatures,
  explainLayoutOption,
  cadLayoutOptionModelKey,
  CAD_LAYOUT_OPTION_MODEL_KEY,
  type LayoutOptionSignal,
} from './ai-layout-feedback';

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

function testFeatures() {
  console.log('\n[1] layoutOptionFeatures — thang 0..1, one-hot biến thể');
  const clean: LayoutOptionSignal = { variant: 0, violationCount: 0, placedRatio: 1 };
  const f = layoutOptionFeatures(clean);
  ok('không vi phạm → layout.violations = 0', f['layout.violations'] === 0);
  ok('đặt đủ hết → layout.placedRatio = 1', f['layout.placedRatio'] === 1);
  ok('one-hot variant:default = 1', f['variant:default'] === 1);
  ok('không one-hot biến thể khác', f['variant:opposite'] === undefined && f['variant:rotate90'] === undefined);

  const dirty: LayoutOptionSignal = { variant: 2, violationCount: 9, placedRatio: 0.5 };
  const g = layoutOptionFeatures(dirty);
  ok('vi phạm clamp ở 1 (9/6 > 1)', g['layout.violations'] === 1);
  ok('one-hot variant:rotate90 = 1', g['variant:rotate90'] === 1);
}

function testExplain() {
  console.log('\n[2] explainLayoutOption — tối đa 2 lý do, không bịa');
  const clean: LayoutOptionSignal = { variant: 0, violationCount: 0, placedRatio: 1 };
  const rs = explainLayoutOption(clean);
  ok('≤ 2 lý do', rs.length <= 2);
  ok('nêu không vi phạm', rs.some((r) => r.includes('Không phát hiện vi phạm')));

  const missing: LayoutOptionSignal = { variant: 1, violationCount: 2, placedRatio: 0.6 };
  const rs2 = explainLayoutOption(missing);
  ok('nêu số vi phạm', rs2.some((r) => r.includes('2 vi phạm')));
  ok('nêu thiếu chỗ', rs2.some((r) => r.includes('Thiếu chỗ')));

  const learned = explainLayoutOption(clean, { 'variant:default': 0.5 });
  ok('trọng số học cao → nêu lý do "hay chọn"', learned.some((r) => r.includes('hay chọn')));
}

/**
 * [3] cadLayoutOptionModelKey (0a, 31/07) — 2 userId khác nhau PHẢI ra 2 khoá khác nhau (⇒ 2 bộ
 * trọng số tách biệt). Không có userId → null (không persist, không rơi về khoá cũ dùng chung).
 * Cùng quyết định/lý do như presentTemplateModelKey (lib/gu/feature-dict.ts) — xem giải thích ở đó.
 */
function testModelKeyPerUser() {
  console.log('\n[3] cadLayoutOptionModelKey — tách khoá theo userId (0a)');
  const kA = cadLayoutOptionModelKey('user-A');
  const kB = cadLayoutOptionModelKey('user-B');
  ok('userId khác nhau → khoá khác nhau', kA !== kB);
  ok('khoá A mang đúng userId A', kA === `${CAD_LAYOUT_OPTION_MODEL_KEY}.user-A`);
  ok('khoá B mang đúng userId B', kB === `${CAD_LAYOUT_OPTION_MODEL_KEY}.user-B`);
  ok('cùng userId → cùng khoá (tất định)', cadLayoutOptionModelKey('user-A') === kA);
  ok('không có userId (null) → null, KHÔNG rơi về khoá cũ dùng chung', cadLayoutOptionModelKey(null) === null);
  ok('không có userId (undefined) → null', cadLayoutOptionModelKey(undefined) === null);
  ok('khoá mới KHÔNG trùng khoá cũ cố định (khoá cũ để yên, không đụng)', kA !== CAD_LAYOUT_OPTION_MODEL_KEY && kB !== CAD_LAYOUT_OPTION_MODEL_KEY);
}

testFeatures();
testExplain();
testModelKeyPerUser();

console.log(`\n${pass} ok, ${fail} fail`);
if (fail > 0) process.exit(1);
