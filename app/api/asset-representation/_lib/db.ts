/**
 * app/api/asset-representation/_lib/db.ts — helper Prisma dùng chung cho route gốc và [id].
 * Tách khỏi route.ts vì Next chỉ cho route file export handler/config (export thêm hàm là lỗi
 * type ở .next/types).
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';

/** Cùng bệnh Prisma Client cũ trong tiến trình sống dai (xem project-asset-usage/route.ts kiemDelegate). */
export function kiemDelegate() {
  if (typeof (prisma as { assetRepresentation?: unknown }).assetRepresentation !== 'undefined') return null;
  const msg =
    'Prisma Client đang chạy KHÔNG có model AssetRepresentation — tiến trình server khởi động trước lần `prisma generate` gần nhất. KHỞI ĐỘNG LẠI dev server.';
  console.error(`[asset-representation] ${msg}`);
  return NextResponse.json({ error: msg }, { status: 503 });
}

/** Asset còn sống + thuộc user ⇒ trả về; khác ⇒ null (caller trả 404 — không tiết lộ asset tồn tại). */
export async function assetCuaUser(assetId: string, userId: string) {
  const asset = await prisma.libraryAsset.findUnique({ where: { id: assetId }, select: { id: true, userId: true, deletedAt: true } });
  if (!asset || asset.deletedAt || asset.userId !== userId) return null;
  return asset;
}
