/**
 * lib/idfc-import/license-gate.test.ts — cửa pháp lý: bốn bậc, luật cấm thắng mọi thứ, không đoán.
 * Chạy: node_modules/.bin/sucrase-node lib/idfc-import/license-gate.test.ts
 */
import { decideAcquisition, isLicenseVerified, type LicenseClaim } from './license-gate';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

const VERIFIED = { verifiedBy: 'hoa', verifiedAt: '2026-09-01T00:00:00Z', evidenceUrl: 'https://example.org/license' };

console.log('license-gate: xác minh ba vế');
{
  ok('đủ 3 vế ⇒ verified', isLicenseVerified({ id: 'CC0-1.0', ...VERIFIED }));
  ok('thiếu evidenceUrl ⇒ chưa', !isLicenseVerified({ id: 'CC0-1.0', verifiedBy: 'hoa', verifiedAt: '2026-09-01' }));
  ok('thiếu verifiedBy ⇒ chưa', !isLicenseVerified({ id: 'CC0-1.0', verifiedAt: '2026-09-01', evidenceUrl: 'x' }));
}

console.log('license-gate: luật ① cấm tái đóng gói thắng mọi thứ');
{
  const d = decideAcquisition('open-candidate', { id: 'CC0-1.0', ...VERIFIED, termsForbidRebundle: true });
  ok('CC0 đã xác minh nhưng terms cấm ⇒ blocked', d.tier === 'blocked');
  ok('blocked ⇒ pointer-only', d.geometryPolicy === 'reference-pointer-only');
  ok('có lý do', d.reasons.length === 1 && /cấm tái đóng gói/.test(d.reasons[0]));
  const u = decideAcquisition('user-upload', { id: 'unknown', termsForbidRebundle: true });
  ok('user-upload + terms cấm ⇒ vẫn blocked (marketplace tải về rồi upload không lách được)', u.tier === 'blocked');
}

console.log('license-gate: user-upload');
{
  const d = decideAcquisition('user-upload', { id: 'unknown' });
  ok('user-upload ⇒ user-import', d.tier === 'user-import');
  ok('user-import lưu dẫn xuất trong phạm vi user', d.geometryPolicy === 'store-derivatives');
  ok('không phải "redistributable"', d.tier !== ('redistributable' as string));
}

console.log('license-gate: manufacturer-reference');
{
  const base: LicenseClaim = { id: 'proprietary', sourceUrl: 'https://brand.example/chair' };
  ok('mặc định ⇒ reference-only', decideAcquisition('manufacturer-reference', base).tier === 'reference-only');
  ok('reference-only ⇒ metadata+thumb trước', decideAcquisition('manufacturer-reference', base).geometryPolicy === 'metadata-and-thumb-first');
  ok('khai explicit nhưng KHÔNG bằng chứng ⇒ vẫn reference-only', decideAcquisition('manufacturer-reference', { ...base, redistributionPermission: 'explicit' }).tier === 'reference-only');
  ok('explicit + bằng chứng nhưng chưa ai ký ⇒ vẫn reference-only', decideAcquisition('manufacturer-reference', { ...base, redistributionPermission: 'explicit', evidenceUrl: 'mail://ok' }).tier === 'reference-only');
  const full = decideAcquisition('manufacturer-reference', { ...base, redistributionPermission: 'explicit', ...VERIFIED });
  ok('explicit + bằng chứng + người ký ⇒ redistributable', full.tier === 'redistributable');
  ok('CC0 khai cho model hãng mà không có explicit ⇒ vẫn reference-only (nguồn quyết, không phải nhãn)', decideAcquisition('manufacturer-reference', { id: 'CC0-1.0', ...VERIFIED }).tier === 'reference-only');
}

console.log('license-gate: open-candidate');
{
  ok('CC0 chưa xác minh ⇒ reference-only', decideAcquisition('open-candidate', { id: 'CC0-1.0' }).tier === 'reference-only');
  ok('CC0 đã xác minh ⇒ redistributable', decideAcquisition('open-candidate', { id: 'CC0-1.0', ...VERIFIED }).tier === 'redistributable');
  ok('unknown đã "xác minh" ⇒ vẫn reference-only (không đoán)', decideAcquisition('open-candidate', { id: 'unknown', ...VERIFIED }).tier === 'reference-only');
  ok('proprietary ⇒ reference-only', decideAcquisition('open-candidate', { id: 'proprietary', ...VERIFIED }).tier === 'reference-only');
  ok('CC-BY-NC ⇒ reference-only (sản phẩm bán ra)', decideAcquisition('open-candidate', { id: 'CC-BY-NC-4.0', ...VERIFIED, attribution: 'a' }).tier === 'reference-only');
  ok('CC-BY thiếu attribution ⇒ reference-only', decideAcquisition('open-candidate', { id: 'CC-BY-4.0', ...VERIFIED }).tier === 'reference-only');
  const by = decideAcquisition('open-candidate', { id: 'CC-BY-4.0', ...VERIFIED, attribution: 'Tác giả A · CC-BY-4.0' });
  ok('CC-BY có attribution ⇒ redistributable + mustAttribute', by.tier === 'redistributable' && by.mustAttribute && !by.shareAlike);
  const sa = decideAcquisition('open-candidate', { id: 'CC-BY-SA-4.0', ...VERIFIED, attribution: 'x' });
  ok('CC-BY-SA ⇒ redistributable + shareAlike', sa.tier === 'redistributable' && sa.shareAlike);
  ok('MIT có attribution ⇒ redistributable', decideAcquisition('open-candidate', { id: 'MIT', ...VERIFIED, attribution: 'x' }).tier === 'redistributable');
}

console.log('license-gate: if-seed');
{
  ok('seed CC0 có biên lai ⇒ redistributable', decideAcquisition('if-seed', { id: 'CC0-1.0', ...VERIFIED }).tier === 'redistributable');
  ok('seed thiếu biên lai ⇒ reference-only', decideAcquisition('if-seed', { id: 'CC0-1.0' }).tier === 'reference-only');
}

console.log('license-gate: tất định');
{
  const a = JSON.stringify(decideAcquisition('open-candidate', { id: 'CC-BY-4.0', ...VERIFIED, attribution: 'x' }));
  const b = JSON.stringify(decideAcquisition('open-candidate', { id: 'CC-BY-4.0', ...VERIFIED, attribution: 'x' }));
  ok('cùng đầu vào cùng đầu ra', a === b);
}

console.log(`\n${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
