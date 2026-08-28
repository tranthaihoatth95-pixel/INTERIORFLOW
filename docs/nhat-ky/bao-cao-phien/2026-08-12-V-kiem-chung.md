# BÁO CÁO V — KIỂM CHỨNG ĐỘC LẬP ĐỢT 3 (12/08/2026)

> Theo `docs/HOP-DONG-PHOI-HOP-T.md` §2 bước 7. Đối chiếu 5 báo cáo (N · H · H2 · W · D)
> với sự thật bằng lệnh chạy lại — không tin báo cáo suông. V không sửa file nào ngoài file này.
>
> ⚠️ **Browser KHÔNG kiểm được**: `lsof -iTCP:3000` = không có server sống; phiếu cấm V mở server
> mới → toàn bộ mục nghiệm thu MẮT (card Tổng quan · toast focusEntity · Tool3DBar trên khung nhìn)
> **còn treo**, khớp với dòng frontier "30 xong-MÁY (NỢ NGHIỆM THU MẮT)". Không agent nào khai
> đã kiểm browser — không ai khai man mục này.

## 1 · BẢNG ĐỐI CHIẾU TỪNG AGENT

### N — backup-offsite
| Khẳng định | Kết quả kiểm | |
|---|---|---|
| `scripts/backup-offsite.mjs` + `docs/VAN-HANH-BACKUP.md` + script `backup:offsite` trong package.json | ls + grep: đủ cả 3 | ✅ |
| Dùng `sqlite3 .backup` (không cp) · integrity_check trên BẢN SAO · rsync `--link-dest` · xoay vòng `IF_BACKUP_KEEP` | grep script: đủ 4 cơ chế, đúng dòng khai | ✅ |
| Đích không tồn tại → exit 1 nói rõ, không im lặng | Chạy thật `IF_BACKUP_DIR=/Volumes/KHONG-CO-O-NAY` → `✗ … không tồn tại — ổ chưa gắn?` exit=1 | ✅ |
| 3 lần chạy thật /tmp (hardlink inode, du 226MB, rotation) | Thư mục test đã dọn — không tái lập được, nhưng error-path kiểm lại đúng, cơ chế trong code khớp khai | ❓ chấp nhận |

### H — hinh-hoc-ap-thang
| Khẳng định | Kết quả kiểm | |
|---|---|---|
| `globals.css` có `--r-1..--r-full`, token cũ thành bí danh | grep :68-76: đúng (`--radius-sm: var(--r-2)`…) | ✅ |
| `lib/geometry.ts` MỚI: `RADIUS` + `concentricRadius = max(4, rOuter−pad)` | Có, đúng công thức | ✅ |
| Migrate CadToolbelt (RADIUS.r4/concentricRadius) · library-sheet-css (`var(--r-full)` ×5) · CommandPalette `rounded-[14px]` | grep từng file: khớp | ✅ |
| BulkIngestMode pptx → 'Trình chiếu' | Đúng dòng 26 | ✅ |
| soi-hinh-hoc cuối phiên: **442/994** ngoài thang | Chạy lại NAY: **445/1000** — lệch +3, nhưng truy được nguyên nhân: 3 radius lẻ (12·7·8px) trong `Tool3DBar.tsx` của agent **D** sinh 14:54, SAU lúc H đo. Số của H đúng tại thời điểm đo | ✅ (số H thật) / 🔴 lệch quy cho D — xem mục 2 |
| soi-tu-dien 77 lệch, 100% trong docs/mocks | Chạy lại: 77, grep ngoài docs/mocks = 0 hit | ✅ |
| tsc 0 lỗi | `npx tsc --noEmit` exit 0 | ✅ |

### H2 — home-overview-card
| Khẳng định | Kết quả kiểm | |
|---|---|---|
| `lib/shell/last-stage.ts` + test 5 nhóm | Chạy lại sucrase-node: OK exit 0 | ✅ |
| Điểm ghi duy nhất `pickStage` (stage-nav.ts) ghi cả 2 khoá | grep :44-45: `setLastStage(currentProjectId)` + `(currentFlowId)` | ✅ |
| `ProjectOverviewCard.tsx` MỚI, nối vào ProjectSelect (caption + grid), hover scale 1.02 + lift, `enterAtLastStage` | grep ProjectSelect: import :34, dùng :1206, hover:scale-[1.02] :1677, enterAtLastStage :686 | ✅ |
| 2 lỗi tsc lần-2 là của CadCanvas (agent W đang sửa song song), vùng H2 sạch | tsc NAY = 0 lỗi toàn repo (W đã hoàn tất) — khai đúng và trung thực về ngữ cảnh song song | ✅ |
| Card 2 theme / dòng ẩn khi thiếu profile | ❓ cần browser — chưa kiểm được | ❓ |

### W — focus-entity + tạo-việc (2D + Trình chiếu)
| Khẳng định | Kết quả kiểm | |
|---|---|---|
| `lib/tasks/focus-entity.ts` + test 17 case round-trip | Chạy lại: 17 pass · 0 fail; `FOCUS_ENTITY_PARAM`/`postTaskFromHere` đúng khai | ✅ |
| 4 marker: CadEditor+PresentEditor `focusEntity` · CadCanvas+Inspector `taoViecTuDay` | grep: đủ cả 4 file, đúng vị trí | ✅ |
| 5 test sanity (context 12 · board 34 · scaffolder 23 · commands 70 · dxf-plan 28) | Chạy lại cả 5: pass đúng từng con số | ✅ |
| Toast khi entity không còn / pill "Đã tạo việc" | Code có (marker :288, :3900); hành vi thật ❓ cần browser | ❓ |

