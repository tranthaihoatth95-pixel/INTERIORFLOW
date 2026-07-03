import type { ExecContext, NodeDefinition, PortValue } from '@/lib/types';
import { runImageJob, checkFalAvailable, AiJobError } from '@/lib/ai/client';
import type { AiTask } from '@/lib/ai/models';
import { extractPalette, composeBoard, adjustImage } from '@/lib/imaging';
import { saveToGallery } from '@/lib/gallery';
import { parseContent, themeFromRef, renderSlide, type FontPairing, type SlideLayout } from '@/lib/slides';

/** Deterministic placeholder "render" — SVG gradient nội thất, dùng cho mock mode. */
function placeholderRender(label: string, seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const hue1 = h % 360;
  const hue2 = (hue1 + 40) % 360;
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="768" height="512" viewBox="0 0 768 512">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="hsl(${hue1},32%,72%)"/>
      <stop offset="1" stop-color="hsl(${hue2},26%,48%)"/>
    </linearGradient>
    <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="hsl(${hue2},18%,34%)"/>
      <stop offset="1" stop-color="hsl(${hue2},20%,22%)"/>
    </linearGradient>
  </defs>
  <rect width="768" height="340" fill="url(#sky)"/>
  <rect y="340" width="768" height="172" fill="url(#floor)"/>
  <rect x="90" y="120" width="180" height="220" rx="4" fill="hsl(${hue1},20%,88%)" opacity="0.85"/>
  <rect x="110" y="140" width="140" height="180" rx="2" fill="hsl(${hue1},45%,62%)" opacity="0.7"/>
  <rect x="430" y="250" width="240" height="16" rx="8" fill="hsl(${hue2},15%,80%)"/>
  <rect x="450" y="266" width="12" height="80" fill="hsl(${hue2},12%,70%)"/>
  <rect x="640" y="266" width="12" height="80" fill="hsl(${hue2},12%,70%)"/>
  <circle cx="560" cy="120" r="34" fill="hsl(45,90%,80%)" opacity="0.9"/>
  <text x="384" y="480" text-anchor="middle" font-family="system-ui" font-size="22" fill="rgba(255,255,255,0.85)">${label}</text>
</svg>`.trim();
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Mock: chạy có progress, trả placeholder — dùng khi chưa có FAL_KEY. */
async function mockRender(label: string, seed: string, onProgress: (p: number) => void) {
  for (let i = 1; i <= 10; i++) {
    await delay(250);
    onProgress(i / 10);
  }
  return placeholderRender(label, seed);
}

/**
 * Chạy AI task trả 1 ảnh: fal thật nếu có key, không thì mock (gắn nhãn "mock").
 * Lỗi thật từ provider vẫn throw để node hiện error + hoàn credit.
 */
async function aiImage(
  task: AiTask,
  input: Record<string, unknown>,
  mockLabel: string,
  ctx: ExecContext,
): Promise<PortValue> {
  const urls = await aiImages(task, input, mockLabel, ctx, 1);
  return { dataType: 'image', value: urls[0] };
}

/** Bản nhiều ảnh (moodboard). */
async function aiImages(
  task: AiTask,
  input: Record<string, unknown>,
  mockLabel: string,
  ctx: ExecContext,
  mockCount: number,
): Promise<string[]> {
  const useFal = await checkFalAvailable();
  const runMock = async () => {
    const out: string[] = [];
    for (let i = 0; i < mockCount; i++) {
      const v = await mockRender(
        `${mockLabel} · mock${mockCount > 1 ? ` ${i + 1}` : ''}`,
        `${JSON.stringify(input).slice(0, 300)}#${i}`,
        (p) => ctx.onProgress((i + p) / mockCount),
      );
      out.push(v);
    }
    return out;
  };
  if (!useFal) return runMock();
  try {
    return await runImageJob(task, input, ctx.onProgress);
  } catch (err) {
    if (err instanceof AiJobError && err.code === 'FAL_NOT_CONFIGURED') return runMock();
    throw err;
  }
}

const STYLE_OPTIONS = ['Scandinavian', 'Japandi', 'Indochine', 'Modern Luxury', 'Wabi-sabi', 'Industrial'];

/** Prompt template theo style — inject từ khoá nội thất. */
function stylePrompt(style: string, extra: string) {
  const base = `${style} interior design, photorealistic interior render, natural light, high detail, professional architectural photography`;
  return extra ? `${extra}, ${base}` : base;
}

