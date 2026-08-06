/**
 * lib/ai/web-lookup.ts — TRA CỨU WEB CHO VITALS, theo **CÁCH C: DOMAIN TRẮNG** (TỔNG chọn 05/08).
 *
 * Vì sao không phải search mở: `docs/LICENSE-NOTES.md §4` đã bác hướng dựa vào dịch vụ cloud với
 * lý do *"rủi ro vi phạm NDA với khách hàng nặng hơn rủi ro vi phạm license"*. Câu hỏi "ghế này
 * rộng bao nhiêu" thì vô hại, nhưng nguyên tắc là một: **không đẩy nội dung dự án ra một dịch vụ
 * bên thứ ba không kiểm soát được**. Domain trắng đảo ngược mặc định — không có gì đi ra ngoài cho
 * tới khi studio tự khai đúng nơi họ tin.
 *
 * Danh sách domain do studio tự nuôi trong Cài đặt, **mặc định RỖNG** ⇒ tính năng tắt cho tới khi
 * có người bật. Rỗng KHÔNG phải lỗi, là trạng thái đúng của bản vừa cài.
 *
 * ═══ BỐN LUẬT CỨNG (không có tham số tắt) ═══
 * ① CHỈ ĐỌC, KHÔNG NHẬP KHO. Không tải .obj/.skp/.dwg/.3ds/... về máy — `isModelFileUrl()` chặn,
 *   và `fetchAllowed()` từ chối trước khi phát request. Ảnh chỉ giữ URL gốc để `<img src>` trỏ
 *   tới, KHÔNG tải về, KHÔNG chuyển dataURL, KHÔNG ghi đĩa. (Bài học NC-16: 7 nguồn block đều
 *   cấm redistribute — tải về là đã tạo bản sao, dù chưa phát tán.)
 * ② KẾT QUẢ LÀ TẠM. Mỗi kết quả mang `fetchedAt`, UI hiện "tra lúc HH:mm dd/mm"
 *   (`formatFetchedAt`). ⛔ KHÔNG có hàm nào trong file này đổ dữ liệu sang `ProductSpec` — kho
 *   vật liệu là kho của studio, chỉ nhận thứ studio duyệt. Muốn đưa vào kho thì người dùng tự
 *   nhập qua màn Kho vật liệu, đi qua đúng cửa duyệt đã có.
 * ③ MỌI CON SỐ KÈM LINK ĐỌC ĐƯỢC. `WebFact.sourceUrl` là bắt buộc trong kiểu — không có đường
 *   nào tạo được một con số không nguồn. Không tìm thấy ⇒ trả mảng rỗng và nói KHÔNG BIẾT, không
 *   đoán (cùng luật với `lib/cad/standards/registry.ts:13`: *"TUYỆT ĐỐI không bịa số rồi gắn mác
 *   quy chuẩn như thật"*).
 * ④ TUỲ CHỌN, KHÔNG NẰM TRÊN ĐƯỜNG CHÍNH. Bước ①②⑤⑥ (`single-view-metrology.ts`,
 *   `match-template.ts`, `ortho-projection.ts`) phải chạy offline, 0 credit, và KHÔNG được import
 *   file này. Có test cưỡng chế điều đó (`web-lookup.test.ts` phần [5]).
 *
 * Phần THUẦN (kiểm domain · chặn đuôi file · bóc số · định dạng giờ) là chỗ có test; phần đọc
 * env/localStorage và `fetch` chỉ là vỏ — cùng lối chia của `lib/colors/registry.ts`.
 */

/* ═══════════════════════════ Cấu hình domain trắng ═══════════════════════════ */

export interface AllowedDomain {
  /** Tên miền, không kèm giao thức, vd `example-furniture.com`. Khớp cả tên miền con. */
  domain: string;
  /** Nhãn hiển thị trong Cài đặt. */
  label?: string;
  /**
   * Mẫu URL tra cứu của chính site đó, `{q}` là chỗ thay từ khoá (đã encode).
   * Bắt buộc phải có thì mới tra được — IF KHÔNG đoán cấu trúc tìm kiếm của site người khác.
   */
  searchUrlTemplate?: string;
}

export interface WebLookupConfig {
  allowedDomains: AllowedDomain[];
}

/** Mặc định RỖNG — tính năng tắt cho tới khi studio tự khai. */
export const EMPTY_WEB_LOOKUP_CONFIG: WebLookupConfig = { allowedDomains: [] };

const KEY = 'interiorflow.webLookup';