### D — tool-state-3d
| Khẳng định | Kết quả kiểm | |
|---|---|---|
| `lib/render-studio/tool3d.ts` + 34 test máy trạng thái | Chạy lại: 34 pass · 0 fail | ✅ |
| `Tool3DBar.tsx` MỚI, mount vào Render3DModeSkeleton; marker focusEntity + taoViecTuDay nhánh 3D | grep: import :39, mount :720, đủ 2 marker | ✅ |
| ToolDock3D: `disabled: true` 12→5 · `CHUA_DUNG_DUOC` = 0 | grep NAY: 5 và 0 — đúng | ✅ |
| tsc 0 · các test lib/three pass | tsc exit 0; spot-check qua tổng tsc + tool3d (không chạy lại đủ 12 file lib/three — các test đó không do D sửa) | ✅ |
| **Tool3DBar theo design system** — báo cáo KHÔNG khai nhưng file mới dùng radius 12/7/8px NGOÀI thang duyệt cùng đợt | grep Tool3DBar: `borderRadius: 12/7/8` — chính là +3 làm soi-hinh-hoc 442→445 | 🔴 LỆCH |

## 2 · BA CON SỐ CỦA ĐỢT (nghĩa vụ V)

| # | Số | Bằng chứng |
|---|---|---|
| ① Số lệch bắt được | **1** | File MỚI `Tool3DBar.tsx` (agent D) dùng 3 radius lẻ 12/7/8px trái thang bo vừa duyệt trong cùng đợt → sổ máy soi-hinh-hoc trôi 442→445. Giảm nhẹ: thang H đang nạp SONG SONG lúc D code, D không thể biết — nhưng luật là luật, file mới phải theo thang. Việc sửa ~3 dòng. |
| ② Thời gian chu kỳ | **14 phút 24 giây** | `git log`: phiếu 74764e3 12/08 14:42:40 → commit cuối c45c709 14:57:04 (5 agent song song, 5 commit b088137→c45c709) |
| ③ Số việc làm lại | **0** | Rà mục CHƯA LÀM của cả 5 báo cáo: toàn nợ MỚI đúng ranh giới phiếu (browser-verify, click-điểm 3D, hotkey registry, lastStage khi F5, radial menu) — không mục nào là làm-lại việc cũ |

Đối chiếu sổ máy cuối đợt: `soi:frontier` = 30 xong-MÁY · 28 chờ · **0 LỆCH** (exit 0) — T đã flip
registry sau audit đúng quy trình; `soi:tu-dien` 77 (100% docs/mocks, vùng COWORK-UI);
`soi:hinh-hoc` 445/1000 (chế độ báo cáo, exit 0).

## 3 · ĐÁNH GIÁ CHẤT LƯỢNG TỪNG AGENT (1 dòng)

- **N** — sạch tuyệt đối: cơ chế đúng nghề (`.backup` không cp, integrity trên bản sao, fail thì dọn bản dở), tự kiểm bằng inode/du thay vì tin log của chính mình.
- **H** — số máy soi dán thật, tự khai rõ vùng cấm bỏ qua, so sánh "táo với táo" (3 mốc cùng thang) là cách báo số gương mẫu.
- **H2** — trung thực nhất đợt: chủ động khai đổi-hành-vi (click card mặc định concept thay vì render) kèm đường lui 1 chữ, và phân định đúng 2 lỗi tsc là của phiên khác.
- **W** — kỹ nhất về hợp đồng: round-trip test khoá 2 đầu cùng một hằng, tái dùng toast/API sẵn có đúng luật một-cỗ-máy, 6 file test chạy lại đều khớp từng con số.
- **D** — nội dung dày nhất (máy trạng thái + 11 nút thật) và khai nợ thẳng, nhưng dính lệch duy nhất của đợt: file UI mới không theo thang bo vừa duyệt (tình tiết giảm nhẹ: song song với H).

## 4 · ĐỊNH HƯỚNG ĐỀ XUẤT CHO ĐỢT KẾ (≤5 gạch)

- **Trả nợ nghiệm thu MẮT tập trung 1 phiên có browser**: 30 entry "xong-MÁY" đang treo — ưu tiên đúng 3 chiều đợt này: card Tổng quan 2 theme · `?focusEntity=` cả 3 chặng (toast khi id chết) · Tool3DBar/dock 11 nút.
- **Sửa 3 radius Tool3DBar** (12→10 hoặc 14 · 7→6 · 8→6/10 theo bảng §3d) — 3 dòng, nên gộp vào phiếu migrate hình-học đợt 2 đã xếp hàng sẵn (LightTab 13 · LoginBackdrop 11 · Command3DPanel 17…).
- **Luật mới cho phiếu song song**: khi một agent đang NẠP chuẩn design (thang bo, token), phiếu của các agent UI cùng đợt phải ghi sẵn chuẩn đó vào ô⑤ RÀNG BUỘC — tránh tái diễn kiểu lệch Tool3DBar.
- **lastStage khi vào bằng URL/F5** (nợ H2): 1 hook đọc route ở StageShell — nhỏ, nên đóng sớm vì card Home giờ hiển thị "Đang dở" cho người dùng thật.
- **Mở API pick-mặt-sàn của Scene3DViewer** (đề xuất D): `onGroundPick(ptCadMm)` để tool vẽ 3D lên nấc click-điểm kiểu SketchUp — bước nhảy giá trị lớn nhất của chặng 3D sau đợt này.
