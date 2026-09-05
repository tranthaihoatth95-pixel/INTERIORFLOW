# LANE B — chất lượng bản ghi ở cửa Promote: siêu dữ liệu · hợp đồng duyệt · chống trùng

> Vá lỗ do `DEMO-SACH` §3.1/§3.2/§3.3 bắt được. Ba lỗ đó hoá ra là **ba mặt của MỘT bệnh**:
> `LibraryAsset` có hai cửa ghi và **chưa cửa nào tự nhìn vào tệp** — một cửa tin lời client,
> một cửa không hỏi gì cả.

**Trả MAIN — bốn dòng:**

| Mục | Trạng thái | Một dòng lý do |
|---|---|---|
| **Promote metadata** | **LIVE** | Đã có cửa trích chung; promote qua API thật ghi `4×3 · palette ["#c81e28"] · hash 64 ký tự` |
| **Review contract** | **BLOCKED** (schema là cửa của Hoà) | `daXem` không có chỗ lưu ⇒ máy chủ không cưỡng chế được; đã khai thẳng hợp đồng "Promote KHÔNG đòi duyệt" thay vì dựng cổng giả |
| **contentHash dedupe** | **LIVE** | Trùng bytes + cùng giấy phép ⇒ dùng lại asset, gắn thêm nguồn; khác giấy phép ⇒ hàng mới. Kho đã backfill 1.620/1.621 |
| **Pagination** | **DEFER** (tường minh) | 14 tệp gọi `/api/library` và đọc trọn mảng; **6 trong số đó thuộc vùng LANE A/C** — đổi contract giữa phiên là lỗi va chạm, không phải tối ưu |

---

## ⓪ TIỀN ĐỀ — đã kiểm, không nhận suông

| Giả định của phiếu | Kiểm bằng gì | Kết quả |
|---|---|---|
| Đứng đúng mốc | `git log -1` = `c7f3ac8` · `git rev-list --count HEAD..main` = **0** | ✅ |
| `LibraryAsset.contentHash` + `@@index([userId, contentHash])` sống | truy vấn Prisma thật: `findFirst` trả `contentHash: null` (cột CÓ) | ✅ |
| `AssetRepresentation` sống | `prisma.assetRepresentation.count()` = **0** (bảng CÓ, chưa dùng) | ✅ |
| `promote.ts:145-156` không ghi `w`/`h`/`palette` | đọc mã | ✅ đúng |
| `library-save.ts:30-31` "có làm" | đọc mã | 🔧 **ĐÚNG MỘT NỬA — xem §1** |
| Dev server 3001 sống | `curl /api/auth/me` → 401 (sống, và cửa quyền đang đóng) | ✅ |

**Mốc đếm đầu phiên:** ProjectFile **9** · LibraryAsset **1622** · ProjectAssetUsage **9**.

---

## 1 · VIỆC 1 — siêu dữ liệu khi Promote  ✅ LIVE

### 1.1 🔧 Một chỗ phiếu mô tả chưa đúng, và nó đổi cả cách sửa

Phiếu viết: *"cửa ghi kia của CÙNG bảng — `library-save.ts:30-31` — có làm"*. Đo lại:

```
library-save.ts:68-69   w: Number.isFinite(input.w) ? Math.round(input.w) : 0
                        h: Number.isFinite(input.h) ? ...
```

`input.w`/`input.h`/`input.palette` **đến từ CALLER** — tức từ con số client tự đo bằng canvas rồi
POST lên (`app/api/library/route.ts:54`). Server **chưa bao giờ tự nhìn vào tệp** ở cửa nào cả.

⇒ Bệnh không phải *"promote quên chép code của library-save"*. Bệnh là **chưa ai trích siêu dữ liệu
ở phía máy chủ**. Nếu tôi làm đúng nghĩa đen "tách hàm chung từ hai đường", hàm chung đó sẽ là
*"nhận w/h từ tham số rồi ghi xuống"* — tức **chép đúng cái lỗ sang chỗ thứ hai**. Phiếu cấm chép
logic là đúng; nhưng lý do thật còn mạnh hơn lý do phiếu nêu.

