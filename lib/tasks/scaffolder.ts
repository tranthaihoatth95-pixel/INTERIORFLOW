/**
 * lib/tasks/scaffolder.ts — ProjectScaffolder (Máy Sinh Khung, id registry `scaffolder`,
 * `docs/SPEC-KHOI-TAO-DU-AN-2026-08-11.md` mảnh TASK).
 *
 * Logic THUẦN (không React, không prisma) — test bằng sucrase-node như lib/tasks/board.ts.
 * Vai trò: đọc ProjectProfile → GỢI Ý bộ template việc (khoá của BOARD_TEMPLATES,
 * components/tasks/TaskBoardScreen.tsx) + gắn `stage` cho việc gieo ra (TaskContext Link).
 *
 * Luật nền (spec ①):
 *  - Thiếu `loaiHinh` hoặc khoá lạ → trả [] — MÁY IM LẶNG, không đoán bừa, không gợi ý ma.
 *  - Gợi ý chỉ là gợi ý: UI cho tick/bỏ tự do (luật 6 — người quyết cuối), đây không phải lệnh.
 *  - Map tường minh, không heuristic chuỗi mờ: khoá loại hình là danh sách đóng
 *    LOAI_HINH_OPTIONS; profile ghi khoá, KHÔNG ghi nhãn hiển thị.
 */

import type { TaskStage } from '../server/tasks';

/** Khoá loại hình — nguồn duy nhất cho cả select trong UI lẫn map gợi ý. */
export const LOAI_HINH_OPTIONS: { key: string; vi: string; en: string }[] = [
  { key: 'nha-o', vi: 'Nhà ở / căn hộ', en: 'Residential / apartment' },
  { key: 'van-phong', vi: 'Văn phòng', en: 'Office' },
  { key: 'fnb', vi: 'F&B (quán, nhà hàng)', en: 'F&B (café, restaurant)' },
  { key: 'khach-san', vi: 'Khách sạn / lưu trú', en: 'Hotel / hospitality' },
];

/**
 * Template → stage của MỌI việc gieo từ template đó (TaskContext Link — việc sinh ra có chip
 * ngữ cảnh, bấm là nhảy đúng chặng). Map theo nghiệp vụ chốt trong phiếu:
 * concept/technical/fitout → 'concept' (Thiết kế 2D) · render → 'render' · present → 'present'.
 */
export const TEMPLATE_STAGE: Record<string, TaskStage> = {
  concept: 'concept',
  technical: 'concept',
  render: 'render',
  present: 'present',
  fitout: 'concept',
};

export interface ScaffoldSuggestion {
  /** Khoá của BOARD_TEMPLATES (components/tasks/TaskBoardScreen.tsx). */
  templateKey: string;
  /** Stage gắn cho từng việc gieo từ template này. */
  stage: TaskStage;
  /** Căn cứ hiển thị cạnh checkbox — "vì loại hình …" (spec: gợi ý phải nêu lý do). */
  reasonVi: string;
  reasonEn: string;
}

/** Map tường minh loại hình → 1-2 bộ template (phiếu 12/08 — không suy diễn thêm). */
const SCAFFOLD_MAP: Record<string, string[]> = {
  'nha-o': ['concept', 'technical'],
  'van-phong': ['concept', 'fitout'],
  fnb: ['concept', 'fitout'],
  'khach-san': ['technical', 'fitout'],
};

/** Nhãn loại hình theo khoá — dùng dựng câu căn cứ; khoá lạ trả null. */
function loaiHinhLabel(key: string): { vi: string; en: string } | null {
  const o = LOAI_HINH_OPTIONS.find((x) => x.key === key);
  return o ? { vi: o.vi, en: o.en } : null;
}

/**
 * Gợi ý khung việc từ profile. Đầu vào chỉ cần `loaiHinh` (các field khác của profile chưa
 * tham gia quyết định ở v1 — diện tích/ngân sách là việc của TeamFit đợt 2, không đoán trước).
 */
export function suggestScaffold(profile: { loaiHinh?: string | null } | null | undefined): ScaffoldSuggestion[] {
  const key = profile?.loaiHinh?.trim() || '';
  if (!key) return []; // profile trống → máy im (X2)
  const templates = SCAFFOLD_MAP[key];
  const label = loaiHinhLabel(key);
  if (!templates || !label) return []; // khoá lạ → không đoán bừa

  return templates.map((templateKey) => ({
    templateKey,
    stage: TEMPLATE_STAGE[templateKey],
    reasonVi: `vì loại hình ${label.vi}`,
    reasonEn: `based on project type: ${label.en}`,
  }));
}

/** Stage cho 1 template bất kỳ (kể cả template người dùng tự tick ngoài gợi ý). Khoá lạ → null. */
export function stageForTemplate(templateKey: string): TaskStage | null {
  return TEMPLATE_STAGE[templateKey] ?? null;
}
