import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';
import { getSessionUser } from '@/lib/server/auth';
import { SPEC_KINDS, specNormalize, specToDto } from '@/lib/server/specs';

/**
 * app/api/specs — Hệ Legend X1 (docs/PROPOSAL-LEGEND-SYSTEM.md §2): CRUD ProductSpec, bảng spec
 * sản phẩm/vật liệu THỐNG NHẤT cho legend/schedule cả 3 chặng. Q-L2 đã chốt GỘP MaterialRef vào
 * đây (kind='material'). Dùng chung cả team như LibraryAsset — GET trả tất cả.
 */

/** GET /api/specs?kind=furniture&drawingBlock=sofa-3 — lọc optional. */
export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const url = new URL(req.url);
  const kind = url.searchParams.get('kind');
  const drawingBlock = url.searchParams.get('drawingBlock');
  const specs = await prisma.productSpec.findMany({
    where: {
      ...(kind && (SPEC_KINDS as readonly string[]).includes(kind) ? { kind } : {}),
      ...(drawingBlock ? { drawingBlock } : {}),
    },
    orderBy: [{ kind: 'asc' }, { name: 'asc' }],
  });
  return NextResponse.json({ specs: specs.map(specToDto) });
}

/** POST /api/specs — tạo 1 spec. Body: { kind, name, ...field optional }. */
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Body JSON không hợp lệ.' }, { status: 400 });
  }
  const { kind, name } = body as Record<string, unknown>;
  if (typeof kind !== 'string' || !(SPEC_KINDS as readonly string[]).includes(kind)) {
    return NextResponse.json({ error: `kind phải là 1 trong: ${SPEC_KINDS.join(', ')}.` }, { status: 400 });
  }
  if (typeof name !== 'string' || !name.trim()) {
    return NextResponse.json({ error: 'Thiếu name.' }, { status: 400 });
  }
  const spec = await prisma.productSpec.create({
    data: specNormalize(body as Record<string, unknown>, kind, name.trim()),
  });
  return NextResponse.json({ spec: specToDto(spec) }, { status: 201 });
}
