# BÁO CÁO — COWORK-UI
**Nhận vai:** 03/08/2026 (giờ thật xem timestamp file) · theo `HAM-DOI-COWORK.md` VAI 3.
**Sở hữu:** `docs/mocks/` + `SPEC-DESIGN-SYSTEM-IF` (đề xuất sửa, TỔNG duyệt).
**Luật đã nạp:** SO-KIEM-TONG §1-4 · 00-CHOT (LUẬT GIAO DIỆN ①-⑤, L1-L7, §2c chống ngô nghê) · token `globals.css` bắt buộc, 2 theme, cấm hex TTT.

## HÀNG ĐỢI (theo hiến chương, làm theo thứ tự)
| # | Việc | Trạng thái |
|---|---|---|
| 1 | Mock **Mood+Collab G2** (presence avatar, mời +, sticky/comment/reaction, share V/C/E, frame theo phòng) | ✅ 03/08 — `mocks/mock-mood-collab-g2-2026-08-03.html`, chờ Hoà duyệt ảnh 2 theme |
| 2 | Mock **mode Revit** chặng Vẽ (`SPEC-LENH-VE-IF` §2) | ✅ 03/08 — `mocks/mock-cad-revit-2026-08-03.html`, chờ Hoà duyệt |
| 3 | Mock **5 editor Trình bày** (Deck·A3·BOQ·Văn bản·Video) | ⬜ |
| 4 | Mock **quả cầu vật liệu** + panel template D5 (`SPEC-VAT-LIEU-PBR-IF` §2-3) | ✅ 03/08 — `mocks/mock-material-sphere-2026-08-03.html`, chờ Hoà duyệt |
| 3b | Việc 3 (5 editor Trình bày) | ⏸ HOÃN CÓ LÝ DO — BOQ chờ NC-3, Video chờ NC-2, Văn bản/Deck/A3 nên đợi COWORK-TRÌNH rà `TICKET-PRESENT-UI-GON` xong (VAI 6 mục 3) để khỏi mock thứ đã chết. Nêu TỔNG quyết. |
| 5 | Rà 23 file trong `docs/mocks/` → tạo `README-mocks.md` đánh dấu lỗi thời | ✅ 02/08 23:15 — 7 hiện hành · 8 lịch sử · 9 lỗi thời · 1 vi phạm TTT |

## GHI NHẬN KHI NHẬN VAI
- `SO-KIEM-TONG` §2 ghi "COWORK không dựng mock" = luật cho phiên TỔNG; hiến chương hạm đội (lập sau, Hoà duyệt) giao COWORK-UI dựng mock, G4 §3 xác nhận "chờ mock COWORK-UI". Hiểu: **COWORK-UI dựng mock, không code app.**
- G4 đang làm tầng lib collab trước, chờ mock #1 → việc 1 là gấp nhất.
- `docs/mocks/` hiện có 23 file (kiểm `ls` 03/08), chưa có README-mocks.

## NHẬT KÝ (append-only)
- [03/08] Nhận vai, đọc 4 file thủ tục, tạo sổ này. Chờ Hoà chọn việc bắt đầu / kích hoạt tự chạy.
- [03/08] Hoà kích hoạt TỰ CHẠY 1→5. Rà nguồn việc 1: mock cũ `mock-mood-collab.html` + `mock-render-layout-H3.html` đều palette tự chế, 1 theme, không lucide → KHÔNG đạt chuẩn hợp đồng (ghi nhận cho việc 5). Đọc `SPEC-CHANG2-UI-2MODE` §3 · `TICKET-CHANG2-BUILD` G2 · `SPEC-DESIGN-SYSTEM-IF` §1-§4 · token thật `app/globals.css` · khung `AppShell.tsx` 6 ổ.
- [03/08] **Dựng `mocks/mock-mood-collab-g2-2026-08-03.html`** — mock đầu tiên đạt chuẩn hợp đồng: token globals.css nguyên bản (Tối mặc định + gạt Sáng), lucide CDN, khung 6 ổ đúng số đo (42/214/236/26), toolbelt bo đồng tâm 44/22→34/17→22/11→18 + switch "Vẽ 3D" cùng khối (chốt B), share popover kính ghi chú luật PORTAL (K4), swatch matId → Inspector, sticky màu mix từ --warning (không hex mới), mindmap gắn nhãn TEMPLATE·TUỲ CHỌN, frame GU·PALETTE có nút "Bơm vào Render" (live-link). 9 pin chú giải. → Chờ Hoà duyệt ảnh 2 theme; G4 chỉ port sau khi duyệt.

- [03/08] **Dựng `mocks/mock-cad-revit-2026-08-03.html`** (việc 2) — kế thừa NGUYÊN CSS shell v5, chỉ thêm khối "riêng mode Cấu kiện": gạt 3 mode đầu sidebar (⚠️ tên hiển thị **Phác · Kỹ thuật · Cấu kiện = ĐỀ XUẤT chờ TỔNG duyệt**), Layer State → chọn Tầng, sidebar = cây cấu kiện type→instance→con (cửa D-02 lồng dưới W-02), canvas có location line tim tường dashed accent + cửa khoét lỗ với cung mở + đường chia phòng RL-01 + room tự nhận m², inspector tường 5 nhóm (Đặt theo 3 kiểu · Loại dùng chung · Riêng cái này · Nối tự sạch một kiểu · Trong tường này + hint Space đảo chiều), dock lệnh W·D·WD·ROOM·RL. 9 pin chú giải, 2 theme phím D.

## ĐỀ XUẤT CHO 00-CHOT (TỔNG duyệt mới ghi)
- [03/08] Tên hiển thị 3 mode chặng Vẽ: **Phác · Kỹ thuật · Cấu kiện** (Sketch/Pro/Revit là tên nội bộ — theo SPEC-NGON-NGU-CHI-DAN cấm jargon lộ UI). Chờ duyệt.

