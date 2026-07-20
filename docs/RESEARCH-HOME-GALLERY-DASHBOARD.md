# NGHIÊN CỨU · Trang Home (Gallery + Dashboard) từ Larkbase — InteriorFlow

> **Trạng thái: ĐỀ XUẤT, CHƯA THỰC THI.** Tài liệu này KHÔNG kèm thay đổi schema/API/UI nào.
> Mọi khối code bên dưới là **mẫu minh hoạ**, chưa áp vào repo.
>
> Nhánh: `feat/research-home-gallery-dashboard` · Ngày: 2026-07-21 · Mọi khẳng định về code đã verify bằng đọc file thật (không đoán); mục Larkbase đã verify bằng gọi MCP thật LẦN NÀY (field_id lấy trực tiếp, không tái dùng tên cột đoán từ báo cáo cũ).
>
> ⚠️ **CHỈNH PHẠM VI (chủ dự án, giữa lúc viết báo cáo):** **KHÔNG tạo trang/route Home mới.** Đây là yêu cầu **gộp vào Gallery hiện có** (`ProjectSelect.tsx`) — Gallery vẫn là màn hình chính hiển thị đầu tiên, layout card giữ nguyên (chỉ bổ sung dữ liệu Larkbase vào đúng chỗ đang hiện, không vẽ lại card); phần "Dashboard" trở thành 1 lớp **"Chi tiết" xổ ra khi bấm** (modal/panel/expand — bảng project-management sort được), ẩn mặc định. §2.2 đã viết lại theo đúng chỉnh sửa này.

---

## Mục lục

0. Tóm tắt cho người bận
1. Hiện trạng đã verify (ProjectSelect/Gallery · Dashboard · Prisma · Larkbase field thật · luồng route `/`)
2. Đề xuất kiến trúc (data model `LarkTaskRef` · Gallery mở rộng + panel "Chi tiết" · quyền xem · đồng bộ)
3. Rủi ro & giới hạn
4. Phân kỳ đề xuất (M1/M2/M3)
5. Quyết định đã chốt & câu hỏi còn mở
6. Đối chiếu với yêu cầu gốc

---

## 0. TÓM TẮT CHO NGƯỜI BẬN

**"Gallery cho phép tạo project mới" đã làm rồi** — không phải từ đầu. `components/ProjectSelect.tsx` (1382 dòng) đã là màn Home/Gallery thật: lưới card 3D visionOS với ảnh bìa, dòng trạng thái, avatar thành viên, tìm kiếm/lọc theo dự án, nút "+ Dự án mới". `components/StageSelect.tsx` là **code CŨ đã bị thay** (comment tự ghi *"THAY cho StageSelect cũ"*) — không còn import ở `app/page.tsx`, an toàn bỏ qua/xoá sau.

**Chưa có: kanban theo trạng thái.** `Flow.status` (`prisma/schema.prisma:70`) là **chuỗi ghi chú tự do người dùng gõ tay** ("Chờ CĐT duyệt", …), KHÔNG phải máy trạng thái 3 giá trị — khác hẳn với `Trạng thái` bên Larkbase (select cố định `Đang làm/Hoàn thành/Ghi nhận`). Đây là **đúng mẫu hình đã gặp** ở `RESEARCH-ACCESS-CONTROL.md §1.2` (`Project.stage` không tồn tại) — không có gì để tái dùng cho kanban, phải mượn state machine từ Larkbase.

**Dashboard (`components/Dashboard.tsx` + `app/api/dashboard/route.ts`) ĐÃ được vá P0** so với mô tả trong `RESEARCH-ACCESS-CONTROL.md §4.2`: route hiện tại **không** select `shareToken` thô, **không** trả email/SĐT — comment tại chỗ ghi rõ *"KHÔNG select email/phone — PII, client không hiển thị"* và `shareToken` đã đổi thành boolean `shared`. Đây là tin tốt — nền tảng để mở rộng dữ liệu Larkbase vào không phải vá lỗ rò trước.

**Larkbase — verify LẠI hôm nay, kết quả GIỐNG HỆT** báo cáo cũ (`RESEARCH-MATERIAL-BRIDGE.md §1.6`, cách đây 1 ngày): vẫn đúng 2 bảng `Chi tiết công việc` (`tblnjLehkr6DRMJN`) và `Nhân sự` (`tblUvVYG5j70FCTn`), cùng `revision` (58 và 4 — chưa đổi gì). Nhưng khác với đợt trước — **lần này 2 bảng CHÍNH XÁC LÀ DỮ LIỆU CẦN CHO VIỆC HÔM NAY** (quản lý tiến độ + nhân sự), không phải "sai workspace" nữa. Đã lấy đủ `field_id` thật (không đoán) — xem §1.4.

**1 rủi ro dữ liệu đáng chú ý phát hiện khi đọc record thật:** cột `Mã DA` **không phải luôn luôn là mã số** — 1 trong 10 record mẫu có giá trị `"Khác"` (chữ, không phải mã dự án). Việc map `Mã DA ↔ Project.larkProjectCode` phải xử lý case này (xem §2.1, §3).

**2 quyết định đã CHỐT dứt khoát bởi chủ dự án (không còn là câu hỏi — xem §5.1 để đọc đầy đủ):**
1. **Phân quyền tách biệt hoàn toàn khỏi Larkbase** — dùng lại nguyên `ProjectMember` (`RESEARCH-ACCESS-CONTROL.md §2`), Larkbase `Chủ trì`/`Hỗ trợ` chỉ pre-fill 1 lần lúc liên kết, không tự động quyết quyền xem trong app.
2. **Tạo dự án cục bộ trước, liên kết Larkbase là bước tuỳ chọn, KHÔNG BAO GIỜ ghi ngược** — app tuyệt đối không `create_record` lên bảng "Chi tiết công việc" (công cụ vận hành chung cả công ty).

**Khuyến nghị kiến trúc 1 câu:** GIỮ NGUYÊN `ProjectSelect` làm màn hình chính (không route mới) — chỉ bổ sung dữ liệu Larkbase vào đúng chỗ card đang hiển thị (avatar/status/tên đã có), cộng 1 bảng mirror mới `LarkTaskRef` (cùng mẫu hình pull-only `MaterialRef` đã đề xuất ở `RESEARCH-MATERIAL-BRIDGE.md §2`) để lấy `%tiến độ`/`deadline`/`cảnh báo` đã tính sẵn dạng formula bên Larkbase, và thêm đúng 1 nút mới **"Chi tiết"** mở ra bảng project-management (nhân sự + dự án + tiến độ, sort được) — đây là nơi DUY NHẤT chứa nội dung "Dashboard" của yêu cầu gốc, không phải 1 trang riêng.

---

## 1. HIỆN TRẠNG ĐÃ VERIFY

