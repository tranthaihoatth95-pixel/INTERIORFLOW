'use client';
/**
 * components/present/PresentViewer.tsx — Trình chiếu full-bleed cho chặng Present.
 *
 * Dùng cho CẢ HAI: route /present (standalone) và Present mode trong app (overlay).
 * Nhận sẵn mảng slide (JPEG dataURL 1920×1080) + tuỳ chọn moodboard/pdf.
 * Điều khiển: phím ←/→/Space/Home/End/Esc + nút trên màn. 0 mạng, 0 AI.
 *
 * Theme qua CSS var (--bg/--panel/--card/--t1..t5/--border...). Font SANS hệ thống.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useT } from '@/lib/i18n';

export interface PresentViewerProps {
  /** JPEG dataURL 1920×1080 mỗi slide (đã render sẵn). */
  slides: string[];
  title: string;
  /** đang render slide? hiện trạng thái nạp. */
  loading?: boolean;
  /** dòng trạng thái nhỏ (vd "Slide 3/6"). */
  status?: string;
  /** dataURL moodboard (nếu có) — hiện ở cuối như 1 "slide" phụ. */
  moodboard?: string | null;
  /** bấm Download PDF — cha tự lo tạo + tải (đã có sẵn buildDeckPdf). */
  onDownloadPdf?: () => void;
  /** bấm Download moodboard PNG. */
  onDownloadMoodboard?: () => void;
  /** nếu là overlay trong app → hiện nút Đóng, gọi callback. */
  onClose?: () => void;
}

export default function PresentViewer({
  slides,
  title,
  loading,
  status,
  moodboard,
  onDownloadPdf,
  onDownloadMoodboard,
  onClose,
}: PresentViewerProps) {
  const tr = useT();
  // gộp slide chính + moodboard (nếu có) thành 1 mạch trình chiếu
  const frames = moodboard ? [...slides, moodboard] : slides;
  const total = frames.length;
  const [idx, setIdx] = useState(0);
  const [chromeHidden, setChromeHidden] = useState(false);
  const hideTimer = useRef<number | null>(null);

  const clamp = useCallback((n: number) => Math.max(0, Math.min(total - 1, n)), [total]);
  const go = useCallback((n: number) => setIdx((cur) => clamp(typeof n === 'number' ? n : cur)), [clamp]);
  const next = useCallback(() => setIdx((i) => Math.min(total - 1, i + 1)), [total]);
  const prev = useCallback(() => setIdx((i) => Math.max(0, i - 1)), []);

  // giữ index hợp lệ khi số frame đổi (slide render dần)
  useEffect(() => {
    setIdx((i) => Math.max(0, Math.min(total - 1, i)));
  }, [total]);

  // phím tắt
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        e.preventDefault();
        next();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        prev();
      } else if (e.key === 'Home') {
        e.preventDefault();
        go(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        go(total - 1);
      } else if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev, go, total, onClose]);

  // auto-ẩn thanh điều khiển khi để yên chuột
  const wake = useCallback(() => {
    setChromeHidden(false);
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => setChromeHidden(true), 2800);
  }, []);
  useEffect(() => {
    wake();
    return () => {
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
    };
  }, [wake]);

  const isMoodFrame = moodboard != null && idx === total - 1;

  return (
    <div
      onMouseMove={wake}
      style={{
        position: 'absolute',
        inset: 0,
        background: 'var(--bg)',
        color: 'var(--t1)',
        display: 'flex',
        flexDirection: 'column',
        fontFamily:
          "-apple-system, 'SF Pro Display', 'SF Pro Text', system-ui, 'Segoe UI', Roboto, sans-serif",
        overflow: 'hidden',
      }}
    >
      {/* Thanh trên: tiêu đề + hành động */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '14px 20px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--panel)',
          transition: 'opacity .3s, transform .3s',
          opacity: chromeHidden ? 0 : 1,
          transform: chromeHidden ? 'translateY(-4px)' : 'none',
          pointerEvents: chromeHidden ? 'none' : 'auto',
          zIndex: 3,
        }}
      >
        <span style={{ fontWeight: 600, fontSize: 14, letterSpacing: 0.2 }}>{title}</span>
        <span style={{ fontSize: 12, color: 'var(--t3)' }}>{status ?? (total ? `${idx + 1} / ${total}` : '')}</span>
        <div style={{ flex: 1 }} />
        {onDownloadPdf && (
          <button onClick={onDownloadPdf} disabled={loading || slides.length === 0} style={btnStyle(loading || slides.length === 0)}>
            {tr('Tải PDF', 'Download PDF')}
          </button>
        )}
        {onDownloadMoodboard && moodboard && (
          <button onClick={onDownloadMoodboard} style={btnGhost()}>
            {tr('Tải moodboard PNG', 'Moodboard PNG')}
          </button>
        )}
        {onClose && (
          <button onClick={onClose} style={btnGhost()} aria-label={tr('Đóng Present', 'Close Present')}>
            {tr('Đóng', 'Close')}
          </button>
        )}
      </header>

      {/* Sân khấu slide */}
      <div
        style={{
          flex: 1,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2.5vh 3vw',
          minHeight: 0,
        }}
      >
        {loading && slides.length === 0 ? (
          <div style={{ color: 'var(--t3)', fontSize: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <Spinner />
            <span>{status ?? tr('Đang dựng slide…', 'Building slides…')}</span>
          </div>
        ) : total === 0 ? (
          <div style={{ color: 'var(--t3)', fontSize: 14 }}>{tr('Chưa có nội dung để trình chiếu.', 'Nothing to present yet.')}</div>
        ) : (
          <figure
            style={{
              margin: 0,
              maxWidth: '100%',
              maxHeight: '100%',
              aspectRatio: isMoodFrame ? '2480 / 1754' : '16 / 9',
              width: 'auto',
              height: '100%',
              boxShadow: 'var(--shadow-sheet)',
              borderRadius: 10,
              overflow: 'hidden',
              border: '1px solid var(--border)',
              background: 'var(--card)',
              display: 'flex',
            }}
          >
            <img
              src={frames[idx]}
              alt={`slide ${idx + 1}`}
              style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
            />
          </figure>
        )}

        {/* vùng bấm trái/phải trong suốt để lật nhanh */}
        {total > 1 && (
          <>
            <button aria-label={tr('Slide trước', 'Previous slide')} onClick={prev} style={edgeZone('left')} />
            <button aria-label={tr('Slide sau', 'Next slide')} onClick={next} style={edgeZone('right')} />
          </>
        )}
      </div>

      {/* Thanh dưới: điều khiển + dot */}
      <footer
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          padding: '12px 20px',
          borderTop: '1px solid var(--border)',
          background: 'var(--panel)',
          transition: 'opacity .3s, transform .3s',
          opacity: chromeHidden ? 0 : 1,
          transform: chromeHidden ? 'translateY(4px)' : 'none',
          pointerEvents: chromeHidden ? 'none' : 'auto',
          zIndex: 3,
        }}
      >
        <button onClick={prev} disabled={idx === 0} style={navBtn(idx === 0)} aria-label={tr('Trước', 'Previous')}>
          ‹ {tr('Trước', 'Prev')}
        </button>
        <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
          {frames.map((_, i) => (
            <button
              key={i}
              onClick={() => go(i)}
              aria-label={tr(`Tới slide ${i + 1}`, `Go to slide ${i + 1}`)}
              style={{
                width: i === idx ? 22 : 8,
                height: 8,
                borderRadius: 999,
                border: 'none',
                cursor: 'pointer',
                background: i === idx ? 'var(--t1)' : 'var(--border-strong)',
                transition: 'width .25s, background .25s',
                padding: 0,
              }}
            />
          ))}
        </div>
        <button onClick={next} disabled={idx === total - 1} style={navBtn(idx === total - 1)} aria-label={tr('Sau', 'Next')}>
          {tr('Sau', 'Next')} ›
        </button>
      </footer>
    </div>
  );
}

