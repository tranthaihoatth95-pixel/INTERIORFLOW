/**
 * lib/input/stage-drop.ts — phân loại cử chỉ KÉO trên thanh chặng (StageSwitcher):
 * "lôi tab xuống" để gọi Vitals AI, KHÔNG được nhầm với click/trượt ngang chuyển chặng.
 *
 * Cùng triết lý với lib/input/wheel.ts: logic phân biệt trục để THUẦN, test được,
 * component chỉ nối sự kiện. Quy ước:
 *
 *   Cử chỉ                       Kết quả      Vì sao
 *   ────────────────────────────────────────────────────────────────────────
 *   nhấn-thả tại chỗ (< slop)    'pending'    click thường → onPick chuyển chặng như cũ
 *   trượt NGANG vượt slop        'locked'     hành vi ngang là của thanh chặng — nhường hẳn
 *   kéo XUỐNG vượt ngưỡng 28px   'vitals'      giọt kính tách ra → mở panel chat
 *   kéo LÊN vượt slop            'locked'     không có nghĩa — khoá để khỏi giật giọt
 *
 * Tracker CÓ TRẠNG THÁI: một khi đã 'locked' thì khoá tới hết cử chỉ (không nhả nửa chừng
 * rồi bật 'vitals' — tránh drag chéo run tay kích hoạt nhầm); một khi 'vitals' thì xong.
 */

/** Kéo xuống vượt ngưỡng này (px) → gọi Vitals popover (kéo lần 1). */
export const VITALS_DROP_THRESHOLD_PX = 28;

/**
 * Kéo TIẾP tục xuống vượt ngưỡng này (px) — coi là "kéo lần 2" — mở thẳng
 * NotebookLM full modal, bỏ qua popover. Fast-path cho power user; user thường
 * vẫn có nút "Mở rộng" trên popover khi thả tay ở ngưỡng đầu.
 */
export const VITALS_FULL_THRESHOLD_PX = 120;

/** Dưới slop này (px) chưa kết luận gì — vẫn là click tiềm năng. */
export const DRAG_SLOP_PX = 6;

/**
 * Trục dọc phải THẮNG RÕ trục ngang mới tính là "kéo xuống" (dy > |dx| × ratio).
 * 1.2: kéo chéo 45° không kích hoạt — phải chủ ý kéo xuống.
 */
export const VERTICAL_DOMINANCE_RATIO = 1.2;

/**
 * Verdict:
 *  - 'pending'       : chưa đủ ngưỡng, tiếp tục theo dõi.
 *  - 'vitals'        : chạm ngưỡng lần 1 → mở popover Vitals compact.
 *  - 'notebook-full' : chạm ngưỡng lần 2 (kéo dài) → mở NotebookLM full modal, popover đóng nếu đang mở.
 *  - 'locked'        : bỏ cử chỉ (trượt ngang/lên).
 *
 * Sau khi trả 'vitals', tracker vẫn theo dõi thêm dy; nếu vượt
 * `VITALS_FULL_THRESHOLD_PX` sẽ nâng cấp thành 'notebook-full'. Một khi đã
 * 'notebook-full' hoặc 'locked' thì đứng yên.
 */
export type StageDragVerdict = 'pending' | 'vitals' | 'notebook-full' | 'locked';

export interface StageDragTracker {
  /** Gọi mỗi pointermove với delta so với điểm nhấn. Trả kết luận hiện tại. */
  move(dx: number, dy: number): StageDragVerdict;
  /** 0..1 — độ "kéo dãn" của giọt kính (0 khi locked/chưa kéo). Cho feedback visual. */
  progress(): number;
}

export function createStageDragTracker(
  threshold: number = VITALS_DROP_THRESHOLD_PX,
  slop: number = DRAG_SLOP_PX,
  ratio: number = VERTICAL_DOMINANCE_RATIO,
  fullThreshold: number = VITALS_FULL_THRESHOLD_PX,
): StageDragTracker {
  let locked = false;
  let firedVitals = false;
  let firedFull = false;
  let prog = 0;

  return {
    move(dx: number, dy: number): StageDragVerdict {
      if (firedFull) return 'notebook-full';
      if (locked) return 'locked';

      const ax = Math.abs(dx);

      // Kéo LÊN rõ ràng → không có nghĩa với thanh chặng, khoá luôn.
      if (dy <= -slop) {
        locked = true;
        prog = 0;
        return 'locked';
      }

      // Trượt NGANG chiếm ưu thế vượt slop → nhường hẳn cho hành vi thanh chặng cũ.
      if (ax >= slop && ax > Math.max(dy, 0) * ratio) {
        locked = true;
        prog = 0;
        return 'locked';
      }

      // Kéo dài quá `fullThreshold` (và trục dọc vẫn thắng) → nâng cấp thẳng lên full.
      if (dy >= fullThreshold && dy > ax * ratio) {
        firedFull = true;
        firedVitals = true;
        prog = 1;
        return 'notebook-full';
      }

      // Kéo XUỐNG đủ xa + trục dọc thắng rõ → Vitals popover (chưa full).
      if (!firedVitals && dy >= threshold && dy > ax * ratio) {
        firedVitals = true;
        prog = 1;
        return 'vitals';
      }

      if (firedVitals) {
        // Đã mở popover — tiếp tục theo dõi để nhận `notebook-full`.
        prog = 1;
        return 'vitals';
      }

      prog = dy > 0 && dy > ax ? Math.min(1, dy / threshold) : 0;
      return 'pending';
    },
    progress() {
      return prog;
    },
  };
}
