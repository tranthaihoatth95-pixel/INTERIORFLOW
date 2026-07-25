/**
 * lib/stock-photos.ts — NGUỒN ẢNH NGOÀI (stock) dùng chung cho mọi chỗ cần ảnh:
 * nền đăng nhập (Đổi nền) · Reference · moodboard · illustration picker.
 *
 * Phần này THUẦN (không fetch, không DOM) để test bằng `sucrase-node lib/stock-photos.test.ts`.
 * Phần gọi mạng nằm ở `app/api/stock-photos/*` (server-side, giữ key không lộ ra client).
 *
 * ── 3 nguồn (theo chốt user 25/07) ─────────────────────────────────────────────
 *  ① `openverse` — API công khai, KHÔNG cần key. Ảnh CC dùng thương mại được.
 *  ② `unsplash`  — cần `UNSPLASH_ACCESS_KEY`. Thiếu key → nguồn tự ẨN (không lỗi).
 *  ③ `link`      — DÁN URL ảnh trực tiếp (hoặc upload từ máy ở phía UI).
 *
 * ⚠️ PINTEREST — GIỚI HẠN THẬT, ĐỌC TRƯỚC KHI ĐỊNH "THÊM NGUỒN PINTEREST":
 *   Pinterest KHÔNG có API tìm ảnh công khai dùng được. API v5 của họ (a) phải đăng ký app
 *   + qua app review, (b) chỉ truy cập pin/board CỦA CHÍNH user đã OAuth, (c) không có
 *   endpoint search ảnh cho bên thứ ba. Scrape trang pin/board là VI PHẠM ToS Pinterest
 *   (§ "you won't scrape... or otherwise access Pinterest by automated means") → KHÔNG LÀM.
 *   ⇒ Cách hỗ trợ Pinterest DUY NHẤT hợp lệ ở đây: user tự lấy ảnh ra khỏi Pinterest
 *     (chuột phải → "Copy image address", hoặc tải về máy) rồi DÁN URL ảnh trực tiếp /
 *     UPLOAD vào IF. Đó là nguồn `link` bên dưới. Xem docs/IMAGE-SOURCES.md.
 *
 * ⚠️ ĐIỀU KHOẢN UNSPLASH (bắt buộc tuân, nếu bỏ là bị rút key):
 *   - Ghi công tác giả + link về profile tác giả và về Unsplash, có UTM `?utm_source=…`.
 *   - Khi user THỰC SỰ dùng 1 ảnh → phải ping `links.download_location` (endpoint đếm tải).
 *     `unsplashDownloadUrl()` + route `POST /api/stock-photos` action `use` lo việc này.
 *   - KHÔNG tự dựng lại dịch vụ giống Unsplash, không cache ảnh thành thư viện riêng.
 */

/** Mã nguồn ảnh. `link` không phải API — là URL user tự dán / ảnh upload. */
export type StockSourceId = 'openverse' | 'unsplash' | 'link';

export interface StockSourceInfo {
  id: StockSourceId;
  /** nhãn hiển thị (song ngữ — UI chọn theo lang). */
  vi: string;
  en: string;
  /** có tìm kiếm bằng từ khoá không (link thì không). */
  searchable: boolean;
  /** cần API key ở server không. */
  needsKey: boolean;
  /** ghi chú giới hạn hiện cho user (song ngữ). */
  noteVi?: string;
  noteEn?: string;
}

export const STOCK_SOURCES: StockSourceInfo[] = [
  {
    id: 'openverse',
    vi: 'Openverse (CC)',
    en: 'Openverse (CC)',
    searchable: true,
    needsKey: false,
    noteVi: 'Ảnh Creative Commons, dùng thương mại được. Vẫn phải ghi công theo giấy phép.',
    noteEn: 'Creative Commons images, commercial use allowed. Attribution still required.',
  },
  {
    id: 'unsplash',
    vi: 'Unsplash',
    en: 'Unsplash',
    searchable: true,
    needsKey: true,
    noteVi: 'Miễn phí kể cả thương mại. Bắt buộc ghi công tác giả + link (IF tự chèn).',
    noteEn: 'Free incl. commercial. Photographer credit + link required (IF adds it).',
  },
  {
    id: 'link',
    vi: 'Dán URL / Pinterest',
    en: 'Paste URL / Pinterest',
    searchable: false,
    needsKey: false,
    noteVi:
      'Pinterest KHÔNG có API tìm ảnh công khai → mở pin trên Pinterest, chuột phải ảnh → ' +
      '“Copy image address”, rồi dán vào đây (hoặc tải về và upload). Bạn tự chịu trách nhiệm ' +
      'bản quyền ảnh dán vào.',
    noteEn:
      'Pinterest has no public image-search API → open the pin, right-click the image → ' +
      '“Copy image address”, paste it here (or download and upload it). You are responsible ' +
      'for the rights to any image you paste.',
  },
];

