'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { easeApple, springStage } from '@/lib/motion';
import { useLang } from '@/lib/i18n';

/**
 * TitleSequence — MÀN INTRO "spatial gallery" kiểu visionOS (~7s) mở đầu app.
 *
 * Gu: Safari Art Museum trên visionOS — một card kính TRUNG TÂM treo giữa
 * không gian chứa ảnh render nội thất thật + caption kính, các card hai bên
 * xếp lớp 3D (rotateY, mờ + tối dần vào chiều sâu), nền phòng gallery blur
 * sâu như DOF. Thanh kính trên cùng (kiểu thanh URL visionOS) mang brand
 * "InteriorFlow" + tagline; chip pill kính dưới ghi "TTT · Creative Studio".
 *
 * Carousel tự trôi mỗi ~2.5s (spring xoay lớp + crossfade caption). Tự kết
 * thúc sau ~7s hoặc bấm bất kỳ / nút "Bỏ qua" — fade mượt rồi gọi onFinish()
 * đúng MỘT lần. IntroSequence dùng nó để chuyển sang phần kể chuyện + đăng
 * nhập (giữ nguyên luồng auth cũ).
 *
 * Reduce Motion: bố cục tĩnh (không spring/trôi), fade nhanh ~1.5s.
 * Chữ dùng font-sans toàn app (Be Vietnam Pro) — không import webfont riêng.
 */

const COPPER = '#c79a63';

type Work = {
  src: string;
  title: { vi: string; en: string };
  meta: { vi: string; en: string };
};

// 6 "bức tranh" — ảnh render THẬT trong public/detech, quiet-luxury.
const WORKS: Work[] = [
  {
    src: '/detech/lobby-water.png',
    title: { vi: 'Sảnh khách sạn 5★', en: 'Five-star hotel lobby' },
    meta: { vi: 'Đá travertine · Mặt nước tĩnh', en: 'Travertine · Still water' },
  },
  {
    src: '/detech/tower-dusk.png',
    title: { vi: 'Tháp hạng A lúc hoàng hôn', en: 'Grade-A tower at dusk' },
    meta: { vi: 'Kiến trúc · Ánh đồng', en: 'Architecture · Copper light' },
  },
  {
    src: '/detech/apt-1.png',
    title: { vi: 'Penthouse', en: 'Penthouse' },
    meta: { vi: 'Căn hộ · Gỗ óc chó', en: 'Residence · Walnut' },
  },
  {
    src: '/detech/wellness.png',
    title: { vi: 'Wellness & Spa', en: 'Wellness & Spa' },
    meta: { vi: 'Thư giãn · Đá ấm', en: 'Calm · Warm stone' },
  },
  {
    src: '/detech/pool-zen.png',
    title: { vi: 'Hồ bơi thiền', en: 'Zen pool' },
    meta: { vi: 'Resort · Đường nước', en: 'Resort · Waterline' },
  },
  {
    src: '/detech/lounge-green.png',
    title: { vi: 'Lounge xanh', en: 'Green lounge' },
    meta: { vi: 'Sảnh chờ · Mảng cây', en: 'Lounge · Greenery' },
  },
];

const STEP = 2500; // ms mỗi lượt card trung tâm đổi
const TOTAL = 7200; // ms tự kết thúc (≈ 3 lượt)
const REDUCE_TOTAL = 1500; // reduce-motion: tĩnh + fade nhanh

// Pose 3D theo vị trí tương đối so với card trung tâm (offset -2..2).
type Pose = {
  x: string;
  rotateY: number;
  scale: number;
  opacity: number;
  filter: string;
  zIndex: number;
};

