# G1 · DATA SAFE — BIÊN BẢN NGHIỆM THU TRÊN APP THẬT

> **Ngày:** 04/09/2026 · **Làn:** 01 CORE — DATA & PROJECT TRUTH · **lượt 2** (lượt 1 xem §3-§4)
> **Mốc mã:** lượt 1 cắt từ `a64c0248`; lượt 2 cắt từ `6547fac0` (`integration/2026-09-04`)
> **Bộ chạy:** `scripts/nghiem-thu-g1.mjs` · **Ảnh:** `docs/delivery/anh-duyet-mat/g1-data-safe/`

## KẾT LUẬN

**CỔNG G1 CHƯA ĐÓNG ĐƯỢC** — vì đúng **một** ca đỏ, và ca đó **không** phải lỗi an toàn dữ liệu.

Ca đỏ còn lại (**CA3**) là một lỗi **sập app** nằm **ngoài** bản vá P0, ở hai tệp không thuộc
phạm vi ghi của làn này. Xem §4.1.

**Hai khe của lượt 1 đã đóng ở lượt 2:**
- **Đường đăng xuất** — `quenDangXuat()` nay được gọi ở **cả bốn** nút Đăng xuất; khe "đăng xuất →
  mất mạng → người mới ghi vào kho người cũ" hết hở. Có **hiệu chuẩn**: gỡ lời gọi ra thì 4/4
  khẳng định đỏ. Xem §9.
- **Phủ chặng** — Trình chiếu và autosave 3D **không còn là suy đoán**: CA9-12 chạy thật, mỗi mặt
  có phép hiệu chuẩn riêng. Xem §4 và §4.2.

Kết quả đáng giá nhất vẫn là của lượt 1: **hai lỗi rò dữ liệu chéo người dùng đã bị bắt và đã
sửa** (§3). Lượt 2 **không** tìm thêm lỗi rò nào — nó biến "tin là an toàn" thành "đo được là an
toàn", và lộ ra **một mặt tiếp xúc chéo người dùng thuộc quyết định sản phẩm**, ở §8.

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

**Lượt 2 mở rộng luật này sang MỌI mặt, không riêng 2D:** ca thêm vào mà không có đường làm nó ĐỎ
thì nó chỉ đang in chữ PASS. Nên mỗi mặt (Trình chiếu · 3D) có phép hiệu chuẩn **riêng**, chạy
ngay trước ca của mặt đó. Thế giới biết-chắc-hỏng của chúng **khác** thế giới của 2D, và lý do vì
sao phải khác là một phát hiện thật — xem §4.3 mục 1.

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

## 4 · BẢNG MƯỜI HAI CA

Lượt cuối, chạy trên mã đã commit. CA1-8 chạy trên **chặng 2D**; CA9-12 là **hai ca đắt nhất
(deep-link và đổi-người) lặp lại trên chặng Trình chiếu và chặng 3D** — xem §4.2 vì sao chỉ hai.

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
| 9 | **Trình chiếu** · deep-link · localStorage **rỗng** | ✅ PASS | `<idA>::/present-editor::g1projA1`: **1 → 2 → 2** slide (thêm slide → tải lại). 0 khoá mơ hồ. |
| 10 | **Trình chiếu** · đổi dự án + **đổi người dùng** | ✅ PASS | A ghi được ở DA1 và DA2 · DA1 còn nguyên · B ghi vào **đúng** kho B · **0** byte vào kho mang id A · `lastUserId` đã về id B. |
| 11 | **3D** · deep-link · localStorage **rỗng** | ✅ PASS | `<idA>::/cad-editor::g1projA1`: **0 → 2 → 2** thực thể (thêm tường → tải lại). 0 khoá mơ hồ. |
| 12 | **3D** · đổi dự án + **đổi người dùng** | ✅ PASS | A ghi được ở DA1 và DA2 · DA1 còn nguyên · B ghi vào **đúng** kho B · **0** byte vào kho mang id A · `lastUserId` đã về id B. |

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