### 1.2 [Đ2] nhìn-vào-trong-trước — đã tìm gì, vì sao không dùng lại được

| Ứng viên | Phán | Bằng chứng |
|---|---|---|
| `lib/imaging.ts:15 extractPalette` | ❌ không gọi được từ máy chủ | `'use client'` + `document.createElement('canvas')` |
| `bamContentHash` | ✅ **DÙNG LẠI NGUYÊN** | `app/api/project-files/_lib/luu-file.ts:63` — không viết hàm băm thứ hai |
| `sharp ^0.35.3` | ✅ dùng, nhưng **nạp động** | đã có trong `package.json`, nhưng 4/4 nơi dùng đều ở `scripts/` — chưa từng chạy trong đường sống của app |
| `sniffKind` / `UPLOAD_DIR` / trần 25MB | ✅ giữ nguyên | không đẻ kho lưu hay whitelist thứ hai |

### 1.3 Đã dựng gì

**`lib/server/asset-metadata.ts`** — một cửa TRÍCH + một cửa DỰNG BẢN GHI:

- `docKichThuocTuHeader(buf)` — **thuần, không phụ thuộc**: đọc thẳng header PNG · JPEG · GIF ·
  WEBP (cả ba biến thể `VP8 `/`VP8L`/`VP8X`). Đây là đường **CHÍNH** cho `w`/`h`.
- `trichPaletteTuRgba(rgba)` — thuần; cùng lượng tử 4 bit/kênh · cùng ngưỡng tách 60 · cùng trần
  6 màu với bản trình duyệt, để hai cửa ra cùng một palette cho cùng một ảnh.
- `trichSieuDuLieu(buf, hashCoSan?)` — gộp: header trước, `sharp` sau (lấp AVIF + là nguồn duy
  nhất của palette). Nhận `hashCoSan` để **không băm lại 25MB lần hai**.
- `dungBanGhiLibraryAsset(...)` — nửa "GHI": dựng đúng object `data:` cho `libraryAsset.create`.

**Cả hai cửa ghi nay gọi cùng hàm này.** Thêm/bớt một cột là cả hai cùng đổi — không còn cách nào
để một cửa "quên" một trường nữa. Đó mới là thứ chặn tái phát, chứ không phải việc vá 3 dòng.

### 1.4 Ba quyết định đáng nói

**① Không đo được thì trả `0`/`[]`, KHÔNG đoán.** PDF không có "kích thước pixel" — nó có khổ
trang; nhét khổ trang vào cột tính bằng pixel là trộn hai đơn vị. `w=0` đọc là *"chưa biết"* và đó
là sự thật kiểm chứng được. Kèm `ghiChu[]` khai **vì sao** thiếu, trả luôn lên API.

**② `contentHash` là `null` chứ không phải `''` khi chưa biết.** `''` là một giá trị THẬT —
nó sẽ gom mọi tệp chưa hash vào cùng một "nhóm trùng" giả ở mọi truy vấn về sau.

**③ Sharp nạp động trong `try/catch`, và bề mặt type khai tay.** Sharp là native module chưa từng
chạy trong đường sống của app; sharp hỏng thì **bản ghi nghèo đi, KHÔNG được làm hỏng cả thao tác
Promote**. (Type khai tay vì sharp xuất hai hình dạng type CJS/ESM — `typeof import('sharp')` không
gọi được, `tsc` TS2349 đã gặp thật.)

### 1.5 Nghiệm thu — qua API THẬT, rồi ĐỌC LẠI bản ghi

`POST /api/project-files` → `POST /api/project-files/{id}/promote` trên **dev server 3001 đang
sống**, phiên đăng nhập ký bằng đúng `AUTH_SECRET` của `.env`. Không ghi thẳng DB để nghiệm thu.

