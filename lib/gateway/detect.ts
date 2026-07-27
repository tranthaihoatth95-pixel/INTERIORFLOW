/**
 * lib/gateway/detect.ts — NT2 "một cửa nuốt mọi đuôi" (VIỆC ②, 28/07, PLAN-LIBRARY-GATEWAY.md §2).
 *
 * Nhận diện định dạng file từ đuôi tên VÀ magic byte (đầu file) — không chỉ dựa đuôi, vì user đổi
 * tên file (vd `.jpg` → `.png`) vẫn phải nhận đúng. Khi có `bytes`, magic byte THẮNG đuôi tên nếu
 * kết luận được cụ thể hơn (vd 1 file `.pptx` thật ra là `.ifpack` đổi đuôi).
 *
 * Thuần dữ liệu/logic — CHƯA nối vào IOMenu hay UI nào (xem `route.ts` + PLAN §2(c): tích hợp UI
 * phải đợi NT1 xong).
 */

export type GatewayFormat =
  | 'idf'
  | 'ifpack'
  | 'dxf'
  | 'dwg'
  | 'image'
  | 'pptx'
  | 'pdf'
  | 'xlsx'
  | 'csv'
  | 'unknown';

export interface DetectInput {
  /** tên file gốc (kèm đuôi) — dùng khi không có/không đọc được magic byte. */
  name: string;
  /**
   * phần đầu file (khuyến nghị ≥ 4KB để soi được tên entry bên trong ZIP cho .pptx/.xlsx/.ifpack).
   * Không bắt buộc — thiếu thì chỉ nhận diện theo đuôi.
   */
  bytes?: Uint8Array;
}

function ext(name: string): string {
  const i = name.lastIndexOf('.');
  return i < 0 ? '' : name.slice(i + 1).toLowerCase();
}

const IMAGE_EXT = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg']);

function byExtension(name: string): GatewayFormat {
  const e = ext(name);
  if (e === 'idf') return 'idf';
  if (e === 'ifpack') return 'ifpack';
  if (e === 'dxf') return 'dxf';
  if (e === 'dwg') return 'dwg';
  if (e === 'pptx') return 'pptx';
  if (e === 'pdf') return 'pdf';
  if (e === 'xlsx') return 'xlsx';
  if (e === 'csv') return 'csv';
  if (IMAGE_EXT.has(e)) return 'image';
  return 'unknown';
}

function bytesStartWith(bytes: Uint8Array, sig: number[], offset = 0): boolean {
  if (bytes.length < offset + sig.length) return false;
  for (let i = 0; i < sig.length; i++) {
    if (bytes[offset + i] !== sig[i]) return false;
  }
  return true;
}

/** ZIP-based Office/pack format — phân biệt bằng tên entry ("filename") nằm gần đầu buffer. */
function sniffZipContents(bytes: Uint8Array): GatewayFormat | null {
  const isZip = bytesStartWith(bytes, [0x50, 0x4b, 0x03, 0x04]) || bytesStartWith(bytes, [0x50, 0x4b, 0x05, 0x06]);
  if (!isZip) return null;
  // entry name của local file header nằm ngay sau 30 byte header đầu — decode latin1 (đủ cho ASCII
  // path trong zip) rồi tìm chuỗi đặc trưng, không cần giải nén thật.
  let text = '';
  for (let i = 0; i < bytes.length; i++) text += String.fromCharCode(bytes[i]);
  if (text.includes('manifest.json') && (text.includes('drawing.idf') || text.includes('project.json'))) {
    return 'ifpack';
  }
  if (text.includes('ppt/presentation.xml') || text.includes('ppt/slides/')) return 'pptx';
  if (text.includes('xl/workbook.xml') || text.includes('xl/worksheets/')) return 'xlsx';
  return null; // là ZIP thật nhưng không nhận ra ruột — để caller rơi về đuôi tên.
}

function byMagicByte(bytes: Uint8Array): GatewayFormat | null {
  if (bytesStartWith(bytes, [0x89, 0x50, 0x4e, 0x47])) return 'image'; // PNG
  if (bytesStartWith(bytes, [0xff, 0xd8, 0xff])) return 'image'; // JPEG
  if (bytesStartWith(bytes, [0x47, 0x49, 0x46, 0x38])) return 'image'; // GIF87a/89a
  if (bytesStartWith(bytes, [0x42, 0x4d])) return 'image'; // BMP
  if (bytesStartWith(bytes, [0x52, 0x49, 0x46, 0x46]) && bytesStartWith(bytes, [0x57, 0x45, 0x42, 0x50], 8)) {
    return 'image'; // WEBP (RIFF....WEBP)
  }
  if (bytesStartWith(bytes, [0x25, 0x50, 0x44, 0x46])) return 'pdf'; // %PDF
  if (bytesStartWith(bytes, [0x41, 0x43])) return 'dwg'; // "AC10xx"/"AC1032"... header DWG
  const zip = sniffZipContents(bytes);
  if (zip) return zip;
  return null;
}

/** Nhận diện định dạng — magic byte thắng đuôi tên khi kết luận được cụ thể hơn. */
export function detectFormat(input: DetectInput): GatewayFormat {
  const byExt = byExtension(input.name);
  if (!input.bytes || input.bytes.length === 0) return byExt;

  const byMagic = byMagicByte(input.bytes);
  if (byMagic) return byMagic;

  // ZIP thật nhưng không soi được ruột (.pptx/.xlsx/.ifpack không rõ) → tin đuôi tên nếu nó CŨNG
  // là 1 định dạng ZIP-based đã biết, tránh gán bừa 'unknown' cho file hợp lệ chỉ vì thiếu bytes.
  const isZip = bytesStartWith(input.bytes, [0x50, 0x4b, 0x03, 0x04]) || bytesStartWith(input.bytes, [0x50, 0x4b, 0x05, 0x06]);
  if (isZip && (byExt === 'pptx' || byExt === 'xlsx' || byExt === 'ifpack')) return byExt;

  return byExt;
}
