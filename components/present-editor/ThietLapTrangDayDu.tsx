'use client';

/**
 * components/present-editor/ThietLapTrangDayDu.tsx — THIẾT LẬP TRANG · ĐẦY ĐỦ.
 *
 * 🔴 ĐÂY LÀ MỘT **LOẠI BỀ MẶT KHÁC**, KHÔNG PHẢI PANEL PHÌNH TO (luật 20/08: *kích cỡ quyết định
 * LOẠI bề mặt, không chỉ toạ độ*). Nó chiếm trọn không gian làm việc, có thanh tiêu đề riêng và
 * đường quay về — người dùng biết mình đã **bước vào một chế độ**, không phải mở một hộp thoại to.
 *
 * ⛔ CẤM đặt biểu mẫu dài ra GIỮA MÀN ⇒ không dùng modal canh giữa. Bề mặt này **phủ vùng làm
 * việc** (inset), nền ĐẶC, và tôn ti theo §13: **TỜ GIẤY LÀ CHÍNH — bảng núm là phụ**, nên cột
 * trái (tờ) rộng hơn hẳn cột phải (núm), không phải hai cột bằng nhau.
 *
 * Bốn nhịp: mọc từ nguồn → nở ra → an vị → trở về ngữ cảnh. Vào bằng `scale`+`opacity` từ mép
 * phải (nơi thanh NHANH đứng), thoát thì thu ngược về đó. `prefers-reduced-motion` ⇒ hiện thẳng.
 */

import { useEffect, useState } from 'react';
import { ChevronLeft, Ruler } from 'lucide-react';
import { DUONG_CONG, giamChuyenDong, thoiLuong } from '@/lib/ui/nhip';
import { paperSizeMm } from '@/lib/cad/model';
import { nhanTyLe, type ToBanVe } from '@/lib/present-editor/to-ban-ve';
import { MONO } from './thiet-lap-trang-parts';

/**
 * Năng lực THẬT của đường xuất. `string` ⇒ CHƯA làm được, núm hiện mờ kèm ĐÚNG lý do đó.
 * `false` ⇒ có thật. Cấm khai `false` trước khi thực sự nối được đường chạy.
 */
export interface KhaNang {
  khoTuyChinh?: string | false;
  tranLe?: string | false;
  luoiDuongDan?: string | false;
  vungIn?: string | false;
  bangNetIn?: string | false;
  mauInHoacXam?: string | false;
  vectorHoacRaster?: string | false;
  dpi?: string | false;
  mayIn?: string | false;
  daiTrang?: string | false;
  soBan?: string | false;
}

export interface ThietLapTrangDayDuProps {
  mo: boolean;
  onDong: () => void;
  to: ToBanVe | null;
  khaNang?: KhaNang;
  onMoBangNet?: () => void;
}

