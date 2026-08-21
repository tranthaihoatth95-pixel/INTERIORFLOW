# SESSION-03 · WORKSPACE + UX LƯU TRỮ

MISSION
Workspace = ngữ cảnh làm việc PHỤC HỒI ĐƯỢC. Và biến ba tầng lưu trữ đang chạy thành thứ người
dùng HIỂU và ĐIỀU KHIỂN được, bằng tiếng người.

START COMMIT: 83ff452

GREEN — DON'T TOUCH
Bản sao máy chủ cho cả 2D lẫn Present (đã khôi phục thật sau khi xoá sạch IndexedDB).

OPEN
1. WORKSPACE. PROJECT = SỰ THẬT · WORKSPACE = NGỮ CẢNH · HOME = CON NGƯỜI.
   Workspace nhớ: môi trường · vùng chọn · camera · zoom · trọng tâm · ToolWindow đang mở · tham
   chiếu · sắp xếp tạm. Workspace KHÔNG sở hữu hình học/vật liệu/spec/asset.
   ⚠️ DÙNG LẠI lib/resume.ts + lib/shell/last-stage.ts TRƯỚC KHI đẻ persistence mới.
2. BA TẦNG LƯU TRỮ — cùng MỘT danh tính dự án, không phải ba phiên bản:
   trình duyệt = bộ nhớ làm việc · đĩa cục bộ = bản bền tuỳ chọn · máy chủ = lưới đỡ.
3. LỜI MỜI ĐĨA CỤC BỘ (hiện mặc định TẮT, người dùng phải tự tìm mới bật được):
   một lần, KHÔNG chặn: "Giữ bản sao dự án trên máy này?" +
   "IF có thể đồng bộ một bản cục bộ để phục hồi nhanh và giữ dữ liệu gần bạn hơn."
   [Chọn thư mục] [Để sau] (tuỳ chọn: Không hỏi lại).
   Kích hoạt SAU lần lưu dự án có nghĩa đầu tiên — KHÔNG phải mỗi lần mở app.
4. CÀI ĐẶT → Lưu trữ dự án: hiện Bản làm việc · Bản phục hồi trên máy chủ · Bản trên máy này —
   kèm trạng thái, lần cuối thành công, vị trí.
   ⛔ CẤM chữ IndexedDB / ProjectFile / API endpoint trong UI.
5. SỨC KHOẺ BẢN SAO: thành công thì IM LẶNG. Hỏng/cũ mới báo qua Vitals:
   "Bản sao dự án chưa được cập nhật" + [Kiểm tra lưu trữ]. Không huy hiệu đồng bộ khắp nơi.

FILES TO OPEN
lib/resume.ts · lib/shell/last-stage.ts        (state đã có — dùng lại)
lib/present-editor/luu-len-may-chu.ts          (khuôn bản sao máy chủ)
lib/cad/luu-len-may-chu.ts                     (bản 2D + cổng chặn + 9 test)
components/cad/CadSheets.tsx:150-200           (resolveAndSyncCadDisk — đĩa cục bộ, mặc định off)
components/present-editor/PresentSheets.tsx    (khuôn hydrate 3 nguồn)
app/settings/_components/PixelSettingsShell.tsx (nơi thêm nhóm Lưu trữ)
lib/save-status.ts                              (đã có setDiskStatus — dùng lại)

TESTS TO RUN
node_modules/.bin/sucrase-node lib/cad/luu-len-may-chu.test.ts
npm test && npx tsc --noEmit

ACCEPTANCE
Rời một ngữ cảnh → quay lại → đúng ngữ cảnh đó (không chỉ đúng dự án).
Người không rành kỹ thuật đọc màn Lưu trữ vẫn hiểu mình đang được bảo vệ tới đâu.
Không đẻ kho dự án thứ hai.

STOP CONDITION
Nếu Workspace nhiều-cái-đặt-tên cần schema mới → DỪNG, ghi vào README, chờ Hoà. Phần dùng lại
resume thì làm được ngay.
