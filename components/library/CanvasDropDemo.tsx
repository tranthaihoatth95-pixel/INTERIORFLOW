'use client';

import { useState } from 'react';
import { MousePointer2 } from 'lucide-react';
import type { LibraryItem } from '@/lib/library/types';

interface Props {
  draggingItem: LibraryItem | null;
  onDrop: (item: LibraryItem) => void;
}

/**
 * Dải thả mô phỏng "canvas chặng đang mở" — canvas thật (CAD/Render/Present) chưa nối ở việc
 * này (ngoài vùng file cứng G4). Chứng minh cơ chế kéo=instantiate đầu-cuối; nối canvas thật là
 * việc của code chính sau khi merge — xem docs/BAO-CAO-G4.md.
 */
export function CanvasDropDemo({ draggingItem, onDrop }: Props) {
  const [over, setOver] = useState(false);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const id = e.dataTransfer.getData('text/library-item-id');
        if (draggingItem && draggingItem.id === id) onDrop(draggingItem);
      }}
      className="flex items-center justify-center gap-2 rounded-[var(--radius-md)] border border-dashed px-4 py-3 text-[12px] transition-colors duration-[var(--dur-fast)]"
      style={{
        borderColor: over ? 'var(--accent)' : 'var(--border)',
        background: over ? 'var(--accent-soft)' : 'transparent',
        color: over ? 'var(--accent)' : 'var(--t4)',
      }}
      data-testid="canvas-drop-demo"
    >
      <MousePointer2 size={13} />
      Vùng thả mô phỏng — kéo thẻ vào đây để tạo bản làm việc (demo; canvas thật nối sau khi merge)
    </div>
  );
}
