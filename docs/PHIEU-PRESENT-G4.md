# PHIẾU GIAO VIỆC — PRESENT DỌN SỐNG/CHẾT · vùng G4
**COWORK-TRÌNH lập theo hàng đợi bơm đêm 04/08 (`SO-KIEM-TONG` §3) · TỔNG duyệt gom 7 mục sống (BAO-CAO-DEM 23:5x).**
**Nguồn rà:** `BAO-CAO-COWORK-TRINH.md` mục VIỆC 3 (bằng chứng git từng dòng). Vùng file: `components/present-editor/*` + `lib/present-editor/*` (Present editors = **G4** theo §2 — ticket cũ ghi "code phụ" đã lỗi thời).
**Cơ chế:** ship-trước-sửa-sau (BAO-CAO-DEM 23:4x) — làm thẳng, Hoà duyệt ảnh hậu kiểm. Riêng V5 có cổng ảnh TRƯỚC merge (đổi UX lớn).

## KẾT QUẢ VERIFY 3 MỤC 🟡 (đọc code, 04/08 — đóng tại đây)
| Mục | Kết luận | Bằng chứng |
|---|---|---|
| Picker màu chữ ≤2 click | ✅ ĐẠT — không cần code thêm | `TextToolbar.tsx:78-290` — toolbar nổi tự hiện khi chọn chữ; click 1 mở popover (palette gu deck + đen/trắng + custom `type="color"`:404), click 2 chọn |
| Export bake đúng (không vệt, màu AA) | ✅ ĐẠT MỨC CODE | `render.ts:34` import `autoShadowCanvasLayers`; `:410` bóng mảnh P6a khi AA-fix thiếu; filter E4 bake `:220,:286` → còn 1 lần đối chứng pixel (N1 dưới) |
| So 2 vùng ảnh Hoà khoanh | ⏳ KHÔNG kết luận được bằng code | vùng xám "le que" chắc chắn CHƯA đạt trọn vì V2/V3 chưa làm → nghiệm thu N2 sau V2+V3 |

## VIỆC — làm theo thứ tự V2 → V3 → V1 → V4 → V6 → V5 → N (nghiệm thu)

### V2 · Cụm "Hiệu ứng" lên Toolbar (P6b bước 2)
- **Gì:** thêm cụm thứ 3 vào `Toolbar.tsx` sau cụm "Sắp xếp" (`fa29820` là mẫu pattern): nút **Fill** (E3) · **Mask** (E2) · **Filter** (E4) · **Bóng/Mờ** (opacity+shadow). KHÔNG thêm nút màu chữ — đã đạt ≤2 click qua TextToolbar nổi (verify trên).
- **Cách:** mỗi nút mở popover mini chứa ĐÚNG control Inspector đang có — extract control thành component dùng chung, CẤM copy-paste đôi. Gating disabled theo selection: **CÙNG công thức Inspector** như P6b bước 1 đã làm (`Toolbar.tsx:108` ghi rõ cách).
- **Luật buộc:** popover = kính nổi → **PHẢI portal ra body** (`TICKET-FIX-KINH-HEADER` K4, không lồng trong chrome kính). Hover theo `SPEC-HOVER-FOCUS-IDF` (nút toolbar: đổi nền 120ms, CẤM scale). Nhãn ≤12 từ, không jargon (`SPEC-NGON-NGU-CHI-DAN`).
- **Nghiệm thu:** chọn 1 ảnh → 4 nút sáng; chọn chữ → Fill/Mask disabled đúng gating; mỗi popover đổi thuộc tính thấy live; đủ 2 theme.

### V3 · Màn hẹp: cụm thu thành menu ▾ (P6b còn lại)
- **Gì:** Toolbar tràn ngang thì thu CỤM thành 1 nút ▾ — không rớt mất chức năng nào (nguyên văn ticket).
- **Cách:** đo bề rộng bằng ResizeObserver trên container Toolbar (hoặc container query nếu `globals.css` đã có tiền lệ — grep trước). Thứ tự thu: **Hiệu ứng trước → Sắp xếp sau → cụm Chèn không bao giờ thu**. Menu ▾ tái dùng pattern `components/ui/IOMenu.tsx` (đã dùng chung 3 chặng — `Toolbar.tsx:166`). Item trong menu = đúng nút cụm, cùng gating.
- **Nghiệm thu:** kéo cửa sổ 1440→900px: cụm thu dần, mọi lệnh vẫn với tới ≤2 click; 2 theme.

### V1 · Rà BUILTIN_TEMPLATES gỡ vệt trang trí (P6a phần chót)
- **Gì:** `lib/present-editor/templates.ts:198` — 6 preset (Cover · Content+image · Two-column · Grid · Quote · Full-bleed). Grep chữ "scrim" = 0 → vệt nếu có nằm dạng **shape rect tối mờ kê dưới chữ**.
- **Tiêu chí nhận diện vệt:** rect nằm NGAY DƯỚI text trong z-order · fill đen/tối · opacity ~0.2-0.6 · bbox phủ bbox chữ. Nghi nhất: Cover + Full-bleed (chữ đè ảnh).
- **Cách xử:** gỡ rect đó khỏi preset mặc định, thay bằng cơ chế P6a (autoColor AA + autoShadow đã có). KHÔNG xoá năng lực scrim khỏi model (ticket gốc: có template cần thì bật tay).
- **Nghiệm thu:** áp từng preset lên slide có ảnh sáng + ảnh tối — chữ đọc được cả 2, không vệt.

