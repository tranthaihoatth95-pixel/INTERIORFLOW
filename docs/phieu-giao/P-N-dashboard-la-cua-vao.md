# P-N · DASHBOARD LÀ CỬA VÀO — bỏ tự-nhảy, việc đang dở thành WIDGET, dựng thanh trượt bên

> Khuôn §3 `docs/HOP-DONG-PHOI-HOP-T.md`. Tự chứa.
> **THẺ VAI [Đ4]:** phiên phụ cấp CHẶNG/LUỒNG. Chạm biên (đổi schema, đổi hợp đồng lệnh,
> đổi nền dữ liệu dự án) → **DỪNG + đề xuất lên T**.

---

## ⓪b TIỀN ĐỀ HẠ TẦNG
```bash
git log --oneline -1              # mốc mới nhất: 544999f
git rev-list --count HEAD..main   # phải ra 0
```
Lệch > 0 → **DỪNG**, báo T. Một phiên phụ khác chạy song song trên **hình nền** — nó giữ
`components/home/DongStudioHome.tsx`, `components/entry/LoginScreen.tsx`, `components/studio/LockScreen.tsx`
và mọi thứ mới trong `lib/wallpaper/`. **Đừng chạm.**

## ⓪ TIỀN ĐỀ NGHIỆP VỤ — xác nhận/bác bỏ từng ý (T đã đo, bạn đo lại)
1. *"Chỗ tự-nhảy-về-việc-đang-dở nằm ở `components/home/HomeScreen.tsx:320-322` — `if (resume && resume.route !== '/' && !resumedThisSession) router.push(resume.route)`, chạy **một lần mỗi phiên trình duyệt** (khoá bằng `sessionStorage 'interiorflow.sessionResumed'`)."*
2. *"`components/studio/StudioBar.tsx` **KHÔNG CÒN TỒN TẠI** — đã gộp vào `components/studio/AppChrome.tsx` (30/07). Lối vào 3 chặng hiện tại là `components/studio/StageSwitcher.tsx`, một **dock nằm trong thanh trên**, tự khai là *'trục điều hướng duy nhất của app'* — **KHÔNG phải thanh trượt bên**."*
3. *"`components/ui/PanelFlank.tsx` ĐÃ CÓ — tay cầm thu/mở dùng chung, đang dùng ở `AppShell` · `LibrarySheet` · `ReviewPanel` · `Render3DModeSkeleton` ⇒ thanh trượt bên **dùng lại nó**, cấm dựng tay cầm thứ hai."*
4. *"`components/home/widgets/` đã có 10 widget + `WidgetCard.tsx` + `types.ts` + `nav.ts` ⇒ widget mới là **thêm một cái theo khuôn có sẵn**, không dựng hệ widget thứ hai."*

Số/đường dẫn của T lệch cái bạn đo → **báo lại cái đúng**. Bác ý nào → **DỪNG**, báo T kèm `file:dòng`.

## ① BỐI CẢNH — nguyên văn Hoà (16/08)

> *"trước đây mỗi lần đăng nhập là sẽ vào đúng trang đang làm việc giang dỡ, nhưng giờ đổi lại, đăng nhập vào, đầu tiên sẽ là trang dashboard, tổng quan thông tin, tương tác, vào hệ 3 chặng thì mở bên trượt thanh bar. còn trang dashboard, nó vẫn có các widget live, 1 trong số đó có ô việc mà trỏ vào là cửa sổ việc giang dỡ trước đó."*

**Vì sao đổi — đọc cho đúng ý:** tự-nhảy-thẳng-vào-canvas làm KTS **mất mất phần tổng quan**. Mở app ra là rơi thẳng vào một bản vẽ, không biết hôm nay có gì, dự án nào đang chờ, ai vừa đổi gì. Dashboard trở thành **cửa vào**, và việc-đang-dở **không mất đi** — nó **đổi từ ÉP sang MỜI**: vẫn ở đó, một cú trỏ là thấy, nhưng người chọn lúc nào bước vào.

⚠️ **Điều KHÔNG được làm hỏng:** người đang làm dở giữa chừng mà mất đường quay lại nhanh thì đây là **bước lùi**, không phải cải tiến. Widget phải đưa họ về **đúng chỗ cũ trong ≤ 2 cú bấm**.

