/**
 * lib/present-editor/edgecase-stress.test.ts — STRESS TEST biên cho "Present" (dàn trang).
 * Viết lại thay bản đã mất 15/07 (xem CHANGELOG.md "15/07 — 4 nhánh merge trước Sprint 3").
 * Chạy: node_modules/.bin/sucrase-node lib/present-editor/edgecase-stress.test.ts
 *
 * KHÔNG trùng lặp với reflow.test.ts (đã khoá: no-op cùng khổ/họ tỉ lệ, không mất phần tử khi
 * đổi khổ, avoidImageOverlap chống ảnh đè chữ tự do — Fix Phase 2c). File này nhắm CÁC INPUT
 * BIÊN CHƯA TEST: deck 0 slide, slide 0 element, element TRÙNG ID, deck 1000 phần tử (perf/an
 * toàn dữ liệu), và text/unicode cực trị đi qua textFrameHeight/titleSize/decorateListText —
 * đúng những hàm mà export PDF/PPTX tái dùng (xem model.ts dòng 4-6: "export chỉ là phép ánh
 * xạ thuần" từ model này).
 *
 * GIỚI HẠN KỸ THUẬT: `lib/present-editor/export.ts` import `'@/lib/pptx'` (alias, không
 * resolve được qua sucrase-node — cùng giới hạn đã ghi ở edgecase-stress.test.ts của
 * lib/nodes/). Vì vậy "export với ký tự đặc biệt/unicode dài" được test ở TẦNG MODEL/REGION-
 * LAYOUT thuần mà export.ts/render.ts tái dùng (titleSize, textFrameHeight, decorateListText,
 * cloneDeck) — đây chính là nơi mọi lỗi tràn/NaN/mất-ký-tự sẽ lộ ra TRƯỚC khi tới bước export.
 */
import {
  makeText, makeImage, cloneDeck, decorateListText,
  type EditorDeck, type EditorSlide, type TextElement, type ImageElement,
} from './model';
import { reflowSlideForStage, reflowDeckForStage } from './reflow';
import { STAGE_PRESETS } from './stage-presets';
import { titleSize, textFrameHeight, fitImageFrame } from './region-layout';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

const P16_9 = STAGE_PRESETS['16:9'];
const A4_PORTRAIT = STAGE_PRESETS['a4-portrait'];

/* ══════════════════ [1] Deck 0 slide ══════════════════ */
console.log('[1] reflowDeckForStage — deck KHÔNG có slide nào');
{
  const deck0: EditorDeck = { id: 'd0', brand: 'TTT', project: 'Trống', fonts: 'Editorial', palette: [], slides: [] };
  const out0 = reflowDeckForStage(deck0, 'a4-portrait');
  ok('deck 0 slide → không throw, slides vẫn rỗng', out0.slides.length === 0);
  ok('deck 0 slide → vẫn cập nhật stagePreset đúng', out0.stagePreset === 'a4-portrait');
  ok('deck GỐC (0 slide) không bị mutate', deck0.slides.length === 0 && deck0.stagePreset === undefined);
}

/* ══════════════════ [2] Slide 0 element ══════════════════ */
console.log('\n[2] reflowSlideForStage — slide KHÔNG có phần tử nào');
{
  const emptySlide: EditorSlide = { id: 's0', background: '#fff', backgroundImage: null, elements: [], templateId: 'blank' };
  const out = reflowSlideForStage(emptySlide, P16_9, A4_PORTRAIT);
  ok('slide 0 element → không throw, elements vẫn rỗng', out.elements.length === 0);
  ok('slide 0 element → giữ nguyên background/templateId', out.background === '#fff' && out.templateId === 'blank');
}

