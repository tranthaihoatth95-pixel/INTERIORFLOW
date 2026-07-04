# InteriorFlow — Bản Desktop (Electron → .exe Windows)

Tài liệu này hướng dẫn đóng gói **InteriorFlow** thành **ứng dụng desktop native cho Windows** (`.exe` cài đặt) bằng Electron, **giữ nguyên toàn bộ backend** (API routes + Prisma/SQLite chạy bên trong app, không cần server LAN riêng).

> App này **không phải web tĩnh** — nó có API routes (`app/api/**`) và cần Node server + SQLite. Vì vậy Electron sẽ **tự khởi động Next.js production server** trên một cổng nội bộ rồi mở cửa sổ trỏ vào đó. Không cần cài Node hay chạy `npm` gì trên máy người dùng cuối — mọi thứ nằm trong file cài.

---

## 1. Yêu cầu để BUILD ra .exe

Build `.exe` cho Windows **nên chạy trên chính máy Windows** (electron-builder đóng gói native theo hệ điều hành; build NSIS installer trên macOS/Linux dễ vướng thiếu công cụ). Cần:

- **Windows 10/11 (x64)**.
- **Node.js ≥ 18** (khuyến nghị 20 LTS) + npm — tải ở <https://nodejs.org>.
- **Git** (để clone/pull mã nguồn).
- Kết nối mạng lần đầu (để `npm install` tải Electron + electron-builder).

> Máy đích để **CHẠY** app (dàn render công ty) thì **không cần Node** — chỉ cần chạy file cài `.exe`.

---

## 2. Các bước build ra .exe

Tại thư mục dự án trên máy Windows:

```powershell
# 1) Cài dependencies (kèm postinstall tự chạy `prisma generate`)
npm install

# 2) Build Next.js production rồi đóng gói .exe bằng electron-builder
npm run electron:build
```

Xong, file cài nằm trong thư mục **`dist/`**:

- `dist/InteriorFlow Setup <version>.exe` — **bộ cài NSIS** (đây là file mang đi cài trên máy khác).
- `dist/win-unpacked/` — bản chạy thử không cần cài (mở `InteriorFlow.exe` bên trong để test nhanh).

> Lần đầu `npm run electron:build` sẽ tải Electron binary (~100–200MB) → hơi lâu, các lần sau nhanh hơn nhờ cache.

### Chạy thử ở chế độ dev (không cần build)

```powershell
npm run electron:dev
```

Lệnh này chạy `next dev` (cổng 3000) rồi mở cửa sổ Electron trỏ vào `http://localhost:3000` — vòng lặp sửa UI nhanh, hot-reload như web. (Ở chế độ dev, Electron **không** tự spawn server production mà dùng luôn `next dev`.)

---

## 3. Cơ chế chạy bên trong (tóm tắt kỹ thuật)

Khi mở app đã cài (`electron/main.js`):

1. **Chuẩn bị thư mục ghi được** trong `userData` (xem mục 4): tạo `dev.db` + thư mục `uploads`.
2. **Chạy `prisma migrate deploy`** (chỉ bản đóng gói, lần đầu) để tạo/nâng cấp schema vào `dev.db`.
3. **Dò cổng trống** bắt đầu từ `3777` rồi **spawn `next start`** (production) ở cổng đó, chỉ nghe `127.0.0.1` (không mở ra LAN).
4. **Poll HTTP** tới khi server trả lời, rồi mới tạo cửa sổ `BrowserWindow` load `http://127.0.0.1:<port>`.
5. Đóng app → **kill server**. Có **single-instance lock** (mở app lần 2 chỉ đưa cửa sổ cũ lên trước). Menu tối giản, `contextIsolation: true`, `nodeIntegration: false`.

---

## 4. SQLite & uploads nằm ở ĐÂU khi cài trên Windows

Thư mục cài app (Program Files / thư mục người dùng chọn) là **chỉ đọc / không nên ghi**. Vì vậy dữ liệu động được ghi vào **thư mục userData của Electron**:

