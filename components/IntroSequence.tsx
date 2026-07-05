'use client';

import { useEffect, useReducer } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { easeApple } from '@/lib/motion';

/**
 * IntroSequence — màn giới thiệu điện ảnh trước khi đăng nhập.
 * Tự chạy qua 4 cảnh (auto-advance), có skip + progress, kết bằng CTA "Bắt đầu".
 * Gu: quiet-luxury warm stone — nền đêm ấm, chữ serif biên tập, accent đồng tiết chế.
 * Tĩnh, tiết chế, nhiều khoảng trống — tôn trọng prefers-reduced-motion.
 */

// Token cục bộ (khai báo inline theo brand đích — warm stone, đồng #C79A63)
const COPPER = '#c79a63';
const SERIF = '"Didot","Hoefler Text",Georgia,serif';
const MONO = '"SF Mono","SFMono-Regular",ui-monospace,Menlo,monospace';

const SCENES = [
  {
    no: '01',
    kicker: 'InteriorFlow',
    title: 'Studio thiết kế,\nchảy bằng AI.',
    sub: 'Một canvas nối liền mọi bước — phác thảo, dựng ảnh, dàn slide, cộng tác. Không rời khỏi luồng.',
  },
  {
    no: '02',
    kicker: 'Sketch → Photoreal',
    title: 'Từ nét phác\nđến phối cảnh thật.',
    sub: 'Kéo bản CAD hoặc sketch vào, chọn phong cách, nhận ảnh render giữ đúng hình khối. Đổi vật liệu, ánh sáng, upscale 4K.',
  },
  {
    no: '03',
    kicker: 'Concept → Deck',
    title: 'Ý tưởng thành\nbản thuyết trình.',
    sub: 'Concept và ảnh tham khảo hoá thành slide 16:9 hoàn chỉnh, xuất PDF. Sạch bản quyền, tức thì.',
  },
  {
    no: '04',
    kicker: 'Team · Realtime',
    title: 'Cả team,\nmột dòng chảy.',
    sub: 'Thư viện vật liệu dùng chung, chat nội bộ, credits theo người, share link cho khách. Tất cả trong một nơi.',
  },
];

const HOLD = 4200; // ms mỗi cảnh — nhịp chậm, điện ảnh

export function IntroSequence({ onDone }: { onDone: () => void }) {
  const [i, setI] = useReducer((_: number, v: number) => v, 0);
  const reduce = useReducedMotion();
  const last = i === SCENES.length - 1;
  const scene = SCENES[i];

  // auto-advance (dừng ở cảnh cuối để chờ CTA)
  useEffect(() => {
    if (last) return;
    const t = setTimeout(() => setI(i + 1), HOLD);
    return () => clearTimeout(t);
  }, [i, last]);

  return (
    <div
      className="relative grid min-h-screen place-items-center overflow-hidden px-6"
      style={{ background: 'var(--bg)' }}
    >
      {/* Nền đêm ấm: một quầng đồng duy nhất trôi rất chậm + vignette tĩnh */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute left-1/2 top-1/2 h-[52rem] w-[52rem] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            background: `radial-gradient(circle, ${COPPER} 0%, transparent 62%)`,
            filter: 'blur(80px)',
          }}
          initial={{ opacity: 0.06 }}
          animate={reduce ? { opacity: 0.08 } : { opacity: [0.06, 0.11, 0.06], scale: [1, 1.06, 1] }}
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* vignette ép vào giữa cho chiều sâu điện ảnh */}
        <div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(120% 90% at 50% 45%, transparent 40%, rgba(0,0,0,0.55) 100%)' }}
        />
        {/* hairline chân trời rất mờ — cảm giác không gian */}
        <div
          className="absolute left-0 right-0 top-1/2 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(199,154,99,0.14), transparent)' }}
        />
      </div>

      {/* skip */}
      <button
        onClick={onDone}
        className="absolute right-6 top-6 z-20 rounded-full px-3 py-1.5 text-[11px] uppercase tracking-[0.18em] text-[var(--t4)] transition-colors hover:text-[var(--t2)]"
        style={{ fontFamily: MONO }}
      >
        Bỏ qua
      </button>

      {/* progress — vạch mảnh, tinh, đồng */}
      <div className="absolute left-1/2 top-7 z-20 flex -translate-x-1/2 gap-2">
        {SCENES.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setI(idx)}
            aria-label={`Cảnh ${idx + 1}`}
            className="h-[3px] overflow-hidden rounded-full transition-all duration-500"
            style={{ width: idx === i ? 32 : 16, background: 'rgba(199,154,99,0.18)' }}
          >
            {idx === i && (
              <motion.div
                key={`fill-${i}`}
                className="h-full rounded-full"
                style={{ background: COPPER }}
                initial={{ width: reduce ? '100%' : '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: last || reduce ? 0.4 : HOLD / 1000, ease: 'linear' }}
              />
            )}
            {idx < i && <div className="h-full w-full" style={{ background: COPPER }} />}
          </button>
        ))}
      </div>

      {/* nội dung cảnh */}
      <div className="relative z-10 w-full max-w-2xl text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={i}
            initial={{ opacity: 0, y: reduce ? 0 : 16, filter: reduce ? 'blur(0px)' : 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: reduce ? 0 : -12, filter: reduce ? 'blur(0px)' : 'blur(8px)' }}
            transition={{ duration: 0.7, ease: easeApple }}
          >
            {/* số cảnh + kicker trên một hàng nhãn tinh */}
            <div
              className="mb-6 flex items-center justify-center gap-3 text-[11px] uppercase text-[var(--t4)]"
              style={{ fontFamily: MONO, letterSpacing: '0.26em' }}
            >
              <span style={{ color: COPPER }}>{scene.no}</span>
              <span className="h-px w-6" style={{ background: 'var(--border)' }} />
              <span>{scene.kicker}</span>
            </div>

            <h1
              className="whitespace-pre-line text-[40px] font-normal leading-[1.05] text-[var(--t1)] sm:text-[60px]"
              style={{ fontFamily: SERIF, letterSpacing: '-0.01em' }}
            >
              {scene.title}
            </h1>
            <p className="mx-auto mt-6 max-w-lg text-[15px] leading-relaxed text-[var(--t3)]">
              {scene.sub}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* điều hướng */}
        <div className="mt-12 flex h-12 items-center justify-center">
          <AnimatePresence mode="wait">
            {last ? (
              <motion.button
                key="cta"
                initial={{ opacity: 0, y: reduce ? 0 : 8 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={reduce ? undefined : { scale: 1.02 }}
                whileTap={reduce ? undefined : { scale: 0.98 }}
                transition={{ duration: 0.4, ease: easeApple }}
                onClick={onDone}
                className="group flex items-center gap-2.5 rounded-full px-7 py-3 text-sm font-medium text-[var(--bg)] transition-colors"
                style={{ background: COPPER }}
              >
                Bắt đầu
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
              </motion.button>
            ) : (
              <motion.button
                key="next"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setI(Math.min(i + 1, SCENES.length - 1))}
                className="text-[11px] uppercase tracking-[0.2em] text-[var(--t4)] transition-colors hover:text-[var(--t2)]"
                style={{ fontFamily: MONO }}
              >
                Tiếp →
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