### 4.2 · Vì sao chặng Trình chiếu và 3D chỉ chạy HAI ca, không chạy đủ tám

CA1 và CA8 là hai ca **bắt được nhiều lỗi nhất** ở lượt trước: CA1 đi đúng đường deep-link đã gây
P0; CA8 chính là ca phát hiện lỗ rò chéo người dùng. Sáu ca còn lại (2·3·5·6·7) kiểm **lõi
`giaiDanhTinh`** — localStorage hỏng, mạng đứt, 401, JSON méo — mà lõi đó là **một, dùng chung cho
cả ba mặt** (`danhTinhChoLuot`). Lặp chúng ba lần là ba lần đo cùng một hàm.

Thứ **thật sự khác nhau giữa ba mặt** là: đơn vị việc (thực thể ↔ slide), khoá route
(`/cad-editor` ↔ `/present-editor`), và đường vào màn. Cả ba khác biệt đó đều nằm trong CA1 và
CA8 — nên hai ca này là **tập nhỏ nhất phủ đúng phần chưa được đo**.

### 4.3 · ⚠️ Hai bẫy của chính bộ nghiệm thu, phát hiện khi mở rộng

Cả hai đều **không phải lỗi app** — chúng là lỗi của phép đo, và nếu không bắt thì chúng đẻ ra
`UNVERIFIED` mà người đọc dễ hiểu nhầm thành "app có vấn đề".

1. **Hiệu chuẩn bằng cách chặn định danh KHÔNG dùng được cho Trình chiếu và 3D.** Chặn
   `/api/auth/me` làm app **không dựng nổi màn**: 401 rơi vào màn khoá (`"Skip →"`), mạng đứt rơi
   vào *"Chưa kết nối được máy chủ · Thử lại"*. Ca đỏ vì **không với tới mặt**, không phải vì bộ
   khẳng định bắt được — loại đỏ đó **không chứng minh phép đo có hiệu lực**, mà đó mới là toàn bộ
   mục đích của hiệu chuẩn. ⇒ đổi sang thế giới **chặn ghi IndexedDB** (`CHAN_GHI_IDB`): app sống,
   định danh đúng, người dùng làm việc thật, chỉ lượt GHI là không tới nơi — đúng hình dạng của
   P0 gốc, và đường ĐỌC vẫn nguyên nên con số 0 là **phép đo thật, không phải phép đo bị mù**.
2. **`"Vẽ 3D"` là CÔNG TẮC GẠT, không phải nút mở — và mode được NHỚ giữa các lượt.** Hai lỗi
   chồng nhau, cùng một gốc:
   - cơ chế chờ ban đầu cứ bấm lại nút mở cho tới khi thấy nút đích ⇒ bấm lần hai là **gạt ngược
     về mode Node**;
   - và ngay cả khi chỉ bấm **một** lần, sang dự án thứ hai app **đã ở sẵn** mode 3D (mode được
     nhớ), nên cú bấm đó **cũng là gạt ngược**.
   Cả hai làm `"Thêm tường"` không bao giờ hiện, và ca chết ở chỗ nhìn như không liên quan.
   **Đã tốn hai lượt chạy CA12 mới thấy** — vì thông báo chỉ là một dòng `Timeout` trần.
   ⇒ ba việc: tách `choMatSanSang()` (có bấm, chỉ cho nút **một chiều**) khỏi `choNut()` (chờ
   suông); **đọc `aria-pressed`** (`ModeSwitchCell.tsx:32` đã phơi sẵn) rồi mới quyết định có bấm
   hay không; và mọi lượt chờ khi hết kiên nhẫn đều **ném lỗi kèm URL + danh sách nút đang có**.
   📌 Bài học chung: **công tắc gạt thì phải ĐỌC TRẠNG THÁI rồi mới bấm, đừng bấm rồi tin.**

---

## 5 · MÔI TRƯỜNG — DỰNG LẠI ĐƯỢC

