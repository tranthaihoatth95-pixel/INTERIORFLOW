/**
 * lib/server/asset-metadata.ts — **MỘT CỬA TRÍCH + MỘT CỬA DỰNG BẢN GHI** cho `LibraryAsset`.
 *
 * ══ VÌ SAO TỆP NÀY TỒN TẠI (đo tại nguồn 20/08, trước khi viết một dòng nào) ═════════════════
 * `LibraryAsset` có ĐÚNG HAI cửa ghi, và chúng cho ra HAI CHẤT LƯỢNG BẢN GHI khác nhau:
 *   · `library-save.ts:56` — ghi `w`/`h`/`palette`… nhưng **nhận từ CALLER** (client tự đo bằng
 *     canvas rồi gửi lên). Server chưa bao giờ tự nhìn vào tệp.
 *   · `promote.ts:144`     — **KHÔNG ghi `w`/`h`/`palette` một chữ nào** ⇒ 9 tài sản promote
 *     đều `0×0`, palette rỗng.
 * ⇒ Bệnh KHÔNG phải "promote quên chép code của library-save". Bệnh là **chưa có ai trích siêu
 *   dữ liệu ở phía máy chủ cả** — library-save chỉ đang *tin lời client*. Chép logic của
 *   library-save sang promote sẽ chép đúng cái lỗ đó sang chỗ thứ hai.
 * ⇒ Lời giải: một cửa TRÍCH (server tự đọc byte) + một cửa DỰNG bản ghi, cả hai đường cùng gọi.
 *
 * ══ [Đ2] NHÌN VÀO TRONG TRƯỚC — đã tìm gì, vì sao không dùng lại được ════════════════════════
 *   · `lib/imaging.ts:15 extractPalette` — **`'use client'`**, chạy bằng `document.createElement`
 *     + `canvas.getImageData`. KHÔNG gọi được từ máy chủ. Thuật toán bucket bên dưới là **BẢN
 *     SONG SINH CÓ CHỦ Ý** của nó (cùng lượng tử 4 bit/kênh · cùng ngưỡng tách 60 · cùng trần 6
 *     màu) để hai cửa ra CÙNG một palette cho cùng một ảnh.
 *     🔴 NỢ ĐÃ KHAI, KHÔNG GIẤU: đây là hai bản cài của một quy tắc. Lời giải đúng là tách phần
 *     THUẦN (RGBA → hex[]) ra một tệp trung tính rồi cả trình duyệt lẫn máy chủ cùng gọi. Không
 *     làm ở đây vì `lib/imaging.ts` NGOÀI vùng ghi của phiếu này (và là module client, đụng vào
 *     là chạm mảng của lane khác). ⇒ phiếu gộp riêng.
 *   · `bamContentHash` (`app/api/project-files/_lib/luu-file.ts:63`) — **DÙNG LẠI NGUYÊN**, không
 *     viết hàm băm thứ hai. `ProjectFile.contentHash` và `LibraryAsset.contentHash` phải là CÙNG
 *     một định nghĩa, nếu không thì so hash giữa hai bảng là so hai thứ khác nhau.
 *   · `sharp ^0.35.3` — đã có trong `package.json`, nhưng tới nay **chỉ dùng trong `scripts/`**
 *     (4 chỗ), chưa từng chạy trong đường sống của app. Vì thế nó được nạp **ĐỘNG + trong
 *     try/catch**: sharp là native module, thiếu binary đúng nền là ném lúc import. Sharp hỏng
 *     thì siêu dữ liệu nghèo đi, **KHÔNG được làm hỏng cả thao tác Promote**.
 *
 * ══ KHÔNG BỊA — luật xuyên suốt tệp này ══════════════════════════════════════════════════════
 * Không đo được thì trả `0` / `[]`, KHÔNG đoán. `w=0` đọc là *"chưa biết"*, và đó là sự thật
 * kiểm chứng được; một con số bịa ra thì không.
 *
 * Import RELATIVE — bộ chạy test là `sucrase-node`, nó KHÔNG đọc `paths` của tsconfig.
 */
