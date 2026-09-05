/**
 * gieo-kho-vat-lieu.mjs — GIEO KHO VẬT LIỆU CỦA STUDIO cho lượt nghiệm thu G4 · MOAT.
 *
 * ⚠️ KHAI THẲNG ĐÂY LÀ GÌ: hai bản ghi `ProductSpec` **có giá thật**, đóng vai *kho vật liệu của
 * một studio đã nhập hàng*. CSDL sạch có **0** ProductSpec, mà `computeBoq` chỉ ra con số khi
 * `entity.specId` khớp một spec CÓ `priceVnd` (`lib/boq/compute.ts:372` — giá `null` thì báo
 * `missing-priceVnd` và KHÔNG vào bảng). Không có kho thì không có gì để chứng minh "BOQ đổi theo".
 *
 * Đây KHÔNG phải "nhân thêm vật liệu cho nhiều": đúng HAI món, vì khâu **thay thế** cần đổi từ mã
 * này sang mã kia — một món thì không có gì để đổi (cùng lý lẽ `lib/materials/hat-giong.ts:74-77`
 * đã ghi cho bộ hạt giống). Giá lấy tròn, KHÔNG mượn bảng giá của hãng nào.
 *
 * Chốt chặn cứng: từ chối mọi DATABASE_URL nằm ngoài worktree — cấm chạm CSDL repo chính.
 */
import { PrismaClient } from '@prisma/client';
import { realpathSync } from 'node:fs';

const url = process.env.DATABASE_URL ?? '';
const goc = realpathSync(process.cwd());
if (!url.replace(/^file:/, '').startsWith(goc + '/')) {
  console.error(`CHẶN: DATABASE_URL ngoài worktree.\n  url = ${url}\n  worktree = ${goc}`);
  process.exit(1);
}

/** `id` gõ cứng ⇒ chạy lại nhiều lần vẫn ra ĐÚNG hai hàng, và bộ đo đối chiếu được mã cố định. */
export const KHO = [
  {
    id: 'ps-kiem-go-soi',
    kind: 'material', name: 'Sàn gỗ sồi', nameEn: 'Oak floor',
    sku: 'KIEM-W-210', vendor: 'NCC Kiểm', colorHex: '#b98a54',
    unit: 'm2', priceVnd: 1_250_000, wastagePercent: 8,
  },
  {
    id: 'ps-kiem-go-ocho',
    kind: 'material', name: 'Sàn gỗ óc chó', nameEn: 'Walnut floor',
    sku: 'KIEM-W-102', vendor: 'NCC Kiểm', colorHex: '#5a3a26',
    unit: 'm2', priceVnd: 2_400_000, wastagePercent: 8,
  },
];

const p = new PrismaClient({ datasources: { db: { url } } });
for (const m of KHO) {
  await p.productSpec.upsert({
    where: { id: m.id },
    create: { ...m, materials: '[]', finishes: '[]' },
    update: { ...m },
  });
}
const dem = await p.productSpec.count();
console.log(`ProductSpec sau khi gieo = ${dem}`);
for (const m of KHO) console.log(`  ${m.id} | ${m.name} | ${m.priceVnd}/${m.unit} | hao ${m.wastagePercent}%`);
await p.$disconnect();
