/**
 * scripts/proof/idfc-roundtrip.mjs — CHỨNG MINH TRÊN RUNTIME cho vòng đời tệp `.idfc`:
 *   IMPORT → APPLY(2D) → EXPORT → REOPEN, cộng migration v1→v2→v3.
 *
 * Không phải test thuần đặt cạnh mã: script này BUNDLE mã sản xuất thật (`lib/cad/idfc.ts`,
 * `lib/cad/library-item-resolve.ts`, `lib/cad/block-library.ts`, `lib/idfc-seed/index.ts`) bằng
 * esbuild rồi `require()` — nạp đúng module thật, dữ liệu thật (73 món kho mầm), không giả lập
 * mắt xích nào.
 *
 * ⚠️ CỔNG HARNESS (F-15) ở CA 0: bundle rỗng vẫn `require()` thành công và vẫn in "nạp được".
 * Nên cổng đòi ba thứ cùng lúc: hằng số THẬT (`IDFC_VERSION === 3`), hàm THẬT (`importIdfc`),
 * và một seed THẬT đi trọn export→import. Cổng đỏ ⇒ `process.exit(1)` NGAY, cấm in ĐẠT cho ca sau.
 *
 * ⚠️ File bundle PHẢI nằm TRONG repo (`node_modules/.if-proof-*`): Node giải node_modules theo
 * đường của FILE, đặt ở /tmp là MODULE_NOT_FOUND.
 *
 * Chạy:  node scripts/proof/idfc-roundtrip.mjs
 */

import { execFileSync } from 'child_process';
import { mkdtempSync, rmSync, writeFileSync, readFileSync } from 'fs';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const ROOT = process.cwd();
const tmp = mkdtempSync(path.join(ROOT, 'node_modules', '.if-proof-'));

/* ═══════════════ sổ kết quả ═══════════════ */

const ket = [];
/** Ghi một mục ĐẠT/KHÔNG. `ghiChu` in kèm để đọc được vì sao. */
function ca(ten, mong, got, ghiChu) {
  const dat = JSON.stringify(mong) === JSON.stringify(got);
  ket.push({ ten, trangThai: dat ? 'ĐẠT' : 'ĐỎ' });
  console.log(`  ${dat ? 'ok   ' : 'ĐỎ   '} ${ten}\n         mong ${JSON.stringify(mong)} · nhận ${JSON.stringify(got)}${ghiChu ? `\n         ${ghiChu}` : ''}`);
  return dat;
}
/** Ca dựng không được — KHÔNG im lặng bỏ qua, KHÔNG tính ĐẠT. */
function chuaDanhGia(ten, lyDo) {
  ket.push({ ten, trangThai: 'NOT ASSESSED' });
  console.log(`  NOT ASSESSED  ${ten}\n         LÝ DO: ${lyDo}`);
}
/** Ghi nhận hiện trạng — không phải phán ĐẠT/ĐỎ (vd: tính năng chưa tồn tại). */
function ghiNhan(ten, nhan, chiTiet) {
  ket.push({ ten, trangThai: nhan });
  console.log(`  ĐO    ${ten} → ${nhan}\n         ${chiTiet}`);
}
function muc(s) { console.log(`\n${s}`); }

/* ═══════════════ tiện ═══════════════ */

function deepEqual(a, b) {
  if (a === b) return true;
  if (typeof a !== typeof b || a === null || b === null) return false;
  if (typeof a !== 'object') return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const ka = Object.keys(a).filter((k) => a[k] !== undefined);
  const kb = Object.keys(b).filter((k) => b[k] !== undefined);
  if (ka.length !== kb.length) return false;
  return ka.every((k) => deepEqual(a[k], b[k]));
}
/** Khoá có ở `truoc` mà MẤT ở `sau` (giá trị undefined tính là mất). */
function khoaMat(truoc, sau) {
  return Object.keys(truoc || {}).filter((k) => truoc[k] !== undefined && (sau === null || sau === undefined || sau[k] === undefined));
}
const clone = (v) => JSON.parse(JSON.stringify(v));

/* ═══════════════ nạp mã sản xuất ═══════════════ */