import { readFile } from 'fs/promises';
import path from 'path';
import { bamContentHash } from '../../app/api/project-files/_lib/luu-file';

/** Cùng thư mục với hai cửa ghi kia — CỐ Ý, không đẻ kho thứ hai. */
export const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

export interface SieuDuLieuAsset {
  /** 0 = KHÔNG ĐO ĐƯỢC (không phải "ảnh rộng 0"). */
  w: number;
  h: number;
  /** Màu chủ đạo dạng `#rrggbb`, tối đa 6. Rỗng = không đọc được pixel. */
  palette: string[];
  /** sha256 hex của BINARY GỐC — cùng định nghĩa `ProjectFile.contentHash`. */
  contentHash: string;
  /** Khai thật vì sao thiếu — đi thẳng vào báo cáo/kiểm kê, không nuốt lỗi. */
  ghiChu: string[];
}

/* ══════════════════════ ① KÍCH THƯỚC TỪ HEADER — THUẦN, KHÔNG PHỤ THUỘC ══════════════════════
 * Đọc thẳng header của định dạng. Tất định, không native module, test được bằng buffer tự dựng.
 * Đây là đường CHÍNH cho w/h; sharp chỉ là lưới đỡ cho định dạng header này chưa parse (AVIF).
 * Chỉ phủ đúng whitelist `sniffKind` đang nhận (PNG/JPEG/GIF/WEBP/AVIF/PDF) — không hơn.
 */
export function docKichThuocTuHeader(buf: Buffer): { w: number; h: number } | null {
  if (buf.length < 12) return null;

  // ── PNG: 8 byte magic + [len(4) 'IHDR'(4)] + width(4) height(4), big-endian.
  if (buf[0] === 0x89 && buf.subarray(1, 4).toString('ascii') === 'PNG') {
    if (buf.length < 24 || buf.subarray(12, 16).toString('ascii') !== 'IHDR') return null;
    return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
  }

  // ── GIF: 'GIF87a'/'GIF89a' + width(2) height(2), LITTLE-endian.
  const head6 = buf.subarray(0, 6).toString('ascii');
  if (head6 === 'GIF87a' || head6 === 'GIF89a') {
    return { w: buf.readUInt16LE(6), h: buf.readUInt16LE(8) };
  }

  // ── WEBP: 'RIFF'…'WEBP' + chunk. Ba biến thể, kích thước nằm ba chỗ khác nhau.
  if (buf.subarray(0, 4).toString('ascii') === 'RIFF' && buf.subarray(8, 12).toString('ascii') === 'WEBP') {
    return docKichThuocWebp(buf);
  }

  // ── JPEG: quét chuỗi marker tìm SOF, đọc height(2) width(2) — big-endian.
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return docKichThuocJpeg(buf);
  }

  // AVIF (ISOBMFF) và PDF: KHÔNG parse ở đây.
  //  · AVIF cần lần theo cây box meta/iprp/ipco/ispe — viết cả một parser cho một trường là
  //    không đáng khi sharp đã đọc được; sharp hỏng thì `0` (khai thật), không đoán.
  //  · PDF không có "kích thước pixel" — nó có khổ trang. Nhét khổ trang vào `w`/`h` của một
  //    cột vốn tính bằng PIXEL là trộn hai đơn vị ⇒ CỐ Ý bỏ trống.
  return null;
}

function docKichThuocWebp(buf: Buffer): { w: number; h: number } | null {
  if (buf.length < 30) return null;
  const chunk = buf.subarray(12, 16).toString('ascii');
  // VP8 (lossy): sau 'VP8 '(4)+size(4) là frame tag(3)+sync(3), rồi w(2) h(2) — 14 bit thấp.
  if (chunk === 'VP8 ') {
    const w = buf.readUInt16LE(26) & 0x3fff;
    const h = buf.readUInt16LE(28) & 0x3fff;
    return w && h ? { w, h } : null;
  }
  // VP8L (lossless): 1 byte signature 0x2f, rồi 14 bit w-1 và 14 bit h-1 nhồi bit.
  if (chunk === 'VP8L') {
    if (buf[20] !== 0x2f) return null;
    const bits = buf.readUInt32LE(21);
    return { w: (bits & 0x3fff) + 1, h: ((bits >> 14) & 0x3fff) + 1 };
  }
  // VP8X (mở rộng): flags(4) + canvas w-1 (3 byte LE) + canvas h-1 (3 byte LE).
  if (chunk === 'VP8X') {
    const w = buf.readUIntLE(24, 3) + 1;
    const h = buf.readUIntLE(27, 3) + 1;
    return { w, h };
  }
  return null;
}

