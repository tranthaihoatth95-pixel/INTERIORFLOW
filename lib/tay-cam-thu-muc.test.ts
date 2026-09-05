/**
 * lib/tay-cam-thu-muc.test.ts — KHOÁ BẤT BIẾN *"quyền hệ tệp không đi theo máy, nó đi theo người"*.
 *
 * Lỗ P1 đang chặn (Hoà phân loại 05/09): hai kho tay cầm thư mục dùng **khoá cố định**
 * (`rootDir` · `backupDir`) ⇒ trên một máy dùng chung, người B đăng nhập sau **thừa hưởng quyền
 * đọc/ghi thư mục dự án của người A**. Handle đó là đường dữ liệu THẬT (`real-fs` ·
 * `brand-kit-disk` · `colors/store` · `PresentSheets` đều đọc nó).
 *
 * Ba khẳng định dưới đây là ba cách lỗ đó tái phát. Ca ③ là ca **dễ bị "sửa cho tiện" nhất**:
 * ai đó thấy người dùng cũ mất thư mục sẽ muốn di trú khoá cũ sang người đang đăng nhập — và đó
 * chính là mở lại lỗ, vì bản ghi cũ **không mang tên ai**.
 */

import { strict as assert } from 'node:assert';
import { khoaTheoNguoi } from './tay-cam-thu-muc';
import { setLastUserId, clearLastUserId } from './resume';

let pass = 0;
const ok = (ten: string, dk: boolean, them = '') => {
  assert.ok(dk, `${ten}${them ? ` — ${them}` : ''}`);
  pass++;
  console.log(`  ok   ${ten}`);
};

console.log('tay-cam-thu-muc — quyền hệ tệp theo NGƯỜI, không theo máy');

// ① hai người ⇒ hai khoá khác nhau. Đây là chính lỗ P1.
setLastUserId('usr_A');
const khoaA = khoaTheoNguoi('rootDir');
setLastUserId('usr_B');
const khoaB = khoaTheoNguoi('rootDir');
ok('① người A và người B KHÔNG dùng chung khoá', khoaA !== khoaB, `${khoaA} ≠ ${khoaB}`);
ok('① khoá mang đúng id người dùng', khoaA === 'rootDir:usr_A' && khoaB === 'rootDir:usr_B');

// ② chưa biết người dùng ⇒ null ⇒ nơi gọi fail closed (không cất, không đọc).
clearLastUserId();
ok('② chưa đăng nhập ⇒ KHÔNG có khoá (fail closed)', khoaTheoNguoi('rootDir') === null);
ok('② kho backup cũng vậy', khoaTheoNguoi('backupDir') === null);

// ③ khoá cũ KHÔNG BAO GIỜ là khoá hợp lệ của bất kỳ ai.
//    Nếu một ngày `khoaTheoNguoi` trả đúng chuỗi trần `rootDir`, lỗ đã mở lại.
setLastUserId('usr_A');
ok('③ khoá của người dùng KHÁC hẳn khoá cũ không-theo-người',
   khoaTheoNguoi('rootDir') !== 'rootDir' && khoaTheoNguoi('backupDir') !== 'backupDir');
ok('③ và nó luôn mang dấu hai chấm ngăn cách — hình dạng không lẫn được với khoá cũ',
   (khoaTheoNguoi('rootDir') ?? '').includes(':'));

clearLastUserId();
console.log(`\n${pass}/${pass} ĐẠT`);
