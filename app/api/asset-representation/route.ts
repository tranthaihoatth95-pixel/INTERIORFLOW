import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';
import { getSessionUser } from '@/lib/server/auth';
import { assetTrongPhamVi } from '@/lib/server/access';

/**
 * app/api/asset-representation — nơi LƯU kết quả đã duyệt của lát cắt "Ảnh → Spec".
 *
 * ── LOOK INSIDE (luật B25) ─────────────────────────────────────────────────────────────────────
 * Bảng `AssetRepresentation` ĐÃ CÓ trong `prisma/schema.prisma` (kind · payloadRef · truthLevel ·
 * provenance · verifiedBy) và đã có quan hệ `LibraryAsset.representations`. Route này KHÔNG thêm
 * bảng, KHÔNG thêm cột, KHÔNG chạy migration — chỉ mở cửa ghi/đọc cho nó.
 *
 * ── LUẬT ───────────────────────────────────────────────────────────────────────────────────────
 *  ① KHÔNG NHÂN BẢN DANH TÍNH: ghi một CÁCH THỂ HIỆN cho asset đã có. `assetId` phải tồn tại;
 *    route này KHÔNG bao giờ tạo `LibraryAsset`.
 *  ② `truthLevel` chỉ nhận đúng bộ ba từ vựng đang chạy — cấm bộ thứ tư lọt qua đường mạng.
 *  ③ `verified` PHẢI có người ký. `truthLevel='verified'` mà `verifiedBy` trống là verified vô
 *    chủ ⇒ 400. (Cùng luật `nhanUngVien()` đã canh ở tầng lib.)
 *  ④ ⚙️ `W1-ASSET-REPRESENTATION-SCOPE-001` (26/08) — PHẠM VI. Ba method trước lát này đều chỉ
 *    hỏi "có phiên không", không hỏi "phiên này có quyền trên asset kia không":
 *      · GET    — bất kỳ ai biết `assetId` đọc được mọi cách thể hiện, kèm `provenance` (số đo,
 *                 người ký, ảnh gốc) và `createdBy`.
 *      · POST   — gắn được cách thể hiện vào asset của người khác.
 *      · DELETE — **xoá mềm được bản ghi của người khác**, chỉ cần biết `id`. Đây là nặng nhất:
 *                 phá dữ liệu, không phải chỉ đọc trộm.
 *    Nay cả ba đi qua `assetTrongPhamVi()` — cùng cửa, cùng cờ `IF_LIBRARY_SCOPE_ENFORCE` với
 *    `GET /api/library/[id]/file`. Cờ TẮT ⇒ hành vi y hệt hôm nay (kho dùng chung).
 *    Kiểm quyền chạy **TRƯỚC** mọi truy vấn dữ liệu — không tải rồi mới che.
 */

const TRUTH = ['measured', 'inferred', 'verified'] as const;

/** GET /api/asset-representation?assetId=… — liệt kê cách thể hiện của một asset. */
export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const assetId = new URL(req.url).searchParams.get('assetId');
  if (!assetId) return NextResponse.json({ error: 'Thiếu assetId.' }, { status: 400 });
  // ④ Kiểm quyền TRƯỚC khi chạm bảng `assetRepresentation`. Thứ tự này là nội dung của luật,
  // không phải tiểu tiết: hỏi DB rồi mới lọc ở tầng trên nghĩa là dữ liệu đã rời khỏi bảng.
  // 404 chứ không 403 — "asset không tồn tại" và "asset của người khác" phải KHÔNG phân biệt
  // được từ ngoài, nếu không chính mã trạng thái trở thành máy dò.
  if (!(await assetTrongPhamVi(user, assetId)))
    return NextResponse.json({ error: 'Không tìm thấy.' }, { status: 404 });
  const rows = await prisma.assetRepresentation.findMany({
    where: { assetId, deletedAt: null },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ representations: rows });
}

/** POST — body { assetId, kind, payloadRef, truthLevel, provenance, verifiedBy? }. */
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: 'Body JSON không hợp lệ.' }, { status: 400 });

  const assetId = typeof body.assetId === 'string' ? body.assetId : '';
  const kind = typeof body.kind === 'string' ? body.kind.trim() : '';
  const payloadRef = typeof body.payloadRef === 'string' ? body.payloadRef.trim() : '';
  const truthLevel = typeof body.truthLevel === 'string' ? body.truthLevel : '';
  const provenance = typeof body.provenance === 'string' ? body.provenance : '';
  const verifiedBy = typeof body.verifiedBy === 'string' && body.verifiedBy.trim() ? body.verifiedBy.trim() : null;

  if (!assetId || !kind || !payloadRef) {
    return NextResponse.json({ error: 'Thiếu assetId / kind / payloadRef.' }, { status: 400 });
  }
  if (!(TRUTH as readonly string[]).includes(truthLevel)) {
    return NextResponse.json({ error: `truthLevel phải là 1 trong: ${TRUTH.join(', ')}.` }, { status: 400 });
  }
  if (truthLevel === 'verified' && !verifiedBy) {
    return NextResponse.json({ error: 'truthLevel=verified phải kèm verifiedBy — không có verified vô chủ.' }, { status: 400 });
  }
  // Luật ① (gắn vào danh tính ĐANG CÓ, không đẻ asset mới) và luật ④ (phạm vi) là CÙNG một
  // truy vấn — `assetTrongPhamVi` trả null cho cả hai ca, và cả hai đều đáng 404.
  if (!(await assetTrongPhamVi(user, assetId)))
    return NextResponse.json({ error: 'Không thấy ảnh gốc — cách thể hiện phải gắn vào một asset đã có.' }, { status: 404 });

  const row = await prisma.assetRepresentation.create({
    data: {
      assetId,
      kind,
      payloadRef,
      truthLevel,
      provenance,
      verifiedBy,
      verifiedAt: verifiedBy ? new Date() : null,
      createdBy: user.id,
    },
  });
  return NextResponse.json({ representation: row }, { status: 201 });
}

/**
 * DELETE /api/asset-representation?id=… — xoá mềm (đặt `deletedAt`), đúng lối `deletedAt` mọi
 * bảng khác đang dùng. Có cửa này để dọn sạch dữ liệu thử sau khi nghiệm thu trên app thật.
 */
export async function DELETE(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Thiếu id.' }, { status: 400 });
  // ④ Tra bản ghi để biết nó thuộc asset nào, rồi mới hỏi quyền. Chỉ lấy `assetId` — không kéo
  // `provenance`/`createdBy` về trước khi biết phiên này có quyền hay không.
  const row = await prisma.assetRepresentation.findFirst({
    where: { id, deletedAt: null },
    select: { assetId: true },
  });
  // Không thấy VÀ ngoài phạm vi cùng trả `ok:true` như trước — `updateMany` với 0 hàng khớp
  // vốn đã trả `ok:true`, nên giữ nguyên hình dạng phản hồi: không cửa nào rò rỉ "bản ghi này
  // có thật" qua chênh lệch mã trạng thái.
  if (!row || !(await assetTrongPhamVi(user, row.assetId))) return NextResponse.json({ ok: true });
  await prisma.assetRepresentation.updateMany({ where: { id, deletedAt: null }, data: { deletedAt: new Date() } });
  return NextResponse.json({ ok: true });
}
