/**
 * lib/boq/compute.test.ts — BOQ ENGINE: 3 ca bắt buộc (chỉ đạo gốc 02/08) + vài ca phụ cho 2 lý
 * do lỗi còn lại (spec-not-found / missing-priceVnd) để phủ hết `BoqErrorReason`. Chạy:
 *   node_modules/.bin/sucrase-node lib/boq/compute.test.ts
 */
import { computeBoq } from './compute';
import { emptyDoc, type Doc, type HatchEntity } from '../cad/model';
import type { MaterialSpecLite } from './model';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

let seq = 0;
/** Hatch hình chữ nhật trục thẳng (axis-aligned) rộng wMm × sâu dMm (mm), gốc tại `at` (mặc định
 * {0,0}) — shoelace ra ĐÚNG w×d bất kể vị trí, dễ đối chiếu tay. Tham số `at` thêm ở BOQ v2 (Việc
 * 3, 02/08) để dựng được nhiều phòng KHÔNG chồng lên nhau trong cùng 1 test (trước đó mọi
 * `rectHatch()` đều đặt tại gốc (0,0) — vô hại khi engine chỉ cộng diện tích, nhưng SẼ giả-chồng-
 * lấn khi thêm kiểm tra overlap ở [7]/[7b] — xem test [2] đã cập nhật `at` cho đúng ý "nhiều
 * PHÒNG" thay vì nhiều hình vẽ chồng khít nhau). */
function rectHatch(
  wMm: number,
  dMm: number,
  extra?: Partial<HatchEntity>,
  at: { x: number; y: number } = { x: 0, y: 0 },
): HatchEntity {
  seq += 1;
  return {
    id: `h${seq}`,
    type: 'hatch',
    layer: 'l-floor',
    solid: true,
    points: [
      { x: at.x, y: at.y },
      { x: at.x + wMm, y: at.y },
      { x: at.x + wMm, y: at.y + dMm },
      { x: at.x, y: at.y + dMm },
    ],
    ...extra,
  };
}

function docWith(...ents: HatchEntity[]): Doc {
  const doc = emptyDoc();
  doc.entities.push(...ents);
  return doc;
}

const SAN_GO: MaterialSpecLite = {
  id: 'spec-san-go',
  name: 'Sàn gỗ công nghiệp',
  vendor: 'An Cường',
  sku: 'AC-SG-08',
  unit: 'm2',
  priceVnd: 300_000,
  wastagePercent: 5,
};

/* ═══ [1] 1 phòng 1 vật liệu ═══ */
console.log('\n[1] 1 phòng 1 vật liệu');
{
  const h = rectHatch(2000, 3000, { specId: SAN_GO.id }); // 2m×3m = 6m²
  const res = computeBoq(docWith(h), [SAN_GO]);
  ok('0 lỗi', res.errors.length === 0);
  ok('1 dòng BOQ', res.rows.length === 1);
  ok('m² đúng 6', res.rows[0]?.m2 === 6);
  ok('matId đúng', res.rows[0]?.matId === 'spec-san-go');
  ok('ten/ncc/ma đúng', res.rows[0]?.ten === 'Sàn gỗ công nghiệp' && res.rows[0]?.ncc === 'An Cường' && res.rows[0]?.ma === 'AC-SG-08');
  ok('đơn giá đúng', res.rows[0]?.donGia === 300_000);
  ok('hao hụt % đúng', res.rows[0]?.haoHutPhanTram === 5);
  // thành tiền = 6 × 1.05 × 300.000 = 1.890.000
  ok('thành tiền đúng (6 × 1.05 × 300.000 = 1.890.000)', res.rows[0]?.thanhTien === 1_890_000);
  ok('entityIds trỏ đúng entity', res.rows[0]?.entityIds.length === 1 && res.rows[0]?.entityIds[0] === h.id);
  ok('totalAmount = thành tiền dòng duy nhất', res.totalAmount === 1_890_000);
}

