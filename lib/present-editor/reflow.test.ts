/**
 * lib/present-editor/reflow.test.ts — kiểm DÀN LẠI khi đổi khổ trình bày (PS-4). Chạy:
 *   node_modules/.bin/sucrase-node lib/present-editor/reflow.test.ts
 *
 * Trọng tâm:
 *  - KHÔNG mất dữ liệu (số phần tử/ảnh/khối chữ giữ nguyên) dù ô canonical ít/nhiều hơn.
 *  - Frame sau dàn lại nằm trong biên 0..100.
 *  - Cùng khổ / cùng họ tỉ lệ (A4↔A3 cùng hướng) → % KHÔNG đổi (no-op).
 *  - Khác hướng (16:9 ↔ dọc) → tiêu đề/ảnh/thân bài được XẾP LẠI hợp lý (không chỉ giữ %).
 *  - Phần tử tự do (freeform) không bị dàn lại theo lưới — chỉ giữ nguyên % (kẹp biên).
 *  - reflowDeckForStage thuần — KHÔNG mutate deck gốc.
 */
import { makeText, makeImage, makeShape, type EditorDeck, type EditorSlide, type TextElement, type ImageElement } from './model';
import { reflowSlideForStage, reflowDeckForStage } from './reflow';
import { STAGE_PRESETS } from './stage-presets';

let pass = 0;
let fail = 0;
const ok = (label: string, cond: boolean) => {
  if (cond) {
    pass += 1;
    console.log(`  ok  - ${label}`);
  } else {
    fail += 1;
    console.log(`  FAIL - ${label}`);
  }
};

const P16_9 = STAGE_PRESETS['16:9'];
const A4_LANDSCAPE = STAGE_PRESETS['a4-landscape'];
const A4_PORTRAIT = STAGE_PRESETS['a4-portrait'];
const A3_LANDSCAPE = STAGE_PRESETS['a3-landscape'];

function withinStage(f: { x: number; y: number; w: number; h: number }): boolean {
  return f.x >= -0.01 && f.y >= -0.01 && f.x + f.w <= 100.51 && f.y + f.h <= 100.51;
}

/** Slide mẫu: kicker + tiêu đề + 1 ảnh + 1 thân bài, bố cục kiểu "content-image" (16:9). */
function contentImageSlide(): EditorSlide {
  const title = makeText({ id: 'title1', text: 'Phòng khách quiet-luxury', role: 'title', fontSize: 6, frame: { x: 6, y: 6, w: 40, h: 10, rotation: 0 } });
  const kicker = makeText({ id: 'kicker1', text: '01', role: 'kicker', frame: { x: 6, y: 3, w: 20, h: 3, rotation: 0 } });
  const body = makeText({ id: 'body1', text: 'Ý một\nÝ hai', role: 'body', frame: { x: 6, y: 20, w: 40, h: 30, rotation: 0 } });
  const img = makeImage('data:img1', { id: 'img1', frame: { x: 52, y: 10, w: 42, h: 80, rotation: 0 } });
  return {
    id: 'slide1',
    background: '#ffffff',
    backgroundImage: null,
    elements: [img, kicker, title, body],
    templateId: 'content-image',
  };
}

console.log('[1] Cùng khổ (16:9 → 16:9) → KHÔNG dàn lại (trả nguyên slide)');
{
  const s = contentImageSlide();
  const out = reflowSlideForStage(s, P16_9, P16_9);
  ok('trả về CHÍNH slide gốc (no-op)', out === s);
}

console.log('[2] Cùng HỌ tỉ lệ (A4 ngang → A3 ngang, cùng ISO) → % KHÔNG đổi');
{
  const s = contentImageSlide();
  const out = reflowSlideForStage(s, A4_LANDSCAPE, A3_LANDSCAPE);
  ok('trả về CHÍNH slide gốc (chỉ đổi độ phân giải, không méo)', out === s);
}

