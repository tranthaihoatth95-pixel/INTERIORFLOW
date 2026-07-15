/**
 * Provider NVIDIA — Free Endpoint ở build.nvidia.com (`integrate.api.nvidia.com/v1`,
 * chuẩn OpenAI-compatible). CHỈ import phía server (giữ NVIDIA_API_KEY).
 *
 * Cơ chế "linh hoạt" (theo chốt của user): **CHỈ BÁO, KHÔNG tự tụt**. Hết free / rate-limit
 * → ném `NvidiaFreeExhausted` để lớp trên hiện thông báo cho user tự đổi nguồn (local/oneAI),
 * KHÔNG âm thầm fallback.
 *
 * Free Endpoint mạnh cho: LLM (Concept-writer), VLM (auto-caption ref), OCR (đọc brief).
 * Lấy key free: build.nvidia.com → API key → thêm NVIDIA_API_KEY vào .env.local.
 */
const BASE = () => (process.env.NVIDIA_BASE_URL ?? 'https://integrate.api.nvidia.com/v1').replace(/\/+$/, '');

export function nvidiaConfigured() {
  return Boolean(process.env.NVIDIA_API_KEY);
}

/** Hết lượt free / rate-limit — lớp trên CHỈ BÁO, không tự tụt xuống local. */
export class NvidiaFreeExhausted extends Error {}
export class NvidiaError extends Error {}

type Content = string | Array<{ type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } }>;
interface Msg { role: 'system' | 'user' | 'assistant'; content: Content }

async function chat(model: string, messages: Msg[], opts: { max_tokens?: number; temperature?: number } = {}): Promise<string> {
  if (!nvidiaConfigured()) throw new NvidiaError('NVIDIA_API_KEY chưa cấu hình — tạo free ở build.nvidia.com rồi thêm vào .env.local.');
  let res: Response;
  try {
    res = await fetch(`${BASE()}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.NVIDIA_API_KEY}` },
      body: JSON.stringify({ model, messages, temperature: opts.temperature ?? 0.2, max_tokens: opts.max_tokens ?? 512 }),
    });
  } catch {
    throw new NvidiaError('Mất kết nối tới NVIDIA API.');
  }
  if (res.status === 401 || res.status === 403) throw new NvidiaError('NVIDIA_API_KEY sai hoặc không đủ quyền.');
  if (res.status === 402 || res.status === 429) throw new NvidiaFreeExhausted('NVIDIA free hết lượt / rate-limit.');
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new NvidiaError(`NVIDIA lỗi HTTP ${res.status}${t ? `: ${t.slice(0, 180)}` : ''}.`);
  }
  const j = (await res.json().catch(() => ({}))) as { choices?: { message?: { content?: string } }[] };
  return j.choices?.[0]?.message?.content ?? '';
}

export interface RefCaption { caption: string; style: string; materials: string[]; room: string }

/** VLM: đọc ảnh ref nội thất → JSON chưng cất (caption/style/vật liệu/loại phòng). */
export async function captionImage(imageDataUri: string): Promise<RefCaption> {
  const model = process.env.NVIDIA_VLM_MODEL ?? 'meta/llama-3.2-11b-vision-instruct';
  const prompt =
    'Bạn là chuyên gia nội thất. Nhìn ảnh và CHỈ trả về JSON thuần (không giải thích, không ```): ' +
    '{"caption":"<1 câu tiếng Việt mô tả không gian & vật liệu chính>","style":"<phong cách, vd Japandi / Quiet-luxury>",' +
    '"materials":["<vật liệu>","..."],"room":"<loại phòng>"}';
  const raw = await chat(
    model,
    [{ role: 'user', content: [{ type: 'text', text: prompt }, { type: 'image_url', image_url: { url: imageDataUri } }] }],
    { max_tokens: 320 },
  );
  const m = raw.match(/\{[\s\S]*\}/);
  try {
    const j = JSON.parse(m ? m[0] : raw) as Partial<RefCaption>;
    return {
      caption: String(j.caption ?? '').slice(0, 200),
      style: String(j.style ?? ''),
      materials: Array.isArray(j.materials) ? j.materials.map(String).slice(0, 8) : [],
      room: String(j.room ?? ''),
    };
  } catch {
    return { caption: raw.slice(0, 160), style: '', materials: [], room: '' };
  }
}

