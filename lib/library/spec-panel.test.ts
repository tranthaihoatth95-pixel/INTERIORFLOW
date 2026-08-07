/** Test `spec-panel.ts` — chạy: npx tsx lib/library/spec-panel.test.ts
 *  Import TƯƠNG ĐỐI (không `@/…`) theo đúng quy ước các test chạy dưới sucrase-node. */
import { buildSpecRows, formatVnd, formatUnitScalar, matchSpec, missingSpecCount } from './spec-panel';

let pass = 0;
let fail = 0;
function ok(name: string, cond: boolean) {
  if (cond) { pass++; console.log('  ok  -', name); }
  else { fail++; console.log('  FAIL-', name); }
}
function eq(name: string, a: unknown, b: unknown) {
  ok(`${name} (${JSON.stringify(a)} = ${JSON.stringify(b)})`, JSON.stringify(a) === JSON.stringify(b));
}

console.log('formatVnd — nhóm 3 chữ số bằng DẤU CÁCH đúng mock');
eq('1480000 -> "1 480 000"', formatVnd(1480000), '1 480 000');
eq('0 -> "0"', formatVnd(0), '0');
eq('999 không tách', formatVnd(999), '999');
eq('1000 tách 1 lần', formatVnd(1000), '1 000');
eq('làm tròn', formatVnd(1480000.6), '1 480 001');
eq('âm giữ dấu', formatVnd(-1000), '-1 000');

console.log('formatUnitScalar — 2 chữ số thập phân');
eq('0.42', formatUnitScalar(0.42), '0.42');
eq('0 -> 0.00', formatUnitScalar(0), '0.00');
eq('1 -> 1.00', formatUnitScalar(1), '1.00');

console.log('matchSpec — khớp theo MÃ, chuẩn hoá hoa/thường + khoảng trắng');
const SPECS = [{ sku: 'OAK-114' }, { sku: ' wal-22 ' }, { sku: null }];
eq('khớp đúng mã', matchSpec('OAK-114', SPECS), { sku: 'OAK-114' });
eq('khác hoa/thường vẫn khớp', matchSpec('oak-114', SPECS), { sku: 'OAK-114' });
eq('kho có khoảng trắng thừa vẫn khớp', matchSpec('WAL-22', SPECS), { sku: ' wal-22 ' });
ok('mã rỗng KHÔNG khớp bừa vào spec sku rỗng/null', matchSpec('   ', SPECS) === undefined);
ok('không có thì trả undefined', matchSpec('KHONG-CO', SPECS) === undefined);

console.log('buildSpecRows — ĐỦ 6 DÒNG kể cả khi thiếu nguồn (ô trống là bằng chứng còn việc)');
const bare = buildSpecRows({ code: 'OAK-114' });
eq('luôn 6 dòng', bare.length, 6);
eq('Mã luôn có (khoá của chính món)', bare[1].value, 'OAK-114');
eq('thiếu nguồn -> 5 dòng trống', missingSpecCount(bare), 5);
ok('KHÔNG bịa giá', bare[3].value === null);
ok('KHÔNG bịa hãng', bare[0].value === null);
eq('chưa biết đơn vị thì nhãn giá là "Giá" trơn', bare[3].label[0], 'Giá');

console.log('buildSpecRows — có nguồn thật thì hiện đúng, nhãn giá theo ĐƠN VỊ');
const full = buildSpecRows(
  { code: 'OAK-114' },
  { supplier: 'An Cường', unit: 'mét vuông', priceVnd: 1480000 },
  { roughness: 0.42, gloss: 0.18 },
);
eq('hãng', full[0].value, 'An Cường');
eq('đơn vị', full[2].value, 'mét vuông');
eq('nhãn giá nói rõ đơn vị', full[3].label[0], 'Giá mỗi mét vuông');
eq('giá định dạng mock', full[3].value, '1 480 000');
eq('nhám', full[4].value, '0.42');
eq('bóng', full[5].value, '0.18');
eq('thanh mức nhám', full[4].bar, 0.42);
eq('không còn dòng trống', missingSpecCount(full), 0);

console.log('buildSpecRows — giá 0 là GIÁ THẬT, không phải "thiếu"');
const zero = buildSpecRows({ code: 'X' }, { priceVnd: 0, unit: 'cái' });
eq('0 đ hiện ra, không nuốt thành ô trống', zero[3].value, '0');

console.log('buildSpecRows — dữ liệu rác không lọt qua');
const junk = buildSpecRows({ code: 'X' }, { supplier: '   ', unit: '  ', priceVnd: Number.NaN });
ok('hãng toàn khoảng trắng = chưa có', junk[0].value === null);
ok('đơn vị toàn khoảng trắng = chưa có', junk[2].value === null);
ok('NaN không hiện thành "NaN"', junk[3].value === null);

console.log(`\n${pass} pass, ${fail} fail`);
if (fail) process.exit(1);
