/**
 * Provider OLLAMA — AI CHỮ chạy LOCAL (offline, 0đ, KHÔNG cần key), server OpenAI-compatible
 * ở `http://localhost:11434`. CHỈ import phía server. Đây là TẦNG GIỮA trong kiến trúc AI:
 *
 *     Cloud AI (NVIDIA/fal, có key) → OLLAMA local (không key, offline) → LÕI tất định (không AI)
 *
 * Chỉ phục vụ tác vụ CHỮ (concept-writer, tóm tắt brief, giải thích…). KHÔNG sinh ảnh local
 * (Mac 16GB không kham nổi model ảnh — cấm theo memory dự án).
 *
 * Cơ chế "TỰ DÒ, không mock im lặng": `isOllamaAvailable()` ping /api/tags (timeout ngắn, 1 lần).
 * Có Ollama chạy → bật tầng local; không → caller bỏ qua, tụt xuống lõi tất định. Mọi lỗi ném
 * `OllamaError` rõ ràng để lớp trên hiện thông báo — KHÔNG tự giả kết quả.
 *
 * Cài & model: `ollama serve` (mặc định :11434) + model đã kéo (llama3 / gemma…). Đổi model qua
 * env `OLLAMA_MODEL`; đổi host qua `OLLAMA_BASE_URL`.
 */
