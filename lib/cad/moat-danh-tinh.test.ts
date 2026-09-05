/**
 * lib/cad/moat-danh-tinh.test.ts — MÁY CANH cho SỢI DÂY TỪ ĐƯỜNG UI XUỐNG `Doc`.
 * Chạy: node_modules/.bin/sucrase-node lib/cad/moat-danh-tinh.test.ts
 *
 * ⛔ VÌ SAO CÓ FILE NÀY, TRONG KHI ĐÃ CÓ `moat-chuoi.test.ts`:
 * file kia canh **tầng mô hình** (`replaceMaterialReferences` · `computeBoq` · `.idf` round-trip)
 * và nó xanh suốt — trong khi đường người dùng thật vẫn đứt. Đứt ở đâu: `applyMaterial()` chỉ đổi
 * `pattern`/`scale`/`angle`, KHÔNG đụng `specId` ⇒ **hình đổi mà danh tính đứng yên**; và vùng tô
 * mới vẽ rơi xuống bản vẽ **không mã nào**. Máy móc xuôi dòng có đủ, chỉ thiếu dây.
 * ⇒ File này canh ĐÚNG khúc đó: hợp đồng của `applyMaterial` và `replaceMaterial` trên store.
 *
 * 🔴 KỶ LUẬT (học từ ca Hough, 00-CHOT 15/08): file này chỉ khoá cái ĐÃ CHỨNG MINH CHẠY trên app
 * thật (`scripts/nghiem-thu-g4-moat-danh-tinh.mjs`, 13/13 ngày 04/09). KHÔNG khẳng định "trả về
 * đường thoái lui" ở bất kỳ chỗ nào còn đứt — viết thế là biến lỗi thành hợp đồng.
 *
 * THUẦN — không DOM/FS/mạng. Dùng ĐÚNG store sản xuất, không bản mô phỏng nào.
 */
import { useCadStore, newId } from './store';
import { replaceMaterialReferences } from '../materials/impact';
import type { Doc, HatchEntity } from './model';

let pass = 0;
let fail = 0;
function ok(nhan: string, dieu: boolean, chiTiet = '') {
  if (dieu) { pass += 1; console.log(`  ok  - ${nhan}${chiTiet ? ` — ${chiTiet}` : ''}`); }
  else { fail += 1; console.log(`  FAIL- ${nhan}${chiTiet ? ` — ${chiTiet}` : ''}`); }
}

const A = 'ps-soi';
const B = 'ps-ocho';

function dungBanVe(specId?: string): { docId: string } {
  const st = useCadStore.getState();
  st.reset();
  const id = newId('e');
  st.addEntity({
    id, type: 'hatch', layer: st.currentLayer,
    points: [{ x: 0, y: 0 }, { x: 4000, y: 0 }, { x: 4000, y: 3000 }, { x: 0, y: 3000 }],
    pattern: 'ANSI31', patternScale: 1, patternAngle: 0,
    ...(specId ? { specId } : {}),
  } as HatchEntity);
  return { docId: id };
}
const hatchCua = (doc: Doc, id: string) => doc.entities.find((e) => e.id === id) as HatchEntity | undefined;

/* ═════════ ① Vẽ vùng tô mới: mã "đang cầm" đi xuống entity ═════════ */
console.log('① Vật liệu đang cầm — vùng tô vẽ sau đó phải MANG SẴN mã');
{
  const st = useCadStore.getState();
  st.reset();
  // Không chọn gì ⇒ `applyMaterial` chỉ đặt "vật liệu đang cầm để vẽ tiếp".
  st.applyMaterial('Sàn gỗ sồi', 'ANSI31', 1, 0, '#b98a54', A);
  ok('mã kho được giữ lại làm mã cho nét vẽ kế tiếp', useCadStore.getState().hatchSpecId === A,
    `hatchSpecId=${useCadStore.getState().hatchSpecId}`);
  ok('đồng thời chuyển sang công cụ Hatch (hành vi cũ, không đổi)', useCadStore.getState().tool === 'hatch');

  // Nhánh "pattern kỹ thuật chỉnh tay" CỐ Ý buông mã — không nhận vơ danh tính.
  useCadStore.getState().setHatchPattern('ANSI37');
  ok('gõ pattern tay ⇒ BUÔNG mã, không gán bừa danh tính cho nét tự chỉnh',
    useCadStore.getState().hatchSpecId === null, `hatchSpecId=${useCadStore.getState().hatchSpecId}`);
}

