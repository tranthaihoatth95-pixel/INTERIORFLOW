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

import { useState } from 'react';
import { Plus, Pencil, Palette, Camera, Eye, Square } from 'lucide-react';
import { useMaterials } from '@/lib/render-studio/use-materials';
import MaterialSphere from '@/components/three/MaterialSphere';
import { darken, kindFromName, sceneForKind } from '@/components/three/material-preview';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/utils';

/** Tab do NƠI MOUNT giữ (mode Vẽ 3D cần mở thẳng tab Tạo khi bấm "Dựng khối đầu tiên"). */
export type Command3DTab = 'create' | 'edit' | 'material' | 'camera' | 'visibility';
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
}

const TABS: { id: Tab; icon: typeof Plus; label: [string, string] }[] = [
  { id: 'create', icon: Plus, label: ['Tạo', 'Create'] },
  { id: 'edit', icon: Pencil, label: ['Sửa', 'Edit'] },
  { id: 'material', icon: Palette, label: ['Vật liệu', 'Material'] },
  { id: 'camera', icon: Camera, label: ['Camera', 'Camera'] },
  { id: 'visibility', icon: Eye, label: ['Hiện', 'Show'] },
];

export default function Command3DPanel({ tab, onTabChange, nhayNutTuong = false, onTaoTuong, onPickMaterial }: Command3DPanelProps) {
  const setTab = onTabChange;
  const tr = useT();

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
        {tab === 'material' && <MaterialTab onPick={onPickMaterial} />}
        {tab === 'create' && <CreateTab nhayNutTuong={nhayNutTuong} onTaoTuong={onTaoTuong} />}
        {tab !== 'material' && tab !== 'create' && <PlaceholderTab tab={tab} />}
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

function MaterialTab({ onPick }: { onPick?: (id: string) => void }) {
  const materials = useMaterials(true);
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
                  // MỌI vật liệu cùng MỘT kiểu xem trước (Hoà 04/08): trước đây đoán theo tên
                  // ("Sàn gỗ sồi" → cảnh Sàn phẳng, "Đá travertine" → quả cầu) nên hàng swatch
                  // lổn nhổn hai kiểu, không đọc được là cùng một danh mục. Cảnh Sàn/Vải vẫn còn
                  // trong `material-preview.ts` cho panel chi tiết chọn TAY sau này.
                  scene: 'sphere',
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

const PLACEHOLDER_COPY: Record<Exclude<Tab, 'material'>, [string, string]> = {
  create: ['Tạo khối hộp · mặt · cửa/cửa sổ — sắp có.', 'Create box · plane · door/window — coming soon.'],
  edit: ['Đẩy-kéo cao độ đã dùng được ngay trên khối (kéo mặt trên). Bevel/kích thước tay — sắp có.', 'Push-pull height already works on the block (drag the top face). Bevel/manual sizing — coming soon.'],
  camera: ['Đặt camera · đường cam (campath) — sắp có.', 'Place camera · camera path — coming soon.'],
  visibility: ['Ẩn/hiện theo lớp · xem theo tầng — sắp có.', 'Show/hide by layer · view by floor — coming soon.'],
};

function PlaceholderTab({ tab }: { tab: Exclude<Tab, 'material'> }) {
  const tr = useT();
  const [vi, en] = PLACEHOLDER_COPY[tab];
  return (
    <div className="rounded-[10px] border border-dashed border-[var(--border)] px-2.5 py-3 text-center text-[11px] leading-relaxed text-[var(--t4)]">
      {tr(vi, en)}
    </div>
  );
}
