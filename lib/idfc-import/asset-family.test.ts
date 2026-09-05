/**
 * lib/idfc-import/asset-family.test.ts — họ tài sản chuẩn hoá: tất định · round-trip .idfc thật ·
 * không bịa số · hỏng thì hiện · pháp lý quyết chính sách hình học · hàng DB đúng shape.
 * Fixture GLB tự dựng (lib/idfc-seed/fixture-glb.ts) — không byte ngoài.
 * Chạy: node_modules/.bin/sucrase-node lib/idfc-import/asset-family.test.ts
 */
import { createHash } from 'crypto';
import {
  boqEligibleDims,
  computeFamilyId,
  normalizeAssetFamily,
  toRepresentationRows,
  REPRESENTATION_DB_KIND,
  type AssetFamilyCandidate,
  type NormalizedRepresentation,
} from './asset-family';
import { importIdfc } from '../cad/idfc';
import { buildBoxGlb } from '../idfc-seed/fixture-glb';
import { glbStats } from './glb-stats';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}
const rep = (f: { representations: NormalizedRepresentation[] }, k: NormalizedRepresentation['kind']) => f.representations.find((r) => r.kind === k);
const NOW = '2026-09-02T10:00:00.000Z';
const VERIFIED = { verifiedBy: 'hoa', verifiedAt: '2026-09-01T00:00:00Z', evidenceUrl: 'https://brand.example/permission' };
const SRC = 'https://brand.example/chair-x';

function chairCandidate(over: Partial<AssetFamilyCandidate> = {}): AssetFamilyCandidate {
  const glb = buildBoxGlb({ wMm: 600, dMm: 600, hMm: 750 });
  return {
    name: 'Chair X',
    code: 'CX-01',
    kind: 'furniture',
    origin: { kind: 'manufacturer-reference', url: SRC, contentHash: createHash('sha256').update(glb).digest('hex'), originalName: 'chair-x.glb', originalMime: 'model/gltf-binary', originalBytes: glb.byteLength },
    license: { id: 'proprietary', sourceUrl: SRC },
    dims: {
      wMm: { value: 600, flag: 'verified', source: SRC },
      dMm: { value: 600, flag: 'verified', source: SRC },
      hMm: { value: 750, flag: 'verified', source: SRC },
    },
    preview: { payloadRef: 'https://brand.example/chair-x.jpg', flag: 'verified', source: SRC },
    model3d: { payloadRef: 'https://brand.example/chair-x.glb', format: 'glb', glb, upAxisDeclared: 'Y', source: SRC },
    catalog: { brand: 'Brand', sku: 'CX-01', productUrl: SRC },
    ...over,
  };
}

console.log('asset-family: model hãng đủ dữ liệu (reference-only)');
{
  const f = normalizeAssetFamily(chairCandidate(), { now: NOW });
  ok('tier reference-only (hãng chưa cho phép tường minh)', f.acquisition.tier === 'reference-only');
  ok('.idfc dựng được', f.idfc.ok);
  ok('round-trip importIdfc thật', f.idfc.ok && importIdfc(f.idfc.json)?.meta.code === 'CX-01');
  ok('meta.id = familyId', f.idfc.ok && f.idfc.parsed.meta.id === f.familyId);
  ok('ruột component có geom2d + heightMm 750', f.idfc.ok && f.idfc.parsed.body.type === 'component' && f.idfc.parsed.body.geom3d?.heightMm === 750);
  ok('plan-line suy từ w×d, cờ inferred, nguồn derived', rep(f, 'plan-line')?.status === 'ready' && rep(f, 'plan-line')?.truthLevel === 'inferred' && /derived/.test(rep(f, 'plan-line')?.source ?? ''));
  ok('model3d on-demand (metadata+thumb trước, hình học theo yêu cầu)', rep(f, 'model3d')?.status === 'on-demand');
  ok('model3d meta có tam giác đo từ file', rep(f, 'model3d')?.meta?.triangles === 12);
  ok('bounds ready từ số khai, cờ verified', rep(f, 'bounds')?.status === 'ready' && rep(f, 'bounds')?.truthLevel === 'verified' && f.bounds?.yMm === 750);
  ok('preview ready', rep(f, 'preview')?.status === 'ready');
  ok('spec ready, boqEligible = 3', rep(f, 'spec')?.status === 'ready' && rep(f, 'spec')?.meta?.boqEligible === 3);
  ok('mesh khớp số khai ⇒ 0 issue', f.issues.length === 0);
  ok('meshStats có boundsMm 600×750×600', f.meshStats?.boundsMm?.xMm === 600 && f.meshStats?.boundsMm?.yMm === 750);
  ok('commerce mang brand/sku từ catalog', f.idfc.ok && f.idfc.parsed.commerce?.sku === 'CX-01' && f.idfc.parsed.commerce?.brand === 'Brand');
  const x = f.idfc.ok ? (JSON.parse(f.idfc.json) as { xAssetFamily: { origin: { contentHash: string }; license: { id: string }; reviewStatus: string } }).xAssetFamily : null;
  ok('xAssetFamily giữ origin (hash gốc) + license + draft', x?.origin.contentHash === f.origin.contentHash && x?.license.id === 'proprietary' && x?.reviewStatus === 'draft-pending-review');
}

