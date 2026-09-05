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
  // Kho hỏng là lỗi PHÍA MÁY CHỦ (500) dù thông điệp cũng mang tiền tố [collab] — client gửi lại
  // y hệt vẫn hỏng, và 400 sẽ khiến hàng đợi client đánh dấu `denied` (bỏ hẳn) thay vì `failed`
  // (thử lại được). Kiểm tên lỗi TRƯỚC khi xét tiền tố chuỗi.
  if (e instanceof Error && e.name === 'CollabStoreCorruptError') {
    return NextResponse.json({ error: msg }, { status: 500, headers: { 'Cache-Control': 'no-store' } });
  }
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
