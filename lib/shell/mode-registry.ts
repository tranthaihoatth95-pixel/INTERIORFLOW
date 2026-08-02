import type { ReactNode } from 'react';

/**
 * lib/shell/mode-registry.ts — Trụ 4 (`docs/SPEC-HA-TANG-UI-IF.md` §2): "MODE = BỐN KHAI BÁO,
 * KHÔNG PHẢI APP RIÊNG". Mode chỉ được khai ĐÚNG 4 thứ dưới đây — cấm mang state ẩn (bài học
 * Blender: workspace của họ từng cho phép side-effect tự do, phải RÚT LẠI vì gây lệch).
 *
 * Phạm vi VIỆC 2 (03/08): mới đăng ký mode `cad` làm mẫu (CadStageScreen gọi `getMode('cad')`
 * để lấy nội dung Navigator thay vì tự import LayerPanel thẳng). Render/Present CHƯA chuyển qua
 * registry này — vẫn dùng `StageShell` cũ + props trực tiếp (additive, không ép migrate khi nội
 * dung Navigator của 2 chặng đó chưa có mock riêng). Xem `docs/SPEC-HA-TANG-UI-IF.md` §5 "THỨ TỰ
 * THI CÔNG" bước 4-5 cho phần chuyển tiếp còn lại.
 */
export interface ModeConfig {
  /** Nội dung ổ ② Navigator (danh sách phân cấp — Lớp/Node/Trang tuỳ chặng). */
  navigator: ReactNode;
  /** Kệ Thư viện lọc theo mode này (key khớp `docs/SPEC-STAGE-LIBRARIES.md`). */
  shelves: string[];
  /** Lát cắt sổ lệnh (`lib/commands/registry.ts`, CHƯA có ở VIỆC 2 — để tên slug, dùng khi
   * sổ lệnh gộp xong ở bước 2 "THỨ TỰ THI CÔNG"). */
  commands: string;
}

const registry = new Map<string, ModeConfig>();

export function defineMode(id: string, config: ModeConfig): void {
  registry.set(id, config);
}

export function getMode(id: string): ModeConfig | undefined {
  return registry.get(id);
}
