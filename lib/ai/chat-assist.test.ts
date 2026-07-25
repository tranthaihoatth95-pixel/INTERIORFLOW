/**
 * lib/ai/chat-assist.test.ts — kiểm validate input + build prompt cho "Trợ lý AI" Gallery.
 * Chạy: node_modules/.bin/sucrase-node lib/ai/chat-assist.test.ts
 */
import {
  sanitizeChatMessages,
  buildChatPrompt,
  MAX_CHAT_TURNS,
  MAX_CHAT_MSG_LEN,
  sanitizeBrandContext,
  brandPromptBlock,
  chatSystemPromptFor,
} from './chat-assist';

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

console.log('\nsanitizeBrandContext + brandPromptBlock (VIỆC 4 — nhận diện dự án)');

ok('không phải object → null', sanitizeBrandContext('x') === null);
ok('object rỗng → null', sanitizeBrandContext({}) === null);
ok('kit rỗng hoàn toàn → null', sanitizeBrandContext({ name: '', palette: [], fonts: '', hasLogo: false }) === null);

{
  const b = sanitizeBrandContext({
    name: '  Nhà Bên Sông  ',
    palette: ['#A1B2C3', 'không-phải-màu', '#fff', '#0d0d0d'],
    fonts: 'Editorial',
    hasLogo: true,
  });
  ok('giữ kit hợp lệ', !!b);
  ok('trim tên', b!.name === 'Nhà Bên Sông');
  ok('lọc hex sai + hex 3 ký tự', b!.palette.length === 2);
  ok('hạ chữ thường hex', b!.palette[0] === '#a1b2c3');
  ok('hasLogo chỉ nhận true thật', b!.hasLogo === true);
}

{
  const b = sanitizeBrandContext({ palette: Array(30).fill('#112233') });
  ok('cắt bảng màu tối đa 12', !!b && b.palette.length === 12);
}

{
  const b = sanitizeBrandContext({ hasLogo: 'yes' });
  ok('hasLogo không phải boolean true → không tính là có kit', b === null);
}

{
  const empty = brandPromptBlock(null);
  ok('chưa có kit → prompt nói CHƯA có Brand Kit', empty.includes('CHƯA có Brand Kit'));
  ok('chưa có kit → cấm bịa', empty.includes('KHÔNG bịa'));
  ok('chưa có kit → KHÔNG chứa hex màu nào', !/#[0-9a-f]{6}/i.test(empty));
}

{
  const b = sanitizeBrandContext({ name: 'Atelier X', palette: ['#123456'], fonts: 'Modern', hasLogo: false });
  const block = brandPromptBlock(b);
  ok('có kit → nêu tên', block.includes('Atelier X'));
  ok('có kit → nêu màu user lưu', block.includes('#123456'));
  ok('có kit → nêu font', block.includes('Modern'));
  ok('không logo → nói chưa có logo', block.includes('chưa có logo'));
}

{
  const withKit = chatSystemPromptFor('present', sanitizeBrandContext({ palette: ['#abcdef'] }));
  const without = chatSystemPromptFor('present');
  ok('system prompt nhồi màu của kit', withKit.includes('#abcdef'));
  ok('không truyền brand → vẫn nói chưa có kit', without.includes('CHƯA có Brand Kit'));
  ok('vẫn giữ brief chặng', withKit.includes('PRESENTING'));
  ok('vẫn giữ giới hạn 3 câu', withKit.includes('tối đa 3 câu'));
  ok('prompt gốc KHÔNG hardcode thương hiệu nào', !/TTT|#f06020|#002850/i.test(without));
}

console.log(`\n${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
