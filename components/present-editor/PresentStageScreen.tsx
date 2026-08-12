'use client';

/**
 * components/present-editor/PresentStageScreen.tsx — MÀN chặng 3 "Presenting" dùng chung
 * (tách khỏi app/present-editor/page.tsx ở Task #21 · ĐỔ NỀN 1B).
 *
 * Hai route mount CÙNG component này:
 *   · `/projects/[id]/present` — scope dự án (route chính thức).
 *   · `/present-editor`        — route cũ, nay redirect; chưa xác định được dự án nào đang
 *                                hoạt động thì render thẳng màn này (giữ hành vi cũ).
 *
 * VIỆC 2 mở rộng (03/08) — `<AppShell>` thay `<StageShell>` (Hoà: rail capsule biến mất khỏi
 * CẢ app, không chỉ chặng Vẽ). Navigator = `PresentNavigator` (placeholder trung thực — xem
 * comment trong file đó). Nội dung `PresentSheets` giữ NGUYÊN.
 *
 * B1 (`docs/PHIEU-TRINH-BOQ-EDITOR.md`) — thêm `mode` cục bộ 'deck'|'boq' để treo tạm màn BOQ
 * (xem TODO(H4) trong `PresentNavigator.tsx`): CHƯA có màn chọn 5 loại hồ sơ (H4) nên chưa thể
 * "nối vào" theo đúng nghĩa route riêng — đây là state-lift TỐI THIỂU, chỉ ở component này (KHÔNG
 * đụng `PresentSheets`/`PresentEditor` đang chạy — §0d), xoá khi H4 xong.
 */

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import PresentSheets from '@/components/present-editor/PresentSheets';
import { AppShell } from '@/components/studio/AppShell';
import { PresentNavigator } from '@/components/present-editor/PresentNavigator';
import { BoqScreen } from '@/components/present-editor/boq/BoqScreen';
import { ScheduleScreen } from '@/components/present-editor/table/ScheduleScreen';
import StatusBar from '@/components/studio/StatusBar';
import { StageEnter } from '@/components/studio/StageTransition';
import { CommentLayer } from '@/components/CommentLayer';
import { ChatPanel } from '@/components/ChatPanel';
import { StageIntroCard } from '@/components/onboarding/StageIntroCard';
import { useFlowStore } from '@/lib/store';
import { usePlayStatus } from '@/lib/present-editor/play-status';
import { effectiveUserId } from '@/lib/resume';
import { useT } from '@/lib/i18n';

export default function PresentStageScreen() {
  // Đợt 4 (`docs/phieu-giao/editor-bang-bieu-mau.md`) — thêm 'schedule' (Bảng thống kê), ĐI ĐÚNG
  // đường 'boq' đã có (state-lift tối thiểu ở component này, xem docstring B1 phía trên).
  const [mode, setMode] = useState<'deck' | 'boq' | 'schedule'>('deck');
  // Route studio KHÔNG nạp `user` vào store khi vào bằng hard-reload/URL trực tiếp — rơi về
  // lastUserId (cùng pattern PresentSheets.tsx/ResumeTracker), nếu không StageIntroCard im
  // lặng không bao giờ hiện cho user mở thẳng `/projects/[id]/present`.
  const storeUserId = useFlowStore((s) => s.user?.id);
  const userId = effectiveUserId(storeUserId);
  const setUser = useFlowStore((s) => s.setUser);
  /**
   * 06/08 VÒNG 2 — NÚT GIẢ, bắt được khi nghiệm thu G-M3-09 trên app thật.
   * Màn BOQ chỉ render khi `mode === 'boq' && userId`. Vào THẲNG `/projects/[id]/present`
   * (hard-reload, dán link, hoặc điều hướng không đi qua Home) thì `useFlowStore.hydrate()` chưa
   * chạy lần nào và `lastUserId` trong localStorage cũng rỗng ⇒ `userId` rỗng ⇒ bấm "Bảng khối
   * lượng (BOQ)" **KHÔNG có gì xảy ra, không một dòng báo** — đúng thứ luật §9 cấm ("cấm nút giả
   * bấm không ra gì"). Đo được: `window.__flowStore.getState().user` = undefined, click 3 lần,
   * màn hình đứng nguyên ở deck.
   * Chữa tại gốc thay vì báo lỗi cho người dùng: phiên đăng nhập VẪN CÒN (cookie hợp lệ), chỉ là
   * store chưa biết — hỏi `/api/auth/me` một lần rồi nạp vào store. Dùng đúng endpoint
   * `SessionWatch` đang dùng, không chế đường xác thực thứ hai.
   */
  useEffect(() => {
    if (storeUserId) return;
    let bỏ = false;
    void (async () => {
      try {
        const r = await fetch('/api/auth/me');
        if (!r.ok) return; // 401 = chưa đăng nhập thật; SessionWatch lo việc báo, không báo hai lần
        const j = await r.json().catch(() => null);
        const u = j?.user ?? j;
        if (!bỏ && u?.id) setUser(u);
      } catch {
        /* mạng đứt — không kết luận gì, giữ nguyên trạng thái */
      }
    })();
    return () => { bỏ = true; };
  }, [storeUserId, setUser]);
  // `/projects/[id]/present` cho `id` thật; route toàn cục cũ `/present-editor` không có — B0
  // (`getProjectDoc`) coi projectId rỗng là "chưa xác định dự án", trả source:'none' đúng nghĩa.
  const params = useParams<{ id?: string }>();
  const projectId = params?.id ?? '';
  // VIỆC A3 (28/07): StatusBar tự ẩn khi trình chiếu toàn màn hình (SlidePlayer che hết,
  // playing nay ở store dùng chung để đọc được từ NGOÀI PresentEditor).
  const playing = usePlayStatus((s) => s.playing);
  const tr = useT();
  return (
    <AppShell
      active="present"
      statusBar={<StatusBar stage="present" hidden={playing} />}
      navigator={
        <PresentNavigator
          boqActive={mode === 'boq'}
          onOpenBoq={() => setMode(mode === 'boq' ? 'deck' : 'boq')}
          scheduleActive={mode === 'schedule'}
          onOpenSchedule={() => setMode(mode === 'schedule' ? 'deck' : 'schedule')}
        />
      }
      navigatorAddLabel={tr('Trang mới', 'New page')}
      navigatorCollapsedLabel={tr('Trang', 'Pages')}
    >
      {/* C-4: vào chặng bằng crossfade + scale "dynamic wallpaper" (StageEnter). */}
      <StageEnter style={{ display: 'block' }}>
        {mode === 'boq' && userId ? (
          <BoqScreen projectId={projectId} userId={userId} />
        ) : mode === 'schedule' && userId ? (
          <ScheduleScreen projectId={projectId} userId={userId} />
        ) : (
          /* Tầng multi-sheet (phụ-thêm): thanh tab + PresentEditor. 1 sheet ⇒ y hệt bản cũ.
           * 07/08 (M-EMPTY) — KHÔNG truyền initialDeck: màn Trình chiếu THẬT bắt đầu RỖNG
           * (trước đây chạy bằng makeSampleDeck — deck mẫu, vi phạm chốt "bỏ hết dự án mẫu"). */
          <PresentSheets onRequestBoq={() => setMode('boq')} onRequestSchedule={() => setMode('schedule')} />
        )}
      </StageEnter>
      <ChatPanel />
      <CommentLayer />
      {/* Tầng 2 onboarding — thẻ giới thiệu lần đầu chặng Presenting. */}
      <StageIntroCard stage="present" userId={userId} />
    </AppShell>
  );
}
