/**
 * lib/distill/assurance.test.ts — thang độ đảm bảo + provenance. Chạy:
 *   node_modules/.bin/sucrase-node lib/distill/assurance.test.ts
 */
import {
  ASSURANCE_GRADES,
  canTransition,
  fromBoqOverride,
  fromFfeConfidence,
  fromProductSpec,
  fromSemanticProvenance,
  fromTrangThaiNguon,
  isProvenanceConsistent,
  isProxyQuantity,
  isVerifiedQuantity,
  provenance,
  sanitizeProvenance,
  weakestAssurance,
  type AssuranceGrade,
} from './assurance';

let pass = 0;
let fail = 0;
function ok(name: string, cond: boolean) {
  if (cond) { pass++; console.log('  ok  -', name); }
  else { fail++; console.log('  FAIL-', name); }
}
function eq(name: string, a: unknown, b: unknown) {
  ok(`${name} (${JSON.stringify(a)} = ${JSON.stringify(b)})`, JSON.stringify(a) === JSON.stringify(b));
}

console.log('[1] năm nấc — đúng 3 đảm bảo / 2 proxy, không nấc nào lọt cả hai');
{
  eq('đủ 5 nấc theo đề bài', [...ASSURANCE_GRADES], ['declared', 'catalog-approved', 'user-override', 'inferred', 'unknown']);
  for (const g of ASSURANCE_GRADES) ok(`${g}: verified XOR proxy`, isVerifiedQuantity(g) !== isProxyQuantity(g));
  eq('lớp đảm bảo', ASSURANCE_GRADES.filter(isVerifiedQuantity), ['declared', 'catalog-approved', 'user-override']);
}

console.log('[2] LUẬT 1 — máy không bao giờ tự sinh nấc đảm bảo');
{
  const p = provenance('declared', { kind: 'machine', id: 'vision.measureobject' });
  eq('máy khai declared ⇒ hạ về inferred', p.grade, 'inferred');
  eq('máy khai user-override ⇒ inferred', provenance('user-override', { kind: 'machine' }, { by: 'u1' }).grade, 'inferred');
  eq('nguồn unknown khai declared ⇒ unknown', provenance('declared', { kind: 'unknown' }).grade, 'unknown');
  eq('user-override thiếu by ⇒ inferred', provenance('user-override', { kind: 'human' }).grade, 'inferred');
  eq('user-override có by ⇒ giữ', provenance('user-override', { kind: 'human', id: 'u1' }, { by: 'u1' }).grade, 'user-override');
  eq('máy khai inferred ⇒ giữ nguyên (đúng sự thật)', provenance('inferred', { kind: 'machine' }).grade, 'inferred');
  const consistent = { grade: 'declared' as const, source: { kind: 'document' as const, id: 'pf_1' } };
  ok('provenance nhất quán trả về CÙNG object (không clone thừa)', sanitizeProvenance(consistent) === consistent);
  ok('isProvenanceConsistent bắt grade lạ', !isProvenanceConsistent({ grade: 'xong' as AssuranceGrade, source: { kind: 'human' } }));
  eq('grade lạ ⇒ unknown', sanitizeProvenance({ grade: 'xong' as AssuranceGrade, source: { kind: 'human' } }).grade, 'unknown');
  eq('provenance giữ at/note khi có', provenance('declared', { kind: 'human' }, { at: '2026-09-02T00:00:00.000Z', note: 'x' }), {
    grade: 'declared', source: { kind: 'human' }, at: '2026-09-02T00:00:00.000Z', note: 'x',
  });
}

console.log('[3] LUẬT 2 — nâng từ proxy lên đảm bảo phải có người ký; hạ thì tự do');
{
  ok('inferred → declared KHÔNG by = từ chối', !canTransition('inferred', 'declared'));
  ok('inferred → declared by rỗng = từ chối', !canTransition('inferred', 'declared', { by: '  ' }));
  ok('inferred → declared có by = ok', canTransition('inferred', 'declared', { by: 'u1' }));
  ok('unknown → catalog-approved có by = ok', canTransition('unknown', 'catalog-approved', { by: 'u1' }));
  ok('declared → inferred (hạ) không cần by', canTransition('declared', 'inferred'));
  ok('declared → unknown (hạ) không cần by', canTransition('declared', 'unknown'));
  ok('cùng nấc luôn ok', canTransition('inferred', 'inferred'));
  ok('declared → user-override đổi chủ thể: cần by', !canTransition('declared', 'user-override'));
}

