/**
 * lib/capabilities/visual-generate.test.ts — khoá LUẬT của tầng điều phối, không chỉ khoá hành vi.
 *
 * Ba thứ ở đây là RÀNG BUỘC KIẾN TRÚC, hỏng là hỏng nguyên tắc chứ không phải hỏng một tính năng:
 *   [3] chuỗi lệnh KHÔNG được chứa node ngoài `lenhNoiBo` đã khai (chống island);
 *   [6] xuất xứ khởi tạo LUÔN `deXuat` (chống ghi đè im lặng);
 *   [5] tiến trình trong-một-bước LUÔN không-đo-được (chống bịa %).
 */

import assert from 'node:assert';
import {
  NHAN_KIEU_NGUON,
  VISUAL_GENERATE_ID,
  boKetQua,
  chuoiHopLe,
  dungKeHoach,
  dungXuatXu,
  lenhNoiBoChoPhep,
  loiHienThi,
  mucSuThatDauRa,
  nhanKetQua,
  sanSangDung,
  tienTrinhCaLuot,
  tienTrinhTrongBuoc,
  type KieuNguon,
  type TrangThaiDung,
  type YeuCauDung,
} from './visual-generate';
import { nangLucTheoId } from './compound';

const yc = (p: Partial<YeuCauDung> = {}): YeuCauDung => ({
  anhNguon: 'data:image/png;base64,AAA',
  kieuNguon: 'phac',
  yDinh: 'phòng khách gỗ sồi',
  nac: 'nhanh',
  ...p,
});

/* [1] Mỗi kiểu nguồn chọn ĐÚNG một node gốc — đây là toàn bộ giá trị của "gộp": người dùng nói
       nguồn là gì, máy chọn hộ FLUX Canny hay FLUX Depth. */
{
  const mong: Record<KieuNguon, string> = {
    phac: 'ai.sketch2render',
    khoiTrang: 'ai.clay2render',
    anhThat: 'ai.styletransfer',
    phongTrong: 'ai.emptystaging',
  };
  for (const [kieu, node] of Object.entries(mong) as [KieuNguon, string][]) {
    const chuoi = dungKeHoach(yc({ kieuNguon: kieu }));
    assert.equal(chuoi.length, 1, `[1] ${kieu}: mặc định phải đúng 1 bước`);
    assert.equal(chuoi[0].node, node, `[1] ${kieu} phải chọn ${node}`);
    assert.equal(chuoi[0].vaiTro, 'goc');
  }
  // Mọi kiểu nguồn đều có nhãn song ngữ — thiếu nhãn là lộ khoá kỹ thuật ra giao diện.
  for (const k of Object.keys(mong) as KieuNguon[]) {
    assert.equal(NHAN_KIEU_NGUON[k].length, 2, `[1] thiếu nhãn [vi,en] cho ${k}`);
  }
}

/* [2] Thứ tự bước: phóng to LUÔN đứng cuối. Phóng trước rồi vẽ lại là trả tiền pixel to cho một
       bước sẽ ghi đè toàn bộ ảnh. */
{
  const chuoi = dungKeHoach(yc({ doiAnhSang: 'Sunset', nangCap: true }));
  assert.deepEqual(
    chuoi.map((b) => b.node),
    ['ai.sketch2render', 'ai.relight', 'ai.upscale'],
    '[2] sai thứ tự chuỗi',
  );
  assert.equal(chuoi[1].thamSo.lighting, 'Sunset', '[2] tham số ánh sáng phải truyền xuống node');
}

