'use client';

import { useEffect, useReducer, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { easeApple } from '@/lib/motion';
import { useLang } from '@/lib/i18n';
import { LangToggle } from '@/components/LangToggle';
import { TitleSequence } from '@/components/intro/TitleSequence';
import { LoginForm } from '@/components/entry/LoginForm';

/**
 * IntroSequence — màn mở điện ảnh KỂ CÂU CHUYỆN LÕI của app, KẾT BẰNG Ô ĐĂNG NHẬP.
 *   nét phác trên GIẤY NHÁP  →  SỐNG DẬY  →  phối cảnh PHOTOREAL  →  bản TRÌNH KHÁCH  →  ĐĂNG NHẬP.
 *
 * Sân khấu trái là khung tranh: cùng một căn phòng đi qua 4 trạng thái (SVG stroke
 * tự-vẽ, giấy grain + hatch tay, màu vật liệu, ảnh photoreal). Chữ phải kể lời.
 * Cảnh cuối (05) hiện luôn form đăng nhập ngay trong intro — đăng nhập xong,
 * app chuyển sang màn CHỌN 3 CHẶNG (StageSelect) do gate app/page.tsx điều phối.
 *
 * GIỮ NGUYÊN logic auth: gọi /api/auth/{login|register}, chỉ setUser (KHÔNG chọn
 * workspace ở đây — việc chọn chặng diễn ra ở màn sau). Test hoa@ttt.vn/matkhau123.
 *
 * LUẬT: KHÔNG serif. Chỉ sans hệ thống hiện đại. Không webfont ngoài (CSP).
 */

// Token cục bộ (brand đích — warm stone, đồng #C79A63). SANS, không chân.
const COPPER = '#c79a63';
const SANS = '-apple-system,"SF Pro Display","SF Pro Text","Helvetica Neue","Space Grotesk",system-ui,sans-serif';
const MONO = '"SF Mono","SFMono-Regular",ui-monospace,Menlo,monospace';
const INK = '#e9e0d2'; // "mực" nhạt trên nền đêm ấm

// 4 cảnh kể chuyện + 1 cảnh đăng nhập. `stage` điều khiển khung tranh.
// Mỗi cảnh song ngữ: kicker/title/sub có bản {vi,en}.
interface Scene {
  no: string;
  kicker: { vi: string; en: string };
  title: { vi: string; en: string };
  sub: { vi: string; en: string };
  stage: Stage;
  isLogin?: boolean;
}

const SCENES: Scene[] = [
  {
    no: '01',
    kicker: { vi: 'Giấy nháp', en: 'Draft paper' },
    title: { vi: 'Bắt đầu\nbằng một nét phác.', en: 'It starts\nwith a sketch.' },
    sub: {
      vi: 'Mặt bằng, ý tưởng, một đường bút chì trên giấy can. Thô, nhanh, đầy khả năng — như mọi thiết kế thật sự khởi sinh.',
      en: 'A plan, an idea, a pencil line on tracing paper. Rough, fast, full of promise — how every real design begins.',
    },
    stage: 'sketch',
  },
  {
    no: '02',
    kicker: { vi: 'Sống dậy', en: 'It comes alive' },
    title: { vi: 'Rồi nó\nsống dậy.', en: 'Then it\ncomes alive.' },
    sub: {
      vi: 'AI đọc hình khối, phủ vật liệu và ánh sáng lên đúng nét bạn vẽ. Bản phác bắt đầu có da thịt, có chiều sâu.',
      en: 'AI reads the forms, laying materials and light onto the exact lines you drew. The sketch gains flesh and depth.',
    },
    stage: 'coloring',
  },
  {
    no: '03',
    kicker: { vi: 'Photoreal', en: 'Photoreal' },
    title: { vi: 'Thành\nphối cảnh thật.', en: 'Into a real\nrendering.' },
    sub: {
      vi: 'Đổi vật liệu, chỉnh nắng, upscale 4K — giữ nguyên hình khối gốc. Một phối cảnh đủ tin để đưa cho khách.',
      en: 'Swap materials, tune the sun, upscale to 4K — keeping the original geometry. A render solid enough to show a client.',
    },
    stage: 'photoreal',
  },
  {
    no: '04',
    kicker: { vi: 'Trình khách', en: 'Client-ready' },
    title: { vi: 'Và đóng thành\nbản trình khách.', en: 'And packaged into\na client deck.' },
    sub: {
      vi: 'Slide 16:9, board vật liệu, spec — gói gọn thành bản thuyết trình sạch bản quyền. Cả dòng chảy, không rời canvas.',
      en: '16:9 slides, material boards, specs — wrapped into a copyright-clean presentation. The whole flow, without leaving the canvas.',
    },
    stage: 'deck',
  },
  {
    no: '05',
    kicker: { vi: 'Vào xưởng', en: 'Enter the studio' },
    title: { vi: 'Bắt đầu\ndòng chảy của bạn.', en: 'Begin\nyour flow.' },
    sub: {
      vi: 'Đăng nhập để mở canvas. Chọn nơi khởi hành ở bước kế — đi lại tự do sau khi vào.',
      en: 'Sign in to open the canvas. Pick where to start next — move freely once you are in.',
    },
    stage: 'deck',
    isLogin: true,
  },
];

type Stage = 'sketch' | 'coloring' | 'photoreal' | 'deck';
const HOLD = 4400; // ms mỗi cảnh — nhịp chậm, điện ảnh

export function IntroSequence({ onDone }: { onDone: () => void }) {
  // phase 'title' = màn INTRO điện ảnh (title-sequence ~6s) mở đầu;
  // phase 'story' = phần kể chuyện + ô đăng nhập (giữ nguyên logic auth cũ).
  const [phase, setPhase] = useState<'title' | 'story'>('title');
  const [i, setI] = useReducer((_: number, v: number) => v, 0);
  const reduce = useReducedMotion();
  const lang = useLang();
  const last = i === SCENES.length - 1; // cảnh đăng nhập
  const scene = SCENES[i];

  // auto-advance qua các cảnh kể chuyện, DỪNG ở cảnh đăng nhập.
  // Chỉ chạy khi đã qua màn intro (phase 'story') để timer không tiêu ngầm.
  useEffect(() => {
    if (phase !== 'story' || last) return;
    const t = setTimeout(() => setI(i + 1), HOLD);
    return () => clearTimeout(t);
  }, [i, last, phase]);

  const gotoLogin = () => setI(SCENES.length - 1);

  // Màn INTRO điện ảnh trước — xong (hoặc bỏ qua) thì lộ phần kể chuyện + đăng nhập.
  if (phase === 'title') {
    return (
      <AnimatePresence>
        <TitleSequence key="title" onFinish={() => setPhase('story')} />
      </AnimatePresence>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
      {/* nền đêm ấm: quầng đồng trôi rất chậm + vignette điện ảnh */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute left-1/3 top-1/2 h-[54rem] w-[54rem] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ background: `radial-gradient(circle, ${COPPER} 0%, transparent 62%)`, filter: 'blur(90px)' }}
          initial={{ opacity: 0.06 }}
          animate={reduce ? { opacity: 0.08 } : { opacity: [0.05, 0.11, 0.05], scale: [1, 1.06, 1] }}
          transition={{ duration: 24, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(120% 92% at 42% 45%, transparent 38%, rgba(0,0,0,0.6) 100%)' }}
        />
      </div>

      {/* đổi ngôn ngữ — góc trái trên, ghost để hoà nền tối */}
      <div className="absolute left-6 top-6 z-30">
        <LangToggle variant="ghost" />
      </div>

      {/* nhảy thẳng tới đăng nhập (thay cho "bỏ qua") */}
      {!last && (
        <button
          onClick={gotoLogin}
          className="absolute right-6 top-6 z-30 rounded-full px-3 py-1.5 text-[11px] uppercase tracking-[0.18em] text-[var(--t4)] transition-colors hover:text-[var(--t2)]"
          style={{ fontFamily: MONO }}
        >
          {lang === 'en' ? 'Sign in →' : 'Đăng nhập →'}
        </button>
      )}

      {/* progress */}
      <div className="absolute left-1/2 top-7 z-30 flex -translate-x-1/2 gap-2">
        {SCENES.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setI(idx)}
            aria-label={lang === 'en' ? `Scene ${idx + 1}` : `Cảnh ${idx + 1}`}
            className="h-[3px] overflow-hidden rounded-full transition-[width,background-color] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]"
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

      {/* sân khấu: 2 cột trên desktop (tranh | lời/form), 1 cột trên mobile */}
      <div className="relative z-10 mx-auto grid min-h-screen items-center gap-8 px-6 py-24 lg:max-w-6xl lg:grid-cols-[1.1fr_0.9fr] lg:gap-14 lg:py-6">
        {/* KHUNG TRANH */}
        <div className="order-2 lg:order-1">
          <SketchStage stage={scene.stage} reduce={!!reduce} sceneKey={i} />
        </div>

        {/* LỜI + (cảnh cuối) FORM ĐĂNG NHẬP */}
        <div className="order-1 max-w-xl lg:order-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={i}
              initial={{ opacity: 0, y: reduce ? 0 : 16, filter: reduce ? 'blur(0px)' : 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: reduce ? 0 : -12, filter: reduce ? 'blur(0px)' : 'blur(8px)' }}
              transition={{ duration: 0.7, ease: easeApple }}
            >
              <div
                className="mb-6 flex items-center gap-3 text-[11px] uppercase text-[var(--t4)]"
                style={{ fontFamily: MONO, letterSpacing: '0.26em' }}
              >
                <span style={{ color: COPPER }}>{scene.no}</span>
                <span className="h-px w-6" style={{ background: 'var(--border)' }} />
                <span>{scene.kicker[lang]}</span>
              </div>

              <h1
                className="whitespace-pre-line text-[34px] font-semibold leading-[1.04] text-[var(--t1)] sm:text-[48px]"
                style={{ fontFamily: SANS, letterSpacing: '-0.028em' }}
              >
                {scene.title[lang]}
              </h1>
              <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-[var(--t3)]" style={{ fontFamily: SANS }}>
                {scene.sub[lang]}
              </p>

              {last && <LoginForm onAuthed={onDone} reduce={!!reduce} lang={lang} />}
            </motion.div>
          </AnimatePresence>

          {/* điều hướng (ẩn ở cảnh đăng nhập — form tự có nút) */}
          {!last && (
            <div className="mt-9 flex h-12 items-center">
              <motion.button
                key="next"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => setI(Math.min(i + 1, SCENES.length - 1))}
                className="text-[11px] uppercase tracking-[0.2em] text-[var(--t4)] transition-colors hover:text-[var(--t2)]"
                style={{ fontFamily: MONO }}
              >
                {lang === 'en' ? 'Next →' : 'Tiếp →'}
              </motion.button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
 * LoginForm — ĐÃ TÁCH sang components/entry/LoginForm.tsx (Sprint 1 B-1/B-2:
 * intro gỡ khỏi luồng chính, form đăng nhập dùng chung cho LoginScreen mới +
 * intro này nếu được khôi phục). Import ở đầu file.
 * ==========================================================================*/

/* ============================================================================
 * SketchStage — khung tranh kể chuyện: cùng 1 căn phòng, chồng nhiều lớp.
 * ==========================================================================*/
function SketchStage({ stage, reduce, sceneKey }: { stage: Stage; reduce: boolean; sceneKey: number }) {
  const order: Stage[] = ['sketch', 'coloring', 'photoreal', 'deck'];
  const at = order.indexOf(stage);
  const showColor = at >= 1;
  const showReal = at >= 2;
  const showDeck = at >= 3;

  const drift = reduce ? 0 : (sceneKey - 2) * 3;

  const drawTween = (d: number) =>
    reduce ? { duration: 0 } : { duration: 1.5, ease: easeApple, delay: d };

  return (
    <motion.div
      className="relative mx-auto aspect-[4/3] w-full max-w-[560px] overflow-hidden rounded-[var(--radius-lg)]"
      style={{ boxShadow: 'var(--shadow-sheet)', border: '1px solid var(--mat-hairline)' }}
      initial={{ opacity: 0, y: reduce ? 0 : 20 }}
      animate={{ opacity: 1, y: drift }}
      transition={{ duration: 0.8, ease: easeApple }}
    >
      {/* 1 · GIẤY CAN */}
      <motion.div
        className="absolute inset-0"
        animate={{ opacity: showReal ? 0.14 : 1 }}
        transition={{ duration: 1.1, ease: easeApple }}
        style={{ background: 'radial-gradient(120% 120% at 20% 10%, #f4ece0 0%, #e9ddca 55%, #ded0b9 100%)' }}
      >
        <PaperGrain />
      </motion.div>

      {/* 3 · MÀU VẬT LIỆU */}
      <motion.div
        className="absolute inset-0"
        initial={false}
        animate={{ opacity: showColor && !showReal ? 0.55 : 0 }}
        transition={{ duration: 1.1, ease: easeApple }}
      >
        <ColorWash />
      </motion.div>

      {/* 4 · ẢNH PHOTOREAL */}
      <motion.div
        className="absolute inset-0"
        initial={false}
        animate={{ opacity: showReal ? 1 : 0 }}
        transition={{ duration: 1.2, ease: easeApple }}
      >
        <Photoreal />
      </motion.div>

      {/* 2 · NÉT PHÁC — SVG tự-vẽ */}
      <motion.svg
        viewBox="0 0 400 300"
        className="absolute inset-0 h-full w-full"
        initial={false}
        animate={{ opacity: showReal ? 0.22 : 0.92 }}
        transition={{ duration: 1.1, ease: easeApple }}
        fill="none"
        stroke={showReal ? INK : '#4b4034'}
        strokeWidth={1.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {SKETCH_PATHS.map((d, idx) => (
          <motion.path
            key={idx}
            d={d}
            initial={{ pathLength: reduce ? 1 : 0, opacity: reduce ? 1 : 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={drawTween(idx * 0.12)}
          />
        ))}
        {HATCH_PATHS.map((d, idx) => (
          <motion.path
            key={`h${idx}`}
            d={d}
            strokeWidth={0.7}
            initial={{ pathLength: reduce ? 1 : 0, opacity: reduce ? 0.5 : 0 }}
            animate={{ pathLength: 1, opacity: 0.5 }}
            transition={drawTween(0.7 + idx * 0.05)}
          />
        ))}
      </motion.svg>

      {/* 5 · KHUNG TRÌNH KHÁCH */}
      <AnimatePresence>
        {showDeck && (
          <motion.div
            key="deck"
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: easeApple }}
          >
            <div
              className="absolute inset-x-0 bottom-0 h-2/5"
              style={{ background: 'linear-gradient(0deg, rgba(15,12,9,0.82), transparent)' }}
            />
            <motion.div
              className="absolute inset-x-6 bottom-6"
              initial={{ y: reduce ? 0 : 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.7, ease: easeApple, delay: 0.15 }}
            >
              <div className="text-[10px] uppercase" style={{ fontFamily: MONO, letterSpacing: '0.28em', color: COPPER }}>
                Concept · Bedroom
              </div>
              <div
                className="mt-1.5 text-[26px] font-semibold leading-none"
                style={{ fontFamily: SANS, letterSpacing: '-0.02em', color: '#f6efe2' }}
              >
                SERENE
              </div>
              <div className="mt-3 flex gap-1.5">
                {['#f4efe6', '#d9cfc2', '#b39776', '#8a6f4d', '#2b2620'].map((c) => (
                  <div key={c} className="h-3 w-7 rounded-sm" style={{ background: c }} />
                ))}
              </div>
            </motion.div>
            <div
              className="absolute right-4 top-4 rounded-full px-2.5 py-1 text-[9px] uppercase tracking-[0.2em]"
              style={{ fontFamily: MONO, background: 'rgba(15,12,9,0.55)', color: '#f6efe2' }}
            >
              16:9 · PDF
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* nhãn trạng thái */}
      <div
        className="absolute left-4 top-4 rounded-full px-2.5 py-1 text-[9px] uppercase tracking-[0.22em]"
        style={{
          fontFamily: MONO,
          background: showReal ? 'rgba(15,12,9,0.5)' : 'rgba(75,64,52,0.12)',
          color: showReal ? '#f6efe2' : '#6b5b45',
        }}
      >
        {STAGE_LABEL[stage]}
      </div>
    </motion.div>
  );
}

const STAGE_LABEL: Record<Stage, string> = {
  sketch: 'Draft · pencil',
  coloring: 'AI · coloring',
  photoreal: 'Render · 4K',
  deck: 'Deck · export',
};

function PaperGrain() {
  return (
    <svg className="absolute inset-0 h-full w-full opacity-[0.5] mix-blend-multiply" aria-hidden>
      <filter id="paper-noise">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#paper-noise)" opacity="0.06" />
    </svg>
  );
}

function ColorWash() {
  return (
    <svg viewBox="0 0 400 300" className="h-full w-full" preserveAspectRatio="none">
      <rect x="0" y="0" width="400" height="196" fill="#d8c8ae" />
      <polygon points="0,196 400,196 400,300 0,300" fill="#a98d67" />
      <rect x="42" y="54" width="86" height="104" fill="#e8dcc2" />
      <rect x="196" y="150" width="150" height="40" rx="8" fill="#c7b79c" />
      <polygon points="128,158 210,158 250,240 96,240" fill="#eeddb8" opacity="0.6" />
    </svg>
  );
}

function Photoreal() {
  return (
    <svg viewBox="0 0 400 300" className="h-full w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="pr-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c9b596" />
          <stop offset="1" stopColor="#a68a63" />
        </linearGradient>
        <linearGradient id="pr-floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8a6f4d" />
          <stop offset="1" stopColor="#5c4a33" />
        </linearGradient>
        <linearGradient id="pr-win" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fdf6e3" />
          <stop offset="1" stopColor="#e7cf9a" />
        </linearGradient>
        <radialGradient id="pr-sun" cx="0.32" cy="0.5" r="0.6">
          <stop offset="0" stopColor="#fff3d0" stopOpacity="0.55" />
          <stop offset="1" stopColor="#fff3d0" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x="0" y="0" width="400" height="196" fill="url(#pr-wall)" />
      <polygon points="0,196 400,196 400,300 0,300" fill="url(#pr-floor)" />
      <rect x="42" y="54" width="86" height="104" rx="3" fill="url(#pr-win)" />
      <rect x="42" y="54" width="86" height="104" rx="3" fill="none" stroke="#4b3c28" strokeWidth="2" />
      <line x1="85" y1="54" x2="85" y2="158" stroke="#4b3c28" strokeWidth="1.5" />
      <line x1="42" y1="106" x2="128" y2="106" stroke="#4b3c28" strokeWidth="1.5" />
      <polygon points="128,158 210,158 250,240 96,240" fill="url(#pr-sun)" />
      <rect x="196" y="150" width="150" height="42" rx="8" fill="#d3c2a4" />
      <rect x="196" y="118" width="150" height="36" rx="6" fill="#b89e78" />
      <rect x="206" y="128" width="40" height="20" rx="5" fill="#efe6d2" />
      <rect x="252" y="128" width="40" height="20" rx="5" fill="#e4d6bd" />
      <rect x="202" y="192" width="8" height="18" fill="#4a3b28" />
      <rect x="332" y="192" width="8" height="18" fill="#4a3b28" />
      <ellipse cx="271" cy="214" rx="86" ry="9" fill="#000" opacity="0.18" />
      <circle cx="150" cy="46" r="9" fill="#ffe9b0" />
      <circle cx="150" cy="46" r="20" fill="#ffe9b0" opacity="0.18" />
      <rect x="0" y="0" width="400" height="300" fill="url(#pr-sun)" opacity="0.15" />
    </svg>
  );
}

const SKETCH_PATHS: string[] = [
  'M12 40 L388 40 L388 260 L12 260 Z',
  'M12 196 L388 196',
  'M12 40 L60 74 M388 40 L340 74 M12 260 L60 226 M388 260 L340 226',
  'M42 54 L128 54 L128 158 L42 158 Z',
  'M85 54 L85 158 M42 106 L128 106',
  'M196 150 L346 150 L346 192 L196 192 Z',
  'M196 118 L346 118 L346 154 L196 154',
  'M206 128 L246 128 L246 148 L206 148 Z',
  'M252 128 L292 128 L292 148 L252 148 Z',
  'M202 192 L202 210 M340 192 L340 210',
  'M150 40 L150 37 M150 46 m-9 0 a9 9 0 1 0 18 0 a9 9 0 1 0 -18 0',
];

const HATCH_PATHS: string[] = [
  'M96 240 L112 224 M108 240 L128 220 M120 240 L142 218 M134 240 L156 218 M148 240 L170 218',
  'M200 210 L214 196 M214 210 L230 194 M230 210 L246 194 M246 210 L262 194',
  'M300 210 L316 196 M316 210 L332 196 M332 210 L346 198',
];
