'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useReactFlow } from '@xyflow/react';
import {
  Search,
  Play,
  Bookmark,
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
  Keyboard,
  type LucideIcon,
} from 'lucide-react';
import { NODE_DEFINITIONS } from '@/lib/nodes/registry';
import { keywordsFor } from '@/lib/nodes/keywords';
import { textScore } from '@/lib/nodes/search';
import { CATEGORY_META, type NodeCategory } from '@/lib/types';
import { useFlowStore } from '@/lib/store';
import { modKey, modShiftKey, laPhimChinh } from '@/lib/kbd';
import { runFlow } from '@/lib/execution';
import { snapshotFlow } from '@/lib/workspace';
import { useDismissable } from '@/lib/useDismissable';

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
  const cardRef = useRef<HTMLDivElement>(null);

  const { screenToFlowPosition, fitView } = useReactFlow();

  const centerPos = useCallback(() => {
    const p = screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
    return { x: p.x - 128, y: p.y - 20 };
  }, [screenToFlowPosition]);

  // ⌘K / Ctrl+K bật-tắt palette ở mọi nơi
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (laPhimChinh(e) && e.key.toLowerCase() === 'k') {
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
      { id: 'run-flow', label: 'Chạy flow', hint: 'chạy toàn bộ', group: 'Hành động', icon: Play, keywords: 'run execute chạy graph', run: run(() => void runFlow()) },
      // ④ đổi cò (01/08, docs/QUYET-DINH-HA-TANG-2026-07-31.md §④ phương án C) — trước đây MỌI
      // lượt "Chạy flow" tự động ghi 1 FlowVersion; giờ chỉ ghi khi bấm đúng nút này.
      { id: 'mark-version', label: 'Đánh dấu bản này', hint: 'lưu 1 mốc lịch sử', group: 'Hành động', icon: Bookmark, keywords: 'snapshot version lưu mốc bookmark', run: run(() => void snapshotFlow()) },
      { id: 'auto-layout', label: 'Tự sắp xếp graph', hint: 'auto-layout', group: 'Hành động', icon: LayoutGrid, keywords: 'arrange dagre tidy sắp xếp', run: run(() => s.autoLayout()) },
      { id: 'fit', label: 'Vừa khung', group: 'Hành động', icon: Maximize, keywords: 'fit view zoom vừa màn hình', run: run(() => fitView({ padding: 0.2, duration: 300 })) },
      {
        id: 'snap',
        // 7.3.34 (31/07, Sprint "Lộ nền" VIỆC 5) — "TẮT"/"BẬT" viết hoa có dấu vi phạm 7.1.23①
        // (chữ hoa không còn chỗ cho dấu thanh). Đổi sang "đang tắt"/"đang bật" thường, đúng
        // dạng đã dùng ở CadToolbar ("Bắt điểm (snap): BẬT" — mã đó CHƯA sửa, ngoài phạm vi
        // VIỆC 5 chỉ nêu CommandPalette.tsx, không quét lan sang chỗ khác).
        label: `Bắt điểm lưới: ${s.snapGrid ? 'đang bật' : 'đang tắt'}`,
        group: 'Hành động',
        icon: Grid3x3,
        keywords: 'snap grid canh lề align',
        run: run(() => s.toggleSnap()),
      },
      { id: 'undo', label: 'Hoàn tác', hint: modKey('Z'), group: 'Hành động', icon: Undo2, keywords: 'undo hoàn tác', run: run(() => s.undo()) },
      { id: 'redo', label: 'Làm lại', hint: modShiftKey('Z'), group: 'Hành động', icon: Redo2, keywords: 'redo làm lại', run: run(() => s.redo()) },
      { id: 'note', label: 'Thêm ghi chú (sticky)', group: 'Hành động', icon: StickyNote, keywords: 'note comment', run: run(() => s.addNote(centerPos())) },
      { id: 'lib', label: 'Mở Node Library', group: 'Hành động', icon: Boxes, keywords: 'panel node', run: run(() => s.setPanel('library')) },
      { id: 'gallery', label: 'Mở Gallery', group: 'Hành động', icon: Images, keywords: 'ảnh asset', run: run(() => s.setPanel('gallery')) },
      // Rail hợp nhất (03/08) bỏ 2 nút này khỏi rail (chỉ còn điều hướng) — KHÔNG có lối vào nào
      // khác trong app (đã grep xác nhận), thêm ở đây để không mất hẳn tính năng.
      { id: 'reference', label: 'Mở Reference — ảnh / vật liệu', group: 'Hành động', icon: Images, keywords: 'reference gu vật liệu ảnh', run: run(() => s.setPanel('assets')) },
      { id: 'present', label: 'Trình chiếu (Present mode)', group: 'Hành động', icon: Play, keywords: 'present slideshow trình chiếu', run: run(() => s.setPresentModeOpen(true)) },
      { id: 'theme', label: 'Đổi theme (auto → sáng → tối)', group: 'Hành động', icon: SunMoon, keywords: 'dark light', run: run(() => {
        const next = s.themePref === 'auto' ? 'light' : s.themePref === 'light' ? 'dark' : 'auto';
        s.setThemePref(next);
      }) },
      // 7.3.33 (31/07) — đường tìm thấy bảng tra phím tắt cho người chỉ biết ⌘K. Phát CustomEvent
      // 'shortcuts:open' (AppChrome.tsx lắng nghe) — CommandPalette chỉ sống ở HomeScreen (⌘K
      // hiện KHÔNG hoạt động ở /cad·/present) nên không gọi state cục bộ trực tiếp được.
      { id: 'shortcuts', label: 'Phím tắt', hint: modKey('/'), group: 'Hành động', icon: Keyboard, keywords: 'shortcut hotkey keyboard bàn phím lệnh gõ tay', run: run(() => window.dispatchEvent(new CustomEvent('shortcuts:open'))) },
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
      // keywords VI/EN của node (lib/nodes/keywords.ts) vào kho chữ tìm kiếm — gõ "vách",
      // "tách nền", "hoa văn"… ra đúng node thay vì 0 kết quả. `titleEn` BẮT BUỘC có mặt: từ
      // 05/08 tên tiếng Anh tách khỏi `label` (nhãn nay chỉ tiếng Việt), thiếu nó thì gõ
      // "batch variants"/"inpainting" ở ⌘K ra 0 kết quả.
      keywords: `${d.titleEn ?? ''} ${d.description} ${d.type} ${keywordsFor(d.type, d.keywords).join(' ')} thêm node add`,
      run: run(() => s.addNode(d.type, centerPos())),
    }));

    return [...actions, ...nodeCmds];
    // `open` trong deps: rebuild mỗi lần mở để nhãn động (snap/theme) luôn đúng state
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [centerPos, fitView, open]);

  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return commands;
    // textScore (lib/nodes/search.ts): bỏ dấu tiếng Việt + khớp AND nhiều từ, dùng CHUNG
    // thang điểm với Node Library nên 2 chỗ tìm ra cùng một kết quả.
    const scored = commands
      .map((c) => ({ c, score: textScore(c.label, c.keywords ?? '', q) }))
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

  // 2.2.90 ĐỢT 3 — chuyển bấm-ra-ngoài + Esc sang useDismissable dùng chung (trước đây tự viết
  // overlay onMouseDown={setOpen(false)} + card onMouseDown stopPropagation — đúng loại pattern
  // hook này sinh ra để thay, xem comment đầu lib/useDismissable.ts). Hook gọi TRƯỚC early-return
  // (Rules of Hooks) — tự gate theo `open` bên trong.
  useDismissable({ open, onDismiss: () => setOpen(false), refs: [cardRef] });

  if (!open) return null;

  const onKeyDown = (e: React.KeyboardEvent) => {
    // Escape giờ đi qua useDismissable (document, pha bắt) — không xử lý lại ở đây.
    if (e.key === 'ArrowDown') {
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
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-[14vh] backdrop-blur-sm">
      <div
        ref={cardRef}
        className="w-[min(92vw,580px)] overflow-hidden rounded-[14px] border border-[var(--border)] bg-[var(--card)] shadow-2xl shadow-black/50"
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
            className="flex-1 bg-transparent py-3.5 text-sm text-[var(--t1)] placeholder-[var(--t5)]"
          />
          <kbd className="shrink-0 rounded border border-[var(--border)] bg-[var(--field)] px-1.5 py-0.5 text-[10px] text-[var(--t4)]">
            Esc
          </kbd>
        </div>

        <div ref={listRef} className="max-h-[52vh] overflow-y-auto py-1.5">
          {grouped.length === 0 && (
            <p className="px-4 py-6 text-center text-xs leading-normal text-[var(--t5)]">Không có kết quả cho “{query}”.</p>
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
                    <Icon size={18} className={isActive ? 'text-violet-300' : 'text-[var(--t4)]'} />
                    <span className="flex-1 truncate">{c.label}</span>
                    {c.hint && (
                      <span className="shrink-0 rounded bg-[var(--hover)] px-1.5 py-0.5 text-[10px] text-[var(--t4)]">
                        {c.hint}
                      </span>
                    )}
                    {isActive && <CornerDownLeft size={18} className="shrink-0 text-[var(--t4)]" />}
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