function normDomain(s: string): string {
  return (s || '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/^\./, '');
}

/* ═══════════════════════════ Luật ① — chặn tệp mô hình ═══════════════════════════ */

/**
 * Đuôi tệp mô hình/bản vẽ bị chặn tuyệt đối. Danh sách theo hướng "chặn cái mình biết là mô hình",
 * KHÔNG theo hướng "cho phép cái mình biết là an toàn" — vì đây chỉ là lớp chặn thứ hai; lớp thứ
 * nhất là domain trắng. Thêm đuôi mới vào đây khi gặp, không cần đổi logic.
 */
export const BLOCKED_MODEL_EXTENSIONS = [
  '.obj', '.skp', '.skb', '.dwg', '.dxf', '.3ds', '.max', '.blend', '.fbx', '.stl',
  '.gltf', '.glb', '.3dm', '.rfa', '.rvt', '.ifc', '.step', '.stp', '.iges', '.igs', '.c4d', '.ma', '.mb',
] as const;

/** true nếu URL trỏ tới một tệp mô hình/bản vẽ ⇒ KHÔNG BAO GIỜ tải. */
export function isModelFileUrl(url: string): boolean {
  let path: string;
  try {
    path = new URL(url).pathname.toLowerCase();
  } catch {
    path = (url || '').toLowerCase().split('?')[0];
  }
  return BLOCKED_MODEL_EXTENSIONS.some((ext) => path.endsWith(ext));
}

/* ═══════════════════════════ Kiểm domain ═══════════════════════════ */

export interface UrlVerdict {
  allowed: boolean;
  /** Lý do từ chối, để UI nói được vì sao thay vì im lặng không làm gì. */
  reason?: string;
}

/**
 * Cửa duy nhất quyết định một URL có được gọi hay không. THUẦN.
 *
 * Bắt buộc **https**: whitelist mà đi qua http thì nội dung truy vấn vẫn hở trên đường truyền —
 * đúng cái rủi ro §4 LICENSE-NOTES muốn tránh. Khớp tên miền con (`a.b.com` thuộc `b.com`) nhưng
 * KHÔNG khớp hậu tố lừa (`evil-b.com` KHÔNG thuộc `b.com`) — kiểm bằng biên `.`.
 */
export function checkUrl(url: string, config: WebLookupConfig): UrlVerdict {
  if (!config.allowedDomains.length) {
    return { allowed: false, reason: 'Chưa có domain nào trong danh sách tin cậy — bật trong Cài đặt trước.' };
  }
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return { allowed: false, reason: 'Địa chỉ không hợp lệ.' };
  }
  if (u.protocol !== 'https:') {
    return { allowed: false, reason: 'Chỉ nhận https — http để lộ nội dung tra cứu trên đường truyền.' };
  }
  if (isModelFileUrl(url)) {
    return { allowed: false, reason: 'Đây là tệp mô hình/bản vẽ — IF chỉ đọc trang, không tải tệp về.' };
  }
  const host = u.hostname.toLowerCase();
  const ok = config.allowedDomains.some((d) => {
    const dom = normDomain(d.domain);
    return !!dom && (host === dom || host.endsWith(`.${dom}`));
  });
  return ok ? { allowed: true } : { allowed: false, reason: `Domain "${host}" không có trong danh sách tin cậy của studio.` };
}

/* ═══════════════════════════ Luật ② — dấu thời gian ═══════════════════════════ */

/** "tra lúc 14:05 05/08". `now` do caller truyền (hàm thuần, test tất định). */
export function formatFetchedAt(ts: number): string {
  const d = new Date(ts);
  const p2 = (n: number) => String(n).padStart(2, '0');
  return `tra lúc ${p2(d.getHours())}:${p2(d.getMinutes())} ${p2(d.getDate())}/${p2(d.getMonth() + 1)}`;
}

/* ═══════════════════════════ Luật ③ — con số phải có nguồn ═══════════════════════════ */

export interface WebFact {
  /** Nhãn, vd "Rộng". */
  label: string;
  valueMm: number;
  /** ⛔ BẮT BUỘC — không có đường tạo con số không nguồn (luật ③). */
  sourceUrl: string;
  /** Đoạn chữ gốc đã bóc ra số này, để người dùng tự kiểm chứ không phải tin suông. */
  quote: string;
}

export interface WebLookupResult {
  title: string;
  sourceUrl: string;
  /** URL ảnh GỐC trên site nguồn — chỉ để `<img src>` trỏ tới, KHÔNG tải về (luật ①). */
  imageUrl?: string;
  facts: WebFact[];
  fetchedAt: number;
}

/** Đơn vị → hệ số ra mm. Chỉ nhận thứ đọc chắc chắn được; không có `"` (inch) vì dấu nháy hay
 *  lẫn với dấu trích dẫn trong HTML, đọc nhầm còn tệ hơn không đọc. */
const UNIT_TO_MM: Record<string, number> = { mm: 1, cm: 10, m: 1000 };

