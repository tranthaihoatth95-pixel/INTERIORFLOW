# 05/09 · ĐẾM DÂY CHƯA CẮM — "năng lực này có mặt tiền nào gọi tới không?"

Lượt **ĐẾM**, không vá. Máy để lại: `npm run soi:mat-tien` (`scripts/soi-mat-tien.mjs`).

---

## ⓪ TIỀN ĐỀ — phiếu sai BA CHỖ, cả ba nói thẳng trước khi đi tiếp

### ⓪b Mốc
`f43de304`, lệch **245** commit sau `origin/integration/2026-09-04`, cây sạch,
`merge-base --is-ancestor` rc=0 ⇒ `git merge --ff-only` → `1b11587c`. **Mười sáu trên mười sáu**
lô cắt lệch: con số đó nay là quy luật, không phải tai nạn.

### ⓪-1 🔴 Hai trong sáu ca của bảng phiếu ĐÃ ĐƯỢC SỬA — bảng là ảnh chụp trước 245 commit
| Ca phiếu nêu | Đo lại 05/09 |
|---|---|
| `replaceMaterialReferences` — **0 nơi gọi** | **SAI rồi** — gọi thật ở `lib/cad/store.ts:896`, import `:27` |
| `⌘J` Vitals — đăng ký ở component không mount | **SAI rồi** — `VitalsAperture.tsx:70` → `AppChrome.tsx:39,388` (sống) |

Không phải bắt bẻ: nếu tôi nhận bảng làm sự thật thì lượt này đã đi cắm lại hai thứ đã cắm — đúng
tội N8. **Số chép lại không phải phép đo** (cùng bài học 04/09 mục "migrations tụt sau schema").

### ⓪-2 🔴🔴 Câu *"không cổng nào trong repo đang hỏi câu này"* — **SAI, và đây là chỗ nặng nhất**
Repo đã có **hai** máy hỏi gần đúng câu đó, cả hai tôi đọc mã trước khi viết dòng nào:

| Máy | Hỏi gì | Chiều |
|---|---|---|
| `scripts/soi-cam-dien.mjs` | *"engine này đã tới tay người dùng chưa?"* | từ `lib/` **ngược lên** |
| `scripts/soi-cong-cu-chet.mjs` | *"nút này có ai mount không, phím này có ai nghe không?"* | từ mặt **xuống** |

`soi-cong-cu-chet` docstring còn **kể đúng ca `⌘J`** mà phiếu đưa cho tôi như một phát hiện mới.
⇒ Theo NO-REBUILD §B25 tôi **không được** khai đây là chiều đo mới. Nó là **EXTEND**, và phần
thật sự thêm được đo ở §2 dưới — không phải "một chiều đo còn thiếu".

### ⓪-3 Phần thêm là THẬT, và đo được
`soi-cam-dien` chấm ở **cấp thư mục `lib/<tên>`**. Nó in:

```
🟢 lib/idfc-import   4677 dòng · ui=3 lib=4 …        ← đọc là SỐNG
⚡ 0 frontier chưa cắm điện                           ← đọc là SẠCH
```

Nhưng ở **cấp ký hiệu**, trong chính thư mục đó: `chuanNet` · `mirrorCompleteShapes` ·
`buildPartLockFromChuanNet` · `importFromPhoto` **không nơi nào ngoài đảo gọi tới** — bốn entry
frontier. Thư mục sống vì `asset-family.ts`/`license-gate.ts` được API route dùng; **độ hạt thư mục
che mất hòn đảo bên trong**. Đó là lý do máy này đáng tồn tại, và là ranh giới của nó.

---

## 1 · CON SỐ — sản phẩm của lượt này

`frontier-registry`: **134 entry** · `xong` **77** + `xong-mat` **1** = **78** đem chấm.

