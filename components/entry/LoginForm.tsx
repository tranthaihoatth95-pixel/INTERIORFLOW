'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Check, Eye, EyeOff, Loader2 } from 'lucide-react';
import { easeApple, pressable } from '@/lib/motion';
import type { Lang } from '@/lib/i18n';
import { setLastUserId } from '@/lib/resume';
import { cardTextVars } from '@/components/ui/AdaptiveContrast';
import type { CardTextPlan } from '@/lib/adaptive-contrast';

/**
 * LoginForm — card đăng nhập/đăng ký kính lỏng (TÁCH từ IntroSequence Sprint 1,
 * NÂNG CẤP 19/07 login-v2).
 *
 * CHÍNH SÁCH TÀI KHOẢN MỚI (chủ dự án chốt 19/07 — thay "chỉ Google @ttt.vn"):
 *   · Đăng ký + đăng nhập email MỌI domain — tab ĐĂNG KÝ đã MỞ LẠI (server hết 403).
 *   · Google OAuth nhận mọi tài khoản (workspace lẫn gmail cá nhân).
 *   · MỚI: nút Microsoft (Entra ID — MS 365 workspace lẫn MS account cá nhân);
 *     chưa có env MS365_CLIENT_ID/SECRET → nút disabled + tooltip "chưa cấu hình".
 *   · Toggle CON MẮT xem mật khẩu ở mọi ô password (login + register).
 *   · KHÔNG có luồng reset mật khẩu — "Quên mật khẩu" chỉ hướng dẫn liên hệ admin.
 *
 * GIAO DIỆN (19/07 login-minimal — chỉ đạo "bố cục ô login rườm rà quá, cần minimalist hơn"):
 * card `lq-card` kính lỏng, bố cục tối giản từ trên xuống:
 *   tab Đăng nhập/Đăng ký (gạch chân đồng) → input GẠCH DƯỚI MẢNH (không hộp kính,
 *   theo ref 2 của user — thoáng hơn hộp trên card kính) → Ghi nhớ/Quên mật khẩu →
 *   nút chính pill → hàng logo OAuth TRẦN ở CUỐI (Google/Microsoft/Apple, không khung,
 *   chỉ logo — "người ta hay để cuối không cần đóng khung, logo thôi").
 * ĐÃ BỎ 2 dòng note ("Mọi email đều dùng được…", "Chưa có tài khoản?…") theo chỉ đạo.
 * Tab-order: form chính trước → OAuth sau → (nút Đổi nền nằm SAU trong DOM).
 *
 * B-2 giữ nguyên: checkbox "Ghi nhớ đăng nhập" — tick (mặc định) = cookie 30 ngày.
 * GIỮ NGUYÊN logic auth lõi: POST /api/auth/{login,register} → setUser(body.user).
 */

const COPPER = '#c79a63';
const SANS = '-apple-system,"SF Pro Display","SF Pro Text","Helvetica Neue","Space Grotesk",system-ui,sans-serif';

type Mode = 'login' | 'register';
type Providers = { google: boolean; apple: boolean; microsoft: boolean };

