import { prisma } from '@/lib/server/db';
import { authorizeRequest } from '@/lib/auth/authorize-request';
import { requireCapability } from '@/lib/auth/authorize';
import { isInvitableStoredRole, STORED_ROLE_LABELS } from '@/lib/auth/roles';
import { createInviteToken, inviteSecret, clampInviteHours } from '@/lib/auth/invite';
import { mutateCollab, readCollab } from '@/lib/auth/collab-store';
import { jsonNoStore, readJson, respondError, str } from '@/lib/auth/route-helpers';

export const dynamic = 'force-dynamic';

/**
 * /api/share/invite — LỜI MỜI VÀO DỰ ÁN (link ký, thu hồi được). Xem lib/auth/invite.ts.
 *   POST   {projectId, role, hours?}  → tạo link  (năng lực invite:create — owner/admin)
 *   GET    ?projectId=                → sổ lời mời đã phát (invite:create)
 *   DELETE {projectId, jti}           → thu hồi     (invite:revoke)
 * Token KHÔNG lưu — chỉ lưu jti/role/người mời/hạn/thu hồi để kiểm lúc nhận + để hiện danh sách.
 * Link trỏ tới GET /api/share/invite/accept?token= (xem trước, KHÔNG tự vào dự án — nhận bằng POST).
 */
export async function POST(req: Request) {
  const body = await readJson(req);
  const projectId = str(body.projectId, 64);
  const role = body.role;
  if (!projectId || !isInvitableStoredRole(role)) {
    return jsonNoStore({ error: 'Cần projectId + role ∈ viewer|bim|drafter|crea.' }, 400);
  }
  try {
    const grant = requireCapability(await authorizeRequest(projectId), 'invite:create');
    const inviter = await prisma.user.findUnique({ where: { id: grant.userId }, select: { name: true } });
    const { key, insecure } = inviteSecret();
    const { token, payload } = await createInviteToken({ projectId, role, inviterId: grant.userId, hours: clampInviteHours(body.hours) }, key);
    await mutateCollab(projectId, (f) => {
      f.invites.unshift({
        jti: payload.jti,
        role,
        inviterId: grant.userId,
        inviterName: inviter?.name ?? '',
        createdAt: new Date(payload.iat * 1000).toISOString(),
        expiresAt: new Date(payload.exp * 1000).toISOString(),
      });
      if (f.invites.length > 200) f.invites.length = 200;
    });
    const origin = new URL(req.url).origin;
    return jsonNoStore({
      token,
      jti: payload.jti,
      role,
      roleLabel: STORED_ROLE_LABELS[role],
      expiresAt: new Date(payload.exp * 1000).toISOString(),
      url: `${origin}/api/share/invite/accept?token=${encodeURIComponent(token)}`,
      // thiếu AUTH_SECRET = môi trường tạm; nói thẳng thay vì im lặng phát link ký bằng secret dev
      insecure,
    });
  } catch (e) {
    return respondError(e);
  }
}

export async function GET(req: Request) {
  const projectId = new URL(req.url).searchParams.get('projectId') ?? '';
  if (!projectId) return jsonNoStore({ error: 'thiếu projectId' }, 400);
  try {
    requireCapability(await authorizeRequest(projectId), 'invite:create');
    const f = await readCollab(projectId);
    const now = Date.now();
    return jsonNoStore({
      invites: f.invites.map((i) => ({
        ...i,
        status: i.revokedAt ? 'revoked' : i.acceptedAt ? 'accepted' : Date.parse(i.expiresAt) < now ? 'expired' : 'active',
      })),
    });
  } catch (e) {
    return respondError(e);
  }
}

export async function DELETE(req: Request) {
  const body = await readJson(req);
  const projectId = str(body.projectId, 64);
  const jti = str(body.jti, 64);
  if (!projectId || !jti) return jsonNoStore({ error: 'Cần projectId + jti.' }, 400);
  try {
    const grant = requireCapability(await authorizeRequest(projectId), 'invite:revoke');
    const found = await mutateCollab(projectId, (f) => {
      const rec = f.invites.find((i) => i.jti === jti);
      if (!rec) return false;
      if (!rec.revokedAt) {
        rec.revokedAt = new Date().toISOString();
        rec.revokedBy = grant.userId;
      }
      return true;
    });
    if (!found) return jsonNoStore({ error: 'Không thấy lời mời.' }, 404);
    return jsonNoStore({ ok: true, jti });
  } catch (e) {
    return respondError(e);
  }
}