### 1.1 `ProjectSelect.tsx` — ĐÃ LÀ Home/Gallery, không phải làm từ đầu

Đọc `components/ProjectSelect.tsx` (1382 dòng, cập nhật gần nhất theo comment là đợt "login-contrast" 19/07):

| Đã có | Vị trí | Ghi chú |
|---|---|---|
| Lưới card dự án (thực ra là **Flow**, xem §1.3) — ảnh bìa, tên, dòng trạng thái, thời gian cập nhật | `:544-657` (`flowCaption`) | Ảnh bìa `f.coverUrl` chọn tay hoặc hash-fallback (`:63-72`) |
| Nút "+ Dự án mới" | `:230, 777-800` (card `kind:'new'`) | Gọi `createFlow()` rỗng rồi `openFlow()` — xem `lib/workspace.ts:32` |
| Avatar thành viên (owner + online) | `:488-540` (`avatarRow`, `membersOf`) | Chỉ vẽ được **owner** — comment tự thừa nhận (`:489-491`): *"Dữ liệu ĐANG CÓ: Flow chỉ có userId (owner) — KHÔNG có bảng membership per-flow"* |
| Tìm kiếm + lọc theo dự án (khi >8 flow) | `:938-1133` (`searchGrid`, kích hoạt bởi `manyMode`) | Lọc theo `Project` (Prisma), KHÔNG phải Larkbase |
| Đổi bìa (upload hoặc chọn từ thư viện) | `:333-418` | Ghi `Flow.coverUrl` qua `PUT /api/flows/[id]` |
| Sửa "status" ghi chú tay | `:420-443` | Ghi `Flow.status` — **text tự do**, không phải state machine |

**Kết luận:** yêu cầu cũ *"gallery cho phép tạo project mới"* đã xong. Còn thiếu đúng 1 thứ so với brief hôm nay: **kanban theo trạng thái** và **số liệu tổng hợp kiểu Dashboard** (hiện `ProjectSelect` không có stat card, không có roster nhân sự với chức danh thật — chỉ tên + online/offline).

### 1.2 `StageSelect.tsx` — code CŨ, không còn dùng, an toàn bỏ qua

`grep StageSelect` trên toàn repo: **0 import** trong `app/page.tsx` hay bất kỳ file `.tsx` nào khác ngoài chính nó. Chỉ còn lại trong:
- Comment tự ghi ở `ProjectSelect.tsx:29` (*"MÀN CHỌN DỰ ÁN sau đăng nhập, THAY cho StageSelect cũ"*)
- Comment tham chiếu lịch sử ở `IntroSequence.tsx:18`, `app/page.tsx:328`, `LangToggle.tsx:10`, `lib/usePageVisible.ts:6`

→ File `StageSelect.tsx` (218 dòng) là **xác chết an toàn** — không cần xoá gấp (không phá gì nếu để lại), nhưng khi dọn dẹp kỹ thuật thì đây là ứng viên xoá rõ ràng nhất, tránh nhầm cho dev sau này tưởng đây là màn đang chạy.

### 1.3 Dashboard — đã vá P0, data thật, nhưng KHÔNG có khái niệm chặng/kanban

`app/api/dashboard/route.ts` (85 dòng — đọc lại TOÀN VĂN, không đoán từ báo cáo cũ):

```ts
// :16-28 — user: KHÔNG select email/phone (comment :19 tự ghi lý do)
prisma.user.findMany({ select: { id, name, credits, isAdmin, lastSeenAt, _count } })
// :40-52 — flow: CÓ select shareToken nhưng...
prisma.flow.findMany({ take: 12, select: { ..., shareToken: true, ... } })
// :82 — ...map ngay thành boolean trước khi trả ra ngoài — KHÔNG rò token thô
const safeFlows = flows.map(({ shareToken, ...f }) => ({ ...f, shared: !!shareToken }));
```

So với mô tả 🔴 P0 trong `RESEARCH-ACCESS-CONTROL.md §4.2` (ngày hôm qua) — **đã được vá**: không còn PII, không còn rò `shareToken`. Đây là tin quan trọng cho việc hôm nay: nền để mở rộng thêm dữ liệu Larkbase là **sạch**, không cần vá lỗ rò song song.

`components/Dashboard.tsx` (400 dòng) — 2 chế độ:
- **Overlay toàn màn** (`dashboardOpen` từ store, gate ở `app/page.tsx:364`) — bấm mở từ đâu đó trong Header/LeftRail (ngoài phạm vi đọc sâu, nhưng cơ chế store xác nhận đúng là overlay/modal, KHÔNG phải route riêng).
- **`coverMode`** (`:378-382`) — render **inline** làm toàn bộ nội dung màn ngoài (cover) của thiết bị gập (Oppo Find N6) — đây là bằng chứng Dashboard **đã có sẵn 2 hình thái lắp ráp khác nhau của CÙNG 1 component** (overlay và inline). Theo chỉnh phạm vi mới nhất (không route mới — xem cảnh báo đầu file), hình thái dùng cho việc hôm nay là **overlay** (`fixed inset-0`, đã có) làm nội dung cho nút "Chi tiết" mới trên Gallery — không cần viết lại logic fetch/render, chỉ đổi nội dung bảng bên trong (§2.2).

**Field trả về** (`DashboardData`, `:26-32`): `stats{projects,flows,members,online,creditsSpent30d,creditsRemaining}`, `team[]` (id/name/credits/isAdmin/lastSeenAt/online/flowCount/projectCount), `projects[]` (id/name/clientName/createdAt/user/_count.flows), `flows[]` (12 mới nhất, có `project`).

**Không có trường nào khớp trực tiếp Larkbase** — `stats.projects` đếm `Project` Prisma (không phải Larkbase); không có `deadline`, không có `%tiến độ`, không có `phòng ban/chức danh`. Đây chính là khoảng trống mà Larkbase lấp được (§2).

### 1.4 Prisma `Project`/`Flow` — xác nhận field hiện có (đọc lại `schema.prisma`)

```prisma
model Project {
  id String @id @default(cuid())
  userId String
  name String
  clientName String?
  createdAt DateTime @default(now())
  // KHÔNG có: stage, status, currentStage, larkProjectCode, deadline, progress
}
model Flow {
  id String @id @default(cuid())
  userId String
  projectId String?
  name String @default("Untitled flow")
  coverUrl String @default("")   // đã dùng ở ProjectSelect
  status String @default("")    // GHI CHÚ TỰ DO — không phải state machine
  version Int @default(1)
  shareToken String? @unique
  updatedAt DateTime @updatedAt
}
```