```
ok - không cookie → 401 (không bypass quyền)
ok - POST /promote → 200
ok - body trả meta cho UI — meta={"w":4,"h":3,"palette":["#c81e28"],"ghiChu":[]}
ok - w/h ĐÚNG THẬT (4×3), không còn 0×0
ok - palette có màu — ["#c81e28"]
ok - contentHash 64 ký tự — 05a768e80d641307…
ok - contentHash === của ProjectFile (một định nghĩa hash)
ok - NGUỒN GỐC: tag nguon:projectfile:<id>
ok - giấy phép được khai — license:user
ok - ProjectAssetUsage tự tạo cho project nguồn
```

Đây cũng là bằng chứng **sharp chạy được trong runtime Next.js**, không chỉ trong `sucrase-node`.

---

## 2 · VIỆC 2 — cửa "Đã xem"  🔴 BLOCKED ở cửa schema

### 2.1 Sự thật đo được

| Câu hỏi | Đo | Kết |
|---|---|---|
| `daXem` lưu ở đâu? | `TepNguonDuAn.tsx:442` `useState<Record<string,boolean>>({})` | **chỉ trong bộ nhớ một màn**, mất khi tải lại trang |
| Có cột DB không? | `schema.prisma` — không có | **không** |
| Có gửi lên trong body không? | route promote đọc `usage`/`name`/`category`/`note` | **không** |
| Route có hỏi tới không? | `app/api/project-files/[id]/promote/route.ts` | **không** |

⇒ Cả 9 tệp promote lọt là **đúng hành vi của hệ thống đang có**, không phải người dùng lách.

### 2.2 Chọn đường nào, và vì sao

Phiếu cho hai đường. Tôi **chọn (b) làm hợp đồng hiện tại, và trình hình dạng (a) cho Hoà** —
không phải vì (b) dễ hơn, mà vì (a) **không làm được mà không đổi schema**:

- **(a) máy chủ cưỡng chế** đòi một chỗ lưu trạng thái duyệt. Schema là cửa của Hoà, phiếu cấm tự
  thêm. Máy chủ **không thể cưỡng chế một trạng thái nó không lưu**.
- **Cổng giả bị loại thẳng:** nhận một cờ `daXem` từ body rồi kiểm nó là để **người gọi tự khai
  mình đã duyệt** — cổng bằng giấy. Nó tệ hơn không có cổng, vì tạo cảm giác an toàn.

⇒ **Hợp đồng khai thẳng ngay tại cửa** (`lib/server/promote.ts`, docstring đầu tệp): *Promote
KHÔNG đòi duyệt. Ai qua được `assertProjectAccess(…, 'bim')` đều promote được.* Kèm dấu ⛔ cấm phiên
sau "tiện tay" dựng cổng giả ở đây.

### 2.3 Trình MAIN — hình dạng đề xuất cho (a), nếu Hoà muốn cổng thật

```prisma
model ProjectFile {
  // …
  /// Ai đã MỞ RA XEM và xác nhận, null = chưa ai. Đây là human gate của chuỗi Promote.
  reviewedBy String?
  reviewedAt DateTime?
}
```
Chọn `ProjectFile` chứ không phải bảng riêng: việc duyệt gắn với **tệp thô**, một-một, và chết
cùng tệp. Bảng riêng chỉ đáng khi cần lịch sử nhiều lượt duyệt — chưa có nhu cầu đó.
Kèm: `POST /promote` trả **403** kèm lý do khi `reviewedAt == null`, và UI đọc trạng thái từ máy
chủ thay vì `useState`.

### 2.4 🔴 Việc còn lại KHÔNG thuộc vùng ghi của phiếu này

