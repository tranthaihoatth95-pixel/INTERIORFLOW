/**
 * lib/ui/giam-chuyen-dong.test.ts — MỌI CHUYỂN ĐỘNG VÔ HẠN PHẢI CÓ NHÁNH `prefers-reduced-motion`.
 * Chạy: `node_modules/.bin/sucrase-node lib/ui/giam-chuyen-dong.test.ts`
 *
 * ⭐ VÌ SAO CÓ TỆP NÀY THAY CHO MỘT LẦN BẬT CỜ BẰNG TAY: nợ "chưa ai bật cờ hệ điều hành thật"
 * không đóng được bằng một lượt kiểm thủ công — lượt sau thêm một `animation: … infinite` mới là
 * nợ mở lại, mà không ai nhớ đi bật cờ lần nữa. Máy canh thì canh mãi.
 * ⚠️ NÓ KHÔNG THAY THẾ việc nhìn bằng mắt khi cờ bật: nó chứng minh CÓ NHÁNH, không chứng minh
 * nhánh đó ĐẸP. Phần mắt vẫn nợ — xem mục "reduced-motion" trong báo cáo phiên.
 */

import { readFileSync } from 'fs';
import { join } from 'path';

const css = readFileSync(join(__dirname, '../../app/globals.css'), 'utf8');

/**
 * Các khối `@media (prefers-reduced-motion: reduce)` gộp lại — nơi nhánh giảm phải nằm.
 * ⚠️ Phải ĐẾM NGOẶC, không được cắt bằng `split`: cắt bằng split thì "sau media query đầu tiên"
 * ôm luôn cả nửa cuối tệp, và mọi khẳng định dưới đây thành đúng-vì-tình-cờ. (Ca thật: bản đầu
 * của tệp này báo hỏng đúng chỗ không hỏng, vì nó bắt trúng luật NGOÀI khối giảm.)
 */
const khoiGiam = (() => {
  const re = /@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{/g;
  const ra: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(css))) {
    let sau = 1;
    let i = m.index + m[0].length;
    const dau = i;
    while (i < css.length && sau > 0) {
      if (css[i] === '{') sau += 1;
      else if (css[i] === '}') sau -= 1;
      i += 1;
    }
    ra.push(css.slice(dau, i - 1));
  }
  return ra.join('\n');
})();

let sai = 0;
const ok = (dieu: boolean, ten: string) => {
  if (!dieu) {
    sai += 1;
    console.error('✗', ten);
  }
};

ok(khoiGiam.length > 0, 'globals.css phải có ít nhất một khối prefers-reduced-motion');

/* Có một khối "tắt tất" toàn cục ở đầu tệp (animation-duration ~0). Nó phủ phần lớn, NHƯNG các
   chuyển động MANG NGHĨA TRẠNG THÁI phải có nhánh RIÊNG — tắt câm là mất kênh thông báo,
   phải thay bằng dấu hiệu TĨNH. Hai ca đang sống, khoá tường minh: */
const PHAI_CO_NHANH_RIENG = [
  '.be-mat-noi--dang-chay', // viền chạy = "đang chạy" — tắt thì phải còn viền sáng tĩnh
  '.vitals-quy-dao--quay', // quỹ đạo quay = "đang chạy" — tắt quay, GIỮ độ sáng
];
for (const sel of PHAI_CO_NHANH_RIENG) {
  ok(khoiGiam.includes(sel), `${sel} là chuyển động MANG NGHĨA ⇒ phải có nhánh reduced-motion riêng`);
}

/* Nhánh của viền chạy không được chỉ `animation: none` rồi thôi — phải còn dấu hiệu tĩnh. */
const i = khoiGiam.indexOf('.be-mat-noi--dang-chay');
const than = khoiGiam.slice(i, khoiGiam.indexOf('}', i));
ok(than.includes('box-shadow'), 'tắt viền chạy phải THAY bằng dấu hiệu tĩnh, không im lặng bỏ đi');

/* Lõi nhịp cũng phải đọc cờ — nếu không thì JS vẫn chạy transition dù CSS đã tắt. */
const nhip = readFileSync(join(__dirname, 'nhip.ts'), 'utf8');
ok(nhip.includes('prefers-reduced-motion'), 'lib/ui/nhip.ts phải đọc cờ prefers-reduced-motion');

if (sai > 0) {
  console.error(`\n${sai} khẳng định hỏng`);
  process.exit(1);
}
console.log('giam-chuyen-dong.test.ts — OK');
