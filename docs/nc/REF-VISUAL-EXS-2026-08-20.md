# REF-VISUAL EXS — 5 ảnh Hoà gửi 20/08, chưng cất → ÁP vào DS IF

> Luật đọc ref (phiếu EXS §2): học **composition/mechanism**, không copy skin Google/Apple/Dribbble.
> Mỗi ref: CƠ CHẾ → ÁP VÀO ĐÂU trong IF → TOKEN/PRIMITIVE → LUẬT RÀNG. Board vẽ lại bằng token IF:
> `docs/mocks/mock-exs-g-ref-ap-ds.html` (đã đẩy Claude Design, nhóm Experience System).

## R1 · Thước vạch chỉnh số (Google Photos slider: 52 · Brightness/Tone/Contrast · ↺)

- **Cơ chế**: giá trị số đứng ĐẦU capsule · thân là **DÃY VẠCH** — vùng đã qua vạch sáng-cao, vùng
  chưa qua vạch mờ-thấp, vạch tâm là mốc · nút **↺ reset về mặc định** ngay trên control · nhãn
  đang chỉnh đứng giữa, hai nhãn anh em mờ hai bên (lens switcher).
- **Áp vào IF**: mọi slider chỉnh số trong Work Panel — trước hết **MaterialPbrEditor** (panel
  tự sinh IF-RNA, đổi MỘT khuôn control là lan cả panel) · camera FOV/DOF · mức bám Grounded
  Render (núm per-mảng) · density Home.
