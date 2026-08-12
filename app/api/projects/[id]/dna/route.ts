import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/server/auth';
import { assertProjectAccess, accessErrorPayload } from '@/lib/server/access';
import { readDnaCards, upsertDnaCard, deleteDnaCard } from '@/lib/dna/store';
import { isDesignDnaCard, type DesignDnaCard } from '@/lib/dna/types';

export const dynamic = 'force-dynamic';

/**
 * app/api/projects/[id]/dna — Thẻ DNA Thiết kế của một dự án (phiếu `docs/phieu-giao/dna-card.md`
 * ④.3). Lưu JSON per-project qua `lib/dna/store.ts`, KHÔNG bảng DB mới.
 *
 * Quyền — khuôn `app/api/projects/[id]/profile/route.ts`: ĐỌC = thành viên (viewer+);
 * GHI/XOÁ = tối thiểu vai `crea` (chặng chủ trì Thẻ DNA theo `STAGE_OWNER.concept`,
 * `lib/server/access-policy.ts`) — owner luôn qua được vì rank cao nhất.
 *
 * GET    → { cards: DesignDnaCard[] }
 * PUT    → body { card: DesignDnaCard } — upsert theo `card.id`. Trả { cards } sau khi ghi.
 * DELETE → ?cardId=<id> — xoá 1 thẻ. Trả { cards } sau khi xoá.
 */

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const projectId = params.id;
  try {
    await assertProjectAccess(user.id, projectId, 'viewer');
    const cards = await readDnaCards(projectId);
    return NextResponse.json({ cards });
  } catch (e) {
    const p = accessErrorPayload(e);
    if (p) return NextResponse.json({ error: p.message }, { status: p.status });
    return NextResponse.json({ error: e instanceof Error ? e.message : 'lỗi không rõ' }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const projectId = params.id;
  const body = (await req.json().catch(() => ({}))) as { card?: unknown };
  const card = body.card as DesignDnaCard | undefined;
  if (!card || !isDesignDnaCard(card)) {
    return NextResponse.json({ error: 'card không hợp lệ — thiếu trường hoặc sai kiểu trangThai' }, { status: 400 });
  }
  if (card.projectId !== projectId) {
    return NextResponse.json({ error: 'card.projectId không khớp URL' }, { status: 400 });
  }
  try {
    await assertProjectAccess(user.id, projectId, 'crea');
    const cards = await upsertDnaCard(projectId, card);
    return NextResponse.json({ cards });
  } catch (e) {
    const p = accessErrorPayload(e);
    if (p) return NextResponse.json({ error: p.message }, { status: p.status });
    return NextResponse.json({ error: e instanceof Error ? e.message : 'lỗi không rõ' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const projectId = params.id;
  const cardId = new URL(req.url).searchParams.get('cardId');
  if (!cardId) return NextResponse.json({ error: 'thiếu ?cardId=' }, { status: 400 });
  try {
    await assertProjectAccess(user.id, projectId, 'crea');
    const cards = await deleteDnaCard(projectId, cardId);
    return NextResponse.json({ cards });
  } catch (e) {
    const p = accessErrorPayload(e);
    if (p) return NextResponse.json({ error: p.message }, { status: p.status });
    return NextResponse.json({ error: e instanceof Error ? e.message : 'lỗi không rõ' }, { status: 500 });
  }
}
