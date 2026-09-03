/**
 * lib/auth/route-helpers.ts — vỏ chung cho route của slice cộng tác (server): đổi lỗi quyền
 * thành JSON `{denied, reason, …}` đúng status; lỗi khác → 500 không lộ stack.
 */
import { NextResponse } from 'next/server';
import { denialPayload } from './authorize';

export function respondError(e: unknown): NextResponse {
  const d = denialPayload(e);
  if (d) return NextResponse.json(d.body, { status: d.status, headers: { 'Cache-Control': 'no-store' } });
  const msg = e instanceof Error ? e.message : 'lỗi không rõ';
  // Lỗi đầu vào từ tầng service (tiền tố [collab]/[Task]) là 400, không phải 500.
  const status = /^\[(collab|Task)\]/.test(msg) ? 400 : 500;
  return NextResponse.json({ error: msg }, { status, headers: { 'Cache-Control': 'no-store' } });
}

export function jsonNoStore(body: unknown, status = 200): NextResponse {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

export async function readJson(req: Request): Promise<Record<string, unknown>> {
  const b = await req.json().catch(() => null);
  return b && typeof b === 'object' && !Array.isArray(b) ? (b as Record<string, unknown>) : {};
}

export const str = (v: unknown, max = 2000): string => (typeof v === 'string' ? v.trim().slice(0, max) : '');
