/**
 * lib/legal/gpl-3-0-text.test.ts — xác nhận GPL_3_0_TEXT khớp NGUYÊN VĂN bản gnu.org/licenses/
 * gpl-3.0.txt tải 06/08/2026 (sha256 dưới đây tính từ file gốc lúc tải, KHÔNG phải tính lại từ
 * chuỗi trong code — đổi 1 ký tự trong gpl-3-0-text.ts thì test này rớt).
 * Chạy: node_modules/.bin/sucrase-node lib/legal/gpl-3-0-text.test.ts
 */
import { createHash } from 'crypto';
import { GPL_3_0_TEXT } from './gpl-3-0-text';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

console.log('GPL_3_0_TEXT — nguyên văn, không gõ tay sai lệch');
{
  const sha = createHash('sha256').update(GPL_3_0_TEXT, 'utf-8').digest('hex');
  ok('sha256 khớp bản gnu.org/licenses/gpl-3.0.txt tải 06/08/2026', sha === '3972dc9744f6499f0f9b2dbf76696f2ae7ad8af9b23dde66d6af86c9dfb36986');
  ok('mở đầu đúng tiêu đề', GPL_3_0_TEXT.startsWith('                    GNU GENERAL PUBLIC LICENSE'));
  ok('kết thúc đúng đoạn LGPL', GPL_3_0_TEXT.trimEnd().endsWith('<https://www.gnu.org/licenses/why-not-lgpl.html>.'));
  ok('có đủ 17 điều khoản (mốc "17. Interpretation")', GPL_3_0_TEXT.includes('17. Interpretation of Sections 15 and 16.'));
  ok('có đoạn "END OF TERMS AND CONDITIONS"', GPL_3_0_TEXT.includes('END OF TERMS AND CONDITIONS'));
}

console.log(`\n${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
