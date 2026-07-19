'use client';

/**
 * components/entry/LoginBackdrop.tsx — NỀN ĐỘNG màn đăng nhập.
 *
 * Sprint 2 · C-2 (gốc): preset gradient trôi chậm + ảnh riêng upload, lưu localStorage.
 * 19/07 (login-v2) — DYNAMIC WALLPAPER mở rộng:
 * - Thư viện ảnh TTT: 30 render thật ở public/wallpapers/ttt-01..30.jpg (1920px, ≤~350KB).
 * - Chế độ TĨNH: preset gradient / 1 ảnh thư viện / ảnh upload (như cũ).
 * - Chế độ TRÌNH CHIẾU (Photo Shuffle) — MẶC ĐỊNH cho user chưa lưu lựa chọn
 *   (19/07): tự chuyển ảnh ~22s, crossfade 1.8s ease-in-out,
 *   Ken Burns zoom/pan rất nhẹ (2 hướng xen kẽ) — cảm giác "live wallpaper".
 *   User chọn ảnh nào tham gia + thứ tự ngẫu nhiên/tuần tự. Preload ảnh KẾ TIẾP
 *   trước khi crossfade (không giật); KHÔNG tải cả 30 ảnh khi mở login.
 * - prefers-reduced-motion: tắt Ken Burns + tắt autoplay (đứng ở ảnh đầu).
 *
 * Tone chữ: mỗi nền khai báo tone 'auto' | 'dark' | 'light' — LoginScreen gắn
 * data-login-tone lên wrapper để CSS ép bộ biến chữ/viền tương ứng (globals.css).
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image as ImageIcon, Check, Trash2, Upload, Play, Shuffle, ListOrdered } from 'lucide-react';
import { easeApple, pressableIcon } from '@/lib/motion';
import type { Lang } from '@/lib/i18n';

const LS_KEY = 'interiorflow.login-bg';

/** Nhịp trình chiếu: đổi ảnh mỗi 22s, crossfade 1.8s ease mềm (chỉ đạo 19/07:
 *  "phải mượt, đẹp, không gây khó chịu" — fade 1.5–2s, chu kỳ ~20–25s). */
const SLIDESHOW_INTERVAL_MS = 22_000;
const CROSSFADE_S = 1.8;

export type LoginTone = 'auto' | 'dark' | 'light';

interface BgPreset {
  id: string;
  vi: string;
  en: string;
  tone: LoginTone;
  /** gradient CSS (trừ preset 'ember' — render riêng bằng quầng đồng). */
  gradient?: string;
  /** swatch nhỏ trong popover. */
  swatch: string;
}

/** Bộ preset quiet-luxury — tông đá ấm / mực / lụa, tiết chế. */
export const BG_PRESETS: BgPreset[] = [
  {
    id: 'ember',
    vi: 'Đêm ấm',
    en: 'Warm night',
    tone: 'auto', // theo theme app (giữ hành vi màn login cũ)
    swatch: 'radial-gradient(circle at 50% 55%, #c79a63 0%, #17130e 70%)',
  },
  {
    id: 'ink',
    vi: 'Mực đêm',
    en: 'Ink',
    tone: 'dark',
    gradient: 'linear-gradient(126deg, #0b0d12 0%, #131721 34%, #1a1510 68%, #0c0c0e 100%)',
    swatch: 'linear-gradient(126deg, #0b0d12, #1a2030 60%, #221a10)',
  },
  {
    id: 'stone',
    vi: 'Đá ấm',
    en: 'Warm stone',
    tone: 'dark',
    gradient: 'linear-gradient(118deg, #191612 0%, #2a241c 42%, #1c1a17 74%, #14120f 100%)',
    swatch: 'linear-gradient(118deg, #191612, #383024 60%, #1c1a17)',
  },
  {
    id: 'linen',
    vi: 'Lụa sáng',
    en: 'Linen',
    tone: 'light',
    gradient: 'linear-gradient(124deg, #f4efe6 0%, #e9e0d0 38%, #f6f2ea 70%, #e5dcc9 100%)',
    swatch: 'linear-gradient(124deg, #f4efe6, #e4d9c4 60%, #f6f2ea)',
  },
];