```bash
ln -s /home/user/INTERIORFLOW/node_modules node_modules
cp /home/user/INTERIORFLOW/prisma/dev.db prisma/dev.db
cp /home/user/INTERIORFLOW/.env .env
# ⚠️ BẮT BUỘC: trỏ DATABASE_URL sang ĐƯỜNG DẪN TUYỆT ĐỐI của worktree này (xem §5.1)
export DATABASE_URL="file:$(pwd)/prisma/dev.db"
PORT=3051 npm run dev

CHR=/opt/pw-browsers/chromium-1194/chrome-linux/chrome
node scripts/nghiem-thu-g1.mjs --goc=http://localhost:3051 --chromium=$CHR      # cả 12 ca
node scripts/nghiem-thu-g1.mjs --hieu-chuan --chromium=$CHR                     # chỉ hiệu chuẩn
node scripts/nghiem-thu-g1.mjs --ca=10 --goc=http://localhost:3051 --chromium=$CHR  # một ca
```

⚠️ `--goc` mặc định vẫn là `http://localhost:3021` (mốc lượt 1). Lượt 2 chạy ở **3051** để không
đụng dev server của làn khác — nên **phải truyền `--goc`**, quên là ca ra `UNVERIFIED` vì gõ cửa
một máy chủ không có ai.

Dữ liệu gieo: hai tài khoản `g1.alpha@kiemthu.local` / `g1.beta@kiemthu.local` (mật khẩu
`kiemthu123`, tạo qua `POST /api/auth/register` thật) · ba dự án `g1projA1` `g1projA2` `g1projB1`
· ba hàng `ProjectMember` role `owner` (**bắt buộc** — thiếu thì `assertProjectAccess` trả 404 và
không tạo được bản vẽ). Project + ProjectMember gieo thẳng bằng Prisma vì repo **không có**
`POST /api/projects`.

⚠️ Hai chi tiết gieo hay vấp (đo thật 04/09, lượt 2):
1. `Project` có `userId` **bắt buộc** (`schema.prisma:71`) — gieo thiếu là Prisma từ chối ngay.
   `ProjectMember` là quan hệ RIÊNG, vẫn phải gieo, không suy ra từ `Project.userId`.
2. Dự án **chưa có `Flow` nào** thì cả ba mặt đều dừng ở màn chặn `ProjectScopeEmptyState`
   ("… chưa có bản vẽ nào"). Bộ nghiệm thu tự bấm "Tạo bản vẽ mới" để đi tiếp, nhưng lượt tạo
   đầu tiên **chậm** (đo: `PUT /api/flows` ~3s, kệ mẫu hồ sơ hiện sau ~19s) — nên các ca có
   `--ca=` lần đầu chạy trên một dự án trắng sẽ lâu hơn hẳn lần sau.

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

### 5.2 · Lượt 2 — bằng chứng CSDL repo chính KHÔNG bị đụng

Lượt 2 dùng `.dev-g1.sh` (đặt `DATABASE_URL` **tuyệt đối** rồi mới `npm run dev`), và kiểm lại
bằng cách **đếm tại nguồn**, không tin lời khai:

| Truy vấn trên `/home/user/INTERIORFLOW/prisma/dev.db` | Kết quả |
|---|---|
| `User` có `kiemthu` hoặc `g1.` trong email | **0** |
| `Project` có id `g1proj%` | **0** |
| `Flow` thuộc dự án `g1proj%` | **0** |
| `ProjectMember` thuộc dự án `g1proj%` | **0** |

Cùng lúc, **toàn bộ** gieo đó nằm trong CSDL của worktree (2 user · 3 dự án · 3 flow · 3 thành
viên). ⇒ đường ghi của lượt này **không chạm** repo chính.

