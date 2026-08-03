'use client';

/**
 * components/render-studio/Command3DPanel.tsx — G3 phần (1) (`docs/TICKET-CHANG2-BUILD-2026-08-02.md`
 * "G3 Vẽ 3D: Command Panel + Scene Objects", `docs/SPEC-CHANG2-UI-2MODE.md:30-43`): sidebar 5 tab
 * kiểu 3ds Max cho mode "Vẽ 3D" — đúng bố cục đã duyệt qua `docs/mocks/mock-ve-3d.html`
 * ("✅ Vẽ 3D CHỐT qua mock", `docs/00-CHOT.md`).
 *
 * SKELETON có chủ đích (đúng tinh thần `Render3DModeSkeleton.tsx`): chỉ tab "Vật liệu" hoạt động
 * thật (tái dùng NGUỒN DỮ LIỆU matId thật đã xây ở G2 phần (5) qua `useMaterials` — KHÔNG viết
 * fetch riêng). 4 tab còn lại (Tạo/Sửa/Camera/Hiện) là placeholder rõ ràng, KHÔNG giả vờ hoạt
 * động — đúng luật "không nút giả". Click-to-assign vật liệu lên mặt 3D thật CHƯA làm (cần
 * raycast trong `Scene3DViewer`, việc riêng phần sau) — bấm swatch ở đây chỉ ĐẶT "đang chọn"
 * (state cục bộ), chưa gán đi đâu.
 */

import { useMemo, useState } from 'react';
import { Plus, Pencil, Palette, Camera, Eye, EyeOff, Square, Layers, ChevronDown, ChevronRight } from 'lucide-react';
import { useMaterials, type MaterialSpecLite } from '@/lib/render-studio/use-materials';
import MaterialSphere from '@/components/three/MaterialSphere';
import { darken, kindFromName, sceneForKind } from '@/components/three/material-preview';
import { openLibrarySheet } from '@/lib/library/use-library-sheet';
import type { SceneGroup } from '@/lib/three/cad-to-obj';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/utils';

/**
 * Tab do NƠI MOUNT giữ (mode Vẽ 3D cần mở thẳng tab Tạo khi bấm "Dựng khối đầu tiên").
 *
 * VIỆC 1 / A2 (`PHIEU-CODE-IF-DOT6` · `SPEC-DUNG-3D-THONG-NHAT` §1.3 M3, 05/08) — khoá đổi từ
 * tiếng Anh (`create/edit/material/camera/visibility`) sang tiếng Việt (`tao/sua/vatlieu/camera/
 * hien`) để khớp bản `components/three/CommandPanel.tsx` (đã xoá, xem BAO-CAO-G4) — đó là khoá
 * spec chọn làm chuẩn. Không có localStorage nào lưu tab (grep xác nhận trước khi đổi) nên KHÔNG
 * cần migrate dữ liệu cũ — đổi thẳng.
 */
export type Command3DTab = 'tao' | 'sua' | 'vatlieu' | 'camera' | 'hien';
type Tab = Command3DTab;

export interface Command3DPanelProps {
  tab: Tab;
  onTabChange: (tab: Tab) => void;
  /** nháy nút Tường sau khi người dùng bấm "Dựng khối đầu tiên" — chỉ dẫn ĐÚNG MỘT việc kế tiếp. */
  nhayNutTuong?: boolean;
  /** dựng tường mẫu (nơi mount ghi vào Doc qua engine `wallSegment`, panel không tự ghi). */
  onTaoTuong?: () => void;
  /** báo lên nơi mount là người dùng ĐÃ chọn vật liệu — mode dùng để đánh dấu bước ②. */
  onPickMaterial?: (id: string) => void;

