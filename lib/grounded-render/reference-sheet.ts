/**
 * lib/grounded-render/reference-sheet.ts — GroundedRender · sinh PHIẾU ĐỌC B 4 cấp.
 *
 * Phiếu đọc B là MẶT TIỀN của DistillEngine [T2] — KHÔNG viết engine trích xuất mới:
 * nguồn (ảnh B đã caption) vào `DistillEngine.distill()` với field-spec riêng của phiếu,
 * cờ/nguồn theo đúng khuôn `DistilledField`.
 *
 * Đường vision (02/09 — ĐÃ NỐI đủ 4 cấp): `readReferenceSheet()` gọi `/api/vision/analyze`
 * (Image→Spec, `lib/vision/image-spec.ts`): đo pixel tất định + VLM theo tầng cloud→local
 * (`lib/ai/vision-tier.ts`) với prompt 4 cấp `imageSpecPrompt()` → phiếu điền cả cấp ②
 * (trần/tường/sàn) + ④ (chi tiết) + dòng đo pixel (bảng màu · nhiệt màu · phối cảnh).
 * Route cũ `/api/vision/caption` (prompt cố định, chỉ cấp ①③) giữ làm ĐƯỜNG LÙI khi route
 * analyze không có (bản cũ) — `sheetFromCaption` vẫn dùng cho đường lùi đó.
 * Hợp đồng KHÔNG đổi với node `ai.refsheet`: VLM không chạy được → THROW chữ rõ (route trả
 * `spec.ai.tier === 'none'` kèm lý do) — không trả phiếu chỉ-đo-pixel dưới nhãn "VLM đọc ảnh".
 *
 * Import tương đối để test sucrase-node chạy được (không '@/').
 */
import { DistillEngine, type DistillFieldSpec } from '../distill/engine';
import type { ProvenanceInput } from '../distill/types';
import {
  decodeReferenceSheet,
  emptyReferenceSheet,
  type ReferenceSheet,
  type ReferenceSheetLine,
  type MucPhieu,
} from './types';
import { decodeImageSpec, imageSpecPrompt, type ImageSpec } from '../vision/image-spec';

/** Khớp shape `RefCaption` của lib/ai/providers/nvidia.ts:47 — copy SHAPE (type thuần),
 * không import module server (giữ file này thuần client/test được). */
export interface CaptionKetQua {
  caption: string;
  style: string;
  materials: string[];
  room: string;
}

/* ───────────── field-spec cho DistillEngine — phiếu là mặt tiền, engine là ruột ───────────── */

type PhieuField = 'tone' | 'phong-cach' | 'loai-phong' | 'vat-lieu';

function capFrom(source: ProvenanceInput): CaptionKetQua | null {
  if (source.kind !== 'text') return null;
  try {
    const j = JSON.parse(source.text) as Partial<CaptionKetQua>;
    return {
      caption: String(j.caption ?? ''),
      style: String(j.style ?? ''),
      materials: Array.isArray(j.materials) ? j.materials.map(String) : [],
      room: String(j.room ?? ''),
    };
  } catch {
    return null;
  }
}

const PHIEU_SPECS: readonly DistillFieldSpec<PhieuField>[] = [
  { field: 'tone', extract: (s) => { const c = capFrom(s); return c?.caption ? [c.caption] : []; } },
  { field: 'phong-cach', extract: (s) => { const c = capFrom(s); return c?.style ? [c.style] : []; } },
  { field: 'loai-phong', extract: (s) => { const c = capFrom(s); return c?.room ? [c.room] : []; } },
  { field: 'vat-lieu', extract: (s) => capFrom(s)?.materials.filter(Boolean) ?? [] },
];

/** field đã chưng cất → (id dòng, cấp) trong phiếu 4 cấp. */
const FIELD_TO_LINE: Record<PhieuField, { id: string; muc: MucPhieu }> = {
  tone: { id: 'tong-the.tone', muc: 'tong-the' },
  'phong-cach': { id: 'tong-the.phong-cach', muc: 'tong-the' },
  'loai-phong': { id: 'tong-the.loai-phong', muc: 'tong-the' },
  'vat-lieu': { id: 'vat-lieu.chinh', muc: 'vat-lieu' },
};

/**
 * THUẦN (test được): caption VLM → phiếu 4 cấp qua DistillEngine.
 * Cấp ②/④ giữ dòng TRỐNG (nguồn caption không nói tới) — không bịa, người điền tay.
 * Mọi dòng máy điền đều flag 'inferred' + nguon = [imageBId].
 */
