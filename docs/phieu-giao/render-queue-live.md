# PHIẾU GIAO · RQ — HÀNG ĐỢI RENDER XEM TIẾN TRÌNH TRỰC TIẾP (Hoà cần 14/08)

## THẺ VAI [Đ4]
- VAI: RQ — agent UI render-studio, dựng bảng hàng đợi render thấy tiến trình từng view trực tiếp.
- PHẠM VI: `components/render-studio/RenderQueuePanel.tsx` (MỚI) + 1 hook/store nhỏ cùng thư mục + điểm cắm vào màn Dựng ảnh. ⛔ KHÔNG đụng lib/idfc-import, components/library, lib/grounded-render ruột.
- ĐIỀU KHOẢN RUỘT: [T5] huỷ được từng job · [N1] tội ④ tiến trình THẬT không spinner giả — dùng `onProgress` thật của `runImageJob` (lib/ai/client.ts:42) · [Đ2] tái dùng `LightArc` (components/ui) cho cung tiến độ + khuôn kính ToolWindow.

## ① BỐI CẢNH
Hoà chạy loạt 4-5 view (task DF4) và cần NHÌN THẤY: view nào đang render, phần trăm thật, xong thì ảnh hiện ngay tại chỗ, cái nào lỗi thì báo. Hiện app chỉ có tiến độ rời rạc trong từng node — không có khung nhìn cả loạt (NT-18 của bộ nguyên tắc: "xuất = hàng đợi + dải kết quả").

## ④ VIỆC
1. Store hàng đợi: danh sách job {id, tên view, ảnh nguồn, trạng thái chờ/đang/xong/lỗi/huỷ, progress 0-1, ảnh kết quả, thời gian}. Chạy TUẦN TỰ (mặc định 1 job/lượt — tránh đốt credit song song), có nút Huỷ từng job + Huỷ tất cả (AbortSignal thật).
2. `RenderQueuePanel`: dải thẻ ngang/dọc mỗi view — thumbnail nguồn + LightArc tiến độ + % số thật (tabular-nums) + trạng thái bằng MÀU CÓ NGHĨA (đang chạy = accent, xong = xanh, lỗi = đỏ kèm lý do đọc được); xong thì thumbnail đổi sang ẢNH KẾT QUẢ ngay tại thẻ, bấm phóng to. Tổng: "3/5 xong · còn ~2 phút" (ước từ thời gian job đã xong, không bịa).
3. Cắm vào màn Dựng ảnh (chặng 3D) chỗ hợp lý nhất, mặc định thu gọn, mở/tắt được (đúng nếp cửa sổ nổi).
4. **Nạp job thật**: nối với đường chạy node render hiện có; nếu chưa có API gom loạt thì cho phép thêm job từ node đang chọn (1 nút "Thêm vào hàng đợi") — khai rõ phần nào chưa nối.
5. Verify browser thật (server 3000, session sẵn — KHÔNG login): dựng 2-3 job GIẢ LẬP (mock progress, 0 credit) chạy thật trong UI để chứng minh tiến trình chạy mượt + huỷ được; **chụp 2-3 screenshot** (lúc đang chạy, lúc xong, lúc lỗi) lưu `docs/bao-cao-phien/anh/2026-08-14-RQ-*.png` — T sẽ gửi Hoà xem.
6. tsc 0 · soi:tu-dien 0 lệch mới · không dùng chữ "tự động".

## ⑦
Báo cáo `docs/bao-cao-phien/2026-08-14-RQ-render-queue.md`. Trả T ≤10 dòng + đường dẫn screenshot.
