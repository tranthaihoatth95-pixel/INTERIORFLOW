/**
 * app/api/manufacturer-import/_lib/parse-candidate.test.ts — JSON client → ứng viên: trường sai
 * kiểu là 400 nói rõ, số không nguồn bị từ chối, base64 có trần, if-seed không nhận qua API.
 * Chạy: node_modules/.bin/sucrase-node app/api/manufacturer-import/_lib/parse-candidate.test.ts
 */
import { decodeGlbBase64, parseCandidate, GLB_MAX_BYTES } from './parse-candidate';
import { buildBoxGlb } from '../../../../lib/idfc-seed/fixture-glb';
import { normalizeAssetFamily } from '../../../../lib/idfc-import/asset-family';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}
const err = (b: unknown) => { const r = parseCandidate(b); return r.ok ? '' : r.error; };
const SRC = 'https://brand.example/chair';
const base = () => ({
  name: 'Chair', code: 'C1', kind: 'furniture',
  origin: { kind: 'manufacturer-reference', url: SRC, contentHash: 'A'.repeat(64) },
  license: { id: 'proprietary', sourceUrl: SRC },
});

console.log('parseCandidate — từ chối đúng chỗ');
{
  ok('null', /object/.test(err(null)));
  ok('thiếu name', /name/.test(err({ ...base(), name: '' })));
  ok('kind lạ', /kind phải thuộc/.test(err({ ...base(), kind: 'chair' })));
  ok('origin thiếu', /origin bắt buộc/.test(err({ ...base(), origin: undefined })));
  ok('origin.kind lạ', /origin\.kind/.test(err({ ...base(), origin: { kind: 'scrape' } })));
  ok('if-seed qua API ⇒ từ chối', /if-seed/.test(err({ ...base(), origin: { kind: 'if-seed' } })));
  ok('manufacturer-reference thiếu url ⇒ từ chối', /origin\.url bắt buộc/.test(err({ ...base(), origin: { kind: 'manufacturer-reference' } })));
  ok('contentHash không phải sha256 hex', /sha256/.test(err({ ...base(), origin: { kind: 'manufacturer-reference', url: SRC, contentHash: 'abc' } })));
  ok('license thiếu', /license bắt buộc/.test(err({ ...base(), license: undefined })));
  ok('license.id lạ ⇒ nhắc dùng unknown, máy không đoán', /không đoán/.test(err({ ...base(), license: { id: 'free' } })));
  ok('dims.wMm thiếu source ⇒ "số không nguồn là số bịa"', /số bịa/.test(err({ ...base(), dims: { wMm: { value: 600, flag: 'verified' } } })));
  ok('dims.wMm flag lạ', /flag/.test(err({ ...base(), dims: { wMm: { value: 600, flag: 'sure', source: SRC } } })));
  ok('dims.wMm value chuỗi', /value phải là số/.test(err({ ...base(), dims: { wMm: { value: '600', flag: 'verified', source: SRC } } })));
  ok('preview dataURL ⇒ cấm', /dataURL/.test(err({ ...base(), preview: { payloadRef: 'data:image/png;base64,AA', flag: 'verified', source: SRC } })));
  ok('model3d format lạ', /model3d\.format/.test(err({ ...base(), model3d: { payloadRef: 'x', format: 'max', source: SRC } })));
  ok('model3d upAxis lạ', /upAxisDeclared/.test(err({ ...base(), model3d: { payloadRef: 'x', format: 'glb', upAxisDeclared: 'X', source: SRC } })));
  ok('glbBase64 không phải base64', /base64/.test(err({ ...base(), model3d: { payloadRef: 'x', format: 'glb', source: SRC, glbBase64: '###' } })));
  ok('lod sai shape', /lod\[0\]/.test(err({ ...base(), lod: [{ level: 'a' }] })));
  ok('pbr sai shape', /pbr phải là/.test(err({ ...base(), pbr: { value: 'x' } })));
}

console.log('parseCandidate — hợp lệ + đi tiếp normalize');
{
  const glb = buildBoxGlb({ wMm: 600, dMm: 600, hMm: 750 });
  const r = parseCandidate({
    ...base(),
    dims: { wMm: { value: 600, flag: 'verified', source: SRC }, dMm: { value: 600, flag: 'verified', source: SRC }, hMm: { value: 750, flag: 'verified', source: SRC } },
    model3d: { payloadRef: 'https://brand.example/c.glb', format: 'glb', source: SRC, upAxisDeclared: 'Y', glbBase64: Buffer.from(glb).toString('base64') },
    preview: { payloadRef: 'https://brand.example/c.jpg', flag: 'verified', source: SRC, wPx: 800, hPx: 600 },
    catalog: { brand: 'B', sku: 'C1', productUrl: SRC, ignoreMe: 1 },
    tags: ['x', '', 3, ' y '],
    attachToAssetId: ' asset1 ',
    unknownField: { deep: true },
  });
  ok('ok', r.ok);
  if (r.ok) {
    ok('contentHash hạ chữ thường', r.candidate.origin.contentHash === 'a'.repeat(64));
    ok('glb giải mã đúng byte', r.candidate.model3d?.glb?.byteLength === glb.byteLength);
    ok('tags lọc rỗng/không chuỗi + trim', JSON.stringify(r.candidate.tags) === '["x","y"]');
    ok('attachToAssetId trim', r.attachToAssetId === 'asset1');
    ok('trường lạ bị bỏ qua', !('unknownField' in r.candidate) && !('ignoreMe' in (r.candidate.catalog ?? {})));
    const fam = normalizeAssetFamily(r.candidate, { now: '2026-09-02T00:00:00.000Z' });
    ok('normalize: reference-only + 0 issue + model3d on-demand', fam.acquisition.tier === 'reference-only' && fam.issues.length === 0 && fam.representations.find((x) => x.kind === 'model3d')?.status === 'on-demand');
  }
  const noAttach = parseCandidate(base());
  ok('không attachToAssetId ⇒ không có khoá', noAttach.ok && !('attachToAssetId' in noAttach));
}

console.log('decodeGlbBase64');
{
  ok('rỗng ⇒ lỗi', !decodeGlbBase64('').ok);
  ok('tiền tố data: được cắt', decodeGlbBase64('data:model/gltf-binary;base64,' + Buffer.from('abcd').toString('base64')).ok);
  const big = 'A'.repeat(Math.ceil((GLB_MAX_BYTES + 1024) * 4 / 3));
  ok('vượt trần 25MB ⇒ từ chối trước khi giải mã', /quá/.test((() => { const d = decodeGlbBase64(big); return d.ok ? '' : d.error; })()));
}

console.log(`\n${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
