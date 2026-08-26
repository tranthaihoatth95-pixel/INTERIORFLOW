'use client';

/**
 * components/render-studio/LevelManagerPanel.tsx — VIỆC 1: KHUNG QUẢN LÝ TẦNG, đứng NGAY TRÊN cây
 * đối tượng trong ổ ② Navigator của mode 3D.
 *
 * §0d GIỮ-CÁI-ĐANG-TỐT: `Object3DTree.tsx` **không bị đập** — nó vẫn bucket theo `storey` y như
 * trước, chỉ được (a) mount thêm khung này ở đầu, (b) thêm nút mắt trên dòng tiêu đề tầng. Khung
 * này là phần THÊM, gỡ ra thì cây chạy y như hôm qua.
 *
 * Nguồn dữ liệu: `Doc.levels` + hàm thuần của PHU (`lib/cad/levels.ts` `sortedLevels`,
 * `levelsFromStoreys`). Ghi qua `doc-catalog.ts` (xem lý do phải có cầu ghi tạm trong file đó).
 *
 * ⚠️ CẢM ỨNG (§0c mảng 3 + luật G8 "kéo thả không bao giờ là đường DUY NHẤT"): đổi thứ tự tầng có
 * ĐỦ HAI ĐƯỜNG — kéo grip ⠿ (chuột, HTML5 drag) **và** cặp nút ▲▼ (chạm/bàn phím). Kéo HTML5
 * không chạy trên cảm ứng, đó chính là lý do cặp nút tồn tại, không phải cho đẹp.
 */

import { useState } from 'react';
import type { DragEvent } from 'react';
import { ChevronUp, ChevronDown, GripVertical, Plus, Trash2, Wand2 } from 'lucide-react';
import { useCadStore } from '@/lib/cad/store';
import { sortedLevels, levelsFromStoreys } from '@/lib/cad/levels';
import type { Level } from '@/lib/cad/model';
import { useScene3D } from '@/lib/render-studio/use-scene3d';
import { useTree3DUi } from '@/lib/render-studio/tree3d-ui';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import Tooltip from '@/components/ui/Tooltip';
import { writeLevels, assignLevelToEntities, addLevelToDoc } from './doc-catalog';
import { NumberField } from './NumberField';
import { formatThousands } from './scene3d-ui';

/** Chuẩn hoá `order` về 0..n-1 theo đúng thứ tự mảng truyền vào — gọi sau mọi phép đổi chỗ để số
 * thứ tự không rỗ (0,1,3,4) sau vài lần xoá. */
function renumber(levels: Level[]): Level[] {
  return levels.map((l, i) => ({ ...l, order: i }));
}

