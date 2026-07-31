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

import { groupedCadCommands } from './cad/command-aliases';

export type ShortcutScope = 'toàn cục' | 'cad' | 'render' | 'present';

export type KeyToken = 'mod' | 'shift' | string;

export interface ShortcutEntry {
  scope: ShortcutScope;
  /** Token phím — vd ['mod','Z'] (⌘Z/Ctrl+Z), ['F8'] (F8, không đổi theo nền). */
  keys: KeyToken[];
  label: string;
  /** Nhóm hiển thị trong scope (vd "Sửa", "Xem", "Tệp") — không bắt buộc. */
  group?: string;
}

/** '⌘Z'/'Ctrl+Z' · 'F8'/'F8' · '⌘⇧S'/'Ctrl+Shift+S' — cùng quy ước modKey/modShiftKey (lib/kbd.ts). */
export function formatShortcutKeys(keys: KeyToken[], isMac: boolean): string {
  const MOD = isMac ? '⌘' : 'Ctrl';
  const SHIFT = isMac ? '⇧' : 'Shift';
  const parts = keys.map((t) => (t === 'mod' ? MOD : t === 'shift' ? SHIFT : t));
  return isMac ? parts.join('') : parts.join('+');
}

export const SHORTCUTS: ShortcutEntry[] = [
  // ── Toàn cục ──────────────────────────────────────────────────────────────────────────────
  {
    scope: 'toàn cục', keys: ['mod', '/'], label: 'Mở/đóng bảng tra phím tắt này',
  },
  {
    scope: 'toàn cục', keys: ['?'], label: 'Mở/đóng bảng tra phím tắt này (phím phụ)',
  },
  {
    scope: 'toàn cục', keys: ['mod', 'K'],
    label: 'Bảng lệnh nhanh (⚠ hiện chỉ hoạt động ở Trang chủ/màn hình Ý tưởng, chưa có ở CAD/Present)',
  },
  { scope: 'toàn cục', keys: ['mod', 'J'], label: 'Chuyển chặng Drafting CAD ↔ Rendering ↔ Presenting' },

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
  { scope: 'cad', keys: ['mod', 'S'], label: 'Lưu ngay (ép autosave chạy, không đợi debounce)', group: 'Tệp' },
  { scope: 'cad', keys: ['mod', 'shift', 'S'], label: 'Xuất tệp .idf', group: 'Tệp' },
  { scope: 'cad', keys: ['mod', '0'], label: 'Vừa khung (zoom fit toàn bản vẽ)', group: 'Xem' },
  { scope: 'cad', keys: ['F'], label: 'Vừa khung (zoom fit — phím tắt gốc, đã có từ trước)', group: 'Xem' },
  { scope: 'cad', keys: ['mod', '='], label: 'Phóng to', group: 'Xem' },
  { scope: 'cad', keys: ['mod', '-'], label: 'Thu nhỏ', group: 'Xem' },
  { scope: 'cad', keys: ['F8'], label: 'Khoá/mở Ortho (giữ hướng ngang/dọc khi vẽ)', group: 'Xem' },
  { scope: 'cad', keys: ['F12'], label: 'Bật/tắt Dynamic Input (số cạnh con trỏ)', group: 'Xem' },
  { scope: 'cad', keys: ['Space', '(giữ)'], label: 'Giữ để kéo màn hình (pan tạm)', group: 'Xem' },
  { scope: 'cad', keys: ['Space', '(gõ nhanh)'], label: 'Lặp lại lệnh vừa dùng', group: 'Vẽ' },
  { scope: 'cad', keys: ['Enter'], label: 'Chốt/kết thúc thao tác đang vẽ', group: 'Vẽ' },
  { scope: 'cad', keys: ['Esc'], label: 'Huỷ thao tác đang vẽ, về công cụ Chọn', group: 'Vẽ' },
];

/** Nhóm "render" (chặng Rendering/flow-graph) — FlowCanvas.tsx, tách khỏi mảng tĩnh vì list dài. */
SHORTCUTS.push(
  { scope: 'render', keys: ['mod', 'D'], label: 'Nhân bản node đã chọn', group: 'Sửa' },
  { scope: 'render', keys: ['mod', 'G'], label: 'Gộp nhóm node đã chọn', group: 'Sửa' },
  { scope: 'render', keys: ['mod', 'Z'], label: 'Hoàn tác', group: 'Sửa' },
  { scope: 'render', keys: ['mod', 'shift', 'Z'], label: 'Làm lại', group: 'Sửa' },
  { scope: 'render', keys: ['mod', 'Y'], label: 'Làm lại (phím Windows)', group: 'Sửa' },
  { scope: 'render', keys: ['Space', '(giữ)'], label: 'Giữ để kéo màn hình (pan tạm)', group: 'Xem' },
  { scope: 'render', keys: ['V'], label: 'Công cụ Chọn', group: 'Vẽ' },
  { scope: 'render', keys: ['H'], label: 'Công cụ kéo màn hình (Pan)', group: 'Vẽ' },
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
  { scope: 'present', keys: ['mod', '='], label: 'Phóng to', group: 'Xem' },
  { scope: 'present', keys: ['mod', '-'], label: 'Thu nhỏ', group: 'Xem' },
  { scope: 'present', keys: ['mod', '0'], label: 'Vừa khung', group: 'Xem' },
  { scope: 'present', keys: ['Tab'], label: 'Chọn phần tử kế tiếp', group: 'Sửa' },
  { scope: 'present', keys: ['mod', 'shift', ']'], label: 'Đưa lên trước 1 lớp', group: 'Sửa' },
  { scope: 'present', keys: ['mod', 'shift', '['], label: 'Đưa ra sau 1 lớp', group: 'Sửa' },
);

export function shortcutsByScope(scope: ShortcutScope): ShortcutEntry[] {
  return SHORTCUTS.filter((s) => s.scope === scope);
}

/** CAD · lệnh gõ tay kiểu AutoCAD — alias gộp theo nghĩa, đọc trực tiếp từ command-aliases.ts. */
export function cadTypedCommandGroups(): { cmds: string[]; label: string }[] {
  return groupedCadCommands();
}
