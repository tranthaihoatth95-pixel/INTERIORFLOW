/**
 * lib/ui/truth.test.ts — khoá RÀNG BUỘC của nhãn nguồn sự thật.
 * Chạy: `node_modules/.bin/sucrase-node lib/ui/truth.test.ts`
 *
 *  1. Đủ 5 nấc EXS điều 9, dấu KHÁC NHAU từng đôi (kênh hình tự đứng).
 *  2. Nhãn + câu giải thích song ngữ, nhãn ≤ 3 từ (luật ≤12 từ, đây là chip).
 *  3. Token `--truth-*` của từng nấc CÓ THẬT trong globals.css (không trỏ vào ma).
 *  4. Render: chữ hiện (VI/EN đúng theo lang), dấu aria-hidden, aria-label là câu đầy đủ,
 *     compact vẫn giữ chữ trong aria-label (không mất kênh ①).
 *  5. Chữ nhãn KHÔNG tô màu nhấn: `.if-truth` màu chữ là --t1, màu chỉ ở dấu (globals.css).
 *  6. Vỏ components/ui/TruthBadge.tsx chỉ bọc TruthBadgeView — không chép định nghĩa.
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { TRUTH, TRUTH_KINDS, TruthBadgeView, truthAriaLabel } from './truth';

let fail = 0;
function ok(msg: string, cond: unknown) {
  if (cond) console.log('  ok  -', msg);
  else { fail += 1; console.log('  FAIL -', msg); }
}
const ROOT = join(__dirname, '..', '..');
const CSS = readFileSync(join(ROOT, 'app', 'globals.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

console.log('\ntruth — nhãn nguồn sự thật');

console.log('\n[1] năm nấc, dấu khác nhau');
ok('đúng 5 nấc', TRUTH_KINDS.length === 5 && new Set(TRUTH_KINDS).size === 5);
ok('có đủ measured/verified/inferred/external/stale', ['measured', 'verified', 'inferred', 'external', 'stale'].every((k) => TRUTH_KINDS.includes(k as never)));
ok('5 dấu đôi một khác nhau', new Set(TRUTH_KINDS.map((k) => TRUTH[k].dau)).size === 5);
ok('inferred dùng dấu ≈ (cùng dấu với ChiBaoBaMat — một dấu một nghĩa)', TRUTH.inferred.dau === '≈');

console.log('\n[2] song ngữ, ngắn');
for (const k of TRUTH_KINDS) {
  const s = TRUTH[k];
  ok(`${k}: nhãn VI/EN`, Boolean(s.nhan.vi && s.nhan.en));
  ok(`${k}: giải thích VI/EN`, Boolean(s.giaiThich.vi && s.giaiThich.en));
  ok(`${k}: nhãn ≤ 3 từ (VI "${s.nhan.vi}")`, s.nhan.vi.split(/\s+/).length <= 3 && s.nhan.en.split(/\s+/).length <= 3);
}

console.log('\n[3] token có thật');
for (const k of TRUTH_KINDS) {
  ok(`${TRUTH[k].token} khai trong globals.css`, new RegExp(`${TRUTH[k].token}\\s*:`).test(CSS));
  ok(`.if-truth[data-truth='${k}'] có luật CSS`, CSS.includes(`.if-truth[data-truth='${k}']`));
}

console.log('\n[4] render');
for (const k of TRUTH_KINDS) {
  const vi = renderToStaticMarkup(createElement(TruthBadgeView, { kind: k, lang: 'vi' }));
  const en = renderToStaticMarkup(createElement(TruthBadgeView, { kind: k, lang: 'en' }));
  ok(`${k}: VI hiện "${TRUTH[k].nhan.vi}"`, vi.includes(TRUTH[k].nhan.vi));
  ok(`${k}: EN hiện "${TRUTH[k].nhan.en}"`, en.includes(TRUTH[k].nhan.en) && !en.includes(TRUTH[k].nhan.vi));
  ok(`${k}: dấu aria-hidden`, /class="if-truth-dau" aria-hidden="true"/.test(vi));
  ok(`${k}: aria-label là câu đầy đủ`, vi.includes(`aria-label="${truthAriaLabel(k, 'vi')}"`));
  ok(`${k}: data-truth đúng`, vi.includes(`data-truth="${k}"`));
  const compact = renderToStaticMarkup(createElement(TruthBadgeView, { kind: k, lang: 'vi', compact: true }));
  ok(`${k}: compact ẩn chữ nhưng giữ trong aria-label`, !compact.includes('if-truth-nhan') && compact.includes(TRUTH[k].nhan.vi));
  ok(`${k}: không hex`, !/#[0-9a-fA-F]{3,8}\b/.test(vi));
}

console.log('\n[5] màu không tô lên chữ');
{
  const rule = CSS.match(/\.if-truth\s*\{([^}]*)\}/);
  ok('.if-truth có luật', !!rule);
  ok('.if-truth color = var(--t1)', !!rule && /color:\s*var\(--t1\)/.test(rule[1]));
  ok('.if-truth font-size = var(--fs-min) (sàn 11px)', !!rule && /font-size:\s*var\(--fs-min\)/.test(rule[1]));
  ok('.if-truth bo --r-full (capsule có việc)', !!rule && /border-radius:\s*var\(--r-full\)/.test(rule[1]));
  ok('stale viền đứt · inferred viền chấm (kênh dự phòng khi mất màu)', /data-truth='stale'\]\s*\{[^}]*dashed/.test(CSS) && /data-truth='inferred'\]\s*\{[^}]*dotted/.test(CSS));
}

console.log('\n[6] vỏ không chép định nghĩa');
{
  const vo = readFileSync(join(ROOT, 'components', 'ui', 'TruthBadge.tsx'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  ok('TruthBadge.tsx import TruthBadgeView từ lib/ui/truth', /from '@\/lib\/ui\/truth'/.test(vo) && vo.includes('TruthBadgeView'));
  ok('TruthBadge.tsx không khai lại nhãn/dấu', !vo.includes('Đo được') && !vo.includes('≈'));
}

console.log(`\n${fail ? '❌' : '✅'} truth: ${fail ? fail + ' fail' : 'tất cả đạt'}`);
process.exit(fail ? 1 : 0);
