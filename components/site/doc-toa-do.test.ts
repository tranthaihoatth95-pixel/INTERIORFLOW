/** components/site/doc-toa-do.test.ts — đọc toạ độ: hiểu thì hiểu, không hiểu thì NÓI, cấm đoán. */
import { docToaDo, hienToaDo } from './doc-toa-do';

let fail = 0;
function ok(msg: string, cond: unknown) {
  if (cond) console.log(`  ok  - ${msg}`);
  else {
    console.log(`  FAIL - ${msg}`);
    fail++;
  }
}

console.log('\n[1] DẠNG DÂN NGHỀ DÁN VÀO');
const a = docToaDo('10.7769, 106.7009');
ok('cặp có dấu phẩy', a.viDo === 10.7769 && a.kinhDo === 106.7009);
ok('cặp cách nhau bằng khoảng trắng', docToaDo('10.7769 106.7009').viDo === 10.7769);
ok('có khoảng trắng thừa hai đầu', docToaDo('   21.0278,105.8342  ').kinhDo === 105.8342);
ok('toạ độ ÂM (nam bán cầu / tây bán cầu)', docToaDo('-33.8688, -70.6693').viDo === -33.8688);

console.log('\n[2] KHÔNG HIỂU THÌ TỪ CHỐI — im lặng đoán sai là sai cả hồ sơ');
ok('rỗng → "trong"', docToaDo('   ').loi === 'trong');
ok('một số → "khong-hieu"', docToaDo('10.7769').loi === 'khong-hieu');
ok('chữ thường → "khong-hieu"', docToaDo('Sài Gòn').loi === 'khong-hieu');
ok('vĩ độ > 90 → "ngoai-pham-vi"', docToaDo('120, 10').loi === 'ngoai-pham-vi');
ok('kinh độ > 180 → "ngoai-pham-vi"', docToaDo('10, 200').loi === 'ngoai-pham-vi');
ok('độ-phút-giây → báo đúng dạng, KHÔNG đọc bừa', docToaDo(`10°46'37"N 106°42'3"E`).loi === 'dang-dms');
ok('DMS thì không trả ra số nào', docToaDo(`10°46'37"N`).viDo === undefined);

console.log('\n[3] HIỆN LẠI CHO NGƯỜI ĐỌC');
ok('4 số lẻ', hienToaDo(10.77690123, 106.70091) === '10.7769, 106.7009');
ok('thiếu thì trả rỗng, không hiện "undefined"', hienToaDo(undefined, 106) === '');

console.log(fail === 0 ? '\n✅ doc-toa-do: tất cả đạt' : `\n❌ doc-toa-do: ${fail} lỗi`);
if (fail > 0) process.exit(1);
