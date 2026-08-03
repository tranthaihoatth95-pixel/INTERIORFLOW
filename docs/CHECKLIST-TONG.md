# CHECKLIST TỔNG — BẢN ĐỒ SỐNG CỦA APP
**Lập:** 04/08/2026 đêm, theo lệnh Hoà "lập bảng checklist để không sót" · **Ai cập nhật:** phiên nào xong việc thì đổi ô của mình + ca audit TỔNG đối soát lại bằng git/grep.
**Ký hiệu:** ✅ xong (đã audit) · 🔵 xong chưa audit · 🔨 đang làm · 📋 có spec/mock chờ code · ⬜ chưa có gì · ⛔ chặn
**Cột:** Spec → Mock → Code → Audit (đủ 4 = dòng đó XONG THẬT; A7 phím/lệnh/chạm + A8 logic nằm trong Audit)

## 1 · HẠ TẦNG XUYÊN APP
| Hạng mục | Spec | Mock | Code | Audit | Ghi chú |
|---|---|---|---|---|---|
| AppShell 6 ổ (5 màn) | ✅ | ✅ | 🔵 `9fe8be8 3a92170` | ⬜ | đo DOM 6 ổ 5 màn |
| Menu logo + Navigator + đáy cố định | ✅ | ✅ | 🔵 | ⬜ | |
| Panel thò thụt (rollout·grip·ghim·dải trang) | ✅ PANEL-ROLLOUT | — | 🔵 CHINH-3 `6ce940f` đêm 04/08 | ⬜ | audit ca tới |
| Sổ lệnh registry (1 khai → 6 mặt) | ✅ HA-TANG Trụ 2 | — | 🔵 merged `fdc5c0c` · 56/56 test | ⬜ | ⌘K đa-màn nối rồi (AppCommandPalette 273d, chưa commit) |
| Phím tắt toàn app (B/I/⌘\\/⌘1-3, xử va L bằng ⇧) | ✅ PANEL §4 | — | 🔵 `2649287` | ⚠️ A1✓A3✓ — ⌘K đa-màn ĐÃ dựng (AppCommandPalette.tsx, sống 5 màn) chờ commit+audit | §0c-1 |
| Token mật độ + cảm ứng coarse | ✅ MAT-DO + snap/axis vào DS (11 chỗ, UI q0 xong) | — | 🔵 vào globals | ⬜ | §0c-3 |
| Thư viện = 1 sheet (kệ theo chặng, 4 phạm vi) | ✅ | ✅ | 🔵 `3c8dae6`+`0569a91` (chặng 2: hết banner, nút Xem cả kho) | ⬜ | nút mở ở 5 màn — kiểm |
| File Manager (list/upload/real-fs) | ✅ | ✅ | 🔵 `12223cf` | ⬜ | |
| Settings + wallpaper canvas | ✅ | ✅ | 🔵 | ⬜ | |
| Inspector tự sinh từ schema (subtype) | ✅ HA-TANG Trụ 3 | — | ⬜ G4 sau | ⬜ | |
| **Vitals nâng cấp (khuôn Siri iOS27)** | ✅ APPLE-MOTION §4b + APP-SHELL §4 | ✅ `Vitals v2.dc.html` (Claude Design) | 🔵 VIỆC 1(a)(b)(c) trên `nhanh-g4` (05/08, chưa merge) — icon bỏ gradient TTT · `VitalsStateBadge.tsx` 4 trạng thái (idle/answering nối thật vào `sending`, listening/thinking export sẵn CHƯA có nguồn thật) · gợi ý 2 viên ngang trong popover. ⚠️ Phần "mount 1 nơi + bỏ anchor + popover nền đục" là WIP RIÊNG trên `main` (uncommitted, `VitalsGesture.tsx`/`StatusBar.tsx`/`vitals-ui.ts`/`.vitals-pop`) — KHÔNG đụng ở đây để tránh xung đột kiến trúc, xem kỹ khi merge 2 nhánh | ⬜ verify browser 2 theme (tự làm, chưa qua audit A1-A8 hình thức) | grep `F06020\|002850` trong file Vitals-scoped = 0 |
| Toolbelt ổ ⑤ (gộp CadToolbar/CadTouchDock + fix toolbar tràn đè Inspector) | ✅ HA-TANG Trụ 1 | — | 🔵 `060c419` main (05/08) | ⬜ | đo thật: dock r=1192 < inspector l=1202 ⇒ hết đè; Sketch 2 hàng bo24 · Pro capsule 999 |
| ⌘K palette đa-màn (nâng lên AppShell) | ✅ HA-TANG Trụ 2 (mặt `palette`) | — | 🔵 `AppCommandPalette.tsx` main (05/08) — nối `cmdsFor()` registry, phủ cả 5 màn | ⬜ | palette Home (ReactFlow) giữ nguyên; ↑↓/↵ phải ở document-capture vì CAD nuốt Enter |
| Settings icon-hoá + nút "Đặt lại bố cục panel" | — | — | 🔵 G4 `d143684` nhanh-g4 (05/08) — nút nối resetAllRolloutLayouts, verify xoá khoá thật; kèm icon-hoá ObjectProperties (chấm+chip+xích đứt, CHƯA mount chờ CHINH cắm) | ⬜ | hàng "Đổ bóng" spec chưa có trong code |
| Collab G2 (presence·mời·sticky·share) | ✅ ticket G2 | 🔵 mock-mood-collab-g2 | ⬜ G4 q3 | ⬜ | tính năng Hoà sợ mất |
| Đăng nhập/Gallery/Notebook/Journey/Tour | — | — | ✅ cũ | — | giữ sống §1 |
| Auto-backup + Recovery modal | — | — | ✅ cũ | — | thêm vào §1 chống rớt (04/08) |
| Empty states toàn app (khuôn "trống" có NÚT) | ✅ NGON-NGU | — | ⬜ G4 q5 | ⬜ | Hoà chê banner mơ hồ |
| Rà jargon toàn app (từ điển NGON-NGU) | ✅ | — | — | 🔨 ca audit A4 quét grep | "Master Library" từng lộ |
| Smart Tour v2 (ăn NC-onboarding) | 🔵 NC-4 về | ⬜ | ✅ v1 cũ | ⬜ | sáng phân chủ |
| Bộ tên chính thức 2D Kỹ thuật/3D Thiết kế/Trình bày — đổi NHÃN hiển thị khắp app | ✅ CHOT-TEN vòng cuối | — | 🔵 `lib/phases.ts` (nguồn gốc) + 20 file UI đồng bộ theo (đợt 5, 05/08) | ⬜ | khoá kỹ thuật GIỮ NGUYÊN; verify browser thật header+palette+tab tooltip đúng nhãn mới |
| Trụ 4 mode registry (`defineMode`/`getMode`, MỘT khuôn) — A3 phiếu ĐỢT6 | ✅ HA-TANG Trụ 4 | — | 🔵 `6b5af10` — 4 mode thật `2d/sketch·2d/pro·3d/node·3d/3d`, xoá bản `ModeDefinition` cũ trùng | ⬜ | verify browser: round-trip Node↔Vẽ3D + Sketch↔Pro không crash; `if(mode===)` duy nhất (HomeScreen ModeShell) đã thay bằng `requireMode()` |

