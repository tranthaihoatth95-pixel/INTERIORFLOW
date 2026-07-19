/**
 * lib/cad/present-handoff.test.ts — kiểm bridge CAD→Present. Chạy:
 *   node_modules/.bin/sucrase-node lib/cad/present-handoff.test.ts
 *
 * Môi trường node KHÔNG có sessionStorage → chính là kịch bản "storage hỏng/offline":
 * stash phải rơi xuống fallback bộ nhớ và consume vẫn nhận đủ (consume-once).
 */
import { stashCadPresentHandoff, consumeCadPresentHandoff } from './present-handoff';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

function testStashConsumeMemoryFallback() {
  console.log('\n[1] Storage hỏng (node không có sessionStorage) → fallback bộ nhớ + consume-once');
  const okStorage = stashCadPresentHandoff('data:image/png;base64,AAA');
  ok('stash báo KHÔNG vào được sessionStorage (dùng mem)', okStorage === false);
  const got = consumeCadPresentHandoff();
  ok('consume nhận đúng ảnh từ mem', got === 'data:image/png;base64,AAA');
  ok('consume lần 2 → null (consume-once, không double-insert)', consumeCadPresentHandoff() === null);
}

function testEmptyNoop() {
  console.log('\n[2] Không có gì để chuyển → consume null (luồng cũ nguyên vẹn)');
  ok('consume null khi chưa từng stash', consumeCadPresentHandoff() === null);
}

testStashConsumeMemoryFallback();
testEmptyNoop();

console.log(`\n${pass} ok, ${fail} fail`);
if (fail > 0) process.exit(1);
