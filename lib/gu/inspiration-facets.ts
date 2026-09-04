/**
 * lib/gu/inspiration-facets.ts — TỪ ĐIỂN FACET + QUY ƯỚC TAG cho bề mặt Cảm hứng (`/inspiration`).
 *
 * Thuần (không DOM, không fetch) — test bằng sucrase-node (`inspiration-facets.test.ts`).
 *
 * VÌ SAO Ở ĐÂY: Gu Engine (`lib/gu.ts`, `docs/GU-PROFILE.md`) đã học gu từ ảnh Pinterest bằng
 * từ điển vật liệu/phong cách/phòng. Bề mặt Cảm hứng là NƠI NẠP ảnh có nguồn cho chính Gu Engine +
 * Thẻ DNA, nên facet sống cạnh Gu — không đẻ "kho" mới (đọc `LibraryAsset` qua `GET /api/library`,
 * cùng cách Gallery liên ngành `lib/library/gallery-data.ts`).
 *
 * KHÔNG SỬA `lib/library/gallery-tags.ts` (ngoài vùng): tiền tố `license:`/`nguon:` của Gallery
 * được DÙNG LẠI nguyên văn (một tag, hai mặt tiền đọc). Tiền tố `style:`/`material:`/`light:`/
 * `frame:` là quy ước Distiller Thẻ DNA (`lib/dna/distiller.ts`) — cũng dùng lại nguyên văn, để
 * ảnh nhập từ đây chưng cất được bằng nút "Chưng cất từ ảnh" sẵn có, không cần dây riêng.
 *
 * Tiền tố MỚI (chỉ bề mặt này ghi, ai cũng đọc được):
 *   `inspo:1`         — đánh dấu ảnh thuộc bề mặt Cảm hứng (lọc nhanh, không phải phân loại).
 *   `duan:<projectId>` — tổ chức theo DỰ ÁN. `LibraryAsset` KHÔNG có cột projectId (kho chung cả
 *                        team — xem chú thích đầu `components/dna/DesignDnaCardPanel.tsx`) nên
 *                        gắn qua tag, cùng cơ chế `nganh:`/`bosuutap:` của Gallery.
 *   `space:<room>`    — loại không gian (nhãn EN chuẩn của `ROOM_TERMS`).
 *   `surface:<ceiling|wall|floor>` — ảnh nói về bề mặt nào (khi người/máy đã xác định).
 *
 * Luật: giá trị tag KHÔNG chứa dấu phẩy (cột `tags` là CSV). Mọi hàm ở đây tất định.
 */

import { ROOM_TERMS } from '../gu';

/* ─────────────────────────── tiền tố tag ─────────────────────────── */

export const INSPO_TAG = {
  marker: 'inspo:',
  project: 'duan:',
  space: 'space:',
  surface: 'surface:',
  /** dùng lại của Gallery (`lib/library/gallery-tags.ts`) — KHÔNG đổi chữ. */
  license: 'license:',
  source: 'nguon:',
  /** dùng lại của Distiller Thẻ DNA (`lib/dna/distiller.ts`) — KHÔNG đổi chữ. */
  style: 'style:',
  material: 'material:',
  light: 'light:',
  frame: 'frame:',
} as const;

export type SurfaceKind = 'ceiling' | 'wall' | 'floor';
export const SURFACE_KINDS: SurfaceKind[] = ['ceiling', 'wall', 'floor'];

export const SURFACE_LABEL: Record<SurfaceKind, [string, string]> = {
  ceiling: ['Trần', 'Ceiling'],
  wall: ['Tường', 'Wall'],
  floor: ['Sàn', 'Floor'],
};

/* ─────────────────────────── từ điển facet ─────────────────────────── */

/** Một mục từ điển: cụm khớp (VI/EN, chữ thường) → nhãn chuẩn EN (nhồi được vào prompt/Thẻ DNA). */
export type TermEntry = [string, string];

/** Bề mặt kiến trúc — thứ KTS nội thất soi đầu tiên khi xem ảnh tham khảo. */
export const SURFACE_TERMS: Array<[string, SurfaceKind]> = [
  ['trần thả', 'ceiling'], ['trần gỗ', 'ceiling'], ['trần', 'ceiling'], ['coffered', 'ceiling'],
  ['ceiling', 'ceiling'], ['cove', 'ceiling'], ['beam', 'ceiling'], ['dầm', 'ceiling'],
  ['ốp tường', 'wall'], ['vách', 'wall'], ['tường', 'wall'], ['wall', 'wall'], ['panel', 'wall'],
  ['fluted', 'wall'], ['wainscot', 'wall'], ['lam gỗ', 'wall'], ['slat', 'wall'],
  ['sàn gỗ', 'floor'], ['sàn', 'floor'], ['floor', 'floor'], ['parquet', 'floor'], ['herringbone', 'floor'],
  ['tile', 'floor'], ['gạch lát', 'floor'], ['rug', 'floor'], ['thảm', 'floor'], ['carpet', 'floor'],
];

