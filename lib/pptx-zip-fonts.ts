'use client';

/**
 * lib/pptx-zip-fonts.ts — CHÈN FONT NHÚNG VÀO FILE .PPTX ĐÃ DỰNG XONG.
 *
 * pptxgenjs không có API nhúng font (xem đầu `lib/pptx-font-embed.ts`), nên ta để nó xuất bình
 * thường rồi HẬU XỬ LÝ file ZIP. Bốn mảnh phải khớp nhau, thiếu một là PowerPoint báo file hỏng:
 *
 *   1. `/ppt/fonts/font{N}.fntdata`        — dữ liệu font dạng EOT.
 *   2. `[Content_Types].xml`               — khai báo đuôi `fntdata`. THIẾU MẢNH NÀY LÀ LỖI HAY GẶP
 *                                            NHẤT: PowerPoint coi file hỏng và đòi "repair"
 *                                            (đúng lỗi pandoc #11492).
 *   3. `ppt/_rels/presentation.xml.rels`   — quan hệ trỏ tới file font.
 *   4. `ppt/presentation.xml`              — `<p:embeddedFontLst>` khai tên face ↔ r:id.
 *
 * Dùng jszip — vốn đã nằm sẵn trong cây phụ thuộc (pptxgenjs dùng nội bộ), không thêm gói mới.
 *
 * VÌ SAO VÁ XML BẰNG CHUỖI CHỨ KHÔNG PARSE DOM: các mảnh chèn vào là hằng số do chính ta sinh
 * ra, vị trí chèn xác định (ngay sau `<p:notesSz/>`), và XML nguồn do pptxgenjs sinh ổn định.
 * Kéo DOMParser/XMLSerializer vào chỉ để chèn 4 chuỗi là đổi rủi ro này lấy rủi ro khác
 * (serializer viết lại namespace/self-closing tag khác đi). Mọi chỗ vá đều có kiểm tra "đã có
 * chưa" và ném lỗi rõ ràng nếu không tìm thấy mốc, thay vì lặng lẽ cho ra file hỏng.
 */

import { prepareFontForEmbed, FontEmbedError, type LicenseVerdict } from './pptx-font-embed';

/** Một font ứng viên để nhúng. */
export interface EmbedFontInput {
  /** Bí danh app đặt cho font (`EmbeddedFont.face`) — chỉ để đối chiếu, KHÔNG ghi vào XML. */
  face: string;
  /** data URL của file font (.ttf/.otf). */
  dataUrl: string;
}

export interface EmbedFontsResult {
  /** Tên face đã nhúng được thật. */
  embedded: string[];
  /** Font bị bỏ qua kèm lý do đọc được (định dạng không hỗ trợ / giấy phép cấm). */
  skipped: Array<{ face: string; reason: string }>;
  /** Ghi chú giấy phép cho từng font đã nhúng (vd font chỉ cho "xem & in"). */
  licenses: Array<{ face: string; license: LicenseVerdict }>;
}

const CT_PATH = '[Content_Types].xml';
const RELS_PATH = 'ppt/_rels/presentation.xml.rels';
const PRES_PATH = 'ppt/presentation.xml';

const FONT_REL_TYPE = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/font';
const FNTDATA_CONTENT_TYPE = 'application/x-fontdata';

