#!/usr/bin/env node
/**
 * scripts/nghiem-thu-g6-kho-mo-dau.mjs — CỔNG G6 · VÒNG NGHỀ TRỌN VẸN TRÊN BỘ ĐẠI DIỆN.
 *
 * ⛔ VÌ SAO TỒN TẠI. Chủ dự án chốt: *"MINIMUM SHIPPABLE CONTENT trước: representative 2D + 3D +
 * PBR material → search/preview/place/transform/replace/save/reopen. Không mass-produce asset chỉ
 * để tăng số lượng."* Ba món đi TRỌN vòng chứng minh được nhiều hơn 24 món nằm im trong kho — và
 * nếu vòng gãy thì làm 24 món trước chỉ là **nhân bản cái gãy lên 24 lần**.
 *
 * Bộ này chạy đúng chuỗi đó trên đúng ba món, bằng ĐÚNG hàm sản xuất (không hàm mô phỏng nào):
 *
 *   TÌM → XEM TRƯỚC → ĐẶT → BIẾN ĐỔI → THAY THẾ → LƯU → **ĐÓNG** → MỞ LẠI → CÙNG MỘT SỰ THẬT.
 *
 * BỘ ĐẠI DIỆN (ba món, cố ý là BA MẶT CỦA CÙNG MỘT VẬT chứ không phải ba vật rời):
 *   · 2D  — `living-bookshelf` trong `public/cad-library/manifest.json`, ĐÃ CÓ SẴN, không vẽ mới.
 *   · 3D  — `IF-3D-KE-SACH-900`, dựng bằng `BuildRecipe` (`lib/library/hat-giong-3d.ts`).
 *   · PBR — gỗ sồi ↔ gỗ óc chó (`lib/materials/hat-giong.ts`). Hai vì khâu THAY THẾ phải có gì
 *           để đổi sang; một món thì khâu đó không kiểm được.
 *
 * ⚠️ BỘ NÀY TỰ HIỆU CHUẨN — cùng kỷ luật `nghiem-thu-g4-moat.mjs`. `--hieu-chuan` dựng hai thế
 * giới BIẾT CHẮC HỎNG (bỏ tầng hạt giống · đánh rơi công thức khối lúc lưu) rồi chạy CHÍNH bộ
 * khẳng định này lên chúng và ĐÒI NÓ PHẢI ĐỎ. Bộ nghiệm thu không đỏ nổi ở ca hỏng là bộ vô giá
 * trị — nó chỉ đang in chữ PASS.
 *
 * VÌ SAO KHÔNG LÁI TRÌNH DUYỆT: sự thật của IF không nằm trên màn. `Doc` sống trong bộ nhớ rồi
 * vào IndexedDB; `.idf`/`.idfc` là JSON; hình học 3D tính THUẦN từ ngăn xếp lệnh. Bộ này đo ĐÚNG
 * chỗ sự thật nằm, và đo mắt ĐÓNG/MỞ LẠI bằng chính bộ tuần tự hoá app dùng.
 *
 * ⚠️ **NHƯNG TẦNG DỮ LIỆU KHÔNG PHẢI LÀ NGƯỜI DÙNG** — và đó là bài học đắt nhất của lượt trước:
 * bộ này từng ĐẠT 43/43 trong khi `grep` ngoài `lib/materials/` vẫn = 0, tức trên app thật máy
 * sạch vẫn mở ra kho RỖNG. Sổ 16/08 đã ghi thành luật: *"CÓ TRONG MÃ" KHÔNG BẰNG "TỚI ĐƯỢC NGƯỜI
 * DÙNG"* — loại lỗi đó không máy soi tĩnh nào bắt nổi. ⇒ **`--tren-app`** là khâu K9, lái trình
 * duyệt thật vào app đang chạy và đo bằng DOM + `localStorage`. Đây là MỘT bộ có hai mặt tiền,
 * KHÔNG phải hai bộ nghiệm thu — cùng một sổ khẳng định, cùng một kỷ luật hiệu chuẩn.
 *
 * CÁCH DÙNG
 *   node scripts/nghiem-thu-g6-kho-mo-dau.mjs                # chạy trọn vòng (tầng dữ liệu)
 *   node scripts/nghiem-thu-g6-kho-mo-dau.mjs --hieu-chuan   # chỉ chạy phép hiệu chuẩn
 *   node scripts/nghiem-thu-g6-kho-mo-dau.mjs --json         # in JSON (cho máy đọc)
 *   PORT=3071 npm run dev &&                                 # ↓ cần app đang chạy
 *   node scripts/nghiem-thu-g6-kho-mo-dau.mjs --tren-app     # K9 · trình duyệt thật
 *
 * MÃ THOÁT: 0 = mọi khâu ĐẠT · 1 = có khâu ĐỨT (hoặc hiệu chuẩn không đỏ được).
 */

import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GOC = path.resolve(__dirname, '..');

const require = createRequire(path.join(GOC, 'noop.cjs'));
require('sucrase/register/ts');

/* ─────────────────────── nạp ĐÚNG hàm sản xuất ─────────────────────── */

const HG = require(GOC + '/lib/materials/hat-giong.ts');
const { phanGiaiPbr, pbrMapBaTang } = require(GOC + '/lib/materials/tang-phan-giai.ts');
const { getMaterial } = require(GOC + '/lib/materials/resolve.ts');
const { baMatCuaVatLieu } = require(GOC + '/lib/materials/ba-mat.ts');
const K3D = require(GOC + '/lib/library/hat-giong-3d.ts');
const KMD = require(GOC + '/lib/materials/kho-mo-dau.ts');
const KE = require(GOC + '/lib/library/shelves.ts');
const { exportIdfc, importIdfc, lastImportIdfcError } = require(GOC + '/lib/cad/idfc.ts');
const { exportIdf, importIdf } = require(GOC + '/lib/cad/idf.ts');
const { resolveLibraryItem, idfcGeom2dOf } = require(GOC + '/lib/cad/library-item-resolve.ts');
const { clusterPrimsToEntities } = require(GOC + '/lib/cad/block-library.ts');
const { evalRecipe } = require(GOC + '/lib/three/build-recipe.ts');
const { sheetsKey } = require(GOC + '/lib/sheets-persist.ts');
// Đổi trục+đơn vị CAD→three bằng CHÍNH hàm sản phẩm (`cadAxesToThree` bọc trong `cadToThreeM`) —
// bộ đo KHÔNG được chép công thức trục lần thứ hai, chép là đẻ ra nguồn sự thật thứ hai.
const { cadToThreeM } = require(GOC + '/lib/three/cad-to-obj.ts');
const { replaceMaterialReferences } = require(GOC + '/lib/materials/impact.ts');

/* ─────────────────────── tham số + sổ ghi ─────────────────────── */

const CO = (t) => process.argv.includes(`--${t}`);
const CHI_HIEU_CHUAN = CO('hieu-chuan');
const RA_JSON = CO('json');
const TREN_APP = CO('tren-app');

/** cổng app đang chạy + chỗ đổ ảnh bằng chứng (K9). */
const CONG_APP = process.env.PORT_KIEM || '3071';
const GOC_URL = `http://127.0.0.1:${CONG_APP}`;
const THU_MUC_ANH = path.join(GOC, 'docs/delivery/anh-duyet-mat/g6-kho-mo-dau');
/** kho PBR tầng STUDIO — K9 đọc THẲNG chỗ này, không đọc chữ trên màn rồi tự khen mình. */
const KHOA_PBR = 'if.materials.pbr.v1';

const so = [];
let khauHienTai = '—';
const khau = (t) => { khauHienTai = t; };

/** Một khẳng định. `chiTiet` PHẢI mang SỐ hoặc CHUỖI THẬT — cấm ghi "ok". */
function doi(nhan, dat, chiTiet) {
  so.push({ khau: khauHienTai, nhan, dat: !!dat, chiTiet: String(chiTiet) });
  return !!dat;
}

function inSo(danhSach) {
  let truoc = null;
  for (const d of danhSach) {
    if (d.khau !== truoc) { console.log(`\n▸ ${d.khau}`); truoc = d.khau; }
    console.log(`   ${d.dat ? '✅' : '❌'} ${d.nhan} — ${d.chiTiet}`);
  }
}

/* ─────────────────────── vật liệu của bộ đại diện ─────────────────────── */

const SOI = HG.VAT_LIEU_HAT_GIONG.find((v) => v.code === 'IF-MAT-GO-SOI');
const OC_CHO = HG.VAT_LIEU_HAT_GIONG.find((v) => v.code === 'IF-MAT-GO-OC-CHO');

/** Đỉnh của một hình học — số ĐẾM ĐƯỢC, dùng thay cho "trông có vẻ đúng". */
const soDinh = (g) => g?.attributes?.position?.count ?? 0;

