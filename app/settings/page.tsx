'use client';

/**
 * /settings — Cài đặt chung. Bắt đầu từ 2.2.61 (29/07, chỉ 1 mục AI). Dựng đủ 4 nhóm ở
 * 7.3.30 (30/07, docs/TICKET-SETTINGS-GOM-CAU-HINH-2026-07-29.md §5): Tài khoản · Giao diện ·
 * AI · Trải nghiệm — nguồn sự thật DUY NHẤT cho mọi cấu hình (nút nhanh sáng/tối vẫn giữ ở
 * Header/StudioBar/MobileMenu — đó là THAO TÁC hay dùng, không phải cấu hình đặt-rồi-quên).
 *
 * Thêm nhóm thứ 5 "Lưu trữ" ở B1 (31/07, ĐỢT B lớp lưu trữ, mã `4.1.a`) — khái niệm mới, không
 * ép vào 4 nhóm cũ.
 */

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { AiDependencySettings } from '@/components/settings/AiDependencySettings';
import { AccountSettings } from '@/components/settings/AccountSettings';
import { AppearanceSettings } from '@/components/settings/AppearanceSettings';
import { ExperienceSettings } from '@/components/settings/ExperienceSettings';
import { StorageSettings } from '@/components/settings/StorageSettings';
import { useT } from '@/lib/i18n';

export default function SettingsPage() {
  const router = useRouter();
  const tr = useT();

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <div className="mx-auto max-w-2xl px-6 py-10">
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-1.5 text-[13px] text-[var(--t3)] transition-colors hover:text-[var(--t1)]"
        >
          <ArrowLeft size={15} />
          {tr('Quay lại', 'Back')}
        </button>

        <h1 className="text-[20px] font-semibold tracking-tight text-[var(--t1)]">
          {tr('Cài đặt', 'Settings')}
        </h1>

        <div className="mt-8 flex flex-col gap-8">
          <AccountSettings />
          <AppearanceSettings />
          <AiDependencySettings />
          <ExperienceSettings />
          <StorageSettings />
        </div>
      </div>
    </main>
  );
}
