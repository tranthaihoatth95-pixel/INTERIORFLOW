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
import { useCadStore } from '@/lib/cad/store';
import { sortedLevels } from '@/lib/cad/levels';
import { entityBox } from '@/lib/cad/model';
import { assignLevelToEntities } from './doc-catalog';
import { formatThousands } from './scene3d-ui';
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
    // mock `.iscroll`/`.grp` dùng padding 11-12px quanh nội dung — nâng p-2.5(10px)→p-3(12px).
    <div className="space-y-3 p-3">
      {/* mock `.ihead`: viền dưới mat-hairline tách tên/mã khỏi phần thân cuộn — trước không có. */}
      <div className="flex items-center gap-2 border-b border-[var(--nen-mo-hairline)] pb-2.5">
        <span className="h-[10px] w-[10px] flex-none rounded-[3px]" style={{ background: KIND_DOT[kind] }} />
        <span className="flex-1 truncate text-[13px] font-semibold text-[var(--t1)]">{labelOfGroup(selected, tr)}</span>
        <span className="rounded-[6px] bg-[var(--nen-mo-card)] px-1.5 py-[1px] text-[9px] font-bold uppercase text-[var(--t3)]">
          {tr(KIND_LABEL_VI[kind], KIND_LABEL_EN[kind])}
        </span>
      </div>

      {selected.heightMm !== undefined && (
        <div className="flex items-center justify-between rounded-[10px] border border-[var(--border)] bg-[var(--field)] px-2.5 py-2 text-[11px]">
          <span className="text-[var(--t4)]">{tr('Cao', 'Height')}</span>
          <span className="font-mono text-[var(--t1)]">{selected.heightMm.toLocaleString('vi-VN')} mm</span>
        </div>
      )}
      <LevelRow storey={selected.storey} entityId={selected.entityId} />

      <div className="space-y-2 border-t border-[var(--nen-mo-hairline)] pt-3">
        {/* mock `.grp h4`: 11px (fs-2xs), letter-spacing .07em — trước 10.5px/tracking-wide(.025em) */}
        <span className="text-[11px] font-bold uppercase tracking-[0.07em] text-[var(--t4)]">{tr('Vật liệu', 'Material')}</span>
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

      {kind === 'wall' && selected.entityId && (
        <div className="space-y-2">
          <CutHoleAction wallId={selected.entityId} />
          <BevelAction wallId={selected.entityId} />
          <ArrayAction wallId={selected.entityId} />
        </div>
      )}

      {/* Trung thực (luật §0): chỉ tường có entityId hôm nay → chỉ tường có gizmo thật trong
          khung nhìn khi chọn ở đây (xem cảnh báo tại cad-to-obj.ts vì sao nội thất/cửa sổ chưa
          nối). Không giấu giới hạn này. */}
      <p className="border-t border-[var(--nen-mo-hairline)] pt-2.5 text-[10px] leading-relaxed text-[var(--t5)]">
        {kind === 'wall'
          ? tr('Đã chọn trong khung nhìn 3D (gizmo).', 'Selected in the 3D view (gizmo).')
          : tr('Chưa chọn được trong khung nhìn 3D — chỉ xem thuộc tính.', 'Not selectable in the 3D view yet — properties only.')}
      </p>
    </div>
  );
}

/**
 * VIỆC 1 (05/08) — dòng "Tầng" nâng từ CHỮ CHẾT thành ô GÁN ĐƯỢC, ngay tại chỗ người dùng đang
 * nhìn thuộc tính (khỏi phải sang Navigator). Chỉ đổi được khi khối truy được về một entity gốc
 * (`entityId`) — nội thất/cửa sổ hôm nay chưa mang entityId xuống group (`cad-to-obj.ts:148`), ca
 * đó giữ nguyên chữ đọc-thôi + nói rõ vì sao, không hiện ô select giả bấm không ăn.
 */
