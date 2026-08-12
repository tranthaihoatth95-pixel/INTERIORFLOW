/**
 * lib/home/aggregate.ts — [marker: DongStudio] tổng hợp THUẦN cho Trang 2 "studio đang thở"
 * (phiếu docs/phieu-giao/home-dong-studio.md, việc ④.5-10). Nhận dữ liệu ĐÃ FETCH sẵn (mảng
 * phẳng — route `app/api/home/summary/route.ts` là nơi DUY NHẤT chạy Prisma), trả cấu trúc
 * component vẽ thẳng. Không Date.now() ngầm — mọi hàm nhận `now` để test được xuyên múi giờ.
 *
 * Nguồn thật ăn theo: model Task (statusId→WorkflowState.isDone, stage, dueAt, updatedAt) ·
 * Project (currentStage) · Flow (updatedAt — "flow có revision mới"). KHÔNG có bảng ghi log
 * "dự án vừa chuyển chặng" (activity-feed CHƯA xây — xem STATUS.md 12/08 "cụm ENGINE NEO NGỮ
 * CẢNH") nên bảng tin studio dùng "flow cập nhật" làm tín hiệu chuyển động, KHÔNG bịa ra sự
 * kiện chuyển chặng không có bằng chứng (nói thẳng ở báo cáo ⑦, không âm thầm giả định).
 */

import type { Phase } from '../phases';

export interface TaskLite {
  id: string;
  title: string;
  projectId: string;
  dueAt: string | null;
  updatedAt: string;
  isDone: boolean;
  stage: Phase | null;
  workspaceId: string | null;
}

export interface ProjectLite {
  id: string;
  name: string;
  currentStage: Phase;
}

export interface FlowLite {
  id: string;
  name: string;
  projectId: string | null;
  updatedAt: string;
}

/** 'YYYY-MM-DD' theo giờ ĐỊA PHƯƠNG (không dùng toISOString — lệch ngày qua UTC gần nửa đêm). */
export function dayKey(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function isValidIso(iso: string | null | undefined): iso is string {
  return typeof iso === 'string' && !Number.isNaN(new Date(iso).getTime());
}

/** Số Task ĐÃ XONG có `updatedAt` rơi đúng ngày `now`. */
export function countTasksDoneToday(tasks: readonly TaskLite[], now: Date): number {
  const today = dayKey(now.toISOString());
  return tasks.filter((t) => t.isDone && dayKey(t.updatedAt) === today).length;
}

/** Số Task CHƯA XONG có `dueAt` rơi đúng ngày `now` — nguồn cho lời chào (greeting.ts). */
export function countTasksDueToday(tasks: readonly TaskLite[], now: Date): number {
  const today = dayKey(now.toISOString());
  return tasks.filter((t) => !t.isDone && isValidIso(t.dueAt) && dayKey(t.dueAt) === today).length;
}

/** Dự án của Flow cập nhật gần nhất (đã gán Project) — null nếu chưa có flow nào có dự án.
 * Trả cả `id` (để widget deep-link) lẫn `name` (để lời chào — lib/home/greeting.ts chỉ cần tên). */
export function pickRecentProject(
  flows: readonly FlowLite[],
  projects: readonly ProjectLite[],
): { id: string; name: string } | null {
  const byId = new Map(projects.map((p) => [p.id, p.name]));
  const withProject = flows.filter((f) => f.projectId && byId.has(f.projectId));
  if (withProject.length === 0) return null;
  const newest = [...withProject].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0];
  const id = newest.projectId as string;
  const name = byId.get(id);
  return name ? { id, name } : null;
}

/** Dự án "gần dùng" (deduped, mới nhất trước) — nguồn cho dải chấm màu QuickNotes (④.8). */
export function pickRecentProjects(
  flows: readonly FlowLite[],
  projects: readonly ProjectLite[],
  limit = 6,
): { id: string; name: string }[] {
  const byId = new Map(projects.map((p) => [p.id, p.name]));
  const sorted = [...flows]
    .filter((f) => f.projectId && byId.has(f.projectId))
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  const seen = new Set<string>();
  const out: { id: string; name: string }[] = [];
  for (const f of sorted) {
    const id = f.projectId as string;
    if (seen.has(id)) continue;
    seen.add(id);
    out.push({ id, name: byId.get(id) as string });
    if (out.length >= limit) break;
  }
  return out;
}

export interface StageCount {
  projects: number;
  openTasks: number;
}

/** Biểu đồ chặng — mỗi chặng: số dự án đang currentStage đó + số Task CHƯA XONG gắn stage đó. */
export function buildStageCounts(
  projects: readonly ProjectLite[],
  tasks: readonly TaskLite[],
): Record<Phase, StageCount> {
  const base = (): StageCount => ({ projects: 0, openTasks: 0 });
  const out: Record<Phase, StageCount> = { concept: base(), render: base(), present: base() };
  for (const p of projects) out[p.currentStage].projects += 1;
  for (const t of tasks) {
    if (t.stage && !t.isDone) out[t.stage].openTasks += 1;
  }
  return out;
}

export interface ActivityDay {
  date: string; // 'YYYY-MM-DD'
  count: number;
}

/**
 * Ngưỡng "đủ dày" để lưới tích luỹ đáng hiện (phiếu home-dong-studio-v2.md ④.4 lỗi #5 — đo
 * trên app thật: lưới hiện dù chỉ 16 hoạt động/10 tuần, trái luật widget-mỏng-tự-ẩn). Hằng số
 * đặt CỐ ĐỊNH ở đây (không rải trong component) để phiên sau chỉnh 1 chỗ.
 */
export const MIN_TOTAL_ACTIVITY_FOR_GRID = 30;
export const MIN_ACTIVE_WEEKS_FOR_GRID = 4;

