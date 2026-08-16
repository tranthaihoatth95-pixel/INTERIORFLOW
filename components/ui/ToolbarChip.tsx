'use client';

/**
 * components/ui/ToolbarChip.tsx — nút công cụ dùng CHUNG cho cả 3 thanh công cụ chặng
 * (2D `CadToolbar` · 3D `ToolDock3D` · Trình bày `present-editor/Toolbar`).
 *
 * Nguồn gốc: 2D `CadToolbar.tsx` (`btn()`/`btnSize()`) có ĐÚNG ngôn ngữ NT-5 (capsule/pill, bo
 * tròn, ghost-khi-bật thay vì tô đặc) — file này TRÍCH kiểu đó thành component dùng chung.
 *
 * 15/08 — SỬA theo `docs/nc/NC-TRIET-LY-GIAO-DIEN-2026-08-14.md:83` KB-1 (T tự bác bỏ một phần
 * tiền đề phiếu `toolbar-mot-khuon`: bản 14/08 mới TRÍCH NGUYÊN kiểu 2D (44/36 cứng), CHƯA khớp
 * KB-1 "capsule 44/r22 → nút 34/r17"). Đổi: kích thước qua CSS var thay vì literal 44|36 —
 * `size="tap"` (mặc định) = `var(--tap)` (32 desktop · 44 cảm ứng, override sẵn ở
 * `app/globals.css:164`, KHÔNG viết media query mới) · `size="tap-lg"` = `var(--tap-lg)` (44 cố
 * định, dùng cho Sketch/mode chạm và nhóm lệnh "big") · số cụ thể vẫn nhận để chặng nào cần ghim
 * đúng con số hiện có (không ép mọi nơi qua CSS var cùng lúc, tránh vỡ layout ăn theo — vd
 * `Divider` trong `CadToolbar.tsx` cần một con số JS để tính chiều cao). `RADIUS.full` (999px)
 * tự concentric ở MỌI cỡ vì border-radius clamp về nửa cạnh ngắn — không cần breakpoint riêng
 * cho bo góc.
 *
 * Nhãn kèm icon (tuỳ chọn `label`) đúng luật K14/NT-8 "icon luôn có chữ".
 * §9 "cấm nút giả": `disabled` BẮT BUỘC đi kèm `disabledReason`.
 *
 * 16/08 (`disabledReason`) — ĐỔI ĐƯỜNG ĐI CỦA LÝ DO. Trước: nút mờ bị trả về SỚM, không bọc
 * Tooltip, lý do nhét vào `title=`. Ba chỗ hỏng, đo trên Chromium 151 (playwright, chuột và
 * bàn phím THẬT — số đo trong `docs/bao-cao-phien/2026-08-16-P-G-o-giai-nghia.md`):
 *   ① `<button disabled>` KHÔNG nhận focus và bị Tab BỎ QUA hẳn ⇒ người dùng bàn phím / trình
 *      đọc màn hình KHÔNG CÓ ĐƯỜNG NÀO tới được lý do. Không phải "khó đọc" — là không tồn tại.
 *   ② `title=` câm trên cảm ứng (đã ghi ngay trong `Tooltip.tsx`) và trình đọc màn hình đọc
 *      không nhất quán ⇒ đúng cái ca cần giải thích nhất lại là ca mất kênh giải thích.
 *   ③ Nút mờ đi vòng qua Tooltip nên ô giải nghĩa (hình + chữ) dựng xong vẫn không bao giờ
 *      hiện cho nó.
 * Nay: dùng `aria-disabled="true"` thay thuộc tính `disabled` (nút VẪN focus được, VẪN bắn
 * hover/focus ⇒ Tooltip chạy), chặn kích hoạt bằng cách không gắn `onClick`, và nối lý do vào
 * nút bằng `aria-describedby` trỏ tới một phần tử ẩn (`.if-tooltip-a11y`).
 * ⚠️ Hệ quả phải biết: nút mờ nay CHIẾM một chặng Tab. Đó là chủ ý — mờ là "chưa dùng được",
 * không phải "biến mất khỏi bàn phím" ([T5] đích đến luôn sửa được / không hộp đen một chiều).
 */

import { useId } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { RADIUS } from '@/lib/geometry';
import Tooltip from './Tooltip';