export function LevelManagerPanel() {
  const tr = useT();
  const doc = useCadStore((s) => s.doc);
  const scene = useScene3D();
  const selectedName = useTree3DUi((s) => s.selectedName);
  const [dragId, setDragId] = useState<string | null>(null);

  const levels = sortedLevels(doc);
  const selectedGroup = scene?.groups.find((g) => g.name === selectedName) ?? null;
  /** Chỉ gán tầng được cho khối CÓ `entityId` — nội thất/cửa sổ hôm nay chưa mang entityId xuống
   * group (cảnh báo tại `lib/three/cad-to-obj.ts:148`), gán mù là gán nhầm entity khác. */
  const assignableId = selectedGroup?.entityId ?? null;

  /** Nhãn `storey` đang dùng thật trong Doc mà CHƯA có Level nào tên đó — nguyên liệu cho nút
   * "Dựng tầng từ nhãn có sẵn" (không bịa tầng rỗng cho người dùng). */
  const orphanStoreys = [...new Set(doc.entities.map((e) => e.storey).filter((s): s is string => !!s))]
    .filter((s) => !levels.some((l) => l.name === s));

  const commit = (next: Level[]) => writeLevels(renumber(next));

  const addLevel = () => addLevelToDoc(tr('Tầng mới', 'New level'));

  /** Dựng Level từ tập nhãn `storey` đã dùng — dùng ĐÚNG `levelsFromStoreys` của PHU, giữ nguyên
   * cờ `inferred` nó gắn (K3: máy đoán thì phải nói là máy đoán, `elevationMm` = 0 vì file cũ
   * KHÔNG mang một byte cao độ nào). Không gán `levelId` cho entity ở đây — người dùng bấm
   * "Gán tầng" từng khối, hoặc PHU chạy `upgradeDocLevelsFromStorey()` lúc mở tệp. */
  const buildFromStoreys = () => {
    const born = levelsFromStoreys(orphanStoreys);
    commit([...levels, ...born.map((l, i) => ({ ...l, order: levels.length + i }))]);
  };

  const renameLevel = (id: string, name: string) =>
    commit(levels.map((l) => (l.id === id ? { ...l, name } : l)));

  /** Sửa cao độ = người dùng KHAI THẬT ⇒ xoá cờ `inferred` (đúng docstring `Level.inferred`:
   * "người dùng sửa cao độ thì XOÁ cờ này"). */
  const setElevation = (id: string, mm: number) =>
    commit(levels.map((l) => (l.id === id ? { ...l, elevationMm: mm, inferred: undefined } : l)));

  const move = (id: string, dir: -1 | 1) => {
    const i = levels.findIndex((l) => l.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= levels.length) return;
    const next = [...levels];
    [next[i], next[j]] = [next[j], next[i]];
    commit(next);
  };

  const dropOn = (targetId: string) => {
    if (!dragId || dragId === targetId) return;
    const from = levels.findIndex((l) => l.id === dragId);
    const to = levels.findIndex((l) => l.id === targetId);
    if (from < 0 || to < 0) return;
    const next = [...levels];
    next.splice(to, 0, next.splice(from, 1)[0]);
    commit(next);
    setDragId(null);
  };

  /**
   * Xoá tầng KHÔNG được để entity trỏ vào id đã chết (tham chiếu mồ côi — `computeHeights()` phải
   * ghi `danglingLevelIds` để không sập). Nên xoá tầng thì gỡ luôn `levelId` của mọi entity thuộc
   * nó, **GIỮ NGUYÊN `storey`** (nhãn hiển thị/nhóm BOQ/DXF vẫn đọc nó) — khối rơi về nhóm nhãn
   * cũ trong cây, không biến mất.
   */
  const removeLevel = (level: Level) => {
    const users = doc.entities.filter((e) => e.levelId === level.id);
    if (users.length) {
      useCadStore.getState().updateEntities(
        users.map((e) => {
          const next = { ...e } as typeof e & Record<string, unknown>;
          delete next.levelId;
          return next as typeof e;
        }),
      );
    }
    commit(levels.filter((l) => l.id !== level.id));
  };

  return (
    <section className="border-b border-[var(--vien-mo)] px-1.5 pb-2.5 pt-2">
      <header className="flex items-center gap-1.5 px-1">
        <span className="flex-1 text-[10.5px] font-bold uppercase leading-[1.6] tracking-wide text-[var(--t4)]">
          {tr('Tầng', 'Levels')}
        </span>
        <Tooltip side="right" label={tr('Thêm tầng mới (Shift+T)', 'Add a level (Shift+T)')}>
          <button
            type="button"
            onClick={addLevel}
            aria-label={tr('Thêm tầng', 'Add level')}
            className="grid h-[var(--tap)] w-[var(--tap)] place-items-center rounded-[10px] text-[var(--t3)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--accent)]"
          >
            <Plus size={14} />
          </button>
        </Tooltip>
      </header>

      {levels.length === 0 && (
        <div className="mt-1 rounded-[10px] border border-dashed border-[var(--border)] px-2.5 py-2.5">
          <p className="text-[10.5px] leading-relaxed text-[var(--t4)]">
            {tr(
              'Chưa khai tầng nào. Khối vẫn dựng từ cao độ 0.',
              'No levels declared yet. Blocks still build from elevation 0.',
            )}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={addLevel}
              className="h-[var(--tap)] rounded-[10px] border border-[var(--border)] bg-[var(--field)] px-2.5 text-[10.5px] font-semibold leading-[1.6] text-[var(--t1)] transition-colors hover:bg-[var(--hover)]"
            >
              {tr('Thêm tầng', 'Add level')}
            </button>
            {orphanStoreys.length > 0 && (
              <Tooltip
                side="right"
                label={tr(
                  `Dựng ${orphanStoreys.length} tầng từ nhãn đã dùng — cao độ để trống, máy không đoán`,
                  `Build ${orphanStoreys.length} levels from existing labels — elevation left blank, no guessing`,
                )}
              >
                <button
                  type="button"
                  onClick={buildFromStoreys}
                  className="flex h-[var(--tap)] items-center gap-1.5 rounded-[10px] border border-[var(--border)] bg-[var(--field)] px-2.5 text-[10.5px] font-semibold leading-[1.6] text-[var(--t1)] transition-colors hover:bg-[var(--hover)]"
                >
                  <Wand2 size={18} />
                  {tr('Dựng từ nhãn có sẵn', 'Build from labels')}
                </button>
              </Tooltip>
            )}
          </div>
        </div>
      )}

      {levels.length > 0 && (
        <ul className="mt-1 space-y-0.5">
          {levels.map((level, i) => (
            <li
              key={level.id}
              draggable
              onDragStart={() => setDragId(level.id)}
              onDragOver={(e: DragEvent) => e.preventDefault()}
              onDrop={() => dropOn(level.id)}
              onDragEnd={() => setDragId(null)}
              className={cn(
                'flex flex-wrap items-center gap-1 rounded-[10px] px-1 py-0.5 transition-colors',
                dragId === level.id ? 'bg-[var(--accent-soft)]' : 'hover:bg-[var(--hover)]',
              )}
            >
              <GripVertical size={16} className="flex-none cursor-grab text-[var(--t5)]" aria-hidden />

              <input
                value={level.name}
                onChange={(e) => renameLevel(level.id, e.target.value)}
                aria-label={tr('Tên tầng', 'Level name')}
                className="h-[var(--row)] min-w-0 flex-1 rounded-[6px] border border-transparent bg-transparent px-1 text-[11.5px] leading-[1.6] text-[var(--t2)] transition-colors hover:border-[var(--border)] focus:border-[var(--accent-ring)] focus:bg-[var(--field)] focus:outline-none"
              />

              <Tooltip
                side="right"
                label={
                  level.inferred
                    ? tr('Cao độ do máy suy đoán — sửa số để khai thật', 'Elevation was inferred — type the real value')
                    : tr('Cao độ sàn hoàn thiện (mm)', 'Finished floor elevation (mm)')
                }
              >
                {/* Cao độ hiện có DẤU PHÂN CÁCH NGHÌN (3.300 mm) — `<input type=number>` không
                    làm được việc đó, xem lý do đầy đủ ở `NumberField.tsx`. */}
                <span className={cn('w-[86px] flex-none', level.inferred && '[&_input]:border-dashed [&_input]:border-[var(--border-strong)]')}>
                  <NumberField
                    value={level.elevationMm}
                    onCommit={(v) => setElevation(level.id, v)}
                    suffix="mm"
                    step={100}
                    ariaLabel={tr('Cao độ (mm)', 'Elevation (mm)')}
                  />
                </span>
              </Tooltip>

              {/* G8 — đường CHẠM tương đương thao tác kéo grip ở trên. */}
              <button
                type="button"
                onClick={() => move(level.id, -1)}
                disabled={i === 0}
                aria-label={tr('Lên một bậc', 'Move up')}
                title={tr('Lên một bậc', 'Move up')}
                className="grid h-[var(--tap)] w-[var(--tap)] place-items-center rounded-[6px] text-[var(--t4)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--t1)] disabled:opacity-30"
              >
                <ChevronUp size={18} />
              </button>
              <button
                type="button"
                onClick={() => move(level.id, 1)}
                disabled={i === levels.length - 1}
                aria-label={tr('Xuống một bậc', 'Move down')}
                title={tr('Xuống một bậc', 'Move down')}
                className="grid h-[var(--tap)] w-[var(--tap)] place-items-center rounded-[6px] text-[var(--t4)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--t1)] disabled:opacity-30"
              >
                <ChevronDown size={18} />
              </button>

              <Tooltip
                side="right"
                label={tr(
                  'Xoá tầng — khối thuộc tầng này giữ nguyên, chỉ mất ràng buộc cao độ',
                  'Delete level — its blocks stay, they just lose the elevation constraint',
                )}
              >
                <button
                  type="button"
                  onClick={() => removeLevel(level)}
                  aria-label={tr('Xoá tầng', 'Delete level')}
                  className="grid h-[var(--tap)] w-[var(--tap)] place-items-center rounded-[6px] text-[var(--t4)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--danger,#e5484d)]"
                >
                  <Trash2 size={18} />
                </button>
              </Tooltip>
            </li>
          ))}
        </ul>
      )}

      {/* ── Gán tầng cho vật đang chọn ── */}
      {selectedName && (
        <div className="mt-2 rounded-[10px] border border-[var(--border)] bg-[var(--field)] px-2 py-1.5">
          <p className="text-[9px] font-bold uppercase leading-[1.6] tracking-wide text-[var(--t4)]">
            {tr('Gán tầng cho khối đang chọn', 'Assign level to selection')}
          </p>
          <p className="truncate text-[10.5px] leading-relaxed text-[var(--t3)]">{selectedName}</p>
          {levels.length === 0 ? (
            <p className="mt-1 text-[10px] leading-relaxed text-[var(--t5)]">
              {tr('Thêm ít nhất một tầng trước đã.', 'Add at least one level first.')}
            </p>
          ) : !assignableId ? (
            /* §9 — ô mờ KÈM LÝ DO tại chỗ, không nút giả. */
            <p className="mt-1 text-[10px] leading-relaxed text-[var(--t5)]">
              {tr(
                'Khối này chưa truy được về một đối tượng gốc trong bản vẽ nên chưa gán tầng được.',
                'This block can’t be traced back to a single source object yet, so it can’t be assigned.',
              )}
            </p>
          ) : (
            <select
              value={doc.entities.find((e) => e.id === assignableId)?.levelId ?? ''}
              onChange={(e) => {
                const level = levels.find((l) => l.id === e.target.value);
                if (level) assignLevelToEntities([assignableId], level);
              }}
              aria-label={tr('Chọn tầng', 'Pick a level')}
              className="mt-1 h-[var(--tap)] w-full rounded-[10px] border border-[var(--border)] bg-[var(--panel)] px-1.5 text-[11px] leading-[1.6] text-[var(--t1)] focus:border-[var(--accent-ring)] focus:outline-none"
            >
              <option value="">{tr('— chưa xếp tầng —', '— unassigned —')}</option>
              {levels.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} · {formatThousands(l.elevationMm)} mm
                </option>
              ))}
            </select>
          )}
        </div>
      )}
    </section>
  );
}