export function LoginForm({
  onAuthed,
  reduce,
  lang,
  cardPlan,
  cardTint,
}: {
  onAuthed: () => void;
  reduce: boolean;
  lang: Lang;
  /** Việc 1 — bộ chữ trong card đã giải đạt ngưỡng 4.5 (remap --t1..--t5 + sương nội bộ). */
  cardPlan?: CardTextPlan;
  /** Việc 2 · ① — tint kính lấy từ ảnh nền ("R G B"). */
  cardTint?: string;
}) {
  const [mode, setMode] = useState<Mode>('login');
  const [identifier, setIdentifier] = useState(''); // email hoặc SĐT
  const [password, setPassword] = useState('');
  const [name, setName] = useState(''); // chỉ dùng ở tab đăng ký
  // B-2: mặc định TICK — giữ đúng hành vi cũ (cookie 30 ngày) trừ khi user chủ động bỏ.
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null); // hướng dẫn (quên mật khẩu…)
  const [busy, setBusy] = useState(false);
  // provider nào đã có env — null = đang hỏi /api/auth/providers
  const [providers, setProviders] = useState<Providers | null>(null);
  const en = lang === 'en';

  useEffect(() => {
    // nút social luôn hiện; chỉ đổi trạng thái theo env server
    fetch('/api/auth/providers')
      .then((r) => (r.ok ? r.json() : { google: false, apple: false, microsoft: false }))
      .then(setProviders)
      .catch(() => setProviders({ google: false, apple: false, microsoft: false }));
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

  const afterAuth = async (user: { id?: string } | undefined) => {
    // Cập nhật user vào store → gate app/page.tsx chuyển sang màn chọn dự án.
    const { useFlowStore } = await import('@/lib/store');
    useFlowStore.getState().setUser(user as never);
    // B-3: ghi "user gần nhất" để ResumeTracker ở các route studio biết ghi resume cho ai.
    if (user?.id) setLastUserId(user.id);
    onAuthed();
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); // Enter trong bất kỳ input nào cũng submit (native form)
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      if (mode === 'login') {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier, password, remember }),
        });
        const body = await res.json();
        if (!res.ok) throw new Error(body.error ?? (en ? 'Something went wrong.' : 'Có lỗi xảy ra.'));
        await afterAuth(body.user);
      } else {
        // ĐĂNG KÝ (mở lại 19/07): identifier chứa '@' → email, ngược lại → SĐT.
        const id = identifier.trim();
        const payload = id.includes('@')
          ? { name, email: id, password }
          : { name, phone: id, password };
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const body = await res.json();
        if (!res.ok) throw new Error(body.error ?? (en ? 'Something went wrong.' : 'Có lỗi xảy ra.'));
        // register công khai đã set cookie session phía server → vào thẳng
        await afterAuth(body.user);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  // Social: env đủ → sang trang consent (full-page redirect, quay lại bằng cookie session).
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
  const microsoftSignIn = () => {
    if (providers?.microsoft) {
      window.location.assign('/api/auth/microsoft');
      return;
    }
    setError(
      en
        ? 'Microsoft Sign-In needs MS365_CLIENT_ID/MS365_CLIENT_SECRET (Azure App Registration) — see docs/INTEGRATIONS.md.'
        : 'Đăng nhập Microsoft cần MS365_CLIENT_ID/MS365_CLIENT_SECRET (Azure App Registration) — xem docs/INTEGRATIONS.md.',
    );
  };
  const appleSignIn = () => {
    setError(en ? 'Needs Apple Developer — coming soon.' : 'Cần Apple Developer — sắp bật.');
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setError(null);
    setInfo(null);
  };

  // input GẠCH DƯỚI mảnh (ref 2): nền trong suốt, chỉ 1 hairline dưới, focus chuyển đồng
  const field =
    'w-full appearance-none rounded-none border-0 border-b border-[var(--border)] bg-transparent px-0.5 py-2.5 text-sm text-[var(--t1)] placeholder-[var(--t5)] outline-none transition-colors focus:border-[color:var(--fc)]';
  const tab =
    'relative pb-1.5 text-[12px] font-semibold uppercase tracking-[0.14em] transition-colors';

  // nút Microsoft disabled khi thiếu env (tooltip nói rõ) — GIỮ hiện diện, không ẩn
  const msDisabled = !!providers && !providers.microsoft;

  return (
    <motion.form
      onSubmit={submit}
      initial={{ opacity: 0, y: reduce ? 0 : 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: easeApple, delay: 0.12 }}
      style={{
        ['--fc' as string]: 'rgba(199,154,99,0.6)',
        // Việc 2 · ① — tint kính lấy từ chính ảnh nền (≈14%, hạ từ 20% đợt glass-polish 21/07)
        ...(cardTint ? { ['--lq-tint' as string]: cardTint } : {}),
        // Việc 1 — remap bộ chữ về hệ tông đạt ngưỡng (mọi var(--t*) trong card ăn theo)
        ...(cardPlan ? cardTextVars(cardPlan) : {}),
      }}
      className="lq-card mt-7 w-full max-w-sm rounded-[24px] p-7"
    >
      {/* Việc 1 — sương NỘI BỘ trong card (chỉ khi nền quá sáng): đặt SAU chữ, đậm giữa/
          tan rìa nên card vẫn trong ở viền. plan.scrim='' khi không cần → không render. */}
      {cardPlan?.scrim && <span className="lq-scrim" style={{ background: cardPlan.scrim }} />}
      <div className="lq-content space-y-4">
      {/* ————— tab ĐĂNG NHẬP / ĐĂNG KÝ — gạch chân đồng (tinh thần ref SIGN IN/SIGN UP) ————— */}
      <div className="flex items-center justify-center gap-6 pb-1" role="tablist" style={{ fontFamily: SANS }}>
        {(['login', 'register'] as Mode[]).map((m) => {
          const on = mode === m;
          return (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => switchMode(m)}
              className={tab}
              style={{ color: on ? 'var(--t1)' : 'var(--t4)' }}
            >
              {m === 'login' ? (en ? 'Sign in' : 'Đăng nhập') : en ? 'Sign up' : 'Đăng ký'}
              <span
                aria-hidden
                className="absolute -bottom-px left-0 h-[2px] w-full rounded-full transition-opacity"
                style={{ background: COPPER, opacity: on ? 1 : 0 }}
              />
            </button>
          );
        })}
      </div>

      <AnimatePresence initial={false}>
        {mode === 'register' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: easeApple }}
            className="overflow-hidden"
          >
            <input
              className={field}
              placeholder={en ? 'Your name' : 'Tên của bạn'}
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              required
            />
          </motion.div>
        )}
      </AnimatePresence>

      <input
        className={field}
        placeholder={en ? 'Email or phone number' : 'Email hoặc số điện thoại'}
        value={identifier}
        onChange={(e) => setIdentifier(e.target.value)}
        autoComplete="username"
        required
      />

      <PasswordInput
        className={field}
        placeholder={
          mode === 'register' ? (en ? 'Password (min 6 chars)' : 'Mật khẩu (≥ 6 ký tự)') : en ? 'Password' : 'Mật khẩu'
        }
        value={password}
        onChange={setPassword}
        autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
        lang={lang}
      />

      {/* B-2: Ghi nhớ đăng nhập + quên mật khẩu (chỉ hướng dẫn — không có luồng reset) */}
      {mode === 'login' && (
        <div className="flex items-center justify-between pt-0.5">
          <label className="relative flex cursor-pointer select-none items-center gap-2">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              /* Vùng bấm phủ kín cả label (trước là sr-only 1×1px — quá nhỏ để bấm trúng
               * bằng chuột/ngón tay thật, dù forward-click từ <label> đúng chuẩn HTML.
               * Ẩn thị giác bằng opacity:0 thay vì clip về 1px, giữ nguyên kích thước. */
              className="absolute inset-0 z-10 m-0 h-full w-full cursor-pointer appearance-none opacity-0"
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
      )}

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
        className="flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold text-[var(--bg)] shadow-sm transition-opacity disabled:opacity-50"
        style={{ background: COPPER, fontFamily: SANS }}
      >
        {busy ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <>
            {mode === 'login' ? (en ? 'Enter the studio' : 'Vào xưởng') : en ? 'Create account' : 'Tạo tài khoản'}
            <ArrowRight size={14} />
          </>
        )}
      </motion.button>

      {/* ————— OAuth ở CUỐI, logo TRẦN không khung (chỉ đạo 19/07) ————— */}
      <div className="pt-2">
        <p
          className="mb-3 text-center text-[11px] uppercase tracking-[0.24em] text-[var(--t5)]"
          style={{ fontFamily: SANS }}
        >
          {en ? 'or continue with' : 'hoặc tiếp tục với'}
        </p>
        <div className="flex items-center justify-center gap-8">
          <button
            type="button"
            onClick={googleSignIn}
            aria-label="Google"
            className="grid h-10 w-10 place-items-center rounded-full transition-all hover:scale-[1.06] hover:bg-[var(--hover)]"
            style={{ opacity: providers && !providers.google ? 0.45 : 1 }}
            title={
              providers && !providers.google
                ? en
                  ? 'Needs GOOGLE_CLIENT_ID/SECRET config'
                  : 'Cần cấu hình GOOGLE_CLIENT_ID/SECRET'
                : en
                  ? 'Sign in with Google — any account'
                  : 'Đăng nhập Google — mọi tài khoản'
            }
          >
            <GoogleMark size={22} />
          </button>
          <button
            type="button"
            onClick={microsoftSignIn}
            disabled={msDisabled}
            aria-label="Microsoft"
            className="grid h-10 w-10 place-items-center rounded-full transition-all hover:scale-[1.06] hover:bg-[var(--hover)] disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:bg-transparent"
            style={{ opacity: msDisabled ? 0.45 : 1 }}
            title={
              msDisabled
                ? en
                  ? 'Not configured — needs MS365_CLIENT_ID/SECRET (Azure App Registration)'
                  : 'Chưa cấu hình — cần MS365_CLIENT_ID/SECRET (Azure App Registration)'
                : en
                  ? 'Sign in with Microsoft — MS 365 / personal'
                  : 'Đăng nhập Microsoft — MS 365 / cá nhân'
            }
          >
            <MicrosoftMark size={20} />
          </button>
          <button
            type="button"
            onClick={appleSignIn}
            aria-label="Apple"
            className="grid h-10 w-10 place-items-center rounded-full text-[var(--t1)] transition-all hover:scale-[1.06] hover:bg-[var(--hover)]"
            style={{ opacity: providers && !providers.apple ? 0.45 : 1 }}
            title={en ? 'Needs Apple Developer — coming soon' : 'Cần Apple Developer — sắp bật'}
          >
            <AppleMark size={22} />
          </button>
        </div>
      </div>
      </div>
    </motion.form>
  );
}

