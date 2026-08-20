# CHỐT · IF EXPERIENCE SYSTEM — Hoà tổng hợp 20/08/2026

> Nguyên văn Hoà: *"Đây là bản tổng hợp sáng giờ, coi như TRẠNG THÁI CHỐT hiện tại của IF
> Experience System."* — 12 điều + nhóm pattern phụ + một câu lõi.
> Bản vẽ đối chiếu: 9 board `EXS-A…I` trên Claude Design (nhóm "Experience System") + sổ ref
> `docs/nc/REF-VISUAL-EXS-2026-08-20.md` (R1–R16).
> File này là BẢN CHỐT; thi công vẫn chờ Hoà eye-approve từng board (HARD STOP phiếu EXS giữ nguyên).

## CÂU LÕI

> **InteriorFlow phải có "luật vật lý" riêng: một shell, ba stage authoring, master capabilities
> xuyên stage, intelligence sống trong context, depth/motion có ngữ nghĩa, mặc định luôn đẹp và
> usable, còn chiều sâu chỉ xuất hiện khi người dùng cần.**

## 12 ĐIỀU CHỐT (kèm đối chiếu)

| # | Chốt | Đối chiếu |
|---|---|---|
| 1 | MỘT trải nghiệm, một mental model Home→Files→2D→3D→Review→Present; **DS hiện tại là canonical**, mọi thứ mới theo REUSE→VARIANT→EXTEND→NEW; học Apple cách xây HỆ, không copy skin | = EXS-A/B; khớp B25 no-rebuild |
| 2 | Shell thích nghi, cấu trúc ổn định — **luật không gian 5 vùng**: Left=Where am I · Center=What am I doing · Right=What matters now · Near pointer=What next · Top edge=What should I know; UI biết Project/Workspace/Stage/selection/tool/revision rồi quyết hiện–im | = EXS-A §① |
| 3 | **Sidebar 3 CỤM** (Workspace chung · ba chặng · cá nhân/hệ thống), vertical islands cùng một trục, không sitemap 30 feature | 🔴 **ĐÈ chốt "HAI CỤM" 16-17/08** — MAP §2.2 + Blueprint B6 cần cập nhật (việc phiên chính/T; đã báo MAIN) |
| 4 | **Sidebar 3 độ sâu**: Rail 52–56px icon-only · Context Shelf 220–280 · Work Panel 320–440 resizable; ba mức = ba năng lực; vào chặng mặc định rail gọn bảo vệ canvas | = EXS-D. 🟡 DRIFT code: `BE_RONG_NAC = 28/240/320` (`muc-dieu-huong.ts:50`) — thi công sẽ đổi 28→52-56 và nới trần panel 320→440 |
| 5 | Mỗi stage 1 **Primary + 1 Secondary spotlight** (Home: Resume/Needs-attention · 2D: Canvas/tool-selection · 3D: Viewport/selection-material · Review: thứ-đang-review/decision · Present: story/source-release) | = EXS-A §④, EXS-B |
| 6 | **Home = Personal Work OS** — mặc định tươm tất ngay; tuỳ biến sâu trong guardrail DS (add/hide/reorder/resize/pin, density, mode, preset, visual mood); lens Focus/Manage/Explore/Review/Inspire = cấu hình của CÙNG một Home; trả lời nhanh: đang làm gì · dở đâu · cần xử gì · làm gì tiếp | = EXS-C. **Hero = Resume CHỐT** (đóng câu hỏi #5 đợt 1) |
| 7 | **Vitals = signature interaction**: nằm VẬT LÝ trong top edge như aperture sống (không phải popover gắn lên) · 3 mức Ambient→Peek(1–3 insight)→Engage · **morph nhẹ theo context, không giật** · khác notification: trả lời "điều gì đáng biết NGAY Ở ĐÂY" | 🔴 **ĐÈ chốt 16/08 "Vitals neo theo ngữ cảnh (chấm cạnh ô tìm · nút rời cạnh trục phải)"** → SUPERSEDED. Câu chữ "không phải popover gắn lên" nghiêng **V3-a (morph từ chính aperture)** — chờ Hoà xác nhận trên board EXS-E |
| 8 | **Voice = input contextual**, không chatbot; shell đã biết context; flow Listening→transcript→interpretation→answer→proposed action→**human confirm nếu mutation**; không silent mutation | = EXS-E §④ + R7 voice pill |
| 9 | **Right edge = Context Intelligence Stack** — lens Selection/Vitals/History/Review/Output trên CÙNG entity; Peek→Inspect→Deep; kèm primitive nghề: **Measured/Verified/Inferred/External/Stale · Go to Source · Where Used · Blast Radius Preview** | = EXS-A §⑦ + EXS-E §①② + EXS-F flow I |
| 10 | 🆕 **Master Capability System**: 3 stage = 3 **Authoring Environments** thiết kế từ NỘI DUNG người dùng muốn tạo, không từ danh sách tool; một capability chiếu ra nhiều stage giữ cùng mental model; **surface 4 độ sâu: Near-pointer capsule → Adaptive Toolbelt/Toolbar → Context Shelf/Inspector → Deep ToolWindow**; toolbar = **working set 4–8 capability** theo context, không chứa toàn bộ feature | MỚI so với board (EXS chưa vẽ thang 4 độ sâu capability). Ăn khớp sổ lệnh một-nguồn (B1/B2 đã chạy, R3 vừa cắm) + `kien-truc-tool-3-lop` — "working set" là bước tiến của tầng ② |
| 11 | **Tool interaction chất nghề**: capsule ngữ cảnh 3–6 action khi chọn · tool sâu có **Essentials ⇄ Advanced** · ToolWindow floating→dock→pin→collapse · numeric chắc tay (drag + gõ số trực tiếp, Enter/Esc/Tab) · **semantic icon đọc nghĩa <1s, cấm placeholder glyph trừu tượng** · mọi surface có state, motion tinh tế | = EXS-F flow H + §⑪ states; Essentials⇄Advanced khớp khuôn 2-tầng đã chốt (ổ giải nghĩa 16/08) |
| 12 | 🆕 **Non-destructive authoring + Library/CAD semantics**: chuỗi **Library Definition → Representation → Project Instance → Override / Edit Definition → Update → Where Used** · một semantic asset có plan/elevation/section/3D representations · **anchor/snap point là first-class** · **Replace giữ position/orientation/context** · 2D↔3D giữ semantic identity, không convert mù · **BuildRecipe/Modifier Stack là frontend tự nhiên** của non-destructive | Ăn thẳng vào nền có sẵn: `.idfc` một-chiều + đè cục bộ (B10/B12) · matId representation map · BuildRecipe 10 op ĐANG CÓ. MỚI: Edit-Definition→Update propagation + anchor first-class + Replace-preserve — chưa có board, chưa có code |

## PATTERN PHỤ ĐÃ GHI NHẬN (giữ)

- **Explore/Gallery = discovery surface** của Reference/Library — KHÔNG phải stage thứ tư (khớp chốt 12/08 "Gallery = mặt tiền tuyển chọn của kệ Ảnh").
- **Section Navigator `01/02/03…`** cho Present/Review.
- **Semantic Action Strip** ở đáy: "vừa xảy ra gì" + Undo + Where Used (họ hàng StatusBar hiện có).
- Upload/import = **progress card giàu ngữ nghĩa** (R6).
- **Empty state = workflow surface** (EmptyState hiện có đã đúng).
- **Filter panel sâu nhưng scan nhanh** (R14 + chốt dropdown-có-ô-tìm 16/08 — vẫn nợ thi công).
- **Collaboration = presence/review context**, không social feed.
- AI sinh bố cục → **Layout Ghost / Auto Grid Skeleton**: dựng CẤU TRÚC trước rồi đổ nội dung — user thấy hệ thống đang tổ chức, không random (khớp Magic/GenerateFlow + luật human-in-loop).

## HỆ QUẢ SỔ SÁCH (con trỏ, không tự sửa tài liệu phiên chính)

1. **SUPERSEDED mới**: ① "sidebar HAI CỤM" (16-17/08) → **BA CỤM** ② "Vitals neo theo ngữ cảnh — chấm cạnh ô tìm/nút rời trục phải" (16/08) → **Vitals Aperture top-edge**. → MAP §2.2 + Blueprint B6/B22 cần cập nhật + thêm mục SUPERSEDED (việc phiên chính T — đã nhắn MAIN 20/08).
2. **DRIFT code sẽ phải thi công** (khi Wave/phiếu mở): `BE_RONG_NAC` 28→52-56 · Work Panel trần 440 · bento thêm hero 2×2 Resume · aperture primitive mới.
3. **Hàng câu hỏi còn mở** (rút từ 8 câu cũ, 3 đã được bản chốt này trả lời): ① V3 Engage xác nhận V3-a? ② model picker trên thẻ Vitals hay Settings? ③ badge đếm trung tính hay accent-soft? ④ R2 direct ↔ proximity-1? ⑤ quầng presence màu gì (chờ mòng két↔mận)? ⑥ Collage ở CuaSoThaoLuan hay MoodboardModal trước? ⑦ số-tại-vật luôn hiện hay giữ phím?
4. **Board nợ tiếp theo** (sau khi Hoà eye-review A–I): EXS-J = thang 4 độ sâu capability (điều 10) + EXS-K = chuỗi Library Definition→Update (điều 12) + Section Navigator/Action Strip.

## HẠN DÙNG
Bản chốt trải nghiệm — hiếm đổi, chỉ Hoà lật. Thi công từng phần vẫn qua phiếu + eye-approve;
con số px (52–56/220–280/320–440) là KHOẢNG chốt, số chính xác chốt lúc build theo token.
