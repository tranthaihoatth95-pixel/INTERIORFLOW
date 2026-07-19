'use client';

/**
 * IFLogo — monogram "IF" mới (19/07 login-minimal).
 *
 * Yêu cầu chủ dự án: "trắng đen minimalist nhưng cực kỳ tinh tế ấn tượng và sang".
 * Đơn sắc tuyệt đối — vẽ bằng `currentColor`, cha quyết định màu (trắng trên nền
 * ảnh tối, đen trên nền sáng). Nét hairline đều (stroke 1–1.5 trên lưới 44),
 * KHÔNG gradient, KHÔNG bo tròn, KHÔNG serif.
 *
 * 3 PHƯƠNG ÁN (giữ cả 3 trong code để chủ dự án đổi lại nếu muốn):
 *
 *  A `stem`     — "Shared stem / negative space": chữ I là một nét dọc duy nhất;
 *                 chữ F bị CẮT mất thân, chỉ còn 2 gạch ngang treo bên phải —
 *                 khoảng trống giữa nét dọc và 2 gạch chính là "thân F ảo".
 *                 Tinh thần Celine/Aesop: tối giản đến mức người xem tự hoàn thành chữ.
 *
 *  B `framed`   — Phương án A đặt trong khung vuông hairline góc vuông — như con dấu
 *                 (stamp) bản vẽ kiến trúc / cartouche. Có "trọng lượng" hơn khi đứng
 *                 một mình trên nền ảnh, vẫn thanh vì toàn nét 1px.  ← ĐANG DÙNG
 *
 *  C `wordmark` — "I F" đầy đủ nét, tracking rất rộng: I một nét dọc, F đủ thân +
 *                 2 tay. Trung tính nhất, hợp khi cần đọc rõ là chữ.
 */

export type IFLogoVariant = 'stem' | 'framed' | 'wordmark';

export function IFLogo({
  size = 44,
  variant = 'framed',
  className,
  style,
  title = 'InteriorFlow',
}: {
  size?: number;
  variant?: IFLogoVariant;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
}) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 44 44',
    fill: 'none' as const,
    stroke: 'currentColor',
    className,
    style,
    role: 'img' as const,
    'aria-label': title,
  };

  if (variant === 'wordmark') {
    return (
      <svg {...common}>
        {/* I — một nét dọc */}
        <path d="M14 13 V31" strokeWidth="1.5" />
        {/* F — thân + 2 tay, tracking rộng khỏi I */}
        <path d="M25 13 V31" strokeWidth="1.5" />
        <path d="M24.25 13.75 H32.5" strokeWidth="1.5" />
        <path d="M24.25 21.5 H30.5" strokeWidth="1.5" />
      </svg>
    );
  }

  // lõi monogram "shared stem": I = nét dọc; F = 2 gạch ngang, thân F là khoảng trống
  const core = (
    <>
      <path d="M15.75 13 V31" strokeWidth="1.5" />
      <path d="M20.5 13.75 H29" strokeWidth="1.5" />
      <path d="M20.5 21.5 H27" strokeWidth="1.5" />
    </>
  );

  if (variant === 'stem') {
    return <svg {...common}>{core}</svg>;
  }

  // framed (mặc định) — con dấu kiến trúc: khung vuông hairline + lõi shared-stem
  return (
    <svg {...common}>
      <rect x="0.5" y="0.5" width="43" height="43" strokeWidth="1" opacity="0.85" />
      {core}
    </svg>
  );
}
