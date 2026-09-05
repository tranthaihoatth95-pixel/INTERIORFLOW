/**
/**
 * lib/idfc-seed/seed.test.ts — KHOÁ MÁY cho kho mầm Thư viện. HAI SUITE trong MỘT tệp.
 *
 * Hoà nhánh 05/09: hai nhánh cùng đặt tên `seed.test.ts` nhưng kiểm HAI thứ khác nhau, và cả hai
 * mô-đun bị kiểm đều còn sống trong cây (`./index` lẫn `./seed`+`./receipt`+`./fixture-glb`).
 * Bỏ suite nào cũng là bỏ trắng một vùng đã có khoá ⇒ giữ cả hai, dùng chung một bộ đếm.
 *   · SUITE A — NỘI DUNG kho mầm có thật không (kiểm `SEED_IDFC_ITEMS`/`SEED_PROVENANCE`).
 *     Bốn tội danh bị chặn, mỗi tội là một cách kho hàng biến thành kho vẽ:
 *       [3] có món nhưng không có tệp đứng sau  → kệ trông đầy mà kéo ra không có gì.
 *       [5] tự nhận nấc `verified`               → máy tự phong "người đã duyệt".
 *       [6] bịa giá / bịa số lượt dùng           → số bịa đi thẳng vào báo giá gửi khách.
 *       [8] khoe mặt mà sau lưng trống           → "một vật nhiều mặt" thành nhãn suông.
 *   · SUITE B — ĐƯỜNG DỰNG fixture: byte tất định, `glbStats` đọc đúng, seed đi đường chuẩn hoá
 *     THẬT ra họ redistributable + round-trip `.idfc` + hộp bao khớp số khai.
 *
 * Chạy: `node_modules/.bin/sucrase-node lib/idfc-seed/seed.test.ts`
 */

import { createHash } from 'crypto';
import { buildBoxGlb } from './fixture-glb';
import { buildSeedFamilies } from './seed';
import { SEED_BOXES, SEED_RECEIPT, seedLicenseClaim } from './receipt';
import { glbStats } from '../idfc-import/glb-stats';
import { importIdfc } from '../cad/idfc';
import { isLicenseVerified } from '../idfc-import/license-gate';

let pass = 0;
const fails: string[] = [];
/** Bộ đếm DÙNG CHUNG cho cả hai suite — một tệp, một mã thoát. */
function ok(name: string, cond: boolean, chiTiet = '') {
  if (cond) {
    pass += 1;
    console.log(`  \u2714 ${name}`);
  } else {
    fails.push(`${name}${chiTiet ? ` — ${chiTiet}` : ''}`);
    console.log(`  \u2718 ${name}${chiTiet ? ` — ${chiTiet}` : ''}`);
  }
}

/* ══════════════════ SUITE A — NỘI DUNG kho mầm (`./index`) ══════════════════ */

import { existsSync } from 'node:fs';
import path from 'node:path';
import { IDFC_KINDS, BODY_TYPE_OF_KIND } from '../cad/idfc';
import { SEED_IDFC_ITEMS, SEED_PROVENANCE, matBieuDienCua, tronKhoMam, laKhoMam } from './index';

const PUBLIC = path.resolve(__dirname, '../../public');

/* [1] Kho mầm KHÔNG RỖNG — chính là lý do file này tồn tại. */
ok('[1] kho mầm có món', SEED_IDFC_ITEMS.length > 0, `${SEED_IDFC_ITEMS.length} món`);

/* [2] MỘT MÃ = MỘT DANH TÍNH — trùng mã tức là hai bản sao của cùng một vật. */
{
  const codes = SEED_IDFC_ITEMS.map((i) => i.meta.code);
  ok('[2] mã món không trùng', new Set(codes).size === codes.length,
    `${codes.length} món / ${new Set(codes).size} mã`);
}

/* [3] MỌI MÓN TRUY ĐƯỢC VỀ NGUỒN, và tệp nguồn public phải CÓ THẬT trên đĩa. */
{
  const thieuGiaPha = SEED_IDFC_ITEMS.filter((i) => !SEED_PROVENANCE[i.meta.code]);
  ok('[3a] mọi món có gia phả', thieuGiaPha.length === 0,
    thieuGiaPha.map((i) => i.meta.code).join(', '));

  const tepHong: string[] = [];
  for (const [code, p] of Object.entries(SEED_PROVENANCE)) {
    for (const rel of [p.nguon, p.anhXemTruoc]) {
      // Nguồn dạng module TS (`lib/...`) không nằm trong /public — chỉ kiểm nguồn public.
      if (rel && rel.startsWith('/') && !existsSync(path.join(PUBLIC, rel))) tepHong.push(`${code}:${rel}`);
    }
  }
  ok('[3b] mọi tệp nguồn public có thật trên đĩa', tepHong.length === 0, tepHong.slice(0, 5).join(', '));
}

