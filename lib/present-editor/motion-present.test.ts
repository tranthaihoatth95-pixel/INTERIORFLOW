/**
 * lib/present-editor/motion-present.test.ts — kiểm Animation Pane THEO OBJECT
 * (`computeElementRevealTimings`). Chạy:
 *   node_modules/.bin/sucrase-node lib/present-editor/motion-present.test.ts
 *
 * Trọng tâm:
 *  - REGRESSION bắt buộc: slide/deck KHÔNG có field mới (elementReveal/revealOrder/revealDelay)
 *    → mọi phần tử ra CÙNG kiểu + độ trễ tăng dần đúng công thức stagger CŨ (trước đây do
 *    framer-motion staggerChildren đảm nhiệm) — bằng chứng KHÔNG phá vỡ deck cũ.
 *  - elementReveal ghi đè RIÊNG 1 phần tử, không ảnh hưởng phần tử khác.
 *  - revealOrder sắp lại HẠNG (rank) — độ trễ tính theo hạng sau khi sắp, không theo giá trị thô.
 *  - revealDelay ghi đè tuyệt đối, bỏ qua tự suy.
 *  - Thứ tự mảng trả về = thứ tự mảng elements GỐC (không phải thứ tự rank).
 */
import { makeText, makeImage, makeShape, type EditorSlide } from './model';
import { computeElementRevealTimings } from './motion-present';

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

/** Slide 3 phần tử mẫu — id ổn định để test dễ đọc. */
function sampleSlide(overrides?: Partial<EditorSlide>): EditorSlide {
  const a = makeText({ id: 'a', text: 'Tiêu đề' });
  const b = makeImage('img.jpg', { id: 'b' });
  const c = makeShape('rect', { id: 'c' });
  return {
    id: 'slide1',
    background: '#fff',
    elements: [a, b, c],
    ...overrides,
  };
}

console.log('[1] REGRESSION — deck cũ KHÔNG có field mới, slide.reveal set');
{
  const slide = sampleSlide({ reveal: 'rise' });
  const timings = computeElementRevealTimings(slide);
  ok('trả đủ 3 phần tử', timings.length === 3);
  ok('thứ tự mảng GỐC (a,b,c)', timings.map((t) => t.id).join(',') === 'a,b,c');
  ok('mọi phần tử CÙNG kiểu = slide.reveal', timings.every((t) => t.reveal === 'rise'));
  // BASE_DELAY_SEC=0.08, step 'rise'=0.06 → 0.08, 0.14, 0.20
  ok('a: delay = 0.08 (BASE, hạng 0)', Math.abs(timings[0].delaySec - 0.08) < 1e-9);
  ok('b: delay = 0.14 (hạng 1)', Math.abs(timings[1].delaySec - 0.14) < 1e-9);
  ok('c: delay = 0.20 (hạng 2)', Math.abs(timings[2].delaySec - 0.2) < 1e-9);
}

console.log('[2] REGRESSION — slide.reveal KHÔNG set → fallback deckReveal');
{
  const slide = sampleSlide();
  const timings = computeElementRevealTimings(slide, 'fade');
  ok('mọi phần tử = deckReveal (fade)', timings.every((t) => t.reveal === 'fade'));
  // step 'fade' = 0.02
  ok('bước stagger fade = 0.02', Math.abs(timings[1].delaySec - timings[0].delaySec - 0.02) < 1e-9);
}

console.log('[3] REGRESSION — không reveal nào set (slide/deck) → "none" cho tất cả');
{
  const slide = sampleSlide();
  const timings = computeElementRevealTimings(slide);
  ok('mọi phần tử = none', timings.every((t) => t.reveal === 'none'));
}

console.log('[4] elementReveal ghi đè RIÊNG 1 phần tử, không ảnh hưởng phần tử khác');
{
  const slide = sampleSlide({ reveal: 'fade' });
  slide.elements[1].elementReveal = 'zoom'; // phần tử "b"
  const timings = computeElementRevealTimings(slide);
  const byId = new Map(timings.map((t) => [t.id, t]));
  ok('a vẫn theo slide (fade)', byId.get('a')!.reveal === 'fade');
  ok('b ghi đè riêng (zoom)', byId.get('b')!.reveal === 'zoom');
  ok('c vẫn theo slide (fade)', byId.get('c')!.reveal === 'fade');
}

