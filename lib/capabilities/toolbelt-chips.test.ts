/**
 * lib/capabilities/toolbelt-chips.test.ts — khoá WORKING SET của Stage Toolbelt và luồng
 * đề xuất → nhận/bỏ của sổ nguồn.
 *
 * Đặt ở `lib/capabilities/` chứ không ở `lib/commands/`: thứ được kiểm là HỢP ĐỒNG NĂNG LỰC
 * (trần 8 · mờ-kèm-lý-do · không ghi đè im lặng), `toolbar-source.ts` chỉ là cửa đọc.
 */

import assert from 'node:assert';
import { workingSetChips } from '../commands/toolbar-source';
import { TRAN_TOOLBELT, nangLucTheoStage } from './compound';
import {
  boDeXuat,
  datAnhNguon,
  getNguonAnh,
  nhanDeXuat,
  resetNguonAnh,
  themDeXuat,
} from './nguon-anh';
import { dungKeHoach, dungXuatXu, type DeXuatHinhAnh, type YeuCauDung } from './visual-generate';

/* [1] Trần 8 (§2) — Toolbelt không bao giờ được phình quá working set. */
for (const stage of ['cad', 'render', 'present'] as const) {
  const chips = workingSetChips({ stage });
  assert.ok(chips.length <= TRAN_TOOLBELT, `[1] ${stage} vượt trần ${TRAN_TOOLBELT}`);
  assert.equal(chips.length, nangLucTheoStage(stage).length, `[1] ${stage} lệch với bảng năng lực`);
}

/* [2] §9 CẤM NÚT GIẢ — mờ thì BẮT BUỘC có lý do, và lý do phải là câu người đọc được:
       không lộ jargon nội bộ, không rỗng. */
{
  const JARGON = ['node', 'registry', 'store', 'provider', 'undefined', 'null'];
  for (const stage of ['cad', 'render', 'present'] as const) {
    for (const coAnhNguon of [false, true]) {
      for (const c of workingSetChips({ stage, coAnhNguon })) {
        if (c.enabled) {
          assert.equal(c.disabledReason, undefined, `[2] ${c.id} bật mà vẫn mang lý do mờ`);
          continue;
        }
        const ly = c.disabledReason ?? '';
        assert.ok(ly.length > 0, `[2] ${stage}/${c.id} mờ mà KHÔNG có lý do`);
        for (const j of JARGON) {
          assert.ok(!ly.toLowerCase().includes(j), `[2] lý do của ${c.id} lộ jargon "${j}": ${ly}`);
        }
        assert.ok(ly.split(/\s+/).length <= 12, `[2] lý do của ${c.id} dài quá 12 từ: ${ly}`);
      }
    }
  }
}

/* [3] ⭐ Cổng của `visual-generate` PHẢI đến từ `sanSangDung()`, không phải một bản sao câu chữ.
       Kiểm bằng hành vi: đúng câu §26 khi thiếu nguồn, và bật lên khi có nguồn. */
{
  const mo = workingSetChips({ stage: 'cad', coAnhNguon: false }).find((c) => c.id === 'visual-generate');
  assert.equal(mo?.enabled, false);
  assert.equal(mo?.disabledReason, 'Chưa có ảnh nguồn — chọn một ảnh hoặc khung nhìn');

  const bat = workingSetChips({ stage: 'cad', coAnhNguon: true }).find((c) => c.id === 'visual-generate');
  assert.equal(bat?.enabled, true, '[3] có ảnh nguồn thì năng lực phải bật');
  assert.equal(bat?.icon, 'Sparkles', '[3] icon phải đọc từ bảng năng lực');
}

/* [4] Nhãn/ý định lấy nguyên từ bảng năng lực — mặt tiền không được dịch lại. */
{
  for (const c of workingSetChips({ stage: 'render', coAnhNguon: true })) {
    const n = nangLucTheoStage('render').find((x) => x.id === c.id);
    assert.deepEqual(c.label, n?.ten, `[4] nhãn ${c.id} lệch bảng năng lực`);
    assert.deepEqual(c.desc, n?.yDinh, `[4] ý định ${c.id} lệch bảng năng lực`);
  }
}

/* ─────────────── sổ nguồn: đề xuất → nhận / bỏ ─────────────── */

function deXuatGia(id: string, anh: string): DeXuatHinhAnh {
  const yeuCau: YeuCauDung = { anhNguon: 'goc.png', kieuNguon: 'phac', yDinh: '', nac: 'nhanh' };
  return {
    id,
    anh,
    anhTruoc: 'goc.png',
    xuatXu: dungXuatXu({ yeuCau, chuoi: dungKeHoach(yeuCau), creditUocTinh: 4, taoLuc: 1 }),
  };
}

/* [5] ⭐ CẤM GHI ĐÈ IM LẶNG — thêm đề xuất KHÔNG được đụng vào ảnh nguồn. */
{
  resetNguonAnh();
  datAnhNguon('goc.png', 'phac.png');
  themDeXuat(deXuatGia('d1', 'ket-qua.png'));
  const s = getNguonAnh();
  assert.equal(s.anhNguon, 'goc.png', '[5] máy sinh KHÔNG được tự thay ảnh nguồn');
  assert.equal(s.deXuat.length, 1);
  assert.equal(s.daNhan.length, 0);
  assert.equal(s.deXuat[0].xuatXu.trangThaiNhan, 'deXuat');
}

/* [6] NHẬN = cú bấm của người ⇒ mới đổi nguồn, và ghi xuất xứ `daNhan`. Kết quả đã nhận trở
       thành đầu vào đã-định-nghĩa của bước sau (kiểu nguồn chuyển sang ảnh thật). */
{
  nhanDeXuat('d1');
  const s = getNguonAnh();
  assert.equal(s.anhNguon, 'ket-qua.png', '[6] nhận rồi thì kết quả thành nguồn bước kế');
  assert.equal(s.kieuNguon, 'anhThat');
  assert.equal(s.deXuat.length, 0);
  assert.equal(s.daNhan.length, 1);
  assert.equal(s.daNhan[0].xuatXu.trangThaiNhan, 'daNhan');
  assert.equal(s.daNhan[0].xuatXu.chuoiLenh[0], 'ai.sketch2render', '[6] xuất xứ phải theo suốt');
}

/* [7] BỎ = rời khay, KHÔNG đụng nguồn và KHÔNG vào danh sách đã nhận. */
{
  const truoc = getNguonAnh().anhNguon;
  themDeXuat(deXuatGia('d2', 'khong-ung.png'));
  boDeXuat('d2');
  const s = getNguonAnh();
  assert.equal(s.deXuat.length, 0);
  assert.equal(s.daNhan.length, 1, '[7] bỏ không được lọt vào đã nhận');
  assert.equal(s.anhNguon, truoc, '[7] bỏ không được đụng ảnh nguồn');
  resetNguonAnh();
}

console.log('toolbelt-chips: 7 nhóm kiểm — PASS');