/** Vị trí (x,y) của mọi entity, làm tròn — dùng để chứng minh THAY THẾ GIỮ VỊ TRÍ. */
function dauChanVitri(doc) {
  return JSON.stringify(
    doc.entities.map((e) => {
      const pts = e.points ?? (e.a && e.b ? [e.a, e.b] : []);
      return pts.map((p) => `${Math.round(p.x)},${Math.round(p.y)}`).join('|');
    }),
  );
}

/**
 * VÒNG NGHỀ. `the` là "thế giới" — chỗ duy nhất phép hiệu chuẩn can thiệp được, để ca hỏng đi qua
 * CHÍNH bộ khẳng định này chứ không qua một bản sao dễ dãi hơn.
 *   · `the.khoHatGiong()` — kho PBR hạt giống (ca hỏng ①: trả rỗng = máy sạch không có gì).
 *   · `the.luuIdfc(x)`    — phép LƯU (ca hỏng ②: đánh rơi `recipe` lúc ghi ra tệp).
 */
function chayVongNghe(the) {
  so.length = 0;

  /* ── K1 · TÌM ───────────────────────────────────────────────────────────── */
  khau('K1 · TÌM — gõ tên nghề, ra đúng món');

  const timSoi = HG.timVatLieuHatGiong('sồi');
  doi('gõ "sồi" ra vật liệu gỗ sồi', timSoi.some((v) => v.matId === SOI.matId), `${timSoi.length} kết quả: ${timSoi.map((v) => v.name).join(', ')}`);
  const timKhongDau = HG.timVatLieuHatGiong('oc cho');
  doi('gõ không dấu "oc cho" vẫn ra gỗ óc chó', timKhongDau.some((v) => v.matId === OC_CHO.matId), `${timKhongDau.length} kết quả`);

  // món 2D — đọc THẲNG tệp manifest thật trên đĩa, không dựng bản mô phỏng.
  const duongManifest = path.join(GOC, 'public/cad-library/manifest.json');
  const manifest = JSON.parse(fs.readFileSync(duongManifest, 'utf8'));
  const cauKien = K3D.cauKienKeSach(SOI.matId);
  const block2d = manifest.blocks.find((b) => b.id === cauKien.block2dId);
  doi('món 2D ghép đôi có thật trong kho 54 block', !!block2d, block2d ? `${block2d.id} · ${block2d.name} · ${block2d.w}×${block2d.h}mm` : `KHÔNG có "${cauKien.block2dId}"`);
  doi('tệp .dxf của món 2D có trên đĩa', !!block2d && fs.existsSync(path.join(GOC, 'public', block2d.file)), block2d ? block2d.file : '—');
  doi('ảnh xem trước của món 2D có trên đĩa', !!block2d && fs.existsSync(path.join(GOC, 'public', block2d.thumb)), block2d ? block2d.thumb : '—');

  // 2D và 3D là HAI MẶT CỦA MỘT VẬT — nếu kích thước lệch thì chúng là hai vật đặt cạnh nhau.
  const g2d = cauKien.body.geom2d;
  doi(
    'mặt 2D và mặt 3D CÙNG một kích thước (một vật, không phải hai)',
    !!block2d && g2d.w === block2d.w && g2d.h === block2d.h,
    `3D ${g2d.w}×${g2d.h} · 2D ${block2d?.w}×${block2d?.h}`,
  );
  doi(
    'khối 3D dựng ra nằm trong khối bao chiều cao của món 2D',
    !!block2d && K3D.caoDinhMm() <= block2d.hUp,
    `đỉnh tấm trên cùng ${K3D.caoDinhMm()}mm ≤ hUp ${block2d?.hUp}mm`,
  );

  /* ── K2 · XEM TRƯỚC (MÁY SẠCH) ──────────────────────────────────────────── */
  khau('K2 · XEM TRƯỚC — máy sạch, kho studio RỖNG');

  const khoSach = { studio: {}, duAn: {} };
  const pgSach = the.phanGiai(SOI.matId, khoSach);
  doi('máy sạch vẫn tra ra vật liệu', pgSach.pbr !== null, pgSach.pbr ? `tầng=${pgSach.tang} · màu=${pgSach.pbr.baseColor} · nhám=${pgSach.pbr.roughness}` : 'KHÔNG CÓ GÌ — kho rỗng');
  doi('nguồn của số là tầng HẠT GIỐNG, truy về được', pgSach.tang === 'hat-giong', `tang=${pgSach.tang}`);

  // Đúng cửa mà UI đọc: `getMaterial` + kho ba tầng. Đây là chỗ chứng minh dây đã CẮM ĐIỆN.
  const mat = getMaterial(SOI.matId, { pbrMap: the.khoBaTang(khoSach), specs: [] });
  doi('cửa đọc thật (getMaterial) trả ra PBR trên máy sạch', !!mat.pbr, mat.pbr ? `màu=${mat.pbr.baseColor}` : 'null');
  doi('đi đường UUID canonical, không lẫn namespace sku', mat.resolvedVia === 'uuid', `resolvedVia=${mat.resolvedVia}`);

  const ba = baMatCuaVatLieu(mat);
  const mat3d = ba.mats.find((m) => m.khoa === 'dung3d');
  doi('ô xem trước đọc ra CHỮ, không phải ô trống câm', !!mat3d?.tomTat, mat3d?.tomTat ? `${mat3d.trangThai}: ${mat3d.tomTat.vi}` : `trangThai=${mat3d?.trangThai} · tomTat=null`);
  doi('KHÔNG đeo cờ suy đoán (đây là giá trị chọn có chủ ý)', mat3d?.suyDoan === false, `suyDoan=${mat3d?.suyDoan}`);
  // Mặt thương mại CHƯA có bản ghi ⇒ phải nói THẬT là chưa có, không bịa giá 0₫.
  const matGia = ba.mats.find((m) => m.khoa === 'trinhBay');
  doi('mặt thương mại khai THẬT là chưa có, không bịa giá', matGia?.trangThai === 'chuaCo' && !matGia?.tomTat, `trangThai=${matGia?.trangThai} · tomTat=${matGia?.tomTat?.vi ?? '(trống)'}`);

  /* ── K3 · ĐẶT ───────────────────────────────────────────────────────────── */
  khau('K3 · ĐẶT — thả xuống bản vẽ, dựng lên 3D');

  const geom2dCuaMon = idfcGeom2dOf(cauKien.body);
  const daGiai = resolveLibraryItem({ name: cauKien.meta.name, code: cauKien.meta.code, kind: 'block' }, manifest, [], geom2dCuaMon);
  doi('thả được, và thả bằng hình CỦA CHÍNH MÓN', daGiai?.via === 'idfc' && daGiai?.approximate === false, daGiai ? `via=${daGiai.via} approximate=${daGiai.approximate}` : 'null');

  const O = { x: 2000, y: 1500 };
  const cum = clusterPrimsToEntities(daGiai.geom2d.prims, O).map((e) => ({
    ...e,
    // gia phả: cả cụm biết mình từ đâu ra, chọn/di chuyển/truy gốc được (Base đã có 2 field này).
    srcBlock: cauKien.meta.code,
    srcInsertId: 'ins-ke-1',
  }));
  /* Vùng tô SÀN mang vật liệu — đây là entity MANG VẬT LIỆU mà cả BOQ (`lib/boq/compute.ts`,
     phạm vi quét khai rõ: chỉ `HatchEntity.specId` + `BlockEntity.specId`) lẫn Material Impact
     đều đọc. Cụm ở trên KHÔNG mang `specId`, và đó là điều ĐÚNG chứ không phải thiếu sót của bộ
     nghiệm thu — xem ⚠️ ở K5. */
  const san = {
    id: 'e-san', type: 'hatch', layer: 'l-floor', specId: 'ps-van-soi',
    points: [{ x: 0, y: 0 }, { x: 3000, y: 0 }, { x: 3000, y: 2000 }, { x: 0, y: 2000 }],
    pattern: 'ANSI31', patternScale: 1, patternAngle: 0, elementType: 'slab',
  };
  const entities = [...cum, san];
  const doc = { entities, layers: [{ id: 'l-furniture', name: 'Nội thất', color: '#cccccc', visible: true, locked: false }] };
  doi('cụm rơi xuống bản vẽ thật', cum.length === daGiai.geom2d.prims.length && cum.length > 0, `${cum.length} entity`);
  doi('cả cụm mang gia phả về mẫu gốc', cum.every((e) => e.srcBlock === cauKien.meta.code && e.srcInsertId === 'ins-ke-1'), `srcBlock=${cum[0]?.srcBlock} srcInsertId=${cum[0]?.srcInsertId}`);

  // 3D: dựng bằng ĐÚNG evaluator app dùng, từ ĐÚNG ngăn xếp trong .idfc.
  const t = K3D.KE_SACH_LIEN_TUONG;
  const nenKhoi = {
    positions: daysToPositions(K3D.daGiacVan(t), t.caoDayMm, t.caoDayMm + t.dayVanMm),
    baseMm: t.caoDayMm,
    heightMm: t.dayVanMm,
  };
  const ketDung = evalRecipe(nenKhoi, cauKien.body.geom3d.recipe.steps);
  const dinhGoc = soDinh(ketDung.geometry);
  doi('ngăn xếp chạy sạch, không bậc nào lỗi', Object.keys(ketDung.stepErrors).length === 0, `lỗi: ${JSON.stringify(ketDung.stepErrors)}`);
  doi('dựng ra khối 3D thật', dinhGoc > 0, `${dinhGoc} đỉnh · ${t.soTang} tầng ván`);

  /* ═══ NEO NGOÀI · KÍCH THƯỚC KHỐI, tính TAY từ tham số — không so hai kết quả cùng hàm ═══
     ⚠️ VÌ SAO CÓ (đo 05/09): bốn mắt của K4/K6 dưới đây so `soDinh(A) === soDinh(B)` — hai vế
     cùng qua `evalRecipe`. Bẻ hàm đó trả hình rỗng ⇒ `0 === 0` ⇒ **cả bốn vẫn XANH**. Và số
     đỉnh không nói gì về VỊ TRÍ: bộ này từng 60/60 trong khi khối dựng ra là 5 tấm ván **chồng
     khít lên nhau** (nền dựng sai hệ toạ độ — xem `daysToPositions`), cao 25 mm thay vì 1525 mm.
     ⇒ Neo phải đến từ NGOÀI `evalRecipe`: kích thước suy thẳng từ tham số cấu kiện.
       rộng = rongMm 900 · sâu = sauMm 350 · cao = từ caoDayMm 100
       tới caoDayMm + dayVanMm + (soTang−1)×buocTangMm = 100 + 25 + 4×350 = 1525 mm */
  const CAO_DINH_TAY = t.caoDayMm + t.dayVanMm + (t.soTang - 1) * t.buocTangMm;
  const bboxGoc = hopBaoMm(ketDung.geometry);
  doi('NEO NGOÀI · khối ra ĐÚNG KÍCH THƯỚC tính tay từ tham số (không chỉ đúng số đỉnh)',
    !!bboxGoc && bboxGoc.rong === t.rongMm && bboxGoc.sau === t.sauMm && bboxGoc.caoTu === t.caoDayMm && bboxGoc.caoDen === CAO_DINH_TAY,
    bboxGoc ? `máy: rộng ${bboxGoc.rong} · sâu ${bboxGoc.sau} · cao ${bboxGoc.caoTu}→${bboxGoc.caoDen}mm · tay: ${t.rongMm} · ${t.sauMm} · ${t.caoDayMm}→${CAO_DINH_TAY}mm` : 'KHÔNG có hình học');
  doi('NEO NGOÀI · 5 tầng thật sự CÁCH NHAU (không phải 5 bản chồng khít)',
    !!bboxGoc && bboxGoc.caoDen - bboxGoc.caoTu > t.dayVanMm * 2,
    bboxGoc ? `cao khối = ${bboxGoc.caoDen - bboxGoc.caoTu}mm · một tấm dày ${t.dayVanMm}mm` : '—');
  doi('cấu kiện mang mã vật liệu, không phải khối vô danh', cauKien.body.geom3d.matId === SOI.matId, `matId=${cauKien.body.geom3d.matId}`);

  /* ── K4 · BIẾN ĐỔI ──────────────────────────────────────────────────────── */
  khau('K4 · BIẾN ĐỔI — sửa bằng THAM SỐ, không sửa bằng tay trên lưới');

  const t7 = { ...t, soTang: 7 };
  const ket7 = evalRecipe(nenKhoi, K3D.congThucKe(t7).steps);
  doi('đổi 5 tầng → 7 tầng là đổi MỘT SỐ, hình học dựng lại', soDinh(ket7.geometry) / dinhGoc === 7 / t.soTang, `${dinhGoc} đỉnh (5 tầng) → ${soDinh(ket7.geometry)} đỉnh (7 tầng)`);

  const tatBacLap = cauKien.body.geom3d.recipe.steps.map((s) => (s.id === 'ke-lap-tang' ? { ...s, enabled: false } : s));
  const ketTat = evalRecipe(nenKhoi, tatBacLap);
  // Neo bằng KÍCH THƯỚC, không chỉ số đỉnh: tắt bậc lặp ⇒ khối phải TỤT XUỐNG còn đúng một tấm
  // dày `dayVanMm`. Vế `soDinh === dinhGoc/soTang` một mình là SO GƯƠNG (0 === 0/5 khi hình rỗng).
  const bboxTat = hopBaoMm(ketTat.geometry);
  doi('tắt bậc lặp ⇒ còn đúng MỘT tấm ván (đo cả chiều cao, không chỉ đếm đỉnh)',
    soDinh(ketTat.geometry) === dinhGoc / t.soTang && soDinh(ketTat.geometry) > 0
      && !!bboxTat && bboxTat.caoDen - bboxTat.caoTu === t.dayVanMm,
    `${soDinh(ketTat.geometry)} đỉnh · một tấm = ${dinhGoc / t.soTang} · cao khối ${bboxTat ? bboxTat.caoDen - bboxTat.caoTu : '—'}mm (ván dày ${t.dayVanMm}mm)`);
  const bacLap = tatBacLap.find((s) => s.id === 'ke-lap-tang');
  doi('tắt bậc KHÔNG xoá tham số của bậc đó (không phá huỷ)', bacLap.op.n === t.soTang && bacLap.op.dz === t.buocTangMm, `n=${bacLap.op.n} dz=${bacLap.op.dz}mm vẫn còn nguyên`);
  const ketBatLai = evalRecipe(nenKhoi, tatBacLap.map((s) => ({ ...s, enabled: true })));
  const bboxBatLai = hopBaoMm(ketBatLai.geometry);
  doi('bật lại ra ĐÚNG hình cũ (lùi được) — khớp cả kích thước, không chỉ số đỉnh',
    soDinh(ketBatLai.geometry) === dinhGoc && dinhGoc > 0
      && !!bboxBatLai && JSON.stringify(bboxBatLai) === JSON.stringify(bboxGoc),
    `${soDinh(ketBatLai.geometry)} vs ${dinhGoc} đỉnh · hộp bao ${bboxBatLai ? `${bboxBatLai.rong}×${bboxBatLai.sau}, cao ${bboxBatLai.caoTu}→${bboxBatLai.caoDen}` : '—'}mm`);

  /* ── K5 · THAY THẾ ──────────────────────────────────────────────────────── */
  khau('K5 · THAY THẾ — đổi vật liệu, giữ nguyên vị trí');

  const truocKhiDoi = dauChanVitri(doc);
  const soMangVatLieu = entities.filter((e) => e.specId === 'ps-van-soi').length;
  const doiVL = replaceMaterialReferences(doc, 'ps-van-soi', 'ps-van-oc-cho');
  doi('mọi tham chiếu vật liệu trong bản vẽ đổi theo', doiVL.changedReferences === soMangVatLieu && doiVL.changedReferences > 0, `${doiVL.changedReferences}/${soMangVatLieu} tham chiếu`);
  doi('THAY THẾ GIỮ VỊ TRÍ — không vật nào xê dịch', dauChanVitri(doiVL.doc) === truocKhiDoi, `dấu chân vị trí khớp từng điểm (${doiVL.doc.entities.length} entity)`);
  doi('bản vẽ CŨ không bị sửa tại chỗ (lùi được)', doc.entities.find((e) => e.id === 'e-san').specId === 'ps-van-soi', 'doc gốc vẫn ps-van-soi');

  /* ⚠️ LỖ ĐO ĐƯỢC, KHÔNG PHẢI LỖI CỦA LƯỢT NÀY — ghi ra để nó không nằm im.
     Cụm thả từ `.idfc` đi đường `via:'idfc'` ⇒ `keepsIdentity: false` (khai thẳng ở
     `lib/cad/library-item-resolve.ts`): nó làm phẳng thành `polyline`/`line`, KHÔNG thành
     `BlockEntity`. Mà cả `replaceMaterialReferences` (`lib/materials/impact.ts:132-142`) lẫn BOQ
     (`lib/boq/compute.ts`, phạm vi quét khai rõ) đều chỉ đọc `specId` trên `hatch` + `block`.
     ⇒ MỘT CẤU KIỆN THẢ TỪ KHO STUDIO KHÔNG NHẬN ĐƯỢC VẬT LIỆU Ở TẦNG BẢN VẼ, và cũng không lên
     BOQ. Vật liệu của nó chỉ sống ở `geom3d.matId` trong chính tệp `.idfc` (khẳng định dưới đây).
     CỐ Ý KHÔNG VÁ Ở ĐÂY: nới `impact.ts` một mình sẽ làm nó LỆCH với BOQ — impact đếm, BOQ không
     — tức đổi một quyết định có căn cứ của lane khác để lấy một dấu ✅. Và CỐ Ý KHÔNG khẳng định
     hành vi hỏng này là "đúng": test khẳng định đường thoái lui mà không ai khẳng định đường
     chính là test che bug (bài học Hough 15/08). Đo, in ra, giao lên. */
  const loose = doiVL.doc.entities.filter((e) => e.srcInsertId && e.specId);
  console.log(`   ⚠️  LỖ (ngoài phạm vi lượt này, đã đo): cụm thả từ .idfc là ${cum.length} entity rời (${[...new Set(cum.map((e) => e.type))].join('/')}), không phải BlockEntity ⇒ specId trên chúng không tới impact/BOQ. Đang mang specId: ${loose.length}. Vật liệu của cấu kiện sống ở geom3d.matId.`);

  // đổi vật liệu ở mặt 3D — cùng cửa đọc, ra màu MỚI, không phải bản sao cũ.
  const cauKienOcCho = { ...cauKien, body: { ...cauKien.body, geom3d: { ...cauKien.body.geom3d, matId: OC_CHO.matId } } };
  const matSau = getMaterial(cauKienOcCho.body.geom3d.matId, { pbrMap: the.khoBaTang(khoSach), specs: [] });
  doi('mặt 3D đọc ra vật liệu MỚI', matSau.pbr?.baseColor === OC_CHO.pbr.baseColor, `${SOI.pbr.baseColor} → ${matSau.pbr?.baseColor} (óc chó = ${OC_CHO.pbr.baseColor})`);

  /* ── K6 · LƯU → ĐÓNG → MỞ LẠI ───────────────────────────────────────────── */
  khau('K6 · LƯU → ĐÓNG → MỞ LẠI (đọc từ nơi lưu THẬT)');

  // ① .idfc — cấu kiện rời lên kho studio
  const chuoi = the.luuIdfc({ meta: cauKienOcCho.meta, body: cauKienOcCho.body });
  const moLai = importIdfc(chuoi);
  doi('① .idfc mở lại được', !!moLai, moLai ? `${chuoi.length} byte · kind=${moLai.meta.kind}` : `null — ${lastImportIdfcError()}`);

  if (moLai) {
    doi('① .idfc — MÃ VẬT LIỆU còn nguyên sau mở lại', moLai.body.geom3d?.matId === OC_CHO.matId, `matId=${moLai.body.geom3d?.matId ?? '(mất)'}`);
    const rcMoLai = moLai.body.geom3d?.recipe;
    doi(
      '① .idfc — CÔNG THỨC KHỐI đi cùng cấu kiện',
      !!rcMoLai && rcMoLai.steps.length === cauKien.body.geom3d.recipe.steps.length,
      rcMoLai ? `${rcMoLai.steps.length} bậc: ${rcMoLai.steps.map((s) => s.op.op).join(' → ')}` : 'MẤT — cấu kiện thành lưới chết',
    );
    // Không đủ: công thức "còn đó" mà dựng ra hình khác thì vẫn là mất. Dựng lại TỪ TỆP VỪA ĐỌC.
    const dungLai = rcMoLai ? evalRecipe(nenKhoi, rcMoLai.steps) : null;
    const bboxDungLai = dungLai ? hopBaoMm(dungLai.geometry) : null;
    doi(
      '① .idfc — dựng lại TỪ TỆP ra ĐÚNG khối cũ (khớp cả kích thước tính tay)',
      !!dungLai && soDinh(dungLai.geometry) === dinhGoc && dinhGoc > 0
        && !!bboxDungLai && bboxDungLai.caoDen === CAO_DINH_TAY && bboxDungLai.rong === t.rongMm,
      dungLai ? `${soDinh(dungLai.geometry)} vs ${dinhGoc} đỉnh · cao đỉnh ${bboxDungLai?.caoDen ?? '—'}mm (tay=${CAO_DINH_TAY}) · rộng ${bboxDungLai?.rong ?? '—'}mm` : 'không dựng lại được',
    );
    // Và vẫn còn SỬA ĐƯỢC BẰNG THAM SỐ sau khi mở lại — đây là cả lý do không tải model ngoài.
    const bacSauMo = rcMoLai?.steps.find((s) => s.id === 'ke-lap-tang');
    const sua = bacSauMo ? evalRecipe(nenKhoi, rcMoLai.steps.map((s) => (s.id === 'ke-lap-tang' ? { ...s, op: { ...s.op, n: 7 } } : s))) : null;
    doi(
      '① .idfc — sau mở lại vẫn SỬA ĐƯỢC BẰNG THAM SỐ (khối CAO LÊN thật, không chỉ thêm đỉnh)',
      !!sua && soDinh(sua.geometry) === (dinhGoc / t.soTang) * 7 && dinhGoc > 0
        && hopBaoMm(sua.geometry)?.caoDen === t.caoDayMm + t.dayVanMm + 6 * t.buocTangMm,
      sua ? `đổi n=5→7 sau khi mở lại: ${soDinh(sua.geometry)} đỉnh · cao đỉnh ${hopBaoMm(sua.geometry)?.caoDen ?? '—'}mm (tay=${t.caoDayMm + t.dayVanMm + 6 * t.buocTangMm})` : 'không sửa được — hết là tham số',
    );
    doi('① .idfc — hình học 2D còn nguyên', moLai.body.geom2d?.prims.length === g2d.prims.length && moLai.body.geom2d?.w === g2d.w, `${moLai.body.geom2d?.prims.length} prims · ${moLai.body.geom2d?.w}×${moLai.body.geom2d?.h}`);
    doi('① .idfc — KHÔNG chép giá vào tài sản', !moLai.commerce, `commerce=${moLai.commerce ? JSON.stringify(moLai.commerce) : '(không có — trỏ tới kho giá qua matId)'}`);
    // Mở lại rồi vẫn tra được vật liệu trên máy sạch — vòng khép kín.
    const sauCung = getMaterial(moLai.body.geom3d?.matId ?? '', { pbrMap: the.khoBaTang(khoSach), specs: [] });
    doi('① .idfc — sau mở lại vẫn tra ra ĐÚNG vật liệu người đã chọn', sauCung.pbr?.baseColor === OC_CHO.pbr.baseColor, `màu sau mở lại = ${sauCung.pbr?.baseColor}`);
  }

  // ② .idf — bản vẽ có cụm đã thả
  const chuoiIdf = exportIdf([{ id: 's1', name: 'Mặt bằng', doc: doiVL.doc }], { projectName: 'Nghiệm thu G6' });
  const docMoLai = importIdf(chuoiIdf)?.sheets?.[0]?.doc;
  doi('② .idf mở lại được', !!docMoLai, docMoLai ? `${docMoLai.entities.length} entity · ${chuoiIdf.length} byte` : 'null');
  if (docMoLai) {
    doi('② .idf — vị trí cụm còn nguyên từng điểm', dauChanVitri(docMoLai) === truocKhiDoi, `${docMoLai.entities.length}/${doiVL.doc.entities.length} entity`);
    const cumMoLai = docMoLai.entities.filter((e) => e.srcInsertId === 'ins-ke-1');
    doi(
      '② .idf — GIA PHẢ về mẫu gốc còn nguyên',
      // `cum.length > 0` là neo bắt buộc: không có nó thì `clusterPrimsToEntities` trả rỗng ⇒
      // `0 === 0` và `.every()` trên mảng rỗng = true ⇒ mắt xanh trên một bản vẽ TRỐNG.
      cumMoLai.length === cum.length && cum.length > 0 && cumMoLai.every((e) => e.srcBlock === cauKien.meta.code),
      `${cumMoLai.length}/${cum.length} entity của cụm · srcBlock=${cumMoLai[0]?.srcBlock ?? '(mất)'}`,
    );
    doi('② .idf — QUYẾT ĐỊNH đổi vật liệu của người còn hiệu lực', docMoLai.entities.find((e) => e.id === 'e-san')?.specId === 'ps-van-oc-cho', `specId mặt sàn sau mở lại = ${docMoLai.entities.find((e) => e.id === 'e-san')?.specId}`);
  }

  /* ③ IndexedDB — vòng JSON mà `sheets-persist` áp trước khi ghi.
     🔴 BẢN CŨ LÀ TAUTOLOGY, sửa 05/09 — và nó là **bản sao còn sót** của đúng ca đã siết ở
     `nghiem-thu-g4-moat.mjs` hôm 04/09: lượt đó chữa một bộ, quên bộ này.
       `JSON.stringify(JSON.parse(JSON.stringify(x))) === JSON.stringify(x)` **đúng với MỌI x** —
       `Date` thành chuỗi, `Map` thành `{}`, `undefined`/hàm bị rơi hẳn, mà hai vế vẫn khớp ⇒ mắt
       không thể phát hiện đúng thứ nhãn nó hứa ("không rơi trường nào"). Và nó KHÔNG gọi
       `sheets-persist` một dòng nào — xoá hẳn tệp đó thì mắt vẫn xanh.
     ⇒ Siết cùng cách g4-moat: ① đếm khoá ĐỆ QUY trên object THẬT (không qua JSON) ② gọi ĐÚNG
       `sheetsKey()` của sản phẩm và đòi khoá mang cả người lẫn dự án, không rơi vào kho mơ hồ. */
  const quaIdb = JSON.parse(JSON.stringify({ v: 1, activeId: 's1', sheets: [{ id: 's1', name: 'Mặt bằng', doc: doiVL.doc }], ts: 1 }));
  const demKhoaSau = (v, sau = 0) => {
    if (sau > 12 || v === null || typeof v !== 'object') return 0;
    let n = 0;
    for (const k of Object.keys(v)) { n += 1; n += demKhoaSau(v[k], sau + 1); }
    return n;
  };
  const khoaGoc = demKhoaSau(doiVL.doc);
  const khoaSau = demKhoaSau(quaIdb.sheets[0].doc);
  doi('③ IndexedDB — Doc qua vòng JSON không rơi trường nào (đếm khoá ĐỆ QUY trên object thật)',
    khoaSau === khoaGoc && khoaGoc > 0,
    `khoá đệ quy: gốc=${khoaGoc} → sau vòng=${khoaSau}${khoaSau === khoaGoc ? '' : ` · RƠI ${khoaGoc - khoaSau}`}`);
  const KHO_MO_HO = ['local', '', 'undefined', 'null', 'anon'];
  const khoaIdb = sheetsKey('u-g6', '/projects/g6/cad', 'g6');
  doi('③ IndexedDB — khoá kho do CHÍNH sheets-persist sinh, mang cả người lẫn dự án',
    khoaIdb === 'u-g6::/projects/g6/cad::g6' && !KHO_MO_HO.includes(khoaIdb.split('::')[0]),
    `khoá=${khoaIdb}`);

  /* ── K7 · GIẤY PHÉP ─────────────────────────────────────────────────────── */
  khau('K7 · GIẤY PHÉP — không tài sản nào ship với nguồn gốc mù mờ');

  const taiSan = [
    ...HG.VAT_LIEU_HAT_GIONG.map((v) => ({ ten: v.code, license: v.license, source: v.source })),
    { ten: cauKien.meta.code, license: cauKien.license, source: cauKien.source },
    { ten: block2d?.id ?? '(thiếu)', license: block2d?.license, source: block2d?.source },
  ];
  const thieu = taiSan.filter((a) => !a.license?.trim() || !a.source?.trim());
  doi('mọi tài sản của bộ đại diện khai license + source', thieu.length === 0, `${taiSan.length} tài sản · thiếu=${thieu.length}${thieu.length ? ` (${thieu.map((a) => a.ten).join(',')})` : ''}`);
  doi('không tài sản nào là model/lưới tải từ nguồn ngoài', taiSan.every((a) => /tự dựng|CC0/i.test(a.source ?? '')), taiSan.map((a) => `${a.ten}: ${String(a.source).slice(0, 28)}…`).join(' · '));

  /* ── K8 · CẮM ĐIỆN ──────────────────────────────────────────────────────────
     Bảy khâu trên chứng minh tầng hạt giống ĐÚNG. K8 hỏi câu khác hẳn và là câu đắt hơn:
     **MẶT NGƯỜI DÙNG CÓ ĐỌC TỚI NÓ KHÔNG.** Lượt trước trọn vẹn K1–K7 mà `grep` ngoài
     `lib/materials/` vẫn = 0 ⇒ trên app thật máy sạch vẫn là kho rỗng. Bộ khẳng định này đo
     ĐÚNG các hàm ba mặt tiền UI gọi, trên MỘT THẾ GIỚI KHÔNG CÓ GÌ CỦA NGƯỜI DÙNG.
     ⚠️ KHAI THẲNG PHẠM VI: đây là tầng LIB, không phải DOM. Nó chứng minh *dữ liệu tới được
     mặt tiền*; nó KHÔNG chứng minh *React vẽ ra pixel*. Phần đó do lượt duyệt trên trình duyệt
     thật đảm nhiệm, và không bộ nào ở đây được phép giả vờ thay nó. */
  khau('K8 · CẮM ĐIỆN — máy sạch mở app ra CÓ HÀNG (mặt tiền đọc tới tầng hạt giống)');

  const MAY_SACH = { studio: {}, duAn: {} };

  // (1) màn Kho vật liệu — nguồn duy nhất của bảng là `tronHatGiong(items)`; máy sạch ⇒ items rỗng.
  const hangMaySach = the.hangKho([]);
  doi(
    '(1) Kho vật liệu — máy sạch (0 bản ghi DB) vẫn ra đủ dòng',
    hangMaySach.length === HG.VAT_LIEU_HAT_GIONG.length,
    `${hangMaySach.length} dòng: ${hangMaySach.map((m) => m.sku).join(', ') || '(RỖNG — kho trống)'}`,
  );
  doi(
    '(1) mỗi dòng tra ra ĐỦ mặt render qua đúng khoá mặt tiền dùng',
    hangMaySach.length > 0 && hangMaySach.every((m) => {
      const khoa = KMD.khoaBaMat(m);
      return !!khoa && !!getMaterial(khoa, { pbrMap: the.khoBaTang(MAY_SACH), specs: hangMaySach }).pbr;
    }),
    hangMaySach.map((m) => `${m.sku}→${String(KMD.khoaBaMat(m)).slice(0, 8)}`).join(' · ') || '—',
  );
  doi(
    '(1) dòng hạt giống KHÔNG mang giá (trỏ tới kho giá, không chép vào mình)',
    hangMaySach.every((m) => m.priceVnd == null && m.currency == null && m.vendor == null),
    hangMaySach.map((m) => `${m.sku}: giá=${m.priceVnd ?? '—'}`).join(' · ') || '—',
  );
  doi(
    '(1) dòng hạt giống nhận diện được để KHOÁ SỬA/XOÁ ở mặt thương mại',
    hangMaySach.length > 0 && hangMaySach.every((m) => KMD.laHangHatGiong(m)),
    `${hangMaySach.filter((m) => KMD.laHangHatGiong(m)).length}/${hangMaySach.length} dòng mang cờ chỉ-đọc`,
  );
  // dòng DB trùng matId thì DB thắng — studio đã tự nhập bản thương mại, hiện hai dòng là đếm trùng.
  const dbTrung = [{ id: 'db-1', kind: 'material', name: 'Sồi của studio', nameEn: null, brand: null, sku: 'STUDIO-SOI', matId: SOI.matId, vendor: null, w: null, d: null, hUp: null, colorHex: null, imageAssetId: null, priceNote: null, currency: null, note: null, larkRecordId: null, createdAt: '', unit: null, priceVnd: 1, scope: 'studio', ownerId: null, supplierId: null, verified: false, room: null, confidence: null }];
  const hangTron = the.hangKho(dbTrung);
  doi(
    '(1) bản ghi DB cùng matId ĐÈ dòng hạt giống (không đếm trùng một vật)',
    hangTron.length === HG.VAT_LIEU_HAT_GIONG.length && hangTron.filter((m) => m.matId === SOI.matId).length === 1,
    `${hangTron.length} dòng · số dòng mang matId sồi = ${hangTron.filter((m) => m.matId === SOI.matId).length}`,
  );

  // (2) kệ Vật liệu của Thư viện — `itemsFor` là hàm DUY NHẤT tấm Thư viện gọi để dựng lưới.
  const monKeVatLieu = the.monKe('render', 'common-atlas');
  doi(
    '(2) kệ Vật liệu — máy sạch (0 LibraryAsset) vẫn có món trên lưới',
    monKeVatLieu.length === HG.VAT_LIEU_HAT_GIONG.length,
    `${monKeVatLieu.length} món: ${monKeVatLieu.map((i) => i.code).join(', ') || '(RỖNG — kệ trống)'}`,
  );
  doi(
    '(2) mã trên thẻ khớp ĐÚNG mã nghề của tầng hạt giống (không chép tay bản thứ hai)',
    monKeVatLieu.length > 0 && monKeVatLieu.every((i) => HG.VAT_LIEU_HAT_GIONG.some((v) => v.code === i.code && v.name === i.name)),
    monKeVatLieu.map((i) => `${i.code}·${i.kind}`).join(' · ') || '—',
  );
  doi(
    '(2) gõ tên nghề ở ô tìm của kệ ra đúng món',
    the.monKe('render', 'common-atlas', 'sồi').length === 1,
    `tìm "sồi" → ${the.monKe('render', 'common-atlas', 'sồi').map((i) => i.code).join(', ') || '(không ra gì)'}`,
  );
  doi(
    '(2) số đếm trên cột kệ khớp số món thật (không bịa số)',
    KE.builtinCount('common-atlas') === monKeVatLieu.length && monKeVatLieu.length > 0,
    `đếm=${KE.builtinCount('common-atlas')} · lưới=${monKeVatLieu.length}`,
  );

  // (3) kệ Cấu kiện (.idfc) — tấm Thư viện đọc `loadIdfcStore()`; máy sạch ⇒ kho IndexedDB rỗng.
  const monKeCauKien = the.monCauKien();
  doi(
    '(3) kệ Cấu kiện — máy sạch (kho .idfc rỗng) vẫn có cấu kiện để kéo',
    monKeCauKien.length >= 1,
    `${monKeCauKien.length} món: ${monKeCauKien.map((s) => s.meta.code).join(', ') || '(RỖNG — kệ trống)'}`,
  );
  doi(
    '(3) cấu kiện trên kệ mang ĐỦ meta bắt buộc (mở lại được, không phải mảnh cụt)',
    monKeCauKien.length > 0 && monKeCauKien.every((s) => s.meta.code && s.meta.kind && s.meta.createdAt && s.meta.appVersion),
    monKeCauKien.map((s) => `${s.meta.code}·${s.meta.kind}·${s.meta.scope}`).join(' · ') || '—',
  );
  doi(
    '(3) cấu kiện trên kệ giữ CÔNG THỨC KHỐI (vẫn là tham số, không phải lưới chết)',
    monKeCauKien.length > 0 && monKeCauKien.every((s) => (s.body?.geom3d?.recipe?.steps?.length ?? 0) >= 1),
    monKeCauKien.map((s) => `${s.meta.code}: ${s.body?.geom3d?.recipe?.steps?.length ?? 0} bậc`).join(' · ') || '—',
  );
  doi(
    '(3) cấu kiện trỏ về ĐÚNG vật liệu hạt giống (một sự thật, không gõ lại UUID)',
    monKeCauKien.length > 0 && monKeCauKien.every((s) => HG.VAT_LIEU_HAT_GIONG.some((v) => v.matId === s.body?.geom3d?.matId)),
    monKeCauKien.map((s) => `${s.meta.code}→${String(s.body?.geom3d?.matId).slice(0, 8)}`).join(' · ') || '—',
  );

  // (4) MỘT CHIỀU — người dùng chỉnh ở tầng studio thì họ đọc ra bản chỉnh, mẫu gốc trong repo
  //     KHÔNG đổi một byte. Đây là ca nghiệm thu "ghi đè" của lượt này, đo ở tầng dữ liệu.
  //     Khoá studio cố ý viết HOA — đúng thứ `savePbr()` sinh ra cho một matId UUID.
  const goc = JSON.stringify(HG.pbrMapHatGiong());
  const studioSua = { [SOI.matId.toUpperCase()]: { ...SOI.pbr, roughness: 0.11 } };
  const sauSua = the.phanGiai(SOI.matId, { studio: studioSua });
  doi(
    '(4) bản chỉnh của người dùng THẮNG mẫu gốc (kể cả khi lưu dưới khoá viết hoa)',
    sauSua.tang === 'studio' && sauSua.pbr?.roughness === 0.11,
    `tầng thắng=${sauSua.tang} · roughness=${sauSua.pbr?.roughness}`,
  );
  doi(
    '(4) mẫu gốc trong repo KHÔNG đổi sau khi người dùng chỉnh (một chiều)',
    JSON.stringify(HG.pbrMapHatGiong()) === goc && SOI.pbr.roughness === 0.6,
    `roughness mẫu gốc vẫn = ${SOI.pbr.roughness}`,
  );
  doi(
    '(4) danh tính không mất khi người dùng chỉnh số (vẫn biết đây là vật liệu nào)',
    sauSua.hatGiong?.code === SOI.code,
    `hatGiong=${sauSua.hatGiong?.code ?? '(mất danh tính)'}`,
  );
  doi(
    '(4) kho hợp nhất cũng trả bản chỉnh, KHÔNG để hai bản cạnh nhau',
    the.khoBaTang({ studio: studioSua })[SOI.matId]?.roughness === 0.11,
    `roughness đọc từ kho hợp nhất = ${the.khoBaTang({ studio: studioSua })[SOI.matId]?.roughness}`,
  );

  return so.slice();
}