/** Marker SOF mang kích thước. Loại trừ DHT(c4)/DAC(cc)/RSTn(d0-d7) — chúng cùng dải nhưng KHÔNG
 *  phải SOF; nhầm là đọc ra kích thước rác. */
function laSof(m: number): boolean {
  return m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc;
}

function docKichThuocJpeg(buf: Buffer): { w: number; h: number } | null {
  let i = 2;
  while (i + 9 < buf.length) {
    if (buf[i] !== 0xff) {
      i += 1; // đồng bộ lại — chuỗi đệm 0xff hoặc rác giữa segment
      continue;
    }
    const marker = buf[i + 1];
    if (marker === 0xff) {
      i += 1;
      continue;
    }
    // Marker không có payload — đi tiếp 2 byte.
    if (marker === 0xd8 || (marker >= 0xd0 && marker <= 0xd7) || marker === 0x01) {
      i += 2;
      continue;
    }
    if (marker === 0xda || marker === 0xd9) return null; // vào dữ liệu ảnh / hết file
    const len = buf.readUInt16BE(i + 2);
    if (len < 2) return null;
    if (laSof(marker)) {
      // segment: len(2) precision(1) height(2) width(2)
      return { h: buf.readUInt16BE(i + 5), w: buf.readUInt16BE(i + 7) };
    }
    i += 2 + len;
  }
  return null;
}

/* ══════════════════════ ② PALETTE TỪ RGBA — THUẦN ═════════════════════════════════════════
 * Bản song sinh máy-chủ của `lib/imaging.ts:15` (xem khai nợ ở docstring đầu tệp). Nhận sẵn mảng
 * RGBA để phần THUẦN này test được mà không cần sharp, không cần canvas, không cần tệp thật.
 */
export const PALETTE_TOI_DA = 6;
/** Ngưỡng tách hai màu (tổng sai khác 3 kênh). Cùng số 60 với bản trình duyệt. */
export const PALETTE_NGUONG_TACH = 60;

export function trichPaletteTuRgba(rgba: Uint8Array | Buffer): string[] {
  const buckets = new Map<number, { count: number; r: number; g: number; b: number }>();
  for (let i = 0; i + 3 < rgba.length; i += 4) {
    if (rgba[i + 3] < 128) continue; // bỏ pixel trong suốt — cùng luật bản trình duyệt
    const r = rgba[i], g = rgba[i + 1], b = rgba[i + 2];
    const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
    const bkt = buckets.get(key) ?? { count: 0, r: 0, g: 0, b: 0 };
    bkt.count++;
    bkt.r += r;
    bkt.g += g;
    bkt.b += b;
    buckets.set(key, bkt);
  }
  const sorted = [...buckets.values()].sort((a, b) => b.count - a.count);
  const picked: { r: number; g: number; b: number }[] = [];
  for (const bkt of sorted) {
    const c = { r: bkt.r / bkt.count, g: bkt.g / bkt.count, b: bkt.b / bkt.count };
    const quaGan = picked.some(
      (p) => Math.abs(p.r - c.r) + Math.abs(p.g - c.g) + Math.abs(p.b - c.b) < PALETTE_NGUONG_TACH,
    );
    if (!quaGan) picked.push(c);
    if (picked.length === PALETTE_TOI_DA) break;
  }
  const hex = (n: number) => Math.round(n).toString(16).padStart(2, '0');
  return picked.map((c) => `#${hex(c.r)}${hex(c.g)}${hex(c.b)}`);
}

/* ══════════════════════ ③ CỬA TRÍCH — nơi duy nhất chạm sharp ════════════════════════════ */

