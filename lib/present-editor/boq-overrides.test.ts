/**
 * lib/present-editor/boq-overrides.test.ts — kiểm B5 live-link (logic thuần, không IDB). Chạy:
 *   node_modules/.bin/sucrase-node lib/present-editor/boq-overrides.test.ts
 */
import {
  applyBoqOverrides, totalWithOverrides, countOverrideStatus,
  setOverride, revertOverride, overrideKey, normalizePersistedOverride,
  type BoqOverrideMap, type BoqOverride,
} from './boq-overrides';
import type { BoqRow } from '../boq/model';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

const rowA: BoqRow = { specId: 'm1', matId: 'm1', ten: 'Gỗ óc chó', ncc: 'An Cường', ma: 'AC-1', m2: 42.5, qty: 42.5, unit: 'm2', kind: 'area', donGia: 1_240_000, haoHutPhanTram: 5, thanhTien: 55_335_000, entityIds: ['h1'] };
const rowB: BoqRow = { specId: 'm2', matId: 'm2', ten: 'Sàn gỗ sồi', ncc: 'An Cường', ma: 'AC-2', m2: 24.6, qty: 24.6, unit: 'm2', kind: 'area', donGia: 1_250_000, haoHutPhanTram: 5, thanhTien: 32_287_500, entityIds: ['h2'] };

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

/* ═══ [W0.2 19/08] compat window specId/matId — không orphan override cũ ═══ */
console.log('\n[6] normalizePersistedOverride — bản IDB CŨ ({matId}) và MỚI ({specId}) đều về đủ 2 field');
{
  const legacy = normalizePersistedOverride({ matId: 'm1', field: 'm2', value: 40, at: 1000 });
  ok('bản cũ: specId được điền = matId', legacy?.specId === 'm1' && legacy?.matId === 'm1');
  ok('bản cũ: giữ nguyên field/value/at', legacy?.field === 'm2' && legacy?.value === 40 && legacy?.at === 1000);

  const modern = normalizePersistedOverride({ specId: 'm9', matId: 'm9', field: 'donGia', value: 5, at: 2 });
  ok('bản mới: đi qua nguyên vẹn', modern?.specId === 'm9' && modern?.matId === 'm9' && modern?.value === 5);

  const onlySpec = normalizePersistedOverride({ specId: 'm7', field: 'm2', value: 1, at: 0 });
  ok('bản chỉ-specId: matId được điền ngược', onlySpec?.matId === 'm7');

  // idempotent — normalize(normalize(x)) ≡ normalize(x)
  const twice = normalizePersistedOverride(legacy);
  ok('idempotent: normalize 2 lần không đổi', JSON.stringify(twice) === JSON.stringify(legacy));

  // bản hỏng → null từng-dòng, không ném
  ok('thiếu id → null', normalizePersistedOverride({ field: 'm2', value: 1, at: 0 }) === null);
  ok('field lạ → null', normalizePersistedOverride({ matId: 'x', field: 'ten', value: 1, at: 0 }) === null);
  ok('value NaN → null', normalizePersistedOverride({ matId: 'x', field: 'm2', value: NaN, at: 0 }) === null);
  ok('không phải object → null', normalizePersistedOverride('rác') === null);
}

console.log('\n[7] override lưu bằng KEY CŨ (trước 19/08) vẫn áp đúng row sau W0.2');
{
  // mô phỏng đúng đường load của boq-overrides-persist: items cũ → normalize → map theo overrideKey
  const itemsCu = [{ matId: 'm1', field: 'm2' as const, value: 40, at: 1000 }];
  const map: BoqOverrideMap = {};
  for (const it of itemsCu) {
    const ov = normalizePersistedOverride(it);
    if (ov) map[overrideKey(ov.matId, ov.field)] = ov;
  }
  const out = applyBoqOverrides([rowA, rowB], map); // rowA có specId 'm1' (fixture đã mang cả 2 field)
  ok('row specId=m1 nhận override cũ (m2=40)', out[0].m2 === 40 && out[0].m2Override?.machineValue === 42.5);
  ok('rowB không đụng', out[1] === rowB);
  // chạy lại lần 2 (rerun) — cùng kết quả, không tích luỹ
  const out2 = applyBoqOverrides([rowA, rowB], map);
  ok('rerun idempotent', out2[0].m2 === 40 && out2[0].thanhTien === out[0].thanhTien);
}

console.log('\n[8] setOverride ghi CẢ HAI field (compat window) — bản cũ vẫn đọc được bản mới');
{
  const map = setOverride({}, 'm1', 'donGia', 999, 7);
  const ov: BoqOverride = map[overrideKey('m1', 'donGia')];
  ok('specId và matId cùng giá trị', ov.specId === 'm1' && ov.matId === 'm1');
}

console.log(`\nKẾT QUẢ: ${pass} pass, ${fail} fail`);
if (fail) process.exit(1);
