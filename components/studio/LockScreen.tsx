'use client';

/**
 * components/studio/LockScreen.tsx — VIỆC 3 UI (04/08, docs/SO-KIEM-TONG.md). Màn khoá kiểu
 * macOS: làm mờ nội dung phía sau (backdrop-blur trên overlay full-viewport) + tên dự án đang
 * mở + đồng hồ sống + mở khoá.
 *
 * MỞ KHOÁ = ĐĂNG NHẬP LẠI — nhúng thẳng `LoginForm` (đường auth CÓ SẴN của app, không tự chế
 * cơ chế mật khẩu/PIN nào). `onAuthed` gọi `unlock()`, KHÔNG điều hướng đi đâu — người dùng ở
 * nguyên route đang khoá, y hệt macOS (mở khoá xong về đúng màn hình cũ).
 *
 * z-[99] — CAO HƠN mọi overlay khác trong app (LeaveConfirmBar/WelcomeIntro dùng z-[95]) vì đây
 * là lớp chặn TOÀN BỘ tương tác, phải luôn ở trên cùng. Mount 1 lần trong AppChrome.tsx (nơi
 * `useLockScreen` cũng được đọc để bật/tắt phím ⌃⌘Q + hẹn giờ tự khoá — xem AppChrome.tsx).
 */

import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Lock } from 'lucide-react';
import { useFlowStore } from '@/lib/store';
import { useLockScreen } from '@/lib/lockscreen';
import { LoginForm } from '@/components/entry/LoginForm';
import { useLang, useT } from '@/lib/i18n';
import { easeApple } from '@/lib/motion';

function useClock(): string {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  if (!now) return '--:--:--';
  return now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function LockScreen() {
  const locked = useLockScreen((s) => s.locked);
  const unlock = useLockScreen((s) => s.unlock);
  const flowName = useFlowStore((s) => s.flowName);
  const reduce = useReducedMotion();
  const lang = useLang();
  const tr = useT();
  const time = useClock();

  return (
    <AnimatePresence>
      {locked && (
        <motion.div
          data-lockscreen-root
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0 : 0.25, ease: easeApple }}
          className="fixed inset-0 z-[99] flex flex-col items-center justify-center overflow-y-auto py-10"
          style={{ background: 'color-mix(in srgb, var(--bg) 55%, transparent)', backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)' }}
        >
          <div className="flex flex-col items-center gap-1.5 text-center">
            <div
              className="mb-2 grid h-11 w-11 place-items-center rounded-full"
              style={{ background: 'var(--panel)', border: '1px solid var(--border)' }}
            >
              <Lock size={18} className="text-[var(--t2)]" />
            </div>
            <div className="text-[42px] font-semibold tabular-nums leading-none text-[var(--t1)]">{time}</div>
            <div className="mt-1 text-[13px] text-[var(--t3)]">
              {tr('Đã khoá', 'Locked')} · <span className="text-[var(--t2)]">{flowName || tr('Dự án', 'Project')}</span>
            </div>
          </div>

          <div className="mt-8">
            <LoginForm onAuthed={unlock} reduce={!!reduce} lang={lang} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
