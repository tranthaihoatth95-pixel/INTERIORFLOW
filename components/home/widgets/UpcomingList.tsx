'use client';

/**
 * components/home/widgets/UpcomingList.tsx — [marker: DongStudio] "Lịch/mốc 2 tuần tới"
 * (phiếu docs/phieu-giao/home-dong-studio.md, việc ④.10) — kiểu DayTicker (Fantastical, NC
 * nguyên tắc #3): CHỈ hiện ngày CÓ mốc, bỏ hẳn ngày trống — không vẽ 14 ô đều tăm tắp.
 */

import { useRouter } from 'next/navigation';
import { useT, useLang } from '@/lib/i18n';
import WidgetCard from './WidgetCard';
import { goToProjectStage } from './nav';
import type { HomeSummary } from './types';

function fmtDayHeader(iso: string, en: boolean): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  const weekday = d.toLocaleDateString(en ? 'en-US' : 'vi-VN', { weekday: 'short' });
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return en ? `${weekday} ${dd}/${mm}` : `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)} ${dd}/${mm}`;
}

export default function UpcomingList({ summary }: { summary: HomeSummary }) {
  const tr = useT();
  const lang = useLang();
  const router = useRouter();
  const days = summary.upcoming;
  if (days.length === 0) return null;

  return (
    <WidgetCard title={tr('Sắp tới', 'Upcoming')}>
      <div className="flex gap-4 overflow-x-auto pb-1">
        {days.map((day) => (
          <div key={day.date} className="w-40 shrink-0">
            <div className="mb-1.5 text-[length:var(--fs-2xs)] font-semibold uppercase tracking-wide text-[var(--t4)]">
              {fmtDayHeader(day.date, lang === 'en')}
            </div>
            <ul className="space-y-1">
              {day.items.slice(0, 4).map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => goToProjectStage(router, t.projectId, t.stage)}
                    className="w-full truncate rounded-[var(--r-2)] px-2 py-1 text-left text-[length:var(--fs-xs)] text-[var(--t2)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--t1)]"
                    title={t.projectName ? `${t.title} · ${t.projectName}` : t.title}
                  >
                    {t.title}
                  </button>
                </li>
              ))}
              {day.items.length > 4 && (
                <li className="px-2 text-[length:var(--fs-2xs)] text-[var(--t4)]">
                  {tr(`+${day.items.length - 4} việc khác`, `+${day.items.length - 4} more`)}
                </li>
              )}
            </ul>
          </div>
        ))}
      </div>
    </WidgetCard>
  );
}