## 2 · CHẶNG VẼ (CAD) — 3 mode
| Hạng mục | Spec | Mock | Code | Audit | Ghi chú |
|---|---|---|---|---|---|
| Nền 2D: L·PL·REC·C·ROOM·dim·hatch·block 46·DXF/DWG | ✅ | ✅ | ✅ cũ | — | |
| Inference + VCB gõ-số-sau (`3x` `/3`) | 🔵 VE-INFERENCE | — | ⬜ PHU q5 | ⬜ | §0c-2 |
| 10 khuyết AutoCAD ①-⑩ (eyedropper, guide...) | ✅ LENH-VE §4 | — | ⬜ PHU q5-6 | ⬜ | |
| Mode Phác thảo (tablet: bút·cử chỉ·radial) | 🔵 VE-SKETCH-TOUCH 112d | — | ⬜ | ⬜ | §0c-3 — đừng bỏ đói |
| Mode Chuyên: Layout/Paper + in PDF | 🔵 VE-LAYOUT-PAPER 91d | — | ⬜ | ⬜ | lỗ thủng lớn nhất |
| Mode Revit (tường·cửa hosted·room·type/instance) | 🔵 VE-REVIT-MODE | 🔵 mock-cad-revit | ⬜ | ⬜ | |
| Layer State + lớp/nét | ✅ | ✅ | ✅ | — | |
| BOQ groundwork (đo bóc hình học) | ✅ | — | ✅ `80b0c96` | — | |
| 🔴 Bug Nhập DWG treo vĩnh viễn (2.1.6.d) | — | — | ⬜ PHU q8 (bơm 04/08) | ⬜ | bug đỏ STATUS chưa ai động |
| findHatchBoundary treo >2' mật độ cao | — | — | ⬜ TECH-DEBT | — | né được, chưa chặn |
| Port mock-2d-ky-thuat.html: Lớp hoàn thiện · Bắt điểm status bar · Chọn hết cùng loại | ✅ PHIEU-DOT6 NHÓM B | ✅ mock-2d-ky-thuat (audit A4 ĐẠT) | 🔵 `bc2654c` | ⬜ | Bắt điểm+đếm "chọn hết cùng loại" là dữ liệu THẬT; Lớp hoàn thiện + nút chọn = disabled kèm lý do (data model 2-mặt chưa chốt · chờ Đ3/P3-G4, KHÔNG phải "chờ A4" — A4 đã xong) |