🔴 **NHƯNG số hàng của repo chính CÓ ĐỔI trong lúc lượt này chạy — và phải nói thẳng là không
phải do lượt này.** Đếm đầu lượt `TOTAL_ROWS=24` (`User=2`, `CreditTransaction=2`); đếm cuối lượt
`TOTAL_ROWS=22` (`User=1`, `CreditTransaction=1`) — **mất** tài khoản `tho@interiorflow.test` và
một giao dịch tín dụng. `Flow` · `Project` · `ProjectMember` **không đổi** (5 · 4 · 3).
Quy trách nhiệm bằng bằng chứng, không bằng suy đoán: bảng trên chứng minh lượt này không ghi
được gì vào repo chính, và `ps` cho thấy **hai `next-server` khác** (khởi động 02:44 và 02:46) +
`next start -p 3130` (03:13) đang chạy trên repo chính từ trước khi lượt này bắt đầu — tức có làn
khác đang dọn tài khoản kiểm thử của chính họ.
⇒ Ghi lại như một **quan sát vận hành**, không phải một kết luận về mã: *nhiều làn dùng chung một
CSDL thì phép đếm trước/sau KHÔNG còn là bằng chứng sạch* — bằng chứng sạch phải là truy vấn theo
**dấu vết của chính mình** (bảng trên), không phải tổng số hàng.

---

## 6 · CHƯA CHẮC / CHƯA KIỂM — khai thẳng

1. **Chỉ đo trên Chromium 1194 headless.** Safari/WebKit và Firefox là **suy**, không đo. CA3
   quan trọng với Safari nhất (*Block All Cookies*) mà lại chưa chạy trên Safari thật.
2. **Đường đĩa và đường máy chủ: ĐÃ ĐỌC MÃ, VẪN CHƯA CHẠY.** Kết luận đọc được (bằng chứng ở
   §8), nhưng **không ca nào kích hoạt chúng** — đồng bộ đĩa là opt-in (đòi người dùng tự chọn
   thư mục gốc, `rootFolderChosen()` trả false trong Chromium headless), lưới đỡ máy chủ chỉ chạy
   khi cache rỗng. ⇒ vẫn là **suy từ mã**, không phải phép đo.
3. ~~Chỉ đo chặng 2D~~ → **ĐÃ ĐÓNG** ở lượt 2: CA9-12 chạy thật trên Trình chiếu và 3D (§4).
   Còn lại: **sáu ca lõi (2·3·5·6·7) vẫn chỉ chạy trên 2D** — lý do ở §4.2, và lý do đó là một
   LẬP LUẬN, không phải phép đo.
4. **Đổi người bằng API** (`DELETE /api/auth/me` + `POST /api/auth/login`) **chứ không bấm nút
   Đăng xuất trên giao diện** — đúng cho cả CA8, CA10 và CA12. Nay điều này **quan trọng hơn
   trước**, vì `quenDangXuat()` được nối vào **đúng nút giao diện** chứ không nằm trong route API
   ⇒ ba ca đó **không** đi qua lời gọi mới. Lớp thứ hai hiện được canh bằng **test đơn vị ⑤d** (có
   hiệu chuẩn), chưa được canh bằng ca trình duyệt.
5. ~~Khe hẹp "đăng xuất rồi mất mạng"~~ → **ĐÃ ĐÓNG** ở lượt 2 (§9).
6. ~~`danhTinhSanSang` single-flight theo vòng đời tab~~ → **ĐÃ ĐÓNG**: `quenDangXuat()` gọi luôn
   `quenLuotDanhTinh()`, và test ⑤d khẳng định sau đăng xuất thì tab **có hỏi lại máy chủ**.
7. **Số 1081 lỗi ở CA3** là đếm sự kiện `pageerror`, không phải 1081 lỗi khác nhau — phần lớn là
   một lỗi lặp theo mỗi lần render.
8. **Chưa đo hồi quy hiệu năng** của việc thêm một request mỗi tab. Lập luận "app vốn đã gọi
   `/api/auth/me` lúc nạp trang" là **đọc log dev server**, không phải phép đo thời gian.
