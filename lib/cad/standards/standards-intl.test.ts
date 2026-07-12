/**
 * lib/cad/standards/standards-intl.test.ts — kiểm cấu trúc DATA của bộ quy chuẩn mở rộng (PCCC
 * QCVN 06 có nguồn, biến thể quốc tế NFPA/IBC, tham số Neufert) + cơ chế lọc theo vùng/ràng buộc.
 * KHÔNG đụng checker.test.ts (rule-engine). Chạy:
 *   node_modules/.bin/sucrase-node lib/cad/standards/standards-intl.test.ts
 */
import {
  getAllRules, getRulesByRegion, getMandatoryRules, BUILTIN_GROUPS,
} from './registry';
import type { StandardRule } from './registry';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}
const byId = (id: string): StandardRule | undefined => getAllRules().find((r) => r.id === id);

console.log('\n[A] Nhóm Neufert đã đăng ký vào registry');
ok('BUILTIN_GROUPS có nhóm neufert', BUILTIN_GROUPS.some((g) => g.id === 'neufert'));
ok('getAllRules chứa rule neufert-*', getAllRules().some((r) => r.id.startsWith('neufert-')));

console.log('\n[B] Toàn vẹn dữ liệu (áp cho MỌI rule kể cả rule mới)');
const all = getAllRules();
ok('không id trùng lặp', new Set(all.map((r) => r.id)).size === all.length);
ok('mọi rule verified=false đều có note', all.filter((r) => !r.verified && !r.note).length === 0);
ok('mọi rule có region đều dùng giá trị hợp lệ',
  all.every((r) => r.region === undefined || ['VN', 'US', 'EU', 'INTL'].includes(r.region)));
ok('mọi rule có binding đều dùng giá trị hợp lệ',
  all.every((r) => r.binding === undefined || ['mandatory', 'adjustable', 'advisory'].includes(r.binding)));

console.log('\n[C] Lọc theo vùng — rule chung (không region, VD ISO) luôn xuất hiện ở mọi vùng');
const vn = getRulesByRegion('VN');
ok('vùng VN có rule vn-*', vn.some((r) => r.id.startsWith('vn-')));
ok('vùng VN KHÔNG lẫn rule region=US', !vn.some((r) => r.region === 'US'));
ok('vùng VN vẫn kèm rule chung ISO (region undefined)', vn.some((r) => r.id.startsWith('iso')));
const us = getRulesByRegion('US');
ok('vùng US có rule intl-egress region=US', us.some((r) => r.region === 'US' && r.id.startsWith('intl-egress')));
ok('vùng US KHÔNG lẫn rule region=VN', !us.some((r) => r.region === 'VN'));

console.log('\n[D] Lọc theo ràng buộc mandatory');
const mandVN = getMandatoryRules('VN');
ok('getMandatoryRules(VN) chỉ trả rule mandatory', mandVN.every((r) => r.binding === 'mandatory'));
ok('getMandatoryRules(VN) có rule PCCC bắt buộc', mandVN.some((r) => r.id.startsWith('vn-fire-')));

console.log('\n[E] PCCC QCVN 06 — trị số có nguồn đúng như đã tra');
const exitW = byId('vn-fire-exit-clear-width-min');
ok('lối ra thoát nạn rộng ≥ 800mm (QCVN 06 mục 3.2.5)', exitW?.params.minWidthMm === 800 && exitW?.verified === true);
const exitH = byId('vn-fire-exit-clear-height-min');
ok('lối ra thoát nạn cao ≥ 1900mm (đã tách rõ CAO ≠ RỘNG)', exitH?.params.minHeightMm === 1900 && exitH?.verified === true);
const corGen = byId('vn-fire-corridor-min-width-general');
ok('hành lang chung vẫn giữ 1000mm (checker phụ thuộc)', corGen?.params.minWidthMm === 1000);
const corF1 = byId('vn-fire-corridor-min-width-f1-over15');
ok('hành lang >15 người F1 ≥ 1200mm', corF1?.params.minWidthMm === 1200);

console.log('\n[F] Biến thể quốc tế NFPA/IBC — trị số quy đổi đúng');
const doorUS = byId('intl-egress-door-min-clear-width');
ok('cửa thoát nạn US ≥ 813mm (32in)', doorUS?.params.minClearWidthMm === 813 && doorUS?.verified === true);
const factor = byId('intl-egress-width-capacity-factor');
ok('hệ số cầu thang 7.62mm/người (0.3in)', factor?.params.stairFactorMmPerOccupant === 7.62);
ok('hệ số cấu kiện phẳng 5.08mm/người (0.2in)', factor?.params.levelFactorMmPerOccupant === 5.08);

console.log('\n[G] Neufert — tham số nhân trắc & ràng buộc adjustable');
const aisle = byId('neufert-kitchen-working-aisle');
ok('lối làm việc bếp Neufert 1200mm, binding=adjustable',
  aisle?.params.recommendedMm === 1200 && aisle?.binding === 'adjustable');
const circ1 = byId('neufert-circulation-one-person');
ok('lưu thông 1 người 750mm', circ1?.params.minWidthMm === 750);

console.log(`\n${pass} ok, ${fail} fail`);
if (fail > 0) process.exit(1);
