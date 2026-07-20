import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/server/auth';

/**
 * Ephemeral live-cursor / presence endpoint (Canva-style collab).
 *
 * State is a plain in-memory Map at MODULE scope — NO database, NO AI.
 * ⚠️ Này reset mỗi lần server restart / redeploy. Presence chỉ mang tính
 * tức thời nên mất hết khi restart là CHẤP NHẬN ĐƯỢC (không cần bền vững).
 * Hợp LAN/SQLite: không đụng DB, chỉ giữ RAM.
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

/**
 * POST — upsert cursor + presence của người gọi.
 * ⚠️ Danh tính (userId + name) lấy từ SESSION, KHÔNG tin client — chặn giả danh presence.
 */
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ ok: false, error: 'empty body' }, { status: 400 });
  }
  const { color, x, y, flowId } = body as Partial<CursorEntry>;
  if (!flowId) {
    return NextResponse.json({ ok: false, error: 'missing flowId' }, { status: 400 });
  }
  const now = Date.now();
  cursors.set(user.id, {
    userId: user.id,
    name: user.name,
    color: String(color ?? '#8b7cf7'), // màu chỉ là cosmetic — nhận từ client được
    x: Number.isFinite(x) ? Number(x) : 0,
    y: Number.isFinite(y) ? Number(y) : 0,
    flowId: String(flowId),
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
  if (!user) return NextResponse.json({ cursors: [], error: 'unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const flowId = url.searchParams.get('flowId');
  const now = Date.now();
  prune(now);

  if (!flowId) return NextResponse.json({ cursors: [] });

  const list: CursorEntry[] = [];
  for (const c of cursors.values()) {
    if (c.flowId !== flowId) continue;
    if (c.userId === user.id) continue;
    if (now - c.ts > STALE_MS) continue;
    list.push(c);
  }
  return NextResponse.json({ cursors: list });
}
