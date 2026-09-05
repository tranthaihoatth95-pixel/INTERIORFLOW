'use client';

/**
 * components/studio/Rollout.tsx — CƠ CHẾ PANEL THÒ THỤT toàn hệ (CHINH-3,
 * `docs/SPEC-PANEL-ROLLOUT-IDF.md` §2). Học 3ds Max + Blender, né đúng lỗi họ mắc:
 *
 * §2a — 3 cơ chế, không hơn:
 *   1. Bấm CẢ thanh tiêu đề = thu/mở (hit target lớn, không phải chevron bé).
 *   2. Grip ⠿ bên phải = kéo đổi thứ tự — TÁCH khỏi (1), luật Blender. Khi kéo: bóng mờ theo
 *      chuột + vạch accent 2px chỉ chỗ thả — luật 3ds Max.
 *   3. Chuột phải tiêu đề = Mở hết · Thu hết · Chỉ mở cái này · Đặt lại thứ tự.
 *      Kèm nút "Thu hết"/"Mở hết" NHÌN THẤY ĐƯỢC trên header nhóm (lỗi 3ds Max: giấu trong
 *      chuột phải không ai tìm ra).
 *
 * §2b — nhớ `{thứ tự, cái nào mở, ghim}` khoá theo LOẠI VẬT (`kindKey`: 'cad.wall' ·
 * 'cad.block' · 'present.deck'…), CẤM khoá theo sub-mode (lỗi panel nhảy loạn 3ds Max).
 *
 * §2d — ghim: panel ghim BỎ QUA "Thu hết"/"Chỉ mở cái này" (luôn mở), lưu THEO id panel dùng
 * chung mọi kindKey — đổi vật đang chọn, panel cùng id vẫn mở. (Ghim "hiện ở mọi tab" kiểu
 * Blender cần registry nội dung xuyên kind — ngoài phạm vi đợt này, ghi rõ không im lặng.)
 *
 * Adaptable ≠ adaptive (Findlater CHI 2004, ghi trong spec §1): NGƯỜI DÙNG kéo, máy KHÔNG BAO
 * GIỜ tự sắp lại — không có logic "đưa cái hay dùng lên trên" ở đây, đừng thêm.
 */

import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  Children,
  isValidElement,
  type ReactNode,
  type ReactElement,
} from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, GripVertical, Pin, ChevronsDownUp, ChevronsUpDown } from 'lucide-react';
import { useDismissable } from '@/lib/useDismissable';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/utils';

/* ─────────────────────────── lưu trạng thái theo LOẠI VẬT (§2b) ─────────────────────────── */

const STORE_PREFIX = 'interiorflow.rollout.v1.';
/** Ghim lưu THEO PANEL ID, chung mọi kindKey (§2d — sống sót khi đổi vật đang chọn). */
const PIN_KEY = 'interiorflow.rollout.v1.__pinned';

interface StoredLayout {
  order: string[];
  closed: string[];
}

function loadLayout(kindKey: string): StoredLayout | null {
  try {
    const raw = localStorage.getItem(STORE_PREFIX + kindKey);
    return raw ? (JSON.parse(raw) as StoredLayout) : null;
  } catch {
    return null;
  }
}

function saveLayout(kindKey: string, layout: StoredLayout): void {
  try {
    localStorage.setItem(STORE_PREFIX + kindKey, JSON.stringify(layout));
  } catch {
    /* quota/private — mất nhớ bố cục, không gãy chức năng */
  }
}

function loadPinned(): string[] {
  try {
    return JSON.parse(localStorage.getItem(PIN_KEY) ?? '[]') as string[];
  } catch {
    return [];
  }
}

function savePinned(ids: string[]): void {
  try {
    localStorage.setItem(PIN_KEY, JSON.stringify(ids));
  } catch {
    /* như trên */
  }
}

/** "Đặt lại bố cục panel" — xoá MỌI khoá rollout (gọi từ Cài đặt, §2b "luôn nhìn thấy được"). */
export function resetAllRolloutLayouts(): void {
  try {
    const doomed: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(STORE_PREFIX)) doomed.push(k);
    }
    doomed.forEach((k) => localStorage.removeItem(k));
  } catch {
    /* như trên */
  }
}

