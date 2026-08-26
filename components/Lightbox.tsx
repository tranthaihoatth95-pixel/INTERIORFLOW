'use client';

import { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useFlowStore } from '@/lib/store';
import { fade, modalScale, pressableIcon } from '@/lib/motion';
import { useDismissable } from '@/lib/useDismissable';

export function Lightbox() {
  const url = useFlowStore((s) => s.lightboxUrl);
  const setUrl = useFlowStore((s) => s.setLightboxUrl);

  // 2.2.90 ĐỢT 3 — chuyển sang useDismissable dùng chung (bấm ra ngoài khung ảnh/video = ra
  // ngoài contentRef, giữ đúng hành vi cũ: bấm khung ảnh không đóng, bấm nền tối mới đóng).
  const contentRef = useRef<HTMLDivElement>(null);
  useDismissable({ open: !!url, onDismiss: () => setUrl(null), refs: [contentRef] });

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
          className="nen-mo-overlay fixed inset-0 z-[60] grid place-items-center p-8"
        >
          <motion.button
            {...pressableIcon}
            whileHover={{ scale: 1.06 }}
            onClick={() => setUrl(null)}
            /* P5 (04/08): kính lỏng `.glass-float--bar` — 1 trong ĐÚNG 4 chỗ được phép (thanh nổi
               trên ảnh render), luật ở globals.css. Bỏ bg/border/backdrop-blur cũ — class tự mang. */
            className="glass-float glass-float--bar absolute right-4 top-4 grid h-9 w-9 place-items-center text-[var(--t2)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--t1)]"
          >
            <X size={18} />
          </motion.button>
          <motion.div
            ref={contentRef}
            variants={modalScale}
            className="grid max-h-full max-w-full place-items-center"
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
