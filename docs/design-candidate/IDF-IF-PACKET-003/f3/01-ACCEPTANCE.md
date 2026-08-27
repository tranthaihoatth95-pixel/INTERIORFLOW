# F3 · HỢP ĐỒNG NGHIỆM THU — `.idfc → 2D → 3D → BOQ → Present → export → reopen → hash/provenance`

> HEAD `16ead1c`. Soạn bởi lane read-only `IF-F3-ACCEPTANCE-001`, MAIN ghi tệp.
> **Nhãn tổng F3 tại `16ead1c`: `PARTIAL`.** Ba mắt xích `MISSING`, hai mắt `EXISTS-PARTIAL không test`.
> Nhãn chỉ dùng `NOT ASSESSED / PARTIAL / PASS / FAIL`.

## 0 · BỐN CHỖ BỐI CẢNH TÔI GIAO ĐÃ SAI — mã thật thắng

| tôi giao | mã thật |
|---|---|
| *"xuất ở `LibrarySheet.tsx`"* — hàm ý mọi món xuất được | Nút "Xuất .idfc" **chỉ hiện khi `resolved.via === 'blockdef'`** (`LibrarySheet.tsx:1247`). Món `.idfc` **đã nhập kho không có nút xuất**. Và nội dung xuất **dựng lại từ `BlockDef` + `getPbr` + `matchSpec`** (`:1256-1266`), **không phải byte của tệp đã nhập** ⇒ vòng "export → reopen → kiểm hash" hôm nay **không phải round-trip của cùng một hiện vật** |
| *"`.idfc` có `commerce.priceVnd` ⇒ BOQ ra 1 dòng, thành tiền = đơn giá"* | **KHÔNG có mắt xích nào** đưa `IdfcCommerce.priceVnd` (`idfc.ts:209-220`) vào BOQ. `computeBoq` chỉ đọc `specs: MaterialSpecLite[]` (`compute.ts:235`) nạp từ `prisma.productSpec` (`api/boq/[projectId]/route.ts:58-61`). Giá trong tệp **không bao giờ được đọc để tính tiền**. Tiêu chí viết nguyên văn như vậy hôm nay **FAIL by design** |
| *"đường áp PBR có thể chưa nối"* | Đúng, **và nặng hơn**: không chỉ PBR đứt, **hình học 3D của món `.idfc` cũng đứt** |
| *"`meta.x` cho khoá cấp gốc"* | Đúng (`idfc.ts:513-517`), nhờ đó `meta.integrity` sống sót qua `importIdfc` |

## 1 · BẢN ĐỒ MẮT XÍCH

| # | chặng | hàm thật | nhãn |
|---|---|---|---|
| ① | đọc/ghi `.idfc` | `importIdfc` `idfc.ts:441` · `exportIdfc` `:~347` · migration `:279-297` | `EXISTS-RUNTIME-PROVEN` |
| ② | ký/kiểm toàn vẹn | `kyIdfc` `idfc-integrity.ts:117` · `kiemToanVenIdfc` `:144` · dùng ở `LibrarySheet.tsx:1273`, `BulkIngestMode.tsx:79` | `EXISTS-PARTIAL` — **0 tệp test**; `nguon` ký rồi **không nơi nào hiện lại**; kho IDB chỉ giữ `ParsedIdfc` (`idfc-store.ts:24`), **không giữ byte gốc** |
| ③a | `.idfc` → 2D | `idfcGeom2dOf` `library-item-resolve.ts:158` · thả `LibraryDropBridge.tsx:118-131` | `EXISTS-RUNTIME-PROVEN` (bậc test thuần) |
| ③b | 2D → 3D | `docToObjScene` `cad-to-obj.ts` — `furnitureBlocks` `:584-587` **chỉ nhận `e.type==='block'`** | 🔴 **MISSING cho `.idfc`** — nét rời chỉ lọt vào `structural` để tính bbox (`:594`) ⇒ **món `.idfc` VÔ HÌNH trong 3D** |
| ③c | PBR vào 3D | `buildPbrMaterial` `pbr-three.ts:91` — **1 nơi gọi**: quả cầu preview. Scene thật `Scene3DViewer.tsx:479,492` luôn `MeshStandardMaterial` phẳng | 🔴 `CANDIDATE-ONLY` |
| ④ | BOQ | `computeBoq` `compute.ts:235` · gom cụm `:310-327` · ba loại lỗi `:351,511,536` | `EXISTS-PARTIAL` — **sau cờ**, và **cờ chưa đặt ở bất kỳ `.env` nào** ⇒ mặc định TẮT. **0 test** cho nhánh này |
| ⑤ | Present | `BoqScreen.tsx:160` · reopen 3 lớp `PresentSheets.tsx:106,279,337,444` | `EXISTS-PARTIAL` — `grep idfc components/present-editor/` = **0 hit**, Present **không biết gì về `.idfc`** |
| ⑥ | export deck | `PresentEditor.tsx:1500-1590` | `EXISTS-RUNTIME-PROVEN` cho deck, **không dính dây `.idfc`** |
| ⑦ | reopen + kiểm hash | — | 🔴 **MISSING** — chỉ kiểm đúng lúc thả tệp, không kiểm khi **mở lại** |

