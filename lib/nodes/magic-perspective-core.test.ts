/**
 * lib/nodes/magic-perspective-core.test.ts — vòng "Chỉnh phối cảnh" liên chặng (phiếu D2).
 * Chạy: node_modules/.bin/sucrase-node lib/nodes/magic-perspective-core.test.ts
 */
import {
  MAGIC_PERSPECTIVE_KEY,
  magicMetaOf,
  findMagicNodes,
  findPerspectiveResult,
  appendPerspectiveProvenance,
  type MagicNodeLike,
} from './magic-perspective-core';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) {
    pass += 1;
    console.log(`  ok  - ${label}`);
  } else {
    fail += 1;
    console.log(`  FAIL - ${label}`);
  }
}

function magicNode(
  id: string,
  meta: { assetId: string; deckId: string; luc: number },
  run?: MagicNodeLike['data']['run'],
): MagicNodeLike {
  return { id, data: { defType: 'ai.regionrender', [MAGIC_PERSPECTIVE_KEY]: meta, run } };
}

console.log('magicMetaOf');
{
  ok('node thường (không metadata) → null', magicMetaOf({ defType: 'input.image' }) === null);
  ok(
    'metadata sai hình dạng (thiếu deckId) → null',
    magicMetaOf({ [MAGIC_PERSPECTIVE_KEY]: { assetId: 'a1' } }) === null,
  );
  const m = magicMetaOf({ [MAGIC_PERSPECTIVE_KEY]: { assetId: 'a1', deckId: 'd1', luc: 5 } });
  ok('metadata đủ → đọc đúng', !!m && m.assetId === 'a1' && m.deckId === 'd1' && m.luc === 5);
  const noLuc = magicMetaOf({ [MAGIC_PERSPECTIVE_KEY]: { assetId: 'a1', deckId: 'd1' } });
  ok('thiếu luc → 0 (vẫn hợp lệ)', !!noLuc && noLuc.luc === 0);
}

console.log('findMagicNodes');
{
  const nodes: MagicNodeLike[] = [
    { id: 'x', data: { defType: 'input.image' } },
    magicNode('n1', { assetId: 'a1', deckId: 'd1', luc: 10 }),
    magicNode('n2', { assetId: 'a1', deckId: 'd1', luc: 20 }),
    magicNode('n3', { assetId: 'a1', deckId: 'd2', luc: 30 }), // deck khác — không lẫn
    magicNode('n4', { assetId: 'a2', deckId: 'd1', luc: 40 }), // asset khác
  ];
  const found = findMagicNodes(nodes, 'a1', 'd1');
  ok('chỉ khớp đúng asset+deck', found.length === 2);
  ok('mới nhất trước (luc giảm dần)', found[0]?.id === 'n2' && found[1]?.id === 'n1');
}

console.log('findPerspectiveResult');
{
  const done = magicNode('n1', { assetId: 'a1', deckId: 'd1', luc: 10 }, {
    status: 'done',
    outputs: { image: { dataType: 'image', value: 'data:new' } },
  });
  const running = magicNode('n2', { assetId: 'a1', deckId: 'd1', luc: 20 }, {
    status: 'running',
  });
  ok(
    'node done + ảnh mới → có kết quả (bỏ qua node mới hơn nhưng chưa xong)',
    findPerspectiveResult([running, done], 'a1', 'd1', 'data:old')?.src === 'data:new',
  );
  ok(
    'kết quả trùng src hiện tại (đã nhận rồi) → null',
    findPerspectiveResult([done], 'a1', 'd1', 'data:new') === null,
  );
  ok('chưa node nào done → null', findPerspectiveResult([running], 'a1', 'd1', 'data:old') === null);
  const wrongOut = magicNode('n3', { assetId: 'a1', deckId: 'd1', luc: 30 }, {
    status: 'done',
    outputs: { image: { dataType: 'text', value: 'x' } },
  });
  ok('output không phải ảnh → null', findPerspectiveResult([wrongOut], 'a1', 'd1', 'old') === null);
  ok('deck khác → null', findPerspectiveResult([done], 'a1', 'd9', 'data:old') === null);
}

console.log('appendPerspectiveProvenance');
{
  const first = appendPerspectiveProvenance(undefined, 'n1', 100);
  ok('chưa có gia phả → 1 bước', first.length === 1 && first[0].nodeId === 'n1' && first[0].luc === 100);
  const second = appendPerspectiveProvenance(first, 'n2', 200);
  ok('nối tiếp không mutate mảng cũ', second.length === 2 && first.length === 1);
  ok('bước cũ giữ nguyên thứ tự', second[0].nodeId === 'n1' && second[1].nodeId === 'n2');
  const dirty = appendPerspectiveProvenance([{ loai: 'khac' }, 42, first[0]], 'n3', 300);
  ok('dữ liệu lạ bị lọc, không nổ', dirty.length === 2 && dirty[0].nodeId === 'n1' && dirty[1].nodeId === 'n3');
}

console.log(`\n${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