/* ---------- style helpers (CSS var only, no hardcoded hex) ---------- */
function btnStyle(disabled: boolean): React.CSSProperties {
  return {
    background: 'var(--t1)',
    color: 'var(--bg)',
    border: 'none',
    borderRadius: 8,
    padding: '7px 14px',
    fontWeight: 600,
    fontSize: 13,
    cursor: disabled ? 'default' : 'pointer',
    opacity: disabled ? 0.5 : 1,
  };
}
function btnGhost(): React.CSSProperties {
  return {
    background: 'var(--field)',
    color: 'var(--t1)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    padding: '7px 14px',
    fontWeight: 500,
    fontSize: 13,
    cursor: 'pointer',
  };
}
function navBtn(disabled: boolean): React.CSSProperties {
  return {
    background: 'transparent',
    color: disabled ? 'var(--t4)' : 'var(--t1)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    padding: '6px 16px',
    fontWeight: 500,
    fontSize: 13,
    cursor: disabled ? 'default' : 'pointer',
  };
}
function edgeZone(side: 'left' | 'right'): React.CSSProperties {
  return {
    position: 'absolute',
    top: 0,
    bottom: 0,
    [side]: 0,
    width: '18%',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    zIndex: 2,
  };
}

function Spinner() {
  return (
    <span
      style={{
        width: 22,
        height: 22,
        borderRadius: '50%',
        border: '2px solid var(--border-strong)',
        borderTopColor: 'var(--t1)',
        display: 'inline-block',
        animation: 'pv-spin 0.8s linear infinite',
      }}
    >
      <style>{`@keyframes pv-spin{to{transform:rotate(360deg)}}`}</style>
    </span>
  );
}