### Bảy mắt xích ĐỨT, theo mức nghiêm trọng
1. **`.idfc` → 3D đứt hoàn toàn** — `cad-to-obj.ts:584-587` không có nhánh cho `srcInsertId`/`srcBlock`.
2. **PBR → scene đứt** — `Scene3DViewer.tsx:479,492`.
3. **`commerce.priceVnd` → BOQ đứt** — không tệp nào nối `idfc.ts:209` với `compute.ts:235`.
4. **Cờ `NEXT_PUBLIC_IF_IDFC_IDENTITY` chưa đặt ở `.env` nào** ⇒ trên máy thật, món `.idfc` **vẫn 0 dòng BOQ, im lặng** — đúng bệnh mà `compute.ts:302-305` mô tả.
5. **Export món đã nhập kho đứt** — `LibrarySheet.tsx:1247` chặn; qua được thì tệp xuất là **bản dựng lại**, hash mới, xuất xứ gốc mất.
6. **Reopen không kiểm lại dấu** — IDB không lưu chuỗi gốc; kiểm lại từ `ParsedIdfc` ra hash khác.
7. **`.idfc` → Present không có dây nào.**

## 2 · TIÊU CHÍ NGHIỆM THU — mỗi mục một câu KIỂM ĐƯỢC

**A · nhập & toàn vẹn**
1. `.idfc` đã ký thả vào `BulkIngestMode` ⇒ `khop`, **0 cảnh báo**.
2. Sửa **một ký tự** trong `meta.name` rồi thả lại ⇒ đúng câu *"Nội dung KHÔNG khớp dấu toàn vẹn đã ký…"* (`idfc-integrity.ts:180-183`) **và vẫn nhập được**.
3. `.idfc` cũ **chưa ký** ⇒ `khong-co`, **0 cảnh báo** (`:162`).
4. Thêm khoảng trắng / đảo thứ tự khoá ⇒ **vẫn `khop`** (chuẩn hoá phủ nội dung, không phủ cách viết).
5. JSON cụt ⇒ lý do có chữ *"không phải JSON hợp lệ"* **kèm chi tiết parser**, **không** có chữ *"bị sửa"*.
6. Sau khi nhập kho rồi **tải lại trang** ⇒ UI hiện được **trạng thái toàn vẹn và `nguon`**. *(Hôm nay không có bề mặt nào ⇒ PHẢI THI CÔNG.)*

**B · 2D**
7. Kéo món xuống bản vẽ ⇒ số entity **bằng đúng `prims.length`**, mọi entity cùng một `srcInsertId`, `srcBlock === meta.code`.
8. Bấm **một** nét ⇒ `expandIdsByInsertGroup` (`model.ts:444-470`) chọn **toàn bộ** cụm, không hơn không kém.
9. Ruột `video`/`page`/`preset` ⇒ đúng câu `idfcNoGeom2dMessage` (`library-item-resolve.ts:222`), Doc **không thêm entity nào**.
10. Lưu `.idf` rồi mở lại ⇒ giữ `srcInsertId` · `srcBlock` · `specId`.

