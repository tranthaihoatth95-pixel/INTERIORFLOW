import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/server/auth';
import { decodeImageSource, ImageDecodeError } from '@/lib/vision/decode-server';
import {
  buildImageSpec,
  imageSpecPrompt,
  mergeVlmReading,
  parseVlmReading,
  pixelEvidence,
  specToReferenceSheet,
  specToText,
  type SpecAiInfo,
  type SpecField,
} from '@/lib/vision/image-spec';
import { readImageTiered, NoVisionProviderError, NvidiaFreeExhausted } from '@/lib/ai/vision-tier';

export const runtime = 'nodejs';

/**
 * POST /api/vision/analyze — IMAGE → SPEC (ImageSpec, marker ImageSpec).
 * body: { image: dataURI|URL, imageId?: string, ai?: boolean (mặc định true) }
 *
 * Hai tầng, tách bạch, không trộn:
 *   · ĐO PIXEL (tất định, 0 AI, luôn chạy): bảng màu · ánh sáng · dải màu · khung · phối cảnh/chân trời.
 *   · ĐỌC BẰNG VLM (theo tầng cloud → local, `lib/ai/vision-tier.ts`): loại phòng · phong cách ·
 *     trần/tường/sàn · vật liệu · đồ · chi tiết — mọi dòng 'inferred', chờ người duyệt.
 * VLM không chạy được → vẫn trả phần đo kèm `spec.ai = {tier:'none', reason}` (BÁO, không giả).
 * Trả: { spec, sheet (phiếu 4 cấp Grounded Render), text }.
 */
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as { image?: string; imageId?: string; ai?: boolean };
  if (!body.image || typeof body.image !== 'string') return NextResponse.json({ error: 'Thiếu image.' }, { status: 400 });
  const imageId = typeof body.imageId === 'string' && body.imageId.trim() ? body.imageId.trim().slice(0, 120) : 'anh';

  let fields: SpecField[];
  let width = 0;
  let height = 0;
  try {
    const img = await decodeImageSource(body.image);
    width = img.width;
    height = img.height;
    fields = pixelEvidence(img, imageId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Không đọc được ảnh.';
    return NextResponse.json({ error: msg }, { status: err instanceof ImageDecodeError ? 400 : 500 });
  }

  let ai: SpecAiInfo;
  if (body.ai === false) {
    ai = { tier: 'none', reason: 'Người dùng chọn chỉ đo pixel (không gọi AI).' };
  } else {
    try {
      const r = await readImageTiered(body.image, imageSpecPrompt());
      const parsed = parseVlmReading(r.text);
      if (parsed.reading) {
        fields = mergeVlmReading(fields, parsed.reading, { imageId, tier: r.tier, model: r.model });
        ai = { tier: r.tier, model: r.model };
      } else {
        ai = { tier: 'none', reason: `${parsed.error ?? 'Model không trả JSON.'} (tầng ${r.tier} · ${r.model})` };
      }
    } catch (err) {
      if (err instanceof NvidiaFreeExhausted) ai = { tier: 'none', reason: 'NVIDIA free đã hết lượt — đổi nguồn (Ollama vision / oneAI).' };
      else if (err instanceof NoVisionProviderError) ai = { tier: 'none', reason: err.message };
      else ai = { tier: 'none', reason: err instanceof Error ? err.message : 'Model thị giác lỗi.' };
    }
  }

  const spec = buildImageSpec({ imageId, width, height, fields, ai });
  return NextResponse.json({ spec, sheet: specToReferenceSheet(spec), text: specToText(spec) });
}
