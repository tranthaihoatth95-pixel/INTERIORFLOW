/**
 * Gu Engine — TRÍCH gu thẩm mỹ từ thư viện Reference (KHÔNG hardcode).
 *
 * Nguyên tắc (user chốt 07/07): gu được trích từ Reference, mỗi sản phẩm mỗi khác,
 * linh hoạt. Module này gộp nhiều ref → 1 "hồ sơ gu" (palette · vật liệu · phong cách ·
 * ảnh style-ref) để Concept / Render / Present cùng đọc và áp. Manual-first (0 AI):
 * palette + tag/caption tay; VLM caption làm giàu sau.
 */

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

/** Gộp palette nhiều ref: đếm tần suất hex (chuẩn hoá #rrggbb), xếp giảm dần, lấy top N. */
function mergePalette(assets: GuAsset[], topN = 6): string[] {
  const freq = new Map<string, number>();
  for (const a of assets) {
    for (const raw of a.palette || []) {
      const hex = norm(raw).trim();
      if (!/^#?[0-9a-f]{6}$/.test(hex)) continue;
      const key = hex.startsWith('#') ? hex : `#${hex}`;
      freq.set(key, (freq.get(key) || 0) + 1);
    }
  }
  return [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, topN).map(([h]) => h);
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