/** Ảnh đã chuẩn hoá — MỌI nguồn trả về cùng hình dạng này. */
export interface StockPhoto {
  /** id ổn định trong phạm vi nguồn. */
  id: string;
  source: StockSourceId;
  /** ảnh nhỏ để hiện lưới chọn. */
  thumb: string;
  /** ảnh dùng thật (bản đủ lớn). */
  full: string;
  width?: number;
  height?: number;
  title: string;
  /** tên tác giả — RỖNG nghĩa là không rõ, UI vẫn phải hiện nguồn. */
  creditName: string;
  /** link profile tác giả (nếu có). */
  creditUrl: string;
  /** vd 'CC-BY', 'Unsplash License'. */
  license: string;
  licenseUrl: string;
  /** trang gốc của ảnh (để user kiểm chứng). */
  landing: string;
  /** Unsplash: endpoint đếm tải — PHẢI ping khi user dùng ảnh. Nguồn khác: ''. */
  downloadLocation?: string;
}

/* ────────────────────────── kiểm tra URL (chống SSRF) ────────────────────────── */

/**
 * Host KHÔNG được fetch: loopback, link-local (kể cả 169.254.169.254 = metadata cloud),
 * dải riêng RFC1918, IPv6 loopback/ULA, tên nội bộ (`*.local`, `*.internal`, không có dấu chấm).
 * Mỗi mục là một mẫu ĐẦY ĐỦ hoặc tiền tố rõ ràng — KHÔNG gộp `^…$` với tiền tố (bug 25/07:
 * `^(127\.|…)$` chỉ khớp đúng chuỗi "127." nên 127.0.0.1 lọt qua).
 */
function isPrivateHost(host: string): boolean {
  const h = host.replace(/^\[|\]$/g, '').toLowerCase();
  if (h === 'localhost' || h === '::1' || h === '0.0.0.0') return true;
  if (!h.includes('.') && !h.includes(':')) return true; // tên máy trần trong LAN
  if (h.endsWith('.local') || h.endsWith('.internal') || h.endsWith('.localhost')) return true;
  if (/^fc|^fd/.test(h) && h.includes(':')) return true; // IPv6 ULA
  if (/^127\./.test(h) || /^10\./.test(h) || /^169\.254\./.test(h) || /^192\.168\./.test(h)) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(h)) return true;
  return false;
}

/**
 * URL ảnh do user DÁN có an toàn để server fetch không?
 * Chặn: giao thức khác http(s), host nội bộ/loopback/link-local/dải riêng (SSRF), URL rỗng.
 * KHÔNG kiểm đuôi file — nhiều CDN ảnh không có đuôi; content-type kiểm ở route.
 */
export function isFetchableImageUrl(raw: string): { ok: true; url: string } | { ok: false; reason: string } {
  const s = (raw ?? '').trim();
  if (!s) return { ok: false, reason: 'Chưa nhập URL.' };
  let u: URL;
  try {
    u = new URL(s);
  } catch {
    return { ok: false, reason: 'URL không hợp lệ (thiếu https://?).' };
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') {
    return { ok: false, reason: 'Chỉ nhận http/https.' };
  }
  if (isPrivateHost(u.hostname)) {
    return { ok: false, reason: 'Không nhận địa chỉ nội bộ.' };
  }
  return { ok: true, url: u.toString() };
}

/** Host Pinterest (trang pin/board) — KHÔNG phải URL ảnh. Dùng để báo lỗi tử tế, không scrape. */
export function isPinterestPageUrl(raw: string): boolean {
  try {
    const h = new URL((raw ?? '').trim()).hostname.toLowerCase();
    return /(^|\.)pinterest\.[a-z.]+$|(^|\.)pin\.it$/.test(h);
  } catch {
    return false;
  }
}

/**
 * Thông điệp hướng dẫn khi user dán link TRANG Pinterest thay vì URL ảnh.
 * Cố tình KHÔNG tự đi lấy ảnh từ trang đó (ToS Pinterest cấm truy cập tự động).
 */
export const PINTEREST_HINT_VI =
  'Đây là link TRANG Pinterest, không phải URL ảnh. Pinterest không cho ứng dụng khác đọc pin ' +
  'của bạn nếu chưa kết nối tài khoản, và tự động tải ảnh từ trang họ là vi phạm điều khoản. ' +
  'Cách làm: mở pin → chuột phải vào ảnh → “Copy image address” → dán lại vào đây. ' +
  'Hoặc tải ảnh về máy rồi dùng nút tải ảnh lên.';
export const PINTEREST_HINT_EN =
  'That is a Pinterest PAGE link, not an image URL. Pinterest does not let other apps read your ' +
  'pins without connecting your account, and auto-fetching images from their pages breaks their ' +
  'terms. Instead: open the pin → right-click the image → “Copy image address” → paste it here. ' +
  'Or save the image and use the upload button.';

