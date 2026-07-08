import { NextResponse } from 'next/server';
import { googleConfigured, appleConfigured } from '@/lib/server/oauth';

/**
 * Cho UI biết provider nào đã cấu hình env — nút social luôn HIỂN THỊ,
 * chưa cấu hình thì chuyển sang trạng thái "cần cấu hình" thay vì ẩn.
 * Chỉ trả boolean, không lộ key.
 */
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ google: googleConfigured(), apple: appleConfigured() });
}
