/**
 * lib/present-editor/reference-layout.test.ts (phần THUẦN, không DOM)
 * Chạy: node_modules/.bin/sucrase-node lib/present-editor/reference-layout.test.ts
 */
import { buildSlidesFromCells } from './reference-layout';
import { parseBlocks } from './content-deck';
import type { RegionCell } from './detect-regions';
import type { TextElement } from './model';

let pass = 0, fail = 0;
const ok = (c: boolean, m: string) => { if (c) { pass++; console.log('  ok  -', m); } else { fail++; console.log('  FAIL-', m); } };

const CELLS: RegionCell[] = [
  { x: 6, y: 6, w: 40, h: 10 },
  { x: 52, y: 10, w: 42, h: 80 },
  { x: 6, y: 20, w: 40, h: 60 },
];
const TEXT = '# Bìa\nMở đầu.\n\n## Mục A\n- ý một\n- ý hai\n\n## Trích\n> Một câu trích ngắn.';

console.log('[1] Mỗi block → 1 slide theo lưới ảnh');
{
  const blocks = parseBlocks(TEXT);
  const slides = buildSlidesFromCells(CELLS, blocks, ['data:a', 'data:b']);
  ok(slides.length === blocks.length && slides.length === 3, `3 block → 3 slide (được ${slides.length})`);

  const s0 = slides[0];
  const title0 = s0.elements.find((e) => e.kind === 'text' && (e as TextElement).role === 'title') as TextElement;
  ok(s0.templateId === 'cover', 'slide đầu = cover');
  ok(!!title0 && title0.text === 'Bìa', 'slide đầu có tiêu đề "Bìa"');
  ok(s0.elements.some((e) => e.kind === 'image'), 'slide đầu có ảnh (rải từ lưới)');

  const s2 = slides[2];
  ok(s2.templateId === 'quote', 'block blockquote → quote');
  ok(!s2.elements.some((e) => e.kind === 'image'), 'slide quote KHÔNG ảnh');
  const qt = s2.elements.find((e) => (e as TextElement).role === 'title') as TextElement;
  ok(!!qt && /Một câu trích/.test(qt.text), 'quote lấy câu trích làm tiêu đề');
}

console.log('[2] Rỗng → [] (để caller fallback)');
{
  ok(buildSlidesFromCells([], parseBlocks(TEXT), []).length === 0, 'không cells → []');
  ok(buildSlidesFromCells(CELLS, [], []).length === 0, 'không block → []');
}

console.log(`\n${pass} ok, ${fail} fail`);
if (fail > 0) process.exit(1);