```
C:\Users\<TênNgườiDùng>\AppData\Roaming\InteriorFlow\
    ├─ dev.db            ← database SQLite (users, flows, credits, chat, metadata thư viện)
    └─ uploads\          ← file ảnh thư viện team (LibraryAsset lưu ở đây)
```

Cơ chế để **không phải sửa bất kỳ API route nào**:

- Các route thư viện dùng `path.join(process.cwd(), 'uploads')`. Electron **spawn server với `cwd` = thư mục userData**, nên `process.cwd()/uploads` rơi đúng vào `...\AppData\Roaming\InteriorFlow\uploads\` (ghi được).
- Đồng thời truyền tham số `next start <appRoot>` để Next vẫn đọc `.next` từ nơi đóng gói (trong `resources\app.asar.unpacked`).
- **`DATABASE_URL`** được Electron **ghi đè lúc chạy** thành đường dẫn **tuyệt đối** tới `dev.db` trong userData:
  ```
  DATABASE_URL = file:C:\Users\<TênNgườiDùng>\AppData\Roaming\InteriorFlow\dev.db
  ```
  (Prisma chấp nhận `file:` với path tuyệt đối. Bạn **không cần** set biến này thủ công — `electron/main.js` tự làm trong hàm `prepareWritablePaths()`.)

> **Sao lưu / reset dữ liệu**: copy hoặc xoá thư mục `...\AppData\Roaming\InteriorFlow\`. Xoá `dev.db` → lần mở kế app sẽ tạo lại DB rỗng (migrate deploy chạy lại).

> **Đổi vị trí DB thủ công (nâng cao)**: nếu muốn DB nằm chỗ khác (ổ D, thư mục chung...), sửa hằng trong `prepareWritablePaths()` ở `electron/main.js` cho trỏ tới path mong muốn, hoặc set sẵn biến môi trường `DATABASE_URL` ở cấp hệ thống trước khi mở app (main.js ưu tiên giữ giá trị đã có nếu bạn chỉnh lại logic — mặc định hiện tại là luôn trỏ userData cho an toàn).

---

## 5. Biến môi trường (fal.ai, secret…)

- **`AUTH_SECRET`**: app cần secret để ký JWT. Khi build, giá trị trong `.env` **không** được đóng gói (`.env` bị `.gitignore`). Với bản desktop nội bộ, nên **đặt sẵn một `AUTH_SECRET` cố định**: dễ nhất là thêm dòng `AUTH_SECRET=...` vào `electron/main.js` (trong `serverEnv`) trước khi build, hoặc tạo file `.env.production` cạnh app root và để Next tự nạp. (Nếu thiếu, mỗi lần mở app secret khác nhau → user phải đăng nhập lại; với 1 máy dùng nội bộ vẫn chấp nhận được.)
- **`FAL_KEY`**: để render AI qua fal.ai. Tương tự, nhét vào `serverEnv` trong `electron/main.js` hoặc `.env.production`. Không có key thì app vẫn chạy, chỉ là node AI báo chưa cấu hình.

> Gợi ý gọn: mở `electron/main.js`, trong object `serverEnv` (hàm `startNextServer`) thêm:
> ```js
> AUTH_SECRET: 'chuỗi-bí-mật-cố-định-của-team',
> FAL_KEY: 'fal-key-nếu-muốn-gắn-sẵn',
> ```
> rồi build lại. Comment sẵn vị trí đã có trong file.

---

## 6. Cài lên dàn máy render công ty (khuyến nghị dùng)

Dàn máy công ty (đang chạy **3ds Max + V-Ray / D5 Render**, GPU mạnh, RAM lớn) là nơi lý tưởng để chạy bản `.exe` này **native**:

1. Copy `dist/InteriorFlow Setup <version>.exe` sang máy render, chạy để cài.
2. Mở **InteriorFlow** từ Start Menu / shortcut desktop → app tự dựng server nội bộ, không cần Node, không cần vào `http://<ip>:3000` như trước.
3. Dữ liệu (DB + ảnh) nằm trong `AppData\Roaming\InteriorFlow\` của user đăng nhập Windows.

**Vì sao nên chạy trên máy này**: về sau nối **ComfyUI local** (self-host FLUX.1 trên chính GPU render) qua một provider mới trong `lib/ai/providers/` → **render ảnh 0đ/ảnh, không gửi bản vẽ khách ra ngoài**, tận dụng đúng con máy đã có sẵn cho V-Ray/D5. Bản desktop chạy ngay cạnh ComfyUI trên cùng máy nên độ trễ thấp, không phụ thuộc mạng.

- Không thay thế 3ds Max/V-Ray — mà **bổ trợ**: xuất viewport/clay từ Max → Import Image → AI polish/relight/upscale trong InteriorFlow.
- Khi có provider ComfyUI: trỏ endpoint về `http://127.0.0.1:8188` (ComfyUI mặc định) — cùng máy nên gọi nội bộ.

