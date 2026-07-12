/**
 * lib/present-editor/handoff.test.ts — kiểm bridge Render→Present (A-4). Chạy:
 *   node_modules/.bin/sucrase-node lib/present-editor/handoff.test.ts
 *
 * Môi trường node KHÔNG có sessionStorage → chính là kịch bản "storage hỏng/offline":
 * stash phải rơi xuống fallback bộ nhớ và consume vẫn nhận đủ (consume-once).
 */
import { deckImagesFromNodes, stashPresentHandoff, consumePresentHandoff, type HandoffNodeLike } from './handoff';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

function composer(url: string, pageNo: string, x: number, y = 0): HandoffNodeLike {
  return { position: { x, y }, data: { defType: 'slide.composer', params: { pageNo }, run: { outputs: { image: { value: url } } } } };
}

function testDeckPriority() {
  console.log('\n[1] slide.deck đã Run được ƯU TIÊN (đúng thứ tự PresentOverlay)');
  const nodes: HandoffNodeLike[] = [
    composer('c1', '1', 0),
    { data: { defType: 'slide.deck', params: { deckName: 'D' }, run: { outputs: { _slides: { value: JSON.stringify(['s1', 's2', 's3']) } } } } },
  ];
  ok('lấy từ _slides của Export Deck', JSON.stringify(deckImagesFromNodes(nodes)) === JSON.stringify(['s1', 's2', 's3']));
  ok('_slides JSON hỏng → rơi xuống composer', JSON.stringify(deckImagesFromNodes([
    composer('c1', '1', 0),
    { data: { defType: 'slide.deck', run: { outputs: { _slides: { value: '{oops' } } } } },
  ])) === JSON.stringify(['c1']));
}

function testComposerOrder() {
  console.log('\n[2] Fallback composer — sắp theo pageNo rồi vị trí (tất định)');
  const nodes = [composer('b', '2', 0), composer('a', '1', 500), composer('d', '', 900), composer('c', '', 100)];
  ok('pageNo trước, thiếu pageNo xếp sau theo x', JSON.stringify(deckImagesFromNodes(nodes)) === JSON.stringify(['a', 'b', 'c', 'd']));
  ok('flow không slide → []', deckImagesFromNodes([{ data: { defType: 'input.image' } }]).length === 0);
  ok('composer chưa Run → bỏ qua', deckImagesFromNodes([{ data: { defType: 'slide.composer', run: { outputs: {} } } }]).length === 0);
}

function testCapEight() {
  console.log('\n[3] Trần 8 ảnh — không nhét cả thư viện vào storage');
  const many = Array.from({ length: 12 }, (_, i) => composer(`u${i}`, String(i + 1), 0));
  ok('kẹp về 8', deckImagesFromNodes(many).length === 8);
}

function testStashConsumeMemoryFallback() {
  console.log('\n[4] Storage hỏng (node không có sessionStorage) → fallback bộ nhớ + consume-once');
  const okStorage = stashPresentHandoff(['img1', 'img2']);
  ok('stash báo KHÔNG vào được sessionStorage (dùng mem)', okStorage === false);
  const got = consumePresentHandoff();
  ok('consume nhận đủ ảnh từ mem', JSON.stringify(got) === JSON.stringify(['img1', 'img2']));
  ok('consume lần 2 → rỗng (consume-once, không double-import)', consumePresentHandoff().length === 0);
}

function testEmptyStashNoop() {
  console.log('\n[5] Không có gì để chuyển → stash noop, consume rỗng (luồng cũ nguyên vẹn)');
  stashPresentHandoff([]);
  ok('consume rỗng', consumePresentHandoff().length === 0);
  stashPresentHandoff(['', '']);
  ok('toàn chuỗi rỗng cũng noop', consumePresentHandoff().length === 0);
}

testDeckPriority();
testComposerOrder();
testCapEight();
testStashConsumeMemoryFallback();
testEmptyStashNoop();

console.log(`\n${pass} ok, ${fail} fail`);
if (fail > 0) process.exit(1);
