/**
 * lib/shortcuts.ts — MỘT NGUỒN DUY NHẤT cho bảng tra phím tắt (`7.3.33`, Sprint "Lộ nền" 31/07).
 *
 * Phát hiện gốc của sprint này (`docs/KIEM-NEN-2026-07-31.md`): app đã có nhiều phím tắt/lệnh
 * gõ tay thật (vd `XL`/`AR`/`ARP` kiểu AutoCAD ở `CadToolbar.tsx`) nhưng KHÔNG có chỗ nào liệt
 * kê — "thứ ấn tượng nhất thì vô hình". File này KHÔNG thêm hành vi mới, chỉ khai báo những gì
 * ĐÃ CÓ (xác nhận bằng đọc code thật, không đoán) để `ShortcutsPanel.tsx` hiển thị.
 *
 * `keys` là TOKEN, không phải chuỗi đã format sẵn — 'mod'/'shift' được `formatShortcutKeys()`
 * dịch theo nền tảng LÚC RENDER (⌘/⇧ trên Mac, Ctrl+/Shift+ trên Windows, cùng quy ước
 * `lib/kbd.ts`), tránh hardcode ký tự Mac vào dữ liệu. Token khác (vd 'F8', 'Esc', 'Space')
 * là chữ hiển thị y nguyên, không phân biệt nền tảng.
 *
 * Lệnh gõ tay CAD (`XL`/`AR`/`ARP`…) KHÔNG khai tay ở đây — đọc trực tiếp từ
 * `groupedCadCommands()` (`lib/cad/command-aliases.ts`, cùng mảng `CommandLine` autocomplete
 * dùng) qua `cadTypedCommandGroups()` bên dưới, đúng yêu cầu "đừng chép tay, chép tay là lệch".
 */

import { groupedCadCommands, groupedCadCommandsByCategory } from './cad/command-aliases';

export type ShortcutScope = 'toàn cục' | 'cad' | 'render' | 'present';

export type KeyToken = 'mod' | 'shift' | string;

export interface ShortcutEntry {
  scope: ShortcutScope;
  /** Token phím — vd ['mod','Z'] (⌘Z/Ctrl+Z), ['F8'] (F8, không đổi theo nền). */
  keys: KeyToken[];
  label: string;
  /** Nhóm hiển thị trong scope (vd "Sửa", "Xem", "Tệp") — không bắt buộc. */
  group?: string;
  /** VIỆC 2 UI (04/08) — phím đã KHAI nhưng CHƯA nối hành vi thật (hoặc trình duyệt/OS giữ
   * cứng, không ghi đè được từ JS). Hiện mờ trong `ShortcutsPanel.tsx` kèm `disabledReason`,
   * KHÔNG giấu (luật §9, `docs/00-BAT-DAU-DOC-DAY.md`: ô trống là bằng chứng còn việc). Cùng
   * quy ước field name với `IOFormatItem` (`components/ui/IOMenu.tsx`) — không bịa tên mới. */
  disabled?: boolean;
  disabledReason?: string;
}

/**
 * '⌘Z'/'Ctrl+Z' · 'F8'/'F8' · '⌘⇧S'/'Ctrl+Shift+S' — cùng quy ước modKey/modShiftKey (lib/kbd.ts).
 * Token 'ctrl' RIÊNG (khác 'mod') — chỉ dùng cho ⌃⌘Q khoá màn (VIỆC 3, cố ý bắt CẢ Ctrl LẪN ⌘
 * cùng lúc, đúng phím khoá màn thật của macOS) — luôn hiện '⌃' bất kể nền tảng, vì đây vốn là
 * phím kiểu Mac, không có quy ước Windows tương đương để dịch sang.
 */
export function formatShortcutKeys(keys: KeyToken[], isMac: boolean): string {
  const MOD = isMac ? '⌘' : 'Ctrl';
  const SHIFT = isMac ? '⇧' : 'Shift';
  const parts = keys.map((t) => (t === 'mod' ? MOD : t === 'shift' ? SHIFT : t === 'ctrl' ? '⌃' : t));
  return isMac ? parts.join('') : parts.join('+');
}

