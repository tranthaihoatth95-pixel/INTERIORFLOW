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
import { useT } from '@/lib/i18n';
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
  /** slide ĐÃ render sẵn (dataURL) — vd từ node Export Deck của flow thật; ưu tiên hơn `deck`. */
  imageSlides?: string[];
  /** tên hiển thị khi dùng imageSlides. */
  title?: string;
  /** có dựng + hiện moodboard cuối bộ không (mặc định có). */
  withMoodboard?: boolean;
  /** overlay trong app → truyền onClose để hiện nút Đóng + bắt Esc. */
  onClose?: () => void;
}

export default function PresentDeck({ deck, imageSlides, title, withMoodboard = true, onClose }: PresentDeckProps) {
  const tr = useT();
  const [slides, setSlides] = useState<string[]>([]);
  const [moodboard, setMoodboard] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const [done, setDone] = useState(false);

  // Deck thật từ flow: slide đã render sẵn — dùng thẳng, không qua renderDeck.
  useEffect(() => {
    if (!imageSlides?.length) return;
    setSlides(imageSlides);
    setStatus(tr(`Đã nạp ${imageSlides.length} slide`, `Loaded ${imageSlides.length} slides`));
    setDone(true);
  }, [imageSlides, tr]);

  useEffect(() => {
    if (!deck || imageSlides?.length) return;
    let cancelled = false;
    (async () => {
      try {
        const out = await renderDeck(deck);
        if (cancelled) return;
        setSlides(out);
        setStatus(tr(`Đã dựng ${out.length} slide`, `Built ${out.length} slides`));
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
        if (!cancelled) setStatus(tr('Không dựng được slide — thử tải lại trang.', 'Could not build slides — try reloading.'));
        // eslint-disable-next-line no-console
        console.error('[PresentDeck] render lỗi', e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [deck, imageSlides, withMoodboard]);

  const pdfName = `${deck?.id ?? title ?? 'present'}-deck.pdf`;
  const handlePdf = async () => {
    if (slides.length === 0) return;
    try {
      const uri = await buildDeckPdf(slides, pdfName);
      downloadPdf(uri, pdfName);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('[PresentDeck] PDF lỗi', e);
    }
  };

  const handleMoodboard = () => {
    if (deck && moodboard) downloadImage(moodboard, `${deck.id}-moodboard.png`);
  };

  // In-app Present mode chưa có deck thật → RỖNG, không hiện nội dung demo (tránh lẫn nội dung app thật).
  if (!deck && !imageSlides?.length) {
    return (
      <div style={{ position: 'fixed', inset: 0, display: 'grid', placeItems: 'center', background: 'var(--bg)', color: 'var(--t3)' }}>
        <div style={{ textAlign: 'center', padding: 24 }}>
          <p style={{ fontSize: 14 }}>{tr('Chưa có nội dung để trình chiếu', 'Nothing to present yet')}</p>
          <p style={{ marginTop: 6, fontSize: 12, color: 'var(--t5)' }}>
            {tr('Dàn slide ở chặng Present, rồi mở Present mode lại.', 'Lay out slides in the Present stage, then reopen Present mode.')}
          </p>
          {onClose && (
            <button
              onClick={onClose}
              style={{ marginTop: 18, padding: '8px 16px', fontSize: 12, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--field)', color: 'var(--t2)' }}
            >
              {tr('Đóng', 'Close')}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <PresentViewer
      slides={slides}
      title={deck?.project ?? title ?? 'Present'}
      loading={!done}
      status={done ? undefined : status || undefined}
      moodboard={moodboard}
      onDownloadPdf={handlePdf}
      onDownloadMoodboard={handleMoodboard}
      onClose={onClose}
    />
  );
}
