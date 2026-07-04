/**
 * Map task → model endpoint của provider hiện tại (fal.ai).
 * Client chỉ gửi task key, server map sang model id — không cho submit model tuỳ ý.
 * Đổi provider/model chỉ sửa ở đây + providers/, không đụng node logic.
 */
export const AI_TASKS = {
  sketch2render: {
    falModel: 'fal-ai/flux-pro/v1/canny',
    /** thời gian điển hình để ước lượng progress (ms) */
    typicalMs: 25000,
  },
  exterior: {
    falModel: 'fal-ai/flux-pro/v1/canny',
    typicalMs: 25000,
  },
  styleTransfer: {
    falModel: 'fal-ai/flux/dev/image-to-image',
    typicalMs: 20000,
  },
  staging: {
    falModel: 'fal-ai/flux/dev/image-to-image',
    typicalMs: 22000,
  },
  moodboard: {
    falModel: 'fal-ai/flux/schnell',
    typicalMs: 10000,
  },
  upscale: {
    falModel: 'fal-ai/esrgan',
    typicalMs: 15000,
  },
  materialSwap: {
    falModel: 'fal-ai/flux-pro/v1/fill',
    typicalMs: 25000,
  },
  furnitureEdit: {
    falModel: 'fal-ai/flux-pro/v1/fill',
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
} as const;

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
