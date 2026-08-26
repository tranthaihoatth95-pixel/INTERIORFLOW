# VISUAL MASTER INDEX — PHẦN B · MOCK HTML TAY (không phải `*.dc.html`)

> **Vai:** kiểm kê trí nhớ thiết kế đã có. Phần này KHÔNG thiết kế gì mới, KHÔNG chốt gì mới.
> Phạm vi: 110 tệp `.html` trong `docs/mocks/` **không** mang đuôi `.dc.html`
> (`ls docs/mocks/*.html | grep -v '\.dc\.html'`). Bộ `*.dc.html` do phần A lập, không đụng tới.
>
> **Cách phân loại:** mở tệp đọc nội dung, KHÔNG tin tên tệp. Bằng chứng dùng để xếp trạng thái:
> chữ trong chính tệp · hậu tố `_cu` · `docs/mocks/README-mocks.md` (rà 03/08 + cập nhật 08/08) ·
> `docs/mocks/CLAUDE-DESIGN-CURRENT.md` §1/§3 · đối chiếu route + component thật trong repo.
>
> **Không tự ưu tiên bản mới nhất.** Ưu tiên HƯỚNG ĐÃ ĐƯỢC LẬP — bản mà tài liệu khác coi là đích.
> Vài tệp mới hơn nhưng đã bị bác (vd `claude-login-home-ambient-final.html`) — ghi rõ là bị bác.
>
> **Ba tệp trùng byte đã xác minh bằng `md5`** (không phải bản khác nhau, là bản sao đổi tên):
> `InteriorFlow 01 Dự án.html` = `mock-if-du-an-v2.html` ·
> `InteriorFlow 02 Cài đặt.html` = `mock-if-cai-dat-v2.html` ·
> `InteriorFlow 03 Ảnh đại diện.html` = `mock-if-anh-dai-dien-v2.html`.
> `InteriorFlow 05 Máy quay.html` **KHÔNG trùng tệp nào** — là một màn riêng, xem mục MÁY QUAY.
>
> **Ghi chú theme:** nhiều mock 02–13/08 dùng theme sáng tên `kem` (nền kem ấm `#f0ece4`).
> Nền kem **đã bị bỏ 16/08** (đổi sang nền sáng canh Apple, ngả lam). Các mock đó vẫn tính là
> có LIGHT, nhưng màu nền sáng của chúng **hết hiệu lực** — ghi trong NOTES từng mục.

---

## 1 · ĐĂNG NHẬP / VÀO XƯỞNG

```
SURFACE: Login · màn khoá · vào xưởng
USER JOB: Mở lại xưởng của mình — đăng nhập, chọn ngôn ngữ, chọn nền sáng/tối.
BEST MOCK: docs/mocks/claude-login-redesign-abc.html
ALTERNATIVE MOCKS: docs/mocks/claude-login-home-ambient-final.html (BỊ BÁC 22/08)
DATE: 22/08/2026 (cả hai)
LIGHT: YES
DARK: YES
TABLET: NO (ambient-final có nhắc tablet trong chữ, không có khung tablet)
MOBILE: NO
TOUCH: NO
PRODUCTION ROUTE: /login
LIVE COMPONENT: components/entry/LoginScreen.tsx · LoginForm.tsx · LoginBackdrop.tsx · IFLogo.tsx · StackedCards.tsx
CURRENT PRODUCTION STATUS: MISMATCH — route + component có thật và đang chạy, nhưng cả hai bản vẽ 22/08 còn ở trạng thái "APPROVED TARGET CANDIDATE — chờ Hoà duyệt mắt" (CLAUDE-DESIGN-CURRENT §1), chưa có bằng chứng đã port.
VISUAL STATUS: GOOD / USE AS TARGET (bản A/B/C) — bản ambient-final: OBSOLETE
NOTES: `claude-login-home-ambient-final.html` mới hơn về ngày nhưng đã nhận verdict FAIL 22/08 ("đọc như SaaS auth card"), và chính `claude-login-redesign-abc.html` sinh ra để thay nó (tự khai "dựng lại A/B/C — sau verdict FAIL 22/08"). Ba phương án A (ấn loát) · B · C chưa chọn — đây là bản BÀY, chưa phải bản chốt. Nút "Vào xưởng" có luật riêng ở `claude-liquid-glass-system.html` + `LUAT-VAT-LIEU-KINH-G0-G3.md`.
```

```
SURFACE: Intro / màn mở màn
USER JOB: Cảnh mở màn khi vào app lần đầu.
BEST MOCK: docs/mocks/mock-if-intro-C3.html
ALTERNATIVE MOCKS: docs/mocks/mock-if-intro-bong-hoi-tu-2026-08-03.html
DATE: 03/08/2026
LIGHT: YES (C3, hai theme) · NO (bản bóng-hội-tụ)
DARK: YES (C3) · NO (bản bóng-hội-tụ)
TABLET: NO
MOBILE: NO
TOUCH: NO
PRODUCTION ROUTE: /intro
LIVE COMPONENT: components/intro/IntroSequence.tsx (⚠️ đang bị XOÁ trong working tree) · TitleSequence.tsx · components/entry/WelcomeIntro.tsx
CURRENT PRODUCTION STATUS: MISMATCH — route /intro còn, nhưng `components/IntroSequence.tsx` đã bị xoá (git status: ` D components/IntroSequence.tsx`), và chốt 02/08 là BỎ intro code 998 dòng thay bằng video.
VISUAL STATUS: EXPLORATION ONLY
NOTES: `mock-if-intro-bong-hoi-tu` chứa biến `--ttt-cam` / `--ttt-navy` = **màu TTT**, vi phạm LUẬT TRUNG TÍNH — đọc như tham chiếu lịch sử, cấm port. C3 sạch hơn (chỉ INK/CREAM, cấm accent tím ở cửa ngõ) nhưng gắn với hướng intro đã bị chốt bỏ; Hoà chốt 14/08 cắt `intro-day-chuyen` khỏi hàng đợi, làm sau khi app xong.
```

---

## 2 · HOME / DASHBOARD

```
SURFACE: Home · Living Canvas (trạng thái có dự án)
USER JOB: Mở app ra là biết đang dở việc gì, bấm một lần về đúng chỗ cũ.
BEST MOCK: docs/mocks/claude-home-living-canvas-final.html
ALTERNATIVE MOCKS: docs/mocks/claude-home-widget-system.html (bộ 6 widget, nghiên cứu tương lai) · docs/mocks/mock-he-thi-giac-3-man.html (Home trong bộ 3 màn) · docs/mocks/mock-sidebar-3-nac-home.html (P-E, Home dẫn theo việc) · docs/mocks/mock-home-sua-4-loi.html (bản vá 4 lỗi 17/08)
DATE: 22/08/2026 (living-canvas · widget-system) · 21/08 (he-thi-giac) · 17/08 (sua-4-loi) · 16/08 (sidebar-3-nac)
LIGHT: YES
DARK: YES
TABLET: YES (living-canvas · widget-system · sidebar-3-nac có nhắc/khung tablet)
MOBILE: NO
TOUCH: YES (sidebar-3-nac có `hover:none`+`pointer:coarse`) · NO ở bộ campaign 22/08
PRODUCTION ROUTE: /
LIVE COMPONENT: components/home/LivingCanvas.tsx · DongStudioHome.tsx · HomeScreen.tsx · home/widgets/* (ResumeWork · LightClock · WeeklyMaterial · WeeklyImage · QuickNotes · VitalsPill · StageChart · TodayStrip · UpcomingList · NewsFeed · ContributionGrid · WidgetCard) · bento-layout.ts
CURRENT PRODUCTION STATUS: MISMATCH — Home có thật và đã dựng nhiều (LivingCanvas.tsx + 12 widget + bento-layout), nhưng bản campaign 22/08 là ứng viên chờ duyệt mắt; `Home.dc.html` (bản MAIN tự ghép) đã bị đánh SUPERSEDED bởi bản campaign này.
VISUAL STATUS: GOOD / USE AS TARGET
NOTES: Luật lõi của bản này: "Không khí là CĂN PHÒNG, widget là VẬT trong phòng, chỉ việc đang làm mới bước lên trước" — toàn màn là MỘT trường liên tục, cấm dải/hàng card/lưới bảng điều khiển. `claude-home-widget-system.html` được CLAUDE-DESIGN-CURRENT ghi rõ **KHÔNG PHẢI First-Use Home** và là "nghiên cứu tương lai, chưa vào gói duyệt" — đừng nhầm nó là target. `mock-home-sua-4-loi.html` là bản vá theo 4 lỗi Hoà soi từ ảnh chụp màn 17/08, đã tự khai `--mat-*` chết và màu nhấn thứ hai chưa chốt hex — giá trị chẩn đoán, không phải target.
```

```
SURFACE: Home · dùng lần đầu (zero-state)
USER JOB: Vào app khi chưa có dự án nào mà vẫn thấy "đây là chỗ của tôi".
BEST MOCK: docs/mocks/claude-home-first-use.html
ALTERNATIVE MOCKS: (không có)
DATE: 22/08/2026
LIGHT: YES
DARK: YES
TABLET: NO
MOBILE: NO
TOUCH: NO
PRODUCTION ROUTE: /
LIVE COMPONENT: components/home/BatDauNgaySoKhong.tsx · TrangThaiO.tsx
CURRENT PRODUCTION STATUS: UNKNOWN — có component tên đúng nghĩa zero-state (`BatDauNgaySoKhong`), chưa đối chiếu pixel; CLAUDE-DESIGN-CURRENT ghi "APPROVED TARGET CANDIDATE — chờ Hoà duyệt mắt".
VISUAL STATUS: GOOD / USE AS TARGET
NOTES: Luật riêng của màn: "Đây KHÔNG phải màn rỗng xin lỗi" — không "Chưa có gì", không nút tạo-dự-án khổng lồ, KHÔNG widget ánh sáng, đúng 1 lối vào. Màn rỗng phải đẹp ở CẢ HAI nền, không nền nào được đọc ra là "chưa tải xong". Đây là màn dễ mất nhất vì nó chỉ hiện với người dùng mới.
```

```
SURFACE: Widget "Việc đang dở" (Resume)
USER JOB: Sau khi đăng nhập, bấm một lần quay lại đúng chỗ đang làm dở.
BEST MOCK: docs/mocks/mock-widget-viec-dang-do.html
ALTERNATIVE MOCKS: (nằm trong claude-home-widget-system.html như một trong 6 vật)
DATE: 16/08/2026
LIGHT: YES
DARK: YES
TABLET: NO
MOBILE: NO
TOUCH: NO
PRODUCTION ROUTE: /
LIVE COMPONENT: components/home/widgets/ResumeWork.tsx · resume-card.ts · components/entry/ResumeTracker.tsx
CURRENT PRODUCTION STATUS: MATCHES — có `ResumeWork.tsx` + `resume-card.ts` + test `resume-card.test.ts` + `ResumeTracker.tsx`; chưa đối chiếu pixel.
VISUAL STATUS: GOOD / USE AS TARGET
NOTES: Đây là bản vẽ THAM CHIẾU cho luật ba nấc "hai ngôn ngữ trình bày": nấc gọn nói bằng KÝ HIỆU + số, nấc vừa/đầy nói bằng CHỮ, và **icon biến mất khi có chữ**. Widget thiếu dữ liệu thì TỰ ẨN. Ai dựng lại card 3 nấc ở chỗ khác phải đọc tệp này trước.
```

---

## 3 · ĐIỀU HƯỚNG · SIDEBAR / RAIL

