/**
 * lib/ai/tiers.test.ts — kiểm bảng giá `TASK_CREDIT_COST`/`costOfTask()` (vá R2,
 * `docs/AUDIT-BACKEND-2026-08-03.md` §5.2) — đối chiếu ĐỦ mọi `AiTask`, khớp đúng số `creditCost`
 * đã khai trong `lib/nodes/registry.ts`/`defs/*.ts` (đối chiếu tay 03/08, không suy đoán số mới).
 * Chạy: node_modules/.bin/sucrase-node lib/ai/tiers.test.ts
 */
import { AI_TASKS, type AiTask } from './models';
import { TASK_CREDIT_COST, INTERNAL_FREE_TASKS, costOfTask } from './tiers';

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

console.log('TASK_CREDIT_COST — đủ mọi AiTask, khớp đúng creditCost của node tương ứng (03/08)');
{
  const allTasks = Object.keys(AI_TASKS) as AiTask[];
  ok(`bảng giá phủ đủ ${allTasks.length} task (không thiếu task nào)`, allTasks.every((t) => t in TASK_CREDIT_COST));
  ok('không có key lạ ngoài AiTask thật', Object.keys(TASK_CREDIT_COST).every((k) => allTasks.includes(k as AiTask)));

  // Đối chiếu tay với creditCost đã khai ở node — xem lib/nodes/registry.ts + defs/*.ts.
  const expected: Record<AiTask, number> = {
    sketch2render: 4, // registry.ts ai.sketch2render
    clay2render: 4, // registry.ts ai.clay2render
    exterior: 4, // registry.ts ai.exterior
    styleTransfer: 3, // registry.ts ai.styletransfer
    staging: 3, // registry.ts ai.emptystaging
    moodboard: 2, // registry.ts ai.moodboard
    pattern: 3, // defs/pattern-warp.ts ai.pattern
    patternRef: 3, // defs/pattern-warp.ts ai.pattern (có reference)
    upscale: 2, // registry.ts ai.upscale
    materialSwap: 4, // registry.ts ai.materialswap
    furnitureEdit: 4, // registry.ts ai.furniture
    relight: 3, // registry.ts ai.relight
    removeBg: 1, // registry.ts ai.removebg / defs/render-v2.ts ai.furnitureextract
    segment: 1, // components/smartselect/SmartSelectModal.tsx (chưa có creditCost node — giá tối thiểu)
    image2video: 8, // registry.ts ai.image2video
    image2videoMaster: 8, // registry.ts ai.image2video (model Master)
    text2video: 8, // registry.ts ai.text2video
  };
  for (const t of allTasks) {
    ok(`giá "${t}" = ${expected[t]}`, costOfTask(t) === expected[t]);
  }

  ok('mọi giá đều > 0 (không có task "miễn phí ngầm" — R2 đóng đúng lỗ curl-thẳng)', allTasks.every((t) => costOfTask(t) > 0));
}

console.log('\ncostOfTask cờ internal — chốt giá 05/08: bước phụ trong luồng miễn phí, gọi trực tiếp tính tiền');
{
  // (giá khớp với thứ người dùng cảm thấy mình mua — họ mua MỘT tấm ảnh, không mua ba lượt gọi mô hình)
  const freeTasks: AiTask[] = ['removeBg', 'materialSwap', 'segment'];
  ok('INTERNAL_FREE_TASKS đúng 3 task đã chốt, không hơn', INTERNAL_FREE_TASKS.size === 3 && freeTasks.every((t) => INTERNAL_FREE_TASKS.has(t)));

  // Đường 1 — người dùng gọi TRỰC TIẾP (không cờ / internal:false): trừ đủ giá niêm yết.
  for (const t of freeTasks) {
    ok(`trực tiếp "${t}" (không opts) = ${TASK_CREDIT_COST[t]}`, costOfTask(t) === TASK_CREDIT_COST[t]);
    ok(`trực tiếp "${t}" (internal:false) = ${TASK_CREDIT_COST[t]}`, costOfTask(t, { internal: false }) === TASK_CREDIT_COST[t]);
  }

  // Đường 2 — luồng lớn gọi NỘI BỘ (internal:true): 3 task whitelist về 0.
  for (const t of freeTasks) {
    ok(`nội bộ "${t}" (internal:true) = 0`, costOfTask(t, { internal: true }) === 0);
  }

  // Chốt an toàn: cờ internal KHÔNG miễn phí được task NGOÀI whitelist — nếu không thì curl
  // `internal:true` mở lại toàn bộ lỗ R2 cho render/video đắt tiền.
  const others = (Object.keys(AI_TASKS) as AiTask[]).filter((t) => !freeTasks.includes(t));
  ok(
    `task ngoài whitelist (${others.length} task): internal:true vẫn trừ đủ giá`,
    others.every((t) => costOfTask(t, { internal: true }) === TASK_CREDIT_COST[t]),
  );
}

console.log(`\n${pass} pass, ${fail} fail`);
if (fail) process.exit(1);
