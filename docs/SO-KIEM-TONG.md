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
| **Autosave mode "3D Thiết kế"** (bug mất dữ liệu: khoét hốc/push-pull ở 3D, đóng tab mất trắng — CÓ TỪ đợt push-pull 3D-5, phát hiện 03/08 lúc verify NC-12) — nối lại `lib/sheets-persist.ts` (KHÔNG cơ chế lưu thứ hai) qua `useCad3DAutosave()` gọi ở gốc `Render3DModeSkeleton.tsx`; cốt lõi thuần `lib/cad/cad3d-autosave-core.ts` (test bằng sucrase-node, 13 ca, không cần DOM) | `lib/cad/cad3d-autosave-core.ts`·`cad3d-autosave.ts`·`cad-doc-hydration.ts` | ✅ `c6157cb` (03/08 đêm) | `node_modules/.bin/sucrase-node lib/cad/cad3d-autosave-core.test.ts` · verify browser thật: khoét hốc → F5 → hốc còn nguyên (IndexedDB + UI khớp) |
| **Điều còn TREO chờ Hoà** | avatar 3D (mua/thuê/Blender) · Google Flow video intro · quyền Wiki Lark · dọn `public/detech` 22MB | ⏳ | `00-CHOT.md` |
| ⛔ **LUẬT** — CẤM mount CÙNG MỘT panel ở 2 ổ khác nhau. Tiền lệ: `VitalsGesturePanel` từng mount ở CẢ `StageSwitcher.tsx` (ổ ① header) lẫn `StatusBar.tsx` (ổ ⑥), phân biệt bằng cờ `anchor` trong store. Gate `anchor` giữ cho chỉ MỘT panel mở (đo browser xác nhận đúng) nhưng người dùng vẫn thấy HAI lối vào Vitals cùng màn → Hoà báo "có hai Vitals". Một panel = MỘT nơi mount; ổ khác muốn gọi thì `open()` vào store, KHÔNG tự mount bản sao. `anchor` đã xoá khỏi `lib/vitals-ui.ts`. | ✅ 05/08 — Vitals mount duy nhất ở header | `grep -rn "<VitalsGesturePanel" app components` phải ra ĐÚNG 1 dòng |
| ⛔ **LUẬT** — lớp NỔI (popover/menu/panel) phải có NỀN ĐẶC ≥92%, không được chỉ dựa `backdrop-filter`. Tiền lệ: popover Vitals mượn `.lq-card` (kính rất trong, sinh ra cho card đăng nhập nổi trên ẢNH) rồi dùng ở chặng Trình bày — nổi trên toolbar/thumbnail dày chữ nên chữ chồng chữ, không đọc được. Lớp nổi dùng `.vitals-pop` (globals.css): nền `--panel` 96% + blur + `--border-strong` + `--shadow-pop`. Kính là gia vị, đọc được TRƯỚC (`SPEC-APPLE-MOTION-MATERIAL` — iOS 27 đã tự sửa Liquid Glass vì lý do y hệt). | ✅ 05/08 `.vitals-pop` | đo tương phản chữ popover ≥4.5:1 (đo thật: 15.66:1 theme sáng) |
| ⛔ **LUẬT** — CẤM `animate opacity` trên phần tử có `backdrop-filter` (self LẪN mọi tổ tiên) — opacity<1 tự tạo backdrop root cô lập (spec filter-effects-2), kính mất nền thật lúc fade rồi đục ập vào khi opacity chạm 1. Fade thì fade `y`/`scale`/nội dung KHÔNG-backdrop-filter bên trong, không phải chính khối kính hay tổ tiên nó. Đã sửa: P6c K1/K2 present-editor (`BAO-CAO-PHU.md`) + màn đăng nhập `.lq-card` (`LoginForm.tsx` tự thân + tổ tiên `rise()`→`riseNoFade()` trong `LoginScreen.tsx`, `lib/motion.ts`). Còn sót (không sửa vì KHÔNG mount — dead code): `TitleSequence.tsx`/`IntroSequence.tsx` root. | ✅ `lib/motion.ts riseNoFade` | grep `initial={{.*opacity\|animate={{.*opacity` cạnh `backdropFilter`/`.mat-*`/`.lq-card`/`.if-dock` mỗi khi thêm entrance animation mới cho khối kính |
| **A2 quyết (05/08, PHIEU-CODE-IF-DOT6 + SPEC-DUNG-3D-THONG-NHAT)**: 592 dòng mồ côi `components/three/CommandPanel.tsx`+`ObjectProperties.tsx` (dòng 26 ở trên — nay LỖI THỜI, KHÔNG xoá dòng cũ theo luật append-only) ĐÃ XOÁ — chọn (b) giữ `Command3DPanel.tsx` (data ATLAS thật qua `useMaterials()`, wiring dựng tường/push-pull/onboarding thật) thay vì mount bản mồ côi (data tĩnh 10 item, buttons gọi vào bộ điều phối lệnh chưa tồn tại H1). Khoá tab đổi sang tiếng Việt (`tao/sua/vatlieu/camera/hien`) theo spec M3 | `adb8d67`·`4518bd6` trên **nhanh-g4** | 🟡 xong, chờ merge | `git log nhanh-g4 -2` |
| **Cây đối tượng theo TẦNG + panel thuộc tính + nút "Dựng ảnh" nổi** (VIỆC 2, `SPEC-DUNG-3D-THONG-NHAT` §5+§6+§7) — `docToObjScene()` nay đọc `storey`/`specId` thật vào `SceneGroup` (H7 đã vá phần lõi); tab "Hiện" = cây gom theo tầng (bucket "Chưa xếp tầng" kèm nút gán hàng loạt, ghi THẬT vào Doc) + ẩn/hiện lọc THẬT khỏi Viewport3D + chọn tường → gizmo THẬT (tái dùng `Viewport3D.selectedId` có sẵn, không bịa mới); nút "Dựng ảnh" gạt THẬT sang mode node qua `useStageMode`. Nội thất/cửa sổ CHƯA chọn được trong 3D (chưa có entityId trong group — xem cảnh báo trong `cad-to-obj.ts` vì sao KHÔNG được thêm ẩu, sẽ làm BIẾN MẤT khỏi cảnh ở mode massing) | `adb8d67`·`4518bd6` trên **nhanh-g4** | 🟡 xong, verify browser cả 2 theme, chờ merge | mở mode Vẽ 3D tab Hiện, đếm bucket |
| **5 lỗi UI chặng Trình bày** (`PHIEU-TRINH-LOI-UI-2026-08-03.md`, L2→L1→L5→L3→L4) — L2 bullet slide "Triết lý" hết chuỗi cứng lặp 4 lần + tự co chữ chống tràn · L1 "Trang 1/1-5" → "Hồ sơ 1/N slide" (đơn vị đúng) · L5 Inspector thêm bóng-cuộn + `scrollbar-gutter:stable` · L3 thumbnail chưa-mở tự bật bóng chữ sớm (đè ảnh mà màu chưa chốt) · L4 gom 14 nút Sắp xếp vào 1 popover portal | `174c1b7`·`e5421f3`·`0f60cc9`·`6a05a8b`·`06a502d` trên **nhanh-g4** | ✅ verify browser thật cả 5 lỗi, cả 2 theme (05/08) — L2 đo `getBoundingClientRect` 14 khối, 0px chồng lấn | mở Trình bày, slide 4 |
| **VitalsIcon bỏ gradient TTT + 4 trạng thái + gợi ý ngang trong popover** (VIỆC 1, 05/08) — icon nay chỉ `currentColor` (accent tím hệ) · `VitalsStateBadge.tsx` mới: idle/answering nối THẬT vào `sending` của `VitalsGesture.tsx` (listening/thinking export sẵn, CHƯA có nguồn thật — không voice input/không streaming, không bịa nơi gọi) · popover port mock `Vitals v2.dc.html` phần gợi ý nhưng SỬA layout: 2 viên ngang thay vì 4 dòng dọc kiểu điện thoại. ⚠️ CHƯA đụng phần "mount 1 nơi/bỏ anchor/nền đục 96%" — đó là WIP RIÊNG đang chạy trên `main` (uncommitted, cùng file `VitalsGesture.tsx`/`StatusBar.tsx`/`vitals-ui.ts`), cố tình tránh để khỏi đụng độ kiến trúc đang dở, xử lý tay lúc merge | trên **nhanh-g4** (05/08) | 🟡 xong, verify browser cả 2 theme (idle↔answering thật, dark/light), chờ merge — CHƯA audit hình thức | mở Trình bày, ⌘J, gõ hoặc bấm gợi ý |
| **Merge `nhanh-g4`→`main` HOÀN TẤT** (05/08 đêm) — dòng 44/45 ở trên đổi trạng thái: A2 (xoá `CommandPanel.tsx`/`ObjectProperties.tsx` mồ côi, giữ `Command3DPanel.tsx`) và "cây theo tầng + nút Dựng ảnh" đã VÀO `main` thật, không còn "chờ merge" | `f9e77eb` | ✅ `git merge-base --is-ancestor nhanh-g4 main` = true, tsc 0 lỗi, đã push | `git log --oneline -3` |
| **MỘT THƯ VIỆN chặng 3D — xoá nốt chỗ thứ 3** (`PHIEU-CODE-IF-DOT6`, 05/08 đêm) — sau merge trên, Hoà chụp màn bắt được vật liệu vẫn hiện Ở BA CHỖ ở mode Vẽ 3D: sidebar trái (Navigator = `NodeLibraryPanel`, kệ Vật liệu ATLAS riêng — dùng CHUNG cho cả 2 sub-mode `3d/node`/`3d/3d`, nợ kiến trúc VIỆC A3 tự ghi) · panel giữa (`Command3DPanel` tab Vật liệu) · sheet Thư viện. Sửa: `Command3DPanel` bỏ hẳn tab "Hiện" (4 tab còn Tạo/Sửa/Vật liệu/Camera) · cây đối tượng theo tầng dời sang `Object3DTree.tsx` (Navigator ổ ②, THAY `NodeLibraryPanel` chỉ khi mode `3d/3d`) · panel thuộc tính (kích thước/vật liệu quả cầu/tầng) dời sang `Object3DInspector.tsx` (Inspector ổ ④, AppShell tự ẩn khung khi chưa chọn — đúng `sc-if coChon` của mock) · state ẩn/hiện+đang chọn chuyển sang store `lib/render-studio/tree3d-ui.ts` (Navigator/Inspector là ổ SIBLING, không chung cây React cha để truyền props) · `HomeScreen.tsx` navigator nay đọc THẬT `requireMode(...).navigator` theo sub-mode (trước hardcode 1 tham chiếu cho cả 2 mode, dù registry đã khai đúng). | `48eab0e` | ✅ tsc sạch · verify browser thật `127.0.0.1:3001` dự án mẫu: mở Vẽ 3D thấy ĐÚNG 1 cây (không còn mục Vật liệu ở sidebar) · chọn Tường 1 → Inspector hiện đúng + gizmo thật · chọn nội thất → Inspector hiện đúng, tự nói thật "chưa chọn được trong 3D" · "Đổi vật liệu"/"Xem cả kho" cùng mở 1 sheet Thư viện | mở mode Vẽ 3D, đếm đúng 1 chỗ nói vật liệu |
| ⚠️ **PHÁT HIỆN PHỤ (chưa sửa, đã spawn task riêng cho PHU)** — merge `nhanh-g4`→`main` ở trên chọn NGUYÊN bản `nhanh-g4` cho `lib/three/cad-to-obj.ts` (không gán `entityId` cho Furn/Window), bỏ qua đúng cảnh báo `BAO-CAO-G4.md` mục "Bẫy #1" (main từng có `1c0b91d` thêm `isMassingWallGroup()` để AN TOÀN gán entityId cho MỌI nhóm — hàm đó vẫn sống trong `obj-scene-to-geometry.ts`/`Scene3DViewer.tsx` sau merge, nhưng `cad-to-obj.ts` không tận dụng). Hậu quả đo được: `node_modules/.bin/sucrase-node lib/three/cad-to-obj.test.ts` = **53 pass, 2 fail** (2 test kỳ vọng entityId cho nội thất/cửa sổ). Việc thuộc mảng PHU (`lib/three/*`), KHÔNG sửa trong phiên G4 này. | — | 🔴 2 test đỏ | `node_modules/.bin/sucrase-node lib/three/cad-to-obj.test.ts` |
| **NÚT TỔNG — gom nhiều node thành 1 công cụ dùng lại được** (mảng node/flow, `docs/mocks/mock-if-nut-tong.html`, 4 trạng thái đủ: chọn→pill nổi · dialog đặt tên+chọn tham số lộ ra ngoài · mặt nút tổng thu gọn chỉ hiện tham số đã chọn+nút Chạy · mở ra khung ĐẶC không kính lồng kính+nút Thu gọn) — node con VẪN LÀ node thật trong `nodes[]`/`edges[]` phẳng (không di chuyển), thu gọn chỉ `hidden:true` (tái dùng cơ chế `toggleGroupCollapse` có sẵn cho group ⌘G thường, KHÔNG viết engine ẩn/hiện mới) nên mở/thu KHÔNG mất dữ liệu · Chạy nút tổng gọi lại `runNode()` có sẵn cho các node cuối nhánh trong nhóm (`terminalNodeIds()`, `lib/nodes/macro.ts`) — không viết engine thực thi mới · kèm kệ "Nút tổng của tôi" (danh sách/số lần dùng/chia sẻ cho studio). Bug thật bắt được lúc verify: `addGroup` không tự ẩn node con khi group tạo SẴN ở trạng thái collapsed — đã sửa. Giới hạn đã khai thật: chấm cổng biên trên mặt thu gọn chỉ trang trí (chưa kéo-nối được, phải mở ra mới nối lại) · kệ "của tôi" mới liệt kê trong 1 flow, chưa phải kho cá nhân xuyên dự án · "Chia sẻ studio" mới là cờ hiển thị, chưa có hạ tầng phân phối thật. | `1b1febf` | ✅ tsc sạch · 14 test mới `macro.test.ts` (dùng `lookupDef` tiêm phụ thuộc, không đụng `registry.ts` — file đó dùng `@/...` khiến bộ test độc lập của repo không chạy được) · verify browser thật `127.0.0.1:3001`: gom 3 node thật (input.image→ai.upscale→out.gallery) chạy đúng cả chuỗi (aiTier=1, 1 asset lưu Gallery) · mở ra/thu gọn giữ nguyên Scale/Tên asset/trạng thái chạy · share toggle đúng | mở node canvas, chọn ≥2 node, "Gom thành nút tổng" |

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

