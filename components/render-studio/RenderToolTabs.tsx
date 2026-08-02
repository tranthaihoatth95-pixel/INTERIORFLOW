'use client';

/**
 * components/render-studio/RenderToolTabs.tsx — thanh tab nổi (D3, `docs/CHOT-RENDER-TOOL-WINDOW-2026-08-01.md`
 * §1 mục 2), THAY `ToolModeHome.tsx` làm cửa vào chặng Render. Khác biệt cốt lõi so với cái cũ
 * (đóng bug 2.2.92): đây là 1 DẢI MỎNG neo trên đầu, KHÔNG `inset:0` che kín canvas — node graph
 * (`FlowCanvas`) LUÔN lộ ra và bấm được ngay cả khi chưa mở tool nào.
 *
 * Vị trí cố định (không tự xếp lại theo tần suất — "giữ trí nhớ cơ bắp", §1 mục 2). Bấm 1 tab:
 *   - đang ĐÓNG → mở window (đúng tool đó).
 *   - đang MỞ ĐÚNG tool này → thu lại (collapse), y hệt bấm "▁" trên window.
 *   - đang MỞ tool KHÁC → chuyển sang tool này (bản 1-window/lượt — xem 💭 giới hạn trong
 *     BAO-CAO-CHINH.md, chưa làm multi-window 2-3 cái + tự thu cái cũ nhất).
 *
 * Tab "+ Ghim" (ghim việc của tôi, §1 mục 2) — CHƯA có nơi lưu "việc đã ghim" nào trong app, hiện
 * là placeholder tắt (disabled), không giả vờ hoạt động.
 */

import { Pin } from 'lucide-react';
import { useToolModeUi } from '@/lib/render-studio/tool-mode-ui';
import { TASK_CARDS } from '@/lib/render-studio/task-cards';

export default function RenderToolTabs({ notice }: { notice?: string } = {}) {
  const view = useToolModeUi((s) => s.view);
  const selectedCardId = useToolModeUi((s) => s.selectedCardId);
  const selectCard = useToolModeUi((s) => s.selectCard);
  const backToHome = useToolModeUi((s) => s.backToHome);
  const openCanvas = useToolModeUi((s) => s.openCanvas);

  const isOpen = view === 'form' && !!selectedCardId;

  return (
    <div style={{ position: 'absolute', top: 12, left: 0, right: 0, zIndex: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, pointerEvents: 'none' }}>
      <div
        style={{
          pointerEvents: 'auto',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          maxWidth: 'calc(100vw - 32px)',
          overflowX: 'auto',
          padding: 6,
          borderRadius: 999,
          background: 'color-mix(in srgb, var(--panel) 72%, transparent)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          border: '1px solid var(--border-strong)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
        }}
      >
        {TASK_CARDS.map((card) => {
          const active = isOpen && selectedCardId === card.id;
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => (active ? backToHome() : selectCard(card.id))}
              aria-pressed={active}
              style={{
                flexShrink: 0,
                padding: '7px 12px',
                borderRadius: 999,
                fontSize: 12,
                whiteSpace: 'nowrap',
                border: '1px solid transparent',
                color: active ? 'var(--bg)' : 'var(--t2)',
                background: active ? 'var(--t1)' : 'transparent',
              }}
            >
              {card.label}
            </button>
          );
        })}
        <button
          type="button"
          disabled
          title="Ghim việc của tôi — chưa có (chưa có nơi lưu việc đã ghim)"
          style={{
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '7px 10px',
            borderRadius: 999,
            fontSize: 12,
            color: 'var(--t4)',
            opacity: 0.5,
            cursor: 'not-allowed',
          }}
        >
          <Pin size={12} /> Ghim
        </button>
        <button
          type="button"
          onClick={openCanvas}
          title="Mở canvas — xem/nối node đầy đủ"
          style={{ flexShrink: 0, padding: '7px 10px', borderRadius: 999, fontSize: 12, color: 'var(--t3)' }}
        >
          Mở canvas
        </button>
      </div>
      {notice && (
        <div
          style={{
            pointerEvents: 'auto',
            maxWidth: 'min(560px, calc(100vw - 32px))',
            padding: '6px 12px',
            borderRadius: 8,
            border: '1px solid var(--border)',
            background: 'var(--field)',
            color: 'var(--t2)',
            fontSize: 11.5,
            textAlign: 'center',
          }}
        >
          {notice}
        </div>
      )}
    </div>
  );
}
