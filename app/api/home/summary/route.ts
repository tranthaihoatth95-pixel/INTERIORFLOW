import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';
import { getSessionUser } from '@/lib/server/auth';
import { HIDDEN_NOTEBOOK_PREFIX } from '@/lib/notebook/resolveProject';
import { isTaskStage } from '@/lib/server/tasks';
import { PHASE_MAP, type Phase } from '@/lib/phases';
import {
  countTasksDoneToday,
  countTasksDueToday,
  pickRecentProject,
  pickRecentProjects,
  buildStageCounts,
  buildActivityDays,
  buildNewsFeed,
  groupUpcoming,
  type TaskLite,
  type ProjectLite,
  type FlowLite,
} from '@/lib/home/aggregate';

export const dynamic = 'force-dynamic';

/**
 * GET /api/home/summary — [marker: DongStudio] endpoint TỔNG HỢP cho Trang 1 (lời chào) + Trang
 * 2 (6 widget) của Home "Dòng Studio" (phiếu docs/phieu-giao/home-dong-studio.md, việc ④).
 *
 * Chỉ đọc — không ghi. Mọi phép tính "sự thật sống" (đếm/gom nhóm/lọc cửa sổ ngày) nằm ở
 * `lib/home/aggregate.ts` (THUẦN, có test) — route này CHỈ fetch Prisma rồi map sang shape
 * tối thiểu (TaskLite/ProjectLite/FlowLite) và gọi hàm thuần, tránh trộn logic-nghiệp-vụ vào
 * code có I/O (khó test).
 *
 * Phạm vi: dự án SỞ HỮU bởi user (userId=user.id) — CÙNG nguồn `/api/flows` (đã dùng cho Gallery
 * hôm nay), không mở rộng sang ProjectMember ở v1 (giữ nhất quán với card dự án đang hiển thị).
 */
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const ONLINE_MS = 45 * 1000; // đồng bộ ngưỡng "online" với /api/flows

  const [projectsRaw, flowsRaw, teamRaw] = await Promise.all([
    prisma.project.findMany({
      where: { userId: user.id, deletedAt: null, NOT: { name: { startsWith: HIDDEN_NOTEBOOK_PREFIX } } },
      select: { id: true, name: true, currentStage: true },
    }),
    prisma.flow.findMany({
      where: { userId: user.id, deletedAt: null },
      select: { id: true, name: true, projectId: true, updatedAt: true },
    }),
    prisma.user.findMany({ orderBy: { lastSeenAt: 'desc' }, select: { id: true, name: true, lastSeenAt: true } }),
  ]);

  const projects: ProjectLite[] = projectsRaw.map((p) => ({
    id: p.id,
    name: p.name,
    currentStage: (['concept', 'render', 'present'] as const).includes(p.currentStage as Phase)
      ? (p.currentStage as Phase)
      : 'concept',
  }));
  const projectIds = projects.map((p) => p.id);
  const projectNameById = new Map(projects.map((p) => [p.id, p.name]));

  const flows: FlowLite[] = flowsRaw.map((f) => ({
    id: f.id,
    name: f.name,
    projectId: f.projectId,
    updatedAt: f.updatedAt.toISOString(),
  }));

  const tasksRaw = projectIds.length
    ? await prisma.task.findMany({
        where: { projectId: { in: projectIds } },
        select: {
          id: true,
          title: true,
          projectId: true,
          dueAt: true,
          updatedAt: true,
          stage: true,
          status: { select: { isDone: true } },
        },
      })
    : [];
  const tasks: TaskLite[] = tasksRaw.map((t) => ({
    id: t.id,
    title: t.title,
    projectId: t.projectId,
    dueAt: t.dueAt ? t.dueAt.toISOString() : null,
    updatedAt: t.updatedAt.toISOString(),
    isDone: !!t.status?.isDone,
    stage: isTaskStage(t.stage) ? (t.stage as Phase) : null,
    workspaceId: null,
  }));

  const now = new Date();
  const nowMs = now.getTime();

  const online = teamRaw
    .filter((u) => nowMs - new Date(u.lastSeenAt).getTime() < ONLINE_MS)
    .map((u) => ({ id: u.id, name: u.name }));

  const stageCounts = buildStageCounts(projects, tasks);
  const stageChart = (['concept', 'render', 'present'] as Phase[]).map((phase) => ({
    phase,
    label: PHASE_MAP[phase].label,
    labelEn: PHASE_MAP[phase].labelEn,
    ...stageCounts[phase],
  }));

  // Ảnh render mới nhất (LibraryAsset) để làm nền ambient Trang 1 — best-effort, thiếu thì
  // component tự dùng gradient thuần (luật ④.1). Chỉ lấy ảnh, không lấy asset khác loại mime.
  const recentImage = await prisma.libraryAsset.findFirst({
    where: { userId: user.id, deletedAt: null, mime: { startsWith: 'image/' } },
    orderBy: { createdAt: 'desc' },
    select: { id: true },
  });

  const recentProject = pickRecentProject(flows, projects);

  return NextResponse.json({
    greeting: {
      dueTodayCount: countTasksDueToday(tasks, now),
      recentProjectName: recentProject?.name ?? null,
    },
    today: {
      tasksDoneToday: countTasksDoneToday(tasks, now),
      online,
      recentProject,
    },
    recentProjects: pickRecentProjects(flows, projects, 6),
    stageChart,
    activityDays: buildActivityDays(tasks, flows, now, 10),
    news: buildNewsFeed(tasks, flows, projectNameById, now, { limit: 8, windowDays: 7 }),
    upcoming: groupUpcoming(tasks, now, 14).map((day) => ({
      date: day.date,
      items: day.items.map((t) => ({
        id: t.id,
        title: t.title,
        projectId: t.projectId,
        projectName: projectNameById.get(t.projectId) ?? null,
        dueAt: t.dueAt,
        stage: t.stage,
      })),
    })),
    ambientImage: recentImage ? { url: `/api/library/${recentImage.id}/file` } : null,
  });
}
