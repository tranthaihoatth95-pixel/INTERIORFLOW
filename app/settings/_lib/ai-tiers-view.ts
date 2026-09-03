/**
 * app/settings/_lib/ai-tiers-view.ts — BỐN MỨC AI + NĂNG LỰC TỪNG NHÀ CUNG CẤP, suy THUẦN từ
 * registry đã có (Slice 10, 03/09). KHÔNG chứa secret, KHÔNG gọi mạng, KHÔNG ghi localStorage.
 *
 * ── LOOK INSIDE TRƯỚC (luật B25) ─────────────────────────────────────────────────────────────
 *  · `lib/ai/tiers.ts` — 4 mức đã có (1 Không AI · 2 oneAI · 3 AI Vừa · 4 AI Cao) + `providerForTier`.
 *    File này KHÔNG thay bảng đó, chỉ ĐỌC và trình lại theo bốn nghĩa người dùng hỏi:
 *    tất định / AI cục bộ / AI chuyên gia kết nối / tổ hợp nhiều AI.
 *  · `lib/ai/models.ts` `AI_TASKS` — task → model mỗi provider. Năng lực provider = SUY từ đây
 *    (fal: mọi task · comfyui: task có `comfy` · sd: task có `sd` hoặc mượn `comfy`), không khai tay.
 *  · `lib/ai/providers/*` — `*Configured()` chỉ đọc env server; client CHỈ nhận boolean qua
 *    `/api/health`. Không có đường nào đưa khoá về client — file này giữ đúng như vậy.
 *  · `lib/ai/text-tier.ts` — chuỗi chữ Cloud(NVIDIA) → Ollama → lõi tất định: ví dụ THẬT của
 *    "tổ hợp nhiều AI" đang chạy trong app (theo tác vụ, không phải nấc toàn cục).
 *
 * ⚠️ ComfyUI KHÔNG phải một model — nó là MÁY CHẠY WORKFLOW; mỗi task trỏ tới một workflow
 *    (`AI_TASKS[task].comfy`) và workflow đó nạp model gì là do máy chủ ComfyUI quyết định.
 *    `providerCapabilities('comfyui').workflows` liệt kê đúng các workflow, không gộp thành "1 model".
 *
 * Import TƯƠNG ĐỐI — file test chạy thẳng qua `sucrase-node` (`tiers.ts`/`models.ts` cũng tương đối).
 */
import { AI_TASKS, type AiTask, taskMediaType } from '../../../lib/ai/models';
import { TIERS, providerForTier, type AiTier, type OneAiEngine, type ProviderName } from '../../../lib/ai/tiers';

/* ═══════════════════════════ ① Bốn mức theo NGHĨA ═══════════════════════════ */

export type FourTierId = 'deterministic' | 'local' | 'connected' | 'orchestrated';

export interface FourTierView {
  id: FourTierId;
  label: string;
  labelEn: string;
  /** 1 câu: mức này nghĩa là gì với dữ liệu + tiền */
  blurb: string;
  blurbEn: string;
  /** mức `aiTier` (lib/ai/tiers.ts) tương ứng — [] = chưa có nấc toàn cục (nói thật) */
  aiTiers: AiTier[];
  /** provider đứng sau (suy từ providerForTier) */
  providers: ProviderName[];
  privacy: 'on-device' | 'lan' | 'cloud' | 'none';
  offline: boolean;
  costHint: string;
  /** chỗ nào trong app đang thi hành mức này (bằng chứng, không hứa) */
  evidence: string[];
}

