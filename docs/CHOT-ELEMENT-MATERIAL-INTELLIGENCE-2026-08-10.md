# CHỐT — ELEMENT CAPTURE + MATERIAL INTELLIGENCE (10/08/2026)

- Giữ và tái dùng `lib/vision/single-view-metrology.ts`: ảnh đơn không có scale tuyệt đối; kích thước
  thật phải đi qua neo, kèm tolerance và nhãn measured/inferred.
- Element Capture tách furniture/decor/tường/trần/sàn; có thể lưu Visual Asset, Estimated Asset
  hoặc cấu kiện Verified. Góc bị che do AI sinh không được coi là hình học đo thật.
- Vật liệu có một neo `ProductSpec.id` (`specId` trong Doc; giao diện có thể gọi matId), không tạo
  field song song. PBR thị giác và dữ liệu thương mại vẫn tách lớp nhưng resolve qua cùng neo.
- Đổi vật liệu là hai chiều và có phạm vi: món đang chọn, phòng, cùng loại hoặc toàn dự án. Trước
  khi đổi phải cho biết nơi ảnh hưởng; sau khi đổi 2D/3D/BOQ/MB/MĐ/Present đọc lại cùng nguồn.
- Ảnh chỉ được tạo MaterialSpec nháp: AI có thể suy nhóm/màu/PBR/map, tuyệt đối không bịa hãng,
  SKU, giá hay chứng chỉ. Trạng thái suy đoán giữ nguyên đến khi người dùng/nguồn thật xác nhận.

