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
| Sổ lệnh registry (1 khai → 6 mặt) | ✅ HA-TANG Trụ 2 | — | 🔵 `4eb94c3` feat/so-lenh CHƯA merge · 56/56 test | ⬜ | |
| Phím tắt toàn app (B/I/⌘\\/⌘1-3, xử va L bằng ⇧) | ✅ PANEL §4 | — | 🔵 `2649287` | ⚠️ A1✓A3✓ — ⌘K đa-màn TODO chờ sổ lệnh PHU | §0c-1 |
| Token mật độ + cảm ứng coarse | ✅ MAT-DO + snap/axis vào DS (11 chỗ, UI q0 xong) | — | 🔵 vào globals | ⬜ | §0c-3 |
| Thư viện = 1 sheet (kệ theo chặng, 4 phạm vi) | ✅ | ✅ | 🔵 merge `3c8dae6` | ⬜ | nút mở ở 5 màn — kiểm |
| File Manager (list/upload/real-fs) | ✅ | ✅ | 🔵 `12223cf` | ⬜ | |
| Settings + wallpaper canvas | ✅ | ✅ | 🔵 | ⬜ | |
| Inspector tự sinh từ schema (subtype) | ✅ HA-TANG Trụ 3 | — | ⬜ G4 sau | ⬜ | |
| **Vitals nâng cấp (khuôn Siri iOS27)** | ✅ APPLE-MOTION §4b + APP-SHELL §4 | 🔨 UI q6 (nền cũ vitals-v3/prototype có sẵn) | ⬜ | ⬜ | Hoà nhắc đêm 04/08 |
| Toolbelt ổ ⑤ (gộp CadToolbar/CadTouchDock + fix toolbar tràn đè Inspector) | ✅ HA-TANG Trụ 1 | — | ⬜ CHINH kế | ⬜ | việc lớn kế của CHINH |
| ⌘K palette đa-màn (nâng lên AppShell) | — | — | ⛔ chờ sổ lệnh PHU + ReactFlowProvider đa-màn | ⬜ | TODO ghi trong CHINH-4 |
| Settings icon-hoá + nút "Đặt lại bố cục panel" | — | — | ⬜ G4 (bàn giao CHINH-5, hàm resetAllRolloutLayouts đã export) | ⬜ | |
| Collab G2 (presence·mời·sticky·share) | ✅ ticket G2 | 🔵 mock-mood-collab-g2 | ⬜ G4 q3 | ⬜ | tính năng Hoà sợ mất |
| Đăng nhập/Gallery/Notebook/Journey/Tour | — | — | ✅ cũ | — | giữ sống §1 |
| Auto-backup + Recovery modal | — | — | ✅ cũ | — | thêm vào §1 chống rớt (04/08) |
| Empty states toàn app (khuôn "trống" có NÚT) | ✅ NGON-NGU | — | ⬜ G4 q5 | ⬜ | Hoà chê banner mơ hồ |
| Rà jargon toàn app (từ điển NGON-NGU) | ✅ | — | — | 🔨 ca audit A4 quét grep | "Master Library" từng lộ |
| Smart Tour v2 (ăn NC-onboarding) | 🔵 NC-4 về | ⬜ | ✅ v1 cũ | ⬜ | sáng phân chủ |

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

