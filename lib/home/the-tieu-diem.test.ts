/** Test thẻ tiêu điểm Home bấm được — hành trình J05.
 *  Chạy: node_modules/.bin/sucrase-node lib/home/the-tieu-diem.test.ts
 *
 * VÌ SAO TỆP NÀY TỒN TẠI (đo trên mã 04/09, TRƯỚC khi sửa):
 *   Thân thẻ tiêu điểm KHÔNG bắt cú bấm nào — `grep onClick` trong `XuongHome.tsx` chỉ trúng
 *   ba nút lối vào · cột dự án · widget; `hienVat.href` được TÍNH RA rồi **không ai tiêu thụ**.
 *   Trong khi chân thẻ ghi hẳn "bấm để về đúng chỗ bạn rời đi". Giao diện khẳng định một việc,
 *   việc đó không xảy ra — cùng họ với D-J04a (ba nút chung một `onClick`) và WorkHub tự xưng
 *   trợ lý mà `fetch` = 0.
 *
 * Ba bất biến khoá ở đây, cả ba là loại `tsc` KHÔNG bắt được:
 *   ① đường mở lại chỉ sống khi thật sự có đích  → chống nút giả (§9)
 *   ② thân có nút riêng ⇒ CẤM lớp phủ toàn thẻ   → chống NÚT-TRONG-NÚT
 *   ③ lời hứa ở chân thẻ ⇔ đường dây có thật     → chống hứa suông tái phát
 */
import { readFileSync } from 'node:fs';
import { duongMoLai, thanCoNut, THAN_CO_NUT } from './the-tieu-diem';
import type { HienVat, ThanVat } from './xuong-demo';

let pass = 0;
let fail = 0;
function ok(name: string, cond: boolean) {
  if (cond) { pass++; console.log('  ok  -', name); }
  else { fail++; console.log('  FAIL-', name); }
}
function eq(name: string, a: unknown, b: unknown) {
  ok(`${name} (${JSON.stringify(a)} = ${JSON.stringify(b)})`, JSON.stringify(a) === JSON.stringify(b));
}
const doc = (p: string) => readFileSync(p, 'utf8');

const THAN_TOM_TAT: ThanVat = { kieu: 'tom-tat', hang: [{ n: 'Chặng đang dở', v: 'Thiết kế 2D' }] };
const THAN_BAT_DAU: ThanVat = {
  kieu: 'bat-dau',
  tieuDe: 't', moTa: 'm',
  nut: [
    { nhan: 'a', viec: 'tao-du-an' },
    { nhan: 'b', viec: 'mo-du-an' },
    { nhan: 'c', viec: 'nhap-tep' },
  ],
  loiBa: 'l', titVon: 'v', von: [], daiMau: [],
};
const vat = (than: ThanVat, href?: string): HienVat => ({
  nen: 'sang', dau: 'cho', ten: 'x', kem: 'k', chip: null,
  than, chan: [], chanCuoi: 'c', href,
});

console.log('① ĐƯỜNG MỞ LẠI — chỉ sống khi có đích thật');
eq('có href + thân không nút → trả đúng đường', duongMoLai(vat(THAN_TOM_TAT, '/projects/p1/cad')), '/projects/p1/cad');
eq('không href → null (không dựng lớp phủ)', duongMoLai(vat(THAN_TOM_TAT)), null);
eq('href rỗng → null; <a href=""> trỏ về chính trang = nút giả', duongMoLai(vat(THAN_TOM_TAT, '')), null);
eq('href toàn khoảng trắng → null', duongMoLai(vat(THAN_TOM_TAT, '   ')), null);
eq(
  'href = "/" → null; đó CHÍNH LÀ trang Home đang đứng, bấm là đứng yên tại chỗ (§9 nút giả)',
  duongMoLai(vat(THAN_TOM_TAT, '/')),
  null,
);
eq('href có khoảng trắng thừa hai đầu → cắt sạch', duongMoLai(vat(THAN_TOM_TAT, '  /projects/p1/render  ')), '/projects/p1/render');