export const SHORTCUTS: ShortcutEntry[] = [
  // ── Toàn cục (đăng ký MỘT CHỖ trong AppChrome.tsx, trừ khi ghi chú khác) ─────────────────────
  {
    scope: 'toàn cục', keys: ['mod', '/'], label: 'Mở/đóng bảng tra phím tắt này',
  },
  {
    scope: 'toàn cục', keys: ['?'], label: 'Mở/đóng bảng tra phím tắt này (phím phụ)',
  },
  {
    scope: 'toàn cục', keys: ['mod', 'K'],
    label: 'Bảng lệnh nhanh — AppCommandPalette.tsx, mount trong AppShell (mọi route dùng AppShell: Thiết kế 2D · Thiết kế 3D · Trình chiếu · Files · Cài đặt)',
  },
  { scope: 'toàn cục', keys: ['mod', 'J'], label: 'Chuyển chặng Thiết kế 2D ↔ Thiết kế 3D ↔ Trình chiếu' },
  { scope: 'toàn cục', keys: ['mod', '0'], label: 'Về Home — hỏi trước nếu còn thay đổi chưa lưu' },
  { scope: 'toàn cục', keys: ['mod', 'B'], label: 'Ẩn/hiện khung Navigator (trái)' },
  { scope: 'toàn cục', keys: ['mod', 'L'], label: 'Mở sheet Thư viện (khối/vật liệu/template — tự lọc theo chặng đang mở)' },
  {
    scope: 'toàn cục', keys: ['mod', '\\'],
    label: 'Ẩn/hiện CẢ Navigator lẫn Inspector (chế độ zen) — AppShell.tsx, có sẵn từ trước',
  },
  {
    scope: 'toàn cục', keys: ['ctrl', 'mod', 'Q'],
    label: 'Khoá màn (kiểu macOS) — ép lưu ngay trước khi khoá, mở khoá = đăng nhập lại',
  },

  // ── CAD ───────────────────────────────────────────────────────────────────────────────────
  { scope: 'cad', keys: ['mod', 'Z'], label: 'Hoàn tác', group: 'Sửa' },
  { scope: 'cad', keys: ['mod', 'shift', 'Z'], label: 'Làm lại', group: 'Sửa' },
  { scope: 'cad', keys: ['mod', 'Y'], label: 'Làm lại (phím Windows)', group: 'Sửa' },
  { scope: 'cad', keys: ['mod', 'C'], label: 'Sao chép đối tượng đã chọn', group: 'Sửa' },
  { scope: 'cad', keys: ['mod', 'V'], label: 'Dán (lệch +20mm so bản gốc)', group: 'Sửa' },
  { scope: 'cad', keys: ['mod', 'A'], label: 'Chọn tất cả đối tượng trên tờ hiện tại', group: 'Sửa' },
  { scope: 'cad', keys: ['mod', 'D'], label: 'Nhân bản đối tượng đã chọn', group: 'Sửa' },
  { scope: 'cad', keys: ['Delete'], label: 'Xoá đối tượng đã chọn', group: 'Sửa' },
  { scope: 'cad', keys: ['Backspace'], label: 'Xoá đối tượng đã chọn (khi không có gì đang gõ)', group: 'Sửa' },
  {
    scope: 'cad', keys: ['mod', 'G'], label: 'Nhóm đối tượng đã chọn', group: 'Sửa',
    disabled: true, disabledReason: 'CAD chưa có khái niệm "nhóm" đối tượng — mỗi entity vẫn rời nhau',
  },
  {
    scope: 'cad', keys: ['mod', 'shift', 'G'], label: 'Bỏ nhóm', group: 'Sửa',
    disabled: true, disabledReason: 'CAD chưa có khái niệm "nhóm" đối tượng',
  },
  { scope: 'cad', keys: ['mod', 'S'], label: 'Lưu ngay (ép autosave chạy, không đợi debounce)', group: 'Tệp' },
  { scope: 'cad', keys: ['mod', 'shift', 'S'], label: 'Xuất tệp .idf', group: 'Tệp' },
  {
    scope: 'cad', keys: ['mod', 'O'], label: 'Mở tệp', group: 'Tệp',
    disabled: true, disabledReason: 'Nút "Mở tệp" trên thanh xổ nhiều lựa chọn (demo/.idf/DXF/AI mô tả) — chưa có 1 hành động dứt khoát để gán phím',
  },
  { scope: 'cad', keys: ['mod', 'P'], label: 'Mở xem trước / xuất PDF Paper', group: 'Tệp' },
  {
    scope: 'cad', keys: ['mod', 'N'], label: 'Tờ bản vẽ mới', group: 'Tệp',
    disabled: true, disabledReason: '⌘N/Ctrl+N do trình duyệt giữ cứng (mở cửa sổ/tab mới) — JS không ghi đè được. Dùng nút "+" cạnh tên tờ',
  },
  { scope: 'cad', keys: ['mod', '9'], label: 'Vừa khung (zoom fit toàn bản vẽ)', group: 'Xem' },
  { scope: 'cad', keys: ['F'], label: 'Vừa khung (zoom fit — phím tắt gốc, đã có từ trước)', group: 'Xem' },
  { scope: 'cad', keys: ['mod', '='], label: 'Phóng to', group: 'Xem' },
  { scope: 'cad', keys: ['mod', '-'], label: 'Thu nhỏ', group: 'Xem' },
  {
    scope: 'cad', keys: ['mod', "'"], label: 'Bật/tắt lưới', group: 'Xem',
    disabled: true, disabledReason: 'CAD chưa có lưới nền bật/tắt được (nền vẽ hiện cố định)',
  },
  { scope: 'cad', keys: ['F8'], label: 'Khoá/mở Ortho (giữ hướng ngang/dọc khi vẽ)', group: 'Xem' },
  { scope: 'cad', keys: ['F12'], label: 'Bật/tắt Dynamic Input (số cạnh con trỏ)', group: 'Xem' },
  { scope: 'cad', keys: ['Space', '(giữ)'], label: 'Giữ để kéo màn hình (pan tạm)', group: 'Xem' },
  { scope: 'cad', keys: ['Space', '(gõ nhanh)'], label: 'Lặp lại lệnh vừa dùng', group: 'Vẽ' },
  { scope: 'cad', keys: ['Enter'], label: 'Chốt/kết thúc thao tác đang vẽ', group: 'Vẽ' },
  { scope: 'cad', keys: ['Esc'], label: 'Huỷ thao tác đang vẽ, về công cụ Chọn', group: 'Vẽ' },
];