/** Cạnh ảnh lấy mẫu để đọc pixel. 96 — cùng số bản trình duyệt dùng, để palette khớp nhau. */
const CANH_LAY_MAU = 96;

/**
 * BỀ MẶT TỐI THIỂU của sharp mà tệp này dùng — khai tay thay vì `typeof import('sharp')`.
 * Lý do: sharp xuất hai hình dạng type (`export = sharp` cho CJS · `export default` cho ESM), nên
 * kiểu namespace KHÔNG gọi được (tsc TS2349, đã gặp thật). Khai đúng 5 thứ đang dùng thì hợp
 * đồng rõ ràng, không phụ thuộc sharp đóng gói type kiểu nào, và **thu hẹp bề mặt phụ thuộc vào
 * một native module** — đổi/bỏ sharp sau này chỉ phải xem đúng khối này.
 */
interface SharpAnh {
  metadata(): Promise<{ width?: number; height?: number }>;
  resize(w: number, h: number, o: { fit: 'fill' }): SharpAnh;
  ensureAlpha(): SharpAnh;
  raw(): SharpAnh;
  toBuffer(): Promise<Buffer>;
}
type SharpTao = (buf: Buffer, o?: { failOn?: 'none' }) => SharpAnh;

/**
 * Đọc pixel bằng `sharp`. Trả lý do thay vì ném nếu không nạp/không giải mã được.
 * Nạp ĐỘNG vì sharp là native module chưa từng chạy trong đường sống của app (xem docstring).
 */
async function docPixelBangSharp(
  buf: Buffer,
): Promise<{ rgba: Buffer; w: number; h: number } | { loi: string }> {
  let sharp: SharpTao;
  try {
    const mod = (await import('sharp')) as unknown as { default?: SharpTao };
    const tao = mod.default ?? (mod as unknown as SharpTao);
    if (typeof tao !== 'function') return { loi: 'sharp nạp được nhưng không phải hàm dựng' };
    sharp = tao;
  } catch (e) {
    return { loi: `sharp không nạp được (${(e as Error).message.slice(0, 80)})` };
  }
  try {
    const img = sharp(buf, { failOn: 'none' });
    const meta = await img.metadata();
    const raw = await img
      .resize(CANH_LAY_MAU, CANH_LAY_MAU, { fit: 'fill' })
      .ensureAlpha()
      .raw()
      .toBuffer();
    return { rgba: raw, w: meta.width ?? 0, h: meta.height ?? 0 };
  } catch (e) {
    return { loi: `sharp không giải mã được ảnh (${(e as Error).message.slice(0, 80)})` };
  }
}

/**
 * ⭐ CỬA TRÍCH DUY NHẤT. Mọi đường ghi `LibraryAsset` đi qua đây để lấy `w`/`h`/`palette`/hash.
 *
 * Thứ tự có chủ đích: **header trước, sharp sau**. Header là thuần + tất định + không phụ thuộc
 * native binary; sharp chỉ lấp chỗ header không phủ (AVIF) và là nguồn DUY NHẤT của palette.
 *
 * @param hashCoSan hash đã tính ở nơi khác (vd `ProjectFile.contentHash`) — truyền vào để KHÔNG
 *   băm lại 25MB lần hai. Bỏ trống thì tự băm bằng `bamContentHash` (vẫn là hàm đó, không phải
 *   hàm thứ hai).
 */
