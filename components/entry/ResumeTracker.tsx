'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { saveResume, getLastUserId, RESUMABLE_ROUTES, type ResumableRoute } from '@/lib/resume';
import { LEGACY_STAGE_ROUTE, parseStageRoute } from '@/lib/scope-core';

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
 */
export function ResumeTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    // Task #21: chặng đã dời xuống `/projects/[id]/(cad|present|photo)`. Resume-state vẫn
    // ghi TÊN ROUTE CŨ tương ứng ('/cad-editor'…): route cũ nay là cầu redirect nên
    // auto-resume vẫn đưa về đúng chặng + đúng dự án (redirect tra lại id), mà không phải
    // đổi kiểu `ResumableRoute` hay lưu id dự án trùng lặp ở hai chỗ.
    const scoped = parseStageRoute(pathname);
    const route = scoped ? LEGACY_STAGE_ROUTE[scoped.stage] : pathname;
    // '/' do app/page.tsx (HomeScreen) tự ghi kèm flowId + chặng — xem doc ở trên.
    if (route === '/') return;
    if (!(RESUMABLE_ROUTES as readonly string[]).includes(route)) return;
    const userId = getLastUserId();
    if (!userId) return;
    saveResume(userId, { route: route as ResumableRoute });
  }, [pathname]);

  return null;
}
