/**
 * lib/commands/chinh-lenh-store.test.ts — chạy: node_modules/.bin/sucrase-node lib/commands/chinh-lenh-store.test.ts
 * Store thật (zustand), KHÔNG mock: đặt lệnh → sửa hợp lệ gọi apDung đúng 1 lần · sửa sai không gọi ·
 * xoa() giữ nguyên kết quả · yeuCauFocus khi rỗng báo status thật (không im lặng).
 */
import { useChinhLenh } from './chinh-lenh-store';
import { useCadStore } from '../cad/store';
import type { LenhVuaChay } from './chinh-lenh-vua-chay';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

const S = () => useChinhLenh.getState();
ok('khởi đầu rỗng', S().lenh === null && S().apDung === null);

const before = useCadStore.getState().status;
S().yeuCauFocus();
ok('yeuCauFocus khi rỗng → báo status, không tăng focusSeq', useCadStore.getState().status !== before && S().focusSeq === 0);

const calls: LenhVuaChay[] = [];
S().datLenh({ kind: 'chep', stepMm: 900, copyCount: 1, baseSpanMm: 900 }, { x: 10, y: 20 }, (l) => {
  calls.push(l);
  S().capNhat(l); // đúng đường canvas: tái áp xong mới capNhat
});
ok('datLenh ghi lenh + neo', S().lenh?.kind === 'chep' && S().neo?.x === 10);

const r1 = S().sua('stepMm', '3x');
ok('sua hợp lệ → apDung gọi 1 lần với lệnh mới', r1.ok && calls.length === 1 && calls[0].kind === 'chep' && calls[0].copyCount === 3);
const sauCapNhat = S().lenh;
ok('store phản ánh lệnh sau capNhat', sauCapNhat?.kind === 'chep' && sauCapNhat.copyCount === 3);

const r2 = S().sua('copyCount', 'abc');
ok('sua sai → từ chối kèm lý do, KHÔNG gọi apDung', !r2.ok && calls.length === 1);

S().yeuCauFocus();
ok('yeuCauFocus khi có lệnh → focusSeq tăng', S().focusSeq === 1);

S().xoa();
ok('xoa → rỗng, apDung gỡ', S().lenh === null && S().apDung === null && S().neo === null);
const r3 = S().sua('stepMm', '100');
ok('sua sau xoa → từ chối, không throw', !r3.ok && calls.length === 1);
S().capNhat({ kind: 'doi', stepMm: 1, baseSpanMm: 1 });
ok('capNhat khi rỗng bị bỏ qua (không hồi sinh mặt tiền ma)', S().lenh === null);

console.log(`\n${pass} pass, ${fail} fail`);
if (fail) process.exit(1);