Khớp đúng những gì `RESEARCH-ACCESS-CONTROL.md §1.2` đã kết luận: **không có gì để tái dùng cho "chặng"/"trạng thái chuẩn hoá"**. Việc hôm nay (kanban theo Larkbase `Trạng thái`) sẽ KHÔNG đụng field này — mượn trạng thái từ mirror `LarkTaskRef` thay vì thêm field mới trên `Project` (khác với đề xuất `currentStage` ở access-control, vì đó là trạng thái NỘI BỘ 3 chặng CAD/Render/Present, còn đây là trạng thái CÔNG VIỆC bên Larkbase — hai khái niệm khác nhau, xem §2.1).

### 1.5 Larkbase — verify LẠI hôm nay, field_id thật (không tái dùng tên đoán)

Gọi `mcp__lark-base__list_tables` (không tham số) → **giống hệt hôm qua**:

```json
[{"name":"Chi tiết công việc","table_id":"tblnjLehkr6DRMJN","revision":58},
 {"name":"Nhân sự","table_id":"tblUvVYG5j70FCTn","revision":4}]
```

`revision` không đổi → base ổn định, chưa ai sửa cấu trúc từ hôm qua tới giờ.

**"Chi tiết công việc" — field thật (`list_fields`, không đoán):**

| field_name | field_id | ui_type | Ghi chú |
|---|---|---|---|
| STT | `fld6ljhF0B` | AutoNumber | primary key hiển thị |
| Công việc | `fldwbtnkvV` | Text | |
| Dự án | `fldJtylsyv` | Text | **tên dự án dạng CHỮ TỰ DO**, không phải link tới bảng Project nào |
| Chủ trì | `fldgKYaap5` | User (single) | Lark user, không phải link Nhân sự |
| Hỗ trợ | `fldcQ1qmeb` | User (multiple) | |
| Ngày giao | `fldgge5FsU` | DateTime | |
| Deadline | `fldhG7EqAa` | DateTime | |
| Trạng thái | `fldfhchOp2` | SingleSelect | 3 option: `Đang làm`(`optXdEZzaD`) / `Hoàn thành`(`optAwGKYAd`) / `Ghi nhận`(`optkltQsLG`) |
| Số ngày còn lại | `fldKUidfNt` | **Formula** | Đã tính sẵn — công thức đọc `Trạng thái`+`Deadline`, trả số âm nếu trễ |
| Cảnh báo | `fldz1WLW4y` | **Formula** | Trả text có emoji: `✅ Hoàn thành` / `🔴 Trễ N ngày` / `🟡 Sắp đến hạn` / `🟢 Đúng tiến độ` |
| Ghi chú | `fldgNbpUuI` | Text | |
| **Mã DA** | `fldhMYuiEN` | Text | ⚠️ **KHÔNG luôn là số** — xem cảnh báo dưới |
| Chủ trì (HRM) | `fldNeQrcJW` | SingleLink → Nhân sự | Link THẬT tới bảng Nhân sự (multiple) |

**"Nhân sự" — field thật:**

| field_name | field_id | ui_type |
|---|---|---|
| Tài khoản | `fldRj0Rxqj` | Text (primary) |
| Họ tên | `fldrqrWgRL` | Text |
| Chức danh | `fldk6eUee1` | Text |
| Phòng ban | `fldtdBj7Vw` | Text |
| Team Crea | `fldvno5ztZ` | Checkbox |

**⚠️ Không có field nhạy cảm nào trên "Nhân sự"** — không lương, không SĐT, không email, không CMND. 5 field đều an toàn hiện công khai nội bộ (trả lời trước cho câu hỏi Q-d ở §5).

**⚠️ PHÁT HIỆN MỚI — `Mã DA` không đồng nhất, đọc 10 record mẫu bảng "Chi tiết công việc":**

```json
{"Dự án":"Villa Mr Chương","Mã DA":"7963", "Trạng thái":"Đang làm"}
{"Dự án":"Quyết toán Nam Long","Mã DA":"Khác", "Trạng thái":"Đang làm"}   // ⚠️ KHÔNG phải mã số
{"Dự án":"Villa Mr Ngọc","Mã DA":"8197", "Trạng thái":"Ghi nhận"}
{"Dự án":"CCTM1","Mã DA":"8205", ...}
{"Dự án":"ST5","Mã DA":"8268", ...}
{"Dự án":"ST6","Mã DA":"8395", ...}
```

Đa số `Mã DA` là chuỗi số 4 chữ số dạng mã dự án thật (7963/8197/8205/8268/8395), nhưng **có record `Mã DA = "Khác"`** — một "dự án tổng hợp việc lặt vặt không thuộc DA cụ thể" (`Dự án: "Quyết toán Nam Long"`). Field là `Text` tự do, không có validate — nghĩa là mapping `Mã DA ↔ Project.larkProjectCode` phải **bỏ qua hoặc gom riêng** các record `Mã DA` không phải mã số thật, không được coi `"Khác"` là 1 project code hợp lệ (nếu không, mọi task "Khác" của mọi phòng ban sẽ gộp nhầm vào chung 1 "dự án ảo"). Đây là rủi ro dữ liệu cụ thể — nêu lại ở §3.

**1 record "Nhân sự" mẫu:**

```json
{"Tài khoản":"An.LNT","Họ tên":"AnLeNgocThuy","Chức danh":"Interior Designer","Phòng ban":"TTTA Creative Design","Team Crea":true}
```

`Tài khoản` (VD `An.LNT`) là dạng viết tắt riêng của Larkbase — **không khớp trực tiếp** `User.name`/`User.email` của Prisma (IF dùng tên đầy đủ + email thật khi đăng ký). Cần 1 bước đối chiếu thủ công hoặc bảng ánh xạ `Tài khoản ↔ User.id` (không tự động suy đoán được từ string match — xem câu hỏi §5).

### 1.6 Luồng route `/` — xác nhận lại toàn bộ (đọc `app/page.tsx`, 374 dòng)

```
chưa đăng nhập → <LoginScreen>
đã đăng nhập, chưa chọn dự án (!stageDone) → <ProjectSelect onEnter={...}>   ← ĐÂY LÀ "HOME" HIỆN TẠI
  · first-time user: dừng ở đây + Smart Tour
  · returning user: enterAfterAuth() có thể AUTO-SKIP qua ProjectSelect (resume flow đã lưu)
đã chọn dự án (stageDone) + màn hẹp (<480px, cover foldable) → <Dashboard coverMode> (đọc-only)
đã chọn dự án + màn đủ rộng → canvas đầy đủ (Header/LeftRail/FlowCanvas...) + <Dashboard> là OVERLAY ẩn mặc định
```

**3 phát hiện quan trọng cho quyết định kiến trúc (đã cập nhật theo chỉnh phạm vi — KHÔNG tạo route mới, xem cảnh báo đầu file):**