export default function ThietLapTrangDayDu({
  mo,
  onDong,
  to,
  khaNang = {},
  onMoBangNet,
}: ThietLapTrangDayDuProps) {
  const [daNo, setDaNo] = useState(false);
  const giam = giamChuyenDong();
  const ms = thoiLuong(260, giam);

  useEffect(() => {
    if (!mo) {
      setDaNo(false);
      return;
    }
    const id = requestAnimationFrame(() => setDaNo(true));
    return () => cancelAnimationFrame(id);
  }, [mo]);

  useEffect(() => {
    if (!mo) return;
    const onPhim = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDong();
    };
    window.addEventListener('keydown', onPhim);
    return () => window.removeEventListener('keydown', onPhim);
  }, [mo, onDong]);

  if (!mo || !to) return null;

  const [rongMm, caoMm] = paperSizeMm(to.khoGiay, to.huong);
  const ngang = rongMm >= caoMm;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Thiết lập trang — đầy đủ"
      style={{
        position: 'fixed',
        // Phủ VÙNG LÀM VIỆC, chừa hai dải thường trực: Vitals mép trên, dải hành động mép dưới.
        // Chừa ở đây là CỐ Ý — chế độ này chiếm không gian làm việc, không chiếm cả app.
        inset: `${DAI_TREN}px 0 ${DAI_DUOI}px 0`,
        zIndex: 40,
        background: 'var(--bg)',
        display: 'grid',
        gridTemplateRows: 'auto 1fr',
        // nhịp ③→④: nở ra rồi an vị; đóng thì thu ngược về mép phải (nơi thanh NHANH đứng)
        transformOrigin: '100% 50%',
        transform: daNo ? 'scale(1)' : 'scale(.985)',
        opacity: daNo ? 1 : 0,
        transition: giam ? 'none' : `transform ${ms}ms ${DUONG_CONG}, opacity ${ms}ms ${DUONG_CONG}`,
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 16px',
          borderBottom: '1px solid var(--vien-mo)',
          background: 'var(--panel)',
        }}
      >
        <button
          type="button"
          onClick={onDong}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            padding: '5px 10px',
            minHeight: 'var(--tap, 32px)',
            borderRadius: 'var(--r-2)',
            border: '1px solid var(--vien-mo)',
            background: 'var(--card)',
            color: 'var(--t1)',
            fontSize: 12,
            cursor: 'pointer',
          }}
        >
          <ChevronLeft size={14} /> Xong
        </button>
        <strong style={{ fontSize: 13, color: 'var(--t1)' }}>Thiết lập trang — đầy đủ</strong>
        <span style={{ fontFamily: MONO, fontSize: 11, color: 'var(--t3)' }}>
          {to.nhan} · {to.khoGiay} {ngang ? 'ngang' : 'dọc'} · {nhanTyLe(to.tyLe)}
        </span>
      </header>

      {/* §13 THỨ BẬC: tờ giấy CHÍNH (cột rộng) — bảng núm PHỤ (cột hẹp). Không phải 50/50. */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 300px', minHeight: 0 }}>
        <div
          style={{
            display: 'grid',
            placeItems: 'center',
            padding: 24,
            minHeight: 0,
            overflow: 'auto',
            background: 'var(--bg)',
          }}
        >
          <ToGiay rongMm={rongMm} caoMm={caoMm} to={to} />
        </div>

        <aside
          style={{
            borderLeft: '1px solid var(--vien-mo)',
            background: 'var(--panel)',
            padding: 14,
            overflow: 'auto',
            minHeight: 0,
            display: 'grid',
            gap: 7,
            alignContent: 'start',
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '.06em',
              textTransform: 'uppercase',
              color: 'var(--t3)',
            }}
          >
            Thiết lập sâu
          </div>
          <NumSau nhan="Khổ tuỳ chỉnh" ly={khaNang.khoTuyChinh} />
          <NumSau nhan="Tràn lề" ly={khaNang.tranLe} />
          <NumSau nhan="Lưới · đường dẫn" ly={khaNang.luoiDuongDan} />
          <NumSau nhan="Vùng in" ly={khaNang.vungIn} />
          <NumSau nhan="Chế độ độ dày nét" ly={khaNang.bangNetIn} onClick={onMoBangNet} icon={<Ruler size={13} />} />
          <NumSau nhan="Màu · xám · đơn sắc" ly={khaNang.mauInHoacXam} />
          <NumSau nhan="Vector hay raster" ly={khaNang.vectorHoacRaster} />
          <NumSau nhan="DPI" ly={khaNang.dpi} />
          <NumSau nhan="Máy in · máy vẽ" ly={khaNang.mayIn} />
          <NumSau nhan="Dải trang" ly={khaNang.daiTrang} />
          <NumSau nhan="Số bản" ly={khaNang.soBan} />
        </aside>
      </div>
    </div>
  );
}

/** Dải thường trực không được phủ — Vitals trên, dải hành động dưới. */
const DAI_TREN = 48;
const DAI_DUOI = 44;

/**
 * Tờ giấy đúng TỈ LỆ HÌNH HỌC thật của khổ (không phải khung vuông cho đẹp) + lề thật.
 *
 * NỘI DUNG THẬT: `to.anh` (dataURL) do 2D/3D gửi kèm tờ khi Handoff (`to-ban-ve.ts`) — vẽ NGUYÊN
 * VẸN bên trong vùng lề, `object-fit: contain` (không crop, không bóp méo tỉ lệ nguồn). Đổi
 * `khoGiay`/`huong`/`le`/`tyLe` ở panel Thiết lập nhanh (`ThietLapTrang.tsx`, ghi vào CÙNG `to`
 * qua `onDoiTo`) làm khung/lề đo lại NGAY vì component này thuần đọc từ props — không cache riêng.
 * `to.anh` rỗng (2D/3D chưa gửi ảnh xem trước) ⇒ GIỮ khung trống + chữ thật, ĐÚNG luật đã ghi ở
 * model: "Không có thì Trình chiếu vẽ khung trống, KHÔNG bịa hình".
 */
