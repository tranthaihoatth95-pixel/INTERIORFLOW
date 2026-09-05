/**
 * lib/cad/moat-chuoi.test.ts — MÁY CANH cho những đoạn của chuỗi MOAT ĐANG CHẠY ĐƯỢC.
 * Chạy: node_modules/.bin/sucrase-node lib/cad/moat-chuoi.test.ts
 *
 * ⛔ VÌ SAO CÓ FILE NÀY. Cổng G4 đo trọn chuỗi
 *   `Thư viện → 2D → định danh → 3D → vật liệu → BOQ → Trình chiếu → đổi thượng nguồn → lưu →
 *    ĐÓNG → mở lại`
 * bằng `scripts/nghiem-thu-g4-moat.mjs`. Bộ đó là **phép nghiệm thu một lượt**; file này là
 * **cái khoá** giữ lại đúng những bất biến ĐÃ CHỨNG MINH ĐƯỢC, để chúng không âm thầm mất đi.
 *
 * 🔴 KỶ LUẬT QUAN TRỌNG NHẤT — HỌC TỪ CA HOUGH (00-CHOT 15/08): *"test khẳng định 'trả về đường
 * thoái lui' mà KHÔNG có test nào khẳng định đường CHÍNH chạy được thì đó là test che bug."*
 * ⇒ File này **KHÔNG khẳng định chỗ đang đứt là đúng**. Hai chỗ đứt CÒN LẠI (04/09: `.idfc` không
 * nối bằng khoá bất biến · `.idfc` không mang `BuildRecipe`) **cố ý KHÔNG có test nào ở đây** —
 * chúng nằm ĐỎ trong bộ nghiệm thu và trong `docs/delivery/G4-MOAT-SLICE.md`. Viết chúng thành
 * kỳ vọng ở đây là biến lỗi thành hợp đồng.
 *
 * ✅ 04/09 — chỗ đứt thứ ba ĐÃ ĐÓNG và nay CÓ khoá ở đây (mục ⑥): mặt sàn khai `elementType='slab'`
 * sinh nhóm 3D riêng mang `entityId` + `specId`, sống qua vòng lưu `.idf`, và bản vẽ chưa khai
 * `slab` vẫn dựng được sàn qua đường lùi. Đúng luật khoá: chỉ khoá cái ĐÃ chứng minh chạy.
 *
 * THUẦN — không DOM/FS/mạng. Dùng ĐÚNG hàm sản xuất, không hàm mô phỏng nào.
 */
import { resolveLibraryItem } from './library-item-resolve';
import { exportIdf, importIdf } from './idf';
import { docToObjScene } from '../three/cad-to-obj';
import { computeBoq } from '../boq/compute';
import { boqFingerprint } from '../boq/cache';
import { inspectMaterialImpact, replaceMaterialReferences } from '../materials/impact';
import type { Doc, Entity, BlockEntity, HatchEntity } from './model';
import type { MaterialSpecLite } from '../boq/model';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean, chiTiet = '') {
  if (cond) { pass += 1; console.log(`  ok  - ${label}${chiTiet ? ` — ${chiTiet}` : ''}`); }
  else { fail += 1; console.log(`  FAIL - ${label}${chiTiet ? ` — ${chiTiet}` : ''}`); }
}

/** Kho giá — `id` = `ProductSpec.id` (khoá BẤT BIẾN mà `Base.specId` neo vào), `sku` = business key. */
const KHO: MaterialSpecLite[] = [
  { id: 'ps-sofa', name: 'Sofa 3 chỗ', vendor: 'NCC A', sku: 'SOFA-3S', unit: 'cái', priceVnd: 18_500_000, wastagePercent: 0 },
  { id: 'ps-soi', name: 'Sàn gỗ sồi', vendor: 'NCC C', sku: 'W-210', unit: 'm2', priceVnd: 1_250_000, wastagePercent: 8 },
  { id: 'ps-ocho', name: 'Sàn gỗ óc chó', vendor: 'NCC C', sku: 'W-102', unit: 'm2', priceVnd: 2_400_000, wastagePercent: 8 },
];
const REF = KHO.map((s) => ({ id: s.id, sku: s.sku }));

/* ═════════ ① Thư viện → 2D: món xuống bản vẽ MANG SẴN khoá thương mại ═════════ */
console.log('① Thư viện → 2D — món mang sẵn specId + gia phả');

const hit = resolveLibraryItem({ name: 'Sofa 3 chỗ', code: 'SOFA-3S', kind: 'block' }, null, REF, null);
ok('resolve ra hình GIỮ DANH TÍNH', !!hit && hit.via === 'blockdef' && hit.keepsIdentity === true, `via=${hit?.via}`);
ok('món mang specId của kho giá (không phải tự bịa)', hit?.specId === 'ps-sofa', `specId=${hit?.specId}`);

