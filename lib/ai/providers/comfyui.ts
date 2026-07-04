/**
 * Provider adapter: ComfyUI self-host (mức 2 — Tự-host 0đ). CHỈ import phía server.
 * Cùng interface submitJob/jobStatus với fal.ts để dispatcher gọi thống nhất.
 *
 * Cơ chế: nạp workflow API-format từ `comfyui/workflows/<name>.json` (user export 1 lần
 * từ ComfyUI trên máy render), rồi bơm tham số vào các node đánh dấu `_meta.title`:
 *   IF_POSITIVE / IF_NEGATIVE (CLIPTextEncode.text) · IF_IMAGE / IF_MASK (LoadImage.image)
 *   IF_GUIDANCE / IF_STRENGTH / IF_SCALE / IF_SEED (widget `value`).
 * Ảnh data-URI/URL được upload lên ComfyUI trước, thay bằng filename.
 * Xem comfyui/README.md để cài + tune trên máy công ty.
 */
import { promises as fs } from 'fs';
import path from 'path';

const base = () => (process.env.COMFYUI_URL ?? '').replace(/\/+$/, '');

export function comfyuiConfigured() {
  return Boolean(process.env.COMFYUI_URL);
}

type Graph = Record<string, { class_type: string; inputs: Record<string, unknown>; _meta?: { title?: string } }>;

const templateCache = new Map<string, Graph>();

async function loadTemplate(name: string): Promise<Graph> {
  const cached = templateCache.get(name);
  if (cached) return structuredClone(cached);
  const file = path.join(process.cwd(), 'comfyui', 'workflows', `${name}.json`);
  let raw: string;
  try {
    raw = await fs.readFile(file, 'utf8');
  } catch {
    throw new Error(`Chưa có workflow tự-host "${name}.json" trong comfyui/workflows/ — xem comfyui/README.md.`);
  }
  const json = JSON.parse(raw) as Graph;
  templateCache.set(name, json);
  return structuredClone(json);
}

/** Upload 1 ảnh (data-URI hoặc URL) lên ComfyUI, trả filename (kèm subfolder nếu có). */
async function uploadImage(src: string): Promise<string> {
  const resp = await fetch(src);
  if (!resp.ok) throw new Error('Không đọc được ảnh input để upload lên ComfyUI.');
  const blob = await resp.blob();
  const ext = (blob.type || 'image/png').includes('jpeg') ? 'jpg' : 'png';
  const form = new FormData();
  form.append('image', new File([blob], `if_input.${ext}`, { type: blob.type || 'image/png' }));
  form.append('overwrite', 'true');
  const up = await fetch(`${base()}/upload/image`, { method: 'POST', body: form });
  if (!up.ok) throw new Error(`ComfyUI upload ảnh lỗi (HTTP ${up.status}).`);
  const j = (await up.json()) as { name: string; subfolder?: string };
  return j.subfolder ? `${j.subfolder}/${j.name}` : j.name;
}

/** title marker → (widget input muốn ghi, kiểu giá trị). */
const PLACEHOLDERS: Record<string, { widget: string; image?: boolean }> = {
  IF_POSITIVE: { widget: 'text' },
  IF_NEGATIVE: { widget: 'text' },
  IF_IMAGE: { widget: 'image', image: true },
  IF_MASK: { widget: 'image', image: true },
  IF_GUIDANCE: { widget: 'value' },
  IF_STRENGTH: { widget: 'value' },
  IF_SCALE: { widget: 'value' },
  IF_SEED: { widget: 'value' },
};

/** input key của ta → title marker trong template. */
function markerValues(input: Record<string, unknown>): Record<string, unknown> {
  const v: Record<string, unknown> = {};
  if (input.prompt != null) v.IF_POSITIVE = String(input.prompt);
  if (input.negative_prompt != null) v.IF_NEGATIVE = String(input.negative_prompt);
  const img = input.control_image_url ?? input.image_url;
  if (img != null) v.IF_IMAGE = String(img);
  if (input.mask_url != null) v.IF_MASK = String(input.mask_url);
  if (input.guidance_scale != null) v.IF_GUIDANCE = Number(input.guidance_scale);
  if (input.strength != null) v.IF_STRENGTH = Number(input.strength);
  if (input.scale != null) v.IF_SCALE = Number(input.scale);
  v.IF_SEED = input.seed != null ? Number(input.seed) : Math.floor(Math.random() * 1_000_000_000);
  return v;
}

