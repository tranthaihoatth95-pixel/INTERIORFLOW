/**
 * lib/server/auth-policy.test.ts — test cổng Google grandfather (quyết định #3). Chạy bằng:
 *   node_modules/.bin/sucrase-node lib/server/auth-policy.test.ts
 * (pure module — không cần Next/DB; domain mặc định ttt.vn vì test không set env)
 */
import { googleSignInGate, isAllowedGoogleEmail, GOOGLE_ALLOWED_DOMAIN } from './auth-policy';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

console.log(`[1] isAllowedGoogleEmail (domain=${GOOGLE_ALLOWED_DOMAIN})`);
ok('hoa@ttt.vn → true', isAllowedGoogleEmail('hoa@ttt.vn'));
ok('HOA@TTT.VN (hoa thường hoá) → true', isAllowedGoogleEmail('HOA@TTT.VN'));
ok('  hoa@ttt.vn  (trim) → true', isAllowedGoogleEmail('  hoa@ttt.vn  '));
ok('ai_do@gmail.com → false', !isAllowedGoogleEmail('ai_do@gmail.com'));
ok('hoa@nottt.vn → false (không ăn theo đuôi)', !isAllowedGoogleEmail('hoa@nottt.vn'));

console.log('\n[2] googleSignInGate — 3 ca quyết định #3');
// ca 1: CŨ ngoài domain → grandfather, vào được
ok('cũ-ngoài-domain (gmail, exists=true) → login-existing', googleSignInGate('old.user@gmail.com', true) === 'login-existing');
// ca 2: MỚI ngoài domain → chặn
ok('mới-ngoài-domain (gmail, exists=false) → deny', googleSignInGate('new.user@gmail.com', false) === 'deny-new-outside-domain');
// ca 3: MỚI đúng domain → tạo
ok('mới-đúng-domain (ttt.vn, exists=false) → create', googleSignInGate('new.user@ttt.vn', false) === 'create');
// phụ: cũ đúng domain vẫn login bình thường
ok('cũ-đúng-domain (ttt.vn, exists=true) → login-existing', googleSignInGate('hoa@ttt.vn', true) === 'login-existing');

console.log(`\n${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
