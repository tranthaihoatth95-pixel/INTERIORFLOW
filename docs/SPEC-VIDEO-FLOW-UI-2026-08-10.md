# SPEC · Luồng Video xuyên chặng

**Trạng thái:** giao diện chống quên · 10/08.  Nối `CHOT-VIDEO-2-TANG-2026-08-02.md` và
`SPEC-VIDEO-MAT-BANG.md`; không tạo scene hay timeline thứ hai.

## 1. Phân vai

| Nơi | Việc được làm | Nguồn sự thật |
|---|---|---|
| **3D Thiết kế · 3D** | đặt camera, vẽ `IF_CAMPATH`, xem đường đi, sinh footage | `Doc` + camera path |
| **Trình chiếu · Video** | chọn footage/still/nhạc, cắt nhịp, title, màu, xuất | footage liên kết từ chặng 3D |

Không có nút “dựng lại scene” ở Video. Sửa đường cam hoặc góc máy luôn quay lại chặng 3D.

## 2. Nhóm công cụ chặng 3D

1. **Cảnh & mô hình** — dựng/tổ chức khối, tầng, vật liệu, ánh sáng.
2. **Máy quay & đường cam** — góc máy, lens, safe frame, `IF_CAMPATH`, điểm nhìn.
3. **Sinh ảnh & phim** — still, draw-on plan, cam path 2D, walkthrough 3D, image/text-to-video.
4. **Kiểm tra & bàn giao** — vùng giao thông, thời lượng, render queue, gửi footage sang Trình chiếu.

Mỗi nhóm thu gọn được. Tìm kiếm mở mọi kết quả; công cụ chưa có engine hiện “Sắp có” cùng lý do,
không có nút chạy giả.

## 3. Đầu ra chặng 3D

| Loại | Mức hiện tại | Vitals tối thiểu |
|---|---|---|
| Draw-on plan | 0 credit, local | tầng · thời lượng · số lớp |
| CamPath 2D | 0 credit, local | đường · lens · tốc độ · look-at |
| Traffic flow | kiểm điều kiện zone/door trước khi chạy | kịch bản · vùng thiếu dữ liệu |
| Walkthrough 3D | preview khối thô | camera · frame · thời lượng |
| Image/Text-to-video | cloud, chỉ khi có key/credit | model · credit · seed · trạng thái |

## 4. Đầu ra chặng Trình chiếu

Video editor nhận clips liên kết, hiển thị rõ “đồng bộ từ 3D” và hành động **Mở góc máy**. Timeline
chỉ có shot, audio, title/colour; cấm thêm scene graph hoặc keyframe 3D. Màn Video chưa có editor
thật vẫn phải hiển thị mẫu và trạng thái “Sắp có”, không được hứa xuất MP4.

## 5. Hợp đồng mock

- `docs/mocks/mock-video-sinh-phim-3d-2026-08-10.html`: chặng 3D, camera path → footage.
- `docs/mocks/mock-trinh-video-2026-08-04.html`: chặng Trình chiếu, dựng footage.
- Hai mock dùng 2 theme và token IF; ảnh chỉ để minh hoạ đúng ngữ cảnh không gian/phim.
