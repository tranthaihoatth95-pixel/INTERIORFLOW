import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';
import { getSessionUser } from '@/lib/server/auth';
import { AccessError, assertProjectAccess } from '@/lib/server/access';

/**
 * app/api/project-asset-usage — ProjectAssetUsage API (H6→bước kế, phiếu 20/08).
 *
 * Bước đầu chuỗi Reference/Asset: Q5(schema) → Understand → Promote → LibraryAsset →
 * ProjectAssetUsage(ĐÂY) → H9 → downstream. Model đã tồn tại thật trong dev.db (H6 xong).
 *
 * POST {projectId, assetId, usage, note?, workspaceId?, canvasId?, addedBy?} — gắn một asset
 * vào một project với một usage cụ thể. `workspaceId`/`canvasId` là string tự do (TRANSITIONAL,
 * xem comment schema.prisma:690-697) — KHÔNG validate FK.
 *
 * Cùng vấn đề soft-delete với ProjectMember (schema.prisma:719-724, xem
 * app/api/projects/[id]/members/route.ts POST dòng ~94-129 làm mẫu): @@unique([projectId,
 * assetId, usage]) không loại trừ deletedAt → gỡ rồi gắn lại CÙNG bộ ba khoá sẽ đụng unique nếu
 * create() mù. Route này PHẢI tra hàng cũ trước: đã xoá mềm → hồi sinh (update deletedAt:null);
 * còn sống → 409; không có → create.
 *
 * GET ?projectId=X — list usage còn sống của 1 project, kèm asset cơ bản.
 * GET ?assetId=X — where-used: list mọi project đang REUSE asset này.
 *
 * ProjectAssetUsage KHÔNG có field `rev` trong schema (kiểm tại ⓪ tiền đề) → KHÔNG áp
 * rev-guard (lib/server/rev-guard.ts) cho model này, khác với ProjectMember/Flow.
 *
 * ══ BẢNG MÃ LỖI (Hoà chốt 20/08 — không gộp mọi thứ thành 500) ═══════════════════════
 *   401 chưa đăng nhập · phiên hết hạn · token hỏng · user trong cookie không còn trong DB.
 *       ⛔ Phiên chết thì trả 401 ĐÚNG NGHĨA — TUYỆT ĐỐI không nới/bỏ qua auth để "cho chạy".
 *   403 có phiên nhưng không đủ vai trên project — do `AccessError` mang sẵn status; `loiJson`
 *       GIỮ NGUYÊN status của nó, không đè.
 *   404 project / asset / usage không tồn tại (hoặc đã xoá mềm). Người ngoài dự án cũng nhận
 *       404 chứ không 403 — không tiết lộ "project này có tồn tại" (lib/server/access.ts:29).
 *   400 thiếu param, truyền cả `projectId` lẫn `assetId`, body JSON hỏng, thiếu trường bắt buộc.
 *   503 Prisma Client đang chạy thiếu model (xem `kiemDelegate`) — lỗi VẬN HÀNH, không phải dữ liệu.
 *   500 lỗi không lường trước — LUÔN có body JSON + `console.error` kèm stack. Không bao giờ rỗng.
 *
 * QUY ƯỚC where-used (`?assetId=`): luôn **200 + mảng** — asset không tồn tại, chưa ai dùng,
 * hay user không thấy project nào đều là "danh sách rỗng", KHÔNG 404. Lý do: đây là truy vấn
 * DANH SÁCH, và 404 ở đây còn để lộ assetId nào có thật. Khoá bằng test trong route.guard.test.ts.
 */