| | | |
|---|---|---|
| **bậc 0** | không ai import, không ai dùng | **3** |
| **bậc 1** | có import, không dùng trong thân | **0** |
| **bậc 2** | có dùng, **mọi nơi dùng đều chết** | **4** |
| **bậc 3** | dùng từ tệp SỐNG — có mặt tiền | **45** |
| — | **chấm được** | **52** |
| n/a | bằng chứng không nằm ở mã sản phẩm | **26** |

**7/52 = 13,5% việc sổ khai XONG không tới được người dùng.** Sáu trong bảy mang vai **⭐MVP**.

### Danh sách bậc 0/1/2 — `tệp:dòng`, đã xác minh tay từng mục

| entry | vai | bậc | ký hiệu · nơi khai | vì sao |
|---|---|---|---|---|
| `home-dong-studio` | mvp | **0** | `DongStudioHome` — `components/home/DongStudioHome.tsx:1` | **0 tệp import**. `HomeScreen.tsx:57` tự khai: *"GIỮ LẠI trong cây làm bằng chứng vòng thăm dò — không xoá, không mount"*. Home nay là `XuongHome` (`HomeScreen.tsx:58,630`) |
| `import-ghe-tu-hinh` | mvp | **0** | `importFromPhoto` — `lib/idfc-import/from-photo.ts:2` | tệp có 4 nơi import nhưng **toàn `import type`** (`ProvenanceFlag`). Bản thân hàm: 0 nơi gọi |
| `part-lock-cau-kien` | mvp | **0** | `buildPartLockFromChuanNet` — `lib/idfc-import/part-lock.ts:163` | grep toàn repo **1 hit = chính dòng khai** |
| `home-overview-card` | do | **2** | `ProjectOverviewCard` — `components/home/ProjectOverviewCard.tsx` | dùng ở `components/ProjectSelect.tsx` — mà `ProjectSelect` chỉ được `DongStudioHome.tsx:46` import, tức **người dùng nó cũng chết**. Chuỗi ba tầng cùng chết |
| `chuan-net-3d` | mvp | **2** | `chuanNetGeometry`, `chuanNet` — `lib/idfc-import/chuan-net.ts` | `chuan-net.ts` **0 tệp import**; chỉ tự gọi trong mình |
| `wireframe-dinh-bien-dien` | mvp | **2** | `lib/idfc-import/surface-graph.ts` | chỉ `part-lock.ts:43` import — mà `part-lock.ts` là **bậc 0** |
| `mirror-doi-xung-chuan-net` | mvp | **2** | `mirrorCompleteShapes` — `lib/idfc-import/chuan-net.ts:435` | tự gọi ở `:1072`, trong một tệp không ai với tới |

**Năm trong bảy là MỘT hòn đảo duy nhất**: `chuan-net.ts` ↔ `part-lock.ts` ↔ `surface-graph.ts`
↔ `from-photo.ts`. Không phải bảy lỗi rời — là **một mạch bị tháo**.

### 26 entry không chấm được — và bốn trong đó là bằng chứng RỖNG
| nhóm | số | |
|---|---|---|
| bằng chứng ở `docs/`·`scripts/`·`prisma/` | 16 | đúng bản chất, không phải năng lực mã sản phẩm |
| bằng chứng **nghịch** (`can:false`) hoặc token CSS | 6 | `library-data-that` · `fm-data-that` · `tool-state-3d` · `tu-dien-mocks-sach` · `hinh-hoc-ap-thang` · `mat-do-con-tro` |
| ⚠️ **bằng chứng CHỈ SỐNG TRONG CHÚ THÍCH** | **4** | `scaffolder` · `hatch-t-junction-cay-lai` · `present-magic-cua-vao` · `editor-bang-bieu-mau` |

Nhóm cuối: xoá sạch mã, giữ docstring ⇒ `soi-frontier` **vẫn xanh**.
🔧 **Không phải phát hiện của tôi** — `soi:frontier` đã tự in dòng *"bằng chứng MẤT khi bóc chú
thích"* nêu 6 entry. Hai danh sách lệch nhau vì tôi chỉ soi `app/`+`components/`+`lib/`. Ghi ra để
không ai đếm hai lần cùng một thứ.