```
SURFACE: Sidebar là BẢN ĐỒ — hệ router toàn app
USER JOB: Biết mình là ai · đang ở dự án nào · ngữ cảnh nào · môi trường nào, cùng lúc, không biến thành dashboard.
BEST MOCK: docs/mocks/mock-sidebar-ban-do-2026-08-22.html
ALTERNATIVE MOCKS: docs/mocks/mock-kich-ban-sidebar.html (4 kịch bản cơ chế, P-P) · docs/mocks/mock-rail-hai-cum.html (V1 hai cụm ba nấc) · docs/mocks/mock-exs-d-sidebar-3-do-sau.html (rail 52–56 / shelf 220–280 / panel 320–440) · docs/mocks/mock-exs-vo-app-mep-duoi.html (vỏ app 6 phần) · docs/mocks/mock-sidebar-3-nac-home.html
DATE: 22/08/2026 · 20/08 (exs-d, vo-app) · 17/08 (rail-hai-cum) · 16/08 (kich-ban, 3-nac)
LIGHT: YES (ban-do "Nền Kem" · kich-ban · rail-hai-cum · vo-app) · NO (exs-d)
DARK: YES
TABLET: YES (kich-ban-sidebar · sidebar-3-nac)
MOBILE: NO
TOUCH: YES (sidebar-3-nac) · NO (các bản khác)
PRODUCTION ROUTE: xuyên app (mọi route)
LIVE COMPONENT: components/nav/RailDieuHuong.tsx · muc-dieu-huong.ts (+test) · components/nav/NguCanhDuAn.tsx · components/studio/AppChrome.tsx
CURRENT PRODUCTION STATUS: MISMATCH — CLAUDE-DESIGN-CURRENT §1 ghi Sidebar Map là target **COMPLETE (🟢 mục 5) — bản 22/08**, và `RailDieuHuong.tsx` có thật; nhưng số nấc của bản 22/08 chưa đối chiếu với `muc-dieu-huong.ts`.
VISUAL STATUS: CANONICAL (bản 22/08) — các bản còn lại: EXPLORATION ONLY
NOTES: ⚠️ **Đây là mock HTML tay DUY NHẤT được CLAUDE-DESIGN-CURRENT §1 liệt là APPROVED TARGET** — mọi target khác đều là `.dc.html`. Đã xác minh nội dung khớp mô tả: "sidebar là bản đồ, không phải menu", 7 trạng thái + chuyển cảnh, hình học trung tâm là một xương sống.
🔴 `mock-kich-ban-sidebar.html` (4 kịch bản) đã bị chính Hoà bác 16/08: *"nếu theo lời mình vừa mô tả thì không có thanh sidebar nào đúng"* — chúng dựng trên danh sách stage cũ (Kho vật liệu/Bảng màu còn ngang hàng, thiếu Chat/Thư viện). Giữ làm dấu vết cơ chế, cấm dựng.
🔴 Cụm sidebar bị đè hai lần: HAI CỤM (16–17/08, `mock-rail-hai-cum.html`) → **BA CỤM** (20/08, Experience System). `mock-rail-hai-cum.html` do đó là hướng đã bị thay.
`mock-exs-vo-app-mep-duoi.html` tự khai là "nguyên mẫu kỹ thuật/tương tác, KHÔNG phải bản duyệt thị giác" — nó giữ phần **mép dưới mang nghĩa** (dải hành động · viên ngữ cảnh · chế độ bản sửa) mà không bản nào khác có.
```

```
SURFACE: Bottom bar / dock đáy
USER JOB: Đổi mode, zoom/pan, chạm nhanh các control đáy màn.
BEST MOCK: docs/mocks/mock-exs-vo-app-mep-duoi.html (dải hành động mép dưới)
ALTERNATIVE MOCKS: docs/mocks/mock-bottombar-redesign.html
DATE: 20/08 · 06/08 (bottombar)
LIGHT: YES
DARK: YES
TABLET: NO
MOBILE: NO
TOUCH: NO
PRODUCTION ROUTE: xuyên chặng
LIVE COMPONENT: components/BottomToolbar.tsx · components/cad/CadToolbelt.tsx · components/render-studio/ToolDock3D.tsx
CURRENT PRODUCTION STATUS: UNKNOWN
VISUAL STATUS: OBSOLETE (bottombar-redesign) · EXPLORATION ONLY (vo-app-mep-duoi)
NOTES: README-mocks đánh `mock-bottombar-redesign.html` là LỖI THỜI — "trước chốt B + hình học Apple §2d; bar chốt nằm trong mock G2 mới". Giá trị còn lại: nó ghi rõ nhịp số 44px / bo 14 ngoài–9 trong / cách đều 5px và luật "một khối một bóng" — số này vẫn là căn cứ của §2c/§2d.
```

---

## 4 · 2D KỸ THUẬT (chặng ①)

```
SURFACE: Vỏ chặng 2D Kỹ thuật (CAD shell)
USER JOB: Vẽ và kiểm bản vẽ kỹ thuật — lớp, tỉ lệ, bản vẽ, thuộc tính đối tượng.
BEST MOCK: (không có trong phần B — target là `docs/mocks/2D Kỹ thuật.dc.html`, thuộc phần A)
ALTERNATIVE MOCKS: mock-cad-shell-v5_cu.html · v4_cu · v3_cu · v2_cu · mock-cad-shell-pro_cu.html · mock-2d-ky-thuat_cu.html · mock-if-3chang.html
DATE: 03–06/08/2026
LIGHT: YES (theme "kem" — nền kem đã bị bỏ 16/08)
DARK: YES
TABLET: NO
MOBILE: NO
TOUCH: YES (cả 5 bản `_cu` đều có `hover:none`+`pointer:coarse`)
PRODUCTION ROUTE: /projects/[id]/cad · /cad-editor
LIVE COMPONENT: components/cad/CadEditor.tsx · CadCanvas.tsx · CadToolbar.tsx · CadToolbelt.tsx · CadSheets.tsx
CURRENT PRODUCTION STATUS: MISMATCH — chặng 2D có thật và chạy, nhưng mọi mock trong nhóm này đã bị thay bởi bộ `.dc.html` 07/08.
VISUAL STATUS: OBSOLETE (toàn nhóm)
NOTES: CLAUDE-DESIGN-CURRENT §3 liệt đích danh `mock-cad-shell-v2..v5_cu` · `mock-2d-ky-thuat_cu` · `mock-cad-shell-pro_cu` là **SUPERSEDED — CẤM dựng**, bị thay bởi `2D Kỹ thuật.dc.html`. README-mocks bổ sung: chính `mock-cad-shell-v5_cu.html` tự ghi *"ĐỪNG PORT file này"*. ⚠️ v3/v4/v5 dùng CHUNG một `<title>` ("CAD shell v3") — tên tệp là thứ duy nhất phân biệt, và tên tệp thì nói dối; v5 là bản cuối của chuỗi (có thêm avatar "Hoà" ở header). `mock-if-3chang.html` là khung 3 chặng đời đầu, cùng chuỗi.
```

```
SURFACE: Mode Cấu kiện (Revit-style) trong chặng 2D
USER JOB: Làm việc với tường/cửa/phòng như cấu kiện có tham số, không phải nét vẽ.
BEST MOCK: docs/mocks/mock-cad-revit-2026-08-03.html
ALTERNATIVE MOCKS: (không có)
DATE: 03/08/2026
LIGHT: YES (theme kem)
DARK: YES
TABLET: NO
MOBILE: NO
TOUCH: YES
PRODUCTION ROUTE: /projects/[id]/cad (mode `revit` trong lib/cad/store.ts)
LIVE COMPONENT: components/cad/* (khoá kỹ thuật `revit` còn trong store, nhãn hiển thị đã bỏ)
CURRENT PRODUCTION STATUS: MISMATCH — mode "Cấu kiện" mà mock này vẽ **không còn tồn tại** (chốt 07/08: chặng 2D chỉ 2 mode Sơ phác/Chuyên). Khoá `revit` vẫn nằm trong code vì đổi khoá là vỡ persist.
VISUAL STATUS: OBSOLETE
NOTES: README-mocks quyết định 08/08: "coi là tham khảo lịch sử, KHÔNG port". Giá trị còn lại là **bảng thuộc tính cấu kiện** (W-01…W-05 · D-02 · WD-01 · bảng Phòng có m²) — thứ này nay thuộc tầng dữ liệu Cấu kiện/BIM nội thất nằm dưới cả ba chặng, không thuộc mode nào.
```

---

## 5 · 3D THIẾT KẾ (chặng ②)

```
SURFACE: Không gian 3D / dựng khối — vỏ + 4 trạng thái
USER JOB: Dựng và sửa khối trong không gian, chọn khối, kéo mặt, mở dock.
BEST MOCK: docs/mocks/mock-3d-thong-nhat.html
ALTERNATIVE MOCKS: docs/mocks/mock-3d-frame.html (khung 4 trạng thái chọn/kéo/dock) · docs/mocks/mock-if-ve3d.html · docs/mocks/mock-ve-3d.html
DATE: 06–16/08/2026
LIGHT: YES (kem) · DARK: YES
TABLET: NO
MOBILE: NO
TOUCH: YES (mock-if-ve3d) · NO (3d-thong-nhat · 3d-frame · ve-3d)
PRODUCTION ROUTE: /projects/[id]/render
LIVE COMPONENT: components/three/Viewport3D.tsx · components/render-studio/Command3DPanel.tsx · Object3DTree.tsx · Object3DInspector.tsx · ToolDock3D.tsx · Render3DModeSkeleton.tsx
CURRENT PRODUCTION STATUS: MISMATCH — chặng 3D có thật, nhưng CLAUDE-DESIGN-CURRENT §11 gọi `3D Dựng khối.dc.html` là chuẩn chất lượng, không phải mấy mock này.
VISUAL STATUS: EXPLORATION ONLY (3d-thong-nhat · 3d-frame) · OBSOLETE (ve-3d · if-ve3d)
NOTES: README-mocks: `mock-ve-3d.html` = "bản nháp trước `mock-if-ve3d.html`" ⇒ ve-3d OBSOLETE. `mock-if-ve3d.html` từng là bản Hoà chốt 02/08 qua mock nhưng **mang `<title>` của mock-if-3chang** (tên tệp nói dối lần nữa) và đã bị bộ `.dc.html` vượt qua. `mock-3d-thong-nhat.html` + `mock-3d-frame.html` là bản 4-trạng-thái mới hơn, dùng để đọc HÀNH VI (chọn khối → gizmo 3 trục → kéo mặt → dock mở rộng), không dùng làm chuẩn màu.
```

```
SURFACE: Bảng công cụ 3D (toàn bộ lệnh dựng hình)
USER JOB: Gọi đúng lệnh dựng hình; thấy lệnh chưa dựng được và biết vì sao.
BEST MOCK: docs/mocks/mock-if-bang-cong-cu-3d.html
ALTERNATIVE MOCKS: docs/mocks/mock-exs-q-toolbelt-capability.html (Adaptive Toolbelt, 20/08)
DATE: 13/08/2026 · 20/08 (exs-q)
LIGHT: YES (kem) · DARK: YES
TABLET: NO · MOBILE: NO · TOUCH: NO
PRODUCTION ROUTE: /projects/[id]/render
LIVE COMPONENT: components/render-studio/Command3DPanel.tsx · Tool3DBar.tsx · ToolDock3D.tsx · lib/capabilities
CURRENT PRODUCTION STATUS: UNKNOWN
VISUAL STATUS: GOOD / USE AS TARGET
NOTES: ⭐ Đây là hiện thân trực tiếp của **LUẬT §9 "thiết kế trước — tính năng fill sau"**: mock cố ý vẽ HẾT mọi lệnh kể cả lệnh chưa code, lệnh mờ + rê chuột hiện lý do ở đáy panel; nó tự khai con số "3/51 lệnh khối và 3/9 mục camera đã dùng được". Ô trống ở đây là **bằng chứng còn việc**, cấm xoá cho gọn mắt. Giá trị kiểm kê cao nhất trong nhóm 3D. Cột trái 214 / camera phải 236 = khung AppShell 6 ổ.
```

```
SURFACE: Máy quay · ống kính · đường cam
USER JOB: Đặt góc máy đúng nghề — tiêu cự, tỉ lệ khung, tầm mắt, safe frame, đường quay; xuất ảnh ba mức.
BEST MOCK: docs/mocks/InteriorFlow 05 Máy quay.html
ALTERNATIVE MOCKS: docs/mocks/mock-video-sinh-phim-3d-2026-08-10.html (camera path → footage)
DATE: 13/08/2026 · 10/08 (sinh phim)
LIGHT: YES (kem) · DARK: YES
TABLET: NO · MOBILE: NO · TOUCH: NO
PRODUCTION ROUTE: /projects/[id]/render
LIVE COMPONENT: components/render-studio/CameraExportTab.tsx · lib/cad (layer IF_CAMPATH)
CURRENT PRODUCTION STATUS: MISMATCH — `CameraExportTab.tsx` có thật (và từng bị bắt lỗi bịa 0% ở dòng 189, đã sửa), nhưng panel máy quay 4 nhóm mà mock vẽ chưa có bằng chứng đã dựng; `CamPathPreview`/`CamPathControlPanel` được 00-CHOT ghi là CHƯA wire vào `/cad-editor`.
VISUAL STATUS: GOOD / USE AS TARGET
NOTES: ⚠️ **Tệp này KHÔNG trùng byte với mock nào** (khác hẳn 3 tệp "InteriorFlow 01/02/03" vốn là bản sao) — tên tệp có khoảng trắng nên rất dễ bị bỏ sót khi glob. Nội dung: panel phải 4 nhóm (ống kính · khung hình · độ sâu · điểm nhìn), tiêu cự gõ tự do 18/24/35/50/85mm, tầm mắt **1 650 mm** (đúng con số "tầm mắt người" — KHÔNG phải 1550 của metrology), xuất 3 mức 1 200 / 2 400 / 5 200 px, 5 mục chưa dựng để mờ kèm lý do. `mock-video-sinh-phim-3d` nối tiếp: đường cam `IF_CAMPATH` → sinh footage → handoff một-nguồn sang Dựng phim.
```

