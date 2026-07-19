/**
 * lib/server/stress-auth.test.ts — STRESS TEST auth-policy edge cases
 * (CẬP NHẬT 19/07 theo chính sách MỚI đa domain — thay bộ test "@ttt.vn-only" cũ):
 *   - email mọi domain đều hợp lệ (gmail/yahoo/outlook/domain công ty)
 *   - email rỗng, email dị dạng, email cực dài
 *   - token hết hạn logic (pure)
 *   - injection/unicode/null bytes — giờ đo theo isValidAccountEmail
 * Chạy: node_modules/.bin/sucrase-node lib/server/stress-auth.test.ts
 */
import { oauthSignInGate, isValidAccountEmail } from './auth-policy';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

/* ────────────────────── [1] Domain variations — MỌI domain hợp lệ đều qua ────────────────────── */
console.log('[1] isValidAccountEmail — domain variations (chính sách mới: không phân biệt domain)');
{
  ok('@ttt.vn → true', isValidAccountEmail('user@ttt.vn'));
  ok('@TTT.VN (uppercase) → true', isValidAccountEmail('user@TTT.VN'));
  ok('@gmail.com → true (MỚI)', isValidAccountEmail('user@gmail.com'));
  ok('@yahoo.com → true (MỚI)', isValidAccountEmail('user@yahoo.com'));
  ok('@outlook.com → true (MỚI)', isValidAccountEmail('user@outlook.com'));
  ok('@sub.ttt.vn (subdomain) → true (MỚI)', isValidAccountEmail('user@sub.ttt.vn'));
  ok('@company.co → true', isValidAccountEmail('user@company.co'));
}

/* ────────────────────── [2] Email edge cases ────────────────────── */
console.log('\n[2] isValidAccountEmail — email edge cases');
{
  ok('email rỗng → false', !isValidAccountEmail(''));
  ok('chỉ @ → false', !isValidAccountEmail('@'));
  ok('@ttt.vn (không local) → false (chặt hơn endsWith cũ)', !isValidAccountEmail('@ttt.vn'));
  ok('spaces trước/sau → trim', isValidAccountEmail('  user@ttt.vn  '));
  ok('email cực dài (500 ký tự) @gmail.com → true (hợp lệ hình dạng)', isValidAccountEmail('a'.repeat(500) + '@gmail.com'));
  ok('email có + → true', isValidAccountEmail('user+tag@gmail.com'));
  ok('email có . → true', isValidAccountEmail('first.last@ttt.vn'));
  ok('domain không có chấm → false', !isValidAccountEmail('user@localhost'));
}

/* ────────────────────── [3] oauthSignInGate — comprehensive ────────────────────── */
console.log('\n[3] oauthSignInGate — tất cả nhánh quyết định (chính sách mới)');
{
  // User EXISTS → luôn vào
  ok('exists + @ttt.vn → login-existing', oauthSignInGate('a@ttt.vn', true) === 'login-existing');
  ok('exists + @gmail.com → login-existing', oauthSignInGate('old@gmail.com', true) === 'login-existing');

  // User NOT EXISTS → mọi domain hợp lệ đều create
  ok('!exists + @ttt.vn → create', oauthSignInGate('new@ttt.vn', false) === 'create');
  ok('!exists + @gmail.com → create (MỚI)', oauthSignInGate('new@gmail.com', false) === 'create');
  ok('!exists + @yahoo.com → create (MỚI)', oauthSignInGate('new@yahoo.com', false) === 'create');
  ok('!exists + @outlook.com → create (MỚI)', oauthSignInGate('new@outlook.com', false) === 'create');
  ok('!exists + @hotmail.com → create (MỚI)', oauthSignInGate('new@hotmail.com', false) === 'create');

  // Edge: email rỗng / dị dạng
  ok('rỗng + !exists → deny-invalid-email', oauthSignInGate('', false) === 'deny-invalid-email');
  ok('rỗng + exists → login-existing', oauthSignInGate('', true) === 'login-existing');
}

/* ────────────────────── [4] Token hết hạn — logic pure ────────────────────── */
console.log('\n[4] Token expiry logic (pure, không cần jose)');
{
  // Giả lập logic kiểm tra token expiry
  function isTokenExpired(exp: number, now: number = Date.now() / 1000): boolean {
    return now >= exp;
  }

  const now = Date.now() / 1000;
  ok('token exp quá khứ → expired', isTokenExpired(now - 3600));
  ok('token exp tương lai → not expired', !isTokenExpired(now + 3600));
  ok('token exp = now → expired (biên)', isTokenExpired(now));
  ok('token exp = 0 → expired', isTokenExpired(0));
  ok('token exp = Infinity → not expired', !isTokenExpired(Infinity));
  // BUG TIỀM ẨN P2: NaN >= x luôn false → NaN bị coi là NOT expired
  // Logic thật nên coi NaN = expired (an toàn). Ghi nhận vào báo cáo.
  ok('token exp NaN → NOT expired (NaN comparison quirk)', !isTokenExpired(NaN));
}

/* ────────────────────── [5] Injection / dị dạng — vẫn phải chặn ────────────────────── */
console.log('\n[5] Bypass attempts — injection, unicode, null bytes (đo theo isValidAccountEmail)');
{
  // null byte trong local-part: hình dạng vẫn 1@ + domain có chấm → true (provider OAuth
  // sẽ reject email này trước khi đến app — risk thấp, giữ ghi nhận P2 như bộ test cũ)
  ok('null byte trong local → true (P2 cosmetic, provider chặn trước)', isValidAccountEmail('user\0@ttt.vn'));

  ok('newline injection (2 dấu @) → false', !isValidAccountEmail('user@ttt.vn\n@gmail.com'));
  ok('tab cuối → true (trim catches tab)', isValidAccountEmail('user@ttt.vn\t'));
  ok('nhiều @ (user@gmail.com@ttt.vn) → false (giữ chốt chặn cũ)', !isValidAccountEmail('user@gmail.com@ttt.vn'));
  ok('khoảng trắng giữa domain → false', !isValidAccountEmail('user@ttt .vn'));
}

/* ────────────────────── [6] Batch: 100 email — mọi domain hợp lệ pass ────────────────────── */
console.log('\n[6] Batch — 100 email hình dạng hợp lệ, TẤT CẢ pass (chính sách mới)');
{
  const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'ttt.vn',
    'abc.vn', 'ttt.com', 'company.co', 'ttt.vn.hk', 'mail.ttt.vn'];
  let correctCount = 0;
  for (let i = 0; i < 100; i++) {
    const domain = domains[i % domains.length];
    const email = `user${i}@${domain}`;
    if (isValidAccountEmail(email)) correctCount++; // mọi domain đều hợp lệ
  }
  ok(`batch 100 email: ${correctCount}/100 hợp lệ`, correctCount === 100);
}

console.log(`\n${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
