/**
 * scripts/migrate-lark-project-code-to-external-ref.ts — p12 VIỆC 3 (07/08, G-M9-01/§0v).
 *
 * Chép `Project.larkProjectCode` (cột mang tên nhà cung cấp nằm trong bảng LÕI) sang bảng cầu
 * `ExternalRef{system:'lark', entityType:'project'}` — cùng khuôn với
 * `migrate-lark-user-map-to-external-ref.ts` (M-SCOPE VIỆC 3 ③). Idempotent: upsert theo
 * `@@unique([system, externalId])`, chạy lại bao nhiêu lần cũng an toàn.
 *
 * KHÔNG xoá / không sửa cột `larkProjectCode` (KS4 — 13 file đang đọc nó, grep 07/08; xoá cột là
 * việc của một đợt sau, khi mọi nơi đọc đã chuyển qua ExternalRef).
 *
 * ⛔ CHƯA CHẠY ĐƯỢC HÔM NAY — bảng `ExternalRef` chưa có trong `dev.db` thật. Thứ tự trên MÁY THẬT:
 *   sqlite3 prisma/dev.db ".backup 'prisma/dev.db.bak-truoc-externalref'"
 *   npx prisma db push
 *   npx prisma generate
 * rồi đổi `EXTERNAL_REF_TABLE_READY` thành true (lib/integrations/external-ref.ts), sau đó:
 *   node_modules/.bin/sucrase-node scripts/migrate-lark-project-code-to-external-ref.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const LARK_SYSTEM = 'lark';

async function main() {
  const p = prisma as unknown as {
    project: {
      findMany(args: unknown): Promise<Array<{ id: string; larkProjectCode: string | null }>>;
    };
    externalRef?: { upsert(args: unknown): Promise<unknown> };
  };
  if (!p.externalRef) {
    throw new Error(
      '[migrate] prisma.externalRef chưa có — bảng ExternalRef chưa migrate hoặc chưa `prisma generate`. ' +
        'Xem lệnh ở đầu file này trước khi chạy script.',
    );
  }

  const rows = await p.project.findMany({ where: { larkProjectCode: { not: null } } });
  let migrated = 0;
  for (const r of rows) {
    if (!r.larkProjectCode) continue;
    await p.externalRef!.upsert({
      where: { system_externalId: { system: LARK_SYSTEM, externalId: r.larkProjectCode } },
      create: { system: LARK_SYSTEM, externalId: r.larkProjectCode, entityType: 'project', entityId: r.id },
      update: { entityType: 'project', entityId: r.id },
    });
    migrated++;
  }
  console.log(
    `✔ migrate-lark-project-code-to-external-ref: ${migrated}/${rows.length} chép xong ` +
      '(cột Project.larkProjectCode GIỮ NGUYÊN, không xoá).',
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