function ToGiay({ rongMm, caoMm, to }: { rongMm: number; caoMm: number; to: ToBanVe }) {
  const CAO_TOI_DA = 460;
  const ti = Math.min(CAO_TOI_DA / caoMm, 640 / rongMm);
  const w = Math.round(rongMm * ti);
  const h = Math.round(caoMm * ti);
  const leP = Math.max(2, Math.round(to.le * ti));
  return (
    <div
      style={{
        width: w,
        height: h,
        background: 'var(--card)',
        border: '1px solid var(--vien-mo)',
        boxShadow: 'var(--shadow-sheet, 0 8px 28px -12px rgba(0,0,0,.35))',
        position: 'relative',
        display: 'grid',
        placeItems: 'center',
      }}
    >
      {to.anh ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={to.anh}
          alt={`${to.nhan} — xem trước`}
          style={{
            position: 'absolute',
            inset: leP,
            width: `calc(100% - ${leP * 2}px)`,
            height: `calc(100% - ${leP * 2}px)`,
            objectFit: 'contain',
            background: 'var(--bg)',
          }}
        />
      ) : (
        <p
          style={{
            margin: 0,
            padding: '0 24px',
            textAlign: 'center',
            fontSize: 11,
            lineHeight: 1.6,
            color: 'var(--t3)',
            maxWidth: 320,
          }}
        >
          Chưa có ảnh xem trước từ nguồn — 2D/3D gửi tờ này chưa kèm ảnh.
          <br />
          <span style={{ fontFamily: MONO }}>
            {rongMm} × {caoMm} mm · lề {to.le} mm · {nhanTyLe(to.tyLe)}
          </span>
        </p>
      )}
      {/* biên lề — nét đứt, là đường DỰNG chứ không phải nội dung, LUÔN vẽ trên ảnh */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: leP,
          border: '1px dashed var(--vien-mo)',
          pointerEvents: 'none',
        }}
      />
      {to.anh && (
        <span
          style={{
            position: 'absolute',
            bottom: 4,
            right: 6,
            fontFamily: MONO,
            fontSize: 9,
            color: 'var(--t3)',
            background: 'color-mix(in srgb, var(--card) 80%, transparent)',
            padding: '1px 5px',
            borderRadius: 3,
          }}
        >
          {rongMm} × {caoMm} mm · lề {to.le} mm · {nhanTyLe(to.tyLe)}
        </span>
      )}
    </div>
  );
}

/**
 * Một núm sâu. `ly` chuỗi ⇒ mờ kèm đúng lý do đó; `false` + có `onClick` ⇒ bấm được.
 * Lý do đi `aria-describedby`, KHÔNG dùng `title` (title câm trên cảm ứng, Tab bỏ qua nút disabled).
 */
function NumSau({
  nhan,
  ly,
  onClick,
  icon,
}: {
  nhan: string;
  ly?: string | false;
  onClick?: () => void;
  icon?: React.ReactNode;
}) {
  const lyDo =
    ly === false
      ? onClick
        ? null
        : 'Năng lực này có thật trong app nhưng màn Trình chiếu chưa nối nút mở.'
      : ly || 'Chưa nối vào đường xuất — chưa bày núm cho thứ chưa chạy được.';
  const moKhoa = !lyDo;
  const id = `sau-${nhan.replace(/\s+/g, '-')}-ly`;
  return (
    <div>
      <button
        type="button"
        aria-disabled={!moKhoa}
        aria-describedby={!moKhoa ? id : undefined}
        onClick={moKhoa ? onClick : undefined}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          padding: '7px 9px',
          minHeight: 'var(--tap, 32px)',
          borderRadius: 'var(--r-2)',
          border: '1px solid var(--vien-mo)',
          background: 'var(--card)',
          color: 'var(--t1)',
          fontSize: 11,
          textAlign: 'left',
          cursor: moKhoa ? 'pointer' : 'default',
          opacity: moKhoa ? 1 : 'var(--mo-vo-hieu)',
        }}
      >
        {icon}
        {nhan}
      </button>
      {!moKhoa && (
        <p id={id} style={{ margin: '3px 0 0 9px', fontSize: 10, lineHeight: 1.45, color: 'var(--t3)' }}>
          {lyDo}
        </p>
      )}
    </div>
  );
}
