'use client';

import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Loader2, Presentation, Box, Palette, ArrowRight } from 'lucide-react';
import { useFlowStore, type WorkspaceMode } from '@/lib/store';
import { PHASE_MAP } from '@/lib/phases';
import { bootstrapWorkspace } from '@/lib/workspace';
import { StackedCards } from '@/components/entry/StackedCards';
import { conceptFaces, presentationFaces, renderFaces } from '@/components/entry/cardFaces';
import { easeApple, springPop, pressable } from '@/lib/motion';

// Token cục bộ (brand đích — warm stone, đồng #C79A63). SANS hiện đại, KHÔNG chân.
const COPPER = '#c79a63';
const SANS = '-apple-system,"SF Pro Display","SF Pro Text","Helvetica Neue","Space Grotesk",system-ui,sans-serif';
const MONO = '"SF Mono","SFMono-Regular",ui-monospace,Menlo,monospace';

// 3 chặng mềm của cùng 1 pipeline — chọn nơi bắt đầu, không phải 3 app rời.
const MODES: {
  id: WorkspaceMode;
  title: string;
  tagline: string;
  desc: string;
  icon: typeof Presentation;
  faces: React.ReactNode[];
}[] = [
  {
    id: 'concept',
    title: 'Concept',
    tagline: 'Gieo ý tưởng',
    desc: 'Moodboard, vật liệu, palette, style — trước khi dựng hình.',
    icon: Palette,
    faces: conceptFaces,
  },
  {
    id: 'render',
    title: 'Render',
    tagline: 'Dựng nên hình',
    desc: 'Sketch → phối cảnh photoreal. Đổi vật liệu, ánh sáng, upscale.',
    icon: Box,
    faces: renderFaces,
  },
  {
    id: 'present',
    title: 'Present',
    tagline: 'Trình cho khách',
    desc: 'Slide 16:9, board, spec vật liệu → đóng gói cho khách duyệt.',
    icon: Presentation,
    faces: presentationFaces,
  },
];

export function LoginScreen({ onReplayIntro }: { onReplayIntro?: () => void }) {
  const setUser = useFlowStore((s) => s.setUser);
  const setWorkspace = useFlowStore((s) => s.setWorkspace);
  const reduce = useReducedMotion();
  const [chosen, setChosen] = useState<WorkspaceMode>('render');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/auth/${authMode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authMode === 'login' ? { email, password } : { email, name, password }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? 'Có lỗi xảy ra.');
      setWorkspace(chosen);
      setUser(body.user);
      await bootstrapWorkspace();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const field =
    'w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--field)] px-3.5 py-2.5 text-sm text-[var(--t1)] placeholder-[var(--t5)] outline-none transition-colors focus:border-[color:var(--fc)]';

  return (
    <div
      className="relative grid min-h-screen place-items-center overflow-hidden px-6 py-12"
      style={{ background: 'var(--bg)' }}
    >
      {/* Nền đêm ấm — quầng đồng tĩnh + vignette (tiết chế, không loè loẹt) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -left-40 -top-32 h-[34rem] w-[34rem] rounded-full"
          style={{ background: `radial-gradient(circle, ${COPPER} 0%, transparent 64%)`, filter: 'blur(90px)' }}
          initial={{ opacity: 0.1 }}
          animate={reduce ? { opacity: 0.1 } : { opacity: [0.08, 0.13, 0.08], x: [0, 24, 0] }}
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
        {/* brand */}
        <div className="mb-11 flex flex-col items-center text-center">
          <div
            className="grid h-11 w-11 place-items-center rounded-[var(--radius-md)] text-[15px] font-bold text-[var(--bg)]"
            style={{ background: COPPER, fontFamily: SANS, letterSpacing: '-0.02em', boxShadow: 'var(--shadow-pop)' }}
          >
            IF
          </div>
          <div
            className="mt-5 text-[10px] uppercase text-[var(--t4)]"
            style={{ fontFamily: MONO, letterSpacing: '0.28em' }}
          >
            InteriorFlow
          </div>
          <h1
            className="mt-3 text-[30px] font-semibold leading-tight text-[var(--t1)] sm:text-[36px]"
            style={{ fontFamily: SANS, letterSpacing: '-0.028em' }}
          >
            Bắt đầu ở chặng nào?
          </h1>
          <p className="mt-2.5 max-w-md text-[13px] leading-relaxed text-[var(--t4)]">
            Concept · Render · Present — một pipeline, chung một canvas. Chọn nơi khởi hành, đi lại tự do sau khi vào.
          </p>
        </div>

        {/* 3 chặng — stacked cards */}
        <div className="mb-12 grid gap-4 sm:grid-cols-3">
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
                {/* khu stacked cards — để overflow cho xòe */}
                <div className="relative z-10 grid h-[220px] w-full place-items-center [overflow:visible]">
                  <StackedCards faces={m.faces} className="relative h-[200px] w-[160px] cursor-pointer" />
                </div>

                {/* nhãn: tagline giãn chữ + tên (SANS đậm) + icon */}
                <div
                  className="relative z-10 mt-4 text-[10px] uppercase transition-colors"
                  style={{
                    fontFamily: MONO,
                    letterSpacing: '0.24em',
                    color: active ? COPPER : 'var(--t5)',
                  }}
                >
                  {m.tagline}
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
                <p className="relative z-10 mt-2 max-w-[15rem] text-[11px] leading-relaxed text-[var(--t4)]">
                  {m.desc}
                </p>
              </button>
            );
          })}
        </div>

        {/* form đăng nhập — kính ấm */}
        <form
          onSubmit={submit}
          style={{ ['--fc' as string]: 'rgba(199,154,99,0.6)', boxShadow: 'var(--shadow-sheet)' }}
          className="mat-card mx-auto w-full max-w-sm space-y-3 rounded-[var(--radius-lg)] border border-[var(--mat-hairline)] p-6"
        >
          {authMode === 'register' && (
            <input
              className={field}
              placeholder="Tên hiển thị (vd: Hoà)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          )}
          <input
            type="email"
            className={field}
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            className={field}
            placeholder="Mật khẩu (≥ 6 ký tự)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-[var(--radius-sm)] bg-red-500/10 px-3 py-2 text-xs text-red-400"
            >
              {error}
            </motion.p>
          )}
          <motion.button
            {...pressable}
            type="submit"
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-[var(--radius-sm)] py-3 text-sm font-medium text-[var(--bg)] shadow-sm transition-opacity disabled:opacity-50"
            style={{ background: COPPER }}
          >
            {busy ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <>
                {authMode === 'login' ? 'Vào' : 'Tạo tài khoản'} · {PHASE_MAP[chosen].label}
                <ArrowRight size={14} />
              </>
            )}
          </motion.button>
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
              className="text-xs text-[var(--t4)] transition-colors hover:text-[var(--t2)]"
            >
              {authMode === 'login' ? 'Chưa có tài khoản? Đăng ký' : 'Đã có tài khoản? Đăng nhập'}
            </button>
            {onReplayIntro && (
              <button
                type="button"
                onClick={onReplayIntro}
                className="text-xs text-[var(--t5)] transition-colors hover:text-[var(--t3)]"
              >
                Xem lại intro
              </button>
            )}
          </div>
        </form>
      </motion.div>
    </div>
  );
}