## §6 · LUẬT RÚT TỪ THỰC CHIẾN 03/08 — áp cho MỌI phiên, kể cả COWORK-TỔNG
Mỗi luật kèm ca bệnh thật đã xảy ra, để phiên sau hiểu vì sao chứ không chỉ tuân.

### §6a · TIỀN VÀ QUYỀN — ba luật không được phá
| # | Luật | Ca bệnh |
|---|---|---|
| T1 | **Kế toán tiền phải ở SERVER.** Client chỉ được HIỂN THỊ số dư, không được là nơi quyết định trừ. | `/api/jobs` chặn ẩn danh/tier nhưng **0 dòng đụng credit** — kế toán nằm ở `lib/execution.ts` (client). Gọi thẳng route = đốt tiền provider, credit không giảm |
| T2 | **Không tin số tiền client gửi.** Mọi thao tác cộng tiền phải đối chiếu sổ cái + chống hoàn 2 lần + chạy trong giao dịch nguyên tử. | `credits/route.ts` cũ cộng thẳng `amount` từ body → tự nạp triệu credit. Đã vá `7b6e4e6` |
| T3 | **Không tin loại tệp client khai.** Whitelist MIME phía server bằng magic bytes; trả `nosniff` + `attachment` cho mọi thứ không phải ảnh. | upload thư viện nhận `mime` client tự khai, tải về trả đúng loại đó → XSS lưu trữ chạy trên origin app |

