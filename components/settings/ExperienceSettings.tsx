'use client';

/**
 * components/settings/ExperienceSettings.tsx — nhóm "Trải nghiệm" của /settings (7.3.30,
 * 30/07, docs/TICKET-SETTINGS-GOM-CAU-HINH-2026-07-29.md §5). "Xem lại hướng dẫn" dời từ
 * Header MoreMenu + MobileMenu về đây (đổi 1 lần trong đời, đúng luật "chỉ Cài đặt" của
 * ticket §4) — LOGIC giữ nguyên 100%, chỉ đổi nơi gọi.
 *
 * Chỗ trống dành cho `7.3.27-29` (bật/tắt từng tầng chỉ dẫn) — chưa code.
 */

import { useRouter } from 'next/navigation';
import { RotateCcw } from 'lucide-react';
import { useFlowStore } from '@/lib/store';
import { requestGallery, resetTourDone, resetStageIntroSeen, ONBOARDING_STAGES, resetCoachmarkSeen, COACHMARKS } from '@/lib/resume';
import { useT } from '@/lib/i18n';

export function ExperienceSettings() {
  const router = useRouter();
  const tr = useT();

  /** Xoá cờ Tầng 1 (tourDone) + cả 3 cờ Tầng 2 (stageIntro) + mọi cờ Tầng 3 (coachmark) của
   * user hiện tại rồi về Gallery, để toàn bộ chuỗi onboarding chạy lại từ đầu. */
  const replayOnboarding = () => {
    const u = useFlowStore.getState().user;
    if (u) {
      resetTourDone(u.id);
      for (const stage of ONBOARDING_STAGES) resetStageIntroSeen(stage, u.id);
      for (const name of COACHMARKS) resetCoachmarkSeen(name, u.id);
    }
    requestGallery();
    router.push('/');
  };

  return (
    <section>
      <h2 className="text-[15px] font-semibold text-[var(--t1)]">{tr('Trải nghiệm', 'Experience')}</h2>

      <button
        type="button"
        onClick={replayOnboarding}
        className="mt-4 flex w-full items-center gap-2 rounded-[10px] border border-[var(--border)] px-3 py-2.5 text-[13px] text-[var(--t2)] transition-colors hover:bg-[var(--hover)]"
      >
        <RotateCcw size={14} />
        {tr('Xem lại hướng dẫn', 'Replay tutorial')}
      </button>
    </section>
  );
}