/**
 * ⛔ KHÔNG BAO GIỜ ĐỂ LỖI THOÁT RA NGOÀI HANDLER.
 *
 * Bản đầu viết `function errResponse(e) { if (AccessError) …; throw e; }` — mọi lỗi KHÔNG
 * phải AccessError bị ném lại cho Next, và Next trả **500 với body RỖNG, không log gì**.
 * Đo thật 20/08 trên server 3001 (có session): `GET ?assetId=…` → `{status:500, body:""}`
 * trong khi cùng query chạy tay bằng Prisma thì OK ⇒ không có một manh mối nào để chẩn.
 * Thêm nữa `getSessionUser()` nằm NGOÀI try nên lỗi hạ tầng ở đó cũng thành 500 câm.
 *
 * Luật từ đây: mỗi handler bọc TRỌN trong `try` (kể cả đọc session), mọi lỗi đi qua
 * `loiJson()` → luôn có body JSON + `console.error` phía server.
 */
function loiJson(e: unknown, cho: string) {
  if (e instanceof AccessError) return NextResponse.json({ error: e.message }, { status: e.status });
  console.error(`[project-asset-usage] ${cho} — lỗi không lường trước:`, e);
  const detail = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
  return NextResponse.json(
    {
      error: 'Lỗi máy chủ khi xử lý project-asset-usage.',
      // Chi tiết CHỈ lộ ngoài production — đủ để chẩn lúc dev, không rò nội tạng khi phát hành.
      ...(process.env.NODE_ENV === 'production' ? {} : { detail }),
    },
    { status: 500 },
  );
}

/**
 * 🔴 NGUYÊN NHÂN THẬT của ca 500-body-rỗng 20/08 — KHÔNG phải lỗi query, KHÔNG phải lỗi auth.
 *
 * Đo tại nguồn: dev server 3001 khởi động **18/08 09:48**; `node_modules/.prisma/client`
 * được sinh lại **20/08 00:23** (lúc thêm model ProjectAssetUsage). Tiến trình Node sống dai
 * vẫn giữ bản `@prisma/client` CŨ trong module cache ⇒ trong server đó
 * `prisma.projectAssetUsage === undefined` (đã dò trực tiếp: `pau:"undefined"` trong khi
 * `projectMember`/`libraryAsset` là `"object"`) ⇒ `.findMany` ném
 * `TypeError: Cannot read properties of undefined (reading 'findMany')`.
 * Vì thế query chạy TAY thì OK (client mới) mà qua browser thì chết (client cũ), và test
 * tích hợp 10/10 PASS cũng đúng — chúng nạp client mới.
 *
 * ⇒ Cách chữa là **KHỞI ĐỘNG LẠI dev server**, không phải sửa query. Guard này chỉ để lần
 * sau nhận ra ngay trong 1 giây thay vì đọc một TypeError câm.
 */
function kiemDelegate() {
  if (typeof (prisma as { projectAssetUsage?: unknown }).projectAssetUsage !== 'undefined') return null;
  const msg =
    'Prisma Client đang chạy KHÔNG có model ProjectAssetUsage — tiến trình server khởi động ' +
    'trước lần `prisma generate` gần nhất. KHỞI ĐỘNG LẠI dev server (không phải lỗi dữ liệu).';
  console.error(`[project-asset-usage] ${msg}`);
  return NextResponse.json({ error: msg }, { status: 503 });
}

const ASSET_SELECT = {
  id: true,
  name: true,
  path: true,
  mime: true,
  category: true,
} as const;

/** POST — gắn asset vào project với 1 usage. Cần ít nhất 'viewer' trên project (không stage-gated: gắn tham chiếu không phải sửa nội dung chặng). */
export async function POST(req: Request) {
  try {
    return await postHandler(req);
  } catch (e) {
    return loiJson(e, 'POST');
  }
}

