/**
 * Gu Engine — TRÍCH gu thẩm mỹ từ thư viện Reference (KHÔNG hardcode).
 *
 * Nguyên tắc (user chốt 07/07): gu được trích từ Reference, mỗi sản phẩm mỗi khác,
 * linh hoạt. Module này gộp nhiều ref → 1 "hồ sơ gu" (palette · vật liệu · phong cách ·
 * ảnh style-ref) để Concept / Render / Present cùng đọc và áp. Manual-first (0 AI):
 * palette + tag/caption tay; VLM caption làm giàu sau.
 */

import { mixPaletteLab, paletteMood, type MoodWeight } from './gu/color-psychology';

export type { MoodWeight } from './gu/color-psychology';

export interface GuAsset {
  id: string;
  name: string;
  url: string;
  usage: string; // RefUsage
  palette: string[]; // hex
  caption: string;
  tags: string; // chuỗi tag tự do
  w: number;
  h: number;
}

export interface GuProfile {
  palette: string[]; // màu chủ đạo tổng hợp, xếp theo tần suất
  materials: string[]; // từ khoá vật liệu nhận ra
  styles: string[]; // từ khoá phong cách nhận ra
  keywords: string[]; // gộp cho prompt AI
  sampleUrls: string[]; // vài ảnh đại diện (dùng làm style-ref / IP-Adapter)
  count: number; // số ref đã dùng
  usages: string[]; // các usage có mặt
  /** HOOK ML pha 1 (proposal §2a.7) — tâm-lý-màu suy TẤT ĐỊNH từ palette (lib/gu/color-psychology).
   *  Optional để caller/JSON cũ (thiếu field) vẫn hợp lệ; xếp giảm dần theo tỉ trọng. */
  moods?: MoodWeight[];
}

/** Từ điển gợi ý — nhận diện vật liệu/phong cách trong tag + caption (VI + EN). */
const MATERIAL_TERMS = [
  'travertine', 'marble', 'đá', 'oak', 'sồi', 'walnut', 'óc chó', 'gỗ', 'wood', 'brass', 'đồng',
  'concrete', 'bê tông', 'terrazzo', 'linen', 'vải', 'rattan', 'mây', 'leather', 'da', 'stone',
  'porcelain', 'ceramic', 'glass', 'kính', 'steel', 'thép', 'velvet', 'nhung', 'bronze', 'gold',
  'wpc', 'spc', 'plaster', 'micro', 'granite',
];
const STYLE_TERMS = [
  'japandi', 'wabi-sabi', 'wabi sabi', 'quiet luxury', 'quiet-luxury', 'minimal', 'tối giản',
  'scandinavian', 'bắc âu', 'industrial', 'công nghiệp', 'contemporary', 'đương đại', 'warm', 'ấm',
  'editorial', 'luxury', 'sang trọng', 'modern', 'hiện đại', 'zen', 'thiền', 'natural', 'tự nhiên',
  'neoclassic', 'tân cổ điển', 'corporate', 'hạng a', 'organic', 'moody', 'cinematic', 'điện ảnh',
];

function norm(s: string): string {
  return (s || '').toLowerCase();
}

function pickTerms(haystack: string, dict: string[]): string[] {
  const h = norm(haystack);
  const hit: string[] = [];
  for (const t of dict) {
    if (h.includes(t) && !hit.includes(t)) hit.push(t);
  }
  return hit;
}

/**
 * Gộp palette nhiều ref → top N màu chủ đạo.
 *
 * HOOK ML pha 1 (proposal §2e / bảng chốt mục 4): thay so-hex-khít (đếm tần suất chuỗi hex —
 * '#8a5a3c' và '#8b5a3d' bị coi là 2 màu khác nhau dù mắt không phân biệt nổi) bằng GOM CỤM
 * LAB (`mixPaletteLab`, ΔE*76): màu gần nhau về cảm quan gộp 1 cụm, trả CENTROID cụm, xếp
 * giảm dần theo số màu trong cụm — tương đương "tần suất" cũ nhưng đúng cảm quan. Tất định.
 */