```
SURFACE: AI dựng ảnh trên khối bản vẽ (Grounded Render đời đầu)
USER JOB: Sinh ảnh từ khối 3D mà vẫn giữ đúng số đo, vật liệu, mã món của bản vẽ.
BEST MOCK: docs/mocks/mock-if-ai-3d.html
ALTERNATIVE MOCKS: docs/mocks/mock-render-layout-H3.html
DATE: 06/08/2026
LIGHT: YES · DARK: YES
TABLET: NO · MOBILE: NO
TOUCH: YES (if-ai-3d có `touch-action`)
PRODUCTION ROUTE: /projects/[id]/render · /photo-editor
LIVE COMPONENT: components/render-studio/KetXuatPanel.tsx · RenderQueuePanel.tsx · components/photo-editor/*
CURRENT PRODUCTION STATUS: UNKNOWN
VISUAL STATUS: EXPLORATION ONLY
NOTES: Giá trị còn lại là **ý "moat"**: bật "Hiện số đo" để ảnh render mang đường kích thước + swatch vật liệu + mã món đọc thẳng từ bản vẽ — chính là điều 15/08 chốt lại thành "id trên phối cảnh = TRÌNH BÀY, con số = CAD/khối đo được". README-mocks đánh `mock-render-layout-H3.html` LỖI THỜI (Hoà đã duyệt HƯỚNG, token phải làm lại khi port) và nó dùng nhãn chặng cũ "Rendering".
```

---

## 6 · CANVAS NODE · CỬA SỔ CÔNG CỤ · BÀN BẠC

```
SURFACE: Cửa sổ công cụ (ToolWindow) + hộp công cụ bám vật
USER JOB: Mở một môi trường làm việc chuyên sâu (ảnh/3D/video) ngay trên canvas, nối nhiều cái với nhau.
BEST MOCK: docs/mocks/mock-tool-bam-vat.html
ALTERNATIVE MOCKS: docs/mocks/tool-window-sketch2photo.html (mock nguồn của CHOT-RENDER-TOOL-WINDOW) · docs/mocks/mock-if-nut-tong.html (gom nhiều nút thành một công cụ dùng lại)
DATE: 16/08/2026 · 06/08 (sketch2photo) · 16/08 (nut-tong)
LIGHT: YES · DARK: YES
TABLET: NO · MOBILE: NO · TOUCH: NO
PRODUCTION ROUTE: /projects/[id]/render (canvas node)
LIVE COMPONENT: components/nodes/HopCongCuBamVat.tsx · components/render-studio/CuaSoCongCu.tsx · ToolWindow.tsx · ThanCuaSoNode.tsx · NutLenhVeTinh.tsx · components/nodes/MacroShelf.tsx · MacroCreateDialog.tsx
CURRENT PRODUCTION STATUS: MATCHES (một phần) — `HopCongCuBamVat.tsx` + `CuaSoCongCu.tsx` có thật, đúng phiếu P-R (xong-máy 16/08). ⚠️ 00-CHOT khai thẳng: lệnh trong vệ tinh **mờ hết, chưa nối bộ thi hành** — "dây nối, chưa có dòng điện". Chưa chạy app thật lần nào.
VISUAL STATUS: GOOD / USE AS TARGET
NOTES: ⭐ Tệp này giữ **định nghĩa hai tầng** — thanh chung giải "mỗi công cụ một phím tắt, ai mà nhớ"; cửa sổ công cụ giải "phải đúng Photoshop, đúng D5, đúng Blender". Đây là chỗ chữ "tool" bốn nghĩa từng làm T hiểu sai suốt 6 phiếu; ai đọc lại phải đọc kèm mục "master tool = window tool" trong 00-CHOT. `tool-window-sketch2photo.html` là mock NGUỒN của chốt 01/08 ("tool window LÀ subgraph node phóng to") — README đánh token phải làm lại, nhưng **bố cục 2-pane trước/sau + núm "Bám bản vẽ 0.8 / Tự do sáng tạo 0.4" + giá credit hiển thị trước khi chạy** vẫn là bản gốc của bậc thang 4 nấc.
```

```
SURFACE: Bảng nút / dây chuyền node
USER JOB: Nối các bước xử lý thành một dây chuyền; thấy dây nối sai kiểu.
BEST MOCK: docs/mocks/mock-if-bang-nut.html
ALTERNATIVE MOCKS: (không có)
DATE: 16/08/2026
LIGHT: YES (kem) · DARK: YES
TABLET: NO · MOBILE: NO · TOUCH: NO
PRODUCTION ROUTE: /projects/[id]/render (mode Node)
LIVE COMPONENT: components/FlowCanvas.tsx · components/nodes/InteriorNode.tsx · NodeExtras.tsx · lib/nodes/edge-validity.ts
CURRENT PRODUCTION STATUS: MATCHES (một phần) — FlowCanvas + InteriorNode + `edge-validity` có thật; **cổng nối có màu theo loại** (ảnh · mặt nạ · vật liệu · tham số) và **dây sai kiểu hiện đỏ đứt đoạn kèm lời báo** là phần cần đối chiếu.
VISUAL STATUS: GOOD / USE AS TARGET
NOTES: Giữ luật màu-cổng-theo-loại-dữ-liệu — đây là chỗ duy nhất trong corpus vẽ nó. Nối thẳng entry `nut-cong-tren-day` (nút `+` chèn bước giữa hai node) đang còn CHỜ, chưa vẽ ở đâu.
```

```
SURFACE: Cửa Sổ Thảo Luận (bàn bạc concept · khung tư duy)
USER JOB: Bàn concept trước khi thiết kế — chọn khuôn khung tư duy, kéo ảnh, dựng moodboard/storyline, nộp dàn ý cho phiên trình CĐT.
BEST MOCK: docs/mocks/mock-collab-chang-3d.html
ALTERNATIVE MOCKS: docs/mocks/mock-mood-collab-g2-2026-08-03.html (Mood+Collab G2, khung AppShell 6 ổ) · docs/mocks/mock-mood-collab.html (bản xem thử Miro/tablet/pen) · docs/mocks/mock-if-y-tuong-2026-08-09.html (canvas moodboard, Local DNA / Style DNA) · docs/mocks/mock-exs-i-moodboard-3d.html (bố cục COLLAGE)
DATE: 17/08 · 03/08 (g2) · 06/08 (mood-collab) · 09/08 (y-tuong) · 20/08 (exs-i)
LIGHT: YES · DARK: YES
TABLET: YES (mood-collab · mood-collab-g2) · NO (collab-chang-3d)
MOBILE: NO
TOUCH: YES (mood-collab-g2 · y-tuong) · NO (collab-chang-3d · exs-i)
PRODUCTION ROUTE: /projects/[id]/render (mode Node)
LIVE COMPONENT: components/collab/CuaSoThaoLuan.tsx · BaHoiStorylineForm.tsx · BangSoCucForm.tsx · tao-nguon-chung-cat.ts · components/dna/DesignDnaCardPanel.tsx
CURRENT PRODUCTION STATUS: MATCHES (một phần) — `CuaSoThaoLuan.tsx` + 2 form khung tư duy có thật; ba ca a/b/c của mock (canvas trống → có nội dung → nộp dàn ý) chưa đối chiếu.
VISUAL STATUS: GOOD / USE AS TARGET (collab-chang-3d) · OBSOLETE (mood-collab bản 06/08) · EXPLORATION ONLY (còn lại)
NOTES: README-mocks: `mock-mood-collab.html` bị thay bởi `mock-mood-collab-g2-2026-08-03.html` (bản trước LUẬT GIAO DIỆN). ⭐ Nhưng bản 06/08 là bản DUY NHẤT vẽ **tablet + bút (pen) + viết tay** cho canvas cộng tác — thứ đó không có trong bản G2 lẫn bản 17/08; giữ lại đọc riêng phần cảm ứng. `mock-collab-chang-3d.html` mới nhất và khớp cấu trúc rail hai cụm + "template hệ khung tư duy" Hoà chốt 16/08 (Moodboard vật liệu · Bảng so cực…) — đây là chỗ kệ "form lập luận" treo từ 02/08 cuối cùng có nhà.
```

---

## 7 · TRÌNH CHIẾU (chặng ③)

```
SURFACE: Chọn loại hồ sơ + vỏ chặng Trình chiếu
USER JOB: Chọn loại hồ sơ (Deck · Bảng vật liệu · BOQ · Văn bản · Video) rồi soạn ngay trong cùng khung.
BEST MOCK: docs/mocks/mock-trinh-chon-ho-so-tablet-2026-08-10.html
ALTERNATIVE MOCKS: docs/mocks/mock-trinh-bay.html (5 thẻ lớn + hồ sơ gần đây)
DATE: 10/08 · 16/08 (trinh-bay)
LIGHT: YES (kem) · DARK: YES
TABLET: YES (chon-ho-so có khung tablet riêng)
MOBILE: NO · TOUCH: NO
PRODUCTION ROUTE: /projects/[id]/present · /present-editor
LIVE COMPONENT: components/present-editor/PresentDocTypePicker.tsx · PresentStageScreen.tsx · PresentNavigator.tsx
CURRENT PRODUCTION STATUS: MATCHES (một phần) — `PresentDocTypePicker.tsx` có thật. CLAUDE-DESIGN-CURRENT §2 vẫn liệt "D5 Present Template Browser — 0 `.dc.html`, chưa có bộ mẫu thật, HÀNG ĐỢI".
VISUAL STATUS: GOOD / USE AS TARGET
NOTES: ⭐ **Đây là bản DUY NHẤT trong toàn corpus vẽ cửa vào Trình chiếu ở CẢ desktop LẪN tablet**, và nó đã có sẵn thẻ "＋ Tạo hồ sơ trống" đúng chốt 10/08 (thẻ trống luôn ở cuối, tạo ngay không qua form). Vì §2 ghi món này là DESIGN REQUIRED/HÀNG ĐỢI, rất dễ có người dựng lại từ đầu mà không biết bản này tồn tại.
```

