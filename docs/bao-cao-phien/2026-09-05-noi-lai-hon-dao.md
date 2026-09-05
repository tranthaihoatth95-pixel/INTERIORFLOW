# 05 · ASSET — nối lại hòn đảo `lib/idfc-import/`

## 1 · Tổng quan

Bốn module engine nhận diện cấu kiện từ ảnh (`from-photo` · `chuan-net` · `surface-graph` ·
`part-lock` — 64 test, proof ghế Lincoln 327 ngày 14/08) **chưa bao giờ có mặt tiền**; chúng cũng
**chưa bao giờ nối vào nhau**. Lượt này dựng mối nối thuần + một cửa vào thật trong `/library/ingest`,
chạy đầu-cuối trên app thật **0 credit**: nhập ảnh + tệp khối → ra `.idfc` có hình học và cờ tin cậy
→ vào Thư viện → đóng hẳn trình duyệt → vào lại còn nguyên. **Cả năm entry lên bậc 3** (`soi:mat-tien`
bậc 3: 45 → 50).

---

## 2 · Chi tiết

### A · Mạch bị tháo ở đâu — và tháo ở BA mối, không phải một

| Mối | Đo được | Kết luận |
|---|---|---|
| M1 · không ai gọi `importFromPhoto` | 4 nơi import `from-photo.ts`, **toàn `import type`** (chỉ lấy `ProvenanceFlag`) | **CHƯA BAO GIỜ có mặt tiền** |
| M2 · `from-photo` **không nối** `chuan-net` | `grep "chuan-net" lib/idfc-import/from-photo.ts` = **0** | mesh sinh ra **chưa từng** được chuẩn nét |
| M3 · không ai gọi `chuanNet`/`xayDoThiDien`/`buildPartLockFromChuanNet` | nơi nhắc duy nhất là **chú thích** trong `lib/capabilities/image-to-3d.ts` | cụm thứ hai cũng mồ côi |
| M4 (hệ quả) · Thư viện có viewer 3D nhưng nhận món bằng **so khớp TÊN** | `lib/library/object-3d-models.ts` — regex `/lincoln 327/i` → tệp tĩnh trong `public/` | pipeline chạy được cũng **không có chỗ hiện** |

**Từng có rồi bị gỡ, hay chưa bao giờ có? → CHƯA BAO GIỜ CÓ.** Bằng chứng, theo thứ tự sức nặng:

1. **Báo cáo của chính phiên dựng engine tự khai** — `docs/bao-cao-phien/2026-08-14-GI-ghe-3d.md` §8:
   *"Chưa có mặt tiền UI: import từ Thư viện, ProposalSheet duyệt phân loại, viewer GLB chặng 3D —
   **phiếu sau** (đúng phạm vi phiếu này)"*, và §9 liệt kê nó là *"3 việc tiếp"*.
2. **Entry registry ghi cùng nội dung** — `frontier-registry.mjs:165`: *"CÒN CHỜ PHIẾU SAU: mặt tiền
   UI (… + nút import trong Thư viện + viewer GLB chặng 3D)"*.
3. **`lib/capabilities/image-to-3d.ts:23-27`** khai nó vào mục **"MỒ CÔI (có code, 0 nơi gọi ngoài
   test — đo bằng grep 20/08, KHÔNG nối ở lượt này)"** kèm lý do không nối: *"nó ĐÒI `VerifiedSpec`
   … + `FAL_KEY`"*.

🔴 **`git log` KHÔNG trả lời được câu này, phải nói thẳng**: kho trong môi trường tôi là **shallow**
(`git rev-parse --is-shallow-repository` = `true`, cụt tại `388a8932`), lịch sử chỉ 303 commit và
`from-photo.ts` đã tồn tại ngay ở commit gốc. `git log -S"importFromPhoto" --all` chỉ ra 4 commit,
đều **sau** khi tệp đã có. Kết luận ở trên dựa vào **ba văn bản đồng thuận**, không dựa vào git.

### B · Nối vào mặt tiền nào, vì sao, loại cái nào

**Chọn `/library/ingest`** — thêm ô *"Nhận diện cấu kiện"* (`components/library/NhanDienCauKien.tsx`),
đứng đầu trang.