- [02/08 23:15] **Việc 4** `mocks/mock-material-sphere-2026-08-03.html`: Thư viện sheet kính (ramp mở, Esc đóng) — kệ Vật liệu lưới quả cầu (CSS gradient = placeholder PNG render three.js/PMREM, chú thích nấc 25% lưới / 100% panel, badge nguồn ATLAS/IF) + panel Tạo vật liệu 8 template kiểu D5, ~6 trường + mặc định thông minh, 3 cảnh Cầu/Sàn/Vải, nút "Tạo normal từ ảnh màu", batch import hậu tố `_BaseColor/_Roughness/_Normal`. 7 pin.
- [02/08 23:16] **Việc 3 HOÃN có lý do** (ghi ở bảng trên) — cần TỔNG quyết thứ tự với NC-2/NC-3 + việc rà của COWORK-TRÌNH.
- [02/08 23:17] **Việc 5** `mocks/README-mocks.md`: rà 25 file bằng grep (data-theme · token globals · palette cũ · hex TTT). Kết quả: 7 ✅ hiện hành được port · 8 🕰 lịch sử · 9 ⚠️ lỗi thời (palette tự chế 1 theme — gồm cả `tool-window-sketch2photo` nguồn CHOT-RENDER-TOOL-WINDOW, bố cục giữ token làm lại) · 🔴 `mapa-de-zonas.html` dùng trọn màu TTT #F1ECE3/#002850/#F06020, vi phạm LUẬT TRUNG TÍNH — đề nghị Hoà dời ra `~/Downloads/_TTT-BRAND/`, tôi không tự xoá.
- [02/08 23:18] HẾT VIỆC 23:18 (giờ máy 02/08 — file hệ TỔNG đề ngày 03/08, giữ nhất quán tên file).

## CHỐT PHIÊN [02/08 23:18]
**Đã xong:** việc 1 · 2 · 4 · 5 — bốn sản phẩm: `mock-mood-collab-g2-2026-08-03.html` · `mock-cad-revit-2026-08-03.html` · `mock-material-sphere-2026-08-03.html` · `README-mocks.md`. Cả 3 mock đạt chuẩn hợp đồng (token globals.css nguyên bản · 2 theme Tối mặc định · lucide · khung 6 ổ / kế thừa v5).
**Dở dang:** việc 3 (5 editor Trình bày) — HOÃN chờ NC-2/NC-3 + COWORK-TRÌNH rà ticket cũ; cần TỔNG quyết.
**Chờ Hoà:** ① duyệt ảnh 2 theme của 3 mock (G2 gấp nhất — G4 đang chờ port) · ② quyết `mapa-de-zonas.html` vi phạm TTT · ③ TỔNG duyệt tên 3 mode chặng Vẽ "Phác · Kỹ thuật · Cấu kiện".
**Phiên UI sau đọc:** file này → README-mocks.md → mock nào Hoà đã duyệt thì ghi "ĐÃ DUYỆT" vào README.

## ĐỢT 2 (bơm đêm 04/08 — SO-KIEM-TONG §3 mục COWORK-UI)
- [đợt 2] **Việc 0 ✅ — chốt 7 token inference/trục** vào `SPEC-DESIGN-SYSTEM-IF` §6 (mục mới, append). Nguyên tắc: KHÔNG màu mới ở theme Tối — snap-point=trục Y `#3fb984` · snap-derived=trục Z `#4a78e0` (2D không có Z, tái dùng) · snap-edge=trục X `#e05c5c` · snap-grid=`--accent-soft`; đặt tên chính thức `--axis-x/y/z` dùng chung 2D+3D ("không sinh cặp thứ hai"). Theme Sáng đậm hoá cùng hue đạt ≥3:1 non-text: `#1c8a5b`/`#2f5bc4`/`#c23f3f` (cùng logic --success của globals). KHÔNG lấy `#35b46f`/`#d05b5b`/`#3f8fd6` đề xuất thô của SPEC-VE-INFERENCE — hai-màu-xấp-xỉ trong cùng canvas là điều cấm. Xử va: lục snap ≠ --success (khác ngữ cảnh glyph/badge, như SketchUp chấp nhận endpoint lục = trục Y lục); đỏ snap-edge ≠ --danger (danger không vẽ lên canvas). Contrast đã tính ghi trong spec. **Handoff: CHINH thêm 7 biến vào globals.css 2 theme · PHU đổi fallback drawSnap theo bảng §6.**
- [đợt 2] 🔔 **BÁO TỔNG:** G4 mục 4 ghi "Port `docs/mocks/mock-present-chooser.html`" nhưng file này **CHƯA TỒN TẠI** (kiểm `ls` — mock mới nhất vẫn là 3 file 03/08 của tôi). G4 sẽ vấp. Ai dựng: G4 tự dựng theo PHIEU-PRESENT-G4 (cơ chế mới §2) hay COWORK-UI dựng? Chờ TỔNG phân.
- [đợt 2] HẾT VIỆC — hàng đợi UI đợt 2 chỉ có việc 0, đã xong. Việc 3 cũ (5 editor) vẫn hoãn: NC-2/NC-3 đã về nhưng spec TRÌNH (BOQ·Video·A3) đang viết — mock editor đợi spec đó là đúng thứ tự, tránh dựng 2 lần.

## ĐỀ XUẤT CHO 00-CHOT (đợt 2)
- Dòng đề xuất: `SPEC-DESIGN-SYSTEM-IF §6` — 7 token `--snap-*`/`--axis-*` 2 theme chốt theo nguyên tắc không-màu-mới, chờ TỔNG duyệt + CHINH nạp globals.css.