console.log('asset-family: tất định + danh tính ổn định');
{
  const a = normalizeAssetFamily(chairCandidate(), { now: NOW });
  const b = normalizeAssetFamily(chairCandidate(), { now: NOW });
  ok('cùng đầu vào ⇒ cùng JSON .idfc từng byte', a.idfc.ok && b.idfc.ok && a.idfc.json === b.idfc.json);
  ok('cùng familyId', a.familyId === b.familyId && /^[0-9a-f]{64}$/.test(a.familyId));
  ok('familyId neo theo contentHash: đổi tên vẫn cùng id', computeFamilyId({ ...chairCandidate(), name: 'Khác' }) === a.familyId);
  const noHash = chairCandidate({ origin: { kind: 'manufacturer-reference', url: SRC } });
  ok('không hash ⇒ neo theo URL', computeFamilyId(noHash) === computeFamilyId({ ...noHash, name: 'Khác' }));
  ok('nguồn khác ⇒ id khác', computeFamilyId({ ...noHash, origin: { kind: 'open-candidate', url: SRC } }) !== computeFamilyId(noHash));
  ok('now khác ⇒ familyId KHÔNG đổi', normalizeAssetFamily(chairCandidate(), { now: '2030-01-01T00:00:00.000Z' }).familyId === a.familyId);
}

console.log('asset-family: KHÔNG BỊA SỐ');
{
  const noDims = normalizeAssetFamily(chairCandidate({ dims: undefined }), { now: NOW });
  ok('thiếu số khai + mesh hợp lệ ⇒ dims điền từ mesh, cờ inferred', noDims.dims.hMm?.flag === 'inferred' && noDims.dims.hMm?.source === 'glb:bounds' && noDims.dims.hMm?.value === 750);
  ok('bounds từ mesh cờ inferred', rep(noDims, 'bounds')?.truthLevel === 'inferred');
  ok('BOQ không nhận chiều inferred', Object.keys(boqEligibleDims(noDims.dims)).length === 0);
  ok('spec meta boqEligible 0', rep(noDims, 'spec')?.meta?.boqEligible === 0);
  const partial = normalizeAssetFamily(chairCandidate({ dims: { hMm: { value: 750, flag: 'verified', source: SRC } } }), { now: NOW });
  ok('chỉ khai h: w/d điền từ mesh inferred, h GIỮ verified (không ghi đè nguồn người)', partial.dims.hMm?.flag === 'verified' && partial.dims.wMm?.flag === 'inferred');
  const nothing = normalizeAssetFamily(chairCandidate({ dims: undefined, model3d: undefined }), { now: NOW });
  ok('không số không mesh ⇒ plan-line unsupported có lý do, KHÔNG biến mất', rep(nothing, 'plan-line')?.status === 'unsupported' && /không bịa/.test(rep(nothing, 'plan-line')?.reason ?? ''));
  ok('bounds unsupported', rep(nothing, 'bounds')?.status === 'unsupported');
  ok('.idfc không dựng ⇒ ok:false + lý do, họ vẫn trả về', !nothing.idfc.ok && nothing.representations.length > 0 && rep(nothing, 'preview')?.status === 'ready');
  ok('dims không có chiều nào', Object.keys(nothing.dims).length === 0);
}

