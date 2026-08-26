# VISUAL MASTER INDEX — PHẦN A · toàn bộ `docs/mocks/*.dc.html` (36 tệp)

> **Vai:** đây là BẢN KIỂM KÊ trí nhớ thiết kế đã có. Không thiết kế gì mới, không đề xuất gì mới.
> Mọi kết luận đọc từ **nội dung tệp**, đối chiếu `CLAUDE-DESIGN-CURRENT.md` ·
> `CLAUDE-DESIGN-QUEUE.md` · `AUDIT-2026-08-22-home-noi-dung-va-sidebar.md` ·
> `LUAT-VAT-LIEU-KINH-G0-G3.md`, và grep code thật trong `app/` `components/` `lib/`.
> Lập 22/08/2026.

## Ba điều phải đọc trước khi dùng bảng này

1. **⛔ `ls -l` mtime KHÔNG phải ngày thiết kế.** 21/36 tệp mang mtime **16/08** — đó là lượt đổi tên
   token `--mat-*` → `--nen-mo-*` (906 chỗ / 55 tệp mock, ghi trong `00-CHOT` 16/08 lượt 4), **không
   phải** một vòng vẽ lại. Tệp mới-sửa-gần-đây ở đây thường là tệp **cũ hơn** tệp mtime 07/08.
2. **Hai thế hệ tệp, phân biệt bằng dòng đầu.** 6 tệp mang `<!-- @dsCard group="..." -->` +
   `<!-- TRANSFER NOTES -->` là **đợt 22/08** (Home · Auth · Workspace-ToolWindow · Settings ·
   Gallery-Explore · Review-Gate — cả 6 còn `??` untracked trong git). 30 tệp còn lại là đợt
   **06–10/08**, đã commit (`7303aee` 08/08 và các commit lân cận), không có `@dsCard`.
3. **Nhãn `[BẢN CHỐT]` trong `<title>` là lời khai chính tắc của chính bản vẽ** — có ở đúng 3 tệp
   (`Bốn trạng thái rỗng` · `Lịch · Nhắc việc` · `Tiến độ · Gantt`), và cả 3 đều khớp với con trỏ
   `CLAUDE-DESIGN-CURRENT.md`. Đây là tín hiệu mạnh hơn mtime, dùng để tách cặp trùng.

**Hình dạng chung của cả 36 tệp:** đều khai token 2 theme ngay trong `<style>`
(`:root,[data-theme="dark"]` + `[data-theme="light"]`), nên **LIGHT/DARK = YES trên toàn bộ corpus**;
khác nhau là có **núm đổi nền hiện trên mặt** hay không. Chỉ 6 tệp đợt 22/08 + `Nút tổng` có
artboard khổ hẹp ~1100px. Chỉ **một** tệp duy nhất có khung điện thoại thật (`Kéo thả`).

---

## 1 · ĐỢT 22/08 — 6 bản vẽ mang `@dsCard` + `TRANSFER NOTES`

```
SURFACE: Home · Living Canvas (dashboard xưởng cá nhân)
USER JOB: Mở app buổi sáng, biết ngay nên quay lại việc gì, không phải đi tìm.
BEST MOCK: Home.dc.html — nhưng CHỈ để đọc lập luận, KHÔNG dựng (xem VISUAL STATUS)
ALTERNATIVE MOCKS: claude-home-living-canvas-final.html · claude-home-first-use.html · claude-home-widget-system.html (cả ba ngoài corpus phần A)
DATE: 22/08/2026 (untracked; nội dung nhắc "22/08")
LIGHT: YES — nút "Nền sáng" hiện trên mặt, token 2 theme đầy đủ
DARK: YES
TABLET: YES — artboard F "Bề ngang hẹp · ~1100px"
MOBILE: NO — chỉ nhắc chữ "điện thoại" trong chú thích, không có khung máy
TOUCH: NO
PRODUCTION ROUTE: `/`
LIVE COMPONENT: app/page.tsx → components/home/HomeScreen.tsx → components/home/DongStudioHome.tsx (+ components/home/widgets/*)
CURRENT PRODUCTION STATUS: MISMATCH — bản vẽ in "21/21" và "19 Bản nháp"; `AUDIT-2026-08-22` đo `sqlite3 prisma/dev.db` ra 15 Project trong đó 9 là `__nb:` placeholder + fixture test ⇒ **số dự án thật = 0**. Bản vẽ đang vẽ lại một con số không đo cái gì có thật.
VISUAL STATUS: OBSOLETE
NOTES: 6 artboard A–F (Có dự án · Xưởng còn trống · Hệ widget · Sửa Home · Ba mật độ · 1100px). `CLAUDE-DESIGN-CURRENT.md` đóng dấu **SUPERSEDED** — *"bố cục 4 dải bị bác §4/§41"*, thay bằng `claude-home-living-canvas-final.html`. Phần còn giá trị: khối `<!-- DESIGN NOTES -->` cuối tệp ghi 4 lỗi đã chẩn (kệ dự án bị cắt mép · nửa phải 1440 bỏ trống · nhãn tiết mục quá nhạt · màn hẹp mất nhịp) — 4 chẩn đoán này vẫn đúng và không có chỗ nào khác chép lại. Thứ tự đọc chính tắc bản vẽ khai: KHÔNG KHÍ → TIẾP TỤC → KỆ DỰ ÁN → CẢM HỨNG.
```

```
SURFACE: Auth · Login · Đăng ký · Màn khoá · Tiếp tục
USER JOB: Bước vào xưởng; và khi rời bàn một lúc thì che bàn lại mà không mất bàn.
BEST MOCK: Auth.dc.html
ALTERNATIVE MOCKS: claude-login-redesign-abc.html (3 phương án A/B/C sau verdict FAIL) · claude-login-home-ambient-final.html (ĐÃ BỊ BÁC) — cả hai ngoài corpus phần A
DATE: 22/08/2026 (untracked)
LIGHT: YES · DARK: YES (nút "Đổi nền" trên mặt)
TABLET: YES — artboard F "Khổ hẹp ~1100px"
MOBILE: NO
TOUCH: NO — nhưng L3 trong TRANSFER NOTES cấm dùng `title` vì "title câm trên cảm ứng"
PRODUCTION ROUTE: `login` (+ màn khoá là lớp phủ trên mọi route)
LIVE COMPONENT: components/entry/LoginScreen.tsx · LoginForm.tsx · LoginBackdrop.tsx · IFLogo.tsx · **components/studio/LockScreen.tsx** · components/auth/TheXacThucLai.tsx · components/entry/ResumeTracker.tsx
CURRENT PRODUCTION STATUS: MISMATCH — bản vẽ tự khai 3 lệch đã đo: L1 docstring `LoginForm.tsx:27` còn ghi gạch tab màu **đồng** (vàng đồng đã bị bỏ 16/08) · L2 phím khoá ⌘⇧L (brief) vs ⌃⌘Q (`lib/lockscreen.ts`) chưa ai đo lại · L3 nút Apple luôn trả "Cần Apple Developer". Thêm N2: `ResumeTracker.tsx` **đang render null** ⇒ dải "Tiếp tục" chưa tồn tại.
VISUAL STATUS: GOOD / USE AS TARGET
NOTES: ⚠️ **Đừng lẫn với verdict FAIL.** Verdict mắt 22/08 trong `CLAUDE-DESIGN-QUEUE.md` bác `claude-login-home-ambient-final.html`, **không** bác tệp này. Tệp này chốt một phân biệt mà không bản nào khác nói: **KHOÁ ≠ ĐĂNG XUẤT** — màn khoá là tấm phủ lên bàn đang sống, nên **không được mang ô email nào**, và mở ra là nhấc tấm phủ chứ không phải app khởi động lại. TRANSFER NOTES chỉ đích danh `components/studio/LockScreen.tsx` **KHÔNG phải** `components/entry/LockScreen.tsx` — đã verify: `components/entry/LockScreen.tsx` **không tồn tại**, cảnh báo đó đúng. Khai "KHÔNG token mới", 3 giá trị dẫn xuất bằng `color-mix()` từ token thật.
```

