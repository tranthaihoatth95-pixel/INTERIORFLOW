/**
 * lib/input/stage-drop.test.ts — kiểm logic phân biệt cử chỉ trên thanh chặng:
 * click / trượt ngang = chuyển chặng như cũ · kéo XUỐNG vượt ngưỡng = gọi Vitals.
 * Chạy: node_modules/.bin/sucrase-node lib/input/stage-drop.test.ts
 */
import {
  createStageDragTracker,
  VITALS_DROP_THRESHOLD_PX,
  DRAG_SLOP_PX,
} from './stage-drop';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

console.log('Click thường — run tay dưới slop KHÔNG kích hoạt gì');
{
  const t = createStageDragTracker();
  ok('nhích 2px xuống → pending', t.move(0, 2) === 'pending');
  ok('nhích 3px chéo → pending', t.move(2, 3) === 'pending');
  ok('progress còn rất nhỏ', t.progress() < 0.2);
}

console.log('Kéo XUỐNG vượt ngưỡng → vitals');
{
  const t = createStageDragTracker();
  ok('10px xuống → pending', t.move(0, 10) === 'pending');
  ok('progress tăng dần', t.progress() > 0.2 && t.progress() < 1);
  ok('20px xuống → pending (chưa tới ngưỡng)', t.move(1, 20) === 'pending');
  ok(`${VITALS_DROP_THRESHOLD_PX}px xuống → vitals`, t.move(2, VITALS_DROP_THRESHOLD_PX) === 'vitals');
  ok('progress = 1 khi bắn', t.progress() === 1);
  ok('sau khi bắn giữ nguyên vitals', t.move(0, 50) === 'vitals');
}

console.log('Trượt NGANG (hành vi thanh chặng cũ) → locked, không bao giờ thành vitals');
{
  const t = createStageDragTracker();
  ok('12px ngang → locked', t.move(12, 1) === 'locked');
  ok('kéo tiếp xuống 40px VẪN locked (khoá tới hết cử chỉ)', t.move(12, 40) === 'locked');
  ok('progress = 0 khi locked', t.progress() === 0);
}

console.log('Kéo chéo 45° — trục dọc KHÔNG thắng rõ → không kích hoạt');
{
  const t = createStageDragTracker();
  const d = VITALS_DROP_THRESHOLD_PX + 4;
  const v = t.move(d, d); // 45°: dy không > dx*1.2
  ok('chéo 45° vượt ngưỡng → locked hoặc pending, KHÔNG vitals', v !== 'vitals');
}

console.log('Kéo chéo chủ yếu DỌC (dy thắng rõ) → vẫn vitals');
{
  const t = createStageDragTracker();
  ok('dx=8, dy=30 → vitals', t.move(8, 30) === 'vitals');
}

console.log('Kéo LÊN → locked');
{
  const t = createStageDragTracker();
  ok(`kéo lên ${DRAG_SLOP_PX}px → locked`, t.move(0, -DRAG_SLOP_PX) === 'locked');
  ok('quay đầu kéo xuống VẪN locked', t.move(0, 40) === 'locked');
}

console.log('Run tay dọc nhẹ rồi thả (không tới ngưỡng) → pending suốt, click vẫn là click');
{
  const t = createStageDragTracker();
  ok('5px xuống → pending', t.move(0, 5) === 'pending');
  ok('quay về 0 → pending', t.move(0, 0) === 'pending');
}

console.log(`\n${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
