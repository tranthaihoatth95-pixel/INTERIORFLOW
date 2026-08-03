'use client';

/**
 * components/studio/LeaveConfirmBar.tsx — hộp hỏi nổi khi rời trang lúc còn thay đổi CHƯA LƯU
 * (VIỆC 1 UI, 04/08). Đọc/ghi `useLeaveConfirm` (`lib/resume.ts`) — chỗ duy nhất kích hoạt là
 * `goHomeConfirmed()`. Mount MỘT LẦN trong `AppChrome` (universal mọi route), portal ra
 * `document.body` giống `AppLogoMenu`/`AccountMenu` — không phụ thuộc vị trí nút bấm gọi nó.
 *
 * Không dùng `window.confirm` (chặn thread JS, treo webview nhúng) — cùng lý do `ConfirmBar` ở
 * `CadEditor.tsx` đã thay, đây là bản portal-toàn-cục của cùng ý tưởng.
 */

import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useLeaveConfirm } from '@/lib/resume';
import { useT } from '@/lib/i18n';
import { easeApple } from '@/lib/motion';

export function LeaveConfirmBar() {
  const pending = useLeaveConfirm((s) => s.pending);
  const confirm = useLeaveConfirm((s) => s.confirm);
  const cancel = useLeaveConfirm((s) => s.cancel);
  const tr = useT();

  return typeof document === 'undefined'
    ? null
    : createPortal(
        <AnimatePresence>
          {pending && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.18, ease: easeApple }}
              onKeyDown={(e) => e.key === 'Escape' && cancel()}
              style={{ position: 'fixed', top: 56, left: '50%', transform: 'translateX(-50%)' }}
              className="mat-panel z-[95] max-w-[420px] rounded-[12px] border border-[var(--border)] p-3 shadow-xl"
            >
              <div className="mb-2.5 text-[12.5px] text-[var(--t1)]">
                {tr(
                  'Đang có thay đổi chưa lưu xong. Rời trang bây giờ?',
                  'Some changes are still being saved. Leave anyway?',
                )}
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={cancel}
                  className="rounded-[8px] border border-[var(--border)] px-3 py-1 text-[12px] text-[var(--t3)]"
                >
                  {tr('Ở lại', 'Stay')}
                </button>
                <button
                  type="button"
                  autoFocus
                  onClick={confirm}
                  className="rounded-[8px] border-none bg-[var(--accent)] px-3 py-1 text-[12px] text-white"
                >
                  {tr('Rời trang', 'Leave')}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      );
}