console.log('asset-family: mesh sai đơn vị / sai trục — báo, KHÔNG sửa');
{
  const mmMesh = buildBoxGlb({ wMm: 600_000, dMm: 600_000, hMm: 750_000 }); // "mét" nhưng thật ra dựng bằng mm
  const f = normalizeAssetFamily(chairCandidate({ model3d: { payloadRef: 'x.glb', format: 'glb', glb: mmMesh, source: SRC } }), { now: NOW });
  ok('issue mesh-scale-mismatch', f.issues.some((i) => i.code === 'mesh-scale-mismatch'));
  ok('model3d invalid, có lý do', rep(f, 'model3d')?.status === 'invalid' && /Không tự scale/.test(rep(f, 'model3d')?.reason ?? ''));
  ok('bounds vẫn từ số khai verified (mesh hỏng không làm mất số người)', rep(f, 'bounds')?.truthLevel === 'verified');
  ok('.idfc vẫn dựng được (2D + spec không phụ thuộc mesh)', f.idfc.ok);
  ok('hàng DB không chứa model3d invalid', !toRepresentationRows(f).some((r) => r.kind === 'model3d'));

  const zUp = buildBoxGlb({ wMm: 600, dMm: 750, hMm: 600 }); // cao nằm ở trục z
  const z = normalizeAssetFamily(chairCandidate({ model3d: { payloadRef: 'z.glb', format: 'glb', glb: zUp, source: SRC } }), { now: NOW });
  ok('nghi mesh Z-up ⇒ axis-mismatch-likely', z.issues.some((i) => i.code === 'axis-mismatch-likely'));
  const declZ = normalizeAssetFamily(chairCandidate({ model3d: { payloadRef: 'z.glb', format: 'glb', upAxisDeclared: 'Z', source: SRC } }), { now: NOW });
  ok('khai Z-up không byte ⇒ vẫn báo axis-declared-z-up', declZ.issues.some((i) => i.code === 'axis-declared-z-up') && rep(declZ, 'model3d')?.status === 'invalid');

  const noDimsBad = normalizeAssetFamily(chairCandidate({ dims: undefined, model3d: { payloadRef: 'x.glb', format: 'glb', glb: mmMesh, source: SRC } }), { now: NOW });
  ok('không số khai + mesh ngoài dải ⇒ implausible, KHÔNG điền dims từ mesh', noDimsBad.issues.some((i) => i.code === 'mesh-scale-implausible') && Object.keys(noDimsBad.dims).length === 0 && rep(noDimsBad, 'bounds')?.status === 'unsupported');

  const scaled = buildBoxGlb({ wMm: 600, dMm: 600, hMm: 750, nodeScale: [2, 2, 2] });
  const st = glbStats(scaled);
  ok('glbStats áp node scale vào bounds', st?.bounds?.basis === 'scene' && Math.abs((st?.bounds?.max[1] ?? 0) - 1.5) < 1e-9);
  const s = normalizeAssetFamily(chairCandidate({ model3d: { payloadRef: 's.glb', format: 'glb', glb: scaled, source: SRC } }), { now: NOW });
  ok('node scale ×2 ⇒ lệch ×0.5 báo mismatch (không tin accessor thô)', s.issues.some((i) => i.code === 'mesh-scale-mismatch'));
}

