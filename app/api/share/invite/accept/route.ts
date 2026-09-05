import { prisma } from '@/lib/server/db';
import { getSession } from '@/lib/server/auth';
import { loadGrantFacts } from '@/lib/auth/authorize-db';
import { DenialError, decideGrant, hasCapability } from '@/lib/auth/authorize';
import { STORED_ROLE_LABELS } from '@/lib/auth/roles';
import { inviteSecret, verifyInviteToken, type InvitePayload } from '@/lib/auth/invite';
import { mutateCollab, readCollab, isInviteRevoked } from '@/lib/auth/collab-store';
import { jsonNoStore, readJson, respondError, str } from '@/lib/auth/route-helpers';

export const dynamic = 'force-dynamic';

type Rejection = 'invalid' | 'expired' | 'wrong-type' | 'bad-role' | 'revoked' | 'inviter-lost-rights' | 'project-gone';

const REJECT_LABEL: Record<Rejection, { vi: string; en: string }> = {
  invalid: { vi: 'Link mời không hợp lệ.', en: 'This invite link is not valid.' },
  expired: { vi: 'Link mời đã hết hạn.', en: 'This invite link has expired.' },
  'wrong-type': { vi: 'Đây không phải link mời.', en: 'This is not an invite link.' },
  'bad-role': { vi: 'Link mời mang vai không được phép.', en: 'This invite carries a disallowed role.' },
  revoked: { vi: 'Link mời đã bị thu hồi.', en: 'This invite has been revoked.' },
  'inviter-lost-rights': { vi: 'Người mời không còn quyền mời trong dự án này.', en: 'The inviter no longer has invite rights in this project.' },
  'project-gone': { vi: 'Dự án không còn tồn tại.', en: 'The project no longer exists.' },
};

function reject(reason: Rejection, status = 410) {
  return jsonNoStore({ denied: true, reason, message: REJECT_LABEL[reason] }, status);
}

/**
 * Kiểm đủ BA LỚP thu hồi (lib/auth/invite.ts): chữ ký+hạn · jti thu hồi · người mời còn quyền.
 * Dự án xoá mềm → project-gone. Trả payload + tên dự án/người mời để xem trước.
 */
async function resolveInvite(token: string): Promise<
  | { ok: true; payload: InvitePayload; projectName: string; inviterName: string }
  | { ok: false; reason: Rejection; status: number }
> {
  const v = await verifyInviteToken(token, inviteSecret().key);
  if (!v.ok) return { ok: false, reason: v.reason, status: v.reason === 'expired' ? 410 : 400 };
  const { payload } = v;
  const project = await prisma.project.findUnique({ where: { id: payload.projectId }, select: { name: true, deletedAt: true } });
  if (!project || project.deletedAt) return { ok: false, reason: 'project-gone', status: 410 };
  const file = await readCollab(payload.projectId);
  if (isInviteRevoked(file, payload.jti)) return { ok: false, reason: 'revoked', status: 410 };
  // lớp ③: người mời PHẢI CÒN năng lực mời — gỡ người mời là link của họ chết theo
  let inviterOk = false;
  try {
    inviterOk = hasCapability(decideGrant(await loadGrantFacts(payload.inviterId, payload.projectId)), 'invite:create');
  } catch (e) {
    if (!(e instanceof DenialError)) throw e;
  }
  if (!inviterOk) return { ok: false, reason: 'inviter-lost-rights', status: 410 };
  const inviter = await prisma.user.findUnique({ where: { id: payload.inviterId }, select: { name: true } });
  return { ok: true, payload, projectName: project.name, inviterName: inviter?.name ?? '' };
}

/**
 * GET ?token= — XEM TRƯỚC lời mời (tên dự án · vai · người mời · hạn). KHÔNG ghi gì —
 * link bấm từ mail/chat không được tự đưa người vào dự án (CSRF qua GET). Cần đăng nhập.
 */
export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get('token') ?? '';
  if (!token) return jsonNoStore({ error: 'thiếu token' }, 400);
  const s = await getSession();
  if (s.state !== 'authenticated') {
    return jsonNoStore({ denied: true, reason: s.state === 'stale' ? 'session-stale' : s.state === 'error' ? 'server-unavailable' : 'anonymous', hint: 'Đăng nhập rồi dán link vào "Vào dự án bằng link mời".' }, s.state === 'error' ? 503 : 401);
  }
  try {
    const r = await resolveInvite(token);
    if (!r.ok) return reject(r.reason, r.status);
    const facts = await loadGrantFacts(s.user.id, r.payload.projectId);
    return jsonNoStore({
      preview: {
        projectId: r.payload.projectId,
        projectName: r.projectName,
        role: r.payload.role,
        roleLabel: STORED_ROLE_LABELS[r.payload.role],
        inviterName: r.inviterName,
        expiresAt: new Date(r.payload.exp * 1000).toISOString(),
        alreadyMember: !!facts.memberRole,
      },
      acceptWith: 'POST /api/share/invite/accept {token}',
    });
  } catch (e) {
    return respondError(e);
  }
}

/**
 * POST {token} — NHẬN lời mời: thêm/hồi sinh ProjectMember với vai LƯU trong token.
 * Idempotent: đã là thành viên → 200 {alreadyMember:true}, KHÔNG hạ vai đang có.
 */
export async function POST(req: Request) {
  const body = await readJson(req);
  const token = str(body.token, 4096);
  if (!token) return jsonNoStore({ error: 'thiếu token' }, 400);
  const s = await getSession();
  if (s.state !== 'authenticated') {
    return jsonNoStore({ denied: true, reason: s.state === 'stale' ? 'session-stale' : s.state === 'error' ? 'server-unavailable' : 'anonymous' }, s.state === 'error' ? 503 : 401);
  }
  try {
    const r = await resolveInvite(token);
    if (!r.ok) return reject(r.reason, r.status);
    const { payload } = r;
    const existed = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: payload.projectId, userId: s.user.id } },
      select: { id: true, role: true, deletedAt: true },
    });
    if (existed && !existed.deletedAt) {
      return jsonNoStore({ ok: true, alreadyMember: true, projectId: payload.projectId, role: existed.role });
    }
    if (existed) {
      // hàng đã gỡ mềm → hồi sinh (deletedAt KHÔNG nằm trong @@unique — cùng cách members route làm)
      await prisma.projectMember.update({
        where: { id: existed.id },
        data: { role: payload.role, deletedAt: null, joinedAt: new Date(), rev: { increment: 1 }, lastEditedBy: payload.inviterId },
      });
    } else {
      await prisma.projectMember.create({
        data: { projectId: payload.projectId, userId: s.user.id, role: payload.role, lastEditedBy: payload.inviterId },
      });
    }
    await mutateCollab(payload.projectId, (f) => {
      const rec = f.invites.find((i) => i.jti === payload.jti);
      if (rec && !rec.acceptedAt) {
        rec.acceptedAt = new Date().toISOString();
        rec.acceptedBy = s.user.id;
      }
    });
    return jsonNoStore({ ok: true, alreadyMember: false, projectId: payload.projectId, role: payload.role, projectName: r.projectName });
  } catch (e) {
    return respondError(e);
  }
}
