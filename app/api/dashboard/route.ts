import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';
import { getSessionUser } from '@/lib/server/auth';
import { HIDDEN_NOTEBOOK_PREFIX } from '@/lib/notebook/resolveProject';

/**
 * Tổng quan cho Dashboard: team + projects + hoạt động gần đây + thống kê.
 * Đây là app nội bộ team (LAN) → hiển thị toàn team, không chỉ user hiện tại.
 */
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const now = Date.now();
  const ONLINE_MS = 2 * 60 * 1000; // seen < 2 phút = đang online

  const [users, projects, flows, spend] = await Promise.all([
    prisma.user.findMany({
      orderBy: { lastSeenAt: 'desc' },
      // KHÔNG select email/phone — PII, client không hiển thị (chỉ tên + avatar chữ cái).
      select: {
        id: true,
        name: true,
        credits: true,
        isAdmin: true,
        lastSeenAt: true,
        _count: {
          select: {
            flows: { where: { deletedAt: null } },
            projects: { where: { deletedAt: null } },
          },
        },
      },
    }),
    prisma.project.findMany({
      where: { deletedAt: null, NOT: { name: { startsWith: HIDDEN_NOTEBOOK_PREFIX } } },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        clientName: true,
        createdAt: true,
        // larkProjectCode: panel "Chi tiết" cần đối chiếu Project.id → Mã DA để lọc bảng/kanban
        // Larkbase theo đúng project của card (docs/RESEARCH-HOME-GALLERY-DASHBOARD.md §2.2(b)).
        larkProjectCode: true,
        user: { select: { id: true, name: true } },
        _count: { select: { flows: { where: { deletedAt: null } } } },
      },
    }),
    prisma.flow.findMany({
      where: { deletedAt: null },
      orderBy: { updatedAt: 'desc' },
      take: 12,
      select: {
        id: true,
        name: true,
        version: true,
        updatedAt: true,
        shareToken: true,
        user: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
      },
    }),
    // tổng credit đã tiêu (amount âm) trong 30 ngày gần đây
    prisma.creditTransaction.aggregate({
      _sum: { amount: true },
      where: { amount: { lt: 0 }, createdAt: { gte: new Date(now - 30 * 24 * 3600 * 1000) } },
    }),
  ]);

  // 05/08 (`docs/AUDIT-BACKEND-2026-08-03.md` §2.4) — `credits` là SỐ DƯ TÀI CHÍNH của từng
  // người: chỉ trả của CHÍNH MÌNH, người khác nhận `undefined`. Không phải chuyện bí mật tuyệt
  // đối trong app nội bộ, nhưng cũng không có lý do gì để mọi người thấy ví của nhau.
  //
  // ⚠️ ĐÍNH CHÍNH AUDIT (§2.4 ghi "credits/isAdmin là thừa cho UI"): SAI với `isAdmin` — grep
  // `components/Dashboard.tsx:451` cho thấy UI dùng thật để hiện icon vương miện cạnh tên admin
  // (tính năng có chủ ý, không phải rác). Vai admin trong team nội bộ cũng không phải dữ liệu
  // nhạy cảm như số dư. Vì vậy GIỮ `isAdmin`, chỉ siết `credits`. Nếu Hoà vẫn muốn giấu luôn
  // vai admin thì phải bỏ cả icon vương miện ở client — việc UI riêng, không làm âm thầm ở đây.
  const team = users.map((u) => ({
    id: u.id,
    name: u.name,
    ...(u.id === user.id ? { credits: u.credits } : {}),
    isAdmin: u.isAdmin,
    lastSeenAt: u.lastSeenAt,
    online: now - new Date(u.lastSeenAt).getTime() < ONLINE_MS,
    flowCount: u._count.flows,
    projectCount: u._count.projects,
  }));

  const stats = {
    projects: projects.length,
    flows: await prisma.flow.count({ where: { deletedAt: null } }),
    members: users.length,
    online: team.filter((t) => t.online).length,
    creditsSpent30d: Math.abs(spend._sum.amount ?? 0),
    creditsRemaining: users.reduce((s, u) => s + u.credits, 0),
  };

  // ⚠️ KHÔNG trả shareToken thô ra ngoài: đó là chìa của endpoint PUBLIC /api/share/[token].
  // Dashboard chỉ cần biết flow "có đang share hay không" (icon) → thay bằng boolean.
  const safeFlows = flows.map(({ shareToken, ...f }) => ({ ...f, shared: !!shareToken }));

  return NextResponse.json({ me: user.id, stats, team, projects, flows: safeFlows });
}