/** Nhóm "render" (chặng Rendering/flow-graph) — FlowCanvas.tsx/BottomToolbar.tsx, tách khỏi
 * mảng tĩnh vì list dài. */
SHORTCUTS.push(
  { scope: 'render', keys: ['mod', 'D'], label: 'Nhân bản node đã chọn', group: 'Sửa' },
  { scope: 'render', keys: ['mod', 'G'], label: 'Gộp nhóm node đã chọn', group: 'Sửa' },
  {
    scope: 'render', keys: ['mod', 'shift', 'G'], label: 'Bỏ nhóm', group: 'Sửa',
    disabled: true, disabledReason: 'Chỉ bỏ nhóm được qua chuột phải trên khung nhóm (cần chọn đúng group, chưa gán phím cho lựa chọn bất kỳ)',
  },
  { scope: 'render', keys: ['mod', 'Z'], label: 'Hoàn tác', group: 'Sửa' },
  { scope: 'render', keys: ['mod', 'shift', 'Z'], label: 'Làm lại', group: 'Sửa' },
  { scope: 'render', keys: ['mod', 'Y'], label: 'Làm lại (phím Windows)', group: 'Sửa' },
  {
    scope: 'render', keys: ['mod', 'S'], label: 'Lưu', group: 'Tệp',
    disabled: true, disabledReason: 'Chặng Dựng (bảng node) chưa có khái niệm "lưu tay" riêng như CAD/Present',
  },
  {
    scope: 'render', keys: ['mod', 'O'], label: 'Mở tệp', group: 'Tệp',
    disabled: true, disabledReason: 'Dùng nút "Mở tệp" trên thanh — chưa có 1 hành động dứt khoát để gán phím',
  },
  {
    scope: 'render', keys: ['mod', 'N'], label: 'Bảng mới', group: 'Tệp',
    disabled: true, disabledReason: '⌘N/Ctrl+N do trình duyệt giữ cứng (mở cửa sổ/tab mới) — JS không ghi đè được',
  },
  { scope: 'render', keys: ['mod', '9'], label: 'Vừa khung (fit view)', group: 'Xem' },
  { scope: 'render', keys: ['mod', '='], label: 'Phóng to', group: 'Xem' },
  { scope: 'render', keys: ['mod', '-'], label: 'Thu nhỏ', group: 'Xem' },
  { scope: 'render', keys: ['mod', "'"], label: 'Bật/tắt snap lưới', group: 'Xem' },
  { scope: 'render', keys: ['Space', '(giữ)'], label: 'Giữ để kéo màn hình (pan tạm)', group: 'Xem' },
  { scope: 'render', keys: ['W'], label: 'Mở lệnh Tường hai điểm', group: 'Vẽ' },
  { scope: 'render', keys: ['V'], label: 'Công cụ Chọn', group: 'Vẽ' },
  { scope: 'render', keys: ['H'], label: 'Công cụ kéo màn hình (Pan)', group: 'Vẽ' },
  { scope: 'render', keys: ['Esc'], label: 'Về công cụ Chọn', group: 'Vẽ' },
);

