// lib/three/mode-render-3d.ts — KHAI BÁO mode Vẽ 3D theo Trụ 4 `docs/SPEC-HA-TANG-UI-IF.md`:
// "Mode = BỐN khai báo, không phải app riêng" — navigator · canvas · shelves · commands.
// Cấm mang state ẩn (bài học Blender workspace, ghi trong spec).
//
// TODO(CHINH): `defineMode()` registry CHƯA tồn tại (đã grep toàn repo 03/08 — 0 kết quả ngoài
// docs; CHINH đang viết AppShell 6 ổ + registry trên main). Khi registry có thật:
//   import { defineMode } from '<đường dẫn registry>';
//   defineMode('render.3d', RENDER_3D_MODE);
// rồi XOÁ export tạm này. KHÔNG tự chế cơ chế đăng ký khác ở đây (đúng brief) — object thuần
// đúng hình dạng spec, cắm vào là chạy.

/** Đúng 4 khai báo của Trụ 4 + stage/label như ví dụ trong spec. */
export interface ModeDefinition {
  stage: 'render' | 'cad' | 'present';
  label: [string, string];
  /** ổ ② — tên component navigator. */
  navigator: string;
  /** ổ ③ — tên component canvas. */
  canvas: string;
  /** kệ Thư viện mở theo mode này. */
  shelves: string[];
  /** lát cắt sổ lệnh. */
  commands: string;
}

export const RENDER_3D_MODE: ModeDefinition = {
  stage: 'render',
  label: ['Vẽ 3D', '3D'],
  navigator: 'CommandPanel',
  canvas: 'Viewport3D',
  shelves: ['material', 'camera', 'massing'],
  commands: 'render.3d.*',
};