Dù chọn (a) hay (b), **UI phải thôi ngụ ý một cổng cứng**: `components/filemanager/tep-nguon.ts:77`
`lyDoChuaGui()` làm mờ nút và nói *"Xem tệp rồi đánh dấu 'Đã xem' trước khi đưa vào Thư viện"* —
câu đó mô tả một luật máy chủ **không tồn tại**. `components/filemanager/**` nằm ngoài
`VÙNG ĐƯỢC GHI` của phiếu ⇒ **không đụng**. Bàn giao cho lane sở hữu vùng đó, kèm file:dòng.

---

## 3 · VIỆC 3 — chống trùng theo `contentHash`  ✅ LIVE

### 3.1 Khoá coi-là-một-vật: `userId` + `contentHash` + **lớp `license:`**

Cả ba, không thiếu cái nào:
- bỏ `userId` ⇒ rò tài sản xuyên người dùng;
- bỏ `license:` ⇒ gộp hai tệp trùng bytes nhưng khác giấy phép — **ca hợp lệ**, và gộp nhầm thì
  hồ sơ khách mang sai giấy phép.

Hash **không tính lại**: `ProjectFile.contentHash` đã mang sẵn sha256 của đúng binary đó, cùng hàm
`bamContentHash` ⇒ đọc thẳng. Ca trùng vì thế **không tốn một lượt đọc đĩa nào** — kiểm trùng chạy
trước khi mở tệp.

Truy vấn đi thẳng vào `@@index([userId, contentHash])`; lọc `license:` ở tầng code (license sống
trong CSV `tags`, không index được) — đúng chỗ, vì bộ ứng viên sau lọc theo index đã rất nhỏ.

### 3.2 `daCo` ≠ `dungLai` — hai câu khác nhau, người dùng cần phân biệt

| Trường | Nghĩa |
|---|---|
| `daCo: true` | *"bạn bấm lại"* — CHÍNH tệp này đã promote trước đó |
| `dungLai: true` | *"kho đã có vật này rồi, từ một tệp khác"* — dùng lại asset, gắn thêm nguồn |

Cả hai đều **200**. Không nhân bản không phải lỗi.

### 3.3 ⛔ Vì sao TUYỆT ĐỐI không `@unique` — nay có số

Sau backfill, kho có **52 nhóm trùng thật · 73 hàng dôi**. `@unique` áp vào là **đổ ngay lúc
backfill**. Ngoài ra ca *trùng-bytes-khác-giấy-phép* là hợp lệ và đã có test giữ.

### 3.4 Test cả hai nhánh (phiếu yêu cầu)

| Nhánh | Kỳ vọng | Kết |
|---|---|---|
| trùng bytes + **cùng** giấy phép | 1 asset, tags mang **CẢ HAI** nguồn | ✅ |
| trùng bytes + **khác** giấy phép | asset **MỚI** | ✅ |
| promote lại tệp trùng | tags **không phình** (`themTag` idempotent) | ✅ |

---

## 4 · VIỆC 4 — backfill + kiểm kê  ✅ ĐÃ CHẠY

`scripts/backfill-asset-hash.ts` — **chỉ đọc · tính · điền**. Không xoá bản ghi, không gộp bản ghi,
không đụng tệp trên đĩa. Mặc định **chạy thử**; `--ghi` mới ghi thật.

```
Tổng asset còn sống : 1621
  · hash ĐÃ ĐIỀN     : 1620
  · TỆP CHẾT trên đĩa: 1     ← hash để NULL, đây LÀ bản kiểm kê
  · còn 0×0          : 126   (cần --sieu-du-lieu, chưa chạy — xem ⑦b)
NHÓM TRÙNG THẬT      : 52 nhóm · 73 hàng dôi
```

Chạy lại lượt hai: `hash sẽ điền: 0` — **idempotent**. Đếm bảng không đổi: 1622 / 9 / 9.

### 4.1 🔧 Đính chính một con số trong `schema.prisma`

