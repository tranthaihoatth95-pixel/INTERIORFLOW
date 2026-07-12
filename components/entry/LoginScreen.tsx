'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { easeApple } from '@/lib/motion';
import { useLang } from '@/lib/i18n';
import { LangToggle } from '@/components/LangToggle';
import { LoginForm } from '@/components/entry/LoginForm';

/**
 * LoginScreen — màn đăng nhập ĐỨNG RIÊNG, thay cho IntroSequence trong luồng chính
 * (Sprint 1 B-1: Login → Project Gallery, không còn intro điện ảnh chắn trước).
 *
 * Gu: giữ ngôn ngữ "đêm ấm" của intro cũ (quầng đồng blur + vignette, mono kicker,
 * sans tít lớn) nhưng tối giản — một cột, form vào thẳng việc. IntroSequence +
 * TitleSequence GIỮ NGUYÊN file (components/IntroSequence.tsx, components/intro/)
 * để khôi phục được khi chủ dự án có hình/video intro chính thức.
 */

const COPPER = '#c79a63';
const SANS = '-apple-system,"SF Pro Display","SF Pro Text","Helvetica Neue","Space Grotesk",system-ui,sans-serif';
const MONO = '"SF Mono","SFMono-Regular",ui-monospace,Menlo,monospace';

export function LoginScreen({ onAuthed }: { onAuthed: () => void }) {
  const reduce = useReducedMotion();
  const lang = useLang();
  const en = lang === 'en';

  return (
    <div className="relative min-h-[100dvh] overflow-hidden" style={{ background: 'var(--bg)' }}>
      {/* nền đêm ấm: quầng đồng trôi rất chậm + vignette điện ảnh (kế thừa intro) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute left-1/2 top-1/2 h-[54rem] w-[54rem] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ background: `radial-gradient(circle, ${COPPER} 0%, transparent 62%)`, filter: 'blur(90px)' }}
          initial={{ opacity: 0.06 }}
          animate={reduce ? { opacity: 0.08 } : { opacity: [0.05, 0.11, 0.05], scale: [1, 1.06, 1] }}
          transition={{ duration: 24, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(120% 92% at 50% 45%, transparent 38%, rgba(0,0,0,0.6) 100%)' }}
        />
      </div>

      {/* đổi ngôn ngữ — góc phải trên, ghost để hoà nền tối */}
      <div className="absolute right-6 top-6 z-30">
        <LangToggle variant="ghost" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-md flex-col items-center justify-center px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: reduce ? 0 : 16, filter: reduce ? 'blur(0px)' : 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.7, ease: easeApple }}
          className="flex w-full flex-col items-center text-center"
        >
          {/* logo + kicker */}
          <div className="mb-5 grid h-11 w-11 place-items-center rounded-[14px] bg-gradient-to-br from-violet-500 to-fuchsia-600 text-[17px] font-bold text-white shadow-sm">
            IF
          </div>
          <div
            className="flex items-center gap-3 text-[11px] uppercase text-[var(--t4)]"
            style={{ fontFamily: MONO, letterSpacing: '0.26em' }}
          >
            <span className="h-px w-6" style={{ background: 'var(--border)' }} />
            <span style={{ color: COPPER }}>InteriorFlow</span>
            <span className="h-px w-6" style={{ background: 'var(--border)' }} />
          </div>

          <h1
            className="mt-4 text-[32px] font-semibold leading-[1.06] text-[var(--t1)] sm:text-[38px]"
            style={{ fontFamily: SANS, letterSpacing: '-0.028em' }}
          >
            {en ? 'Begin your flow.' : 'Bắt đầu dòng chảy của bạn.'}
          </h1>
          <p className="mt-3 max-w-sm text-[14px] leading-relaxed text-[var(--t3)]" style={{ fontFamily: SANS }}>
            {en
              ? 'Sign in to open your projects — Layout CAD · Render · Present, one canvas.'
              : 'Đăng nhập để mở dự án của bạn — Layout CAD · Render · Present, một dòng chảy.'}
          </p>

          {/* form dùng chung (Google @ttt.vn nổi bật + tài khoản admin cấp + Ghi nhớ) */}
          <div className="flex w-full justify-center text-left">
            <LoginForm onAuthed={onAuthed} reduce={!!reduce} lang={lang} />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
