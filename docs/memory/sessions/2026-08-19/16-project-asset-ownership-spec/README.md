# 16 · Reference Ownership → Project Usage (many-to-many) — SPEC, chưa code

> Phiếu nạp: Hoà chốt sản phẩm mới — **một ảnh/reference có thể dùng bởi NHIỀU Project**. Điều
> này ĐẢO đề xuất H12 của round trước ("thêm `projectId` vào `LibraryAsset`" — SAI, đó là 1-N).
> ⓪ đo lại: reality khớp 100% (HEAD `c7f3ac8`, backup `964f7aa` local=remote, 17 commit ahead
> main). 5 phiên peer vẫn sống. LOOK INSIDE xong, MAIN spot-check 3 claim — khớp 100%.
> **STOP ở SPEC theo đúng điều kiện dừng của phiếu — đây là schema migration cần Hoà.**

## A0 · ĐÍNH CHÍNH — chưa đọc ADR-Q4/Q5 trước khi viết spec ban đầu (lỗ LOOK INSIDE, peer Execution bắt)

Round trước tôi viết spec KHÔNG đọc `docs/ADR-Q0-ARCHITECTURE-DECISIONS-2026-08-19.md`. Peer session
"Execution" (đã làm Wave 0/Blueprint/ADR) chỉ ra đúng lỗ này. Đọc lại Q4/Q5:

- **Q4 (Master Library sở hữu binary thế nào)**: bàn `AssetBlob` để dedupe theo hash — **KHÔNG
  conflict**, orthogonal với join-table Project↔Asset (Q4 là tầng binary/storage, spec của tôi là
  tầng usage/relation).
