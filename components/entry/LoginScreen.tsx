'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { rise } from '@/lib/motion';
import { useLang } from '@/lib/i18n';
import { LangToggle } from '@/components/LangToggle';
import { LoginForm } from '@/components/entry/LoginForm';
import {
  LoginBackdropLayer,
  LoginBackdropPicker,
  useLoginBackdrop,
} from '@/components/entry/LoginBackdrop';
import { IFLogo } from '@/components/entry/IFLogo';

/**
 * LoginScreen — màn đăng nhập ĐỨNG RIÊNG, thay cho IntroSequence trong luồng chính
 * (Sprint 1 B-1: Login → Project Gallery, không còn intro điện ảnh chắn trước).
 *
 * Sprint 2 (C-1/C-2/C-4):
 * - Nền ĐỘNG user tự đổi (LoginBackdrop): preset gradient trôi chậm / ảnh riêng
 *   Ken Burns, lưu localStorage; 19/07 login-minimal — MẶC ĐỊNH (chưa lưu lựa chọn)
 *   là TRÌNH CHIẾU bộ 30 ảnh TTT ("như vậy trước để thấy độ đẹp").
 * - data-login-tone: nền tối/sáng ép bộ biến chữ tương ứng (globals.css) — chữ
 *   luôn đọc được bất kể theme app.
 * - Hero vào màn theo ADAPTIVE AMPLITUDE (lib/motion.ts rise()): tít lớn bay 28px,
 *   kicker nhỏ chỉ 10px — cả màn lắng xuống như một khối, không đều tăm tắp.
 */

const COPPER = '#c79a63';
const SANS = '-apple-system,"SF Pro Display","SF Pro Text","Helvetica Neue","Space Grotesk",system-ui,sans-serif';
const MONO = '"SF Mono","SFMono-Regular",ui-monospace,Menlo,monospace';

export function LoginScreen({ onAuthed }: { onAuthed: () => void }) {
  const reduce = useReducedMotion();
  const lang = useLang();
  const en = lang === 'en';
  const { choice, pick, tone } = useLoginBackdrop();

  // reduce motion → mọi rise() về amplitude 0 (chỉ còn fade)
  const amp = (px: number) => (reduce ? 0 : px);

  return (
    <div
      className="relative min-h-[100dvh] overflow-hidden"
      style={{ background: 'var(--bg)' }}
      data-login-tone={tone === 'auto' ? undefined : tone}
    >
      {/* C-2: nền động (preset / ảnh riêng) — thay khối quầng đồng hardcode cũ */}
      <LoginBackdropLayer choice={choice} reduce={!!reduce} />

      {/* đổi ngôn ngữ — góc phải trên, ghost để hoà nền */}
      <div className="absolute right-6 top-6 z-30">
        <LangToggle variant="ghost" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-md flex-col items-center justify-center px-6 py-16">
        <motion.div initial="hidden" animate="visible" className="flex w-full flex-col items-center text-center">
          {/* logo + kicker — element nhỏ, biên độ nhỏ.
              19/07 login-minimal: monogram IF mới (IFLogo, đơn sắc hairline) thay badge
              tím-hồng cũ — CHỈ ở màn login; Header/MobileMenu/share vẫn badge cũ, chờ user chốt. */}
          <motion.div
            variants={rise(amp(12), 0.05)}
            className="mb-5 text-[var(--t1)]"
            style={{ filter: 'drop-shadow(0 1px 10px rgba(0,0,0,0.28))' }}
          >
            <IFLogo size={46} variant="framed" />
          </motion.div>
          <motion.div
            variants={rise(amp(10), 0.1)}
            className="flex items-center gap-3 text-[11px] uppercase text-[var(--t4)]"
            style={{ fontFamily: MONO, letterSpacing: '0.26em' }}
          >
            <span className="h-px w-6" style={{ background: 'var(--border)' }} />
            <span style={{ color: COPPER }}>InteriorFlow</span>
            <span className="h-px w-6" style={{ background: 'var(--border)' }} />
          </motion.div>

          {/* hero title — element to nhất, biên độ lớn nhất + blur-in */}
          <motion.h1
            variants={rise(amp(28), 0, !reduce)}
            className="mt-4 text-[32px] font-semibold leading-[1.06] text-[var(--t1)] sm:text-[38px]"
            style={{ fontFamily: SANS, letterSpacing: '-0.028em' }}
          >
            {en ? 'Begin your flow.' : 'Bắt đầu dòng chảy của bạn.'}
          </motion.h1>
          <motion.p
            variants={rise(amp(16), 0.08)}
            className="mt-3 max-w-sm text-[14px] leading-relaxed text-[var(--t3)]"
            style={{ fontFamily: SANS }}
          >
            {en
              ? 'Sign in to open your projects — Layout CAD · Render · Present, one canvas.'
              : 'Đăng nhập để mở dự án của bạn — Layout CAD · Render · Present, một dòng chảy.'}
          </motion.p>

          {/* form kính (C-1) — element vừa, biên độ vừa */}
          <motion.div variants={rise(amp(18), 0.14)} className="flex w-full justify-center text-left">
            <LoginForm onAuthed={onAuthed} reduce={!!reduce} lang={lang} />
          </motion.div>
        </motion.div>
      </div>

      {/* C-2: nút đổi nền — góc phải dưới. Đặt SAU form đăng nhập trong DOM (dù vị trí
          nhìn thấy vẫn là góc phải-dưới nhờ `position: absolute`) để Tab đi qua form
          đăng nhập chính (Google/Apple/email) TRƯỚC, nút phụ trợ này sau — trước đây
          nằm trước form nên Tab nhảy ra góc màn hình rồi mới quay lại form. */}
      <LoginBackdropPicker choice={choice} onPick={pick} lang={lang} />
    </div>
  );
}
