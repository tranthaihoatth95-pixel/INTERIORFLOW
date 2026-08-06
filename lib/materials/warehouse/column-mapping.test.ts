/**
 * lib/materials/warehouse/column-mapping.test.ts
 * Chạy: node_modules/.bin/sucrase-node lib/materials/warehouse/column-mapping.test.ts
 */
import { guessMapping, unmappedColumns, headerSignature, emptyMapping } from './column-mapping';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

// ---- bảng giá tiếng Việt điển hình (NCC gạch/đá) ----
{
  const headers = ['Mã SP', 'Tên sản phẩm', 'Hãng', 'ĐVT', 'Đơn giá', 'Rộng', 'Sâu', 'Cao', 'Ghi chú'];
  const m = guessMapping(headers);
  ok('mã → sku', m.sku === 0);
  ok('tên sản phẩm → name', m.name === 1);
  ok('hãng → brand', m.brand === 2);
  ok('ĐVT → unit', m.unit === 3);
  ok('đơn giá → priceVnd', m.priceVnd === 4);
  ok('rộng → w', m.w === 5);
  ok('sâu → d', m.d === 6);
  ok('cao → h → hUp', m.hUp === 7);
  ok('ghi chú → note', m.note === 8);
}

// ---- tiêu đề tiếng Anh ----
{
  const headers = ['SKU', 'Product Name', 'Brand', 'Unit', 'Price', 'Width (mm)', 'Depth (mm)', 'Height (mm)'];
  const m = guessMapping(headers);
  ok('SKU → sku', m.sku === 0);
  ok('Product Name → name', m.name === 1);
  ok('Brand → brand', m.brand === 2);
  ok('Unit → unit', m.unit === 3);
  ok('Price → priceVnd', m.priceVnd === 4);
  ok('Width → w', m.w === 5);
  ok('Depth → d', m.d === 6);
  ok('Height → hUp', m.hUp === 7);
}

// ---- "Đơn vị" và "Đơn giá" không lẫn nhau (cùng chứa "đơn") ----
{
  const headers = ['Đơn vị', 'Đơn giá'];
  const m = guessMapping(headers);
  ok('Đơn vị → unit (không lẫn priceVnd)', m.unit === 0);
  ok('Đơn giá → priceVnd (không lẫn unit)', m.priceVnd === 1);
}

// ---- cột lạ không map vào đâu ----
{
  const headers = ['Cột bí ẩn XYZ', 'Tên'];
  const m = guessMapping(headers);
  ok('cột không khớp field nào → null', m.brand === null && m.sku === null);
  ok('Tên vẫn map đúng dù có cột lạ đứng trước', m.name === 1);
}

// ---- headerSignature ổn định (không phân biệt hoa/thường/dấu, để nhớ mapping đúng NCC) ----
{
  const a = headerSignature(['Mã SP', 'Tên']);
  const b = headerSignature(['mã sp', 'tên']);
  ok('chữ ký không phân biệt hoa/thường', a === b);
  const c = headerSignature(['Mã SP', 'Khác']);
  ok('chữ ký đổi khi tiêu đề đổi', a !== c);
}

ok('emptyMapping mọi field null', Object.values(emptyMapping()).every((v) => v === null));

// ═══════════════════════════════════════════════════════════════════════════════════════════
// 06/08 — BUG G-M3-06: từ khoá MỘT CHỮ CÁI khớp theo chuỗi con, vồ nhầm cột khác.
// Đây là ca THẬT lấy nguyên từ bảng FF&E bốc tách (9 cột). Trước khi vá, chạy 2 khối dưới đây
// trên code cũ thì: (B) "Phòng" chiếm ô Cao, cột "Cao (H mm)" thật rơi mất; (C) "Độ tin cậy"
// chiếm ô Sâu, cột "Sâu (D mm)" thật rơi mất. Cả lô nhập vào MẤT KÍCH THƯỚC mà không báo gì.
// ═══════════════════════════════════════════════════════════════════════════════════════════