| Ứng viên | Vì sao |
|---|---|
| ✅ **`/library/ingest`** | đã là **cửa nhập tệp** duy nhất của Thư viện · là trang thật tôi sở hữu trọn · dòng chảy khớp bản đồ §5 `Files → cửa xử lý → Thư viện` |
| ❌ tấm `LibrarySheet` | nó là chỗ **DUYỆT và KÉO RA DÙNG**, không phải chỗ nạp; nhét cửa nhập vào đó là trộn hai động tác. Vẫn có phần việc ở đây, nhưng là phần **hiện kết quả** (mục dưới) |
| ❌ route mới `/…/nhan-dien` | rail cụm Xưởng đã 5 mục; thêm một mục cho một cửa nhập là phình điều hướng để giải một việc con |

**Ba tệp mã mới, không viết lại một dòng thuật toán nào:**

| Tệp | Vai |
|---|---|
| `lib/idfc-import/nhan-dien-cau-kien.ts` | **mối nối thuần** — gọi `chuanNet` → `xayDoThiDien` → `buildPartLockFromChuanNet` → `buildIdfcFromPhoto`. Không fs/mạng/DOM |
| `app/api/idfc-import/route.ts` + `_lib/doc-dau-vao.ts` | cửa máy chủ: **hai nhánh một lõi** · ghi ảnh vào `LibraryAsset` (danh tính) + 3 hàng `AssetRepresentation` (biểu diễn) |
| `app/api/idfc-import/tep/[repId]/[ten]/route.ts` | trả tệp dẫn xuất; **đường hai đoạn** để `MTLLoader` phân giải texture tương đối, và đuôi `.obj` thật vì `Object3DWindow.tsx:97` chọn loader bằng `/\.obj(\?|$)/i` |

**0 cột DB mới, 0 migration** — dùng đúng `AssetRepresentation` (schema.prisma:347) vốn được dựng
cho ca này: *"trước bảng này, khối 3D dựng từ ảnh không có chỗ lưu ⇒ mất khi đóng phiên"*.

**Sửa 2 dòng ở `from-photo.ts`** (additive, tuỳ chọn, mặc định giữ nguyên hành vi cũ): `MeshResult.nguon`
và `PhotoClassification.nguon`. Không có chúng thì đường 0-credit buộc phải ghi `fal:…` cho một tệp
người dùng đưa và `vision:…` cho một câu người gõ — **nói dối nguồn**, đúng thứ cờ 3 nấc sinh ra để
chặn. 26 test cũ của `from-photo` vẫn xanh nguyên.

**Đổi `object-3d-models.ts` sang đọc dữ liệu** — đúng đường mà chính tệp đó tự vạch ra:
*"Khi có cấu kiện 3D thứ hai, đường đúng là tag đọc từ `LibraryApiAsset`"*. Nay `object3dModelForItem()`
đọc **dữ liệu trước, tên sau**; bảng tên giữ đúng một dòng cho proof Lincoln (tệp tĩnh, không có hàng DB).

### C · Người dùng thấy đúng câu chữ gì — và cờ 3 nấc hiện ra sao

Ảnh thật: `docs/delivery/anh-duyet-mat/hon-dao/lo1-cua-nhan-dien.png`

- Tiêu đề **“Nhận diện cấu kiện”** · phụ đề *“Máy tháo khối thành cấu kiện có tên, kèm mức tin cậy từng số.”*
- Hai ô nạp: *“Ảnh của món (bắt buộc)”* · *“Tệp khối 3D (.glb) — có thì chạy không tốn lượt”*
- Ô nguồn: *“Nguồn số đo — trang hãng hoặc hồ sơ đã tra”*, dưới nó:
  *“Ba số trên sẽ mang mức **Đã xác minh** — nên phải nói rõ tra ở đâu.”*
- Hai nút: **“Nhận diện từ tệp khối”** · **“Dựng khối từ ảnh”**, kèm dòng giá:
  *“Đọc tệp khối: không tốn lượt · Dựng từ ảnh: tốn 6 lượt”*
- **Nút chưa chạy được thì MỜ KÈM LÝ DO**, không phải bấm vào mới báo:
  *“Chưa dựng khối từ ảnh được — máy chủ thiếu NVIDIA_API_KEY và FAL_KEY. Dùng tệp khối 3D có sẵn thì chạy ngay.”*
  Đi qua `aria-disabled` + `aria-describedby` + token `--mo-vo-hieu` (không dùng `title`: câm trên
  cảm ứng, Tab bỏ qua nút `disabled`).

**Cờ 3 nấc — bảng TỪNG TRƯỜNG, không hiện đồng loạt:**

