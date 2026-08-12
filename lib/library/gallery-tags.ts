// lib/library/gallery-tags.ts — QUY ƯỚC TAG cho Gallery liên ngành (K · 12/08, phiếu
// `docs/phieu-giao/gallery-lien-nganh.md`).
//
// LUẬT NỀN (00-CHOT.md [12/08 Hoà gật ④]): "GALLERY = kho ảnh tuyển LIÊN NGÀNH… KHÔNG đẻ kho
// mới" — Gallery đọc ĐÚNG `LibraryAsset` đã có (`prisma/schema.prisma:278`), không thêm cột DB.
// Mọi phân loại mới của Gallery (nhóm ngành · giấy phép · nguồn · bộ sưu tập) encode vào
// `LibraryAsset.tags` (chuỗi CSV) theo 4 tiền tố dưới đây — cùng cơ chế `shelf:`/`thumb:`/`code:`
// đã dùng ở `lib/library/db-items.ts`.
//
// Thuần (không DOM, không fetch) — test được bằng sucrase-node.

/** 5 nhóm ngành LIÊN NGÀNH (chốt 12/08: kiến trúc · nội thất · cảnh quan · graphic · art). */
export type GalleryIndustry = 'kien-truc' | 'noi-that' | 'canh-quan' | 'graphic' | 'art';

export const GALLERY_INDUSTRIES: { id: GalleryIndustry; label: [string, string] }[] = [
  { id: 'kien-truc', label: ['Kiến trúc', 'Architecture'] },
  { id: 'noi-that', label: ['Nội thất', 'Interior'] },
  { id: 'canh-quan', label: ['Cảnh quan', 'Landscape'] },
  { id: 'graphic', label: ['Graphic', 'Graphic design'] },
  { id: 'art', label: ['Art', 'Art'] },
];

const INDUSTRY_IDS = new Set<string>(GALLERY_INDUSTRIES.map((g) => g.id));

/** Giấy phép — phải khai RÕ để ảnh dùng lại được cho hồ sơ khách (đối lập trực tiếp với
 * "Pinterest/Google — ảnh rác, không nguồn, không giấy phép" nêu ở phiếu ①). */
export type GalleryLicense = 'cc0' | 'unsplash' | 'studio' | 'ai' | 'user';

export const GALLERY_LICENSES: { id: GalleryLicense; label: [string, string] }[] = [
  { id: 'cc0', label: ['CC0', 'CC0'] },
  { id: 'unsplash', label: ['Unsplash License', 'Unsplash License'] },
  { id: 'studio', label: ['Ảnh của studio', "Studio's own"] },
  { id: 'ai', label: ['AI sinh', 'AI-generated'] },
  { id: 'user', label: ['Người dùng thêm', 'User-added'] },
];

const LICENSE_IDS = new Set<string>(GALLERY_LICENSES.map((l) => l.id));

/** Tiền tố tag chuẩn — DUY NHẤT nơi khai (đừng gõ chuỗi tay ở nơi khác). */
export const GALLERY_TAG_PREFIX = {
  nganh: 'nganh:',
  license: 'license:',
  nguon: 'nguon:',
  bosuutap: 'bosuutap:',
} as const;

export function isGalleryIndustry(v: string): v is GalleryIndustry {
  return INDUSTRY_IDS.has(v);
}

export function isGalleryLicense(v: string): v is GalleryLicense {
  return LICENSE_IDS.has(v);
}

/** Dựng 1 tag chuẩn — dùng khi ghi tag (seed script, form nhập). */
export function buildGalleryTag(kind: keyof typeof GALLERY_TAG_PREFIX, value: string): string {
  return `${GALLERY_TAG_PREFIX[kind]}${value}`;
}

function splitTags(tags: string): string[] {
  return tags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean);
}

function firstTagged(list: string[], prefix: string): string | null {
  const hit = list.find((t) => t.startsWith(prefix));
  return hit ? hit.slice(prefix.length) : null;
}

function allTagged(list: string[], prefix: string): string[] {
  return list.filter((t) => t.startsWith(prefix)).map((t) => t.slice(prefix.length)).filter(Boolean);
}

export interface GalleryTagInfo {
  nganh: GalleryIndustry | null;
  license: GalleryLicense | null;
  /** Nguồn — chuỗi tự do (URL hoặc tên đơn vị/tác giả), giữ nguyên hoa/thường. */
  nguon: string | null;
  bosuutap: string[];
}

/** Đọc 4 trục Gallery từ `LibraryAsset.tags` (chuỗi CSV thô). Giá trị lạ (không khớp bảng đã
 * biết) bị bỏ qua — KHÔNG bịa phân loại (N4), thà null còn hơn gán sai nhóm/giấy phép. */
export function parseGalleryTags(tags: string): GalleryTagInfo {
  const list = splitTags(tags ?? '');
  const nganhRaw = firstTagged(list, GALLERY_TAG_PREFIX.nganh);
  const licenseRaw = firstTagged(list, GALLERY_TAG_PREFIX.license);
  // `nguon:` là chuỗi tự do (URL có thể chứa dấu ':' — lấy phần CÒN LẠI của thẻ, không split theo
  // dấu phẩy nội bộ; vì toàn bộ tag đã tách theo dấu phẩy ở splitTags nên giá trị nguồn không được
  // chứa dấu phẩy — chấp nhận được, đúng khuôn CSV chung của cột `tags`).
  const nguonRaw = firstTagged(list, GALLERY_TAG_PREFIX.nguon);
  return {
    nganh: nganhRaw && isGalleryIndustry(nganhRaw) ? nganhRaw : null,
    license: licenseRaw && isGalleryLicense(licenseRaw) ? licenseRaw : null,
    nguon: nguonRaw && nguonRaw.length > 0 ? nguonRaw : null,
    bosuutap: allTagged(list, GALLERY_TAG_PREFIX.bosuutap),
  };
}

/** VIỆC 3 (phiếu): ảnh THIẾU nguồn hoặc giấy phép → KHÔNG vào được bộ sưu tập xu hướng — chặn ở
 * ĐÚNG MỘT HÀM này, mọi nơi (component, test) gọi lại, không tự viết điều kiện lần hai. */
export function canJoinCollection(info: Pick<GalleryTagInfo, 'nguon' | 'license'>): boolean {
  return !!info.nguon && !!info.license;
}

/** Thông điệp khi ảnh bị chặn khỏi bộ sưu tập — SPEC-NGON-NGU-CHI-DAN (hành động trước · nêu lý
 * do · không jargon nội bộ). Dùng cho tooltip/():"vì sao ảnh này không có trong bộ sưu tập". */
export const MISSING_SOURCE_MESSAGE: [string, string] = [
  'Chưa vào được bộ sưu tập — thiếu nguồn hoặc giấy phép.',
  "Not in a collection yet — missing source or license.",
];