/* ═══ [2] nhiều phòng chung vật liệu — PHẢI gộp thành 1 dòng ═══ */
console.log('\n[2] nhiều phòng chung vật liệu (gộp)');
{
  const GACH: MaterialSpecLite = {
    id: 'spec-gach', name: 'Gạch ceramic 60x60', vendor: 'Viglacera', sku: 'VG-6060',
    unit: 'm2', priceVnd: 200_000, wastagePercent: 0,
  };
  // 3 phòng THẬT SỰ tách biệt (at khác nhau) — trước BOQ v2 cả 3 đều mặc định đặt tại gốc
  // (0,0), vô hại lúc đó vì engine chỉ cộng diện tích; nay dựng đúng vị trí để không tự đụng
  // kiểm tra chồng lấn mới thêm ở [7].
  const hA = rectHatch(2000, 3000, { specId: GACH.id }, { x: 0, y: 0 }); // phòng A 6m²
  const hB = rectHatch(4000, 2000, { specId: GACH.id }, { x: 5000, y: 0 }); // phòng B 8m² — cách xa A
  const hC = rectHatch(1000, 1000, { specId: GACH.id }, { x: 0, y: 5000 }); // phòng C 1m² — cách xa A/B
  const res = computeBoq(docWith(hA, hB, hC), [GACH]);
  ok('0 lỗi', res.errors.length === 0);
  ok('GỘP 3 phòng thành đúng 1 dòng (không phải 3)', res.rows.length === 1);
  ok('m² gộp đúng 6+8+1=15', res.rows[0]?.m2 === 15);
  ok('entityIds gộp đủ 3 vùng', res.rows[0]?.entityIds.length === 3 &&
    [hA.id, hB.id, hC.id].every((id) => res.rows[0]?.entityIds.includes(id)));
  // hao hụt 0% ⇒ thành tiền = 15 × 200.000 = 3.000.000
  ok('thành tiền đúng (15 × 200.000 = 3.000.000)', res.rows[0]?.thanhTien === 3_000_000);
  ok('totalAmount đúng', res.totalAmount === 3_000_000);
}

/* ═══ [3] vùng thiếu matId — PHẢI báo lỗi, KHÔNG tính bừa ═══ */
console.log('\n[3] vùng thiếu matId → báo lỗi');
{
  const hNoSpec = rectHatch(3000, 3000); // 9m² nhưng KHÔNG gán specId
  const hEmptySpec = rectHatch(1000, 1000, { specId: '' }); // chuỗi rỗng — coi như thiếu
  const res = computeBoq(docWith(hNoSpec, hEmptySpec), [SAN_GO]);
  ok('0 dòng BOQ (không tính bừa)', res.rows.length === 0);
  ok('totalAmount = 0', res.totalAmount === 0);
  ok('có đúng 1 lỗi missing-specId (gộp)', res.errors.length === 1 && res.errors[0]?.reason === 'missing-specId');
  ok('lỗi liệt kê đủ 2 entity thiếu specId', res.errors[0]?.entityIds.length === 2 &&
    [hNoSpec.id, hEmptySpec.id].every((id) => res.errors[0]?.entityIds.includes(id)));
  ok('message tiếng Việt có nội dung', typeof res.errors[0]?.message === 'string' && res.errors[0]!.message.length > 0);
}

/* ═══ [4] phụ — specId lạ (không khớp spec nào truyền vào) ═══ */
console.log('\n[4] specId lạ → spec-not-found (không tính bừa)');
{
  const h = rectHatch(2000, 2000, { specId: 'spec-da-xoa' }); // 4m², specId không có trong specs[]
  const res = computeBoq(docWith(h), [SAN_GO]); // SAN_GO không khớp id này
  ok('0 dòng BOQ', res.rows.length === 0);
  ok('1 lỗi spec-not-found', res.errors.length === 1 && res.errors[0]?.reason === 'spec-not-found');
  ok('lỗi trỏ đúng matId', res.errors[0]?.matId === 'spec-da-xoa');
  ok('lỗi trỏ đúng entity', res.errors[0]?.entityIds[0] === h.id);
}

