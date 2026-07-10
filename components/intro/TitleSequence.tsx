'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { easeApple, staggerList, staggerItem } from '@/lib/motion';
import { useLang } from '@/lib/i18n';

/**
 * TitleSequence — MÀN INTRO điện ảnh (title-sequence ~6s) mở đầu app.
 *
 * Cảm giác như đoạn credits mở phim: 3 ảnh hero nội thất THẬT chuyển cảnh mượt
 * với hiệu ứng Ken Burns (pan + zoom chậm), overlay tối dần cho chữ đọc được,
 * brand + tagline hiện theo nhịp (staggered) rồi mờ dần nhường chỗ.
 *
 * KHÔNG file video — mọi thứ là ảnh tĩnh + motion. Tự kết thúc sau ~6s hoặc bấm
 * bất kỳ / nút "Bỏ qua" để vào ngay. Gọi onFinish() đúng một lần khi xong —
 * IntroSequence dùng nó để chuyển sang phần kể chuyện + đăng nhập (giữ nguyên).
 *
 * Tôn trọng Reduce Motion: bỏ Ken Burns, rút còn 1 ảnh + fade tĩnh nhanh (~1.6s).
 * Chữ dùng font-sans toàn app (Be Vietnam Pro) — không import webfont riêng.
 */

const COPPER = '#c79a63';

// Ảnh hero THẬT trong public/detech — quiet-luxury: tháp hạng A → sảnh khách sạn → lounge resort.
// kb = vector Ken Burns (điểm đầu → cuối) để mỗi cảnh trôi một hướng, không lặp.
type Shot = {
  src: string;
  kb: { s0: number; s1: number; x0: number; y0: number; x1: number; y1: number };
};

const SHOTS: Shot[] = [
  { src: '/detech/tower-dusk.png', kb: { s0: 1.12, s1: 1.26, x0: -14, y0: -8, x1: 14, y1: 8 } },
  { src: '/detech/lobby-water.png', kb: { s0: 1.14, s1: 1.24, x0: 16, y0: 10, x1: -12, y1: -6 } },
  { src: '/detech/lounge-green.png', kb: { s0: 1.1, s1: 1.24, x0: -10, y0: 8, x1: 12, y1: -10 } },
];

const HOLD = 2000; // ms mỗi cảnh → 3 cảnh ≈ 6s

