'use client';

/**
 * IntroSequence — 60s cinematic mở đầu, 4 cảnh + morph login.
 *
 * State machine phases quản qua useReducer để dễ debug (advance/skip/finish).
 * Chuyển cảnh dùng AnimatePresence mode="wait" (không blank flash).
 * Chuyển sang login: router.push('/login') + set localStorage `if_intro_seen_v1='1'`.
 * Shared element `layoutId="hero-glass"`: giọt kính cảnh 4 → card login (LoginScreen
 * cần render wrapper cùng layoutId; ta chỉ set flag, không cross-page motion).
 */

import { useEffect, useReducer, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Desk,
  Monitor,
  Blueprint,
  Ruler,
  Mouse,
  Clock,
  Pencil,
  Architect,
  LogoIF,
  WaveFlow,
  VitalsDrop,
} from './svgs';

type Phase = 0 | 1 | 2 | 3 | 4;
type Action = { type: 'advance' } | { type: 'set'; phase: Phase } | { type: 'finish' };

interface State { phase: Phase; done: boolean; }

function reducer(s: State, a: Action): State {
  if (a.type === 'finish') return { ...s, done: true };
  if (a.type === 'set') return { ...s, phase: a.phase };
  if (a.type === 'advance') {
    const next = Math.min(4, s.phase + 1) as Phase;
    return { ...s, phase: next };
  }
  return s;
}

const SCENE_DURATIONS = [15000, 10000, 25000, 10000]; // ms

const BEIGE = '#F1ECE3';
const NAVY = '#002850';
const ORANGE = '#F06020';
const INK = '#1B1512';

export function IntroSequence() {
  const router = useRouter();
  const [state, dispatch] = useReducer(reducer, { phase: 0, done: false });
  const reduce = useReducedMotion();
  const startedAt = useRef(Date.now());

  // Auto-advance scenes
  useEffect(() => {
    if (state.done || state.phase >= 4) return;
    const t = setTimeout(() => dispatch({ type: 'advance' }), SCENE_DURATIONS[state.phase]);
    return () => clearTimeout(t);
  }, [state.phase, state.done]);

  const finish = () => {
    try { localStorage.setItem('if_intro_seen_v1', '1'); } catch {}
    dispatch({ type: 'finish' });
    setTimeout(() => router.push('/login'), 300);
  };

  const skip = () => {
    if (Date.now() - startedAt.current < 1000) return; // 1s buffer chống mis-click
    finish();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: state.phase === 0 ? '#2a2f36' : BEIGE,
        overflow: 'hidden',
        fontFamily: 'Archivo, -apple-system, system-ui, sans-serif',
        color: INK,
        transition: 'background 1.5s ease',
      }}
    >
      {/* Skip button (xuất hiện sau 3s) */}
      <motion.button
        type="button"
        onClick={skip}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3, duration: 0.5 }}
        style={{
          position: 'absolute',
          top: 24,
          right: 32,
          zIndex: 100,
          background: 'transparent',
          border: `1px solid ${state.phase === 0 ? '#fff8' : INK}`,
          color: state.phase === 0 ? '#fff' : INK,
          padding: '8px 16px',
          fontSize: 11,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          cursor: 'pointer',
          borderRadius: 2,
        }}
      >
        Skip →
      </motion.button>

      <AnimatePresence mode="wait">
        {state.phase === 0 && <Scene1 key="s1" reduce={!!reduce} />}
        {state.phase === 1 && <Scene2 key="s2" reduce={!!reduce} />}
        {state.phase === 2 && <Scene3 key="s3" reduce={!!reduce} />}
        {state.phase === 3 && <Scene4 key="s4" reduce={!!reduce} onCta={finish} />}
      </AnimatePresence>
    </div>
  );
}

/* ═════════════════ Scene 1: Floating chaos ═════════════════ */

function Scene1({ reduce }: { reduce: boolean }) {
  const items = [
    { C: Desk, x: '20%', y: '30%', delay: 0 },
    { C: Monitor, x: '70%', y: '20%', delay: 0.3 },
    { C: Blueprint, x: '50%', y: '55%', delay: 0.6 },
    { C: Ruler, x: '80%', y: '65%', delay: 0.2 },
    { C: Mouse, x: '15%', y: '70%', delay: 0.5 },
    { C: Clock, x: '85%', y: '40%', delay: 0.4 },
    { C: Pencil, x: '40%', y: '80%', delay: 0.7 },
  ];
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.6 } }}
      transition={{ duration: 0.8 }}
      style={{ position: 'absolute', inset: 0 }}
    >
      {items.map((it, i) => (
        <motion.div
          key={i}
          style={{ position: 'absolute', left: it.x, top: it.y, transform: 'translate(-50%,-50%)' }}
          animate={reduce ? {} : { y: [0, -20, 0], rotate: [0, 3, -2, 0] }}
          transition={{ duration: 4 + i * 0.3, repeat: Infinity, delay: it.delay, ease: 'easeInOut' }}
        >
          <it.C size={110} tinted />
        </motion.div>
      ))}
      {/* Copy */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5, duration: 1 }}
        style={{
          position: 'absolute',
          bottom: 80,
          left: 0,
          right: 0,
          textAlign: 'center',
          color: '#e5e7eb',
        }}
      >
        <div style={{ fontSize: 22, fontWeight: 400, letterSpacing: '-0.01em', lineHeight: 1.4 }}>
          "Mười file. Năm tool. Ba lần sếp hỏi <em style={{ color: ORANGE, fontStyle: 'normal' }}>'chưa xong à?'</em>"
        </div>
        <div style={{ fontSize: 13, opacity: 0.6, marginTop: 12, letterSpacing: '0.08em' }}>
          Ten files. Five tools. Three deadlines missed.
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ═════════════════ Scene 2: Order settles ═════════════════ */

