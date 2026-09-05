/**
 * app/api/comments/route.ts — GÓP Ý. HAI CHẾ ĐỘ, phân biệt bằng `projectId`:
 *
 * ① CÓ `projectId` (slice 6, 02/09) — GÓP Ý GHIM THEO DỰ ÁN, xuyên thiết bị: lưu server
 *    (`lib/auth/collab-store.ts`, KHÔNG localStorage), kiểm quyền qua `lib/auth` TRƯỚC khi trả
 *    byte nào, idempotent theo `opId`.
 *      GET    ?projectId=&approvalId?      (comment:read)
 *      POST   {projectId, opId, text, anchor?}   (comment:write — editor/reviewer/admin/owner)
 *      PATCH  {projectId, opId, id, resolved}    (tác giả, hoặc comment:resolve)
 *      DELETE ?projectId=&id=&opId=              (tác giả, hoặc members:manage)
 *    Viewer đọc được, KHÔNG viết được — đúng ma trận năng lực, không phải nhãn.
 *
 * ② KHÔNG `projectId` — đường CŨ "góp ý giao diện cho Claude đọc" (`components/CommentLayer.tsx`,
 *    bật bằng NEXT_PUBLIC_COMMENT_LAYER=1): tệp `comments-review.json` ở gốc repo, chỉ user đã
 *    đăng nhập, xoá-tất-cả chỉ admin. GIỮ NGUYÊN hợp đồng — CommentLayer nằm ngoài phạm vi phiếu.
 */

import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { getSessionUser } from '@/lib/server/auth';
import { luuAnhGopY } from '@/lib/server/comment-artifact';
import { prisma } from '@/lib/server/db';
import { authorizeRequest } from '@/lib/auth/authorize-request';
import { requireCapability, hasCapability, DenialError } from '@/lib/auth/authorize';
import { applyOp, isValidOpId, newId, readCollab, type CommentAnchor, type ProjectComment } from '@/lib/auth/collab-store';
import { jsonNoStore, readJson, respondError, str } from '@/lib/auth/route-helpers';

export const dynamic = 'force-dynamic';

/* ═════════════════════════ ① GÓP Ý THEO DỰ ÁN ═════════════════════════ */

function parseAnchor(a: unknown): CommentAnchor {
  if (!a || typeof a !== 'object') return {};
  const o = a as Record<string, unknown>;
  const out: CommentAnchor = {};
  if (typeof o.route === 'string') out.route = o.route.slice(0, 200);
  if (typeof o.stage === 'string') out.stage = o.stage.slice(0, 32);
  if (typeof o.entityId === 'string') out.entityId = o.entityId.slice(0, 128);
  if (typeof o.approvalId === 'string') out.approvalId = o.approvalId.slice(0, 128);
  if (Number.isFinite(o.x)) out.x = Number(o.x);
  if (Number.isFinite(o.y)) out.y = Number(o.y);
  if (Number.isFinite(o.slide)) out.slide = Number(o.slide);
  return out;
}

async function projectGet(projectId: string, approvalId: string | null) {
  try {
    requireCapability(await authorizeRequest(projectId), 'comment:read');
    const f = await readCollab(projectId);
    const list = approvalId ? f.comments.filter((c) => c.anchor.approvalId === approvalId) : f.comments;
    return jsonNoStore({ comments: list, rev: f.rev });
  } catch (e) {
    return respondError(e);
  }
}

async function projectPost(body: Record<string, unknown>, projectId: string) {
  const text = str(body.text, 4000);
  const opId = body.opId;
  if (!text) return jsonNoStore({ error: 'Trống' }, 400);
  if (!isValidOpId(opId)) return jsonNoStore({ error: 'Thiếu/sai opId (client sinh, 8..128 ký tự).' }, 400);
  try {
    const grant = requireCapability(await authorizeRequest(projectId), 'comment:write');
    const me = await prisma.user.findUnique({ where: { id: grant.userId }, select: { name: true } });
    const now = new Date().toISOString();
    const out = await applyOp(projectId, opId, (f) => {
      const c: ProjectComment = {
        id: newId('c'),
        projectId,
        authorId: grant.userId,
        authorName: me?.name ?? '',
        text,
        anchor: parseAnchor(body.anchor),
        resolved: false,
        createdAt: now,
        updatedAt: now,
        opId,
      };
      f.comments.push(c);
      return c;
    });
    return jsonNoStore({ ok: true, duplicate: out.duplicate, comment: out.result }, out.duplicate ? 200 : 201);
  } catch (e) {
    return respondError(e);
  }
}

async function projectPatch(body: Record<string, unknown>, projectId: string) {
  const id = str(body.id, 128);
  const opId = body.opId;
  if (!id || typeof body.resolved !== 'boolean') return jsonNoStore({ error: 'Cần id + resolved:boolean.' }, 400);
  if (!isValidOpId(opId)) return jsonNoStore({ error: 'Thiếu/sai opId.' }, 400);
  try {
    const grant = requireCapability(await authorizeRequest(projectId), 'comment:read');
    const resolved = body.resolved as boolean;
    const out = await applyOp(projectId, opId, (f) => {
      const c = f.comments.find((x) => x.id === id);
      if (!c) return { missing: true as const };
      // tác giả đóng/mở góp ý của mình; người khác cần comment:resolve
      if (c.authorId !== grant.userId && !hasCapability(grant, 'comment:resolve')) {
        throw new DenialError({ denied: true, reason: 'insufficient', capability: 'comment:resolve', role: grant.role });
      }
      c.resolved = resolved;
      c.resolvedBy = resolved ? grant.userId : undefined;
      c.resolvedAt = resolved ? new Date().toISOString() : undefined;
      c.updatedAt = new Date().toISOString();
      return { comment: c };
    });
    if ('missing' in out.result) return jsonNoStore({ error: 'Không thấy' }, 404);
    return jsonNoStore({ ok: true, duplicate: out.duplicate, comment: out.result.comment });
  } catch (e) {
    return respondError(e);
  }
}

