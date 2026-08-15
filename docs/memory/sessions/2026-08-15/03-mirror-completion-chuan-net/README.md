# 03 · Mirror-completion cho chuan-net — đối xứng chân/vòng tay vịn

## Bối cảnh
Hoà tự phân tích bằng lời (không biết code đã có sẵn): mesh sinh từ ảnh cần hiểu "chân nào giống
chân nào" dù hình học coi 4 chân "như nhau" — không nên tìm cách nhìn-nhớ-vẽ-lại (mất dữ kiện ánh
xạ → khối chết), mà nên: dò shape 2D qua contrast, đóng khung lưới, đổi nét thành màu-ID, và với
vật đối xứng thì DÙNG LỆNH MIRROR thay vì giải 2 bên độc lập (đỡ sai + đồng bộ).

**Trùng khớp đúng bệnh đã bắt hôm nay**: `chuan-net.ts:952` — torus tay vịn bị annularity check
từ chối vì "không trục đối xứng đơn". Trục đối xứng ĐANG dùng để TỪ CHỐI, chưa dùng để SINH.

## Quyết định
Chốt thêm bước mirror-completion: dò mặt phẳng đối xứng qua PCA trên tâm các part cùng loại, phần
fit chắc hơn (RMS thấp) làm gốc, mirror sang phần đối xứng — thay vì cộng dồn sai số 2 lần.

## Thực thi (giao agent nền, T kiểm soát)
Agent tự đọc `chuan-net.ts` (1050+ dòng), viết `mirrorCompleteShapes()` (PCA dò trục + union-find
gộp cụm đối xứng qua nhiều trục — xử lý đúng ca 4 chân ghế qua 2 mặt trái-phải + trước-sau), nối
vào `chuanNetGeometry()` sau fit, trước rebuild mesh cuối. Thêm field `mirroredFrom?: string`
(optional) cho truy vết.

## Kết quả — ĐÃ COMMIT
Commit `f423652` "feat(idfc): mirror-completion cho chuan-net". 178 test pass (74 mới + 104 cũ
không vỡ), `tsc --noEmit` 0 lỗi toàn repo. Chưa push.

## Phát hiện phụ đáng nhớ
Thuật toán KHÔNG thể từ chối 1 cặp (n=2) cùng vai trò — 2 điểm bất kỳ luôn có mặt trung trực khớp
tầm thường (sự thật toán học, không phải bug). Với furniture thật, 2 part cùng "kind" gần như
chắc chắn phải đối xứng nên chấp nhận được — nhưng ghi lại phòng khi cần thêm điều kiện phụ sau.

## Đã ghi vào sổ chính thức
`docs/00-CHOT.md` dòng "[14/08 Hoà chốt] MIRROR ĐỐI XỨNG cho chuan-net" + `frontier-registry.mjs`
entry `mirror-doi-xung-chuan-net` (đã sang trạng thái xong-máy, chưa xong-mắt).