function mergePalette(assets: GuAsset[], topN = 6): string[] {
  const all: string[] = [];
  for (const a of assets) {
    for (const raw of a.palette || []) {
      const hex = norm(raw).trim();
      if (!/^#?[0-9a-f]{6}$/.test(hex)) continue;
      all.push(hex.startsWith('#') ? hex : `#${hex}`);
    }
  }
  return mixPaletteLab(all, { maxColors: topN });
}

/**
 * Trích hồ sơ gu từ tập ref. `opts.usage` lọc theo công dụng (vd chỉ 'ref-render' cho
 * chặng Render, hoặc MOOD_USAGES cho moodboard). Không truyền = dùng hết.
 */
export function buildGuProfile(assets: GuAsset[], opts?: { usage?: string[] }): GuProfile {
  const pool = opts?.usage?.length
    ? assets.filter((a) => opts.usage!.includes(a.usage))
    : assets.slice();

  const materials = new Set<string>();
  const styles = new Set<string>();
  for (const a of pool) {
    const text = `${a.name} ${a.tags} ${a.caption}`;
    pickTerms(text, MATERIAL_TERMS).forEach((t) => materials.add(t));
    pickTerms(text, STYLE_TERMS).forEach((t) => styles.add(t));
  }

  const palette = mergePalette(pool);
  const styleArr = [...styles];
  const matArr = [...materials];
  return {
    palette,
    materials: matArr,
    styles: styleArr,
    keywords: [...new Set([...styleArr, ...matArr])],
    sampleUrls: pool.slice(0, 4).map((a) => a.url),
    count: pool.length,
    usages: [...new Set(pool.map((a) => a.usage))],
    // HOOK ML pha 1: tâm-lý-màu tất định từ palette đã gộp (giải thích "vì sao gu này hợp").
    moods: paletteMood(palette).moods,
  };
}

/**
 * Xây hồ sơ gu TRỰC TIẾP từ tập ảnh ĐÃ CHỌN (không đọc cả thư viện).
 * Dùng cho moodboard/concept: gu (palette · vật liệu · phong cách) phải phản ánh
 * đúng những ảnh user vừa chọn cho sản phẩm này — không phải trung bình toàn Reference.
 * Chấp nhận LibAsset gọn (thiếu w/h/id vẫn được — không ảnh hưởng trích tag/palette).
 */
export function guProfileFromPicked(
  picked: Array<Partial<Pick<GuAsset, 'id' | 'w' | 'h'>> & Pick<GuAsset, 'name' | 'url' | 'usage' | 'palette' | 'caption' | 'tags'>>,
): GuProfile {
  const full: GuAsset[] = picked.map((a, i) => ({
    id: a.id ?? String(i),
    name: a.name ?? '',
    url: a.url ?? '',
    usage: a.usage ?? 'ref-render',
    palette: a.palette ?? [],
    caption: a.caption ?? '',
    tags: a.tags ?? '',
    w: a.w ?? 0,
    h: a.h ?? 0,
  }));
  return buildGuProfile(full);
}

/** Hồ sơ gu → mẩu mô tả nhồi vào prompt AI (render/moodboard). */
export function guToPrompt(p: GuProfile): string {
  const parts: string[] = [];
  if (p.styles.length) parts.push(p.styles.join(', '));
  if (p.materials.length) parts.push(`vật liệu: ${p.materials.join(', ')}`);
  if (p.palette.length) parts.push(`tông màu: ${p.palette.join(' ')}`);
  // HOOK ML pha 1: nối tâm-lý-màu (top 2, kèm tỉ trọng) — nhãn tiếng Anh của ColorMood vốn là
  // cụm mô tả cảm xúc (warm-inviting…) nên dùng thẳng cho prompt render. Thiếu moods = như cũ.
  if (p.moods?.length) {
    const top = p.moods.slice(0, 2).map((m) => `${m.mood} ${Math.round(m.weight * 100)}%`);
    parts.push(`mood: ${top.join(', ')}`);
  }
  return parts.join(' · ');
}

/** Client helper: kéo asset từ thư viện → hồ sơ gu (lọc theo usage nếu cần). */
export async function fetchGuProfile(usage?: string[]): Promise<GuProfile> {
  try {
    const r = await fetch('/api/library');
    const d = r.ok ? await r.json() : { assets: [] };
    const assets: GuAsset[] = (d.assets ?? []).map((a: Record<string, unknown>) => ({
      id: String(a.id),
      name: String(a.name ?? ''),
      url: String(a.url ?? ''),
      usage: String(a.usage ?? 'ref-render'),
      palette: Array.isArray(a.palette) ? (a.palette as string[]) : [],
      caption: String(a.caption ?? ''),
      tags: String(a.tags ?? ''),
      w: Number(a.w ?? 0),
      h: Number(a.h ?? 0),
    }));
    return buildGuProfile(assets, usage ? { usage } : undefined);
  } catch {
    return { palette: [], materials: [], styles: [], keywords: [], sampleUrls: [], count: 0, usages: [] };
  }
}
