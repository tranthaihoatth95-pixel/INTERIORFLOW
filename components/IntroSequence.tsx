'use client';

import { useEffect, useReducer, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ArrowRight, Loader2 } from 'lucide-react';
import { easeApple, pressable } from '@/lib/motion';
import { useLang, type Lang } from '@/lib/i18n';
import { LangToggle } from '@/components/LangToggle';

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
  const [i, setI] = useReducer((_: number, v: number) => v, 0);
  const reduce = useReducedMotion();
  const lang = useLang();
  const last = i === SCENES.length - 1; // cảnh đăng nhập
  const scene = SCENES[i];

  // auto-advance qua các cảnh kể chuyện, DỪNG ở cảnh đăng nhập
  useEffect(() => {
    if (last) return;
    const t = setTimeout(() => setI(i + 1), HOLD);
    return () => clearTimeout(t);
  }, [i, last]);

  const gotoLogin = () => setI(SCENES.length - 1);

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
            className="h-[3px] overflow-hidden rounded-full transition-all duration-500"
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
 * LoginForm — ô đăng nhập ngay trong intro. GIỮ NGUYÊN logic auth lõi:
 *   POST /api/auth/{login|register} → setUser(body.user).
 * Mới (07/26):
 *   · đăng nhập bằng identifier = email HOẶC SĐT VN (server tự nhận dạng)
 *   · đăng ký chọn kênh Email | Số điện thoại (không OTP — app nội bộ/LAN)
 *   · social: Google (OAuth thật, env-gated) + Apple (stub "sắp bật")
 *     — nút LUÔN hiển thị; chưa cấu hình env thì chuyển trạng thái "cần cấu hình".
 * KHÔNG chọn workspace ở đây; việc chọn chặng chuyển sang màn StageSelect sau auth.
 * ==========================================================================*/
function LoginForm({ onAuthed, reduce, lang }: { onAuthed: () => void; reduce: boolean; lang: Lang }) {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [regChannel, setRegChannel] = useState<'email' | 'phone'>('email'); // kênh đăng ký
  const [identifier, setIdentifier] = useState(''); // login: email hoặc SĐT
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
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
    try {
      const payload =
        authMode === 'login'
          ? { identifier, password }
          : { name, password, ...(regChannel === 'email' ? { email } : { phone }) };
      const res = await fetch(`/api/auth/${authMode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? (en ? 'Something went wrong.' : 'Có lỗi xảy ra.'));
      // Cập nhật user vào store → gate app/page.tsx chuyển sang màn chọn chặng.
      const { useFlowStore } = await import('@/lib/store');
      useFlowStore.getState().setUser(body.user);
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
  const socialBtn =
    'flex h-10 flex-1 items-center justify-center gap-2 rounded-[var(--radius-sm)] text-[13px] font-medium transition-opacity disabled:cursor-default';

  return (
    <motion.form
      onSubmit={submit}
      initial={{ opacity: 0, y: reduce ? 0 : 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: easeApple, delay: 0.12 }}
      style={{ ['--fc' as string]: 'rgba(199,154,99,0.6)', boxShadow: 'var(--shadow-sheet)' }}
      className="mat-card mt-7 w-full max-w-sm space-y-3 rounded-[var(--radius-lg)] border border-[var(--mat-hairline)] p-5"
    >
      {authMode === 'register' && (
        <>
          <input
            className={field}
            placeholder={en ? 'Display name (e.g. Hoa)' : 'Tên hiển thị (vd: Hoà)'}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          {/* kênh đăng ký: Email | Số điện thoại — segmented nhỏ, hoà với field */}
          <div
            className="flex gap-1 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--field)] p-1"
            role="tablist"
            aria-label={en ? 'Sign-up method' : 'Cách đăng ký'}
          >
            {(['email', 'phone'] as const).map((ch) => (
              <button
                key={ch}
                type="button"
                role="tab"
                aria-selected={regChannel === ch}
                onClick={() => setRegChannel(ch)}
                className="flex-1 rounded-[calc(var(--radius-sm)-4px)] py-1.5 text-xs transition-colors"
                style={{
                  fontFamily: SANS,
                  background: regChannel === ch ? 'rgba(199,154,99,0.16)' : 'transparent',
                  color: regChannel === ch ? 'var(--t1)' : 'var(--t4)',
                }}
              >
                {ch === 'email' ? 'Email' : en ? 'Phone' : 'Số điện thoại'}
              </button>
            ))}
          </div>
        </>
      )}

      {authMode === 'login' ? (
        <input
          className={field}
          placeholder={en ? 'Email or phone number' : 'Email hoặc số điện thoại'}
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          autoComplete="username"
          required
        />
      ) : regChannel === 'email' ? (
        <input
          type="email"
          className={field}
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />
      ) : (
        <input
          type="tel"
          className={field}
          placeholder={en ? 'Phone number (e.g. 0912345678)' : 'Số điện thoại (vd: 0912345678)'}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          autoComplete="tel"
          required
        />
      )}

      <input
        type="password"
        className={field}
        placeholder={en ? 'Password (≥ 6 characters)' : 'Mật khẩu (≥ 6 ký tự)'}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
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
        className="flex w-full items-center justify-center gap-2 rounded-[var(--radius-sm)] py-3 text-sm font-semibold text-[var(--bg)] shadow-sm transition-opacity disabled:opacity-50"
        style={{ background: COPPER, fontFamily: SANS }}
      >
        {busy ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <>
            {authMode === 'login' ? (en ? 'Enter the studio' : 'Vào xưởng') : en ? 'Create account' : 'Tạo tài khoản'}
            <ArrowRight size={14} />
          </>
        )}
      </motion.button>

      {/* ————— hoặc ————— */}
      <div className="flex items-center gap-3 pt-0.5">
        <span className="h-px flex-1" style={{ background: 'var(--border)' }} />
        <span className="text-[11px] uppercase tracking-[0.16em] text-[var(--t5)]" style={{ fontFamily: SANS }}>
          {en ? 'or' : 'hoặc'}
        </span>
        <span className="h-px flex-1" style={{ background: 'var(--border)' }} />
      </div>

      {/* social — luôn hiển thị; thiếu env thì mờ nhẹ + chú thích, KHÔNG ẩn */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={googleSignIn}
          className={socialBtn}
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
                ? 'Sign in with Google'
                : 'Đăng nhập bằng Google'
          }
        >
          <GoogleMark />
          <span>Google</span>
          {providers && !providers.google && (
            <span className="text-[10px] font-normal" style={{ color: '#8a8a8a' }}>
              · {en ? 'setup needed' : 'cần cấu hình'}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={appleSignIn}
          className={socialBtn}
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
          <span>Apple</span>
        </button>
      </div>

      <button
        type="button"
        onClick={() => {
          setAuthMode(authMode === 'login' ? 'register' : 'login');
          setError(null);
        }}
        className="w-full pt-1 text-center text-xs text-[var(--t4)] transition-colors hover:text-[var(--t2)]"
      >
        {authMode === 'login'
          ? en
            ? "No account yet? Sign up"
            : 'Chưa có tài khoản? Đăng ký'
          : en
            ? 'Already have an account? Sign in'
            : 'Đã có tài khoản? Đăng nhập'}
      </button>
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