---

## 7. Các file thuộc bản Electron (để review / merge)

Chỉ thêm mới + sửa cấu hình, **không đụng UI/components/store/logic API**:

| File | Vai trò |
|------|---------|
| `electron/main.js` | Tiến trình chính: spawn Next server, dò cổng, đợi sẵn sàng, tạo cửa sổ, kill khi thoát, single-instance, menu, migrate lần đầu, trỏ DB/uploads về userData. |
| `electron/preload.js` | Preload tối thiểu, `contextIsolation` true, chỉ phơi cờ `isElectron` + version. |
| `electron/icons/icon.png` | Icon app (512×512, **placeholder** — nên thay bằng icon thật; electron-builder tự sinh `.ico` cho Windows từ PNG này). |
| `package.json` | Thêm `main`, devDeps (electron, electron-builder, wait-on, cross-env, concurrently), scripts `electron` / `electron:dev` / `electron:build`, `postinstall` (prisma generate), và block `build` cho electron-builder. |
| `next.config.mjs` | Thêm ghi chú về tuỳ chọn `output: 'standalone'` (không bật — giữ dev/start như cũ). |
| `.gitignore` | Bỏ qua thư mục `dist/`. |
| `README-electron.md` | Tài liệu này. |

### Thay icon thật
Đặt file `icon.png` **512×512** (hoặc `.ico` đa kích thước) vào `electron/icons/`, giữ nguyên tên → build lại. Muốn icon `.exe` sắc nét mọi cỡ, tạo `electron/icons/icon.ico` (chứa 16/32/48/256px).

---

## 8. Lưu ý khi MERGE nhánh `feat/electron`

- **Không xung đột logic**: nhánh này chỉ **thêm file mới** (`electron/*`, `README-electron.md`) và sửa `package.json` + `next.config.mjs` + `.gitignore`. Không sửa `app/`, `components/`, `lib/`, `prisma/schema.prisma`.
- **`package.json`**: điểm dễ đụng độ nếu nhánh khác cũng thêm dependency/script. Khi merge, hợp nhất khối `dependencies`/`devDependencies`/`scripts`, và **giữ lại**: `"main": "electron/main.js"`, các script `electron*`, `postinstall`, và toàn bộ block `"build"`.
- **Sau merge, chạy lại `npm install`** để kéo devDeps mới của Electron.
- **Không cần** đổi Prisma provider hay schema — vẫn SQLite. Khi nào lên Postgres/Supabase, đổi provider như RESUME.md mô tả; bản Electron vẫn hoạt động (chỉ cần `DATABASE_URL` trỏ Postgres, khi đó bỏ qua phần userData SQLite).
- **Kiểm tra type sau merge**: `npx tsc --noEmit` (đừng chạy `npm run build` khi `next dev` đang chạy cổng 3000 — sẽ hỏng `.next`).
```