const ghe: BlockEntity = {
  id: 'e-ghe', type: 'block', layer: 'l-furniture',
  block: (hit as { def: { id: string } }).def.id,
  at: { x: 1000, y: 1000 }, rot: 0, sx: 1, sy: 1,
  specId: hit!.specId,
  srcBlock: 'SOFA-3S', srcInsertId: 'ins-001',
  elementType: 'furniture', storey: 'T1',
};
const san: HatchEntity = {
  id: 'e-san', type: 'hatch', layer: 'l-floor',
  points: [{ x: 0, y: 0 }, { x: 5000, y: 0 }, { x: 5000, y: 4000 }, { x: 0, y: 4000 }],
  pattern: 'ANSI31', specId: 'ps-soi', elementType: 'slab', storey: 'T1',
};
const doc: Doc = {
  entities: [san, ghe],
  layers: [
    { id: 'l-furniture', name: 'Đồ rời', color: '#c9a27a', visible: true, locked: false },
    { id: 'l-floor', name: 'Sàn', color: '#8a6a44', visible: true, locked: false },
  ],
};

/* ═════════ ② 3D đọc CÙNG mã, KHÔNG đẻ mã thứ hai ═════════ */
console.log('② 2D → 3D — không nơi nào đẻ mã thứ hai');
{
  const scene = docToObjScene(doc, { wallHeightMm: 2700 });
  const idDoc = new Set(doc.entities.map((e) => e.id));
  const coId = scene.groups.filter((g) => g.entityId);
  ok('nhóm 3D nào có mã thì mã đó PHẢI có trong Doc', coId.every((g) => idDoc.has(g.entityId!)), `${coId.length} nhóm mang entityId`);

  const specCua = (e: Entity): string | undefined => (e.type === 'hatch' || e.type === 'block' ? e.specId : undefined);
  const specDoc = new Set(doc.entities.map(specCua).filter(Boolean));
  const coSpec = scene.groups.filter((g) => g.specId);
  ok('nhóm 3D nào có vật liệu thì mã đó PHẢI có trong Doc', coSpec.every((g) => specDoc.has(g.specId!)), `${coSpec.length} nhóm mang specId`);
  ok('món rời từ Thư viện GIỮ được vật liệu khi lên 3D', coSpec.some((g) => g.specId === 'ps-sofa'), 'ghế mang ps-sofa ở 3D');
}

/* ═════════ ③ BOQ tính TỪ Doc, truy ngược được về entity ═════════ */
console.log('③ BOQ — số đo được, và truy ngược được về đối tượng');
const boq1 = computeBoq(doc, KHO);
{
  const dongSan = boq1.rows.find((r) => r.specId === 'ps-soi');
  ok('mặt sàn ra đúng 1 dòng, đúng diện tích hình học', !!dongSan && Math.abs(dongSan.qty - 20) < 1e-9, `qty=${dongSan?.qty} m²`);
  ok('dòng BOQ truy ngược được về entity vẽ ra nó', !!dongSan && dongSan.entityIds.includes('e-san'), `entityIds=${dongSan?.entityIds.join(',')}`);
  ok('món rời KHÔNG rơi âm thầm khỏi báo giá', boq1.rows.some((r) => r.specId === 'ps-sofa'), `${boq1.rows.length} dòng`);
  ok('BOQ dùng CHÍNH specId của Doc làm khoá dòng', boq1.rows.every((r) => r.specId === r.matId), 'specId === matId trên mọi dòng');
}

/* ═════════ ④ Đổi thượng nguồn — máy trình, NGƯỜI quyết, xuôi dòng tự đổi ═════════ */
console.log('④ Đổi vật liệu — người quyết, xuôi dòng tự đổi');
{
  const tacDong = inspectMaterialImpact(doc, 'ps-soi');
  ok('máy trình được bảng tác động TRƯỚC khi đổi', tacDong.totalReferences === 1 && tacDong.consumers.boq === true, `${tacDong.totalReferences} tham chiếu`);

  const kq = replaceMaterialReferences(doc, 'ps-soi', 'ps-ocho');
  ok('Doc cũ KHÔNG bị sửa tại chỗ (lùi được)', (doc.entities[0] as HatchEntity).specId === 'ps-soi', 'doc gốc nguyên vẹn');
  ok('đổi đúng số tham chiếu máy đã trình', kq.changedReferences === tacDong.totalReferences, `${kq.changedReferences}`);

  const boq2 = computeBoq(kq.doc, KHO);
  const t1 = boq1.rows.find((r) => r.specId === 'ps-soi')!.thanhTien;
  const t2 = boq2.rows.find((r) => r.specId === 'ps-ocho')!.thanhTien;
  ok('BOQ tự đổi theo — không ai đi đồng bộ tay', t1 !== t2 && t2 > 0, `${t1} → ${t2}`);
  ok('vân tay Doc đổi ⇒ đầu ra hạ nguồn biết mình đã cũ', boqFingerprint(doc) !== boqFingerprint(kq.doc), 'fingerprint khác nhau');
}

