# NOTE — GOM FILE MANAGER + CÀI ĐẶT CHUNG (mới ghi, chưa thiết kế)

> Hoà 02/08 (nhân đang bàn UI): *"noted luôn File Manager và Cài đặt, muốn gom lại cùng — gồm đổi avatar
> giống Apple/Oppo, đổi theme, thư mục trỏ, hình nền v.v..."* → **Ghi để không rơi rớt; THIẾT KẾ SAU.**

## Ý định
Một khu **File Manager + Cài đặt** hợp nhất (hạ tầng xuyên app — nối `SPEC-FILE-MANAGER` · `SPEC-MODE-PER-STAGE` §3).

| Nhóm | Gồm | Tham chiếu (ảnh Hoà gửi) |
|---|---|---|
| **File Manager** | cây thư mục + Tags · thẻ folder có icon nguồn (Drive/Notion) · danh sách file kèm "Added By" (avatar) | ref "Knowledge Base" |
| **Hồ sơ / Avatar** | đổi avatar kiểu **Apple/Oppo** (chạm avatar → chọn/memoji) · tên · switcher tài khoản | ref "All projects" (profile trên đầu nav) |
| **Giao diện / Theme** | brand color · theme preset (Default/Simplified/Custom) · **hình nền** · ngôn ngữ | ref "Settings › Appearance" |
| **Thư mục trỏ** | chọn thư mục IF trỏ tới (mounted / Drive-git bridge) | — |

## ✅ Chốt 02/08 (Cowork quyết theo uỷ quyền design, mock: mocks/mock-settings-polished.html)
- Cài đặt = **TRANG RIÊNG /settings** (mở từ rail ⚙ + menu avatar). Panel trượt không làm.
- Theme (sáng/tối/hệ thống + hình nền canvas) = cấp **APP**; màu thương hiệu dự án vẫn ở Brand Kit — 2 tầng không giẫm.
- "Nơi lưu file" hiện path thật + trạng thái đồng bộ; nút Đổi = di chuyển an toàn (copy→verify→xoá cũ), đúng `QUYET-DINH-HA-TANG` ①B đĩa là nguồn sự thật.

## Layout CHỐT HƯỚNG (Hoà 02/08 — ref Elementor "Documents": *"phân vùng đẹp và rõ"*)
**3 khu — trái/giữa/phải:**
- **TRÁI · nav:** Dashboard · Dự án · Files · **Store = Master Library** · Cài đặt + Integrations (Drive·git·Notion) + Log out.
- **GIỮA · duyệt:** Folders (thẻ có avatar cộng sự) · Files (lưới thumbnail / list toggle · nút Upload). *IF twist:* icon nguồn (Drive/git/Notion) · "Added By" avatar · asset mang `matId`.
- **PHẢI · inspector:** File information (preview · tên/size · tab Description/Comments · thread comment) · **Dung lượng (gauge)**. *IF twist:* material → matId·hãng·giá · gauge kiểu **Vitals** · comment = collab trên file.

Khớp **Node Inspector (panel phải)** (nghiên cứu đối thủ #3) + ref Knowledge Base → File Manager thống nhất "3 khu" với cả app. Chi tiết editor vẫn **thiết kế sau**.

---
*Cowork ghi 02/08/2026 — NOTE hướng, chưa phải spec. Nhắc lại khi quay lại thiết kế khu này.*
