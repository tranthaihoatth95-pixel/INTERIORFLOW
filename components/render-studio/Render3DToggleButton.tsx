'use client';

/**
 * components/render-studio/Render3DToggleButton.tsx — G1 (`docs/SPEC-CHANG2-UI-2MODE.md` §1,
 * `docs/TICKET-CHANG2-BUILD-2026-08-02.md`): "1 nút RỜI gạt Vẽ 3D" cạnh `<BottomToolbar>` —
 * KHÔNG phải segmented control 2 nút (đó là `ModeShell`'s switcher mặc định, tắt cho chặng Render
 * qua `hideBuiltInSwitcher` — xem HomeScreen.tsx). Nút này DÙNG CHUNG cho cả 2 mode (luôn hiện,
 * không nằm trong nhánh nội dung của `ModeShell.content()`) — bấm ở mode nào cũng gạt được.
 *
 * Icon Box3d (three.js/isometric-box) đổi màu accent khi đang ở "Vẽ 3D" — cùng token
 * `docs/SPEC-DESIGN-SYSTEM-IF.md` §1 (`accent`/`accent-soft`).
 */

import { Box } from 'lucide-react';
import { motion } from 'framer-motion';
import { useStageMode } from '@/lib/stage-mode';
import { easeApple } from '@/lib/motion';

export default function Render3DToggleButton() {
  const { mode, setMode } = useStageMode('render');
  const active = mode === 'model3d';
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.94 }}
      transition={{ duration: 0.12, ease: easeApple }}
      onClick={() => setMode(active ? 'render' : 'model3d')}
      aria-pressed={active}
      title={active ? 'Về Render + Mood + Collab' : 'Vẽ 3D — khối đùn từ bản vẽ CAD, đẩy-kéo cao độ'}
      className="if-bottombar mat-card pointer-events-auto absolute bottom-4 z-20 flex items-center gap-1.5 rounded-[14px] border border-[var(--mat-hairline)] px-2.5 py-1.5 text-[12px] font-medium shadow-xl shadow-black/30 transition-colors"
      style={{
        right: 16,
        color: active ? 'var(--accent)' : 'var(--t2)',
        background: active ? 'var(--accent-soft)' : undefined,
      }}
    >
      <Box size={14} />
      Vẽ 3D
    </motion.button>
  );
}
