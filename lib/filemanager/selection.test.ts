// lib/filemanager/selection.test.ts — chạy: `npx tsx lib/filemanager/selection.test.ts`
// (cũng lọt lưới `npm test` qua sucrase-node — import TƯƠNG ĐỐI, không alias `@/`,
// bài học boq-group.test.ts 04/08: alias làm test "pass" mà chưa từng chạy).

import assert from 'node:assert';
import { EMPTY_SELECTION, clickSelect, moveFocus, contextSelect, pruneSelection, type SelectionState } from './selection';

const ids = ['a', 'b', 'c', 'd', 'e'];
let passed = 0;
function ca(name: string, fn: () => void) {
  fn();
  passed += 1;
  console.log(`  ok - ${name}`);
}
function sel(s: SelectionState): string {
  return `${s.selectedIds.join(',')}|a=${s.anchorId}|f=${s.focusId}`;
}

// ── click thường ───────────────────────────────────────────────────────────────
ca('click thường: chọn đúng 1, anchor+focus theo', () => {
  assert.equal(sel(clickSelect(ids, EMPTY_SELECTION, 'c')), 'c|a=c|f=c');
});
ca('click id không có trong danh sách: giữ nguyên state', () => {
  const s = clickSelect(ids, EMPTY_SELECTION, 'z');
  assert.equal(s, EMPTY_SELECTION);
});

// ── shift dải ─────────────────────────────────────────────────────────────────
ca('shift-click xuôi: dải b→d theo thứ tự danh sách', () => {
  const s0 = clickSelect(ids, EMPTY_SELECTION, 'b');
  assert.equal(sel(clickSelect(ids, s0, 'd', { shift: true })), 'b,c,d|a=b|f=d');
});
ca('shift-click ngược: dải d→b vẫn ra b,c,d (anchor giữ)', () => {
  const s0 = clickSelect(ids, EMPTY_SELECTION, 'd');
  assert.equal(sel(clickSelect(ids, s0, 'b', { shift: true })), 'b,c,d|a=d|f=b');
});
ca('shift lần 2 vẫn tính từ anchor cũ (đúng Finder)', () => {
  let s = clickSelect(ids, EMPTY_SELECTION, 'c');
  s = clickSelect(ids, s, 'e', { shift: true }); // c,d,e
  s = clickSelect(ids, s, 'a', { shift: true }); // đổi chiều: a,b,c
  assert.equal(sel(s), 'a,b,c|a=c|f=a');
});
ca('shift khi chưa từng click (anchor null): chỉ chọn mục bấm', () => {
  assert.equal(sel(clickSelect(ids, EMPTY_SELECTION, 'c', { shift: true })), 'c|a=c|f=c');
});
ca('shift khi anchor đã bị lọc khỏi danh sách: mục bấm thành mốc mới', () => {
  const s0: SelectionState = { selectedIds: ['x'], anchorId: 'x', focusId: 'x' };
  assert.equal(sel(clickSelect(ids, s0, 'b', { shift: true })), 'b|a=b|f=b');
});
ca('shift lên chính anchor: dải 1 mục', () => {
  const s0 = clickSelect(ids, EMPTY_SELECTION, 'c');
  assert.equal(sel(clickSelect(ids, s0, 'c', { shift: true })), 'c|a=c|f=c');
});

// ── ⌘ toggle ──────────────────────────────────────────────────────────────────
ca('⌘-click thêm mục mới vào CUỐI tập (giữ thứ tự chọn)', () => {
  let s = clickSelect(ids, EMPTY_SELECTION, 'd');
  s = clickSelect(ids, s, 'a', { toggle: true });
  assert.equal(sel(s), 'd,a|a=a|f=a');
});
ca('⌘-click lên mục đã chọn: bớt nó ra', () => {
  let s = clickSelect(ids, EMPTY_SELECTION, 'd');
  s = clickSelect(ids, s, 'a', { toggle: true });
  s = clickSelect(ids, s, 'd', { toggle: true });
  assert.equal(sel(s), 'a|a=d|f=d');
});
ca('⌘-click bớt mục CUỐI CÙNG: tập rỗng nhưng anchor/focus còn (Finder cũng vậy)', () => {
  let s = clickSelect(ids, EMPTY_SELECTION, 'b');
  s = clickSelect(ids, s, 'b', { toggle: true });
  assert.equal(sel(s), '|a=b|f=b');
});
ca('⌘ rồi shift: dải tính từ anchor ⌘ vừa đặt', () => {
  let s = clickSelect(ids, EMPTY_SELECTION, 'a');
  s = clickSelect(ids, s, 'c', { toggle: true }); // anchor=c
  s = clickSelect(ids, s, 'e', { shift: true });
  assert.equal(sel(s), 'c,d,e|a=c|f=e');
});

