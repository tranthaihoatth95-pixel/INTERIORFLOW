# SỔ KIỂM TỔNG — HỆ IDF
**Luật Hoà 03/08 (nguyên văn):** *"Mỗi lần thay phiên bạn phải đọc cho tôi, không được rớt một ngữ cảnh nào,
không được mất mát một tính năng nào đã gây dựng. Đó là luật."*
**Cách dùng:** phiên MỚI nào (Cowork hay Code) cũng đọc file này TRƯỚC TIÊN. Cowork trực ca đọc §1 mỗi ca —
tính năng nào mất khỏi UI/code mà không có quyết định ghi ở `00-CHOT.md` = **BÁO ĐỘNG, không phải "chắc ai đó xoá có lý do".**
Append-only: chỉ thêm dòng, đổi trạng thái có ngày; không xoá dòng.

---

## §1 · SỔ CHỐNG RỚT — tính năng đã gây dựng (kiểm được bằng lệnh)

| Tính năng | Ở đâu | Trạng thái | Lệnh kiểm nhanh |
|---|---|---|---|
| Avatar SVG — **đã đổi hướng Memoji** (`83127a1` bỏ chất nỉ, volume gradient; 03/08) | `components/avatar/AvatarRenderer.tsx` | ✅ sống, 1222 dòng | `wc -l` ≈1222 · `git log -3 -- <file>` |
| Trang đổi avatar theo mock v2 | `app/settings/avatar/` | ✅ `88566c6` | mở `/settings/avatar` |
| Vitals (bong bóng + chat) | `components/studio/VitalsChatBubble.tsx` + StatusBar | ✅ sống | grep Vitals StatusBar |
| **Mood+Collab: node moodboard/gu/ghi chú** | sidebar chặng 2 (`NodeLibraryPanel`) | ✅ sống (ảnh Hoà 03/08) | mở Rendering, khu MOOD+CỘNG TÁC |
| **Presence online/offline · mời(+) · sticky/comment/reaction · share Viewer/Commenter/Editor** | — | ⬜ **CHƯA BUILD** — là bước **G2** ticket CHANG2. KHÔNG PHẢI MẤT | `grep -n "G2" docs/TICKET-CHANG2-BUILD-2026-08-02.md` |
| 3D viewer 5 mode (orbit·campath·depth/lineart·section·walk) | `lib/three/*`, `Scene3DViewer` | ✅ `d9eea9b d7dff63 4c81469 87c2e78 2881c32` | `git log --oneline -- lib/three/capture.ts` |
| captureSequence streaming + AbortSignal | `lib/three/capture.ts` | ✅ `57ed9b8` | test capture |
| BOQ engine (compute·xlsx·cache·from-project·model·route) | `49ebadd` trên **nhanh-phu**, đã push origin | ✅ vào git 03/08 tối (12 file, 1322 dòng) — chờ merge main | grep "feat(boq)" trong git log --all |
| ATLAS↔Lark client + map + sync route | `lib/lark/*`, `app/api/atlas-materials/sync/` | 🟡 code xong, chặn 131006/token i-HOA | chạy sync |
| File Manager thật (list/upload/real-fs/inspector) | `components/filemanager/*`, `lib/filemanager/real-fs.ts` | ✅ merge `12223cf` | mở `/files` |
| Settings + hình nền canvas áp thật | `app/settings/*` + `CanvasWallpaper` trong `app/layout.tsx` | ✅ đã wire `e6edcf1` | đổi hình nền → reload cứng |
| Thư viện = MỘT sheet (trang /library khai tử) | `a73c658` trên **nhanh-g4, CHƯA merge** | 🟡 chờ merge (main đã xoá StageShell → cần luật xử mount) | `git log nhanh-g4 -1 -- components/library/LibrarySheet.tsx` |
| Mode Vẽ 3D: CommandPanel·Viewport3D·ObjectProperties | `20e935d f6868e7 245b96b` trên **nhanh-g4** | 🟡 xong, chờ merge | `git log nhanh-g4 -3` |
| **MaterialSphere quả cầu vật liệu** (1 renderer PMREM chung · 3 cảnh Cầu/Sàn/Vải · cache PNG) — gắn Command3DPanel + kệ vật liệu sheet + CommandPanel G4 | `14d3ec6` trên **nhanh-g4** (04/08) | 🟡 xong, chờ merge | mở mode Vẽ 3D tab Vật liệu |
| **Ô xem trước Thư viện = bậc thang** (ảnh ATLAS → quả cầu → vân procedural theo loại + icon; hết 12 gradient giả) · **vật liệu gộp về MỘT kệ chung ATLAS** · scrim/3-tầng-nền đúng | `1bb3e5c` trên **nhanh-g4** (04/08) | 🟡 xong, chờ merge | mở Thư viện, kệ Vật liệu ATLAS |
| **5 lỗi UI chặng Render (G4-1a đêm 04/08)** — toolbar bút theo tool · canvas trống 100% · banner/empty state khuôn ngôn ngữ · attribution gọn | `7ac431c` trên **nhanh-g4** | 🟡 xong, chờ merge — kèm phát hiện DỮ LIỆU demo hỏng (node y=−50202, BAO-CAO-G4) | mở Rendering, canvas trống |
| AppShell 6 ổ phủ CẢ 5 màn, LeftRail + StageShell ĐÃ XOÁ | `9fe8be8 3a92170` | ✅ (nút Thư viện chờ nối sheet sau merge g4) | grep LeftRail = 0 |
| Intro trung tính (hết màu/ảnh TTT) | `components/intro/*` | ✅ `63cc673` | grep detech/F06020 intro |
| Layer State + lớp/nét/ẩn/khoá chặng Vẽ | sidebar CAD | ✅ (ảnh Hoà) | mở CAD |
| CAD: L·PL·REC·C·ROOM·dim·hatch·block 46·DXF/DWG·zone·AI-assist | `lib/cad/*` | ✅ | `npm test -- cad` |
| Kính lỏng K1-K4 + luật portal | `globals.css` + spec | ✅ | — |
| Tooltip tĩnh cảm ứng | `globals.css:1030` | ✅ | — |
| Gallery/Notebook/Login/Journey/Smart Tour | các nhánh đã merge | ✅ | mở app |
| Auto-backup + Recovery (`lib/cad/auto-backup.ts` + modal) | code cũ | ✅ sống | `ls` 2 file |
| Panel thò thụt: Rollout (tiêu đề/grip/chuột phải/ghim/nhớ theo LOẠI VẬT) + InspectorPages Rhino + dải thu gọn CÓ NHÃN | `components/studio/Rollout.tsx`·`InspectorPages.tsx`·`CadInspectorPages.tsx` | ✅ `7847969` (04/08 đêm) | chọn entity CAD → Inspector; thu Navigator |
| Phím tắt toàn app (B/I/⌘\\/⌘1-3 · CAD ⇧-biến-thể · va L xử theo §4e) + Render 1-cột (Trên bảng · hết banner · fitView có điều kiện) | `AppShell.tsx`·`AppChrome.tsx`·`NodeLibraryPanel.tsx`·`FlowCanvas.tsx` | ✅ `2649287`·`59702d6`·`efa434c` (04/08) | bấm B/⇧L từng chặng · mở Render nhìn 1 cột |
| **Điều còn TREO chờ Hoà** | avatar 3D (mua/thuê/Blender) · Google Flow video intro · quyền Wiki Lark · dọn `public/detech` 22MB | ⏳ | `00-CHOT.md` |
| ⛔ **LUẬT** — CẤM `animate opacity` trên phần tử có `backdrop-filter` (self LẪN mọi tổ tiên) — opacity<1 tự tạo backdrop root cô lập (spec filter-effects-2), kính mất nền thật lúc fade rồi đục ập vào khi opacity chạm 1. Fade thì fade `y`/`scale`/nội dung KHÔNG-backdrop-filter bên trong, không phải chính khối kính hay tổ tiên nó. Đã sửa: P6c K1/K2 present-editor (`BAO-CAO-PHU.md`) + màn đăng nhập `.lq-card` (`LoginForm.tsx` tự thân + tổ tiên `rise()`→`riseNoFade()` trong `LoginScreen.tsx`, `lib/motion.ts`). Còn sót (không sửa vì KHÔNG mount — dead code): `TitleSequence.tsx`/`IntroSequence.tsx` root. | ✅ `lib/motion.ts riseNoFade` | grep `initial={{.*opacity\|animate={{.*opacity` cạnh `backdropFilter`/`.mat-*`/`.lq-card`/`.if-dock` mỗi khi thêm entrance animation mới cho khối kính |

