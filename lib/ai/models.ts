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
  /** model/workflow SD-portable (engine 'sd' của oneAI). Không khai → mượn `comfy`. */
  sd?: string;
  typicalMs: number;
  /** task trả video (Kling) khai báo 'video'; còn lại mặc định 'image' */
  mediaType?: 'image' | 'video';
}

export const AI_TASKS = {
  // Line/sketch → render: khoá hình học bằng ControlNet canny.
  // comfy: mặc định 'sketch_flux' (FLUX + ControlNet Union canny) trên máy render RTX.
  // Máy Mac/Apple-Silicon KHÔNG có model FLUX → đặt COMFY_SKETCH_WF=sketch_canny để
  // dùng bản SDXL + ControlNet canny (sketch_canny.json). Không phá path RTX/FLUX.
  sketch2render: {
    falModel: 'fal-ai/flux-pro/v1/canny',
    falFast: 'fal-ai/flux/dev/image-to-image',
    comfy: process.env.COMFY_SKETCH_WF || 'sketch_flux',
    typicalMs: 30000,
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

  // ===== VIDEO (image/text → video) =====
  // Kling image-to-video: mượt cho pan/flythrough nội thất. Job lâu → mediaType 'video'.
  // Turbo Pro: nhanh + rẻ hơn (mặc định). Master: chất lượng cao hơn, chậm hơn.
  // Video chỉ chạy trên fal (mức AI Vừa/Cao) — không có workflow tự-host nên bỏ trường comfy.
  image2video: {
    falModel: 'fal-ai/kling-video/v2.5-turbo/pro/image-to-video',
    typicalMs: 120000,
    mediaType: 'video',
  },
  image2videoMaster: {
    falModel: 'fal-ai/kling-video/v2/master/image-to-video',
    typicalMs: 150000,
    mediaType: 'video',
  },
  // Text → video (không cần ảnh gốc) — dự phòng cho concept clip.
  text2video: {
    falModel: 'fal-ai/kling-video/v2/master/text-to-video',
    typicalMs: 120000,
    mediaType: 'video',
  },
} as const satisfies Record<string, TaskModel>;

export type AiTask = keyof typeof AI_TASKS;

/** Kiểu media task trả về; mặc định 'image' khi không khai báo. */
export type MediaType = 'image' | 'video';

/** Media type của task (task video khai báo mediaType: 'video'; còn lại mặc định 'image'). */
export function taskMediaType(task: AiTask): MediaType {
  return (AI_TASKS[task] as { mediaType?: MediaType }).mediaType ?? 'image';
}

export function isAiTask(key: string): key is AiTask {
  return key in AI_TASKS;
}