| Nấc | Nhãn chữ | Hình dạng | Màu |
|---|---|---|---|
| `verified` | **Đã xác minh** | ◆ | `--success` |
| `measured` | **Đo được** | ■ | `--accent` |
| `inferred` | **Máy suy** | ▲ | `--warning` |

Ba kênh (chữ · hình · màu) — **màu không phải kênh duy nhất**. Rê vào hàng hiện nguồn cụ thể
(`https://…` cho số hãng · `tệp người dùng đưa: lincoln.glb` cho mesh). Kèm khối **“Máy khai thật chỗ
chưa chắc”** in nguyên văn ghi chú của engine (5 dòng trong lần chạy thật), không lọc bớt cho đẹp.

### D · Chuỗi đầu-cuối — số thật

`scripts/nghiem-thu-ban-lam-viec/hon-dao-idfc-song-sot.mjs` · **18 pass · 0 fail · 0 lỗi hạ tầng**

**Nhánh đã đo: `khoi` — TẤT ĐỊNH, 0 CREDIT, 0 gọi mạng.**

| Khẳng định | Số thật |
|---|---|
| ⓪ hiệu chuẩn — số “đã xác minh” không nguồn ⇒ TỪ CHỐI | http **400** |
| ra `.idfc` + hình học | **11.215 → 11.023** tam giác · **3** biểu diễn |
| cấu kiện có tên nghề | **79/79** đặt tên |
| tiêu lượt | **0** |
| số hãng | `verified`, nguồn = URL đã khai |
| hình khối | `inferred`, nguồn = `tệp người dùng đưa: lincoln.glb` (**không** tiền tố `fal:`) |
| **sau khi ĐÓNG HẲN trình duyệt** — món còn trong kho | ✅ |
| 3 cách thể hiện còn sống | `lod · model3d · spec` |
| tải lại được hình học `.obj` | **671.741 byte** |
| `.idfc` còn nguyên cờ | `w=580mm`, `verified` |
| trang tổng bày món và **đếm nó là Mô hình 3D** | **2 ô** xem trước |

⭐ **Phép đo hai thế giới** (`lat-co-mo3d.mjs`): gỡ cờ `mo3d:` ⇒ **2 → 1 ô**; cắm lại ⇒ **1 → 2 ô**.
Không có bước này thì con số “2” có thể đến từ bất cứ đâu.

**Mẫu 0-credit lấy ở đâu**: không có `FAL_KEY`/`NVIDIA_API_KEY` trong môi trường ⇒ **không sinh được
mesh mới và không được phép tiêu credit**. Dựng GLB thật bằng cách đổi ngược tệp proof sẵn có trong
repo (`public/library-assets/lincoln-327/lincoln-327-chuannet.obj`) — script `obj-sang-glb.mjs`.

### E · Bốn entry có lên bậc 3 không — CÓ, cả năm

`node scripts/soi-mat-tien.mjs`

| | trước | sau |
|---|---|---|
| bậc 0 | 3 | **1** |
| bậc 2 | 4 | **1** |
| bậc 3 | 45 | **50** |

Năm entry của hòn đảo — `import-ghe-tu-hinh` · `chuan-net-3d` · `part-lock-cau-kien` ·
`wireframe-dinh-bien-dien` · `mirror-doi-xung-chuan-net` — **đều lên bậc 3**. Hai mục còn lại
(`home-dong-studio`, `home-overview-card`) thuộc lane khác, tôi bị cấm ghi.

🔧 **Một lần tự sửa giữa đường, đáng ghi**: lượt đo đầu, bốn entry lên bậc 3 nhưng `importFromPhoto`
vẫn **bậc 0** — vì route tôi tự xâu lại `classifyPhoto` + `generateMesh`. Đó là **chép một trình tự
đã có 26 test sang chỗ không ai kiểm**. Sửa thành gọi thẳng `importFromPhoto`; entry lên bậc 3, và
route bớt 3 dòng tự xâu.

`soi:cam-dien`: mục **“frontier ✅ nhưng CHƯA CẮM ĐIỆN”** nay **0**.

### F · Hiệu chuẩn

| Chỗ | Phép đối chứng | Kết quả |
|---|---|---|
| lõi thuần | GLB sai magic ⇒ phải NÉM · `hMm = 0` ⇒ phải NÉM | 2/2 đỏ đúng lúc |
| cửa máy chủ | hồ sơ thiếu nguồn số đo ⇒ phải 400 | 400 |
| con trỏ 3D | gỡ cờ ⇒ **2 → 1**, cắm lại ⇒ **1 → 2** | hai thế giới **rẽ hai hướng** |
| đường cũ | không khai `nguon` ⇒ vẫn ghi `fal:fal-ai/trellis#r1` + `vision:llama-x` | giữ nguyên hành vi |

