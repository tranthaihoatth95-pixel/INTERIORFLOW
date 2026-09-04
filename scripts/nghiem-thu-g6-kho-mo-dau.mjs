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
 * CÁCH DÙNG
 *   node scripts/nghiem-thu-g6-kho-mo-dau.mjs                # chạy trọn vòng
 *   node scripts/nghiem-thu-g6-kho-mo-dau.mjs --hieu-chuan   # chỉ chạy phép hiệu chuẩn
 *   node scripts/nghiem-thu-g6-kho-mo-dau.mjs --json         # in JSON (cho máy đọc)
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
const { exportIdfc, importIdfc, lastImportIdfcError } = require(GOC + '/lib/cad/idfc.ts');
const { exportIdf, importIdf } = require(GOC + '/lib/cad/idf.ts');
const { resolveLibraryItem, idfcGeom2dOf } = require(GOC + '/lib/cad/library-item-resolve.ts');
const { clusterPrimsToEntities } = require(GOC + '/lib/cad/block-library.ts');
const { evalRecipe } = require(GOC + '/lib/three/build-recipe.ts');
const { replaceMaterialReferences } = require(GOC + '/lib/materials/impact.ts');

/* ─────────────────────── tham số + sổ ghi ─────────────────────── */

const CO = (t) => process.argv.includes(`--${t}`);
const CHI_HIEU_CHUAN = CO('hieu-chuan');
const RA_JSON = CO('json');

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
  doi('cấu kiện mang mã vật liệu, không phải khối vô danh', cauKien.body.geom3d.matId === SOI.matId, `matId=${cauKien.body.geom3d.matId}`);

  /* ── K4 · BIẾN ĐỔI ──────────────────────────────────────────────────────── */
  khau('K4 · BIẾN ĐỔI — sửa bằng THAM SỐ, không sửa bằng tay trên lưới');

  const t7 = { ...t, soTang: 7 };
  const ket7 = evalRecipe(nenKhoi, K3D.congThucKe(t7).steps);
  doi('đổi 5 tầng → 7 tầng là đổi MỘT SỐ, hình học dựng lại', soDinh(ket7.geometry) / dinhGoc === 7 / t.soTang, `${dinhGoc} đỉnh (5 tầng) → ${soDinh(ket7.geometry)} đỉnh (7 tầng)`);

  const tatBacLap = cauKien.body.geom3d.recipe.steps.map((s) => (s.id === 'ke-lap-tang' ? { ...s, enabled: false } : s));
  const ketTat = evalRecipe(nenKhoi, tatBacLap);
  doi('tắt bậc lặp ⇒ còn đúng MỘT tấm ván', soDinh(ketTat.geometry) === dinhGoc / t.soTang, `${soDinh(ketTat.geometry)} đỉnh · một tấm = ${dinhGoc / t.soTang}`);
  const bacLap = tatBacLap.find((s) => s.id === 'ke-lap-tang');
  doi('tắt bậc KHÔNG xoá tham số của bậc đó (không phá huỷ)', bacLap.op.n === t.soTang && bacLap.op.dz === t.buocTangMm, `n=${bacLap.op.n} dz=${bacLap.op.dz}mm vẫn còn nguyên`);
  const ketBatLai = evalRecipe(nenKhoi, tatBacLap.map((s) => ({ ...s, enabled: true })));
  doi('bật lại ra ĐÚNG hình cũ (lùi được)', soDinh(ketBatLai.geometry) === dinhGoc, `${soDinh(ketBatLai.geometry)} vs ${dinhGoc} đỉnh`);

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
    doi(
      '① .idfc — dựng lại TỪ TỆP ra ĐÚNG khối cũ',
      !!dungLai && soDinh(dungLai.geometry) === dinhGoc,
      dungLai ? `${soDinh(dungLai.geometry)} vs ${dinhGoc} đỉnh` : 'không dựng lại được',
    );
    // Và vẫn còn SỬA ĐƯỢC BẰNG THAM SỐ sau khi mở lại — đây là cả lý do không tải model ngoài.
    const bacSauMo = rcMoLai?.steps.find((s) => s.id === 'ke-lap-tang');
    const sua = bacSauMo ? evalRecipe(nenKhoi, rcMoLai.steps.map((s) => (s.id === 'ke-lap-tang' ? { ...s, op: { ...s.op, n: 7 } } : s))) : null;
    doi(
      '① .idfc — sau mở lại vẫn SỬA ĐƯỢC BẰNG THAM SỐ',
      !!sua && soDinh(sua.geometry) === (dinhGoc / t.soTang) * 7,
      sua ? `đổi n=5→7 sau khi mở lại: ${soDinh(sua.geometry)} đỉnh` : 'không sửa được — hết là tham số',
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
      cumMoLai.length === cum.length && cumMoLai.every((e) => e.srcBlock === cauKien.meta.code),
      `${cumMoLai.length}/${cum.length} entity của cụm · srcBlock=${cumMoLai[0]?.srcBlock ?? '(mất)'}`,
    );
    doi('② .idf — QUYẾT ĐỊNH đổi vật liệu của người còn hiệu lực', docMoLai.entities.find((e) => e.id === 'e-san')?.specId === 'ps-van-oc-cho', `specId mặt sàn sau mở lại = ${docMoLai.entities.find((e) => e.id === 'e-san')?.specId}`);
  }

  // ③ IndexedDB — vòng JSON mà sheets-persist áp trước khi ghi
  const quaIdb = JSON.parse(JSON.stringify({ v: 1, activeId: 's1', sheets: [{ id: 's1', name: 'Mặt bằng', doc: doiVL.doc }], ts: 1 }));
  doi('③ IndexedDB — Doc qua vòng JSON không rơi trường nào', JSON.stringify(quaIdb.sheets[0].doc) === JSON.stringify(doiVL.doc), `${JSON.stringify(quaIdb.sheets[0].doc).length} byte`);

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

  return so.slice();
}

