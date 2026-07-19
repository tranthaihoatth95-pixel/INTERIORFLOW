/**
 * lib/pptx-font-embed.ts — NHÚNG FONT THẬT VÀO FILE .PPTX.
 *
 * BỐI CẢNH (vì sao file này tồn tại)
 * ----------------------------------
 * `lib/pptx.ts` dựng deck bằng pptxgenjs. pptxgenjs v3.12 **không có API nhúng font** — nó chỉ
 * ghi TÊN font (`fontFace`) vào XML. Máy người nhận chưa cài font đó ⇒ PowerPoint lặng lẽ thay
 * bằng font khác, vỡ hết bố cục. Với font user tự tải lên (không ai khác có) thì gần như chắc vỡ.
 *
 * File .pptx là một file ZIP theo chuẩn OOXML. Chuẩn đó CÓ chỗ cho font nhúng:
 *   - `/ppt/fonts/font{N}.fntdata`      — dữ liệu font
 *   - `<p:embeddedFontLst>` trong `presentation.xml`
 *   - quan hệ (relationship) trong `presentation.xml.rels`
 *   - khai báo phần mở rộng `fntdata` trong `[Content_Types].xml`
 * Nên hướng đi là HẬU XỬ LÝ: để pptxgenjs xuất xong, mở lại ZIP, chèn thêm 4 mảnh trên, đóng lại.
 *
 * ĐỊNH DẠNG fntdata — ĐIỂM MẤU CHỐT, ĐỪNG ĐƠN GIẢN HOÁ
 * ----------------------------------------------------
 * PowerPoint KHÔNG nhận TTF/OTF thô trong `.fntdata`. Nó ghi và đọc **EOT (Embedded OpenType)**.
 * Xem W3C EOT Submission (https://www.w3.org/Submission/EOT/) và xác nhận từ Andreas Beeker
 * (Apache POI): "Fonts are stored under /ppt/fonts/*.fntdata in the pptx, always in EOT format."
 *
 * EOT = phần header mô tả font + dữ liệu sfnt gốc nối phía sau. Header BẮT BUỘC khớp metadata
 * thật của font (tên họ, kiểu, weight, italic, PANOSE, UnicodeRange, checkSumAdjustment) — đó là
 * cách PowerPoint đối chiếu font nhúng với tên font ghi trong `fontFace`. Sai tên họ ⇒ nhúng vào
 * cũng vô dụng vì không khớp được.
 *
 * PowerPoint nhận hai biến thể EOT: MTX (MicroType Express — nén, có bằng sáng chế, thuật toán
 * nặng) và **non-MTX (không nén)**. Ta dùng non-MTX: `Flags = 0`, dữ liệu sfnt để nguyên. Đây là
 * lý do làm được thuần JS phía client — không cần nén, không cần obfuscate.
 *
 * (Lưu ý phân biệt: obfuscation XOR 32 byte đầu bằng GUID là chuyện của **.docx** — Word dùng
 * `w:fontKey`. Phần `p:embeddedFont` của PPTX trong ECMA-376 KHÔNG có fontKey, nên KHÔNG obfuscate.)
 *
 * GIẤY PHÉP FONT — CÓ CHẶN THẬT, KHÔNG PHẢI TRANG TRÍ
 * ---------------------------------------------------
 * Nhúng font vào file đem đi phát cho người khác là hành vi PHÂN PHỐI bản sao font. Bảng `OS/2`
 * của font có cờ `fsType` do chính nhà làm font đặt ra để quy định điều này. Ta đọc cờ đó và
 * TỪ CHỐI nhúng khi font cấm (`Restricted License`). Xem `checkEmbeddingLicense`.
 */

/* ------------------------------------------------------------------ */
/* Đọc bảng sfnt (TTF/OTF)                                             */
/* ------------------------------------------------------------------ */

