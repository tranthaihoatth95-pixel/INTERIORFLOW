'use client';

/**
 * components/render-studio/Render3DToggleButton.tsx — G1 (`docs/SPEC-CHANG2-UI-2MODE.md` §1,
 * `docs/TICKET-CHANG2-BUILD-2026-08-02.md`): "1 nút RỜI gạt Vẽ 3D" **CẠNH** `<BottomToolbar>` —
 * KHÔNG phải segmented control 2 nút (đó là `ModeShell`'s switcher mặc định, tắt cho chặng Render
 * qua `hideBuiltInSwitcher` — xem HomeScreen.tsx). Nút này DÙNG CHUNG cho cả 2 mode (luôn hiện,
 * không nằm trong nhánh nội dung của `ModeShell.content()`) — bấm ở mode nào cũng gạt được.
 *
 * G1b (chỉnh sau khi Hoà duyệt mock) — TRƯỚC đứng cố định góc phải màn hình (`right:16`), SAI vị
 * trí spec (SPEC-CHANG2-UI-2MODE §1: "Cạnh nó [thanh zoom/pan] là 1 nút rời gạt Vẽ 3D"). Component
 * này với `BottomToolbar` KHÔNG cùng cây DOM (khác cha, khác ngữ cảnh flex/positioned-ancestor —
 * `BottomToolbar` neo giữa theo `wrapperRef` riêng của `FlowCanvas`, nút này neo theo container
 * ngoài cùng CHỨA CẢ `LeftRail`) nên không thể ghép "cùng hàng flex" bằng CSS thuần. Đo TRỰC TIẾP
 * `getBoundingClientRect()` của `BottomToolbar` (`#if-bottom-toolbar`) rồi tự quy đổi sang toạ độ
 * `left` của CHÍNH containing-block của nút này (`offsetParent`) — bám đúng cạnh phải toolbar dù
 * toolbar dịch chuyển khi sidebar (NodeLibraryPanel/GalleryPanel/...) mở/đóng làm hẹp `wrapperRef`.
 * `ResizeObserver` gắn trên CHA của toolbar (đổi SIZE thật khi sidebar mount/unmount — bản thân
 * toolbar không đổi size khi bị đẩy, chỉ đổi vị trí, `ResizeObserver` không bắt được đổi vị trí).
 *
 * Icon Box3d (three.js/isometric-box) đổi màu accent khi đang ở "Vẽ 3D" — cùng token
 * `docs/SPEC-DESIGN-SYSTEM-IF.md` §1 (`accent`/`accent-soft`).
 */

import { useLayoutEffect, useRef, useState } from 'react';
import { Box } from 'lucide-react';
import { motion } from 'framer-motion';
import { useStageMode } from '@/lib/stage-mode';
import { easeApple } from '@/lib/motion';

const TOOLBAR_GAP_PX = 10;
/** Khi `#if-bottom-toolbar` chưa từng đo được trong phiên này (vd load thẳng vào mode "Vẽ 3D",
 * toolbar chưa mount lần nào) — nửa-rộng đo thực tế BottomToolbar ở desktop (~465px) + gap, tránh
 * nút nhảy vị trí ở lần render đầu. KHÔNG dùng để thay việc đo thật — chỉ 1 lần fallback. */
const FALLBACK_LEFT_OFFSET_PX = 243;

export default function Render3DToggleButton() {
  const { mode, setMode } = useStageMode('render');
  const active = mode === 'model3d';
  const btnRef = useRef<HTMLButtonElement>(null);
  const [left, setLeft] = useState<number | null>(null);

  useLayoutEffect(() => {
    const measure = () => {
      const toolbarEl = document.getElementById('if-bottom-toolbar');
      const ancestor = btnRef.current?.offsetParent as HTMLElement | null;
      // Toolbar vắng mặt (mode Vẽ 3D, `BottomToolbar` chỉ sống trong content() mode 'render') →
      // GIỮ NGUYÊN `left` đo lần cuối, không reset — tránh nút nhảy vị trí lúc gạt mode.
      if (!toolbarEl || !ancestor) return;
      const ancestorRect = ancestor.getBoundingClientRect();
      const toolbarRect = toolbarEl.getBoundingClientRect();
      setLeft(toolbarRect.right - ancestorRect.left + TOOLBAR_GAP_PX);
    };
    measure();
    window.addEventListener('resize', measure);
    const wrapper = document.getElementById('if-bottom-toolbar')?.parentElement ?? null;
    const ro = wrapper && typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    if (wrapper && ro) ro.observe(wrapper);
    return () => {
      window.removeEventListener('resize', measure);
      ro?.disconnect();
    };
  }, [mode]);

  return (
    <motion.button
      ref={btnRef}
      type="button"
      whileTap={{ scale: 0.94 }}
      transition={{ duration: 0.12, ease: easeApple }}
      onClick={() => setMode(active ? 'render' : 'model3d')}
      aria-pressed={active}
      title={active ? 'Về Render + Mood + Collab' : 'Vẽ 3D — khối đùn từ bản vẽ CAD, đẩy-kéo cao độ'}
      className="if-bottombar mat-card pointer-events-auto absolute bottom-4 z-20 flex items-center gap-1.5 rounded-[14px] border border-[var(--mat-hairline)] px-2.5 py-1.5 text-[12px] font-medium shadow-xl shadow-black/30 transition-colors"
      style={{
        left: left != null ? left : `calc(50% + ${FALLBACK_LEFT_OFFSET_PX}px)`,
        color: active ? 'var(--accent)' : 'var(--t2)',
        background: active ? 'var(--accent-soft)' : undefined,
      }}
    >
      <Box size={14} />
      Vẽ 3D
    </motion.button>
  );
}
