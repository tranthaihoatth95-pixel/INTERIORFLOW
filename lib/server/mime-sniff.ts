/**
 * lib/server/mime-sniff.ts — nhận diện loại file bằng MAGIC BYTES (đọc byte đầu file thật),
 * KHÔNG tin nhãn client tự khai (`dataUrl` prefix hay `File.type` trình duyệt gửi lên đều có thể
 * giả — đây chính là gốc lỗ §6.2 `docs/AUDIT-BACKEND-2026-08-03.md`: `mime` lưu thẳng vào DB từ
 * chuỗi client khai, không đối chiếu nội dung thật).
 *
 * Whitelist CỨNG — chỉ nhận đúng các định dạng ĐÃ CÓ nơi dùng thật trong app (ảnh raster hiển thị
 * trong Thư viện/Notebook, PDF cho Notebook ingest, và `.idf`/`.idfp` — hồ sơ của CHÍNH IF, nhận
 * bằng kiểm CẤU TRÚC chứ không phải magic-bytes; xem nhánh `idfp` cuối `sniffKind`). KHÔNG nhận
 * `svg`/`html`/bất kỳ định dạng chứa script được — đó chính là vector XSS lưu trữ mà spec này vá.
 *
 * Import TƯƠNG ĐỐI (không alias '@/') — test được thẳng qua `sucrase-node` (cùng quy ước đã ghi ở
 * `lib/commands/registry.ts`/`lib/server/credits.ts`).
 */

export type SniffedKind = 'png' | 'jpeg' | 'gif' | 'webp' | 'avif' | 'pdf' | 'idfp';

/** Kind → MIME chuẩn hoá để LƯU vào DB (không lưu lại chuỗi client gửi). */
export const SNIFFED_MIME: Record<SniffedKind, string> = {
  png: 'image/png',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  avif: 'image/avif',
  pdf: 'application/pdf',
  idfp: 'application/json',
};

const RASTER_IMAGE_KINDS: SniffedKind[] = ['png', 'jpeg', 'gif', 'webp', 'avif'];

function asBuffer(b: Buffer | Uint8Array): Buffer {
  return Buffer.isBuffer(b) ? b : Buffer.from(b);
}

/** Đọc byte đầu file, trả về loại NHẬN DIỆN ĐƯỢC (không phải nhãn client khai) — `null` = không
 * khớp bất kỳ định dạng nào trong whitelist (bao gồm cả HTML/SVG/JS — cố ý, đó là điều cần chặn). */