/* [3] ⭐ CHỐNG ISLAND — mọi node trong mọi kế hoạch phải nằm trong `lenhNoiBo` của bảng năng lực.
       Đây là chỗ tầng điều phối bị cấm tự chế tên node. */
{
  const chophep = new Set(lenhNoiBoChoPhep());
  assert.ok(chophep.size > 0, '[3] không đọc được lenhNoiBo từ compound.ts');
  const kieu: KieuNguon[] = ['phac', 'khoiTrang', 'anhThat', 'phongTrong'];
  for (const k of kieu) {
    for (const anhSang of ['', 'Daylight']) {
      for (const nangCap of [false, true]) {
        const chuoi = dungKeHoach(yc({ kieuNguon: k, doiAnhSang: anhSang || undefined, nangCap }));
        assert.ok(chuoiHopLe(chuoi), `[3] kế hoạch (${k}/${anhSang}/${nangCap}) có node ngoài phạm vi`);
      }
    }
  }
  // Node lạ phải bị chặn — nếu không thì [3] chỉ là lời khen suông.
  assert.equal(
    chuoiHopLe([{ node: 'ai.khongtontai', vaiTro: 'goc', thamSo: {} }]),
    false,
    '[3] chuoiHopLe phải TỪ CHỐI node lạ',
  );
  // `ai.materialswap` có trong lenhNoiBo nhưng CỐ Ý không bao giờ tự vào chuỗi (nó đòi mask).
  assert.ok(chophep.has('ai.materialswap'), '[3] tiền đề đổi: materialswap không còn trong lenhNoiBo');
  const moiKeHoach = kieu.flatMap((k) => dungKeHoach(yc({ kieuNguon: k, nangCap: true, doiAnhSang: 'Sunset' })));
  assert.ok(
    !moiKeHoach.some((b) => b.node === 'ai.materialswap'),
    '[3] materialswap đòi mask — không được tự chui vào chuỗi (job sẽ lỗi mà vẫn tiêu credit)',
  );
}

/* [4] Cổng: thiếu ảnh nguồn ⇒ mờ, kèm ĐÚNG câu §26. Một chỗ quyết định duy nhất cho cả nút lẫn
       cửa duyệt — nên câu chữ khoá luôn ở đây. */
{
  const chua = sanSangDung({ coAnhNguon: false });
  assert.equal(chua.sanSang, false);
  assert.equal(chua.lyDo?.[0], 'Chưa có ảnh nguồn — chọn một ảnh hoặc khung nhìn');
  assert.ok(chua.lyDo?.[1], '[4] thiếu bản tiếng Anh');
  assert.equal(sanSangDung({ coAnhNguon: true }).sanSang, true);
}

/* [5] ⭐ CHỐNG BỊA % — trong-một-bước KHÔNG BAO GIỜ đo được; cả-lượt đo được vì đếm bước là thật. */
{
  assert.equal(tienTrinhTrongBuoc().doDuoc, false, '[5] tiến trình trong bước phải KHÔNG đo được');

  const t0 = tienTrinhCaLuot({ trangThai: 'running', soBuocXong: 0, tongBuoc: 0 });
  assert.equal(t0.doDuoc, false, '[5] tổng bước 0 ⇒ không đo được, KHÔNG phải 0%');

  // Chuỗi 1 bước: con số 0% đúng về số học nhưng đứng yên suốt lượt ⇒ đọc ra "treo", không mang
  // tin. Không bày ra là đúng, và đây là ranh giới dễ bị nới nhất nên khoá lại.
  const t1buoc = tienTrinhCaLuot({ trangThai: 'running', soBuocXong: 0, tongBuoc: 1 });
  assert.equal(t1buoc.doDuoc, false, '[5] chuỗi 1 bước ⇒ không đo được');

  const t1 = tienTrinhCaLuot({ trangThai: 'running', soBuocXong: 1, tongBuoc: 2 });
  assert.equal(t1.doDuoc, true);
  assert.equal(t1.doDuoc && t1.pct, 50);
}

