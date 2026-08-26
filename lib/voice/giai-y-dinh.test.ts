/**
 * lib/voice/giai-y-dinh.test.ts — chạy bằng `node_modules/.bin/sucrase-node`.
 *
 * Ba thứ bộ test này canh, theo đúng thứ tự quan trọng:
 *   ① LỆNH THOẠI GIẢI QUA SỔ LỆNH CHUNG — lệnh nào không có trong sổ thì nói cũng không chạy.
 *   ② KHÔNG ĐỔI SỰ THẬT LẶNG LẼ — mọi ý định đổi bản vẽ đều mang cờ `doiSuThat`, và `thiHanh()`
 *      từ chối chạy khi chưa xác nhận.
 *   ③ TIẾNG VIỆT là đường chính, kể cả khi bộ nhận dạng trả về câu lệch dấu.
 */

import assert from 'assert';
import { giaiBanChu } from './giai-y-dinh';
import { thiHanh, type CuaNhan } from './thi-hanh';
import { canXacNhan, LENH_CHAY_THANG, idMaTrongDanhSachAnToan } from './rui-ro';
import { hapNote } from './sang-ghi-chu';
import { COMMANDS } from '../commands/registry';
import type { BanChu, NguCanhHienTai } from './types';

const NGU: NguCanhHienTai = {
  stage: 'cad',
  mode: 'pro',
  proToolsAllowed: true,
  projectId: 'du-an-1',
  workspaceId: 'ws-2d',
  entityId: 'ent-tuong-07',
};

function noi(van: string, tamThoi = false): BanChu {
  return { van, ngonNgu: 'vi', tamThoi };
}

let soCa = 0;
function ca(ten: string, f: () => void) {
  f();
  soCa++;
  console.log(`  ✓ ${ten}`);
}

console.log('lib/voice/giai-y-dinh.test.ts');

/* ── ① LỆNH giải qua SỔ LỆNH CHUNG ────────────────────────────────────────────────────────── */

ca('[A] "vẽ tường 200" → đúng CommandDef trong sổ, kèm đối số', () => {
  const kq = giaiBanChu(noi('vẽ tường 200'), NGU);
  assert.ok(kq.ok, 'phải giải được');
  assert.strictEqual(kq.dauVao.yDinh.nguCanh, 'lenh');
  if (kq.dauVao.yDinh.nguCanh !== 'lenh') throw new Error('x');
  assert.strictEqual(kq.dauVao.yDinh.commandId, 'cad.draw.wall');
  assert.strictEqual(kq.dauVao.yDinh.arg, '200');
  // Id đó PHẢI có thật trong sổ — không phải chuỗi bịa.
  assert.ok(COMMANDS.some((c) => c.id === 'cad.draw.wall'));
});

ca('[A] đọc thẳng alias gõ tay ("offset") vẫn ra đúng lệnh', () => {
  const kq = giaiBanChu(noi('offset 150'), NGU);
  assert.ok(kq.ok);
  if (!kq.ok || kq.dauVao.yDinh.nguCanh !== 'lenh') throw new Error('x');
  assert.strictEqual(kq.dauVao.yDinh.commandId, 'cad.edit.offset');
  assert.strictEqual(kq.dauVao.yDinh.arg, '150');
});

ca('[A] câu lệch dấu ("do khoang cach") vẫn khớp — bỏ dấu chỉ để SO KHỚP', () => {
  const kq = giaiBanChu(noi('do khoang cach'), NGU);
  assert.ok(kq.ok);
  if (!kq.ok || kq.dauVao.yDinh.nguCanh !== 'lenh') throw new Error('x');
  assert.strictEqual(kq.dauVao.yDinh.commandId, 'cad.dim.measure');
});

ca('[A] ⭐ lệnh KHÔNG có trong sổ thì nói cũng không chạy — không bảng ánh xạ riêng', () => {
  // "mở vật liệu" / "mở Vitals" là lệnh ĐIỀU HƯỚNG; sổ lệnh hôm nay chỉ có 55 lệnh CAD, chưa có
  // chúng. Nếu lane này có bảng riêng thì hai câu dưới đã chạy được — chúng KHÔNG được chạy.
  for (const cau of ['mở vật liệu', 'mở Vitals', 'quay lại bản vẽ']) {
    const kq = giaiBanChu(noi(cau), NGU);
    assert.strictEqual(kq.ok, false, `"${cau}" không được tự chạy`);
    if (kq.ok) throw new Error('x');
    assert.strictEqual(kq.lyDo, 'khong-co-trong-so-lenh');
  }
});