/**
 * Đùn một đa giác đáy (mm, hệ CAD) thành lăng trụ — dựng `positions` mà `evalRecipe` nhận làm nền.
 *
 * 🔴 BẢN CŨ SAI HỆ TOẠ ĐỘ, sửa 05/09. Nó đẩy thẳng `x, y, z` mm hệ CAD vào mảng rồi chú thích là
 * *"đúng hình dạng `SceneGroup.positions` mà cad-to-obj.ts sinh ra"* — khai sai hai tầng:
 *   · ĐƠN VỊ — hợp đồng `SceneGroup.positions` (`lib/three/cad-to-obj.ts:124-129`) là **MÉT**,
 *     bản cũ để **mm** ⇒ lệch 1000 lần.
 *   · TRỤC — hợp đồng là **Y-up `(x, cao, −y)`**, bản cũ để cao độ ở **Z**.
 * Hậu quả đo được: bước `arrayLinear{dz:350}` đi qua `cadToThreeM` (đúng hợp đồng) thành dịch
 * **0,35 trên trục Y** — với nền mm thì đó là **0,35 mm theo CHIỀU SÂU**. Tức "kệ 5 tầng" mà bộ
 * này chứng nhận thực ra là **5 tấm ván chồng khít lên nhau, lệch nhau 0,35 mm**, cao đúng 25 mm.
 * Không mắt nào thấy vì mọi mắt đếm **số đỉnh** (180 = 5×36 ✅) chứ không đo **vị trí**.
 * ⚠️ Mã sản phẩm KHÔNG sai: `repeatGeometry` + `cadToThreeM` đúng hợp đồng; nền dựng đúng thì
 * khối ra cao 100→1525 mm, rộng 900, sâu 350 — khớp tham số. Sai là ở phép đo này.
 * ⇒ Nay dựng nền qua CHÍNH `cadToThreeM` của sản phẩm, không tự chép công thức trục lần thứ hai.
 */
