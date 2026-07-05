'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import { useFlowStore } from '@/lib/store';

export function Lightbox() {
  const url = useFlowStore((s) => s.lightboxUrl);
  const setUrl = useFlowStore((s) => s.setLightboxUrl);

  useEffect(() => {
    if (!url) return;
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && setUrl(null);
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [url, setUrl]);

  if (!url) return null;

  // Nhận diện video: đuôi .mp4/.webm/.mov hoặc data:video — còn lại coi là ảnh.
  const isVideo = /\.(mp4|webm|mov|m4v)(\?|$)/i.test(url) || url.startsWith('data:video');

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/85 p-8 backdrop-blur-sm" onClick={() => setUrl(null)}>
      <button className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-[var(--hover)] text-[var(--t2)] hover:bg-[var(--border-strong)]">
        <X size={17} />
      </button>
      {isVideo ? (
        <video
          src={url}
          controls
          autoPlay
          loop
          playsInline
          className="max-h-full max-w-full rounded-lg object-contain shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="preview" className="max-h-full max-w-full rounded-lg object-contain shadow-2xl" onClick={(e) => e.stopPropagation()} />
      )}
    </div>
  );
}
