'use client';

/**
 * components/present-editor/ThietLapTrang.tsx — THIẾT LẬP TRANG · NHANH.
 *
 * ⭐ Đây là bề mặt phân vai nhìn thấy được: 2D/3D sáng tác nội dung · Trình chiếu dàn trang và
 * phát hành. Mọi quyết định về TRANG GIẤY sống ở chặng Trình chiếu, không rải mỗi chặng một hộp.
 *
 * 🔴 TÁCH VAI (Hoà chốt 20/08) — Thiết lập trang là HAI CHỖ, không phải một panel:
 *   · **NHANH** (tệp này): khổ · hướng · tỉ lệ · lề · khung tên ⇒ **inspector BÊN CẠNH**, tờ giấy
 *     và canvas VẪN THẤY.
 *   · **ĐẦY ĐỦ** (`ThietLapTrangDayDu.tsx`): 11 mục sâu ⇒ **chế độ toàn không gian làm việc**.
 * Trước đó tệp này ôm cả hai vai (mục "Thiết lập sâu" bung ngay trong panel) — sai luật *kích cỡ
 * quyết định LOẠI bề mặt*: bảng lớn không được phép "vẫn là panel nhưng to hơn", nó phải ĐỔI LOẠI.
 *
 * ⛔ SÁU VÙNG CẤM CHE — vì sao đây là cột NEO chứ không phải bề mặt nổi tự tìm chỗ:
 *   canvas chính · vật đang chọn · vật nguồn · vùng con trỏ đang thao tác · **Vitals (mép trên)**
 *   · **dải hành động (mép dưới)**. Hai cái cuối là vùng cấm CỨNG.
 *   Bề mặt nổi mọc-từ-nguồn (`BeMatNoi`) đặt mình theo hộp nguồn rồi chỉ kẹp trong mép cửa sổ —
 *   nó KHÔNG biết hai dải thường trực kia, nên hoàn toàn có thể đè lên. Cột neo có `top`/`bottom`
 *   chừa sẵn thì **không có đường nào che được**, đúng nghĩa vùng cấm cứng chứ không phải ưu tiên
 *   mềm. (Không sửa `BeMatNoi` — nó là nguyên thể dùng chung, ngoài vùng ghi của lượt này.)
 *
 * 🔴 VẬT LIỆU: biểu mẫu kỹ thuật ⇒ nền ĐẶC (`--panel`), không kính, không lớp bán trong suốt —
 * bảng số nhoè là mất uy tín nghề.
 *
 * Bốn nhịp: mọc từ nguồn → nở ra → an vị → trở về nguồn. Trượt vào từ mép phải (nơi nút nguồn
 * đứng) rồi an vị; đóng thì thu ngược về đó. `prefers-reduced-motion` ⇒ hiện thẳng.
 */

import { useEffect, useState } from 'react';
import { ChevronRight, X } from 'lucide-react';
import { DUONG_CONG, giamChuyenDong, thoiLuong } from '@/lib/ui/nhip';
import { paperSizeMm, type PaperKey, type PaperOrientation } from '@/lib/cad/model';
import {
  TY_LE_BAN_VE,
  NHAN_TRANG_THAI,
  nhanTyLe,
  tyLeApDung,
  vungInMm,
  type ToBanVe,
  type TrangThaiNguon,
  type LoiXuNguonDoi,
} from '@/lib/present-editor/to-ban-ve';
import { Muc, HangNut, Chip, Ghi, OKhungTen, oNhap, MONO } from './thiet-lap-trang-parts';

const PAPER_KEYS: PaperKey[] = ['A0', 'A1', 'A2', 'A3', 'A4'];

/** Hai dải thường trực KHÔNG được che: Vitals mép trên · dải hành động mép dưới. */
const DAI_TREN = 48;
const DAI_DUOI = 44;
const RONG = 300;

