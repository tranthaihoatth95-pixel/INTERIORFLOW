# TỜ QUYẾT ĐỊNH — hạ tầng dữ liệu IF

> Dựa trên `docs/BAN-DO-DU-LIEU-IF-2026-07-31.md` (phiên code phụ, khám thật, có bằng chứng dòng code).
> Mỗi mục: **bằng chứng → lựa chọn → đề xuất → hệ quả**. Hoà gật từng mục.
>
> ⛔ **Ba mục 0 dưới đây KHÔNG cần quyết định** — làm được ngay, nên làm trước.

---

## 0 · LÀM ĐƯỢC NGAY — không chờ quyết định nào

| # | Việc | Vì sao không phải chờ |
|---|---|---|
| **0a** | **Thêm `userId` vào khoá bộ học "Gu"** — `interiorflow.gu.perceptron.*.v1` → `...v1.<userId>` | Hiện khoá là chuỗi **cố định**, không có `userId` (khác mọi khoá khác vốn có). Máy chung ở studio ⇒ trọng số nhiều người **trộn lẫn**. Đây là lỗi, không phải lựa chọn kiến trúc. Sửa ở đâu cũng đúng |
| **0b** | **Brand Kit: thêm nút xuất / nhập `.json`** | Brand Kit hiện là **điểm chết đơn lẻ** — chỉ ở localStorage, không bản sao nào. Nút xuất là phao cứu sinh tạm cho tới khi có ②, và **không mâu thuẫn** với bất kỳ phương án nào |
| **0c** | **Đo `FlowVersion` chiếm bao nhiêu trong 143 MB `dev.db`** | Không có số thì quyết ④ là quyết mù |

---

## ① Nguồn sự thật của BẢN VẼ

**Bằng chứng.** Editor mở lên **chỉ đọc IndexedDB** (`sheets-persist.ts:130`). `.idf` xuất tay và
bản sao lưu trên đĩa đều là **snapshot một chiều** — app **không bao giờ tự đọc lại**. Không có cơ
chế nào so sánh "bản nào mới hơn" để cảnh báo.
⇒ Ổ hỏng, đổi máy, hoặc lỡ xoá dữ liệu duyệt web = mất việc, **im lặng**.

| | Phương án | Đánh đổi |
|---|---|---|
| **A** | Giữ nguyên — IndexedDB là nguồn | Không tốn gì. Giữ nguyên rủi ro mất im lặng |
| **B** | **Tệp thật trên đĩa là nguồn; IndexedDB tụt xuống làm cache phiên làm việc** | Phải làm định dạng cho chặng 3 (chưa có) + chuyển dữ liệu đang nằm IndexedDB sang |

**Đề xuất: B.** Không phải vì lý thuyết — vì **khuôn này đã được chứng minh trong chính repo này**:
Electron dời `dev.db` + `uploads/` sang `userData` và làm được **mà KHÔNG phải sửa route nào**
(`electron/main.js:115-129`). Cùng một cách nghĩ, áp cho bản vẽ.

**Hệ quả B:** mất ổ / đổi máy không còn mất việc · sao lưu là copy thư mục · và mở đường cho ②.

---

## ② Cây thư mục (NT5)

**Bằng chứng.** Chặng 3 (Present) **không có đường xuất file rời nào cả** — deck slide chỉ sống
trong IndexedDB. Không xuất được, không sao lưu được, không mang đi được.

**Đề xuất:**

```
~/InteriorFlow/
  ├── <mã dự án> — <tên dự án>/
  │     ├── ban-ve.idf            ← đã có định dạng
  │     ├── trinh-bay.idfp        ← MỚI, chặng 3 hiện chưa có gì
  │     ├── brand-kit.json        ← đang chỉ nằm ở localStorage
  │     ├── thu-vien/             ← ảnh, block của riêng dự án
  │     └── .sao-luu/             ← thang lưu giữ B3 đã làm
  └── _studio/
        ├── brand-kit-mac-dinh.json
        └── bo-hoc-gu.json        ← nếu chọn ③C
```

