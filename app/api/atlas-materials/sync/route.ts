import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';
import { getSessionUser } from '@/lib/server/auth';
import { atlasConfigured, listAtlasMaterialRecords } from '@/lib/integrations/providers/lark';
import { mapAtlasRecordToProductSpec } from '@/lib/lark/atlas-material-map';

export const dynamic = 'force-dynamic';

/**
 * POST /api/atlas-materials/sync — 2.1.9.r (30/07): kéo ATLAS Material Library, upsert vào
 * `ProductSpec{kind:'material'}` theo `larkRecordId` (idempotent). PULL-ONLY tuyệt đối — không
 * có route ghi ngược nào tương ứng, cùng nguyên tắc `/api/lark-tasks/sync`.
 *
 * getSessionUser() bắt buộc DÒNG ĐẦU TIÊN (bài học P0, xem route sync task/HR).
 *
 * ⚠️ CHƯA CHẠY THẬT LẦN NÀO — chặn ở `atlasConfigured()` (thiếu 3 khoá Lark) VÀ
 * `LARK_ATLAS_MATERIAL_TABLE_ID` (chưa có, chưa từng verify field thật qua MCP). Route này ĐÚNG
 * cấu trúc/logic (test qua `mapAtlasRecordToProductSpec`, 22/22) nhưng field mapping
 * (`ATLAS_FIELD_NAMES`, xem `lib/lark/atlas-material-map.ts`) là PLACEHOLDER — phải đối chiếu
 * tên cột thật trước khi tin số liệu sync ra.
 */
export async function POST() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  if (!atlasConfigured()) {
    return NextResponse.json(
      {
        error: 'ATLAS Material Library chưa cấu hình — cần LARK_APP_ID/LARK_APP_SECRET + LARK_ATLAS_NODE_TOKEN (hoặc LARK_ATLAS_APP_TOKEN) — xem docs/INTEGRATIONS.md.',
        configured: false,
      },
      { status: 503 },
    );
  }
  if (!process.env.LARK_ATLAS_MATERIAL_TABLE_ID) {
    return NextResponse.json(
      {
        error: 'Thiếu LARK_ATLAS_MATERIAL_TABLE_ID — chưa xác định được bảng vật liệu trong base ATLAS. Xem docs/INTEGRATIONS.md.',
        configured: false,
      },
      { status: 503 },
    );
  }

  try {
    const records = await listAtlasMaterialRecords();
    const syncedAt = new Date();

    let count = 0;
    let skippedNoName = 0;
    for (const r of records) {
      const data = mapAtlasRecordToProductSpec(r, syncedAt);
      if (!data.name) {
        skippedNoName += 1; // primary key rỗng — bỏ qua, không tạo record vô danh (cùng luật listHrRecords)
        continue;
      }
      await prisma.productSpec.upsert({
        where: { larkRecordId: data.larkRecordId },
        update: data,
        create: data,
      });
      count += 1;
    }

    return NextResponse.json({ ok: true, count, skippedNoName, syncedAt: syncedAt.toISOString() });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Đồng bộ ATLAS Material Library thất bại.' },
      { status: 502 },
    );
  }
}