console.log('\n② CHỐNG NÚT-TRONG-NÚT — thân có nút riêng thì CẤM lớp phủ');
eq('thân bat-dau (ba nút lối vào) + có href → VẪN null', duongMoLai(vat(THAN_BAT_DAU, '/projects/p1/cad')), null);
ok('bat-dau được khai là thân có nút', thanCoNut('bat-dau'));
ok('tom-tat KHÔNG bị khai nhầm là có nút', !thanCoNut('tom-tat'));
{
  // Bất biến CHỐNG QUÊN: thêm một `ThanVat` mới có nút mà không khai vào THAN_CO_NUT thì
  // lỗi chỉ lộ ra trên app thật. Khoá bằng cách đối chiếu với chính mã dựng thân.
  const src = doc('components/home/XuongHome.tsx');
  const dau = src.indexOf('function BacMotThan');
  const cuoi = src.indexOf('function DaiNguCanh');
  ok('tìm được thân hàm BacMotThan để soi', dau >= 0 && cuoi > dau);
  const than = src.slice(dau, cuoi);
  const kieuCoNut = (['bang-vat-lieu', 'khung-anh', 'bat-dau', 'tom-tat'] as const).filter((k) => {
    const i = than.indexOf(`than.kieu === '${k}'`);
    if (i < 0) return false;
    const ke = than.indexOf("than.kieu === '", i + 10);
    const khoi = than.slice(i, ke > 0 ? ke : than.length);
    return /<button|NutLoiVao|<input|<select|<textarea/.test(khoi);
  });
  eq('kiểu thân CÓ nút trong JSX khớp đúng danh sách khai', [...kieuCoNut].sort(), [...THAN_CO_NUT].sort());
}

console.log('\n③ LỜI HỨA Ở CHÂN THẺ ⇔ ĐƯỜNG DÂY CÓ THẬT');
{
  const src = doc('components/home/XuongHome.tsx');
  ok('vẫn còn câu hứa "bấm để về đúng chỗ bạn rời đi"', src.includes('bấm để về đúng chỗ bạn rời đi'));
  ok('`duongMoLai` được tiêu thụ trong component — không còn tính rồi bỏ', src.includes('duongMoLai('));
  ok('lớp phủ KHÔNG bọc cả thẻ trong <button>', !/<button[^>]*className={?[`'"]?vat/.test(src));
  ok('lớp phủ có nhãn cho trình đọc màn hình', src.includes('mo-lai') && src.includes('aria-label'));
}
{
  const css = doc('components/home/home-lock-css.ts');
  ok('lớp phủ trải kín thẻ (position:absolute; inset:0)', /\.mo-lai\{[^}]*position:absolute;inset:0/.test(css));
  ok(
    'vòng focus lấy MÀU + ĐỘ DÀY từ token, không chế màu',
    /\.mo-lai:focus-visible\{[^}]*var\(--focus-ring\)/.test(css) && /\.mo-lai:focus-visible\{[^}]*var\(--stroke-focus\)/.test(css),
  );
  ok(
    'ring là ring TRONG — .vat có overflow:hidden nên ring ngoài bị XÉN',
    /\.mo-lai:focus-visible\{[^}]*outline-offset:calc\(-1 \* var\(--stroke-focus\)\)/.test(css),
  );
  ok('không hex trong khối lớp phủ — màu pha từ token', !/\.mo-lai[^}]*#[0-9a-fA-F]{3,8}/.test(css));
  ok(
    'thẻ LỚN thì CẤM scale khi trỏ vào (SPEC-HOVER-FOCUS) — chỉ đổi nền/độ nổi',
    !/:has\(\.mo-lai:hover\)\)?\{[^}]*transform/.test(css),
  );
  {
    // Bất biến chống-tái-phát: nhánh reduced-motion phải BAO chính hai lớp vừa thêm, không chỉ
    // "có tồn tại một khối @media" ở đâu đó trong tệp (đó là khẳng định đúng ở mọi thế giới).
    const i = css.indexOf('prefers-reduced-motion');
    const khoi = i >= 0 ? css.slice(i, i + 700) : '';
    ok('reduced-motion tắt chuyển nền của CHÍNH thẻ bấm được', khoi.includes('.vat.co-mo-lai') && khoi.includes('.mo-lai'));
  }
}

console.log(`\n${pass} ok · ${fail} fail`);
if (fail > 0) process.exit(1);