### §6b · GIAO DIỆN — bốn luật từ bốn lỗi Hoà bắt được bằng mắt
| # | Luật | Ca bệnh |
|---|---|---|
| G1 | **CẤM `animate opacity` trên phần tử có `backdrop-filter`** (và trên mọi tổ tiên của nó). Muốn fade thì fade lớp cha KHÔNG có kính, hoặc fade nội dung bên trong. | card đăng nhập "vào 1 giây rồi mới đục" — opacity<1 tạo backdrop root cô lập, kính mất nền thật trong lúc fade. Đã vá `b0f4f06`, cùng bệnh P6c present-editor |
| G2 | **Lớp nổi phải có NỀN ĐẶC ≥92%**, kính chỉ là lớp phụ. Chữ đạt 4.5:1 với nền CỦA CHÍNH NÓ, không phải nền trang. | popover Vitals trong suốt, chữ chồng lên toolbar. Vá bằng class riêng `.vitals-pop` — **phân loại kính theo cái nằm SAU nó**, không dùng chung một class |
| G3 | **Cấm mount cùng một panel ở hai ổ khác nhau.** | `VitalsGesturePanel` mount ở cả `StatusBar` lẫn `StageSwitcher` → hai Vitals trên màn. Loại lỗi đọc từng file đều thấy đúng, chạy lên mới lộ |
| G4 | **Mọi `text-[Npx]` phải kèm `leading-`.** Chữ Việt có dấu chồng cần line-height ≥1.5; cú pháp arbitrary của Tailwind chỉ đặt cỡ chữ, line-height thừa kế từ cha → cắt dấu. | banner phiên đăng nhập bị cắt ngang chữ |
| G5 | **z-index phải có thang khai báo**, không rải số tuỳ hứng. | banner `z-60` trùng đúng `zIndex 60` của VitalsGesture — ai đè ai tuỳ thứ tự DOM |

