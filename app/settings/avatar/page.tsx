'use client';

/**
 * /settings/avatar — trang chỉnh avatar. Tải config hiện tại, cho user tuỳ chỉnh,
 * PATCH khi Save.
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AvatarBuilder } from '@/components/avatar/AvatarBuilder';
import { AvatarConfig, DEFAULT_AVATAR, serializeAvatar } from '@/lib/avatar';
import { useFlowStore } from '@/lib/store';
import { useT } from '@/lib/i18n';

export default function AvatarSettingsPage() {
  const router = useRouter();
  const user = useFlowStore((s) => s.user);
  const setUser = useFlowStore((s) => s.setUser);
  const [config, setConfig] = useState<AvatarConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const tr = useT();

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
      // Đồng bộ ngay vào store để avatar trên header đổi liền, khỏi chờ reload phiên.
      if (user) setUser({ ...user, avatar: serializeAvatar(a) });
      router.push('/');
    } finally {
      setSaving(false);
    }
  };

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
      <header style={{ maxWidth: 720, width: '100%' }}>
        <div
          style={{
            fontSize: 10,
            letterSpacing: '0.24em',
            textTransform: 'uppercase',
            color: 'var(--accent)',
            marginBottom: 6,
          }}
        >
          {tr('Cài đặt', 'Settings')}
        </div>
        <h1
          style={{
            fontSize: 32,
            fontWeight: 500,
            margin: 0,
            color: 'var(--t1)',
            letterSpacing: '-0.01em',
          }}
        >
          {tr('Avatar của bạn', 'Your avatar')}
        </h1>
        <p style={{ color: 'var(--t3)', fontSize: 14, marginTop: 8 }}>
          {tr('Chọn khuôn mặt, tóc, kính, áo — dùng cho hồ sơ và bình luận trong nhóm.', 'Pick your face, hair, glasses, outfit — used for your profile and comments in the team.')}
        </p>
      </header>

      {config ? <AvatarBuilder value={config} onSave={save} saving={saving} /> : <div style={{ color: 'var(--t3)' }}>{tr('Đang tải…', 'Loading…')}</div>}
    </main>
  );
}