export interface ThietLapTrangProps {
  mo: boolean;
  onDong: () => void;
  to: ToBanVe | null;
  onDoiTo: (patch: Partial<ToBanVe>) => void;
  /** trạng thái nguồn tính từ `trangThaiNguon()` — bề mặt này chỉ HIỂN THỊ, không tự sửa tờ. */
  trangThai: TrangThaiNguon;
  /** người chọn cách xử khi nguồn đổi. Không truyền = chưa nối, ba nút hiện mờ. */
  onXuLyNguonDoi?: (loi: LoiXuNguonDoi) => void;
  /** mở chế độ ĐẦY ĐỦ (toàn không gian làm việc). */
  onMoDayDu: () => void;
}

export default function ThietLapTrang({
  mo,
  onDong,
  to,
  onDoiTo,
  trangThai,
  onXuLyNguonDoi,
  onMoDayDu,
}: ThietLapTrangProps) {
  const [tuyChinh, setTuyChinh] = useState('');
  const [daNo, setDaNo] = useState(false);
  const giam = giamChuyenDong();
  const ms = thoiLuong(220, giam);

  useEffect(() => {
    if (!mo) {
      setDaNo(false);
      return;
    }
    const id = requestAnimationFrame(() => setDaNo(true));
    return () => cancelAnimationFrame(id);
  }, [mo]);

  if (!mo || !to) return null;

  const [rongMm, caoMm] = paperSizeMm(to.khoGiay, to.huong);
  const ap = tyLeApDung(to.tyLe, to.noiDungMm, vungInMm({ rongMm, caoMm }, to.le));

  return (
    <aside
      aria-label="Thiết lập trang"
      style={{
        position: 'fixed',
        top: DAI_TREN,
        bottom: DAI_DUOI,
        right: 0,
        width: RONG,
        zIndex: 30,
        background: 'var(--panel)',
        borderLeft: '1px solid var(--vien-mo)',
        overflow: 'auto',
        // nhịp: mọc từ nguồn (mép phải) → nở ra → an vị; đóng thu ngược về đó
        transform: daNo ? 'translateX(0)' : `translateX(${RONG}px)`,
        transition: giam ? 'none' : `transform ${ms}ms ${DUONG_CONG}`,
      }}
    >
      <div style={{ display: 'grid', gap: 14, padding: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <strong style={{ fontSize: 12, color: 'var(--t1)' }}>Thiết lập trang</strong>
          <button
            type="button"
            onClick={onDong}
            aria-label="Đóng thiết lập trang"
            style={{
              marginLeft: 'auto',
              display: 'grid',
              placeItems: 'center',
              width: 'var(--tap, 32px)',
              height: 'var(--tap, 32px)',
              borderRadius: 'var(--r-2)',
              border: '1px solid var(--vien-mo)',
              background: 'var(--card)',
              color: 'var(--t2)',
              cursor: 'pointer',
            }}
          >
            <X size={14} />
          </button>
        </div>

        {/* VIỆC 7 — nguồn đổi thì ĐÁNH DẤU, không tự sửa tờ. */}
        <TrangThaiNguonHang trangThai={trangThai} daPhatHanh={!!to.daPhatHanh} onXuLy={onXuLyNguonDoi} />

        <Muc nhan="Khổ giấy">
          <HangNut>
            {PAPER_KEYS.map((k) => (
              <Chip key={k} chon={to.khoGiay === k} onClick={() => onDoiTo({ khoGiay: k })}>
                {k}
              </Chip>
            ))}
          </HangNut>
        </Muc>

        <Muc nhan="Hướng">
          <HangNut>
            {(['landscape', 'portrait'] as PaperOrientation[]).map((h) => (
              <Chip key={h} chon={to.huong === h} onClick={() => onDoiTo({ huong: h })}>
                {h === 'landscape' ? 'Ngang' : 'Dọc'}
              </Chip>
            ))}
          </HangNut>
          <Ghi>
            {rongMm} × {caoMm} mm
          </Ghi>
        </Muc>

        {/* VIỆC 4 — "Vừa khung" là LỰA CHỌN của người, không phải đường thoái lui của máy. */}
        <Muc nhan="Tỉ lệ bản vẽ">
          <HangNut>
            {TY_LE_BAN_VE.map((n) => (
              <Chip
                key={n}
                chon={to.tyLe.kieu !== 'vua-khung' && to.tyLe.n === n}
                onClick={() => onDoiTo({ tyLe: { kieu: 'chuan', n } })}
              >
                1:{n}
              </Chip>
            ))}
            <Chip chon={to.tyLe.kieu === 'vua-khung'} onClick={() => onDoiTo({ tyLe: { kieu: 'vua-khung' } })}>
              Vừa khung
            </Chip>
          </HangNut>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
            <span style={{ fontSize: 11, color: 'var(--t3)' }}>Tuỳ chỉnh 1:</span>
            <input
              value={tuyChinh}
              onChange={(e) => setTuyChinh(e.target.value.replace(/[^0-9]/g, ''))}
              onBlur={() => {
                const n = parseInt(tuyChinh, 10);
                if (Number.isFinite(n) && n > 0) onDoiTo({ tyLe: { kieu: 'tuy-chinh', n } });
              }}
              inputMode="numeric"
              aria-label="Tỉ lệ tuỳ chỉnh, mẫu số của 1 trên N"
              placeholder={to.tyLe.kieu === 'tuy-chinh' ? String(to.tyLe.n) : '—'}
              style={oNhap}
            />
            <span style={{ fontFamily: MONO, fontSize: 11, color: 'var(--t2)', marginLeft: 'auto' }}>
              đang in {nhanTyLe(to.tyLe)}
            </span>
          </div>
          {ap.canhBao && (
            <p
              role="status"
              style={{
                margin: '8px 0 0',
                padding: '7px 9px',
                borderRadius: 'var(--r-2)',
                background: 'color-mix(in srgb, var(--warning) 12%, transparent)',
                border: '1px solid color-mix(in srgb, var(--warning) 34%, transparent)',
                color: 'var(--t1)',
                fontSize: 11,
                lineHeight: 1.5,
              }}
            >
              {ap.canhBao}
            </p>
          )}
        </Muc>

        <Muc nhan="Lề">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="range"
              min={0}
              max={30}
              value={to.le}
              onChange={(e) => onDoiTo({ le: Number(e.target.value) })}
              aria-label="Lề trang, milimét"
              style={{ flex: 1, accentColor: 'var(--accent)' }}
            />
            <span style={{ fontFamily: MONO, fontSize: 11, color: 'var(--t2)', minWidth: 34 }}>{to.le} mm</span>
          </div>
        </Muc>

        <Muc nhan="Khung tên">
          <div style={{ display: 'grid', gap: 6 }}>
            <OKhungTen
              nhan="Tên bản vẽ"
              gt={to.khungTen.tenBanVe}
              doi={(v) => onDoiTo({ khungTen: { ...to.khungTen, tenBanVe: v } })}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              <OKhungTen
                nhan="Số tờ"
                gt={to.khungTen.soTo}
                doi={(v) => onDoiTo({ khungTen: { ...to.khungTen, soTo: v } })}
              />
              <OKhungTen
                nhan="Bản sửa"
                gt={to.khungTen.banSua}
                doi={(v) => onDoiTo({ khungTen: { ...to.khungTen, banSua: v } })}
              />
            </div>
          </div>
        </Muc>

        {/* Cửa sang chế độ ĐẦY ĐỦ — người dùng CHỦ ĐỘNG mở, không tự bung. */}
        <button
          type="button"
          onClick={onMoDayDu}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 10px',
            minHeight: 'var(--tap, 32px)',
            borderRadius: 'var(--r-2)',
            border: '1px solid var(--vien-mo)',
            background: 'var(--card)',
            color: 'var(--t1)',
            fontSize: 12,
            cursor: 'pointer',
          }}
        >
          Thiết lập đầy đủ
          <ChevronRight size={14} style={{ marginLeft: 'auto' }} />
        </button>
      </div>
    </aside>
  );
}