export async function trichSieuDuLieu(buf: Buffer, hashCoSan?: string | null): Promise<SieuDuLieuAsset> {
  const ghiChu: string[] = [];
  const contentHash = hashCoSan && hashCoSan.length === 64 ? hashCoSan : bamContentHash(buf);

  const tuHeader = docKichThuocTuHeader(buf);
  let w = tuHeader?.w ?? 0;
  let h = tuHeader?.h ?? 0;
  let palette: string[] = [];

  const pixel = await docPixelBangSharp(buf);
  if ('loi' in pixel) {
    ghiChu.push(pixel.loi);
    if (!tuHeader) ghiChu.push('không đọc được kích thước: header chưa phủ định dạng này và sharp trượt');
  } else {
    palette = trichPaletteTuRgba(pixel.rgba);
    // Header thắng khi có — nhưng sharp lấp chỗ header bỏ trống (AVIF).
    if (!w || !h) {
      w = pixel.w;
      h = pixel.h;
    } else if (pixel.w && pixel.h && (pixel.w !== w || pixel.h !== h)) {
      // Hai nguồn cãi nhau: giữ header (tất định), KHAI ra thay vì nuốt.
      ghiChu.push(`kích thước lệch: header ${w}×${h} · sharp ${pixel.w}×${pixel.h} — giữ header`);
    }
    if (palette.length === 0) ghiChu.push('không trích được màu chủ đạo (ảnh trong suốt hoàn toàn?)');
  }

  return { w, h, palette, contentHash, ghiChu };
}

/** Đọc tệp trong `./uploads` rồi trích. `null` = tệp CHẾT trên đĩa (bản ghi còn, file mất). */
export async function trichSieuDuLieuTuDia(
  tenTep: string,
  hashCoSan?: string | null,
): Promise<SieuDuLieuAsset | null> {
  let buf: Buffer;
  try {
    buf = await readFile(path.join(UPLOAD_DIR, tenTep));
  } catch {
    return null;
  }
  return trichSieuDuLieu(buf, hashCoSan);
}

/* ══════════════════════ ④ CỬA DỰNG BẢN GHI — nửa "GHI" của hàm chung ════════════════════════
 * Hai đường ghi trước nay tự gõ object `data:` của mình ⇒ đường này nhớ `palette`, đường kia
 * quên. Gom về một nơi thì thêm/bớt một trường là **cả hai cửa cùng đổi**, không thể lệch nữa.
 */
export interface DauVaoDungBanGhi {
  userId: string;
  name: string;
  category: string;
  tags?: string;
  mime: string;
  /** tên tệp trong `./uploads`. */
  path: string;
  usage: string;
  caption?: string;
  content?: string | null;
  meta: SieuDuLieuAsset | null;
  /** Chỉ dùng khi `meta` null (không trích được) — giá trị client khai, coi là ĐƯỜNG LÙI. */
  wDuPhong?: number;
  hDuPhong?: number;
  paletteDuPhong?: unknown;
}

/**
 * Dựng đúng object `data:` cho `prisma.libraryAsset.create`. KHÔNG chạm DB — để test được thuần
 * và để caller tự quyết chạy trong `$transaction` nào.
 */
export function dungBanGhiLibraryAsset(i: DauVaoDungBanGhi) {
  const palette = i.meta
    ? i.meta.palette
    : Array.isArray(i.paletteDuPhong)
      ? (i.paletteDuPhong as unknown[]).filter((x): x is string => typeof x === 'string').slice(0, 8)
      : [];
  const w = i.meta ? i.meta.w : Number.isFinite(i.wDuPhong) ? Math.round(i.wDuPhong as number) : 0;
  const h = i.meta ? i.meta.h : Number.isFinite(i.hDuPhong) ? Math.round(i.hDuPhong as number) : 0;

  return {
    userId: i.userId,
    name: String(i.name).slice(0, 120),
    category: String(i.category),
    tags: String(i.tags ?? ''),
    mime: i.mime,
    path: i.path,
    usage: i.usage,
    // Cột là chuỗi JSON (không phải mảng) — giữ nguyên khuôn đang chạy, đừng đổi kiểu cột.
    palette: palette.length ? JSON.stringify(palette.slice(0, 8)) : '',
    caption: typeof i.caption === 'string' ? i.caption.slice(0, 400) : '',
    content: typeof i.content === 'string' ? i.content.slice(0, 20000) : null,
    w,
    h,
    // null (KHÔNG chuỗi rỗng) khi chưa biết — `@@index([userId, contentHash])` tra theo null được,
    // còn '' là một giá trị THẬT sẽ gom mọi tệp chưa hash vào cùng một "nhóm trùng" giả.
    contentHash: i.meta ? i.meta.contentHash : null,
    lastEditedBy: i.userId,
  };
}
