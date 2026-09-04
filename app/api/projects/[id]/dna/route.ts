import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/server/auth';
import { assertProjectAccess, accessErrorPayload } from '@/lib/server/access';
import { readDnaCards, upsertDnaCard, deleteDnaCard, listDnaRevisions, restoreDnaRevision } from '@/lib/dna/store';
import { isDesignDnaCard, type DesignDnaCard } from '@/lib/dna/types';

export const dynamic = 'force-dynamic';

/**
 * app/api/projects/[id]/dna — Thẻ DNA Thiết kế của một dự án (phiếu `docs/phieu-giao/dna-card.md`
 * ④.3). Lưu JSON per-project qua `lib/dna/store.ts`, KHÔNG bảng DB mới.
 *
 * Quyền — khuôn `app/api/projects/[id]/profile/route.ts`: ĐỌC = thành viên (viewer+);
 * GHI/XOÁ/KHÔI PHỤC = tối thiểu vai `crea` (chặng chủ trì Thẻ DNA theo `STAGE_OWNER.concept`,
 * `lib/server/access-policy.ts`) — owner luôn qua được vì rank cao nhất.
 *
 * GET    → { cards: DesignDnaCard[] }
 * GET ?revisions=1 → { objectId, head, revisions: RevisionEntry[] } — sổ phiên bản (slice 5, 02/09);
 *          dự án chưa ghi thẻ nào ⇒ { objectId: null, head: null, revisions: [] }.
 * PUT    → body { card: DesignDnaCard } — upsert theo `card.id`. Trả { cards } sau khi ghi.
 * POST   → body { restoreRevisionId } — khôi phục bộ thẻ về phiên bản cũ (ghi entry MỚI, không
 *          cắt lịch sử). Trả { cards, revision }. 404 khi id lạ.
 * DELETE → ?cardId=<id> — xoá 1 thẻ. Trả { cards } sau khi xoá.
 *
 * Mọi lượt ghi mang `by = user.id` vào sổ phiên bản — provenance thật, không bịa.
 */

function loi(e: unknown) {
  const p = accessErrorPayload(e);
  if (p) return NextResponse.json({ error: p.message }, { status: p.status });
  return NextResponse.json({ error: e instanceof Error ? e.message : 'lỗi không rõ' }, { status: 500 });
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const projectId = params.id;
  const wantRevisions = new URL(req.url).searchParams.get('revisions') === '1';
  try {
    await assertProjectAccess(user.id, projectId, 'viewer');
    if (wantRevisions) {
      const ledger = await listDnaRevisions(projectId);
      return NextResponse.json({
        objectId: ledger?.objectId ?? null,
        head: ledger?.head ?? null,
        revisions: ledger?.entries ?? [],
      });
    }
    const cards = await readDnaCards(projectId);
    return NextResponse.json({ cards });
  } catch (e) {
    return loi(e);
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
    const cards = await upsertDnaCard(projectId, card, { by: user.id });
    return NextResponse.json({ cards });
  } catch (e) {
    return loi(e);
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const projectId = params.id;
  const body = (await req.json().catch(() => ({}))) as { restoreRevisionId?: unknown };
  const revisionId = typeof body.restoreRevisionId === 'string' ? body.restoreRevisionId.trim() : '';
  if (!revisionId) return NextResponse.json({ error: 'thiếu restoreRevisionId' }, { status: 400 });
  try {
    await assertProjectAccess(user.id, projectId, 'crea');
    const r = await restoreDnaRevision(projectId, revisionId, { by: user.id });
    if (!r) return NextResponse.json({ error: 'Không tìm thấy phiên bản.' }, { status: 404 });
    return NextResponse.json({ cards: r.cards, revision: r.revision });
  } catch (e) {
    return loi(e);
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
    const cards = await deleteDnaCard(projectId, cardId, { by: user.id });
    return NextResponse.json({ cards });
  } catch (e) {
    return loi(e);
  }
}
