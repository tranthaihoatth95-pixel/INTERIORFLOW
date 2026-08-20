# 07 · BÀN GIAO MAIN — phiên sau đọc file này là nối được, không phải khảo cổ

## TRẠNG THÁI GIT (nguồn sự thật)
`backup/2026-08-19-batch0a` = nhánh làm việc, **đã push**. `main` = `2dfed16`.
⛔ **CHƯA nhập main** — đúng lệnh Hoà: chỉ nhập sau khi diễn tập demo loop xanh.
Nền lúc bàn giao: **tsc 0 · `npm test` EXIT=0 · 8551 pass / 0 fail · soi:frontier 0 lệch**.

## LANE ĐANG CHẠY (3)
| Lane | Vùng ghi | Việc |
|---|---|---|
| icon `a2ea3fc` | `components/nav/**` · `command-icon.tsx` | cụm Chặng đọc thành MỘT bộ, hạ cường độ nền trạng thái, viên nhãn khi rê. **Nghiệm thu = ẢNH** |
| Vitals `a930717` | `components/studio/**` · `components/ui/**` | **neo Vitals vào vỏ**: header 3 vùng · neo = TÂM VÙNG LÀM VIỆC (đọc `if:navigator-width`) · khe hở neo↔Peek = 0 · dọn nút `info`/`V1` khỏi vỏ |
| Home `ae16a5d` | `components/home/**` · `ProjectSelect.tsx` · `lib/wallpaper/**` | lưới chặt (lệch 0px) · thẻ dự án LIỀN MẶT · vùng ảnh = **Gallery cảm hứng** (khung sở hữu bố cục) |

## XẾP HÀNG, CHƯA GIAO (thứ tự ưu tiên)
1. **§33-34 Trung tâm Hoạt động** — chuông phải-trên → Peek gọn → **cột phải đầy đủ**; thay popup nhỏ xấu. Vùng `components/studio` ⇒ giao lane Vitals sau khi xong.
2. **§3 sidebar KHÔNG tự thu** khi người dùng đã chủ động mở — vùng `components/nav`+`Navigator` ⇒ giao lane icon sau.
3. **§38 Page Setup toàn không gian**: TRÁI núm · **GIỮA xem trước tờ LỚN SỐNG** · PHẢI kiểm · DƯỚI điều hướng tờ. Bản hiện có (`ThietLapTrangDayDu`) **chưa đủ** — phải thấy kết quả TRONG LÚC chỉnh.
4. **§26 neo điều khiển quanh ToolWindow** — lane Vitals khai quá tải, chưa làm dòng nào. Cửa nghiệm thu: **ruột `CuaSoCongCu` phải NHẸ ĐI**, không phải mép thêm nút.
5. Hai `window.print()` trùng: `BoqScreen:309` · `ScheduleScreen:168` (bỏ qua khổ/tỉ lệ/khung tên).
6. Hai panel tranh mép phải (Thiết lập nhanh ↔ BẢNG KIỂM) — chốt: **một lúc chỉ một**; cần lane cầm `components/studio`.
7. Xem trước **nội dung** tờ · nhiều trang · xuất · nút 3D chưa nối.

## CẦN HOÀ (cửa thật, không tự quyết được)
1. **Bật `prefers-reduced-motion`** (Trợ năng → Hiển thị) — agent không được đổi cài đặt hệ thống. Nợ trợ năng duy nhất còn treo.
2. **Glyph riêng cho Trang chủ** (mái dốc phá trục ngữ pháp; rà hết lucide không có ứng viên) + **Thư viện**. Cần phiên vẽ **native Claude Design**.
3. **Phiên thiết kế native cho Home và Library** — GATE #4: HTML/DesignSync **không còn tính là duyệt thị giác**.

## LUẬT MỚI DỄ QUÊN (đã ban trong phiên, chưa vào tài liệu chính tắc)
- **Vật liệu theo chức năng, kính phải ĐÁNG**: đặc (mặc định, biểu mẫu/kỹ thuật) · gần đặc (bảng thường trực) · kính mỏng (chỉ Vitals Peek/viên nhỏ/lớp phủ tạm).
- **Kích cỡ quyết định LOẠI bề mặt**, không chỉ toạ độ: quá lớn ⇒ inspector cắm bên; việc sâu ⇒ toàn không gian.
- **Sáu vùng cấm che**: canvas · vật đang chọn · vật nguồn · vùng con trỏ · **Vitals** · **dải hành động**.
- **Bốn nghĩa kích thước**: measured · verified · **human-override** · inferred. ⛔ CẤM dán nhãn `measured` cho giá trị đến từ người. Gõ lại số **KHÔNG** phải bằng chứng.
- **Ba hệ tách bạch**: Vitals *nên biết gì* · Hoạt động *đang chạy/vừa đến* · Dải hành động *vừa xảy ra*.

## BÀI HỌC PHIÊN NÀY (đắt, đừng học lại)
- **Test đỏ giả nguy hiểm hơn test thiếu** — `npm test` chạy `-P8`, một test khẳng định **đếm toàn cục** nên đỏ oan; đã sửa sang kiểm **hàng của chính mình**.
- **Công thức chụp ảnh**: playwright import bằng **đường dẫn tuyệt đối** + `launchPersistentContext` profile `~/.if-phien-chup-man`. Headless vào `/` là **màn đăng nhập** ⇒ `AppChrome` không mount ⇒ tưởng "không chụp được".
- **Đếm tại NGUỒN, không đếm ở bản chiếu** (MAIN từng lấy số mock đã đẩy làm số mock trong thư mục).
- **`tail -N` cắt kết quả grep** ⇒ MAIN từng kết luận sai "0 board có @dsCard" (thật ra 19/19).
- **Soi lại danh sách tệp sau mỗi checkpoint** — MAIN từng sót `to-ban-ve.ts` khiến nhánh thiếu file.