async function postHandler(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const thieu = kiemDelegate();
  if (thieu) return thieu;
  const body = await req.json().catch(() => ({}));
  const projectId = typeof body.projectId === 'string' ? body.projectId : '';
  const assetId = typeof body.assetId === 'string' ? body.assetId : '';
  const usage = typeof body.usage === 'string' ? body.usage : '';
  const note = typeof body.note === 'string' ? body.note : undefined;
  const workspaceId = typeof body.workspaceId === 'string' ? body.workspaceId : undefined;
  const canvasId = typeof body.canvasId === 'string' ? body.canvasId : undefined;
  const addedBy = typeof body.addedBy === 'string' && body.addedBy ? body.addedBy : user.id;

  if (!projectId || !assetId || !usage)
    return NextResponse.json({ error: 'Cần projectId + assetId + usage.' }, { status: 400 });

  try {
    await assertProjectAccess(user.id, projectId, 'viewer');

    const asset = await prisma.libraryAsset.findUnique({
      where: { id: assetId },
      select: { id: true, deletedAt: true },
    });
    if (!asset || asset.deletedAt)
      return NextResponse.json({ error: 'Không tìm thấy asset.' }, { status: 404 });

    // Tra hàng cũ theo composite unique — tên field Prisma sinh: projectId_assetId_usage
    // (thứ tự đúng @@unique([projectId, assetId, usage]) trong schema).
    const existed = await prisma.projectAssetUsage.findUnique({
      where: { projectId_assetId_usage: { projectId, assetId, usage } },
      select: { id: true, deletedAt: true },
    });

    let row;
    if (existed && !existed.deletedAt) {
      return NextResponse.json({ error: 'Asset đã gắn với usage này rồi.' }, { status: 409 });
    } else if (existed) {
      // Hồi sinh hàng cũ đã xoá mềm — cùng khuôn ProjectMember POST.
      row = await prisma.projectAssetUsage.update({
        where: { id: existed.id },
        data: { deletedAt: null, note: note ?? null, workspaceId, canvasId, addedBy },
        include: { asset: { select: ASSET_SELECT } },
      });
    } else {
      row = await prisma.projectAssetUsage.create({
        data: { projectId, assetId, usage, note: note ?? null, workspaceId, canvasId, addedBy },
        include: { asset: { select: ASSET_SELECT } },
      });
    }
    return NextResponse.json({ usage: row });
  } catch (e) {
    return loiJson(e, 'POST');
  }
}

/**
 * GET ?projectId=X — usage còn sống của 1 project.
 * GET ?assetId=X — where-used: project nào đang dùng asset này.
 * Cần đúng MỘT trong hai param.
 */
export async function GET(req: Request) {
  try {
    return await getHandler(req);
  } catch (e) {
    return loiJson(e, 'GET');
  }
}

async function getHandler(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  // Guard SAU 401: người chưa đăng nhập không cần biết nội tạng server.
  const thieu = kiemDelegate();
  if (thieu) return thieu;
  const url = new URL(req.url);
  const projectId = url.searchParams.get('projectId');
  const assetId = url.searchParams.get('assetId');

  if (!projectId && !assetId)
    return NextResponse.json({ error: 'Cần ?projectId= hoặc ?assetId=.' }, { status: 400 });
  if (projectId && assetId)
    return NextResponse.json({ error: 'Chỉ được truyền một trong hai: projectId hoặc assetId.' }, { status: 400 });

  try {
    if (projectId) {
      await assertProjectAccess(user.id, projectId, 'viewer');
      const rows = await prisma.projectAssetUsage.findMany({
        where: { projectId, deletedAt: null },
        orderBy: { createdAt: 'desc' },
        include: { asset: { select: ASSET_SELECT } },
      });
      return NextResponse.json({ usages: rows });
    }

    // assetId: where-used — không gate theo assertProjectAccess vì trải rộng nhiều project;
    // chỉ trả các project mà user hiện là member (không rò rỉ project của người khác).
    const rows = await prisma.projectAssetUsage.findMany({
      where: { assetId: assetId!, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: { project: { select: { id: true, name: true } } },
    });
    const memberProjectIds = new Set(
      (
        await prisma.projectMember.findMany({
          where: { userId: user.id, deletedAt: null, projectId: { in: rows.map((r) => r.projectId) } },
          select: { projectId: true },
        })
      ).map((m) => m.projectId),
    );
    const visible = rows.filter((r) => memberProjectIds.has(r.projectId));
    return NextResponse.json({ usages: visible });
  } catch (e) {
    return loiJson(e, 'GET');
  }
}
