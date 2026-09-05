import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';

/**
 * Public — khách xem flow read-only qua share token, không cần đăng nhập.
 * Từ chối TƯỜNG MINH (slice 6): `{denied:true, reason:'not-found'}` — link đã tắt/thu hồi
 * (`action:'unshare'` ở /api/flows/[id] đặt shareToken=null) hay chưa từng có đều cùng câu,
 * không phân biệt để không dò được token. Không cache: thu hồi phải có hiệu lực ngay lượt sau.
 */
export async function GET(_: Request, { params }: { params: { token: string } }) {
  const headers = { 'Cache-Control': 'no-store' };
  if (!/^[a-f0-9]{24}$/.test(params.token)) {
    return NextResponse.json({ denied: true, reason: 'not-found', error: 'Link không tồn tại hoặc đã tắt.' }, { status: 404, headers });
  }
  // deletedAt: null — flow đã xoá mềm KHÔNG được xem qua link công khai nữa.
  const flow = await prisma.flow.findUnique({
    where: { shareToken: params.token, deletedAt: null },
    select: { name: true, graphJson: true, version: true, updatedAt: true, user: { select: { name: true } } },
  });
  if (!flow) {
    return NextResponse.json({ denied: true, reason: 'not-found', error: 'Link không tồn tại hoặc đã tắt.' }, { status: 404, headers });
  }
  return NextResponse.json(
    { name: flow.name, graphJson: flow.graphJson, version: flow.version, updatedAt: flow.updatedAt, owner: flow.user.name },
    { headers },
  );
}
