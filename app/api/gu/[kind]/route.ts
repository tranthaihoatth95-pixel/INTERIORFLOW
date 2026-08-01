/**
 * GET/PUT /api/gu/:kind — bộ học "Gu" (lib/gu/pairwise-perceptron.ts) theo user, Prisma LÀ
 * NGUỒN (Đợt C, docs/QUYET-DINH-HA-TANG-2026-07-31.md §③ phương án C). localStorage vẫn tồn
 * tại làm CACHE cục bộ (đọc nhanh, hoạt động offline) — xem lib/gu/gu-model-sync.ts.
 *
 * kind: whitelist cứng — mỗi điểm cắm Gu Engine học riêng, không trộn (xem comment GuModel
 * trong prisma/schema.prisma). Thêm điểm cắm mới thì thêm vào whitelist này.
 *
 * GET  → 404 nếu user chưa có bản ghi cho kind này (client tự hiểu = "chưa học gì", KHÔNG
 *        coi 404 là lỗi — xem gu-model-sync.ts).
 * PUT  → upsert (userId, kind) — body { weightsJson: string, pairCount: number }.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';
import { getSessionUser } from '@/lib/server/auth';
import { isGuKind } from '@/lib/gu/gu-model-sync';

export async function GET(_: Request, { params }: { params: { kind: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!isGuKind(params.kind)) return NextResponse.json({ error: 'kind không hợp lệ.' }, { status: 400 });

  const row = await prisma.guModel.findUnique({
    where: { userId_kind: { userId: user.id, kind: params.kind } },
  });
  if (!row) return NextResponse.json({ error: 'Chưa có model.' }, { status: 404 });
  return NextResponse.json({
    weightsJson: row.weightsJson,
    pairCount: row.pairCount,
    updatedAt: row.updatedAt,
  });
}

export async function PUT(req: Request, { params }: { params: { kind: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!isGuKind(params.kind)) return NextResponse.json({ error: 'kind không hợp lệ.' }, { status: 400 });

  const body = await req.json().catch(() => null);
  const weightsJson = body && typeof body.weightsJson === 'string' ? body.weightsJson : null;
  const pairCount = body && Number.isFinite(body.pairCount) ? Math.max(0, Math.floor(body.pairCount)) : 0;
  if (!weightsJson) return NextResponse.json({ error: 'Thiếu weightsJson.' }, { status: 400 });

  const row = await prisma.guModel.upsert({
    where: { userId_kind: { userId: user.id, kind: params.kind } },
    create: { userId: user.id, kind: params.kind, weightsJson, pairCount },
    update: { weightsJson, pairCount },
  });
  return NextResponse.json({ weightsJson: row.weightsJson, pairCount: row.pairCount, updatedAt: row.updatedAt });
}