/** Metadata rút từ font, đủ để dựng header EOT. */
export interface SfntMeta {
  familyName: string;
  styleName: string;
  fullName: string;
  versionName: string;
  /** usWeightClass (OS/2), vd 400 = Regular, 700 = Bold. */
  weight: number;
  italic: boolean;
  /** Cờ giấy phép nhúng (OS/2). */
  fsType: number;
  /** 10 byte PANOSE. */
  panose: Uint8Array;
  unicodeRange: [number, number, number, number];
  codePageRange: [number, number];
  /** head.checkSumAdjustment — EOT dùng để đối chiếu tính toàn vẹn. */
  checkSumAdjustment: number;
}

/** Lỗi có thông điệp tiếng Việt đọc được để UI hiện thẳng cho user. */
export class FontEmbedError extends Error {}

interface TableRec {
  offset: number;
  length: number;
}

/**
 * Bóc bảng thư mục sfnt. Chấp nhận TrueType (0x00010000 / 'true') và OpenType-CFF ('OTTO').
 * TỪ CHỐI WOFF/WOFF2 (đã nén — muốn nhúng phải giải nén ngược, ngoài phạm vi) và TTC (nhiều
 * font trong một file — không biết chọn face nào).
 */
function readTableDirectory(view: DataView): Map<string, TableRec> {
  if (view.byteLength < 12) throw new FontEmbedError('File font hỏng hoặc quá ngắn.');
  const tag = view.getUint32(0, false);
  const tagStr = String.fromCharCode(
    view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3),
  );

  if (tagStr === 'wOFF' || tagStr === 'wOF2') {
    throw new FontEmbedError(
      'Font WOFF/WOFF2 không nhúng được vào PPTX (dữ liệu đã nén). Hãy tải lên bản .ttf hoặc .otf.',
    );
  }
  if (tagStr === 'ttcf') {
    throw new FontEmbedError('Font dạng bộ sưu tập (.ttc) không nhúng được vào PPTX. Hãy dùng file .ttf/.otf đơn.');
  }
  if (tag !== 0x00010000 && tagStr !== 'true' && tagStr !== 'OTTO') {
    throw new FontEmbedError('Không nhận ra định dạng font (cần .ttf hoặc .otf).');
  }

  const numTables = view.getUint16(4, false);
  const tables = new Map<string, TableRec>();
  for (let i = 0; i < numTables; i++) {
    const rec = 12 + i * 16;
    if (rec + 16 > view.byteLength) break;
    const name = String.fromCharCode(
      view.getUint8(rec), view.getUint8(rec + 1), view.getUint8(rec + 2), view.getUint8(rec + 3),
    );
    tables.set(name, { offset: view.getUint32(rec + 8, false), length: view.getUint32(rec + 12, false) });
  }
  return tables;
}

/**
 * Đọc bảng `name`. Ưu tiên bản ghi Windows (platformID 3, UTF-16BE); không có thì lấy Macintosh
 * (platformID 1, 1 byte/ký tự). Tên họ font phải khớp CHÍNH XÁC chuỗi ghi ở `fontFace` trong XML,
 * nên đây không phải chi tiết vặt.
 */
function readNameTable(view: DataView, rec: TableRec): Map<number, string> {
  const out = new Map<number, string>();
  const base = rec.offset;
  if (base + 6 > view.byteLength) return out;

  const count = view.getUint16(base + 2, false);
  const stringOffset = base + view.getUint16(base + 4, false);
  // Điểm ưu tiên: bản ghi Windows thắng bản ghi Mac cho cùng một nameID.
  const score = new Map<number, number>();

  for (let i = 0; i < count; i++) {
    const r = base + 6 + i * 12;
    if (r + 12 > view.byteLength) break;
    const platformId = view.getUint16(r, false);
    const nameId = view.getUint16(r + 6, false);
    const length = view.getUint16(r + 8, false);
    const offset = stringOffset + view.getUint16(r + 10, false);
    if (offset + length > view.byteLength) continue;

    const prio = platformId === 3 ? 2 : platformId === 1 ? 1 : 0;
    if (prio === 0 || prio <= (score.get(nameId) ?? 0)) continue;

    let s = '';
    if (platformId === 3) {
      for (let k = 0; k + 1 < length; k += 2) s += String.fromCharCode(view.getUint16(offset + k, false));
    } else {
      for (let k = 0; k < length; k++) s += String.fromCharCode(view.getUint8(offset + k));
    }
    out.set(nameId, s);
    score.set(nameId, prio);
  }
  return out;
}