let M = null;
let loiNap = null;
try {
  const entry = path.join(tmp, 'entry.ts');
  writeFileSync(entry, [
    `export * from '${path.join(ROOT, 'lib/cad/idfc').replace(/\\/g, '/')}';`,
    `export { idfcGeom2dOf, resolveLibraryItem, DROPPABLE_ITEM_KINDS } from '${path.join(ROOT, 'lib/cad/library-item-resolve').replace(/\\/g, '/')}';`,
    `export { clusterPrimsToEntities } from '${path.join(ROOT, 'lib/cad/block-library').replace(/\\/g, '/')}';`,
    `export { SEED_IDFC_ITEMS } from '${path.join(ROOT, 'lib/idfc-seed/index').replace(/\\/g, '/')}';`,
  ].join('\n'));
  const out = path.join(tmp, 'idfc.cjs');
  execFileSync('npx', [
    'esbuild', entry, '--bundle', '--format=cjs', '--platform=node',
    '--external:@prisma/client', '--external:next', `--outfile=${out}`,
  ], { stdio: 'pipe' });
  M = require(out);
} catch (e) {
  loiNap = (e && (e.stderr ? String(e.stderr) : e.message)) || String(e);
}

console.log('# .idfc · CHỨNG MINH VÒNG ĐỜI TRÊN RUNTIME (mã sản xuất thật)');

/* ═══════════════ CA 0 · CỔNG HARNESS ═══════════════ */

muc('CA 0 · CỔNG HARNESS — bộ máy có thật sự nạp mã thật không');

if (!M) {
  console.log(`  ĐỎ    bundle KHÔNG nạp được\n         ${String(loiNap).slice(0, 800)}`);
  console.error('\n⛔ HARNESS ĐỎ — không báo ĐẠT cho ca nào phía sau.');
  rmSync(tmp, { recursive: true, force: true });
  process.exit(1);
}

const SEED = M.SEED_IDFC_ITEMS || [];
let seedThat = null;
let congOk = false;
try {
  seedThat = SEED.find((s) => s.body && s.body.type === 'component' && s.body.geom2d && s.body.geom2d.prims.length > 0) || null;
  const thu = seedThat ? M.importIdfc(M.exportIdfc({ meta: seedThat.meta, body: seedThat.body, commerce: seedThat.commerce })) : null;
  congOk =
    M.IDFC_VERSION === 3 &&
    typeof M.importIdfc === 'function' &&
    typeof M.exportIdfc === 'function' &&
    typeof M.migrateIdfc === 'function' &&
    typeof M.lastImportIdfcError === 'function' &&
    typeof M.BODY_TYPE_OF_KIND === 'object' &&
    SEED.length > 0 &&
    !!thu && thu.meta.code === seedThat.meta.code;
} catch (e) {
  console.log(`  (ngoại lệ khi mở cổng: ${e && e.message})`);
}
ca(
  `CA 0 · HARNESS: IDFC_VERSION=3 · 5 hàm thật · ${SEED.length} seed thật parse được`,
  true, congOk,
  `IDFC_VERSION=${JSON.stringify(M.IDFC_VERSION)} · importIdfc=${typeof M.importIdfc} · seed=${SEED.length} món · seed mẫu=${seedThat ? seedThat.meta.code : 'KHÔNG CÓ'}`,
);
if (!congOk) {
  console.error('\n⛔ HARNESS ĐỎ — không báo ĐẠT cho ca nào phía sau.');
  rmSync(tmp, { recursive: true, force: true });
  process.exit(1);
}

/* Mẫu dùng chung cho các ca dựng file tay. */
const metaMau = (over = {}) => ({
  id: 'proof-1', name: 'Mẫu chứng minh', nameEn: 'Proof sample', code: 'PROOF-001',
  kind: 'furniture', scope: 'chung', tags: ['proof'], room: 'Phòng khách', author: 'proof',
  createdAt: '2026-01-01T00:00:00.000Z', modifiedAt: '2026-01-01T00:00:00.000Z',
  appVersion: 'interiorflow-1.0.0', ...over,
});
const geom2dMau = () => ({
  group: 'Phòng khách', w: 1000, h: 500,
  prims: [
    { k: 'line', a: { x: -500, y: -250 }, b: { x: 500, y: -250 } },
    { k: 'circle', c: { x: 0, y: 0 }, r: 120 },
  ],
  anchors: [], variants: [], clearance: [],
});

/* ═══════════════ CA 1 · ROUND-TRIP ═══════════════ */

