import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';
import { getSessionUser } from '@/lib/server/auth';
import { assertProjectAccess } from '@/lib/server/access';
import { promoteProjectFile } from '@/lib/server/promote';
import { kiemDelegate, loiJson as loiJsonChung } from '../../_lib/guard';

/**
 * app/api/project-files/[id]/promote — **BƯỚC PROMOTE**: tệp thô của một dự án trở thành vật
 * dùng lại được của Master Library.
 *
 * `POST {usage?, name?, category?, note?}` →
 *   `{ asset: {id, imgId}, usage: {id, usage}, daCo }`
 *
 * `daCo: true` ⇒ tệp này đã promote trước đó, KHÔNG sinh asset thứ hai (idempotent). Đây là
 * **200 chứ không phải 409** — người dùng bấm lại không phải là lỗi, chỉ là không có gì mới.
 *
 * Toàn bộ logic (transaction, idempotency, provenance tag, giới hạn dedupe) ở
 * `lib/server/promote.ts` — route này CHỈ lo phiên + quyền + mã lỗi, để logic còn test được
 * không cần cookie thật.
 *
 * Vai **'bim'** (nấc ghi thấp nhất, ROLE_RANK 1 — repo KHÔNG có vai 'editor'): Promote ghi ra hai bảng và đưa một vật của dự án vào kho dùng chung — không
 * phải thao tác chỉ-đọc.
 */
const loiJson = (e: unknown, cho: string) => loiJsonChung(e, 'project-files/[id]/promote', cho);

export async function POST(req: Request, ctx: { params: { id: string } }) {
  try {
    return await postHandler(req, ctx);
  } catch (e) {
    return loiJson(e, 'POST');
  }
}

async function postHandler(req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const thieu = kiemDelegate('project-files/[id]/promote');
  if (thieu) return thieu;

  try {
    // Tra project TRƯỚC để gate quyền — `promoteProjectFile` cố ý KHÔNG kiểm quyền (cùng quy ước
    // `saveLibraryAssetFromBuffer`), nên cửa quyền phải đóng ở đây, không ở trong lõi.
    const pf = await prisma.projectFile.findUnique({
      where: { id: params.id },
      select: { projectId: true, deletedAt: true },
    });
    if (!pf || pf.deletedAt)
      return NextResponse.json({ error: 'Không tìm thấy tệp dự án.' }, { status: 404 });

    await assertProjectAccess(user.id, pf.projectId, 'bim');

    const body = await req.json().catch(() => ({}));
    const kq = await promoteProjectFile({
      projectFileId: params.id,
      userId: user.id,
      usage: typeof body.usage === 'string' ? body.usage : undefined,
      name: typeof body.name === 'string' ? body.name : undefined,
      category: typeof body.category === 'string' ? body.category : undefined,
      note: typeof body.note === 'string' ? body.note : undefined,
    });
    if (!kq.ok) return NextResponse.json({ error: kq.error }, { status: kq.status });

    return NextResponse.json({
      daCo: kq.daCo,
      asset: { id: kq.assetId, imgId: kq.imgId, url: `/api/library/${kq.assetId}/file` },
      usage: { id: kq.usageId, usage: kq.usage, projectId: kq.projectId },
    });
  } catch (e) {
    return loiJson(e, 'POST');
  }
}
