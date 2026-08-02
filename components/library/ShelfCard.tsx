'use client';

import { Plus, Wand2 } from 'lucide-react';
import type { LibraryItem } from '@/lib/library/types';
import { ScopeBadge } from './ScopeBadge';

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const letters = parts.length >= 2 ? parts[0][0] + parts[parts.length - 1][0] : parts[0]?.slice(0, 2) ?? '??';
  return letters.toUpperCase();
}

interface Props {
  item: LibraryItem;
  usageCount: number;
  selected: boolean;
  onSelect: (item: LibraryItem) => void;
  onQuickAction: (item: LibraryItem) => void;
  onDragStart: (item: LibraryItem) => void;
}

export function ShelfCard({ item, usageCount, selected, onSelect, onQuickAction, onDragStart }: Props) {
  const isApply = item.mechanic === 'ap';

  return (
    // Thẻ = div[role=button], KHÔNG dùng <button> ngoài — bên trong còn nút "áp/kéo nhanh"
    // dạng <button>, lồng button-trong-button là HTML không hợp lệ (gây hydration error thật
    // đã gặp khi verify browser: "In HTML, <button> cannot be a descendant of <button>").
    <div
      role="button"
      tabIndex={0}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/library-item-id', item.id);
        e.dataTransfer.effectAllowed = 'copy';
        onDragStart(item);
      }}
      onClick={() => onSelect(item)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(item);
        }
      }}
      className="group relative flex w-[188px] shrink-0 cursor-pointer flex-col overflow-hidden rounded-[var(--radius-lg)] text-left transition-transform duration-[var(--dur-base)] ease-[var(--ease-apple)] hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2"
      style={{
        background: 'var(--card)',
        border: selected ? '1.5px solid var(--accent)' : '1px solid var(--border)',
        boxShadow: selected ? '0 0 0 3px var(--accent-soft)' : 'var(--shadow-node)',
      }}
      aria-pressed={selected}
      data-testid="library-card"
    >
      <div
        className="relative h-[104px] w-full"
        style={{ background: `linear-gradient(135deg, ${item.thumbnail[0]}, ${item.thumbnail[1]})` }}
      >
        <div className="absolute left-2 top-2">
          <ScopeBadge scope={item.scope} />
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onQuickAction(item);
          }}
          title={isApply ? 'Áp preset này' : 'Kéo lên canvas để dùng'}
          className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full opacity-0 backdrop-blur-[var(--blur)] transition-opacity duration-[var(--dur-fast)] group-hover:opacity-100 group-focus-visible:opacity-100"
          style={{ background: 'var(--mat-panel)', color: 'var(--accent)', border: '1px solid var(--mat-hairline)' }}
        >
          {isApply ? <Wand2 size={13} /> : <Plus size={14} />}
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 px-2.5 py-2.5">
        <div className="line-clamp-2 text-[13px] font-medium leading-tight" style={{ color: 'var(--t1)' }}>
          {item.name}
        </div>
        <div className="mt-auto flex items-center justify-between">
          <div
            className="flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-semibold"
            style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
            title={item.author}
          >
            {initials(item.author)}
          </div>
          <span className="text-[10.5px]" style={{ color: 'var(--t4)' }}>
            {usageCount}× dùng
          </span>
        </div>
      </div>
    </div>
  );
}
