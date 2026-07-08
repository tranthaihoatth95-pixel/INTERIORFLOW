'use client';

/**
 * components/form/FormSurface.tsx — bề mặt Form mode (thay canvas node trên điện thoại/foldable).
 *
 * 3 tab = 3 chặng pipeline (Concept · Render · Present), mỗi tab là form dọc, tap-target lớn,
 * KHÔNG kéo-thả. Chạy trên CÙNG engine với node (job API, gu, gallery, slides).
 * Mount thay <FlowCanvas/> trong app/page.tsx khi uiMode==='form'.
 */

import { useEffect, useState } from 'react';
import { Palette, Box, Presentation } from 'lucide-react';
import { useFlowStore } from '@/lib/store';
import { RenderForm } from './RenderForm';
import { ConceptForm } from './ConceptForm';
import { PresentForm } from './PresentForm';

type FormTab = 'concept' | 'render' | 'present';

const TABS: { id: FormTab; label: string; Icon: typeof Palette }[] = [
  { id: 'concept', label: 'Concept', Icon: Palette },
  { id: 'render', label: 'Render', Icon: Box },
  { id: 'present', label: 'Present', Icon: Presentation },
];

// Chặng workspace ↔ tab form (đồng bộ với PhaseSwitcher ở Header).
function phaseToTab(p: string | null): FormTab {
  return p === 'concept' || p === 'render' || p === 'present' ? p : 'render';
}

export function FormSurface() {
  const workspace = useFlowStore((s) => s.workspace);
  // Mặc định mở đúng chặng đang chọn ở Header; Render là ưu tiên nếu chưa chọn.
  const [tab, setTab] = useState<FormTab>('render');

  // đồng bộ 1 chiều: đổi chặng ở Header → đổi tab (chỉ khi workspace hợp lệ)
  useEffect(() => {
    if (workspace) setTab(phaseToTab(workspace));
  }, [workspace]);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[var(--bg)]">
      {/* Tab bar — sticky trên cùng vùng form, tap-target lớn */}
      <div className="shrink-0 border-b border-[var(--border)] bg-[var(--panel)] px-2 pt-2">
        <div className="mx-auto flex max-w-[720px] gap-1 lg:max-w-[1120px]">
          {TABS.map(({ id, label, Icon }) => {
            const active = tab === id;
            return (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex min-h-[48px] flex-1 flex-col items-center justify-center gap-0.5 rounded-t-[12px] border-b-2 text-[12px] font-medium transition-colors ${
                  active
                    ? 'border-[var(--accent)] text-[var(--accent)]'
                    : 'border-transparent text-[var(--t4)] hover:text-[var(--t2)]'
                }`}
              >
                <Icon size={18} />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Nội dung form — cuộn dọc, không cuộn ngang, chừa đáy cho ngón tay */}
      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
        <div className="mx-auto max-w-[720px] px-3 pb-24 pt-3 lg:max-w-[1120px] lg:px-6">
          {tab === 'concept' && <ConceptForm />}
          {tab === 'render' && <RenderForm />}
          {tab === 'present' && <PresentForm />}
        </div>
      </div>
    </div>
  );
}
