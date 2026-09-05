/**
 * gieo-noi-kho-idfc.ts — dựng ĐỦ và ĐÚNG hai đầu dây cho lượt đo "nối `.idfc` về kho" (05/09).
 *
 * ⚠️ KHAI THẲNG ĐÂY LÀ GÌ: một hàng `ProductSpec` đóng vai *món hàng có thật trong kho của studio*
 * + hai tệp `.idfc` đóng vai *cấu kiện trao tay*. CSDL sạch có **0** ProductSpec (đo được), nên
 * không gieo thì cột thông số chỉ có MỘT thế giới để nói — "kho chưa có món này". Một thế giới
 * thì phép đo không phân biệt được gì.
 *
 * Hai tệp cố ý khác nhau ĐÚNG MỘT ĐIỂM — có/không mang khoá bất biến:
 *   · `ghe-ben.idfc`  → `commerce.specId` + `sku`  ⇒ phải nối CHẮC
 *   · `ghe-mong.idfc` → CHỈ `commerce.sku`         ⇒ chỉ nối MỎNG
 * Đổi mã hàng trong kho MỘT lần là hai tệp phải rẽ hai hướng. Đó chính là phép đo.
 *
 * ⚠️ Tệp `.idfc` dựng bằng CHÍNH `exportIdfc` của app, không gõ tay JSON — gõ tay là tự dựng bản
 * `.idfc` thứ hai để rồi lệch với bản app đọc, và bộ đo sẽ xanh trong khi người dùng đã hỏng.
 *
 * Chốt chặn cứng (mượn nguyên `gieo-kho-vat-lieu.mjs`): từ chối mọi DATABASE_URL ngoài worktree.
 *
 * Chạy (qua sucrase-node vì phải import `lib/cad/idfc.ts`):
 *   DATABASE_URL="file:$(pwd)/prisma/dev.db" \
 *     node_modules/.bin/sucrase-node scripts/nghiem-thu-ban-lam-viec/gieo-noi-kho-idfc.ts [--doi-ma]
 *     (không cờ) → gieo kho + ghi hai tệp `.idfc` vào `--ra=<thư mục>`
 *     --doi-ma   → CHỈ đổi `sku` của hàng trong kho (giả lập NCC đổi mã), không đụng tệp
 */
import { PrismaClient } from '@prisma/client';
import { realpathSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { exportIdfc, type IdfcBody } from '../../lib/cad/idfc';

const url = process.env.DATABASE_URL ?? '';
const goc = realpathSync(process.cwd());
if (!url.replace(/^file:/, '').startsWith(goc + '/')) {
  console.error(`CHẶN: DATABASE_URL ngoài worktree.\n  url = ${url}\n  worktree = ${goc}`);
  process.exit(1);
}

const co = (t: string, m: string) => {
  const a = process.argv.find((x) => x.startsWith(`--${t}=`));
  return a ? a.slice(t.length + 3) : m;
};
const RA = co('ra', join(goc, '.nen-noi-kho'));
const DOI_MA = process.argv.includes('--doi-ma');

/** `id` gõ cứng ⇒ chạy lại nhiều lần vẫn đúng một hàng, và tệp `.idfc` trỏ vào được mã cố định. */
const SPEC_ID = 'ps-noi-kho-ghe';
const SKU_DAU = 'NK-GHE-01';
const SKU_SAU = 'NK-GHE-01-V2';
const GIA_KHO = 4_200_000;
/** Ảnh chụp giá LÚC NHẬP, cố ý LỆCH giá kho: cột thông số mà hiện số này tức là nó đang đọc TỆP
 *  chứ không đọc KHO — bắt được ngay bằng số, không phải suy. */
const GIA_TRONG_TEP = 3_100_000;

const p = new PrismaClient({ datasources: { db: { url } } });

async function main() {
  if (DOI_MA) {
    const r = await p.productSpec.update({
      where: { id: SPEC_ID },
      data: { sku: SKU_SAU },
      select: { id: true, sku: true, name: true, priceVnd: true },
    });
    console.log('ĐÃ ĐỔI MÃ HÀNG TRONG KHO:', JSON.stringify(r));
    await p.$disconnect();
    return;
  }

  const hang = {
    id: SPEC_ID,
    kind: 'furniture',
    name: 'Ghế ăn gỗ sồi',
    nameEn: 'Oak dining chair',
    sku: SKU_DAU,
    brand: 'Xưởng Kiểm',
    vendor: 'NCC Kiểm',
    unit: 'cái',
    priceVnd: GIA_KHO,
    scope: 'studio',
  };
  await p.productSpec.upsert({ where: { id: hang.id }, update: hang, create: hang });
  const lai = await p.productSpec.findUnique({
    where: { id: SPEC_ID },
    select: { id: true, name: true, sku: true, matId: true, brand: true, unit: true, priceVnd: true },
  });
  console.log('KHO:', JSON.stringify(lai));
  await p.$disconnect();

  const geom2d = { group: 'Phòng ăn', w: 450, h: 480, prims: [{ t: 'rect', x: -225, y: -240, w: 450, h: 480 }] };
  const body = { type: 'component', geom2d } as unknown as IdfcBody;

  mkdirSync(RA, { recursive: true });
  writeFileSync(
    join(RA, 'ghe-ben.idfc'),
    exportIdfc({
      meta: { name: 'Ghế ăn — nối chắc', code: 'NK-GHE-BEN', kind: 'furniture', scope: 'studio', room: 'Phòng ăn' },
      body,
      commerce: { specId: SPEC_ID, sku: SKU_DAU, brand: 'Hãng ghi trong tệp', unit: 'cái', priceVnd: GIA_TRONG_TEP },
    }),
  );
  writeFileSync(
    join(RA, 'ghe-mong.idfc'),
    exportIdfc({
      meta: { name: 'Ghế ăn — nối mỏng', code: 'NK-GHE-MONG', kind: 'furniture', scope: 'studio', room: 'Phòng ăn' },
      body,
      commerce: { sku: SKU_DAU, brand: 'Hãng ghi trong tệp', unit: 'cái', priceVnd: GIA_TRONG_TEP },
    }),
  );
  console.log('TỆP:', join(RA, 'ghe-ben.idfc'), '·', join(RA, 'ghe-mong.idfc'));
}

void main();
