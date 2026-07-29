'use client';

/**
 * /settings — Cài đặt chung. Trang mới (2.2.61, 29/07) — dời "Mức phụ thuộc AI" ra khỏi
 * thanh đầu (Header.tsx) về đây, vì đó là cấu hình toàn cục áp cả 3 chặng, không phải nút
 * thao tác. Trang này còn mỏng (1 mục), sẽ gộp thêm các mục Cài đặt khác khi cần
 * (docs/CHOT-SO-MA-2026-07-29.md §D, mã 2.2.61).
 */

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { AiDependencySettings } from '@/components/settings/AiDependencySettings';
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

        <div className="mt-8">
          <AiDependencySettings />
        </div>
      </div>
    </main>
  );
}
