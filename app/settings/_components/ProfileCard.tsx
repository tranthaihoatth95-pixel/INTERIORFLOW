'use client';

import { useRouter } from 'next/navigation';
import { useFlowStore } from '@/lib/store';
import { UserAvatar } from '@/components/avatar/UserAvatar';
import { FM } from '@/components/filemanager/fm-tokens';
import { useT } from '@/lib/i18n';

const SWATCHES = [
  'linear-gradient(135deg,#6a57f5,#9d5ff5)',
  'linear-gradient(135deg,#3fb984,#2a8f66)',
  'linear-gradient(135deg,#e07b53,#c9552e)',
  'linear-gradient(135deg,#4a78e0,#2f57b5)',
  'linear-gradient(135deg,#e86a9a,#c94b7c)',
  'linear-gradient(135deg,#8a9a8f,#5f6f66)',
  'linear-gradient(135deg,#e0a43a,#c9552e)',
];

/**
 * VẬT MẪU mock-settings-polished.html card "Hồ sơ" — avatar 74px + nút ✎ đen + grid 8 avatar.
 * Avatar lớn/tên/email = THẬT (useFlowStore.user + UserAvatar) — ✎ và ô ＋ trỏ THẬT sang
 * /settings/avatar (bộ dựng đủ 13 slot có sẵn). 7 swatch màu còn lại là chọn nhanh TRANG TRÍ,
 * "mock local trước" theo đúng chỉ đạo — không ghi đè avatar thật, chỉ đổi viền-chọn tại chỗ.
 */
export function ProfileCard({ swatch, onPickSwatch }: { swatch: number; onPickSwatch: (i: number) => void }) {
  const router = useRouter();
  const user = useFlowStore((s) => s.user);
  const tr = useT();

  return (
    <div className="rounded-2xl p-[18px]" style={{ gridColumn: '1 / -1', background: FM.panel, border: `1px solid ${FM.line}`, boxShadow: FM.shadowSoft }}>
      <h3 className="m-0 mb-[3px] flex items-center gap-2 text-[13px]">◐ {tr('Hồ sơ', 'Profile')}</h3>
      <p className="mb-3.5 text-[11px]" style={{ color: FM.mut }}>
        {tr('Chạm avatar để đổi — ảnh của bạn hiện với cộng sự khi làm chung', 'Tap the avatar to change it — teammates see this when you collaborate')}
      </p>

      <div className="flex items-center gap-4">
        <button type="button" onClick={() => router.push('/settings/avatar')} className="relative shrink-0 rounded-full">
          <span className="block overflow-hidden rounded-full border-[3px] border-white" style={{ boxShadow: '0 6px 18px rgba(40,38,35,.18)' }}>
            <UserAvatar id={user?.id} avatar={user?.avatar} name={user?.name} size={74} frame={false} />
          </span>
          <span
            className="absolute -bottom-0.5 -right-0.5 flex h-[26px] w-[26px] items-center justify-center rounded-full border-2 border-white text-[12px] text-white"
            style={{ background: FM.ink }}
          >
            ✎
          </span>
        </button>
        <div>
          <div className="text-[15px] font-bold">{user?.name ?? tr('Khách', 'Guest')}</div>
          <div className="text-[11.5px]" style={{ color: FM.mut }}>{user?.email ?? '—'}</div>
        </div>
      </div>

      <div className="mt-3.5 grid grid-cols-8 gap-[9px]">
        <button
          type="button"
          onClick={() => onPickSwatch(0)}
          className="aspect-square rounded-full border-2"
          style={{
            borderColor: swatch === 0 ? FM.accent : 'transparent',
            boxShadow: swatch === 0 ? `0 0 0 3px ${FM.accentSoft}` : 'none',
          }}
        >
          <UserAvatar id={user?.id} avatar={user?.avatar} name={user?.name} size={44} frame={false} className="h-full w-full" />
        </button>
        {SWATCHES.map((bg, i) => {
          const idx = i + 1;
          return (
            <button
              key={i}
              type="button"
              onClick={() => onPickSwatch(idx)}
              className="aspect-square rounded-full border-2"
              style={{ background: bg, borderColor: swatch === idx ? FM.accent : 'transparent', boxShadow: swatch === idx ? `0 0 0 3px ${FM.accentSoft}` : 'none' }}
            />
          );
        })}
        <button
          type="button"
          onClick={() => router.push('/settings/avatar')}
          className="flex aspect-square items-center justify-center rounded-full border-[1.5px] border-dashed text-[15px]"
          style={{ borderColor: FM.mut, color: FM.mut, background: FM.chip }}
        >
          ＋
        </button>
      </div>
    </div>
  );
}
