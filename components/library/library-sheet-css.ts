// components/library/library-sheet-css.ts — CSS Thư viện sheet, PORT NGUYÊN VĂN từ
// `docs/mocks/mock-if-3chang.html` khối "══════ THƯ VIỆN — sheet trượt lên, kính ══════".
//
// L2 (`docs/LUAT-GIAO-DIEN-BAT-BUOC.md`): chép markup+CSS, KHÔNG vẽ lại bằng mắt. Mọi con số
// (122px ô lưới · 76px thumbnail · 24px chip · 15px badge · 38px chân sheet ·
// min(980px,94vw) × min(560px,74vh)) giữ NGUYÊN — TRỪ cột kệ, xem dòng `.shelf` bên dưới.
//
// Hai khác biệt so với mock, đều CÓ LÝ DO, không phải tự chế:
//  1. Mock bật/tắt bằng `body.lib`; ở React không nên ghi class lên <body> từ component (dễ rò
//     khi unmount) ⇒ dùng `[data-open="true"]` trên chính 2 phần tử. Giá trị CSS y hệt.
//  2. Mock khai `--fs-2xs:11px` trong `:root` của riêng nó; `app/globals.css` (NGOÀI vùng code
//     G4, không được sửa) chưa có biến này ⇒ khai trong phạm vi sheet, không đụng file chung.
//     Các biến còn lại (--mat-card/--blur-strong/--shadow-sheet/--mat-overlay/--mat-hairline/
//     --border-strong/--accent-warm/--field/--hover/--radius-*/--fw-semi/--ease-apple/--dur-base)
//     ĐÃ CÓ THẬT trong globals.css — đã kiểm từng biến, dùng thẳng.
//  Ngoài ra `.mat-sheet` chưa có trong globals.css nên khai ở đây đúng công thức mock
//  (= công thức `.mat-card` sẵn có: nền --mat-card + blur-strong).
export const LIBRARY_SHEET_CSS = `
/* G4 (00-BAT-DAU-DOC-DAY §4): mọi cỡ chữ phải có line-height ≥1.5 — khai MỘT LẦN ở gốc để
   các rule con chỉ khai font-size vẫn kế thừa đủ, không cắt dấu tiếng Việt. */
.if-lib-root{--fs-2xs:11px;line-height:1.5}
/* 🔴 SỬA 04/08 (Hoà chê "không thấy tầng"): sheet cũ nền --mat-card = trắng .82 ở theme Sáng,
   card lại nền --field #f4f1eb ⇒ hai lớp gần trùng, nhìn phẳng lì. Đổi sang thang 3 tầng
   nền(--bg) < sheet(--panel) < card(--card).
   🔴 SỬA 05/08 (Hoà, VIỆC 2 "card rời"): BỎ HẲN kính. Luật G9 liệt kê ".glass-float" CHỈ 4 chỗ và
   LibrarySheet không nằm trong đó; G2 bắt lớp nổi nhiều chữ phải nền ĐẶC ≥92% (popover ≥96%).
   Sheet này đặc kín 97% + KHÔNG "backdrop-filter" ⇒ (a) chữ không chồng nền, (b) không tốn thêm
   1 tấm backdrop trên canvas WebGL (trần 4 tấm, G9), (c) không tạo backdrop-root khi chuyển động. */
.if-lib-root .mat-sheet{background:color-mix(in srgb, var(--panel) 97%, transparent)}
.if-lib-root *{box-sizing:border-box}

/* 🔴 SỬA 04/08 (Hoà: "nền sau sheet phải tối xuống rõ"): z-index cũ 20/21 chép từ mock — nhưng
   trong app THẬT .mat-header là z-30 nên header ĐỨNG TRÊN scrim, nửa màn không hề tối (đo bằng
   elementFromPoint). Sheet là lớp modal ⇒ vào đúng dải modal của app (Lightbox/MoodboardModal
   z-60, menu z-80) nhưng dưới PublishModal z-190 + toast z-200 của chính Thư viện. */
/* Đậm thêm 12% so với token: --mat-overlay (Sáng chỉ .28) hợp với modal NHỎ; sheet này chiếm
   74% chiều cao nên nền còn lại phải lùi hẳn ra sau mới đọc được lớp trên. Vẫn lấy token làm
   MÀU gốc để đồng bộ theme, chỉ chồng thêm một lớp tối mỏng. */
/* Lớp phủ: TỐI HƠN MỘT BẬC so với bản dính đáy (12% → 22%). Card nay rời hẳn khỏi 4 mép màn,
   nền quanh nó lộ ra cả bốn phía nên phải lùi sâu hơn thì card mới "nổi" thành vật thể riêng. */
.if-lib-root .scrim{position:fixed;inset:0;
       background:linear-gradient(rgba(0,0,0,.22),rgba(0,0,0,.22)),var(--mat-overlay);opacity:0;pointer-events:none;z-index:90;
       transition:opacity var(--dur-base) var(--ease-apple);border:0;padding:0}
.if-lib-root .scrim[data-open="true"]{opacity:1;pointer-events:auto}
/* ═══ CARD RỜI (detached sheet, chuẩn iOS 15+) — Hoà chốt 05/08, cách VÀO chốt lại 07/08 ═══
   Trước: dính đáy (bottom:0), chỉ bo 2 góc trên, rộng tới 980px.
   Nay:  · cách đáy 14px (+ safe-area máy có notch/thanh home)
         · bo ĐỦ BỐN GÓC cùng bán kính var(--radius-lg)=20px
         · width min(960px, 100vw−24px) ⇒ màn rộng canh giữa không tràn, màn <640px tự còn
           12px mỗi bên (một công thức lo cả hai, không cần media query thứ hai)
         · bóng mạnh hơn vì card NỔI hẳn (shadow-sheet cũ có spread âm −12px, hợp với vật dính mép)
   🔴 SỬA 07/08 (Hoà chốt "00-CHOT.md — Bổ sung 07/08"): trước đây transform-origin:50% 100% +
   translate(...calc(100%+14px)...) là NGÔN NGỮ NGĂN KÉO — tấm bò nguyên thân từ mép dưới màn hình
   lên, dù đã rời đáy/bo 4 góc thì mắt vẫn đọc ra "sheet điện thoại". Lý do sheet dính đáy là vùng
   ngón cái trên di động; IF chạy Electron desktop, chuột không có vùng ngón cái, macOS chưa bao
   giờ dính đáy (Save panel/Preferences/Quick Look đều nổi giữa). Nay tấm chỉ NHÍCH 10px tại ĐÚNG
   CHỖ nó sẽ đứng — origin về tâm, không còn dịch chuyển cả chiều cao. KHÔNG animate opacity (G1,
   ".badge" bên trong có backdrop-filter, mọi tổ tiên bị cấm animate opacity).
   🔴 SỬA 07/08 CHIỀU (Hoà: "card bị nhỏ, quá bó hẹp không cần thiết", 00-CHOT.md mục "TẤM THƯ
   VIỆN: NỚI 960px + BA NẤC CỠ THẺ"): 720px là số TỔNG tự hạ sáng nay vì tưởng cột thông số ④
   chiếm chỗ THƯỜNG TRỰC — nhưng cột đó CHỈ hiện khi chọn món (phương án A, xem khối ".specwrap"
   dưới), nên lúc duyệt kho tấm rộng được. Nới 720→960 ⇒ lưới thẻ 478→718px (960−214 kệ−28 padding
   lưới). Vẫn giữ min(…, 100vw−24px) — màn hẹp không tràn. */
.if-lib-root .lib{position:fixed;left:50%;
     bottom:calc(14px + env(safe-area-inset-bottom, 0px));
     width:min(960px, calc(100vw - 24px));height:min(560px,74vh);
     border-radius:var(--radius-lg);border:1px solid var(--mat-hairline);
     box-shadow:0 12px 40px rgba(0,0,0,.34);z-index:91;display:flex;flex-direction:column;overflow:hidden;
     transform-origin:50% 50%;
     transform:translate(-50%,10px) scale(.97);
     /* 🔴 SỬA 07/08 TỐI (P-B, bug chặn verify /materials): bản "nhích 10px tại chỗ" sáng nay QUÊN
        ẨN tấm khi đóng — bản cũ trượt cả thân ra ngoài màn nên không cần ẩn, bản mới đóng xong tấm
        vẫn đứng nguyên che toàn bộ màn phía sau (đo data-open="false" mà computed opacity=1, tấm
        hiện đủ). Không dùng opacity (G1 — .badge bên trong có backdrop-filter): dùng visibility
        TRỄ đúng 200ms cho transform chạy hết rồi mới biến mất; lúc mở visibility bật NGAY (delay 0). */
     visibility:hidden;
     transition:transform 200ms cubic-bezier(.32,.72,0,1), visibility 0s 200ms}
.if-lib-root .lib[data-open="true"]{transform:translate(-50%,0) scale(1);visibility:visible;
     transition:transform 200ms cubic-bezier(.32,.72,0,1), visibility 0s 0s}
/* Vùng kéo: vạch NHÌN vẫn 4px, nhưng vùng CHẠM cao 44px (§0c mảng 3 — ngón tay/găng tay công
   trường). Kéo xuống quá ngưỡng = đóng; nút ✕ ở header là đường tương đương (K5/G8). */
.if-lib-root .grab{height:44px;flex:none;display:flex;align-items:center;justify-content:center;
     cursor:grab;touch-action:none;-webkit-user-select:none;user-select:none}
.if-lib-root .grab:active{cursor:grabbing}
.if-lib-root .grab i{width:38px;height:4px;border-radius:2px;background:var(--border-strong)}
.if-lib-root .libh{flex:none;display:flex;align-items:center;gap:10px;padding:2px 14px 10px}
.if-lib-root .libh h3{margin:0;font-size:var(--fs-md);font-weight:var(--fw-semi);letter-spacing:-.015em;color:var(--t1)}
.if-lib-root .libh .cx{margin-left:auto;width:28px;height:28px;color:var(--t3);border-radius:8px;display:flex;
          align-items:center;justify-content:center;transition:background .12s,color .12s;border:0;background:none;cursor:pointer}
.if-lib-root .libh .cx:hover{background:var(--hover);color:var(--t1)}
/* VIỆC 7b (07/08) — nhãn "Dữ liệu mẫu": nền đặc (G2, không kính), tông --warning nhẹ vì đây là
   một dạng cảnh báo nhẹ ("còn thiếu", cùng họ badge CHỜ/CẢNH BÁO của app), KHÔNG dùng accent tím
   (accent = hành động/chọn, dễ hiểu lầm là trạng thái tốt). */
.if-lib-root .mocktag{flex:none;height:20px;padding:0 8px;border-radius:999px;display:flex;align-items:center;
      font-size:var(--fs-2xs);font-weight:var(--fw-semi);letter-spacing:.02em;
      background:color-mix(in srgb, var(--warning) 16%, var(--panel));color:var(--warning-ink,var(--t1));
      border:1px solid color-mix(in srgb, var(--warning) 38%, transparent);cursor:help}
/* 250px = đúng ô tìm của "docs/mocks/Thư viện.dc.html" màn 01 (trước 260px). */
.if-lib-root .srch{flex:1;max-width:250px;height:28px;background:var(--field);border:1px solid var(--border);
      border-radius:var(--radius-sm);display:flex;align-items:center;gap:7px;padding:0 9px;color:var(--t4);font-size:var(--fs-xs)}
.if-lib-root .srch input{flex:1;min-width:0;border:0;background:none;outline:none;color:var(--t1);font:inherit}
.if-lib-root .srch input::placeholder{color:var(--t4)}
.if-lib-root .libbody{flex:1;display:flex;min-height:0}
/* flex-column (trước là block) — CHỈ để ghim khối CTA đáy cột bằng "margin-top:auto" đúng như
   mock màn 01. Mọi hàng con khai "flex:none" nên chiều cao 30/24px không bị bóp khi tràn. */
/* 🔴 SỬA 07/08 (Hoà chốt "PHƯƠNG ÁN A"): 186px chỉ là số chép nguyên văn từ mock CŨ
   (mock-if-3chang.html) — KHÔNG phải chốt của Hoà. Mock MỚI (Thư viện.dc.html, 06/08) và
   bảng chốt 07/08 đều ghi 214px — đổi theo, không giữ số cũ "cho tiện tay". */
.if-lib-root .shelf{width:214px;flex:none;border-right:1px solid var(--mat-hairline);padding:4px 6px;overflow-y:auto;
       display:flex;flex-direction:column}
.if-lib-root .shrow{width:100%;height:30px;flex:none;display:flex;align-items:center;gap:9px;padding:0 9px;border-radius:var(--radius-sm);
       color:var(--t2);font-size:var(--fs-xs);text-align:left;transition:background .12s var(--ease-apple);border:0;background:none;cursor:pointer}
.if-lib-root .shrow:hover{background:var(--hover)}
.if-lib-root .shrow.on{background:var(--accent-soft);color:var(--accent);font-weight:var(--fw-semi)}
.if-lib-root .shrow .c{margin-left:auto;font-size:var(--fs-2xs);color:var(--t4);font-variant-numeric:tabular-nums}
/* Chấm LOẠI KỆ (port "docs/mocks/Thư viện.dc.html" màn 01, cột kệ). Mock: 10px, bo 3px cho kệ
   thường và bo tròn cho kệ ĐANG MỞ — giữ đúng cả hai. Màu do TSX truyền vào từ "ShelfDef.dot"
   (luôn là token, không hex). */
.if-lib-root .shrow .dot{width:10px;height:10px;flex:none;border-radius:3px}
.if-lib-root .shrow.on .dot{border-radius:50%;background:var(--accent)!important}
.if-lib-root .shcap{padding:9px 9px 5px;flex:none;font-size:var(--fs-2xs);font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:var(--t5)}
/* Hàng NHÓM VẬT LIỆU con — mock thụt lề sâu hơn hàng kệ (padding-left 22 vs 12) và chữ nhạt hơn.
   Ở đây là NÚT lọc thật (mock vẽ tĩnh), nên có thêm trạng thái chọn. */
.if-lib-root .subrow{width:100%;height:24px;flex:none;display:flex;align-items:center;padding:0 9px 0 19px;
       border-radius:var(--radius-sm);color:var(--t3);font-size:var(--fs-xs);text-align:left;
       transition:background .12s var(--ease-apple),color .12s var(--ease-apple);border:0;background:none;cursor:pointer}
.if-lib-root .subrow:hover{background:var(--hover);color:var(--t1)}
.if-lib-root .subrow.on{background:var(--accent-soft);color:var(--accent);font-weight:var(--fw-semi)}
.if-lib-root .subrow:focus-visible{outline:none;box-shadow:0 0 0 2px var(--accent)}
/* CTA ghim đáy cột kệ (mock: margin-top:auto + vạch ngăn trên + nút accent tràn ngang).
   "margin-top:auto" MỘT MÌNH chưa đủ: cột kệ có "overflow-y:auto", danh sách dài hơn cột (13 kệ
   + 5 nhóm vật liệu) nên "đáy" là đáy VÙNG CUỘN — nút rơi xuống dưới mép, phải cuộn hết mới thấy
   (đo browser thật: đáy nút 910px trong cửa sổ cao 900px). "position:sticky; bottom:0" ghim nó
   vào mép NHÌN THẤY của cột, danh sách vẫn cuộn phía sau. Nền phải ĐẶC (cùng nền sheet) không thì
   hàng kệ trôi lộ qua nút. Cột ngắn thì "margin-top:auto" vẫn đẩy nút xuống đáy như mock. */
.if-lib-root .shelfcta{margin-top:auto;flex:none;position:sticky;bottom:0;z-index:1;
       padding:10px 3px 2px;border-top:1px solid var(--mat-hairline);background:var(--panel)}
.if-lib-root .shelfcta .pub{margin-left:0;width:100%;height:var(--tap);justify-content:center}
.if-lib-root .libmain{flex:1;min-width:0;display:flex;flex-direction:column}
.if-lib-root .chips{flex:none;display:flex;gap:5px;padding:9px 14px;border-bottom:1px solid var(--mat-hairline);overflow-x:auto;scrollbar-width:none}
.if-lib-root .chip{height:24px;padding:0 11px;border-radius:20px;background:var(--field);color:var(--t3);
      font-size:var(--fs-2xs);white-space:nowrap;display:flex;align-items:center;gap:5px;border:0;cursor:pointer;
      transition:background .12s var(--ease-apple),color .12s var(--ease-apple)}
.if-lib-root .chip:hover{background:var(--hover);color:var(--t1)}
.if-lib-root .chip.on{background:var(--accent);color:#fff;font-weight:var(--fw-semi)}
/* ═══ BA NẤC CỠ THẺ (chốt 07/08 chiều) ═══ D5 Render và Blender ĐỀU có núm chỉnh cỡ thẻ — không
   app nào cố định một cỡ, vì cùng một thư viện lúc cần lướt nhanh 40 món, lúc cần soi kỹ một vân.
   Biến CSS đặt trên .if-lib-root (qua data-card-size) để vừa lưới .grid vừa ảnh xem trước
   .it .th đổi CÙNG LÚC theo một nguồn — đổi nấc không thể lệch pha giữa cột và ảnh.
   Tỉ lệ ảnh ~16:9 xuyên cả 3 nấc (giữ nguyên cảm giác thẻ, chỉ đổi cỡ): 122×69 · 168×95 · 232×131.
   Mặc định VỪA (168px, 4 cột ở lưới 718) — 141px hiện tại (3 cột cũ) không đủ soi vân gỗ. */
.if-lib-root{--lib-card-min:168px;--lib-th-h:95px}
.if-lib-root[data-card-size="sm"]{--lib-card-min:122px;--lib-th-h:69px}
.if-lib-root[data-card-size="md"]{--lib-card-min:168px;--lib-th-h:95px}
.if-lib-root[data-card-size="lg"]{--lib-card-min:232px;--lib-th-h:131px}
/* Thanh chọn nấc — hàng riêng, KHÔNG chung .chips (chips cuộn ngang khi nhiều phạm vi, nhét
   chung sẽ đẩy nấc-cỡ ra ngoài tầm nhìn ở màn hẹp). Đứng ngay trên lưới, dồn phải — cùng ngôn ngữ
   segmented với .modeseg/.sizeseg dùng chung style bên dưới. */
.if-lib-root .densitybar{flex:none;display:flex;justify-content:flex-end;padding:7px 14px;
      border-bottom:1px solid var(--mat-hairline)}
.if-lib-root .sizeseg{display:flex;gap:3px;background:var(--field);border-radius:20px;padding:3px;flex:none}
.if-lib-root .sizeseg button{height:22px;padding:0 10px;border-radius:20px;border:0;background:none;cursor:pointer;
      color:var(--t3);font-size:var(--fs-2xs);transition:background .12s var(--ease-apple),color .12s var(--ease-apple)}
.if-lib-root .sizeseg button:hover{color:var(--t1)}
.if-lib-root .sizeseg button.on{background:var(--panel);color:var(--t1);font-weight:var(--fw-semi)}
.if-lib-root .sizeseg button:focus-visible{outline:none;box-shadow:0 0 0 2px var(--accent)}
.if-lib-root .grid{flex:1;overflow-y:auto;padding:12px 14px 16px;display:grid;
      grid-template-columns:repeat(auto-fill,minmax(var(--lib-card-min),1fr));gap:11px;align-content:start}
.if-lib-root .it{border-radius:var(--radius-md);overflow:hidden;background:var(--card);border:1px solid var(--border);
    text-align:left;padding:0;cursor:grab;transition:transform .2s var(--ease-apple),box-shadow .2s var(--ease-apple),border-color .15s}
.if-lib-root .it:hover{transform:translateY(-2px) scale(1.02);box-shadow:var(--shadow-pop);border-color:var(--border-strong)}
.if-lib-root .it:active{transform:scale(.99);transition-duration:.09s}
.if-lib-root .it:focus-visible{outline:none;border-color:var(--accent);box-shadow:0 0 0 2px var(--accent)}
.if-lib-root .it .th{height:var(--lib-th-h);position:relative;display:flex;align-items:center;justify-content:center;color:var(--t5);
     border-bottom:1px solid var(--border);transition:height .2s var(--ease-apple)}
/* icon LOẠI ở ô chưa có ảnh/quả cầu — đủ đọc trên vân, không át vân */
.if-lib-root .it .th .kicon{opacity:.5;color:var(--t2)}
.if-lib-root .it .mt{padding:7px 9px 9px}
.if-lib-root .it .mt .a{font-size:var(--fs-2xs);font-weight:var(--fw-semi);color:var(--t2);overflow:hidden;
           text-overflow:ellipsis;white-space:nowrap}
.if-lib-root .it .mt .b{font-size:var(--fs-2xs);color:var(--t5);margin-top:2px;font-family:ui-monospace,Menlo,monospace}
/* Nấc LỚN hiện thêm w×d×h (chốt 07/08 chiều: "dân thiết kế cần con số này trước tiên" — thẻ nhỏ
   không đủ chỗ, thẻ lớn thì có). Chỉ render khi có ít nhất 1 kích thước khớp kho — KHÔNG bịa số
   (cùng luật .speccol), im lặng bỏ dòng nếu chưa khớp mã, không cần câu lý do riêng cho từng thẻ
   vì cột thông số ④ (bấm thẻ) đã giải thích đủ khi cần xem sâu. */
.if-lib-root .it .mt .dim{font-size:var(--fs-2xs);color:var(--t4);margin-top:2px;font-variant-numeric:tabular-nums}
/* q0b (ca trực 02:xx bắt): badge dùng blur(10px) SỐ CỨNG — vi phạm luật kính lỏng "mọi giá trị
   kính đi từ token". Nay suy từ --blur (22px): badge chỉ cao 15px nên lấy MỘT NỬA token, blur
   nguyên 22px trên vệt 15px thì nhoè hết chữ. Chia từ token nên đổi token là đổi theo, không
   còn con số rời. Kèm -webkit- (bài học K3: thiếu prefix ⇒ tablet không blur). */
.if-lib-root .badge{position:absolute;top:6px;right:6px;height:15px;padding:0 5px;border-radius:5px;background:var(--mat-card);
       backdrop-filter:blur(calc(var(--blur) / 2));-webkit-backdrop-filter:blur(calc(var(--blur) / 2));
       color:var(--t3);font-size:9px;font-weight:700;display:flex;align-items:center;
       letter-spacing:.03em}
.if-lib-root .badge.st{color:var(--accent-warm)}
/* VIỆC 7 (08/08) — dấu hiệu "có tham số": GÓC ĐỐI DIỆN badge phạm vi (dưới-trái, không đè lên
   nhau) + tông --success (đặc tính TỐT của món, khác badge phạm vi chỉ là metadata trung tính). */
.if-lib-root .badge.param{top:auto;right:auto;bottom:6px;left:6px;color:var(--success)}
.if-lib-root .libft{flex:none;height:38px;display:flex;align-items:center;gap:10px;padding:0 14px;
       border-top:1px solid var(--mat-hairline);font-size:var(--fs-2xs);color:var(--t4)}
/* "N mục trong kệ …" — dồn về phải, đứng trước nút "Đưa lên kệ". Cách dồn: CHỈ dòng gợi ý đầu
   hàng giãn ra ("margin-right:auto"), mọi thứ sau nó bám phải theo đúng thứ tự DOM. KHÔNG dùng hai
   "margin-left:auto" trên cùng một hàng flex — hai "auto" thì khoảng trống CHIA ĐÔI chứ không dồn
   hết về phải, cụm bên phải bị đẩy vào giữa. Số đếm tabular để không nhảy chữ khi lọc. */
.if-lib-root .libft > span:first-child{margin-right:auto}
.if-lib-root .libft .cnt{white-space:nowrap;font-variant-numeric:tabular-nums}
.if-lib-root .libft .pub{margin-left:0}
.if-lib-root .pub{margin-left:auto;height:26px;padding:0 12px;border-radius:var(--radius-sm);background:var(--accent);color:var(--on-accent);
     font-size:var(--fs-2xs);font-weight:var(--fw-semi);display:flex;align-items:center;gap:6px;border:0;cursor:pointer;
     transition:background .12s var(--ease-apple)}
.if-lib-root .pub:hover{background:var(--accent-strong)}
.if-lib-root .pub:focus-visible,.if-lib-root .chip:focus-visible,.if-lib-root .shrow:focus-visible,
.if-lib-root .libh .cx:focus-visible{outline:none;box-shadow:0 0 0 2px var(--accent)}
.if-lib-root .empty{grid-column:1/-1;padding:26px 0;text-align:center;color:var(--t4);font-size:var(--fs-xs)}
/* ═══ CỘT THÔNG SỐ ④ — 236px (port "docs/mocks/Thư viện.dc.html" khối CotThongSo) ═══
   CHỈ hiện khi ĐANG CHỌN một món. Mock vẽ nó thường trực trong khung 1440; tấm thật lúc chốt
   phương án A (sáng 07/08) mới rộng 720 nên chiếm chỗ thường trực sẽ bóp lưới thẻ còn ~2 thẻ/hàng
   NGAY CẢ LÚC KHÔNG CẦN — nới lên 960px (chốt chiều 07/08) không đổi lý do này: cột thông số vẫn
   là mô tả MÓN ĐANG CHỌN, hiện-khi-chọn vẫn đúng dù tấm đã rộng hơn (960−236=724, còn dư hơn cả
   720 gốc, nên KHÔNG chuyển sang "thường trực" — hiện-khi-chọn vẫn nhường trọn 960px cho lưới lúc
   duyệt, đúng tinh thần "cỡ thẻ chọn được" của chốt chiều).
   🔴 SỬA 07/08 (chốt: "trượt vào từ phải · 180–220ms · không giật, không bật cụp"): trước đây
   cột chỉ RENDER/GỠ tức thì theo pickedItem — không transition nào chạy được vì React tháo
   DOM ngay khi điều kiện sai (bật/cụp đúng nghĩa Hoà cấm). Nay tách hai lớp:
    · .specwrap — LUÔN nằm trong DOM khi có displayItem (kể cả đang đóng), animate WIDTH
      0→236px. Animate width (không phải transform) để .libmain bên cạnh (flex:1) tự co giãn
      ĐÚNG TỪNG KHUNG HÌNH cùng nhịp — đây là cách duy nhất khiến lưới thẻ "co giãn theo", vì
      transform không đẩy layout anh em.
    · .speccol — width CỐ ĐỊNH 236px bên trong wrapper (không co theo wrapper) nên chữ/hàng
      không bị bóp méo giữa chừng animate; wrapper hẹp hơn thì overflow:hidden chỉ CẮT bớt,
      tạo đúng cảm giác "trượt vào từ phải". TSX giữ displayItem sống thêm 200ms sau khi bỏ
      chọn (đợi onTransitionEnd) để có khung hình đóng — xem LibrarySheet.tsx. */
.if-lib-root .specwrap{width:0;flex:none;overflow:hidden;transition:width 200ms cubic-bezier(.32,.72,0,1)}
.if-lib-root .specwrap[data-open="true"]{width:236px}
.if-lib-root .speccol{width:236px;flex:none;border-left:1px solid var(--mat-hairline);
       display:flex;flex-direction:column;height:100%;min-height:0;overflow-y:auto}
.if-lib-root .speccol .sphead{padding:14px 12px 12px;border-bottom:1px solid var(--mat-hairline)}
.if-lib-root .speccol .spprev{height:150px;border-radius:var(--radius-md);overflow:hidden;
       display:flex;align-items:center;justify-content:center;background:var(--field)}
.if-lib-root .speccol .spname{display:flex;align-items:center;gap:8px;margin-top:11px}
.if-lib-root .speccol .spname b{flex:1;min-width:0;font-size:var(--fs-sm,14px);font-weight:var(--fw-semi);
       letter-spacing:-.01em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--t1)}
.if-lib-root .speccol .spsec{padding:12px;border-bottom:1px solid var(--mat-hairline)}
.if-lib-root .speccol .spcap{font-size:var(--fs-2xs);font-weight:700;letter-spacing:.07em;
       text-transform:uppercase;color:var(--t5);margin-bottom:8px}
.if-lib-root .speccol .sprow{display:flex;align-items:center;justify-content:space-between;gap:8px;
       min-height:24px;font-size:var(--fs-xs)}
.if-lib-root .speccol .sprow .k{color:var(--t4);white-space:nowrap}
.if-lib-root .speccol .sprow .v{color:var(--t1);text-align:right;min-width:0;
       overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
/* Số (mã · giá · nhám · bóng) dùng mono + tabular đúng mock — đổi món thì chữ không nhảy cột. */
.if-lib-root .speccol .sprow .v.num{font-family:ui-monospace,Menlo,monospace;font-variant-numeric:tabular-nums}
/* Ô TRỐNG có lý do (§9): gạch ngang mờ, KHÔNG số mẫu. Không xoá dòng đi cho gọn mắt. */
.if-lib-root .speccol .sprow .v.none{color:var(--t5)}
.if-lib-root .speccol .spbar{height:3px;border-radius:2px;background:var(--field);margin-top:5px;overflow:hidden}
.if-lib-root .speccol .spbar i{display:block;height:100%;border-radius:2px;background:var(--accent)}
.if-lib-root .speccol .spwhy{padding:10px 12px;font-size:var(--fs-2xs);line-height:1.5;color:var(--t4);
       border-bottom:1px solid var(--mat-hairline)}
/* VIỆC 4 (08/08) — hàng gán mã tay, cùng viền dưới với .spwhy (cùng vùng "chưa nối kho"). Line-
   height 1,5 đúng G4 (chữ Việt có dấu chồng). select/button dùng --tap cho vùng chạm ≥44 theo
   G8 (không phải đường duy nhất — kéo thả vẫn còn, đây chỉ là lối thay thế khi khớp tự động thua). */
.if-lib-root .speccol .splink{padding:10px 12px;display:flex;flex-wrap:wrap;align-items:center;gap:6px;
       font-size:var(--fs-2xs);line-height:1.5;color:var(--t3);border-bottom:1px solid var(--mat-hairline)}
.if-lib-root .speccol .splink select{height:var(--tap);max-width:100%;border-radius:8px;border:1px solid var(--border);
       background:var(--field);color:var(--t1);font:inherit;font-size:var(--fs-2xs);padding:0 8px}
.if-lib-root .speccol .splink button{height:26px;padding:0 9px;border-radius:8px;border:1px solid var(--border);
       background:var(--field);color:var(--t2);font:inherit;font-size:var(--fs-2xs);cursor:pointer}
.if-lib-root .speccol .splink button:hover{background:var(--hover);color:var(--t1)}
.if-lib-root .speccol .spact{margin-top:auto;padding:12px;display:flex;flex-direction:column;gap:7px}
.if-lib-root .speccol .spact button{width:100%;height:var(--tap);border-radius:10px;border:0;cursor:pointer;
       font-size:var(--fs-xs);font-weight:var(--fw-semi);font-family:inherit;
       transition:background var(--dur-fast) var(--ease-apple)}
.if-lib-root .speccol .spact .primary{background:var(--accent);color:var(--on-accent)}
.if-lib-root .speccol .spact .primary:hover{background:var(--accent-strong)}
.if-lib-root .speccol .spact .ghost{background:var(--field);color:var(--t2);border:1px solid var(--border)}
.if-lib-root .speccol .spact .ghost:hover{background:var(--hover);color:var(--t1)}
/* Thẻ ĐANG CHỌN trong lưới — cùng ngôn ngữ "viền accent + quầng" với node đang chọn ở chặng 3D. */
.if-lib-root .it.on{border-color:var(--accent);box-shadow:0 0 0 4px var(--accent-soft)}

/* chuyển chế độ Duyệt kho ↔ Nạp hàng loạt — segmented nhỏ trong header, cùng ngôn ngữ .chip */
.if-lib-root .modeseg{display:flex;gap:3px;background:var(--field);border-radius:20px;padding:3px;flex:none}
.if-lib-root .modeseg button{height:22px;padding:0 10px;border-radius:20px;border:0;background:none;cursor:pointer;
      color:var(--t3);font-size:var(--fs-2xs);transition:background .12s var(--ease-apple),color .12s var(--ease-apple)}
.if-lib-root .modeseg button:hover{color:var(--t1)}
.if-lib-root .modeseg button.on{background:var(--panel);color:var(--t1);font-weight:var(--fw-semi)}
.if-lib-root .modeseg button:focus-visible{outline:none;box-shadow:0 0 0 2px var(--accent)}

/* NẠP HÀNG LOẠT — chế độ thứ 2 của sheet */
.if-lib-root .ingest{flex:1;min-height:0;display:flex;flex-direction:column;padding:12px 14px 0}
.if-lib-root .drop{flex:none;border:1.5px dashed var(--border-strong);border-radius:var(--radius-lg);
      padding:22px 16px;display:flex;flex-direction:column;align-items:center;gap:6px;color:var(--t3);
      transition:border-color .15s,background .15s}
.if-lib-root .drop.over{border-color:var(--accent);background:var(--accent-soft)}
.if-lib-root .drop b{font-size:var(--fs-sm);color:var(--t1);font-weight:var(--fw-semi)}
.if-lib-root .drop span{font-size:var(--fs-2xs);color:var(--t4);text-align:center}
.if-lib-root .pickbtn{margin-top:8px;height:28px;padding:0 14px;border-radius:var(--radius-sm);border:1px solid var(--border);
      background:var(--panel);color:var(--t1);font-size:var(--fs-2xs);font-weight:var(--fw-semi);cursor:pointer;
      transition:background .12s}
.if-lib-root .pickbtn:hover{background:var(--hover)}
.if-lib-root .pickbtn:focus-visible{outline:none;box-shadow:0 0 0 2px var(--accent)}
.if-lib-root .droplist{flex:1;min-height:0;overflow-y:auto;margin-top:10px;border:1px solid var(--border);
      border-radius:var(--radius-md);background:var(--field)}
.if-lib-root .droprow{display:grid;grid-template-columns:16px 1fr 74px 62px 22px;align-items:center;gap:8px;
      padding:7px 10px;font-size:var(--fs-2xs);color:var(--t2);border-bottom:1px solid var(--mat-hairline)}
.if-lib-root .droprow:last-child{border-bottom:0}
.if-lib-root .droprow .n{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--t1)}
.if-lib-root .droprow .k{color:var(--t4)}
.if-lib-root .droprow .s{text-align:right;color:var(--t4);font-variant-numeric:tabular-nums}
.if-lib-root .droprow .rm{width:22px;height:22px;display:flex;align-items:center;justify-content:center;border:0;
      background:none;color:var(--t4);border-radius:6px;cursor:pointer;transition:background .12s,color .12s}
.if-lib-root .droprow .rm:hover{background:var(--hover);color:var(--t1)}
.if-lib-root .ingestft{flex:none;height:38px;display:flex;align-items:center;gap:10px;
      border-top:1px solid var(--mat-hairline);margin-top:10px;font-size:var(--fs-2xs);color:var(--t4)}
.if-lib-root .ingestft .pub{margin-left:auto}
.if-lib-root .pub:disabled{opacity:.45;cursor:not-allowed}
.if-lib-root .hidden{display:none}

/* MÀN HẸP (<640px) — card đã tự co còn 12px mỗi bên nhờ công thức width ở trên, nhưng RUỘT sheet
   thì chưa: header (h3 + ô tìm 260px + segmented + ✕) và kệ (186px lúc viết rule này, nay 214px
   theo chốt 07/08 — số càng lớn càng tràn) vốn dựng cho 980px nên tràn ra ngoài rồi bị
   "overflow:hidden" cắt cụt (lỗi CÓ SẴN, không phải do đợt card-rời — chụp lại được trên bản cũ vì
   width cũ min(980,94vw) ở 420px cũng chỉ còn 394px). Vá tại chỗ, không đụng nhánh màn rộng: ô tìm
   xuống hàng riêng, kệ hẹp lại (132px, không đổi — màn hẹp không áp cùng con số desktop), lưới đổi
   bậc tối thiểu. */
@media (max-width:640px){
  .if-lib-root .libh{flex-wrap:wrap;padding:2px 12px 10px}
  .if-lib-root .libh h3{flex:none}
  .if-lib-root .srch{order:3;flex:1 1 100%;max-width:none}
  .if-lib-root .shelf{width:132px;padding:4px}
  .if-lib-root .grid{grid-template-columns:repeat(auto-fill,minmax(96px,1fr));gap:8px;padding:10px 12px 14px}
  .if-lib-root .it .th{height:62px}
  .if-lib-root .libft{height:auto;min-height:38px;padding:8px 12px;flex-wrap:wrap}
}

@media (prefers-reduced-motion:reduce){
  .if-lib-root *{animation:none!important;transition-duration:.1s!important}
  .if-lib-root .it:hover{transform:none!important}
  /* Hoà chốt: giảm chuyển động thì BỎ transform, chỉ đổi hiển thị. Card đứng đúng chỗ mở, ẩn/hiện
     bằng "visibility" (KHÔNG phải opacity — G1, xem lý do ở khối ".lib" trên). "inert" sẵn có ở
     TSX đã khoá tiêu điểm bàn phím khi đóng nên không có bẫy Tab. */
  .if-lib-root .lib{transform:translate(-50%,0) scale(1)!important;visibility:hidden;transition:none!important}
  .if-lib-root .lib[data-open="true"]{visibility:visible}
  .if-lib-root .scrim{transition:none!important}
}
`;