/** Rút toàn bộ metadata cần cho EOT từ buffer font thô. */
export function readSfntMeta(buf: ArrayBuffer): SfntMeta {
  const view = new DataView(buf);
  const tables = readTableDirectory(view);

  const nameRec = tables.get('name');
  const names = nameRec ? readNameTable(view, nameRec) : new Map<number, string>();
  const familyName = names.get(1) ?? '';
  if (!familyName) throw new FontEmbedError('Font thiếu tên họ (bảng "name") — không nhúng được.');

  // ---- OS/2: weight, fsType, PANOSE, dải Unicode/CodePage ----
  let weight = 400;
  let fsType = 0;
  let panose = new Uint8Array(10);
  let unicodeRange: [number, number, number, number] = [0, 0, 0, 0];
  let codePageRange: [number, number] = [0, 0];
  let italic = false;

  const os2 = tables.get('OS/2');
  if (os2 && os2.offset + 78 <= view.byteLength) {
    const o = os2.offset;
    const version = view.getUint16(o, false);
    weight = view.getUint16(o + 4, false);
    fsType = view.getUint16(o + 8, false);
    panose = new Uint8Array(buf.slice(o + 32, o + 42));
    unicodeRange = [
      view.getUint32(o + 42, false),
      view.getUint32(o + 46, false),
      view.getUint32(o + 50, false),
      view.getUint32(o + 54, false),
    ];
    // fsSelection bit 0 = italic.
    italic = (view.getUint16(o + 62, false) & 0x0001) !== 0;
    // ulCodePageRange chỉ có từ OS/2 version 1 trở lên.
    if (version >= 1 && o + 86 <= view.byteLength) {
      codePageRange = [view.getUint32(o + 78, false), view.getUint32(o + 82, false)];
    }
  }

  // ---- head: checkSumAdjustment + macStyle (nguồn italic dự phòng) ----
  let checkSumAdjustment = 0;
  const head = tables.get('head');
  if (head && head.offset + 54 <= view.byteLength) {
    checkSumAdjustment = view.getUint32(head.offset + 8, false);
    if (!os2) italic = (view.getUint16(head.offset + 44, false) & 0x0002) !== 0;
  }

  return {
    familyName,
    styleName: names.get(2) ?? 'Regular',
    fullName: names.get(4) ?? familyName,
    versionName: names.get(5) ?? '',
    weight,
    italic,
    fsType,
    panose,
    unicodeRange,
    codePageRange,
    checkSumAdjustment,
  };
}

/* ------------------------------------------------------------------ */
/* Giấy phép nhúng — cờ fsType (OS/2)                                  */
/* ------------------------------------------------------------------ */

export type EmbedPermission = 'installable' | 'editable' | 'preview-print' | 'restricted';

export interface LicenseVerdict {
  permission: EmbedPermission;
  /** Có được phép nhúng vào file đem phát cho người khác không. */
  allowed: boolean;
  /** Câu tiếng Việt giải thích, dùng thẳng cho UI. */
  reason: string;
}

/**
 * Đọc cờ `fsType` để quyết định có được nhúng font hay không.
 *
 * fsType là BITFIELD (OpenType spec, bảng OS/2). 4 bit thấp quy định mức cho phép:
 *   0x0000 — Installable: nhúng thoải mái.
 *   0x0002 — Restricted License: CẤM nhúng. Ta chặn.
 *   0x0004 — Preview & Print: được nhúng để xem/in, người nhận không được sửa chữ bằng font đó.
 *   0x0008 — Editable: được nhúng và người nhận sửa được.
 * (Bit 0x0100 = cấm subset, 0x0200 = chỉ nhúng bitmap — ta không subset nên không vướng.)
 *
 * Đây là ràng buộc do CHÍNH nhà làm font đặt trong file. PowerPoint bản gốc cũng từ chối font
 * Restricted. Ta làm đúng như vậy thay vì lặng lẽ nhúng bừa.
 */
