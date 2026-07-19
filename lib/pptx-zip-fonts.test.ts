/**
 * lib/pptx-zip-fonts.test.ts — kiểm THẬT việc chèn font vào file .pptx. Chạy:
 *   node_modules/.bin/sucrase-node lib/pptx-zip-fonts.test.ts
 *
 * Đây là test TÍCH HỢP, không mock: dựng pptx bằng chính pptxgenjs mà app dùng, chèn font thật
 * của macOS, rồi MỞ LẠI file ZIP kết quả để soi từng mảnh. Nhúng font là loại việc mà "code chạy
 * không lỗi" chẳng chứng minh được gì — PowerPoint chỉ cần thiếu một khai báo là báo file hỏng.
 *
 * File .pptx sinh ra được ghi ra đĩa để soi tay bằng `unzip -l`.
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import PptxGen from 'pptxgenjs';
import JSZip from 'jszip';
import { injectEmbeddedFonts } from './pptx-zip-fonts';

let pass = 0;
let fail = 0;
const ok = (label: string, cond: boolean) => {
  if (cond) {
    pass += 1;
    console.log(`  ok  - ${label}`);
  } else {
    fail += 1;
    console.log(`  FAIL - ${label}`);
  }
};

const FONT = '/System/Library/Fonts/Supplemental/Georgia.ttf';

async function buildBasePptx(fontFace: string): Promise<ArrayBuffer> {
  const pptx = new PptxGen();
  pptx.defineLayout({ name: 'IF_16x9', width: 13.333, height: 7.5 });
  pptx.layout = 'IF_16x9';
  const s = pptx.addSlide();
  s.background = { color: 'F5F1EA' };
  s.addText('Tiêu đề tiếng Việt đủ dấu', {
    x: 0.85, y: 1.4, w: 10, h: 1.8, fontFace, fontSize: 44, bold: true, color: '221F1A',
  });
  return (await pptx.write({ outputType: 'arraybuffer' })) as ArrayBuffer;
}

async function toZip(blob: Blob): Promise<JSZip> {
  return JSZip.loadAsync(await blob.arrayBuffer());
}

(async () => {
  if (!existsSync(FONT)) {
    console.log(`SKIP — không thấy ${FONT} (không phải macOS?)`);
    process.exit(0);
  }
  const dataUrl = 'data:font/ttf;base64,' + readFileSync(FONT).toString('base64');

  console.log('[1] Nhúng font vào .pptx — soi lại từng mảnh trong ZIP');
  {
    const base = await buildBasePptx('Georgia');
    const { blob, result } = await injectEmbeddedFonts(base, [{ face: 'Georgia', dataUrl }]);

    ok('báo đã nhúng đúng 1 font', result.embedded.length === 1 && result.embedded[0] === 'Georgia');
    ok('không có font nào bị bỏ', result.skipped.length === 0);
    ok('ghi nhận mức giấy phép', result.licenses[0]?.license.permission === 'editable');

    const zip = await toZip(blob);

    // --- mảnh 1: file font ---
    const fnt = zip.file('ppt/fonts/font1.fntdata');
    ok('CÓ ppt/fonts/font1.fntdata', Boolean(fnt));
    const fntBytes = await fnt!.async('uint8array');
    ok('fntdata không rỗng', fntBytes.length > 1000);
    // MagicNumber EOT 0x504C ở offset 34 (little-endian) — dấu hiệu đây là EOT thật.
    ok('fntdata là EOT (magic 0x504C)', (fntBytes[34] | (fntBytes[35] << 8)) === 0x504c);

    // --- mảnh 2: content types ---
    const ct = await zip.file('[Content_Types].xml')!.async('string');
    ok(
      'Content_Types khai báo đuôi fntdata',
      ct.includes('Extension="fntdata"') && ct.includes('application/x-fontdata'),
    );

    // --- mảnh 3: relationship ---
    const rels = await zip.file('ppt/_rels/presentation.xml.rels')!.async('string');
    ok('rels có quan hệ kiểu /font', rels.includes('/relationships/font'));
    ok('rels trỏ đúng file font', rels.includes('Target="fonts/font1.fntdata"'));

    // --- mảnh 4: presentation.xml ---
    const pres = await zip.file('ppt/presentation.xml')!.async('string');
    ok('presentation.xml có <p:embeddedFontLst>', pres.includes('<p:embeddedFontLst>'));
    ok('khai đúng tên face', pres.includes('typeface="Georgia"'));
    ok('có <p:regular r:id=...>', /<p:regular r:id="rId\d+"\/>/.test(pres));

    // Thứ tự con của <p:presentation> là BẮT BUỘC theo ECMA-376: embeddedFontLst phải nằm
    // SAU notesSz và TRƯỚC defaultTextStyle. Sai khe ⇒ PowerPoint từ chối mở.
    const iNotes = pres.indexOf('<p:notesSz');
    const iFont = pres.indexOf('<p:embeddedFontLst>');
    const iDefault = pres.indexOf('<p:defaultTextStyle>');
    ok('embeddedFontLst nằm SAU notesSz', iNotes >= 0 && iFont > iNotes);
    ok('embeddedFontLst nằm TRƯỚC defaultTextStyle', iDefault > iFont);

    // r:id trong presentation.xml phải TỒN TẠI trong rels — id treo là lỗi "repair" kinh điển.
    const rid = pres.match(/<p:regular r:id="(rId\d+)"\/>/)?.[1];
    ok('r:id khớp một Relationship có thật', Boolean(rid) && rels.includes(`Id="${rid}"`));

    const outPath = join(tmpdir(), 'if-pptx-font-embed-test.pptx');
    writeFileSync(outPath, Buffer.from(await blob.arrayBuffer()));
    console.log(`  → file để soi tay: ${outPath}`);
  }

  console.log('[2] Không có font cần nhúng → file đi đường cũ, KHÔNG đụng ZIP');
  {
    const base = await buildBasePptx('Arial');
    const { blob, result } = await injectEmbeddedFonts(base, []);
    ok('không nhúng gì', result.embedded.length === 0 && result.skipped.length === 0);
    ok('kích thước giữ nguyên byte-for-byte', blob.size === base.byteLength);
    const zip = await toZip(blob);
    ok('không sinh thư mục ppt/fonts', zip.file(/^ppt\/fonts\//).length === 0);
    const ct = await zip.file('[Content_Types].xml')!.async('string');
    ok('Content_Types không bị thêm fntdata', !ct.includes('fntdata'));
  }

  console.log('[3] Font hỏng/không hỗ trợ → bỏ qua font đó, file vẫn xuất được');
  {
    const base = await buildBasePptx('Georgia');
    const woff = 'data:font/woff;base64,' + Buffer.from('wOFFrácrácrác').toString('base64');
    const { blob, result } = await injectEmbeddedFonts(base, [
      { face: 'Georgia', dataUrl },
      { face: 'Hỏng', dataUrl: woff },
    ]);
    ok('font tốt vẫn nhúng được', result.embedded.includes('Georgia'));
    ok('font hỏng bị bỏ kèm lý do', result.skipped.length === 1 && result.skipped[0].face === 'Hỏng');
    ok('lý do đọc được, nhắc WOFF', result.skipped[0].reason.includes('WOFF'));
    const zip = await toZip(blob);
    ok('chỉ chèn 1 file font', zip.file(/^ppt\/fonts\//).length === 1);
    ok('file .pptx vẫn hợp lệ (mở lại được)', Boolean(zip.file('ppt/presentation.xml')));
  }

  console.log('[4] Nhiều font — đánh số và cấp r:id không đụng nhau');
  {
    const base = await buildBasePptx('Georgia');
    const verdana =
      'data:font/ttf;base64,' +
      readFileSync('/System/Library/Fonts/Supplemental/Verdana.ttf').toString('base64');
    const { blob, result } = await injectEmbeddedFonts(base, [
      { face: 'Georgia', dataUrl },
      { face: 'Verdana', dataUrl: verdana },
    ]);
    ok('nhúng cả 2 font', result.embedded.length === 2);
    const zip = await toZip(blob);
    ok('có font1 + font2', Boolean(zip.file('ppt/fonts/font1.fntdata')) && Boolean(zip.file('ppt/fonts/font2.fntdata')));

    const pres = await zip.file('ppt/presentation.xml')!.async('string');
    const rels = await zip.file('ppt/_rels/presentation.xml.rels')!.async('string');
    const ids = [...pres.matchAll(/<p:regular r:id="(rId\d+)"\/>/g)].map((m) => m[1]);
    ok('2 r:id KHÁC nhau', ids.length === 2 && ids[0] !== ids[1]);
    ok('cả 2 r:id đều có Relationship thật', ids.every((id) => rels.includes(`Id="${id}"`)));

    // Không được cướp r:id mà pptxgenjs đã cấp cho slide/master.
    const dupes = [...rels.matchAll(/Id="(rId\d+)"/g)].map((m) => m[1]);
    ok('không có Id trùng trong rels', new Set(dupes).size === dupes.length);
  }

  console.log(`\n${fail === 0 ? 'PASS' : 'FAIL'} — ${pass} ok, ${fail} fail`);
  process.exit(fail === 0 ? 0 : 1);
})();
