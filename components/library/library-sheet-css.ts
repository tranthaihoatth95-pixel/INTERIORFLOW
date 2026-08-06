// components/library/library-sheet-css.ts — CSS Thư viện sheet, PORT NGUYÊN VĂN từ
// `docs/mocks/mock-if-3chang.html` khối "══════ THƯ VIỆN — sheet trượt lên, kính ══════".
//
// L2 (`docs/LUAT-GIAO-DIEN-BAT-BUOC.md`): chép markup+CSS, KHÔNG vẽ lại bằng mắt. Mọi con số
// (186px kệ · 122px ô lưới · 76px thumbnail · 24px chip · 15px badge · 38px chân sheet ·
// min(980px,94vw) × min(560px,74vh)) giữ NGUYÊN.
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
/* ═══ CARD RỜI (detached sheet, chuẩn iOS 15+) — Hoà chốt 05/08 ═══
   Trước: dính đáy (bottom:0), chỉ bo 2 góc trên, rộng tới 980px.
   Nay:  · cách đáy 14px (+ safe-area máy có notch/thanh home)
         · bo ĐỦ BỐN GÓC cùng bán kính var(--radius-lg)=20px
         · width min(720px, 100vw−24px) ⇒ màn rộng canh giữa không tràn, màn <640px tự còn
           12px mỗi bên (một công thức lo cả hai, không cần media query thứ hai)
         · bóng mạnh hơn vì card NỔI hẳn (shadow-sheet cũ có spread âm −12px, hợp với vật dính mép)
   Chuyển động: KHÔNG dùng opacity — ".badge" bên trong có "backdrop-filter", mà G1 cấm animate
   opacity trên phần tử có backdrop-filter VÀ MỌI TỔ TIÊN. Nên trạng thái đóng đẩy hẳn xuống dưới
   mép màn (thay vì 24px như brief) để card không "hiện đứng im rồi mới nhích" — giữ nguyên
   scale(.98)→1, 260ms vào / 200ms ra, cubic-bezier(.32,.72,0,1) như brief. */
.if-lib-root .lib{position:fixed;left:50%;
     bottom:calc(14px + env(safe-area-inset-bottom, 0px));
     width:min(720px, calc(100vw - 24px));height:min(560px,74vh);
     border-radius:var(--radius-lg);border:1px solid var(--mat-hairline);
     box-shadow:0 12px 40px rgba(0,0,0,.34);z-index:91;display:flex;flex-direction:column;overflow:hidden;
     transform-origin:50% 100%;
     transform:translate(-50%, calc(100% + 14px + env(safe-area-inset-bottom, 0px))) scale(.98);
     transition:transform 200ms cubic-bezier(.32,.72,0,1)}
.if-lib-root .lib[data-open="true"]{transform:translate(-50%,0) scale(1);
     transition-duration:260ms}
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
.if-lib-root .srch{flex:1;max-width:260px;height:28px;background:var(--field);border:1px solid var(--border);
      border-radius:var(--radius-sm);display:flex;align-items:center;gap:7px;padding:0 9px;color:var(--t4);font-size:var(--fs-xs)}
.if-lib-root .srch input{flex:1;min-width:0;border:0;background:none;outline:none;color:var(--t1);font:inherit}
.if-lib-root .srch input::placeholder{color:var(--t4)}
.if-lib-root .libbody{flex:1;display:flex;min-height:0}
.if-lib-root .shelf{width:186px;flex:none;border-right:1px solid var(--mat-hairline);padding:4px 6px;overflow-y:auto}
.if-lib-root .shrow{width:100%;height:30px;display:flex;align-items:center;gap:9px;padding:0 9px;border-radius:var(--radius-sm);
       color:var(--t2);font-size:var(--fs-xs);text-align:left;transition:background .12s var(--ease-apple);border:0;background:none;cursor:pointer}
.if-lib-root .shrow:hover{background:var(--hover)}
.if-lib-root .shrow.on{background:var(--accent-soft);color:var(--accent);font-weight:var(--fw-semi)}
.if-lib-root .shrow .c{margin-left:auto;font-size:var(--fs-2xs);color:var(--t4);font-variant-numeric:tabular-nums}
.if-lib-root .shcap{padding:9px 9px 5px;font-size:var(--fs-2xs);font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:var(--t5)}
.if-lib-root .libmain{flex:1;min-width:0;display:flex;flex-direction:column}
.if-lib-root .chips{flex:none;display:flex;gap:5px;padding:9px 14px;border-bottom:1px solid var(--mat-hairline);overflow-x:auto;scrollbar-width:none}
.if-lib-root .chip{height:24px;padding:0 11px;border-radius:20px;background:var(--field);color:var(--t3);
      font-size:var(--fs-2xs);white-space:nowrap;display:flex;align-items:center;gap:5px;border:0;cursor:pointer;
      transition:background .12s var(--ease-apple),color .12s var(--ease-apple)}