/** Vật liệu hoàn thiện — mở rộng MATERIAL_TERMS của `lib/gu.ts` (không export bên đó; ở đây có
 * nhãn chuẩn EN để gắn thẳng vào tag `material:`). */
export const MATERIAL_TERMS: TermEntry[] = [
  ['travertine', 'travertine'], ['marble', 'marble'], ['đá cẩm thạch', 'marble'], ['đá', 'stone'], ['stone', 'stone'],
  ['granite', 'granite'], ['terrazzo', 'terrazzo'], ['concrete', 'concrete'], ['bê tông', 'concrete'],
  ['walnut', 'walnut'], ['óc chó', 'walnut'], ['oak', 'oak'], ['sồi', 'oak'], ['teak', 'teak'], ['ash', 'ash wood'],
  ['plywood', 'plywood'], ['veneer', 'veneer'], ['gỗ', 'wood'], ['wood', 'wood'], ['timber', 'wood'],
  ['brass', 'brass'], ['đồng', 'brass'], ['bronze', 'bronze'], ['steel', 'steel'], ['thép', 'steel'],
  ['inox', 'stainless steel'], ['stainless', 'stainless steel'], ['gold', 'gold'], ['chrome', 'chrome'],
  ['linen', 'linen'], ['vải lanh', 'linen'], ['velvet', 'velvet'], ['nhung', 'velvet'], ['bouclé', 'boucle'],
  ['boucle', 'boucle'], ['leather', 'leather'], ['da', 'leather'], ['vải', 'fabric'], ['fabric', 'fabric'],
  ['rattan', 'rattan'], ['mây', 'rattan'], ['cane', 'cane'], ['bamboo', 'bamboo'], ['tre', 'bamboo'],
  ['glass', 'glass'], ['kính', 'glass'], ['mirror', 'mirror'], ['gương', 'mirror'],
  ['ceramic', 'ceramic'], ['porcelain', 'porcelain'], ['gốm', 'ceramic'],
  ['plaster', 'plaster'], ['limewash', 'limewash'], ['microcement', 'microcement'], ['micro', 'microcement'],
  ['wpc', 'wpc'], ['spc', 'spc'], ['laminate', 'laminate'], ['paint', 'paint'], ['sơn', 'paint'],
];

/** Ánh sáng — kể giờ + kiểu nguồn sáng (chốt 10/08 "ánh sáng kể giờ"). */
export const LIGHT_TERMS: TermEntry[] = [
  ['golden hour', 'golden hour'], ['hoàng hôn', 'sunset'], ['sunset', 'sunset'], ['bình minh', 'sunrise'],
  ['daylight', 'daylight'], ['ban ngày', 'daylight'], ['nắng', 'sunlight'], ['sunlight', 'sunlight'],
  ['ban đêm', 'night'], ['night', 'night'], ['đêm', 'night'], ['evening', 'evening'],
  ['2700k', 'warm 2700K'], ['3000k', 'warm 3000K'], ['4000k', 'neutral 4000K'],
  ['ấm', 'warm light'], ['warm', 'warm light'], ['lạnh', 'cool light'], ['cool', 'cool light'],
  ['pendant', 'pendant light'], ['đèn thả', 'pendant light'], ['chandelier', 'chandelier'], ['đèn chùm', 'chandelier'],
  ['cove light', 'cove lighting'], ['hắt trần', 'cove lighting'], ['đèn hắt', 'cove lighting'],
  ['lantern', 'lantern light'], ['đèn lồng', 'lantern light'], ['candle', 'candlelight'], ['nến', 'candlelight'],
  ['spotlight', 'spotlight'], ['đèn rọi', 'spotlight'], ['backlit', 'backlit'], ['moody', 'moody light'],
  ['cinematic', 'cinematic light'], ['điện ảnh', 'cinematic light'], ['soft light', 'soft light'],
];