/** Thoát ký tự cho giá trị thuộc tính XML (tên font có thể chứa & hoặc dấu nháy). */
function escapeAttr(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Tìm số rId lớn nhất đang dùng để cấp id mới không đụng hàng. */
function nextRelId(relsXml: string): number {
  let max = 0;
  for (const m of relsXml.matchAll(/Id="rId(\d+)"/g)) {
    const n = Number(m[1]);
    if (n > max) max = n;
  }
  return max + 1;
}

/**
 * Nhúng font vào buffer .pptx và trả về Blob mới.
 *
 * Font nào lỗi (sai định dạng, giấy phép cấm) thì BỎ QUA font đó và ghi vào `skipped` — không
 * làm hỏng cả lần xuất. Người dùng vẫn nhận được file .pptx dùng được, kèm lời giải thích.
 */
export async function injectEmbeddedFonts(
  pptxData: ArrayBuffer,
  fonts: EmbedFontInput[],
): Promise<{ blob: Blob; result: EmbedFontsResult }> {
  const result: EmbedFontsResult = { embedded: [], skipped: [], licenses: [] };
  const blobType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';

  if (!fonts.length) {
    return { blob: new Blob([pptxData], { type: blobType }), result };
  }

  const JSZip = (await import('jszip')).default;
  const zip = await JSZip.loadAsync(pptxData);

  // ---- 1. Chuẩn bị (đọc metadata + kiểm giấy phép + bọc EOT) rồi ghi file font ----
  const prepared: Array<{ typeface: string; relId: string; index: number }> = [];

  let relsXml = await zip.file(RELS_PATH)?.async('string') ?? '';
  if (!relsXml) throw new Error('File PPTX thiếu presentation.xml.rels — không nhúng font được.');
  let relIdSeq = nextRelId(relsXml);

  let fontIndex = 0;
  for (const f of fonts) {
    try {
      const p = prepareFontForEmbed(f.dataUrl);
      fontIndex += 1;
      zip.file(`ppt/fonts/font${fontIndex}.fntdata`, p.eot);
      prepared.push({ typeface: p.typeface, relId: `rId${relIdSeq}`, index: fontIndex });
      relIdSeq += 1;
      result.embedded.push(p.typeface);
      result.licenses.push({ face: p.typeface, license: p.license });
    } catch (err) {
      result.skipped.push({
        face: f.face,
        reason: err instanceof FontEmbedError ? err.message : `lỗi đọc font (${String(err)})`,
      });
    }
  }

  if (!prepared.length) {
    // Không font nào nhúng được — trả file gốc, giữ nguyên lý do trong `skipped`.
    return { blob: new Blob([pptxData], { type: blobType }), result };
  }

  // ---- 2. [Content_Types].xml: khai báo đuôi fntdata ----
  const ctXml = await zip.file(CT_PATH)?.async('string');
  if (!ctXml) throw new Error('File PPTX thiếu [Content_Types].xml.');
  if (!ctXml.includes('Extension="fntdata"')) {
    const patched = ctXml.replace(
      /<Types([^>]*)>/,
      `<Types$1><Default Extension="fntdata" ContentType="${FNTDATA_CONTENT_TYPE}"/>`,
    );
    if (patched === ctXml) throw new Error('Không vá được [Content_Types].xml (không thấy thẻ <Types>).');
    zip.file(CT_PATH, patched);
  }

  // ---- 3. presentation.xml.rels: quan hệ tới từng file font ----
  const newRels = prepared
    .map(
      (p) =>
        `<Relationship Id="${p.relId}" Type="${FONT_REL_TYPE}" Target="fonts/font${p.index}.fntdata"/>`,
    )
    .join('');
  const relsPatched = relsXml.replace(/<\/Relationships>\s*$/, `${newRels}</Relationships>`);
  if (relsPatched === relsXml) throw new Error('Không vá được presentation.xml.rels.');
  zip.file(RELS_PATH, relsPatched);

  // ---- 4. presentation.xml: <p:embeddedFontLst> ----
  // Thứ tự con của <p:presentation> theo ECMA-376 là BẮT BUỘC:
  //   sldMasterIdLst → notesMasterIdLst → handoutMasterIdLst → sldIdLst → sldSz → notesSz
  //   → smartTags → embeddedFontLst → custShowLst → … → defaultTextStyle
  // Đặt sai vị trí là PowerPoint từ chối mở. pptxgenjs sinh <p:notesSz/> ngay trước
  // <p:defaultTextStyle>, nên chèn NGAY SAU notesSz là đúng khe.
  const presXml = await zip.file(PRES_PATH)?.async('string');
  if (!presXml) throw new Error('File PPTX thiếu presentation.xml.');

  const lst =
    '<p:embeddedFontLst>' +
    prepared
      .map(
        (p) =>
          `<p:embeddedFont><p:font typeface="${escapeAttr(p.typeface)}" pitchFamily="34" charset="0"/>` +
          `<p:regular r:id="${p.relId}"/></p:embeddedFont>`,
      )
      .join('') +
    '</p:embeddedFontLst>';

  const presPatched = presXml.replace(/(<p:notesSz[^>]*\/>)/, `$1${lst}`);
  if (presPatched === presXml) {
    throw new Error('Không vá được presentation.xml (không thấy <p:notesSz/> để chèn embeddedFontLst).');
  }
  zip.file(PRES_PATH, presPatched);

  const blob = await zip.generateAsync({
    type: 'blob',
    mimeType: blobType,
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  return { blob, result };
}