/* ══════════════════ [3] Element TRÙNG ID trong 1 slide ══════════════════ */
console.log('\n[3] reflowSlideForStage — 2 element (title + body) TRÙNG id (dữ liệu lỗi/import cũ)');
{
  // P-note: đây là hành vi THẬT đã chạy xác nhận, không phải điều mong muốn — byId là 1 Map
  // keyed theo id (reflow.ts dòng 242-246); khi 2 phần tử cấu trúc trùng id, phần tử set SAU
  // (body, vì thứ tự set là title→kicker→body→image) THẮNG và ĐÈ LÊN CẢ 2 vị trí trong mảng
  // kết quả — tiêu đề "biến mất" (bị thay bằng nội dung body) dù không có phần tử nào bị xoá
  // khỏi mảng (length vẫn đúng). Test khoá đúng hành vi thật để không ai "sửa nhầm" thành khác
  // mà không nhận ra đây từng là hành vi đã biết.
  const dupId = 'DUP-ID';
  const dupTitle = makeText({ id: dupId, text: 'Tiêu đề gốc', role: 'title', frame: { x: 6, y: 6, w: 40, h: 10, rotation: 0 } });
  const dupBody = makeText({ id: dupId, text: 'Thân bài gốc', role: 'body', frame: { x: 6, y: 20, w: 40, h: 30, rotation: 0 } });
  const slide: EditorSlide = { id: 's-dup', background: '#fff', backgroundImage: null, elements: [dupTitle, dupBody], templateId: 'content-image' };
  const out = reflowSlideForStage(slide, P16_9, A4_PORTRAIT);
  ok('không throw, KHÔNG mất phần tử nào khỏi mảng (vẫn đủ 2)', out.elements.length === 2);
  ok('2 vị trí trong mảng trỏ CÙNG 1 object (id trùng → byId.get trả cùng 1 bản ghi)', out.elements[0] === out.elements[1]);
  ok('nội dung thắng là BODY (set sau trong byId), tiêu đề gốc bị đè mất — hành vi thật, không phải mong muốn', (out.elements[0] as TextElement).text === 'Thân bài gốc' && (out.elements[0] as TextElement).role === 'body');
}

/* ══════════════════ [4] Deck/slide 1000 phần tử — perf + an toàn dữ liệu ══════════════════ */
console.log('\n[4] reflowSlideForStage — 1000 phần tử (500 body + 499 image + title + kicker), không throw, không mất phần tử, đủ nhanh');
{
  const elements: (TextElement | ImageElement)[] = [];
  elements.push(makeText({ id: 'title1', text: 'Deck cực lớn', role: 'title', frame: { x: 6, y: 6, w: 40, h: 10, rotation: 0 } }));
  elements.push(makeText({ id: 'kicker1', text: '01', role: 'kicker', frame: { x: 6, y: 3, w: 20, h: 3, rotation: 0 } }));
  for (let i = 0; i < 499; i++) elements.push(makeText({ id: `body${i}`, text: `Ý số ${i}`, role: 'body', frame: { x: 6, y: 20, w: 40, h: 1, rotation: 0 } }));
  for (let i = 0; i < 499; i++) elements.push(makeImage(`data:img${i}`, { id: `img${i}`, frame: { x: 50, y: i % 100, w: 10, h: 1, rotation: 0 } }));
  ok('chuẩn bị đúng 1000 phần tử đầu vào', elements.length === 1000);

  const bigSlide: EditorSlide = { id: 'big', background: '#fff', backgroundImage: null, elements, templateId: 'grid' };
  const t0 = Date.now();
  const out = reflowSlideForStage(bigSlide, P16_9, A4_PORTRAIT);
  const ms = Date.now() - t0;
  ok('1000 phần tử → KHÔNG mất phần tử nào (đủ 1000 ở output, an toàn dữ liệu)', out.elements.length === 1000);
  ok('1000 phần tử → chạy xong dưới 2 giây (không phải perf bug bậc nhiều-giây)', ms < 2000);
  ok('mọi phần tử sau reflow đều có frame hữu hạn (không NaN/Infinity ở khối lượng lớn)', out.elements.every((e) => Number.isFinite(e.frame.x) && Number.isFinite(e.frame.y) && Number.isFinite(e.frame.w) && Number.isFinite(e.frame.h)));

  // đổi khổ NGƯỢC LẠI (portrait → 16:9) lần nữa trên chính output — vẫn ổn định, không phình/nổ.
  const out2 = reflowSlideForStage(out, A4_PORTRAIT, P16_9);
  ok('reflow 2 lần liên tiếp (đi rồi về khổ khác) vẫn giữ đủ 1000 phần tử', out2.elements.length === 1000);
}

