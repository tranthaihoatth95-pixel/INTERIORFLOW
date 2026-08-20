/**
 * lib/ui/vat-lieu.test.ts — khoá luật VẬT LIỆU THEO CHỨC NĂNG.
 * Chạy: `node_modules/.bin/sucrase-node lib/ui/vat-lieu.test.ts`
 *
 * Mỗi mục là một cách hỏng đã lường trước:
 *  1. Vai trò "đọc lâu / nhiều núm / dữ liệu kỹ thuật" KHÔNG BAO GIỜ ra kính — đây là ca
 *     chính, đúng thứ luật sinh ra để cấm.
 *  2. Không khai vai trò ⇒ ĐẶC, không phải kính (mặc định an toàn = mặc định đọc được).
 *  3. Danh sách vai trò được đeo kính là HỮU HẠN và đúng 5 mục phiếu chốt — thêm một mục
 *     vào đó là một quyết định, phải làm đỏ test trước.
 *  4. CSS thật có đủ ba lớp, và lớp ĐẶC + GẦN ĐẶC không được mang `backdrop-filter` dày.
 *  5. Base `.be-mat-noi` KHÔNG tự cấp nền — nếu nó cấp thì mọi bề mặt đều thành kính ngầm.
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import {
  VAI_TRO_BE_MAT,
  VAT_LIEU,
  LOP_VAT_LIEU,
  duocDeoKinh,
  vatLieuTheoVaiTro,
  type VaiTroBeMat,
} from './vat-lieu';

let sai = 0;
const ok = (dieu: boolean, ten: string) => {
  if (!dieu) {
    sai += 1;
    console.error('✗', ten);
  }
};

/* 1 — vai trò dày chữ / nhiều núm không bao giờ ra kính */
const CAM_KINH: VaiTroBeMat[] = [
  'bieu-mau',
  'cai-dat',
  'thiet-lap-trang',
  'spec',
  'du-lieu-ky-thuat',
  'vung-nhieu-num',
  'doc-lau',
];
for (const v of CAM_KINH) {
  ok(vatLieuTheoVaiTro(v) === 'dac', `${v} phải ĐẶC, đang là ${vatLieuTheoVaiTro(v)}`);
  ok(!duocDeoKinh(v), `${v} KHÔNG được đeo kính`);
}

/* 2 — không khai vai trò ⇒ ĐẶC */
ok(vatLieuTheoVaiTro(undefined) === 'dac', 'không khai vai trò ⇒ ĐẶC');
ok(vatLieuTheoVaiTro(null) === 'dac', 'null ⇒ ĐẶC');

/* 3 — danh sách được đeo kính là hữu hạn, đúng 5 mục */
const deoKinh = VAI_TRO_BE_MAT.filter(duocDeoKinh);
ok(deoKinh.length === 5, `đúng 5 vai trò được đeo kính, đang có ${deoKinh.length}`);
for (const v of ['vitals-peek', 'vien-giong-noi', 'hanh-dong-nhanh', 'cong-cu-noi-nho', 'lop-phu-tam'] as const) {
  ok(deoKinh.includes(v), `${v} phải nằm trong nhóm kính`);
}

/* mọi vai trò đều có vật liệu hợp lệ — không có ô trống trong bảng */
for (const v of VAI_TRO_BE_MAT) {
  ok(VAT_LIEU.includes(vatLieuTheoVaiTro(v)), `${v} thiếu ánh xạ`);
}

/* 4-5 — CSS thật */
const css = readFileSync(join(__dirname, '../../app/globals.css'), 'utf8');
for (const lop of Object.values(LOP_VAT_LIEU)) {
  ok(css.includes(`.${lop} {`), `globals.css thiếu lớp .${lop}`);
}

const khoi = (ten: string): string => {
  const i = css.indexOf(`.${ten} {`);
  if (i < 0) return '';
  return css.slice(i, css.indexOf('}', i));
};

ok(!khoi('be-mat-noi--dac').includes('backdrop-filter'), 'mức ĐẶC không được có backdrop-filter');
ok(!/background:/.test(khoi('be-mat-noi')), 'base .be-mat-noi không được tự cấp nền (mọi thứ sẽ thành kính ngầm)');
ok(khoi('be-mat-noi--kinh').includes('--kinh-nhoe-mong'), 'kính mỏng phải dùng nhoè MỎNG, không phải nhoè sâu');
ok(!khoi('be-mat-noi--kinh').includes('kinh-nhoe-sau'), 'kính mỏng CẤM acrylic dày');
ok(css.includes('--vl-gan-dac-nhoe: 6px'), 'gần đặc phải nhoè rất nhẹ (6px)');
ok(khoi('be-mat-ruot-dac').includes('backdrop-filter: none'), 'khuôn (B): ruột phải TẮT hẳn kính — cấm kính chồng kính');

if (sai > 0) {
  console.error(`\n${sai} khẳng định hỏng`);
  process.exit(1);
}
console.log('vat-lieu.test.ts — OK');
