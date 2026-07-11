# Audit UX theo THÓI QUEN phần mềm chuyên dụng — lấy con người làm trung tâm

Phương pháp: mô phỏng luồng của dân thiết kế đã dùng lâu năm phần mềm chuyên dụng, đối chiếu
"trí nhớ cơ bắp" (muscle memory) của họ với giao diện InteriorFlow, theo từng chặng. Nguyên tắc:
**khớp thói quen cũ → không bắt học lại; giảm số thao tác; phản hồi tức thì; luôn hoàn tác được.**

3 persona:
- **KTS/kỹ thuật** — quen AutoCAD/Revit (chặng 1 Layout CAD).
- **Designer** — quen Figma/SketchUp/Photoshop (canvas node — chặng Render).
- **Người trình bày** — quen Keynote/PowerPoint (chặng Present).

---

## Chặng 1 — Layout CAD (đối chiếu AutoCAD)

### Tốt (đã khớp thói quen)
- Dòng lệnh gõ tắt: `L / PL / REC / C / W / ROOM / M / CO / RO / O / TR / EX / F(illet)…` — đúng phản xạ gõ lệnh của AutoCAD.
- **Crosshair đầy màn hình** + toạ độ X/Y live góc dưới — đúng cảm giác AutoCAD.
- OSNAP (endpoint/mid/center/giao/vuông góc/lưới), dynamic input gõ số → độ dài, xem trước (ghost) khi vẽ.
- Pan chuột giữa **và** space-giữ (space-pan tốt cho trackpad Mac); zoom lăn chuột **về đúng con trỏ**; `F` = Zoom Extents.
- Panel Layer (ẩn/hiện/khoá), xuất/nhập DXF, nút "Kiểm chuẩn" (TCVN/QCVN/ISO), snap lưới bật/tắt.

### Chưa tốt → ĐÃ CHỈNH (commit `f4a8d17`)
1. **Chuột phải chết** → nay **chuột phải = Enter/kết thúc lệnh** (thói quen AutoCAD sâu nhất). Trước
   đây dân CAD kéo chuỗi tường xong không biết thoát (phải mò Enter/double-click/`C`); giờ bấm phải
   là chốt, lệnh vẫn sẵn sàng vẽ chuỗi mới.
2. **Window/Crossing bị NGƯỢC** → nay đúng chuẩn: kéo **TRÁI→PHẢI = window** (nét liền, chỉ bắt vật
   nằm gọn trong khung); **PHẢI→TRÁI = crossing** (nét đứt **xanh lá**, bắt cả vật chạm khung). Dân CAD
   phân biệt 2 kiểu này bằng phản xạ — đảo chiều gây chọn nhầm liên tục.
3. **Thiếu F8** → thêm **F8 = bật/tắt Ortho khoá** (persistent). Giữ Shift vẫn là ortho tạm thời.

### Chưa tốt → ĐỀ XUẤT (chưa sửa, tránh đụng chủ sở hữu file khác)
- **Crossing chỉ xét đầu mút**, chưa bắt đoạn xuyên qua khung mà không có đầu mút bên trong
  (`lib/cad/query.ts idsInRect` — file đang do phiên geometry/hatch giữ). Cần intersection đoạn–khung
  để crossing "thật" như AutoCAD.
- **"AI mô tả" vẽ sai / bố cục nhảy** — đã có nhánh `feat/cad-ai-mechanism` sửa gốc (solver tất định,
  đặt nội thất theo công năng + clearance, đúng layer). Review & merge riêng.
- Cân nhắc: hiện Space = pan-giữ (kiểu Figma). Dân AutoCAD thuần quen Space = Enter. Giữ pan vì lợi cho
  trackpad, NHƯNG đã bù bằng chuột-phải=Enter ở trên → không ép người dùng đổi phản xạ chính.
- Gợi ý thêm: hiện dòng nhắc lệnh động ("chọn điểm kế / Enter để xong") rõ hơn ở status bar khi mới vào lệnh.

---

## Canvas node — chặng Render (đối chiếu Figma/SketchUp)

### Tốt
- Nền React Flow: **space-giữ = pan**, hai-ngón cuộn = pan, ⌘/pinch = zoom, minimap, Fit view, snap lưới —
  đúng phản xạ Figma. `⌘Z / ⌘⇧Z` undo/redo, `⌘D` nhân bản, `Backspace/Delete` xoá, `⌘K` command palette.
- Kéo asset từ Reference thả ra canvas tạo node — trực quan như kéo ảnh vào Figma.

### Đề xuất (nhẹ, chưa cấp thiết)
- Khi nối dây sai kiểu cổng, đã có toast báo — nên kèm gợi ý cổng đúng.
- Node đang chạy nên có trạng thái tiến trình rõ (đã có %); cân nhắc "chạy tới đây" (run upstream) hiện trên hover.

---

## Chặng Present (đối chiếu Keynote/PowerPoint)

### Tốt
- Trình chiếu: `←/→/Space/PageUp/PageDown/Home/End/Esc` — đúng phản xạ Keynote; vùng bấm trái/phải, chấm
  điều hướng, tự ẩn thanh điều khiển khi để yên. Xuất PDF/PNG. Chữ Việt sắc nét.

### Đề xuất
- Thêm phím `F`/double-click = toàn màn hình thực sự (fullscreen API) cho lúc present trước khách.
- Present-as-canvas (dàn tự do kiểu Keynote) vẫn là hạng mục lớn còn nợ.

---

## Nguyên tắc rút ra (con người làm trung tâm)
1. **Khớp muscle memory trước, sáng tạo sau** — mỗi chặng bám phần mềm mà người dùng đã thạo (AutoCAD/Figma/Keynote); chỉ khác đi khi có lợi rõ (vd space-pan cho trackpad) và phải bù bằng lối quen khác.
2. **Không có thao tác chết** — mọi nút chuột/phím người dùng theo phản xạ bấm phải làm điều họ kỳ vọng (chuột phải = Enter là ví dụ điển hình vừa sửa).
3. **Chiều thao tác phải đúng quy ước** — window/crossing, hướng offset… đảo chiều là phá phản xạ.
4. **Phản hồi tức thì + hoàn tác** — status line, ghost preview, ⌘Z ở mọi nơi.
