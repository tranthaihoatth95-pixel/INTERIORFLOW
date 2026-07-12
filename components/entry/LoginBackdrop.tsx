'use client';

/**
 * components/entry/LoginBackdrop.tsx — NỀN ĐỘNG màn đăng nhập (Sprint 2 · C-2).
 *
 * - Mặc định "Đêm ấm": giữ nguyên ngôn ngữ quầng đồng + vignette của LoginScreen cũ,
 *   nhưng nay là 1 preset trong bộ nền user tự đổi được.
 * - Preset = CSS gradient trôi rất chậm (GPU-cheap, boot tức thì — KHÔNG video).
 * - Ảnh riêng: user upload → resize canvas ≤1600px → dataURL lưu localStorage,
 *   hiển thị với Ken Burns nhẹ + scrim tối để chữ luôn đọc được.
 * - Nút đổi nền: ghost nhỏ góc phải-dưới, popover kính chọn preset / upload / gỡ ảnh.
 * - prefers-reduced-motion: globals.css đã tắt mọi animation → gradient/Ken Burns đứng yên.
 *
 * Tone chữ: mỗi nền khai báo tone 'auto' | 'dark' | 'light' — LoginScreen gắn
 * data-login-tone lên wrapper để CSS ép bộ biến chữ/viền tương ứng (globals.css).
 */

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image as ImageIcon, Check, Trash2, Upload } from 'lucide-react';
import { easeApple, pressableIcon } from '@/lib/motion';
import type { Lang } from '@/lib/i18n';

const LS_KEY = 'interiorflow.login-bg';

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

type BgChoice = { kind: 'preset'; id: string } | { kind: 'image'; data: string };

function loadChoice(): BgChoice {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as BgChoice;
      if (parsed.kind === 'image' && typeof parsed.data === 'string') return parsed;
      if (parsed.kind === 'preset' && BG_PRESETS.some((p) => p.id === parsed.id)) return parsed;
    }
  } catch {
    /* hỏng thì về mặc định */
  }
  return { kind: 'preset', id: 'ember' };
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
    choice.kind === 'image'
      ? 'dark' // ảnh tự do → scrim tối + chữ sáng (an toàn đọc)
      : (BG_PRESETS.find((p) => p.id === choice.id)?.tone ?? 'auto');
  return { choice, pick, tone };
}

/* ---------- Lớp NỀN (đặt dưới cùng, pointer-events none) ---------- */

export function LoginBackdropLayer({ choice, reduce }: { choice: BgChoice; reduce: boolean }) {
  const preset = choice.kind === 'preset' ? BG_PRESETS.find((p) => p.id === choice.id) : null;
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <AnimatePresence mode="sync" initial={false}>
        {choice.kind === 'image' ? (
          <motion.div
            key={`img:${choice.data.slice(0, 32)}`}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: easeApple }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={choice.data}
              alt=""
              className={`h-full w-full object-cover ${reduce ? '' : 'if-login-kenburns'}`}
              draggable={false}
            />
            {/* scrim: giữa tối nhẹ để chữ + card kính nổi trên ảnh bất kỳ */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  'radial-gradient(120% 92% at 50% 45%, rgba(0,0,0,0.34) 0%, rgba(0,0,0,0.62) 100%)',
              }}
            />
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
      {/* vignette điện ảnh chung cho mọi nền trừ ảnh (ảnh có scrim riêng) */}
      {choice.kind !== 'image' && (
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
              className="lq-card absolute bottom-11 right-0 z-40 w-60 rounded-[16px] p-3"
            >
              <p
                className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--t4)]"
              >
                {en ? 'Backdrop' : 'Nền đăng nhập'}
              </p>
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
