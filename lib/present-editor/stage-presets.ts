/**
 * lib/present-editor/stage-presets.ts — NGUỒN DUY NHẤT cho kích thước "sân khấu" (PS-4).
 *
 * TRƯỚC PS-4: `standards.ts` (DECK_STANDARDS.stage) và `render.ts` (const W/H module-level)
 * khai báo 1920×1080 ĐỘC LẬP nhau (nợ kỹ thuật ghi ở STATUS.md — "Present stage-size CÓ 2
 * NGUỒN"). Từ nay MỌI nơi cần W/H sân khấu (render.ts, export.ts, EditorCanvas.tsx,
 * SlidePlayer.tsx, SlideStrip.tsx…) đọc từ `STAGE_PRESETS` qua `stageFor(id)` — không ai tự
 * khai const riêng nữa. `DECK_STANDARDS.stage` (standards.ts) trỏ thẳng vào
 * `STAGE_PRESETS['16:9']` — 1 nguồn.
 *
 * 5 khổ: 16:9 (mặc định — HÀNH VI GIỮ NGUYÊN so với trước PS-4) · A4 ngang/dọc · A3 ngang/dọc.
 * Đây là khổ TRÌNH BÀY (màn hình/chiếu) — độ phân giải screen-scale, KHÔNG phải in 300dpi
 * (PS-0 audit: render hiện chỉ ~116dpi khi áp lên khổ A3 giấy thật — in nét thật chờ chặng
 * Render nâng độ phân giải, NGOÀI PHẠM VI PS-4). UI hiển thị khổ này PHẢI ghi rõ
 * "khổ trình bày (màn hình/chiếu)", không hứa in production.
 *
 * Cách suy ra pixel: A4/A3 dùng đúng tỉ lệ giấy ISO 216 (1:√2 ≈ 1.41421356).
 * Vì A3 thật gấp đôi DIỆN TÍCH A4 (mỗi cạnh dài gấp √2), sân khấu A3 ở đây cũng nhân √2
 * mỗi trục so A4 để giữ đúng tỉ lệ diện tích thật — cạnh dài neo ở 1920 (khớp quy ước
 * 16:9 cũ) để mọi khổ cùng một bậc độ phân giải màn hình, không nhảy vọt lên cỡ in.
 */

export type StagePresetId = '16:9' | 'a4-landscape' | 'a4-portrait' | 'a3-landscape' | 'a3-portrait';

export interface StageSize {
  id: StagePresetId;
  /** nhãn tiếng Việt hiện trên UI (chip chọn khổ). */
  label: string;
  w: number;
  h: number;
  pxPerPctW: number;
  pxPerPctH: number;
}

function stage(id: StagePresetId, label: string, w: number, h: number): StageSize {
  return { id, label, w, h, pxPerPctW: w / 100, pxPerPctH: h / 100 };
}

/** Đăng ký 5 khổ — 1 NGUỒN DUY NHẤT, mọi module khác import từ đây (KHÔNG tự hardcode W/H). */
export const STAGE_PRESETS: Record<StagePresetId, StageSize> = {
  '16:9': stage('16:9', '16:9', 1920, 1080),
  'a4-landscape': stage('a4-landscape', 'A4 ngang', 1920, 1358),
  'a4-portrait': stage('a4-portrait', 'A4 dọc', 1358, 1920),
  'a3-landscape': stage('a3-landscape', 'A3 ngang', 2716, 1920),
  'a3-portrait': stage('a3-portrait', 'A3 dọc', 1920, 2716),
};

/** Mặc định — MỌI deck cũ (trước PS-4, không có field `stagePreset`) coi như dùng khổ này. */
export const DEFAULT_STAGE_PRESET: StagePresetId = '16:9';

/** Thứ tự hiển thị cho UI (dropdown/chip chọn khổ). */
export const STAGE_PRESET_ORDER: StagePresetId[] = [
  '16:9',
  'a4-landscape',
  'a4-portrait',
  'a3-landscape',
  'a3-portrait',
];

/** Lấy StageSize theo id — id rỗng/lạ → mặc định 16:9 (AN TOÀN NGƯỢC: deck cũ không đổi). */
export function stageFor(id?: StagePresetId | string | null): StageSize {
  if (id && Object.prototype.hasOwnProperty.call(STAGE_PRESETS, id)) {
    return STAGE_PRESETS[id as StagePresetId];
  }
  return STAGE_PRESETS[DEFAULT_STAGE_PRESET];
}

export function isLandscape(s: StageSize): boolean {
  return s.w >= s.h;
}
