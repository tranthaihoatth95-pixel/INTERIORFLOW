import { NextResponse } from 'next/server';
import {
  generateImage,
  nvidiaConfigured,
  nvidiaImageModel,
  NvidiaFreeExhausted,
} from '@/lib/ai/providers/nvidia';
import { getSessionUser } from '@/lib/server/auth';

/**
 * Tầng AI của node text2image (bộ node render v2): NVIDIA NIM image-gen
 * (stabilityai/stable-diffusion-3-medium — xem lib/ai/providers/nvidia.ts).
 *
 * Degrade tường minh: chưa có NVIDIA_API_KEY → 503 code 'NVIDIA_NOT_CONFIGURED'
 * để node rơi xuống TẦNG LÕI TẤT ĐỊNH và ghi rõ tầng đã chạy — không mock im lặng.
 */
export async function POST(req: Request) {
  // Chặn người vô danh (đốt lượt free NVIDIA) — cùng luật với /api/jobs.
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as {
    prompt?: string;
    negative?: string;
    ratio?: string;
    seed?: number;
  };
  const prompt = String(body.prompt ?? '').trim();
  if (!prompt) return NextResponse.json({ error: 'Thiếu prompt.' }, { status: 400 });

  if (!nvidiaConfigured()) {
    return NextResponse.json(
      {
        error: 'Chưa nối NVIDIA (NVIDIA_API_KEY). Tạo key free ở build.nvidia.com — node sẽ chạy tầng lõi tất định.',
        code: 'NVIDIA_NOT_CONFIGURED',
      },
      { status: 503 },
    );
  }

  try {
    const r = await generateImage({
      prompt,
      negativePrompt: body.negative,
      ratio: body.ratio,
      seed: typeof body.seed === 'number' ? body.seed : 0,
    });
    return NextResponse.json({ image: r.dataUri, model: r.model, engine: 'nvidia' });
  } catch (err) {
    if (err instanceof NvidiaFreeExhausted) {
      return NextResponse.json(
        { error: 'NVIDIA free đã hết lượt / rate-limit — thử lại sau hoặc dùng tầng lõi.', code: 'NVIDIA_FREE_EXHAUSTED' },
        { status: 429 },
      );
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : `NVIDIA (${nvidiaImageModel()}) lỗi.` },
      { status: 502 },
    );
  }
}
