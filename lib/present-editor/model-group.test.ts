/**
 * lib/present-editor/model-group.test.ts — kiểm phần THUẦN của nhóm phần tử (P2/E1,
 * `docs/CHOT-NGUYEN-LIEU-EDITOR-2026-08-01.md`). Chạy:
 *   node_modules/.bin/sucrase-node lib/present-editor/model-group.test.ts
 *
 * Chỉ kiểm `duplicateElementsPreservingGroups` (THUẦN, không đụng DOM/canvas) — logic chọn-cả-
 * cụm/khoá-cả-cụm/gộp-rã-cụm nằm trong PresentEditor.tsx (component React, ngoài khả năng
 * sucrase-node — cần DOM thật, xem ghi chú "Chưa chắc" trong docs/BAO-CAO-PHU.md).
 */
import { makeShape, duplicateElementsPreservingGroups } from './model';

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

function testNoGroup() {
  console.log('\n[1] Không thuộc cụm nào → bản sao cũng không có groupId (HÀNH VI CŨ)');
  const a = makeShape('rect');
  const [copyA] = duplicateElementsPreservingGroups([a]);
  ok('id đổi mới', copyA.id !== a.id);
  ok('không có groupId', copyA.groupId === undefined);
}

function testSameGroupSharedNewId() {
  console.log('\n[2] 2 phần tử CÙNG cụm gốc → bản sao CÙNG 1 groupId MỚI (không phải id gốc)');
  const a = makeShape('rect', { groupId: 'grp_old_1' });
  const b = makeShape('ellipse', { groupId: 'grp_old_1' });
  const [copyA, copyB] = duplicateElementsPreservingGroups([a, b]);
  ok('bản sao A có groupId', !!copyA.groupId);
  ok('bản sao B có groupId', !!copyB.groupId);
  ok('2 bản sao CÙNG 1 groupId (dính cụm với nhau)', copyA.groupId === copyB.groupId);
  ok('groupId MỚI, KHÔNG kế thừa id gốc (tránh gộp lầm vào cụm cũ)', copyA.groupId !== 'grp_old_1');
}

function testTwoDistinctGroupsInOneBatch() {
  console.log('\n[3] Lô có 2 cụm gốc KHÁC nhau → ra 2 groupId MỚI khác nhau (không gộp lẫn)');
  const a1 = makeShape('rect', { groupId: 'grp_A' });
  const a2 = makeShape('ellipse', { groupId: 'grp_A' });
  const b1 = makeShape('triangle', { groupId: 'grp_B' });
  const [ca1, ca2, cb1] = duplicateElementsPreservingGroups([a1, a2, b1]);
  ok('2 bản sao của cụm A vẫn chung nhau', ca1.groupId === ca2.groupId);
  ok('bản sao cụm B có groupId riêng, khác cụm A', !!cb1.groupId && cb1.groupId !== ca1.groupId);
}

function testMixedGroupedAndUngrouped() {
  console.log('\n[4] Lô lẫn: có cụm + có phần tử tự do → phần tử tự do KHÔNG bị gán nhầm groupId');
  const grouped = makeShape('rect', { groupId: 'grp_C' });
  const free = makeShape('ellipse');
  const [cg, cf] = duplicateElementsPreservingGroups([grouped, free]);
  ok('bản sao của phần tử trong cụm có groupId', !!cg.groupId);
  ok('bản sao của phần tử tự do vẫn tự do (không có groupId)', cf.groupId === undefined);
}

function testOffsetPassthrough() {
  console.log('\n[5] offset truyền đúng xuống duplicateElement (không đổi hành vi dời nhẹ 2%)');
  const a = makeShape('rect'); // frame x=20,y=20 (mặc định makeShape)
  const [withOffset] = duplicateElementsPreservingGroups([a], true);
  const [noOffset] = duplicateElementsPreservingGroups([a], false);
  ok('offset=true → x/y dời +2', withOffset.frame.x === 22 && withOffset.frame.y === 22);
  ok('offset=false → x/y giữ nguyên (dùng khi dán sang slide khác)', noOffset.frame.x === 20 && noOffset.frame.y === 20);
}

testNoGroup();
testSameGroupSharedNewId();
testTwoDistinctGroupsInOneBatch();
testMixedGroupedAndUngrouped();
testOffsetPassthrough();

console.log(`\n${pass} ok, ${fail} fail`);
if (fail > 0) process.exit(1);
