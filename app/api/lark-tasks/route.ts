import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';
import { getSessionUser } from '@/lib/server/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/lark-tasks — đọc mirror ĐÃ SYNC (LarkTaskRef/LarkPersonRef/LarkUserMap), KHÔNG gọi
 * Lark API trực tiếp — an toàn dùng thường xuyên (panel "Chi tiết" mở lúc nào cũng được, kể cả
 * khi Lark không cấu hình/không reachable — chỉ là danh sách rỗng nếu chưa từng sync).
 *
 * Trả kèm `distinctCodes` cho dropdown "Liên kết Larkbase" khi tạo dự án mới (§2.4 báo cáo).
 */
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const [tasks, persons, userMap] = await Promise.all([
    prisma.larkTaskRef.findMany({ orderBy: { deadline: 'asc' } }),
    prisma.larkPersonRef.findMany({ orderBy: { fullName: 'asc' } }),
    prisma.larkUserMap.findMany(),
  ]);

  const codeMap = new Map<string, string>();
  for (const t of tasks) {
    if (t.larkProjectCode && !codeMap.has(t.larkProjectCode)) codeMap.set(t.larkProjectCode, t.larkProjectName);
  }
  const distinctCodes = [...codeMap.entries()].map(([code, name]) => ({ code, name }));

  return NextResponse.json({
    tasks: tasks.map((t) => ({
      id: t.id,
      larkRecordId: t.larkRecordId,
      task: t.task,
      larkProjectName: t.larkProjectName,
      larkProjectCode: t.larkProjectCode,
      ownerAccount: t.ownerAccount,
      status: t.status,
      deadline: t.deadline,
      daysLeft: t.daysLeft,
      warningLabel: t.warningLabel,
      syncedAt: t.syncedAt,
    })),
    persons: persons.map((p) => ({
      larkAccount: p.larkAccount,
      fullName: p.fullName,
      title: p.title,
      department: p.department,
      isCrea: p.isCrea,
    })),
    userMap: userMap.map((m) => ({ larkAccount: m.larkAccount, userId: m.userId })),
    distinctCodes,
    lastSyncedAt: tasks.reduce<string | null>((acc, t) => {
      const iso = t.syncedAt.toISOString();
      return !acc || iso > acc ? iso : acc;
    }, null),
  });
}