## 3 · CHẶNG DỰNG ẢNH — 2 mode
| Hạng mục | Spec | Mock | Code | Audit | Ghi chú |
|---|---|---|---|---|---|
| Node graph + sidebar 3 vùng | ✅ CHANG2 | ✅ | ✅ cũ | — | Navigator RỖNG sau merge = 🔥 CHINH 1b |
| 5 lỗi UI Render (toolbar nổi·zoom 15%·banner·empty·minimap) | — | — | 🔨 G4 1a | ⬜ | BAO-CAO-DEM 23:1x |
| Navigator Render = NodeLibraryPanel nguyên bản | — | — | ✅ `739960c` đảo + `efa434c` dọn địa tầng (1 cột · Trên bảng · zoom 100% · hết banner) | ✅ **Hoà nghiệm thu MẮT 04/08** + vật chứng grep | gốc zoom 15% = node rác, đã ghi |
| Cổng nối có kiểu + Turn-into | 🔵 SPEC-DUNG-NODE-PORT 18KB | — | ⬜ | ⬜ | DỰNG phiên đầu 03/08 |
| Mode Vẽ 3D (CommandPanel·Viewport·ObjProps) | ✅ | ✅ | ✅ **A2 quyết 05/08** (`adb8d67`·`4518bd6` nhanh-g4): `CommandPanel.tsx`+`ObjectProperties.tsx` (592 dòng mồ côi, KHÔNG mount) ĐÃ XOÁ — `Command3DPanel.tsx` (data ATLAS thật) thay thế, khoá tab đổi `tao/sua/vatlieu/camera/hien` theo spec M3 | ✅ verify browser 2 theme, wiring dựng-tường vẫn sống sau đổi khoá | lý do chọn: `useMaterials()` thật vs `materialsIn()` tĩnh 10 item — xem BAO-CAO-G4 |
| Cây đối tượng theo TẦNG + panel thuộc tính + nút "Dựng ảnh" (tab Hiện) | ✅ SPEC-DUNG-3D-THONG-NHAT §5+§6+§7 | 🔵 mock-3d-thong-nhat | ✅ `adb8d67`·`4518bd6` nhanh-g4 — `docToObjScene` đọc storey/specId thật (D1) · cây gom bucket + gán hàng loạt ghi Doc thật · ẩn/hiện lọc thật · chọn tường → gizmo thật (tái dùng selectedId có sẵn) · nút Dựng ảnh gạt mode thật | ✅ verify browser 2 theme (05/08): bucket chuyển GF thật, gizmo hiện thật, ẩn/hiện thật, đổi mode thật | nội thất/cửa sổ CHƯA chọn được (thiếu entityId trong group — cố ý, xem cảnh báo cad-to-obj.ts) |
| Mở màn Vẽ 3D (sân khấu luôn hiện + 3 bước + nút dựng tại chỗ) | — | — | 🔵 G4 tối 04/08 | ⚠️ verify DOM của G4; chờ mắt Hoà | |
| Card chào "Bắt đầu dựng không gian" tắt được (✕/Esc/nhớ) | — | — | 🔵 (grep welcome_hidden+Escape wt) | ⬜ | bug Hoà báo, G4 sửa |
| Toolbar bút neo mép CANVAS (đang đè panel) + minimap ẩn khi trống | — | — | ⬜ G4 | ⬜ | ảnh Hoà 04/08 |
| 🔴 Bug camera 1-khối lệch tâm (nghi cy → −cy trong controls.target) | — | — | ⬜ PHU quyết (đụng engine campath/capture) | ⬜ | G4 phát hiện, ghi comment Scene3DViewer.tsx |
| 2 lỗi type nhanh-phu (chặn merge BOQ vào main) | — | — | ⬜ PHU GẤP | ⬜ | chi tiết trong BAO-CAO-CHINH |
| Quả cầu vật liệu (PMREM, 3 cảnh) | ✅ VAT-LIEU §2 | 🔵 mock-material-sphere | 🔵 G4 `9fa870b` ĐÃ merge main — §2c ĐỦ công thức; thủ phạm vụ "12/12 ngừng render" = RÒ WEBGL CONTEXT qua HMR (3 nghi can công thức đều vô tội, cô lập từng biến); chốt chống tái phát: rig găm globalThis | ⬜ | nghiệm thu đo pixel: đá hotspot 254 vs sơn matte 241 + ấm 17 điểm; kính có checker |
| **Material Editor chỉnh được** (D5-style + sphere live + per-map + publish) | ✅ VAT-LIEU §3b (04/08) | ⬜ UI q7 | ⬜ G4 q1 | ⬜ | Hoà chốt: edit như V-Ray/D5 |
| matId PBR schema + export V-Ray/D5 | ✅ VAT-LIEU §1§4 | — | 🔵 merged `c1cf8cd` · 87/87 test | ⬜ | moat |
| ATLAS↔Lark sync 1449 | ✅ | — | ⛔ 131006 | ⬜ | 🔵 NC-lark-permission 55d SẴN SÀNG — Hoà bấm Console theo checklist sáng |
| Camera/campath UI + capture | 🔵 SPEC-DUNG-CAMERA 17.7KB | — | lib ✅ `d7dff63 57ed9b8` | ⬜ | spec DỰNG q2 |
| Mood+Collab canvas (bút·frame phòng·swatch matId) | ✅ ticket G2 | 🔵 | ⬜ | ⬜ | |

