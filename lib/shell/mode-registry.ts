import type { ReactNode } from 'react';
import type { StageKey } from '@/lib/library/types';

/**
 * lib/shell/mode-registry.ts — Trụ 4 (`docs/SPEC-HA-TANG-UI-IF.md` §2): "MODE = BỐN KHAI BÁO,
 * KHÔNG PHẢI APP RIÊNG". Mode chỉ được khai ĐÚNG 4 thứ — cấm mang state ẩn (bài học Blender:
 * workspace của họ từng cho phép side-effect tự do, phải RÚT LẠI vì gây lệch).
 *
 * 05/08 VIỆC A3 (`docs/PHIEU-CODE-IF-DOT6-2026-08-03.md`) — TRƯỚC bản này có HAI khuôn khai mode
 * lệch nhau, cả hai đều 0 nơi gọi thật (`defineMode` 0 call site ngoài chính module này,
 * `getMode(` grep = 0 — comment cũ của file này CLAIM "CadStageScreen gọi getMode('cad')" nhưng
 * đó là ý định chưa làm, không phải sự thật):
 *   · `ModeConfig` (bản gốc file này) — 3 trường `{navigator: ReactNode, shelves, commands}`,
 *     THIẾU hẳn `canvas` — 1 trong 4 khai báo bắt buộc của Trụ 4.
 *   · `ModeDefinition` (`lib/three/mode-render-3d.ts`, đã XOÁ ở việc này) — đủ 6 trường nhưng
 *     `navigator`/`canvas` khai kiểu `string` (tên component) — repo không có cơ chế resolve
 *     tên→component nào, nên chỉ là mô tả trên giấy, không cắm được vào React.
 * Bản HỢP NHẤT dưới đây lấy đủ 6 trường của `ModeDefinition` (`stage`/`label` thêm ngoài 4 khai
 * báo lõi, đúng ví dụ code trong spec) + kiểu `ReactNode` thực dụng của `ModeConfig` cho
 * `navigator`/`canvas` (component đã dựng SẴN, gọi được ngay, không cần registry tên→component
 * riêng). 4 mode thật đã khai ở `CadStageScreen.tsx` (2d/sketch·2d/pro) và `HomeScreen.tsx`
 * (3d/node·3d/3d) — 2 màn đó ĐỌC khai báo qua `requireMode()`, không còn `if (mode === ...)`
 * rải rác cho phần canvas/navigator.
 */

/** Đúng 4 mode đã khai (Trụ 4 A3). Thêm mode mới PHẢI thêm id vào union này trước — ép mọi nơi
 * gọi `getMode`/`requireMode`/`defineMode` báo lỗi biên dịch cho tới khi khai đủ, chống "khai
 * nửa vời" (đúng bài học vừa xảy ra với `defineMode()`/`getMode()` cũ: khai xong không ai gọi). */
export type ModeId = '2d/sketch' | '2d/pro' | '3d/node' | '3d/3d';

export interface ModeConfig {
  /** Chặng chứa mode này — khớp `StageKey` (`lib/library/types.ts`), dùng để tra kệ Thư viện
   * theo chặng (`lib/library/shelves.ts`). */
  stage: StageKey;
  /** [vi, en] — nhãn hiển thị công tắc đổi mode. */
  label: [string, string];
  /** Ổ ② Navigator. */
  navigator: ReactNode;
  /** Ổ ③ Stage/canvas. */
  canvas: ReactNode;
  /** Kệ Thư viện áp cho mode này — id khớp `lib/library/shelves.ts`
   * (`STAGE_SHELVES`/`COMMON_SHELVES`). CHƯA nối lọc thật vào `LibrarySheet.tsx` (kệ hiện lọc
   * theo STAGE, không theo mode trong stage) — khai trước cho đúng Trụ 4, nối lọc là việc riêng
   * khi `LibrarySheet` cần tách kệ theo mode (cùng tình trạng "khai trước, nối sau" như
   * `commands` — không phải bịa, là nợ đã biết). */
  shelves: string[];
  /** Lát cắt sổ lệnh — `lib/commands/registry.ts` hiện nhóm theo `group` (`draw@1`…), CHƯA đọc
   * field này. Giữ dạng slug `<stage>.<mode>.*` đúng ví dụ trong `SPEC-HA-TANG-UI-IF.md` Trụ 4. */
  commands: string;
}

const registry = new Map<ModeId, ModeConfig>();

export function defineMode(id: ModeId, config: ModeConfig): void {
  registry.set(id, config);
}

export function getMode(id: ModeId): ModeConfig | undefined {
  return registry.get(id);
}

/** Dùng ở 2 màn CHẮC CHẮN đã tự `defineMode()` mọi id của mình ở đầu file (module-scope, chạy
 * trước khi component nào render) — báo lỗi RÕ RÀNG thay vì để `undefined` lọt vào JSX rồi âm
 * thầm không hiện gì (luật 8 CLAUDE.md "sai thì báo lỗi chứ không ship bản sai" — 1 dòng
 * `undefined` trong JSX là state ẩn kiểu khác: lỗi không tiếng động). */
export function requireMode(id: ModeId): ModeConfig {
  const found = registry.get(id);
  if (!found) {
    throw new Error(`[mode-registry] Mode "${id}" chưa khai — gọi defineMode('${id}', …) trước khi getMode/requireMode.`);
  }
  return found;
}
