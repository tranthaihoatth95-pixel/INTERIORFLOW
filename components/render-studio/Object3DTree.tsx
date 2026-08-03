'use client';

/**
 * components/render-studio/Object3DTree.tsx — CÂY ĐỐI TƯỢNG THEO TẦNG, ổ ② Navigator của
 * `AppShell` cho mode '3d/3d' (Vẽ 3D). Port `docs/mocks/mock-3d-thong-nhat.html` (cột trái 214px
 * "Cây đối tượng") — tách RA KHỎI `Command3DPanel.tsx` (VIỆC "MỘT THƯ VIỆN", `PHIEU-CODE-IF-DOT6`
 * 05/08): trước đó cây này sống trong tab "Hiện" của `Command3DPanel`, CÙNG LÚC Navigator ổ ②
 * vẫn hiện nguyên `NodeLibraryPanel` (kệ Vật liệu ATLAS) — Hoà chụp màn thấy vật liệu hiện Ở BA
 * CHỖ (sidebar trái · panel giữa tab Vật liệu · sheet Thư viện). Nay Navigator của mode 3D
 * KHÔNG còn là `NodeLibraryPanel` nữa — là cây này, xoá hẳn 1 trong 3 chỗ.
 *
 * Ẩn/hiện + chọn để xem thuộc tính đọc/ghi qua `useTree3DUi` (store chia sẻ với
 * `Render3DModeSkeleton`/`Object3DInspector` — 3 ổ SIBLING của AppShell, không chung cây cha gần
 * nên không dùng `useState` cục bộ được, xem comment trong store).
 */
import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Eye, EyeOff, Layers } from 'lucide-react';
import { useCadStore } from '@/lib/cad/store';
import { useScene3D } from '@/lib/render-studio/use-scene3d';
import { useTree3DUi } from '@/lib/render-studio/tree3d-ui';
import { kindOfGroup, labelOfGroup, KIND_DOT } from '@/lib/render-studio/group-kind';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/utils';

const UNASSIGNED = '__unassigned';

export function Object3DTree() {
  const tr = useT();
  const scene = useScene3D();
  const groups = scene?.groups ?? [];
  const hiddenNames = useTree3DUi((s) => s.hiddenNames);
  const selectedName = useTree3DUi((s) => s.selectedName);
  const toggleHidden = useTree3DUi((s) => s.toggleHidden);
  const select = useTree3DUi((s) => s.select);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const { buckets, order } = useMemo(() => {
    const map = new Map<string, typeof groups>();
    for (const g of groups) {
      const key = g.storey ?? UNASSIGNED;
      const list = map.get(key);
      if (list) list.push(g);
      else map.set(key, [g]);
    }
    const realStoreys = [...map.keys()].filter((k) => k !== UNASSIGNED).sort();
    const order = map.has(UNASSIGNED) ? [...realStoreys, UNASSIGNED] : realStoreys;
    return { buckets: map, order };
  }, [groups]);

  const toggleCollapse = (key: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  /** Gán tầng trệt hàng loạt cho MỌI entity đang thiếu `storey` (SPEC §5.2 mục 2 "cấm im lặng bỏ
   * qua") — ghi thẳng vào Doc (tường=hatch, nội thất/cửa sổ=block), không qua group/entityId (nội
   * thất/cửa sổ chưa có entityId trong group, xem cảnh báo `cad-to-obj.ts`). */
  const assignGroundStorey = () => {
    const store = useCadStore.getState();
    const need = store.doc.entities.filter((e) => (e.type === 'hatch' || e.type === 'block') && e.storey === undefined);
    if (!need.length) return;
    store.updateEntities(need.map((e) => ({ ...e, storey: 'GF' })));
  };

  if (!groups.length) {
    return (
      <p className="px-3 py-4 text-center text-[11px] leading-relaxed text-[var(--t5)]">
        {tr('Chưa có khối nào trong cảnh.', 'No blocks in the scene yet.')}
      </p>
    );
  }

  return (
    <div className="space-y-1 px-1">
      {order.map((storeyKey) => {
        const rows = buckets.get(storeyKey)!;
        const isUnassigned = storeyKey === UNASSIGNED;
        const isCollapsed = collapsed.has(storeyKey);
        return (
          <div key={storeyKey}>
            <button
              type="button"
              onClick={() => toggleCollapse(storeyKey)}
              className="flex w-full items-center gap-1.5 rounded-[8px] px-1.5 py-1 text-left transition-colors hover:bg-[var(--hover)]"
            >
              {isCollapsed ? <ChevronRight size={11} className="text-[var(--t4)]" /> : <ChevronDown size={11} className="text-[var(--t4)]" />}
              <Layers size={11} className="text-[var(--t4)]" />
              <span className="flex-1 text-[10.5px] font-semibold uppercase tracking-wide text-[var(--t3)]">
                {isUnassigned ? tr('Chưa xếp tầng', 'Unassigned') : storeyKey}
              </span>
              <span className="font-mono text-[9px] text-[var(--t5)]">{rows.length}</span>
            </button>

            {!isCollapsed &&
              rows.map((g) => {
                const kind = kindOfGroup(g.name);
                const hidden = hiddenNames.has(g.name);
                const isSelected = selectedName === g.name;
                return (
                  <div
                    key={g.name}
                    className={cn(
                      'flex items-center gap-1.5 rounded-[8px] py-1 pl-6 pr-1.5 transition-colors',
                      isSelected ? 'bg-[var(--accent-soft)]' : 'hover:bg-[var(--hover)]',
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => select(g.name)}
                      className="flex flex-1 items-center gap-2 overflow-hidden text-left"
                    >
                      <span
                        className="h-[8px] w-[8px] flex-none rounded-[3px]"
                        style={{ background: KIND_DOT[kind], opacity: hidden ? 0.4 : 1 }}
                      />
                      <span
                        className={cn(
                          'truncate text-[11.5px]',
                          isSelected ? 'font-semibold text-[var(--accent)]' : 'text-[var(--t2)]',
                        )}
                        style={{ opacity: hidden ? 0.45 : 1 }}
                      >
                        {labelOfGroup(g, tr)}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleHidden(g.name)}
                      title={hidden ? tr('Hiện lại', 'Show') : tr('Ẩn', 'Hide')}
                      className="flex h-[20px] w-[20px] flex-none items-center justify-center rounded-[6px] text-[var(--t4)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--t1)]"
                    >
                      {hidden ? <EyeOff size={12} /> : <Eye size={12} />}
                    </button>
                  </div>
                );
              })}

            {isUnassigned && !isCollapsed && rows.length > 0 && (
              <button
                type="button"
                onClick={assignGroundStorey}
                className="ml-6 mt-1 rounded-[8px] border border-dashed border-[var(--border)] px-2 py-1 text-[10px] font-medium text-[var(--t3)] transition-colors hover:border-[var(--accent-ring)] hover:text-[var(--accent)]"
              >
                {tr(`Gán tầng trệt cho ${rows.length} khối`, `Assign ground floor to ${rows.length} blocks`)}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
