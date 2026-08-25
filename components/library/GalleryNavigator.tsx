'use client';

/**
 * components/library/GalleryNavigator.tsx — ổ ② Navigator tối thiểu cho `/library/gallery`, cùng
 * vai trò `MaterialsNavigator`/`FilesNavigator`: Gallery không có "nhóm" để nhảy neo (bộ lọc nằm
 * ngay trong `GalleryLienNganh`), chỉ 1 nhãn tĩnh — giữ đúng shape `AppShell` cần.
 */
import { Images } from 'lucide-react';
import { useT } from '@/lib/i18n';

export function GalleryNavigator() {
  const tr = useT();
  return (
    <div className="px-1.5 py-1">
      <div className="flex h-[30px] w-full items-center gap-2.5 rounded-[10px] px-2 text-[12.5px] text-[var(--t1)]">
        <Images size={14} strokeWidth={1.5} className="shrink-0 text-[var(--t4)]" />
        {tr('Gallery liên ngành', 'Cross-discipline gallery')}
      </div>
    </div>
  );
}
