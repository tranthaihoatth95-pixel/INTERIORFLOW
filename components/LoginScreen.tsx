'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useFlowStore } from '@/lib/store';
import { bootstrapWorkspace } from '@/lib/workspace';

export function LoginScreen() {
  const setUser = useFlowStore((s) => s.setUser);
  const [mode, setMode] = useState<'login' | 'register'>('login');
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
      const res = await fetch(`/api/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mode === 'login' ? { email, password } : { email, name, password }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? 'Có lỗi xảy ra.');
      setUser(body.user);
      await bootstrapWorkspace();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid h-screen place-items-center bg-[var(--bg)] p-6">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 text-[15px] font-bold text-white">
            IF
          </div>
          <div>
            <p className="text-base font-semibold tracking-tight text-[var(--t1)]">InteriorFlow</p>
            <p className="text-xs text-[var(--t4)]">Workspace nội bộ — đăng nhập để lưu flow, credits, chat team</p>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-xl shadow-black/10">
          {mode === 'register' && (
            <input
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--field)] px-3 py-2 text-sm text-[var(--t1)] placeholder-[var(--t5)] outline-none focus:border-violet-500/60"
              placeholder="Tên hiển thị (vd: Hoà)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          )}
          <input
            type="email"
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--field)] px-3 py-2 text-sm text-[var(--t1)] placeholder-[var(--t5)] outline-none focus:border-violet-500/60"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--field)] px-3 py-2 text-sm text-[var(--t1)] placeholder-[var(--t5)] outline-none focus:border-violet-500/60"
            placeholder="Mật khẩu (≥ 6 ký tự)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-violet-600 py-2 text-sm font-medium text-white transition hover:bg-violet-500 disabled:opacity-50"
          >
            {busy && <Loader2 size={14} className="animate-spin" />}
            {mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
          </button>
          <button
            type="button"
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            className="w-full text-center text-xs text-[var(--t4)] hover:text-[var(--t2)]"
          >
            {mode === 'login' ? 'Chưa có tài khoản? Đăng ký' : 'Đã có tài khoản? Đăng nhập'}
          </button>
          <p className="text-center text-[10px] leading-relaxed text-[var(--t5)]">
            Người đăng ký đầu tiên là admin (500 credits) · thành viên sau 200 credits
          </p>
        </form>
      </div>
    </div>
  );
}
