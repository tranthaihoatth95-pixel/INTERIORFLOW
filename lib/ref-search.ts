/**
 * Ref Search — tìm kiếm thư viện Reference NÂNG CẤP (0 AI, local, tức thì).
 *
 * Nâng cấp so với filter cũ (chỉ name+tag, trong 1 category):
 *   ① tìm cả CAPTION (mô tả gu) + usage label,
 *   ② XUYÊN category (không khoá trong 1 tab),
 *   ③ FUZZY VI–EN: bỏ dấu tiếng Việt + từ điển đồng nghĩa/song ngữ,
 *   ④ tìm theo MÀU/PALETTE (từ khoá màu VI/EN → khớp hex gần nhất).
 *
 * Đây là lớp STATISTIC/LEXICAL thuần — KHÔNG embedding, KHÔNG AI. Lớp ngữ nghĩa
 * (embedding/VLM) để dành cho Gu ML Engine (xem docs/REFERENCE-QA-AND-GU-ML.md).
 */

export interface SearchableAsset {
  name: string;
  tags: string;
  caption: string;
  usage: string;
  category: string;
  palette: string[];
}

/** Bỏ dấu tiếng Việt + hạ chữ thường + đ→d → so khớp không phụ thuộc dấu. */
export function normVi(s: string): string {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s#-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Từ điển đồng nghĩa / song ngữ VI–EN (đã bỏ dấu). Mỗi dòng là 1 CỤM tương đương —
 * gõ bất kỳ từ nào trong cụm sẽ khớp asset chứa từ khác cùng cụm. Trải rộng theo gu
 * nội thất: vật liệu, phong cách, không gian, màu. Mở rộng dần khi có dữ liệu thật.
 */
const SYNONYM_GROUPS: string[][] = [
  // vật liệu
  ['go', 'wood', 'timber', 'oak', 'soi', 'walnut', 'oc cho', 'ash', 'teak'],
  ['da', 'stone', 'marble', 'da marble', 'travertine', 'granite', 'da hoa cuong'],
  ['dong', 'brass', 'bronze', 'copper', 'gold', 'vang'],
  ['be tong', 'concrete', 'micro cement', 'microcement', 'xi mang'],
  ['vai', 'fabric', 'linen', 'cotton', 'textile', 'nhung', 'velvet'],
  ['may', 'rattan', 'wicker', 'dan', 'weave'],
  ['kinh', 'glass', 'guong', 'mirror'],
  ['thep', 'steel', 'metal', 'kim loai', 'inox'],
  ['gach', 'tile', 'ceramic', 'porcelain', 'gom', 'su'],
  // phong cach
  ['toi gian', 'minimal', 'minimalist', 'don gian'],
  ['quiet luxury', 'sang trong', 'luxury', 'cao cap', 'hang a'],
  ['bac au', 'scandinavian', 'nordic', 'scandi'],
  ['cong nghiep', 'industrial', 'loft'],
  ['duong dai', 'contemporary', 'hien dai', 'modern'],
  ['thien', 'zen', 'japandi', 'wabi sabi', 'wabi-sabi'],
  ['tan co dien', 'neoclassic', 'neo classic', 'co dien', 'classic'],
  ['am', 'warm', 'am cung', 'cozy'],
  ['dien anh', 'cinematic', 'moody', 'toi'],
  ['tu nhien', 'natural', 'organic', 'moc'],
  // khong gian / cong nang
  ['phong khach', 'living room', 'living', 'phong sinh hoat'],
  ['phong ngu', 'bedroom', 'master bedroom', 'phong ngu master'],
  ['bep', 'kitchen', 'phong bep', 'nha bep'],
  ['phong an', 'dining', 'dining room', 'ban an'],
  ['van phong', 'office', 'workspace', 'lam viec'],
  ['ve sinh', 'bathroom', 'toilet', 'wc', 'nha tam'],
  ['sanh', 'lobby', 'reception', 'le tan', 'don tiep'],
  ['mat bang', 'floor plan', 'layout', 'plan', 'so do'],
  ['phoi canh', 'perspective', 'render', '3d'],
  ['ngoai that', 'exterior', 'facade', 'mat dung'],
  ['noi that', 'interior'],
];

// index từ → nhóm (để mở rộng token nhanh)
const WORD_TO_GROUP = new Map<string, Set<string>>();
for (const group of SYNONYM_GROUPS) {
  const flat = new Set<string>();
  for (const w of group) flat.add(normVi(w));
  for (const w of flat) {
    const cur = WORD_TO_GROUP.get(w) ?? new Set<string>();
    for (const x of flat) cur.add(x);
    WORD_TO_GROUP.set(w, cur);
  }
}

/** Từ khoá màu VI/EN → hex đại diện (để tìm theo palette). */
const COLOR_TERMS: Record<string, string> = {
  trang: '#f5f5f2', white: '#f5f5f2', kem: '#efe7d8', cream: '#efe7d8', beige: '#e8dcc6',
  den: '#1a1a1a', black: '#1a1a1a', xam: '#8a8a8a', gray: '#8a8a8a', grey: '#8a8a8a',
  nau: '#6b4f36', brown: '#6b4f36', 'go': '#a9804f', wood: '#a9804f',
  xanh: '#2f6b5e', green: '#2f6b5e', 'xanh la': '#3f7d4a', 'xanh duong': '#2b4a7a', blue: '#2b4a7a',
  do: '#a33a2f', red: '#a33a2f', cam: '#c9772e', orange: '#c9772e',
  vang: '#c9a94e', yellow: '#c9a94e', gold: '#b8912f',
  hong: '#d79aa0', pink: '#d79aa0', tim: '#6b4d7a', purple: '#6b4d7a',
  'am': '#b08050', warm: '#b08050', 'lanh': '#5a7a8a', cool: '#5a7a8a',
};

function hexToRgb(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbDist(a: [number, number, number], b: [number, number, number]): number {
  return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2);
}

/** Khoảng cách gần nhất từ 1 màu tới palette (0..441). null nếu palette rỗng. */
function nearestPaletteDist(target: string, palette: string[]): number | null {
  const t = hexToRgb(target);
  if (!t) return null;
  let best: number | null = null;
  for (const p of palette) {
    const c = hexToRgb(p);
    if (!c) continue;
    const d = rgbDist(t, c);
    if (best === null || d < best) best = d;
  }
  return best;
}

/** Khoảng cách Levenshtein (fuzzy gõ sai) — chỉ dùng cho token ngắn để rẻ. */
function editDist(a: string, b: string): number {
  const m = a.length, n = b.length;
  if (Math.abs(m - n) > 2) return 3; // cắt sớm
  const dp = Array.from({ length: m + 1 }, (_, i) => i);
  for (let j = 1; j <= n; j++) {
    let prev = dp[0];
    dp[0] = j;
    for (let i = 1; i <= m; i++) {
      const tmp = dp[i];
      dp[i] = Math.min(
        dp[i] + 1,
        dp[i - 1] + 1,
        prev + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      prev = tmp;
    }
  }
  return dp[m];
}

/** Token khớp haystack (đã norm): substring, hoặc fuzzy edit-distance cho từ ≥4 ký tự. */
function tokenHits(token: string, hayWords: string[]): boolean {
  if (token.length < 2) return false;
  for (const w of hayWords) {
    if (w.includes(token) || token.includes(w)) return true;
    if (token.length >= 4 && w.length >= 4 && editDist(token, w) <= 1) return true;
  }
  return false;
}

/**
 * Điểm khớp 1 asset với truy vấn (0 = không khớp). Cộng theo trường + đồng nghĩa + màu.
 * Trọng số: tên/tag cao nhất (nhãn người gõ), caption vừa (mô tả gu), usage/category thấp.
 */
export function scoreAsset(query: string, a: SearchableAsset): number {
  const q = normVi(query);
  if (!q) return 1; // không có truy vấn → mọi asset "đạt" (điểm nền)
  const rawTokens = q.split(' ').filter((t) => t.length >= 2);
  if (!rawTokens.length) return 1;

  // mở rộng token bằng đồng nghĩa (giữ token gốc)
  const tokens = new Set<string>();
  for (const t of rawTokens) {
    tokens.add(t);
    const grp = WORD_TO_GROUP.get(t);
    if (grp) for (const g of grp) tokens.add(g);
  }

  const nameW = normVi(a.name).split(' ');
  const tagW = normVi(a.tags).split(' ');
  const capW = normVi(a.caption).split(' ');
  const usageW = normVi(a.usage).split(' ');
  const catW = normVi(a.category).split(' ');

  let score = 0;
  let matchedRaw = 0;
  for (const t of rawTokens) {
    // token GỐC người gõ khớp trực tiếp → đảm bảo mỗi từ đều có mặt (AND mềm)
    const grp = WORD_TO_GROUP.get(t);
    const variants = grp ? [...grp] : [t];
    const hitAny = variants.some(
      (v) =>
        tokenHits(v, nameW) ||
        tokenHits(v, tagW) ||
        tokenHits(v, capW) ||
        tokenHits(v, usageW) ||
        tokenHits(v, catW),
    );
    if (hitAny) matchedRaw++;
  }
  // Nếu KHÔNG từ nào (kể cả đồng nghĩa) khớp text → thử màu; nếu vẫn không → 0.
  for (const t of [...tokens]) {
    if (tokenHits(t, nameW)) score += 3;
    if (tokenHits(t, tagW)) score += 3;
    if (tokenHits(t, capW)) score += 2;
    if (tokenHits(t, usageW)) score += 1;
    if (tokenHits(t, catW)) score += 1;
  }

  // Tìm theo MÀU: nếu truy vấn có từ khoá màu, khớp palette gần nhất.
  for (const t of rawTokens) {
    const hex = COLOR_TERMS[t];
    if (!hex) continue;
    const d = nearestPaletteDist(hex, a.palette || []);
    if (d !== null) {
      if (d < 40) score += 3;
      else if (d < 90) score += 1.5;
    }
  }

  // Yêu cầu ít nhất 1 từ gốc khớp (text hoặc màu) để tránh nhiễu.
  const colorMatched = rawTokens.some((t) => {
    const hex = COLOR_TERMS[t];
    if (!hex) return false;
    const d = nearestPaletteDist(hex, a.palette || []);
    return d !== null && d < 90;
  });
  if (matchedRaw === 0 && !colorMatched) return 0;

  // Thưởng khi khớp NHIỀU từ gốc (khớp cụm sát ý hơn).
  score += matchedRaw * 1.5;
  return score;
}

export interface SearchOptions {
  /** true = tìm xuyên mọi category; false = giới hạn trong `category`. */
  crossCategory?: boolean;
  /** category đang chọn (khi crossCategory=false). */
  category?: string;
}

/**
 * HIỂN THỊ THEO NGỮ CẢNH — mỗi CHẶNG (Concept/Layout-CAD · Render · Present) quan tâm
 * nhóm usage khác nhau. Dùng để (a) ưu tiên category liên quan lên đầu, (b) nổi asset
 * đúng nhu cầu chặng. KHÔNG khoá — chỉ sắp xếp lại (nguyên tắc "chặng mềm").
 */
export type RefPhase = 'concept' | 'render' | 'present';

/** usage được ưu tiên theo chặng (khớp lib/phases.ts). */
export const PHASE_USAGES: Record<RefPhase, string[]> = {
  concept: ['cad', 'layout', 'furniture'], // Layout CAD: bản vẽ, mặt bằng, đồ rời
  render: ['ref-render', 'material', 'furniture'], // Render: ảnh nội thất, vật liệu, furniture
  present: ['slide', 'layout'], // Present: ảnh mood/slide, template dàn trang
};

/** category thư viện được ưu tiên theo chặng (khớp LIBRARY_CATEGORIES). */
export const PHASE_CATEGORIES: Record<RefPhase, string[]> = {
  concept: ['CAD / Sketch'],
  render: ['Ref nội thất', 'Ref ngoại thất', 'Vật liệu / Texture'],
  present: ['Style dàn trang', 'Ref nội thất'],
};

/** Điểm liên quan của 1 usage với chặng hiện tại (2 = ưu tiên, 0 = trung tính). */
export function phaseRelevance(phase: RefPhase | null | undefined, usage: string): number {
  if (!phase) return 0;
  return PHASE_USAGES[phase]?.includes(usage) ? 2 : 0;
}

/** Sắp xếp category: nhóm liên quan chặng lên trước, giữ thứ tự tương đối còn lại. */
export function orderCategoriesByPhase(cats: readonly string[], phase: RefPhase | null | undefined): string[] {
  if (!phase) return [...cats];
  const pref = new Set(PHASE_CATEGORIES[phase] ?? []);
  return [...cats].sort((a, b) => Number(pref.has(b)) - Number(pref.has(a)));
}

/** Lọc + xếp hạng theo điểm. Trả mảng đã sort giảm dần (giữ nguyên thứ tự khi query rỗng). */
export function searchAssets<T extends SearchableAsset>(
  query: string,
  assets: T[],
  opts: SearchOptions = {},
): T[] {
  const q = query.trim();
  const scoped = opts.crossCategory
    ? assets
    : assets.filter((a) => !opts.category || a.category === opts.category);
  if (!q) return scoped;
  return scoped
    .map((a) => ({ a, s: scoreAsset(q, a) }))
    .filter((x) => x.s > 0)
    .sort((x, y) => y.s - x.s)
    .map((x) => x.a);
}