  // ── VIỆC 2 (SPEC-DUNG-3D-THONG-NHAT §5+§6, 05/08) — cây đối tượng theo TẦNG + panel thuộc
  // tính. Tất cả optional: không truyền thì tab "Hiện" giữ nguyên placeholder cũ (không vỡ nơi
  // gọi cũ nào — hiện chỉ có Render3DModeSkeleton.tsx, nhưng props optional là kỷ luật chung).
  /** `scene.groups` thật (từ `docToObjScene`) — MỘT nguồn cho cả cây lẫn panel thuộc tính, không
   * giữ bản sao riêng (luật một nguồn). */
  groups?: SceneGroup[];
  /** tên group đang ẨN — Render3DModeSkeleton lọc `scene.groups` bằng tập này TRƯỚC khi đưa vào
   * Viewport3D, nên bấm ẩn ở đây là ẩn THẬT trong khung nhìn, không phải cờ trang trí. */
  hiddenNames?: Set<string>;
  onToggleHidden?: (name: string) => void;
  /** group đang chọn để xem thuộc tính (khác `activeMatId` — đó là vật liệu đang CẦM để gán).
   * Chỉ group có `entityId` (hiện = tường, xem cảnh báo tại `cad-to-obj.ts`) mới đẩy tiếp thành
   * `Viewport3D.selectedId` để hiện gizmo — group khác vẫn xem được thuộc tính, chỉ không có
   * gizmo 3D (trung thực: không giả vờ có tương tác chưa xây). */
  selectedGroupName?: string | null;
  onSelectGroup?: (name: string | null) => void;
  /** Gán tầng trệt hàng loạt cho MỌI entity đang thiếu `storey` (bucket "Chưa xếp tầng" cuối cây
   * tự đếm số từ chính `groups` — không truyền số riêng, tránh lệch số giữa nhãn bucket và nút,
   * xem SPEC §5.2 mục 2 "cấm im lặng bỏ qua"). */
  onAssignStorey?: () => void;
}

const TABS: { id: Tab; icon: typeof Plus; label: [string, string] }[] = [
  { id: 'tao', icon: Plus, label: ['Tạo', 'Create'] },
  { id: 'sua', icon: Pencil, label: ['Sửa', 'Edit'] },
  { id: 'vatlieu', icon: Palette, label: ['Vật liệu', 'Material'] },
  { id: 'camera', icon: Camera, label: ['Camera', 'Camera'] },
  { id: 'hien', icon: Eye, label: ['Hiện', 'Show'] },
];

export default function Command3DPanel({
  tab,
  onTabChange,
  nhayNutTuong = false,
  onTaoTuong,
  onPickMaterial,
  groups,
  hiddenNames,
  onToggleHidden,
  selectedGroupName = null,
  onSelectGroup,
  onAssignStorey,
}: Command3DPanelProps) {
  const setTab = onTabChange;
  const tr = useT();
  // NÂNG LÊN top-level: tab Vật liệu VÀ panel thuộc tính (tab Hiện) đều cần tra ProductSpec theo
  // id — gọi 1 lần ở đây, truyền xuống cả hai, tránh 2 lần fetch cùng `/api/specs?kind=material`
  // (bài học cũ: NodeLibraryPanel/Command3DPanel từng suýt copy-paste fetch này, xem đầu file).
  const materials = useMaterials(true);
  const hasTree = groups !== undefined;

  return (
    <div className="mat-panel flex h-full w-64 shrink-0 flex-col border-r border-[var(--border)]">
      <div className="flex border-b border-[var(--border)]">
        {TABS.map(({ id, icon: Icon, label }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                'flex flex-1 flex-col items-center gap-1 px-0.5 py-2 text-[10px] transition-colors',
                active ? 'font-semibold text-[var(--accent)] shadow-[inset_0_-2px_0_var(--accent)]' : 'text-[var(--t4)] hover:text-[var(--t2)]',
              )}
              title={tr(label[0], label[1])}
            >
              <Icon size={14} />
              {tr(label[0], label[1])}
            </button>
          );
        })}
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        {tab === 'vatlieu' && <MaterialTab materials={materials} onPick={onPickMaterial} />}
        {tab === 'tao' && <CreateTab nhayNutTuong={nhayNutTuong} onTaoTuong={onTaoTuong} />}
        {tab === 'hien' && hasTree && (
          <VisibilityTab
            groups={groups!}
            materials={materials}
            hiddenNames={hiddenNames ?? new Set()}
            onToggleHidden={onToggleHidden}
            selectedName={selectedGroupName}
            onSelectGroup={onSelectGroup}
            onAssignStorey={onAssignStorey}
          />
        )}
        {tab === 'hien' && !hasTree && <PlaceholderTab tab="hien" />}
        {tab !== 'vatlieu' && tab !== 'tao' && tab !== 'hien' && <PlaceholderTab tab={tab} />}
      </div>
    </div>
  );
}

