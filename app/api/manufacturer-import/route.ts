import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';
import { getSessionUser } from '@/lib/server/auth';
import { normalizeAssetFamily, toRepresentationRows } from '@/lib/idfc-import/asset-family';
import { catalogPayloadFromFamily } from '@/lib/materials/warehouse/catalog-link';
import { parseCandidate } from './_lib/parse-candidate';

export const dynamic = 'force-dynamic';

/**
 * POST /api/manufacturer-import — CỬA NHẬP model hãng / ứng viên mở / tệp người dùng thành MỘT HỌ
 * TÀI SẢN chuẩn hoá (Slice 8, 09/2026).
 *
 * Đường: JSON ứng viên → `parseCandidate` (thuần) → `decideAcquisition` (pháp lý, TRƯỚC byte) →
 * `normalizeAssetFamily` (tất định) → trả `family` + `representationRows` + `catalogPayload` +
 * `issues`. KHÔNG tải gì từ mạng (không scrape, không fetch URL hãng — client đưa metadata/byte
 * đã có), KHÔNG ghi file. Đây là CỬA XEM TRƯỚC: người duyệt rồi mới ghi (pipeline human-in-loop).
 *
 * `attachToAssetId` (tuỳ chọn): gắn các hàng biểu diễn vào một `LibraryAsset` ĐÃ CÓ của user
 * (ảnh đã promote) — cùng danh tính, KHÔNG nhân bản asset. Chỉ ghi khi tier ≠ blocked; với
 * reference-only chỉ ghi con trỏ (status on-demand) — đúng geometryPolicy. Chống trùng theo
 * (assetId, kind, payloadRef). ⚠️ Ghi .idfc thành LibraryAsset mới KHÔNG làm ở đây: cửa ghi
 * Thư viện (lib/server/library-save.ts) chỉ nhận ảnh raster — mở rộng nó là phiếu khác.
 */

function loiJson(e: unknown) {
  console.error('[manufacturer-import] lỗi không lường trước:', e);
  const detail = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
  return NextResponse.json(
    { error: 'Lỗi máy chủ khi chuẩn hoá tài sản.', ...(process.env.NODE_ENV === 'production' ? {} : { detail }) },
    { status: 500 },
  );
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    const body = await req.json().catch(() => null);
    const parsed = parseCandidate(body);
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

    const family = normalizeAssetFamily(parsed.candidate);
    const rows = toRepresentationRows(family);
    const catalogPayload = catalogPayloadFromFamily(family);

    let attached: { assetId: string; created: number; daCo: number } | undefined;
    if (parsed.attachToAssetId) {
      if (family.acquisition.tier === 'blocked')
        return NextResponse.json({ error: 'Nguồn bị chặn theo điều khoản — không ghi biểu diễn.', family, issues: family.issues }, { status: 422 });
      if (typeof (prisma as { assetRepresentation?: unknown }).assetRepresentation === 'undefined')
        return NextResponse.json({ error: 'Prisma Client thiếu model AssetRepresentation — khởi động lại dev server.' }, { status: 503 });
      const asset = await prisma.libraryAsset.findUnique({ where: { id: parsed.attachToAssetId }, select: { id: true, userId: true, deletedAt: true } });
      if (!asset || asset.deletedAt || asset.userId !== user.id) return NextResponse.json({ error: 'Không tìm thấy asset.' }, { status: 404 });
      let created = 0;
      let daCo = 0;
      for (const r of rows) {
        const exist = await prisma.assetRepresentation.findFirst({
          where: { assetId: asset.id, kind: r.kind, payloadRef: r.payloadRef, deletedAt: null },
          select: { id: true },
        });
        if (exist) {
          daCo += 1;
          continue;
        }
        await prisma.assetRepresentation.create({ data: { assetId: asset.id, ...r, createdBy: user.id } });
        created += 1;
      }
      attached = { assetId: asset.id, created, daCo };
    }

    return NextResponse.json({
      family,
      representationRows: rows,
      catalogPayload,
      issues: family.issues,
      ...(attached ? { attached } : {}),
    });
  } catch (e) {
    return loiJson(e);
  }
}
