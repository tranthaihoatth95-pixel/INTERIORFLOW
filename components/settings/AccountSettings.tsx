'use client';

/**
 * components/settings/AccountSettings.tsx — nhóm "Tài khoản" của /settings (7.3.30, 30/07,
 * docs/TICKET-SETTINGS-GOM-CAU-HINH-2026-07-29.md §5). Gỡ mồ côi cho `/settings/avatar` —
 * trước đó route này tồn tại nhưng KHÔNG có link nào trỏ tới, chỉ vào được bằng gõ tay URL.
 *
 * Tên hiển thị/email hiện chỉ ĐỌC (khớp UserChip/MobileMenu — chưa có API đổi tên, không tự
 * bịa tính năng ngoài phạm vi ticket).
 */

import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { useFlowStore } from '@/lib/store';
import { UserAvatar } from '@/components/avatar/UserAvatar';
import { useT } from '@/lib/i18n';
import { quenDangXuat } from '@/lib/danh-tinh-phien';

export function AccountSettings() {
  const user = useFlowStore((s) => s.user);
  const setUser = useFlowStore((s) => s.setUser);
  const router = useRouter();
  const tr = useT();

  return (
    <section>
      <h2 className="text-[15px] font-semibold text-[var(--t1)]">{tr('Tài khoản', 'Account')}</h2>

      <div className="mt-4 flex items-center gap-3 rounded-[10px] border border-[var(--border)] bg-[var(--field)] px-3 py-2.5">
        <button
          type="button"
          onClick={() => router.push('/settings/avatar')}
          title={tr('Đổi ảnh đại diện', 'Change avatar')}
          className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full"
        >
          <UserAvatar id={user?.id} avatar={user?.avatar} name={user?.name} size={44} frame={false} />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-medium text-[var(--t1)]">{user?.name ?? tr('Khách', 'Guest')}</p>
          <p className="truncate text-[12px] text-[var(--t3)]">{user?.email ?? '—'}</p>
        </div>
        <button
          type="button"
          onClick={() => router.push('/settings/avatar')}
          className="shrink-0 rounded-[10px] border border-[var(--border)] px-2.5 py-1.5 text-[12px] text-[var(--t2)] transition-colors hover:bg-[var(--hover)]"
        >
          {tr('Đổi ảnh', 'Edit')}
        </button>
      </div>

      {user && (
        <button
          type="button"
          onClick={async () => {
            await fetch('/api/auth/me', { method: 'DELETE' });
            // G1 · xoá bộ đệm định danh NGAY khi đăng xuất (xem lib/danh-tinh-phien.ts).
            quenDangXuat();
            setUser(null);
            router.push('/');
          }}
          className="mt-2 flex w-full items-center gap-2 rounded-[10px] border border-[var(--border)] px-3 py-2.5 text-[13px] text-[var(--t2)] transition-colors hover:bg-red-500/10 hover:text-red-400"
        >
          <LogOut size={14} />
          {tr('Đăng xuất', 'Sign out')}
        </button>
      )}
    </section>
  );
}