export function sheetFromCaption(cap: CaptionKetQua, imageBId: string): ReferenceSheet {
  const sources: ProvenanceInput[] = [{ kind: 'text', id: imageBId, text: JSON.stringify(cap), label: 'caption-vlm' }];
  const distilled = DistillEngine.distill(sources, PHIEU_SPECS);
  const sheet = emptyReferenceSheet(imageBId);
  const byId = new Map<string, ReferenceSheetLine>(sheet.lines.map((l) => [l.id, l]));
  for (const field of Object.keys(FIELD_TO_LINE) as PhieuField[]) {
    const d = distilled[field];
    if (d.values.length === 0) continue;
    const line = byId.get(FIELD_TO_LINE[field].id);
    if (!line) continue;
    line.value = d.values.join(' · ');
    line.flag = 'inferred';
    line.nguon = d.nguon;
  }
  return sheet;
}

/**
 * Gọi đường vision SẴN CÓ (`/api/vision/caption`) → phiếu 4 cấp.
 * Lỗi (chưa cấu hình NVIDIA / hết lượt free / mạng) → THROW với chữ rõ ràng của route —
 * caller (node) quyết định degrade sang phiếu trống điền tay, KHÔNG giả kết quả [T0].
 * Chạy client-side (node execute) — cùng cách node ai.text2image fetch API nội bộ.
 */
export async function readReferenceSheet(imageB: string, imageBId = 'anh-b'): Promise<ReferenceSheet> {
  // Đường chính: Image→Spec (đủ 4 cấp). 404 = bản build cũ chưa có route → lùi về caption.
  const full = await readImageSpec(imageB, imageBId, { ai: true });
  if (full.status !== 404) {
    if (!full.ok) throw new Error(full.error ?? `Máy đọc ảnh tham khảo lỗi (HTTP ${full.status}).`);
    if (full.spec.ai.tier === 'none') {
      throw new Error(`Máy đọc ảnh chưa chạy được: ${full.spec.ai.reason}`);
    }
    const decoded = decodeReferenceSheet(JSON.stringify(full.sheet));
    if (decoded.sheet) return decoded.sheet;
    throw new Error(decoded.error ?? 'Phiếu từ máy đọc ảnh không đúng cấu trúc.');
  }
  return readReferenceSheetViaCaption(imageB, imageBId);
}

/** Kết quả gọi `/api/vision/analyze` — giữ nguyên phần đo pixel kể cả khi AI không chạy. */
export type ImageSpecResult =
  | { ok: true; status: number; spec: ImageSpec; sheet: ReferenceSheet; text: string }
  | { ok: false; status: number; error?: string };

/**
 * Gọi Image→Spec (client-side). KHÔNG throw — trả `{ok:false,status}` để caller quyết
 * (node: throw; panel: hiện lỗi tại chỗ). `ai:false` = chỉ đo pixel, 0 AI, 0 credit.
 */
export async function readImageSpec(
  image: string,
  imageId = 'anh',
  opts: { ai?: boolean } = {},
): Promise<ImageSpecResult> {
  let res: Response;
  try {
    res = await fetch('/api/vision/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image, imageId, ai: opts.ai !== false }),
    });
  } catch {
    return { ok: false, status: 0, error: 'Mất kết nối tới máy đọc ảnh (/api/vision/analyze).' };
  }
  const body = (await res.json().catch(() => ({}))) as Partial<{ spec: unknown; sheet: unknown; text: string; error: string }>;
  if (!res.ok) return { ok: false, status: res.status, error: body.error };
  const spec = decodeImageSpec(JSON.stringify(body.spec ?? null));
  const sheet = decodeReferenceSheet(JSON.stringify(body.sheet ?? null));
  if (!spec.spec || !sheet.sheet) {
    return { ok: false, status: res.status, error: spec.error ?? sheet.error ?? 'Kết quả máy đọc ảnh sai cấu trúc.' };
  }
  return { ok: true, status: res.status, spec: spec.spec, sheet: sheet.sheet, text: String(body.text ?? '') };
}

/** ĐƯỜNG LÙI: route caption cũ (prompt cố định) → phiếu chỉ cấp ①③. */
async function readReferenceSheetViaCaption(imageB: string, imageBId: string): Promise<ReferenceSheet> {
  const res = await fetch('/api/vision/caption', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: imageB }),
  });
  const body = (await res.json().catch(() => ({}))) as Partial<CaptionKetQua> & { error?: string };
  if (!res.ok) {
    throw new Error(body.error ?? `Máy đọc ảnh tham khảo lỗi (HTTP ${res.status}).`);
  }
  return sheetFromCaption(
    {
      caption: String(body.caption ?? ''),
      style: String(body.style ?? ''),
      materials: Array.isArray(body.materials) ? body.materials.map(String) : [],
      room: String(body.room ?? ''),
    },
    imageBId,
  );
}

/**
 * Prompt 4 cấp ĐẦY ĐỦ cho VLM — ĐÃ NỐI qua `/api/vision/analyze` (02/09). Nguồn duy nhất là
 * `imageSpecPrompt()` (lib/vision/image-spec.ts); hàm này giữ tên cũ để nơi gọi/test không đổi.
 */
export function draftReferenceSheetPrompt(): string {
  return imageSpecPrompt();
}
