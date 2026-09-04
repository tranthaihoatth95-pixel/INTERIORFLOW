// components/home/home-lock-css.ts — CSS Home BẢN KHOÁ, PORT NGUYÊN VĂN từ
// `docs/mocks/_home-lock-nen.css` + ba khối <style> riêng của
// `mock-home-lock-{co-viec,rong,day-du}.html` (bản khoá 04/09).
//
// LUẬT L2 (`docs/LUAT-GIAO-DIEN-BAT-BUOC.md`): chép markup + CSS, KHÔNG vẽ lại bằng mắt.
// Mọi con số hình học giữ NGUYÊN: thang 400 · dải ảnh 420 · vatTop 168 · dải ngữ cảnh 184 ·
// lề 56 · khe 32 · mặt nhìn 104×64 · ô widget cao 82 · hàng vật liệu 38 · dòng nền 38.
//
// BỐN KHÁC BIỆT SO VỚI BẢN VẼ — đều CÓ LÝ DO, không phải tự chế:
//
//  1. BỎ khối `:root` chép token. Bản vẽ chép nguyên văn token từ `app/globals.css` để mở
//     bằng trình duyệt là chạy; trong app thì dùng THẲNG token của app (đúng lời dặn ở
//     `HOME-IMPLEMENTATION-SPEC.md` §1 "lúc thi công thì dùng thẳng token của app, xoá khối chép").
//     Bảng tông nội dung (--canh-* · --vl-* · --nen-sang · --muc · --scrim-* · --muc-tren-anh-*)
//     đã THÊM vào `app/globals.css` cạnh khối --illus-*/--paper-* sẵn có, đúng chỗ spec chỉ.
//
//  2. BỎ `.rail` và `.dinh`. `AppShell` đã dựng rail điều hướng (`RailDieuHuong`) và mép trên
//     (`AppChrome`, 42px) cho MỌI màn — dựng lại ở đây là hai bản đồ chồng nhau, đúng thứ
//     chốt 16/08 "sidebar là hệ router toàn app" cấm. Bản vẽ vẽ chúng vì bản vẽ là trang rời.
//     Khẩu độ Vitals ở mép trên là việc của lane Vitals (D-DR1) — Home chỉ CHỪA CHỖ.
//
//  3. `html,body{width:var(--w);height:var(--h);overflow:hidden}` KHÔNG port. Đó là cách bản
//     vẽ ép khổ để chụp ảnh; trong app thì khung do `AppShell` cấp. Biến khổ (--thangW,
//     --daiH, --vatTop, --gpH, --lePhai, --khe) GIỮ NGUYÊN và vẫn đổi theo khung nhìn.
//
//  4. Biến khổ khai trên `.xuong-home` chứ không trên `:root`. Lý do: đây là component, không
//     được ghi biến toàn cục lên <html> (rò khi unmount, và đụng màn khác). Media query đổi
//     giá trị NGAY TRÊN chính phần tử đó nên hành vi y hệt bản vẽ.
//
// ⚠️ MỌI giá trị bo góc đi qua --r-1..--r-4/--r-full (thang DUYỆT 12/08). Không một số bo nào
//    gõ tay — `soi:hinh-hoc` canh chỗ này.
export const HOME_LOCK_CSS = `
/* Khung Home — nhận biến khổ. Bản vẽ đặt ở :root, ở đây đặt trên chính khung (xem lý do ④). */
.xuong-home{
  --thangW:400px;   /* trong dải Work Panel 320–440 của EXS §4 */
  --daiH:420px;     /* chiều cao dải môi trường */
  --vatTop:168px;   /* bậc NGAY BÂY GIỜ chồng lên dải bao nhiêu — đó là "gần về không gian" */
  --gpH:184px;      /* dải ngữ cảnh */
  --lePhai:56px; --khe:32px;
  display:flex;min-height:0;flex:1;background:var(--bg);color:var(--t1);
  font-size:var(--fs-sm,14px);
  /* 🔴 KHUNG ĐO LÀ CHÍNH NÓ, KHÔNG PHẢI CỬA SỔ TRÌNH DUYỆT — xem khối @container dưới. */
  container-type:inline-size;container-name:xuong;
}
/* KHỔ HẸP — thang KHÔNG đổi, chỉ đổi SỐ NGƯỜI ĐỨNG TRÊN MỖI BẬC (bản khoá §6).
   Thứ bị thu KHÔNG biến mất: nó tụt xuống bậc KHI GỌI và được ĐẾM ở đó (§30) —
   phần đếm do \`xepThang(vat, khoHep)\` lo, CSS chỉ lo chỗ.

   🔴 ĐO 04/09 TRÊN APP THẬT — VÌ SAO PHẢI LÀ @container CHỨ KHÔNG PHẢI @media:
   rail là hệ router chung, có BA NẤC 52/240/320 và người dùng tự bấm (mặc định 240).
   Home KHÔNG sở hữu bề rộng đó ⇒ chỗ Home thật sự có = viewport − rail:
     màn 1600 · rail  52 ⇒ khung 1548   (rộng)
     màn 1600 · rail 240 ⇒ khung 1360   (rộng)
     màn 1600 · rail 320 ⇒ khung 1280   (đáng lẽ HẸP)
     màn 1280 · rail 240 ⇒ khung 1040   (hẹp — @media bắt đúng)
   Hai dòng cuối có KHUNG 1280 vs 1040 nhưng dòng 1280 lại nhận bố cục RỘNG, chỉ vì
   @media đọc cửa sổ (1600). Đo được: hiện vật tụt 1036 → 768 px (−26%) mà thang vẫn 400.
   ⇒ Điều kiện phải hỏi CHÍNH KHUNG. @media giữ lại làm đường lùi cho trình duyệt cũ;
   @container đứng sau nên thắng ở nơi có hỗ trợ (Chromium 105+ / Safari 16 / FF 110).

   NGƯỠNG 1348 = 1400 − 52, tức DỊCH ngưỡng cũ sang hệ toạ độ khung: bản khoá tính lưới
   ở rail nấc hẹp nhất (52) nên "cửa sổ 1400" của nó chính là "khung 1348". Giữ đúng con
   số này để cấu hình MẶC ĐỊNH (rail 240, màn 1600 ⇒ khung 1360) ra y hệt trước — lượt
   này chỉ sửa ca thật sự hỏng (rail 320), không đẻ thêm delta cho mắt phải duyệt. */
@media (max-width:1400px){
  .xuong-home{--thangW:320px;--daiH:330px;--vatTop:126px;--gpH:150px;--lePhai:32px;--khe:24px}
}
/* ⚠️ RÀNG BUỘC CỦA CHÍNH CƠ CHẾ: một truy vấn khung KHÔNG tô được cho chính phần tử
   dựng ra khung đó. Vì thế hai khối dưới nhắm vào CON trực tiếp (".san" · ".thang") —
   mọi nơi tiêu thụ sáu biến này đều là hậu duệ của hai con đó, nên thừa kế phủ đủ.
   Khối "min-width" là bắt buộc: khi @media (cửa sổ) đã hạ xuống hẹp mà khung THẬT vẫn
   rộng (rail thu về 52 trên màn 1360) thì phải kéo lại về bộ rộng, không để lệch. */
@container xuong (max-width:1348px){
  .xuong-home>*{--thangW:320px;--daiH:330px;--vatTop:126px;--gpH:150px;--lePhai:32px;--khe:24px}
}
@container xuong (min-width:1348.01px){
  .xuong-home>*{--thangW:400px;--daiH:420px;--vatTop:168px;--gpH:184px;--lePhai:56px;--khe:32px}
}
.xuong-home *{box-sizing:border-box}
.xuong-home svg{display:block}

/* ---------- CHỮ ---------- */
.xuong-home .nhan{font:500 var(--fs-2xs,11px)/1.5 ui-monospace,'SF Mono',Menlo,monospace;letter-spacing:.08em;color:var(--t3)}
.xuong-home .so{font-variant-numeric:tabular-nums;letter-spacing:.01em}

/* ---------- SÂN: dải môi trường + bậc NGAY BÂY GIỜ + dải ngữ cảnh ---------- */
.xuong-home .san{flex:1;min-width:0;position:relative;display:flex;flex-direction:column;
  padding:0 var(--lePhai) 12px;gap:var(--khe);overflow:hidden}
/* DẢI MÔI TRƯỜNG — Wallgallery. Ảnh THẬT của xưởng, để SẮC NÉT.
   Nó là NỀN mà việc đứng lên, KHÔNG phải mặt phẳng để dán chữ — đó là chỗ khác H1.
   Có biên: nhờ có biên nên nền sáng vẫn đọc ra là nền sáng (H1 hỏng đúng chỗ này). */
.xuong-home .dai{position:absolute;left:0;right:0;top:0;height:var(--daiH);overflow:hidden;z-index:0;
  /* TAN DẦN Ở MỌI MÉP TỰ DO, không cắt ngang một nhát. Mép cứng đọc ra là "một vệt lạ",
     không đọc ra là chiều sâu — soi bằng mắt mới thấy, máy không bắt được. Đây là MẶT PHẲNG
     CHIỀU SÂU (chỉ thị D), không phải lớp phủ tối: ảnh vẫn nét 100% ở phần thân.

     🔴 04/09 — LÝ DO CỦA BẢN KHOÁ ĐÚNG CHO CẢ BỐN MÉP, KHÔNG RIÊNG MÉP ĐÁY. Đo trên app
     thật ở nền SÁNG: thân dải nằm quanh rgb(222,226,229) còn nền trang là rgb(242,239,233)
     ⇒ dải TỐI HƠN nền, biến thiên bên trong chỉ 1,039 (nền tối là 1,078). Một lớp tự khai
     là "ánh sáng theo giờ" mà tối hơn trang và phẳng thì không đọc ra ÁNH SÁNG — nó đọc ra
     MỘT TẤM XÁM, và ba mép cứng (đỉnh giáp thanh trên · trái giáp rail · phải giáp thang)
     là thứ khoá cái đọc sai đó lại thành hình chữ nhật. Tan mép ⇒ không còn hình chữ nhật
     nào để đọc; thứ còn lại là một vùng sáng nhạt dần, đúng vai khí quyển ở CẢ HAI nền.
     ⚠️ Vẫn giữ "có biên" của §4.1: dải vẫn chỉ chiếm --daiH đầu sân, KHÔNG phủ cả màn. */
  --daiTanTren:12%; --daiTanBen:5%;
  -webkit-mask-image:linear-gradient(180deg,transparent 0,#000 var(--daiTanTren),#000 74%,transparent 100%),linear-gradient(90deg,transparent 0,#000 var(--daiTanBen),#000 calc(100% - var(--daiTanBen)),transparent 100%);
  mask-image:linear-gradient(180deg,transparent 0,#000 var(--daiTanTren),#000 74%,transparent 100%),linear-gradient(90deg,transparent 0,#000 var(--daiTanBen),#000 calc(100% - var(--daiTanBen)),transparent 100%);
  -webkit-mask-composite:source-in;mask-composite:intersect}
.xuong-home .dai>*{position:absolute;inset:0}
/* VÙNG AN TOÀN NGỮ NGHĨA — nhãn chỉ được đặt trong hai ô này; cắt ảnh phải giữ hai ô đó "lặng".
   🔴 SCRIM ĐẶC, KHÔNG CHUYỂN SẮC — phép tính ở khối --scrim-* trong app/globals.css. */
.xuong-home .nhan-dai{position:absolute;z-index:1;display:inline-flex;align-items:center;gap:8px;
  padding:5px 10px;border-radius:var(--r-1);background:var(--scrim-manh);top:22px;
  font:500 var(--fs-2xs,11px)/1.5 ui-monospace,Menlo,monospace;letter-spacing:.08em;color:var(--muc-tren-anh-3)}
.xuong-home .nhan-dai.trai{left:var(--lePhai)}
.xuong-home .nhan-dai.phai{right:var(--lePhai)}
.xuong-home .nhan-dai b{color:var(--muc-tren-anh-1);font-weight:600}

/* ===== BẬC 1 · NGAY BÂY GIỜ — THÂN DUY NHẤT trên màn (luật ④ của bản khoá) =====
   Gần nhất về không gian: chồng lên dải môi trường, có bóng đổ thật, nét nhất.
   Nền của nó là nền của NỘI DUNG (mặt sáng hoặc khung hình), không phải nền app
   ⇒ mọi chữ trong nó MÁY ĐO ĐƯỢC. Đó là chỗ khác H1 (23–28 đoạn không đo được). */
.xuong-home .vat{position:relative;z-index:2;margin-top:var(--vatTop);flex:1;min-height:0;
  border-radius:var(--r-3);overflow:hidden;display:flex;flex-direction:column;text-align:left;
  box-shadow:0 26px 60px -28px rgba(0,0,0,.72),0 0 0 1px var(--vien-mo)}
.xuong-home .vat.sang{background:var(--nen-sang)}
.xuong-home .vat.toi{background:var(--canh-0)}
/* Hàng đầu và hàng chân của hiện vật là hàng CAO CỐ ĐỊNH (46 / 44). Chữ dài mà xuống dòng thì
   nó TRÀN RA NGOÀI hàng — đo được ở khổ 1280 với khung "mẻ đêm": tên vật xuống 2 dòng, chip
   "còn khoảng 22 phút" vỡ trong viên nang. ⇒ mọi con chữ ở hai hàng này đi MỘT DÒNG + cắt đuôi,
   và chip thì KHÔNG BAO GIỜ co (nó là con số, cắt đuôi con số là nói dối).
   Cắt đuôi chỉ giấu phần thừa với MẮT — trình đọc màn hình vẫn đọc trọn câu. */
.xuong-home .vat-dau{flex:0 0 46px;display:flex;align-items:center;gap:10px;padding:0 18px;
  min-width:0;white-space:nowrap;overflow:hidden}
.xuong-home .vat.sang .vat-dau{border-bottom:1px solid var(--net-sang)}
.xuong-home .vat.toi .vat-dau{border-bottom:1px solid var(--canh-2)}
.xuong-home .vat-dau .ten{font-size:var(--fs-md,16px);font-weight:600;line-height:1.5;
  flex:0 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis}
.xuong-home .vat.sang .vat-dau .ten{color:var(--muc)}
.xuong-home .vat.toi .vat-dau .ten{color:var(--canh-7)}
.xuong-home .vat-dau .kem{font-size:var(--fs-xs,12px);line-height:1.5;
  flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis}
.xuong-home .vat.sang .vat-dau .kem{color:var(--muc-2)}
.xuong-home .vat.toi .vat-dau .kem{color:var(--canh-6)}
.xuong-home .vat-dau .cuoi{margin-left:auto;display:flex;align-items:center;gap:10px;flex:0 0 auto}
.xuong-home .vat-than{flex:1;min-height:0;display:flex}
/* CHÂN — con số THẬT của chính vật đó. Viết bằng HTML nên máy đo được. */
.xuong-home .vat-chan{flex:0 0 44px;display:flex;align-items:center;gap:16px;padding:0 18px;
  font-size:var(--fs-xs,12px);line-height:1.5;min-width:0;white-space:nowrap;overflow:hidden}
/* Con SỐ không co (cắt đuôi một con số là nói dối); CÂU GIẢI THÍCH thì co và cắt đuôi được. */
.xuong-home .vat-chan>span{flex:0 0 auto}
.xuong-home .vat-chan .day2{flex:0 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis}
.xuong-home .vat.sang .vat-chan{border-top:1px solid var(--net-sang);color:var(--muc-2)}
.xuong-home .vat.toi .vat-chan{border-top:1px solid var(--canh-2);color:var(--canh-6)}
.xuong-home .vat-chan b{font-weight:600}
.xuong-home .vat.sang .vat-chan b{color:var(--muc)}
.xuong-home .vat.toi .vat-chan b{color:var(--canh-7)}
.xuong-home .vat-chan .day2{margin-left:auto}
.xuong-home .chip-sang{display:inline-flex;align-items:center;gap:6px;height:24px;padding:0 10px;
  border-radius:var(--r-full);background:var(--net-sang);color:var(--muc);white-space:nowrap;
  font-size:var(--fs-xs,12px);line-height:1.5}
.xuong-home .chip-toi{display:inline-flex;align-items:center;gap:6px;height:24px;padding:0 10px;
  border-radius:var(--r-full);background:var(--canh-2);color:var(--canh-7);white-space:nowrap;
  font-size:var(--fs-xs,12px);line-height:1.5}

/* BẢNG MẪU VẬT LIỆU — một trong các LOẠI biểu diễn (chỉ thị E: vật, không phải thẻ) */
.xuong-home .bang-vl{flex:1;min-width:0;display:flex;flex-direction:column;padding:12px 18px;gap:0;overflow:hidden}
.xuong-home .hang-vl{display:flex;align-items:center;gap:12px;height:38px;flex:0 0 38px}
.xuong-home .hang-vl+.hang-vl{border-top:1px solid var(--net-sang)}
.xuong-home .hang-vl .o{width:34px;height:24px;border-radius:var(--r-1);flex:0 0 34px}
.xuong-home .hang-vl .ten{flex:1;min-width:0;font-size:var(--fs-ui,13px);color:var(--muc);line-height:1.5;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.xuong-home .hang-vl .ma{font:500 var(--fs-2xs,11px)/1.5 ui-monospace,Menlo,monospace;letter-spacing:.06em;color:var(--muc-2)}
.xuong-home .hang-vl .dm{font-size:var(--fs-xs,12px);color:var(--muc);font-weight:600;line-height:1.5;width:74px;text-align:right}
.xuong-home .hang-vl .ng{font-size:var(--fs-2xs,11px);color:var(--muc-2);line-height:1.5;width:96px;text-align:right}
.xuong-home .canh-vl{flex:0 0 40%;min-width:0;border-left:1px solid var(--net-sang)}
.xuong-home .canh-vl svg{width:100%;height:100%}

/* KHUNG PHỐI CẢNH + CỘT THÔNG SỐ — bậc 1 khi vật đang chạy là mẻ render (nền nội dung TỐI).
   Bậc 1 KHÔNG mặc định là một loại vật; hình thức đổi theo NGHĨA của vật. */
.xuong-home .khung-anh{flex:1;min-width:0}
.xuong-home .khung-anh svg{width:100%;height:100%}
.xuong-home .canh-so{flex:0 0 34%;min-width:0;border-left:1px solid var(--canh-2);padding:14px 18px;
  display:flex;flex-direction:column;gap:0}
.xuong-home .canh-so .tit{font:500 var(--fs-2xs,11px)/1.5 ui-monospace,Menlo,monospace;letter-spacing:.08em;
  color:var(--canh-6);margin-bottom:8px}
/* Hàng GIÃN ĐỀU thay vì cao cố định: cột thông số cao hơn tổng các hàng, để cố định thì
   dư ra một khoảng trống ở đáy — đọc ra là lỗ, không đọc ra là khoảng thở. */
.xuong-home .ts{display:flex;align-items:center;gap:10px;min-height:34px;flex:1}
.xuong-home .ts+.ts{border-top:1px solid var(--canh-2)}
.xuong-home .ts .n{flex:1;font-size:var(--fs-ui,13px);color:var(--canh-6);line-height:1.5}
.xuong-home .ts .v{font-size:var(--fs-xs,12px);font-weight:600;color:var(--canh-7);line-height:1.5}

/* TRẠNG THÁI RỖNG — RESUME → BEGIN. Vẫn ĐÚNG MỘT thân, vẫn cùng hình dạng (§26):
   không phải "Home trừ ảnh hero", không phải 6 thẻ onboarding. */
.xuong-home .moi{flex:1;min-width:0;display:flex;flex-direction:column;justify-content:center;gap:18px;padding:22px 26px}
.xuong-home .moi h2{font-size:26px;line-height:1.5;font-weight:600;color:var(--muc)}
.xuong-home .moi p{font-size:var(--fs-sm,14px);line-height:1.6;color:var(--muc-2);max-width:460px}
.xuong-home .loi-vao{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.xuong-home .nut-chinh{display:inline-flex;align-items:center;gap:8px;height:var(--tap-lg);padding:0 22px;
  border-radius:var(--r-full);background:var(--accent);color:var(--on-accent);border:0;
  font-size:var(--fs-ui,13px);font-weight:600;line-height:1.5;cursor:pointer}
.xuong-home .nut-phu{display:inline-flex;align-items:center;gap:8px;height:var(--tap-lg);padding:0 18px;
  border-radius:var(--r-full);background:transparent;color:var(--muc);font-size:var(--fs-ui,13px);
  line-height:1.5;box-shadow:inset 0 0 0 1px var(--net-sang);border:0;cursor:pointer}
.xuong-home .loi-ba{font-size:var(--fs-xs,12px);line-height:1.5;color:var(--muc-2)}
.xuong-home .von{flex:0 0 38%;min-width:0;border-left:1px solid var(--net-sang);padding:18px 20px;
  display:flex;flex-direction:column;gap:12px}
.xuong-home .von .tit{font:500 var(--fs-2xs,11px)/1.5 ui-monospace,Menlo,monospace;letter-spacing:.08em;color:var(--muc-2)}
.xuong-home .dai-mau{display:flex;height:44px;border-radius:var(--r-1);overflow:hidden}
.xuong-home .dai-mau i{flex:1}
.xuong-home .von-hang{display:flex;align-items:center;gap:10px;height:34px;flex:0 0 34px}
.xuong-home .von-hang+.von-hang{border-top:1px solid var(--net-sang)}
.xuong-home .von-hang .n{flex:1;font-size:var(--fs-ui,13px);color:var(--muc);line-height:1.5}
.xuong-home .von-hang .v{font-size:var(--fs-xs,12px);font-weight:600;color:var(--muc);line-height:1.5}

/* ---------- DẢI NGỮ CẢNH — đường đi của chính bậc NGAY BÂY GIỜ ----------
   KHÔNG phải danh sách thứ phụ bị ép thành hàng ngang (§24), mà là CHUỖI THỜI GIAN:
   ý tưởng → quyết định → bản đang xem → cái gì đang chờ nó. Chuỗi thời gian thì tuyến tính
   là đúng hình dạng của nó. Đây là chỗ north star "không đánh rơi ngữ cảnh" nhìn thấy được. */
.xuong-home .ngu-canh{position:relative;z-index:2;flex:0 0 var(--gpH);background:var(--panel);
  border-radius:var(--r-3);box-shadow:0 0 0 1px var(--vien-mo);padding:13px 18px;
  display:flex;flex-direction:column;gap:11px}
.xuong-home .nc-dau{display:flex;align-items:center;gap:10px}
.xuong-home .nc-dau .ke2{flex:1;height:1px;background:var(--vien-mo)}
.xuong-home .mach{display:flex;align-items:stretch;flex:1;min-height:0}
.xuong-home .nut-mach{flex:1;min-width:0;display:flex;flex-direction:column;gap:4px;padding-right:16px}
.xuong-home .nut-mach+.nut-mach{padding-left:16px;border-left:1px solid var(--vien-mo)}
.xuong-home .nut-mach .khi{font:500 var(--fs-2xs,11px)/1.5 ui-monospace,Menlo,monospace;letter-spacing:.08em;color:var(--t3)}
.xuong-home .nut-mach .cai{font-size:var(--fs-ui,13px);line-height:1.5;color:var(--t1);font-weight:600}
.xuong-home .nut-mach .no{font-size:var(--fs-xs,12px);line-height:1.5;color:var(--t3)}
.xuong-home .nut-mach.cho .cai{color:var(--t2);font-weight:500}

/* ---------- THANG CHÚ Ý (cột phải) ---------- */
.xuong-home .thang{flex:0 0 var(--thangW);width:var(--thangW);background:var(--panel);
  border-left:1px solid var(--vien-mo);padding:14px 20px 16px;display:flex;flex-direction:column;overflow:hidden}
.xuong-home .muc{display:flex;align-items:center;gap:10px;height:26px;flex:0 0 26px}
.xuong-home .muc .ke2{flex:1;height:1px;background:var(--vien-mo)}
.xuong-home .muc .dem{font:500 var(--fs-2xs,11px)/1.5 ui-monospace,Menlo,monospace;letter-spacing:.08em;color:var(--t3)}

/* ===== BẬC 2 · KỀ BÊN — nhận ra bằng MẮT, không phải bằng đọc =====
   Không có nền thẻ (luật ④). Hình thức MẶT đổi theo NGHĨA CỦA VẬT (chỉ thị E):
   .mat-vat = khung hình / nét bản vẽ · .mat-mau = dải mẫu vật liệu. */
.xuong-home .ke-ben{display:flex;gap:12px;align-items:center;padding:10px 0;width:100%;
  background:none;border:0;text-align:left;color:inherit;font:inherit;cursor:pointer}
.xuong-home .ke-ben+.ke-ben{border-top:1px solid var(--vien-mo)}
.xuong-home .ke-ben .mat-vat{flex:0 0 auto;width:104px;height:64px;border-radius:var(--r-2);overflow:hidden}
.xuong-home .ke-ben .mat-vat svg{width:100%;height:100%}
.xuong-home .ke-ben .mat-mau{display:flex;width:104px;height:64px;border-radius:var(--r-2);overflow:hidden;flex:0 0 auto}
.xuong-home .ke-ben .mat-mau i{flex:1}
.xuong-home .ke-ben .chu{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px}
.xuong-home .ke-ben .ten{font-size:var(--fs-ui,13px);font-weight:600;color:var(--t1);line-height:1.5;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.xuong-home .ke-ben .con-so{font-size:var(--fs-xs,12px);color:var(--t2);line-height:1.5}
.xuong-home .ke-ben .khi{font-size:var(--fs-2xs,11px);color:var(--t3);line-height:1.5}

/* ===== BẬC 3 · NỀN — đang chạy / đang chờ người khác. Một dòng có số, không tranh chỗ. ===== */
.xuong-home .o-nen{display:flex;align-items:center;gap:10px;height:38px;flex:0 0 38px}
.xuong-home .o-nen+.o-nen{border-top:1px solid var(--vien-mo)}
.xuong-home .o-nen .ten{flex:1;min-width:0;font-size:var(--fs-ui,13px);color:var(--t2);line-height:1.5;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.xuong-home .o-nen .num{font-size:var(--fs-xs,12px);color:var(--t1);font-weight:600;line-height:1.5}
/* vạch tiến trình ĐO ĐƯỢC — chi tiết MANG TIN, không phải trang trí. Loại KHÔNG đo được
   thì không dựng vạch này và không có con số phần trăm nào (cấm bịa %). */
.xuong-home .vach-tt{width:52px;height:3px;border-radius:var(--r-full);background:var(--border);overflow:hidden;flex:0 0 52px}
.xuong-home .vach-tt i{display:block;height:100%;background:var(--accent)}

/* ===== BẬC 4 · KHI GỌI — tụt khỏi màn nhưng vẫn phải NÓI RA nó còn đó (§30) ===== */
.xuong-home .khi-goi{display:flex;align-items:center;gap:10px;padding:11px 0;font-size:var(--fs-xs,12px);
  color:var(--t3);line-height:1.5;width:100%;background:none;border:0;text-align:left;
  font-family:inherit;cursor:pointer}
.xuong-home .khi-goi .vach-mo{flex:1;height:1px;background:linear-gradient(90deg,var(--border-strong),transparent)}

/* DẤU TRẠNG THÁI — màu chỉ sống ở đây; hình dạng khác nhau nên màu KHÔNG là kênh duy nhất. */
.xuong-home .dau{width:9px;height:9px;flex:0 0 9px;border-radius:var(--r-full);display:inline-block}
.xuong-home .dau.chay{background:var(--success)}
.xuong-home .dau.cho{background:var(--warning);border-radius:var(--r-1)}
.xuong-home .dau.lech{background:var(--danger);border-radius:0;clip-path:polygon(50% 0,100% 100%,0 100%)}
.xuong-home .chip{display:inline-flex;align-items:center;gap:6px;height:24px;padding:0 10px;border-radius:var(--r-full);
  background:var(--card);color:var(--t2);font-size:var(--fs-xs,12px);line-height:1.5;
  box-shadow:inset 0 0 0 1px var(--vien-mo)}
.xuong-home .the-demo{font:500 var(--fs-2xs,11px)/1.5 ui-monospace,Menlo,monospace;letter-spacing:.08em;color:var(--t3);
  border:1px dashed var(--border-strong);border-radius:var(--r-1);padding:2px 7px}

/* WIDGET CÁ NHÂN — bậc KHI GỌI: thứ TÔI tự đặt và hiện đang lặng.
   Widget nào ĐANG CHẠY thì rời kệ này và lên bậc NỀN dưới dạng một dòng có số —
   không widget nào giành sự chú ý chỉ vì nó tồn tại (chỉ thị C).
   Cỡ ĐỊNH SẴN theo ô lưới (1×1 · 2×1), CẤM kéo giãn tự do: đó là điều kiện để cùng một
   widget chạy được trên máy tính · tablet · điện thoại. */
.xuong-home .ke-widget{display:flex;gap:10px;flex-wrap:wrap}
.xuong-home .o-w{background:var(--card);border-radius:var(--r-3);box-shadow:inset 0 0 0 1px var(--vien-mo);
  padding:10px 12px;display:flex;flex-direction:column;justify-content:space-between}
.xuong-home .o-w.w2{flex:1 1 100%;height:82px}
.xuong-home .o-w.w1{flex:1 1 0;min-width:0;height:82px}
.xuong-home .o-w .nh{font:500 var(--fs-2xs,11px)/1.5 ui-monospace,Menlo,monospace;letter-spacing:.08em;color:var(--t3)}
.xuong-home .o-w .gt{font-size:var(--fs-lg,20px);line-height:1.5;font-weight:600;color:var(--t1)}
.xuong-home .o-w .gt small{font-size:var(--fs-xs,12px);font-weight:400;color:var(--t3)}
/* TAY BÀY LẠI — kéo thả KHÔNG được là kênh duy nhất (bản khoá §8): mỗi ô có ba nút thật,
   đi được bằng Tab và Enter. Nút hiện khi TRỎ VÀO hoặc khi CHÍNH NÓ đang có tiêu điểm bàn
   phím — :focus-within là mắt xích bắt buộc, thiếu nó thì người dùng bàn phím Tab vào một
   nút vô hình (đúng loại lỗi "có trong mã mà không tới được người dùng"). */
.xuong-home .o-w-tay{position:absolute;right:8px;top:8px;display:flex;gap:2px;opacity:0;
  transition:opacity 90ms ease}
.xuong-home .o-w{position:relative}
.xuong-home .o-w:hover .o-w-tay,.xuong-home .o-w:focus-within .o-w-tay{opacity:1;transition-duration:160ms}
.xuong-home .o-w-tay button{width:var(--tap);height:22px;display:inline-flex;align-items:center;
  justify-content:center;border:0;border-radius:var(--r-1);background:var(--hover);color:var(--t2);
  font-size:var(--fs-xs,12px);line-height:1.5;cursor:pointer;font-family:inherit}
.xuong-home .o-w-tay button:hover{color:var(--t1)}
.xuong-home .o-w-tay button:focus-visible{outline:2px solid var(--accent);outline-offset:1px}
.xuong-home .dan{flex:1;min-height:0}

/* ---------- NGỮ PHÁP CHUYỂN ĐỘNG (bản khoá §7) ----------
   Mọi chuyển cảnh ở Home là một lần LÊN hoặc XUỐNG BẬC. Chỉ chuyển transform/opacity.
   Trỏ vào: vào 160ms · ra 90ms — vào chậm ra nhanh. Lên/xuống bậc: 320ms spring nhẹ. */
.xuong-home .vat,.xuong-home .ke-ben,.xuong-home .o-nen,.xuong-home .khi-goi,.xuong-home .o-w{
  transition:opacity 90ms ease,transform 90ms ease,box-shadow 90ms ease}
.xuong-home .ke-ben:hover,.xuong-home .khi-goi:hover{transition-duration:160ms}
.xuong-home .ke-ben:hover .ten{color:var(--accent)}
.xuong-home .nut-chinh:hover,.xuong-home .nut-phu:hover{transition-duration:160ms}
@keyframes if-home-len-bac{
  from{opacity:0;transform:translateY(8px) scale(.985)}
  to{opacity:1;transform:none}
}
.xuong-home .len-bac{animation:if-home-len-bac 320ms cubic-bezier(.32,.72,0,1) both}
/* Xếp so le — TỐI ĐA 3 vật (bản khoá §7). Vật thứ tư trở đi vào cùng lúc với vật thứ ba. */
.xuong-home .len-bac:nth-child(2){animation-delay:35ms}
.xuong-home .len-bac:nth-child(n+3){animation-delay:70ms}

/* Vòng tiêu điểm bàn phím — --accent ĐẶC, không bị overflow:hidden xén (bản khoá §8). */
.xuong-home .ke-ben:focus-visible,.xuong-home .khi-goi:focus-visible,
.xuong-home .nut-chinh:focus-visible,.xuong-home .nut-phu:focus-visible,
.xuong-home .vat:focus-visible{outline:2px solid var(--accent);outline-offset:-2px;border-radius:var(--r-2)}

/* ⚠️ prefers-reduced-motion THẮNG TẤT CẢ: bỏ hết di chuyển, đổi bậc thành thay-thế-tức-thì.
   Đây là NHÁNH THẬT — không phải khai cho có: nó tắt cả animation lẫn transition. */
@media (prefers-reduced-motion:reduce){
  .xuong-home .len-bac{animation:none}
  .xuong-home .vat,.xuong-home .ke-ben,.xuong-home .o-nen,.xuong-home .khi-goi,
  .xuong-home .o-w,.xuong-home .nut-chinh,.xuong-home .nut-phu{transition:none}
}
`;
