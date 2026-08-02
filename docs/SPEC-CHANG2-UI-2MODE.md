# SPEC — UI CHẶNG 2 · HAI MODE (Render+Mood+Collab ↔ Vẽ 3D)

> Hoà chốt 02/08 (qua loạt mock xem thử). Nối `SPEC-MODE-PER-STAGE` §1-2 · `CHOT-HUONG-3D` · `SPEC-3D-CORE`.
> **Luật gốc:** hạ tầng UI GIỮ NGUYÊN (top bar · rail trái · **thanh zoom/pan dưới**), gạt mode chỉ đổi
> **CANVAS + SIDEBAR**. Không dựng lại shell.

## 1 · Bottom bar — CHỐT (giữ, không bỏ)
Thanh zoom/pan dưới giữ y app hiện tại: **➤ chọn · ✋ pan · ▢ frame | ↶↷ undo/redo | − 250% + ⛶ fit | ▦ grid · ⌘**.
Cạnh nó là **1 nút rời gạt "Vẽ 3D"** (Hoà: bật/tắt mode = đổi cả giao diện). Dùng chung cho cả 2 mode.

## 2 · Spine CHUNG — không đổi khi gạt (khỏi học lại)
Rail trái · ô Tìm · **Thư viện / Vật liệu (`matId` chung)** · File Manager · **presence-collab**.
→ vật liệu & cộng tác chảy xuyên 2 mode; swatch chọn ở Mood thành material khi Vẽ 3D.

## 3 · MODE A · Render + Mood + Collab  (canvas kiểu Miro)
Sidebar = **Node Library** (3 vùng: Mood+Collab · Node Master · Node thường — `SPEC-MODE-PER-STAGE` §2).
Canvas = mặt phẳng cộng tác:

| Yếu tố | Chốt |
|---|---|
| **Tablet + bút ĐẦY ĐỦ** | toolbar trái: Bút · Marker · Highlight · Tẩy + chọn/sticky/chữ/hình/ảnh/comment. Nút to, tối ưu chạm/pen, palm-rejection. Vẽ tay & viết tay bằng pen |
| **Presence online/offline** | nhóm online (màu, chấm xanh) · offline (xám) · nút **mời (+)** |
| **Share roles** | Viewer · Commenter · Editor (khách góp ý không sửa) — **collab-share, KHÁC phân quyền IF1/IF2 đã bỏ** |
| Sticky · comment @mention · reaction/vote | neo vào từng object |
| **Frame theo PHÒNG** | gom mood theo phòng khách/bếp/master |
| **Swatch vật liệu** | mang `matId` (hãng·mã·giá/m²) — kéo vào mang dữ liệu, không chỉ ảnh |
| **Mindmap = 1 TUỲ CHỌN** | canvas trống mặc định tự do; khung lập luận kéo từ **kệ Thư viện** (nhiều form — `SPEC-STAGE-LIBRARIES`) |
| Live-link | gu/palette board chốt xong **bơm thẳng vào Render** |

## 4 · MODE B · Vẽ 3D  (viewport + Command Panel kiểu 3ds Max)
Canvas = **viewport 3D**: **trục toạ độ X/Y/Z (gizmo) + ViewCube + gizmo di chuyển**. Khối **xám trơn** (massing,
chưa PBR — `SPEC-3D-CORE` §6). Sidebar = **Command Panel** (học 3ds Max, gọn SketchUp-level):

| Tab | Nội dung | Gốc |
|---|---|---|
| Tạo | khối hộp · mặt · cửa/cửa sổ · import glTF/OBJ | Max Create |
| Sửa | push-pull cao độ · kích thước · bevel nhẹ | Max Modify (=3D-5) |
| **Vật liệu** | catalog **V-Ray · D5 · IF(ATLAS)** — PBR preset, chọn→click mặt để gán | D5/V-Ray lib |
| **Camera** | đặt cam · đường cam (campath) · ống kính · tầm mắt 1650 | Max Camera + IF campath |
| Hiện | layer · ẩn/hiện · xem theo tầng | Max Display |

⭐ **Moat vật liệu:** V-Ray/D5/IF hợp nhất bằng **`matId`** — chọn 1 vật liệu ở IF, khớp cả khi render AI của IF
LẪN khi xuất D5/Chaos. IF **không chạy engine V-Ray** — chỉ mở **catalog** để gán; photoreal để D5 (cửa bậc 5).

---
*Cowork ghi 02/08/2026 theo chốt Hoà. Mock nguồn: mood-collab · ve3d (đã gửi Hoà xem).*