muc('CA 1 · ROUND-TRIP — món thật kho mầm: EXPORT → REOPEN, không mất trường');

{
  const seedVL = SEED.find((s) => s.body && s.body.type === 'material') || null;
  const mauList = [['component', seedThat], ['material', seedVL]];
  for (const [nhan, s] of mauList) {
    if (!s) { chuaDanhGia(`CA 1.${nhan} · round-trip`, `kho mầm không có món ruột "${nhan}"`); continue; }
    const goc = clone(s);
    const json = M.exportIdfc({ meta: goc.meta, body: goc.body, commerce: goc.commerce });
    const lai = M.importIdfc(json);
    if (!lai) { ca(`CA 1.${nhan} · ${goc.meta.code} mở lại được`, true, false, `lý do: ${M.lastImportIdfcError()}`); continue; }

    // `modifiedAt` do exportIdfc đóng dấu lại (đúng thiết kế) ⇒ loại khỏi so sánh, nhưng KHÔNG
    // loại khỏi phép "khoá nào mất" — trường vẫn phải tồn tại.
    const mGoc = { ...goc.meta }; const mLai = { ...lai.meta };
    delete mGoc.modifiedAt; delete mLai.modifiedAt;
    const mat = khoaMat(goc.meta, lai.meta);
    ca(`CA 1.${nhan} · ${goc.meta.code} — meta y nguyên (trừ modifiedAt)`, true, deepEqual(mGoc, mLai),
      `khoá meta MẤT sau vòng: ${mat.length ? mat.join(', ') : '(không)'}`);
    ca(`CA 1.${nhan} · ${goc.meta.code} — body SÂU y nguyên`, true, deepEqual(goc.body, lai.body),
      `prims gốc ${JSON.stringify(goc.body.type === 'component' ? goc.body.geom2d.prims.length : (goc.body.symbol2d ? goc.body.symbol2d.prims.length : 0))}`);
    ca(`CA 1.${nhan} · ${goc.meta.code} — commerce y nguyên`, true, deepEqual(goc.commerce, lai.commerce));
  }

  // Vòng thứ HAI (import → export → import) phải bất động — nếu lệch là mỗi lần lưu lại mất thêm.
  const j1 = M.exportIdfc({ meta: seedThat.meta, body: seedThat.body, commerce: seedThat.commerce });
  const p1 = M.importIdfc(j1);
  const p2 = M.importIdfc(M.exportIdfc({ meta: p1.meta, body: p1.body, commerce: p1.commerce }));
  const a = clone(p1); const b = clone(p2);
  delete a.meta.modifiedAt; delete b.meta.modifiedAt;
  ca('CA 1.bất-động · vòng thứ hai không mất thêm gì', true, deepEqual(a, b));
}

/* ═══════════════ CA 2 · MIGRATION v1/v2 → v3 ═══════════════ */

muc('CA 2 · MIGRATION — file v1 và v2 phải lên được v3 (KS4: geom2d vật liệu giữ ở symbol2d)');

