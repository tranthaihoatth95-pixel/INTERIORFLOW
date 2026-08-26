'use client';

/**
 * app/projects/page.tsx — SỔ DỰ ÁN TOÀN CỤC (Hoà chốt 22/08).
 *
 * VÌ SAO CÓ ROUTE NÀY. Trước 22/08 mục "Dự án" trên rail (đảo VIỆC, toàn cục) giải ra
 * `/projects/<id>/overview` — một bề mặt THUỘC MỘT DỰ ÁN lại đứng ngay cạnh Trang chủ ⇒ hai
 * đích đọc ra như hai dashboard ngang hàng, và mục này chết mờ khi chưa mở dự án nào. Nay:
 *   · `/projects`            → SỔ DỰ ÁN (toàn cục, luôn dùng được)   ← file này
 *   · `/projects/<id>/…`     → bề mặt trong MỘT dự án (đảo DỰ ÁN trên rail)
 *
 * ⛔ [Đ2] KHÔNG DỰNG ENGINE THỨ HAI. Sổ dự án đã CHẠY THẬT bên trong `/` dưới dạng
 * `ProjectSelect` (tìm kiếm · lưới/carousel · thẻ có `ProjectOverviewCard` · "＋ Dự án mới").
 * Trước nay nó chỉ thiếu ĐƯỜNG ĐI RIÊNG. Route này mount đúng component đó — một cỗ máy, thêm
 * một mặt tiền. Viết một danh sách dự án thứ hai ở đây chính là thứ duplication đang phải dẹp.
 *
 * `ProjectSelect` chỉ phụ thuộc `useFlowStore` (zustand, không cần provider) — ĐÃ ĐO, KHÔNG
 * dùng ReactFlow ⇒ mount được ngoài canvas, không cần `<ReactFlowProvider>`.
 *
 * `onEnter` ở đây KHÁC Trang chủ có chủ ý: Trang chủ đưa thẳng vào chặng đang dở (tiếp tục làm
 * việc), còn từ SỔ dự án thì đích tự nhiên là **Tổng quan** của dự án vừa chọn — bìa dự án, bề
 * mặt đầu tiên bên trong nó. `ProjectSelect` đã `openFlow`/`createFlow` xong TRƯỚC khi gọi
 * `onEnter`, nên store lúc này biết chắc dự án nào (không đoán từ URL).
 */

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/studio/AppShell';
import { ProjectSelect } from '@/components/ProjectSelect';
import { useFlowStore } from '@/lib/store';

export default function ProjectIndexPage() {
  const router = useRouter();

  const vaoDuAn = useCallback(() => {
    const s = useFlowStore.getState();
    const id = s.currentProjectId ?? s.currentFlowId;
    // Không suy ra được dự án thì ĐỨNG YÊN — thà không đi đâu còn hơn đẩy sang một URL bịa.
    if (!id) return;
    router.push(`/projects/${encodeURIComponent(id)}/overview`);
  }, [router]);

  return (
    // `active="home"` là giá trị AN TOÀN, không phải nhãn sai: `AppChromeActive` cố ý KHÔNG có
    // case cho mọi route (xem docstring `AppChromeTypes.ts`), và mục rail nào sáng thì do
    // `mucDangMo(pathname)` quyết — `/projects` đã khai ở đó, nên "Dự án" sáng đúng.
    <AppShell active="home">
      <div className="h-full overflow-y-auto">
        <ProjectSelect onEnter={vaoDuAn} hideHeroCopy hideVitalsBar revealAll />
      </div>
    </AppShell>
  );
}