/* ────────────────────────── chuẩn hoá kết quả từng API ────────────────────────── */

/** Tham số UTM Unsplash yêu cầu gắn vào mọi link ghi công. */
export const UNSPLASH_UTM = 'utm_source=InteriorFlow&utm_medium=referral';

function withUtm(url: string): string {
  if (!url) return '';
  return url.includes('?') ? `${url}&${UNSPLASH_UTM}` : `${url}?${UNSPLASH_UTM}`;
}

interface UnsplashRaw {
  id?: string;
  description?: string | null;
  alt_description?: string | null;
  width?: number;
  height?: number;
  urls?: { small?: string; regular?: string; full?: string; thumb?: string };
  links?: { html?: string; download_location?: string };
  user?: { name?: string; username?: string; links?: { html?: string } };
}

/** Unsplash `/search/photos` → StockPhoto[]. Bỏ bản ghi thiếu ảnh. */
export function normalizeUnsplash(results: unknown): StockPhoto[] {
  const arr = Array.isArray(results) ? (results as UnsplashRaw[]) : [];
  const out: StockPhoto[] = [];
  for (const r of arr) {
    const full = r.urls?.regular || r.urls?.full || r.urls?.small;
    if (!full || !r.id) continue;
    out.push({
      id: r.id,
      source: 'unsplash',
      thumb: r.urls?.small || r.urls?.thumb || full,
      full,
      width: r.width,
      height: r.height,
      title: (r.description || r.alt_description || '').trim(),
      creditName: (r.user?.name || r.user?.username || '').trim(),
      creditUrl: withUtm(r.user?.links?.html || ''),
      license: 'Unsplash License',
      licenseUrl: 'https://unsplash.com/license',
      landing: withUtm(r.links?.html || ''),
      downloadLocation: r.links?.download_location || '',
    });
  }
  return out;
}

interface OpenverseRaw {
  id?: string;
  url?: string;
  thumbnail?: string;
  title?: string;
  creator?: string;
  creator_url?: string;
  license?: string;
  license_url?: string;
  license_version?: string;
  foreign_landing_url?: string;
  width?: number;
  height?: number;
}

/** Openverse `/v1/images` → StockPhoto[]. */
export function normalizeOpenverse(results: unknown): StockPhoto[] {
  const arr = Array.isArray(results) ? (results as OpenverseRaw[]) : [];
  const out: StockPhoto[] = [];
  for (const r of arr) {
    if (!r.url) continue;
    const lic = (r.license || '').toUpperCase();
    out.push({
      id: r.id || r.url,
      source: 'openverse',
      thumb: r.thumbnail || r.url,
      full: r.url,
      width: r.width,
      height: r.height,
      title: (r.title || '').trim(),
      creditName: (r.creator || '').trim(),
      creditUrl: r.creator_url || '',
      license: r.license_version ? `${lic} ${r.license_version}` : lic || 'CC',
      licenseUrl: r.license_url || '',
      landing: r.foreign_landing_url || '',
      downloadLocation: '',
    });
  }
  return out;
}

/** Ảnh từ URL user dán — không có metadata, ghi công để user tự điền/chịu trách nhiệm. */
export function photoFromLink(url: string, title = ''): StockPhoto {
  let host = '';
  try {
    host = new URL(url).hostname;
  } catch {
    /* URL đã được validate trước đó */
  }
  return {
    id: url,
    source: 'link',
    thumb: url,
    full: url,
    title: title || host,
    creditName: host,
    creditUrl: '',
    license: 'Người dùng tự chịu trách nhiệm bản quyền',
    licenseUrl: '',
    landing: url,
    downloadLocation: '',
  };
}

/* ────────────────────────── ghi công (dùng cả UI lẫn export) ────────────────────────── */

/**
 * Một dòng ghi công gọn cho ảnh — bắt buộc hiện cạnh ảnh khi user chọn (Unsplash/CC đều
 * yêu cầu). Rỗng thì trả ''.
 */
export function creditLine(p: StockPhoto): string {
  const who = p.creditName || (p.source === 'link' ? '' : 'Không rõ tác giả');
  const bits = [who, p.license].filter(Boolean);
  if (!bits.length) return '';
  const via =
    p.source === 'unsplash' ? ' · Unsplash' : p.source === 'openverse' ? ' · Openverse' : '';
  return `${bits.join(' · ')}${via}`;
}

/** Danh sách nguồn KHẢ DỤNG: bỏ nguồn cần key mà server chưa có key. */
export function availableSources(hasUnsplashKey: boolean): StockSourceInfo[] {
  return STOCK_SOURCES.filter((s) => (s.id === 'unsplash' ? hasUnsplashKey : true));
}
