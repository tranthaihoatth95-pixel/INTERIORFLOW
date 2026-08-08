'use client';

/**
 * app/tasks/page.tsx — màn "Bảng việc", đứng ngang hàng `/materials` (bọc `<AppShell>` cùng
 * cách — khuôn theo `app/materials/page.tsx`). Client ĐẦU TIÊN tiêu thụ `app/api/tasks/*`
 * (nền `Task`/`WorkflowState` đã migrate từ p12 nhưng chưa ai gọi tới, xem
 * `docs/DOI-CHIEU-42-SPEC-2026-08-08.md §1#4`). Lối vào thật: `app/settings/_components/
 * PixelSettingsShell.tsx` nhóm "Nâng cao" → nút "Mở bảng việc".
 */
import { AppShell } from '@/components/studio/AppShell';
import { TasksNavigator } from '@/components/tasks/TasksNavigator';
import { TaskBoardScreen } from '@/components/tasks/TaskBoardScreen';
import { useT } from '@/lib/i18n';

export default function TasksPage() {
  const tr = useT();
  return (
    <AppShell
      active="render"
      navigator={<TasksNavigator />}
      navigatorAddLabel={tr('Bảng việc', 'Task board')}
      navigatorCollapsedLabel={tr('Việc', 'Tasks')}
    >
      <div className="min-h-0 flex-1 overflow-y-auto">
        <TaskBoardScreen />
      </div>
    </AppShell>
  );
}