.if-lib-root .chip:hover{background:var(--hover);color:var(--t1)}
.if-lib-root .chip.on{background:var(--accent);color:#fff;font-weight:var(--fw-semi)}
.if-lib-root .grid{flex:1;overflow-y:auto;padding:12px 14px 16px;display:grid;
      grid-template-columns:repeat(auto-fill,minmax(122px,1fr));gap:11px;align-content:start}
.if-lib-root .it{border-radius:var(--radius-md);overflow:hidden;background:var(--card);border:1px solid var(--border);
    text-align:left;padding:0;cursor:grab;transition:transform .2s var(--ease-apple),box-shadow .2s var(--ease-apple),border-color .15s}
.if-lib-root .it:hover{transform:translateY(-2px) scale(1.02);box-shadow:var(--shadow-pop);border-color:var(--border-strong)}
.if-lib-root .it:active{transform:scale(.99);transition-duration:.09s}
.if-lib-root .it:focus-visible{outline:none;border-color:var(--accent);box-shadow:0 0 0 2px var(--accent)}
.if-lib-root .it .th{height:76px;position:relative;display:flex;align-items:center;justify-content:center;color:var(--t5);
     border-bottom:1px solid var(--border)}
/* icon LOẠI ở ô chưa có ảnh/quả cầu — đủ đọc trên vân, không át vân */
.if-lib-root .it .th .kicon{opacity:.5;color:var(--t2)}
.if-lib-root .it .mt{padding:7px 9px 9px}
.if-lib-root .it .mt .a{font-size:var(--fs-2xs);font-weight:var(--fw-semi);color:var(--t2);overflow:hidden;
           text-overflow:ellipsis;white-space:nowrap}
.if-lib-root .it .mt .b{font-size:var(--fs-2xs);color:var(--t5);margin-top:2px;font-family:ui-monospace,Menlo,monospace}
/* q0b (ca trực 02:xx bắt): badge dùng blur(10px) SỐ CỨNG — vi phạm luật kính lỏng "mọi giá trị
   kính đi từ token". Nay suy từ --blur (22px): badge chỉ cao 15px nên lấy MỘT NỬA token, blur
   nguyên 22px trên vệt 15px thì nhoè hết chữ. Chia từ token nên đổi token là đổi theo, không
   còn con số rời. Kèm -webkit- (bài học K3: thiếu prefix ⇒ tablet không blur). */
.if-lib-root .badge{position:absolute;top:6px;right:6px;height:15px;padding:0 5px;border-radius:5px;background:var(--mat-card);
       backdrop-filter:blur(calc(var(--blur) / 2));-webkit-backdrop-filter:blur(calc(var(--blur) / 2));
       color:var(--t3);font-size:9px;font-weight:700;display:flex;align-items:center;
       letter-spacing:.03em}
.if-lib-root .badge.st{color:var(--accent-warm)}
.if-lib-root .libft{flex:none;height:38px;display:flex;align-items:center;gap:10px;padding:0 14px;
       border-top:1px solid var(--mat-hairline);font-size:var(--fs-2xs);color:var(--t4)}
.if-lib-root .pub{margin-left:auto;height:26px;padding:0 12px;border-radius:var(--radius-sm);background:var(--accent);color:#fff;
     font-size:var(--fs-2xs);font-weight:var(--fw-semi);display:flex;align-items:center;gap:6px;border:0;cursor:pointer;
     transition:background .12s var(--ease-apple)}
.if-lib-root .pub:hover{background:var(--accent-strong)}
.if-lib-root .pub:focus-visible,.if-lib-root .chip:focus-visible,.if-lib-root .shrow:focus-visible,
.if-lib-root .libh .cx:focus-visible{outline:none;box-shadow:0 0 0 2px var(--accent)}
.if-lib-root .empty{grid-column:1/-1;padding:26px 0;text-align:center;color:var(--t4);font-size:var(--fs-xs)}

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
   thì chưa: header (h3 + ô tìm 260px + segmented + ✕) và kệ 186px vốn dựng cho 980px nên tràn ra
   ngoài rồi bị "overflow:hidden" cắt cụt (lỗi CÓ SẴN, không phải do đợt card-rời — chụp lại được
   trên bản cũ vì width cũ min(980,94vw) ở 420px cũng chỉ còn 394px). Vá tại chỗ, không đụng nhánh
   màn rộng: ô tìm xuống hàng riêng, kệ hẹp lại, lưới đổi bậc tối thiểu. */
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
