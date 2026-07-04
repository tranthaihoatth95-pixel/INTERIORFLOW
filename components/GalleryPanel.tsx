'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { X, Trash2, Download } from 'lucide-react';
import { listGallery, removeFromGallery, type GalleryItem } from '@/lib/gallery';
import { useFlowStore } from '@/lib/store';
import { sheetSlide, pressableIcon } from '@/lib/motion';

export function GalleryPanel() {
  const panel = useFlowStore((s) => s.panel);
  const setPanel = useFlowStore((s) => s.setPanel);
  const setLightboxUrl = useFlowStore((s) => s.setLightboxUrl);
  const [items, setItems] = useState<GalleryItem[]>([]);

  useEffect(() => {
    const refresh = () => setItems(listGallery());
    refresh();
    window.addEventListener('interiorflow:gallery', refresh);
    return () => window.removeEventListener('interiorflow:gallery', refresh);
  }, []);

  if (panel !== 'gallery') return null;

  return (
    <motion.aside
      variants={sheetSlide('left')}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="mat-panel z-20 flex w-64 flex-col border-r border-[var(--border)]"
    >
      <div className="flex items-center gap-2 border-b border-[var(--border)] px-3 py-2.5">
        <span className="flex-1 text-xs font-semibold uppercase tracking-wider text-[var(--t3)]">
          Gallery <span className="text-[var(--t5)]">(local)</span>
        </span>
        <motion.button
          {...pressableIcon}
          onClick={() => setPanel(null)}
          className="grid h-6 w-6 place-items-center rounded-md text-[var(--t4)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--t2)]"
        >
          <X size={13} />
        </motion.button>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-2.5">
        {items.length === 0 && (
          <p className="px-1 pt-4 text-center text-xs leading-relaxed text-[var(--t5)]">
            Trống — dùng node <span className="text-[var(--t3)]">Save to Gallery</span> để lưu output vào đây.
          </p>
        )}
        {items.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
            className="group overflow-hidden rounded-[10px] border border-[var(--border)] bg-[var(--field)]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.url}
              alt={item.name}
              loading="lazy"
              className="h-28 w-full cursor-zoom-in object-cover"
              onClick={() => setLightboxUrl(item.url)}
            />
            <div className="flex items-center gap-1 px-2 py-1.5">
              <p className="min-w-0 flex-1 truncate text-[11px] text-[var(--t2)]" title={item.name}>
                {item.name}
              </p>
              <a
                href={item.url}
                download={item.name}
                target="_blank"
                rel="noreferrer"
                className="grid h-6 w-6 place-items-center rounded text-[var(--t4)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--t2)]"
                title="Tải về"
              >
                <Download size={12} />
              </a>
              <button
                onClick={() => removeFromGallery(item.id)}
                className="grid h-6 w-6 place-items-center rounded text-[var(--t4)] transition-colors hover:bg-[var(--hover)] hover:text-red-400"
                title="Xoá"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.aside>
  );
}
