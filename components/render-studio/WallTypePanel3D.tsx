'use client';

/**
 * components/render-studio/WallTypePanel3D.tsx — VIỆC 2: BẢNG LOẠI TƯỜNG (Type) cho mode 3D, sống
 * trong tab "Sửa" của `Command3DPanel` (đúng chỗ panel Modify của 3ds Max / Type Properties của
 * Revit: chọn vật → sửa loại của nó).
 *
 * ⚠️ TÊN FILE có hậu tố `3D` để KHÔNG đụng `WallTypePanel` đã có ở `components/cad/CadEditor.tsx:2119`
 * — cái đó tên gây hiểu lầm, nó gán `wallKind` lên TỪNG entity chứ không quản lý catalog Type
 * (chính PHU đã ghi cảnh báo này ở đầu `lib/cad/wall-types.ts`). Hai thứ khác nhau, không gộp.
 *
 * ✅ DẤU GHI ĐÈ ĐỌC THẲNG `ResolvedWallParams.overridden` CỦA PHU (`lib/cad/wall-types.ts:38`) —
 * KHÔNG tự tính lại. Đây là điểm dễ lệch nhất của cả panel: PHU đã cân nhắc kỹ ca *"entity không
 * `typeId` thì mảng LUÔN rỗng dù khai đủ 3 trường"* (docstring của chính field đó) — tự suy bằng
 * `from === 'instance'` sẽ chấm dấu bừa lên **mọi tường cũ của mọi dự án**, đúng cái bẫy PHU cảnh
 * báo. `thicknessFrom`/`kindFrom`/`specIdFrom` vẫn đọc, nhưng CHỈ để hiện nhãn nguồn ('Type' /
 * 'riêng' / '—'), không dùng để quyết định chấm dấu.
 */

import { useState } from 'react';
import { Plus, RotateCcw, Trash2, AlertTriangle } from 'lucide-react';
import { useCadStore } from '@/lib/cad/store';
import { resolveWallParams, wallTypeLayerCheck, type OverridableWallField } from '@/lib/cad/wall-types';
import { WALL_KIND_OPTIONS, type WallKind, type WallType } from '@/lib/cad/model';
import { useScene3D } from '@/lib/render-studio/use-scene3d';
import { useTree3DUi } from '@/lib/render-studio/tree3d-ui';
import { kindOfGroup } from '@/lib/render-studio/group-kind';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import Tooltip from '@/components/ui/Tooltip';
import { writeWallTypes, assignWallType, clearWallInstanceOverride } from './doc-catalog';
import { NumberField } from './NumberField';
import { formatThousands } from './scene3d-ui';

/** Id tất định (không `Math.random`/`Date.now` — cùng luật với `levelIdFromStorey` của PHU). */
function newTypeId(existing: WallType[]): string {
  let n = existing.length + 1;
  while (existing.some((t) => t.id === `wt-${n}`)) n += 1;
  return `wt-${n}`;
}

