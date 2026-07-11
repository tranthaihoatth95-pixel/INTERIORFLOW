/**
 * util.crop + util.composite — chỉnh khung hình & ghép ảnh, 0 AI, canvas client-side.
 * Seam defs/ (xem defs/index.ts). Giá trị cho pipeline Render: crop ảnh trước khi đưa
 * vào AI (bố cục đúng khung), hoặc ghép 2 ảnh (vd cutout Remove BG lên nền khác).
 */
import type { NodeDefinition } from '@/lib/types';
import { loadImage } from '@/lib/imaging';

const CROP_PRESETS = ['Tự do', '1:1 (vuông)', '4:3', '16:9', '9:16 (dọc)', '3:4 (dọc)'];

function presetRatio(preset: string): number | null {
  switch (preset) {
    case '1:1 (vuông)':
      return 1;
    case '4:3':
      return 4 / 3;
    case '16:9':
      return 16 / 9;
    case '9:16 (dọc)':
      return 9 / 16;
    case '3:4 (dọc)':
      return 3 / 4;
    default:
      return null; // Tự do — theo khung % người dùng chỉnh
  }
}

async function cropImage(
  src: string,
  opt: { top: number; left: number; width: number; height: number; ratio: string },
): Promise<string> {
  const img = await loadImage(src);
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;

  let cw = (opt.width / 100) * iw;
  let ch = (opt.height / 100) * ih;
  let cx = (opt.left / 100) * iw;
  let cy = (opt.top / 100) * ih;

  const ratio = presetRatio(opt.ratio);
  if (ratio) {
    // giữ tâm khung đang chọn, ép theo tỉ lệ, không vượt biên ảnh
    const centerX = cx + cw / 2;
    const centerY = cy + ch / 2;
    const curRatio = cw / ch;
    if (curRatio > ratio) cw = ch * ratio;
    else ch = cw / ratio;
    cx = centerX - cw / 2;
    cy = centerY - ch / 2;
  }
  cw = Math.min(cw, iw);
  ch = Math.min(ch, ih);
  cx = Math.max(0, Math.min(iw - cw, cx));
  cy = Math.max(0, Math.min(ih - ch, cy));

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(cw));
  canvas.height = Math.max(1, Math.round(ch));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Không tạo được canvas.');
  ctx.drawImage(img, cx, cy, cw, ch, 0, 0, canvas.width, canvas.height);
  try {
    return canvas.toDataURL('image/png');
  } catch {
    throw new Error('Ảnh bị chặn CORS — dùng ảnh upload hoặc output từ node khác.');
  }
}

const BLEND_MODES = ['normal', 'multiply', 'screen', 'overlay'];
const ANCHORS = ['Giữa', 'Trên trái', 'Trên phải', 'Dưới trái', 'Dưới phải', 'Tự do (theo %)'];

function toCompositeOp(blend: string): GlobalCompositeOperation {
  if (blend === 'multiply' || blend === 'screen' || blend === 'overlay') return blend;
  return 'source-over';
}

async function compositeImages(
  baseSrc: string,
  overlaySrc: string,
  opt: { anchor: string; scale: number; opacity: number; x: number; y: number; blend: string },
): Promise<string> {
  const base = await loadImage(baseSrc);
  const overlay = await loadImage(overlaySrc);
  const canvas = document.createElement('canvas');
  canvas.width = base.naturalWidth || base.width;
  canvas.height = base.naturalHeight || base.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Không tạo được canvas.');
  ctx.drawImage(base, 0, 0, canvas.width, canvas.height);

  const ow = canvas.width * (opt.scale / 100);
  const oh = ow * ((overlay.naturalHeight || overlay.height) / (overlay.naturalWidth || overlay.width));
  const m = canvas.width * 0.03;

  let x = (canvas.width - ow) / 2;
  let y = (canvas.height - oh) / 2;
  if (opt.anchor === 'Trên trái') {
    x = m;
    y = m;
  } else if (opt.anchor === 'Trên phải') {
    x = canvas.width - ow - m;
    y = m;
  } else if (opt.anchor === 'Dưới trái') {
    x = m;
    y = canvas.height - oh - m;
  } else if (opt.anchor === 'Dưới phải') {
    x = canvas.width - ow - m;
    y = canvas.height - oh - m;
  } else if (opt.anchor === 'Tự do (theo %)') {
    x = canvas.width * (opt.x / 100) - ow / 2;
    y = canvas.height * (opt.y / 100) - oh / 2;
  }

  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, opt.opacity));
  ctx.globalCompositeOperation = toCompositeOp(opt.blend);
  ctx.drawImage(overlay, x, y, ow, oh);
  ctx.restore();

  try {
    return canvas.toDataURL('image/png');
  } catch {
    throw new Error('Ảnh bị chặn CORS — dùng ảnh upload hoặc output từ node khác.');
  }
}

