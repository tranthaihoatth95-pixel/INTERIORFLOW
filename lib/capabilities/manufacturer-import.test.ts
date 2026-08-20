/**
 * lib/capabilities/manufacturer-import.test.ts — khoá BA LUẬT CỨNG của đường NGUỒN HÃNG → IDFC:
 *   ① KHÔNG BỊA — không có mã thật thì không có SKU, không có tên hãng, không có kích thước.
 *   ② CHUẨN HOÁ ≠ VẼ LẠI — đổi đơn vị không được đổi con số; không có hình học thì TỪ CHỐI dựng
 *      `.idfc` chứ không suy hộp chữ nhật từ w×d.
 *   ③ DẪN XUẤT PHẢI MANG CỜ `inferred` + `derived-from:` — "không trình bản vẽ dẫn xuất như bản
 *      vẽ của hãng" là DỮ LIỆU, không phải lời hứa trong tài liệu.
 */

import assert from 'node:assert';
import {
  TEN_UNG_VIEN,
  docKichThuoc,
  docMaSanPham,
  doiVeMm,
  dungIdfcTuPhieu,
  dungPhieuUngVien,
  dungRepDanXuat,
  dungRepGoc,
  khoaDanhTinhHang,
  phanLoaiTep,
} from './manufacturer-import';
import { importIdfc } from '../cad/idfc';

/* ══ [1] KHÔNG BỊA SKU ══════════════════════════════════════════════════════════════════════ */
{
  const phieu = dungPhieuUngVien({
    tep: [
      { projectFileId: 'pf1', name: 'ghe-go-anh-1.png', mime: 'image/png' },
      { projectFileId: 'pf2', name: 'ghe-go-datasheet.pdf', mime: 'application/pdf' },
    ],
  });
  assert.equal(phieu.ma, null, '[1] không có mã trong tài liệu ⇒ ma PHẢI null');
  assert.equal(phieu.ten, TEN_UNG_VIEN, '[1] chưa rõ tên ⇒ rơi về "Ứng viên sản phẩm"');
  assert.equal(phieu.hang, null, '[1] không suy hãng từ tên tệp');
  assert.equal(phieu.neoDuocDanhTinh, false, '[1] thiếu hãng+mã ⇒ không neo danh tính');
  assert.ok(
    phieu.canhBao.some((c) => c.includes('Chưa rõ mã sản phẩm')),
    '[1] phải NÓI RA là chưa rõ mã, không im lặng',
  );
  // Không được lộ bất kỳ chuỗi nào trông giống mã sinh từ tên tệp/hash.
  const json = JSON.stringify({ ma: phieu.ma, ten: phieu.ten, hang: phieu.hang });
  assert.ok(!/ghe-go/i.test(json), '[1] tên tệp KHÔNG được rò thành danh tính sản phẩm');
}

/* ══ [2] Mã chỉ nhận khi có NHÃN rõ ─ chuỗi trông-giống-mã thì KHÔNG ════════════════════════ */
{
  assert.equal(docMaSanPham('Art. no: AB-1200/X'), 'AB-1200/X', '[2] có nhãn ⇒ nhận');
  assert.equal(docMaSanPham('Mã sản phẩm: TT-9911'), 'TT-9911', '[2] nhãn tiếng Việt ⇒ nhận');
  assert.equal(docMaSanPham('IMG_20260820_1130.png'), null, '[2] chuỗi trông giống mã, KHÔNG nhãn ⇒ từ chối');
  assert.equal(docMaSanPham('Ghế gỗ sồi tự nhiên'), null, '[2] không có gì ⇒ null');
}

