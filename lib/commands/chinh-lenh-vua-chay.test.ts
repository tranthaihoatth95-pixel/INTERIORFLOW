/**
 * lib/commands/chinh-lenh-vua-chay.test.ts — chạy: node_modules/.bin/sucrase-node lib/commands/chinh-lenh-vua-chay.test.ts
 * Kiểm lõi thuần "Chỉnh lệnh vừa chạy": trường theo lệnh · luật hợp lệ · parity VCB · vị trí bản sao.
 */
import { apDungSua, moTaLenh, tenLenh, truongCuaLenh, viTriBanSao, type LenhVuaChay } from './chinh-lenh-vua-chay';
import { parseVcbToken, applyVcbToMoveCopy } from './vcb';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

const doi: LenhVuaChay = { kind: 'doi', stepMm: 1234.4, baseSpanMm: 1234.4 };
const chep: LenhVuaChay = { kind: 'chep', stepMm: 900, copyCount: 1, baseSpanMm: 900 };
const xoay: LenhVuaChay = { kind: 'xoay', angleDeg: 87.26 };
const offset: LenhVuaChay = { kind: 'offset', distMm: 120 };
const tuong: LenhVuaChay = { kind: 'tuong', thicknessMm: 200, closed: false, segmentCount: 3 };

console.log('\n[1] trường theo lệnh');
ok('Dời: đúng 1 trường stepMm (mm)', truongCuaLenh(doi).map((t) => t.key).join() === 'stepMm' && truongCuaLenh(doi)[0].donVi === 'mm');
ok('Chép: stepMm + copyCount', truongCuaLenh(chep).map((t) => t.key).join() === 'stepMm,copyCount');
ok('Chép: trường stepMm có gợi ý VCB', Boolean(truongCuaLenh(chep)[0].goiY));
ok('Xoay: angleDeg (°)', truongCuaLenh(xoay)[0].key === 'angleDeg' && truongCuaLenh(xoay)[0].donVi === '°');
ok('Offset: distMm', truongCuaLenh(offset)[0].key === 'distMm');
ok('Tường: thicknessMm', truongCuaLenh(tuong)[0].key === 'thicknessMm');
ok('giá trị hiển thị làm tròn mm nguyên', truongCuaLenh(doi)[0].giaTri === 1234);
ok('giá trị hiển thị góc 1 số lẻ', truongCuaLenh(xoay)[0].giaTri === 87.3);
ok('mọi kind có tên song ngữ', (['doi', 'chep', 'xoay', 'offset', 'tuong'] as const).every((k) => tenLenh(k).length === 2));
ok('mô tả Chép nêu số bản + bước', moTaLenh(chep)[0] === 'Chép 1 bản · mỗi bước 900 mm');
ok('mô tả Tường kín nêu (kín)', moTaLenh({ ...tuong, closed: true })[0].includes('(kín)'));