## 3 · CHẶNG DỰNG ẢNH — 2 mode
| Hạng mục | Spec | Mock | Code | Audit | Ghi chú |
|---|---|---|---|---|---|
| Node graph + sidebar 3 vùng | ✅ CHANG2 | ✅ | ✅ cũ | — | Navigator RỖNG sau merge = 🔥 CHINH 1b |
| 5 lỗi UI Render (toolbar nổi·zoom 15%·banner·empty·minimap) | — | — | 🔨 G4 1a | ⬜ | BAO-CAO-DEM 23:1x |
| Navigator Render = NodeLibraryPanel nguyên bản | — | — | ✅ `739960c` đảo + `efa434c` dọn địa tầng (1 cột · Trên bảng · zoom 100% · hết banner) | ✅ **Hoà nghiệm thu MẮT 04/08** + vật chứng grep | gốc zoom 15% = node rác, đã ghi |
| Cổng nối có kiểu + Turn-into | 🔨 DỰNG q1 | — | ⬜ | ⬜ | |
| Mode Vẽ 3D (CommandPanel·Viewport·ObjProps) | ✅ | ✅ | 🔵 merge rồi | ⬜ | mở màn+card `de82ed7`+`5e2fdd2` NHÁNH g4 CHƯA merge — audit git 01:2x |
| Mở màn Vẽ 3D (sân khấu luôn hiện + 3 bước + nút dựng tại chỗ) | — | — | 🔵 G4 tối 04/08 | ⚠️ verify DOM của G4; chờ mắt Hoà | |
| Card chào "Bắt đầu dựng không gian" tắt được (✕/Esc/nhớ) | — | — | 🔵 (grep welcome_hidden+Escape wt) | ⬜ | bug Hoà báo, G4 sửa |
| Toolbar bút neo mép CANVAS (đang đè panel) + minimap ẩn khi trống | — | — | ⬜ G4 | ⬜ | ảnh Hoà 04/08 |
| 🔴 Bug camera 1-khối lệch tâm (nghi cy → −cy trong controls.target) | — | — | ⬜ PHU quyết (đụng engine campath/capture) | ⬜ | G4 phát hiện, ghi comment Scene3DViewer.tsx |
| 2 lỗi type nhanh-phu (chặn merge BOQ vào main) | — | — | ⬜ PHU GẤP | ⬜ | chi tiết trong BAO-CAO-CHINH |
| Quả cầu vật liệu (PMREM, 3 cảnh) | ✅ VAT-LIEU §2 | 🔵 mock-material-sphere | 🔨 G4 q1 (§2c thử → 12/12 cầu ngừng render → ROLLBACK de82ed7; bản thử scratchpad/material-preview-2c-attempt.ts — kiểm 01:2x) | ⬜ | |
| **Material Editor chỉnh được** (D5-style + sphere live + per-map + publish) | ✅ VAT-LIEU §3b (04/08) | ⬜ UI q7 | ⬜ G4 q1 | ⬜ | Hoà chốt: edit như V-Ray/D5 |
| matId PBR schema + export V-Ray/D5 | ✅ VAT-LIEU §1§4 | — | 🔵 `72023c2` feat/pbr-schema CHƯA merge · 87/87 test | ⬜ | moat |
| ATLAS↔Lark sync 1449 | ✅ | — | ⛔ 131006 | ⬜ | 🔵 NC-lark-permission 55d SẴN SÀNG — Hoà bấm Console theo checklist sáng |
| Camera/campath UI + capture | 🔵 NC-1 về | — | lib ✅ `d7dff63 57ed9b8` | ⬜ | spec DỰNG q2 |
| Mood+Collab canvas (bút·frame phòng·swatch matId) | ✅ ticket G2 | 🔵 | ⬜ | ⬜ | |

## 4 · CHẶNG TRÌNH BÀY — 5 hồ sơ
| Hạng mục | Spec | Mock | Code | Audit | Ghi chú |
|---|---|---|---|---|---|
| Màn chọn 5 loại hồ sơ (H4, gộp #3 AI) | ✅ phiếu TRÌNH | ✅ mock-present-chooser | ⬜ G4 q4 | ⬜ | |
| Deck editor (E-sprint P1-P5 + P6a) | ✅ | ✅ | ✅ | — | 7 mục sống → PHIEU-PRESENT-G4 |
| 7 mục sống Present (photo-editor 4 tầng...) | ✅ PHIEU-PRESENT-G4 | — | ⬜ G4 sau | ⬜ | |
| Bảng vật liệu A3 | 🔵 TRINH-MATERIAL-A3 | — | ⬜ | ⬜ | |
| BOQ editor (spreadsheet) | 🔵 SPEC-TRINH-BOQ-EDITOR 58d | — | lib ✅ `49ebadd` chờ merge | ⬜ | ⛔ mìn nhanh-phu — ca audit #1 |
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