/* ══ [3] CHUẨN HOÁ KHÔNG ĐỔI KÍCH THƯỚC ════════════════════════════════════════════════════ */
{
  assert.equal(doiVeMm(1200, 'mm'), 1200, '[3] mm→mm phải trả về CHÍNH số đó');
  assert.equal(doiVeMm(80, 'cm'), 800, '[3] cm→mm nhân 10, chính xác');
  assert.equal(doiVeMm(1.2, 'm'), 1200, '[3] m→mm nhân 1000, chính xác');
  assert.equal(doiVeMm(0, 'mm'), null, '[3] số vô lý ⇒ null, không đoán');

  const k = docKichThuoc('Kích thước: W1200 D800 H750 mm');
  assert.ok(k, '[3] đọc được khuôn có nhãn');
  assert.deepEqual([k!.w, k!.d, k!.hUp], [1200, 800, 750], '[3] ba số giữ NGUYÊN giá trị của hãng');

  const k2 = docKichThuoc('120x80x75cm');
  assert.deepEqual([k2!.w, k2!.d, k2!.hUp], [1200, 800, 750], '[3] cm quy về mm bằng hệ số nguyên');

  // INCH: đổi là làm tròn ⇒ đổi kích thước của hãng ⇒ TỪ CHỐI.
  assert.equal(docKichThuoc('47.2" x 31.5" x 29.5"'), null, '[3] inch ⇒ từ chối, không làm tròn');
  assert.equal(docKichThuoc('Ghế gỗ sồi, đệm vải'), null, '[3] không có số ⇒ null, không đoán');
}

/* ══ [4] Phiếu ĐẦY ĐỦ khi người lập gói khai tay ════════════════════════════════════════════ */
{
  const phieu = dungPhieuUngVien({
    tep: [
      { projectFileId: 'pf1', name: 'anh-san-pham.png', mime: 'image/png' },
      { projectFileId: 'pf2', name: 'ban-ve-mat-bang.pdf', mime: 'application/pdf' },
    ],
    khai: {
      hang: 'Xưởng Mộc PLACEHOLDER',
      ten: 'Ghế ăn PLACEHOLDER',
      ma: 'PH-CHAIR-01',
      boSuuTap: 'Bộ PLACEHOLDER',
      vatLieu: ['gỗ sồi', 'vải lanh'],
      giayPhep: 'catalogue hãng gửi, dùng nội bộ',
      nguon: 'gói tệp thử — không tải từ mạng',
    },
    chuTaiLieu: 'Kích thước tổng: W1200 D800 H750 mm',
  });
  assert.equal(phieu.ma, 'PH-CHAIR-01');
  assert.equal(phieu.neoDuocDanhTinh, true, '[4] có hãng + mã ⇒ neo được danh tính');
  assert.deepEqual([phieu.kichThuoc!.w, phieu.kichThuoc!.d, phieu.kichThuoc!.hUp], [1200, 800, 750]);
  assert.equal(phieu.cachTheHien.find((t) => t.projectFileId === 'pf2')!.repKind, 'plan', '[4] "mat-bang" ⇒ plan');
  assert.equal(phieu.cachTheHien.find((t) => t.projectFileId === 'pf1')!.repKind, 'image');
  assert.ok(phieu.xuatXu.some((x) => x.startsWith('mã: người lập gói khai tay')), '[4] xuất xứ truy được tận gốc');
}

/* ══ [5] Phân loại tệp — tên thắng MIME, và luôn NÓI vì sao ═════════════════════════════════ */
{
  const t = phanLoaiTep({ projectFileId: 'x', name: 'chair-section.pdf', mime: 'application/pdf' });
  assert.equal(t.repKind, 'section');
  const t2 = phanLoaiTep({ projectFileId: 'y', name: 'catalogue.pdf', mime: 'application/pdf' });
  assert.equal(t2.repKind, 'datasheet', '[5] "catalog" ⇒ datasheet');
  const t3 = phanLoaiTep({ projectFileId: 'z', name: 'abc.pdf', mime: 'application/pdf' });
  assert.ok(t3.vìSao.startsWith('suy từ MIME'), '[5] không dấu hiệu ⇒ khai rõ là SUY');
}

