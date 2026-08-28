/**
 * _chu-thich.mjs — MỘT CỖ MÁY: "vị trí này có nằm trong chú thích không?"
 *
 * Vì sao tách ra dùng chung (28/08): hai máy soi độc lập cùng mắc **một** lỗi — soi trúng
 * **lời kể về mã** rồi báo như thể đó là **mã**:
 *   · `soi-foundation` họ `F-NHAN-BIA` — lượt đầu bắt luôn chú thích của chính bản vá, nơi mẫu
 *     cũ được trích lại để giải thích vì sao nó sai.
 *   · `soi-thao-tac` luật `kinh-webkit-prefix` — báo đỏ **3 tệp** chỉ vì chúng **nhắc**
 *     `backdrop-filter` trong chú thích, để giải thích vì sao chúng **KHÔNG** dùng nó.
 *
 * Một máy soi không phân biệt được **mã** với **lời kể về mã** thì nó soi văn bản, không soi
 * phần mềm. Chép hàm này sang tệp thứ hai là bắt đầu phân kỳ (M-26) ⇒ để đúng một bản, ở đây.
 */

/** `i` có nằm trong `// …` cùng dòng, hoặc trong khối `/* … *\/` không? */
export function trongChuThich(src, i) {
  const dauDong = src.lastIndexOf('\n', i) + 1;
  const dong = src.slice(dauDong, i);
  if (/(^|[^:])\/\//.test(dong)) return true;
  const moKhoi = src.lastIndexOf('/*', i);
  const dongKhoi = src.lastIndexOf('*/', i);
  return moKhoi > dongKhoi;
}

/** Bỏ mọi chú thích khỏi nguồn, GIỮ NGUYÊN số ký tự (thay bằng khoảng trắng) để số dòng không lệch. */
export function boChuThich(src) {
  let ra = '', i = 0;
  while (i < src.length) {
    if (src[i] === '/' && src[i + 1] === '/') {
      const het = src.indexOf('\n', i); const k = het === -1 ? src.length : het;
      ra += ' '.repeat(k - i); i = k;
    } else if (src[i] === '/' && src[i + 1] === '*') {
      const het = src.indexOf('*/', i + 2); const k = het === -1 ? src.length : het + 2;
      ra += src.slice(i, k).replace(/[^\n]/g, ' '); i = k;
    } else { ra += src[i]; i++; }
  }
  return ra;
}
