/**
 * components/home/widgets/types.ts — [marker: DongStudio] shape JSON trả về từ
 * `GET /api/home/summary` (xem `app/api/home/summary/route.ts`) — dùng chung cho
 * `DongStudioHome.tsx` + mọi widget Trang 2, tránh khai lặp ở từng file.
 */

import type { Phase } from '@/lib/phases';

export interface HomeSummary {
  greeting: {
    dueTodayCount: number;
  };
  /**
   * v2 (13/08 home-dong-studio-v2.md ④.3 khử trùng sự kiện): `recentProject`/`recentProjectName`
   * (Flow.updatedAt gần nhất) đã BỎ khỏi `greeting`/`today` — sự kiện đó là "còn lại" trong bảng
   * ưu tiên của phiếu (không phải đến-hạn, không phải online/chuyển-chặng) nên chỉ thuộc về
   * `news` (NewsFeed). Trước đó nó lặp ở CẢ BA nơi với 3 cách đọc giờ khác nhau — đúng lỗi #4.
   */
  today: {
    tasksDoneToday: number;
    online: { id: string; name: string }[];
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
