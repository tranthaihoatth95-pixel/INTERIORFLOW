/**
 * lib/cad/present-handoff.test.ts — kiểm bridge CAD→Present. Chạy:
 *   node_modules/.bin/sucrase-node lib/cad/present-handoff.test.ts
 *
 * Môi trường node KHÔNG có sessionStorage → chính là kịch bản "storage hỏng/offline":
 * stash phải rơi xuống fallback bộ nhớ và consume vẫn nhận đủ (consume-once).
 */
import {
  stashCadPresentHandoff,
  consumeCadPresentHandoff,
  peekCadPresentHandoffPayload,
  clearCadPresentHandoff,
} from './present-handoff';

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

/**
 * [3] LUẬT "CHỈ BUÔNG TAY KHI HÀNG ĐÃ HẠ CÁNH" (06/09, sửa mất dữ liệu).
 * `peek` ĐỌC MÀ GIỮ — đây là điều kiện để `PresentEditor` chèn slide xong vẫn còn nguồn cho tới
 * khi IndexedDB xác nhận đã ghi. Mất tính chất này là tái phát đúng lỗi mất tờ bản vẽ.
 */
function testPeekGiuNguon() {
  console.log('\n[3] peek ĐỌC MÀ GIỮ — nguồn còn nguyên cho tới khi clear');
  stashCadPresentHandoff('data:image/png;base64,BBB', { projectId: 'du-an-1' });
  const l1 = peekCadPresentHandoffPayload();
  const l2 = peekCadPresentHandoffPayload();
  ok('peek lần 1 có hàng', l1?.dataUrl === 'data:image/png;base64,BBB');
  ok('peek lần 2 VẪN có hàng (không tiêu thụ)', l2?.dataUrl === 'data:image/png;base64,BBB');
  ok('projectId đi theo lô hàng (chống rơi nhầm nhà)', l1?.projectId === 'du-an-1');
  clearCadPresentHandoff();
  ok('clear rồi thì peek → null', peekCadPresentHandoffPayload() === null);
}

function testProjectIdMacDinh() {
  console.log('\n[4] Không khai projectId → null (payload cũ nhận như trước, không chặn)');
  stashCadPresentHandoff('data:image/png;base64,CCC');
  ok('projectId mặc định null', peekCadPresentHandoffPayload()?.projectId === null);
  clearCadPresentHandoff();
}

testStashConsumeMemoryFallback();
testEmptyNoop();
testPeekGiuNguon();
testProjectIdMacDinh();

console.log(`\n${pass} ok, ${fail} fail`);
if (fail > 0) process.exit(1);