/** Tab TẠO — trước đây là câu "sắp có" suông (Hoà: "rối rắm, không hệ thống"). Nay dựng được
 * TẠI CHỖ: nút Tường gọi engine `wallSegment()` của chặng Vẽ qua nơi mount. Các khối còn lại giữ
 * chỗ dạng disabled — thà nói thẳng "chưa dựng được" còn hơn nút bấm không ra gì. */
function CreateTab({ nhayNutTuong, onTaoTuong }: { nhayNutTuong: boolean; onTaoTuong?: () => void }) {
  const tr = useT();
  const CHUA_CO: [string, string][] = [
    ['Hộp', 'Box'], ['Sàn', 'Floor'], ['Cửa', 'Door'], ['Cửa sổ', 'Window'], ['Mái', 'Roof'],
  ];
  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={onTaoTuong}
        className={cn(
          'flex w-full items-center gap-2.5 rounded-[10px] border px-3 py-2.5 text-left transition-colors',
          nhayNutTuong
            ? 'animate-pulse border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]'
            : 'border-[var(--border)] bg-[var(--field)] text-[var(--t1)] hover:border-[var(--accent-ring)]',
        )}
      >
        <Square size={16} strokeWidth={1.7} />
        <span>
          <span className="block text-[11.5px] font-semibold">{tr('Tường', 'Wall')}</span>
          <span className="block text-[10px] text-[var(--t4)]">{tr('Đoạn 4m, dày 220 — sửa được sau', '4m segment, 220 thick — editable')}</span>
        </span>
      </button>

      <div className="grid grid-cols-2 gap-2">
        {CHUA_CO.map(([vi, en]) => (
          <button
            key={vi}
            type="button"
            disabled
            title={tr('Chưa dựng được — hiện dùng Tường hoặc đùn từ bản vẽ', 'Not available yet — use Wall or extrude from the drawing')}
            className="cursor-not-allowed rounded-[9px] border border-dashed border-[var(--border)] px-2 py-2 text-[10.5px] text-[var(--t5)]"
          >
            {tr(vi, en)}
          </button>
        ))}
      </div>
    </div>
  );
}

