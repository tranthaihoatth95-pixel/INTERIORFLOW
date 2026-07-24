/**
 * scripts/seed-specs.ts — SEED 10 ProductSpec mẫu (Hệ Legend X1, docs/PROPOSAL-LEGEND-SYSTEM.md §2).
 *
 * Sản phẩm nội thất THẬT từ kiến thức phổ thông (Muuto/IKEA/Hòa Phát/An Cường...), giá VND
 * ƯỚC LỆ ghi rõ "tham khảo" trong priceNote — KHÔNG phải báo giá. `drawingBlock` trỏ key
 * BlockDef trong lib/cad/furniture.ts để schedule/legend nối được spec ↔ block trên bản vẽ.
 *
 * CÁCH CHẠY (từ gốc repo — idempotent, upsert theo sku):
 *   node_modules/.bin/sucrase-node scripts/seed-specs.ts
 */

import { readFileSync } from 'fs';
import path from 'path';

/* ---- nạp .env/.env.local thủ công (cùng pattern scripts/seed-admin.ts) ---- */
function loadEnvFile(file: string) {
  let raw: string;
  try {
    raw = readFileSync(file, 'utf8');
  } catch {
    return;
  }
  for (const line of raw.split('\n')) {
    const m = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/.exec(line);
    if (!m) continue;
    const key = m[1];
    let val = m[2];
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}
loadEnvFile(path.join(process.cwd(), '.env.local'));
loadEnvFile(path.join(process.cwd(), '.env'));

interface SeedSpec {
  kind: string;
  name: string;
  nameEn: string;
  brand: string;
  sku: string;
  vendor: string;
  w?: number;
  d?: number;
  hUp?: number;
  materials: string[];
  finishes: string[];
  colorHex?: string;
  drawingBlock?: string;
  priceNote: string;
  currency: string;
  note?: string;
}

/** 10 spec mẫu — kích thước mm danh nghĩa khớp catalogue phổ thông; drawingBlock = key
 * BlockDef có sẵn (sofa3/sofa2/armchair/bedD/dining4/desk/wardrobe…). */
const SPECS: SeedSpec[] = [
  {
    kind: 'furniture', name: 'Sofa 3 chỗ Outline', nameEn: 'Outline Sofa 3-Seater',
    brand: 'Muuto', sku: 'MU-OUT-3S', vendor: 'Danish Design Vietnam',
    w: 2200, d: 840, hUp: 710, materials: ['oak', 'wool'], finishes: ['Vải Kvadrat Remix', 'Da Refine cognac'],
    colorHex: '#8a8378', drawingBlock: 'sofa3',
    priceNote: '≈ 145.000.000đ (tham khảo)', currency: 'VND',
  },
  {
    kind: 'furniture', name: 'Sofa 2 chỗ Söderhamn', nameEn: 'Söderhamn 2-Seat Sofa',
    brand: 'IKEA', sku: 'IK-SOD-2S', vendor: 'IKEA (hàng order)',
    w: 1860, d: 990, hUp: 830, materials: ['polyester', 'steel'], finishes: ['Viarp beige', 'Tonerud xám'],
    colorHex: '#c9bfae', drawingBlock: 'sofa2',
    priceNote: '≈ 18.500.000đ (tham khảo)', currency: 'VND',
  },
  {
    kind: 'furniture', name: 'Ghế bành Pelican', nameEn: 'Pelican Lounge Chair',
    brand: 'House of Finn Juhl', sku: 'FJ-PEL-01', vendor: 'Đại lý uỷ quyền',
    w: 760, d: 780, hUp: 720, materials: ['wool', 'walnut'], finishes: ['Vải bouclé kem', 'Chân óc chó'],
    colorHex: '#e4ddcf', drawingBlock: 'armchair',
    priceNote: '≈ 120.000.000đ (tham khảo)', currency: 'VND',
  },
  {
    kind: 'furniture', name: 'Giường đôi 1m6 Malm', nameEn: 'Malm Queen Bed 160',
    brand: 'IKEA', sku: 'IK-MALM-160', vendor: 'IKEA (hàng order)',
    w: 1600, d: 2000, hUp: 380, materials: ['veneer', 'mdf'], finishes: ['Veneer sồi trắng', 'Trắng phủ'],
    colorHex: '#d8cfc0', drawingBlock: 'bedD',
    priceNote: '≈ 9.900.000đ (tham khảo)', currency: 'VND',
  },
  {
    kind: 'furniture', name: 'Bàn ăn 4 chỗ gỗ sồi', nameEn: 'Oak Dining Table 4-Seat',
    brand: 'MOHO', sku: 'MH-DIN-1200', vendor: 'MOHO Furniture',
    w: 1200, d: 800, hUp: 750, materials: ['oak'], finishes: ['Sồi tự nhiên dầu lau', 'Sồi khói'],
    colorHex: '#b08d5e', drawingBlock: 'dining4',
    priceNote: '≈ 7.500.000đ (tham khảo)', currency: 'VND',
  },
  {
    kind: 'furniture', name: 'Bàn làm việc HP Luxury', nameEn: 'Office Desk 1400',
    brand: 'Hòa Phát', sku: 'HP-LUX-1400', vendor: 'Nội thất Hòa Phát',
    w: 1400, d: 700, hUp: 750, materials: ['mfc', 'steel'], finishes: ['MFC vân sồi', 'MFC trắng'],
    colorHex: '#c2a37a', drawingBlock: 'desk',
    priceNote: '≈ 3.200.000đ (tham khảo)', currency: 'VND',
  },
  {
    kind: 'furniture', name: 'Tủ áo 2m cánh trượt', nameEn: 'Sliding Wardrobe 2000',
    brand: 'An Cường (gia công)', sku: 'AC-WRD-2000', vendor: 'Xưởng nội thất TTT',
    w: 2000, d: 600, hUp: 2400, materials: ['mdf', 'melamine'], finishes: ['Melamine vân óc chó', 'Sơn 2K trắng mờ'],
    colorHex: '#7a5b41', drawingBlock: 'wardrobe',
    priceNote: '≈ 16.000.000đ (tham khảo, theo md)', currency: 'VND',
    note: 'Millwork gia công theo bản vẽ — giá theo mét dài, phụ kiện Hafele.',
  },
  {
    kind: 'lighting', name: 'Đèn thả PH 5', nameEn: 'PH 5 Pendant',
    brand: 'Louis Poulsen', sku: 'LP-PH5-CL', vendor: 'Đại lý uỷ quyền',
    w: 500, d: 500, hUp: 267, materials: ['aluminum'], finishes: ['Trắng cổ điển', 'Monochrome đen'],
    colorHex: '#efe9df',
    priceNote: '≈ 32.000.000đ (tham khảo)', currency: 'VND',
  },
  {
    kind: 'material', name: 'Đá travertine ong vàng', nameEn: 'Beige Travertine',
    brand: 'Stone World', sku: 'SW-TRV-BE', vendor: 'Stone World Saigon',
    materials: ['travertine'], finishes: ['Mài mờ honed', 'Đánh bóng polished'],
    colorHex: '#d9c7a8',
    priceNote: '≈ 2.400.000đ/m² (tham khảo)', currency: 'VND',
    note: 'Ốp tường điểm nhấn + mặt bàn — kind=material (Q-L2 gộp MaterialRef).',
  },
  {
    kind: 'material', name: 'Sàn gỗ sồi engineered 15mm', nameEn: 'Engineered Oak Flooring 15mm',
    brand: 'An Cường', sku: 'AC-ENG-OAK15', vendor: 'An Cường',
    materials: ['oak', 'plywood'], finishes: ['UV lacquer mờ', 'Dầu lau tự nhiên'],
    colorHex: '#c8a878',
    priceNote: '≈ 1.150.000đ/m² (tham khảo)', currency: 'VND',
  },
];

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('✗ Thiếu DATABASE_URL (.env/.env.local).');
    process.exit(1);
  }
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();
  try {
    let created = 0;
    let updated = 0;
    for (const s of SPECS) {
      const data = {
        kind: s.kind,
        name: s.name,
        nameEn: s.nameEn,
        brand: s.brand,
        sku: s.sku,
        vendor: s.vendor,
        w: s.w ?? null,
        d: s.d ?? null,
        hUp: s.hUp ?? null,
        materials: JSON.stringify(s.materials),
        finishes: JSON.stringify(s.finishes),
        colorHex: s.colorHex ?? null,
        drawingBlock: s.drawingBlock ?? null,
        priceNote: s.priceNote,
        currency: s.currency,
        note: s.note ?? null,
      };
      // idempotent theo sku (sku không @unique trong schema — spec user nhập tay có thể trống
      // sku — nên upsert tay: findFirst rồi update/create).
      const existing = await prisma.productSpec.findFirst({ where: { sku: s.sku } });
      if (existing) {
        await prisma.productSpec.update({ where: { id: existing.id }, data });
        updated += 1;
      } else {
        await prisma.productSpec.create({ data });
        created += 1;
      }
    }
    const total = await prisma.productSpec.count();
    console.log(`✓ Seed ProductSpec: tạo ${created}, cập nhật ${updated}. Tổng trong DB: ${total}.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error('✗ Seed lỗi:', e instanceof Error ? e.message : e);
  process.exit(1);
});
