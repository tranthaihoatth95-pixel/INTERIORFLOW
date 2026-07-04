/**
 * Map task → model của từng provider.
 * Client chỉ gửi task key (+ tier), server resolve sang model id — không cho submit model tuỳ ý.
 * Đổi provider/model chỉ sửa ở đây + providers/, không đụng node logic.
 *
 * - `falModel`  : model fal chính (mức 4 — AI Cao).
 * - `falFast`   : biến thể fal rẻ/nhanh (mức 3 — AI Vừa). Không có thì mức 3 dùng `falModel`.
 * - `comfy`     : tên workflow template ComfyUI (mức 2 — Tự-host). Không có = task chưa hỗ trợ tự-host.
 * - `typicalMs` : thời gian điển hình để ước lượng progress (ms).
 */
export interface TaskModel {
  falModel: string;
  falFast?: string;
  comfy?: string;
  typicalMs: number;
}

export const AI_TASKS = {
  // Line/sketch → render: khoá hình học bằng ControlNet canny
  sketch2render: {
    falModel: 'fal-ai/flux-pro/v1/canny',
    falFast: 'fal-ai/flux/dev/image-to-image',
    comfy: 'sketch_canny',
    typicalMs: 25000,
  },
  // Clay/white render (từ 3ds Max) → photoreal: ControlNet DEPTH khoá khối tốt hơn canny.
  // Đây là node cốt lõi cho quy trình clay→AI của công ty (xem STRATEGY §0b).
  clay2render: {
    falModel: 'fal-ai/flux-pro/v1/depth',
    falFast: 'fal-ai/flux-control-lora-depth/image-to-image',
    comfy: 'clay_depth',
    typicalMs: 26000,
  },
  exterior: {
    falModel: 'fal-ai/flux-pro/v1/canny',
    comfy: 'sketch_canny',
    typicalMs: 25000,
  },
  styleTransfer: {
    falModel: 'fal-ai/flux/dev/image-to-image',
    comfy: 'img2img',
    typicalMs: 20000,
  },
  staging: {
    falModel: 'fal-ai/flux/dev/image-to-image',
    comfy: 'img2img',
    typicalMs: 22000,
  },
  moodboard: {
    falModel: 'fal-ai/flux/schnell',
    comfy: 'text2img',
    typicalMs: 10000,
  },
  upscale: {
    falModel: 'fal-ai/esrgan',
    comfy: 'upscale',
    typicalMs: 15000,
  },
  materialSwap: {
    falModel: 'fal-ai/flux-pro/v1/fill',
    comfy: 'inpaint',
    typicalMs: 25000,
  },
  furnitureEdit: {
    falModel: 'fal-ai/flux-pro/v1/fill',
    comfy: 'inpaint',
    typicalMs: 25000,
  },
  relight: {
    falModel: 'fal-ai/iclight-v2',
    typicalMs: 22000,
  },
  removeBg: {
    falModel: 'fal-ai/birefnet/v2',
    typicalMs: 10000,
  },
} as const satisfies Record<string, TaskModel>;

export type AiTask = keyof typeof AI_TASKS;

export function isAiTask(key: string): key is AiTask {
  return key in AI_TASKS;
}