## ĐỢT 3 (SO-KIEM-TONG §3 bảng đợt 3)
- [đợt 3] **① ✅ `mocks/mock-trinh-boq-2026-08-04.html`** — theo SPEC-TRINH-BOQ-EDITOR đọc trọn: khuôn mách nước "không phải Excel" · banner 3 lỗi + 3 dòng lỗi cuối bảng đúng 4 loại BoqError với nút hành động, tổng KHÔNG gồm lỗi · 8 cột cố định + popover thêm cột 6 kiểu công bố trần 22/30 · popover ƒx trên header Thành tiền (chỉ đọc, mini-DSL ghi chú) · cell m² sửa tay: chấm vàng + revert + drift "máy 42,5" + Inspector truy vết đầy đủ · subtotal engine 2 group + summary-bar grand total · status bar mách "3 vùng lỗi / đang sửa tay 1 ô" · tabular-nums toàn số. PLACEHOLDER ghi trong comment + Inspector (nút "Xem trên bản vẽ" chờ CAD expose). 8 pin.
- [đợt 3] **② ✅ `mocks/mock-trinh-video-2026-08-04.html`** — theo SPEC-TRINH-VIDEO-EDITOR đọc trọn: dải SHOT CÓ TÊN kiểu storyboard (không track vô danh), tên gợi ý từ zone ghi trong Inspector · 3 tầng cố định shot/nhạc/chữ · timeline collapsed + handle "Kéo mở timeline chi tiết" · trim handle 2 đầu + bong bóng "−2,4s" · pill nhạc waveform + 5 beat snap + nút Hít beat/Chia đều theo beat, nhãn "của bạn" (không thư viện nhạc) · tiêu đề theo shot 2 kiểu anim + 2 vị trí preset · chuyển cảnh 3 lựa chọn giữa các tile · nút "Xuất MP4 · 0 credit" + exit path CapCut/Premiere ngay ebar · status bar "đang kéo −2,4s / beat snap BẬT / Tổng 0:48". PLACEHOLDER gradient thay footage. 8 pin.
- [đợt 3] **③ ✅ README-mocks** +2 dòng hiện hành.
- [đợt 3] HẾT VIỆC đợt 3. **Việc 6 (nối hàng đợi — Mock Vitals nâng cấp theo SPEC-APPLE-MOTION §4b): ĐỂ PHIÊN UI SAU** — "linh hồn app, làm kỹ như avatar" không nên dựng lúc context phiên này đã cao (~75-80%); phiên tươi làm mới xứng. Đây là việc ĐẦU TIÊN của phiên UI kế.
- [đợt 3] Ghi chú thay phiên: Hoà dán 10 dòng nhận vai (5 vai × 2) vào phiên này — phiên giữ đúng 1 vai UI theo hiến chương, các dòng NC/VẼ/DỰNG/TRÌNH cần dán vào phiên MỚI riêng.

## ĐỢT 4 (phiên UI mới — nhận phiếu giao việc trùng đợt 3, phát hiện ĐÃ XONG trước khi dựng)
- [đợt 4] Nhận việc y hệt đợt 3 (mock BOQ + Video + README) từ phiếu giao mới, không biết đợt 3 đã chạy.
  **SEARCH trước khi dựng (đúng §0b bước 1)**: `ls docs/mocks/` + đọc `BAO-CAO-COWORK-UI.md` chính mình →
  thấy `mock-trinh-boq-2026-08-04.html` + `mock-trinh-video-2026-08-04.html` đã tồn tại, README đã ghi ✅
  HIỆN HÀNH. KHÔNG dựng lại từ đầu (§0d — không đập cái đang tốt). **Ghi nhận lệch sổ**: `SO-KIEM-TONG.md`
  §3 bảng ĐỢT 3 dòng COWORK-UI CHƯA đánh dấu ✅ cho việc này dù báo cáo mình (đợt 3) đã ✅ — đề nghị TỔNG cập
  nhật bảng đó; mình không tự sửa vì không sở hữu `SO-KIEM-TONG.md` (§2 phân mảng).
- [đợt 4] Audit thật thay vì tin chữ báo cáo cũ (đúng §0 luật trung thực — số đo được, không phải số đẹp):
  đối chiếu 2 mock với `SPEC-TRINH-BOQ-EDITOR.md`/`SPEC-TRINH-VIDEO-EDITOR.md` đọc trọn — nội dung ①②
  (summary-bar/6 cột/badge sửa-tay · shot tên/3 tầng/collapsed) ĐÚNG spec. Đối chiếu token bằng grep trực
  tiếp `app/globals.css` (không tin CSS chép trong mock) — accent/bo 10-14-20-28/tap-row-gap/danger-warning-
  success cả 2 theme KHỚP CHÍNH XÁC, không hex tự chế.
  **Phát hiện lỗ hổng thật (§0c mục 1 — phím tắt)**: cả 2 file KHÔNG có kbd hint/⌘K/legend nào dù
  `SPEC-TRINH-BOQ-EDITOR §9.1` + `SPEC-TRINH-VIDEO-EDITOR §10.1` liệt kê rõ danh sách phím bắt buộc. Mảng 2
  (lệnh tương tác — status bar mách trạng thái) và mảng 3 (cảm ứng — token đổi qua `pointer:coarse` +
  KHÔNG giấu chức năng sau hover, kiểm cụ thể `.rv`/`.fx`/`th.addc` luôn hiện, `.shot .hL/.hR` hiện khi
  `.on` selected không chỉ khi hover, đúng SPEC-HOVER §3.7) đã đạt từ bản đầu.
- [đợt 4] **VÁ, không dựng lại** (đúng §0d): thêm nút "Tìm lệnh ⌘K" ở header + khối "Phím tắt" trong
  Inspector (pin 9-10) cho CẢ 2 file — dùng nền `--card` cho kbd chip để tương phản trong cả 2 ngữ cảnh
  (`.cmdk` nền field lẫn Inspector nền panel). Danh sách phím lấy ĐÚNG từ spec chữ (BOQ: ↑↓←→·Enter·Tab·
  ⌘Z·⌘K — Video: Space·S·←→·⇧←→·Delete·⌘Z·⌘K), không bịa thêm phím ngoài spec. Không đổi bố cục/nội dung cũ.
