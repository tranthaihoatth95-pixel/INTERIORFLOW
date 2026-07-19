/**
 * lib/server/auth-policy.test.ts — test chính sách MỚI 19/07 (đa domain, thay
 * "chỉ Google @ttt.vn" cũ). Chạy bằng:
 *   node_modules/.bin/sucrase-node lib/server/auth-policy.test.ts
 * (pure module — không cần Next/DB)
 */
import { oauthSignInGate, isValidAccountEmail } from './auth-policy';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

console.log('[1] isValidAccountEmail — mọi domain hợp lệ đều qua');
ok('hoa@ttt.vn → true', isValidAccountEmail('hoa@ttt.vn'));
ok('ai_do@gmail.com → true (MỚI: gmail cá nhân được phép)', isValidAccountEmail('ai_do@gmail.com'));
ok('user@congty-khac.com.vn → true (domain công ty khác)', isValidAccountEmail('user@congty-khac.com.vn'));
ok('HOA@TTT.VN (hoa thường hoá) → true', isValidAccountEmail('HOA@TTT.VN'));
ok('  hoa@ttt.vn  (trim) → true', isValidAccountEmail('  hoa@ttt.vn  '));
ok('rỗng → false', !isValidAccountEmail(''));
ok('không có @ → false', !isValidAccountEmail('khong-phai-email'));
ok('nhiều @ (user@gmail.com@ttt.vn) → false (giữ chốt chặn bypass cũ)', !isValidAccountEmail('user@gmail.com@ttt.vn'));
ok('domain không có chấm (user@localhost) → false', !isValidAccountEmail('user@localhost'));
ok('thiếu local (@ttt.vn) → false', !isValidAccountEmail('@ttt.vn'));

console.log('\n[2] oauthSignInGate — chính sách MỚI: mọi domain, chỉ chặn email dị dạng');
// ca 1: đã tồn tại → vào (mọi domain)
ok('đã tồn tại (gmail, exists=true) → login-existing', oauthSignInGate('old.user@gmail.com', true) === 'login-existing');
ok('đã tồn tại (ttt.vn, exists=true) → login-existing', oauthSignInGate('hoa@ttt.vn', true) === 'login-existing');
// ca 2: MỚI — mọi domain đều TẠO ĐƯỢC (khác chính sách cũ deny-ngoài-domain)
ok('mới + gmail (exists=false) → create (MỚI: không còn chặn theo domain)', oauthSignInGate('new.user@gmail.com', false) === 'create');
ok('mới + ttt.vn (exists=false) → create', oauthSignInGate('new.user@ttt.vn', false) === 'create');
ok('mới + outlook.com (exists=false) → create (Microsoft cá nhân)', oauthSignInGate('new.user@outlook.com', false) === 'create');
// ca 3: email dị dạng → chặn
ok('mới + email dị dạng (nhiều @) → deny-invalid-email', oauthSignInGate('x@gmail.com@ttt.vn', false) === 'deny-invalid-email');
ok('mới + email rỗng → deny-invalid-email', oauthSignInGate('', false) === 'deny-invalid-email');

console.log(`\n${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
