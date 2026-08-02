'use client';

/**
 * UserAvatar — cầu nối giữa `SessionUser` (store) và `AvatarRenderer`.
 *
 * Vì sao cần: renderer chỉ nhận `AvatarConfig` đã chuẩn hoá. Ở header/menu tài khoản ta
 * chỉ có user thô (có thể `null` khi chưa đăng nhập, `avatar` có thể null/rỗng/JSON cũ).
 * Component này lo hết: parse → normalize → fallback random DETERMINISTIC theo id, nên
 * KHÔNG BAO GIỜ hiện ô trống.
 */

import { parseAvatar } from '@/lib/avatar';
import { AvatarRenderer } from './AvatarRenderer';

interface Props {
  /** id user — dùng làm seed cho fallback deterministic. Rỗng = khách. */
  id?: string | null;
  /** JSON string từ User.avatar. Thiếu/hỏng đều được. */
  avatar?: string | null;
  name?: string | null;
  size?: number;
  frame?: boolean;
  className?: string;
  /** Ép bật/tắt filter nỉ + blur — xem AvatarRenderer.tsx (mặc định: chỉ bật khi size >= 32). */
  detail?: boolean;
}

export function UserAvatar({ id, avatar, name, size = 26, frame = true, className, detail }: Props) {
  const seed = id || `guest:${name || 'anon'}`;
  const config = parseAvatar(avatar ?? null, seed);
  return (
    <AvatarRenderer
      config={config}
      size={size}
      frame={frame}
      className={className}
      detail={detail}
      title={name ? `Avatar — ${name}` : undefined}
    />
  );
}
