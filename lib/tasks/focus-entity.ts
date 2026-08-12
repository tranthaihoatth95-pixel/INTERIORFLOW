/**
 * lib/tasks/focus-entity.ts — chiều ĐỌC + chiều NGƯỢC của TaskContext Link
 * (phiếu `docs/phieu-giao/focus-entity-2d-present.md`, dây máy focus-entity-doc ·
 * tao-viec-tu-day). Hai marker:
 *  - [marker: focusEntity]   — các chặng đọc `?focusEntity=` do `buildTaskDeepLink`
 *    (lib/tasks/context.ts) sinh ra, select đúng đối tượng/trang.
 *  - [marker: taoViecTuDay]  — từ đối tượng/trang tạo Task mang {stage, entityId} qua
 *    POST /api/tasks CÓ SẴN (không đẻ API mới).
 *
 * Phần parse/title là hàm THUẦN (test bằng sucrase-node, xem focus-entity.test.ts);
 * `postTaskFromHere` là fetch client mỏng — KHÔNG import prisma/server code (chỉ
 * `import type` từ lib/server/tasks, cùng luật với context.ts).
 */

import type { TaskStage } from '../server/tasks';

/** Tên query param — PHẢI khớp `buildTaskDeepLink` (context.ts) đang sinh `?focusEntity=`. */
export const FOCUS_ENTITY_PARAM = 'focusEntity';

/** Route Bảng việc (app/tasks/page.tsx) — toast "Đã tạo việc" trỏ về đây. */
export const TASK_BOARD_ROUTE = '/tasks';

/**
 * Đọc id đối tượng từ query string (`?focusEntity=...` hoặc chuỗi không có `?`).
 * Trả null khi thiếu/rỗng/chỉ khoảng trắng — caller KHÔNG phải phòng thủ thêm.
 */
export function parseFocusEntity(search: string): string | null {
  if (!search) return null;
  try {
    const sp = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
    const v = sp.get(FOCUS_ENTITY_PARAM);
    return v && v.trim() ? v : null;
  } catch {
    return null;
  }
}

const TITLE_MAX = 72;

/**
 * Title gợi ý cho "Tạo việc từ đây" — theo tên đối tượng/trang (phiếu ô④).
 * Giọng trung tính ("Xem lại …"), không đoán việc người dùng định làm; label rỗng
 * rơi về fallback do nơi gọi cung cấp (vd "đối tượng 2D" / "Trang 3").
 */
export function suggestedTaskTitle(label: string, fallback: string): string {
  const clean = (label || '').replace(/\s+/g, ' ').trim() || fallback.trim();
  const short = clean.length > TITLE_MAX ? `${clean.slice(0, TITLE_MAX - 1)}…` : clean;
  return `Xem lại ${short}`;
}

/** [marker: taoViecTuDay] — đầu vào tạo việc từ ngữ cảnh chặng. */
export interface TaskFromHereInput {
  projectId: string;
  title: string;
  stage: TaskStage;
  entityId: string | null;
}

export type TaskFromHereResult = { ok: true } | { ok: false; error: string };

/**
 * Gọi POST /api/tasks có sẵn (app/api/tasks/route.ts) — không đẻ endpoint mới.
 * Trả kết quả phẳng để UI hiện toast, KHÔNG throw (lỗi mạng/quyền là chuyện thường
 * ngày ở desktop offline-first, không được nổ component).
 */
export async function postTaskFromHere(input: TaskFromHereInput): Promise<TaskFromHereResult> {
  try {
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: typeof j?.error === 'string' ? j.error : `HTTP ${res.status}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'lỗi mạng' };
  }
}
