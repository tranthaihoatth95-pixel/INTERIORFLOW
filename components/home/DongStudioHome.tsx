'use client';

/**
 * components/home/DongStudioHome.tsx — [marker: DongStudio] Home "Dòng Studio" — dashboard
 * live, cuộn dọc 2 trang (phiếu docs/phieu-giao/home-dong-studio.md, việc ④; Hoà chốt 13/08:
 * Home = TỔNG QUAN, tiêu chí cảm nhận "người ta muốn trở về").
 *
 * NÂNG chứ không đập: `ProjectSelect` (toggle carousel/grid, tìm kiếm, card dự án đợt 3 —
 * ProjectProfile + PresenceRow + lastStage) mount NGUYÊN VẸN làm Tầng 2 "triển lãm" của Trang 1
 * — 2 prop mới `hideHeroCopy`/`hideVitalsBar` (additive, ProjectSelect.tsx) ẩn pill/tiêu đề/mô
 * tả cũ + thanh Vitals to, nhường chỗ cho ánh sáng-giờ-thật + lời chào dữ liệu thật + VitalsPill
 * ở đây. KHÔNG viết lại gallery/search/toggle — tránh vỡ 2318 dòng logic đã ổn định.
 *
 * TRANG 1 (viewport đầu) = Tầng 1 "tiếp tục" (dải ánh sáng mỏng: chào + tín hiệu thật) + Tầng 2
 * "triển lãm" (ProjectSelect). TRANG 2 (cuộn xuống) = 6 widget "studio đang thở", mỗi widget tự
 * ẩn khi thiếu dữ liệu (luật chung phiếu — trừ QuickNotes, ô gõ hữu ích cả khi chưa có gì).
 */

import { useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { ProjectSelect } from '@/components/ProjectSelect';
import { useFlowStore } from '@/lib/store';
import { useLang } from '@/lib/i18n';
import { timeOfDayNow } from '@/lib/home/time-of-day';
import { buildGreeting } from '@/lib/home/greeting';
import VitalsPill from './widgets/VitalsPill';
import TodayStrip from './widgets/TodayStrip';
import StageChart from './widgets/StageChart';
import ContributionGrid from './widgets/ContributionGrid';
import QuickNotes from './widgets/QuickNotes';
import NewsFeed from './widgets/NewsFeed';
import UpcomingList from './widgets/UpcomingList';
import type { HomeSummary } from './widgets/types';

export default function DongStudioHome({ onEnter }: { onEnter: () => void }) {
  const user = useFlowStore((s) => s.user);
  const en = useLang() === 'en';
  const reduce = useReducedMotion();
  const [summary, setSummary] = useState<HomeSummary | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/home/summary')
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (!cancelled && j) setSummary(j as HomeSummary);
      })
      .catch(() => {
        /* best-effort — Trang 2 rỗng, Trang 1 (ProjectSelect) vẫn chạy đầy đủ */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const tod = timeOfDayNow();
  const greeting = buildGreeting({
    name: user?.name ?? null,
    now: new Date(),
    en,
    dueTodayCount: summary?.greeting.dueTodayCount ?? 0,
    recentProjectName: summary?.greeting.recentProjectName ?? null,
  });
  const lightTextOnGradient = tod.textOnGradient === 'light';

  return (
    <div
      className="relative h-[100dvh] overflow-x-hidden overflow-y-auto"
      style={{ scrollSnapType: reduce ? undefined : 'y proximity' }}
      data-dong-studio=""
    >
      {/* Vitals thu về pill góc màn (④.3) — fixed, sống ở MỌI trang cuộn, không chiếm giữa màn. */}
      <VitalsPill />

      {/* ============ TRANG 1 · "nơi chốn" ============ */}
      <section className="relative w-full" style={{ scrollSnapAlign: 'start' }}>
        {/* Tầng 1 "tiếp tục" — ánh sáng theo giờ thật (④.1) + lời chào dữ liệu thật (④.2).
            Dải mỏng, KHÔNG chiếm cả Trang 1 — Tầng 2 (ProjectSelect ngay dưới) giữ nguyên lớp
            ambient-từ-ảnh-card riêng của nó (đã có, tinh vi hơn); dải này chỉ phủ phần TRÊN
            CÙNG, hoà mượt vào nền `var(--bg)` bằng lớp fade ở đáy. */}
        <div className="relative h-40 w-full overflow-hidden sm:h-48">
          <div className="absolute inset-0" style={{ background: tod.gradient }} aria-hidden />
          {summary?.ambientImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={summary.ambientImage.url}
              alt=""
              draggable={false}
              className="absolute inset-0 h-full w-full object-cover opacity-40 mix-blend-overlay"
              aria-hidden
            />
          )}
          <div
            className="absolute inset-x-0 bottom-0 h-16"
            style={{ background: 'linear-gradient(to bottom, transparent, var(--bg))' }}
            aria-hidden
          />
          <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
            <h1
              className="text-[length:var(--fs-lg)] font-semibold"
              // Chữ trên gradient động (không phải token) — CÙNG cơ chế adaptiveTextStyle của
              // ProjectSelect.tsx (chữ trên ảnh/gradient KHÔNG token hoá được, phải đo tương phản
              // trực tiếp). tod.textOnGradient đã tính sẵn nấc sáng/tối phù hợp từng khung giờ.
              style={{ color: lightTextOnGradient ? '#ffffff' : '#1a1a1a' }}
            >
              {greeting.headline}
            </h1>
            {greeting.signal && (
              <p
                className="mt-1 text-[length:var(--fs-sm)]"
                style={{ color: lightTextOnGradient ? 'rgba(255,255,255,0.82)' : 'rgba(20,20,20,0.72)' }}
              >
                {greeting.signal}
              </p>
            )}
          </div>
        </div>

        {/* Tầng 2 "triển lãm" — GIỮ NGUYÊN ProjectSelect (toggle carousel/grid, tìm kiếm, card
            dự án đợt 3). hideHeroCopy/hideVitalsBar cắt hero 2 dòng + thanh Vitals to cũ. */}
        <ProjectSelect onEnter={onEnter} hideHeroCopy hideVitalsBar />
      </section>

      {/* ============ TRANG 2 · "studio đang thở" ============ */}
      <section
        className="relative w-full px-4 py-10 sm:px-8"
        style={{ scrollSnapAlign: 'start', minHeight: '100dvh', background: 'var(--bg)' }}
      >
        <div className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-4 md:grid-cols-2">
          {summary && (
            <div className="md:col-span-2">
              <TodayStrip summary={summary} />
            </div>
          )}
          {summary && <StageChart summary={summary} />}
          {summary && <ContributionGrid summary={summary} />}
          {/* QuickNotes LUÔN render (không đợi summary) — ô gõ hữu ích cả khi chưa có dữ liệu
              nào khác; recentProjects rỗng thì widget tự bỏ dải chấm màu, vẫn còn ô gõ. */}
          <QuickNotes summary={summary ?? EMPTY_SUMMARY} />
          {summary && (
            <div className="md:col-span-2">
              <NewsFeed summary={summary} />
            </div>
          )}
          {summary && (
            <div className="md:col-span-2">
              <UpcomingList summary={summary} />
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

/** Shape rỗng hợp lệ — cho QuickNotes render ngay cả trước khi `/api/home/summary` trả lời
 * (chỉ QuickNotes cần trước; các widget khác đợi `summary` thật vì chúng tự ẩn khi rỗng). */
const EMPTY_SUMMARY: HomeSummary = {
  greeting: { dueTodayCount: 0, recentProjectName: null },
  today: { tasksDoneToday: 0, online: [], recentProject: null },
  recentProjects: [],
  stageChart: [],
  activityDays: [],
  news: [],
  upcoming: [],
  ambientImage: null,
};