{
  // v1: geom2d BẮT BUỘC ở GỐC file; loại khai trong commerce.kind.
  const g1 = geom2dMau();
  const v1VatLieu = {
    idfcVersion: 1,
    meta: { name: 'Gỗ sồi v1', code: 'V1-MAT-001', createdAt: '2025-01-01T00:00:00.000Z', modifiedAt: '2025-01-01T00:00:00.000Z', appVersion: 'old' },
    geom2d: clone(g1),
    geom3d: { pbr: { baseColor: '#c8a97e', roughness: 0.6 }, heightMm: 18 },
    commerce: { kind: 'material', brand: 'ProofCo', priceVnd: 123000 },
  };
  const r1 = M.importIdfc(JSON.stringify(v1VatLieu));
  ca('CA 2.1 · v1 (material) mở được', true, !!r1, r1 ? '' : `lý do: ${M.lastImportIdfcError()}`);
  if (r1) {
    ca('CA 2.1 · v1 material → meta.kind = "material"', 'material', r1.meta.kind);
    ca('CA 2.1 · v1 material → ruột "material"', 'material', r1.body.type);
    ca('CA 2.1 · KS4 — geom2d v1 GIỮ NGUYÊN ở body.symbol2d', true, deepEqual(g1, r1.body.symbol2d),
      `symbol2d prims = ${r1.body.symbol2d ? r1.body.symbol2d.prims.length : 'KHÔNG CÓ'} (gốc ${g1.prims.length})`);
    ca('CA 2.1 · pbr v1 lên làm ruột chính', true, deepEqual(v1VatLieu.geom3d.pbr, r1.body.pbr));
    ca('CA 2.1 · commerce.kind đã lên meta, không giữ hai bản', undefined, r1.commerce ? r1.commerce.kind : undefined);
    ca('CA 2.1 · commerce còn lại y nguyên', true, r1.commerce && r1.commerce.brand === 'ProofCo' && r1.commerce.priceVnd === 123000);
  }

  // v1 kind 'lighting' — chốt 11.4 gộp vào 'fixture'.
  const v1Den = {
    idfcVersion: 1,
    meta: { name: 'Đèn v1', code: 'V1-LIGHT-001', createdAt: '2025-01-01T00:00:00.000Z', modifiedAt: '2025-01-01T00:00:00.000Z', appVersion: 'old' },
    geom2d: clone(g1),
    commerce: { kind: 'lighting' },
  };
  const rDen = M.importIdfc(JSON.stringify(v1Den));
  ca('CA 2.2 · v1 kind "lighting" → gộp vào "fixture"', 'fixture', rDen ? rDen.meta.kind : `null (${M.lastImportIdfcError()})`);
  ca('CA 2.2 · v1 cấu kiện → ruột component, geom2d di nguyên', true, !!rDen && rDen.body.type === 'component' && deepEqual(g1, rDen.body.geom2d));

  // v2 → v3 (thuần bump).
  const v2 = { idfcVersion: 2, meta: metaMau({ code: 'V2-COMP-001' }), body: { type: 'component', geom2d: clone(g1) } };
  const r2 = M.importIdfc(JSON.stringify(v2));
  ca('CA 2.3 · v2 mở được, geom2d nguyên vẹn', true, !!r2 && deepEqual(g1, r2.body.geom2d), r2 ? '' : `lý do: ${M.lastImportIdfcError()}`);

  // migrateIdfc trực tiếp — đường v1 xuyên 2 bậc.
  const m13 = M.migrateIdfc(clone(v1VatLieu), 1, 3);
  ca('CA 2.4 · migrateIdfc(v1 → 3) ra idfcVersion 3', 3, m13 ? m13.idfcVersion : null);
  const m23 = M.migrateIdfc(clone(v2), 2, 3);
  ca('CA 2.4 · migrateIdfc(v2 → 3) ra idfcVersion 3', 3, m23 ? m23.idfcVersion : null);
  ca('CA 2.4 · migrateIdfc lùi bậc (3 → 1) bị từ chối', null, M.migrateIdfc(clone(v2), 3, 1));
}

/* ═══════════════ CA 3 · TỪ CHỐI CÓ LÝ DO ═══════════════ */

muc('CA 3 · TỪ CHỐI CÓ LÝ DO — file tương lai · chuỗi rác · lastImportIdfcError() nói được lý do');

{
  const tuongLai = { idfcVersion: 99, meta: metaMau(), body: { type: 'component', geom2d: geom2dMau() } };
  const rTL = M.importIdfc(JSON.stringify(tuongLai));
  const lyDoTL = M.lastImportIdfcError();
  ca('CA 3.1 · idfcVersion 99 bị từ chối', null, rTL);
  ca('CA 3.1 · từ chối KÈM CÂU CHỮ nói đúng nguyên nhân (bản mới hơn)', true,
    typeof lyDoTL === 'string' && /mới hơn/i.test(lyDoTL), `câu: ${JSON.stringify(lyDoTL)}`);

  const rRac = M.importIdfc('{ đây không phải JSON ~~~');
  const lyDoRac = M.lastImportIdfcError();
  ca('CA 3.2 · chuỗi rác bị từ chối', null, rRac);
  ca('CA 3.2 · chuỗi rác CÓ lý do đọc được', true, typeof lyDoRac === 'string' && lyDoRac.length > 0,
    `câu: ${JSON.stringify(lyDoRac)} — null nghĩa là UI không có gì để nói với người dùng`);

  const rThieuTen = M.importIdfc(JSON.stringify({ idfcVersion: 3, meta: { code: 'X' }, body: { type: 'component', geom2d: geom2dMau() } }));
  ca('CA 3.3 · thiếu tên/mã bị từ chối kèm lý do', true,
    rThieuTen === null && /tên|mã/i.test(String(M.lastImportIdfcError())), `câu: ${JSON.stringify(M.lastImportIdfcError())}`);

  const rLoaiLa = M.importIdfc(JSON.stringify({ idfcVersion: 3, meta: metaMau({ kind: 'khong-co-loai-nay' }), body: { type: 'component', geom2d: geom2dMau() } }));
  ca('CA 3.4 · kind lạ bị từ chối kèm lý do', true,
    rLoaiLa === null && /loại không hợp lệ/i.test(String(M.lastImportIdfcError())), `câu: ${JSON.stringify(M.lastImportIdfcError())}`);
}

