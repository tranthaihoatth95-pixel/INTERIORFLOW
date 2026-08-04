# ĐƯỜNG VỀ ĐÍCH — 3 ĐỢT (chốt 04/08/2026)

**Hoà chốt. Danh sách này ĐÓNG. COWORK-TỔNG không bơm việc mới cho tới khi xong Đợt 12,
trừ BUG CHẶN (mất dữ liệu · không mở được file · crash).**

## Đích: một studio nội thất làm trọn MỘT dự án thật trong IF
```
mở file .dwg cũ → vẽ mặt bằng → in hồ sơ đúng tỉ lệ → ra BOQ có giá → render 1 ảnh
```

---
## ĐỢT 10 · MỞ ĐƯỢC & IN ĐƯỢC
| Việc | Trạng thái |
|---|---|
| Nhập DWG hết treo (bug đỏ 2.1.6.d) | 🔨 đang chạy |
| Multi-sheet D1·D2·D3 — bỏ trần 5, in đúng tỉ lệ | 🔨 đang chạy |
| Xuất PDF đúng khổ giấy + khung tên | ⬜ |
**Xong = studio mở được file cũ của họ và in được hồ sơ.**

## ĐỢT 11 · RA ĐƯỢC TIỀN
| Việc | Trạng thái |
|---|---|
| Kho vật liệu VIỆC 2·3 (đóng băng giá · màn quản lý) | 🔨 đang chạy |
| Cửa nhập Excel — nối `lib/gateway` (`xlsx/csv → library-bulk-ingest`) | ⬜ |
| Đổ 1449 món ATLAS qua cửa Excel | ⬜ |
| BOQ editor UI | 🔨 đang chạy |
**Xong = ra được bảng khối lượng có giá thật.**

## ĐỢT 12 · GIAO ĐƯỢC
| Việc | Trạng thái |
|---|---|
| Empty states toàn app (kệ trống — mock Claude Design đã có) | ⬜ |
| Icon emoji → lucide + dọn lỗi mắt còn lại | ⬜ |
| MỘT studio thật dùng thử — dogfooding | ⬜ |
**Xong = giao được cho khách.**

---
## HOÃN — KHÔNG MẤT, CHỈ CHƯA CODE (luật §9: vẽ mờ trên giao diện kèm lý do)
Camera V-Ray · 114 lệnh dựng hình 3D · Material Editor · thư viện kiểu 3dsky ·
Web Clipper · mode Revit đầy đủ · video editor · văn bản song ngữ · tầng ① nhà cung cấp ·
ATLAS sync tự động qua Lark (đường A — đã có `docs/ATLAS-4-BUOC-BAM-LARK.md`, làm khi rảnh)

## LUẬT MỚI CỦA ĐỢT NÀY
**Tối đa 4 phiên cùng lúc.** Sáu là quá tay — 04/08 đã dính 2 phiên trùng tên cùng đụng
`prisma/schema.prisma`. Mỗi phiên tự xưng tên ở đầu báo cáo.