function MaterialTab({ materials, onPick }: { materials: MaterialSpecLite[]; onPick?: (id: string) => void }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const tr = useT();

  return (
    <div className="space-y-3">
      {/* Câu cũ ở đây kể chuyện nội bộ với người dùng ("chưa làm — việc riêng") — SPEC-NGON-NGU
          §1 cấm. Sự thật kỹ thuật giữ lại ở comment này: chọn mặt khối trong khung nhìn 3D
          (raycast) CHƯA làm, nên bấm swatch mới chỉ ĐẶT vật liệu đang cầm. */}
      <p className="px-0.5 text-[10.5px] leading-relaxed text-[var(--t4)]">
        {tr('Chọn vật liệu để cầm, rồi bấm lên mặt khối.', 'Pick a material, then click a face.')}
      </p>
      {/* MỘT thư viện chặng 2 (Hoà chốt 04/08): tab này chỉ là kệ nhanh — kho đầy đủ (1449 món
          ATLAS) nằm trong sheet Thư viện, mở đúng kệ vật liệu bằng cửa chung openLibrarySheet. */}
      <button
        type="button"
        onClick={() => openLibrarySheet({ shelfId: 'common-atlas' })}
        className="w-full rounded-[9px] border border-[var(--border)] bg-[var(--field)] px-2 py-1.5 text-[10.5px] font-medium text-[var(--t2)] transition-colors hover:border-[var(--accent-ring)] hover:text-[var(--accent)]"
      >
        {tr('Xem cả kho', 'Browse the full library')}
      </button>
      {materials.length === 0 && (
        <p className="px-1 text-center text-[11px] text-[var(--t5)]">{tr('Chưa có vật liệu trong ATLAS.', 'No materials in ATLAS yet.')}</p>
      )}
      <div className="grid grid-cols-3 gap-2">
        {materials.map((m) => {
          const active = selectedId === m.id;
          const swatchColor = m.colorHex && /^#?[0-9a-fA-F]{6}$/.test(m.colorHex) ? m.colorHex : 'var(--border-strong)';
          return (
            <button
              key={m.id}
              onClick={() => { setSelectedId(m.id); onPick?.(m.id); }}
              className={cn(
                'overflow-hidden rounded-[9px] border bg-[var(--field)] text-left transition-colors',
                active ? 'border-[var(--accent)]' : 'border-[var(--border)] hover:border-[var(--accent-ring)]',
              )}
              title={`${m.name}${m.sku ? ` · ${m.sku}` : ''}`}
            >
              {/* G4 (SPEC-VAT-LIEU-PBR-IF §2) — quả cầu render thật thay ô màu phẳng. ATLAS chưa
                  có cột PBR (việc PHU) → loại bề mặt suy từ TÊN, màu 2 tông từ colorHex; cảnh
                  Cầu/Sàn/Vải tự chọn theo loại. Fallback = ô màu cũ khi WebGL tắt. */}
              <MaterialSphere
                className="h-11 w-full"
                spec={{
                  id: m.id,
                  colorA: swatchColor.startsWith('#') ? swatchColor : '#9a9a9a',
                  colorB: darken(swatchColor.startsWith('#') ? swatchColor : '#9a9a9a'),
                  kind: kindFromName(m.name),
                  // Cùng MỘT kiểu xem trước cho mọi vật liệu — `sceneForKind` chỉ trả quả cầu.
                  scene: sceneForKind(kindFromName(m.name)),
                }}
                fallback={swatchColor}
                size={88}
                resolution={0.25}
              />
              <p className="truncate px-1.5 py-1 text-[9px] font-medium text-[var(--t2)]">{m.name}</p>
              {m.sku && <p className="truncate px-1.5 pb-1 text-[8px] text-[var(--accent)]">{m.sku}</p>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Loại group suy từ TIỀN TỐ tên (`docToObjScene()` đặt tên tất định: `Wall_i`/`Furn_i_id`/
 * `Window_i`/`Room_i`/`Floor`/`Ceiling` — xem `lib/three/cad-to-obj.ts`), không phải dữ liệu
 * khai báo riêng — đủ dùng vì tên đã tất định, không cần thêm field. */
type GroupKind = 'wall' | 'furniture' | 'window' | 'room' | 'floor' | 'ceiling' | 'other';

function kindOfGroup(name: string): GroupKind {
  if (name.startsWith('Wall_')) return 'wall';
  if (name.startsWith('Furn_')) return 'furniture';
  if (name.startsWith('Window_')) return 'window';
  if (name.startsWith('Room_')) return 'room';
  if (name === 'Floor') return 'floor';
  if (name === 'Ceiling') return 'ceiling';
  return 'other';
}

const KIND_LABEL_VI: Record<GroupKind, string> = {
  wall: 'Tường', furniture: 'Nội thất', window: 'Cửa sổ', room: 'Phòng', floor: 'Sàn', ceiling: 'Trần', other: 'Khối',
};
const KIND_LABEL_EN: Record<GroupKind, string> = {
  wall: 'Wall', furniture: 'Furniture', window: 'Window', room: 'Room', floor: 'Floor', ceiling: 'Ceiling', other: 'Block',
};
const KIND_DOT: Record<GroupKind, string> = {
  wall: 'var(--t3)', furniture: 'var(--success)', window: 'var(--accent)', room: 'var(--t5)',
  floor: 'var(--warning)', ceiling: 'var(--t5)', other: 'var(--t5)',
};

/** Nhãn hiển thị — số thứ tự đọc từ tên tất định (`Wall_2` → "Tường 2"); mock gốc dùng tên
 * PHÒNG THẬT (Tường Bắc/Tây) nhưng dữ liệu đó (`RoomEntity`, hướng tường) CHƯA có trong Doc
 * (SPEC-DUNG-3D-THONG-NHAT §11.2 câu treo) — số thứ tự là thứ DUY NHẤT có thật hôm nay, không bịa
 * hướng/tên phòng. */
function labelOfGroup(g: SceneGroup, tr: (vi: string, en: string) => string): string {
  const kind = kindOfGroup(g.name);
  const n = g.name.match(/_(\d+)/)?.[1] ?? '';
  if (kind === 'floor') return tr('Sàn', 'Floor');
  if (kind === 'ceiling') return tr('Trần', 'Ceiling');
  if (kind === 'furniture') {
    const blockId = g.name.split('_').slice(2).join('_');
    return `${tr('Nội thất', 'Furniture')} ${n}${blockId ? ` · ${blockId}` : ''}`;
  }
  return `${tr(KIND_LABEL_VI[kind], KIND_LABEL_EN[kind])} ${n}`.trim();
}

/**
 * TAB HIỆN — cây đối tượng theo TẦNG + panel thuộc tính (SPEC-DUNG-3D-THONG-NHAT §5+§6, VIỆC 2
 * PHIEU-CODE-IF-DOT6 05/08). Nguồn DUY NHẤT là `groups` (`scene.groups` thật, đã có `storey` từ
 * `docToObjScene()` — xem `cad-to-obj.ts`), không giữ bản sao.
 *
 * Ẩn/hiện là THẬT: `onToggleHidden` cập nhật tập tên ẩn ở nơi mount, nơi đó LỌC `scene.groups`
 * trước khi đưa vào `Viewport3D` — không phải cờ trang trí trên hàng cây.
 *
 * Chọn (bấm tên) khác chọn-để-gán-vật-liệu (tab Vật liệu). CHỈ group có `entityId` (hiện = tường,
 * xem cảnh báo tại `cad-to-obj.ts` về vì sao nội thất/cửa sổ chưa có) mới đẩy tiếp lên
 * `Viewport3D.selectedId` để hiện gizmo thật — group khác vẫn xem thuộc tính được, panel tự nói
 * rõ "chưa chọn được trong khung nhìn 3D", không giả vờ có tương tác chưa xây (luật không nút giả).
 */
function VisibilityTab({
  groups,
  materials,
  hiddenNames,
  onToggleHidden,
  selectedName,
  onSelectGroup,
  onAssignStorey,
}: {
  groups: SceneGroup[];
  materials: MaterialSpecLite[];
  hiddenNames: Set<string>;
  onToggleHidden?: (name: string) => void;
  selectedName: string | null;
  onSelectGroup?: (name: string | null) => void;
  onAssignStorey?: () => void;
}) {
  const tr = useT();
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const UNASSIGNED = '__unassigned';

  const { buckets, order } = useMemo(() => {
    const map = new Map<string, SceneGroup[]>();
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

  const selected = groups.find((g) => g.name === selectedName) ?? null;
  const selectedMat = selected?.specId ? materials.find((m) => m.id === selected.specId) : undefined;

  if (!groups.length) {
    return (
      <p className="px-1 text-center text-[11px] leading-relaxed text-[var(--t5)]">
        {tr('Chưa có khối nào trong cảnh.', 'No blocks in the scene yet.')}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        {order.map((storeyKey) => {
          const rows = buckets.get(storeyKey)!;
          const isUnassigned = storeyKey === UNASSIGNED;
          const isCollapsed = collapsed.has(storeyKey);
          return (
            <div key={storeyKey}>
              <button
                type="button"
                onClick={() => toggleCollapse(storeyKey)}
                className="flex w-full items-center gap-1.5 rounded-[8px] px-1 py-1 text-left transition-colors hover:bg-[var(--hover)]"
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
                        'flex items-center gap-1.5 rounded-[8px] py-1 pl-5 pr-1 transition-colors',
                        isSelected ? 'bg-[var(--accent-soft)]' : 'hover:bg-[var(--hover)]',
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => onSelectGroup?.(isSelected ? null : g.name)}
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
                        onClick={() => onToggleHidden?.(g.name)}
                        title={hidden ? tr('Hiện lại', 'Show') : tr('Ẩn', 'Hide')}
                        className="flex h-[20px] w-[20px] flex-none items-center justify-center rounded-[6px] text-[var(--t4)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--t1)]"
                      >
                        {hidden ? <EyeOff size={12} /> : <Eye size={12} />}
                      </button>
                    </div>
                  );
                })}

              {isUnassigned && !isCollapsed && rows.length > 0 && onAssignStorey && (
                <button
                  type="button"
                  onClick={onAssignStorey}
                  className="ml-5 mt-1 rounded-[8px] border border-dashed border-[var(--border)] px-2 py-1 text-[10px] font-medium text-[var(--t3)] transition-colors hover:border-[var(--accent-ring)] hover:text-[var(--accent)]"
                >
                  {tr(`Gán tầng trệt cho ${rows.length} khối`, `Assign ground floor to ${rows.length} blocks`)}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {selected && (
        <div className="space-y-2 rounded-[10px] border border-[var(--border)] bg-[var(--field)] p-2.5">
          <div className="flex items-center gap-2">
            <span className="h-[10px] w-[10px] flex-none rounded-[3px]" style={{ background: KIND_DOT[kindOfGroup(selected.name)] }} />
            <span className="flex-1 truncate text-[12px] font-semibold text-[var(--t1)]">{labelOfGroup(selected, tr)}</span>
            <span className="rounded-[5px] bg-[var(--mat-card)] px-1.5 py-[1px] text-[9px] font-bold uppercase text-[var(--t3)]">
              {tr(KIND_LABEL_VI[kindOfGroup(selected.name)], KIND_LABEL_EN[kindOfGroup(selected.name)])}
            </span>
          </div>

          {selected.heightMm !== undefined && (
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[var(--t4)]">{tr('Cao', 'Height')}</span>
              <span className="font-mono text-[var(--t1)]">{selected.heightMm.toLocaleString('vi-VN')} mm</span>
            </div>
          )}
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[var(--t4)]">{tr('Tầng', 'Storey')}</span>
            <span className="text-[var(--t1)]">{selected.storey ?? tr('Chưa xếp', 'Unassigned')}</span>
          </div>

          <div className="flex items-center gap-2 border-t border-[var(--mat-hairline)] pt-2">
            {selectedMat ? (
              <MaterialSphere
                className="h-9 w-9 flex-none rounded-full"
                spec={{
                  id: selectedMat.id,
                  colorA: selectedMat.colorHex ?? '#9a9a9a',
                  colorB: darken(selectedMat.colorHex ?? '#9a9a9a'),
                  kind: kindFromName(selectedMat.name),
                  scene: sceneForKind(kindFromName(selectedMat.name)),
                }}
                fallback={selectedMat.colorHex ?? '#9a9a9a'}
                size={36}
                resolution={0.25}
              />
            ) : (
              <span className="h-9 w-9 flex-none rounded-full border border-dashed border-[var(--border-strong)]" />
            )}
            <span className="min-w-0 flex-1 truncate text-[11px] text-[var(--t3)]">
              {selectedMat ? selectedMat.name : tr('Chưa gán vật liệu', 'No material assigned')}
            </span>
          </div>

          {/* Trung thực (luật §0): chỉ tường có entityId hôm nay → chỉ tường có gizmo thật trong
              khung nhìn khi chọn ở đây (xem cảnh báo tại cad-to-obj.ts vì sao nội thất/cửa sổ
              chưa nối). Không giấu giới hạn này. */}
          <p className="text-[10px] leading-relaxed text-[var(--t5)]">
            {kindOfGroup(selected.name) === 'wall'
              ? tr('Đã chọn trong khung nhìn 3D (gizmo).', 'Selected in the 3D view (gizmo).')
              : tr('Chưa chọn được trong khung nhìn 3D — chỉ xem thuộc tính.', 'Not selectable in the 3D view yet — properties only.')}
          </p>
        </div>
      )}
    </div>
  );
}

type PlaceholderKey = Exclude<Tab, 'vatlieu' | 'tao'>;

// Camera GIỮ placeholder (không bịa ô nhập số vô chủ — spec §6.2 cần model camera thật trong Doc
// trước, hôm nay chưa có; input "sống nhưng không lưu gì" tệ hơn câu "sắp có" trung thực).
const PLACEHOLDER_COPY: Record<PlaceholderKey, [string, string]> = {
  sua: ['Đẩy-kéo cao độ đã dùng được ngay trên khối (kéo mặt trên). Bevel/kích thước tay — sắp có.', 'Push-pull height already works on the block (drag the top face). Bevel/manual sizing — coming soon.'],
  camera: ['Đặt camera · đường cam (campath) — sắp có.', 'Place camera · camera path — coming soon.'],
  hien: ['Ẩn/hiện theo lớp · xem theo tầng — sắp có.', 'Show/hide by layer · view by floor — coming soon.'],
};

function PlaceholderTab({ tab }: { tab: PlaceholderKey }) {
  const tr = useT();
  const [vi, en] = PLACEHOLDER_COPY[tab];
  return (
    <div className="rounded-[10px] border border-dashed border-[var(--border)] px-2.5 py-3 text-center text-[11px] leading-relaxed text-[var(--t4)]">
      {tr(vi, en)}
    </div>
  );
}
