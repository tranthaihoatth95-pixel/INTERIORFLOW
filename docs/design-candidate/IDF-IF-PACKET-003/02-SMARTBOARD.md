# SMARTBOARD · IF — chỉ mục ĐỊNH TUYẾN

> ⚠️ **Tệp này KHÔNG thay thế nguồn nào.** Nó chỉ trỏ đường.
> Mâu thuẫn giữa tệp này và nguồn canonical ⇒ **nguồn canonical thắng**.
> HEAD `6c9712a` · cập nhật 26/08

## Nguồn chân lý — đọc theo thứ tự

| ID | nguồn | trả lời câu gì | đọc khi |
|---|---|---|---|
| `SB-001` | `docs/control/IF-CURRENT-STATE.md` | đang ở đâu · việc kế tiếp | **luôn, đầu tiên** |
| `SB-002` | `docs/control/IF-CANONICAL.md` | IF **LÀ GÌ** · luật bền | **luôn** |
| `SB-003` | `docs/control/IF-UXUI-OPERATING-MEMORY.md` | sai lầm đã trả giá | trước mọi việc giao diện |
| `SB-004` | `docs/control/IF-TOOLING-RECEIPT.md` | năng lực **THẬT** đã xác minh | trước khi dùng công cụ |
| `SB-005` | `docs/ADR-Q0-ARCHITECTURE-DECISIONS-2026-08-19.md` | **9 ADR ACCEPTED** Q1–Q9 | trước khi quyết kiến trúc |
| `SB-006` | `docs/IF-ARCHITECTURE-BLUEPRINT.md` | các mảnh **lắp với nhau** ra sao | khi cần bức tranh hệ |

## Gói candidate — chưa phải nguồn chân lý

| ID | gói | trạng thái | commit |
|---|---|---|---|
| `SB-101` | `docs/design-candidate/IF-ARCH-LOCAL-FIRST-LARK-001/` | `CANDIDATE` · 10 mục · **ADR Q10–Q13** | `477cbb7` |
| `SB-102` | `docs/design-candidate/TTT-PROFILE-UX-001/` | `CANDIDATE` · IF-PO-01 · IF-PO-14 · **2/13** | `818cd2a` |
| `SB-103` | `docs/design-candidate/IDF-IF-PACKET-003/` | `CANDIDATE` · packet 003 + GAP-MAP | *(lượt này)* |

## Canvas thiết kế

| ID | canvas | nội dung |
|---|---|---|
| `SB-201` | `interiorflow-trang-chu-va-rail.html` | **43 artboard**, 10 nhóm — bộ màn IF |
| `SB-202` | `people-and-organization.html` | IF-PO-01 · IF-PO-14 |

> Cả hai là **tệp độc lập**, mở bằng trình duyệt, không cần mạng.

## Định tuyến nhanh

| cần gì | đi đâu |
|---|---|
| năng lực nào đã có / thiếu | `SB-103` → `01-IF-CORE-GAP-MAP.md` |
| rủi ro an ninh + file:dòng | `SB-101` → `07-RISKS-AND-UNKNOWN.md` |
| Lark là gì trong kiến trúc | `SB-101` → `03-LARK-CONNECTOR-EVIDENCE.md` |
| hợp đồng People & Organization | `SB-101` → `04-NEUTRAL-CONTRACT.md` |
| ADR đã chốt | `SB-005` (Q1–Q9) · đang chờ: `SB-101` (Q10–Q13) |
| luật UX đã trả giá | `SB-003` |
| ai đang giữ bút | `SB-001` → ô **NGƯỜI GHI HIỆN TẠI** |

## 📋 SỔ BẰNG CHỨNG — nhãn mang theo BỀ MẶT ĐÃ CHẠM

