/**
 * Provider adapter: SD-portable (engine 'sd' của oneAI), runtime 'server'. CHỈ import phía server.
 * Cùng interface submitJob/jobStatus với fal.ts / comfyui.ts.
 *
 * Nói chuyện với **SD server tương thích AUTOMATIC1111** qua `SD_SERVER_URL`:
 *   - Draw Things (Mac M — bật "HTTP API"/server), ComfyUI (có node A1111-API), hoặc A1111/Forge.
 *   - Endpoint: POST /sdapi/v1/txt2img | /sdapi/v1/img2img — ĐỒNG BỘ, trả base64 luôn.
 * Vì đồng bộ mà dispatcher của ta theo mô hình queue (submit→poll), ta bọc bằng job-map
 * in-memory: submitJob bắn request nền + trả id ngay; jobStatus đọc kết quả từ map.
 *
 * runtime 'webgpu' (client-side) KHÔNG đi qua đây — xem lib/ai/webgpu.ts.
 */
export function sdConfigured() {
  return Boolean(process.env.SD_SERVER_URL);
}

const base = () => (process.env.SD_SERVER_URL ?? '').replace(/\/+$/, '');

export type ProviderJobStatus =
  | { status: 'IN_QUEUE' | 'IN_PROGRESS' }
  | { status: 'COMPLETED'; imageUrls: string[] }
  | { status: 'FAILED'; error: string };

// Job đồng bộ A1111 → lưu tạm để jobStatus poll. Reset khi server restart (chấp nhận).
const jobs = new Map<string, ProviderJobStatus>();

const NOT_WIRED =
  'SD-portable server chưa nối (SD_SERVER_URL). Trỏ tới Draw Things/ComfyUI/A1111 cạnh máy, ' +
  'hoặc dùng runtime WebGPU (đang phát triển).';

/** Bỏ tiền tố data-URI; nếu là URL http thì tải về rồi base64-hoá. A1111 cần base64 thuần. */
async function toBase64(src: string): Promise<string> {
  if (src.startsWith('data:')) return src.replace(/^data:[^;]+;base64,/, '');
  const resp = await fetch(src);
  if (!resp.ok) throw new Error('Không đọc được ảnh input để gửi SD server.');
  const buf = Buffer.from(await resp.arrayBuffer());
  return buf.toString('base64');
}

/** Gọi A1111 txt2img/img2img (đồng bộ), trả mảng data-URI PNG. */
async function generate(model: string, input: Record<string, unknown>): Promise<string[]> {
  if (!sdConfigured()) throw new Error(NOT_WIRED);

  const initSrc = (input.image_url ?? input.control_image_url) as string | undefined;
  const isImg2Img = Boolean(initSrc);

  const payload: Record<string, unknown> = {
    prompt: String(input.prompt ?? ''),
    negative_prompt: String(input.negative_prompt ?? ''),
    steps: Number(input.steps ?? 24),
    cfg_scale: Number(input.guidance_scale ?? 6),
    seed: input.seed != null ? Number(input.seed) : -1,
    width: Number(input.width ?? 768),
    height: Number(input.height ?? 512),
    // gợi ý checkpoint/mode cho server nào đọc override; server không hiểu sẽ bỏ qua.
    override_settings: {},
    sd_model_checkpoint_hint: model,
  };
  if (isImg2Img) {
    payload.init_images = [await toBase64(initSrc as string)];
    payload.denoising_strength = Number(input.strength ?? 0.65);
    if (input.mask_url != null) payload.mask = await toBase64(String(input.mask_url));
  }

  const endpoint = isImg2Img ? '/sdapi/v1/img2img' : '/sdapi/v1/txt2img';
  let res: Response;
  try {
    res = await fetch(`${base()}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error('Mất kết nối tới SD server (SD_SERVER_URL) — kiểm tra Draw Things/ComfyUI đang chạy.');
  }
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`SD server lỗi (HTTP ${res.status})${detail ? `: ${detail.slice(0, 200)}` : ''}.`);
  }
  const body = (await res.json().catch(() => ({}))) as { images?: string[] };
  if (!body.images?.length) throw new Error('SD server không trả ảnh (thiếu cấu hình model?).');
  // A1111 trả base64 thuần → bọc thành data-URI để client hiển thị thẳng.
  return body.images.map((b64) => (b64.startsWith('data:') ? b64 : `data:image/png;base64,${b64}`));
}

export async function submitJob(model: string, input: Record<string, unknown>): Promise<string> {
  if (!sdConfigured()) throw new Error(NOT_WIRED);
  const id = `sd_${crypto.randomUUID()}`;
  jobs.set(id, { status: 'IN_PROGRESS' });
  // chạy nền — jobStatus sẽ đọc kết quả. Dọn map sau 5 phút để khỏi rò bộ nhớ.
  generate(model, input)
    .then((imageUrls) => jobs.set(id, { status: 'COMPLETED', imageUrls }))
    .catch((err) => jobs.set(id, { status: 'FAILED', error: err instanceof Error ? err.message : 'SD job lỗi.' }))
    .finally(() => setTimeout(() => jobs.delete(id), 300_000));
  return id;
}

export async function jobStatus(_model: string, requestId: string): Promise<ProviderJobStatus> {
  return jobs.get(requestId) ?? { status: 'FAILED', error: 'Job SD không còn (server đã restart?) — chạy lại node.' };
}
