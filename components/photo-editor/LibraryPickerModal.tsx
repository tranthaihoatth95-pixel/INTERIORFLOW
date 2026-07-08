'use client';

/**
 * components/photo-editor/LibraryPickerModal.tsx — Chọn ảnh từ thư viện Reference (/api/library).
 *
 * Fetch trong useEffect (hydration-safe). Bấm 1 ảnh → gọi onPick(url) và đóng. Thư viện
 * trống hoặc chưa đăng nhập → hiện thông báo, không chặn.
 */

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface LibAsset {
  id: string;
  name: string;
  url: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onPick: (url: string) => void;
}

export default function LibraryPickerModal(p: Props) {
  const [assets, setAssets] = useState<LibAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!p.open) return;
    let alive = true;
    setLoading(true);
    setErr(null);
    (async () => {
      try {
        const r = await fetch('/api/library');
        if (!r.ok) throw new Error('no-lib');
        const d = await r.json();
        const list: LibAsset[] = (d.assets ?? []).map((a: Record<string, unknown>) => ({
          id: String(a.id),
          name: String(a.name ?? ''),
          url: String(a.url ?? ''),
        }));
        if (alive) setAssets(list.filter((a) => a.url));
      } catch {
        if (alive) setErr('Thư viện trống hoặc chưa đăng nhập.');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [p.open]);

  if (!p.open) return null;

  return (
    <div
      onClick={p.onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,.45)',
        display: 'grid',
        placeItems: 'center',
        zIndex: 50,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(760px, 92vw)',
          maxHeight: '80vh',
          overflow: 'auto',
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          padding: 18,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--t1)' }}>Chọn ảnh từ thư viện</div>
          <div style={{ flex: 1 }} />
          <button type="button" onClick={p.onClose} style={{ background: 'none', border: 'none', color: 'var(--t3)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>
        {loading && <div style={{ fontSize: 13, color: 'var(--t4)' }}>Đang tải…</div>}
        {err && <div style={{ fontSize: 13, color: 'var(--t4)' }}>{err}</div>}
        {!loading && !err && assets.length === 0 && (
          <div style={{ fontSize: 13, color: 'var(--t4)' }}>Chưa có ảnh nào trong thư viện.</div>
        )}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
            gap: 10,
          }}
        >
          {assets.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => {
                p.onPick(a.url);
                p.onClose();
              }}
              style={{
                border: '1px solid var(--border)',
                borderRadius: 10,
                overflow: 'hidden',
                background: 'var(--field)',
                cursor: 'pointer',
                padding: 0,
              }}
              title={a.name}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={a.url} alt={a.name} style={{ width: '100%', height: 110, objectFit: 'cover', display: 'block' }} />
              <div style={{ fontSize: 11, color: 'var(--t3)', padding: '5px 7px', textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {a.name || 'ảnh'}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