/* ═══════════════ CA 4 · KIND ↔ BODY ═══════════════ */

muc('CA 4 · KIND ↔ BODY — khai kind một đằng, ruột một nẻo phải bị chặn (BODY_TYPE_OF_KIND)');

{
  const ruotMau = {
    component: { type: 'component', geom2d: geom2dMau() },
    material: { type: 'material', pbr: { baseColor: '#fff' } },
    page: { type: 'page', slide: {} },
    video: { type: 'video', shots: [] },
    doc: { type: 'doc', template: {} },
    asset: { type: 'asset', imageUrl: '/x.png' },
    brandkit: { type: 'brandkit', colors: ['#000'] },
    preset: { type: 'preset', params: {} },
  };
  const kinds = Object.keys(M.BODY_TYPE_OF_KIND);
  let hopLe = 0, chanDung = 0;
  const lot = [];
  for (const k of kinds) {
    const dung = M.BODY_TYPE_OF_KIND[k];
    // ① ruột ĐÚNG phải qua.
    if (M.importIdfc(JSON.stringify({ idfcVersion: 3, meta: metaMau({ kind: k, code: `K-${k}` }), body: clone(ruotMau[dung]) }))) hopLe += 1;
    // ② mọi ruột SAI phải bị chặn.
    for (const t of Object.keys(ruotMau)) {
      if (t === dung) continue;
      const r = M.importIdfc(JSON.stringify({ idfcVersion: 3, meta: metaMau({ kind: k, code: `K-${k}-${t}` }), body: clone(ruotMau[t]) }));
      if (r === null) chanDung += 1; else lot.push(`${k}←${t}`);
    }
  }
  ca(`CA 4.1 · ${kinds.length} kind với ruột ĐÚNG đều mở được`, kinds.length, hopLe);
  ca('CA 4.2 · KHÔNG cặp kind↔ruột sai nào lọt', 0, lot.length, `chặn đúng ${chanDung} cặp; lọt: ${lot.join(', ') || '(không)'}`);

  const rSai = M.importIdfc(JSON.stringify({ idfcVersion: 3, meta: metaMau({ kind: 'video' }), body: { type: 'component', geom2d: geom2dMau() } }));
  ca('CA 4.3 · kind video + ruột component — lý do nói rõ cả hai vế', true,
    rSai === null && /video/.test(String(M.lastImportIdfcError())) && /component/.test(String(M.lastImportIdfcError())),
    `câu: ${JSON.stringify(M.lastImportIdfcError())}`);
}

/* ═══════════════ CA 5 · APPLY 2D ═══════════════ */

muc('CA 5 · APPLY 2D — .idfc thật → resolveLibraryItem → clusterPrimsToEntities → ENTITY thật');