**Phép thử nghiệm thu, một câu:**
> Copy nguyên thư mục dự án sang máy khác, mở lên — **mọi thứ chạy, không thiếu gì.**

Không đạt phép thử này thì cây thư mục chưa xong.

---

## ③ Bộ học "Gu" đi đâu

**Bằng chứng.** Hai model perceptron, **cả hai đã cắm UI thật** (xác minh bằng `grep ".update("`,
không phải đọc comment — comment trong `pairwise-perceptron.ts` nói "chưa cắm UI" đã **lỗi thời**).
Cả hai ở `localStorage`, khoá cố định, `minPairs = 10`. Đổi máy ⇒ mất, học lại từ 0.

| | Phương án | Đánh đổi |
|---|---|---|
| **A** | Prisma, theo `userId` | Đi theo tài khoản, đồng bộ được. Nhưng gắn vào server |
| **B** | Tệp trong `_studio/` | Đi theo máy studio, gộp bằng cách copy. Nhưng không theo người |
| **C** | **Prisma là nguồn + có đường xuất/nhập tệp** | Tốn hơn một chút, được cả hai |

**Đề xuất: C.** Lý do đến từ chính tuyên bố IDF của Hoà:
> *"Đối thủ bán công cụ; IDF tích luỹ **tài sản**. Tài sản thì càng dùng càng dày — và nó thuộc về TTT."*

Tri thức nghề **không được phép** nằm trong `localStorage` của một trình duyệt. Có đường xuất thì
mới **gộp được** cái nhiều người học và trở thành tài sản chung.

⚠️ Dù chọn gì, **0a vẫn phải làm ngay** — trộn lẫn giữa người dùng là lỗi, không phải lựa chọn.

---

## ④ `FlowVersion` — giữ hay bỏ

**Bằng chứng.** `grep "prisma.flowVersion."` toàn repo ⇒ **đúng 1 điểm dùng**:
`app/api/flows/[id]/route.ts:37` — `create`. **Không một `find*` nào.** Ghi mỗi lần bấm "Chạy flow",
`graphJson` có thể vài trăm KB. `dev.db` hiện **143 MB**.

| | Phương án | Đánh đổi |
|---|---|---|
| **A** | Xây UI lịch sử phiên bản → biến nó thành tính năng thật | Có giá trị thật cho công cụ thiết kế, nhưng tốn |
| **B** | Ngừng ghi, xoá bảng | Rẻ nhất. Mất luôn khả năng làm lịch sử sau này |
| **C** | **Giữ bảng, đổi cò: ngừng chụp tự động mỗi lượt chạy — chỉ ghi khi người dùng bấm "đánh dấu bản này" + thang lưu giữ** | Giữ giá trị, bỏ phần phình |

**Đề xuất: C** — và đây **đúng bài học đã học rồi**: B3 ban đầu là *"giữ 5 bản"*, sửa thành
**thang lưu giữ**. `FlowVersion` đang mắc đúng lỗi cũ ở dạng nặng hơn: **chụp mọi lượt, không tỉa
bao giờ, không ai đọc.**

⚠️ Chốt ④ **sau khi có số ở 0c**. Nếu `FlowVersion` chỉ chiếm 3 MB thì đây không gấp.

---

## ⑤ Hai luật nhỏ, chốt luôn cho khỏi quay lại

**⑤a — Đích màn hình (ảnh hưởng mọi brief sau):**
> IF1 = **desktop-first**. Tối ưu **1440**, mốc thấp nhất **1024**.
> Dưới 1024 chỉ đảm bảo **xem được**, không đảm bảo **vẽ được**.
> Tablet chạm là bài toán của **IF2**, không nhét vào IF1.

**⑤b — Chia cột bảng tra:** dùng CSS `columns` để trình duyệt **tự cân**, thay vì chia tay.
Thêm lệnh mới không bao giờ làm lệch lại. Đổi lại: thứ tự đọc thành **xuống hết cột trái rồi sang phải**.

---

## Tóm tắt để gật

