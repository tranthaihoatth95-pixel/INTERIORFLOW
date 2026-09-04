# G4 · DESIGN TRUTH / MOAT — lát cắt nghiệm thu bằng HÀNH VI

> **Luật của cổng này:** *"Nếu moat chỉ tồn tại dưới dạng type/interface/tài liệu mà người dùng
> KHÔNG trải nghiệm được hiệu ứng của nó ⇒ CHƯA HOÀN THÀNH."*
>
> **Kết quả một dòng: 49/54 khẳng định ĐẠT. Chuỗi đi được tới cuối. Ba chỗ đứt, đã định vị tới
> tệp:dòng. Mắt ĐÓNG/TẢI LẠI — thứ cả dự án chưa từng chứng minh — nay CÓ BẰNG CHỨNG.**

| | |
|---|---|
| Bộ nghiệm thu | `scripts/nghiem-thu-g4-moat.mjs` (tự hiệu chuẩn) |
| Máy canh thường trực | `lib/cad/moat-chuoi.test.ts` — 24 khẳng định, vào `npm test` |
| Bằng chứng chạy | `docs/delivery/anh-duyet-mat/g4-moat/nghiem-thu-g4-moat.txt` |
| Ngày đo | 04/09/2026 · mốc `fc69d747` |

---

## 0 · Cách đo — và vì sao KHÔNG lái trình duyệt

Sự thật của IF **không nằm trên màn**. `Doc` sống trong bộ nhớ client rồi vào IndexedDB
(`lib/sheets-persist.ts`), BOQ tính THUẦN từ `Doc`, `.idf`/`.idfc` là JSON. Màn hình nói *"vẫn
còn"* không chứng minh được gì — bản vẽ có thể đang nằm thuần trong bộ nhớ và bay mất khi đóng
tab. Bộ này đo **đúng chỗ sự thật nằm**, và đo mắt ĐÓNG/TẢI LẠI bằng **chính bộ tuần tự hoá mà
app dùng**, không bộ mô phỏng nào:

* `exportIdf`/`importIdf` — tệp dự án `.idf`
* vòng `JSON.parse(JSON.stringify(...))` — đúng phép mà `sheets-persist` áp trước khi ghi IndexedDB
* `exportIdfc`/`importIdfc` — một cấu kiện rời trong kho studio

Mọi hàm trong chuỗi là **hàm sản xuất thật**: `resolveLibraryItem` · `docToObjScene` ·
`evalRecipe` · `computeBoq` · `computeBoqCached` · `getMaterial` · `baMatCuaVatLieu` ·
`inspectMaterialImpact` · `replaceMaterialReferences` · `buildBoqAppendixSlides` ·
`isBoqAppendixStale`.

### Hiệu chuẩn — bộ này CÓ đỏ được

Chế độ `--hieu-chuan` dựng một thế giới **biết chắc hỏng**: cấp cho mỗi nhóm 3D một mã riêng
(đúng bệnh *"mỗi bề mặt một danh tính riêng"*), rồi chạy **chính bộ khẳng định đó** lên nó.
Kết quả: **4 khẳng định ở K3 chuyển ĐỎ** (`mã lạ=3` · `vật liệu lạ=2` · `0/3 entity tìm lại được`
· `0/3 vật liệu tới 3D`). Gỡ cờ ra thì chúng xanh lại. ⇒ Bộ này **không phải máy in chữ PASS**.

---

## 1 · Chuỗi đi tới đâu — bảng khâu

| Khâu | Nội dung | Kết |
|---|---|---|
| K1 | Thư viện → đặt vào 2D (đường `LibraryDropBridge` nhánh `blockdef`) | ✅ 8/8 |
| K2 | Định danh ngữ nghĩa — `elementType` · `storey` · cờ suy đoán | ✅ 3/3 |
| K3 | 2D → 3D — cùng một mã hay mỗi nơi một mã | 🔴 **3/5** |
| K4 | `BuildRecipe` — ngăn xếp không phá huỷ | ✅ 3/3 |
| K5 | Một mã vật liệu → ba mặt (2D · 3D · Trình bày) | ✅ 3/3 |
| K6 | BOQ đọc CÙNG `Doc`, CÙNG `specId` | ✅ 5/5 |
| K7 | Trình chiếu neo vào vân tay `Doc` | ✅ 3/3 |
| K8 | Đổi thượng nguồn → xuôi dòng + NGƯỜI quyết | 🔴 **6/7** |
| K9 | LƯU → ĐÓNG → MỞ LẠI (ba đường lưu thật) | 🔴 **15/17** |

