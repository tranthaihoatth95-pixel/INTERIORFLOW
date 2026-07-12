/**
 * lib/present-editor/layout-check.test.ts
 * Chạy: node_modules/.bin/sucrase-node lib/present-editor/layout-check.test.ts
 */
import { makeText, makeImage } from './model';
import type { EditorSlide, SlideElement } from './model';
import { evaluateSlide, evaluateDeck } from './layout-check';
import { budgetFor, DEFAULT_BUDGET } from './standards';

let pass = 0, fail = 0;
const ok = (c: boolean, m: string) => { if (c) { pass++; console.log('  ok  -', m); } else { fail++; console.log('  FAIL-', m); } };

function slide(els: SlideElement[], templateId?: string, bg?: string): EditorSlide {
  return { id: 's', background: '#fff', backgroundImage: bg ?? null, elements: els, templateId };
}
const has = (rep: ReturnType<typeof evaluateSlide>, level: string, metric?: string) =>
  rep.warnings.some((w) => w.level === level && (!metric || w.metric === metric));

console.log('[1] Trống quá — 1 text nhỏ trên slide content');
{
  const s = slide([makeText({ frame: { x: 8, y: 8, w: 20, h: 5, rotation: 0 }, text: 'Hi' })], 'content-image');
  const r = evaluateSlide(s);
  ok(r.whitespacePct > 72, `whitespace ${r.whitespacePct.toFixed(0)}% > 72`);
  ok(has(r, 'empty', 'whitespace'), 'phát cảnh báo TRỐNG QUÁ');
}

console.log('[2] Chật quá — 4 khối lớn phủ >70% (two-column)');
{
  const big = [0, 1, 2, 3].map((i) =>
    makeText({ frame: { x: (i % 2) * 48 + 3, y: Math.floor(i / 2) * 48 + 3, w: 45, h: 45, rotation: 0 }, text: 'x' }),
  );
  const r = evaluateSlide(slide(big, 'two-column'));
  ok(r.whitespacePct < 30, `whitespace ${r.whitespacePct.toFixed(0)}% < 30`);
  ok(has(r, 'dense', 'whitespace'), 'phát cảnh báo CHẬT QUÁ');
}

console.log('[3] Chữ tràn khung');
{
  const long = 'A'.repeat(300);
  const s = slide([makeText({ frame: { x: 5, y: 5, w: 20, h: 8, rotation: 0 }, text: long, fontSize: 3, lineHeight: 1.4 })], 'quote');
  const r = evaluateSlide(s);
  ok(has(r, 'overflow', 'textOverflow'), 'phát cảnh báo CHỮ TRÀN');
}

console.log('[4] Cân đối — content-image không cảnh báo');
{
  const els = [
    makeImage('data:x', { frame: { x: 52, y: 11, w: 45, h: 78, rotation: 0 } }), // area 35.1
    makeText({ frame: { x: 6, y: 12, w: 40, h: 10, rotation: 0 }, text: 'Tiêu đề', role: 'title', fontSize: 5 }),
    makeText({ frame: { x: 6, y: 30, w: 40, h: 24, rotation: 0 }, text: 'Một dòng ý ngắn.', role: 'body', fontSize: 2.6 }),
  ];
  const r = evaluateSlide(slide(els, 'content-image'));
  ok(r.imageAreaPct >= 28 && r.imageAreaPct <= 40, `diện tích ảnh ${r.imageAreaPct.toFixed(0)}% trong 28–40`);
  ok(r.whitespacePct >= 42 && r.whitespacePct <= 55, `whitespace ${r.whitespacePct.toFixed(0)}% trong 42–55`);
  ok(r.warnings.length === 0, `không cảnh báo (được ${r.warnings.length})`);
}

console.log('[5] Bleed — full-bleed phủ 100% KHÔNG báo chật');
{
  const r = evaluateSlide(slide([makeImage('data:x', { frame: { x: 0, y: 0, w: 100, h: 100, rotation: 0 } })], 'full-bleed'));
  ok(r.bleed === true, 'nhận diện bleed');
  ok(!has(r, 'dense'), 'KHÔNG báo chật quá dù phủ 100%');
}

console.log('[6] backgroundImage → coi là bleed');
{
  const r = evaluateSlide(slide([makeText({ text: 'T' })], 'content-image', 'data:bg'));
  ok(r.coveragePct === 100 && r.bleed === true, 'có ảnh nền → coverage 100 + bleed');
  ok(!has(r, 'dense') && !has(r, 'empty'), 'không báo trống/chật khi bleed');
}

console.log('[7] budgetFor fallback + evaluateDeck lọc slide có cảnh báo');
{
  ok(budgetFor('không-có-id') === DEFAULT_BUDGET, 'templateId lạ → DEFAULT_BUDGET');
  const good = slide([
    makeImage('data:x', { frame: { x: 52, y: 11, w: 45, h: 78, rotation: 0 } }),
    makeText({ frame: { x: 6, y: 12, w: 40, h: 10, rotation: 0 }, text: 'Tiêu đề', fontSize: 5 }),
    makeText({ frame: { x: 6, y: 30, w: 40, h: 24, rotation: 0 }, text: 'Ý ngắn.', fontSize: 2.6 }),
  ], 'content-image');
  const bad = slide([makeText({ frame: { x: 8, y: 8, w: 20, h: 5, rotation: 0 }, text: 'Hi' })], 'content-image');
  const deck = evaluateDeck([good, bad]);
  ok(deck.length === 1 && deck[0].slide === 2, 'chỉ slide 2 (bad) bị gắn cảnh báo');
}

console.log(`\n${pass} ok, ${fail} fail`);
if (fail > 0) process.exit(1);
