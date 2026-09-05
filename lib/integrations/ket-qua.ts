/**
 * lib/integrations/ket-qua.ts — MỘT hình dạng kết quả cho mọi cửa đọc tích hợp (lịch · thư giãn),
 * để UI không phải học 5 kiểu lỗi. Trạng thái là union ĐÓNG, mỗi nhánh nói được "làm gì tiếp":
 *   ok            — dữ liệu tươi (hoặc `cu: true` nếu lấy từ cache khi ngoại tuyến)
 *   chua-cau-hinh — máy chủ chưa có khoá (env) → dev cấu hình, người dùng không làm gì được
 *   chua-ket-noi  — người dùng chưa consent → bấm `ketNoiUrl`
 *   thieu-scope   — đã nối nhưng thiếu quyền → bấm `ketNoiUrl` (consent lại với scope đủ)
 *   ngoai-tuyen   — không gọi được provider (mạng/5xx) — kèm bản cache nếu có
 *   loi           — lỗi khác, thông điệp KHÔNG bao giờ chứa token
 * THUẦN: không import gì.
 */
export type TrangThaiKetQua = 'ok' | 'chua-cau-hinh' | 'chua-ket-noi' | 'thieu-scope' | 'ngoai-tuyen' | 'loi';

export interface KetQuaTichHop<T> {
  provider: string;
  trangThai: TrangThaiKetQua;
  data: T | null;
  /** ISO lúc dữ liệu được lấy (không phải lúc trả về) — để UI hiện "cập nhật X phút trước". */
  tai: string | null;
  /** true khi `data` là bản cũ (cache) vì lượt gọi mới thất bại. */
  cu: boolean;
  thieuScope?: string[];
  ketNoiUrl?: string;
  thongDiep?: string;
}

export function ketQuaOk<T>(provider: string, data: T, tai = new Date().toISOString()): KetQuaTichHop<T> {
  return { provider, trangThai: 'ok', data, tai, cu: false };
}

export function ketQuaLoi<T>(provider: string, trangThai: Exclude<TrangThaiKetQua, 'ok'>, extra: Partial<KetQuaTichHop<T>> = {}): KetQuaTichHop<T> {
  return { provider, trangThai, data: null, tai: null, cu: false, ...extra };
}

/** Bọc lỗi runtime: phân loại mạng → `ngoai-tuyen`; còn lại `loi`. Cắt thông điệp, KHÔNG in token. */
export function phanLoaiLoi<T>(provider: string, e: unknown, cache?: { data: T; tai: string }): KetQuaTichHop<T> {
  const msg = e instanceof Error ? e.message : String(e);
  const mang = /fetch failed|ENOTFOUND|ECONNRESET|ECONNREFUSED|ETIMEDOUT|network|\b5\d\d\b/i.test(msg);
  const base = ketQuaLoi<T>(provider, mang ? 'ngoai-tuyen' : 'loi', { thongDiep: anToanThongDiep(msg) });
  if (cache) return { ...base, data: cache.data, tai: cache.tai, cu: true };
  return base;
}

/** Xoá mọi thứ trông như token/bearer khỏi thông điệp lỗi trước khi rời máy chủ. */
export function anToanThongDiep(msg: string): string {
  return msg
    .replace(/bearer\s+[a-z0-9._~+/=-]+/gi, 'bearer ***')
    .replace(/[A-Za-z0-9_-]{40,}/g, '***')
    .slice(0, 160);
}

/** Ngưỡng coi bản cache là "quá cũ" để cảnh báo (không chặn hiện). */
export const CACHE_QUA_HAN_MS = 30 * 60_000;

export function cacheQuaHan(tai: string | null, now = Date.now()): boolean {
  if (!tai) return true;
  return now - Date.parse(tai) > CACHE_QUA_HAN_MS;
}
