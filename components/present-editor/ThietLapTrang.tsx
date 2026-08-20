'use client';

/**
 * components/present-editor/ThietLapTrang.tsx — THIẾT LẬP TRANG của chặng Trình chiếu.
 *
 * ⭐ Đây là chỗ phân vai NHÌN THẤY ĐƯỢC: 2D/3D sáng tác nội dung · Trình chiếu dàn trang và phát
 * hành. Mọi quyết định về TRANG GIẤY (khổ · hướng · tỉ lệ · lề · khung tên · đầu ra) sống ở đây,
 * không rải mỗi chặng một hộp thoại.
 *
 * Hai tầng theo nhịp ba nấc của app (nấc to = LỚP TIN MỚI, không phải chữ to hơn):
 *  · NHANH — thứ đụng tới mỗi lần dàn trang: khổ · hướng · tỉ lệ · lề · khung tên · preset đầu ra.
 *  · SÂU — thứ mỗi tháng đụng một lần, thu lại mặc định.
 *
 * ⛔ LUẬT CẤM BÀY NÚM CHO THỨ BACKEND KHÔNG LÀM ĐƯỢC: mọi núm ở tầng SÂU đều đi qua `KhaNang` —
 * `false` thì nút hiện MỜ kèm LÝ DO THẬT (`aria-disabled` + `aria-describedby`, KHÔNG dùng
 * `title` vì `title` câm trên cảm ứng và Tab bỏ qua nút disabled). Không có đường nào để một núm
 * bày ra mà không nói được nó làm gì.
 *
 * ⛔ Kính: gọi `BeMatNoi` (nguyên thể dùng chung), không tự chế lớp kính.
 */

import { useRef, useState, type CSSProperties } from 'react';
import { ChevronDown, ChevronRight, Ruler } from 'lucide-react';
import { BeMatNoi } from '@/components/ui/BeMatNoi';
import { paperSizeMm, type PaperKey, type PaperOrientation } from '@/lib/cad/model';
import {
  TY_LE_BAN_VE,
  NHAN_TRANG_THAI,
  nhanTyLe,
  tyLeApDung,
  vungInMm,
  type ToBanVe,
  type TyLe,
  type TrangThaiNguon,
  type LoiXuNguonDoi,
} from '@/lib/present-editor/to-ban-ve';

const PAPER_KEYS: PaperKey[] = ['A0', 'A1', 'A2', 'A3', 'A4'];
const MONO = 'ui-monospace, Menlo, monospace';

/**
 * Năng lực THẬT của đường xuất đang nối. Nơi gọi khai đúng những gì backend làm được; thứ chưa
 * có thì để `false` kèm lý do — panel tự bày mờ. Cấm khai `true` cho thứ chưa nối.
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

export interface ThietLapTrangProps {
  mo: boolean;
  nguonRef: React.RefObject<HTMLElement | null>;
  onDong: () => void;
  to: ToBanVe | null;
  onDoiTo: (patch: Partial<ToBanVe>) => void;
  /** trạng thái nguồn tính từ `trangThaiNguon()` — panel chỉ HIỂN THỊ, không tự sửa tờ. */
  trangThai: TrangThaiNguon;
  /** người chọn cách xử khi nguồn đổi. Không truyền = chưa nối, ba nút hiện mờ. */
  onXuLyNguonDoi?: (loi: LoiXuNguonDoi) => void;
  /** mở bảng nét in (Màn 8) — có thật ở `components/print/LineweightTable.tsx`. */
  onMoBangNet?: () => void;
  khaNang?: KhaNang;
}

