import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';
import { getSessionUser } from '@/lib/server/auth';

/** Danh sách flow của user (kèm project). Card dự án cần thêm coverUrl + status + roster team. */
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const ONLINE_MS = 45 * 1000; // seen < 45s = đang online (đồng bộ shape roster dashboard)

  const [flows, projects, members] = await Promise.all([
    prisma.flow.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        name: true,
        userId: true, // owner — card gallery vẽ icon thành viên từ dữ liệu ĐANG CÓ (không thêm bảng)
        coverUrl: true,
        status: true,
        version: true,
        updatedAt: true,
        shareToken: true,
        // larkProjectCode: Home/Gallery card đọc để hiện pill cảnh báo Larkbase khi đã liên
        // kết (docs/RESEARCH-HOME-GALLERY-DASHBOARD.md §2.2(a)) — additive, không đổi field cũ.
        project: { select: { id: true, name: true, larkProjectCode: true } },
      },
    }),
    prisma.project.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, clientName: true, larkProjectCode: true },
    }),
    // roster cả team (app nội bộ LAN) — hàng avatar memoji trên card
    prisma.user.findMany({
      orderBy: { lastSeenAt: 'desc' },
      select: { id: true, name: true, lastSeenAt: true },
    }),
  ]);

  const now = Date.now();
  const team = members.map((u) => ({
    id: u.id,
    name: u.name,
    online: now - new Date(u.lastSeenAt).getTime() < ONLINE_MS,
  }));

  return NextResponse.json({ flows, projects, team });
}

/** Tạo flow mới (kèm graph hiện tại nếu gửi lên) hoặc project mới. */
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => ({}));

  if (body.type === 'project') {
    // larkProjectCode: bước TUỲ CHỌN "Liên kết Larkbase" (§2.4/§2.6 M1) — chỉ nhận chuỗi
    // toàn số (đúng quy tắc lọc "Mã DA" đã áp khi sync, lib/lark/task-utils.ts). Giá trị
    // KHÔNG khớp → bỏ qua lặng lẽ (coi như "chưa liên kết"), không lỗi khó hiểu.
    const rawCode = typeof body.larkProjectCode === 'string' ? body.larkProjectCode.trim() : '';
    const larkProjectCode = /^\d+$/.test(rawCode) ? rawCode : null;
    const project = await prisma.project.create({
      data: {
        userId: user.id,
        name: String(body.name ?? 'Dự án mới'),
        clientName: body.clientName ?? null,
        larkProjectCode,
      },
    });
    return NextResponse.json({ project });
  }

  const flow = await prisma.flow.create({
    data: {
      userId: user.id,
      name: String(body.name ?? 'Untitled flow'),
      projectId: body.projectId ?? null,
      graphJson: typeof body.graphJson === 'string' ? body.graphJson : '{"nodes":[],"edges":[]}',
    },
  });
  return NextResponse.json({ flow: { id: flow.id, name: flow.name, version: flow.version } });
}