1. **`ProjectSelect` đã CHIẾM đúng vị trí "sau đăng nhập"** — đúng chỗ để gộp thêm dữ liệu Larkbase và nút "Chi tiết", không cần route/page mới.
2. **Returning user thường KHÔNG đi qua `ProjectSelect`** — `enterAfterAuth()` (`:97-149`) tự resume thẳng vào canvas nếu có `resume.flowId`/`stageFlag` đã lưu (`localStorage`). Vì phần "Chi tiết" (bảng project-management/kanban) chỉ sống bên trong Gallery, returning-user cần **1 lối vào chủ động** để mở lại Gallery + bấm "Chi tiết" khi cần (VD nút cố định trong `Header`, tương tự cách `dashboardOpen` hiện được bật) — nêu ở câu hỏi §5.
3. **Dashboard hiện tại đã đúng hình thái "lớp xổ ra khi bấm"** — overlay/modal thật (`fixed inset-0 z-50`, `:393`), gate bởi `dashboardOpen`. Đây CHÍNH LÀ mẫu hình phù hợp cho nút "Chi tiết" mới: không cần phát minh cơ chế UI mới, chỉ cần đổi nguồn dữ liệu bên trong overlay đã có sẵn (thêm cột Larkbase vào bảng đang hiện) và đổi điểm neo nút bấm (đặt trên card Gallery thay vì chỉ ở Header/LeftRail) — xem §2.2.

---

## 2. ĐỀ XUẤT KIẾN TRÚC

### 2.1 Data model — `LarkTaskRef` mirror + `Project.larkProjectCode`

Cùng mẫu hình pull-only đã chốt ở `RESEARCH-MATERIAL-BRIDGE.md §2` (không lặp lại lý luận pull-only vs 2-chiều — áp dụng y hệt: Larkbase là nguồn chân lý, IF chỉ đọc).

```prisma
// ══ MỚI ══ Mirror "Chi tiết công việc" Larkbase — cache đọc, KHÔNG phải nguồn chân lý.
model LarkTaskRef {
  id             String   @id @default(cuid())
  larkRecordId   String   @unique          // record_id thật — khoá đối chiếu khi sync lại
  task           String                     // Công việc (fldwbtnkvV)
  larkProjectName String                    // Dự án — TEXT TỰ DO bên Larkbase (fldJtylsyv)
  larkProjectCode String?                   // Mã DA (fldhMYuiEN) — NULLABLE, "Khác"/rỗng → null (xem §1.4 cảnh báo)
  ownerAccount   String?                    // Chủ trì — Tài khoản Lark (fldgKYaap5), CHƯA map sang User.id
  status         String                     // Trạng thái: 'Đang làm'|'Hoàn thành'|'Ghi nhận' (fldfhchOp2)
  deadline       DateTime?                  // fldhG7EqAa
  daysLeft       Int?                       // Số ngày còn lại — ĐỌC TỪ FORMULA CÓ SẴN (fldKUidfNt), KHÔNG tự tính lại
  warningLabel   String?                    // Cảnh báo — ĐỌC TỪ FORMULA CÓ SẴN (fldz1WLW4y), giữ nguyên emoji
  raw            String                     // JSON toàn bộ field gốc — tương lai-proof (giống MaterialRef.raw)
  syncedAt       DateTime @default(now())

  @@index([larkProjectCode])
  @@index([status])
}

model Project {
  // ... giữ nguyên field cũ (id, userId, name, clientName, createdAt) ...
  larkProjectCode String?   // ══ MỚI, optional ══ — KTS tự gõ hoặc chọn từ danh sách Mã DA đã sync khi tạo/sửa dự án
  @@index([larkProjectCode])
}
```

**Vì sao KHÔNG tự tính lại `% tiến độ`/`ngày còn lại`:** đúng chỉ đạo brief — Larkbase đã có `Số ngày còn lại` và `Cảnh báo` dạng **formula**, tính bằng công thức phòng vật tư/quản lý đã thống nhất (VD định nghĩa "trễ" tính từ `Deadline`, "sắp đến hạn" là `≤1 ngày`). Nếu IF tự tính lại bằng logic riêng, hai nơi có thể lệch số (VD IF định nghĩa "sắp đến hạn" khác 1 ngày) — nguồn gây mất niềm tin dữ liệu. **Đọc thẳng string kết quả** (`"🔴 Trễ 5 ngày"`, `"-5"`) và hiển thị nguyên văn.

**Vì sao `larkProjectCode` là optional, không bắt buộc khi tạo `Project`:** không phải mọi `Project` (Prisma) đều có mã DA tương ứng ngay (dự án mới tạo trong IF trước khi có mã Larkbase chính thức) và không phải mọi `Mã DA` bên Larkbase đều map được 1-1 (case `"Khác"` — xem §1.4/§3). additive, không phá `Project` hiện có.

**Sync script (MẪU, cùng khuôn `sync-larkbase-materials.ts` đã đề xuất):**

```ts
// scripts/sync-larkbase-tasks.ts (MẪU, idempotent)
async function syncTasks() {
  const records = await larkbase.list_records({ table_id: 'tblnjLehkr6DRMJN' });
  for (const r of records) {
    const f = r.fields;
    const rawCode = f['Mã DA']?.trim();
    // "Khác"/rỗng/không phải mã dự án thật → lưu null, KHÔNG coi là 1 project code
    const code = rawCode && /^\d+$/.test(rawCode) ? rawCode : null;
    await prisma.larkTaskRef.upsert({
      where: { larkRecordId: r.record_id },
      update: { task: f['Công việc'], larkProjectName: f['Dự án'], larkProjectCode: code,
                status: f['Trạng thái'], deadline: f['Deadline'] ? new Date(f['Deadline']) : null,
                daysLeft: parseDaysLeft(f['Số ngày còn lại']), warningLabel: parseWarning(f['Cảnh báo']),
                raw: JSON.stringify(f), syncedAt: new Date() },
      create: { larkRecordId: r.record_id, /* ...cùng field... */ },
    });
  }
}
```

`/^\d+$/.test(rawCode)` là **quy tắc lọc cụ thể** cho đúng phát hiện `"Khác"` ở §1.4 — không phải đoán, mà xử lý case đã thấy trong dữ liệu thật.

### 2.2 Gallery giữ nguyên làm trọng tâm + panel "Chi tiết" xổ ra

> ⚠️ Mục này viết lại theo chỉnh phạm vi giữa chừng (xem cảnh báo đầu file): **KHÔNG có route/trang Home riêng.** Gallery (`ProjectSelect.tsx`) vẫn là màn chính hiển thị đầu tiên, layout card KHÔNG đổi. "Dashboard" chỉ tồn tại dưới dạng 1 lớp "Chi tiết" ẩn mặc định, xổ ra khi bấm nút.