export async function submitJob(workflowName: string, input: Record<string, unknown>): Promise<string> {
  const graph = await loadTemplate(workflowName);
  const values = markerValues(input);

  // Upload trước mọi ảnh cần thiết (chỉ những marker ảnh có trong template).
  const wantImage = new Set(
    Object.values(graph)
      .map((n) => n._meta?.title)
      .filter((t): t is string => Boolean(t && PLACEHOLDERS[t]?.image)),
  );
  for (const marker of wantImage) {
    if (values[marker] != null) values[marker] = await uploadImage(String(values[marker]));
  }

  // Bơm giá trị vào các node có title marker.
  for (const node of Object.values(graph)) {
    const title = node._meta?.title;
    if (!title) continue;
    const spec = PLACEHOLDERS[title];
    if (!spec || values[title] == null) continue;
    if (title === 'IF_SEED') {
      // KSampler dùng 'seed', SamplerCustom dùng 'noise_seed', Primitive dùng 'value'.
      const key = ['seed', 'noise_seed', 'value'].find((k) => k in node.inputs) ?? 'seed';
      node.inputs[key] = values[title];
    } else {
      node.inputs[spec.widget] = values[title];
    }
  }

  const res = await fetch(`${base()}/prompt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: graph }),
  });
  const body = (await res.json().catch(() => ({}))) as { prompt_id?: string; error?: unknown; node_errors?: unknown };
  if (!res.ok || !body.prompt_id) {
    const detail = body.error ? (typeof body.error === 'string' ? body.error : JSON.stringify(body.error)) : `HTTP ${res.status}`;
    throw new Error(`ComfyUI từ chối job: ${detail}`);
  }
  return body.prompt_id;
}

export type ProviderJobStatus =
  | { status: 'IN_QUEUE' | 'IN_PROGRESS' }
  | { status: 'COMPLETED'; imageUrls: string[] }
  | { status: 'FAILED'; error: string };

interface HistoryEntry {
  status?: { status_str?: string; completed?: boolean; messages?: unknown };
  outputs?: Record<string, { images?: { filename: string; subfolder?: string; type?: string }[] }>;
}

export async function jobStatus(_workflowName: string, promptId: string): Promise<ProviderJobStatus> {
  let res: Response;
  try {
    res = await fetch(`${base()}/history/${encodeURIComponent(promptId)}`);
  } catch {
    return { status: 'FAILED', error: 'Mất kết nối tới máy render ComfyUI (COMFYUI_URL).' };
  }
  if (!res.ok) return { status: 'FAILED', error: `ComfyUI history lỗi (HTTP ${res.status}).` };
  const hist = (await res.json().catch(() => ({}))) as Record<string, HistoryEntry>;
  const entry = hist[promptId];
  if (!entry) return { status: 'IN_PROGRESS' }; // chưa vào history = đang chạy/queue

  if (entry.status?.status_str === 'error') {
    return { status: 'FAILED', error: 'Workflow ComfyUI báo lỗi — kiểm tra log trên máy render.' };
  }

  const urls: string[] = [];
  for (const out of Object.values(entry.outputs ?? {})) {
    for (const img of out.images ?? []) {
      const q = new URLSearchParams({
        filename: img.filename,
        subfolder: img.subfolder ?? '',
        type: img.type ?? 'output',
      });
      urls.push(`${base()}/view?${q.toString()}`);
    }
  }
  if (!urls.length) {
    // có entry nhưng chưa có ảnh — coi như còn đang finalize
    return entry.status?.completed ? { status: 'FAILED', error: 'ComfyUI xong nhưng không có ảnh output (thiếu node SaveImage?).' } : { status: 'IN_PROGRESS' };
  }
  return { status: 'COMPLETED', imageUrls: urls };
}
