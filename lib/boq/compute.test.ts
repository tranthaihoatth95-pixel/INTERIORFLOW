/**
 * lib/boq/compute.test.ts — BOQ ENGINE: 3 ca bắt buộc (chỉ đạo gốc 02/08) + vài ca phụ cho 2 lý
 * do lỗi còn lại (spec-not-found / missing-priceVnd) để phủ hết `BoqErrorReason`. Chạy:
 *   node_modules/.bin/sucrase-node lib/boq/compute.test.ts
 */
import { computeBoq, classifyBlock } from './compute';
import { emptyDoc, type Doc, type Entity, type HatchEntity, type BlockEntity } from '../cad/model';
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

function docWith(...ents: Entity[]): Doc {
  const doc = emptyDoc();
  doc.entities.push(...ents);
  return doc;
}

/** 1 MÓN RỜI trên bản vẽ (ghế/bàn/đèn) — `BlockEntity`, thứ `computeBoq` bỏ quên hoàn toàn trước
 * 06/08 (G-M3-09). Toạ độ không ảnh hưởng phép đếm nên để mặc định. */
let blockSeq = 0;
function blockItem(extra?: Partial<BlockEntity>): BlockEntity {
  blockSeq += 1;
  return {
    id: `b${blockSeq}`,
    type: 'block',
    layer: 'l-furniture',
    block: 'chair',
    at: { x: 0, y: 0 },
    rot: 0,
    sx: 1,
    sy: 1,
    ...extra,
  };
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

/* ═══ [8] 🔴 VIẾT LẠI 06/08 vòng 3 — vùng tô neo vào mã bán theo MÉT DÀI ═══
 *
 * Bản trước của test này KHOÁ ĐÚNG CÁI BUG: nẹp chân tường bán 45.000đ/MÉT DÀI, gán cho vùng tô
 * 6 m² ⇒ engine ra **270.000đ, errors: []**, và test tự ghi trong nhãn "SAI Ý NGHĨA... đây CHÍNH
 * LÀ giới hạn cần biết". Một giới hạn ra TIỀN SAI mà không báo gì thì không phải giới hạn, là bug
 * — đúng họ với `unit-mismatch` mà [15]/[18c] đã đóng cho hai chiều kia. Ba chiều một luật.
 * (Chiều "đơn vị ĐO khác diện tích" là chiều CUỐI còn hở: đo được `unit='m'`/`'m3'`/`'kg'` đều ra
 * 9 m² × đơn giá = 900.000đ với `errors: []`.) */
console.log('\n[8] vùng tô neo vào mã bán theo MÉT DÀI → unit-mismatch (trước: 270.000đ, errors 0)');
{
  const NEP_CHAN_TUONG: MaterialSpecLite = {
    id: 'spec-nep-m', name: 'Nẹp chân tường nhôm', vendor: 'ABC', sku: 'NCT-01',
    unit: 'm', priceVnd: 45_000, wastagePercent: 0, // ý định thật: 45.000đ/MÉT DÀI
  };
  const h = rectHatch(2000, 3000, { specId: NEP_CHAN_TUONG.id }); // 6m² — KHÔNG phải 6m dài
  const res = computeBoq(docWith(h), [NEP_CHAN_TUONG]);
  ok('KHÔNG ra dòng nào (trước: 1 dòng 270.000đ)', res.rows.length === 0);
  ok('totalAmount = 0, không phải 270.000', res.totalAmount === 0);
  const e = res.errors.find((x) => x.reason === 'unit-mismatch');
  ok('có lỗi unit-mismatch (trước: errors rỗng)', !!e);
  ok('câu lỗi nhắc đúng đơn vị người dùng khai', !!e?.message.includes('"m"'));
  ok('câu lỗi chỉ RA HAI chỗ sửa được (kho vật liệu / bản vẽ)',
    !!e?.message.includes('kho vật liệu') && !!e?.message.includes('bản vẽ'));
}

/* ═══ [9] G-M3-09 — CA ĐÃ ĐO THẬT: 1 vùng tô có giá + 1 món rời có specId+giá + 1 món rời KHÔNG
       specId ⇒ PHẢI ra 2 DÒNG + 1 LỖI. Trước 06/08 ca này ra 1 dòng, errors:[] — con ghế biến
       mất khỏi báo giá KHÔNG MỘT TIẾNG NÀO, bảng vẫn trông "đủ". ═══ */
console.log('\n[9] G-M3-09 — vùng tô + món rời + món rời thiếu mã ⇒ 2 dòng + 1 lỗi');
{
  const GHE: MaterialSpecLite = {
    id: 'spec-ghe', name: 'Ghế ăn gỗ sồi', vendor: 'Nhà Xinh', sku: 'NX-GH-01',
    unit: 'cai', priceVnd: 1_200_000, wastagePercent: null,
  };
  const san = rectHatch(2000, 3000, { specId: SAN_GO.id }); // 6m² sàn, có giá
  const ghe = blockItem({ specId: GHE.id }); // 1 cái ghế đã gán mã + giá
  const gheKhongMa = blockItem(); // 1 món rời KHÔNG gán specId — thứ từng rơi âm thầm
  const res = computeBoq(docWith(san, ghe, gheKhongMa), [SAN_GO, GHE]);

  ok('ra ĐÚNG 2 dòng (sàn + ghế), không phải 1', res.rows.length === 2);
  const rSan = res.rows.find((r) => r.matId === SAN_GO.id);
  const rGhe = res.rows.find((r) => r.matId === GHE.id);
  ok('dòng sàn là kind=area, unit=m2, qty=6', rSan?.kind === 'area' && rSan?.unit === 'm2' && rSan?.qty === 6);
  ok('dòng ghế là kind=count, unit=cai, qty=1 (ĐẾM, không phải m²)', rGhe?.kind === 'count' && rGhe?.unit === 'cai' && rGhe?.qty === 1);
  ok('m2 (deprecated) luôn BẰNG qty — không vỡ override/UI cũ', rSan?.m2 === rSan?.qty && rGhe?.m2 === rGhe?.qty);
  ok('thành tiền ghế = 1 × 1.200.000', rGhe?.thanhTien === 1_200_000);
  ok('entityIds dòng ghế trỏ đúng block', rGhe?.entityIds.length === 1 && rGhe?.entityIds[0] === ghe.id);

  ok('có ĐÚNG 1 lỗi', res.errors.length === 1);
  const err = res.errors[0];
  ok('lỗi là missing-specId-item (KHÔNG im lặng)', err?.reason === 'missing-specId-item');
  ok('lỗi nói rõ SỐ MÓN đang rơi khỏi báo giá', err?.message.includes('1 món rời'));
  ok('lỗi trỏ đúng entity thiếu mã', err?.entityIds.length === 1 && err?.entityIds[0] === gheKhongMa.id);

  // totalAmount = 1.890.000 (sàn, 6 × 1.05 × 300.000) + 1.200.000 (ghế)
  ok('totalAmount cộng đúng cả 2 dòng = 3.090.000', res.totalAmount === 3_090_000);
  ok('totalAmount = Σ thanhTien các dòng', res.totalAmount === res.rows.reduce((s, r) => s + r.thanhTien, 0));
}

/* ═══ [10] nhiều món CÙNG mã ⇒ gộp 1 dòng, đếm số nguyên; đơn vị lấy từ spec khi là đơn vị ĐẾM ═══ */
console.log('\n[10] gộp món rời theo specId → đếm cái');
{
  const BO_BAN: MaterialSpecLite = {
    id: 'spec-bo-ban', name: 'Bộ bàn ăn 8 chỗ', vendor: null, sku: null,
    unit: 'bo', priceVnd: 25_000_000, wastagePercent: null,
  };
  const res = computeBoq(docWith(blockItem({ specId: BO_BAN.id }), blockItem({ specId: BO_BAN.id }), blockItem({ specId: BO_BAN.id })), [BO_BAN]);
  ok('gộp 3 món thành 1 dòng', res.rows.length === 1);
  ok('qty = 3 (số NGUYÊN)', res.rows[0]?.qty === 3 && Number.isInteger(res.rows[0]!.qty));
  ok('đơn vị lấy đúng "bo" từ ProductSpec', res.rows[0]?.unit === 'bo');
  ok('thành tiền = 3 × 25.000.000', res.rows[0]?.thanhTien === 75_000_000);
  ok('0 lỗi', res.errors.length === 0);
}

/* ═══ [11] spec KHÔNG khai đơn vị → mặc định đếm bằng 'cai', không cảnh báo thừa ═══
   ⚠️ Test này TRƯỚC vòng kiểm phản biện dùng `unit:'m2'` và khoá hành vi "rơi về cai rồi vẫn
   nhân" — chính là ca ④b bị chấm sai (ra tiền bịa mà `errors: []`). Nay ca `unit:'m2'` chuyển
   sang [15] khoá hành vi ĐÚNG (chặn + `unit-mismatch`); ở đây giữ ca "không khai đơn vị". */
console.log('\n[11] món rời không khai đơn vị → mặc định "cai", không lỗi');
{
  const DEN: MaterialSpecLite = {
    id: 'spec-den', name: 'Đèn thả trần', vendor: null, sku: null,
    unit: null, priceVnd: 3_000_000, wastagePercent: null,
  };
  const res = computeBoq(docWith(blockItem({ specId: DEN.id }), blockItem({ specId: DEN.id })), [DEN]);
  ok('ĐẾM 2 cái', res.rows[0]?.qty === 2);
  ok('đơn vị mặc định "cai" (FFE_DEFAULT_UNIT)', res.rows[0]?.unit === 'cai');
  ok('thành tiền = 2 × 3.000.000', res.rows[0]?.thanhTien === 6_000_000);
  ok('KHÔNG cảnh báo đơn vị (không khai ≠ khai lạ)', !res.errors.some((e) => e.reason === 'unknown-unit'));
}

/* ═══ [12] món rời có mã LẠ / CHƯA CÓ GIÁ → lỗi rõ như đường hatch, không tính bừa ═══ */
console.log('\n[12] món rời mã lạ + chưa có giá → lỗi rõ');
{
  const CHUA_GIA: MaterialSpecLite = {
    id: 'spec-sofa', name: 'Sofa 3 chỗ', vendor: null, sku: null,
    unit: 'cai', priceVnd: null, wastagePercent: null,
  };
  const res = computeBoq(
    docWith(blockItem({ specId: 'spec-bay-gio-khong-con' }), blockItem({ specId: CHUA_GIA.id })),
    [CHUA_GIA],
  );
  ok('0 dòng (không tính bừa)', res.rows.length === 0);
  ok('có lỗi spec-not-found cho mã lạ', res.errors.some((e) => e.reason === 'spec-not-found' && e.matId === 'spec-bay-gio-khong-con'));
  const priceErr = res.errors.find((e) => e.reason === 'missing-priceVnd');
  ok('có lỗi missing-priceVnd nêu đúng tên món', !!priceErr && priceErr.message.includes('Sofa 3 chỗ'));
  ok('câu lỗi nói theo ngôn ngữ MÓN RỜI (không phải "vùng tô")', !!priceErr && priceErr.message.includes('cái trên bản vẽ'));
}

/* ═══ [13] CÙNG 1 specId dùng cho cả vùng tô lẫn món rời → 2 dòng + cảnh báo, KHÔNG im lặng ═══ */
console.log('\n[13] specId dùng cả 2 kiểu → cảnh báo trùng matId');
{
  // Spec KHÔNG khai đơn vị ⇒ dùng được cho cả 2 nhánh (nếu khai 'm2' thì nhánh món rời chặn ở
  // `unit-mismatch` trước — xem [15] — nên sẽ không tái hiện được ca trùng matId).
  const HAI_KIEU: MaterialSpecLite = { ...SAN_GO, id: 'spec-hai-kieu', unit: null };
  const res = computeBoq(
    docWith(rectHatch(1000, 1000, { specId: HAI_KIEU.id }), blockItem({ specId: HAI_KIEU.id })),
    [HAI_KIEU],
  );
  ok('ra 2 dòng (m² và cái, không cộng chung)', res.rows.length === 2);
  ok('1 dòng area + 1 dòng count', res.rows.filter((r) => r.kind === 'area').length === 1 && res.rows.filter((r) => r.kind === 'count').length === 1);
  const dup = res.errors.find((e) => e.reason === 'specId-both-kinds');
  ok('có cảnh báo specId-both-kinds', !!dup);
  ok('cảnh báo liệt kê cả 2 entity', dup?.entityIds.length === 2);
}

/* ═══════════ VÒNG KIỂM PHẢN BIỆN 06/08 — 5 ca "tiền sai mà KHÔNG có lỗi" ═══════════
   Mỗi ca dưới đây TRƯỚC khi sửa đều cho `errors: []` + một con số trông như đúng. ═══════════ */

/* ═══ [14] ④a hatch có specId nhưng hình học rỗng ⇒ trước: 1 dòng 0 m², 0đ, errors 0 ═══ */
console.log('\n[14] ④a vùng tô không có diện tích → invalid-geometry (trước: 1 dòng 0m², errors 0)');
{
  const hRong: HatchEntity = { id: 'hx', type: 'hatch', layer: 'l-floor', points: [], specId: SAN_GO.id };
  const h2Diem: HatchEntity = { id: 'hy', type: 'hatch', layer: 'l-floor', specId: SAN_GO.id, points: [{ x: 0, y: 0 }, { x: 1000, y: 0 }] };
  const res = computeBoq(docWith(hRong, h2Diem), [SAN_GO]);
  ok('0 dòng (KHÔNG còn dòng 0.00 m² giả)', res.rows.length === 0);
  ok('totalAmount = 0', res.totalAmount === 0);
  const e = res.errors.find((x) => x.reason === 'invalid-geometry');
  ok('có lỗi invalid-geometry', !!e);
  ok('lỗi liệt kê đủ 2 vùng hỏng', e?.entityIds.length === 2);
  ok('message nói rõ "không có diện tích"', !!e?.message.includes('không có diện tích'));
}

/* ═══ [14b] vùng tô TỐT + vùng tô hỏng CÙNG vật liệu → vẫn tính vùng tốt, vẫn báo vùng hỏng ═══ */
console.log('\n[14b] vùng tốt vẫn được tính, không bị vùng hỏng kéo theo');
{
  const tot = rectHatch(2000, 3000, { specId: SAN_GO.id }, { x: 20_000, y: 20_000 }); // 6m²
  const hong: HatchEntity = { id: 'hz', type: 'hatch', layer: 'l-floor', points: [], specId: SAN_GO.id };
  const res = computeBoq(docWith(tot, hong), [SAN_GO]);
  ok('vẫn ra 1 dòng cho vùng tốt', res.rows.length === 1);
  ok('m² = 6, KHÔNG bị vùng rỗng kéo xuống', res.rows[0]?.m2 === 6);
  ok('entityIds chỉ gồm vùng tốt', res.rows[0]?.entityIds.length === 1 && res.rows[0]?.entityIds[0] === tot.id);
  ok('vẫn có lỗi cho vùng hỏng', res.errors.some((x) => x.reason === 'invalid-geometry'));
}

/* ═══ [15] ④b block trỏ spec unit='m2' ⇒ trước: 1 cai × đơn giá m² = 472.500đ, errors 0 ═══ */
console.log('\n[15] ④b món rời trỏ spec đơn vị ĐO → unit-mismatch (trước: 472.500đ, errors 0)');
{
  const SPEC_M2: MaterialSpecLite = {
    id: 'spec-m2', name: 'Gạch lát 60x60', vendor: null, sku: null,
    unit: 'm2', priceVnd: 450_000, wastagePercent: 5, // 1 × 1.05 × 450.000 = 472.500 (con số bịa cũ)
  };
  const res = computeBoq(docWith(blockItem({ specId: SPEC_M2.id })), [SPEC_M2]);
  ok('0 dòng (KHÔNG còn 472.500đ bịa)', res.rows.length === 0);
  ok('totalAmount = 0', res.totalAmount === 0);
  const e = res.errors.find((x) => x.reason === 'unit-mismatch');
  ok('có lỗi unit-mismatch', !!e);
  ok('message nêu đúng đơn vị sai', !!e?.message.includes('"m2"'));
}

/* ═══ [16] ④c đơn vị lạ 'thùng' ⇒ trước: nuốt, rơi về 'cai', errors 0 ═══ */
console.log('\n[16] ④c đơn vị lạ → GIỮ NGUYÊN chữ + cảnh báo (trước: nuốt thành "cai", errors 0)');
{
  const SPEC_THUNG: MaterialSpecLite = {
    id: 'spec-thung', name: 'Keo dán gạch', vendor: null, sku: null,
    unit: 'thùng', priceVnd: 320_000, wastagePercent: null,
  };
  const res = computeBoq(docWith(blockItem({ specId: SPEC_THUNG.id }), blockItem({ specId: SPEC_THUNG.id })), [SPEC_THUNG]);
  ok('VẪN có dòng (không chặn oan đơn vị hợp lệ của người dùng)', res.rows.length === 1);
  ok('GIỮ NGUYÊN đơn vị "thùng", KHÔNG nuốt thành "cai"', res.rows[0]?.unit === 'thùng');
  ok('qty = 2', res.rows[0]?.qty === 2);
  ok('thành tiền = 2 × 320.000', res.rows[0]?.thanhTien === 640_000);
  ok('CÓ cảnh báo unknown-unit (không im lặng)', res.errors.some((x) => x.reason === 'unknown-unit'));
}

/* ═══ [17] ④d giá ÂM / hao hụt ÂM / NaN / undefined ⇒ trước: tiền âm hoặc NaN, errors 0 ═══ */
console.log('\n[17] ④d giá âm · hao hụt âm · NaN · undefined → invalid-price (trước: tiền âm/NaN, errors 0)');
{
  const AM: MaterialSpecLite = { id: 's-am', name: 'Sơn lỗi giá', vendor: null, sku: null, unit: 'm2', priceVnd: -100_000, wastagePercent: 0 };
  const r1 = computeBoq(docWith(rectHatch(1000, 1000, { specId: AM.id })), [AM]);
  ok('giá âm: 0 dòng', r1.rows.length === 0);
  ok('giá âm: totalAmount = 0 (KHÔNG âm)', r1.totalAmount === 0);
  ok('giá âm: có lỗi invalid-price', r1.errors.some((x) => x.reason === 'invalid-price'));
  ok('giá âm: message nói chữ "ÂM"', !!r1.errors[0]?.message.includes('ÂM'));

  const HH_AM: MaterialSpecLite = { ...AM, id: 's-hh', name: 'Sơn lỗi hao hụt', priceVnd: 50_000, wastagePercent: -20 };
  const r2 = computeBoq(docWith(rectHatch(1000, 1000, { specId: HH_AM.id })), [HH_AM]);
  ok('hao hụt âm: 0 dòng + có lỗi', r2.rows.length === 0 && r2.errors.some((x) => x.reason === 'invalid-price'));

  // Ca phòng thủ: priceVnd undefined/NaN lọt guard `=== null` cũ ⇒ thanhTien NaN, totalAmount NaN.
  const UNDEF = { id: 's-undef', name: 'Giá không có kiểu', vendor: null, sku: null, unit: 'm2', wastagePercent: 0 } as unknown as MaterialSpecLite;
  const r3 = computeBoq(docWith(rectHatch(1000, 1000, { specId: 's-undef' })), [UNDEF]);
  ok('priceVnd undefined: 0 dòng', r3.rows.length === 0);
  ok('priceVnd undefined: totalAmount = 0, KHÔNG NaN', r3.totalAmount === 0 && !Number.isNaN(r3.totalAmount));
  ok('priceVnd undefined: có lỗi invalid-price', r3.errors.some((x) => x.reason === 'invalid-price'));

  const NAN_SPEC = { ...AM, id: 's-nan', name: 'Giá NaN', priceVnd: Number.NaN } as MaterialSpecLite;
  const r4 = computeBoq(docWith(blockItem({ specId: 's-nan' })), [NAN_SPEC]);
  ok('priceVnd NaN (món rời): 0 dòng, tổng 0, có lỗi',
    r4.rows.length === 0 && r4.totalAmount === 0 && r4.errors.some((x) => x.reason === 'invalid-price'));

  // priceVnd = null vẫn phải là 'missing-priceVnd' (ngữ nghĩa "chưa có giá" — KHÔNG gộp vào lỗi hỏng)
  const NULL_SPEC: MaterialSpecLite = { ...AM, id: 's-null', name: 'Chưa có giá', priceVnd: null };
  const r5 = computeBoq(docWith(rectHatch(1000, 1000, { specId: 's-null' })), [NULL_SPEC]);
  ok('priceVnd null vẫn là missing-priceVnd (không đổi ngữ nghĩa cũ)', r5.errors[0]?.reason === 'missing-priceVnd');
}

/* ═══ [18] ⑤ lỗi món rời KHÔNG gom cửa/cửa sổ/ký hiệu ⇒ trước: "4 món rời chưa gán mã" ═══ */
console.log('\n[18] ⑤ cửa/cửa sổ/ký hiệu KHÔNG bị đếm là "món rời chưa gán mã"');
{
  const ghe = blockItem({ block: 'chair' }); // hàng hoá THẬT, chưa gán mã → phải báo
  const cuaHosted = blockItem({ block: 'door', hostId: 'wall-1' }); // cửa đã gắn tường
  const cuaRoi = blockItem({ block: 'doorRoom' }); // cửa CHƯA gắn tường — vẫn là cửa (BlockDef.hosted)
  const cuaSo = blockItem({ block: 'window' });
  const muiTenBac = blockItem({ block: 'north-arrow', layer: 'l-text' }); // ký hiệu trên lớp ghi chú
  const tagCaoDo = blockItem({ block: 'level-tag', layer: 'l-dim' });
  const res = computeBoq(docWith(ghe, cuaHosted, cuaRoi, cuaSo, muiTenBac, tagCaoDo), []);

  const e = res.errors.find((x) => x.reason === 'missing-specId-item');
  ok('có đúng 1 lỗi missing-specId-item', !!e);
  ok('CHỈ đếm 1 món hàng hoá (trước: 4)', e?.entityIds.length === 1 && e?.entityIds[0] === ghe.id);
  ok('message ghi "1 món rời"', !!e?.message.includes('1 món rời'));
  ok('message NÓI RA đã bỏ qua 3 cửa/cửa sổ', !!e?.message.includes('3 cửa/cửa sổ'));
  ok('message NÓI RA đã bỏ qua 2 ký hiệu', !!e?.message.includes('2 ký hiệu bản vẽ'));
  ok('classifyBlock: cửa gắn tường = opening', classifyBlock(cuaHosted) === 'opening');
  ok('classifyBlock: cửa rời vẫn = opening (theo BlockDef.hosted)', classifyBlock(cuaRoi) === 'opening');
  ok('classifyBlock: block lạ trên lớp thường VẪN là hàng hoá (không bỏ sót đồ nhập DXF)',
    classifyBlock(blockItem({ block: 'block-la-tu-dxf' })) === 'goods');
}

/* ═══ [18b] 🔴 VIẾT LẠI 06/08 sau KIỂM PHẢN BIỆN VÒNG 2 — KHAI BÁO THẮNG SUY ĐOÁN ═══
 *
 * Bản trước của test này khoá hành vi: cửa/ký hiệu ĐÃ gán mã + đơn giá ⇒ `rows: 0, errors: 0`,
 * với lý do "cửa tính qua bảng cửa, không đếm 2 lần". Vòng kiểm phản biện đo ra đó chính là
 * **G-M3-09 tái sinh**: `total = 0` mà bảng vẫn trông sạch sẽ. Kiểm lại giả định:
 *     grep "priceVnd|thanhTien" lib/cad/schedule.ts  → 0 dòng
 *     `ScheduleRow` = { key, label, count, w, h, block, specId, ids } — KHÔNG CÓ TRƯỜNG TIỀN.
 * Tức "bảng cửa" KHÔNG hề tính tiền ⇒ không có chuyện đếm 2 lần, chỉ có chuyện MẤT TIỀN.
 * Ngoài ra studio nội thất CÓ bán cửa (Hoà: nội thất là điểm nhấn, kiến trúc vẫn làm đủ).
 *
 * Luật chốt: `specId` là thứ người dùng CHỦ ĐỘNG gán ("đây là hàng, giá đây") ⇒ thắng mọi suy
 * đoán theo lớp/thư viện. Phân loại `opening`/`symbol` chỉ còn dùng để lọc bớt block CHƯA gán mã
 * ra khỏi câu cảnh báo "chưa gán mã hàng" — đúng mục đích ban đầu của nó.
 * ⚠️ Ngày nào có bảng cửa TÍNH TIỀN thật thì quay lại đây chống đếm 2 lần — lúc đó phải trừ ở
 * MỘT nơi, không phải im lặng bỏ ở cả hai. */
console.log('\n[18b] cửa/ký hiệu ĐÃ gán mã vẫn phải lên tiền — cấm biến mất im lặng');
{
  const CUA: MaterialSpecLite = { id: 'spec-cua', name: 'Cửa gỗ công nghiệp', vendor: null, sku: null, unit: 'cai', priceVnd: 5_000_000, wastagePercent: null };
  const res = computeBoq(docWith(blockItem({ block: 'door', specId: CUA.id })), [CUA]);
  ok('cửa đã gán mã RA ĐÚNG 1 dòng (trước: 0 dòng, 0 lỗi, 0đ)', res.rows.length === 1);
  ok('đúng tiền 5.000.000', res.rows[0]?.thanhTien === 5_000_000);
  ok('tổng KHÔNG còn bằng 0', res.totalAmount === 5_000_000);
  ok('không đẻ lỗi oan', res.errors.length === 0);

  // Ca đo được của kiểm phản biện: hàng hoá có mã nằm trên LỚP GHI CHÚ (người vẽ đặt ẩu).
  const GHE: MaterialSpecLite = { id: 'spec-ghe', name: 'Ghế xoay', vendor: null, sku: null, unit: 'cai', priceVnd: 2_450_000, wastagePercent: null };
  const onAnno = computeBoq(docWith(blockItem({ block: 'officeChair', layer: 'l-anno', specId: GHE.id })), [GHE]);
  ok('ghế có mã trên lớp ghi chú VẪN ra tiền (trước: rows=0 · errors=0 · total=0)',
    onAnno.rows.length === 1 && onAnno.totalAmount === 2_450_000);

  // Chốt ngược: block CHƯA gán mã thì luật lọc ký hiệu/cửa vẫn chạy như cũ (không vá quá tay).
  const noSpec = computeBoq(docWith(blockItem({ block: 'door' }), blockItem({ block: 'north-arrow', layer: 'l-text' })), []);
  ok('block chưa gán mã: cửa + ký hiệu vẫn KHÔNG bị đòi mã hàng', !noSpec.errors.some((e) => e.reason === 'missing-specId-item'));
}

/* ═══ [18c] 🔴 KIỂM PHẢN BIỆN VÒNG 2 — CHIỀU ĐỐI XỨNG của unit-mismatch ═══
 * Vòng vá đầu chỉ chặn "đơn giá mỗi m² × số cái". Chiều ngược lại (vùng tô neo vào mã bán theo
 * CÁI) vẫn bịa tiền: đo được 9 m² × 2.450.000 = 22.050.000đ với errors: []. Chiều này còn dễ
 * xảy ra hơn — chọn nhầm mã ghế trong danh sách kho khi tô sàn. */
console.log('\n[18c] vùng tô neo vào mã bán theo CÁI — cấm nhân bừa');
{
  const GHE: MaterialSpecLite = { id: 'spec-ghe', name: 'Ghế xoay', vendor: null, sku: null, unit: 'cái', priceVnd: 2_450_000, wastagePercent: null };
  const san = rectHatch(3000, 3000, { specId: GHE.id }); // 9 m²
  const res = computeBoq(docWith(san), [GHE]);
  ok('KHÔNG ra dòng nào (trước: 1 dòng 22.050.000đ)', res.rows.length === 0);
  ok('tổng = 0, không phải 22.050.000', res.totalAmount === 0);
  ok('CÓ lỗi unit-mismatch (trước: errors rỗng)', res.errors.some((e) => e.reason === 'unit-mismatch'));
  ok('câu lỗi nói rõ đơn vị người dùng khai', !!res.errors.find((e) => e.reason === 'unit-mismatch')?.message.includes('cái'));

  // Chốt ngược — vật liệu m² bình thường KHÔNG bị vá quá tay.
  const SAN: MaterialSpecLite = { id: 'spec-san', name: 'Sàn gỗ', vendor: null, sku: null, unit: 'm2', priceVnd: 1_000_000, wastagePercent: null };
  const okRes = computeBoq(docWith(rectHatch(1000, 1000, { specId: SAN.id })), [SAN]);
  ok('vật liệu m² vẫn tính bình thường (1 m² = 1.000.000)', okRes.rows.length === 1 && okRes.totalAmount === 1_000_000);
}

/* ═══════════ VÒNG 3 (06/08) — 3 đường "tiền sai / tiền tràn / đếm đôi" còn lại ═══════════ */

/* ═══ [19] VÙNG TÔ × ĐƠN VỊ — 3 nhánh ĐỐI XỨNG với món rời ([15]/[16]) ═══
 * Đo được trên bản trước (vùng tô 3000×3000, đơn giá 100.000):
 *   unit='m'  → qty 9, unit "m2", 900.000đ, errors: []
 *   unit='m3' → y hệt · unit='kg' → y hệt · unit='thùng' → y hệt (không cả cảnh báo)
 * Nhánh vùng tô lúc đó MỚI CHỈ chặn `isCountUnit`. */
console.log('\n[19] vùng tô: đơn vị ĐO khác diện tích → chặn · đơn vị LẠ → tính + cảnh báo');
{
  const mk = (id: string, unit: string | null): MaterialSpecLite => ({
    id, name: `Vật liệu ${unit ?? '(không khai)'}`, vendor: null, sku: 'SKU-1',
    unit, priceVnd: 100_000, wastagePercent: null,
  });

  // (b) đơn vị ĐO khác diện tích ⇒ KHÔNG tính, báo rõ
  for (const u of ['m', 'md', 'm3', 'kg', 'lít']) {
    const spec = mk(`spec-${u}`, u);
    const res = computeBoq(docWith(rectHatch(3000, 3000, { specId: spec.id }, { x: 0, y: 0 })), [spec]);
    ok(`đơn vị "${u}" → 0 dòng + unit-mismatch (trước: 9 m² × 100.000 = 900.000đ, errors 0)`,
      res.rows.length === 0 && res.totalAmount === 0 && res.errors.some((e) => e.reason === 'unit-mismatch'));
  }
  // đơn vị ĐẾM (chiều đã đóng ở [18c]) vẫn chặn — không vá hỏng cái cũ
  const dem = mk('spec-cai', 'cái');
  ok('đơn vị ĐẾM vẫn chặn như [18c]',
    computeBoq(docWith(rectHatch(3000, 3000, { specId: dem.id })), [dem]).errors.some((e) => e.reason === 'unit-mismatch'));

  // (a) đơn vị DIỆN TÍCH hoặc KHÔNG khai ⇒ tính bình thường, KHÔNG đẻ cảnh báo oan
  for (const u of ['m2', 'm²', 'sqm', 'M2', '', null] as (string | null)[]) {
    const spec = mk(`spec-ok-${String(u)}`, u);
    const res = computeBoq(docWith(rectHatch(3000, 3000, { specId: spec.id })), [spec]);
    ok(`đơn vị ${JSON.stringify(u)} → vẫn tính 9 m² = 900.000đ, 0 lỗi`,
      res.rows.length === 1 && res.rows[0]?.thanhTien === 900_000 && res.errors.length === 0);
  }

  // (c) đơn vị LẠ ⇒ VẪN tính theo m² nhưng phải nói ra
  const thung = mk('spec-thung-area', 'thùng');
  const resThung = computeBoq(docWith(rectHatch(3000, 3000, { specId: thung.id })), [thung]);
  ok('đơn vị lạ "thùng" → VẪN có dòng (không chặn oan)', resThung.rows.length === 1);
  ok('đơn vị lạ vẫn tính theo m² (9 × 100.000)', resThung.rows[0]?.thanhTien === 900_000);
  const warn = resThung.errors.find((e) => e.reason === 'unknown-unit');
  ok('CÓ cảnh báo unknown-unit (trước: im lặng hoàn toàn)', !!warn);
  ok('cảnh báo GIỮ NGUYÊN chữ người dùng viết', !!warn?.message.includes('thùng'));
}

/* ═══ [20] KHỐI LƯỢNG IN RA phải tự nhân ra ĐÚNG thành tiền in cạnh nó ═══
 * Đo được trên bản trước: vùng tô 3162×3162 → dòng in "10 m² · 1.000.000đ · **9.998.244đ**";
 * nhân tay 10 × 1.000.000 = 10.000.000 ⇒ lệch 1.756đ, không một ghi chú. Nguyên nhân: dòng nhân
 * từ diện tích THÔ (9.998244 m²) trong khi bảng in diện tích ĐÃ làm tròn. */
console.log('\n[20] mỗi dòng tự nhân ra đúng số in trên bảng (trước: lệch 1.756đ)');
{
  const SPEC: MaterialSpecLite = {
    id: 'spec-tron', name: 'Sàn gỗ', vendor: null, sku: null, unit: 'm2',
    priceVnd: 1_000_000, wastagePercent: null,
  };
  const res = computeBoq(docWith(rectHatch(3162, 3162, { specId: SPEC.id })), [SPEC]);
  const r = res.rows[0];
  ok('khối lượng in ra vẫn là 10 m² (làm tròn 2 số lẻ, không đổi)', r?.qty === 10);
  ok('thành tiền = 10 × 1.000.000 (trước: 9.998.244)', r?.thanhTien === 10_000_000);
  ok('bấm máy tính trên chính 3 số của dòng ra đúng cột thành tiền',
    Math.round((r?.qty ?? 0) * (1 + (r?.haoHutPhanTram ?? 0) / 100) * (r?.donGia ?? 0)) === r?.thanhTien);

  // ...và có hao hụt thì vẫn đúng luật đó
  const HH: MaterialSpecLite = { ...SPEC, id: 'spec-tron-hh', wastagePercent: 5 };
  const r2 = computeBoq(docWith(rectHatch(3162, 3162, { specId: HH.id })), [HH]).rows[0];
  ok('có hao hụt 5% vẫn tự nhân ra đúng (10 × 1.05 × 1.000.000)', r2?.thanhTien === 10_500_000);

  // Chốt ngược: tổng vẫn = Σ thành tiền từng dòng (luật cũ không được vỡ).
  const nhieu = computeBoq(
    docWith(rectHatch(3162, 3162, { specId: SPEC.id }, { x: 0, y: 0 }), rectHatch(2000, 3000, { specId: HH.id }, { x: 50_000, y: 0 })),
    [SPEC, HH],
  );
  ok('totalAmount vẫn = Σ thanhTien các dòng', nhieu.totalAmount === nhieu.rows.reduce((s, x) => s + x.thanhTien, 0));
}

/* ═══ [21] THÀNH TIỀN TRÀN SỐ — đầu vào hữu hạn, kết quả Infinity ═══
 * Đo được trên bản trước: `wastagePercent = 1e308` → `thanhTien: Infinity`, `errors: 0`; xuất
 * .xlsx cùng kết quả đó thì `buildXlsxBuffer` ném "giá trị số không hợp lệ tại J2: Infinity" —
 * lỗi bằng tiếng lập trình viên, nổ đúng lúc người dùng bấm nút Xuất. `priceProblem` chỉ kiểm
 * ĐẦU VÀO nên không bắt được ca này. */
console.log('\n[21] thành tiền tràn số → invalid-price (trước: Infinity với errors 0)');
{
  const TRAN: MaterialSpecLite = {
    id: 'spec-tran', name: 'Hao hụt bịa', vendor: null, sku: null, unit: 'm2',
    priceVnd: 1e308, wastagePercent: 1e308,
  };
  const res = computeBoq(docWith(rectHatch(1000, 1000, { specId: TRAN.id })), [TRAN]);
  ok('vùng tô: 0 dòng (trước: 1 dòng thanhTien Infinity)', res.rows.length === 0);
  ok('vùng tô: totalAmount = 0, KHÔNG Infinity', res.totalAmount === 0 && Number.isFinite(res.totalAmount));
  const e = res.errors.find((x) => x.reason === 'invalid-price');
  ok('vùng tô: có lỗi invalid-price (lý do dùng chung — xem model.ts)', !!e);
  ok('câu lỗi nói ra CẢ BA số đã nhân', !!e?.message.includes('khối lượng') && !!e?.message.includes('hao hụt') && !!e?.message.includes('đơn giá'));

  const TRAN_ITEM: MaterialSpecLite = { ...TRAN, id: 'spec-tran-item', name: 'Ghế tràn', unit: 'cai' };
  const res2 = computeBoq(docWith(blockItem({ specId: TRAN_ITEM.id })), [TRAN_ITEM]);
  ok('món rời: 0 dòng + invalid-price (áp CẢ HAI nhánh)',
    res2.rows.length === 0 && res2.errors.some((x) => x.reason === 'invalid-price'));
  ok('món rời: tổng 0, không Infinity', res2.totalAmount === 0 && Number.isFinite(res2.totalAmount));

  // Chốt ngược: số lớn nhưng VẪN hữu hạn thì không bị chặn oan.
  const TO: MaterialSpecLite = { id: 'spec-to', name: 'Đá quý', vendor: null, sku: null, unit: 'm2', priceVnd: 9_000_000_000, wastagePercent: 10 };
  const res3 = computeBoq(docWith(rectHatch(1000, 1000, { specId: TO.id })), [TO]);
  ok('giá to nhưng hữu hạn vẫn tính bình thường', res3.rows.length === 1 && res3.errors.length === 0);
}

/* ═══ [22] HAI ĐỐI TƯỢNG CÙNG `id` — trước: cộng đôi im lặng ═══
 * Đo được trên bản trước (`git show HEAD:lib/boq/compute.ts`):
 *   2 hatch cùng id 'dup', ở HAI chỗ khác nhau → **1 dòng, qty 18 m², 1.800.000đ, errors: []**
 *   2 block cùng id 'b'                        → **qty 2, 200.000đ, errors: []**
 * (Hai hatch ĐÈ NHAU thì `overlapping-region` che mất ca này — nên nó im lặng đúng ở ca hay gặp
 * nhất: gộp sheet / nhập file / undo lỗi làm nhân đôi bản ghi ở hai chỗ khác nhau.) */
console.log('\n[22] entity trùng id → chỉ tính 1 lần + báo rõ (trước: cộng đôi im lặng)');
{
  const SAN: MaterialSpecLite = { id: 'spec-dup', name: 'Sàn', vendor: null, sku: null, unit: 'm2', priceVnd: 100_000, wastagePercent: null };
  const a = rectHatch(3000, 3000, { specId: SAN.id, id: 'dup' } as Partial<HatchEntity>, { x: 0, y: 0 });
  const b = rectHatch(3000, 3000, { specId: SAN.id, id: 'dup' } as Partial<HatchEntity>, { x: 20_000, y: 20_000 });
  const res = computeBoq(docWith(a, b), [SAN]);
  ok('chỉ tính 1 bản (9 m², KHÔNG phải 18)', res.rows.length === 1 && res.rows[0]?.qty === 9);
  ok('tiền 900.000, không phải 1.800.000', res.rows[0]?.thanhTien === 900_000);
  const e = res.errors.find((x) => x.reason === 'invalid-geometry' && x.message.includes('id TRÙNG'));
  ok('CÓ lỗi báo trùng id (trước: errors rỗng)', !!e);
  ok('lỗi nêu đúng id trùng', !!e?.message.includes('dup') && e?.entityIds[0] === 'dup');

  const GHE: MaterialSpecLite = { id: 'spec-dup-ghe', name: 'Ghế', vendor: null, sku: null, unit: 'cai', priceVnd: 100_000, wastagePercent: null };
  const res2 = computeBoq(docWith(blockItem({ id: 'bdup', specId: GHE.id }), blockItem({ id: 'bdup', specId: GHE.id })), [GHE]);
  ok('món rời trùng id: qty 1 (trước: 2)', res2.rows[0]?.qty === 1 && res2.rows[0]?.thanhTien === 100_000);
  ok('món rời trùng id: có báo', res2.errors.some((x) => x.reason === 'invalid-geometry' && x.message.includes('id TRÙNG')));

  // Chốt ngược: id KHÁC nhau thì vẫn cộng đủ, không vá quá tay.
  const okRes = computeBoq(
    docWith(rectHatch(3000, 3000, { specId: SAN.id }, { x: 0, y: 0 }), rectHatch(3000, 3000, { specId: SAN.id }, { x: 20_000, y: 20_000 })),
    [SAN],
  );
  ok('2 vùng tô id KHÁC nhau vẫn gộp đủ 18 m², không lỗi',
    okRes.rows[0]?.qty === 18 && !okRes.errors.some((x) => x.reason === 'invalid-geometry' && x.message.includes('id TRÙNG')));
}

console.log(`\nKẾT QUẢ: ${pass} pass, ${fail} fail`);
if (fail) process.exit(1);
