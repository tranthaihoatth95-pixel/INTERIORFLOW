/**
 * lib/present-editor/region-layout.test.ts
 * Chạy: node_modules/.bin/sucrase-node lib/present-editor/region-layout.test.ts
 */
import { buildSlideFromRegions } from './region-layout';
import { evaluateSlide } from './layout-check';
import type { RegionCell } from './detect-regions';
import type { TextElement, ImageElement } from './model';

let pass = 0, fail = 0;
const ok = (c: boolean, m: string) => { if (c) { pass++; console.log('  ok  -', m); } else { fail++; console.log('  FAIL-', m); } };

const CELLS: RegionCell[] = [
  { x: 6, y: 6, w: 40, h: 10 }, // mỏng, trên → tiêu đề
  { x: 52, y: 10, w: 42, h: 80 }, // to nhất → ảnh
  { x: 6, y: 20, w: 40, h: 60 }, // vừa → body
];

console.log('[1] Gán vai trò đúng theo hình học');
{
  const s = buildSlideFromRegions({
    cells: CELLS,
    content: { kicker: '01', title: 'Tiêu đề', body: ['Ý một', 'Ý hai'], images: ['data:img'] },
    templateId: 'content-image',
    palette: ['#eee', '#221f1a'],
  });
  const title = s.elements.find((e) => e.kind === 'text' && (e as TextElement).role === 'title') as TextElement;
  const img = s.elements.find((e) => e.kind === 'image') as ImageElement;
  const body = s.elements.find((e) => e.kind === 'text' && (e as TextElement).role === 'body') as TextElement;
  ok(!!title && title.text === 'Tiêu đề', 'có element tiêu đề');
  ok(!!title && title.frame.x === 6 && title.frame.y === 6, 'tiêu đề nằm đúng ô mỏng-trên');
  ok(!!img && img.frame.x === 52 && img.frame.w === 42, 'ảnh nằm đúng ô lớn nhất');
  ok(!!body && /Ý một/.test(body.text) && /Ý hai/.test(body.text), 'body gộp đủ ý');
  ok(s.elements.some((e) => (e as TextElement).role === 'kicker'), 'có kicker');
}

console.log('[2] Kẹp số ảnh theo budget (content-image tối đa 1)');
{
  const s = buildSlideFromRegions({
    cells: CELLS,
    content: { title: 'T', body: ['a'], images: ['data:a', 'data:b'] }, // 2 ảnh
    templateId: 'content-image',
  });
  const nImg = s.elements.filter((e) => e.kind === 'image').length;
  ok(nImg === 1, `2 ảnh đầu vào bị kẹp còn 1 (được ${nImg})`);
}

console.log('[3] Kết quả nằm trong chuẩn — evaluateSlide không báo dày/rỗng');
{
  const s = buildSlideFromRegions({
    cells: CELLS,
    content: { title: 'Tiêu đề ngắn', body: ['Một ý ngắn.'], images: ['data:img'] },
    templateId: 'content-image',
  });
  const r = evaluateSlide(s);
  ok(!r.warnings.some((w) => w.level === 'empty' || w.level === 'dense'), `không báo trống/chật (ws ${r.whitespacePct.toFixed(0)}%)`);
}

console.log('[4] Cells rỗng → slide trơn, KHÔNG ném');
{
  const s = buildSlideFromRegions({ cells: [], content: { title: 'x' }, templateId: 'quote' });
  ok(s.elements.length === 0, `không cells → 0 element (được ${s.elements.length})`);
  ok(s.background !== undefined && s.templateId === 'quote', 'vẫn trả slide hợp lệ');
}

console.log('[5] Hero → cỡ tiêu đề lớn hơn content thường');
{
  const heroS = buildSlideFromRegions({ cells: CELLS, content: { title: 'Bìa' }, templateId: 'cover', hero: true });
  const normS = buildSlideFromRegions({ cells: CELLS, content: { title: 'Nội dung' }, templateId: 'content-image' });
  const ht = (heroS.elements.find((e) => (e as TextElement).role === 'title') as TextElement).fontSize;
  const nt = (normS.elements.find((e) => (e as TextElement).role === 'title') as TextElement).fontSize;
  ok(ht > nt, `tiêu đề hero (${ht}%) > content (${nt}%)`);
}

console.log(`\n${pass} ok, ${fail} fail`);
if (fail > 0) process.exit(1);