```
SURFACE: Workspace · Canvas + Cửa sổ công cụ (ToolWindow)
USER JOB: Nối các công đoạn thành một dây chuyền nhìn thấy được, và làm việc sâu bên trong một công đoạn mà không rời sơ đồ.
BEST MOCK: Workspace-ToolWindow.dc.html
ALTERNATIVE MOCKS: Bảng nút.dc.html (nền canvas node) · Nút tổng.dc.html (gom nút)
DATE: 22/08/2026 (untracked)
LIGHT: YES · DARK: YES (núm "Đổi nền sáng / tối")
TABLET: YES — artboard G "Khổ hẹp ~1100 — vệ tinh đổi CHỖ, không biến mất"
MOBILE: NO · TOUCH: NO
PRODUCTION ROUTE: `projects/[id]/render`
LIVE COMPONENT: components/FlowCanvas.tsx · components/render-studio/CuaSoCongCu.tsx · components/nodes/HopCongCuBamVat.tsx · components/nodes/InteriorNode.tsx (cả 4 tệp ĐÃ TỒN TẠI)
CURRENT PRODUCTION STATUS: UNKNOWN — 4 tệp bản vẽ nêu đều có thật, nhưng chưa so pixel. `CLAUDE-DESIGN-CURRENT.md` ghi NOT STARTED.
VISUAL STATUS: CANONICAL
NOTES: 7 artboard A–G. Đây là tệp duy nhất trong corpus phát biểu **bốn vai** thành câu dùng được: *Canvas là SƠ ĐỒ DÂY CHUYỀN · Cửa sổ là XƯỞNG của một công đoạn · Chặng là KHUNG NHÌN · Sidebar là BẢN ĐỒ* — khớp `IF-KIEN-TRUC.md` §2. Ba nấc THU/VỪA/TOÀN MÀN dựng theo luật "ba nấc = ba công năng". `CLAUDE-DESIGN-QUEUE.md` khai nợ #1 ngay trong tệp này: **nấc TOÀN MÀN chưa tự nuôi nổi mình** (mới chỉ là CỠ, chưa là TẦNG TIN) ⇒ điều kiện ship: dựng tầng ĐỐI CHIẾU hai kết quả 1:1, **không dựng thì ship HAI nấc**. Artboard F "Cửa sổ THẢO LUẬN" chốt: có loại cửa sổ mà sản phẩm là một QUYẾT ĐỊNH, không phải một tệp ⇒ **không phải cửa sổ nào cũng có cổng ra**. Queue cũng chỉ định tệp này làm khuôn cho D8 (vành ngữ nghĩa Render): hai loại tiến trình — đo được = vạch rời + số · không đo được = capsule quét, KHÔNG số.
```

```
SURFACE: Settings · Cài đặt
USER JOB: Chỉnh công cụ cho khớp cách mình làm nghề (đơn vị, tỉ lệ, màn hình chính, nơi lưu).
BEST MOCK: Settings.dc.html
ALTERNATIVE MOCKS: —
DATE: 22/08/2026 (untracked)
LIGHT: YES · DARK: YES (núm "Sáng / Tối")
TABLET: YES — artboard E "Khổ hẹp ~1100px"
MOBILE: NO · TOUCH: NO
PRODUCTION ROUTE: `settings` (+ `settings/about` · `settings/avatar` · `settings/licenses`)
LIVE COMPONENT: app/settings/page.tsx → app/settings/_components/PixelSettingsShell.tsx + SettingsNavigator.tsx; mục con: components/settings/UnitsScaleSettings.tsx · LockScreenSettings.tsx · StorageSettings.tsx
CURRENT PRODUCTION STATUS: MISMATCH — artboard **B "Màn hình chính"** vẽ một mục CHƯA CÓ: đã verify `lib/home/che-do-home.ts` **tồn tại** (4 chế độ đã chạy thật) nhưng `components/settings/HomeLayoutSettings.tsx` **KHÔNG tồn tại** ⇒ đúng như bản vẽ khai: logic chạy rồi mà người dùng không có chỗ nào chọn.
VISUAL STATUS: GOOD / USE AS TARGET
NOTES: 5 artboard A–E. Danh sách trái = 4 nhóm THẬT của `SettingsNavigator` (Hồ sơ · Giao diện · Nơi lưu file · Nâng cao), không bịa nhóm. Artboard C (Đơn vị & Tỉ lệ) là mục dày nhất, dựng theo yêu cầu "vẫn đọc lướt được". Artboard D cố ý để một mục **chưa đặt** (Lưu trữ) — ô trống là bằng chứng còn việc, đúng luật §9.
```

```
SURFACE: Gallery / Explore
USER JOB: Duyệt ảnh tuyển chọn có nguồn, thay cho thói quen lục Pinterest ảnh rác.
BEST MOCK: Gallery-Explore.dc.html
ALTERNATIVE MOCKS: —
DATE: 22/08/2026 (untracked; nội dung có mốc 14/08/2026)
LIGHT: YES · DARK: YES (núm "Đổi nền sáng / tối")
TABLET: YES — artboard F "1100px"
MOBILE: NO · TOUCH: NO
PRODUCTION ROUTE: `library/gallery`
LIVE COMPONENT: app/library/gallery/page.tsx → components/library/GalleryLienNganh.tsx + GalleryNavigator.tsx (+ lib/library/gallery-data.ts · gallery-source-guard.ts · gallery-tags.ts — tất cả ĐÃ TỒN TẠI)
CURRENT PRODUCTION STATUS: UNKNOWN — 8 tệp bản vẽ nêu đều có thật, chưa so pixel.
VISUAL STATUS: GOOD / USE AS TARGET
NOTES: Tự khai "D4 · bản vẽ đích". Luật nội dung mạnh nhất trong corpus: **không "Thịnh hành", không lượt xem/thích, không xếp hạng phổ biến — số nào máy không đo được thì số đó không xuất hiện**; ảnh không rõ nguồn thì nói thẳng là không rõ. `CLAUDE-DESIGN-QUEUE.md` khai nợ #2: ba mục trong Explore **KHÔNG THỂ ship** và đã đóng dấu PLACEHOLDER hiện rõ trên mặt — nguồn CC0 (thiếu connector + câu hỏi pháp lý chưa ai trả lời) · ảnh dự án của studio (Gallery đang là localStorage per-máy, thiếu phạm vi cấp STUDIO ⇒ rỗng vĩnh viễn) · ảnh gần giống (repo 0 gói ML).
```

```
SURFACE: Review Gate · Cổng soát duyệt
USER JOB: Trước khi giao, biết chỗ nào SAI CHUẨN (chặn được) và chỗ nào chỉ là GÓP Ý (không bao giờ chặn).
BEST MOCK: Review-Gate.dc.html
ALTERNATIVE MOCKS: —
DATE: 22/08/2026 (untracked)
LIGHT: NO — tệp duy nhất trong corpus chỉ khai `data-theme="dark"`, không có khối `[data-theme="light"]`
DARK: YES
TABLET: YES — artboard F "Khổ hẹp ~1100px"
MOBILE: NO · TOUCH: NO
PRODUCTION ROUTE: NONE (cố ý — bản vẽ khai *"mở ở mép phải của chặng đang làm, không phải một trang riêng"*)
LIVE COMPONENT: components/review/ReviewPanel.tsx (+ components/ui/PanelFlank.tsx · lib/review/hien-thi-luat.ts · lib/review/luat/cad.ts · lib/review/gopy/index.ts)
CURRENT PRODUCTION STATUS: MISMATCH — 3 tệp bản vẽ giao việc cho đều **KHÔNG tồn tại**: `components/review/CongXuat.tsx` · `TheGopY.tsx` · `TheLuat.tsx`. `components/review/` hiện chỉ có đúng `ReviewPanel.tsx`. Artboard E (cổng xuất) và cặp thẻ LUẬT↔GÓP Ý chưa được dựng.
VISUAL STATUS: GOOD / USE AS TARGET
NOTES: 6 artboard A–F. Thi hành chốt 07/08 §12 hai-lớp: LUẬT do máy tính, tất định, dẫn được điều khoản, chặn được nghiệm thu ↔ GÓP Ý do AI, mỗi lần một khác, **không bao giờ chặn**. Artboard C dựng hai thẻ cạnh nhau + tiêu đề phụ *"Phân biệt hai lớp KHÔNG cần nhìn màu"* — đúng luật màu-không-là-kênh-duy-nhất. Câu chốt: *máy đề xuất, người quyết; không có nút tự sửa ở đâu cả* (khớp `lib/cad/standards/checker.ts:5-7`). ⚠️ Thiếu theme sáng là khe hở thật, không phải chọn lựa — 35 tệp còn lại đều có.
```

---

## 2 · CHẶNG 2D KỸ THUẬT — 3 tệp, cùng một chặng, ba thời điểm khác nhau