- **Q5 (Files vs Master Library)**: quyết định *"Files = raw/project inputs. Master Library =
  understood reusable content"*, pipeline `FILES → UNDERSTAND → NORMALIZE → PROMOTE → MASTER
  LIBRARY`. Đề xuất model `ProjectFile { projectId (FK 1-N), name, mime, path, contentHash }` —
  **1 file thô thuộc ĐÚNG 1 project TRƯỚC KHI promote**. Đây KHÁC bản chất với join-table tôi đề
  xuất (N-N SAU KHI đã promote thành `LibraryAsset` — 1 asset đã "hiểu" được nhiều project THAM
  CHIẾU/DÙNG). **Hai quyết định BỔ SUNG nhau, không thay thế nhau**: điểm nối là bước "Promote" —
  đó chính xác là khoảnh khắc join-table của tôi sinh ra hàng đầu tiên (project promote 1
  `ProjectFile` → `LibraryAsset` mới HOẶC gắn vào `LibraryAsset` đã có → tự động thêm 1 dòng join
  `(projectId, assetId, usage='promoted')`).
- Q5 CHƯA thấy trạng thái ACCEPTED tường minh trong đoạn đọc — cần đọc thêm để xác nhận trước khi
  Hoà chốt join-table cuối cùng, tránh 2 quyết định đi hai hướng.

⚠️ **Sửa mục E (READY/WAIT-H9/TRUE-MISSING) round trước**: câu hỏi "NEED HOÀ" phải bổ sung thêm
④ **join-table Project↔Asset có nên đợi Q5 (ProjectFile/Promote) code trước không, hay làm độc lập
rồi nối sau?** — đây là câu hỏi trình tự thi công, không phải xung đột kiến trúc.

## A · Negative evidence — vì sao đây là NEW, không REUSE/EXTEND

| Primitive soi | Bản chất thật | Vì sao không dùng được |
|---|---|---|
| `ProjectMember` (`schema.prisma:119-143`) | Join-table N-N THẬT (Project↔User, 2 FK `@relation` + `@@unique([projectId,userId])`) | Nối 2 model KHÁC (Project, User) — chỉ học được **hình dạng bảng**, không REUSE được cho Asset |
| `ExternalRef` (`:602-635`) | Mirror **1-1** ra hệ ngoài (`@@unique([system,externalId])` = 1 bản ghi ngoài ↔ đúng 1 entity lõi) | Ép dùng cho N-N nội bộ là sai mục đích thiết kế (comment tự khai "ID của MỌI hệ ngoài"); domain hiện tại `task|project|person|material` chưa từng có `asset`/`image` |
| `Task.stage/workspaceId/entityId` (TaskContext Link) | 3 cột string optional, **1 giá trị mỗi cột** | Không mã hoá được "N project cho 1 asset" — bản chất toán học là 1-1, không phải N-N |
| `ProductSpec.imageAssetId` (`:408`) | String thuần, không `@relation`, FK mềm 1 chiều | 1 ProductSpec → tối đa 1 Asset, không giúp N-N |
| API `POST /api/library` | Chỉ ghi `userId` (spot-check: `route.ts:88`) | Chưa từng có endpoint "attach asset vào X" nào tồn tại |

**Kết luận: cần model MỚI** (join-table), theo đúng hình dạng `ProjectMember` đã chứng minh repo biết làm đúng khi cần (id riêng, `@relation` cả 2 phía, `@@unique` composite, index theo chiều truy vấn nóng, soft-delete tách khỏi unique).

## A1 · HOÀ CHỐT 3 ĐIỂM — bản dùng, đè các phần suy đoán ở trên

1. **Xác nhận lại**: KHÔNG `projectId` đơn trên `LibraryAsset`. N-N sau Promote. (đúng spec cũ)
2. **Field tối thiểu**: `projectId · assetId · usage · createdAt · createdBy? · note?`. KHÔNG FK
   Workspace/Canvas trước H9. **REUSE ContextPointer/TaskContext nếu đã có** — LOOK INSIDE xác
   nhận: không có type `ContextPointer` riêng (grep 0 kết quả), chỉ có **PATTERN** của
   `Task.stage/workspaceId/entityId` (3 cột string optional, không FK) — đây là thứ được REUSE
   (hình dạng field, không phải một type import được).
3. **KHÔNG mặc định hợp nhất `RefUsage`↔`LibraryAsset.usage`** — xem bảng mapping mục C2 dưới.
4. **Thứ tự thi công (Hoà chốt, không đổi)**: Q5 ProjectFile/raw-source → Understand/Review →
   Promote → LibraryAsset → **Project↔Asset N-N usage** → H9 Workspace/Canvas context →
   downstream genealogy/where-used. ⇒ **join-table này ĐỨNG SAU Q5 trong hàng đợi thi công** —
   Q5 (`ProjectFile`) hiện **CHƯA CÓ CODE** (ADR-Q5 tự khai "CHƯA IMPLEMENT"), nên **implementation
   của join-table CHƯA MỞ được round này**, đúng lệnh "mở implementation sau khi Q5/H9 dependency
   cho phép".
5. **Ngoại lệ xác nhận đã LÀM ĐÚNG**: nguồn ngoài (Unsplash/Openverse) tạo `LibraryAsset` trực
   tiếp KHÔNG cần qua `ProjectFile` — đây chính xác là CONNECT-1 đã làm (`saveLibraryAssetFromBuffer`
   + `POST /api/library/from-url`, checkpoint `dee7ee8`). Khi nhiều Project dùng cùng asset: thêm
   nhiều hàng usage-relation, KHÔNG nhân bản `LibraryAsset` — đây là lý do CHÍNH mà join-table
   phải là bảng riêng (không phải cột trên LibraryAsset).

## C2 · Bảng mapping RefUsage ↔ LibraryAsset.usage — giá trị THẬT (không suy đoán)

Xác nhận: **CÙNG một tập giá trị, cùng một câu hỏi** — cả hai đều trả lời *"loại nội dung này
dùng chung cho việc gì"* (phân loại Ở CẤP KHO, không theo project nào).

| Giá trị | `RefUsage` (`lib/refingest.ts:16`) | `LibraryAsset.usage` (`LIBRARY_USAGES`, `lib/server/library-save.ts:17`) | Nơi set thật (không phải test) |
|---|---|---|---|
| `ref-render` | ✅ | ✅ | mặc định POST, `library-save.ts:64` |
| `slide` | ✅ | ✅ | `PresentEditor`/`ConceptForm` (grep `usage: 'slide'`) |
| `material` | ✅ | ✅ | `lib/library/db-items.ts:77`, `ConceptForm` |
| `layout` | ✅ | ✅ | khai trong schema comment, chưa thấy write-site thật ngoài default |
| `cad` | ✅ | ✅ | khai trong schema comment, chưa thấy write-site thật |
| `brief` | ✅ | ✅ | khai trong schema comment (PDF khách gửi) |
| `furniture` | ✅ | ✅ | `db-items.ts:78` |

**Kết luận: `RefUsage` và `LibraryAsset.usage` là MỘT taxonomy (cấp kho), không phải 2 taxonomy
song song như tôi ghi sai ở round trước** — schema comment tự ghi "RefUsage:" ngay trên cột
`usage`, và `LIBRARY_USAGES` const dùng LẠI đúng 7 giá trị. Đính chính: mục C (round trước) nói
"0 cầu nối code" — ĐÚNG về mặt IndexedDB↔DB (2 nơi lưu vật lý khác nhau), nhưng SAI khi nói đó là
2 taxonomy khác nhau — chúng là CÙNG MỘT từ vựng, chỉ khác NƠI LƯU (RefManifest/IndexedDB per-máy
vs LibraryAsset/DB per-user).

**Field `usage` trên join-table (relation-level) là CÂU HỎI KHÁC** — không phải "loại nội dung
gì" mà là *"project này đang dùng nó trong bối cảnh nào"* (đúng câu hỏi Golden Journey R4
USE-INTENT-KNOWN — brainstorm/render/material-reference/component-candidate/DNA/present...).
Theo đúng chốt Hoà mục 3: **KHÔNG hợp nhất 2 cấp**. Đề xuất: field `usage` trên join-table
**REUSE cùng chuỗi giá trị `LIBRARY_USAGES`** làm vốn từ khởi điểm (không bịa taxonomy thứ ba),
nhưng là **CỘT ĐỘC LẬP** — 1 asset có `usage='material'` ở cấp kho vẫn có thể được project A gắn
với `usage='ref-render'` (dùng làm cảm hứng render) trong khi project B gắn `usage='material'`
(dùng thẳng làm vật liệu) — đúng ví dụ Hoà nêu ("Project A chỉ thích lighting, Project B chỉ lấy
material").

## B · TARGET CONTRACT (SPEC — chưa đặt tên chính thức, chưa viết Prisma)

Tách rõ 2 tầng theo đúng chỉ dẫn phiếu:

**ASSET (đã có — `LibraryAsset`, KHÔNG đổi thành sở hữu bởi 1 project)**
- source truth: `id`, `userId` (người upload — GIỮ NGUYÊN, khác nghĩa "ai dùng"), `mime`, `path`, `w/h`
- provenance còn thiếu (đã ghi ở round trước, H12 cũ — vẫn đúng nhưng KHÔNG phải field ownership):
  `sourceUrl?`, `sourceProvider?`, `author?`, `license?` — hiện chỉ sống trong `tags` CSV tự do

**PROJECT-ASSET USAGE (join-table MỚI, theo hình `ProjectMember`)**
| Field | Kiểu | Ghi chú |
|---|---|---|
| `id` | cuid | riêng, không dùng composite làm PK (học `ProjectMember`) |
| `projectId` | FK thật → `Project` | |
| `assetId` | FK thật → `LibraryAsset` | |
| `workspaceId?` | string optional, **KHÔNG FK** | theo pattern TaskContext Link — chờ H9, không khoá vào model chưa tồn tại |
| `canvasId?` | string optional, **KHÔNG FK** | cùng lý do |
| `usage` | string (enum-lỏng, xem mục C) | |
| `note?` | string | |
| `addedBy` | FK → `User` | ai gắn |
| `createdAt` | DateTime | |
| `deletedAt?` | DateTime, **tách khỏi unique** (học đúng bài học comment `ProjectMember:127-130` — gỡ rồi gắn lại không đụng constraint) | |
| `@@unique([projectId, assetId, usage])` | | 1 asset có thể gắn CÙNG project với usage khác nhau (đúng yêu cầu "usage khác nhau ở từng Project") |
| `@@index([assetId])` | | truy vấn nóng: where-used ngược (asset này dùng ở project nào) |
| `@@index([projectId])` | | truy vấn nóng: project này dùng asset nào |

**KHÔNG thêm**: `revisionId`/context-pointer sâu hơn — chưa có primitive tương đương để tham chiếu (Q6/Q8 đều TRUE-MISSING, Wave 3); `status/pinned/stale` — chưa có khái niệm tương đương trong kiến trúc hiện tại, thêm là bịa field dư (đúng luật "không đoán field").

## C · Usage taxonomy — 2 taxonomy song song cần cầu nối (không đổi tên chỉ để đẹp)

`RefUsage` (`lib/refingest.ts:16`, sống trong IndexedDB) và `LibraryAsset.usage` (`schema.prisma:293`,
sống trong DB) **cùng tên giá trị** (`ref-render|slide|material|layout|cad|brief|furniture`) nhưng
**0 cầu nối code** — xác nhận lại từ audit round trước, giữ nguyên. Nếu tạo join-table mới,
field `usage` của nó nên **REUSE đúng enum-lỏng này** (không tạo taxonomy thứ ba) — nhưng bảng
join là quan hệ Project↔Asset, còn `LibraryAsset.usage`/`RefUsage` đang trả lời câu khác ("loại
dùng gì nói chung, không theo project nào"). Cần Hoà xác nhận: `LibraryAsset.usage` có nên
**deprecate** khi join-table ra đời (usage chuyển hẳn xuống cấp Project-scoped), hay giữ song song
làm "usage mặc định" khi chưa gắn project nào?

## D · Golden Journey R0-R8 (checkpoint mới của phiếu)

| Checkpoint | Trạng thái hiện tại | Sau khi có join-table (nếu Hoà chốt) |
|---|---|---|
| R0 SOURCE-CAPTURE | PARTIAL (Unsplash/Openverse tìm được, "Pick hình" dead-end) | không đổi — round này không chạm provider |
| R1 ASSET-KNOWN | LIVE (`LibraryAsset` bền) | không đổi |
| R2 PROJECT-LINKED | **BLOCKED** (0 relation) | LIVE — đây là mục tiêu của spec này |
| R3 CONTEXT-KNOWN | BLOCKED | PARTIAL (workspaceId/canvasId optional string — không FK, đúng chờ H9) |
| R4 USE-INTENT-KNOWN | PARTIAL (2 taxonomy không cầu nối) | LIVE nếu C được giải |
| R5 PROMOTION-EXPLICIT | TRUE-MISSING | vẫn TRUE-MISSING (ngoài phạm vi round này) |
| R6 DOWNSTREAM-LINKED | PARTIAL (chỉ `ProductSpec.imageAssetId`) | không đổi |
| R7 WHERE-USED | TRUE-MISSING (0 index ngược) | LIVE (`@@index([assetId])` cho phép query trực tiếp) |
| R8 REOPEN-PERSISTED | PARTIAL | LIVE (DB thật, không phải IndexedDB per-máy) |

**R2 và R7 là 2 checkpoint spec này giải trực tiếp nếu Hoà chốt.**

## E · READY / WAIT-H9 / TRUE-MISSING

| Việc | Trạng thái | Vì sao |
|---|---|---|
| Model join-table `projectId+assetId+workspaceId?+canvasId?+usage` | **WAIT-HOÀ** (schema migration — đúng STOP CONDITION Part P) | đụng Prisma, cần chốt tên + field trước khi bất kỳ ai viết migration |
| `workspaceId?`/`canvasId?` optional string (không FK) | READY-TO-SPEC, không cần đợi H9 xong (pattern TaskContext Link đã chứng minh an toàn) | nhưng vẫn nằm TRONG model chờ Hoà ở trên, không tách riêng được |
| Cầu nối `RefUsage`↔`LibraryAsset.usage` | WAIT-HOÀ (câu hỏi mục C chưa có câu trả lời) | |
| Provider mới (Wikimedia/ArchDaily) | TRUE-MISSING, ngoài phạm vi — đúng luật "không build provider trước data contract" |

## Bảng tổng theo khuôn Part O

ASSET OWNERSHIP: giữ nguyên `LibraryAsset` (per-USER, KHÔNG per-project) — đúng chốt mới
PROJECT RELATION: **TRUE-MISSING, đã có SPEC** (mục B)
MANY-TO-MANY: xác nhận cần THẬT — 0 primitive REUSE được (negative evidence mục A)
PROVENANCE: không đổi so round trước (vẫn chỉ tag tự do)
LICENSE: không đổi
WHERE-USED: sẽ LIVE nếu join-table ra đời (`@@index([assetId])`)
PERSONALIZATION: không chạm round này
PROJECT DNA: không chạm round này
PROVIDER: không chạm round này (đúng luật H)
READY TO IMPLEMENT: 0 — mọi thứ round này đụng schema
WAIT-H9: workspaceId/canvasId optional field (nằm trong model chờ Hoà, không tách được)
NEED HOA: ① tên model + field cuối cùng (mục B) ② câu hỏi taxonomy (mục C) ③ có cần
`intendedUse`/`exportAllowed` cho license-per-project không (mục I của phiếu — chưa đủ evidence
legal contract yêu cầu, KHÔNG bịa)
CHƯA CHẮC: chưa xác minh Prisma provider (SQLite migration path) có ràng buộc gì đặc biệt cho
composite unique 3 cột; chưa đọc `docs/IF-CORE-SCHEMA.md` đầy đủ (chỉ trích dẫn qua comment)
HẠN DÙNG: hết hạn khi Hoà quyết mục B/C, hoặc bất kỳ ai bắt đầu viết migration.

## D · H9 migration impact (audit riêng, MAIN spot-check khớp)

**Kết luận: đường ADDITIVE khả thi kỹ thuật, không bắt buộc breaking.** Bằng chứng: `Flow.projectId
String?` đã OPTIONAL sẵn (`prisma/schema.prisma:219`, `onDelete: SetNull`) — thêm bảng `Workspace`
mới + cột `workspaceId?` song song trên `Flow` không phá dữ liệu cũ (Flow cũ tiếp tục chạy với
`workspaceId=null`).

**3 điểm cứng phải sửa nếu chen route** (`lib/scope-core.ts`): `AppScope = 'global'|'project'` (2
giá trị cứng, vô hại — không dùng để routing chặng) · `parseStageRoute()` hardcode stage ở
`segs[2]` (vỡ nếu chen `/workspaces/[wsId]/` vào giữa — PHẢI sửa) · `resolveFlowForRouteId()` giả
định Project→Flow phẳng 1 tầng (PHẢI mở rộng chữ ký hàm).

**Bẫy đặt tên đã có sẵn — PHẢI tránh khi code**: `lib/workspace.ts` (167 dòng, chỉ là hàm gọi API
Flow, KHÔNG liên quan model Workspace) · `WorkspaceMode` (bí danh của `Phase`) · `Task.workspaceId`
(string tự do, không FK) — 3 thứ ĐỒNG ÂM với model `Workspace` mới sẽ tạo. Model mới PHẢI đặt tên
khác 3 thứ này, đúng bài học H10 (Review 2 nghĩa trùng tên).

**15 điểm sửa lõi đo được** nếu breaking: 13 `prisma.flow.*` call site (server) + 2 client-core
(`lib/workspace.ts:41`, `lib/scope-core.ts`). Quyết định SẢN PHẨM chưa trả lời được bằng grep:
"route không chỉ định `wsId` thì resolve Flow nào?" — cần Hoà, không phải kỹ thuật thuần.
