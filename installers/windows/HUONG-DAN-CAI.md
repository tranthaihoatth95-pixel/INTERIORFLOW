# Hướng dẫn cài InteriorFlow trên Windows · Windows Install Guide

> Bộ cài **unsigned** dùng nội bộ TTT Architects. Máy đích: Windows 10/11 x64 (đã test nhắm tới PC-TTTA-008 — i7-10700 · 32GB · GTX 1660). KHÔNG cần cài Node/Git để chạy app.

## 1 · Cài đặt · Install

1. Nhận file `InteriorFlow Setup 0.1.0.exe` (qua LAN/Zalo nội bộ).
2. Nếu Windows gắn cờ chặn file tải về: chuột phải file → **Properties** → tick **Unblock** → OK.
3. Double-click file Setup. Màn hình xanh SmartScreen "Windows protected your PC" là **bình thường** (app chưa ký số): bấm **More info** → **Run anyway**.
4. Chọn thư mục cài (mặc định trong hồ sơ user, không cần quyền Admin) → **Install**.
5. Xong: shortcut **InteriorFlow** trên Desktop + Start Menu.

## 2 · Điền API key · Configure API keys

Bộ cài **không kèm key nào**. Lần đầu mở app, app tự tạo file cấu hình tại
`C:\Users\<user>\AppData\Roaming\InteriorFlow\config.json` (AUTH_SECRET tự sinh sẵn).

1. Trong app: menu **Tệp → "Mở file cấu hình (API key)…"** (mở bằng Notepad).
2. Điền key vào giữa 2 dấu nháy — xin key từ chủ dự án:
   - `FAL_KEY` — render AI cloud (fal.ai)
   - `NVIDIA_API_KEY` — model NVIDIA NIM
   - `COMFYUI_URL` — ví dụ `http://127.0.0.1:8188` nếu máy này chạy ComfyUI local
   - `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — đăng nhập Google (tuỳ chọn)
3. Lưu file (Ctrl+S) → **thoát hẳn app → mở lại**. Để trống key nào thì tính năng AI tương ứng tắt, app vẫn dùng bình thường.

## 3 · Mở app & dữ liệu · Run & data

- Mở từ Start Menu/Desktop. App tự khởi động server nội bộ rồi hiện màn hình đăng nhập (lần đầu chờ ~10–20 giây tạo database).
- Đăng ký tài khoản đầu tiên ngay trong màn hình login.
- Dữ liệu (database `dev.db` + ảnh `uploads\`) nằm ở `C:\Users\<user>\AppData\Roaming\InteriorFlow\` — menu **Tệp → "Mở thư mục dữ liệu"**. Sao lưu = copy thư mục này.
- Máy khác/điện thoại cùng mạng LAN có thể mở `http://<IP-máy-này>:3777` (app phục vụ cả LAN).

## 4 · Gỡ cài đặt · Uninstall

**Settings → Apps → Installed apps → InteriorFlow → Uninstall.** Dữ liệu ở
`AppData\Roaming\InteriorFlow\` KHÔNG bị xoá theo — muốn xoá sạch thì xoá tay thư mục đó (nhớ sao lưu `dev.db` nếu cần giữ dự án).

## 5 · Sự cố thường gặp · Troubleshooting

| Triệu chứng | Xử lý |
|---|---|
| Màn hình xanh SmartScreen | More info → Run anyway (mục 1). |
| App mở nhưng trắng/lỗi server | Xem log `AppData\Roaming\InteriorFlow\db-push.log`; thử thoát hẳn (Task Manager: InteriorFlow) rồi mở lại. |
| Render AI báo lỗi key | Kiểm tra `config.json` (mục 2) — key đúng, đã lưu, đã mở lại app. |
| Đăng nhập bị văng sau khi cập nhật | `AUTH_SECRET` trong `config.json` bị đổi/xoá — không đụng vào dòng này. |

---
*Bộ cài build bằng electron-builder (NSIS, x64, unsigned). Build lại: xem `docs/BUILD-WINDOWS.md` — chạy `build-windows-native.bat` trên máy Windows. Phân phối NỘI BỘ TTT — không phát hành công khai (xem `docs/LICENSE-NOTES.md`).*
