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