```
SURFACE: Chặng 2D Kỹ thuật · màn chính
USER JOB: Vẽ và soát bản vẽ kỹ thuật: cây lớp trái, bản vẽ giữa, thuộc tính phải.
BEST MOCK: 2D Kỹ thuật.dc.html
ALTERNATIVE MOCKS: Chế độ Phác thảo.dc.html · Chế độ Chuyên.dc.html (hai chế độ con, KHÔNG thay thế bản này)
DATE: 06–08/2026 (mtime 16/08 = lượt đổi tên token, không phải vẽ lại)
LIGHT: YES · DARK: YES (nút "Đổi sang nền Kem")
TABLET: NO · MOBILE: NO · TOUCH: NO
PRODUCTION ROUTE: `projects/[id]/cad` (route `cad-editor` chỉ là `LegacyStageRedirect`)
LIVE COMPONENT: components/studio/CadStageScreen.tsx (+ components/cad/CadEditor.tsx · CadCanvas.tsx)
CURRENT PRODUCTION STATUS: UNKNOWN — `CLAUDE-DESIGN-CURRENT.md` ghi PARTIAL; chưa so pixel.
VISUAL STATUS: GOOD / USE AS TARGET
NOTES: Khai rõ **cùng khung sáu ổ với màn 3D** — đây là mắt xích chống bệnh "3 chặng như 3 app", nên đừng sửa khung ở đây mà không sửa `3D Dựng khối.dc.html`. Ba khung = cùng một màn ở ba thời điểm (đang chọn tường · cây lớp ẩn/khoá · cột phải thuộc tính). Số đo thật (2 340 × 160 × 2 700 mm · tỉ lệ 1:50). `CLAUDE-DESIGN-CURRENT.md` §3 ghi bản này đã **thay** `mock-2d-ky-thuat_cu.html` · `mock-cad-shell-v2..v5_cu.html` · `mock-cad-shell-pro_cu.html` (hậu tố `_cu` = SUPERSEDED, cấm dựng).
```

```
SURFACE: Chặng 2D Kỹ thuật · chế độ Phác thảo (bút + cử chỉ)
USER JOB: Phác nhanh bằng bút trên tablet, nét theo lực nhấn, tì tay không ra nét.
BEST MOCK: Chế độ Phác thảo.dc.html
ALTERNATIVE MOCKS: 2D Kỹ thuật.dc.html (màn chính) · BangTron.dc.html (bảng tròn nhấn-giữ, là MỘT MẢNH của bản này)
DATE: 06–08/2026 (nội dung nhắc 02/08 · 03/08 · 06/08)
LIGHT: YES · DARK: YES (nút "Đổi nền")
TABLET: YES — cả bản vẽ là ca dùng bút/tablet
MOBILE: NO
TOUCH: **YES** — pointer events, lực nhấn, nhấn giữ 500 ms, tì tay, nhánh `pointercancel`
PRODUCTION ROUTE: `projects/[id]/cad` (chế độ `sketch`)
LIVE COMPONENT: components/studio/CadStageScreen.tsx → components/cad/CadCanvas.tsx (+ components/print/RadialToolMenu.tsx cho bảng tròn)
CURRENT PRODUCTION STATUS: UNKNOWN — PARTIAL theo con trỏ.
VISUAL STATUS: GOOD / USE AS TARGET
NOTES: Mã bản vẽ tự đặt: `VE-SKETCH-TOUCH`. Ràng buộc kỹ thuật viết thẳng lên mặt: **không dùng HTML5 Drag&Drop**, phải là pointer events, và phải có nhánh `pointercancel` để lùi lại. Nút 56 px, khai rõ "không hover" ⇒ tuân luật tablet-không-giấu-sau-hover. Cùng gia đình chính tắc với `BangTron.dc.html` (bảng tròn chính là thứ bung ra sau nhấn-giữ 500 ms) — **không được thiết kế lại rời nhau**.
```

```
SURFACE: Chặng 2D Kỹ thuật · chế độ Chuyên (không gian Giấy · in PDF)
USER JOB: Đưa bản vẽ từ màn hình ra giấy đúng khổ, đúng tỉ lệ, đúng khung tên.
BEST MOCK: Chế độ Chuyên.dc.html
ALTERNATIVE MOCKS: ToGiay.dc.html · HopXuatPDF.dc.html · BangNetIn.dc.html (ba mảnh phóng to của chính bản này)
DATE: 06–08/2026 (nội dung nhắc 02/08 · 03/08 · 06/08)
LIGHT: YES · DARK: YES (nút "Đổi nền")
TABLET: NO · MOBILE: NO · TOUCH: NO
PRODUCTION ROUTE: `projects/[id]/cad` (chế độ `pro` / tab Giấy)
LIVE COMPONENT: components/cad/CadSheets.tsx (+ components/print/PaperSheetFrame.tsx · ExportPdfDialog.tsx · LineweightTable.tsx)
CURRENT PRODUCTION STATUS: UNKNOWN — PARTIAL theo con trỏ.
VISUAL STATUS: GOOD / USE AS TARGET
NOTES: Mã bản vẽ: `VE-LAYOUT-PAPER`. Chốt kiến trúc: **không gian Giấy tách khỏi không gian Mô hình**; mỗi tờ có khổ · khung nhìn cắt từ mô hình · tỉ lệ riêng · trạng thái khoá. Khung tên chỉ là **chỗ đặt** — nội dung do `titleBlockPro()` sinh, mock **cố ý không dựng lại** (đúng luật Brand Kit thuộc dự án, cấm hardcode). Có artboard "trạng thái trống".
```

---

## 3 · CHẶNG 3D / CANVAS NODE — 3 tệp

```
SURFACE: Chặng 3D · Dựng khối
USER JOB: Dựng và sửa khối trong không gian ba chiều, thấy cây đối tượng và gizmo.
BEST MOCK: 3D Dựng khối.dc.html
ALTERNATIVE MOCKS: —
DATE: 06–08/2026
LIGHT: YES · DARK: YES
TABLET: NO · MOBILE: NO · TOUCH: NO
PRODUCTION ROUTE: `projects/[id]/render` (chế độ 3D)
LIVE COMPONENT: components/three/Viewport3D.tsx · components/render-studio/Render3DModeSkeleton.tsx · components/render-studio/Object3DTree.tsx
CURRENT PRODUCTION STATUS: UNKNOWN — `CLAUDE-DESIGN-CURRENT.md` ghi PARTIAL và gọi bản này là **chuẩn chất lượng (§11)**.
VISUAL STATUS: CANONICAL
NOTES: Con trỏ chỉ định đây là **thước đo chất lượng** cho các bản khác, nên khi hai bản vẽ cãi nhau về khung/mật độ thì bản này thắng. Chốt: *"một giao diện duy nhất, KHÔNG có chế độ con"* (khớp chốt 03/08 "mode 3D không chia mode"). 4 thời điểm: không chọn gì · chọn khối · kéo mặt (2 700 mm) · dock công cụ mở rộng. Cây đối tượng theo TẦNG (±0 / +3 300 / +6 600), ViewCube + trục X/Y/Z, giá tín dụng hiện trước khi chạy ("4 ảnh · 8 tín dụng"). Toàn bộ dữ liệu đóng dấu **DỮ LIỆU MẪU** trên mặt.
```

```
SURFACE: Canvas node (chặng 3D) · bảng nút
USER JOB: Nối các bước xử lý thành một dây chuyền và thấy ngay chỗ nối sai.
BEST MOCK: Bảng nút.dc.html
ALTERNATIVE MOCKS: Workspace-ToolWindow.dc.html (bản 22/08, nói về CỬA SỔ trên cùng canvas này) · Nút tổng.dc.html
DATE: 06–08/2026
LIGHT: YES · DARK: YES (nút "Đổi sang nền Kem")
TABLET: NO · MOBILE: NO · TOUCH: NO
PRODUCTION ROUTE: `projects/[id]/render`
LIVE COMPONENT: components/FlowCanvas.tsx · components/nodes/InteriorNode.tsx · components/nodes/ParamField.tsx
CURRENT PRODUCTION STATUS: UNKNOWN — không nằm trong bảng con trỏ.
VISUAL STATUS: GOOD / USE AS TARGET
NOTES: Chốt ngữ pháp cổng nối bằng MÀU THEO LOẠI: ảnh · mặt nạ · vật liệu · tham số (`--p-img` `--p-mask` `--p-mat` `--p-num` khai ngay trong `:root`). Dây nối sai kiểu = **đỏ đứt đoạn + lời báo ngắn**. Đây là nền mà `Workspace-ToolWindow.dc.html` đặt cửa sổ lên trên — hai tệp bổ sung nhau, không cạnh tranh.
```

```
SURFACE: Canvas node (chặng 3D) · Nút tổng (macro)
USER JOB: Gom nhiều nút hay dùng thành một công cụ dùng lại được, chỉ lộ ra tham số mình chọn.
BEST MOCK: Nút tổng.dc.html
ALTERNATIVE MOCKS: Bảng nút.dc.html
DATE: 06–08/2026
LIGHT: YES · DARK: YES (nút "Đổi sang nền Kem")
TABLET: YES (nhẹ) — có nhắc khổ 1100
MOBILE: NO · TOUCH: NO
PRODUCTION ROUTE: `projects/[id]/render`
LIVE COMPONENT: components/nodes/MacroSelectionToolbar.tsx · MacroCreateDialog.tsx · MacroNodeFace.tsx · MacroShelf.tsx · GroupOverlay.tsx
CURRENT PRODUCTION STATUS: MATCHES (cấu trúc, chưa so pixel) — 5 artboard của bản vẽ ánh xạ 1:1 với 5 tệp production đã tồn tại: chọn nhiều nút → `MacroSelectionToolbar` · hộp đặt tên/biểu tượng/tham số đưa ra ngoài → `MacroCreateDialog` · mặt nút tổng → `MacroNodeFace` · kệ "Nút tổng của tôi / của dự án" → `MacroShelf` · viền chọn quanh vùng → `GroupOverlay`.
VISUAL STATUS: GOOD / USE AS TARGET
NOTES: Đây là một trong số rất ít bản vẽ trong corpus **đã đi trọn đường sang code**. Ranh giới chốt: *"chỉ những tham số bạn chọn mới hiện ra ngoài, phần còn lại nằm bên trong"* + đếm số lần dùng ("Đã dùng 24 lần") làm tín hiệu xếp kệ. Hai phạm vi kệ: của tôi ↔ của dự án.
```

