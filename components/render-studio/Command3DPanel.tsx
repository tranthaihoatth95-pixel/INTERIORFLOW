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
import { Plus, Pencil, Palette, Camera, Eye } from 'lucide-react';
import { useMaterials } from '@/lib/render-studio/use-materials';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/utils';

type Tab = 'create' | 'edit' | 'material' | 'camera' | 'visibility';

const TABS: { id: Tab; icon: typeof Plus; label: [string, string] }[] = [
  { id: 'create', icon: Plus, label: ['Tạo', 'Create'] },
  { id: 'edit', icon: Pencil, label: ['Sửa', 'Edit'] },
  { id: 'material', icon: Palette, label: ['Vật liệu', 'Material'] },
  { id: 'camera', icon: Camera, label: ['Camera', 'Camera'] },
  { id: 'visibility', icon: Eye, label: ['Hiện', 'Show'] },
];

export default function Command3DPanel() {
  const [tab, setTab] = useState<Tab>('material');
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
        {tab === 'material' ? <MaterialTab /> : <PlaceholderTab tab={tab} />}
      </div>
    </div>
  );
}

function MaterialTab() {
  const materials = useMaterials(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const tr = useT();

  return (
    <div className="space-y-3">
      <div className="rounded-[10px] border border-dashed border-[var(--border)] px-2.5 py-2 text-[10.5px] leading-relaxed text-[var(--t4)]">
        {tr('Chọn vật liệu → gán lên mặt khối (chưa làm — cần chọn mặt trong khung nhìn 3D, việc riêng).', 'Pick a material → assign to a face (not built yet — needs face-picking in the 3D view, separate work).')}
      </div>
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
              onClick={() => setSelectedId(m.id)}
              className={cn(
                'overflow-hidden rounded-[9px] border bg-[var(--field)] text-left transition-colors',
                active ? 'border-[var(--accent)]' : 'border-[var(--border)] hover:border-[var(--accent-ring)]',
              )}
              title={`${m.name}${m.sku ? ` · ${m.sku}` : ''}`}
            >
              <div className="h-11 w-full" style={{ background: swatchColor }} />
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