/** Ngôn ngữ không gian / phong cách — mở rộng STYLE_TERMS của `lib/gu.ts`. */
export const STYLE_TERMS: TermEntry[] = [
  ['japandi', 'japandi'], ['wabi-sabi', 'wabi-sabi'], ['wabi sabi', 'wabi-sabi'],
  ['quiet luxury', 'quiet luxury'], ['quiet-luxury', 'quiet luxury'], ['luxury', 'luxury'], ['sang trọng', 'luxury'],
  ['minimal', 'minimal'], ['tối giản', 'minimal'], ['scandinavian', 'scandinavian'], ['bắc âu', 'scandinavian'],
  ['industrial', 'industrial'], ['công nghiệp', 'industrial'], ['contemporary', 'contemporary'], ['đương đại', 'contemporary'],
  ['modern', 'modern'], ['hiện đại', 'modern'], ['zen', 'zen'], ['thiền', 'zen'], ['natural', 'natural'], ['tự nhiên', 'natural'],
  ['neoclassic', 'neoclassical'], ['tân cổ điển', 'neoclassical'], ['classic', 'classic'], ['cổ điển', 'classic'],
  ['organic', 'organic'], ['editorial', 'editorial'], ['mid-century', 'mid-century'], ['brutalist', 'brutalist'],
  ['art deco', 'art deco'], ['indochine', 'indochine'], ['đông dương', 'indochine'], ['tropical', 'tropical'],
  ['nhiệt đới', 'tropical'], ['coastal', 'coastal'], ['rustic', 'rustic'], ['mộc', 'rustic'], ['bohemian', 'bohemian'],
  ['symmetry', 'symmetry'], ['đối xứng', 'symmetry'],
];

/** Đồ nội thất — để lọc "chỉ đồ rời" có cơ sở từ chữ (khi không có mask). */
export const FURNITURE_TERMS: TermEntry[] = [
  ['sofa', 'sofa'], ['ghế sofa', 'sofa'], ['armchair', 'armchair'], ['ghế bành', 'armchair'],
  ['ghế', 'chair'], ['chair', 'chair'], ['stool', 'stool'], ['bàn ăn', 'dining table'], ['dining table', 'dining table'],
  ['bàn', 'table'], ['table', 'table'], ['desk', 'desk'], ['giường', 'bed'], ['bed', 'bed'],
  ['tủ bếp', 'kitchen cabinet'], ['tủ', 'cabinet'], ['cabinet', 'cabinet'], ['wardrobe', 'wardrobe'], ['kệ', 'shelf'],
  ['shelf', 'shelf'], ['bookcase', 'bookcase'], ['console', 'console'], ['sideboard', 'sideboard'],
  ['đèn bàn', 'table lamp'], ['lamp', 'lamp'], ['vanity', 'vanity'], ['bathtub', 'bathtub'], ['bồn tắm', 'bathtub'],
];

export type FacetKind = 'space' | 'surface' | 'material' | 'light' | 'style' | 'furniture';

export const FACET_LABEL: Record<FacetKind, [string, string]> = {
  space: ['Không gian', 'Space'],
  surface: ['Bề mặt', 'Surface'],
  material: ['Vật liệu', 'Material'],
  light: ['Ánh sáng', 'Light'],
  style: ['Ngôn ngữ', 'Language'],
  furniture: ['Đồ nội thất', 'Furniture'],
};

export type Facets = Record<FacetKind, string[]>;

export function emptyFacets(): Facets {
  return { space: [], surface: [], material: [], light: [], style: [], furniture: [] };
}

function norm(s: string): string {
  return (s || '').toLowerCase();
}

/** Khớp cụm theo từ điển — cụm dài đặt trước cụm ngắn trong từ điển để khớp cụ thể thắng khớp
 * chung. Kết quả unique, giữ thứ tự từ điển. */
function pick(haystack: string, dict: ReadonlyArray<readonly [string, string]>): string[] {
  const h = norm(haystack);
  if (!h) return [];
  const out: string[] = [];
  for (const [term, label] of dict) {
    if (h.includes(term) && !out.includes(label)) out.push(label);
  }
  return out;
}

/**
 * Trích facet từ chữ tự do (tên ảnh · caption · kết quả VLM · tag thô). Tất định, 0-key.
 * Mọi facet trả về đều là SUY từ chữ — tầng gọi gắn cờ `inferred` (không phải `measured`).
 */
export function extractFacetsFromText(text: string): Facets {
  return {
    space: pick(text, ROOM_TERMS),
    surface: pick(text, SURFACE_TERMS),
    material: pick(text, MATERIAL_TERMS),
    light: pick(text, LIGHT_TERMS),
    style: pick(text, STYLE_TERMS),
    furniture: pick(text, FURNITURE_TERMS),
  };
}

/* ─────────────────────────── đọc/ghi tag ─────────────────────────── */

export function splitTags(tags: string | undefined | null): string[] {
  return (tags ?? '').split(',').map((t) => t.trim()).filter(Boolean);
}

