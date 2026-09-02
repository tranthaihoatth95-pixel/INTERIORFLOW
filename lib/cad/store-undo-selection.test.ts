/**
 * Test D1 — UNDO/REDO PHẢI GIỮ VẬT ĐANG CHỌN, chỉ bỏ id đã biến mất.
 * Chạy: node_modules/.bin/sucrase-node lib/cad/store-undo-selection.test.ts
 *
 * ── LUẬT ĐANG CANH ───────────────────────────────────────────────────────────────────────────
 * Undo = *"trả lại trạng thái trước"*, KHÔNG phải *"bỏ chọn"*. Bản cũ (`selection: []`) tránh
 * được một lỗi thật — con trỏ trỏ vào entity không còn trong doc mới — bằng cách vứt luôn cả
 * phần vẫn dùng được. Đây là ca chống việc ai đó "dọn cho an toàn" lần nữa.
 *
 * Test này KHÔNG dựng store zustand; nó kiểm phép lọc bằng chính hai bất biến mà store dựa vào,
 * cộng một ca đọc mã nguồn để chặn đường quay lại `selection: []`. Lý do: hàm lọc là chỗ SAI
 * được, còn phần nối dây thì `tsc` đã canh.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';

const src = readFileSync(path.join(process.cwd(), 'lib/cad/store.ts'), 'utf8');

let pass = 0;
let fail = 0;
function ok(name: string, cond: boolean) {
  if (cond) { pass++; console.log('  ok  -', name); }
  else { fail++; console.log('  FAIL-', name); }
}

/** Bản sao HÀNH VI của `locChonConSong` trong store — giữ khớp bằng ca đọc mã ở khối [3]. */
function locChonConSong(selection: string[], doc: { entities: { id: string }[] }): string[] {
  if (!selection.length) return selection;
  const conSong = new Set(doc.entities.map((e) => e.id));
  const giu = selection.filter((id) => conSong.has(id));
  return giu.length === selection.length ? selection : giu;
}

const doc = (...ids: string[]) => ({ entities: ids.map((id) => ({ id })) });

/* ⚠️ Neo phải là `<ten>: () =>\n    set(` chứ KHÔNG phải `<ten>: () =>`.
 * Bản đầu của ca này dùng neo ngắn và nó trúng **dòng KHAI BÁO KIỂU** ở đầu tệp
 * (`undo: () => void;`), nên cửa sổ cắt ra không hề chứa phần thi công — hai ca "đi qua hàm
 * lọc" đỏ trong khi mã hoàn toàn đúng. Đúng họ bệnh bàn 06 ghi hôm nay: dụng cụ trả lời rất
 * đúng một câu hỏi khác. Giữ lời chứng ở đây vì cái bẫy nằm ngay trong cách viết ca đọc-mã. */
const than = (ten: string) => {
  const i = src.indexOf(`${ten}: () =>\n    set(`);
  return i < 0 ? '' : src.slice(i, i + 420);
};

console.log('[1] GIỮ — id còn trong doc thì chọn còn');
{
  ok('một vật, còn tồn tại ⇒ giữ nguyên', JSON.stringify(locChonConSong(['a'], doc('a', 'b'))) === '["a"]');
  ok('nhiều vật, còn hết ⇒ giữ hết đúng thứ tự', JSON.stringify(locChonConSong(['b', 'a'], doc('a', 'b', 'c'))) === '["b","a"]');
  /* Đường NÓNG: giữ Ctrl+Z là hàng chục lượt/giây. Trả mảng MỚI mỗi lượt sẽ bắt mọi thứ đăng ký
   * `selection` vẽ lại dù chẳng có gì đổi. */
  ok('không có gì bị loại ⇒ trả CHÍNH mảng cũ (không sinh mảng mới)', (() => {
    const sel = ['a', 'b'];
    return locChonConSong(sel, doc('a', 'b')) === sel;
  })());
  ok('vùng chọn rỗng ⇒ trả chính nó, không dựng gì', (() => {
    const sel: string[] = [];
    return locChonConSong(sel, doc('a')) === sel;
  })());
}

