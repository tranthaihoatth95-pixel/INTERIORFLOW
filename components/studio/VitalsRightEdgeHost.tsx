'use client';

/**
 * components/studio/VitalsRightEdgeHost.tsx — CHỖ MOUNT DUY NHẤT của `VitalsGesturePanel` trong
 * các chặng thiết kế, neo cạnh TRỤC PHẢI (chốt 16/08: "Vitals ở chặng làm việc = nút RỜI cạnh
 * trục phải — cùng một vật, di chuyển theo chỗ tay đang đặt").
 *
 * VÌ SAO CẦN (đo 03/09, Slice 12): `StageSwitcher.tsx` — nơi mount duy nhất của panel theo
 * `lib/vitals-ui.ts` — đã bị gỡ khỏi `AppChrome` từ 17/08 (Hoà chốt hạ sidebar thành router).
 * Từ đó ô gõ nhanh ở `StatusBar` vẫn gọi `useVitalsUi.open()` nhưng KHÔNG CÓ panel nào nhận:
 * gõ Enter là mất câu hỏi. ⌘J cũng chết theo (đăng ký ở StageSwitcher). Host này trả lại đúng
 * MỘT chỗ mount, đọc đúng store dùng chung — không luồng mở thứ hai, không mount đôi
 * (SO-KIEM-TONG §1 "cấm mount cùng một panel ở 2 ổ").
 *
 * Cách lắp (một dòng, ngoài phạm vi phiên này — vùng AppShell/CadStageScreen):
 *   <VitalsRightEdgeHost stage="cad" />   // hoặc 'render' | 'present'
 * Host tự gate theo `useVitalsUi.panelOpen`; đóng thì chỉ còn nút tròn 44px ở mép phải.
 */

import { useCallback, useEffect } from 'react';
import { useVitalsUi } from '@/lib/vitals-ui';
import type { Phase } from '@/lib/phases';
import VitalsGesturePanel from './VitalsGesture';
import VitalsIcon from './VitalsIcon';

export type VitalsHostStage = 'cad' | 'render' | 'present';

/** `cad` là khoá kỹ thuật chặng 2D; panel + backend nhận `Phase` ('concept'). Giữ nguyên khoá. */
export function phaseOf(stage: VitalsHostStage): Phase {
  return stage === 'cad' ? 'concept' : stage;
}

export default function VitalsRightEdgeHost({ stage, offsetRightPx = 12, offsetBottomPx = 56 }: {
  stage: VitalsHostStage;
  /** cách mép phải (px) — mặc định né dải tay cầm PanelFlank 14px. */
  offsetRightPx?: number;
  offsetBottomPx?: number;
}) {
  const panelOpen = useVitalsUi((s) => s.panelOpen);
  const initialInput = useVitalsUi((s) => s.initialInput);
  const autoSend = useVitalsUi((s) => s.autoSend);
  const close = useVitalsUi((s) => s.close);
  const toggle = useVitalsUi((s) => s.toggle);
  const consumeInitial = useVitalsUi((s) => s.consumeInitial);

  // ⌘J / Ctrl+J — chép đúng tổ hợp StageSwitcher từng đăng ký (đã gỡ 17/08), không thêm phím mới.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'j' || e.key === 'J')) {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggle]);

  const onClose = useCallback(() => close(), [close]);

  return (
    <div
      data-vitals-host=""
      style={{
        position: 'absolute',
        right: offsetRightPx,
        bottom: offsetBottomPx,
        zIndex: 40,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        pointerEvents: 'none',
      }}
    >
      <div style={{ position: 'relative', pointerEvents: 'auto' }}>
        <button
          type="button"
          aria-label="Vitals — hỏi trợ lý (⌘J / Ctrl+J)"
          aria-expanded={panelOpen}
          onClick={() => toggle()}
          data-vitals-host-toggle=""
          style={{
            display: 'grid',
            placeItems: 'center',
            width: 44,
            height: 44,
            borderRadius: 999,
            border: '1px solid var(--border)',
            background: 'var(--panel)',
            color: panelOpen ? 'var(--accent)' : 'var(--t3)',
            boxShadow: 'var(--shadow-pop)',
            cursor: 'pointer',
          }}
        >
          <VitalsIcon size={20} />
        </button>
        {/* Panel xổ LÊN từ nút (direction='up'), neo mép phải: panel rộng 380px → dịch trái. */}
        <div style={{ position: 'absolute', right: 0, bottom: 0, width: 'min(380px, calc(100vw - 24px))', height: 0 }}>
          <VitalsGesturePanel
            originPx={null}
            open={panelOpen}
            direction="up"
            initialInput={initialInput}
            autoSend={autoSend}
            onConsumeInitial={consumeInitial}
            onClose={onClose}
            stage={phaseOf(stage)}
          />
        </div>
      </div>
    </div>
  );
}
