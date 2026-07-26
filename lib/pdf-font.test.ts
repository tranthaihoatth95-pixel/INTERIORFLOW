/**
 * lib/pdf-font.test.ts — #25: nhúng font có dấu vào jsPDF.
 * Chạy:
 *   node_modules/.bin/sucrase-node lib/pdf-font.test.ts
 * (chạy TỪ GỐC REPO — nhánh Node của pdf-font đọc font theo `process.cwd()`/public/fonts.)
 */
import {
  ensureVietnameseFont,
  resolvePdfFontId,
  loadPdfFontData,
  resetPdfFontCache,
  EMBEDDABLE_PDF_FONTS,
  DEFAULT_PDF_FONT_ID,
  PDF_FALLBACK_FONT,
  type JsPdfFontTarget,
} from './pdf-font';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

/** jsPDF giả — ghi lại mọi lệnh để kiểm, không cần thư viện thật. */
function fakePdf() {
  const vfs: Record<string, string> = {};
  const fonts: Array<[string, string, string]> = [];
  const setFonts: Array<[string, string | undefined]> = [];
  const pdf: JsPdfFontTarget = {
    addFileToVFS: (n, d) => { vfs[n] = d; },
    addFont: (file, id, style) => { fonts.push([file, id, style]); },
    setFont: (name, style) => { setFonts.push([name, style]); },
  };
  return { pdf, vfs, fonts, setFonts };
}

/** Chuỗi thử phủ hết loại dấu tiếng Việt + ký hiệu kỹ thuật hay dùng trên bản vẽ. */
const VN = 'Tiêu chuẩn kỹ thuật — tỉ lệ 1:100, hạng mục nội thất, ĐƯỜNG KÍNH Ø, diện tích m²';

