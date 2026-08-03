/**
 * Núm "mức phụ thuộc AI" — 4 mức, ánh xạ thẳng vào provider adapter.
 * Xem docs/STRATEGY-ai-tiers-and-safety.md. Không import provider ở đây
 * (dùng được cả client lẫn server); chỉ khai báo metadata + resolve model.
 *
 * Import TƯƠNG ĐỐI (không alias '@/') — file test được thẳng qua `sucrase-node`
 * (`tiers.test.ts`), alias chỉ resolve qua bundler Next.js (cùng quy ước `lib/commands/registry.ts`).
 */
import { AI_TASKS, type AiTask, type TaskModel } from './models';

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

// 08/07: default 'flux' (→ provider comfyui) — Mac + RTX công ty đều chạy ComfyUI thật;
// 'sd' (A1111/Draw Things) vẫn chọn được ở engine-selector khi có SD_SERVER_URL.
export const DEFAULT_ONE_AI_ENGINE: OneAiEngine = 'flux';
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

/**
 * Giá credit theo `task` — kế toán TẠI SERVER cho `/api/jobs` (vá `docs/AUDIT-BACKEND-2026-08-03.md`
 * §5.2/R2: trước đây route này KHÔNG đụng credit gì cả, kế toán chỉ nằm ở client
 * `lib/execution.ts` — gọi thẳng `/api/jobs` bằng curl đốt provider thật mà không mất 1 credit).
 * Số ĐÚNG BẰNG `creditCost` khai ở node tương ứng trong `lib/nodes/registry.ts`/`defs/*.ts` (đối
 * chiếu 03/08, 1 nguồn giá — không suy đoán số mới). KHÔNG đổi theo `tier`: credit hôm nay là
 * đồng hồ đo mức DÙNG trong app (không phải giá tiền provider thật) — dùng oneAI (tier 2, "0đ"
 * provider thật) vẫn tốn credit y như fal (tier 4, tốn tiền thật), đúng hành vi khách đang thấy;
 * đổi việc đó là quyết định GIÁ, không phải vá bảo mật, không tự ý đổi ở đây.
 *
 * ⚠️ Đánh đổi ĐÃ BIẾT, cần Hoà chốt sau (không tự quyết, chỉ ghi rõ để không giấu — cùng tinh
 * thần audit §5.3 "cần Hoà chốt"): 3 nơi gọi `runImageJob` KHÔNG qua `lib/execution.ts` (nên
 * trước đây KHÔNG tính credit theo thiết kế, xem comment tại chỗ gọi):
 *  - `ai.idmask`/`ai.localedit` (`lib/nodes/defs/render-v2.ts`, `creditCost:0`) gọi
 *    `runImageJob('removeBg'|'materialSwap', …)` như 1 TẦNG NÂNG CAO TUỲ CHỌN, lỗi thì rơi về
 *    tầng lõi tất định (try/catch nuốt lỗi, không crash).
 *  - `ai.smartselect`'s modal (`components/smartselect/SmartSelectModal.tsx:286`) gọi
 *    `runImageJob('segment', …)` với comment gốc "không tính credit lần chạy lại".
 * Bảng giá này tính theo TASK (không biết ai gọi) nên CẢ BA sẽ bắt đầu tốn credit khi thành công.
 * Đây là ĐÁNH ĐỔI BẮT BUỘC của việc đóng lỗ R2: 1 task ĐÃ ĐƯỢC GIÁ thì không thể vừa chặn được
 * abuse trực tiếp (curl thẳng `/api/jobs`) vừa cho phép gọi miễn phí từ 1 nơi khác — máy chủ
 * không phân biệt được lời gọi nào "chính chủ enhancement" hay "curl trần". Ưu tiên đóng lỗ bảo
 * mật (R2 là 🔴) hơn giữ đúng nguyên trải nghiệm "0đ" của 2 node phụ này.
 */
export const TASK_CREDIT_COST: Record<AiTask, number> = {
  sketch2render: 4,
  clay2render: 4,
  exterior: 4,
  styleTransfer: 3,
  staging: 3,
  moodboard: 2,
  pattern: 3,
  patternRef: 3,
  upscale: 2,
  materialSwap: 4,
  furnitureEdit: 4,
  relight: 3,
  removeBg: 1,
  segment: 1,
  image2video: 8,
  image2videoMaster: 8,
  text2video: 8,
};

/** Giá credit của 1 lượt `/api/jobs` cho `task` này — 0 nếu task lạ (không nên xảy ra, `isAiTask`
 * đã gate trước khi gọi hàm này). */
export function costOfTask(task: AiTask): number {
  return TASK_CREDIT_COST[task] ?? 0;
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
