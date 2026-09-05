/**
 * scripts/thao-tac-registry.mjs — KHO LUẬT THAO TÁC MÁY-ĐỌC (P3 Hệ Luật Thao Tác, Hoà chốt 13/08).
 *
 * Bệnh gốc: luật thao tác nằm rải trong ~10 spec UI đã chốt, mắt người soi sót — 3 lần Hoà chê
 * xấu vì phiên code không biết luật tồn tại. File này CHƯNG CẤT luật từ spec (không sáng tác mới,
 * mỗi luật ghi `nguon`), `soi-thao-tac.mjs` grep code thật cùng cơ chế soi-frontier.
 *
 * Mỗi entry: { id, toiDanh: 1..7, luat, nguon, loai: 'grep'|'mat', soi?: [điều kiện] }
 * `toiDanh` = 7 CẤM KỴ của TRIẾT LÝ IF [N1] (dòng 55-58) — tội danh gốc mọi finding thao tác [Đ5].
 *
 * Ba kiểu điều kiện `soi` (chỉ luật loai:'grep' có):
 *   { file|dir, mau, can: true }   — BẮT BUỘC CÓ: mất khớp = lệch (canh regress)
 *   { file|dir, mau }              — CẤM: mỗi khớp = vi phạm, in file:dòng
 *   { dir, mauCo, mauThieu }       — file nào CÓ mauCo mà THIẾU mauThieu = vi phạm
 *
 * KỶ LUẬT (cùng họ frontier-registry): chốt luật UI mới = thêm 1 entry TẠI ĐÂY ngay lúc chốt.
 * Luật grep không sạch (false-positive ồ ạt) → hạ xuống loai:'mat', KHÔNG nới pattern cho sạch giả.
 */

export const TOI_DANH = {
  1: 'Lỗi giao diện',
  2: 'Tính năng xài hoài không ra chất lượng',
  3: 'Lỗi thao tác',
  4: 'Cảm giác GIẢ về nội dung',
  5: 'Gò ép — không module / không tuỳ chỉnh',
  6: 'Không phân loại group-by',
  7: 'Thẩm mỹ kém',
};

