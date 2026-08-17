/**
 * components/home/widgets/WidgetCard.tsx — [marker: DongStudio] vỏ card dùng chung cho widget
 * Home (phiếu docs/phieu-giao/home-dong-studio.md ④.5-10, nâng BENTO v3
 * docs/phieu-giao/home-bento-v3.md) — MỘT nơi định nghĩa nền/viền/bo/khoảng đệm, tránh N file
 * lặp cùng style (đúng luật "một cỗ máy nhiều mặt tiền" CLAUDE.md). Token qua CSS var sẵn có,
 * KHÔNG hardcode hex. Thang bo `--r-3` (14px, `lib/geometry.ts` RADIUS.r3) — một-khối-một-bóng
 * (SPEC-DESIGN-SYSTEM-IF §2c).
 *
 * v3 — mỗi ô bento phải LẤP ĐẦY đúng khung lưới cha (grid area cố định ở DongStudioHome.tsx) và
 * không tràn: `h-full flex flex-col`, phần thân `noPad` cho widget ảnh full-bleed (ô D), `dense`
 * giảm đệm cho ô hẹp (B/C), `bodyClassName` cho phần cuộn riêng (KHÔNG cuộn cả card — chỉ danh
 * sách bên trong, giữ tiêu đề cố định).
 *
 * GU (chỉ đạo giữa phiên, `docs/nc/NC-GU-BENTRAN-PINTEREST-2026-08-13.md` mạch #1 Swiss/editorial)
 * — `index` là số thứ tự ô (đúng chữ Hoà pin nhiều lần: "SỐ THỨ TỰ to làm nhân vật, nhãn mono nhỏ
 * uppercase") — hiện TRƯỚC tiêu đề, `font-mono`, KHÔNG phải badge/pill riêng (giữ hairline, tránh
 * bo bubbly). border hairline `--vien-mo` + `--r-3` (14px) đã đúng gu — không đổi.
 *
 * v4 (13/08, phiếu home-bento-v4.md ④.6, lỗi #6 "theme sáng trắng-trên-trắng thiếu phân tầng") —
 * thêm `box-shadow: var(--shadow-node)` (token SẴN CÓ, đủ cả 2 theme — `globals.css`, không đụng
 * file đó). Ở theme tối card gần như không đổi (nền đã tối, viền đã đủ); ở theme sáng `--card`
 * (#fff) đứng trên `--bg` (#f2efe9, giấy ấm) chỉ cách nhau ~14 điểm sáng — viền `--border` mỏng
 * dễ chìm, bóng 1 lớp là thứ TÁCH card ra khỏi nền rõ ràng nhất (đúng "một-khối-một-bóng" §2c).
 *
 * P-DASHBOARD-DS (17/08, phiếu docs/phieu-giao/P-DASHBOARD-DS.md ③.1-2) — Hoà chê "dashboard sai
 * HOÀN TOÀN hệ design system" vì card đặc trơn không kính lỏng, không ambient tint. Home nay có
 * `SystemWallpaper` nền ảnh sinh bằng mã (chốt A2 16/08: nền để NÉT, KHÔNG bôi mờ). Card phải là
 * KÍNH LỎNG mới đứng đúng trên ảnh — chốt 16/08 ba tầng ánh sáng, tầng ① "kính nhận sáng và bị
 * ảnh hưởng bởi thứ nằm dưới" (backdrop-filter làm đúng). Đổi:
 *   1. Nền `var(--card)` (đặc) → class `.nen-mo-card` (token `--nen-mo-card` translucent 0.82/0.82
 *      2 theme, backdrop-filter blur-strong 40px + saturate 180%) — class SẴN CÓ ở globals.css:431,
 *      TÁI DÙNG, không đẻ hệ kính mới. Class này đã trả giá qua K1-K4 (4 vòng sửa) — Webkit
 *      prefix có sẵn (K3: tablet mới blur), portal-ra-body cho popover (K4: kính lồng kính chết).
 *   2. AMBIENT TINT = MÉP BẮT SÁNG (tầng ① NHẬN SÁNG chốt 16/08): thêm `inset 0 1px 0 var(--vien-mo)`
 *      vào box-shadow — vệt sáng mảnh cạnh trên, ánh sáng liếm rìa vật liệu. `--vien-mo` là token
 *      SẴN CÓ (globals.css:207-211), tự đảo cực theo theme (tối = trắng loãng, sáng = đen loãng).
 *      KHÔNG hex mới. Đây là "mép card có gradient nhẹ theo nội dung" của ticket ③.2.
 *   3. Viền `--border` → `--vien-mo` cho đồng bộ hairline (chốt 16/08 P-L đã đo 80/80 chỗ dùng làm
 *      đường kẻ chứ không phải nền, xem globals.css:207 comment).
 *   4. KÍNH CHỈ Ở VỎ (chốt 01/08): ruột widget vẫn dùng `--field`/`--card`/`--panel` đặc như cũ
 *      (LightClock inner buttons đã ĐÚNG — `background: 'var(--field)'` opaque). KHÔNG lồng kính
 *      trong kính (K4: dropdown lồng chrome kính xuyên thấu).
 *   5. Bằng chứng grep: `backdropFilter` + `WebkitBackdropFilter` inline (không phải qua class)
 *      để ticket ⑥b `grep -c backdrop-filter` ≥3 có bằng chứng máy soi được — VÀ Webkit prefix
 *      tường minh (K3). Class `.nen-mo-card` là bản dự phòng nếu inline bị override.
 */