**C · 3D**
11. `docToObjScene(doc)` ⇒ **≥1 group mang `srcInsertId` của cụm `.idfc`**. *(Hôm nay FAIL.)*
12. Có `geom3d.heightMm` ⇒ khối **cao đúng `heightMm`**, không lấy mặc định (`cad-to-obj.ts:290,748`).
13. Có `geom3d.pbr` ⇒ mesh dùng `buildPbrMaterial`, kiểm bằng `material.type === 'MeshPhysicalMaterial'`. *(Hôm nay FAIL.)*
14. **Không** có `geom3d` ⇒ **không dựng khối bịa**; dựng thì phải khai rõ là suy đoán, **không im lặng**.

**D · BOQ**
15. Cờ BẬT, một món 41 nét có `specId` khớp spec có giá ⇒ **đúng 1 dòng** `kind:'count'`, `qty===1`, `thanhTien===donGia`.
16. **Ba** bản chèn cùng món ⇒ **1 dòng, `qty===3`** (không phải 3 dòng, không phải 123).
17. Cờ **TẮT** ⇒ BOQ **byte-identical** với trước lát này.
18. **Không** `specId` ⇒ đúng **một** `missing-specId-item` có `entityIds`, `rows` **không** có dòng nào — **không nuốt im lặng**.
19. `priceVnd === null` ⇒ đúng một `missing-priceVnd`, `totalAmount` **không** cộng thêm.
20. `specId` trỏ spec không tồn tại ⇒ đúng một `spec-not-found`.
21. 🔴 **`.idfc` mang `commerce.priceVnd` mà DB không có spec** ⇒ **hoặc** khớp/tạo spec từ `commerce`, **hoặc** báo lỗi rõ là giá trong tệp không được dùng. **CẤM ca thứ ba: im lặng bỏ giá.** *(Quyết định kiến trúc, chốt TRƯỚC khi gõ dòng đầu.)*

**E · Present + export + reopen**
22. `BoqScreen` banner lỗi (`:336`) hiện **đúng số** món thiếu mã, khớp số cụm trên bản vẽ.
23. Xuất PDF/PPTX rồi mở lại phiên (3 lớp) ⇒ **cùng số sheet, cùng thứ tự**.
24. Xuất `.idfc` một món **đã nhập kho** ⇒ mở lại được, `kiemToanVenIdfc` trả `khop`. *(Hôm nay nút không tồn tại ⇒ FAIL.)*
25. Xuất → nhập lại đúng tệp ⇒ `meta.code` nguyên, `commerce`/`geom3d`/khoá lạ **không mất**, `nguon` khai **nguồn thật** chứ không phải luôn `{kind:'library'}`.

## 3 · MA TRẬN BẰNG CHỨNG

Bậc có sẵn: `npm test` = `tsc` + license + `check:chot` + `soi:foundation` + mọi `*.test.ts` qua `sucrase-node`. **Không Vitest/Jest, không DOM harness, không Playwright.**

| tiêu chí | test thuần | module runtime | HTTP dev | Electron |
|---|---|---|---|---|
| 1–5 ký/kiểm | ✅ đủ (`sha256.ts` chỉ cần `globalThis.crypto`) | — | — | — |
| 6 kiểm lại sau reopen | ✅ phần thuần | ✅ cần (IndexedDB) | ✅ nếu qua UI | — |
| 7–10 2D | ✅ tiền lệ `keo-tha-idfc.test.ts` | ⚠️ `LibraryDropBridge` là React ⇒ chỉ test lớp thuần dưới nó | ✅ | — |
| 11–12 3D hình học | ✅ — `cad-to-obj.ts` **không import `three`** (`:181`) | — | — | — |
| 13 PBR | ❌ cần WebGL | ❌ **chưa dựng được** — không có headless-GL | ⚠️ chỉ bằng ảnh | ✅ ca cuối |
| 15–21 BOQ | ✅ `compute.ts` thuần | — | ✅ (cần Prisma + phiên) | — |
| 22 banner | ❌ React | — | ✅ | ✅ |
| 23 reopen 3 lớp | ❌ | ⚠️ một phần | ✅ hai lớp | ✅ **bắt buộc** cho lớp đĩa |
| 24–25 round-trip | ✅ phần thuần | ✅ | ✅ | ✅ |

**Bậc chưa dựng được:** WebGL headless (⇒ tiêu chí 13 `NOT ASSESSED`) · HTTP có DB cho `/api/boq` · Electron đóng gói.

