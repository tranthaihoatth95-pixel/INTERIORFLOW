/**
 * Luật lớp ③ phải bắt được ca THẬT **và** không báo nhầm câu HỢP LỆ.
 * Hoà 29/08: *"nếu máy chặn mọi dòng chứa per-user + localStorage, nó có thể báo đỏ sai"* —
 * và anh đưa luôn phản ví dụ. Phản ví dụ đó là ca số 4 dưới đây; nó là lý do tệp test này tồn tại.
 * Theo F-17: nhóm chỉ toàn kỳ vọng phủ định thì không tin được, nên có cả ca **mong THẤY**.
 */
// `import` tĩnh không dùng được: sucrase-node biên ra CommonJS, mà `_cap-da-nhau.mjs` là ESM
// (cùng khuôn mọi máy soi trong `scripts/`). Nạp động — vẫn là CÙNG MỘT tệp luật, không phải
// bản sao thứ hai.


void (async () => {
// sucrase biên `await import()` thành `require()`, mà require không nạp được ESM. `new Function`
// giữ nguyên `import()` thật cho tới lúc chạy. Vẫn là CÙNG MỘT tệp luật, không phải bản sao.
const nap = new Function('u', 'return import(u)') as (u: string) => Promise<any>;
const { soiDong } = await nap(new URL('./_cap-da-nhau.mjs', `file://${__dirname}/`).href);
let ok = 0;
let fail = 0;
const la = (dong: string, mong: string | null, vi: string) => {
  const duoc = soiDong(dong);
  if (duoc === mong) {
    ok++;
    console.log(`  ok  - ${vi}`);
  } else {
    fail++;
    console.log(`  FAIL- ${vi}\n        mong ${mong} · được ${duoc}\n        « ${dong} »`);
  }
};

// ── mong THẤY: mâu thuẫn thật giữa trục Reach và trục Storage
la('Cài đặt đồng bộ theo tài khoản, lưu trong localStorage.', 'chan',
  'hứa đồng bộ tài khoản mà cất localStorage → CHẶN');
la('Preference is account-synced, persisted to IndexedDB in the browser.', 'chan',
  'account-synced + IndexedDB → CHẶN');
la('Lưu localStorage, đổi máy vẫn còn.', 'chan',
  'đổi máy vẫn còn + localStorage → CHẶN');

// ── PHẢN VÍ DỤ Hoà đưa 29/08 — câu này ĐÚNG, cấm báo đỏ
la('Thiết lập thuộc người dùng, lưu trong localStorage, chỉ có hiệu lực trên trình duyệt hiện tại.',
  null, 'PHẢN VÍ DỤ: nói đủ Owner + Storage + Reach → KHÔNG báo gì');
la('Lưu per-user trong localStorage — browser-local, đổi máy là mất.', null,
  'per-user + localStorage nhưng đã khai browser-local → KHÔNG báo');

// ── thiếu trục Reach: CẢNH BÁO, không chặn — đây đúng là chỗ câu gốc 16/08 hụt
la('Lưu lựa chọn per-user (localStorage cùng khuôn các cài đặt sẵn có).', 'canh-bao',
  'CA GỐC 16/08: có Owner + Storage, thiếu Reach → CẢNH BÁO');

// ── không liên quan thì im
la('Bảng đơn vị đo mặc định là mm.', null, 'câu thường → im');
la('Dùng IndexedDB cho ảnh tạm của phiên dựng.', null, 'chỉ có Storage, không hứa gì → im');

console.log(`\n${ok} ok, ${fail} fail`);
if (fail) process.exit(1);
})();
