import { NextResponse } from 'next/server';
import { getSessionUser, clearSession, publicUser } from '@/lib/server/auth';

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ user: null }, { status: 401 });
  return NextResponse.json({ user: publicUser(user) });
}

export async function DELETE() {
  clearSession();
  return NextResponse.json({ ok: true });
}
