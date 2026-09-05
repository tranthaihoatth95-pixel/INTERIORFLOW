'use client';

/**
 * app/inspiration/page.tsx — BỀ MẶT CẢM HỨNG (slice 11: Inspiration → Design DNA → apply-intent).
 * Route mới vì `/inspiration` chưa tồn tại (đã kiểm `ls app`, 03/09). Bọc `<AppShell active="render">`
 * như `/library/gallery` — route không phải 1-trong-3-chặng nhưng dùng chung header/Navigator.
 * Bề mặt biên tập bình thường (Home/Workspace rule), không lưới CAD vô hạn.
 */
import { Suspense } from 'react';
import { AppShell } from '@/components/studio/AppShell';
import { InspirationBoard } from '@/components/dna/InspirationBoard';
import { InspirationNavigator } from '@/components/dna/InspirationNavigator';
import { useT } from '@/lib/i18n';

export default function InspirationPage() {
  const tr = useT();
  return (
    <AppShell
      active="render"
      navigator={
        <Suspense fallback={null}>
          <InspirationNavigator />
        </Suspense>
      }
      navigatorAddLabel={tr('Cảm hứng', 'Inspiration')}
      navigatorCollapsedLabel={tr('Cảm hứng', 'Inspiration')}
    >
      <div className="min-h-0 flex-1 overflow-y-auto">
        <Suspense fallback={null}>
          <InspirationBoard />
        </Suspense>
      </div>
    </AppShell>
  );
}
