'use client';

/**
 * components/studio/AppCommandPalette.tsx — PALETTE ⌘K ĐA MÀN (việc b hàng đợi CHINH,
 * `SPEC-HA-TANG-UI-IF` Trụ 2 mặt hiện `palette` · `SPEC-PANEL-ROLLOUT-IDF` §4).
 *
 * Vì sao là file MỚI chứ không sửa `components/CommandPalette.tsx`: file kia gọi
 * `useReactFlow()` nên CHỈ mount được bên trong `<ReactFlowProvider>` (HomeScreen) — đó chính
 * là lý do ⌘K xưa nay chết ở `/cad`, `/present`, `/files`, `/settings` (comment cũ trong file
 * đó tự ghi nhận). Palette này KHÔNG phụ thuộc ReactFlow nên mount thẳng trong `AppShell`,
 * sống ở CẢ 5 màn. Palette của Home giữ nguyên, không đụng (§0d giữ-cái-đang-tốt).
 *
 * Nguồn lệnh:
 *   · `cmdsFor(ctx)` — sổ lệnh `lib/commands/registry.ts` (PHU, merge `4eb94c3`). ctx dựng từ
 *     chặng đang mở + `cadMode` + `shouldShowProTools(role, stage, cadMode)` — đúng ghi chú
 *     registry "nơi gọi tính sẵn proToolsAllowed, registry không tự tính".
 *   · Nhóm "Chuyển & giao diện" — hành động của chính vỏ app (chuyển chặng, Thư viện, theme,
 *     bảng phím tắt, thu/mở panel). Mỗi mục phát đúng CustomEvent/route mà UI thật đang dùng,
 *     KHÔNG có bản logic thứ hai.
 *
 * Tìm kiếm dùng `textScore` (lib/nodes/search.ts) — cùng thang điểm bỏ-dấu-tiếng-Việt với Node
 * Library và palette Home, nên gõ "duong thang" hay "đường thẳng" đều ra.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, CornerDownLeft, Command as CommandIcon, Keyboard, SunMoon, Library, PanelLeft, Layers } from 'lucide-react';
import { cmdsFor, type WhenCtx } from '@/lib/commands/registry';
import { useCadStore, shouldShowProTools } from '@/lib/cad/store';
import { useFlowStore } from '@/lib/store';
import { openLibrarySheet } from '@/lib/library/use-library-sheet';
import type { StageKey } from '@/lib/library/types';
import { textScore } from '@/lib/nodes/search';
import { useDismissable } from '@/lib/useDismissable';
import { useT } from '@/lib/i18n';
import type { AppChromeActive } from '@/components/studio/AppChrome';

interface Row {
  id: string;
  label: string;
  hint?: string;
  group: string;
  keywords: string;
  run: () => void;
}

/** Nhãn nhóm từ `CommandDef.group` (`<bucket>@<thứ tự>` — xem registry.ts). */
const BUCKET_LABEL: Record<string, [string, string]> = {
  draw: ['Vẽ', 'Draw'],
  dim: ['Kích thước & mặt cắt', 'Dimensions & hatch'],
  edit: ['Biến đổi', 'Modify'],
  view: ['Nhìn', 'View'],
  sel: ['Chọn · xoá · hoàn tác', 'Select · delete · undo'],
};

