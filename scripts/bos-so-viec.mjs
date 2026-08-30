/**
 * bos-so-viec.mjs — SỔ VIỆC BOS: MỘT NGUỒN, HAI NGƯỜI ĐỌC.
 *
 * ══ VÌ SAO CÓ TỆP NÀY ══
 * Hoà chốt 30/08: chia rõ **hai trạng thái** của dự án, rồi *"thiết lập 1 lệnh chạy end-to-end
 * thu 1 mẻ lớn cuối cùng"*, và *"thiết kế lại màn diễn biến 4173 … như một bản vẽ đang mô phỏng
 * luồng làm việc thật với đầy đủ nhân sự, đầu việc, mối quan hệ — trạng thái — đánh giá … chưa tới
 * thì xám chưa highlight … tối ưu cho dân designer, không phải lập trình viên."*
 *
 * Nếu lệnh và màn hình đọc hai nguồn khác nhau thì chúng SẼ lệch nhau — đó là chuyện chắc chắn
 * xảy ra, không phải rủi ro. Nên cả hai đọc đúng tệp này.
 *   · `scripts/soat-toan-dien.mjs`  chạy sổ này ⇒ một mẻ, một phán quyết
 *   · `scripts/phong-dieu-khien.mjs` vẽ sổ này  ⇒ bản đồ luồng việc ở cổng 4173
 *
 * ══ KHUÔN MẪU MƯỢN TỪ NGOÀI (Hoà yêu cầu look outside) ══
 *  · **Value stream map + swimlane** — làn theo NGƯỜI, việc chảy ngang qua các làn, trạng thái và
 *    chỗ tắc hiện ngay trên hình. Đó đúng là "bản vẽ mô phỏng luồng làm việc thật".
 *  · **Quality gate / preflight checklist** — một chuỗi cổng có thứ tự; qua hết mới được cất cánh.
 *    Điều mượn quan trọng nhất: *"release readiness là dựng chất lượng vào TRƯỚC khi viết mã"* —
 *    tức danh sách phải có trước, rồi mới dựng đường ống theo nó, không phải ngược lại.
 *
 * ══ HAI TRẠNG THÁI — Hoà chốt, và đây là ranh giới cứng ══
 *  ① `soat` · **TẦM SOÁT** — khám IF, bắt lỗi mà **chính bộ máy dựng IF** gây ra. Đây là việc cả
 *     ngày 30/08. Xong trạng thái này = mọi thứ vào khuôn, ổn định, có cổng canh.
 *  ② `dung` · **DỰNG & SHIP** — chỉ được bắt tay khi ① xanh. Việc ở đây là làm ra sản phẩm bán được.
 *  ⛔ Việc ở `dung` mà chạy khi ① còn đỏ là xây trên nền chưa đo.
 */

export const PHA = {
  soat: {
    ten: 'TẦM SOÁT',
    y: 'khám IF · bắt lỗi do chính bộ máy dựng IF gây ra · đưa mọi thứ vào khuôn',
    mau: 'soat',
  },
  dung: {
    ten: 'DỰNG & SHIP',
    y: 'làm ra sản phẩm bán được — chỉ bắt đầu khi TẦM SOÁT đã xanh',
    mau: 'dung',
  },
};

/**
 * NHÂN SỰ — **NGUỒN DUY NHẤT** của bản đồ lane. `scripts/moc.mjs` NHẬP từ đây, không tự chép.
 *
 * ⚠️ CA THẬT 30/08, mười phút sau khi dựng: bản đồ nằm ở HAI chỗ và LỆCH NGAY —
 * `moc.mjs` đã đổi sang bản đồ Codex (PRODUCT · DESIGN · ARCH · BUILD) còn tệp này vẫn giữ bản cũ
 * (UI · THIẾT KẾ/NC · 2D3D). Màn 4173 vẽ theo tệp này ⇒ **màn hiện tên cũ trong khi cầu thi hành
 * tên mới**. Lệch bản đồ ⇒ phiếu tới SAI VAI ⇒ kiểm chéo mất tác dụng, tức hỏng đúng thứ đắt nhất.
 *
 * Chữa bằng CẤU TRÚC, không bằng cổng: một nguồn thì không lệch được. Cổng cũng có thể quên.
 * Bản đồ lấy theo Codex vì nó đầy đủ hơn và đang chạy thật — Hoà 30/08:
 * *"nếu các phiên của bạn thay đổi, đặt tên lại thì phải đồng bộ với Codex + 4173."*
 */
