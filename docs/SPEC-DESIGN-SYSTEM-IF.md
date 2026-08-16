# SPEC — DESIGN SYSTEM IF (tokens + motion + component chung)

> Hoà 02/08: *"tìm điểm chung của UI + motion → tạo design system cho app."* Rút từ loạt mock đã chốt
> (render-layout · mood-collab · ve3d · library). Nối `SPEC-CHANG2-UI-2MODE` · `SPEC-VITALS-VISUAL`.

## 1 · Màu (token)
| Token | Hex | Dùng |
|---|---|---|
| bg | `#eceae7` | nền app (sáng) |
| panel | `#ffffff` | mặt panel/card |
| line | `#e6e3de` | viền |
| ink | `#2b2b30` | mực chính |
| mut | `#9a9aa2` | chữ mờ |
| **accent** | `#6a57f5` | nhấn (Vitals) — DÙNG DÈ, 1 accent |
| accent-soft | `#efeafe` | nền nhấn nhẹ |
| chip | `#f4f2ef` | nền chip/segmented |

**Màu loại (node/nhánh):** Mood/Sinh-AI `#e8804d` · Master/AI `#6a57f5` · Thường/OK `#3fb984` · Logic `#4a90e2` · Comment `#e86a9a` · Cảnh báo `#e0a43a`.
**Trục 3D:** X `#e05c5c` · Y `#3fb984` · Z `#4a78e0`. **Badge phạm vi:** Chung(lá)·Studio(tím)·Chặng(dương)·Dự án(cam).

## 2 · Hình khối
Bo góc **10 / 14 / 20 / 28** (`--radius-sm/md/lg/xl`) — ⚠️ **SỬA 02/08: lấy theo `app/globals.css` THẬT, spec cũ ghi 6/9/12/16 là Cowork tự chế, sai**. Cỡ chữ **12/14/16/20/28** (`--fs-xs…xl`), weight 400/600. Nhoè: `--blur 22px` · `--blur-strong 40px`. Nhịp: `--ease-apple cubic-bezier(.32,.72,0,1)` · `--dur-fast .18s` · `--dur-base .32s`. Bóng card `0 6px 16px rgba(40,38,35,.14)`; panel `0 12px 40px rgba(40,38,35,.10)`. Nút chạm tablet **≥34px**. Chữ system sans, 9–17.

## 2b · Ngôn ngữ bề mặt (Hoà note 02/08)
- **Apple system design (HIG)** làm chuẩn cảm giác: rõ, phẳng, ít viền, spacing thở.
- **Kính lỏng/mờ (Liquid Glass · frosted)**: tool window, popover Vitals, panel nổi = nền blur
  `backdrop-filter` + biên sáng — khớp chốt "kính là VỎ không RUỘT" (`CHOT-RENDER-TOOL-WINDOW`).
- **Toàn bộ motion** theo §3 — mọi chuyển cảnh đều có spring, không cắt khô.

## 2c · LUẬT CHỐNG NGÔ NGHÊ (Hoà chê bottom bar 02/08 — áp MỌI UI về sau)
1. **Một khối một bóng** — control cùng chức năng đứng cùng bar; CẤM pill rời lệch cao độ/bo góc/bóng.
2. **Nhịp cố định**: bar cao 44 · nút 34 · icon 15 · cách 5 · bo 14 ngoài / 9 trong — không số lẻ tuỳ hứng.
3. **Một bộ icon** (lucide), 1 cỡ 1 độ đậm — không trộn emoji/glyph tạp.
4. **Trạng thái nói bằng màu nền** (accent-soft/accent) — không viền đậm, không chữ hoa.
5. **Số dùng `tabular-nums`** (zoom % không nhảy bề rộng).

