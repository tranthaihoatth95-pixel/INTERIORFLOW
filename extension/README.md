# InteriorFlow Clipper (Chrome extension companion)

Không có API "kết nối kho extension Chrome". Thay vào đó đây là **extension companion tự xây**:
chuột phải một ảnh trên web → gửi vào thư viện **Reference** của app qua `POST /api/library/clip`.

## Nạp thử (dev)
1. Chrome → `chrome://extensions` → bật **Developer mode** → **Load unpacked** → chọn thư mục `extension/`.
2. Đăng nhập app ở `http://localhost:3000` trong cùng trình duyệt.
3. Chuột phải 1 ảnh bất kỳ trên web → **Clip ảnh vào InteriorFlow**. Badge `OK`/`ERR`.

## Trạng thái & giới hạn (đọc trước khi tin)
- Đây là **khung tối giản** (manifest MV3 + service worker). Chưa có popup/nút toolbar/chọn category.
- **Auth**: dựa cookie same-origin (`credentials:'include'`). Cookie `if_session` là `httpOnly` +
  `sameSite:'lax'` → gọi cross-origin từ extension **có thể bị chặn**. Bản production cần **token
  riêng cho extension** (cấp trong app → lưu ở extension storage → gửi header `Authorization`).
- Đổi `APP_ORIGIN` trong `background.js` theo nơi app chạy.

## Publish lên Chrome Web Store (tuỳ chọn, sau)
- Có **Chrome Web Store API** để publish tự động (khác hẳn "kết nối kho"): cần tài khoản dev CWS
  (phí 5$), OAuth client + `chrome.webstore` scope. Đây là hạng mục CI/CD riêng, chưa dựng ở đây.