console.log('[2] LỌC — id đã biến mất thì phải rụng (đây là lý do KHÔNG giữ nguyên cả mảng)');
{
  /* Ca thật: vừa vẽ xong một tường rồi Ctrl+Z ⇒ doc lùi về lúc tường đó CHƯA TỒN TẠI. */
  ok('vật vừa vẽ rồi undo ⇒ id đó rụng khỏi vùng chọn', JSON.stringify(locChonConSong(['moi'], doc('a', 'b'))) === '[]');
  ok('chọn hỗn hợp ⇒ giữ cái còn, bỏ cái mất', JSON.stringify(locChonConSong(['a', 'moi', 'b'], doc('a', 'b'))) === '["a","b"]');
  ok('doc rỗng ⇒ rụng hết, KHÔNG ném lỗi', JSON.stringify(locChonConSong(['a'], doc())) === '[]');
  ok('không giữ lại con trỏ trỏ vào hư không', locChonConSong(['x'], doc('a')).length === 0);
}

console.log('[3] ĐƯỜNG QUAY LẠI PHẢI ĐÓNG — chặn ai đó "dọn cho an toàn" lần nữa');
{
  /* Chỉ đọc trong thân `undo`/`redo`, KHÔNG đọc cả tệp: `selection: []` là giá trị khởi tạo
   * hợp lệ ở nhiều chỗ khác (state ban đầu, nạp doc mới, đóng bản vẽ) — quét cả tệp là ca MÙ,
   * nó sẽ đỏ vì những dòng hoàn toàn đúng. */
  ok('tìm được thân undo', than('undo').length > 0);
  ok('tìm được thân redo', than('redo').length > 0);
  ok('undo KHÔNG còn trả selection rỗng', !/selection:\s*\[\]/.test(than('undo')));
  ok('redo KHÔNG còn trả selection rỗng', !/selection:\s*\[\]/.test(than('redo')));
  ok('undo đi qua hàm lọc', /selection:\s*locChonConSong\(/.test(than('undo')));
  ok('redo đi qua hàm lọc', /selection:\s*locChonConSong\(/.test(than('redo')));

  /* Bản THẬT phải lọc bằng Set, không phải `find` lồng vòng lặp: bản vẽ thật hàng chục nghìn
   * entity, `O(n·m)` trên đường undo là khựng tay người dùng. */
  const ham = src.slice(src.indexOf('function locChonConSong'), src.indexOf('function clone'));
  ok('hàm lọc dùng Set (không quét lồng nhau)', /new Set\(/.test(ham) && !/\.find\(/.test(ham));

  /* Bản sao hành vi ở đầu tệp này phải KHỚP bản thật — nếu không, mọi ca [1][2] đang đo một
   * hàm không ai chạy. Đây đúng là "cổng hoá mù khi vật bị dời khỏi tầm đo" (bàn 06, 02/09). */
  ok('bản thật cũng trả chính mảng cũ khi không loại gì', /giu\.length === selection\.length \? selection : giu/.test(ham));
  ok('bản thật cũng thoát sớm khi vùng chọn rỗng', /if \(!selection\.length\) return selection;/.test(ham));
}

console.log('[4] ĐỐI CHỨNG — bản cũ (selection rỗng) phải bị các ca trên bắt');
{
  const cu = 'undo: () =>\n set((s) => {\n  return { doc: prev, selection: [] };\n }),';
  ok('bản CŨ có selection rỗng trong thân undo ⇒ ca [3] bắt được', /selection:\s*\[\]/.test(cu));
  ok('bản CŨ không đi qua hàm lọc ⇒ ca [3] bắt được', !/locChonConSong/.test(cu));
  ok('bản THẬT khác bản CŨ ở đúng điểm đang canh', /locChonConSong/.test(than('undo')) && !/selection:\s*\[\]/.test(than('undo')));
}

console.log(`\n${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
