'use client';

/**
 * components/render-studio/ModeSwitchBar.tsx — G1c: bar capsule ĐỘC LẬP chỉ chứa
 * `<ModeSwitchCell>`, dùng khi mode 'model3d' (viewport 3D không có zoom/pan React-Flow để
 * `<BottomToolbar>` đứng cạnh — bar đó không mount trong mode này). Mount BÊN TRONG
 * `Render3DModeSkeleton.tsx` (KHÔNG phải ở `HomeScreen.tsx` ngoài `ModeShell.content()` như
 * `Render3DToggleButton` cũ) — lý do: positioned-ancestor của component này PHẢI LÀ box canvas 3D
 * (loại trừ `LeftRail`), giống hệt cách `BottomToolbar` neo theo `wrapperRef` riêng của
 * `FlowCanvas` chứ không theo container ngoài cùng — mount sai chỗ sẽ lệch tâm ngang khi gạt mode
 * (đúng bug G1b đã vá cho pill cũ, giờ né từ đầu bằng cách đặt đúng vị trí trong cây DOM).
 * Cùng hình học §2d với `<BottomToolbar>`: bar 44/r22/đệm 5 — MỘT khối MỘT bóng dù chỉ 1 phần tử.
 */

import { motion } from 'framer-motion';
import { springSheet } from '@/lib/motion';
import ModeSwitchCell from '@/components/render-studio/ModeSwitchCell';

export default function ModeSwitchBar() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, x: '-50%' }}
      animate={{ opacity: 1, y: 0, x: '-50%' }}
      transition={springSheet}
      /* P5 (04/08): kính lỏng `.glass-float--bar` — 1 trong ĐÚNG 4 chỗ được phép (toolbelt trên
         canvas 3D), xem luật ở globals.css. Bỏ mat-card/border/shadow cũ — class tự mang đủ. */
      className="if-bottombar glass-float glass-float--bar pointer-events-auto absolute bottom-4 left-1/2 z-20 flex"
      style={{ height: 44, padding: 5 }}
    >
      <ModeSwitchCell />
    </motion.div>
  );
}