/* ══ [6] DẪN XUẤT PHẢI `inferred` + `derived-from:` ═════════════════════════════════════════ */
{
  const goc = dungRepGoc(
    phanLoaiTep({ projectFileId: 'pf9', name: 'model-3d.png', mime: 'image/png' }),
    { hang: 'PLACEHOLDER', goi: 'gói thử' },
  );
  assert.equal(goc.truthLevel, 'measured', '[6] tệp DO HÃNG cấp ⇒ measured');
  assert.equal(goc.payloadRef, 'projectfile:pf9');

  const danXuat = dungRepDanXuat({
    kind: 'plan',
    payloadRef: 'projectfile:pf9#plan-if-sinh',
    repGocId: 'rep-abc',
    bangNangLuc: 'chieu-truc-giao',
  });
  assert.equal(danXuat.truthLevel, 'inferred', '[6] IF sinh ra ⇒ BẮT BUỘC inferred, không bao giờ measured');
  const p = JSON.parse(danXuat.provenance);
  assert.equal(p.derivedFrom, 'derived-from:rep-abc', '[6] provenance phải trỏ về bản gốc');
  assert.notEqual(danXuat.truthLevel, 'verified', '[6] máy KHÔNG tự ký verified');
}

/* ══ [7] `.idfc` — TỪ CHỐI khi thiếu hình học, thay vì suy hộp từ w×d ═══════════════════════ */
{
  const phieu = dungPhieuUngVien({
    tep: [{ projectFileId: 'pf1', name: 'anh.png', mime: 'image/png' }],
    khai: { hang: 'PLACEHOLDER', ten: 'Ghế PLACEHOLDER', ma: 'PH-01', giayPhep: 'nội bộ' },
    chuTaiLieu: 'W1200 D800 H750 mm',
  });
  const khong = dungIdfcTuPhieu(phieu);
  assert.equal(khong.ok, false, '[7] không có hình học ⇒ TỪ CHỐI dựng .idfc');
  assert.ok(!khong.ok && khong.lyDo.includes('vẽ lại'), '[7] lý do phải nói rõ vì sao từ chối');

  const khongMa = dungIdfcTuPhieu({ ...phieu, ma: null }, { group: 'Phòng ăn', w: 1200, h: 800, prims: [] });
  assert.equal(khongMa.ok, false, '[7] thiếu mã thật ⇒ không dựng .idfc (meta.code không được bịa)');

  // Có hình học THẬT của hãng ⇒ dựng được, và phải round-trip qua importIdfc.
  const co = dungIdfcTuPhieu(phieu, { group: 'Phòng ăn', w: 1200, h: 800, prims: [] });
  assert.equal(co.ok, true, '[7] có geom2d ⇒ dựng được');
  if (co.ok) {
    const doc = importIdfc(co.json);
    assert.ok(doc, '[7] .idfc dựng ra phải NHẬP LẠI được');
    assert.equal(doc!.meta.code, 'PH-01');
    assert.equal(doc!.meta.kind, 'furniture');
    assert.equal(doc!.body.type, 'component');
    assert.equal(doc!.commerce?.sku, 'PH-01');
  }
}

/* ══ [8] Khoá danh tính hãng — system chuẩn hoá, externalId GIỮ NGUYÊN hoa/thường ═══════════ */
{
  const k = khoaDanhTinhHang('Xưởng Mộc PLACEHOLDER', 'AB-12a');
  assert.equal(k!.externalId, 'AB-12a', '[8] mã hãng KHÔNG hạ chữ thường — nhiều hãng phân biệt');
  assert.ok(/^[a-z0-9-]+$/.test(k!.system), '[8] system chuẩn hoá thành slug');
  assert.equal(khoaDanhTinhHang('  ', 'AB'), null, '[8] hãng rỗng ⇒ không có khoá');
}

console.log('manufacturer-import.test.ts — 8 nhóm PASS');
