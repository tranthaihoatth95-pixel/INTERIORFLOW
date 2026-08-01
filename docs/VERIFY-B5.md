# VERIFY-B5 — Nghiệm thu ĐỢT B (Hoà tự làm, ~15 phút)

> 31/07. Phép thử CHỐT của cả đợt hạ tầng lưu trữ. Một câu duy nhất đã ghi ở
> `docs/QUYET-DINH-HA-TANG-2026-07-31.md` ②:
>
> **Copy nguyên thư mục dự án sang máy khác, mở lên — mọi thứ chạy, không thiếu gì.**
>
> Không đạt câu này thì ĐỢT B chưa xong, dù B1–B4 đều ✅.

---

## ⛔ BƯỚC 0 — BẮT BUỘC làm trước, nếu không phép thử sai ngay từ đầu

**Vấn đề đang có.** Thư mục gốc InteriorFlow đang trỏ vào **chính thư mục repo**
(`~/Downloads/interiorflow`). Bằng chứng: `cms915kza0001w9a613z8tp65 — Untitled flow/` nằm ngay
gốc repo, và `git check-ignore` cho thấy nó **KHÔNG được gitignore**.

Hai hệ quả, cả hai đều thật:

| Hệ quả | Mức |
|---|---|
| Một lệnh `git add -A`/`git add .` sẽ **quét dữ liệu dự án thật vào repo** — bản vẽ, brand kit, ảnh | 🔴 |
| B5 mất ý nghĩa: "copy thư mục dự án sang máy khác" mà thư mục đó nằm trong repo thì không phân biệt được **dữ liệu đi theo thư mục** hay **đi theo repo** | 🔴 |

**Cách sửa (1 phút, làm bằng tay, không cần code):**

1. Finder → tạo thư mục mới `~/InteriorFlow` (đúng tên đã chốt ở tờ quyết định ②).
2. Kéo `cms915kza0001w9a613z8tp65 — Untitled flow/` từ trong repo ra `~/InteriorFlow/`.
3. Mở IF → `Cài đặt` → `Lưu trữ` → chọn lại thư mục gốc = `~/InteriorFlow`.
4. Bấm **"Kiểm tra kết nối thư mục"** → phải báo ✓ trước khi đi tiếp.

> Đừng xoá gì. Chỉ **di chuyển** rồi **trỏ lại**.

---

## Chuẩn bị

- Chrome/Edge, đã đăng nhập.
- Đã xong BƯỚC 0.
- Không cần máy thứ hai. **Cửa sổ ẩn danh (Incognito) hoặc profile trình duyệt mới = "máy khác"**
  về mặt logic: IndexedDB rỗng hoàn toàn, đúng điều kiện cần chứng minh. Nếu có máy thứ hai thật
  thì càng tốt, nhưng không bắt buộc.

---

## Phần 1 — Tạo dữ liệu đủ dày để phép thử có nghĩa

Trên profile **thường** (profile đang dùng):

1. Mở 1 dự án. Đặt tên rõ ràng, ví dụ `NGHIEM-THU-B5`.
2. Chặng **CAD**: vẽ ít nhất **2 tab (sheet)**, mỗi tab vài nét nhận diện được bằng mắt
   (một hình vuông, một chữ, một đường xiên — cốt để lát nữa nhìn là biết ngay đủ hay thiếu).
3. Chặng **Present**: tạo ít nhất **2 trang**, mỗi trang một chữ tiêu đề khác nhau.
4. Mở **Brand Kit**, đổi ít nhất 1 màu và 1 cặp font — để `brand-kit.json` có nội dung riêng.
5. Bấm **⌘S** (ép ghi ngay, không đợi nhịp 10 giây).
6. StatusBar phải hiện **"Đĩa đồng bộ"**. Nếu hiện đỏ "⚠ Chưa ghi ra đĩa" → **DỪNG**, đó là lỗi,
   báo ngay, đừng làm tiếp.

**Xác nhận trên Finder** — mở `~/InteriorFlow/<mã> — NGHIEM-THU-B5/`, phải thấy đủ:

| Tệp | Có? |
|---|---|
| `ban-ve.idf` | |
| `trinh-bay.idfp` | |
| `brand-kit.json` | |
| `.sao-luu/` (thang lưu giữ B3) | |

Thiếu bất kỳ dòng nào ⇒ chưa đạt, dừng và báo.

---

## Phần 2 — "Sang máy khác"

7. Copy **nguyên thư mục** `<mã> — NGHIEM-THU-B5/` sang một vị trí khác, ví dụ
   `~/MayKhac/<mã> — NGHIEM-THU-B5/`. Copy, **không phải move** — giữ bản gốc để đối chiếu.
8. Mở **cửa sổ ẩn danh** (⇧⌘N) → vào IF → đăng nhập.
9. `Cài đặt` → `Lưu trữ` → chọn thư mục gốc = **`~/MayKhac`** → "Kiểm tra kết nối thư mục" → ✓.
10. Mở dự án `NGHIEM-THU-B5`.

---

## Phần 3 — Nghiệm thu

| # | Phải thấy | Đạt/Không | Ghi chú |
|---|---|---|---|
| a | CAD: **đủ 2 tab**, đúng tên, đúng nét đã vẽ | | |
| b | Present: **đủ 2 trang**, đúng chữ tiêu đề | | |
| c | Brand Kit: đúng màu + đúng cặp font đã đổi | | |
| d | StatusBar hiện **"Đĩa đồng bộ"** (không đỏ) | | |
| e | Sửa thêm 1 nét → ⌘S → mở `ban-ve.idf` bên `~/MayKhac/` thấy nội dung MỚI | | |
| f | Tải lại trang (F5) → vẫn đúng, không rơi về bản cũ, không kẹt loading | | |
| g | Quay lại profile thường mở bản GỐC → **vẫn nguyên vẹn**, không bị bản copy ảnh hưởng | | |

**Chuẩn đạt: cả 7 dòng đều đạt.** Thiếu một dòng = ĐỢT B chưa xong — báo rõ dòng nào, đừng tự cho qua.

---

## Ba lỗi dễ nhầm là "đạt" nhưng KHÔNG phải

| Hiện tượng | Vì sao KHÔNG tính là đạt |
|---|---|
| Mở lên thấy đúng, nhưng StatusBar đỏ | Đang đọc được **cache** chứ chưa chắc đọc từ đĩa. Đỏ = đường ghi hỏng ⇒ trượt |
| CAD đủ nhưng Present **trống** (hoặc ngược lại) | Đúng lớp lỗi B2 remount. Trượt, không phải "chấp nhận được" |
| Thư mục copy chạy đúng nhưng bản gốc **hỏng/mất tab** | Hai thư mục đang tranh nhau ⇒ có đường ghi chéo. Trượt |

---

## Sau khi xong

- Đủ 7/7 ⇒ báo `B5 ✅` để Claude Code đóng `4.1.e` trong `docs/IF-FEATURE-TREE.md`, **ĐỢT B khép lại**.
- Trượt bất kỳ dòng nào ⇒ dán đúng dòng đó + ảnh chụp StatusBar. Không cần đoán nguyên nhân.

---

*Cowork soạn 31/07/2026. Khuôn theo `docs/VERIFY-B3.md` / `docs/VERIFY-B4.md`.*