/** Từ khoá 3 chiều, VI + EN. Thứ tự trong mảng không quan trọng — khớp cái nào lấy cái đó. */
const AXIS_WORDS: { axis: string; words: string[] }[] = [
  { axis: 'Rộng', words: ['rộng', 'chiều rộng', 'width', 'w'] },
  { axis: 'Sâu', words: ['sâu', 'chiều sâu', 'depth', 'd'] },
  { axis: 'Cao', words: ['cao', 'chiều cao', 'height', 'h'] },
];

function toMm(value: number, unit: string): number | null {
  const f = UNIT_TO_MM[unit.toLowerCase()];
  return f ? value * f : null;
}

/**
 * Bóc kích thước từ chữ của một trang. THUẦN — vào chữ, ra `WebFact[]` (luôn kèm `sourceUrl`).
 *
 * Bắt hai dạng phổ biến, cố ý KHÔNG cố bắt mọi dạng: bóc sai một con số rồi gắn link vào cho có
 * vẻ đáng tin còn hại hơn là không bóc được (luật ③). Không khớp ⇒ mảng rỗng ⇒ Vitals nói không
 * biết.
 *   (a) "1600 x 900 x 850 mm"  → Rộng/Sâu/Cao theo đúng thứ tự quy ước W×D×H
 *   (b) "Rộng: 1600mm", "Height 85 cm" → theo từ khoá trục
 */
export function extractDimensionFacts(text: string, sourceUrl: string): WebFact[] {
  const out: WebFact[] = [];
  const flat = (text || '').replace(/\s+/g, ' ');

  // (a) bộ ba W×D×H — dấu nhân có thể là x, X, ×, *
  // ⚠️ `\d{1,5}` chứ KHÔNG phải `\d{2,5}` (bug bắt được lúc viết test): đơn vị mét gần như luôn
  // một chữ số phần nguyên — "1.6 x 0.9 x 0.85 m" trượt sạch nếu đòi tối thiểu 2 chữ số.
  const triple = /(\d{1,5}(?:[.,]\d+)?)\s*[x×*]\s*(\d{1,5}(?:[.,]\d+)?)\s*[x×*]\s*(\d{1,5}(?:[.,]\d+)?)\s*(mm|cm|m)\b/i.exec(flat);
  if (triple) {
    const unit = triple[4];
    const labels = ['Rộng', 'Sâu', 'Cao'];
    for (let i = 0; i < 3; i++) {
      const mm = toMm(parseFloat(triple[i + 1].replace(',', '.')), unit);
      if (mm != null) out.push({ label: labels[i], valueMm: mm, sourceUrl, quote: triple[0].trim() });
    }
    return out;
  }

  // (b) từng trục theo từ khoá
  for (const { axis, words } of AXIS_WORDS) {
    for (const w of words) {
      const esc = w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(`\\b${esc}\\b\\s*[:=]?\\s*(\\d{1,5}(?:[.,]\\d+)?)\\s*(mm|cm|m)\\b`, 'i');
      const m = re.exec(flat);
      if (!m) continue;
      const mm = toMm(parseFloat(m[1].replace(',', '.')), m[2]);
      if (mm == null) continue;
      out.push({ label: axis, valueMm: mm, sourceUrl, quote: m[0].trim() });
      break; // mỗi trục lấy lần khớp đầu, không gom nhiều số mâu thuẫn
    }
  }
  return out;
}

/** Bóc `<title>` — đủ dùng để người đọc biết mình đang xem trang gì; không dựng parser HTML. */
export function extractTitle(html: string, fallback: string): string {
  const m = /<title[^>]*>([\s\S]{1,300}?)<\/title>/i.exec(html || '');
  return m ? m[1].replace(/\s+/g, ' ').trim() || fallback : fallback;
}

/** Bóc ảnh đại diện (og:image). Trả URL GỐC, KHÔNG tải về (luật ①); tệp mô hình bị loại thẳng. */
export function extractImageUrl(html: string): string | undefined {
  const m = /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i.exec(html || '');
  const url = m?.[1]?.trim();
  if (!url || isModelFileUrl(url)) return undefined;
  return url;
}

