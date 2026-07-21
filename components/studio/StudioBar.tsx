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
import { STAGE_TINT } from '@/lib/phases';
import { useFlowStore } from '@/lib/store';
import StageSwitcher from './StageSwitcher';
import { useStageTransition } from './StageTransitionProvider';
import SessionWatch from './SessionWatch';
import Tooltip from '@/components/ui/Tooltip';
import { IFLogo } from '@/components/entry/IFLogo';
import { HomeButton } from './HomeButton';
import { requestGallery } from '@/lib/resume';

export default function StudioBar({ active }: { active: 'present' | 'photo' | 'cad' }) {
  const router = useRouter();
  // Khôi phục chat + sáng/tối cho studio (trước bị thiếu so với app chính).
  const pref = useFlowStore((s) => s.themePref);
  const setThemePref = useFlowStore((s) => s.setThemePref);
  const applyTheme = useFlowStore((s) => s.applyTheme);
  const setChatOpen = useFlowStore((s) => s.setChatOpen);
  const chatOpen = useFlowStore((s) => s.chatOpen);
  // Màn che lúc rời chặng nay do StageTransitionProvider (root layout) giữ — veil phải sống
  // xuyên qua `router.push`, không được unmount cùng route cũ. Ở đây chỉ ra lệnh "bắt đầu".
  const { begin } = useStageTransition();
  const stage: Phase = active === 'photo' ? 'render' : active === 'cad' ? 'concept' : 'present';

  // Route studio đứng riêng → tự áp theme lúc mở (page không gọi hydrate/applyTheme).
  // Prefetch sẵn đường VỀ app chính — bấm Concept/Render chuyển gần như tức thì.
  useEffect(() => {
    applyTheme();
    router.prefetch('/');
    router.prefetch('/cad-editor');
    // Thiếu prefetch route Present là lý do bấm Present hay khựng lâu nhất trong 3 chặng.
    router.prefetch('/present-editor');
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
    // Bật màn che trước khi đổi route; provider tự kéo màn ra khi trang đích đã vẽ xong.
    begin(p);
    if (p === 'present') {
      router.push('/present-editor');
      return;
    }
    // Chặng 1 (id 'concept') = Drafting CAD → trình vẽ 2D ở route riêng.
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
        // 48px = đúng `h-12` của <Header> ở app chính. Trước là 46px nên mỗi lần đổi chặng
        // giữa '/' và route studio toàn bộ nội dung bên dưới nhảy 2px — layout shift nhỏ nhưng
        // mắt bắt được, đúng kiểu "nhảy vị trí" khi chuyển cảnh.
        height: 48,
        flex: '0 0 auto',
        padding: '0 12px',
        // Phân định chặng — hairline đáy thanh đầu mang TÔNG CỦA CHẶNG (pha loãng vào --border
        // để vẫn là đường 1px trầm, không thành vạch màu). Đổi chặng là đổi luôn đường này.
        borderBottom: `1px solid color-mix(in srgb, ${STAGE_TINT[stage]} 55%, var(--border))`,
        background: 'var(--panel)',
      }}
    >
      {/* Logo IF phương án "có khung" — đồng bộ với Header/share/login (19/07). Bấm logo cũng
          điều hướng về Gallery (§5.1 quyết định 3) — cùng cơ chế requestGallery() với HomeButton. */}
      <button
        type="button"
        onClick={() => {
          requestGallery();
          router.push('/');
        }}
        title="Về Gallery — InteriorFlow"
        aria-label="InteriorFlow — Home"
        style={{ display: 'flex', flex: '0 0 auto', border: 'none', background: 'transparent', padding: 0, cursor: 'pointer' }}
      >
        <IFLogo size={22} variant="framed" style={{ color: 'var(--t2)' }} />
      </button>
      <span style={{ width: 1, height: 20, background: 'var(--border)' }} />

      {/* Home — TRƯỚC Drafting CAD (đúng thứ tự đã chốt) */}
      <HomeButton compact />
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