/* ═══ [5] phụ — spec khớp nhưng priceVnd null ("chưa có giá") ═══ */
console.log('\n[5] priceVnd null → missing-priceVnd (không đoán giá)');
{
  const CHUA_CO_GIA: MaterialSpecLite = {
    id: 'spec-chua-co-gia', name: 'Đá marble nhập khẩu', vendor: null, sku: null,
    unit: 'm2', priceVnd: null, wastagePercent: 8,
  };
  const h = rectHatch(2000, 2000, { specId: CHUA_CO_GIA.id }); // 4m²
  const res = computeBoq(docWith(h), [CHUA_CO_GIA]);
  ok('0 dòng BOQ', res.rows.length === 0);
  ok('1 lỗi missing-priceVnd', res.errors.length === 1 && res.errors[0]?.reason === 'missing-priceVnd');
  ok('lỗi nêu đúng tên vật liệu', res.errors[0]!.message.includes('Đá marble nhập khẩu'));
}

/* ═══ [6] phụ — ncc/ma rỗng khi spec không có vendor/sku (null-safe, không "null" hiện ra bảng) ═══ */
console.log('\n[6] vendor/sku null → chuỗi rỗng, không hiện "null"');
{
  const SPEC_TOI_GIAN: MaterialSpecLite = {
    id: 'spec-toi-gian', name: 'Sơn nước nội thất', vendor: null, sku: null,
    unit: 'm2', priceVnd: 50_000, wastagePercent: null,
  };
  const h = rectHatch(1000, 1000, { specId: SPEC_TOI_GIAN.id }); // 1m²
  const res = computeBoq(docWith(h), [SPEC_TOI_GIAN]);
  ok('ncc rỗng (không phải null/undefined)', res.rows[0]?.ncc === '');
  ok('ma rỗng', res.rows[0]?.ma === '');
  ok('wastagePercent null coi như 0%', res.rows[0]?.haoHutPhanTram === 0);
  ok('thành tiền = 1 × 50.000 (không hao hụt)', res.rows[0]?.thanhTien === 50_000);
}

/* ═══ [7] BOQ v2 — 2 vùng CÙNG vật liệu ĐÈ HẲN lên nhau → báo lỗi, KHÔNG cộng khống diện tích ═══ */
console.log('\n[7] 2 vùng cùng vật liệu chồng lấn thật → overlapping-region');
{
  const hOv1 = rectHatch(4000, 4000, { specId: SAN_GO.id }, { x: 0, y: 0 }); // 4×4m, tâm (2000,2000)
  const hOv2 = rectHatch(4000, 4000, { specId: SAN_GO.id }, { x: 1000, y: 1000 }); // dời (1,1)m — tâm (3000,3000) nằm HẲN trong hOv1
  const res = computeBoq(docWith(hOv1, hOv2), [SAN_GO]);
  ok('0 dòng BOQ (không cộng khống diện tích chồng lấn)', res.rows.length === 0);
  ok('totalAmount = 0', res.totalAmount === 0);
  const ovErr = res.errors.find((e) => e.reason === 'overlapping-region');
  ok('có đúng 1 lỗi overlapping-region', res.errors.length === 1 && !!ovErr);
  ok('lỗi trỏ đúng matId', ovErr?.matId === SAN_GO.id);
  ok('lỗi liệt kê đủ 2 entity chồng lấn', ovErr?.entityIds.length === 2 &&
    [hOv1.id, hOv2.id].every((id) => ovErr?.entityIds.includes(id)));
  ok('message tiếng Việt có nội dung', typeof ovErr?.message === 'string' && (ovErr?.message.length ?? 0) > 0);
}

