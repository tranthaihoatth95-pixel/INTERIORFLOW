'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Check, Loader2 } from 'lucide-react';
import { easeApple, pressable } from '@/lib/motion';
import type { Lang } from '@/lib/i18n';
import { setLastUserId } from '@/lib/resume';

/**
 * LoginForm — ô đăng nhập dùng chung (TÁCH từ components/IntroSequence.tsx khi gỡ
 * intro khỏi luồng — Sprint 1 B-1/B-2).
 *
 * CHÍNH SÁCH TÀI KHOẢN (chủ dự án chốt Sprint 1):
 *   · Vào app CHỦ YẾU bằng Google OAuth email @ttt.vn → nút Google đặt ĐẦU, nổi bật.
 *   · Đăng ký tự do ĐÃ KHOÁ (server 403) → bỏ hẳn mode "Đăng ký" cũ; form
 *     email/SĐT + mật khẩu giữ lại cho tài khoản do admin cấp.
 *   · KHÔNG có luồng reset mật khẩu — "Quên mật khẩu" chỉ hướng dẫn liên hệ admin.
 *
 * MỚI (B-2): checkbox "Ghi nhớ đăng nhập" — tick (mặc định) = cookie 30 ngày;
 * bỏ tick = cookie phiên, đóng trình duyệt là hết (POST /api/auth/login {remember}).
 *
 * GIỮ NGUYÊN logic auth lõi: POST /api/auth/login → setUser(body.user).
 * KHÔNG chọn workspace ở đây; điều phối sau-auth nằm ở gate app/page.tsx.
 */

const COPPER = '#c79a63';
const SANS = '-apple-system,"SF Pro Display","SF Pro Text","Helvetica Neue","Space Grotesk",system-ui,sans-serif';

