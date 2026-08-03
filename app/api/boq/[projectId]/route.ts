import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';
import { getSessionUser } from '@/lib/server/auth';
import { AccessError, assertProjectAccess } from '@/lib/server/access';
import { specToDto } from '@/lib/server/specs';
import { computeBoqForProject, type ProductSpecDtoLite } from '@/lib/boq/from-project';
import type { Doc } from '@/lib/cad/model';

/**
 * POST /api/boq/[projectId] — BOQ v2 Việc 1 (02/08). **POST, KHÔNG PHẢI GET** — lệch với chỉ đạo
 * gốc ("GET trả JSON") CÓ CHỦ Ý, đã ghi rõ lý do ở `lib/boq/from-project.ts` (đầu file): Doc CHỈ
 * sống ở client (Pha 1 "Desktop đóng gói, KHÔNG đồng bộ", `docs/IF-CORE-SCHEMA.md`), server KHÔNG
 * có bản Doc nào để tự đọc theo `projectId` — client PHẢI gửi kèm Doc hiện có trong body. Route
 * này chỉ làm 2 việc GET-được (auth + tra giá `ProductSpec`) rồi gọi hàm THUẦN đã viết sẵn, không
 * tự tính toán gì thêm ở đây.
 *
 * Body: `{ doc: Doc }`. Trả: `{ rows, errors, totalAmount, hit }` — `hit` (từ
 * `computeBoqCached`) để UI/dev biết lần gọi này có dùng lại cache hay vừa tính lại thật, không
 * bắt buộc UI phải đọc field này.
 *
 * Auth: `getSessionUser()` → `assertProjectAccess(user.id, projectId, 'viewer')` — mirror ĐÚNG
 * pattern `app/api/projects/[id]/overview/route.ts` (404 khi không có quyền, KHÔNG 403 — tránh lộ
 * dự án tồn tại).
 */
export async function POST(req: Request, { params }: { params: { projectId: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const projectId = String(params.projectId ?? '').trim();
  if (!projectId) return NextResponse.json({ error: 'Không tìm thấy dự án.' }, { status: 404 });

  try {
    await assertProjectAccess(user.id, projectId, 'viewer');
  } catch (e) {
    if (e instanceof AccessError) {
      return NextResponse.json({ error: 'Không tìm thấy dự án.' }, { status: 404 });
    }
    throw e;
  }

  const body = await req.json().catch(() => null);
  const doc = (body as { doc?: unknown } | null)?.doc;
  // Kiểm tối thiểu — KHÔNG dựng validator schema đầy đủ cho Doc (chưa có tiền lệ trong repo,
  // `.idf` cũng chỉ parse JSON thẳng không validate sâu, xem lib/cad/idf.ts) — chỉ chặn ca rõ
  // ràng sai (thiếu hẳn `entities`), còn lại tin cấu trúc TypeScript phía client đã đảm bảo.
  if (!doc || typeof doc !== 'object' || !Array.isArray((doc as { entities?: unknown }).entities)) {
    return NextResponse.json(
      { error: 'Body thiếu hoặc sai định dạng { doc }. Client phải gửi kèm Doc hiện có (không đọc được từ server).' },
      { status: 400 },
    );
  }

  const specRows = await prisma.productSpec.findMany({ where: { kind: 'material' } });
  const specDtos: ProductSpecDtoLite[] = specRows.map(specToDto);

  const { result, hit } = computeBoqForProject(projectId, doc as Doc, specDtos);

  return NextResponse.json({
    rows: result.rows,
    errors: result.errors,
    totalAmount: result.totalAmount,
    hit,
  });
}
