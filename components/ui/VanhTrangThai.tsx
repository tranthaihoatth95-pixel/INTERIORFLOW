'use client';

/**
 * components/ui/VanhTrangThai.tsx — [marker: vanhTrangThai] VÀNH TRẠNG THÁI, nguyên thể DÙNG CHUNG.
 *
 * ⛔ ĐÂY LÀ NƠI DUY NHẤT ĐƯỢC VẼ VÀNH SÁNG QUANH MỘT VẬT. Thẻ dựng ảnh · bước trên canvas ·
 * cửa sổ công cụ · thẻ hàng đợi · ô tệp đang tải — GỌI VÀO ĐÂY. Cấm mỗi màn tự chế CSS riêng:
 * vành tự chế là cách nhanh nhất để "trỏ vào" và "đang chạy" lại rơi về cùng một kênh.
 *
 * ⭐ NÓ CHỈ LÀ MẶT TIỀN — mọi quyết định NGHĨA nằm ở `lib/ui/trang-thai-tuong-tac.ts`
 * ([T2] một cỗ máy, nhiều mặt tiền). File này không tự phán trạng thái nào sáng thế nào; nó
 * ĐỌC bảng rồi vẽ. Muốn đổi hành vi thì sửa bảng, đừng sửa ở đây.
 *
 * BỐN KÊNH VÀNH NÓI ĐƯỢC, tách bạch bằng CHUYỂN ĐỘNG chứ không bằng chỗ đứng:
 *   · troVao / dangChon → vành sáng ĐỨNG YÊN     (con trỏ đang ở đây / vật đang được chọn)
 *   · dangChay          → vành sáng CHẠY VÒNG    (đang có việc diễn ra — đọc được từ xa)
 *   · canChuY           → BIẾN DẠNG CỤC BỘ + tụ sắc hổ phách tại đúng mép có chuyện
 *   · hong              → vành đứng yên màu lỗi, CHUYỂN ĐỘNG DỪNG HẲN
 *
 * ⛔ `xong` CỐ Ý KHÔNG VẼ VÀNH. "Xong" là hết việc; ánh sáng phải TAN chứ không đổi màu rồi ở
 * lại sáng mãi — sáng mãi thì nó tụt xuống thành trang trí, trái NT-11/LightState. Tin "xong"
 * đi bằng kênh chữ (`chuDau`), nơi gọi hiện nhãn.
 *
 * ⛔ KHÔNG animate `opacity` (luật G1 — vành này hay nằm trên bề mặt nền mờ). Vành chạy chạy
 * bằng `stroke-dashoffset` trên một nét SVG, biến dạng cục bộ bằng `transform`.
 * ⛔ `prefers-reduced-motion` THẮNG: vành chạy đứng yên thành một vành TĨNH đủ đậm — vẫn đọc
 * ra "vật này khác các vật kia", còn tin "đang chạy" thì kênh chữ gánh (vì thế bảng bắt
 * `dangChay` phải có `chuDau`).
 */

import { useId, type CSSProperties, type ReactNode } from 'react';
import { DUONG_CONG, NHIP } from '@/lib/ui/nhip';
import {
  MA_TRAN,
  mauTrangThai,
  nhanTrangThai,
  type TrangThai,
} from '@/lib/ui/trang-thai-tuong-tac';