/**
 * Chữ TỰ DO trong cột `tags` để đưa vào `extractFacetsFromText`: bỏ mọi tag có tiền tố (`space:`,
 * `license:`, `nguon:`…) — từ điển quét substring nên `space:living room` sẽ khớp nhầm "spa"
 * (bug bắt được trên app thật 03/09). Tag có tiền tố đã được đọc có cấu trúc ở `parseInspirationTags`.
 */
export function tagsToFreeText(tags: string | undefined | null): string {
  return splitTags(tags).filter((t) => !t.includes(':')).join(' · ');
}

function valuesOf(list: string[], prefix: string): string[] {
  const out: string[] = [];
  for (const t of list) {
    if (t.toLowerCase().startsWith(prefix)) {
      const v = t.slice(prefix.length).trim();
      if (v && !out.includes(v)) out.push(v);
    }
  }
  return out;
}

export interface InspirationTagInfo {
  isInspiration: boolean;
  projectId: string | null;
  /** giấy phép THÔ (không ép về bảng Gallery — CC-BY hợp lệ nhưng không nằm trong 5 mã của Gallery). */
  license: string | null;
  source: string | null;
  facets: Facets;
}

/** Đọc mọi trục Cảm hứng từ `LibraryAsset.tags` (CSV thô). Tag lạ bị bỏ qua, không bịa. */
export function parseInspirationTags(tags: string | undefined | null): InspirationTagInfo {
  const list = splitTags(tags);
  const projectRaw = valuesOf(list, INSPO_TAG.project)[0] ?? null;
  const surfaces = valuesOf(list, INSPO_TAG.surface).filter((s): s is SurfaceKind =>
    (SURFACE_KINDS as string[]).includes(s),
  );
  return {
    isInspiration: valuesOf(list, INSPO_TAG.marker).length > 0,
    projectId: projectRaw,
    license: valuesOf(list, INSPO_TAG.license)[0] ?? null,
    source: valuesOf(list, INSPO_TAG.source)[0] ?? null,
    facets: {
      space: valuesOf(list, INSPO_TAG.space),
      surface: surfaces,
      material: [...valuesOf(list, INSPO_TAG.material), ...valuesOf(list, 'mat:')].filter((v, i, a) => a.indexOf(v) === i),
      light: valuesOf(list, INSPO_TAG.light),
      style: valuesOf(list, INSPO_TAG.style),
      furniture: [],
    },
  };
}

/** Giá trị tag không được chứa dấu phẩy (CSV) — thay bằng ';' để không vỡ cột. */
function safeTagValue(v: string): string {
  return v.replace(/,/g, ';').trim();
}

export interface BuildInspirationTagsInput {
  projectId?: string | null;
  license?: string | null;
  source?: string | null;
  facets?: Partial<Facets>;
  /** tag tự do thêm vào cuối (giữ nguyên). */
  extra?: string[];
}

/** Dựng chuỗi `tags` CSV cho một ảnh nhập vào bề mặt Cảm hứng. Luôn có `inspo:1` đứng đầu. */
export function buildInspirationTags(input: BuildInspirationTagsInput): string {
  const out: string[] = [`${INSPO_TAG.marker}1`];
  if (input.projectId) out.push(`${INSPO_TAG.project}${safeTagValue(input.projectId)}`);
  if (input.license) out.push(`${INSPO_TAG.license}${safeTagValue(input.license)}`);
  if (input.source) out.push(`${INSPO_TAG.source}${safeTagValue(input.source)}`);
  const f = input.facets ?? {};
  for (const v of f.space ?? []) out.push(`${INSPO_TAG.space}${safeTagValue(v)}`);
  for (const v of f.surface ?? []) out.push(`${INSPO_TAG.surface}${safeTagValue(v)}`);
  for (const v of f.material ?? []) out.push(`${INSPO_TAG.material}${safeTagValue(v)}`);
  for (const v of f.light ?? []) out.push(`${INSPO_TAG.light}${safeTagValue(v)}`);
  for (const v of f.style ?? []) out.push(`${INSPO_TAG.style}${safeTagValue(v)}`);
  for (const v of input.extra ?? []) {
    const s = safeTagValue(v);
    if (s) out.push(s);
  }
  return out.filter((v, i, a) => a.indexOf(v) === i).join(',');
}

/* ─────────────────────────── giấy phép ─────────────────────────── */

