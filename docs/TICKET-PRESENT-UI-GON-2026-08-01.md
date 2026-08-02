# TICKET — PRESENT UI GỌN: bỏ vệt sau chữ · toolbar đầy tay

> Hoà chốt 01/08 kèm ảnh chụp (khoanh 2 vùng): *"giao diện khó xài, tính năng phía trên le que
> vài cái, mấy cái vệt dưới chữ không cần thiết — chỉ cần tương phản nền và cho chỉnh màu là được."*
> Vùng present-editor → CODE PHỤ, chèn thành P6 sau chuỗi E1–E4 (cùng vùng file, làm liền tay).

## P6a · BỎ VỆT SCRIM SAU CHỮ (mặc định)

- Hiện trạng: lớp đệm tối tự thêm sau chữ trên ảnh (họ AdaptiveContrast) — làm bẩn ảnh.
- Đổi ĐẦU RA của adaptive contrast: KHÔNG đệm vệt nữa → CHỌN MÀU CHỮ tương phản với nền đã đo
  (trắng/đen/màu deck) + text-shadow MẢNH chỉ khi độ tương phản vẫn thiếu (ngưỡng WCAG AA).
- Vệt scrim hạ thành tuỳ chọn TẮT mặc định (không xoá năng lực — có template cần).
- Color picker MÀU CHỮ phải với tới trong ≤2 click từ chữ đang chọn (toolbar nổi hoặc thanh trên).
- Export PDF/PNG/PPTX phải khớp màn hình (bake đúng màu chữ mới, không còn vệt).
- Template nào đang NHÚNG vệt như element trang trí: rà BUILTIN_TEMPLATES, gỡ khỏi mặc định.

## P6b · TOOLBAR TRÊN ĐẦY TAY — lộ đồ có sẵn + đồ E mới

Nguyên tắc: KHÔNG thêm năng lực mới ở ticket này — chỉ ĐƯA LÊN MẶT TIỀN thứ đã có/sắp có,
nhóm theo cụm: [Chèn: Chữ·Ảnh·Shape·Mẫu] [Sắp xếp: align/distribute (lib đã có, test sẵn) ·
z-order · group (E1) · khoá/ẩn] [Hiệu ứng: màu chữ · fill (E3) · mask (E2) · filter (E4) ·
opacity/shadow] [Nhận diện·Xuất giữ nguyên].
- Màn hẹp: cụm thu thành menu ▾, không rớt mất.
- Đừng phá khuôn nút hiện có — cùng ngôn ngữ với Toolbar.tsx đang chạy.

Điều kiện xong: so ảnh chụp Hoà đã khoanh — vùng đỏ hết vệt, vùng xám không còn "le que".
*Cowork ghi 01/08/2026 theo chốt + ảnh của Hoà.*