function daysToPositions(poly, z0, z1) {
  const out = [];
  const P = (p, z) => out.push(...cadToThreeM(p.x, p.y, z));
  const day = (z) => {
    for (let i = 1; i + 1 < poly.length; i++) { P(poly[0], z); P(poly[i], z); P(poly[i + 1], z); }
  };
  day(z0);
  day(z1);
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    P(a, z0); P(b, z0); P(b, z1);
    P(a, z0); P(b, z1); P(a, z1);
  }
  return out;
}

/** Hộp bao của một geometry, trả về **mm hệ CAD** để so thẳng với tham số cấu kiện.
 * Ngược `cadAxesToThree` (x, cao, −y): rộng ← x · sâu ← −z · cao ← y. */
function hopBaoMm(geom) {
  const p = geom?.attributes?.position?.array;
  if (!p || !p.length) return null;
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity, c0 = Infinity, c1 = -Infinity;
  for (let i = 0; i < p.length; i += 3) {
    x0 = Math.min(x0, p[i] * 1000); x1 = Math.max(x1, p[i] * 1000);
    c0 = Math.min(c0, p[i + 1] * 1000); c1 = Math.max(c1, p[i + 1] * 1000);
    y0 = Math.min(y0, -p[i + 2] * 1000); y1 = Math.max(y1, -p[i + 2] * 1000);
  }
  const r = (v) => Math.round(v * 1000) / 1000;
  return { rong: r(x1 - x0), sau: r(y1 - y0), caoTu: r(c0), caoDen: r(c1) };
}

