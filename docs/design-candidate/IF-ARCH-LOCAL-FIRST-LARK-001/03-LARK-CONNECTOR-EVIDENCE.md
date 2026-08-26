# ③ LARK CONNECTOR EVIDENCE

> **Nguồn:** Phiên B · Lark/HRM Audit — read-only, không gọi API Lark, không lấy dữ liệu nhân sự thật.
> HEAD `a08378a` · nhánh `checkpoint/2026-08-24-control-plane`

---

## KẾT LUẬN NHÃN: **`ACTIVE CONNECTOR`**

Không phải `UNUSED` — có route pull thật, UI tiêu thụ thật.
Không phải `PARTIAL LOCAL MAPPING` — có gọi HTTP thật tới Lark bằng `tenant_access_token`.
**Không phải `VERIFIED SOURCE`** — 0 test chạm connector, đường ghi ngược chặn cứng và chưa viết.

| bằng chứng | file:dòng | loại | tin cậy |
|---|---|---|---|
| Lấy `tenant_access_token` từ `LARK_APP_ID/SECRET` | `lib/integrations/providers/lark.ts:112-131` | OBSERVED | cao |
| Route pull ghi vào 2 bảng mirror | `app/api/lark-tasks/sync/route.ts:41,63,84` | OBSERVED | cao |
| UI 3 tab đọc mirror | `components/dashboard/LarkPanels.tsx:56` · `components/Dashboard.tsx:150` | OBSERVED | cao |
| **0 test** chạm connector/route/model | — | OBSERVED | cao |
| Ghi ngược chặn cứng, hàm chưa viết | `lib/integrations/providers/lark-write.ts:33,58-65` | OBSERVED | cao |

---

## 1 · 🔴 KHÔNG CÓ TENANT ISOLATION — phát hiện nặng nhất

**Repo không có bất kỳ khái niệm tenant/organization nào.** Dữ liệu Lark đổ vào **bảng dùng chung toàn hệ**.

| bằng chứng | file:dòng | tin cậy |
|---|---|---|
| Grep `tenant\|organizationId\|orgId` trong schema: **1 hit, trong COMMENT** | `prisma/schema.prisma:60` | cao |
| `LarkPersonRef` **không có** khoá phân tách — roster toàn công ty trong bảng phẳng | `prisma/schema.prisma:444-454` | cao |
| `GET /api/lark-tasks` dùng `findMany()` **không WHERE** ⇒ trả **toàn bộ** task + **toàn bộ hồ sơ nhân sự** (họ tên · chức danh · phòng ban) cho **mọi user đăng nhập**, không kiểm `ProjectMember` | `app/api/lark-tasks/route.ts:19-23,45-51` | cao |
| Tương phản: `Project`/`Task` **có** `assertProjectAccess`; mirror Lark **không** | `status/route.ts:55` vs `route.ts:16-20` | cao |
| Env cũng đơn-tenant: một `LARK_APP_ID/SECRET/APP_TOKEN` toàn tiến trình | `lib/integrations/providers/lark.ts:42,46,114-115` | cao |

⇒ **Sản phẩm hiện tại là single-tenant nội bộ một studio.**
Bán/host cho nhiều khách sẽ **trộn roster nhân sự giữa các khách trong cùng bảng**.

> Đây chính là mục `0.1` — nút thắt duy nhất trong `09-IMPLEMENTATION-BACKLOG`.
> Bằng chứng này **xác nhận** nó, không còn là giả định.

## 2 · RÀNG BUỘC VÀO MỘT BASE CỤ THỂ

| phát hiện | file:dòng | loại |
|---|---|---|
| `table_id` thật **hardcode làm default** | `lib/integrations/providers/lark.ts:225,233` | OBSERVED |
| Mapping bằng **tên cột tiếng Việt literal** (`f['Tài khoản']`, `f['Họ tên']`) | `app/api/lark-tasks/sync/route.ts:52-59,74-80` | OBSERVED |
| Đổi tên cột bên Lark ⇒ **sync âm thầm ghi rỗng, không lỗi** | như trên | INFERENCE · cao |
| Không có cơ chế cấu hình mapping cột — **khác hẳn** `/api/colors/lark` vốn cho người dùng tự ghép | so sánh hai route | OBSERVED |

⇒ Ba model chỉ đúng với **một base + một bộ tên cột**.
**Hệ quả cho hợp đồng trung tính:** adapter Lark **không thể dùng lại** cho khách thứ hai nếu không
tách phần **cấu hình mapping cột** ra khỏi mã. Đây là việc bắt buộc trước `3.3` trong backlog.

## 3 · LỆCH ĐỌC/GHI — bốn chỗ

