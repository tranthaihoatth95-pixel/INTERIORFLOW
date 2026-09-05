/**
 * lib/gu/apply-intent.ts — "ÁP" ảnh cảm hứng = tạo ĐỀ XUẤT Ý ĐỊNH có thể lùi được, KHÔNG sao chép
 * hình học, KHÔNG khai kích thước. Thuần, tất định, test bằng sucrase-node.
 *
 * Khuôn ProposalSheet (chốt 13/08 "mọi đề xuất máy → một khuôn phiếu duyệt"): máy dựng `intent`
 * (danh sách nguồn có xuất xứ + lớp Thẻ DNA sẽ chạm), người xem `describeChanges()` rồi mới bấm
 * Áp; `applyIntent()` trả cả `before` để `revertIntent()` lùi nguyên bản — [T5] người quyết cuối
 * + KS4 lùi được.
 *
 * VÌ SAO KHÔNG dùng `mergeDistilledIntoCard` của Distiller: hàm đó là "chưng cất lại" — THAY toàn
 * bộ lớp chưa verified bằng bản mới (kể cả thay bằng rỗng). Áp một ảnh cảm hứng là "GÓP THÊM": giữ
 * mọi giá trị đang có, chỉ cộng giá trị mới + nguồn mới; lớp `verified` vẫn bất khả xâm phạm.
 *
 * ĐIỀU KHÔNG BAO GIỜ CÓ TRONG INTENT (test khoá): số đo mm/cm/m, width/height/depth, toạ độ, mesh.
 * Ảnh tham khảo chỉ nói "ngôn ngữ" (màu · ánh sáng · phong cách · vật liệu · khung hình · không
 * gian); con số chỉ đến từ chặng CAD/khối đo được (chốt 15/08).
 */

import type { ProvenanceInput } from '../distill/types';
import { distillDnaFromSources } from '../dna/distiller';
import { DNA_LAYER_KEYS, type DesignDnaCard, type DesignDnaLayers, type DnaLayerKey } from '../dna/types';
import type { ImageIntelligenceSummary } from '../smartselect/image-intelligence';

export type IntentAspect = 'palette' | 'light' | 'style' | 'material' | 'space' | 'framing';

export const INTENT_ASPECTS: { id: IntentAspect; label: [string, string]; layer: DnaLayerKey }[] = [
  { id: 'palette', label: ['Màu', 'Colour'], layer: 'mauTyLe' },
  { id: 'light', label: ['Ánh sáng', 'Light'], layer: 'anhSang' },
  { id: 'style', label: ['Ngôn ngữ', 'Language'], layer: 'ngonNguKhongGian' },
  { id: 'material', label: ['Vật liệu', 'Material'], layer: 'vatLieuMatId' },
  { id: 'space', label: ['Không gian', 'Space'], layer: 'anhNguon' },
  { id: 'framing', label: ['Khung hình', 'Framing'], layer: 'khungHinh' },
];

export interface InspirationIntent {
  id: string;
  imgId: string;
  assetName: string;
  createdAt: string;
  /** nguồn đưa vào máy chưng cất — duy nhất 1 `image` + tuỳ chọn 1 `text` (caption VLM). */
  sources: ProvenanceInput[];
  /** lớp Thẻ DNA sẽ được GÓP (chỉ những lớp có giá trị mới). */
  layersTouched: DnaLayerKey[];
  aspects: IntentAspect[];
  /** luật cứng: ý định chỉ MÔ TẢ, không hình học. */
  geometryPolicy: 'descriptive-only';
  excluded: string[];
  rightsAcknowledged: boolean;
  license: string | null;
  /** độ tin tổng hợp của bản đọc ảnh tại lúc dựng intent (để ghi vết, không phải điểm chấm). */
  confidence: number;
}

export interface BuildIntentInput {
  imgId: string;
  assetName: string;
  analysis: ImageIntelligenceSummary;
  license: string | null;
  source?: string | null;
  rightsAcknowledged: boolean;
  /** mặt nào được góp — mặc định tất cả mặt có bằng chứng. */
  aspects?: IntentAspect[];
  now?: string;
  id?: string;
}

function uniq(xs: string[]): string[] {
  return xs.filter((v, i, a) => v && a.indexOf(v) === i);
}

/** Dựng các tag `style:`/`material:`/`light:`/`frame:` mà Distiller hiểu, từ bản đọc ảnh. */
export function intentTagsFromAnalysis(a: ImageIntelligenceSummary, aspects: IntentAspect[]): string[] {
  const tags: string[] = [];
  const has = (x: IntentAspect) => aspects.includes(x);
  if (has('style')) for (const s of a.semantic.facets.style) tags.push(`style:${s}`);
  if (has('material')) for (const m of a.semantic.facets.material) tags.push(`material:${m}`);
  if (has('light')) {
    const l = a.light;
    tags.push(`light:${l.temperature} · ${l.key}`);
    for (const t of a.semantic.facets.light) tags.push(`light:${t}`);
  }
  if (has('framing')) {
    const c = a.composition;
    tags.push(`frame:${c.orientation}`);
    if (c.horizonBand) tags.push(`frame:horizon ${c.horizonBand}`);
    tags.push(`frame:bright focus ${c.brightCentroid.x}-${c.brightCentroid.y}`);
    if (a.geometry.calibrated) tags.push('frame:3-point perspective');
  }
  return uniq(tags);
}

