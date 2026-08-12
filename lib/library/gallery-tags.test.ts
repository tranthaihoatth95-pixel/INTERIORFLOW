/** Test `gallery-tags.ts` + `gallery-source-guard.ts` — chạy:
 *  node_modules/.bin/sucrase-node lib/library/gallery-tags.test.ts
 *  Import TƯƠNG ĐỐI (không `@/…`) theo đúng quy ước các test chạy dưới sucrase-node. */
import { buildGalleryTag, canJoinCollection, isGalleryIndustry, isGalleryLicense, parseGalleryTags } from './gallery-tags';
import { checkGallerySourceUrl } from './gallery-source-guard';

let pass = 0;
let fail = 0;
function ok(name: string, cond: boolean) {
  if (cond) { pass++; console.log('  ok  -', name); }
  else { fail++; console.log('  FAIL-', name); }
}
function eq(name: string, a: unknown, b: unknown) {
  ok(`${name} (${JSON.stringify(a)} = ${JSON.stringify(b)})`, JSON.stringify(a) === JSON.stringify(b));
}

console.log('parseGalleryTags — đọc đủ 4 trục, bỏ qua giá trị lạ (N4, không bịa)');
eq(
  'đủ 4 trục',
  parseGalleryTags('demo,nganh:noi-that,license:unsplash,nguon:https://unsplash.com/photos/x,bosuutap:anh-sang-tu-nhien'),
  { nganh: 'noi-that', license: 'unsplash', nguon: 'https://unsplash.com/photos/x', bosuutap: ['anh-sang-tu-nhien'] },
);
eq('nganh lạ -> null (không bịa)', parseGalleryTags('nganh:khong-ton-tai').nganh, null);
eq('license lạ -> null', parseGalleryTags('license:pinterest-steal').license, null);
eq('thiếu hết -> rỗng', parseGalleryTags('shelf:common-asset,thumb:sheet'), { nganh: null, license: null, nguon: null, bosuutap: [] });
eq('nhiều bosuutap', parseGalleryTags('bosuutap:a,bosuutap:b').bosuutap, ['a', 'b']);

console.log('isGalleryIndustry / isGalleryLicense — whitelist đúng bảng đã khai');
ok('kien-truc hợp lệ', isGalleryIndustry('kien-truc'));
ok('art hợp lệ', isGalleryIndustry('art'));
ok('rac không hợp lệ', !isGalleryIndustry('rac'));
ok('cc0 hợp lệ', isGalleryLicense('cc0'));
ok('pinterest không phải license hợp lệ', !isGalleryLicense('pinterest'));

console.log('buildGalleryTag — dựng đúng tiền tố chuẩn');
eq('nganh', buildGalleryTag('nganh', 'noi-that'), 'nganh:noi-that');
eq('license', buildGalleryTag('license', 'cc0'), 'license:cc0');

console.log('canJoinCollection — VIỆC 3: thiếu nguồn HOẶC giấy phép thì KHÔNG vào được bộ sưu tập');
ok('đủ cả hai -> vào được', canJoinCollection({ nguon: 'https://x', license: 'cc0' }));
ok('thiếu nguồn -> chặn', !canJoinCollection({ nguon: null, license: 'cc0' }));
ok('thiếu license -> chặn', !canJoinCollection({ nguon: 'https://x', license: null }));
ok('thiếu cả hai -> chặn', !canJoinCollection({ nguon: null, license: null }));

console.log('checkGallerySourceUrl — chặn Pinterest, chấp nhận nguồn sạch (VIỆC 4)');
ok('rỗng -> chặn + xin dán link', !checkGallerySourceUrl('').ok);
ok('không phải URL -> chặn', !checkGallerySourceUrl('không phải link').ok);
ok('pinterest.com -> chặn', !checkGallerySourceUrl('https://pinterest.com/pin/123').ok);
ok('www.pinterest.com -> chặn', !checkGallerySourceUrl('https://www.pinterest.com/pin/123').ok);
ok('pinterest.co.uk (miền quốc gia) -> chặn', !checkGallerySourceUrl('https://pinterest.co.uk/pin/123').ok);
ok('pin.it (rút gọn) -> chặn', !checkGallerySourceUrl('https://pin.it/abc123').ok);
ok('thông điệp Pinterest có lý do + hướng thay thế', /unsplash|cc0/i.test(checkGallerySourceUrl('https://pinterest.com/x').message[0]));
ok('unsplash.com -> chấp nhận', checkGallerySourceUrl('https://unsplash.com/photos/abc').ok);
ok('trang studio riêng -> chấp nhận', checkGallerySourceUrl('https://ttt-studio.example.com/project/1').ok);
ok('ftp:// -> chặn (chỉ nhận http/https)', !checkGallerySourceUrl('ftp://files.example.com/a.jpg').ok);
ok('domain khác chỉ TÌNH CỜ chứa "pinterest" ở path -> KHÔNG bị chặn oan', checkGallerySourceUrl('https://example.com/pinterest-boards').ok);

console.log(`\n${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
