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
 *
 * VIỆC 1 (05/08, phiếu G4 "cây tầng") — NÂNG CẤP, KHÔNG ĐẬP (§0d): phần bucket theo `storey` giữ
 * NGUYÊN VĂN. Ba thứ THÊM vào: (a) `<LevelManagerPanel/>` đứng trên cùng (thêm/xoá/đổi tên/cao
 * độ/thứ tự/gán tầng) · (b) nút MẮT trên dòng tiêu đề tầng = ẩn cả tầng khỏi khung nhìn 3D
 * (`useLevelUi`, `Render3DModeSkeleton` lọc thật) · (c) thứ tự bucket theo `Doc.levels` khi đã
 * khai tầng, thay vì sắp chữ cái (`'GF'/'L1'/'Lửng'/'Tum'` không có thứ tự chữ cái đúng nghĩa nào
 * — lý do PHU đã ghi ở `levelsFromStoreys`).
 */
import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Eye, EyeOff, Layers } from 'lucide-react';
import { useCadStore } from '@/lib/cad/store';
import { sortedLevels } from '@/lib/cad/levels';
import { useScene3D } from '@/lib/render-studio/use-scene3d';
import { useTree3DUi } from '@/lib/render-studio/tree3d-ui';
import { kindOfGroup, labelOfGroup, KIND_DOT } from '@/lib/render-studio/group-kind';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { LevelManagerPanel } from './LevelManagerPanel';
import { useLevelUi, UNASSIGNED_LEVEL } from './scene3d-ui';

const UNASSIGNED = UNASSIGNED_LEVEL;

