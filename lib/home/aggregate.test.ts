/** Test `aggregate.ts` — chạy: node_modules/.bin/sucrase-node lib/home/aggregate.test.ts */
import {
  dayKey,
  countTasksDoneToday,
  countTasksDueToday,
  pickRecentProject,
  pickRecentProjects,
  buildStageCounts,
  buildActivityDays,
  buildNewsFeed,
  groupUpcoming,
  shouldShowActivityGrid,
  MIN_TOTAL_ACTIVITY_FOR_GRID,
  type TaskLite,
  type ProjectLite,
  type FlowLite,
  type ActivityDay,
} from './aggregate';

let pass = 0;
let fail = 0;
function ok(name: string, cond: boolean) {
  if (cond) { pass++; console.log('  ok  -', name); }
  else { fail++; console.log('  FAIL-', name); }
}
function eq(name: string, a: unknown, b: unknown) {
  ok(`${name} (${JSON.stringify(a)} = ${JSON.stringify(b)})`, JSON.stringify(a) === JSON.stringify(b));
}

const NOW = new Date(2026, 7, 13, 10, 0); // 13/08/2026 10:00 local

function task(over: Partial<TaskLite>): TaskLite {
  return {
    id: 't1',
    title: 'Việc',
    projectId: 'p1',
    dueAt: null,
    updatedAt: NOW.toISOString(),
    isDone: false,
    stage: null,
    workspaceId: null,
    ...over,
  };
}

console.log('dayKey() — giờ địa phương, không lệch qua UTC');
{
  eq('13/08 10:00 local', dayKey(new Date(2026, 7, 13, 10, 0).toISOString()), '2026-08-13');
  eq('ISO hỏng → rỗng', dayKey('not-a-date'), '');
}

console.log('countTasksDoneToday() — chỉ đếm Task ĐÃ XONG đúng ngày hôm nay');
{
  const tasks = [
    task({ id: 'a', isDone: true, updatedAt: NOW.toISOString() }),
    task({ id: 'b', isDone: true, updatedAt: new Date(2026, 7, 12, 9, 0).toISOString() }), // hôm qua
    task({ id: 'c', isDone: false, updatedAt: NOW.toISOString() }), // chưa xong
  ];
  eq('đúng 1 việc xong hôm nay', countTasksDoneToday(tasks, NOW), 1);
}

console.log('countTasksDueToday() — chỉ đếm việc CHƯA XONG có hạn hôm nay');
{
  const tasks = [
    task({ id: 'a', isDone: false, dueAt: NOW.toISOString() }),
    task({ id: 'b', isDone: true, dueAt: NOW.toISOString() }), // đã xong rồi, không tính
    task({ id: 'c', isDone: false, dueAt: null }), // không có hạn
  ];
  eq('đúng 1 việc đến hạn hôm nay', countTasksDueToday(tasks, NOW), 1);
}

console.log('pickRecentProject() — dự án của flow cập nhật GẦN NHẤT (cả id lẫn tên)');
{
  const projects: ProjectLite[] = [
    { id: 'p1', name: 'Detech Complex', currentStage: 'render' },
    { id: 'p2', name: 'HV Office', currentStage: 'concept' },
  ];
  const flows: FlowLite[] = [
    { id: 'f1', name: 'A', projectId: 'p1', updatedAt: new Date(2026, 7, 10).toISOString() },
    { id: 'f2', name: 'B', projectId: 'p2', updatedAt: new Date(2026, 7, 13).toISOString() },
    { id: 'f3', name: 'Nháp', projectId: null, updatedAt: new Date(2026, 7, 13, 12).toISOString() }, // không tính
  ];
  eq('chọn đúng p2 (mới nhất trong số CÓ dự án)', pickRecentProject(flows, projects), { id: 'p2', name: 'HV Office' });
  eq('không có flow nào có dự án → null', pickRecentProject([flows[2]], projects), null);
}