export type LicenseClass =
  /** dùng thương mại được, PHẢI ghi công (CC-BY, CC-BY-SA, Unsplash). */
  | 'lawful-attribution'
  /** dùng tự do, không cần ghi công (CC0, PDM, ảnh studio tự chụp). */
  | 'lawful-free'
  /** AI sinh — không phải ảnh thật, không phải bằng chứng hình học. */
  | 'ai'
  /** người dùng tự dán/tải, tự chịu trách nhiệm — chỉ tham khảo nội bộ. */
  | 'user-responsibility'
  /** không rõ / thiếu. */
  | 'unknown';

export interface LicenseInfo {
  cls: LicenseClass;
  attributionRequired: boolean;
  /** nhãn ngắn hiện trên thẻ (giữ nguyên chuỗi giấy phép nếu có). */
  label: string;
}

/** Phân loại chuỗi giấy phép thô (từ tag `license:` hoặc `StockPhoto.license`). Không đoán:
 * chuỗi không nhận ra ⇒ `unknown`. */
export function classifyLicense(raw: string | null | undefined): LicenseInfo {
  const s = norm(raw ?? '').trim();
  if (!s) return { cls: 'unknown', attributionRequired: false, label: '' };
  if (s === 'ai' || s.includes('ai-generated') || s.includes('ai sinh')) {
    return { cls: 'ai', attributionRequired: false, label: raw!.trim() };
  }
  if (s === 'studio' || s.includes('studio')) return { cls: 'lawful-free', attributionRequired: false, label: raw!.trim() };
  if (s === 'cc0' || s.startsWith('cc0') || s === 'pdm' || s.includes('public domain')) {
    return { cls: 'lawful-free', attributionRequired: false, label: raw!.trim() };
  }
  if (s.includes('unsplash')) return { cls: 'lawful-attribution', attributionRequired: true, label: raw!.trim() };
  if (s.startsWith('cc-by') || s.startsWith('cc by') || s === 'by' || s.startsWith('by-') || s.startsWith('by ')) {
    return { cls: 'lawful-attribution', attributionRequired: true, label: raw!.trim() };
  }
  if (s === 'user' || s.includes('tự chịu trách nhiệm') || s.includes('user-added') || s.includes('responsib')) {
    return { cls: 'user-responsibility', attributionRequired: false, label: raw!.trim() };
  }
  return { cls: 'unknown', attributionRequired: false, label: raw!.trim() };
}

/** Chuỗi lưu vào tag `license:` cho ảnh nhập từ nguồn ngoài — CHUẨN HOÁ nhỏ để đọc lại ổn định:
 * Openverse `BY 4.0` → `cc-by-4.0`, `CC0 1.0` → `cc0`; Unsplash → `unsplash`; link dán → `user`. */
export function normalizeLicenseTag(source: 'openverse' | 'unsplash' | 'link' | 'upload', rawLicense: string): string {
  if (source === 'unsplash') return 'unsplash';
  if (source === 'link') return 'user';
  const s = norm(rawLicense).replace(/\s+/g, ' ').trim();
  if (source === 'upload') return s || 'user';
  if (!s) return 'unknown';
  if (s.startsWith('cc0') || s === 'pdm') return 'cc0';
  if (s.startsWith('cc-')) return s.replace(/\s+/g, '-');
  if (s.startsWith('by') || s.startsWith('cc ')) return `cc-${s.replace(/^cc\s+/, '').replace(/\s+/g, '-')}`;
  return s.replace(/\s+/g, '-');
}

/* ─────────────────────────── nhập từ nguồn ngoài ─────────────────────────── */

/** Hình dạng tối thiểu của `StockPhoto` (`lib/stock-photos.ts`) mà hàm này cần — khai lại để giữ
 * file thuần không kéo theo import vòng; caller truyền thẳng `StockPhoto`. */
export interface StockPhotoLike {
  id: string;
  source: 'openverse' | 'unsplash' | 'link';
  title: string;
  license: string;
  landing: string;
  full: string;
  creditName: string;
}

/**
 * Tag CSV cho ảnh nhập từ Openverse/Unsplash/dán URL vào bề mặt Cảm hứng: `inspo:1` · dự án ·
 * giấy phép chuẩn hoá · nguồn (trang gốc, hoặc URL ảnh nếu không có trang) · facet suy từ tiêu đề
 * · `nganh:noi-that` (Gallery đọc được) · ghi công tác giả.
 */
export function stockPhotoImportTags(photo: StockPhotoLike, projectId: string | null | undefined): string {
  return buildInspirationTags({
    projectId: projectId ?? null,
    license: normalizeLicenseTag(photo.source, photo.license),
    source: photo.landing || photo.full,
    facets: extractFacetsFromText(photo.title),
    extra: ['nganh:noi-that', photo.creditName ? `credit:${photo.creditName}` : ''],
  });
}