---

## 4 · CHI TIẾT IN ẤN — 4 mảnh, cùng một gia đình, KHÔNG phải 4 màn

```
SURFACE: In ấn · bảng nét
USER JOB: Đặt độ đậm từng lớp trước khi in, và soát lại trên PDF sau khi xuất.
BEST MOCK: BangNetIn.dc.html
ALTERNATIVE MOCKS: Chế độ Chuyên.dc.html (màn cha) · HopXuatPDF.dc.html
DATE: 06/08/2026
LIGHT: YES · DARK: YES (token 2 theme; không có núm trên mặt)
TABLET: NO · MOBILE: NO · TOUCH: NO
PRODUCTION ROUTE: `projects/[id]/cad` (panel trong chế độ Chuyên)
LIVE COMPONENT: components/print/LineweightTable.tsx (+ lib/print/lineweight.test.ts)
CURRENT PRODUCTION STATUS: UNKNOWN — component cùng vai đã tồn tại, chưa so pixel.
VISUAL STATUS: GOOD / USE AS TARGET
NOTES: **Không phải một màn** — là một panel hẹp, không có header trang, không `@dsCard`. Bảy dòng lớp với số mm thật (0.50 → 0.09) + chuyển bản màu ↔ đen trắng. 🔴 Có chuỗi **"Checklist TTT"** in trên mặt — vi phạm LUẬT TRUNG TÍNH (`CLAUDE.md`: cấm nhúng tên studio vào sản phẩm). Phải dọn khi dựng.
```

```
SURFACE: In ấn · tờ giấy (không gian Giấy)
USER JOB: Nhìn thấy tờ A3 thật: vùng in được, các khung nhìn, cái nào đã khoá tỉ lệ.
BEST MOCK: ToGiay.dc.html
ALTERNATIVE MOCKS: Chế độ Chuyên.dc.html (màn cha) · HopXuatPDF.dc.html
DATE: 06/08/2026
LIGHT: YES · DARK: YES
TABLET: NO · MOBILE: NO · TOUCH: NO
PRODUCTION ROUTE: `projects/[id]/cad` (tab Giấy) · dùng lại khi xuất từ `projects/[id]/present`
LIVE COMPONENT: components/print/PaperSheetFrame.tsx
CURRENT PRODUCTION STATUS: UNKNOWN — component tồn tại, chưa so pixel.
VISUAL STATUS: GOOD / USE AS TARGET
NOTES: Mảnh nhỏ nhất corpus (80 dòng). Ba trạng thái khung nhìn trên cùng một tờ: **ĐÃ KHOÁ** (1/50) · **CHƯA KHOÁ** (1/50) · 1/20 · + một ô trống mời kéo khung nhìn vào. Chú thích trên mặt: *"Nội dung do titleBlockPro() sinh — lib/cad/commands.ts:347. Mock không dựng lại."* — bản vẽ **duy nhất** trong corpus trích đường dẫn:dòng của production; kỷ luật đáng nhân rộng.
```

```
SURFACE: In ấn · hộp xuất PDF
USER JOB: Chọn khổ/tỉ lệ, soát checklist trước khi xuất, rồi xuất.
BEST MOCK: HopXuatPDF.dc.html
ALTERNATIVE MOCKS: ToGiay.dc.html · BangNetIn.dc.html
DATE: 06/08/2026
LIGHT: YES · DARK: YES
TABLET: NO · MOBILE: NO · TOUCH: NO
PRODUCTION ROUTE: `projects/[id]/cad` · `projects/[id]/present`
LIVE COMPONENT: components/print/ExportPdfDialog.tsx (+ lib/print/export-checks.ts)
CURRENT PRODUCTION STATUS: UNKNOWN — component + `export-checks.ts` đều tồn tại, chưa so pixel.
VISUAL STATUS: GOOD / USE AS TARGET
NOTES: Là một **hộp thoại có scrim**, không phải màn. Checklist 5 mục trước khi xuất, trong đó một mục cố ý ở trạng thái cảnh báo (`! VP-02 chưa khoá — tỉ lệ có thể lệch`) ⇒ dựng đúng luật CHUAN-DAU-RA-NGHE (máy chặn lúc xuất). Hai lối xuất: 3 tờ ↔ chỉ tờ đang mở.
```

```
SURFACE: In ấn / vẽ tay · bảng tròn công cụ (nhấn-giữ)
USER JOB: Đổi công cụ bằng ngón/bút mà không rời mắt khỏi chỗ đang vẽ.
BEST MOCK: BangTron.dc.html
ALTERNATIVE MOCKS: Chế độ Phác thảo.dc.html (màn cha — bảng tròn là thứ bung ra sau nhấn-giữ 500 ms)
DATE: 06–08/2026
LIGHT: YES · DARK: YES
TABLET: YES · MOBILE: NO
TOUCH: **YES** — mọi nút dùng `--tap-lg: 44px`, bố cục xoè quanh điểm chạm, có animation bung `scale(.86)→1`
PRODUCTION ROUTE: `projects/[id]/cad`
LIVE COMPONENT: components/print/RadialToolMenu.tsx (được gọi từ components/cad/CadCanvas.tsx)
CURRENT PRODUCTION STATUS: UNKNOWN — component tồn tại, chưa so pixel.
VISUAL STATUS: GOOD / USE AS TARGET
NOTES: 67 dòng, mảnh thuần: 7 công cụ (Bút · Hình · Gôm · Hoàn tác · Đo · Chữ) xoè quanh một lõi. ⚠️ Tệp nằm ở `components/print/` trong production nhưng **không dính gì tới in** — lệch chỗ đặt đã có sẵn trong code, không phải lỗi của bản vẽ.
```

---

## 5 · BẢNG VIỆC · LỊCH · TIẾN ĐỘ — 5 tệp, 2 cặp trùng đã phân giải

```
SURFACE: Bảng việc (kanban)
USER JOB: Nhìn cả tuần việc theo cột trạng thái, kéo thẻ để đổi trạng thái.
BEST MOCK: Bảng việc.dc.html
ALTERNATIVE MOCKS: Kéo thả.dc.html (cùng nội dung việc, nhưng trên khung điện thoại)
DATE: 08/08/2026 (commit `7303aee`; nội dung nhắc 12–16/8)
LIGHT: YES · DARK: YES
TABLET: NO · MOBILE: NO · TOUCH: NO
PRODUCTION ROUTE: `tasks`
LIVE COMPONENT: app/tasks/page.tsx → components/tasks/TaskBoardScreen.tsx + TasksNavigator.tsx
CURRENT PRODUCTION STATUS: UNKNOWN — `CLAUDE-DESIGN-CURRENT.md` ghi NOT STARTED, nhưng `TaskBoardScreen.tsx` đã tồn tại ⇒ con trỏ và code không khớp nhau, cần đo.
VISUAL STATUS: GOOD / USE AS TARGET
NOTES: 4 cột trạng thái, nhãn màu theo LOẠI việc, lọc theo dự án + theo người, hạn trễ đổi màu báo. Có thanh chuyển **Bảng · Tiến độ · Lịch** ở đầu màn — tức ba tệp (Bảng việc · Tiến độ · Gantt · Lịch · Nhắc việc) là **BA TAB CỦA MỘT MÀN**, không phải ba màn rời. Khớp luật "một nguồn, nhiều mặt tiền".
```