Chú thích `schema.prisma:322-331` ghi *"kho đang có trùng thật (đo 20/08: 'Ảnh PDF trang 15 —
Westlake' ×7)"*. Đo lại bằng hash thật:

| Cách đếm | Kết quả |
|---|---|
| cùng **TÊN** | **7** |
| cùng **BYTES** | **4 + 4** — hai nhóm byte KHÁC NHAU, nhóm lớn nhất là ×4 |

Kết luận của chú thích (**cấm `@unique`**) **vẫn đúng và còn mạnh hơn** (52 nhóm chứ không phải 1).
Nhưng con số ×7 là đếm theo tên, không phải theo nội dung. Ghi lại vì đây đúng loại lỗi *"số chép
lại không phải phép đo"* mà sổ đã ban luật.

### 4.2 Hai thứ script CỐ Ý không làm

- **không gộp** nhóm trùng — mỗi hàng có nguồn gốc + `ProjectAssetUsage` riêng; gộp là quyết định
  nghiệp vụ, không phải việc của script dọn dẹp;
- **không xoá** bản ghi trỏ vào tệp chết — xoá là mất luôn nguồn gốc và where-used.

---

## 5 · Pagination `/api/library`  ⏸ DEFER — tường minh, có bằng chứng

Nợ hiệu năng là **thật** (1.621 hàng/lượt, kèm `include: {user}`). Nhưng:

- **14 tệp** gọi `/api/library` và đọc trọn `.assets`;
- trong đó `components/home/DongStudioHome.tsx` (**LANE A**),
  `components/present-editor/PresentEditor.tsx` + `Toolbar.tsx` (**LANE C**),
  `components/studio/ReferencePane.tsx` (**LANE A**) — **vùng tôi bị cấm ghi**.

Đổi hình dạng trả về mà không sửa được consumer là **đẩy lỗi sang lane khác giữa phiên**. Việc này
cần một phiếu riêng sở hữu cả hai đầu. Hướng rẻ nhất khi mở: giữ `{assets}` nguyên vẹn, **thêm**
`?limit=&cursor=` opt-in, chuyển consumer dần — additive → bridge → migrate, đúng khuôn
TRANSITION của luật NO-REBUILD.

---

## 6 · VERIFY

| Cổng | Kết quả |
|---|---|
| `npx tsc --noEmit` | **0 lỗi** |
| `lib/server/asset-metadata.test.ts` (mới) | **16 pass / 0 fail** |
| `lib/server/promote.test.ts` (mở rộng 14→22) | **22 pass**, không hồi quy |
| Toàn bộ `*.test.ts` của repo | **0 FAIL** |
| Promote qua **API thật** (3001) | **18/18 ok**, đã đọc lại bản ghi làm bằng chứng |
| Phân loại HTTP | 401 không cookie · 404 id không có · **410** tệp chết trên đĩa · 415 loại tệp lạ (giữ) |
| **Dọn sạch** | ProjectFile 9=9 · LibraryAsset 1622=1622 · Usage 9=9 · uploads đã dọn |

**Cách kiểm parser kích thước đáng ghi lại:** ảnh fixture do `sharp` **sinh thật**, rồi parser
header thuần đọc lại và phải khớp đúng số sharp khai. Hai bản cài độc lập phải đồng ý. Tự dựng
header rồi tự đọc header chỉ chứng minh ta nhất quán với chính mình.

---

## ⑦b · CHƯA CHẮC / CHƯA KIỂM — đọc trước khi tin bảng trên

1. **126 asset vẫn `0×0`.** Backfill chạy đường **hash-only** (đúng chữ của phiếu). Nhánh
   `--sieu-du-lieu` đã viết và type-check nhưng **chưa chạy trên kho thật** — nó giải mã 1.621 ảnh
   bằng sharp, thời gian chưa đo. Con số 126 là "còn 0×0", **chưa biết bao nhiêu trong đó sửa được**
   (PDF thì vĩnh viễn 0×0 một cách đúng đắn).