**Thứ tự ưu tiên: (1) Gallery trước → (2) dữ liệu Larkbase bổ sung ĐÚNG VỊ TRÍ card đang có → (3) nút "Chi tiết" xổ bảng project-management.**

**(a) Gallery card — KHÔNG vẽ lại bố cục, chỉ bổ sung dữ liệu vào đúng chỗ đang hiện:**

Đối chiếu với bố cục thật đã đọc ở §1.1 (`flowCaption`, `:544-657`), mỗi vị trí trên card đã có sẵn 1 vùng — chỉ cần đổ thêm dữ liệu Larkbase vào đúng đó, không thêm hàng/khối mới:

| Vị trí ĐÃ CÓ trên card (`ProjectSelect.tsx`) | Dữ liệu đang hiện | Bổ sung Larkbase (không đổi vị trí/layout) |
|---|---|---|
| Dòng status dưới tên (`:598-614`, bấm sửa tay được) | `Flow.status` (ghi chú tự do) | Giữ nguyên — đây là ghi chú NỘI BỘ IF, không lẫn với `Trạng thái` Larkbase (khác khái niệm, xem cảnh báo §3) |
| Dòng phụ tên dự án + thời gian (`:616-633`) | `f.project.name` hoặc "Chưa gắn dự án" + `timeAgo` | Nếu `Project.larkProjectCode` đã gán: chèn thêm `Cảnh báo` Larkbase (`🔴 Trễ N ngày`/`🟢 Đúng tiến độ`...) làm 1 pill nhỏ cạnh tên dự án — dùng ĐÚNG chuỗi Larkbase đã tính sẵn, không tự suy diễn |
| Hàng avatar thành viên góc dưới card (`avatarRow`, `:503-540`) | Owner (tên + online, từ `User` nội bộ) | Khi hover/tooltip avatar: hiện thêm `Chức danh`/`Phòng ban` thật từ bảng "Nhân sự" (đối chiếu qua `Tài khoản`, cần `LarkUserMap` — xem §2.1/§3) — tooltip đã có sẵn cơ chế (`title={...}` ở `:512`), chỉ nối thêm dòng, không vẽ UI mới |

**(b) Nút "Chi tiết" — 1 nút mới trên mỗi card + 1 nút tổng ở đầu trang:**

Đề xuất **cả hai vị trí**, phục vụ 2 tình huống khác nhau (không phải chọn 1 trong 2):
- **Trên mỗi card** (cạnh nút "Đổi bìa" đã có, `:637-650`, cùng hàng, cùng kiểu `darkPill`) → mở "Chi tiết" đã lọc sẵn theo đúng project của card đó.
- **1 nút cố định đầu trang Gallery** (cạnh pill chào user, `:1167-1176`) → mở "Chi tiết" xem TOÀN BỘ (không lọc theo 1 project), phục vụ đúng use-case returning-user cần xem tổng quan mà không nhớ đang ở card nào (giải quyết phát hiện §1.6 điểm 2).

Cơ chế UI: tái dùng NGUYÊN `Dashboard.tsx` làm overlay (`fixed inset-0 z-50`, đã có sẵn — §1.6 điểm 3), không phát minh modal mới. Đổi 2 chỗ: (i) nội dung bảng bên trong đổi từ "team/project Prisma" sang bảng project-management có cột Larkbase (xem (c) dưới), (ii) điểm neo nút mở đặt thêm trên card Gallery (hiện `dashboardOpen` chỉ được bật từ Header/LeftRail, ngoài phạm vi đọc sâu — cần xác nhận thêm entry point mới khi build).

**(c) Nội dung bảng "Chi tiết" — project-management, SORT được:**

Đây là nơi DUY NHẤT chứa nội dung "Dashboard" của brief gốc. Bảng phẳng (không phải card lưới), mỗi hàng = 1 `LarkTaskRef`, cột:

| Cột | Nguồn | Sort được |
|---|---|---|
| Dự án | `larkProjectName` (+ link ngược `Project.name` nếu đã gán `larkProjectCode`) | ✓ theo tên |
| Công việc | `task` | — |
| Chủ trì | `ownerAccount` → đối chiếu `LarkUserMap` ra `Họ tên`/`Chức danh` nếu có, fallback hiện thẳng `Tài khoản` Lark | ✓ theo người phụ trách (đúng yêu cầu "sort theo người phụ trách" của chủ dự án) |
| Trạng thái | `status` (Đang làm/Hoàn thành/Ghi nhận) | ✓ nhóm theo trạng thái |
| Deadline | `deadline` | ✓ theo ngày, mặc định "deadline gần nhất trước" |
| Cảnh báo | `warningLabel` (nguyên chuỗi Larkbase, có emoji) | ✓ theo mức độ (map `🔴`>`🟡`>`🟢`>`✅` khi sort, KHÔNG đổi nghĩa chuỗi) |
| % tiến độ dự án | Tính từ nhóm `larkProjectCode` cùng dự án: `count(status='Hoàn thành')/tổng` — CHỈ hiện ở dòng đầu nhóm, không lặp lại mỗi task | ✓ theo % |

Mặc định sort: `Deadline` gần nhất trước (khớp đúng brief "deadline gần nhất"). Roster nhân sự (Chức danh/Phòng ban/`Team Crea`) hiện như 1 tab phụ trong cùng panel "Chi tiết" (không phải màn riêng) — liệt kê toàn bộ `Nhân sự` đã sync, không chỉ người có task.

**(d) Kanban theo `Trạng thái` Larkbase — CÂU HỎI MỞ, chưa tự quyết đặt ở đâu:**

3 cột khớp đúng 3 giá trị Larkbase (`Đang làm`/`Hoàn thành`/`Ghi nhận`, field_id `fldfhchOp2`) — nội dung kanban đã rõ (task + cảnh báo + tên dự án, xem field thật §1.5). **Nhưng vị trí đặt kanban chưa rõ, không tự quyết:**

- Phương án 1 — **là 1 tab trong panel "Chi tiết"** (cạnh tab bảng phẳng + tab roster ở (c)) — nhất quán vị trí, không thêm điểm neo UI mới.
- Phương án 2 — **là 1 chế độ xem khác của Gallery** (nút chuyển "Lưới bìa ↔ Kanban" ngay trên Gallery, giống cách `manyMode` đã tự chuyển "carousel ↔ grid" khi >8 flow — `:284, 1195-1197`) — hợp lý hơn nếu chủ dự án muốn kanban là cách DUYỆT dự án hàng ngày, không phải chỉ xem chi tiết.

Khuyến nghị nghiêng nhẹ về **Phương án 1** (rẻ hơn, không đụng luồng carousel/grid chính đang chạy tốt của Gallery) nhưng đây LÀ câu hỏi cần chủ dự án chọn (§5), vì ảnh hưởng trực tiếp tần suất người dùng chạm tới kanban.

