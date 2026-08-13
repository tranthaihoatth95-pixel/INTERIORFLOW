'use client';

/**
 * components/render-studio/ModeSwitchCell.tsx — G1c (Hoà chốt: phương án B, `docs/
 * SPEC-DESIGN-SYSTEM-IF.md` §2d "HÌNH HỌC APPLE"): ô "Vẽ 3D" = nhãn chữ + SWITCH thật, đứng
 * CÙNG KHỐI với bottom bar (không phải pill rời — §2c luật 1 "một khối một bóng"). Dùng CHUNG ở
 * 2 nơi: cuối `<BottomToolbar>` (mode 'render', cùng bar với zoom/pan) và `<ModeSwitchBar>` (mode
 * 'model3d', bar riêng vì không còn zoom/pan React-Flow để đứng cạnh) — tránh viết 2 lần logic
 * switch. Track/núm suy đúng thang bo đồng tâm §2d: bar 44/r22 → đệm 5 → track switch 22/r11 →
 * núm tròn 18 (đệm 2 mỗi cạnh, đúng công thức bo-trong = bo-ngoài − đệm).
 *
 * Màu track TẮT dùng `var(--border-strong)` thay vì hex `#d8d5d0` mock đưa (chỉ đúng light theme)
 * — quyết định tự chọn để switch không "biến mất" (quá sáng) trên nền tối; `--border-strong` là
 * token xám trung tính GẦN NHẤT có sẵn, tự đổi đúng theo theme (`app/globals.css`).
 */

import { motion, useReducedMotion } from 'framer-motion';
import { Box } from 'lucide-react';
import { useStageMode } from '@/lib/stage-mode';
import { useT } from '@/lib/i18n';

export default function ModeSwitchCell() {
  const { mode, setMode } = useStageMode('render');
  const active = mode === 'model3d';
  const reduce = !!useReducedMotion();
  const tr = useT();

  return (
    <button
      type="button"
      onClick={() => setMode(active ? 'render' : 'model3d')}
      aria-pressed={active}
      title={active ? tr('Về Render + Mood + Collab', 'Back to Render + Mood + Collab') : tr('Vẽ 3D — khối đùn từ bản vẽ Thiết kế 2D, đẩy-kéo cao độ', 'Draw 3D — massing extruded from the 2D Design drawing')}
      className="flex shrink-0 items-center gap-1.5 rounded-full px-2 text-[12px] font-medium text-[var(--t2)]"
      style={{ height: 34 }}
    >
      <Box size={15} className={active ? 'text-[var(--accent)]' : undefined} />
      <span>{tr('Vẽ 3D', '3D')}</span>
      {/* Track — capsule 36×22, r11 (=cao/2, đồng tâm với đệm 2 quanh núm 18). */}
      <span
        className="relative inline-block shrink-0 transition-colors"
        style={{
          width: 36,
          height: 22,
          borderRadius: 999,
          background: active ? 'var(--accent)' : 'var(--border-strong)',
          transitionDuration: reduce ? '0ms' : '200ms',
        }}
      >
        <motion.span
          className="absolute rounded-full bg-white shadow-sm"
          style={{ width: 18, height: 18, top: 2 }}
          animate={{ left: active ? 16 : 2 }}
          transition={{ duration: reduce ? 0 : 0.2 }}
        />
      </span>
    </button>
  );
}