## ② ĐỌC TRƯỚC
| File | Vì sao |
|---|---|
| `components/home/HomeScreen.tsx:240-330` | toàn bộ nhánh quyết định gallery ↔ auto-resume; đọc kỹ comment, nó ghi rõ vì sao từng nhánh tồn tại |
| `lib/resume.ts` (đọc HẾT) | `ResumeState` có gì, `saveResume`/`loadResume`/`clearResume`, `GO_HOME_EVENT`, `goHomeConfirmed` |
| `components/entry/ResumeTracker.tsx` | nơi GHI resume — **giữ nguyên**, chỉ đổi nơi ĐỌC |
| `components/home/widgets/WidgetCard.tsx` · `types.ts` · `nav.ts` | khuôn widget phải theo |
| `components/ui/PanelFlank.tsx` | tay cầm thu/mở dùng chung |
| `components/studio/StageSwitcher.tsx` (đọc phần đầu) | trục điều hướng hiện tại — thanh mới phải **hợp tác**, không cạnh tranh |
| `docs/CHOT-16-08-BAN-DUNG.md` mục **B10 · B11** | widget 3 cỡ định sẵn · dashboard dùng chung xuyên nền tảng |

## ③ VÙNG FILE
**ĐƯỢC ghi:** `components/home/HomeScreen.tsx` · `components/home/widgets/**` (gồm tệp mới) · `lib/resume.ts` · `components/studio/AppChrome.tsx` · tệp MỚI cho thanh trượt bên (đặt trong `components/studio/`) · `app/globals.css` (**CHỈ THÊM** class) · `docs/mocks/mock-thanh-truot-ben.html` (mới) · `docs/bao-cao-phien/2026-08-16-P-N-dashboard-cua-vao.md` (mới).

**CẤM:** `components/home/DongStudioHome.tsx` · `components/entry/LoginScreen.tsx` · `components/studio/LockScreen.tsx` · `lib/wallpaper/**` · `components/wallpaper/**` (**phiên hình nền đang giữ**) · `scripts/**` · `docs/00-CHOT.md` · mock nào đang có · schema/DB.
**KHÔNG git. KHÔNG dev server.**

## ④ VIỆC

### V1 — Đăng nhập LUÔN dừng ở dashboard (marker: `cuaVaoDashboard`) 🔴
Bỏ nhánh tự-nhảy ở `HomeScreen.tsx:320-322`.
⚠️ **KHÔNG xoá cơ chế resume** — `ResumeTracker` vẫn ghi, `loadResume` vẫn đọc; chỉ **thôi tự điều hướng**. Dữ liệu đó nay **nuôi widget** ở V2. Xoá là mất luôn thứ V2 cần.
⚠️ Đọc kỹ comment quanh đó trước khi cắt: nhánh này đan với `consumeForceGallery()` · `stageFlag` · `isTourDone` · khoá `sessionStorage`. **Người dùng lần đầu** (chưa có resume) phải giữ nguyên hành vi cũ. Nếu `sessionStorage` không còn ai dùng sau khi cắt thì **dọn luôn**, đừng để cờ chết.
📏 Nghiệm thu: mô tả **bảng trạng thái trước → sau** cho đủ 3 hạng người dùng (lần đầu · có việc dở · không có việc dở).

### V2 — Widget "Việc đang dở" (marker: `vietDangDo`)
Thêm một widget theo **đúng khuôn `WidgetCard`** đã có.
- **Nấc gọn** (mặc định): nói bằng **ký hiệu + số** — tên dự án · chặng · *"dở từ N ngày trước"*. Đọc lướt 1 giây.
- **Trỏ vào / mở ra**: hiện **cửa sổ việc đang dở** — đủ để nhận ra *"à, đúng cái này"* trước khi bấm vào.
- **Bấm** → về **đúng chỗ cũ**, ≤ 2 cú bấm tính từ dashboard.
- **Không có việc dở** → widget **TỰ ẨN** (luật Home: widget thiếu dữ liệu tự ẩn, không hiện khung rỗng).
🔴 **Ba nấc là nhịp chung** — widget này theo đúng nhịp đó, và **nấc mặc định phải đủ tự thân**: che hai nấc kia đi vẫn đứng được một mình.
⚠️ **Thứ trong "cửa sổ" phải là dữ liệu THẬT có sẵn** (tên dự án · chặng · thời điểm). **CẤM bịa** ảnh xem trước hay tiến độ nếu chưa có nguồn — thiếu thì **nói thiếu**, đừng vẽ đại. Cần ảnh xem trước mà chưa có đường lấy → **báo T**, đừng tự chế.

### V3 — Thanh trượt bên để vào 3 chặng (marker: `thanhTruotBen`)
Hoà mô tả *"vào hệ 3 chặng thì mở bên trượt thanh bar"* — thứ đó **chưa có**.
- **Dùng lại `PanelFlank`** làm tay cầm ([Đ2] — nó chính là mẫu chung Hoà chốt 07/08 mục 10). Cấm tay cầm thứ hai.
- Thu vào là **gần như 0 diện tích nhưng vẫn thấy tay cầm** (thu rồi mà mất tích là hỏng cả mẫu).
- **Nhớ trạng thái thu/mở** giữa các phiên.
- 🔴 **Hợp tác với `StageSwitcher`, không cạnh tranh**: nay app sẽ có **hai** đường vào 3 chặng. Bạn phải **quyết và nói rõ** quan hệ giữa chúng — thanh bên **thay** dock, hay dock giữ vai khác? **Hai thứ làm y hệt nhau đặt cạnh nhau là thêm một vật thừa trên màn**, đúng thứ đợt này đang cắt. Nêu ≥2 hướng, chọn 1, ghi lý do. Nếu bạn kết luận **phải bỏ dock** thì **DỪNG và đề xuất lên T** — đó là biên (StageSwitcher tự khai *"trục điều hướng duy nhất"*).
- **Bàn phím**: mở/đóng/di chuyển giữa 3 chặng phải làm được không cần chuột.

