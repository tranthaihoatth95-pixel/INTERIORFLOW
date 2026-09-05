/**
 * lib/integrations/capabilities.ts — NĂNG LỰC + NHÓM của từng provider, đọc từ MỘT bảng (registry là
 * "có gì", bảng này là "dùng vào việc gì"). Không phải registry thứ hai: khoá là `IntegrationProvider`,
 * `Record` ép đủ mọi provider — thêm provider mà quên khai nhóm là tsc đỏ.
 *
 * HAI NHÓM, KHÔNG TRỘN (yêu cầu slice 7):
 *   boi-canh-du-an — lịch/họp/đặt phòng: nuôi bối cảnh dự án (mốc, họp với CĐT).
 *   thu-gian        — nhạc/video nền lúc làm việc: KHÔNG BAO GIỜ là đầu vào của sự thật dự án,
 *                     không bắt buộc cho thiết kế, tắt là app vẫn đủ.
 *   he-thong        — nguồn dữ liệu công ty (Lark) / adapter nội bộ — ngoài phạm vi slice này.
 * THUẦN.
 */
import type { IntegrationProvider } from './registry';

export type NhomTichHop = 'boi-canh-du-an' | 'thu-gian' | 'he-thong';
export type NangLuc = 'lich' | 'hop' | 'dat-phong' | 'mail' | 'phat-nhac' | 'tim-video';

export const NHOM_PROVIDER: Record<IntegrationProvider, NhomTichHop> = {
  google: 'boi-canh-du-an',
  ms365: 'boi-canh-du-an',
  zoom: 'boi-canh-du-an',
  team: 'he-thong',
  zalo: 'he-thong',
  spotify: 'thu-gian',
  youtube: 'thu-gian',
  applemusic: 'thu-gian',
  lark: 'he-thong',
};

/** Năng lực ĐANG CÓ MÃ (không phải "sẽ có"). `dat-phong` cố ý KHÔNG khai cho ms365: MS Bookings cần
 * scope `Bookings.Read.All` + endpoint `/solutions/bookingBusinesses` — chưa có mã, xem `calendar.ts`. */
export const NANG_LUC_PROVIDER: Record<IntegrationProvider, NangLuc[]> = {
  google: ['lich', 'mail'],
  ms365: ['lich', 'hop', 'mail'],
  zoom: [],
  team: [],
  zalo: [],
  spotify: ['phat-nhac'],
  youtube: ['tim-video'],
  applemusic: [],
  lark: [],
};

/** Scope tối thiểu cho từng năng lực (đọc-only) — cửa `thieu-scope` đối chiếu với scope đã cấp. */
export const SCOPE_NANG_LUC: Partial<Record<IntegrationProvider, Partial<Record<NangLuc, string[]>>>> = {
  ms365: { lich: ['Calendars.Read'], hop: ['Calendars.Read'], mail: ['Mail.Read'] },
  google: { lich: ['https://www.googleapis.com/auth/calendar.readonly'] },
  spotify: { 'phat-nhac': ['user-read-currently-playing'] },
};

export function coNangLuc(p: IntegrationProvider, n: NangLuc): boolean {
  return NANG_LUC_PROVIDER[p].includes(n);
}

export function providersTheoNangLuc(n: NangLuc): IntegrationProvider[] {
  return (Object.keys(NANG_LUC_PROVIDER) as IntegrationProvider[]).filter((p) => coNangLuc(p, n));
}

export function providersTheoNhom(nhom: NhomTichHop): IntegrationProvider[] {
  return (Object.keys(NHOM_PROVIDER) as IntegrationProvider[]).filter((p) => NHOM_PROVIDER[p] === nhom);
}

export const NHAN_NHOM: Record<NhomTichHop, { vi: string; en: string }> = {
  'boi-canh-du-an': { vi: 'Bối cảnh dự án', en: 'Project context' },
  'thu-gian': { vi: 'Thư giãn (tuỳ chọn)', en: 'Relaxation (optional)' },
  'he-thong': { vi: 'Hệ thống', en: 'System' },
};