ca('[A] ⭐ cổng `when` của sổ lệnh vẫn thắng: lệnh Pro câm ở chế độ Sơ phác', () => {
  const soPhac: NguCanhHienTai = { ...NGU, mode: 'sketch', proToolsAllowed: false };
  const kq = giaiBanChu(noi('offset 150'), soPhac);
  assert.strictEqual(kq.ok, false, 'thoại KHÔNG được đi vòng qua cổng when của sổ lệnh');
});

ca('[A] hoà điểm thì KHÔNG chọn bừa — báo mập mờ', () => {
  // "kích thước" khớp nhiều nhãn dim (bán kính · đường kính · góc…) ⇒ phải hỏi lại.
  const kq = giaiBanChu(noi('kích thước'), NGU);
  if (kq.ok) throw new Error('đáng lẽ phải mập mờ, lại tự chọn một lệnh');
  assert.strictEqual(kq.lyDo, 'khong-hieu');
  assert.ok((kq.goiY ?? '').includes('cùng khớp'));
});

/* ── ② KHÔNG ĐỔI SỰ THẬT LẶNG LẼ ──────────────────────────────────────────────────────────── */

ca('[B] "tường này dày 120" → ý định thiết kế, LUÔN phải xác nhận', () => {
  const kq = giaiBanChu(noi('tường này dày 120'), NGU);
  assert.ok(kq.ok);
  if (!kq.ok || kq.dauVao.yDinh.nguCanh !== 'y-dinh-thiet-ke') throw new Error('x');
  assert.strictEqual(kq.dauVao.yDinh.truong, 'day');
  assert.strictEqual(kq.dauVao.yDinh.giaTri, 120);
  assert.strictEqual(kq.dauVao.yDinh.donVi, 'mm');
  assert.strictEqual(kq.dauVao.yDinh.neo.entityId, 'ent-tuong-07', 'phải neo vào vật đang chọn');
  assert.strictEqual(kq.dauVao.doiSuThat, true);
});

ca('[B] thiếu con số thì KHÔNG đoán', () => {
  const kq = giaiBanChu(noi('tường này dày hơn'), NGU);
  assert.strictEqual(kq.ok, false);
  if (kq.ok) throw new Error('x');
  assert.strictEqual(kq.lyDo, 'thieu-so');
});

ca('⭐ thiHanh() TỪ CHỐI chạy khi chưa xác nhận — cửa chặn cuối', () => {
  const kq = giaiBanChu(noi('tường này dày 120'), NGU);
  if (!kq.ok) throw new Error('x');
  let daGoi = 0;
  const cua: CuaNhan = { yDinhThietKe: () => void daGoi++ };
  const r1 = thiHanh(kq.dauVao, cua); // chưa xác nhận
  assert.strictEqual(r1.ok, false);
  if (r1.ok) throw new Error('x');
  assert.strictEqual(r1.vuong, 'can-xac-nhan');
  assert.strictEqual(daGoi, 0, 'KHÔNG được chạm vào sự thật khi chưa xác nhận');

  const r2 = thiHanh(kq.dauVao, cua, true); // đã bấm đồng ý
  assert.strictEqual(r2.ok, true);
  assert.strictEqual(daGoi, 1);
});

ca('⭐ FAIL-CLOSED: mọi lệnh trong sổ, trừ danh sách an toàn, đều phải xác nhận', () => {
  for (const c of COMMANDS) {
    const can = canXacNhan({ nguCanh: 'lenh', commandId: c.id, alias: 'X', nhan: c.label[0] });
    assert.strictEqual(
      can,
      !LENH_CHAY_THANG.includes(c.id),
      `${c.id}: phân loại rủi ro sai — thêm lệnh mới phải rơi vào nhánh phải-xác-nhận`,
    );
  }
});

ca('danh sách an toàn không có id ma', () => {
  assert.deepStrictEqual(idMaTrongDanhSachAnToan(), []);
});

ca('undo/redo CỐ Ý không nằm trong danh sách chạy thẳng', () => {
  assert.ok(!LENH_CHAY_THANG.includes('cad.sel.undo'));
  assert.ok(!LENH_CHAY_THANG.includes('cad.sel.redo'));
  assert.ok(!LENH_CHAY_THANG.includes('cad.sel.delete'));
});

ca('bản chữ TẠM không bao giờ giải ra ý định', () => {
  const kq = giaiBanChu(noi('vẽ tường 200', true), NGU);
  assert.strictEqual(kq.ok, false);
  if (kq.ok) throw new Error('x');
  assert.strictEqual(kq.lyDo, 'ban-tam');
});

/* ── ③ GHI CHÚ NEO ────────────────────────────────────────────────────────────────────────── */