export interface ToolbarChipProps {
  icon: ReactNode;
  /** Nhãn chữ — hiện CẠNH icon khi có (dock mở rộng); ẩn chữ vẫn bắt buộc truyền cho a11y/tooltip. */
  label: string;
  /** Giải thích ngắn cho Tooltip — mặc định dùng `label`. */
  desc?: string;
  active?: boolean;
  disabled?: boolean;
  /** BẮT BUỘC khi disabled=true — §9 cấm nút giả không lý do. */
  disabledReason?: string;
  onClick?: () => void;
  /**
   * `'tap'` (mặc định) = `var(--tap)` (32 desktop · 44 cảm ứng, tự đổi theo thiết bị) ·
   * `'tap-lg'` = `var(--tap-lg)` (44 cố định, KHÔNG đổi theo thiết bị — dùng cho Sketch/lệnh to) ·
   * số cụ thể = ghim literal (chặng nào cần một con số JS ổn định để tính layout ăn theo, vd
   * chiều cao Divider — không dùng CSS var ở đó được vì cần số thật lúc render).
   */
  size?: 'tap' | 'tap-lg' | number;
  /** Hiện nhãn chữ cạnh icon (khuôn dock mở rộng) thay vì chỉ icon tròn. */
  showLabel?: boolean;
  shortcutHint?: string;
  /**
   * `giaiNghia` — HÌNH minh hoạ thao tác cho ô giải nghĩa (`lib/ui/thao-tac-glyph.tsx`).
   * Hình đứng giữa tiêu đề và câu mô tả. Chỉ truyền cho lệnh mà một hình nói nhanh hơn một câu.
   */
  hinh?: ReactNode;
}

export function ToolbarChip({
  icon,
  label,
  desc,
  active = false,
  disabled = false,
  disabledReason,
  onClick,
  size = 'tap',
  showLabel = false,
  shortcutHint,
  hinh,
}: ToolbarChipProps) {
  // id ổn định giữa server/client cho phần tử ẩn mang lý do (đích của aria-describedby).
  const reasonId = useId();
  if (disabled && !disabledReason) {
    // Phát triển sai luật §9 — báo ngay thay vì render nút câm lặng không giải thích được vì sao mờ.
    console.warn(`ToolbarChip "${label}": disabled=true nhưng thiếu disabledReason — trái luật §9.`);
  }

  const sizeValue: number | string =
    size === 'tap' ? 'var(--tap)' : size === 'tap-lg' ? 'var(--tap-lg)' : size;
  // minWidth ở nhãn dạng cột cần một con số CSS hợp lệ dù size là chuỗi var(); calc() cộng được
  // thẳng với biến CSS nên không cần quy đổi ra số JS ở đây.
  const minWidthShowLabel = typeof sizeValue === 'number' ? sizeValue + 22 : `calc(${sizeValue} + 22px)`;

  const style: CSSProperties = showLabel
    ? {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        width: 'auto',
        minWidth: minWidthShowLabel,
        padding: '8px 10px',
        borderRadius: RADIUS.r2,
        border: active ? '1px solid var(--accent-ring)' : '1px solid transparent',
        background: active ? 'var(--accent-soft)' : 'transparent',
        color: active ? 'var(--accent)' : 'var(--t2)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        // 16/08 (B2, a11y): 0.35 → 0.5 → TOKEN `--mo-vo-hieu`. Hằng số `0.5` chỉ đúng cho nền TỐI
        // (4,01:1); nền SÁNG cùng con số đó rơi xuống 2,55:1 — dưới ngưỡng 3:1 của WCAG 1.4.11
        // cho thành phần giao diện, tức nút mờ thành nút ĐỌC KHÔNG RA ở đúng một nửa số người dùng.
        // Một con số không phục vụ nổi hai nền ⇒ khai theo VAI TRÒ trong globals.css, mỗi theme
        // một giá trị (Tối .5 · Sáng .62). Bảng số đo đầy đủ nằm ngay tại chỗ khai.
        // ⭐ Và vì theme sáng sắp đổi sang bản canh-Apple: lúc đó chỉ đổi token, tệp này đứng yên.
        opacity: disabled ? 'var(--mo-vo-hieu)' : 1,
        touchAction: 'manipulation',
        transition: 'background .15s, color .15s',
        fontSize: 10.5,
        whiteSpace: 'nowrap',
      }
    : {
        display: 'grid',
        placeItems: 'center',
        width: sizeValue,
        height: sizeValue,
        borderRadius: RADIUS.full,
        border: active ? '1px solid var(--accent-ring)' : '1px solid transparent',
        background: active ? 'var(--accent-soft)' : 'transparent',
        color: active ? 'var(--accent)' : 'var(--t2)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        // 16/08 (B2, a11y): 0.35 → 0.5 → TOKEN `--mo-vo-hieu`. Hằng số `0.5` chỉ đúng cho nền TỐI
        // (4,01:1); nền SÁNG cùng con số đó rơi xuống 2,55:1 — dưới ngưỡng 3:1 của WCAG 1.4.11
        // cho thành phần giao diện, tức nút mờ thành nút ĐỌC KHÔNG RA ở đúng một nửa số người dùng.
        // Một con số không phục vụ nổi hai nền ⇒ khai theo VAI TRÒ trong globals.css, mỗi theme
        // một giá trị (Tối .5 · Sáng .62). Bảng số đo đầy đủ nằm ngay tại chỗ khai.
        // ⭐ Và vì theme sáng sắp đổi sang bản canh-Apple: lúc đó chỉ đổi token, tệp này đứng yên.
        opacity: disabled ? 'var(--mo-vo-hieu)' : 1,
        touchAction: 'manipulation',
        transition: 'background .15s, color .15s',
        flexShrink: 0,
      };

  const coLyDo = disabled && Boolean(disabledReason);

  const button = (
    <button
      type="button"
      aria-pressed={active}
      aria-label={label}
      // KHÔNG dùng thuộc tính `disabled`: nó gạt nút khỏi thứ tự Tab và chặn luôn `focus`
      // (đo được, xem đầu file) ⇒ lý do trở thành thứ chỉ chuột mới đọc nổi.
      aria-disabled={disabled || undefined}
      aria-describedby={coLyDo ? reasonId : undefined}
      // Chặn kích hoạt: không gắn `onClick` thì cả chuột lẫn Enter/Space đều không chạy được
      // (bàn phím kích hoạt nút bằng chính sự kiện click). `type="button"` sẵn có chặn submit form.
      onClick={disabled ? undefined : onClick}
      style={style}
    >
      {icon}
      {showLabel && <span>{label}</span>}
      {/* Dock 3D mở rộng vốn hiện phím tắt LUÔN THẤY (không chỉ lúc hover) — giữ hành vi cũ khi
          gộp vào ToolbarChip, không lùi một bậc discoverability. */}
      {showLabel && shortcutHint && (
        <span style={{ fontSize: 9, opacity: active ? 0.8 : 0.6 }}>{shortcutHint}</span>
      )}
    </button>
  );

  // Nút mờ đi CÙNG một đường với nút thường — chỉ đổi NỘI DUNG ô giải nghĩa thành lý do.
  // (Trước 16/08 chỗ này `return button` sớm, cắt nút mờ khỏi Tooltip — xem đầu file.)
  return (
    <Tooltip label={label} desc={disabled ? disabledReason : desc} shortcut={shortcutHint} hinh={hinh}>
      {button}
      {coLyDo && (
        <span id={reasonId} className="if-tooltip-a11y">
          {disabledReason}
        </span>
      )}
    </Tooltip>
  );
}