```
SURFACE: Lịch việc (tab Lịch của Bảng việc)
USER JOB: Thấy hạn việc/mốc/họp trên ô ngày, và việc quá hạn không bị trôi mất.
BEST MOCK: Lịch · Nhắc việc.dc.html
ALTERNATIVE MOCKS: Lịch việc.dc.html
DATE: 08/08/2026 (commit `7303aee`, cùng lượt với bản kia)
LIGHT: YES · DARK: YES
TABLET: NO · MOBILE: NO · TOUCH: NO
PRODUCTION ROUTE: NONE — không có route lịch nào trong `app/`
LIVE COMPONENT: NONE (chỉ có `components/tasks/TaskBoardScreen.tsx` cho tab Bảng)
CURRENT PRODUCTION STATUS: NOT BUILT — `ls app` không có `tasks/calendar` hay tương đương; grep `Calendar` chỉ trúng `lib/integrations/providers/google.ts|ms365.ts` (OAuth lịch ngoài), không phải màn lịch.
VISUAL STATUS: CANONICAL
NOTES: Mang nhãn **`[BẢN CHỐT]`** trong `<title>` và được `CLAUDE-DESIGN-CURRENT.md` liệt kê làm target. Giàu hơn bản kia: có Tháng ↔ Tuần, lọc 2 dự án + 3 người, song ngữ (Mon/Tue · Month/Week), múi giờ hiện rõ (GMT+7). Luật riêng: **việc quá hạn giữ nguyên trên NGÀY ĐÃ HẸN + viền đỏ**, không dồn về hôm nay.
```

```
SURFACE: Lịch việc (tab Lịch của Bảng việc)
USER JOB: (như trên)
BEST MOCK: Lịch · Nhắc việc.dc.html
ALTERNATIVE MOCKS: Lịch việc.dc.html ← TỆP NÀY
DATE: 08/08/2026 (cùng commit `7303aee`; mtime 16/08 chỉ là lượt đổi tên token)
LIGHT: YES · DARK: YES
TABLET: NO · MOBILE: NO · TOUCH: NO
PRODUCTION ROUTE: NONE
LIVE COMPONENT: NONE
CURRENT PRODUCTION STATUS: NOT BUILT
VISUAL STATUS: EXPLORATION ONLY
NOTES: Bản thăm dò của cùng một tab: lịch tháng + panel phải (việc hôm nay / trong tuần / nhắc trước buổi họp). **Không** có nhãn `[BẢN CHỐT]`, **không** nằm trong `CLAUDE-DESIGN-CURRENT.md`, không có Tuần, không song ngữ, không lọc theo người. ⚠️ mtime của nó (16/08) MỚI HƠN bản chốt (07/08) — đây đúng là ca "đừng chọn theo tệp mới nhất".
```

```
SURFACE: Tiến độ / Gantt (tab Tiến độ của Bảng việc)
USER JOB: Nhìn đường găng, việc trễ, và mốc giao khách sắp tới trên một trục thời gian.
BEST MOCK: Tiến độ · Gantt.dc.html
ALTERNATIVE MOCKS: Tiến độ dự án.dc.html
DATE: 08/08/2026 (commit `7303aee`)
LIGHT: YES · DARK: YES (có thêm núm `{{ fxLabel }}` bật/tắt hiệu ứng)
TABLET: NO · MOBILE: NO · TOUCH: NO
PRODUCTION ROUTE: NONE
LIVE COMPONENT: NONE — grep `Gantt` toàn repo = 0
CURRENT PRODUCTION STATUS: NOT BUILT
VISUAL STATUS: CANONICAL
NOTES: Mang nhãn **`[BẢN CHỐT]`**, và là target trong `CLAUDE-DESIGN-CURRENT.md`. Thi hành LightState nghiêm nhất trong corpus: **ánh sáng chỉ được dùng cho ĐÚNG BA thứ** — đường phụ thuộc trên đường găng · thanh việc đang làm · mốc giao khách trong 7 ngày; *"mọi thứ khác đứng yên"*. Có núm tắt hiệu ứng ⇒ có đường cho `prefers-reduced-motion`. Song ngữ (Timeline / By project).
```

```
SURFACE: Tiến độ / Gantt (tab Tiến độ của Bảng việc)
USER JOB: (như trên)
BEST MOCK: Tiến độ · Gantt.dc.html
ALTERNATIVE MOCKS: Tiến độ dự án.dc.html ← TỆP NÀY
DATE: 08/08/2026 (cùng commit; mtime 16/08 là lượt token)
LIGHT: YES · DARK: YES
TABLET: NO · MOBILE: NO · TOUCH: NO
PRODUCTION ROUTE: NONE
LIVE COMPONENT: NONE
CURRENT PRODUCTION STATUS: NOT BUILT
VISUAL STATUS: EXPLORATION ONLY
NOTES: Bản thăm dò: mốc hình thoi, đường mảnh nối phụ thuộc, đường đứt đỏ = hôm nay, ba mức xem Ngày/Tuần/Tháng. Thiếu hẳn tầng nghĩa của ánh sáng mà bản chốt đặt ra. Không nhãn `[BẢN CHỐT]`, không trong con trỏ.
```

```
SURFACE: Kéo thả cảm ứng (bảng việc trên điện thoại)
USER JOB: Đổi thứ tự / trạng thái việc bằng ngón tay, và vẫn cuộn được như thường.
BEST MOCK: Kéo thả.dc.html
ALTERNATIVE MOCKS: Bảng việc.dc.html (cùng nội dung, khổ desktop)
DATE: 08/08/2026 (commit `7303aee`)
LIGHT: YES · DARK: YES
TABLET: YES
MOBILE: **YES** — 9 khung điện thoại dọc thật (25 chỗ khai bề rộng ~390px, có thanh trạng thái 9:41)
TOUCH: **YES** — nhấn giữ 250 ms + rung một nhịp, vật nhấc cao hơn ngón 40px, tay nắm kéo thẳng
PRODUCTION ROUTE: `tasks`
LIVE COMPONENT: components/tasks/TaskBoardScreen.tsx
CURRENT PRODUCTION STATUS: UNKNOWN — chưa đo hành vi chạm trên app thật.
VISUAL STATUS: GOOD / USE AS TARGET
NOTES: 🔴 **TÊN TRONG CON TRỎ SAI.** `CLAUDE-DESIGN-CURRENT.md` gọi tệp này là *"Kéo thả (library→canvas)"* và gắn nó với `TRANSFER-NOTE-2026-08-22-library-drop-specid.md`. Nội dung tệp **không có** thư viện, **không có** canvas, **không có** `specId` — nó là kéo-thả VIỆC trên điện thoại ("Chạm giữ để nhấc một việc" · "Đo lại trần phòng ngủ" · "Đội trực" · "Tuần này"). Xem §ĐIỂM ĐÁNG NGỜ. Giá trị thật của tệp: đây là **bản vẽ MOBILE/TOUCH duy nhất của cả corpus 36 tệp** ⇒ mọi luật chạm (ngưỡng nhấn giữ, khoảng nhấc, đường thứ hai bằng nút/menu, chỗ cũ để trống) chỉ tồn tại ở đây. Luật a11y bản vẽ tự đặt: **mọi chỗ kéo thả đều phải có đường thứ hai bằng nút hoặc menu**.
```

---

## 6 · DỰ ÁN · HỒ SƠ · CỘNG TÁC — 6 tệp

```
SURFACE: Tổng quan cấp STUDIO (không phải cấp dự án — xem NOTES)
USER JOB: Chủ trì liếc một cái biết cả studio: dự án nào chạy, việc nào trễ, ai đang gánh nặng.
BEST MOCK: Tổng quan dự án.dc.html
ALTERNATIVE MOCKS: Home.dc.html (chồng lấn phần "kệ dự án")
DATE: 08/2026 (nội dung nhắc 9/8 · 15/8 · 22/8)
LIGHT: YES · DARK: YES
TABLET: NO · MOBILE: NO · TOUCH: NO
PRODUCTION ROUTE: NONE cho đúng phạm vi studio; gần nhất là `projects/[id]/overview` (phạm vi MỘT dự án — khác phạm vi)
LIVE COMPONENT: app/projects/[id]/overview/page.tsx (phạm vi dự án) — không có component nào cho bảng tổng quan studio
CURRENT PRODUCTION STATUS: NOT BUILT (ở đúng phạm vi bản vẽ) — `CLAUDE-DESIGN-CURRENT.md` ghi "Project Overview · PARTIAL", nhưng đó là nói về route cấp dự án, không phải bản vẽ này.
VISUAL STATUS: NEEDS SMALL CORRECTION
NOTES: 🔴 Tên tệp nói "dự án" (số ít), nội dung là **bảng điều khiển cả studio**: *"Tổng quan · studio"*, *"6 dự án"*, *"2 sắp bàn giao trong tháng"*, tải việc theo người. Lệch phạm vi này phải giải trước khi dựng, vì nó quyết định bản vẽ thuộc route nào — và nó chồng lấn nặng với Home (kệ dự án + việc đang dở). ⚠️ Bốn số tổng ở đầu màn (6 dự án · 4 việc trễ · 68% · chờ khách) rơi đúng vào loại số mà `AUDIT-2026-08-22` chứng minh là **đang đếm rác test**; giữ khuôn hiển thị được, nhưng nguồn số phải làm lại.
```

