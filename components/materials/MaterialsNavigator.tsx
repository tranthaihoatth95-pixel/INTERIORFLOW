'use client';

/**
 * components/materials/MaterialsNavigator.tsx — ổ ② Navigator tối thiểu cho `/materials`
 * (cùng vai trò `SettingsNavigator` ở `/settings`). Kho vật liệu không có "nhóm" để nhảy neo như
 * Settings — chỉ 1 nhãn tĩnh, giữ đúng shape `AppShell` cần (`navigator: ReactNode`).
 */
import { Boxes } from 'lucide-react';
import { useT } from '@/lib/i18n';

export function MaterialsNavigator() {
  const tr = useT();
  return (
    <div className="px-1.5 py-1">
      <div className="flex h-[30px] w-full items-center gap-2.5 rounded-[10px] px-2 text-[12.5px] text-[var(--t1)]">
        <Boxes size={14} strokeWidth={1.5} className="shrink-0 text-[var(--t4)]" />
        {tr('Kho vật liệu', 'Materials warehouse')}
      </div>
    </div>
  );
}
