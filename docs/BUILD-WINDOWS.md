# BUILD-WINDOWS — Đóng gói InteriorFlow thành bộ cài `.exe`

> Bản `.exe` **phải build trên máy Windows** (electron-builder đóng gói NSIS theo hệ điều hành —
> build chéo từ macOS dễ vướng thiếu công cụ, không hỗ trợ chính thức). Máy Windows công ty
> (dàn render RTX) là nơi build phù hợp nhất.
>
> Config đóng gói đã có sẵn trong `package.json` (block `"build"` → `win.target = nsis, x64`)
> — **không cần sửa gì**, chỉ chạy đúng các lệnh dưới.

## 1. Chuẩn bị máy Windows (một lần)

1. Cài **Node.js 20 LTS** — tải ở <https://nodejs.org>, cài Next → Next → Finish.
2. Cài **Git** — <https://git-scm.com/download/win> (nếu clone từ GitHub; copy thư mục nguồn qua USB/LAN cũng được).
3. Mạng Internet cho lần `npm ci` đầu (tải Electron binary ~100–200MB, các lần sau có cache).

## 2. Lấy mã nguồn

```powershell
# Cách A — clone từ GitHub (cần quyền truy cập repo):
git clone git@github.com:tranthaihoatth95-pixel/INTERIORFLOW.git
cd INTERIORFLOW
# đúng nhánh cần đóng gói (hỏi chủ dự án nhánh nào là bản phát hành):
git checkout feat/present-layout-ml-p1

# Cách B — copy nguyên thư mục dự án từ máy Mac sang (KHÔNG copy node_modules, .next, dist).
```

## 3. Build

```powershell
# 1) Cài dependencies (postinstall tự chạy `prisma generate`)
npm ci

# 2) Build Next.js production + đóng gói NSIS installer
npm run electron:build
```

Kết quả trong thư mục **`dist/`**:

| File | Vai trò |
|---|---|
| `dist/InteriorFlow Setup 0.1.0.exe` | **Bộ cài NSIS** — file mang đi cài trên các máy khác. |
| `dist/win-unpacked/InteriorFlow.exe` | Bản chạy thử không cần cài (test nhanh trước khi phát hành). |

Máy đích để **chạy** app không cần Node/Git — chỉ cần file Setup.

## 4. ⚠️ App CHƯA ký số (unsigned) — màn hình xanh SmartScreen

Vì bộ cài không có chữ ký số (code-signing certificate ~$200–400/năm, chưa mua), Windows
**SmartScreen sẽ chặn với màn hình xanh** "Windows protected your PC" khi chạy Setup lần đầu.

Cách mở (hướng dẫn người cài):

1. Ở màn hình xanh, bấm **"More info"** (chữ nhỏ bên trái).
2. Bấm nút **"Run anyway"** vừa hiện ra.
3. Cài như phần mềm bình thường (Next → Install).

Nếu file tải qua trình duyệt/Zalo bị gắn cờ chặn: chuột phải file `.exe` → **Properties** →
tick **Unblock** → OK, rồi chạy lại. Đây là hành vi bình thường với app nội bộ chưa ký số —
không phải virus.

## 5. Sau khi cài — dữ liệu nằm ở đâu

- App tự khởi động server Next nội bộ (chỉ nghe `127.0.0.1`, không mở ra LAN).
- Database SQLite + ảnh uploads nằm ở `C:\Users\<user>\AppData\Roaming\InteriorFlow\`
  (`dev.db` + `uploads\`). Sao lưu = copy thư mục này; chi tiết cơ chế xem `README-electron.md` mục 3–4.
- Tạo admin đầu tiên (register công khai đã khoá):
  ```powershell
  set SEED_ADMIN_EMAIL=admin@ttt.vn
  set SEED_ADMIN_PASSWORD=matkhau6+
  node_modules\.bin\sucrase-node scripts\seed-admin.ts
  ```
  (chạy từ thư mục mã nguồn, `DATABASE_URL` trỏ tới file `dev.db` trong AppData nếu muốn seed
  vào DB của bản đã cài: `set DATABASE_URL=file:C:\Users\<user>\AppData\Roaming\InteriorFlow\dev.db`).

## 6. Biến môi trường nhúng (tuỳ chọn, trước khi build)

`.env` không được đóng gói. Muốn bản cài có sẵn `AUTH_SECRET` cố định (giữ đăng nhập qua các
lần mở app) và `FAL_KEY` (render AI cloud): mở `electron/main.js`, thêm vào object `serverEnv`
trong hàm `startNextServer` rồi mới build — xem `README-electron.md` mục 5.

## 7. Lỗi thường gặp

| Triệu chứng | Xử lý |
|---|---|
| `npm ci` báo lỗi python/msbuild | Cài "Desktop development with C++" qua Visual Studio Build Tools (hiếm gặp — sharp/prisma có prebuilt). |
| Build treo ở "downloading Electron" | Mạng chậm/proxy — chạy lại, có cache sẽ nhanh. |
| `next build` fail vì thiếu `DATABASE_URL` | Tạo file `.env` ở gốc: `DATABASE_URL="file:./dev.db"` rồi `npx prisma db push` tạo DB. |
| Đang chạy `next dev` mà build | Tắt dev server trước — build đè `.next` sẽ hỏng. |