export function Object3DTree() {
  const tr = useT();
  const scene = useScene3D();
  const groups = scene?.groups ?? [];
  const doc = useCadStore((s) => s.doc);
  const hiddenNames = useTree3DUi((s) => s.hiddenNames);
  const selectedName = useTree3DUi((s) => s.selectedName);
  const toggleHidden = useTree3DUi((s) => s.toggleHidden);
  const select = useTree3DUi((s) => s.select);
  const hiddenLevels = useLevelUi((s) => s.hiddenLevels);
  const toggleLevel = useLevelUi((s) => s.toggleLevel);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  /** Thứ tự tầng ĐÃ KHAI (`Doc.levels`) — dùng làm thứ tự bucket khi khớp được nhãn. Xem cảnh báo
   * "khoá là nhãn `storey`, không phải `Level.id`" ở `scene3d-ui.ts`. */
  const levelOrder = useMemo(() => sortedLevels(doc).map((l) => l.name), [doc]);

  const { buckets, order } = useMemo(() => {
    const map = new Map<string, typeof groups>();
    for (const g of groups) {
      const key = g.storey ?? UNASSIGNED;
      const list = map.get(key);
      if (list) list.push(g);
      else map.set(key, [g]);
    }
    const realStoreys = [...map.keys()].filter((k) => k !== UNASSIGNED).sort((a, b) => {
      const ia = levelOrder.indexOf(a);
      const ib = levelOrder.indexOf(b);
      // Tầng đã khai đứng trước theo đúng thứ tự người dùng xếp; nhãn chưa khai rơi xuống cuối,
      // vẫn sắp chữ cái như hành vi cũ (không đổi gì cho doc chưa có Level nào).
      if (ia >= 0 && ib >= 0) return ia - ib;
      if (ia >= 0) return -1;
      if (ib >= 0) return 1;
      return a.localeCompare(b);
    });
    const order = map.has(UNASSIGNED) ? [...realStoreys, UNASSIGNED] : realStoreys;
    return { buckets: map, order };
  }, [groups, levelOrder]);

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
      <>
        <LevelManagerPanel />
        <p className="px-3 py-4 text-center text-[11px] leading-relaxed text-[var(--t5)]">
          {tr('Chưa có khối nào trong cảnh.', 'No blocks in the scene yet.')}
        </p>
      </>
    );
  }

  return (
    <>
      <LevelManagerPanel />
      <div className="space-y-1 px-1 pt-1.5">
      {order.map((storeyKey) => {
        const rows = buckets.get(storeyKey)!;
        const isUnassigned = storeyKey === UNASSIGNED;
        const isCollapsed = collapsed.has(storeyKey);
        const levelHidden = hiddenLevels.has(storeyKey);
        return (
          <div key={storeyKey}>
            {/* Hai NÚT RỜI cạnh nhau (không lồng button trong button — HTML không cho, React cũng
                cảnh báo): trái = gập/mở nhóm, phải = ẩn/hiện CẢ TẦNG trong khung nhìn 3D. */}
            <div className="flex w-full items-center gap-1 rounded-[10px] pr-0.5 transition-colors hover:bg-[var(--hover)]">
              <button
                type="button"
                onClick={() => toggleCollapse(storeyKey)}
                className="flex min-w-0 flex-1 items-center gap-1.5 rounded-[10px] px-1.5 py-1 text-left"
              >
                {isCollapsed ? <ChevronRight size={11} className="text-[var(--t4)]" /> : <ChevronDown size={11} className="text-[var(--t4)]" />}
                <Layers size={11} className="text-[var(--t4)]" />
                {/* mock `.sech`: 11px, chữ t4, letter-spacing .07em (không phải tracking-wide mặc định) */}
                <span
                  className="flex-1 truncate text-[11px] font-bold uppercase leading-[1.6] tracking-[0.07em] text-[var(--t4)]"
                  style={{ opacity: levelHidden ? 0.45 : 1 }}
                >
                  {isUnassigned ? tr('Chưa xếp tầng', 'Unassigned') : storeyKey}
                </span>
                <span className="font-mono text-[9px] leading-[1.6] text-[var(--t5)]">{rows.length}</span>
              </button>
              <button
                type="button"
                onClick={() => toggleLevel(storeyKey)}
                title={levelHidden ? tr('Hiện cả tầng', 'Show whole level') : tr('Ẩn cả tầng khỏi khung nhìn 3D', 'Hide whole level in the 3D view')}
                aria-label={levelHidden ? tr('Hiện cả tầng', 'Show whole level') : tr('Ẩn cả tầng', 'Hide whole level')}
                className={cn(
                  'grid h-[var(--tap)] w-[var(--tap)] flex-none place-items-center rounded-[6px] transition-colors hover:bg-[var(--hover)] hover:text-[var(--t1)]',
                  levelHidden ? 'text-[var(--accent)]' : 'text-[var(--t4)]',
                )}
              >
                {levelHidden ? <EyeOff size={12} /> : <Eye size={12} />}
              </button>
            </div>

            {!isCollapsed &&
              rows.map((g) => {
                const kind = kindOfGroup(g.name);
                const hidden = hiddenNames.has(g.name);
                const isSelected = selectedName === g.name;
                return (
                  // mock `.lay`: hàng cao ~28px (var(--row)), gap 8px, gạch trái 2px báo trạng thái
                  // chọn (trước chỉ có nền accent-soft, không có gạch) — pl-6 giữ nguyên (thụt cấp
                  // con trong cây tầng, mock không có cấu trúc lồng này nên không có số để đối chiếu).
                  <div
                    key={g.name}
                    className={cn(
                      'flex min-h-[28px] items-center gap-2 border-l-2 py-1 pl-6 pr-1.5 transition-colors',
                      isSelected ? 'border-l-[var(--accent)] bg-[var(--accent-soft)]' : 'border-l-transparent hover:bg-[var(--hover)]',
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => select(g.name)}
                      className="flex flex-1 items-center gap-2 overflow-hidden text-left"
                    >
                      <span
                        className="h-[10px] w-[10px] flex-none rounded-[3px]"
                        style={{ background: KIND_DOT[kind], opacity: hidden ? 0.4 : 1 }}
                      />
                      {/* mock `.nm`: font-size var(--fs-xs) = 12px */}
                      <span
                        className={cn(
                          'truncate text-[12px]',
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
                      className="flex h-[var(--tap)] w-[var(--tap)] flex-none items-center justify-center rounded-[6px] text-[var(--t4)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--t1)]"
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
                className="ml-6 mt-1 rounded-[10px] border border-dashed border-[var(--border)] px-2 py-1 text-[10px] font-medium text-[var(--t3)] transition-colors hover:border-[var(--accent-ring)] hover:text-[var(--accent)]"
              >
                {tr(`Gán tầng trệt cho ${rows.length} khối`, `Assign ground floor to ${rows.length} blocks`)}
              </button>
            )}
          </div>
        );
      })}
      </div>
    </>
  );
}