## 4 · CHẶNG TRÌNH BÀY — 5 hồ sơ
| Hạng mục | Spec | Mock | Code | Audit | Ghi chú |
|---|---|---|---|---|---|
| Màn chọn 5 loại hồ sơ (H4, gộp #3 AI) | ✅ phiếu TRÌNH | — BỎ mock (file không tồn tại, UI báo 04/08) → code thẳng PHIEU-PRESENT-G4 | ⬜ G4 q4 | ⬜ | |
| 5 lỗi UI Trình bày (L1 đơn vị Hồ sơ/slide · L2 bullet lặp+tràn · L3 tương phản thumbnail · L4 toolbar popover · L5 Inspector cuộn) | ✅ PHIEU-TRINH-LOI-UI-2026-08-03 | — | ✅ `174c1b7`·`e5421f3`·`0f60cc9`·`6a05a8b`·`06a502d` nhanh-g4 | ✅ verify browser 05/08, cả 2 theme — L2 đo rect 0px chồng, L5 đo computed style bóng-cuộn | |
| Deck editor (E-sprint P1-P5 + P6a) | ✅ | ✅ | ✅ | — | 7 mục sống → PHIEU-PRESENT-G4 |
| 7 mục sống Present (photo-editor 4 tầng...) | ✅ PHIEU-PRESENT-G4 | — | ⬜ G4 sau | ⬜ | |
| Bảng vật liệu A3 | ✅ SPEC-TRINH-MATERIAL-A3 (git b2f4400) | — | ⬜ | ⬜ | |
| BOQ editor (spreadsheet) | ✅ SPEC-TRINH-BOQ-EDITOR (git b2f4400) | — | lib ✅ ĐÃ VÀO MAIN `892c927` (19 file/2992 dòng: cache·compute·from-project·xlsx + route API) | ⬜ | ✅ hết ⛔ — editor UI là việc kế |
| Văn bản song ngữ editor (hồ sơ thứ 5) | ⬜ TRÌNH q5 (bơm 04/08) | ⬜ UI q3 | ⬜ | ⬜ | hư cấu 100% — luật trung tính |
| Video editor (timeline CapCut) | 🔵 SPEC-TRINH-VIDEO-EDITOR 67d | — | capture ✅ | ⬜ | không viết engine |
| Xuất PDF/in đúng khổ | 🔵 NC-xuat-pdf | — | print-upscale ✅ `8b7e282` | ⬜ | |

## 5 · NGOÀI APP
| Hạng mục | Trạng thái | Ghi chú |
|---|---|---|
| ArchiNote chuyển repo ttt-tasks | ✅ `45795f7` — 10 file, 1414 dòng vào ttt-tasks/docs (Hoà chạy đêm 04/08) | còn: mở phiên ARCHINOTE dán khối duyệt 3 câu |
| ArchiNote v1 (sổ tay + PM) | 🔨 NC-7 đang nghiên cứu | mock Home 4 khu: UI sau Vitals |
| Lark Console (scope+publish+share wiki) | ⛔ việc tay Hoà | NC-6 ra checklist từng nút |
| Video intro Google Flow | ⛔ Hoà có credit | prompt đã soạn |
| Avatar 3D | 🔨 **lựa chọn 4: Claude Design 3D-object** (Hoà phát hiện 04/08 — chi phí 0đ, xuất HTML/handoff Claude Code, khớp stack three.js sẵn có) — prompt đã soạn, Hoà chạy trong app | mua/thuê/Blender lùi thành dự phòng |
| Dọn public/detech 22MB | ⛔ Hoà chạy lệnh đã soạn | |
| `knowledge/ttt-design-system` vi phạm trung tính | ⛔ Hoà quyết (STATUS "Chờ USER" từ trước) | nhắc sáng |

## 6 · GÓI CHI TIẾT ĐÃ CHỐT — audit ĐỐI CHIẾU NGƯỢC spec→code (Hoà nhắc 04/08: "mỗi chủ đề = 1 đống việc nhỏ đã chốt")
Mỗi ca audit TỔNG chọn ≥1 gói, grep code đối chiếu TỪNG luật con, điền cột. Chưa quét = coi như CHƯA áp, không đoán.

| Gói (spec nguồn · số mục con đếm được) | Quét gì trong code | Audit |
|---|---|---|
| **Kính lỏng** (~41 mục + K1-K4) | đã quét 02:xx đêm 04/08 | ⚠️ ĐẠT-ghi-chú: 7 nghi phạm → 4 comment lành · 1 ngoại lệ CÓ PHÉP (vpover viewport tối cố định, đã duyệt) · 1 vi phạm nhỏ (badge blur(10px) SỐ CỨNG — phiếu G4) · 1 nợ kỹ thuật (.mat-sheet định nghĩa lại cục bộ, đúng token nhưng nên dùng class chung) |
| **Apple DS** (`DESIGN-SYSTEM-IF` ~45: §2c chống ngô nghê · §2d bo đồng tâm · §5 xuyên sản phẩm) | grep border-radius số cứng ≠ var(--radius-*) · bo trong = bo ngoài − đệm · hex lạ ngoài token · chữ ngoài thang fs | ⬜ |
| **Chuyển động** (`APPLE-MOTION`: 3 spring preset · số ms cụ thể · ramp) | transition ngoài --dur-*/--ease-apple · popover thiếu ramp · hover-out ngắn hơn hover-in | ⬜ |
| **Hover/focus** (`HOVER-FOCUS` ~24: bảng 9 loại × 3 trạng thái + 8 luật) | scale trên hàng list/nút toolbar = vi phạm · thiếu :focus-visible · tablet bị giấu sau hover | ⬜ |
| **Ngôn ngữ** (~29 mục) | đã quét 06:00 04/08 | ✅ ĐẠT — 0 jargon lộ UI-string (3 hit đều là comment) |
| **Panel** (`PANEL-ROLLOUT` ~59: rollout·grip·ghim·dải trang·phím) | sau khi CHINH q3 xong — đối chiếu từng luật §2 | ⬜ |
| **Mật độ + cảm ứng** (`MAT-DO` + §0c-3) | số cứng thay vì var(--tap/--row) · chức năng chỉ-hover | ⬜ |

### 6b · COLLAB CHẶNG 2 — trải chi tiết ĐÃ CHỐT (`CHANG2-UI-2MODE` §3 — không được nén thành 1 dòng)
| Việc con đã chốt | Code | Audit |
|---|---|---|
| Toolbar bút tablet: Bút·Marker·Highlight·Tẩy + chọn/sticky/chữ/hình/ảnh/comment — nút to, palm-rejection | ⬜ G4 | ⬜ |
| Presence: nhóm online (màu, chấm xanh) · offline (xám) · nút mời (+) | ⬜ G4 | ⬜ |
| Share roles: Viewer·Commenter·Editor (collab-share, KHÁC phân quyền đã bỏ) | ⬜ G4 | ⬜ |
| Sticky · comment @mention · reaction/vote — NEO vào từng object | ⬜ G4 | ⬜ |
| Frame theo PHÒNG (khách/bếp/master) | ⬜ G4 | ⬜ |
| Swatch vật liệu mang matId (hãng·mã·giá/m²) — kéo vào mang DỮ LIỆU | ⬜ G4 | ⬜ |
| Mindmap = template kéo từ kệ (6 form lập luận), canvas trống mặc định | ⬜ G4 | ⬜ |
| Live-link: gu/palette board chốt → bơm thẳng vào Render | ⬜ G4 | ⬜ |

## 7 · BỔ SUNG 03/08 02:2x (đợt "xong hết rồi")
| Hạng mục | Spec | Mock | Code | Audit | Ghi chú |
|---|---|---|---|---|---|
| Toolbelt ổ ⑤ (gộp CadToolbar+CadTouchDock) | ✅ HA-TANG | ✅ v5 | 🔵 `060c419` main | ⬜ | hết bug toolbar đè Inspector — kiểm mắt |
| Palette ⌘K đa-màn (5 màn, không ReactFlow) | ✅ PANEL §4 | — | ✅ `dd3f584` merged main — sống 5 màn | ⬜ | file mới, không đụng CommandPalette cũ (§0d) |
| Camera cy→−cy (phán quyết PHU) | — | — | ✅ `e142f3c` merged main | ⬜ | campath/capture xác nhận không vỡ |
| Eyedropper ① + VCB ② (lõi lib) | ✅ LENH-VE §4 | — | 🔵 `892c927` ĐÃ vào main, 32/32 test — CHƯA có UI | ⬜ | UI để CHINH/G4 nối |
| Gap-check 10 khuyết ①-⑩ | ✅ | — | kết quả: 8/10 chưa có · ⑥ có · ⑤ dạng khác (CommentPin) | ✅ PHU grep | mở khoá COWORK-VẼ việc 3 |
| Icon-hoá ObjectProperties + Settings (bàn giao CHINH-5) | ✅ | — | 🔵 `1d727a7` ĐÃ vào main | ⬜ | |

## 8 · SẢN PHẨM COWORK ĐỢT 3 (03/08 02:2x–02:4x — chưa vào git, các vai đang viết)
| Sản phẩm | Vai | Ghi chú |
|---|---|---|
| SPEC-DUNG-NODE-PORT.md · SPEC-DUNG-CAMERA.md · SPEC-DUNG-PIPELINE-RENDER-AI.md | DỰNG | **phiên đầu tiên — hàng đợi gốc 3/3 xong** |
| NC-firstrun-cung-nganh · NC-presence-collab · NC-conflict-simultaneous-edit | NC | bài 3 tự mở rộng (nuôi Collab G2) — 10 bài NC |
| mock-trinh-boq · mock-trinh-video | UI | mở khoá việc 3 cũ |
| PHIEU-REGISTRY-VE · PHIEU-VE-REGISTRY-BOSUNG | VẼ | rà 4 spec × 97 alias |
| SPEC-TRINH-VANBAN-EDITOR `091734e` | TRÌNH | ✅ đã git — đủ 5/5 loại hồ sơ |

## 9 · TẦNG DỮ LIỆU CẤU KIỆN (đợt 5 — nền của cả app)
| Hạng mục | Spec | Mock | Code | Audit | Ghi chú |
|---|---|---|---|---|---|
| Tầng dữ liệu chung 3 ống kính | ✅ SPEC-TANG-DU-LIEU-CAU-KIEN 396d | — | ⬜ | ✅ **TỔNG verify code 03/08** | 7 luật L1-L7 kiểm được bằng grep |
| 🔴 BUG sơn SOLID bị đùn thành tường 2.7m | ✅ §0.3 | — | ✅ PHU vá `cad-to-obj.ts` | ✅ verify tay UI thật (cổng 3001) + verify hàm `docToObjScene` — trước vá `Wall_5` cao 2.7m, sau vá hết | test 46/46 (8 mới) — xem `BAO-CAO-PHU.md` mục "VIỆC 1+2" |
| Ống kính 3D đọc `elementType` (nay ĐOÁN lại) | ✅ §2.3 thang ưu tiên | — | ✅ (phạm vi hẹp: lọc tường) | ✅ `elementType==='wall'` thắng, `null` loại, `undefined` mới suy đoán layer + gắn `inferred` | CHƯA làm `inferElementType()` đầy đủ (nhánh `specId`/block) — vẫn ⬜, để P1 |
| `entityId` cho MỌI nhóm 3D (nay chỉ tường) | ✅ §0.4 | — | ✅ PHU (Furn_i/Window_i) | ✅ test `cad-to-obj.test.ts`+`obj-scene-to-geometry.test.ts` (60/60) | Floor/Room_i CỐ Ý còn trống (không có entity nguồn, xem §0.5) — chờ §6 RoomEntity. Tiện thể vá thêm regression `Scene3DViewer.tsx:201` (mode massing từng làm biến mất nội thất) |
| Entity `room` (phòng có id bền) | ✅ §6 | — | ⬜ | ✅ §0.5 xác nhận 3 dạng rời | nơi BIM nội thất phải sống |
| `elementType:'covering'` (IfcCovering) | 🔨 chờ NC-11 | — | ⬜ | — | KHÔNG code trước |

## 10 · AUDIT BACKEND (`docs/AUDIT-BACKEND-2026-08-03.md`) — 3 lỗ 🔴 ưu tiên 1
| Hạng mục | Ở đâu | Code | Test | Ghi chú |
|---|---|---|---|---|
| R1 — refund tự nạp credit vô hạn | `credits/route.ts:30-34` §5.1 | ✅ | ✅ `lib/server/credits.test.ts` 12/12 | Tách logic sang `refundCreditsForJobRef()` (đối chiếu jobRef+trần theo số đã trừ+1 lần/jobRef) — route chỉ gọi hàm |
| R2 — `/api/jobs` không kiểm/trừ credit | `jobs/route.ts:7-55` §5.2 | ✅ | ✅ `tiers.test.ts` 20/20 + `credits.test.ts` 14/14 + curl thật (402 + spend/refund) | `spendCredits`/`refundCredits` mẫu `render/premium`; bỏ trừ trùng ở `execution.ts` (double-charge); bảng giá `TASK_CREDIT_COST` — 3 task (`removeBg`/`materialSwap`/`segment`) từng MIỄN PHÍ khi gọi nội bộ (idmask/localedit/smartselect) nay tính phí luôn — **cần Hoà chốt**, xem `lib/ai/tiers.ts` |
| R3 — upload không whitelist MIME → XSS lưu trữ | `library/route.ts:63-73`+`library/[id]/file/route.ts:16` §6.2 | ✅ | ✅ `mime-sniff.test.ts` 22/22 + curl thật (HTML giả PNG/PDF bị chặn cả 2 route) | Whitelist đọc MAGIC BYTES (`lib/server/mime-sniff.ts`, mới) — áp cho `library` (chỉ ảnh) VÀ `notebook` (ảnh+PDF, PDF vẫn `inline` vì browser sandbox riêng, khác HTML/SVG) |

## 10 · MÀN CLAUDE DESIGN 03/08 — MOCK vs CODE THẬT (TỔNG kiểm 08:5x, đo bằng lệnh)
**Cách đọc:** "code thật" = đã có `page.tsx`/component chạy được trong app. Mock KHÔNG phải để dựng mới — là để **NÂNG CẤP** cái đang có (§0d cấm đập).
| Màn | Mock (byte) | Code thật | Đã port? | Việc |
|---|---|---|---|---|
| **Tệp** | 80 471 ✅ sạch nhất (649 `var(--)`, khung 6 ổ đủ 4 trạng thái) | `app/files/page.tsx` 39d | ⬜ | 🟡 nâng cấp — mock DÙNG ĐƯỢC |
| **Bảng nút** | 54 766 ✅ (465 `var(--)`) | `components/FlowCanvas.tsx` | ⬜ | 🟡 nâng cấp — mock DÙNG ĐƯỢC |
| **Thư viện** | 56 624 ⚠️ cụt đuôi d543 + thiếu `<script>`, 51 hex ngoài `:root` | `app/library/page.tsx` 33d | ⬜ | 🔴 sửa mock trước · **+ gói MỘT-THƯ-VIỆN chặng 3D (Hoà chê "3 thư viện vô duyên")** |
| **Nút tổng** | 60 488 ⚠️ G2 nặng nhất, 19 lần hardcode 44px, thiếu khung 6 ổ | ❌ **CHƯA CÓ CODE** | ⬜ | 🔴 màn DUY NHẤT phải dựng MỚI |
| **Dự án** | 572 🔴 **EXPORT HỎNG** (đứt giữa `--t3:#9e`) | `app/projects/[id]/` | ⬜ | 🔴 Claude Design dựng lại |
| **Cài đặt** | 904 🔴 **EXPORT HỎNG** | `app/settings/page.tsx` 39d | ⬜ | 🔴 dựng lại |
| **Ảnh đại diện** | 3 383 🔴 **EXPORT HỎNG** (rỗng ruột) | `app/settings/avatar/page.tsx` 89d | ⬜ | 🔴 dựng lại |
| **Vitals v2** | 50 707 ✅ | `VitalsGesture.tsx` 381d — popover ĐÃ vá `a065f9f` | 🟡 một phần | 🔴 `VitalsIcon.tsx` **còn 3 hit `#F06020/#002850`** = chỗ DUY NHẤT trong app phá luật màu · 4 trạng thái chưa có |
| 2D Kỹ thuật | 78 534 ✅ | — | ✅ `bc2654c` | Lớp hoàn thiện · Bắt điểm · Chọn hết cùng loại |
| 3D Thiết kế | 72 679 ⚠️ 4 nhãn chặng cũ | — | ⬜ | G4 đang nhận |
| Trình bày | 67 760 ✅ | — | ✅ BOQ `4991340` | live-link + SUM() sống |
**🔴 CHẶN CHUNG:** `docs/mocks/support.js` **KHÔNG TỒN TẠI** nhưng **16 mock gọi** → nút đổi theme chết, 131 hover chết. Mọi mock export Claude Design mới verify 2 theme ở mức khai báo CSS, **chưa ai thấy theme sáng chạy thật**.
**🟡 BẪY PORT:** mock tự sửa token dùng chung (`--mat-card` .82→.62 · `--mat-panel` .68→.78 · `--row` 28→44) · 162 chỗ `font:` rút gọn thiếu `/line-height` → cắt dấu tiếng Việt · 33 lớp nổi <92% nền đặc · 48 hex cứng trùng token.
