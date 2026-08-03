'use client';

/**
 * components/render-studio/RenderToolModeOverlay.tsx — lớp phủ Tool Mode lên TRÊN node graph
 * (VIỆC B, 28/07 · dựng lại D3 01/08 theo `docs/CHOT-RENDER-TOOL-WINDOW-2026-08-01.md`, dựng lại
 * LẦN 2 ở H3 02/08 theo `docs/TICKET-UI-HATANG-2026-08-02.md`: "tool = NODE side trái, kéo/thả xổ
 * ra WINDOW — KHÔNG tab ngang"). Mount làm anh em với `<FlowCanvas />` trong HomeScreen.tsx.
 *
 * H3 GỠ HẲN `RenderToolTabs` (thanh tab ngang D3) — cửa vào tool window giờ là sidebar 3 vùng
 * (`NodeLibraryPanel.tsx`, H2), KHÔNG còn thanh tab trên đầu. `ToolWindow` vẫn portal ra ngoài,
 * nổi lên trên canvas chứ không "khoá" canvas ở dưới — `2.2.92` (overlay che kín canvas) vẫn
 * ĐÓNG (không còn dải nào chiếm `top:0` toàn bề rộng như D3's `RenderToolTabs` nữa — H3 dọn dứt
 * điểm, kể cả phần chừa chỗ cho nó trong `ModeShell` cũng gỡ theo, xem HomeScreen.tsx).
 *
 * "Mở canvas" (nút cũ trong `RenderToolTabs`) — KHÔNG cần thay thế: canvas giờ LUÔN lộ ra (D3),
 * đóng `ToolWindow` (nút ✕/▁ trên header) đã đủ "quay lại canvas thuần". Luồng canvas-handoff
 * (`materialswap`/`furniture`/`localedit` — cần vẽ mask tay) vẫn tự chuyển `view:'canvas'` qua
 * `openCanvas()` trong `ToolModeForm.tsx`, không phụ thuộc gì vào file này.
 */

import { useEffect } from 'react';
import { useToolModeUi, useIsSmallScreenForCanvas } from '@/lib/render-studio/tool-mode-ui';
import { useFlowStore } from '@/lib/store';
import { detectGraphPattern } from '@/lib/render-studio/graph-pattern';
import ToolWindow from './ToolWindow';

export default function RenderToolModeOverlay() {
  const hydrated = useToolModeUi((s) => s.hydrated);
  const hydrate = useToolModeUi((s) => s.hydrate);
  const view = useToolModeUi((s) => s.view);
  const selectedCardId = useToolModeUi((s) => s.selectedCardId);
  const selectCard = useToolModeUi((s) => s.selectCard);
  const backToHome = useToolModeUi((s) => s.backToHome);
  const smallScreen = useIsSmallScreenForCanvas();
  const nodes = useFlowStore((s) => s.nodes);
  const edges = useFlowStore((s) => s.edges);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (smallScreen && view === 'canvas') backToHome();
  }, [smallScreen, view, backToHome]);

  // LỖ RÒ 2 (2.2.77, 29/07, docs/CHOT-SO-MA-2026-07-29.md §D) — về 'home' (không tool nào mở)
  // KHÔNG được lờ đi graph đang có trên canvas. Khớp đúng mẫu 1 ảnh→1 node AI có thẻ tương ứng →
  // tự MỞ LẠI đúng tool đó dạng window (không hỏi lại, không mất ngữ cảnh) — giữ đúng hành vi cũ,
  // chỉ đổi "hiện ToolModeForm trực tiếp" thành "mở ToolWindow".
  const nodePattern = detectGraphPattern(nodes, edges);
  useEffect(() => {
    if (hydrated && view === 'home' && !selectedCardId && nodePattern.kind === 'single') {
      selectCard(nodePattern.cardId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, view, selectedCardId, nodePattern.kind, nodePattern.kind === 'single' ? nodePattern.cardId : null]);

  if (!hydrated) return null; // chờ đọc xong localStorage — tránh flash sai view lúc SSR/hydrate.
  if (view === 'canvas') return null; // canvas thuần, ẩn hẳn cả thanh tab.

  // 🔴 DỌN ĐỊA TẦNG (Hoà chốt 04/08): banner "Còn công cụ khác chưa hiện / Xem tất cả" XOÁ HẲN
  // mọi biến thể — Thư viện khối giờ LUÔN hiện ở Navigator (ổ ②, embedded), không còn gì "chưa
  // hiện" để nhắc; cảnh báo LỖ RÒ 2 hết đối tượng. Chỉ còn vai trò mount ToolWindow + auto-mở
  // lại tool khớp mẫu (effect trên).
  return <>{view === 'form' && selectedCardId && <ToolWindow cardId={selectedCardId} />}</>;
}
