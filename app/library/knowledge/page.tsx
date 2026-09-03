'use client';

/**
 * app/library/knowledge/page.tsx — KHO TRI THỨC, mặt tiền thứ hai của Thư viện đứng cạnh Gallery
 * (`/library/gallery`). Không kho mới: đọc quy chuẩn ngành (`lib/cad/standards/registry.ts`) +
 * tài liệu Sổ tay dự án (`/api/notebook/[id]/sources`) qua adapter `lib/library/knowledge.ts`.
 * Rail điều hướng sáng mục "Thư viện" nhờ `mucDangMo('/library/…')` đã có sẵn.
 */
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/studio/AppShell';
import { LibraryOverviewNavigator } from '@/components/library/LibraryOverviewNavigator';
import { KnowledgeBase } from '@/components/library/KnowledgeBase';
import { useFlowStore } from '@/lib/store';
import { useT } from '@/lib/i18n';

export default function LibraryKnowledgePage() {
  const tr = useT();
  const router = useRouter();
  const projectId = useFlowStore((s) => s.currentProjectId);
  return (
    <AppShell
      active="render"
      navigator={<LibraryOverviewNavigator trang="tri-thuc" />}
      navigatorAddLabel={tr('Thêm tài liệu (Sổ tay)', 'Add document (Notebook)')}
      navigatorCollapsedLabel={tr('Tri thức', 'Knowledge')}
      // Đường nạp tài liệu THẬT là Sổ tay của dự án — không dựng form nhập thứ hai ở đây.
      onNavigatorAdd={() => router.push(projectId ? `/projects/${projectId}/notebook` : '/')}
    >
      <div className="min-h-0 flex-1 overflow-y-auto">
        <KnowledgeBase />
      </div>
    </AppShell>
  );
}