console.log('asset-family: byte hỏng / định dạng chưa hỗ trợ / số khai hỏng');
{
  const bad = normalizeAssetFamily(chairCandidate({ model3d: { payloadRef: 'x.glb', format: 'glb', glb: new TextEncoder().encode('not a glb at all, really not'), source: SRC } }), { now: NOW });
  ok('GLB rác ⇒ glb-unreadable + model3d invalid', bad.issues.some((i) => i.code === 'glb-unreadable') && rep(bad, 'model3d')?.status === 'invalid');
  const skp = normalizeAssetFamily(chairCandidate({ model3d: { payloadRef: 'x.skp', format: 'skp', source: SRC } }), { now: NOW });
  ok('.skp ⇒ unsupported có lý do, con trỏ giữ', rep(skp, 'model3d')?.status === 'unsupported' && rep(skp, 'model3d')?.payloadRef === 'x.skp');
  const nan = normalizeAssetFamily(chairCandidate({ dims: { wMm: { value: NaN, flag: 'verified', source: SRC }, dMm: { value: 600, flag: 'verified', source: SRC }, hMm: { value: 750, flag: 'verified', source: SRC } } }), { now: NOW });
  ok('w = NaN ⇒ issue dim-not-finite (dấu vết giữ), NaN KHÔNG chảy vào dims', nan.issues.some((i) => i.code === 'dim-not-finite') && nan.dims.wMm?.flag === 'inferred' && nan.dims.wMm?.source === 'glb:bounds' && nan.dims.wMm?.value === 600);
  ok('w hỏng + mesh hợp lệ ⇒ bounds ready cờ inferred, nguồn declared+glb:bounds', rep(nan, 'bounds')?.status === 'ready' && rep(nan, 'bounds')?.truthLevel === 'inferred' && nan.bounds?.source === 'declared+glb:bounds');
  ok('plan-line suy từ w(inferred)×d(verified), BOQ chỉ nhận 2 chiều', rep(nan, 'plan-line')?.status === 'ready' && rep(nan, 'spec')?.meta?.boqEligible === 2 && nan.idfc.ok);
  const nanNoMesh = normalizeAssetFamily(chairCandidate({ model3d: undefined, dims: { wMm: { value: NaN, flag: 'verified', source: SRC }, dMm: { value: 600, flag: 'verified', source: SRC }, hMm: { value: 750, flag: 'verified', source: SRC } } }), { now: NOW });
  ok('w = NaN không mesh ⇒ plan-line/bounds unsupported, .idfc không dựng, không bịa', rep(nanNoMesh, 'plan-line')?.status === 'unsupported' && rep(nanNoMesh, 'bounds')?.status === 'unsupported' && !nanNoMesh.idfc.ok && !('wMm' in nanNoMesh.dims));
  const json = nan.idfc.ok ? nan.idfc.json : '';
  ok('.idfc không chứa null do NaN', !/"value":null/.test(json));
}

console.log('asset-family: pháp lý quyết chính sách hình học + hàng DB');
{
  const blocked = normalizeAssetFamily(chairCandidate({ license: { id: 'proprietary', termsForbidRebundle: true } }), { now: NOW });
  ok('blocked ⇒ model3d pointer-only', blocked.acquisition.tier === 'blocked' && rep(blocked, 'model3d')?.status === 'pointer-only');
  ok('blocked ⇒ 0 hàng DB', toRepresentationRows(blocked).length === 0);
  ok('blocked ⇒ issue license-blocked hiện ra', blocked.issues.some((i) => i.code === 'license-blocked'));
  ok('blocked vẫn trả .idfc (metadata hợp pháp, hình học không lưu)', blocked.idfc.ok);

  const allowed = normalizeAssetFamily(chairCandidate({ license: { id: 'proprietary', sourceUrl: SRC, redistributionPermission: 'explicit', ...VERIFIED } }), { now: NOW });
  ok('hãng cho phép tường minh ⇒ redistributable, model3d ready', allowed.acquisition.tier === 'redistributable' && rep(allowed, 'model3d')?.status === 'ready');
  const rows = toRepresentationRows(allowed);
  ok('hàng DB: plan-line → kind "plan", preview → "image"', rows.some((r) => r.kind === 'plan') && rows.some((r) => r.kind === 'image'));
  ok('hàng DB không có unsupported/invalid', rows.every((r) => r.payloadRef.length > 0));
  ok('provenance là JSON có familyId + tier', rows.every((r) => { const p = JSON.parse(r.provenance); return p.familyId === allowed.familyId && p.tier === 'redistributable'; }));
  ok('truthLevel chỉ 3 nấc', rows.every((r) => ['measured', 'inferred', 'verified'].includes(r.truthLevel)));
  ok('bảng DB kind phủ đủ 10 loại', Object.keys(REPRESENTATION_DB_KIND).length === 10);

  const user = normalizeAssetFamily(chairCandidate({ origin: { kind: 'user-upload' }, license: { id: 'unknown' } }), { now: NOW });
  ok('user-upload ⇒ user-import, model3d ready (trong phạm vi user)', user.acquisition.tier === 'user-import' && rep(user, 'model3d')?.status === 'ready');
  ok('user-upload không hash không URL ⇒ familyId neo tên+mã', computeFamilyId(user) === computeFamilyId({ ...user, origin: { kind: 'user-upload' } }));
}

