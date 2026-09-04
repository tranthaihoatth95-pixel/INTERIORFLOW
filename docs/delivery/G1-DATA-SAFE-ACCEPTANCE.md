# G1 · DATA SAFE — BIÊN BẢN NGHIỆM THU TRÊN APP THẬT

> **Ngày:** 04/09/2026 · **Làn:** 01 CORE — DATA & PROJECT TRUTH
> **Mốc mã:** cắt từ `a64c0248` (`integration/2026-09-04`)
> **Bộ chạy:** `scripts/nghiem-thu-g1.mjs` · **Ảnh:** `docs/delivery/anh-duyet-mat/g1-data-safe/`

## KẾT LUẬN

**CỔNG G1 CHƯA ĐÓNG ĐƯỢC.** 7/8 ca PASS · 1 ca FAIL · 0 UNVERIFIED.

Ca đỏ còn lại (**CA3**) **KHÔNG vi phạm an toàn dữ liệu** — nó là một lỗi sập app nằm
**ngoài** bản vá P0, ở hai tệp không thuộc phạm vi ghi của làn này. Xem §4.

Trong lượt nghiệm thu, **hai lỗi rò dữ liệu chéo người dùng đã bị bắt và đã sửa** (§3) —
đó là kết quả đáng giá nhất của cổng này.

---

## 1 · VÌ SAO PHẢI CHẠY TRÊN APP THẬT

Bản vá P0 (định danh phiên ↔ lưu dữ liệu) trước lượt này **chưa từng mở app Next lần nào**.
Mọi khẳng định đều là đọc mã + test đơn vị. Luật của chủ dự án: `UNVERIFIED ≠ PASS`.

Hai lỗi ở §3 **không một test đơn vị nào bắt được** — ngược lại, **chính hai test đơn vị đang
khoá cứng lỗi làm hành vi đúng**. Chúng chỉ lộ ra khi có trình duyệt thật, hai tài khoản thật,
và một lượt đăng xuất/đăng nhập thật.

### Bằng chứng đọc từ NƠI LƯU THẬT

Mọi phán quyết dưới đây đọc trực tiếp từ **IndexedDB** (`interiorflow-sheets` / store `sheets`),
**không** đọc chữ hiện trên màn. Lý do: màn hình nói "còn bản vẽ" không chứng minh được gì — bản
vẽ có thể đang nằm thuần trong bộ nhớ và bay mất khi đóng tab. Khoá bản ghi có dạng
`userId::route::projectId` (`lib/sheets-persist.ts:52`), nên **chính cái khoá đã trả lời câu
"việc này vào kho của ai"**.

Thao tác "việc thiết kế" là **vẽ thật bằng chuột**: chọn công cụ Đường → 2 điểm trên canvas →
`Esc` → chờ autosave. Phép đo là **số thực thể trong `sheets[0].doc.entities`**.

---

## 2 · BỘ CHẠY TỰ HIỆU CHUẨN

> Bộ nghiệm thu không đỏ nổi ở ca hỏng là bộ vô giá trị — nó chỉ đang in chữ PASS.

`node scripts/nghiem-thu-g1.mjs --hieu-chuan` dựng một thế giới **biết chắc hỏng** (chặn
`/api/auth/me` ⇒ không thể có định danh ⇒ không thể ghi) rồi chạy **đúng bộ khẳng định của CA1**
lên đó và đòi nó phải **ĐỎ**.

```
✅ HIỆU CHUẨN · thế giới biết-chắc-hỏng
   kho "<idA>::/cad-editor::g1projA1": 0 → 0 (sau khi vẽ) → 0 (sau khi tải lại)
   ↳ bộ khẳng định của CA1 trên thế giới hỏng: ĐỎ (bộ này có hiệu lực)
```

Phép hiệu chuẩn chạy **mở đầu mỗi lượt**, kể cả lượt cuối cùng — nên không có chuyện "hiệu chuẩn
hôm qua, kết quả hôm nay".

---

## 3 · 🔴 HAI LỖI THẬT ĐÃ BẮT ĐƯỢC VÀ ĐÃ SỬA

### 3.1 · Rò dữ liệu chéo người dùng (bất biến #2)

**Hiện tượng, tái hiện được, không cần bơm lỗi gì:**

> A đăng xuất → B đăng nhập trên **cùng trình duyệt** → B vẽ trong **dự án của chính B**
> ⇒ nét vẽ ghi vào `<idA>::/cad-editor::g1projB1`.

Đây là đường đăng xuất/đăng nhập **bình thường** của một máy dùng chung — đúng ca đời thật nhất
của một studio.

**Gốc bệnh — hai chỗ cộng lại:**