2. **Bản song sinh palette chưa hợp nhất.** `lib/imaging.ts:15` (trình duyệt) và
   `trichPaletteTuRgba` (máy chủ) là **hai bản cài của một quy tắc**. Đã khai trong docstring, chưa
   sửa — `lib/imaging.ts` ngoài vùng ghi. **Chúng chưa được kiểm là ra cùng kết quả trên cùng một
   ảnh** (bản trình duyệt lấy mẫu bằng canvas, bản máy chủ bằng sharp; hai bộ resize khác nhau có
   thể lệch màu biên). Chỉ dám khẳng định *cùng thuật toán*, không dám khẳng định *cùng đầu ra*.
3. **AVIF chưa thử lần nào.** Header parser cố ý không phủ AVIF, để sharp lo. Không có fixture AVIF
   trong test ⇒ đường đó là **suy luận, chưa đo**.
4. **`tags: { contains: tagNguon }` có thể khớp nhầm tiền tố** (`…:abc` là chuỗi con của
   `…:abc123`). Thực tế cuid dài bằng nhau nên không xảy ra — nhưng đây là **lập luận, không phải
   ràng buộc**. Lỗi có sẵn từ trước, tôi không sửa trong phiếu này.
5. **Chỉ đo trên SQLite `dev.db`.** Hành vi index và `findMany` trên DB khác chưa kiểm.
6. **Chưa mở trình duyệt.** Không có khẳng định nào về UI trong báo cáo này; §2.4 là đọc mã.
7. **Phiên đăng nhập của lượt nghiệm thu là JWT ký tay** (cùng thuật toán, cùng secret) chứ không
   phải đăng nhập qua form. Đường form login chưa đi lại trong phiếu này.
8. **`AssetRepresentation` vẫn 0 hàng.** Phiếu không giao, tôi không chạm. Nó đang là bảng rỗng.

## ⑦c · HẠN DÙNG KẾT LUẬN

- **Số kiểm kê (1620 hash · 1 tệp chết · 52 nhóm trùng · 126 hàng 0×0) hết hạn ngay khi có lượt
  upload tiếp theo.** Chạy lại `scripts/backfill-asset-hash.ts` (không cờ) để lấy số tươi — nó là
  bản kiểm kê chạy được, không phải con số chép trong sổ.
- **Hợp đồng "Promote không đòi duyệt" hết hiệu lực ngay khi Hoà duyệt §2.3.** Lúc đó docstring ở
  `lib/server/promote.ts` phải sửa **cùng lượt** — để lại câu cũ là bỏ hoang một văn bản đang điều
  khiển việc.
- **Kết luận DEFER pagination gắn với mô hình lane hiện tại.** Khi một phiếu sở hữu cả API lẫn 14
  consumer thì lý do hoãn biến mất.
- **`--sieu-du-lieu` chưa chạy** ⇒ đừng trích số 126 như thể đó là số cuối cùng.

---

## Tệp đã đụng

| Tệp | Việc |
|---|---|
| `lib/server/asset-metadata.ts` | **MỚI** — cửa trích + cửa dựng bản ghi dùng chung |
| `lib/server/asset-metadata.test.ts` | **MỚI** — 16 assertion, thuần + fixture sharp sinh thật |
| `lib/server/library-save.ts` | đi qua cửa chung; client value tụt xuống đường lùi |
| `lib/server/promote.ts` | trích siêu dữ liệu · dedupe hash · 410 tệp chết · khai hợp đồng duyệt |
| `lib/server/promote.test.ts` | 14 → **22** assertion (fixture riêng, không phá phép đếm cũ) |
| `app/api/project-files/[id]/promote/route.ts` | trả thêm `dungLai` + `meta` |
| `scripts/backfill-asset-hash.ts` | **MỚI** — backfill + kiểm kê, chỉ đọc-tính-điền |

**Chưa commit** (đúng quy ước lane).
