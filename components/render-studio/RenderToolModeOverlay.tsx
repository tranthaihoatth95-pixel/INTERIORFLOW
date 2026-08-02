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
import { useT } from '@/lib/i18n';
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
  const setPanel = useFlowStore((s) => s.setPanel);
  const tr = useT();

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
  // G1d (`docs/SPEC-NGON-NGU-CHI-DAN.md` §4 — chính câu Hoà chê "nói vậy chả ai hiểu gì cả"):
  // BỎ câu giải thích cơ chế ("chọn Node MASTER ở sidebar... mở Node Library") — thay bằng khuôn
  // "Nhắc trạng thái" (§2): 1 câu kết quả + nút làm ngay, không thuật ngữ nội bộ (Từ điển §3).
  const showNotice = !selectedCardId && nodePattern.kind === 'complex' && nodePattern.nodeCount > 1;

  return (
    <>
      {/* H3 — dải mỏng thay RenderToolTabs (đã gỡ), CHỈ hiện khi có cảnh báo LỖ RÒ 2 (đa số thời
          gian KHÔNG có gì ở đây — canvas hoàn toàn trống, đúng "không tab ngang"). */}
      {showNotice && (
        <div
          style={{
            position: 'absolute',
            top: 12,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 32,
            maxWidth: 'min(560px, calc(100vw - 32px))',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 8px 6px 12px',
            borderRadius: 8,
            border: '1px solid var(--border)',
            background: 'color-mix(in srgb, var(--panel) 92%, transparent)',
            backdropFilter: 'blur(14px)',
            color: 'var(--t2)',
            fontSize: 11.5,
          }}
        >
          {/* G4-1a (đêm 04/08, BAO-CAO-DEM mục 4) — câu cũ "Còn công cụ khác chưa hiện" nghe như
              debug, Hoà chê mơ hồ. Đổi theo khuôn Nhắc trạng thái §2: 1 câu chỉ đúng chỗ chứa
              công cụ ("Thư viện khối" — tên thật trên UI) + nút xử. */}
          <span>{tr('Công cụ đầy đủ nằm trong Thư viện khối.', 'The full toolset is in the Block library.')}</span>
          <button
            type="button"
            onClick={() => setPanel('library')}
            style={{
              flexShrink: 0,
              padding: '4px 10px',
              borderRadius: 999,
              border: '1px solid var(--accent-ring)',
              background: 'var(--accent-soft)',
              color: 'var(--accent)',
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {tr('Mở thư viện', 'Open library')}
          </button>
        </div>
      )}
      {view === 'form' && selectedCardId && <ToolWindow cardId={selectedCardId} />}
    </>
  );
}
