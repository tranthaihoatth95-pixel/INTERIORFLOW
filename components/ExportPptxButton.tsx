'use client';

import { useState } from 'react';
import { FileText } from 'lucide-react';
import { exportDeckToPptx, type PptxSlide } from '@/lib/pptx';

/**
 * Nút xuất deck sang PowerPoint (.pptx) chỉnh sửa được.
 *
 * Cách 1 (đang dùng ở Export Deck node): truyền `slidesJson` — chuỗi JSON của mảng ảnh slide
 *          16:9 đã render (data URL). Mỗi ảnh → 1 slide PPTX full-bleed.
 * Cách 2 (khi có content model): truyền `slides` (mảng PptxSlide) trực tiếp để chữ chỉnh được.
 *
 * Truyền một trong hai. `slides` được ưu tiên nếu có.
 */
export interface ExportPptxButtonProps {
  /** Mảng slide dựng sẵn (ưu tiên) — cho phép text chỉnh được. */
  slides?: PptxSlide[];
  /** Chuỗi JSON mảng ảnh data URL (fallback — nhúng full-bleed). */
  slidesJson?: string;
  /** Tên file / tiêu đề deck. */
  deckName?: string;
  author?: string;
  className?: string;
}

export default function ExportPptxButton({
  slides,
  slidesJson,
  deckName,
  author,
  className,
}: ExportPptxButtonProps) {
  const [busy, setBusy] = useState(false);
  const label = deckName?.trim() || 'deck';

  async function handleClick() {
    setBusy(true);
    try {
      let deck: PptxSlide[];
      if (slides && slides.length) {
        deck = slides;
      } else if (slidesJson) {
        const imgs = JSON.parse(slidesJson) as string[];
        deck = imgs
          .filter(Boolean)
          .map((imageDataUrl) => ({ kind: 'image', imageDataUrl }) satisfies PptxSlide);
      } else {
        throw new Error('Không có slide để xuất.');
      }
      await exportDeckToPptx(deck, { fileName: label, title: label, author });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[ExportPptxButton] export failed', err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      disabled={busy}
      onClick={handleClick}
      className={
        className ??
        'nodrag flex w-full items-center justify-center gap-1.5 rounded-md border border-[var(--border-strong)] py-2 text-[11px] font-medium text-[var(--t2)] hover:border-orange-500/60 disabled:opacity-40'
      }
    >
      <FileText size={13} /> {busy ? 'Đang xuất…' : 'Tải PowerPoint (.pptx)'}
    </button>
  );
}