---

## 2 · ĐỊNH NGHĨA "CÓ MẶT TIỀN" — và bậc 2 bắt bằng cách nào

**Không phải "có ai import"** (import rồi để đó là dây chết), **không tính tệp `.test.`**,
**không tính tên nằm trong chú thích hay trong chuỗi**.

Với ký hiệu `S` khai ở tệp `D`:
- **dùng** = `S` xuất hiện trong thân một tệp `P` **và** `P` thật sự kéo `S` vào (import tĩnh
  *hoặc* `const {S} = await import(...)`). `P` có thể **là chính `D`** — hàm tự gọi trong tệp mình
  rồi đi ra qua một hàm bọc vẫn là một nơi gọi.
- **SỐNG** = `P` với tới được bằng đồ thị import từ một **gốc route**: `app/**/{page,layout,route,
  error,not-found,loading,template,default}.{ts,tsx}` + `middleware.ts` — đo được **111 gốc**,
  **940/1030 tệp sống**, **90 tệp không với tới được**.

| bậc | điều kiện |
|---|---|
| 0 | không ai import, không ai dùng |
| 1 | có import, thân không dùng |
| 2 | có dùng — nhưng **không nơi dùng nào SỐNG** |
| 3 | có ít nhất một nơi dùng SỐNG |

**Bậc 2 bắt bằng đồ thị với-tới, không bằng đếm caller.** Đếm caller là thứ `soi-contract` đã làm
và là thứ để lọt ca `⌘J`: `VitalsGesturePanel` lúc đó **có** caller (`StageSwitcher.tsx:446`) —
caller ấy chỉ không còn ai mount. Đếm thì thấy 1, với-tới thì thấy 0. Đó là toàn bộ khác biệt.

---

## 3 · CA ĐÁNG CẮM NHẤT — xếp hạng, không liệt kê đều tay

**① `lib/idfc-import` — hòn đảo 4 entry MVP.** Đáng nhất và bỏ xa phần còn lại. Một lần nối là
**bốn** entry rời bậc 0/2, và bốn entry ấy là chuỗi *ảnh sản phẩm → `.idfc` dựng lại được* — đúng
thứ Hoà gọi là hào của IF. Nó **không** hỏng: 64 test xanh, có proof thật (ghế Lincoln). Chỉ thiếu
đúng một mặt tiền gọi `importFromPhoto`. **Rẻ nhất trên mỗi entry cứu được.**
⚠️ Nhưng phải nói kèm: `soi-cam-dien` đã ghi hòn đảo này từ **17/08**
(`docs/nc/DO-ENGINE-7-MANH-2026-08-17.md`). Nó nằm im **19 ngày**. Nếu 19 ngày không ai cắm thì
việc thiếu ở đây **không phải thiếu máy soi** — máy soi đã kêu rồi. Cắm hay bỏ là quyết định xếp
ưu tiên, và đó là việc của IF COMMAND, không phải của tôi.

**② `home-dong-studio` + `home-overview-card` — KHÔNG cắm, nên XOÁ.** Đây là ca ngược. `HomeScreen.tsx:57`
đã khai rõ là **cố ý giữ làm bằng chứng vòng thăm dò**, và D-DR2 (04/09) chốt Home đi hướng
`XuongHome`. Cắm lại là **hồi sinh một hướng đã bị đè** — cấm bởi `LEGACY-DESIGN-QUARANTINE`.
Việc đúng là hạ trạng thái entry trong registry, không phải nối dây. **Đây là lý do lượt này không
vá:** hai trong bảy ca mà "sửa" nghĩa là **xoá**, không phải nối.