- [đợt 4] 2 điểm nhỏ ghi nhận, KHÔNG chặn/chưa sửa: (a) vài bo góc chrome <32px (nút/chip) trong 2 file —
  và có vẻ cả các mock COWORK-UI trước — dùng số lẻ 6-9px, không khớp thang 10/14/20/28 lẫn công thức đồng
  tâm (`--radius` chỉ định nghĩa cho panel; capsule/pill có công thức nửa-chiều-cao riêng) — chưa có thang
  micro-radius chính thức cho chip/icon-button nhỏ nên chưa tự sửa, cần TỔNG/Hoà chốt 1 lần dùng chung;
  (b) `SPEC-MAT-DO-CON-TRO.md` chữ ghi "5 token --tap/--row/--gap/--pad-card/--fs-ui" nhưng grep
  `app/globals.css` thật chỉ thấy 3 token đầu — 2 mock ĐÚNG khi chỉ dùng 3 token có thật (ưu tiên code thật
  hơn spec chữ, đúng §0b bước 1), nhưng spec chữ đang lệch code, đề xuất sửa bên dưới cho phiên sau khỏi
  hoang mang đi tìm token chưa tồn tại.
- [đợt 4] `README-mocks.md`: thêm mục "🔍 GHI CHÚ AUDIT" (append, không sửa 2 dòng bảng cũ) ghi lại toàn bộ
  phát hiện trên + đối chiếu SPEC-APP-SHELL-CHUNG (đúng) / SPEC-PANEL-ROLLOUT-IDF (Inspector 2 mock này
  chưa áp rollout — spec đó gắn Inspector CAD, tạm coi ngoài phạm vi Present-stage) / SPEC-MAT-DO-CON-TRO
  (đúng, xem ghi chú (b)) theo đúng yêu cầu phiếu giao việc đợt này.
- [đợt 4] HẾT VIỆC đợt 4. Việc 6 hàng đợi cũ (Mock Vitals nâng cấp theo SPEC-APPLE-MOTION §4b) vẫn ĐỂ
  PHIÊN UI SAU đúng ghi chú đợt 3 — phiên này dồn context cho audit sâu + vá, không mở việc nặng mới.

## ĐỀ XUẤT CHO 00-CHOT (đợt 4)
- `SPEC-MAT-DO-CON-TRO.md`: sửa câu "5 token --tap/--row/--gap/--pad-card/--fs-ui" → ghi rõ 3 token
  `--tap/--row/--gap` ĐÃ vào `app/globals.css`, còn `--pad-card`/`--fs-ui` là đề xuất CHƯA vào code — tránh
  phiên sau tưởng đã có mà đi tìm token không tồn tại.
- `SO-KIEM-TONG.md` §3 bảng ĐỢT 3 dòng COWORK-UI: đổi trạng thái thành ✅ xong (2 mock + README, nay đã vá
  thêm phím tắt đợt 4) — TỔNG ghi khi duyệt, mình không tự sửa file này.

## CHỐT PHIÊN [đợt 4]
**Đã xong:** audit thật + vá lỗ hổng "phím tắt" (§0c) cho `mock-trinh-boq-2026-08-04.html` +
`mock-trinh-video-2026-08-04.html` (việc nội dung đợt 3 vốn đã ✅ trước đó — phiên này KHÔNG dựng lại, chỉ
kiểm bằng grep/đọc spec thật rồi sửa đúng 1 gap cụ thể) + `README-mocks.md` thêm mục audit.
**Không việc nào bị chặn vì thiếu spec nguồn** — cả 2 spec (`SPEC-TRINH-BOQ-EDITOR.md`,
`SPEC-TRINH-VIDEO-EDITOR.md`) đã tồn tại đầy đủ từ đợt 3.
**Lệch chuẩn hợp đồng cần Hoà lưu ý** (không chặn, ghi để biết): bo góc chip/nút nhỏ <32px chưa theo thang
chính thức nào (mục đợt 4 ghi chú a).
**Chờ Hoà/TỔNG:** ① cập nhật `SO-KIEM-TONG.md` §3 dòng COWORK-UI đợt 3 thành ✅ ② quyết thang bo góc micro
cho chip/icon-button nhỏ ③ duyệt ảnh 2 theme của 2 mock (BOQ+Video) nếu chưa duyệt lần nào — G4/TRÌNH có
thể đang chờ để port.
**Phiên UI sau đọc:** file này → nếu Hoà đã duyệt/chê 2 mock thì ghi "ĐÃ DUYỆT" vào README trước khi mở
việc "Mock Vitals nâng cấp" (việc đầu tiên còn treo, đúng ghi chú đợt 3).

---

## ĐỢT 5 — KHOÁ BỘ TÊN + RÀ NHÃN MOCK (COWORK-UI, 03/08/2026)

**Đọc trước khi làm (§0b bước 1):** `SO-KIEM-TONG §0/§0b/§0c/§0d` · `CHOT-TEN-CHANG-MODE-2026-08-03.md` **trọn file** (4 vòng đặt tên, mục "VÒNG CUỐI" là bản đè) · `SPEC-NGON-NGU-CHI-DAN.md` · `mocks/README-mocks.md` · phụ lục cuối `HAM-DOI-COWORK.md` (xưởng mock chính nay là **Claude Design**, COWORK-UI soạn prompt thay vì viết HTML tay).