Vật đại diện: **1 sofa** (`furniture`, `SOFA-3S` → `BLOCKS.sofa3`) · **1 tủ áo** (`WRD-240` →
`BLOCKS.wardrobe`, khớp gần đúng — resolver tự khai `approximate:true`) · **1 mặt sàn gỗ**
(`HatchEntity` `elementType:'slab'`, 5000×4000mm, `specId='ps-go-soi'`).

---

## 2 · BA CHỖ ĐỨT — tệp:dòng, không suy đoán

### Đ1 · 🔴 NẶNG NHẤT — vật liệu gán cho MẶT (sàn/trần) KHÔNG tới được 3D

**Đo được:** `2/3 vật liệu tới 3D · KHÔNG TỚI: hatch#e-005 specId=ps-go-soi (slab)`.
Sau khi người dùng đổi sàn gỗ sồi → gỗ óc chó: BOQ đổi (27.000.000₫ → 51.840.000₫), deck báo cũ,
**nhưng 3D không hề biết** — `mã 3D sau khi đổi: ps-sofa-3s, ps-wrd-240 · có mã mới = false`.

**Gốc, đọc thẳng từ mã:**

* `lib/three/cad-to-obj.ts:617` — `builder.object('Floor', mats.floor, { ...derivedSpatial('floor') })`.
  Nhóm `Floor` là **slab bbox nở 50mm của toàn bản vẽ**, không phải hình học của một entity nào ⇒
  cố ý **không** mang `entityId`, và cũng **không** mang `specId` (chú thích `:613-616` tự khai
  điều thứ nhất, không nói điều thứ hai).
* `lib/three/cad-to-obj.ts:701-710` — chỉ **`Wall_i`** (hatch được xếp loại TƯỜNG) mới nhận
  `specId: h.specId`. `Furn_i` (`:747`) · `Window_i` (`:792`) · `Door_i` (`:801`) cũng có.
  **Không nhánh nào dựng nhóm từ một `HatchEntity` KHÔNG-phải-tường.**

⇒ Trong Doc, một `HatchEntity` mang `specId` là **hoàn toàn hợp lệ và BOQ tính đúng tiền của nó**
(`lib/boq/compute.ts:274`), nhưng nếu nó không được xếp loại tường thì **nó không tồn tại ở 3D**.
Câu quảng cáo *"đổi vật liệu trong phối cảnh thì BOQ đúng vì chỉ có MỘT vật"* hôm nay đúng cho
**tường và đồ rời**, **sai cho mọi mặt hoàn thiện sàn/trần** — mà đó chính là hạng mục lớn nhất
của hồ sơ nội thất.

**KHÔNG VÁ Ở PHIÊN NÀY.** `lib/three/**` nằm ngoài vùng ghi của phiếu, và đây không phải dây đứt
nhỏ: phải quyết *nhóm 3D của một mặt hoàn thiện là gì* (một slab riêng theo đa giác hatch? một lớp
phủ 2mm trên `Floor`?) — quyết định kiến trúc, không phải sửa một dòng.

### Đ2 · 🔴 `.idfc` nối về thương mại bằng khoá ĐỔI ĐƯỢC, không phải khoá bất biến

**Đo được:** `commerce có specId = false · chỉ có sku='SOFA-3S'`.

`lib/cad/idfc.ts:189-199` `IdfcCommerce` khai `brand · sku · vendor · priceVnd · priceNote ·
currency · unit · materials · finishes` — **không có trường nào nối về `ProductSpec.id`**.
Nhưng cả `Doc` (`Base`/`BlockEntity.specId`) lẫn `BOQ` (`BoqRow.specId`) đều neo bằng
**`ProductSpec.id`** — khoá BẤT BIẾN. Còn `sku` thì `lib/materials/matid-identity.ts:5-8` đã ghi
rõ là *"business/external key (mutable OK) — ATLAS được phép sync đổi sku"*.

