'use client';
/**
 * components/present/PresentDeck.tsx — Bọc PresentViewer + tự render deck mẫu.
 *
 * Dựng slide bằng renderDeck (pipeline app) trong useEffect (tránh chạm window ở
 * render body → an toàn hydration). Cấp sẵn nút Download PDF / Moodboard PNG.
 * Dùng cho route /present và cho Present mode overlay trong app.
 */
import { useEffect, useState } from 'react';
import PresentViewer from './PresentViewer';
import {
  type PresentDeck as PresentDeckData,
  renderDeck,
  renderMoodboard,
  buildDeckPdf,
  downloadPdf,
  downloadImage,
} from '@/lib/present-demo';

export interface PresentDeckProps {
  /** deck để trình chiếu; mặc định deck Detech mẫu. */
  deck?: PresentDeckData;
  /** có dựng + hiện moodboard cuối bộ không (mặc định có). */
  withMoodboard?: boolean;
  /** overlay trong app → truyền onClose để hiện nút Đóng + bắt Esc. */
  onClose?: () => void;
}

export default function PresentDeck({ deck, withMoodboard = true, onClose }: PresentDeckProps) {
  const [slides, setSlides] = useState<string[]>([]);
  const [moodboard, setMoodboard] = useState<string | null>(null);
  const [status, setStatus] = useState('Đang dựng slide…');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!deck) return;
    let cancelled = false;
    (async () => {
      try {
        const out = await renderDeck(deck);
        if (cancelled) return;
        setSlides(out);
        setStatus(`Đã dựng ${out.length} slide`);
        if (withMoodboard) {
          try {
            const board = await renderMoodboard(deck);
            if (!cancelled) setMoodboard(board);
          } catch {
            /* moodboard là phụ — bỏ qua nếu lỗi ảnh/CORS, không làm hỏng deck */
          }
        }
        if (!cancelled) setDone(true);
      } catch (e) {
        if (!cancelled) setStatus('Không dựng được slide — thử tải lại trang.');
        // eslint-disable-next-line no-console
        console.error('[PresentDeck] render lỗi', e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [deck, withMoodboard]);

  const handlePdf = async () => {
    if (!deck || slides.length === 0) return;
    try {
      const uri = await buildDeckPdf(slides, `${deck.id}-present-deck.pdf`);
      downloadPdf(uri, `${deck.id}-present-deck.pdf`);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('[PresentDeck] PDF lỗi', e);
    }
  };

  const handleMoodboard = () => {
    if (deck && moodboard) downloadImage(moodboard, `${deck.id}-moodboard.png`);
  };

  // In-app Present mode chưa có deck thật → RỖNG, không hiện nội dung demo (tránh lẫn nội dung app thật).
  if (!deck) {
    return (
      <div style={{ position: 'fixed', inset: 0, display: 'grid', placeItems: 'center', background: 'var(--bg)', color: 'var(--t3)' }}>
        <div style={{ textAlign: 'center', padding: 24 }}>
          <p style={{ fontSize: 14 }}>Chưa có nội dung để trình chiếu</p>
          <p style={{ marginTop: 6, fontSize: 12, color: 'var(--t5)' }}>Dàn slide ở chặng Present, rồi mở Present mode lại.</p>
          {onClose && (
            <button
              onClick={onClose}
              style={{ marginTop: 18, padding: '8px 16px', fontSize: 12, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--field)', color: 'var(--t2)' }}
            >
              Đóng
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <PresentViewer
      slides={slides}
      title={deck.project}
      loading={!done}
      status={done ? undefined : status}
      moodboard={moodboard}
      onDownloadPdf={handlePdf}
      onDownloadMoodboard={handleMoodboard}
      onClose={onClose}
    />
  );
}
