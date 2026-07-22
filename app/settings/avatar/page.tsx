'use client';

/**
 * /settings/avatar — trang chỉnh avatar. Tải config hiện tại, cho user tuỳ chỉnh,
 * PATCH khi Save.
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AvatarBuilder } from '@/components/avatar/AvatarBuilder';
import { AvatarConfig, DEFAULT_AVATAR } from '@/lib/avatar';

export default function AvatarSettingsPage() {
  const router = useRouter();
  const [config, setConfig] = useState<AvatarConfig | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/user/avatar')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setConfig(d?.avatar ?? DEFAULT_AVATAR))
      .catch(() => setConfig(DEFAULT_AVATAR));
  }, []);

  const save = async (a: AvatarConfig) => {
    setSaving(true);
    try {
      await fetch('/api/user/avatar', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(a),
      });
      router.push('/');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#F1ECE3',
        padding: '64px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 24,
      }}
    >
      <header style={{ maxWidth: 720, width: '100%' }}>
        <div
          style={{
            fontSize: 10,
            letterSpacing: '0.24em',
            textTransform: 'uppercase',
            color: '#F06020',
            marginBottom: 6,
          }}
        >
          Cài đặt · Settings
        </div>
        <h1
          style={{
            fontSize: 32,
            fontWeight: 500,
            margin: 0,
            color: '#002850',
            letterSpacing: '-0.01em',
          }}
        >
          Avatar của bạn · Your avatar
        </h1>
        <p style={{ color: '#5A5C5F', fontSize: 14, marginTop: 8 }}>
          Chọn khuôn mặt, tóc, kính, áo — dùng cho hồ sơ và bình luận trong nhóm.
        </p>
      </header>

      {config ? <AvatarBuilder value={config} onSave={save} saving={saving} /> : <div>Đang tải…</div>}
    </main>
  );
}
