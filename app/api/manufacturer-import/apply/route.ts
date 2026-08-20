import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/server/auth';
import { assertProjectAccess } from '@/lib/server/access';
import { dungPhieuTuDuAn } from '../_lib/goi';
import { apDungPhieuDuyet, type QuyetDinhDuyet } from '@/lib/capabilities/manufacturer-import-apply';
import type { KhaiTay } from '@/lib/capabilities/manufacturer-import';

const HANH_DONG = new Set(['nhan', 'sua', 'giu-mot-phan', 'huy']);

/**
 * `POST /api/manufacturer-import/apply` — **CỬA GHI**, chỉ chạy sau khi người bấm một trong bốn
 * nút: **Nhận · Sửa · Giữ một phần · Huỷ**.
 *
 * Body `{projectId, projectFileIds[], khai?, quyetDinh}` →
 *   `{daGhi, specId, specDaCo, assetId, repIds, daNeoDanhTinh, canhBao}`
 *
 * 🔴 **Phiếu được DỰNG LẠI Ở MÁY CHỦ**, không nhận phiếu client gửi lên. Nhận phiếu client tức là
 * để người gọi tự khai kích thước/mã/xuất xứ — đúng thứ cửa duyệt sinh ra để chặn. Phần người
 * duyệt gõ lại đi qua `quyetDinh.sua`, và được ghi rõ trong `raw.nguoiGoLai`.
 *
 * `hanhDong: 'huy'` ⇒ 0 dòng ghi (vẫn 200 — huỷ không phải lỗi).
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
    const qd = (body.quyetDinh ?? {}) as QuyetDinhDuyet;
    if (!projectId) return NextResponse.json({ error: 'Thiếu projectId.' }, { status: 400 });
    if (!ids.length) return NextResponse.json({ error: 'Gói rỗng — chọn ít nhất một tệp.' }, { status: 400 });
    if (!qd || !HANH_DONG.has(qd.hanhDong)) {
      return NextResponse.json(
        { error: 'Thiếu quyết định của người duyệt (nhan · sua · giu-mot-phan · huy). Không có mặc định.' },
        { status: 400 },
      );
    }

    await assertProjectAccess(user.id, projectId, 'bim');

    const { phieu, tepKhongThay } = await dungPhieuTuDuAn({
      projectId,
      projectFileIds: ids,
      khai: (body.khai ?? undefined) as KhaiTay | undefined,
    });

    const kq = await apDungPhieuDuyet({ phieu, quyetDinh: qd, userId: user.id, projectId });
    if (!kq.ok) return NextResponse.json({ error: kq.error }, { status: kq.status });
    return NextResponse.json({ ...kq, tepKhongThay });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Lỗi không rõ';
    const status = /quyền|forbidden|access/i.test(msg) ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