export default function ThietLapTrang({
  mo,
  nguonRef,
  onDong,
  to,
  onDoiTo,
  trangThai,
  onXuLyNguonDoi,
  onMoBangNet,
  khaNang = {},
}: ThietLapTrangProps) {
  const [sauMo, setSauMo] = useState(false);
  const [tuyChinh, setTuyChinh] = useState('');

  if (!to) return null;

  const khoMm = paperMm(to.khoGiay, to.huong);
  const ap = tyLeApDung(to.tyLe, to.noiDungMm, vungInMm(khoMm, to.le));

  return (
    <BeMatNoi
      mo={mo}
      nguonRef={nguonRef}
      bac="bangSau"
      /**
       * 🔴 KHAI TAY, KHÔNG ĐỂ SUY TỪ `bac` — luật vật liệu 20/08: VẬT LIỆU THEO CHỨC NĂNG.
       * Đây là BIỂU MẪU THIẾT LẬP KỸ THUẬT (khổ · tỉ lệ · lề · khung tên) — nhóm phải ĐẶC:
       * đọc lâu, nhiều núm, và là hồ sơ nghề. Nền mờ nhoè sau bảng số là mất uy tín nghề.
       * Khuôn dùng ở đây là **VỎ KÍNH + RUỘT GẦN ĐẶC**: `BeMatNoi` lo khung nổi/mọc-từ-nguồn,
       * còn bề mặt thì `dac` (0.95–0.96). Khai tường minh để ai đổi `bac` về sau KHÔNG vô tình
       * hạ độ đặc xuống `vua`/`mong` — đó là cách luật này bị phá mà không ai thấy.
       */
      doDac="dac"
      rong={340}
      nhan="Thiết lập trang"
      nguCanhNho="present.thiet-lap-trang"
      onDong={onDong}
    >
      <div style={{ display: 'grid', gap: 14, padding: '4px 2px' }}>
        {/* ── Trạng thái nguồn — VIỆC 7. Nguồn đổi thì ĐÁNH DẤU, không tự sửa tờ. ── */}
        <TrangThaiNguonHang
          trangThai={trangThai}
          daPhatHanh={!!to.daPhatHanh}
          onXuLy={onXuLyNguonDoi}
        />

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
            {khoMm.rongMm} × {khoMm.caoMm} mm
          </Ghi>
        </Muc>

        {/* ── VIỆC 4 · TỈ LỆ BẢN VẼ. "Vừa khung" là LỰA CHỌN của người, không phải đường
             thoái lui của máy — xem `tyLeApDung` trong lib/present-editor/to-ban-ve.ts. ── */}
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
            <Chip
              chon={to.tyLe.kieu === 'vua-khung'}
              onClick={() => onDoiTo({ tyLe: { kieu: 'vua-khung' } })}
            >
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
            <span style={{ fontFamily: MONO, fontSize: 11, color: 'var(--t2)', minWidth: 34 }}>
              {to.le} mm
            </span>
          </div>
        </Muc>

        <Muc nhan="Khung tên">
          <div style={{ display: 'grid', gap: 6 }}>
            <OKhungTen nhan="Tên bản vẽ" gt={to.khungTen.tenBanVe} doi={(v) => onDoiTo({ khungTen: { ...to.khungTen, tenBanVe: v } })} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              <OKhungTen nhan="Số tờ" gt={to.khungTen.soTo} doi={(v) => onDoiTo({ khungTen: { ...to.khungTen, soTo: v } })} />
              <OKhungTen nhan="Bản sửa" gt={to.khungTen.banSua} doi={(v) => onDoiTo({ khungTen: { ...to.khungTen, banSua: v } })} />
            </div>
          </div>
        </Muc>

        {/* ── TẦNG SÂU ── */}
        <button
          type="button"
          onClick={() => setSauMo((s) => !s)}
          aria-expanded={sauMo}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'transparent',
            border: 0,
            padding: '4px 0',
            color: 'var(--t2)',
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '.04em',
            textTransform: 'uppercase',
            cursor: 'pointer',
          }}
        >
          {sauMo ? <ChevronDown size={13} /> : <ChevronRight size={13} />} Thiết lập sâu
        </button>

        {sauMo && (
          <div style={{ display: 'grid', gap: 7 }}>
            <NumSau nhan="Khổ tuỳ chỉnh" ly={khaNang.khoTuyChinh} />
            <NumSau nhan="Tràn lề" ly={khaNang.tranLe} />
            <NumSau nhan="Lưới · đường dẫn" ly={khaNang.luoiDuongDan} />
            <NumSau nhan="Vùng in" ly={khaNang.vungIn} />
            <NumSau
              nhan="Chế độ độ dày nét"
              ly={khaNang.bangNetIn}
              onClick={onMoBangNet}
              icon={<Ruler size={13} />}
            />
            <NumSau nhan="Màu · xám · đơn sắc" ly={khaNang.mauInHoacXam} />
            <NumSau nhan="Vector hay raster" ly={khaNang.vectorHoacRaster} />
            <NumSau nhan="DPI" ly={khaNang.dpi} />
            <NumSau nhan="Máy in · máy vẽ" ly={khaNang.mayIn} />
            <NumSau nhan="Dải trang" ly={khaNang.daiTrang} />
            <NumSau nhan="Số bản" ly={khaNang.soBan} />
          </div>
        )}
      </div>
    </BeMatNoi>
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
        // ⛔ ĐẶC, không bán trong: trước đây là `color-mix(--panel 70%, transparent)` — một lớp
        // trong suốt NẰM TRÊN bề mặt kính, tức kính-chồng-kính, và làm nhoè đúng hàng chữ mang
        // trạng thái nguồn (Hiện hành/Có bản mới) — chỗ ít được phép nhoè nhất.
        background: 'var(--panel)',
        border: '1px solid var(--vien-mo)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        {/* hình dạng + chữ, không chỉ màu — màu không bao giờ là kênh duy nhất */}
        <span
          aria-hidden
          style={{ width: 8, height: 8, borderRadius: 'var(--r-full)', background: mau, flex: '0 0 auto' }}
        />
        <strong style={{ fontSize: 12, color: 'var(--t1)' }}>
          Nguồn: {NHAN_TRANG_THAI[trangThai]}
        </strong>
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
            {/* ⛔ Chưa có màn so sánh hai bản ⇒ nút MỜ kèm lý do thật, không bày nút bấm-không-ra-gì. */}
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