/* ═════════ ⑤ MẮT ĐÓNG/TẢI LẠI — chỗ cả dự án chưa từng chứng minh ═════════
   `.idf` là bộ tuần tự hoá THẬT của bản vẽ. Nếu định danh/gia phả/quyết định không sống qua đây
   thì mọi thứ phía trên chỉ đúng trong một phiên chạy. */
console.log('⑤ Lưu → đóng → mở lại — định danh · gia phả · quyết định · con số');
{
  const sauKhiDoi = replaceMaterialReferences(doc, 'ps-soi', 'ps-ocho').doc;
  const chuoi = exportIdf([{ id: 's1', name: 'Mặt bằng', doc: sauKhiDoi }], { projectName: 'Moat guard' });
  const moLai = importIdf(chuoi)?.sheets?.[0]?.doc as Doc | undefined;
  ok('.idf mở lại được', !!moLai, `${chuoi.length} byte`);

  if (moLai) {
    const truoc = new Map(sauKhiDoi.entities.map((e) => [e.id, e]));
    ok('số entity không đổi', moLai.entities.length === sauKhiDoi.entities.length, `${moLai.entities.length}`);
    const maVL = (e: Entity | undefined): string | undefined => (e && (e.type === 'hatch' || e.type === 'block') ? e.specId : undefined);
    ok('ĐỊNH DANH còn nguyên', moLai.entities.every((e) => maVL(truoc.get(e.id)) === maVL(e)), 'mọi specId khớp');
    ok('GIA PHẢ còn nguyên (srcBlock · srcInsertId)', moLai.entities.every((e) => (truoc.get(e.id) as BlockEntity | undefined)?.srcInsertId === (e as BlockEntity).srcInsertId), 'mã lần-chèn khớp');
    ok('ĐỊNH DANH NGỮ NGHĨA còn nguyên (elementType · storey)', moLai.entities.every((e) => truoc.get(e.id)?.elementType === e.elementType && truoc.get(e.id)?.storey === e.storey), '');
    ok('QUYẾT ĐỊNH của người còn hiệu lực sau khi mở lại', (moLai.entities.find((e) => e.type === 'hatch') as HatchEntity).specId === 'ps-ocho', 'vẫn là vật liệu đã chọn');

    const boqSau = computeBoq(moLai, KHO);
    const boqTruoc = computeBoq(sauKhiDoi, KHO);
    ok('BOQ sau mở lại ra ĐÚNG SỐ CŨ', boqSau.totalAmount === boqTruoc.totalAmount, `${boqSau.totalAmount} = ${boqTruoc.totalAmount}`);
    ok('vân tay khớp ⇒ deck KHÔNG báo cũ oan', boqFingerprint(moLai) === boqFingerprint(sauKhiDoi), '');

    // Đường IndexedDB (`lib/sheets-persist.ts` JSON round-trip trước khi ghi) — cùng bất biến.
    const quaIdb = JSON.parse(JSON.stringify(sauKhiDoi)) as Doc;
    ok('IndexedDB — vòng JSON không rơi trường nào', JSON.stringify(quaIdb) === JSON.stringify(sauKhiDoi), '');
    ok('IndexedDB — BOQ sau nạp lại ra đúng số', computeBoq(quaIdb, KHO).totalAmount === boqTruoc.totalAmount, '');
  }
}

/* ═════════ ⑥ MẶT SÀN KHAI BÁO — 2D → 3D → LƯU → MỞ LẠI, và ĐƯỜNG LÙI ═════════
   G4 · MOAT (04/09). `ElementType` có `'slab'` từ 24/07 và chặng 2D đã đọc thẳng nó
   (`lib/cad/plan-present.ts` nền sàn phẳng, "không suy đoán"), nhưng 3D KHÔNG xử lý dòng nào ⇒
   đổi vật liệu mặt sàn thì BOQ đổi, deck báo cũ, mà 3D KHÔNG hề biết. Đây là cái khoá cho chỗ vừa
   nối, gồm CẢ đường lùi — thêm nhánh mới mà làm chết bản vẽ cũ thì là hồi quy, không phải tiến bộ. */