/* ═════════ ② Đổi vật liệu trên vật ĐANG CHỌN: hình VÀ danh tính cùng đổi ═════════ */
console.log('\n② Đổi vật liệu vật đang chọn — HÌNH và DANH TÍNH đổi CÙNG LÚC');
{
  const { docId } = dungBanVe(A);
  useCadStore.getState().select([docId]);
  useCadStore.getState().applyMaterial('Sàn gỗ óc chó', 'ANSI37', 2, 45, '#5a3a26', B);

  const h = hatchCua(useCadStore.getState().doc, docId)!;
  ok('HÌNH đổi', h.pattern === 'ANSI37' && h.patternScale === 2 && h.patternAngle === 45,
    `pattern=${h.pattern} scale=${h.patternScale} angle=${h.patternAngle}`);
  ok('MÀU đổi theo vật liệu (nguồn màu mặt sàn 3D đọc, `cad-to-obj.slabMat`)', h.color === '#5a3a26', `color=${h.color}`);
  ok('DANH TÍNH đổi — đây là chỗ đứt trước 04/09', h.specId === B, `specId=${h.specId}`);
  ok('lùi được: ⌘Z trả về đúng mã cũ', (() => {
    useCadStore.getState().undo();
    return hatchCua(useCadStore.getState().doc, docId)?.specId === A;
  })(), `sau undo specId=${hatchCua(useCadStore.getState().doc, docId)?.specId}`);
}

/* ═════════ ③ KHÔNG truyền mã ⇒ GIỮ NGUYÊN mã đang có (cấm xoá mã im lặng) ═════════ */
console.log('\n③ Nơi gọi cũ (5 tham số) — giữ nguyên mã, không xoá im lặng');
{
  const { docId } = dungBanVe(A);
  useCadStore.getState().select([docId]);
  // Đúng chữ ký cũ: KHÔNG có tham số thứ 6.
  useCadStore.getState().applyMaterial('Gạch bông', 'DOTS', 1, 0, '#c0392b');
  const h = hatchCua(useCadStore.getState().doc, docId)!;
  ok('hình đổi theo preset thị giác', h.pattern === 'DOTS');
  ok('mã CŨ còn nguyên — mất mã im lặng còn tệ hơn không đổi', h.specId === A, `specId=${h.specId}`);
}

/* ═════════ ④ Phạm vi RỘNG đi qua ĐÚNG engine đã có, có Undo ═════════ */
console.log('\n④ Đổi toàn dự án — cùng engine `replaceMaterialReferences`, và lùi được');
{
  const st = useCadStore.getState();
  st.reset();
  const id1 = newId('e');
  const id2 = newId('e');
  for (const id of [id1, id2]) {
    useCadStore.getState().addEntity({
      id, type: 'hatch', layer: useCadStore.getState().currentLayer,
      points: [{ x: 0, y: 0 }, { x: 1000, y: 0 }, { x: 1000, y: 1000 }, { x: 0, y: 1000 }],
      pattern: 'ANSI31', specId: A,
    } as HatchEntity);
  }
  const truoc = useCadStore.getState().doc;
  const soDoi = useCadStore.getState().replaceMaterial(A, B);
  ok('đổi đúng SỐ tham chiếu, và đúng bằng số engine tự đếm', soDoi === 2
    && soDoi === replaceMaterialReferences(truoc, A, B).changedReferences, `${soDoi}`);
  ok('mọi vùng tô mang mã mới', useCadStore.getState().doc.entities.every((e) => (e as HatchEntity).specId === B));
  ok('lùi được một nhịp về đúng trạng thái cũ', (() => {
    useCadStore.getState().undo();
    return useCadStore.getState().doc.entities.every((e) => (e as HatchEntity).specId === A);
  })());
  ok('không có gì để đổi ⇒ KHÔNG tốn một nấc Undo rỗng', (() => {
    const trc = useCadStore.getState().past.length;
    const n = useCadStore.getState().replaceMaterial('ps-khong-ton-tai', B);
    return n === 0 && useCadStore.getState().past.length === trc;
  })());
}

console.log(`\n${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