/**
 * Một lối xử khi nguồn đổi. `ly` khác `null` ⇒ lối đó CHƯA đi được, nút mờ kèm đúng lý do đó
 * (`aria-disabled` + `aria-describedby`, không dùng `title`).
 */
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

/* ── mảnh nhỏ ───────────────────────────────────────────────────────────────────── */

function Muc({ nhan, children }: { nhan: string; children: React.ReactNode }) {
  return (
    <section>
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '.06em',
          textTransform: 'uppercase',
          color: 'var(--t3)',
          marginBottom: 6,
        }}
      >
        {nhan}
      </div>
      {children}
    </section>
  );
}

function HangNut({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>{children}</div>;
}

function Chip({ chon, onClick, children }: { chon: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={chon}
      style={{
        padding: '5px 10px',
        minHeight: 28,
        borderRadius: 'var(--r-2)',
        border: `1px solid ${chon ? 'var(--accent)' : 'var(--vien-mo)'}`,
        background: chon ? 'color-mix(in srgb, var(--accent) 16%, transparent)' : 'var(--card)',
        color: chon ? 'var(--t1)' : 'var(--t2)',
        fontSize: 11,
        fontWeight: chon ? 600 : 500,
        fontFamily: MONO,
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  );
}

function Ghi({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 5, fontFamily: MONO, fontSize: 10, color: 'var(--t3)' }}>{children}</div>
  );
}

const oNhap: CSSProperties = {
  width: 56,
  padding: '4px 6px',
  borderRadius: 'var(--r-2)',
  border: '1px solid var(--vien-mo)',
  background: 'var(--bg)',
  color: 'var(--t1)',
  fontFamily: MONO,
  fontSize: 11,
};

function OKhungTen({ nhan, gt, doi }: { nhan: string; gt: string; doi: (v: string) => void }) {
  return (
    <label style={{ display: 'grid', gap: 3 }}>
      <span style={{ fontSize: 10, color: 'var(--t3)' }}>{nhan}</span>
      <input
        value={gt}
        onChange={(e) => doi(e.target.value)}
        style={{ ...oNhap, width: '100%' }}
        placeholder="—"
      />
    </label>
  );
}

/**
 * Một núm ở tầng SÂU. `ly` là chuỗi ⇒ CHƯA LÀM ĐƯỢC, hiện mờ kèm lý do đó. `ly === false` ⇒
 * năng lực có thật, nút bấm được. Không có đường thứ ba: núm không khai năng lực thì mặc định
 * mờ kèm lý do chung — thà nói "chưa nối" còn hơn bày một nút bấm không ra gì.
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
  /**
   * 🐛 Bắt được lúc nghiệm thu 20/08: `ly === false` (năng lực CÓ THẬT) mà nơi gọi quên truyền
   * `onClick` thì nút vẫn mờ nhưng ô lý do RỖNG — đúng thứ luật này sinh ra để cấm. Nay ca đó có
   * câu riêng, nói đúng bản chất: năng lực có, dây chưa nối.
   */
  const lyDo =
    ly === false
      ? onClick
        ? null
        : 'Năng lực này có thật trong app nhưng màn Trình chiếu chưa nối nút mở.'
      : ly || 'Chưa nối vào đường xuất — chưa bày núm cho thứ chưa chạy được.';
  const moKhoa = !lyDo && !!onClick;
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
          minHeight: 32,
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

/**
 * Khổ giấy mm — GỌI LẠI `paperSizeMm` của `lib/cad/model.ts`, KHÔNG khai bảng ISO thứ hai.
 * (Bản nháp đầu của tệp này có chép lại bảng A0-A4; đó đúng là kiểu "nguồn thứ hai" mà luật cấm.)
 */
function paperMm(k: PaperKey, huong: PaperOrientation) {
  const [rongMm, caoMm] = paperSizeMm(k, huong);
  return { rongMm, caoMm };
}