// ---- (A) bảng FF&E 9 cột phải vào TRỌN 9/9 ----
{
  const headers = ['Tên sản phẩm', 'SKU', 'Rộng (W mm)', 'Sâu (D mm)', 'Cao (H mm)', 'Vật liệu', 'Màu sắc', 'Độ tin cậy', 'Phòng'];
  const m = guessMapping(headers);
  ok('FF&E · Tên sản phẩm → name', m.name === 0);
  ok('FF&E · SKU → sku', m.sku === 1);
  ok('FF&E · Rộng (W mm) → w', m.w === 2);
  ok('FF&E · Sâu (D mm) → d', m.d === 3);
  ok('FF&E · Cao (H mm) → hUp', m.hUp === 4);
  ok('FF&E · Vật liệu → materials', m.materials === 5);
  ok('FF&E · Màu sắc → colorHex', m.colorHex === 6);
  ok('FF&E · Độ tin cậy → confidence', m.confidence === 7);
  ok('FF&E · Phòng → room', m.room === 8);
  const mapped = Object.values(m).filter((v) => v !== null).length;
  ok('FF&E · vào TRỌN 9/9 cột, không cột nào rơi', mapped === 9);
}

// ---- (B) TÁI HIỆN bug 'h': "Phòng" đứng TRƯỚC "Cao" ----
{
  const headers = ['Tên sản phẩm', 'SKU', 'Phòng', 'Rộng (W mm)', 'Sâu (D mm)', 'Cao (H mm)'];
  const m = guessMapping(headers);
  ok("bug 'h' · \"Phòng\" KHÔNG còn bị gán vào Cao", m.hUp !== 2);
  ok("bug 'h' · cột \"Cao (H mm)\" thật vẫn được nhận", m.hUp === 5);
  ok("bug 'h' · \"Phòng\" về đúng ô Phòng", m.room === 2);
}

// ---- (C) TÁI HIỆN bug 'd': "Độ tin cậy" đứng TRƯỚC "Sâu" ----
{
  const headers = ['Tên', 'Độ tin cậy', 'Sâu (D mm)'];
  const m = guessMapping(headers);
  ok("bug 'd' · \"Độ tin cậy\" KHÔNG còn bị gán vào Sâu", m.d !== 1);
  ok("bug 'd' · cột \"Sâu (D mm)\" thật vẫn được nhận", m.d === 2);
  ok("bug 'd' · \"Độ tin cậy\" về đúng ô Độ tin cậy", m.confidence === 1);
}

// ---- (D) rà cả 3 chữ cái đơn 'w'/'d'/'h' trên loạt tiêu đề CÓ chứa chữ đó nhưng KHÔNG phải
//          cột kích thước — trước khi vá, mỗi dòng dưới đây là một cách mất số âm thầm. ----
{
  const traps: { header: string; field: 'w' | 'd' | 'hUp'; why: string }[] = [
    { header: 'Phòng', field: 'hUp', why: "'phong' chứa h" },
    { header: 'Hãng sản xuất', field: 'hUp', why: "'hang san xuat' chứa h" },
    { header: 'Xuất xứ hàng', field: 'hUp', why: "'xuat xu hang' chứa h" },
    { header: 'Độ tin cậy', field: 'd', why: "'do tin cay' chứa d" },
    { header: 'Đơn vị', field: 'd', why: "'don vi' chứa d" },
    { header: 'Ngày cập nhật', field: 'd', why: "'ngay cap nhat' chứa d" },
    { header: 'Website NCC', field: 'w', why: "'website ncc' chứa w" },
    { header: 'Warranty', field: 'w', why: "'warranty' chứa w" },
  ];
  for (const t of traps) {
    const m = guessMapping(['Tên', t.header]);
    ok(`bẫy chữ đơn · "${t.header}" không rơi vào ${t.field} (${t.why})`, m[t.field] !== 1);
  }
  // ...nhưng tiêu đề THẬT SỰ có chữ cái đứng riêng thì vẫn phải bắt được (không vá quá tay).
  const real = guessMapping(['W (mm)', 'D (mm)', 'H (mm)']);
  ok('vá không quá tay · "W (mm)" vẫn → w', real.w === 0);
  ok('vá không quá tay · "D (mm)" vẫn → d', real.d === 1);
  ok('vá không quá tay · "H (mm)" vẫn → hUp', real.hUp === 2);
}

