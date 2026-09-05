#!/usr/bin/env node
/**
 * scripts/nghiem-thu-g4-moat.mjs — CỔNG G4 · NGHIỆM THU MOAT BẰNG HÀNH VI, KHÔNG BẰNG KIỂU DỮ LIỆU.
 *
 * ⛔ VÌ SAO TỒN TẠI. Luật chủ dự án: *"Nếu moat chỉ tồn tại dưới dạng type/interface/tài liệu mà
 * người dùng KHÔNG trải nghiệm được hiệu ứng của nó ⇒ CHƯA HOÀN THÀNH."* Repo có đủ `matId`,
 * `specId`, `srcInsertId`, `BuildRecipe`, `MaterialImpact`, `boqFingerprint` — nhưng **có kiểu
 * không bằng có dây, và có dây không bằng có điện**. Tệp này chạy TRỌN một chuỗi trên vài vật
 * đại diện, dùng ĐÚNG hàm sản xuất (không hàm mô phỏng nào), và đòi:
 *
 *   THAO TÁC → GHI XUỐNG → ĐÓNG/TẢI LẠI → VÀO LẠI → CÙNG MỘT SỰ THẬT.
 *
 * ⚠️ BỘ NÀY TỰ HIỆU CHUẨN. `--hieu-chuan` dựng một thế giới BIẾT CHẮC HỎNG (bẻ đúng một sợi dây
 * định danh) rồi chạy CHÍNH bộ khẳng định này lên đó và ĐÒI NÓ PHẢI ĐỎ. Bộ nghiệm thu không đỏ
 * nổi ở ca hỏng là bộ vô giá trị — nó chỉ đang in chữ PASS.
 *
 * VÌ SAO KHÔNG LÁI TRÌNH DUYỆT. Sự thật của IF **không nằm trên màn** — `Doc` sống trong bộ nhớ
 * client rồi vào IndexedDB (`lib/sheets-persist.ts`), BOQ tính THUẦN từ `Doc`, `.idf`/`.idfc` là
 * JSON. Màn hình nói "vẫn còn" không chứng minh được gì. Bộ này đo ĐÚNG chỗ sự thật nằm, và đo
 * mắt ĐÓNG/TẢI LẠI bằng chính bộ tuần tự hoá mà app dùng (`exportIdf`/`importIdf`,
 * `exportIdfc`/`importIdfc`, và vòng JSON mà `sheets-persist` áp trước khi ghi IDB).
 *
 * CÁCH DÙNG
 *   node scripts/nghiem-thu-g4-moat.mjs                 # chạy trọn chuỗi
 *   node scripts/nghiem-thu-g4-moat.mjs --hieu-chuan    # chỉ chạy phép hiệu chuẩn
 *   node scripts/nghiem-thu-g4-moat.mjs --json          # in JSON kết quả (cho máy đọc)
 *
 * MÃ THOÁT: 0 = mọi khâu ĐẠT · 1 = có khâu ĐỨT (hoặc hiệu chuẩn không đỏ được).
 */

import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GOC = path.resolve(__dirname, '..');

const require = createRequire(path.join(GOC, 'noop.cjs'));
require('sucrase/register/ts');

/* ─────────────────────── nạp ĐÚNG hàm sản xuất ─────────────────────── */

const { resolveLibraryItem } = require(GOC + '/lib/cad/library-item-resolve.ts');
const { docToObjScene } = require(GOC + '/lib/three/cad-to-obj.ts');
const { evalRecipe } = require(GOC + '/lib/three/build-recipe.ts');
const { computeBoq } = require(GOC + '/lib/boq/compute.ts');
const { computeBoqCached, boqFingerprint } = require(GOC + '/lib/boq/cache.ts');
const { getMaterial } = require(GOC + '/lib/materials/resolve.ts');
const { baMatCuaVatLieu } = require(GOC + '/lib/materials/ba-mat.ts');
const { inspectMaterialImpact, replaceMaterialReferences } = require(GOC + '/lib/materials/impact.ts');
const { exportIdf, importIdf } = require(GOC + '/lib/cad/idf.ts');
// ⚠️ 04/09 — trước lượt này bộ moat NHẮC `sheets-persist` 4 lần trong chú thích và GỌI 0 lần.
const { sheetsKey } = require(GOC + '/lib/sheets-persist.ts');
const { exportIdfc, importIdfc } = require(GOC + '/lib/cad/idfc.ts');
const { normalizeAssetFamily } = require(GOC + '/lib/idfc-import/asset-family.ts');
const { resolveIdfcCommerceToSpec } = require(GOC + '/lib/materials/warehouse/catalog-link.ts');
const { buildBoqAppendixSlides, isBoqAppendixStale, shortBoqFingerprint } = require(GOC + '/lib/present-editor/boq-appendix.ts');

/* ─────────────────────── tham số + sổ ghi ─────────────────────── */

const CO = (t) => process.argv.includes(`--${t}`);
const CHI_HIEU_CHUAN = CO('hieu-chuan');
const RA_JSON = CO('json');

const so = [];
let khauHienTai = '—';

function khau(ten) {
  khauHienTai = ten;
}

/** Một khẳng định. `chiTiet` PHẢI mang SỐ hoặc CHUỖI THẬT — cấm ghi "ok". */
function doi(nhan, dat, chiTiet) {
  so.push({ khau: khauHienTai, nhan, dat: !!dat, chiTiet: String(chiTiet) });
  return !!dat;
}

function inSo() {
  let khauTruoc = null;
  for (const d of so) {
    if (d.khau !== khauTruoc) {
      console.log(`\n▸ ${d.khau}`);
      khauTruoc = d.khau;
    }
    console.log(`   ${d.dat ? '✅' : '❌'} ${d.nhan} — ${d.chiTiet}`);
  }
}

/* ─────────────────────── kho giá giả lập (ProductSpec) ─────────────────────── */

/**
 * Ba bản ghi thương mại. Đây là hình lát `MaterialSpecLite` mà `computeBoq` nhận và là hình lát
 * `SpecRef` mà resolver nhận — CÙNG một bản ghi phục vụ hai đầu, đúng tinh thần một-nguồn.
 * `id` = `ProductSpec.id` (FK mềm `Base.specId`), `sku` = business key (`matId` đường legacy).
 */
const KHO_GIA = [
  { id: 'ps-sofa-3s', name: 'Sofa 3 chỗ vải lanh', vendor: 'NCC A', sku: 'SOFA-3S', unit: 'cái', priceVnd: 18_500_000, wastagePercent: 0 },
  { id: 'ps-wrd-240', name: 'Tủ áo âm tường 2m4', vendor: 'Xưởng mộc B', sku: 'WRD-240', unit: 'cái', priceVnd: 32_000_000, wastagePercent: 0 },
  { id: 'ps-go-soi', name: 'Sàn gỗ sồi tự nhiên', vendor: 'NCC C', sku: 'W-210', unit: 'm2', priceVnd: 1_250_000, wastagePercent: 8 },
  { id: 'ps-go-ocho', name: 'Sàn gỗ óc chó', vendor: 'NCC C', sku: 'W-102', unit: 'm2', priceVnd: 2_400_000, wastagePercent: 8 },
];

const specRefs = KHO_GIA.map((s) => ({ id: s.id, sku: s.sku }));

/* ─────────────────────── vật đại diện ─────────────────────── */

/** Ba món: 1 ghế (`furniture`) · 1 tủ áo (`millwork`) · 1 vật liệu gỗ (mặt sàn). */
const MON_KE = [
  { name: 'Sofa 3 chỗ', code: 'SOFA-3S', kind: 'block', vaiNghe: 'furniture' },
  { name: 'Tủ áo 2m4', code: 'WRD-240', kind: 'block', vaiNghe: 'millwork' },
];

/** id sinh tất định — chạy 10 lần ra 10 kết quả giống nhau (điều kiện để so được trước/sau). */
let demId = 0;
const id = (tien) => `${tien}-${String(++demId).padStart(3, '0')}`;

