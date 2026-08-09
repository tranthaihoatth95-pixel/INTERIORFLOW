/**
 * lib/present-editor/pptx-import.test.ts — kiểm việc ĐỌC `.pptx` thành slide IF. Chạy:
 *   node_modules/.bin/sucrase-node lib/present-editor/pptx-import.test.ts
 * (cùng lệnh mà `npm test` dùng cho mọi *.test.ts — xem package.json "test").
 *
 * Cách kiểm mạnh nhất cho việc này là **VÒNG TRÒN THẬT**: dựng file .pptx bằng CHÍNH `pptxgenjs`
 * mà app dùng để xuất (`lib/pptx.ts`), rồi đọc ngược lại bằng `importPptx` và soi từng con số.
 * Không mock cấu trúc XML — mock thì chỉ chứng minh ta hiểu đúng cái ta tự bịa ra.
 *
 * Thêm hai lớp nữa: (a) unit test bộ đọc XML tối giản + phép quy đổi EMU; (b) file có slide XML
 * HỎNG — phải bỏ đúng slide đó và giữ các slide còn lại (yêu cầu cứng của phiếu).
 */
import PptxGen from 'pptxgenjs';
import JSZip from 'jszip';
import {
  importPptx,
  importSummary,
  parseXml,
  attr,
  kid,
  kids,
  descend,
  decodeXmlEntities,
  emuToPct,
  szToFontSizePct,
  resolveZipPath,
  parseRelsXml,
  slideSizeFromPresentation,
  buildSlideFromXml,
  collectPlaceholderFrames,
  EMU_PER_POINT,
  DEFAULT_SLIDE_CX,
  DEFAULT_SLIDE_CY,
} from './pptx-import';
import type { ImageElement, TextElement } from './model';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) {
    pass += 1;
    console.log(`  ok  - ${label}`);
  } else {
    fail += 1;
    console.log(`  FAIL - ${label}`);
  }
}
/** so sánh số thực với sai số cho phép (quy đổi EMU luôn có làm tròn). */
const near = (a: number, b: number, eps = 0.15) => Math.abs(a - b) <= eps;

// ảnh PNG 1×1 hợp lệ (dùng cho pptxgenjs addImage + đối chiếu dataURL sau khi đọc lại)
const PNG_1x1 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

const XML_HEADER = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';