/** LLM thuần (Concept-writer, tóm tắt brief…). */
export async function completeText(prompt: string, system?: string): Promise<string> {
  const model = process.env.NVIDIA_LLM_MODEL ?? 'nvidia/llama-3.1-nemotron-70b-instruct';
  const msgs: Msg[] = [];
  if (system) msgs.push({ role: 'system', content: system });
  msgs.push({ role: 'user', content: prompt });
  return chat(model, msgs, { max_tokens: 700 });
}

/* ───────────────────────────── IMAGE GEN (NIM invoke riêng) ─────────────────────────────
 * Image-gen của NVIDIA KHÔNG đi qua `/v1/images/generations` OpenAI-compatible mà dùng
 * endpoint invoke riêng theo model: `https://ai.api.nvidia.com/v1/genai/{model}`.
 *
 * MODEL CHỐT: `black-forest-labs/flux.1-dev` — đã PROBE THẬT với key user (15/07):
 * các endpoint stabilityai (SD3-medium/3.5/SDXL/sdxl-turbo) đều 404 cho account free này,
 * flux.1-dev trả 200 (~2s). Schema FLUX (học từ validation error của chính endpoint):
 *   body    { prompt, mode:'base'|'canny'|'depth', width, height ∈ {768..1344 bước 64},
 *             cfg_scale ≤ 9, seed, steps } — KHÔNG nhận negative_prompt/aspect_ratio.
 *   response{ artifacts:[{ base64 (JPEG), finishReason, seed }] }
 * Đổi model qua env NVIDIA_IMAGE_MODEL; model 'stabilityai/*' tự chuyển body sang schema
 * SD3 (aspect_ratio + negative_prompt); parser chịu cả 2 shape response nên swap không vỡ.
 *
 * Degrade khi CHƯA có NVIDIA_API_KEY: throw NvidiaError message rõ ràng (đúng cơ chế
 * "CHỈ BÁO, KHÔNG tự tụt" đầu file) — caller (node 2 tầng) bắt lỗi rồi chạy tầng lõi.
 */

export const NVIDIA_IMAGE_MODEL_DEFAULT = 'black-forest-labs/flux.1-dev';

const GENAI_BASE = () =>
  (process.env.NVIDIA_GENAI_BASE_URL ?? 'https://ai.api.nvidia.com/v1/genai').replace(/\/+$/, '');

export function nvidiaImageModel(): string {
  return process.env.NVIDIA_IMAGE_MODEL ?? NVIDIA_IMAGE_MODEL_DEFAULT;
}

/** Tỉ lệ khung node ('16:9' | '4:3' | '1:1' | '9:16') → aspect_ratio SD3 hợp lệ. */
export function nvidiaAspect(ratio: string | undefined): string {
  const allowed = new Set(['1:1', '4:3', '3:4', '16:9', '9:16', '21:9', '9:21', '5:4', '4:5', '3:2', '2:3']);
  return ratio && allowed.has(ratio) ? ratio : '16:9';
}

/** Tỉ lệ khung → width/height hợp lệ của FLUX NIM (chỉ nhận 768…1344 bước 64). */
export function nvidiaFluxDims(ratio: string | undefined): { width: number; height: number } {
  switch (ratio) {
    case '1:1':
      return { width: 1024, height: 1024 };
    case '4:3':
      return { width: 1024, height: 768 };
    case '3:4':
      return { width: 768, height: 1024 };
    case '9:16':
      return { width: 768, height: 1344 };
    default: // 16:9 (1344/768 = 1.75 — sát 16:9 nhất trong lưới 64px)
      return { width: 1344, height: 768 };
  }
}

/** Model thuộc họ FLUX NIM (schema width/height/mode) — còn lại coi như schema SD3. */
export function isFluxModel(model: string): boolean {
  return /flux/i.test(model);
}

/** base64 → data-URI, sniff magic bytes (PNG 'iVBOR' / JPEG '/9j/') — SD3 trả JPEG, SDXL PNG. */
export function b64ToDataUri(b64: string): string {
  const mime = b64.startsWith('iVBOR') ? 'image/png' : b64.startsWith('/9j/') ? 'image/jpeg' : 'image/png';
  return `data:${mime};base64,${b64}`;
}