### VIỆC 1 ✅ — Khoá bộ tên vào từ điển
Append mục **§6 "BỘ TÊN CHÍNH THỨC"** vào `SPEC-NGON-NGU-CHI-DAN.md` (không sửa đè §1-§5), gồm:
- **§6.1** bảng tên chốt: InteriorFlow · **2D Kỹ thuật · 3D Thiết kế · Trình bày** (header hẹp 2D · 3D · Trình bày) · mode 2D **Sơ phác ↔ Kỹ thuật** · mode 3D **Node ↔ 3D** · Trình bày không mode. Ghi rõ **luật cấm-jargon KHÔNG áp cho tên riêng** nên `InteriorFlow` hợp lệ.
- **§6.2** danh sách 5 bộ tên **ĐÃ BỎ** kèm lý do (3 vòng của Hoà + nhãn code EN + `BIM`) — giữ dấu vết để không có vòng 5.
- **§6.3** luật đổi tên: phải qua Hoà · phiên đề xuất tên mới bắt buộc tham chiếu §6.2 · đổi nhãn không đổi khoá kỹ thuật (`sketch/pro/revit`, route) · nhắc luật "ba ống kính một nguồn dữ liệu".
- **§6.4** bảng **từ cấm ↔ từ thay** 15 dòng để phiên sau tra nhanh, có nêu ngoại lệ hợp lệ ("Node" là tên mode chặng 3D; "Vẽ" làm nhãn nhóm công cụ; "Dựng ảnh AI" là tên khối).
- **§6.5** quy trình nghiệm thu nhãn bằng grep 8 chữ.

### VIỆC 2 ✅ — Rà nhãn toàn bộ mock (LIỆT KÊ, KHÔNG SỬA)
Bảng **file → dòng → chữ sai → chữ đúng** đã ghi vào `docs/mocks/README-mocks.md` mục mới "🏷 RÀ NHÃN CHẶNG/MODE — 03/08/2026" (append).
- **19/27 file `.html` dính nhãn cũ**, **78 dòng khớp grep**, trong đó **72 dòng phải đổi** + **6 dòng dương tính giả** (đã liệt kê riêng, giải thích vì sao giữ).
- **Nặng nhất:** `mock-designsystem-stagemap.html` **10 dòng** — kế đó `mock-ve-3d.html` 9 · `mock-render-layout-H3.html` 9 · `mock-if-3chang.html` 8 (5 thật) · `mock-mood-collab-g2-2026-08-03.html` 8.
- Mở rộng grep so với phiếu: thêm `Vẽ 3D` (nhãn mode chặng 2, nay phải là `3D`) và `Present` (EN cùng họ `Presenting`) — cùng một lỗi, bỏ sót thì phiên sau rà lại lần nữa.
- **Không đụng file mock nào** (chờ TỔNG duyệt) và **không đụng `lib/` `components/`**.

### Phát hiện cần TỔNG/Hoà quyết
1. **`mock-cad-revit-2026-08-03.html` là ca nặng nhất về ngữ nghĩa**, không phải số dòng: cả mock dựng quanh mode **"Cấu kiện"** nay **không còn tồn tại** (mode chặng 2D chỉ còn Sơ phác ↔ Kỹ thuật). Đổi chữ không cứu được. Cần quyết: giữ làm tham khảo rồi **cắt đôi theo chiều** (mặt bằng/ký hiệu/thống kê → 2D Kỹ thuật; khối/đặt đồ/vật liệu → 3D Thiết kế), hay dựng lại. COWORK-UI không tự quyết (§0d).
2. **Ưu tiên sửa nhãn:** 8 file trong mục ✅ HIỆN HÀNH của README-mocks (có người port) — phần còn lại nằm ở 🕰 LỊCH SỬ / ⚠️ LỖI THỜI, ưu tiên thấp.
3. Nhiều dòng khớp là **comment HTML / thuyết minh "Đọc mock" / biến JS**, không phải nhãn hiển thị — đã liệt kê nhưng đánh dấu để TỔNG quyết có sửa không.
4. **`SPEC-NGON-NGU-CHI-DAN §3` (từ điển cũ) vs §6 mới:** đã ghi luật xử va — §6 thắng ở lớp tên chặng/mode/app, §3 giữ nguyên cho lớp thuật ngữ cơ chế.

### Trung thực (§0)
- **`mock-3d-thong-nhat.html` CHƯA TỒN TẠI** — `ls docs/mocks/` xác nhận. Việc nó mang nhãn cũ "Vẽ · Dựng ảnh · Trình bày" là **theo phiếu giao việc, chưa tự kiểm được**; đã ghi dòng "⏳ CHỜ EXPORT" trong bảng, phiên sau grep lại khi file về.
- Mọi con số trong bảng là **đếm bằng `grep -c`/`grep -n` thật**, không ước lượng. Cột "chữ đúng" là **suy ra từ §6.4**, không phải Hoà đọc từng dòng.
- KHÔNG chạy git (nhiều phiên dùng chung). 2 file docs sửa ở trạng thái untracked/dirty — nhờ **CHINH** gom commit theo việc 5b hàng đợi.

### CHỐT PHIÊN [đợt 5]
**Đã xong:** việc 1 (§6 vào `SPEC-NGON-NGU-CHI-DAN.md`) + việc 2 (bảng rà 19 file vào `mocks/README-mocks.md`).
**Chờ TỔNG/Hoà:** ① duyệt cho sửa nhãn 8 mock HIỆN HÀNH ② quyết số phận `mock-cad-revit-2026-08-03.html` (mode Cấu kiện đã chết) ③ export `mock-3d-thong-nhat.html` về `docs/mocks/` để rà nốt.
**Phiên UI sau đọc:** `SPEC-NGON-NGU-CHI-DAN §6` TRƯỚC KHI đặt bất kỳ tên nào — bốn vòng đặt tên đã đóng, đề xuất tên mới không tham chiếu §6.2 sẽ bị trả về.

---

## [AUDIT A4] 7 MOCK MÀN PHỤ — 03/08/2026
Đầy đủ: **`docs/AUDIT-MOCK-MANPHU-2026-08-03.md`**. Phạm vi: `mock-if-{du-an,cai-dat,tep,thu-vien,anh-dai-dien,bang-nut,nut-tong}.html` — 7 mock chưa ai kiểm. Không sửa mock, không chạy git.

