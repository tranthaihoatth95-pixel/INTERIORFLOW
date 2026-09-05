'use client';

/**
 * components/site/MeetingContextCard.tsx — HỌP/LỊCH từ provider (MS365 hôm nay) cho bối cảnh dự án.
 * Mọi trạng thái của `KetQuaTichHop` có một câu + một nút: chưa nối → Kết nối · thiếu scope → Cấp
 * quyền · ngoại tuyến → hiện bản cũ có nhãn CŨ · chưa cấu hình → nói là việc của máy chủ.
 * Dữ liệu là "từ Microsoft 365", KHÔNG tự ghi vào sự thật dự án — chỉ hiển thị.
 */
import { useCallback, useEffect, useState } from 'react';
import { CalendarClock, ExternalLink, RefreshCw, Video } from 'lucide-react';
import { useT } from '@/lib/i18n';
import { cacheQuaHan, type KetQuaTichHop } from '@/lib/integrations/ket-qua';
import type { MeetingContext } from '@/lib/integrations/providers/ms365-normalize';

type KQ = KetQuaTichHop<MeetingContext[]>;

export default function MeetingContextCard({ provider = 'ms365' }: { provider?: 'ms365' | 'google' }) {
  const t = useT();
  const [kq, setKq] = useState<KQ | null>(null);
  const [dangTai, setDangTai] = useState(false);

  const tai = useCallback(async () => {
    setDangTai(true);
    try {
      const r = await fetch(`/api/integrations/${provider}/calendar?max=8`, { cache: 'no-store' });
      if (r.status === 401) {
        setKq({ provider, trangThai: 'chua-ket-noi', data: null, tai: null, cu: false, thongDiep: t('Cần đăng nhập.', 'Sign in required.') });
        return;
      }
      setKq((await r.json()) as KQ);
    } catch {
      setKq((prev) => (prev?.data ? { ...prev, cu: true, trangThai: 'ngoai-tuyen' } : { provider, trangThai: 'ngoai-tuyen', data: null, tai: null, cu: false }));
    } finally {
      setDangTai(false);
    }
  }, [provider, t]);

  useEffect(() => {
    void tai();
  }, [tai]);

  const fmt = (iso: string) => {
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString(undefined, { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <section className="flex flex-col gap-2 rounded-[var(--r-2)] border p-3" style={{ borderColor: 'var(--vien-mo)', background: 'var(--card)' }} aria-busy={dangTai}>
      <header className="flex items-center justify-between gap-2">
        <h4 className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wide" style={{ color: 'var(--t3)' }}>
          <CalendarClock size={12} aria-hidden /> {t('Họp · lịch', 'Meetings · calendar')} · {provider === 'ms365' ? 'Microsoft 365' : 'Google'}
        </h4>
        <button type="button" onClick={() => void tai()} className="inline-flex items-center gap-1 text-[11px]" style={{ color: 'var(--t3)' }} aria-label={t('Tải lại lịch', 'Reload calendar')}>
          <RefreshCw size={12} aria-hidden className={dangTai ? 'animate-spin' : ''} />
        </button>
      </header>
      {kq === null && <p className="text-[12px]" style={{ color: 'var(--t3)' }}>{t('Đang đọc…', 'Loading…')}</p>}
      {kq && kq.trangThai === 'chua-cau-hinh' && <p className="text-[12px]" style={{ color: 'var(--t3)' }}>{t('Máy chủ chưa cấu hình khoá — việc của người vận hành, không phải của bạn.', 'Server keys not configured — an operator task, nothing for you to do.')}</p>}
      {kq && (kq.trangThai === 'chua-ket-noi' || kq.trangThai === 'thieu-scope') && (
        <div className="flex flex-col gap-1.5 text-[12px]" style={{ color: 'var(--t2)' }}>
          <p>
            {kq.trangThai === 'thieu-scope'
              ? t(`Đã nối nhưng thiếu quyền: ${kq.thieuScope?.join(', ')}.`, `Connected but missing scope: ${kq.thieuScope?.join(', ')}.`)
              : kq.thongDiep ?? t('Chưa kết nối lịch.', 'Calendar not connected.')}
          </p>
          {kq.ketNoiUrl && (
            <a href={kq.ketNoiUrl} className="inline-flex w-fit items-center gap-1 rounded-[var(--r-full)] border px-2.5 py-1 text-[11px]" style={{ borderColor: 'var(--vien-mo)', color: 'var(--t1)' }}>
              {kq.trangThai === 'thieu-scope' ? t('Cấp quyền đọc lịch', 'Grant calendar access') : t('Kết nối', 'Connect')} <ExternalLink size={11} aria-hidden />
            </a>
          )}
        </div>
      )}
      {kq && (kq.trangThai === 'ngoai-tuyen' || kq.trangThai === 'loi') && (
        <p className="text-[12px]" style={{ color: 'var(--warning)' }}>
          {kq.trangThai === 'ngoai-tuyen' ? t('Không tới được máy chủ lịch.', 'Calendar server unreachable.') : t('Lỗi đọc lịch.', 'Calendar read failed.')}
          {kq.thongDiep ? ` ${kq.thongDiep}` : ''}
          {kq.cu ? ` — ${t('đang hiện bản cũ', 'showing cached copy')}` : ''}
        </p>
      )}
      {kq?.data && (
        <ul className="flex flex-col gap-1">
          {kq.data.length === 0 && <li className="text-[12px]" style={{ color: 'var(--t3)' }}>{t('Không có họp trong 14 ngày tới.', 'No meetings in the next 14 days.')}</li>}
          {kq.data.map((m) => (
            <li key={m.id} className="flex items-start justify-between gap-2 text-[12px]" style={{ color: 'var(--t2)' }}>
              <span className="flex flex-col">
                <span style={{ color: 'var(--t1)' }}>{m.tieuDe}</span>
                <span className="font-mono text-[10px]" style={{ color: 'var(--t3)' }}>
                  {m.caNgay ? t('cả ngày', 'all day') : fmt(m.batDau)}{m.diaDiem ? ` · ${m.diaDiem}` : ''}{m.nguoiToChuc ? ` · ${m.nguoiToChuc}` : ''}
                </span>
              </span>
              {m.joinUrl && (
                <a href={m.joinUrl} target="_blank" rel="noreferrer" className="inline-flex shrink-0 items-center gap-1 text-[11px]" style={{ color: 'var(--t2)' }} aria-label={t(`Vào họp ${m.tieuDe}`, `Join ${m.tieuDe}`)}>
                  <Video size={12} aria-hidden /> {t('Vào', 'Join')}
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
      {kq?.tai && (
        <p className="font-mono text-[10px]" style={{ color: cacheQuaHan(kq.tai) ? 'var(--warning)' : 'var(--t4)' }}>
          {t('cập nhật', 'updated')} {new Date(kq.tai).toLocaleTimeString()}{kq.cu ? ` · ${t('CŨ', 'STALE')}` : ''}
        </p>
      )}
    </section>
  );
}
