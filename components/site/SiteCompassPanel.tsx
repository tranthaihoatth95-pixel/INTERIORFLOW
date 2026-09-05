'use client';

/**
 * components/site/SiteCompassPanel.tsx — LA BÀN DỰ ÁN (Compass / Site Intelligence), một panel gom:
 *   ① Ghim vị trí (tường minh — không ghim thì mọi thứ dưới là KHUYẾT, không suy)
 *   ② Mặt trời (thiên văn tất định từ ghim)  ③ Dải khí hậu · gió (có nguồn mới hiện)
 *   ④ Câu chuyện địa phương (bằng chứng khảo sát / gói vùng)  ⑤ Biến số ngữ cảnh — máy gợi ý, NGƯỜI bấm nhận
 *   ⑥ Phiếu khảo sát (cầu ArchiNote — soạn được, cửa gửi chưa mở, nói thẳng)  ⑦ Họp/lịch (MS365)
 * Mọi con số mang `NhanNguon`. Trạng thái CŨ / NGOẠI TUYẾN / LOCAL-ONLY hiện chữ, không giấu.
 *
 * CHƯA MOUNT vào route nào — vùng dự án (`app/projects/**`) thuộc slice khác. Export để slice đó lắp.
 */
import { useEffect, useMemo, useState } from 'react';
import { BookOpen, Check, ClipboardList, Compass, MapPin, RefreshCw, Sun, Thermometer, WifiOff, Wind } from 'lucide-react';
import { useT } from '@/lib/i18n';
import { NHAN_BIEN_SO, type SitePack, type SurveyEvidence } from '@/lib/site/types';
import { ghimHopLe } from '@/lib/site/derive';
import { soanPhieuKhaoSat } from '@/lib/site/survey-bridge';
import NhanNguon from './NhanNguon';
import SunArc from './SunArc';
import MeetingContextCard from './MeetingContextCard';
import { useSiteContext } from './useSiteContext';

const H4 = 'flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wide';

