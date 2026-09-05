/**
 * lib/materials/hang-doi-xem-truoc.test.ts — canh VAN CHI PHÍ (V4, 05/09).
 * Ca đắt nhất: **200 món xếp cùng lúc thì KHÔNG BAO GIỜ có quá 4 lượt chạy song song** — đó là
 * khác biệt giữa "kho vật liệu mở được" và "30 giây 100% CPU" của Revit.
 *
 * Chạy: node_modules/.bin/sucrase-node lib/materials/hang-doi-xem-truoc.test.ts
 */
import { xepLuotXemTruoc, trangThaiHangDoi, TRAN_DONG_THOI } from './hang-doi-xem-truoc';

let pass = 0, fail = 0;
function ok(name: string, cond: boolean, detail?: string) {
  if (cond) pass += 1; else { fail += 1; console.error('  ✗', name, detail ?? ''); }
}
const nghi = (ms: number) => new Promise((r) => setTimeout(r, ms));

(async () => {
  console.log('TRẦN ĐỒNG THỜI — 200 món không làm nổ máy');
  let dinh = 0, dangChay = 0, daChay = 0;
  for (let i = 0; i < 200; i++) {
    xepLuotXemTruoc(async () => {
      dangChay += 1; dinh = Math.max(dinh, dangChay);
      await nghi(2);
      dangChay -= 1; daChay += 1;
    }, 0);
  }
  await nghi(700);
  ok(`đỉnh đồng thời ≤ ${TRAN_DONG_THOI}`, dinh <= TRAN_DONG_THOI, `đỉnh=${dinh}`);
  ok('nhưng vẫn chạy hết 200 việc', daChay === 200, String(daChay));
  ok('hàng đợi rỗng lại sau khi xong', trangThaiHangDoi().dangCho === 0 && trangThaiHangDoi().dangChay === 0);

  console.log('HUỶ ĐƯỢC — cuộn qua thì việc KHÔNG tốn một lượt render nào');
  let chayRoi = 0;
  const huy: (() => void)[] = [];
  for (let i = 0; i < 50; i++) huy.push(xepLuotXemTruoc(async () => { chayRoi += 1; await nghi(2); }, 0));
  for (const h of huy) h();          // huỷ NGAY, trước khi tới lượt
  await nghi(400);
  ok('0 việc đã huỷ được chạy', chayRoi === 0, String(chayRoi));

  console.log('HUỶ MỘT NỬA — phần còn lại vẫn chạy đủ');
  let n = 0;
  const h2: (() => void)[] = [];
  for (let i = 0; i < 20; i++) h2.push(xepLuotXemTruoc(async () => { n += 1; await nghi(1); }, 0));
  for (let i = 0; i < 20; i += 2) h2[i]();
  await nghi(500);
  ok('đúng 10 việc chạy', n === 10, String(n));

  console.log('LỖI MỘT LƯỢT KHÔNG LÀM TẮC HÀNG ĐỢI');
  let sau = 0;
  xepLuotXemTruoc(async () => { throw new Error('WebGL tắt'); }, 0);
  for (let i = 0; i < 8; i++) xepLuotXemTruoc(async () => { sau += 1; }, 0);
  await nghi(400);
  ok('8 việc sau vẫn chạy', sau === 8, String(sau));
  ok('không còn lượt nào kẹt', trangThaiHangDoi().dangChay === 0);
  ok('lượt ngã được ĐẾM, không im lặng tuyệt đối', trangThaiHangDoi().soLoi === 1, String(trangThaiHangDoi().soLoi));

  console.log(`\n${pass} pass · ${fail} fail`);
  if (fail > 0) process.exit(1);
})();
