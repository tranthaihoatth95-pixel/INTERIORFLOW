'use client';

/**
 * app/colors/page.tsx — màn "Bảng màu", đứng ngang hàng `/materials` (bọc `<AppShell>` cùng cách).
 * Lối vào thật: nút "Bảng màu" ở header `components/materials/MaterialsScreen.tsx` — kho vật
 * liệu và bảng màu là hai ngăn của cùng một tủ hồ sơ vật tư, để cạnh nhau đúng chỗ người dùng
 * tìm (N6: xem grep chứng minh nơi mount trong báo cáo phiên).
 */
import { Palette } from 'lucide-react';
import { AppShell } from '@/components/studio/AppShell';
import { ColorLibraryScreen } from '@/components/colors/ColorLibraryScreen';
import { useT } from '@/lib/i18n';

export default function ColorsPage() {
  const tr = useT();
  return (
    <AppShell
      active="render"
      navigator={
        <div className="px-1.5 py-1">
          <div className="flex h-[30px] w-full items-center gap-2.5 rounded-[8px] px-2 text-[12.5px] leading-[1.6] text-[var(--t1)]">
            <Palette size={14} strokeWidth={1.75} className="shrink-0 text-[var(--t4)]" />
            {tr('Bảng màu', 'Colour libraries')}
          </div>
        </div>
      }
      navigatorAddLabel={tr('Bảng màu', 'Colour libraries')}
      navigatorCollapsedLabel={tr('Màu', 'Colours')}
    >
      <div className="min-h-0 flex-1 overflow-y-auto">
        <ColorLibraryScreen />
      </div>
    </AppShell>
  );
}
