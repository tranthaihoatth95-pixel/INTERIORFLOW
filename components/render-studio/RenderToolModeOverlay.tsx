'use client';

/**
 * components/render-studio/RenderToolModeOverlay.tsx — lớp phủ Tool Mode lên TRÊN node graph
 * (VIỆC B, 28/07 · dựng lại D3 01/08 theo `docs/CHOT-RENDER-TOOL-WINDOW-2026-08-01.md`: tool
 * window = subgraph node phóng to). Mount làm anh em với `<FlowCanvas />` trong HomeScreen.tsx —
 * NHƯNG khác bản cũ ở đúng điểm bug `2.2.92` từng mắc: KHÔNG còn `position:absolute;inset:0`
 * phủ kín canvas. `RenderToolTabs` chỉ là 1 dải mỏng neo trên đầu (canvas LUÔN lộ ra, bấm được
 * ngay cả khi chưa mở tool nào); `ToolWindow` (khi có tool mở) portal ra ngoài, nổi lên trên chứ
 * không "khoá" canvas ở dưới. `2.2.92` (overlay "Chọn việc muốn làm" che popover) coi như đóng
 * theo đúng cách mô hình mới yêu cầu — không còn overlay full-bleed nào ở đây nữa.
 *
 * Màn ≤7 inch: window tự phóng toàn màn (`ToolWindow` tự xử lý) — không ép "canvas cấm vào" như
 * bản cũ NỮA (nút "Mở canvas" trong `RenderToolTabs` vẫn bấm được), nhưng đổi máy nhỏ khi đang ở
 * canvas vẫn tự về Tool Mode như hành vi cũ (giữ nguyên, an toàn hơn cho thao tác chạm).
 */

import { useEffect } from 'react';
import { useToolModeUi, useIsSmallScreenForCanvas } from '@/lib/render-studio/tool-mode-ui';
import { useFlowStore } from '@/lib/store';
import { detectGraphPattern } from '@/lib/render-studio/graph-pattern';
import RenderToolTabs from './RenderToolTabs';
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

  // 30/07 — sửa báo động giả (Luật Đồng Bộ #6): `detectGraphPattern()` trả 'complex' cho CẢ
  // trường hợp 1 node mồ côi (nodeCount=1, không khớp mẫu ảnh→AI). Với đúng 1 node thì KHÔNG có
  // gì bị "giấu" — chỉ báo khi nodeCount thật sự > 1.
  const notice =
    !selectedCardId && nodePattern.kind === 'complex' && nodePattern.nodeCount > 1
      ? `Flow này có ${nodePattern.nodeCount} node — Tool Mode chỉ hiện được 1 việc, mở canvas để xem đủ.`
      : undefined;

  return (
    <>
      <RenderToolTabs notice={notice} />
      {view === 'form' && selectedCardId && <ToolWindow cardId={selectedCardId} />}
    </>
  );
}
