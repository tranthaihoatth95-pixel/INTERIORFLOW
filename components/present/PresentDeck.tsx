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
  DEMO_DECK,
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

export default function PresentDeck({ deck = DEMO_DECK, withMoodboard = true, onClose }: PresentDeckProps) {
  const [slides, setSlides] = useState<string[]>([]);
  const [moodboard, setMoodboard] = useState<string | null>(null);
  const [status, setStatus] = useState('Đang dựng slide…');
  const [done, setDone] = useState(false);

  useEffect(() => {
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
    if (slides.length === 0) return;
    try {
      const uri = await buildDeckPdf(slides, `${deck.id}-present-deck.pdf`);
      downloadPdf(uri, `${deck.id}-present-deck.pdf`);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('[PresentDeck] PDF lỗi', e);
    }
  };

  const handleMoodboard = () => {
    if (moodboard) downloadImage(moodboard, `${deck.id}-moodboard.png`);
  };

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