// ── mũi tên + biên ────────────────────────────────────────────────────────────
ca('mũi tên xuống: focus dời 1, chọn đúng 1 mục mới', () => {
  const s0 = clickSelect(ids, EMPTY_SELECTION, 'b');
  assert.equal(sel(moveFocus(ids, s0, 1)), 'c|a=c|f=c');
});
ca('mũi tên ở MÉP CUỐI: kẹp lại, không vòng', () => {
  const s0 = clickSelect(ids, EMPTY_SELECTION, 'e');
  assert.equal(sel(moveFocus(ids, s0, 1)), 'e|a=e|f=e');
});
ca('mũi tên ở MÉP ĐẦU: kẹp lại, không vòng', () => {
  const s0 = clickSelect(ids, EMPTY_SELECTION, 'a');
  assert.equal(sel(moveFocus(ids, s0, -1)), 'a|a=a|f=a');
});
ca('chưa có focus: xuống vào mục ĐẦU, lên vào mục CUỐI', () => {
  assert.equal(sel(moveFocus(ids, EMPTY_SELECTION, 1)), 'a|a=a|f=a');
  assert.equal(sel(moveFocus(ids, EMPTY_SELECTION, -1)), 'e|a=e|f=e');
});
ca('focus cũ đã bị lọc mất: coi như chưa có focus', () => {
  const s0: SelectionState = { selectedIds: ['x'], anchorId: 'x', focusId: 'x' };
  assert.equal(sel(moveFocus(ids, s0, 1)), 'a|a=a|f=a');
});
ca('shift+mũi tên: nới dải từ anchor, anchor đứng yên', () => {
  let s = clickSelect(ids, EMPTY_SELECTION, 'b');
  s = moveFocus(ids, s, 1, true); // b,c
  s = moveFocus(ids, s, 1, true); // b,c,d
  assert.equal(sel(s), 'b,c,d|a=b|f=d');
});
ca('shift+mũi tên qua bên kia anchor: dải đổi chiều', () => {
  let s = clickSelect(ids, EMPTY_SELECTION, 'c');
  s = moveFocus(ids, s, -1, true); // b,c
  s = moveFocus(ids, s, -1, true); // a,b,c
  assert.equal(sel(s), 'a,b,c|a=c|f=a');
});
ca('shift+mũi tên ở mép: dải giữ nguyên, không vỡ', () => {
  let s = clickSelect(ids, EMPTY_SELECTION, 'd');
  s = moveFocus(ids, s, 1, true); // d,e
  s = moveFocus(ids, s, 1, true); // vẫn d,e (kẹp)
  assert.equal(sel(s), 'd,e|a=d|f=e');
});
ca('danh sách rỗng: mũi tên trả EMPTY, không crash', () => {
  assert.equal(moveFocus([], clickSelect(ids, EMPTY_SELECTION, 'a'), 1), EMPTY_SELECTION);
});

// ── chuột phải ────────────────────────────────────────────────────────────────
ca('chuột phải lên mục CHƯA chọn: chọn lại đúng 1 mục đó', () => {
  let s = clickSelect(ids, EMPTY_SELECTION, 'a');
  s = clickSelect(ids, s, 'c', { shift: true }); // a,b,c
  assert.equal(sel(contextSelect(ids, s, 'e')), 'e|a=e|f=e');
});
ca('chuột phải lên mục ĐÃ chọn: giữ nguyên cả cụm', () => {
  let s = clickSelect(ids, EMPTY_SELECTION, 'a');
  s = clickSelect(ids, s, 'c', { shift: true }); // a,b,c
  assert.equal(sel(contextSelect(ids, s, 'b')), 'a,b,c|a=a|f=b');
});

// ── prune ─────────────────────────────────────────────────────────────────────
ca('prune: id biến mất khỏi danh sách bị gạt, anchor/focus mất theo', () => {
  const s0: SelectionState = { selectedIds: ['b', 'x', 'd'], anchorId: 'x', focusId: 'x' };
  assert.equal(sel(pruneSelection(ids, s0)), 'b,d|a=null|f=null');
});
ca('prune không đổi gì: trả NGUYÊN tham chiếu (chống re-render thừa)', () => {
  const s0 = clickSelect(ids, EMPTY_SELECTION, 'b');
  assert.equal(pruneSelection(ids, s0), s0);
});

console.log(`selection.test.ts — ${passed} ca pass`);
