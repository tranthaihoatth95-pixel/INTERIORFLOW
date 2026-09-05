/** Test `tai-ve-json.ts` — chạy: node_modules/.bin/sucrase-node lib/library/tai-ve-json.test.ts
 *
 * Chứng minh: ① tên tệp không mang ký tự cấm, không bao giờ rỗng, không thành tệp ẩn ② không có
 * `document` (SSR/test) thì im lặng, KHÔNG ném ③ thu hồi blob SAU khi click chứ không cùng nhịp
 * — đúng lỗi thầm mà bản chép tay ở `LibrarySheet.tsx` mắc phải.
 */
import { tenTepAnToan, taiVeJson } from './tai-ve-json';

let pass = 0;
let fail = 0;
function ok(name: string, cond: boolean) {
  if (cond) { pass++; console.log('  ok  -', name); }
  else { fail++; console.log('  FAIL-', name); }
}

console.log('tenTepAnToan()');
{
  ok('bỏ ký tự cấm của Windows/macOS', tenTepAnToan('a/b:c*d?e"f<g>h|i') === 'a-b-c-d-e-f-g-h-i');
  ok('giữ nguyên tên lành', tenTepAnToan('if-cau-kien-2026-09-03.json') === 'if-cau-kien-2026-09-03.json');
  ok('giữ được tiếng Việt có dấu', tenTepAnToan('cấu-kiện.json') === 'cấu-kiện.json');
  ok('rỗng ⇒ tên mặc định', tenTepAnToan('   ') === 'if-export' && tenTepAnToan('') === 'if-export');
  ok('không để tên bắt đầu bằng dấu chấm (tệp ẩn)', tenTepAnToan('...bimat') === 'bimat');
}

console.log('taiVeJson() — không có document thì im lặng');
{
  let nem = false;
  try { taiVeJson('{}', 'x.json'); } catch { nem = true; }
  ok('SSR/test không có document ⇒ không ném', !nem);
}

console.log('taiVeJson() — thu hồi blob SAU khi click, không cùng nhịp');
{
  const nhatKy: string[] = [];
  const g = globalThis as Record<string, unknown>;
  g.document = { createElement: () => ({ href: '', download: '', click() { nhatKy.push('click'); } }) };
  g.URL = { createObjectURL: () => 'blob:x', revokeObjectURL: () => nhatKy.push('revoke') };
  taiVeJson('{"a":1}', 'k.json');
  ok('click xảy ra, revoke CHƯA (còn trong hàng đợi)', nhatKy.join() === 'click');
  setTimeout(() => {
    ok('revoke chạy ở nhịp sau', nhatKy.join() === 'click,revoke');
    delete g.document;
    delete g.URL;
    console.log(`\n${pass} ok · ${fail} fail`);
    if (fail > 0) process.exit(1);
  }, 0);
}
