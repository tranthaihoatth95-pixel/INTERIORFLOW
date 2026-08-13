# NC · TRIẾT LÝ GIAO DIỆN IF — chưng cất 51+19 ảnh ref + top-tier có nguồn (14/08/2026)

> Phiếu `nc-triet-ly-giao-dien` · vai NC, KHÔNG code. Đây là ĐỀ XUẤT trình Hoà, chưa phải chốt.
> Dữ liệu: 51 ảnh `/Users/tranben/Downloads/tham khao ui/` (3 agent đọc mắt từng tấm, 50 dùng được —
> 1 tấm là ảnh món ăn) + gu 19 ảnh chat 14/08 (T chưng cất) + web dẫn nguồn ở cuối mỗi mục.
> Điều khoản ruột: [N2] đơn giản ngoài sâu trong · [T4]/[Đ6] lớn→nhỏ group-by · [Đ2] nội lực trước.

---

## 1 · BẢN ĐỒ CỤM CƠ CHẾ (tần suất trên 50 ảnh · ✚ = trùng trục gu 19 ảnh ⇒ trọng số gu Hoà cao)

| # | Cụm cơ chế | Tần suất | Nguyên lý rút ra |
|---|---|---|---|
| K1 | **Sidebar phân loại + lưới thumbnail thật** | 20 + 19 ✚(CGBookCase) | Mọi kho nội dung duyệt bằng cột phân loại trái + lưới ẢNH THẬT, không icon suông. Đúng [Đ6] lớn→nhỏ. |
| K2 | **Giấu sâu mở dần** (inspector theo chọn, collapse, hover-reveal) | 15 | Tham số chỉ hiện khi có đối tượng chọn; nhóm rollout. CHỈ thấy ở tool-editor thật — dấu hiệu "đồ làm việc" vs đồ trưng. |
| K3 | **Canvas là vua — tool nổi quanh nội dung** (layered-canvas 9 + floating-toolbar 6) | 15 ✚(toolbar glass dưới ảnh) | Chrome tối trung tính lùi lại, công cụ nổi SÁT vật đang chỉnh, không chôn trong menu xa. |
| K4 | **Pill/capsule + segmented** làm ngôn ngữ điều khiển | ~16 + 6 ✚(nút capsule kính) | Bar/pill nổi = capsule, khớp §2d Hình học Apple đã chốt — ảnh ref xác nhận thang shape. |
| K5 | **Dark-first + MỘT accent ấm** | dark 32/50 · warm-accent 7 ✚(cam/amber lặp) | Nền tối trung tính; đúng 1 accent, ấm; màu rực chỉ ở dữ liệu/trạng thái. |
| K6 | **Kính CHỈ ở lớp nổi tạm** (modal · palette · menu) | 8/8 ảnh glass đều là lớp nổi | Không ảnh nào kính hoá khung thường trực — trùng khít luật "kính là VỎ" + bài học iOS 27. |
| K7 | **Số liệu là typography chính** (big-number 6 + neon-data 2) | 8 ✚✚(follower/%/forecast) | Con số quan trọng TO như tiêu đề, tabular-nums; neon chỉ khi số là dữ liệu sống. |
| K8 | **Thẻ xếp chồng có chiều sâu + editorial serif** | 8 + 4 ✚✚(pitch deck đỏ-đen, serif italic) | Nội dung trình bày như tạp chí — đúng tầng SẢN PHẨM (Story Set/deck), không phải tầng chrome. |
| K9 | **Vật thể 3D/vật liệu làm chủ thể** (3d-hero 8 + material-sphere) | 9 ✚(quả cầu vật liệu) | Sản phẩm chiếm sân khấu, UI thu về mép — đồng hướng quả cầu matId + FlowRender. |
| K10 | **Trục thời gian nhìn thấy được** (timeline dọc/ngang/scrubber) | 10 ✚(trục dọc phát sáng) | Tiến trình là đồ hoạ chính, không phải bảng — nuôi Bảng khởi tạo/Gantt/Video. |
| K11 | **Một lệnh gọi tất cả** (command-palette/prompt bar + hotkey hint) | 6 | ⌘K là cửa PHỤ đến mọi lệnh + trường dạy phím tắt (hint ngay cạnh lệnh). |
| K12 | **Presence + node graph** | 4 + 3 | Cộng tác = avatar sống trên canvas; node graph = đúng tinh thần master node chặng 2. |

