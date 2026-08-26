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
| R1 | `AUTH_SECRET` fail-closed | 🟢 `PASS — production server runtime (Electron-equivalent env)` · 13/13 | binary `.app` đã đóng gói · `prisma db push` khởi động · auto-update |
| R3 | `IF-SECURE-ARTIFACT-DELIVERY-001` | 🟢 `PASS — single-tenant HTTP runtime slice` · 29/29 + 12/12 | Electron đóng gói · cross-tenant negative |
| R2 | content-integrity gate (report-only) | ⚪ `NOT ASSESSED` | chưa bắt đầu |
| R8 | `GET /api/library/[id]/file` | 🟢 `PASS — single-tenant HTTP runtime slice, cả hai nhánh cờ` · 12/12 | cross-tenant negative |

**Chốt chặn đã GỠ (26/08).** Lane A nói đúng — *"tenancy không có nghĩa khi ai cũng đúc được
cookie `sub=<bất kỳ>`"* — nhưng Hoà chỉnh đúng chỗ: **không chờ "Electron hoàn hảo"**. Identity
Boundary Probe (`scripts/proof/identity-boundary.mjs`, 13/13) đã chứng minh ở **production
runtime thật** rằng thiếu `AUTH_SECRET` là route **từ chối phục vụ (500)**, và cookie ký bằng
hằng số công khai `dev-secret-change-me` **không mở được cửa**. Nền danh tính đủ vững để làm
access — miễn là **additive, sau cờ, không bật enforcement rộng trước proof**.

Probe cũng phát hiện một điều quan trọng cho bản đóng gói: **`next start <appRoot>` nạp
`<appRoot>/.env`**. Bản đóng gói KHÔNG chứa `.env` (`package.json → build.files`), nên
`AUTH_SECRET` chỉ đến từ `<userData>/config.json` — probe dựng appRoot tạm **không có `.env`**
đúng vì lý do đó. Chạy probe trên gốc repo là tự cho mình một secret và **không bao giờ thấy
fail-closed bắn**.

**`NOT ASSESSED` còn lại của R1:** binary `.app` đã ký/đóng gói · `prisma db push` lúc khởi động ·
auto-update.

---

## 2 · WAVE 1 — nối dây. Mỗi mục một PR, mỗi mục lùi được bằng một `git revert`

| # | việc | trạng thái | bằng chứng | lùi |
|---|---|---|---|---|
| **W1-1** | R8 `library/[id]/file` — phạm vi đọc **sau cờ** + traversal **không cờ** | ✅ **XONG** | `library-file-scope.mjs` 12/12 · `access-scope.test.ts` 14/14 | revert 2 tệp |
| **W1-2** | **Shared access primitive** `projectScope`/`visibleProjectIds`/`projectScopeWhere` | ✅ **XONG** — cứng hoá, **0 caller**, chưa đổi hành vi nào | `access-scope.mjs` 19/19 (7 ca đồng thuận với `assertProjectAccess`) | revert 1 tệp |
| **W1-3** | Bật lọc ở `dashboard` (3 truy vấn) — bề mặt **chỉ đọc** | ⏭️ kế tiếp | cần: 2 tài khoản 2 dự án · **admin vẫn thấy tất cả** | cờ + revert 1 tệp |
| **W1-4** | `home/summary` + `flows`: `userId: self` → phạm vi. Sửa luôn **under-fetch** | sau W1-3 | member được mời **thấy** dự án — *tính năng*, không chỉ vá | cờ + revert 2 tệp |
| **W1-5** | **Đọc lại spec đã duyệt** — panel gọi `GET /api/asset-representation` (route có sẵn, 0 caller) | song song | duyệt → F5 → mở lại đúng tờ spec; sửa → **2 hàng**, hàng cũ nguyên | revert 1 tệp |
| **W1-6** | **Ghi visual-generate xuống đĩa** — `nhanDeXuat()` ghi ảnh **và** `XuatXu` | song song | dựng ảnh → F5 → ảnh **và** model/version/credit còn nguyên (hôm nay trượt) | cờ + revert 1 tệp |
| **W1-7** | **Integrity `.idfc`** — nối `sha256Hex`+`IfpackManifest` của `ifpack.ts`; `ParsedIdfc.x` để **không mất khoá lạ** | song song | `idfc-roundtrip.mjs` CA 6 đang **ĐỎ đúng đắn** — nó là bài kiểm sẵn cho lát này | revert 2 tệp |
| **W1-8** | **`lastImportIdfcError()` cho JSON hỏng** — ca hỏng phổ biến nhất đang là ca duy nhất câm | song song | `idfc-roundtrip.mjs` CA 3.2 | revert 1 tệp |
| **W1-9** | **Material Adapter Sandbox** — mapping hợp đồng · preview/staged diff · người xác nhận · rollback · provenance · nhãn cũ/stale · 20 bản ghi rights-cleared | song song | ⛔ **CẤM live vendor upsert và CẤM đưa giá vào BOQ** cho tới khi API/export thật của nhà cung cấp được xác minh | cờ |
| **W1-10** | **Vitals/UX research** — Target/Reject storyboard + state contract | song song | ⛔ **không dựng lookalike, không code visual production** trước khi có Design Authority candidate. Mắt & chuyển động cuối cùng: **chỉ Hoà** — nhưng không chặn lane khác | tài liệu |

**Cấm gộp W1-3 với W1-4.**

## 3 · WAVE 2 — đổi cấu trúc. Chỉ mở sau khi Wave 1 xanh trên runtime

| # | việc | quyết định chặn | vì sao phải chờ |
|---|---|---|---|
| **W2-1** | `Tenant` + `tenantId` **nullable** trên **9 bảng gốc** (phương án (c) của Lane A), backfill 1 tenant, **chưa ai đọc cột** | ✅ **U1 ĐÃ ĐÓNG** (Hoà 26/08): Packet 003 quyết **IF là multi-studio/tenant theo core contract**; MVP có thể chỉ hiện TTT. U1 **gỡ khỏi danh sách chặn** — W2-1 là việc phải làm, không phải việc chờ | expand-only, nhưng kéo theo **quả mìn**: `ProductSpec.room`/`confidence` đã khai schema **chưa `db push`** — `prisma generate` sai lúc là **mọi đọc/ghi ProductSpec chết ở runtime**. Phải gộp cùng một lần push, sao lưu `dev.db` trước |
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

- **Lane D (Vitals/UX)**: **ĐÃ MỞ** (W1-10) — dùng toàn bộ reference Hoà đã cung cấp + hiện vật
  thiết kế canonical đang có. Đầu ra bắt buộc: **Target/Reject storyboard + state contract**.
  **Không lookalike, không code visual production** trước Design Authority candidate. Mắt và
  chuyển động cuối cùng vẫn **chỉ Hoà** — nhưng không chặn lane khác.
- **Bậc Electron ĐÓNG GÓI** (binary `.app`) cho R1/R3/R8: chưa dựng bản đóng gói trong phiên này.
  Bậc *production server runtime* thì đã chạm (13/13).
- **Nhãn tổng release/security = `PARTIAL`** cho tới khi có ĐỦ: binary đóng gói **và**
  cross-tenant negative có proof. Từng mục có thể `PASS` trong scope của nó; nhãn tổng thì không.
- **Trạng thái thật của cột `ProductSpec.matId` trên `dev.db`**: chưa đọc được (không có
  `sqlite3` trong môi trường của lane).
- **Cross-tenant negative** ở mọi mục: `NOT ASSESSED` cho tới khi W2-1 tồn tại.
