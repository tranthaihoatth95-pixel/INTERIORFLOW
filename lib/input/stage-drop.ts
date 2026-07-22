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

/** Kéo xuống vượt ngưỡng này (px) → gọi Vitals. 28px: đủ xa để click run tay không dính. */
export const VITALS_DROP_THRESHOLD_PX = 28;

/** Dưới slop này (px) chưa kết luận gì — vẫn là click tiềm năng. */
export const DRAG_SLOP_PX = 6;

/**
 * Trục dọc phải THẮNG RÕ trục ngang mới tính là "kéo xuống" (dy > |dx| × ratio).
 * 1.2: kéo chéo 45° không kích hoạt — phải chủ ý kéo xuống.
 */
export const VERTICAL_DOMINANCE_RATIO = 1.2;

export type StageDragVerdict = 'pending' | 'vitals' | 'locked';

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
): StageDragTracker {
  let locked = false;
  let fired = false;
  let prog = 0;

  return {
    move(dx: number, dy: number): StageDragVerdict {
      if (fired) return 'vitals';
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

      // Kéo XUỐNG đủ xa + trục dọc thắng rõ → Vitals.
      if (dy >= threshold && dy > ax * ratio) {
        fired = true;
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
