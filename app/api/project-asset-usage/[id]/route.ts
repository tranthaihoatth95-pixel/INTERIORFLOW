import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';
import { getSessionUser } from '@/lib/server/auth';
import { AccessError, assertProjectAccess } from '@/lib/server/access';

/**
 * app/api/project-asset-usage/[id] — DELETE gỡ MỘT usage record (soft-delete).
 * KHÔNG đụng LibraryAsset liên quan — asset vẫn còn trong Thư viện dù usage bị gỡ.
 * Xem app/api/project-asset-usage/route.ts cho POST/GET + bối cảnh phiếu.
 */

/**
 * ⛔ Cùng một luật với route cha (xem docstring `loiJson` ở ../route.ts): KHÔNG ném lỗi ra
 * ngoài handler. Bản đầu `throw e` cho mọi lỗi non-AccessError → Next trả 500 body RỖNG,
 * không log gì, không chẩn được (ca thật 20/08). `getSessionUser()` cũng phải nằm TRONG try.
 */
function loiJson(e: unknown, cho: string) {
  if (e instanceof AccessError) return NextResponse.json({ error: e.message }, { status: e.status });
  console.error(`[project-asset-usage/[id]] ${cho} — lỗi không lường trước:`, e);
  const detail = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
  return NextResponse.json(
    {
      error: 'Lỗi máy chủ khi xử lý project-asset-usage.',
      ...(process.env.NODE_ENV === 'production' ? {} : { detail }),
    },
    { status: 500 },
  );
}

/** Xem docstring `kiemDelegate` ở ../route.ts — nguyên nhân thật của ca 500 body rỗng. */
function kiemDelegate() {
  if (typeof (prisma as { projectAssetUsage?: unknown }).projectAssetUsage !== 'undefined') return null;
  const msg =
    'Prisma Client đang chạy KHÔNG có model ProjectAssetUsage — tiến trình server khởi động ' +
    'trước lần `prisma generate` gần nhất. KHỞI ĐỘNG LẠI dev server (không phải lỗi dữ liệu).';
  console.error(`[project-asset-usage/[id]] ${msg}`);
  return NextResponse.json({ error: msg }, { status: 503 });
}

export async function DELETE(req: Request, ctx: { params: { id: string } }) {
  try {
    return await deleteHandler(req, ctx);
  } catch (e) {
    return loiJson(e, 'DELETE');
  }
}

async function deleteHandler(_req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const thieu = kiemDelegate();
  if (thieu) return thieu;
  try {
    const row = await prisma.projectAssetUsage.findUnique({
      where: { id: params.id },
      select: { id: true, projectId: true, deletedAt: true },
    });
    if (!row || row.deletedAt)
      return NextResponse.json({ error: 'Không tìm thấy usage.' }, { status: 404 });

    await assertProjectAccess(user.id, row.projectId, 'viewer');

    // Soft-delete — KHÔNG delete() thật, KHÔNG chạm LibraryAsset (chỉ gỡ liên kết dùng, giữ asset).
    await prisma.projectAssetUsage.update({
      where: { id: row.id },
      data: { deletedAt: new Date() },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return loiJson(e, 'DELETE');
  }
}
