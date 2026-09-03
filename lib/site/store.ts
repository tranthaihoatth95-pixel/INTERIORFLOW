/**
 * lib/site/store.ts — LOCAL-FIRST cho la bàn: mỗi dự án một bản `SiteContext` trong IndexedDB, dùng
 * NGUYÊN primitive `createStudioBlobStore` (W0.3) — không bịa DB mới. Khoá `site/<projectId>`.
 *
 * Nói thẳng ranh giới: Blueprint xếp dữ liệu địa điểm vào DOMAIN STATE (chung, ai mở cũng thấy) —
 * nhưng schema chưa có trường vị trí (cửa Hoà). Cho tới khi có, bản này chỉ nằm trên MÁY NÀY, cờ
 * `dongBo: 'local-only'` hiện ra UI, không giả vờ đã đồng bộ. Khi schema mở: thêm một `io` ghi qua
 * API, hình dạng `SiteContext` giữ nguyên.
 */
import { createStudioBlobStore, type StudioBlobIo, type StudioBlobStore } from '../storage/studio-persist';
import type { SiteContext } from './types';

export function siteRong(projectId: string, now = new Date()): SiteContext {
  return { v: 1, projectId, pin: null, khaoSat: [], bienSo: [], suyDien: null, dongBo: 'local-only', capNhat: now.toISOString() };
}

/** Kiểm payload đọc từ IDB — dữ liệu ngoài không tin mù. Sai hình dạng ⇒ undefined (coi như chưa có). */
export function parseSiteContext(v: unknown, projectId: string): SiteContext | undefined {
  if (!v || typeof v !== 'object') return undefined;
  const o = v as Partial<SiteContext>;
  if (o.v !== 1 || o.projectId !== projectId) return undefined;
  if (!Array.isArray(o.khaoSat) || !Array.isArray(o.bienSo)) return undefined;
  const pin = o.pin && typeof o.pin === 'object' && Number.isFinite((o.pin as { lat?: unknown }).lat) && Number.isFinite((o.pin as { lng?: unknown }).lng) ? o.pin : null;
  return {
    v: 1,
    projectId,
    pin,
    khaoSat: o.khaoSat.filter((e) => e && typeof e === 'object' && typeof (e as { id?: unknown }).id === 'string'),
    bienSo: o.bienSo.filter((b) => b && typeof b === 'object' && typeof (b as { ma?: unknown }).ma === 'string'),
    suyDien: o.suyDien && typeof o.suyDien === 'object' ? o.suyDien : null,
    dongBo: 'local-only',
    capNhat: typeof o.capNhat === 'string' ? o.capNhat : new Date(0).toISOString(),
  };
}

const stores = new Map<string, StudioBlobStore<SiteContext>>();

export function siteStore(projectId: string, io?: StudioBlobIo): StudioBlobStore<SiteContext> {
  const key = io ? `${projectId}#test` : projectId;
  let s = stores.get(key);
  if (!s) {
    s = createStudioBlobStore<SiteContext>({
      route: `site/${projectId}`,
      readLegacy: () => undefined, // chưa từng có bản localStorage — không có gì để bridge
      empty: siteRong(projectId),
      parse: (v) => parseSiteContext(v, projectId),
      io,
    });
    stores.set(key, s);
  }
  return s;
}
