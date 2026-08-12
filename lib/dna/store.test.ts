/** Test `store.ts` (chỉ phần THUẦN parse/serialize — không đụng fs thật) —
 *  chạy: node_modules/.bin/sucrase-node lib/dna/store.test.ts
 *  Import TƯƠNG ĐỐI, khuôn copy từ `lib/library/idfc-store.test.ts`.
 */
import { parseCardsFile, serializeCardsFile } from './store';
import { newDnaCard } from './types';

let pass = 0;
let fail = 0;
function ok(name: string, cond: boolean) {
  if (cond) { pass++; console.log('  ok  -', name); }
  else { fail++; console.log('  FAIL-', name); }
}
function eq(name: string, a: unknown, b: unknown) {
  ok(`${name} (${JSON.stringify(a)} = ${JSON.stringify(b)})`, JSON.stringify(a) === JSON.stringify(b));
}

console.log('parseCardsFile() — chuỗi rỗng / file chưa từng ghi = danh sách rỗng, không throw');
{
  eq('rỗng', parseCardsFile(''), []);
  eq('chỉ khoảng trắng', parseCardsFile('   \n  '), []);
}

console.log('parseCardsFile() — JSON hỏng = danh sách rỗng, không throw (không kéo sập route)');
{
  eq('JSON cú pháp sai', parseCardsFile('{not json'), []);
  eq('JSON hợp lệ nhưng thiếu khoá cards', parseCardsFile('{"khac":1}'), []);
}

console.log('serializeCardsFile() → parseCardsFile() — ROUND-TRIP giữ nguyên danh sách thẻ');
{
  const a = newDnaCard('proj_1', 'Phương án A', '2026-08-12T01:00:00.000Z');
  const b = newDnaCard('proj_1', 'Phương án B', '2026-08-12T02:00:00.000Z');
  a.layers.mauTyLe = { values: ['#101010'], trangThai: 'verified', nguon: ['manual'] };
  const raw = serializeCardsFile([a, b]);
  const roundTripped = parseCardsFile(raw);
  eq('round-trip giữ đúng 2 thẻ, đúng thứ tự', roundTripped, [a, b]);
}

console.log('parseCardsFile() — LỌC BỎ thẻ hỏng, GIỮ thẻ hợp lệ (1 bản ghi rác không sập cả file)');
{
  const good = newDnaCard('proj_2', 'Hợp lệ', '2026-08-12T03:00:00.000Z');
  const raw = JSON.stringify({ cards: [good, { id: 'thieu-het' }, null, 'chuoi-la'] });
  const roundTripped = parseCardsFile(raw);
  eq('chỉ còn 1 thẻ hợp lệ', roundTripped, [good]);
}

console.log('serializeCardsFile() — danh sách rỗng vẫn ra JSON hợp lệ đọc lại được');
{
  eq('mảng rỗng round-trip về mảng rỗng', parseCardsFile(serializeCardsFile([])), []);
}

console.log(`\n${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
