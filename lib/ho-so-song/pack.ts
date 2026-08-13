/**
 * lib/ho-so-song/pack.ts — đóng Gói Hồ Sơ Sống thành `.zip` (P4, phiếu goi-ho-so-song).
 *
 * `packHoSoSong(input)` NHẬN artifact ĐÃ SINH SẴN từ các đường xuất hiện có — KHÔNG tự
 * render PDF/ảnh/BOQ (một cỗ máy nhiều mặt tiền [T2]; pack chỉ là thợ đóng thùng).
 * Cây zip:
 *   index.html      — viewer tự chứa (tầng ①)
 *   manifest.json   — mục lục + sha256 mọi kênh (tầng ③)
 *   data/deck.json  — ruột máy-đọc, nhập lại được [T5]
 *   out/…           — PDF/XLSX/ảnh chuẩn ngành (tầng ②)
 *
 * jszip ĐÃ có sẵn trong repo (lib/pptx-zip-fonts.ts, lib/boq/xlsx.ts) — import động,
 * không dep mới. Không Date.now trong lib: `taoLuc` do caller cấp (test tất định).
 * MARKER: HoSoSong.
 */

import type { HoSoSongInput, HoSoSongKenh, HoSoSongManifest } from './types';
import { mimeAnh, sha256Hex, taoKenh, taoManifest, toBytes } from './manifest';
import { renderViewerHtml, type HoSoSongViewerData } from './viewer-template';

const MIME = {
  html: 'text/html; charset=utf-8',
  json: 'application/json',
  pdf: 'application/pdf',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  zip: 'application/zip',
} as const;

/** Slug an toàn tên file từ tên dự án tiếng Việt — bỏ dấu, thường hoá, `-` nối. */
export function hoSoSongSlug(ten: string): string {
  const s = (ten || 'du-an')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, (c) => (c === 'đ' ? 'd' : 'D'))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return s || 'du-an';
}

/** Tên file gói theo phiếu ⑤: `ho-so-<slug>-<yyyymmdd>.zip` (ngày lấy từ `taoLuc`). */
export function hoSoSongFileName(tenDuAn: string, taoLuc: string): string {
  const ymd = (taoLuc || '').slice(0, 10).replace(/-/g, '') || '00000000';
  return `ho-so-${hoSoSongSlug(tenDuAn)}-${ymd}.zip`;
}

/** Tên ảnh an toàn trong zip — chặn path traversal / ký tự lạ từ tên caller đưa vào. */
function tenAnhSach(name: string, i: number): string {
  const base = (name || '').split(/[\\/]/).pop() || '';
  const clean = base.replace(/[^A-Za-z0-9._-]+/g, '-').replace(/^[-.]+/, '');
  return clean || `trang-${String(i + 1).padStart(2, '0')}.png`;
}

export interface HoSoSongBuilt {
  bytes: Uint8Array;
  manifest: HoSoSongManifest;
  fileName: string;
}

/**
 * Dựng gói — bản trả bytes + manifest cho test/script node soi được ruột.
 * Thiếu TOÀN BỘ artifact → ném lỗi rõ ràng (không sinh gói rỗng giả vờ có hồ sơ [T0]).
 */
export async function buildHoSoSong(input: HoSoSongInput): Promise<HoSoSongBuilt> {
  const coGi =
    input.deckJson !== undefined ||
    input.boqXlsx !== undefined ||
    input.pdf !== undefined ||
    (input.images?.length ?? 0) > 0;
  if (!coGi) {
    throw new Error(
      'Gói Hồ Sơ Sống rỗng — không có artifact nào (deck / ảnh / PDF / BOQ) để đóng gói.',
    );
  }

  // ---- 1. Chuẩn hoá từng artifact về bytes + entry kênh (tầng ② nganh, tầng ③ ruot) ----
  const files: Array<{ path: string; bytes: Uint8Array }> = [];
  const kenh: HoSoSongKenh[] = [];
  const vang: string[] = [];

  let soBan = 0;
  if (input.deckJson !== undefined) {
    const dj = input.deckJson as { sheets?: unknown };
    soBan = Array.isArray(dj?.sheets) ? dj.sheets.length : 1;
    const bytes = await toBytes(JSON.stringify(input.deckJson));
    files.push({ path: 'data/deck.json', bytes });
    kenh.push(await taoKenh('deck', 'ruot', 'data/deck.json', MIME.json, bytes));
  } else {
    vang.push('deck');
  }

  if (input.pdf !== undefined) {
    const bytes = await toBytes(input.pdf);
    files.push({ path: 'out/ho-so.pdf', bytes });
    kenh.push(await taoKenh('pdf', 'nganh', 'out/ho-so.pdf', MIME.pdf, bytes));
  } else {
    vang.push('pdf');
  }

  if (input.boqXlsx !== undefined) {
    const bytes = await toBytes(input.boqXlsx);
    files.push({ path: 'out/boq.xlsx', bytes });
    kenh.push(await taoKenh('boq', 'nganh', 'out/boq.xlsx', MIME.xlsx, bytes));
  } else {
    vang.push('boq');
  }

  const pages: HoSoSongViewerData['pages'] = [];
  const images = input.images ?? [];
  for (let i = 0; i < images.length; i++) {
    const name = tenAnhSach(images[i].name, i);
    const path = `out/images/${name}`;
    const bytes = await toBytes(images[i].data);
    files.push({ path, bytes });
    kenh.push(await taoKenh(`anh-${i + 1}`, 'nganh', path, images[i].mime ?? mimeAnh(name), bytes));
    pages.push({ path, name });
  }
  if (!images.length) vang.push('anh');

  // ---- 2. Viewer (tầng ①) — nhúng dữ liệu, KHÔNG gồm entry của chính nó (gà–trứng:
  // sha của viewer chỉ biết SAU khi render; manifest.json cuối mới mang entry viewer) ----
  const viewerHtml = renderViewerHtml({
    projectId: input.projectId,
    tenDuAn: input.tenDuAn,
    taoLuc: input.taoLuc,
    kenh,
    pages,
    boq: input.boqTomTat,
    vang,
  });
  const viewerBytes = await toBytes(viewerHtml);
  const kenhViewer = await taoKenh('viewer', 'viewer', 'index.html', MIME.html, viewerBytes);

  const manifest = taoManifest({
    projectId: input.projectId,
    tenDuAn: input.tenDuAn,
    taoLuc: input.taoLuc,
    kenh: [kenhViewer, ...kenh],
    soBan,
    nguoiXuat: input.nguoiXuat,
  });

  // ---- 3. Đóng zip ----
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();
  zip.file('index.html', viewerBytes);
  zip.file('manifest.json', JSON.stringify(manifest, null, 2));
  for (const f of files) zip.file(f.path, f.bytes);
  const bytes = await zip.generateAsync({
    type: 'uint8array',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  return { bytes, manifest, fileName: hoSoSongFileName(input.tenDuAn, input.taoLuc) };
}

/** Mặt tiền theo hợp đồng phiếu ④.2 — trả Blob sẵn tải xuống từ UI. */
export async function packHoSoSong(input: HoSoSongInput): Promise<Blob> {
  const built = await buildHoSoSong(input);
  // Copy sang ArrayBuffer sạch — cùng quirk kiểu BlobPart đã ghi ở manifest.ts#sha256Hex.
  const buf = new ArrayBuffer(built.bytes.byteLength);
  new Uint8Array(buf).set(built.bytes);
  return new Blob([buf], { type: MIME.zip });
}

export { sha256Hex };