console.log('[5] revealOrder sắp lại HẠNG — độ trễ tính theo hạng sau khi sắp, không theo giá trị thô');
{
  const slide = sampleSlide({ reveal: 'rise' });
  // đảo thứ tự: c(order=0) → a(order=1) → b(order=2), dù mảng gốc là a,b,c
  slide.elements[0].revealOrder = 1; // a
  slide.elements[1].revealOrder = 2; // b
  slide.elements[2].revealOrder = 0; // c
  const timings = computeElementRevealTimings(slide);
  ok('thứ tự mảng TRẢ VỀ vẫn = thứ tự mảng gốc (a,b,c)', timings.map((t) => t.id).join(',') === 'a,b,c');
  const byId = new Map(timings.map((t) => [t.id, t]));
  ok('c ra TRƯỚC nhất (hạng 0) → delay nhỏ nhất', byId.get('c')!.delaySec < byId.get('a')!.delaySec);
  ok('a ra SAU c, TRƯỚC b', byId.get('a')!.delaySec < byId.get('b')!.delaySec);
  ok('c: delay = BASE (hạng 0) = 0.08', Math.abs(byId.get('c')!.delaySec - 0.08) < 1e-9);
  ok('a: delay = BASE + 1×0.06 = 0.14 (hạng 1)', Math.abs(byId.get('a')!.delaySec - 0.14) < 1e-9);
  ok('b: delay = BASE + 2×0.06 = 0.20 (hạng 2)', Math.abs(byId.get('b')!.delaySec - 0.2) < 1e-9);
}

console.log('[6] revealDelay ghi đè TUYỆT ĐỐI, bỏ qua tự suy stagger');
{
  const slide = sampleSlide({ reveal: 'rise' });
  slide.elements[1].revealDelay = 3.5; // b
  const timings = computeElementRevealTimings(slide);
  const byId = new Map(timings.map((t) => [t.id, t]));
  ok('b dùng đúng revealDelay = 3.5s', byId.get('b')!.delaySec === 3.5);
  ok('a KHÔNG bị ảnh hưởng (vẫn tự suy)', Math.abs(byId.get('a')!.delaySec - 0.08) < 1e-9);
}

console.log('[7] revealDelay âm bị kẹp về 0 (an toàn, không lùi trước lúc slide hiện ra)');
{
  const slide = sampleSlide({ reveal: 'fade' });
  slide.elements[0].revealDelay = -2;
  const timings = computeElementRevealTimings(slide);
  ok('delay kẹp về 0', timings[0].delaySec === 0);
}

console.log('[8] revealOrder TRÙNG số → giữ thứ tự mảng gốc (sắp ổn định)');
{
  const slide = sampleSlide({ reveal: 'rise' });
  slide.elements[0].revealOrder = 5; // a
  slide.elements[1].revealOrder = 5; // b (trùng a)
  slide.elements[2].revealOrder = 5; // c (trùng a, b)
  const timings = computeElementRevealTimings(slide);
  const byId = new Map(timings.map((t) => [t.id, t]));
  ok('trùng order → a vẫn hạng 0 (mảng gốc)', byId.get('a')!.delaySec < byId.get('b')!.delaySec);
  ok('trùng order → b hạng 1, c hạng 2', byId.get('b')!.delaySec < byId.get('c')!.delaySec);
}

console.log('[9] slide rỗng (chưa có phần tử) → mảng rỗng, không lỗi');
{
  const slide = sampleSlide({ elements: [] });
  const timings = computeElementRevealTimings(slide);
  ok('mảng rỗng', timings.length === 0);
}

console.log(`\n${pass} ok, ${fail} fail`);
if (fail > 0) process.exit(1);
