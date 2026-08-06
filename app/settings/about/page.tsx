'use client';

/**
 * /settings/about — màn About tối thiểu. Không có màn About nào tồn tại trước 05/08 (đã grep xác
 * nhận) — tạo mới CHỈ để có nơi thứ 2 dẫn tới "Giấy phép bên thứ ba"
 * (`docs/LICENSE-NOTES.md §2` đòi "route mới, vào được từ Cài đặt VÀ từ màn About"). Không thêm
 * gì ngoài phạm vi đó — không phải màn About đầy đủ (không có changelog/social/support form).
 */

import { useRouter } from 'next/navigation';
import { ArrowLeft, ScrollText } from 'lucide-react';
import { useT } from '@/lib/i18n';
import pkg from '@/package.json';

export default function AboutPage() {
  const router = useRouter();
  const tr = useT();

  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        padding: '64px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 24,
      }}
    >
      <div style={{ maxWidth: 480, width: '100%' }}>
        <button
          type="button"
          onClick={() => router.back()}
          style={{
            background: 'transparent',
            border: '1px solid var(--border)',
            borderRadius: 10,
            padding: '7px 12px',
            color: 'var(--t2)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
            marginBottom: 24,
          }}
        >
          <ArrowLeft size={13} /> {tr('Quay lại', 'Back')}
        </button>

        <h1 style={{ fontSize: 28, fontWeight: 500, margin: 0, color: 'var(--t1)', letterSpacing: '-0.01em' }}>
          InteriorFlow
        </h1>
        <p style={{ color: 'var(--t3)', fontSize: 13, marginTop: 6 }}>
          {tr('Phiên bản', 'Version')} {pkg.version}
        </p>

        <button
          type="button"
          onClick={() => router.push('/settings/licenses')}
          style={{
            marginTop: 28,
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            background: 'var(--panel)',
            border: '1px solid var(--border)',
            borderRadius: 14,
            padding: 16,
            color: 'var(--t1)',
            cursor: 'pointer',
            textAlign: 'left',
            fontSize: 13,
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ScrollText size={16} />
            {tr('Giấy phép bên thứ ba', 'Third-party licenses')}
          </span>
          <span style={{ color: 'var(--t3)', fontSize: 12 }}>→</span>
        </button>
      </div>
    </main>
  );
}