export const LUAT = [
  // ── LUẬT GREP-ĐƯỢC — máy soi 2 chiều ────────────────────────────────────────

  { id: 'reduce-motion-thang', toiDanh: 1, loai: 'grep',
    luat: 'prefers-reduced-motion THẮNG tất cả — guard toàn cục phải sống trong globals.css',
    nguon: 'SPEC-APPLE-MOTION-MATERIAL §4 + SPEC-DESIGN-SYSTEM-IF §3',
    soi: [{ file: 'app/globals.css', mau: 'prefers-reduced-motion', can: true }] },

  { id: 'token-mat-do', toiDanh: 3, loai: 'grep',
    luat: 'Cỡ thao tác khai bằng token mật độ (--tap/--fs-ui…) — token phải sống trong globals.css',
    nguon: 'SPEC-MAT-DO-CON-TRO §3',
    soi: [{ file: 'app/globals.css', mau: '--tap:', can: true },
          { file: 'app/globals.css', mau: '--fs-ui', can: true }] },

  { id: 'override-cam-ung', toiDanh: 3, loai: 'grep',
    luat: 'Desktop là mặc định, cảm ứng là override qua (hover: none) and (pointer: coarse) — không dùng bề rộng màn',
    nguon: 'SPEC-MAT-DO-CON-TRO §3 + §5.1',
    soi: [{ file: 'app/globals.css', mau: '\\(hover: none\\) and \\(pointer: coarse\\)', can: true }] },

  { id: 'kinh-webkit-prefix', toiDanh: 1, loai: 'grep',
    luat: 'File dùng backdrop-filter PHẢI kèm -webkit-backdrop-filter (thiếu = tablet không blur)',
    nguon: 'TICKET-FIX-KINH-LONG-2026-08-02 K3',
    soi: [{ dir: 'components', mauCo: 'backdrop-filter|backdropFilter', mauThieu: '-webkit-backdrop-filter|WebkitBackdropFilter' },
          { dir: 'app', mauCo: 'backdrop-filter|backdropFilter', mauThieu: '-webkit-backdrop-filter|WebkitBackdropFilter' }] },

  { id: 'outline-can-focus-visible', toiDanh: 3, loai: 'grep',
    luat: 'Bàn phím = chuột: file bỏ outline phải có :focus-visible thay thế (vòng focus accent)',
    nguon: 'SPEC-HOVER-FOCUS-IDF §3.6',
    // ⭐ THU HẸP 04/09 sau khi ĐO trên Chromium thật (không suy từ đặc hiệu). Mẫu cũ
    // `outline:\s*none|outline-none` gộp BA cơ chế khác hẳn nhau vào một rọ ⇒ 32 tệp báo, chỉ 8 tệp
    // là lỗ thật. Số đo (getComputedStyle lúc Tab tới, CSS bundle thật của Next):
    //   · class `outline-none` (Tailwind v3 = `outline:2px solid transparent`, đặc hiệu 0-1-0, nằm
    //     TRƯỚC luật globals trong bundle vì `@tailwind utilities` ở đầu app/globals.css)
    //     → ring VẪN HIỆN 2px #6a57f5. KHÔNG phải lỗ ⇒ không soi nữa.
    //   · `focus:outline-none` (đặc hiệu 0-2-0 — một class + một pseudo-class) → THẮNG luật
    //     `:where(...):focus-visible` (0-1-0) → outline 2px solid TRANSPARENT ⇒ MẤT ring. LỖ THẬT.
    //   · `outline:none` khai trong chuỗi CSS / style inline → thắng bằng đặc hiệu hoặc thứ tự
    //     ⇒ outline 0px none. LỖ THẬT.
    // ⚠️ Thế cân bằng của nhánh 1 dựa vào THỨ TỰ trong bundle, không phải đặc hiệu. Đảo thứ tự
    //    `@tailwind utilities` xuống cuối globals.css, hoặc lên Tailwind v4 (utilities vào @layer,
    //    thua mọi thứ ngoài layer), là 24 tệp kia thành lỗ thật ngay — lúc đó nới mẫu này trở lại.
    // ⚠️ `mauThieu` xét theo TỆP: tệp có `focus-visible` ở bất kỳ đâu là được miễn cả tệp. Nên một
    //    tệp vừa tự dựng ring cho vật A vừa giết ring của vật B vẫn lọt (xem báo cáo 04/09 §7).
    // NANG 05/09 — soi theo DONG chu khong theo TEP. `mauThieu` kieu cu mien CA TEP neu tep co
    //   chu `focus-visible` o bat ky dau => tep vua dung ring cho vat A vua giet ring vat B thi
    //   lot sach. Do 05/09: luat cu bao 21 tep; soi theo dong lo them 8 LO THAT nam trong tep da
    //   duoc mien — o tim cua ve3d/library-sheet/files-mock/inspiration, 5 cho ProjectSelect, va
    //   slider `input[type=range].if-slider` (dac hieu 0-2-1 thang luat toan app => mat han ring).
    //   `mauKem` = tin hieu ring thay the; CO `mauKem` la may tu chuyen sang nhanh soi-theo-dong.
    //   `mauKhai` = loi thoat cho ca tat ring CO Y va DUNG: chinh luat tat-ring-khi-bam-chuot o
    //   globals, va hop thoai `tabIndex={-1}` nhan focus bang ma nen khong nam trong duong Tab.
    soi: [{ dir: 'components', mauCo: "[\\w-]+:outline-none|outline:\\s*['\"`]?none", mauThieu: 'focus-visible',
            mauKem: "box-shadow|boxShadow|ring-\\d|ring-\\[|border-color|border-\\[|outline:\\s*(var|\\d)",
            mauKhai: 'focus-ring-ok' },
          { dir: 'app', mauCo: "[\\w-]+:outline-none|outline:\\s*['\"`]?none", mauThieu: 'focus-visible',
            mauKem: "box-shadow|boxShadow|ring-\\d|ring-\\[|border-color|border-\\[|outline:\\s*(var|\\d)",
            mauKhai: 'focus-ring-ok' }] },

  { id: 'keydown-ne-o-nhap', toiDanh: 3, loai: 'grep',
    luat: 'Phím tắt toàn cục không kích hoạt khi đang nhập chữ — listener keydown toàn cục phải né INPUT/TEXTAREA/contentEditable',
    nguon: 'Chốt hệ phím tắt toàn app 10/08 (00-CHOT)',
    // `esc-only` (phán quyết T 13/08): Escape là lệnh ĐÓNG, không phải phím tắt chức năng — listener
    // thật sự chỉ xử Escape thì ghi marker `esc-only` cạnh addEventListener thay vì guard (agent kiểm từng ca).
    // `mienTruTrongChuThich`: marker `esc-only` là LỜI KHAI của tác giả nên được phép nằm trong
    // chú thích — khác với vi phạm, thứ bắt buộc phải nằm trong mã thật (xem docstring `timThieu`).
    soi: [{ dir: 'components', mienTruTrongChuThich: true, mauCo: "(window|document)\\.addEventListener\\('keydown'", mauThieu: 'INPUT|TEXTAREA|isContentEditable|isTyping|isEditable|esc-only' },
          { dir: 'lib', mienTruTrongChuThich: true, mauCo: "(window|document)\\.addEventListener\\('keydown'", mauThieu: 'INPUT|TEXTAREA|isContentEditable|isTyping|isEditable|esc-only' }] },

  { id: 'cam-chu-tu-dong', toiDanh: 4, loai: 'grep',
    luat: 'CẤM chữ "tự động" trong UI — AI đoán phải mang dấu Magic, không tự xưng chắc chắn',
    nguon: 'CHOT-TACH-AI-VA-CHINH-TAY §1',
    soi: [{ dir: 'components', mau: "'[^'\\n]*[Tt]ự động[^'\\n]*'|\"[^\"\\n]*[Tt]ự động[^\"\\n]*\"|>[Tt]ự động<" }] },

  { id: 'cam-auto-hide', toiDanh: 3, loai: 'grep',
    luat: 'CẤM panel auto-hide (bị chửi nhất cả 4 app nghề) — thu gọn phải là trạng thái người dùng chọn',
    nguon: 'SPEC-PANEL-ROLLOUT-IDF §2f',
    soi: [{ dir: 'components', mau: 'autoHide|data-auto-hide' }] },

  { id: 'tam-noi-tai-cho', toiDanh: 7, loai: 'grep',
    luat: 'Tấm Thư viện nổi TẠI CHỖ (origin 50% 50%, nhích 10px) — cấm trượt nguyên thân từ đáy kiểu ngăn kéo',
    nguon: '00-CHOT "card rời nổi-tại-chỗ" 07/08',
    soi: [{ file: 'components/library/library-sheet-css.ts', mau: 'calc\\(100% \\+' },
          { file: 'components/library/library-sheet-css.ts', mau: 'transform-origin:50% 50%', can: true }] },

  { id: 'tam-khong-fade-opacity', toiDanh: 1, loai: 'grep',
    luat: 'Tấm Thư viện không animate opacity (luật G1) — chỉ transform; scrim fade riêng thì được',
    nguon: '00-CHOT "card rời" 07/08 (luật G1)',
    soi: [{ file: 'components/library/library-sheet-css.ts', mau: '\\.lib\\{[^}]*transition:[^;}]*opacity' }] },

  { id: 'cam-hex-inline', toiDanh: 1, loai: 'grep',
    luat: 'Màu qua CSS var app — cấm hardcode hex trong inline style của component',
    nguon: 'LUAT-GIAO-DIEN-BAT-BUOC L4 + SPEC-DESIGN-SYSTEM-IF §2e.1',
    /* ⚠️ VÙNG QUÉT MỞ RỘNG 05/09 — mốc CŨ chỉ đếm `components/`, tức là SÀN.
       Hai luật khác trong chính tệp này (`backdrop-filter`, `outline`) đã khai cả `app/` từ lâu;
       riêng luật hex thì không, nên hex gõ cứng trong `app/` chưa ai từng thấy. Đo 05/09 bằng
       CHÍNH mẫu này: **45 chỗ** (ước tính 59 ghi trong sổ 04/09 đếm bằng mẫu rộng hơn — số
       dùng là 45). Tổng 186 → 231 KHÔNG phải hồi quy, là thôi giấu; số LUẬT lệch vẫn là 2, cổng
       không đổi màu. Sửa để lượt riêng; máy vẫn chỉ cảnh báo. */
    /* 🔴 TÁCH LÀM HAI 05/09 — và đây là cách chữa DUY NHẤT không phải nói dối.
       Mở vùng quét sang `app/` đẩy tổng 194 → 244, nhưng ĐO TÁCH RA thì `components/` chỉ còn
       **179 — THẤP HƠN trần cũ 194**. Tức mã KHÔNG tệ đi; THƯỚC rộng ra. Bánh cóc lại cấm nới
       trần (M-52), và nới thật thì đúng là tháo ngòi. Ba đường, chỉ một đường thật thà:
         ⛔ nới 194 → 244 — che mất việc `components/` đã tốt lên, và phá luật bánh cóc
         ⛔ thu lại chỉ quét `components/` — quay về giấu 45 chỗ trong `app/`
         ✅ HAI BỘ ĐẾM, mỗi vùng một thước, mỗi thước một trần, cùng siết xuống độc lập
       Không con số nào bị nới, không chỗ nào bị giấu, và `components/` được ghi nhận 194 → 179. */
    soi: [{ dir: 'components', mau: ":\\s*'#[0-9a-fA-F]{3,8}'" }] },

  { id: 'cam-hex-inline-app', toiDanh: 1, loai: 'grep',
    luat: 'Màu qua CSS var app — cấm hardcode hex trong inline style (vùng app/)',
    nguon: 'LUAT-GIAO-DIEN-BAT-BUOC L4 + SPEC-DESIGN-SYSTEM-IF §2e.1',
    /* Vùng `app/` mở sổ 05/09 ở 43 (sau khi đổi 2 chỗ máy móc: overview `#fff` → `--on-accent`,
       notebook `#B4443A` → `--danger`). 40/43 nằm trong ĐÚNG MỘT tệp `app/library/ingest/page.tsx`,
       và đó KHÔNG phải việc của lint — xem `docs/delivery/HEX-INGEST-CHO-HOA.md`. */
    soi: [{ dir: 'app', mau: ":\\s*'#[0-9a-fA-F]{3,8}'" }] },

  { id: 'so-tabular-nums', toiDanh: 7, loai: 'grep',
    luat: 'Số hiển thị động (zoom %, đếm) dùng tabular-nums để không nhảy bề rộng',
    nguon: 'SPEC-DESIGN-SYSTEM-IF §2c.5',
    soi: [{ dir: 'components', mau: 'tabular-nums|tabularNums', can: true }] },

  { id: 'dong-lop-chung', toiDanh: 3, loai: 'grep',
    luat: 'Đóng lớp nổi dùng MỘT họ sự kiện chung (useDismissable pointerdown pha bắt) — không tự chế từng chỗ',
    nguon: '00-CHOT "THỨ ĐÃ TỒN TẠI TRONG CODE" (lib/useDismissable.ts)',
    soi: [{ file: 'lib/useDismissable.ts', mau: 'pointerdown', can: true }] },

  { id: 'tay-cam-panel-chung', toiDanh: 3, loai: 'grep',
    luat: 'Panel bên có tay cầm thu/mở dùng chung (PanelFlank) — không chép cơ chế riêng từng panel',
    nguon: '00-CHOT mục 10 (07/08) — tay cầm Trình chiếu thành mẫu chung',
    soi: [{ dir: 'components/ui', mau: 'PanelFlank', can: true }] },

  { id: 'chuot-phai-filemanager', toiDanh: 3, loai: 'grep',
    luat: 'Desktop phải có từ vựng chuột: File Manager có menu chuột phải (onContextMenu)',
    nguon: 'SPEC-MAT-DO-CON-TRO §2 + §4.1',
    soi: [{ dir: 'components/filemanager', mau: 'onContextMenu', can: true }] },

  { id: 'esc-dong-lop', toiDanh: 3, loai: 'grep',
    luat: 'Esc đóng sheet/popover · bỏ chọn — app phải xử lý phím Escape',
    nguon: 'SPEC-PANEL-ROLLOUT-IDF §4a',
    soi: [{ dir: 'components', mau: "'Escape'", can: true }] },

  { id: 'nhip-ease-apple', toiDanh: 7, loai: 'grep',
    luat: 'Chuyển động không gian dùng nhịp chuẩn --ease-apple (cubic-bezier .32,.72,0,1), không ease/linear mặc định',
    nguon: 'SPEC-DESIGN-SYSTEM-IF §2 + SPEC-APPLE-MOTION-MATERIAL §3b',
    soi: [{ file: 'app/globals.css', mau: '--ease-apple', can: true }] },

  // ── LUẬT CHỈ-MẮT — vào BẢNG NỢ NGHIỆM THU MẮT, nhóm theo tội danh [Đ6] ──────

  { id: 'khong-scale-vat-lon', toiDanh: 7, loai: 'mat',
    luat: 'KHÔNG scale khi hover: nút toolbar · hàng danh sách · ảnh lớn · node canvas — scale chỉ cho vật NHỎ/ĐƠN LẺ',
    nguon: 'SPEC-HOVER-FOCUS-IDF §2 + §4' },
  { id: 'hover-vao-cham-ra-nhanh', toiDanh: 3, loai: 'mat',
    luat: 'Hover vào chậm ra nhanh: hover-out ngắn hơn hover-in ~30% (200ms vào → 140ms ra)',
    nguon: 'SPEC-HOVER-FOCUS-IDF §3.5' },
  { id: 'chu-khong-nhay', toiDanh: 1, loai: 'mat',
    luat: 'Chữ không nhảy khi thẻ lift/scale — chữ giữ vị trí tương đối, không scale riêng chữ',
    nguon: 'SPEC-HOVER-FOCUS-IDF §3.2' },
  { id: 'tablet-khong-giau-sau-hover', toiDanh: 3, loai: 'mat',
    luat: 'Cảm ứng không có hover — thông tin/chức năng chỉ hiện khi hover PHẢI có đường khác (bấm giữ, nút sẵn)',
    nguon: 'SPEC-HOVER-FOCUS-IDF §3.7' },
  { id: 'kinh-phai-portal', toiDanh: 1, loai: 'mat',
    luat: 'Panel kính nổi PHẢI portal ra body — cấm kính lồng trong chrome kính (menu xuyên thấu)',
    nguon: 'TICKET-FIX-KINH-HEADER-2026-08-02 K4' },
  { id: 'fade-kinh-self-opacity', toiDanh: 1, loai: 'mat',
    luat: 'Fade kính = self-opacity trên chính element kính — fade wrapper cha giết backdrop-filter',
    nguon: 'TICKET-FIX-KINH-LONG-2026-08-02 K1' },
  { id: 'rollout-3-co-che', toiDanh: 3, loai: 'mat',
    luat: 'Rollout: bấm cả thanh tiêu đề = thu/mở · grip ⠿ kéo đổi thứ tự · nhớ theo LOẠI VẬT, cấm khoá theo sub-mode',
    nguon: 'SPEC-PANEL-ROLLOUT-IDF §2a + §2b' },
  { id: 'thu-gon-co-nhan', toiDanh: 3, loai: 'mat',
    luat: 'Thu gọn panel = dải dọc mỏng CÓ NHÃN, trạng thái thu/mở NHỚ giữa các phiên',
    nguon: 'SPEC-PANEL-ROLLOUT-IDF §2f + 00-CHOT mục 10 (07/08)' },
  { id: 'trang-thai-mau-hinh', toiDanh: 7, loai: 'mat',
    luat: 'Trạng thái nói bằng MÀU + HÌNH (icon bật/tắt, chấm màu) — không câu chữ "Có/Không"; số giữ nguyên chữ số',
    nguon: 'SPEC-PANEL-ROLLOUT-IDF §3' },
  { id: 'mo-dong-dung-khuon', toiDanh: 7, loai: 'mat',
    luat: 'Mở popover/tool window: opacity+scale .96→1, gốc phóng TẠI nút bấm; đóng nhanh hơn mở (vào chậm ra nhanh)',
    nguon: 'SPEC-APPLE-MOTION-MATERIAL §3d' },
  { id: 'thoi-luong-dung-nac', toiDanh: 3, loai: 'mat',
    luat: 'Bấm/toggle <200ms · popover 200-300ms · chuyển trang 300-500ms · cấm >600ms cho thao tác thường',
    nguon: 'SPEC-APPLE-MOTION-MATERIAL §3a + §4' },
  { id: 'khong-chan-man', toiDanh: 5, loai: 'mat',
    luat: 'Không màn nào chặn vì "chưa làm bước trước" — chặng trống hiện empty state LÀM ĐƯỢC VIỆC tại chỗ',
    nguon: '00-CHOT luật X2 (03/08)' },
  { id: 'mo-kem-ly-do', toiDanh: 4, loai: 'mat',
    luat: 'Lệnh chưa đủ điều kiện hiện MỜ kèm LÝ DO — cấm nút giả bấm không ra gì, cấm gán phím giả',
    nguon: 'Chốt hệ phím tắt 10/08 + luật §9 (00-BAT-DAU-DOC-DAY)' },
  { id: 'lenh-co-duong-phim', toiDanh: 3, loai: 'mat',
    luat: 'Mọi lệnh ĐÃ chạy được phải có đường bàn phím thật; tooltip/⌘K/bảng ⌘/ không khai lệch hành vi',
    nguon: 'Chốt hệ phím tắt toàn app 10/08 (00-CHOT)' },
  { id: 'kinh-la-vo', toiDanh: 1, loai: 'mat',
    luat: 'Kính là VỎ không là RUỘT: chỉ lớp nổi tạm thời; panel cố định nền đặc; chữ trên kính đọc được CẢ 2 theme',
    nguon: 'SPEC-APPLE-MOTION-MATERIAL §0 + §1' },
  { id: 'nguoi-keo-may-khong-doi', toiDanh: 5, loai: 'mat',
    luat: 'Người dùng tự kéo sắp panel (adaptable), máy KHÔNG tự đổi thứ tự (adaptive); luôn có "Đặt lại bố cục" nhìn thấy',
    nguon: 'SPEC-PANEL-ROLLOUT-IDF §1 (Findlater CHI 2004) + §2b' },
  { id: 'dai-trang-theo-loai-vat', toiDanh: 6, loai: 'mat',
    luat: 'Inspector = dải trang đổi theo LOẠI VẬT đang chọn (kiểu Rhino); chọn nhiều loại → chỉ trang chung; không chọn → thuộc tính khung nhìn',
    nguon: 'SPEC-PANEL-ROLLOUT-IDF §2c' },
  { id: 'phan-loai-lon-nho', toiDanh: 6, loai: 'mat',
    luat: 'Nội dung/tính năng phân loại LỚN trước NHỎ sau, group-by + filter — gọn mặc định, sâu khi cần',
    nguon: 'TRIET-LY-IF [Đ6]' },
  { id: 'mot-hanh-dong-ra-chuan', toiDanh: 2, loai: 'mat',
    luat: 'Mặc định = bản CHƯNG CẤT cách người pro làm — một hành động ra kết quả chuẩn; chiều sâu collapse, không mất',
    nguon: 'TRIET-LY-IF [N2]' },
];
