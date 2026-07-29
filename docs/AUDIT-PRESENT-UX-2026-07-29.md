# Khám UX Present — đối chiếu 4 khiếu nại của Hoà với code thật

> Ảnh Hoà gửi: màn Present, slide "Material Board" đang mở (ảnh phòng ăn + bảng vật liệu 4 màu),
> panel trái đang ở tab "Mẫu" (3 tab: Mẫu/Reference/Motion) hiện 3 khối "① Import ảnh nội dung
> ② Nội dung text ③ Reference học gu", panel phải là Layer (13 lớp) + màu nền. Toolbar trên cùng:
> Quay lại/Mở tệp/Xuất/Chữ/Ảnh/6 hình cơ bản (vuông-tròn-tam giác-ngũ giác-mũi tên-đường thẳng)/
> Mẫu/Undo-Redo/Nhận diện/khổ 16:9/Xem lưới/Trình chiếu. Dưới cùng: filmstrip 7 slide.
>
> 4 khiếu nại đối chiếu **code thật** (không suy đoán) — file:dòng cụ thể dưới mỗi mục.

---

## 1. "Thiếu tool chuyên nghiệp, chỉ vài hình học cơ bản, gradient chưa có"

**XÁC NHẬN ĐÚNG.** `components/present-editor/Toolbar.tsx` dòng 160-177: đúng 6 hình
(rect/ellipse/triangle/polygon/arrow/line), không có nút gradient/mask/group/blur nào ở toolbar.

Khớp với audit cũ (`docs/AUDIT-EDITOR-TOOLKIT.md`, đã ghi trong `IF-FEATURE-TREE.md`):
- Gradient (2.3.31) — **chỉ có cho CHỮ**, ảnh/shape hoàn toàn không có màu gradient thật.
- Mask ảnh theo hình tự do (2.3.30) — không có, chỉ bo góc chữ nhật.
- Group nhiều phần tử (2.3.33) — không có `groupId` trong model.
- Blur filter độc lập (2.3.38.a) — hoàn toàn chưa có.
- Khoá tỉ lệ khi resize (2.3.32) — không có.
- Lật ảnh (flip/mirror) (2.3.42) — không có ở cả Present lẫn Photo-editor.

## 2. "Lối vào trình sửa PTS không hợp lý, nhiều tầng"

**XÁC NHẬN ĐÚNG — 4 tầng thật**, đọc từ `PresentEditor.tsx`/`Inspector.tsx`/`ImageEditor.tsx`:

1. Nhấp đúp HOẶC chuột phải 1 ảnh trên slide → mở editor nhẹ tại chỗ (`PresentEditor.tsx:15`).
2. Trong đó có nút "Chỉnh ảnh nâng cao" (`ImageEditor.tsx:210`, `Inspector.tsx:1033`).
3. Bấm nút đó → **mở TAB TRÌNH DUYỆT MỚI** sang route hoàn toàn khác (`/photo-editor` hoặc
   `/projects/[id]/photo`) — một app-shell riêng (`PresentEditor.tsx:1273-1291`).
4. Sửa xong ở tab kia → đóng tab → Present tab gốc **âm thầm đợi sự kiện `storage`** (localStorage
   round-trip qua `lib/photo-editor/handoff.ts`) để tự áp kết quả về (`PresentEditor.tsx:1291-1331`).

Đây đúng nghĩa "nhiều tầng": 1 hành động sửa ảnh cần qua 2 app-shell khác nhau + 1 cơ chế đồng bộ
bất đồng bộ qua tab, không phải sửa tại chỗ như Figma/Canva/Photoshop desktop (mở modal/panel
cùng ngữ cảnh). PS-3 trong `IF-FEATURE-TREE.md` (2.3.8) ghi "✅ done" — đúng về mặt CHỨC NĂNG chạy
được, nhưng chưa từng chấm điểm **trải nghiệm** — đây là phát hiện MỚI, chưa có mã.

## 3. "Chưa tách bạch cơ chế AI và cơ chế tự chỉnh sửa"

**XÁC NHẬN ĐÚNG.** `components/present-editor/GenerateFlow.tsx` (dòng 1-13): đây CHÍNH LÀ khối
"①②③" Hoà thấy trong ảnh — cơ chế AI thật (import ảnh hàng loạt, paste text, đính ≤5 ảnh
reference để "học gu" bằng heuristic, bấm Generate → máy tự dàn bố cục). Nhưng
`LayoutShelf.tsx` (dòng 1-12, 146) nhúng `GenerateFlow` làm TRẠNG THÁI ĐẦU của CÙNG 1 tab "Mẫu" —
sau khi Generate xong mới đổi sang kệ mẫu thủ công. Cùng 1 nút tab, cùng 1 khung, không có ranh
giới thị giác nào phân biệt "đang ở chế độ AI" và "đang chọn mẫu tay" — đúng như Hoà cảm nhận.

---

## Đề xuất hướng (KHÁM xong — chưa SPEC, cần Hoà chốt hướng trước khi giao Claude Code viết SPEC)

| # | Vấn đề | Hướng đề xuất | Vì sao |
|---|---|---|---|
| A | Toolkit thiếu (gradient/mask/group/blur/flip/khoá-tỉ-lệ) | Đã có sẵn trong `IF-FEATURE-TREE.md` (2.3.30-2.3.42), chỉ cần Hoà xác nhận ưu tiên mở — đây là việc SPEC→CODE bình thường, không cần khám thêm | Đã khám xong từ trước (`AUDIT-EDITOR-TOOLKIT.md`) |
| B | Lối vào Photo-editor 4 tầng | Cân nhắc: sửa TRỰC TIẾP tại chỗ (modal/panel cùng app-shell Present) thay vì mở tab mới, dùng lại `AdjustPanel.tsx`/`LayersPanel.tsx` của Photo-editor nhúng làm panel phụ — bỏ round-trip localStorage | Đúng chuẩn Figma/Canva: sửa ảnh không rời khỏi ngữ cảnh đang làm |
| C | AI vs tự chỉnh chưa tách bạch | Tách `GenerateFlow` ra khỏi tab "Mẫu" thành 1 lối vào RIÊNG (vd nút "✨ Tạo bằng AI" cạnh nút "Mẫu" trên toolbar, thay vì lồng trong cùng tab) — có nhãn/màu khác rõ để không nhầm 2 chế độ | Đúng nguyên tắc UI đã có ở nơi khác trong app (Render Tool Mode cũng tách rõ 3 tầng nhìn) |

**B và C là phát hiện UX mới, chưa có mã trong `IF-FEATURE-TREE.md`** — đúng Luật Đóng Băng #2,
nên ghi vào `docs/IDEAS-BACKLOG.md` trước, chờ Claude Code làm 1 vòng KHÁM đầy đủ hơn (đọc hết
`SPEC-PRESENT-FLOW.md`/`SPEC-EDITOR-TOOLKIT.md` đối chiếu) rồi mới viết SPEC — đúng thứ tự
KHÁM→QUYẾT→SPEC→CODE, không nhảy thẳng vào sửa.

---

*Cowork, 29/07/2026. Đọc trực tiếp `Toolbar.tsx`, `LayoutShelf.tsx`, `GenerateFlow.tsx`,
`PresentEditor.tsx`, `Inspector.tsx`, `ImageEditor.tsx` trên máy Hoà — không suy đoán từ ảnh.*
