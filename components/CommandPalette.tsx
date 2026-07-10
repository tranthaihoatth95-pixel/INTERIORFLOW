'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useReactFlow } from '@xyflow/react';
import {
  Search,
  Play,
  LayoutGrid,
  Maximize,
  Grid3x3,
  Undo2,
  Redo2,
  StickyNote,
  Boxes,
  Images,
  SunMoon,
  CornerDownLeft,
  type LucideIcon,
} from 'lucide-react';
import { NODE_DEFINITIONS } from '@/lib/nodes/registry';
import { CATEGORY_META, type NodeCategory } from '@/lib/types';
import { useFlowStore } from '@/lib/store';
import { runFlow } from '@/lib/execution';

interface Cmd {
  id: string;
  label: string;
  hint?: string;
  group: string;
  icon: LucideIcon;
  keywords?: string;
  run: () => void;
}

const CATEGORY_ORDER: NodeCategory[] = ['INPUT', 'AI_GENERATE', 'AI_EDIT', 'SLIDE', 'UTILITY', 'OUTPUT'];
const GROUP_ORDER = ['Hành động', ...CATEGORY_ORDER.map((c) => CATEGORY_META[c].label)];

export function CommandPalette() {
  const open = useFlowStore((s) => s.paletteOpen);
  const setOpen = useFlowStore((s) => s.setPaletteOpen);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const { screenToFlowPosition, fitView } = useReactFlow();

  const centerPos = useCallback(() => {
    const p = screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
    return { x: p.x - 128, y: p.y - 20 };
  }, [screenToFlowPosition]);

  // ⌘K / Ctrl+K bật-tắt palette ở mọi nơi
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        useFlowStore.getState().setPaletteOpen(!useFlowStore.getState().paletteOpen);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // reset khi mở
  useEffect(() => {
    if (open) {
      setQuery('');
      setActive(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const commands = useMemo<Cmd[]>(() => {
    const s = useFlowStore.getState();
    const close = () => s.setPaletteOpen(false);
    const run = (fn: () => void) => () => {
      fn();
      close();
    };

    const actions: Cmd[] = [
      { id: 'run-flow', label: 'Run flow', hint: 'chạy toàn bộ', group: 'Hành động', icon: Play, keywords: 'execute chạy graph', run: run(() => void runFlow()) },
      { id: 'auto-layout', label: 'Tự sắp xếp graph', hint: 'auto-layout', group: 'Hành động', icon: LayoutGrid, keywords: 'arrange dagre tidy sắp xếp', run: run(() => s.autoLayout()) },
      { id: 'fit', label: 'Fit view', group: 'Hành động', icon: Maximize, keywords: 'zoom vừa màn hình', run: run(() => fitView({ padding: 0.2, duration: 300 })) },
      { id: 'snap', label: `Snap lưới: ${s.snapGrid ? 'TẮT' : 'BẬT'}`, group: 'Hành động', icon: Grid3x3, keywords: 'grid canh lề align', run: run(() => s.toggleSnap()) },
      { id: 'undo', label: 'Undo', hint: '⌘Z', group: 'Hành động', icon: Undo2, keywords: 'hoàn tác', run: run(() => s.undo()) },
      { id: 'redo', label: 'Redo', hint: '⌘⇧Z', group: 'Hành động', icon: Redo2, keywords: 'làm lại', run: run(() => s.redo()) },
      { id: 'note', label: 'Thêm ghi chú (sticky)', group: 'Hành động', icon: StickyNote, keywords: 'note comment', run: run(() => s.addNote(centerPos())) },
      { id: 'lib', label: 'Mở Node Library', group: 'Hành động', icon: Boxes, keywords: 'panel node', run: run(() => s.setPanel('library')) },
      { id: 'gallery', label: 'Mở Gallery', group: 'Hành động', icon: Images, keywords: 'ảnh asset', run: run(() => s.setPanel('gallery')) },
      { id: 'theme', label: 'Đổi theme (auto → sáng → tối)', group: 'Hành động', icon: SunMoon, keywords: 'dark light', run: run(() => {
        const next = s.themePref === 'auto' ? 'light' : s.themePref === 'light' ? 'dark' : 'auto';
        s.setThemePref(next);
      }) },
      // Demo flows đã tách khỏi app thật — chuyển sang khu /demo (làm sau cùng). Xem docs/CONTENT-RULES.md
    ];

    // Mức 1 (Không AI): ẩn node AI khỏi ⌘K — đồng nhất với Node Library (tránh add
    // được node AI rồi báo lỗi khoá lúc chạy).
    const noAi = s.aiTier === 1;
    const nodeCmds: Cmd[] = NODE_DEFINITIONS.filter(
      (d) => !(noAi && (d.category === 'AI_GENERATE' || d.category === 'AI_EDIT')),
    ).map((d) => ({
      id: `node:${d.type}`,
      label: d.title,
      hint: d.creditCost > 0 ? `${d.creditCost}cr` : undefined,
      group: CATEGORY_META[d.category].label,
      icon: Boxes,
      keywords: `${d.description} ${d.type} thêm node add`,
      run: run(() => s.addNode(d.type, centerPos())),
    }));

    return [...actions, ...nodeCmds];
    // `open` trong deps: rebuild mỗi lần mở để nhãn động (snap/theme) luôn đúng state
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [centerPos, fitView, open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    const scored = commands
      .map((c) => {
        const label = c.label.toLowerCase();
        const kw = (c.keywords ?? '').toLowerCase();
        let score = -1;
        if (label.startsWith(q)) score = 3;
        else if (label.includes(q)) score = 2;
        else if (kw.includes(q)) score = 1;
        return { c, score };
      })
      .filter((x) => x.score >= 0)
      .sort((a, b) => b.score - a.score);
    return scored.map((x) => x.c);
  }, [query, commands]);

  // gom nhóm giữ thứ tự, giữ mảng phẳng để điều hướng phím
  const { flat, grouped } = useMemo(() => {
    const groups = new Map<string, Cmd[]>();
    for (const c of filtered) {
      const g = groups.get(c.group);
      if (g) g.push(c);
      else groups.set(c.group, [c]);
    }
    const orderedGroups = GROUP_ORDER.filter((g) => groups.has(g)).map((g) => ({ group: g, items: groups.get(g)! }));
    const flatList: Cmd[] = orderedGroups.flatMap((g) => g.items);
    return { flat: flatList, grouped: orderedGroups };
  }, [filtered]);

  useEffect(() => {
    setActive((a) => Math.min(a, Math.max(0, flat.length - 1)));
  }, [flat.length]);

  // cuộn item active vào tầm nhìn
  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.querySelector<HTMLElement>(`[data-idx="${active}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [active, open]);

  if (!open) return null;

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => (flat.length ? (a + 1) % flat.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => (flat.length ? (a - 1 + flat.length) % flat.length : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      flat[active]?.run();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-[14vh] backdrop-blur-sm"
      onMouseDown={() => setOpen(false)}
    >
      <div
        className="w-[min(92vw,580px)] overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-2xl shadow-black/50"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2.5 border-b border-[var(--border)] px-3.5">
          <Search size={16} className="shrink-0 text-[var(--t4)]" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={onKeyDown}
            placeholder="Tìm node hoặc hành động…"
            className="flex-1 bg-transparent py-3.5 text-sm text-[var(--t1)] placeholder-[var(--t5)] outline-none"
          />
          <kbd className="shrink-0 rounded border border-[var(--border)] bg-[var(--field)] px-1.5 py-0.5 text-[10px] text-[var(--t4)]">
            Esc
          </kbd>
        </div>

        <div ref={listRef} className="max-h-[52vh] overflow-y-auto py-1.5">
          {grouped.length === 0 && (
            <p className="px-4 py-6 text-center text-xs text-[var(--t5)]">Không có kết quả cho “{query}”.</p>
          )}
          {grouped.map(({ group, items }) => (
            <div key={group} className="mb-1">
              <p className="px-3.5 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--t5)]">
                {group}
              </p>
              {items.map((c) => {
                const idx = flat.indexOf(c);
                const isActive = idx === active;
                const Icon = c.icon;
                return (
                  <button
                    key={c.id}
                    data-idx={idx}
                    onMouseEnter={() => setActive(idx)}
                    onClick={() => c.run()}
                    className={`flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm transition ${
                      isActive ? 'bg-violet-500/15 text-[var(--t1)]' : 'text-[var(--t2)] hover:bg-[var(--hover)]'
                    }`}
                  >
                    <Icon size={15} className={isActive ? 'text-violet-300' : 'text-[var(--t4)]'} />
                    <span className="flex-1 truncate">{c.label}</span>
                    {c.hint && (
                      <span className="shrink-0 rounded bg-[var(--hover)] px-1.5 py-0.5 text-[10px] text-[var(--t4)]">
                        {c.hint}
                      </span>
                    )}
                    {isActive && <CornerDownLeft size={13} className="shrink-0 text-[var(--t4)]" />}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between border-t border-[var(--border)] px-3.5 py-2 text-[10px] text-[var(--t5)]">
          <span>↑↓ chọn · ↵ chạy</span>
          <span>{flat.length} mục</span>
        </div>
      </div>
    </div>
  );
}
