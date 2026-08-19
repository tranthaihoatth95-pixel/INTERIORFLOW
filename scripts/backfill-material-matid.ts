/**
 * scripts/backfill-material-matid.ts — sinh `ProductSpec.matId` (UUID canonical, IF-owned
 * immutable — chốt hòa giải 19/08) cho MỌI dòng `ProductSpec{kind:'material'}` CHƯA có matId.
 *
 * ⛔ CHỈ CHẠY SAU KHI chủ dự án đã:
 *   1. `npx prisma db push`      (thêm cột `matId String? @unique` — script này SẼ LỖI nếu cột
 *                                 chưa tồn tại, Prisma client chưa biết field).
 *   2. `npx prisma generate`     (nạp lại client cho biết field `matId`).
 *
 * PHẠM VI — CHỈ `kind === 'material'` (`SPEC_KINDS` = furniture|material|lighting|millwork|
 * fixture, `lib/server/specs.ts`). Lý do: đăng ký frontier `material-matid-uuid` khai matId là
 * "identity của MATERIAL, không phải business code" — domain hẹp đúng bằng chứng ⓪c, KHÔNG lan
 * sang furniture/lighting/millwork/fixture ở slice này (chưa có bằng chứng cần).
 *
 * AN TOÀN — MẶC ĐỊNH DRY-RUN. Không truyền `--apply` thì script CHỈ ĐẾM, KHÔNG GHI GÌ vào DB:
 *   node_modules/.bin/sucrase-node scripts/backfill-material-matid.ts             ← dry-run (an toàn)
 *   node_modules/.bin/sucrase-node scripts/backfill-material-matid.ts --apply     ← ghi thật
 *
 * IDEMPOTENT — dòng đã có `matId` được BỎ QUA nguyên vẹn (không đổi, không sinh lại). `sku` đổi
 * ở lượt sync ATLAS sau này KHÔNG đụng tới cột này (đúng luật "ATLAS được đổi sku mà KHÔNG đổi
 * matId"). Chạy lại nhiều lần cho kết quả `generated: 0` sau lượt đầu tiên thành công.
 *
 * (DATABASE_URL lấy từ .env như Prisma bình thường.)
 */
import { PrismaClient } from '@prisma/client';
import { generateMatId } from '../lib/materials/matid-identity';

const prisma = new PrismaClient();

/**
 * ⚠️ ÉP KIỂU CÓ CHỦ Ý — không phải lười. `npx prisma generate` chưa chạy trên máy Hoà cho cột
 * `matId` (đúng luật: T KHÔNG được `db push`/`migrate`, và generate client "sớm" từng thử trong
 * phiên này rồi PHẢI HOÀN NGUYÊN NGAY vì nó làm MỌI dev server khác (3 phiên Claude Code song
 * song + dev server 3001/3002/3004 đang chạy) lỗi SQL "no such column: matId" tức thì — client
 * Prisma là artifact CHUNG một `node_modules`, generate sớm = phá phiên khác). Prisma Client
 * TypeScript type hiện tại vì vậy CHƯA biết field `matId`. Cast hẹp này giữ nguyên type safety
 * TRONG file này (mọi biến vẫn có kiểu rõ ràng) mà KHÔNG cần regenerate client toàn cục — an
 * toàn cho các phiên khác đang chạy. Sau khi Hoà chạy `prisma generate` thật, khối cast này có
 * thể xoá (Prisma Client lúc đó tự có `matId` đúng kiểu) nhưng KHÔNG BẮT BUỘC — giữ nguyên vẫn
 * chạy đúng, chỉ là dư một lớp ép kiểu.
 */
interface ProductSpecMatIdRow {
  id: string;
  kind: string;
  sku: string | null;
  name: string;
  matId: string | null;
}
const specClient = prisma.productSpec as unknown as {
  findMany: (args: { select: Record<string, true> }) => Promise<ProductSpecMatIdRow[]>;
  update: (args: { where: { id: string }; data: { matId: string } }) => Promise<unknown>;
};

const APPLY = process.argv.includes('--apply');

async function main() {
  const all = await specClient.findMany({
    select: { id: true, kind: true, matId: true, sku: true, name: true },
  });

  let scanned = 0;
  let skipped = 0; // kind !== 'material' — ngoài phạm vi slice này, KHÔNG đụng
  let alreadyHasMatId = 0;
  let generated = 0;
  let errors = 0;
  const errorDetail: string[] = [];

  for (const row of all) {
    scanned += 1;
    if (row.kind !== 'material') {
      skipped += 1;
      continue;
    }
    if (row.matId) {
      alreadyHasMatId += 1;
      continue;
    }
    const matId = generateMatId();
    if (APPLY) {
      try {
        await specClient.update({ where: { id: row.id }, data: { matId } });
        generated += 1;
      } catch (e) {
        errors += 1;
        errorDetail.push(`id=${row.id} name="${row.name}": ${e instanceof Error ? e.message : String(e)}`);
      }
    } else {
      generated += 1; // dry-run: đếm SẼ sinh bao nhiêu, không ghi
    }
  }

  console.log(`── backfill-material-matid ${APPLY ? '[APPLY — đã ghi]' : '[DRY-RUN — chưa ghi gì]'} ──`);
  console.log(`  scanned          : ${scanned}`);
  console.log(`  skipped (kind≠material) : ${skipped}`);
  console.log(`  alreadyHasMatId  : ${alreadyHasMatId}`);
  console.log(`  generated${APPLY ? '' : ' (sẽ sinh nếu chạy --apply)'} : ${generated}`);
  console.log(`  errors           : ${errors}`);
  if (errorDetail.length) {
    console.log('  chi tiết lỗi:');
    for (const d of errorDetail) console.log(`    · ${d}`);
  }
  if (!APPLY) {
    console.log('\n  Đây là DRY-RUN. Chạy lại kèm --apply để ghi thật vào DB.');
  }
  if (errors > 0) process.exitCode = 1;
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