const POSES: Record<number, Pose> = {
  [-2]: { x: '-138%', rotateY: 42, scale: 0.7, opacity: 0.32, filter: 'brightness(0.55) blur(2.5px)', zIndex: 1 },
  [-1]: { x: '-76%', rotateY: 30, scale: 0.84, opacity: 0.68, filter: 'brightness(0.72) blur(1px)', zIndex: 2 },
  [0]: { x: '0%', rotateY: 0, scale: 1, opacity: 1, filter: 'brightness(1) blur(0px)', zIndex: 3 },
  [1]: { x: '76%', rotateY: -30, scale: 0.84, opacity: 0.68, filter: 'brightness(0.72) blur(1px)', zIndex: 2 },
  [2]: { x: '138%', rotateY: -42, scale: 0.7, opacity: 0.32, filter: 'brightness(0.55) blur(2.5px)', zIndex: 1 },
};

/** Card ngoài tầm nhìn (|offset| > 2) — trượt tiếp ra rìa rồi tan. */
const hiddenPose = (side: number): Pose => ({
  x: `${side * 176}%`,
  rotateY: side * -48,
  scale: 0.62,
  opacity: 0,
  filter: 'brightness(0.5) blur(3px)',
  zIndex: 0,
});

/** Chất liệu kính dùng chung — tái dùng token --blur-strong của app. */
const glass: React.CSSProperties = {
  background: 'rgba(28, 26, 24, 0.42)',
  backdropFilter: 'blur(var(--blur-strong)) saturate(170%)',
  WebkitBackdropFilter: 'blur(var(--blur-strong)) saturate(170%)',
  border: '1px solid rgba(255,255,255,0.12)',
  boxShadow: '0 12px 36px -14px rgba(0,0,0,0.6)',
};

