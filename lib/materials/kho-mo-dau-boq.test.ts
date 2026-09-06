/**
 * lib/materials/kho-mo-dau-boq.test.ts — CANH ĐƯỜNG DÂY "hạt giống → BOQ".
 *
 * ⛔ VÌ SAO CÓ TỆP NÀY — ca thật tái hiện 06/09 bằng chính hàm route dùng
 * (`computeBoqForProject(projectId, doc, [])`, đúng thứ route có trên máy sạch):
 * người dùng mới tô một vùng bằng vật liệu ship kèm bản cài rồi mở BOQ ⇒ **0 dòng**, kèm lỗi
 * `spec-not-found` nói *"có thể vật liệu đã bị xoá/đổi"*. Câu đó SAI — vật liệu không bị ai
 * xoá, nó chưa bao giờ là bản ghi DB. Cùng họ lỗi với ca ô-chọn-2D (`kho-mo-dau-pick.test.ts`):
 * lõi đúng, test lõi xanh, mà người dùng vẫn bị nói sai.
 *
 * Ba vế, vế ③ là vế đắt nhất:
 *   ① máy sạch — nối vào thì lý do đổi từ "không tìm thấy" sang "chưa có giá" (đúng sự thật),
 *      và BOQ vẫn 0 dòng (đúng: không đoán giá — luật 2.1.9.i + "BOQ chỉ nhận số đo được").
 *   ② kho ĐÃ có giá cho đúng `matId` ⇒ vùng tô cũ neo `hat-giong:<uuid>` RA DÒNG THẬT.
 *   ③ route BOQ có THẬT SỰ gọi phép trộn không — grep chính tệp route. Thiếu vế này thì ai đó
 *      gỡ một dòng import, mọi test khác vẫn xanh, bệnh cũ quay lại không máy nào kêu.
 *
 * Chạy: node_modules/.bin/sucrase-node lib/materials/kho-mo-dau-boq.test.ts
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { dongBoqHatGiong, hangHatGiong, TIEN_TO_HAT_GIONG } from './kho-mo-dau';
import { computeBoqForProject } from '../boq/from-project';
import type { Doc } from '../cad/model';

let pass = 0;
let fail = 0;
const ok = (ten: string, dieu: boolean, chiTiet = '') => {
  if (dieu) { pass++; console.log(`  ok  - ${ten}`); }
  else { fail++; console.log(`  FAIL- ${ten}${chiTiet ? `  (${chiTiet})` : ''}`); }
};

console.log('kho-mo-dau-boq — dây hạt giống → BOQ');

const hat = hangHatGiong()[0];
const docTo = (specId: string): Doc => ({
  version: 1, units: 'mm', layers: [],
  entities: [{
    id: 'h1', type: 'hatch', layerId: 'L', specId, matId: hat.matId,
    points: [{ x: 0, y: 0 }, { x: 4400, y: 0 }, { x: 4400, y: 2900 }, { x: 0, y: 2900 }],
  }],
} as unknown as Doc);

/* ── ① MÁY SẠCH — lý do phải nói đúng ─────────────────────────────────────────── */
console.log('\n[1] máy sạch (ProductSpec rỗng)');
{
  const truoc = computeBoqForProject('p-truoc', docTo(hat.id), []).result;
  ok('TRƯỚC khi nối: 0 dòng + lý do "spec-not-found" (sai hướng)',
    truoc.rows.length === 0 && truoc.errors[0]?.reason === 'spec-not-found');

  const sau = computeBoqForProject('p-sau', docTo(hat.id), dongBoqHatGiong([])).result;
  ok('SAU khi nối: lý do là "chưa có đơn giá", không còn "không tìm thấy"',
    sau.errors[0]?.reason === 'missing-priceVnd', JSON.stringify(sau.errors[0]?.reason));
  ok('vẫn 0 dòng — KHÔNG bịa giá cho vật liệu chưa có giá',
    sau.rows.length === 0 && sau.totalAmount === 0);
  ok('thông điệp gọi đúng TÊN vật liệu người dùng đã chọn',
    (sau.errors[0]?.message ?? '').includes(hat.name));
}

/* ── ② KHO ĐÃ CÓ GIÁ — vùng tô cũ phải ra dòng thật ───────────────────────────── */
console.log('\n[2] studio đã nhập giá cho đúng matId đó');
{
  const dbSpec = {
    id: 'ck-thuong-mai-1', name: `${hat.name} (NCC A)`, vendor: 'NCC A', sku: hat.sku,
    matId: hat.matId, unit: 'm2', priceVnd: 1_250_000, wastagePercent: 8,
  };
  const tron = dongBoqHatGiong([dbSpec]);
  const r = computeBoqForProject('p-kho', docTo(hat.id), [
    { id: dbSpec.id, name: dbSpec.name, vendor: dbSpec.vendor, sku: dbSpec.sku, unit: dbSpec.unit, priceVnd: dbSpec.priceVnd, wastagePercent: dbSpec.wastagePercent },
    ...tron,
  ]).result;

  ok('vùng tô neo hat-giong:<uuid> nay RA DÒNG (trước: 0 dòng, kêu "chưa có giá")',
    r.rows.length === 1 && r.errors.length === 0, `rows=${r.rows.length} errors=${r.errors.length}`);
  ok('dòng mượn ĐƠN GIÁ của kho', r.rows[0]?.donGia === 1_250_000);
  ok('dòng mượn HAO HỤT của kho', r.rows[0]?.haoHutPhanTram === 8);
  ok('TÊN giữ của vật liệu người dùng đã chọn, không đổi thành tên bản thương mại',
    r.rows[0]?.ten === hat.name);
  ok('dòng vẫn neo đúng specId hạt giống (không đổi danh tính vùng tô)',
    r.rows[0]?.matId === hat.id && hat.id.startsWith(TIEN_TO_HAT_GIONG));
}

/* ── ③ ROUTE CÓ GỌI KHÔNG — vế chống tháo dây ─────────────────────────────────── */
console.log('\n[3] route BOQ thật sự nối tầng hạt giống');
{
  const src = readFileSync(join(process.cwd(), 'app/api/boq/[projectId]/route.ts'), 'utf8');
  ok('route import dongBoqHatGiong', src.includes('dongBoqHatGiong'));
  ok('route NỐI nó vào danh sách spec truyền cho computeBoq',
    /specDtos[\s\S]{0,160}dongBoqHatGiong\(/.test(src));
}

console.log(`\n${pass} pass, ${fail} fail`);
if (fail) process.exit(1);
