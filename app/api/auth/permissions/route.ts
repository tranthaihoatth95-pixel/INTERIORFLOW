import { authorizeRequest } from '@/lib/auth/authorize-request';
import { listMemberSummaries } from '@/lib/auth/authorize-db';
import { requireCapability } from '@/lib/auth/authorize';
import { jsonNoStore, respondError } from '@/lib/auth/route-helpers';

export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/permissions?projectId=… — QUYỀN HIỆU DỤNG của người đang đăng nhập trên dự án
 * + danh sách thành viên kèm vai canonical và cờ `assignable` (nguồn cho picker giao việc).
 *
 * Trả lời TƯỜNG MINH: 401 {denied, reason:'anonymous'|'session-stale'} · 404 {denied,
 * reason:'not-member'} (không lộ dự án tồn tại) · 503 {denied, reason:'server-unavailable'}
 * (client giữ cache — xem lib/auth/permission-cache.ts). Không có "lỗi không rõ".
 * Không trả email/SĐT/credits của thành viên — chỉ id + tên + vai.
 */
export async function GET(req: Request) {
  const projectId = new URL(req.url).searchParams.get('projectId') ?? '';
  if (!projectId) return jsonNoStore({ error: 'thiếu projectId' }, 400);
  try {
    const grant = requireCapability(await authorizeRequest(projectId), 'project:read');
    const members = await listMemberSummaries(projectId, grant.currentStage);
    return jsonNoStore({ grant, members });
  } catch (e) {
    return respondError(e);
  }
}