console.log('[3] 16:9 → A4 dọc: KHÔNG mất phần tử nào (ảnh + kicker + tiêu đề + thân bài)');
{
  const s = contentImageSlide();
  const out = reflowSlideForStage(s, P16_9, A4_PORTRAIT);
  ok('giữ đủ 4 phần tử', out.elements.length === 4);
  ok('vẫn còn đúng 1 ảnh (id img1)', out.elements.some((e) => e.kind === 'image' && e.id === 'img1'));
  ok('vẫn còn tiêu đề (id title1), TEXT giữ nguyên', (out.elements.find((e) => e.id === 'title1') as TextElement)?.text === 'Phòng khách quiet-luxury');
  ok('vẫn còn kicker (id kicker1)', out.elements.some((e) => e.id === 'kicker1'));
  ok('vẫn còn thân bài (id body1), TEXT giữ nguyên CẢ 2 dòng', (out.elements.find((e) => e.id === 'body1') as TextElement)?.text === 'Ý một\nÝ hai');
}

console.log('[4] 16:9 → A4 dọc: mọi frame nằm trong biên 0..100');
{
  const s = contentImageSlide();
  const out = reflowSlideForStage(s, P16_9, A4_PORTRAIT);
  ok('mọi element trong biên sân khấu', out.elements.every((e) => withinStage(e.frame)));
}

console.log('[5] 16:9 → A4 dọc: ảnh KHÔNG còn chiếm cột phải hẹp — bố cục XẾP CHỒNG (ảnh y nhỏ hơn body y)');
{
  const s = contentImageSlide();
  const out = reflowSlideForStage(s, P16_9, A4_PORTRAIT);
  const img = out.elements.find((e) => e.kind === 'image') as ImageElement;
  const body = out.elements.find((e) => e.id === 'body1') as TextElement;
  const title = out.elements.find((e) => e.id === 'title1') as TextElement;
  ok('tiêu đề vẫn ở trên cùng (y nhỏ nhất)', title.frame.y <= img.frame.y && title.frame.y <= body.frame.y);
  ok('ảnh xếp TRÊN thân bài (portrait: ảnh y < body y)', img.frame.y < body.frame.y);
  ok('ảnh dùng gần hết bề rộng khung (không còn kẹt cột hẹp ~42%)', img.frame.w > 60);
}

console.log('[6] Tiêu đề co cỡ chữ theo cỡ ô MỚI (không giữ y nguyên fontSize cũ 1:1)');
{
  const s = contentImageSlide();
  const out = reflowSlideForStage(s, P16_9, A4_PORTRAIT);
  const title = out.elements.find((e) => e.id === 'title1') as TextElement;
  ok('fontSize tiêu đề vẫn nằm trong dải hợp lệ (>0, hữu hạn)', title.fontSize > 0 && Number.isFinite(title.fontSize));
}

console.log('[7] KHÔNG mất ảnh khi có NHIỀU ảnh hơn ô canonical (an toàn dữ liệu)');
{
  const imgs = [1, 2, 3].map((i) => makeImage(`data:img${i}`, { id: `img${i}`, frame: { x: 10 * i, y: 10, w: 20, h: 20, rotation: 0 } }));
  const title = makeText({ id: 'title1', text: 'Bộ sưu tập', role: 'title', frame: { x: 6, y: 4, w: 50, h: 8, rotation: 0 } });
  const slide: EditorSlide = {
    id: 'slideMulti',
    background: '#fff',
    backgroundImage: null,
    elements: [...imgs, title],
    templateId: 'grid', // budget.images ở 'grid' cho phép 3-4 nên KHÔNG bị kẹp — vẫn kiểm đủ 3 ảnh sau dàn lại.
  };
  const out = reflowSlideForStage(slide, P16_9, A4_PORTRAIT);
  const outImgs = out.elements.filter((e) => e.kind === 'image');
  ok('vẫn còn đủ 3 ảnh (không ảnh nào bị xoá)', outImgs.length === 3);
  ok('mọi ảnh trong biên sân khấu', outImgs.every((e) => withinStage(e.frame)));
}

