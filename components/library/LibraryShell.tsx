'use client';

import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { LIBRARY_SHELVES, shelvesForStage } from '@/lib/library/mock-data';
import type { LibraryItem, StageKey } from '@/lib/library/types';
import { STAGE_META } from '@/lib/library/types';
import { useLibraryLocalState } from '@/lib/library/local-state';
import { LibraryNav } from './LibraryNav';
import { ShelfSection } from './ShelfSection';
import { LibraryInspector } from './LibraryInspector';
import { PublishModal } from './PublishModal';
import { CanvasDropDemo } from './CanvasDropDemo';
import { LibraryToastHost, pushLibraryToast } from './LibraryToast';

type TabKey = 'all' | StageKey;

const TABS: { key: TabKey; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'cad', label: STAGE_META.cad.label },
  { key: 'render', label: STAGE_META.render.label },
  { key: 'present', label: STAGE_META.present.label },
];

export function LibraryShell() {
  const [tab, setTab] = useState<TabKey>('render');
  const [selected, setSelected] = useState<LibraryItem | null>(null);
  const [draggingItem, setDraggingItem] = useState<LibraryItem | null>(null);
  const [publishOpen, setPublishOpen] = useState(false);

  const { state, bumpUsage, addPublishDraft, addComment } = useLibraryLocalState();

  const shelves = useMemo(() => shelvesForStage(tab), [tab]);

  const usageFor = (item: LibraryItem) => item.usageCount + (state.usageDelta[item.id] ?? 0);

  const runAction = (item: LibraryItem) => {
    bumpUsage(item.id);
    pushLibraryToast(
      item.mechanic === 'ap'
        ? `Đã áp "${item.name}" — không đụng bản gốc`
        : `Đã tạo bản làm việc từ "${item.name}" — không đụng bản gốc`
    );
  };

  const pendingCount = state.pending.length;

  return (
    <div className="flex h-dvh w-full" style={{ background: 'var(--bg)', color: 'var(--t1)' }}>
      <LibraryNav />

      <main className="flex min-w-0 flex-1 flex-col gap-4 overflow-y-auto px-6 py-5">
        <header className="flex flex-col gap-1">
          <h1 className="text-[19px] font-semibold">Kệ Thư viện</h1>
          <p className="text-[12.5px]" style={{ color: 'var(--t4)' }}>
            Kéo template/asset lên canvas để dùng · kệ tự lọc theo chặng đang mở
          </p>
        </header>

        <div className="flex items-center justify-between gap-3">
          <div className="flex gap-1 rounded-[var(--radius-md)] p-1" style={{ background: 'var(--field)' }}>
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className="rounded-[var(--radius-sm)] px-3.5 py-1.5 text-[12.5px] font-medium transition-colors duration-[var(--dur-fast)]"
                style={
                  tab === t.key
                    ? { background: 'var(--card)', color: 'var(--t1)', boxShadow: 'var(--shadow-node)' }
                    : { color: 'var(--t4)' }
                }
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {pendingCount > 0 && (
              <span
                title={state.pending.map((p) => p.name).join(', ')}
                className="rounded-full px-2.5 py-1 text-[11px] font-medium"
                style={{ background: 'var(--field)', color: 'var(--t3)' }}
              >
                {pendingCount} chờ duyệt
              </span>
            )}
            <button
              type="button"
              onClick={() => setPublishOpen(true)}
              className="flex items-center gap-1.5 rounded-[var(--radius-md)] px-3.5 py-2 text-[12.5px] font-semibold text-white transition-opacity duration-[var(--dur-fast)] hover:opacity-90"
              style={{ background: 'var(--accent)' }}
            >
              <Plus size={14} /> Publish lên kệ
            </button>
          </div>
        </div>

        <CanvasDropDemo draggingItem={draggingItem} onDrop={runAction} />

        <div className="flex flex-col gap-6 pb-6">
          {tab === 'all'
            ? groupByStage(shelves).map((group) => (
                <div key={group.stage} className="flex flex-col gap-4">
                  <div className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--t4)' }}>
                    {group.stage === 'chung' ? 'Kệ chung' : STAGE_META[group.stage].label}
                  </div>
                  {group.shelves.map((shelf) => (
                    <ShelfSection
                      key={shelf.id}
                      shelf={shelf}
                      usageFor={usageFor}
                      selectedId={selected?.id}
                      onSelect={setSelected}
                      onQuickAction={runAction}
                      onDragStart={setDraggingItem}
                    />
                  ))}
                </div>
              ))
            : shelves.map((shelf) => (
                <ShelfSection
                  key={shelf.id}
                  shelf={shelf}
                  usageFor={usageFor}
                  selectedId={selected?.id}
                  onSelect={setSelected}
                  onQuickAction={runAction}
                  onDragStart={setDraggingItem}
                />
              ))}
        </div>
      </main>

      <LibraryInspector
        item={selected}
        usageCount={selected ? usageFor(selected) : 0}
        comments={selected ? state.comments[selected.id] ?? [] : []}
        onPrimaryAction={runAction}
        onAddComment={addComment}
      />

      <PublishModal
        open={publishOpen}
        defaultStage={tab === 'all' ? 'render' : tab}
        onClose={() => setPublishOpen(false)}
        onSubmit={(draft) => {
          addPublishDraft(draft);
          setPublishOpen(false);
          pushLibraryToast(`Đã gửi "${draft.name}" lên kệ — chờ duyệt`);
        }}
      />

      <LibraryToastHost />
    </div>
  );
}

function groupByStage(shelves: typeof LIBRARY_SHELVES) {
  const order: Array<StageKey | 'chung'> = ['cad', 'render', 'present', 'chung'];
  return order
    .map((stage) => ({ stage, shelves: shelves.filter((s) => s.stage === stage) }))
    .filter((g) => g.shelves.length > 0);
}