/* ────────────────────────────────────── Rollout item ────────────────────────────────────── */

export interface RolloutProps {
  id: string;
  title: string;
  children: ReactNode;
}

/** Chỉ là vỏ khai báo — `RolloutGroup` đọc props và tự render (cần biết toàn bộ anh em để kéo
 * đổi thứ tự + solo). Không dùng đứng một mình. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function Rollout(props: RolloutProps): null {
  return null;
}

/* ────────────────────────────────────── RolloutGroup ────────────────────────────────────── */

interface GroupProps {
  /** Khoá nhớ bố cục — LOẠI VẬT ('cad.wall' · 'cad.block' · 'present.deck'…), §2b. */
  kindKey: string;
  children: ReactNode;
}

interface DragState {
  id: string;
  /** vị trí vạch chèn (index trong mảng thứ tự SAU khi rút item đang kéo ra) */
  insertAt: number;
  ghostY: number;
}

export function RolloutGroup({ kindKey, children }: GroupProps) {
  const tr = useT();

  const items = useMemo(() => {
    const out: { id: string; title: string; node: ReactNode }[] = [];
    Children.forEach(children, (c) => {
      if (isValidElement(c) && (c.type === Rollout || (c.type as { displayName?: string })?.displayName === 'Rollout')) {
        const p = (c as ReactElement<RolloutProps>).props;
        out.push({ id: p.id, title: p.title, node: p.children });
      }
    });
    return out;
  }, [children]);
  const validIds = useMemo(() => items.map((i) => i.id), [items]);

  const [order, setOrder] = useState<string[]>(validIds);
  const [closed, setClosed] = useState<Set<string>>(new Set());
  const [pinned, setPinned] = useState<Set<string>>(new Set());
  const hydrated = useRef(false);

  // Nạp bố cục đã nhớ khi kindKey đổi (đổi LOẠI vật đang chọn) — id lạ (panel mới thêm sau khi
  // đã lưu) nối vào cuối theo thứ tự khai báo, id chết lọc bỏ.
  useLayoutEffect(() => {
    const stored = loadLayout(kindKey);
    const known = stored?.order.filter((id) => validIds.includes(id)) ?? [];
    const fresh = validIds.filter((id) => !known.includes(id));
    setOrder([...known, ...fresh]);
    setClosed(new Set(stored?.closed.filter((id) => validIds.includes(id)) ?? []));
    setPinned(new Set(loadPinned()));
    hydrated.current = true;
  }, [kindKey, validIds]);

  const persist = useCallback(
    (nextOrder: string[], nextClosed: Set<string>) => {
      if (!hydrated.current) return;
      saveLayout(kindKey, { order: nextOrder, closed: [...nextClosed] });
    },
    [kindKey],
  );

  const toggle = useCallback(
    (id: string) => {
      setClosed((cur) => {
        const next = new Set(cur);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        persist(order, next);
        return next;
      });
    },
    [order, persist],
  );

  const openAll = useCallback(() => {
    const next = new Set<string>();
    setClosed(next);
    persist(order, next);
  }, [order, persist]);

  // Thu hết — panel GHIM bỏ qua (§2d).
  const closeAll = useCallback(() => {
    const next = new Set(order.filter((id) => !pinned.has(id)));
    setClosed(next);
    persist(order, next);
  }, [order, pinned, persist]);

  // Chỉ mở cái này (solo, Ctrl-click Blender) — ghim vẫn mở.
  const solo = useCallback(
    (id: string) => {
      const next = new Set(order.filter((x) => x !== id && !pinned.has(x)));
      setClosed(next);
      persist(order, next);
    },
    [order, pinned, persist],
  );

  const resetOrder = useCallback(() => {
    setOrder(validIds);
    const next = new Set<string>();
    setClosed(next);
    saveLayout(kindKey, { order: validIds, closed: [] });
  }, [validIds, kindKey]);

  const togglePin = useCallback((id: string) => {
    setPinned((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      savePinned([...next]);
      return next;
    });
  }, []);

  /* ── kéo đổi thứ tự bằng grip (§2a-2): pointer capture, bóng mờ + vạch accent ── */
  const listRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<DragState | null>(null);

  const onGripDown = useCallback(
    (id: string, e: React.PointerEvent) => {
      e.preventDefault();
      const list = listRef.current;
      if (!list) return;
      const move = (ev: PointerEvent) => {
        const rows = Array.from(list.querySelectorAll<HTMLElement>('[data-rollout-id]')).filter(
          (r) => r.dataset.rolloutId !== id,
        );
        let insertAt = rows.length;
        for (let i = 0; i < rows.length; i++) {
          const r = rows[i].getBoundingClientRect();
          if (ev.clientY < r.top + r.height / 2) {
            insertAt = i;
            break;
          }
        }
        setDrag({ id, insertAt, ghostY: ev.clientY });
      };
      const up = (ev: PointerEvent) => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
        setDrag((cur) => {
          if (cur) {
            setOrder((old) => {
              const rest = old.filter((x) => x !== id);
              rest.splice(cur.insertAt, 0, id);
              persist(rest, closed);
              return rest;
            });
          }
          return null;
        });
        void ev;
      };
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
      move(e.nativeEvent);
    },
    [closed, persist],
  );

  /* ── menu chuột phải (§2a-3) — portal, thoát kính lồng kính như mọi popover (luật K4) ── */
  const [menu, setMenu] = useState<{ x: number; y: number; id: string } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  useDismissable({ open: !!menu, onDismiss: () => setMenu(null), refs: [menuRef] });

  const sorted = order.map((id) => items.find((i) => i.id === id)).filter(Boolean) as typeof items;
  const allClosed = sorted.every((i) => closed.has(i.id) || pinned.has(i.id));
  const dragItem = drag ? items.find((i) => i.id === drag.id) : null;

  return (
    <div className="flex min-h-0 flex-col">
      {/* Header nhóm — nút Thu hết/Mở hết NHÌN THẤY ĐƯỢC (§2a-3 cảnh báo lỗi 3ds Max). */}
      <div className="flex h-7 shrink-0 items-center justify-end px-2">
        <button
          type="button"
          onClick={allClosed ? openAll : closeAll}
          title={allClosed ? tr('Mở hết', 'Open all') : tr('Thu hết', 'Close all')}
          className="grid h-6 w-6 place-items-center rounded-[10px] text-[var(--t4)] transition-colors duration-[var(--nhip-bam)] hover:bg-[var(--hover)] hover:text-[var(--t1)]"
        >
          {allClosed ? <ChevronsUpDown size={14} /> : <ChevronsDownUp size={14} />}
        </button>
      </div>

      <div ref={listRef} className="relative min-h-0 flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
        {sorted.map((it, idx) => {
          const isOpen = !closed.has(it.id);
          const isPinned = pinned.has(it.id);
          const showLineAbove = drag && drag.id !== it.id && drag.insertAt === sortedIndexWithout(sorted, drag.id, idx);
          return (
            <div key={it.id} data-rollout-id={it.id} className={cn(drag?.id === it.id && 'opacity-35')}>
              {showLineAbove && <div className="mx-2 h-[2px] rounded bg-[var(--accent)]" />}
              <div
                role="button"
                tabIndex={0}
                onClick={() => toggle(it.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggle(it.id);
                  }
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setMenu({ x: e.clientX, y: e.clientY, id: it.id });
                }}
                // HOÀ: giữ token `--nhip-bam` + `--accent-ring` (xem chú thích ở InspectorPages.tsx).
                className="group flex h-[var(--row)] w-full cursor-pointer select-none items-center gap-1.5 border-b border-[var(--vien-mo)] px-2 transition-colors duration-[var(--nhip-bam)] hover:bg-[var(--hover)] if-focus-inset"
              >
                <ChevronDown
                  size={16}
                  className={cn('shrink-0 text-[var(--t4)] transition-transform duration-[var(--nhip-bam)]', !isOpen && '-rotate-90')}
                />
                <span className="min-w-0 flex-1 truncate text-[var(--fs-2xs)] font-bold uppercase tracking-wider text-[var(--t3)]">
                  {it.title}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePin(it.id);
                  }}
                  title={isPinned ? tr('Bỏ ghim', 'Unpin') : tr('Ghim — giữ mở khi đổi vật chọn', 'Pin — stays open across selections')}
                  className={cn(
                    'grid h-5 w-5 shrink-0 place-items-center rounded-[6px] transition-all duration-[var(--nhip-bam)]',
                    isPinned
                      ? 'text-[var(--accent)]'
                      : 'text-[var(--t5)] opacity-0 hover:bg-[var(--hover)] hover:text-[var(--t2)] group-hover:opacity-100 group-focus-within:opacity-100',
                  )}
                >
                  <Pin size={14} className={cn(isPinned && 'fill-current')} />
                </button>
                <span
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    onGripDown(it.id, e);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  title={tr('Kéo để đổi thứ tự', 'Drag to reorder')}
                  className="grid h-5 w-4 shrink-0 cursor-grab place-items-center text-[var(--t5)] opacity-0 transition-opacity duration-[var(--nhip-bam)] hover:text-[var(--t2)] active:cursor-grabbing group-hover:opacity-100 group-focus-within:opacity-100"
                >
                  <GripVertical size={14} />
                </span>
              </div>
              {isOpen && <div>{it.node}</div>}
            </div>
          );
        })}
        {drag && drag.insertAt >= sorted.filter((s) => s.id !== drag.id).length && (
          <div className="mx-2 h-[2px] rounded bg-[var(--accent)]" />
        )}
      </div>

      {/* Bóng mờ theo chuột khi kéo (§2a-2, luật 3ds Max) — portal để không bị overflow cắt. */}
      {drag && dragItem &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="nen-mo-panel pointer-events-none fixed left-auto z-[90] flex h-[var(--row)] w-48 items-center gap-1.5 rounded-[10px] border border-[var(--border)] px-2 opacity-80 shadow-[var(--shadow-pop)]"
            style={{ top: drag.ghostY - 14, left: (listRef.current?.getBoundingClientRect().left ?? 0) + 8 }}
          >
            <GripVertical size={16} className="text-[var(--t4)]" />
            <span className="truncate text-[var(--fs-2xs)] font-bold uppercase tracking-wider text-[var(--t2)]">
              {dragItem.title}
            </span>
          </div>,
          document.body,
        )}

      {/* Menu chuột phải (§2a-3). */}
      {menu &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={menuRef}
            className="nen-mo-panel fixed z-[90] w-44 rounded-[10px] border border-[var(--border)] p-1 shadow-[var(--shadow-pop)]"
            style={{ top: menu.y, left: menu.x }}
          >
            {(
              [
                [tr('Mở hết', 'Open all'), openAll],
                [tr('Thu hết', 'Close all'), closeAll],
                [tr('Chỉ mở cái này', 'Solo this'), () => solo(menu.id)],
                [tr('Đặt lại thứ tự', 'Reset order'), resetOrder],
              ] as [string, () => void][]
            ).map(([label, fn]) => (
              <button
                key={label}
                type="button"
                onClick={() => {
                  fn();
                  setMenu(null);
                }}
                className="flex w-full items-center rounded-[6px] px-2 py-1.5 text-left text-[11.5px] text-[var(--t2)] transition-colors duration-[var(--nhip-bam)] hover:bg-[var(--hover)] hover:text-[var(--t1)]"
              >
                {label}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </div>
  );
}
Rollout.displayName = 'Rollout';

/** Index của vạch chèn tính trên mảng ĐÃ RÚT item đang kéo — quy đổi từ index hàng đang duyệt. */
function sortedIndexWithout(sorted: { id: string }[], dragId: string, rowIdx: number): number {
  let n = 0;
  for (let i = 0; i < rowIdx; i++) if (sorted[i].id !== dragId) n++;
  return n;
}
