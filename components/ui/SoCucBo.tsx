'use client';

/**
 * components/ui/SoCucBo.tsx — [marker: soCucBo] CON SỐ CỤC BỘ, nguyên thể DÙNG CHUNG.
 *
 * ⛔ ĐÂY LÀ NƠI DUY NHẤT ĐƯỢC DỰNG "con số hiện ngay cạnh điểm thao tác". Đo/sửa ở bản vẽ 2D ·
 * kéo đổi cỡ khối 3D · kéo neo/dock — GỌI VÀO ĐÂY.
 *
 * ⭐ MỘT NGUYÊN THỂ, HAI MẶT ([T2]) — chúng KHÔNG phải hai component giống nhau:
 *   · `mat="thuoc"` — 2D chính xác: thước có vạch + số lớn tại đúng chỗ đang đo.
 *   · `mat="baChieu"` — 3D đổi cỡ: dải ba chiều, chiều đang kéo được NHẤN, hai chiều còn lại
 *     LÙI LẠI (lùi chứ không ẩn — người dựng cần thấy tỉ lệ giữa ba chiều ngay lúc kéo).
 * Mọi phép tính nằm ở `lib/ui/so-cuc-bo.ts`; file này chỉ vẽ.
 *
 * ⛔ NÓ KHÔNG PHẢI Ô THÔNG TIN THƯỜNG TRỰC. Chỉ sống lúc đang sửa, nán lại một nhịp cho mắt kịp
 * đọc con số cuối (pha `vuaChot`), rồi LÙI ĐI. Để nó nằm lại vĩnh viễn là biến một phản hồi
 * thành một món đồ đạc trên màn — đúng thứ trường LẶNG phải cắt.
 *
 * ⛔ Số dùng `font-variant-numeric: tabular-nums` — chữ số không được nhảy ngang khi giá trị
 * đổi (§2c). Số nhảy lúc kéo là thứ phá cảm giác chính xác nhanh nhất.
 * ⛔ Không animate `opacity` (G1). Vào/ra bằng `transform` + giảm-chuyển-động thì hiện thẳng.
 */

import { useId, type CSSProperties } from 'react';
import { DUONG_CONG, NHIP } from '@/lib/ui/nhip';
import {
  coHien,
  vachThuoc,
  viTriTrenThuoc,
  xepChieu,
  TEN_CHIEU,
  type Chieu,
  type KetQuaHut,
  type PhaSo,
} from '@/lib/ui/so-cuc-bo';

export interface SoCucBoProps {
  mat: 'thuoc' | 'baChieu';
  pha: PhaSo;
  /** Đơn vị hiện kèm số. Nơi gọi truyền vào — lõi KHÔNG tự chọn đơn vị (chốt 15/08). */
  donVi: string;

  /* ── mặt "thuoc" ───────────────────────────────────────────────────────────────────────── */
  giaTri?: number;
  min?: number;
  max?: number;
  buoc?: number;
  /** Kết quả hít nam châm — càng gần mốc thì dấu hiệu càng rõ, KHÔNG bật-tắt phựt. */
  hut?: KetQuaHut;

  /* ── mặt "baChieu" ─────────────────────────────────────────────────────────────────────── */
  soDo?: Readonly<Record<Chieu, number>>;
  dangSua?: Chieu | null;

  style?: CSSProperties;
}

/** Làm tròn để HIỂN THỊ. Lõi giữ số thật; đây là tầng mắt người, có quyền làm tròn. */
const hien = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(1));