```
SURFACE: Bốn trạng thái rỗng (cài lần đầu)
USER JOB: Người vừa cài xong, chưa có gì, vẫn biết phải làm gì tiếp.
BEST MOCK: Bốn trạng thái rỗng.dc.html
ALTERNATIVE MOCKS: claude-home-first-use.html (ngoài corpus phần A — chỉ phủ Home)
DATE: 08/08/2026 (commit `7303aee`)
LIGHT: YES · DARK: YES
TABLET: NO · MOBILE: NO · TOUCH: NO
PRODUCTION ROUTE: `projects` · `projects/[id]/cad` · `projects/[id]/render` · `projects/[id]/present` (bốn artboard = bốn route)
LIVE COMPONENT: components/studio/ProjectScopeEmptyState.tsx · components/render-studio/Render3DModeSkeleton.tsx · components/home/BatDauNgaySoKhong.tsx
CURRENT PRODUCTION STATUS: UNKNOWN — `CLAUDE-DESIGN-CURRENT.md` ghi PARTIAL; ba component trạng-thái-rỗng đều đã tồn tại.
VISUAL STATUS: CANONICAL
NOTES: Mang nhãn **`[BẢN CHỐT]`** (một trong ba tệp có nhãn này). Thi hành trực tiếp LUẬT TRUNG TÍNH: *"không có dự án mẫu, không có tên khách, không có tên studio nào"* — và đúng thế, tệp dùng `{{ tenDuAn }}` placeholder thay vì tên thật. Câu định vị đáng giữ: **"ô trống là lời mời làm việc tiếp, không phải lời xin lỗi"**. Cũng là bản vẽ duy nhất thi hành luật X2 (cấm chặn vì "chưa làm bước trước") cho cả bốn chặng cùng lúc.
```

```
SURFACE: Nhập bản vẽ có sẵn (ingest DWG/DXF/PDF)
USER JOB: Nạp bản vẽ người khác gửi tới, và biết máy đọc được gì, bỏ gì, ngờ gì.
BEST MOCK: Nhập bản vẽ có sẵn.dc.html
ALTERNATIVE MOCKS: —
DATE: 08/2026 (nội dung nhắc 28/07 · 05/08 · 07/08)
LIGHT: YES · DARK: YES
TABLET: NO · MOBILE: NO · TOUCH: NO
PRODUCTION ROUTE: `library/ingest` (kéo-thả tệp) + hộp nhập trong `projects/[id]/cad`
LIVE COMPONENT: app/library/ingest/page.tsx (+ lib/refingest.ts · lib/cad/dwg-map.ts)
CURRENT PRODUCTION STATUS: UNKNOWN — `CLAUDE-DESIGN-CURRENT.md` ghi PARTIAL.
VISUAL STATUS: GOOD / USE AS TARGET
NOTES: Đóng dấu **"CHỈ ĐỂ XEM"** và **"DỮ LIỆU MẪU"** ngay trên mặt. Ba thời điểm: chọn tệp · **đang nạp · HUỶ ĐƯỢC** · báo cáo nạp. Trạng thái huỷ-được là chỗ đắt: nó khớp thẳng chốt 08/08 về DWG §11d (worker treo giữa `convertEx`, đường Huỷ phải bỏ rơi worker chứ không `terminate`). Khuôn "nói thẳng nó đọc được gì / bỏ gì / ngờ gì" chính là khuôn khai-thật, đáng dùng lại cho mọi máy nhập.
```

```
SURFACE: Xem cấu kiện (inspector khi chọn một vật)
USER JOB: Chọn một vật trên bản vẽ và biết ngay số nào là khai báo, số nào máy đoán.
BEST MOCK: Xem cấu kiện.dc.html
ALTERNATIVE MOCKS: —
DATE: 08/2026
LIGHT: YES · DARK: YES
TABLET: NO · MOBILE: NO · TOUCH: NO
PRODUCTION ROUTE: `projects/[id]/cad`
LIVE COMPONENT: components/studio/CadStageScreen.tsx (cột phải) — không có component inspector riêng mang tên này
CURRENT PRODUCTION STATUS: UNKNOWN — `CLAUDE-DESIGN-CURRENT.md` ghi PARTIAL.
VISUAL STATUS: CANONICAL
NOTES: Đây là bản vẽ **duy nhất** trong corpus dựng thành hình cờ tin cậy 3 nấc: thuộc tính lấy từ bản vẽ ghi **KHAI BÁO**; thuộc tính máy đoán ghi **SUY ĐOÁN** và để mờ hơn, kèm đếm "2 mục suy đoán" ở đầu panel. ⚠️ Nó vẽ **HAI** nấc trong khi code có **BA** (`measured|inferred|verified`, `lib/dna/types.ts:88`) — đúng chỗ lệch mà `00-CHOT` 16/08 đã bắt ở phương án chữ ký PA2. Cần đối chiếu trước khi dựng.
```

```
SURFACE: Phiên bản hồ sơ (so hai bản)
USER JOB: So bản mới với bản đã gửi khách và chỉ đúng chỗ vừa đổi.
BEST MOCK: Phiên bản hồ sơ.dc.html
ALTERNATIVE MOCKS: —
DATE: 08/2026 (nội dung nhắc 15/7 · 16/7 · 20/7)
LIGHT: YES · DARK: YES
TABLET: NO · MOBILE: NO · TOUCH: NO
PRODUCTION ROUTE: NONE
LIVE COMPONENT: NONE — chỉ có lib/flow-version-retention.ts (chính sách giữ bản, không phải màn so bản)
CURRENT PRODUCTION STATUS: NOT BUILT — `CLAUDE-DESIGN-CURRENT.md` ghi NOT STARTED; grep component so-bản = 0.
VISUAL STATUS: GOOD / USE AS TARGET
NOTES: Hai cách so chạy thật trên mock: **Chia đôi** ↔ **Đè lên nhau**. Ngữ pháp màu: tím = thêm/sửa, đỏ = đã bỏ. Luật nghiệp vụ in trên mặt: **bản đã gửi khách có dấu phát hành và không sửa được nữa** — ràng buộc này chưa nằm ở đâu khác. Đây cũng là nguồn của hình mẫu "thẻ nổi rời, hở cả 4 mép" mà chốt 07/08 dùng để định nghĩa "card rời".
```

```
SURFACE: Chat nhóm theo dự án
USER JOB: Bàn việc ngay cạnh bản vẽ, và thấy ngay chỗ hai người sửa trùng nhau.
BEST MOCK: Chat nhóm.dc.html
ALTERNATIVE MOCKS: —
DATE: 07/08/2026 (nội dung nhắc 12/7 · 2/8 · 4/8 · 6/8)
LIGHT: YES · DARK: YES
TABLET: NO · MOBILE: NO · TOUCH: NO
PRODUCTION ROUTE: NONE — `ls app` không có `chat`; chỉ có `app/api/chat/route.ts`
LIVE COMPONENT: components/ChatPanel.tsx (panel, không phải màn)
CURRENT PRODUCTION STATUS: NOT BUILT — API có, trang không có. Khớp đúng ghi chú `00-CHOT` 16/08 (*"CHAT có API nhưng KHÔNG có trang — stage đã chốt ở CẤP 0.5 mà chưa dựng mặt"*).
VISUAL STATUS: GOOD / USE AS TARGET
NOTES: Kỷ luật màu chặt: **chỉ hai màu đặc** — tím cho việc đang diễn ra, đỏ cho chỗ sửa trùng. Bản vẽ nói thẳng phần chưa có: *"Gọi thoại nhóm · chưa nối"* (đúng luật cấm nút giả, và khớp chốt 11/08 "không tự xây engine video call"). Bản vẽ xem được trong luồng ⇒ đây là chỗ chat gặp một-nguồn.
```

---

## 7 · THƯ VIỆN · TRI THỨC · VITALS — 4 tệp

```
SURFACE: Master Library (tấm thư viện)
USER JOB: Tìm và lấy một món ra dùng — vật liệu, cấu kiện, ảnh — mà không rời việc đang làm.
BEST MOCK: Thư viện.dc.html
ALTERNATIVE MOCKS: Gallery-Explore.dc.html (mặt tuyển chọn của kệ Ảnh, KHÔNG phải kho thứ hai)
DATE: 06/08/2026 (chú thích trong tệp ghi rõ "06/08")
LIGHT: YES · DARK: YES (nút "Đổi nền")
TABLET: NO · MOBILE: NO · TOUCH: NO (có trạng thái "Xem trạng thái kéo" nhưng bằng chuột)
PRODUCTION ROUTE: `library` (+ tấm mở đè được từ mọi route)
LIVE COMPONENT: components/library/LibrarySheet.tsx (+ library-sheet-css.ts · lib/library/use-library-sheet.ts)
CURRENT PRODUCTION STATUS: UNKNOWN — `CLAUDE-DESIGN-CURRENT.md` ghi PARTIAL (lane B: kệ 73 món thật).
VISUAL STATUS: CANONICAL
NOTES: Khai **MỘT SHEET cho cả sáu kệ** + khung sáu ổ có số đo cứng: thanh trên 42 · cột kệ **214** · vùng thẻ · cột thông số **236** · dock 58 · thanh trạng thái 26 — khớp đúng chốt 07/08 (phương án A: cột thông số chỉ hiện khi đang chọn). ⭐ Tệp này chứa một lời tự thú đáng giữ nguyên văn: hai tên `KeDoDac` · `KeDangGom` từng ghi ở đây là **"lời hứa suông: chưa bao giờ có dc-import lẫn file"**, và lưới thẻ/cột thông số trước 06/08 trỏ ra 2 tệp con **không tồn tại**. Đây là ca mẫu của bệnh "bản vẽ trỏ vào chỗ chết" — nay đã tự vá.
```

