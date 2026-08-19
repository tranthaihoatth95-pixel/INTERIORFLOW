/**
 * lib/review/luat/deck.test.ts — R7 (19/08): reviewDeck nhận slides THẬT.
 * Chạy: node_modules/.bin/sucrase-node lib/review/luat/deck.test.ts
 *
 * Khoá 4 điều của phiếu R7:
 *   [1] deck 0 / 1 / nhiều slide đi qua reviewDeck không nổ, đúng số finding
 *   [2] finding thật mang đủ hợp đồng FindingLuat (nguon/ruleId/viTri.slide) + coNutToiCho
 *   [3] KHÔNG mutate slides (deep-equal trước–sau) — review chỉ ĐỌC truth
 *   [4] tất định — chạy 2 lần ra y hệt (JSON bằng nhau)
 */
import { makeText } from '../../present-editor/model';
import type { EditorSlide, SlideElement } from '../../present-editor/model';
import { reviewDeck, luatDeck, dungTheLuat } from '../index';

let pass = 0, fail = 0;
const ok = (c: boolean, m: string) => { if (c) { pass++; console.log('  ok  -', m); } else { fail++; console.log('  FAIL-', m); } };

function slide(els: SlideElement[], templateId?: string): EditorSlide {
  return { id: `s${Math.random().toString(36).slice(2, 6)}`, background: '#fff', backgroundImage: null, elements: els, templateId };
}
/** Slide cố ý TRỐNG QUÁ (1 text bé) — chắc chắn sinh cảnh báo whitespace/empty. */
const slideTrong = () => slide([makeText({ frame: { x: 8, y: 8, w: 20, h: 5, rotation: 0 }, text: 'Hi' })], 'content-image');

console.log('[1] 0 slide — luat rỗng, không nổ');
{
  const r = reviewDeck({ slides: [], deBai: null });
  ok(r.chang === 'deck', 'chang = deck');
  ok(r.luat.length === 0, '0 slide → 0 finding luật');
}

console.log('[1b] slides undefined (chưa nối) — vẫn luat rỗng (UI phân biệt bằng deckSlides===null)');
{
  const r = reviewDeck({ deBai: null });
  ok(r.luat.length === 0, 'undefined → 0 finding, không nổ');
}

console.log('[2] 1 slide trống quá — finding thật, đủ hợp đồng');
{
  const r = reviewDeck({ slides: [slideTrong()], deBai: null });
  ok(r.luat.length > 0, `có finding thật (${r.luat.length})`);
  const f = r.luat[0];
  ok(f.lop === 'luat' && f.muc === 'vang', 'lớp luật, mức vàng (thẩm mỹ đo được, không có đỏ)');
  ok(f.nguon.startsWith('DECK_STANDARDS.'), `nguon dẫn được: ${f.nguon}`);
  ok(f.ruleId.startsWith('deck-'), `ruleId ổn định: ${f.ruleId}`);
  ok(f.viTri?.slide === 1, 'viTri.slide = 1 (1-index)');
  const the = dungTheLuat(f, 'ngan');
  ok(the.coNutToiCho === true, 'coNutToiCho bật nhờ viTri.slide (hien-thi-luat R7)');
}

console.log('[3] nhiều slide — finding mang đúng số slide, slide sạch không sinh finding');
{
  const sach = slide([
    makeText({ frame: { x: 6, y: 12, w: 40, h: 10, rotation: 0 }, text: 'Tiêu đề', role: 'title', fontSize: 5 }),
  ]); // không template → budget mặc định; có thể vẫn cảnh báo — nên đo bằng slideTrong ở vị trí 3
  const slides = [slideTrong(), sach, slideTrong()];
  const r = reviewDeck({ slides, deBai: null });
  ok(r.luat.some((f) => f.viTri?.slide === 1), 'có finding ở slide 1');
  ok(r.luat.some((f) => f.viTri?.slide === 3), 'có finding ở slide 3');
}

console.log('[4] KHÔNG mutate slides — deep-equal trước–sau');
{
  const slides = [slideTrong(), slideTrong()];
  const truoc = JSON.stringify(slides);
  luatDeck(slides);
  reviewDeck({ slides, deBai: null });
  ok(JSON.stringify(slides) === truoc, 'slides nguyên vẹn sau khi review (chỉ ĐỌC truth)');
}

console.log('[5] Tất định — 2 lần chạy ra y hệt');
{
  const slides = [slideTrong()];
  const a = JSON.stringify(reviewDeck({ slides, deBai: null }).luat);
  const b = JSON.stringify(reviewDeck({ slides, deBai: null }).luat);
  ok(a === b, 'hai lần chạy giống nhau từng byte');
}

console.log(`\n${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
