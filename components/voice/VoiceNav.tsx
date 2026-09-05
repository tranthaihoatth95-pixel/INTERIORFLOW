'use client';

/**
 * components/voice/VoiceNav.tsx — ĐIỀU HƯỚNG TRANG BẰNG GIỌNG NÓI khi trình chiếu (02/09).
 * Hành động giọng nói DUY NHẤT của slice này, chọn vì đủ 3 điều kiện: tất định (bảng lệnh cố
 * định `lib/voice/commands.ts`, không AI) · thuận nghịch (lật trang, không ghi gì) · trợ năng
 * (nút thật có aria-pressed, bàn phím dùng được, vùng aria-live đọc lại máy nghe gì/hiểu gì).
 * KHÔNG BAO GIỜ đụng deck/Doc — voice không ghi sự thật dự án.
 *
 * Hai ngữ pháp thao tác theo thiết bị (cùng một lệnh, cùng một kết quả):
 *  · DESKTOP (có hover): bấm = bật/tắt nghe LIÊN TỤC (rảnh tay khi trình bày).
 *  · CẢM ỨNG (`hover:none`+`pointer:coarse`): NHẤN GIỮ để nói, thả ra là dừng — tablet cầm tay,
 *    tiếng ồn xung quanh, không để mic mở mãi.
 * Không có Web Speech API (Firefox, WebView cũ) → nút MỜ kèm lý do (cấm nút giả, §9), không ẩn.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { useLang, useT } from '@/lib/i18n';
import { applyVoiceNav, describeVoiceNav, parseVoiceNav, voiceNavHints, type VoiceNavCommand } from '@/lib/voice/commands';

/* Kiểu tối thiểu của Web Speech API — lib.dom không khai (API prefix, chưa chuẩn). */
interface SpeechResultLike { 0: { transcript: string }; isFinal: boolean }
interface SpeechEventLike { resultIndex: number; results: ArrayLike<SpeechResultLike> }
interface RecognitionLike {
  lang: string; continuous: boolean; interimResults: boolean; maxAlternatives: number;
  onresult: ((e: SpeechEventLike) => void) | null; onend: (() => void) | null; onerror: ((e: { error?: string }) => void) | null;
  start(): void; stop(): void; abort(): void;
}
type RecognitionCtor = new () => RecognitionLike;

function getRecognitionCtor(): RecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export interface VoiceNavProps {
  idx: number;
  total: number;
  /** nhận chỉ số trang MỚI (đã kẹp) — chỉ điều hướng, không ghi gì khác. */
  onGo: (next: number) => void;
  /** 'dark' = overlay trình chiếu nền đen · 'theme' = theo CSS var app. */
  tone?: 'dark' | 'theme';
}

