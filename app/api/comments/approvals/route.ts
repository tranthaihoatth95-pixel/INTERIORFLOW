/**
 * app/api/comments/approvals/route.ts — HÀNG ĐỢI DUYỆT theo dự án (Cổng Duyệt nội bộ v0, chốt
 * 11/08 khuya: chủ trì/biên tập xin duyệt → người duyệt quyết → note gom thành checklist).
 * Lưu server (`lib/auth/collab-store.ts`) — xuyên thiết bị, KHÔNG localStorage. Idempotent `opId`.
 *
 *   GET    ?projectId=&status?                                  (comment:read — mọi thành viên)
 *   POST   {projectId, opId, title, stage?, entityId?, note?}   (approval:request — editor/owner/admin)
 *   PATCH  {projectId, opId, id, decision, note?}
 *            decision ∈ approved|changes|rejected  → approval:decide (reviewer/owner/admin)
 *            decision = withdrawn                  → chính người xin (hoặc members:manage)
 *   Người xin KHÔNG tự duyệt việc mình xin (kể cả owner) — ghi rõ, không ngoại lệ ngầm.
 */

import { prisma } from '@/lib/server/db';
import { authorizeRequest } from '@/lib/auth/authorize-request';
import { requireCapability, hasCapability, DenialError } from '@/lib/auth/authorize';
import { applyOp, isValidOpId, newId, readCollab, type ApprovalRequest, type ApprovalStatus } from '@/lib/auth/collab-store';
import { jsonNoStore, readJson, respondError, str } from '@/lib/auth/route-helpers';

export const dynamic = 'force-dynamic';

const STATUSES: ApprovalStatus[] = ['pending', 'approved', 'changes', 'rejected', 'withdrawn'];
const isStatus = (x: unknown): x is ApprovalStatus => typeof x === 'string' && (STATUSES as string[]).includes(x);

export async function GET(req: Request) {
  const url = new URL(req.url);
  const projectId = url.searchParams.get('projectId') ?? '';
  const status = url.searchParams.get('status');
  if (!projectId) return jsonNoStore({ error: 'thiếu projectId' }, 400);
  try {
    const grant = requireCapability(await authorizeRequest(projectId), 'comment:read');
    const f = await readCollab(projectId);
    const list = isStatus(status) ? f.approvals.filter((a) => a.status === status) : f.approvals;
    return jsonNoStore({
      approvals: list,
      rev: f.rev,
      canRequest: hasCapability(grant, 'approval:request'),
      canDecide: hasCapability(grant, 'approval:decide'),
      me: grant.userId,
    });
  } catch (e) {
    return respondError(e);
  }
}

export async function POST(req: Request) {
  const body = await readJson(req);
  const projectId = str(body.projectId, 64);
  const title = str(body.title, 300);
  const opId = body.opId;
  if (!projectId || !title) return jsonNoStore({ error: 'Cần projectId + title.' }, 400);
  if (!isValidOpId(opId)) return jsonNoStore({ error: 'Thiếu/sai opId.' }, 400);
  try {
    const grant = requireCapability(await authorizeRequest(projectId), 'approval:request');
    const me = await prisma.user.findUnique({ where: { id: grant.userId }, select: { name: true } });
    const now = new Date().toISOString();
    const out = await applyOp(projectId, opId, (f) => {
      const a: ApprovalRequest = {
        id: newId('ap'),
        projectId,
        title,
        stage: str(body.stage, 32) || undefined,
        entityId: str(body.entityId, 128) || undefined,
        note: str(body.note, 2000) || undefined,
        requesterId: grant.userId,
        requesterName: me?.name ?? '',
        status: 'pending',
        createdAt: now,
        updatedAt: now,
        opId,
      };
      f.approvals.unshift(a);
      return a;
    });
    return jsonNoStore({ ok: true, duplicate: out.duplicate, approval: out.result }, out.duplicate ? 200 : 201);
  } catch (e) {
    return respondError(e);
  }
}

export async function PATCH(req: Request) {
  const body = await readJson(req);
  const projectId = str(body.projectId, 64);
  const id = str(body.id, 128);
  const decision = body.decision;
  const opId = body.opId;
  if (!projectId || !id || !isStatus(decision) || decision === 'pending') {
    return jsonNoStore({ error: 'Cần projectId + id + decision ∈ approved|changes|rejected|withdrawn.' }, 400);
  }
  if (!isValidOpId(opId)) return jsonNoStore({ error: 'Thiếu/sai opId.' }, 400);
  try {
    const grant = requireCapability(await authorizeRequest(projectId), 'comment:read');
    const me = await prisma.user.findUnique({ where: { id: grant.userId }, select: { name: true } });
    const out = await applyOp(projectId, opId, (f) => {
      const a = f.approvals.find((x) => x.id === id);
      if (!a) return { missing: true as const };
      if (decision === 'withdrawn') {
        if (a.requesterId !== grant.userId && !hasCapability(grant, 'members:manage')) {
          throw new DenialError({ denied: true, reason: 'insufficient', capability: 'members:manage', role: grant.role });
        }
      } else {
        if (!hasCapability(grant, 'approval:decide')) {
          throw new DenialError({ denied: true, reason: 'insufficient', capability: 'approval:decide', role: grant.role });
        }
        if (a.requesterId === grant.userId) {
          // tự duyệt việc mình xin = không có người thứ hai — từ chối tường minh
          throw new DenialError({ denied: true, reason: 'insufficient', capability: 'approval:decide', role: grant.role });
        }
      }
      if (a.status !== 'pending') return { conflict: a };
      a.status = decision;
      a.decidedBy = grant.userId;
      a.decidedByName = me?.name ?? '';
      a.decidedAt = new Date().toISOString();
      a.decisionNote = str(body.note, 2000) || undefined;
      a.updatedAt = a.decidedAt;
      return { approval: a };
    });
    if ('missing' in out.result) return jsonNoStore({ error: 'Không thấy yêu cầu duyệt.' }, 404);
    if ('conflict' in out.result) return jsonNoStore({ error: 'Yêu cầu đã được quyết trước đó.', approval: out.result.conflict }, 409);
    return jsonNoStore({ ok: true, duplicate: out.duplicate, approval: out.result.approval });
  } catch (e) {
    return respondError(e);
  }
}
