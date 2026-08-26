/**
 * app/api/projects/[id]/site/tinh-lai — TÍNH LẠI phần đã CŨ (§6, bước cuối của dây).
 *
 * Người dùng bấm "Tính lại" ⇒ gỡ dấu cũ ở ĐÚNG những miền được nêu, rồi tín hiệu Vitals tự tắt
 * (vì Vitals đọc thẳng `daCu`, không giữ trạng thái riêng).
 * ⚠️ Gỡ CÓ CHỌN LỌC: `mien: ['nang']` KHÔNG được dọn luôn dấu cũ của văn hoá/vật liệu.
 * Quyền: sửa trạng thái sự thật dự án ⇒ đòi `owner`, cùng cấp với PATCH hồ sơ.
 */
import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/server/auth';
import { assertProjectAccess, accessErrorPayload } from '@/lib/server/access';
import { docHoSo, ghiHoSo } from '@/lib/site/store';
import { tinhLaiThat } from '@/lib/site/dan-xuat';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  try {
    await assertProjectAccess(user.id, params.id, 'owner');
    const body = (await req.json().catch(() => null)) as { mien?: string[] } | null;
    const mien = Array.isArray(body?.mien) ? body!.mien! : [];
    if (!mien.length) return NextResponse.json({ error: 'thiếu danh sách miền cần tính lại' }, { status: 400 });
    const cu = await docHoSo(params.id);
    // 🔴 SỬA 22/08 — `tinhLai()` cũ CHỈ XOÁ DẤU, không tính lại gì: nút "Tính lại" là nút TẮT
    // CẢNH BÁO. Trạng thái nói "đã tươi" mà không phép tính nào chạy = cùng họ với bịa phần trăm.
    // `tinhLaiThat` suy lại sự thật + kết luận cho ĐÚNG miền được yêu cầu RỒI mới gỡ dấu.
    return NextResponse.json({ hoSo: await ghiHoSo(params.id, tinhLaiThat(cu, mien, new Date())) });
  } catch (e) {
    const p = accessErrorPayload(e);
    if (p) return NextResponse.json({ error: p.message }, { status: p.status });
    return NextResponse.json({ error: e instanceof Error ? e.message : 'lỗi không rõ' }, { status: 500 });
  }
}