### Kết luận
- **PORT ĐƯỢC NGAY: 0/7.**
- **Sửa bề mặt rồi port (2):** `mock-if-tep` · `mock-if-bang-nut` — khung 6 ổ đủ 42/214/236/26, bộ tên chặng `2D·3D·Trình bày` đúng, K4 + G1 đạt.
- **Phải sửa/dựng lại trước (5):** `du-an` (22 dòng) · `cai-dat` (26 dòng) · `anh-dai-dien` (60 dòng, rỗng ruột) — **3 file này KHÔNG CÓ GIAO DIỆN, bị cắt cụt lúc export**; `thu-vien` (cụt đuôi + thiếu `<script>` + G2) · `nut-tong` (G2 nặng + 19 lần hardcode 44px + thiếu khung 6 ổ).

### Số thật đáng nhớ
| Tiêu chí | Kết quả |
|---|---|
| Hex TTT cấm (`#F06020 #002850 #1B1512 #F1ECE3`) | **0/0/0/0 — cả 7 file sạch tuyệt đối** |
| Nhãn chặng cũ (`Rendering`·`Presenting`·`CAD ·`·`>Vẽ<`) | **0/7** — 12 khớp `Dựng ảnh` đều là **tên NODE** (§6.4, dương tính giả) |
| `var(--` | tep 649 · bang-nut 465 · nut-tong 447 · thu-vien 407 · anh-dai-dien 19 · **du-an 0 · cai-dat 0** |
| Hex tự chế ngoài `:root` | thu-vien **51** (22 trùng token) · nut-tong 17 · tep 9 · bang-nut 9 · anh-dai-dien 0 |
| Khung 6 ổ đủ 4 số | **tep ✅ (×4 trạng thái)** · bang-nut ✅ · thu-vien ⚠️ thiếu 42/26 · nut-tong ⚠️ chỉ 236 · 3 file cụt ❌ |
| PLACEHOLDER | tep 7 · bang-nut 6 · nut-tong 6 · thu-vien 3 · anh-dai-dien 1 |
| K4 (nút quyết định có chữ) | **✅ 7/7** — `Xoá` ở tep:320·511 có chữ; 2 nút chỉ-icon đều là "Đóng" có title+Esc |
| G1 (animate opacity trên kính) | **✅ 7/7** — 4 keyframes tồn tại đều là transform/dash/box-shadow |

### 3 lỗi phổ biến nhất
1. **`font:` rút gọn thiếu `/line-height`** — **162 chỗ / 5 file** (tep 76 · thu-vien 44 · bang-nut 24 · nut-tong 17 · anh-dai-dien 1). `grep 'text-\['` = 0 vì mock dùng inline style, nhưng shorthand `font:600 11px inherit` **đặt lại line-height về normal** → đúng cơ chế G4 cắt dấu tiếng Việt. Sửa: thêm `/1.5`.
2. **Lớp nổi dưới 92% nền đặc (G2)** — **33 phần tử / 4 file**: 27 card node trên `--mat-card` **62%** (bang-nut 14 · nut-tong 13, tự hạ khỏi `.82` của globals) + modal `nut-tong:165` **72%** + tấm `thu-vien:92` **78%** + popover `tep:701` 68% + bảng lệnh `bang-nut:479` 68%.
3. **Hex viết cứng trùng đúng giá trị token** — **48 chỗ / 5 file** (`#f5f5f7`→`var(--t1)`, `#c79a63`→`var(--accent-warm)`, `#0a0a0c`, `#f2efe9`…).

### Phát hiện chặn — cần TỔNG/Hoà xử
1. 🔴 **`docs/mocks/support.js` KHÔNG TỒN TẠI** nhưng **16 mock** `<script src="./support.js">` (7 file này + `mock-2d-ky-thuat` · `mock-3d-frame` · `mock-3d-thong-nhat` · `mock-trinh-bay` · 4 mock `mock-an-*` · `Vitals v2.dc`). Hệ quả: nút đổi theme không chạy, **131 thuộc tính `style-hover` chết**, `{{ project }}` in ra nguyên ngoặc. ⇒ **Tiêu chí "đủ 2 theme" mới verify được ở mức KHAI BÁO CSS; chưa file nào verify được bằng mắt.**
2. 🔴 **3 mock export hỏng** (`du-an` 572B · `cai-dat` 904B · `anh-dai-dien` 3.4KB) + `thu-vien` mất đuôi. Cần export lại từ nguồn — COWORK-UI không dựng mock (§2).
3. 🟡 **Token dùng chung bị mock tự sửa giá trị:** `--mat-card` .82→**.62** (bang-nut·nut-tong) · `--mat-panel` .68→.78/.72 (thu-vien·nut-tong) · `--row` 28→**44** (cai-dat:14). Port nguyên = mang giá trị sai vào app.
4. 🟡 **Token mới chưa có trong `globals.css`:** `--scrim` `--hatch` `--ink` `--swatch-bg` — nên chốt vào globals thay vì mỗi mock tự khai. 4 biến `--p-img/-mask/-mat/-num` chỉ là bí danh của `--accent`/`--warning`/`--success`/`--t3` → bỏ.
5. 🟡 **§0c mảng 1 (phím tắt) thiếu ở cả 7:** `<kbd>` = 0/7 · `⌘` = 1 lần duy nhất · không có lối vào ⌘K. Cùng lỗ hổng đã vá cho 2 mock Trình bày đợt 3.

### Trung thực (§0)
- Mọi con số từ `grep -o | wc -l` / `grep -c` chạy trên file thật; token đối chiếu bằng cách grep thẳng `app/globals.css` (`--mat-panel:.68` dòng 93 · `--mat-card:.82` dòng 94 · `--accent-warm:#c79a63` dòng 26 · `--row:28px` dòng 61), không tin CSS chép trong mock.
- **CHƯA VERIFY:** hiển thị thật 2 theme/hover (chặn bởi `support.js`) · tỉ số tương phản chữ trên kính (các số 62%/68%/72%/78% là **độ đục nền đọc từ CSS**, không phải tỉ số tương phản đo được) · nội dung `du-an`/`cai-dat`/`anh-dai-dien` (không có ruột).
- KHÔNG chạy git. `docs/AUDIT-MOCK-MANPHU-2026-08-03.md` + 2 file docs sửa đang untracked/dirty — nhờ **CHINH** gom commit (hàng đợi 5b).

