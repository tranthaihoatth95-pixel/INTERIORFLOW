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
 * ⚠️ ĐÃ THỬ CHẠY THẬT LẦN ĐẦU (04/08) — VẪN CHƯA VÀO ĐƯỢC DB, chặn ở bước SỚM HƠN dự kiến:
 * `getAtlasAppToken()` → `resolveWikiAppToken(LARK_ATLAS_NODE_TOKEN)` gọi
 * `GET /open-apis/wiki/v2/spaces/get_node` — Lark trả **code 131006**
 * `"permission denied: node permission denied, tenant needs read permission."` (tenant_access_token
 * đổi THÀNH CÔNG, lỗi xảy ra Ở BƯỚC SAU — không phải thiếu khoá/env). Nguyên nhân đúng như
 * `docs/INTEGRATIONS.md` §ATLAS bước 4 đã cảnh báo trước: app Lark (`App ID cli_aae1f2a68178de15`)
 * CHƯA được mời làm collaborator có quyền đọc trên trang Wiki chứa ATLAS Material Library (hoặc
 * app chưa publish/enable trong tổ chức) — cần Hoà vào Lark, mở đúng trang Wiki đó → *** (góc
 * phải) → Advanced permissions/Share → thêm app theo App ID trên. Vì lỗi xảy ra trước khi gọi
 * `list_records`, **field mapping `ATLAS_FIELD_NAMES` (`lib/lark/atlas-material-map.ts`) VẪN
 * CHƯA verify được** — chưa có bản ghi thật nào để đối chiếu tên cột.
 * (Lưu ý phụ: `LARK_ATLAS_BASE_TOKEN` trong `.env.local` là placeholder văn bản `"bascn..."`
 * — KHÔNG phải token thật, và code không đọc biến này ở đâu cả; biến thật sự dùng là
 * `LARK_ATLAS_NODE_TOKEN`, đã có và đúng định dạng.)
 */
export async function POST() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  // 05/08 (`docs/AUDIT-BACKEND-2026-08-03.md` §2.4) — như `/api/lark-tasks/sync`: sync là thao
  // tác VẬN HÀNH trên kho vật liệu dùng chung (ghi đè ProductSpec toàn công ty) + đốt quota
  // Lark, nên đòi admin. Cùng cửa `User.isAdmin`, không bịa cơ chế thứ hai.
  if (!user.isAdmin) {
    return NextResponse.json({ error: 'Chỉ admin được chạy đồng bộ ATLAS.' }, { status: 403 });
  }

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