/* [6] ⭐ CHỐNG GHI ĐÈ IM LẶNG — xuất xứ sinh ra LUÔN là đề xuất; chỉ hàm-của-cú-bấm mới đổi. */
{
  const yeuCau = yc({ nguonId: 'ent_42', nguonRevision: 'r3', nangCap: true });
  const chuoi = dungKeHoach(yeuCau);
  const x = dungXuatXu({ yeuCau, chuoi, creditUocTinh: 6, taoLuc: 1_700_000_000 });

  assert.equal(x.trangThaiNhan, 'deXuat', '[6] xuất xứ phải khởi tạo là đề xuất');
  assert.equal(x.nangLucId, VISUAL_GENERATE_ID);
  assert.equal(x.nguon.id, 'ent_42');
  assert.equal(x.nguon.revision, 'r3', '[6] revision nguồn phải được giữ');
  assert.deepEqual(x.chuoiLenh, ['ai.sketch2render', 'ai.upscale']);
  assert.equal(x.creditUocTinh, 6);
  assert.equal(x.taoLuc, 1_700_000_000);
  assert.equal(x.thamSo.yDinh, 'phòng khách gỗ sồi', '[6] ý định người dùng phải vào xuất xứ');
  // provider/model bỏ trống khi đường chạy cũ không trả về — thà trống còn hơn bịa.
  assert.equal(x.provider, undefined);
  assert.equal(x.model, undefined);

  assert.equal(nhanKetQua(x).trangThaiNhan, 'daNhan');
  assert.equal(boKetQua(x).trangThaiNhan, 'daBo');
  assert.equal(x.trangThaiNhan, 'deXuat', '[6] nhận/bỏ phải trả bản MỚI, không sửa tại chỗ');
}

/* [7] Từ vựng trạng thái mượn nguyên `RunStatus` + `cancelled` — không đẻ job model thứ hai.
       Test này canh cho hai bên không lệch nhau khi ai đó thêm trạng thái ở một phía. */
{
  const tuLibTypes = ['idle', 'queued', 'running', 'done', 'error'];
  const cuaFlowRun = ['cancelled'];
  const cua: TrangThaiDung[] = ['idle', 'queued', 'running', 'done', 'error', 'cancelled'];
  assert.deepEqual([...cua].sort(), [...tuLibTypes, ...cuaFlowRun].sort(), '[7] từ vựng trạng thái lệch');
}

/* [8] Mức sự thật đọc TỪ bảng năng lực, không khai lại. Ảnh ⇒ không mang con số nào ⇒ không vào BOQ. */
{
  assert.equal(mucSuThatDauRa(), 'khongPhaiSoDo');
  assert.equal(nangLucTheoId(VISUAL_GENERATE_ID)?.deXuat, true, '[8] năng lực phải khai deXuat=true');
}

/* [9] §27 AN TOÀN DEMO — nhà cung cấp chết thì hiện lỗi THẬT, không im lặng, không giả thành công.
       Nhánh này khó tái hiện trên trình duyệt (phải chặn mạng) nên phải khoá bằng test. */
{
  // Câu thật của nhà cung cấp (đã qua `friendlyAiError`) được ưu tiên tuyệt đối.
  assert.equal(
    loiHienThi('error', 'Backend AI chưa chạy / không kết nối được. Bật ComfyUI (cổng 8188) rồi thử lại.'),
    'Backend AI chưa chạy / không kết nối được. Bật ComfyUI (cổng 8188) rồi thử lại.',
    '[9] không được nuốt câu thật của nhà cung cấp',
  );
  // Không có câu nào từ nhà cung cấp thì vẫn PHẢI nói một điều gì đó — im lặng là ca tệ nhất.
  for (const trong of [undefined, '', '   ']) {
    const s = loiHienThi('error', trong);
    assert.ok(s.length > 0, '[9] lỗi rỗng ⇒ giao diện im lặng, cấm');
    assert.ok(!/success|thành công/i.test(s), '[9] tuyệt đối không được đọc ra như thành công');
  }
  assert.equal(loiHienThi('cancelled', 'lỗi cũ còn sót'), 'Đã huỷ lượt dựng.', '[9] huỷ ≠ lỗi');
}

console.log('visual-generate: 9 nhóm kiểm — PASS');