### §6c · NGHIỆM THU — cấm nói "xong" khi chưa đo
| # | Luật |
|---|---|
| N1 | **Báo cáo của phiên KHÔNG phải bằng chứng.** TỔNG audit phải mở code đọc tận dòng, hoặc chạy test/grep. Đã bắt được: "spec ghi đã có SUM()" (thật ra số chết) · "sửa 3 lỗ" (thật ra 1/3). |
| N2 | **Đếm bằng grep, đừng đếm bằng trí nhớ.** `grep -c` trước khi khẳng định "đã gán cho mọi nhóm". |
| N3 | **Vá thì phải VERIFY TAY trước.** Không tái hiện được lỗi thì DỪNG, báo lại — đừng vá mù. |
| N4 | **Làm đủ chỉ tiêu ≠ làm đúng.** Chỗ nào chưa có dữ liệu nguồn thì ghi lý do tại chỗ, đừng gán bừa cho đủ (mẫu tốt: `cad-to-obj.ts:396` giải thích vì sao Floor không có entityId). |

### §6d · KIẾN TRÚC — ranh giới đã chốt
| # | Luật |
|---|---|
| K1 | **Ba chặng là ba ỐNG KÍNH soi vào một nguồn, không phải ba kho.** Cấm mọi hàm `syncXtoY` giữa các chặng. |
| K2 | **IF = máy PHÁT (máy tính) · ArchiNote = máy THU (điện thoại).** Cơ chế cảm ứng chỉ HỌC chéo, không bê nguyên: IF cảm ứng để vẽ CHÍNH XÁC, ArchiNote để ghi NHANH. |
| K3 | **Bento chỉ cho màn tổng quan.** Màn làm việc (2D·3D·bảng nút·ảnh 360·ghi chú) vùng vẽ phải liền một khối — bento chia đều sự chú ý, còn lúc vẽ thì không muốn chia gì cả. |
| K4 | **Cấm icon hoá nút quyết định** (Xoá · Gửi khách · Xuất hồ sơ). Icon cho việc lặp hằng ngày; chữ cho việc bấm sai là trả giá. |
| K5 | **Kéo thả không bao giờ là đường DUY NHẤT** — luôn có nút bấm tương đương (công trường tay bẩn, găng tay, màn ướt). |