/* [4] RUỘT KHỚP LOẠI — luật `BODY_TYPE_OF_KIND` của idfc.ts, không món nào lách. */
{
  const lech = SEED_IDFC_ITEMS.filter((i) => BODY_TYPE_OF_KIND[i.meta.kind] !== i.body.type);
  ok('[4a] ruột khớp loại', lech.length === 0, lech.map((i) => `${i.meta.code}:${i.meta.kind}/${i.body.type}`).join(', '));
  const laKindThat = SEED_IDFC_ITEMS.every((i) => (IDFC_KINDS as readonly string[]).includes(i.meta.kind));
  ok('[4b] loại nằm trong 12 loại đã khai', laKindThat);
}

/* [5] KHÔNG NẤC THỨ TƯ, và kho mầm KHÔNG tự phong `verified`. */
{
  const NAC = new Set(['measured', 'inferred', 'verified']);
  const la: string[] = [];
  const tuPhong: string[] = [];
  for (const [code, p] of Object.entries(SEED_PROVENANCE)) {
    for (const [mat, nac] of Object.entries(p.doTinCay)) {
      if (!NAC.has(nac as string)) la.push(`${code}.${mat}=${nac}`);
      if (nac === 'verified') tuPhong.push(`${code}.${mat}`);
    }
  }
  ok('[5a] chỉ có 3 nấc tin cậy', la.length === 0, la.join(', '));
  ok('[5b] kho mầm không tự nhận verified', tuPhong.length === 0, tuPhong.join(', '));
  const thieuNac = Object.entries(SEED_PROVENANCE).filter(([, p]) => Object.keys(p.doTinCay).length === 0);
  ok('[5c] món nào cũng khai nấc tin cậy', thieuNac.length === 0, thieuNac.map(([c]) => c).join(', '));
}

/* [6] KHÔNG BỊA THƯƠNG MẠI. Repo hiện KHÔNG có nguồn giá cho các tài sản này ⇒ 0 món có
 *     `commerce`. Nếu sau này nối được nguồn giá thật, test đổi theo — nhưng phải ĐỔI CÓ Ý,
 *     không được lặng lẽ mọc giá. */
{
  const coGia = SEED_IDFC_ITEMS.filter((i) => i.commerce && Object.keys(i.commerce).length > 0);
  ok('[6] không món mầm nào bịa dữ liệu thương mại', coGia.length === 0,
    coGia.map((i) => i.meta.code).join(', '));
}

/* [7] MẶT 2D PHẢI CÓ HÌNH THẬT — cấu kiện khai geom2d mà prims rỗng là vỏ rỗng. */
{
  const rong = SEED_IDFC_ITEMS.filter((i) => i.body.type === 'component' && i.body.geom2d.prims.length === 0);
  ok('[7a] cấu kiện nào cũng có hình 2D thật', rong.length === 0, rong.map((i) => i.meta.code).join(', '));
  const saiCo = SEED_IDFC_ITEMS.filter((i) => i.body.type === 'component' && !(i.body.geom2d.w > 0 && i.body.geom2d.h > 0));
  ok('[7b] bao ngoài là số dương thật', saiCo.length === 0, saiCo.map((i) => i.meta.code).join(', '));
}

/* [8] MỘT VẬT NHIỀU MẶT — và mặt nào khai ra cũng phải có dữ liệu đứng sau. */
{
  const khongCoMat = SEED_IDFC_ITEMS.filter((i) => matBieuDienCua(i).length === 0);
  ok('[8a] món nào cũng lộ ít nhất 1 mặt', khongCoMat.length === 0, khongCoMat.map((i) => i.meta.code).join(', '));

  const nhieuMat = SEED_IDFC_ITEMS.filter((i) => matBieuDienCua(i).length >= 2);
  ok('[8b] có món lộ ≥2 mặt dưới cùng một danh tính', nhieuMat.length > 0, `${nhieuMat.length} món`);

  // Mặt 'thuong-mai' không được xuất hiện khi [6] nói không có commerce — hai test phải nhất quán.
  const khoeGiaSuong = SEED_IDFC_ITEMS.filter((i) => matBieuDienCua(i).includes('thuong-mai') && !i.commerce);
  ok('[8c] không khoe mặt thương mại khi không có commerce', khoeGiaSuong.length === 0);

  // Mặt 'anh' chỉ được khai khi gia phả có tệp ảnh — [3b] đã kiểm tệp đó tồn tại thật.
  const khoeAnhSuong = SEED_IDFC_ITEMS.filter(
    (i) => matBieuDienCua(i).includes('anh') && !SEED_PROVENANCE[i.meta.code]?.anhXemTruoc,
  );
  ok('[8d] mặt ảnh luôn có tệp ảnh đứng sau', khoeAnhSuong.length === 0);
}