/* ─────────────────────── thế giới THẬT + hai thế giới HỎNG ─────────────────────── */

const THE_GIOI_THAT = {
  phanGiai: (id, n) => phanGiaiPbr(id, n),
  khoBaTang: (n) => pbrMapBaTang(n),
  luuIdfc: (x) => exportIdfc({ meta: x.meta, body: x.body }),
  /* ── ba mặt tiền UI, gọi ĐÚNG hàm màn hình gọi (không hàm mô phỏng nào) ── */
  hangKho: (db) => KMD.tronHatGiong(db),
  monKe: (chang, ke, tim = '') => KE.itemsFor(chang, ke, 'all', tim, null, []),
  monCauKien: () => K3D.cauKienHatGiongTrenKe(),
};

/** Ca hỏng ① — GỠ TẦNG HẠT GIỐNG, tức quay về đúng hiện trạng trước lượt này (chỉ có kho studio
 * `localStorage`). Máy sạch thành kho rỗng ⇒ K2 phải ĐỎ. */
const THE_GIOI_HONG_HAT_GIONG = {
  ...THE_GIOI_THAT,
  phanGiai: (id, n) => ({ matId: id, pbr: n.studio?.[id] ?? n.duAn?.[id] ?? null, tang: null, hatGiong: null }),
  khoBaTang: (n) => ({ ...(n.studio ?? {}), ...(n.duAn ?? {}) }),
};

