'use client';

/**
 * components/render-studio/RenderToolModeOverlay.tsx — lớp phủ Tool Mode lên TRÊN node graph
 * (VIỆC B, 28/07). Mount làm anh em với `<FlowCanvas />` trong HomeScreen.tsx, `position:
 * absolute; inset:0` che kín canvas bên dưới khi `view !== 'canvas'` — canvas GIỮ NGUYÊN mounted
 * (không mất state/không remount), chỉ "lùi xuống sau nút Mở canvas" đúng nghĩa đen (B5).
 *
 * Màn ≤7 inch (xấp xỉ bằng bề rộng CSS px, xem tool-mode-ui.ts) → ÉP ở Tool Mode, không cho vào
 * canvas kể cả nếu lựa chọn đã lưu trước đó là 'canvas' (đổi từ màn lớn sang máy nhỏ).
 */

import { useEffect } from 'react';
import { useToolModeUi, useIsSmallScreenForCanvas } from '@/lib/render-studio/tool-mode-ui';
import { useFlowStore } from '@/lib/store';
import { detectGraphPattern } from '@/lib/render-studio/graph-pattern';
import ToolModeHome from './ToolModeHome';
import ToolModeForm from './ToolModeForm';

export default function RenderToolModeOverlay() {
  const hydrated = useToolModeUi((s) => s.hydrated);
  const hydrate = useToolModeUi((s) => s.hydrate);
  const view = useToolModeUi((s) => s.view);
  const selectedCardId = useToolModeUi((s) => s.selectedCardId);
  const backToHome = useToolModeUi((s) => s.backToHome);
  const smallScreen = useIsSmallScreenForCanvas();
  const nodes = useFlowStore((s) => s.nodes);
  const edges = useFlowStore((s) => s.edges);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // đổi máy nhỏ khi đang ở canvas (vd gập điện thoại) → về Tool Mode ngay, không kẹt ở canvas
  // bất khả thi trên màn nhỏ.
  useEffect(() => {
    if (smallScreen && view === 'canvas') backToHome();
  }, [smallScreen, view, backToHome]);

  if (!hydrated) return null; // chờ đọc xong localStorage — tránh flash sai view lúc SSR/hydrate.
  if (view === 'canvas') return null; // canvas lộ ra — overlay ẩn hẳn.

  if (view === 'form' && selectedCardId) return <ToolModeForm cardId={selectedCardId} />;

  // LỖ RÒ 2 (2.2.77, 29/07, docs/CHOT-SO-MA-2026-07-29.md §D) — rời canvas về 'home' KHÔNG được
  // lờ đi graph đang có trên đó. Khớp đúng mẫu 1 ảnh→1 node AI có thẻ tương ứng → mở lại ĐÚNG thẻ
  // đó (không hỏi lại, không mất ngữ cảnh). Phức tạp hơn → báo rõ số node, không im lặng hiện
  // lưới 6 thẻ trống như canvas chưa từng có gì.
  const pattern = detectGraphPattern(nodes, edges);
  if (pattern.kind === 'single') return <ToolModeForm cardId={pattern.cardId} />;
  // 30/07 — sửa báo động giả (Luật Đồng Bộ #6, cùng màn với 2.2.70): `detectGraphPattern()` trả
  // 'complex' cho CẢ trường hợp 1 node mồ côi (không khớp mẫu ảnh→AI 2-node), nodeCount=1. Với
  // đúng 1 node thì KHÔNG có gì bị "giấu" — dải cảnh báo chiếm nguyên hàng ngang đầu màn là báo
  // động giả. Chỉ hiện khi nodeCount thật sự > 1 (đúng nghĩa "còn thứ khác đang ẩn").
  if (pattern.kind === 'complex' && pattern.nodeCount > 1) {
    return (
      <ToolModeHome
        notice={`Flow này có ${pattern.nodeCount} node — Tool Mode chỉ hiện được 1 việc, mở canvas để xem đủ.`}
      />
    );
  }
  return <ToolModeHome />;
}
