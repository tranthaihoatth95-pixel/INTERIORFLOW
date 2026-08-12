/** Test `notes-store.ts` (phần THUẦN) — chạy: node_modules/.bin/sucrase-node lib/home/notes-store.test.ts */
import { parseNotesFile, serializeNotesFile, type HomeNote } from './notes-store';

let pass = 0;
let fail = 0;
function ok(name: string, cond: boolean) {
  if (cond) { pass++; console.log('  ok  -', name); }
  else { fail++; console.log('  FAIL-', name); }
}
function eq(name: string, a: unknown, b: unknown) {
  ok(`${name} (${JSON.stringify(a)} = ${JSON.stringify(b)})`, JSON.stringify(a) === JSON.stringify(b));
}

console.log('parseNotesFile() — rỗng/hỏng không throw');
{
  eq('chuỗi rỗng', parseNotesFile(''), []);
  eq('JSON hỏng', parseNotesFile('{not json'), []);
  eq('thiếu khoá notes', parseNotesFile('{"khac":1}'), []);
}

console.log('serializeNotesFile() → parseNotesFile() — round-trip');
{
  const a: HomeNote = { id: 'n1', projectId: 'p1', text: 'Gọi thợ đá', createdAt: '2026-08-13T01:00:00.000Z' };
  const b: HomeNote = { id: 'n2', projectId: null, text: 'Ghi chung', createdAt: '2026-08-13T02:00:00.000Z' };
  const raw = serializeNotesFile([a, b]);
  eq('round-trip đúng 2 ghi chú', parseNotesFile(raw), [a, b]);
}

console.log('parseNotesFile() — lọc bỏ bản ghi hỏng (text rỗng / thiếu id / ngày hỏng)');
{
  const good: HomeNote = { id: 'ok', projectId: null, text: 'Hợp lệ', createdAt: '2026-08-13T00:00:00.000Z' };
  const raw = JSON.stringify({
    notes: [good, { id: '', text: 'thiếu id' }, { id: 'x', text: '' , projectId: null, createdAt: '2026-08-13T00:00:00.000Z'}, { id: 'y', text: 'ngày hỏng', projectId: null, createdAt: 'not-a-date' }],
  });
  eq('chỉ còn 1 ghi chú hợp lệ', parseNotesFile(raw), [good]);
}

console.log('serializeNotesFile() — cắt bớt về đúng MAX_NOTES (40), giữ N bản ĐẦU (mới nhất trước)');
{
  const many: HomeNote[] = Array.from({ length: 50 }, (_, i) => ({
    id: `n${i}`,
    projectId: null,
    text: `Ghi chú ${i}`,
    createdAt: new Date(2026, 7, 1 + (i % 28)).toISOString(),
  }));
  const roundTripped = parseNotesFile(serializeNotesFile(many));
  eq('cắt còn 40', roundTripped.length, 40);
  eq('giữ đúng 40 bản ĐẦU', roundTripped, many.slice(0, 40));
}

console.log(`\n${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
