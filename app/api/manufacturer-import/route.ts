import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/server/auth';
import { assertProjectAccess } from '@/lib/server/access';
import { dungPhieuTuDuAn } from './_lib/goi';
import type { KhaiTay } from '@/lib/capabilities/manufacturer-import';
import { prisma } from '@/lib/server/db';
import { normalizeAssetFamily, toRepresentationRows } from '@/lib/idfc-import/asset-family';
import { catalogPayloadFromFamily } from '@/lib/materials/warehouse/catalog-link';
import { parseCandidate } from './_lib/parse-candidate';

export const dynamic = 'force-dynamic';

/**
 * `POST /api/manufacturer-import` — CỬA NHẬP. **HAI CHẾ ĐỘ, phân biệt bằng `projectId`** (cùng
 * khuôn dispatch đã dùng ở `app/api/comments/route.ts`; hai nhánh dựng độc lập 19/08→04/09, hoà
 * lại giữ trọn cả hai vì chúng giải hai bài khác nhau trên cùng một cửa).
 *
 * ① CÓ `projectId` — **DỰNG PHIẾU từ gói tệp dự án** (đường B).
 *      Body `{projectId, projectFileIds[], khai?}` → `{phieu, tepKhongThay}`.
 *      🔴 KHÔNG GHI MỘT DÒNG NÀO. Chỉ TRÌNH RA phiếu ứng viên để người duyệt xem: NGUỒN ·
 *      DANH TÍNH · CÁC CÁCH THỂ HIỆN · KÍCH THƯỚC · VẬT LIỆU · XUẤT XỨ · CẢNH BÁO. Việc ghi nằm ở
 *      `POST /api/manufacturer-import/apply`, chỉ chạy khi có quyết định của người. Hai cửa tách
 *      hẳn để KHÔNG THỂ có promote im lặng. Vai `'bim'` (nấc ghi thấp nhất): phiếu đọc nội dung tệp.
 *
 * ② KHÔNG `projectId` — **CHUẨN HOÁ ỨNG VIÊN thành MỘT HỌ TÀI SẢN** (Slice 8).
 *      JSON ứng viên → `parseCandidate` (thuần) → `decideAcquisition` (pháp lý, TRƯỚC byte) →
 *      `normalizeAssetFamily` (tất định) → `{family, representationRows, catalogPayload, issues}`.
 *      `attachToAssetId` (tuỳ chọn): gắn hàng biểu diễn vào `LibraryAsset` ĐÃ CÓ của user — cùng
 *      danh tính, KHÔNG nhân bản asset. Chỉ ghi khi tier ≠ blocked; reference-only chỉ ghi con trỏ
 *      (đúng geometryPolicy). Chống trùng theo (assetId, kind, payloadRef). Ghi .idfc thành
 *      LibraryAsset mới KHÔNG làm ở đây (cửa ghi Thư viện chỉ nhận ảnh raster — phiếu khác).
 *
 * ⛔ CẢ HAI: không nhận URL, KHÔNG tải gì từ mạng — đường A (tải từ trang hãng) đụng điều kiện
 * truy cập của từng hãng: việc pháp lý, không phải việc code. Không cào, không vượt tường phí.
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

    /* ① CHẾ ĐỘ DỰNG PHIẾU — nhận ra bằng `projectId`. Nhánh này KHÔNG ghi một dòng nào.
       Trước 04/09 nó là toàn bộ route; nay là một trong hai chế độ, hợp đồng giữ nguyên. */
    const duAn = body && typeof (body as { projectId?: unknown }).projectId === 'string'
      ? (body as { projectId: string }).projectId
      : '';
    if (duAn) {
      const b = body as { projectId: string; projectFileIds?: unknown; khai?: unknown };
      const ids: string[] = Array.isArray(b.projectFileIds)
        ? b.projectFileIds.filter((x: unknown): x is string => typeof x === 'string')
        : [];
      if (!ids.length) return NextResponse.json({ error: 'Gói rỗng — chọn ít nhất một tệp.' }, { status: 400 });
      if (ids.length > 20) return NextResponse.json({ error: 'Một gói tối đa 20 tệp.' }, { status: 400 });

      await assertProjectAccess(user.id, duAn, 'bim');

      const kq = await dungPhieuTuDuAn({
        projectId: duAn,
        projectFileIds: ids,
        khai: (b.khai ?? undefined) as KhaiTay | undefined,
      });
      return NextResponse.json(kq);
    }

    /* ② CHẾ ĐỘ CHUẨN HOÁ ỨNG VIÊN — không `projectId`. */
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
    // Giữ CẢ HAI cách báo lỗi: lỗi quyền của nhánh ① vẫn ra 403 (assertProjectAccess ném Error),
    // phần còn lại đi qua `loiJson` (có log + giấu chi tiết ở production).
    const msg = e instanceof Error ? e.message : '';
    if (/quyền|forbidden|access/i.test(msg)) return NextResponse.json({ error: msg }, { status: 403 });
    return loiJson(e);
  }
}
