'use client';

/**
 * components/studio/VitalsQuyDao.tsx — HÌNH THÁI QUỸ ĐẠO của Vitals.
 *
 * ⭐ Ý ĐỒ: một LÕI nhỏ + hai-ba ĐƯỜNG QUỸ ĐẠO rất mảnh. Ba mức của khẩu độ đều NỞ RA TỪ ĐÚNG
 * TÂM NÀY (§14 chuyển động từ gốc), nên cái tâm đó phải là một điểm nhìn thấy được, không phải
 * một góc hộp.
 *
 * 🔴 LẤY CẢM HỨNG HÌNH THÁI/CHUYỂN ĐỘNG, KHÔNG CHÉP MỘT QUẢ CẦU THEO NGHĨA ĐEN.
 * Đây cố ý KHÔNG phải một quả cầu 3D/logo: không đổ bóng khối, không gradient cầu, không hạt
 * bay. Chỉ có nét mảnh + một chấm. Quả cầu là một VẬT được vẽ ra để ngắm; quỹ đạo là một CÁCH
 * SẮP XẾP — nó nói "có thứ đang chuyển động quanh một tâm", và cái tâm ấy là chỗ bề mặt mọc ra.
 *
 * §18 PHÁT SÁNG = TRẠNG THÁI, KHÔNG TRANG TRÍ — ánh sáng MỌC TỪ GỐC HÀNH ĐỘNG (chính cái lõi):
 *   · `idle`      nghỉ      → gần như KHÔNG sáng; quỹ đạo mờ, đơn sắc, đứng yên.
 *   · `alert`     sẵn sàng  → quầng nhẹ ở TÂM (không phải viền ngoài, không phải cả hình).
 *   · `answering` đang chạy → sáng CÓ KIỂM SOÁT + quỹ đạo quay chậm.
 * ⛔ Không nhấp nháy, không neon, không đổi màu loạn. Ba mức chỉ đổi ĐỘ SÁNG và CHUYỂN ĐỘNG.
 *
 * ♿ `prefers-reduced-motion` THẮNG: mức `answering` bỏ quay, giữ nguyên độ sáng — trạng thái
 * KHÔNG được mất kênh thông báo khi tắt chuyển động (cùng luật đã áp cho `.be-mat-noi--dang-chay`).
 */

import type { CSSProperties } from 'react';

export type TrangThaiQuyDao = 'idle' | 'alert' | 'answering';

export interface VitalsQuyDaoProps {
  trangThai: TrangThaiQuyDao;
  /** Cạnh ô vuông, px. Ambient dùng 18; các nơi khác nhỏ hơn/lớn hơn theo ngữ cảnh. */
  co?: number;
  className?: string;
  style?: CSSProperties;
}

/** Ba đường quỹ đạo, nghiêng khác nhau. Ba là TRẦN — bốn đường thành hoa văn, mất nghĩa. */
const QUY_DAO = [
  { rx: 9, ry: 3.6, xoay: 0 },
  { rx: 9, ry: 3.6, xoay: 60 },
  { rx: 9, ry: 3.6, xoay: 120 },
] as const;

export function VitalsQuyDao({ trangThai, co = 18, className = '', style }: VitalsQuyDaoProps) {
  const dangChay = trangThai === 'answering';
  const coTinHieu = trangThai !== 'idle';

  /* Gần như không vật liệu ở mức nghỉ: nét quỹ đạo mảnh, đơn sắc theo màu chữ phụ — KHÔNG dùng
     `--accent` lúc nghỉ, vì màu nhấn ở trạng thái nghỉ đọc ra là trang trí.
     🔴 SỬA 04/09 SAU KHI ĐO, KHÔNG PHẢI THEO GU. Bản cũ dùng `--t4` @0.34 ⇒ tương phản với nền ổ
     (`--field`) chỉ **1,45 (tối) / 1,35 (sáng)** — dưới xa ngưỡng 3:1 của WCAG 1.4.11 cho phần
     nhìn-thấy-được của một control. Trên ảnh chụp thật nó đọc ra "ô trống chưa kịp style", trong
     khi EXS §7 gọi Vitals là *signature interaction*. Nay dùng `--t3` (cùng thang chữ, KHÔNG chế
     màu mới) và nâng độ mờ: **2,82 (tối) / 2,10 (sáng)**.
     ⚠️ Nét quỹ đạo vẫn CHƯA đạt 3:1 và ĐÓ LÀ CỐ Ý — chúng là hình bao, không phải thứ định danh
     control. Phần định danh là LÕI, và lõi đã kéo lên đạt ngưỡng ở cả hai nền (xem dưới). */
  const netQuyDao = coTinHieu ? 'var(--accent)' : 'var(--t3)';
  const doMoQuyDao = dangChay ? 0.8 : coTinHieu ? 0.62 : 0.55;

  return (
    <svg
      width={co}
      height={co}
      viewBox="0 0 24 24"
      className={className}
      style={style}
      aria-hidden
      focusable="false"
    >
      <defs>
        {/* Quầng MỌC TỪ TÂM — bán kính gradient nhỏ, tắt dần về 0. Không phải viền phát sáng. */}
        <radialGradient id="vitals-quy-dao-quang">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity={dangChay ? 0.5 : 0.3} />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </radialGradient>
      </defs>

      {coTinHieu && <circle cx="12" cy="12" r="7.5" fill="url(#vitals-quy-dao-quang)" />}

      <g
        className={dangChay ? 'vitals-quy-dao--quay' : undefined}
        style={{ transformOrigin: '12px 12px' }}
      >
        {QUY_DAO.map((q) => (
          <ellipse
            key={q.xoay}
            cx="12"
            cy="12"
            rx={q.rx}
            ry={q.ry}
            fill="none"
            stroke={netQuyDao}
            strokeOpacity={doMoQuyDao}
            strokeWidth="0.9"
            transform={`rotate(${q.xoay} 12 12)`}
          />
        ))}
      </g>

      {/* LÕI — gốc hành động, VÀ là phần định danh control.
          🔴 SỬA 04/09: `fillOpacity` 0.7 cho ra **3,72 (tối) / 2,68 (sáng)** — nền sáng TRƯỢT
          ngưỡng 3:1. Đục hẳn (1.0) cho **6,12 / 4,61**, đạt ở cả hai nền. Không đổi màu, không
          thêm token: chỉ thôi pha loãng một thứ vốn phải nhìn thấy được.
          Nó vẫn KHÔNG phải điểm nhấn thường trực — r=2px, màu chữ phụ, không dùng `--accent`
          lúc nghỉ; "nhìn thấy được" khác "gây chú ý". */}
      <circle
        cx="12"
        cy="12"
        r={dangChay ? 2.4 : 2}
        fill={coTinHieu ? 'var(--accent)' : 'var(--t3)'}
      />
    </svg>
  );
}

export default VitalsQuyDao;
