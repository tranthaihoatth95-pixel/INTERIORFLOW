/**
 * lib/integrations/anti-loop.ts — M-SCOPE VIỆC 4 (07/08): phần THUẦN của cơ chế chống vòng lặp
 * đồng bộ 2 chiều (cùng lối tách `external-ref-core.ts` khỏi `external-ref.ts` — file này không
 * đụng Prisma, test được bằng sucrase-node thẳng không cần DB).
 *
 * BÀI TOÁN: IF đẩy đổi trạng thái ra hệ ngoài (vd Lark) → hệ ngoài xác nhận/webhook báo "có thay
 * đổi" → IF nhận lại đúng thay đổi đó → tưởng là MỚI → đẩy tiếp → LẶP VÔ TẬN. Đây là lỗi số một
 * của mọi cầu nối 2 chiều (đúng như phiếu giao việc mô tả).
 *
 * CHẶN: `ExternalRef.lastWriteBy`/`lastWriteAt` (schema, xem docblock model) ghi lại LẦN GHI
 * CUỐI vào cặp (system, externalId). Trước khi áp một thay đổi ĐẾN TỪ hệ ngoài, hỏi
 * `shouldIgnoreIncomingChange()` — true nếu chính IF vừa ghi cặp đó trong vòng `LOOP_WINDOW_MS`.
 */

export const LOOP_WINDOW_MS = 60_000; // 60 giây — đúng ngưỡng phiếu giao việc chỉ định

export const IDF_WRITER = 'idf';

export interface WriteStamp {
  lastWriteBy: string | null;
  lastWriteAt: Date | null;
}

/**
 * true = BỎ QUA thay đổi đến từ hệ ngoài — vì nó nhiều khả năng là tiếng vọng của lần IF vừa
 * ghi ra (không phải thay đổi mới do người dùng hệ ngoài tạo).
 *
 * `now` truyền vào (không tự gọi `Date.now()`) để hàm thuần, test được xác định (deterministic).
 */
export function shouldIgnoreIncomingChange(stamp: WriteStamp, now: number, windowMs: number = LOOP_WINDOW_MS): boolean {
  if (stamp.lastWriteBy !== IDF_WRITER || !stamp.lastWriteAt) return false;
  const elapsed = now - stamp.lastWriteAt.getTime();
  return elapsed >= 0 && elapsed < windowMs;
}

/**
 * Hai bên cùng sửa trong cửa sổ chống-lặp (IF vừa ghi VÀ hệ ngoài cũng vừa báo đổi) — GIẢI
 * XUNG bằng bản có `updatedAt` MỚI HƠN thắng; log rõ bản bị thua để KS5 (nói được vì sao) có
 * chỗ tra. Hàm thuần — caller (route/adapter) chịu trách nhiệm ghi log thật (console/DB), ở
 * đây chỉ trả QUYẾT ĐỊNH + câu giải thích.
 */
export interface ConflictSide {
  source: string; // 'idf' | tên hệ ngoài
  updatedAt: Date;
}
export interface ConflictResolution {
  winner: ConflictSide;
  loser: ConflictSide;
  reason: string;
}

export function resolveWriteConflict(a: ConflictSide, b: ConflictSide): ConflictResolution {
  const [winner, loser] = a.updatedAt.getTime() >= b.updatedAt.getTime() ? [a, b] : [b, a];
  return {
    winner,
    loser,
    reason: `${winner.source} ghi lúc ${winner.updatedAt.toISOString()}, muộn hơn ${loser.source} (${loser.updatedAt.toISOString()}) — ${loser.source} bị ghi đè.`,
  };
}