### V4 — Bản vẽ (marker: `@dsCard`)
`docs/mocks/mock-thanh-truot-ben.html`, dòng đầu `<!-- @dsCard group="Thanh trượt bên" -->`.
Đủ **2 theme** có nút gạt · **token thật** (chú ý: `--mat-*` **đã chết**, dùng `--nen-mo-*`; đường kẻ mảnh là **`--vien-mo`**) · cấm hex ngoài khối khai token · 1440×900 không tràn ngang · tự chấm bằng `design:design-critique` + `design:accessibility-review`.
Bày: thanh **thu** ↔ **mở** · widget việc-đang-dở ở **cả ba nấc** · trạng thái **không có việc dở** (widget ẩn).
T đẩy lên Claude Design; bạn **không có** `DesignSync`.

## ⑤ RÀNG BUỘC
- **Undo trước hỏi sau**: đổi điều hướng không được làm mất việc đang làm. Có `useLeaveConfirm`/`goHomeConfirmed` sẵn — **dùng lại**.
- Widget khai theo **ô lưới**, **cấm khai px** — đó là điều kiện để cùng widget chạy trên máy tính/tablet/điện thoại (chốt B10-B11).
- **Song ngữ VI/EN** cho mọi chuỗi mới. Nhãn **≤ 12 từ**, cấm jargon nội bộ lộ ra UI.
- `prefers-reduced-motion` thắng mọi hiệu ứng trượt.
- Màu qua biến CSS, cấm hex. Thang bo **6/10/14/20 + `--r-full`**, `rInner = max(4, rOuter − pad)`.
- **Trích mã điều khoản `docs/TRIET-LY-IF.md`** — **MỞ FILE ĐỌC SỐ, cấm nhớ hộ**: **[T5] con người quyết cuối** (`:32`) · **[Đ2] nhìn vào trong trước** (`:72`). Số T ghi sai thì **báo lại đúng số**.

## ⑥ NGHIỆM THU TỰ LÀM
```bash
npx tsc --noEmit
npm test
npm run soi:tu-dien
npm run soi:hinh-hoc
npm run soi:thao-tac
npm run soi:frontier
```

## ⑥b ĐIỀU KIỆN ĐÍCH — VÒNG TỰ ĐÓNG
**ĐÍCH:** `tsc` 0 · `npm test` **0 fail** · `soi:frontier` 0 lệch · `soi:tu-dien` **không tăng** (nền 212) · `soi:hinh-hoc` **10** và `soi:thao-tac` **31+193** giữ mốc · bảng trạng thái V1 phủ **đủ 3 hạng người dùng** · widget **tự ẩn** khi không có việc dở, chứng minh được · đường về việc cũ **≤ 2 cú bấm**, đếm ra được · mock 0 mục chữ dưới ngưỡng ở **cả hai theme**.
**VÒNG:** chưa đạt → tự sửa, **trần 5 vòng**. **QUÁ TRẦN → DỪNG**, nộp kèm bảng *"vòng nào hỏng vì gì"*. **CẤM** khai đạt khi chưa đạt.

## ⑦ BÁO CÁO
`docs/bao-cao-phien/2026-08-16-P-N-dashboard-cua-vao.md`, khuôn 6 phần `docs/CLAUDE.md`.

## ⑦b CHƯA CHẮC — bắt buộc, trống cũng ghi "không có"
Bắt buộc phủ: bạn **có chạy app thật không** (nếu không thì mọi kết luận về điều hướng là **đọc mã**, nói thẳng) · nhánh nào trong `HomeScreen` bạn **không dám chắc** đã hiểu đúng · dữ liệu widget lấy từ đâu và **trường nào chưa có nguồn** · quan hệ thanh-bên ↔ dock bạn **quyết** hay **đoán**.

## ⑦c HẠN DÙNG KẾT LUẬN
*"Hết đúng khi …"* — ít nhất phủ: khi **Home bento tuỳ biến** được thi công (widget đổi chỗ được) · khi `hotkey-registry` B2 nối xong · khi bản tablet/điện thoại bắt đầu làm.

## ⑧ DÂY MÁY
`home-bento` · `luong-theo-viec` · `khung-mot-khuon`. Bạn **không** sửa registry — T flip sau audit.
