/**
 * lib/cad/auto-backup.test.ts — chạy: node_modules/.bin/sucrase-node lib/cad/auto-backup.test.ts
 *
 * Test cho B1 (30/07, docs/CAT-PHAM-VI-3-NGAY-2026-07-30.md §1): backup tự động giữ đúng 5
 * bản gần nhất. Chỉ test `namesToPrune()` — phần THUẦN, không cần mock IndexedDB/File System
 * Access API (backupSupported/chooseBackupFolder/startAutoBackup phụ thuộc browser API thật,
 * không test được trong sucrase-node — xem ghi chú "code-is-truth" ở STATUS.md, verify browser
 * thật đã làm riêng qua thao tác chọn thư mục + kiểm file trên đĩa).
 */
import assert from 'node:assert';
import { namesToPrune } from './auto-backup';

let passed = 0;
function test(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`  ok  ${name}`);
}

test('dưới 5 bản → không xoá gì', () => {
  const names = ['p_20260730-090000.ifpack', 'p_20260730-091000.ifpack'];
  assert.deepStrictEqual(namesToPrune(names, 5), []);
});

test('đúng 5 bản → không xoá gì', () => {
  const names = Array.from({ length: 5 }, (_, i) => `p_20260730-09000${i}.ifpack`);
  assert.deepStrictEqual(namesToPrune(names, 5), []);
});

test('6 bản → xoá đúng 1 bản CŨ NHẤT (timestamp nhỏ nhất)', () => {
  const names = [
    'p_20260730-093000.ifpack',
    'p_20260730-090000.ifpack', // cũ nhất
    'p_20260730-091000.ifpack',
    'p_20260730-092000.ifpack',
    'p_20260730-094000.ifpack',
    'p_20260730-095000.ifpack',
  ];
  assert.deepStrictEqual(namesToPrune(names, 5), ['p_20260730-090000.ifpack']);
});

test('8 bản → xoá đúng 3 bản cũ nhất, giữ lại 5 bản mới nhất', () => {
  const names = Array.from({ length: 8 }, (_, i) => `p_2026073${i}-090000.ifpack`);
  const pruned = namesToPrune(names, 5);
  assert.strictEqual(pruned.length, 3);
  assert.deepStrictEqual(pruned, names.slice(0, 3));
});

test('không mutate mảng gốc truyền vào', () => {
  const names = ['p_2.ifpack', 'p_1.ifpack', 'p_3.ifpack'];
  const original = [...names];
  namesToPrune(names, 1);
  assert.deepStrictEqual(names, original);
});

test('rỗng → không xoá gì (không throw)', () => {
  assert.deepStrictEqual(namesToPrune([], 5), []);
});

console.log(`\n${passed} pass / 0 fail`);