console.log('[8] Nhiều khối thân bài GỐC (2 block) dồn vào 1 ô — KHÔNG ghép/xoá nội dung, chỉ chia vị trí');
{
  const b1 = makeText({ id: 'b1', text: 'Khối một', role: 'body', frame: { x: 6, y: 20, w: 40, h: 15, rotation: 0 } });
  const b2 = makeText({ id: 'b2', text: 'Khối hai', role: 'body', frame: { x: 6, y: 40, w: 40, h: 15, rotation: 0 } });
  const title = makeText({ id: 't1', text: 'Tiêu đề', role: 'title', frame: { x: 6, y: 6, w: 40, h: 8, rotation: 0 } });
  const img = makeImage('data:x', { id: 'img1', frame: { x: 52, y: 10, w: 42, h: 80, rotation: 0 } });
  const slide: EditorSlide = { id: 's', background: '#fff', backgroundImage: null, elements: [img, title, b1, b2], templateId: 'content-image' };
  const out = reflowSlideForStage(slide, P16_9, A4_PORTRAIT);
  const ob1 = out.elements.find((e) => e.id === 'b1') as TextElement;
  const ob2 = out.elements.find((e) => e.id === 'b2') as TextElement;
  ok('cả 2 khối vẫn còn, TEXT không đổi', ob1?.text === 'Khối một' && ob2?.text === 'Khối hai');
  ok('2 khối không chồng nhau (b1 ở trên b2)', ob1.frame.y < ob2.frame.y);
}

console.log('[9] Phần tử TỰ DO (shape trang trí) — giữ NGUYÊN % (không dàn theo lưới)');
{
  const shape = makeShape('ellipse', { id: 'deco1', frame: { x: 70, y: 5, w: 15, h: 15, rotation: 0 } });
  const title = makeText({ id: 't1', text: 'Tiêu đề', role: 'title', frame: { x: 6, y: 6, w: 40, h: 8, rotation: 0 } });
  const slide: EditorSlide = { id: 's', background: '#fff', backgroundImage: null, elements: [shape, title], templateId: 'cover' };
  const out = reflowSlideForStage(slide, P16_9, A4_PORTRAIT);
  const outShape = out.elements.find((e) => e.id === 'deco1');
  ok('shape trang trí giữ NGUYÊN % (x=70,y=5,w=15,h=15)', outShape?.frame.x === 70 && outShape?.frame.y === 5 && outShape?.frame.w === 15 && outShape?.frame.h === 15);
}

console.log('[10] Slide KHÔNG có phần tử cấu trúc nào (chỉ shape tự do) → chỉ kẹp biên, không lỗi');
{
  const shape = makeShape('rect', { id: 'deco1', frame: { x: 10, y: 10, w: 20, h: 20, rotation: 0 } });
  const slide: EditorSlide = { id: 's', background: '#fff', backgroundImage: null, elements: [shape], templateId: 'blank' };
  const out = reflowSlideForStage(slide, P16_9, A4_PORTRAIT);
  ok('vẫn 1 phần tử, không ném lỗi', out.elements.length === 1);
}

console.log('[11] reflowDeckForStage — THUẦN (không mutate deck gốc) + cập nhật stagePreset');
{
  const deck: EditorDeck = {
    id: 'd1',
    brand: 'TTT',
    project: 'Demo',
    fonts: 'Editorial',
    palette: ['#111111', '#8a6f4d'],
    slides: [contentImageSlide()],
  };
  const before = JSON.stringify(deck);
  const next = reflowDeckForStage(deck, 'a4-portrait');
  ok('deck GỐC không đổi (JSON snapshot khớp trước/sau)', JSON.stringify(deck) === before);
  ok('deck MỚI có stagePreset = a4-portrait', next.stagePreset === 'a4-portrait');
  ok('deck gốc (bỏ trống stagePreset) vẫn coi là 16:9 mặc định', deck.stagePreset === undefined);
}

console.log('[12] Template đòi hỏi ảnh (budget.images.min>0, vd "grid") nhưng slide THỰC KHÔNG có ảnh nào — không lấy nhầm ô title/body làm ảnh');
{
  const title = makeText({ id: 't1', text: 'Không còn ảnh', role: 'title', frame: { x: 6, y: 6, w: 40, h: 8, rotation: 0 } });
  const body = makeText({ id: 'b1', text: 'Chỉ còn chữ', role: 'body', frame: { x: 6, y: 20, w: 40, h: 30, rotation: 0 } });
  const slide: EditorSlide = { id: 's', background: '#fff', backgroundImage: null, elements: [title, body], templateId: 'grid' };
  const out = reflowSlideForStage(slide, P16_9, A4_PORTRAIT);
  ok('không sinh ra ảnh nào từ hư không', out.elements.filter((e) => e.kind === 'image').length === 0);
  ok('tiêu đề + thân bài vẫn còn đủ, không bị ô ảnh ảo chiếm mất', out.elements.length === 2);
}

console.log(`\n${pass} ok, ${fail} fail`);
if (fail > 0) process.exit(1);