/* ── VIỆC 7 · hàng trạng thái nguồn ─────────────────────────────────────────────── */

function TrangThaiNguonHang({
  trangThai,
  daPhatHanh,
  onXuLy,
}: {
  trangThai: TrangThaiNguon;
  daPhatHanh: boolean;
  onXuLy?: (loi: LoiXuNguonDoi) => void;
}) {
  const mau =
    trangThai === 'hien-hanh' ? 'var(--success)' : trangThai === 'cu' ? 'var(--warning)' : 'var(--t3)';
  return (
    <div
      style={{
        padding: '8px 10px',
        borderRadius: 'var(--r-2)',
        // ⛔ ĐẶC — dòng mang trạng thái nguồn là chỗ ít được phép nhoè nhất trong cả bề mặt.
        background: 'var(--card)',
        border: '1px solid var(--vien-mo)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        {/* chấm + CHỮ — màu không bao giờ là kênh duy nhất */}
        <span
          aria-hidden
          style={{ width: 8, height: 8, borderRadius: 'var(--r-full)', background: mau, flex: '0 0 auto' }}
        />
        <strong style={{ fontSize: 12, color: 'var(--t1)' }}>Nguồn: {NHAN_TRANG_THAI[trangThai]}</strong>
        {daPhatHanh && (
          <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--t3)', fontFamily: MONO }}>
            đã phát hành
          </span>
        )}
      </div>
      {trangThai === 'cu' && (
        <>
          <p style={{ margin: '6px 0 7px', fontSize: 11, lineHeight: 1.5, color: 'var(--t2)' }}>
            Bản vẽ nguồn đã đổi từ lúc gửi. Tờ này giữ nguyên — bạn chọn cách xử.
          </p>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <NutXu
              nhan="Cập nhật"
              loi="cap-nhat"
              onXuLy={onXuLy}
              ly={
                daPhatHanh
                  ? 'Tờ đã phát hành — máy không tự cập nhật. Tạo bản sửa mới rồi cập nhật ở đó.'
                  : null
              }
            />
            {/* ⛔ Chưa có màn so sánh ⇒ nút MỜ kèm lý do thật, không bày nút bấm-không-ra-gì. */}
            <NutXu
              nhan="So sánh"
              loi="so-sanh"
              onXuLy={onXuLy}
              ly="Chưa có màn so sánh tờ với bản nguồn mới — đang là việc còn nợ, không phải nút hỏng."
            />
            <NutXu nhan="Giữ bản hiện tại" loi="giu-ban-hien-tai" onXuLy={onXuLy} ly={null} />
          </div>
        </>
      )}
    </div>
  );
}

function NutXu({
  nhan,
  loi,
  onXuLy,
  ly: lyNgoai,
}: {
  nhan: string;
  loi: LoiXuNguonDoi;
  onXuLy?: (loi: LoiXuNguonDoi) => void;
  ly: string | null;
}) {
  const ly = !onXuLy ? 'Chưa nối đường xử nguồn đổi ở màn này.' : lyNgoai;
  const id = `xu-${loi}-ly`;
  return (
    <>
      <button
        type="button"
        aria-disabled={!!ly}
        aria-describedby={ly ? id : undefined}
        onClick={ly ? undefined : () => onXuLy?.(loi)}
        style={{
          padding: '5px 9px',
          minHeight: 'var(--tap, 32px)',
          borderRadius: 'var(--r-2)',
          border: '1px solid var(--vien-mo)',
          background: 'var(--card)',
          color: 'var(--t1)',
          fontSize: 11,
          cursor: ly ? 'default' : 'pointer',
          opacity: ly ? 'var(--mo-vo-hieu)' : 1,
        }}
      >
        {nhan}
      </button>
      {ly && (
        <span id={id} style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
          {ly}
        </span>
      )}
    </>
  );
}
