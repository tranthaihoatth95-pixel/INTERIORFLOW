/**
 * lib/present-editor/content-deck.test.ts — chạy:
 *   `node_modules/.bin/sucrase-node lib/present-editor/content-deck.test.ts`
 *
 * Mục đích chính: KHOÁ luật trung tính — slide Cover dàn tự động từ text KHÔNG được chứa
 * tên studio/khách hardcode (bug 25/07: `kicker: 'DETECH · CONCEPT'` in lên mọi deck user
 * tự sinh). Kicker phải LẤY TỪ dữ liệu deck, không có thì rỗng.
 */

import assert from 'assert';
import { coverKickerFromDeck, slidesFromContent, parseBlocks } from './content-deck';

let n = 0;
function it(name: string, fn: () => void) {
  fn();
  n++;
  console.log(`  ✓ ${name}`);
}

console.log('content-deck · kicker trung tính');

const TEXT = '# Ý niệm chủ đạo\nMột dòng mở đầu.\n\n## Vật liệu\n- Đá ấm\n- Gỗ trầm\n';
const PAL = ['#EFE9DC', '#C9B79A', '#A98A5B', '#6E5A3E', '#3B4038', '#211E1A'];

/** Gom mọi chuỗi text trong 1 slide để soi nội dung. */
function textsOf(slide: { elements: unknown[] }): string[] {
  return (slide.elements as { text?: string }[])
    .filter((e) => typeof e.text === 'string')
    .map((e) => String(e.text));
}

it('coverKickerFromDeck: ưu tiên brand (Brand Kit), UPPERCASE', () => {
  assert.strictEqual(coverKickerFromDeck({ brand: 'Atelier Nord', project: 'Lumen Villa' }), 'ATELIER NORD');
});
it('coverKickerFromDeck: không brand → lấy phần đầu tên dự án', () => {
  assert.strictEqual(coverKickerFromDeck({ brand: '', project: 'Lumen Villa — Show Unit' }), 'LUMEN VILLA');
  assert.strictEqual(coverKickerFromDeck({ project: 'Nord Complex | Khối A' }), 'NORD COMPLEX');
});
it('coverKickerFromDeck: không dữ liệu → RỖNG (không bịa tên nào)', () => {
  assert.strictEqual(coverKickerFromDeck(undefined), '');
  assert.strictEqual(coverKickerFromDeck({}), '');
  assert.strictEqual(coverKickerFromDeck({ brand: '   ', project: '  ' }), '');
});
it('coverKickerFromDeck: cắt 48 ký tự, không làm vỡ layout kicker', () => {
  const long = 'x'.repeat(120);
  assert.strictEqual(coverKickerFromDeck({ brand: long }).length, 48);
});

it('slidesFromContent: KHÔNG hardcode tên khách nào trên Cover', () => {
  const slides = slidesFromContent(TEXT, [], PAL);
  assert.ok(slides.length >= 2, 'phải dàn được slide');
  const all = slides.flatMap(textsOf).join(' | ').toLowerCase();
  for (const banned of ['detech', 'ttt', 'amanoi', 'iki village']) {
    assert.ok(!all.includes(banned), `không được chứa "${banned}" — thấy: ${all}`);
  }
});
it('slidesFromContent: kicker rỗng khi không truyền (mặc định trung tính)', () => {
  const [cover] = slidesFromContent(TEXT, [], PAL);
  const kicker = (cover.elements as { role?: string; text?: string }[]).find((e) => e.role === 'kicker');
  assert.ok(!kicker || !String(kicker.text ?? '').trim(), 'kicker phải rỗng/không có');
});
it('slidesFromContent: kicker truyền vào thì hiện đúng nguyên văn', () => {
  const [cover] = slidesFromContent(TEXT, [], PAL, undefined, 'ATELIER NORD');
  assert.ok(textsOf(cover).some((t) => t === 'ATELIER NORD'), `thấy: ${textsOf(cover).join(' | ')}`);
});
it('slidesFromContent: text rỗng → [] (không dựng deck ma)', () => {
  assert.deepStrictEqual(slidesFromContent('', [], PAL), []);
  assert.deepStrictEqual(slidesFromContent('   \n\n', [], PAL), []);
});
it('slidesFromContent: thiếu ảnh → có ô giữ chỗ được nhìn thấy và sửa được', () => {
  const slides = slidesFromContent(TEXT, [], PAL);
  assert.ok(textsOf(slides[1]).some((t) => t.includes('VỊ TRÍ HÌNH ẢNH')));
});
it('slidesFromContent: có ảnh → dùng ảnh thật, không chồng ô giữ chỗ', () => {
  const slides = slidesFromContent(TEXT, ['data:image/png;base64,AA=='], PAL);
  assert.ok(!textsOf(slides[1]).some((t) => t.includes('VỊ TRÍ HÌNH ẢNH')));
});
it('parseBlocks vẫn tách theo heading cấp 1–2 (không hồi quy)', () => {
  const blocks = parseBlocks(TEXT);
  assert.strictEqual(blocks.length, 2);
  assert.strictEqual(blocks[0].title, 'Ý niệm chủ đạo');
  assert.strictEqual(blocks[1].title, 'Vật liệu');
});

console.log(`\n${n} test PASS — content-deck\n`);