### V4 · Flip từng phần tử (audit #1 mục chót — 2.3.42)
- **Gì:** lật ngang/dọc TỪNG phần tử (hiện chỉ có `mirrorSlide` lật cả slide — `templates.ts:1345`).
- **Cách:** `model.ts` thêm `flipX?: boolean; flipY?: boolean` vào element base — **additive** như `filter` đã làm (`.idfp` cũ không có field vẫn render y hệt, xem ghi chú `model.ts:193`). Hiển thị: `Element.tsx` transform `scale(±1, ±1)` (đặt NGOÀI css filter). Export: `render.ts` `ctx.scale` mirror — nối CẢ 2 đường như E4. UI: 2 nút "Lật ngang · Lật dọc" vào **cụm Sắp xếp** có sẵn + Inspector.
- **Nghiệm thu:** flip ảnh + shape + chữ → export PNG so khớp màn hình; undo/redo sống; file cũ mở không đổi.

### V6 · Màn chọn 5 loại hồ sơ + tách lối vào Magic 【GỘP-H4 — khớp việc 4 hàng đợi G4】
- **Bối cảnh:** `802f808` H4 hoãn nay hết hoãn theo hàng đợi G4 mục 4; `mock-present-chooser.html` CHƯA tồn tại → G4 tự dựng theo đặc tả này (ship-trước, mock COWORK-UI về sau = tài liệu polish).
- **Màn chọn (vào chặng Trình bày khi CHƯA có hồ sơ):** 5 thẻ — **Deck · Bảng vật liệu A3 · Bảng tính BOQ · Văn bản · Video** (`SPEC-MODE-PER-STAGE` §4). Thẻ có editor thật mới enable: Deck ✅ · Bảng vật liệu A3 (theo `SPEC-TRINH-MATERIAL-A3.md`) · BOQ/Văn bản/Video = disabled + nhãn "Sắp có" theo khuôn `SPEC-NGON-NGU-CHI-DAN` (≤12 từ, có NÚT quay lại). Trong AppShell, đúng token `globals.css`, 2 theme, bo 10/14/20/28, thẻ hover 1.02+lift 2px 200ms (`SPEC-HOVER-FOCUS-IDF` — thẻ là vật đơn lẻ, được scale).
- **Hai lối vào mỗi thẻ Deck:** "Tự dàn" (editor trống) và "**✨ Magic**" (vào GenerateFlow). Từ khoá **Magic** + dấu ✨ + accent — CẤM chữ "tự động" (`CHOT-TACH-AI`).
- **Tách GenerateFlow khỏi tab Mẫu:** `LayoutShelf.tsx:148,332` đang lồng GenerateFlow làm trạng thái đầu tab "Mẫu" → GỠ: tab Mẫu chỉ còn kệ mẫu tay; GenerateFlow chỉ vào từ (a) lối "✨ Magic" màn chọn, (b) nút "✨ Magic" trên Toolbar (cụm Chèn, cạnh "Mẫu"). Đóng đúng khiếu nại #3 audit: 2 chế độ có ranh giới thị giác.
- **Nghiệm thu:** deck rỗng → thấy màn chọn; deck có slide → vào thẳng editor; tab Mẫu không còn GenerateFlow; lối Magic nhận diện được trong 3 giây (test 3-giây `SPEC-NGON-NGU`).

### V5 · Sửa ảnh TẠI CHỖ — giết lối 4 tầng (audit #2, hướng B) ⚠️ CỔNG: Hoà duyệt ảnh trước merge
- **Hiện trạng 4 tầng:** nhấp đúp → editor nhẹ (`PresentEditor.tsx:15`) → nút "Chỉnh ảnh nâng cao" (`ImageEditor.tsx:211` · `Inspector.tsx:1117`) → **mở tab trình duyệt mới** `/photo-editor` → chờ `storage` event round-trip (`PresentEditor.tsx:1273-1331` + `lib/photo-editor/handoff.ts`).
- **Đích:** "Chỉnh ảnh nâng cao" mở **MODAL toàn màn CÙNG app-shell** (portal + kính theo K4): nhúng lại `AdjustPanel.tsx`/`LayersPanel.tsx` của photo-editor. Nút "Áp" ghi THẲNG vào state editor — bỏ localStorage round-trip cho luồng chính. Route `/photo-editor` GIỮ NGUYÊN cho dùng độc lập; `handoff.ts` giữ làm fallback deep-link (không xoá năng lực).
- **Chú ý:** ảnh LIÊN KẾT (`Inspector.tsx:1146`) — luồng ghi-về phải giữ hành vi cập nhật mọi nơi dùng chung như cũ.
- **Nghiệm thu:** sửa ảnh không rời tab · Esc thoát không mất deck · undo sống sau khi Áp · ảnh liên kết cập nhật đúng · **chụp 2 theme gửi Hoà TRƯỚC merge**.

## N · KHỐI NGHIỆM THU BROWSER (chạy cuối, sau V5 — 1 lần đủ)
| # | Kiểm | Đạt khi |
|---|---|---|
| N1 | Export đối chứng: deck test 3 slide (chữ trên ảnh sáng/tối · fill+filter+flip+mask) xuất PDF+PNG | pixel khớp màn hình, không vệt, màu chữ AA đúng |
| N2 | So 2 vùng ảnh Hoà khoanh (01/08) | vùng đỏ: hết vệt (chụp xác nhận P6a) · vùng xám: toolbar đầy tay, hết "le que" |
| N3 | Picker màu chữ | GIF ≤2 click từ chữ đang chọn (xác nhận verify code) |
| N4 | Toàn bộ | đủ 2 theme (Tối mặc định) · 1440×900 theo `LUAT-GIAO-DIEN-BAT-BUOC` ④⑤ |

*COWORK-TRÌNH lập 04/08 (giờ máy 02/08 23:16 — lệch nhãn sổ, theo sổ). Sửa phiếu = append, không đè.*