/** Thư viện ảnh nền TTT (demo 30 render — user lọc bộ cuối sau, sắp theo tên). */
export const WALLPAPERS: { id: string; src: string }[] = Array.from({ length: 30 }, (_, i) => {
  const id = `ttt-${String(i + 1).padStart(2, '0')}`;
  return { id, src: `/wallpapers/${id}.jpg` };
});
const WALLPAPER_IDS = new Set(WALLPAPERS.map((w) => w.id));
const wallSrc = (id: string) => `/wallpapers/${id}.jpg`;

export type BgChoice =
  | { kind: 'preset'; id: string }
  | { kind: 'image'; data: string } // ảnh user upload (dataURL)
  | { kind: 'wall'; id: string } // 1 ảnh thư viện TTT, tĩnh
  | { kind: 'slideshow'; ids: string[]; order: 'shuffle' | 'seq' };

function loadChoice(): BgChoice {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as BgChoice;
      if (parsed.kind === 'image' && typeof parsed.data === 'string') return parsed;
      if (parsed.kind === 'preset' && BG_PRESETS.some((p) => p.id === parsed.id)) return parsed;
      if (parsed.kind === 'wall' && WALLPAPER_IDS.has(parsed.id)) return parsed;
      if (parsed.kind === 'slideshow' && Array.isArray(parsed.ids)) {
        const ids = parsed.ids.filter((id) => WALLPAPER_IDS.has(id));
        if (ids.length > 0) {
          return { kind: 'slideshow', ids, order: parsed.order === 'seq' ? 'seq' : 'shuffle' };
        }
      }
    }
  } catch {
    /* hỏng thì về mặc định */
  }
  // MẶC ĐỊNH (chỉ đạo 19/07): user CHƯA từng chọn nền → TRÌNH CHIẾU bộ 30 ảnh TTT
  // ("như vậy trước để thấy độ đẹp"). User đã lưu lựa chọn thì tôn trọng như cũ (trên).
  return { kind: 'slideshow', ids: WALLPAPERS.map((w) => w.id), order: 'shuffle' };
}

function saveChoice(c: BgChoice) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(c));
  } catch {
    /* quota đầy — bỏ qua, nền vẫn áp trong phiên */
  }
}

/** Resize ảnh về ≤1600px cạnh dài, JPEG 0.82 — vừa nét vừa lọt quota localStorage. */
async function fileToDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const MAX = 1600;
  const scale = Math.min(1, MAX / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  return canvas.toDataURL('image/jpeg', 0.82);
}

export function useLoginBackdrop() {
  // SSR-safe: server render mặc định, mount xong mới đọc localStorage.
  const [choice, setChoice] = useState<BgChoice>({ kind: 'preset', id: 'ember' });
  useEffect(() => {
    setChoice(loadChoice());
  }, []);
  const pick = (c: BgChoice) => {
    setChoice(c);
    saveChoice(c);
  };
  const tone: LoginTone =
    choice.kind === 'image' || choice.kind === 'wall' || choice.kind === 'slideshow'
      ? 'dark' // ảnh tự do → scrim tối + chữ sáng (an toàn đọc)
      : (BG_PRESETS.find((p) => p.id === choice.id)?.tone ?? 'auto');
  return { choice, pick, tone };
}

/* ---------- Scrim dùng chung cho mọi nền ảnh (chữ + card kính luôn nổi) ---------- */

function PhotoScrim() {
  return (
    <div
      className="absolute inset-0"
      style={{
        background:
          'radial-gradient(120% 92% at 50% 45%, rgba(0,0,0,0.34) 0%, rgba(0,0,0,0.62) 100%)',
      }}
    />
  );
}

