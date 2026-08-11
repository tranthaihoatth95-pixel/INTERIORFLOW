/**
 * lib/tasks/context.test.ts — kiểm buildTaskDeepLink (TaskContext Link 11/08). Chạy:
 *   node_modules/.bin/sucrase-node lib/tasks/context.test.ts
 */
import { buildTaskDeepLink, STAGE_LABELS } from './context';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.error(`  FAIL - ${label}`); }
}

console.log('[1] thiếu ngữ cảnh → null (không bịa link)');
{
  ok('stage null → null', buildTaskDeepLink({ projectId: 'p1', stage: null, entityId: null }) === null);
  ok('stage null + entityId có → vẫn null (entity không đủ để biết chặng)',
    buildTaskDeepLink({ projectId: 'p1', stage: null, entityId: 'e9' }) === null);
  ok('projectId rỗng → null', buildTaskDeepLink({ projectId: '', stage: 'concept', entityId: null }) === null);
}

console.log('\n[2] stage → route đúng chặng (concept đi thư mục kỹ thuật /cad)');
{
  ok('concept → /projects/p1/cad', buildTaskDeepLink({ projectId: 'p1', stage: 'concept', entityId: null }) === '/projects/p1/cad');
  ok('render → /projects/p1/render', buildTaskDeepLink({ projectId: 'p1', stage: 'render', entityId: null }) === '/projects/p1/render');
  ok('present → /projects/p1/present', buildTaskDeepLink({ projectId: 'p1', stage: 'present', entityId: null }) === '/projects/p1/present');
}

console.log('\n[3] entityId → query focusEntity (thiếu thì link NGẮN hơn, không thêm query rỗng)');
{
  ok('có entityId → kèm ?focusEntity=',
    buildTaskDeepLink({ projectId: 'p1', stage: 'render', entityId: 'wall-7' }) === '/projects/p1/render?focusEntity=wall-7');
  ok('entityId cần encode', buildTaskDeepLink({ projectId: 'p1', stage: 'concept', entityId: 'a b&c' }) === '/projects/p1/cad?focusEntity=a%20b%26c');
  ok('projectId cần encode', buildTaskDeepLink({ projectId: 'p/x', stage: 'present', entityId: null }) === '/projects/p%2Fx/present');
}

console.log('\n[4] nhãn chặng — đúng bộ tên chốt 07/08');
{
  ok('concept = Thiết kế 2D', STAGE_LABELS.concept.vi === 'Thiết kế 2D');
  ok('render = Thiết kế 3D', STAGE_LABELS.render.vi === 'Thiết kế 3D');
  ok('present = Trình chiếu', STAGE_LABELS.present.vi === 'Trình chiếu');
}

console.log(`\n${pass} pass · ${fail} fail`);
if (fail > 0) process.exit(1);