```
SURFACE: BOQ / dự toán editor
USER JOB: Sửa bảng khối lượng, thấy số nào tự sinh từ bản vẽ, số nào sửa tay, số nào lỗi.
BEST MOCK: docs/mocks/mock-trinh-boq-2026-08-04.html
ALTERNATIVE MOCKS: (không có)
DATE: 04/08/2026 (vá phím tắt sau đợt 3)
LIGHT: YES (kem) · DARK: YES
TABLET: NO · MOBILE: NO · TOUCH: YES
PRODUCTION ROUTE: /projects/[id]/present · /present-editor
LIVE COMPONENT: lib/boq/model.ts · lib/present-editor/boq-overrides.ts · components/present-editor/*
CURRENT PRODUCTION STATUS: MATCHES (một phần) — cơ chế sửa tay `boq-overrides.ts` (khoá theo `matId`, lưu IndexedDB) có thật; `Báo giá từ bảng khối lượng.dc.html` là target mới hơn (PARTIAL).
VISUAL STATUS: GOOD / USE AS TARGET
NOTES: README-mocks đã audit tệp này trọn `SPEC-TRINH-BOQ-EDITOR`: summary-bar · 6 kiểu cột · badge sửa-tay · dòng lỗi — đúng spec; token đúng `globals.css` thật (accent `#6a57f5`, bo 10/14/20/28). Nó vẽ đúng luật 15/08 "BOQ chỉ nhận số đo được": *"Số tự sinh từ vùng tô — không phải…"*. Chỉ minh hoạ 3/4 loại `BoqError` (thiếu ví dụ "spec-not-found").
```

```
SURFACE: Bảng vật liệu A3
USER JOB: Bày vật liệu dự án thành tờ A3 nộp khách, mỗi mẫu truy được về mã + nhà cung cấp.
BEST MOCK: docs/mocks/mock-trinh-materialA3-2026-08-09.html
ALTERNATIVE MOCKS: (không có)
DATE: 09/08/2026
LIGHT: YES (kem) · DARK: YES
TABLET: NO · MOBILE: NO · TOUCH: YES
PRODUCTION ROUTE: /projects/[id]/present
LIVE COMPONENT: components/present-editor/* · lib/materials
CURRENT PRODUCTION STATUS: UNKNOWN — 00-CHOT ghi "Material A3 dùng symbol thường" là một lệch `soi:frontier` từng bắt được.
VISUAL STATUS: GOOD / USE AS TARGET
NOTES: Dùng mã + hãng THẬT trong ví dụ (An Cường AC-OAK-224 · Jotun JT-CEM-04) — đây là **nội dung tham chiếu, không phải brand của app**; nếu tái dùng phải kiểm luật trung tính. Chốt 15/08 về hình thức bảng vật liệu (mẫu **xếp chồng đè lên nhau**, trỏ vào hiện thông tin, bản nộp y chang bố cục màn) **chưa được vẽ ở tệp này** — đây là khoảng cách còn lại.
```

```
SURFACE: Văn bản / biểu mẫu
USER JOB: Soạn báo giá · hợp đồng thi công · thuyết minh thiết kế, có BOQ nhúng sống.
BEST MOCK: docs/mocks/mock-trinh-vanban-2026-08-09.html
ALTERNATIVE MOCKS: (không có)
DATE: 09/08/2026
LIGHT: YES (kem) · DARK: YES
TABLET: NO · MOBILE: NO · TOUCH: YES
PRODUCTION ROUTE: /projects/[id]/present
LIVE COMPONENT: app/api/present/text/route.ts · components/present-editor/*
CURRENT PRODUCTION STATUS: UNKNOWN — có API `present/text`, chưa đối chiếu UI.
VISUAL STATUS: GOOD / USE AS TARGET
NOTES: ⭐ Editor Văn bản là **phụ thuộc cứng của `meeting-distill`** (biên bản họp) đang xếp Đợt 3 — mất tệp này là mất luôn bản vẽ của mắt xích đó. 3 mẫu khởi đầu + song ngữ Tiếng Việt/EN.
```

```
SURFACE: Video editor (dựng phim)
USER JOB: Dựng walkthrough từ shot, xuất MP4 0-credit, chuyển sang CapCut/Premiere khi cần hiệu ứng nâng cao.
BEST MOCK: docs/mocks/mock-trinh-video-2026-08-04.html
ALTERNATIVE MOCKS: docs/mocks/mock-video-sinh-phim-3d-2026-08-10.html (đầu SINH phim, chặng 3D)
DATE: 04/08 · 10/08
LIGHT: YES (kem) · DARK: YES
TABLET: NO · MOBILE: NO · TOUCH: YES (bản 04/08)
PRODUCTION ROUTE: /projects/[id]/present (dựng) · /projects/[id]/render (sinh)
LIVE COMPONENT: (chưa tìm thấy component video editor riêng)
CURRENT PRODUCTION STATUS: NOT BUILT — không có thư mục/component video editor trong `components/`.
VISUAL STATUS: NEEDS SMALL CORRECTION
NOTES: 🔴 **Cần sửa đúng một điều trước khi dùng: vị trí chặng.** Mock đặt Video editor ở chặng 3 (Trình bày) theo chốt 02/08; **Hoà đã LẬT 13/08** — toàn bộ quá trình TẠO + DỰNG video về **chặng 2 (master node)**, chặng 3 chỉ trình chiếu + filter nhẹ. Nội dung editor (shot có tên · 3 tầng · timeline collapsed · beat snap · MP4 0-credit) README-mocks đã audit là đúng `SPEC-TRINH-VIDEO-EDITOR` — giữ nguyên, chỉ đổi chỗ nó sống.
```

```
SURFACE: Trang chia sẻ hồ sơ (khách xem, không cần đăng nhập)
USER JOB: Khách mở link, lật từng tờ hồ sơ, tải bản PDF đóng dấu.
BEST MOCK: docs/mocks/mock-if-trang-chia-se.html
ALTERNATIVE MOCKS: (không có)
DATE: 06/08/2026
LIGHT: YES · DARK: YES
TABLET: NO · MOBILE: NO · TOUCH: NO
PRODUCTION ROUTE: /share/[token]
LIVE COMPONENT: app/share/[token]/page.tsx (route có thật)
CURRENT PRODUCTION STATUS: UNKNOWN — route tồn tại, chưa đối chiếu giao diện.
VISUAL STATUS: GOOD / USE AS TARGET
NOTES: ⭐ Đây là **mặt duy nhất của IF mà KHÁCH HÀNG nhìn thấy**, và là mock duy nhất vẽ nó. Dùng Brand Kit dự án ("Atelier Mộ") đúng luật trung tính — brand đến từ dự án, không hardcode. Lật tờ bằng phím ← →. Chốt 11/08 (Collaborate) khẳng định CĐT **không** vào hệ comment, luồng khách giữ truyền thống ⇒ trang này chính là mắt xích đó, đừng bỏ.
```

---

## 8 · THƯ VIỆN / MASTER LIBRARY

```
SURFACE: Master Library — tấm thư viện, kệ, và cấu trúc ngăn
USER JOB: Tìm và kéo vật (vật liệu · cấu kiện · mẫu) vào chỗ đang làm, không phải đi tìm ở kho khác.
BEST MOCK: docs/mocks/mock-thu-vien-ke.html (năm ngăn · màu là một BƯỚC không phải ngăn)
ALTERNATIVE MOCKS: docs/mocks/mock-if-thu-vien.html (tấm trượt · kệ Vật liệu) · docs/mocks/mock-material-sphere-2026-08-03.html (quả cầu vật liệu + tạo theo template D5) · docs/mocks/mock-if-thu-vien-trong.html (kệ trống, 6 màn) · docs/mocks/mock-library.html · docs/mocks/mock-3d-library-flowrender-2026-08-11.html · docs/mocks/mock-exs-t-library-v0.html
DATE: 17/08 (thu-vien-ke) · 16/08 (if-thu-vien) · 03/08 (material-sphere) · 13/08 (thu-vien-trong) · 06/08 (library) · 11/08 (3d-library) · 20/08 (exs-t)
LIGHT: YES · DARK: YES
TABLET: NO · MOBILE: NO
TOUCH: YES (thu-vien-ke · material-sphere) · NO (còn lại)
PRODUCTION ROUTE: /library · /library/gallery · /library/ingest
LIVE COMPONENT: components/library/LibrarySheet.tsx · library-sheet-css.ts · ItemThumb.tsx · ScopeBadge.tsx · PublishModal.tsx · AssetWhereUsed.tsx · GalleryLienNganh.tsx · ClusterPanel.tsx · BulkIngestMode.tsx
CURRENT PRODUCTION STATUS: MATCHES (một phần) — `LibrarySheet` có thật, `Thư viện.dc.html` là target PARTIAL (lane B: kệ 73 món thật). ⚠️ TRANSFER-NOTE-2026-08-22 ghi: kéo-thả đã CHẠY THẬT lần đầu 22/08 nhưng vật rơi xuống **không mang `specId`** ⇒ chưa lên BOQ.
VISUAL STATUS: GOOD / USE AS TARGET (thu-vien-ke) · OBSOLETE (mock-library) · EXPLORATION ONLY (còn lại)
NOTES: README-mocks: `mock-library.html` là "trước khi chốt Thư viện = MỘT sheet" ⇒ OBSOLETE, thay bằng `mock-material-sphere-2026-08-03.html` cho kệ Vật liệu. `mock-thu-vien-ke.html` là bản mang cấu trúc ĐÚNG NHẤT theo chốt 16/08: một Thư viện duy nhất chia ngăn theo loại, **Gallery là bản tuyển chọn của ngăn Ảnh chứ không phải ngăn thứ sáu**, **màu là một BƯỚC trong chọn vật liệu, không phải mục điều hướng**. `mock-if-thu-vien-trong.html` giữ **trạng thái rỗng 6 màn** — thứ hiếm và dễ mất. `library-mock-note.md` mô tả bố cục 3 khu của bản 02/08 kèm badge 4 mức phạm vi (Chung/Studio/Chặng/Dự án) — vẫn là nguồn cho `ScopeBadge`.
```

```
SURFACE: Chuẩn visual của asset thư viện (.idfc) — nét, LOD, bộ mẫu
USER JOB: Nhìn một asset là biết nó đủ chuẩn để đặt vào bản vẽ và model thật.
BEST MOCK: docs/mocks/mock-exs-p-idfc-trai-nghiem.html (trải nghiệm 3 view mode, một identity)
ALTERNATIVE MOCKS: docs/mocks/mock-exs-n-idfc-chuan-visual.html (line-weight grammar) · docs/mocks/mock-exs-o-idfc-bo-mau.html (8 asset × 5 mặt) · docs/mocks/mock-exs-r-idfc-real-asset-quality.html · docs/mocks/mock-exs-s-cau-kien-lap-ghep.html
DATE: 20/08/2026
LIGHT: NO · DARK: YES (một theme)
TABLET: NO · MOBILE: NO · TOUCH: NO
PRODUCTION ROUTE: /library
LIVE COMPONENT: lib/cad/idfc.ts · components/library/ItemThumb.tsx · Object3DWindow.tsx · lib/idfc-import/part-lock.ts
CURRENT PRODUCTION STATUS: NOT BUILT (phần trải nghiệm 3 view mode) — `LibrarySheet` + `.idfc` có, nhưng segmented CAD/REALISM/MATERIAL view chưa có bằng chứng.
VISUAL STATUS: EXPLORATION ONLY — ⛔ **CẤM THI CÔNG VISUAL theo N/O/P/R**
NOTES: 🔴 Hoà **BÁC 20/08 chiều**: "IDFC Real Asset Quality Pass" bị bác làm hình ảnh sản phẩm (đồ vẽ tay/ma trận mẫu/minh hoạ CAD ≠ trải nghiệm cao cấp); board EXS-N/O/P **hạ xuống THAM CHIẾU KỸ THUẬT NỘI BỘ**, cấm thi công visual theo chúng. Phần còn giá trị (Hoà xác nhận): **line-grammar · anchor · LOD · Place/Replace/Override**. Hướng thay thế: Library = ba tầng BROWSE (ảnh thật to) → OBJECT PASSPORT → TECHNICAL VERIFY, ma trận kỹ thuật **chỉ ở tầng 3**. `mock-exs-t-library-v0.html` là bản đầu theo hướng mới, tự khai còn 2 câu hỏi chờ Hoà (nền giấy hay nền tối · nguồn nội dung thật). `mock-exs-s-cau-kien-lap-ghep.html` giữ nguyên tắc "cái giống nhau chỉ vẽ một lần — phần còn lại là gương hoặc lặp" = tầng lệnh của `mirror-doi-xung-chuan-net`.
```

```
SURFACE: Vật liệu — một vật, ba mặt
USER JOB: Một mã vật liệu, ba chặng đọc ba phía (hatch 2D · PBR 3D · giá + NCC).
BEST MOCK: docs/mocks/mock-vat-lieu-ba-mat.html
ALTERNATIVE MOCKS: docs/mocks/mock-material-sphere-2026-08-03.html (quả cầu xem trước, template kiểu D5)
DATE: 17/08 · 03/08
LIGHT: YES · DARK: YES
TABLET: NO · MOBILE: NO · TOUCH: YES (cả hai)
PRODUCTION ROUTE: /materials · /colors
LIVE COMPONENT: components/materials/BaMatPanel.tsx · ChiBaoBaMat.tsx · MaterialPbrEditor.tsx · RnaPanel.tsx · MaterialImpactPreview.tsx · lib/materials/resolve.ts
CURRENT PRODUCTION STATUS: MATCHES — `BaMatPanel.tsx` + `ChiBaoBaMat.tsx` có thật đúng tên mock; `lib/materials/resolve.ts::getMaterial()` trả đủ ba mặt (khoá nối `matId = ProductSpec.sku`). ⚠️ 17/08 đo được: hàm đó **0 nơi gọi ngoài chính test của nó** — "dây có, chưa cắm điện" (phiếu P-T).
VISUAL STATUS: CANONICAL
NOTES: ⭐ Đây là bản vẽ mang **định nghĩa ĐỒNG BỘ** của cả sản phẩm, trích thẳng trong tệp: *"Đồng bộ KHÔNG PHẢI nối hai thứ lại. Đồng bộ là KHÔNG TÁCH chúng ra ngay từ đầu"* (IF-KIEN-TRUC §6). Và nó vẽ đúng ràng buộc cứng: **giá được ĐỌC từ bản ghi thương mại, KHÔNG chép sang vật liệu** (luật 2.1.9.i 30/07). `mock-material-sphere` giữ công thức quả cầu (lưới render 25% · panel 100% · cache PNG) + 3 cảnh Cầu/Sàn/Vải.
```

---

## 9 · FILES

```
SURFACE: Files — hai TẦNG (thư mục hệ thống + Collection+)
USER JOB: Tìm tệp dự án và tệp dùng chung; thấy được quyền truy cập khác nhau ngay trên mặt.
BEST MOCK: docs/mocks/mock-files-hai-tang.html
ALTERNATIVE MOCKS: docs/mocks/mock-files-hai-ngan.html (bản 17/08 sáng, đã bị thay) · docs/mocks/mock-if-tep.html (lưới tệp, 4 trạng thái) · docs/mocks/mock-files-polished.html
DATE: 17/08 (hai-tang · hai-ngan) · 16/08 (if-tep) · 06/08 (polished)
LIGHT: YES · DARK: YES
TABLET: NO · MOBILE: NO
TOUCH: YES (hai-tang · hai-ngan) · NO (if-tep · polished)
PRODUCTION ROUTE: /files
LIVE COMPONENT: components/filemanager/FileManagerShell.tsx · FilesNavigator.tsx · TepNguonDuAn.tsx · FmContextMenu.tsx · tep-nguon.ts
CURRENT PRODUCTION STATUS: MISMATCH — Files có thật và README ghi `mock-files-polished.html` "ĐÃ PORT vào app"; nhưng cấu trúc hai TẦNG + Collection+ (chốt 17/08 tối) chưa có bằng chứng trong component.
VISUAL STATUS: GOOD / USE AS TARGET (hai-tang) · OBSOLETE (hai-ngan · polished)
NOTES: 🔴 Chuỗi đè chồng trong đúng một ngày: **hai NGĂN** (17/08 sáng, `mock-files-hai-ngan.html`) → **hai TẦNG** (17/08 tối, `mock-files-hai-tang.html`, có Collection+ 8 gói component mã `COL-<LOẠI>-NNN`). Bản hai-tang tự khai: *"Ngăn 'phần thô' cũ đã…"* gộp vào thư mục "Nhà cung cấp" ở tầng ①. ⇒ dùng bản hai-TẦNG. Cả hai đều giữ luật gốc: hai thứ khác BẢN CHẤT thì **phải thấy được là hai**, cấm rút thành một bộ lọc trong cùng danh sách. `mock-if-tep.html` giữ 4 trạng thái + cột phải có **3 mốc phiên bản gần nhất** — phần versioning không có ở bản nào khác.
```

---

## 10 · CÀI ĐẶT · TÀI KHOẢN · AVATAR

```
SURFACE: Cài đặt (toàn app)
USER JOB: Đổi tài khoản, giao diện, nơi lưu tệp, đơn vị đo — áp cho cả app.
BEST MOCK: docs/mocks/mock-if-cai-dat-v2.html  (= "InteriorFlow 02 Cài đặt.html", trùng byte)
ALTERNATIVE MOCKS: docs/mocks/mock-cai-dat-don-vi-ty-le.html (màn Đơn vị & Tỉ lệ) · docs/mocks/mock-settings-polished.html
DATE: 13/08 · 12/08 (don-vi) · 10/08 (polished)
LIGHT: YES (kem — nền kem đã bỏ 16/08) · DARK: YES
TABLET: NO · MOBILE: NO
TOUCH: YES (cai-dat-don-vi-ty-le) · NO (còn lại)
PRODUCTION ROUTE: /settings · /settings/about · /settings/licenses
LIVE COMPONENT: components/settings/AccountSettings.tsx · AppearanceSettings.tsx · StorageSettings.tsx · UnitsScaleSettings.tsx · LockScreenSettings.tsx · ExperienceSettings.tsx · AiDependencySettings.tsx · GuModelSettings.tsx
CURRENT PRODUCTION STATUS: MATCHES — 8 màn settings có thật, gồm `UnitsScaleSettings.tsx` đúng mock Đơn vị & Tỉ lệ (entry `don-vi-ty-le-toan-app`). README ghi `mock-settings-polished.html` "ĐÃ PORT vào app (FM/Settings merged)". `Settings.dc.html` (A–E) là target mới hơn, NOT STARTED.
VISUAL STATUS: GOOD / USE AS TARGET (cai-dat-don-vi-ty-le) · EXPLORATION ONLY (cai-dat-v2) · OBSOLETE (polished)
NOTES: `mock-cai-dat-don-vi-ty-le.html` giữ luật quan trọng viết ngay trên mặt: *"dữ liệu bên trong luôn lưu bằng mm, đổi ở đây không sửa bản vẽ"*. `mock-if-cai-dat-v2.html` là bản khung 6 ổ đầy đủ (mọi hàng cao 44px, nhãn trái, điều khiển phải) — nhịp 44 vẫn đúng, màu kem thì không.
```

```
SURFACE: Avatar Builder / Ảnh đại diện
USER JOB: Tự tạo hình đại diện dùng cho hồ sơ và bình luận trong nhóm.
BEST MOCK: docs/mocks/mock-if-anh-dai-dien-v2.html  (= "InteriorFlow 03 Ảnh đại diện.html", trùng byte)
ALTERNATIVE MOCKS: docs/mocks/mock-avatar-picker-v2.html (đã port) · docs/mocks/avatar-picker.html (bản mẫu đầu)
DATE: 13/08 · 02/08 (v2) · 06/08 (bản đầu)
LIGHT: YES (kem) · DARK: YES
TABLET: NO · MOBILE: NO · TOUCH: NO
PRODUCTION ROUTE: /settings/avatar
LIVE COMPONENT: components/avatar/AvatarBuilder.tsx · AvatarRenderer.tsx · UserAvatar.tsx
CURRENT PRODUCTION STATUS: MATCHES — README ghi `mock-avatar-picker-v2.html` **ĐÃ PORT** (`88566c6`), giữ làm chuẩn đối chiếu; route + `AvatarBuilder.tsx` (311 dòng) + `AvatarRenderer.tsx` (1271 dòng) có thật. Bản 13/08 (11 nhóm tuỳ chọn) mới hơn bản đã port — chưa rõ đã port chưa.
VISUAL STATUS: GOOD / USE AS TARGET (bản 13/08) · CANONICAL (bản v2 đã port) · OBSOLETE (avatar-picker.html)
NOTES: README: `avatar-picker.html` bị thay bởi `mock-avatar-picker-v2.html`. Bản v2 ghi rõ ba cỡ hiển thị **44 / 28 / 20** và dùng `<AvatarRenderer size={172} detail />` thật (không phải ảnh giả) — đúng chốt 02/08 "thumbnail vẽ thật, CẤM số 1..16/chữ suông". Bản 13/08 mở rộng lên 11 nhóm dạng dải ô vuông 44px + nút xoay 3 góc. Chốt 02/08 còn ghi hướng **Memoji/Omoji** và đường Blender headless render sẵn lúc build — không mock nào trong corpus vẽ bản render 3D đó.
```

```
SURFACE: Lưới dự án / chọn dự án
USER JOB: Nhìn hết dự án, chọn một cái vào làm; chuột phải mở menu.
BEST MOCK: docs/mocks/mock-if-du-an-v2.html  (= "InteriorFlow 01 Dự án.html", trùng byte)
ALTERNATIVE MOCKS: (không có)
DATE: 13/08/2026
LIGHT: YES (kem) · DARK: YES
TABLET: NO · MOBILE: NO · TOUCH: NO
PRODUCTION ROUTE: /projects
LIVE COMPONENT: components/ProjectSelect.tsx · components/Dashboard.tsx · components/home/ProjectOverviewCard.tsx
CURRENT PRODUCTION STATUS: UNKNOWN
VISUAL STATUS: EXPLORATION ONLY
NOTES: Giữ khung 6 ổ có số đo tường minh (header 42 · cột trái 214 · giữa · cột phải 236 chỉ hiện khi CÓ CHỌN · dock kính nổi đáy giữa · thanh trạng thái 26) — đây là nguồn số của `SPEC-APP-SHELL-CHUNG`. Cũng là mock hiếm vẽ **chuột phải mở menu** (chốt 03/08 đo được app thiếu hẳn từ vựng chuột+bàn phím: `onContextMenu`/`shiftKey` = 0). Chốt 12/08 sau đó đổi ngữ nghĩa Home thành TỔNG QUAN DỰ ÁN (card = tên + quy mô + start + dãy avatar + nhảy stage đang dở) ⇒ nội dung card ở đây đã lạc hậu, khung thì không.
```

---

## 11 · CỘNG TÁC · CHAT · DUYỆT

```
SURFACE: Mời cộng tác · phân quyền · link chia sẻ có hạn
USER JOB: Mời người vào dự án, chọn quyền, đặt hạn dùng, chép link.
BEST MOCK: docs/mocks/mock-if-cong-tac.html
ALTERNATIVE MOCKS: (không có)
DATE: 07/08/2026
LIGHT: NO
DARK: YES (một theme)
TABLET: YES (khung iPad ngang 1194×834, hit target ≥44, ô nhập 44 · segmented 38 · nút gọi 44 · avatar 28)
MOBILE: NO
TOUCH: YES (qua khung iPad, số chạm khai tường minh)
PRODUCTION ROUTE: (không có route riêng — gần nhất là app/api/projects/[id]/members)
LIVE COMPONENT: components/collab/PresenceBar.tsx · components/ui/PresenceRow.tsx · app/api/projects/[id]/members/route.ts
CURRENT PRODUCTION STATUS: NOT BUILT — có API `members` và `PresenceBar`/`PresenceRow`, nhưng **không có component popover mời / chọn quyền / hạn dùng link** nào trong `components/` (grep "Mời"/"Chia sẻ" chỉ ra `AccountMenu` · `MacroShelf` · `PresenceBar`).
VISUAL STATUS: GOOD / USE AS TARGET
NOTES: 🔴 **MỘT TRONG NHỮNG MẶT DỄ MẤT NHẤT CỦA CORPUS.** Đây là mock DUY NHẤT vẽ phân quyền + mời + hạn dùng link, tự khai là "LƯỢT 1" (còn lượt 2, 3 chưa có), và **là một trong rất ít mock vẽ khung iPad với số chạm cụ thể**. Nó cũng là bản gốc của **RBAC 5 vai** và của Review Gate nội bộ (chốt 11/08 khuya: CĐT KHÔNG vào hệ comment, cửa duyệt là nội bộ). Số bố cục đáng giữ: popover rộng 352 · bo 15 · mũi nhọn 11×11 thẳng tâm nút · **cột nhãn cố định 72** để mọi giá trị bắt cùng một đường dọc.
```

```
SURFACE: Chat nhóm + AI tham vấn
USER JOB: Trao đổi trong kênh dự án; gọi AI khi cần, AI trích đúng nguồn của dự án.
BEST MOCK: docs/mocks/mock-chat-nhom-ai-2026-08-11.html
ALTERNATIVE MOCKS: (không có)
DATE: 11/08/2026
LIGHT: YES (kem) · DARK: YES
TABLET: NO · MOBILE: NO · TOUCH: YES
PRODUCTION ROUTE: (không có trang) — chỉ có app/api/chat/route.ts + app/api/ai-assist-chat/route.ts
LIVE COMPONENT: components/ChatPanel.tsx · components/notebook/NotebookChatPanel.tsx
CURRENT PRODUCTION STATUS: NOT BUILT (trang) — 00-CHOT 16/08 đã đo: *"CHAT có API nhưng KHÔNG có trang — stage đã chốt ở CẤP 0.5 (11/08) mà chưa dựng mặt"*. Xác nhận lại: không có `app/chat/page.tsx`. `Chat nhóm.dc.html` = NOT STARTED.
VISUAL STATUS: GOOD / USE AS TARGET
NOTES: ⭐ Mặt DUY NHẤT của một stage đã chốt mà chưa có route. Vẽ đúng chốt 02/08 (CẢ HAI: thread AI riêng grounded RAG có trích nguồn + @AI trong channel nhóm): toggle "AI tham vấn BẬT", panel **"Nguồn cho AI 4/6"** liệt kê nguồn thật của dự án (Đề bài/Brief · MB-01 mặt bằng · Sổ chốt 7 quyết định · Moodboard · BOQ) — đây là hình dạng cụ thể của RAG-có-nguồn, không có ở bản nào khác.
```

```
SURFACE: Thẻ vi phạm / bảng kiểm (LUẬT ↔ GÓP Ý)
USER JOB: Xem app báo sai chuẩn, phân biệt được đâu là luật (chặn được) đâu là góp ý (không bao giờ chặn).
BEST MOCK: docs/mocks/mock-the-vi-pham-2-che-do.html
ALTERNATIVE MOCKS: docs/mocks/mock-checkpoint-duyet.html (checkpoint duyệt AI · nhận từng phần)
DATE: 16/08 · 05/08 (checkpoint)
LIGHT: YES · DARK: YES
TABLET: NO · MOBILE: NO · TOUCH: NO
PRODUCTION ROUTE: xuyên chặng (panel)
LIVE COMPONENT: components/review/ReviewPanel.tsx · lib/review/types.ts · luat/cad.ts · luat/rules-3d.ts · luat/deck.ts · gopy/index.ts
CURRENT PRODUCTION STATUS: MATCHES (một phần) — `ReviewPanel.tsx` (3 chặng, merge `aa8002a`) + khung `lib/review/` hai lớp có thật. Việc còn lại là **cắm nó vào mọi cửa chuyển công đoạn** (entry `kiem-chang-moi-cong-doan`).
VISUAL STATUS: GOOD / USE AS TARGET
NOTES: Bản vẽ của phiếu P-B: hai panel là CÙNG dữ liệu, khác đúng một thứ — chế độ hiển thị (NGẮN ↔ ĐẦY ĐỦ); khối dưới vạch ngăn là **lớp góp ý — cùng bảng, khác dấu**, đúng chốt 07/08 §12 "trộn hai lớp là hỏng cả hai". `mock-checkpoint-duyet.html` giữ khuôn **ProposalSheet** đời đầu: nhận từng phần (tick từng tường/cửa) · "Không nhận thì quay về: bản vẽ trước khi chạy AI (12 tường)" · nút Nhận tự mờ khi chưa tick · và **cảnh báo trung thực "Bước này không dùng seed — chạy lại có thể ra khác"**. Đây là tổ tiên của luật KS3/KS4 và của thanh tiến trình hai loại.
```

---

## 12 · VITALS

```
SURFACE: Vitals — glyph, cửa sổ, và vị trí neo
USER JOB: Hỏi máy khi bí, ngay tại chỗ tay đang đặt; thấy trạng thái hệ thống mà không bị chatbot chiếm màn.
BEST MOCK: docs/mocks/mock-vitals-3-window-2026-08-12.html
ALTERNATIVE MOCKS: docs/mocks/mock-exs-e-context-stack-vitals.html (Aperture mép trên, 20/08) · docs/mocks/mock-if-vitals-v2.html (lớp nổi đặc, sửa lỗi popover trong suốt) · docs/mocks/vitals-v3.html · docs/mocks/vitals-avatar.html · docs/mocks/vitals-prototype.html
DATE: 12/08 · 20/08 (exs-e) · 13/08 (if-vitals-v2) · 06/08 (v3 · avatar · prototype)
LIGHT: YES (mock-vitals-3-window có "Be / Xám đen"; if-vitals-v2 có kem) · NO (bộ vitals-* 06/08 một theme)
DARK: YES
TABLET: NO · MOBILE: NO · TOUCH: NO
PRODUCTION ROUTE: xuyên app
LIVE COMPONENT: components/studio/VitalsIcon.tsx · components/home/widgets/VitalsPill.tsx · components/voice/CuaGiongNoi.tsx
CURRENT PRODUCTION STATUS: MISMATCH — `VitalsIcon.tsx` bị 00-CHOT ghi là **bản cũ 21/07, gradient cam→navy ngoài hệ màu**; `Vitals.dc.html` + `Vitals glyph.dc.html` là target COMPLETE.
VISUAL STATUS: EXPLORATION ONLY (toàn nhóm) — hướng neo đã bị đè hai lần
NOTES: 🔴 **Vị trí Vitals bị chốt lại BA lần, các mock ở đây thuộc hai đời đầu:** ① 3 cấp window học Siri (12/08, tệp này) → ② neo theo ngữ cảnh, nút rời cạnh trục phải (16/08) → ③ **Aperture TOP-EDGE 3 mức** (20/08, Experience System — đè cả hai bản trước, và 00-CHOT ghi MAP §2.2 + Blueprint B6 **cần cập nhật theo**). ⇒ Đọc hướng thì đọc `mock-exs-e`. Nhưng ba tệp `vitals-*.html` 06/08 giữ thứ không đâu có: **số hạt trong cầu kính là KÊNH THÔNG TIN** (`SPEC-VITALS-VISUAL`, chu kỳ lệch số lẻ 9,3s/3,7s/1,3s nên không bao giờ lặp), và `vitals-v3.html` ghi rõ **"chữ làm kênh trạng thái"** học từ Siri iOS 27 — README xếp chúng là "chuỗi thăm dò (1 theme)". `mock-if-vitals-v2.html` là bản **sửa lỗi popover trong suốt** (nền đục 96%) — bài học kính, đừng để mất.
```

---

## 13 · NỀN THIẾT KẾ (design system, màu, chuyển động, hình học)

```
SURFACE: Bộ nền chung — màu · card · lưới · sidebar · chữ ký
USER JOB: (nội bộ) Một nguồn cho mọi màn dùng chung token, không màn nào tự chế.
BEST MOCK: docs/mocks/mock-bo-nen-chung.html
ALTERNATIVE MOCKS: docs/mocks/mock-designsystem-stagemap.html · docs/mocks/mock-he-thi-giac-3-man.html · docs/mocks/IF-design-system-seed.html (⚠️ nằm ở docs/, không ở docs/mocks/)
DATE: 16/08 · 02/08 (stagemap) · 21/08 (he-thi-giac)
LIGHT: YES · DARK: YES
TABLET: YES (stagemap) · NO (còn lại)
MOBILE: NO · TOUCH: NO
PRODUCTION ROUTE: app/globals.css
LIVE COMPONENT: app/globals.css (token thật)
CURRENT PRODUCTION STATUS: MISMATCH — token tối "chép nguyên globals.css, KHÔNG đụng"; **theme SÁNG trong tệp là BA BẢN ĐỀ XUẤT chờ Hoà chọn**, và sau đó Hoà chốt hướng khác hẳn (canh Apple, nền ngả lam `#F2F2F7`, bỏ nền kem).
VISUAL STATUS: NEEDS SMALL CORRECTION
NOTES: ⭐ Tệp này giữ **luật viết mã màu** đáng nhân rộng: *"MÃ MÀU CHỈ ĐƯỢC VIẾT TRONG KHỐI NÀY. Mọi chỗ khác gọi biến"* — cùng luật ở `mock-rail-hai-cum` · `mock-thanh-tien-trinh` · `mock-home-sua-4-loi`. Nó cũng chép đúng thang bo **6/10/14/20 + --r-full** đã duyệt 12/08. 🔴 `mock-designsystem-stagemap.html` dùng nền `#eceae7` (palette tự chế) + nhãn chặng cũ (Rendering/Presenting/Vẽ 3D) — README đánh "bản đồ minh hoạ, không phải mock port", và bảng rà nhãn 03/08 liệt nó là tệp dính nhiều nhãn sai nhất (10 dòng).
```

```
SURFACE: Màu nhấn thứ hai — bàn thử chọn bằng mắt
USER JOB: (nội bộ) Chọn màu nhấn không giẫm lên ba màu-mang-nghĩa của nghề.
BEST MOCK: docs/mocks/mock-ban-thu-2-huong-mau.html (mòng két ↔ mận trầm)
ALTERNATIVE MOCKS: docs/mocks/mock-ban-thu-mau.html (bàn thử kéo núm, đo tương phản tại chỗ) · docs/mocks/mock-4-huong-mau-nhan-dien.html · docs/mocks/mock-so-2-tim.html (tím IF ↔ tím shadcn)
DATE: 16/08/2026 (cả bốn)
LIGHT: YES · DARK: YES
TABLET: NO · MOBILE: NO · TOUCH: NO
PRODUCTION ROUTE: app/globals.css (`--accent`)
LIVE COMPONENT: app/globals.css
CURRENT PRODUCTION STATUS: NOT BUILT — màu nhấn thứ hai **chưa chốt hex**; app vẫn chạy tím `#6a57f5`.
VISUAL STATUS: EXPLORATION ONLY (đúng vai — đây là bàn thử, cố ý không kết luận)
NOTES: ⚠️ **Đừng đọc mấy tệp này như bảng màu để lấy hex.** `mock-ban-thu-2-huong-mau.html` tính màu SỐNG từ token qua `getComputedStyle`, **0 hex trong script**. Kết quả đo (OKLCH là không gian chuẩn đã chốt): mòng két `#208089` (204,3°) thừa +28,0°; mận trầm `#985c75` (353,5°) thừa +18,2° so với mép cấm — **cả hai đều qua, số không loại được ai**, nên Hoà chọn bằng mắt và **chưa chọn**. Hai thứ ĐÃ chốt: **bỏ hẳn vàng đồng** (`--accent-warm` chỉ cách `--warning` 4°) và **loại xanh rêu** (chỉ cách `--success` 12°). `mock-ban-thu-mau.html` giữ cơ chế **vùng cấm gạch chéo trên núm màu** — biến "tự do trong phạm vi cho phép" thành thao tác nhìn thấy được.
```

```
SURFACE: Liquid Glass — thang vật liệu kính G0–G3
USER JOB: (nội bộ) Kính đúng nơi đúng chỗ; đọc được trước, đẹp sau.
BEST MOCK: docs/mocks/claude-liquid-glass-system.html
ALTERNATIVE MOCKS: (luật chữ ở docs/mocks/LUAT-VAT-LIEU-KINH-G0-G3.md)
DATE: 22/08/2026
LIGHT: YES · DARK: YES
TABLET: NO
MOBILE: YES (`@media (max-width`)
TOUCH: NO
PRODUCTION ROUTE: xuyên app
LIVE COMPONENT: app/globals.css (`--nen-mo-*` · `--vien-mo`)
CURRENT PRODUCTION STATUS: UNKNOWN — CLAUDE-DESIGN-CURRENT §1: "APPROVED TARGET CANDIDATE — chờ Hoà duyệt mắt".
VISUAL STATUS: GOOD / USE AS TARGET
NOTES: Chép NGUYÊN VĂN token từ `app/globals.css` (đọc, không sửa). Thang G1 kính phẳng = chủ đạo · G3 = hiếm. Nối luật đã trả giá qua 4 vòng sửa (K1–K4): fade kính phải fade ở CHÍNH phần tử không fade ở cha · panel kính nổi PHẢI portal ra ngoài · thiếu tiền tố Webkit thì tablet không blur · **kính là VỎ không là RUỘT**.
```

```
SURFACE: Ngữ pháp hình học · luật chuyển động
USER JOB: (nội bộ) Che logo, đặt 9 màn cạnh nhau vẫn nhận ra cùng một hệ.
BEST MOCK: docs/mocks/mock-exs-l-hinh-hoc.html
ALTERNATIVE MOCKS: docs/mocks/mock-exs-m-motion-visual-law.html (toàn văn ở docs/IF-MOTION-VISUAL-LAW.md) · docs/mocks/mock-exs-a-luat-vat-ly.html · docs/mocks/mock-exs-b-mot-app-sau-khung.html
DATE: 20/08/2026
LIGHT: NO · DARK: YES (một theme)
TABLET: NO · MOBILE: NO · TOUCH: NO
PRODUCTION ROUTE: xuyên app
LIVE COMPONENT: app/globals.css (thang bo) · scripts/soi-hinh-hoc.mjs (máy canh)
CURRENT PRODUCTION STATUS: MATCHES (một phần) — thang bo 6/10/14/20 + `--r-full` + `soi:hinh-hoc` đã chạy thật; phần MỚI (FROM THE CENTER · morph giữ identity · icon container thống nhất · 4 mật độ) chưa có máy canh.
VISUAL STATUS: GOOD / USE AS TARGET
NOTES: 👁 Bộ EXS **đã QUA MẮT Hoà 20/08** (EXS-A · B · C · D · E · F · G · H · I · J · L) — đây là nhóm hiếm trong corpus có dấu duyệt mắt thật. Phần mới đã nối vào `SPEC-DESIGN-SYSTEM-IF.md §7`, không vẽ DS mới. ⚠️ Pass mắt mở cổng design→build, **không phải lệnh code ngay**.
```

```
SURFACE: Hình nền hệ thống (5 bộ, sinh bằng mã)
USER JOB: Nền app đổi ánh sáng theo giờ, không tệp ảnh, không lọt ảnh dự án của studio nào vào.
BEST MOCK: docs/mocks/mock-5-bo-hinh-nen.html
ALTERNATIVE MOCKS: (không có)
DATE: 16/08/2026
LIGHT: YES · DARK: YES
TABLET: NO · MOBILE: NO · TOUCH: NO
PRODUCTION ROUTE: / (và màn khoá)
LIVE COMPONENT: components/wallpaper/SystemWallpaper.tsx · WallpaperSettings.tsx · lib/wallpaper/sets.ts · prefs.ts
CURRENT PRODUCTION STATUS: MATCHES — đã xác minh 17/08: `SystemWallpaper` **đã mount** ở `components/home/DongStudioHome.tsx:543` (commit `45e79a2`), `lib/wallpaper/sets.ts` đủ **5 bộ**, `prefs.ts` mặc định `bat: true`. (00-CHOT ghi rõ: khẳng định "chưa cắm vào Home" là SAI, đã gỡ khỏi hàng đợi.)
VISUAL STATUS: CANONICAL
NOTES: Lý lẽ kỹ thuật đáng giữ: sinh bằng mã ⇒ **0 byte thêm vào bộ cài · mọi độ phân giải · chạy offline · và không có đường nào để ảnh dự án của một studio lọt vào** (đúng LUẬT TRUNG TÍNH). Ánh sáng đổi theo giờ như hình nền động macOS.
```

---

## 14 · CHI TIẾT HỆ THỐNG (thanh công cụ · ô giải nghĩa · tiến trình · biểu tượng)

```
SURFACE: Ba thanh công cụ một khuôn (sổ lệnh chung)
USER JOB: Học một lần, dùng ở cả ba chặng — cùng lệnh, cùng icon, cùng phím tắt.
BEST MOCK: docs/mocks/mock-3-thanh-cong-cu-mot-khuon.html
ALTERNATIVE MOCKS: docs/mocks/mock-exs-q-toolbelt-capability.html (Adaptive Toolbelt 20/08)
DATE: 16/08 (B2) · 20/08 (exs-q)
LIGHT: YES · DARK: YES
TABLET: NO
MOBILE: YES (`@media (max-width`)
TOUCH: YES (`hover:none` + `pointer:coarse`)
PRODUCTION ROUTE: xuyên chặng
LIVE COMPONENT: lib/commands/registry.ts · lib/commands/toolbar-source.ts · components/ui/ToolbarBar.tsx · ToolbarChip.tsx · lib/capabilities
CURRENT PRODUCTION STATUS: MATCHES (một phần) — `toolbar-source.ts` + `ToolbarChip` có thật (entry `toolbar-mot-khuon` XONG 15/08, `96a3913`). Bước B3–B5 (nhóm lệnh 2 khuôn · mini window "Chỉnh lệnh vừa chạy" · gộp mọi editor) **chưa thi công**.
VISUAL STATUS: GOOD / USE AS TARGET
NOTES: ⭐ Tệp này là **bằng chứng trực quan cho lời chê gốc "3 chặng như 3 app · khó dùng"** — nó bày cạnh nhau 3 thanh công cụ cũ tự khai danh sách riêng, rồi bày bản đọc chung `lib/commands/registry.ts`, khuôn lấy **dock capsule 3D làm gốc theo KB-1**. Đọc kèm bảng phím phân kỳ đã đo (Xoay RO/RO/**Q** · Chép CO/CO/**D** · Đo DI/DI/**T** · Chọn Esc/**V**). 🔴 Tầng ② (nhóm lệnh 2 khuôn: **thư mục iOS** cho nhóm tra thỉnh thoảng ↔ **ổ Photoshop** cho nhóm dùng liên tục) là **lớp còn TRỐNG** — không mock nào trong corpus vẽ nó.
```

```
SURFACE: Ô giải nghĩa có hình (tooltip) + trục phải hai tầng
USER JOB: Trỏ vào một lệnh là hiểu ngay — hình thao tác trước, chữ sau; lệnh mờ thì biết vì sao mờ.
BEST MOCK: docs/mocks/mock-o-giai-nghia.html
ALTERNATIVE MOCKS: (không có)
DATE: 16/08/2026
LIGHT: YES · DARK: YES
TABLET: NO · MOBILE: NO · TOUCH: YES
PRODUCTION ROUTE: xuyên app
LIVE COMPONENT: components/ui/Tooltip.tsx (prop `hinh` · `label` · `desc` · `shortcut` · `side`) · lib/ui/thao-tac-glyph.tsx · components/ui/ToolbarChip.tsx
CURRENT PRODUCTION STATUS: MATCHES — Tooltip đã mọc prop `hinh` (9 chỗ), kho 6 hình `thao-tac-glyph.tsx` có thật, ràng buộc **cấm-làm-nút khoá bằng TEST**, `ToolbarChip` đã chuyển sang `aria-disabled` + `aria-describedby`. (Xong-máy 16/08, phiếu P-G — **chưa chạy app thật**.)
VISUAL STATUS: GOOD / USE AS TARGET
NOTES: ⭐ Thứ tự bắt buộc: **tiêu đề → HÌNH → chữ**; hình đứng trước chữ vì "kiến trúc sư nhìn là làm, không đọc tài liệu" (điều khoản đúng là **NT-10**, không phải NT-8). Đây cũng là **chỗ lý do của lệnh chưa dùng được sống** — nhãn không đủ 12 từ để chứa. Bài học kèm theo, đã đo bằng playwright: nút `disabled` **vẫn bắn `mouseenter`**, nhưng **không bắn `focus` và Tab bỏ qua hẳn** ⇒ lý do trong `title` là câm với bàn phím và trình đọc màn hình. Loại lỗi này 5 máy soi hiện có KHÔNG bắt được.
```

```
SURFACE: Thanh tiến trình — hai loại, cấm bịa phần trăm
USER JOB: Biết việc đang chạy còn bao lâu; và khi máy không biết thì máy phải nói là không biết.
BEST MOCK: docs/mocks/mock-thanh-tien-trinh.html
ALTERNATIVE MOCKS: (không có)
DATE: 16/08/2026
LIGHT: YES · DARK: YES
TABLET: NO
MOBILE: YES (`@media (max-width`)
TOUCH: NO
PRODUCTION ROUTE: xuyên app
LIVE COMPONENT: lib/ui/tien-trinh.ts · components/ui/LightBar.tsx · components/ui/LightArc.tsx
CURRENT PRODUCTION STATUS: MATCHES — `lib/ui/tien-trinh.ts` + `LightBar.tsx` có thật; union phân biệt: nhánh **không-đo-được KHÔNG có trường `pct`** ⇒ bịa số là `tsc` ĐỎ; lõi **cố ý không có hàm ETA** và có test canh cho nó tiếp tục không có. (Xong-máy 16/08, P-H — chưa chạy app thật; nhánh `prefers-reduced-motion` chưa kích hoạt lần nào.)
VISUAL STATUS: GOOD / USE AS TARGET
NOTES: ⭐ Ví dụ mẫu của việc **biến một nguyên tắc thành thứ máy chặn được** thay vì viết vào tài liệu rồi hy vọng. Hai loại phải NHÌN-LÀ-PHÂN-BIỆT: ①đo được → chạy theo số thật, có % và thời gian còn lại · ②không đo được → dạng KHÁC HẲN, chạy vô hạn, **KHÔNG có số**. Hình thức: **dãy vạch nhỏ** + điểm sáng đầu mút, không phải khối đặc. Phân vai với viền chạy: viền = "card này đang chạy" (nhìn từ xa) · thanh = "còn bao lâu" (nhìn gần).
```

```
SURFACE: Chữ ký thị giác + biểu tượng loại tệp
USER JOB: (nội bộ) Chọn một chi tiết nhận diện mang THÔNG TIN, không phải hoa văn; và phân biệt loại tệp mà không tiêu hết cửa màu.
BEST MOCK: docs/mocks/mock-chu-ky-va-bieu-tuong-tep.html
ALTERNATIVE MOCKS: (không có)
DATE: 16/08/2026
LIGHT: YES · DARK: YES
TABLET: NO
MOBILE: YES (`@media (max-width`)
TOUCH: NO
PRODUCTION ROUTE: xuyên app
LIVE COMPONENT: (chưa có — chữ ký chưa chọn)
CURRENT PRODUCTION STATUS: NOT BUILT — không phương án chữ ký nào được chọn.
VISUAL STATUS: EXPLORATION ONLY
NOTES: ⭐ Giá trị lớn nhất không phải 3 phương án mà là **cái THƯỚC 7 câu** (`simpleCoChiTiet`) và cách nó được **hiệu chuẩn trước khi dùng** — chấm thử 3 thứ đã biết kết luận, ra 3 kết quả khác nhau (đường dọc "hôm nay" đạt cả bảy · ô trống nét đứt 6/7 · quầng sáng tĩnh TRƯỢT). Kết quả chấm: **PA1 trượt** (thanh chặng đã nói y hệt ⇒ bản sao) · **PA2 trượt H1** (cờ tin cậy có BA giá trị `measured|inferred|verified` mà chữ ký chỉ vẽ HAI) · **PA3 chờ màu nhấn**. Ràng buộc đo được về biểu tượng tệp: chữ đuôi tệp tô màu ở 10px chỉ đạt 3,96–4,50:1 ⇒ **màu chỉ được dùng ở khung và nền, KHÔNG dùng cho chữ**; và 5 đuôi tệp cần ~125° hue mà chỉ còn <40° sau khi màu nhấn lấy một cửa.
```

---

## 15 · TỔNG QUAN & LUẬT (không phải màn)

```
SURFACE: Full App Experience Atlas — bản đối chiếu toàn app
USER JOB: (nội bộ) Một khung nhìn thấy hết mọi màn và trạng thái từng màn, không giấu màn xấu.
BEST MOCK: docs/mocks/mock-exs-atlas-toan-app.html
ALTERNATIVE MOCKS: docs/mocks/mock-exs-b-mot-app-sau-khung.html · docs/mocks/mock-exs-f-flows-nghe.html · docs/mocks/mock-exs-c-home-work-os.html
DATE: 20/08/2026
LIGHT: YES (`prefers-color-scheme` + `data-theme`) · DARK: YES
TABLET: NO
MOBILE: YES
TOUCH: NO
PRODUCTION ROUTE: (không phải màn của app)
LIVE COMPONENT: (không có)
CURRENT PRODUCTION STATUS: NOT BUILT (đúng vai — đây là tài liệu)
VISUAL STATUS: EXPLORATION ONLY
NOTES: ⚠️ Tệp tự khai: **"THAM CHIẾU KỸ THUẬT — không phải bản duyệt thị giác"**; theo GATE #4 (Hoà chốt 20/08) bản Atlas duyệt-được phải là artifact native trong Claude Design, trang này chỉ là khung đối chiếu để thi công/QA. Sự thật từng khung nằm ở `docs/ATLAS-KIEM-KE-2026-08-20.md`. **Quan hệ với chính chỉ mục này:** Atlas là bản kiểm kê MÀN; `_index-part-A/B` là bản kiểm kê BẢN VẼ — hai thứ khác nhau, đừng gộp.
```

```
SURFACE: Auto Grid — capability bố cục tự động của Present
USER JOB: Chọn 2+ block trên Present canvas → bố cục hình thành tại chỗ → so phương án → Apply/Undo.
BEST MOCK: docs/mocks/mock-exs-j-khung-moc.html
ALTERNATIVE MOCKS: (không có)
DATE: 20/08/2026
LIGHT: NO · DARK: YES (một theme)
TABLET: NO · MOBILE: NO · TOUCH: NO
PRODUCTION ROUTE: /present-editor
LIVE COMPONENT: components/present-editor/* (chưa có Auto Grid)
CURRENT PRODUCTION STATUS: NOT BUILT
VISUAL STATUS: GOOD / USE AS TARGET (sau khi đã sửa đúng scope)
NOTES: 🔴 **Tệp này đã bị viết lại một lần vì SAI SCOPE** — bản đầu vẽ nó như experience pattern 5 màn toàn app; Hoà STOP 20/08: Auto Grid là **MASTER CAPABILITY bên trong stage PRESENT**, chạy ngay trên Present canvas. **Board EXS-K (5 ca toàn app) ĐÃ XOÁ — cấm trích lại.** "Layout Ghost / Khung Mọc" là motion CỦA capability này, **không phải loading skeleton toàn app**. Bản hiện tại đã theo P0–P7 + 6 phương án cùng content. Luật giữ: bố cục sau Apply = editable bình thường; user giữ quyền pin/hero/exclude/lock/regenerate vùng; không đè vùng đã custom.
```

---

## SUPERSEDED — CẤM DỰNG

| Tệp | Bị thay bởi | Nguồn phán |
|---|---|---|
| `mock-cad-shell-v2_cu.html` | `2D Kỹ thuật.dc.html` | CLAUDE-DESIGN-CURRENT §3 |
| `mock-cad-shell-v3_cu.html` | `2D Kỹ thuật.dc.html` | CLAUDE-DESIGN-CURRENT §3 |
| `mock-cad-shell-v4_cu.html` | `2D Kỹ thuật.dc.html` | CLAUDE-DESIGN-CURRENT §3 |
| `mock-cad-shell-v5_cu.html` | `2D Kỹ thuật.dc.html` · `Chế độ Chuyên.dc.html` · `Chế độ Phác thảo.dc.html` | CLAUDE-DESIGN-CURRENT §3 + chính tệp tự ghi *"ĐỪNG PORT file này"* |
| `mock-cad-shell-pro_cu.html` | `2D Kỹ thuật.dc.html` | CLAUDE-DESIGN-CURRENT §3 |
| `mock-2d-ky-thuat_cu.html` | `2D Kỹ thuật.dc.html` | CLAUDE-DESIGN-CURRENT §3 · tệp tự ghi "BẢN CŨ đã bị thay" |
| `claude-login-home-ambient-final.html` | `claude-login-redesign-abc.html` | CLAUDE-DESIGN-CURRENT §1: **BỊ BÁC 22/08** (verdict: "đọc như SaaS auth card") |
| `mock-mood-collab.html` | `mock-mood-collab-g2-2026-08-03.html` | README-mocks (bản trước LUẬT GIAO DIỆN) — ⚠️ **giữ đọc riêng phần tablet+bút, bản G2 không có** |
| `mock-ve-3d.html` | `mock-if-ve3d.html` → rồi cả hai bị `3D Dựng khối.dc.html` vượt | README-mocks |
| `mock-if-ve3d.html` | `3D Dựng khối.dc.html` (CLAUDE-DESIGN-CURRENT §11: chuẩn chất lượng) | CLAUDE-DESIGN-CURRENT §1 |
| `mock-library.html` | `mock-material-sphere-2026-08-03.html` → `Thư viện.dc.html` | README-mocks ("trước khi chốt Thư viện = MỘT sheet") |
| `mock-bottombar-redesign.html` | bar chốt nằm trong `mock-mood-collab-g2-2026-08-03.html` | README-mocks |
| `avatar-picker.html` | `mock-avatar-picker-v2.html` | README-mocks |
| `mock-files-hai-ngan.html` | `mock-files-hai-tang.html` (cùng ngày 17/08, tối đè sáng) | 00-CHOT 17/08 tối: bản "hai NGĂN" **hết hiệu lực** |
| `mock-files-polished.html` · `mock-settings-polished.html` | đã port vào app; nay `Settings.dc.html` là target | README-mocks ("ĐÃ PORT — giữ lịch sử") |
| `mock-render-layout-H3.html` | — (hướng đã duyệt, token phải làm lại; nhãn chặng đã cũ) | README-mocks: LỖI THỜI |
| `mock-designsystem-stagemap.html` | `SPEC-DESIGN-SYSTEM-IF.md §7` + bộ EXS | README-mocks ("bản đồ minh hoạ, không phải mock port") + bảng rà nhãn 03/08 (10 dòng nhãn sai) |
| `mock-cad-revit-2026-08-03.html` | — (mode "Cấu kiện" **không còn tồn tại** sau chốt 07/08) | README-mocks 08/08 |
| `mock-kich-ban-sidebar.html` (4 kịch bản) | `mock-sidebar-ban-do-2026-08-22.html` | Hoà 16/08: *"không có thanh sidebar nào đúng"* |
| `mock-rail-hai-cum.html` | Experience System 20/08 — sidebar **BA CỤM** | 00-CHOT 20/08 (đè chốt hai-cụm 16–17/08) |
| `mock-vitals-3-window-2026-08-12.html` (vị trí neo) | Vitals **Aperture TOP-EDGE** (20/08) | 00-CHOT 20/08: đè cả bản 12/08 lẫn bản neo-ngữ-cảnh 16/08 |
| `vitals-prototype.html` · `vitals-v3.html` · `vitals-avatar.html` | `Vitals.dc.html` + `Vitals glyph.dc.html` | README-mocks ("chuỗi thăm dò, 1 theme") |
| `mock-if-intro-bong-hoi-tu-2026-08-03.html` | `mock-if-intro-C3.html`; và cả hướng intro bị chốt bỏ 02/08 | 00-CHOT — ⛔ **chứa `--ttt-cam` / `--ttt-navy`: vi phạm LUẬT TRUNG TÍNH** |
| `mock-exs-n-idfc-chuan-visual.html` · `mock-exs-o-idfc-bo-mau.html` · `mock-exs-p-idfc-trai-nghiem.html` · `mock-exs-r-idfc-real-asset-quality.html` | hướng Library ba tầng BROWSE→PASSPORT→VERIFY (`mock-exs-t-library-v0.html`) | Hoà BÁC 20/08 chiều — **cấm thi công visual**, chỉ còn giá trị tham chiếu kỹ thuật |
| `InteriorFlow 01 Dự án.html` · `InteriorFlow 02 Cài đặt.html` · `InteriorFlow 03 Ảnh đại diện.html` | (không phải bản khác — **trùng byte** với `mock-if-du-an-v2` · `mock-if-cai-dat-v2` · `mock-if-anh-dai-dien-v2`) | `md5` xác minh — bản sao, không phải phiên bản |

**Ghi chú chung về nền kem:** mọi mock 02–13/08 dùng theme sáng `[data-theme="kem"]` (`--bg:#f0ece4`) — **nền kem đã bị bỏ 16/08** (đo được: `#f2efe9` ngả VÀNG so với Apple `#F2F2F7` ngả LAM, lệch 14 điểm kênh lam). Các mock đó không bị SUPERSEDED toàn bộ, nhưng **màu nền sáng của chúng hết hiệu lực**; đọc bố cục, đừng lấy hex.

---

## SURFACE CHỈ CÓ Ở ĐÂY

Những mặt được thiết kế trong corpus này mà **không có route production tương ứng và không có mock mới hơn thay**. Đây là phần dễ quên nhất — lý do tồn tại của chỉ mục này.

| # | Surface | Tệp duy nhất | Vì sao dễ mất |
|---|---|---|---|
| 1 | **Mời cộng tác · phân quyền · hạn dùng link** | `mock-if-cong-tac.html` (07/08) | **NOT BUILT**: có API `projects/[id]/members` nhưng **0 component** popover mời / chọn quyền / hạn link. Tự khai là "LƯỢT 1" — lượt 2,3 chưa từng có. Cũng là một trong rất ít mock có **khung iPad với số chạm cụ thể**. Là bản gốc của RBAC 5 vai + Review Gate nội bộ. |
| 2 | **Chat nhóm + AI tham vấn (panel "Nguồn cho AI")** | `mock-chat-nhom-ai-2026-08-11.html` | **NOT BUILT (trang)**: có `api/chat` + `api/ai-assist-chat`, **không có `app/chat/page.tsx`**. Stage đã chốt ở CẤP 0.5 từ 11/08 mà chưa dựng mặt. `Chat nhóm.dc.html` = NOT STARTED ⇒ **không có bản vẽ nào khác**. |
| 3 | **Máy quay · ống kính · đường cam · xuất 3 mức** | `InteriorFlow 05 Máy quay.html` | Tên tệp **có khoảng trắng** nên trượt khỏi mọi glob `mock-*`; không trùng byte với tệp nào (khác 3 tệp "InteriorFlow" kia vốn là bản sao). Panel 4 nhóm + tầm mắt 1650 + safe frame chưa có ở bản vẽ nào khác; `CamPathPreview`/`CamPathControlPanel` được 00-CHOT ghi là **chưa wire**. |
| 4 | **Trang chia sẻ hồ sơ cho khách** | `mock-if-trang-chia-se.html` | Mặt DUY NHẤT khách hàng nhìn thấy; route `/share/[token]` có nhưng **không có mock nào khác** vẽ nó. Chốt 11/08 khẳng định luồng khách giữ truyền thống ⇒ trang này là mắt xích thật, không phải phụ. |
| 5 | **Video editor (dựng phim)** | `mock-trinh-video-2026-08-04.html` | **NOT BUILT**: không có component video editor nào trong `components/`. Và nó đang **nằm sai chặng** (chốt 13/08 dời TẠO+DỰNG video về chặng 2) ⇒ dễ bị bỏ khi ai đó dọn chặng 3. |
| 6 | **Văn bản / biểu mẫu (báo giá · hợp đồng · thuyết minh)** | `mock-trinh-vanban-2026-08-09.html` | Là **phụ thuộc cứng của `meeting-distill`** (biên bản họp) đang xếp Đợt 3; chỉ có `api/present/text`, chưa thấy UI. Mất tệp = mất bản vẽ của mắt xích đó. |
| 7 | **Bảng công cụ 3D — 51 lệnh khối kể cả lệnh chưa code** | `mock-if-bang-cong-cu-3d.html` | Hiện thân của LUẬT §9 "vẽ cả ô trống làm bằng chứng còn việc". Nếu mất, danh sách 51 lệnh + lý do từng lệnh mờ **không tồn tại ở đâu khác** — và luật cấm xoá ô trống cho gọn mắt sẽ mất chỗ dựa. |
| 8 | **Cửa vào Trình chiếu ở CẢ desktop lẫn tablet** | `mock-trinh-chon-ho-so-tablet-2026-08-10.html` | CLAUDE-DESIGN-CURRENT §2 vẫn liệt "D5 Present Template Browser — 0 `.dc.html`, HÀNG ĐỢI" ⇒ **rủi ro dựng lại từ đầu cao nhất trong corpus**. Đã có sẵn thẻ "＋ Tạo hồ sơ trống" đúng chốt 10/08. |
| 9 | **Thư viện — trạng thái RỖNG (6 màn)** | `mock-if-thu-vien-trong.html` | Trạng thái rỗng gần như không bao giờ được vẽ lại; `Bốn trạng thái rỗng.dc.html` chỉ PARTIAL và không phủ kệ Thư viện. |
| 10 | **Canvas cộng tác trên tablet + bút (viết tay)** | `mock-mood-collab.html` (06/08) | Tệp bị README đánh "thay bởi bản G2", nhưng **bản G2 KHÔNG có phần tablet/pen/viết tay**. Thay-thế-một-phần ⇒ phần cảm ứng rơi mất mà không ai ghi. |
| 11 | **Tầng ② nhóm lệnh (thư mục iOS ↔ ổ Photoshop)** | *(không có mock nào)* | Ghi vào đây vì đúng chỗ này là **lỗ trống đã xác định**: kiến trúc tool 3 lớp có tầng ①(`mock-3-thanh-cong-cu-mot-khuon`) và cửa sổ(`mock-tool-bam-vat`), **tầng ② chưa ai vẽ**. 00-CHOT khai rõ: cảm giác "rối" đến từ chỗ trống này, không phải từ vệ tinh. |
| 12 | **Nút `+` chèn bước giữa hai node trên dây** | *(không có mock nào)* | Entry `nut-cong-tren-day` còn CHỜ; phiếu P-R đã CẮT V4 vì `FlowCanvas.tsx:37` chỉ khai `nodeTypes`. Chưa có bản vẽ ⇒ dễ rơi khỏi trí nhớ hoàn toàn. |

**Không nằm trong danh sách trên nhưng cần biết:** *Notifications · Todo/Notes · Site Intelligence · Integrations · Design DNA* — corpus phần B **không có mock riêng** cho những mặt này, dù production đã có mảnh (`components/site/*`, `components/dna/DesignDnaCardPanel.tsx`, `api/integrations/[provider]/*`, `api/home/notes`, `components/home/widgets/QuickNotes.tsx`, `components/studio/CumPhaiTren.tsx` cho thông báo). Tức đây là **code đi trước bản vẽ** — ngược với 12 mục trên. Nếu cần bản vẽ cho chúng thì là DESIGN REQUIRED thật, không phải quên.

---

*Lập bởi phiên kiểm kê VISUAL MASTER INDEX phần B. 110 tệp đã mở đọc nội dung, không phân loại theo tên. Phần A (`*.dc.html`) do phiên khác lập — hai phần không giẫm nhau.*