**(e) Nút "+ Dự án mới" — giữ nguyên**, chỉ thêm bước tuỳ chọn "gắn Mã DA" (dropdown chọn từ các `larkProjectCode` distinct đã sync, hoặc để trống) ngay trong luồng tạo dự án hiện có (`choose()` ở `ProjectSelect.tsx:308-331` khi `item.kind==='new'`, hoặc dialog `Dashboard.tsx:176-211`).

### 2.3 Quyền xem — ĐÃ CHỐT: `ProjectMember` tách biệt hoàn toàn khỏi Larkbase

> ⚠️ Chủ dự án đã quyết dứt khoát mục này giữa lúc viết báo cáo (không còn là câu hỏi mở) — chép nguyên quyết định, không diễn giải thêm.

**Quyết định:** App PHẢI có cơ chế phân quyền RIÊNG — dùng lại nguyên thiết kế `ProjectMember` đã đề xuất ở `RESEARCH-ACCESS-CONTROL.md §2` (không phát minh lại). Larkbase `Chủ trì`/`Hỗ trợ` (field `fldgKYaap5`/`fldcQ1qmeb`) là khái niệm **PHÂN CÔNG VIỆC** (ai chịu trách nhiệm task quản lý tiến độ) — khác hẳn khái niệm **QUYỀN TRUY CẬP app** (ai được mở file thiết kế). Lý do chủ dự án nêu: không để Larkbase tự động quyết quyền truy cập trong IF, vì bên vận hành Larkbase sửa `Chủ trì`/`Hỗ trợ` vì mục đích quản lý tiến độ (không liên quan bảo mật) có thể vô tình đổi quyền xem dữ liệu nhạy cảm trong IF (bản vẽ CAD, brief khách hàng...).

**Cơ chế pre-fill (một lần, không khoá cứng):**

- Khi 1 `Project` LẦN ĐẦU liên kết `larkProjectCode` (đồng bộ từ Larkbase), tự động **GỢI Ý** thêm `Chủ trì` + `Hỗ trợ` (đối chiếu qua `LarkUserMap`, §2.1) làm `ProjectMember` mặc định — tiện, đỡ gõ tay lại danh sách thành viên từ đầu.
- Đây CHỈ là **pre-fill 1 lần lúc liên kết**, không phải đồng bộ liên tục — sau đó `ProjectMember` sống độc lập trong Prisma, chủ dự án/admin (`owner`/`isAdmin` theo enum đã đề xuất ở access-control §2.4) tự thêm/bớt qua UI, **không bị Larkbase ghi đè lại** ở các lần sync sau (khác với `LarkTaskRef` — bảng đó ghi đè mỗi lần sync vì là cache thuần đọc; `ProjectMember` sau pre-fill là dữ liệu SỞ HỮU của IF).

**UI — nút "+ Thêm người":** đặt trong panel "Chi tiết" (§2.2(b)/(c)) ở tab roster, cạnh danh sách `Nhân sự` đã sync — bấm chọn 1 `User` nội bộ IF + gán role (`owner/crea/drafter/bim/viewer`, theo enum access-control §2.4) vào `ProjectMember` của project đang xem. Không đặt trực tiếp trên card Gallery (card đã đủ chật với avatar/status/cover — xem §2.2(a)) — panel "Chi tiết" là nơi hợp lý hơn vì đây vốn đã là chỗ thao tác "quản lý" sâu hơn xem nhanh.

### 2.4 Tạo dự án mới & liên kết Larkbase — ĐÃ CHỐT: cục bộ trước, liên kết tuỳ chọn, KHÔNG BAO GIỜ ghi ngược

> ⚠️ Cũng đã chốt dứt khoát, không còn là câu hỏi mở — chép nguyên quyết định.

**Quyết định:** Nút "+ Dự án mới" ở Gallery (đã có, `ProjectSelect.tsx:308-331`) tạo `Project` **cục bộ ngay lập tức**, không chờ/không phụ thuộc Larkbase — giữ đúng hành vi hôm nay. Kèm thêm 1 bước **TUỲ CHỌN** "Liên kết Larkbase":
- Cho chọn 1 `Mã DA` đã tồn tại (distinct từ `LarkTaskRef` đã sync) để gán `Project.larkProjectCode` — map `Project.id ↔ Mã DA` (đúng thiết kế additive §2.1).
- Nếu dự án đó **CHƯA có** bên Larkbase (dự án mới hoàn toàn, task management chưa tạo) → để trạng thái **"chưa liên kết"** (`larkProjectCode = null`), liên kết tay SAU KHI bên vận hành tạo task tương ứng bên Larkbase (qua nút "Liên kết Larkbase" mở lại sau, không phải chỉ lúc tạo).

**TUYỆT ĐỐI KHÔNG** để app tự động `create_record` một dự án mới lên bảng "Chi tiết công việc" — đây là công cụ vận hành **CHUNG CẢ CÔNG TY** đang dùng hàng ngày (58 revision đã có, nhiều phòng ban khác nhau cùng ghi — xem field `Chức danh`/`Phòng ban` đa dạng ở §1.5). App ghi nhầm/ghi thừa sẽ làm loạn task tracker của người không liên quan tới InteriorFlow. Đây là **áp dụng triệt để nguyên tắc pull-only** đã lập ở `RESEARCH-MATERIAL-BRIDGE.md §2.1` cho đúng mảng project — chỉ đọc, không bao giờ ghi ngược tự động (khác `MaterialRef`, ở đó M-sau còn để ngỏ khả năng "IF tạo mã vật liệu mới rồi đẩy lên" có kiểm duyệt; ở đây chủ dự án đã loại bỏ hẳn khả năng đó cho mảng quản lý dự án/task, không để M-sau xét lại).

### 2.5 Đồng bộ — pull-only, nút bấm M1

Theo đúng triết lý đã lập ở `RESEARCH-MATERIAL-BRIDGE.md §2.1` (không lặp lại lý luận): Larkbase là nơi phòng dự án/quản lý nhập liệu qua quy trình riêng của họ; IF là bên tiêu thụ khi hiện Gallery/panel Chi tiết, không phải nơi sửa `Trạng thái`/`Deadline`/tạo task mới (§2.4). **Áp dụng y hệt cho `LarkTaskRef`:**

