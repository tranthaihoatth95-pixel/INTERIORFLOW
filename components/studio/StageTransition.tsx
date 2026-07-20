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
import { PHASE_MAP, type Phase } from '@/lib/phases';
import { useStageTransition } from './StageTransitionProvider';

/**
 * Bọc nội dung chính của route studio.
 *
 * - Vào thẳng bằng URL (không có màn che): chạy `wallpaperIn` — crossfade + thu scale rất nhẹ.
 * - Đến từ một chặng khác (đang có veil che): KHÔNG fade nữa. Veil đã lo phần chuyển cảnh; nếu
 *   fade thêm ở đây thì thành fade chồng fade và người dùng thấy một khoảng nền phẳng ở giữa.
 *   Nội dung render sẵn ở opacity 1 để veil kéo ra là thấy ngay trang hoàn chỉnh.
 *
 * Ghi chú hiệu năng: `wallpaperIn` có `scale`, mà cây con ở đây là cả canvas CAD / deck slide.
 * Bỏ được scale ở nhánh "đến từ chặng khác" cũng là bỏ luôn một lần rasterise layer rất to.
 */
export function StageEnter({
  children,
  style,
}: {
  children: ReactNode;
  /** ghi đè/bổ sung layout style (mặc định: cột flex chiếm hết phần còn lại). */
  style?: CSSProperties;
}) {
  const reduce = useReducedMotion();
  const { arriving } = useStageTransition();
  // Chốt MỘT LẦN lúc mount: veil tắt sau đó không được kích hoạt lại animation vào.
  const [underVeil] = useState(arriving);

  const layout: CSSProperties = {
    flex: 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    ...style,
  };

  if (underVeil) return <div style={layout}>{children}</div>;

  return (
    <motion.div
      variants={reduce ? fade : wallpaperIn}
      initial="hidden"
      animate="visible"
      style={layout}
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

export function StageVeil({ show, target }: { show: boolean; target?: Phase | null }) {
  const reduce = useReducedMotion();
  const [slow, setSlow] = useState(false);
  const label = target ? PHASE_MAP[target].label : undefined;

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
          // Mốc ổn định để đo/kiểm chuyển cảnh (audit motion 20/07) — đừng đổi tên.
          data-stage-veil=""
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