const BASE = () => (process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434').replace(/\/+$/, '');

/**
 * Model mặc định: `llama3:latest` — probe THẬT (15/07, server local): cả llama3 và gemma đều trả
 * tiếng Việt hợp lệ, nhưng llama3 NHANH hơn (~2s vs ~15s) và BÁM yêu cầu "chỉ trả phần chữ" (trả
 * thẳng tiêu đề), trong khi gemma dài dòng thêm phần giải thích — không hợp copywriter súc tích.
 * Đổi bằng env `OLLAMA_MODEL`. Nếu model này không có trong danh sách đã kéo, `resolveOllamaModel`
 * tự chọn model sẵn có đầu tiên (không tự `ollama pull`).
 */
export const OLLAMA_MODEL_DEFAULT = 'llama3:latest';

/** Timeout dò khả dụng (ms) — ngắn, 1 lần, KHÔNG retry vô hạn (server local phải phản hồi nhanh). */
export const OLLAMA_PROBE_TIMEOUT_MS = 2000;
/** Timeout sinh chữ (ms) — model local có thể chậm (nhất là lần nạp đầu), cho rộng rãi. */
export const OLLAMA_CHAT_TIMEOUT_MS = 120000;

/** Lỗi Ollama — lớp trên CHỈ BÁO, tụt xuống lõi tất định, không giả kết quả. */
export class OllamaError extends Error {}

interface Msg { role: 'system' | 'user' | 'assistant'; content: string }

/**
 * Rút phần chữ từ response — chịu CẢ 2 shape:
 *  - OpenAI-compatible (`/v1/chat/completions`): `{ choices:[{ message:{ content } }] }`
 *  - native Ollama (`/api/chat`):                `{ message:{ content } }`
 * Trả '' nếu không tìm thấy (caller coi rỗng = thất bại, không mock).
 */
export function parseChatContent(json: unknown): string {
  const j = json as {
    choices?: Array<{ message?: { content?: unknown } }>;
    message?: { content?: unknown };
  };
  const fromChoices = j?.choices?.[0]?.message?.content;
  if (typeof fromChoices === 'string' && fromChoices.length > 0) return fromChoices;
  const fromNative = j?.message?.content;
  if (typeof fromNative === 'string' && fromNative.length > 0) return fromNative;
  return '';
}

/** Rút danh sách tên model từ response /api/tags: `{ models:[{ name }] }`. */
export function parseModelList(json: unknown): string[] {
  const j = json as { models?: Array<{ name?: unknown }> };
  if (!Array.isArray(j?.models)) return [];
  return j.models.map((m) => (typeof m?.name === 'string' ? m.name : '')).filter(Boolean);
}

/**
 * Chọn model để chạy: ưu tiên `envModel` (nếu đã kéo về máy) → model mặc định (nếu có) →
 * model sẵn có ĐẦU TIÊN. KHÔNG bao giờ tự `ollama pull` (tốn băng thông/đĩa). `available` rỗng
 * → trả envModel/default để caller vẫn thử (server sẽ báo lỗi rõ nếu thiếu).
 */
export function resolveOllamaModel(available: string[], envModel?: string): string {
  const want = (envModel ?? process.env.OLLAMA_MODEL ?? '').trim();
  if (want && (available.length === 0 || available.includes(want))) return want;
  if (available.includes(OLLAMA_MODEL_DEFAULT)) return OLLAMA_MODEL_DEFAULT;
  if (available.length > 0) return available[0];
  return want || OLLAMA_MODEL_DEFAULT;
}

export interface OllamaAvailability {
  /** Ollama đang chạy & trả lời /api/tags trong timeout? */
  available: boolean;
  /** danh sách model đã kéo (rỗng nếu không dò được) */
  models: string[];
}

/**
 * DÒ KHẢ DỤNG: ping `/api/tags` (timeout ngắn, 1 lần). KHÔNG throw — trả {available:false,models:[]}
 * khi Ollama không chạy / quá timeout / lỗi. App dùng kết quả này để BẬT/BỎ tầng local.
 */
export async function isOllamaAvailable(timeoutMs = OLLAMA_PROBE_TIMEOUT_MS): Promise<OllamaAvailability> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${BASE()}/api/tags`, { signal: ctrl.signal });
    if (!res.ok) return { available: false, models: [] };
    const json = await res.json().catch(() => ({}));
    return { available: true, models: parseModelList(json) };
  } catch {
    return { available: false, models: [] };
  } finally {
    clearTimeout(timer);
  }
}

interface ChatOpts { model?: string; max_tokens?: number; temperature?: number; timeoutMs?: number }

async function chat(messages: Msg[], opts: ChatOpts = {}): Promise<string> {
  const model = opts.model ?? process.env.OLLAMA_MODEL ?? OLLAMA_MODEL_DEFAULT;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), opts.timeoutMs ?? OLLAMA_CHAT_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(`${BASE()}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages,
        temperature: opts.temperature ?? 0.3,
        max_tokens: opts.max_tokens ?? 700,
        stream: false,
      }),
      signal: ctrl.signal,
    });
  } catch (err) {
    throw new OllamaError(
      (err as Error)?.name === 'AbortError'
        ? `Ollama quá thời gian (${(opts.timeoutMs ?? OLLAMA_CHAT_TIMEOUT_MS) / 1000}s) — model local quá chậm hoặc treo.`
        : 'Mất kết nối tới Ollama local (localhost:11434). Chạy "ollama serve" chưa?',
    );
  } finally {
    clearTimeout(timer);
  }
  if (res.status === 404) {
    throw new OllamaError(`Model "${model}" chưa kéo về máy — chạy "ollama pull ${model}" hoặc đặt OLLAMA_MODEL sang model đã có.`);
  }
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new OllamaError(`Ollama lỗi HTTP ${res.status}${t ? `: ${t.slice(0, 180)}` : ''}.`);
  }
  const json = await res.json().catch(() => ({}));
  const content = parseChatContent(json);
  if (!content) throw new OllamaError('Ollama không trả về chữ (response rỗng).');
  return content;
}

/**
 * LLM thuần chạy local (concept-writer, tóm tắt brief, giải thích quy chuẩn…). `system` tuỳ chọn.
 * Ném `OllamaError` khi server không chạy / model thiếu / rỗng — caller tụt xuống lõi tất định.
 */
export async function completeText(prompt: string, system?: string, opts: ChatOpts = {}): Promise<string> {
  const msgs: Msg[] = [];
  if (system) msgs.push({ role: 'system', content: system });
  msgs.push({ role: 'user', content: prompt });
  return chat(msgs, opts);
}