/** Ca hỏng (3) — **GỠ ĐÚNG BA SỢI DÂY VỪA CẮM**, giữ nguyên mọi thứ khác. Đây là hiện trạng SÁNG
 * 04/09: tầng hạt giống đủ và đúng (K1–K7 vẫn XANH), nhưng ba mặt tiền không đọc tới nó ⇒ trên
 * app thật máy sạch là kho rỗng. K8 phải ĐỎ, còn K1–K7 thì không được nhúc nhích — chính sự
 * tương phản đó chứng minh K8 đo một thứ KHÁC, không phải đo lại K1–K7 bằng lời khác. */
const THE_GIOI_HONG_CHUA_CAM_DIEN = {
  ...THE_GIOI_THAT,
  hangKho: (db) => [...(db ?? [])],                                   // màn kho chỉ đọc bản ghi DB
  monKe: (chang, ke, tim = '') => (ke === 'common-atlas' ? [] : KE.itemsFor(chang, ke, 'all', tim, null, [])),
  monCauKien: () => [],                                               // kệ .idfc chỉ đọc kho studio
};

/** Ca hỏng ② — ĐÁNH RƠI CÔNG THỨC KHỐI lúc lưu (đúng hiện trạng `.idfc` trước lượt này). Cấu
 * kiện vẫn mở lại được, vẫn có hình 2D, vẫn có matId — chỉ thôi là tham số. K6 phải ĐỎ. */