/** Rút base64 ảnh từ response — chịu cả 2 shape: SD3 `{image}` và SDXL `{artifacts:[{base64}]}`. */
export function extractImageB64(json: unknown): string | null {
  const j = json as { image?: unknown; artifacts?: Array<{ base64?: unknown }>; b64_json?: unknown };
  if (typeof j?.image === 'string' && j.image.length > 0) return j.image;
  const art = Array.isArray(j?.artifacts) ? j.artifacts[0] : undefined;
  if (art && typeof art.base64 === 'string' && art.base64.length > 0) return art.base64;
  if (typeof j?.b64_json === 'string' && j.b64_json.length > 0) return j.b64_json;
  return null;
}

export interface NvidiaImageOptions {
  prompt: string;
  negativePrompt?: string;
  /** '16:9' | '1:1' | … — map qua nvidiaAspect, mặc định 16:9 */
  ratio?: string;
  /** 0 = random phía server */
  seed?: number;
  steps?: number;
  cfgScale?: number;
}

export interface NvidiaImageResult {
  /** data-URI ảnh (image/jpeg hoặc image/png) */
  dataUri: string;
  /** model đã invoke — UI ghi rõ tầng nào chạy, không mock im lặng */
  model: string;
}

/** Text → 1 ảnh qua NVIDIA NIM invoke. Thiếu key → NvidiaError; hết free → NvidiaFreeExhausted. */
export async function generateImage(opts: NvidiaImageOptions): Promise<NvidiaImageResult> {
  if (!nvidiaConfigured()) {
    throw new NvidiaError('NVIDIA_API_KEY chưa cấu hình — tạo free ở build.nvidia.com rồi thêm vào .env.local.');
  }
  const model = nvidiaImageModel();
  const steps = Math.min(50, Math.max(1, opts.steps ?? 25));
  const seed = opts.seed ?? 0;
  // Body theo họ model: FLUX (width/height/mode, cfg ≤ 9, KHÔNG negative) vs SD3 (aspect_ratio).
  const body = isFluxModel(model)
    ? { prompt: opts.prompt, mode: 'base', ...nvidiaFluxDims(opts.ratio), cfg_scale: Math.min(9, opts.cfgScale ?? 3.5), seed, steps }
    : {
        prompt: opts.prompt,
        negative_prompt: opts.negativePrompt ?? '',
        cfg_scale: opts.cfgScale ?? 5,
        aspect_ratio: nvidiaAspect(opts.ratio),
        seed,
        steps,
      };
  const invoke = async (): Promise<Response> => {
    try {
      return await fetch(`${GENAI_BASE()}/${model}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${process.env.NVIDIA_API_KEY}`,
        },
        body: JSON.stringify(body),
      });
    } catch {
      throw new NvidiaError('Mất kết nối tới NVIDIA API (ai.api.nvidia.com).');
    }
  };
  let res = await invoke();
  // NIM free thỉnh thoảng 5xx transient (đo thật 15/07: 500 rồi 200 ngay sau) — retry ĐÚNG 1 lần.
  if (res.status >= 500) res = await invoke();
  if (res.status === 404) {
    throw new NvidiaError(`Model "${model}" không có trên account này (404) — đổi NVIDIA_IMAGE_MODEL (đã probe OK: black-forest-labs/flux.1-dev).`);
  }
  if (res.status === 401 || res.status === 403) throw new NvidiaError('NVIDIA_API_KEY sai hoặc không đủ quyền.');
  if (res.status === 402 || res.status === 429) throw new NvidiaFreeExhausted('NVIDIA free hết lượt / rate-limit.');
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new NvidiaError(`NVIDIA image lỗi HTTP ${res.status}${t ? `: ${t.slice(0, 180)}` : ''}.`);
  }
  const json = (await res.json().catch(() => null)) as unknown;
  const b64 = extractImageB64(json);
  if (!b64) throw new NvidiaError('NVIDIA không trả về ảnh (response thiếu image/artifacts).');
  return { dataUri: b64ToDataUri(b64), model };
}