(async () => {
  // [1] Registry: mặc định phải có thật và khai đủ 2 weight + giấy phép.
  {
    const spec = EMBEDDABLE_PDF_FONTS[DEFAULT_PDF_FONT_ID];
    ok('[1] registry có mục mặc định', !!spec);
    ok('[1b] khai đủ normal + bold', !!spec.files.normal && !!spec.files.bold);
    ok('[1c] có ghi giấy phép', /OFL|Open Font/i.test(spec.license));
  }

  // [2] Chuỗi resolve: caller > Brand Kit > mặc định.
  {
    ok('[2] rỗng → mặc định', resolvePdfFontId() === DEFAULT_PDF_FONT_ID);
    ok('[2b] caller ép font hợp lệ → dùng đúng font đó',
      resolvePdfFontId({ fontId: DEFAULT_PDF_FONT_ID }) === DEFAULT_PDF_FONT_ID);
    ok('[2c] fontId rác → KHÔNG vỡ, rơi về mặc định',
      resolvePdfFontId({ fontId: 'KhongCoFontNay' }) === DEFAULT_PDF_FONT_ID);
    // Brand Kit hiện chưa mang file font ⇒ mọi preset đều rơi về mặc định (giới hạn đã ghi
    // ở đầu lib/pdf-font.ts). Test khoá HÀNH VI này để ai mở lại nhánh đó thì phải sửa test.
    ok('[2d] Brand Kit "Editorial" → mặc định (chưa có .ttf để nhúng)',
      resolvePdfFontId({ brandFonts: 'Editorial' }) === DEFAULT_PDF_FONT_ID);
    ok('[2e] Brand Kit "Elegant" → mặc định',
      resolvePdfFontId({ brandFonts: 'Elegant' }) === DEFAULT_PDF_FONT_ID);
  }

  // [3] Nạp file font thật từ public/fonts (nhánh Node bằng fs).
  {
    resetPdfFontCache();
    const data = await loadPdfFontData(DEFAULT_PDF_FONT_ID);
    ok('[3] nạp được font từ public/fonts', !!data && data.length === 2);
    ok('[3b] có cả normal lẫn bold', !!data && data.some((f) => f.style === 'normal') && data.some((f) => f.style === 'bold'));
    ok('[3c] base64 đủ lớn (font thật, không phải file rỗng)', !!data && data.every((f) => f.base64.length > 50_000));
    ok('[3d] base64 hợp lệ', !!data && data.every((f) => /^[A-Za-z0-9+/]+=*$/.test(f.base64)));
  }

  // [4] Cache: gọi lần 2 trả về CÙNG promise, không đọc/encode lại.
  {
    resetPdfFontCache();
    const a = loadPdfFontData(DEFAULT_PDF_FONT_ID);
    const b = loadPdfFontData(DEFAULT_PDF_FONT_ID);
    ok('[4] cache trả cùng một promise', a === b);
    await a;
    ok('[4b] sau khi resolve vẫn cache', loadPdfFontData(DEFAULT_PDF_FONT_ID) === a);
  }

  // [5] ensureVietnameseFont đăng ký đúng vào instance được truyền vào.
  {
    resetPdfFontCache();
    const { pdf, vfs, fonts, setFonts } = fakePdf();
    const family = await ensureVietnameseFont(pdf);
    const spec = EMBEDDABLE_PDF_FONTS[DEFAULT_PDF_FONT_ID];
    ok('[5] trả về family của font nhúng', family === spec.family);
    ok('[5b] nạp 2 file vào VFS', Object.keys(vfs).length === 2);
    ok('[5c] addFont cho cả normal lẫn bold',
      fonts.some((f) => f[1] === family && f[2] === 'normal') &&
      fonts.some((f) => f[1] === family && f[2] === 'bold'));
    ok('[5d] setFont sang font mới ngay', setFonts.some(([n]) => n === family));
    ok('[5e] KHÔNG dùng helvetica', !setFonts.some(([n]) => n === PDF_FALLBACK_FONT));
  }

  // [6] Fallback an toàn: font không tồn tại trong registry ⇒ vẫn resolve về mặc định (nạp
  //     được), còn khi addFont NÉM LỖI thì phải rơi về helvetica chứ không làm vỡ hàm xuất.
  {
    resetPdfFontCache();
    const setFonts: Array<[string, string | undefined]> = [];
    const broken: JsPdfFontTarget = {
      addFileToVFS: () => {},
      addFont: () => { throw new Error('giả lập TTF hỏng'); },
      setFont: (n, s) => { setFonts.push([n, s]); },
    };
    let threw = false;
    let family = '';
    try { family = await ensureVietnameseFont(broken); } catch { threw = true; }
    ok('[6] addFont lỗi → KHÔNG throw ra ngoài', !threw);
    ok('[6b] rơi về helvetica', family === PDF_FALLBACK_FONT);
    ok('[6c] có setFont helvetica để pdf vẫn vẽ được', setFonts.some(([n]) => n === PDF_FALLBACK_FONT));
  }

  // [7] KIỂM QUYẾT ĐỊNH: qua jsPDF THẬT, chữ tiếng Việt phải đo ra bề rộng KHÁC helvetica
  //     (helvetica/WinAnsi không có glyph → đo sai/thu về ký tự thay thế) và PDF phải dựng được.
  {
    resetPdfFontCache();
    const { jsPDF } = await import('jspdf');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdf: any = new jsPDF({ unit: 'mm', format: 'a4' });
    const family = await ensureVietnameseFont(pdf);
    ok('[7] jsPDF thật nhận font', family !== PDF_FALLBACK_FONT);

    const list = pdf.getFontList();
    ok('[7b] font có trong getFontList()', Object.keys(list).includes(family));

    pdf.setFontSize(10);
    pdf.setFont(family, 'normal');
    const wNormal = pdf.getTextWidth(VN);
    pdf.setFont(family, 'bold');
    const wBold = pdf.getTextWidth(VN);
    ok('[7c] đo được bề rộng chuỗi tiếng Việt', wNormal > 0);
    ok('[7d] bold rộng hơn normal (đúng 2 file font khác nhau)', wBold > wNormal);

    // Vẽ cả 2 kiểu rồi dựng PDF thật — bắt lỗi glyph thiếu/VFS hỏng ngay ở bước này.
    pdf.setFont(family, 'normal');
    pdf.text(VN, 10, 20);
    pdf.setFont(family, 'bold');
    pdf.text(VN, 10, 30);
    const bytes = new Uint8Array(pdf.output('arraybuffer'));
    ok('[7e] dựng được PDF', bytes.length > 20_000);

    // Font ĐÃ NHÚNG thật sự vào file: tên PostScript của font phải xuất hiện trong bytes.
    const raw = Buffer.from(bytes).toString('latin1');
    ok('[7f] tên font xuất hiện trong file PDF (đã nhúng, không phải font dựng sẵn)',
      raw.includes('BeVietnamPro'));
    ok('[7g] có FontFile2 (TrueType nhúng)', raw.includes('FontFile2'));
  }

  console.log(`\n${pass} pass, ${fail} fail`);
  if (fail) process.exit(1);
})().catch((e) => { console.error(e); process.exit(1); });