export function buildIntent(input: BuildIntentInput): InspirationIntent {
  const a = input.analysis;
  const aspects = input.aspects ?? INTENT_ASPECTS.map((x) => x.id);
  const tags = intentTagsFromAnalysis(a, aspects);
  const palette = aspects.includes('palette') ? a.palette.map((p) => p.hex) : [];
  const spaceBits = aspects.includes('space') ? a.semantic.facets.space : [];
  const captionBits = [input.assetName.trim(), ...spaceBits].filter(Boolean);

  const sources: ProvenanceInput[] = [
    {
      kind: 'image',
      id: input.imgId,
      palette,
      caption: captionBits.join(' · '),
      tags,
    },
  ];

  const distilled = distillDnaFromSources(sources);
  const layersTouched = DNA_LAYER_KEYS.filter((k) => distilled[k].values.length > 0);

  return {
    id: input.id ?? `intent_${Math.random().toString(36).slice(2, 10)}`,
    imgId: input.imgId,
    assetName: input.assetName,
    createdAt: input.now ?? new Date().toISOString(),
    sources,
    layersTouched,
    aspects,
    geometryPolicy: 'descriptive-only',
    excluded: ['dimensions', 'geometry', 'coordinates', 'mesh', 'mask'],
    rightsAcknowledged: input.rightsAcknowledged,
    license: input.license,
    confidence: a.overallConfidence,
  };
}

/** Kiểm cứng: intent KHÔNG mang số đo/kích thước ở bất kỳ đâu (test dùng, UI cũng gọi trước Áp). */
export function intentHasNoGeometry(intent: InspirationIntent): boolean {
  const forbiddenKey = /^(width|height|depth|w|h|d|x|y|z|mm|cm|m|dims?|dimensions?|bbox|mask|mesh)$/i;
  const forbiddenValue = /\b\d+(?:[.,]\d+)?\s?(mm|cm|m)\b/i;
  const walk = (v: unknown): boolean => {
    if (v == null) return true;
    if (typeof v === 'string') return !forbiddenValue.test(v);
    if (typeof v === 'number') return true;
    if (Array.isArray(v)) return v.every(walk);
    if (typeof v === 'object') {
      for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
        if (forbiddenKey.test(k)) return false;
        if (!walk(val)) return false;
      }
      return true;
    }
    return true;
  };
  return intent.geometryPolicy === 'descriptive-only' && walk(intent.sources);
}

export interface LayerChange {
  layer: DnaLayerKey;
  added: string[];
  /** lớp đang `verified` — máy KHÔNG đụng, chỉ báo để người biết. */
  skippedVerified: boolean;
}

/** Góp thêm: giữ giá trị cũ, cộng giá trị mới + nguồn mới; lớp verified giữ nguyên. */
export function contributeLayers(current: DesignDnaLayers, distilled: DesignDnaLayers): { layers: DesignDnaLayers; changes: LayerChange[] } {
  const out = {} as DesignDnaLayers;
  const changes: LayerChange[] = [];
  for (const k of DNA_LAYER_KEYS) {
    const cur = current[k] ?? { values: [], trangThai: 'inferred' as const, nguon: [] };
    const add = distilled[k];
    if (cur.trangThai === 'verified') {
      out[k] = cur;
      if (add.values.length > 0) changes.push({ layer: k, added: [], skippedVerified: true });
      continue;
    }
    const added = add.values.filter((v) => !cur.values.includes(v));
    if (added.length === 0) {
      out[k] = cur;
      continue;
    }
    out[k] = {
      values: [...cur.values, ...added],
      trangThai: 'inferred',
      nguon: uniq([...cur.nguon, ...add.nguon]),
    };
    changes.push({ layer: k, added, skippedVerified: false });
  }
  return { layers: out, changes };
}

export interface ApplyResult {
  before: DesignDnaCard;
  after: DesignDnaCard;
  changes: LayerChange[];
}

/** Xem trước thay đổi (ProposalSheet) — không ghi gì. */
export function describeChanges(card: DesignDnaCard, intent: InspirationIntent): LayerChange[] {
  return contributeLayers(card.layers, distillDnaFromSources(intent.sources)).changes;
}

/** Áp intent vào thẻ: trả `before` nguyên bản để lùi. Không mutate `card`. */
export function applyIntent(card: DesignDnaCard, intent: InspirationIntent, now: string = new Date().toISOString()): ApplyResult {
  const { layers, changes } = contributeLayers(card.layers, distillDnaFromSources(intent.sources));
  const after: DesignDnaCard = { ...card, layers, updatedAt: now };
  return { before: card, after, changes };
}

/** Lùi = trả đúng bản `before` (đã lưu cùng intent). Hàm này tồn tại để hợp đồng "lùi được" là
 * một hàm có tên, có test — không phải ngầm định. */
export function revertIntent(result: Pick<ApplyResult, 'before'>): DesignDnaCard {
  return result.before;
}
