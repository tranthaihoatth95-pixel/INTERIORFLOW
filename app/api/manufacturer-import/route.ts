import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/server/auth';
import { assertProjectAccess } from '@/lib/server/access';
import { dungPhieuTuDuAn } from './_lib/goi';
import type { KhaiTay } from '@/lib/capabilities/manufacturer-import';

/**
 * `POST /api/manufacturer-import` — **CỬA DỰNG PHIẾU**, đường B (gói tệp người dùng đã có sẵn).
 *
 * Body `{projectId, projectFileIds[], khai?}` → `{phieu, tepKhongThay}`.
 *
 * 🔴 **KHÔNG GHI MỘT DÒNG NÀO.** Route này chỉ TRÌNH RA phiếu ứng viên để người duyệt xem:
 * NGUỒN · DANH TÍNH · CÁC CÁCH THỂ HIỆN · KÍCH THƯỚC · VẬT LIỆU · XUẤT XỨ · CẢNH BÁO.
 * Việc ghi nằm ở `POST /api/manufacturer-import/apply`, và chỉ chạy khi có quyết định của người.
 * Hai cửa tách hẳn để KHÔNG THỂ có promote im lặng.
 *
 * ⛔ Không nhận URL: đường A (tải từ trang hãng) đụng điều kiện truy cập của từng hãng — việc
 * pháp lý, không phải việc code. Không cào, không vượt đăng nhập/tường phí.
 *
 * Vai `'bim'` (nấc ghi thấp nhất): phiếu này đọc nội dung tệp dự án.
 */
export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const projectId = typeof body.projectId === 'string' ? body.projectId : '';
    const ids: string[] = Array.isArray(body.projectFileIds)
      ? body.projectFileIds.filter((x: unknown): x is string => typeof x === 'string')
      : [];
    if (!projectId) return NextResponse.json({ error: 'Thiếu projectId.' }, { status: 400 });
    if (!ids.length) return NextResponse.json({ error: 'Gói rỗng — chọn ít nhất một tệp.' }, { status: 400 });
    if (ids.length > 20) return NextResponse.json({ error: 'Một gói tối đa 20 tệp.' }, { status: 400 });

    await assertProjectAccess(user.id, projectId, 'bim');

    const kq = await dungPhieuTuDuAn({
      projectId,
      projectFileIds: ids,
      khai: (body.khai ?? undefined) as KhaiTay | undefined,
    });
    return NextResponse.json(kq);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Lỗi không rõ';
    const status = /quyền|forbidden|access/i.test(msg) ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
