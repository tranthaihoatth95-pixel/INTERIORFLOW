/**
 * lib/present-editor/reorder.test.ts — kiểm reorderArray (kéo-thả Slide Sorter).
 * Chạy: node_modules/.bin/sucrase-node lib/present-editor/reorder.test.ts
 */
import { reorderArray } from './reorder';

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

console.log('[1] Kéo về SAU (from < to)');
{
  const r = reorderArray(['a', 'b', 'c', 'd'], 0, 2);
  ok('["b","c","a","d"]', JSON.stringify(r) === JSON.stringify(['b', 'c', 'a', 'd']));
}

console.log('[2] Kéo về TRƯỚC (from > to)');
{
  const r = reorderArray(['a', 'b', 'c', 'd'], 3, 0);
  ok('["d","a","b","c"]', JSON.stringify(r) === JSON.stringify(['d', 'a', 'b', 'c']));
}

console.log('[3] from === to → giữ nguyên (bản sao mới, không mutate gốc)');
{
  const src = ['a', 'b', 'c'];
  const r = reorderArray(src, 1, 1);
  ok('giá trị giữ nguyên', JSON.stringify(r) === JSON.stringify(src));
  ok('KHÔNG cùng tham chiếu (bản sao)', r !== src);
}

console.log('[4] chỉ số ngoài phạm vi → trả bản sao, không throw');
{
  const src = ['a', 'b', 'c'];
  ok('from âm', JSON.stringify(reorderArray(src, -1, 1)) === JSON.stringify(src));
  ok('to vượt cuối', JSON.stringify(reorderArray(src, 0, 9)) === JSON.stringify(src));
}

console.log('[5] KHÔNG mutate mảng gốc');
{
  const src = ['a', 'b', 'c'];
  const before = JSON.stringify(src);
  reorderArray(src, 0, 2);
  ok('mảng gốc không đổi', JSON.stringify(src) === before);
}

console.log('[6] mảng rỗng/1 phần tử → an toàn');
{
  ok('mảng rỗng', JSON.stringify(reorderArray([], 0, 0)) === '[]');
  ok('1 phần tử', JSON.stringify(reorderArray(['a'], 0, 0)) === JSON.stringify(['a']));
}

console.log(`\n${pass} ok, ${fail} fail`);
if (fail > 0) process.exit(1);