export function sniffKind(buf: Buffer | Uint8Array): SniffedKind | null {
  const b = asBuffer(buf);
  if (b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 && b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a) {
    return 'png';
  }
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) {
    return 'jpeg';
  }
  if (b.length >= 6) {
    const head6 = b.subarray(0, 6).toString('ascii');
    if (head6 === 'GIF87a' || head6 === 'GIF89a') return 'gif';
  }
  if (b.length >= 12 && b.subarray(0, 4).toString('ascii') === 'RIFF' && b.subarray(8, 12).toString('ascii') === 'WEBP') {
    return 'webp';
  }
  // `.idfp` — HỒ SƠ TRÌNH BÀY CỦA CHÍNH IF (21/08). Nhận vào whitelist để deck có BẢN SAO BỀN
  // trên máy chủ; trước bản này deck chỉ sống ở IndexedDB và đã MẤT TRẮNG một lần khi hồ sơ
  // trình duyệt bị làm mới.
  //
  // Vì sao KHÔNG phá luật chống XSS lưu trữ mà whitelist này sinh ra:
  //  ① đây không phải "nhận JSON bất kỳ" — phải PARSE ĐƯỢC và mang đúng chữ ký tài liệu
  //     (`idfpVersion` là số + `sheets` là mảng). Một tệp HTML/SVG/JS không thể thoả.
  //     Kiểm CẤU TRÚC mạnh hơn kiểm magic-bytes, không yếu hơn.
  //  ② đường phục vụ lại (`_lib/doc-noi-dung.ts`) ép `application/octet-stream` cho mọi thứ
  //     KHÔNG phải ảnh raster, luôn kèm `X-Content-Type-Options: nosniff` ⇒ trình duyệt không
  //     bao giờ diễn giải tệp này thành HTML. `idfp` cố ý ĐỨNG NGOÀI `RASTER_IMAGE_KINDS`.
  // Đặt CUỐI để ảnh/PDF luôn thắng trước; chỉ tệp không khớp magic-bytes nào mới thử parse.
  if (b.length >= 2 && b.length <= 40 * 1024 * 1024) {
    const dau = b.subarray(0, 64).toString('utf8').trimStart();
    if (dau.startsWith('{')) {
      try {
        const o = JSON.parse(b.toString('utf8')) as { idfpVersion?: unknown; idfVersion?: unknown; sheets?: unknown };
        // Hai chữ ký tài liệu của IF: `.idfp` (hồ sơ trình bày) và `.idf` (bản vẽ 2D). Cùng một
        // lý lẽ an toàn: phải PARSE ĐƯỢC và mang đúng chữ ký + `sheets` là mảng — HTML/SVG/JS
        // không thể thoả. Bản vẽ là SỰ THẬT NGHỀ NGHIỆP nên nó cần bản sao bền hơn cả deck.
        if (Array.isArray(o?.sheets) && (typeof o?.idfpVersion === 'number' || typeof o?.idfVersion === 'number')) {
          return 'idfp';
        }
      } catch {
        /* không phải JSON hợp lệ — rơi xuống, trả null như cũ */
      }
    }
  }
  if (b.length >= 4 && b.subarray(0, 4).toString('ascii') === '%PDF') {
    return 'pdf';
  }
  // AVIF/AVIS — ISOBMFF: 4 byte size (bỏ qua) + "ftyp" + major brand. Quét brand trong 32 byte
  // đầu (lenient — đủ cho file thật, tránh viết cả 1 parser ISOBMFF đầy đủ cho 1 field brand).
  if (b.length >= 12 && b.subarray(4, 8).toString('ascii') === 'ftyp') {
    const head = b.subarray(0, Math.min(32, b.length)).toString('ascii');
    if (head.includes('avif') || head.includes('avis')) return 'avif';
  }
  // `.idfp`/`.idf` — HỒ SƠ TRÌNH BÀY và BẢN VẼ 2D CỦA CHÍNH IF. Nhận vào whitelist để deck và
  // bản vẽ có BẢN SAO BỀN trên máy chủ (`lib/present-editor/luu-len-may-chu.ts` +
  // `lib/cad/luu-len-may-chu.ts`); trước bản này cả hai chỉ sống ở IndexedDB và deck đã MẤT
  // TRẮNG một lần khi hồ sơ trình duyệt bị làm mới. Không có nhánh này thì `luuProjectFile()`
  // trả 415 và cả hai đường sao lưu là tính năng chết — đã đo thật.
  //
  // Vì sao KHÔNG phá luật chống XSS lưu trữ mà whitelist này sinh ra:
  //  ① đây không phải "nhận JSON bất kỳ" — phải PARSE ĐƯỢC và mang đúng chữ ký tài liệu
  //     (`idfpVersion`/`idfVersion` là số + `sheets` là mảng). Một tệp HTML/SVG/JS không thể
  //     thoả. Kiểm CẤU TRÚC mạnh hơn kiểm magic-bytes, không yếu hơn.
  //  ② đường phục vụ lại (`app/api/project-files/_lib/doc-noi-dung.ts`) ép
  //     `application/octet-stream` + `Content-Disposition: attachment` cho mọi thứ KHÔNG phải
  //     ảnh raster, luôn kèm `X-Content-Type-Options: nosniff` ⇒ trình duyệt không bao giờ diễn
  //     giải tệp này thành HTML. `idfp` cố ý ĐỨNG NGOÀI `RASTER_IMAGE_KINDS`.
  // Đặt CUỐI THẬT SỰ (sau cả AVIF) để mọi định dạng nhận bằng magic-bytes luôn thắng trước; chỉ
  // tệp không khớp byte đầu nào mới phải trả giá một lần `JSON.parse`.
  if (b.length >= 2 && b.length <= 40 * 1024 * 1024) {
    const dau = b.subarray(0, 64).toString('utf8').trimStart();
    if (dau.startsWith('{')) {
      try {
        const o = JSON.parse(b.toString('utf8')) as { idfpVersion?: unknown; idfVersion?: unknown; sheets?: unknown };
        // Hai chữ ký tài liệu của IF: `.idfp` (hồ sơ trình bày) và `.idf` (bản vẽ 2D). Cùng một
        // lý lẽ an toàn: phải PARSE ĐƯỢC và mang đúng chữ ký + `sheets` là mảng. Bản vẽ là SỰ
        // THẬT NGHỀ NGHIỆP nên nó cần bản sao bền hơn cả deck.
        if (Array.isArray(o?.sheets) && (typeof o?.idfpVersion === 'number' || typeof o?.idfVersion === 'number')) {
          return 'idfp';
        }
      } catch {
        /* không phải JSON hợp lệ — rơi xuống, trả null như cũ */
      }
    }
  }
  return null;
}

/** true nếu `kind` là ảnh raster hiển thị được trực tiếp (inline an toàn) — PDF KHÔNG tính (dùng
 * cho quyết định `Content-Disposition: inline` vs `attachment` khi trả file). */
export function isRasterImageKind(kind: SniffedKind | null): kind is SniffedKind {
  return kind !== null && RASTER_IMAGE_KINDS.includes(kind);
}
