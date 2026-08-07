/**
 * lib/integrations/providers/lark-write.ts — M-SCOPE VIỆC 4 (07/08): "adapter Lark ghi NGƯỢC".
 *
 * 🔴🔴 XUNG ĐỘT VỚI QUYẾT ĐỊNH ĐÃ CHỐT — ĐỌC TRƯỚC KHI BẬT CỜ DƯỚI ĐÂY.
 *
 * Phiếu M-SCOPE VIỆC 4 giao "thêm đường ghi qua ExternalRef" cho Lark. Nhưng CẢ HAI nơi khai
 * báo vai trò của module Lark trong repo đều ghi rõ, nhiều lần, bằng chữ "TUYỆT ĐỐI":
 *   - `prisma/schema.prisma:313` (ngay trên `model LarkTaskRef`): "PULL-ONLY tuyệt đối: Larkbase
 *     là nguồn chân lý, IF chỉ đọc/mirror, KHÔNG BAO GIỜ ghi ngược (không create_record/
 *     update_record tự động...)".
 *   - `lib/integrations/providers/lark.ts:17`: "PULL-ONLY tuyệt đối: file này chỉ có
 *     list_records (GET) + resolveWikiAppToken (GET) — không có create/update/delete."
 * Đây không phải một dòng code cũ bị bỏ quên — là quyết định KIẾN TRÚC lặp lại có chủ đích ở cả
 * schema lẫn module, kèm lý do rõ (Larkbase = nguồn chân lý một chiều).
 *
 * ⇒ File này dựng ĐỦ máy móc VIỆC 4 yêu cầu (hàm ghi thật + chống vòng lặp), nhưng CHẶN cứng
 *    sau `LARK_WRITE_ENABLED` — cùng lối `TASK_TABLES_READY`/`EXTERNAL_REF_TABLE_READY`. KHÔNG
 *    tự bật cờ này. Bật cờ = đảo ngược một quyết định "TUYỆT ĐỐI" đã ghi ở 2 nơi — cần Hoà xác
 *    nhận TRỰC TIẾP bằng lời, không phải suy luận từ việc phiếu VIỆC 4 có chữ "ghi ngược".
 *    (§0g: không lấy MÔ TẢ của phiếu làm nguồn khi nó ngược lại LUẬT đã ghi trong code+schema.)
 *
 * Khi Hoà xác nhận: đổi `LARK_WRITE_ENABLED` thành `true`, rồi cần thêm — CHƯA có trong file
 * này vì chưa xác nhận field/table thật của Larkbase cho update — hàm `larkFetchJson` thật (xem
 * `lark.ts`) gọi `PUT /open-apis/bitable/v1/apps/{app_token}/tables/{table_id}/records/{record_id}`.
 */

import { prisma } from '@/lib/server/db';
import { EXTERNAL_REF_TABLE_READY } from '../external-ref';
import { IDF_WRITER } from '../anti-loop';

/** Xem khối 🔴🔴 đầu file. `false` cho tới khi Hoà xác nhận đảo ngược PULL-ONLY bằng lời. */
export const LARK_WRITE_ENABLED = false;

/**
 * Đánh dấu "IF vừa ghi cặp (system, externalId) này" — gọi TRƯỚC khi thật sự gửi request ghi
 * ra hệ ngoài, để nếu hệ ngoài echo lại thay đổi trong `LOOP_WINDOW_MS`, `shouldIgnoreIncomingChange()`
 * (anti-loop.ts) nhận ra và bỏ qua.
 */
export async function markIdfWrite(system: string, externalId: string): Promise<void> {
  if (!EXTERNAL_REF_TABLE_READY) {
    throw new Error('[lark-write] ExternalRef chưa migrate — xem external-ref.ts để biết lệnh cần chạy.');
  }
  const table = (prisma as unknown as { externalRef?: { update(args: unknown): Promise<unknown> } }).externalRef;
  if (!table) throw new Error('[lark-write] prisma.externalRef chưa sinh — thiếu "npx prisma generate".');
  await table.update({
    where: { system_externalId: { system: system.trim().toLowerCase(), externalId: externalId.trim() } },
    data: { lastWriteBy: IDF_WRITER, lastWriteAt: new Date() },
  });
}

/**
 * Đường ghi thật ra Larkbase (update_record) — CHẶN CỨNG, xem khối 🔴🔴 đầu file.
 * KHÔNG bịa hình dạng field_id/table_id cho update — chưa verify bằng token thật (đúng luật
 * N3 "vá thì verify tay trước", cùng lý do `lark.ts` chưa viết hàm ghi cho tới hôm nay).
 */
export async function updateLarkRecord(): Promise<never> {
  if (!LARK_WRITE_ENABLED) {
    throw new Error(
      '[lark-write] Bị chặn: ghi ngược ra Larkbase trái quyết định "PULL-ONLY tuyệt đối" đã chốt ' +
        '(prisma/schema.prisma:313 + lib/integrations/providers/lark.ts:17). Cần Hoà xác nhận trực ' +
        'tiếp trước khi đổi LARK_WRITE_ENABLED thành true — xem docblock lark-write.ts.',
    );
  }
  throw new Error('[lark-write] Cờ đã bật nhưng hàm update_record thật CHƯA viết — thiếu field_id/table_id đã verify.');
}
