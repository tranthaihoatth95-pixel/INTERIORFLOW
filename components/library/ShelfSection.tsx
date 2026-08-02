'use client';

import type { LibraryItem, LibraryShelf } from '@/lib/library/types';
import { ShelfCard } from './ShelfCard';

interface Props {
  shelf: LibraryShelf;
  usageFor: (item: LibraryItem) => number;
  selectedId?: string;
  onSelect: (item: LibraryItem) => void;
  onQuickAction: (item: LibraryItem) => void;
  onDragStart: (item: LibraryItem) => void;
}

export function ShelfSection({ shelf, usageFor, selectedId, onSelect, onQuickAction, onDragStart }: Props) {
  return (
    <section className="flex flex-col gap-2.5">
      <h3 className="flex items-center gap-2 text-[13.5px] font-semibold" style={{ color: 'var(--t2)' }}>
        <span aria-hidden style={{ color: 'var(--accent)' }}>{shelf.icon}</span>
        {shelf.title}
      </h3>
      <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'thin' }}>
        {shelf.items.map((item) => (
          <ShelfCard
            key={item.id}
            item={item}
            usageCount={usageFor(item)}
            selected={item.id === selectedId}
            onSelect={onSelect}
            onQuickAction={onQuickAction}
            onDragStart={onDragStart}
          />
        ))}
      </div>
    </section>
  );
}