console.log('pickRecentProjects() — dedupe theo dự án, mới nhất trước, giới hạn limit');
{
  const projects: ProjectLite[] = [
    { id: 'p1', name: 'A', currentStage: 'render' },
    { id: 'p2', name: 'B', currentStage: 'render' },
  ];
  const flows: FlowLite[] = [
    { id: 'f1', name: 'A-flow1', projectId: 'p1', updatedAt: new Date(2026, 7, 1).toISOString() },
    { id: 'f2', name: 'A-flow2', projectId: 'p1', updatedAt: new Date(2026, 7, 12).toISOString() }, // p1 mới hơn f1
    { id: 'f3', name: 'B-flow', projectId: 'p2', updatedAt: new Date(2026, 7, 13).toISOString() },
  ];
  const r = pickRecentProjects(flows, projects, 6);
  eq('2 dự án, không lặp, p2 trước p1 (mới hơn)', r, [{ id: 'p2', name: 'B' }, { id: 'p1', name: 'A' }]);
  eq('limit=1 chỉ lấy 1', pickRecentProjects(flows, projects, 1).length, 1);
}

console.log('buildStageCounts() — đếm dự án theo currentStage + việc mở theo Task.stage');
{
  const projects: ProjectLite[] = [
    { id: 'p1', name: 'A', currentStage: 'render' },
    { id: 'p2', name: 'B', currentStage: 'render' },
    { id: 'p3', name: 'C', currentStage: 'present' },
  ];
  const tasks: TaskLite[] = [
    task({ id: 't1', stage: 'render', isDone: false }),
    task({ id: 't2', stage: 'render', isDone: true }), // xong rồi, không tính "mở"
    task({ id: 't3', stage: 'concept', isDone: false }),
    task({ id: 't4', stage: null, isDone: false }), // không gắn chặng
  ];
  const r = buildStageCounts(projects, tasks);
  eq('render: 2 dự án, 1 việc mở', r.render, { projects: 2, openTasks: 1 });
  eq('present: 1 dự án, 0 việc mở', r.present, { projects: 1, openTasks: 0 });
  eq('concept: 0 dự án, 1 việc mở', r.concept, { projects: 0, openTasks: 1 });
}

console.log('buildActivityDays() — trả đủ weeks*7 ngày liên tiếp, ngày trống vẫn có count=0');
{
  const tasks = [task({ id: 'a', isDone: true, updatedAt: NOW.toISOString() })];
  const days = buildActivityDays(tasks, [], NOW, 2);
  eq('đủ 14 ngày', days.length, 14);
  ok('ngày cuối = hôm nay', days[days.length - 1].date === dayKey(NOW.toISOString()));
  ok('ngày cuối count >= 1', days[days.length - 1].count >= 1);
  ok('có ngày count=0 (không tô đều)', days.some((d) => d.count === 0));
}

console.log('buildNewsFeed() — sự kiện trong cửa sổ ngày, mới nhất trước, tối đa limit, flow tự do bị loại');
{
  const names = new Map([['p1', 'Detech Complex']]);
  const tasks = [
    task({ id: 'a', isDone: true, updatedAt: new Date(2026, 7, 13, 8).toISOString(), title: 'A' }),
    task({ id: 'b', isDone: true, updatedAt: new Date(2026, 7, 1, 8).toISOString(), title: 'Quá cũ' }), // ngoài cửa sổ 7 ngày
  ];
  const flows: FlowLite[] = [
    { id: 'f1', name: 'F1', projectId: 'p1', updatedAt: new Date(2026, 7, 12).toISOString() },
    { id: 'f2', name: 'Nháp', projectId: null, updatedAt: new Date(2026, 7, 13).toISOString() }, // loại — chưa gắn dự án
  ];
  const news = buildNewsFeed(tasks, flows, names, NOW, { limit: 8, windowDays: 7 });
  eq('đúng 2 mục (loại việc quá cũ + flow tự do)', news.length, 2);
  ok('mục mới nhất đứng đầu', news[0].id === 'task:a');
}

