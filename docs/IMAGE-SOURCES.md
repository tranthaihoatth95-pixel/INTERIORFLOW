# NGUỒN ẢNH của InteriorFlow — cái gì dùng được, cái gì KHÔNG

> Chốt 25/07 (task #27, user duyệt): **giữ nguyên** bộ ảnh sẵn có trong repo (dùng tạm),
> **bổ sung** nguồn ảnh trên mạng cho user chọn. Không xoá/di chuyển ảnh cũ.

## 1. Bốn nguồn ảnh trong app

| Nguồn | Cần key? | Tìm bằng từ khoá? | Dùng thương mại | Ghi công |
|---|---|---|---|---|
| **Ảnh sẵn trong repo** (`public/wallpapers`, `public/covers`, `public/detech`, `public/demo`) | – | – | ⚠️ chỉ nội bộ/demo | – |
| **Upload từ máy** | – | – | tuỳ ảnh | user tự chịu |
| **Openverse** (CC) | ❌ không | ✅ | ✅ (lọc `commercial,modification`) | ✅ bắt buộc |
| **Unsplash** | ✅ `UNSPLASH_ACCESS_KEY` | ✅ | ✅ | ✅ bắt buộc |
| **Dán URL ảnh** (đường cho Pinterest) | ❌ | ❌ | tuỳ ảnh | user tự chịu |

Thiếu `UNSPLASH_ACCESS_KEY` → nguồn Unsplash **tự ẩn** khỏi UI, không báo lỗi
(`GET /api/stock-photos` lọc danh sách nguồn ở server).

## 2. 🚫 PINTEREST — vì sao KHÔNG có "nguồn Pinterest" thật

Đã tra và kết luận: **không có cách hợp lệ nào để IF tự tìm/tải ảnh từ Pinterest.**

1. **Không có API tìm ảnh công khai.** Pinterest API v5 phải đăng ký app + qua *app review*,
   và sau khi được duyệt thì chỉ đọc được **pin/board của chính user đã OAuth** — không có
   endpoint search ảnh cho bên thứ ba như Unsplash/Openverse.
2. **Scrape là vi phạm ToS.** Điều khoản Pinterest cấm truy cập bằng phương tiện tự động
   (crawl/scrape). Tải HTML trang pin/board để bóc `og:image` cũng thuộc diện này → **KHÔNG LÀM**.
3. **Cách hỗ trợ hợp lệ (đã implement)** — user tự lấy ảnh ra khỏi Pinterest:
   - Mở pin → chuột phải vào ảnh → **"Copy image address"** → dán vào tab **"Dán URL / Pinterest"**.
   - Hoặc tải ảnh về máy → dùng nút **upload**.
   Dán link **trang** Pinterest (`pinterest.com/pin/...`, `pin.it/...`) sẽ bị từ chối kèm hướng
   dẫn đúng cách, cố tình **không** tự đi lấy ảnh từ trang đó.
4. **Bản quyền:** ảnh trên Pinterest phần lớn KHÔNG có giấy phép rõ ràng. Ảnh dán vào IF theo
   đường này ghi giấy phép là *"Người dùng tự chịu trách nhiệm bản quyền"* — dùng để tham
   khảo/moodboard nội bộ, **không** đưa vào sản phẩm giao khách mà chưa xin phép.

→ Nếu sau này thật sự cần Pinterest sâu hơn: chỉ có đường **OAuth Pinterest + app review**,
để user kết nối tài khoản và đọc board CỦA HỌ. Đó là một task riêng, có cổng phụ thuộc bên ngoài.

## 3. ⚖️ Điều khoản Unsplash — 3 việc BẮT BUỘC (bỏ là bị rút key)

1. **Ghi công tác giả + link**, có UTM `?utm_source=InteriorFlow&utm_medium=referral`
   → `normalizeUnsplash()` gắn sẵn vào `creditUrl` / `landing`.
2. **Ping endpoint đếm tải** `links.download_location` khi ảnh được **dùng thật** (không phải
   khi hiện thumbnail) → `POST /api/stock-photos { action:'use', downloadLocation }`.
   `StockPhotoPicker` tự gọi lúc user bấm chọn ảnh.
3. **Không dựng lại dịch vụ giống Unsplash**, không cache ảnh thành thư viện riêng.
   `/api/stock-photos/proxy` chỉ pass-through 1 lần (`Cache-Control: private, max-age=300`).

Openverse (CC): ghi công theo giấy phép của từng ảnh — `creditLine()` in `tác giả · giấy phép · nguồn`.

## 4. Kiến trúc — file nào làm gì

| File | Vai |
|---|---|
| `lib/stock-photos.ts` | **THUẦN**: danh sách nguồn, chuẩn hoá kết quả, chặn SSRF, ghi công. Test: `lib/stock-photos.test.ts` (13 test). |
| `app/api/stock-photos/route.ts` | `GET` nguồn khả dụng · `POST search` · `POST link` · `POST use`. Key chỉ ở server. |
| `app/api/stock-photos/proxy/route.ts` | Lấy byte ảnh về **cùng origin** (để `canvas.toDataURL()` không bị taint). Yêu cầu đăng nhập, ≤12MB, chỉ `image/*`. |
| `components/common/StockPhotoPicker.tsx` | UI dùng lại: chọn nguồn → tìm/dán → lưới ảnh + dòng ghi công. |
| `components/entry/LoginBackdrop.tsx` | Nút **Đổi nền** → "Ảnh trên mạng" → ảnh về dataURL, lưu localStorage như ảnh upload. |
| `components/present-editor/LibraryBrowser.tsx` | Nút 🌐 cạnh "Tải ảnh tham khảo" → ảnh vào rổ Reference LOCAL, **ghi công lưu trong tag**. |
| `app/api/illustration/route.ts` | Thác moodboard: Reference → Openverse → **Unsplash** → cờ generate. |

## 5. Bảo mật đã tính

- **SSRF**: `isFetchableImageUrl()` chặn loopback/`169.254.169.254`(metadata cloud)/RFC1918/IPv6
  ULA/`*.local`/tên máy trần; chỉ `http`/`https`.
- **Không thành open proxy**: cả 2 route đều `getSessionUser()`, 401 nếu chưa đăng nhập.
- **Chỉ nhận ảnh**: kiểm `content-type: image/*` (HEAD trước, fallback GET `Range: bytes=0-0`).
- **Giới hạn**: timeout 9–15s, ảnh ≤12MB.

## 6. Bật Unsplash

```bash
# 1. https://unsplash.com/oauth/applications → "New application" (miễn phí, demo 50 req/giờ)
# 2. copy "Access Key" (KHÔNG phải Secret key) vào .env.local:
UNSPLASH_ACCESS_KEY=<access-key-của-bạn>
# 3. restart dev server → tab "Unsplash" xuất hiện trong mọi bộ chọn ảnh
```

Lên production cần xin **Production** approval của Unsplash (5000 req/giờ) — họ soát việc
ghi công + ping download. Ba việc ở §3 đã làm sẵn nên soát sẽ qua.
