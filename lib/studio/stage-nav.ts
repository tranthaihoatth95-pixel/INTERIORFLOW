/**
 * lib/studio/stage-nav.ts — logic điều hướng chặng DÙNG CHUNG giữa `AppChrome.tsx` (thanh đầu)
 * và `MobileMenu.tsx` (PhaseRow trong sheet mobile). Tách ra 30/07 khi hợp nhất Header+StudioBar
 * (docs/TICKET-STAGE-SWITCHER-NHAY-2026-07-30.md, phần mở rộng "hợp nhất thanh đầu") — trước đó
 * `MobileMenu.tsx` PhaseRow gọi thẳng `setWorkspace(p.id)`, ĐÚNG khi mount trong Header (ở lại
 * route `/`) nhưng SAI khi mount ở /cad·/present·/photo (đổi state mà KHÔNG đổi route → lệch
 * URL/store). Cùng 1 hàm cho cả 2 nơi gọi — không viết lại lần 2.
 */

import type { Phase } from '@/lib/phases';
import type { AppChromeActive } from '@/components/studio/AppChromeTypes';
import { stageHrefFrom } from '@/lib/project-scope';
import { stageSegmentForPhase } from '@/lib/scope-core';
import { stashPresentHandoffWithIds, deckImagesWithIdsFromNodes } from '@/lib/present-editor/handoff';
import { setLastStage } from '@/lib/shell/last-stage';
import { useFlowStore } from '@/lib/store';

export function activeToPhase(active: AppChromeActive): Phase {
  if (active === 'cad') return 'concept';
  if (active === 'photo') return 'render';
  if (active === 'present') return 'present';
  return 'render';
}

interface StageNavDeps {
  active: AppChromeActive;
  pathname: string | null;
  router: { push: (href: string) => void };
  begin: (p: Phase) => void;
}

/**
 * Điều hướng khi chọn chặng `p`, GIỮ NGUYÊN 2 hành vi gốc (Header cũ vs StudioBar cũ), chọn
 * theo `active` hiện tại — xem chú thích đầy đủ ở `AppChrome.tsx` (nơi định nghĩa hàm này lần
 * đầu, 30/07). Origin 'render': stash handoff khi → present, setWorkspace tại chỗ khi chọn lại
 * render. Origin cad/present/photo: samePane guard + ghi localStorage + stageHrefFrom.
 */
export function pickStage(p: Phase, { active, pathname, router, begin }: StageNavDeps): void {
  // [marker: lastStage] — điểm GHI duy nhất "chặng đang dở" per dự án (phiếu home-overview-card).
  // Ghi cả 2 khoá (Project.id + Flow.id) để card Gallery đọc bằng khoá nào cũng trúng;
  // ghi trước mọi nhánh (kể cả samePane — vẫn đúng là chặng đang đứng), best-effort localStorage.
  {
    const s = useFlowStore.getState();
    setLastStage(s.currentProjectId, p);
    setLastStage(s.currentFlowId, p);
  }
  if (active === 'render') {
    if (p === 'present') {
      begin('present');
      stashPresentHandoffWithIds(deckImagesWithIdsFromNodes(useFlowStore.getState().nodes));
      router.push(stageHrefFrom(pathname, 'present'));
    } else if (p === 'concept') {
      begin('concept');
      router.push(stageHrefFrom(pathname, 'cad'));
    } else {
      useFlowStore.getState().setWorkspace(p);
    }
    return;
  }
  const samePane = (active === 'cad' && p === 'concept') || (active === 'present' && p === 'present');
  if (samePane) return;
  begin(p);
  try {
    localStorage.setItem('interiorflow.workspace', p);
  } catch {
    /* bỏ qua */
  }
  router.push(stageHrefFrom(pathname, stageSegmentForPhase(p)));
}