ca('[C] "ghi chú chỗ này cần kiểm lại cao độ" → ghi chú neo, giữ NGUYÊN VĂN có dấu', () => {
  const kq = giaiBanChu(noi('ghi chú chỗ này cần kiểm lại cao độ'), NGU);
  assert.ok(kq.ok);
  if (!kq.ok || kq.dauVao.yDinh.nguCanh !== 'ghi-chu') throw new Error('x');
  assert.strictEqual(kq.dauVao.yDinh.noiDung, 'chỗ này cần kiểm lại cao độ');
  assert.strictEqual(kq.dauVao.yDinh.neo.entityId, 'ent-tuong-07');
  assert.strictEqual(kq.dauVao.yDinh.neo.projectId, 'du-an-1');
  assert.strictEqual(kq.dauVao.doiSuThat, false, 'ghi chú không đổi sự thật dự án');
});

ca('[C] ghi chú đi tới ĐÚNG cửa host khai, không có kho của riêng thoại', () => {
  const kq = giaiBanChu(noi('ghi chú kiểm lại cao độ trần'), NGU);
  if (!kq.ok) throw new Error('x');
  const nhan: string[] = [];
  const r = thiHanh(kq.dauVao, { ghiChu: (d) => nhan.push((d.yDinh as { noiDung: string }).noiDung) });
  assert.strictEqual(r.ok, true);
  assert.deepStrictEqual(nhan, ['kiểm lại cao độ trần']);
});

ca('[C] host CHƯA khai cửa thì nói thẳng, không nuốt câu', () => {
  const kq = giaiBanChu(noi('ghi chú thử'), NGU);
  if (!kq.ok) throw new Error('x');
  const r = thiHanh(kq.dauVao, {});
  assert.strictEqual(r.ok, false);
  if (r.ok) throw new Error('x');
  assert.strictEqual(r.vuong, 'chua-co-cua');
});

ca('[C] ⭐ hạ xuống kho SẴN CÓ (HomeNote), và khai thẳng phần neo chưa lưu được', () => {
  const kq = giaiBanChu(noi('ghi chú kiểm lại cao độ'), NGU);
  if (!kq.ok) throw new Error('x');
  const h = hapNote(kq.dauVao);
  assert.ok(h);
  assert.strictEqual(h.note.projectId, 'du-an-1');
  assert.strictEqual(h.note.text, 'kiểm lại cao độ');
  // Kho hiện có KHÔNG có ô cho entityId ⇒ phải khai ra, không được im lặng đánh rơi.
  assert.ok(h.neoChuaLuuDuoc.includes('entityId'));
  // Và tuyệt đối không nhét id vào chuỗi chữ cho đủ chỗ.
  assert.ok(!h.note.text.includes('ent-tuong-07'));
});

/* ── D · E ────────────────────────────────────────────────────────────────────────────────── */

ca('[D] "ghim lại thiếu ghi chú cao độ" → soát duyệt', () => {
  const kq = giaiBanChu(noi('ghim lại thiếu ghi chú cao độ'), NGU);
  assert.ok(kq.ok);
  if (!kq.ok) throw new Error('x');
  assert.strictEqual(kq.dauVao.yDinh.nguCanh, 'soat-duyet');
});

ca('[E] "tìm ghế gỗ sồi trong thư viện" → tìm kiếm, đúng kho', () => {
  const kq = giaiBanChu(noi('tìm ghế gỗ sồi trong thư viện'), NGU);
  assert.ok(kq.ok);
  if (!kq.ok || kq.dauVao.yDinh.nguCanh !== 'tim-kiem') throw new Error('x');
  assert.strictEqual(kq.dauVao.yDinh.tuKhoa, 'ghế gỗ sồi trong thư viện');
  assert.strictEqual(kq.dauVao.yDinh.kho, 'thu-vien');
  assert.strictEqual(kq.dauVao.doiSuThat, false);
});

/* ── HỢP ĐỒNG DÙNG CHUNG ──────────────────────────────────────────────────────────────────── */

ca('⭐ chữ GÕ và GIỌNG NÓI ra cùng một hợp đồng, khác đúng một chữ `nguon`', () => {
  const a = giaiBanChu(noi('vẽ tường 200'), NGU, 'giong-noi');
  const b = giaiBanChu({ ...noi('vẽ tường 200') }, NGU, 'chu-go');
  if (!a.ok || !b.ok) throw new Error('x');
  assert.deepStrictEqual(a.dauVao.yDinh, b.dauVao.yDinh);
  assert.strictEqual(a.dauVao.doiSuThat, b.dauVao.doiSuThat);
  assert.strictEqual(a.dauVao.nguon, 'giong-noi');
  assert.strictEqual(b.dauVao.nguon, 'chu-go');
});

console.log(`  → ${soCa} ca PASS`);