/** Gỡ thẻ để lấy chữ thô cho `extractDimensionFacts`. */
export function htmlToText(html: string): string {
  return (html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ');
}

/* ═══════════════════════════ Vỏ — đọc/ghi cấu hình ═══════════════════════════ */

export function mergeWebLookupConfig(a: WebLookupConfig, b: WebLookupConfig): WebLookupConfig {
  const seen = new Set<string>();
  const merged: AllowedDomain[] = [];
  for (const d of [...a.allowedDomains, ...b.allowedDomains]) {
    const key = normDomain(d.domain);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    merged.push({ ...d, domain: key });
  }
  return { allowedDomains: merged };
}

/** Domain mức phát hành (env, phẩy ngăn) — cho bản đóng gói của studio lớn. Thuần, test được. */
export function envWebLookupConfig(env: Record<string, string | undefined>): WebLookupConfig {
  const list = (env.NEXT_PUBLIC_IF_WEB_LOOKUP_DOMAINS || '')
    .split(',')
    .map((s) => normDomain(s))
    .filter(Boolean)
    .map((domain) => ({ domain }));
  return { allowedDomains: list };
}

export function readLocalWebLookupConfig(): WebLookupConfig {
  if (typeof window === 'undefined') return EMPTY_WEB_LOOKUP_CONFIG;
  try {
    const j = JSON.parse(localStorage.getItem(KEY) || 'null') as Partial<WebLookupConfig> | null;
    if (!j || !Array.isArray(j.allowedDomains)) return EMPTY_WEB_LOOKUP_CONFIG;
    return {
      allowedDomains: j.allowedDomains
        .filter((d): d is AllowedDomain => !!d && typeof d.domain === 'string')
        .map((d) => ({ ...d, domain: normDomain(d.domain) }))
        .filter((d) => !!d.domain),
    };
  } catch {
    return EMPTY_WEB_LOOKUP_CONFIG;
  }
}

export function writeLocalWebLookupConfig(config: WebLookupConfig): boolean {
  if (typeof window === 'undefined') return false;
  try {
    localStorage.setItem(KEY, JSON.stringify(config));
    return true;
  } catch {
    return false;
  }
}

/** Cấu hình có hiệu lực = env (phát hành) ∪ máy — cùng cách gộp-thêm của `lib/colors/registry.ts`. */
export function effectiveWebLookupConfig(): WebLookupConfig {
  return mergeWebLookupConfig(
    envWebLookupConfig({ NEXT_PUBLIC_IF_WEB_LOOKUP_DOMAINS: process.env.NEXT_PUBLIC_IF_WEB_LOOKUP_DOMAINS }),
    readLocalWebLookupConfig(),
  );
}

/* ═══════════════════════════ Vỏ — tra cứu thật ═══════════════════════════ */

export type FetchLike = (url: string) => Promise<{ ok: boolean; status: number; text: () => Promise<string> }>;

export interface LookupOptions {
  config: WebLookupConfig;
  /** Mốc thời gian gắn vào kết quả — caller truyền để test tất định. */
  now: number;
  /** Tiêm được để test offline; mặc định `fetch` của môi trường. */
  fetchImpl?: FetchLike;
  /** Trần số domain thử trong một lần tra — tránh quét cả danh sách dài. */
  maxDomains?: number;
}

/** Tra 1 URL cụ thể (đã qua cửa `checkUrl`). Trả `null` khi không lấy được gì đáng tin. */
export async function lookupUrl(url: string, opts: LookupOptions): Promise<WebLookupResult | null> {
  const verdict = checkUrl(url, opts.config);
  if (!verdict.allowed) return null;
  const doFetch = opts.fetchImpl ?? ((u: string) => fetch(u));
  let html: string;
  try {
    const res = await doFetch(url);
    if (!res.ok) return null;
    html = await res.text();
  } catch {
    return null; // mạng hỏng/chặn — im lặng trả không biết, KHÔNG bịa
  }
  const facts = extractDimensionFacts(htmlToText(html), url);
  return {
    title: extractTitle(html, url),
    sourceUrl: url,
    imageUrl: extractImageUrl(html),
    facts,
    fetchedAt: opts.now,
  };
}

/**
 * Tra theo từ khoá trên các domain studio đã khai. Chỉ đi tới những domain có
 * `searchUrlTemplate` — IF không đoán cấu trúc tìm kiếm của site người khác.
 *
 * Trả mảng (có thể RỖNG). Rỗng nghĩa là **không biết**, và caller phải nói đúng như vậy.
 */
export async function lookupFurniture(query: string, opts: LookupOptions): Promise<WebLookupResult[]> {
  const q = (query || '').trim();
  if (!q) return [];
  const targets = opts.config.allowedDomains.filter((d) => !!d.searchUrlTemplate).slice(0, opts.maxDomains ?? 3);
  const out: WebLookupResult[] = [];
  for (const d of targets) {
    const url = d.searchUrlTemplate!.replace('{q}', encodeURIComponent(q));
    const r = await lookupUrl(url, opts);
    if (r) out.push(r);
  }
  return out;
}

/**
 * Câu Vitals phải nói khi không tra được gì — một chỗ duy nhất, để không ai chế ra câu "có vẻ
 * khoảng 1600mm" ở chỗ khác (luật ③).
 */
export const NO_SOURCE_ANSWER =
  'Tôi không tra được số này từ nguồn nào studio đã tin cậy — nên tôi không đoán. Bạn có thể thêm nguồn trong Cài đặt, hoặc nhập số bạn biết.';
