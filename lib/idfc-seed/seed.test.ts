/**
 * lib/idfc-seed/seed.test.ts — fixture tự tác: byte tất định, glbStats đọc đúng, seed đi đường
 * chuẩn hoá THẬT ra họ redistributable + round-trip .idfc + hộp bao khớp số khai.
 * Chạy: node_modules/.bin/sucrase-node lib/idfc-seed/seed.test.ts
 */
import { createHash } from 'crypto';
import { buildBoxGlb } from './fixture-glb';
import { buildSeedFamilies } from './seed';
import { SEED_BOXES, SEED_RECEIPT, seedLicenseClaim } from './receipt';
import { glbStats } from '../idfc-import/glb-stats';
import { importIdfc } from '../cad/idfc';
import { isLicenseVerified } from '../idfc-import/license-gate';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}
const sha = (b: Uint8Array) => createHash('sha256').update(b).digest('hex');

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

console.log(`\n${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