## 2d · HÌNH HỌC APPLE (Hoà chốt 02/08 — bổ chính §2, thắng khi mâu thuẫn với bo 6/9/12/16)
- **Thang shape**: icon nét VUÔNG → panel/nút BO GÓC → bar/pill nổi = **CAPSULE** (bo = cao/2) → núm/avatar/badge chấm = **TRÒN**.
- **Bo ĐỒNG TÂM** *(concentric)*: bo-trong = bo-ngoài − khoảng-đệm. Ví dụ chuẩn bottom bar: bar cao 44 → r22, đệm 5 → nút 34 → r17 (tự thành capsule) → track switch 22/r11 → núm tròn 18.
- Panel chữ nhật lớn (sidebar, window, card) vẫn theo bo 12/16 §2 — capsule chỉ dành cho BAR/PILL NỔI.
- **Squircle (đường cong liên tục)** — Apple KHÔNG dùng bo tròn thường; cung liên tục để cạnh thẳng nối vào góc không bị "gãy". CSS thường chưa làm được: khối LỚN (thẻ, panel, ảnh bìa) dùng mask SVG/`corner-shape` nếu trình duyệt hỗ trợ; nút/chip nhỏ giữ `border-radius` thường (mắt không phân biệt được, không đáng đánh đổi hiệu năng).

✅ **Kiểm chứng 02/08 (Hoà hỏi "cái nào đúng Apple hơn?")**: thang **10/14/20/28 ĐÚNG Apple** — 10 = sheet iOS/cửa sổ macOS · 14 = hộp thoại cảnh báo iOS · 20/28 = thẻ lớn/widget. Thang 6/9/12/16 mà Cowork từng ghi là nhịp **Material/Tailwind**, không phải Apple. Code `globals.css` đúng ngay từ đầu.

## 2e · LUẬT PORT MOCK → CODE (bài học /settings tối 02/08)
1. Hex trong mock = giá trị của THEME SÁNG. Khi port, **map hết sang CSS var app** (`globals.css`): #edebe7→nền · #fff→panel/--nen-mo-card · #e4e1db→--border · #26262b→--t1 · #8f8f97→--t2 · #6a57f5→--accent · #efeafe→--accent-soft. **Cấm hardcode hex trong component.**
2. Theme Tối = tự ăn qua biến — **cấm tự chế bảng màu tối riêng**. Test cả 2 theme, chữ phải đạt tương phản.
3. Kích thước phần tử = px cố định như mock trong container 1440 — cấm 1fr/vw làm phình theo màn.
4. Icon trong mock là placeholder → thay lucide đích danh (mock mới sẽ nhúng SVG lucide thật).

## 3 · Motion (nối SyncWork Reanimated)
- **Spring `withSpring`** gốc, không ease cứng; nhẹ, ngắn.
- Mở tool window = **scale 0.96→1 + fade**; đóng ngược lại.
- Gạt mode = **crossfade cả shell** (canvas+sidebar), không giật.
- Presence/con trỏ lerp mượt. **`prefers-reduced-motion` THẮNG tất cả.**

## 4 · Component chung (1 nguồn, mọi chặng)
Button · Badge(4 phạm vi) · **Node card**(dot loại + cr) · **Tool window**(kính·play·X·cổng nối) · **Toolbar bút**(bút·marker·highlight·tẩy) · **Presence**(on màu/off xám + mời) · **Mode toggle**(gạt) · **Bottom zoom bar** · **Axis gizmo + ViewCube** · **Material swatch**(matId) · Comment pin · Named cursor · Mindmap node · **Inspector panel**(phải: node/file/template) · **Vitals glyph**(cầu kính+electron, 1 accent, 4 trạng thái nghỉ/nghe/nghĩ/trả lời; **chế độ LM = 1 cửa chat AI + chat nhóm** — `SPEC-VITALS-VISUAL`/`SPEC-VITALS-AI`).

## 5 · TRIẾT LÝ THIẾT KẾ XUYÊN SẢN PHẨM (Hoà chốt 02/08 — §2c/§2d không chỉ cho VỎ app)
Cùng một hình học áp cho CẢ HAI tầng:
1. **Vỏ app (chrome)** — bar/panel/window như §2–§2d.
2. **SẢN PHẨM app sinh ra cho người dùng** — nơi IF thể hiện "gu":
   - **Template Deck / DECK_STANDARDS**: lưới, nhịp spacing, thang shape, bo đồng tâm áp vào card/khung ảnh/nút trong slide mẫu.
   - **Magic dàn trang (auto-layout)**: kết quả sinh PHẢI qua cùng bộ luật — nhịp cách đều, shape nhất quán, không số tuỳ hứng (nối luật chữ Việt `LUAT-CHU-VIET-7.1.23`).
   - **Material board A3 · BOQ · Word biểu mẫu**: cùng họ lưới + bo + nhịp.
   - **Template Kệ Thư viện (form lập luận, moodboard)**: node/nhánh/badge theo đúng token + thang shape.
