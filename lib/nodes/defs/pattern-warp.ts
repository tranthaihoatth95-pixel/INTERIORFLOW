/**
 * lib/nodes/defs/pattern-warp.ts — 3 node cho chặng Rendering, đúc từ công việc thật:
 *
 *  · ai.smartselect — CHỌN VÙNG THÔNG MINH. Click/kéo khung → SAM 2 trả mask đúng biên
 *    vật thể, brush tinh chỉnh mép. Trước đây chỉ có brush vẽ tay nên không chọn nổi
 *    vách cong sau quầy reception.
 *  · ai.pattern     — PATTERN STUDIO. Hoa văn cho vách / giấy dán tường / thảm / gạch / rèm.
 *    Đường chính là img2img TỪ ẢNH MẪU: text-to-image không neo nổi motif bản địa
 *    (16 lần thử "hoa văn Chăm" → ra mandala Ấn Độ / damask châu Âu).
 *  · util.warp      — PERSPECTIVE WARP. Kéo 4 góc để dán pattern lên mặt vách NGHIÊNG trong
 *    ảnh phối cảnh. App trước đó không có transform phối cảnh nào.
 *
 * Nối chuỗi thực tế: ai.pattern → util.warp → util.composite (dán lên phối cảnh),
 * hoặc ai.smartselect → ai.materialswap (đổi vật liệu đúng vùng vách).
 */
import type { NodeDefinition, PortValue, ExecContext } from '@/lib/types';
import { runImageJob, checkProviders, AiJobError } from '@/lib/ai/client';
import { providerForTier } from '@/lib/ai/tiers';
import type { AiTask } from '@/lib/ai/models';
import { loadImage } from '@/lib/imaging';
import { growMask, invertMask, rgbaToAlphaMask, alphaMaskToRgba, maskCoverage } from '@/lib/nodes/mask-ops';
import { parseCorners, warpImageToCanvas, quadBounds } from '@/lib/warp/warp';
import {
  PATTERN_KINDS,
  PATTERN_REPEATS,
  PATTERN_TONES,
  buildPatternPrompt,
  patternNegative,
  referenceStrength,
} from '@/lib/nodes/defs/pattern-prompt';
import { flattenToStencil, stencilPalette } from '@/lib/nodes/defs/pattern-flatten';

/* ─────────────────────────── glue dùng chung ─────────────────────────── */

async function providerReady(ctx: ExecContext): Promise<boolean> {
  const provider = providerForTier(ctx.aiTier, ctx.oneAiEngine);
  if (!provider) return false;
  const st = await checkProviders();
  if (provider === 'fal') return st.fal;
  if (provider === 'comfyui') return st.comfyui;
  return st.sd;
}

