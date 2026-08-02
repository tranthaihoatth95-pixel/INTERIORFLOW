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
Bo góc **6/9/12/16** (chip·nút·card·panel). Bóng card `0 6px 16px rgba(40,38,35,.14)`; panel `0 12px 40px rgba(40,38,35,.10)`. Nút chạm tablet **≥34px**. Chữ system sans, 9–17.

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
- Corner mượt kiểu Apple *(continuous corner/squircle)* khi nền tảng cho phép.

## 2e · LUẬT PORT MOCK → CODE (bài học /settings tối 02/08)
1. Hex trong mock = giá trị của THEME SÁNG. Khi port, **map hết sang CSS var app** (`globals.css`): #edebe7→nền · #fff→panel/--mat-card · #e4e1db→--border · #26262b→--t1 · #8f8f97→--t2 · #6a57f5→--accent · #efeafe→--accent-soft. **Cấm hardcode hex trong component.**
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

---
*Cowork ghi 02/08/2026. Nguồn token cho code — cùng tinh thần SyncWork (1 accent, motion spring) nhưng IF là hệ token RIÊNG.*