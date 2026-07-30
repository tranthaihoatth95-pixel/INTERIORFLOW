/**
 * lib/integrations/providers/lark.ts — Lark/Feishu Base (Bitable) THẬT — server-to-server,
 * KHÔNG OAuth per-user (docs/RESEARCH-HOME-GALLERY-DASHBOARD.md §2.5/§5.1 quyết định 1/2).
 *
 * Khác ms365.ts (OAuth, token per-user lưu IntegrationAccount): ở đây KHÔNG có "user kết nối
 * tài khoản riêng" nào — app đọc (các) base RIÊNG của Hoà bằng App ID/Secret cấp server, đổi
 * lấy `tenant_access_token` (credential CẤP APP, không gắn user nào). KHÔNG phải base dùng
 * chung cả công ty — sửa lại tiền đề sai 30/07, xem docs/INTEGRATIONS.md mục Lark. Vì vậy:
 *   - KHÔNG dùng IntegrationAccount cho token này — bảng đó khoá theo (userId, provider) và
 *     ngữ nghĩa "user đã consent kết nối", không khớp 1 credential app-wide không ai "kết nối".
 *   - Token cache TRONG BỘ NHỚ (module-scope), TTL ngắn (Lark cấp ~7200s) — refetch rẻ, không
 *     cần bền qua restart/cold-start. Đây KHÔNG phải "phát minh cơ chế lưu token mới": không
 *     có gì được LƯU (persist) cả, chỉ cache tạm để đỡ gọi lại trong cùng tiến trình.
 *   - Trạng thái "đã cấu hình chưa" dùng lại NGUYÊN cơ chế registry.ts/index.ts đã có
 *     (GET /api/integrations/lark/status) — không phát minh cơ chế status riêng.
 *
 * PULL-ONLY tuyệt đối: file này chỉ có list_records (GET) + resolveWikiAppToken (GET) — không
 * có create/update/delete. Không đoán field_id gọi Bitable field API — field thật đã verify
 * bằng MCP thật, xem báo cáo §1.5 (field_name làm khoá đọc, giống JSON mẫu report đã in ra).
 *
 * 7.1.19 (30/07) — 2 base khác nhau, đọc bằng 2 kiểu app_token khác nhau:
 *   - Base "Quản lý Công việc" ("Chi tiết công việc" + "Nhân sự") — base THƯỜNG, app_token lấy
 *     thẳng từ URL Base (xem docs/INTEGRATIONS.md bước 5) → `LARK_WORK_APP_TOKEN` (tên mới,
 *     fallback `LARK_BASE_APP_TOKEN` tên cũ — tương thích ngược).
 *   - Base "ATLAS Material Library" nằm TRONG Lark WIKI, không phải Drive base thường —
 *     `node_token` (deep link, `LARK_ATLAS_NODE_TOKEN`) ≠ `app_token` (gọi bitable API,
 *     `LARK_ATLAS_APP_TOKEN`). **node_token ≠ app_token. Lưu cả hai, KHÔNG suy ra từ nhau.**
 *     Phải giải qua `resolveWikiAppToken()` (GET /open-apis/wiki/v2/spaces/get_node) rồi cache,
 *     xem docs/REVIEW-SPEC-BOQ-LARK-2026-07-30.md §3.
 */

const DEFAULT_API_BASE = 'https://open.larksuite.com';

function apiBase(): string {
  return (process.env.LARK_API_BASE || DEFAULT_API_BASE).replace(/\/$/, '');
}

/** Base "Quản lý Công việc" — token app THƯỜNG (không qua Wiki). Ưu tiên tên mới
 * `LARK_WORK_APP_TOKEN`; fallback `LARK_BASE_APP_TOKEN` (tên cũ trước 7.1.19 — tương thích
 * ngược, KHÔNG bắt người dùng đổi env ngay). */
function workAppToken(): string | undefined {
  return process.env.LARK_WORK_APP_TOKEN || process.env.LARK_BASE_APP_TOKEN;
}

export function larkConfigured(): boolean {
  return !!(process.env.LARK_APP_ID && process.env.LARK_APP_SECRET && workAppToken());
}

/** Base "ATLAS Material Library" (Lark Wiki) — chỉ cần `LARK_ATLAS_NODE_TOKEN` HOẶC
 * `LARK_ATLAS_APP_TOKEN` (1 trong 2 là đủ để giải ra app_token, xem `getAtlasAppToken()`). */
