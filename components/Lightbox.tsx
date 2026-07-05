'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useFlowStore } from '@/lib/store';
import { fade, modalScale, pressableIcon } from '@/lib/motion';

export function Lightbox() {
  const url = useFlowStore((s) => s.lightboxUrl);
  const setUrl = useFlowStore((s) => s.setLightboxUrl);

  useEffect(() => {
    if (!url) return;
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && setUrl(null);
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [url, setUrl]);

  // Nhận diện video: đuôi .mp4/.webm/.mov hoặc data:video — còn lại coi là ảnh.
  const isVideo = !!url && (/\.(mp4|webm|mov|m4v)(\?|$)/i.test(url) || url.startsWith('data:video'));

  return (
    <AnimatePresence>
      {url && (
        <motion.div
          variants={fade}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="mat-overlay fixed inset-0 z-[60] grid place-items-center p-8"
          onClick={() => setUrl(null)}
        >
          <motion.button
            {...pressableIcon}
            whileHover={{ scale: 1.06 }}
            className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full border border-[var(--mat-hairline)] bg-[var(--card)]/80 text-[var(--t2)] backdrop-blur transition-colors hover:bg-[var(--hover)] hover:text-[var(--t1)]"
          >
            <X size={17} />
          </motion.button>
          <motion.div
            variants={modalScale}
            className="grid max-h-full max-w-full place-items-center"
            onClick={(e) => e.stopPropagation()}
          >
            {isVideo ? (
              <video
                src={url}
                controls
                autoPlay
                loop
                playsInline
                className="max-h-full max-w-full rounded-[14px] object-contain shadow-2xl"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={url} alt="preview" className="max-h-full max-w-full rounded-[14px] object-contain shadow-2xl" />
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
