/**
 * lib/colors/build.test.ts — ghép cột → ColorSource + đoán cột + chuẩn hoá hex.
 * Chạy: node_modules/.bin/sucrase-node lib/colors/build.test.ts
 */
import {
  guessColorMapping, headerSignature, normalizeHex, buildColorSource,
  EMPTY_COLOR_MAPPING, type ColorColumnMapping,
} from './build';
import { rgbToLab, hexToRgb } from '../gu/color-psychology';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

console.log('\n[1] normalizeHex');
{
  ok('#A1B2C3 → #a1b2c3', normalizeHex('#A1B2C3') === '#a1b2c3');
  ok('không dấu # vẫn nhận', normalizeHex('a1b2c3') === '#a1b2c3');
  ok('3 ký tự nở ra 6', normalizeHex('#abc') === '#aabbcc');
  ok('có khoảng trắng thừa vẫn nhận', normalizeHex('  #FFF  ') === '#ffffff');
  ok('rác → null', normalizeHex('xanh biển') === null);
  ok('rỗng → null', normalizeHex('') === null);
  ok('KHÔNG tự đoán rgb() (cố ý) → null', normalizeHex('rgb(255,0,0)') === null);
}

console.log('\n[2] guessColorMapping — tiêu đề VI có dấu / EN / lẫn lộn');
{
  const m = guessColorMapping(['Tên màu', 'Mã màu', 'Hex', 'Hãng', 'Ghi chú']);
  ok('VI có dấu: đủ 5 cột đúng vị trí',
    m.name === 0 && m.code === 1 && m.hex === 2 && m.brand === 3 && m.note === 4);

  const e = guessColorMapping(['Colour Name', 'Code', 'HEX', 'Brand', 'Note']);
  ok('EN: đủ 5 cột đúng vị trí',
    e.name === 0 && e.code === 1 && e.hex === 2 && e.brand === 3 && e.note === 4);

  // Bẫy thật: "Mã màu" chứa "mau" (từ khoá của name) và "ma" (từ khoá của code). Vòng khớp
  // NGUYÊN VĂN phải giành đúng chỗ trước khi vòng khớp-chứa nới lỏng.
  const t = guessColorMapping(['Mã màu', 'Tên màu', 'Hex']);
  ok('không tranh cột: "Mã màu"→code, "Tên màu"→name', t.code === 0 && t.name === 1 && t.hex === 2);

  const none = guessColorMapping(['Cột A', 'Cột B']);
  ok('không tiêu đề nào khớp → toàn null', JSON.stringify(none) === JSON.stringify(EMPTY_COLOR_MAPPING));

  ok('một cột chỉ gán cho MỘT field', (() => {
    const g = guessColorMapping(['Hex', 'Hex']);
    return g.hex === 0 && Object.values(g).filter((v) => v === 0).length === 1;
  })());
}

console.log('\n[3] headerSignature — nhớ mapping theo cùng bảng NCC');
{
  ok('khác hoa/thường + dấu cách → CÙNG chữ ký',
    headerSignature(['Tên màu', ' HEX ']) === headerSignature(['tên  màu', 'hex']));
  ok('khác cột → khác chữ ký', headerSignature(['Tên màu']) !== headerSignature(['Mã màu']));
}

console.log('\n[4] buildColorSource — dòng tốt vào, dòng hỏng báo ĐÚNG số dòng Excel');
{
  const headers = ['Tên màu', 'Mã màu', 'Hex', 'Hãng', 'Ghi chú'];
  const rows = [
    ['Trắng ngà', 'S-01', '#f4f1ea', 'Nội bộ', 'tường'], // dòng 2 — tốt
    ['Xám khói', 'S-02', 'ffffff', '', ''],              // dòng 3 — tốt, hex không dấu #
    ['Hỏng', 'S-03', 'không-phải-hex', '', ''],          // dòng 4 — hex hỏng
    ['', '', '', '', ''],                                 // dòng 5 — trống hoàn toàn, BỎ IM LẶNG
    ['', '', '#123456', '', ''],                          // dòng 6 — thiếu cả tên lẫn mã
    ['Thiếu hex', 'S-05', '', '', ''],                    // dòng 7 — thiếu hex
    ['', 'S-06', '#0000ff', '', ''],                      // dòng 8 — chỉ có mã → mã làm tên
  ];
  const mapping = guessColorMapping(headers);
  const { source, errors } = buildColorSource({
    headers, rows, mapping, id: 'src_1', name: 'Bảng thử', origin: 'user-csv', scope: 'studio', now: 111,
  });

  ok('3 màu hợp lệ vào kho', source.colors.length === 3);
  ok('3 dòng lỗi được báo', errors.length === 3);
  ok('số dòng đúng như người dùng thấy trong Excel (4, 6, 7)',
    JSON.stringify(errors.map((e) => e.row)) === '[4,6,7]');
  ok('dòng trống hoàn toàn KHÔNG bị tính là lỗi', !errors.some((e) => e.row === 5));
  ok('hex chuẩn hoá về #rrggbb thường hoá', source.colors[1].hex === '#ffffff');
  ok('chỉ có mã thì lấy mã làm tên', source.colors[2].name === 'S-06' && source.colors[2].code === 'S-06');
  ok('LAB được LƯU, không phải chỉ hex', (() => {
    const want = rgbToLab(hexToRgb('#f4f1ea')!);
    const got = source.colors[0].lab;
    return Math.abs(got.L - want.L) < 1e-9 && Math.abs(got.a - want.a) < 1e-9 && Math.abs(got.b - want.b) < 1e-9;
  })());
  ok('brand/note rỗng → undefined chứ không phải chuỗi rỗng',
    source.colors[1].brand === undefined && source.colors[1].note === undefined);
  ok('`now` tiêm được (hàm tất định, test không phụ thuộc đồng hồ)', source.updatedAt === 111);
  ok('origin/scope giữ đúng', source.origin === 'user-csv' && source.scope === 'studio');
}

console.log('\n[5] buildColorSource — mapping thiếu cột hex ⇒ MỌI dòng báo lỗi, không im lặng nuốt');
{
  const mapping: ColorColumnMapping = { ...EMPTY_COLOR_MAPPING, name: 0 };
  const { source, errors } = buildColorSource({
    headers: ['Tên'], rows: [['Đỏ'], ['Xanh']], mapping,
    id: 's', name: 'x', origin: 'user-paste', scope: 'studio', now: 1,
  });
  ok('0 màu vào kho', source.colors.length === 0);
  ok('2 dòng đều báo thiếu hex', errors.length === 2 && errors.every((e) => e.reason.includes('hex')));
}

console.log(`\n${pass} ok, ${fail} fail`);
if (fail > 0) process.exit(1);