/* ═══ [7b] 2 vùng CÙNG vật liệu chỉ LIỀN KỀ (chung 1 cạnh, KHÔNG chồng lấn) → KHÔNG báo nhầm ═══ */
console.log('\n[7b] 2 phòng liền kề chung 1 cạnh tường → KHÔNG báo nhầm chồng lấn');
{
  // Ca thật hay gặp NHẤT trong bản vẽ mặt bằng: 2 phòng cùng vật liệu sàn, mép hatch trùng
  // đúng đường tường chung — heuristic tâm-trong-đa-giác PHẢI phân biệt được ca này với [7].
  const hAdjA = rectHatch(3000, 3000, { specId: SAN_GO.id }, { x: 0, y: 0 }); // 3×3m
  const hAdjB = rectHatch(3000, 3000, { specId: SAN_GO.id }, { x: 3000, y: 0 }); // liền ngay cạnh x=3000, không chồng
  const res = computeBoq(docWith(hAdjA, hAdjB), [SAN_GO]);
  ok('KHÔNG có lỗi overlapping-region', !res.errors.some((e) => e.reason === 'overlapping-region'));
  ok('vẫn gộp đúng 1 dòng', res.rows.length === 1);
  ok('m² gộp đúng 9+9=18 (không mất phòng nào)', res.rows[0]?.m2 === 18);
}

/* ═══ [8] BOQ v2 — đơn giá theo đơn vị KHÁC m² → CHƯA hỗ trợ, khoá hành vi hiện tại tường minh ═══ */
console.log('\n[8] spec.unit khác "m2" → CHƯA rẽ nhánh, vẫn tính theo diện tích (ghi rõ giới hạn)');
{
  // ProductSpec.unit ('m2'|'m'|'cai'|'bo'|'m3'...) là field TỰ DO — compute.ts hiện KHÔNG đọc
  // giá trị này để đổi cách tính (không có nhánh "tính theo chiều dài/số lượng/thể tích"). Test
  // này KHOÁ hành vi v1/v2 hiện tại: dù spec khai unit='m' (mét dài, vd nẹp chân tường), engine
  // vẫn tính theo m² vùng tô như bình thường — không throw, không tự "đoán" cách tính khác. Đây
  // là quyết định phạm vi CÓ CHỦ Ý (xem BAO-CAO-PHU.md "Việc 3b") — KHÔNG tự thêm logic đo chiều
  // dài/thể tích/số lượng khi chưa có ca yêu cầu rõ + chưa có nơi tiêu thụ (UI) cho việc đó.
  const NEP_CHAN_TUONG: MaterialSpecLite = {
    id: 'spec-nep-m', name: 'Nẹp chân tường nhôm', vendor: 'ABC', sku: 'NCT-01',
    unit: 'm', priceVnd: 45_000, wastagePercent: 0, // ý định thật: 45.000đ/MÉT DÀI
  };
  const h = rectHatch(2000, 3000, { specId: NEP_CHAN_TUONG.id }); // 6m² — KHÔNG phải 6m dài
  const res = computeBoq(docWith(h), [NEP_CHAN_TUONG]);
  ok('vẫn ra 1 dòng (không throw/skip vì unit lạ)', res.rows.length === 1);
  ok('m² vẫn = diện tích vùng tô (6), KHÔNG hiểu unit="m"', res.rows[0]?.m2 === 6);
  ok('thành tiền = m² × đơn giá (6 × 45.000 = 270.000) — SAI Ý NGHĨA nếu đơn giá thật tính theo mét dài; đây CHÍNH LÀ giới hạn cần biết trước khi dùng cho vật liệu tính theo đơn vị khác m²',
    res.rows[0]?.thanhTien === 270_000);
}

console.log(`\nKẾT QUẢ: ${pass} pass, ${fail} fail`);
if (fail) process.exit(1);
