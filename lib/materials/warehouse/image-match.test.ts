/**
 * lib/materials/warehouse/image-match.test.ts
 * Chạy: node_modules/.bin/sucrase-node lib/materials/warehouse/image-match.test.ts
 * Node ≥20 có global `File` (undici) — không cần jsdom cho test này.
 */
import { matchImagesBySku, matchImagesForRows, matchImagesForRowsEx, isDirectImageUrl } from './image-match';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

function fakeFile(name: string): File {
  return new File(['x'], name, { type: 'image/jpeg' });
}

// ---- khớp đúng theo tên file == SKU (bỏ đuôi, không phân biệt hoa/thường) ----
{
  const files = [fakeFile('GACH-01.jpg'), fakeFile('gach-02.PNG'), fakeFile('readme.txt')];
  const map = matchImagesBySku(files, ['GACH-01', 'GACH-02', 'GACH-03']);
  ok('khớp đúng hoa/thường', map.get('GACH-01')?.name === 'GACH-01.jpg');
  ok('khớp không phân biệt hoa/thường', map.get('GACH-02')?.name === 'gach-02.PNG');
  ok('SKU không có ảnh → không có trong map', !map.has('GACH-03'));
  ok('file không phải ảnh (readme.txt) bị bỏ qua', map.size === 2);
}

// ---- webkitdirectory trả đường dẫn có "/" — chỉ so tên file, không so cả path ----
{
  const files = [fakeFile('sub-folder/SP-9.jpg')];
  const map = matchImagesBySku(files, ['SP-9']);
  ok('bỏ qua phần thư mục trong path, chỉ so tên file', map.get('SP-9')?.name === 'sub-folder/SP-9.jpg');
}

// ---- SKU rỗng không khớp bừa ----
{
  const files = [fakeFile('.jpg')];
  const map = matchImagesBySku(files, ['', '  ']);
  ok('SKU rỗng/toàn khoảng trắng không khớp gì', map.size === 0);
}

// ---- ② (KIỂM PHẢN BIỆN 06/08) CA ĐÃ ĐO: tên file ≠ SKU ⇒ khớp-theo-SKU ra 0/5 ----
{
  const files = [
    fakeFile('ghe-xoay.jpg'), fakeFile('ban-lam-viec.jpg'), fakeFile('tu-ho-so.jpg'),
    fakeFile('den-ban.jpg'), fakeFile('ke-sach.jpg'),
  ];
  const rows = [
    { rowIndex: 0, sku: 'CH-MESH-01', imageRef: 'ghe-xoay.jpg' },
    { rowIndex: 1, sku: 'TB-WORK-01', imageRef: 'ban-lam-viec.jpg' },
    { rowIndex: 2, sku: 'CB-FILE-01', imageRef: 'tu-ho-so' },       // gõ thiếu đuôi
    { rowIndex: 3, sku: 'LT-DESK-01', imageRef: 'anh/den-ban.JPG' }, // có thư mục + hoa/thường
    { rowIndex: 4, sku: 'SH-BOOK-01', imageRef: 'ke-sach.jpg' },
  ];

  // TRƯỚC: chỉ có đường khớp theo SKU
  const cu = matchImagesBySku(files, rows.map((r) => r.sku));
  ok('② TRƯỚC: khớp theo SKU ra 0/5 ảnh (đúng số đã đo)', cu.size === 0);

  // SAU: khớp theo cột "Ảnh"
  const moi = matchImagesForRows(files, rows);
  ok('② SAU: đủ 5/5 món có ảnh', moi.size === 5);
  ok('② khớp đúng file cho dòng 0', moi.get(0)?.name === 'ghe-xoay.jpg');
  ok('② thiếu đuôi vẫn khớp', moi.get(2)?.name === 'tu-ho-so.jpg');
  ok('② có thư mục + khác hoa/thường vẫn khớp', moi.get(3)?.name === 'den-ban.jpg');
}

// ---- ② vẫn GIỮ đường cũ: không có cột Ảnh thì rơi về khớp theo SKU ----
{
  const files = [fakeFile('SP-1.jpg')];
  const m = matchImagesForRows(files, [{ rowIndex: 0, sku: 'SP-1' }, { rowIndex: 1, sku: 'SP-2' }]);
  ok('② không có imageRef → khớp theo SKU như cũ', m.get(0)?.name === 'SP-1.jpg' && !m.has(1));
}

// ---- ② dòng KHÔNG có SKU vẫn có ảnh được (trước: vĩnh viễn không bao giờ có) ----
{
  const files = [fakeFile('ghe.png')];
  const m = matchImagesForRows(files, [{ rowIndex: 0, imageRef: 'ghe.png' }]);
  ok('② dòng không SKU vẫn ghép được ảnh', m.get(0)?.name === 'ghe.png');
}

