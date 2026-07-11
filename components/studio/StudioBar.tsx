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

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sun, Moon, SunMoon, MessageCircle } from 'lucide-react';
import type { Phase } from '@/lib/phases';
import { useFlowStore } from '@/lib/store';
import StageSwitcher from './StageSwitcher';

export default function StudioBar({ active }: { active: 'present' | 'photo' | 'cad' }) {
  const router = useRouter();
  // Khôi phục chat + sáng/tối cho studio (trước bị thiếu so với app chính).
  const pref = useFlowStore((s) => s.themePref);
  const setThemePref = useFlowStore((s) => s.setThemePref);
  const applyTheme = useFlowStore((s) => s.applyTheme);
  const setChatOpen = useFlowStore((s) => s.setChatOpen);
  const chatOpen = useFlowStore((s) => s.chatOpen);

  // Route studio đứng riêng → tự áp theme lúc mở (page không gọi hydrate/applyTheme).
  // Prefetch sẵn đường VỀ app chính — bấm Concept/Render chuyển gần như tức thì.
  useEffect(() => {
    applyTheme();
    router.prefetch('/');
    router.prefetch('/cad-editor');
  }, [applyTheme, router]);

  const nextTheme: 'auto' | 'light' | 'dark' =
    pref === 'auto' ? 'light' : pref === 'light' ? 'dark' : 'auto';
  const ThemeIcon = pref === 'auto' ? SunMoon : pref === 'light' ? Sun : Moon;

  const go = (p: Phase) => {
    if (p === 'present') {
      router.push('/present-editor');
      return;
    }
    // Chặng 1 (id 'concept') = Layout CAD → trình vẽ 2D ở route riêng.
    if (p === 'concept') {
      router.push('/cad-editor');
      return;
    }
    // Render = canvas node ở app chính (ghi chặng, store.hydrate khôi phục).
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
        active={active === 'photo' ? 'render' : active === 'cad' ? 'concept' : 'present'}
        photoContext={active === 'photo'}
        onPick={go}
      />

      <div style={{ flex: 1 }} />

      {/* Chat team + toggle sáng/tối — khôi phục cho chặng Present/studio */}
      <button
        type="button"
        onClick={() => setChatOpen(!chatOpen)}
        title="Chat nhóm"
        style={iconBtn(chatOpen)}
      >
        <MessageCircle size={16} />
      </button>
      <button
        type="button"
        onClick={() => setThemePref(nextTheme)}
        title={`Giao diện: ${pref === 'auto' ? 'tự động' : pref === 'light' ? 'sáng' : 'tối'} — bấm để đổi`}
        style={iconBtn(false)}
      >
        <ThemeIcon size={16} />
      </button>
    </div>
  );
}

function iconBtn(active: boolean): React.CSSProperties {
  return {
    display: 'grid',
    placeItems: 'center',
    width: 34,
    height: 34,
    borderRadius: 9,
    border: '1px solid var(--border)',
    background: active ? 'var(--accent-soft)' : 'var(--field)',
    color: active ? 'var(--accent)' : 'var(--t2)',
    cursor: 'pointer',
  };
}