3. Hệ quả: checklist §2c là **cửa nghiệm thu** cho mọi output thiết kế — kể cả thứ AI sinh; sản phẩm "đầy tay như Canva" nhưng kỷ luật hình học như Apple. Đây là điểm bán hàng, không phải trang trí.

## 6 · TOKEN INFERENCE + TRỤC — COWORK-UI chốt 04/08 (việc 0 đợt 2, theo `SPEC-VE-INFERENCE` §2 · TỔNG duyệt)

**Nguyên tắc chốt (qua §0b đủ 3 bước):** ① KHÔNG sinh màu mới ở theme Tối — 6 token trỏ về giá trị ĐÃ CÓ trong hệ (trục 3D §1); ② theo 00-CHOT "trục 2D dùng CÙNG token trục 3D, không sinh cặp thứ hai" → `--axis-*` là token chính thức cho CẢ 2D lẫn 3D; ③ muscle memory SketchUp giữ nguyên (endpoint lục · midpoint lam · on-edge đỏ · trục X đỏ/Y lục); ④ theme Sáng đậm hoá cùng hue để glyph đạt ≥3:1 (WCAG 1.4.11 non-text) trên nền `--bg` sáng — cùng logic globals.css đã làm với `--success` (#46b876→#107043).

| Token | Tối (`#0c0c0e`) | Sáng (`#f2efe9`) | Áp cho | Nguồn giá trị |
|---|---|---|---|---|
| `--snap-point` | `#3fb984` | `#1c8a5b` | endpoint · node | = trục Y (SketchUp: endpoint lục) |
| `--snap-derived` | `#4a78e0` | `#2f5bc4` | midpoint · center · quadrant | = trục Z — 2D không có Z, tái dùng an toàn (SketchUp: midpoint lam) |
| `--snap-edge` | `#e05c5c` | `#c23f3f` | nearest · intersection · perpendicular · tangent | = trục X (SketchUp: on-edge đỏ) |
| `--snap-grid` | `var(--accent-soft)` | `var(--accent-soft)` | grid | lưới là nền, mờ theo accent |
| `--axis-x` | `#e05c5c` | `#c23f3f` | đường gióng ngang + trục X 3D | §1 trục 3D |
| `--axis-y` | `#3fb984` | `#1c8a5b` | đường gióng dọc + trục Y 3D | §1 trục 3D |
| (`--axis-z`) | `#4a78e0` | `#2f5bc4` | trục Z 3D (đặt tên luôn cho đủ bộ) | §1 trục 3D |

**Xử va màu (đã cân nhắc, không phải bỏ sót):**
- Lục snap `#3fb984` ≠ `--success #46b876` — hai lục KHÁC ngữ cảnh (glyph tại con trỏ giữa canvas vs badge/chấm trạng thái trong panel), không bao giờ đứng cạnh nhau; SketchUp cũng chấp nhận endpoint lục = trục Y lục, phân biệt bằng HÌNH (chấm vs đường). Điều bị cấm là hai lục XẤP XỈ trong cùng canvas — vì vậy snap-point = axis-y ĐÚNG 1 giá trị, không lấy `#35b46f` đề xuất cũ (xấp xỉ mà không bằng).
- Đỏ snap-edge `#e05c5c` ≠ `--danger #e5674f` (đỏ-cam) — danger chỉ sống trong chrome UI/toast, không vẽ lên canvas.
- Contrast đã tính (non-text ≥3:1): Tối 7.6/4.4/5.2 · Sáng 3.75/5.0/4.4.

**Handoff:** ① CHINH thêm 7 biến trên vào `app/globals.css` cả 2 khối theme (vùng CHINH — Cowork không chạm css app); ② PHU/CHINH khi nối `drawSnap` đổi fallback trong `var(--snap-point, …)` theo bảng này (fallback cũ `#35b46f`/`#d05b5b`/`#3f8fd6` trong SPEC-VE-INFERENCE là đề xuất thô, đã thay); ③ mock nào vẽ inference từ nay dùng đúng 7 biến này.

---
*Cowork ghi 02/08/2026. Nguồn token cho code — cùng tinh thần SyncWork (1 accent, motion spring) nhưng IF là hệ token RIÊNG.*