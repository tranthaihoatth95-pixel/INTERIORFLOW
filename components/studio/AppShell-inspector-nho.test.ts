/**
 * Test D2 — INSPECTOR PHẢI NHỚ TRẠNG THÁI ẨN/HIỆN THEO CHẶNG.
 * Chạy: node_modules/.bin/sucrase-node components/studio/AppShell-inspector-nho.test.ts
 *
 * ── VÌ SAO CỔNG NÀY ĐỌC MÃ NGUỒN CHỨ KHÔNG DỰNG REACT ────────────────────────────────────────
 * Thứ dễ hỏng ở đây KHÔNG phải phép tính — nó là một THÓI QUEN GÕ: ai đó thêm một chỗ đổi
 * trạng thái mới rồi gọi thẳng `setInspectorHidden`, thế là chỗ đó đổi mà không nhớ. Bug quay
 * lại đúng một nửa, và nửa còn lại vẫn xanh nên không ai thấy. Cổng đo được đúng thứ đó là cổng
 * đọc CHỖ GỌI, không phải cổng dựng cây React rồi bấm thử một đường.
 * ⚠️ Hệ quả phải nói thẳng: cổng này KHÔNG chứng minh app chạy đúng trên trình duyệt. Nó chỉ
 * chặn con đường đã biết là dẫn tới lỗi. Bằng chứng runtime là ẢNH sau khi tải lại trang.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';

const src = readFileSync(path.join(process.cwd(), 'components/studio/AppShell.tsx'), 'utf8');

let pass = 0;
let fail = 0;
function ok(name: string, cond: boolean) {
  if (cond) { pass++; console.log('  ok  -', name); }
  else { fail++; console.log('  FAIL-', name); }
}

console.log('D2 — Inspector nhớ trạng thái theo chặng');

/** Đếm số lần gọi `setInspectorHidden(` — KHÔNG tính dòng khai báo `const [..., setX] = useState`. */
function soChoGoiThang(text: string): number {
  return text
    .split('\n')
    .filter((d) => /setInspectorHidden\s*\(/.test(d) && !/useState/.test(d))
    .length;
}

{
  ok('có khoá localStorage RIÊNG cho việc này', /interiorflow\.inspector-an/.test(src));

  ok(
    'khoá mang theo CHẶNG — không phải một cờ chung cho cả app',
    /interiorflow\.inspector-an\.\$\{active\}/.test(src),
  );

  /* Trộn ý nghĩa vào khoá đang có là cách một lựa chọn âm thầm đè lựa chọn khác. */
  ok('KHÔNG ghi đè khoá cadMode', !/localStorage\.(setItem|removeItem)\(\s*['"`][^'"`]*cadMode/.test(src));

  ok('có đường đặt-VÀ-nhớ dùng chung (datAnInspector)', /const\s+datAnInspector\s*=/.test(src));

  /* ĐÚNG HAI chỗ được gọi thẳng, và cả hai đều KHÔNG phải "chỗ người dùng đổi trạng thái":
   *   ① lượt NẠP trong `useEffect` — nạp thì cố ý không ghi lại, ghi lại lúc nạp là biến giá
   *      trị mặc định thành giá trị "đã chọn";
   *   ② ruột của chính `datAnInspector`.
   * ⚠️ Con số 2 một mình là ca YẾU: thêm một chỗ gọi thẳng rồi bỏ đi một chỗ khác thì vẫn = 2.
   * Nên ca dưới đo con số, còn ba ca kế đo TỪNG LỐI người dùng thật sự đổi trạng thái. */
  ok('chỉ 2 chỗ gọi thẳng, cả hai đều không phải lối người dùng đổi', soChoGoiThang(src) === 2);

  /* Ba lối đổi trạng thái CÓ THẬT trên app — phím ⌘\ (zen) · phím I/⇧I · dải tay cầm mép phải.
   * Đây mới là chỗ bệnh D2 sống: đổi được mà không nhớ. Mỗi lối một ca, đúng luật "một con số
   * đừng chở hai luật" (bàn 06, 02/09). */
  ok('lối ⌘\\ (zen) đi qua datAnInspector', /datAnInspector\(zen\)/.test(src));
  ok('lối phím I / ⇧I đi qua datAnInspector', /datAnInspector\(!anRef\.current\)/.test(src));
  ok('lối dải tay cầm mép phải đi qua datAnInspector', /onClick=\{\(\)\s*=>\s*datAnInspector\(false\)\}/.test(src));

  ok(
    'lượt nạp nằm trong useEffect, KHÔNG trong hàm khởi tạo useState',
    /useState\(false\)/.test(src) && !/useState\(\s*\(\s*\)\s*=>[\s\S]{0,200}localStorage/.test(src),
  );

  /* Máy chủ không có localStorage, và chế độ riêng tư còn NÉM khi đọc. Không bọc thì cả vỏ app
   * trắng màn — cái giá lớn hơn nhiều so với việc quên một lựa chọn panel. */
  ok('mọi lượt chạm localStorage đều bọc try/catch', (() => {
    const chams = src.split('\n').map((d, i) => [d, i] as const).filter(([d]) => /localStorage\.(get|set)Item/.test(d));
    return chams.length > 0 && chams.every(([d]) => /try\s*\{/.test(d));
  })());

  /* 🔴 MẶC ĐỊNH = HIỆN. Phiếu D2 ghi "rơi về mặc định ẩn"; lát này CỐ Ý không làm theo — đổi
   * mặc định là đổi thứ MỌI người dùng thấy ở lần mở đầu, tức hồi quy đội lốt tính năng nhớ,
   * và ngược C-1 ("Inspector luôn có mặt", mẫu 3ds Max). Khoá bằng ca để lần sau ai đổi thì
   * phải đổi có ý thức, không đổi bằng một cú sửa nhanh. */
  ok('không đọc được lựa chọn cũ ⇒ HIỆN (an = false), không phải ẩn', /an\s*=\s*false/.test(src));
  ok('chỉ chuỗi "1" mới đọc thành ĐANG ẨN', /getItem\(KHOA_INSPECTOR_AN\)\s*===\s*'1'/.test(src));
}

/* ── ĐỐI CHỨNG — cổng luôn xanh là cổng vô dụng. Bản GIẢ dưới đây tái hiện đúng bệnh D2
 * (đổi trạng thái mà không nhớ) và phải bị bắt. Thiếu khối này thì hàm đếm ở trên có thể hỏng
 * âm thầm (vd regex sai) mà mọi ca vẫn xanh. */
console.log('ĐỐI CHỨNG — bản cố tình sai phải bị bắt');
{
  const gia = [
    "const [inspectorHidden, setInspectorHidden] = useState(false);",
    "  setInspectorHidden(zen);",
    "  else setInspectorHidden((h) => !h);",
    "  onClick={() => setInspectorHidden(false)}",
  ].join('\n');
  ok('bản GIẢ có 3 chỗ gọi thẳng ⇒ hàm đếm bắt được (không phải 2)', soChoGoiThang(gia) === 3);
  ok('bản GIẢ: không lối nào đi qua datAnInspector ⇒ ba ca lối đường đều bắt được', !/datAnInspector/.test(gia));
  ok('bản GIẢ không có khoá nhớ ⇒ ca khoá bắt được', !/interiorflow\.inspector-an/.test(gia));
  ok('bản THẬT khác bản GIẢ ở đúng điểm đang canh', soChoGoiThang(src) !== soChoGoiThang(gia));
}

console.log(`\n${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
