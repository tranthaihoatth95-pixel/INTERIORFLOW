import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/server/auth';
import { readHomeNotes, appendHomeNote, deleteHomeNote } from '@/lib/home/notes-store';

export const dynamic = 'force-dynamic';

/** GET /api/home/notes — ghi chú nhanh của CHÍNH user đang đăng nhập (Trang 2, việc ④.8). */
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const notes = await readHomeNotes(user.id);
  return NextResponse.json({ notes });
}

/** POST /api/home/notes — thêm 1 ghi chú (2 giây, không form: chỉ text + projectId tuỳ chọn). */
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const text = typeof body.text === 'string' ? body.text.trim() : '';
  if (!text) return NextResponse.json({ error: 'thiếu text' }, { status: 400 });
  const projectId = typeof body.projectId === 'string' && body.projectId ? body.projectId : null;
  const notes = await appendHomeNote(user.id, { text: text.slice(0, 500), projectId });
  return NextResponse.json({ notes });
}

/** DELETE /api/home/notes?id=... — xoá 1 ghi chú. */
export async function DELETE(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'thiếu id' }, { status: 400 });
  const notes = await deleteHomeNote(user.id, id);
  return NextResponse.json({ notes });
}
