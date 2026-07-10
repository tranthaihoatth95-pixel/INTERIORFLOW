import { NextResponse } from 'next/server';
import { falConfigured, submitJob, jobStatus } from '@/lib/ai/providers/fal';
import { getPremiumModel, isPremiumModel } from '@/lib/ai/premium-models';
import { getSessionUser } from '@/lib/server/auth';

// Render 1 ảnh bằng model "xịn" (whitelist). Đồng bộ hoá cho node Compare: fal thật nếu có
// balance, không thì trả placeholder có nhãn model (demo/mock vẫn chạy). Server-only.
function placeholder(name: string, tint: string): string {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="768" height="512" viewBox="0 0 768 512">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">` +
    `<stop offset="0" stop-color="${tint}" stop-opacity=".55"/><stop offset="1" stop-color="#151109"/></linearGradient></defs>` +
    `<rect width="768" height="512" fill="url(#g)"/>` +
    `<rect x="90" y="150" width="220" height="230" rx="4" fill="#ffffff" opacity=".12"/>` +
    `<rect x="430" y="300" width="250" height="14" rx="7" fill="#ffffff" opacity=".2"/>` +
    `<text x="40" y="60" font-family="system-ui" font-size="26" fill="#F2ECDF">${name}</text>` +
    `<text x="40" y="90" font-family="system-ui" font-size="15" fill="#F2ECDF" opacity=".6">mock — nạp fal balance để render thật</text>` +
    `</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { modelKey, prompt, image } = (await req.json().catch(() => ({}))) as {
    modelKey?: string; prompt?: string; image?: string;
  };
  if (!isPremiumModel(modelKey)) return NextResponse.json({ error: 'Model không hợp lệ.' }, { status: 400 });
  const m = getPremiumModel(modelKey)!;

  // fal chưa cấu hình HOẶC render lỗi (vd hết balance) → placeholder có nhãn, demo vẫn chạy.
  const mock = () => NextResponse.json({ imageUrl: placeholder(m.name, m.tint), mock: true });
  if (!falConfigured()) return mock();
  try {
    const input: Record<string, unknown> = { prompt: String(prompt ?? '') };
    if (image) input.image_url = image;
    const jobId = await submitJob(m.fal, input);
    const started = Date.now();
    for (;;) {
      if (Date.now() - started > 120_000) return mock();
      await new Promise((r) => setTimeout(r, 1500));
      const st = await jobStatus(m.fal, jobId);
      if (st.status === 'COMPLETED') return NextResponse.json({ imageUrl: st.imageUrls[0] });
      if (st.status === 'FAILED') return mock(); // hết balance / provider lỗi → mock có nhãn
    }
  } catch {
    return mock();
  }
}
