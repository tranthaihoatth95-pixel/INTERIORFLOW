/**
 * lib/site/derive.ts — GHÉP la bàn: ghim + bằng chứng + gói vùng → `SiteDerived` (mặt trời · dải khí
 * hậu · gió · câu chuyện · gợi ý biến số · danh sách KHUYẾT) + phát hiện CŨ.
 *
 * Không ghim ⇒ không suy (trả khuyết `ghim`). Đây là chỗ duy nhất quyết định "cái gì là khuyết":
 * UI và cầu khảo sát (`survey-bridge.ts`) đều đọc từ đây, không tự đoán lại.
 */
import { goiYBienSo, suyCauChuyen, suyDaiKhiHau, suyGio, fact } from './climate';
import { ngayTuDate, tomTatMatTroi } from './solar';
import type { KhuyetSite, SiteContext, SiteDerived, SitePack, SitePin, SiteStale } from './types';

export function pinKey(pin: SitePin | null): string {
  return pin ? `${pin.lat.toFixed(5)},${pin.lng.toFixed(5)},${pin.muiGioPhut ?? 'auto'}` : '';
}

/** Kiểm ghim hợp lệ về hình học — không kiểm "có thật trên bản đồ" (không có adapter geocode). */
export function ghimHopLe(pin: Partial<SitePin> | null | undefined): pin is SitePin {
  return !!pin && Number.isFinite(pin.lat) && Number.isFinite(pin.lng) && Math.abs(pin.lat!) <= 90 && Math.abs(pin.lng!) <= 180;
}

export interface DeriveOpts {
  packs?: SitePack[];
  now?: Date;
}

export function suyDienSite(ctx: SiteContext, opts: DeriveOpts = {}): SiteDerived {
  const now = opts.now ?? new Date();
  const tai = now.toISOString();
  const packs = opts.packs ?? [];
  const khuyet: KhuyetSite[] = [];
  const rong: SiteDerived = {
    matTroi: null,
    daiKhiHau: null,
    gio: null,
    cauChuyen: [],
    goiY: [],
    khuyet: ['ghim'],
    tinhTu: { pinKey: '', soBangChung: ctx.khaoSat.length, tai },
  };
  if (!ghimHopLe(ctx.pin)) return rong;
  const pin = ctx.pin;

  const tz = pin.muiGioPhut;
  const solar = tomTatMatTroi(pin.lat, pin.lng, ngayTuDate(now, tz ?? Math.round(pin.lng / 15) * 60), tz);
  if (solar.muiGioUocTinh) khuyet.push('mui-gio');
  const matTroi = fact(solar, { loai: 'thien-van', ref: 'noaa-solar-position', ghiChu: solar.muiGioUocTinh ? 'múi giờ ước từ kinh độ' : undefined }, 'inferred', tai, solar.muiGioUocTinh ? 0.8 : undefined);

  const daiKhiHau = suyDaiKhiHau(pin, packs, tai);
  if (daiKhiHau.nguon.loai === 'suy-vi-do') khuyet.push('khi-hau');

  const gio = suyGio(pin, ctx.khaoSat, packs, tai);
  if (!gio) khuyet.push('gio');

  const cauChuyen = suyCauChuyen(pin, ctx.khaoSat, packs, tai);
  if (!cauChuyen.some((c) => c.chuDe === 'vat-lieu')) khuyet.push('vat-lieu-tai-cho');
  if (!cauChuyen.some((c) => c.chuDe === 'tap-quan')) khuyet.push('tap-quan');

  const goiY = goiYBienSo(pin, ctx.khaoSat, packs, ctx.bienSo, tai);

  return { matTroi, daiKhiHau, gio, cauChuyen, goiY, khuyet, tinhTu: { pinKey: pinKey(pin), soBangChung: ctx.khaoSat.length, tai } };
}

/** Quá 7 ngày thì mặt trời/ngày đã trôi đủ để cần tính lại (độ dài ngày đổi ~vài phút/tuần). */
export const HAN_SUY_DIEN_MS = 7 * 86_400_000;

export function kiemCu(ctx: SiteContext, opts: { now?: Date; ngoaiTuyen?: boolean } = {}): SiteStale {
  const now = opts.now ?? new Date();
  const lyDo: SiteStale['lyDo'] = [];
  if (!ctx.suyDien) lyDo.push('chua-suy');
  else {
    if (ctx.suyDien.tinhTu.pinKey !== pinKey(ctx.pin)) lyDo.push('ghim-doi');
    if (ctx.suyDien.tinhTu.soBangChung !== ctx.khaoSat.length) lyDo.push('bang-chung-moi');
    if (now.getTime() - Date.parse(ctx.suyDien.tinhTu.tai) > HAN_SUY_DIEN_MS) lyDo.push('qua-han');
  }
  if (opts.ngoaiTuyen) lyDo.push('ngoai-tuyen');
  return { cu: lyDo.length > 0, lyDo };
}

/** Người bấm NHẬN một gợi ý ⇒ chuyển vào `bienSo` với `verified` + nguồn `nguoi-xac-nhan` giữ dấu vết gợi ý gốc. */
export function nhanGoiY(ctx: SiteContext, ma: SiteDerived['goiY'][number]['ma'], now = new Date()): SiteContext {
  const goc = ctx.suyDien?.goiY.find((g) => g.ma === ma);
  if (!goc || ctx.bienSo.some((b) => b.ma === ma)) return ctx;
  const tai = now.toISOString();
  return {
    ...ctx,
    bienSo: [...ctx.bienSo, { ...goc, trangThai: 'verified', nguon: { loai: 'nguoi-xac-nhan', ref: `goi-y:${goc.nguon.loai}:${goc.nguon.ref}` }, tai }],
    capNhat: tai,
  };
}
