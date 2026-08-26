# INTEGRATION PLAN · Wave 0 → 1 → 2

> **CANDIDATE.** Không mục nào ở đây là PASS. Đây là **thứ tự thi công** hợp nhất từ năm gói
> Research-to-Spec read-only (Lane A · B · C · D · E) chạy 26/08 trên HEAD `ad26391`, cộng kết quả
> Wave 0 đã thi công.
> Luật nhãn: mọi verdict mang theo **bề mặt đã chạm** (F-16). Bậc chưa chạm ghi `NOT ASSESSED`
> **kèm lý do**, không im lặng bỏ trống.

---

## 0 · Một phát hiện đổi thứ tự mọi thứ

Năm lane chạy độc lập, không đọc kết quả của nhau. Chúng hội tụ vào **cùng một câu**:

> **IF không thiếu năng lực. IF thiếu đường nối giữa những năng lực đã có.**

Bằng chứng, mỗi lane một mảnh — tất cả đều là mã **đã tồn tại và không ai gọi**:

| thứ đã có, chạy được | ai gọi | lane |
|---|---|---|
| `visibleProjectIds()` — bộ lọc phạm vi dự án | **0** (comment tự khai *"bật lọc ở wave sau"*) | A |
| `lib/cad/ifpack.ts` — sha256 + manifest + `integrityWarnings` | **0** cho `.idfc` (dù `.idfc` thiếu đúng lớp này) | B |
| `POST /api/atlas-materials/sync` | **0** — không nút, không script | C |
| `GET /api/asset-representation` — đọc lại spec đã duyệt | **0** — chỉ có đường ghi | E |
| `XuatXu` của visual-generate — cấu trúc xuất xứ đầy đủ nhất repo | ghi ra **RAM**, F5 là mất | E |
| `lib/idfc-import/` — 3.346 dòng, 4 test, bậc `engine` | **0** | B |

Hệ quả cho kế hoạch: **ưu tiên NỐI trước khi VIẾT MỚI.** Mỗi mục Wave 1 dưới đây là một sợi dây,
không phải một tính năng. Rẻ hơn, có bằng chứng nhanh hơn, và không đẻ khuôn thứ hai (luật 6).

---

## 1 · WAVE 0 — an ninh nền. Trạng thái thật

| # | việc | verdict | còn thiếu bậc nào |
|---|---|---|---|
| R1 | `AUTH_SECRET` fail-closed | 🟠 `PARTIAL — process/contract proof` | Electron đóng gói `NODE_ENV=production` thật · thông điệp người dùng thấy: `NOT ASSESSED` |
| R3 | `IF-SECURE-ARTIFACT-DELIVERY-001` | 🟢 `PASS — runtime HTTP (Next dev server)` · 29/29 đơn vị + 12/12 HTTP | Electron đóng gói: `NOT ASSESSED` · cross-tenant negative: `NOT ASSESSED` **vì chưa có tenant** |
| R2 | content-integrity gate (report-only) | ⚪ `NOT ASSESSED` | chưa bắt đầu |
| R8 | path traversal `GET /api/library/[id]/file` | 🔴 **CHƯA VÁ** — Lane A đo lại: route `findUnique` rồi **trả file, không kiểm chủ sở hữu nào** | — |

**Chốt chặn cho cả kế hoạch:** Lane A nói thẳng — *"tenancy không có nghĩa khi ai cũng đúc được
cookie `sub=<bất kỳ>`"*. ⇒ **R1 phải lên bậc Electron TRƯỚC khi bật bất kỳ bộ lọc phạm vi nào.**
Bộ lọc dựng trên danh tính giả là trang trí.

---

## 2 · WAVE 1 — nối dây. Mỗi mục một PR, mỗi mục lùi được bằng một `git revert`

Thứ tự **không** tuỳ ý: sắp theo *rẻ nhất × chứng minh sớm nhất × ít phụ thuộc nhất*.

