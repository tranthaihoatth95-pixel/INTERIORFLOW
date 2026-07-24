/**
 * lib/server/access.test.ts — ACCESS-CONTROL M1: test phần THUẦN (lib/server/access-policy.ts
 * — ROLES/ROLE_RANK/STAGE_OWNER/canEditStage/isProjectRole) + 2 hàm map client trong
 * lib/cad/store.ts (cadRoleFromProjectRole/cadStageFromProjectStage/shouldShowProTools).
 * Chạy: node_modules/.bin/sucrase-node lib/server/access.test.ts
 * (không đụng DB — assertProjectAccess/canAccessStage cần Prisma, verify qua curl API.)
 */
import {
  ROLES,
  ROLE_RANK,
  STAGE_OWNER,
  STAGES,
  canEditStage,
  isProjectRole,
  type ProjectRole,
} from './access-policy';
import {
  cadRoleFromProjectRole,
  cadStageFromProjectStage,
  shouldShowProTools,
} from '../cad/store';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

console.log('[1] ROLES + isProjectRole');
ok('đủ 5 role', ROLES.length === 5);
for (const r of ROLES) ok(`isProjectRole('${r}') → true`, isProjectRole(r));
ok("isProjectRole('admin') → false (không có role generic)", !isProjectRole('admin'));
ok('isProjectRole(null) → false', !isProjectRole(null));
ok("isProjectRole('') → false", !isProjectRole(''));

console.log('\n[2] ROLE_RANK — thứ bậc viewer < bim < drafter < crea < owner');
ok('viewer=0', ROLE_RANK.viewer === 0);
ok('bim < drafter', ROLE_RANK.bim < ROLE_RANK.drafter);
ok('drafter < crea', ROLE_RANK.drafter < ROLE_RANK.crea);
ok('crea < owner', ROLE_RANK.crea < ROLE_RANK.owner);

console.log('\n[3] STAGE_OWNER — relay 1-1 (BIGPICTURE §2: CREA → Hoạ viên → BIM)');
ok('concept → crea', STAGE_OWNER.concept === 'crea');
ok('render → drafter', STAGE_OWNER.render === 'drafter');
ok('present → bim', STAGE_OWNER.present === 'bim');

console.log('\n[4] canEditStage — bảng chân trị đầy đủ 5 role × 3 stage');
const TRUTH: Record<ProjectRole, Record<(typeof STAGES)[number], boolean>> = {
  owner:   { concept: true,  render: true,  present: true  },
  crea:    { concept: true,  render: false, present: false },
  drafter: { concept: false, render: true,  present: false },
  bim:     { concept: false, render: false, present: true  },
  viewer:  { concept: false, render: false, present: false },
};
for (const r of ROLES) {
  for (const s of STAGES) {
    ok(`${r} × ${s} → ${TRUTH[r][s]}`, canEditStage(r, s) === TRUTH[r][s]);
  }
}
ok("stage lạ ('xyz') → false với crea", !canEditStage('crea', 'xyz'));
ok("stage lạ ('xyz') → true với owner (owner full quyền)", canEditStage('owner', 'xyz'));

console.log('\n[5] cadRoleFromProjectRole — map server→client, fallback backward-compat');
for (const r of ROLES) ok(`'${r}' giữ nguyên`, cadRoleFromProjectRole(r) === r);
ok("null → 'crea' (flow nháp không project = hành vi IF1 cũ)", cadRoleFromProjectRole(null) === 'crea');
ok("undefined → 'crea'", cadRoleFromProjectRole(undefined) === 'crea');
ok("'gibberish' → 'crea'", cadRoleFromProjectRole('gibberish') === 'crea');

console.log('\n[6] cadStageFromProjectStage — concept→sketch · render→technical · present→bim');
ok("'concept' → 'sketch'", cadStageFromProjectStage('concept') === 'sketch');
ok("'render' → 'technical'", cadStageFromProjectStage('render') === 'technical');
ok("'present' → 'bim'", cadStageFromProjectStage('present') === 'bim');
ok("null → 'sketch'", cadStageFromProjectStage(null) === 'sketch');
ok("'xyz' → 'sketch'", cadStageFromProjectStage('xyz') === 'sketch');

console.log('\n[7] shouldShowProTools — PRO_ONLY_TOOLS gate = role + đã-bàn-giao-chưa');
ok('owner thấy Pro mọi chặng (sketch)', shouldShowProTools('owner', 'sketch', 'sketch'));
ok('owner thấy Pro mọi chặng (bim)', shouldShowProTools('owner', 'bim', 'sketch'));
ok('drafter + technical (đã bàn giao render) → Pro', shouldShowProTools('drafter', 'technical', 'sketch'));
ok('drafter + sketch (CHƯA bàn giao) → không Pro', !shouldShowProTools('drafter', 'sketch', 'sketch'));
ok('crea + technical → không Pro (không phải trạm mình)', !shouldShowProTools('crea', 'technical', 'sketch'));
ok('bim + bim → Pro', shouldShowProTools('bim', 'bim', 'sketch'));
ok('viewer không bao giờ Pro (trừ override)', !shouldShowProTools('viewer', 'bim', 'sketch'));
ok("override tay cadMode='pro' vẫn thắng (backward-compat)", shouldShowProTools('viewer', 'sketch', 'pro'));

console.log(`\n${pass} pass, ${fail} fail`);
if (fail > 0) process.exitCode = 1;
