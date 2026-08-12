/**
 * components/home/widgets/types.ts — [marker: DongStudio] shape JSON trả về từ
 * `GET /api/home/summary` (xem `app/api/home/summary/route.ts`) — dùng chung cho
 * `DongStudioHome.tsx` + mọi widget Trang 2, tránh khai lặp ở từng file.
 */

import type { Phase } from '@/lib/phases';

export interface HomeSummary {
  greeting: {
    dueTodayCount: number;
    recentProjectName: string | null;
  };
  today: {
    tasksDoneToday: number;
    online: { id: string; name: string }[];
    recentProject: { id: string; name: string } | null;
  };
  recentProjects: { id: string; name: string }[];
  stageChart: {
    phase: Phase;
    label: string;
    labelEn: string;
    projects: number;
    openTasks: number;
  }[];
  activityDays: { date: string; count: number }[];
  news: {
    id: string;
    type: 'task-done' | 'flow-updated';
    text: string;
    at: string;
    projectId: string | null;
  }[];
  upcoming: {
    date: string;
    items: {
      id: string;
      title: string;
      projectId: string;
      projectName: string | null;
      dueAt: string | null;
      stage: Phase | null;
    }[];
  }[];
  ambientImage: { url: string } | null;
}
