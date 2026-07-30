/**
 * scripts/probe-xlsx-roundtrip.ts — THĂM DÒ RỦI RO round-trip cho `SPEC_TEMPLATE 1.xlsx`
 * (mẫu dossier vật liệu TTT, 6 sheet, có công thức `_xlfn.XLOOKUP`, print area A1:F17, dòng 17
 * cao 330pt dành cho ảnh, khổ A4 dọc). CHỈ THĂM DÒ — KHÔNG PHẢI CODE SẢN PHẨM, không ghi đè dữ
 * liệu thật, không đụng tính năng xuất dossier nào.
 *
 * Đọc file → GHI LẠI Y NGUYÊN (không đổi field nào) → Hoà tự mở file kết quả bằng Excel THẬT để
 * kiểm bằng mắt: XLOOKUP còn chạy? style còn giữ? print area còn đúng? dòng 17 còn 330pt? khổ
 * còn A4 dọc? Script không tự khẳng định các điều này (không có Excel engine thật để verify —
 * chỉ đọc lại metadata mà thư viện parse ra, không đại diện cho việc Excel THẬT mở file có lỗi
 * hay không).
 *
 * 2 nhánh thăm dò (chạy độc lập, script tự chọn theo cờ CLI):
 *   --mode=exceljs   Đọc/ghi qua ExcelJS (RE-SERIALIZE toàn bộ workbook — rủi ro đã biết trong
 *                     hệ sinh thái Node: có tiền sử làm hỏng công thức `_xlfn.*` (Excel thêm các
 *                     hàm mới như XLOOKUP/XMATCH/FILTER sau khi định dạng .xlsx đã chốt, nên
 *                     Excel LƯU CHÚNG kèm tiền tố `_xlfn.` cho tương thích ngược; thư viện nào
 *                     không biết quy ước này khi re-serialize dễ làm rớt tiền tố → công thức lỗi)
 *                     và làm mất style/print-area khi viết lại toàn bộ XML nội bộ.
 *                     ⚠️ CHƯA phải dependency của repo — cần `npm install --no-save exceljs`
 *                     tạm thời để chạy nhánh này (KHÔNG tự thêm vào package.json — quyết định
 *                     thêm dependency thật thuộc về lúc code sản phẩm, không phải lúc thăm dò).
 *   --mode=ziponly    Đọc file bằng jszip (ĐÃ có sẵn trong node_modules — pptxgenjs dùng nội bộ,
 *                     xem lib/pptx-zip-fonts.ts) — KHÔNG re-serialize gì, chỉ load rồi generate
 *                     lại y nguyên buffer zip, liệt kê danh sách entry + kiểm không đổi. Đây là
 *                     baseline cho phương án "vá trực tiếp XML trong zip, copy nguyên vẹn phần
 *                     còn lại" — nếu load→generate không đổi cũng KHÔNG đảm bảo Excel mở được
 *                     (jszip không hiểu ngữ nghĩa OOXML), chỉ chứng minh zip container còn nguyên.
 *
 * Chạy (từ gốc repo, sau khi copy `SPEC_TEMPLATE 1.xlsx` vào 1 đường dẫn cục bộ — KHÔNG commit
 * file .xlsx thật vào git):
 *   node_modules/.bin/sucrase-node scripts/probe-xlsx-roundtrip.ts --mode=ziponly --file="/duong/dan/SPEC_TEMPLATE 1.xlsx"
 *   node_modules/.bin/sucrase-node scripts/probe-xlsx-roundtrip.ts --mode=exceljs --file="/duong/dan/SPEC_TEMPLATE 1.xlsx"
 *
 * Output: file `<tên gốc>.roundtrip-<mode>.xlsx` cạnh file input — Hoà tự mở bằng Excel thật.
 */
import fs from 'node:fs';

function parseArgs(argv: string[]) {
  const out: { mode?: string; file?: string } = {};
  for (const a of argv) {
    const m = /^--(mode|file)=(.*)$/.exec(a);
    if (m) out[m[1] as 'mode' | 'file'] = m[2];
  }
  return out;
}

function fail(msg: string): never {
  console.error(`✗ ${msg}`);
  process.exit(1);
}