> Luật F-16: `PASS` một mình là chữ rỗng. Mỗi nhãn nói **đã chạm bề mặt nào**.
> Bậc chưa chạm ghi `NOT ASSESSED` **kèm lý do**.
>
> 🔴 **NHÃN TỔNG — release/security overall = `PARTIAL`** (Hoà chốt 26/08), và giữ `PARTIAL` cho
> tới khi có ĐỦ hai thứ: **binary Electron đã đóng gói** và **cross-tenant negative có proof**.
> Không mục nào dưới đây được dùng để nâng nhãn tổng lên rộng hơn bằng chứng của chính nó.

| # | việc | verdict theo scope | bằng chứng | bậc CHƯA chạm |
|---|---|---|---|---|
| R1 | `AUTH_SECRET` fail-closed | 🟢 **`PASS — production server runtime (Electron-equivalent env)`** | `scripts/proof/identity-boundary.mjs` **13/13** · `auth-failclosed.test.ts` 11/11 · `auth-failclosed.mjs` 3/3 | binary `.app` đã đóng gói · `prisma db push` lúc khởi động · auto-update |
| R3 | `IF-SECURE-ARTIFACT-DELIVERY-001` | 🟢 **`PASS — single-tenant HTTP runtime slice`** | `comment-artifact.test.ts` 29/29 · `secure-artifact-delivery.mjs` **12/12** · lại được xác nhận ở production runtime (identity-boundary CA 5-8) | Electron đóng gói · **cross-tenant negative** |
| R8 | `GET /api/library/[id]/file` — phạm vi đọc + traversal | 🟢 **`PASS — single-tenant HTTP runtime slice, cả hai nhánh cờ`** | `access-scope.test.ts` 14/14 · `library-file-scope.mjs` **12/12** (cờ TẮT giữ nguyên kho dùng chung · cờ BẬT siết về chủ/admin · traversal chặn ở CẢ HAI) | cross-tenant negative |
| W1-2 | shared access primitive `projectScope` | 🟢 **`PASS — DB runtime (dev.db thật), 0 caller`** | `scripts/proof/access-scope.mjs` **19/19**, gồm 7 ca **đồng thuận** với `assertProjectAccess` | hành vi route: **chưa bật** — cố ý |
| `.idfc` | round-trip · migration · apply 2D · integrity | 🟠 **`PARTIAL — 35/39, 4 ca ĐỎ là bug thật`** | `scripts/proof/idfc-roundtrip.mjs` | integrity `MISSING` · `keepsIdentity=false` cho **0/60** seed |
| R2 | content-integrity gate (report-only) | ⚪ **`NOT ASSESSED`** | — | chưa bắt đầu |

### 🐞 Bug mã sản xuất đo được, CỐ Ý CHƯA VÁ (không nằm trong scope lát này)

| bug | file:dòng | hệ quả |
|---|---|---|
| `importIdfc` **nuốt khoá lạ** — dựng lại `{meta, body, commerce}`, `meta` theo whitelist 13 trường | `lib/cad/idfc.ts:415-442` | mở file có `xFromPhoto` → lưu lại → **mất trên đĩa**, không cảnh báo. Trái với chính kỷ luật KS4 mà file tự khai |
| `lastImportIdfcError()` trả `null` cho JSON hỏng | `lib/cad/idfc.ts:~395` | ca hỏng phổ biến nhất (file cụt/hỏng) là ca DUY NHẤT không có câu chữ cho người dùng |
| thả `.idfc` **mất danh tính component** — `keepsIdentity=false`, **0/60** seed giữ được | `lib/cad/library-item-resolve.ts:56-70` | nét vào bản vẽ nhưng không mang `specId` ⇒ **không bao giờ tới BOQ như một món**. Đây là điều kiện tiên quyết của W2-3 |

### R3 — điều đo được, không phải điều suy ra

- Lỗ: `saveImage()` cũ ghi `public/comments-images/` → URL tĩnh, **không qua `getSessionUser()`**,
  trong khi siêu dữ liệu cùng góp ý (`comments-review.json`) đứng sau 401. Ảnh và chữ của **cùng
  một góp ý** xếp hai hạng bảo mật khác nhau.
