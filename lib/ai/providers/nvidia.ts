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

// TODO(nối sau — target "image render free"): image-gen của NVIDIA dùng endpoint invoke riêng
// theo từng model (không hoàn toàn OpenAI-compatible) → cần chốt model image cụ thể rồi thêm generateImage().
