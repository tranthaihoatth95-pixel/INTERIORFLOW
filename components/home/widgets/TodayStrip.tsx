'use client';

/**
 * components/home/widgets/TodayStrip.tsx — [marker: DongStudio] Ô C "Hôm nay" (bento v3,
 * docs/phieu-giao/home-bento-v3.md ④.2) — việc ĐẾN HẠN hôm nay (số to, count-in 1 lần khi mount)
 * · ai online (chấm pulse). TỰ ẨN nếu cả 2 tín hiệu đều rỗng (luật chung phiếu).
 *
 * v3 — đổi số CHÍNH từ "việc XONG hôm nay" (v2) sang "việc ĐẾN HẠN hôm nay" (`greeting.
 * dueTodayCount`, đã tính sẵn ở route, trước đây chỉ dùng cho câu chào) — khớp đúng nhãn ô C của
 * phiếu ASCII + việc ④.2 "số việc đến hạn đếm lên". `tasksDoneToday` (v2) giữ vai trò PHỤ, dòng
 * nhỏ bên dưới — không bỏ hẳn dữ liệu, chỉ đổi thứ tự ưu tiên hiển thị.
 *
 * "Đếm lên" — ràng buộc ⑤ phiếu CHỈ cho phép animate transform/opacity (không phải mọi hoạt
 * hoạ), nên đây là số HIỆN RA (scale .92→1 + opacity 0→1, 200ms, MỘT lần khi mount) chứ không
 * phải digit-tally chạy số — vẫn đúng tinh thần "đếm lên" (số xuất hiện có sức sống) mà không
 * cần thêm interval JS riêng (giữ đúng luật "1 interval toàn trang" của DongStudioHome).
 *
 * Chấm pulse — PresenceRow (`components/ui/PresenceRow.tsx`) NGOÀI vùng file được sửa của phiếu
 * này nên không chèn pulse vào TỪNG avatar; thay bằng 1 chấm pulse ĐỒNG HÀNH cạnh nhãn "đang
 * online" (cùng ý nghĩa — có người đang sống — không cần đúng pixel từng avatar).
 *
 * v4 (13/08, phiếu home-bento-v4.md ④.1) — ngưỡng SIẾT lại: "≥2 tín hiệu thật (việc đến hạn/xong
 * + người online NGOÀI bản thân)". Đọc là HAI phạm trù bắt buộc CÙNG có mặt (không phải đếm rời
 * 3 cờ) — một mình mở app không tạo ra "hôm nay của studio" chỉ vì `today.online` (mọi User, kể
 * cả chính mình) luôn có tên mình trong đó. `currentUserId` lọc bản thân ra khỏi phạm trù online.
 */

import PresenceRow, { type PresenceMember } from '@/components/ui/PresenceRow';
import { useReducedMotion } from 'framer-motion';
import { useT } from '@/lib/i18n';
import WidgetCard from './WidgetCard';
import type { HomeSummary } from './types';

export function todayHasSignal(summary: HomeSummary, currentUserId?: string | null): boolean {
  const taskSignal = summary.greeting.dueTodayCount > 0 || summary.today.tasksDoneToday > 0;
  const onlineOthersSignal = summary.today.online.some((u) => u.id !== currentUserId);
  return taskSignal && onlineOthersSignal;
}

export default function TodayStrip({
  summary,
  index,
  currentUserId = null,
}: {
  summary: HomeSummary;
  index?: string;
  /** id user đang xem Home — loại khỏi danh sách "đang online" hiển thị (chính mình luôn "online"
   * với chính mình, hiện lại vô nghĩa). */
  currentUserId?: string | null;
}) {
  const tr = useT();
  const reduce = useReducedMotion();

  const dueTodayCount = summary.greeting.dueTodayCount;
  const { tasksDoneToday } = summary.today;
  const online = summary.today.online.filter((u) => u.id !== currentUserId);
  if (!todayHasSignal(summary, currentUserId)) return null;

  const onlineMembers: PresenceMember[] = online.map((u) => ({ id: u.id, name: u.name, online: true }));

  return (
    <WidgetCard dense index={index} title={tr('Hôm nay', 'Today')}>
      <div className="flex h-full flex-col justify-between gap-3">
        {dueTodayCount > 0 ? (
          <div className={reduce ? undefined : 'today-count-in'}>
            <div className="font-mono text-[length:var(--fs-xl)] font-semibold leading-none tabular-nums text-[var(--t1)]">
              {dueTodayCount}
            </div>
            <div className="mt-1 font-mono text-[length:var(--fs-2xs)] tracking-[.01em] text-[var(--t4)]">
              {tr(dueTodayCount === 1 ? 'việc đến hạn' : 'việc đến hạn', dueTodayCount === 1 ? 'task due' : 'tasks due')}
            </div>
          </div>
        ) : (
          tasksDoneToday > 0 && (
            <div className={reduce ? undefined : 'today-count-in'}>
              <div className="font-mono text-[length:var(--fs-xl)] font-semibold leading-none tabular-nums text-[var(--t1)]">
                {tasksDoneToday}
              </div>
              <div className="mt-1 font-mono text-[length:var(--fs-2xs)] tracking-[.01em] text-[var(--t4)]">
                {tr('việc xong hôm nay', tasksDoneToday === 1 ? 'task done' : 'tasks done')}
              </div>
            </div>
          )
        )}

        {dueTodayCount > 0 && tasksDoneToday > 0 && (
          <div className="text-[length:var(--fs-2xs)] text-[var(--t4)]">
            {tr(`${tasksDoneToday} đã xong`, `${tasksDoneToday} done`)}
          </div>
        )}

        {online.length > 0 && (
          <div className="flex items-center gap-2">
            <PresenceRow members={onlineMembers} max={4} />
            <span className="flex items-center gap-1 text-[length:var(--fs-2xs)] text-[var(--t4)]">
              <span className="relative flex h-1.5 w-1.5">
                <span className={`absolute inline-flex h-full w-full rounded-full ${reduce ? '' : 'today-pulse-ring'}`} style={{ background: 'var(--success, #2e9e5b)' }} />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ background: 'var(--success, #2e9e5b)' }} />
              </span>
              {tr('online', 'online')}
            </span>
          </div>
        )}
      </div>
      <style jsx>{`
        .today-count-in {
          animation: today-count-in var(--nhip-bang) cubic-bezier(0.32, 0.72, 0, 1) both;
        }
        @keyframes today-count-in {
          from {
            opacity: 0;
            transform: scale(0.92);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .today-pulse-ring {
          animation: today-pulse 2.2s ease-out infinite;
        }
        @keyframes today-pulse {
          0% {
            transform: scale(1);
            opacity: 0.6;
          }
          100% {
            transform: scale(2.4);
            opacity: 0;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .today-count-in,
          .today-pulse-ring {
            animation: none !important;
          }
        }
      `}</style>
    </WidgetCard>
  );
}