9. **CA9-12 chạy TỪNG CA một (`--ca=`), chưa chạy một lượt 12 ca liền mạch.** Mỗi ca tự dựng
   `browserContext` riêng nên độc lập về IndexedDB, nhưng **chưa có phép đo** nào chứng minh
   chúng không ảnh hưởng nhau qua trạng thái máy chủ. CA1 và CA8 đã chạy lại sau khi sửa bộ chạy
   và vẫn PASS ⇒ phần dùng chung không hỏng; sáu ca còn lại (2·3·5·6·7) **chưa chạy lại** ở lượt 2
   — chúng không đụng mã đã sửa, nhưng đó là **lập luận**, không phải phép đo.
10. **Đơn vị việc của chặng Trình chiếu là SỐ SLIDE**, tức ca chỉ chứng minh *có thêm một slide và
   nó sống qua tải lại* — **không** chứng minh nội dung bên trong slide (chữ · ảnh · bố cục) được
   giữ đúng. Ca tương đương ở 2D cũng vậy: đếm thực thể, không so hình.
11. **Chỗ đứng của `quenDangXuat()` chưa được ca trình duyệt nào đi qua** — xem mục 4 ở trên. Đây
   là chỗ hở lớn nhất còn lại của lượt 2.

---

## 7 · BÀN GIAO

| # | Việc | Cho ai |
|---|---|---|
| 1 | ~~Nối `clearLastUserId()` vào đường Đăng xuất~~ | ✅ **XONG** lượt 2 — §9 |
| 2 | Bọc `try/catch` cho `components/studio/Navigator.tsx:60` và `lib/cad/touch-input.ts:38` — hết trang trắng khi localStorage bị chặn | làn sở hữu `components/studio` + `lib/cad` |
| 3 | ~~Chạy ca trên chặng **Trình chiếu** và **autosave 3D**~~ | ✅ **XONG** lượt 2 — CA9-12 |
| 4 | Kiểm đổi-người bằng **nút Đăng xuất thật** trên giao diện (nay là chỗ `quenDangXuat()` sống) | làn G1 lượt sau |
| 5 | Kích hoạt được **đường đĩa** trong Chromium headless (đòi `showDirectoryPicker`) để đo thật thay vì đọc mã | làn G1 lượt sau |
| 6 | **Kho tay cầm thư mục KHÔNG theo người dùng** — xem §8, quyết định sản phẩm | chủ dự án |

---

## 8 · ĐƯỜNG ĐĨA · ĐƯỜNG MÁY CHỦ · HAI KHO TAY CẦM — đọc mã, chưa chạy

Ba đường ghi ngoài IndexedDB, hỏi đúng một câu: **chúng có đi qua chỗ đã vá không?**

| Đường | Đi qua `danhTinhChoLuot`? | Bằng chứng | Rò chéo người dùng được không? |
|---|---|---|---|
| `resolveAndSyncCadDisk` (đồng bộ thư mục đĩa) | **CÓ** | `CadSheets.tsx:444`, nằm **trong** khối `async` mở ở `:419` | Không qua đường `lastUserId` — nó khoá theo `projectId`, **không đọc userId một lần nào** |
| `taiBanVeTuMayChu` (lưới đỡ máy chủ) | **CÓ** | `CadSheets.tsx:458`, cùng khối | Không — `/api/project-files` gọi `getSessionUser()` + `assertProjectAccess(user.id, …)` (`route.ts:129,138`), máy chủ chặn người không phải thành viên |

⇒ Cả hai **không phải lỗ của bản vá này**: chúng nằm sau cổng định danh, và cái chúng khoá theo là
**dự án**, không phải người.

🔴 **NHƯNG có một chỗ khác bản chất, phải nói rõ vì nó KHÔNG phải lỗi của lượt này và cũng KHÔNG
tự khỏi:** hai kho tay cầm thư mục là **của MÁY, không của NGƯỜI**.

| Kho | Khoá | userId trong tệp |
|---|---|---|
| `interiorflow-root` / store `handles` | `'rootDir'` — **một khoá cố định** (`lib/root-folder.ts:21-23`) | `grep userId` = **0** |
| `interiorflow-backup` / store `handles` | `'backupDir'` — **một khoá cố định** (`lib/cad/auto-backup.ts:37-39`) | `grep userId` = **0** |

