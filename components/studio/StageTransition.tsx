'use client';

/**
 * components/studio/StageTransition.tsx — C-4 (vế 2): chuyển CHẶNG kiểu
 * "dynamic wallpaper" macOS, dùng chung cho mọi điểm đổi CAD ↔ Render ↔ Present.
 *
 * Hai nửa của hiệu ứng:
 *   - <StageVeil show>  — lúc RỜI chặng: lớp màn `stageVeil` phủ crossfade nền
 *     che cú "nhảy" route (Header + StudioBar bật trước khi router.push).
 *   - <StageEnter>      — lúc ĐẾN chặng: nội dung route mới crossfade + thu scale
 *     rất nhẹ (`wallpaperIn` 1.012 → 1) thay vì hiện cứng.
 *
 * Reduced motion: StageEnter bỏ scale (chỉ còn fade); veil vốn là fade thuần nên giữ.
 */

import type { CSSProperties, ReactNode } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { wallpaperIn, stageVeil, fade } from '@/lib/motion';

/** Bọc nội dung chính của route studio — chạy `wallpaperIn` khi mount. */
export function StageEnter({
  children,
  style,
}: {
  children: ReactNode;
  /** ghi đè/bổ sung layout style (mặc định: cột flex chiếm hết phần còn lại). */
  style?: CSSProperties;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      variants={reduce ? fade : wallpaperIn}
      initial="hidden"
      animate="visible"
      style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', ...style }}
    >
      {children}
    </motion.div>
  );
}

/** Màn phủ toàn màn hình khi RỜI chặng (bật `show` trước khi điều hướng). */
export function StageVeil({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          variants={stageVeil}
          initial="hidden"
          animate="visible"
          exit="exit"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            background: 'var(--bg)',
            // không chặn chuột: nếu điều hướng lỗi thì app vẫn dùng được
            pointerEvents: 'none',
          }}
        />
      )}
    </AnimatePresence>
  );
}
