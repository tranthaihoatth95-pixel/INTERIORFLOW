'use client';

/**
 * components/site/RelaxDock.tsx — Nhạc nền (Spotify) TUỲ CHỌN. Tách hẳn khỏi bối cảnh dự án: gọi
 * route `/relax`, không ghi vào SiteContext, tắt là app vẫn đủ. Không nhúng player — chỉ metadata.
 */
import { useCallback, useEffect, useState } from 'react';
import { Music } from 'lucide-react';
import { useT } from '@/lib/i18n';
import type { KetQuaTichHop } from '@/lib/integrations/ket-qua';
import type { RelaxData } from '@/lib/integrations/relax';

export default function RelaxDock({ provider = 'spotify' }: { provider?: 'spotify' }) {
  const t = useT();
  const [kq, setKq] = useState<KetQuaTichHop<RelaxData> | null>(null);
  const tai = useCallback(async () => {
    try {
      const r = await fetch(`/api/integrations/${provider}/relax`, { cache: 'no-store' });
      if (!r.ok) {
        setKq(null);
        return;
      }
      setKq((await r.json()) as KetQuaTichHop<RelaxData>);
    } catch {
      setKq(null);
    }
  }, [provider]);
  useEffect(() => {
    void tai();
    const id = window.setInterval(() => void tai(), 60_000);
    return () => window.clearInterval(id);
  }, [tai]);

  if (!kq) return null;
  const d = kq.data;
  return (
    <div className="inline-flex items-center gap-2 rounded-[var(--r-full)] border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide" style={{ borderColor: 'var(--vien-mo)', color: 'var(--t3)' }} title={t('Thư giãn — không liên quan sự thật dự án', 'Relaxation — unrelated to project truth')}>
      <Music size={14} aria-hidden />
      {kq.trangThai === 'ok' && d?.kind === 'now-playing' && <span style={{ color: 'var(--t2)' }}>{d.track} · {d.artist}</span>}
      {kq.trangThai === 'ok' && d?.kind === 'idle' && <span>{t('không phát', 'idle')}</span>}
      {kq.trangThai !== 'ok' && kq.ketNoiUrl && <a href={kq.ketNoiUrl} style={{ color: 'var(--t2)' }}>{t('nối Spotify', 'connect Spotify')}</a>}
      {kq.trangThai !== 'ok' && !kq.ketNoiUrl && <span>{t('tắt', 'off')}</span>}
    </div>
  );
}