console.log('asset-family: LOD + PBR + vật liệu');
{
  const f = normalizeAssetFamily(chairCandidate({
    lod: [{ level: 0, payloadRef: 'l0.glb', triangles: 5000, source: SRC }, { level: 1, payloadRef: 'l1.glb', triangles: 9000, source: SRC }, { level: 2, payloadRef: '', source: SRC }],
    pbr: { value: { baseColor: '#aabbcc', roughness: 0.6, baseColorMapUrl: 'https://brand.example/wood.jpg' }, flag: 'inferred', source: SRC },
  }), { now: NOW });
  ok('LOD ngược thứ tự ⇒ warn lod-order', f.issues.some((i) => i.code === 'lod-order' && i.level === 'warn'));
  ok('LOD thiếu payloadRef ⇒ invalid vẫn hiện', f.representations.filter((r) => r.kind === 'lod').length === 3 && f.representations.some((r) => r.kind === 'lod' && r.status === 'invalid'));
  ok('pbr ready, đếm 1 map', rep(f, 'pbr')?.status === 'ready' && rep(f, 'pbr')?.meta?.maps === 1);
  ok('pbr vào geom3d của cấu kiện', f.idfc.ok && f.idfc.parsed.body.type === 'component' && f.idfc.parsed.body.geom3d?.pbr?.roughness === 0.6);

  const mat = normalizeAssetFamily({
    name: 'Oak veneer', code: 'OAK-01', kind: 'material',
    origin: { kind: 'open-candidate', url: 'https://open.example/oak' },
    license: { id: 'CC0-1.0', ...VERIFIED },
    pbr: { value: { baseColor: '#c8a86b', roughness: 0.7, metallic: 0 }, flag: 'measured', source: 'https://open.example/oak' },
  }, { now: NOW });
  ok('vật liệu CC0 xác minh ⇒ redistributable', mat.acquisition.tier === 'redistributable');
  ok('vật liệu: ruột material, pbr inline', mat.idfc.ok && mat.idfc.parsed.body.type === 'material' && rep(mat, 'pbr')?.payloadRef === 'inline:idfc.body.pbr');
  ok('vật liệu không có plan-line unsupported (không bắt vật liệu có nét)', !rep(mat, 'plan-line'));
  const matNoPbr = normalizeAssetFamily({ name: 'x', code: 'x', kind: 'material', origin: { kind: 'user-upload' }, license: { id: 'unknown' } }, { now: NOW });
  ok('vật liệu thiếu PBR ⇒ .idfc ok:false có lý do', !matNoPbr.idfc.ok && /PBR/.test(matNoPbr.idfc.ok ? '' : matNoPbr.idfc.reason));
  const page = normalizeAssetFamily({ name: 'p', code: 'p', kind: 'page', origin: { kind: 'user-upload' }, license: { id: 'unknown' } }, { now: NOW });
  ok('kind page ⇒ .idfc ok:false nói rõ ngoài slice', !page.idfc.ok && /kind "page"/.test(page.idfc.ok ? '' : page.idfc.reason));
}

console.log(`\n${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