export default function SoCucBo({
  mat,
  pha,
  donVi,
  giaTri,
  min = 0,
  max = 100,
  buoc = 10,
  hut,
  soDo,
  dangSua = null,
  style,
}: SoCucBoProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  if (!coHien(pha)) return null;

  const dangKeo = pha === 'dangSua';
  // Vào bằng transform, KHÔNG bằng opacity (G1). Vừa chốt thì đứng yên đúng chỗ, chờ lùi.
  const vao: CSSProperties = {
    transform: dangKeo ? 'translateY(0) scale(1)' : 'translateY(0) scale(0.98)',
    transition: `transform ${NHIP.vien}ms ${DUONG_CONG}`,
  };

  const khung: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--gap)',
    padding: 'var(--pad-card)',
    borderRadius: 'var(--r-2)',
    background: 'var(--vl-dac)',
    border: '1px solid var(--border)',
    boxShadow: 'var(--shadow-pop)',
    fontSize: 'var(--fs-ui)',
    color: 'var(--t1)',
    pointerEvents: 'none',
    ...vao,
    ...style,
  };

  const so: CSSProperties = {
    fontVariantNumeric: 'tabular-nums',
    fontWeight: 'var(--fw-semi)' as CSSProperties['fontWeight'],
    fontSize: 'var(--fs-lg)',
    lineHeight: 1.5,
    letterSpacing: 0,
  };

  /* ── MẶT THƯỚC — 2D chính xác ──────────────────────────────────────────────────────────── */
  if (mat === 'thuoc') {
    const v = giaTri ?? 0;
    const cacVach = vachThuoc(min, max, buoc);
    const dangHut = hut?.dangHut === true;
    // Lực hít điều khiển ĐỘ ĐẬM của mốc — liên tục, để tay cảm được là đang tiến vào.
    const luc = hut?.luc ?? 0;

    return (
      <span style={khung} className={`scb-${uid}`}>
        <style>{`
          @media (prefers-reduced-motion: reduce) {
            .scb-${uid}, .scb-${uid} * { transition: none !important; animation: none !important; }
          }
        `}</style>

        {/* Thước: vạch chính dài, vạch phụ ngắn. Chi tiết MANG TIN — đây là thứ nói "đang đo
            theo mốc nào", không phải hoa văn. Rỗng thước thì thôi vẽ, không vẽ bừa. */}
        {cacVach.length > 0 && (
          <span
            aria-hidden="true"
            style={{ position: 'relative', display: 'block', width: 132, height: 18, flex: 'none' }}
          >
            {cacVach.map((vach) => (
              <span
                key={vach.giaTri}
                style={{
                  position: 'absolute',
                  left: `${viTriTrenThuoc(vach.giaTri, min, max) * 100}%`,
                  bottom: 0,
                  width: 1,
                  height: vach.chinh ? 12 : 6,
                  background: vach.chinh ? 'var(--t3)' : 'var(--t5)',
                }}
              />
            ))}
            {/* Con trỏ giá trị — vạch đậm màu nhấn, đứng ở đúng vị trí giá trị hiện tại. */}
            <span
              style={{
                position: 'absolute',
                left: `${viTriTrenThuoc(v, min, max) * 100}%`,
                bottom: 0,
                width: 2,
                height: 18,
                marginLeft: -1,
                borderRadius: 'var(--r-full)',
                background: dangHut ? 'var(--success)' : 'var(--accent)',
                transition: `background-color ${NHIP.bam}ms ${DUONG_CONG}`,
              }}
            />
          </span>
        )}

        <span style={so}>{hien(v)}</span>
        <span style={{ color: 'var(--t3)', fontSize: 'var(--fs-2xs)' }}>{donVi}</span>

        {/* HÍT NAM CHÂM — dấu hiệu tinh, đậm dần theo LỰC. Kèm chữ: màu không bao giờ là kênh
            duy nhất. Không có tay cầm to đùng, không có chớp nháy. */}
        {dangHut && hut?.dich != null && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              paddingLeft: 'var(--gap)',
              borderLeft: '1px solid var(--vien-mo)',
              color: 'var(--success)',
              // Lực 0 (vừa chạm mép tầm) → mảnh; lực 1 (trùng khít) → đậm hẳn.
              fontWeight: (luc > 0.6 ? 'var(--fw-semi)' : 'var(--fw-normal)') as CSSProperties['fontWeight'],
              fontSize: 'var(--fs-2xs)',
              transition: `color ${NHIP.bam}ms ${DUONG_CONG}`,
            }}
          >
            <span aria-hidden="true" style={{ fontVariantNumeric: 'tabular-nums' }}>◇</span>
            bắt {hien(hut.dich)} {donVi}
          </span>
        )}
      </span>
    );
  }

  /* ── MẶT BA CHIỀU — 3D đổi cỡ ──────────────────────────────────────────────────────────── */
  const cacO = xepChieu(soDo ?? { rong: 0, sau: 0, cao: 0 }, dangSua);

  return (
    <span style={khung} className={`scb-${uid}`}>
      <style>{`
        @media (prefers-reduced-motion: reduce) {
          .scb-${uid}, .scb-${uid} * { transition: none !important; animation: none !important; }
        }
      `}</style>
      {cacO.map((o, i) => (
        <span
          key={o.chieu}
          style={{
            display: 'inline-flex',
            alignItems: 'baseline',
            gap: 4,
            paddingLeft: i > 0 ? 'var(--gap)' : 0,
            // Vạch DỌC mảnh giữa các số cùng hàng — được phép (chỉ cấm đường kẻ NGANG chia mảng).
            borderLeft: i > 0 ? '1px solid var(--vien-mo)' : undefined,
            // Chiều phụ LÙI: nhạt đi và nhỏ lại, nhưng VẪN ĐỌC ĐƯỢC. Không ẩn.
            color: o.nhanManh ? 'var(--t1)' : 'var(--t3)',
            transition: `color ${NHIP.bam}ms ${DUONG_CONG}`,
          }}
        >
          <span style={{ fontSize: 'var(--fs-2xs)', color: 'var(--t3)' }}>{TEN_CHIEU[o.chieu]}</span>
          <span
            style={{
              ...so,
              fontSize: o.nhanManh ? 'var(--fs-lg)' : 'var(--fs-sm)',
              color: 'inherit',
            }}
          >
            {hien(o.giaTri)}
          </span>
          {o.nhanManh && (
            <span style={{ color: 'var(--t3)', fontSize: 'var(--fs-2xs)' }}>{donVi}</span>
          )}
        </span>
      ))}
    </span>
  );
}
