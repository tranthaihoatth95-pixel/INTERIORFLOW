/**
 * lib/cad/markup.test.ts — kiểm tạo/dò MarkupPin + PhotoEmbed (Sprint 7 Việc 3+4). Chạy:
 *   node_modules/.bin/sucrase-node lib/cad/markup.test.ts
 */
import { createMarkupPin, createPhotoEmbed, nearestMarkup, nearestPhoto, formatMarkupTime, DEFAULT_MARKUP_COLOR } from './markup';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) {
    pass += 1;
    console.log(`  ok  - ${label}`);
  } else {
    fail += 1;
    console.log(`  FAIL - ${label}`);
  }
}

function testCreateMarkup() {
  console.log('\n[1] createMarkupPin — id/at/text/color/ts');
  const p = createMarkupPin({ x: 1000, y: 2000 }, '  Khách muốn đổi màu tường  ', undefined, 1700000000000);
  ok('id có tiền tố mk-', p.id.startsWith('mk-'));
  ok('at đúng toạ độ', p.at.x === 1000 && p.at.y === 2000);
  ok('text đã trim khoảng trắng', p.text === 'Khách muốn đổi màu tường');
  ok('color mặc định = DEFAULT_MARKUP_COLOR', p.color === DEFAULT_MARKUP_COLOR);
  ok('ts đúng giá trị truyền vào', p.ts === 1700000000000);

  const p2 = createMarkupPin({ x: 0, y: 0 }, 'khác', '#00ff00');
  ok('color tuỳ chỉnh giữ nguyên', p2.color === '#00ff00');
  ok('2 pin tạo liên tiếp có id khác nhau', p.id !== p2.id);
}

function testCreatePhoto() {
  console.log('\n[2] createPhotoEmbed — id/at/src/caption/ts');
  const ph = createPhotoEmbed({ x: 500, y: 500 }, 'data:image/png;base64,AAAA', '  Hiện trạng góc bếp  ', 1700000001000);
  ok('id có tiền tố ph-', ph.id.startsWith('ph-'));
  ok('src giữ nguyên', ph.src === 'data:image/png;base64,AAAA');
  ok('caption đã trim', ph.caption === 'Hiện trạng góc bếp');
  ok('ts đúng giá trị truyền vào', ph.ts === 1700000001000);
}

function testNearest() {
  console.log('\n[3] nearestMarkup/nearestPhoto — hitTest theo bán kính tol (world mm)');
  const pins = [
    createMarkupPin({ x: 0, y: 0 }, 'A'),
    createMarkupPin({ x: 1000, y: 0 }, 'B'),
    createMarkupPin({ x: 5000, y: 5000 }, 'C'),
  ];
  ok('click gần pin A (trong tol) → trả về A', nearestMarkup(pins, { x: 50, y: 0 }, 200)?.text === 'A');
  ok('click gần pin B → trả về B, không lẫn A', nearestMarkup(pins, { x: 950, y: 0 }, 200)?.text === 'B');
  ok('click xa mọi pin (ngoài tol) → null', nearestMarkup(pins, { x: 2500, y: 2500 }, 200) === null);
  ok('chọn pin GẦN NHẤT khi nhiều pin trong tol', nearestMarkup(pins, { x: 500, y: 0 }, 600)?.text === 'B');

  const photos = [createPhotoEmbed({ x: 0, y: 0 }, 'src1'), createPhotoEmbed({ x: 3000, y: 0 }, 'src2')];
  ok('nearestPhoto tìm đúng ảnh gần', nearestPhoto(photos, { x: 100, y: 0 }, 200)?.src === 'src1');
  ok('nearestPhoto ngoài tol → null', nearestPhoto(photos, { x: 100, y: 5000 }, 200) === null);
}

function testFormatTime() {
  console.log('\n[4] formatMarkupTime — định dạng giờ:phút ngày/tháng/năm');
  // 2024-01-15T08:30:00 giờ địa phương — kiểm cấu trúc chuỗi (không phụ thuộc múi giờ CI)
  const s = formatMarkupTime(new Date(2024, 0, 15, 8, 30).getTime());
  ok('có dạng HH:MM DD/MM/YYYY', /^\d{2}:\d{2} \d{2}\/\d{2}\/\d{4}$/.test(s));
  ok('ts hỏng (NaN) → chuỗi rỗng', formatMarkupTime(NaN) === '');
}

testCreateMarkup();
testCreatePhoto();
testNearest();
testFormatTime();

console.log(`\n${pass} ok, ${fail} fail`);
if (fail > 0) process.exit(1);