/** Ô mật khẩu + toggle CON MẮT xem/ẩn (19/07 login-v2) — type đổi password↔text tại chỗ. */
function PasswordInput({
  className,
  placeholder,
  value,
  onChange,
  autoComplete,
  lang,
}: {
  className: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: string;
  lang: Lang;
}) {
  const [show, setShow] = useState(false);
  const en = lang === 'en';
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        className={`${className} pr-10`}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        required
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? (en ? 'Hide password' : 'Ẩn mật khẩu') : en ? 'Show password' : 'Xem mật khẩu'}
        aria-pressed={show}
        title={show ? (en ? 'Hide password' : 'Ẩn mật khẩu') : en ? 'Show password' : 'Xem mật khẩu'}
        className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-[7px] text-[var(--t4)] transition-colors hover:text-[var(--t2)]"
      >
        {show ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
    </div>
  );
}

/** Logo Google "G" 4 màu — inline SVG, không tải asset ngoài (CSP). */
function GoogleMark({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
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

/** Logo Microsoft 4 ô vuông — inline SVG, không tải asset ngoài (CSP). */
function MicrosoftMark({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 23 23" aria-hidden>
      <rect x="1" y="1" width="10" height="10" fill="#F25022" />
      <rect x="12" y="1" width="10" height="10" fill="#7FBA00" />
      <rect x="1" y="12" width="10" height="10" fill="#00A4EF" />
      <rect x="12" y="12" width="10" height="10" fill="#FFB900" />
    </svg>
  );
}

/** Logo Apple — glyph theo currentColor (trắng trên nền tối, đen trên nền sáng). */
function AppleMark({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
    </svg>
  );
}
