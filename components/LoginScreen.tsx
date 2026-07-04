'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Presentation, Box, Palette, ArrowRight } from 'lucide-react';
import { useFlowStore, type WorkspaceMode } from '@/lib/store';
import { PHASE_MAP } from '@/lib/phases';
import { bootstrapWorkspace } from '@/lib/workspace';
import { StackedCards } from '@/components/entry/StackedCards';
import { conceptFaces, presentationFaces, renderFaces } from '@/components/entry/cardFaces';
import { easeApple, springPop, pressable } from '@/lib/motion';

// 3 chặng mềm của cùng 1 pipeline — chọn nơi bắt đầu, không phải 3 app rời.
const MODES: {
  id: WorkspaceMode;
  title: string;
  desc: string;
  icon: typeof Presentation;
  faces: React.ReactNode[];
}[] = [
  {
    id: 'concept',
    title: 'Concept',
    desc: 'Moodboard, vật liệu, palette, style — khởi động ý tưởng trước khi dựng hình.',
    icon: Palette,
    faces: conceptFaces,
  },
  {
    id: 'render',
    title: 'Render',
    desc: 'Clay / sketch → phối cảnh photoreal. Đổi vật liệu, ánh sáng, upscale.',
    icon: Box,
    faces: renderFaces,
  },
  {
    id: 'present',
    title: 'Present',
    desc: 'Dàn slide 16:9, board, spec vật liệu → đóng gói cho khách duyệt.',
    icon: Presentation,
    faces: presentationFaces,
  },
];

export function LoginScreen({ onReplayIntro }: { onReplayIntro?: () => void }) {
  const setUser = useFlowStore((s) => s.setUser);
  const setWorkspace = useFlowStore((s) => s.setWorkspace);
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

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-[var(--bg)] px-6 py-10">
      {/* ambient orbs — chiều sâu điện ảnh */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -left-32 -top-24 h-96 w-96 rounded-full opacity-30 blur-[90px]"
          style={{ background: 'var(--accent)' }}
          animate={{ x: [0, 30, 0], y: [0, 20, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -bottom-32 -right-24 h-[28rem] w-[28rem] rounded-full opacity-20 blur-[100px]"
          style={{ background: '#e0996b' }}
          animate={{ x: [0, -24, 0], y: [0, -18, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: easeApple }}
        className="relative z-10 w-full max-w-4xl"
      >
        {/* brand */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="grid h-11 w-11 place-items-center rounded-[var(--radius-md)] bg-gradient-to-br from-violet-500 to-fuchsia-600 text-[16px] font-bold text-white shadow-lg">
            IF
          </div>
          <h1 className="mt-3 text-lg font-semibold tracking-tight text-[var(--t1)]">
            Bắt đầu ở chặng nào?
          </h1>
          <p className="mt-1 text-xs text-[var(--t4)]">
            Concept → Render → Present · một pipeline, chung 1 canvas — đi lại tự do sau khi vào
          </p>
        </div>

        {/* 3 chặng — stacked cards */}
        <div className="mb-9 grid gap-6 sm:grid-cols-3">
          {MODES.map((m) => {
            const active = chosen === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setChosen(m.id)}
                className="group relative flex flex-col items-center rounded-[var(--radius-xl)] p-5 text-center transition-colors"
              >
                {active && (
                  <motion.div
                    layoutId="mode-bg"
                    className="absolute inset-0 rounded-[var(--radius-xl)] bg-[var(--accent-soft)] ring-1 ring-[var(--accent-ring)]"
                    transition={springPop}
                  />
                )}
                {/* khu stacked cards — để overflow cho xòe */}
                <div className="relative z-10 grid h-[220px] w-full place-items-center [overflow:visible]">
                  <StackedCards faces={m.faces} className="relative h-[200px] w-[160px] cursor-pointer" />
                </div>
                <div className="relative z-10 mt-3 flex items-center gap-1.5">
                  <m.icon size={15} className={active ? 'text-[var(--accent)]' : 'text-[var(--t3)]'} />
                  <span className="text-sm font-semibold text-[var(--t1)]">{m.title}</span>
                </div>
                <p className="relative z-10 mt-1 max-w-[15rem] text-[11px] leading-relaxed text-[var(--t4)]">
                  {m.desc}
                </p>
              </button>
            );
          })}
        </div>

        {/* form đăng nhập — kính Apple */}
        <form
          onSubmit={submit}
          className="mat-card mx-auto w-full max-w-sm space-y-3 rounded-[var(--radius-lg)] border border-[var(--mat-hairline)] p-5"
          style={{ boxShadow: 'var(--shadow-sheet)' }}
        >
          {authMode === 'register' && (
            <input
              className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--field)] px-3 py-2 text-sm text-[var(--t1)] placeholder-[var(--t5)] outline-none transition-colors focus:border-[var(--accent-ring)]"
              placeholder="Tên hiển thị (vd: Hoà)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          )}
          <input
            type="email"
            className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--field)] px-3 py-2 text-sm text-[var(--t1)] placeholder-[var(--t5)] outline-none transition-colors focus:border-[var(--accent-ring)]"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--field)] px-3 py-2 text-sm text-[var(--t1)] placeholder-[var(--t5)] outline-none transition-colors focus:border-[var(--accent-ring)]"
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
            className="flex w-full items-center justify-center gap-2 rounded-[var(--radius-sm)] bg-[var(--accent-strong)] py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[var(--accent)] disabled:opacity-50"
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
          <div className="flex items-center justify-between pt-0.5">
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
