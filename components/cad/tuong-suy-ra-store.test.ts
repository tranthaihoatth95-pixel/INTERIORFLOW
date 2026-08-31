/**
 * CA ĐỘT BIẾN cho công tắc "Tường nhận diện" (IF-301).
 *
 * Ca quan trọng nhất ở đây là ca **XANH**, không phải ca đỏ: cái bẫy thật của việc này là ẩn
 * NHẦM nét DXF gốc của khách. Tường suy ra giữ nguyên layer nguồn (`A-Draw`), nên mọi cách lọc
 * theo layer đều ăn mất bản vẽ khách — và người dùng sẽ thấy nó như "app làm mất bản vẽ".
 */
import { locTuongSuyRa, laTuongSuyRa } from './tuong-suy-ra-store';
import { tuongThanhEntities } from '../../lib/cad/tuong-hinh-hoc';
import type { Doc, Entity } from '../../lib/cad/model';

let ok = 0, fail = 0;
const la = (ten: string, duoc: unknown, mong: unknown) => {
  const d = JSON.stringify(duoc), m = JSON.stringify(mong);
  if (d === m) { ok++; console.log(`  ok  - ${ten}`); }
  else { fail++; console.log(`  FAIL- ${ten}\n        mong ${m}\n        được ${d}`); }
};

console.log('── CÔNG TẮC TƯỜNG NHẬN DIỆN ──');

/* ① Entity sinh ra PHẢI mang dấu nguồn gốc — không có dấu thì công tắc không có gì để bám. */
const sinh = tuongThanhEntities([
  { ax: 0, ay: 0, bx: 5000, by: 0, d: 200, layer: 'A-Draw' } as any,
]);
la('① tường suy ra mang cờ `inferred` (K3 — suy đoán phải LỘ RA)', sinh.every((e) => e.inferred === true), true);
la('① … và vẫn là tường thật của IF (`elementType: wall`) để 3D/BOQ thấy được', sinh.every((e) => e.elementType === 'wall'), true);
la('① … và GIỮ layer nguồn (trung tính, không nhét tên layer studio vào bản vẽ khách)', sinh.every((e) => e.layer === 'A-Draw'), true);

/* ② Cái bẫy: nét gốc của khách nằm CÙNG layer với tường suy ra. */
const netGoc: Entity = { id: 'goc-1', type: 'line', layer: 'A-Draw', a: { x: 0, y: 0 }, b: { x: 5000, y: 0 } } as any;
const tuongTay: Entity = { id: 'tay-1', type: 'polyline', layer: 'A-Draw', points: [], closed: true, elementType: 'wall', wallThicknessMm: 200 } as any;
const doc = { entities: [netGoc, tuongTay, ...sinh] } as unknown as Doc;

const tat = locTuongSuyRa(doc, false);
la('② ⛔ TẮT công tắc → nét DXF GỐC cùng layer VẪN CÒN (đây là ca đắt nhất nếu sai)',
  tat.entities.some((e) => e.id === 'goc-1'), true);
la('② ⛔ TẮT công tắc → tường NGƯỜI VẼ TAY vẫn còn (không có `inferred`)',
  tat.entities.some((e) => e.id === 'tay-1'), true);
la('② TẮT công tắc → chỉ tường MÁY SUY biến mất', tat.entities.filter(laTuongSuyRa).length, 0);
la('② TẮT công tắc → đúng số entity còn lại', tat.entities.length, 2);

/* ③ Ống kính KHÔNG được đụng dữ liệu gốc — phiếu cấm sửa Doc, cấm xoá entity. */
la('③ Doc GỐC không bị đụng: số entity nguyên vẹn sau khi lọc', doc.entities.length, 2 + sinh.length);
la('③ bật lại → trả ĐÚNG THAM CHIẾU cũ (không sao chép ở đường nóng vẽ khung hình)',
  locTuongSuyRa(doc, true) === doc, true);
la('③ bản vẽ KHÔNG có tường suy ra → cũng trả đúng tham chiếu cũ, không sinh rác',
  locTuongSuyRa({ entities: [netGoc] } as unknown as Doc, false).entities.length, 1);

/* ④ Cờ chỉ có nghĩa khi ĐI KÈM elementType (bất biến của `model.ts` A5·G-M1-09). */
const inferredKhongPhaiTuong: Entity = { id: 'x', type: 'line', layer: 'L', inferred: true } as any;
la('④ `inferred` mà KHÔNG phải tường → công tắc KHÔNG được đụng tới', laTuongSuyRa(inferredKhongPhaiTuong), false);

console.log(`\n${ok} ok, ${fail} fail`);
if (fail) process.exit(1);
