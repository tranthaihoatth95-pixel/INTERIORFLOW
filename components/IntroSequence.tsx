'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Presentation, Box, Users, ArrowRight, ChevronRight } from 'lucide-react';
import { easeApple } from '@/lib/motion';

/**
 * IntroSequence — màn giới thiệu điện ảnh trước khi đăng nhập.
 * Tự chạy qua các cảnh (auto-advance), có skip + progress, kết bằng CTA "Bắt đầu".
 * Vibe: tối, sâu, gradient trôi — "ngầu" nhưng tiết chế kiểu Apple.
 */

const SCENES = [
  {
    icon: Sparkles,
    kicker: 'InteriorFlow',
    title: 'Studio thiết kế,\nchảy bằng AI.',
    sub: 'Một canvas nối các bước — phác thảo, dựng ảnh, dàn slide, cộng tác. Không rời khỏi luồng.',
    orb: 'var(--accent)',
  },
  {
    icon: Box,
    kicker: 'Sketch → Photoreal',
    title: 'Từ nét phác\nđến phối cảnh thật.',
    sub: 'Kéo bản CAD/sketch vào, chọn phong cách, ra ảnh render nội thất giữ đúng hình khối. Đổi vật liệu, ánh sáng, upscale 4K — cả video walkthrough.',
    orb: '#5b8def',
  },
  {
    icon: Presentation,
    kicker: 'Concept → Deck',
    title: 'Ý tưởng thành\nbản thuyết trình.',
    sub: 'Nội dung concept + ảnh tham khảo (màu, brand, dàn trang) → slide 16:9 hoàn chỉnh, xuất PDF. Sạch bản quyền, tức thì.',
    orb: '#e0996b',
  },
  {
    icon: Users,
    kicker: 'Team · Realtime',
    title: 'Cả team,\nmột dòng chảy.',
    sub: 'Thư viện vật liệu dùng chung, chat nội bộ, credits theo người, share link cho khách. Tất cả trong một nơi.',
    orb: '#5bbf9a',
  },
];

const HOLD = 3200; // ms mỗi cảnh

export function IntroSequence({ onDone }: { onDone: () => void }) {
  const [i, setI] = useState(0);
  const last = i === SCENES.length - 1;
  const scene = SCENES[i];

  // auto-advance (dừng ở cảnh cuối để chờ CTA)
  useEffect(() => {
    if (last) return;
    const t = setTimeout(() => setI((v) => v + 1), HOLD);
    return () => clearTimeout(t);
  }, [i, last]);

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-[var(--bg)] px-6">
      {/* orb nền đổi màu theo cảnh */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`orb-${i}`}
          className="pointer-events-none absolute h-[42rem] w-[42rem] rounded-full blur-[120px]"
          style={{ background: scene.orb }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.22, scale: 1 }}
          exit={{ opacity: 0, scale: 1.1 }}
          transition={{ duration: 1.1, ease: easeApple }}
        />
      </AnimatePresence>

      {/* skip */}
      <button
        onClick={onDone}
        className="absolute right-5 top-5 z-20 rounded-full px-3 py-1.5 text-xs text-[var(--t4)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--t2)]"
      >
        Bỏ qua
      </button>

      {/* progress bar theo cảnh */}
      <div className="absolute left-1/2 top-6 z-20 flex -translate-x-1/2 gap-1.5">
        {SCENES.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setI(idx)}
            className="h-1 overflow-hidden rounded-full bg-[var(--border)]"
            style={{ width: idx === i ? 28 : 14 }}
          >
            {idx === i && (
              <motion.div
                key={`fill-${i}`}
                className="h-full rounded-full bg-[var(--accent)]"
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: last ? 0.4 : HOLD / 1000, ease: 'linear' }}
              />
            )}
            {idx < i && <div className="h-full w-full bg-[var(--accent)]" />}
          </button>
        ))}
      </div>

      {/* nội dung cảnh */}
      <div className="relative z-10 w-full max-w-xl text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 18, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -14, filter: 'blur(6px)' }}
            transition={{ duration: 0.55, ease: easeApple }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.4, ease: easeApple }}
              className="mx-auto mb-5 grid h-12 w-12 place-items-center rounded-[var(--radius-md)] ring-1 ring-[var(--mat-hairline)]"
              style={{ background: 'var(--mat-card)', boxShadow: 'var(--shadow-pop)' }}
            >
              <scene.icon size={22} style={{ color: scene.orb }} />
            </motion.div>

            <div className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--t4)]">
              {scene.kicker}
            </div>
            <h1 className="whitespace-pre-line text-[34px] font-semibold leading-[1.08] tracking-tight text-[var(--t1)] sm:text-[44px]">
              {scene.title}
            </h1>
            <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-[var(--t3)]">{scene.sub}</p>
          </motion.div>
        </AnimatePresence>

        {/* điều hướng */}
        <div className="mt-9 flex items-center justify-center">
          <AnimatePresence mode="wait">
            {last ? (
              <motion.button
                key="cta"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.3, ease: easeApple }}
                onClick={onDone}
                className="flex items-center gap-2 rounded-full bg-[var(--accent-strong)] px-6 py-3 text-sm font-medium text-white shadow-lg transition-colors hover:bg-[var(--accent)]"
              >
                Bắt đầu
                <ArrowRight size={16} />
              </motion.button>
            ) : (
              <motion.button
                key="next"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setI((v) => Math.min(v + 1, SCENES.length - 1))}
                className="flex items-center gap-1 rounded-full px-4 py-2 text-xs text-[var(--t4)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--t2)]"
              >
                Tiếp <ChevronRight size={14} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