export function checkEmbeddingLicense(fsType: number): LicenseVerdict {
  if (fsType & 0x0002) {
    return {
      permission: 'restricted',
      allowed: false,
      reason: 'nhà phát hành font cấm nhúng (Restricted License)',
    };
  }
  if (fsType & 0x0008) {
    return { permission: 'editable', allowed: true, reason: 'cho phép nhúng và chỉnh sửa' };
  }
  if (fsType & 0x0004) {
    return {
      permission: 'preview-print',
      allowed: true,
      reason: 'cho phép nhúng để xem và in (người nhận không nên sửa chữ)',
    };
  }
  return { permission: 'installable', allowed: true, reason: 'cho phép nhúng tự do' };
}

/* ------------------------------------------------------------------ */
/* Dựng EOT (version 1, không nén — non-MTX)                           */
/* ------------------------------------------------------------------ */

const EOT_VERSION_1 = 0x00010000;
const EOT_MAGIC = 0x504c;
/** DEFAULT_CHARSET của Windows. */
const DEFAULT_CHARSET = 0x01;

/** Bộ ghi byte little-endian tự nới — header EOT dài không cố định (có 4 chuỗi tên). */
class LeWriter {
  private buf = new Uint8Array(1024);
  private len = 0;

  private need(n: number) {
    if (this.len + n <= this.buf.length) return;
    let cap = this.buf.length * 2;
    while (cap < this.len + n) cap *= 2;
    const next = new Uint8Array(cap);
    next.set(this.buf.subarray(0, this.len));
    this.buf = next;
  }

  u8(v: number) { this.need(1); this.buf[this.len++] = v & 0xff; }
  u16(v: number) { this.need(2); this.buf[this.len++] = v & 0xff; this.buf[this.len++] = (v >>> 8) & 0xff; }
  u32(v: number) {
    this.need(4);
    this.buf[this.len++] = v & 0xff;
    this.buf[this.len++] = (v >>> 8) & 0xff;
    this.buf[this.len++] = (v >>> 16) & 0xff;
    this.buf[this.len++] = (v >>> 24) & 0xff;
  }
  bytes(b: Uint8Array) { this.need(b.length); this.buf.set(b, this.len); this.len += b.length; }

  /** Chuỗi tên trong EOT: [u16 số byte][UTF-16LE][u16 padding 0]. */
  nameField(s: string) {
    this.u16(s.length * 2);
    for (let i = 0; i < s.length; i++) this.u16(s.charCodeAt(i));
    this.u16(0);
  }

  result(): Uint8Array { return this.buf.subarray(0, this.len); }
  get length(): number { return this.len; }
}

/**
 * Bọc dữ liệu font sfnt thô thành EOT version 1 không nén.
 *
 * Bố cục header theo W3C EOT Submission — mọi trường little-endian, riêng khối FontData phía sau
 * giữ nguyên big-endian vì đó chính là file sfnt gốc không đụng tới.
 *
 * `EOTSize` phải là tổng KÍCH THƯỚC CUỐI (header + dữ liệu), mà độ dài header lại phụ thuộc độ
 * dài 4 chuỗi tên ⇒ dựng header trước, biết độ dài rồi mới vá `EOTSize` vào 4 byte đầu.
 */