/* ---------- Trình chiếu (Photo Shuffle) ---------- */

/** Fisher–Yates — trộn 1 lần mỗi khi danh sách đổi, không reshuffle giữa chừng. */
function shuffled<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function SlideshowLayer({ ids, order, reduce }: { ids: string[]; order: 'shuffle' | 'seq'; reduce: boolean }) {
  // playlist cố định theo (ids, order) — shuffle trộn 1 lần lúc mount/đổi bộ ảnh
  const playlist = useMemo(
    () => (order === 'shuffle' ? shuffled(ids) : [...ids].sort()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ids.join(','), order],
  );
  // idx = null → ảnh ĐẦU chưa preload xong: chưa mount layer nào (nền --bg phía dưới),
  // load xong mới fade-in 1 nhịp crossfade — không pop ảnh nửa chừng, không nháy trắng.
  const [idx, setIdx] = useState<number | null>(null);
  // tick: chỉ để RE-ARM hẹn giờ khi lượt trước bị bỏ qua (tab ẩn) mà idx không đổi
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let cancelled = false;
    setIdx(null);
    const img = new window.Image();
    const show = () => {
      if (!cancelled) setIdx(0);
    };
    img.onload = show;
    img.onerror = show; // ảnh đầu hỏng vẫn hiện layer (browser tự lo alt) — không kẹt nền đen
    img.src = wallSrc(playlist[0]);
    return () => {
      cancelled = true;
    };
  }, [playlist]);

  // Autoplay: hẹn giờ → PRELOAD ảnh kế tiếp → khi ảnh sẵn sàng mới crossfade (không giật).
  // reduce-motion hoặc chỉ 1 ảnh → không autoplay.
  // Tab ẨN (document.hidden) → KHÔNG advance: rAF của framer bị pause khi tab nền,
  // nếu cứ đổi idx thì layer chồng đống opacity 0 không exit được — chỉ re-arm chờ lượt sau.
  useEffect(() => {
    if (idx === null || reduce || playlist.length < 2) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      if (document.hidden) {
        if (!cancelled) setTick((t) => t + 1); // thử lại sau 1 nhịp nữa, không mount layer mới
        return;
      }
      const next = (idx + 1) % playlist.length;
      const img = new window.Image();
      img.onload = () => {
        if (!cancelled) setIdx(next);
      };
      img.onerror = () => {
        if (!cancelled) setIdx(next); // ảnh hỏng vẫn đi tiếp, không kẹt vòng
      };
      img.src = wallSrc(playlist[next]);
    }, SLIDESHOW_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [idx, tick, playlist, reduce]);

  const current = idx === null ? null : playlist[idx % playlist.length];

  return (
    <div className="absolute inset-0">
      {/* initial KHÔNG tắt: ảnh đầu (đã preload xong) cũng fade-in mềm từ nền tối */}
      <AnimatePresence mode="sync">
        {current && (
          <motion.div
            key={current}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: CROSSFADE_S, ease: 'easeInOut' }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={wallSrc(current)}
              alt=""
              // Ken Burns 2 hướng xen kẽ theo vị trí trong playlist — "live wallpaper" rất nhẹ.
              // Layer cũ giữ nguyên animation của nó trong lúc fade-out → không khựng.
              className={`h-full w-full object-cover ${reduce ? '' : (idx ?? 0) % 2 === 0 ? 'if-login-kenburns' : 'if-login-kenburns-b'}`}
              draggable={false}
            />
          </motion.div>
        )}
      </AnimatePresence>
      <PhotoScrim />
    </div>
  );
}

/* ---------- Lớp NỀN (đặt dưới cùng, pointer-events none) ---------- */