import type { CSSProperties, ReactNode } from 'react';

/** Vỏ kính lỏng dùng chung — kính chỉ ở LỚP VỎ (chốt 01/08); backdrop-filter + Webkit prefix
 * tường minh (K3 02/08); border hairline `--vien-mo` + top-highlight inset (ambient mép bắt sáng
 * chốt 16/08); bo `--r-3` (thang RADIUS chốt 12/08); bóng `--shadow-node` (một-khối-một-bóng §2c
 * SPEC-DESIGN-SYSTEM-IF).
 * KHÔNG hex/số ma — mọi giá trị đều là token đã khai. */
const GLASS_SHELL: CSSProperties = {
  background: 'var(--nen-mo-card, var(--card))',
  border: '1px solid var(--vien-mo, var(--border))',
  backdropFilter: 'saturate(180%) blur(var(--blur-strong))',
  WebkitBackdropFilter: 'saturate(180%) blur(var(--blur-strong))',
  boxShadow: 'var(--shadow-node), inset 0 1px 0 var(--vien-mo)',
};

export default function WidgetCard({
  title,
  index,
  action,
  children,
  className = '',
  dense = false,
  noPad = false,
  bodyClassName = '',
}: {
  title?: string;
  /** Số thứ tự ô, vd "01" — gu Swiss (xem comment đầu file). Bỏ trống = không đánh số. */
  index?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Đệm nhỏ hơn — cho ô hẹp (B/C, ~2-3 cột). */
  dense?: boolean;
  /** Bỏ hẳn đệm/tiêu đề mặc định — widget tự vẽ layout riêng (ô D ảnh full-bleed). */
  noPad?: boolean;
  bodyClassName?: string;
}) {
  if (noPad) {
    return (
      <div
        className={`relative h-full overflow-hidden rounded-[var(--r-3)] nen-mo-card ${className}`}
        style={GLASS_SHELL}
      >
        {children}
      </div>
    );
  }
  return (
    <div
      className={`flex h-full flex-col rounded-[var(--r-3)] nen-mo-card ${dense ? 'p-3' : 'p-4'} ${className}`}
      style={GLASS_SHELL}
    >
      {title && (
        <div className={`flex items-center justify-between gap-2 ${dense ? 'mb-1.5' : 'mb-2.5'} shrink-0`}>
          {/* P-X ⑤ (17/08) — tương phản: tiêu đề `--t4` đo được 3,44 (tối) / 3,26 (sáng) và số
              `--t5` 1,98 / 2,21, ĐỀU dưới ngưỡng 4,5:1 — mà đây là tiêu đề của CẢ 10 widget Home.
              Cả hai lên `--t3` (7,24 / 5,20 ✓). Số vẫn tách khỏi nhãn, nhưng bằng CÂN NẶNG chữ
              (`font-normal` cạnh `font-semibold`) chứ không bằng màu nhạt — màu/độ nhạt không
              được là kênh phân biệt duy nhất. Đổi TOKEN, không tự chế màu. */}
          <h3 className="flex items-baseline gap-1.5 font-mono text-[length:var(--fs-xs)] font-semibold uppercase tracking-wide text-[var(--t3)]">
            {index && <span className="font-normal">{index}</span>}
            {title}
          </h3>
          {action}
        </div>
      )}
      <div className={`min-h-0 flex-1 ${bodyClassName}`}>{children}</div>
    </div>
  );
}