export function atlasConfigured(): boolean {
  return !!(
    process.env.LARK_APP_ID &&
    process.env.LARK_APP_SECRET &&
    (process.env.LARK_ATLAS_APP_TOKEN || process.env.LARK_ATLAS_NODE_TOKEN)
  );
}

export interface LarkRecord {
  record_id: string;
  fields: Record<string, unknown>;
}

/* ---------- Rate limit / retry — mã lỗi Lark cần xử (docs/REVIEW-SPEC-BOQ-LARK-2026-07-30.md §3)
 * 1254290 TooManyRequest · 1254112 quá nhiều request cùng base · 1254291 write conflict —
 * cả 3 mã này "thử lại được" (retry backoff+jitter). 1254104 (vượt 500 bản ghi/lần ghi) KHÔNG
 * phải lỗi retry-được — đó là lỗi KÍCH THƯỚC request, phải CHIA NHỎ payload, xem
 * `LARK_WRITE_CHUNK_SIZE` dưới đây (dành cho hàm ghi tương lai; file này hiện PULL-ONLY nên
 * chưa có chỗ dùng, nhưng phải khai báo sẵn để hàm ghi sau này không tự chọn số sai). */

const LARK_RETRYABLE_CODES = new Set([1254290, 1254112, 1254291]);
export const LARK_WRITE_CHUNK_SIZE = 200; // KHÔNG dùng trần 500 của API (mã 1254104) — an toàn margin.
const LARK_MAX_RETRIES = 4;