Đối chiếu 3 cụm mạnh nhất với gu: K1 (24 điểm chạm) · K2+K3 (30 điểm chạm, cùng một triết lý
"nội dung trước — công cụ theo ngữ cảnh") · K5 dark-first. **Gu Hoà = giao của ảnh sưu tầm và 19 ảnh chat:
tối trung tính · phân loại rõ · công cụ theo ngữ cảnh · số và vật thể được tôn vinh · kính có chừng mực.**

---

## 2 · NGUYÊN LÝ TRIẾT LÝ GIAO DIỆN (top-tier, có nguồn) — và IF đứng ở đâu

| # | Nguyên lý (1 câu) | Nguồn | IF đạt / chưa |
|---|---|---|---|
| P1 | **Nội dung chiếm trung tâm, chrome lùi lại** — "your work takes center stage". | Figma UI3 (figma.com/blog/behind-our-redesign-ui3) · Blender 2.80 "focus on the artwork" (blender.org/download/releases/2-80) · Apple Liquid Glass content-first (developer.apple.com/videos/play/wwdc2025/219) | ✅ hướng canvas-stage đúng · ❌ status bar đè chữ (CHAN-DOAN A2), toolbar 3 khuôn giành mắt (B1) |
| P2 | **Mặc định ít, mở theo yêu cầu** — progressive disclosure hoá giải mâu thuẫn quyền-năng ↔ đơn-giản. | NN/g Jakob Nielsen 2006 (nngroup.com/articles/progressive-disclosure) | ✅ SPEC-PANEL-ROLLOUT + inspector-theo-chọn đã chốt · ❌ Present phơi hết chip 4 hàng (B6), per-thumb 4 nút (B3) |
| P3 | **Kính là lớp điều hướng NỔI, cấm áp lên nội dung**; phải có nấc giảm chói. | Apple HIG/WWDC25 "never applied to content itself" (developer.apple.com/videos/play/wwdc2025/356) + iOS 27 tự sửa (SPEC-APPLE-MOTION đã ghi) + bằng chứng ảnh K6 8/8 | ✅ luật "kính là VỎ" có sẵn · 🟡 chưa có nấc Reduce-Bright (ref #14 đã ghi, chưa thi công) |
| P4 | **Bàn phím là đường cao tốc, palette là trường học** — mọi lệnh có phím, hint hiện cạnh lệnh, ⌘K làm được mọi việc. | Linear patterns (gunpowderlabs.com/2024/12/22/linear-delightful-patterns · 925studios.co/blog/linear-design-breakdown-saas-ui-2026) | ❌ hotkey-registry entry mở chưa thi công; chưa có ⌘K; grep 0 `onKeyDown` từ vựng (SPEC-MAT-DO đã đo) |
| P5 | **Bắt đầu từ VIỆC, không từ tờ giấy trắng** — hỏi ý định → nạp sẵn không gian; bản nháp sửa được > canvas trống. | Notion blank-page (onboardme.substack.com/p/how-notion-solved-the-blank-page-product-strategy-deepdive) · medium.com/ui-for-ai/no-more-blank-canvas-rethinking-how-people-start-with-ai-fd427af24dc8 | ✅ TaskFirstStart 3 lối (dogfood ST5) + Render3DModeSkeleton · ❌ chưa thành khuôn chung (B2: Files = text thô) |
| P6 | **Mặc định = bản chưng cất cách người pro làm, không phải "bản làm bớt"** — Blender đổi left-click theo số đông; Spline "borrows Blender's language, strips down". | Blender (blendernation.com/2018/11/28/left-click-select-is-now-the-default-in-blender) · Spline (greaterstudio.com/research/the-3d-tool-that-finally-feels-like-it-was-built-for-ui-designers-with-one-big-catch) · Rive state machine cho designer (rive.app/blog/state-machines-make-iteration-a-breeze-for-designers-and-developers) | = chính [N2] đã lập hiến · 🟡 nhóm-lệnh-đóng-gói 2 tầng chưa thi công |
| P7 | **Thêm tính năng KHÔNG được thêm bề mặt** — bài học Photoshop "shambling bloated monster", chữa cháy bằng Contextual Task Bar/search. | Interface bloat (en.wikipedia.org/wiki/Interface_bloat) · bulklayers.com/blog/why-is-photoshop-getting-worse · daringfireball.net/linked/2026/05/04/photoshop-modern-user-interface | ⚠️ luật §9 "ô trống là bằng chứng" PHẢI đi kèm phân tầng ③ dưới đây — không thì thành bloat kiểu Adobe |

---

## 3 · TRẢ LỜI BÀI PHÂN LUỒNG — kiến trúc 3 tầng lộ dần (map vào `kien-truc-tool-3-lop` đã chốt 13/08)

**Tầng ① CHUNG LUÔN HIỆN** *(= "thanh chung 1-2 hàng" của chốt)* — những việc app thiết kế NÀO cũng có,
bằng chứng: mọi tool-editor trong 50 ảnh đều giữ một hàng lệnh mỏng + dock. Danh sách đề xuất (≤9 mục):
**Chọn/di chuyển · Undo/Redo · Zoom/Pan (bar đáy đã có) · trạng thái Lưu · Tìm/⌘K · Thư viện · Xuất ·
Vitals pill · presence.** Mỗi màn đúng MỘT hành động chính mang accent — còn lại chip thường.

**Tầng ② GROUP-BY CHỌN ĐƯỢC** *(= "gói tác vụ 1 dòng + icon")* — lệnh đặc thù stage gom thành GÓI người
dùng bấm chọn (K1: 20/50 ảnh dùng sidebar phân loại làm đúng việc này): sidebar hai nấc tự lọc theo ngữ
cảnh (chốt Master Library 10/08 — tái dùng, không chế mới) + dropdown gói trên thanh chung + tab segmented.

**Tầng ③ CỬ CHỈ/COLLAPSE MỞ SÂU** — hover-reveal (nút phụ per-item) · inspector CHỈ hiện khi chọn
(SPEC-CAD-SHELL-V3 đã chốt) · rollout collapse (SPEC-PANEL-ROLLOUT) · chạm-giữ đĩa lệnh (CẤP 2, 11/08) ·
⌘K/hotkey (P4) · **master node = mini-tool cửa sổ to** cho tác vụ rất sâu. Cùng MỘT registry lệnh 2 tầng
truy cập [N2] — tầng ③ không phải "tính năng khác" mà là đường vào sâu của cùng lệnh.

**Từng màn hiện tại lệch tầng nào** (đối chiếu CHAN-DOAN nhóm B):
- **3D dock capsule đáy** — gần khuôn đúng nhất, đề xuất lấy làm GỐC của khuôn chung (B1).
- **2D chip dropdown hàng ngang** — trộn tầng ①+②: lệnh sâu phơi ngang hàng lệnh chung.
- **Trình chiếu chip wrap 4 hàng + "Xuất" accent giữa chip thường** — tầng ②③ tràn hết lên ①; hành động chính/phụ lẫn (B6); 4 nút per-thumb = tầng ③ bị phơi (B3).
- **Files/Gallery sáng tab "Thiết kế 3D"** — nhầm CẤP: trang cấp APP không thuộc chặng (B5).

---

## 4 · CHỐNG "KHÔNG BIẾT BẮT ĐẦU TỪ ĐÂU" — 5 cơ chế nuôi spec `luong-theo-viec` (finding F1)

1. **Lối vào theo VIỆC, không theo màn:** mở app/dự án thấy 3-5 thẻ việc ("Dựng deck từ PDF", "Render góc sảnh…") thay vì lưới màn trống — Notion hỏi ý định rồi nạp sẵn (nguồn P5); nội lực = TaskFirstStart 3 lối đã dogfood ST5, nâng thành cửa chung.
2. **EmptyState một khuôn làm-được-việc:** minh hoạ đúng nội dung (chốt 10/08) + 1 câu to + 1 câu phụ + 1 CTA + mẫu kéo-được (ref #6; Render3DModeSkeleton là mẫu sống) — thay text thô ở Files (B2).
3. **Bản nháp máy sinh làm điểm khởi đầu:** "users react faster to something editable than to empty workspace" (nguồn P5) — đúng dàn-ý-chờ-sẵn + auto-deck human-in-loop [T5] đã chốt; đây là bằng chứng ngành cho hướng đó.
4. **Mồi MỘT hành động chính mỗi màn:** đúng 1 nút accent/màn (sửa B6) — mắt luôn có chỗ bắt đầu.
5. **⌘K + hotkey hint = trường dạy dần** (Linear, P4): người mới GÕ TÊN VIỆC thay vì lục menu; hint cạnh lệnh biến người mới thành pro không cần đọc docs.

---

## 5 · ĐỀ XUẤT KHUÔN NHÓM B (đầu vào cho mock Claude Design/Figma — chưa phải mock)

**KB-1 · Thanh công cụ MỘT KHUÔN 3 stage** (giải B1+B6): lấy dock capsule 3D làm gốc. Hàng ① mỏng
thường trực ≤9 lệnh chung (capsule 44/r22 → nút 34/r17, §2d); lệnh stage = gói group-by dạng dropdown
1 dòng + icon (tầng ②); đúng 1 hành động chính accent, separator bỏ gạch "|" lửng. Ref chống lưng: K3+K4
+ Linear density (P4).

**KB-2 · EmptyState chung** (giải B2): component một khuôn theo mục 4.2 — props {minh hoạ, câu to,
câu phụ, CTA, mẫu kéo-được}; áp Files trước, quét dần mọi màn. Ref: #6 + K1 (empty state 2 ảnh lô A đều
đi kèm CTA capsule).

**KB-3 · Thumbnail strip** (giải B3): thumb sạch không nút; 4 hành động ↑↓⧉🗑 chuyển vào hover-reveal
overlay + context menu (tầng ③); số trang tabular-nums. Ref: K2 (hover-reveal trong ảnh tool thật) +
luật 2c-⑤.

**KB-4 · Trang cấp APP không mang tab chặng** (giải B5): Files/Gallery/Home đổi tab chặng thành nhãn
cấp app + nút "Về chặng đang dở" (đọc lastStage — nội lực Home 12/08); điều hướng nhanh dồn về ⌘K (K11).
Ref: Figma UI3 tách file browser khỏi editor (P1).

---

## 6 · BA CẢNH BÁO — thứ trong ảnh ref KHÔNG bê vào IF

1. **Neon/glow trang trí** (2 ảnh dashboard C15-C16, và "forecast neon" trong gu): trái LightState —
   ánh sáng CHỈ mang nghĩa trạng thái. Chỉ giữ khi glow = dữ liệu sống (đang render/cảnh báo), không nền tĩnh.
2. **Kính quá đà:** chính 50 ảnh đã tự nói — 8/8 ảnh glass đều ở LỚP NỔI TẠM. Bê kính vào khung thường
   trực là trái HIG (P3) + bài học iOS 27; kèm nghĩa vụ nấc giảm chói (ref #14) khi thi công.
3. **Đồ QUẢNG CÁO ≠ đồ LÀM VIỆC:** poster/landing 3d-hero + editorial full-bleed (K8, K9) rất đẹp nhưng
   là ngôn ngữ TRƯNG BÀY — bê vào chrome workspace là phạm cấm kỵ ⑦ [N1]. Chỗ đúng của nó: tầng SẢN PHẨM
   (Story Set, deck, bìa hồ sơ — DS §5), nơi IF "đầy tay như Canva, kỷ luật như Apple".

---
*NC lập 14/08/2026. Nguồn URL đầy đủ trong bảng mục 2; cách làm ghi ở
`docs/bao-cao-phien/2026-08-14-NC-triet-ly-giao-dien.md`. Cụm K1-K12 có thể nối vào REF-VISUAL
làm #16+ nếu T duyệt — file này không tự sửa REF-VISUAL (đúng trần vai).*

---
## PHỤ LỤC · Đợt ảnh bổ sung #2 (4 ảnh Hoà gửi chat 14/08, T đọc trực tiếp)

| Ảnh | Cơ chế | Nạp vào cụm |
|---|---|---|
| Photo browser kiểu visionOS (search pill kính + rail kính icon tròn bên trái, card carousel chiều sâu trên nền blur) | chrome kính NỔI trên nền mờ, nội dung card SẠCH không kính | củng cố K6 (kính = lớp nổi) + card-stack-depth; gợi ý cho Gallery/trình duyệt ảnh IF |
| "PROMPTS" folder kính sáng (3 ảnh ló + đúng 1 nút CTA tròn đậm) | một-hành-động-chính nổi bật trên card sưu tập | củng cố nguyên tắc 1-accent/màn (tầng ①); khuôn thẻ bộ sưu tập Gallery |
| Canva dark mode (sidebar dọc icon+nhãn Design/Elements/Text/Brand · dải thumbnail ĐÁNH SỐ dưới · canvas tối bọc trong khung editor sáng) | sidebar 1 cột icon+chữ (không icon trần) · thumbnail strip số tabular · nền editor và nền NỘI DUNG tách nhiệt độ | nuôi KB-1 (nhãn kèm icon, không icon trần) + KB-3 (strip đánh số sạch) |
| Planner tuần kem editorial (tab THÁNG dọc mép phải như tab giấy · ghi chú mực đỏ tay · số tabular · scrapbook sticky) | INDEX-TAB DỌC vật lý làm điều hướng cấp thời gian · annotation tay đè lên nội dung in | đúng gu Story Set/ArchiNote kem; xác nhận pattern nhãn-rail-dọc của IF là NGÔN NGỮ TAB GIẤY — nên chuẩn hoá thành tab bấm được thay vì chữ trang trí |

## PHỤ LỤC · Đợt ảnh bổ sung #3 (2 ảnh chat 14/08)
| Ảnh | Cơ chế | Nạp |
|---|---|---|
| Miro board họp (canvas trắng khung màu theo vùng · sticky vàng · video call = DẢI THUMBNAIL người góc phải TRÊN canvas, không màn riêng · con trỏ mang tên màu) | videocall nhúng VÀO workspace làm lớp nổi nhỏ, canvas vẫn là vua; presence = con trỏ có tên | nuôi hệ workspace/collab chặng 2 (Mood+Collab) — khớp P1 |
| Editor 3D kiểu Spline (toolbar kính NỔI giữa-trên · trái Objects/Assets 2 tab + cây scene · phải inspector rollout theo nhóm Frame/Scene/Light/Effects có toggle · chip chọn nhanh Skin/Hair/Eyes NỔI cạnh đối tượng · gizmo màu + switch Ortho/Perspective capsule đáy) | tool 3D chuẩn mới: 3 vùng trái-cây/giữa-canvas/phải-rollout + control NỔI THEO ĐỐI TƯỢNG trên canvas | nuôi trực tiếp KB-1 + Vẽ 3D (Command3DPanel đã cùng hướng); chip-nổi-theo-đối-tượng = tầng ③ cử chỉ |
