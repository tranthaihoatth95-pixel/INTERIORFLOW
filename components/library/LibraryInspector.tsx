'use client';

import { useState } from 'react';
import { Plus, Wand2, Layers } from 'lucide-react';
import type { CommentEntry, LibraryItem } from '@/lib/library/types';
import { SCOPE_META } from '@/lib/library/types';
import { ScopeBadge } from './ScopeBadge';

interface Props {
  item: LibraryItem | null;
  usageCount: number;
  comments: CommentEntry[];
  onPrimaryAction: (item: LibraryItem) => void;
  onAddComment: (itemId: string, text: string) => void;
}

type Tab = 'mota' | 'binhluan';

export function LibraryInspector({ item, usageCount, comments, onPrimaryAction, onAddComment }: Props) {
  const [tab, setTab] = useState<Tab>('mota');
  const [draft, setDraft] = useState('');

  return (
    <aside
      className="flex w-[270px] shrink-0 flex-col gap-4 overflow-y-auto px-4 py-4"
      style={{ borderLeft: '1px solid var(--border)', background: 'var(--panel)' }}
    >
      {!item ? (
        <div className="flex flex-1 items-center justify-center px-2 text-center text-[12.5px]" style={{ color: 'var(--t4)' }}>
          Chọn 1 mục trong kệ để xem chi tiết.
        </div>
      ) : (
        <>
          <div
            className="h-[132px] w-full rounded-[var(--radius-lg)]"
            style={{ background: `linear-gradient(135deg, ${item.thumbnail[0]}, ${item.thumbnail[1]})` }}
          />

          <div className="flex flex-col gap-1.5">
            <div className="text-[15px] font-semibold" style={{ color: 'var(--t1)' }}>{item.name}</div>
            <div className="text-[12px]" style={{ color: 'var(--t3)' }}>{item.kind}</div>
            <ScopeBadge scope={item.scope} />
          </div>

          <dl className="grid grid-cols-2 gap-y-1.5 text-[12px]" style={{ color: 'var(--t3)' }}>
            <dt>Người đăng</dt>
            <dd className="text-right" style={{ color: 'var(--t2)' }}>{item.author}</dd>
            <dt>Phiên bản</dt>
            <dd className="text-right" style={{ color: 'var(--t2)' }}>{item.version}</dd>
            <dt>Số lần dùng</dt>
            <dd className="text-right" style={{ color: 'var(--t2)' }}>{usageCount}</dd>
            {item.matId && (
              <>
                <dt>matId</dt>
                <dd className="text-right font-mono" style={{ color: 'var(--t2)' }}>{item.matId}</dd>
              </>
            )}
          </dl>

          <button
            type="button"
            onClick={() => onPrimaryAction(item)}
            className="flex items-center justify-center gap-2 rounded-[var(--radius-md)] py-2.5 text-[13.5px] font-semibold text-white transition-opacity duration-[var(--dur-fast)] hover:opacity-90 active:opacity-80"
            style={{ background: 'var(--accent)' }}
          >
            {item.mechanic === 'ap' ? <Wand2 size={15} /> : <Plus size={15} />}
            {item.mechanic === 'ap' ? 'Áp preset này' : 'Kéo lên canvas để dùng'}
          </button>

          <div className="flex flex-col gap-1.5 rounded-[var(--radius-md)] p-3" style={{ background: 'var(--field)' }}>
            <div className="flex items-center gap-1.5 text-[11.5px] font-semibold" style={{ color: 'var(--t3)' }}>
              <Layers size={12} /> Phạm vi (4 mức)
            </div>
            {(Object.keys(SCOPE_META) as Array<keyof typeof SCOPE_META>).map((k) => (
              <div key={k} className="flex items-start gap-2 text-[11px]" style={{ color: 'var(--t3)' }}>
                <ScopeBadge scope={k} />
                <span className="leading-snug">{SCOPE_META[k].hint}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2.5">
            <div className="flex gap-1 rounded-[var(--radius-sm)] p-0.5" style={{ background: 'var(--field)' }}>
              {(['mota', 'binhluan'] as Tab[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className="flex-1 rounded-[calc(var(--radius-sm)-2px)] py-1.5 text-[12px] font-medium transition-colors duration-[var(--dur-fast)]"
                  style={
                    tab === t
                      ? { background: 'var(--card)', color: 'var(--t1)', boxShadow: 'var(--shadow-node)' }
                      : { color: 'var(--t4)' }
                  }
                >
                  {t === 'mota' ? 'Mô tả' : `Bình luận${comments.length ? ` (${comments.length})` : ''}`}
                </button>
              ))}
            </div>

            {tab === 'mota' ? (
              <p className="text-[12.5px] leading-relaxed" style={{ color: 'var(--t2)' }}>{item.description}</p>
            ) : (
              <div className="flex flex-col gap-2.5">
                {comments.length === 0 && (
                  <p className="text-[12px]" style={{ color: 'var(--t4)' }}>Chưa có bình luận.</p>
                )}
                {comments.map((c) => (
                  <div key={c.id} className="flex flex-col gap-0.5 text-[12px]">
                    <span className="font-semibold" style={{ color: 'var(--t2)' }}>{c.author}</span>
                    <span style={{ color: 'var(--t3)' }}>{c.text}</span>
                  </div>
                ))}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!draft.trim()) return;
                    onAddComment(item.id, draft.trim());
                    setDraft('');
                  }}
                  className="flex gap-1.5"
                >
                  <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="Viết bình luận…"
                    className="flex-1 rounded-[var(--radius-sm)] px-2.5 py-1.5 text-[12px] outline-none"
                    style={{ background: 'var(--field)', color: 'var(--t1)', border: '1px solid var(--border)' }}
                  />
                  <button
                    type="submit"
                    className="rounded-[var(--radius-sm)] px-2.5 text-[12px] font-medium"
                    style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
                  >
                    Gửi
                  </button>
                </form>
              </div>
            )}
          </div>
        </>
      )}
    </aside>
  );
}