- M1: nút "Đồng bộ tiến độ" trong Gallery (cạnh nút "Dự án mới") → `POST /api/lark-tasks/sync`, `getSessionUser()` bắt buộc từ dòng đầu (bài học P0 §4.1/§4.2 access-control — MỌI route mới có auth trước, không lặp lại lỗi `/api/comments`).
- Cron định kỳ → M2, sau khi đo tần suất đổi dữ liệu thật (`revision` hiện tại 58/4, cần theo dõi vài tuần để biết tốc độ thay đổi trước khi quyết chu kỳ cron).
- Rate-limit: 2 bảng, tổng ít record (mẫu 10-20 record/bảng khi test) — nhẹ, không cần phân trang phức tạp cho M1; nếu "Chi tiết công việc" phình lớn (nhiều trăm/nghìn task lịch sử), cân nhắc chỉ sync task `Trạng thái != 'Hoàn thành'` HOẶC `Deadline` trong N ngày gần đây, không kéo toàn bộ lịch sử mỗi lần.

---

## 3. RỦI RO & GIỚI HẠN

| Rủi ro | Mức | Giảm thiểu |
|---|---|---|
| `Mã DA = "Khác"` (và có thể còn giá trị phi-số khác chưa thấy trong mẫu 10 record) — mapping sai sẽ gộp nhầm nhiều dự án khác nhau vào 1 "dự án ảo" | **Trung bình — đã xác nhận xảy ra thật** | Filter `/^\d+$/` khi sync (§2.1); log riêng danh sách `larkProjectCode=null` để chủ dự án soát định kỳ, không âm thầm bỏ qua |
| `Tài khoản` Larkbase (`An.LNT`) không khớp tự động `User.email`/`User.name` nội bộ IF | Trung bình | Cần bảng ánh xạ thủ công 1 lần (`LarkUserMap{larkAccount, userId}` — nhỏ, ít thay đổi vì nhân sự công ty không đổi liên tục); KHÔNG tự đoán bằng string-similarity, sai sẽ gán nhầm chức danh cho đúng người khác |
| Rate-limit Larkbase API khi bảng "Chi tiết công việc" phình to (nhiều task lịch sử) | Thấp hiện tại, tăng dần | Pull-only + `LarkTaskRef` cache (§2.5); cân nhắc sync có điều kiện (chỉ chưa hoàn thành/gần đây) nếu bảng vượt vài trăm record |
| Dữ liệu "Nhân sự"/"Chi tiết công việc" hiện công khai trong Home có nhạy cảm không nếu mọi user IF đều xem được | **Đã kiểm tra field thật (§1.5): KHÔNG** — Nhân sự chỉ có Tài khoản/Họ tên/Chức danh/Phòng ban/checkbox Team Crea, không lương/SĐT/email. "Chi tiết công việc" là tên task nội bộ, không phải dữ liệu khách hàng | Không cần lọc field khi hiển thị — nhưng vẫn nên tôn trọng lọc theo project/quyền xem ở §2.3 (câu hỏi ai thấy project nào là vấn đề khác, không phải field nhạy cảm) |
| Larkbase đổi cấu trúc cột (`revision` tăng) sau khi đã build mapping cứng field_id | Thấp trong ngắn hạn (revision không đổi giữa 2 lần verify cách nhau 1 ngày) | `raw JSON` lưu nguyên field gốc (giống `MaterialRef.raw`) — đổi cột không phá dữ liệu đã sync, chỉ field mapping cụ thể (`task`, `status`...) cần code sync cập nhật theo |
| `Flow.status` (ghi chú tay, đã có UI ở `ProjectSelect`) và `LarkTaskRef.status` (state machine 3 giá trị) tên gần giống nhau dễ nhầm khi code | Thấp, nhưng dễ gây bug đọc nhầm field | Đặt tên rõ trong code: `larkStatus` khi hiển thị cạnh `flow.status` để phân biệt, tránh 2 khái niệm trùng tên biến |
| Kanban công việc (Larkbase) và kanban dự án (đề xuất `currentStage`, access-control §6) dễ bị người dùng hiểu nhầm là 1 thứ | Thấp | UI tách rõ 2 tab/khu vực, ghi nhãn khác nhau ("Tiến độ công việc" vs "Chặng sản xuất") — đã nêu ở §2.2 |

---

## 4. PHÂN KỲ ĐỀ XUẤT

| # | Việc | Phụ thuộc | Rủi ro dữ liệu |
|---|---|---|---|
| **M1** | `LarkTaskRef` schema (`db push`, additive) · script sync tay + nút bấm trong Gallery · `Project.larkProjectCode` (optional, gán qua bước "Liên kết Larkbase" tuỳ chọn khi tạo/sửa dự án, §2.4) · dữ liệu Larkbase bổ sung ĐÚNG VỊ TRÍ card đang có (§2.2(a)) · nút "Chi tiết" mở panel project-management sort được, kanban là 1 tab trong đó (§2.2(b)/(c)/(d), quyết định 4) · lối vào Home trước "Drafting CAD" + logo IF (quyết định 3) | Câu hỏi mở (e)/(f) §5.2 trả lời (câu (h) không chặn M1, mặc định lọc theo dự án) | Thấp — toàn field optional/mới, giống mẫu additive đã dùng ở `RESEARCH-ACCESS-CONTROL.md §2.3`/`RESEARCH-MATERIAL-BRIDGE.md §2.2`. Riêng bước lọc `Mã DA` phi-số cần làm đúng ngay từ M1 (đã biết trước, không phải rủi ro ẩn) |
| **M2** | `ProjectMember` pre-fill từ `Chủ trì`/`Hỗ trợ` lúc liên kết (§2.3) + nút "+ Thêm người" · Kanban theo `Trạng thái` Larkbase (đọc, KHÔNG kéo-thả ngược — xem quyết định 2 §5.1) · roster nhân sự đối chiếu `Nhân sự` (cần `LarkUserMap` xây tay 1 lần) · cron đồng bộ (nếu đã đo tần suất đổi dữ liệu đủ để quyết chu kỳ) | M1 xong + `LarkUserMap` có dữ liệu + `ProjectMember` schema đã build (access-control §2.3, việc RIÊNG chưa phụ thuộc báo cáo này) | Thấp — chỉ đọc Larkbase; `ProjectMember` pre-fill là ghi vào Prisma nội bộ (không đụng Larkbase) |
| **M3** | ~~Đẩy ngược lên Larkbase~~ **ĐÃ LOẠI BỎ HẲN theo quyết định 2 (§5.1)** — không có M3 cho hướng 2 chiều. Việc còn lại thuộc M-sau nếu có nhu cầu: mở rộng bộ lọc kanban theo phòng ban (câu hỏi (h)) | M2 + quyết câu hỏi (h) §5.2 | Thấp — vẫn thuần đọc, chỉ là mở rộng UI |

