/**
 * lib/cad/brief-file.test.ts — test phần THUẦN của đường nạp đề bài từ tệp (brief-file.ts):
 * phân loại đuôi tệp · chuẩn hoá + cắt thông minh · thông điệp đúng khuôn (có tên tệp, có việc
 * làm tiếp). KHÔNG test extractPdf ở đây — `lib/notebook/extract.ts` có vùng test riêng.
 * Chạy: node_modules/.bin/sucrase-node lib/cad/brief-file.test.ts
 */
import {
  briefFileKind,
  normalizeBriefText,
  briefLoadedMessage,
  briefEmptyPdfMessage,
  briefEmptyTextMessage,
  briefWordMessage,
  briefUnsupportedMessage,
  briefExtractFailedMessage,
  BRIEF_MAX_CHARS,
  BRIEF_FILE_ACCEPT,
} from './brief-file';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

console.log('briefFileKind — phân loại theo đuôi tên');
{
  ok('.pdf → pdf', briefFileKind('de-bai.pdf') === 'pdf');
  ok('.PDF hoa → pdf (không phân biệt hoa thường)', briefFileKind('DE-BAI.PDF') === 'pdf');
  ok('.txt → text', briefFileKind('brief.txt') === 'text');
  ok('.md → text', briefFileKind('yeu-cau.md') === 'text');
  ok('.markdown → text', briefFileKind('yeu-cau.markdown') === 'text');
  ok('.docx → word (báo riêng, không phải unknown)', briefFileKind('brief khach.docx') === 'word');
  ok('.doc → word', briefFileKind('cu.doc') === 'word');
  ok('.xlsx → unknown', briefFileKind('bang.xlsx') === 'unknown');
  ok('không đuôi → unknown', briefFileKind('README') === 'unknown');
  ok('tên có dấu tiếng Việt vẫn phân loại đúng', briefFileKind('Đề bài Vinhomes.pdf') === 'pdf');
  ok('accept KHÔNG chứa .docx (chưa có bộ đọc Word)', !BRIEF_FILE_ACCEPT.includes('docx'));
}

console.log('normalizeBriefText — chuẩn hoá cơ bản');
{
  const n = normalizeBriefText('phòng khách 4x3\r\ncó sofa  \r\n\r\n\r\n\r\nphòng ngủ 3x3\r');
  ok('CRLF/CR → LF', !n.text.includes('\r'));
  ok('xoá khoảng trắng cuối dòng', n.text.includes('có sofa\n'));
  ok('gộp ≥3 dòng trống còn 1 dòng trống', n.text.includes('sofa\n\nphòng ngủ'));
  ok('không cắt khi dưới trần', !n.truncated && n.originalLength === n.text.length);
  const empty = normalizeBriefText('   \n\n  \t ');
  ok('toàn khoảng trắng → text rỗng', empty.text === '');
}

console.log('normalizeBriefText — cắt thông minh có báo');
{
  // 300 dòng × ~40 ký tự ≈ 12.000 > trần 100 → phải cắt, và cắt ở RANH GIỚI DÒNG.
  const lines = Array.from({ length: 300 }, (_, i) => `phòng ${i} kích thước 4.0x3.5 có giường`);
  const raw = lines.join('\n');
  const n = normalizeBriefText(raw, 100);
  ok('đánh dấu truncated', n.truncated);
  ok('originalLength = độ dài trước cắt', n.originalLength === raw.length);
  ok('không vượt trần', n.text.length <= 100);
  ok('cắt ở ranh giới dòng — dòng cuối vẫn nguyên vẹn', raw.split('\n').includes(n.text.split('\n').pop() as string));

  // 1 dòng siêu dài không newline → lùi về khoảng trắng, không cắt giữa từ.
  const oneLine = Array.from({ length: 60 }, (_, i) => `chữ${i}`).join(' ');
  const w = normalizeBriefText(oneLine, 100);
  ok('1 dòng dài: vẫn cắt được', w.truncated && w.text.length <= 100);
  ok('1 dòng dài: cắt ở khoảng trắng — từ cuối nguyên vẹn', oneLine.split(' ').includes(w.text.split(' ').pop() as string));

  // Chuỗi đặc không cả khoảng trắng → cắt cứng đúng trần, không crash.
  const solid = normalizeBriefText('a'.repeat(500), 100);
  ok('chuỗi đặc: cắt cứng = trần', solid.text.length === 100 && solid.truncated);

  ok('trần mặc định là BRIEF_MAX_CHARS', normalizeBriefText('x'.repeat(BRIEF_MAX_CHARS + 5)).truncated);
  ok('đúng trần thì KHÔNG cắt', !normalizeBriefText('x'.repeat(BRIEF_MAX_CHARS)).truncated);
}

console.log('thông điệp — khuôn SPEC-NGON-NGU-CHI-DAN: tên tệp + việc làm tiếp');
{
  const n = normalizeBriefText('phòng khách 4x3 có sofa');
  const loaded = briefLoadedMessage('de-bai.pdf', n, 5);
  ok('nạp xong: có tên tệp', loaded.includes('"de-bai.pdf"'));
  ok('nạp xong: có số trang', loaded.includes('5 trang'));
  ok('nạp xong: nhắc bước người kiểm tra/sửa (human-in-the-loop)', loaded.includes('kiểm tra') && loaded.includes('sửa'));
  ok('nạp .txt không trang: KHÔNG hiện "trang"', !briefLoadedMessage('a.txt', n).includes('trang'));

  const cut = normalizeBriefText('dòng một\n'.repeat(50), 100);
  const cutMsg = briefLoadedMessage('dai.pdf', cut);
  ok('có cắt: báo số giữ/số gốc', cutMsg.includes('đã giữ') && cutMsg.match(/\d/) !== null);
  ok('không cắt: KHÔNG nhắc chuyện cắt', !loaded.includes('đã giữ'));

  ok('PDF scan: có tên tệp + gợi ý lối thoát', briefEmptyPdfMessage('scan.pdf').includes('"scan.pdf"') && briefEmptyPdfMessage('scan.pdf').includes('dán'));
  ok('tệp text rỗng: có lối thoát', briefEmptyTextMessage('rong.txt').includes('"rong.txt"'));
  ok('Word: nói rõ chưa đọc được + cách chuyển', briefWordMessage('b.docx').includes('Word') && briefWordMessage('b.docx').includes('PDF'));
  ok('đuôi lạ: liệt kê định dạng nhận', briefUnsupportedMessage('x.xlsx').includes('.pdf'));
  const failed = briefExtractFailedMessage('hong.pdf', new Error('Invalid PDF structure'));
  ok('lỗi trích: tên tệp + lý do rút gọn + lối thoát', failed.includes('"hong.pdf"') && failed.includes('Invalid PDF structure') && failed.includes('dán'));
  ok('lỗi trích không phải Error: không crash', briefExtractFailedMessage('h.pdf', 'boom').includes('boom'));
}

console.log(`\n${pass} pass · ${fail} fail`);
if (fail > 0) process.exit(1);