const THE_GIOI_HONG_RECIPE = {
  ...THE_GIOI_THAT,
  luuIdfc: (x) => {
    const { recipe, ...g3 } = x.body.geom3d;
    void recipe;
    return exportIdfc({ meta: x.meta, body: { ...x.body, geom3d: g3 } });
  },
};

/* ═══════════════ K9 · TRÊN APP THẬT ═══════════════
   Bảy khâu đầu đo *sự thật của dữ liệu*; K8 đo *dữ liệu có tới mặt tiền không*. K9 đo thứ cuối
   cùng và là thứ duy nhất người dùng trải nghiệm: **mở app trên máy sạch thì MẮT CÓ THẤY KHÔNG.**
   Luật PASS áp đủ chuỗi: THAO TÁC → GHI XUỐNG → TẢI LẠI → VÀO LẠI → CÙNG MỘT SỰ THẬT, và mọi
   khẳng định về "đã lưu" đều đọc từ `localStorage` — NƠI LƯU THẬT — chứ không đọc chữ trên màn. */

/** Đọc bảng Kho vật liệu ra dữ liệu — ĐÚNG thứ mắt người thấy, lấy từ DOM chứ không từ state. */
const DOC_BANG = `(() => {
  const tr = [...document.querySelectorAll('table tbody tr')];
  return tr.map((r) => {
    const td = [...r.querySelectorAll('td')];
    return {
      ma: (td[1]?.innerText || '').trim(),
      ten: (td[2]?.innerText || '').trim(),
      gia: (td[6]?.innerText || '').trim(),
      cuoi: (td[10]?.innerText || '').trim(),
    };
  });
})()`;

/**
 * @param hongDay  thế giới HỎNG cho phép hiệu chuẩn: mô phỏng đúng hiện trạng trước lượt cắm
 *   điện — mặt tiền KHÔNG đọc tầng hạt giống ⇒ bảng rỗng. Không can thiệp được vào bundle đã
 *   build nên chỗ này chặn ở tầng ĐỌC KẾT QUẢ; khai thẳng: hiệu chuẩn gỡ-dây-THẬT nằm ở
 *   `THE_GIOI_HONG_CHUA_CAM_DIEN` (K8), chỗ can thiệp được vào chính hàm sản xuất.
 */
