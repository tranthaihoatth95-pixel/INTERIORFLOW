/**
 * lib/integrations/providers/lark.ts — Lark/Feishu Base (Bitable) THẬT — server-to-server,
 * KHÔNG OAuth per-user (docs/RESEARCH-HOME-GALLERY-DASHBOARD.md §2.5/§5.1 quyết định 1/2).
 *
 * Khác ms365.ts (OAuth, token per-user lưu IntegrationAccount): ở đây KHÔNG có "user kết nối
 * tài khoản riêng" nào — app đọc 1 Base DÙNG CHUNG CẢ CÔNG TY bằng App ID/Secret cấp server,
 * đổi lấy `tenant_access_token` (credential CẤP APP, không gắn user nào). Vì vậy:
 *   - KHÔNG dùng IntegrationAccount cho token này — bảng đó khoá theo (userId, provider) và
 *     ngữ nghĩa "user đã consent kết nối", không khớp 1 credential app-wide không ai "kết nối".
 *   - Token cache TRONG BỘ NHỚ (module-scope), TTL ngắn (Lark cấp ~7200s) — refetch rẻ, không
 *     cần bền qua restart/cold-start. Đây KHÔNG phải "phát minh cơ chế lưu token mới": không
 *     có gì được LƯU (persist) cả, chỉ cache tạm để đỡ gọi lại trong cùng tiến trình.
 *   - Trạng thái "đã cấu hình chưa" dùng lại NGUYÊN cơ chế registry.ts/index.ts đã có
 *     (GET /api/integrations/lark/status) — không phát minh cơ chế status riêng.
 *
 * PULL-ONLY tuyệt đối: file này chỉ có list_records (GET) — không có create/update/delete.
 * Không đoán field_id gọi Bitable field API — field thật đã verify bằng MCP thật, xem báo cáo
 * §1.5 (field_name làm khoá đọc, giống JSON mẫu report đã in ra).
 */

const DEFAULT_API_BASE = 'https://open.larksuite.com';

function apiBase(): string {
  return (process.env.LARK_API_BASE || DEFAULT_API_BASE).replace(/\/$/, '');
}

export function larkConfigured(): boolean {
  return !!(process.env.LARK_APP_ID && process.env.LARK_APP_SECRET && process.env.LARK_BASE_APP_TOKEN);
}

export interface LarkRecord {
  record_id: string;
  fields: Record<string, unknown>;
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

  const res = await fetch(`${apiBase()}/open-apis/auth/v3/tenant_access_token/internal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ app_id: appId, app_secret: appSecret }),
  });
  const j = await res.json().catch(() => ({}) as Record<string, unknown>);
  const code = (j as { code?: number }).code;
  const token = (j as { tenant_access_token?: string }).tenant_access_token;
  if (!res.ok || code !== 0 || !token) {
    const msg = (j as { msg?: string }).msg ?? `HTTP ${res.status}`;
    throw new Error(`Lark tenant_access_token lỗi: ${msg}`);
  }
  const expireSec = (j as { expire?: number }).expire ?? 7200;
  tokenCache = { token, expiresAt: Date.now() + expireSec * 1000 };
  return token;
}

/* ---------- Bitable list_records — phân trang đầy đủ ---------- */

async function listAllRecords(tableId: string): Promise<LarkRecord[]> {
  const appToken = process.env.LARK_BASE_APP_TOKEN;
  if (!appToken) {
    throw new Error('LARK_BASE_APP_TOKEN chưa cấu hình — xem docs/INTEGRATIONS.md mục Lark.');
  }
  const token = await getTenantAccessToken();
  const out: LarkRecord[] = [];
  let pageToken: string | undefined;
  // Giới hạn an toàn — 2 bảng hiện chỉ ~10-20 record (báo cáo §2.5); 50 trang × 100 record là
  // dư sức, tránh vòng lặp vô hạn nếu Lark trả has_more sai.
  for (let page = 0; page < 50; page++) {
    const url = new URL(`${apiBase()}/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/records`);
    url.searchParams.set('page_size', '100');
    if (pageToken) url.searchParams.set('page_token', pageToken);
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const j = await res.json().catch(() => ({}) as Record<string, unknown>);
    const code = (j as { code?: number }).code;
    if (!res.ok || code !== 0) {
      const msg = (j as { msg?: string }).msg ?? `HTTP ${res.status}`;
      throw new Error(`Lark list_records(${tableId}) lỗi: ${msg}`);
    }
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
  return listAllRecords(process.env.LARK_TASK_TABLE_ID || 'tblnjLehkr6DRMJN');
}

export async function listHrRecords(): Promise<LarkRecord[]> {
  return listAllRecords(process.env.LARK_HR_TABLE_ID || 'tblUvVYG5j70FCTn');
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
