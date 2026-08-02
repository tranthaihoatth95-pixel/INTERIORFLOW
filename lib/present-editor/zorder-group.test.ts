/**
 * lib/present-editor/zorder-group.test.ts — kiểm `reorderZOrderGroup` (z-order nhóm, chốt
 * `docs/CHOT-NGUYEN-LIEU-EDITOR-2026-08-01.md` mục "z-order nhóm", 04/08).
 * Chạy: node_modules/.bin/sucrase-node lib/present-editor/zorder-group.test.ts
 */
import { reorderZOrderGroup } from './zorder-group';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) {
    pass += 1;
    console.log(`  ok  - ${label}`);
  } else {
    fail += 1;
    console.log(`  FAIL - ${label}`);
  }
}

interface El {
  id: string;
}
const els = (ids: string): El[] => ids.split('').map((id) => ({ id }));
const order = (arr: El[]): string => arr.map((e) => e.id).join('');

function testSingleMatchesOldAlgorithm() {
  console.log('\n[1] 1 phần tử chọn — khớp Y HỆT thuật toán đơn gốc (splice out rồi chèn lại)');
  const arr = els('ABCDE'); // chọn 'C'
  ok('forward: C nhảy qua D → ABDCE', order(reorderZOrderGroup(arr, ['C'], 'forward')) === 'ABDCE');
  ok('backward: C nhảy qua B → ACBDE', order(reorderZOrderGroup(arr, ['C'], 'backward')) === 'ACBDE');
  ok('front: C ra cuối → ABDEC', order(reorderZOrderGroup(arr, ['C'], 'front')) === 'ABDEC');
  ok('back: C ra đầu → CABDE', order(reorderZOrderGroup(arr, ['C'], 'back')) === 'CABDE');
  ok('đã ở đỉnh (E, forward) → không đổi', order(reorderZOrderGroup(arr, ['E'], 'forward')) === 'ABCDE');
  ok('đã ở đáy (A, backward) → không đổi', order(reorderZOrderGroup(arr, ['A'], 'backward')) === 'ABCDE');
}

function testContiguousBlock() {
  console.log('\n[2] Khối LIỀN KỀ (C,D) — dịch CẢ CỤM cùng nhau, giữ thứ tự nội bộ C trước D');
  const arr = els('ABCDE'); // chọn {C, D} — liền kề
  ok(
    'forward: khối [C,D] nhảy qua E → ABECD',
    order(reorderZOrderGroup(arr, ['C', 'D'], 'forward')) === 'ABECD',
  );
  ok(
    'backward: khối [C,D] nhảy qua B → ACDBE',
    order(reorderZOrderGroup(arr, ['C', 'D'], 'backward')) === 'ACDBE',
  );
  ok(
    'thứ tự chọn TRUYỀN VÀO không quyết định — [D,C] cho kết quả GIỐNG [C,D] (thứ tự lấy theo mảng gốc)',
    order(reorderZOrderGroup(arr, ['D', 'C'], 'forward')) === 'ABECD',
  );
}

function testSeparateRuns() {
  console.log('\n[3] 2 khối RỜI RẠC (B) và (D) — mỗi khối tự dịch qua ĐÚNG 1 hàng xóm riêng, độc lập nhau');
  const arr = els('ABCDEF'); // chọn {B, D} — cách nhau bởi C
  ok(
    'forward: B qua C, D qua E, ĐỘC LẬP nhau → ACBED F rút gọn = ACBEDF',
    order(reorderZOrderGroup(arr, ['B', 'D'], 'forward')) === 'ACBEDF',
  );
  ok(
    'backward: B qua A, D qua C, ĐỘC LẬP nhau → BADCEF... xem giải thích dưới',
    order(reorderZOrderGroup(arr, ['B', 'D'], 'backward')) === 'BADCEF',
  );
}

function testFrontBackPreserveRelativeOrder() {
  console.log('\n[4] front/back — gom phần tử ĐÃ chọn giữ thứ tự tương đối, phần CÒN LẠI cũng giữ nguyên thứ tự');
  const arr = els('ABCDE'); // chọn {B, D} — không liền kề
  ok('front: rest(A,C,E) + selected(B,D) → ACEBD', order(reorderZOrderGroup(arr, ['B', 'D'], 'front')) === 'ACEBD');
  ok('back: selected(B,D) + rest(A,C,E) → BDACE', order(reorderZOrderGroup(arr, ['B', 'D'], 'back')) === 'BDACE');
}

function testEdgesAndNoOp() {
  console.log('\n[5] Biên: chọn rỗng / chọn HẾT / khối đã sát đỉnh-đáy');
  const arr = els('ABC');
  ok('chọn rỗng → mảng KHÔNG đổi (cùng thứ tự)', order(reorderZOrderGroup(arr, [], 'forward')) === 'ABC');
  ok('chọn HẾT, forward → không đổi (không còn ai để nhảy qua)', order(reorderZOrderGroup(arr, ['A', 'B', 'C'], 'forward')) === 'ABC');
  ok('chọn HẾT, backward → không đổi', order(reorderZOrderGroup(arr, ['A', 'B', 'C'], 'backward')) === 'ABC');
  ok(
    'không mutate mảng gốc truyền vào (trả mảng MỚI)',
    (() => {
      const before = order(arr);
      reorderZOrderGroup(arr, ['A'], 'forward');
      return order(arr) === before;
    })(),
  );
}

testSingleMatchesOldAlgorithm();
testContiguousBlock();
testSeparateRuns();
testFrontBackPreserveRelativeOrder();
testEdgesAndNoOp();

console.log(`\n${pass} ok, ${fail} fail`);
if (fail > 0) process.exit(1);