export interface VanhTrangThaiProps {
  /** Trạng thái hiện tại — đọc nghĩa từ `lib/ui/trang-thai-tuong-tac.ts`. */
  trangThai: TrangThai;
  /** Tên vật, dùng cho trình đọc màn hình. Bắt buộc: vành câm là vành vô nghĩa với người mù. */
  tenVat: string;
  /** Bán kính bo — PHẢI là token thang (`var(--r-1..4)` hoặc `var(--r-full)`). */
  banKinh?: string;
  /** Bề dày vành, px. Mặc định 2 — mảnh lúc thường, đúng tinh thần trường LẶNG. */
  day?: number;
  /** Vành nằm ngoài mép vật bao nhiêu px. Giữ nhỏ để vành ÔM SÁT, không thành quầng to. */
  lech?: number;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

/** Vòng quay của vành chạy — chậm và đều. Nhanh hơn là thành hiệu ứng, không còn là tin. */
const CHU_KY_CHAY_MS = 2200;

export default function VanhTrangThai({
  trangThai,
  tenVat,
  banKinh = 'var(--r-3)',
  day = 2,
  lech = 2,
  children,
  className,
  style,
}: VanhTrangThaiProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const hinhThai = MA_TRAN[trangThai];
  const mau = mauTrangThai(trangThai);

  const coVanhTinh =
    hinhThai.kenh.includes('vienDung') && trangThai !== 'xong' && mau != null;
  const coVanhChay = hinhThai.kenhDong === 'vienChay';
  const coBienDang = hinhThai.kenhDong === 'bienDangCucBo';

  // Vành nằm NGOÀI vật ⇒ bán kính vành = bán kính vật + phần lệch (bo đồng tâm, §2d ngược
  // chiều: rNgoai = rTrong + pad). Khai bằng calc() để không gõ số chết ngoài thang.
  const banKinhVanh = `calc(${banKinh} + ${lech}px)`;

  const tenChay = `vtt-chay-${uid}`;
  const tenPhong = `vtt-phong-${uid}`;

  const hopVanh: CSSProperties = {
    position: 'absolute',
    inset: -lech,
    borderRadius: banKinhVanh,
    pointerEvents: 'none',
  };

  return (
    <span
      className={className}
      style={{ position: 'relative', display: 'inline-flex', borderRadius: banKinh, ...style }}
    >
      <style>{`
        /* Vệt chạy quanh chu vi. Âm dần ⇒ chạy theo chiều kim đồng hồ. */
        @keyframes ${tenChay} { to { stroke-dashoffset: -100; } }
        /* Bo góc của vành SVG: rx là thuộc tính hình học ĐỌC ĐƯỢC TỪ CSS, nên nó nhận thẳng
           token thang bo — không phải gõ số chết cạnh một thang đã có. */
        .vtt-ray-${uid} { rx: ${banKinhVanh}; ry: ${banKinhVanh}; }
        .vtt-chay-${uid} { animation: ${tenChay} ${CHU_KY_CHAY_MS}ms linear infinite; }
        /* Biến dạng cục bộ: một mép PHỒNG NHẸ rồi lặn — gọi bằng HÌNH DẠNG, không bằng độ chói,
           nên nó không tranh chấp kênh với vành chạy. Chỉ transform, không opacity. */
        @keyframes ${tenPhong} {
          0%, 100% { transform: scaleY(1); }
          50%      { transform: scaleY(2.1); }
        }
        /* Giảm-chuyển-động THẮNG TUYỆT ĐỐI — phải phủ CẢ HAI lớp: lớp chung vtt- và lớp vệt
           chạy vtt-chay-. Thiếu một lớp là luật hở đúng chỗ nó cần chặt nhất. */
        @media (prefers-reduced-motion: reduce) {
          .vtt-${uid}, .vtt-chay-${uid} { animation: none !important; transition: none !important; }
          /* Vệt đứng yên thì kéo dài thành vành liền — không để lơ lửng một đoạn cụt vô nghĩa. */
          .vtt-chay-${uid} { stroke-dasharray: none; stroke-opacity: 0.55; }
        }
      `}</style>

      {children}

      {/* ── VÀNH TĨNH — troVao · dangChon · hong ─────────────────────────────────────────── */}
      {coVanhTinh && (
        <span
          aria-hidden="true"
          className={`vtt-${uid}`}
          style={{
            ...hopVanh,
            border: `${day}px solid ${mau}`,
            transition: `border-color ${NHIP.bam}ms ${DUONG_CONG}`,
          }}
        />
      )}

      {/* ── VÀNH CHẠY — dangChay. Một VỆT SÁNG chạy vòng quanh chu vi nét SVG. ─────────── */}
      {coVanhChay && mau != null && (
        <svg
          aria-hidden="true"
          style={{ ...hopVanh, overflow: 'visible' }}
          width="100%"
          height="100%"
          preserveAspectRatio="none"
        >
          {/* Vành nền mảnh — LUÔN có mặt. Đây chính là bản TĨNH khi giảm-chuyển-động tắt vệt
              chạy: vật vẫn tách khỏi các vật khác, còn tin "đang chạy" thì kênh chữ gánh. */}
          <rect
            className={`vtt-ray-${uid}`}
            x={day / 2}
            y={day / 2}
            width={`calc(100% - ${day}px)`}
            height={`calc(100% - ${day}px)`}
            fill="none"
            stroke={mau}
            strokeWidth={day}
            strokeOpacity={0.28}
          />
          {/* VỆT SÁNG CHẠY VÒNG. Dùng `pathLength=100` để dash tính theo phần trăm chu vi —
              không phụ thuộc cỡ thẻ, nên thẻ to thẻ nhỏ đều cho một vệt dài bằng nhau về TỈ LỆ.
              Chạy bằng `stroke-dashoffset` (đúng cơ chế LightArc đã dùng thật trong repo này),
              KHÔNG bằng opacity (G1) và KHÔNG bằng mặt nạ.
              ⚠️ Bản trước dựng bằng conic-gradient + mask: `mask-composite` không áp được qua
              cú pháp rút gọn, mặt nạ tịt, gradient lộ thành một VỆT CHÉO cắt ngang ruột thẻ.
              tsc xanh, test xanh — chỉ ẢNH CHỤP APP THẬT mới bắt được. */}
          <rect
            className={`vtt-ray-${uid} vtt-chay-${uid}`}
            x={day / 2}
            y={day / 2}
            width={`calc(100% - ${day}px)`}
            height={`calc(100% - ${day}px)`}
            fill="none"
            stroke={mau}
            strokeWidth={day}
            strokeLinecap="round"
            pathLength={100}
            strokeDasharray="22 78"
          />
        </svg>
      )}

      {/* ── BIẾN DẠNG CỤC BỘ — canChuY. Một đoạn mép PHỒNG lên tại đúng chỗ có chuyện, kèm tụ
             sắc hổ phách. Không vẽ hết vành: cần chú ý là chuyện CỤC BỘ, không phải cả vật. ── */}
      {coBienDang && mau != null && (
        <span
          aria-hidden="true"
          className={`vtt-${uid}`}
          style={{
            position: 'absolute',
            left: '50%',
            bottom: -lech,
            width: 28,
            height: day,
            marginLeft: -14,
            borderRadius: 'var(--r-full)',
            background: mau,
            transformOrigin: '50% 100%',
            animation: `${tenPhong} 1600ms ${DUONG_CONG} infinite`,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Kênh chữ — kênh dự phòng bắt buộc. Ẩn khỏi mắt, KHÔNG ẩn khỏi trình đọc màn hình:
          đây là thứ gánh tin khi giảm-chuyển-động tắt hết ánh sáng. */}
      {hinhThai.nhan && (
        <span
          style={{
            position: 'absolute',
            width: 1,
            height: 1,
            overflow: 'hidden',
            clip: 'rect(0 0 0 0)',
            whiteSpace: 'nowrap',
          }}
        >
          {nhanTrangThai(trangThai, tenVat)}
        </span>
      )}
    </span>
  );
}
