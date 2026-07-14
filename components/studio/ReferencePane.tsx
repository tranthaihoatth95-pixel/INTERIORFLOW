'use client';

/**
 * components/studio/ReferencePane.tsx — pane PHỤ cho dual-pane máy gập (D-1):
 * thư viện Reference của team ở dạng CHỈ XEM, đứng cạnh bản vẽ CAD.
 *
 * Vì sao không phải editor thứ hai: CadCanvas lẫn PresentEditor đều bind keydown
 * cấp WINDOW (⌘Z/Delete) — mount 2 editor cùng lúc là giẫm phím nhau. Pane phụ
 * này thuần đọc (fetch /api/library 1 lần), không listener toàn cục → an toàn.
 */

import { useEffect, useState } from 'react';
import { Images, Loader2 } from 'lucide-react';

interface RefAsset {
  id: string;
  name: string;
  url: string;
  tags: string;
  uploader?: string;
}

type LoadState = 'loading' | 'ok' | 'auth' | 'error';

export default function ReferencePane() {
  const [state, setState] = useState<LoadState>('loading');
  const [assets, setAssets] = useState<RefAsset[]>([]);

  useEffect(() => {
    let alive = true;
    fetch('/api/library')
      .then(async (r) => {
        if (!alive) return;
        if (r.status === 401) {
          setState('auth');
          return;
        }
        if (!r.ok) {
          setState('error');
          return;
        }
        const data = (await r.json()) as { assets?: RefAsset[] };
        if (!alive) return;
        setAssets(data.assets ?? []);
        setState('ok');
      })
      .catch(() => alive && setState('error'));
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          padding: '9px 14px',
          borderBottom: '1px solid var(--border)',
          fontSize: 12,
          fontWeight: 600,
          color: 'var(--t2)',
          flex: '0 0 auto',
        }}
      >
        <Images size={14} />
        Reference
        {state === 'ok' && (
          <span style={{ fontWeight: 500, color: 'var(--t4)' }}>· {assets.length} ảnh</span>
        )}
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 12 }}>
        {state === 'loading' && (
          <Hint>
            <Loader2 size={15} className="animate-spin" /> Đang tải thư viện…
          </Hint>
        )}
        {state === 'auth' && <Hint>Đăng nhập để xem thư viện Reference của team.</Hint>}
        {state === 'error' && <Hint>Không tải được thư viện — thử mở lại sau.</Hint>}
        {state === 'ok' && assets.length === 0 && (
          <Hint>Thư viện trống — tải ảnh tham khảo ở chặng Render/Present.</Hint>
        )}
        {state === 'ok' && assets.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
              gap: 10,
            }}
          >
            {assets.map((a) => (
              <figure key={a.id} style={{ margin: 0, minWidth: 0 }}>
                <img
                  src={a.url}
                  alt={a.name}
                  loading="lazy"
                  style={{
                    width: '100%',
                    aspectRatio: '4 / 3',
                    objectFit: 'cover',
                    borderRadius: 10,
                    border: '1px solid var(--border)',
                    display: 'block',
                    background: 'var(--field)',
                  }}
                />
                <figcaption
                  title={a.tags || a.name}
                  style={{
                    marginTop: 4,
                    fontSize: 10.5,
                    color: 'var(--t4)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {a.name}
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 7,
        margin: '18px 4px',
        fontSize: 12,
        lineHeight: 1.5,
        color: 'var(--t4)',
      }}
    >
      {children}
    </p>
  );
}