**③ Bốn entry bằng chứng-chỉ-trong-chú-thích.** Rẻ, nhưng là việc của registry chứ không phải của
sản phẩm — sửa `mau` cho trỏ vào mã thật. Không có gì tới tay người dùng thêm.

**Không có ca nào "cắm chỉ một dòng hiển nhiên"** ⇒ ngoại lệ của phiếu **không kích hoạt**. Lượt
này **0 dòng mã sản phẩm bị sửa**.

---

## 4 · HIỆU CHUẨN — máy có biết ĐỎ không

Máy có cờ `--ky-hieu <Tên>@<tệp>` + `--thu-go <tệp>`: **cùng một ký hiệu, hai thế giới**.
`--thu-go` tự in xác nhận đã bỏ được tệp (và số tệp quét tụt 1030 → 1029), nên không thể "bẻ trượt".

| phép | thế giới | kết quả |
|---|---|---|
| `resolveIdfcCommerceToSpec` | thật (đã cắm 05/09) | **bậc 3** — dùng ở `lib/library/idfc-noi-kho.ts` |
| — nt — | `--thu-go lib/library/idfc-noi-kho.ts` | **bậc 0** — 0 import, 0 dùng |
| `VitalsGesturePanel` | thật | **bậc 3** — dùng ở `VitalsAperture.tsx`, tệp SỐNG |
| — nt — | `--thu-go components/studio/AppChrome.tsx` | **bậc 2** — *vẫn* import, *vẫn* dùng, **nơi dùng hết sống** |

Phép thứ hai là phép quan trọng: nó dựng lại **đúng hình dạng ca `⌘J`** và máy chấm đúng **bậc 2**,
không phải 0 và không phải 3.
**Không thoái hoá**: 45/52 chấm bậc 3 ⇒ máy không đỏ ở mọi thế giới.

### Bốn vòng máy tự báo đỏ oan, đều đã vá và ghi lý do tại chỗ trong mã
| vòng | báo oan | gốc |
|---|---|---|
| 1 | 7 entry | kiểu `*Props` bị đếm như năng lực (`LightArcProps`, `PanelFlankProps`…) |
| 2 | (cùng vòng) | mẫu trượt `export default function X` ⇒ `LightArc`/`PanelFlank` rơi bậc 0 oan |
| 3 | 3 entry | hàm **tự gọi trong chính tệp khai** bị bỏ (`labelInRoomBounds:535` · `extractImagesWithBbox:924` · `mirrorCompleteShapes:1072`) |
| 4 | 1 entry | `pdfToDeck` — kéo vào bằng **import ĐỘNG** `const {…} = await import()` (`Toolbar.tsx:289`), gọi thật ở `:340` |

Vòng 4 là do **chính bản vá của tôi ở vòng 3** sinh ra (siết "dùng phải có import" để giết ca
`chuanNet` là tên tham số ở `part-lock.ts:163`). Siết một đầu thì hở đầu kia — đã đo, đã vá.

**Báo nhầm ĐỎ cuối cùng: 0/7** — cả bảy xác minh tay bằng `grep` + đọc mã, chứng cứ ở bảng §1.

---

## 5 · ⑦b CHƯA CHẮC — con số là SÀN hay TRẦN

**Bậc 0/1/2 (=7) là SÀN.** Máy chỉ soi năng lực **có entry registry**. Năng lực không ai khai thì
vô hình — và phiếu tự nêu hai ca như thế (`tầng vật liệu hạt giống`, `congThucKe`) mà registry
không có dòng nào.