`getProjectFolderHandle()` (`root-folder.ts:157`) nhận `projectId` + `projectName`, **không nhận
userId**. ⇒ trên một máy dùng chung, A chọn thư mục gốc; B đăng nhập trên **cùng hồ sơ trình
duyệt** thì **dùng lại đúng tay cầm đó** — kể cả sau khi A đã đăng xuất.

Đây **không** vi phạm bất biến #2 theo nghĩa hẹp (không có byte nào của B rơi vào *kho IndexedDB*
của A, và mỗi dự án vẫn có thư mục riêng), nhưng nó **là một mặt tiếp xúc chéo người dùng có
thật** — và là **quyết định sản phẩm**, không phải chuyện kỹ thuật: tay cầm thư mục nên thuộc
**máy** (tiện: chọn một lần cho cả studio) hay thuộc **người** (an toàn: mỗi người một thư mục)?
Chốt 16/08 "lưu CHUNG ↔ lưu MÁY" xếp *cách bày trên màn* vào MÁY và *tài sản* vào CHUNG — **tay
cầm thư mục không rơi gọn vào ô nào**. ⇒ để chủ dự án quyết, làn này **không tự sửa**.

---

## 9 · LỚP THỨ HAI ĐÃ ĐƯỢC NỐI — đường đăng xuất

**Khe đang đóng:** đăng xuất → **mất mạng** → người mới làm việc. Máy chủ không với tới nên
`giaiDanhTinh` lui về bộ đệm (đường lui đó **cố ý**, giữ local-first) — mà bộ đệm còn id người vừa
rời đi ⇒ việc của người mới rơi vào kho người cũ.

**Đường đăng xuất CÓ TỒN TẠI, chỉ là không mang tên "logout".** Lượt trước grep `logout|signOut`
ra đúng một tệp (và chỗ đó chỉ là chú thích) nên kết luận nhầm là "chưa có đường". Đo lại bằng
`DELETE /api/auth/me` thì ra **bốn nơi**, cùng một hình dạng
`await fetch('/api/auth/me', {method:'DELETE'}); setUser(null);`:

| Tệp:dòng |
|---|
| `components/AccountMenu.tsx:137` |
| `components/MobileMenu.tsx:160` |
| `components/settings/AccountSettings.tsx:54` |
| `app/settings/_components/PixelSettingsShell.tsx:191` |

`clearLastUserId()` đã có sẵn nhưng **chưa ai gọi**. Nay gói thành **`quenDangXuat()`**
(`lib/danh-tinh-phien.ts`) làm **đủ hai việc**, để bốn nơi không phải nhớ hai bước — nhớ một nửa
là đúng lại lỗ cũ:

1. xoá bộ đệm định danh (localStorage **và** đường lùi trong bộ nhớ);
2. **quên lượt giải định danh của tab** — đăng xuất/đăng nhập trong SPA **không tải lại trang**,
   không quên thì tab đó không bao giờ hỏi lại máy chủ nữa.

**Đã hiệu chuẩn** (ca ⑤d, `lib/danh-tinh-phien-nghiem-thu.test.ts`): gỡ lời gọi ra thì **4/4**
khẳng định đỏ, gồm đúng câu *"việc rơi vào kho người cũ"*. Có lời gọi thì **32 pass · 0 fail**.

⚠️ **Không dựng một tính năng đăng xuất mới** — chỉ **thêm lời gọi** vào bốn nơi đã có. Một trong
bốn (`app/settings/_components/PixelSettingsShell.tsx`) nằm dưới `app/**`, vùng phiếu liệt kê là
cấm; sửa ở đó theo đúng ngoại lệ *"nơi gọi `clearLastUserId()` — dù ở đâu, nhưng chỉ thêm lời
gọi"*. Thay đổi ở tệp đó là **2 dòng: một `import`, một lời gọi.** Bỏ nó lại thì cửa đăng xuất
trong Cài đặt vẫn hở, tức vá ba phần tư một cái lỗ.