## §7 · PHIẾU ĐỢT 7 NHÓM C, VIỆC C1 (03/08 đêm) — đối chiếu cơ chế Revit: 2D đã có? 3D đã có?
Đọc `docs/SPEC-VE-REVIT-MODE.md` (toàn văn, gồm phụ lục trọng tâm nội thất) + `lib/cad/model.ts`
(field thật trên `Base`, grep xác nhận) + `lib/three/cad-to-obj.ts` (dựng 3D thật). Bảng dưới là
**HIỆN TRẠNG CODE 03/08**, không phải đề xuất — mọi dòng của `SPEC-VE-REVIT-MODE` §0-§8/§A1-§A6 là
**ĐỀ XUẤT chưa code** trừ khi bảng ghi rõ file:dòng. ✅ đủ · 🟡 một phần · ⬜ chưa có.

| Cơ chế Revit | Chặng 2D đã có? | Chặng 3D đã có? |
|---|---|---|
| **Location line tường** (tim/mặt trái/mặt phải; đổi bề dày thì tim ĐỨNG YÊN) | ⬜ CHƯA — `wallChain()`/`wallSegment()` sinh hatch+polyline rồi VỨT tim ngay (đúng như `SPEC-VE-REVIT-MODE.md` §1 mục "Thiếu thật" tự ghi); grep `WallRun`/`locationLine` trong `model.ts` = 0 kết quả | ⬜ CHƯA — `docToObjScene` chỉ đùn thẳng `h.points` (poché đã vẽ) theo `heightMm`, không có khái niệm tim để tham chiếu |
| **Cửa/cửa sổ HOSTED** (con của đúng 1 tường, đục lỗ thật, chết theo khi xoá tường) | ⬜ CHƯA — cửa/cửa sổ là `BlockEntity` ký hiệu rời, không có liên kết dữ liệu tới tường chủ; xoá tường không kéo theo xoá cửa | 🟡 MỘT PHẦN — `ops[]`/`buildOpCutters` (NC-12, `27d8c6d`, `lib/three/cad-to-obj.ts` gọi trong vòng lặp `wallHatches`) đã có boolean CSG cắt hốc THẬT vào khối tường qua nút tay "Khoét hốc" (`Object3DInspector.tsx`) — nhưng là thao tác CHUNG, chưa gắn ngữ nghĩa "đây là cửa/cửa sổ"; cửa sổ hôm nay dựng bằng khối kính proxy ĐỨNG CHỒNG lên tường (`cad-to-obj.ts:575` `Window_i` = `box4`), KHÔNG khoét lỗ; cửa hoàn toàn chưa có hình 3D nào |
| **Type vs Instance** (đổi 1 Type → mọi bản sao đổi theo; instance override thắng) | ⬜ CHƯA — không có `WallType`/catalog nào tồn tại; `wallKind`·`wallThicknessMm`·`heightMm` nằm thẳng trên TỪNG entity — 100% instance, không có "1 chỗ đổi cả dự án đổi" | ⬜ CHƯA — 3D chỉ đọc lại đúng field instance đó (`h.heightMm`), không biết type là gì |
| **Tham số cấu kiện** (bề dày/cao độ/vật liệu lõi-hoàn thiện có cấu trúc) | 🟡 MỘT PHẦN — `Base` đã có `elementType`·`wallKind`·`wallStructural`·`wallThicknessMm`·`heightMm`·`specId` (`model.ts:160-193`) đủ cho tường ĐƠN GIẢN; cấu kiện kiểu CỤM (tủ bếp `CabinetRun`, trần nhiều cấp) mới là ĐỀ XUẤT ở phụ lục §A5/§A6, chưa có dòng code nào | 🟡 MỘT PHẦN — `Base.ops?: BuildOp[]` (`extrude`/`boolean`/`arrayLinear`, `27d8c6d` — phiên song song đêm nay) là bước tham số hoá 3D ĐẦU TIÊN, đọc lại đúng Doc chứ không lưu mesh — nhưng mới 3 phép, chưa có khái niệm "cấu kiện" bậc cụm nhiều khối con |
| **Level/tầng** (object Level thật mang cao độ + thứ tự, cấu kiện gán vào Level) | 🟡 MỘT PHẦN — `Base.storey?: string` (`model.ts:162`) CHỈ LÀ NHÃN chuỗi tự do, không phải object Level mang cao độ; gán tay hoặc nút "Gán tầng trệt" (`Object3DTree.tsx`) | 🟡 MỘT PHẦN — nhóm cảnh theo `storey` thật (mọi `builder.object(...)` trong `cad-to-obj.ts` đều kèm `storey: h.storey`/`b.storey`, `Object3DTree.tsx` bucket UI theo đúng field này) — nhưng KHÔNG dựng nhiều tầng chồng cao độ khác nhau, mọi khối vẫn đùn chung từ z=0 |
| **Constraint theo cao độ** (đáy/đỉnh cấu kiện GẮN vào cao độ Level — Level đổi thì cấu kiện đổi theo) | ⬜ CHƯA — `heightMm` là số tuyệt đối gõ/kéo tay trên từng entity, không tham chiếu Level nào | ⬜ CHƯA — cùng lý do; không có Level để constraint vào |

