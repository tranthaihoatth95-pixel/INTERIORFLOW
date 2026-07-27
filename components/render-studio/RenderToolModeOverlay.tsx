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
import ToolModeHome from './ToolModeHome';
import ToolModeForm from './ToolModeForm';

export default function RenderToolModeOverlay() {
  const hydrated = useToolModeUi((s) => s.hydrated);
  const hydrate = useToolModeUi((s) => s.hydrate);
  const view = useToolModeUi((s) => s.view);
  const selectedCardId = useToolModeUi((s) => s.selectedCardId);
  const backToHome = useToolModeUi((s) => s.backToHome);
  const smallScreen = useIsSmallScreenForCanvas();

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
  return <ToolModeHome />;
}