## 4 · BA CA HỎNG BẮT BUỘC PHỦ

**① `.idfc` bị sửa sau khi ký** — `lech` + `hashKhai !== hashTinhLai` + đúng một câu; **vẫn nhập được**. Tách riêng ca đổi `idfcVersion` ⇒ cảnh báo **khác**, **không** kết luận bị sửa. *Đang thiếu: 0 test cho cả tệp `idfc-integrity.ts`.*

**② Mất mạng / đóng app giữa chừng** — IDB hỏng ⇒ `hydrateIdfcStore().catch(()=>undefined)` (`LibraryDropBridge.tsx:74`) tuột sang khớp-tên **im lặng**, có thể thả **hình của món khác**. Manifest hỏng ⇒ phải phân biệt *"chưa có hình"* với *"chưa tải được kho"*. `/api/specs` hỏng ⇒ `BoqScreen.tsx:136` chỉ `console.warn`, **người dùng không thấy gì**. Present ba lớp lệch ⇒ phải **nói lấy bản nào** và **nói khi phải lùi về bản cũ hơn**.

**③ Món không giá / không `specId`** — hai nhánh đã có mã, **chưa có test cho cụm `.idfc`**. Nhánh **chưa có mã nào phủ**: `.idfc` mang `commerce.priceVnd` mà DB không có spec ⇒ hôm nay **không dòng, không lỗi, không gì cả**. Đây là ca hỏng **nguy hiểm nhất** của F3.

## 5 · THỨ TỰ THI CÔNG

**Bắt buộc để gọi F3 là end-to-end:**
1. **Bật + khoá cờ** trong `.env.example`, test BOQ cho nhánh cụm. *Trước hết vì mọi chặng sau chỉ có nghĩa khi món lên được BOQ, và cờ lệch một đầu là ca hỏng mà `idfc-identity-flag.ts:5-13` đã cảnh báo.*
2. **Chốt cầu `commerce → giá`** (tiêu chí 21). *Trước hết vì nó quyết định schema; làm sau phải sửa ngược cả ④ lẫn ⑤.*
3. **Nối `.idfc` → 3D** trong `cad-to-obj.ts`: gom nét rời theo `srcInsertId` → footprint → đùn `heightMm`. *Rẻ nhất trong ba mắt đứt: `cad-to-obj.ts` không import `three` nên test thuần được ngay.*
4. **Test cho `idfc-integrity.ts`** — 5 ca, thuần, hiện là **0**.
5. **Kiểm lại toàn vẹn khi reopen** — lưu chuỗi gốc hoặc `contentHash` vào `StoredIdfc`, + bề mặt hiện `nguon`.
6. **Xuất `.idfc` cho món đã nhập kho** — gỡ chặn `:1247`, xuất từ bản ghi kho.

**Để lượt sau:** PBR vào scene (cần harness WebGL) · `.idfc` → Present · bậc Electron.

## 6 · BA RỦI RO + DẤU HIỆU SỚM

**R1 · cờ lệch hai đầu.** Gắn mà không đếm (món mất khỏi BOQ như cũ) hoặc đếm mà không gắn (cờ nói dối).
*Dấu hiệu:* bản vẽ có cụm mang `specId` nhưng `rows` rỗng **và** `errors` cũng rỗng — im lặng hoàn toàn.

**R2 · đếm sai bội số.** `compute.ts:306-307` tự nhận là *"chỗ dễ sai nhất"*. Sai chiều này: 41 nét = 41 món (báo giá gấp 41 lần). Chiều kia: nhiều bản chèn gộp thành 1.
*Dấu hiệu:* `totalAmount` không chia hết cho `donGia`; `qty` bằng số **nét** thay vì số lần **thả**.

**R3 · cảnh báo mất giá.** Tệp cũ chưa ký mà kêu, hoặc hash lệch vì **chuẩn hoá** chứ không vì nội dung ⇒ người dùng học cách bỏ qua đúng cái cảnh báo vừa dựng (F-02).
*Dấu hiệu:* nhập rồi **xuất lại ngay không sửa gì** mà ra `lech` — chuẩn hoá và đường ghi đã phân kỳ.
