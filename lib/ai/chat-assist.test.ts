/**
 * lib/ai/chat-assist.test.ts — kiểm validate input + build prompt cho "Trợ lý AI" Gallery.
 * Chạy: node_modules/.bin/sucrase-node lib/ai/chat-assist.test.ts
 */
import { sanitizeChatMessages, buildChatPrompt, MAX_CHAT_TURNS, MAX_CHAT_MSG_LEN } from './chat-assist';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

console.log('sanitizeChatMessages');

ok('không phải mảng → null', sanitizeChatMessages({ not: 'array' }) === null);
ok('mảng rỗng → null', sanitizeChatMessages([]) === null);
ok('không phải array (string) → null', sanitizeChatMessages('hello') === null);

{
  const r = sanitizeChatMessages([{ role: 'user', content: 'Chào' }]);
  ok('1 lượt user hợp lệ → giữ nguyên', !!r && r.length === 1 && r[0].content === 'Chào');
}

{
  const r = sanitizeChatMessages([
    { role: 'user', content: 'Câu 1' },
    { role: 'assistant', content: 'Trả lời 1' },
    { role: 'user', content: 'Câu 2' },
  ]);
  ok('giữ đúng thứ tự nhiều lượt', !!r && r.length === 3 && r[2].content === 'Câu 2');
}

ok('lượt cuối là assistant → null (chưa có câu hỏi mới)', sanitizeChatMessages([
  { role: 'user', content: 'Câu 1' },
  { role: 'assistant', content: 'Trả lời 1' },
]) === null);

ok('role lạ bị loại, còn lại rỗng → null', sanitizeChatMessages([
  { role: 'system', content: 'x' },
]) === null);

ok('content rỗng/khoảng trắng bị loại', sanitizeChatMessages([
  { role: 'user', content: '   ' },
]) === null);

ok('content không phải string bị loại', sanitizeChatMessages([
  { role: 'user', content: 123 },
]) === null);

ok('phần tử không phải object bị bỏ qua, không throw', sanitizeChatMessages([
  null,
  'garbage',
  { role: 'user', content: 'Câu hợp lệ' },
]) !== null);

{
  const r = sanitizeChatMessages([{ role: 'user', content: '  cắt khoảng trắng  ' }]);
  ok('trim nội dung', !!r && r[0].content === 'cắt khoảng trắng');
}

{
  const long = 'a'.repeat(MAX_CHAT_MSG_LEN + 500);
  const r = sanitizeChatMessages([{ role: 'user', content: long }]);
  ok('cắt bớt nội dung quá dài', !!r && r[0].content.length === MAX_CHAT_MSG_LEN);
}

{
  // Nhiều hơn MAX_CHAT_TURNS lượt (đều user/assistant xen kẽ, kết thúc bằng user).
  const many: { role: 'user' | 'assistant'; content: string }[] = [];
  const totalPairs = MAX_CHAT_TURNS + 5;
  for (let i = 0; i < totalPairs; i++) {
    many.push({ role: 'user', content: `u${i}` });
    many.push({ role: 'assistant', content: `a${i}` });
  }
  many.push({ role: 'user', content: 'câu mới nhất' });
  const r = sanitizeChatMessages(many);
  ok('giới hạn còn đúng MAX_CHAT_TURNS lượt', !!r && r.length === MAX_CHAT_TURNS);
  ok('vẫn giữ đúng lượt cuối là câu hỏi mới nhất', !!r && r[r.length - 1].content === 'câu mới nhất');
}

console.log('buildChatPrompt');

{
  const p = buildChatPrompt([{ role: 'user', content: 'IF có vẽ CAD không?' }]);
  ok('không có lịch sử → không chèn mục LỊCH SỬ', !p.includes('LỊCH SỬ HỘI THOẠI'));
  ok('có câu hỏi mới trong prompt', p.includes('IF có vẽ CAD không?'));
}

{
  const p = buildChatPrompt([
    { role: 'user', content: 'Phòng khách nên chọn màu gì?' },
    { role: 'assistant', content: 'Tông be ấm, điểm nhấn đồng.' },
    { role: 'user', content: 'Còn ánh sáng thì sao?' },
  ]);
  ok('có mục LỊCH SỬ khi >1 lượt', p.includes('LỊCH SỬ HỘI THOẠI'));
  ok('giữ nội dung lượt trước', p.includes('Tông be ấm, điểm nhấn đồng.'));
  ok('câu hỏi mới nhất nằm cuối prompt', p.trim().endsWith('Còn ánh sáng thì sao?'));
}

console.log(`\n${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
