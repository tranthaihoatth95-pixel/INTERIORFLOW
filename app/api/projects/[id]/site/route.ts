/**
 * app/api/projects/[id]/site — NGỮ CẢNH DỰ ÁN (Site Profile).
 *
 * SCOPE 'project': mọi thứ neo vào `[id]` trên URL, KHÔNG suy từ state toàn cục.
 * GET   → hồ sơ (rỗng hợp lệ khi chưa khai — `chua-ro` là sự thật, không phải lỗi).
 * PATCH → sửa vị trí/hướng; trả kèm DANH SÁCH SỰ THẬT ĐÃ CŨ để nơi gọi hỏi người dùng
 *         (§32: KHÔNG tự tính lại, KHÔNG tự xoá — người quyết).
 *
 * §34 QUYỀN: đọc chỉ cần `viewer`; **sửa TOẠ ĐỘ/HƯỚNG đòi `owner`** — đó là sự thật gốc của dự
 * án, mọi phân tích phía sau treo vào nó, nên không để mọi thành viên đổi lặng lẽ.
 * [Đ2] Dùng lại `assertProjectAccess`/`accessErrorPayload` sẵn có, không tự chế lớp quyền.
 */
import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/server/auth';
import { assertProjectAccess, accessErrorPayload } from '@/lib/server/access';
import { docHoSo, ghiHoSo } from '@/lib/site/store';
import { soHoSo, caiGiCu } from '@/lib/site/anh-huong';
import { suyLanDau } from '@/lib/site/dan-xuat';
import type { HoSoDiaDiem } from '@/lib/site/types';

function loi(e: unknown) {
  const p = accessErrorPayload(e);
  if (p) return NextResponse.json({ error: p.message }, { status: p.status });
  return NextResponse.json({ error: e instanceof Error ? e.message : 'lỗi không rõ' }, { status: 500 });
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  try {
    await assertProjectAccess(user.id, params.id, 'viewer');
    return NextResponse.json(await docHoSo(params.id));
  } catch (e) {
    return loi(e);
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  try {
    await assertProjectAccess(user.id, params.id, 'owner');
    const body = (await req.json().catch(() => null)) as Partial<HoSoDiaDiem> | null;
    if (!body) return NextResponse.json({ error: 'bad-request' }, { status: 400 });

    const cu = await docHoSo(params.id);
    const moi: HoSoDiaDiem = {
      ...cu,
      viTri: body.viTri ? { ...cu.viTri, ...body.viTri } : cu.viTri,
      huong: body.huong ? { ...cu.huong, ...body.huong } : cu.huong,
      // Sự thật/kết luận do bước suy dẫn ghi vào — gộp chứ không thay, để một lượt PATCH chỉ đổi
      // hướng không xoá mất kho đã tích.
      suThat: body.suThat ? { ...cu.suThat, ...body.suThat } : cu.suThat,
      ketLuan: body.ketLuan ?? cu.ketLuan,
    };

    // Tính ẢNH HƯỞNG TRƯỚC khi ghi — ghi xong thì không còn gì để so.
    const thayDoi = soHoSo(cu, moi);
    const moiCu = caiGiCu(cu, thayDoi);
    // GỘP với dấu cũ đang có: đổi hướng hai lần liên tiếp mà chưa tính lại thì lần sau KHÔNG
    // được xoá dấu của lần trước. Dấu chỉ mất khi người dùng thật sự cho tính lại.
    const daCu = [...new Set([...(cu.daCu ?? []), ...moiCu])];
    // Đổi hướng/toạ độ ⇒ mọi KẾT LUẬN suy từ miền bị ảnh hưởng cũng cũ theo. Nhưng ĐỀ XUẤT và
    // quyết định của người thì GIỮ NGUYÊN (§32: không xoá lịch sử, không quét sạch cho an toàn).
    // 🔴 SỬA 22/08 — CHỖ ĐỨT ĐẦU TIÊN CỦA CHUỖI SITE. Trước nay PATCH chỉ ghi toạ độ/hướng, nên
    // `hoSo.suThat` RỖNG VĨNH VIỄN ⇒ `caiGiCu()` không có gì để đánh dấu ⇒ `daCu` luôn rỗng ⇒
    // Vitals không bao giờ có tín hiệu (máy suy `lib/site/suy-luan.ts` đủ, mà 0 nơi gọi).
    // `suyLanDau` CHỈ điền vào chỗ trống — hồ sơ đã có sự thật thì nó không đụng, nên §32
    // ("không tự tính lại") vẫn giữ: đổi hướng lần sau chỉ ĐÁNH DẤU CŨ, người bấm mới tính lại.
    const daSuy = suyLanDau({ ...moi, daCu }, new Date());
    return NextResponse.json({ hoSo: await ghiHoSo(params.id, daSuy), thayDoi, daCu });
  } catch (e) {
    return loi(e);
  }
}
