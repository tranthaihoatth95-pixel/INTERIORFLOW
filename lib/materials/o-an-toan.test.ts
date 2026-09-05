/**
 * lib/materials/o-an-toan.test.ts — KHOÁ BẤT BIẾN "một ô hỏng chỉ hỏng chính nó" (05/09).
 *
 * Ca đắt nhất, đã xảy ra thật: tắt WebGL ⇒ một lượt render ngã ⇒ unhandled rejection ⇒ **trắng
 * cả kho vật liệu**. Test này bắt CHÍNH ca đó bằng cách cắm một bẫy `unhandledRejection` vào
 * tiến trình: bất kỳ lượt nào rò ra ngoài là FAIL, không phải là "log ai đó sẽ đọc".
 *
 * Chạy: node_modules/.bin/sucrase-node lib/materials/o-an-toan.test.ts
 */
import { veOAnToan, loiOMau, LY_DO_KHONG_WEBGL } from './o-an-toan';

let pass = 0, fail = 0;
function ok(name: string, cond: boolean, detail?: string) {
  if (cond) pass += 1; else { fail += 1; console.error('  ✗', name, detail ?? ''); }
}

/* BẪY: nếu bất kỳ promise nào rò lỗi ra ngoài thì đây là chỗ nó rơi vào. Trong app thật, chỗ
   nó rơi vào là overlay lỗi toàn trang của Next — tức trắng cả kho. */
const roRi: string[] = [];
process.on('unhandledRejection', (e) => { roRi.push(String(e)); });

(async () => {
  console.log('MỘT Ô NGÃ — CÁC Ô KHÁC VẪN VẼ');
  const ve = [
    () => Promise.resolve('data:image/png;base64,AAA'),
    () => Promise.reject(new Error('WebGL context lost')),
    () => Promise.resolve('data:image/png;base64,CCC'),
  ];
  const kq = await Promise.all(ve.map((f) => veOAnToan(f)));
  ok('cả 3 ô đều trả về, không ô nào treo', kq.length === 3);
  ok('ô 1 có ảnh', kq[0].url !== null);
  ok('ô 3 có ảnh — ô hỏng ĐỨNG GIỮA vẫn không kéo theo', kq[2].url !== null);
  ok('ô 2 không có ảnh', kq[1].url === null);
  ok('ô 2 NÓI RA là nó hỏng, không im lặng', !!kq[1].lyDo && kq[1].lyDo.includes('WebGL context lost'), String(kq[1].lyDo));

  console.log('WEBGL TẮT (máy render trả null) KHÁC HẲN THAM SỐ HỎNG (ném)');
  const tatWebgl = await veOAnToan(async () => null);
  ok('null ⇒ có lý do, không phải chuỗi rỗng', tatWebgl.lyDo === LY_DO_KHONG_WEBGL, String(tatWebgl.lyDo));
  const nem = await veOAnToan(async () => { throw new Error('tải map hỏng'); });
  ok('ném ⇒ lý do KHÁC câu WebGL', nem.lyDo !== LY_DO_KHONG_WEBGL && nem.lyDo!.includes('tải map hỏng'), String(nem.lyDo));
  ok('chuỗi rỗng cũng tính là không vẽ được', (await veOAnToan(async () => '')).url === null);

  console.log('NÉM THỨ KHÔNG PHẢI Error CŨNG PHẢI RA CÂU');
  const la = await veOAnToan(async () => { throw 'hỏng kiểu lạ'; });
  ok('vẫn có câu, không rỗng', typeof la.lyDo === 'string' && la.lyDo.length > 0, String(la.lyDo));

  console.log('MỨC ĐỘ NÓI — còn vân thì nói nhẹ, trống trơn thì nói to');
  ok('không lỗi ⇒ im', loiOMau(true, null).nang === 'khong' && loiOMau(true, null).cau === null);
  ok('còn vân ⇒ nhẹ', loiOMau(true, 'x').nang === 'nhe');
  ok('còn vân ⇒ câu nói rõ đang hiện gì', (loiOMau(true, 'x').cau ?? '').includes('vân 2D'));
  ok('không vân ⇒ nặng', loiOMau(false, 'x').nang === 'nang');
  ok('nặng thì câu phải nói còn lại gì', (loiOMau(false, 'x').cau ?? '').includes('màu phẳng'));
/* Ca 'nang' đến từ HAI ngã (mã chưa có ký hiệu 2D · có mà không dựng nổi tấm vân). Câu chỉ được
   nói phần CHẮC CHẮN ĐÚNG cho cả hai, không được đoán ngã nào. */
ok('nặng thì KHÔNG đoán vì sao mất vân', !(loiOMau(false, 'x').cau ?? '').includes('mã này'), String(loiOMau(false, 'x').cau));

  /* Cho vòng lặp sự kiện quay thêm một nhịp — unhandledRejection bắn ở microtask kế tiếp. */
  await new Promise((r) => setTimeout(r, 50));
  ok('KHÔNG lượt nào rò ra ngoài (đây là ca làm trắng cả kho)', roRi.length === 0, roRi.join(' | '));

  console.log(`\n${pass} pass · ${fail} fail`);
  if (fail > 0) process.exit(1);
})();