/**
 * `ToolbarBar` — vỏ capsule dùng chung cho thanh công cụ (KB-1: h44 · r-full · đệm 6 · gap 2).
 *
 * 16/08 (B2) — ĐÃ WIRE, hết nợ 15/08. Nó nay mang cả MẶT (nền · viền · đổ bóng), không chỉ khung
 * xếp: KB-1 gọi đây là "vỏ capsule", mà vỏ thì phải có mặt — để mỗi chặng tự vẽ nền là chỗ ba
 * chặng lại trôi ra ba kiểu.
 *
 * ▸ BO ĐỒNG TÂM TỰ ĐÚNG, không cần khai số: `RADIUS.full` (999) bị trình duyệt kẹp về nửa cạnh
 *   ngắn ⇒ vỏ 44 cho bo 22, nút 32 cho bo 16, mà `22 − đệm 6 = 16` — đúng công thức
 *   `rInner = rOuter − pad` của luật §2d, ở MỌI cỡ, kể cả khi `--tap` nở lên 44 lúc chạm.
 *   Vì thế KHÔNG được thay `RADIUS.full` bằng một con số cụ thể: thay là mất tính đồng tâm.
 *
 * `style` chỉ nhận phần ĐỊNH VỊ của nơi gọi (absolute/bottom/z-index…) — dock 3D nổi trên khung
 * nhìn, thanh 2D nằm trong toolbelt; hình dạng thì tuyệt đối không cho ghi đè.
 */
export function ToolbarBar({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div
      style={{
        ...style,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        height: 'var(--tap-lg)',
        padding: '0 6px',
        borderRadius: RADIUS.full,
        background: 'var(--panel)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-pop)',
      }}
    >
      {children}
    </div>
  );
}

/** Separator KB-1: "bỏ gạch | lửng" — vạch cao ≤20 canh giữa, không phải ký tự pipe. */
ToolbarBar.Sep = function ToolbarBarSep() {
  return <span aria-hidden style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 4px', flexShrink: 0 }} />;
};