console.log('[4] LUẬT 3 — mắt xích yếu nhất');
{
  eq('rỗng ⇒ unknown', weakestAssurance([]), 'unknown');
  eq('có unknown ⇒ unknown', weakestAssurance(['declared', 'unknown', 'catalog-approved']), 'unknown');
  eq('có inferred ⇒ inferred', weakestAssurance(['declared', 'inferred']), 'inferred');
  eq('toàn đảm bảo có override ⇒ user-override', weakestAssurance(['declared', 'user-override', 'catalog-approved']), 'user-override');
  eq('declared + catalog ⇒ declared', weakestAssurance(['catalog-approved', 'declared']), 'declared');
  eq('toàn catalog ⇒ catalog-approved', weakestAssurance(['catalog-approved', 'catalog-approved']), 'catalog-approved');
}

console.log('[5] adapter TrangThaiNguon (DNA/Distill/truthLevel)');
{
  eq('measured', fromTrangThaiNguon('measured'), 'declared');
  eq('inferred', fromTrangThaiNguon('inferred'), 'inferred');
  eq('verified + nguồn manual ⇒ override', fromTrangThaiNguon('verified', ['manual']), 'user-override');
  eq('verified + nguồn asset ⇒ declared', fromTrangThaiNguon('verified', ['asset_1']), 'declared');
  eq('chuỗi lạ (truthLevel tự do) ⇒ unknown', fromTrangThaiNguon('ok'), 'unknown');
  eq('null ⇒ unknown', fromTrangThaiNguon(null), 'unknown');
}

console.log('[6] adapter FfeConfidence + FfeSource');
{
  eq('measured', fromFfeConfidence('measured', 'vision'), 'declared');
  eq('inferred', fromFfeConfidence('inferred', 'vision'), 'inferred');
  eq('manual sửa số máy đo ⇒ user-override', fromFfeConfidence('manual', 'vision'), 'user-override');
  eq('manual sửa số bảng nhập ⇒ user-override', fromFfeConfidence('manual', 'import'), 'user-override');
  eq('manual + source manual ⇒ declared (không có gì để đè)', fromFfeConfidence('manual', 'manual'), 'declared');
  eq('thiếu confidence, vision ⇒ inferred', fromFfeConfidence(undefined, 'vision'), 'inferred');
  eq('thiếu confidence, import ⇒ declared', fromFfeConfidence(undefined, 'import'), 'declared');
  eq('thiếu confidence, library chưa duyệt ⇒ declared', fromFfeConfidence(undefined, 'library'), 'declared');
  eq('thiếu confidence, library đã duyệt ⇒ catalog-approved', fromFfeConfidence(undefined, 'library', true), 'catalog-approved');
  eq('thiếu cả hai ⇒ unknown', fromFfeConfidence(undefined, undefined), 'unknown');
}

console.log('[7] adapter SemanticProvenance / ProductSpec / BOQ override');
{
  eq('declared', fromSemanticProvenance('declared'), 'declared');
  eq('inferred', fromSemanticProvenance('inferred'), 'inferred');
  eq('derived (hình chiếu) ⇒ inferred, không vào BOQ', fromSemanticProvenance('derived'), 'inferred');
  eq('spec verified ⇒ catalog-approved', fromProductSpec({ verified: true }), 'catalog-approved');
  eq('spec chưa duyệt ⇒ declared', fromProductSpec({ verified: false }), 'declared');
  eq('spec null ⇒ unknown', fromProductSpec(null), 'unknown');
  eq('boq override ⇒ user-override', fromBoqOverride(), 'user-override');
}

console.log(`\n${pass} pass · ${fail} fail`);
if (fail > 0) process.exit(1);