**Kết luận 1 dòng:** chặng 3D mới có "khối trơn + gizmo" (đúng nhận xét của Hoà mở đầu phiếu này) —
6/6 cơ chế Revit cốt lõi đều CHƯA ĐẦY ĐỦ ở cả 2D lẫn 3D; điểm sáng duy nhất mới có đêm nay là
boolean CSG thật (`ops[]`) — hạ tầng ĐÚNG HƯỚNG để sau này gắn ngữ nghĩa "cửa hosted", nhưng chưa
ai nối dây. Việc C2 (nhóm nút "Cấu kiện" mờ trong Command3DPanel) bám đúng bảng này để không hứa
suông.

## §7b · Cập nhật dòng "Cửa/cửa sổ HOSTED" (04/08, commit `d57067a`) — nối dây, không xây mới
Dòng `§7` phía trên GIỮ NGUYÊN (append-only, đúng hiện trạng 03/08 đêm). Trạng thái MỚI sau
`d57067a` (`feat(3d): cửa/cửa sổ HOSTED...`):

| Cơ chế Revit | Chặng 2D | Chặng 3D |
|---|---|---|
| **Cửa/cửa sổ HOSTED** | ✅ ĐỦ — `BlockEntity.hostId?: string` (`model.ts`) suy tự động qua `lib/cad/hosting.ts` `syncHostedOpenings()` (điểm đặt nằm trong biên tường, không bắt chọn tay); chạy sau MỌI mutation doc (`store.ts` addEntity/addEntities/updateEntities/deleteSelected/removeIds/removeLayer + `CadSheets.tsx` snapshotFromPersisted/applyIdfSheets); xoá tường → `expandDeleteWithHostedChildren()` kéo theo xoá cửa/cửa sổ con + cutter. 28 test (`hosting.test.ts`) | ✅ ĐỦ cho hình khối cơ bản — cửa sổ hết là khối kính chồng lên tường: sinh `BuildOp boolean subtract` thật vào `ops[]` tường chủ (kích thước từ block, cao độ bệ/đỉnh `OPENING_ELEVATION`), kính chỉ còn tấm lắp vào lỗ. Cửa có khung+cánh (box4 xám, không PBR). `cutterPositionsMm` (`cad-to-obj.ts`) mở rộng nhận cutter polyline XOAY TỰ DO (không chỉ rect trục thẳng) + đọc `elevationMm` làm z0. 7 test (`cad-to-obj.test.ts`). CÒN THIẾU: chưa phân biệt Type/Instance (mỗi block vẫn override riêng, không có catalog chung) — đúng hiện trạng dòng "Type vs Instance" §7 gốc, KHÔNG đổi |

