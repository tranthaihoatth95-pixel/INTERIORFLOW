import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/server/auth';
import { captionImage, nvidiaConfigured, NvidiaFreeExhausted } from '@/lib/ai/providers/nvidia';

// Auto-caption ảnh ref bằng NVIDIA VLM free. "Chỉ báo, không tự tụt": hết free → code riêng
// để UI hiện thông báo, KHÔNG tự chuyển sang provider khác.
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { image } = (await req.json().catch(() => ({}))) as { image?: string };
  if (!image) return NextResponse.json({ error: 'Thiếu image.' }, { status: 400 });
  if (!nvidiaConfigured()) {
    return NextResponse.json(
      { error: 'Chưa nối NVIDIA (NVIDIA_API_KEY). Tạo key free ở build.nvidia.com.', code: 'NVIDIA_NOT_CONFIGURED' },
      { status: 503 },
    );
  }
  try {
    const r = await captionImage(image);
    return NextResponse.json(r);
  } catch (err) {
    if (err instanceof NvidiaFreeExhausted) {
      return NextResponse.json(
        { error: 'NVIDIA free đã hết lượt — đổi nguồn thủ công (local / oneAI).', code: 'NVIDIA_FREE_EXHAUSTED' },
        { status: 429 },
      );
    }
    return NextResponse.json({ error: err instanceof Error ? err.message : 'NVIDIA lỗi.' }, { status: 502 });
  }
}