| Mục | Đề xuất |
|---|---|
| 0a · `userId` vào khoá bộ học | **làm ngay** |
| 0b · Brand Kit xuất/nhập `.json` | **làm ngay** |
| 0c · Đo `FlowVersion` | **làm ngay** |
| ① Nguồn sự thật bản vẽ | **B** — tệp thật là nguồn |
| ② Cây thư mục | theo sơ đồ trên, có `trinh-bay.idfp` |
| ③ Bộ học "Gu" | **C** — Prisma + xuất/nhập |
| ④ `FlowVersion` | **C** — đổi cò + thang lưu giữ *(chốt sau 0c)* |
| ⑤a Đích màn hình | desktop-first 1024/1440 |
| ⑤b Chia cột | CSS `columns` tự cân |

---

*Cowork, 31/07/2026. Nguồn: `BAN-DO-DU-LIEU-IF-2026-07-31.md`.*

---

# ⑥ · SPRINT — Hoà gật toàn bộ 31/07

## Chia việc

| Đợt | Ai | Việc | Phụ thuộc |
|---|---|---|---|
| **A** | **code phụ** | 0a `userId` vào khoá Gu · 0b Brand Kit xuất/nhập · 0c đo `FlowVersion` | không |
| **B** | **code chính** | ① + ② lớp lưu trữ — **một đợt duy nhất**, chia 5 pha | không |
| **C** | code phụ | ③ bộ học Gu → Prisma + xuất/nhập | sau A |
| **D** | ai rảnh | ④ `FlowVersion` đổi cò | **sau 0c** |

## ⭐ Khuôn đã có sẵn — ĐỪNG nghĩ khuôn mới cho đợt B

`lib/cad/auto-backup.ts` **đã làm đúng việc này rồi**:
- `showDirectoryPicker()` cho user chọn thư mục thật (File System Access API)
- `storeHandle()` `:70` / `loadHandle()` `:78` — cất handle vào IndexedDB `interiorflow-backup`
- `writeAndPrune()` `:246` — ghi tệp thật + tỉa theo thang lưu giữ

Và comment trong chính file đó xác nhận: *"chạy được cả trong Electron… KHÔNG cần thêm cầu IPC nào"*.
⇒ Đợt B **tái dùng nguyên khuôn này** cho thư mục gốc `~/InteriorFlow`. Không viết cơ chế mới.

## Đợt B — 5 pha, làm đúng thứ tự

| Pha | Việc | Ghi chú |
|---|---|---|
| **B1** | Chọn thư mục gốc `~/InteriorFlow` một lần, cất handle | Sao chép khuôn `auto-backup.ts:70,78` |
| **B2** | Định dạng **`.idfp`** cho chặng 3 + xuất + nhập | Chặng 3 hiện **không có đường xuất nào**. Khuôn: `lib/cad/idf.ts` |
| **B3** | `brand-kit.json` ra tệp trong thư mục dự án | Sau B3, 0b thành đường nhập dữ liệu cũ |
| **B4** | ⚠️ **Đảo nguồn**: tệp thật là nguồn, IndexedDB thành cache + di trú dữ liệu đang nằm IndexedDB | Pha rủi ro nhất. Làm **cuối**. Phải có đường di trú, không được bỏ dữ liệu cũ |
| **B5** | Phép thử nghiệm thu | Copy thư mục dự án sang máy khác → mở → **chạy đủ, không thiếu gì** |

## ⚠️ Cảnh báo chung cho mọi đợt đụng Prisma (A-0c, C, D)

Lần trước `prisma migrate dev` đòi **RESET `dev.db`** — đã phải dừng và dùng `db push`, ghi vào
`docs/TECH-DEBT.md`. Dữ liệu thật đang có trong DB. **Không chạy `migrate dev`/`migrate reset`.**
Gặp drift ⇒ dừng, báo, không tự quyết.

## Quyết định phụ trong 0a — không di trú trọng số cũ

Khoá cũ là chuỗi cố định, **có thể đã trộn lẫn nhiều người**. Chép sang khoá mới = mang theo dữ
liệu bẩn. `minPairs = 10` nên mất mát chỉ bằng **10 lượt tương tác**.
⇒ **Bắt đầu lại từ 0, có thông báo cho người dùng.** Không chép, không xoá khoá cũ (để yên).