export default function VoiceNav({ idx, total, onGo, tone = 'dark' }: VoiceNavProps) {
  const tr = useT();
  const lang = useLang();
  const Ctor = useMemo(getRecognitionCtor, []);
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState<string>('');
  const [last, setLast] = useState<VoiceNavCommand | null>(null);
  const [coarse, setCoarse] = useState(false);
  const recRef = useRef<RecognitionLike | null>(null);
  const idxRef = useRef(idx);
  const totalRef = useRef(total);
  idxRef.current = idx;
  totalRef.current = total;

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(hover: none) and (pointer: coarse)');
    const apply = () => setCoarse(mq.matches);
    apply();
    mq.addEventListener?.('change', apply);
    return () => mq.removeEventListener?.('change', apply);
  }, []);

  const stop = useCallback(() => {
    const r = recRef.current;
    recRef.current = null;
    if (r) { r.onend = null; try { r.stop(); } catch { /* đã dừng */ } }
    setListening(false);
  }, []);

  const start = useCallback(() => {
    if (!Ctor || recRef.current) return;
    const r = new Ctor();
    r.lang = lang === 'vi' ? 'vi-VN' : 'en-US';
    r.continuous = !coarse; // desktop nghe liên tục · cảm ứng: nhấn-giữ, 1 câu
    r.interimResults = true;
    r.maxAlternatives = 1;
    r.onresult = (e) => {
      let finalText = '';
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        if (res.isFinal) finalText += res[0].transcript; else interim += res[0].transcript;
      }
      if (interim) setHeard(interim);
      if (!finalText) return;
      setHeard(finalText);
      const cmd = parseVoiceNav(finalText);
      setLast(cmd);
      if (cmd.kind === 'stop') { stop(); return; }
      if (cmd.kind === 'none') return;
      const next = applyVoiceNav(cmd, idxRef.current, totalRef.current);
      if (next !== idxRef.current) onGo(next);
    };
    r.onerror = (e) => {
      // 'no-speech'/'aborted' là chuyện thường; lỗi quyền mic thì nói rõ.
      if (e?.error === 'not-allowed' || e?.error === 'service-not-allowed') {
        setHeard(tr('Trình duyệt chưa cho dùng micro — cấp quyền rồi bật lại.', 'Microphone access was denied — allow it and try again.'));
        stop();
      }
    };
    r.onend = () => {
      // Chrome tự ngắt sau vài giây im lặng khi continuous — bật lại nếu người dùng vẫn đang bật.
      if (recRef.current === r && !coarse) { try { r.start(); } catch { setListening(false); recRef.current = null; } }
      else if (recRef.current === r) { recRef.current = null; setListening(false); }
    };
    recRef.current = r;
    try { r.start(); setListening(true); setHeard(''); setLast(null); } catch { recRef.current = null; setListening(false); }
  }, [Ctor, lang, coarse, onGo, stop, tr]);

  useEffect(() => () => { const r = recRef.current; recRef.current = null; if (r) { r.onend = null; try { r.abort(); } catch { /* */ } } }, []);

  const supported = !!Ctor;
  const reason = tr('Trình duyệt này chưa có nhận dạng giọng nói (Web Speech API) — dùng phím ← → hoặc nút.', 'This browser has no speech recognition (Web Speech API) — use ← → keys or the buttons.');
  const hint = coarse
    ? tr('Nhấn giữ để nói', 'Hold to talk')
    : listening ? tr('Đang nghe — bấm để dừng', 'Listening — click to stop') : tr('Bật nghe lệnh', 'Start voice commands');
  const hints = voiceNavHints(lang).join(' · ');
  const dark = tone === 'dark';
  const btnStyle: React.CSSProperties = {
    minWidth: 'var(--tap, 44px)', minHeight: 'var(--tap, 44px)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    padding: '0 12px', borderRadius: 999,
    border: `1px solid ${listening ? (dark ? 'rgba(255,255,255,.55)' : 'var(--accent)') : (dark ? 'rgba(255,255,255,.14)' : 'var(--border)')}`,
    background: listening ? (dark ? 'rgba(255,255,255,.18)' : 'var(--accent)') : (dark ? 'rgba(255,255,255,.06)' : 'var(--panel)'),
    color: listening && !dark ? '#fff' : (dark ? '#fff' : 'var(--t1)'),
    cursor: supported ? 'pointer' : 'not-allowed', opacity: supported ? 1 : 'var(--mo-vo-hieu, 0.5)', fontSize: 12, userSelect: 'none', touchAction: 'none',
  };
  const descId = 'voice-nav-desc';

  const pressHandlers = coarse
    ? {
        onPointerDown: (e: React.PointerEvent) => { if (!supported) return; e.preventDefault(); start(); },
        onPointerUp: () => stop(),
        onPointerCancel: () => stop(),
        onPointerLeave: () => { if (listening) stop(); },
        onKeyDown: (e: React.KeyboardEvent) => { if ((e.key === ' ' || e.key === 'Enter') && supported) { e.preventDefault(); if (listening) stop(); else start(); } },
      }
    : { onClick: () => { if (!supported) return; if (listening) stop(); else start(); } };

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, maxWidth: '100%' }}>
      <button
        type="button"
        aria-pressed={listening}
        aria-disabled={!supported || undefined}
        aria-describedby={descId}
        title={supported ? `${hint} · ${hints}` : reason}
        style={btnStyle}
        {...pressHandlers}
      >
        {listening ? <Mic size={16} aria-hidden /> : <MicOff size={16} aria-hidden />}
        <span>{listening ? tr('Đang nghe', 'Listening') : tr('Giọng nói', 'Voice')}</span>
      </button>
      <span id={descId} hidden>{supported ? `${hint}. ${tr('Lệnh', 'Commands')}: ${hints}` : reason}</span>
      {/* Vùng đọc lại: máy nghe gì + hiểu thành lệnh gì — người không nhìn màn vẫn biết. */}
      <span
        role="status"
        aria-live="polite"
        style={{ fontSize: 12, color: dark ? '#e7e2d8' : 'var(--t3)', maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
      >
        {listening && !heard ? tr('Nói: ', 'Say: ') + hints : ''}
        {heard ? `“${heard}”` : ''}
        {last ? ` → ${describeVoiceNav(last, lang)}` : ''}
      </span>
    </div>
  );
}
