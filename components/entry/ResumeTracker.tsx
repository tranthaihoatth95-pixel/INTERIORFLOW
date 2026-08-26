'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { saveResume, getLastUserId, computeResumePatch } from '@/lib/resume';

/**
 * ResumeTracker — ghi "đang đứng route nào" cho persistent-state B-3 (Sprint 1).
 *
 * Mount 1 lần ở app/layout.tsx nên chạy trên MỌI route. Các route studio
 * (/cad-editor, /present-editor, /photo-editor) không nạp user vào store → dùng
 * `lastUserId` (ghi lúc auth thành công) làm khoá.
 *
 * CHỈ ghi các route STUDIO — KHÔNG ghi '/': route '/' do app/page.tsx tự ghi (kèm
 * flowId + chặng) và chỉ khi user THẬT SỰ đứng trên canvas (stageDone). Nếu ghi '/'
 * ở đây thì ngay lúc mở app, resume của studio bị đè thành '/' TRƯỚC KHI gate
 * đọc nó → auto-resume về /cad-editor không bao giờ chạy.
 *
 * Render null — zero UI, zero ảnh hưởng cây layout server (client component lá).
 *
 * CONTINUITY-1 (19/08): khi đứng trên route scope dự án (`/projects/[id]/cad`…), PHẢI kèm
 * `flowId = projectId` trong patch ghi resume. Thiếu nó thì `buildResumeCard()`
 * (components/home/widgets/resume-card.ts) tính `routeId = currentProjectId || resume.flowId
 * || null` ra `null` cho lượt "vào thẳng URL/bookmark" (currentProjectId chưa nạp store),
 * `resumeHref()` rơi về route TOÀN CỤC cũ (`/cad-editor`…) thay vì `/projects/<id>/<stage>`,
 * và `LegacyStageRedirect` tra lại cũng ra null (store rỗng + resume rỗng) ⇒ dội về
 * `/?notice=choose-project` dù widget "Việc đang dở" vừa trỏ đúng chỗ.
 */
export function ResumeTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    // Task #21: chặng đã dời xuống `/projects/[id]/(cad|present|photo)`. Resume-state vẫn
    // ghi TÊN ROUTE CŨ tương ứng ('/cad-editor'…): route cũ nay là cầu redirect nên
    // auto-resume vẫn đưa về đúng chặng + đúng dự án (redirect tra lại id), mà không phải
    // đổi kiểu `ResumableRoute` hay lưu id dự án trùng lặp ở hai chỗ.
    // Logic tách sang `computeResumePatch` (lib/resume.ts) để test được thuần (sucrase-node,
    // không cần DOM/usePathname) — xem docstring hàm đó cho chi tiết bug CONTINUITY-1.
    const patch = computeResumePatch(pathname);
    if (!patch) return;
    const userId = getLastUserId();
    if (!userId) return;
    saveResume(userId, patch);
  }, [pathname]);

  return null;
}
