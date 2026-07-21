import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';
import { getSessionUser } from '@/lib/server/auth';
import { getProvider } from '@/lib/integrations/registry';
import { listTaskRecords, listHrRecords, textOf, numberOf, dateOf, boolOf, userAccountOf } from '@/lib/integrations/providers/lark';
import { normalizeProjectCode } from '@/lib/lark/task-utils';

export const dynamic = 'force-dynamic';

/**
 * POST /api/lark-tasks/sync — kéo mới nhất từ Larkbase ("Chi tiết công việc" + "Nhân sự"),
 * upsert theo larkRecordId (idempotent). PULL-ONLY tuyệt đối — không có route ghi ngược nào
 * tương ứng (docs/RESEARCH-HOME-GALLERY-DASHBOARD.md §2.4/§2.5, §5.1 quyết định 2).
 *
 * getSessionUser() bắt buộc DÒNG ĐẦU TIÊN — bài học P0 đã lặp lại nhiều lần trong dự án
 * (RESEARCH-ACCESS-CONTROL.md §4.1/§4.2: /api/comments từng thiếu auth).
 */
export async function POST() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const cfg = getProvider('lark');
  if (!cfg || !cfg.configured()) {
    return NextResponse.json(
      {
        error: 'Lark chưa cấu hình. Cần LARK_APP_ID / LARK_APP_SECRET / LARK_BASE_APP_TOKEN — xem docs/INTEGRATIONS.md mục Lark.',
        configured: false,
      },
      { status: 503 },
    );
  }

  try {
    const [taskRecords, hrRecords] = await Promise.all([listTaskRecords(), listHrRecords()]);

    let taskCount = 0;
    let skippedCodeCount = 0; // "Mã DA" phi-số (vd "Khác") — log để chủ dự án soát định kỳ (§3)
    for (const r of taskRecords) {
      const f = r.fields;
      const rawCode = textOf(f['Mã DA']);
      const code = normalizeProjectCode(rawCode);
      if (rawCode && !code) skippedCodeCount += 1;

      const data = {
        task: textOf(f['Công việc']),
        larkProjectName: textOf(f['Dự án']),
        larkProjectCode: code,
        ownerAccount: userAccountOf(f['Chủ trì']),
        status: textOf(f['Trạng thái']) || 'Đang làm',
        deadline: dateOf(f['Deadline']),
        daysLeft: numberOf(f['Số ngày còn lại']),
        warningLabel: textOf(f['Cảnh báo']) || null,
        raw: JSON.stringify(f),
        syncedAt: new Date(),
      };
      await prisma.larkTaskRef.upsert({
        where: { larkRecordId: r.record_id },
        update: data,
        create: { larkRecordId: r.record_id, ...data },
      });
      taskCount += 1;
    }

    let personCount = 0;
    for (const r of hrRecords) {
      const f = r.fields;
      const larkAccount = textOf(f['Tài khoản']);
      if (!larkAccount) continue; // primary key rỗng — bỏ qua, không tạo record vô danh
      const data = {
        fullName: textOf(f['Họ tên']),
        title: textOf(f['Chức danh']) || null,
        department: textOf(f['Phòng ban']) || null,
        isCrea: boolOf(f['Team Crea']),
        raw: JSON.stringify(f),
        syncedAt: new Date(),
      };
      await prisma.larkPersonRef.upsert({
        where: { larkRecordId: r.record_id },
        update: { larkAccount, ...data },
        create: { larkRecordId: r.record_id, larkAccount, ...data },
      });
      personCount += 1;
    }

    return NextResponse.json({
      ok: true,
      taskCount,
      personCount,
      skippedCodeCount,
      syncedAt: new Date().toISOString(),
    });
  } catch (e) {
    // Không bao giờ crash — trả lỗi rõ ràng (mất mạng/Lark đổi API/token sai...).
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Đồng bộ Larkbase thất bại.' },
      { status: 502 },
    );
  }
}
