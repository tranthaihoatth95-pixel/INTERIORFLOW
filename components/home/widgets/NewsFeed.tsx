'use client';

/**
 * components/home/widgets/NewsFeed.tsx — [marker: DongStudio] Ô I "Bảng tin studio TỰ SINH"
 * (bento v3, docs/phieu-giao/home-bento-v3.md ④.2) — card từ sự kiện THẬT gần đây (Task xong,
 * Flow cập nhật — `lib/home/aggregate.ts` `buildNewsFeed`, KHÔNG CMS, KHÔNG bảng event mới).
 * Trống → TỰ ẨN CẢ KHỐI (luật chung phiếu).
 *
 * v3 — "ticker dọc tự trượt chậm" (④.2 mục I): CSS `@keyframes translateY` thuần (KHÔNG JS
 * interval — không phạm luật "1 interval toàn trang" vì đây là hoạt hoạ CSS chạy trên compositor,
 * không đụng React state), pause khi hover (`animation-play-state`), danh sách nhân đôi để loop
 * liền mạch. Chỉ bật khi ≥4 tin (danh sách ngắn trượt vòng trông giật, đứng yên đọc dễ hơn).
 * `prefers-reduced-motion` → danh sách tĩnh (không animation, không duplicate — luật ⑤ phiếu).
 */

import { useRouter } from 'next/navigation';
import { useReducedMotion } from 'framer-motion';
import { CheckCircle2, Sparkles } from 'lucide-react';
import { useT, useLang } from '@/lib/i18n';
import { timeAgo } from '@/lib/home/format-time';
import WidgetCard from './WidgetCard';
import { goToProjectStage } from './nav';
import type { HomeSummary } from './types';

/**
 * Cùng lý do `todayHasSignal` (TodayStrip.tsx) — MỘT nơi định nghĩa "ô I có gì để hiện".
 * v4 (13/08, phiếu home-bento-v4.md ④.1) — ngưỡng SIẾT lại: "≥2 sự kiện 7 ngày" (1 sự kiện đơn
 * lẻ không đủ gọi là "bảng tin" — `buildNewsFeed` phía route đã tự giới hạn cửa sổ 7 ngày).
 */
export function newsHasSignal(summary: HomeSummary): boolean {
  return summary.news.length >= 2;
}

export default function NewsFeed({ summary, index }: { summary: HomeSummary; index?: string }) {
  const tr = useT();
  const lang = useLang();
  const router = useRouter();
  const reduce = useReducedMotion();
  const items = summary.news;
  if (!newsHasSignal(summary)) return null;

  const ticker = items.length >= 4 && !reduce;
  const durationS = Math.max(12, items.length * 5);

  const row = (n: HomeSummary['news'][number], key: string) => (
    <li key={key}>
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
  );

  return (
    <WidgetCard dense index={index} title={tr('Bảng tin studio', 'Studio feed')} bodyClassName="overflow-hidden">
      <div className="news-ticker-viewport h-full overflow-hidden">
        <ul className={`news-ticker-track space-y-1.5 ${ticker ? 'news-ticker-anim' : ''}`} style={{ animationDuration: `${durationS}s` }}>
          {items.map((n) => row(n, n.id))}
          {ticker && items.map((n) => row(n, `${n.id}__dup`))}
        </ul>
      </div>
      <style jsx>{`
        .news-ticker-anim {
          animation-name: news-ticker-scroll;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
        .news-ticker-viewport:hover .news-ticker-anim {
          animation-play-state: paused;
        }
        @keyframes news-ticker-scroll {
          from {
            transform: translateY(0);
          }
          to {
            transform: translateY(-50%);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .news-ticker-anim {
            animation: none !important;
            transform: none !important;
          }
        }
      `}</style>
    </WidgetCard>
  );
}
