'use client';

/**
 * components/studio/HomeButton.tsx — mục "Home" đặt TRƯỚC "Drafting CAD" trong thanh chuyển
 * chặng (docs/RESEARCH-HOME-GALLERY-DASHBOARD.md §5.1 quyết định 3, phần "Header/StudioBar").
 *
 * Điều hướng về Gallery (`/`) — dùng chung `goHomeConfirmed()` (lib/resume.ts): bỏ qua
 * auto-resume của returning-user (nếu không, router.push('/') sẽ bị enterAfterAuth() đá
 * thẳng lại vào canvas thay vì dừng ở ProjectSelect) VÀ hỏi trước nếu còn thay đổi chưa lưu
 * xong (`useSaveStatus`) — xem giải thích đủ trong lib/resume.ts.
 *
 * Dùng CHUNG ở mọi nơi cần "về Gallery" — Header/AppChrome (mount ở VIỆC 1 UI, 04/08, bên trái
 * logo khi `logoMenu` bật) và mục "Về Thư viện dự án" trong `AppLogoMenu.tsx` (gọi thẳng
 * `goHomeConfirmed()`, không phải component này — xem file đó) — hành vi giống hệt nhau ở
 * mọi nơi, đúng tinh thần StageSwitcher ("cùng 1 giao diện ở mọi nơi").
 */

import { Home } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { goHomeConfirmed } from '@/lib/resume';

export function HomeButton({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const goHome = () => goHomeConfirmed(router);
  return (
    <button
      type="button"
      onClick={goHome}
      title="Về Gallery — Home"
      aria-label="Home"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        height: compact ? 32 : 34,
        padding: compact ? '0 9px' : '0 11px',
        borderRadius: 9,
        border: '1px solid var(--border)',
        background: 'var(--field)',
        color: 'var(--t2)',
        fontSize: 12.5,
        fontWeight: 500,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        flex: '0 0 auto',
      }}
    >
      <Home size={14} strokeWidth={2} />
      {!compact && <span>Home</span>}
    </button>
  );
}