console.log('buildNewsFeed() — không có sự kiện nào trong cửa sổ → mảng rỗng (component tự ẩn)');
{
  const news = buildNewsFeed([], [], new Map(), NOW, {});
  eq('rỗng', news, []);
}

console.log('groupUpcoming() — CHỈ hiện ngày có mốc (DayTicker), bỏ ngày trống, sắp xếp theo ngày rồi giờ');
{
  const tasks: TaskLite[] = [
    task({ id: 'a', dueAt: new Date(2026, 7, 15, 14).toISOString(), title: 'chiều' }),
    task({ id: 'b', dueAt: new Date(2026, 7, 15, 9).toISOString(), title: 'sáng' }),
    task({ id: 'c', dueAt: new Date(2026, 7, 20).toISOString(), title: 'xa hơn' }),
    task({ id: 'd', dueAt: new Date(2026, 8, 30).toISOString(), title: 'quá xa, ngoài 14 ngày' }),
    task({ id: 'e', isDone: true, dueAt: new Date(2026, 7, 15).toISOString(), title: 'đã xong, không tính' }),
  ];
  const groups = groupUpcoming(tasks, NOW, 14);
  eq('2 ngày có mốc (không phải ngày trống nào)', groups.length, 2);
  eq('ngày đầu đúng thứ tự việc trong ngày (sáng trước chiều)', groups[0].items.map((t) => t.id), ['b', 'a']);
}

console.log('shouldShowActivityGrid() — ngưỡng ≥30 hoạt động HOẶC ≥4 tuần có hoạt động (v2 lỗi #5)');
{
  const flat = (counts: number[]): ActivityDay[] => counts.map((count, i) => ({ date: `d${i}`, count }));

  // Đúng ca báo lỗi thật: "16 hoạt động/10 tuần", dồn hết vào 2 tuần đầu → CHƯA đủ dày.
  // Tuần 0 (index 0-6): 7 hoạt động (1/ngày) · tuần 1 (index 7-13): 9 hoạt động (vài ngày 2) → tổng 16.
  const week2counts = [2, 2, 1, 1, 1, 1, 1]; // sum = 9
  const days16in2weeks: ActivityDay[] = [...Array(70)].map((_, i) => ({
    date: `d${i}`,
    count: i < 7 ? 1 : i < 14 ? week2counts[i - 7] : 0,
  }));
  eq('tổng đúng 16', days16in2weeks.reduce((s, d) => s + d.count, 0), 16);
  ok('16 hoạt động dồn 2 tuần → ẨN (dưới cả 2 ngưỡng)', shouldShowActivityGrid(days16in2weeks) === false);

  ok('0 hoạt động → ẨN', shouldShowActivityGrid(flat(new Array(70).fill(0))) === false);

  const days30: ActivityDay[] = [{ date: 'a', count: 30 }, ...flat(new Array(69).fill(0))];
  ok('≥30 tổng (dù dồn 1 ngày) → HIỆN', shouldShowActivityGrid(days30) === true);

  // 4 tuần rải rác, mỗi tuần chỉ 2 hoạt động (tổng 8, dưới ngưỡng tổng) → vẫn HIỆN nhờ ≥4 tuần.
  const spread4weeks: ActivityDay[] = [...Array(70)].map((_, i) => ({
    date: `d${i}`,
    count: [0, 7, 14, 21].includes(i) ? 2 : 0,
  }));
  ok('tổng thấp (8) nhưng đủ 4 tuần', spread4weeks.reduce((s, d) => s + d.count, 0) < MIN_TOTAL_ACTIVITY_FOR_GRID);
  ok('4 tuần rải rác → HIỆN (đủ nấc "bền", dù tổng thấp)', shouldShowActivityGrid(spread4weeks) === true);

  const spread3weeks: ActivityDay[] = [...Array(70)].map((_, i) => ({
    date: `d${i}`,
    count: [0, 7, 14].includes(i) ? 2 : 0,
  }));
  ok('chỉ 3 tuần rải rác → ẨN (chưa đủ 4)', shouldShowActivityGrid(spread3weeks) === false);
}

console.log(`\n${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
