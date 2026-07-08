'use client';

/**
 * components/studio/StudioBar.tsx — Thanh đầu 2 studio route dùng CHUNG StageSwitcher.
 *
 * Trục điều hướng duy nhất: Concept · Render · Present (giống hệt header app chính).
 *   - present-editor: active = Present.
 *   - photo-editor: active = Render + nhãn "Chỉnh ảnh" (photo là công cụ con của Render).
 * Chọn Concept/Render → về '/' đúng chặng (ghi localStorage workspace, store.hydrate đọc lại).
 * Chọn Present → /present-editor. Luôn có đường về app chính.
 */

import { useRouter } from 'next/navigation';
import type { Phase } from '@/lib/phases';
import StageSwitcher from './StageSwitcher';

export default function StudioBar({ active }: { active: 'present' | 'photo' }) {
  const router = useRouter();

  const go = (p: Phase) => {
    if (p === 'present') {
      router.push('/present-editor');
      return;
    }
    // Concept/Render sống ở app chính — ghi chặng rồi về '/' (store.hydrate khôi phục).
    try {
      localStorage.setItem('interiorflow.workspace', p);
    } catch {
      /* bỏ qua */
    }
    router.push('/');
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        height: 46,
        flex: '0 0 auto',
        padding: '0 12px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--panel)',
      }}
    >
      <span
        style={{ fontSize: 13, fontWeight: 700, letterSpacing: 1, color: 'var(--t2)', userSelect: 'none' }}
      >
        IF
      </span>
      <span style={{ width: 1, height: 20, background: 'var(--border)' }} />

      <StageSwitcher
        active={active === 'photo' ? 'render' : 'present'}
        photoContext={active === 'photo'}
        onPick={go}
      />

      <div style={{ flex: 1 }} />
    </div>
  );
}
