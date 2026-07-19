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

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sun, Moon, SunMoon, MessageCircle } from 'lucide-react';
import type { Phase } from '@/lib/phases';
import { useFlowStore } from '@/lib/store';
import StageSwitcher from './StageSwitcher';
import { StageVeil } from './StageTransition';
import SessionWatch from './SessionWatch';
import Tooltip from '@/components/ui/Tooltip';
import { IFLogo } from '@/components/entry/IFLogo';

export default function StudioBar({ active }: { active: 'present' | 'photo' | 'cad' }) {
  const router = useRouter();
  // Khôi phục chat + sáng/tối cho studio (trước bị thiếu so với app chính).
  const pref = useFlowStore((s) => s.themePref);
  const setThemePref = useFlowStore((s) => s.setThemePref);
  const applyTheme = useFlowStore((s) => s.applyTheme);
  const setChatOpen = useFlowStore((s) => s.setChatOpen);
  const chatOpen = useFlowStore((s) => s.chatOpen);
  // C-4: màn che lúc rời chặng (giống PhaseSwitcher ở Header).
  const [leaving, setLeaving] = useState(false);

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
    // Bấm lại đúng chặng đang mở → không làm gì (tránh push trùng route làm veil kẹt).
    // photo KHÔNG tính: photo là công cụ con của Render, bấm Render phải VỀ '/' thật.
    const samePane =
      (active === 'cad' && p === 'concept') || (active === 'present' && p === 'present');
    if (samePane) return;
    // C-4: bật màn stageVeil che trước khi đổi route (nửa kia = StageEnter ở trang đích).
    setLeaving(true);
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
      {/* Logo IF phương án "có khung" — đồng bộ với Header/share/login (19/07). */}
      <IFLogo size={22} variant="framed" style={{ color: 'var(--t2)', flex: '0 0 auto' }} />
      <span style={{ width: 1, height: 20, background: 'var(--border)' }} />

      <StageSwitcher
        active={active === 'photo' ? 'render' : active === 'cad' ? 'concept' : 'present'}
        photoContext={active === 'photo'}
        onPick={go}
      />

      <div style={{ flex: 1 }} />

      {/* Chat team + toggle sáng/tối — khôi phục cho chặng Present/studio */}
      <Tooltip label="Chat nhóm" side="bottom">
        <button
          type="button"
          onClick={() => setChatOpen(!chatOpen)}
          title="Chat nhóm"
          style={iconBtn(chatOpen)}
        >
          <MessageCircle size={16} />
        </button>
      </Tooltip>
      <Tooltip label={`Giao diện: ${pref === 'auto' ? 'tự động' : pref === 'light' ? 'sáng' : 'tối'}`} side="bottom">
        <button
          type="button"
          onClick={() => setThemePref(nextTheme)}
          title={`Giao diện: ${pref === 'auto' ? 'tự động' : pref === 'light' ? 'sáng' : 'tối'} — bấm để đổi`}
          style={iconBtn(false)}
        >
          <ThemeIcon size={16} />
        </button>
      </Tooltip>
      <StageVeil show={leaving} />
      {/* Mất phiên giữa chừng → báo ngay tại chặng, không đợi tới lúc bấm Render mới
          bị đá về màn đăng nhập. Dải báo fixed ở đáy, không chặn thao tác vẽ. */}
      <SessionWatch />
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
