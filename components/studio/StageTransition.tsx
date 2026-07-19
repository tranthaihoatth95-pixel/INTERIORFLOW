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

import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
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

/**
 * Màn phủ toàn màn hình khi RỜI chặng (bật `show` trước khi điều hướng).
 *
 * `label` = tên chặng ĐÍCH. Khi có, màn che hiện thêm dòng "Đang mở <chặng>…" — nhưng CHỈ sau
 * {@link SLOW_NAV_MS}: chuyển chặng đã prefetch xong thì xong trong ~150ms, nhá một dòng chữ lên
 * rồi tắt ngay còn khó chịu hơn là không có gì. Chỉ khi chặng đích thật sự tải lâu (canvas node,
 * deck nhiều slide) người dùng mới thấy chỉ báo — đúng lúc cần trấn an.
 */
const SLOW_NAV_MS = 400;

export function StageVeil({ show, label }: { show: boolean; label?: string }) {
  const reduce = useReducedMotion();
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    if (!show) {
      setSlow(false);
      return;
    }
    const t = setTimeout(() => setSlow(true), SLOW_NAV_MS);
    return () => clearTimeout(t);
  }, [show]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          variants={stageVeil}
          initial="hidden"
          animate="visible"
          exit="exit"
          // Reduced motion: bỏ hẳn crossfade, màn hiện/tắt tức thì (vẫn che được cú nhảy route).
          transition={reduce ? { duration: 0 } : undefined}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            background: 'var(--bg)',
            display: 'grid',
            placeItems: 'center',
            // không chặn chuột: nếu điều hướng lỗi thì app vẫn dùng được
            pointerEvents: 'none',
          }}
        >
          {label && slow && (
            <motion.span
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.22 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 9,
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: '0.24em',
                textTransform: 'uppercase',
                color: 'var(--t4)',
              }}
            >
              {/* Chấm thở — dấu hiệu "còn sống" duy nhất; reduced motion thì đứng yên. */}
              <motion.span
                animate={reduce ? undefined : { opacity: [0.25, 1, 0.25] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                style={{ width: 5, height: 5, borderRadius: 5, background: 'var(--accent)' }}
              />
              Đang mở {label}
            </motion.span>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