⇒ Một cấu kiện xuất ra kho studio rồi nhập lại ở dự án khác **phải khớp lại bằng tên/mã**, đúng
loại dây mà `lib/cad/library-code-map.ts:1-20` đã trả giá một lần (*"dây nối cũ là TÊN HIỂN THỊ,
mà tên đổi thì dây đứt im lặng"*). Đây là **cùng một bệnh, ở một tầng khác**.

### Đ3 · 🔴 `BuildRecipe` KHÔNG đi cùng cấu kiện khi vào kho

**Đo được:** `chữ "recipe" trong lib/cad/idfc.ts = 0 dòng`.

`IdfcBody` nhánh `component` (`idfc.ts:171`) có `geom2d · geom3d? · params?` — `params` là
`ShapeVariant[]`, `geom3d` là `{heightMm, bevelMm, matId, pbr}`. **Không chỗ nào chứa
`BuildRecipe`.**

Trong khi đó K9 ① chứng minh recipe **sống tốt qua `.idf`** (`mất=0`). ⇒ moat của công thức khối
nguyên vẹn **trong một dự án**, và đứt **đúng ở biên giới dự án → kho studio**: món đưa lên kệ
mất ngăn xếp dựng hình, người mở lại chỉ còn hình chết. Trùng đúng ca thật đã ghi trong sổ
(`chuan-net` xuất recipe `revolve` cho 4 chân ghế Lincoln).

---

## 3 · Bốn câu hỏi — trả lời bằng SỐ

### ① Định danh có sống xuyên bề mặt không?

**Sống, nhưng KHÔNG phủ hết.** Đọc từ nơi lưu thật:

* Nhóm 3D mang `entityId`: **2/3** — thiếu đúng nhóm `Floor` (bbox tổng hợp, không có entity nguồn).
* Nhóm 3D mang `specId`: **2/3 vật liệu** — thiếu vật liệu của mặt sàn.
* **Không nơi nào đẻ mã thứ hai**: mã lạ = **0**, vật liệu lạ = **0**. Cái gì tới được 3D thì tới
  bằng **CHÍNH mã của nó**, không qua bảng ánh xạ nào.
* `specId === matId` trên **100% dòng BOQ** (`lib/boq/model.ts:53` giữ bất biến này bằng test).

⇒ Không phải *"mỗi nơi một mã"*; là *"một mã, nhưng có bề mặt chưa nhận được mã"*.

### ② Gia phả có truy ngược được không?

**Có, đủ bốn chặng.** Từ một dòng BOQ:

* `BoqRow.entityIds` → **`e-san`** (`lib/boq/model.ts:86`) ⇒ ra đúng đối tượng đã vẽ.
* Entity đó mang `srcBlock='SOFA-3S'` (từ mẫu nào trên kệ) + `srcInsertId='ins-001'`
  (**lần chèn nào** — `model.ts:352-367`) ⇒ ra gia phả đặt-vào.
* `specId='ps-go-soi'` → `ProductSpec` ⇒ ra ai bán, giá bao nhiêu.
* Ai quyết: xem ③.

Sau khi lưu→mở lại, cả bốn còn nguyên: **mất = 0** trên cả `srcBlock`, `srcInsertId`, `specId`,
`elementType`, `storey`, `recipe`.

### ③ Ảnh hưởng xuôi dòng có NHÌN THẤY ĐƯỢC không?

**Có — và đúng khuôn *máy đề xuất · người quyết · hệ giữ sự thật*.**

* Máy **trình bảng tác động TRƯỚC** khi đổi: `1 tham chiếu · surface=1 · đầu ra ăn theo: 2D=true
  3D=true BOQ=true Present=true` (`inspectMaterialImpact`).
* **Không có đường tự áp**: `inspectMaterialImpact` **không** gọi `replaceMaterialReferences` —
  kiểm bằng đọc mã nguồn, không bằng niềm tin. UI đi qua `MaterialImpactPreview` (`onApply` /
  `onCancel`), tức người bấm.
* **Lùi được**: `Doc` cũ **không bị sửa tại chỗ** — `doc gốc vẫn specId=ps-go-soi`.
* Hạ nguồn tự biết mình cũ: vân tay `Doc` đổi `c293e2a5:2b → 4dc1e07b:2c` ⇒
  `isBoqAppendixStale(meta, live) === true` ⇒ phụ lục BOQ trong deck **báo cũ**, không cắm số chết.
* Cache **không** trả số cũ: lần 2 `hit=true`, sau khi đổi `hit=false`.
* 🔴 **Trừ 3D** — xem Đ1.

### ④ Đóng app rồi mở lại, còn nguyên mấy phần trăm?

| Đường lưu | Khẳng định | Đạt |
|---|---|---|
| ① `.idf` (tệp dự án) | 8 | **8/8** |
| ② IndexedDB (vòng JSON của `sheets-persist`) | 2 | **2/2** |
| ③ `.idfc` (một cấu kiện vào kho studio) | 6 | **4/6** |
| **Tổng** | **16** | **14/16 = 87,5%** |

Chi tiết đường ①: `3/3 entity` · định danh mất **0** · gia phả mất **0** · công thức khối mất **0**
· ngữ nghĩa mất **0** · BOQ sau mở lại **102.340.000₫ = 102.340.000₫**, `3 = 3` dòng ·
**quyết định của người còn hiệu lực** (`specId` vẫn là `ps-go-ocho`) · vân tay khớp nên deck
**không báo cũ oan**. Hai chỗ trượt ở đường ③ chính là Đ2 và Đ3.

---

## 4 · MẮT ĐÓNG/TẢI LẠI — con số 0/22 đã bị phá

Ma trận hành trình đo ra **0/22** hành trình được xác minh ở cột *kết quả đã lưu*. Sau lát cắt này:

* **1/22 hành trình** — *"đặt đồ từ Thư viện → gán vật liệu → đổi vật liệu → lưu → mở lại"* — nay
  có bằng chứng máy chạy lại được, và **có máy canh thường trực** (`lib/cad/moat-chuoi.test.ts`,
  24 khẳng định, nằm trong `npm test`) để nó không âm thầm mất.
* ⚠️ **Nói thẳng phạm vi**: đây là mắt ĐÓNG/TẢI LẠI ở **tầng dữ liệu** (bộ tuần tự hoá thật, hàm
  sản xuất thật, chạy headless). Nó **KHÔNG** thay được một lượt bấm tay trên app thật — phần
  chưa kiểm ghi ở §6.

---

## 5 · Việc phải làm tiếp, xếp theo giá trị

1. **Đ1 — mặt hoàn thiện phải có mặt ở 3D.** Cần quyết định kiến trúc trước (nhóm 3D của một
   `HatchEntity` không-phải-tường là gì), rồi mới code. Đây là chỗ moat đang hở to nhất.
2. **Đ2 — thêm khoá bất biến vào `IdfcCommerce`.** Additive, nhưng **chưa làm ở phiên này** vì
   repo có luật K4 *"không khai field chết"*: thêm `specId?` mà chưa có nơi ghi/nơi đọc là đẻ
   trường chết. Làm cùng lượt với nơi tiêu thụ (xuất/nhập kho studio).
3. **Đ3 — `BuildRecipe` vào `.idfc`.** Cùng ràng buộc như Đ2.

---

## 6 · CHƯA CHẮC / CHƯA KIỂM — bắt buộc ghi

* **Chưa mở app thật một lần nào.** Không dev server, không Chromium, **không ảnh màn hình**. Thư
  mục `anh-duyet-mat/g4-moat/` hiện chỉ chứa **log chạy**, không phải ảnh. Mọi kết luận là *đo tại
  tầng dữ liệu*, không phải *thấy bằng mắt trên giao diện*.
* **Đường IndexedDB là SUY, không phải ĐO.** Bộ này áp đúng phép `JSON` mà `sheets-persist` áp
  trước khi ghi, nhưng **không mở IndexedDB thật** — chưa phủ được lỗi ở tầng structured-clone,
  quota, hay chế độ riêng tư.
* **Kho giá là dữ liệu dựng cho phép đo**, không phải `ProductSpec` thật trong CSDL (`ProductSpec`
  trong CSDL hiện có **0 hàng**). Đường `app/api/boq/[projectId]/route.ts` (fetch + Prisma) **không
  nằm trong phép đo này**.
* **Chỉ 3 vật đại diện.** `millwork` được đại diện bằng `WRD-240` — mà resolver tự khai
  `approximate:true` (kho chỉ có `wardrobe` w=1800, kệ ghi 2m4). Không phủ `fixture` · `soft` ·
  `fitout`, cũng không phủ đường `via:'manifest'` (block `.dxf` — `keepsIdentity:false`, tức
  **mất danh tính ngay từ K1**, chưa đo trong lát cắt này).
* **`evalRecipe` chỉ chạy 2 bước** (`extrude` + `arrayLinear`). 8 `BuildOp` còn lại
  (`boolean`/`mirror`/`bevelEx`/`taper`/`sweep`/`revolve`/`loft`/`arrayRadial`) **chưa đo** trong
  chuỗi này.
* **Đ3 đo bằng `grep "recipe"` trên `lib/cad/idfc.ts`** — chứng minh *không có đường*, không chứng
  minh *không có cách nào khác nhét recipe vào* (vd nhét thô vào `params`). Đủ để kết luận *không
  có đường CHÍNH THỨC*, không đủ để kết luận *bất khả*.
* **Trạng thái phụ lục deck đo bằng `isBoqAppendixStale`** (hàm thuần) — **chưa xem UI có thật sự
  hiện cờ cũ đó cho người dùng không**. `components/present-editor/Inspector.tsx:1386` có đường
  đọc; chưa bấm tay.

---

## 7 · Vệ sinh môi trường

* `npx tsc --noEmit` → **rc=0**
* `npm test` → **rc=0**, `0 fail`
* `node scripts/nghiem-thu-g4-moat.mjs` → **rc=1** (đúng như thiết kế: còn khâu đứt), hiệu chuẩn ĐẠT
* `node_modules/.bin/sucrase-node lib/cad/moat-chuoi.test.ts` → **rc=0**, `24 pass, 0 fail`

### 🔴 CSDL repo chính — CÓ DRIFT, và KHÔNG PHẢI DO LÁT CẮT NÀY

| Bảng | Trước (17:24) | Sau `npm test` (17:36) | Đo lại (17:37) |
|---|---|---|---|
| `User` | 1 | 2 | 2 |
| `CreditTransaction` | 1 | 2 | 2 |
| `Flow` | 5 | 5 | **8** |
| `Project` | 4 | 4 | **7** |
| `ProjectMember` | 3 | 3 | **6** |

**Bằng chứng nó không phải của lát cắt này:**

1. **CSDL của worktree này KHÔNG ĐỔI** — `User` vẫn = 1 sau toàn bộ `npm test`. `.env` của
   worktree trỏ **đường tuyệt đối** vào `prisma/dev.db` của chính nó.
2. Hàng mới là `tho@interiorflow.test` "Thợ thi công", `createdAt = 1788542752394` =
   **17:25:52 UTC** — thời điểm phiên này còn đang **đọc mã nguồn**; lần chạy đầu tiên của phiên
   là 17:28:46.
3. `grep "tho@interiorflow.test"` toàn repo = **0 dòng** ⇒ không test nào ở đây sinh ra nó; đó là
   một lượt **đăng ký thật qua app** (kèm `"Tặng credits khởi tạo"` 200 credit).
4. `Flow`/`Project`/`ProjectMember` **tiếp tục tăng trong 40 giây phiên này không chạy gì**.
5. `ls .claude/worktrees/` cho thấy **3 lane khác đang mở** cùng lúc.

⇒ Đây đúng cái bẫy `docs/delivery/LUAT-WORKTREE-LANE.md` cảnh báo, và nó **đang xảy ra ở một lane
khác**. Việc cho IF COMMAND: truy lane nào đang trỏ Prisma vào CSDL repo chính và bịt lại — phiên
này không có quyền chạm lane đó.
