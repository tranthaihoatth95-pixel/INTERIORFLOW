'use client';

/**
 * components/studio/HomeButton.tsx — mục "Home" đặt TRƯỚC "Drafting CAD" trong thanh chuyển
 * chặng (docs/RESEARCH-HOME-GALLERY-DASHBOARD.md §5.1 quyết định 3, phần "Header/StudioBar").
 *
 * Điều hướng về Gallery (`/`) — dùng chung `requestGallery()` (lib/resume.ts) để bỏ qua
 * auto-resume của returning-user (nếu không, router.push('/') sẽ bị enterAfterAuth() đá
 * thẳng lại vào canvas thay vì dừng ở ProjectSelect — xem giải thích trong lib/resume.ts).
 *
 * Dùng CHUNG ở cả Header (app chính, route '/') và StudioBar (3 route studio) — hành vi
 * giống hệt nhau ở mọi nơi, đúng tinh thần StageSwitcher ("cùng 1 giao diện ở mọi nơi").
 */

import { Home } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { requestGallery } from '@/lib/resume';

export function HomeButton({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const goHome = () => {
    requestGallery();
    router.push('/');
  };
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