// ---- (E) 6 trường mới đoán được bằng cả VI lẫn EN ----
{
  const m = guessMapping(['Item', 'Qty', 'Material', 'Finish', 'Colour', 'Room', 'Confidence']);
  ok('EN · Qty → qty', m.qty === 1);
  ok('EN · Material → materials', m.materials === 2);
  ok('EN · Finish → finishes', m.finishes === 3);
  ok('EN · Colour → colorHex', m.colorHex === 4);
  ok('EN · Room → room', m.room === 5);
  ok('EN · Confidence → confidence', m.confidence === 6);
  const vi = guessMapping(['Tên', 'Số lượng', 'Chất liệu', 'Hoàn thiện', 'Màu', 'Khu vực', 'Tin cậy']);
  ok('VI · Số lượng → qty', vi.qty === 1);
  ok('VI · Chất liệu → materials', vi.materials === 2);
  ok('VI · Hoàn thiện → finishes', vi.finishes === 3);
  ok('VI · Màu → colorHex', vi.colorHex === 4);
  ok('VI · Khu vực → room', vi.room === 5);
  ok('VI · Tin cậy → confidence', vi.confidence === 6);
}

// ---- (F) 9 trường CŨ không đổi hành vi (6 trường mới xếp SAU nên không cướp cột) ----
{
  const headers = ['Mã SP', 'Tên sản phẩm', 'Hãng', 'ĐVT', 'Đơn giá', 'Rộng', 'Sâu', 'Cao', 'Ghi chú'];
  const m = guessMapping(headers);
  ok('không hồi quy · 9 cột NCC cũ vẫn map y như trước',
    m.sku === 0 && m.name === 1 && m.brand === 2 && m.unit === 3 && m.priceVnd === 4 && m.w === 5 && m.d === 6 && m.hUp === 7 && m.note === 8);
}

// ---- ② (KIỂM PHẢN BIỆN 06/08) cột "Ảnh" ĐƯỢC ghép + cột bỏ rơi LIỆT KÊ ĐƯỢC ----
{
  const headers = ['Tên', 'Mã SP', 'Đơn giá', 'Ảnh', 'Cột lạ của NCC', ''];
  const m = guessMapping(headers);
  ok('② "Ảnh" → image (trước 06/08: KHÔNG có trường nào để ghép)', m.image === 3);
  const dropped = unmappedColumns(headers, m);
  ok('② liệt kê đúng cột app không nhận', dropped.length === 1 && dropped[0].header === 'Cột lạ của NCC' && dropped[0].index === 4);
  ok('② cột trống tên KHÔNG báo (chỉ gây nhiễu)', !dropped.some((c) => c.header === ''));
}

// ---- ② bẫy chuỗi con: 'anh' nằm trong "thanh tien" — KHÔNG được cướp cột "Thành tiền" ----
{
  const m = guessMapping(['Tên', 'Thành tiền', 'Thanh nẹp nhôm']);
  ok('② "Thành tiền" KHÔNG bị gán vào ô Ảnh', m.image === null);
  const m2 = guessMapping(['Tên', 'Hình ảnh sản phẩm']);
  ok('② "Hình ảnh sản phẩm" VẪN nhận đúng là Ảnh', m2.image === 1);
  const m3 = guessMapping(['Tên', 'Hình']);
  ok('② tiêu đề đúng bằng "Hình" vẫn nhận (khớp nguyên cụm)', m3.image === 1);
}

console.log(`\n${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
