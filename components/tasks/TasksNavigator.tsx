'use client';

/**
 * components/tasks/TasksNavigator.tsx — ổ ② Navigator tối thiểu cho `/tasks` (cùng vai trò
 * `MaterialsNavigator` ở `/materials`). Bảng việc không có "nhóm" để nhảy neo — chỉ 1 nhãn
 * tĩnh, giữ đúng shape `AppShell` cần (`navigator: ReactNode`).
 */
import { ClipboardList } from 'lucide-react';
import { useT } from '@/lib/i18n';

export function TasksNavigator() {
  const tr = useT();
  return (
    <div className="px-1.5 py-1">
      <div className="flex h-[30px] w-full items-center gap-2.5 rounded-[10px] px-2 text-[12.5px] text-[var(--t1)]">
        <ClipboardList size={14} strokeWidth={1.5} className="shrink-0 text-[var(--t4)]" />
        {tr('Bảng việc', 'Task board')}
      </div>
    </div>
  );
}
