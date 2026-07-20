'use client';

import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { usePageVisible } from '@/lib/usePageVisible';
import { Loader2, Presentation, Box, Palette, ArrowRight } from 'lucide-react';
import { useFlowStore, type WorkspaceMode } from '@/lib/store';
import { PHASE_MAP } from '@/lib/phases';
import { bootstrapWorkspace } from '@/lib/workspace';
import { StackedCards } from '@/components/entry/StackedCards';
import { conceptFaces, renderFaces, presentationFaces } from '@/components/entry/cardFaces';
import { easeApple, springPop, pressable } from '@/lib/motion';
import { useLang } from '@/lib/i18n';
import { LangToggle } from '@/components/LangToggle';

/**
 * StageSelect — MÀN CHỜ CHỌN 3 CHẶNG, hiện SAU khi đăng nhập thành công (ở intro).
 * Concept · Render · Present — một pipeline, chung một canvas. Chọn nơi khởi hành.
 *
 * Tách khỏi LoginScreen: giờ đăng nhập diễn ra trong IntroSequence, còn màn này
 * chỉ lo chọn chặng. GIỮ NGUYÊN: setWorkspace, bootstrapWorkspace, PHASE_MAP.
 * Xong → onEnter() để gate app/page.tsx mở canvas.
 *
 * Mặt thẻ = ẢNH RENDER THẬT (public/covers/*) — giữ hiệu ứng xòe/hover.
 * LUẬT FONT: chỉ SANS hiện đại, KHÔNG serif.
 */

const COPPER = '#c79a63';
const SANS = '-apple-system,"SF Pro Display","SF Pro Text","Helvetica Neue","Space Grotesk",system-ui,sans-serif';
const MONO = '"SF Mono","SFMono-Regular",ui-monospace,Menlo,monospace';

const MODES: {
  id: WorkspaceMode;
  title: string;
  tagline: { vi: string; en: string };
  desc: { vi: string; en: string };
  icon: typeof Presentation;
  faces: React.ReactNode[];
}[] = [
  {
    id: 'concept',
    title: 'Concept',
    tagline: { vi: 'Gieo ý tưởng', en: 'Seed the idea' },
    desc: {
      vi: 'Moodboard, vật liệu, palette, style — trước khi dựng hình.',
      en: 'Moodboard, materials, palette, style — before building any form.',
    },
    icon: Palette,
    faces: conceptFaces,
  },
  {
    id: 'render',
    title: 'Render',
    tagline: { vi: 'Dựng nên hình', en: 'Build the image' },
    desc: {
      vi: 'Sketch → phối cảnh photoreal. Đổi vật liệu, ánh sáng, upscale.',
      en: 'Sketch → photoreal render. Swap materials, light, upscale.',
    },
    icon: Box,
    faces: renderFaces,
  },
  {
    id: 'present',
    title: 'Present',
    tagline: { vi: 'Trình cho khách', en: 'Present to client' },
    desc: {
      vi: 'Slide 16:9, board, spec vật liệu → đóng gói cho khách duyệt.',
      en: '16:9 slides, boards, material specs → packaged for client review.',
    },
    icon: Presentation,
    faces: presentationFaces,
  },
];