{
  const json = M.exportIdfc({ meta: seedThat.meta, body: seedThat.body, commerce: seedThat.commerce });
  const mo = M.importIdfc(json);                       // đúng chuỗi: file trên đĩa → nhập
  const g = M.idfcGeom2dOf(mo.body);
  ca('CA 5.1 · idfcGeom2dOf rút được hình 2D từ file vừa nhập', true, !!g && g.prims.length > 0,
    `${mo.meta.code}: ${g ? g.prims.length : 0} prim`);

  const hit = M.resolveLibraryItem({ name: mo.meta.name, code: mo.meta.code }, null, undefined, g);
  ca('CA 5.2 · resolveLibraryItem đi nhánh via:"idfc" (hình CỦA CHÍNH MÓN)', 'idfc', hit ? hit.via : null);

  const ents = hit ? M.clusterPrimsToEntities(hit.geom2d.prims, { x: 0, y: 0 }, { layer: 'l-furniture' }) : [];
  ca('CA 5.3 · ra ENTITY thật, không phải bản vẽ trống', true, ents.length > 0, `${ents.length} entity từ ${g ? g.prims.length : 0} prim`);
  ca('CA 5.4 · mọi entity nằm đúng lớp l-furniture', true, ents.length > 0 && ents.every((e) => e.layer === 'l-furniture'));

  // ĐO VÀ BÁO CÁO — không phán ĐẠT/ĐỎ, đây là sự thật kiến trúc cần biết.
  ghiNhan('CA 5.5 · keepsIdentity của nhánh via:"idfc"', String(hit ? hit.keepsIdentity : 'n/a'),
    hit && hit.keepsIdentity === false
      ? 'FALSE — .idfc tự chứa KHÔNG có blockId trong BLOCK_MAP nên không dựng được BlockEntity; đường thả là LÀM PHẲNG prims. Hệ quả thật: nét thả xuống không đếm/gán specId như một cấu kiện, danh tính chỉ còn nhờ srcBlock/srcInsertId do tầng UI gắn thêm (lib/cad/library-item-resolve.ts:56-70).'
      : 'khác dự kiến — xem lại library-item-resolve.ts');

  // Cả kho mầm — số món đi trọn được chuỗi.
  let coHinh = 0, xuongDuoc = 0, giuDanhTinh = 0;
  for (const s of SEED) {
    const gg = M.idfcGeom2dOf(s.body);
    if (!gg) continue;
    coHinh += 1;
    const h = M.resolveLibraryItem({ name: s.meta.name, code: s.meta.code }, null, undefined, gg);
    if (!h) continue;
    if (h.keepsIdentity) giuDanhTinh += 1;
    if (M.clusterPrimsToEntities(h.geom2d ? h.geom2d.prims : [], { x: 0, y: 0 }, {}).length > 0) xuongDuoc += 1;
  }
  ca(`CA 5.6 · MỌI món mầm có hình 2D đều xuống được bản vẽ`, coHinh, xuongDuoc, `${coHinh}/${SEED.length} món mang hình 2D`);
  ghiNhan('CA 5.7 · số món giữ được danh tính khi thả', `${giuDanhTinh}/${coHinh}`,
    `0 nghĩa là mọi món .idfc thả xuống đều mất danh tính cấu kiện (bệnh G-M3-10 chưa sửa, khai thật trong mã).`);
}

/* ═══════════════ CA 6 · MẤT KHOÁ LẠ ═══════════════ */

muc('CA 6 · MẤT KHOÁ LẠ — khoá app chưa biết có sống sót qua importIdfc không');

{
  const coKhoaLa = {
    idfcVersion: 3,
    meta: metaMau({ code: 'PROOF-XKEY', xFromPhotoMeta: { nguon: 'anh-goc.jpg' } }),
    body: { type: 'component', geom2d: geom2dMau() },
    commerce: { brand: 'ProofCo' },
    xFromPhoto: { anhGoc: 'photo-001.jpg', doTinCay: 0.82, nguoiDung: 'hoa' },
    progress: { phanTram: 40 },
  };
  const r = M.importIdfc(JSON.stringify(coKhoaLa));
  ca('CA 6.0 · file có khoá lạ vẫn mở được (không bị từ chối)', true, !!r, r ? '' : `lý do: ${M.lastImportIdfcError()}`);

  const matGoc = r ? khoaMat({ xFromPhoto: coKhoaLa.xFromPhoto, progress: coKhoaLa.progress }, r) : ['(không mở được)'];
  ca('CA 6.1 · khoá lạ ở CẤP GỐC còn sau importIdfc', [], matGoc,
    matGoc.length
      ? '🔴 BUG THẬT TRONG MÃ SẢN XUẤT — KHÔNG TỰ VÁ. `importIdfc` dựng lại object bằng danh sách trắng và chỉ trả {meta, body, commerce} (lib/cad/idfc.ts:432-442). Mọi khoá cấp gốc app chưa biết bị NUỐT IM LẶNG: mở ra rồi lưu lại = mất dữ liệu người dùng, không một câu cảnh báo.'
      : '');

  const matMeta = r ? khoaMat({ xFromPhotoMeta: coKhoaLa.meta.xFromPhotoMeta }, r.meta) : ['(không mở được)'];
  ca('CA 6.2 · khoá lạ trong META còn sau importIdfc', [], matMeta,
    matMeta.length
      ? '🔴 BUG THẬT — KHÔNG TỰ VÁ. `meta` được dựng lại theo danh sách trắng 13 trường (lib/cad/idfc.ts:415-429); mọi trường ngoài danh sách biến mất.'
      : '');

  // Vòng đầy đủ: mở rồi LƯU LẠI — chứng minh mất dữ liệu là mất thật trên đĩa, không chỉ trong RAM.
  if (r) {
    const luuLai = JSON.parse(M.exportIdfc({ meta: r.meta, body: r.body, commerce: r.commerce }));
    ca('CA 6.3 · mở-rồi-lưu-lại: khoá lạ còn trên ĐĨA', [], khoaMat({ xFromPhoto: coKhoaLa.xFromPhoto }, luuLai),
      'đây là hệ quả cuối cùng của CA 6.1 — người dùng mở file lạ, bấm lưu, dữ liệu bốc hơi.');
  }
}

