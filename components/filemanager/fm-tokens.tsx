// components/filemanager/fm-tokens.ts — màu/bóng LẤY ĐÚNG từ docs/mocks/mock-files-polished.html
// + mock-settings-polished.html (Hoà chốt "làm giống hệt", 02/08). CHỦ Ý khác var(--bg)/--panel
// của app (tông ấm hơn) — đây là bộ token RIÊNG cho /files + /settings, khớp pixel với mock.
//
// Giá trị là CHUỖI `var(--fm-*)`, KHÔNG phải hex trực tiếp — để theme Sáng/Tối đổi được THẬT
// (yêu cầu Hoà 02/08: "Theme thật sự đổi được... CSS var đã có dark theme trong app"). `<FmThemeVars/>`
// (render 1 lần ở gốc mỗi shell) định nghĩa 2 bộ giá trị theo `[data-theme]` — cùng cơ chế app
// đang dùng (`app/globals.css`), chỉ khác là KHÔNG được sửa file đó (ngoài vùng file cứng) nên tự
// định nghĩa biến RIÊNG thay vì tái dùng `--bg`/`--t1`.../gốc (tránh sửa file có sẵn).
export const FM = {
  bg: 'var(--fm-bg)',
  panel: 'var(--fm-panel)',
  line: 'var(--fm-line)',
  ink: 'var(--fm-ink)',
  mut: 'var(--fm-mut)',
  mut2: 'var(--fm-mut2)',
  accent: '#6a57f5',
  accentSoft: 'var(--fm-accent-soft)',
  chip: 'var(--fm-chip)',
  shadow: '0 8px 24px rgba(0,0,0,.16), 0 1px 2px rgba(0,0,0,.08)',
  shadowSoft: '0 2px 10px rgba(0,0,0,.08)',
} as const;

const FM_THEME_CSS = `
  :root[data-theme="light"] {
    --fm-bg: #edebe7; --fm-panel: #ffffff; --fm-line: #e4e1db; --fm-ink: #26262b;
    --fm-mut: #8f8f97; --fm-mut2: #c3c1bc; --fm-chip: #f3f1ee; --fm-accent-soft: #efeafe;
  }
  :root[data-theme="dark"] {
    --fm-bg: #0c0c0e; --fm-panel: #1a1a1e; --fm-line: #2a2a31; --fm-ink: #f5f5f7;
    --fm-mut: #9e9ea8; --fm-mut2: #6e6e78; --fm-chip: #202024; --fm-accent-soft: rgba(106,87,245,.18);
  }
`;

/** Render 1 lần ở gốc mỗi shell (`FileManagerShell`/`PixelSettingsShell`) — định nghĩa `--fm-*`
 * theo `[data-theme]` đã có sẵn trên `<html>` (đọc từ `StoreHydrator`, xem app/layout.tsx).
 * `dangerouslySetInnerHTML` (KHÔNG phải `<style>{css}</style>`) — React escape text con của
 * `<style>` thành entity (`'` → `&#x27;`), nhưng trình duyệt KHÔNG giải mã entity bên trong
 * `<style>` (khác `<div>`) → CSS vỡ ở server-render + lệch với bản client re-render thật (không
 * escape) → hydration mismatch thật đã gặp khi verify browser. */
export function FmThemeVars() {
  return <style dangerouslySetInnerHTML={{ __html: FM_THEME_CSS }} />;
}