export default function SiteCompassPanel({ projectId, packs = [], hienLich = true }: { projectId: string; packs?: SitePack[]; hienLich?: boolean }) {
  const t = useT();
  const { ctx, daNap, ngoaiTuyen, cu, datGhim, themBangChung, nhan, tinhLai } = useSiteContext(projectId, packs);
  const [latRaw, setLatRaw] = useState(ctx.pin ? String(ctx.pin.lat) : '');
  const [lngRaw, setLngRaw] = useState(ctx.pin ? String(ctx.pin.lng) : '');
  const [nhanGhim, setNhanGhim] = useState(ctx.pin?.nhan ?? '');
  const [ghiChu, setGhiChu] = useState('');
  const [loaiGhiChu, setLoaiGhiChu] = useState<Extract<SurveyEvidence, { kind: 'ngu-canh' }>['loai']>('vat-lieu-tai-cho');

  // Ô nhập đồng bộ với bản IDB sau khi hydrate xong (lần render đầu ctx còn rỗng).
  useEffect(() => {
    if (!daNap) return;
    setLatRaw(ctx.pin ? String(ctx.pin.lat) : '');
    setLngRaw(ctx.pin ? String(ctx.pin.lng) : '');
    setNhanGhim(ctx.pin?.nhan ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [daNap]);

  const s = ctx.suyDien;
  const phieu = useMemo(() => soanPhieuKhaoSat(ctx, s), [ctx, s]);
  const ghimNhap = { lat: Number(latRaw), lng: Number(lngRaw) };
  const ghimOk = latRaw.trim() !== '' && lngRaw.trim() !== '' && ghimHopLe(ghimNhap);

  const luuGhim = () => {
    if (!ghimOk) return;
    datGhim({ lat: ghimNhap.lat, lng: ghimNhap.lng, nhan: nhanGhim.trim() || undefined, nguon: 'ghim-tay', tai: new Date().toISOString() });
  };
  const themGhiChu = () => {
    const text = ghiChu.trim();
    if (!text) return;
    themBangChung([{ id: `nc-${Date.now().toString(36)}`, kind: 'ngu-canh', loai: loaiGhiChu, text, tai: new Date().toISOString() }]);
    setGhiChu('');
  };

  const inp = 'w-full rounded-[var(--r-1)] border px-2 py-1 text-[12px] bg-transparent';
  const inpStyle = { borderColor: 'var(--vien-mo)', color: 'var(--t1)' } as const;
  const btn = 'inline-flex items-center gap-1 rounded-[var(--r-full)] border px-2.5 py-1 text-[11px] disabled:cursor-not-allowed';

  return (
    <div className="flex flex-col gap-3 rounded-[var(--r-3)] border p-3" style={{ borderColor: 'var(--vien-mo)', background: 'var(--panel)', color: 'var(--t1)' }} aria-busy={!daNap}>
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h3 className={H4} style={{ color: 'var(--t3)' }}>
          <Compass size={14} aria-hidden /> {t('La bàn dự án', 'Project compass')}
        </h3>
        <div className="flex flex-wrap items-center gap-1.5 font-mono text-[10px] uppercase" style={{ color: 'var(--t3)' }}>
          <span className="rounded-[var(--r-full)] border px-1.5 py-0.5" style={{ borderColor: 'var(--vien-mo)' }} title={t('Chỉ lưu trên máy này — chưa có kênh đồng bộ (schema chưa mở)', 'Stored on this machine only — no sync channel yet (schema pending)')}>{t('chỉ máy này', 'local only')}</span>
          {ngoaiTuyen && <span className="inline-flex items-center gap-1" style={{ color: 'var(--warning)' }}><WifiOff size={14} aria-hidden /> {t('ngoại tuyến', 'offline')}</span>}
          {cu.cu && s && (
            <button type="button" onClick={tinhLai} className={btn} style={{ borderColor: 'var(--warning)', color: 'var(--warning)' }} title={cu.lyDo.join(', ')}>
              <RefreshCw size={14} aria-hidden /> {t('CŨ — tính lại', 'STALE — recompute')}
            </button>
          )}
        </div>
      </header>

      {/* ① GHIM */}
      <section className="flex flex-col gap-1.5">
        <h4 className={H4} style={{ color: 'var(--t3)' }}><MapPin size={14} aria-hidden /> {t('Ghim vị trí', 'Site pin')}</h4>
        <div className="grid grid-cols-[1fr_1fr_1.4fr_auto] gap-1.5">
          <input className={inp} style={inpStyle} inputMode="decimal" placeholder={t('vĩ độ', 'lat')} aria-label={t('Vĩ độ', 'Latitude')} value={latRaw} onChange={(e) => setLatRaw(e.target.value)} />
          <input className={inp} style={inpStyle} inputMode="decimal" placeholder={t('kinh độ', 'lng')} aria-label={t('Kinh độ', 'Longitude')} value={lngRaw} onChange={(e) => setLngRaw(e.target.value)} />
          <input className={inp} style={inpStyle} placeholder={t('nhãn (tuỳ chọn)', 'label (optional)')} aria-label={t('Nhãn ghim', 'Pin label')} value={nhanGhim} onChange={(e) => setNhanGhim(e.target.value)} />
          <button type="button" onClick={luuGhim} disabled={!ghimOk} aria-disabled={!ghimOk} className={btn} style={{ borderColor: 'var(--vien-mo)', color: 'var(--t1)', opacity: ghimOk ? 1 : 'var(--mo-vo-hieu)' }} title={ghimOk ? undefined : t('Cần vĩ độ −90..90 và kinh độ −180..180', 'Needs lat −90..90 and lng −180..180')}>
            <Check size={14} aria-hidden /> {t('Ghim', 'Pin')}
          </button>
        </div>
        {ctx.pin ? (
          <p className="font-mono text-[10px]" style={{ color: 'var(--t3)' }}>
            {ctx.pin.lat.toFixed(4)}, {ctx.pin.lng.toFixed(4)}{ctx.pin.nhan ? ` · ${ctx.pin.nhan}` : ''} · {ctx.pin.nguon}
          </p>
        ) : (
          <p className="text-[12px]" style={{ color: 'var(--t3)' }}>{t('Chưa ghim — không suy gì khi chưa có vị trí.', 'No pin — nothing is inferred without a location.')}</p>
        )}
      </section>

      {s && ctx.pin && (
        <>
          {/* ② MẶT TRỜI */}
          {s.matTroi && (
            <section className="grid grid-cols-[120px_1fr] items-center gap-3">
              <SunArc s={s.matTroi.value} lat={ctx.pin.lat} />
              <div className="flex flex-col gap-1 text-[12px]" style={{ color: 'var(--t2)' }}>
                <h4 className={H4} style={{ color: 'var(--t3)' }}><Sun size={14} aria-hidden /> {t('Mặt trời', 'Sun')} <NhanNguon fact={s.matTroi} gon /></h4>
                <span className="font-mono">{s.matTroi.value.ngay} · {t('mọc', 'rise')} {s.matTroi.value.binhMinh ?? '—'} · {t('lặn', 'set')} {s.matTroi.value.hoangHon ?? '—'}</span>
                <span className="font-mono">{t('giữa trưa', 'noon')} {s.matTroi.value.giuaTrua} · {s.matTroi.value.doCaoGiuaTruaDo}°</span>
                <span className="font-mono" style={{ color: 'var(--t3)' }}>{t('chí hè', 'summer')} {s.matTroi.value.chiHe.doCaoGiuaTruaDo}° · {t('chí đông', 'winter')} {s.matTroi.value.chiDong.doCaoGiuaTruaDo}°</span>
                {s.matTroi.value.muiGioUocTinh && <span style={{ color: 'var(--warning)' }}>{t('múi giờ ước từ kinh độ — xác nhận ở khảo sát', 'time zone estimated from longitude — confirm on survey')}</span>}
              </div>
            </section>
          )}

          {/* ③ KHÍ HẬU · GIÓ */}
          <section className="grid grid-cols-2 gap-2 text-[12px]" style={{ color: 'var(--t2)' }}>
            <div className="flex flex-col gap-1">
              <h4 className={H4} style={{ color: 'var(--t3)' }}><Thermometer size={14} aria-hidden /> {t('Dải khí hậu', 'Climate band')}</h4>
              {s.daiKhiHau ? <span className="flex items-center gap-1.5">{s.daiKhiHau.value} <NhanNguon fact={s.daiKhiHau} /></span> : <span style={{ color: 'var(--t3)' }}>—</span>}
            </div>
            <div className="flex flex-col gap-1">
              <h4 className={H4} style={{ color: 'var(--t3)' }}><Wind size={14} aria-hidden /> {t('Gió chủ đạo', 'Prevailing wind')}</h4>
              {s.gio ? (
                <span className="flex items-center gap-1.5 font-mono">
                  {s.gio.value.map((g) => `${g.huongDo}°${g.tocDoMs !== undefined ? ` ${g.tocDoMs}m/s` : ''}${g.mua ? ` (${g.mua})` : ''}`).join(' · ')}
                  <NhanNguon fact={s.gio} />
                </span>
              ) : (
                <span style={{ color: 'var(--t3)' }}>{t('khuyết — cần khảo sát', 'unknown — needs survey')}</span>
              )}
            </div>
          </section>

          {/* ④ CÂU CHUYỆN */}
          <section className="flex flex-col gap-1.5 text-[12px]" style={{ color: 'var(--t2)' }}>
            <h4 className={H4} style={{ color: 'var(--t3)' }}><BookOpen size={14} aria-hidden /> {t('Bối cảnh · vật liệu địa phương', 'Local context · materials')}</h4>
            {s.cauChuyen.length === 0 && <p style={{ color: 'var(--t3)' }}>{t('Chưa có câu chuyện nào có nguồn.', 'No sourced story yet.')}</p>}
            <ul className="flex flex-col gap-1">
              {s.cauChuyen.map((c) => (
                <li key={c.id} className="flex items-start justify-between gap-2">
                  <span><span className="font-mono text-[10px] uppercase" style={{ color: 'var(--t3)' }}>{c.chuDe}</span> {c.text}</span>
                  <NhanNguon fact={c.fact} gon />
                </li>
              ))}
            </ul>
            <div className="grid grid-cols-[auto_1fr_auto] gap-1.5">
              <select className={inp} style={inpStyle} value={loaiGhiChu} onChange={(e) => setLoaiGhiChu(e.target.value as typeof loaiGhiChu)} aria-label={t('Loại ghi chú', 'Note type')}>
                {(Object.keys(NHAN_BIEN_SO) as (keyof typeof NHAN_BIEN_SO)[]).map((k) => (
                  <option key={k} value={k}>{t(NHAN_BIEN_SO[k].vi, NHAN_BIEN_SO[k].en)}</option>
                ))}
              </select>
              <input className={inp} style={inpStyle} placeholder={t('ghi chú khảo sát tại chỗ…', 'on-site survey note…')} aria-label={t('Ghi chú khảo sát', 'Survey note')} value={ghiChu} onChange={(e) => setGhiChu(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && themGhiChu()} />
              <button type="button" onClick={themGhiChu} disabled={!ghiChu.trim()} aria-disabled={!ghiChu.trim()} className={btn} style={{ borderColor: 'var(--vien-mo)', color: 'var(--t1)', opacity: ghiChu.trim() ? 1 : 'var(--mo-vo-hieu)' }}>{t('Thêm', 'Add')}</button>
            </div>
          </section>

          {/* ⑤ BIẾN SỐ NGỮ CẢNH */}
          <section className="flex flex-col gap-1.5 text-[12px]" style={{ color: 'var(--t2)' }}>
            <h4 className={H4} style={{ color: 'var(--t3)' }}>{t('Biến số ngữ cảnh', 'Context variables')}</h4>
            <div className="flex flex-wrap gap-1.5">
              {ctx.bienSo.map((b) => (
                <span key={b.ma} className="inline-flex items-center gap-1 rounded-[var(--r-full)] border px-2 py-0.5" style={{ borderColor: 'var(--success)', color: 'var(--t1)' }} title={b.lyDo}>
                  <Check size={14} aria-hidden /> {t(NHAN_BIEN_SO[b.ma].vi, NHAN_BIEN_SO[b.ma].en)}
                </span>
              ))}
              {s.goiY.map((g) => (
                <button key={g.ma} type="button" onClick={() => nhan(g.ma)} className={btn} style={{ borderColor: 'var(--warning)', color: 'var(--t1)' }} title={`${t('Máy gợi ý', 'Suggested')}: ${g.lyDo}`}>
                  ◐ {t(NHAN_BIEN_SO[g.ma].vi, NHAN_BIEN_SO[g.ma].en)} · {t('nhận?', 'accept?')}
                </button>
              ))}
              {ctx.bienSo.length === 0 && s.goiY.length === 0 && <span style={{ color: 'var(--t3)' }}>{t('Chưa có căn cứ để gợi ý — thêm bằng chứng khảo sát hoặc gói vùng.', 'Nothing to suggest yet — add survey evidence or a region pack.')}</span>}
            </div>
            <p className="text-[11px]" style={{ color: 'var(--t3)' }}>{t('Biến số chỉ SIẾT THÊM luật, không bao giờ nới lỏng luật bắt buộc.', 'Variables only tighten rules; mandatory rules are never loosened.')}</p>
          </section>

          {/* ⑥ PHIẾU KHẢO SÁT */}
          <section className="flex flex-col gap-1.5 text-[12px]" style={{ color: 'var(--t2)' }}>
            <h4 className={H4} style={{ color: 'var(--t3)' }}><ClipboardList size={14} aria-hidden /> {t('Phiếu khảo sát → ArchiNote', 'Survey brief → ArchiNote')} <span className="font-normal normal-case" style={{ color: 'var(--t4)' }}>({phieu.cauHoi.length})</span></h4>
            <ul className="flex flex-col gap-0.5">
              {phieu.cauHoi.map((c) => (
                <li key={c.ma} className="flex items-baseline gap-2"><span className="font-mono text-[10px] uppercase" style={{ color: 'var(--t4)' }}>{c.ma}</span> {t(c.cauHoi.vi, c.cauHoi.en)}</li>
              ))}
              {phieu.cauHoi.length === 0 && <li style={{ color: 'var(--t3)' }}>{t('Không còn khuyết.', 'Nothing missing.')}</li>}
            </ul>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => navigator.clipboard?.writeText(JSON.stringify(phieu, null, 2))} className={btn} style={{ borderColor: 'var(--vien-mo)', color: 'var(--t1)' }}>{t('Chép phiếu (JSON)', 'Copy brief (JSON)')}</button>
              <button type="button" disabled aria-disabled className={btn} style={{ borderColor: 'var(--vien-mo)', color: 'var(--t1)', opacity: 'var(--mo-vo-hieu)' }} aria-describedby={`site-gui-${projectId}`}>{t('Gửi ArchiNote', 'Send to ArchiNote')}</button>
              <span id={`site-gui-${projectId}`} className="text-[11px]" style={{ color: 'var(--t3)' }}>{phieu.cuaChua[0]}</span>
            </div>
          </section>
        </>
      )}

      {!s && ctx.pin && (
        <button type="button" onClick={tinhLai} className={btn} style={{ borderColor: 'var(--vien-mo)', color: 'var(--t1)', width: 'fit-content' }}>
          <RefreshCw size={14} aria-hidden /> {t('Chưa suy diễn — tính ngay', 'Not derived yet — compute now')}
        </button>
      )}

      {hienLich && <MeetingContextCard />}
    </div>
  );
}
