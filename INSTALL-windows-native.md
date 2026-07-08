# InteriorFlow — Bản Windows NATIVE (.exe) · Hướng dẫn cài đặt

App desktop native thật: **cửa sổ riêng, có icon, vào Start Menu, KHÔNG mở trình duyệt, KHÔNG cần gõ lệnh**. Backend (API + Prisma/SQLite) chạy sẵn bên trong app — mở là dùng.

Vì `.exe` Windows phải **đóng gói trên máy Windows** (không cross-build từ Mac được), quy trình gồm **2 lần**: build 1 lần → rồi cài + dùng mãi.

---

## PHẦN A — Tạo bộ cài .exe (làm 1 lần, trên máy RTX công ty)

1. **Cài Node.js LTS** (nếu chưa có): tải ở <https://nodejs.org> → cài như phần mềm thường.
2. **Giải nén** `InteriorFlow-install.zip` ra một thư mục (vd `D:\InteriorFlow`).
3. *(Tuỳ chọn — muốn AI render thật)* mở file `electron\main.js`, tìm khối `serverEnv` (khoảng dòng 167) và bỏ comment / thêm:
   ```js
   COMFYUI_URL: 'http://127.0.0.1:8188',
   COMFY_SKETCH_WF: 'sketch_canny',
   ```
   (bỏ qua bước này thì app vẫn chạy, node AI ở chế độ mock; nối ComfyUI sau cũng được.)
4. **Double-click `build-windows-native.bat`** → nó tự: cài thư viện → build → đóng gói.
   - Chờ vài phút. Xong nó in ra đường dẫn file cài trong thư mục **`dist\`**.

Kết quả: `dist\InteriorFlow Setup 1.0.0.exe` — **đây là bộ cài native để phát cho các máy.**

---

## PHẦN B — Cài & dùng (trên máy nào cũng được, KHÔNG cần Node)

1. Copy file **`InteriorFlow Setup 1.0.0.exe`** sang máy cần dùng.
2. **Double-click** → cài như phần mềm thường (chọn thư mục → Install → Finish).
   - Windows SmartScreen có thể cảnh báo (app chưa mua chữ ký số): bấm **More info → Run anyway**.
3. Mở **InteriorFlow** từ Start Menu / icon desktop → cửa sổ app hiện ra, tự chạy server bên trong.
4. **Tài khoản đăng ký đầu tiên = admin.** Đăng nhập email/SĐT (Google chỉ chạy khi có domain https).

**Dữ liệu** (database + ảnh upload) nằm ở `%APPDATA%\InteriorFlow` — gỡ app không mất; cài lại vẫn còn.

---

## Nối AI render trên máy RTX (0đ)
Xem `INSTALL-windows.md` mục **"đường SDXL"**: cài ComfyUI Desktop + model → app tự dùng qua `COMFYUI_URL` (đã set ở Phần A bước 3). Node **Clay→Render / Sketch→Render** cho ảnh thật.

## Xuất cho khách
Node **Export Deck**: **PDF** + **PowerPoint (.pptx)** 16:9, ảnh nhúng sẵn (khách xem không cần mạng).

---

## TỰ CẬP NHẬT OTA (Hướng 2) — khỏi cài lại khi có tính năng mới

App đã gắn **electron-updater**: mỗi lần mở, nó tự kiểm bản mới trên **GitHub Releases**, tải + cài ngầm; bản mới áp dụng ở lần mở kế tiếp. **Máy dùng cuối không phải làm gì.**

**Cách phát bản mới (làm trên máy build, mỗi lần có tính năng mới):**
1. `git pull` mã mới.
2. Tăng số `version` trong `package.json` (vd `0.1.0` → `0.1.1`) — bắt buộc, updater so version.
3. Tạo **GitHub token** (github.com → Settings → Developer settings → Tokens, quyền `repo`) → đặt biến môi trường:
   ```powershell
   $env:GH_TOKEN="ghp_...."
   ```
4. `npm run electron:publish` → build + **tự đẩy bản cài lên GitHub Releases** của repo INTERIORFLOW.
5. Xong. Mọi máy đã cài app sẽ **tự cập nhật** lần mở tiếp theo.

> App chưa mua chữ ký số → Windows có thể cảnh báo lúc updater cài bản mới (nội bộ dùng vẫn ổn). Muốn hết cảnh báo: mua code-signing certificate sau.

## Điện thoại Oppo dùng chung "hub" Windows
App Windows giờ phục vụ cả LAN (`0.0.0.0`). Muốn Oppo trỏ vào **máy Windows** (thay vì Mac):
- Lấy IP LAN máy Windows (`ipconfig` → IPv4). Sửa `server.url` trong bản APK sang `http://<IP-windows>:<cổng>` rồi build lại APK **một lần**.
- Sau đó máy Windows tự cập nhật (OTA) → Oppo tự thấy tính năng mới (vì nó chỉ là cửa sổ nhìn vào server đó), **khỏi build lại APK cho mỗi tính năng.**

---
### Nếu chỉ muốn chạy nhanh, chưa cần bản cài native
Vẫn còn cách cũ: double-click `setup-windows.bat` → app chạy ở cửa sổ trình duyệt `localhost:3000`. Nhẹ, không cần build, nhưng không phải app native.
