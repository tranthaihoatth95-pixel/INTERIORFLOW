/**
 * lib/tasks/focus-entity.test.ts — kiểm phần THUẦN của focus-entity (phiếu
 * focus-entity-2d-present ô⑥: tự viết test cho helper parse). Chạy:
 *   node_modules/.bin/sucrase-node lib/tasks/focus-entity.test.ts
 */
import { parseFocusEntity, suggestedTaskTitle, FOCUS_ENTITY_PARAM, TASK_BOARD_ROUTE } from './focus-entity';
import { buildTaskDeepLink } from './context';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.error(`  FAIL - ${label}`); }
}

console.log('[1] parseFocusEntity — các dạng đầu vào');
{
  ok('có ? đầu chuỗi', parseFocusEntity('?focusEntity=wall-7') === 'wall-7');
  ok('không có ?', parseFocusEntity('focusEntity=wall-7') === 'wall-7');
  ok('lẫn param khác', parseFocusEntity('?tab=1&focusEntity=e9&x=2') === 'e9');
  ok('decode %20 và %26', parseFocusEntity('?focusEntity=a%20b%26c') === 'a b&c');
  ok('thiếu param → null', parseFocusEntity('?tab=1') === null);
  ok('giá trị rỗng → null', parseFocusEntity('?focusEntity=') === null);
  ok('toàn khoảng trắng → null', parseFocusEntity('?focusEntity=%20%20') === null);
  ok('chuỗi rỗng → null', parseFocusEntity('') === null);
}

console.log('\n[2] round-trip với buildTaskDeepLink (context.ts) — link sinh ra thì đọc lại ĐÚNG id');
{
  const id = 'phòng khách/1 &2';
  const href = buildTaskDeepLink({ projectId: 'p1', stage: 'concept', entityId: id });
  ok('link có sinh', href !== null);
  const search = href!.split('?')[1] ?? '';
  ok('đọc lại đúng id gốc (kể cả ký tự cần encode)', parseFocusEntity(search) === id);
  ok('tên param khớp hằng dùng chung', href!.includes(`${FOCUS_ENTITY_PARAM}=`));
}

console.log('\n[3] suggestedTaskTitle — theo tên đối tượng/trang');
{
  ok('label thường', suggestedTaskTitle('PHÒNG KHÁCH', 'đối tượng 2D') === 'Xem lại PHÒNG KHÁCH');
  ok('label rỗng → fallback', suggestedTaskTitle('', 'Trang 3') === 'Xem lại Trang 3');
  ok('label toàn khoảng trắng → fallback', suggestedTaskTitle('   ', 'Trang 3') === 'Xem lại Trang 3');
  ok('gộp khoảng trắng thừa', suggestedTaskTitle('TƯỜNG   220  ', 'x') === 'Xem lại TƯỜNG 220');
  const long = 'A'.repeat(200);
  const t = suggestedTaskTitle(long, 'x');
  ok('label dài bị cắt + …', t.length <= 'Xem lại '.length + 72 && t.endsWith('…'));
}

console.log('\n[4] hằng route Bảng việc');
{
  ok('trỏ /tasks (app/tasks/page.tsx)', TASK_BOARD_ROUTE === '/tasks');
}

console.log(`\nfocus-entity.test: ${pass} pass · ${fail} fail`);
if (fail > 0) process.exit(1);
