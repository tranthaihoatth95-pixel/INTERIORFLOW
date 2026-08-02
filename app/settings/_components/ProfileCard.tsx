'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Plus, CircleUser } from 'lucide-react';
import { useFlowStore } from '@/lib/store';
import { UserAvatar } from '@/components/avatar/UserAvatar';
import { AvatarRenderer } from '@/components/avatar/AvatarRenderer';
import { randomAvatarFromId } from '@/lib/avatar';
import { useT } from '@/lib/i18n';

// 7 seed cố định → 7 AvatarConfig THẬT khác nhau qua randomAvatarFromId (lib/avatar.ts) —
// KHÔNG phải màu trơn tự vẽ (đã sai luật lần trước, xem docs/LUAT-GIAO-DIEN-BAT-BUOC.md L1/L6).
const PRESET_SEEDS = ['preset-1', 'preset-2', 'preset-3', 'preset-4', 'preset-5', 'preset-6', 'preset-7'];

/**
 * Hồ sơ — bố cục theo docs/mocks/mock-settings-polished.html `.avrow`/`.avgrid`, avatar dùng
 * ĐÚNG hệ thật (`UserAvatar`/`AvatarRenderer`, 1271 dòng SVG búp bê nỉ 3D có sẵn) — không vẽ lại.
 * Cỡ theo docs/mocks/avatar-picker.html tinh thần "xem trước lớn hơn các lựa chọn nhỏ": avatar
 * hiện tại 68px, 7 preset quick-pick 52px, tất cả đều avatar THẬT (chỉ khác config, không phải
 * placeholder). Bấm avatar/nút ✎/ô ﹢ đều mở `/settings/avatar` (AvatarBuilder 311 dòng có sẵn)
 * để chỉnh sâu — không rebuild trình chỉnh trong card này.
 */
export function ProfileCard() {
  const router = useRouter();
  const user = useFlowStore((s) => s.user);
  const tr = useT();

  const presets = useMemo(() => PRESET_SEEDS.map((seed) => ({ seed, config: randomAvatarFromId(seed) })), []);

  const goEdit = () => router.push('/settings/avatar');

  return (
    <div className="card" style={{ gridColumn: '1 / -1' }}>
      <h3><CircleUser size={15} /> {tr('Hồ sơ', 'Profile')}</h3>
      <div className="hint">{tr('Chạm avatar để đổi — ảnh của bạn hiện với cộng sự khi làm chung', 'Tap the avatar to change it — teammates see this when you collaborate')}</div>

      <div className="avrow">
        <button type="button" className="avbig" onClick={goEdit} aria-label={tr('Đổi avatar', 'Change avatar')}>
          <UserAvatar id={user?.id} avatar={user?.avatar} name={user?.name} size={68} frame={false} />
          <span className="edit"><Pencil size={12} /></span>
        </button>
        <div>
          <div className="avname">{user?.name ?? tr('Khách', 'Guest')}</div>
          <div className="avmail">{user?.email ?? '—'}</div>
        </div>
      </div>

      <div className="avgrid">
        {presets.map((p) => (
          <button type="button" key={p.seed} className="avo" onClick={goEdit} title={tr('Mở trình chỉnh avatar', 'Open avatar editor')}>
            <AvatarRenderer config={p.config} size={52} frame={false} />
          </button>
        ))}
        <button type="button" className="avo add" onClick={goEdit} aria-label={tr('Chỉnh avatar', 'Edit avatar')}>
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
}
