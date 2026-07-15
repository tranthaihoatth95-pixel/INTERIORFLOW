/**
 * lib/nodes/defs/render-v2.ts — BỘ NODE RENDER V2 (kiến trúc 2 TẦNG, hoàn thiện bộ 7 node):
 *
 *  · ai.text2image       — Text → Ảnh. Tầng AI: NVIDIA NIM (SD3) → fal/oneAI theo tier.
 *  · three.camera        — Góc máy ảnh tất định (lib/three/camera) → JSON + mẩu prompt.
 *  · three.cad2fbx       — Bản vẽ chặng 1 → OBJ/MTL (lib/three/cad-to-obj) + FBX qua Blender.
 *  · ai.idmask           — Phân vùng ID map (median-cut) + tinh chỉnh BiRefNet khi có key.
 *  · ai.furnitureextract — Tách nội thất: BiRefNet (AI) / tách màu nền viền (lõi).
 *  · ai.localedit        — Chỉnh cục bộ vùng mask: inpaint FLUX Fill (AI) / chỉnh pixel (lõi).
 *
 * LUẬT 2 TẦNG (bắt buộc): tầng AI chỉ chạy khi có key/provider; không có → TẦNG LÕI
 * TẤT ĐỊNH (lib/render-core/*) trả kết quả thật. Mọi node ghi output ẩn `_tier`
 * (tầng nào đã chạy) — NodeExtras hiện badge, TUYỆT ĐỐI không mock-im-lặng.
 */
import type { NodeDefinition, PortValue, ExecContext } from '@/lib/types';
import { runImageJob, checkProviders, AiJobError } from '@/lib/ai/client';
import { providerForTier } from '@/lib/ai/tiers';
import { loadImage } from '@/lib/imaging';
import { fetchGuProfile, guToPrompt } from '@/lib/gu';
import { text2imageCore } from '@/lib/render-core/text2image-core';
import { quantizeIdMap, renderIdMap, maskForRegion, refineWithAlpha, IDMASK_MAX_REGIONS } from '@/lib/render-core/idmask-core';
import { extractForeground, alphaToMask } from '@/lib/render-core/furniture-extract-core';
import { applyMaskedAdjust } from '@/lib/render-core/local-edit-core';
import { docToObjScene, type SceneTheme } from '@/lib/three/cad-to-obj';
import {
  presetCamera,
  parseCameraSpec,
  placeCamera,
  CAMERA_PRESETS,
  CAMERA_LENSES,
  CAMERA_RATIOS,
} from '@/lib/three/camera';
import { useCadStore } from '@/lib/cad/store';

/* ───────────────────────── glue canvas (client) ───────────────────────── */

interface DecodedImage {
  data: Uint8ClampedArray;
  w: number;
  h: number;
}

