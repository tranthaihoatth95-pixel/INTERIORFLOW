# SESSION-06 · DIỄN TẬP TOÀN TUYẾN + SẴN SÀNG PHÁT HÀNH

MISSION
QA tích hợp. Không thêm năng lực lớn ở đây trừ khi phải sửa hồi quy.

START COMMIT: 83ff452 (hoặc mới nhất)

CHẠY MỘT TUYẾN NGHỀ THẬT
Home → Tiếp tục → 2D Sơ phác → 2D Chuyên → vào thẳng 3D → Tạo → Dời → Xoay → đổi kích thước
(số nghề) → Boolean/chi tiết → Form Recipe → AI Form (nếu sống) → Lincoln Ảnh→3D → Generate →
Sửa có kiểm soát → Ảnh→Spec → Người xác minh → Spec → Present → Auto Grid → Thiết lập trang →
Quay lại đúng tờ 2D → deep link sống → quay về ĐÚNG slide → Hoạt động → Home.

DIỄN TẬP KHÔI PHỤC
Xoá sạch IndexedDB → 2D về (id/số entity/số điểm giữ nguyên) → Present về (25 slide) → deep link
vẫn chạy. Đây là bài đã PASS ở 83ff452 — chạy lại để chống hồi quy.

LAN
Máy bàn: xác minh lại. IP đo 21/08: 192.168.126.92, server bind *:3000.
Điện thoại: nếu thật sự cần tay Hoà, gom thành MỘT yêu cầu ngắn ở CUỐI. Đừng dừng wave khác để chờ.

FILES TO OPEN
scripts/kiem-3d-contro-that.js   (gate · ve · form · empty3d · shots)
present-demo/dung-deck.js

TESTS TO RUN
npm test && npx tsc --noEmit
npm run soi:frontier && npm run check:chot
node scripts/kiem-3d-contro-that.js gate

MA TRẬN CUỐI (chỉ điền khi đã đo)
PRODUCT / HOÀ PRODUCT TEST / PRESENTATION / MAIN INTEGRATION / DB / PHONE / OPEN NOW ITEMS

STOP CONDITION
Chỉ dừng khi mọi cổng NOW đã GREEN, hoặc phần còn lại đúng là HUMAN-GATED / FUTURE.
main CHỈ được đụng khi Hoà quyết tích hợp.