/** Present — PresentEditor.tsx. */
SHORTCUTS.push(
  { scope: 'present', keys: ['mod', 'A'], label: 'Chọn tất cả phần tử trên slide', group: 'Sửa' },
  { scope: 'present', keys: ['mod', 'Z'], label: 'Hoàn tác', group: 'Sửa' },
  { scope: 'present', keys: ['mod', 'shift', 'Z'], label: 'Làm lại', group: 'Sửa' },
  { scope: 'present', keys: ['mod', 'Y'], label: 'Làm lại (phím Windows)', group: 'Sửa' },
  { scope: 'present', keys: ['mod', 'D'], label: 'Nhân bản phần tử đã chọn', group: 'Sửa' },
  { scope: 'present', keys: ['mod', 'C'], label: 'Sao chép', group: 'Sửa' },
  { scope: 'present', keys: ['mod', 'V'], label: 'Dán', group: 'Sửa' },
  { scope: 'present', keys: ['mod', 'G'], label: 'Nhóm phần tử đã chọn', group: 'Sửa' },
  { scope: 'present', keys: ['mod', 'shift', 'G'], label: 'Bỏ nhóm', group: 'Sửa' },
  { scope: 'present', keys: ['Tab'], label: 'Chọn phần tử kế tiếp', group: 'Sửa' },
  { scope: 'present', keys: ['mod', 'shift', ']'], label: 'Đưa lên trước 1 lớp', group: 'Sửa' },
  { scope: 'present', keys: ['mod', 'shift', '['], label: 'Đưa ra sau 1 lớp', group: 'Sửa' },
  { scope: 'present', keys: ['mod', 'S'], label: 'Lưu ngay (ép autosave chạy, không đợi debounce)', group: 'Tệp' },
  {
    scope: 'present', keys: ['mod', 'shift', 'S'], label: 'Lưu thành', group: 'Tệp',
    disabled: true, disabledReason: 'Chưa có "lưu thành" riêng — ⌘S/Ctrl+S đã ép ghi ngay bản đang mở',
  },
  {
    scope: 'present', keys: ['mod', 'O'], label: 'Mở tệp', group: 'Tệp',
    disabled: true, disabledReason: 'Nút "Mở tệp" trên thanh xổ nhiều lựa chọn — chưa có 1 hành động dứt khoát để gán phím',
  },
  {
    scope: 'present', keys: ['mod', 'P'], label: 'In / xuất PDF', group: 'Tệp',
    disabled: true, disabledReason: 'Nút "Xuất" trên thanh xổ nhiều định dạng (PDF/PPTX) — chưa có 1 hành động dứt khoát để gán phím',
  },
  {
    scope: 'present', keys: ['mod', 'N'], label: 'Slide mới', group: 'Tệp',
    disabled: true, disabledReason: '⌘N/Ctrl+N do trình duyệt giữ cứng (mở cửa sổ/tab mới) — JS không ghi đè được. Dùng ô "Thêm slide"',
  },
  { scope: 'present', keys: ['mod', '='], label: 'Phóng to', group: 'Xem' },
  { scope: 'present', keys: ['mod', '-'], label: 'Thu nhỏ', group: 'Xem' },
  { scope: 'present', keys: ['mod', '9'], label: 'Vừa khung', group: 'Xem' },
  {
    scope: 'present', keys: ['mod', "'"], label: 'Bật/tắt lưới', group: 'Xem',
    disabled: true, disabledReason: 'Trình chiếu chưa có lưới nền bật/tắt được',
  },
  { scope: 'present', keys: ['Esc'], label: 'Bỏ chọn / thoát chế độ đang chỉnh', group: 'Sửa' },
);

export function shortcutsByScope(scope: ShortcutScope): ShortcutEntry[] {
  return SHORTCUTS.filter((s) => s.scope === scope);
}

/** CAD · lệnh gõ tay kiểu AutoCAD — alias gộp theo nghĩa, đọc trực tiếp từ command-aliases.ts. */
export function cadTypedCommandGroups(): { cmds: string[]; label: string }[] {
  return groupedCadCommands();
}

/** CAD · lệnh gõ tay gộp theo 5 nhóm hiển thị (Vẽ/Kích thước & mặt cắt/Biến đổi/Nhìn/Chọn·xoá·
 * hoàn tác) — dùng cho `ShortcutsPanel.tsx` tab "Lệnh gõ tay" (khớp bản mẫu Hoà gửi 31/07). */
export function cadTypedCommandGroupsByCategory() {
  return groupedCadCommandsByCategory();
}