/* [9] TRỘN KHO — studio thắng kho mầm, và không món nào bị nhân đôi. */
{
  const mamDau = SEED_IDFC_ITEMS[0];
  const banStudio = { meta: { ...mamDau.meta, name: 'BẢN CỦA STUDIO' }, body: mamDau.body } as typeof mamDau;
  const tron = tronKhoMam([banStudio]);
  ok('[9a] trộn không nhân đôi món cùng mã', tron.length === SEED_IDFC_ITEMS.length, `${tron.length}`);
  ok('[9b] bản studio đè bản mầm', tron[0].meta.name === 'BẢN CỦA STUDIO', tron[0].meta.name);

  const monLa = { meta: { code: 'STUDIO-KHONG-CO-TRONG-MAM' }, body: null } as never;
  ok('[9c] món studio không có trong mầm vẫn được giữ', tronKhoMam([monLa]).length === SEED_IDFC_ITEMS.length + 1);
  ok('[9d] nhận diện đúng món thuộc kho mầm', laKhoMam(mamDau.meta.code) && !laKhoMam('STUDIO-KHONG-CO-TRONG-MAM'));
}

const sha = (b: Uint8Array) => createHash('sha256').update(b).digest('hex');

/* ══════════════════ SUITE B — ĐƯỜNG DỰNG fixture (`./seed` · `./receipt` · `./fixture-glb`) ══════════════════ */
console.log('fixture-glb');
{
  const a = buildBoxGlb({ wMm: 400, dMm: 400, hMm: 450 });
  const b = buildBoxGlb({ wMm: 400, dMm: 400, hMm: 450 });
  ok('byte tất định (sha256 bằng nhau)', sha(a) === sha(b));
  ok('nhỏ (< 1KB)', a.byteLength < 1024);
  ok('tổng bytes header = byteLength', new DataView(a.buffer).getUint32(8, true) === a.byteLength);
  const st = glbStats(a);
  ok('glbStats đọc được', !!st && st.triangles === 12 && st.vertices === 8 && st.meshes === 1);
  ok('bounds: x∈[-0.2,0.2] y∈[0,0.45] z∈[-0.2,0.2]', !!st?.bounds && st.bounds.basis === 'scene' && Math.abs(st.bounds.min[0] + 0.2) < 1e-9 && Math.abs(st.bounds.max[1] - 0.45) < 1e-9 && st.bounds.min[1] === 0);
  ok('generator nhận ra fixture IF', st?.generator === 'interiorflow-seed/fixture-glb');
  let threw = false;
  try { buildBoxGlb({ wMm: 0, dMm: 1, hMm: 1 }); } catch { threw = true; }
  ok('kích thước ≤0 ⇒ throw lúc dựng', threw);
}

console.log('receipt');
{
  ok('biên lai CC0 đủ ba vế', SEED_RECEIPT.license === 'CC0-1.0' && isLicenseVerified(seedLicenseClaim()));
  ok('nguồn khai tự tác, không URL ngoài', /self-authored/.test(SEED_RECEIPT.source) && SEED_RECEIPT.evidenceUrl.startsWith('repo://'));
  ok('3 hộp, 3 kind chia thầu khác nhau', SEED_BOXES.length === 3 && new Set(SEED_BOXES.map((b) => b.kind)).size === 3);
}

console.log('seed → họ tài sản (đường chuẩn hoá thật)');
{
  const seeds = buildSeedFamilies();
  ok('3 họ', seeds.length === 3);
  for (const s of seeds) {
    const f = s.family;
    const box = SEED_BOXES.find((b) => b.code === f.code)!;
    ok(`${f.code}: redistributable`, f.acquisition.tier === 'redistributable' && f.acquisition.geometryPolicy === 'store-derivatives');
    ok(`${f.code}: 0 issue`, f.issues.length === 0);
    ok(`${f.code}: .idfc round-trip`, f.idfc.ok && importIdfc(f.idfc.json)?.meta.kind === box.kind);
    ok(`${f.code}: bounds khớp số khai (verified)`, f.bounds?.xMm === box.wMm && f.bounds?.yMm === box.hMm && f.bounds?.zMm === box.dMm && f.bounds?.truthLevel === 'verified');
    ok(`${f.code}: mesh bounds khớp`, f.meshStats?.boundsMm?.xMm === box.wMm && f.meshStats?.boundsMm?.yMm === box.hMm);
    ok(`${f.code}: model3d ready + contentHash = sha256(glb)`, f.representations.find((r) => r.kind === 'model3d')?.status === 'ready' && f.origin.contentHash === sha(s.glb) && s.contentHash === sha(s.glb));
    ok(`${f.code}: familyId neo theo hash`, f.familyId === createHash('sha256').update(`if-seed|hash:${s.contentHash}`).digest('hex'));
  }
  const again = buildSeedFamilies();
  ok('tất định: chạy lại cùng JSON', seeds.every((s, i) => s.family.idfc.ok && again[i].family.idfc.ok && s.family.idfc.json === again[i].family.idfc.json));
  ok('tổng byte 3 fixture < 3KB (không phình repo)', seeds.reduce((n, s) => n + s.glb.byteLength, 0) < 3 * 1024);
}

console.log(`\n${pass} pass · ${fails.length} fail`);
if (fails.length) {
  console.error('FAIL:\n' + fails.map((f) => `  - ${f}`).join('\n'));
  process.exit(1);
}
