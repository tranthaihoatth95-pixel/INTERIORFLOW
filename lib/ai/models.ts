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
} as const;

export type AiTask = keyof typeof AI_TASKS;

export function isAiTask(key: string): key is AiTask {
  return key in AI_TASKS;
}
