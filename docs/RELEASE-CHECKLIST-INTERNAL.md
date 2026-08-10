# Checklist phát hành nội bộ — InteriorFlow

Phạm vi: bản desktop dùng trong nội bộ. Đây là ứng dụng local-first: mỗi máy có SQLite và thư mục uploads riêng. Không tuyên bố đồng bộ, cộng tác realtime, hoặc truy cập LAN.

## 1. Khoá bản phát hành

- [ ] Ghi số phiên bản, commit nguồn và ngày build.
- [ ] Chạy `npm run check:chot`, `npm run release:preflight`, `npx tsc --noEmit`, `npm test`, `npm run build` trên cây sạch.
- [ ] Đọc `docs/LICENSE-NOTES.md`: chỉ phát hành khi cách sử dụng/phân phối DWG GPL đã được người phụ trách pháp lý chấp thuận cho phạm vi nội bộ. Nếu chưa có, tắt hoặc loại đường DWG khỏi bộ cài.
- [ ] Rà trung tính: không có tên, logo, ảnh, dữ liệu khách/studio trong intro, template mặc định, output mẫu, metadata installer hay config mẫu.
- [ ] Kiểm những định dạng chưa có editor vẫn bị khoá hoặc ghi rõ “chưa hỗ trợ”, không tạo hành động giả.

## 2. Sao lưu và nâng cấp dữ liệu

- [ ] Khi bản app đổi phiên bản, lần mở đầu tự tạo snapshot `backups/<thời-gian>-before-<phiên-bản>` gồm SQLite (`dev.db`, WAL/SHM nếu có) và `uploads` trước khi kiểm tra schema. Nếu không tạo được snapshot, app phải dừng; không bỏ qua.
- [ ] Trước khi nâng cấp một máy đang dùng, đóng InteriorFlow.
- [ ] Xác minh snapshot vừa tạo có DB và uploads trước khi tiếp tục nâng cấp; lưu thêm một backup độc lập cho dữ liệu công việc quan trọng.
- [ ] Cài thử bản mới trên một bản sao dữ liệu; không thử trực tiếp trên dữ liệu công việc duy nhất.
- [ ] Nếu app báo lỗi kiểm tra/nâng cấp schema: dừng lại, giữ nguyên DB, lấy `db-push.log`, khôi phục từ backup nếu được hướng dẫn. Không xoá DB hoặc chạy lệnh Prisma tùy tiện.
- [ ] Quyết định rõ chính sách giữ dữ liệu khi gỡ cài đặt trước khi đưa cho người dùng.

## 3. Máy sạch — smoke test bắt buộc

Thử tối thiểu một máy Windows x64 sạch. Nếu phát hành macOS, lặp lại trên macOS arm64 sạch.

- [ ] Cài installer; mở app không cần Node/npm.
- [ ] Xác nhận app chỉ mở tại `127.0.0.1`, không truy cập từ máy khác trong LAN.
- [ ] Tạo tài khoản local, đăng nhập lại sau khi thoát/mở app.
- [ ] Tạo dự án trung tính, vẽ/sửa/lưu/mở lại; thử một asset upload và kiểm tra còn sau khi mở lại.
- [ ] Xuất một PDF/IDFP và mở file kết quả.
- [ ] Đóng app, mở lại, kiểm tra dự án + uploads còn nguyên.
- [ ] Cài bản mới hơn lên bản có dữ liệu; kiểm tra dữ liệu còn nguyên và migration log không có lỗi.
- [ ] Gỡ app trên máy thử; kiểm tra chính sách giữ/xóa userData đúng như đã thông báo.

## 4. Vận hành nội bộ

- [ ] Cấu hình key cloud qua menu **Tệp → Mở file cấu hình**; không nhúng key trong mã hoặc installer.
- [ ] Chỉ bật auto-update qua `INTERIORFLOW_AUTO_UPDATE=1` khi đã có kho phát hành, ký số và quy trình duyệt bản cập nhật nội bộ.
- [ ] Lưu vị trí backup, phiên bản app, người vận hành và kết quả smoke test vào sổ phát hành của đội.
- [ ] Có người chịu trách nhiệm hỗ trợ: quy trình lấy log, khôi phục DB, đổi/thu hồi API key.

## Chưa đạt cho bản rộng hơn nội bộ

Ký/notarize bộ cài, server đồng bộ có phân quyền, cập nhật OTA có chữ ký, chính sách quyền riêng tư, và xử lý giấy phép DWG cho phân phối bên ngoài là các cổng riêng. Không dùng checklist này để tuyên bố sẵn sàng public/store.