/* ═══════════════ CA 7 · INTEGRITY ═══════════════ */

muc('CA 7 · INTEGRITY — .idfc hôm nay có hash/manifest/chữ ký không (ghi nhận hiện trạng)');

{
  const daXuat = JSON.parse(M.exportIdfc({ meta: seedThat.meta, body: seedThat.body, commerce: seedThat.commerce }));
  const khoaGoc = Object.keys(daXuat);
  const dauHieu = /hash|sha256|sha1|checksum|digest|signature|chuKy|manifest|integrity/i;
  const khoaToanVen = khoaGoc.filter((k) => dauHieu.test(k));

  let nguon = '';
  try { nguon = readFileSync(path.join(ROOT, 'lib/cad/idfc.ts'), 'utf8'); } catch { nguon = ''; }
  const dongToanVen = nguon
    ? nguon.split('\n').map((l, i) => [i + 1, l]).filter(([, l]) => dauHieu.test(l) && !/^\s*\*/.test(l))
    : null;

  if (dongToanVen === null) {
    chuaDanhGia('CA 7 · INTEGRITY', 'không đọc được lib/cad/idfc.ts để soi mã nguồn');
  } else {
    ghiNhan('CA 7 · hash / manifest / chữ ký trong .idfc', 'MISSING',
      `khoá cấp gốc của tệp xuất ra: [${khoaGoc.join(', ')}] — 0 khoá toàn vẹn (${khoaToanVen.length}). ` +
      `Mã nguồn lib/cad/idfc.ts: ${dongToanVen.length} dòng nhắc hash/checksum/chữ ký. ` +
      `⇒ .idfc là JSON TRẦN: không cách nào phát hiện tệp bị sửa tay, bị cắt cụt, hay không phải do IF sinh ra. ` +
      `Ghi nhận hiện trạng — KHÔNG tính là ca đỏ.`);
  }
}

/* ═══════════════ TỔNG KẾT ═══════════════ */

rmSync(tmp, { recursive: true, force: true });

const do_ = ket.filter((k) => k.trangThai === 'ĐỎ');
const chua = ket.filter((k) => k.trangThai === 'NOT ASSESSED');
const dat = ket.filter((k) => k.trangThai === 'ĐẠT');
const chamDiem = ket.filter((k) => k.trangThai === 'ĐẠT' || k.trangThai === 'ĐỎ');

console.log('\n════════════════════════════════════════════════════════════');
console.log(`${dat.length}/${chamDiem.length} ĐẠT` + (chua.length ? ` · ${chua.length} NOT ASSESSED` : '') + ` · ${ket.length - chamDiem.length - chua.length} ghi-nhận`);
if (do_.length) {
  console.log('\nĐỎ:');
  for (const k of do_) console.log(`  · ${k.ten}`);
}
if (chua.length) {
  console.log('\nNOT ASSESSED:');
  for (const k of chua) console.log(`  · ${k.ten}`);
}
console.log('════════════════════════════════════════════════════════════\n');

process.exit(do_.length ? 1 : 0);
