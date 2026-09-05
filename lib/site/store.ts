/**
 * lib/site/store.ts — HAI KHO ĐỊA ĐIỂM, CỐ Ý ĐỨNG CHUNG MỘT TỆP.
 *
 * Hoà nhánh 05/09: hai nhánh cùng dựng "chỗ lưu địa điểm" nhưng cho HAI hình dạng dữ liệu khác
 * nhau và HAI phía khác nhau. Không cái nào thay được cái nào — mỗi bên đang có người gọi thật:
 *   · `HoSoDiaDiem` (Project Site Intelligence) — JSON theo dự án dưới `uploads/site/`, **SERVER**;
 *     người gọi: `app/api/projects/[id]/site/route.ts`, `.../tinh-lai/route.ts`.
 *   · `SiteContext` (La bàn dự án) — local-first trong IndexedDB qua `createStudioBlobStore`;
 *     người gọi: `components/site/useSiteContext.ts` ('use client'), `SiteCompassPanel.tsx`.
 * Gộp lại là mất một nửa tính năng, nên giữ cả hai. Khi schema Prisma mở trường vị trí thì đây là
 * chỗ hợp nhất — một hàm đọc/ghi để đổi, không rải rác khắp UI.
 *
 * ⚠️ RANH GIỚI MÁY CHỦ ↔ TRÌNH DUYỆT — đọc trước khi "dọn" phần import:
 * `useSiteContext.ts` là client component và nạp thẳng tệp này, nên `fs`/`path` **KHÔNG được**
 * nằm ở import tĩnh mức tệp. Chúng được nạp ĐỘNG, trong thân hàm máy chủ, và dùng tiền tố
 * `node:` — đúng cơ chế `next.config.mjs` đã dựng sẵn (`IgnorePlugin({ resourceRegExp: /^node:/ })`
 * cho bundle client). Đổi về `from 'fs'` trần là gãy bản dựng trình duyệt.
 *
 * Phần THUẦN (`giaiMa`, `parseSiteContext`, `siteRong`) tách khỏi đĩa để test không cần I/O.
 */

import { createStudioBlobStore, type StudioBlobIo, type StudioBlobStore } from '../storage/studio-persist';
import { hoSoRong, type HoSoDiaDiem, type SiteContext } from './types';

// ── ① HỒ SƠ ĐỊA ĐIỂM · SERVER ONLY (JSON theo dự án) ──────────────────────────────────────────
// [Đ2] ĐI THEO KHUÔN ĐÃ CÓ, KHÔNG ĐẺ CƠ CHẾ MỚI: JSON-per-project, đúng pattern
// `lib/dna/store.ts` (`uploads/dna/<projectId>/cards.json`) và notebook/comments đang dùng.
//
// ⚠️ VÌ SAO CHƯA VÀO PRISMA: `prisma migrate`/`db push` KHÔNG chạy được qua sandbox (luật vận
// hành #1 — FUSE không khoá được file POSIX). Đẩy schema mà không migrate được thì có bảng trên
// giấy, không có chỗ lưu thật. Đường di trú: đọc JSON → ghi bảng, giữ JSON làm bản lùi.

/** Nạp `fs`+`path` LÚC CHẠY, chỉ trên máy chủ. Xem ghi chú ranh giới ở đầu tệp. */
async function nodeIo() {
  const [fsMod, pathMod] = await Promise.all([import('node:fs/promises'), import('node:path')]);
  const path = pathMod.default ?? pathMod;
  const goc = path.join(process.cwd(), 'uploads', 'site');
  return { fs: fsMod.default ?? fsMod, path, tepCua: (duAnId: string) => path.join(goc, duAnId, 'ho-so.json') };
}

/** THUẦN — parse nội dung tệp. Tệp hỏng KHÔNG được kéo sập dự án: rơi về hồ sơ rỗng. */
export function giaiMa(raw: string, duAnId: string, luc: string): HoSoDiaDiem {
  if (!raw.trim()) return hoSoRong(duAnId, luc);
  try {
    const p = JSON.parse(raw) as Partial<HoSoDiaDiem>;
    if (!p || typeof p !== 'object' || !p.viTri || !p.huong) return hoSoRong(duAnId, luc);
    return {
      ...hoSoRong(duAnId, luc),
      ...p,
      // `duAnId` LUÔN lấy từ đường dẫn, không tin nội dung tệp — chống một tệp bị chép nhầm
      // sang thư mục khác rồi tự nhận là dự án cũ.
      duAnId,
    } as HoSoDiaDiem;
  } catch {
    return hoSoRong(duAnId, luc);
  }
}

export async function docHoSo(duAnId: string, luc = new Date().toISOString()): Promise<HoSoDiaDiem> {
  try {
    const { fs, tepCua } = await nodeIo();
    return giaiMa(await fs.readFile(tepCua(duAnId), 'utf8'), duAnId, luc);
  } catch {
    return hoSoRong(duAnId, luc);
  }
}

export async function ghiHoSo(duAnId: string, hoSo: HoSoDiaDiem): Promise<HoSoDiaDiem> {
  const ra: HoSoDiaDiem = { ...hoSo, duAnId, suaLuc: new Date().toISOString() };
  const { fs, path, tepCua } = await nodeIo();
  await fs.mkdir(path.dirname(tepCua(duAnId)), { recursive: true });
  await fs.writeFile(tepCua(duAnId), JSON.stringify(ra, null, 2), 'utf8');
  return ra;
}

// ── ② LA BÀN DỰ ÁN · LOCAL-FIRST (IndexedDB) ──────────────────────────────────────────────────
// Dùng NGUYÊN primitive `createStudioBlobStore` (W0.3) — không bịa DB mới. Khoá `site/<projectId>`.
//
// Nói thẳng ranh giới: Blueprint xếp dữ liệu địa điểm vào DOMAIN STATE (chung, ai mở cũng thấy) —
// nhưng schema chưa có trường vị trí (cửa Hoà). Cho tới khi có, bản này chỉ nằm trên MÁY NÀY, cờ
// `dongBo: 'local-only'` hiện ra UI, không giả vờ đã đồng bộ.

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
