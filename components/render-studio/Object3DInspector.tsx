'use client';

/**
 * components/render-studio/Object3DInspector.tsx — PANEL THUỘC TÍNH theo LOẠI VẬT THỂ, ổ ④
 * Inspector của `AppShell` cho mode '3d/3d'. Port `docs/mocks/mock-3d-thong-nhat.html` (cột phải
 * "Kích thước"/"Vật liệu"/"Vị trí", chỉ hiện khi có chọn — `sc-if coChon`).
 *
 * Tách khỏi `Command3DPanel.tsx` cùng đợt với `Object3DTree.tsx` (VIỆC "MỘT THƯ VIỆN") — trước đó
 * khối "đang chọn" này nằm LẪN trong tab "Hiện" ngay dưới cây, nay đứng RIÊNG ở ổ Inspector đúng
 * vị trí mock (cột phải), và AppShell tự ẩn hẳn khung khi không có gì chọn (không phải CSS-ẩn).
 *
 * Chỉ nên mount khi `selectedName` có giá trị (nơi gọi kiểm tra trước khi truyền vào `inspector`
 * của `AppShell`) — component tự trả `null` thêm một lớp phòng thủ nếu gọi nhầm lúc chưa chọn.
 */
import { darken, kindFromName, sceneForKind } from '@/components/three/material-preview';
import MaterialSphere from '@/components/three/MaterialSphere';
import { useMaterials } from '@/lib/render-studio/use-materials';
import { useScene3D } from '@/lib/render-studio/use-scene3d';
import { useTree3DUi } from '@/lib/render-studio/tree3d-ui';
import { kindOfGroup, labelOfGroup, KIND_LABEL_VI, KIND_LABEL_EN, KIND_DOT } from '@/lib/render-studio/group-kind';
import { openLibrarySheet } from '@/lib/library/use-library-sheet';
import { useT } from '@/lib/i18n';

export function Object3DInspector() {
  const tr = useT();
  const scene = useScene3D();
  const selectedName = useTree3DUi((s) => s.selectedName);
  const materials = useMaterials(true);
  const selected = scene?.groups.find((g) => g.name === selectedName) ?? null;

  if (!selected) return null;

  const kind = kindOfGroup(selected.name);
  const selectedMat = selected.specId ? materials.find((m) => m.id === selected.specId) : undefined;

  return (
    <div className="space-y-3 p-2.5">
      <div className="flex items-center gap-2">
        <span className="h-[10px] w-[10px] flex-none rounded-[3px]" style={{ background: KIND_DOT[kind] }} />
        <span className="flex-1 truncate text-[13px] font-semibold text-[var(--t1)]">{labelOfGroup(selected, tr)}</span>
        <span className="rounded-[5px] bg-[var(--mat-card)] px-1.5 py-[1px] text-[9px] font-bold uppercase text-[var(--t3)]">
          {tr(KIND_LABEL_VI[kind], KIND_LABEL_EN[kind])}
        </span>
      </div>

      {selected.heightMm !== undefined && (
        <div className="flex items-center justify-between rounded-[10px] border border-[var(--border)] bg-[var(--field)] px-2.5 py-2 text-[11px]">
          <span className="text-[var(--t4)]">{tr('Cao', 'Height')}</span>
          <span className="font-mono text-[var(--t1)]">{selected.heightMm.toLocaleString('vi-VN')} mm</span>
        </div>
      )}
      <div className="flex items-center justify-between rounded-[10px] border border-[var(--border)] bg-[var(--field)] px-2.5 py-2 text-[11px]">
        <span className="text-[var(--t4)]">{tr('Tầng', 'Storey')}</span>
        <span className="text-[var(--t1)]">{selected.storey ?? tr('Chưa xếp', 'Unassigned')}</span>
      </div>

      <div className="space-y-2 border-t border-[var(--mat-hairline)] pt-3">
        <span className="text-[10.5px] font-bold uppercase tracking-wide text-[var(--t4)]">{tr('Vật liệu', 'Material')}</span>
        <div className="flex items-center gap-2.5">
          {selectedMat ? (
            <MaterialSphere
              className="h-11 w-11 flex-none rounded-full"
              spec={{
                id: selectedMat.id,
                colorA: selectedMat.colorHex ?? '#9a9a9a',
                colorB: darken(selectedMat.colorHex ?? '#9a9a9a'),
                kind: kindFromName(selectedMat.name),
                scene: sceneForKind(kindFromName(selectedMat.name)),
              }}
              fallback={selectedMat.colorHex ?? '#9a9a9a'}
              size={44}
              resolution={0.25}
            />
          ) : (
            <span className="h-11 w-11 flex-none rounded-full border border-dashed border-[var(--border-strong)]" />
          )}
          <span className="min-w-0 flex-1 truncate text-[11.5px] text-[var(--t3)]">
            {selectedMat ? selectedMat.name : tr('Chưa gán vật liệu', 'No material assigned')}
          </span>
        </div>
        <button
          type="button"
          onClick={() => openLibrarySheet({ shelfId: 'common-atlas' })}
          className="w-full rounded-[10px] border border-[var(--border)] bg-[var(--field)] px-2 py-1.5 text-[11px] font-semibold text-[var(--t1)] transition-colors hover:bg-[var(--hover)]"
        >
          {tr('Đổi vật liệu', 'Change material')}
        </button>
      </div>

      {/* Trung thực (luật §0): chỉ tường có entityId hôm nay → chỉ tường có gizmo thật trong
          khung nhìn khi chọn ở đây (xem cảnh báo tại cad-to-obj.ts vì sao nội thất/cửa sổ chưa
          nối). Không giấu giới hạn này. */}
      <p className="border-t border-[var(--mat-hairline)] pt-2.5 text-[10px] leading-relaxed text-[var(--t5)]">
        {kind === 'wall'
          ? tr('Đã chọn trong khung nhìn 3D (gizmo).', 'Selected in the 3D view (gizmo).')
          : tr('Chưa chọn được trong khung nhìn 3D — chỉ xem thuộc tính.', 'Not selectable in the 3D view yet — properties only.')}
      </p>
    </div>
  );
}