console.log('\n[2] Dời/Chép — parity với VCB bàn phím');
{
  const r = apDungSua(doi, 'stepMm', '2400');
  ok('Dời gõ 2400 → stepMm=2400', r.ok && r.lenh.kind === 'doi' && r.lenh.stepMm === 2400);
  const r2 = apDungSua(doi, 'stepMm', '3x');
  ok('Dời gõ "3x" → từ chối kèm lý do (chỉ Chép)', !r2.ok && r2.lyDo[0].includes('Chép'));
  const r3 = apDungSua(chep, 'stepMm', '3x');
  const expect = applyVcbToMoveCopy({ copyCount: 1, stepMm: 900 }, parseVcbToken('3x'), 900);
  ok('Chép gõ "3x" → y hệt applyVcbToMoveCopy', r3.ok && r3.lenh.kind === 'chep' && r3.lenh.copyCount === expect.copyCount && r3.lenh.stepMm === expect.stepMm);
  const r4 = apDungSua(chep, 'stepMm', '/3');
  ok('Chép gõ "/3" → 3 bản, bước = 300 (giữ tổng 900)', r4.ok && r4.lenh.kind === 'chep' && r4.lenh.copyCount === 3 && r4.lenh.stepMm === 300);
  // chỉnh lại sau "/3": "4x" phải tính từ baseSpan gốc (900), KHÔNG từ bước 300 đã chia.
  const r5 = r4.ok ? apDungSua(r4.lenh, 'stepMm', '4x') : r4;
  ok('sau "/3" gõ "4x" → bước về 900 (không trôi số)', r5.ok && r5.lenh.kind === 'chep' && r5.lenh.copyCount === 4 && r5.lenh.stepMm === 900);
  const r6 = apDungSua(chep, 'copyCount', '5');
  ok('Chép sửa số bản = 5', r6.ok && r6.lenh.kind === 'chep' && r6.lenh.copyCount === 5 && r6.lenh.stepMm === 900);
  ok('số bản 0 → từ chối', !apDungSua(chep, 'copyCount', '0').ok);
  ok('số bản 2.5 → từ chối', !apDungSua(chep, 'copyCount', '2.5').ok);
  ok('Dời không có trường copyCount', !apDungSua(doi, 'copyCount', '2').ok);
  ok('chuỗi rác → từ chối, không throw', !apDungSua(chep, 'stepMm', 'abc').ok);
  ok('dấu phẩy VN "150,5"', (() => { const r = apDungSua(doi, 'stepMm', '150,5'); return r.ok && r.lenh.kind === 'doi' && r.lenh.stepMm === 150.5; })());
}

console.log('\n[3] Xoay · Offset · Tường');
{
  const r = apDungSua(xoay, 'angleDeg', '90');
  ok('Xoay gõ 90', r.ok && r.lenh.kind === 'xoay' && r.lenh.angleDeg === 90);
  const rn = apDungSua(xoay, 'angleDeg', '-45');
  ok('Xoay nhận góc âm', rn.ok && rn.lenh.kind === 'xoay' && rn.lenh.angleDeg === -45);
  ok('Xoay gõ chữ → từ chối', !apDungSua(xoay, 'angleDeg', 'x').ok);
  ok('Xoay góc 0 hợp lệ (đưa về nguyên trạng)', apDungSua(xoay, 'angleDeg', '0').ok);
  const ro = apDungSua(offset, 'distMm', '150');
  ok('Offset gõ 150', ro.ok && ro.lenh.kind === 'offset' && ro.lenh.distMm === 150);
  ok('Offset 0 → từ chối', !apDungSua(offset, 'distMm', '0').ok);
  ok('Offset âm → từ chối (phía đã chọn bằng click)', !apDungSua(offset, 'distMm', '-20').ok);
  const rt = apDungSua(tuong, 'thicknessMm', '110');
  ok('Tường gõ 110 giữ closed/segmentCount', rt.ok && rt.lenh.kind === 'tuong' && rt.lenh.thicknessMm === 110 && rt.lenh.segmentCount === 3 && rt.lenh.closed === false);
  ok('Tường dày 0 → từ chối', !apDungSua(tuong, 'thicknessMm', '0').ok);
  ok('sai trường → từ chối', !apDungSua(tuong, 'stepMm', '100').ok);
}

console.log('\n[4] vị trí bản sao');
{
  const v = viTriBanSao({ kind: 'chep', stepMm: 100, copyCount: 3, baseSpanMm: 100 }, 1, 0);
  ok('3 bản cách 100/200/300 dọc trục x', v.length === 3 && v[2].dx === 300 && v[2].dy === 0);
  const d = viTriBanSao({ kind: 'doi', stepMm: 50, baseSpanMm: 50 }, 0, 1);
  ok('Dời = đúng 1 bản (0,50)', d.length === 1 && d[0].dx === 0 && d[0].dy === 50);
  ok('Xoay không có bản sao', viTriBanSao(xoay, 1, 0).length === 0);
  ok('không đột biến đầu vào', chep.copyCount === 1 && doi.stepMm === 1234.4);
}

console.log(`\n${pass} pass, ${fail} fail`);
if (fail) process.exit(1);
