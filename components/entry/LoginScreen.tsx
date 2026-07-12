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

/**
 * LoginScreen — màn đăng nhập ĐỨNG RIÊNG, thay cho IntroSequence trong luồng chính
 * (Sprint 1 B-1: Login → Project Gallery, không còn intro điện ảnh chắn trước).
 *
 * Sprint 2 (C-1/C-2/C-4):
 * - Nền ĐỘNG user tự đổi (LoginBackdrop): preset gradient trôi chậm / ảnh riêng
 *   Ken Burns, lưu localStorage; mặc định giữ "đêm ấm" quầng đồng của intro cũ.
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

      {/* C-2: nút đổi nền — góc phải dưới */}
      <LoginBackdropPicker choice={choice} onPick={pick} lang={lang} />

      <div className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-md flex-col items-center justify-center px-6 py-16">
        <motion.div initial="hidden" animate="visible" className="flex w-full flex-col items-center text-center">
          {/* logo + kicker — element nhỏ, biên độ nhỏ */}
          <motion.div
            variants={rise(amp(12), 0.05)}
            className="mb-5 grid h-11 w-11 place-items-center rounded-[14px] bg-gradient-to-br from-violet-500 to-fuchsia-600 text-[17px] font-bold text-white shadow-sm"
          >
            IF
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
    </div>
  );
}