export function fourTierViews(engine: OneAiEngine): FourTierView[] {
  const localProvider = providerForTier(2, engine);
  return [
    {
      id: 'deterministic',
      label: 'Tất định — không AI',
      labelEn: 'Deterministic — no AI',
      blurb: 'Chỉ khối chỉnh tay, đo, bảng, slide. 0đ, chạy 10 lần ra 10 kết quả giống nhau, không dữ liệu nào rời máy.',
      blurbEn: 'Manual, measuring, tables, slides only. Free, repeatable, nothing leaves the machine.',
      aiTiers: [1],
      providers: [],
      privacy: 'none',
      offline: true,
      costHint: TIERS[1].cost,
      evidence: ['registry.ts aiImages(): mức 1 ném lỗi rõ cho khối AI, không mock lén', 'lib/review: kiểm chuẩn = máy, không AI'],
    },
    {
      id: 'local',
      label: 'AI cục bộ (tự-host)',
      labelEn: 'Local AI (self-hosted)',
      blurb: 'Máy chạy workflow của bạn (ComfyUI/SD) trong LAN. 0đ/ảnh, bản vẽ không ra cloud; cần máy có GPU.',
      blurbEn: 'Your own workflow server (ComfyUI/SD) on the LAN. Free per image, drawings stay in-house; needs a GPU box.',
      aiTiers: [2],
      providers: localProvider ? [localProvider] : [],
      privacy: 'lan',
      offline: true,
      costHint: TIERS[2].cost,
      evidence: ['providerForTier(2, engine) → comfyui | sd', 'text-tier.ts: Ollama local cho tác vụ chữ'],
    },
    {
      id: 'connected',
      label: 'AI chuyên gia kết nối',
      labelEn: 'Connected specialist AI',
      blurb: 'Gọi model chuyên biệt qua mạng (FLUX/Kling/SAM…). Trả theo lượt, ảnh đi ra ngoài — chỉ dùng cho ảnh chốt.',
      blurbEn: 'Specialist models over the network (FLUX/Kling/SAM…). Pay per call, images leave the machine — for final shots.',
      aiTiers: [3, 4],
      providers: ['fal'],
      privacy: 'cloud',
      offline: false,
      costHint: `${TIERS[3].cost} · ${TIERS[4].cost}`,
      evidence: ['providerForTier(3|4) → fal', 'video (Kling) chỉ có ở mức này — registry.ts aiVideo()'],
    },
    {
      id: 'orchestrated',
      label: 'Tổ hợp nhiều AI',
      labelEn: 'Orchestrated multi-AI',
      blurb: 'Một khối gọi nhiều model nối tiếp (tách nền → inpaint · cloud → local dự phòng). Hiện là theo TỪNG KHỐI, chưa có nấc toàn cục.',
      blurbEn: 'One block chains several models (segment → inpaint · cloud → local fallback). Today per BLOCK — no global tier yet.',
      aiTiers: [],
      providers: [],
      privacy: 'cloud',
      offline: false,
      costHint: 'theo từng khối · per block',
      evidence: ['ai.localedit: BiRefNet → FLUX Fill', 'ai.regionrender: phiếu → mask → inpaint từng mảng', 'text-tier.ts: NVIDIA → Ollama → lõi tất định'],
    },
  ];
}

/** Mức `aiTier` đang chọn rơi vào nghĩa nào. */
export function fourTierOf(aiTier: AiTier): FourTierId {
  if (aiTier === 1) return 'deterministic';
  if (aiTier === 2) return 'local';
  return 'connected';
}

/* ═══════════════════════════ ② Năng lực từng provider (suy từ AI_TASKS) ═══════════════════════════ */

export interface ProviderFacts {
  id: ProviderName;
  name: string;
  /** đúng bản chất — ComfyUI là máy chạy workflow, không phải model */
  kind: 'cloud-api' | 'workflow-runner' | 'inference-server';
  privacy: 'cloud' | 'lan';
  offline: boolean;
  costHint: string;
  /** tên biến môi trường SERVER cần có — CHỈ tên, không bao giờ là giá trị */
  envVars: string[];
  /** thay provider bằng cách nào — thao tác thật, không hứa */
  replaceHow: string;
  replaceHowEn: string;
}