/** Đùn một đa giác đáy thành lăng trụ — dựng `positions` mà `evalRecipe` nhận làm nền, đúng hình
 * dạng `SceneGroup.positions` (mảng phẳng x,y,z theo tam giác) mà `cad-to-obj.ts` sinh ra. */
function daysToPositions(poly, z0, z1) {
  const out = [];
  const day = (z) => {
    for (let i = 1; i + 1 < poly.length; i++) {
      out.push(poly[0].x, poly[0].y, z, poly[i].x, poly[i].y, z, poly[i + 1].x, poly[i + 1].y, z);
    }
  };
  day(z0);
  day(z1);
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    out.push(a.x, a.y, z0, b.x, b.y, z0, b.x, b.y, z1);
    out.push(a.x, a.y, z0, b.x, b.y, z1, a.x, a.y, z1);
  }
  return out;
}

/* ─────────────────────── thế giới THẬT + hai thế giới HỎNG ─────────────────────── */

const THE_GIOI_THAT = {
  phanGiai: (id, n) => phanGiaiPbr(id, n),
  khoBaTang: (n) => pbrMapBaTang(n),
  luuIdfc: (x) => exportIdfc({ meta: x.meta, body: x.body }),
};

/** Ca hỏng ① — GỠ TẦNG HẠT GIỐNG, tức quay về đúng hiện trạng trước lượt này (chỉ có kho studio
 * `localStorage`). Máy sạch thành kho rỗng ⇒ K2 phải ĐỎ. */
const THE_GIOI_HONG_HAT_GIONG = {
  ...THE_GIOI_THAT,
  phanGiai: (id, n) => ({ matId: id, pbr: n.studio?.[id] ?? n.duAn?.[id] ?? null, tang: null, hatGiong: null }),
  khoBaTang: (n) => ({ ...(n.studio ?? {}), ...(n.duAn ?? {}) }),
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
if (!hc1 || !hc2) maThoat = 1;

process.exit(maThoat);
