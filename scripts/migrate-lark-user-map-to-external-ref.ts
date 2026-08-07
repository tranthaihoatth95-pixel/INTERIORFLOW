/**
 * scripts/migrate-lark-user-map-to-external-ref.ts — M-SCOPE VIỆC 3 ③ (07/08).
 *
 * Chép TOÀN BỘ `LarkUserMap` hiện có sang `ExternalRef{system:'lark', entityType:'person'}`.
 * Idempotent (upsert theo `@@unique([system, externalId])`) — chạy lại bao nhiêu lần cũng an
 * toàn. KHÔNG xoá `LarkUserMap` (KS4, lùi được — xem ghi chú DEPRECATED-ĐANG-CHUYỂN trong
 * `prisma/schema.prisma`).
 *
 * ⛔ CHƯA CHẠY ĐƯỢC HÔM NAY — bảng `ExternalRef` chưa có trong `dev.db`. Chạy TRÊN MÁY THẬT,
 * SAU KHI cả 2 lệnh dưới đã xong (thứ tự: Task/WorkflowState + ExternalRef migrate CÙNG lúc
 * nếu chủ dự án gộp cả 2 phiếu, hoặc riêng — cả hai đều additive, không đụng nhau):
 *   sqlite3 dev.db ".backup 'dev.db.bak-truoc-externalref'"
 *   npx prisma db push   # hoặc: npx prisma migrate dev --name external-ref-task-workflow
 *   npx prisma generate
 * rồi đổi `EXTERNAL_REF_TABLE_READY` thành true (lib/integrations/external-ref.ts), sau đó chạy:
 *   node_modules/.bin/sucrase-node scripts/migrate-lark-user-map-to-external-ref.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const LARK_SYSTEM = 'lark';

async function main() {
  const p = prisma as unknown as {
    larkUserMap: { findMany(args: unknown): Promise<Array<{ larkAccount: string; userId: string }>> };
    externalRef?: { upsert(args: unknown): Promise<unknown> };
  };
  if (!p.externalRef) {
    throw new Error(
      '[migrate] prisma.externalRef chưa có — bảng ExternalRef chưa migrate hoặc chưa `prisma generate`. ' +
        'Xem lệnh ở đầu file này trước khi chạy script.',
    );
  }

  const rows = await p.larkUserMap.findMany({});
  let migrated = 0;
  for (const r of rows) {
    await p.externalRef!.upsert({
      where: { system_externalId: { system: LARK_SYSTEM, externalId: r.larkAccount } },
      create: { system: LARK_SYSTEM, externalId: r.larkAccount, entityType: 'person', entityId: r.userId },
      update: { entityType: 'person', entityId: r.userId },
    });
    migrated++;
  }
  console.log(`✔ migrate-lark-user-map-to-external-ref: ${migrated}/${rows.length} chép xong (LarkUserMap GIỮ NGUYÊN, không xoá).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