/**
 * Studio đã "đủ dày" để lưới tích luỹ đáng một ô riêng trên Home — TỔNG hoạt động cao HOẶC trải
 * đều qua đủ tuần (một studio hoạt động rải rác 5 tuần dù mỗi tuần chỉ vài việc vẫn đáng hiện
 * hơn một studio dồn 29 việc vào đúng 1 ngày). `days` PHẢI theo đúng thứ tự thời gian liên tiếp
 * của `buildActivityDays` (index = ngày thứ mấy kể từ đầu cửa sổ) để gom tuần đúng.
 */
export function shouldShowActivityGrid(days: readonly ActivityDay[]): boolean {
  const total = days.reduce((s, d) => s + d.count, 0);
  if (total >= MIN_TOTAL_ACTIVITY_FOR_GRID) return true;
  const weeksWithActivity = new Set<number>();
  days.forEach((d, i) => {
    if (d.count > 0) weeksWithActivity.add(Math.floor(i / 7));
  });
  return weeksWithActivity.size >= MIN_ACTIVE_WEEKS_FOR_GRID;
}

/**
 * Lưới tích luỹ GitHub-graph — CẤM ngôn ngữ streak/phạt (luật ⑤ phiếu). Đếm sự kiện thật/ngày:
 * Task xong (updatedAt) + Flow cập nhật (updatedAt). Trả ĐỦ `weeks*7` ngày liên tiếp kết thúc ở
 * `now` (kể cả ngày count=0) để component vẽ lưới đều — khác `groupUpcoming` (nén ngày trống).
 */
export function buildActivityDays(
  tasks: readonly TaskLite[],
  flows: readonly FlowLite[],
  now: Date,
  weeks = 10,
): ActivityDay[] {
  const totalDays = weeks * 7;
  const counts = new Map<string, number>();
  for (const t of tasks) {
    if (!t.isDone) continue;
    const k = dayKey(t.updatedAt);
    if (k) counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  for (const f of flows) {
    const k = dayKey(f.updatedAt);
    if (k) counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  const out: ActivityDay[] = [];
  for (let i = totalDays - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const k = dayKey(d.toISOString());
    out.push({ date: k, count: counts.get(k) ?? 0 });
  }
  return out;
}

export interface NewsItem {
  id: string;
  type: 'task-done' | 'flow-updated';
  text: string;
  at: string;
  projectId: string | null;
}

/**
 * Bảng tin studio TỰ SINH — sự kiện thật gần đây (mặc định 7 ngày), mới nhất trước, tối đa
 * `limit`. KHÔNG có sự kiện nào → mảng rỗng, component TỰ ẨN CẢ KHỐI (luật chung phiếu).
 */
export function buildNewsFeed(
  tasks: readonly TaskLite[],
  flows: readonly FlowLite[],
  projectNameById: ReadonlyMap<string, string>,
  now: Date,
  opts: { limit?: number; windowDays?: number; en?: boolean } = {},
): NewsItem[] {
  const limit = opts.limit ?? 8;
  const windowMs = (opts.windowDays ?? 7) * 24 * 3600 * 1000;
  const en = !!opts.en;
  const cutoff = now.getTime() - windowMs;

  const items: NewsItem[] = [];
  for (const t of tasks) {
    if (!t.isDone) continue;
    const at = new Date(t.updatedAt).getTime();
    if (Number.isNaN(at) || at < cutoff || at > now.getTime()) continue;
    const pname = projectNameById.get(t.projectId) ?? null;
    items.push({
      id: `task:${t.id}`,
      type: 'task-done',
      text: en
        ? `“${t.title}” marked done${pname ? ` · ${pname}` : ''}`
        : `“${t.title}” đã xong${pname ? ` · ${pname}` : ''}`,
      at: t.updatedAt,
      projectId: t.projectId,
    });
  }
  for (const f of flows) {
    if (!f.projectId) continue; // flow tự do chưa gắn dự án — không đủ ngữ cảnh cho bảng tin
    const at = new Date(f.updatedAt).getTime();
    if (Number.isNaN(at) || at < cutoff || at > now.getTime()) continue;
    const pname = projectNameById.get(f.projectId) ?? null;
    items.push({
      id: `flow:${f.id}`,
      type: 'flow-updated',
      text: en ? `${pname ?? f.name} has a new update` : `${pname ?? f.name} vừa có cập nhật mới`,
      at: f.updatedAt,
      projectId: f.projectId,
    });
  }
  items.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  return items.slice(0, limit);
}

export interface UpcomingDay {
  date: string; // 'YYYY-MM-DD'
  items: TaskLite[];
}

/**
 * Lịch/mốc N ngày tới (mặc định 14) kiểu DayTicker — CHỈ hiện ngày CÓ mốc, bỏ ngày trống
 * (NC nguyên tắc #3, học Fantastical). Sắp xếp ngày tăng dần, việc trong ngày theo giờ tăng dần.
 */
export function groupUpcoming(tasks: readonly TaskLite[], now: Date, days = 14): UpcomingDay[] {
  const start = now.getTime();
  const end = start + days * 24 * 3600 * 1000;
  const byDay = new Map<string, TaskLite[]>();
  for (const t of tasks) {
    if (t.isDone || !isValidIso(t.dueAt)) continue;
    const at = new Date(t.dueAt).getTime();
    if (at < start || at > end) continue;
    const k = dayKey(t.dueAt);
    if (!byDay.has(k)) byDay.set(k, []);
    byDay.get(k)!.push(t);
  }
  const out: UpcomingDay[] = [...byDay.entries()]
    .map(([date, items]) => ({
      date,
      items: [...items].sort((a, b) => new Date(a.dueAt as string).getTime() - new Date(b.dueAt as string).getTime()),
    }))
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  return out;
}
