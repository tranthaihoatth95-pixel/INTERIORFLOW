/**
 * lib/lark/atlas-material-map.test.ts — chạy: node_modules/.bin/sucrase-node lib/lark/atlas-material-map.test.ts
 * Test THUẦN cho mapAtlasRecordToProductSpec() — fixture giả lập (bảng ATLAS thật CHƯA nối được,
 * xem ghi chú ATLAS_FIELD_NAMES trong file nguồn). Không test tên cột "đúng thật" (không thể,
 * chưa xác minh) — chỉ test hàm ÁNH XẠ hoạt động đúng LOGIC khi field khớp/thiếu/rỗng.
 */
import { mapAtlasRecordToProductSpec, ATLAS_FIELD_NAMES } from './atlas-material-map';
import type { LarkRecord } from '../integrations/providers/lark';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

const NOW = new Date(2026, 6, 30, 20, 0, 0);

function testFullRecord() {
  console.log('\n[1] Record đủ field → map đúng toàn bộ');
  const rec: LarkRecord = {
    record_id: 'recAbc123',
    fields: {
      [ATLAS_FIELD_NAMES.name]: 'Gạch Đồng Tâm 600×600',
      [ATLAS_FIELD_NAMES.vendor]: 'Đồng Tâm',
      [ATLAS_FIELD_NAMES.sku]: 'DT-600-01',
      [ATLAS_FIELD_NAMES.unit]: 'm2',
      [ATLAS_FIELD_NAMES.priceVnd]: 285000,
      [ATLAS_FIELD_NAMES.wastagePercent]: 5,
      [ATLAS_FIELD_NAMES.packagingSpec]: '4 viên/thùng = 1,44 m²',
      [ATLAS_FIELD_NAMES.altSku]: 'DT-600-01B',
      [ATLAS_FIELD_NAMES.styleTags]: 'hiện đại, tối giản',
    },
  };
  const mapped = mapAtlasRecordToProductSpec(rec, NOW);
  ok('kind luôn material', mapped.kind === 'material');
  ok('name đúng', mapped.name === 'Gạch Đồng Tâm 600×600');
  ok('vendor đúng', mapped.vendor === 'Đồng Tâm');
  ok('sku đúng', mapped.sku === 'DT-600-01');
  ok('unit đúng', mapped.unit === 'm2');
  ok('priceVnd là số đúng', mapped.priceVnd === 285000);
  ok('wastagePercent đúng', mapped.wastagePercent === 5);
  ok('packagingSpec đúng', mapped.packagingSpec === '4 viên/thùng = 1,44 m²');
  ok('altSku đúng', mapped.altSku === 'DT-600-01B');
  ok('styleTags → JSON array 2 phần tử', JSON.parse(mapped.styleTags).length === 2 && JSON.parse(mapped.styleTags)[0] === 'hiện đại');
  ok('larkRecordId khớp record_id', mapped.larkRecordId === 'recAbc123');
  ok('raw giữ NGUYÊN toàn bộ field gốc (JSON)', JSON.parse(mapped.raw)[ATLAS_FIELD_NAMES.name] === 'Gạch Đồng Tâm 600×600');
  ok('syncedAt khớp mốc truyền vào', mapped.syncedAt.getTime() === NOW.getTime());
}

function testMissingFields() {
  console.log('\n[2] Record thiếu field → null/rỗng, KHÔNG bịa giá trị mặc định');
  const rec: LarkRecord = { record_id: 'recEmpty', fields: { [ATLAS_FIELD_NAMES.name]: 'Vật liệu chưa đủ thông tin' } };
  const mapped = mapAtlasRecordToProductSpec(rec, NOW);
  ok('name vẫn đọc được', mapped.name === 'Vật liệu chưa đủ thông tin');
  ok('vendor thiếu → null (không phải chuỗi rỗng lẫn lộn với "cố tình để trống")', mapped.vendor === null);
  ok('priceVnd thiếu → null — BOQ phải hiện "chưa có giá", không đoán số', mapped.priceVnd === null);
  ok('wastagePercent thiếu → null', mapped.wastagePercent === null);
  ok('packagingSpec thiếu → null', mapped.packagingSpec === null);
  ok('altSku thiếu → null', mapped.altSku === null);
  ok('styleTags thiếu → JSON mảng rỗng, không throw', mapped.styleTags === '[]');
}

function testPriceAsFormattedString() {
  console.log('\n[3] Giá tới dạng chuỗi có ký tự tiền tệ (Bitable Currency field đôi khi trả string)');
  const rec: LarkRecord = {
    record_id: 'recPriceStr',
    fields: { [ATLAS_FIELD_NAMES.name]: 'X', [ATLAS_FIELD_NAMES.priceVnd]: '285,000' },
  };
  const mapped = mapAtlasRecordToProductSpec(rec, NOW);
  ok('numberOf() bóc được số từ chuỗi có dấu phẩy', mapped.priceVnd === 285000);
}

function testStyleTagsMultipleSeparators() {
  console.log('\n[4] styleTags — nhiều kiểu dấu phân cách (Select đa giá trị có thể trả nhiều dạng)');
  const rec: LarkRecord = {
    record_id: 'recTags',
    fields: { [ATLAS_FIELD_NAMES.name]: 'X', [ATLAS_FIELD_NAMES.styleTags]: 'a, b | c·d' },
  };
  const mapped = mapAtlasRecordToProductSpec(rec, NOW);
  const tags = JSON.parse(mapped.styleTags);
  ok('tách đúng 4 tag qua 3 kiểu dấu phân cách', tags.length === 4 && tags.includes('a') && tags.includes('d'));
}

testFullRecord();
testMissingFields();
testPriceAsFormattedString();
testStyleTagsMultipleSeparators();

console.log(`\n${pass} ok, ${fail} fail`);
if (fail > 0) process.exit(1);