const ROOM_TYPES: Record<string, string> = {
  'Phòng khách': 'living room',
  'Phòng ngủ': 'bedroom',
  'Bếp + ăn': 'kitchen and dining room',
  'Văn phòng': 'office workspace',
  'Phòng tắm': 'bathroom',
  'Phòng trẻ em': 'kids bedroom',
};
const LIGHT_DIRECTIONS: Record<string, string> = {
  'Đông (nắng sáng)': 'east-facing morning light',
  'Tây (nắng chiều)': 'west-facing warm afternoon light',
  'Nam (sáng đều)': 'south-facing bright natural light',
  'Bắc (dịu)': 'north-facing soft diffused light',
};

export const NODE_DEFINITIONS: NodeDefinition[] = [
  // ============ INPUT ============
  {
    type: 'input.image',
    title: 'Import Image',
    category: 'INPUT',
    description: 'Upload ảnh hiện trạng, sketch hoặc CAD export (PNG/JPG)',
    inputs: [],
    outputs: [{ id: 'image', label: 'Image', dataType: 'image' }],
    params: [{ kind: 'image', id: 'file', label: 'Image' }],
    creditCost: 0,
    async execute({ params }) {
      const value = params.file as string;
      if (!value) throw new Error('Chưa chọn ảnh — bấm vào node để upload.');
      return { image: { dataType: 'image', value } };
    },
  },
  {
    type: 'input.prompt',
    title: 'Text Prompt',
    category: 'INPUT',
    description: 'Prompt mô tả không gian, vật liệu, ánh sáng',
    inputs: [],
    outputs: [{ id: 'text', label: 'Prompt', dataType: 'text' }],
    params: [
      {
        kind: 'text',
        id: 'prompt',
        label: 'Prompt',
        placeholder: 'warm minimalist living room, oak floor, linen sofa…',
        multiline: true,
      },
    ],
    creditCost: 0,
    async execute({ params }) {
      const value = String(params.prompt ?? '').trim();
      if (!value) throw new Error('Prompt đang trống.');
      return { text: { dataType: 'text', value } };
    },
  },
  {
    type: 'input.stylepreset',
    title: 'Style Preset',
    category: 'INPUT',
    description: 'Chọn phong cách → tự sinh prompt template nội thất',
    inputs: [],
    outputs: [{ id: 'text', label: 'Prompt', dataType: 'text' }],
    params: [{ kind: 'select', id: 'style', label: 'Phong cách', options: STYLE_OPTIONS }],
    creditCost: 0,
    async execute({ params }) {
      const presets: Record<string, string> = {
        Scandinavian: 'scandinavian style, light oak wood, white walls, cozy textiles, hygge, minimal clutter',
        Japandi: 'japandi style, low furniture, natural wood, neutral earth tones, zen minimalism, paper lantern light',
        Indochine: 'indochine style, dark tropical wood, rattan furniture, patterned cement tiles, brass details, colonial elegance',
        'Modern Luxury': 'modern luxury style, marble surfaces, brushed gold accents, velvet upholstery, statement lighting',
        'Wabi-sabi': 'wabi-sabi style, raw plaster walls, imperfect textures, aged wood, muted earthy palette, handcrafted ceramics',
        Industrial: 'industrial style, exposed brick, black steel frames, concrete floor, Edison bulbs, leather sofa',
      };
      return { text: { dataType: 'text', value: presets[String(params.style)] ?? String(params.style) } };
    },
  },
  {
    type: 'input.roominfo',
    title: 'Room Info',
    category: 'INPUT',
    description: 'Loại phòng, diện tích, hướng sáng, trần cao → context prompt',
    inputs: [],
    outputs: [{ id: 'text', label: 'Context', dataType: 'text' }],
    params: [
      { kind: 'select', id: 'roomType', label: 'Loại phòng', options: Object.keys(ROOM_TYPES) },
      { kind: 'text', id: 'area', label: 'Diện tích (m²)', placeholder: '25' },
      { kind: 'select', id: 'light', label: 'Hướng sáng', options: Object.keys(LIGHT_DIRECTIONS) },
      { kind: 'text', id: 'ceiling', label: 'Trần cao (m)', placeholder: '2.8' },
    ],
    creditCost: 0,
    async execute({ params }) {
      const parts = [ROOM_TYPES[String(params.roomType)] ?? 'room'];
      if (params.area) parts.push(`${params.area} square meters`);
      if (params.ceiling) parts.push(`${params.ceiling}m ceiling height`);
      parts.push(LIGHT_DIRECTIONS[String(params.light)] ?? 'natural light');
      return { text: { dataType: 'text', value: parts.join(', ') } };
    },
  },

  // ============ AI GENERATE ============
  {
    type: 'ai.sketch2render',
    title: 'Sketch → Render',
    category: 'AI_GENERATE',
    description: 'Line drawing / SketchUp export → render photoreal, giữ đúng hình khối (FLUX Canny)',
    inputs: [
      { id: 'image', label: 'Sketch', dataType: 'image' },
      { id: 'prompt', label: 'Prompt', dataType: 'text' },
    ],
    outputs: [{ id: 'image', label: 'Render', dataType: 'image' }],
    params: [
      { kind: 'select', id: 'style', label: 'Style', options: STYLE_OPTIONS },
      { kind: 'slider', id: 'guidance', label: 'Guidance', min: 1, max: 20, step: 0.5, default: 15 },
    ],
    creditCost: 4,
    async execute(ctx) {
      const { inputs, params } = ctx;
      if (!inputs.image) throw new Error('Thiếu ảnh sketch ở input.');
      const prompt = stylePrompt(String(params.style), inputs.prompt ? String(inputs.prompt.value) : '');
      const image = await aiImage(
        'sketch2render',
        { prompt, control_image_url: inputs.image.value, guidance_scale: Number(params.guidance), num_images: 1 },
        String(params.style),
        ctx,
      );
      return { image };
    },
  },
  {
    type: 'ai.emptystaging',
    title: 'Empty Room Staging',
    category: 'AI_GENERATE',
    description: 'Ảnh phòng trống → phòng có nội thất theo style (virtual staging)',
    inputs: [
      { id: 'image', label: 'Empty room', dataType: 'image' },
      { id: 'prompt', label: 'Prompt', dataType: 'text' },
    ],
    outputs: [{ id: 'image', label: 'Staged', dataType: 'image' }],
    params: [
      { kind: 'select', id: 'style', label: 'Style', options: STYLE_OPTIONS },
      { kind: 'slider', id: 'strength', label: 'Strength', min: 0.6, max: 0.95, step: 0.05, default: 0.85 },
    ],
    creditCost: 3,
    async execute(ctx) {
      const { inputs, params } = ctx;
      if (!inputs.image) throw new Error('Thiếu ảnh phòng trống ở input.');
      const extra = inputs.prompt ? String(inputs.prompt.value) : '';
      const prompt = `fully furnished ${stylePrompt(String(params.style), extra)}, complete furniture staging, sofa, rug, lighting fixtures, decor`;
      const image = await aiImage(
        'staging',
        { prompt, image_url: inputs.image.value, strength: Number(params.strength), num_images: 1 },
        `${params.style} staging`,
        ctx,
      );
      return { image };
    },
  },
  {
    type: 'ai.styletransfer',
    title: 'Style Transfer',
    category: 'AI_GENERATE',
    description: 'Render lại cùng góc phòng theo style khác (FLUX img2img, strength 0.55–0.7)',
    inputs: [
      { id: 'image', label: 'Image', dataType: 'image' },
      { id: 'prompt', label: 'Prompt', dataType: 'text' },
    ],
    outputs: [{ id: 'image', label: 'Image', dataType: 'image' }],
    params: [
      { kind: 'select', id: 'style', label: 'Style', options: STYLE_OPTIONS },
      { kind: 'slider', id: 'strength', label: 'Strength', min: 0.3, max: 0.9, step: 0.05, default: 0.65 },
    ],
    creditCost: 3,
    async execute(ctx) {
      const { inputs, params } = ctx;
      if (!inputs.image) throw new Error('Thiếu ảnh gốc ở input.');
      const prompt = stylePrompt(String(params.style), inputs.prompt ? String(inputs.prompt.value) : '');
      const image = await aiImage(
        'styleTransfer',
        { prompt, image_url: inputs.image.value, strength: Number(params.strength), num_images: 1 },
        `${params.style} transfer`,
        ctx,
      );
      return { image };
    },
  },
  {
    type: 'ai.moodboard',
    title: 'Moodboard Gen',
    category: 'AI_GENERATE',
    description: 'Text → 4 ảnh concept (FLUX schnell, nhanh + rẻ)',
    inputs: [{ id: 'prompt', label: 'Prompt', dataType: 'text' }],
    outputs: [
      { id: 'image1', label: 'Ảnh 1', dataType: 'image' },
      { id: 'image2', label: 'Ảnh 2', dataType: 'image' },
      { id: 'image3', label: 'Ảnh 3', dataType: 'image' },
      { id: 'image4', label: 'Ảnh 4', dataType: 'image' },
    ],
    params: [{ kind: 'select', id: 'style', label: 'Style', options: STYLE_OPTIONS }],
    creditCost: 2,
    async execute(ctx) {
      const { inputs, params } = ctx;
      const extra = inputs.prompt ? String(inputs.prompt.value) : '';
      const prompt = `interior design moodboard concept, ${stylePrompt(String(params.style), extra)}`;
      const urls = await aiImages('moodboard', { prompt, num_images: 4 }, `${params.style} mood`, ctx, 4);
      const out: Record<string, PortValue> = {};
      urls.slice(0, 4).forEach((u, i) => (out[`image${i + 1}`] = { dataType: 'image', value: u }));
      return out;
    },
  },
  {
    type: 'ai.exterior',
    title: 'Exterior / Facade',
    category: 'AI_GENERATE',
    description: 'Sketch/massing mặt tiền → render exterior photoreal (FLUX Canny)',
    inputs: [
      { id: 'image', label: 'Sketch', dataType: 'image' },
      { id: 'prompt', label: 'Prompt', dataType: 'text' },
    ],
    outputs: [{ id: 'image', label: 'Render', dataType: 'image' }],
    params: [
      {
        kind: 'select',
        id: 'time',
        label: 'Thời điểm',
        options: ['Ban ngày', 'Hoàng hôn', 'Ban đêm (lên đèn)'],
      },
    ],
    creditCost: 4,
    async execute(ctx) {
      const { inputs, params } = ctx;
      if (!inputs.image) throw new Error('Thiếu ảnh sketch mặt tiền ở input.');
      const times: Record<string, string> = {
        'Ban ngày': 'bright daylight, blue sky',
        'Hoàng hôn': 'golden hour sunset light, warm sky',
        'Ban đêm (lên đèn)': 'night scene, warm interior lights glowing through windows, dark blue sky',
      };
      const extra = inputs.prompt ? `${inputs.prompt.value}, ` : '';
      const prompt = `${extra}photorealistic architectural exterior render, modern facade, ${times[String(params.time)]}, landscaping, high detail, professional architecture photography`;
      const image = await aiImage(
        'exterior',
        { prompt, control_image_url: inputs.image.value, guidance_scale: 15, num_images: 1 },
        'Exterior',
        ctx,
      );
      return { image };
    },
  },

  // ============ AI EDIT ============
  {
    type: 'ai.materialswap',
    title: 'Material Swap',
    category: 'AI_EDIT',
    description: 'Mask vùng (sàn/tường/tủ) + prompt vật liệu mới → inpaint (FLUX Fill)',
    inputs: [
      { id: 'image', label: 'Image', dataType: 'image' },
      { id: 'mask', label: 'Mask', dataType: 'mask' },
    ],
    outputs: [{ id: 'image', label: 'Image', dataType: 'image' }],
    params: [
      { kind: 'text', id: 'material', label: 'Vật liệu mới', placeholder: 'walnut wood herringbone floor…', multiline: true },
    ],
    creditCost: 4,
    async execute(ctx) {
      const { inputs, params } = ctx;
      if (!inputs.image) throw new Error('Thiếu ảnh gốc ở input.');
      if (!inputs.mask) throw new Error('Thiếu mask — nối node Mask Painter vào.');
      const material = String(params.material ?? '').trim();
      if (!material) throw new Error('Chưa nhập vật liệu mới.');
      const image = await aiImage(
        'materialSwap',
        {
          prompt: `${material}, photorealistic interior material, seamless, high detail`,
          image_url: inputs.image.value,
          mask_url: inputs.mask.value,
        },
        'Material swap',
        ctx,
      );
      return { image };
    },
  },
  {
    type: 'ai.furniture',
    title: 'Furniture Remove / Add',
    category: 'AI_EDIT',
    description: 'Inpaint xoá đồ hoặc thêm đồ vào vùng mask (FLUX Fill)',
    inputs: [
      { id: 'image', label: 'Image', dataType: 'image' },
      { id: 'mask', label: 'Mask', dataType: 'mask' },
    ],
    outputs: [{ id: 'image', label: 'Image', dataType: 'image' }],
    params: [
      { kind: 'select', id: 'mode', label: 'Chế độ', options: ['Xoá đồ', 'Thêm đồ'] },
      { kind: 'text', id: 'what', label: 'Thêm gì (nếu Thêm đồ)', placeholder: 'a beige fabric armchair…' },
    ],
    creditCost: 4,
    async execute(ctx) {
      const { inputs, params } = ctx;
      if (!inputs.image) throw new Error('Thiếu ảnh gốc ở input.');
      if (!inputs.mask) throw new Error('Thiếu mask — nối node Mask Painter vào.');
      const remove = params.mode === 'Xoá đồ';
      const what = String(params.what ?? '').trim();
      if (!remove && !what) throw new Error('Chế độ Thêm đồ cần mô tả món đồ.');
      const prompt = remove
        ? 'empty space, clean floor and wall, no furniture, seamless continuation of the room surfaces'
        : `${what}, photorealistic furniture, matching the room lighting and perspective`;
      const image = await aiImage(
        'furnitureEdit',
        { prompt, image_url: inputs.image.value, mask_url: inputs.mask.value },
        remove ? 'Remove' : 'Add',
        ctx,
      );
      return { image };
    },
  },
  {
    type: 'ai.relight',
    title: 'Relight',
    category: 'AI_EDIT',
    description: 'Đổi ánh sáng: daylight / sunset / đèn vàng ấm ban đêm (IC-Light v2)',
    inputs: [{ id: 'image', label: 'Image', dataType: 'image' }],
    outputs: [{ id: 'image', label: 'Image', dataType: 'image' }],
    params: [
      {
        kind: 'select',
        id: 'lighting',
        label: 'Ánh sáng',
        options: ['Daylight', 'Sunset', 'Đèn vàng ấm ban đêm', 'Studio soft light'],
      },
    ],
    creditCost: 3,
    async execute(ctx) {
      const { inputs, params } = ctx;
      if (!inputs.image) throw new Error('Thiếu ảnh ở input.');
      const prompts: Record<string, string> = {
        Daylight: 'bright natural daylight streaming through windows, fresh morning atmosphere',
        Sunset: 'warm golden hour sunset light through the windows, long soft shadows',
        'Đèn vàng ấm ban đêm': 'cozy warm night scene, warm yellow interior lamps glowing, dark outside the windows',
        'Studio soft light': 'soft even studio lighting, neutral white balance, editorial photography',
      };
      const image = await aiImage(
        'relight',
        { prompt: prompts[String(params.lighting)], image_url: inputs.image.value },
        String(params.lighting),
        ctx,
      );
      return { image };
    },
  },
  {
    type: 'ai.upscale',
    title: 'Upscale 4K',
    category: 'AI_EDIT',
    description: 'ESRGAN upscale — xuất in ấn, đủ 300dpi khổ A3',
    inputs: [{ id: 'image', label: 'Image', dataType: 'image' }],
    outputs: [{ id: 'image', label: 'Image', dataType: 'image' }],
    params: [{ kind: 'select', id: 'scale', label: 'Scale', options: ['2', '4'] }],
    creditCost: 2,
    async execute(ctx) {
      const { inputs, params } = ctx;
      if (!inputs.image) throw new Error('Thiếu ảnh ở input.');
      const useFal = await checkFalAvailable();
      if (!useFal) {
        for (let i = 1; i <= 6; i++) {
          await delay(250);
          ctx.onProgress(i / 6);
        }
        return { image: inputs.image };
      }
      const urls = await runImageJob('upscale', { image_url: inputs.image.value, scale: Number(params.scale) }, ctx.onProgress);
      return { image: { dataType: 'image', value: urls[0] } };
    },
  },
  {
    type: 'ai.removebg',
    title: 'Remove BG',
    category: 'AI_EDIT',
    description: 'Tách sản phẩm / đồ nội thất khỏi nền (BiRefNet v2)',
    inputs: [{ id: 'image', label: 'Image', dataType: 'image' }],
    outputs: [{ id: 'image', label: 'Cutout', dataType: 'image' }],
    params: [],
    creditCost: 1,
    async execute(ctx) {
      const { inputs } = ctx;
      if (!inputs.image) throw new Error('Thiếu ảnh ở input.');
      const image = await aiImage('removeBg', { image_url: inputs.image.value }, 'Cutout', ctx);
      return { image };
    },
  },

  // ============ SLIDE DECK ============
  {
    type: 'slide.concept',
    title: 'Concept Content',
    category: 'SLIDE',
    description: 'Nội dung concept: kicker + tiêu đề + các ý chính → nguồn cho Slide Composer',
    inputs: [],
    outputs: [{ id: 'text', label: 'Content', dataType: 'text' }],
    params: [
      { kind: 'text', id: 'kicker', label: 'Kicker (dòng nhỏ trên tiêu đề)', placeholder: 'Concept · Bedroom' },
      { kind: 'text', id: 'title', label: 'Tiêu đề', placeholder: 'SERENE — phòng ngủ Japandi' },
      {
        kind: 'text',
        id: 'body',
        label: 'Nội dung (mỗi dòng 1 ý, "-" thành bullet)',
        placeholder: '- Tông đá ấm + gỗ sồi\n- Ánh sáng xuyên rèm vải\n- Nội thất thấp, thoáng',
        multiline: true,
      },
    ],
    creditCost: 0,
    async execute({ params }) {
      const title = String(params.title ?? '').trim();
      if (!title) throw new Error('Chưa nhập tiêu đề concept.');
      const value = JSON.stringify({
        kicker: String(params.kicker ?? '').trim(),
        title,
        body: String(params.body ?? '').trim(),
      });
      return { text: { dataType: 'text', value } };
    },
  },
  {
    type: 'slide.composer',
    title: 'Slide Composer',
    category: 'SLIDE',
    description: 'Nội dung + ảnh ref (màu/brand) + ảnh hero → 1 slide 16:9 hoàn chỉnh (local, 0 credit)',
    inputs: [
      { id: 'content', label: 'Content', dataType: 'text' },
      { id: 'styleref', label: 'Style ref', dataType: 'image' },
      { id: 'hero', label: 'Hero image', dataType: 'image' },
    ],
    outputs: [{ id: 'image', label: 'Slide', dataType: 'image' }],
    params: [
      { kind: 'select', id: 'layout', label: 'Layout', options: ['Cover', 'Nội dung + ảnh', 'Quote'] },
      { kind: 'select', id: 'fonts', label: 'Bộ chữ', options: ['Editorial', 'Modern', 'Elegant'] },
      { kind: 'select', id: 'mode', label: 'Nền', options: ['Sáng', 'Tối'] },
      { kind: 'text', id: 'brand', label: 'Brand (footer)', placeholder: 'TTT Architects' },
      { kind: 'text', id: 'pageNo', label: 'Số trang', placeholder: '01' },
    ],
    creditCost: 0,
    async execute({ inputs, params, onProgress }) {
      if (!inputs.content) throw new Error('Nối Concept Content (hoặc Text Prompt) vào input.');
      onProgress(0.2);
      const theme = await themeFromRef(
        inputs.styleref ? String(inputs.styleref.value) : null,
        params.mode === 'Tối',
      );
      onProgress(0.5);
      const slide = await renderSlide({
        content: parseContent(String(inputs.content.value)),
        theme,
        layout: String(params.layout) as SlideLayout,
        fonts: String(params.fonts) as FontPairing,
        heroUrl: inputs.hero ? String(inputs.hero.value) : null,
        brand: String(params.brand ?? ''),
        pageNo: String(params.pageNo ?? ''),
      });
      onProgress(1);
      return { image: { dataType: 'image', value: slide } };
    },
  },
  {
    type: 'slide.deck',
    title: 'Export Deck',
    category: 'SLIDE',
    description: 'Gom tối đa 6 slide → tải PDF thuyết trình 16:9',
    inputs: [
      { id: 'slide1', label: 'Slide 1', dataType: 'image' },
      { id: 'slide2', label: 'Slide 2', dataType: 'image' },
      { id: 'slide3', label: 'Slide 3', dataType: 'image' },
      { id: 'slide4', label: 'Slide 4', dataType: 'image' },
      { id: 'slide5', label: 'Slide 5', dataType: 'image' },
      { id: 'slide6', label: 'Slide 6', dataType: 'image' },
    ],
    outputs: [{ id: 'image', label: 'Preview', dataType: 'image' }],
    params: [{ kind: 'text', id: 'deckName', label: 'Tên deck', placeholder: 'Concept-Bedroom-v1' }],
    creditCost: 0,
    async execute({ inputs }) {
      const slides = ['slide1', 'slide2', 'slide3', 'slide4', 'slide5', 'slide6']
        .map((k) => inputs[k])
        .filter((v): v is PortValue => Boolean(v));
      if (!slides.length) throw new Error('Nối ít nhất 1 slide vào deck.');
      // outputs giữ đủ danh sách slide trong _slides để nút PDF dùng
      return {
        image: slides[0],
        _slides: { dataType: 'text', value: JSON.stringify(slides.map((s) => String(s.value))) },
      };
    },
  },

  // ============ UTILITY ============
  {
    type: 'util.maskpainter',
    title: 'Mask Painter',
    category: 'UTILITY',
    description: 'Vẽ mask trực tiếp trên ảnh (brush trong modal) — chạy local, 0 credit',
    inputs: [{ id: 'image', label: 'Image', dataType: 'image' }],
    outputs: [{ id: 'mask', label: 'Mask', dataType: 'mask' }],
    params: [{ kind: 'mask', id: 'mask', label: 'Mask' }],
    creditCost: 0,
    async execute({ inputs, params }) {
      if (!inputs.image) throw new Error('Nối ảnh vào input trước.');
      const mask = params.mask as string;
      if (!mask) throw new Error('Chưa vẽ mask — bấm "Vẽ mask" trên node.');
      return { mask: { dataType: 'mask', value: mask } };
    },
  },
  {
    type: 'util.edit',
    title: 'Chỉnh ảnh (manual)',
    category: 'UTILITY',
    description: 'Tự chỉnh sáng/tương phản/bão hoà/nhiệt màu — tức thì, không chờ AI, 0 credit',
    inputs: [{ id: 'image', label: 'Image', dataType: 'image' }],
    outputs: [{ id: 'image', label: 'Image', dataType: 'image' }],
    params: [
      { kind: 'slider', id: 'brightness', label: 'Sáng', min: 0.5, max: 1.5, step: 0.02, default: 1 },
      { kind: 'slider', id: 'contrast', label: 'Tương phản', min: 0.5, max: 1.5, step: 0.02, default: 1 },
      { kind: 'slider', id: 'saturate', label: 'Bão hoà', min: 0, max: 2, step: 0.05, default: 1 },
      { kind: 'slider', id: 'temperature', label: 'Ấm ↔ lạnh', min: -1, max: 1, step: 0.05, default: 0 },
    ],
    creditCost: 0,
    async execute({ inputs, params, onProgress }) {
      if (!inputs.image) throw new Error('Thiếu ảnh ở input.');
      onProgress(0.4);
      const value = await adjustImage(String(inputs.image.value), {
        brightness: Number(params.brightness),
        contrast: Number(params.contrast),
        saturate: Number(params.saturate),
        temperature: Number(params.temperature),
      });
      onProgress(1);
      return { image: { dataType: 'image', value } };
    },
  },
  {
    type: 'util.palette',
    title: 'Color Palette',
    category: 'UTILITY',
    description: 'Trích 6 màu chủ đạo + mã HEX — chạy local, 0 credit',
    inputs: [{ id: 'image', label: 'Image', dataType: 'image' }],
    outputs: [{ id: 'text', label: 'HEX list', dataType: 'text' }],
    params: [],
    creditCost: 0,
    async execute({ inputs, onProgress }) {
      if (!inputs.image) throw new Error('Thiếu ảnh ở input.');
      onProgress(0.4);
      const colors = await extractPalette(String(inputs.image.value));
      onProgress(1);
      return { text: { dataType: 'text', value: colors.join(', ') } };
    },
  },
  {
    type: 'util.compare',
    title: 'Compare A/B',
    category: 'UTILITY',
    description: 'Slider so sánh trước / sau ngay trên node',
    inputs: [
      { id: 'imageA', label: 'A (trước)', dataType: 'image' },
      { id: 'imageB', label: 'B (sau)', dataType: 'image' },
    ],
    outputs: [{ id: 'image', label: 'B pass-through', dataType: 'image' }],
    params: [],
    creditCost: 0,
    async execute({ inputs }) {
      if (!inputs.imageA || !inputs.imageB) throw new Error('Cần đủ 2 ảnh A và B.');
      return { image: inputs.imageB };
    },
  },
  {
    type: 'util.annotate',
    title: 'Annotate',
    category: 'UTILITY',
    description: 'Vẽ / ghi chú lên ảnh (feedback khách) — modal, 0 credit',
    inputs: [{ id: 'image', label: 'Image', dataType: 'image' }],
    outputs: [{ id: 'image', label: 'Annotated', dataType: 'image' }],
    params: [{ kind: 'annotate', id: 'annotated', label: 'Chú thích' }],
    creditCost: 0,
    async execute({ inputs, params }) {
      if (!inputs.image) throw new Error('Nối ảnh vào input trước.');
      const annotated = params.annotated as string;
      return { image: { dataType: 'image', value: annotated || String(inputs.image.value) } };
    },
  },

  // ============ OUTPUT ============
  {
    type: 'out.board',
    title: 'Export Board',
    category: 'OUTPUT',
    description: 'Ghép tối đa 4 output thành presentation board — tải PNG / PDF',
    inputs: [
      { id: 'image1', label: 'Ảnh 1', dataType: 'image' },
      { id: 'image2', label: 'Ảnh 2', dataType: 'image' },
      { id: 'image3', label: 'Ảnh 3', dataType: 'image' },
      { id: 'image4', label: 'Ảnh 4', dataType: 'image' },
    ],
    outputs: [{ id: 'image', label: 'Board', dataType: 'image' }],
    params: [
      { kind: 'text', id: 'projectName', label: 'Tên dự án', placeholder: 'HVH Office L30' },
      { kind: 'text', id: 'studioName', label: 'Tên studio', placeholder: 'TTT Architects' },
    ],
    creditCost: 0,
    async execute({ inputs, params, onProgress }) {
      const images = ['image1', 'image2', 'image3', 'image4']
        .map((k) => inputs[k])
        .filter((v): v is PortValue => Boolean(v))
        .map((v) => String(v.value));
      if (!images.length) throw new Error('Nối ít nhất 1 ảnh vào board.');
      onProgress(0.3);
      const board = await composeBoard({
        images,
        projectName: String(params.projectName ?? ''),
        studioName: String(params.studioName ?? ''),
      });
      onProgress(1);
      return { image: { dataType: 'image', value: board } };
    },
  },
  {
    type: 'out.gallery',
    title: 'Save to Gallery',
    category: 'OUTPUT',
    description: 'Lưu output vào Gallery (local) — bản DB/project sẽ vào ở Phase 3',
    inputs: [{ id: 'image', label: 'Image', dataType: 'image' }],
    outputs: [{ id: 'image', label: 'Image', dataType: 'image' }],
    params: [{ kind: 'text', id: 'name', label: 'Tên asset', placeholder: 'phòng khách v2' }],
    creditCost: 0,
    async execute({ inputs, params }) {
      if (!inputs.image) throw new Error('Thiếu ảnh ở input.');
      saveToGallery({
        name: String(params.name ?? '').trim() || `asset ${new Date().toLocaleString('vi-VN')}`,
        url: String(inputs.image.value),
      });
      return { image: inputs.image };
    },
  },
];

export const NODE_REGISTRY: Record<string, NodeDefinition> = Object.fromEntries(
  NODE_DEFINITIONS.map((d) => [d.type, d]),
);

export function getDefinition(defType: string): NodeDefinition {
  const def = NODE_REGISTRY[defType];
  if (!def) throw new Error(`Unknown node type: ${defType}`);
  return def;
}

export function defaultParams(def: NodeDefinition): Record<string, string | number> {
  const params: Record<string, string | number> = {};
  for (const p of def.params) {
    if (p.kind === 'select') params[p.id] = p.options[0];
    else if (p.kind === 'slider') params[p.id] = p.default;
    else params[p.id] = '';
  }
  return params;
}