export const cropCompositeNodes: NodeDefinition[] = [
  {
    type: 'util.crop',
    title: 'Crop & Resize',
    category: 'UTILITY',
    description: 'Cắt khung + ép tỉ lệ (vuông/16:9/dọc…) — chỉnh bố cục trước khi đưa vào AI. Tức thì, 0 credit.',
    inputs: [{ id: 'image', label: 'Ảnh', dataType: 'image' }],
    outputs: [{ id: 'image', label: 'Đã crop', dataType: 'image' }],
    params: [
      { kind: 'select', id: 'ratio', label: 'Tỉ lệ', options: CROP_PRESETS },
      { kind: 'slider', id: 'left', label: 'Trái (%)', min: 0, max: 90, step: 1, default: 0 },
      { kind: 'slider', id: 'top', label: 'Trên (%)', min: 0, max: 90, step: 1, default: 0 },
      { kind: 'slider', id: 'width', label: 'Rộng (%)', min: 10, max: 100, step: 1, default: 100 },
      { kind: 'slider', id: 'height', label: 'Cao (%)', min: 10, max: 100, step: 1, default: 100 },
    ],
    creditCost: 0,
    async execute({ inputs, params, onProgress }) {
      if (!inputs.image) throw new Error('Thiếu ảnh ở input.');
      onProgress(0.4);
      const value = await cropImage(String(inputs.image.value), {
        top: Number(params.top),
        left: Number(params.left),
        width: Number(params.width),
        height: Number(params.height),
        ratio: String(params.ratio),
      });
      onProgress(1);
      return { image: { dataType: 'image', value } };
    },
  },
  {
    type: 'util.composite',
    title: 'Ghép ảnh (Composite)',
    category: 'UTILITY',
    description: 'Chồng 1 ảnh (vd cutout Remove BG) lên nền — chọn góc, cỡ, độ mờ, chế độ hoà màu. Tức thì, 0 credit.',
    inputs: [
      { id: 'base', label: 'Ảnh nền', dataType: 'image' },
      { id: 'overlay', label: 'Ảnh chồng lên', dataType: 'image' },
    ],
    outputs: [{ id: 'image', label: 'Ảnh ghép', dataType: 'image' }],
    params: [
      { kind: 'select', id: 'anchor', label: 'Vị trí', options: ANCHORS },
      { kind: 'slider', id: 'x', label: 'X % (nếu Tự do)', min: 0, max: 100, step: 1, default: 50 },
      { kind: 'slider', id: 'y', label: 'Y % (nếu Tự do)', min: 0, max: 100, step: 1, default: 50 },
      { kind: 'slider', id: 'scale', label: 'Cỡ (% ảnh nền)', min: 5, max: 100, step: 1, default: 40 },
      { kind: 'slider', id: 'opacity', label: 'Độ mờ', min: 0.1, max: 1, step: 0.05, default: 1 },
      { kind: 'select', id: 'blend', label: 'Hoà màu', options: BLEND_MODES },
    ],
    creditCost: 0,
    async execute({ inputs, params, onProgress }) {
      if (!inputs.base) throw new Error('Thiếu ảnh nền ở input.');
      if (!inputs.overlay) throw new Error('Thiếu ảnh chồng lên ở input.');
      onProgress(0.4);
      const value = await compositeImages(String(inputs.base.value), String(inputs.overlay.value), {
        anchor: String(params.anchor),
        scale: Number(params.scale),
        opacity: Number(params.opacity),
        x: Number(params.x),
        y: Number(params.y),
        blend: String(params.blend),
      });
      onProgress(1);
      return { image: { dataType: 'image', value } };
    },
  },
];
