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
 *
 * PORTAL RA document.body (bắt buộc, đúng luật K4 `docs/00-CHOT.md`: "panel kính nổi PHẢI
 * portal, không lồng trong chrome kính") — `<header className="nen-mo-header">` có
 * `backdrop-filter` (app/globals.css), mà `backdrop-filter`/`filter` trên tổ tiên biến nó
 * thành containing block MỚI cho mọi con `position:fixed` (đặc tả CSS) — lồng trực tiếp trong
 * header sẽ bị bó khung theo header thay vì phủ hết viewport (bắt được lúc verify browser thật:
 * lockscreen chỉ hiện 1 mẩu ở góc trên thay vì phủ kín màn hình).
 */

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Lock } from 'lucide-react';
import { useFlowStore } from '@/lib/store';
import { useLockScreen } from '@/lib/lockscreen';
import { LoginForm } from '@/components/entry/LoginForm';
import { useLang, useT } from '@/lib/i18n';
import { easeApple, springPop } from '@/lib/motion';

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

/**
 * Dòng động lực trong ngày (Hoà đặt 14/08) — cố định theo NGÀY TRONG NĂM (không random mỗi lần
 * khoá, để cả ngày thấy 1 câu, đổi qua ngày mới mới đổi câu). Tuyển 12 câu ngắn đúng tông
 * "quiet luxury" của gu Hoà (docs bên trong: user_gu-hoa-visual) — về nghề, không sáo rỗng kiểu
 * poster động lực chung chung.
 */
const DAILY_LINES: [string, string][] = [
  ['Bản vẽ đẹp nhất là bản vẽ đo được.', 'The most beautiful drawing is the one that measures true.'],
  ['Ánh sáng kể giờ, vật liệu kể chất.', 'Light tells the hour, material tells the truth.'],
  ['Chi tiết là nơi sự tôn trọng hiện ra.', 'Detail is where respect becomes visible.'],
  ['Một nguồn sự thật, ba cách nhìn.', 'One source of truth, three ways of seeing.'],
  ['Không gian tốt bắt đầu từ ràng buộc rõ.', 'Good space begins with a clear constraint.'],
  ['Sự đơn giản là kết quả, không phải điểm xuất phát.', 'Simplicity is a result, not a starting point.'],
  ['Đo hai lần, dựng một lần.', 'Measure twice, build once.'],
  ['Vật liệu thật không cần tô vẽ thêm.', 'True material needs no further ornament.'],
  ['Tỉ lệ đúng thắng mọi trang trí.', 'Right proportion outlasts every decoration.'],
  ['Bản vẽ là lời hứa với người thi công.', 'A drawing is a promise kept to the builder.'],
  ['Nghề nội thất là quản lý ánh sáng và bóng đổ.', 'Interior design is the management of light and shadow.'],
  ['Chậm mà đúng, còn hơn nhanh mà phải sửa lại.', 'Slow and right beats fast and redone.'],
];
function dailyLine(): [string, string] {
  const dayOfYear = Math.floor(
    (Date.UTC(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()) -
      Date.UTC(new Date().getFullYear(), 0, 0)) /
      86_400_000,
  );
  return DAILY_LINES[dayOfYear % DAILY_LINES.length];
}

export function LockScreen() {
  const locked = useLockScreen((s) => s.locked);
  const unlock = useLockScreen((s) => s.unlock);
  const flowName = useFlowStore((s) => s.flowName);
  const reduce = useReducedMotion();
  const lang = useLang();
  const tr = useT();
  const time = useClock();
  const [line, setLine] = useState<[string, string] | null>(null);
  useEffect(() => {
    if (locked) setLine(dailyLine());
  }, [locked]);

  if (typeof document === 'undefined') return null;

  return createPortal(
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
            {/* Dòng động lực trong ngày (Hoà đặt 14/08) — cố định theo ngày, không sáo rỗng.
             * ⚠️ Chỗ icon thông báo/mail Hoà nhắc CHƯA thêm ở đây — app chưa có hệ Notification/Mail
             * thật (grep model Notification/Mail = 0), gắn icon lúc này sẽ là nút giả không nối gì
             * cả — trái luật cứng "không có nút thì không có AI/không hiện nút giả". Chờ Hoà xác
             * nhận icon đó nối vào hệ thật nào rồi mới thêm. */}
            {line && <div className="mt-3 max-w-[280px] text-[12px] italic leading-snug text-[var(--t3)]">{tr(line[0], line[1])}</div>}
          </div>

          <motion.div
            className="mt-8"
            style={{ transformPerspective: 1000 }}
            initial={{ opacity: 0, rotateX: -55, scale: 0.94 }}
            animate={{ opacity: 1, rotateX: 0, scale: 1 }}
            transition={reduce ? { duration: 0 } : springPop}
          >
            <LoginForm onAuthed={unlock} reduce={!!reduce} lang={lang} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