function larkBackoffDelayMs(attempt: number): number {
  const base = Math.min(1000 * 2 ** attempt, 8000); // 1s → 2s → 4s → 8s (trần)
  const jitter = Math.random() * base * 0.5; // jitter 0-50% tránh thundering herd
  return base + jitter;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Gọi 1 Lark REST endpoint, tự retry backoff+jitter khi gặp mã rate-limit/conflict biết
 * trước (`LARK_RETRYABLE_CODES`). Dùng chung cho mọi call trong file (token/wiki/bitable) để
 * không viết lặp logic retry 3 chỗ. */
async function larkFetchJson(url: string | URL, init: RequestInit): Promise<Record<string, unknown>> {
  let lastMsg = '';
  let lastCode: number | undefined;
  for (let attempt = 0; attempt <= LARK_MAX_RETRIES; attempt++) {
    const res = await fetch(url, init);
    const j = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    const code = (j as { code?: number }).code;
    if (res.ok && code === 0) return j;
    lastCode = code;
    lastMsg = (j as { msg?: string }).msg ?? `HTTP ${res.status}`;
    if (typeof code === 'number' && LARK_RETRYABLE_CODES.has(code) && attempt < LARK_MAX_RETRIES) {
      await sleep(larkBackoffDelayMs(attempt));
      continue;
    }
    throw new Error(`Lark API lỗi (code=${code ?? res.status}): ${lastMsg}`);
  }
  throw new Error(`Lark API lỗi sau ${LARK_MAX_RETRIES} lần thử lại (code=${lastCode}): ${lastMsg}`);
}

/* ---------- tenant_access_token — cache TTL trong bộ nhớ (KHÔNG persist DB) ---------- */

let tokenCache: { token: string; expiresAt: number } | null = null;

async function getTenantAccessToken(): Promise<string> {
  if (tokenCache && tokenCache.expiresAt - 60_000 > Date.now()) return tokenCache.token;

  const appId = process.env.LARK_APP_ID;
  const appSecret = process.env.LARK_APP_SECRET;
  if (!appId || !appSecret) {
    throw new Error('LARK_APP_ID/LARK_APP_SECRET chưa cấu hình — xem docs/INTEGRATIONS.md mục Lark.');
  }

  const j = await larkFetchJson(`${apiBase()}/open-apis/auth/v3/tenant_access_token/internal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ app_id: appId, app_secret: appSecret }),
  });
  const token = (j as { tenant_access_token?: string }).tenant_access_token;
  if (!token) {
    throw new Error('Lark tenant_access_token lỗi: response thiếu tenant_access_token.');
  }
  const expireSec = (j as { expire?: number }).expire ?? 7200;
  tokenCache = { token, expiresAt: Date.now() + expireSec * 1000 };
  return token;
}

/* ---------- Wiki app_token resolution — ATLAS Material Library nằm trong Lark WIKI ----------
 * node_token ≠ app_token. Lưu cả hai, KHÔNG suy ra từ nhau.
 * `LARK_ATLAS_NODE_TOKEN` CHỈ dùng để MỞ DEEP LINK (mở đúng trang Wiki cho người xem trên
 * trình duyệt) — KHÔNG gọi API bitable bằng giá trị này. Muốn gọi bitable API (list_records,
 * list_fields...) PHẢI đổi node_token → app_token qua endpoint get_node dưới đây rồi dùng
 * app_token đó. 2 giá trị khác hình dạng, khác vai trò — đổi nhầm ra lỗi permission/404, tốn
 * nửa ngày để dò nếu không ghi rõ (xem docs/REVIEW-SPEC-BOQ-LARK-2026-07-30.md §3).
 */

const WIKI_APP_TOKEN_TTL_MS = 2 * 60 * 60 * 1000; // 2 giờ — get_node KHÔNG trả `expire`, dùng
// cùng quy ước TTL với tenant_access_token (~7200s) cho nhất quán (xem comment đầu file).

let wikiAppTokenCache: { nodeToken: string; appToken: string; expiresAt: number } | null = null;

/** Giải `node_token` (deep link Wiki) → `app_token` (dùng cho Bitable API), có cache TTL 2h. */
export async function resolveWikiAppToken(nodeToken: string): Promise<string> {
  if (!nodeToken) {
    throw new Error('resolveWikiAppToken: thiếu node_token (kiểm tra LARK_ATLAS_NODE_TOKEN).');
  }
  if (
    wikiAppTokenCache &&
    wikiAppTokenCache.nodeToken === nodeToken &&
    wikiAppTokenCache.expiresAt > Date.now()
  ) {
    return wikiAppTokenCache.appToken;
  }

  const token = await getTenantAccessToken();
  const url = new URL(`${apiBase()}/open-apis/wiki/v2/spaces/get_node`);
  url.searchParams.set('token', nodeToken);
  url.searchParams.set('obj_type', 'wiki');
  const j = await larkFetchJson(url, { headers: { Authorization: `Bearer ${token}` } });
  const node = (j as { data?: { node?: { obj_token?: string } } }).data?.node;
  const appToken = node?.obj_token;
  if (!appToken) {
    throw new Error(
      'resolveWikiAppToken: response get_node thiếu obj_token — kiểm tra node_token/quyền app trên Wiki.',
    );
  }
  wikiAppTokenCache = { nodeToken, appToken, expiresAt: Date.now() + WIKI_APP_TOKEN_TTL_MS };
  return appToken;
}

/** app_token cho base "ATLAS Material Library". Ưu tiên `LARK_ATLAS_APP_TOKEN` nếu đã điền
 * tay (đỡ resolve mỗi cold-start); nếu chưa có thì tự giải qua `LARK_ATLAS_NODE_TOKEN` bằng
 * `resolveWikiAppToken()` rồi cache. */
export async function getAtlasAppToken(): Promise<string> {
  const explicit = process.env.LARK_ATLAS_APP_TOKEN;
  if (explicit) return explicit;
  const nodeToken = process.env.LARK_ATLAS_NODE_TOKEN;
  if (!nodeToken) {
    throw new Error(
      'LARK_ATLAS_NODE_TOKEN (hoặc LARK_ATLAS_APP_TOKEN) chưa cấu hình — xem docs/INTEGRATIONS.md mục Lark.',
    );
  }
  return resolveWikiAppToken(nodeToken);
}

/* ---------- Bitable list_records — phân trang đầy đủ ---------- */

async function listAllRecords(appToken: string, tableId: string): Promise<LarkRecord[]> {
  const token = await getTenantAccessToken();
  const out: LarkRecord[] = [];
  let pageToken: string | undefined;
  // Giới hạn an toàn — 2 bảng hiện chỉ ~10-20 record (báo cáo §2.5); 50 trang × 100 record là
  // dư sức, tránh vòng lặp vô hạn nếu Lark trả has_more sai.
  for (let page = 0; page < 50; page++) {
    const url = new URL(`${apiBase()}/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/records`);
    url.searchParams.set('page_size', '100');
    if (pageToken) url.searchParams.set('page_token', pageToken);
    const j = await larkFetchJson(url, { headers: { Authorization: `Bearer ${token}` } });
    const data = (j as { data?: { items?: unknown[]; has_more?: boolean; page_token?: string } }).data;
    for (const it of data?.items ?? []) {
      const rec = it as { record_id?: string; fields?: Record<string, unknown> };
      if (rec.record_id) out.push({ record_id: rec.record_id, fields: rec.fields ?? {} });
    }
    if (data?.has_more && data.page_token) {
      pageToken = data.page_token;
    } else {
      break;
    }
  }
  return out;
}

export async function listTaskRecords(): Promise<LarkRecord[]> {
  const appToken = workAppToken();
  if (!appToken) {
    throw new Error('LARK_WORK_APP_TOKEN (hoặc LARK_BASE_APP_TOKEN cũ) chưa cấu hình — xem docs/INTEGRATIONS.md mục Lark.');
  }
  return listAllRecords(appToken, process.env.LARK_TASK_TABLE_ID || 'tblnjLehkr6DRMJN');
}

export async function listHrRecords(): Promise<LarkRecord[]> {
  const appToken = workAppToken();
  if (!appToken) {
    throw new Error('LARK_WORK_APP_TOKEN (hoặc LARK_BASE_APP_TOKEN cũ) chưa cấu hình — xem docs/INTEGRATIONS.md mục Lark.');
  }
  return listAllRecords(appToken, process.env.LARK_HR_TABLE_ID || 'tblUvVYG5j70FCTn');
}

/* ---------- Field-value normalizers ----------
 * Bitable trả field value ở NHIỀU shape khác nhau tuỳ loại field (Text đơn giản là string,
 * nhưng SingleSelect/User/Formula/DateTime có thể trả object/array tuỳ version API). Báo cáo
 * §1.5 verify field_name qua MCP cho thấy Text/SingleSelect đã về THẲNG string (JSON mẫu),
 * nhưng KHÔNG có bằng chứng thật cho User/Formula/DateTime (chưa có token thật để gọi REST
 * trực tiếp) — các hàm dưới đây CỐ GẮNG nhiều shape hợp lý, ưu tiên fallback an toàn (không
 * throw), và `raw` JSON trên LarkTaskRef/LarkPersonRef luôn giữ nguyên bản gốc để dò lại nếu
 * sync ra sai — xem docs/INTEGRATIONS.md mục Lark, mục "Chưa verify được (cần token thật)".
 */

export function textOf(v: unknown): string {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number') return String(v);
  if (Array.isArray(v)) {
    return v
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object') {
          const o = item as Record<string, unknown>;
          if (typeof o.text === 'string') return o.text;
          if (typeof o.name === 'string') return o.name;
        }
        return '';
      })
      .filter(Boolean)
      .join(', ');
  }
  if (typeof v === 'object') {
    const o = v as Record<string, unknown>;
    if (typeof o.text === 'string') return o.text;
    if (typeof o.name === 'string') return o.name;
  }
  return '';
}

export function numberOf(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') {
    const n = Number(v.replace(/[^\d.-]/g, ''));
    return Number.isFinite(n) ? n : null;
  }
  if (v && typeof v === 'object') {
    const o = v as Record<string, unknown>;
    if (typeof o.value === 'number') return o.value;
  }
  return null;
}

export function dateOf(v: unknown): Date | null {
  if (typeof v === 'number') {
    // Lark DateTime field trả epoch ms.
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (typeof v === 'string') {
    const n = Number(v);
    const d = Number.isFinite(n) && v.trim() !== '' ? new Date(n) : new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

export function boolOf(v: unknown): boolean {
  return v === true || v === 1 || v === '1' || v === 'true';
}

/** Field kiểu User (vd "Chủ trì") — best-effort lấy 1 định danh dạng "Tài khoản"-like. */
export function userAccountOf(v: unknown): string | null {
  const arr = Array.isArray(v) ? v : v != null ? [v] : [];
  for (const item of arr) {
    if (typeof item === 'string' && item.trim()) return item.trim();
    if (item && typeof item === 'object') {
      const o = item as Record<string, unknown>;
      const cand = o.en_name ?? o.name ?? o.id;
      if (typeof cand === 'string' && cand.trim()) return cand.trim();
    }
  }
  return null;
}