export function WallTypePanel3D() {
  const tr = useT();
  const doc = useCadStore((s) => s.doc);
  const scene = useScene3D();
  const selectedName = useTree3DUi((s) => s.selectedName);
  const [editingId, setEditingId] = useState<string | null>(null);

  const types = doc.wallTypes ?? [];

  const selectedGroup = scene?.groups.find((g) => g.name === selectedName) ?? null;
  /** Chỉ TƯỜNG mới có Type (catalog của PHU là `WallType`, không phải type chung cho mọi cấu
   * kiện) và chỉ khối truy được về entity gốc mới áp được — nội thất/cửa sổ chưa mang `entityId`
   * xuống group (`lib/three/cad-to-obj.ts:148`). */
  const targetWall =
    selectedGroup && kindOfGroup(selectedGroup.name) === 'wall' && selectedGroup.entityId
      ? doc.entities.find((e) => e.id === selectedGroup.entityId) ?? null
      : null;

  const resolved = targetWall ? resolveWallParams(targetWall, doc) : null;
  const editing = types.find((t) => t.id === editingId) ?? null;

  const addType = () => {
    const t: WallType = {
      id: newTypeId(types),
      name: tr(`Loại tường ${types.length + 1}`, `Wall type ${types.length + 1}`),
      thicknessMm: 220,
      kind: 'interior',
    };
    writeWallTypes([...types, t]);
    setEditingId(t.id);
  };

  const patchType = (id: string, patch: Partial<WallType>) =>
    writeWallTypes(types.map((t) => (t.id === id ? { ...t, ...patch } : t)));

  /** Xoá Type ⇒ mọi entity trỏ vào nó thành `danglingTypeId`. `resolveWallParams()` đã lùi về
   * thuần-instance để không sập, nhưng để rác lại là bẩn ⇒ gỡ luôn `typeId` của những entity đó. */
  const removeType = (id: string) => {
    const users = doc.entities.filter((e) => e.typeId === id);
    if (users.length) {
      useCadStore.getState().updateEntities(
        users.map((e) => {
          const next = { ...e } as typeof e & Record<string, unknown>;
          delete next.typeId;
          return next as typeof e;
        }),
      );
    }
    writeWallTypes(types.filter((t) => t.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const layerCheck = editing ? wallTypeLayerCheck(editing) : {};

  return (
    <section className="space-y-2.5">
      <header className="flex items-center gap-1.5">
        <span className="flex-1 text-[9px] font-bold uppercase leading-[1.6] tracking-wide text-[var(--t4)]">
          {tr('Loại tường (Type)', 'Wall types')}
        </span>
        <Tooltip side="right" label={tr('Thêm loại tường mới', 'Add a wall type')}>
          <button
            type="button"
            onClick={addType}
            aria-label={tr('Thêm loại tường', 'Add wall type')}
            className="grid h-[var(--tap)] w-[var(--tap)] place-items-center rounded-[10px] text-[var(--t3)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--accent)]"
          >
            <Plus size={14} />
          </button>
        </Tooltip>
      </header>

      {types.length === 0 ? (
        <p className="rounded-[10px] border border-dashed border-[var(--border)] px-2.5 py-2.5 text-[10.5px] leading-relaxed text-[var(--t4)]">
          {tr(
            'Chưa có loại tường nào. Mỗi tường đang mang bề dày riêng — sửa một loại phải sửa tay từng đoạn.',
            'No wall types yet. Every wall carries its own thickness — changing one kind means editing each segment by hand.',
          )}
        </p>
      ) : (
        <ul className="space-y-0.5">
          {types.map((t) => {
            const usedBy = doc.entities.filter((e) => e.typeId === t.id).length;
            const active = editingId === t.id;
            return (
              <li key={t.id} className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setEditingId(active ? null : t.id)}
                  className={cn(
                    'flex min-h-[var(--row)] min-w-0 flex-1 items-center gap-2 rounded-[10px] border px-2 py-1 text-left transition-colors',
                    active
                      ? 'border-[var(--accent)] bg-[var(--accent-soft)]'
                      : 'border-[var(--border)] bg-[var(--field)] hover:border-[var(--accent-ring)]',
                  )}
                >
                  <span className={cn('flex-1 truncate text-[11px] leading-[1.6]', active ? 'font-semibold text-[var(--accent)]' : 'text-[var(--t2)]')}>
                    {t.name}
                  </span>
                  <span className="flex-none font-mono text-[9.5px] leading-[1.6] text-[var(--t5)]">
                    {formatThousands(t.thicknessMm)}mm · {usedBy}
                  </span>
                </button>
                <Tooltip
                  side="right"
                  label={
                    usedBy
                      ? tr(`Xoá loại — ${usedBy} tường sẽ quay về bề dày riêng`, `Delete — ${usedBy} walls fall back to their own thickness`)
                      : tr('Xoá loại tường', 'Delete wall type')
                  }
                >
                  <button
                    type="button"
                    onClick={() => removeType(t.id)}
                    aria-label={tr('Xoá loại tường', 'Delete wall type')}
                    className="grid h-[var(--tap)] w-[var(--tap)] flex-none place-items-center rounded-[6px] text-[var(--t4)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--danger)]"
                  >
                    <Trash2 size={12} />
                  </button>
                </Tooltip>
              </li>
            );
          })}
        </ul>
      )}

      {/* ── Sửa tham số của Type đang mở ── */}
      {editing && (
        <div className="space-y-2 rounded-[10px] border border-[var(--border)] bg-[var(--field)] p-2">
          <label className="block">
            <span className="text-[9px] font-bold uppercase leading-[1.6] tracking-wide text-[var(--t4)]">{tr('Tên loại', 'Name')}</span>
            <input
              value={editing.name}
              onChange={(e) => patchType(editing.id, { name: e.target.value })}
              className="mt-0.5 h-[var(--tap)] w-full rounded-[6px] border border-[var(--border)] bg-[var(--panel)] px-1.5 text-[11px] leading-[1.6] text-[var(--t1)] focus:border-[var(--accent-ring)] focus:outline-none"
            />
          </label>

          <div className="flex gap-2">
            <label className="flex-1">
              <span className="text-[9px] font-bold uppercase leading-[1.6] tracking-wide text-[var(--t4)]">{tr('Bề dày (mm)', 'Thickness (mm)')}</span>
              <span className="mt-0.5 block">
                <NumberField
                  value={editing.thicknessMm}
                  onCommit={(v) => patchType(editing.id, { thicknessMm: v })}
                  suffix="mm"
                  step={10}
                  min={10}
                  ariaLabel={tr('Bề dày (mm)', 'Thickness (mm)')}
                />
              </span>
            </label>
            <label className="flex-1">
              <span className="text-[9px] font-bold uppercase leading-[1.6] tracking-wide text-[var(--t4)]">{tr('Phân loại', 'Kind')}</span>
              <select
                value={editing.kind}
                onChange={(e) => patchType(editing.id, { kind: e.target.value as WallKind })}
                className="mt-0.5 h-[var(--tap)] w-full rounded-[6px] border border-[var(--border)] bg-[var(--panel)] px-1 text-[10.5px] leading-[1.6] text-[var(--t1)] focus:border-[var(--accent-ring)] focus:outline-none"
              >
                {WALL_KIND_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </label>
          </div>

          {/* Cấu tạo lớp — HIỆN được, SỬA chưa (§9: ô trống là bằng chứng còn việc, kèm lý do). */}
          <div>
            <span className="text-[9px] font-bold uppercase leading-[1.6] tracking-wide text-[var(--t4)]">{tr('Cấu tạo lớp', 'Layers')}</span>
            {editing.layers?.length ? (
              <ul className="mt-0.5 space-y-0.5">
                {editing.layers.map((l, i) => (
                  <li key={`${l.name}-${i}`} className="flex items-center gap-1.5 text-[10.5px] leading-[1.6] text-[var(--t3)]">
                    <span className="flex-1 truncate">{l.core ? `▣ ${l.name}` : l.name}</span>
                    <span className="font-mono text-[var(--t4)]">{formatThousands(l.thicknessMm)}mm</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-0.5 text-[10px] leading-relaxed text-[var(--t5)]">
                {tr(
                  'Chưa khai lớp. Trình sửa cấu tạo lớp (ốp gỗ · lõi · vữa) chưa dựng — bề dày tổng ở trên vẫn là số chính thức dùng để dựng hình.',
                  'No layers declared. The layer editor (cladding · core · plaster) isn’t built yet — the total thickness above is still the official build number.',
                )}
              </p>
            )}
            {layerCheck.mismatchMm !== undefined && (
              <p className="mt-1 flex items-start gap-1 text-[10px] leading-relaxed text-[var(--warning)]">
                <AlertTriangle size={11} className="mt-0.5 flex-none" />
                {tr(
                  `Tổng lớp ${layerCheck.sumMm}mm lệch ${layerCheck.mismatchMm > 0 ? '+' : ''}${layerCheck.mismatchMm}mm so bề dày khai.`,
                  `Layers total ${layerCheck.sumMm}mm, off by ${layerCheck.mismatchMm > 0 ? '+' : ''}${layerCheck.mismatchMm}mm from the declared thickness.`,
                )}
              </p>
            )}
          </div>

          <button
            type="button"
            disabled={!targetWall}
            onClick={() => targetWall && assignWallType([targetWall.id], editing.id)}
            title={
              targetWall
                ? tr('Gán loại này cho tường đang chọn', 'Apply this type to the selected wall')
                : tr('Chọn một bức tường trong cây đối tượng trước đã', 'Select a wall in the object tree first')
            }
            className={cn(
              'h-[var(--tap)] w-full rounded-[10px] border px-2 text-[11px] font-semibold leading-[1.6] transition-colors',
              targetWall
                ? 'cursor-pointer border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)] hover:bg-[var(--hover)]'
                : 'cursor-not-allowed border-dashed border-[var(--border)] text-[var(--t5)]',
            )}
          >
            {tr('Áp cho vật đang chọn', 'Apply to selection')}
          </button>
        </div>
      )}

      {/* ── Ba tham số của tường đang chọn: giá trị cuối + NGUỒN + đường trả về Type ── */}
      {targetWall && resolved && (
        <div className="space-y-1.5 border-t border-[var(--vien-mo)] pt-2.5">
          <span className="text-[9px] font-bold uppercase leading-[1.6] tracking-wide text-[var(--t4)]">
            {tr('Tường đang chọn', 'Selected wall')}
          </span>

          {resolved.danglingTypeId && (
            <p className="flex items-start gap-1 text-[10px] leading-relaxed text-[var(--danger)]">
              <AlertTriangle size={11} className="mt-0.5 flex-none" />
              {tr(
                `Tường trỏ tới loại "${resolved.danglingTypeId}" không còn tồn tại — đang chạy bằng số riêng của nó.`,
                `This wall points at type "${resolved.danglingTypeId}" which no longer exists — running on its own values.`,
              )}
            </p>
          )}

          <ParamRow
            label={tr('Bề dày', 'Thickness')}
            value={resolved.thicknessMm === undefined ? '—' : `${formatThousands(resolved.thicknessMm)} mm`}
            from={resolved.thicknessFrom}
            field="wallThicknessMm"
            overridden={resolved.overridden}
            onRevert={() => clearWallInstanceOverride(targetWall.id, 'wallThicknessMm')}
          />
          <ParamRow
            label={tr('Phân loại', 'Kind')}
            value={resolved.kind ? (WALL_KIND_OPTIONS.find((o) => o.value === resolved.kind)?.label ?? resolved.kind) : '—'}
            from={resolved.kindFrom}
            field="wallKind"
            overridden={resolved.overridden}
            onRevert={() => clearWallInstanceOverride(targetWall.id, 'wallKind')}
          />
          <ParamRow
            label={tr('Vật liệu', 'Material')}
            value={resolved.specId ?? '—'}
            from={resolved.specIdFrom}
            field="specId"
            overridden={resolved.overridden}
            onRevert={() => clearWallInstanceOverride(targetWall.id, 'specId')}
          />
          <p className="text-[10px] leading-relaxed text-[var(--t5)]">
            {tr(
              'Chấm tím = ô này đang bị tường ghi đè, không nghe theo Type.',
              'Purple dot = this field is overridden on the instance and ignores the Type.',
            )}
          </p>
        </div>
      )}
    </section>
  );
}

/**
 * Một dòng tham số. Có ghi đè hay không **do PHU trả lời** (`resolved.overridden` chứa tên field
 * hay không) — panel không tự luận. `from` chỉ dùng cho nhãn nguồn bên phải.
 */
function ParamRow({
  label,
  value,
  from,
  field,
  overridden,
  onRevert,
}: {
  label: string;
  value: string;
  from: 'instance' | 'type' | 'none';
  field: OverridableWallField;
  overridden: OverridableWallField[];
  onRevert: () => void;
}) {
  const tr = useT();
  const isOverridden = overridden.includes(field);
  return (
    <div className="flex items-center gap-1.5 rounded-[10px] border border-[var(--border)] bg-[var(--field)] px-2 py-1">
      <span className="flex-none text-[10.5px] leading-[1.6] text-[var(--t4)]">{label}</span>
      {isOverridden && <span className="h-[6px] w-[6px] flex-none rounded-full bg-[var(--accent)]" aria-hidden />}
      <span className="min-w-0 flex-1 truncate text-right text-[11px] leading-[1.6] text-[var(--t1)]">{value}</span>
      {isOverridden ? (
        <Tooltip side="right" label={tr('Trả về theo Type — xoá giá trị riêng của tường này', 'Revert to Type — clear this wall’s own value')}>
          <button
            type="button"
            onClick={onRevert}
            aria-label={tr('Trả về theo Type', 'Revert to Type')}
            className="grid h-[var(--tap)] w-[var(--tap)] flex-none place-items-center rounded-[6px] text-[var(--accent)] transition-colors hover:bg-[var(--hover)]"
          >
            <RotateCcw size={12} />
          </button>
        </Tooltip>
      ) : (
        <span className="w-[var(--tap)] flex-none text-center text-[9px] leading-[1.6] text-[var(--t5)]">
          {from === 'type' ? tr('Type', 'Type') : from === 'none' ? '—' : tr('riêng', 'own')}
        </span>
      )}
    </div>
  );
}
