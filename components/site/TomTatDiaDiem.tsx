'use client';

/**
 * components/site/TomTatDiaDiem.tsx — TÓM TẮT ĐỊA ĐIỂM ở Tổng quan dự án (§18).
 *
 * THỨ BẬC BẮT BUỘC, đọc từ trên xuống như một câu chuyện nghề:
 *   ĐỊA ĐIỂM  → chỗ này ở đâu, biết chắc tới mức nào
 *   TÍN HIỆU  → vài con số ĐO/TÍNH được, không phải mười hai thẻ chỉ số
 *   HỆ QUẢ    → con số đó có nghĩa gì với việc thiết kế
 *   QUYẾT ĐỊNH→ ai đã gật cái gì (§4 — máy đề xuất, người quyết)
 *
 * ⛔ KHÔNG làm tường thẻ (Bản đồ · Thời tiết · AI · Gió · Văn hoá…). ⛔ KHÔNG bản đồ khổng lồ.
 * Mặc định **4–7 tín hiệu giá trị cao**; phần còn lại nằm sau "Xem phân tích đầy đủ" — mở TẠI CHỖ,
 * không route mới, không mục điều hướng mới (§19 · §39: ngữ cảnh địa điểm thuộc DỰ ÁN, không phải
 * một app riêng).
 *
 * ⛔ KHÔNG BỊA. Pha 1 chưa có dữ liệu khí hậu/gió/vật liệu ⇒ ở đây **chỉ hiện thứ tính được tất
 * định từ hình học mặt trời** (`lib/site/solar.ts`). Thà bốn tín hiệu thật còn hơn mười hai ô đẹp
 * mà nửa số là phỏng đoán không nguồn.
 *
 * §6 — vị trí cấp thành phố phải NÓI RA là cấp thành phố; cấm bày như số tại công trường.
 */

import { useEffect, useMemo, useState } from 'react';
import { MapPin, Sunrise, Sunset, Sun, Compass, ChevronDown, PenLine } from 'lucide-react';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { binhMinhHoangHon, trangThaiNang } from '@/lib/site/solar';
import { coToaDo } from '@/lib/site/types';
import { useHoSoDiaDiem } from './dia-diem-client';
import { hienToaDo } from './doc-toa-do';
import NhapViTri from './NhapViTri';

