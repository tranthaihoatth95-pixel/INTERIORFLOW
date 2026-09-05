import assert from 'node:assert';
import { chuanHoaScope, nenGhiDeToken, scopeThieu, tachScope } from './scopes';

let pass = 0;
function test(name: string, fn: () => void) {
  fn();
  pass++;
  console.log(`  ✓ ${name}`);
}

test('tách scope: space/comma, bỏ tiền tố Graph, không phân biệt hoa thường', () => {
  const s = tachScope('openid https://graph.microsoft.com/Calendars.Read, User.Read');
  assert.ok(s.has('openid') && s.has('calendars.read') && s.has('user.read'));
  assert.strictEqual(chuanHoaScope('https://graph.microsoft.com/Mail.Read'), 'mail.read');
});

test('token login MS (User.Read) thiếu Calendars.Read → báo đúng scope thiếu', () => {
  assert.deepStrictEqual(scopeThieu('openid profile email User.Read offline_access', ['Calendars.Read']), ['Calendars.Read']);
  assert.deepStrictEqual(scopeThieu('offline_access User.Read Calendars.Read Mail.Read', ['Calendars.Read']), []);
  assert.deepStrictEqual(scopeThieu(null, ['Calendars.Read']), ['Calendars.Read']);
});

test('KHÔNG hạ scope: token login không được ghi đè token đã có Calendars.Read', () => {
  assert.strictEqual(nenGhiDeToken('offline_access User.Read Calendars.Read Mail.Read', 'openid profile email User.Read offline_access'), false);
  assert.strictEqual(nenGhiDeToken('openid User.Read', 'openid User.Read Calendars.Read'), true, 'bản mới rộng hơn → ghi đè');
  assert.strictEqual(nenGhiDeToken(null, 'User.Read'), true, 'chưa có → ghi');
  assert.strictEqual(nenGhiDeToken('', 'User.Read'), true);
  assert.strictEqual(nenGhiDeToken('openid profile email offline_access User.Read', 'User.Read'), true, 'scope identity (openid/profile/email/offline_access) không tính là mất');
});

console.log(`scopes: ${pass} pass`);
