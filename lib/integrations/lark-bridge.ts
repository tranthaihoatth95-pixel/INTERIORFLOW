/**
 * lib/integrations/lark-bridge.ts — M-SCOPE VIỆC 3 (07/08): lớp đọc/ghi MỚI cho ánh xạ
 * "Tài khoản" Larkbase ↔ `User.id` nội bộ, đi qua `ExternalRef` (L-EXT1, §0v) thay vì
 * `LarkUserMap` trực tiếp.
 *
 * ── VÌ SAO CHỈ `LarkUserMap`, KHÔNG PHẢI CẢ 3 MODEL LARK* ────────────────────────────────
 * Phiếu giao "chuyển 3 model Lark*" — nhưng đọc kỹ vai trò từng bảng (N7, đừng tin nhãn hợp lý):
 *   - `LarkTaskRef`/`LarkPersonRef` là MIRROR NỘI DUNG (task text, deadline, status, họ tên...)
 *     — không phải bảng CẦU ID. `ExternalRef` chỉ có 4 cột (system/externalId/entityType/
 *     entityId), KHÔNG có chỗ chứa nội dung — chuyển 2 bảng này "sang ExternalRef" nghĩa là XOÁ
 *     nội dung, không phải là điều phiếu muốn (phiếu tự nói: "GIỮ LarkTaskRef làm CACHE").
 *   - `LarkUserMap` (larkAccount ↔ userId) MỚI ĐÚNG hình dạng một bảng cầu ID — không mang nội
 *     dung nào khác. Đây là ứng viên DUY NHẤT khớp §0v ("ID của MỌI hệ ngoài nằm ở ĐÂY").
 * ⇒ File này chỉ bắc cầu `LarkUserMap`. `LarkTaskRef`/`LarkPersonRef` giữ nguyên vai trò cache —
 *   khi nào IF có `Task` thật (VIỆC 2) muốn NỐI một bản ghi Lark task với 1 `Task.id` nội bộ,
 *   đường nối đó sẽ đi qua `ExternalRef{entityType:'task'}` — CHƯA có nhu cầu đó hôm nay (IF
 *   không tự sinh Task từ Lark, pull-only chỉ để hiển thị), nên chưa viết hàm cho nhánh đó.
 *
 * ── N7 — GREP "LarkTaskRef" TRẢ VỀ 4 FILE, NHƯNG 2 FILE CHỈ KHỚP TRONG COMMENT ──────────────
 * `grep -rl "LarkTaskRef"` khớp `lib/lark/atlas-material-map.ts` và
 * `lib/integrations/providers/lark.ts` — cả hai chỉ NHẮC TÊN trong docblock, không có lệnh
 * `prisma.larkTaskRef.*` nào. File thật sự đụng DB `Lark*` là `app/api/lark-tasks/route.ts`
 * (đọc cả 3 mirror để hiển thị) · `app/api/lark-tasks/sync/route.ts` (ghi cache, GIỮ NGUYÊN,
 * xem trên) · `app/api/lark-user-map/route.ts` (ghi cầu ID — nay đổi qua file này).
 *
 * ── DUAL-WRITE, KHÔNG CUTOVER CỨNG ───────────────────────────────────────────────────────
 * `ExternalRef` CHƯA migrate (`EXTERNAL_REF_TABLE_READY=false`, `external-ref.ts`). Mọi hàm ở
 * đây vẫn ghi/đọc `LarkUserMap` như hôm nay (KHÔNG đổi hành vi thấy được) — chỉ THÊM ghi song
 * song vào `ExternalRef` khi bảng đã sẵn sàng, để khi cutover thật (đọc ưu tiên ExternalRef) dữ
 * liệu đã có sẵn, không cần chờ script chép một lần rồi mới đúng.
 */

import { prisma } from '@/lib/server/db';
import { EXTERNAL_REF_TABLE_READY, linkExternalRef, findCoreEntity } from './external-ref';

const LARK_SYSTEM = 'lark';

/** Đọc: larkAccount → User.id. Ưu tiên ExternalRef khi đã sẵn sàng, luôn có fallback LarkUserMap
 * (bảng nguồn hôm nay) — tự dò cả hai để không "quên" ánh xạ cũ chưa kịp chép sang. */
export async function resolveUserByLarkAccount(larkAccount: string): Promise<string | null> {
  const account = larkAccount.trim();
  if (!account) return null;

  if (EXTERNAL_REF_TABLE_READY) {
    const core = await findCoreEntity({ system: LARK_SYSTEM, externalId: account });
    if (core && core.entityType === 'person') return core.entityId;
  }
  const legacy = await prisma.larkUserMap.findUnique({ where: { larkAccount: account }, select: { userId: true } });
  return legacy?.userId ?? null;
}

/** Ghi: larkAccount ↔ User.id — luôn ghi LarkUserMap (nguồn chính hôm nay); ghi thêm
 * ExternalRef khi bảng đã sẵn sàng (dual-write, xem docblock). */
export async function linkLarkAccountToUser(larkAccount: string, userId: string): Promise<void> {
  const account = larkAccount.trim();
  if (!account || !userId.trim()) throw new Error('[lark-bridge] larkAccount/userId rỗng — không ghi.');

  await prisma.larkUserMap.upsert({
    where: { larkAccount: account },
    update: { userId },
    create: { larkAccount: account, userId },
  });

  if (EXTERNAL_REF_TABLE_READY) {
    await linkExternalRef({ system: LARK_SYSTEM, externalId: account }, { entityType: 'person', entityId: userId });
  }
}

/**
 * Gỡ ánh xạ. ExternalRef KHÔNG có hàm xoá ở `external-ref.ts` (file đó cố ý chỉ có 2 cầu —
 * đọc + upsert idempotent, chưa ai cần xoá) — nhánh ExternalRef ở đây bỏ qua có chủ đích, để
 * lại dòng cầu "mồ côi" vô hại (không entity nào còn đọc nó vì LarkUserMap đã xoá, và
 * `resolveUserByLarkAccount` chỉ trả entityId khi CẢ HAI đồng ý — không, thực ra chỉ ExternalRef
 * đã đủ trả entityId một mình khi ready; ⚠️ nếu sau này bật ExternalRef làm nguồn CHÍNH, hàm này
 * cần thêm hàm xoá tương ứng ở external-ref.ts trước — ghi rõ để không lặng lẽ để sót).
 */
export async function unlinkLarkAccount(larkAccount: string): Promise<void> {
  const account = larkAccount.trim();
  if (!account) return;
  await prisma.larkUserMap.delete({ where: { larkAccount: account } }).catch(() => {});
}

/** Liệt kê toàn bộ ánh xạ — đọc thẳng LarkUserMap (nguồn liệt-kê-đầy-đủ; ExternalRef không có
 * chỉ mục theo `system` kèm `entityType` để liệt kê rẻ, và bảng còn chưa migrate). */
export async function listLarkUserMap(): Promise<Array<{ larkAccount: string; userId: string }>> {
  const rows = await prisma.larkUserMap.findMany();
  return rows.map((r) => ({ larkAccount: r.larkAccount, userId: r.userId }));
}