| # | việc | phụ thuộc | phạm vi | cờ | lùi | bằng chứng phải có |
|---|---|---|---|---|---|---|
| **W1-1** | Vá **R8** `library/[id]/file` — kiểm chủ sở hữu trước khi trả bytes. Dùng lại đúng khuôn R3 vừa chứng minh | — | 1 route | không cần | revert 1 tệp | proof HTTP: chủ sở hữu 200 · người khác 404 · không phiên 401 · **CA 0 cổng harness** |
| **W1-2** | **Cứng hoá `visibleProjectIds()`** — thêm `Project.deletedAt`, nhánh `isAdmin`, cờ `includeHidden` + test thuần | — | 1 tệp lib | không cần | revert 1 tệp | **0 caller ⇒ 0 rủi ro hành vi.** Test: 4 ca `visibleProjectIds` ≡ `assertProjectAccess` |
| **W1-3** | Bật lọc ở `dashboard` (3 truy vấn) — bề mặt **chỉ đọc**, thấy ngay bằng mắt | W1-2, R1-Electron | 1 route | có | revert 1 tệp | 2 tài khoản, 2 dự án: mỗi bên chỉ thấy của mình · **admin vẫn thấy tất cả** (không thì là hồi quy) |
| **W1-4** | `home/summary` + `flows`: đổi `userId: self` → phạm vi. **Sửa luôn lỗi under-fetch**: member được mời hiện **chưa từng** thấy dự án | W1-3 | 2 route | có | revert 2 tệp | member được mời **thấy** dự án — đây là *tính năng*, không chỉ vá an ninh |
| **W1-5** | **Đọc lại spec đã duyệt** — panel gọi `GET /api/asset-representation`, dựng lại `SpecTuAnh` từ cột `provenance` đã có đủ dữ liệu | — | 1 component | không cần | revert 1 tệp | duyệt → tải lại trang → **mở lại đúng tờ spec**, sửa → **2 hàng DB**, hàng cũ nguyên vẹn |
| **W1-6** | **Ghi kết quả visual-generate xuống đĩa** — `nhanDeXuat()` ghi ảnh **và** `XuatXu` (chỗ duy nhất có cú bấm của người) | — | 1 hàm | có | revert 1 tệp | dựng ảnh → F5 → ảnh **và** model/version/credit còn nguyên (hôm nay trượt ca này) |
| **W1-7** | **Nối integrity `.idfc`** — dùng lại `sha256Hex` + `IfpackManifest` của `ifpack.ts`; và `ParsedIdfc.x` để **không mất khoá lạ** khi vào kho | — | 2 tệp lib | không cần | revert 2 tệp | round-trip giữ `xFromPhoto` (provenance 3 nấc hôm nay **rơi mất lúc nhập kho** — bug thật, Lane B đo được) |

**Cấm gộp W1-3 với W1-4.** Cấm bắt đầu W1-3 khi W1-2 chưa có test.

---

## 3 · WAVE 2 — đổi cấu trúc. Chỉ mở sau khi Wave 1 xanh trên runtime