```
SURFACE: Thư viện tri thức chung (knowledge base cấp studio)
USER JOB: Hỏi một câu bằng tiếng người, nhận về bản nháp có nguồn, duyệt từng mẩu.
BEST MOCK: Thư viện tri thức chung.dc.html
ALTERNATIVE MOCKS: —
DATE: 07/08/2026 (nội dung nhắc 28/7 · 2/8/2026)
LIGHT: YES · DARK: YES
TABLET: NO · MOBILE: NO · TOUCH: NO
PRODUCTION ROUTE: NONE — gần nhất `projects/[id]/notebook` nhưng **khác phạm vi** (notebook = nguồn thô MỘT dự án; bản vẽ này = đã duyệt, dùng chung TOÀN STUDIO — chính bản vẽ phân biệt hai thứ đó)
LIVE COMPONENT: NONE — grep `KnowledgeBase|TriThuc` = 0
CURRENT PRODUCTION STATUS: NOT BUILT
VISUAL STATUS: GOOD / USE AS TARGET
NOTES: Thi hành khuôn ProposalSheet đúng nhất trong corpus: **duyệt từng mẩu, không duyệt cả gói**, và **có seed để hỏi lại ra đúng kết quả cũ** (tái lập được — hiếm thấy bản vẽ nào lo tới chuyện này). Ranh giới sổ-tay ↔ thư-viện viết thẳng trên mặt. Con số "449 mẩu" là dữ liệu mẫu.
```

```
SURFACE: Vitals · viên trợ lý trên thanh trên
USER JOB: Hỏi nhanh khi bí, mà không bị một cửa sổ chat chiếm màn hình.
BEST MOCK: Vitals.dc.html
ALTERNATIVE MOCKS: Vitals glyph.dc.html (ba hướng tạo hình cho cùng viên đó)
DATE: 08/2026
LIGHT: YES · DARK: YES
TABLET: NO · MOBILE: NO · TOUCH: NO
PRODUCTION ROUTE: mọi route (nằm trong vỏ app)
LIVE COMPONENT: components/home/widgets/VitalsPill.tsx (+ components/studio/VitalsIcon.tsx)
CURRENT PRODUCTION STATUS: UNKNOWN — `CLAUDE-DESIGN-CURRENT.md` ghi **COMPLETE**, nhưng chưa so pixel trong lượt này.
VISUAL STATUS: CANONICAL
NOTES: Con trỏ đánh dấu COMPLETE cùng với `Vitals glyph.dc.html` ⇒ **hai tệp này là MỘT gia đình chính tắc, không được thiết kế lại rời nhau**. Cơ chế chốt: **số hạt là kênh thông tin** (2 nghỉ · 3 đang nghe · 5 đang nghĩ · 3 + xung sáng khi trả lời) — trạng thái nói bằng **số hạt và tốc độ quỹ đạo, KHÔNG bằng màu**, đúng luật màu-không-là-kênh-duy-nhất. Một sắc tím duy nhất. ⚠️ Bản vẽ đặt viên ở **góc header**; chốt 16/08 muộn hơn lại nói Vitals **neo theo ngữ cảnh** (Home = chấm cạnh ô tìm · trong chặng = nút rời cạnh trục phải) rồi 20/08 đổi tiếp sang **Aperture top-edge**. Bản vẽ này CHƯA phản ánh hai lượt đó.
```

```
SURFACE: Vitals · glyph (ba hướng tạo hình)
USER JOB: (như trên — đây là phần chọn diện mạo cho cùng một viên)
BEST MOCK: Vitals.dc.html (bản hệ thống)
ALTERNATIVE MOCKS: Vitals glyph.dc.html ← TỆP NÀY (bản chọn hướng)
DATE: 07/08/2026
LIGHT: YES · DARK: YES
TABLET: NO · MOBILE: NO · TOUCH: NO
PRODUCTION ROUTE: mọi route
LIVE COMPONENT: components/studio/VitalsIcon.tsx
CURRENT PRODUCTION STATUS: UNKNOWN — con trỏ ghi COMPLETE cho cặp Vitals; `00-CHOT` lại ghi `VitalsIcon.tsx` *"còn bản cũ 21/07, gradient cam→navy NGOÀI hệ màu"* ⇒ hai nguồn nói ngược nhau, phải mở tệp đo mới kết luận được.
VISUAL STATUS: EXPLORATION ONLY
NOTES: Đây là một **bản chọn hướng**, không phải bản đích: ba phương án 1a/1b/1c (vành bụi sáng tím→xanh băng · vành hạt một-điểm-ảnh tím→trắng lam · vành mảnh + giọt sáng rơi nảy hai nhịp), có nút "Gọi lại" từng thẻ và câu *"Trả lời bằng mã 1b"* — tức nó đang **hỏi người duyệt**, chưa được trả lời trong bất kỳ văn bản nào tôi đọc được. Đóng dấu "LƯỢT 1". ⚠️ Nó đề xuất **đổi tím sang một sắc đối ở đỉnh sáng** — đụng thẳng vào cuộc chốt màu nhấn thứ hai còn đang mở (mòng két ↔ mận, chưa chốt).
```

---

## 8 · TRÌNH BÀY · BOQ · ĐỀ BÀI — 4 tệp

```
SURFACE: Báo giá từ bảng khối lượng (BOQ → quote)
USER JOB: Biến bảng khối lượng thành báo giá gửi khách mà vẫn truy được số nào máy tính, số nào người sửa.
BEST MOCK: Báo giá từ bảng khối lượng.dc.html
ALTERNATIVE MOCKS: Bảng món nội thất.dc.html (cùng họ bảng, khác mục đích)
DATE: 07/08/2026 (nội dung nhắc 4/8 · 5/8)
LIGHT: YES · DARK: YES
TABLET: NO · MOBILE: NO · TOUCH: NO
PRODUCTION ROUTE: `projects/[id]/present`
LIVE COMPONENT: components/present-editor/PresentStageScreen.tsx (+ lib/boq/model.ts · lib/present-editor/boq-overrides.ts)
CURRENT PRODUCTION STATUS: UNKNOWN — `CLAUDE-DESIGN-CURRENT.md` ghi PARTIAL.
VISUAL STATUS: CANONICAL
NOTES: Thi hành đúng chốt 15/08 về BOQ: **dấu phân biệt số máy tự tính ↔ số người sửa tay** ("9 dòng · 2 dòng sửa tay"), và cơ chế sửa tay đã có thật (`boq-overrides.ts`, khoá theo `matId`). Thêm một trạng thái không bản nào khác có: **"1 dòng lệch với bản vẽ mới"** + nút "Lấy lại số" kèm dấu thời gian *"Lấy số từ bảng khối lượng lúc 09:58 hôm nay"* ⇒ báo giá **biết mình đang cũ**. Đây là chỗ luật "con số chỉ đến từ chỗ đo được" thành hình.
```

```
SURFACE: Bảng món nội thất (furniture schedule)
USER JOB: Liệt kê món theo phòng kèm ảnh/mã/hoàn thiện/NCC, và thấy ngay món chưa duyệt.
BEST MOCK: Bảng món nội thất.dc.html
ALTERNATIVE MOCKS: Báo giá từ bảng khối lượng.dc.html
DATE: 08/2026 (nội dung nhắc "Cập nhật 6/8 · 10:22")
LIGHT: YES · DARK: YES
TABLET: NO · MOBILE: NO · TOUCH: NO
PRODUCTION ROUTE: `projects/[id]/present`
LIVE COMPONENT: NONE riêng — grep `FurnitureSchedule|BangMon` = 0; gần nhất là PresentStageScreen.tsx
CURRENT PRODUCTION STATUS: NOT BUILT
VISUAL STATUS: GOOD / USE AS TARGET
NOTES: Món **chưa tick duyệt trước sản xuất** được tô nhạt — dùng độ đậm chứ không dùng màu để phân trạng thái, hợp luật. Ba đường xuất song song: PDF · xlsx · thêm món. Cột dữ liệu khớp `ProductSpec` thật (mã · tên · hoàn thiện · nhà cung cấp · đơn giá · SL · thành tiền) ⇒ dựng được mà không phải đẻ trường mới.
```

