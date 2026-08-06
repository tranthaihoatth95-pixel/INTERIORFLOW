/**
 * lib/present-editor/boq-spec-extra.test.ts — kiểm JOIN quy cách/đơn vị (logic thuần). Chạy:
 *   node_modules/.bin/sucrase-node lib/present-editor/boq-spec-extra.test.ts
 */
import { boqUnitLabel, boqQuyCach, buildBoqSpecExtraMap, boqImageUrl } from './boq-spec-extra';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

console.log('\n[1] boqUnitLabel');
{
  ok('m2 -> m²', boqUnitLabel('m2') === 'm²');
  ok('cai -> cái', boqUnitLabel('cai') === 'cái');
  ok('đơn vị lạ giữ nguyên văn (không mất thông tin ATLAS)', boqUnitLabel('thung') === 'thung');
  ok('null -> —', boqUnitLabel(null) === '—');
  ok('rỗng -> —', boqUnitLabel('  ') === '—');
}

console.log('\n[2] boqQuyCach');
{
  ok('ưu tiên packagingSpec', boqQuyCach({ id: '1', packagingSpec: '4 viên/thùng = 1,44 m²', w: 600, d: 600 }) === '4 viên/thùng = 1,44 m²');
  ok('rơi về kích thước w×d×hUp khi thiếu packagingSpec', boqQuyCach({ id: '1', w: 600, d: 600, hUp: 18 }) === '600×600×18mm');
  ok('kích thước 1 chiều vẫn ra chuỗi', boqQuyCach({ id: '1', w: 600 }) === '600mm');
  ok('không có gì -> —', boqQuyCach({ id: '1' }) === '—');
  ok('bỏ qua chiều <=0', boqQuyCach({ id: '1', w: 600, d: 0, hUp: -5 }) === '600mm');
}

console.log('\n[3] buildBoqSpecExtraMap');
{
  const m = buildBoqSpecExtraMap([
    { id: 'spec-1', unit: 'm2', packagingSpec: '4 viên/thùng' },
    { id: 'spec-2', unit: null, w: 100, d: 200 },
  ]);
  ok('map có đủ 2 key', m.size === 2);
  ok('spec-1 đúng unit', m.get('spec-1')?.unit === 'm²');
  ok('spec-2 quyCach từ kích thước', m.get('spec-2')?.quyCach === '100×200mm');
}

/* ═══ [4] G-M3-11 (06/08) — cột Ảnh ═══ */
console.log('\n[4] boqImageUrl (cột Ảnh)');
{
  ok('có imageAssetId → URL /api/library/:id/file', boqImageUrl({ imageAssetId: 'asset-123' }) === '/api/library/asset-123/file');
  ok('không có ảnh → null (bảng hiện Ô TRỐNG, KHÔNG ảnh giả)', boqImageUrl({ imageAssetId: null }) === null);
  ok('chuỗi rỗng/khoảng trắng cũng là "chưa có ảnh"', boqImageUrl({ imageAssetId: '   ' }) === null);
  ok('undefined → null', boqImageUrl({}) === null);
  const m = buildBoqSpecExtraMap([{ id: 's', unit: 'cai', imageAssetId: 'a1' }]);
  ok('map mang theo imageUrl', m.get('s')?.imageUrl === '/api/library/a1/file');
}

console.log(`\nKẾT QUẢ: ${pass} pass, ${fail} fail`);
if (fail) process.exit(1);
