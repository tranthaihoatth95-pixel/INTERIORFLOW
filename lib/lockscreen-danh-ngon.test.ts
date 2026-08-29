/**
 * Cổng chống BỊA cho bảng danh ngôn.
 *
 * Luật cũ ở `LockScreen.tsx` cấm hẳn "trích dẫn gán tên tác giả" — vì sợ bịa câu rồi gán bừa
 * một cái tên (họ hàng của `F-NHAN-BIA`). Hoà đè luật đó 29/08: được trích, nhưng phải THẬT.
 * Cấm cả loại thì không cần cổng; cho phép có điều kiện thì BẮT BUỘC phải có cổng, nếu không
 * điều kiện đó chỉ là lời chúc.
 *
 * Máy không kiểm được câu có thật hay không — đó là việc của người thêm. Cái máy kiểm được là
 * **người thêm có buộc phải khai nguồn hay không**. Thiếu ô nguồn ⇒ đỏ.
 */
import { DANH_NGON, danhNgonNgauNhien } from './lockscreen-danh-ngon';

let ok = 0;
let fail = 0;
const la = (dieu: boolean, vi: string) => {
  if (dieu) { ok++; console.log(`  ok  - ${vi}`); }
  else { fail++; console.log(`  FAIL- ${vi}`); }
};

la(DANH_NGON.length >= 12, `bảng có đủ câu để không lặp sớm (${DANH_NGON.length} câu)`);

// ── mong THẤY: mỗi câu khai đủ bốn ô bắt buộc (F-17 — phải có ca khẳng định, không chỉ phủ định)
for (const c of DANH_NGON) {
  const nhan = c.ai || '(không tên)';
  la(!!c.en.trim() && !!c.vi.trim(), `${nhan} — có cả nguyên văn lẫn bản dịch`);
  la(!!c.ai.trim() && !!c.vai.trim(), `${nhan} — khai đủ TÊN và VAI`);
  la(!!c.nguon.trim(), `${nhan} — KHAI NGUỒN (ô chặn việc bịa)`);
}

// ── không trùng câu, không trùng nguyên văn
la(new Set(DANH_NGON.map((c) => c.en)).size === DANH_NGON.length, 'không có câu nào lặp lại');

// ── trích NGẮN: một câu, không phải cả đoạn (giữ trong giới hạn trích dẫn hợp lý)
for (const c of DANH_NGON) {
  la(c.en.split(/\s+/).length <= 30, `${c.ai} — trích ngắn (${c.en.split(/\s+/).length} chữ)`);
}

// ── bốc ngẫu nhiên: không bao giờ trả về cùng câu hai lần LIÊN TIẾP
let lap = 0;
let truoc = danhNgonNgauNhien().en;
for (let i = 0; i < 200; i++) {
  const nay = danhNgonNgauNhien().en;
  if (nay === truoc) lap++;
  truoc = nay;
}
la(lap === 0, `200 lần bốc, không lần nào lặp ngay câu vừa hiện (${lap} lần lặp)`);

// ── phủ được cả bảng nếu bốc đủ nhiều (không kẹt vào vài câu)
const gap = new Set<string>();
for (let i = 0; i < 3000; i++) gap.add(danhNgonNgauNhien().ai);
la(gap.size === new Set(DANH_NGON.map((c) => c.ai)).size, `bốc đủ nhiều thì mọi tác giả đều xuất hiện (${gap.size})`);

console.log(`\n${ok} ok, ${fail} fail`);
if (fail) process.exit(1);