**Nghiệm thu đã làm**: tiêm tường+cửa+cửa sổ qua `window.__cadStore` trên route `/render` (3D
Thiết kế) dự án mẫu → xem 3D thấy lỗ THẬT xuyên tường + cánh cửa nhô khỏi mặt tường (ảnh chụp,
xác nhận trực quan); state-level xác nhận `hostId` đúng + `wall.ops` có đủ 2 op boolean; xoá tường
qua `removeIds()` → `door-1/win-1/opening-door-1/opening-win-1` biến mất theo TRONG STATE lẫn TRÊN
MÀN HÌNH. `npx tsc --noEmit -p .` toàn repo sạch (nhân tiện sửa 1 lỗi tsc có trước —
`components/three/Viewport3D.tsx` `export type {X} from 'Y'` không đưa X vào scope cục bộ, vỡ từ
PHIẾU ĐỢT 7 nhóm B `68c6950`). `npm test`: 1 fail DUY NHẤT là ca đã biết trước đó (nội thất
massing-mode cố tình bỏ `entityId`, không liên quan việc này).

🔴 **SỰ CỐ RÚT KINH NGHIỆM (không phải mất dữ liệu thật)**: lúc nghiệm thu, tôi tiêm doc test bằng
`window.__cadStore.getState().setState({doc: wallDoc, ...})` — GHI ĐÈ TOÀN BỘ `doc.entities` thay
vì chỉ thêm — xoá mất nội dung thật đang có của "Dự án mẫu" (2 `Khối 1` + các entity khác) TRONG
CACHE IndexedDB (`interiorflow-sheets`) của **trình duyệt sandbox Claude Browser dùng để verify**
(đã xác nhận: DB này không có bất kỳ file-handle nào nối đĩa thật — `interiorflow-root`/
`interiorflow-backup` đều rỗng — nên KHÔNG đụng tới `ban-ve.idf` trên đĩa thật của Hoà; persistence
CAD sheet cũng thuần client, không gọi API server nào nên `dev.db`/Prisma không bị ảnh hưởng).
Rủi ro thực tế: nếu ai mở lại "Dự án mẫu" TRONG CHÍNH trình duyệt sandbox này (không phải máy
thật của Hoà) sẽ thấy bản vẽ 1 chỉ còn `cutter-1-b6mb`. **Luật rút ra cho phiên sau**: khi tiêm
doc test qua store để verify, dùng `addEntities()`/`updateEntities()` (cộng thêm), KHÔNG BAO GIỜ
`setState({doc: ...})` ghi đè nguyên `doc` trên route có autosave đang mount — kể cả trên dự án
mẫu.
