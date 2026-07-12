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

console.log('[6] Ảnh mẫu BẬN (21 ô vụn) → KẸP về ít ô, slide gọn, không loãng');
{
  // Giả lập detectRegions ra lưới 3 hàng × 7 cột = 21 ô nhỏ (~14%W × ~30%H mỗi ô).
  const busy: RegionCell[] = [];
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 7; c++) busy.push({ x: c * (100 / 7), y: r * (100 / 3), w: 100 / 7, h: 100 / 3 });
  ok(busy.length === 21, `dựng đúng 21 ô vụn (được ${busy.length})`);

  const s = buildSlideFromRegions({
    cells: busy,
    content: { kicker: '01', title: 'Tiêu đề gọn', body: ['Ý một', 'Ý hai'], images: ['data:img'] },
    templateId: 'content-image',
  });
  const nText = s.elements.filter((e) => e.kind === 'text').length; // kicker + title + body
  const nImg = s.elements.filter((e) => e.kind === 'image').length;
  const nBody = s.elements.filter((e) => e.kind === 'text' && (e as TextElement).role === 'body').length;
  ok(nImg === 1, `chỉ 1 ảnh (kẹp budget), được ${nImg}`);
  ok(nBody === 1, `body gộp vào 1 ô (không rải khắp 21 ô), được ${nBody}`);
  ok(nText <= 3, `tổng khối chữ gọn ≤ 3 (kicker+title+body), được ${nText}`);
  const body = s.elements.find((e) => (e as TextElement).role === 'body') as TextElement;
  ok(!!body && /Ý một/.test(body.text) && /Ý hai/.test(body.text), 'cả 2 ý dồn vào 1 khối body');
  const r = evaluateSlide(s);
  ok(!r.warnings.some((w) => w.level === 'empty' || w.level === 'dense'), `không trống/chật (ws ${r.whitespacePct.toFixed(0)}%)`);
}

console.log('[7] Biên độ MIN–MAX: ảnh vượt trần diện tích → CO ảnh; tiêu đề dài → cỡ nhỏ hơn');
{
  // 1 ô ảnh KHỔNG LỒ (80%W×80%H = 64% sân khấu) — content-image trần imageAreaPct = 40%.
  const cells: RegionCell[] = [
    { x: 6, y: 4, w: 60, h: 8 }, // tiêu đề mỏng trên
    { x: 10, y: 15, w: 80, h: 80 }, // ảnh quá lớn
  ];
  const s = buildSlideFromRegions({
    cells,
    content: { title: 'T', images: ['data:big'] },
    templateId: 'content-image',
  });
  const img = s.elements.find((e) => e.kind === 'image') as ImageElement;
  const areaPct = (img.frame.w * img.frame.h) / 100;
  ok(areaPct <= 40 + 0.5, `ảnh co về trần ≤40% sân khấu (được ${areaPct.toFixed(1)}%)`);
  ok(img.frame.w < 80, `ảnh thu nhỏ khỏi ô 80%W (được ${img.frame.w.toFixed(1)}%W)`);

  // tiêu đề dài (>titleWordsIdeal) phải nhỏ hơn tiêu đề ngắn cùng layout.
  const longS = buildSlideFromRegions({
    cells,
    content: { title: 'Một tiêu đề rất là dài vượt quá ngưỡng lý tưởng nhiều từ' },
    templateId: 'content-image',
  });
  const shortS = buildSlideFromRegions({ cells, content: { title: 'Ngắn' }, templateId: 'content-image' });
  const lt = (longS.elements.find((e) => (e as TextElement).role === 'title') as TextElement).fontSize;
  const st = (shortS.elements.find((e) => (e as TextElement).role === 'title') as TextElement).fontSize;
  ok(lt < st, `tiêu đề dài (${lt}%) co nhỏ hơn tiêu đề ngắn (${st}%)`);
  ok(lt >= 4.5, `nhưng không nhỏ hơn min dải (4.5%), được ${lt}%`);
}

console.log(`\n${pass} ok, ${fail} fail`);
if (fail > 0) process.exit(1);