export const NGUOI = [
  { ma: '00', ten: 'MAIN', vai: 'điều phối', mo: 'nhận phiếu · phân rã · GIAO đúng bàn · tự đánh thức · kiểm chứng · KHÔNG cầm bút mã' },
  { ma: '01', ten: 'MEMORY', vai: 'trí nhớ', mo: 'chống lặp · chống quên · giữ đường về tri thức đã chưng cất' },
  { ma: '02', ten: 'RESEARCH', vai: 'tra chuẩn ngoài', mo: 'nguồn thật · ca thật · KHÔNG ghi mã sản xuất' },
  { ma: '03', ten: 'PRODUCT', vai: 'sản phẩm', mo: 'phạm vi · cắt việc · thứ người dùng thấy' },
  { ma: '04', ten: 'DESIGN', vai: 'thẩm mỹ', mo: 'ngôn ngữ thị giác · lưới · tỉ lệ · thứ bậc' },
  { ma: '05', ten: 'ARCH', vai: 'kiến trúc', mo: 'hợp đồng · ADR · ranh giới module' },
  { ma: '06', ten: 'BUILD', vai: 'thi công', mo: 'PHIÊN CODE CHÍNH — viết mã · test · chứng minh runtime' },
  { ma: '07', ten: 'QUALITY', vai: 'bằng chứng', mo: 'SBOM · biên nhận · giấy phép · phản biện' },
  { ma: '08', ten: 'TTT', vai: 'khách đầu tiên', mo: 'ca thật từ studio dùng đầu tiên' },
];

/** Dạng `moc.mjs` cần: mã → một dòng mô tả vai. Dẫn xuất, không phải bản sao. */
export const VAI = Object.fromEntries(
  NGUOI.map((n) => [n.ma, `${n.ten} · ${n.mo}`]).concat([['99', 'tạm / thử']]),
);

/**
 * ĐẦU VIỆC.
 *   `bang`  — CÁCH CHỨNG MINH. Không có cách chứng minh thì không phải đầu việc, chỉ là mong muốn.
 *             `{ lenh, args }` chạy được ⇒ máy tự chấm.  `{ tay: '…' }` ⇒ người phải xác nhận.
 *   `can`   — phụ thuộc: việc này chưa tới lượt chừng nào các mã trong đây chưa xanh.
 *             Đây là thứ làm nên "chưa tới thì XÁM" trên bản vẽ.
 */