export function TitleSequence({ onFinish }: { onFinish: () => void }) {
  const reduce = useReducedMotion();
  const lang = useLang();
  const en = lang === 'en';
  const [active, setActive] = useState(0);
  const [leaving, setLeaving] = useState(false); // fade toàn màn trước khi onFinish
  const done = useRef(false);

  const finish = useCallback(() => {
    if (done.current) return;
    done.current = true;
    onFinish();
  }, [onFinish]);

  // Bấm/skip/hết giờ → fade toàn màn (leaving), onAnimationComplete mới finish.
  const beginLeave = useCallback(() => {
    if (!done.current) setLeaving(true);
  }, []);

  // Carousel tự trôi — dừng khi đang rời màn hoặc reduce-motion.
  useEffect(() => {
    if (reduce || leaving) return;
    const t = setInterval(() => setActive((a) => (a + 1) % WORKS.length), STEP);
    return () => clearInterval(t);
  }, [reduce, leaving]);

  // Đồng hồ tổng — tự kết thúc.
  useEffect(() => {
    const t = setTimeout(beginLeave, reduce ? REDUCE_TOTAL : TOTAL);
    return () => clearTimeout(t);
  }, [reduce, beginLeave]);

  const n = WORKS.length;
  const offsetOf = (i: number) => {
    let off = (((i - active) % n) + n) % n;
    if (off > n / 2) off -= n;
    return off;
  };

  const step = (dir: 1 | -1) => setActive((a) => (a + dir + n) % n);

  // Transition card: spring đằm cho chuyển lớp, tween cho opacity/filter.
  const cardTransition = reduce
    ? { duration: 0 }
    : {
        default: springStage,
        opacity: { duration: 0.55, ease: easeApple },
        filter: { duration: 0.55, ease: easeApple },
      };

  return (
    <motion.div
      onClick={beginLeave}
      role="button"
      aria-label={en ? 'Skip intro' : 'Bỏ qua đoạn mở đầu'}
      className="font-sans fixed inset-0 z-50 cursor-pointer select-none overflow-hidden"
      style={{ height: '100dvh', background: '#0b0a09' }}
      initial={{ opacity: 1 }}
      animate={{ opacity: leaving ? 0 : 1 }}
      transition={{ duration: reduce ? 0.35 : 0.55, ease: easeApple }}
      onAnimationComplete={() => {
        if (leaving) finish();
      }}
    >
      {/* ===== NỀN PHÒNG GALLERY — ảnh thật blur sâu như DOF ===== */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <motion.img
        src="/detech/meditation.jpg"
        alt=""
        aria-hidden
        draggable={false}
        className="absolute inset-0 h-full w-full object-cover"
        style={{ filter: 'blur(26px) brightness(0.48) saturate(0.85)' }}
        initial={{ scale: 1.16 }}
        animate={reduce ? { scale: 1.16 } : { scale: [1.16, 1.22, 1.16] }}
        transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* vignette + tối đáy/đỉnh cho glass và chữ đọc được */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(11,10,9,0.5) 0%, rgba(11,10,9,0.08) 30%, rgba(11,10,9,0.12) 62%, rgba(11,10,9,0.72) 100%)',
        }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(120% 95% at 50% 42%, transparent 44%, rgba(0,0,0,0.62) 100%)' }}
      />
      <div
        className="pointer-events-none absolute inset-0 mix-blend-soft-light"
        style={{ background: `radial-gradient(85% 65% at 26% 28%, ${COPPER}, transparent 62%)`, opacity: 0.16 }}
      />

      {/* ===== THANH KÍNH TRÊN — brand + tagline (kiểu thanh URL visionOS) ===== */}
      <motion.div
        className="absolute inset-x-0 top-4 z-20 flex justify-center px-16 sm:top-7"
        initial={{ opacity: 0, y: reduce ? 0 : -14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduce ? 0.4 : 0.8, ease: easeApple, delay: reduce ? 0 : 0.15 }}
      >
        <div className="flex max-w-full items-center gap-1.5 rounded-full p-1.5 sm:gap-2" style={glass}>
          <button
            type="button"
            aria-label={en ? 'Previous' : 'Ảnh trước'}
            onClick={(e) => {
              e.stopPropagation();
              step(-1);
            }}
            className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/75 transition-colors hover:bg-white/20 hover:text-white sm:flex"
          >
            <ChevronLeft size={15} />
          </button>
          <div className="flex min-w-0 items-center gap-2 rounded-full bg-white/[0.08] px-4 py-1.5 sm:px-5">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: COPPER }} />
            <span className="text-[13px] font-semibold tracking-[-0.01em] text-white sm:text-sm">
              Interior<span style={{ color: COPPER }}>Flow</span>
            </span>
            <span className="hidden truncate text-[12px] text-white/55 md:inline">
              — {en ? 'from idea to render, one flow' : 'từ ý tưởng đến phối cảnh, một mạch'}
            </span>
          </div>
          <button
            type="button"
            aria-label={en ? 'Next' : 'Ảnh kế'}
            onClick={(e) => {
              e.stopPropagation();
              step(1);
            }}
            className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/75 transition-colors hover:bg-white/20 hover:text-white sm:flex"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </motion.div>

      {/* nút Bỏ qua — kính, góc phải trên */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          beginLeave();
        }}
        className="absolute right-4 top-5 z-30 rounded-full px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-white/70 transition-colors hover:text-white sm:right-5 sm:top-8"
        style={glass}
      >
        {en ? 'Skip' : 'Bỏ qua'}
      </button>

      {/* ===== GALLERY 3D — card kính trung tâm + hai bên nghiêng vào chiều sâu ===== */}
      <motion.div
        className="absolute inset-0 grid place-items-center px-4 pb-24 pt-20 sm:pb-28"
        style={{ perspective: 1400 }}
        initial={{ opacity: 0, y: reduce ? 0 : 26 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduce ? 0.4 : 0.9, ease: easeApple }}
      >
        <div className="relative grid place-items-center" style={{ transformStyle: 'preserve-3d' }}>
          {WORKS.map((w, i) => {
            const off = offsetOf(i);
            const shown = Math.abs(off) <= 2;
            const pose = shown ? POSES[off] : hiddenPose(off < 0 ? -1 : 1);
            const isCenter = off === 0;
            return (
              <motion.div
                key={w.src}
                className="col-start-1 row-start-1 overflow-hidden"
                style={{
                  width: 'clamp(250px, 56vw, 500px)',
                  aspectRatio: '4 / 3',
                  borderRadius: 'var(--radius-xl)',
                  border: '1px solid rgba(255,255,255,0.16)',
                  boxShadow: '0 30px 70px -24px rgba(0,0,0,0.8)',
                  zIndex: pose.zIndex,
                  pointerEvents: 'none',
                }}
                initial={false}
                animate={{
                  x: pose.x,
                  rotateY: pose.rotateY,
                  scale: pose.scale,
                  opacity: pose.opacity,
                  filter: pose.filter,
                }}
                transition={cardTransition}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={w.src} alt={w.title[lang]} draggable={false} className="h-full w-full object-cover" />

                {/* caption KÍNH dưới card — chỉ rõ ở card trung tâm */}
                <motion.div
                  className="absolute inset-x-0 bottom-0 px-4 pb-3.5 pt-8 sm:px-5 sm:pb-4"
                  style={{
                    background: 'linear-gradient(180deg, transparent 0%, rgba(14,12,10,0.42) 34%, rgba(14,12,10,0.66) 100%)',
                    backdropFilter: 'blur(14px) saturate(160%)',
                    WebkitBackdropFilter: 'blur(14px) saturate(160%)',
                    borderTop: '1px solid rgba(255,255,255,0.1)',
                    maskImage: 'linear-gradient(180deg, transparent 0%, black 26%)',
                    WebkitMaskImage: 'linear-gradient(180deg, transparent 0%, black 26%)',
                  }}
                  initial={false}
                  animate={{ opacity: isCenter ? 1 : 0 }}
                  transition={{ duration: reduce ? 0 : 0.45, ease: easeApple }}
                >
                  <div className="text-[15px] font-semibold leading-tight text-white sm:text-[17px]">
                    {w.title[lang]}
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-3">
                    <span className="truncate text-[11px] text-white/60 sm:text-[12px]">{w.meta[lang]}</span>
                    <span
                      className="shrink-0 rounded-full px-2 py-0.5 text-[9px] uppercase tracking-[0.14em] text-white/70"
                      style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.12)' }}
                    >
                      {en ? 'Render · AI' : 'Phối cảnh · AI'}
                    </span>
                  </div>
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* ===== CHIP PILL DƯỚI — "TTT · Creative Studio" (gu thẻ Notes) + dots ===== */}
      <motion.div
        className="absolute inset-x-0 bottom-5 z-20 flex flex-col items-center gap-3 px-4 sm:bottom-7"
        initial={{ opacity: 0, y: reduce ? 0 : 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduce ? 0.4 : 0.8, ease: easeApple, delay: reduce ? 0 : 0.3 }}
      >
        <div className="flex items-center gap-2.5 rounded-full py-1.5 pl-1.5 pr-4" style={glass}>
          <span
            className="rounded-full px-2.5 py-1 text-[10px] font-bold tracking-[0.12em]"
            style={{ background: `linear-gradient(135deg, ${COPPER}, #a87b45)`, color: '#1c1409' }}
          >
            TTT
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-[12px] font-medium text-white/90">Creative Studio</span>
            <span className="text-[10px] text-white/50">
              {en ? 'Interior · Architecture' : 'Nội thất · Kiến trúc'}
            </span>
          </span>
        </div>

        {/* dots kiểu visionOS — chấm active kéo dài */}
        <div className="flex items-center gap-1.5" aria-hidden>
          {WORKS.map((_, i) => (
            <span
              key={i}
              className="h-[5px] rounded-full transition-all duration-500"
              style={{
                width: i === active ? 22 : 5,
                background: i === active ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.3)',
              }}
            />
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