export function StageSelect({ onEnter }: { onEnter: () => void }) {
  const user = useFlowStore((s) => s.user);
  const setWorkspace = useFlowStore((s) => s.setWorkspace);
  const reduce = useReducedMotion();
  // Tab ẩn → dừng quầng sáng lặp vô hạn (xem lib/usePageVisible.ts).
  const visible = usePageVisible();
  const lang = useLang();
  const en = lang === 'en';
  const [chosen, setChosen] = useState<WorkspaceMode>('render');
  const [busy, setBusy] = useState(false);

  const enter = async () => {
    setBusy(true);
    setWorkspace(chosen);
    try {
      await bootstrapWorkspace();
    } finally {
      onEnter();
    }
  };

  const firstName = user?.name?.split(' ').slice(-1)[0] ?? null;

  return (
    <div
      className="relative grid min-h-screen place-items-center overflow-hidden px-6 py-12"
      style={{ background: 'var(--bg)' }}
    >
      {/* đổi ngôn ngữ — góc phải trên */}
      <div className="absolute right-6 top-6 z-20">
        <LangToggle variant="ghost" />
      </div>

      {/* nền đêm ấm — quầng đồng tĩnh + vignette */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -left-40 -top-32 h-[34rem] w-[34rem] rounded-full"
          style={{ background: `radial-gradient(circle, ${COPPER} 0%, transparent 64%)`, filter: 'blur(90px)' }}
          initial={{ opacity: 0.1 }}
          animate={reduce || !visible ? { opacity: 0.1 } : { opacity: [0.08, 0.13, 0.08], x: [0, 24, 0] }}
          transition={{ duration: 24, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(130% 100% at 50% 30%, transparent 45%, rgba(0,0,0,0.5) 100%)' }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: reduce ? 0 : 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: easeApple }}
        className="relative z-10 w-full max-w-4xl"
      >
        {/* tiêu đề */}
        <div className="mb-11 flex flex-col items-center text-center">
          <div
            className="text-[10px] uppercase text-[var(--t4)]"
            style={{ fontFamily: MONO, letterSpacing: '0.28em' }}
          >
            {firstName ? (en ? `Hi ${firstName}` : `Chào ${firstName}`) : 'InteriorFlow'}
          </div>
          <h1
            className="mt-3 text-[30px] font-semibold leading-tight text-[var(--t1)] sm:text-[36px]"
            style={{ fontFamily: SANS, letterSpacing: '-0.028em' }}
          >
            {en ? 'Where do you start?' : 'Bắt đầu ở chặng nào?'}
          </h1>
          <p className="mt-2.5 max-w-md text-[13px] leading-relaxed text-[var(--t4)]" style={{ fontFamily: SANS }}>
            {en
              ? 'Concept · Render · Present — one pipeline, one canvas. Pick where to begin, move freely once inside.'
              : 'Concept · Render · Present — một pipeline, chung một canvas. Chọn nơi khởi hành, đi lại tự do sau khi vào.'}
          </p>
        </div>

        {/* 3 chặng — stacked cards (mặt thẻ = ảnh render thật) */}
        <div className="mb-10 grid gap-4 sm:grid-cols-3">
          {MODES.map((m) => {
            const active = chosen === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setChosen(m.id)}
                className="group relative flex flex-col items-center rounded-[var(--radius-xl)] px-5 pb-6 pt-4 text-center transition-colors"
              >
                {active && (
                  <motion.div
                    layoutId="mode-bg"
                    className="absolute inset-0 rounded-[var(--radius-xl)]"
                    style={{ background: 'rgba(199,154,99,0.09)', boxShadow: 'inset 0 0 0 1px rgba(199,154,99,0.35)' }}
                    transition={springPop}
                  />
                )}
                <div className="relative z-10 grid h-[220px] w-full place-items-center [overflow:visible]">
                  <StackedCards faces={m.faces} className="relative h-[200px] w-[160px] cursor-pointer" />
                </div>

                <div
                  className="relative z-10 mt-4 text-[10px] uppercase transition-colors"
                  style={{ fontFamily: MONO, letterSpacing: '0.24em', color: active ? COPPER : 'var(--t5)' }}
                >
                  {m.tagline[lang]}
                </div>
                <div className="relative z-10 mt-1.5 flex items-center gap-2">
                  <m.icon size={15} style={{ color: active ? COPPER : 'var(--t4)' }} />
                  <span
                    className="text-[19px] font-semibold leading-none text-[var(--t1)]"
                    style={{ fontFamily: SANS, letterSpacing: '-0.02em' }}
                  >
                    {m.title}
                  </span>
                </div>
                <p className="relative z-10 mt-2 max-w-[15rem] text-[11px] leading-relaxed text-[var(--t4)]" style={{ fontFamily: SANS }}>
                  {m.desc[lang]}
                </p>
              </button>
            );
          })}
        </div>

        {/* CTA vào canvas */}
        <div className="flex justify-center">
          <motion.button
            {...pressable}
            onClick={enter}
            disabled={busy}
            className="flex items-center justify-center gap-2 rounded-full px-8 py-3 text-sm font-semibold text-[var(--bg)] shadow-sm transition-opacity disabled:opacity-50"
            style={{ background: COPPER, fontFamily: SANS }}
          >
            {busy ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <>
                {en ? 'Enter canvas' : 'Vào canvas'} · {PHASE_MAP[chosen].label}
                <ArrowRight size={15} />
              </>
            )}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
