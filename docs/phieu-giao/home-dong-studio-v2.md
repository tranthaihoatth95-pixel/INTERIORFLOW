# PHIẾU GIAO VIỆC — H1b · `home-dong-studio` v2 (sửa theo mắt Hoà 13/08) — Đợt 5b

## ① BỐI CẢNH
Hoà soi bản v1 và chê "trang dashboard ko ổn". T đo DOM trên app thật (Chrome, đăng nhập thật) ra 5 lỗi — phiếu này SỬA ĐÚNG 5 LỖI, không thêm tính năng mới:
1. Mặt tiền vẫn là ~16 card FLOW ("Untitled flow" ×10) — yêu cầu gốc "card DỰ ÁN + flow lẻ gom một ngăn Nháp thu gọn" chưa được làm (v1 giữ nguyên ProjectSelect).
2. Nút "Đồng bộ tiến độ" hiện dù Lark chưa cấu hình (nút bệnh) + nút "Chi tiết" lơ lửng.
3. Card nghèo: không chip chặng, không quy mô — chưa phải card dashboard.
4. MỘT sự kiện lặp ở 3 widget với thời gian mâu thuẫn: lời chào "Nháp vừa có chuyển động" · hôm-nay "vừa có cập nhật" · bảng tin "cập nhật mới **3 ngày trước**" — noise, đúng bẫy NC-HOME-DELIGHT.
5. Lưới tích luỹ hiện dù chỉ 16 hoạt động/10 tuần — trái luật widget-mỏng-tự-ẩn.

## ② ĐỌC TRƯỚC
1. `docs/phieu-giao/home-dong-studio.md` (phiếu gốc — các ràng buộc vẫn hiệu lực) + `docs/bao-cao-phien/2026-08-13-H1-home-dong-studio.md`.
2. `components/home/DongStudioHome.tsx` + `components/home/widgets/**` + `lib/home/**` (code v1).
3. `components/ProjectSelect.tsx` — grid/card/carousel hiện có; lần này ĐƯỢC sửa sâu phần bố cục danh sách, nhưng KHÔNG phá: tìm kiếm, toggle carousel/grid, đường mở flow, "Đổi bìa/Chi tiết" per-card.
4. `docs/nc/NC-HOME-DELIGHT-2026-08-13.md` mục Bẫy (noise, tự-ẩn).
5. Đường dữ liệu project/flow đang nuôi ProjectSelect (grep fetch trong file) + `ProjectProfile`/`lastStage` đã dùng ở card đợt 3.

## ③ VÙNG FILE
ĐƯỢC: `components/home/**` · `components/ProjectSelect.tsx` · `lib/home/**` · `app/api/home/**` · `app/page.tsx`.
CẤM: `app/globals.css` · `prisma/schema.prisma` · mọi thư mục components khác · `lib/cad|three|library|present-editor`.

## ④ VIỆC (đúng 5 sửa)
1. **Mặt tiền = CARD DỰ ÁN, flow gom ngăn**: nhóm flow theo dự án — mỗi DỰ ÁN một card (tên · chip chặng đang dở · quy mô/loại hình từ ProjectProfile nếu có · PresenceRow · số flow · thời gian hoạt động cuối); bấm card → nhảy lastStage (hành vi đợt 3 giữ). Flow KHÔNG gắn dự án: gom thành MỘT ô "Nháp (N)" thu gọn cuối lưới — bấm mở rộng mới thấy danh sách flow lẻ, trong đó mở flow như cũ. "Dự án mới" (＋) giữ nguyên vị trí đầu. Tìm kiếm lọc được cả hai (tên dự án + tên flow trong ngăn).
2. **Nút bệnh**: "Đồng bộ tiến độ" chỉ render khi Lark ĐÃ cấu hình (đọc điều kiện đang có sẵn ở tooltip lỗi); "Chi tiết" gộp vào menu/hover của khu vực nó thuộc về — không nút lơ lửng cạnh switch ngôn ngữ.
3. **Khử trùng sự kiện + nhất quán thời gian**: một sự kiện chỉ xuất hiện ở MỘT widget — ưu tiên: đến-hạn → lời chào; online/chuyển-chặng → dải hôm-nay; còn lại → bảng tin. Lời chào KHÔNG nói "X vừa có chuyển động" nữa (đó thường là hành động của chính người đang mở app — noise); chỉ nói việc đến hạn/mốc sắp tới, không có thì chỉ chào. Mọi timestamp qua MỘT hàm format (lib/home), hết cảnh "vừa" ↔ "3 ngày trước" cho cùng sự kiện.
4. **Ngưỡng tự ẩn**: lưới tích luỹ chỉ hiện khi đủ dày (≥30 hoạt động trong 10 tuần HOẶC ≥4 tuần có hoạt động — hằng số đặt ở lib/home, có test); bảng tin ẩn khi rỗng hoặc chỉ còn sự kiện đã hiện nơi khác; ô ghi chú + biểu đồ chặng giữ (đã có dữ liệu thật).
5. **Card thông tin đúng dashboard**: đảm bảo chip chặng + quy mô hiện trên card dự án khi có dữ liệu (tận dụng phần đợt 3 đã làm — kiểm vì sao đang không hiện: có thể chỉ hiện ở card "project" mà đa số card là flow → sau khi gom nhóm sẽ tự đúng; verify bằng dữ liệu thật dự án "Nháp" có profile).

## ⑤ RÀNG BUỘC
Như phiếu gốc (không git/server/prisma/AI/stock; token var; 2 theme; tự ẩn khi trống; không streak). THÊM: không phá hành vi mở flow/đổi bìa; các test v1 (53) phải còn pass, sửa test nếu rule greeting đổi (ghi rõ).

## ⑥ NGHIỆM THU TỰ LÀM
```
npx tsc --noEmit
for f in lib/home/*.test.ts; do node_modules/.bin/sucrase-node "$f"; done
grep -n "Đồng bộ tiến độ" components/ProjectSelect.tsx   # phải nằm sau điều kiện Lark
```

## ⑦ BÁO CÁO
`docs/bao-cao-phien/2026-08-13-H1b-home-v2.md` — đối chiếu TỪNG lỗi 1-5: sửa thế nào, bằng chứng; khuôn 2 giá trị.

## ⑧ DÂY MÁY
Entry `home-dong-studio` (đã mở lại `chua` chờ v2). Không tự sửa registry.