**Việc KHÔNG làm trong đợt này** (nói thẳng, tránh trôi phạm vi — theo mẫu các báo cáo trước): **bất kỳ hình thức ghi ngược Larkbase nào** (tạo task, sửa `Trạng thái`, tạo `Mã DA` mới — đã bị loại bỏ dứt khoát, không để ngỏ cho M-sau, khác hẳn cách `RESEARCH-MATERIAL-BRIDGE.md` để ngỏ M-sau cho vật liệu); kéo-thả kanban đổi `Trạng thái` Larkbase; gộp kanban công việc và kanban chặng sản xuất (`currentStage`, access-control §6) thành 1 board; tự tính lại `%tiến độ`/`cảnh báo trễ` bằng công thức riêng của IF (dùng formula Larkbase có sẵn); để Larkbase `Chủ trì`/`Hỗ trợ` tự động quyết quyền truy cập app (đã chốt tách biệt, §2.3).

---

## 5. QUYẾT ĐỊNH ĐÃ CHỐT & CÂU HỎI CÒN MỞ

### 5.1 Đã chốt (chủ dự án quyết dứt khoát trong lúc viết báo cáo — không còn là câu hỏi mở)

| # | Chủ đề | Quyết định | Chi tiết |
|---|---|---|---|
| **1** | Phân quyền | **Tách biệt hoàn toàn khỏi Larkbase** — dùng lại nguyên `ProjectMember` đã đề xuất ở `RESEARCH-ACCESS-CONTROL.md §2`. Larkbase `Chủ trì`/`Hỗ trợ` chỉ **pre-fill 1 lần** lúc liên kết `Mã DA`, sau đó `ProjectMember` sống độc lập, thêm/bớt tay qua nút "+ Thêm người" | §2.3 |
| **2** | Tạo dự án mới + liên kết Larkbase | `Project` tạo **cục bộ ngay**, liên kết `Mã DA` là bước **tuỳ chọn** (chọn mã có sẵn hoặc để "chưa liên kết"). **KHÔNG BAO GIỜ** `create_record` tự động lên Larkbase — pull-only tuyệt đối, không có ngoại lệ M-sau cho mảng project/task (khác `MaterialRef`, nơi vẫn để ngỏ khả năng đẩy-lên-có-kiểm-duyệt cho vật liệu) | §2.4 |
| **3** | Lối vào Gallery cho returning-user (câu hỏi (a) cũ) | **2 điểm neo**: (i) mục "Home" đặt TRƯỚC "Drafting CAD" trong thanh chuyển chặng (`StudioBar`/`Header` — cùng hàng `Drafting CAD · Rendering · Presenting`), (ii) bấm logo IF (góc trái) cũng điều hướng về Gallery. Cả 2 đều đi qua route `/` hiện có (`app/page.tsx`), không phá luồng resume — chỉ thêm lối tắt chủ động | §2.2, mới |
| **4** | Vị trí đặt Kanban (câu hỏi (g) cũ) — giao cho người điều phối quyết | **Chốt: tab trong panel "Chi tiết"** (Phương án 1 báo cáo đã khuyến nghị) — rẻ hơn, không đụng luồng carousel/grid Gallery đang chạy tốt, nhất quán vị trí với bảng phẳng + roster nhân sự cùng panel | §2.2(d) |

### 5.2 Câu hỏi còn mở

| # | Câu hỏi | Khuyến nghị |
|---|---|---|
| **(d)** | Cột "Nhân sự" Larkbase có field nhạy cảm nào không nên hiện? | **Đã tra field thật (§1.5): KHÔNG có** — chỉ Tài khoản/Họ tên/Chức danh/Phòng ban/checkbox Team Crea. An toàn hiện công khai nội bộ. (Nếu sau này Larkbase thêm cột lương/liên hệ cá nhân, cần soát lại trước khi mở rộng field hiển thị — `raw JSON` sẽ tự động lưu cả field mới đó, nên UI phải CHỌN LỌC field hiện, không hiện nguyên `raw`.) |
| **(e)** | `Mã DA = "Khác"` — có nghĩa nghiệp vụ cụ thể gì (task lặt vặt/quyết toán không thuộc dự án nào)? Có giá trị phi-số nào khác ngoài "Khác" mà IF nên biết trước khi viết bộ lọc? | Cần chủ dự án hoặc người quản lý Larkbase xác nhận — mẫu 10 record chỉ thấy 1 giá trị phi-số, không đủ đại diện cho toàn bộ ~58 revision lịch sử |
| **(f)** | Ánh xạ `Tài khoản` Larkbase (`An.LNT`) ↔ `User.id` IF — dựng bảng `LarkUserMap` tay 1 lần, ai làm (IT/quản lý), cập nhật khi nào (có nhân sự mới)? | Đề xuất IF cung cấp danh sách `User` hiện có, người quản lý Larkbase đối chiếu 1 lần — việc hành chính, không phải kỹ thuật phức tạp |
| **(h)** | Kanban/panel "Chi tiết" có cho lọc/xem theo **phòng ban** (VD chỉ xem Creative Design) không, hay luôn xem theo dự án? | Đề xuất **theo dự án** cho M1 (khớp cách brief mô tả "Gallery kết hợp Dashboard quản lý DỰ ÁN"); lọc phòng ban để M-sau nếu có nhu cầu thật |

---

## 6. ĐỐI CHIẾU VỚI YÊU CẦU GỐC

| Yêu cầu chủ dự án | Trả lời ở |
|---|---|
| "Bổ sung 1 trang Home (Gallery kết hợp Dashboard quản lý dự án)" — sau chỉnh phạm vi: **gộp vào Gallery hiện có, không route mới** | §1.1/§1.6 (Gallery đã có sẵn 80% nền — `ProjectSelect`), §2.2 (bổ sung dữ liệu tại chỗ + panel "Chi tiết" xổ ra) |
| "lấy dữ liệu từ Larkbase" | §1.5 (field thật, không đoán), §2.1 (`LarkTaskRef` mirror), §2.5 (đồng bộ pull-only) |
| Brief cũ "gallery cho phép tạo project mới/kanban" | §1.1 (tạo project: ĐÃ XONG) — kanban: CHƯA, vị trí ĐÃ CHỐT tab trong "Chi tiết" (§5.1 quyết định 4), còn để ngỏ lọc theo phòng ban (câu hỏi (h) §5.2) |
| Không lặp lại thiết kế `MaterialRef`/`ProjectMember` đã có | §2.1 (tham chiếu `MaterialRef`, không chép lại), §2.3 (dùng lại nguyên `ProjectMember` access-control, đã CHỐT không phát minh lại) |
| Quyền xem nối `RESEARCH-ACCESS-CONTROL.md`, tách biệt khỏi Larkbase | §2.3 (đã CHỐT) |
| Tạo dự án mới không ghi ngược Larkbase | §2.4 (đã CHỐT) |

---

*Hết. Không có thay đổi code nào kèm theo tài liệu này.*
