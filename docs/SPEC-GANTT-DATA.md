# SPEC-GANTT-DATA — mô hình dữ liệu cho Gantt, viết bởi COWORK-PHU (06/08/2026)

Xác nhận trước khi viết: `grep -rina "gantt" lib/ components/ app/ docs/mocks/` → **0 dòng**
(chạy 06/08). Gantt = 0 dòng code, đúng như phiếu mô tả.

## 0. Phát hiện nền tảng quan trọng nhất — CHƯA có `model Task` nội bộ

`grep -n "^model " prisma/schema.prisma` liệt kê đủ 18 model — **không có model nào tên `Task`**.
Model gần nhất là `LarkTaskRef` (`prisma/schema.prisma:317-333`), nhưng đây là **mirror pull-only
của Larkbase** (docstring `components/dashboard/LarkPanels.tsx:8-10`: *"CHỈ ĐỌC — không có thao tác
nào ghi ngược Larkbase"*), không phải model nghiệp vụ do IF sở hữu:

```
model LarkTaskRef {
  id              String    @id @default(cuid())
  larkRecordId    String    @unique   // khoá đối chiếu Larkbase — KHÔNG phải id nội bộ IF
  task            String
  larkProjectName String                // TEXT TỰ DO, không phải relation tới Project
  larkProjectCode String?               // "Mã DA" chuỗi, không phải projectId thật
  ownerAccount    String?               // tài khoản Lark, CHƯA map User.id (map qua LarkUserMap riêng)
  status          String                // 'Đang làm'|'Hoàn thành'|'Ghi nhận' — CHỈ 3 giá trị
  deadline        DateTime?             // MỘT ngày duy nhất — KHÔNG có ngày bắt đầu
  daysLeft        Int?                  // đọc từ formula Larkbase có sẵn, không tự tính
  warningLabel    String?               // emoji cảnh báo, đọc từ formula Larkbase
  raw             String                // JSON toàn bộ field gốc
  syncedAt        DateTime  @default(now())
}
```

⇒ **Không dùng được cho Gantt nguyên trạng**, vì 4 lỗ hổng cấu trúc:
1. Không có ngày bắt đầu (`start`) — Gantt cần khoảng `[start, end]`, `LarkTaskRef` chỉ có 1 điểm `deadline`.
2. `larkProjectCode`/`larkProjectName` là chuỗi tự do, không phải khoá quan hệ tới `Project.id` thật
   (`Project` model ở `prisma/schema.prisma:65-100` có field `larkProjectCode` riêng để nối tay,
   không phải khoá ngoại cứng).
3. `status` chỉ 3 trạng thái rời rạc, không có `%complete` liên tục.
4. Đây là dữ liệu **hệ ngoài** (Larkbase) — theo §0v L-EXT1, Gantt là tính năng LÕI của IF không nên
   xây thẳng trên một mirror pull-only của 1 nhà cung cấp; đè Gantt lên `LarkTaskRef` là lặp lại
   đúng lỗi §0v đã chỉ ra ("cột chịu lực mượn của nhà hàng xóm").

**Kết luận nền tảng: Gantt cần một `model Task` MỚI, thuộc lõi IF, độc lập với `LarkTaskRef`.**
`LarkTaskRef` có thể là **1 nguồn nhập liệu** (import 1 chiều: kéo `deadline`/`task`/`status` từ
Lark vào `Task` mới khi user bấm "Đồng bộ") nhưng không phải bản thân model Gantt.

## 1. `model Task` đề xuất (field + consumption site)

Theo luật K4 (`00-BAT-DAU-DOC-DAY.md §2`): field mới chỉ thêm khi chỉ ra được nơi tiêu thụ. Bảng
dưới liệt kê field kèm **nơi sẽ đọc nó** — phần "nơi tiêu thụ" là suy luận từ chính UI Gantt (component
chưa tồn tại, nên nơi tiêu thụ là **thành phần Gantt sắp dựng**, ghi rõ để không phải đoán mơ hồ).

| Field | Kiểu | Bắt buộc? | Nơi tiêu thụ |
|---|---|---|---|
| `id` | `String @id @default(cuid())` | có | khoá nội bộ, mọi thao tác kéo-thả/sửa |
| `projectId` | `String` (relation → `Project`) | có | lọc Gantt theo dự án đang mở — khác `LarkTaskRef.larkProjectCode` (chuỗi tự do), đây là khoá ngoại THẬT |
| `title` | `String` | có | nhãn thanh Gantt |
| `startDate` | `DateTime?` | **không** (xem §3 "chưa có ngày") | vị trí trái thanh Gantt |
| `endDate` | `DateTime?` | **không** | vị trí phải thanh Gantt |
| `percentComplete` | `Int @default(0)` (0-100) | có, mặc định 0 | độ đầy thanh Gantt (progress overlay) |
| `assigneeUserId` | `String?` (relation → `User`) | không | avatar/tên trên thanh Gantt, lọc theo người |
| `teamOrDept` | `String?` | không | nhóm hàng theo phòng ban (nếu Gantt hỗ trợ group-by) — KHÔNG đặt tên hãng, chuỗi tự do do studio định nghĩa |
| `isMilestone` | `Boolean @default(false)` | có | Gantt renderer rẽ nhánh: milestone vẽ hình thoi tại 1 điểm, task thường vẽ thanh — xem §4 |
| `orderIndex` | `Int @default(0)` | có | thứ tự dòng hiển thị, kéo-thả sắp xếp lại |
| `parentTaskId` | `String?` (self-relation) | không | task cha/con (WBS lồng nhau) — Gantt renderer thu gọn/mở rộng nhóm |
| `status` | `String` | có | màu thanh Gantt (làm/xong/trễ...) — tách khỏi `percentComplete` vì trạng thái không phải lúc nào cũng tuyến tính với % (VD "Chờ duyệt" có thể 100% việc xong nhưng chưa "Hoàn thành") |
| `createdAt`/`updatedAt`/`rev`/`deletedAt` | chuẩn 26/07 (`docs/IF-CORE-SCHEMA.md §1D/§2C`, xem mẫu `Project` `prisma/schema.prisma:87-91`) | có | đồng bộ đa thiết bị tương lai + xoá mềm, đúng pattern đã dùng cho `Project`/`ProjectMember` |

**KHÔNG thêm field nào mang tên hãng** (đúng §0v L-EXT1) — nếu cần đối chiếu Larkbase, dùng bảng
`ExternalRef` đã có sẵn khung (`prisma/schema.prisma:482-...`, `system: 'lark'`, `externalId`,
`entityType: 'task'`, `entityId: Task.id`), KHÔNG thêm cột `larkX` mới vào `Task`.

## 2. Phụ thuộc giữa các task — finish-to-start có đủ không?

**Đề xuất: bắt đầu với CHỈ finish-to-start (FS), KHÔNG làm đủ 4 loại ngay.**

Lý do:
- 4 loại chuẩn (FS/SS/FF/SF) là chuẩn MS Project/P6 cho công trình xây dựng lớn (đường găng phức
  tạp, nhiều đội thi công song song). Quy mô IF hiện tại (studio nội thất vừa/nhỏ, K4 "chỉ thêm khi
  có nơi tiêu thụ") — **chưa có UI/nhu cầu thật nào đòi SS/FF/SF**, thêm ngay là đoán trước nhu cầu,
  đúng loại lỗi Revit "schema phình mà không ai đọc" mà K4 muốn chặn.
- Bảng `TaskDependency` tách riêng (không nhét vào `Task`) để mở rộng loại phụ thuộc sau này không
  cần migrate lại `Task`:

```prisma
model TaskDependency {
  id              String   @id @default(cuid())
  predecessorId   String   // Task phải xong trước
  successorId     String   // Task chờ theo sau
  type            String   @default("FS") // 'FS' duy nhất lúc đầu — mở khoá SS/FF/SF sau khi có nơi tiêu thụ thật
  lagDays         Int      @default(0)    // độ trễ cho phép (VD "sau khi sơn khô 2 ngày mới lắp nội thất")

  @@unique([predecessorId, successorId])
}
```

## 3. Đường găng (critical path) — tính ở đâu, cache hay tính lại mỗi lần mở?

**Đề xuất: tính ở CLIENT, tính lại mỗi lần mở (không cache trong DB), vì:**
1. Quy mô nhỏ (vài đến vài chục task/dự án theo `§0` phiếu VIỆC 2 — cùng ràng buộc studio nhỏ) →
   thuật toán CPM (Critical Path Method) trên vài chục node là **rẻ** (mili-giây), không cần cache.
2. Cache đường găng trong DB tạo thêm 1 nguồn có thể LỆCH khi user sửa `startDate`/`endDate`/
   `TaskDependency` mà quên tính lại — đúng lớp bug "số chết" mà `N1` của `00-BAT-DAU-DOC-DAY.md`
   cảnh báo (*"spec ghi đã có SUM() — thật ra số chết"*).
3. Tính client cho phép Gantt **preview tức thời** khi user kéo-thả sửa ngày (đúng `§0e KS2` — cùng
   đầu vào → cùng kết quả, thấy trước được kết quả trước khi lưu).

Nếu sau này số task/dự án lớn (hàng trăm+) và tính client chậm thấy rõ, mới cân nhắc cache — nhưng
đó là tối ưu hoá **có số đo thật** trước khi làm, không làm trước khi cần (đúng tinh thần K4).

## 4. Milestone — loại task riêng hay chỉ là cờ?

**Đề xuất: cờ `isMilestone: Boolean` trên `Task`, KHÔNG phải model/loại riêng.**

Lý do:
- Milestone (VD "bàn giao khách") vẫn cần mọi field còn lại của Task: `projectId`, `assigneeUserId`,
  `status`, tham gia được `TaskDependency` (milestone có thể là điều kiện chờ của task khác) —
  tách model riêng buộc phải lặp lại toàn bộ field hoặc dựng thêm bảng cầu, không có lợi ích rõ.
- Renderer Gantt chỉ cần rẽ nhánh theo cờ: `isMilestone === true` → vẽ hình thoi tại `endDate` (bỏ
  qua `startDate`, milestone theo định nghĩa không có độ dài); `false` → vẽ thanh từ `startDate` đến
  `endDate`.
- Khi `isMilestone === true`, quy ước: `startDate` không hiển thị, `percentComplete` chỉ nhận 0
  hoặc 100 (không có "đang làm nửa chừng" cho một điểm mốc) — validate ở tầng UI/API, không cần
  ràng buộc DB riêng (SQLite không có CHECK constraint mạnh, và validate ở app đơn giản hơn).

## 5. Task chưa gán người / chưa có ngày — hiển thị thế nào (KHÔNG được biến mất)

Vì `startDate`/`endDate` là **optional** (§1 — cố ý không bắt buộc, vì task mới tạo thường chưa
chốt ngày), Gantt renderer bắt buộc xử lý rõ 3 trường hợp, không được lặng lẽ lọc bỏ:

| Trạng thái | Cách hiển thị đề xuất |
|---|---|
| Có đủ `startDate` + `endDate` | Thanh Gantt bình thường trên trục thời gian |
| Có 1 trong 2 (VD chỉ có `endDate`, giống thói quen Lark hiện tại chỉ có `deadline`) | Thanh **rút gọn về 1 điểm** tại ngày đã có (giống milestone về mặt vẽ) + icon cảnh báo "thiếu ngày còn lại", KHÔNG suy đoán ngày kia (đúng K3 — "phải đoán thì gắn cờ `inferred`", ở đây chọn KHÔNG đoán vì đoán ngày dự án sai hậu quả cao hơn để trống) |
| Không có ngày nào | **Danh sách riêng phía trên/dưới lưới thời gian** ("Chưa lên lịch — N task"), KHÔNG vẽ trên trục thời gian (không có toạ độ để vẽ), nhưng PHẢI đếm được và bấm vào để gán ngày — không được rơi khỏi UI hoàn toàn (đúng luật §9 "ô trống là bằng chứng còn việc", áp dụng tương tự ở đây: task không có ngày là "ô trống chờ input", không phải task không tồn tại) |
| Chưa gán người (`assigneeUserId === null`) | Avatar hiển thị dạng viền đứt + label "Chưa gán" thay vì ẩn cột người — không lọc khỏi Gantt |

## 6. Chưa kiểm chứng được

- Chưa có UI Gantt nào để đối chiếu field đề xuất với thiết kế thật của Claude Design (phiếu nói UI
  đang vẽ song song, phiên này không thấy được file mock Gantt nào — `docs/mocks/` hiện có
  `Tiến độ · Gantt.dc.html` nhưng đây là placeholder export chưa mở khoá `support.js`, xem
  `docs/KIEM-KE-MOCK-2026-08-06.md` VIỆC 5).
- Chưa xác nhận cỡ dữ liệu thật (bao nhiêu task/dự án trung bình) để kiểm định giả thiết "CPM tính
  client đủ rẻ" ở §3 — dựa trên suy luận quy mô "vài-vài chục" nêu trong phiếu VIỆC 2, chưa đo thật.
- `ExternalRef` (đề xuất dùng để nối `Task` ↔ `LarkTaskRef`) **chưa chạy migrate**
  (`prisma/schema.prisma:478-479`: *"🔴 CHƯA CHẠY MIGRATE... chặn sau cờ `EXTERNAL_REF_TABLE_READY`"*)
  — nên `model Task` mới này, nếu làm trước khi `ExternalRef` sẵn sàng, tạm thời KHÔNG nối được với
  Lark, chỉ là task nội bộ thuần IF. Đây không phải lỗi thiết kế, chỉ là thứ tự triển khai cần biết trước.
