'use client';

/**
 * components/home/widgets/TodayStrip.tsx — [marker: DongStudio] "Hôm nay của studio"
 * (phiếu docs/phieu-giao/home-dong-studio.md, việc ④.5) — việc xong hôm nay · ai online ·
 * dự án vừa có chuyển động. TỰ ẨN nếu cả 3 tín hiệu đều rỗng (luật chung phiếu).
 *
 * "dự án vừa CHUYỂN CHẶNG" (chữ gốc trong phiếu) KHÔNG CÓ NGUỒN THẬT — app chưa có bảng ghi log
 * đổi chặng (activity-feed CHƯA xây, xem STATUS.md 12/08 khuya "cụm ENGINE NEO NGỮ CẢNH" — hàng
 * đợi). Nói thẳng ở đây thay vì bịa: dùng Flow.updatedAt ("vừa có cập nhật") — tín hiệu THẬT gần
 * nhất hiện có, không phải "chuyển chặng" cụ thể.
 */

import { useRouter } from 'next/navigation';
import PresenceRow, { type PresenceMember } from '@/components/ui/PresenceRow';
import { useT } from '@/lib/i18n';
import WidgetCard from './WidgetCard';
import { goToProjectStage } from './nav';
import type { HomeSummary } from './types';

export default function TodayStrip({ summary }: { summary: HomeSummary }) {
  const tr = useT();
  const router = useRouter();

  const { tasksDoneToday, online, recentProject } = summary.today;
  const hasSignal = tasksDoneToday > 0 || online.length > 0 || !!recentProject;
  if (!hasSignal) return null;

  const onlineMembers: PresenceMember[] = online.map((u) => ({ id: u.id, name: u.name, online: true }));

  return (
    <WidgetCard title={tr('Hôm nay của studio', "Today at the studio")}>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        {tasksDoneToday > 0 && (
          <div className="text-[length:var(--fs-sm)] text-[var(--t2)]">
            <span className="font-semibold text-[var(--t1)] tabular-nums">{tasksDoneToday}</span>{' '}
            {tr('việc xong hôm nay', tasksDoneToday === 1 ? 'task done today' : 'tasks done today')}
          </div>
        )}
        {online.length > 0 && (
          <div className="flex items-center gap-2">
            <PresenceRow members={onlineMembers} max={6} />
            <span className="text-[length:var(--fs-xs)] text-[var(--t4)]">
              {tr('đang online', 'online now')}
            </span>
          </div>
        )}
        {recentProject && (
          <button
            type="button"
            onClick={() => goToProjectStage(router, recentProject.id, null)}
            className="text-[length:var(--fs-sm)] text-[var(--t2)] underline-offset-2 hover:text-[var(--t1)] hover:underline"
          >
            {recentProject.name} · {tr('vừa có cập nhật', 'just updated')}
          </button>
        )}
      </div>
    </WidgetCard>
  );
}