function LevelRow({ storey, entityId }: { storey?: string; entityId?: string }) {
  const tr = useT();
  const doc = useCadStore((s) => s.doc);
  const levels = sortedLevels(doc);
  const entity = entityId ? doc.entities.find((e) => e.id === entityId) : undefined;

  if (!entity || levels.length === 0) {
    return (
      <div className="flex items-center justify-between rounded-[10px] border border-[var(--border)] bg-[var(--field)] px-2.5 py-2 text-[11px] leading-[1.6]">
        <span className="text-[var(--t4)]">{tr('Tầng', 'Level')}</span>
        <span className="text-[var(--t1)]">{storey ?? tr('Chưa xếp', 'Unassigned')}</span>
      </div>
    );
  }

  return (
    <label className="block rounded-[10px] border border-[var(--border)] bg-[var(--field)] px-2.5 py-1.5">
      <span className="text-[9px] font-bold uppercase leading-[1.6] tracking-wide text-[var(--t4)]">{tr('Tầng', 'Level')}</span>
      <select
        value={entity.levelId ?? ''}
        onChange={(e) => {
          const level = levels.find((l) => l.id === e.target.value);
          if (level) assignLevelToEntities([entity.id], level);
        }}
        className="mt-0.5 h-[var(--tap)] w-full rounded-[10px] border border-[var(--border)] bg-[var(--panel)] px-1.5 text-[11px] leading-[1.6] text-[var(--t1)] focus:border-[var(--accent-ring)] focus:outline-none"
      >
        <option value="">{storey ? tr(`— nhãn "${storey}", chưa gắn tầng —`, `— label "${storey}", no level —`) : tr('— chưa xếp tầng —', '— unassigned —')}</option>
        {levels.map((l) => (
          <option key={l.id} value={l.id}>
            {l.name} · {formatThousands(l.elevationMm)} mm{l.inferred ? tr(' (suy đoán)', ' (inferred)') : ''}
          </option>
        ))}
      </select>
    </label>
  );
}

/**
 * NC-12 VIỆC 3 — nút THẬT (không phải placeholder) khoét 1 hốc mẫu vào tường đang chọn, ghi
 * `{op:'boolean', kind:'subtract'}` lên `ops` của tường (`useCadStore.cutHoleInWall`, bọc
 * `lib/cad/commands.ts` `cutHoleInWall` thuần). Kích thước/vị trí hốc là MẶC ĐỊNH tính từ bbox
 * tường (xuyên hết bề dày, dài 600mm hoặc nửa chiều dài tường, cao 1200mm từ sàn) — SỬA ĐƯỢC sau
 * bằng cách sửa CHÍNH cutter (1 `RectEntity` bình thường) qua công cụ 2D CAD sẵn có, đúng nghiệm
 * thu VIỆC 3 ("sửa được kích thước hốc"). Chưa có UI kéo-thả định vị hốc trong khung nhìn 3D —
 * ghi rõ (N5), việc đó để dành đợt sau khi có pick-2-object thật trong `Scene3DViewer.tsx`.
 */
function CutHoleAction({ wallId }: { wallId: string }) {
  const tr = useT();
  const cutHoleInWall = useCadStore((s) => s.cutHoleInWall);
  const wall = useCadStore((s) => s.doc.entities.find((e) => e.id === wallId));
  if (!wall) return null;

  const handleCut = () => {
    const box = entityBox(wall);
    const spanX = box.maxX - box.minX;
    const spanY = box.maxY - box.minY;
    const cx = (box.minX + box.maxX) / 2;
    const cy = (box.minY + box.maxY) / 2;
    const thinIsX = spanX <= spanY; // tường mỏng theo trục X ⇒ chạy dọc theo Y
    const along = Math.min(600, (thinIsX ? spanY : spanX) * 0.5) || 400;
    const w = thinIsX ? spanX + 40 : along; // +40mm mỗi bên: xuyên thủng hết bề dày, không sót vách mỏng
    const h = thinIsX ? along : spanY + 40;
    cutHoleInWall(wallId, { x: cx - w / 2, y: cy - h / 2, w, h, heightMm: 1200 }, 'subtract');
  };

  return (
    <button
      type="button"
      onClick={handleCut}
      className="w-full rounded-[10px] border border-[var(--border)] bg-[var(--field)] px-2 py-1.5 text-[11px] font-semibold text-[var(--t1)] transition-colors hover:bg-[var(--hover)]"
    >
      {tr('Khoét hốc (mẫu 600×1200mm)', 'Cut a recess (sample 600×1200mm)')}
    </button>
  );
}

