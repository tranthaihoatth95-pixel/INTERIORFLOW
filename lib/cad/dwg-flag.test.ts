/**
 * dwg-flag.test.ts — cờ TẮT đường DWG (28/08).
 *
 * CA 0 · CỔNG HARNESS chạy trước: nếu không nạp được đúng module thật thì mọi ca dưới đều
 * vô nghĩa, và một dãy ca xanh trên module rỗng còn tệ hơn không có ca nào.
 */
import { dwgImportEnabled, dwgTatMessage } from './dwg-flag';

let ok = 0, fail = 0;
const t = (ten: string, dieu: boolean) => {
  if (dieu) { ok++; console.log('  ok  -', ten); }
  else { fail++; console.log('  FAIL-', ten); }
};

// ═══ CA 0 · CỔNG HARNESS ═══
if (typeof dwgImportEnabled !== 'function' || typeof dwgTatMessage !== 'function') {
  console.error('CỔNG HARNESS ĐỎ — không nạp được lib/cad/dwg-flag.ts');
  process.exit(1);
}
console.log('CỔNG HARNESS XANH — nạp đúng module thật.');

const cu = process.env.NEXT_PUBLIC_IF_DWG_IMPORT;

// ═══ mong KHÔNG thấy: mặc định phải TẮT ═══
delete process.env.NEXT_PUBLIC_IF_DWG_IMPORT;
t('không khai biến → TẮT', dwgImportEnabled() === false);
process.env.NEXT_PUBLIC_IF_DWG_IMPORT = '0';
t("khai '0' → TẮT", dwgImportEnabled() === false);
process.env.NEXT_PUBLIC_IF_DWG_IMPORT = 'true';
t("khai 'true' (không phải '1') → vẫn TẮT — chỉ đúng một giá trị mở được", dwgImportEnabled() === false);

// ═══ mong THẤY: đảo được, nếu không thì đây là XOÁ chứ không phải cờ (luật F-17) ═══
process.env.NEXT_PUBLIC_IF_DWG_IMPORT = '1';
t("khai '1' → BẬT", dwgImportEnabled() === true);

// ═══ câu nói với người dùng ═══
const m = dwgTatMessage('mat-bang.dwg');
t('nêu tên tệp người dùng vừa chọn', m.includes('mat-bang.dwg'));
t('nêu đường DXF dùng được ngay', /DXF/.test(m));
t('KHÔNG nói dối rằng tệp hỏng', !/hỏng|lỗi|không hợp lệ/i.test(m));
t('KHÔNG hardcode tên một hãng nào (LUẬT NỀN TẢNG §1)',
  !/AutoCAD|Autodesk|BricsCAD|ZWCAD|ODA|Revit|TTT/i.test(m));
t('nói rõ đây là bản này, không phải vĩnh viễn', /bản này/.test(m));
const en = dwgTatMessage('plan.dwg', true);
t('bản EN cũng có, cũng không nêu tên hãng', en.includes('plan.dwg') && !/AutoCAD|Autodesk|ODA/i.test(en));
t('bản EN khác bản VI', en !== m);

if (cu === undefined) delete process.env.NEXT_PUBLIC_IF_DWG_IMPORT;
else process.env.NEXT_PUBLIC_IF_DWG_IMPORT = cu;

console.log(`\n${ok} ok, ${fail} fail`);
if (fail) process.exit(1);