/** 13.5 → '13:30'. */
function gio(h: number | null | undefined): string {
  if (h === null || h === undefined || !Number.isFinite(h)) return '—';
  const t = Math.round(h * 60);
  return `${String(Math.floor(t / 60) % 24).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
}

const NHAN = 'text-[9px] font-bold uppercase leading-[1.6] tracking-wide text-[var(--t4)]';

function TinHieu({ icon, ten, giaTri }: { icon: React.ReactNode; ten: string; giaTri: string }) {
  return (
    <div className="rounded-[10px] border border-[var(--border)] bg-[var(--field)] px-2.5 py-2">
      <p className={cn(NHAN, 'flex items-center gap-1')}>
        {icon}
        {ten}
      </p>
      <p className="mt-0.5 text-[13px] font-semibold tabular-nums leading-[1.4] text-[var(--t1)]">{giaTri}</p>
    </div>
  );
}

export function TomTatDiaDiem({ duAnId }: { duAnId: string }) {
  const tr = useT();
  const { hoSo, dangTai } = useHoSoDiaDiem(duAnId);
  const [moNhap, setMoNhap] = useState(false);
  const [moDayDu, setMoDayDu] = useState(false);

  // Ngày lấy SAU khi gắn vào DOM. `new Date()` lúc render sẽ khác nhau giữa máy chủ và trình
  // duyệt ⇒ hydration mismatch thật (đúng cảnh báo đã ghi ở `scene3d-ui.ts`).
  const [homNay, setHomNay] = useState<Date | null>(null);
  useEffect(() => setHomNay(new Date()), []);

  const coVT = coToaDo(hoSo);

  const nang = useMemo(() => {
    if (!coVT || !homNay) return null;
    const mocGio = binhMinhHoangHon(hoSo, homNay);
    const trua = trangThaiNang(hoSo, homNay, 12);
    const chieu = trangThaiNang(hoSo, homNay, 15);
    return { mocGio, trua, chieu };
  }, [coVT, homNay, hoSo]);

  /* ── Chưa có vị trí: MỜI, KHÔNG CHẶN (§5) ─────────────────────────────────────────────────── */
  if (!dangTai && !coVT && hoSo.viTri.doChinhXac === 'chua-ro') {
    return (
      <section className="rounded-[14px] border border-[var(--border)] bg-[var(--panel)] p-3.5" aria-label={tr('Địa điểm dự án', 'Project site')}>
        <div className="flex flex-wrap items-center gap-2">
          <MapPin size={14} className="flex-none text-[var(--t4)]" />
          <p className="min-w-0 flex-1 text-[12px] leading-relaxed text-[var(--t3)]">
            {tr('Thêm vị trí để InteriorFlow hiểu khí hậu và ngữ cảnh dự án.', 'Add a location so InteriorFlow understands the project’s climate and context.')}
          </p>
          <button
            type="button"
            onClick={() => setMoNhap((v) => !v)}
            aria-expanded={moNhap}
            className="flex h-[var(--tap)] flex-none items-center gap-1.5 rounded-[10px] border border-[var(--border)] bg-[var(--field)] px-2.5 text-[11px] font-semibold text-[var(--t2)] transition-colors hover:border-[var(--accent-ring)] hover:text-[var(--accent)]"
          >
            <PenLine size={18} />
            {moNhap ? tr('Để sau', 'Later') : tr('Thêm vị trí', 'Add location')}
          </button>
        </div>
        {moNhap && (
          <div className="mt-2.5 border-t border-[var(--border)] pt-2.5">
            <NhapViTri duAnId={duAnId} onLuuXong={(kq) => kq.ok && setMoNhap(false)} />
          </div>
        )}
      </section>
    );
  }

  const capThanhPho = hoSo.viTri.doChinhXac === 'thanh-pho' || hoSo.viTri.doChinhXac === 'vung';
  const gocMatDung = nang?.chieu?.gocToiMatDungDeg ?? null;
  const doDaiNgay =
    nang?.mocGio?.binhMinh != null && nang?.mocGio?.hoangHon != null
      ? nang.mocGio.hoangHon - nang.mocGio.binhMinh
      : null;

  /* ── HỆ QUẢ: chỉ suy từ hình học, mỗi câu truy được về con số ngay phía trên ───────────────── */
  const heQua: string[] = [];
  if (gocMatDung !== null && gocMatDung < 45)
    heQua.push(
      tr(
        `Chiều 15:00 nắng chiếu gần trực diện mặt đứng chính (lệch ${Math.round(gocMatDung)}°) — che nắng phương đứng có tác dụng hơn ô văng ngang.`,
        `At 15:00 the sun strikes the main façade nearly head-on (${Math.round(gocMatDung)}° off) — vertical shading works better than a horizontal overhang here.`,
      ),
    );
  if ((nang?.trua?.caoDoDeg ?? 0) > 70)
    heQua.push(
      tr(
        `Trưa nay mặt trời cao ${Math.round(nang?.trua?.caoDoDeg ?? 0)}° — gần đỉnh đầu, ô văng ngang che được phần lớn nắng giữa ngày.`,
        `Today the midday sun reaches ${Math.round(nang?.trua?.caoDoDeg ?? 0)}° — near overhead, so a horizontal overhang blocks most midday sun.`,
      ),
    );
  if (gocMatDung === null && coVT)
    heQua.push(tr('Chưa khai hướng mặt đứng chính nên chưa nói được nắng chiếu vào mặt nào.', 'The main façade orientation is not recorded, so façade-level sun exposure cannot be stated yet.'));

  return (
    <section className="rounded-[14px] border border-[var(--border)] bg-[var(--panel)] p-3.5" aria-label={tr('Địa điểm dự án', 'Project site')}>
      {/* ── ① ĐỊA ĐIỂM ── */}
      <div className="flex flex-wrap items-start gap-2">
        <MapPin size={14} className="mt-[2px] flex-none text-[var(--t4)]" />
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold leading-[1.4] text-[var(--t1)]">
            {hoSo.viTri.diaChi || hoSo.viTri.tinh_thanh || hienToaDo(hoSo.viTri.viDo, hoSo.viTri.kinhDo) || tr('Chưa đặt tên địa điểm', 'Unnamed location')}
          </p>
          <p className="mt-0.5 font-mono text-[10.5px] leading-[1.6] text-[var(--t4)]">{hienToaDo(hoSo.viTri.viDo, hoSo.viTri.kinhDo) || '—'}</p>
          {capThanhPho && (
            <p className="mt-1 text-[10.5px] leading-relaxed text-[var(--warning)]">
              {tr('Phân tích hiện ở cấp thành phố.', 'Analysis is currently at city level.')}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => setMoNhap((v) => !v)}
          aria-expanded={moNhap}
          className="flex h-[var(--tap)] flex-none items-center gap-1.5 rounded-[10px] border border-[var(--border)] bg-[var(--field)] px-2.5 text-[11px] font-medium text-[var(--t3)] transition-colors hover:border-[var(--accent-ring)] hover:text-[var(--accent)]"
        >
          <PenLine size={18} />
          {moNhap ? tr('Đóng', 'Close') : tr('Sửa', 'Edit')}
        </button>
      </div>

      {moNhap && (
        <div className="mt-2.5 border-t border-[var(--border)] pt-2.5">
          <NhapViTri duAnId={duAnId} onLuuXong={(kq) => kq.ok && setMoNhap(false)} />
        </div>
      )}

      {/* ── ② TÍN HIỆU — 4 ô, không phải mười hai ── */}
      {coVT && (
        <>
          <p className={cn(NHAN, 'mt-3')}>{tr('Tín hiệu', 'Signals')}</p>
          <div className="mt-1 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
            <TinHieu icon={<Sunrise size={14} />} ten={tr('Bình minh', 'Sunrise')} giaTri={gio(nang?.mocGio?.binhMinh)} />
            <TinHieu icon={<Sunset size={14} />} ten={tr('Hoàng hôn', 'Sunset')} giaTri={gio(nang?.mocGio?.hoangHon)} />
            <TinHieu
              icon={<Sun size={14} />}
              ten={tr('Nắng trưa', 'Midday sun')}
              giaTri={nang?.trua ? `${Math.round(nang.trua.caoDoDeg)}°` : '—'}
            />
            <TinHieu
              icon={<Compass size={14} />}
              ten={tr('Mặt đứng chính', 'Main façade')}
              giaTri={
                typeof hoSo.huong.matDungChinhDeg === 'number'
                  ? `${Math.round(hoSo.huong.matDungChinhDeg)}°`
                  : tr('chưa khai', 'not set')
              }
            />
          </div>
          <p className="mt-1 text-[9.5px] leading-relaxed text-[var(--t5)]">
            {tr('Tính cho hôm nay từ toạ độ dự án — hình học mặt trời tất định, không phải dự báo.', 'Computed for today from the project coordinates — deterministic solar geometry, not a forecast.')}
          </p>

          {/* ── ③ HỆ QUẢ ── */}
          {heQua.length > 0 && (
            <>
              <p className={cn(NHAN, 'mt-3')}>{tr('Hệ quả', 'What it means')}</p>
              <ul className="mt-1 space-y-1">
                {heQua.map((c) => (
                  <li key={c} className="border-l-2 border-[var(--border)] pl-2 text-[11.5px] leading-relaxed text-[var(--t2)]">
                    {c}
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}

      {/* ── ④ QUYẾT ĐỊNH — máy đề xuất, NGƯỜI quyết (§4) ── */}
      <p className={cn(NHAN, 'mt-3')}>{tr('Quyết định', 'Decisions')}</p>
      {hoSo.deXuat.length === 0 ? (
        <p className="mt-1 text-[11px] leading-relaxed text-[var(--t4)]">
          {tr('Chưa có đề xuất nào chờ duyệt. Đề xuất chỉ thành ngữ cảnh dự án sau khi bạn nhận.', 'No proposals awaiting review. A proposal only becomes project context once you accept it.')}
        </p>
      ) : (
        <ul className="mt-1 space-y-1">
          {hoSo.deXuat.slice(0, 3).map((d) => (
            <li key={d.id} className="flex items-baseline gap-1.5 text-[11.5px] leading-relaxed text-[var(--t2)]">
              <span className={NHAN}>
                {d.trangThai === 'da-nhan' ? tr('đã nhận', 'accepted') : d.trangThai === 'da-tu-choi' ? tr('đã từ chối', 'declined') : tr('chờ duyệt', 'pending')}
              </span>
              {d.tieuDe}
            </li>
          ))}
        </ul>
      )}

      {/* ── Phần còn lại: MỞ TẠI CHỖ, không route mới ── */}
      {coVT && (
        <>
          <button
            type="button"
            onClick={() => setMoDayDu((v) => !v)}
            aria-expanded={moDayDu}
            className="mt-2.5 flex h-[var(--tap)] items-center gap-1 text-[11px] font-medium text-[var(--t3)] transition-colors hover:text-[var(--accent)]"
          >
            <ChevronDown size={18} className={cn('transition-transform', moDayDu && 'rotate-180')} />
            {moDayDu ? tr('Thu gọn', 'Show less') : tr('Xem phân tích đầy đủ', 'See full analysis')}
          </button>
          {moDayDu && (
            <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 border-t border-[var(--border)] pt-2 text-[11px] leading-relaxed">
              {[
                [tr('Độ dài ngày', 'Day length'), doDaiNgay === null ? '—' : `${Math.floor(doDaiNgay)}h ${Math.round((doDaiNgay % 1) * 60)}m`],
                [tr('Múi giờ', 'Time zone'), hoSo.viTri.muiGio ?? tr('suy từ kinh độ', 'derived from longitude')],
                [tr('Độ chính xác vị trí', 'Location precision'), hoSo.viTri.doChinhXac],
                [tr('Bắc thật', 'True north'), typeof hoSo.huong.bacThatDeg === 'number' ? `${Math.round(hoSo.huong.bacThatDeg)}°` : tr('chưa khai', 'not set')],
                [tr('Nắng chiều 15:00 lệch mặt đứng', 'Façade offset at 15:00'), gocMatDung === null ? '—' : `${Math.round(gocMatDung)}°`],
                [tr('Sự thật đã thu thập', 'Facts recorded'), String(Object.keys(hoSo.suThat).length)],
              ].map(([k, v]) => (
                <div key={k} className="contents">
                  <dt className="text-[var(--t4)]">{k}</dt>
                  <dd className="text-[var(--t2)]">{v}</dd>
                </div>
              ))}
            </dl>
          )}
        </>
      )}
    </section>
  );
}

export default TomTatDiaDiem;
