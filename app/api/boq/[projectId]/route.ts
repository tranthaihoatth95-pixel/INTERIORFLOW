import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';
import { getSessionUser } from '@/lib/server/auth';
import { AccessError, assertProjectAccess } from '@/lib/server/access';
import { specToDto } from '@/lib/server/specs';
import { dongBoqHatGiong } from '@/lib/materials/kho-mo-dau';
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

  // 06/08 (G-M3-09) — BỎ `where: { kind: 'material' }`. Từ khi `computeBoq` đếm cả MÓN RỜI
  // (`BlockEntity.specId`), mã hàng của một cái ghế nằm ở `kind:'furniture'`/'lighting'/'fixture'…
  // — lọc mỗi 'material' thì MỌI món rời rơi vào lỗi 'spec-not-found' (bảng đầy lỗi giả) hoặc, tệ
  // hơn, người dùng tưởng bảng đúng. Sửa NGOÀI vùng file được giao nhưng BẮT BUỘC: cờ giá không
  // tự tới engine được nếu server không đọc lên (cùng lý do đã ghi ở P12/`lib/ai/client.ts`).
  const specRows = await prisma.productSpec.findMany();
  // ⭐ 06/09 (lane ĐẦU RA NÓI THẬT) — NỐI TẦNG HẠT GIỐNG. Route này là mặt tiền cuối cùng còn
  // đọc MỖI bảng `ProductSpec`; bốn mặt kia (Kho vật liệu · Files/ngăn phần thô · Render Studio ·
  // ô chọn vật liệu 2D) đã trộn tầng hạt giống từ 04-05/09. Hậu quả đo được (tái hiện bằng
  // `computeBoqForProject(..., [])`): máy sạch tô được vật liệu ship kèm bản cài, mở BOQ ra
  // **0 dòng** kèm câu *"không tìm thấy… có thể vật liệu đã bị xoá/đổi"* — sai hướng, vì nó chưa
  // bao giờ là bản ghi DB. Nối vào thì lỗi thành `missing-priceVnd` (đúng: chưa có giá), và khi
  // studio đã nhập giá cho đúng `matId` đó thì vùng tô cũ RA DÒNG THẬT (`dongBoqHatGiong` mượn
  // mặt thương mại qua `getMaterial`). Hạt giống xếp SAU: `id` của chúng mang tiền tố
  // `hat-giong:` nên không bao giờ đụng `id` của bản ghi DB — nối thêm, không đè ai.
  // `specToDto` đã Number()-hoá `Decimal` của Prisma — `dongBoqHatGiong` đọc DTO, không đọc
  // hàng thô (Decimal không phải number, so giá sẽ hỏng âm thầm).
  const dbDtos = specRows.map(specToDto);
  const specDtos: ProductSpecDtoLite[] = [...dbDtos, ...dongBoqHatGiong(dbDtos)];

  const { result, hit } = computeBoqForProject(projectId, doc as Doc, specDtos);

  return NextResponse.json({
    rows: result.rows,
    errors: result.errors,
    totalAmount: result.totalAmount,
    hit,
  });
}
