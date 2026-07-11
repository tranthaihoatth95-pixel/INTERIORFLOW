/**
 * ai.batchvariants — render 2–4 biến thể phong cách SONG SONG từ cùng 1 ảnh (styleTransfer)
 * hoặc chỉ prompt (moodboard/text2img) — duyệt nhanh nhiều hướng trước khi chốt, thay vì
 * chạy từng node style riêng lẻ. Seam defs/: tự quản lý tier/mock, KHÔNG đụng registry.ts
 * (aiImage/aiImages ở đó là hàm private) — logic tier/mock ở đây cố tình mirror registry.ts
 * cho nhất quán hành vi (mock khi provider chưa sẵn sàng, khoá hẳn ở mức "Không AI").
 */
import type { NodeDefinition, ExecContext, PortValue } from '@/lib/types';
import { runImageJob, checkProviders, AiJobError } from '@/lib/ai/client';
import { providerForTier } from '@/lib/ai/tiers';
import type { AiTask } from '@/lib/ai/models';

const STYLE_OPTIONS = ['Scandinavian', 'Japandi', 'Indochine', 'Modern Luxury', 'Wabi-sabi', 'Industrial'];
const COUNT_OPTIONS = ['2', '3', '4'];

/** Placeholder gradient có nhãn style — dùng khi mock (giống tinh thần placeholderRender ở registry.ts). */
function placeholder(label: string, seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const hue = h % 360;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="384" viewBox="0 0 512 384">
<rect width="512" height="384" fill="hsl(${hue},28%,70%)"/>
<rect y="260" width="512" height="124" fill="hsl(${(hue + 30) % 360},20%,32%)"/>
<text x="256" y="200" text-anchor="middle" font-family="system-ui" font-size="20" fill="rgba(0,0,0,0.55)">${label} · mock</text>
</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function mockVariant(style: string, seed: string, ctx: ExecContext, weight: number, offset: number): Promise<string> {
  for (let i = 1; i <= 6; i++) {
    await delay(120);
    ctx.onProgress(offset + (i / 6) * weight);
  }
  return placeholder(style, seed);
}

async function renderVariant(
  style: string,
  prompt: string,
  image: string | undefined,
  ctx: ExecContext,
  weight: number,
  offset: number,
): Promise<string> {
  const provider = providerForTier(ctx.aiTier, ctx.oneAiEngine);
  if (!provider) return mockVariant(style, `${prompt}#${style}`, ctx, weight, offset);

  const status = await checkProviders();
  const ready = provider === 'fal' ? status.fal : provider === 'comfyui' ? status.comfyui : status.sd;
  if (!ready) return mockVariant(style, `${prompt}#${style}`, ctx, weight, offset);

  const task: AiTask = image ? 'styleTransfer' : 'moodboard';
  const input: Record<string, unknown> = image
    ? { prompt, image_url: image, strength: 0.65, num_images: 1 }
    : { prompt, num_images: 1 };

  try {
    const urls = await runImageJob(task, input, (p) => ctx.onProgress(offset + p * weight), ctx.aiTier, ctx.oneAiEngine);
    return urls[0];
  } catch (err) {
    if (err instanceof AiJobError && err.code === 'PROVIDER_NOT_CONFIGURED') {
      return mockVariant(style, `${prompt}#${style}`, ctx, weight, offset);
    }
    throw err;
  }
}

export const batchVariantNodes: NodeDefinition[] = [
  {
    type: 'ai.batchvariants',
    title: 'Batch Variants',
    category: 'AI_GENERATE',
    description: 'Render 2–4 biến thể phong cách song song từ cùng 1 ảnh/prompt — duyệt nhanh trước khi chốt hướng.',
    inputs: [
      { id: 'image', label: 'Ảnh gốc (tuỳ chọn)', dataType: 'image' },
      { id: 'prompt', label: 'Prompt', dataType: 'text' },
    ],
    outputs: [
      { id: 'image1', label: 'Biến thể 1', dataType: 'image' },
      { id: 'image2', label: 'Biến thể 2', dataType: 'image' },
      { id: 'image3', label: 'Biến thể 3', dataType: 'image' },
      { id: 'image4', label: 'Biến thể 4', dataType: 'image' },
    ],
    params: [
      { kind: 'select', id: 'count', label: 'Số biến thể', options: COUNT_OPTIONS },
      {
        kind: 'text',
        id: 'styles',
        label: 'Style (cách nhau dấu phẩy, để trống = tự chọn)',
        placeholder: 'Japandi, Scandinavian, Wabi-sabi',
      },
    ],
    creditCost: 3,
    async execute(ctx) {
      const { inputs, params } = ctx;
      const count = Math.max(2, Math.min(4, Number(params.count) || 2));
      const extra = inputs.prompt ? String(inputs.prompt.value).trim() : '';
      const image = inputs.image ? String(inputs.image.value) : undefined;
      if (!extra && !image) throw new Error('Cần ít nhất Prompt hoặc Ảnh gốc ở input.');

      const raw = String(params.styles ?? '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const styles: string[] = [];
      for (let i = 0; i < count; i++) styles.push(raw[i] ?? STYLE_OPTIONS[i % STYLE_OPTIONS.length]);

      const weight = 1 / count;
      const urls = await Promise.all(
        styles.map((style, i) => {
          const prompt = `${style} interior design, photorealistic interior render, natural light, high detail${
            extra ? `, ${extra}` : ''
          }`;
          return renderVariant(style, prompt, image, ctx, weight, i * weight);
        }),
      );
      const out: Record<string, PortValue> = {};
      urls.forEach((u, i) => (out[`image${i + 1}`] = { dataType: 'image', value: u }));
      return out;
    },
  },
];