```
SURFACE: Nhận đề bài (brief intake)
USER JOB: Khai số người và phòng ban, biết ngay diện tích sàn có đủ không trước khi bố trí.
BEST MOCK: Nhận đề bài.dc.html
ALTERNATIVE MOCKS: Kết quả chia khu.dc.html (bước KẾ TIẾP của cùng một luồng: Đề bài → Bố trí → Chia khu)
DATE: 08/2026
LIGHT: YES · DARK: YES
TABLET: NO · MOBILE: NO · TOUCH: NO
PRODUCTION ROUTE: `projects/[id]/cad`
LIVE COMPONENT: components/cad/AiBriefPanel.tsx
CURRENT PRODUCTION STATUS: UNKNOWN — component cùng vai tồn tại; `SPEC-BRIEF-INTAKE.md` đang chờ làm lại nên khả năng lệch cao.
VISUAL STATUS: GOOD / USE AS TARGET
NOTES: Thanh bước **Đề bài · Bố trí · Chia khu** ở đầu màn ⇒ tệp này và `Kết quả chia khu.dc.html` là **hai bước của MỘT luồng**, phải dựng cùng nhau. Panel phải là máy đối chiếu tất định (tổng cần 486 m² trên 620 m² sàn → **Đạt**) — đúng lớp LUẬT, không phải lớp góp ý. Ràng buộc hiện trên mặt: trần 2,8 m · lưới cột 8,4 × 8,4 m. Đây chính là "màn đề bài" mà chốt 07/08 §12.4 nói phải làm TRƯỚC rồi mới làm góp ý về concept.
```

```
SURFACE: Kết quả chia khu (zoning)
USER JOB: Tô mặt bằng theo khu và đối chiếu từng khu với chuẩn diện tích trên mỗi người.
BEST MOCK: Kết quả chia khu.dc.html
ALTERNATIVE MOCKS: Nhận đề bài.dc.html (bước trước)
DATE: 08/2026
LIGHT: YES · DARK: YES
TABLET: NO · MOBILE: NO · TOUCH: NO
PRODUCTION ROUTE: `projects/[id]/cad`
LIVE COMPONENT: NONE riêng — grep `ChiaKhu|Zoning` chỉ trúng components/cad/PlanPresentPanel.tsx (khác vai)
CURRENT PRODUCTION STATUS: NOT BUILT
VISUAL STATUS: GOOD / USE AS TARGET
NOTES: Bản vẽ **cố ý không cho điểm tuyệt đối**: "6 trên 7 khu đạt chuẩn · phòng họp lớn **thiếu 0,1 m² mỗi chỗ**" — nêu thiếu bao nhiêu, ở đâu, sửa được; đúng cấm-kỵ §12.3 (không chấm điểm, phải là câu quan sát cụ thể). Hai nút kết: **Chia lại** ↔ **Chốt phương án**. Nguồn chuẩn diện tích/người là lớp LUẬT (`lib/cad/standards/`), không phải AI.
```

---

## ĐIỂM ĐÁNG NGỜ

**A · Tên tệp cãi nội dung**

| Tệp | Tên hứa gì | Nội dung thật là gì | Hệ quả |
|---|---|---|---|
| `Kéo thả.dc.html` | `CLAUDE-DESIGN-CURRENT.md` gọi là **"Kéo thả (library→canvas)"** và gắn với `TRANSFER-NOTE-2026-08-22-library-drop-specid.md` | **9 khung ĐIỆN THOẠI**, kéo-thả **VIỆC** trong bảng việc ("Chạm giữ để nhấc một việc" · "Đo lại trần phòng ngủ" · "Đội trực"). 0 chỗ nhắc thư viện, canvas, hay `specId` | Ai đọc con trỏ rồi mở tệp sẽ đi tìm bản vẽ kéo-vật-vào-bản-vẽ và **không có**. Bản vẽ library→canvas hiện **KHÔNG TỒN TẠI** trong corpus — nợ này đang bị che bởi một dòng con trỏ sai |
| `Tổng quan dự án.dc.html` | một dự án | **cả studio** — "Tổng quan · studio", 6 dự án, tải việc theo người | Quyết định sai route: `projects/[id]/overview` (cấp dự án) hay Home/route studio chưa có |
| `Lịch việc.dc.html` · `Tiến độ dự án.dc.html` | nghe như bản chính | là **bản thăm dò**; bản chính là hai tệp có dấu `·` và nhãn `[BẢN CHỐT]` | mtime của hai bản thăm dò (**16/08**) MỚI HƠN hai bản chốt (**07/08**) ⇒ chọn theo "tệp mới nhất" là chọn nhầm |
| `BangTron.dc.html` | không nói gì | bảng tròn công cụ **cảm ứng**, thuộc `Chế độ Phác thảo` | production để nó ở `components/print/RadialToolMenu.tsx` — **không liên quan gì tới in**; lệch chỗ đặt có sẵn trong code |

**B · Hai tệp cùng đòi làm chính tắc trên một surface**

1. **HOME — ba tệp cùng đòi.** `Home.dc.html` (trong corpus, `@dsCard group="Home"`) đã bị `CLAUDE-DESIGN-CURRENT.md` đóng dấu **SUPERSEDED**, thay bằng `claude-home-living-canvas-final.html`; lại còn `claude-home-first-use.html` (zero-state) và `claude-home-widget-system.html` (ghi "nghiên cứu tương lai, chưa vào gói duyệt"). Cả ba tệp thay thế đều mang trạng thái **"APPROVED TARGET CANDIDATE — chờ Hoà duyệt mắt"**, tức **chưa ai duyệt bằng mắt**. ⇒ Home hiện **không có bản chính tắc nào đã duyệt**; tệp duy nhất có `@dsCard` thì đã bị bác. Đây là surface rối nhất của cả kho.
2. **Vitals — con trỏ nói COMPLETE, nội dung nói CHƯA CHỌN.** `CLAUDE-DESIGN-CURRENT.md` ghi cặp `Vitals.dc.html` + `Vitals glyph.dc.html` là **COMPLETE**. Nhưng `Vitals glyph.dc.html` kết bằng câu *"Trả lời bằng mã 1b"* — nó là một câu hỏi ba-lựa-chọn **chưa có câu trả lời** trong bất kỳ văn bản nào. Và `00-CHOT` ghi `components/studio/VitalsIcon.tsx` *"còn bản cũ 21/07, gradient cam→navy ngoài hệ màu"*. Ba nguồn, ba câu chuyện khác nhau.
3. **Login — hai tệp, hai số phận, dễ lẫn.** `Auth.dc.html` (trong corpus, 22/08) **KHÔNG bị bác**. Thứ bị bác là `claude-login-home-ambient-final.html` (verdict **FAIL** 22/08: *"đọc như một SaaS auth card"*). Rủi ro thật: người đọc thấy chữ "LOGIN: FAIL" trong `CLAUDE-DESIGN-QUEUE.md` rồi bỏ luôn `Auth.dc.html` — mất theo cả phân biệt KHOÁ ≠ ĐĂNG XUẤT vốn chỉ tồn tại ở đó.
4. **2D vs 3D dùng chung "khung sáu ổ"** — `2D Kỹ thuật.dc.html` khai *"cùng khung sáu ổ với màn 3D"*, `Thư viện.dc.html` cũng khai khung sáu ổ với số đo riêng (42/214/·/236/58/26). Ba tệp cùng nói về một khung mà **không tệp nào là nguồn của khung đó**; sửa một tệp không có gì bắt hai tệp kia đi theo.

**C · Mâu thuẫn luật đang mở, chạm vào corpus này**

`LUAT-VAT-LIEU-KINH-G0-G3.md` §4 ghi **"Vào xưởng = G3"**; verdict mắt 22/08 lại ghi **"CTA chỉ là accent, KHÔNG glow"** ⇒ màn Login không còn G3 nào. `CLAUDE-DESIGN-QUEUE.md` khai thẳng đây là mâu thuẫn **chờ Hoà chốt**, MAIN không tự sửa. Ảnh hưởng trực tiếp tới `Auth.dc.html`. Thêm: chính tệp luật ghi `claude-liquid-glass-system.html` bản 15:10 là bản **TRƯỚC** luật G0–G3 (đếm được `G0/G1/G2/G3` = 0) nên **chưa dùng được làm chuẩn**.

**D · Hai khe hở kỹ thuật đo được**

- `Review-Gate.dc.html` là tệp **duy nhất trong 36 tệp thiếu khối `[data-theme="light"]`** — 35 tệp kia đều có. Không phải chọn lựa thiết kế, là thiếu sót.
- `BangNetIn.dc.html` in chuỗi **"Checklist TTT"** lên mặt — vi phạm LUẬT TRUNG TÍNH (cấm tên studio trong sản phẩm). Chưa nằm trong bảng `docs/AUDIT-BRAND-PII.md` mà tôi đọc được.
```