export const VIEC = [
  /* ══ ① TẦM SOÁT ══ */
  {
    ma: 'cong-day-du', pha: 'soat', lane: '00', ten: 'Mọi máy soi nằm trong cổng',
    y: 'máy soi ngoài `npm test` là máy soi không tồn tại — nó đỏ suốt mà chưa từng chặn ai',
    can: [], bang: { lenh: 'node', args: ['scripts/soat-toan-dien.mjs', '--chi-cong'] },
  },
  {
    ma: 'test-xanh', pha: 'soat', lane: '00', ten: 'npm test xanh',
    do: '2026-08-30',
    y: '20 máy soi + 14 bài kiểm chạy một lượt, kể cả bánh cóc',
    can: ['cong-day-du'], bang: { lenh: 'npm', args: ['test'] },
  },
  {
    ma: 'kieu-sach', pha: 'soat', lane: '00', ten: 'Kiểu dữ liệu sạch',
    y: 'tsc không lỗi — điều kiện nền của mọi việc còn lại',
    can: [], bang: { lenh: 'npx', args: ['tsc', '--noEmit'] },
  },
  {
    ma: 'kho-gon', pha: 'soat', lane: '00', ten: 'Kho git không mang tệp cấm',
    do: '2026-08-30',
    y: 'tệp >90MB làm GitHub từ chối CẢ NHÁNH · bản sao CSDL mang dữ liệu người dùng',
    can: [], bang: { lenh: 'node', args: ['scripts/soi-tep-nang.mjs', '--chan'] },
  },
  {
    ma: 'route-kin', pha: 'soat', lane: '00', ten: 'Route thử không lọt bản phát hành',
    y: 'ai gõ đúng đường dẫn là vào được bàn thử với dữ liệu bịa',
    can: [], bang: { lenh: 'node', args: ['scripts/soi-route-dev.mjs', '--chan'] },
  },
  {
    ma: 'tri-thuc-co-duong', pha: 'soat', lane: '00', ten: 'Tri thức đã chưng cất có đường về',
    y: 'mất đường tới nó ⇒ mỗi phiên chưng cất lại từ đầu, và Hoà phải tả lại',
    can: [], bang: { lenh: 'node', args: ['scripts/soi-con-tro.mjs', '--chan'] },
  },
  {
    ma: 'du-lieu-khong-ro', pha: 'soat', lane: '00', ten: 'Hộp GỬI ĐI sạch dữ liệu cá nhân',
    do: '2026-08-30',
    y: 'đo 30/08: 5 ảnh chụp màn hiện Gmail cá nhân của Hoà. Chuông canh HỘP GỬI, không canh cả kho',
    /* ⚠️ SỬA TRONG LƯỢT LẬP SỔ: bản đầu trỏ thẳng vào `artifacts/man-30-08` nên nó ĐỎ VĨNH VIỄN —
       trong khi thư mục đó chỉ là ảnh nằm yên, chưa ai định gửi đi đâu. Cổng luôn đỏ là cổng người
       ta học cách ngó lơ (F-02). Nay cổng canh đúng một chỗ: HỘP GỬI ĐI. Rỗng thì xanh; bỏ gì vào
       định gửi ra ngoài thì nó soi cái đó. */
    can: [], bang: { lenh: 'node', args: ['scripts/chon-tuyen.mjs', '--gui', 'artifacts/gui-di'] },
  },
  {
    ma: 'nap-dxf-song', pha: 'soat', lane: '06', ten: 'Đường nạp DXF không chết',
    y: 'lane 06 bắt được 30/08: worker chết vì `window is not defined` — nạp bản vẽ đang hỏng THẬT',
    /* 🔴 ĐỔI 30/08 — TRƯỚC ĐÂY GẮN NHÃN "DUYỆT MẮT", VÀ ĐÓ LÀ LƯỜI.
       Hoà: *"một bản vẽ DXF biết bao nhiêu là nét, làm sao biết được nét nào đúng nét nào sai?
       Chi tiết nào thiếu? … nạp cái gì vào mà không biết nó đạt tiêu chuẩn hay chưa, phải dựa vào
       mắt người, thì hệ thống đó vứt."* Đúng: mắt chỉ thấy "có hình / không hình".
       Nay máy chấm bằng `lib/cad/chuan-nap.ts` — 5 tiêu chí, đếm bằng PHƯƠNG PHÁP KHÁC bộ đọc. */
    can: ['kieu-sach'], bang: { lenh: 'node_modules/.bin/sucrase-node', args: ['lib/cad/chuan-nap.test.ts'] },
  },

  {
    ma: 'dac-ta-gu', pha: 'soat', lane: '05', ten: 'Đặc tả máy đọc gu',
    y: 'lane 05 giao 30/08 — 5 miền ngành đa nhãn · cổng an toàn cứng · ngưỡng còn là giả định',
    can: [], bang: { lenh: 'test', args: ['-f', 'docs/nc/DAC-TA-MAY-DOC-GU-2026-08-30.md'] },
  },
  {
    ma: 'phieu-dinh-huong', pha: 'soat', lane: '05', ten: 'Phiếu định hướng UX toàn cầu',
    do: '2026-08-30',
    y: 'khảo sát chuẩn nghề + Apple HIG + human-centric, từ 24 ảnh app thật',
    can: [], bang: { lenh: 'test', args: ['-f', 'docs/nc/PHIEU-DINH-HUONG-UX-TOAN-CAU-2026-08-30.md'] },
  },

  /* ══ ② DỰNG & SHIP ══ */
  {
    ma: 'worker-sach', pha: 'soat', lane: '06', ten: 'Chuỗi import worker sạch',
    y: 'worker kéo phải React/zustand ⇒ ReferenceError ⇒ chết IM, giao diện quay mãi, không lỗi đỏ',
    can: [], bang: { lenh: 'node', args: ['scripts/soi-worker-sach.mjs', '--chan'] },
  },

  {
    ma: 'tuong-len-man', pha: 'dung', lane: '06', ten: 'Hiện 81 bức tường lên màn',
    do: '2026-08-30',
    y: 'máy đọc được 12.274 nét → 81 tường · 286,0 m, nhưng chưa mặt nào đọc con số đó',
    can: ['nap-dxf-song'], bang: { tay: 'ảnh app thật, phóng to, số trên màn khớp số máy đo' },
  },
  {
    ma: 'chu-12px', pha: 'dung', lane: '03', ten: 'Nâng sàn chữ lên 12px',
    do: '2026-08-30',
    y: '772/850 vi phạm là cỡ dưới 12px — app nằm dưới sàn đọc được của chữ có dấu',
    /* ⚠️ SỬA NGAY TRONG LƯỢT LẬP SỔ: bằng chứng đầu tiên tôi viết là chạy `soi-chu-viet.mjs`,
       và nó trả ✅ — nhưng chỉ vì con số NẰM TRONG trần bánh cóc, tức CHƯA AI LÀM GÌ CẢ.
       Một phán quyết xanh cho việc chưa bắt đầu là PASS giả, đúng thứ luật 5 cấm.
       Bằng chứng đúng: trần `T-CHU-VIET` phải được SIẾT XUỐNG. Nay 850, trong đó 772 là cỡ chữ
       dưới 12px ⇒ làm xong thì còn khoảng 78. Đặt đích ≤ 100 để có biên. */
    can: ['test-xanh'], bang: { lenh: 'node', args: ['-e',
      "const t=require('./scripts/foundation-tran.json')['T-CHU-VIET'];" +
      "if(t>100){console.error('T-CHU-VIET còn '+t+' — đích ≤100 sau khi bỏ hết cỡ chữ <12px. Chưa bắt đầu.');process.exit(1)}"] },
  },
  {
    ma: 'gu-dung', pha: 'dung', lane: '03', ten: 'Giao diện theo đúng GU §2',
    y: 'liquid-glass · pill bo full · frosted blur · đơn sắc + 1 accent · KHÔNG flat/material',
    can: ['chu-12px'], bang: { tay: 'qua skill `if-design-review`, sáu cổng, trên ảnh app thật' },
  },
  {
    ma: 'bien-nhan', pha: 'dung', lane: '07', ten: 'SBOM + hai biên nhận',
    y: 'GPL đã ra khỏi bộ cài bằng cấu trúc, nhưng CHƯA có biên nhận ⇒ chưa được gọi là sạch',
    can: ['kho-gon'], bang: { lenh: 'node', args: ['scripts/sinh-bien-nhan-phat-hanh.mjs', '--kiem'] },
  },
  {
    ma: 'dung-lai-sach', pha: 'dung', lane: '07', ten: 'Dựng lại sạch từ đầu',
    y: 'biên nhận sinh trên artifact cũ thì nó khai commit LÚC SINH, không phải commit đã dựng',
    can: ['bien-nhan'], bang: { tay: 'dừng máy chủ dev → `npm run electron:pack:mac` → biên nhận tự sinh cuối chuỗi' },
  },
  {
    ma: 'dong-goi', pha: 'dung', lane: '00', ten: 'Đóng gói .dmg để Hoà cài thử',
    y: 'bản cài trong tay, soi bằng mắt người dùng cuối',
    can: ['dung-lai-sach', 'tuong-len-man', 'gu-dung'], bang: { tay: 'Hoà cài lên máy và bấm thử' },
  },
];

/* Đầu việc gán theo SỐ lane; số không đổi khi tên vai đổi, nên không phải sửa lại. */
export const dem = () => ({
  nguoi: NGUOI.length,
  viec: VIEC.length,
  soat: VIEC.filter((v) => v.pha === 'soat').length,
  dung: VIEC.filter((v) => v.pha === 'dung').length,
  tuDong: VIEC.filter((v) => v.bang.lenh).length,
  tay: VIEC.filter((v) => v.bang.tay).length,
});