Một **FAIL thật** trong lượt đầu và cách xử: *“mở Thư viện thấy tên món”* trượt. Đo ra trang tổng bày
món bằng **ô xem trước** (`<img alt="tên món">`), **không in tên thành chữ** — tức **khẳng định của
tôi sai chỗ**, không phải tính năng hỏng. Sửa phép đo (và thay bằng phép đo mạnh hơn: hai thế giới),
**không** sửa sản phẩm cho vừa phép đo.

---

## 3 · Tổng kết

Hòn đảo không hỏng và cũng không bị ai gỡ dây — **nó chưa bao giờ được nối**, và tháo ở ba mối chứ
không một: engine không có mặt tiền · hai cụm engine không biết nhau · Thư viện chỉ nhận món 3D qua
một bảng tên gõ cứng cho đúng MỘT proof. Ba mối nay nối bằng ~200 dòng keo + một cửa vào, **không
viết lại một dòng thuật toán nào**. Nhánh tốn tiền được khai thẳng là chưa chạy được và mờ kèm lý do,
thay vì giả vờ.

---

## 4 · Đánh giá khách quan

**Được**
- Chuỗi đầu-cuối chạy trên app thật, sống sót qua lần đóng-mở trình duyệt, đọc từ nơi lưu thật.
- 0 cột DB mới, 0 migration, 0 credit.
- Cờ 3 nấc là thông tin nghề thật: người dùng phân biệt được số tra-được ↔ số máy-đoán.
- Máy soi bậc 3: 45 → 50, không entry nào phải sửa (tôi bị cấm ghi registry, và không cần).

**Chưa được — nói thẳng**
- 🔴 **Nhánh `anh` CHƯA CHẠY THẬT MỘT LẦN NÀO.** Không có khoá, và tiêu credit thì phiếu cấm. Đường
  mã có, `tsc` xanh, nhưng **chưa có byte nào đi qua nó**. Đây là phần yếu nhất của lượt này.
- 🟡 Mesh mẫu là bản **đã chuẩn nét một lần** (đổi ngược từ `.obj` proof), không phải mesh TRELLIS
  thô ⇒ bước chuẩn nét chỉ tách được **1 mảnh tham số / 3**, và ra **79 cấu kiện** thay vì con số của
  ca gốc. Nó chứng minh **dây chuyền chạy trên hình học thật**, KHÔNG chứng minh **chất lượng nhận
  diện trên đầu vào thô**.
- 🟡 Ô mới dùng token, còn trang `/library/ingest` quanh nó là mã cũ hex gõ tay ⇒ có **lệch thị giác
  thấy được**. Hướng của tôi đúng luật, nhưng delta này cần mắt.
- 🟡 `.idfc` sinh ở nhánh `anh` sẽ được `importFromPhoto` dựng một lần rồi bị bỏ (bản ship là bản đã
  chuẩn nét). Lãng phí vài mili-giây, đổi lại không chép trình tự. Nêu ra để ai đọc mã không tưởng là lỗi.
- 🟡 Cửa mới chưa xuất hiện ở **tấm** Thư viện (`LibrarySheet`) — chỉ ở trang nhập. Món thì hiện đủ ở
  cả hai.
- ⚠️ **Tôi lệch một ranh giới sở hữu**: `app/api/idfc-import/**` **không** nằm trong danh sách ĐƯỢC GHI
  (cũng không nằm trong CẤM GHI). Không có đường máy chủ thì không có cách nào lưu byte, mà thư mục này
  hoàn toàn mới nên **0 khả năng va lane khác**. Khai ra thay vì lách.
- ⚠️ **Suýt đụng lane khác**: tôi chạy `pkill -f "next-server"` để tắt server của mình — mẫu quá rộng.
  Đã kiểm lại: **3109 vẫn sống, trả 200**. Không thiệt hại, nhưng lần sau chỉ được giết theo cổng.

---

## 5 · Hai hướng đi tiếp

**Hướng A — chạy thật nhánh `anh` một lần, có khoá.** Được: đóng chỗ yếu nhất; đo được chất lượng
nhận diện trên mesh TRELLIS thô (đúng ca engine sinh ra để làm). Mất: tốn ~6 lượt/lần, cần Hoà cấp
khoá, và kết quả có thể lộ thêm việc (mesh thô có bóng sàn nướng vào).

