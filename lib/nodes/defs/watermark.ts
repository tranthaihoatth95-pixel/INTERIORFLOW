/**
 * util.watermark — dán logo/watermark lên ảnh. 0 AI, 0đ, chạy client-side (canvas).
 * Node chứng minh cho seam defs/ + barrel (xem defs/index.ts). Mẫu cho các node
 * compositing khác (frame-mockup, board bố cục...).
 */
import type { NodeDefinition } from '@/lib/types';
import { loadImage } from '@/lib/imaging';

const POSITIONS = ['Dưới phải', 'Dưới trái', 'Trên phải', 'Trên trái', 'Giữa'] as const;

async function applyWatermark(
  baseSrc: string,
  logoSrc: string,
  opt: { position: string; scale: number; opacity: number; margin: number },
): Promise<string> {
  const base = await loadImage(baseSrc);
  const logo = await loadImage(logoSrc);
  const canvas = document.createElement('canvas');
  canvas.width = base.naturalWidth || base.width;
  canvas.height = base.naturalHeight || base.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Không tạo được canvas.');

  ctx.drawImage(base, 0, 0, canvas.width, canvas.height);

  // logo rộng = scale% chiều rộng ảnh nền, giữ tỉ lệ
  const lw = canvas.width * (opt.scale / 100);
  const lh = lw * ((logo.naturalHeight || logo.height) / (logo.naturalWidth || logo.width));
  const m = canvas.width * (opt.margin / 100);

  let x = m;
  let y = m;
  if (opt.position === 'Dưới phải') { x = canvas.width - lw - m; y = canvas.height - lh - m; }
  else if (opt.position === 'Dưới trái') { x = m; y = canvas.height - lh - m; }
  else if (opt.position === 'Trên phải') { x = canvas.width - lw - m; y = m; }
  else if (opt.position === 'Trên trái') { x = m; y = m; }
  else if (opt.position === 'Giữa') { x = (canvas.width - lw) / 2; y = (canvas.height - lh) / 2; }

  ctx.globalAlpha = Math.max(0, Math.min(1, opt.opacity));
  ctx.drawImage(logo, x, y, lw, lh);
  ctx.globalAlpha = 1;

  try {
    return canvas.toDataURL('image/png');
  } catch {
    throw new Error('Ảnh bị chặn CORS — dùng ảnh upload hoặc output từ node khác.');
  }
}

export const watermarkNodes: NodeDefinition[] = [
  {
    type: 'util.watermark',
    title: 'Watermark',
    category: 'UTILITY',
    description: 'Dán logo/watermark lên ảnh — chọn góc, cỡ, độ mờ. Tức thì, 0 credit.',
    inputs: [
      { id: 'image', label: 'Ảnh nền', dataType: 'image' },
    ],
    outputs: [{ id: 'image', label: 'Ảnh', dataType: 'image' }],
    params: [
      { kind: 'image', id: 'logo', label: 'Logo / watermark (PNG nền trong)' },
      { kind: 'select', id: 'position', label: 'Vị trí', options: [...POSITIONS] },
      { kind: 'slider', id: 'scale', label: 'Cỡ (% ảnh)', min: 5, max: 60, step: 1, default: 18 },
      { kind: 'slider', id: 'opacity', label: 'Độ mờ', min: 0.1, max: 1, step: 0.05, default: 0.75 },
      { kind: 'slider', id: 'margin', label: 'Lề (% ảnh)', min: 0, max: 15, step: 0.5, default: 3 },
    ],
    creditCost: 0,
    async execute({ inputs, params, onProgress }) {
      if (!inputs.image) throw new Error('Thiếu ảnh nền ở input.');
      const logo = params.logo as string;
      if (!logo) throw new Error('Chưa chọn logo/watermark — bấm vào node để upload.');
      onProgress(0.4);
      const value = await applyWatermark(String(inputs.image.value), logo, {
        position: String(params.position),
        scale: Number(params.scale),
        opacity: Number(params.opacity),
        margin: Number(params.margin),
      });
      onProgress(1);
      return { image: { dataType: 'image', value } };
    },
  },
];