/* ═══════════════════════════════════════════════════════════════════
   CHUỖI
   ═══════════════════════════════════════════════════════════════════ */

/**
 * @param {{beGayDinhDanh3D?: boolean, beGayVatLieuSan3D?: boolean}} pha — cờ hiệu chuẩn: bẻ đúng
 *   MỘT sợi dây mỗi lần. `beGayDinhDanh3D` cắt định danh của MỌI nhóm 3D (ca tổng);
 *   `beGayVatLieuSan3D` chỉ gỡ `specId` khỏi nhóm MẶT SÀN — ca hẹp, để chứng minh rằng ca then
 *   chốt "đổi vật liệu sàn → 3D mang mã mới" thật sự ĐỎ được khi dây đó đứt (nếu không thì nó
 *   xanh vì lý do khác, và chữ PASS của nó vô giá trị).
 */
function chayChuoi(pha = {}) {
  so.length = 0;
  demId = 0;

  /* ── K1 · THƯ VIỆN → ĐẶT VÀO 2D ────────────────────────────────
     Đi ĐÚNG đường `components/cad/LibraryDropBridge.tsx` nhánh `blockdef`: resolver quyết định
     thả gì, entity mang `specId` (FK mềm ProductSpec.id) + `srcBlock`/`srcInsertId` (gia phả). */
  khau('K1 · Thư viện → đặt vào 2D (đường LibraryDropBridge nhánh blockdef)');

  const datVaoBanVe = [];
  for (const mon of MON_KE) {
    const hit = resolveLibraryItem(mon, null, specRefs, null);
    if (!doi(`resolve "${mon.code}"`, !!hit, hit ? `via=${hit.via} keepsIdentity=${hit.keepsIdentity} approximate=${hit.approximate} specId=${hit.specId ?? '—'}` : 'null')) continue;
    if (!doi(`"${mon.code}" giữ danh tính`, hit.via === 'blockdef' && hit.keepsIdentity === true, `via=${hit.via}`)) continue;
    if (!doi(`"${mon.code}" mang specId từ kho giá`, !!hit.specId, `specId=${hit.specId ?? '(trống)'}`)) continue;

    const srcInsertId = id('ins');
    const e = {
      id: id('e'),
      type: 'block',
      layer: 'l-furniture',
      block: hit.def.id,
      at: { x: 1000 + datVaoBanVe.length * 2000, y: 1000 },
      rot: 0,
      sx: 1,
      sy: 1,
      specId: hit.specId,
      // gia phả: từ mẫu nào trên kệ, ở lần chèn nào
      srcBlock: mon.code,
      srcInsertId,
      // định danh ngữ nghĩa (K2) — khai báo, KHÔNG suy đoán
      elementType: 'furniture',
      storey: 'T1',
    };
    datVaoBanVe.push({ mon, e, def: hit.def });
  }
  doi('số món xuống được bản vẽ', datVaoBanVe.length === MON_KE.length, `${datVaoBanVe.length}/${MON_KE.length}`);

  /* mặt sàn gỗ — vùng tô mang specId vật liệu, đây là đường `HatchEntity.specId` */
  const SAN_MM = [
    { x: 0, y: 0 },
    { x: 5000, y: 0 },
    { x: 5000, y: 4000 },
    { x: 0, y: 4000 },
  ];
  const san = {
    id: id('e'),
    type: 'hatch',
    layer: 'l-floor',
    points: SAN_MM,
    pattern: 'ANSI31',
    specId: 'ps-go-soi',
    elementType: 'slab',
    storey: 'T1',
  };
  // Đây là kiểm TIỀN ĐỀ, không phải bằng chứng sản phẩm: `san` là literal của chính bộ đo và
  // đường từ chỗ dựng tới chỗ đọc không qua hàm `lib/` nào. Giữ vì nếu ai sửa dữ liệu mẫu thì
  // phải biết — nhưng nhãn phải nói đúng, và phần KẾT đếm riêng (xem `laTienDe`).
  doi('TIỀN ĐỀ · mặt sàn mang specId vật liệu', san.specId === 'ps-go-soi', `specId=${san.specId} · 5000×4000mm = 20 m²`);

  const doc = {
    entities: [san, ...datVaoBanVe.map((d) => d.e)],
    layers: [
      { id: 'l-furniture', name: 'Đồ rời', color: '#c9a27a', visible: true, locked: false },
      { id: 'l-floor', name: 'Sàn', color: '#8a6a44', visible: true, locked: false },
    ],
  };

  /* ── K2 · ĐỊNH DANH NGỮ NGHĨA ──────────────────────────────────
     Luật K3 của repo: suy đoán phải LỘ RA (`inferred`). Ở đây ta KHAI, nên KHÔNG entity nào được
     mang cờ `inferred` — nếu có, đó là máy đang giả vờ người dùng đã khai. */
  khau('K2 · Định danh ngữ nghĩa (elementType · storey · cờ suy đoán)');
  const coKhai = doc.entities.filter((e) => !!e.elementType).length;
  doi('mọi entity có elementType khai báo', coKhai === doc.entities.length, `${coKhai}/${doc.entities.length}`);
  /* ⚠️ BẢN TRƯỚC 04/09 LÀ TAUTOLOGY: nó đếm `e.inferred` trên `doc.entities` — mảng do CHÍNH bộ
   * đo dựng bằng literal, và chữ `inferred` xuất hiện ĐÚNG ở chỗ đọc, 0 chỗ ghi. Không thao tác
   * nào trong `lib/` làm nó đỏ được; nó chỉ có thể đỏ nếu ai sửa chính bộ đo.
   * ⇒ SIẾT LÊN: hỏi câu đáng hỏi — NGƯỜI ĐÃ KHAI `elementType` thì MÁY CÓ GIẢ VỜ SUY ĐOÁN KHÔNG.
   * Đo trên nhóm 3D do `docToObjScene` sinh (đối xứng với K10, chỗ hình học SUY RA phải khai
   * `derived`). Đây là luật K3 của repo: suy đoán phải LỘ RA, và cũng không được lộ oan. */
  const bịaInferred = doc.entities.filter((e) => e.inferred).length;
  const canhSom = docToObjScene(doc, { wallHeightMm: 2700 }).groups;
  const idDaKhai = new Set(doc.entities.filter((e) => !!e.elementType).map((e) => e.id));
  const neoVaoEntityDaKhai = canhSom.filter((g) => g.entityId && idDaKhai.has(g.entityId));
  const bịaSuyDoan = neoVaoEntityDaKhai.filter((g) => g.inferred || g.semanticProvenance === 'inferred' || g.semanticProvenance === 'derived');
  doi('không entity nào bị gắn cờ suy đoán khi người đã khai',
    bịaInferred === 0 && neoVaoEntityDaKhai.length > 0 && bịaSuyDoan.length === 0,
    `entity 2D inferred=${bịaInferred} · nhóm 3D neo vào entity ĐÃ KHAI=${neoVaoEntityDaKhai.length}` +
      ` · bị gắn suy đoán oan=${bịaSuyDoan.length}` +
      ` · provenance: ${[...new Set(neoVaoEntityDaKhai.map((g) => g.semanticProvenance ?? '(trống)'))].join(',')}`);
  const coGiaPha = doc.entities.filter((e) => e.srcInsertId).length;
  doi('món từ Thư viện mang mã lần-chèn (gia phả)', coGiaPha === datVaoBanVe.length, `${coGiaPha} entity có srcInsertId`);

  /* ── K3 · 2D → 3D, ĐỊNH DANH PHẢI SỐNG XUYÊN BỀ MẶT ────────────
     `docToObjScene` là ĐÚNG hàm chặng 3D dùng. Mỗi object 3D phải mang `entityId` + `specId`
     NGUYÊN VĂN của entity 2D — không mã thứ hai, không ánh xạ lỏng. */
  khau('K3 · 2D → 3D · cùng một mã hay mỗi nơi một mã');
  let scene = docToObjScene(doc, { wallHeightMm: 2700 });
  let nhom = scene.groups;

  if (pha.beGayDinhDanh3D) {
    // ⚠️ CHỈ CHẠY Ở CHẾ ĐỘ HIỆU CHUẨN: cấp cho mỗi nhóm 3D một mã mới — đúng bệnh "mỗi bề mặt
    // một danh tính riêng" mà cổng này sinh ra để bắt.
    nhom = nhom.map((g, i) => ({ ...g, entityId: `3d-rieng-${i}`, specId: g.specId ? `mat-3d-${i}` : undefined }));
  }

  const idDoc = new Set(doc.entities.map((e) => e.id));
  const coEntityId = nhom.filter((g) => g.entityId);
  const idLac = coEntityId.filter((g) => !idDoc.has(g.entityId));
  doi('nhóm 3D neo về entity 2D', coEntityId.length > 0, `${coEntityId.length}/${nhom.length} nhóm mang entityId · tên: ${nhom.map((g) => g.name).join(', ')}`);
  doi('KHÔNG nhóm 3D nào mang mã lạ (không có trong Doc)', idLac.length === 0, `mã lạ=${idLac.length}${idLac.length ? ' → ' + idLac.slice(0, 3).map((g) => g.entityId).join(',') : ''}`);

  const specTrongDoc = new Set(doc.entities.map((e) => e.specId).filter(Boolean));
  const coSpec = nhom.filter((g) => g.specId);
  const specLac = coSpec.filter((g) => !specTrongDoc.has(g.specId));
  doi('vật liệu ở 3D là CÙNG mã vật liệu ở 2D', coSpec.length > 0 && specLac.length === 0, `${coSpec.length} nhóm mang specId · lạ=${specLac.length} · mã: ${[...new Set(coSpec.map((g) => g.specId))].join(',') || '—'}`);

  // Mỗi entity 2D đáng lẽ tìm lại được ở 3D. Đây là chỗ hở dễ nhất — đo, không đoán.
  const entityCoMat3D = doc.entities.filter((e) => coEntityId.some((g) => g.entityId === e.id));
  const entityMat3D = doc.entities.filter((e) => !coEntityId.some((g) => g.entityId === e.id));
  doi(
    'mọi entity 2D tìm lại được ở 3D bằng CHÍNH mã của nó',
    entityCoMat3D.length === doc.entities.length,
    `${entityCoMat3D.length}/${doc.entities.length} entity có nhóm 3D mang đúng id` +
      (entityMat3D.length ? ` · MẤT: ${entityMat3D.map((e) => `${e.type}#${e.id}(${e.elementType ?? '—'})`).join(', ')}` : ''),
  );

  // Mọi entity ĐÃ GÁN VẬT LIỆU phải nhìn thấy được vật liệu đó ở 3D — nếu không, đổi vật liệu ở
  // 2D thì phối cảnh KHÔNG đổi, tức moat đứt đúng chỗ nó được quảng cáo.
  const entityCoSpec = doc.entities.filter((e) => e.specId);
  const specDenDuoc3D = new Set(coSpec.map((g) => g.specId));
  const specKhongDen = entityCoSpec.filter((e) => !specDenDuoc3D.has(e.specId));
  doi(
    'mọi vật liệu gán ở 2D đều tới được 3D',
    specKhongDen.length === 0,
    `${entityCoSpec.length - specKhongDen.length}/${entityCoSpec.length} vật liệu tới 3D` +
      (specKhongDen.length ? ` · KHÔNG TỚI: ${specKhongDen.map((e) => `${e.type}#${e.id} specId=${e.specId} (${e.elementType ?? '—'})`).join(', ')}` : ''),
  );

  /* ── K4 · CÔNG THỨC KHỐI (BuildRecipe) ─────────────────────────
     Ngăn xếp không phá huỷ: tắt một bước KHÔNG mất tham số, hình đổi theo. */
  khau('K4 · BuildRecipe · ngăn xếp không phá huỷ');
  const daySan = [];
  for (let i = 0; i < SAN_MM.length; i++) daySan.push(SAN_MM[i].x / 1000, 0, -SAN_MM[i].y / 1000);
  const viTri = [
    daySan[0], daySan[1], daySan[2], daySan[3], daySan[4], daySan[5], daySan[6], daySan[7], daySan[8],
    daySan[0], daySan[1], daySan[2], daySan[6], daySan[7], daySan[8], daySan[9], daySan[10], daySan[11],
  ];
  const recipe = {
    steps: [
      { id: 'b1', op: { op: 'extrude', h: 420 }, enabled: true, label: 'Thân' },
      { id: 'b2', op: { op: 'arrayLinear', n: 2, dx: 1800, dy: 0, dz: 0 }, enabled: true, label: 'Nhân đôi' },
    ],
  };
  const nen = { positions: viTri, baseMm: 0, heightMm: 420 };
  const ket = evalRecipe(nen, recipe.steps);
  const ketTat = evalRecipe(nen, [recipe.steps[0], { ...recipe.steps[1], enabled: false }]);
  const demDinh = (r) => (r?.geometry?.attributes?.position?.count ?? -1);
  doi('bật 2 bước ≠ tắt bước 2 (ngăn xếp có tác dụng thật)', demDinh(ket) > 0 && demDinh(ket) !== demDinh(ketTat), `bật=${demDinh(ket)} đỉnh · tắt=${demDinh(ketTat)} đỉnh`);
  doi('lỗi một bước KHÔNG làm sập cả ngăn xếp', Object.keys(ket?.stepErrors ?? {}).length === 0, `stepErrors=${JSON.stringify(ket?.stepErrors ?? {})}`);
  doi('TIỀN ĐỀ · tắt bước KHÔNG xoá tham số của bước đó (evalRecipe không sửa input tại chỗ)', recipe.steps[1].op.n === 2 && recipe.steps[1].op.dx === 1800, `n=${recipe.steps[1].op.n} dx=${recipe.steps[1].op.dx}`);
  // gắn recipe lên entity thật để nó đi qua vòng lưu ở K9
  datVaoBanVe[0].e.recipe = recipe;

  /* ── K5 · VẬT LIỆU BA MẶT TỪ MỘT MÃ ────────────────────────────
     `getMaterial()` + `baMatCuaVatLieu()` — cùng một mã cho ra 2D/3D/Trình bày. */
  khau('K5 · Một mã vật liệu → ba mặt (2D · 3D · Trình bày)');
  const facets = getMaterial('W-210', { specs: KHO_GIA, pbrMap: {}, defs: [] });
  const baMat = baMatCuaVatLieu(facets).mats;
  const matThuongMai = baMat.find((m) => m.khoa === 'trinhBay');
  doi('mặt Trình bày đọc được từ bản ghi thương mại', !!matThuongMai && matThuongMai.trangThai !== 'chuaCo', `trạng thái=${matThuongMai?.trangThai} · ${matThuongMai?.tomTat?.vi ?? '—'}`);
  const matPbr = baMat.find((m) => m.khoa === 'dung3d');
  doi('mặt 3D KHAI THẬT khi chưa có PBR (không bịa mặc định)', matPbr?.trangThai === 'chuaCo', `trạng thái=${matPbr?.trangThai}`);
  const coGiaTrongPbr = JSON.stringify(facets.pbr ?? {}).includes('priceVnd');
  doi('giá KHÔNG bị chép sang mặt thị giác (luật 2.1.9.i)', !coGiaTrongPbr, `pbr chứa priceVnd = ${coGiaTrongPbr}`);

  /* ── K6 · BOQ TRỎ CÙNG MỘT SỰ THẬT ────────────────────────────── */
  khau('K6 · BOQ đọc CÙNG Doc, CÙNG specId');
  const boq1 = computeBoq(doc, KHO_GIA);
  const dongSan = boq1.rows.find((r) => r.specId === 'ps-go-soi');
  doi('mặt sàn ra 1 dòng BOQ đúng mã', !!dongSan, dongSan ? `specId=${dongSan.specId} qty=${dongSan.qty} ${dongSan.unit} · ${dongSan.thanhTien?.toLocaleString('vi-VN')}₫` : 'không có dòng nào');
  doi('diện tích BOQ = diện tích hình học thật (20 m²)', !!dongSan && Math.abs(dongSan.qty - 20) < 0.001, `qty=${dongSan?.qty}`);
  const dongMon = boq1.rows.filter((r) => r.kind === 'count');
  doi('món rời từ Thư viện lên BOQ (không rơi âm thầm)', dongMon.length === datVaoBanVe.length, `${dongMon.length}/${datVaoBanVe.length} dòng đếm`);
  const loiThieuMa = boq1.errors.filter((e) => String(e.reason).startsWith('missing-specId'));
  doi('không món nào thiếu mã', loiThieuMa.length === 0, `lỗi thiếu mã=${loiThieuMa.length}`);
  const tongTruoc = boq1.totalAmount;
  doi('BOQ có tổng tiền tính được', Number.isFinite(tongTruoc) && tongTruoc > 0, `tổng=${tongTruoc?.toLocaleString('vi-VN')}₫`);

  /* ── K7 · TRÌNH CHIẾU THAM CHIẾU ĐẦU RA (vân tay Doc) ─────────── */
  khau('K7 · Trình chiếu neo vào vân tay Doc');
  const vanTayTruoc = boqFingerprint(doc);
  const slides = buildBoqAppendixSlides({
    rows: boq1.rows.map((r) => ({ ...r })),
    errors: boq1.errors,
    projectId: 'g4-moat',
    fingerprint: vanTayTruoc,
    generatedAt: 1_756_000_000_000,
    lang: 'vi',
    projectName: 'Nghiệm thu G4',
  });
  doi('dựng được phụ lục BOQ trong deck', Array.isArray(slides) && slides.length > 0, `${slides.length} trang`);
  const meta = slides.find((s) => s.boqAppendix)?.boqAppendix;
  doi('phụ lục GHI vân tay Doc lúc dựng', !!meta?.fingerprint, `vân tay ngắn=${meta?.fingerprint ?? '—'}`);
  doi('lúc chưa đổi gì thì phụ lục KHÔNG báo cũ', isBoqAppendixStale(meta, vanTayTruoc) === false, `stale=${isBoqAppendixStale(meta, vanTayTruoc)}`);

  /* ── K8 · ĐỔI THƯỢNG NGUỒN → XUÔI DÒNG NHÌN THẤY ĐƯỢC ─────────
     Đổi sàn từ gỗ sồi sang gỗ óc chó. Máy TRÌNH tác động, NGƯỜI quyết, rồi mới áp. */
  khau('K8 · Đổi thượng nguồn → ảnh hưởng xuôi dòng + NGƯỜI quyết');
  const tacDong = inspectMaterialImpact(doc, 'ps-go-soi');
  doi('máy trình được BẢNG TÁC ĐỘNG trước khi đổi', tacDong.totalReferences > 0, `${tacDong.totalReferences} tham chiếu · surface=${tacDong.counts.surface} · đầu ra ăn theo: 2D=${tacDong.consumers.drawing2d} 3D=${tacDong.consumers.model3d} BOQ=${tacDong.consumers.boq} Present=${tacDong.consumers.presenting}`);

  // NGƯỜI QUYẾT — không có đường nào tự áp: `replaceMaterialReferences` là hàm THUẦN, chỉ chạy
  // khi caller gọi. Bằng chứng cấu trúc: nó KHÔNG được gọi từ trong `inspectMaterialImpact`.
  const nguonImpact = require('node:fs').readFileSync(path.join(GOC, 'lib/materials/impact.ts'), 'utf8');
  const tuAp = /inspectMaterialImpact[\s\S]*?replaceMaterialReferences\(/.test(
    nguonImpact.slice(nguonImpact.indexOf('export function inspectMaterialImpact'), nguonImpact.indexOf('export function replaceMaterialReferences')),
  );
  doi('KHÔNG có đường tự áp — người phải bấm', !tuAp, `trong inspectMaterialImpact gọi replace = ${tuAp}`);

  const ketQuaDoi = replaceMaterialReferences(doc, 'ps-go-soi', 'ps-go-ocho');
  const doc2 = ketQuaDoi.doc;
  doi('áp xong đổi đúng số tham chiếu', ketQuaDoi.changedReferences === tacDong.totalReferences, `đổi=${ketQuaDoi.changedReferences}/${tacDong.totalReferences}`);
  doi('Doc cũ KHÔNG bị sửa tại chỗ (lùi được)', doc.entities.find((e) => e.type === 'hatch').specId === 'ps-go-soi', `doc gốc vẫn specId=ps-go-soi`);

  const boq2 = computeBoq(doc2, KHO_GIA);
  const dongSan2 = boq2.rows.find((r) => r.specId === 'ps-go-ocho');

  /* ═══ NEO NGOÀI · con số kỳ vọng TÍNH TAY, KHÔNG đi qua `computeBoq` ═══════════════════
     ⚠️ VÌ SAO CÓ KHỐI NÀY (đo 05/09, ba mắt dưới từng là "SO GƯƠNG"):
       ba mắt "BOQ sau mở lại / sau nạp lại ra đúng số cũ" so HAI KẾT QUẢ CỦA CÙNG MỘT HÀM.
       Hàm hỏng thì cả hai vế cùng sai GIỐNG NHAU ⇒ vẫn bằng nhau ⇒ mắt vẫn xanh.
       Bằng chứng chạy được: bẻ `computeBoq` trả `{rows:[],totalAmount:0}` ⇒ mắt
       "① .idf — BOQ sau mở lại RA ĐÚNG SỐ CŨ" VẪN XANH (0₫ === 0₫, 0 dòng === 0 dòng).
       Và neo `totalAmount > 0` từng thêm cho mắt IndexedDB cũng KHÔNG cứu được: bẻ hàm trả
       một hằng số dương thì cả ba mắt xanh trở lại.
     ⇒ Neo phải đến từ NGOÀI hàm đang nghi: tính thẳng từ hình học + bảng giá của bộ đo.
       Sàn 5000×4000mm = 20 m² · óc chó 2.400.000₫/m² · hao hụt 8% ⇒ 51.840.000₫
       Sofa 18.500.000₫ + tủ áo 32.000.000₫ = 50.500.000₫   ⇒ TỔNG 102.340.000₫
     Neo này ĐỎ ngay khi `computeBoq` trả rỗng, trả hằng số, quên hao hụt, hay đổi đơn vị. */
  const M2_SAN_TAY = ((SAN_MM[1].x - SAN_MM[0].x) / 1000) * ((SAN_MM[2].y - SAN_MM[1].y) / 1000);
  const GIA_OCCHO = KHO_GIA.find((s) => s.id === 'ps-go-ocho');
  const TIEN_SAN_TAY = M2_SAN_TAY * GIA_OCCHO.priceVnd * (1 + GIA_OCCHO.wastagePercent / 100);
  const TIEN_MON_TAY = datVaoBanVe.reduce((t, d) => t + (KHO_GIA.find((s) => s.id === d.e.specId)?.priceVnd ?? 0), 0);
  const TONG_TAY = TIEN_SAN_TAY + TIEN_MON_TAY;
  const SO_DONG_TAY = 1 + datVaoBanVe.length; // 1 dòng sàn + mỗi món rời một dòng
  doi('NEO NGOÀI · BOQ khớp con số tính tay từ hình học + bảng giá (không so gương)',
    boq2.totalAmount === TONG_TAY && boq2.rows.length === SO_DONG_TAY,
    `máy=${boq2.totalAmount?.toLocaleString('vi-VN')}₫/${boq2.rows.length} dòng · tay=${TONG_TAY.toLocaleString('vi-VN')}₫/${SO_DONG_TAY} dòng (sàn ${M2_SAN_TAY} m² × ${GIA_OCCHO.priceVnd.toLocaleString('vi-VN')}₫ × ${1 + GIA_OCCHO.wastagePercent / 100})`);
  doi('BOQ tự đổi theo — KHÔNG ai đi đồng bộ tay', !!dongSan2 && dongSan2.thanhTien !== dongSan?.thanhTien, `trước=${dongSan?.thanhTien?.toLocaleString('vi-VN')}₫ → sau=${dongSan2?.thanhTien?.toLocaleString('vi-VN')}₫`);

  const vanTaySau = boqFingerprint(doc2);
  doi('vân tay Doc đổi ⇒ phụ lục deck BÁO CŨ', isBoqAppendixStale(meta, vanTaySau) === true, `stale=${isBoqAppendixStale(meta, vanTaySau)} · ${shortBoqFingerprint(vanTayTruoc)} → ${shortBoqFingerprint(vanTaySau)}`);

  const scene2 = docToObjScene(doc2, { wallHeightMm: 2700 });
  // ⚠️ CHỈ CHẠY Ở CHẾ ĐỘ HIỆU CHUẨN HẸP: gỡ `specId` khỏi ĐÚNG nhóm mặt sàn — đúng sợi dây mà
  // khâu này đo. Nhóm khác giữ nguyên, nên nếu khẳng định dưới vẫn xanh thì nó đang xanh nhờ
  // vật liệu của ĐỒ RỜI, không phải nhờ mặt sàn ⇒ khẳng định sai chỗ.
  const nhom2 = pha.beGayVatLieuSan3D
    ? scene2.groups.map((g) => (g.semanticKind === 'floor' ? { ...g, specId: undefined } : g))
    : scene2.groups;
  const specTrong3DSau = new Set(nhom2.map((g) => g.specId).filter(Boolean));
  doi(
    '3D cũng đọc mã MỚI (một nguồn, không bản sao)',
    specTrong3DSau.has('ps-go-ocho') && !specTrong3DSau.has('ps-go-soi'),
    `mã 3D sau khi đổi: ${[...specTrong3DSau].join(',') || '(không nhóm nào mang specId)'} · có mã mới=${specTrong3DSau.has('ps-go-ocho')}`,
  );

  const cache1 = computeBoqCached('g4-moat', doc, KHO_GIA);
  const cache2 = computeBoqCached('g4-moat', doc, KHO_GIA);
  const cache3 = computeBoqCached('g4-moat', doc2, KHO_GIA);
  doi('cache KHÔNG cắm số cũ khi Doc đổi', cache2.hit === true && cache3.hit === false, `lần2 hit=${cache2.hit} · sau khi đổi hit=${cache3.hit}`);
  void cache1;

  /* ── K9 · LƯU → ĐÓNG → MỞ LẠI ─────────────────────────────────
     Ba đường lưu THẬT của app, không đường mô phỏng nào:
       ① `.idf`   — tệp dự án (exportIdf/importIdf)
       ② IndexedDB — `sheets-persist` JSON round-trip trước khi ghi (xem docstring tệp đó)
       ③ `.idfc`  — một cấu kiện rời (exportIdfc/importIdfc) */
  khau('K9 · LƯU → ĐÓNG → MỞ LẠI (ba đường lưu thật)');

  // ① .idf
  const chuoiIdf = exportIdf([{ id: 's1', name: 'Mặt bằng', doc: doc2 }], { projectName: 'Nghiệm thu G4' });
  const doc2Doc = importIdf(chuoiIdf);
  const docMoLai = doc2Doc?.sheets?.[0]?.doc;
  doi('.idf mở lại được', !!docMoLai, docMoLai ? `${docMoLai.entities.length} entity · ${chuoiIdf.length} byte` : `null (${chuoiIdf.length} byte)`);

  if (docMoLai) {
    const truoc = new Map(doc2.entities.map((e) => [e.id, e]));
    let matDinhDanh = 0, matGiaPha = 0, matRecipe = 0, matNguNghia = 0;
    for (const e of docMoLai.entities) {
      const g = truoc.get(e.id);
      if (!g) { matDinhDanh++; continue; }
      if (g.specId !== e.specId) matDinhDanh++;
      if ((g.srcInsertId ?? null) !== (e.srcInsertId ?? null) || (g.srcBlock ?? null) !== (e.srcBlock ?? null)) matGiaPha++;
      if (JSON.stringify(g.recipe ?? null) !== JSON.stringify(e.recipe ?? null)) matRecipe++;
      if ((g.elementType ?? null) !== (e.elementType ?? null) || (g.storey ?? null) !== (e.storey ?? null)) matNguNghia++;
    }
    doi('① .idf — ĐỊNH DANH còn nguyên sau mở lại', matDinhDanh === 0 && docMoLai.entities.length === doc2.entities.length, `mất=${matDinhDanh} · ${docMoLai.entities.length}/${doc2.entities.length} entity`);
    doi('① .idf — GIA PHẢ (srcBlock·srcInsertId) còn nguyên', matGiaPha === 0, `mất=${matGiaPha}`);
    doi('① .idf — CÔNG THỨC KHỐI còn nguyên', matRecipe === 0, `mất=${matRecipe}`);
    doi('① .idf — ĐỊNH DANH NGỮ NGHĨA còn nguyên', matNguNghia === 0, `mất=${matNguNghia}`);

    const boqSauMo = computeBoq(docMoLai, KHO_GIA);
    // Neo vào TONG_TAY (tính ngoài `computeBoq`), KHÔNG so hai kết quả của cùng một hàm — xem
    // khối "NEO NGOÀI" ở K8. Vẫn giữ vế `=== boq2` để bắt ca lệch giữa hai lần chạy.
    doi('① .idf — BOQ sau mở lại RA ĐÚNG SỐ CŨ (neo vào số tính tay)',
      boqSauMo.totalAmount === TONG_TAY && boqSauMo.rows.length === SO_DONG_TAY && boqSauMo.totalAmount === boq2.totalAmount,
      `sau mở lại=${boqSauMo.totalAmount?.toLocaleString('vi-VN')}₫/${boqSauMo.rows.length} dòng · tay=${TONG_TAY.toLocaleString('vi-VN')}₫/${SO_DONG_TAY} · trước khi lưu=${boq2.totalAmount?.toLocaleString('vi-VN')}₫`);
    doi('① .idf — QUYẾT ĐỊNH của người còn hiệu lực', docMoLai.entities.find((e) => e.type === 'hatch')?.specId === 'ps-go-ocho', `specId sau mở lại = ${docMoLai.entities.find((e) => e.type === 'hatch')?.specId}`);
    /* Mắt này cũng từng SO GƯƠNG: hai vế đều là `boqFingerprint(...)`, nên bẻ hàm trả một chuỗi
       hằng thì hai vế vẫn bằng nhau ⇒ xanh (đo 05/09 bằng đột biến tạm trong `boqFingerprint`,
       đã gỡ khỏi mã sản phẩm sau khi đo: mắt này lúc đó VẪN XANH).
       Neo ngoài cho một hàm băm không phải "một con số tính tay" mà là SỨC PHÂN BIỆT: cùng Doc
       ⇒ cùng vân tay, KHÁC Doc ⇒ KHÁC vân tay. Hằng số trượt cả hai vế sau. */
    const vanTayXeDich = boqFingerprint({
      ...docMoLai,
      entities: docMoLai.entities.map((e) => (e.type === 'hatch' ? { ...e, points: e.points.map((p, i) => (i === 0 ? { x: p.x + 1, y: p.y } : p)) } : e)),
    });
    doi('① .idf — vân tay khớp ⇒ deck KHÔNG báo cũ oan (và vân tay PHÂN BIỆT được Doc khác)',
      boqFingerprint(docMoLai) === vanTaySau && vanTaySau !== vanTayTruoc && vanTayXeDich !== vanTaySau,
      `sau mở lại=${shortBoqFingerprint(boqFingerprint(docMoLai))} = trước lưu=${shortBoqFingerprint(vanTaySau)} · khác doc gốc=${vanTaySau !== vanTayTruoc} · xê dịch 1mm đổi vân tay=${vanTayXeDich !== vanTaySau}`);

    // ── LUẬT PASS ĐẦY ĐỦ: THAO TÁC → GHI XUỐNG → ĐÓNG/TẢI LẠI → VÀO LẠI → CÙNG MỘT SỰ THẬT.
    // Mọi khẳng định 3D ở K3/K8 phía trên đo trên Doc CÒN TRONG BỘ NHỚ. Chưa đủ: nếu định danh
    // chỉ sống một phiên chạy thì người dùng đóng máy mở lại là mất. Ở đây DỰNG LẠI 3D từ Doc VỪA
    // ĐỌC RA TỪ TỆP và đòi mặt sàn vẫn neo đúng entity + đúng vật liệu người đã chọn.
    const sceneMoLai = docToObjScene(docMoLai, { wallHeightMm: 2700 });
    const sanMoLai = sceneMoLai.groups.filter((g) => g.semanticKind === 'floor' && g.entityId);
    const idSanTrongTep = new Set(docMoLai.entities.filter((e) => e.elementType === 'slab').map((e) => e.id));
    doi(
      '① .idf — sau MỞ LẠI, mặt sàn 3D vẫn neo đúng entity 2D',
      sanMoLai.length === idSanTrongTep.size && sanMoLai.every((g) => idSanTrongTep.has(g.entityId)),
      `${sanMoLai.length} nhóm sàn mang entityId / ${idSanTrongTep.size} slab trong tệp · id=${sanMoLai.map((g) => g.entityId).join(',') || '—'}`,
    );
    doi(
      '① .idf — sau MỞ LẠI, mặt sàn 3D vẫn mang vật liệu NGƯỜI ĐÃ CHỌN',
      sanMoLai.length > 0 && sanMoLai.every((g) => g.specId === 'ps-go-ocho'),
      `specId ở 3D sau mở lại = ${sanMoLai.map((g) => g.specId ?? '(trống)').join(',') || '(không nhóm sàn nào)'} · người đã chọn = ps-go-ocho`,
    );
  }

  /* ── ② IndexedDB ──────────────────────────────────────────────────────────────
   * ⚠️ BẢN TRƯỚC 04/09 CỦA HAI MẮT NÀY LÀ TAUTOLOGY, ĐO ĐƯỢC:
   *   · nó hỏi `JSON.stringify(round-trip(x)) === JSON.stringify(x)` — đẳng thức này ĐÚNG VỚI
   *     MỌI input, kể cả khi vòng JSON làm rơi `undefined`, biến `Date`→chuỗi, `Map`→`{}`,
   *     `NaN`→`null`. Thực nghiệm: object 6 khoá còn 4 khoá sau vòng, mắt vẫn XANH.
   *     Tức nó KHÔNG thể phát hiện đúng thứ nhãn nó hứa ("không rơi trường nào").
   *   · và nó KHÔNG gọi `sheets-persist` một dòng nào — `grep require.*sheets-persist` = 0.
   *     Chứng minh: XOÁ HẲN `lib/sheets-persist.ts` khỏi repo ⇒ bộ này vẫn 63/63.
   * ⇒ SIẾT LÊN, không nới: ① so SÂU trên object THẬT (không qua JSON) để rơi trường là ĐỎ
   *   ② gọi ĐÚNG `sheetsKey()` của `sheets-persist` và đòi khoá không rơi vào kho mơ hồ —
   *   đây là bất biến #3 mà G1 canh trên trình duyệt, ở đây canh ở tầng hàm. */
  const quaIdb = JSON.parse(JSON.stringify({ v: 1, activeId: 's1', sheets: [{ id: 's1', name: 'Mặt bằng', doc: doc2 }], ts: 1 }));
  const docIdb = quaIdb.sheets[0].doc;

  /** đếm khoá ĐỆ QUY trên object THẬT — `undefined`/hàm/Map cũng được đếm, khác hẳn JSON. */
  const demKhoaSau = (v, sau = 0) => {
    if (sau > 12 || v === null || typeof v !== 'object') return 0;
    let n = 0;
    for (const k of Object.keys(v)) { n += 1; n += demKhoaSau(v[k], sau + 1); }
    return n;
  };
  const khoaGoc = demKhoaSau(doc2);
  const khoaSau = demKhoaSau(docIdb);
  doi('② IndexedDB — Doc qua vòng JSON không rơi trường nào',
    khoaSau === khoaGoc && khoaGoc > 0,
    `khoá đệ quy: gốc=${khoaGoc} → sau vòng=${khoaSau}${khoaSau === khoaGoc ? '' : ` · RƠI ${khoaGoc - khoaSau}`}`);

  const KHO_MO_HO = ['local', '', 'undefined', 'null', 'anon'];
  const khoaIdb = sheetsKey('u-g4-moat', '/projects/g4-moat/cad', 'g4-moat');
  const khoaThieuDuAn = sheetsKey('u-g4-moat', '/projects/g4-moat/cad', null);
  doi('② IndexedDB — khoá kho do CHÍNH sheets-persist sinh, mang cả người lẫn dự án',
    khoaIdb === 'u-g4-moat::/projects/g4-moat/cad::g4-moat' && !KHO_MO_HO.includes(khoaIdb.split('::')[0]),
    `khoá=${khoaIdb}`);
  doi('② IndexedDB — thiếu dự án thì khoá NGẮN LẠI, KHÔNG bịa đoạn rỗng (tránh kho mơ hồ)',
    khoaThieuDuAn === 'u-g4-moat::/projects/g4-moat/cad' && !khoaThieuDuAn.endsWith('::'),
    `khoá=${khoaThieuDuAn}`);

  // Neo vào TONG_TAY. Neo cũ `totalAmount > 0` KHÔNG đủ: đo 05/09, bẻ `computeBoq` trả một hằng
  // số dương thì mắt này xanh trở lại — "cả hai vế cùng sai giống nhau" vẫn qua được ngưỡng > 0.
  const boqIdb = computeBoq(docIdb, KHO_GIA);
  doi('② IndexedDB — BOQ sau nạp lại ra đúng số (neo vào số tính tay)',
    boqIdb.totalAmount === TONG_TAY && boqIdb.rows.length === SO_DONG_TAY && boqIdb.totalAmount === boq2.totalAmount,
    `sau nạp lại=${boqIdb.totalAmount?.toLocaleString('vi-VN')}₫/${boqIdb.rows.length} dòng · tay=${TONG_TAY.toLocaleString('vi-VN')}₫/${SO_DONG_TAY}`);

  // ③ .idfc — một cấu kiện rời, mang cả hình học lẫn thương mại
  const chuoiIdfc = exportIdfc({
    meta: { name: 'Sofa 3 chỗ vải lanh', code: 'SOFA-3S', kind: 'furniture' },
    body: {
      type: 'component',
      geom2d: { group: 'phong-khach', w: 1800, h: 800, prims: [{ t: 'rect', x: -900, y: -400, w: 1800, h: 800 }] },
      geom3d: { heightMm: 800, matId: 'ps-sofa-3s' },
    },
    commerce: { sku: 'SOFA-3S', vendor: 'NCC A', priceVnd: 18_500_000, unit: 'cái' },
  });
  const idfcMoLai = importIdfc(chuoiIdfc);
  doi('③ .idfc mở lại được', !!idfcMoLai, idfcMoLai ? `${chuoiIdfc.length} byte · kind=${idfcMoLai.meta.kind}` : `null (${chuoiIdfc.length} byte)`);
  if (idfcMoLai) {
    const f = idfcMoLai;
    doi('③ .idfc — mã cấu kiện còn nguyên', f.meta.code === 'SOFA-3S', `code=${f.meta.code}`);
    doi('③ .idfc — hình học 2D còn nguyên', (f.body.geom2d?.prims ?? []).length === 1, `${(f.body.geom2d?.prims ?? []).length} prim · ${f.body.geom2d?.w}×${f.body.geom2d?.h}`);
    doi('③ .idfc — mã vật liệu 3D còn nguyên', f.body.geom3d?.matId === 'ps-sofa-3s', `matId=${f.body.geom3d?.matId ?? '—'}`);
    /* ── ③b · NỐI VỀ KHO BẰNG KHOÁ BẤT BIẾN — đo HÀNH VI, không đo hình dạng ──────────
     * ⚠️ BẢN TRƯỚC 04/09 CỦA MẮT NÀY ĐO SAI CHỖ: nó hỏi `hasOwnProperty(commerce,'specId')`
     * trên object mà CHÍNH bộ moat vừa viết ra vài dòng trên. Thực nghiệm: `exportIdfc`
     * pass-through và `importIdfc:465` cast nguyên object commerce ⇒ chỉ cần bộ moat tự thêm
     * `specId` vào input là mắt XANH, KHÔNG đổi một dòng mã sản xuất nào. Đó là tự chấm điểm,
     * và nó phạm đúng lời mở đầu tệp này: "có kiểu không bằng có dây, có dây không bằng có điện".
     *
     * Bản này SIẾT LÊN, không nới xuống — đi qua ĐƯỜNG SINH THẬT (`normalizeAssetFamily`) rồi
     * hỏi câu duy nhất đáng hỏi: NHÀ CUNG CẤP ĐỔI MÃ HÀNG THÌ TỆP CŨ CÒN NỐI ĐÚNG KHÔNG.
     */
    const NGUON = 'https://ncc.example/sofa-3s';
    const ungVien = {
      name: 'Sofa 3 chỗ vải lanh',
      code: 'SOFA-3S',
      kind: 'furniture',
      origin: { kind: 'user-upload', originalName: 'sofa.json', contentHash: 'a'.repeat(64) },
      license: { id: 'proprietary', sourceUrl: NGUON },
      dims: {
        wMm: { value: 1800, flag: 'verified', source: NGUON },
        dMm: { value: 800, flag: 'verified', source: NGUON },
        hMm: { value: 800, flag: 'verified', source: NGUON },
      },
      // ĐÚNG hình dạng UI đưa vào: `CatalogLink` vốn ĐÃ mang cả khoá bất biến lẫn business key.
      catalog: { specId: 'ps-sofa-3s', sku: 'SOFA-3S', vendor: 'NCC A' },
    };
    const ho = normalizeAssetFamily(ungVien, { now: '2026-09-04T00:00:00.000Z' });
    const idfcThat = ho.idfc.ok ? ho.idfc.parsed : null;
    doi('③b .idfc — đường sinh THẬT dựng được cấu kiện', !!idfcThat,
      ho.idfc.ok ? `code=${idfcThat.meta.code} · ${ho.idfc.json.length} byte` : `từ chối: ${ho.idfc.reason}`);

    // ① đường sinh phải CHUYỂN khoá bất biến sang commerce — không bỏ lại trong khoá mở rộng.
    doi('③b .idfc — commerce mang khoá BẤT BIẾN (specId), không chỉ business key',
      idfcThat?.commerce?.specId === 'ps-sofa-3s',
      `commerce.specId=${idfcThat?.commerce?.specId ?? '(không có)'} · sku=${idfcThat?.commerce?.sku ?? '—'}`);

    // ② HÀNH VI THEN CHỐT — kho ĐỔI SKU (NCC đổi mã hàng, chuyện thường), tệp .idfc KHÔNG đổi byte.
    const khoDoiSku = KHO_GIA.map((s) => (s.id === 'ps-sofa-3s' ? { ...s, sku: 'SOFA-3S-V2', matId: null } : { ...s, matId: null }));
    const noiSauDoi = resolveIdfcCommerceToSpec(idfcThat?.commerce, khoDoiSku);
    doi('③b .idfc — SAU KHI KHO ĐỔI SKU, tệp cũ VẪN nối đúng bản ghi',
      noiSauDoi?.spec?.id === 'ps-sofa-3s' && noiSauDoi?.ben === true,
      noiSauDoi
        ? `nối tới ${noiSauDoi.spec.id} qua '${noiSauDoi.via}' · bền=${noiSauDoi.ben} · sku kho nay='${noiSauDoi.spec.sku}' ≠ sku trong tệp='${idfcThat?.commerce?.sku}'`
        : `MẤT NỐI (null) sau khi kho đổi sku`);

    /* ③ ĐƯỜNG LÙI — tệp .idfc GHI TRƯỚC 04/09 chỉ có `sku`. Nó PHẢI mở được và PHẢI nối được
     * khi sku chưa đổi. Đây là mắt canh luật "phần mềm ≠ dữ liệu thiết kế": nâng cấp không được
     * làm hỏng tệp người dùng đã có trên máy. */
    const banCu = importIdfc(chuoiIdfc); // chuoiIdfc dựng ở trên, commerce CHỈ có sku
    const noiBanCu = resolveIdfcCommerceToSpec(banCu?.commerce, KHO_GIA.map((s) => ({ ...s, matId: null })));
    doi('③b .idfc BẢN CŨ (chỉ có sku) vẫn mở được và vẫn nối được — đường lùi còn sống',
      !!banCu && noiBanCu?.spec?.id === 'ps-sofa-3s' && noiBanCu?.via === 'sku',
      banCu
        ? `mở được · nối tới ${noiBanCu?.spec?.id ?? 'null'} qua '${noiBanCu?.via ?? '—'}' · bền=${noiBanCu?.ben}`
        : 'KHÔNG mở được tệp bản cũ');

    /* ④ ĐỐI CHỨNG — chứng minh khẳng định ② KHÔNG tự đúng: CÙNG cú đổi sku đó, tệp bản CŨ
     * (chỉ có business key) thì MẤT NỐI. Không có mắt này thì ② có thể xanh vì lý do tầm thường. */
    const banCuSauDoi = resolveIdfcCommerceToSpec(banCu?.commerce, khoDoiSku);
    doi('③b ĐỐI CHỨNG — tệp chỉ-có-sku thì CÙNG cú đổi đó làm MẤT NỐI (nên khoá bất biến mới đáng)',
      banCuSauDoi === null,
      banCuSauDoi ? `vẫn nối được qua '${banCuSauDoi.via}' ⇒ phép thử không phân biệt được gì` : 'mất nối (null) — đúng như dự đoán');
    /* ⚠️ BẢN TRƯỚC 04/09 ĐỌC MÃ NGUỒN: `/recipe/.test(readFileSync('lib/cad/idfc.ts'))`. Trong
     * tệp đó chữ "recipe" xuất hiện 4 lần, BA trong chú thích — nên xoá dòng khai `recipe?:
     * BuildRecipe` mà giữ chú thích thì mắt VẪN XANH. Đó là đo hình dạng của VĂN BẢN, không phải
     * đo hành vi. ⇒ SIẾT: nhét ngăn xếp thật vào `.idfc`, đi export→import, đòi từng tham số
     * sống sót — kể cả bậc `enabled:false` (không phá huỷ). */
    const chuoiCoRecipe = exportIdfc({
      meta: { name: 'Sofa 3 chỗ vải lanh', code: 'SOFA-3S', kind: 'furniture' },
      body: {
        type: 'component',
        geom2d: { group: 'phong-khach', w: 1800, h: 800, prims: [{ t: 'rect', x: -900, y: -400, w: 1800, h: 800 }] },
        geom3d: { heightMm: 800, matId: 'ps-sofa-3s', recipe: { steps: [
          { id: 'r1', op: { op: 'extrude', h: 420 }, enabled: true, label: 'Thân' },
          { id: 'r2', op: { op: 'arrayLinear', n: 4, dx: 450, dy: 0, dz: 0 }, enabled: false, label: 'Chân' },
        ] } },
      },
      commerce: { sku: 'SOFA-3S', vendor: 'NCC A', priceVnd: 18_500_000, unit: 'cái' },
    });
    const coRecipe = importIdfc(chuoiCoRecipe);
    const bacSau = coRecipe?.body?.geom3d?.recipe?.steps ?? [];
    const bacTat = bacSau.find((s) => s.id === 'r2');
    doi('③ .idfc — CÔNG THỨC KHỐI đi cùng cấu kiện',
      bacSau.length === 2 && bacTat?.enabled === false && bacTat?.op?.n === 4 && bacTat?.op?.dx === 450,
      bacSau.length
        ? `${bacSau.length} bậc sống sót · bậc tắt giữ tham số n=${bacTat?.op?.n} dx=${bacTat?.op?.dx} enabled=${bacTat?.enabled}`
        : 'MẤT ngăn xếp — .idfc chỉ còn lưới chết');
  }

  /* ── K10 · ĐƯỜNG LÙI · bản vẽ CŨ (chưa ai khai `slab`) vẫn phải dựng được ────────
     Thêm nhánh mặt sàn khai báo mà làm chết sàn của bản vẽ cũ thì đó là hồi quy, không phải tiến
     bộ. Doc dưới đây KHÔNG có entity nào khai `elementType='slab'` — đúng hình dạng của mọi `.idf`
     vẽ trước 04/09. Nó phải ra một nhóm sàn `derived` (bbox), KHÔNG mang entityId (vì không ứng
     với entity nào — gán id giả ở đây mới là sai). */
  khau('K10 · Đường lùi · bản vẽ chưa khai `slab` vẫn dựng được sàn');
  const docCu = {
    layers: doc.layers,
    entities: doc.entities.map((e) => {
      const { elementType, ...conLai } = e;
      return e.type === 'hatch' ? { ...conLai, elementType: undefined } : { ...conLai, elementType };
    }),
  };
  const coSlabTrongDocCu = docCu.entities.filter((e) => e.elementType === 'slab').length;
  doi('TIỀN ĐỀ · bản vẽ cũ đúng là KHÔNG khai slab nào', coSlabTrongDocCu === 0, `slab=${coSlabTrongDocCu}`);
  const sceneCu = docToObjScene(docCu, { wallHeightMm: 2700 });
  const sanCu = sceneCu.groups.filter((g) => g.semanticKind === 'floor');
  doi('vẫn dựng được mặt sàn', sanCu.length > 0 && sanCu.some((g) => g.positions.length > 0), `${sanCu.length} nhóm sàn · tên: ${sanCu.map((g) => g.name).join(',') || '—'}`);
  doi(
    'sàn đường lùi khai THẬT là hình học suy ra (derived, không entityId)',
    sanCu.every((g) => g.semanticProvenance === 'derived' && g.entityId === undefined),
    `provenance=${[...new Set(sanCu.map((g) => g.semanticProvenance))].join(',')} · entityId=${sanCu.map((g) => g.entityId ?? '(trống)').join(',')}`,
  );

  return { doc, doc2, docMoLai, boq1, boq2, vanTayTruoc, vanTaySau };
}

/* ═══════════════════════════════════════════════════════════════════
   CHẠY
   ═══════════════════════════════════════════════════════════════════ */

/**
 * ⚠️ 04/09 — CON SỐ PHẢI NÓI ĐÚNG NÓ LÀ GÌ. Trước lượt này phần KẾT in "63/63 khẳng định ĐẠT",
 * trộn chung hai loại khác hẳn nhau: khẳng định đi qua MÃ SẢN PHẨM (bằng chứng thật) và khẳng
 * định kiểm TIỀN ĐỀ của chính phép thử (dữ liệu mẫu có đúng hình dạng dự kiến không). Loại sau
 * KHÔNG chứng minh gì về sản phẩm — làm nó xanh chỉ cần sửa dữ liệu mẫu trong tệp này. Giữ nó
 * (nếu ai sửa dữ liệu mẫu thì phải biết) nhưng ĐẾM RIÊNG, để "N/N ĐẠT" thôi nói quá.
 */
const laTienDe = (d) => d.nhan.startsWith('TIỀN ĐỀ ·');

function tomTat() {
  const dat = so.filter((d) => d.dat).length;
  const tienDe = so.filter(laTienDe).length;
  return { dat, tong: so.length, tienDe, dut: so.filter((d) => !d.dat) };
}

let maThoat = 0;

if (!CHI_HIEU_CHUAN) {
  console.log('═══ G4 · MOAT — chuỗi thật, hàm sản xuất thật ═══');
  try {
    chayChuoi();
  } catch (e) {
    doi('chuỗi chạy tới cuối', false, `NỔ: ${e?.stack?.split('\n').slice(0, 3).join(' | ') ?? e}`);
  }
  inSo();
  const t = tomTat();
  console.log(`\n── KẾT: ${t.dat}/${t.tong} khẳng định ĐẠT ──`);
  console.log(`   trong đó BẰNG CHỨNG SẢN PHẨM ${t.tong - t.tienDe} · kiểm TIỀN ĐỀ của chính bộ đo ${t.tienDe}`);
  console.log(`   (khẳng định "TIỀN ĐỀ ·" chỉ canh dữ liệu mẫu — KHÔNG chứng minh gì về sản phẩm)`);
  if (t.dut.length) {
    console.log('ĐỨT Ở:');
    for (const d of t.dut) console.log(`  · [${d.khau}] ${d.nhan} — ${d.chiTiet}`);
    maThoat = 1;
  }
  if (RA_JSON) console.log('\nJSON=' + JSON.stringify(so));
}

/* ── HIỆU CHUẨN: dựng thế giới BIẾT CHẮC HỎNG, đòi bộ này phải ĐỎ ── */
{
  console.log('\n═══ HIỆU CHUẨN · bẻ dây định danh 2D↔3D, bộ này PHẢI báo đỏ ═══');
  let noHong = false;
  try {
    chayChuoi({ beGayDinhDanh3D: true });
  } catch (e) {
    console.log(`  (chuỗi nổ ở ca hỏng: ${e?.message ?? e})`);
  }
  const kdK3 = so.filter((d) => d.khau.startsWith('K3'));
  const doK3 = kdK3.filter((d) => !d.dat);
  noHong = doK3.length > 0;
  for (const d of kdK3) console.log(`   ${d.dat ? '✅' : '❌'} ${d.nhan} — ${d.chiTiet}`);
  if (noHong) {
    console.log(`\n✅ HIỆU CHUẨN ĐẠT — ca biết-hỏng làm ĐỎ ${doK3.length} khẳng định ở K3.`);
  } else {
    console.log('\n🔴 HIỆU CHUẨN TRƯỢT — bộ nghiệm thu KHÔNG đỏ nổi ở ca hỏng ⇒ mọi chữ PASS của nó vô giá trị.');
    maThoat = 1;
  }
}

/* ── HIỆU CHUẨN HẸP: bẻ ĐÚNG dây vật liệu của mặt sàn, đòi CA THEN CHỐT phải đỏ ──
   Ca hiệu chuẩn tổng ở trên bẻ mọi dây một lượt, nên nó KHÔNG chứng minh được rằng khẳng định
   "đổi vật liệu sàn → 3D mang mã mới" đang xanh NHỜ MẶT SÀN. Ca này chỉ gỡ `specId` của nhóm sàn:
   nếu khẳng định đó vẫn xanh thì nó đang đọc vật liệu của đồ rời, tức đo sai chỗ. */
{
  console.log('\n═══ HIỆU CHUẨN HẸP · gỡ vật liệu khỏi nhóm MẶT SÀN, ca then chốt PHẢI đỏ ═══');
  try {
    chayChuoi({ beGayVatLieuSan3D: true });
  } catch (e) {
    console.log(`  (chuỗi nổ ở ca hỏng: ${e?.message ?? e})`);
  }
  const caThenChot = so.find((d) => d.nhan.startsWith('3D cũng đọc mã MỚI'));
  console.log(`   ${caThenChot?.dat ? '✅' : '❌'} ${caThenChot?.nhan} — ${caThenChot?.chiTiet}`);
  if (caThenChot && !caThenChot.dat) {
    console.log('\n✅ HIỆU CHUẨN HẸP ĐẠT — gỡ vật liệu khỏi mặt sàn thì ca then chốt ĐỎ ⇒ nó thật sự đo mặt sàn.');
  } else {
    console.log('\n🔴 HIỆU CHUẨN HẸP TRƯỢT — ca then chốt vẫn xanh dù mặt sàn mất vật liệu ⇒ nó đang đo nhầm chỗ.');
    maThoat = 1;
  }
}

process.exit(maThoat);
