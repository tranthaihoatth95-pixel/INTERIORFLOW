# Cài InteriorFlow lên OPPO Find N6 (Android / foldable)

Gói này tối ưu cho **OPPO Find N6** — máy gập:
- Màn ngoài (cover): 6.62", 1140×2616 (~20:9), 431 ppi, 120Hz — hẹp & cao.
- Màn trong (mở ra): 8.12", 2248×2480 (~1:1.1, gần vuông), 412 ppi, 120Hz.
- Chip Snapdragon 8 Elite Gen 5 + GPU Adreno 840 — thừa sức chạy canvas React Flow mượt.

App **không phải bản tĩnh** — nó cần server Next.js đang chạy (auth, API AI, DB).
Vậy nên có server chạy sẵn (máy Mac trong cùng Wi-Fi, hoặc host trên mạng) là **bắt buộc**.

---

## Cách A — Cài PWA ngay qua LAN (nhanh nhất, không build gì)

Dùng khi máy Mac và điện thoại **cùng một Wi-Fi**.

### 1. Chạy dev server mở ra LAN (trên máy Mac)
```bash
npm run dev -- -H 0.0.0.0
```
`-H 0.0.0.0` để server nghe trên mọi card mạng, không chỉ localhost.

### 2. Tìm IP LAN của máy Mac
```bash
ipconfig getifaddr en0   # Wi-Fi (nếu trống thử en1)
```
Ví dụ máy này: **192.168.126.92** (IP của bạn có thể khác).

### 3. Trên điện thoại: mở Chrome → vào
```
http://192.168.126.92:3000
```
(thay bằng IP thật ở bước 2)

### 4. Add to Home Screen
- Chrome → menu **⋮** → **Add to Home screen** (Thêm vào màn hình chính) → **Install**.
- Vì đã có `manifest.webmanifest` (`display: standalone` + `display_override: window-controls-overlay`),
  app mở **toàn màn hình như app native**, ẩn thanh địa chỉ.
- Icon dùng `/icon-192.png`, `/icon-512.png` + maskable → OPPO cắt icon tròn/squircle đẹp.
- `orientation: "any"` → app tự xoay & tự co giãn khi **gập/mở** máy (cover ↔ inner).

> Lưu ý: mỗi lần dùng phải có `npm run dev` chạy trên Mac. Tắt Mac / đổi Wi-Fi thì mất kết nối.
> Nếu HTTPS bắt buộc (một số tính năng PWA), dùng `npx localtunnel --port 3000` để có URL https tạm.

---

## Cách B — Đóng APK cài thật (TWA qua Bubblewrap)

Tạo file `.apk`/`.aab` cài như app thường. TWA (Trusted Web Activity) = vỏ Android bọc URL web.
**Cần một URL chạy được** (host thật, hoặc URL localtunnel/ngrok ổn định trỏ về server đang chạy).

### B1. Cách nhanh — PWABuilder (không cần cài gì)
1. Deploy/expose app ở một URL https (vd Vercel, hoặc `ngrok http 3000`).
2. Vào **https://www.pwabuilder.com** → dán URL → **Start**.
3. Tab **Android** → **Generate Package** → tải về gói (`.apk` để cài thử + `.aab` để lên Play Store).
4. Copy `.apk` sang điện thoại → mở file → cài (bật "Cài từ nguồn không xác định" nếu máy hỏi).

### B2. Cách chủ động — Bubblewrap CLI (local)
```bash
# 1. Cài (một lần) — cần Node + JDK 17
npm i -g @bubblewrap/cli

# 2. Khởi tạo từ manifest đang host
bubblewrap init --manifest https://<your-host>/manifest.webmanifest
#   - trả lời: package id (vd com.interiorflow.app), tên app, màu...
#   - Bubblewrap tự đọc theme_color/background_color (#0c0c0e) + icons

# 3. Build APK/AAB (Bubblewrap tự tải Android SDK + JDK nếu thiếu)
bubblewrap build
#   → sinh app-release-signed.apk  (cài thử)
#   → sinh app-release-bundle.aab  (upload Play Store)

# 4. Cài thẳng qua USB (bật USB debugging trên Find N6)
adb install app-release-signed.apk
```

### B3. Digital Asset Links (bỏ thanh URL trong TWA)
Để TWA chạy **không viền trình duyệt**, host file này ở
`https://<your-host>/.well-known/assetlinks.json` với SHA-256 của keystore ký APK
(Bubblewrap in ra fingerprint sau khi build). Thiếu bước này TWA vẫn chạy nhưng
hiện một thanh URL mỏng ở trên.

---

## Tóm tắt nên dùng cách nào
- **Thử nhanh / demo tại chỗ** → Cách A (Add to Home Screen qua LAN). 30 giây xong.
- **Cài thật, gửi cho người khác, hoặc lên Play Store** → Cách B (Bubblewrap/PWABuilder) trỏ về URL host.

Cả hai đều cần server Next.js sống — app này có DB + API AI nên **không** chạy offline hoàn toàn.