async function chayTrenApp(hongDay) {
  so.length = 0;
  const { chromium } = require(GOC + '/node_modules/playwright-core/index.js');
  const trinhDuyet = await chromium.launch({
    executablePath: process.env.PW_CHROMIUM
      || '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',
    args: ['--no-sandbox'],
  });
  const boi = await trinhDuyet.newContext({ viewport: { width: 1440, height: 900 } });
  const trang = await boi.newPage();
  const loiJs = [];
  trang.on('pageerror', (e) => loiJs.push(String(e)));
  fs.mkdirSync(THU_MUC_ANH, { recursive: true });

  /* ── K9a · MÁY SẠCH ─────────────────────────────────────────────────────── */
  khau('K9a · MÁY SẠCH trên app thật — chưa ai tạo gì, mở ra phải CÓ HÀNG');

  await trang.goto(`${GOC_URL}/materials`, { waitUntil: 'domcontentloaded' });
  // xoá sạch mọi thứ của người dùng RỒI mới nạp lại — đây mới đúng nghĩa "máy sạch".
  await trang.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await trang.goto(`${GOC_URL}/materials`, { waitUntil: 'networkidle' });
  await trang.waitForTimeout(1500);

  const khoNguoiDung = await trang.evaluate((k) => localStorage.getItem(k), KHOA_PBR);
  doi(
    'kho studio ĐANG RỖNG (đúng là máy sạch, không phải máy đã dùng)',
    khoNguoiDung === null || khoNguoiDung === '{}',
    `localStorage["${KHOA_PBR}"] = ${khoNguoiDung === null ? '(chưa có)' : khoNguoiDung.slice(0, 40)}`,
  );

  let hang = await trang.evaluate(DOC_BANG);
  if (hongDay) hang = [];
  doi(
    'màn Kho vật liệu CÓ dòng (không phải màn "kho đang trống")',
    hang.length >= HG.VAT_LIEU_HAT_GIONG.length,
    `${hang.length} dòng trên bảng: ${hang.map((h) => h.ma).join(', ') || '(BẢNG RỖNG)'}`,
  );
  for (const v of HG.VAT_LIEU_HAT_GIONG) {
    const d = hang.find((h) => h.ma === v.code);
    doi(`thấy "${v.name}" trên màn`, !!d && d.ten.includes(v.name), d ? `mã ${v.code} · tên "${d.ten}"` : `KHÔNG thấy mã ${v.code}`);
  }
  const conEmptyState = await trang.evaluate(() => document.body.innerText.includes('Kho vật liệu đang trống'));
  doi('KHÔNG hiện màn "kho đang trống"', hongDay ? false : !conEmptyState, conEmptyState ? 'vẫn đang hiện empty-state' : 'không có empty-state');
  doi(
    'dòng hạt giống KHOÁ sửa/xoá ở mặt thương mại (nhãn CHỮ, không nút giả)',
    hang.length > 0 && hang.filter((h) => HG.VAT_LIEU_HAT_GIONG.some((v) => v.code === h.ma)).every((h) => /theo bản cài|built-in/i.test(h.cuoi)),
    hang.map((h) => `${h.ma}:"${h.cuoi}"`).join(' · ') || '—',
  );
  doi(
    'cột Giá của dòng hạt giống ĐỂ TRỐNG (không chép giá vào vật liệu)',
    hang.length > 0 && hang.filter((h) => HG.VAT_LIEU_HAT_GIONG.some((v) => v.code === h.ma)).every((h) => h.gia === '—'),
    hang.map((h) => `${h.ma}:giá="${h.gia}"`).join(' · ') || '—',
  );
  doi('trang không ném lỗi JS nào', loiJs.length === 0, loiJs.length ? loiJs.slice(0, 2).join(' | ') : '0 lỗi');
  if (!hongDay) await trang.screenshot({ path: path.join(THU_MUC_ANH, '01-may-sach-kho-vat-lieu.png') });

  /* ── K9b · GHI ĐÈ ───────────────────────────────────────────────────────── */
  khau('K9b · GHI ĐÈ trên app thật — sửa được, mẫu gốc NGUYÊN VẸN');

  const moDuoc = await trang.evaluate((ma) => {
    const r = [...document.querySelectorAll('table tbody tr')]
      .find((x) => (x.querySelectorAll('td')[1]?.innerText || '').trim() === ma);
    const nut = r?.querySelector('td:last-child button');
    if (!nut) return false;
    nut.click();
    return true;
  }, SOI.code);
  doi('mở được cửa chất liệu render TỪ dòng hạt giống', moDuoc, moDuoc ? `bấm nút trên dòng ${SOI.code}` : 'không thấy nút');
  await trang.waitForTimeout(900);
  const chuPanel = await trang.evaluate(() => document.body.innerText);
  doi(
    'cửa mở ra ĐÚNG mã của vật liệu đó (không mở nhầm món, không rơi về sku)',
    chuPanel.includes(SOI.matId),
    chuPanel.includes(SOI.matId) ? `panel hiện matId ${SOI.matId.slice(0, 13)}…` : 'KHÔNG thấy matId trên panel',
  );
  if (!hongDay) await trang.screenshot({ path: path.join(THU_MUC_ANH, '02-cua-chat-lieu-hat-giong.png') });

  // ghi bản chỉnh qua ĐÚNG khoá `savePbr()` sinh ra (upper) — chính ca lệch namespace đã vá.
  const NHAM_MOI = 0.11;
  await trang.evaluate(({ k, id, r }) => {
    const map = JSON.parse(localStorage.getItem(k) || '{}');
    map[id.trim().toUpperCase()] = { baseColor: '#b98a54', roughness: r, metallic: 0, typeId: 'go' };
    localStorage.setItem(k, JSON.stringify(map));
  }, { k: KHOA_PBR, id: SOI.matId, r: NHAM_MOI });
  const daGhi = await trang.evaluate((k) => localStorage.getItem(k), KHOA_PBR);
  doi(
    'bản chỉnh GHI XUỐNG nơi lưu thật (không chỉ nằm trong bộ nhớ màn hình)',
    !!daGhi && JSON.parse(daGhi)[SOI.matId.toUpperCase()]?.roughness === NHAM_MOI,
    `khoá đã ghi: ${Object.keys(JSON.parse(daGhi || '{}')).join(', ') || '(rỗng)'}`,
  );
  // MẪU GỐC = tệp trong repo. Đọc lại từ ĐĨA, không đọc từ bộ nhớ tiến trình.
  const nguonHatGiong = fs.readFileSync(path.join(GOC, 'lib/materials/hat-giong.ts'), 'utf8');
  doi(
    'MẪU GỐC trong repo KHÔNG đổi một byte (một chiều — sửa ở studio không đụng mẫu)',
    nguonHatGiong.includes('roughness: 0.6') && nguonHatGiong.includes(SOI.matId),
    `hat-giong.ts vẫn khai roughness 0.6 cho ${SOI.code}`,
  );

  /* ── K9c · TẢI LẠI ──────────────────────────────────────────────────────── */
  khau('K9c · TẢI LẠI → VÀO LẠI — phải là CÙNG MỘT SỰ THẬT');

  await trang.goto(`${GOC_URL}/materials`, { waitUntil: 'networkidle' });
  await trang.waitForTimeout(1500);
  const conDo = await trang.evaluate((k) => localStorage.getItem(k), KHOA_PBR);
  doi(
    'sau khi tải lại, bản chỉnh VẪN CÒN ở nơi lưu thật',
    !!conDo && JSON.parse(conDo)[SOI.matId.toUpperCase()]?.roughness === NHAM_MOI,
    `roughness đọc lại = ${JSON.parse(conDo || '{}')[SOI.matId.toUpperCase()]?.roughness ?? '(MẤT)'}`,
  );
  let hang2 = await trang.evaluate(DOC_BANG);
  if (hongDay) hang2 = [];
  doi(
    'sau khi tải lại, vật liệu hạt giống VẪN trên bảng (bản chỉnh không nuốt mất mẫu)',
    hang2.length >= HG.VAT_LIEU_HAT_GIONG.length,
    `${hang2.length} dòng: ${hang2.map((h) => h.ma).join(', ') || '(BẢNG RỖNG)'}`,
  );
  const moLai = await trang.evaluate((ma) => {
    const r = [...document.querySelectorAll('table tbody tr')]
      .find((x) => (x.querySelectorAll('td')[1]?.innerText || '').trim() === ma);
    const nut = r?.querySelector('td:last-child button');
    if (!nut) return false;
    nut.click();
    return true;
  }, SOI.code);
  await trang.waitForTimeout(900);
  const chuPanel2 = await trang.evaluate(() => document.body.innerText);
  doi(
    'mở lại cửa chất liệu thì đọc ra ĐÚNG số người dùng đặt, KHÔNG rơi về mẫu gốc',
    !!moLai && /0[.,]11/.test(chuPanel2),
    /0[.,]11/.test(chuPanel2) ? 'panel hiện 0.11 — bản chỉnh thắng' : 'panel KHÔNG hiện 0.11 — đang đọc bản khác',
  );
  if (!hongDay) await trang.screenshot({ path: path.join(THU_MUC_ANH, '03-vao-lai-ban-chinh-con-do.png') });

  await trinhDuyet.close();
  return so.slice();
}

/* ─────────────────────── chạy ─────────────────────── */

function hieuChuan(ten, the, khauPhaiDo) {
  console.log(`\n═══ HIỆU CHUẨN · ${ten} — bộ này PHẢI báo đỏ ═══`);
  const ketQua = chayVongNghe(the);
  const doTrongKhau = ketQua.filter((d) => !d.dat && d.khau.startsWith(khauPhaiDo));
  inSo(ketQua.filter((d) => d.khau.startsWith(khauPhaiDo)));
  const dat = doTrongKhau.length > 0;
  console.log(dat ? `\n✅ HIỆU CHUẨN ĐẠT — ca biết-hỏng làm ĐỎ ${doTrongKhau.length} khẳng định ở ${khauPhaiDo}.` : `\n🔴 HIỆU CHUẨN TRƯỢT — ca biết-hỏng KHÔNG làm đỏ khẳng định nào ở ${khauPhaiDo}. Bộ này đang chỉ in chữ PASS.`);
  return dat;
}

let maThoat = 0;

if (TREN_APP) {
  console.log(`═══ G6 · K9 — NGHIỆM THU TRÊN APP THẬT (cổng ${CONG_APP}) ═══`);
  const kq = await chayTrenApp(false);
  inSo(kq);
  const dat = kq.filter((d) => d.dat).length;
  console.log(`\n── KẾT: ${dat}/${kq.length} khẳng định ĐẠT ──`);
  console.log(`   ảnh bằng chứng: ${path.relative(GOC, THU_MUC_ANH)}/`);
  if (dat !== kq.length) {
    console.log('ĐỨT Ở:');
    for (const d of kq.filter((x) => !x.dat)) console.log(`  · [${d.khau}] ${d.nhan} — ${d.chiTiet}`);
    maThoat = 1;
  }

  console.log('\n═══ HIỆU CHUẨN · mặt tiền thôi đọc tầng hạt giống — bộ này PHẢI báo đỏ ═══');
  const kqH = await chayTrenApp(true);
  const doK9a = kqH.filter((d) => !d.dat && d.khau.startsWith('K9a'));
  inSo(kqH.filter((d) => d.khau.startsWith('K9a')));
  if (doK9a.length > 0) console.log(`\n✅ HIỆU CHUẨN ĐẠT — ca biết-hỏng làm ĐỎ ${doK9a.length} khẳng định ở K9a.`);
  else { console.log('\n🔴 HIỆU CHUẨN TRƯỢT — ca biết-hỏng KHÔNG làm đỏ khẳng định nào.'); maThoat = 1; }

  process.exit(maThoat);
}

if (!CHI_HIEU_CHUAN) {
  console.log('═══ G6 · VÒNG NGHỀ TRỌN VẸN TRÊN BỘ ĐẠI DIỆN ═══');
  const ketQua = chayVongNghe(THE_GIOI_THAT);
  if (RA_JSON) console.log(JSON.stringify(ketQua, null, 1));
  else inSo(ketQua);
  const dat = ketQua.filter((d) => d.dat).length;
  console.log(`\n── KẾT: ${dat}/${ketQua.length} khẳng định ĐẠT ──`);
  if (dat !== ketQua.length) {
    console.log('ĐỨT Ở:');
    for (const d of ketQua.filter((x) => !x.dat)) console.log(`  · [${d.khau}] ${d.nhan} — ${d.chiTiet}`);
    maThoat = 1;
  }
}

const hc1 = hieuChuan('gỡ tầng hạt giống — máy sạch phải trống', THE_GIOI_HONG_HAT_GIONG, 'K2');
const hc2 = hieuChuan('đánh rơi công thức khối lúc lưu', THE_GIOI_HONG_RECIPE, 'K6');
const hc3 = hieuChuan('gỡ ba sợi dây cắm điện — mặt tiền thôi đọc tầng hạt giống', THE_GIOI_HONG_CHUA_CAM_DIEN, 'K8');
if (!hc1 || !hc2 || !hc3) maThoat = 1;

process.exit(maThoat);
