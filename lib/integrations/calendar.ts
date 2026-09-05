/**
 * lib/integrations/calendar.ts — CỬA ĐỌC LỊCH/HỌP cho bối cảnh dự án qua registry (thay thế được:
 * ms365 hôm nay, google ngày mai cùng hình dạng `MeetingContext`). Server-only (kéo oauth-core).
 *
 * Thứ tự kiểm — mỗi bậc là một trạng thái nói được "làm gì tiếp" (`ket-qua.ts`):
 *   provider không có năng lực `lich` → 404 ở route · chưa cấu hình env → chua-cau-hinh ·
 *   chưa nối → chua-ket-noi (+ketNoiUrl) · thiếu scope → thieu-scope (+scope thiếu, +ketNoiUrl) ·
 *   gọi lỗi mạng → ngoai-tuyen (+cache nếu có) · lỗi khác → loi (thông điệp đã lọc token).
 *
 * Cache: TRONG BỘ NHỚ theo (user, provider) — chỉ để trả bản cũ có nhãn `cu:true` khi ngoại tuyến,
 * không phải kho. TTL tuỳ `CACHE_QUA_HAN_MS`; không persist (không bịa DB).
 */
import { getProvider, type IntegrationProvider } from './registry';
import { getGrantedScope } from './oauth-core';
import { SCOPE_NANG_LUC, coNangLuc } from './capabilities';
import { scopeThieu } from './scopes';
import { ketQuaLoi, ketQuaOk, phanLoaiLoi, type KetQuaTichHop } from './ket-qua';
import type { MeetingContext } from './providers/ms365-normalize';

export type { MeetingContext };

const cache = new Map<string, { data: MeetingContext[]; tai: string }>();

export interface LichOpts {
  tu?: string;
  den?: string;
  max?: number;
}

export function ketNoiUrl(provider: string): string {
  return `/api/integrations/${provider}/connect`;
}

async function goiProvider(userId: string, p: IntegrationProvider, opts: LichOpts): Promise<MeetingContext[]> {
  switch (p) {
    case 'ms365': {
      const { listMeetings } = await import('./providers/ms365');
      return listMeetings(userId, opts);
    }
    case 'google': {
      // Google có `listCalendarEvents` (title/start) — chưa chuẩn hoá đủ MeetingContext (thiếu join/end).
      // Không giả vờ: khai rõ để ai cắm sau biết thiếu gì.
      throw new Error('Google Calendar chưa chuẩn hoá MeetingContext (thiếu end/joinUrl) — cắm sau.');
    }
    default:
      throw new Error(`${p} không có năng lực lịch.`);
  }
}

export async function docLichHop(userId: string, providerId: string, opts: LichOpts = {}): Promise<KetQuaTichHop<MeetingContext[]> | null> {
  const cfg = getProvider(providerId);
  if (!cfg || !coNangLuc(cfg.id, 'lich')) return null;
  const p = cfg.id;
  if (!cfg.configured()) return ketQuaLoi(p, 'chua-cau-hinh', { thongDiep: `${cfg.label} chưa cấu hình khoá trên máy chủ.` });
  const scope = await getGrantedScope(userId, p).catch(() => null);
  if (scope === null) return ketQuaLoi(p, 'chua-ket-noi', { ketNoiUrl: ketNoiUrl(p) });
  const thieu = scopeThieu(scope, SCOPE_NANG_LUC[p]?.lich ?? []);
  if (thieu.length) return ketQuaLoi(p, 'thieu-scope', { thieuScope: thieu, ketNoiUrl: ketNoiUrl(p), thongDiep: 'Token hiện tại thiếu quyền đọc lịch — kết nối lại để cấp quyền.' });
  const key = `${userId}:${p}`;
  try {
    const data = await goiProvider(userId, p, opts);
    const kq = ketQuaOk(p, data);
    cache.set(key, { data, tai: kq.tai! });
    return kq;
  } catch (e) {
    return phanLoaiLoi(p, e, cache.get(key));
  }
}

/** Test-only. */
export function __resetCalendarCacheForTest() {
  cache.clear();
}
