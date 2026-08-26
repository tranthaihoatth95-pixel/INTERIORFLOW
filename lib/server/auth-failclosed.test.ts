/**
 * auth-failclosed.test.ts — Wave 0 · chứng minh AUTH_SECRET fail-closed ở production.
 *
 * Không import `lib/server/auth.ts` trực tiếp: nó kéo Prisma/bcrypt/fs. Test này kiểm
 * bằng PHÂN TÍCH VĂN BẢN NGUỒN — cùng kỹ thuật `lib/site/quyen.test.ts:47` đã dùng để
 * cưỡng chế thứ tự dòng lệnh. Ở đây thứ cần cưỡng chế là: cửa chặn phải đứng TRƯỚC
 * chỗ định nghĩa `secret()`, và phải có ở CẢ HAI tệp.
 */
import { readFileSync } from 'fs';
import { join } from 'path';

let pass = 0;
let fail = 0;
const ok = (name: string, cond: boolean) => {
  if (cond) { pass++; console.log(`  ✓ ${name}`); }
  else { fail++; console.error(`  ✗ ${name}`); }
};

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8');
const auth = read('lib/server/auth.ts');
const mw = read('middleware.ts');

for (const [label, src] of [['auth.ts', auth], ['middleware.ts', mw]] as const) {
  const gate = src.indexOf("process.env.NODE_ENV === 'production'");
  const secretDef = src.indexOf('const secret = ()');

  ok(`${label}: có cửa chặn production`, gate !== -1);
  ok(`${label}: cửa chặn đứng TRƯỚC định nghĩa secret()`, gate !== -1 && secretDef !== -1 && gate < secretDef);
  ok(`${label}: cửa chặn NÉM lỗi, không cảnh báo suông`,
     /NODE_ENV === 'production'[\s\S]{0,120}throw new Error/.test(src));
  ok(`${label}: thông điệp nêu đích danh AUTH_SECRET`,
     /throw new Error\([\s\S]{0,200}AUTH_SECRET/.test(src));
}

// Fallback dev PHẢI còn — bỏ nó là phá cách ly `if_session_noenv` (chủ ý, không phải nợ).
ok('auth.ts: GIỮ fallback ở dev (cách ly if_session_noenv còn hoạt động)',
   auth.includes("'dev-secret-change-me'") && auth.includes('if_session_noenv'));
ok('middleware.ts: GIỮ fallback ở dev', mw.includes("'dev-secret-change-me'"));

// Hai tệp phải cùng hành vi — lệch nhau là mở lại đúng lỗ vừa bịt.
const cond = (s: string) => /NODE_ENV === 'production' && !(?:process\.env\.AUTH_SECRET|HAS_AUTH_SECRET)/.test(s);
ok('hai tệp dùng CÙNG điều kiện chặn', cond(auth) && cond(mw));

console.log(`\n${fail === 0 ? 'PASS' : 'FAIL'} — ${pass} đạt, ${fail} hỏng`);
if (fail > 0) process.exit(1);
