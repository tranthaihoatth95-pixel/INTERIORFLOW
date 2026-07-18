/**
 * lib/present-editor/handoff.test.ts — kiểm bridge Render→Present (A-4). Chạy:
 *   node_modules/.bin/sucrase-node lib/present-editor/handoff.test.ts
 *
 * Môi trường node KHÔNG có sessionStorage → chính là kịch bản "storage hỏng/offline":
 * stash phải rơi xuống fallback bộ nhớ và consume vẫn nhận đủ (consume-once).
 */
import {
  deckImagesFromNodes,
  deckImagesWithIdsFromNodes,
  renderImageId,
  stashPresentHandoff,
  stashPresentHandoffWithIds,
  consumePresentHandoff,
  consumePresentHandoffWithIds,
  type HandoffNodeLike,
} from './handoff';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

function composer(id: string, url: string, pageNo: string, x: number, y = 0): HandoffNodeLike {
  return { id, position: { x, y }, data: { defType: 'slide.composer', params: { pageNo }, run: { outputs: { image: { value: url } } } } };
}

function testDeckPriority() {
  console.log('\n[1] slide.deck đã Run được ƯU TIÊN (đúng thứ tự PresentOverlay)');
  const nodes: HandoffNodeLike[] = [
    composer('n-c1', 'c1', '1', 0),
    { id: 'n-deck', data: { defType: 'slide.deck', params: { deckName: 'D' }, run: { outputs: { _slides: { value: JSON.stringify(['s1', 's2', 's3']) } } } } },
  ];
  ok('lấy từ _slides của Export Deck', JSON.stringify(deckImagesFromNodes(nodes)) === JSON.stringify(['s1', 's2', 's3']));
  ok('_slides JSON hỏng → rơi xuống composer', JSON.stringify(deckImagesFromNodes([
    composer('n-c1', 'c1', '1', 0),
    { id: 'n-deck', data: { defType: 'slide.deck', run: { outputs: { _slides: { value: '{oops' } } } } },
  ])) === JSON.stringify(['c1']));
}

function testComposerOrder() {
  console.log('\n[2] Fallback composer — sắp theo pageNo rồi vị trí (tất định)');
  const nodes = [
    composer('n-b', 'b', '2', 0),
    composer('n-a', 'a', '1', 500),
    composer('n-d', 'd', '', 900),
    composer('n-c', 'c', '', 100),
  ];
  ok('pageNo trước, thiếu pageNo xếp sau theo x', JSON.stringify(deckImagesFromNodes(nodes)) === JSON.stringify(['a', 'b', 'c', 'd']));
  ok('flow không slide → []', deckImagesFromNodes([{ id: 'n1', data: { defType: 'input.image' } }]).length === 0);
  ok('composer chưa Run → bỏ qua', deckImagesFromNodes([{ id: 'n1', data: { defType: 'slide.composer', run: { outputs: {} } } }]).length === 0);
}

function testCapEight() {
  console.log('\n[3] Trần 8 ảnh — không nhét cả thư viện vào storage');
  const many = Array.from({ length: 12 }, (_, i) => composer(`n-u${i}`, `u${i}`, String(i + 1), 0));
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

// --- PS-3: id ổn định (nợ kỹ thuật STATUS.md — nối linked-asset với ảnh Render) ---

function testRenderImageId() {
  console.log('\n[6] renderImageId — 1 ảnh/node dùng thẳng id node, nhiều ảnh/node thêm chỉ số');
  ok('total=1 → render:<nodeId>', renderImageId('abc', 0, 1) === 'render:abc');
  ok('total>1 → render:<nodeId>:<index>', renderImageId('abc', 2, 5) === 'render:abc:2');
}

function testDeckImagesWithIds() {
  console.log('\n[7] deckImagesWithIdsFromNodes — id theo node nguồn, ổn định qua nhiều lần rút');
  const deckNode: HandoffNodeLike = {
    id: 'node-deck-1',
    data: { defType: 'slide.deck', run: { outputs: { _slides: { value: JSON.stringify(['s1', 's2', 's3']) } } } },
  };
  const items = deckImagesWithIdsFromNodes([deckNode]);
  ok('3 ảnh từ 1 node slide.deck → 3 id khác nhau, cùng gốc node', JSON.stringify(items) === JSON.stringify([
    { src: 's1', id: 'render:node-deck-1:0' },
    { src: 's2', id: 'render:node-deck-1:1' },
    { src: 's3', id: 'render:node-deck-1:2' },
  ]));
  // Rút LẦN 2 từ CÙNG node (vd user bấm "Đưa sang Present" lại sau khi thêm slide khác) → cùng id.
  const items2 = deckImagesWithIdsFromNodes([deckNode]);
  ok('rút lại từ cùng node → id ổn định (không đổi giữa các lần rút)', JSON.stringify(items) === JSON.stringify(items2));

  const composerNodes: HandoffNodeLike[] = [
    composer('node-comp-A', 'imgA', '1', 0),
    composer('node-comp-B', 'imgB', '2', 0),
  ];
  const composedItems = deckImagesWithIdsFromNodes(composerNodes);
  ok(
    'slide.composer — mỗi node 1 ảnh, id = render:<nodeId> (không suffix)',
    JSON.stringify(composedItems) === JSON.stringify([
      { src: 'imgA', id: 'render:node-comp-A' },
      { src: 'imgB', id: 'render:node-comp-B' },
    ]),
  );

  ok('deckImagesFromNodes (bản cũ) vẫn chỉ trả src, tương thích ngược', JSON.stringify(deckImagesFromNodes([deckNode])) === JSON.stringify(['s1', 's2', 's3']));
}

function testStashConsumeWithIds() {
  console.log('\n[8] stash/consume kèm id (PS-3) — id đi theo suốt hand-off, kể cả rơi xuống mem fallback');
  const items = [
    { src: 'r1', id: 'render:nodeX:0' },
    { src: 'r2', id: 'render:nodeX:1' },
  ];
  stashPresentHandoffWithIds(items);
  const got = consumePresentHandoffWithIds();
  ok('consume trả đủ id kèm src', JSON.stringify(got) === JSON.stringify(items));
  ok('consume lần 2 → rỗng (vẫn consume-once)', consumePresentHandoffWithIds().length === 0);

  // Nguồn CŨ (stashPresentHandoff, không id) — consume bằng bản mới vẫn không lỗi, chỉ thiếu id.
  stashPresentHandoff(['old1', 'old2']);
  const gotOld = consumePresentHandoffWithIds();
  ok(
    'stash bản cũ (không id) → consume mới trả src, id để trống',
    gotOld.length === 2 && gotOld.every((it, i) => it.src === ['old1', 'old2'][i] && it.id === undefined),
  );
}

testDeckPriority();
testComposerOrder();
testCapEight();
testStashConsumeMemoryFallback();
testEmptyStashNoop();
testRenderImageId();
testDeckImagesWithIds();
testStashConsumeWithIds();

console.log(`\n${pass} ok, ${fail} fail`);
if (fail > 0) process.exit(1);