async function projectDelete(projectId: string, id: string, opId: string | null) {
  if (!id) return jsonNoStore({ error: 'Thiếu id' }, 400);
  if (!isValidOpId(opId)) return jsonNoStore({ error: 'Thiếu/sai opId.' }, 400);
  try {
    const grant = requireCapability(await authorizeRequest(projectId), 'comment:read');
    const out = await applyOp(projectId, opId, (f) => {
      const c = f.comments.find((x) => x.id === id);
      if (!c) return { removed: false };
      if (c.authorId !== grant.userId && !hasCapability(grant, 'members:manage')) {
        throw new DenialError({ denied: true, reason: 'insufficient', capability: 'members:manage', role: grant.role });
      }
      f.comments = f.comments.filter((x) => x.id !== id);
      return { removed: true };
    });
    return jsonNoStore({ ok: true, duplicate: out.duplicate, removed: out.result.removed });
  } catch (e) {
    return respondError(e);
  }
}

/* ═════════════════════════ ② ĐƯỜNG CŨ (CommentLayer) ═════════════════════════ */

const FILE = path.join(process.cwd(), 'comments-review.json');

interface LegacyComment {
  id: string;
  text: string;
  x: number;
  y: number;
  route: string;
  stage?: string;
  elementHint?: string;
  /**
   * URL hiển thị lại ảnh đính kèm. MỚI: `/api/comments/image/<id>` — route CÓ XÁC THỰC.
   * CŨ (di sản, còn trong các bản ghi đã lưu): `/comments-images/<id>.<ext>` — file tĩnh public.
   * Cả hai vẫn hiển thị được; đường cũ KHÔNG bị viết lại, KHÔNG bị xoá.
   */
  image?: string;
  /** sha256 bytes ảnh lúc ghi — đối chiếu về sau. Bản ghi cũ không có, đó là bình thường. */
  imageSha256?: string;
  imageBytes?: number;
  resolved?: boolean; // true = đã xử lý (thiếu field = chưa xử lý, tương thích comment cũ)
  ts: number;
}

async function readAll(): Promise<LegacyComment[]> {
  try {
    return JSON.parse(await fs.readFile(FILE, 'utf8')) as LegacyComment[];
  } catch {
    return [];
  }
}
async function writeAll(list: LegacyComment[]): Promise<void> {
  await fs.writeFile(FILE, JSON.stringify(list, null, 2), 'utf8');
}

/* ═════════════════════════ HANDLERS ═════════════════════════ */

export async function GET(req: Request) {
  const url = new URL(req.url);
  const projectId = url.searchParams.get('projectId');
  if (projectId) return projectGet(projectId, url.searchParams.get('approvalId'));
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  return NextResponse.json({ comments: await readAll() });
}

export async function POST(req: Request) {
  const body = await readJson(req);
  const projectId = str(body.projectId, 64);
  if (projectId) return projectPost(body, projectId);
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const text = String(body.text ?? '').trim();
  if (!text) return NextResponse.json({ error: 'Trống' }, { status: 400 });
  const list = await readAll();
  const id = `c_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  let image: string | undefined;
  let imageSha256: string | undefined;
  let imageBytes: number | undefined;
  if (typeof body.image === 'string' && body.image.startsWith('data:image/')) {
    try {
      // Kiểm magic bytes + ghi vào thư mục RIÊNG (xem `lib/server/comment-artifact.ts`).
      const anh = await luuAnhGopY(id, body.image);
      if (anh) {
        image = anh.url;
        imageSha256 = anh.sha256;
        imageBytes = anh.bytes;
      }
    } catch {
      /* ảnh lỗi — vẫn lưu góp ý */
    }
  }
  const c: LegacyComment = {
    id,
    text,
    x: Number(body.x ?? 50),
    y: Number(body.y ?? 50),
    route: String(body.route ?? '/'),
    stage: body.stage ? String(body.stage) : undefined,
    elementHint: body.elementHint ? String(body.elementHint).slice(0, 160) : undefined,
    image,
    imageSha256,
    imageBytes,
    ts: Date.now(),
  };
  list.push(c);
  await writeAll(list);
  return NextResponse.json({ ok: true, comment: c, count: list.length });
}

export async function PATCH(req: Request) {
  const body = await readJson(req);
  const projectId = str(body.projectId, 64);
  if (projectId) return projectPatch(body, projectId);
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const id = String(body.id ?? '');
  if (!id) return NextResponse.json({ error: 'Thiếu id' }, { status: 400 });
  const list = await readAll();
  const c = list.find((x) => x.id === id);
  if (!c) return NextResponse.json({ error: 'Không thấy' }, { status: 404 });
  if (typeof body.resolved === 'boolean') c.resolved = body.resolved;
  await writeAll(list);
  return NextResponse.json({ ok: true, comment: c });
}

export async function DELETE(req: Request) {
  const url = new URL(req.url);
  const projectId = url.searchParams.get('projectId');
  if (projectId) return projectDelete(projectId, url.searchParams.get('id') ?? '', url.searchParams.get('opId'));
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (url.searchParams.get('all')) {
    if (!user.isAdmin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    await writeAll([]);
    return NextResponse.json({ ok: true, count: 0 });
  }
  const id = url.searchParams.get('id');
  const list = (await readAll()).filter((c) => c.id !== id);
  await writeAll(list);
  return NextResponse.json({ ok: true, count: list.length });
}