- **Sửa lại một cáo buộc thừa hưởng:** phiên trước ghi PATCH/DELETE thiếu xác thực. Đo thật:
  **cả 4 method đều gọi `getSessionUser()` và 401**; DELETE-all còn đòi `isAdmin`. Thiếu là kiểm
  **quyền sở hữu**, không phải thiếu xác thực. Không phóng đại lỗ.
- Lỗi thứ hai đi kèm: trong Electron đóng gói `process.cwd()` = `userData`, nên đường cũ ghi vào
  nơi Next **không phục vụ tĩnh** ⇒ tính năng **đã hỏng sẵn** ở bản đóng gói. Route đọc có xác
  thực vá **cả lỗ rò lẫn chỗ hỏng**.
- Migration **additive**: `uploads/comment-images/` cho bản ghi mới · đọc **ngã về** đường cũ và
  đánh dấu `legacy` · **không move, không delete, không rewrite** · `artifactId` bền = id góp ý ·
  `sha256` + `bytes` ghi kèm · cờ lùi `IF_COMMENT_IMAGE_PUBLIC=1` trả lại hành vi cũ nguyên vẹn.
- Siết thêm không nằm trong scope gốc nhưng miễn phí khi đã chạm: sniff **magic bytes**, nên SVG
  hay HTML đội lốt `data:image/png` bị **từ chối ghi** (vector XSS lưu trữ).

## 🔴 Việc chặn — trạng thái thật

| # | việc | trạng thái |
|---|---|---|
| 1 | **Người ghi sản xuất** | ✅ Hoà chỉ định `interiorflow-d0`, hiệu lực ngay (25/08) |
| 2 | **Q10 tenancy** | 🟠 packet 003 chọn đa tenant; **Lane A** đo xong và khuyến nghị phương án (c). Câu chặn còn mở: *một cài đặt có bao giờ phục vụ >1 studio không?* — quyết định của Hoà |
| 3 | **Q12 fail-closed secret** | 🟠 đã viết + chứng minh mức hợp đồng; chờ bậc Electron |

## 🧭 Năm gói Research-to-Spec (read-only) — 26/08

| lane | chủ đề | nhãn | phát hiện nặng nhất |
|---|---|---|---|
| A | tenant/access contract | — | `visibleProjectIds()` có sẵn nhưng **0 caller** và **lệch ngữ nghĩa** với `assertProjectAccess` ở 3 điểm (admin · soft-delete · bucket ẩn) |
| B | `.idfc` | **PARTIAL-CONTRACT** | hợp đồng **thật, có migration v1→v3, 16 tệp test** — nhưng là hợp đồng *một-mẫu-một-mặt*; 3D/BOQ/present khai trong schema, **0 consumer**; **0 integrity** trong khi `lib/cad/ifpack.ts` đã có sẵn sha256+manifest chưa được nối |
| C | Material Connector | **PARTIAL** | `atlas-materials/sync` **chưa chạy thật lần nào**, **0 caller**, và tên cột là **placeholder chưa xác minh** → bật lúc này là ghi **giá sai** vào BOQ, âm thầm. Rights/license trên bản ghi vật liệu: **trắng** |
| D | Vitals/UX | ⚪ **BLOCKED-BY-INPUT** | cần bộ tham chiếu Hoà cung cấp + nghiên cứu hợp pháp; **không dựng visual lookalike** — chưa mở |
| E | ba luồng MVP | F1 **CANDIDATE-ONLY** · F2/F3 **EXISTS-PARTIAL** | lỗ **chung** của cả ba: thứ mang xuất xứ đẹp nhất thì **hoặc không được ghi** (F3-visual, chỉ sống trong RAM) **hoặc ghi rồi không đọc lại được** (F2, `GET /api/asset-representation` **0 caller**). *Sửa "đọc lại" rẻ hơn nhiều so với viết mới.* |

> Cả năm là **ĐỀ XUẤT**, không lane nào tuyên PASS. Kế hoạch hợp nhất: `03-INTEGRATION-PLAN.md`.
