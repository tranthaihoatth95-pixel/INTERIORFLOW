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
const { exportIdfc, importIdfc } = require(GOC + '/lib/cad/idfc.ts');
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
 * @param {{beGayDinhDanh3D?: boolean}} pha — cờ hiệu chuẩn: bẻ đúng một sợi dây.
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
  doi('mặt sàn mang specId vật liệu', san.specId === 'ps-go-soi', `specId=${san.specId} · 5000×4000mm = 20 m²`);

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
  const bịaInferred = doc.entities.filter((e) => e.inferred).length;
  doi('không entity nào bị gắn cờ suy đoán khi người đã khai', bịaInferred === 0, `inferred=${bịaInferred}`);
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
  doi('tắt bước KHÔNG xoá tham số của bước đó', recipe.steps[1].op.n === 2 && recipe.steps[1].op.dx === 1800, `n=${recipe.steps[1].op.n} dx=${recipe.steps[1].op.dx}`);
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
  doi('BOQ tự đổi theo — KHÔNG ai đi đồng bộ tay', !!dongSan2 && dongSan2.thanhTien !== dongSan?.thanhTien, `trước=${dongSan?.thanhTien?.toLocaleString('vi-VN')}₫ → sau=${dongSan2?.thanhTien?.toLocaleString('vi-VN')}₫`);

  const vanTaySau = boqFingerprint(doc2);
  doi('vân tay Doc đổi ⇒ phụ lục deck BÁO CŨ', isBoqAppendixStale(meta, vanTaySau) === true, `stale=${isBoqAppendixStale(meta, vanTaySau)} · ${shortBoqFingerprint(vanTayTruoc)} → ${shortBoqFingerprint(vanTaySau)}`);

  const scene2 = docToObjScene(doc2, { wallHeightMm: 2700 });
  const specTrong3DSau = new Set(scene2.groups.map((g) => g.specId).filter(Boolean));
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
    doi('① .idf — BOQ sau mở lại RA ĐÚNG SỐ CŨ', boqSauMo.totalAmount === boq2.totalAmount && boqSauMo.rows.length === boq2.rows.length, `${boqSauMo.totalAmount?.toLocaleString('vi-VN')}₫ vs ${boq2.totalAmount?.toLocaleString('vi-VN')}₫ · ${boqSauMo.rows.length} vs ${boq2.rows.length} dòng`);
    doi('① .idf — QUYẾT ĐỊNH của người còn hiệu lực', docMoLai.entities.find((e) => e.type === 'hatch')?.specId === 'ps-go-ocho', `specId sau mở lại = ${docMoLai.entities.find((e) => e.type === 'hatch')?.specId}`);
    doi('① .idf — vân tay khớp ⇒ deck KHÔNG báo cũ oan', boqFingerprint(docMoLai) === vanTaySau, `${shortBoqFingerprint(boqFingerprint(docMoLai))} vs ${shortBoqFingerprint(vanTaySau)}`);
  }

  // ② IndexedDB (vòng JSON mà sheets-persist áp trước khi ghi)
  const quaIdb = JSON.parse(JSON.stringify({ v: 1, activeId: 's1', sheets: [{ id: 's1', name: 'Mặt bằng', doc: doc2 }], ts: 1 }));
  const docIdb = quaIdb.sheets[0].doc;
  doi('② IndexedDB — Doc qua vòng JSON không rơi trường nào', JSON.stringify(docIdb) === JSON.stringify(doc2), `${JSON.stringify(docIdb).length} byte`);
  doi('② IndexedDB — BOQ sau nạp lại ra đúng số', computeBoq(docIdb, KHO_GIA).totalAmount === boq2.totalAmount, `${computeBoq(docIdb, KHO_GIA).totalAmount?.toLocaleString('vi-VN')}₫`);

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
    // ⚠️ Đây là chỗ ĐO ĐƯỢC một lỗ, không phải chỗ khoe: `IdfcCommerce` (idfc.ts:189-199) KHÔNG
    // có trường nối về `ProductSpec.id`. Cấu kiện rời chỉ nối bằng `sku` (business key, ĐỔI ĐƯỢC)
    // — trong khi cả Doc lẫn BOQ đều neo bằng `specId` (= ProductSpec.id, BẤT BIẾN).
    const coSpecId = Object.prototype.hasOwnProperty.call(f.commerce ?? {}, 'specId');
    doi('③ .idfc — nối về bản ghi thương mại bằng khoá BẤT BIẾN', coSpecId, `commerce có specId = ${coSpecId} · chỉ có sku='${f.commerce?.sku}' (business key, đổi được)`);
    // ⚠️ `grep -n recipe lib/cad/idfc.ts` = 0 dòng. Cấu kiện lưu vào kho MẤT ngăn xếp dựng hình.
    const idfcCoRecipe = /recipe/.test(require('node:fs').readFileSync(path.join(GOC, 'lib/cad/idfc.ts'), 'utf8'));
    doi('③ .idfc — CÔNG THỨC KHỐI đi cùng cấu kiện', idfcCoRecipe, `chữ "recipe" trong lib/cad/idfc.ts = ${idfcCoRecipe ? 'có' : '0 dòng'}`);
  }

  return { doc, doc2, docMoLai, boq1, boq2, vanTayTruoc, vanTaySau };
}

/* ═══════════════════════════════════════════════════════════════════
   CHẠY
   ═══════════════════════════════════════════════════════════════════ */

function tomTat() {
  const dat = so.filter((d) => d.dat).length;
  return { dat, tong: so.length, dut: so.filter((d) => !d.dat) };
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

process.exit(maThoat);
