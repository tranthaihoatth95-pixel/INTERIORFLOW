import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/server/auth';
import { getProvider } from '@/lib/integrations/registry';
import { listBitableRecords, type LarkBaseKind } from '@/lib/integrations/providers/lark';
import { mapLarkRecordsToColorSource, larkFieldNames, larkRecordsToGrid, type LarkColorRecord } from '@/lib/colors/larkbase';
import { guessColorMapping, type ColorColumnMapping } from '@/lib/colors/build';

export const dynamic = 'force-dynamic';

/**
 * POST /api/colors/lark — VIỆC 1b: nạp bảng màu từ Larkbase của studio. **PULL-ONLY tuyệt đối**
 * (`prisma/schema.prisma` §309-313): route này chỉ GỌI ĐỌC. Không có route ghi ngược tương ứng,
 * và `lark.ts` không có hàm ghi nào.
 *
 * Hai chế độ trong MỘT route (không tách 2 endpoint — cùng một lần đọc bảng, chỉ khác cách trả):
 *   • KHÔNG có `mapping`  → `preview`: trả TÊN CỘT THẬT + mapping IF tự đoán + 20 dòng mẫu.
 *   • CÓ `mapping`        → `pull`: trả `ColorSource` đã dựng + danh sách dòng lỗi.
 * Đây là hệ quả trực tiếp của ràng buộc "**Hoà không dùng được UI Larkbase**": người dùng nhập
 * `tableId` rồi làm nốt việc ghép cột NGAY TRONG IF, không phải mở Lark ra xem bảng có cột gì.
 *
 * `getSessionUser()` DÒNG ĐẦU TIÊN (bài học P0 lặp nhiều lần: `/api/comments` từng thiếu auth).
 * KHÔNG chặn ở `isAdmin` như `/api/lark-tasks/sync`: route đó GHI vào DB dùng chung của cả công
 * ty (sync full, đốt quota) — route này chỉ đọc một bảng do chính người dùng chỉ định và trả JSON
 * về máy họ, không đụng DB. Vẫn phải đăng nhập vì nó dùng tenant token của tổ chức.
 *
 * KHÔNG lưu gì xuống server: `ColorSource` trả thẳng cho client, client tự quyết cất vào tầng
 * studio (localStorage) hay tầng dự án (tệp `colors.json`) — xem `lib/colors/store.ts`.
 */
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const cfg = getProvider('lark');
  if (!cfg || !cfg.configured()) {
    return NextResponse.json(
      { error: 'Lark chưa cấu hình. Cần LARK_APP_ID / LARK_APP_SECRET — xem docs/INTEGRATIONS.md mục Lark.' },
      { status: 503 },
    );
  }

  let body: { tableId?: string; base?: string; mapping?: ColorColumnMapping; sourceName?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: 'Nội dung yêu cầu không đọc được.' }, { status: 400 });
  }

  const tableId = (body.tableId || '').trim();
  if (!tableId) {
    return NextResponse.json({ error: 'Thiếu mã bảng (table_id). Dán mã bảng Larkbase vào ô ở trên.' }, { status: 400 });
  }
  const base: LarkBaseKind = body.base === 'work' ? 'work' : 'atlas';

  let records: LarkColorRecord[];
  try {
    records = (await listBitableRecords(tableId, base)) as LarkColorRecord[];
  } catch (e) {
    // Lỗi Lark (sai id / thiếu quyền / thiếu env) đưa NGUYÊN VĂN ra UI — người dùng cần biết
    // sửa cái gì, và họ không mở được UI Lark để tự dò.
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 502 });
  }

  if (!records.length) {
    return NextResponse.json({ error: `Bảng "${tableId}" không có bản ghi nào.` }, { status: 404 });
  }

  if (!body.mapping) {
    const fieldNames = larkFieldNames(records);
    const grid = larkRecordsToGrid(records, fieldNames);
    return NextResponse.json({
      ok: true,
      mode: 'preview',
      fieldNames,
      guessed: guessColorMapping(fieldNames),
      sampleRows: grid.rows.slice(0, 20),
      recordCount: records.length,
    });
  }

  const built = mapLarkRecordsToColorSource(records, {
    id: `lark_${tableId}`, // ổn định theo bảng ⇒ kéo lại là CẬP NHẬT đúng nguồn cũ, không nhân bản
    name: (body.sourceName || '').trim() || `Larkbase ${tableId}`,
    mapping: body.mapping,
    scope: 'studio', // client đổi sang 'project' khi người dùng chọn lưu theo dự án
    licenseNote: 'Nạp từ Larkbase của studio (pull-only).',
  });

  return NextResponse.json({
    ok: true,
    mode: 'pull',
    source: built.source,
    errors: built.errors,
    recordCount: records.length,
  });
}
