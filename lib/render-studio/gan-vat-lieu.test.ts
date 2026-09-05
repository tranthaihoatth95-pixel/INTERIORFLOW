/**
 * lib/render-studio/gan-vat-lieu.test.ts — CANH đường gán vật liệu ở chặng 3D (`[3D-VL-01]`).
 *
 * Đây KHÔNG phải test "hàm chạy đúng không". Nó canh đúng thứ đã hỏng trên app thật:
 *   ① gán trượt PHẢI trả lý do — im lặng trả `ok:false` không lý do là mở lại đường cho toast
 *      nói bừa "đã áp";
 *   ② entity phải chỉ mang KHOÁ NỐI `specId`, không chép tên/giá/PBR (luật 2.1.9.i 30/07);
 *   ③ không tra được mã thì trả `null`, TUYỆT ĐỐI không bịa một id.
 *
 * Chạy: node_modules/.bin/sucrase-node lib/render-studio/gan-vat-lieu.test.ts
 */
import { cauBaoKhongGan, ganSpecVaoEntity, laMonVatLieu, traSpecId } from './gan-vat-lieu';
import type { Doc, Entity } from '@/lib/cad/model';

let pass = 0;
let fail = 0;
function ok(name: string, cond: boolean, detail?: string) {
  if (cond) pass += 1;
  else {
    fail += 1;
    console.error('  ✗', name, detail ?? '');
  }
}

const tuong = { id: 'w1', type: 'hatch', layer: '0', points: [] } as unknown as Entity;
const doc = { entities: [tuong] } as unknown as Doc;
const SPECS = [
  { id: 'spec-soi', sku: 'IF-MAT-GO-SOI' },
  { id: 'spec-ocho', sku: 'IF-MAT-GO-OC-CHO' },
];

console.log('nhận diện món vật liệu');
ok('kệ kho vật liệu ⇒ nhận', laMonVatLieu({ shelfId: 'common-atlas' }));
ok('kind material ⇒ nhận', laMonVatLieu({ kind: 'material' }));
ok('preset dựng ảnh ⇒ KHÔNG nhận', !laMonVatLieu({ shelfId: 'render-preset', kind: 'preset' }));
ok('theme ⇒ KHÔNG nhận', !laMonVatLieu({ shelfId: 'common-theme' }));

console.log('tra mã → ProductSpec.id');
ok('khớp sku ⇒ ra đúng id', traSpecId('IF-MAT-GO-SOI', SPECS) === 'spec-soi');
ok('khớp không phân biệt hoa/thường + khoảng trắng', traSpecId('  if-mat-go-soi ', SPECS) === 'spec-soi');
ok('mã lạ ⇒ null, KHÔNG bịa id', traSpecId('IF-MAT-KHONG-CO', SPECS) === null);
ok('mã rỗng ⇒ null', traSpecId('   ', SPECS) === null);
ok('kho rỗng ⇒ null (máy sạch chưa có spec nào)', traSpecId('IF-MAT-GO-SOI', []) === null);
ok('gán tay thắng khớp mã', traSpecId('IF-MAT-GO-SOI', SPECS, 'spec-ocho') === 'spec-ocho');
ok('gán tay trỏ spec đã bị xoá ⇒ rơi về khớp mã, không giữ id chết',
  traSpecId('IF-MAT-GO-SOI', SPECS, 'spec-da-xoa') === 'spec-soi');

console.log('ghi specId vào entity');
const kq = ganSpecVaoEntity(doc, 'w1', 'spec-soi');
ok('gán được ⇒ ok', kq.ok === true);
ok('entity mới mang đúng specId', kq.entityMoi?.specId === 'spec-soi');
ok('KHÔNG sửa tại chỗ — entity gốc còn nguyên', tuong.specId === undefined);
ok('chỉ thêm ĐÚNG khoá nối, không chép tên/giá/PBR (luật 2.1.9.i)',
  Object.keys(kq.entityMoi ?? {}).filter((k) => !Object.keys(tuong).includes(k)).join(',') === 'specId');
ok('chưa chọn gì ⇒ lý do "chua-chon"', ganSpecVaoEntity(doc, null, 'spec-soi').lyDo === 'chua-chon');
ok('entity đã bị xoá ⇒ lý do "entity-mat"', ganSpecVaoEntity(doc, 'w-khong-co', 'spec-soi').lyDo === 'entity-mat');
ok('mọi ngả trượt đều CÓ lý do (không im lặng)',
  [ganSpecVaoEntity(doc, null, 's'), ganSpecVaoEntity(doc, 'x', 's')].every((r) => !r.ok && !!r.lyDo));

console.log('câu báo — không câu nào nói "đã áp"');
const LY_DO = ['chua-chon', 'khong-co-entity', 'entity-mat', 'khong-tra-duoc-ma', 'khong-phai-vat-lieu'] as const;
for (const l of LY_DO) {
  const c = cauBaoKhongGan(l, 'Gỗ sồi tự nhiên');
  ok(`"${l}" có cả VI lẫn EN`, !!c.vi && !!c.en);
  ok(`"${l}" KHÔNG khẳng định đã áp`, !/^Đã áp|^Applied/.test(c.vi) && !/^Applied/.test(c.en));
  ok(`"${l}" nêu tên món để người dùng biết đang nói về cái gì`,
    c.vi.includes('Gỗ sồi tự nhiên') || l === 'khong-co-entity');
}

console.log(`\n${pass} pass · ${fail} fail`);
if (fail > 0) process.exit(1);
