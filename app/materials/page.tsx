'use client';

/**
 * app/materials/page.tsx — VIỆC 3/4 (`docs/PHIEU-CODE-IF-KHO-VAT-LIEU-V1.md`): màn quản lý kho
 * vật liệu, đứng ngang hàng `/settings` (bọc `<AppShell>` cùng cách, KHÔNG route group
 * `(materials)` — Next.js route group chỉ có ích khi nhiều route dùng chung layout mà muốn ẩn
 * tên nhóm khỏi URL; ở đây chỉ có 1 route nên nhóm không có tác dụng, quyết định tự chọn).
 * Lối vào thật: `app/settings/_components/PixelSettingsShell.tsx` nhóm "Nâng cao" (xem N6 grep
 * trong báo cáo phiên).
 */
import { AppShell } from '@/components/studio/AppShell';
import { MaterialsNavigator } from '@/components/materials/MaterialsNavigator';
import { MaterialsScreen } from '@/components/materials/MaterialsScreen';
import { useT } from '@/lib/i18n';

export default function MaterialsPage() {
  const tr = useT();
  return (
    <AppShell
      active="render"
      navigator={<MaterialsNavigator />}
      navigatorAddLabel={tr('Kho vật liệu', 'Materials')}
      navigatorCollapsedLabel={tr('Vật liệu', 'Materials')}
    >
      <div className="min-h-0 flex-1 overflow-y-auto">
        <MaterialsScreen />
      </div>
    </AppShell>
  );
}