**Hướng B — bày kết quả sâu hơn ở tấm Thư viện + cửa duyệt nâng `verified`.** Được: đóng nốt vòng
human-in-loop (`PATCH /api/asset-representation/[id]` đã có sẵn, chưa ai gọi — đúng một hòn đảo nhỏ
khác). Mất: không chạm được chỗ yếu nhất; nhánh `anh` vẫn là đường chưa ai đi.

---

## 6 · Đề xuất

**Làm A trước.** Lý do: mọi thứ khác trong lượt này đã có bằng chứng chạy thật, **trừ đúng nhánh
`anh`** — và đó lại là nhánh mang giá trị đặc trưng (*"KTS chụp một ảnh là có cấu kiện"*). Một lần
chạy ~6 lượt đổi lấy việc biết chắc đường đó sống hay chết là rẻ; để lâu thì nó thành **hòn đảo mới**,
đúng bệnh lượt này vừa chữa. B là việc thật nhưng nằm trên nền đã có bằng chứng, hoãn được.

---

## ⑦b · CHƯA CHẮC / CHƯA KIỂM

- **Nhánh `anh` chưa chạy một lần nào** — không có `NVIDIA_API_KEY`/`FAL_KEY`; `importFromPhoto`,
  `fetch` mesh, và nhánh 503 mới **chỉ được `tsc` kiểm, chưa có dữ liệu thật đi qua**.
- **Chỉ đo Chromium 1194 headless, 1440×900**, theme mặc định. Safari/Firefox, theme sáng, cảm ứng,
  trình đọc màn hình: **chưa thử**.
- **Chưa xem `.obj` sinh ra bằng MẮT trong `Object3DWindow`** — chỉ chứng minh **tải về được và đúng
  cú pháp** (`/^v\s/m`). Hình có đúng dáng hay không: **chưa biết**.
- **`MTLLoader` phân giải texture tương đối: LÝ THUYẾT**, suy từ mã đường dẫn hai đoạn, **chưa mở
  viewer để xác nhận**. Nếu sai, hậu quả là mất vật liệu, không phải mất hình.
- Chuỗi *"từng có mặt tiền rồi bị gỡ?"* trả lời bằng **ba văn bản đồng thuận**, **không bằng git** —
  kho shallow, không truy được trước `388a8932`.
- Số **79 cấu kiện** là của mesh ĐÃ chuẩn nét, **không so sánh được** với con số ca gốc 14/08.
- So `soi:thao-tac` trước/sau: tôi **grep tệp mình viết** (0 vi phạm) chứ **không** đo được cây sạch
  trước thay đổi (cấm `git stash`). Con số 186+45 giống nhau ở hai lần đọc **sau** thay đổi.
- `--on-accent` thay `'#fff'`: sửa vì **đúng luật**, không phải vì máy bắt — máy soi `cam-hex-inline`
  **không bắt hex trong nhánh ba ngôi**. Lọt máy ≠ đúng luật; đây là lỗ của máy, chưa vá (không được
  ghi `scripts/soi-*`).
- Chưa đo hiệu năng: mesh 40MB (trần) đi qua base64 + bốn bước thuần **có thể chặn event loop** của
  route. Mesh 1,6MB thật thì không thấy chậm.

## ⑦c · HẠN DÙNG KẾT LUẬN

- **Bậc 3 của năm entry** hết hiệu lực nếu ai gỡ `/library/ingest` hoặc gỡ ô khỏi trang — soi đo bằng
  **đồ thị import từ gốc route**, không đo *"bấm vào có việc xảy ra"*.
- **`REPRESENTATION_DB_KIND.lod`** đang mượn để chứa cây cấu kiện. Khi có kind đúng nghĩa hơn thì
  phải chuyển, và **những hàng đã ghi sẽ mang kind cũ**.
- **Con trỏ `mo3d:` sống trong `tags`** — chuỗi tự do. Ai ghi đè `tags` mà không giữ tag này là món
  **âm thầm mất khối 3D**, không lỗi, không cảnh báo. Đây là cái giá của việc không thêm cột DB.
- Bảng tên trong `object-3d-models.ts` còn đúng **chừng nào tệp tĩnh `public/library-assets/lincoln-327/`
  còn nằm đó**.
- Trần **40MB** cho GLB là con số tôi chọn (mesh thật 1,6MB), **không phải số đo**.