export function buildEot(fontData: ArrayBuffer, meta: SfntMeta): Uint8Array {
  const w = new LeWriter();

  w.u32(0);                    // EOTSize — vá lại ở cuối
  w.u32(fontData.byteLength);  // FontDataSize
  w.u32(EOT_VERSION_1);        // Version
  w.u32(0);                    // Flags = 0 ⇒ không nén, không phải MTX

  const panose = new Uint8Array(10);
  panose.set(meta.panose.subarray(0, 10));
  w.bytes(panose);             // FontPANOSE (10 byte)

  w.u8(DEFAULT_CHARSET);       // Charset
  w.u8(meta.italic ? 0x01 : 0x00); // Italic
  w.u32(meta.weight);          // Weight
  w.u16(meta.fsType);          // fsType — giữ nguyên cờ giấy phép của font
  w.u16(EOT_MAGIC);            // MagicNumber

  w.u32(meta.unicodeRange[0]);
  w.u32(meta.unicodeRange[1]);
  w.u32(meta.unicodeRange[2]);
  w.u32(meta.unicodeRange[3]);
  w.u32(meta.codePageRange[0]);
  w.u32(meta.codePageRange[1]);
  w.u32(meta.checkSumAdjustment);

  w.u32(0); w.u32(0); w.u32(0); w.u32(0); // Reserved1..4

  w.u16(0); w.nameField(meta.familyName);
  w.u16(0); w.nameField(meta.styleName);
  w.u16(0); w.nameField(meta.versionName);
  w.u16(0); w.nameField(meta.fullName);

  const header = w.result();
  const out = new Uint8Array(header.length + fontData.byteLength);
  out.set(header, 0);
  out.set(new Uint8Array(fontData), header.length);

  // Vá EOTSize (little-endian) vào 4 byte đầu.
  const total = out.length;
  out[0] = total & 0xff;
  out[1] = (total >>> 8) & 0xff;
  out[2] = (total >>> 16) & 0xff;
  out[3] = (total >>> 24) & 0xff;

  return out;
}

/* ------------------------------------------------------------------ */
/* Đầu vào tiện dụng: data URL → EOT                                   */
/* ------------------------------------------------------------------ */

/** Giải data URL base64 (`data:font/ttf;base64,...`) thành ArrayBuffer. */
export function dataUrlToArrayBuffer(dataUrl: string): ArrayBuffer {
  const comma = dataUrl.indexOf(',');
  if (comma < 0) throw new FontEmbedError('Dữ liệu font không hợp lệ.');
  const b64 = dataUrl.slice(comma + 1);
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out.buffer;
}

/** Kết quả chuẩn bị một font để nhúng. */
export interface PreparedFont {
  /** Tên face ghi vào `<p:embeddedFont>` — PHẢI khớp `fontFace` dùng trong slide XML. */
  typeface: string;
  eot: Uint8Array;
  license: LicenseVerdict;
  meta: SfntMeta;
}

/**
 * Chuẩn bị một font (từ data URL) để nhúng: đọc metadata → kiểm tra giấy phép → bọc EOT.
 * Ném `FontEmbedError` với câu tiếng Việt nếu không nhúng được (định dạng sai / giấy phép cấm).
 *
 * `typeface` LUÔN là tên họ THẬT đọc từ bảng `name` của font — KHÔNG phải bí danh của app.
 *
 * Vì sao quan trọng: app đặt bí danh riêng cho mỗi font tải lên (vd `Georgia-0eht`) để đăng ký
 * `@font-face` trong trình duyệt không đụng nhau. Nhưng PowerPoint ghép font nhúng với chữ bằng
 * TÊN HỌ nằm trong chính file font. Ghi bí danh vào `<p:embeddedFont>` thì PowerPoint tìm
 * "Georgia-0eht" trong file font, thấy nó tự xưng "Georgia", không khớp ⇒ font nhúng vô dụng.
 * Nên tên họ thật phải là nguồn sự thật ở cả `<p:embeddedFont>` lẫn `fontFace` của từng đoạn chữ.
 */
export function prepareFontForEmbed(dataUrl: string): PreparedFont {
  const buf = dataUrlToArrayBuffer(dataUrl);
  const meta = readSfntMeta(buf);
  const license = checkEmbeddingLicense(meta.fsType);
  if (!license.allowed) {
    throw new FontEmbedError(`Không nhúng được font “${meta.familyName}”: ${license.reason}.`);
  }
  return { typeface: meta.familyName, eot: buildEot(buf, meta), license, meta };
}

/**
 * Đọc nhanh tên họ thật của font từ data URL, để đổi bí danh app → tên PowerPoint hiểu được
 * TRƯỚC khi dựng slide. Font hỏng/không đọc được → `null` (lúc nhúng sẽ báo lỗi cụ thể).
 */
export function realFamilyName(dataUrl: string): string | null {
  try {
    return readSfntMeta(dataUrlToArrayBuffer(dataUrl)).familyName;
  } catch {
    return null;
  }
}
