/**
 * lib/resume.test.ts — CONTINUITY-1 (19/08): "Mở lại" dội về Home.
 *
 * Bug: `ResumeTracker` đứng trên route scope dự án (`/projects/[id]/cad`…) chỉ ghi
 * `{ route }` — KHÔNG kèm id dự án. `buildResumeCard()` tính `routeId = currentProjectId ||
 * resume.flowId || null` ra `null` khi user vào thẳng URL/bookmark (currentProjectId chưa nạp
 * store) và resume trước đó chưa từng có flowId ⇒ `resumeHref()` rơi về route toàn cục cũ
 * ('/cad-editor') ⇒ `LegacyStageRedirect` tra lại cũng null ⇒ dội về `/?notice=choose-project`.
 *
 * Test thuần `computeResumePatch()` — không cần DOM/usePathname (sucrase-node), theo khuôn
 * `components/entry/StoreHydrator.test.ts`.
 *
 * Chạy: node_modules/.bin/sucrase-node lib/resume.test.ts
 */
import { computeResumePatch, RESUMABLE_ROUTES } from './resume';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) {
    pass += 1;
    console.log(`  ok  - ${label}`);
  } else {
    fail += 1;
    console.log(`  FAIL - ${label}`);
  }
}

console.log('computeResumePatch — route scope dự án PHẢI kèm flowId = project id từ URL');
{
  const patch = computeResumePatch('/projects/abc123/cad');
  ok('không null', patch !== null);
  ok("route ánh xạ đúng route toàn cục cũ ('/cad-editor')", patch?.route === '/cad-editor');
  ok('flowId = project id lấy từ URL (không phải undefined)', patch?.flowId === 'abc123');
}

console.log('computeResumePatch — chặng render (segment "render") ánh xạ route legacy = \'/\', bị loại (route \'/\' tự ghi ở nơi khác)');
{
  const patch = computeResumePatch('/projects/abc123/render');
  ok("trả null vì LEGACY_STAGE_ROUTE.render === '/'", patch === null);
}

console.log('computeResumePatch — chặng present/photo cũng kèm flowId đúng id, đúng encode');
{
  const p1 = computeResumePatch('/projects/du-an-01/present');
  ok("present → route '/present-editor'", p1?.route === '/present-editor');
  ok('present → flowId đúng', p1?.flowId === 'du-an-01');

  const p2 = computeResumePatch('/projects/du-an-02/photo');
  ok("photo → route '/photo-editor'", p2?.route === '/photo-editor');
  ok('photo → flowId đúng', p2?.flowId === 'du-an-02');

  // id có ký tự cần encode trong URL thật (%20…) — parseStageRoute decode lại, patch phải giữ
  // bản ĐÃ DECODE (đúng để so khớp Project.id thật trong DB, không phải chuỗi encode).
  const p3 = computeResumePatch('/projects/d%E1%BB%B1%20%C3%A1n/cad');
  ok('id encode trong URL được decode đúng trong flowId', p3?.flowId === 'dự án');
}

console.log("computeResumePatch — route '/' KHÔNG được ghi ở đây (app/page.tsx tự ghi riêng)");
{
  ok("route '/' → null", computeResumePatch('/') === null);
}

console.log('computeResumePatch — route studio cũ trực tiếp (không qua scope dự án) vẫn hoạt động như trước, KHÔNG có flowId');
{
  const patch = computeResumePatch('/cad-editor');
  ok("route '/cad-editor' hợp lệ", patch?.route === '/cad-editor');
  ok('không kèm flowId (không đứng trên scope dự án)', patch?.flowId === undefined);
}

console.log('computeResumePatch — route lạ/không thuộc RESUMABLE_ROUTES → null (không ghi rác)');
{
  ok("route lạ → null", computeResumePatch('/settings') === null);
  ok("route dự án không phải stage (vd /projects/x/overview) → null", computeResumePatch('/projects/x/overview') === null);
}

console.log('RESUMABLE_ROUTES vẫn phủ mọi route mà LEGACY_STAGE_ROUTE có thể ánh xạ tới (trừ \'/\')');
{
  const legacy = ['/cad-editor', '/present-editor', '/photo-editor'];
  ok('cả 3 route legacy nằm trong RESUMABLE_ROUTES', legacy.every((r) => (RESUMABLE_ROUTES as readonly string[]).includes(r)));
}

console.log(`\n${pass} pass, ${fail} fail`);
if (fail) process.exit(1);
