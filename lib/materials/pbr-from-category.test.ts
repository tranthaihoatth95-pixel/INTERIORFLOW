import { inferPbrFromCategory } from './pbr-from-category';

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

function test3ViDuNguyenVanSpec() {
  console.log('\n[1] 3 mốc nguyên văn spec §4-2: Gỗ→0.6 · Đá bóng→0.15 · Vải→0.9');
  const go = inferPbrFromCategory('Gỗ tự nhiên');
  ok('Gỗ tự nhiên → roughness 0.6', go.roughness === 0.6);
  ok('Gỗ tự nhiên → metallic 0', go.metallic === 0);

  const daBong = inferPbrFromCategory('Đá bóng');
  ok('Đá bóng → roughness 0.15', daBong.roughness === 0.15);
  ok('Đá bóng → metallic 0', daBong.metallic === 0);

  const vai = inferPbrFromCategory('Vải bọc ghế sofa');
  ok('Vải bọc ghế sofa → roughness 0.9', vai.roughness === 0.9);
  ok('Vải bọc ghế sofa → metallic 0', vai.metallic === 0);
}

function testSuyDoanLuonTrue() {
  console.log('\n[2] suyDoan luôn true, không có nhánh trả false/undefined');
  ok('Gỗ → suyDoan true', inferPbrFromCategory('Gỗ').suyDoan === true);
  ok('rỗng → suyDoan true', inferPbrFromCategory('').suyDoan === true);
  ok('không khớp rule nào → suyDoan true', inferPbrFromCategory('Xyz không tồn tại').suyDoan === true);
}

function testKimLoaiMetallic1() {
  console.log('\n[3] Kim loại → metallic=1 (đặc biệt, khác mọi rule khác)');
  const inox = inferPbrFromCategory('Inox 304');
  ok('Inox 304 → metallic 1', inox.metallic === 1);
  ok('Inox 304 → roughness 0.3', inox.roughness === 0.3);
  ok('Kim loại sơn tĩnh điện (chứa "kim loai") → metallic 1', inferPbrFromCategory('Kim loại sơn tĩnh điện').metallic === 1);
}

function testRongVaKhongXacDinh() {
  console.log('\n[4] Rỗng/null/undefined → fallback trung tính 0.5/0, KHÔNG throw');
  const rong = inferPbrFromCategory('');
  ok('chuỗi rỗng → roughness 0.5', rong.roughness === 0.5);
  ok('chuỗi rỗng → metallic 0', rong.metallic === 0);
  const rongNull = inferPbrFromCategory(null);
  ok('null → không throw, roughness 0.5', rongNull.roughness === 0.5);
  const rongUndef = inferPbrFromCategory(undefined);
  ok('undefined → không throw, roughness 0.5', rongUndef.roughness === 0.5);
  const chiKhoangTrang = inferPbrFromCategory('   ');
  ok('chỉ khoảng trắng → fallback', chiKhoangTrang.roughness === 0.5);
}

function testKhongDauVaHoaThuong() {
  console.log('\n[5] Không phân biệt hoa/thường, không phân biệt có/không dấu');
  ok('viết hoa toàn bộ "GỖ TỰ NHIÊN" vẫn khớp', inferPbrFromCategory('GỖ TỰ NHIÊN').roughness === 0.6);
  ok('gõ sẵn không dấu "go tu nhien" vẫn khớp', inferPbrFromCategory('go tu nhien').roughness === 0.6);
  ok('"vai" không dấu vẫn khớp Vải', inferPbrFromCategory('vai').roughness === 0.9);
}

function testCumDaiHonVanKhopDungRule() {
  console.log('\n[6] Cụm dài hơn (thêm tính từ) vẫn khớp đúng rule cụ thể trước, không rơi fallback');
  ok('"Đá bóng cao cấp nhập khẩu" vẫn ra 0.15 (rule cụ thể thắng)', inferPbrFromCategory('Đá bóng cao cấp nhập khẩu').roughness === 0.15);
  ok('"Vải bố Hàn Quốc" vẫn ra 0.9', inferPbrFromCategory('Vải bố Hàn Quốc').roughness === 0.9);
}

function testGioiHanDaVsDaTron() {
  console.log('\n[7-8] Giới hạn đã biết: "Đá"/"Da" trơ 1 mình → fallback; cụm đủ ngữ cảnh mới phân biệt được');
  const daTron = inferPbrFromCategory('Đá');
  ok('"Đá" trơ 1 mình → fallback 0.5 (không suy liều theo hướng nào)', daTron.roughness === 0.5);
  const daTronKhongDau = inferPbrFromCategory('Da');
  ok('"Da" trơ 1 mình → fallback 0.5 (trùng chuỗi với "Đá" đã bỏ dấu, không đoán)', daTronKhongDau.roughness === 0.5);

  const daThat = inferPbrFromCategory('Da thật Ý');
  ok('"Da thật Ý" (leather, đủ ngữ cảnh) → roughness 0.45, KHÔNG lẫn với đá', daThat.roughness === 0.45);
  const daTuNhien = inferPbrFromCategory('Đá tự nhiên');
  ok('"Đá tự nhiên" (đủ ngữ cảnh) → roughness 0.5 (rule đá chung, khác 0.45 của da thuộc)', daTuNhien.roughness === 0.5);
}

function testKinhVaGach() {
  console.log('\n[9] Kính/Gạch — vài danh mục phổ biến khác kiểm cho chắc bảng đủ dùng');
  ok('Kính cường lực → roughness thấp 0.05', inferPbrFromCategory('Kính cường lực').roughness === 0.05);
  ok('Gạch men bóng → roughness 0.25', inferPbrFromCategory('Gạch men').roughness === 0.25);
  ok('Sơn nước nội thất → roughness 0.55 (sơn thường)', inferPbrFromCategory('Sơn nước nội thất').roughness === 0.55);
  ok('Sơn bóng cao cấp → roughness 0.35 (rule cụ thể hơn thắng)', inferPbrFromCategory('Sơn bóng cao cấp').roughness === 0.35);
}

test3ViDuNguyenVanSpec();
testSuyDoanLuonTrue();
testKimLoaiMetallic1();
testRongVaKhongXacDinh();
testKhongDauVaHoaThuong();
testCumDaiHonVanKhopDungRule();
testGioiHanDaVsDaTron();
testKinhVaGach();

console.log(`\n${pass} ok, ${fail} fail`);
if (fail > 0) process.exit(1);