console.log('⑥ Mặt sàn khai báo — lên 3D mang đủ danh tính, sống qua vòng lưu, đường lùi còn nguyên');
{
  const scene = docToObjScene(doc, { wallHeightMm: 2700 });
  const nhomSan = scene.groups.filter((g) => g.semanticKind === 'floor');
  ok('mặt sàn khai báo sinh ĐÚNG một nhóm 3D', nhomSan.length === 1, `${nhomSan.length} nhóm · ${nhomSan.map((g) => g.name).join(',')}`);
  ok('nhóm sàn neo về ĐÚNG entity 2D vẽ ra nó', nhomSan[0]?.entityId === 'e-san', `entityId=${nhomSan[0]?.entityId ?? '(trống)'}`);
  ok('nhóm sàn mang CHÍNH mã vật liệu của entity, không mã thứ hai', nhomSan[0]?.specId === 'ps-soi', `specId=${nhomSan[0]?.specId ?? '(trống)'}`);
  // Đây là chỗ moat được quảng cáo: KHAI thì không được gắn cờ suy đoán.
  ok('sàn KHAI BÁO không bị gắn nhãn suy đoán', nhomSan[0]?.semanticProvenance === 'declared', `provenance=${nhomSan[0]?.semanticProvenance}`);
  // Màu KHÔNG được là màu theme khi entity đã có màu riêng đến từ vật liệu người chọn.
  const sanCoMau: HatchEntity = { ...san, color: '#5a3a1f' };
  const scMau = docToObjScene({ ...doc, entities: [sanCoMau, ghe] }, { wallHeightMm: 2700 });
  const sanMau = scMau.groups.find((g) => g.semanticKind === 'floor');
  ok('màu mặt sàn 3D đến từ entity, KHÔNG phải màu theme', sanMau?.colorHex === '#5a3a1f', `colorHex=${sanMau?.colorHex}`);

  // ĐỔI VẬT LIỆU → 3D PHẢI MANG MÃ MỚI (ca then chốt của cổng G4).
  const sauDoi = replaceMaterialReferences(doc, 'ps-soi', 'ps-ocho').doc;
  const sanSauDoi = docToObjScene(sauDoi, { wallHeightMm: 2700 }).groups.find((g) => g.semanticKind === 'floor');
  ok('đổi vật liệu sàn ở 2D ⇒ 3D đọc mã MỚI (một nguồn, không bản sao)', sanSauDoi?.specId === 'ps-ocho', `specId ở 3D sau khi đổi = ${sanSauDoi?.specId ?? '(trống)'}`);

  // LUẬT PASS: sống qua ĐÓNG/MỞ LẠI, không chỉ trong một phiên chạy.
  const moLai = importIdf(exportIdf([{ id: 's1', name: 'Mặt bằng', doc: sauDoi }], { projectName: 'Moat guard' }))?.sheets?.[0]?.doc as Doc | undefined;
  const sanMoLai = moLai ? docToObjScene(moLai, { wallHeightMm: 2700 }).groups.find((g) => g.semanticKind === 'floor') : undefined;
  ok('sau LƯU → MỞ LẠI, mặt sàn 3D vẫn neo đúng entity', sanMoLai?.entityId === 'e-san', `entityId=${sanMoLai?.entityId ?? '(trống)'}`);
  ok('sau LƯU → MỞ LẠI, mặt sàn 3D vẫn mang vật liệu người đã chọn', sanMoLai?.specId === 'ps-ocho', `specId=${sanMoLai?.specId ?? '(trống)'}`);

  // ĐƯỜNG LÙI — bản vẽ cũ chưa ai khai `slab`. Sàn vẫn phải dựng, và phải KHAI THẬT là suy ra.
  const docCu: Doc = { ...doc, entities: [{ ...san, elementType: undefined }, ghe] };
  const sanCu = docToObjScene(docCu, { wallHeightMm: 2700 }).groups.filter((g) => g.semanticKind === 'floor');
  ok('bản vẽ chưa khai `slab` VẪN dựng được sàn', sanCu.length > 0 && sanCu[0].positions.length > 0, `${sanCu.length} nhóm · tên=${sanCu.map((g) => g.name).join(',')}`);
  ok('sàn đường lùi khai THẬT là suy ra (derived, không entityId giả)', sanCu.every((g) => g.semanticProvenance === 'derived' && g.entityId === undefined), `provenance=${sanCu.map((g) => g.semanticProvenance).join(',')}`);
}

console.log(`\n${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