| phát hiện | file:dòng | loại |
|---|---|---|
| `raw` (cả hai model) **CHỈ GHI, KHÔNG AI ĐỌC** | `sync/route.ts:60,81` vs `route.ts:32-51` | OBSERVED |
| `resolveUserByLarkAccount` **không có caller nào** — hàm mồ côi | `lib/integrations/lark-bridge.ts:41` | OBSERVED |
| 🔴 `LarkTaskRef.status` bị người dùng đổi (kéo Kanban) rồi **sync sau đó ghi đè ngược**, **im lặng** | `status/route.ts:89` ↔ `sync/route.ts:63` | INFERENCE · cao |
| `skippedCodeCount` đếm rồi trả về nhưng UI không hiện | `sync/route.ts:44,96` | OBSERVED · vừa |

> Chỗ thứ ba là **mất việc của người dùng**. Nó cũng chứng minh vì sao luật
> `READ-ONLY IMPORT + PREVIEW + HUMAN CONFIRM` là đúng: hiện tại sync **áp thẳng, không hỏi**.

## 4 · BẢO MẬT / VẬN HÀNH

| phát hiện | file:dòng | rủi ro |
|---|---|---|
| **Không timeout** trên **bất kỳ** call Lark nào — `fetch` trần | `lib/integrations/providers/lark.ts:82,92` | base treo ⇒ giữ worker Next vô hạn; retry 4 lần nhân thêm |
| `/api/colors/lark` cho **user thường** chỉ định `tableId` tuỳ ý, đọc bằng **token cấp tổ chức** | `app/api/colors/lark/route.ts:22-24,48,56` | đọc **bất kỳ bảng nào** Lark app có quyền — kiểu IDOR |
| Lỗi Lark trả **nguyên văn** ra client | `app/api/colors/lark/route.ts:60` | lộ chi tiết nội bộ base |
| Token là **credential cấp app**, không gắn user | `lib/integrations/providers/lark.ts:7,120` | mọi user IF đọc qua **cùng một danh tính Lark** |
| Không rate-limit; chặn duy nhất là cửa `isAdmin` | `app/api/lark-tasks/sync/route.ts:18-20` | — |

## 5 · TEST — 0% trên connector và model

Bốn tệp test tồn tại nhưng **chỉ phủ hàm thuần** (sort, normalize, map bản ghi).
**Không test nào** chạm `prisma.larkTaskRef/larkPersonRef/larkUserMap`,
`getTenantToken`/`listAllRecords`/retry/lỗi 502, hay **5 route Lark**.

Runner là script `sucrase-node` tự chế, không phải runner chuẩn.

## 6 · PII — sạch trong Git, **có trên đĩa**

| | |
|---|---|
| ✅ Không có `prisma/seed*`; **không tệp tracked nào** chứa dữ liệu nhân sự | OBSERVED · cao |
| ✅ `prisma/*.db` **đã gitignore** (`.gitignore:10`) | OBSERVED |
| ⚠️ `prisma/dev.db` **38.5 MB** trên đĩa, có bảng `LarkPersonRef` đã migrate: tài khoản · họ tên · chức danh · phòng ban + `raw` JSON nguyên bản. **Phiên B không mở, không đếm dòng** — đúng yêu cầu | OBSERVED |
| ⚠️ **12 bản backup `.db`** cùng thư mục, **không có chính sách xoá/lưu trữ** | OBSERVED |
| ⚠️ `raw` lưu **toàn bộ** field gốc — **vượt xa** 5 cột "an toàn" mà comment schema tự cam kết (`:441-443`). Base thêm cột lương/CMND ⇒ **sync tự nuốt vào `raw` không cần migrate** | INFERENCE · cao |

> Mục cuối là **rủi ro PII sinh sôi âm thầm**. Nó không cần ai làm sai — chỉ cần
> bên Lark thêm một cột.

## 7 · KẾT LUẬN CHO HỢP ĐỒNG TRUNG TÍNH

1. **Giữ nguyên** quyết định mặc định của đề bài: Lark = `TENANT CONNECTOR CANDIDATE`,
   **không** phải source-of-truth. Bằng chứng ủng hộ: 0 test, ghi ngược chưa viết, ràng buộc một base.
2. **Xác nhận** `isCrea` **không được map** — nó là cờ riêng của một tổ chức (`schema:451`).
3. **Xác nhận** Lark **không cung cấp** `LegalEntity` · `Division` · `Team` · `ReportingLine`.
   `department` chỉ là **chuỗi tự do**.
4. **Bổ sung mới từ bằng chứng:** adapter phải tách **cấu hình mapping cột** ra khỏi mã,
   nếu không thì khách thứ hai không dùng được.
5. **Bổ sung mới:** luồng hiện tại **áp thẳng, không preview** — trái luật đã chốt.
   Chuyển sang `READ-ONLY IMPORT + PREVIEW + HUMAN CONFIRM` là **sửa hành vi có thật**, không phải thêm tính năng.