---

# S5 · BUILD #4 — KHUNG CHECKPOINT DUYỆT + RÀ NÚT GIẢ (05/08/2026)

## 1 · Thành phần Checkpoint dùng chung — S2/S3/S4 GẮN VÀO ĐÂY

**File:** `components/studio/Checkpoint.tsx` (UI) + `components/studio/checkpoint-core.ts` (phần thuần)
**Mock hợp đồng:** `docs/mocks/mock-checkpoint-duyet.html` (PASS `check:mocks`, đủ 2 theme)
**Test:** `components/studio/checkpoint-core.test.ts` — **34/34 pass**

```tsx
import { Checkpoint, toggleItem, type CheckpointItem } from '@/components/studio/Checkpoint';

<Checkpoint
  phase={phase}                    // 'running' | 'preview' | 'idle'
  title="Dựng tường từ mô tả"
  // ① ĐANG LÀM
  progress={0.62}                  // null = CHƯA đo được ⇒ hiện số giây, KHÔNG bịa %
  statusLine="Đang dựng tường trục B…"
  onCancel={abort}
  // ② XEM TRƯỚC — sản phẩm THẬT (ReactNode, cố tình không nhận string)
  preview={<PlanThumb doc={draftDoc} />}
  items={items} onItemsChange={setItems}
  params={[{ label: 'Tỉ lệ', value: '1:50' }]}
  seed={84120}                     // BẮT BUỘC — null = "không dùng seed", UI nói thẳng
  undoLabel="bản vẽ trước khi chạy AI (12 tường)"   // BẮT BUỘC
  // ③ QUYẾT
  onAccept={(ids) => commitOnly(ids)}   // ⛔ CHỈ ghi `ids`, không ghi cả gói
  onRetry={runAgain}                    // giữ NGUYÊN tham số cũ
  onEditParams={() => setPanelOpen(true)}
/>
```

**Vì sao `seed` và `undoLabel` KHÔNG optional:** để quên là **hỏng `tsc`**, không phải "quên thì thôi".
Đây là cách ép KS2/KS4 chứ không nhắc suông.

**KS1–KS5 (§0e) cài vào kiểu dữ liệu:**

| KS | Cài ở đâu |
|---|---|
| KS1 dạng trung gian | `preview: ReactNode` + `params[]` — nhận `ReactNode` để không ai truyền câu *"đã tạo xong 12 đối tượng"* |
| KS2 cùng vào → cùng ra | `seed` bắt buộc; `formatSeed(null)` in thẳng *"chạy lại có thể ra khác"* |
| KS3 duyệt theo phần | `items[].selected` + `acceptGate()` chặn Nhận khi chưa tick |
| KS4 lùi về đâu | `undoLabel` bắt buộc, hiện ngay trên hàng nút |
| KS5 vì sao | `items[].why` → tooltip ⓘ; không có căn cứ thì **nói là không có**, không giấu |

**Chống đường tắt:** `onAccept` trả **đúng `selectedIds`**. Nơi gọi phải ghi theo danh sách đó —
không được cầm sẵn kết quả rồi ghi tất. `acceptGate()` chặn Nhận-khi-rỗng/chưa-tick kèm lý do.

**Phụ thuộc mới thêm vào `app/globals.css`:** `.if-indeterminate` (vạch tiến độ vô định) + nhánh
`prefers-reduced-motion`. Spinner **tái dùng `.pe-spin` có sẵn** (luật L6), không tạo keyframes trùng.

## 2 · Rà nút giả — **KHÔNG TÌM THẤY NÚT GIẢ NÀO**

Lệnh tái lập (AST-thô, quét `components/**` + `app/**`): xem `docs/CHECKLIST-TONG.md` mục *Sổ ô trống*.

| Kiểm | Kết quả |
|---|---|
| `onClick={() => {}}` / noop trong `components/studio/` | **0** |
| `<button>` thiếu CẢ `onClick` lẫn `disabled` trong `components/studio/` | **0** |
| Ô `disabled` TĨNH (placeholder §9) toàn app | **18** — 15 có lý do tại chỗ |
| `disabled` TĨNH thiếu lý do | **3 — cả 3 là DƯƠNG TÍNH GIẢ** |

3 "thiếu lý do" (`cad/CadCanvas.tsx:3437` · `form/shared.tsx:198` · `photo-editor/PhotoEditor.tsx:445`)
đều là **component nguyên thuỷ nhận `disabled` làm prop truyền qua** — lý do thuộc nơi GỌI, không
thuộc primitive. Không sửa gì.

> ⚠️ **Hai lỗi tôi tự mắc khi quét, đã sửa trước khi báo** (mục 6).

## 3 · Mock — 🔴 phát hiện mới: 4 file RỖNG, 2 đã vào git

`Canvas-9 · Canvas-10 · Canvas-13 · Canvas-15` (`.dc.html`) — cả 4 đúng **206 byte**, ruột
`<x-dc></x-dc>` **trống trơn**. **Canvas-9/10 ĐÃ commit vào repo**; 13/15 còn untracked.

- ⛔ **KHÔNG sửa cho qua cửa kiểm.** Thêm `data-theme` vào file rỗng thì nó PASS mà vẫn không có
  ruột — nguy hiểm hơn để ĐỎ, vì bảng sẽ báo "đã có mock".
- Đề xuất: **xoá cả 4** + thêm **luật ĐỎ ⑥ MOCK-RỖNG** vào `scripts/check-mocks.mjs`.
  S5 **không tự sửa cửa kiểm** (ngoài mảng + brief cấm) — cần TỔNG duyệt.
- 5 mock brief nêu (`Cài đặt`·`Chế độ Chuyên`·`Dự án`·`Nút tổng`·`Thư viện`) **đều PASS sẵn**, không phải sửa.