const BEVEL_PRESET_MM = 30;

/**
 * VIỆC 1 (nối `extrude` thật, `docs/SPEC-DUNG-BO-LENH-3D.md` tầng ③) — nút THẬT tiếp theo
 * `CutHoleAction`: vát cạnh TRÊN tường đang chọn (`useCadStore.setEntityBevel`, bọc `lib/cad/
 * commands.ts` `setEntityBevel` thuần → `lib/three/cad-to-obj.ts` `ObjBuilder.prismBeveled` đọc
 * lại lúc render). Cùng khuôn `CutHoleAction`: preset CỐ ĐỊNH (chưa có thanh trượt nhập tay — N5,
 * để dành đợt sau), bấm lại để TẮT (xoá bậc `extrude`) thay vì chồng nút riêng.
 */
function BevelAction({ wallId }: { wallId: string }) {
  const tr = useT();
  const setEntityBevel = useCadStore((s) => s.setEntityBevel);
  const wall = useCadStore((s) => s.doc.entities.find((e) => e.id === wallId));
  if (!wall) return null;
  const current = wall.ops?.find((op) => op.op === 'extrude')?.bevel ?? 0;
  const applied = current > 0;

  return (
    <button
      type="button"
      onClick={() => setEntityBevel(wallId, applied ? 0 : BEVEL_PRESET_MM)}
      className="w-full rounded-[10px] border border-[var(--border)] bg-[var(--field)] px-2 py-1.5 text-[11px] font-semibold text-[var(--t1)] transition-colors hover:bg-[var(--hover)]"
    >
      {applied
        ? tr(`Bỏ vát cạnh (đang ${current}mm)`, `Remove bevel (currently ${current}mm)`)
        : tr(`Vát cạnh trên (mẫu ${BEVEL_PRESET_MM}mm)`, `Bevel top edge (sample ${BEVEL_PRESET_MM}mm)`)}
    </button>
  );
}

const ARRAY_PRESET_N = 5;
const ARRAY_PRESET_SPACING_MM = 300;

/**
 * VIỆC 1 (nối `arrayLinear` thật) — nút THẬT nhân bản dãy tường đang chọn dọc trục DÀI của chính
 * nó (`useCadStore.setEntityArrayLinear` → `lib/three/build-ops.ts` `resolveGroupGeometry` nối
 * hình học lúc render, KHÔNG ghi N entity rời vào Doc — xem docstring `Base.ops`). Cùng khuôn
 * `BevelAction`: preset cố định, bấm lại để TẮT.
 */
function ArrayAction({ wallId }: { wallId: string }) {
  const tr = useT();
  const setEntityArrayLinear = useCadStore((s) => s.setEntityArrayLinear);
  const wall = useCadStore((s) => s.doc.entities.find((e) => e.id === wallId));
  if (!wall) return null;
  const currentN = wall.ops?.find((op) => op.op === 'arrayLinear')?.n ?? 1;
  const applied = currentN > 1;

  const handleClick = () => {
    if (applied) {
      setEntityArrayLinear(wallId, { n: 1, dx: 0, dy: 0, dz: 0 });
      return;
    }
    const box = entityBox(wall);
    const alongX = box.maxX - box.minX >= box.maxY - box.minY; // dãy chạy theo trục DÀI của tường
    setEntityArrayLinear(wallId, {
      n: ARRAY_PRESET_N,
      dx: alongX ? ARRAY_PRESET_SPACING_MM : 0,
      dy: alongX ? 0 : ARRAY_PRESET_SPACING_MM,
      dz: 0,
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="w-full rounded-[10px] border border-[var(--border)] bg-[var(--field)] px-2 py-1.5 text-[11px] font-semibold text-[var(--t1)] transition-colors hover:bg-[var(--hover)]"
    >
      {applied
        ? tr(`Bỏ nhân bản dãy (đang ${currentN} bản)`, `Remove linear array (currently ${currentN})`)
        : tr(`Nhân bản dãy (mẫu ${ARRAY_PRESET_N}×${ARRAY_PRESET_SPACING_MM}mm)`, `Linear array (sample ${ARRAY_PRESET_N}×${ARRAY_PRESET_SPACING_MM}mm)`)}
    </button>
  );
}