(async () => {
  console.log('[1] Bộ đọc XML tối giản');
  {
    const r = parseXml(
      `${XML_HEADER}<!-- chú thích --><p:root xmlns:p="x"><a:b id="1" r:embed="rId7">chữ &amp; dấu</a:b><a:c/><a:d>a<a:e>b</a:e>c</a:d></p:root>`,
    );
    const root = kid(r, 'root');
    ok('bỏ khai báo <?xml?> và chú thích, ra đúng 1 nút gốc', !!root && r.children.length === 1);
    const b = kid(root, 'b');
    ok('tên cục bộ bỏ tiền tố namespace', b?.name === 'b' && b?.qname === 'a:b');
    ok('đọc thuộc tính thường', attr(b, 'id') === '1');
    ok('attr() bắt được thuộc tính có tiền tố (r:embed)', attr(b, 'embed') === 'rId7');
    ok('giải mã thực thể trong chữ', b?.text === 'chữ & dấu');
    ok('thẻ tự đóng không nuốt nút sau nó', kids(root, 'c').length === 1 && kids(root, 'd').length === 1);
    ok('descend() tìm được con cháu sâu', descend(root, 'e')?.text === 'b');
    ok('decodeXmlEntities xử lý dạng số', decodeXmlEntities('A&#66;C&#x44;') === 'ABCD');
  }
  {
    // dấu '>' nằm TRONG giá trị thuộc tính từng làm vỡ mọi parser viết bằng indexOf('>')
    const r = parseXml('<a t="1 > 0"><b/></a>');
    ok('dấu > trong giá trị thuộc tính không cắt nhầm thẻ', attr(kid(r, 'a'), 't') === '1 > 0');
    ok('… và cây con vẫn đúng', kids(kid(r, 'a'), 'b').length === 1);
  }
  {
    let threw = false;
    try {
      parseXml('<a><b attr="x"');
    } catch {
      threw = true;
    }
    ok('thẻ cắt cụt → ném lỗi (để lớp trên bắt và bỏ đúng slide)', threw);
  }

  console.log('[2] Quy đổi đơn vị EMU → % sân khấu');
  {
    ok('nửa bề rộng = 50%', near(emuToPct(DEFAULT_SLIDE_CX / 2, DEFAULT_SLIDE_CX), 50, 0.001));
    ok('tổng <= 0 → 0, không NaN', emuToPct(100, 0) === 0);
    // slide 16:9 chuẩn cao 6.858.000 EMU = 540pt ⇒ chữ 18pt = 3,333% chiều cao
    ok('18pt trên khổ 16:9 = 3,33% chiều cao', near(szToFontSizePct(1800, DEFAULT_SLIDE_CY), 3.333, 0.01));
    ok('540pt = đúng chiều cao slide 16:9', DEFAULT_SLIDE_CY / EMU_PER_POINT === 540);
    ok('sz = 0 → 0 (caller tự dùng mặc định)', szToFontSizePct(0, DEFAULT_SLIDE_CY) === 0);
  }

  console.log('[3] Đường dẫn trong ZIP + bảng quan hệ');
  {
    ok('.. lùi thư mục', resolveZipPath('ppt/slides', '../media/image1.png') === 'ppt/media/image1.png');
    ok('đường dẫn tuyệt đối bỏ dấu / đầu', resolveZipPath('ppt/slides', '/ppt/media/a.png') === 'ppt/media/a.png');
    ok('đường dẫn thường nối vào baseDir', resolveZipPath('ppt', 'slides/slide1.xml') === 'ppt/slides/slide1.xml');
    const rels = parseRelsXml(
      `${XML_HEADER}<Relationships xmlns="x">
         <Relationship Id="rId1" Type="../image" Target="../media/img.png"/>
         <Relationship Id="rId9" Type="../hyperlink" Target="https://ngoai.vn" TargetMode="External"/>
       </Relationships>`,
      'ppt/slides',
    );
    ok('đọc quan hệ nội bộ', rels.get('rId1') === 'ppt/media/img.png');
    ok('bỏ quan hệ External (không có trong zip)', !rels.has('rId9'));
    ok('rels hỏng → map rỗng, không ném', parseRelsXml('<Relationships', 'ppt').size === 0);
  }

  console.log('[4] Dựng slide từ XML viết tay (hàm thuần, không zip)');
  {
    const slideXml = `${XML_HEADER}
      <p:sld xmlns:p="p" xmlns:a="a" xmlns:r="r">
        <p:cSld>
          <p:bg><p:bgPr><a:solidFill><a:srgbClr val="102030"/></a:solidFill></p:bgPr></p:bg>
          <p:spTree>
            <p:sp>
              <p:nvSpPr><p:cNvPr id="2" name="Tiêu đề 1"/><p:nvPr><p:ph type="title"/></p:nvPr></p:nvSpPr>
              <p:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="6096000" cy="3429000"/></a:xfrm></p:spPr>
              <p:txBody><a:p><a:pPr algn="ctr"/><a:r>
                <a:rPr sz="3600" b="1" i="1" u="sng"><a:solidFill><a:srgbClr val="AABBCC"/></a:solidFill></a:rPr>
                <a:t>Xin chào</a:t></a:r></a:p>
                <a:p><a:r><a:rPr sz="1200"/><a:t>dòng hai</a:t></a:r></a:p>
              </p:txBody>
            </p:sp>
            <p:sp>
              <p:nvSpPr><p:cNvPr id="3" name="Rỗng"/><p:nvPr><p:ph type="body" idx="1"/></p:nvPr></p:nvSpPr>
              <p:spPr/>
              <p:txBody><a:p><a:r><a:rPr/><a:t>   </a:t></a:r></a:p></p:txBody>
            </p:sp>
            <p:pic>
              <p:nvPicPr><p:cNvPr id="4" name="Ảnh nền"/></p:nvPicPr>
              <p:blipFill><a:blip r:embed="rId5"/></p:blipFill>
              <p:spPr><a:xfrm rot="5400000"><a:off x="6096000" y="3429000"/><a:ext cx="6096000" cy="3429000"/></a:xfrm></p:spPr>
            </p:pic>
            <p:graphicFrame><p:xfrm/><a:graphic/></p:graphicFrame>
          </p:spTree>
        </p:cSld>
      </p:sld>`;
    const built = buildSlideFromXml(parseXml(slideXml), {
      cx: DEFAULT_SLIDE_CX,
      cy: DEFAULT_SLIDE_CY,
      media: new Map([['rId5', PNG_1x1]]),
    });
    const els = built.slide.elements;
    ok('hộp chữ TRỐNG bị bỏ (không đẻ element rác)', els.length === 2);
    const t = els[0] as TextElement;
    ok('gộp nhiều đoạn thành nhiều dòng', t.kind === 'text' && t.text === 'Xin chào\ndòng hai');
    ok('vị trí: góc trên trái = 0%,0%', near(t.frame.x, 0) && near(t.frame.y, 0));
    ok('kích thước: nửa khổ = 50%×50%', near(t.frame.w, 50) && near(t.frame.h, 50));
    ok('cỡ chữ 36pt = 6,67% chiều cao', near(t.fontSize, 6.667, 0.01));
    ok('đậm/nghiêng/gạch chân theo run đầu', t.bold && t.italic && t.underline === true);
    ok('màu srgbClr đọc đúng', t.color === '#aabbcc');
    ok('màu đọc được thì KHOÁ colorAuto (không cho hệ tự đổi)', t.colorAuto === false);
    ok('căn giữa theo algn="ctr"', t.align === 'center');
    ok('vai trò suy từ p:ph type="title"', t.role === 'title');
    ok('tên hình lấy từ cNvPr', t.name === 'Tiêu đề 1');
    const im = els[1] as ImageElement;
    ok('ảnh nhúng thành ImageElement dataURL', im.kind === 'image' && im.src === PNG_1x1);
    ok('ảnh KHÔNG gán assetId (ảnh rời, không phải tài sản liên kết)', im.assetId === undefined);
    ok('ảnh đặt đúng nửa dưới phải', near(im.frame.x, 50) && near(im.frame.y, 50));
    ok('góc xoay rot=5400000 → 90 độ', near(im.frame.rotation, 90, 0.01));
    ok('nền slide lấy màu đặc', built.slide.background === '#102030');
    ok('graphicFrame bị đếm là không đọc được', built.skipped === 1 && built.skippedNote.includes('SmartArt'));
  }
  {
    // nhóm (grpSp): toạ độ con nằm trong hệ toạ độ riêng, phải quy về hệ slide
    const xml = `${XML_HEADER}<p:sld xmlns:p="p" xmlns:a="a"><p:cSld><p:spTree>
      <p:grpSp>
        <p:grpSpPr><a:xfrm>
          <a:off x="6096000" y="0"/><a:ext cx="6096000" cy="6858000"/>
          <a:chOff x="1000000" y="2000000"/><a:chExt cx="12192000" cy="13716000"/>
        </a:xfrm></p:grpSpPr>
        <p:sp><p:nvSpPr><p:cNvPr id="9" name="con"/></p:nvSpPr>
          <p:spPr><a:xfrm><a:off x="1000000" y="2000000"/><a:ext cx="12192000" cy="6858000"/></a:xfrm></p:spPr>
          <p:txBody><a:p><a:r><a:rPr sz="1800"/><a:t>trong nhóm</a:t></a:r></a:p></p:txBody>
        </p:sp>
      </p:grpSp>
    </p:spTree></p:cSld></p:sld>`;
    const b = buildSlideFromXml(parseXml(xml), { cx: DEFAULT_SLIDE_CX, cy: DEFAULT_SLIDE_CY, media: new Map() });
    const t = b.slide.elements[0] as TextElement;
    // chOff trùng off con ⇒ con nằm ở gốc nhóm (50% ngang, 0% dọc). Tỉ lệ chExt/ext = 0,5 ⇒ khổ
    // con 12192000×6858000 co còn 6096000×3429000 = 50%×50% sân khấu (không co thì phải là 100%).
    ok('nhóm: con quy về đúng gốc nhóm', near(t.frame.x, 50) && near(t.frame.y, 0));
    ok('nhóm: co giãn theo chExt', near(t.frame.w, 50) && near(t.frame.h, 50));
  }
  {
    // placeholder KHÔNG khai xfrm → kế thừa từ slideLayout
    const layout = parseXml(`<p:sldLayout xmlns:p="p" xmlns:a="a"><p:cSld><p:spTree>
      <p:sp><p:nvSpPr><p:cNvPr id="2" name="ph"/><p:nvPr><p:ph type="body" idx="1"/></p:nvPr></p:nvSpPr>
        <p:spPr><a:xfrm><a:off x="3048000" y="1714500"/><a:ext cx="6096000" cy="1714500"/></a:xfrm></p:spPr>
      </p:sp></p:spTree></p:cSld></p:sldLayout>`);
    const table = collectPlaceholderFrames(layout);
    ok('gom được khung placeholder của layout', table.has('body#1') && table.has('i#1'));
    const xml = `<p:sld xmlns:p="p" xmlns:a="a"><p:cSld><p:spTree>
      <p:sp><p:nvSpPr><p:cNvPr id="5" name="x"/><p:nvPr><p:ph type="body" idx="1"/></p:nvPr></p:nvSpPr>
        <p:spPr/>
        <p:txBody><a:p><a:r><a:rPr sz="1800"/><a:t>kế thừa vị trí</a:t></a:r></a:p></p:txBody>
      </p:sp></p:spTree></p:cSld></p:sld>`;
    const b = buildSlideFromXml(parseXml(xml), {
      cx: DEFAULT_SLIDE_CX,
      cy: DEFAULT_SLIDE_CY,
      media: new Map(),
      placeholders: table,
    });
    const t = b.slide.elements[0] as TextElement;
    ok('slide thiếu xfrm → lấy vị trí từ layout', near(t.frame.x, 25) && near(t.frame.y, 25));
    ok('… và kích thước cũng từ layout', near(t.frame.w, 50) && near(t.frame.h, 25));
  }
  {
    let threw = false;
    try {
      buildSlideFromXml(parseXml('<p:sld xmlns:p="p"><p:cSld/></p:sld>'), {
        cx: DEFAULT_SLIDE_CX,
        cy: DEFAULT_SLIDE_CY,
        media: new Map(),
      });
    } catch {
      threw = true;
    }
    ok('thiếu <p:spTree> → ném lỗi rõ ràng', threw);
  }

  console.log('[5] VÒNG TRÒN THẬT — pptxgenjs xuất ra, importPptx đọc lại');
  const pptx = new PptxGen();
  pptx.defineLayout({ name: 'IF_16x9', width: 13.333, height: 7.5 });
  pptx.layout = 'IF_16x9';
  {
    const s1 = pptx.addSlide();
    s1.addText('Tiêu đề tiếng Việt đủ dấu', {
      x: 1, y: 0.75, w: 6.6665, h: 1.5, fontSize: 36, bold: true, color: '221F1A', align: 'center',
    });
    s1.addImage({ data: PNG_1x1, x: 0, y: 3.75, w: 6.6665, h: 3.75 });
    const s2 = pptx.addSlide();
    s2.addText('Slide hai\nhai dòng', { x: 0, y: 0, w: 13.333, h: 2, fontSize: 18, italic: true });
    const buf = (await pptx.write({ outputType: 'arraybuffer' })) as ArrayBuffer;

    const res = await importPptx(buf);
    ok('đọc đúng số slide', res.total === 2 && res.slides.length === 2);
    ok('không có slide nào bị bỏ', res.warnings.length === 0);

    const els = res.slides[0].elements;
    const t = els.find((e) => e.kind === 'text') as TextElement | undefined;
    const im = els.find((e) => e.kind === 'image') as ImageElement | undefined;
    ok('slide 1 có đủ chữ + ảnh', !!t && !!im);
    ok('chữ tiếng Việt đủ dấu đi qua vòng tròn nguyên vẹn', t?.text === 'Tiêu đề tiếng Việt đủ dấu');
    // x=1in trên khổ 13.333in ⇒ 7,5% ; y=0.75in trên 7.5in ⇒ 10% ; w=6.6665in ⇒ 50% ; h=1.5in ⇒ 20%
    ok('vị trí X quy đổi đúng (1in/13.333in = 7,5%)', near(t!.frame.x, 7.5));
    ok('vị trí Y quy đổi đúng (0.75in/7.5in = 10%)', near(t!.frame.y, 10));
    ok('bề rộng quy đổi đúng (50%)', near(t!.frame.w, 50));
    ok('chiều cao quy đổi đúng (20%)', near(t!.frame.h, 20));
    ok('cỡ chữ 36pt → 6,67% chiều cao', near(t!.fontSize, 6.667, 0.02));
    ok('đậm giữ nguyên', t!.bold === true);
    ok('màu giữ nguyên', t!.color === '#221f1a');
    ok('căn giữa giữ nguyên', t!.align === 'center');
    ok('ảnh trả về dataURL PNG', !!im && im.src.startsWith('data:image/png;base64,'));
    ok('ảnh đúng nửa dưới trái', near(im!.frame.x, 0) && near(im!.frame.y, 50) && near(im!.frame.w, 50));

    const t2 = res.slides[1].elements[0] as TextElement;
    ok('slide 2: xuống dòng giữ nguyên', t2.text === 'Slide hai\nhai dòng');
    ok('slide 2: nghiêng giữ nguyên', t2.italic === true);
    ok('mọi slide đánh dấu nguồn nhập', res.slides.every((s) => s.templateId === 'pptx-import'));
    ok('id slide là id mới của IF (không đụng id cũ)', res.slides[0].id !== res.slides[1].id);
    ok('câu báo kết quả gọn khi không lỗi', importSummary('a.pptx', res) === 'Đã nhập 2 slide từ "a.pptx".');
  }

  console.log('[6] File có slide HỎNG — bỏ đúng slide đó, giữ phần còn lại');
  {
    const p2 = new PptxGen();
    p2.defineLayout({ name: 'IF_16x9', width: 13.333, height: 7.5 });
    p2.layout = 'IF_16x9';
    p2.addSlide().addText('một', { x: 1, y: 1, w: 4, h: 1, fontSize: 24 });
    p2.addSlide().addText('hai', { x: 1, y: 1, w: 4, h: 1, fontSize: 24 });
    p2.addSlide().addText('ba', { x: 1, y: 1, w: 4, h: 1, fontSize: 24 });
    const buf = (await p2.write({ outputType: 'arraybuffer' })) as ArrayBuffer;

    const zip = await JSZip.loadAsync(buf);
    zip.file('ppt/slides/slide2.xml', '<p:sld><p:cSld><p:spTree><p:sp attr="chưa đóng');
    const broken = (await zip.generateAsync({ type: 'arraybuffer' })) as ArrayBuffer;

    const res = await importPptx(broken);
    ok('vẫn đếm đủ tổng số slide trong file', res.total === 3);
    ok('chỉ mất đúng 1 slide hỏng', res.slides.length === 2);
    ok('cảnh báo chỉ đích danh slide 2', res.warnings.length === 1 && res.warnings[0].slide === 2);
    ok('lý do nói rõ "không đọc được"', res.warnings[0].reason.startsWith('không đọc được'));
    const texts = res.slides.map((s) => (s.elements[0] as TextElement).text);
    ok('hai slide lành vẫn đúng nội dung + đúng thứ tự', texts.join('|') === 'một|ba');
    ok(
      'câu báo kết quả nói N/M + số slide bỏ',
      importSummary('b.pptx', res) === 'Đã nhập 2/3 slide từ "b.pptx" — bỏ qua slide 2.',
    );
  }

  console.log('[7] File KHÔNG phải .pptx — ném lỗi rõ ràng, không trả kết quả rỗng im lặng');
  {
    let msg = '';
    try {
      await importPptx(new TextEncoder().encode('đây không phải zip').buffer as ArrayBuffer);
    } catch (e) {
      msg = e instanceof Error ? e.message : String(e);
    }
    ok('không phải ZIP → báo lỗi tiếng Việt', msg.includes('không phải file .pptx'));

    const empty = new JSZip();
    empty.file('hello.txt', 'xin chào');
    let msg2 = '';
    try {
      await importPptx((await empty.generateAsync({ type: 'arraybuffer' })) as ArrayBuffer);
    } catch (e) {
      msg2 = e instanceof Error ? e.message : String(e);
    }
    ok('ZIP nhưng thiếu presentation.xml → báo lỗi', msg2.includes('ppt/presentation.xml'));
  }

  console.log('[8] Thứ tự slide theo p:sldIdLst, KHÔNG theo tên file');
  {
    const zip = new JSZip();
    zip.file(
      'ppt/presentation.xml',
      `${XML_HEADER}<p:presentation xmlns:p="p" xmlns:r="r">
        <p:sldIdLst><p:sldId id="257" r:id="rId3"/><p:sldId id="256" r:id="rId2"/></p:sldIdLst>
        <p:sldSz cx="9144000" cy="6858000"/>
      </p:presentation>`,
    );
    zip.file(
      'ppt/_rels/presentation.xml.rels',
      `${XML_HEADER}<Relationships xmlns="x">
        <Relationship Id="rId2" Type="../slide" Target="slides/slide1.xml"/>
        <Relationship Id="rId3" Type="../slide" Target="slides/slide2.xml"/>
      </Relationships>`,
    );
    const mk = (t: string) =>
      `${XML_HEADER}<p:sld xmlns:p="p" xmlns:a="a"><p:cSld><p:spTree><p:sp><p:nvSpPr><p:cNvPr id="2" name="x"/></p:nvSpPr><p:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="1000000" cy="500000"/></a:xfrm></p:spPr><p:txBody><a:p><a:r><a:rPr sz="1800"/><a:t>${t}</a:t></a:r></a:p></p:txBody></p:sp></p:spTree></p:cSld></p:sld>`;
    zip.file('ppt/slides/slide1.xml', mk('một'));
    zip.file('ppt/slides/slide2.xml', mk('hai'));
    const res = await importPptx((await zip.generateAsync({ type: 'arraybuffer' })) as ArrayBuffer);
    const texts = res.slides.map((s) => (s.elements[0] as TextElement).text);
    ok('thứ tự theo sldIdLst (slide2 trước slide1)', texts.join('|') === 'hai|một');
    ok('đọc đúng khổ 4:3 từ p:sldSz', near((res.slides[0].elements[0] as TextElement).frame.w, 10.94, 0.05));

    const pres = parseXml(`${XML_HEADER}<p:presentation xmlns:p="p"/>`);
    const sz = slideSizeFromPresentation(pres);
    ok('thiếu p:sldSz → rơi về khổ 16:9 mặc định', sz.cx === DEFAULT_SLIDE_CX && sz.cy === DEFAULT_SLIDE_CY);
  }

  console.log(`\n${pass} pass · ${fail} fail`);
  if (fail > 0) process.exit(1);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