export const PROVIDER_FACTS: Record<ProviderName, ProviderFacts> = {
  fal: {
    id: 'fal',
    name: 'fal.ai',
    kind: 'cloud-api',
    privacy: 'cloud',
    offline: false,
    costHint: 'trả theo lượt (số dư fal)',
    envVars: ['FAL_KEY'],
    replaceHow: 'Đổi model từng tác vụ ở lib/ai/models.ts (falModel/falFast); đổi nhà cung cấp cloud khác = thêm adapter trong lib/ai/providers/ rồi trỏ ở providers/index.ts.',
    replaceHowEn: 'Swap per-task models in lib/ai/models.ts (falModel/falFast); another cloud vendor = add an adapter in lib/ai/providers/ and route it in providers/index.ts.',
  },
  comfyui: {
    id: 'comfyui',
    name: 'ComfyUI (máy chạy workflow)',
    kind: 'workflow-runner',
    privacy: 'lan',
    offline: true,
    costHint: '0đ/ảnh · điện + GPU của bạn',
    envVars: ['COMFYUI_URL', 'COMFY_SKETCH_WF (tuỳ chọn)'],
    replaceHow: 'Trỏ COMFYUI_URL sang máy khác; đổi workflow từng tác vụ ở lib/ai/models.ts (comfy) hoặc COMFY_SKETCH_WF. Model do workflow nạp — không cấu hình ở IF.',
    replaceHowEn: 'Point COMFYUI_URL at another box; swap per-task workflows in lib/ai/models.ts (comfy) or COMFY_SKETCH_WF. Models are loaded by the workflow, not configured in IF.',
  },
  sd: {
    id: 'sd',
    name: 'SD server (A1111 / Draw Things)',
    kind: 'inference-server',
    privacy: 'lan',
    offline: true,
    costHint: '0đ/ảnh · máy của bạn',
    envVars: ['SD_SERVER_URL', 'SD_CN_MODEL (tuỳ chọn)'],
    replaceHow: 'Trỏ SD_SERVER_URL sang server khác; model ControlNet qua SD_CN_MODEL; task chưa có bản SD thì mượn workflow ComfyUI cùng tên.',
    replaceHowEn: 'Point SD_SERVER_URL at another server; ControlNet model via SD_CN_MODEL; tasks without an SD entry borrow the ComfyUI workflow of the same name.',
  },
};

export interface ProviderCapabilities {
  id: ProviderName;
  /** task chạy được */
  tasks: AiTask[];
  /** task KHÔNG chạy được ở provider này (phải đổi mức) */
  missing: AiTask[];
  /** có video không */
  video: boolean;
  /** riêng comfyui/sd: các workflow khác nhau đang được trỏ tới (không phải "1 model") */
  workflows: string[];
}

export function providerCapabilities(id: ProviderName): ProviderCapabilities {
  const all = Object.keys(AI_TASKS) as AiTask[];
  const tasks: AiTask[] = [];
  const missing: AiTask[] = [];
  const workflows = new Set<string>();
  for (const t of all) {
    const e = AI_TASKS[t] as { comfy?: string; sd?: string; falModel: string };
    let model: string | undefined;
    if (id === 'fal') model = e.falModel;
    else if (id === 'comfyui') model = e.comfy;
    else model = e.sd ?? e.comfy;
    if (model) {
      tasks.push(t);
      if (id !== 'fal') workflows.add(model);
    } else missing.push(t);
  }
  return {
    id,
    tasks,
    missing,
    video: tasks.some((t) => taskMediaType(t) === 'video'),
    workflows: [...workflows].sort(),
  };
}

/* ═══════════════════════════ ③ Kiểm tra kết nối — chỉ đọc boolean từ server ═══════════════════════════ */

export interface ProviderProbe {
  id: ProviderName;
  /** server thấy biến môi trường — KHÔNG phải "đã ping thành công" (health route không ping) */
  configured: boolean;
}

export interface ProbeResult {
  ok: boolean;
  /** ms cho lượt gọi /api/health */
  latencyMs: number;
  providers: ProviderProbe[];
  error?: string;
}

/** Đọc /api/health (không cache) → boolean từng provider. Không có secret nào trong body. */
export async function probeProviders(fetchFn: typeof fetch = fetch): Promise<ProbeResult> {
  const t0 = Date.now();
  try {
    const res = await fetchFn('/api/health', { cache: 'no-store' });
    const j = (await res.json()) as { providers?: Record<string, unknown> };
    const p = j.providers ?? {};
    return {
      ok: res.ok,
      latencyMs: Date.now() - t0,
      providers: (['fal', 'comfyui', 'sd'] as ProviderName[]).map((id) => ({ id, configured: Boolean(p[id]) })),
    };
  } catch (err) {
    return {
      ok: false,
      latencyMs: Date.now() - t0,
      providers: (['fal', 'comfyui', 'sd'] as ProviderName[]).map((id) => ({ id, configured: false })),
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/** Chuỗi nào trông như secret thì KHÔNG được lọt vào text hiển thị/log — guard dùng ở UI + test. */
export function redactSecrets(text: string): string {
  return text
    .replace(/(FAL_KEY|NVIDIA_API_KEY|SD_CN_MODEL)\s*[=:]\s*\S+/gi, '$1=•••')
    .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}:[0-9a-f]{16,}\b/gi, '•••')
    .replace(/\bBearer\s+\S+/gi, 'Bearer •••');
}