function Scene2({ reduce }: { reduce: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.6 } }}
      transition={{ duration: 1.2 }}
      style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24 }}
    >
      {/* Grid paper backdrop */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `linear-gradient(${INK}0d 1px, transparent 1px), linear-gradient(90deg, ${INK}0d 1px, transparent 1px)`,
        backgroundSize: '40px 40px',
      }} />
      <motion.div
        initial={{ x: -80, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 1.2, ease: [0.22, 0.61, 0.36, 1] }}
        style={{ display: 'flex', alignItems: 'flex-end', gap: 24 }}
      >
        <Architect size={140} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 12, paddingBottom: 40 }}>
          <Desk size={120} />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5, duration: 1 }}
        style={{ textAlign: 'center', zIndex: 2 }}
      >
        <LogoIF size={260} />
        <div style={{ fontSize: 14, letterSpacing: '0.18em', color: NAVY, marginTop: 16, textTransform: 'uppercase' }}>
          Một dòng chảy · One flow
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ═════════════════ Scene 3: 3 stages ═════════════════ */

function Scene3({ reduce }: { reduce: boolean }) {
  const stages = ['Drafting', 'Rendering', 'Presenting'];
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.6 } }}
      transition={{ duration: 1 }}
      style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 32 }}
    >
      <div style={{
        fontSize: 11, letterSpacing: '0.24em', color: ORANGE,
        textTransform: 'uppercase', marginBottom: 8,
      }}>
        Ba màn — Một mạch · Three stages, one flow
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 24, position: 'relative' }}>
        {stages.map((label, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + i * 0.3, duration: 0.8 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}
          >
            <Monitor size={140} />
            <div style={{
              fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase',
              color: NAVY, fontWeight: 500,
            }}>{label}</div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, scaleX: 0 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ delay: 1.5, duration: 1.5 }}
        style={{ transformOrigin: 'left' }}
      >
        <WaveFlow size={520} />
      </motion.div>

      {/* Architect + Vitals drop */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 32, marginTop: 8 }}>
        <Architect size={90} />
        <motion.div
          animate={reduce ? {} : { y: [0, -6, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          style={{ paddingBottom: 30 }}
        >
          <VitalsDrop size={44} />
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 1 }}
        style={{ textAlign: 'center', maxWidth: 640, padding: '0 32px' }}
      >
        <div style={{ fontSize: 18, lineHeight: 1.5, color: INK }}>
          Từ ý đến bản vẽ. Từ bản vẽ đến render. Từ render đến bàn khách.
        </div>
        <div style={{ fontSize: 12, opacity: 0.55, marginTop: 8, letterSpacing: '0.06em' }}>
          Idea to draft. Draft to render. Render to client.
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ═════════════════ Scene 4: Morph login ═════════════════ */

function Scene4({ reduce, onCta }: { reduce: boolean; onCta: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.6 } }}
      transition={{ duration: 1 }}
      style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 40 }}
    >
      <motion.div
        layoutId="hero-glass"
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.4, ease: [0.22, 0.61, 0.36, 1] }}
      >
        <VitalsDrop size={140} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.8 }}
        style={{ textAlign: 'center', maxWidth: 640 }}
      >
        <div style={{ fontSize: 24, lineHeight: 1.4, color: INK, fontWeight: 500 }}>
          Sáng tạo là của bạn.<br />
          <span style={{ color: ORANGE }}>Còn lại · IF lo.</span>
        </div>
        <div style={{ fontSize: 12, opacity: 0.55, marginTop: 12, letterSpacing: '0.06em' }}>
          Create freely. We handle the rest.
        </div>
      </motion.div>

      <motion.button
        type="button"
        onClick={onCta}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2, duration: 0.6 }}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.98 }}
        style={{
          background: NAVY,
          color: BEIGE,
          border: 'none',
          padding: '14px 32px',
          fontSize: 13,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          cursor: 'pointer',
          borderRadius: 2,
        }}
      >
        Bắt đầu · Get started
      </motion.button>
    </motion.div>
  );
}
