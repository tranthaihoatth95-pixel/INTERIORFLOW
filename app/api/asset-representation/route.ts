import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';
import { getSessionUser } from '@/lib/server/auth';
import { kiemBodyTao } from './_lib/kiem';
import { assetCuaUser, kiemDelegate } from './_lib/db';

/**
 * app/api/asset-representation — API cho `AssetRepresentation` (cửa duyệt 02, schema.prisma:347):
 * MỘT món đồ (LibraryAsset) — NHIỀU cách thể hiện. Route này là chỗ DUY NHẤT ghi hàng biểu diễn
 * từ client; đường nhập hãng (`/api/manufacturer-import`) ghi qua cùng bảng nhưng là hàng loạt
 * từ một họ đã chuẩn hoá.
 *
 * QUYỀN: `LibraryAsset.userId === user.id` — asset thuộc người, không thuộc project (promote.ts
 * §contract). Người khác nhận 404, không 403 (không tiết lộ asset tồn tại — cùng luật
 * lib/server/access.ts:29).
 *
 * GET  ?assetId=X          — danh sách biểu diễn còn sống của asset.
 * POST {assetId, kind, payloadRef, truthLevel?, provenance?} — thêm một biểu diễn. KHÔNG
 *      @@unique([assetId,kind]) theo schema ⇒ nhiều phương án cùng kind là hợp lệ; route KHÔNG
 *      chống trùng theo kind. Chống trùng THEO payloadRef: cùng asset + cùng kind + cùng
 *      payloadRef còn sống ⇒ trả hàng cũ (200, `daCo:true`) — không nhân bản con trỏ y hệt.
 *
 * Bảng mã lỗi + luật "không để lỗi thoát ra ngoài handler" chép nguyên từ
 * app/api/project-asset-usage/route.ts (401/404/400/503/500 luôn có body JSON).
 */

function loiJson(e: unknown, cho: string) {
  console.error(`[asset-representation] ${cho} — lỗi không lường trước:`, e);
  const detail = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
  return NextResponse.json(
    { error: 'Lỗi máy chủ khi xử lý asset-representation.', ...(process.env.NODE_ENV === 'production' ? {} : { detail }) },
    { status: 500 },
  );
}

const ROW_SELECT = {
  id: true,
  assetId: true,
  kind: true,
  payloadRef: true,
  truthLevel: true,
  provenance: true,
  verifiedBy: true,
  verifiedAt: true,
  createdBy: true,
  createdAt: true,
} as const;

export async function GET(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    const thieu = kiemDelegate();
    if (thieu) return thieu;
    const assetId = new URL(req.url).searchParams.get('assetId')?.trim() ?? '';
    if (!assetId) return NextResponse.json({ error: 'Cần ?assetId=.' }, { status: 400 });
    const asset = await assetCuaUser(assetId, user.id);
    if (!asset) return NextResponse.json({ error: 'Không tìm thấy asset.' }, { status: 404 });
    const rows = await prisma.assetRepresentation.findMany({
      where: { assetId, deletedAt: null },
      orderBy: [{ kind: 'asc' }, { createdAt: 'desc' }],
      select: ROW_SELECT,
    });
    return NextResponse.json({ representations: rows });
  } catch (e) {
    return loiJson(e, 'GET');
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    const thieu = kiemDelegate();
    if (thieu) return thieu;
    const body = await req.json().catch(() => null);
    const kiem = kiemBodyTao(body);
    if (!kiem.ok) return NextResponse.json({ error: kiem.error }, { status: 400 });
    const asset = await assetCuaUser(kiem.data.assetId, user.id);
    if (!asset) return NextResponse.json({ error: 'Không tìm thấy asset.' }, { status: 404 });

    const daCo = await prisma.assetRepresentation.findFirst({
      where: { assetId: kiem.data.assetId, kind: kiem.data.kind, payloadRef: kiem.data.payloadRef, deletedAt: null },
      select: ROW_SELECT,
    });
    if (daCo) return NextResponse.json({ representation: daCo, daCo: true });

    const row = await prisma.assetRepresentation.create({
      data: { ...kiem.data, createdBy: user.id },
      select: ROW_SELECT,
    });
    return NextResponse.json({ representation: row, daCo: false }, { status: 201 });
  } catch (e) {
    return loiJson(e, 'POST');
  }
}
