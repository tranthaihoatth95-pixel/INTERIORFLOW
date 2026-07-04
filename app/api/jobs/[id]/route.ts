import { NextResponse } from 'next/server';
import { isAiTask } from '@/lib/ai/models';
import { isAiTier, resolveModel } from '@/lib/ai/tiers';
import { providerConfigured, jobStatus } from '@/lib/ai/providers';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const url = new URL(req.url);
  const task = url.searchParams.get('task') ?? '';
  const tierRaw = Number(url.searchParams.get('tier'));
  if (!isAiTask(task)) {
    return NextResponse.json({ error: 'Task không hợp lệ.' }, { status: 400 });
  }
  const tier = isAiTier(tierRaw) ? tierRaw : 4;

  let provider: ReturnType<typeof resolveModel>['provider'];
  let model: string;
  try {
    ({ provider, model } = resolveModel(task, tier));
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Task không hỗ trợ mức này.' }, { status: 400 });
  }
  if (!providerConfigured(provider)) {
    return NextResponse.json({ error: 'Provider chưa cấu hình.', code: 'PROVIDER_NOT_CONFIGURED' }, { status: 503 });
  }

  const status = await jobStatus(provider, model, params.id);
  return NextResponse.json(status);
}