// ---- ② URL dùng thẳng, KHÔNG đi tìm trong thư mục ----
{
  ok('② nhận http/https/data: là URL dùng thẳng',
    isDirectImageUrl('https://a/b.png') && isDirectImageUrl('http://a/b.png') && isDirectImageUrl('data:image/png;base64,AA'));
  ok('② tên file KHÔNG bị coi là URL', !isDirectImageUrl('ghe-xoay.jpg'));
  const m = matchImagesForRows([fakeFile('b.png')], [{ rowIndex: 0, imageRef: 'https://cdn/b.png' }]);
  ok('② URL không ghép nhầm vào file trùng tên trong thư mục', m.size === 0);
}

/* ═══ 🔴 KIỂM PHẢN BIỆN VÒNG 2 (06/08) — NFC ≠ NFD làm hỏng ghép ảnh trên máy Mac ═══
 * macOS/APFS trả tên file dạng NFD, Excel/gõ tay ra NFC — hai chuỗi TRÔNG Y HỆT, `===` thì khác.
 * Đo được: file `ghế.png` + ô ghi `ghế.png` ⇒ 0 ảnh khớp, không câu nào giải thích. Ca này sẽ
 * xảy ra với gần như MỌI khách hàng Việt Nam dùng Mac. */
console.log('\n[NFC/NFD] tên file tiếng Việt phải khớp bất kể dạng chuẩn hoá Unicode');
{
  const nfd = (x: string) => x.normalize('NFD');
  const nfc = (x: string) => x.normalize('NFC');
  const f = fakeFile(nfd('ghế xoay.png'));
  const hit = matchImagesForRows([f], [{ rowIndex: 0, imageRef: nfc('ghế xoay.png') }]);
  ok('file NFD + ô NFC vẫn khớp (trước: 0 ảnh)', hit.get(0) === f);

  const f2 = fakeFile(nfc('tủ hồ sơ.png'));
  const hit2 = matchImagesForRows([f2], [{ rowIndex: 0, imageRef: nfd('tủ hồ sơ') }]);
  ok('chiều ngược lại + thiếu đuôi file vẫn khớp', hit2.get(0) === f2);
}

/* ═══ 🔴 VÒNG 3 (06/08) — ẢNH TRÙNG TÊN Ở HAI THƯ MỤC ⇒ gán nhầm ảnh, im lặng ═══
 * Đo được: `phong-khach/ghe.jpg` + `phong-ngu/ghe.jpg` ⇒ **cả 2 dòng lấy CÙNG MỘT ảnh** (bản nạp
 * sau đè bản trước trong map khoá-theo-tên), không một câu nào giải thích. Một thư mục mỗi phòng
 * là cách sắp ảnh phổ biến NHẤT của studio nội thất ⇒ đây là ca mặc định, không phải ca hiếm.
 * Máy KHÔNG tự đoán ảnh nào đúng (không có căn cứ): ghép như cũ + TRẢ RA danh sách trùng để tầng
 * trên nói cho người dùng. */
console.log('\n[vòng 3] ảnh trùng tên ở 2 thư mục — phải TRẢ RA, không im');
{
  const a = fakeFile('phong-khach/ghe.jpg');
  const b = fakeFile('phong-ngu/ghe.jpg');
  const rows = [{ rowIndex: 0, imageRef: 'phong-khach/ghe.jpg' }, { rowIndex: 1, imageRef: 'phong-ngu/ghe.jpg' }];

  const cu = matchImagesForRows([a, b], rows);
  ok('TÁI HIỆN: 2 dòng vẫn nhận CÙNG một ảnh (hành vi giữ nguyên, có chủ ý)', cu.get(0) === cu.get(1));

  const ex = matchImagesForRowsEx([a, b], rows);
  ok('byRow y hệt hàm cũ (tương thích ngược)', ex.byRow.get(0) === cu.get(0) && ex.byRow.size === cu.size);
  ok('CÓ danh sách trùng (trước: không có đường nào để biết)', ex.duplicateNames.length === 1);
  ok('nêu đúng tên file trùng', ex.duplicateNames[0].name === 'ghe.jpg');
  ok('liệt kê ĐỦ 2 đường dẫn để người dùng tự phân biệt',
    ex.duplicateNames[0].paths.length === 2
    && ex.duplicateNames[0].paths.includes('phong-khach/ghe.jpg')
    && ex.duplicateNames[0].paths.includes('phong-ngu/ghe.jpg'));

  // Chốt ngược: tên khác nhau thì KHÔNG báo trùng oan; file không phải ảnh không tính.
  const sach = matchImagesForRowsEx([fakeFile('a/ghe.jpg'), fakeFile('b/ban.jpg'), fakeFile('c/ghe.txt')], []);
  ok('tên khác nhau → không báo trùng oan', sach.duplicateNames.length === 0);

  // Trùng tên trong CÙNG thư mục nhưng khác đuôi (ghe.jpg/ghe.png) KHÔNG tính là trùng tên file
  // đầy đủ — đó là ca `matchImagesBySku` đã có luật riêng (giữ bản sau cùng).
  const khacDuoi = matchImagesForRowsEx([fakeFile('ghe.jpg'), fakeFile('ghe.png')], []);
  ok('cùng tên khác ĐUÔI không bị gộp vào danh sách trùng', khacDuoi.duplicateNames.length === 0);
}

console.log(`\n${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