/** Ảnh (dataURL/URL) → buffer RGBA, cap cạnh dài ≤ maxSide cho mượt. */
async function decodeImage(src: string, maxSide = 1024): Promise<DecodedImage> {
  const img = await loadImage(src);
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const scale = Math.min(1, maxSide / Math.max(iw, ih));
  const w = Math.max(1, Math.round(iw * scale));
  const h = Math.max(1, Math.round(ih * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Không tạo được canvas.');
  ctx.drawImage(img, 0, 0, w, h);
  try {
    return { data: ctx.getImageData(0, 0, w, h).data, w, h };
  } catch {
    throw new Error('Ảnh bị chặn CORS — dùng ảnh upload hoặc output từ node khác.');
  }
}

/** Buffer RGBA → dataURL PNG. */
function encodeImage(data: Uint8ClampedArray, w: number, h: number): string {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Không tạo được canvas.');
  // copy sang buffer ArrayBuffer "sạch" — TS DOM không nhận Uint8ClampedArray<ArrayBufferLike>
  ctx.putImageData(new ImageData(new Uint8ClampedArray(data), w, h), 0, 0);
  return canvas.toDataURL('image/png');
}

/** Port ẩn `_tier` — UI (NodeExtras) hiện badge tầng đã chạy. */
const tierPort = (label: string): PortValue => ({ dataType: 'text', value: label });

/** Provider của tier hiện tại sẵn sàng chưa (fal có key / comfy có URL / sd có server). */
async function tierProviderReady(ctx: ExecContext): Promise<boolean> {
  const provider = providerForTier(ctx.aiTier, ctx.oneAiEngine);
  if (!provider) return false; // mức 1 — Không AI → thẳng tầng lõi
  const st = await checkProviders();
  if (provider === 'fal') return st.fal;
  if (provider === 'comfyui') return st.comfyui;
  return st.sd;
}

/** Gu render từ thư viện Reference (trống → '') — cùng cơ chế node sketch2render. */
async function guFragment(): Promise<string> {
  try {
    return guToPrompt(await fetchGuProfile(['ref-render']));
  } catch {
    return '';
  }
}

const T2I_NEGATIVE =
  'blurry, lowres, distorted, deformed furniture, duplicated furniture, floating objects, ' +
  'watermark, text, signature, cartoon, oversaturated, blown highlights';

/* ───────────────────────────── node defs ───────────────────────────── */

const REGION_COUNTS = ['4', '6', '8'];
const LOCAL_EDIT_MODES = ['AI inpaint (theo prompt)', 'Chỉnh tay vùng mask'];
const CAD_THEMES = ['Clay (trắng)', 'Gỗ ấm', 'Theo gu (Reference)'];
const THEME_MAP: Record<string, SceneTheme> = {
  'Clay (trắng)': 'clay',
  'Gỗ ấm': 'warm',
  'Theo gu (Reference)': 'gu',
};

export const renderV2Nodes: NodeDefinition[] = [
  // ============ 1) TEXT → ẢNH (2 tầng: NVIDIA → fal/oneAI → lõi) ============
  {
    type: 'ai.text2image',
    title: 'Tạo ảnh (Text → Ảnh)',
    category: 'AI_GENERATE',
    description:
      'Prompt → ảnh nội thất. Tầng AI: NVIDIA NIM free (SD3-medium) → fal/oneAI theo mức AI. Chưa có key: tầng lõi tất định vẽ concept sketch từ chính prompt — ghi rõ tầng đã chạy.',
    inputs: [
      { id: 'prompt', label: 'Prompt', dataType: 'text' },
      { id: 'camera', label: 'Camera (tuỳ chọn)', dataType: 'text' },
    ],
    outputs: [{ id: 'image', label: 'Ảnh', dataType: 'image' }],
    params: [
      {
        kind: 'text',
        id: 'extra',
        label: 'Mô tả thêm (tuỳ chọn)',
        placeholder: 'warm japandi living room, oak floor, linen sofa…',
        multiline: true,
      },
      { kind: 'select', id: 'ratio', label: 'Khung', options: [...CAMERA_RATIOS] },
    ],
    creditCost: 2,
    async execute(ctx) {
      const { inputs, params, onProgress } = ctx;
      const base = [inputs.prompt ? String(inputs.prompt.value).trim() : '', String(params.extra ?? '').trim()]
        .filter(Boolean)
        .join(', ');
      if (!base) throw new Error('Nhập prompt (node Text Prompt hoặc ô Mô tả thêm).');
      const cam = parseCameraSpec(inputs.camera ? String(inputs.camera.value) : null);
      const gu = await guFragment();
      const prompt = [base, cam?.prompt, gu, 'photorealistic interior render, natural light, high detail']
        .filter(Boolean)
        .join(', ');
      const ratio = String(params.ratio ?? '16:9');

      // Tầng AI-1: NVIDIA NIM free (server giữ key). 503 = chưa có key → tụt tầng tiếp.
      onProgress(0.1);
      try {
        const res = await fetch('/api/render/nvidia-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, negative: T2I_NEGATIVE, ratio }),
        });
        const body = (await res.json().catch(() => ({}))) as { image?: string; model?: string; error?: string; code?: string };
        if (res.ok && body.image) {
          onProgress(1);
          return {
            image: { dataType: 'image', value: body.image },
            _tier: tierPort(`Tầng AI · NVIDIA NIM (${body.model ?? 'image'})`),
          };
        }
        // Hết lượt free: CHỈ BÁO, không âm thầm tụt (đúng cơ chế nvidia.ts).
        if (body.code === 'NVIDIA_FREE_EXHAUSTED') throw new Error(body.error ?? 'NVIDIA free hết lượt.');
        // NVIDIA_NOT_CONFIGURED / 401 / lỗi mạng → thử tầng kế
      } catch (err) {
        if (err instanceof Error && err.message.includes('NVIDIA free')) throw err;
        // fetch fail (offline/dev) → thử tầng kế
      }

      // Tầng AI-2: provider theo mức AI hiện tại (fal / ComfyUI / SD) — task text2img sẵn có.
      if (await tierProviderReady(ctx)) {
        try {
          const urls = await runImageJob('moodboard', { prompt, negative_prompt: T2I_NEGATIVE, num_images: 1 }, onProgress, ctx.aiTier, ctx.oneAiEngine);
          if (urls.length) {
            return {
              image: { dataType: 'image', value: urls[0] },
              _tier: tierPort('Tầng AI · provider theo mức AI (fal/oneAI)'),
            };
          }
        } catch (err) {
          if (!(err instanceof AiJobError && err.code === 'PROVIDER_NOT_CONFIGURED')) throw err;
        }
      }

      // Tầng LÕI TẤT ĐỊNH: concept sketch thật từ prompt — ảnh tự mang nhãn.
      onProgress(0.7);
      const core = text2imageCore(prompt, ratio);
      onProgress(1);
      return {
        image: { dataType: 'image', value: core.dataUri },
        _tier: tierPort(core.note),
      };
    },
  },

  // ============ 2) GÓC MÁY ẢNH (tất định) ============
  {
    type: 'three.camera',
    title: 'Góc máy ảnh',
    category: 'INPUT',
    description:
      'Preset máy ảnh tất định (tầm mắt / góc rộng / cận vật liệu / trên cao) → JSON camera cho node 3D + mẩu prompt cho node render. 0 credit.',
    inputs: [],
    outputs: [
      { id: 'camera', label: 'Camera', dataType: 'text' },
      { id: 'prompt', label: 'Prompt góc máy', dataType: 'text' },
    ],
    params: [
      { kind: 'select', id: 'preset', label: 'Góc máy', options: [...CAMERA_PRESETS] },
      { kind: 'select', id: 'lens', label: 'Tiêu cự', options: [...CAMERA_LENSES] },
      { kind: 'select', id: 'ratio', label: 'Khung', options: [...CAMERA_RATIOS] },
    ],
    creditCost: 0,
    async execute({ params }) {
      const spec = presetCamera(String(params.preset), String(params.lens), String(params.ratio));
      return {
        camera: { dataType: 'text', value: JSON.stringify(spec) },
        prompt: { dataType: 'text', value: spec.prompt },
        _tier: tierPort('Tất định (preset camera) — không AI'),
      };
    },
  },

  // ============ 3) BẢN VẼ → 3D (OBJ/FBX) ============
  {
    type: 'three.cad2fbx',
    title: 'Bản vẽ → 3D (OBJ/FBX)',
    category: 'INPUT',
    description:
      'Đọc bản vẽ chặng 1 (tường WALL + block nội thất) → dựng khối 3D đúng kích thước thật, xuất OBJ/MTL ngay trên node; nút "Xuất FBX" convert qua Blender local (có thì dùng, không có báo rõ). 0 credit, 100% tất định.',
    inputs: [{ id: 'camera', label: 'Camera (tuỳ chọn)', dataType: 'text' }],
    outputs: [{ id: 'text', label: 'Thông số scene', dataType: 'text' }],
    params: [
      { kind: 'text', id: 'wallHeight', label: 'Cao tường (mm)', placeholder: '2700' },
      { kind: 'select', id: 'theme', label: 'Vật liệu', options: CAD_THEMES },
      { kind: 'select', id: 'ceiling', label: 'Trần', options: ['Không', 'Có'] },
    ],
    creditCost: 0,
    async execute({ inputs, params, onProgress }) {
      const doc = useCadStore.getState().doc;
      if (!doc || doc.entities.length === 0) {
        throw new Error('Chưa có bản vẽ — mở /cad-editor vẽ tường (lệnh WALL) + đặt block nội thất trước.');
      }
      onProgress(0.2);
      const theme = THEME_MAP[String(params.theme)] ?? 'clay';
      let palette: string[] = [];
      if (theme === 'gu') {
        palette = (await fetchGuProfile(['ref-render'])).palette;
      }
      const wallHeightMm = Number(params.wallHeight) > 0 ? Number(params.wallHeight) : 2700;
      const scene = docToObjScene(doc, {
        wallHeightMm,
        ceiling: params.ceiling === 'Có',
        theme,
        palette,
      });
      onProgress(0.7);
      if (scene.stats.walls === 0 && scene.stats.furniture === 0) {
        throw new Error('Bản vẽ chưa có tường (hatch WALL) hay block nội thất — chưa dựng được khối 3D.');
      }
      const spec =
        parseCameraSpec(inputs.camera ? String(inputs.camera.value) : null) ??
        presetCamera(CAMERA_PRESETS[1], '24mm', '16:9');
      const cam = placeCamera(scene.stats.bboxMm, spec);
      const s = scene.stats;
      const lines = [
        `Khối 3D: ${s.walls} tường · ${s.furniture} nội thất · ${s.rooms} phòng`,
        `Kích thước: ${s.sizeM.w.toFixed(1)} × ${s.sizeM.d.toFixed(1)} × ${s.sizeM.h.toFixed(1)} m — ${s.verts} đỉnh / ${s.faces} mặt`,
        `Camera: ${spec.label} · ${spec.lensMm}mm`,
        ...scene.warnings.map((w) => `⚠ ${w}`),
      ];
      onProgress(1);
      return {
        text: { dataType: 'text', value: lines.join('\n') },
        _obj: { dataType: 'text', value: scene.obj },
        _mtl: { dataType: 'text', value: scene.mtl },
        _cam: { dataType: 'text', value: JSON.stringify({ ...cam, ratio: spec.ratio }) },
        _tier: tierPort('Tầng lõi tất định (CAD→OBJ extrude) — không AI'),
      };
    },
  },

  // ============ 4) ID MASK (phân vùng) ============
  {
    type: 'ai.idmask',
    title: 'ID Mask (phân vùng)',
    category: 'AI_EDIT',
    description:
      'Phân ảnh thành các vùng màu phẳng kiểu ID map VRay (median-cut, tất định) → chọn 1 vùng làm mask cho Material Swap / Chỉnh cục bộ. Có FAL_KEY: BiRefNet tách nền chính xác thành vùng riêng.',
    inputs: [{ id: 'image', label: 'Ảnh', dataType: 'image' }],
    outputs: [
      { id: 'idmap', label: 'ID map', dataType: 'image' },
      { id: 'mask', label: 'Mask vùng chọn', dataType: 'mask' },
    ],
    params: [
      { kind: 'select', id: 'regions', label: 'Số vùng', options: REGION_COUNTS },
      { kind: 'slider', id: 'pick', label: 'Vùng chọn (#)', min: 1, max: IDMASK_MAX_REGIONS, step: 1, default: 1 },
    ],
    creditCost: 0,
    async execute(ctx) {
      const { inputs, params, onProgress } = ctx;
      if (!inputs.image) throw new Error('Thiếu ảnh ở input.');
      onProgress(0.15);
      const img = await decodeImage(String(inputs.image.value), 768);
      onProgress(0.35);
      const k = Number(params.regions) || 6;
      const q = quantizeIdMap(img.data, img.w, img.h, k);
      let assign = q.assign;
      let tier = `Tầng lõi tất định (median-cut ${q.k} vùng) — không AI`;

      // Tinh chỉnh 2 tầng: BiRefNet tách nền khi provider sẵn sàng — lỗi thì giữ tầng lõi.
      if (await tierProviderReady(ctx)) {
        try {
          const urls = await runImageJob(
            'removeBg',
            { image_url: String(inputs.image.value) },
            (p) => onProgress(0.35 + p * 0.4),
            ctx.aiTier,
            ctx.oneAiEngine,
          );
          if (urls.length) {
            const cut = await decodeImage(urls[0], 768);
            if (cut.w === img.w && cut.h === img.h) {
              assign = refineWithAlpha(assign, cut.data);
              tier = 'Tầng AI · BiRefNet tách nền (vùng 1 = nền) + median-cut lõi';
            }
          }
        } catch {
          // provider lỗi/CORS → giữ kết quả tầng lõi, tier đã ghi rõ
        }
      }
      onProgress(0.85);
      const idmap = encodeImage(renderIdMap(assign, img.w, img.h), img.w, img.h);
      const region = Math.min(IDMASK_MAX_REGIONS, Math.max(1, Number(params.pick))) - 1;
      const mask = encodeImage(maskForRegion(assign, img.w, img.h, region), img.w, img.h);
      onProgress(1);
      return {
        idmap: { dataType: 'image', value: idmap },
        mask: { dataType: 'mask', value: mask },
        _tier: tierPort(tier),
      };
    },
  },

  // ============ 5) TÁCH NỘI THẤT ============
  {
    type: 'ai.furnitureextract',
    title: 'Tách nội thất',
    category: 'AI_EDIT',
    description:
      'Tách đồ nội thất/sản phẩm khỏi nền → cutout PNG trong suốt + mask. Có FAL_KEY: BiRefNet (AI). Không có: tầng lõi tách theo màu nền viền (hợp ảnh catalogue nền phẳng) — ghi rõ tầng đã chạy.',
    inputs: [{ id: 'image', label: 'Ảnh', dataType: 'image' }],
    outputs: [
      { id: 'cutout', label: 'Cutout', dataType: 'image' },
      { id: 'mask', label: 'Mask', dataType: 'mask' },
    ],
    params: [
      { kind: 'slider', id: 'tolerance', label: 'Ngưỡng nền (lõi)', min: 0.1, max: 0.5, step: 0.05, default: 0.25 },
    ],
    creditCost: 1,
    async execute(ctx) {
      const { inputs, params, onProgress } = ctx;
      if (!inputs.image) throw new Error('Thiếu ảnh ở input.');
      const src = String(inputs.image.value);

      // Tầng AI: BiRefNet qua provider theo mức AI.
      if (await tierProviderReady(ctx)) {
        try {
          const urls = await runImageJob('removeBg', { image_url: src }, (p) => onProgress(p * 0.8), ctx.aiTier, ctx.oneAiEngine);
          if (urls.length) {
            let mask: string;
            try {
              const cut = await decodeImage(urls[0], 1024);
              mask = encodeImage(alphaToMask(cut.data, cut.w, cut.h), cut.w, cut.h);
            } catch {
              // cutout URL chặn CORS → mask từ tầng lõi trên ảnh gốc
              const img = await decodeImage(src, 1024);
              const core = extractForeground(img.data, img.w, img.h, Number(params.tolerance));
              mask = encodeImage(alphaToMask(core.data, img.w, img.h), img.w, img.h);
            }
            onProgress(1);
            return {
              cutout: { dataType: 'image', value: urls[0] },
              mask: { dataType: 'mask', value: mask },
              _tier: tierPort('Tầng AI · BiRefNet v2 (tách nền)'),
            };
          }
        } catch (err) {
          if (!(err instanceof AiJobError && err.code === 'PROVIDER_NOT_CONFIGURED')) throw err;
        }
      }

      // Tầng lõi tất định: tách theo màu nền ước lượng từ viền.
      onProgress(0.3);
      const img = await decodeImage(src, 1024);
      const core = extractForeground(img.data, img.w, img.h, Number(params.tolerance));
      if (!core.bbox) {
        throw new Error('Tầng lõi không tách được (ảnh gần đồng màu). Thêm FAL_KEY để dùng BiRefNet.');
      }
      onProgress(0.8);
      const cutout = encodeImage(core.data, img.w, img.h);
      const mask = encodeImage(alphaToMask(core.data, img.w, img.h), img.w, img.h);
      onProgress(1);
      const warn = core.warnings.length ? ` · ${core.warnings.join(' ')}` : '';
      return {
        cutout: { dataType: 'image', value: cutout },
        mask: { dataType: 'mask', value: mask },
        _tier: tierPort(`Tầng lõi tất định (tách màu nền viền, fg ${(core.fgRatio * 100).toFixed(0)}%)${warn}`),
      };
    },
  },

  // ============ 6) CHỈNH CỤC BỘ ============
  {
    type: 'ai.localedit',
    title: 'Chỉnh cục bộ',
    category: 'AI_EDIT',
    description:
      'Chỉnh đúng vùng mask, phần còn lại giữ nguyên. Chế độ AI: inpaint theo prompt (FLUX Fill, cần key). Chế độ tay / không key: chỉnh sáng·tương phản·bão hoà·nhiệt màu·hue trong vùng mask — tất định, 0đ.',
    inputs: [
      { id: 'image', label: 'Ảnh', dataType: 'image' },
      { id: 'mask', label: 'Mask', dataType: 'mask' },
    ],
    outputs: [{ id: 'image', label: 'Ảnh', dataType: 'image' }],
    params: [
      { kind: 'select', id: 'mode', label: 'Chế độ', options: LOCAL_EDIT_MODES },
      { kind: 'text', id: 'prompt', label: 'Prompt (chế độ AI)', placeholder: 'walnut wood panel, matte finish…', multiline: true },
      { kind: 'slider', id: 'brightness', label: 'Sáng', min: 0.5, max: 1.5, step: 0.02, default: 1 },
      { kind: 'slider', id: 'contrast', label: 'Tương phản', min: 0.5, max: 1.5, step: 0.02, default: 1 },
      { kind: 'slider', id: 'saturate', label: 'Bão hoà', min: 0, max: 2, step: 0.05, default: 1 },
      { kind: 'slider', id: 'temperature', label: 'Ấm ↔ lạnh', min: -1, max: 1, step: 0.05, default: 0 },
      { kind: 'slider', id: 'hue', label: 'Đổi màu (hue °)', min: -180, max: 180, step: 5, default: 0 },
    ],
    creditCost: 0,
    async execute(ctx) {
      const { inputs, params, onProgress } = ctx;
      if (!inputs.image) throw new Error('Thiếu ảnh gốc ở input.');
      if (!inputs.mask) throw new Error('Thiếu mask — nối Mask Painter hoặc ID Mask vào.');
      const wantAi = String(params.mode) === LOCAL_EDIT_MODES[0];
      const prompt = String(params.prompt ?? '').trim();

      if (wantAi && prompt && (await tierProviderReady(ctx))) {
        try {
          const urls = await runImageJob(
            'materialSwap',
            {
              prompt: `${prompt}, photorealistic, seamless with surrounding, matching lighting and perspective`,
              image_url: String(inputs.image.value),
              mask_url: String(inputs.mask.value),
            },
            onProgress,
            ctx.aiTier,
            ctx.oneAiEngine,
          );
          if (urls.length) {
            return {
              image: { dataType: 'image', value: urls[0] },
              _tier: tierPort('Tầng AI · inpaint FLUX Fill (theo prompt)'),
            };
          }
        } catch (err) {
          if (!(err instanceof AiJobError && err.code === 'PROVIDER_NOT_CONFIGURED')) throw err;
        }
      }
      if (wantAi && !prompt) {
        throw new Error('Chế độ AI cần prompt — nhập mô tả vật liệu/đồ mới, hoặc đổi sang "Chỉnh tay vùng mask".');
      }

      // Tầng lõi tất định: chỉnh pixel có trọng số theo mask.
      onProgress(0.25);
      const img = await decodeImage(String(inputs.image.value), 1280);
      let maskBuf: Uint8ClampedArray | null = null;
      try {
        const m = await decodeImage(String(inputs.mask.value), 1280);
        if (m.w === img.w && m.h === img.h) maskBuf = m.data;
        else {
          // mask khác cỡ (cap khác nhau) → scale lại đúng cỡ ảnh
          const c = document.createElement('canvas');
          c.width = img.w;
          c.height = img.h;
          const cx = c.getContext('2d');
          if (cx) {
            cx.drawImage(await loadImage(String(inputs.mask.value)), 0, 0, img.w, img.h);
            maskBuf = cx.getImageData(0, 0, img.w, img.h).data;
          }
        }
      } catch {
        maskBuf = null; // mask hỏng → áp toàn ảnh, tier ghi rõ
      }
      onProgress(0.6);
      const r = applyMaskedAdjust(img.data, maskBuf, img.w, img.h, {
        brightness: Number(params.brightness),
        contrast: Number(params.contrast),
        saturate: Number(params.saturate),
        temperature: Number(params.temperature),
        hueShiftDeg: Number(params.hue),
      });
      onProgress(0.9);
      const out = encodeImage(r.data, img.w, img.h);
      onProgress(1);
      const scope = maskBuf ? `vùng mask ${(r.editedRatio * 100).toFixed(0)}% ảnh` : 'TOÀN ảnh (mask không đọc được)';
      const aiNote = wantAi ? ' — chưa có key inpaint nên chạy lõi' : '';
      return {
        image: { dataType: 'image', value: out },
        _tier: tierPort(`Tầng lõi tất định (chỉnh pixel ${scope})${aiNote}`),
      };
    },
  },
];
