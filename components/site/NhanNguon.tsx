'use client';

/**
 * components/site/NhanNguon.tsx — NHÃN NGUỒN 3 nấc (measured / inferred / verified) cho la bàn.
 * Luật màu-không-là-kênh-duy-nhất: mỗi nấc có HÌNH DẠNG riêng (● đo · ◐ máy suy · ✓ đã xác nhận)
 * + CHỮ luôn hiện. Màu theo token nghĩa: đo = --t2 · máy suy = --warning (cần xem lại) · xác nhận = --success.
 */
import { useT } from '@/lib/i18n';
import { NHAN_TRANG_THAI, type SiteFact, type TrangThaiNguon } from '@/lib/site/types';

const HINH: Record<TrangThaiNguon, string> = { measured: '●', inferred: '◐', verified: '✓' };
const MAU: Record<TrangThaiNguon, string> = { measured: 'var(--t2)', inferred: 'var(--warning)', verified: 'var(--success)' };

export default function NhanNguon({ fact, gon = false }: { fact: Pick<SiteFact<unknown>, 'trangThai' | 'doTinCay' | 'nguon'>; gon?: boolean }) {
  const t = useT();
  const nhan = NHAN_TRANG_THAI[fact.trangThai];
  const pct = Math.round(fact.doTinCay * 100);
  const chiTiet = `${t(nhan.vi, nhan.en)} · ${t('tin cậy', 'confidence')} ${pct}% · ${fact.nguon.loai}:${fact.nguon.ref}${fact.nguon.ghiChu ? ` — ${fact.nguon.ghiChu}` : ''}`;
  return (
    <span
      title={chiTiet}
      aria-label={chiTiet}
      className="inline-flex items-center gap-1 rounded-[var(--r-full)] border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide"
      style={{ borderColor: 'var(--vien-mo)', color: MAU[fact.trangThai] }}
    >
      <span aria-hidden>{HINH[fact.trangThai]}</span>
      <span>{t(nhan.vi, nhan.en)}</span>
      {!gon && <span style={{ color: 'var(--t3)' }}>{pct}%</span>}
    </span>
  );
}
