/**
 * lib/present-editor/boq-overrides.test.ts — kiểm B5 live-link (logic thuần, không IDB). Chạy:
 *   node_modules/.bin/sucrase-node lib/present-editor/boq-overrides.test.ts
 */
import {
  applyBoqOverrides, totalWithOverrides, countOverrideStatus,
  setOverride, revertOverride, overrideKey, type BoqOverrideMap,
} from './boq-overrides';
import type { BoqRow } from '../boq/model';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

const rowA: BoqRow = { matId: 'm1', ten: 'Gỗ óc chó', ncc: 'An Cường', ma: 'AC-1', m2: 42.5, donGia: 1_240_000, haoHutPhanTram: 5, thanhTien: 55_335_000, entityIds: ['h1'] };
const rowB: BoqRow = { matId: 'm2', ten: 'Sàn gỗ sồi', ncc: 'An Cường', ma: 'AC-2', m2: 24.6, donGia: 1_250_000, haoHutPhanTram: 5, thanhTien: 32_287_500, entityIds: ['h2'] };

console.log('\n[1] dòng KHÔNG override chạy qua nguyên vẹn (giữ identity)');
{
  const out = applyBoqOverrides([rowA, rowB], {});
  ok('rowA giữ nguyên reference', out[0] === rowA);
  ok('rowB giữ nguyên reference', out[1] === rowB);
}

console.log('\n[2] override m2 — giữ giá trị tay, tính lại thanhTien, gắn machineValue LIVE');
{
  const overrides: BoqOverrideMap = { [overrideKey('m1', 'm2')]: { matId: 'm1', field: 'm2', value: 40, at: 1000 } };
  const out = applyBoqOverrides([rowA, rowB], overrides);
  ok('m2 giữ 40 (không phải 42.5 của máy)', out[0].m2 === 40);
  ok('thanhTien tính lại từ 40: 40×1.05×1.240.000=52.080.000', out[0].thanhTien === 52_080_000);
  ok('m2Override.machineValue = 42.5 (số máy hiện tại)', out[0].m2Override?.machineValue === 42.5);
  ok('m2Override.value = 40', out[0].m2Override?.value === 40);
  ok('rowB không đụng (giữ identity)', out[1] === rowB);
}

console.log('\n[3] tổng + đếm sửa tay');
{
  const overrides: BoqOverrideMap = { [overrideKey('m1', 'm2')]: { matId: 'm1', field: 'm2', value: 40, at: 1000 } };
  const out = applyBoqOverrides([rowA, rowB], overrides);
  ok('total = 52.080.000 + 32.287.500', totalWithOverrides(out) === 52_080_000 + 32_287_500);
  const counts = countOverrideStatus(out);
  ok('đã sửa tay 1', counts.handEdited === 1);
  ok('lấy từ mô hình 1', counts.fromModel === 1);
}

console.log('\n[4] setOverride/revertOverride — hàm map thuần');
{
  let map: BoqOverrideMap = {};
  map = setOverride(map, 'm1', 'm2', 40, 1234);
  ok('có override sau khi set', overrideKey('m1', 'm2') in map);
  ok('at = 1234 (do caller truyền, hàm không tự đọc giờ)', map[overrideKey('m1', 'm2')].at === 1234);
  map = revertOverride(map, 'm1', 'm2');
  ok('mất override sau revert', !(overrideKey('m1', 'm2') in map));
  const back = setOverride({ [overrideKey('m1', 'm2')]: { matId: 'm1', field: 'm2', value: 1, at: 0 } }, 'm1', 'm2', NaN, 999);
  ok('setOverride với NaN = revert (không lưu giá trị hỏng)', !(overrideKey('m1', 'm2') in back));
}

console.log('\n[5] override donGia + cả hai field cùng dòng');
{
  const overrides: BoqOverrideMap = {
    [overrideKey('m1', 'm2')]: { matId: 'm1', field: 'm2', value: 40, at: 1 },
    [overrideKey('m1', 'donGia')]: { matId: 'm1', field: 'donGia', value: 1_300_000, at: 2 },
  };
  const out = applyBoqOverrides([rowA], overrides);
  ok('thanhTien = 40×1.05×1.300.000 = 54.600.000', out[0].thanhTien === 54_600_000);
  ok('cả 2 override đều có mặt', !!out[0].m2Override && !!out[0].donGiaOverride);
}

console.log(`\nKẾT QUẢ: ${pass} pass, ${fail} fail`);
if (fail) process.exit(1);