export function TitleSequence({ onFinish }: { onFinish: () => void }) {
  const reduce = useReducedMotion();
  const lang = useLang();
  const en = lang === 'en';
  const [idx, setIdx] = useState(0);
  const [outro, setOutro] = useState(false); // chữ bắt đầu mờ đi ở cuối
  const done = useRef(false);

  const finish = useCallback(() => {
    if (done.current) return;
    done.current = true;
    onFinish();
  }, [onFinish]);

  useEffect(() => {
    if (reduce) {
      const t = setTimeout(finish, 1600);
      return () => clearTimeout(t);
    }
    if (idx < SHOTS.length - 1) {
      const t = setTimeout(() => setIdx((v) => v + 1), HOLD);
      return () => clearTimeout(t);
    }
    // cảnh cuối: chữ mờ đi trước, rồi kết thúc
    const tOut = setTimeout(() => setOutro(true), HOLD - 650);
    const tEnd = setTimeout(finish, HOLD);
    return () => {
      clearTimeout(tOut);
      clearTimeout(tEnd);
    };
  }, [idx, reduce, finish]);

  const total = reduce ? 1600 : SHOTS.length * HOLD;
  const shot = SHOTS[reduce ? 0 : idx];

  return (
    <motion.div
      onClick={finish}
      role="button"
      aria-label={en ? 'Skip intro' : 'Bỏ qua đoạn mở đầu'}
      className="font-sans fixed inset-0 z-50 flex cursor-pointer select-none items-end overflow-hidden"
      style={{ height: '100dvh', background: '#0b0a09' }}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.7, ease: easeApple }}
    >
      {/* KHUNG HÌNH — Ken Burns crossfade */}
      <AnimatePresence>
        <motion.div
          key={reduce ? 'still' : idx}
          className="absolute inset-0"
          initial={{ opacity: reduce ? 1 : 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0.5 : 1.1, ease: easeApple }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <motion.img
            src={shot.src}
            alt=""
            aria-hidden
            draggable={false}
            className="h-full w-full object-cover"
            initial={
              reduce
                ? { scale: 1.04 }
                : { scale: shot.kb.s0, x: shot.kb.x0, y: shot.kb.y0 }
            }
            animate={
              reduce ? { scale: 1.04 } : { scale: shot.kb.s1, x: shot.kb.x1, y: shot.kb.y1 }
            }
            transition={{ duration: reduce ? 0 : HOLD / 1000 + 1.2, ease: 'linear' }}
          />
        </motion.div>
      </AnimatePresence>

      {/* overlay điện ảnh: tối đáy cho chữ đọc + vignette + ngả đồng ấm */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(11,10,9,0.55) 0%, rgba(11,10,9,0.12) 34%, rgba(11,10,9,0.55) 72%, rgba(11,10,9,0.94) 100%)',
        }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(125% 100% at 50% 42%, transparent 46%, rgba(0,0,0,0.6) 100%)' }}
      />
      <div
        className="pointer-events-none absolute inset-0 mix-blend-soft-light"
        style={{ background: `radial-gradient(90% 70% at 22% 30%, ${COPPER}, transparent 60%)`, opacity: 0.14 }}
      />

      {/* nút Bỏ qua — góc phải trên */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          finish();
        }}
        className="absolute right-5 top-5 z-20 rounded-full border px-4 py-2 text-[11px] uppercase tracking-[0.2em] text-white/70 transition-colors hover:text-white"
        style={{ borderColor: 'rgba(255,255,255,0.16)', background: 'rgba(0,0,0,0.22)', backdropFilter: 'blur(6px)' }}
      >
        {en ? 'Skip' : 'Bỏ qua'}
      </button>

      {/* CHỮ — brand + tagline, hiện theo nhịp, cuối cùng mờ nhường chỗ */}
      <motion.div
        className="relative z-10 mx-auto w-full max-w-5xl px-8 pb-16 sm:pb-20"
        animate={{ opacity: outro ? 0 : 1, y: outro ? (reduce ? 0 : -10) : 0 }}
        transition={{ duration: 0.6, ease: easeApple }}
      >
        <motion.div variants={staggerList} initial="hidden" animate="visible">
          <motion.div
            variants={staggerItem}
            className="mb-4 flex items-center gap-3 text-[11px] uppercase tracking-[0.32em] text-white/60"
          >
            <span className="h-px w-8" style={{ background: COPPER }} />
            {en ? 'TTT · Creative Studio' : 'TTT · Xưởng sáng tạo'}
          </motion.div>

          {/* Brand — reveal blur/rise, tinh gọn quiet-luxury */}
          <motion.h1
            initial={{ opacity: 0, y: reduce ? 0 : 22, filter: reduce ? 'blur(0px)' : 'blur(12px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: reduce ? 0.4 : 1, ease: easeApple, delay: reduce ? 0 : 0.25 }}
            className="text-[15vw] font-semibold leading-[0.92] tracking-[-0.03em] text-white sm:text-[92px] md:text-[112px]"
          >
            Interior<span style={{ color: COPPER }}>Flow</span>
          </motion.h1>

          <motion.p
            variants={staggerItem}
            className="mt-5 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg"
          >
            {en
              ? 'From idea to rendering — in one continuous flow.'
              : 'Từ ý tưởng đến phối cảnh — một mạch, không rời canvas.'}
          </motion.p>
        </motion.div>
      </motion.div>

      {/* thanh tiến độ cinematic dưới đáy — chạy hết ~total rồi tự kết thúc */}
      <div className="absolute inset-x-0 bottom-0 z-20 h-[3px] bg-white/10">
        <motion.div
          className="h-full"
          style={{ background: COPPER }}
          initial={{ width: '0%' }}
          animate={{ width: '100%' }}
          transition={{ duration: total / 1000, ease: 'linear' }}
        />
      </div>
    </motion.div>
  );
}
