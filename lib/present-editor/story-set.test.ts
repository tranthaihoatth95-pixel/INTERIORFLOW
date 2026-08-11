/**
 * lib/present-editor/story-set.test.ts — [storySet] nghiệm thu Story Set v1.
 * Chạy: node_modules/.bin/sucrase-node lib/present-editor/story-set.test.ts
 *
 * Giữ 4 điều: đúng số trang · trang nào cũng có element và không element nào thiếu id ·
 * chế độ mẫu/placeholder/ảnh-người-dùng đúng ưu tiên · round-trip `.idfp` không mất gì.
 */
import { buildStorySetDeck, STORY_SET_SAMPLE_IMAGES, STORY_SET_PALETTE } from './story-set';
import { exportIdfp, importIdfp } from './idfp';
import type { ImageElement, TextElement } from './model';

let pass = 0, fail = 0;
const ok = (c: boolean, m: string) => { if (c) { pass++; console.log('  ok  -', m); } else { fail++; console.log('  FAIL-', m); } };

console.log('[1] Deck mặc định — 8 trang, trang nào cũng có element, id đầy đủ & duy nhất');
{
  const deck = buildStorySetDeck({ projectName: 'Nhà Vườn Xuân' });
  ok(deck.slides.length === 8, `đúng 8 trang (thực: ${deck.slides.length})`);
  ok(deck.fonts === 'Editorial', 'bộ chữ Editorial (serif display)');
  ok(deck.docType === 'deck', 'docType = deck');
  ok(deck.project === 'Nhà Vườn Xuân', 'tên dự án vào deck');
  ok(deck.palette.length >= 5 && deck.palette[0] === STORY_SET_PALETTE[0], 'palette kem Story Set');
  ok(deck.slides.every((s) => s.elements.length > 0), 'mọi trang có ít nhất 1 element');
  const ids: string[] = [];
  for (const s of deck.slides) {
    ok(typeof s.id === 'string' && s.id.length > 0, `slide ${s.templateId} có id`);
    for (const e of s.elements) ids.push(e.id);
  }
  ok(ids.every((id) => typeof id === 'string' && id.length > 0), 'không element nào thiếu id');
  ok(new Set(ids).size === ids.length, `id element duy nhất (${ids.length} element)`);
  const slideIds = deck.slides.map((s) => s.id);
  ok(new Set(slideIds).size === slideIds.length, 'id slide duy nhất');
  // đủ 6 chương theo chốt hero output
  const tpls = deck.slides.map((s) => s.templateId);
  for (const t of ['story-cover', 'story-dna', 'story-space', 'story-zoning', 'story-cinema', 'story-daynight', 'story-materials', 'story-appendix'])
    ok(tpls.includes(t), `có trang ${t}`);
}

console.log('[2] Bản MẪU dùng ảnh minh hoạ Unsplash; bìa serif; không lorem');
{
  const deck = buildStorySetDeck();
  const imgs = deck.slides.flatMap((s) => s.elements.filter((e): e is ImageElement => e.kind === 'image'));
  ok(imgs.length >= 4, `≥4 khung dùng ảnh minh hoạ (thực: ${imgs.length})`);
  ok(imgs.every((e) => e.src.startsWith('https://images.unsplash.com/')), 'ảnh minh hoạ đều từ Unsplash');
  ok(deck.slides.some((s) => s.backgroundImage && String(s.backgroundImage).startsWith('https://images.unsplash.com/')), 'trang điện ảnh có ảnh nền mẫu');
  const cover = deck.slides[0];
  const title = cover.elements.find((e): e is TextElement => e.kind === 'text' && (e as TextElement).role === 'title');
  ok(!!title && /serif/i.test(title.fontFamily || ''), 'tiêu đề bìa dùng stack serif');
  const allText = deck.slides.flatMap((s) => s.elements.filter((e): e is TextElement => e.kind === 'text').map((e) => e.text)).join(' ');
  ok(!/lorem|ipsum/i.test(allText), 'không có lorem ipsum');
  // zoning + phụ lục LUÔN là placeholder có nhãn hành động (không giả dữ liệu thật)
  ok(/Thả sơ đồ zoning/.test(allText), 'khung zoning có nhãn chỉ dẫn');
  ok(/Thả bảng BOQ/.test(allText), 'khung BOQ có nhãn chỉ dẫn');
}

console.log('[3] sampleImages:false — không còn URL ngoài, mọi khung là placeholder có nhãn');
{
  const deck = buildStorySetDeck({ sampleImages: false });
  const raw = JSON.stringify(deck);
  ok(!raw.includes('images.unsplash.com'), 'không còn URL Unsplash nào trong deck');
  const labels = deck.slides.flatMap((s) => s.elements.filter((e): e is TextElement => e.kind === 'text').map((e) => e.text));
  ok(labels.some((t) => /Thả ảnh render vào đây/.test(t)), 'placeholder có nhãn "Thả ảnh render vào đây"');
}

console.log('[4] Ảnh người dùng thắng ảnh mẫu');
{
  const deck = buildStorySetDeck({ images: ['data:image/png;base64,AAA'] });
  const imgs = deck.slides.flatMap((s) => s.elements.filter((e): e is ImageElement => e.kind === 'image'));
  ok(imgs.length > 0 && imgs.every((e) => e.src === 'data:image/png;base64,AAA'), 'mọi khung ảnh dùng ảnh người dùng');
}

console.log('[5] Round-trip .idfp — serialize/parse không mất dữ liệu');
{
  const deck = buildStorySetDeck({ projectName: 'Căn hộ Thảo Điền' });
  const json = exportIdfp([{ id: 'sh1', name: 'Hồ sơ 1', deck }], null, { projectName: 'Căn hộ Thảo Điền' });
  const parsed = importIdfp(json);
  ok(!!parsed, 'importIdfp đọc lại được');
  ok(parsed!.sheets.length === 1, 'đủ 1 sheet');
  ok(JSON.stringify(parsed!.sheets[0].deck) === JSON.stringify(deck), 'deck sau round-trip GIỐNG HỆT deck gốc');
}

console.log(`\n${pass} ok, ${fail} fail`);
if (fail) process.exit(1);
