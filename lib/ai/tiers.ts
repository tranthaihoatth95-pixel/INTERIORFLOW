/**
 * Núm "mức phụ thuộc AI" — 4 mức, ánh xạ thẳng vào provider adapter.
 * Xem docs/STRATEGY-ai-tiers-and-safety.md. Không import provider ở đây
 * (dùng được cả client lẫn server); chỉ khai báo metadata + resolve model.
 */
import { AI_TASKS, type AiTask, type TaskModel } from '@/lib/ai/models';

export type AiTier = 1 | 2 | 3 | 4;
/** null = mức 1 (Không AI) — không có provider */
export type ProviderName = 'fal' | 'comfyui' | 'sd';

export interface TierMeta {
  id: AiTier;
  /** tên đầy đủ hiện trong dropdown */
  name: string;
  /** nhãn ngắn cho badge */
  short: string;
  provider: ProviderName | null;
  cost: string;
  /** mô tả 1 dòng — khi nào dùng */
  blurb: string;
}

export const TIERS: Record<AiTier, TierMeta> = {
  4: {
    id: 4,
    name: 'AI Cao',
    short: 'Cao',
    provider: 'fal',
    cost: '~$0.05–0.5/ảnh',
    blurb: 'Chất lượng tối đa (fal FLUX pro, cloud) — ảnh chốt cho khách. Phụ thuộc balance + mạng.',
  },
  3: {
    id: 3,
    name: 'AI Vừa',
    short: 'Vừa',
    provider: 'fal',
    cost: '~$0.01/ảnh',
    blurb: 'Thử nhanh nhiều phương án (fal FLUX schnell) — rẻ, đủ để duyệt bố cục.',
  },
  2: {
    id: 2,
    name: 'oneAI',
    short: 'oneAI',
    provider: 'comfyui',
    cost: '0đ',
    blurb: 'Tự-host 0đ: SD-portable (mọi máy/iPad) hoặc FLUX-RTX (ảnh chốt, máy render). Bản vẽ không rời máy.',
  },
  1: {
    id: 1,
    name: 'Không AI',
    short: 'An toàn',
    provider: null,
    cost: '0đ',
    blurb: 'Chỉ node thủ công + import render Vray/D5 sẵn có. An toàn tuyệt đối, không gọi AI.',
  },
};

/** Thứ tự hiển thị dropdown: cao → thấp */
export const TIER_ORDER: AiTier[] = [4, 3, 2, 1];

/** Mặc định: oneAI tự-host (theo chốt của user — máy render RTX ≥16GB). */
export const DEFAULT_TIER: AiTier = 2;

export function isAiTier(v: unknown): v is AiTier {
  return v === 1 || v === 2 || v === 3 || v === 4;
}

// ============ oneAI (mức 2): engine + runtime chọn được ============
// engine 'sd'   → provider 'sd'      (Stable Diffusion, mọi máy/iPad)
// engine 'flux' → provider 'comfyui' (FLUX+ControlNet RTX, ảnh chốt)
// runtime chỉ áp cho engine 'sd': 'server' (SD_SERVER_URL) | 'webgpu' (client-side, đang phát triển)
export type OneAiEngine = 'sd' | 'flux';
export type OneAiRuntime = 'webgpu' | 'server';

export const DEFAULT_ONE_AI_ENGINE: OneAiEngine = 'sd';
export const DEFAULT_ONE_AI_RUNTIME: OneAiRuntime = 'server';

export interface OneAiEngineMeta { id: OneAiEngine; name: string; blurb: string; }
export const ONE_AI_ENGINES: OneAiEngineMeta[] = [
  { id: 'sd', name: 'SD-portable', blurb: 'Stable Diffusion — chạy mọi máy (Mac M/iPad/Snapdragon). Iterate nhanh, 0đ.' },
  { id: 'flux', name: 'FLUX-RTX', blurb: 'FLUX + ControlNet trên máy render RTX — ảnh chốt quiet-luxury, chất tối đa.' },
];

export interface OneAiRuntimeMeta { id: OneAiRuntime; name: string; blurb: string; }
export const ONE_AI_RUNTIMES: OneAiRuntimeMeta[] = [
  { id: 'server', name: 'Server SD', blurb: 'Draw Things/ComfyUI/A1111 cạnh máy (SD_SERVER_URL) — full ControlNet, nhanh.' },
  { id: 'webgpu', name: 'WebGPU', blurb: 'Chạy thẳng trong trình duyệt trên thiết bị — 0 cài đặt (đang phát triển).' },
];

export function isOneAiEngine(v: unknown): v is OneAiEngine {
  return v === 'sd' || v === 'flux';
}
export function isOneAiRuntime(v: unknown): v is OneAiRuntime {
  return v === 'webgpu' || v === 'server';
}

/** Provider cho tier. Với oneAI (mức 2) phụ thuộc engine đang chọn. */
export function providerForTier(tier: AiTier, engine: OneAiEngine = DEFAULT_ONE_AI_ENGINE): ProviderName | null {
  if (tier === 2) return engine === 'sd' ? 'sd' : 'comfyui';
  return TIERS[tier].provider;
}

/**
 * Chọn model/workflow cụ thể cho (task, tier).
 * - fal + mức 3 (Vừa): dùng biến thể nhanh nếu task có `falFast`.
 * - fal + mức 4 (Cao): model chính `falModel`.
 * - comfyui + mức 2: tên workflow template (`comfy`); throw nếu task chưa hỗ trợ tự-host.
 */
export function resolveModel(
  task: AiTask,
  tier: AiTier,
  engine: OneAiEngine = DEFAULT_ONE_AI_ENGINE,
): { provider: ProviderName; model: string } {
  const provider = providerForTier(tier, engine);
  if (!provider) throw new Error('Mức "Không AI" (1) không gọi provider.');
  const entry: TaskModel = AI_TASKS[task];
  if (provider === 'sd') {
    // SD-portable: dùng model SD riêng nếu khai, không thì mượn workflow ComfyUI (cùng dạng SD).
    const model = entry.sd ?? entry.comfy;
    if (!model) {
      throw new Error(`Task "${task}" chưa có model SD-portable — đổi engine FLUX-RTX hoặc mức AI Cao/Vừa.`);
    }
    return { provider, model };
  }
  if (provider === 'comfyui') {
    if (!entry.comfy) {
      throw new Error(`Task "${task}" chưa có workflow tự-host — chuyển sang mức AI Cao/Vừa hoặc chỉnh tay.`);
    }
    return { provider, model: entry.comfy };
  }
  // fal
  const model = tier === 3 && entry.falFast ? entry.falFast : entry.falModel;
  return { provider, model };
}
