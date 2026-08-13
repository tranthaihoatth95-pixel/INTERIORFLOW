/**
 * lib/grounded-render/reference-sheet.ts — GroundedRender · sinh PHIẾU ĐỌC B 4 cấp.
 *
 * Phiếu đọc B là MẶT TIỀN của DistillEngine [T2] — KHÔNG viết engine trích xuất mới:
 * nguồn (ảnh B đã caption) vào `DistillEngine.distill()` với field-spec riêng của phiếu,
 * cờ/nguồn theo đúng khuôn `DistilledField`.
 *
 * Đường vision TÁI DÙNG (không gọi API mới): route `/api/vision/caption` →
 * `captionImage()` (lib/ai/providers/nvidia.ts:50, VLM NVIDIA free) — cùng đường mà
 * `app/library/ingest/page.tsx:104` đang dùng để auto-caption ảnh ref. Route này trả
 * JSON cố định {caption, style, materials, room} nên v0 CHỈ điền được cấp ①+③;
 * cấp ②(trần/tường/sàn) + ④(chi tiết) cần prompt 4-cấp riêng — xem
 * `draftReferenceSheetPrompt()` (CHƯA NỐI, chờ route vision nhận prompt tuỳ biến, việc T).
 *
 * Import tương đối để test sucrase-node chạy được (không '@/').
 */
import { DistillEngine, type DistillFieldSpec } from '../distill/engine';
import type { ProvenanceInput } from '../distill/types';
import {
  emptyReferenceSheet,
  type ReferenceSheet,
  type ReferenceSheetLine,
  type MucPhieu,
} from './types';

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
 * CHƯA NỐI — prompt 4 cấp ĐẦY ĐỦ cho VLM (điền được cả cấp ② trần/tường/sàn + ④ chi tiết).
 * Route `/api/vision/caption` hiện dùng prompt CỐ ĐỊNH server-side (nvidia.ts:52) nên chưa
 * truyền prompt này được; thêm route/param là việc ngoài vùng file phiếu → đề xuất lên T.
 * Để sẵn đây (kèm shape JSON kỳ vọng) để v1 nối là chạy, không phải nghĩ lại.
 */
export function draftReferenceSheetPrompt(): string {
  return (
    'Bạn là chuyên gia nội thất. Đọc ảnh tham khảo và CHỈ trả JSON thuần theo 4 cấp: ' +
    '{"tongThe":{"tone":"<tone & không khí>","anhSang":"<hướng/nhiệt độ ánh sáng>","nuocHinh":"<nước hình/finish>"},' +
    '"tranTuongSan":{"tran":"<vật liệu + sắc độ trần>","tuong":"<vật liệu + sắc độ tường>","san":"<vật liệu + sắc độ sàn>"},' +
    '"vatLieu":["<vật liệu chính>","..."],' +
    '"chiTiet":["<chi tiết/cấu kiện/đồ rời đáng chú ý>","..."]} ' +
    '— không giải thích, không markdown.'
  );
}
