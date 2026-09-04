import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/server/auth';
import { prisma } from '@/lib/server/db';
import { authorizeProject } from '@/lib/auth/authorize-db';
import { DenialError } from '@/lib/auth/authorize';

/**
 * Ephemeral live-cursor / presence endpoint (Canva-style collab).
 *
 * State is a plain in-memory Map at MODULE scope — NO database, NO AI.
 * ⚠️ Này reset mỗi lần server restart / redeploy. Presence chỉ mang tính
 * tức thời nên mất hết khi restart là CHẤP NHẬN ĐƯỢC (không cần bền vững).
 * Hợp LAN/SQLite: không đụng DB cho cursor — CHỈ tra DB để kiểm quyền vào flow.
 *
 * SLICE 6 (02/09) — KIỂM QUYỀN TRƯỚC KHI TRẢ TÊN NGƯỜI: trước đây bất kỳ ai đăng nhập gửi
 * `?flowId=` đoán mò là thấy TÊN + toạ độ của mọi người đang ở flow đó (metadata nhạy cảm,
 * xuyên ranh giới dự án). Nay: phải là CHỦ flow hoặc THÀNH VIÊN dự án chứa flow — không thì 404
 * (không lộ flow tồn tại). Flow nháp cá nhân (projectId null) chỉ chủ flow vào được.
 */

interface CursorEntry {
  userId: string;
  name: string;
  color: string;
  x: number;
  y: number;
  flowId: string;
  ts: number;
}

// Sống theo vòng đời process. Key = userId.
const cursors = new Map<string, CursorEntry>();

/** Quá hạn này (ms) coi như đã rời đi → prune. */
const STALE_MS = 6000;

function prune(now: number) {
  for (const [id, c] of cursors) {
    if (now - c.ts > STALE_MS) cursors.delete(id);
  }
}

type FlowGate = { ok: true } | { ok: false; status: 404 | 403; reason: 'not-member' | 'insufficient' };

/** Chủ flow hoặc thành viên dự án chứa flow. Flow xoá mềm/không có → not-member (404). */
async function gateFlow(userId: string, flowId: string): Promise<FlowGate> {
  const flow = await prisma.flow.findUnique({ where: { id: flowId, deletedAt: null }, select: { userId: true, projectId: true } });
  if (!flow) return { ok: false, status: 404, reason: 'not-member' };
  if (flow.userId === userId) return { ok: true };
  if (!flow.projectId) return { ok: false, status: 404, reason: 'not-member' };
  try {
    await authorizeProject(userId, flow.projectId);
    return { ok: true };
  } catch (e) {
    if (e instanceof DenialError) return { ok: false, status: e.status === 403 ? 403 : 404, reason: e.status === 403 ? 'insufficient' : 'not-member' };
    throw e;
  }
}

/**
 * POST — upsert cursor + presence của người gọi.
 * ⚠️ Danh tính (userId + name) lấy từ SESSION, KHÔNG tin client — chặn giả danh presence.
 */
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ ok: false, denied: true, reason: 'anonymous', error: 'unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ ok: false, error: 'empty body' }, { status: 400 });
  }
  const { color, x, y, flowId } = body as Partial<CursorEntry>;
  if (!flowId || typeof flowId !== 'string') {
    return NextResponse.json({ ok: false, error: 'missing flowId' }, { status: 400 });
  }
  const gate = await gateFlow(user.id, flowId);
  if (!gate.ok) return NextResponse.json({ ok: false, denied: true, reason: gate.reason }, { status: gate.status });

  const now = Date.now();
  cursors.set(user.id, {
    userId: user.id,
    name: user.name,
    color: String(color ?? '#8b7cf7'), // màu chỉ là cosmetic — nhận từ client được
    x: Number.isFinite(x) ? Number(x) : 0,
    y: Number.isFinite(y) ? Number(y) : 0,
    flowId,
    ts: now,
  });
  prune(now);
  return NextResponse.json({ ok: true });
}

/**
 * GET ?flowId=… — trả mọi cursor còn "tươi" (ts < STALE_MS) cùng flowId,
 * LOẠI người gọi (theo SESSION — tham số ?me cũ bị bỏ qua, không tin client).
 */
export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ cursors: [], denied: true, reason: 'anonymous', error: 'unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const flowId = url.searchParams.get('flowId');
  const now = Date.now();
  prune(now);

  if (!flowId) return NextResponse.json({ cursors: [] });
  const gate = await gateFlow(user.id, flowId);
  if (!gate.ok) return NextResponse.json({ cursors: [], denied: true, reason: gate.reason }, { status: gate.status });

  const list: CursorEntry[] = [];
  for (const c of cursors.values()) {
    if (c.flowId !== flowId) continue;
    if (c.userId === user.id) continue;
    if (now - c.ts > STALE_MS) continue;
    list.push(c);
  }
  return NextResponse.json({ cursors: list });
}