**Bậc 3 (=45) là TRẦN, và đây là chiều máy YẾU NHẤT — đo được, không phải lo xa:**
- `congThucKe` (`lib/library/hat-giong-3d.ts:101`) máy chấm **bậc 3** vì gọi từ tệp SỐNG
  (`:162`, trong `cauKienHatGiongTrenKe` ← `LibrarySheet.tsx:35`). **Nhưng** giá trị nó sinh
  (`geom3d.recipe`) không tệp nào đưa vào `evalRecipe` — `evalRecipe` chỉ có **một** caller,
  `Command3DPanel.tsx:55`, và caller đó ăn `entity?.recipe` của scene, không ăn `.idfc` thư viện.
  ⇒ **hàm có người gọi mà KẾT QUẢ không ai tiêu thụ.** Đó là **chiều đo thứ ba (dòng chảy dữ
  liệu)**, máy này không đo, `soi-cam-dien` cũng không.
- Cùng loại: tệp được import nhưng nhánh render không bao giờ chạy ⇒ **ca "cửa tạo dự án mất tay
  nắm" máy này KHÔNG bắt được.** Phiếu liệt ca đó vào danh sách máy nên bắt — **nó nằm ngoài tầm**.

**Mù kỹ thuật còn lại, chưa vá:**
- `import { x as y }` rồi thân dùng `y` ⇒ đọc thành **bậc 1** (báo đỏ oan). Chưa quét xem có ca thật.
- Ký hiệu chỉ dùng trong `${...}` của template literal ⇒ bị strip cùng chuỗi, bỏ sót.
- Gốc route bỏ `electron/main.js` (không phải `.ts`) và mọi đường vào không qua App Router.
- `--json` **không parse lại được** (registry có ký tự làm hỏng chuỗi JSON ở byte ~65k) — dùng
  `--json > file` rồi đọc từ tệp; đã dùng cách đó cho bảng §1.
- Chưa mở app thật dòng nào. Mọi kết luận là **đọc mã + đồ thị import tĩnh**.

---

## 6 · ⑦c HẠN DÙNG KẾT LUẬN
- Con số **7/52** hết hạn **ngay khi có commit đụng `app/`·`components/`·`lib/`** hoặc đụng
  `frontier-registry.mjs`. Chạy lại `npm run soi:mat-tien`, đừng chép số này.
- Chẩn *"`lib/idfc-import` là hòn đảo"* hết hạn khi có mặt tiền gọi `importFromPhoto`.
- Chẩn *"`DongStudioHome` nên xoá không nên cắm"* phụ thuộc D-DR2 còn hiệu lực; D-DR2 bị đè thì
  đọc lại.
- Bốn entry bằng-chứng-trong-chú-thích hết hạn khi ai đó sửa `mau` — số 4 sẽ đổi.

---

## ④ VERIFY — tách lệnh, đọc rc riêng
| | |
|---|---|
| `npx tsc --noEmit` | rc=0 |
| `npm test` | rc=0 · **10200 khẳng định pass, 0 fail** |
| `node scripts/nghiem-thu-g4-moat.mjs` | rc=0 · **66/66** ✔ mốc |
| `soi:frontier` | rc=0 · 🔴 **0 LỆCH** |
| `soi:hinh-hoc` | rc=0 · **51** ngoài thang ✔ mốc |
| `soi:tu-dien` | rc=0 · **322** chữ trần ✔ mốc |
| `soi:contract` | rc=0 · 0 LỆCH |
| `soi:cam-dien` · `soi:cong-cu-chet` | rc=0 |
| `soi:thao-tac` | **rc=1 · 2 LỆCH — nợ cũ, không phải hồi quy** (MAIN xác minh tại `1ebce8ac`) |
| `soi:mat-tien` (mới) | rc=0 — máy ĐẾM, cố ý không chặn |
| `git status --short` | chỉ 2 đường đã khai |
| CSDL repo chính | User 1 · Project 4 · Flow 5 · Member 3 · File 2 ✔ mốc |

**Đã ghi**: `scripts/soi-mat-tien.mjs` (mới) · `package.json` (+1 dòng `soi:mat-tien`) ·
tệp báo cáo này. `git check-ignore` rc=1 từng tệp. **0 dòng trong `lib/`·`components/`·`app/`** —
đúng ranh giới lane vòng-focus đang giữ.