| # | Chỗ | Vấn đề |
|---|---|---|
| 1 | `lib/danh-tinh-phien.ts` `giaiDanhTinh()` | Đọc bộ đệm rồi **trả về NGAY**, không bao giờ đối chiếu máy chủ. Bộ đệm mang id người TRƯỚC thì nó thắng phiên máy chủ của người ĐANG đăng nhập. |
| 2 | toàn repo | **Không nơi nào xoá** `interiorflow.lastUserId` lúc đăng xuất — `clearLastUserId` trước lượt này **không tồn tại** (`grep` = 0 kết quả). |

**Hai ca độc lập cùng chứng minh:** CA4 (bơm định danh cũ) và CA8 (đường tự nhiên). Trước sửa:

```
CA4  kho B "<idB>::/cad-editor::g1projA1": 0 → 1   ·  kho A: 0
CA8  B vẽ vào đúng kho B: KHÔNG  ·  B ghi nhầm vào kho mang id A: CÓ
```

**Đã sửa** (`lib/danh-tinh-phien.ts`): máy chủ **luôn** được hỏi để xác nhận và **tiếng nói của
máy chủ thắng bộ đệm** — đúng như docstring đầu tệp vẫn tuyên bố từ đầu (*"phiên máy chủ = NGUỒN
SỰ THẬT của định danh; `lastUserId` = BỘ ĐỆM của nguồn đó"*). Đệm lệch bị ghi đè, **tự chữa ngay
trong lượt**.

Ranh giới cố ý, không nới:

| Máy chủ nói gì | Xử lý | Vì sao |
|---|---|---|
| 200 + có id | **id máy chủ thắng**, ghi đè đệm nếu lệch | nguồn sự thật |
| mạng đứt · hết giờ · 503 | **lui về đệm** | giữ local-first — chặn ghi khi mất mạng là biến app local-first thành app không dùng được offline |
| 401 | **KHÔNG lui về đệm** | máy chủ nói rõ không có ai đăng nhập ⇒ đệm chắc chắn là rác phiên trước |
| thân hỏng · thiếu id | **KHÔNG lui về đệm** | máy chủ trả lời được mà không mạch lạc — không phải ca offline |

**Giá phải trả, nói thẳng:** thêm **một** request `/api/auth/me` mỗi tab (đã single-flight, không
nhân theo số nơi gọi). App **vốn đã gọi đúng endpoint đó** lúc nạp trang, nên gần như không phải
chi phí mới. Đổi ~40ms lấy việc không bao giờ ghi việc người này vào kho người kia.

**Lớp thứ hai:** thêm `clearLastUserId()` vào `lib/resume.ts` để đóng nốt khe hẹp *"đăng xuất rồi
mất mạng"*. ⚠️ **CHƯA nối vào đường đăng xuất** — chỗ gọi nằm ngoài phạm vi ghi của làn này. Việc
còn lại đúng **một dòng**: gọi nó ở nơi client bấm Đăng xuất (cùng chỗ gọi `DELETE /api/auth/me`).

### 3.2 · 🔴 Hai test đơn vị đang khoá cứng chính lỗi trên

Đây là phần đáng ghi nhớ hơn cả bản vá.

| Tệp | Ca | Nó đòi gì |
|---|---|---|
| `lib/danh-tinh-phien.test.ts` | ③ | Dựng **đúng** bàn thử rò dữ liệu (đệm `usr_cu`, máy chủ `usr_moi`) rồi **đòi hàm trả về `usr_cu`** và **không hỏi máy chủ lần nào**. |
| `lib/danh-tinh-phien-nghiem-thu.test.ts` | ⑤ | *"đệm đã có ⇒ 0 request tới máy chủ"*. |

Nghe như ràng buộc hiệu năng. Thật ra chúng **lấy chính kịch bản rò dữ liệu làm tiêu chuẩn đúng**.
Không hỏi máy chủ thì không đời nào phát hiện được bộ đệm đang mang id người khác.

Cùng họ bài học **15/08** (`calibrateFromImage`): *test khẳng định đúng-hành-vi-hỏng làm kỳ vọng
thì nó không bảo vệ gì — nó che lỗi và giữ cho lỗi sống.* Cả hai ca nay canh **điều ngược lại**,
kèm ca hồi quy cho đệm-mang-id-người-khác và ca `clearLastUserId`.

---

## 4 · BẢNG TÁM CA

Lượt cuối, chạy trên mã đã commit:

| CA | Tình huống | KQ | Bằng chứng đọc từ IndexedDB |
|---|---|---|---|
| 1 | Deep-link · localStorage **rỗng** · phiên máy chủ hợp lệ | ✅ PASS | `<idA>::/cad-editor::g1projA1`: **0 → 1 → 1** (vẽ → tải lại). 0 khoá mơ hồ. |
| 2 | localStorage **ghi hỏng** (`setItem` ném) | ✅ PASS | **0 → 1 → 1**. Đường lùi bộ nhớ `demTrongBoNho` giữ được định danh. |
| 3 | localStorage **chặn hẳn** (đọc cũng ném) | ❌ **FAIL** | An toàn dữ liệu **không** vi phạm (0 khoá mơ hồ, 0 ghi nhờ kho người khác) **nhưng app chết hẳn** — 0 canvas, 0 nút, 0 ký tự, **1081** lỗi chưa bắt. Xem §4.1. |
| 4 | Định danh **người TRƯỚC còn sót** trong localStorage | ✅ PASS | Kho B: **0 → 0** (trước sửa: 0 → 1). Kho A: 1. `lastUserId` tự chữa về id A. |
| 5 | **Lỗi mạng** khi gọi `/api/auth/me` | ✅ PASS | Không ghi gì · 0 khoá mơ hồ · 0 ghi sai kho. |
| 6 | `/api/auth/me` trả **401** | ✅ PASS | Không ghi gì. Thuần bộ nhớ, đúng thiết kế. |
| 7 | `/api/auth/me` trả **JSON méo** | ✅ PASS | Không ghi gì (nhánh `than-hong`). |
| 8 | **Đổi dự án** + **đổi người dùng** + tải lại | ✅ PASS | A ghi được ở DA1 và DA2 · DA1 còn nguyên sau khi đổi dự án · B vẽ vào **đúng** kho B · **0** byte rơi vào kho mang id A. |

### 4.1 · CA3 — vì sao đỏ, và vì sao KHÔNG phải lỗi an toàn dữ liệu

Khi `localStorage.getItem` ném (Safari *Block All Cookies*, Chrome chặn dữ liệu trang), **cả app
trắng bóc**. Không phải chuyện thẩm mỹ — không ai làm việc được.

Gốc, đo bằng stack thật, **nằm NGOÀI bản vá P0**:

| Tệp:dòng | Hàm |
|---|---|
| `components/studio/Navigator.tsx:60` | đọc `localStorage` trong effect, **không** `try/catch` |
| `lib/cad/touch-input.ts:38` | `readFingerDrawPreference`, **không** `try/catch` |

Ném trong effect ⇒ React gỡ cả cây ⇒ trang trắng.
`lib/danh-tinh-phien.ts` và `lib/resume.ts` **đều đã bọc đúng** — bản vá P0 không liên quan.

**Ba bất biến đối chiếu:** #1 không mất việc (không có việc nào tạo được để mà mất) · #2 không rò
chéo (không ghi được byte nào ra đâu) · #3 hỏng **nhìn thấy được** — trang trắng thì rất thấy.
Nên đây là **lỗi bền bỉ (robustness)**, không phải lỗ an toàn dữ liệu. Ghi FAIL vì ca này không
đạt được điều nó phải chứng minh ("việc còn nguyên"), **không** vì P0 sai.

Hai tệp trên **ngoài phạm vi ghi** của làn G1 ⇒ **bàn giao**, không tự sửa. Sửa đúng: bọc
`try/catch` (hoặc dùng một hàm đọc an toàn dùng chung) — đây là lỗi **có sẵn từ trước**, không do
lượt này gây ra.

---

## 5 · MÔI TRƯỜNG — DỰNG LẠI ĐƯỢC

```bash
ln -s /home/user/INTERIORFLOW/node_modules node_modules
cp /home/user/INTERIORFLOW/prisma/dev.db prisma/dev.db
cp /home/user/INTERIORFLOW/.env .env
# ⚠️ BẮT BUỘC: trỏ DATABASE_URL sang ĐƯỜNG DẪN TUYỆT ĐỐI của worktree này (xem §5.1)
PORT=3021 npm run dev

node scripts/nghiem-thu-g1.mjs --chromium=/opt/pw-browsers/chromium-1194/chrome-linux/chrome
node scripts/nghiem-thu-g1.mjs --hieu-chuan --chromium=...   # chỉ phép hiệu chuẩn
node scripts/nghiem-thu-g1.mjs --ca=4 --chromium=...          # một ca
```

Dữ liệu gieo: hai tài khoản `g1.alpha@kiemthu.local` / `g1.beta@kiemthu.local` (mật khẩu
`kiemthu123`, tạo qua `POST /api/auth/register` thật) · ba dự án `g1projA1` `g1projA2` `g1projB1`
· ba hàng `ProjectMember` role `owner` (**bắt buộc** — thiếu thì `assertProjectAccess` trả 404 và
không tạo được bản vẽ). Project + ProjectMember gieo thẳng bằng Prisma vì repo **không có**
`POST /api/projects`.

### 5.1 · ⚠️ BẪY MÔI TRƯỜNG ĐÃ VẤP — cảnh báo cho làn sau

`node_modules` là **symlink sang repo chính**, nên Prisma client sinh ra ở đó **neo `file:./dev.db`
vào `prisma/schema.prisma` của REPO CHÍNH**, không phải của worktree. Hệ quả: `.env` chép nguyên
xi (`DATABASE_URL="file:./dev.db"`) làm dev server của worktree **ghi thẳng vào DB của repo chính**.

Lượt này đã vấp: hai tài khoản kiểm thử lỡ rơi vào `/home/user/INTERIORFLOW/prisma/dev.db`. **Đã
phát hiện và xoá sạch ngay** (`deleteMany` theo `email contains 'kiemthu.local'`, đếm lại còn 0),
rồi đổi `DATABASE_URL` sang **đường dẫn tuyệt đối** của worktree và gieo lại từ đầu.

⇒ **Làn nào chạy dev server trong worktree phải đặt `DATABASE_URL` tuyệt đối**, nếu không sẽ âm
thầm ghi vào DB dùng chung. Đây đúng họ bệnh "dữ liệu đi nhầm kho" mà cổng G1 sinh ra để canh —
chỉ khác là ở tầng môi trường chứ không phải tầng mã.

---

## 6 · CHƯA CHẮC / CHƯA KIỂM — khai thẳng

1. **Chỉ đo trên Chromium 1194 headless.** Safari/WebKit và Firefox là **suy**, không đo. CA3
   quan trọng với Safari nhất (*Block All Cookies*) mà lại chưa chạy trên Safari thật.
2. **Chưa kiểm đường đĩa và đường máy chủ.** `resolveAndSyncCadDisk` (đồng bộ thư mục người dùng
   chọn) và `taiBanVeTuMayChu` (lưới đỡ cuối) **không** được kích hoạt trong 8 ca — cả hai là
   opt-in / chỉ chạy khi cache rỗng. Kho `interiorflow-backup` và `interiorflow-root` **chưa đọc
   tới**; có thể còn đường ghi thứ hai chưa ai soi.
3. **Chỉ đo chặng 2D.** `PresentSheets` (`/present-editor`) đi **cùng một** `danhTinhChoLuot` nên
   suy ra là cùng hành vi, **nhưng chưa chạy một ca nào trên nó**. Autosave 3D
   (`lib/cad/cad3d-autosave.ts`) cũng vậy.
4. **CA8 đổi người bằng API** (`DELETE /api/auth/me` + `POST /api/auth/login`) **chứ không bấm nút
   Đăng xuất trên giao diện.** Nếu nút đó làm thêm gì (dọn store, điều hướng, reload) thì hành vi
   thật có thể khác. Đây là chỗ đáng kiểm lại bằng tay.
5. **Khe hẹp còn mở:** đăng xuất **rồi** mất mạng **rồi** người mới vẽ ⇒ không hỏi được máy chủ ⇒
   lui về đệm ⇒ vẫn trỏ nhầm người. `clearLastUserId()` đóng được khe này nhưng **chưa nối vào
   đường đăng xuất**.
6. **`danhTinhSanSang` single-flight theo vòng đời tab.** Đăng xuất/đăng nhập **không tải lại
   trang** (SPA) thì lượt cũ còn nguyên trong bộ nhớ; muốn chắc phải gọi `quenLuotDanhTinh()`.
   CA8 dùng `goto` nên **không** phủ ca này.
7. **Số 1081 lỗi ở CA3** là đếm sự kiện `pageerror`, không phải 1081 lỗi khác nhau — phần lớn là
   một lỗi lặp theo mỗi lần render.
8. **Chưa đo hồi quy hiệu năng** của việc thêm một request mỗi tab. Lập luận "app vốn đã gọi
   `/api/auth/me` lúc nạp trang" là **đọc log dev server**, không phải phép đo thời gian.

---

## 7 · BÀN GIAO

| # | Việc | Cho ai |
|---|---|---|
| 1 | Nối `clearLastUserId()` vào đường Đăng xuất phía client (1 dòng) | làn sở hữu `components/entry` / auth |
| 2 | Bọc `try/catch` cho `components/studio/Navigator.tsx:60` và `lib/cad/touch-input.ts:38` — hết trang trắng khi localStorage bị chặn | làn sở hữu `components/studio` + `lib/cad` |
| 3 | Chạy lại 8 ca trên chặng **Trình chiếu** và **autosave 3D** | làn G1 lượt sau |
| 4 | Kiểm CA8 bằng **nút Đăng xuất thật** trên giao diện | làn G1 lượt sau |
