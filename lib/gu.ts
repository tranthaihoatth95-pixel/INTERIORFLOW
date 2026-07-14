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
  /** SUBJECT/ROOM (proposal §2a.2, Sprint 2) — loại không gian nhận từ ROOM_TERMS quét
   *  name+tag+caption, xếp GIẢM DẦN theo tần suất. Optional — JSON cũ thiếu field vẫn hợp lệ. */
  subject?: string[];
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

/**
 * Từ điển PHÒNG/SUBJECT (proposal §2a.2) — VI + EN, dạng [cụm khớp → nhãn subject chuẩn EN].
 * Cùng cơ chế substring như MATERIAL/STYLE_TERMS; cụm DÀI đặt trước cụm ngắn cùng nhóm để
 * khớp cụ thể thắng khớp chung. Nhãn chuẩn tiếng Anh để nhồi thẳng prompt render.
 */
export const ROOM_TERMS: [string, string][] = [
  // nhà ở
  ['phòng khách', 'living room'], ['living room', 'living room'], ['livingroom', 'living room'],
  ['phòng ngủ master', 'master bedroom'], ['master bedroom', 'master bedroom'],
  ['phòng ngủ', 'bedroom'], ['bedroom', 'bedroom'],
  ['phòng trẻ em', 'kids room'], ['kids room', 'kids room'],
  ['phòng ăn', 'dining room'], ['dining room', 'dining room'], ['dining', 'dining room'],
  ['bếp', 'kitchen'], ['kitchen', 'kitchen'], ['pantry', 'kitchen'],
  ['phòng tắm', 'bathroom'], ['bathroom', 'bathroom'], ['vệ sinh', 'bathroom'], ['toilet', 'bathroom'],
  ['ban công', 'balcony'], ['balcony', 'balcony'],
  ['phòng thay đồ', 'walk-in closet'], ['walk-in', 'walk-in closet'],
  // làm việc
  ['phòng làm việc', 'home office'], ['home office', 'home office'],
  ['phòng họp', 'meeting room'], ['meeting room', 'meeting room'],
  ['văn phòng', 'office'], ['workspace', 'office'], ['office', 'office'],
  // hospitality / thương mại
  ['sảnh', 'lobby'], ['lobby', 'lobby'], ['lễ tân', 'lobby'], ['reception', 'lobby'],
  ['hành lang', 'corridor'], ['corridor', 'corridor'],
  ['nhà hàng', 'restaurant'], ['restaurant', 'restaurant'],
  ['quầy bar', 'bar'], ['café', 'cafe'], ['cafe', 'cafe'], ['coffee', 'cafe'],
  ['showroom', 'showroom'], ['cửa hàng', 'shop'],
  ['spa', 'spa'], ['gym', 'gym'],
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

/** Quét ROOM_TERMS trên 1 chuỗi → tập nhãn subject (unique, giữ thứ tự từ điển). */
function pickSubjects(haystack: string): string[] {
  const h = norm(haystack);
  const hit: string[] = [];
  for (const [term, label] of ROOM_TERMS) {
    if (h.includes(term) && !hit.includes(label)) hit.push(label);
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
  // subject đếm TẦN SUẤT (mỗi asset góp tối đa 1 phiếu/subject) — xếp giảm dần, tie-break
  // theo thứ tự gặp đầu tiên → tất định.
  const subjectCount = new Map<string, number>();
  for (const a of pool) {
    const text = `${a.name} ${a.tags} ${a.caption}`;
    pickTerms(text, MATERIAL_TERMS).forEach((t) => materials.add(t));
    pickTerms(text, STYLE_TERMS).forEach((t) => styles.add(t));
    pickSubjects(text).forEach((s) => subjectCount.set(s, (subjectCount.get(s) ?? 0) + 1));
  }
  const subject = [...subjectCount.entries()].sort((a, b) => b[1] - a[1]).map(([s]) => s);

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
    // Sprint 2 (§2a.2): subject phòng từ ROOM_TERMS — mảng rỗng khi không nhận ra gì.
    subject,
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
  // Sprint 2 (§2a.2): subject ĐỨNG ĐẦU prompt — "bedroom interior, japandi…" đúng ngữ pháp
  // prompt render. Thiếu subject (JSON cũ / không nhận ra) = prompt y hệt trước.
  if (p.subject?.length) parts.push(`${p.subject.slice(0, 2).join(', ')} interior`);
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
