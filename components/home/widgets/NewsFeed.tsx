'use client';

/**
 * components/home/widgets/NewsFeed.tsx — [marker: DongStudio] "Bảng tin studio TỰ SINH"
 * (phiếu docs/phieu-giao/home-dong-studio.md, việc ④.9) — card từ sự kiện THẬT gần đây (Task
 * xong, Flow cập nhật — `lib/home/aggregate.ts` `buildNewsFeed`, KHÔNG CMS, KHÔNG bảng event
 * mới). Trống → TỰ ẨN CẢ KHỐI (luật chung phiếu).
 */

import { useRouter } from 'next/navigation';
import { CheckCircle2, Sparkles } from 'lucide-react';
import { useT, useLang } from '@/lib/i18n';
import { timeAgo } from '@/lib/home/format-time';
import WidgetCard from './WidgetCard';
import { goToProjectStage } from './nav';
import type { HomeSummary } from './types';

export default function NewsFeed({ summary }: { summary: HomeSummary }) {
  const tr = useT();
  const lang = useLang();
  const router = useRouter();
  const items = summary.news;
  if (items.length === 0) return null;

  return (
    <WidgetCard title={tr('Bảng tin studio', 'Studio feed')}>
      <ul className="space-y-1.5">
        {items.map((n) => (
          <li key={n.id}>
            <button
              type="button"
              disabled={!n.projectId}
              onClick={() => n.projectId && goToProjectStage(router, n.projectId, null)}
              className="flex w-full items-start gap-2 rounded-[var(--r-2)] px-2 py-1.5 text-left transition-colors enabled:hover:bg-[var(--hover)] disabled:cursor-default"
            >
              {n.type === 'task-done' ? (
                <CheckCircle2 size={14} className="mt-0.5 shrink-0" style={{ color: 'var(--success, #2e9e5b)' }} />
              ) : (
                <Sparkles size={14} className="mt-0.5 shrink-0" style={{ color: 'var(--accent)' }} />
              )}
              <span className="min-w-0 flex-1 text-[length:var(--fs-sm)] text-[var(--t2)]">
                <span className="block truncate">{n.text}</span>
                <span className="text-[length:var(--fs-2xs)] text-[var(--t4)]">{timeAgo(n.at, lang === 'en')}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </WidgetCard>
  );
}