async function probeZipOnly(filePath: string) {
  console.log('[ziponly] jszip load → generate, KHÔNG đổi XML nội bộ nào (đã có sẵn — pptxgenjs dùng nội bộ).');
  // Cùng pattern với lib/pptx-zip-fonts.ts — jszip có sẵn type (node_modules/jszip/index.d.ts),
  // không cần khai `any`.
  const JSZip = (await import('jszip')).default;

  const inputBuf = fs.readFileSync(filePath);
  const zip = await JSZip.loadAsync(inputBuf);
  const entryNames = Object.keys(zip.files).sort();
  console.log(`  entries đọc được: ${entryNames.length}`);

  const requiredEntries = ['[Content_Types].xml', 'xl/workbook.xml', 'xl/worksheets/sheet1.xml'];
  for (const req of requiredEntries) {
    const found = entryNames.includes(req);
    console.log(`  ${found ? 'ok  ' : 'THIẾU'} - entry bắt buộc "${req}"`);
  }

  // Ghi lại KHÔNG đụng entry nào — mọi entry giữ nguyên buffer gốc qua zip.file(name).async('nodebuffer').
  const outZip = new JSZip();
  for (const name of entryNames) {
    const content = await zip.files[name].async('nodebuffer');
    outZip.file(name, content, { binary: true });
  }
  const outBuf = await outZip.generateAsync({ type: 'nodebuffer' });

  const outPath = filePath.replace(/\.xlsx$/i, '') + '.roundtrip-ziponly.xlsx';
  fs.writeFileSync(outPath, outBuf);
  console.log(`  đã ghi: ${outPath}`);
  console.log(`  kích thước gốc: ${inputBuf.length} byte · kích thước sau round-trip: ${outBuf.length} byte`);
  console.log('  ⚠️ Kích thước LỆCH là bình thường (zip container/nén lại có thể khác byte-for-byte dù nội dung y hệt)');
  console.log('     — MỞ file .roundtrip-ziponly.xlsx bằng Excel thật để kiểm bằng mắt, script không tự khẳng định "an toàn".');
}

async function probeExcelJs(filePath: string) {
  console.log('[exceljs] Đọc/ghi qua ExcelJS (re-serialize toàn bộ workbook).');
  // exceljs KHÔNG phải dependency của repo (không có type), import bằng biến để tsc không đòi
  // @types/exceljs lúc build (xem comment đầu file). Runtime vẫn resolve đúng khi đã cài tạm.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let ExcelJS: any;
  try {
    const moduleName = 'exceljs';
    ExcelJS = await import(moduleName);
  } catch {
    fail(
      'exceljs CHƯA cài. Nhánh này cần cài tạm: `npm install --no-save exceljs` rồi chạy lại. ' +
        'KHÔNG tự cài trong script này — cài dependency là quyết định thủ công, không phải hành vi ngầm của probe.',
    );
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);

  console.log(`  số sheet đọc được: ${workbook.worksheets.length}`);
  for (const ws of workbook.worksheets) {
    // ws.pageSetup không có type cục bộ vì cả module `exceljs` đang ở dạng `any` (xem lý do ở đầu hàm).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pageSetup = ws.pageSetup as any;
    console.log(`  - "${ws.name}": printArea=${pageSetup?.printArea ?? '(không đọc được qua API này)'}`);
  }

  const outPath = filePath.replace(/\.xlsx$/i, '') + '.roundtrip-exceljs.xlsx';
  await workbook.xlsx.writeFile(outPath);
  console.log(`  đã ghi: ${outPath}`);
  console.log('  ⚠️ ExcelJS re-serialize TOÀN BỘ workbook — MỞ file bằng Excel thật, kiểm kỹ:');
  console.log('     · công thức XLOOKUP còn tính đúng (không lỗi #NAME? do mất tiền tố _xlfn.)?');
  console.log('     · style/font/border của 6 sheet còn giữ?');
  console.log('     · print area A1:F17 còn đúng, không bị ExcelJS reset?');
  console.log('     · dòng 17 còn cao 330pt (không bị làm tròn/reset về mặc định)?');
  console.log('     · khổ giấy còn A4 DỌC (không bị đổi orientation)?');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const mode = args.mode ?? 'ziponly';
  if (mode !== 'ziponly' && mode !== 'exceljs') {
    fail(`--mode phải là "ziponly" hoặc "exceljs" (nhận được: "${mode}")`);
  }
  if (!args.file) {
    fail(
      'Thiếu --file="/duong/dan/SPEC_TEMPLATE 1.xlsx". Script này KHÔNG hardcode đường dẫn máy Hoà — ' +
        'truyền tay lúc chạy. File không tìm thấy trong phạm vi Cowork phiên này lúc viết script (đã tìm ' +
        'toàn bộ mount, không thấy) — rất có thể nằm ngoài thư mục được cấp quyền, vd ~/Downloads/ ' +
        'interiorflow-reference/ (theo quy ước tách dữ liệu tham khảo ra ngoài repo, xem CLAUDE.md).',
    );
  }
  if (!fs.existsSync(args.file)) {
    fail(`Không thấy file: "${args.file}"`);
  }

  if (mode === 'ziponly') await probeZipOnly(args.file);
  else await probeExcelJs(args.file);

  console.log('\n✓ Xong nhánh thăm dò — Hoà tự mở file output bằng Excel thật để kết luận cuối cùng.');
}

main().catch((e) => fail(e instanceof Error ? e.stack ?? e.message : String(e)));
