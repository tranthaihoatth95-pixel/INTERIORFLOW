'use client';

/**
 * components/home/widgets/TodayStrip.tsx — [marker: DongStudio] "Hôm nay của studio"
 * (phiếu docs/phieu-giao/home-dong-studio.md, việc ④.5) — việc xong hôm nay · ai online.
 * TỰ ẨN nếu cả 2 tín hiệu đều rỗng (luật chung phiếu).
 *
 * v2 (13/08 home-dong-studio-v2.md ④.3 khử trùng sự kiện) — BỎ dòng "<dự án> vừa có cập nhật":
 * đo trên app thật thấy CÙNG một sự kiện Flow.updatedAt lặp ở 3 nơi (lời chào "vừa có chuyển
 * động" · đây "vừa có cập nhật" · NewsFeed "cập nhật mới 3 ngày trước") — 3 cách đọc giờ khác
 * nhau cho 1 sự thật, đúng bẫy NC-HOME-DELIGHT. Theo bảng ưu tiên của phiếu, "flow cập nhật"
 * không phải "online"/"chuyển-chặng" nên thuộc về NHÓM "còn lại" → chỉ sống ở `NewsFeed`, MỘT
 * chỗ. "dự án vừa CHUYỂN CHẶNG" (chữ gốc phiếu v1) vẫn KHÔNG CÓ NGUỒN THẬT — app chưa có bảng
 * ghi log đổi chặng (activity-feed CHƯA xây, xem STATUS.md 12/08 khuya "cụm ENGINE NEO NGỮ
 * CẢNH"), nên khi nguồn đó có thật, tín hiệu "chuyển chặng" mới quay lại đúng vị trí Dải này.
 */

import PresenceRow, { type PresenceMember } from '@/components/ui/PresenceRow';
import { useT } from '@/lib/i18n';
import WidgetCard from './WidgetCard';
import type { HomeSummary } from './types';

export default function TodayStrip({ summary }: { summary: HomeSummary }) {
  const tr = useT();

  const { tasksDoneToday, online } = summary.today;
  const hasSignal = tasksDoneToday > 0 || online.length > 0;
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
      </div>
    </WidgetCard>
  );
}