export function LoginForm({ onAuthed, reduce, lang }: { onAuthed: () => void; reduce: boolean; lang: Lang }) {
  const [identifier, setIdentifier] = useState(''); // email hoặc SĐT
  const [password, setPassword] = useState('');
  // B-2: mặc định TICK — giữ đúng hành vi cũ (cookie 30 ngày) trừ khi user chủ động bỏ.
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null); // hướng dẫn (quên mật khẩu…)
  const [busy, setBusy] = useState(false);
  // provider nào đã có env — null = đang hỏi /api/auth/providers
  const [providers, setProviders] = useState<{ google: boolean; apple: boolean } | null>(null);
  const en = lang === 'en';

  useEffect(() => {
    // nút social luôn hiện; chỉ đổi trạng thái theo env server
    fetch('/api/auth/providers')
      .then((r) => (r.ok ? r.json() : { google: false, apple: false }))
      .then(setProviders)
      .catch(() => setProviders({ google: false, apple: false }));
    // OAuth callback thất bại → server redirect về /?auth_error=... — nhặt lên hiển thị
    const params = new URLSearchParams(window.location.search);
    const authError = params.get('auth_error');
    if (authError) {
      setError(authError);
      params.delete('auth_error');
      const rest = params.toString();
      window.history.replaceState({}, '', window.location.pathname + (rest ? `?${rest}` : ''));
    }
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); // Enter trong bất kỳ input nào cũng submit (native form)
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password, remember }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? (en ? 'Something went wrong.' : 'Có lỗi xảy ra.'));
      // Cập nhật user vào store → gate app/page.tsx chuyển sang màn chọn dự án.
      const { useFlowStore } = await import('@/lib/store');
      useFlowStore.getState().setUser(body.user);
      // B-3: ghi "user gần nhất" để ResumeTracker ở các route studio biết ghi resume cho ai.
      if (body.user?.id) setLastUserId(body.user.id);
      onAuthed();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  // Google: env đủ → sang trang consent (full-page redirect, quay lại bằng cookie session).
  // Chưa cấu hình → nói rõ tại chỗ thay vì điều hướng vào lỗi 503.
  const googleSignIn = () => {
    if (providers?.google) {
      window.location.assign('/api/auth/google');
      return;
    }
    setError(
      en
        ? 'Google Sign-In needs GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET in .env.local.'
        : 'Đăng nhập Google cần cấu hình GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET trong .env.local.',
    );
  };
  const appleSignIn = () => {
    setError(en ? 'Needs Apple Developer — coming soon.' : 'Cần Apple Developer — sắp bật.');
  };

  const field =
    'w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--field)] px-3.5 py-2.5 text-sm text-[var(--t1)] placeholder-[var(--t5)] outline-none transition-colors focus:border-[color:var(--fc)]';

  return (
    <motion.form
      onSubmit={submit}
      initial={{ opacity: 0, y: reduce ? 0 : 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: easeApple, delay: 0.12 }}
      style={{ ['--fc' as string]: 'rgba(199,154,99,0.6)', boxShadow: 'var(--shadow-sheet)' }}
      className="mat-card mt-7 w-full max-w-sm space-y-3 rounded-[var(--radius-lg)] border border-[var(--mat-hairline)] p-5"
    >
      {/* ————— GOOGLE TRƯỚC, NỔI BẬT — lối vào chính (email @ttt.vn) ————— */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={googleSignIn}
          className="flex h-11 flex-[2.4] items-center justify-center gap-2 rounded-[var(--radius-sm)] text-[13.5px] font-semibold transition-opacity"
          style={{
            fontFamily: SANS,
            background: '#ffffff',
            color: '#1f1f1f',
            border: '1px solid var(--border)',
            opacity: providers && !providers.google ? 0.55 : 1,
          }}
          title={
            providers && !providers.google
              ? en
                ? 'Needs GOOGLE_CLIENT_ID/SECRET config'
                : 'Cần cấu hình GOOGLE_CLIENT_ID/SECRET'
              : en
                ? 'Sign in with Google (@ttt.vn)'
                : 'Đăng nhập Google (@ttt.vn)'
          }
        >
          <GoogleMark />
          <span>{en ? 'Sign in with Google' : 'Đăng nhập với Google'}</span>
        </button>
        <button
          type="button"
          onClick={appleSignIn}
          aria-label="Apple"
          className="flex h-11 flex-1 items-center justify-center gap-2 rounded-[var(--radius-sm)] text-[13px] font-medium transition-opacity"
          style={{
            fontFamily: SANS,
            background: '#000000',
            color: '#ffffff',
            border: '1px solid var(--border)',
            opacity: providers && !providers.apple ? 0.55 : 1,
          }}
          title={en ? 'Needs Apple Developer — coming soon' : 'Cần Apple Developer — sắp bật'}
        >
          <AppleMark />
        </button>
      </div>
      <p className="text-center text-[11px] text-[var(--t5)]" style={{ fontFamily: SANS }}>
        {en ? 'Team accounts use @ttt.vn email.' : 'Tài khoản team dùng email @ttt.vn.'}
      </p>

      {/* ————— hoặc: tài khoản admin cấp ————— */}
      <div className="flex items-center gap-3 pt-0.5">
        <span className="h-px flex-1" style={{ background: 'var(--border)' }} />
        <span className="text-[11px] uppercase tracking-[0.16em] text-[var(--t5)]" style={{ fontFamily: SANS }}>
          {en ? 'or admin-issued account' : 'hoặc tài khoản admin cấp'}
        </span>
        <span className="h-px flex-1" style={{ background: 'var(--border)' }} />
      </div>

      <input
        className={field}
        placeholder={en ? 'Email or phone number' : 'Email hoặc số điện thoại'}
        value={identifier}
        onChange={(e) => setIdentifier(e.target.value)}
        autoComplete="username"
        required
      />

      <input
        type="password"
        className={field}
        placeholder={en ? 'Password' : 'Mật khẩu'}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="current-password"
        required
      />

      {/* B-2: Ghi nhớ đăng nhập + quên mật khẩu (chỉ hướng dẫn — không có luồng reset) */}
      <div className="flex items-center justify-between pt-0.5">
        <label className="flex cursor-pointer select-none items-center gap-2">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="peer sr-only"
          />
          <span
            aria-hidden
            className="grid h-4 w-4 shrink-0 place-items-center rounded-[5px] border transition-colors"
            style={{
              borderColor: remember ? COPPER : 'var(--border)',
              background: remember ? COPPER : 'transparent',
            }}
          >
            {remember && <Check size={11} strokeWidth={3} style={{ color: 'var(--bg)' }} />}
          </span>
          <span className="text-xs text-[var(--t3)]" style={{ fontFamily: SANS }}>
            {en ? 'Keep me signed in' : 'Ghi nhớ đăng nhập'}
          </span>
        </label>
        <button
          type="button"
          onClick={() =>
            setInfo(
              en
                ? 'No email reset here — ping an admin to reset your password.'
                : 'Không có luồng reset qua email — nhắn admin để đặt lại mật khẩu.',
            )
          }
          className="text-xs text-[var(--t4)] transition-colors hover:text-[var(--t2)]"
          style={{ fontFamily: SANS }}
        >
          {en ? 'Forgot password?' : 'Quên mật khẩu?'}
        </button>
      </div>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[var(--radius-sm)] bg-red-500/10 px-3 py-2 text-xs text-red-400"
        >
          {error}
        </motion.p>
      )}
      {info && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[var(--radius-sm)] px-3 py-2 text-xs"
          style={{ background: 'rgba(199,154,99,0.12)', color: COPPER }}
        >
          {info}
        </motion.p>
      )}

      <motion.button
        {...pressable}
        type="submit"
        disabled={busy}
        className="flex w-full items-center justify-center gap-2 rounded-[var(--radius-sm)] py-3 text-sm font-semibold text-[var(--bg)] shadow-sm transition-opacity disabled:opacity-50"
        style={{ background: COPPER, fontFamily: SANS }}
      >
        {busy ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <>
            {en ? 'Enter the studio' : 'Vào xưởng'}
            <ArrowRight size={14} />
          </>
        )}
      </motion.button>

      {/* Đăng ký tự do đã khoá — nói rõ thay vì giấu (đỡ hoang mang cho người mới). */}
      <p className="w-full pt-1 text-center text-xs text-[var(--t5)]" style={{ fontFamily: SANS }}>
        {en ? 'Need an account? Use Google @ttt.vn or ask an admin.' : 'Cần tài khoản? Dùng Google @ttt.vn hoặc liên hệ admin.'}
      </p>
    </motion.form>
  );
}

/** Logo Google "G" 4 màu — inline SVG, không tải asset ngoài (CSP). */
function GoogleMark() {
  return (
    <svg width="15" height="15" viewBox="0 0 48 48" aria-hidden>
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

/** Logo Apple — glyph trắng trên nền đen theo đúng style nút Apple. */
function AppleMark() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="#ffffff" aria-hidden>
      <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
    </svg>
  );
}
