'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { saveResume, getLastUserId, RESUMABLE_ROUTES, type ResumableRoute } from '@/lib/resume';

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
    if (!pathname || pathname === '/') return;
    if (!(RESUMABLE_ROUTES as readonly string[]).includes(pathname)) return;
    const userId = getLastUserId();
    if (!userId) return;
    saveResume(userId, { route: pathname as ResumableRoute });
  }, [pathname]);

  return null;
}