- **Token/primitive**: cùng NGỮ PHÁP VẠCH với `LightBar`/`tien-trinh` (chốt 16/08 "thanh = dãy
  vạch") ⇒ MỘT ngôn ngữ vạch cho cả *tiến trình* lẫn *scrub input* — progress thì cấm bịa %,
  input thì số là GIÁ TRỊ NGƯỜI ĐẶT (hợp lệ). Vạch: `--t2`/`--t5` · capsule `--field` + `--r-full`
  · vạch tâm `--accent`. Nút ↺ = guardrail §34 "Recommended default/Reset" đặt NGAY TẠI control.
- **Luật ràng**: nhãn anh em mờ vẫn bấm được (không chỉ màu — có vị trí + chữ); ↺ có tooltip
  "Về mặc định (52 → 50)" nói rõ về đâu.

## R2 · Proximity emphasis (dock magnification: Using Proximity ↔ Direct Scaling)

- **Cơ chế**: hai mức phản hồi hover cho dải vật NHỎ xếp dày — *direct* (chỉ phần tử dưới trỏ
  nở) và *proximity* (hàng xóm nở theo, giảm dần theo khoảng cách) — proximity cho cảm giác
  "vật liệu sống" + tăng vùng bấm cho đích nhỏ (Fitts).
- **⚠️ ĐỤNG LUẬT ĐÃ CHỐT**: `SPEC-HOVER-FOCUS-IDF` — *"KHÔNG zoom mọi thứ; scale chỉ cho vật
  NHỎ/ĐƠN LẺ; nút toolbar·hàng list·ảnh lớn CẤM scale"*. ⇒ **KHÔNG áp cho ToolbarChip/rail** —
  toolbar giữ luật cũ (đổi nền 120ms).
- **Áp đúng chỗ (vật nhỏ xếp dày, được phép scale)**: dải thumbnail SlideStrip (Present) · dải
  ảnh shelf/gallery · dải swatch vật liệu. Mức nhẹ: direct 1.06, hàng xóm ±1 nở 1.02 (proximity
  bán kính 1 — không tạo sóng cả dải), 120–160ms, reduce-motion = đổi viền thay scale.
- **Chờ Hoà chọn**: direct-only ↔ proximity-1 (board vẽ cả hai cạnh nhau).

## R3 · Stack lùi sau (notification stack: thẻ trước nét, thẻ sau blur + thu + mờ)

- **Cơ chế**: nhiều mục cùng loại KHÔNG liệt kê hết — thẻ đầu đứng nét, 2-3 thẻ sau **thu nhỏ +
  mờ + blur nhẹ, ló mép** ⇒ đọc được "còn n cái nữa" bằng MỘT hình, bấm là xoè.
- **Áp vào IF**: Vitals Peek khi >3 insight (giữ trần 3–5 của UI budget — phần dư thành stack) ·
  widget "Cần tôi xử" · review thread nhiều issue cùng vùng · hàng đợi render.
- **Token/primitive**: đúng verb **RECEDE** + thang depth +3 của EXS-A; blur dùng `--blur` sẵn
  có; scale bậc 0.96/0.92; mép ló 8–10px. Xoè ra = EXPAND từ chính stack.
- **Luật ràng**: stack phải kèm SỐ ("+2") — không bắt người dùng đoán; reduce-motion: xoè tức thì.

## R4 · Thẻ là VẬT (folder card có giấy ló ra · call card ảnh tràn)

- **Cơ chế**: widget = **VẬT có hình dạng của thứ nó chứa** — folder vẽ như bìa kẹp giấy thật
  (tài liệu ló khỏi mép), metadata là chip pill nhỏ đè trên vật ("Friday, June 13" · "320 Notes");
  call card = ảnh TRÀN THẺ, chữ nằm trên dải phủ chuyển sắc, action (mic) là nút tròn nổi.
- **Áp vào IF**: thẻ Collection+/Files (folder-as-object — đúng "hai tầng" 17/08) · widget
  Chat/Họp khi có call · WeeklyImage/Ảnh đẹp tuần (đã ảnh tràn) · thẻ dự án ProjectSelect.
- **Token/primitive**: khớp chốt 16/08 **lớp phủ chuyển sắc cục bộ** (dìm dải có chữ, ảnh giữ
  nét — đo tương phản TẠI CHÂN CHỮ) + bảng icon loại 3 "icon nén tin luôn kèm SỐ". Bo `--r-4`,
  chip `--r-full`, phủ `linear-gradient` sang trong suốt.
- **Luật ràng**: vật-hoá KHÔNG thay nhãn chữ (NT-8) — tên folder vẫn là chữ thật; số "320 Notes"
  phải là số THẬT (widget thiếu dữ liệu tự ẩn).

## R5 · Presence + hành động nổi + quầng ấm (team collaboration card)

- **Cơ chế**: hàng avatar chồng "+N" · danh sách member có checkbox chọn · **nút hành động chính
  NỔI ĐÈ lên mép danh sách** (không chôn cuối form) · quầng sáng ấm rất nhẹ sau lớp panel tạo
  chiều sâu.
- **Áp vào IF**: `PresenceRow` (ĐÃ CÓ — icon loại 7, luật xếp chồng +N) trong ProjectOverview/
  thẻ dự án · Review Gate mời người duyệt · panel thành viên. Nút nổi = primary CTA của ngữ cảnh
  (đúng UI budget: 1 primary).
- **⚠️ ĐỤNG LUẬT**: NT-11 **cấm glow trang trí tĩnh** ⇒ quầng ấm CHỈ khi mang nghĩa trạng thái
  (có người ĐANG online/đang họp live — ánh sáng = presence đang sống); tĩnh thì tắt.
- **Token**: avatar viền `--border-strong`; quầng = `--accent-soft` hoặc màu presence, không hex mới.

## Hai điểm chờ Hoà (đã vẽ cạnh nhau trong board G)
1. R2: **direct-only ↔ proximity-1** cho dải thumbnail.
2. R5: quầng presence dùng **accent tím** hay **màu nhấn thứ hai** (đang chờ chốt mòng két↔mận)?

---

# ĐỢT 2 — 9 ảnh Hoà gửi tiếp 20/08 (board `mock-exs-h-ref-dot-2.html`)

## R6 · Thẻ upload (Project Brief.txt · 97.45 KB · 74% · ×)
- **Cơ chế**: thẻ tệp = VẬT — icon file + **badge đuôi tệp** đè góc · tên + dung lượng thật ·
  progress capsule riêng có % · nút × huỷ NGAY trên thẻ.
- **Áp IF**: drop-zone Files/ingest · hàng đợi nhập. Progress = `LightBar` loại **đo-được**
  (upload đo được ⇒ % hợp lệ, không phạm luật cấm-bịa-%). Badge đuôi tệp = icon loại 6
  (bảng 7 loại — là NỘI DUNG, được màu riêng). Mọi việc đang chạy phải huỷ được.
- **⚠️ ĐỤNG LUẬT**: quầng neon tím lớn = NT-11 glow trang trí + phiếu EXS cấm "AI purple
  language" ⇒ HỌC cấu trúc thẻ, BỎ neon. Nếu muốn ánh sáng: viền chạy = đang-chạy (tầng ③ 16/08).

## R7 · Cụm điều khiển capsule kính (tabs · ✦ · Ask AI · mic|wave|×)
- **Cơ chế**: control nổi = capsule kính RẤT TRONG (ít chữ) · segmented: ô đang chọn TÔ ĐẶC
  trong capsule trong · voice tách 3 phần mic | waveform | đóng.
- **Áp IF**: xác nhận `ToolbarBar` KB-1 đúng hướng · Vitals V2 controls · **voice companion**
  cho K-flow (Listening = waveform chạy TRONG khe, không orb). Đúng luật độ-đặc-kính: kính rất
  trong chỉ cho cụm ít chữ; thẻ số liệu vẫn kính đặc.

## R8 ⭐ · Thẻ việc AI hai theme (intent chip · timeline · kết quả · Publish · model picker)
- **Cơ chế — ref ĐẮT NHẤT cho Vitals V3 Engage**: hội thoại AI = **THẺ CÔNG VIỆC**, không phải
  chat dài: ① lệnh là CHIP có tham số SỬA ĐƯỢC tại chỗ ("dance *excitedly* ▾") ② tiến trình =
  timeline chấm dọc theo bước ③ kết quả là VẬT có định nghĩa (folder · 8 items · 226,4 MB)
  ④ hành động chính rõ (Publish →) ⑤ **model picker ngay trên thẻ** ("Sonnet 4.6 ▾").
- **Áp IF**: khuôn thẻ V3 Engage: intent chip = "ý định có cấu trúc" (luật 8) + Change reasoning
  (OS) · timeline = pipeline human-in-loop 6 bước OS · kết quả mang định nghĩa = cổng ra cửa sổ
  công cụ · model picker = **Own/Replace your AI** (hiến pháp OS + 3 lựa chọn runtime 15/08:
  Trong IF · Máy tôi có · Cloud) · mutation dừng ở nút người bấm.

## R9 · Rail ↔ expanded cùng trục (nhóm mờ · badge đếm · channels card · settings hàng icon)
- **Cơ chế**: level 1↔2 là CÙNG một vật nở ra — icon rail thẳng hàng với hàng expanded · tiêu đề
  nhóm chữ mờ nhỏ · badge đếm = pill số · nhóm channel gom vào card con · settings thu 1 hàng icon.
- **Áp IF**: xác nhận EXS-D rail↔shelf (REVEAL từ đúng nguồn). Badge đếm kèm SỐ + tên, không chỉ
  màu. **⚠️ ĐỤNG LUẬT**: wallpaper rực sau sidebar dày chữ — IF đã chốt: nền hình cho MÀN KHOÁ,
  vùng nội dung dày = kính đủ đặc/nền trầm. Avatar đứng ĐẦU rail (ref) ↔ đảo 3 CUỐI (phiếu EXS §5)
  — giữ theo phiếu, ghi nhận biến thể.

## R10 · Họp = spotlight (video primary · chat phải · Meeting Insight thành VIỆC)
- **Cơ chế**: đang họp thì video là PRIMARY, chat/participants = secondary phải; sau họp mỗi
  buổi thành HÀNG có số theo được (follow-up 2 · accomplished 9/10).
- **Áp IF**: workspace Chat/Họp (CẤP 0.5) + **meeting-distill** (chốt 11/08 "một buổi họp ba
  dòng chảy") — Meeting Insight row chính là mặt tiền của nó, follow-up nối TaskContext.
  **BỎ**: card "Upgrade to Pro" trong shell — phiếu EXS: shell không phải billing UI.

## R11 · Menu giải nghĩa (icon khối trên LƯỚI + tên + MỘT câu)
- **Cơ chế**: mục điều hướng lớn = icon isometric vẽ trên lưới kỹ thuật + tên + đúng 1 câu giá trị.
- **Áp IF**: xác nhận khuôn Ô GIẢI NGHĨA (Tooltip `hinh`+`desc` — R3 vừa cắm) + thẻ loại hồ sơ
  PresentDocTypePicker. Phong cách **nét-trên-lưới** khớp `thao-tac-glyph` (220×110, currentColor)
  ⇒ hướng MỞ RỘNG kho glyph hiện có khi cần icon minh hoạ lớn — KHÔNG lập icon system mới
  (GUARDIAN phiếu cấm).

## R12+R13 · Hai empty state (ghost cards + 1 câu + 1 CTA)
- **Cơ chế**: màn trống = bản xem trước mờ của thứ SẼ có + một câu mời + một nút.
- **Áp IF**: `EmptyState` ĐÃ CÓ đúng khuôn này (ghost bays/rows + action tại chỗ) — xác nhận,
  không việc mới; H5 First Run (EXS-C) đã vẽ theo.

## R14 · Filter popover (ô tìm đầu · hàng icon+tên+badge SỐ đang áp+›)
- **Cơ chế**: dropdown dài mở đầu bằng Ô TÌM · mỗi hàng mang badge SỐ bộ-lọc-đang-áp · › submenu
  · hover nền sáng rõ.
- **Áp IF**: khớp nguyên chốt 16/08 "dropdown dài phải có ô tìm + gõ-tiếp" (grep 0 — vẫn là nợ
  thi công). Badge số-đang-áp = icon-nén-tin kèm số; áp cho Filter của Library/Gallery/BOQ/Tasks.

## Chờ Hoà thêm (đợt 2)
3. R8: model picker đặt NGAY trên thẻ Vitals (ref) hay trong Settings AI (kín hơn)?
4. R9: badge đếm dùng màu nào — trung tính `--field`+số, hay `--accent-soft`? (cam như ref dễ
   giẫm vùng `--warning`.)

---

# ĐỢT 3 — 2 ảnh 20/08 (board `mock-exs-i-moodboard-3d.html`)

## R15 · Moodboard COLLAGE — Hoà CHỈ ĐỊNH: "lấy bố cục dạng này cho concept creative
## moodboard, hoặc là MỘT TUỲ CHỌN bố cục đặc trưng của dân designer"
- **Cơ chế**: moodboard = collage các VẬT chồng lấn tự do — ảnh hero + mảng màu hình học
  (tròn/chữ nhật bo) + **thẻ palette TRÍCH TỪ ẢNH** (ảnh tròn + 4 swatch + nút Copy) + chip
  hành động nổi đè ("Color scheme").
- **Áp IF**: Cửa Sổ Thảo Luận tab Moodboard + `MoodboardModal`/`out.moodboard` — thêm **layout
  preset thứ 2: Lưới ↔ Collage** (collage là tuỳ chọn đặc trưng, lưới vẫn là mặc định gọn).
  Palette trích ảnh = **REUSE `refingest` palette local đã có** (`refingest.ts:105-120`) — 0 engine
  mới. Swatch bấm → bước CHỌN MÀU trong chọn vật liệu (chốt "màu là một bước") · Copy →
  nạp Thẻ DNA / Brand Kit dự án (qua ProposalSheet, người duyệt).
- **Ranh giới màu**: cam đất/navy/rêu trong ref là **MÀU NỘI DUNG** (trích từ ảnh người dùng) —
  hợp lệ, không phải màu UI; chip hành động của IF vẫn dùng token hệ.
- **Trạng thái**: Hoà chỉ định bằng lời ⇒ ghi CHỐT NHẸ layout-preset Collage; cách thi công
  (trong CuaSoThaoLuan hay MoodboardModal trước) chờ phiếu.

## R16 · Bàn 3D tĩnh lặng (cube · Rotation 35° · Lightning Spot/Area/Target/Sun · slider vạch)
- **Cơ chế**: ① **con số thao tác hiện TO ngay tại VẬT** ("Rotation 35°" dưới khối + vòng dial
  quanh vật) — number-first ② tool list dọc: active = khối đặc tương phản mạnh ③ kiểu đèn =
  LƯỚI Ô CHỌN icon+nhãn (Spot/Area/Target/Sun) ④ slider = vạch mảnh trên nền lặng ⑤ panel
  không viền hộp — canvas được bảo vệ tuyệt đối.
- **Áp IF**: mode Vẽ 3D — số-tại-vật khi xoay/kéo (nối §22 numeric: gõ số đè trực tiếp, Enter
  chốt) · **light picker ô-chọn cho `Doc.lighting`** (chốt 10/08 "Chiếu sáng là workspace trong
  3D, dùng chung Doc.lighting"; Command3DPanel đã có tab 'đèn' — đổi mặt sang lưới ô chọn) ·
  dial quanh vật = near-object manipulation (họ gizmo, không menu tròn 20 nút) · slider vạch =
  cùng khuôn R1.
- **Luật ràng**: số hiện tại vật là số THẬT của thao tác đang diễn ra; active-đen tương phản
  mạnh khớp NT-5 ghost-khi-bật? — KHÔNG: ref dùng khối đặc; IF giữ ghost `--accent-soft` theo
  DS hiện có, chỉ lấy nguyên tắc "active phải đọc được tức thì".
- **⭐ HOÀ CHỐT GIỮA LƯỢT (20/08)**: *"cubic nét, sang, đơn giản cho stage Vẽ 3D"* — R16 nâng
  từ cơ-chế lên **VISUAL DIRECTION của mode Vẽ 3D**: khối wireframe NÉT MẢNH (không tô đặc khi
  dựng) · nền tĩnh lặng · panel không viền hộp (nhãn + giá trị trên nền) · số đo to tại vật ·
  chất "bản vẽ kỹ thuật thanh lịch". Áp qua TOKEN 2 theme (không khoá vào nền xám sáng của ref);
  render/PBR vẫn là chuyện của Render mode — đây là chất của lúc DỰNG.

## Chờ Hoà (đợt 3)
5. R15: Collage đặt ở đâu trước — tab Moodboard của Cửa Sổ Thảo Luận hay MoodboardModal?
6. R16: số-tại-vật hiện LUÔN khi thao tác hay chỉ khi giữ phím (vd giữ Shift)?