| # | việc | quyết định chặn | vì sao phải chờ |
|---|---|---|---|
| **W2-1** | `Tenant` + `tenantId` **nullable** trên **9 bảng gốc** (phương án (c) của Lane A), backfill 1 tenant, **chưa ai đọc cột** | 🔴 **Câu hỏi U1 — của Hoà, không phải của kỹ thuật**: *một cài đặt có bao giờ phục vụ >1 studio không?* **KHÔNG** ⇒ bỏ hẳn W2-1..2-2, chỉ giữ Wave 1 + ghi ràng buộc triển khai tường minh | expand-only, nhưng kéo theo **quả mìn**: `ProductSpec.room`/`confidence` đã khai schema **chưa `db push`** — `prisma generate` sai lúc là **mọi đọc/ghi ProductSpec chết ở runtime**. Phải gộp cùng một lần push, sao lưu `dev.db` trước |
| **W2-2** | Bật lọc `tenantId` sau cờ, thứ tự: `specs` → `boq` → `library` → `lark-tasks` → roster `user` → `chat` | — | `chat` cuối vì cần khoá kênh mới — hôm nay **không có bảng kênh** |
| **W2-3** | `.idfc` mở rộng: `parts/instances` (4 chân ghế = 2 Definition × mirror), `meshRef`, `IdfcBoqRule`, `present` hints | 🔴 **Điều kiện tiên quyết**: sửa đường thả `clusterPrimsToEntities` — nó **làm phẳng prims, mất danh tính** | luật lặp ở tầng file sẽ **bị xoá sạch ngay lúc thả xuống bản vẽ**. Mở rộng trước khi sửa đường thả = **dữ liệu đúng trong file, sai trên bản vẽ, sai trong BOQ** — im lặng sai, tệ hơn lỗi to tiếng |
| **W2-4** | Material Connector pilot 20 bản ghi | 🔴 **BLOCKED-BY-VENDOR**: chưa có tài liệu API **hoặc** bản xuất mẫu, chưa có điều khoản license bằng văn bản | `ATLAS_FIELD_NAMES` là **placeholder chưa xác minh**; route **upsert thẳng, không preview**; `priceVnd` chảy vào BOQ ⇒ bật lúc này là **ghi giá sai, âm thầm**. Đi **cửa Excel/CSV trước** (đã có 246 test pass), API sau |
| **W2-5** | F1 **Concept Package** — vật thể đầu ra đầu tiên | — | hôm nay *"Concept Package"* chỉ tồn tại trong tài liệu, **chưa có một dòng mã nào mang tên nó**. Lát mỏng: ghi `{brief, optionId, entities, phiênBảnParser}` thành một `ProjectFile` — **không migrate** |

---

## 4 · Luật chung cho mọi mục trên

1. **Cổng harness (F-15).** Mỗi script chứng minh mở bằng một ca chứng minh **chính nó**. Cổng đỏ
   ⇒ dừng, **cấm in PASS** cho ca phía sau. Cổng nằm ở **đầu**, không ở cuối.
2. **Nhãn mang bề mặt (F-16).** `PASS — runtime HTTP` ≠ `PASS — Electron đóng gói`.
3. **Additive.** Ghi mới đường mới; đọc **ngã về** đường cũ có đánh dấu. Cấm move/delete/rewrite
   hàng loạt. Mọi mục có **cờ** hoặc **revert một tệp**.
4. **Không PASS giả.** Ca không dựng được thì ghi `NOT ASSESSED` **kèm lý do** — như
   cross-tenant negative của R3: *chưa có tenant nên chưa có ranh giới để vượt*.
5. **Nối trước, viết sau.** Một mục Wave 1 mà lại đẻ mã mới trong khi có sẵn thứ chưa được gọi
   thì mục đó viết sai.
6. **Consumer trước schema.** Lane B chỉ đúng lỗi mà repo đã ghi 4 lần: 5/8 nhánh `IdfcBody` hôm
   nay là *"chỗ đỗ tạm chờ nơi tiêu thụ"*. Thêm mặt mới **không có consumer thật** là tái phạm.

## 5 · Chưa chạm — nói thẳng

- **Lane D (Vitals/UX)**: `BLOCKED-BY-INPUT`. Cần bộ tham chiếu Hoà cung cấp + nghiên cứu hợp
  pháp; **không dựng visual lookalike**. Chưa mở, không đoán thay.
- **Bậc Electron đóng gói** cho R1 và R3: chưa dựng bản đóng gói trong phiên này.
- **Trạng thái thật của cột `ProductSpec.matId` trên `dev.db`**: chưa đọc được (không có
  `sqlite3` trong môi trường của lane).
- **Cross-tenant negative** ở mọi mục: `NOT ASSESSED` cho tới khi W2-1 tồn tại.
