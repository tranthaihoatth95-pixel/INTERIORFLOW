/**
 * lib/auth/authorize-request.ts — đọc PHIÊN (cookie) + cấp quyền một lượt. Tách khỏi
 * authorize-db.ts vì `lib/server/auth` kéo next/headers (không chạy ngoài Next).
 * Phân biệt anonymous / stale / server-error thay vì gộp 401 (cùng tinh thần `getSession()`):
 * client nhận đúng lý do để hiện đúng màn.
 */
import { getSession } from '../server/auth';
import { DenialError, type Grant } from './authorize';
import { authorizeProject } from './authorize-db';

export async function authorizeRequest(projectId: string): Promise<Grant> {
  const s = await getSession();
  if (s.state === 'anonymous') throw new DenialError({ denied: true, reason: 'anonymous' });
  if (s.state === 'stale') throw new DenialError({ denied: true, reason: 'session-stale' });
  if (s.state === 'error') throw new DenialError({ denied: true, reason: 'server-unavailable' });
  return authorizeProject(s.user.id, projectId);
}