`check:mocks` sau phiên: **66 file · 43 ĐỎ · 753 vi phạm** — y hệt trước phiên, **cộng 1 file mới của
tôi và file đó PASS**. 43 ĐỎ là nợ cũ đã ghi ở audit 03/08 phía trên (gốc: `support.js` không tồn tại).

## 4 · CHECKLIST-TONG

Append mục **"SỔ Ô TRỐNG (`disabled` kèm lý do)"** + changelog. **179 → 222 dòng** (+43).
Bảng: màn hình · ô nào · lý do chưa có · phiên fill.

## 5 · Cửa kiểm

| Cửa | Kết quả |
|---|---|
| `npx tsc --noEmit -p .` | **sạch phần S5** — 0 lỗi ở mọi file tôi đụng. ⚠️ Toàn repo còn **đúng 1 lỗi KHÔNG PHẢI của tôi**: `__probe-dxf.ts(16,15) TS2339 Property 'doc' does not exist on type 'Doc'` — file scratch **untracked**, mtime 05/08 21:34, của phiên khác đang làm DXF (S1). Loại file đó ra thì `tsc` **rỗng hoàn toàn**. Không đụng vào (ngoài mảng + luật hai-phiên-chung-git) |
| `checkpoint-core.test.ts` | **34/34 pass** |
| `npm run check:mocks` | mock mới **PASS**; tổng số ĐỎ **không tăng** |
| Ảnh 2 theme | `docs/mocks/mock-checkpoint-duyet.html` — chụp cả tối+sáng, chữ Việt đủ dấu, ô mờ hiện đúng lý do |

## 6 · LỖI TÔI MẮC TRONG PHIÊN (bắt buộc ghi)

1. **Bộ quét nút giả sai 2 lần, suýt báo cáo số bịa.**
   - Lần 1: regex bắt luôn class Tailwind `disabled:opacity-40` ⇒ đếm **47 ô** và **30 "thiếu lý do"**.
   - Lần 2: cửa sổ tìm lý do quá hẹp + không hiểu `label={tr('vi','en')}` ⇒ báo nhầm cả
     `Checkpoint.tsx:289` (chính tôi vừa viết, có Tooltip) là "chưa có lý do".
   - Sửa: loại `className=`, đòi `disabled` đứng một mình (không theo sau `:` hoặc `=`), rồi **đọc tay
     từng ca còn lại**. Số đúng: **18 / 15 / 0**. Bài học: kết quả grep là **phân loại sơ bộ**, không
     phải kết luận — ca cuối phải đọc mắt.
2. **Import sai kiểu export:** viết `import { Tooltip }` trong khi `components/ui/Tooltip.tsx` là
   **default export**. `tsc` bắt được, đã sửa.
3. **Suýt dựng trùng tài sản:** định thêm keyframes spinner `.if-spin` mới, grep ra `.pe-spin`
   (`globals.css:371`) đã làm đúng việc đó ⇒ tái dùng (luật L6).
4. **Regex trích lý do gây catastrophic backtracking**, treo 2 phút phải kill. Bỏ hẳn hướng tự động,
   chuyển sang đọc tay — vì thế vài ô trong sổ ghi *"lý do có tại chỗ, xem file:dòng"* thay vì chép
   nguyên câu. **Chưa trích đủ chữ lý do cho 7 ô** — ghi rõ, không giả vờ đã gom đủ.

## 7 · N7 — chỗ brief lệch với code

| Brief nói | Thực tế |
|---|---|
| "`docs/mocks/` hiện có **5** file HTML untracked" | **10** file untracked (thêm `2D Kỹ thuật`·`Bảng nút`·`Canvas-13`·`Canvas-15`·`Ảnh đại diện`) |
| Mẫu đúng ở `Command3DPanel.tsx:125` và `:238` | Docstring ở **:123-125**, nút `disabled` thật ở **:236-244**. (§9 trong `00-BAT-DAU-DOC-DAY.md` ghi `:113,139` — **đã lỗi thời**, nên sửa) |
| "dựng một thành phần checkpoint … ba trạng thái" | Đúng là **chưa có** (grep `Checkpoint` toàn repo = chỉ `lib/ai/providers/sd.ts`, nghĩa khác: checkpoint của model SD). **Nhưng** §0e KS1–KS5 trong `00-BAT-DAU-DOC-DAY.md` đã đặc tả sẵn yêu cầu này — tôi dựng theo KS1–KS5 chứ không tự nghĩ 3 trạng thái mới. Precedent gần nhất đã có: cặp Nhận/Bỏ + "Làm lại" ở `present-editor/LayoutShelf.tsx:226,368` |

## 8 · CHƯA LÀM — nói thẳng

- **Chưa gắn Checkpoint vào flow nào.** S5 dựng khuôn; S2/S3/S4 cắm. Vì vậy **chưa chứng minh được**
  luật "không flow nào ghi thẳng vào `Doc`" — mới **tạo điều kiện** để giữ luật, chưa **cưỡng chế** được.
  Muốn cưỡng chế thật thì cần chặn ở tầng ghi `Doc`, nằm ngoài mảng S5.
- **Chưa port mock↔code parity** (VIỆC 3 ý 3) cho 5 mock PASS — hết ngân sách phiên, và 4/5 mock đó
  thuộc màn của S2/S4.
- **Chưa verify Checkpoint trong app thật** (chưa nơi nào mount). Ảnh 2 theme là từ **mock hợp đồng**,
  không phải từ app đang chạy — nói rõ để không ai hiểu nhầm.
- **V6: KHÔNG commit.** Toàn bộ nằm ở working tree, Hoà commit.

**File S5 đụng:** `components/studio/Checkpoint.tsx` (mới) · `components/studio/checkpoint-core.ts` (mới) ·
`components/studio/checkpoint-core.test.ts` (mới) · `docs/mocks/mock-checkpoint-duyet.html` (mới) ·
`app/globals.css` (append 29 dòng) · `docs/CHECKLIST-TONG.md` (append) · `docs/BAO-CAO-COWORK-UI.md` (append).
**Không đụng** file nào của S1/S2/S3/S4.
