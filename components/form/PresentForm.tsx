'use client';

/**
 * components/form/PresentForm.tsx — Form Present.
 *
 * Chọn ảnh (gallery đã lưu + Reference) → mỗi ảnh thành 1 slide → Xuất PDF / PPTX,
 * hoặc "Trình chiếu" mở PresentDeck (trình xem sẵn có) trong portal. Dùng lại
 * lib/present-demo (buildDeckPdf/downloadPdf) + lib/pptx (exportDeckToPptx).
 */

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { FileDown, Presentation, LayoutTemplate } from 'lucide-react';
import { listGallery, type GalleryItem } from '@/lib/gallery';
import { buildDeckPdf, downloadPdf } from '@/lib/present-demo';
import { exportDeckToPptx, type PptxSlide } from '@/lib/pptx';
import PresentDeck from '@/components/present/PresentDeck';
import { BigButton, ErrorNote, StepCard, useLibrary, type LibAsset } from './shared';

interface SlideItem {
  id: string;
  url: string;
  name: string;
}

export function PresentForm() {
  const { assets, loading } = useLibrary(['ref-render', 'slide']);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [picked, setPicked] = useState<string[]>([]); // giữ thứ tự chọn = thứ tự slide
  const [busy, setBusy] = useState<null | 'pdf' | 'pptx'>(null);
  const [error, setError] = useState<string | null>(null);
  const [showing, setShowing] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setGallery(listGallery());
    const refresh = () => setGallery(listGallery());
    window.addEventListener('interiorflow:gallery', refresh);
    return () => window.removeEventListener('interiorflow:gallery', refresh);
  }, []);

  // Nguồn ảnh gộp: gallery đã lưu (render/moodboard) + Reference.
  const pool: SlideItem[] = useMemo(() => {
    const g: SlideItem[] = gallery.map((i) => ({ id: `g:${i.id}`, url: i.url, name: i.name }));
    const l: SlideItem[] = assets.map((a: LibAsset) => ({ id: `l:${a.id}`, url: a.url, name: a.name }));
    return [...g, ...l];
  }, [gallery, assets]);

  const slides = useMemo(
    () => picked.map((id) => pool.find((p) => p.id === id)).filter((x): x is SlideItem => Boolean(x)),
    [picked, pool],
  );

  function toggle(id: string) {
    setPicked((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  }

  // Ảnh có thể là dataURL (upload/render) hoặc /api/library URL. jsPDF/pptx cần dataURL →
  // fetch URL thường về blob → dataURL. dataURL sẵn thì trả nguyên.
  async function toDataUrl(url: string): Promise<string> {
    if (url.startsWith('data:')) return url;
    const res = await fetch(url);
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(String(fr.result));
      fr.onerror = () => reject(new Error('Không đọc được ảnh slide.'));
      fr.readAsDataURL(blob);
    });
  }

  async function onPdf() {
    if (!slides.length) return;
    setBusy('pdf');
    setError(null);
    try {
      const data = await Promise.all(slides.map((s) => toDataUrl(s.url)));
      const uri = await buildDeckPdf(data, 'present-deck.pdf');
      downloadPdf(uri, 'present-deck.pdf');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Xuất PDF lỗi.');
    } finally {
      setBusy(null);
    }
  }

  async function onPptx() {
    if (!slides.length) return;
    setBusy('pptx');
    setError(null);
    try {
      const data = await Promise.all(slides.map((s) => toDataUrl(s.url)));
      const deck: PptxSlide[] = data.map((imageDataUrl) => ({ kind: 'image', imageDataUrl }));
      await exportDeckToPptx(deck, { fileName: 'present-deck', title: 'InteriorFlow deck' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Xuất PPTX lỗi.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-3">
      <StepCard n={1} title="Chọn ảnh làm slide">
        {loading && pool.length === 0 && (
          <p className="py-4 text-center text-[13px] text-[var(--t4)]">Đang tải ảnh…</p>
        )}
        {!loading && pool.length === 0 && (
          <p className="py-4 text-center text-[13px] text-[var(--t4)]">
            Chưa có ảnh — render ở tab Render rồi bấm “Lưu”, hoặc thêm Reference.
          </p>
        )}
        <div className="grid grid-cols-3 gap-2 lg:grid-cols-5">
          {pool.map((p) => {
            const order = picked.indexOf(p.id);
            const on = order >= 0;
            return (
              <button
                key={p.id}
                onClick={() => toggle(p.id)}
                title={p.name}
                className={`relative aspect-square overflow-hidden rounded-[12px] border-2 transition-colors ${
                  on ? 'border-[var(--accent)]' : 'border-[var(--border)] hover:border-[var(--t4)]'
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt={p.name} className="h-full w-full object-cover" loading="lazy" />
                {on && (
                  <span className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-[var(--accent)] text-[11px] font-bold text-white">
                    {order + 1}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        {slides.length > 0 && (
          <p className="mt-2 text-[12px] text-[var(--t4)]">{slides.length} slide — bấm theo thứ tự muốn trình chiếu.</p>
        )}
      </StepCard>

      {error && <ErrorNote>{error}</ErrorNote>}

      <BigButton onClick={() => { window.location.href = '/present-editor'; }}>
        <LayoutTemplate size={16} /> Mở trình dàn trang (Canva)
      </BigButton>
      <BigButton variant="secondary" onClick={() => setShowing(true)} disabled={!slides.length}>
        <Presentation size={16} /> Trình chiếu nhanh
      </BigButton>
      <div className="flex gap-2">
        <BigButton variant="secondary" onClick={onPdf} busy={busy === 'pdf'} disabled={!slides.length}>
          <FileDown size={16} /> Tải PDF
        </BigButton>
        <BigButton variant="secondary" onClick={onPptx} busy={busy === 'pptx'} disabled={!slides.length}>
          <FileDown size={16} /> Tải PPTX
        </BigButton>
      </div>

      {mounted && showing &&
        createPortal(
          <div style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'var(--bg)' }}>
            <PresentDeck imageSlides={slides.map((s) => s.url)} title="Present" onClose={() => setShowing(false)} />
          </div>,
          document.body,
        )}
    </div>
  );
}