/* ══════════════════ [5] Deck rỗng KẾT HỢP slide 1000 phần tử (reflowDeckForStage cấp deck) ══════════════════ */
console.log('\n[5] reflowDeckForStage — 1 deck gồm slide RỖNG + slide 1000 phần tử cùng lúc');
{
  const heavy: (TextElement | ImageElement)[] = [];
  for (let i = 0; i < 300; i++) heavy.push(makeText({ id: `h${i}`, text: `dòng ${i}`, role: 'body', frame: { x: 6, y: 20, w: 40, h: 1, rotation: 0 } }));
  const deck: EditorDeck = {
    id: 'd-mix', brand: 'TTT', project: 'Mix', fonts: 'Editorial', palette: ['#111'],
    slides: [
      { id: 's-empty', background: '#fff', backgroundImage: null, elements: [], templateId: 'blank' },
      { id: 's-heavy', background: '#fff', backgroundImage: null, elements: heavy, templateId: 'grid' },
    ],
  };
  const out = reflowDeckForStage(deck, 'a4-portrait');
  ok('deck 2 slide (1 rỗng + 1 nặng) → không throw, đủ 2 slide ở output', out.slides.length === 2);
  ok('slide rỗng vẫn rỗng sau reflow deck', out.slides[0].elements.length === 0);
  ok('slide nặng vẫn đủ 300 phần tử sau reflow deck', out.slides[1].elements.length === 300);
}

/* ══════════════════ [6] Unicode/ký tự đặc biệt cực trị — nền tảng cho export PDF/PPTX ══════════════════ */
console.log('\n[6] titleSize/textFrameHeight — tiêu đề dài + emoji (surrogate pairs UTF-16)');
{
  const emojiTitle = '🏠🛋️🪑 '.repeat(50) + 'Phòng khách sang trọng';
  ok('chuỗi emoji lặp có .length lớn (UTF-16 code unit, không phải số ký tự hiển thị)', emojiTitle.length > 300);
  const fsEmoji = titleSize(false, emojiTitle);
  ok('titleSize với tiêu đề emoji cực dài → hữu hạn, kẹp về MIN dải chuẩn (4.5), không NaN', Number.isFinite(fsEmoji) && fsEmoji === 4.5);
  ok('titleSize text rỗng → coi như 1 từ, giữ cỡ ideal (7.25 = trung điểm dải 4.5-10)', titleSize(false, '') === 7.25);
  ok('titleSize text undefined (không truyền) → giống rỗng, ideal 7.25', titleSize(false, undefined) === 7.25);
  ok('titleSize 100 từ tiếng Việt có dấu → kẹp về MIN, không throw dù nhiều ký tự đa byte', titleSize(false, Array(100).fill('từ').join(' ')) === 4.5);

  const cell = { x: 0, y: 0, w: 50, h: 10 };
  const h = textFrameHeight(emojiTitle, cell, 5, 1.2);
  ok('textFrameHeight với text emoji cực dài → hữu hạn và bị KẸP đúng bằng chiều cao ô (cell.h=10, tràn quá nên chạm trần)', Number.isFinite(h) && h === cell.h);
}