/** Ảnh → canvas (giữ nguyên kích thước, cap cạnh dài để không nổ RAM trên Mac). */
async function toCanvas(src: string, maxSide = 2048): Promise<HTMLCanvasElement> {
  const img = await loadImage(src);
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const scale = Math.min(1, maxSide / Math.max(iw, ih));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(iw * scale));
  canvas.height = Math.max(1, Math.round(ih * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Không tạo được canvas.');
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas;
}

function canvasUrl(canvas: HTMLCanvasElement): string {
  try {
    return canvas.toDataURL('image/png');
  } catch {
    throw new Error('Ảnh bị chặn CORS — dùng ảnh upload hoặc output từ node khác.');
  }
}

/**
 * Tile "seamless" bằng gương 4 chiều: ghép ảnh + bản lật ngang/dọc thành 1 ô 2×2 →
 * lặp không thấy mối nối. Đánh đổi: motif trở nên đối xứng gương (nhiều hoa văn gạch
 * bản địa vốn đối xứng nên đọc được), KHÔNG phải seamless "offset" thật.
 * → Nợ kỹ thuật: bản offset + feather blend làm sau.
 */
function mirrorTile(src: HTMLCanvasElement): HTMLCanvasElement {
  const out = document.createElement('canvas');
  out.width = src.width * 2;
  out.height = src.height * 2;
  const ctx = out.getContext('2d');
  if (!ctx) throw new Error('Không tạo được canvas.');
  const w = src.width;
  const h = src.height;
  ctx.drawImage(src, 0, 0);
  ctx.save();
  ctx.translate(2 * w, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(src, 0, 0);
  ctx.restore();
  ctx.save();
  ctx.translate(0, 2 * h);
  ctx.scale(1, -1);
  ctx.drawImage(src, 0, 0);
  ctx.restore();
  ctx.save();
  ctx.translate(2 * w, 2 * h);
  ctx.scale(-1, -1);
  ctx.drawImage(src, 0, 0);
  ctx.restore();
  return out;
}

/* ─────────────────────────── node definitions ─────────────────────────── */

const SELECT_MODES = ['Điểm (click)', 'Hộp (kéo khung)'];
const YES_NO = ['Không', 'Có'];
const FLATTEN_MODES = ['2 mức (in được)', '3 mức', 'Tắt (giữ nguyên ảnh model)'];

/** Dẹt ảnh hoa văn thành stencil phẳng theo palette người dùng (xem pattern-flatten.ts). */
async function flattenPattern(
  src: string,
  colors: (string | undefined)[],
  levels: number,
): Promise<string> {
  const canvas = await toCanvas(src, 1536);
  const ctx = canvas.getContext('2d')!;
  const { width: w, height: h } = canvas;
  const palette = stencilPalette(colors).slice(0, Math.max(2, levels));
  const flat = flattenToStencil(ctx.getImageData(0, 0, w, h).data, palette);
  ctx.putImageData(new ImageData(new Uint8ClampedArray(flat), w, h), 0, 0);
  return canvasUrl(canvas);
}

export const patternWarpNodes: NodeDefinition[] = [
  // ══════════════ 1) SMART SELECT ══════════════
  {
    type: 'ai.smartselect',
    title: 'Chọn vùng thông minh · Smart Select',
    category: 'AI_EDIT',
    description:
      'Bấm vào vật thể (hoặc kéo 1 khung) → chọn đúng biên bằng SAM 2, brush tinh chỉnh mép. Ra mask nối thẳng vào Material Swap / Furniture.',
    inputs: [{ id: 'image', label: 'Image', dataType: 'image' }],
    outputs: [{ id: 'mask', label: 'Mask', dataType: 'mask' }],
    params: [
      { kind: 'smartmask', id: 'mask', label: 'Vùng chọn' },
      { kind: 'select', id: 'mode', label: 'Cách chỉ vùng', options: SELECT_MODES },
      { kind: 'select', id: 'invert', label: 'Đảo vùng chọn', options: YES_NO },
      { kind: 'slider', id: 'edge', label: 'Nới (+) / co (−) biên px', min: -12, max: 12, step: 1, default: 0 },
    ],
    // Lần gọi SAM diễn ra trong modal (tương tác), nên node không tính credit lần chạy lại.
    creditCost: 0,
    async execute({ inputs, params, onProgress }) {
      if (!inputs.image) throw new Error('Thiếu ảnh ở input — nối Import Image hoặc output node khác.');
      const raw = String(params.mask ?? '');
      if (!raw) {
        throw new Error('Chưa có vùng chọn — bấm "Chọn vùng thông minh" trên node để chỉ vùng.');
      }
      onProgress(0.3);
      const canvas = await toCanvas(raw);
      const ctx = canvas.getContext('2d')!;
      const { width: w, height: h } = canvas;
      let mask = rgbaToAlphaMask(ctx.getImageData(0, 0, w, h).data);
      if (params.invert === 'Có') mask = invertMask(mask);
      const edge = Number(params.edge ?? 0);
      if (edge) mask = growMask(mask, w, h, edge);
      onProgress(0.8);
      if (maskCoverage(mask) < 0.0005) {
        throw new Error('Vùng chọn gần như trống (có thể do co biên quá nhiều) — mở lại Smart Select.');
      }
      ctx.putImageData(new ImageData(new Uint8ClampedArray(alphaMaskToRgba(mask)), w, h), 0, 0);
      onProgress(1);
      return { mask: { dataType: 'mask', value: canvasUrl(canvas) } };
    },
  },

  // ══════════════ 2) PATTERN STUDIO ══════════════
  {
    type: 'ai.pattern',
    title: 'Hoa văn · Pattern Studio',
    category: 'AI_GENERATE',
    description:
      'Hoa văn cho vách · giấy dán tường · thảm · gạch · rèm. Nối ẢNH MẪU vào input Reference để giữ đúng motif (Chăm/Khmer/Đông Sơn…) — chỉ tả bằng chữ thì AI hay chệch sang mandala/damask.',
    inputs: [
      { id: 'prompt', label: 'Prompt', dataType: 'text' },
      { id: 'reference', label: 'Reference (ảnh mẫu)', dataType: 'image' },
    ],
    outputs: [
      { id: 'image', label: 'Hoa văn', dataType: 'image' },
      { id: 'tile', label: 'Tile lặp', dataType: 'image' },
    ],
    params: [
      { kind: 'text', id: 'motif', label: 'Tả motif', placeholder: 'gạch gốm vuông đắp hoa văn, đường xoắn kép, cánh sen cách điệu…', multiline: true },
      { kind: 'select', id: 'kind', label: 'Dạng', options: [...PATTERN_KINDS] },
      { kind: 'select', id: 'repeat', label: 'Nhịp lặp', options: [...PATTERN_REPEATS] },
      { kind: 'select', id: 'tone', label: 'Tông', options: [...PATTERN_TONES] },
      { kind: 'text', id: 'anchor', label: 'Neo văn hoá', placeholder: 'Chăm pa · Khmer · Đông Sơn · Địa Trung Hải…' },
      { kind: 'text', id: 'color1', label: 'Màu 1 (hex/tên)', placeholder: '#C9BCA8' },
      { kind: 'text', id: 'color2', label: 'Màu 2', placeholder: '#6B4A2F' },
      { kind: 'text', id: 'color3', label: 'Màu 3 (tuỳ chọn)', placeholder: '' },
      { kind: 'slider', id: 'keep', label: 'Giữ motif ảnh mẫu', min: 0.3, max: 0.9, step: 0.05, default: 0.65 },
      // Xem lib/nodes/defs/pattern-flatten.ts: model vẫn trả khối/bóng dù prompt đòi phẳng,
      // nên bước dẹt cuối chạy tất định phía client. Tắt được nếu muốn giữ nguyên ảnh model.
      { kind: 'select', id: 'flatten', label: 'Dẹt thành stencil (khi Pattern phẳng)', options: FLATTEN_MODES },
    ],
    creditCost: 3,
    async execute(ctx) {
      const { inputs, params, onProgress } = ctx;
      const hasReference = Boolean(inputs.reference);
      const motif = [String(params.motif ?? '').trim(), inputs.prompt ? String(inputs.prompt.value).trim() : '']
        .filter(Boolean)
        .join(', ');
      if (!motif && !hasReference && !String(params.anchor ?? '').trim()) {
        throw new Error('Cần ít nhất: tả motif, HOẶC ô "Neo văn hoá", HOẶC nối 1 ảnh mẫu vào input Reference.');
      }
      const kind = String(params.kind ?? PATTERN_KINDS[0]);
      const prompt = buildPatternPrompt({
        prompt: motif,
        kind,
        repeat: String(params.repeat ?? PATTERN_REPEATS[0]),
        tone: String(params.tone ?? PATTERN_TONES[0]),
        anchor: String(params.anchor ?? ''),
        colors: [String(params.color1 ?? ''), String(params.color2 ?? ''), String(params.color3 ?? '')],
        hasReference,
      });
      const negative = patternNegative(kind);

      // Mức 1 (Không AI): node AI khoá — báo rõ, không mock lén (khớp registry.ts).
      if (!providerForTier(ctx.aiTier, ctx.oneAiEngine)) {
        throw new Error('Đang ở mức "Không AI" — Pattern Studio cần model sinh ảnh. Đổi mức AI ở header.');
      }
      if (!(await providerReady(ctx))) {
        throw new Error(
          'Chưa nối được provider AI (thiếu FAL_KEY / ComfyUI chưa chạy). Pattern Studio không mock vì hoa văn giả không dùng được cho hồ sơ.',
        );
      }

      const task: AiTask = hasReference ? 'patternRef' : 'pattern';
      const input: Record<string, unknown> = {
        prompt,
        negative_prompt: negative,
        num_images: 1,
        // hoa văn cần ô vuông để lặp; mural thì ngang
        image_size: kind === 'Mural (tranh cảnh)' ? 'landscape_16_9' : 'square_hd',
      };
      if (hasReference) {
        input.image_url = String(inputs.reference!.value);
        input.strength = referenceStrength(kind, Number(params.keep ?? 0.65));
      }

      let urls: string[];
      try {
        urls = await runImageJob(task, input, (p) => onProgress(p * 0.85), ctx.aiTier, ctx.oneAiEngine);
      } catch (err) {
        if (err instanceof AiJobError && err.code === 'PROVIDER_NOT_CONFIGURED') {
          throw new Error('Provider AI chưa cấu hình — thêm FAL_KEY vào .env.local rồi chạy lại.');
        }
        throw err;
      }
      let url = urls[0];
      if (!url) throw new Error('Provider không trả về ảnh hoa văn.');

      // Dẹt thành stencil: chỉ cho "Pattern phẳng" (phù điêu/mural cần giữ khối & sắc độ).
      const flattenMode = String(params.flatten ?? FLATTEN_MODES[0]);
      if (kind === 'Pattern phẳng' && !flattenMode.startsWith('Tắt')) {
        try {
          url = await flattenPattern(
            url,
            [String(params.color1 ?? ''), String(params.color2 ?? ''), String(params.color3 ?? '')],
            flattenMode.startsWith('3') ? 3 : 2,
          );
        } catch {
          // CORS / ảnh quá lớn → giữ ảnh model, không làm hỏng cả node
        }
      }
      onProgress(0.93);

      // Tile lặp: chỉ có nghĩa khi hoa văn CÓ lặp; "Không lặp"/Mural thì trả chính ảnh.
      const noRepeat = String(params.repeat) === 'Không lặp' || kind === 'Mural (tranh cảnh)';
      let tileUrl = url;
      if (!noRepeat) {
        try {
          tileUrl = canvasUrl(mirrorTile(await toCanvas(url, 1024)));
        } catch {
          tileUrl = url; // CORS / ảnh lớn — vẫn có output chính, không làm hỏng cả node
        }
      }
      onProgress(1);
      const out: Record<string, PortValue> = {
        image: { dataType: 'image', value: url },
        tile: { dataType: 'image', value: tileUrl },
      };
      return out;
    },
  },

  // ══════════════ 3) PERSPECTIVE WARP ══════════════
  {
    type: 'util.warp',
    title: 'Nắn phối cảnh · Perspective Warp',
    category: 'UTILITY',
    description:
      'Kéo 4 góc để dán pattern/ảnh lên mặt vách NGHIÊNG trong ảnh phối cảnh. Vùng ngoài trong suốt → nối vào Ghép ảnh (Composite). Tức thì, 0 credit.',
    inputs: [
      { id: 'image', label: 'Ảnh cần warp', dataType: 'image' },
      { id: 'base', label: 'Base (phối cảnh, tuỳ chọn)', dataType: 'image' },
    ],
    outputs: [{ id: 'image', label: 'Đã warp', dataType: 'image' }],
    params: [
      { kind: 'corners', id: 'corners', label: '4 góc phối cảnh' },
      { kind: 'slider', id: 'opacity', label: 'Độ mờ', min: 0.1, max: 1, step: 0.05, default: 1 },
      { kind: 'slider', id: 'grid', label: 'Độ mịn lưới', min: 8, max: 48, step: 4, default: 24 },
    ],
    creditCost: 0,
    async execute({ inputs, params, onProgress }) {
      if (!inputs.image) throw new Error('Thiếu ảnh cần warp ở input.');
      onProgress(0.2);
      const corners = parseCorners(params.corners);
      const overlay = await loadImage(String(inputs.image.value));

      // Khung output = ảnh phối cảnh nếu có (để composite khớp pixel-to-pixel);
      // không có thì lấy bao chữ nhật của tứ giác trên khung ảnh gốc.
      let width: number;
      let height: number;
      if (inputs.base) {
        const base = await loadImage(String(inputs.base.value));
        width = base.naturalWidth || base.width;
        height = base.naturalHeight || base.height;
      } else {
        const b = quadBounds(corners);
        const ow = overlay.naturalWidth || overlay.width;
        const oh = overlay.naturalHeight || overlay.height;
        // giữ nguyên cỡ ảnh gốc làm khung tham chiếu, tứ giác nằm trong đó
        width = Math.max(64, Math.round(ow / Math.max(0.05, b.maxX - b.minX)));
        height = Math.max(64, Math.round(oh / Math.max(0.05, b.maxY - b.minY)));
        // chặn khung phình quá lớn khi tứ giác rất nhỏ
        const cap = 3000 / Math.max(width, height);
        if (cap < 1) {
          width = Math.round(width * cap);
          height = Math.round(height * cap);
        }
      }
      onProgress(0.5);
      const canvas = warpImageToCanvas(overlay, corners, {
        width,
        height,
        grid: Number(params.grid ?? 24),
        opacity: Number(params.opacity ?? 1),
      });
      onProgress(1);
      return { image: { dataType: 'image', value: canvasUrl(canvas) } };
    },
  },
];
