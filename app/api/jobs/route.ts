import { NextResponse } from 'next/server';
import { isAiTask } from '@/lib/ai/models';
import { isAiTier, resolveModel, TIERS } from '@/lib/ai/tiers';
import { providerConfigured, submitJob } from '@/lib/ai/providers';

export async function POST(req: Request) {
  let body: { task?: string; input?: Record<string, unknown>; tier?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Body không phải JSON.' }, { status: 400 });
  }

  const { task, input, tier } = body;
  if (!task || !isAiTask(task) || !input || typeof input !== 'object') {
    return NextResponse.json({ error: 'Thiếu task hợp lệ hoặc input.' }, { status: 400 });
  }
  if (!isAiTier(tier) || tier === 1) {
    return NextResponse.json({ error: 'Mức AI không hợp lệ (mức 1 không gọi AI).', code: 'TIER_NO_AI' }, { status: 400 });
  }

  let provider: ReturnType<typeof resolveModel>['provider'];
  let model: string;
  try {
    ({ provider, model } = resolveModel(task, tier));
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Task không hỗ trợ mức này.', code: 'TASK_UNSUPPORTED' }, { status: 400 });
  }

  if (!providerConfigured(provider)) {
    const hint =
      provider === 'comfyui'
        ? `Chưa nối máy render (COMFYUI_URL) cho mức "${TIERS[tier].name}" — xem comfyui/README.md.`
        : 'FAL_KEY chưa cấu hình — thêm vào .env.local để dùng AI cloud.';
    return NextResponse.json({ error: hint, code: 'PROVIDER_NOT_CONFIGURED' }, { status: 503 });
  }

  try {
    const jobId = await submitJob(provider, model, input);
    return NextResponse.json({ jobId, task, provider });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Submit job thất bại.' }, { status: 502 });
  }
}
