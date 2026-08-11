import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/server/auth';
import { assertProjectAccess, accessErrorPayload } from '@/lib/server/access';
import { getProjectProfile, upsertProjectProfile, type ProjectProfileInput } from '@/lib/server/project-profile';

export const dynamic = 'force-dynamic';

/**
 * app/api/projects/[id]/profile — Hồ Sơ Dự Án 60s (SPEC-KHOI-TAO-DU-AN-2026-08-11 mảnh PLAN).
 * Quyền theo spec ①: thành viên (viewer trở lên) ĐỌC · owner dự án / admin studio GHI
 * (assertProjectAccess đã coi User.isAdmin = owner — không đẻ hệ quyền mới).
 */

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const id = params.id;
  try {
    await assertProjectAccess(user.id, id, 'viewer');
    const profile = await getProjectProfile(id);
    return NextResponse.json({ profile }); // profile: null = dự án chưa khai — hợp lệ (X2)
  } catch (e) {
    const p = accessErrorPayload(e);
    if (p) return NextResponse.json({ error: p.message }, { status: p.status });
    return NextResponse.json({ error: e instanceof Error ? e.message : 'lỗi không rõ' }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const id = params.id;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  // Chỉ nhặt đúng 6 field hợp đồng — field lạ bỏ qua, kiểu sai để tầng lib ném lỗi rõ (400).
  const patch: ProjectProfileInput = {};
  for (const key of ['loaiHinh', 'nganSach', 'hienTrang', 'ghiChu', 'mocBanGiao'] as const) {
    if (key in body) {
      const v = body[key];
      if (v === null || typeof v === 'string') patch[key] = v as string | null;
      else return NextResponse.json({ error: `${key} phải là chuỗi hoặc null` }, { status: 400 });
    }
  }
  if ('dienTichM2' in body) {
    const v = body.dienTichM2;
    if (v === null || typeof v === 'number') patch.dienTichM2 = v as number | null;
    else return NextResponse.json({ error: 'dienTichM2 phải là số hoặc null' }, { status: 400 });
  }

  try {
    await assertProjectAccess(user.id, id, 'owner');
    const profile = await upsertProjectProfile(id, patch);
    return NextResponse.json({ profile });
  } catch (e) {
    const p = accessErrorPayload(e);
    if (p) return NextResponse.json({ error: p.message }, { status: p.status });
    // Lỗi kiểm đầu vào từ lib ([ProjectProfile] ...) là lỗi người gửi — 400, không phải 500.
    if (e instanceof Error && e.message.startsWith('[ProjectProfile]')) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    return NextResponse.json({ error: e instanceof Error ? e.message : 'lỗi không rõ' }, { status: 500 });
  }
}
