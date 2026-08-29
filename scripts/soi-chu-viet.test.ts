/**
 * CA ĐỘT BIẾN cho `soi-chu-viet.mjs` — cổng chỉ là cổng khi có ca chứng minh nó BẮT ĐƯỢC.
 *
 * Theo F-17: nhóm chỉ toàn kỳ vọng phủ định thì không tin được ⇒ có cả ca **mong THẤY** (ĐỎ)
 * lẫn ca **mong KHÔNG THẤY** (XANH). Ca XANH quan trọng ngang ca ĐỎ ở đây: `leading-tight` trên
 * `"BOQ"` là **HỢP LỆ** (V-7 — chữ kỹ thuật không dấu). Một cổng bắt cả chữ Latin không dấu thì
 * người sửa sẽ tắt nó trong tuần đầu.
 */
// `import` tĩnh không dùng được: sucrase-node biên ra CommonJS, mà `soi-chu-viet.mjs` là ESM
// (cùng khuôn mọi máy soi trong `scripts/`). Nạp động — vẫn là CÙNG MỘT tệp luật.

void (async () => {
const nap = new Function('u', 'return import(u)') as (u: string) => Promise<any>;
const { soiNguon } = await nap(new URL('./soi-chu-viet.mjs', `file://${__dirname}/`).href);

let ok = 0, fail = 0;
/** `mongViPham` = số vi phạm mong đợi; `mongUngVien` = số ứng viên mong đợi (null = không kiểm). */
const la = (ten: string, src: string, mongViPham: number, mongUngVien: number | null = null) => {
  const r = soiNguon(src, '(fixture)');
  const duocV = r.viPham.length, duocU = r.ungVien.length;
  const dat = duocV === mongViPham && (mongUngVien === null || duocU === mongUngVien);
  if (dat) { ok++; console.log(`  ok  - ${ten}`); }
  else {
    fail++;
    console.log(`  FAIL- ${ten}\n        mong viPham=${mongViPham}${mongUngVien === null ? '' : ` ungVien=${mongUngVien}`}` +
      ` · được viPham=${duocV} ungVien=${duocU}\n        ${JSON.stringify(r.viPham)}`);
  }
};

console.log('── BỐN CA ĐỘT BIẾN BẮT BUỘC ──');

// ① mong THẤY — leading-tight áp lên chữ CÓ DẤU
la('① leading-tight + chuỗi CÓ dấu → ĐỎ',
  `<p className="leading-tight">Phòng khách 36.7 m²</p>`, 1, 1);

// ② mong KHÔNG THẤY — ca quan trọng nhất: cổng không được bắt bừa chữ không dấu
la('② leading-tight + chuỗi KHÔNG dấu → XANH (vẫn là ỨNG VIÊN)',
  `<p className="leading-tight">BOQ · DXF · A3 · 1:50</p>`, 0, 1);

// ③ mong THẤY — ổ nặng nhất: text-xs Tailwind = line-height 1.333, không ai gõ con số đó
la('③ text-xs + chuỗi có dấu, KHÔNG có leading-* → ĐỎ',
  `<span className="text-xs text-[var(--t5)]">Chiều cao trần</span>`, 1, 1);

// ④ mong KHÔNG THẤY — leading-normal ghi đè 1.333 ⇒ hết vi phạm, và hết cả tư cách ứng viên
la('④ text-xs + leading-normal + chuỗi có dấu → XANH',
  `<span className="text-xs leading-normal">Chiều cao trần</span>`, 0, 0);

console.log('\n── CA PHỤ: các đường máy này đã hoặc suýt đi sai ──');

// Bẫy ① của repo: chú thích KHÔNG phải mã (F-NHAN-BIA lượt đầu · kinh-webkit-prefix)
la('chú thích NHẮC mẫu xấu để giải thích vì sao không dùng → im',
  `// CẤM leading-tight trên "Phòng khách" — dấu bị chạm\n/* tracking-tighter cũng cấm: "Tường ngăn" */\n<p className="leading-normal">Phòng khách</p>`,
  0, 0);

// mong THẤY — V-3, trục ngang. V-2 lo dọc, V-3 lo ngang; sửa một mà bỏ mục kia thì vẫn hỏng.
la('tracking-tight + chuỗi có dấu → ĐỎ', `<h2 className="tracking-tight">Bản vẽ kỹ thuật</h2>`, 1, 1);
la('tracking-tight + nhãn không dấu → XANH', `<h2 className="tracking-tight">CAD · IFC</h2>`, 0, 1);

// mong THẤY — V-6, cỡ sàn 12px
la('text-[9px] + chuỗi có dấu → ĐỎ', `<div className="text-[9px]">Đã lưu</div>`, 1, 1);
la('text-[13px] KHÔNG phải ứng viên (trên sàn)', `<div className="text-[13px]">Đã lưu</div>`, 0, 0);
la('--fs-2xs (11px) + chuỗi có dấu → ĐỎ',
  `<div style={{ fontSize: 'var(--fs-2xs)' }}>Chưa gán vật liệu</div>`, 1, 1);
la('--fs-xs (12px) ĐẠT sàn → không phải ứng viên',
  `<div style={{ fontSize: 'var(--fs-xs)' }}>Chưa gán vật liệu</div>`, 0, 0);

// mong THẤY — kiểu nội tuyến, không qua Tailwind (ổ thật lớn nhất trong repo: CadEditor/Inspector)
la('lineHeight: 1.45 nội tuyến + chữ có dấu → ĐỎ',
  `<div style={{ fontSize: 10, lineHeight: 1.45 }}>Tên studio lấy từ Brand Kit</div>`, 2, 2);
la('lineHeight: 1.6 + fontSize: 13 → không phải ứng viên',
  `<div style={{ fontSize: 13, lineHeight: 1.6 }}>Tên studio lấy từ Brand Kit</div>`, 0, 0);

// chữ nằm trong THUỘC TÍNH của thẻ tự đóng vẫn phải bắt (placeholder là ca thật ở NodeLibraryPanel)
la('thẻ tự đóng, chữ có dấu nằm trong placeholder → ĐỎ',
  `<input className="text-xs" placeholder={tr('Tìm khối…', 'Search blocks…')} />`, 1, 1);
la('thẻ tự đóng, placeholder không dấu → XANH',
  `<input className="text-xs" placeholder="DXF / DWG" />`, 0, 1);

// giới hạn 2 lớp: chữ ở lớp thứ 3 mang class riêng của nó, tính vào cha là báo oan
la('chữ nằm sâu 3 lớp con → KHÔNG tính cho thẻ cha',
  `<div className="leading-tight"><a><b><i><em className="leading-normal">Phòng khách</em></i></b></a></div>`,
  0, 1);

console.log(`\n${ok} ok, ${fail} fail`);
if (fail) process.exit(1);
})();
