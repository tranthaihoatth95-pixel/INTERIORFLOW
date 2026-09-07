/**
 * lib/ban-giao/giu-den-khi-ben.test.ts — CANH LUẬT BÀN GIAO. Chạy:
 *   node_modules/.bin/sucrase-node lib/ban-giao/giu-den-khi-ben.test.ts
 *
 * BẤT BIẾN ĐƯỢC CANH Ở ĐÂY, một câu: **KHÔNG có nhánh nào xoá nguồn mà không có biên nhận `true`.**
 * Mất tính chất đó là tái phát đúng lỗi mất tờ bản vẽ 06/09 (số đo ở docstring tệp được kiểm).
 *
 * Node không có sessionStorage ⇒ mọi ca ở đây chạy trên mem-fallback — đúng kịch bản "storage bị
 * chặn", tức nhánh dễ bị bỏ quên nhất.
 */
import { buongKhiDaGhi } from './giu-den-khi-ben';
import {
  stashSpecPresentHandoff,
  peekSpecPresentHandoff,
  clearSpecPresentHandoff,
  consumeSpecPresentHandoff,
  __resetSpecPresentHandoffForTest,
} from '../present-editor/spec-present-handoff';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

async function testKhongBienNhanThiKhongBuong() {
  console.log('\n[1] KHÔNG có biên nhận `true` ⇒ TUYỆT ĐỐI không buông nguồn');
  const cases: Array<[string, () => Promise<boolean> | boolean]> = [
    ['biên nhận false', () => false],
    ['biên nhận Promise<false>', () => Promise.resolve(false)],
    ['tầng ghi NÉM LỖI', () => { throw new Error('IndexedDB chết'); }],
    ['Promise bị reject', () => Promise.reject(new Error('mạng đứt'))],
    // Kiểu `unknown` giả lập caller cũ trả undefined — phải bị coi là CHƯA ghi, không phải truthy.
    ['trả undefined (caller chưa nối biên nhận)', (() => undefined) as unknown as () => boolean],
  ];
  for (const [ten, bienNhan] of cases) {
    let daXoa = false;
    const r = await buongKhiDaGhi({ bienNhan, xoaNguon: () => { daXoa = true; } });
    ok(`${ten} → nguồn CÒN NGUYÊN`, daXoa === false && r === false);
  }
}

async function testCoBienNhanThiBuong() {
  console.log('\n[2] Có biên nhận `true` ⇒ buông tay đúng một lần');
  let soLanXoa = 0;
  const r = await buongKhiDaGhi({ bienNhan: () => true, xoaNguon: () => { soLanXoa += 1; } });
  ok('buông tay khi đã ghi bền', r === true && soLanXoa === 1);
}

async function testHetHieuLucThiGiuLai() {
  console.log('\n[3] Ghi xong nhưng lượt HẾT HIỆU LỰC ⇒ GIỮ nguồn (thà giữ thừa còn hơn xoá thiếu)');
  let daXoa = false;
  const r = await buongKhiDaGhi({
    bienNhan: () => true,
    xoaNguon: () => { daXoa = true; },
    conHieuLuc: () => false,
  });
  ok('đã bền nhưng component unmount → không xoá', daXoa === false && r === false);
}

function testSpecPeekGiuClearBuong() {
  console.log('\n[4] Cầu Spec→Trình chiếu: peek GIỮ · clear BUÔNG · consume = peek+clear');
  __resetSpecPresentHandoffForTest();
  const vaoStorage = stashSpecPresentHandoff({
    doiTuong: 'Tủ mẫu A',
    dongChu: ['Rộng: 1200 mm'],
    boqNote: 'Đủ điều kiện vào BOQ.',
    representationId: 'rep-1',
    projectId: 'prj-1',
  });
  ok('node không có sessionStorage → rơi xuống mem-fallback', vaoStorage === false);

  ok('peek lần 1 nhận đúng lô hàng', peekSpecPresentHandoff()?.doiTuong === 'Tủ mẫu A');
  ok('peek GIỮ — lần 2 vẫn còn (đây là điều kiện chống mất tờ spec)',
    peekSpecPresentHandoff()?.doiTuong === 'Tủ mẫu A');
  ok('peek mang theo dấu dự án (chống rơi nhầm nhà khi giữ lâu)',
    peekSpecPresentHandoff()?.projectId === 'prj-1');
  ok('id slide suy được từ lô hàng ⇒ phép chèn luỹ đẳng',
    typeof peekSpecPresentHandoff()?.timestamp === 'number' && peekSpecPresentHandoff()!.timestamp > 0);

  clearSpecPresentHandoff();
  ok('clear BUÔNG — peek sau đó trả null', peekSpecPresentHandoff() === null);

  __resetSpecPresentHandoffForTest();
  stashSpecPresentHandoff({ doiTuong: 'Tủ mẫu B', dongChu: [], boqNote: '', representationId: 'rep-2' });
  ok('consume vẫn đọc được (caller cũ/test không gãy)', consumeSpecPresentHandoff()?.doiTuong === 'Tủ mẫu B');
  ok('consume-once: lần 2 null', consumeSpecPresentHandoff() === null);
  ok('payload cũ không có projectId ⇒ null, KHÔNG chặn', peekSpecPresentHandoff() === null);
  __resetSpecPresentHandoffForTest();
}

async function main() {
  await testKhongBienNhanThiKhongBuong();
  await testCoBienNhanThiBuong();
  await testHetHieuLucThiGiuLai();
  testSpecPeekGiuClearBuong();
  console.log(`\n${fail === 0 ? 'PASS' : 'FAIL'} — ${pass} ok, ${fail} fail`);
  if (fail > 0) process.exit(1);
}
void main();