export function AppCommandPalette({ active }: { active: AppChromeActive }) {
  const tr = useT();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const openRef = useRef(false);
  openRef.current = open;
  const [query, setQuery] = useState('');
  const [idx, setIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const cadMode = useCadStore((s) => s.cadMode);
  const role = useCadStore((s) => s.role);
  const cadStage = useCadStore((s) => s.stage);

  // ⌘K bật/tắt + ↑↓/↵ điều hướng — TẤT CẢ nghe ở DOCUMENT CAPTURE.
  // ⌘K phải ở capture vì chặng Vẽ có type-anywhere nuốt phím (cùng lý do AppShell làm vậy với
  // B/I). ↑↓/↵ CŨNG phải ở capture, không để `onKeyDown` của ô input lo: verify browser thật
  // 05/08 cho thấy ở `/projects/[id]/cad` phím Enter bị một listener capture khác chặn trước
  // khi tới React root ⇒ chọn xong bấm ↵ KHÔNG chạy lệnh (palette đứng im). Đặt ở capture +
  // stopPropagation là cách duy nhất chắc chắn thắng, không phụ thuộc thứ tự mount.
  // `stateRef` để listener luôn đọc filtered/idx mới nhất mà không phải gắn lại effect mỗi lần gõ.
  const stateRef = useRef<{ rows: Row[]; idx: number }>({ rows: [], idx: 0 });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        const el = e.target as HTMLElement | null;
        const typing = !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
        if (typing && el !== inputRef.current) return;
        e.preventDefault();
        e.stopPropagation();
        setOpen((o) => !o);
        return;
      }
      if (!openRef.current) return;
      const { rows: list, idx: cur } = stateRef.current;
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        e.stopPropagation();
        if (!list.length) return;
        const d = e.key === 'ArrowDown' ? 1 : -1;
        setIdx((i) => (i + d + list.length) % list.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        list[cur]?.run();
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, []);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setIdx(0);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  const rows = useMemo<Row[]>(() => {
    const close = () => setOpen(false);
    const act = (fn: () => void) => () => {
      fn();
      close();
    };

    // ── Vỏ app: chuyển chặng · Thư viện · theme · phím tắt · thu/mở panel ───────────────────
    const libStage: StageKey = active === 'cad' ? 'cad' : active === 'present' ? 'present' : 'render';
    const shellGroup = tr('Chuyển & giao diện', 'Navigate & interface');
    const shell: Row[] = [
      // 03/08 CHỐT TÊN vòng cuối: nhãn "2D Kỹ thuật/3D Thiết kế/Trình bày" — keywords giữ cả từ
      // khoá vòng trước (cad/drafting/render/dung anh) để tìm không bị hụt trong lúc chuyển tên.
      // 04/08 [P7 ĐỔI TÊN]: 2D Kỹ thuật→Thiết kế 2D · 3D Thiết kế→Thiết kế 3D · Trình bày→Trình
      // chiếu — keywords cộng thêm "thiet ke 2d/3d"/"trinh chieu", GIỮ nguyên keywords cũ.
      { id: 'go.cad', label: tr('Sang chặng Thiết kế 2D', 'Go to 2D Design'), hint: '⌘1', group: shellGroup, keywords: 'cad drafting 2d ky thuat thiet ke ve chuyen chang stage', run: act(() => router.push('/cad-editor')) },
      { id: 'go.render', label: tr('Sang chặng Thiết kế 3D', 'Go to 3D Design'), hint: '⌘2', group: shellGroup, keywords: 'render rendering dung anh 3d thiet ke chuyen chang stage', run: act(() => router.push('/')) },
      { id: 'go.present', label: tr('Sang chặng Trình chiếu', 'Go to Presenting'), hint: '⌘3', group: shellGroup, keywords: 'present trinh bay trinh chieu deck chuyen chang stage', run: act(() => router.push('/present-editor')) },
      // Phím Thư viện: chặng Vẽ ⇧L, chặng khác L trần (§4e — `use-library-sheet.ts` tự gate y hệt).
      { id: 'shell.library', label: tr('Mở Thư viện', 'Open Library'), hint: active === 'cad' ? '⇧L' : 'L', group: shellGroup, keywords: 'thu vien library kho vat lieu template', run: act(() => openLibrarySheet({ stage: libStage })) },
      { id: 'shell.files', label: tr('Mở Quản lý tệp', 'Open File Manager'), group: shellGroup, keywords: 'file manager tep quan ly', run: act(() => router.push('/files')) },
      { id: 'shell.navigator', label: tr('Thu/mở cột trái', 'Toggle left panel'), hint: active === 'cad' ? '⇧B' : 'B', group: shellGroup, keywords: 'navigator panel cot trai thu mo sidebar', run: act(() => window.dispatchEvent(new CustomEvent('if:navigator-toggle', { detail: {} }))) },
      { id: 'shell.shortcuts', label: tr('Bảng phím tắt', 'Keyboard shortcuts'), hint: '?', group: shellGroup, keywords: 'phim tat shortcut hotkey keyboard', run: act(() => window.dispatchEvent(new CustomEvent('shortcuts:open'))) },
      {
        id: 'shell.theme',
        label: tr('Đổi theme (theo hệ thống → sáng → tối)', 'Cycle theme (auto → light → dark)'),
        group: shellGroup,
        keywords: 'theme sang toi dark light giao dien',
        run: act(() => {
          const s = useFlowStore.getState();
          s.setThemePref(s.themePref === 'auto' ? 'light' : s.themePref === 'light' ? 'dark' : 'auto');
        }),
      },
    ];

    // ── Sổ lệnh (registry) — chỉ khi ctx khớp `when`. Ở chặng khác CAD thì cmdsFor trả rỗng,
    //    palette vẫn còn nhóm vỏ app ở trên (không bao giờ trống trơn).
    const ctx: WhenCtx = {
      stage: active === 'cad' ? 'cad' : active === 'present' ? 'present' : 'render',
      mode: cadMode,
      proToolsAllowed: shouldShowProTools(role, cadStage, cadMode),
    };
    const cmds: Row[] = cmdsFor(ctx).map((c) => {
      const bucket = c.group.split('@')[0];
      const gl = BUCKET_LABEL[bucket];
      return {
        id: c.id,
        label: tr(c.label[0], c.label[1]),
        // Alias gõ tay là "phím tắt" thật của lệnh CAD (registry docstring: lệnh vẽ không có
        // phím tắt toàn cục, chỉ gõ ở ô lệnh) — hiện alias đầu tiên để tay quen AutoCAD thấy ngay.
        hint: c.key ? c.key.join('+') : c.aliases[0],
        group: gl ? tr(gl[0], gl[1]) : bucket,
        keywords: `${c.label[0]} ${c.label[1]} ${c.aliases.join(' ')} ${c.id}`,
        run: act(() => c.run()),
      };
    });

    return [...shell, ...cmds];
    // `open` trong deps: dựng lại mỗi lần mở để nhãn/ctx động luôn đúng state hiện tại.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, cadMode, role, cadStage, open, router, tr]);

  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return rows;
    return rows
      .map((r) => ({ r, score: textScore(r.label, r.keywords, q) }))
      .filter((x) => x.score >= 0)
      .sort((a, b) => b.score - a.score)
      .map((x) => x.r);
  }, [query, rows]);

  const grouped = useMemo(() => {
    const m = new Map<string, Row[]>();
    for (const r of filtered) {
      const g = m.get(r.group);
      if (g) g.push(r);
      else m.set(r.group, [r]);
    }
    return [...m.entries()].map(([group, items]) => ({ group, items }));
  }, [filtered]);

  useEffect(() => {
    setIdx((i) => Math.min(i, Math.max(0, filtered.length - 1)));
  }, [filtered.length]);

  // Gương state cho listener capture ở trên (nó gắn 1 lần, không thấy closure mới).
  stateRef.current = { rows: filtered, idx };

  useEffect(() => {
    if (!open) return;
    listRef.current?.querySelector<HTMLElement>(`[data-idx="${idx}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [idx, open]);

  // Bấm ra ngoài + Esc — hook dùng chung (gọi TRƯỚC early-return, tự gate theo `open`).
  useDismissable({ open, onDismiss: () => setOpen(false), refs: [cardRef] });

  if (!open) return null;

  // ↑↓/↵ do listener document-capture ở trên lo (xem lý do ở đó) — KHÔNG gắn onKeyDown ở input
  // nữa, tránh 2 nguồn xử lý cùng phím.

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/50 pt-[14vh] backdrop-blur-sm">
      <div
        ref={cardRef}
        className="w-[min(92vw,580px)] overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-2xl shadow-black/50"
      >
        <div className="flex items-center gap-2.5 border-b border-[var(--border)] px-3.5">
          <Search size={16} className="shrink-0 text-[var(--t4)]" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIdx(0);
            }}
            placeholder={tr('Tìm lệnh hoặc nơi cần tới…', 'Search commands or places…')}
            className="flex-1 bg-transparent py-3.5 text-sm text-[var(--t1)] placeholder-[var(--t5)] outline-none"
          />
          <kbd className="shrink-0 rounded border border-[var(--border)] bg-[var(--field)] px-1.5 py-0.5 text-[10px] text-[var(--t4)]">Esc</kbd>
        </div>

        <div ref={listRef} className="max-h-[52vh] overflow-y-auto py-1.5">
          {grouped.length === 0 && (
            <p className="px-4 py-6 text-center text-xs text-[var(--t5)]">
              {tr(`Không có lệnh nào khớp “${query}”.`, `No command matches “${query}”.`)}
            </p>
          )}
          {grouped.map(({ group, items }) => (
            <div key={group} className="mb-1">
              <p className="px-3.5 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--t5)]">{group}</p>
              {items.map((r) => {
                const i = filtered.indexOf(r);
                const on = i === idx;
                const Icon = iconFor(r.id);
                return (
                  <button
                    key={r.id}
                    data-idx={i}
                    onMouseEnter={() => setIdx(i)}
                    onClick={() => r.run()}
                    className={`flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm transition ${
                      on ? 'bg-[var(--accent-soft)] text-[var(--t1)]' : 'text-[var(--t2)] hover:bg-[var(--hover)]'
                    }`}
                  >
                    <Icon size={15} className={on ? 'text-[var(--accent)]' : 'text-[var(--t4)]'} />
                    <span className="flex-1 truncate">{r.label}</span>
                    {r.hint && (
                      <span className="shrink-0 rounded bg-[var(--hover)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--t4)]">{r.hint}</span>
                    )}
                    {on && <CornerDownLeft size={13} className="shrink-0 text-[var(--t4)]" />}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between border-t border-[var(--border)] px-3.5 py-2 text-[10px] text-[var(--t5)]">
          <span>{tr('↑↓ chọn · ↵ chạy', '↑↓ move · ↵ run')}</span>
          <span>{tr(`${filtered.length} mục`, `${filtered.length} items`)}</span>
        </div>
      </div>
    </div>
  );
}

/** Icon theo họ id — giữ 1 bộ lucide, không thêm bộ mới (§2c luật "1 bộ icon"). */
function iconFor(id: string) {
  if (id.startsWith('go.')) return Layers;
  if (id === 'shell.library') return Library;
  if (id === 'shell.theme') return SunMoon;
  if (id === 'shell.shortcuts') return Keyboard;
  if (id === 'shell.navigator') return PanelLeft;
  return CommandIcon;
}