## §2 · PHÂN MẢNG — mỗi phiên một vùng, không ai đụng ai (Hoà duyệt 03/08)

| Phiên | Mảng SỞ HỮU | Vùng file | Cấm đụng |
|---|---|---|---|
| **CHINH** | Vỏ app & hạ tầng UI: AppShell 6 ổ · Navigator · dock · sổ lệnh UI · panel thò thụt (rollout/grip/ghim) · theme | `components/studio/*` · `app/globals.css` · `app/layout.tsx` | filemanager · library · three · boq · lark |
| **PHU** | Lõi dữ liệu & engine: sổ lệnh lib · schema matId+PBR · export V-Ray/D5 · BOQ · ATLAS/Lark · 3D core | `lib/*` (commands·schema·materials·boq·lark·three·cad) | components/* trừ khi spec bắt |
| **G4** | Editor trong ổ: Thư viện sheet + quả cầu vật liệu · CommandPanel/Viewport3D/ObjectProperties (Vẽ 3D) · File Manager · Mood+Collab G2 · Present editors | `components/library|filemanager|three|nodes|present-editor` · `app/files|settings|library` | components/studio · lib của PHU |
| **ARCHINOTE** | App ArchiNote (repo `ttt-tasks`) | toàn repo đó | mọi repo IF |
| **COWORK (tôi)** | **KHÔNG code, KHÔNG dựng mock nữa (lệnh Hoà 03/08).** Chỉ: nghiên cứu · spec · chốt · giao việc · kiểm chọn lọc · trực ca · sổ này | `docs/*` | mọi code |
Mock từ nay: Cowork viết **đặc tả mock bằng chữ** trong phiếu giao việc → phiên nhận mảng tự dựng mock trong `docs/mocks/` → Hoà duyệt ảnh → mới port vào app.

## §3 · HÀNG ĐỢI TỰ CHẠY (cập nhật 03/08 tối — Cowork TỔNG bơm mỗi ca)

**⚡ CƠ CHẾ SHIP-TRƯỚC-SỬA-SAU (Hoà chốt 04/08 đêm: "duyệt hết, cứ cho lên tổng thể, sai đâu sửa đó"):** việc UI không còn chờ mock/duyệt-trước — dựng thẳng theo spec + token, Hoà hậu kiểm trên app thật, lệch thì sửa tại chỗ + ghi sổ. VẪN GIỮ NGUYÊN: luật trung tính · token globals.css · vùng mảng §2 · chống rớt §1 · nghiệm thu tsc/test/DOM/2-theme (vì ship nhanh chỉ an toàn khi lưới đỡ còn nguyên).

**CHẾ ĐỘ TỰ CHẠY (Hoà kích hoạt 1 lần/phiên):** xong 1 việc → commit + cập nhật `BAO-CAO-<mảng>` →
đọc lại mục của mình dưới đây → lấy việc KẾ TIẾP theo thứ tự → lặp. Việc nào ghi ⛔ hoặc "chờ X"
mà X chưa xong thì BỎ QUA sang việc sau. Cạn hàng đợi → ghi "HẾT VIỆC <giờ>" vào báo cáo + chốt phiên.
CẤM bịa việc ngoài hàng đợi. CẤM chạm vùng phiên khác (§2).

### CHINH — 🔴 ƯU TIÊN SÁNG 04/08 (Hoà chốt: 1 màn = 1 cột trái)
0a. DỌN ĐỊA TẦNG chặng Render: XOÁ cột "ĐẦU VÀO" Navigator (node trên bảng → nhóm "Trên bảng"
    đầu panel Thư viện khối, bấm = focus canvas) · ổ Navigator chặng Render = CHÍNH panel Thư viện
    khối, MỘT cột, không lồng đè · XOÁ mọi banner "Còn công cụ.../Công cụ đầy đủ..." ·
    canvas trống zoom 100% (bug fitView 15%). Verify: mở Render đếm được ĐÚNG MỘT lớp cột trái.

### CHINH
1. **Merge nhanh-g4 RỒI nhanh-phu vào main** (nhanh-phu = BOQ `49ebadd`, sạch, toàn file mới — không mìn). Mìn của nhanh-g4: nhanh-g4 mount `<LibrarySheet/>` vào `StageShell.tsx` — main ĐÃ XOÁ file đó.
   Xử: nhận hết code G4 (library/ + three/), mount chuyển sang ổ overlay dùng chung của AppShell (tự thêm ổ nếu chưa có).
   Sau merge: nút "Thư viện" (`Navigator.tsx:130`) MỞ SHEET ở cả 5 màn. Verify 5 màn + Esc + deep-link `/library`.
1b. 🔥 GẤP (đêm 04/08): Navigator chặng Render gần RỖNG sau merge — chỉ hiện ĐẦU VÀO, mất nhóm Nguồn·Xử lý·Bảng·Xuất. Nối nguồn dữ liệu NodeLibraryPanel vào Navigator theo mock-if-3chang (sidebar render). Verify cả 3 chặng Navigator có nội dung đúng.
2. Xử `app/dev-bench-3d-2/` untracked: xoá hoặc commit đúng chỗ, ghi lý do 1 dòng.
3. Panel thò thụt theo `SPEC-PANEL-ROLLOUT-IDF`: rollout (tiêu đề=toggle · grip ⠿ kéo, bóng mờ + vạch accent ·
   chuột phải Mở hết/Thu hết/Solo/Đặt lại · nút Thu-hết NHÌN THẤY ĐƯỢC) · nhớ theo LOẠI VẬT không theo sub-mode ·
   ghim · thu về dải mỏng CÓ NHÃN hover hé (CẤM auto-hide) · Inspector = dải trang kiểu Rhino.
4. Phím tắt toàn app `SPEC-PANEL-ROLLOUT-IDF` §4: ⌘K palette (nối `CommandPalette.tsx` có sẵn) · L/B/I/⌘\ ·
   ⌘1-3 · xử va phím L (chặng Vẽ: L=đường, Thư viện=⇧L). Nếu PHU chưa xong registry thì làm khung phím trước, TODO nối sau.
5b. Mỗi lần chốt phiên: quét `docs/` untracked (BAO-CAO-COWORK-*, spec mới) → commit gộp `docs: gom bao cao cowork` — các phiên Cowork chat không chạy git được, CHINH là người gác cổng docs.
6. Bảng thay chữ→icon `SPEC-PANEL-ROLLOUT-IDF` §3 áp vào Inspector + Settings (icon bật/tắt, chấm màu trạng thái,
   chip engine IF/V-Ray/D5, icon xích đứt --warning). Mỗi icon có tooltip + phím tắt.

### PHU (làm hết thì lấy tiếp 6-7)
1. ✅ ĐÃ XONG 03/08 tối — BOQ vào git (`49ebadd` nhanh-phu, đã push). Bỏ qua, sang mục 2.
2. ATLAS sync thật: kiểm token `Ejk6wjIXoi` (i HOA) trong .env.local → chạy sync 1449 bản ghi → sửa
   `ATLAS_FIELD_NAMES` theo 8 cột thật → test lại → nối BOQ. Vẫn 131006 → DỪNG, báo 1 dòng (việc Lark Console của Hoà).
3. Sổ lệnh `lib/commands/registry.ts` (Trụ 2 `SPEC-HA-TANG-UI-IF`): {id,label vi/en,icon,key,aliases,when,group,surfaces,run} ·
   parser `when` nhỏ không eval · `cmdsFor(ctx)` · dock=disabled giữ chỗ, menu/palette=ẩn · test selector + parser ·
   gom `lib/cad/commands.ts` + `command-aliases.ts`, không mất lệnh nào (đếm trước/sau).
4. Schema matId+PBR theo `SPEC-VAT-LIEU-PBR-IF` §1+§4: mở rộng `lib/cad/materials.ts` (thêm cột không phá cũ) ·
   `lib/materials/export-vray.ts` + `export-d5.ts` thuần hàm + test theo bảng dịch · ATLAS map PBR suy từ Danh mục (ghi rõ suy đoán).
5. Kiểm khuyết CAD `SPEC-LENH-VE-IF` §4: grep từng mục ①-⑩ ghi có/chưa vào báo cáo → làm phần LIB của
   ① eyedropper thuộc tính và ② VCB gõ-số-sau (nhận `3x` `/3`) — UI để CHINH/G4 nối.
6. LIB tiếp `SPEC-LENH-VE-IF` §4: ③ đường gióng thước dây (guide store + snap) · ⑥ chia đều N dọc path — thuần lib + test.
7. Nối `lib/boq/from-project` vào Doc thật của FlowCanvas (cầu glue thuần, UI để G4).
8. 🔴 Bug 2.1.6.d Nhập DWG treo vĩnh viễn (STATUS ghi, chưa ai động): tái hiện bằng file mẫu →
   tìm vòng lặp trong `lib/cad/dwg-worker.ts`/`dwg.ts` → fix + timeout guard + test. Bug đỏ lâu nhất repo.

### G4 — 🔴 ƯU TIÊN SÁNG 04/08 (Hoà chốt trực tiếp, làm TRƯỚC mọi việc cũ)
0a. MỘT THƯ VIỆN Ở CHẶNG 2: panel "Thư viện khối" sidebar là DUY NHẤT · sheet chỉ mở từ nút đáy
    (kho lớn/nạp/publish), KHÔNG tự bung · XOÁ banner "Công cụ đầy đủ..." · tab Vật liệu Command3DPanel
    = browse tại chỗ kiểu D5 + nút "Xem cả kho" mở sheet.
0b. QUẢ CẦU LÀM LẠI theo công thức nghiên cứu V-Ray/D5 (BAO-CAO-DEM mục sáng 04/08 có đủ số):
    NeutralToneMapping (CẤM ACES) · PMREM RoomEnvironment 0.04, intensity 1.1, xoay panel sáng
    lên góc trên-trái · NỀN XÁM #606060/radial (CẤM trắng) · checker xám cho vật liệu trong suốt ·
    bóng tiếp đất đĩa gradient 2.2× cầu op .35-.5 bake 1 lần · camera fov 30, (0,0.9,5), cầu 75-80%
    khung · sphere 64×32, render 2× thu nhỏ · scene Vải đang MÉO ellipse — bỏ bóp hình học ·
    terrazzo ra Ô TRỐNG — kiểm hàng đợi/cache. NGHIỆM THU: Sơn trắng ngà vs Đá Calacatta phải
    nhìn KHÁC NHAU rõ trên nền xám.

### G4 (làm hết thì lấy tiếp 4-5)
1a. 🔥 GẤP (đêm 04/08, xem BAO-CAO-DEM mục 23:1x): sửa 5 lỗi UI chặng Render — toolbar bút chỉ hiện khi active · canvas trống zoom 100% không fitView · banner 'Còn công cụ khác' đổi khuôn mách-nước-có-nút hoặc bỏ · empty state có chỉ dẫn + NÚT · minimap ẩn khi trống, attribution React Flow đặt gọn đúng license.
0b. (gói kính, 2 phút) library-sheet-css.ts:70 badge blur(10px) SỐ CỨNG → var(--blur) hoặc BỎ kính trên badge (kính là gia vị, badge nhỏ không cần) · cân nhắc dùng class .mat-sheet chung của globals thay vì định nghĩa lại cục bộ (nợ kỹ thuật, không gấp).
1. Quả cầu vật liệu `SPEC-VAT-LIEU-PBR-IF` §2 **+ §3b MATERIAL EDITOR** (Hoà chốt 04/08: quả cầu phải EDIT được — panel chỉnh D5-style, sphere live re-render, per-map adjust, sửa vật liệu chung tự nhân bản thành bản dự án): `components/three/MaterialSphere.tsx` — three.js sphere +
   RoomEnvironment PMREM DÙNG CHUNG + cache PNG theo hash(params) · 3 cảnh Cầu/Sàn/Vải tự chọn theo danh mục ·
   lưới 25% chi tiết 100% · gắn vào Thư viện sheet (mode Vẽ 3D) + tab Vật liệu CommandPanel.
2. (chờ CHINH merge xong) Verify Vẽ 3D sống trên main: CommandPanel/Viewport3D/ObjectProperties render trong AppShell
   cả 2 theme, đo DOM, bàn phím. Lệch thì sửa trong vùng mình.
3. Mood+Collab G2 TRỌN GÓI (lệnh Hoà 04/08: ship thẳng, sai đâu sửa đó): lib/collab/ (presence store · share roles Viewer/Commenter/Editor · comment anchor) + UI dựng LUÔN theo ticket G2 + SPEC-HOVER + token thật. Mock COWORK-UI về sau = tài liệu đối chiếu để polish, KHÔNG phải cổng chặn.

4. Port `docs/mocks/mock-present-chooser.html` thành màn chọn 5 loại hồ sơ (H4) — trong AppShell, đúng token, 2 theme. GỘP #3 tách-lối-vào-AI theo phiếu PHIEU-PRESENT-G4 của COWORK-TRÌNH (TỔNG duyệt đêm 04/08).
5. Empty state toàn app theo `SPEC-NGON-NGU-CHI-DAN` khuôn "trống" (luôn có NÚT): canvas 3 chặng · /files · Thư viện · Trình bày.

### COWORK-NC (bơm đêm 04/08 — đợt 2, xếp theo độ kẹt thật)
6. **NC-6 · Quyền Lark Wiki/Base** (GỠ KẸT 131006 — ưu tiên 1): cơ chế permission app Lark — scope wiki:readonly
   vs bitable read · vì sao PHẢI publish version mới scope mới ăn · share wiki space cho app (lớp quyền riêng) ·
   tenant access token vs user token · mã lỗi 131006/99991672 nghĩa gì. ĐẦU RA: checklist từng-nút-bấm trong
   Developer Console để Hoà làm 1 lần là xong, có ảnh/đường dẫn menu. Nguồn: open.larksuite.com docs + cộng đồng.
7. **NC-7 · PM app cho studio nhỏ** (nuôi ArchiNote v1): Lark Base Gantt/Kanban làm được gì/không được gì ·
   pattern Linear/Asana/Notion cho studio 5-15 người · sổ tay tài nguyên (resource handbook) app nào làm hay.
   ĐẦU RA: "Điều ArchiNote nên làm" ≤15 mục có căn cứ.

### COWORK-UI (bơm đêm 04/08)
0. ƯU TIÊN NHANH: chốt giá trị 6 token `--snap-*`/`--axis-*` (theo SPEC-VE-INFERENCE §2 của COWORK-VẼ) vào `SPEC-DESIGN-SYSTEM-IF` — đủ 2 theme, đối chiếu bảng màu inference SketchUp (xanh lá endpoint · lam midpoint · đỏ trục X...) nhưng phải hoà với accent tím của IF, tránh trùng màu trạng thái --success/--warning. Code đang dùng var() có fallback nên không ai chờ — nhưng chốt sớm tránh nợ.

### COWORK-UI (nối hàng đợi — bơm 04/08 đêm)
6. **Mock Vitals nâng cấp** (Hoà nhắc đêm 04/08): theo `SPEC-APPLE-MOTION-MATERIAL` §4b (Siri iOS 27 làm khuôn
   — glow viền màn, orb thở, vào/ra bằng ramp) + `SPEC-APP-SHELL-CHUNG` §4 (Vitals thường trực ở Status bar,
   bung thành panel chat). Đủ 2 theme, port được. Đây là LINH HỒN app — làm kỹ như làm avatar.

### COWORK-TRÌNH (bơm đêm 04/08 — không chờ NC nữa)
1. Viết `docs/PHIEU-PRESENT-G4.md`: gom 7 mục sống thành phiếu code chi tiết cho G4 (đặc tả từng mục + nghiệm thu + thứ tự; #3 đánh dấu GỘP-H4). Chính bạn vừa rà nên viết rẻ nhất.
2. Verify 3 mục 🟡 bằng ĐỌC CODE (picker ≤2 click · export bake · ảnh Hoà khoanh): kết luận được thì kết luận, cần browser thật thì ghi thành mục nghiệm thu trong phiếu G4.
3. Viết `SPEC-TRINH-MATERIAL-A3.md`: editor Bảng vật liệu A3 (loại hồ sơ #2) — lưới ô, nhãn (tên·mã·giá·NCC từ 8 cột ATLAS đã biết), khổ in A3, nguồn matId. KHÔNG cần chờ NC.
4. ✅ MỞ KHOÁ (NC-2 timeline + NC-3 spreadsheet ĐÃ VỀ, xem docs/nc/): làm việc 1 SPEC-TRINH-BOQ-EDITOR (đọc NC-spreadsheet-nhung trước) rồi việc 2 SPEC-TRINH-VIDEO-EDITOR (đọc NC-timeline-editor trước). Ăn cả NC-xuat-pdf-in cho phần khổ in/dpi.

### COWORK-VẼ (bơm đêm 04/08 — đợt 2)
4. **SPEC-VE-LAYOUT-PAPER.md** — lấp LỖ THỦNG LỚN NHẤT của mode Chuyên (SPEC-CAD-MODES §4 tự ghi:
   "Pro hiện KHÔNG có Layout/Paper Space — mà đó chính là thứ định nghĩa Pro"): paper space vs model space ·
   khung tên + tỉ lệ viewport · in PDF đúng khổ (đọc docs/nc/NC-xuat-pdf-in trước) · đối chiếu CadSheets.tsx
   hiện có (đã là tab bản vẽ — thiếu gì để thành layout in được?). Theo §0b: nghĩ như hoạ viên nộp hồ sơ.

5. **SPEC-VE-SKETCH-TOUCH.md** (§0c mảng 3 — đừng để desktop-first nuốt mất tablet): radial menu quanh ngón
   (giữ lâu hiện) · cử chỉ 2 ngón zoom/pan + 2 chạm undo + 3 chạm redo · palm rejection + nhận bút (lực/nghiêng) ·
   vẽ tay tự nắn thẳng · snap dung sai lớn — nền có sẵn SPEC-CAD-MODES §3 + NC-onboarding; đối chiếu
   CadTouchDock.tsx + foldable.css đã có trong code. Theo §0b: nghĩ như KTS cầm iPad ngoài công trường.

### ARCHINOTE (repo ttt-tasks)
1. ⛔ chờ Hoà chạy khối copy 9 spec (`LENH-PHIEN-2026-08-03.md` §4). Có docs/ rồi thì: duyệt 3 câu như khối cũ, làm 1+2, báo cáo.

## §0 · LUẬT TRUNG THỰC (Hoà đặt 04/08 — đứng trên mọi luật khác)
Mọi phiên, mọi vai — **kể cả COWORK-TỔNG, không ngoại lệ**: báo đúng sự thật kể cả khi xấu. Số là số đo được, không phải số đẹp.
Chưa verify thì ghi "chưa verify", không claim xong. Sai thì ghi nhận sai + nguyên nhân + cách sửa
— không giấu, không tô hồng, không đổ lỗi vòng vo. Verdict audit không nể nang.
Tiền lệ phải nhớ: khối commit "THANH CONG" dương tính giả (03/08) · giao trùng việc 3D-2 đã xong ·
STATUS.md ghi sai "chưa bắt đầu". Cả ba đều do TIN CHỮ mà không KIỂM — kiểm bằng lệnh, rồi mới nói.

## §0b · LUẬT NGHIÊN CỨU TRƯỚC KHI QUYẾT (Hoà đặt 04/08 — áp cho MỌI đề xuất & quyết định)
Áp cho MỌI Claude trong hệ — Cowork lẫn Code, kể cả TỔNG. Trước khi đề xuất hay quyết bất kỳ điều gì chạm giao diện/tính năng, PHẢI qua 3 bước:
1. **SEARCH** — grep/git kiểm hiện trạng code + đọc spec/00-CHOT liên quan (điều đã chốt là luật).
2. **NGHIÊN CỨU** — tra cách app đầu ngành giải bài này (đúng chuẩn 5 bài đã có: doc chính hãng
   + than phiền cộng đồng + số liệu, KHÔNG marketing). Đã có bài trong docs/nc/ hoặc spec thì đọc lại,
   chưa có thì làm/đặt COWORK-NC.
3. **NGHĨ NHƯ NGƯỜI DÙNG THẬT** — dân thiết kế · graphic · kiến trúc sư · kỹ sư · nội thất:
   muscle memory họ mang theo (AutoCAD gõ lệnh · SketchUp push-pull · Photoshop layer · Figma frame),
   họ làm việc bằng chuột+phím tắt cả ngày, mắt nghề soi từng px, ghét học lại từ đầu, cần số chính xác
   mm/m²/₫. Câu hỏi bắt buộc trước khi chốt: *"một designer 10 năm nghề mở màn này lên có thấy QUEN
   TAY và CHUYÊN NGHIỆP không, hay thấy đồ chơi?"*
Đề xuất không đủ 3 bước → audit đánh 🔴 trả về làm lại. Tiền lệ: rail "lèo tèo" rồi lại "rối rắm"
(03/08) — cả hai lần đều do thiếu bước 2-3 trước khi dựng.

## §0d · LUẬT GIỮ CÁI ĐANG TỐT (Hoà đặt 01:xx 04/08 sau khi BÁC bản Navigator list-chữ)
**Đồng nhất hoá KHÔNG được làm nghèo tiện dụng.** "Ổ cố định, ruột thay đổi" nghĩa là ruột được phép
GIÀU theo chặng (card icon, mô tả, badge) — không phải ép mọi ruột thành danh sách chữ giống nhau.
Cái đang tốt (Hoà đã duyệt/quen tay) = nền để BUILD LÊN, không phải thứ để thay bằng bản "sạch hơn".
Nguyên văn Hoà: "chỉ cần build từ đó lên... mình nhận không ra app luôn." Đập-làm-lại phần đang dùng được
= 🔴 tự động, bất kể lý do kiến trúc. Đây là lần 2 (lần 1: rail lèo tèo→rối rắm). Không có lần 3.

## §0c · BA MẢNG KHÔNG ĐƯỢC BỎ SÓT (Hoà đặt 04/08 — audit A7 bắt buộc)
Mọi màn/tính năng mới PHẢI nghiệm thu đủ 3 mảng, thiếu 1 = 🔴 chưa xong:
1. **PHÍM TẮT** — mọi lệnh có phím theo sổ lệnh + bảng `SPEC-PANEL-ROLLOUT-IDF` §4; tooltip hiện phím;
   `:focus-visible` đi được bằng Tab; ⌘K palette tìm ra lệnh.
2. **LỆNH TƯƠNG TÁC** — gõ lệnh (L·PL·REC·ROOM...) + gõ-số-SAU-thao-tác (`3x` `/3`) + inference
   theo `SPEC-VE-INFERENCE`; status bar luôn mách lệnh đang chờ gì.
3. **UI CẢM ỨNG** — token `--tap 44/--row 44` tự bật qua `(hover:none) and (pointer:coarse)`;
   CẤM chức năng chỉ-hover/chỉ-chuột-phải (phải có đường chạm: bấm giữ, nút hiện sẵn — SPEC-HOVER §3.7);
   Sketch mode tablet theo `SPEC-CAD-MODES` §3 (bút · palm rejection · cử chỉ · radial menu) là hạng mục SỐNG,
   không phải "để sau".

## §4a · UỶ QUYỀN ĐÊM 03→04/08 (Hoà chốt trước khi ngủ)
COWORK-TỔNG được **quyết thay Hoà** trong đêm với điều kiện Hoà đặt (nguyên văn): *"trước khi quyết định
nhớ search kỹ, đọc sổ luật"* — tức mỗi quyết định phải (a) grep/git kiểm hiện trạng, (b) đối chiếu
`00-CHOT` + spec liên quan, (c) ghi lý do vào `BAO-CAO-DEM-2026-08-04.md`.
**Không được quyết dù có uỷ quyền:** chuyện tiền (mua avatar, thuê, credit) · xoá dữ liệu/file người dùng ·
lật quyết định Hoà đã đích thân chốt (chỉ được treo + ghi câu hỏi cho sáng mai).

## §4 · LUẬT THAY PHIÊN (mọi phiên, mọi vai)
1. Mở phiên: đọc `SO-KIEM-TONG.md` → `00-CHOT.md` → `BAO-CAO-<mảng>.md` của mình. 3 file, đúng thứ tự.
2. Trước khi làm gì: `git log --all --oneline -- <path>` — việc có thể đã xong (bài học 3D-2 giao trùng 03/08).
3. Chỉ sửa trong mảng §2. Buộc phải chạm mảng khác → DỪNG, ghi vào báo cáo.
4. Chốt phiên ~85% context: cập nhật `BAO-CAO-<mảng>` + nếu tính năng mới thành hình thì THÊM DÒNG vào §1 sổ này + commit + push.
5. Cowork trực ca: kiểm §1 (chống rớt) trước, việc mới sau. Mỗi ca audit CẬP NHẬT `docs/CHECKLIST-TONG.md` (bản đồ sống Spec→Mock→Code→Audit từng hạng mục) — phiên xong việc tự đổi ô mình, TỔNG đối soát bằng git/grep.

---
*Cowork lập 03/08/2026 theo lệnh Hoà. File này là hợp đồng giữa các phiên — sửa §2 phải qua Hoà.*

---

## §5 · CHECKLIST AUDIT CỦA TỔNG — A1→A8 (vai: KIẾN TRÚC SƯ TRƯỞNG, Hoà dặn 04/08: "thật khó vào")
Áp cho MỌI việc báo xong. Thiếu bước nào audit bước đó, verdict không nể nang (§0).
- **A1 Commit thật** — git log, message khớp việc, diff đúng phạm vi.
- **A2 Test/tsc** — theo log báo cáo + grep chọn lọc số đáng ngờ (đếm lại, không tin chữ).
- **A3 Chống rớt cục bộ** — tính năng vùng đó còn sống (grep/lệnh kiểm §1).
- **A4 Đúng spec bề mặt** — token var(), 2 theme (Tối trước), hover đúng bảng, ngôn ngữ không jargon, §0b đủ 3 bước.
- **A5 Vùng mảng** — git show --stat không lấn §2.
- **A6 Verdict** — ✅ĐẠT / ⚠️ĐẠT-ghi-chú / 🔴SỬA → 🔴 = phiếu sửa bơm đầu hàng đợi phiên đó.
- **A7 Ba mảng §0c** — phím tắt · lệnh tương tác · đường cảm ứng. Thiếu 1 = 🔴.
- **A-NGƯỢC (mỗi ca ≥1 gói):** đối chiếu NGƯỢC spec→code theo `CHECKLIST-TONG` §6 — grep từng luật con, điền cột Audit. Lời dặn/chủ đề của Hoà = cả GÓI việc nhỏ, cấm nén thành 1 dòng rồi quên ruột.
- **A8 LOGIC — soi như kiến trúc sư trưởng phản biện (Hoà đặt 04/08):**
  · Dữ liệu chảy đúng không: matId xuyên chặng còn nguyên? đổi chặng/mode có RỚT dữ liệu? undo được không?
  · Số có ĐÚNG không: BOQ tự cộng lại 1 ca mẫu bằng tay (diện tích × đơn giá × hao hụt), campath đúng số frame,
    credit trừ/hoàn atomic?
  · Edge case: rỗng · 1 phần tử · rất nhiều · tên tiếng Việt có dấu · số 0 · huỷ giữa chừng · mất mạng/API lỗi
    — app nói gì với người dùng lúc đó (khuôn lỗi SPEC-NGON-NGU)?
  · State: reload cứng giữ được gì (bài học hydrate/aiTier trong STATUS) · hai tab cùng mở · quyền share đúng vai?
  · Ngược spec ngữ nghĩa: có vi phạm SEMANTIC-MODEL (thêm lớp nghĩa chưa có nơi tiêu thụ)? có gọi API chéo app (A5.1)?
  · Câu hỏi bắt buộc tự trả lời trước khi ✅: **"Nếu tôi muốn làm nó SAI, tôi bấm gì?"** — thử đúng cái đó.

## §3 · ĐỢT 3 (TỔNG bơm 03/08 ~02:1x — sau merge lớn fbd9cc1/fdc5c0c/c1cf8cd + g4 mới 9fa870b/0569a91)
| Vai | Hàng đợi đợt 3 (làm theo thứ tự) |
|---|---|
| **COWORK-NC** | ① First-run/onboarding app cùng ngành: D5 Render · SketchUp · Enscape (màn đầu, template gallery, sample project) — nuôi Smart Tour v2 + empty-state Vẽ 3D. ② Presence/collab trong Figma/Miro/FigJam (avatar dải, cursor người khác, follow mode, comment thread) — nuôi code G2 của G4. |
| **COWORK-UI** | MỞ KHOÁ việc 3 cũ: mock 2 editor Trình bày theo spec ĐÃ CÓ — ① BOQ editor theo SPEC-TRINH-BOQ-EDITOR (summary-bar, 6 kiểu cột, badge sửa-tay) ② Video editor theo SPEC-TRINH-VIDEO-EDITOR (shot có tên, 3 tầng, timeline collapsed). Chuẩn hợp đồng như cũ + vùng tạm ghi PLACEHOLDER. ③ Cập nhật README-mocks. (Deck·A3·Văn bản: chưa dựng.) |
| **COWORK-VẼ** | Rà khớp 4 spec VẼ (INFERENCE·REVIT·LAYOUT·SKETCH) × lib/commands/registry.ts (97 alias vừa merge): bảng lệnh nào thiếu alias/surface/tham số → phiếu bổ sung registry cho PHU. Việc 3 cũ (10 khuyết) vẫn chờ PHU gap-check. |
| **COWORK-DỰNG** | MỞ PHIÊN LẦN ĐẦU — hàng đợi gốc trong HAM-DOI-COWORK §VAI 5: ① SPEC-DUNG-NODE-PORT (cổng có kiểu, Turn-into) ② SPEC-DUNG-CAMERA (NC-1 ĐÃ VỀ — hết chờ; ăn CamPathResult lib/cad/campath.ts, tầm mắt 1650) ③ bản đồ pipeline render AI (prompt đi đâu, ảnh về đâu, credit trừ đâu). |
| **COWORK-TRÌNH** | ① Spec loại hồ sơ thứ 5: "Văn bản/biểu mẫu" (đơn giá, hợp đồng, thuyết minh — present-editor docType mới, khổ A4, biến dự án tự điền) — đủ 5/5. ② Nếu PHU đã thẩm định 4 điểm (mini-DSL·SUM()·beat·MP4): nâng 2 spec BOQ/Video thành phiếu code. |

## §3 · ĐỢT 4 (03/08 — sau khi Hoà chốt tên chặng/BIM nội thất/3D thống nhất)
**Đọc `docs/CHOT-TEN-CHANG-MODE-2026-08-03.md` TRƯỚC KHI LÀM.**
| Vai | Việc |
|---|---|
| **COWORK-NC** | **NC-11 (🔴 ưu tiên 1):** ① QĐ 258/QĐ-TTg + văn bản hướng dẫn: mốc thời gian nào bắt buộc BIM cho loại công trình nào, hồ sơ nộp gồm gì, có bắt buộc định dạng IFC không (kiểm tận nguồn thuvienphapluat/baochinhphu, KHÔNG tin bài blog). ② IFC 4.3 lớp cho NỘI THẤT: IfcFurniture/Type · IfcCovering/Type · IfcSpace · IfcMaterialLayerSet · Pset nào chứa hãng/mã/giá. ③ Thư viện JS đọc-ghi IFC (IfcOpenShell-wasm · web-ifc · that-open) — dung lượng, giấy phép, có ghi được không hay chỉ đọc. ④ Bảng ánh xạ đề xuất: entity IF hiện có (`model.ts` elementType/wallKind + matId PBR) ↔ lớp IFC. |
| **COWORK-DỰNG** | **`SPEC-DUNG-3D-THONG-NHAT.md` (🔴):** một giao diện 3D duy nhất, KHÔNG mode con — theo bảng chắt điểm sáng §5 của file CHỐT. Phải trả lời: bộ công cụ tối thiểu là gì · push/pull + gizmo + nhập số sống chung ra sao · chọn-theo-ngữ-nghĩa lấy dữ liệu từ đâu · nút sang render AI đặt chỗ nào · §0c ba mảng (phím tắt · lệnh · chạm). Kèm đính chính đầu `SPEC-CHANG2-UI-2MODE` (tên "2MODE" nay sai). |
| **COWORK-VẼ** | Bổ sung `SPEC-VE-REVIT-MODE` §mới **trọng tâm NỘI THẤT**: tủ bếp · trần · sàn lát · lớp hoàn thiện là hạng mục chính; tường/cửa là vỏ chứa. Append, KHÔNG đập bản cũ (§0d). |
| **COWORK-UI** | Sau khi NC-11 về: rà nhãn 3 chặng + 2 chế độ trong toàn bộ mock, ra danh sách file cần sửa chữ. |
| **COWORK-TRÌNH** | Giữ hàng đợi cũ (nâng 2 spec BOQ/Video thành phiếu code khi PHU thẩm định xong). |

## §3 · ĐỢT 5 (03/08 — sau khi Hoà chốt bộ tên vòng cuối)
**BẮT BUỘC đọc `docs/CHOT-TEN-CHANG-MODE-2026-08-03.md` mục "VÒNG CUỐI" trước khi làm.**
| Vai | Việc |
|---|---|
| **CHINH** | Đổi NHÃN HIỂN THỊ theo bộ tên mới: `StageSwitcher.tsx:49-51` · `VitalsGesture.tsx:50` · `AppCommandPalette.tsx:128-129` · `ReferencePane.tsx:84` · grep toàn repo `Rendering|Presenting|Dựng ảnh|CAD ·` ở nhãn UI. **TUYỆT ĐỐI KHÔNG đổi khoá kỹ thuật** `sketch/pro/revit` · `concept/render/present` (vỡ persist người dùng). Nhãn dài: "2D Kỹ thuật/3D Thiết kế/Trình bày"; header hẹp: "2D/3D/Trình bày". |
| **COWORK-UI** | Thêm mục "BỘ TÊN CHÍNH THỨC" vào `SPEC-NGON-NGU-CHI-DAN` (khoá lại, phiên sau không đặt vòng 5) + rà nhãn trong toàn bộ `docs/mocks/`, ra danh sách file cần sửa chữ. |
| **COWORK-DỰNG** | 🔴 **Việc quan trọng nhất hiện nay: `SPEC-TANG-DU-LIEU-CAU-KIEN.md`** — tầng dữ liệu cấu kiện dùng chung 3 chặng (một Doc, ba ống kính). Phải trả lời: entity nào mang ngữ nghĩa · chặng 2D render nó thành gì · chặng 3D render nó thành gì · sửa bên này bên kia đổi theo bằng cơ chế nào (**KHÔNG đồng bộ 2 chiều — chỉ một bản, đọc lúc vẽ**) · cái gì CHỈ sống ở 1 chặng (ký hiệu 2D, ánh sáng 3D) · neo vào `model.ts` elementType/wallKind/storey + matId PBR (`892c927`). Đây là spec nền cho `SPEC-DUNG-3D-THONG-NHAT`. |
| **COWORK-VẼ** | Bổ sung `SPEC-VE-REVIT-MODE` phần trọng tâm NỘI THẤT (tủ bếp·trần·sàn lát·lớp hoàn thiện là chính; tường/cửa là vỏ chứa). Append, không đập (§0d). |
| **COWORK-NC** | NC-11 IFC/QĐ 258 (giữ nguyên đợt 4). |
