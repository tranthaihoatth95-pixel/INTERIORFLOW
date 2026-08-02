# ⛔ LUẬT GIAO DIỆN — RÀNG BUỘC CẢ COWORK LẪN CLAUDE CODE

> Hoà lập 02/08/2026 sau **3 lần liên tiếp** nhận sản phẩm xấu (/files, /settings, avatar).
> Lời Hoà: *"Nghiên cứu TRƯỚC khi thiết kế. Nói suông dạ dạ làm như hiểu lắm, xong làm trớt quớt.
> Làm được thì nói được. Sai luật sẽ thông báo Anthropic hoàn tiền."*
> **File này là luật cứng — đọc trước mọi việc động tới giao diện.**

## L1 · NGHIÊN CỨU TRƯỚC KHI THIẾT KẾ (vi phạm nhiều nhất)
Trước khi vẽ/code BẤT KỲ màn nào, BẮT BUỘC:
1. `ls docs/mocks/` — **đã có mock cho thứ này chưa?** Có thì ĐỌC và DÙNG, cấm vẽ lại từ đầu.
2. `grep` component/asset liên quan trong repo — **app đã có sẵn thứ này chưa?**
3. Đọc spec liên quan (`SPEC-DESIGN-SYSTEM-IF`, `SPEC-NGON-NGU-CHI-DAN`, `REF-VISUAL`).
4. Nêu trong câu trả lời: **"đã kiểm X, Y, Z — có/không sẵn"** rồi mới bắt tay.
> ❌ Vi phạm điển hình 02/08: Cowork vẽ lại avatar picker bằng 8 vòng gradient trong khi repo đã có
> `docs/mocks/avatar-picker.html` + `vitals-avatar.html` (avatar 3D render nhiều giờ, đẹp).

## L2 · KHÔNG HỨA SUÔNG
Cấm "vâng/đã hiểu/sẽ đẹp" khi chưa kiểm chứng. Chỉ được khẳng định thứ **đã tự kiểm** (đọc file,
chạy lệnh, xem ảnh). Không chắc thì nói thẳng "chưa chắc, cần kiểm X" — **thà chậm 1 nhịp còn hơn
giao hàng xấu**.

## L3 · MOCK LÀ HỢP ĐỒNG
Cowork làm mock đủ **2 theme + icon lucide thật + màu qua biến**; Claude Code **PORT NGUYÊN VĂN**
markup+CSS, cấm diễn dịch/vẽ lại bằng mắt. Mock thiếu 1 trong 3 → **Cowork sai**, phải làm lại
trước khi giao. Port sai mock → **Code sai**.

## L4 · KHÔNG TỰ CHẾ MÀU / KÍCH THƯỚC
Màu qua CSS var app (`globals.css`), cấm hardcode hex. Kích thước px cố định trong container 1440,
cấm `1fr`/`vw` làm phình. Icon = **lucide-react**, cấm glyph/emoji.

## L5 · NGHIỆM THU BẰNG MẮT, ĐỦ 2 THEME
Chụp screenshot **sáng + tối** ở 1440×900, so mock, lệch layout >4px = chưa đạt. Không có ảnh =
không được báo "xong".

## L6 · TÀI SẢN ĐÃ LÀM = TÀI SẢN, KHÔNG VỨT
Thứ đã render/dựng công phu (avatar 3D, glyph Vitals, mock cũ) là tài sản dự án — **tái dùng**,
không thay bằng bản vẽ vội. Muốn thay phải nêu lý do và được Hoà đồng ý.

## L7 · SAI THÌ NHẬN, KHÔNG VÁ
Sản phẩm bị chê xấu → **làm lại từ nguồn đúng**, không vá cho qua. Nhận lỗi thẳng, ghi nguyên nhân
gốc vào báo cáo để không tái phạm.

---
*Hoà lập 02/08/2026. Áp dụng ngay, không có ngoại lệ. Mọi phiên (Cowork · code chính · code phụ · G4)
đọc file này trước khi động tới giao diện.*
