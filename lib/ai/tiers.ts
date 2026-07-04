/**
 * Núm "mức phụ thuộc AI" — 4 mức, ánh xạ thẳng vào provider adapter.
 * Xem docs/STRATEGY-ai-tiers-and-safety.md. Không import provider ở đây
 * (dùng được cả client lẫn server); chỉ khai báo metadata + resolve model.
 */
import { AI_TASKS, type AiTask, type TaskModel } from '@/lib/ai/models';

export type AiTier = 1 | 2 | 3 | 4;
/** null = mức 1 (Không AI) — không có provider */
export type ProviderName = 'fal' | 'comfyui';

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
    name: 'Tự-host',
    short: '0đ',
    provider: 'comfyui',
    cost: '0đ',
    blurb: 'ComfyUI + FLUX/ControlNet trên máy render công ty — 0đ/ảnh, bản vẽ không rời máy. Mức khuyến nghị.',
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

/** Mặc định: tự-host (theo chốt của user — máy render RTX ≥16GB). */
export const DEFAULT_TIER: AiTier = 2;

export function isAiTier(v: unknown): v is AiTier {
  return v === 1 || v === 2 || v === 3 || v === 4;
}

export function providerForTier(tier: AiTier): ProviderName | null {
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
): { provider: ProviderName; model: string } {
  const provider = providerForTier(tier);
  if (!provider) throw new Error('Mức "Không AI" (1) không gọi provider.');
  const entry: TaskModel = AI_TASKS[task];
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