console.log('\n[7] decorateListText — bullet/số thứ tự trên nội dung có dấu tiếng Việt + emoji, nhiều dòng');
{
  const listText = 'Sofa vải lanh 🛋️\nBàn gỗ sồi\nĐèn treo 💡';
  const bulleted = decorateListText(listText, 'bullet');
  ok('bullet: đủ 3 dòng, mỗi dòng có tiền tố "•  ", giữ NGUYÊN unicode/emoji không mất ký tự', bulleted.split('\n').length === 3 && bulleted.includes('•  Sofa vải lanh 🛋️') && bulleted.includes('•  Đèn treo 💡'));
  const numbered = decorateListText(listText, 'number');
  ok('number: đánh số 1./2./3. tăng dần, giữ nguyên nội dung unicode', numbered === '1.  Sofa vải lanh 🛋️\n2.  Bàn gỗ sồi\n3.  Đèn treo 💡');
  ok('style "none" → trả nguyên văn, không đổi gì', decorateListText(listText, 'none') === listText);
  ok('dòng RỖNG giữa nội dung (VD "\\n\\n") không được đánh số/bullet (giữ dòng trống)', decorateListText('A\n\nB', 'number') === '1.  A\n\n2.  B');
}

console.log('\n[8] cloneDeck — round-trip JSON với unicode dài/emoji/ký tự đặc biệt (nền tảng export)');
{
  const longUnicode = '🏢🌊🪑 '.repeat(200) + 'Dự án ĐẶC BIỆT — "trích dẫn" & <thẻ giả> \n dòng mới\ttab';
  const deck: EditorDeck = {
    id: 'd-uni', brand: 'TTT', project: 'Dự án ĐẶC BIỆT 🏢', fonts: 'Editorial', palette: ['#111'],
    slides: [{ id: 's', background: '#fff', backgroundImage: null, elements: [makeText({ id: 't', text: longUnicode })], templateId: 'blank' }],
  };
  const cloned = cloneDeck(deck);
  ok('round-trip JSON giữ NGUYÊN VẸN chuỗi unicode/emoji/ký tự đặc biệt dài (>1500 ký tự)', (cloned.slides[0].elements[0] as TextElement).text === longUnicode);
  ok('cloneDeck là bản sao SÂU (không cùng reference), an toàn khi export không mutate deck gốc', cloned !== deck && cloned.slides[0] !== deck.slides[0] && cloned.slides[0].elements[0] !== deck.slides[0].elements[0]);
}

console.log('\n[9] fitImageFrame — cell diện tích 0 (suy biến) và trần diện tích 0/âm');
{
  // P-note: cellAreaPct(cell 0×0) = 0, và 0 <= bất kỳ maxAreaPct dương nào → nhánh "không cần co"
  // được chọn NGAY (areaPct <= maxAreaPct), trả nguyên frame gốc — KHÔNG rơi vào phép chia
  // 0/0 dù trực giác tưởng sẽ NaN/Infinity. Test khoá đúng hành vi thật này.
  const zeroCell = { x: 5, y: 5, w: 0, h: 0 };
  const frame = fitImageFrame(zeroCell, 10);
  ok('cell diện tích 0 + trần dương → trả nguyên frame gốc (0×0), KHÔNG NaN/Infinity', frame.w === 0 && frame.h === 0 && Number.isFinite(frame.x) && Number.isFinite(frame.y));

  const normalCell = { x: 1, y: 2, w: 10, h: 10 };
  ok('maxAreaPct = 0 → coi như "không có trần" (điều kiện !(0>0) đúng) → giữ nguyên frame', JSON.stringify(fitImageFrame(normalCell, 0)) === JSON.stringify({ x: 1, y: 2, w: 10, h: 10, rotation: 0 }));
  ok('maxAreaPct ÂM → cùng nhánh "không có trần" → giữ nguyên frame, không throw', JSON.stringify(fitImageFrame(normalCell, -5)) === JSON.stringify({ x: 1, y: 2, w: 10, h: 10, rotation: 0 }));
}

console.log(`\n${pass} ok, ${fail} fail`);
if (fail > 0) process.exit(1);