export function LoginBackdropLayer({ choice, reduce }: { choice: BgChoice; reduce: boolean }) {
  const preset = choice.kind === 'preset' ? BG_PRESETS.find((p) => p.id === choice.id) : null;
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {choice.kind === 'slideshow' ? (
        <SlideshowLayer ids={choice.ids} order={choice.order} reduce={reduce} />
      ) : (
        <AnimatePresence mode="sync" initial={false}>
          {choice.kind === 'image' || choice.kind === 'wall' ? (
            <motion.div
              key={choice.kind === 'image' ? `img:${choice.data.slice(0, 32)}` : `wall:${choice.id}`}
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: easeApple }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={choice.kind === 'image' ? choice.data : wallSrc(choice.id)}
                alt=""
                className={`h-full w-full object-cover ${reduce ? '' : 'if-login-kenburns'}`}
                draggable={false}
              />
              {/* scrim: giữa tối nhẹ để chữ + card kính nổi trên ảnh bất kỳ */}
              <PhotoScrim />
            </motion.div>
          ) : preset && preset.gradient ? (
            <motion.div
              key={`preset:${preset.id}`}
              className={`absolute inset-0 ${reduce ? '' : 'if-login-gradient'}`}
              style={{ background: preset.gradient, backgroundSize: '240% 240%' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: easeApple }}
            />
          ) : (
            /* 'ember' mặc định — quầng đồng trôi chậm + nền theme (di sản intro cũ) */
            <motion.div
              key="preset:ember"
              className="absolute inset-0"
              style={{ background: 'var(--bg)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: easeApple }}
            >
              <motion.div
                className="absolute left-1/2 top-1/2 h-[54rem] w-[54rem] -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{ background: 'radial-gradient(circle, #c79a63 0%, transparent 62%)', filter: 'blur(90px)' }}
                initial={{ opacity: 0.06 }}
                animate={reduce ? { opacity: 0.08 } : { opacity: [0.05, 0.11, 0.05], scale: [1, 1.06, 1] }}
                transition={{ duration: 24, repeat: Infinity, ease: 'easeInOut' }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      )}
      {/* vignette điện ảnh chung cho các nền KHÔNG phải ảnh (ảnh có scrim riêng) */}
      {choice.kind === 'preset' && (
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(120% 92% at 50% 45%, transparent 38%, rgba(0,0,0,0.55) 100%)',
          }}
        />
      )}
    </div>
  );
}

/* ---------- Nút đổi nền + popover (góc phải-dưới) ---------- */

export function LoginBackdropPicker({
  choice,
  onPick,
  lang,
}: {
  choice: BgChoice;
  onPick: (c: BgChoice) => void;
  lang: Lang;
}) {
  const [open, setOpen] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const en = lang === 'en';

  const isSlideshow = choice.kind === 'slideshow';
  const slideshowIds = isSlideshow ? choice.ids : WALLPAPERS.map((w) => w.id);
  const slideshowOrder = isSlideshow ? choice.order : 'shuffle';

  const upload = async (file: File | null) => {
    if (!file) return;
    setErr(null);
    try {
      const data = await fileToDataUrl(file);
      onPick({ kind: 'image', data });
    } catch {
      setErr(en ? 'Could not read that image.' : 'Không đọc được ảnh này.');
    }
  };

  /** Bật/tắt 1 ảnh khỏi bộ trình chiếu — giữ tối thiểu 1 ảnh. */
  const toggleSlide = (id: string) => {
    if (!isSlideshow) return;
    const has = choice.ids.includes(id);
    const ids = has ? choice.ids.filter((x) => x !== id) : [...choice.ids, id].sort();
    if (ids.length === 0) return; // không cho bỏ hết
    onPick({ kind: 'slideshow', ids, order: choice.order });
  };

  const modeBtn =
    'flex h-8 flex-1 items-center justify-center gap-1.5 rounded-[9px] border text-[11px] transition-colors';

  return (
    <div className="absolute bottom-5 right-5 z-30">
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.98 }}
              transition={{ duration: 0.2, ease: easeApple }}
              className="lq-card absolute bottom-11 right-0 z-40 w-[19rem] rounded-[16px] p-3"
            >
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--t4)]">
                {en ? 'Backdrop' : 'Nền đăng nhập'}
              </p>

              {/* ————— chọn CHẾ ĐỘ: tĩnh / trình chiếu ————— */}
              <div className="mb-2.5 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onPick({ kind: 'preset', id: 'ember' })}
                  className={modeBtn}
                  style={{
                    borderColor: !isSlideshow ? '#c79a63' : 'var(--border)',
                    color: !isSlideshow ? '#c79a63' : 'var(--t3)',
                  }}
                >
                  <ImageIcon size={11} />
                  {en ? 'Still' : 'Tĩnh'}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onPick({ kind: 'slideshow', ids: slideshowIds, order: slideshowOrder })
                  }
                  className={modeBtn}
                  style={{
                    borderColor: isSlideshow ? '#c79a63' : 'var(--border)',
                    color: isSlideshow ? '#c79a63' : 'var(--t3)',
                  }}
                >
                  <Play size={11} />
                  {en ? 'Slideshow' : 'Trình chiếu'}
                </button>
              </div>

              {!isSlideshow && (
                <>
                  {/* preset gradient */}
                  <div className="grid grid-cols-4 gap-2">
                    {BG_PRESETS.map((p) => {
                      const on = choice.kind === 'preset' && choice.id === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => onPick({ kind: 'preset', id: p.id })}
                          title={en ? p.en : p.vi}
                          className="group flex flex-col items-center gap-1"
                        >
                          <span
                            className="relative grid h-10 w-full place-items-center rounded-[9px] border transition-transform group-hover:scale-[1.04]"
                            style={{
                              background: p.swatch,
                              borderColor: on ? '#c79a63' : 'var(--border)',
                              boxShadow: on ? '0 0 0 1px #c79a63' : undefined,
                            }}
                          >
                            {on && <Check size={12} strokeWidth={3} style={{ color: '#fff', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,.6))' }} />}
                          </span>
                          <span className="text-[9.5px] leading-none text-[var(--t4)]">{en ? p.en : p.vi}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* thư viện TTT — chọn 1 ảnh làm nền tĩnh */}
                  <p className="mb-1.5 mt-2.5 text-[10px] uppercase tracking-[0.14em] text-[var(--t5)]">
                    {en ? 'TTT library' : 'Thư viện TTT'}
                  </p>
                  <div className="grid max-h-40 grid-cols-4 gap-1.5 overflow-y-auto pr-0.5">
                    {WALLPAPERS.map((w) => {
                      const on = choice.kind === 'wall' && choice.id === w.id;
                      return (
                        <button
                          key={w.id}
                          type="button"
                          onClick={() => onPick({ kind: 'wall', id: w.id })}
                          title={w.id}
                          className="relative overflow-hidden rounded-[7px] border transition-transform hover:scale-[1.04]"
                          style={{
                            borderColor: on ? '#c79a63' : 'var(--border)',
                            boxShadow: on ? '0 0 0 1px #c79a63' : undefined,
                          }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={w.src} alt="" loading="lazy" className="aspect-[4/3] w-full object-cover" draggable={false} />
                          {on && (
                            <span className="absolute inset-0 grid place-items-center bg-black/25">
                              <Check size={13} strokeWidth={3} style={{ color: '#fff', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,.6))' }} />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-2.5 flex items-center gap-1.5 border-t border-[var(--border)] pt-2.5">
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="flex h-8 flex-1 items-center justify-center gap-1.5 rounded-[9px] border border-[var(--border)] text-[11px] text-[var(--t2)] transition-colors hover:bg-[var(--hover)]"
                    >
                      <Upload size={11} />
                      {en ? 'Your photo' : 'Ảnh của bạn'}
                    </button>
                    {choice.kind === 'image' && (
                      <button
                        type="button"
                        onClick={() => onPick({ kind: 'preset', id: 'ember' })}
                        title={en ? 'Remove photo' : 'Gỡ ảnh'}
                        className="grid h-8 w-8 place-items-center rounded-[9px] border border-[var(--border)] text-[var(--t4)] transition-colors hover:bg-[var(--hover)] hover:text-red-400"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                  {err && <p className="mt-1.5 text-[10px] text-red-400">{err}</p>}
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      void upload(e.target.files?.[0] ?? null);
                      e.target.value = '';
                    }}
                  />
                </>
              )}

              {isSlideshow && choice.kind === 'slideshow' && (
                <>
                  {/* thứ tự phát */}
                  <div className="mb-2 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onPick({ ...choice, order: 'shuffle' })}
                      className={modeBtn}
                      style={{
                        borderColor: choice.order === 'shuffle' ? '#c79a63' : 'var(--border)',
                        color: choice.order === 'shuffle' ? '#c79a63' : 'var(--t3)',
                      }}
                    >
                      <Shuffle size={11} />
                      {en ? 'Shuffle' : 'Ngẫu nhiên'}
                    </button>
                    <button
                      type="button"
                      onClick={() => onPick({ ...choice, order: 'seq' })}
                      className={modeBtn}
                      style={{
                        borderColor: choice.order === 'seq' ? '#c79a63' : 'var(--border)',
                        color: choice.order === 'seq' ? '#c79a63' : 'var(--t3)',
                      }}
                    >
                      <ListOrdered size={11} />
                      {en ? 'In order' : 'Tuần tự'}
                    </button>
                  </div>

                  {/* chọn ảnh tham gia trình chiếu */}
                  <p className="mb-1.5 text-[10px] uppercase tracking-[0.14em] text-[var(--t5)]">
                    {en
                      ? `Photos in show · ${choice.ids.length}/${WALLPAPERS.length}`
                      : `Ảnh trong bộ · ${choice.ids.length}/${WALLPAPERS.length}`}
                  </p>
                  <div className="grid max-h-48 grid-cols-4 gap-1.5 overflow-y-auto pr-0.5">
                    {WALLPAPERS.map((w) => {
                      const on = choice.ids.includes(w.id);
                      return (
                        <button
                          key={w.id}
                          type="button"
                          onClick={() => toggleSlide(w.id)}
                          title={w.id}
                          className="relative overflow-hidden rounded-[7px] border transition-transform hover:scale-[1.04]"
                          style={{
                            borderColor: on ? '#c79a63' : 'var(--border)',
                            boxShadow: on ? '0 0 0 1px #c79a63' : undefined,
                            opacity: on ? 1 : 0.45,
                          }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={w.src} alt="" loading="lazy" className="aspect-[4/3] w-full object-cover" draggable={false} />
                          {on && (
                            <span className="absolute right-1 top-1 grid h-4 w-4 place-items-center rounded-full bg-[#c79a63]">
                              <Check size={10} strokeWidth={3.5} style={{ color: '#17130e' }} />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-2 flex items-center gap-1.5 border-t border-[var(--border)] pt-2">
                    <button
                      type="button"
                      onClick={() => onPick({ ...choice, ids: WALLPAPERS.map((w) => w.id) })}
                      className="flex h-7 flex-1 items-center justify-center rounded-[9px] border border-[var(--border)] text-[10.5px] text-[var(--t3)] transition-colors hover:bg-[var(--hover)]"
                    >
                      {en ? 'Select all' : 'Chọn hết'}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <motion.button
        {...pressableIcon}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Đổi nền"
        title={en ? 'Change backdrop' : 'Đổi nền đăng nhập'}
        className="grid h-9 w-9 place-items-center rounded-full border transition-colors"
        style={{
          borderColor: 'var(--border)',
          color: 'var(--t3)',
          background: 'rgba(127,127,127,0.08)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
        }}
      >
        <ImageIcon size={14} />
      </motion.button>
    </div>
  );
}
