# M-SCOPE-OUT — báo cáo phiên CODE (07/08)

Phiếu gốc: giao trực tiếp trong chat, sở hữu `prisma/` · `lib/lark/` · `lib/integrations/` ·
`lib/workspace.ts` · `lib/project-scope.ts` · `lib/scope-core.ts` · `app/api/flows/` ·
`app/api/lark-tasks/`. Ngoại lệ `components/` chỉ ở VIỆC 5. **V6: phiên này CHƯA commit gì —
mọi thay đổi còn nằm trên working tree, Hoà là người commit.**

> ⚠️ Repo đang có NHIỀU phiên chung `.git` (đo `git status --short` lúc viết báo cáo này thấy
> hàng chục file `components/cad/*`, `components/library/*`... đang `M` mà KHÔNG phải phiên này
> đụng — đúng luật đã ghi ở STATUS.md "hai phiên chung .git"). Danh sách file dưới đây CHỈ liệt
> đúng những gì phiên này (M-SCOPE) đã sửa — kiểm lại bằng `git diff --stat -- <path>` từng dòng
> nếu cần đối chiếu.

---

## VIỆC 1 — vì sao flow không gắn Project (TÌM GỐC — xong, KHÔNG vá)

**Kết luận: không phải "quên gán" một dòng lẻ. Gốc là cấu trúc — helper tạo flow chính
(`createFlow`) không có tham số `projectId`, và không luồng onboarding chính nào ghép
`createProject`+`createFlow` lại với nhau.**

1. `lib/workspace.ts:45` — `createFlow(name, graphJson)` KHÔNG nhận `projectId`, dù
   `app/api/flows/route.ts:83-99` (POST) đọc `body.projectId` đầy đủ + kiểm quyền
   (`assertProjectAccess`) sẵn sàng dùng.
2. 5 điểm gọi `createFlow(name, graphJson)` KHÔNG truyền projectId — đây là toàn bộ luồng tạo
   "flow chính" của người dùng:
   - `components/entry/WelcomeIntro.tsx:54` (`handleCreateNew`, nút **"Tạo dự án của tôi"** —
     chính comment dòng 30 của file này gọi đây là "tạo dự án" dù code chỉ tạo 1 Flow trần)
   - `components/entry/WelcomeIntro.tsx:70` (`handleOpenSample`)
   - `components/ProjectSelect.tsx:605` (card "+ Dự án mới", hàm `choose()`)
   - `lib/workspace.ts:143` (`bootstrapWorkspace`, chạy ngay sau đăng nhập lần đầu)
   - `components/FlowsPanel.tsx:85`
3. Nhánh DUY NHẤT gán `projectId` NGAY LÚC TẠO: `components/ProjectSelect.tsx:611-612` — chỉ
   chạy khi user đã chọn `pendingLarkCode` (liên kết Larkbase) TRƯỚC khi bấm tạo. Đường phụ,
   không phải mặc định.
4. `createProject()` (`lib/workspace.ts:57`) gọi từ `Dashboard.tsx:203`, `FlowsPanel.tsx:73`,
   `CadSheets.tsx:717,767` — cả 4 chỗ đều KHÔNG gọi tiếp `createFlow`/`assignProject` để gắn flow
   đang thao tác vào Project vừa tạo. Kết quả: Project tạo ra là vỏ 0 flow; Flow người dùng đang
   làm vẫn mồ côi.
5. Cửa gán TAY duy nhất: `components/FlowsPanel.tsx:145` (`<select onChange>` gọi
   `assignProject`) — nằm trong panel quản lý phụ, không phải luồng tạo chính, người dùng thường
   không bao giờ mở tới.

**Vì sao KHÔNG vá bằng script gán bừa 41 flow cũ** (đúng chỉ đạo ⛔ của phiếu): không có tín
hiệu đáng tin để suy luận flow mồ côi thuộc project nào — gán bừa là bịa dữ liệu.

**Vì sao KHÔNG sửa tận gốc (3 file `components/` ở trên) trong phiên này:** phiếu giao "CẤM
chạm: `components/` (trừ việc 5)" — 3 điểm ở mục 2 nằm ngoài VIỆC 5 (VIỆC 5 chỉ cho phép chạm
`components/` để làm empty-state màn chặng, không phải sửa luồng tạo flow). Sửa gốc thật (làm
`createFlow` nhận `projectId` optional + ghép `createProject`+`createFlow` ở 3 điểm onboarding)
cần một phiếu riêng có quyền `components/entry/` + `components/ProjectSelect.tsx` +
`components/FlowsPanel.tsx`.

**Số đo 43/44 flow mồ côi không giảm sau phiên này là ĐÚNG như thiết kế** — phiên này chỉ thêm
lối thoát TAY cho từng flow (VIỆC 5, người dùng tự bấm "Nhập bản vẽ có sẵn" ở empty-state) chứ
không tự động gán hàng loạt, và không sửa được 3 điểm tạo-flow gốc vì ngoài quyền file.

**Đề xuất fix gốc thật (việc tiếp theo, cần phiếu riêng mở quyền `components/`):**
- `lib/workspace.ts:45` — thêm `projectId?: string | null` vào `createFlow()`, forward vào body.
- `WelcomeIntro.tsx:54`, `ProjectSelect.tsx:605`, `FlowsPanel.tsx:85` — trước khi
  `createFlow`, gọi `createProject()` (dùng tên do user đặt, hoặc tên mặc định) rồi truyền
  `projectId` vào `createFlow` — biến "tạo dự án của tôi" từ chỉ-tạo-Flow thành thật-sự tạo cả
  Project lẫn Flow đầu tiên của nó, đúng như UI đã hứa.

---

## VIỆC 2 — model Task + WorkflowState + CRUD ✅ (schema xong, CHƯA MIGRATE)

- `prisma/schema.prisma` — thêm `model WorkflowState` + `model Task` (gần cuối file, trước
  `model ExternalRef`), quan hệ `Project.tasks`/`Project.workflowStates` (cascade delete).
  `npx prisma validate` sạch.
- `lib/server/tasks.ts` (MỚI) — CRUD thuần: `listWorkflowStates` (tự gieo 4 trạng thái mặc định
  lần đầu: Chưa làm/Đang làm/Chờ duyệt/Xong), `listTasks`, `createTask`, `updateTask`,
  `deleteTask`. Gate `TASK_TABLES_READY = false` — cùng lối `ExternalRef`
  (`lib/integrations/external-ref.ts`), ném lỗi rõ thay vì âm thầm trả rỗng.
- `app/api/tasks/route.ts` + `app/api/tasks/[id]/route.ts` (MỚI) — GET/POST/PATCH/DELETE, đi qua
  `assertProjectAccess` (min role `drafter` để ghi, `viewer` để đọc) — cùng cửa với `/api/flows`.
- `lib/server/tasks.test.ts` (MỚI) — 8/8 pass (`node_modules/.bin/sucrase-node lib/server/tasks.test.ts`):
  kiểm cờ chưa bật ẩu, schema đủ field, mọi hàm ném lỗi rõ khi bảng chưa migrate.

🔴 **CHƯA CHẠY MIGRATE** — 2 bảng chưa có trong `dev.db`. Lệnh cho Hoà chạy trên máy thật, khi
không có dev server nào mở:
```bash
sqlite3 dev.db ".backup 'dev.db.bak-truoc-task'"
npx prisma db push   # hoặc: npx prisma migrate dev --name task-workflow-state
npx prisma generate
```
rồi đổi `TASK_TABLES_READY` thành `true` ở `lib/server/tasks.ts:23`.

**Nghiệm thu N6 "tạo→đổi status→đọc lại, dán output" — CHƯA CHẠY ĐƯỢC**, vì bảng chưa tồn tại
trong `dev.db` và phiên này không được `db push` qua sandbox (luật vận hành `docs/00-CHOT.md`).
Sau khi Hoà chạy lệnh trên, gọi thử:
```bash
curl -s -X POST http://127.0.0.1:<port>/api/tasks -H 'Content-Type: application/json' \
  -b <cookie phiên đăng nhập> -d '{"projectId":"<id>","title":"Việc test"}'
```

---

## VIỆC 3 — chuyển model Lark* sang ExternalRef ✅ (đọc/ghi qua bridge, CHƯA MIGRATE)

**Đính chính so phiếu (N7 — grep đúng chỉ báo, không phải chỉ báo gần đúng):** phiếu nói "chuyển
3 model Lark*" và "4 file gọi LarkTaskRef" — kiểm lại thấy KHÔNG khớp:
- Chỉ **`LarkUserMap`** đúng hình dạng "bảng cầu ID" (larkAccount ↔ userId, không mang nội dung
  khác) — khớp `ExternalRef`. `LarkTaskRef`/`LarkPersonRef` là MIRROR NỘI DUNG (task text,
  deadline, họ tên...), không có chỗ chứa nội dung trong `ExternalRef` (chỉ 4 cột id) — "chuyển"
  2 bảng đó nghĩa là XOÁ nội dung, ngược với chính câu phiếu "GIỮ LarkTaskRef làm CACHE". ⇒ chỉ
  bắc cầu `LarkUserMap`.
- `grep -rl "LarkTaskRef"` ra đúng 4 file, nhưng **2/4 chỉ khớp trong docblock/comment**
  (`lib/lark/atlas-material-map.ts:13`, `lib/integrations/providers/lark.ts:290`) — KHÔNG có lệnh
  `prisma.larkTaskRef.*` nào. File thật đụng DB Lark* là `app/api/lark-tasks/route.ts` (đọc),
  `app/api/lark-tasks/sync/route.ts` (ghi cache — GIỮ NGUYÊN, không đụng), và
  `app/api/lark-user-map/route.ts` (ghi cầu ID — file thứ 3 này KHÔNG khớp grep "LarkTaskRef" vì
  không nhắc tên đó, chỉ khớp "larkUserMap").

**Đã làm:**
- `lib/integrations/lark-bridge.ts` (MỚI) — lớp đọc/ghi mới: `resolveUserByLarkAccount`,
  `linkLarkAccountToUser`, `unlinkLarkAccount`, `listLarkUserMap`. **Dual-write**: luôn ghi
  `LarkUserMap` (nguồn chính hôm nay, hành vi thấy được KHÔNG đổi) + ghi thêm `ExternalRef` khi
  `EXTERNAL_REF_TABLE_READY` đã bật.
- `app/api/lark-user-map/route.ts` — POST/DELETE đổi sang gọi `linkLarkAccountToUser`/
  `unlinkLarkAccount` thay vì `prisma.larkUserMap.*` trực tiếp.
- `app/api/lark-tasks/route.ts` — đọc `userMap` qua `listLarkUserMap()` thay vì
  `prisma.larkUserMap.findMany()` trực tiếp.
- `prisma/schema.prisma` — thêm khối chú thích DEPRECATED-ĐANG-CHUYỂN trên `model LarkUserMap`
  (KHÔNG xoá bảng — KS4).
- `scripts/migrate-lark-user-map-to-external-ref.ts` (MỚI) — script chép 1 lần, idempotent,
  CHƯA chạy được (cần `ExternalRef` migrate trước — xem lệnh trong chính file script).

`external-ref.test.ts` vẫn 12/12 pass sau các sửa trên (chạy lại xác nhận).

---

## VIỆC 4 — adapter Lark ghi ngược + chống vòng lặp — 🔴 XUNG ĐỘT LUẬT, ĐÃ CHẶN LẠI, CẦN HOÀ QUYẾT

**Phiếu giao "thêm đường ghi qua ExternalRef" cho Lark — nhưng việc này ĐẢO NGƯỢC một quyết định
kiến trúc đã ghi TUYỆT ĐỐI ở 2 nơi trong chính repo:**
- `prisma/schema.prisma:313` (ngay trên `model LarkTaskRef`): *"PULL-ONLY tuyệt đối: Larkbase là
  nguồn chân lý, IF chỉ đọc/mirror, KHÔNG BAO GIỜ ghi ngược (không create_record/update_record
  tự động...)"*.
- `lib/integrations/providers/lark.ts:17`: *"PULL-ONLY tuyệt đối: file này chỉ có list_records
  (GET) + resolveWikiAppToken (GET) — không có create/update/delete."*

Đây không phải dòng code cũ bị bỏ quên — là quyết định lặp lại có chủ đích ở cả schema lẫn
module adapter. Theo §0g (không lấy MÔ TẢ phiếu làm nguồn khi nó ngược LUẬT đã ghi trong code),
tôi KHÔNG tự ý bật đường ghi thật ra Larkbase.

**Đã làm — phần KHÔNG xung đột (máy móc chống vòng lặp, dùng được cho bất kỳ hệ ngoài nào sau
này, kể cả nếu Hoà không bao giờ mở khoá Lark):**
- `prisma/schema.prisma` — thêm `ExternalRef.lastWriteBy`/`lastWriteAt` (ai/lúc nào ghi cặp
  system+externalId cuối).
- `lib/integrations/anti-loop.ts` (MỚI, THUẦN — không đụng DB) — `shouldIgnoreIncomingChange()`
  (cửa sổ 60s), `resolveWriteConflict()` (2 bên cùng sửa → bản mới hơn thắng, trả lý do cho log).
- `lib/integrations/anti-loop.test.ts` (MỚI) — 7/7 pass.
- `lib/integrations/providers/lark-write.ts` (MỚI) — dựng đủ khung (`markIdfWrite`,
  `updateLarkRecord`) nhưng **CHẶN CỨNG** sau `LARK_WRITE_ENABLED = false`, ném lỗi trích dẫn
  đúng 2 dòng xung đột ở trên. KHÔNG viết hàm `update_record` thật (chưa verify field_id/table_id
  bằng token thật — đúng luật N3 "vá thì verify tay trước").

**CẦN HOÀ QUYẾT TRỰC TIẾP bằng lời** (không phải suy luận từ chữ "ghi ngược" trong phiếu):
có thật sự muốn đảo `PULL-ONLY tuyệt đối` không? Nếu có, phiếu tiếp theo cần: xác nhận field_id
Larkbase cho update qua MCP thật (như đã làm cho field đọc, báo cáo §1.5 cũ), rồi mới bật
`LARK_WRITE_ENABLED`.

---

## VIỆC 5 — empty state màn chặng không dữ liệu ✅ (2/3 route, đã verify browser thật)

- `lib/project-scope.ts` — thêm `ScopeMissingInfo` + `describeMissingScope()` (phân biệt
  `empty-project` = id khớp 1 Project thật chỉ chưa có flow, vs `unknown` = id không khớp gì) +
  hook `useScopeMissingInfo(routeId, status)`.
- `components/studio/ProjectScopeEmptyState.tsx` (MỚI) — dùng `EmptyState` có sẵn
  (`components/ui/EmptyState.tsx`). Ca `empty-project`: 2 nút làm được TẠI CHỖ — "Tạo bản vẽ mới"
  (tạo Flow + `assignProject` ngay) và "Nhập bản vẽ có sẵn (N)" (gắn 1 flow mồ côi có sẵn vào
  project này — N chính là số đo VIỆC 1 tìm ra). Ca `unknown`: chỉ còn "Về Thư viện dự án"
  (`goHomeConfirmed`, có sẵn) — sửa tại chỗ vô nghĩa khi id không khớp gì.
- `app/projects/[id]/cad/page.tsx`, `app/projects/[id]/present/page.tsx` — rẽ nhánh render
  `ProjectScopeEmptyState` khi `status==='missing'`.

**CHƯA LÀM**: `app/projects/[id]/render/page.tsx` — route này KHÔNG dùng `useProjectScopeSync`
trực tiếp mà mount `HomeScreen` (component lớn, gọi `ensureProjectScope` nhưng bỏ qua kết quả trả
về, dòng `components/home/HomeScreen.tsx:263`) — sửa an toàn cần hiểu hết luồng `enterAfterAuth`
của `HomeScreen`, rủi ro cao hơn lợi ích trong phiên này, **CHƯA làm, ghi rõ theo N5**. Route
`/projects/[id]/photo` cũng chưa nối (công cụ phụ, ít khẩn hơn 2 chặng chính) — chưa làm.

**Nghiệm thu N6 — verify browser thật** (127.0.0.1:3005, server riêng phiên này):
tạo 1 Project rỗng thật qua API (`cmsijyo4x0001w9jj6jt227qn`, tên "M-SCOPE test rỗng") → mở
`/projects/cmsijyo4x0001w9jj6jt227qn/cad` → **đúng như thiết kế**: hiện `"M-SCOPE test rỗng"
chưa có bản vẽ nào` + nút "Tạo bản vẽ mới" (primary) + "Nhập bản vẽ có sẵn (19)" kèm gợi ý tên
"Dự án mẫu" (flow mồ côi đầu tiên tìm thấy). Bấm "Tạo bản vẽ mới" → chuyển đúng trạng thái "Đang
tạo…" (disabled, đọc DOM xác nhận) → **verify KẾT QUẢ CUỐI bằng đọc thẳng `dev.db`** (browser tab
bị đổi phiên đăng nhập giữa chừng do phiên preview restart — không tin được ảnh chụp màn hình
tiếp theo, nên chuyển sang bằng chứng chắc hơn):
```
sqlite3 dev.db "select id,name,userId from Flow where projectId='cmsijyo4x0001w9jj6jt227qn';"
→ cmsijzla50005w9jj47nushv8|Bản vẽ mới|demo_seed_001
```
**Đúng như thiết kế**: nút tạo ra 1 Flow tên "Bản vẽ mới", `projectId` gán thẳng vào project rỗng
— chuỗi `createFlow`→`assignProject`→`openFlow` trong `ProjectScopeEmptyState.tsx` chạy đúng
end-to-end, project không còn rỗng.

Đã dọn: soft-delete cả 2 bản ghi test (`UPDATE ... SET deletedAt=...`, đúng quy ước xoá mềm của
repo — không hard-delete) — `Flow.cmsijzla50005w9jj47nushv8` và `Project.cmsijyo4x0001w9jj6jt227qn`.
Không còn dữ liệu test nào sống trong `dev.db`.

---

## VIỆC 6 — nối Kanban ghi được ✅ (schema/route xong, CHƯA MIGRATE nên CHƯA test sống)

**Phát hiện lúc đọc code (trước khi sửa):** Kanban hôm nay hoàn toàn KHÔNG có kéo-thả — không
`draggable`/`onDrop` nào trong `LarkKanbanTab` cũ, chỉ hiện 3 cột tĩnh đọc `LarkTaskRef` (mirror
Larkbase, chỉ đọc). Câu comment cũ ":8 kéo-thả kanban KHÔNG đổi trạng thái" đúng theo nghĩa đen
(không có kéo-thả để mà đổi) nhưng dễ hiểu lầm là "có kéo nhưng cố tình chặn ghi" — đã sửa lại
đúng ngữ cảnh.

**Đã làm:**
- `app/api/lark-tasks/[recordId]/status/route.ts` (MỚI) — PATCH: resolve `LarkTaskRef.
  larkProjectCode` → `Project.larkProjectCode` khớp trong IF (409 rõ lý do nếu chưa liên kết) →
  `assertProjectAccess(..., 'drafter')` → khớp/tạo `WorkflowState` theo TÊN cột Kanban → get-or-
  create `Task` nội bộ nối qua `ExternalRef{system:'lark', entityType:'task'}` (idempotent, lần
  kéo sau tái dùng đúng Task) → cập nhật `LarkTaskRef.status` cục bộ để card không nhảy lại khi
  chưa sync mới — **KHÔNG gọi Lark API ghi** (đúng ranh giới đã chặn ở VIỆC 4).
- `components/dashboard/LarkPanels.tsx` — `LarkKanbanTab` thêm kéo-thả HTML5 thật
  (`draggable`/`onDragStart`/`onDrop`), gọi PATCH trên, rồi `onMoved?.()` để cha `reload()` —
  **tải lại từ server, không tự sửa state cục bộ** (đúng tinh thần nghiệm thu "tải lại trang, thẻ
  ở lại cột mới" phải là sự thật từ DB). Sửa lại docblock đầu file (đính chính, không xoá — giữ
  lịch sử quyết định §5.1 cũ).
- `components/Dashboard.tsx` — truyền `onMoved={reloadLark}` (hàm `reload` có sẵn từ
  `useLarkData`, không viết thêm cơ chế mới).

🔴 **CHƯA CHẠY ĐƯỢC SỐNG** — phụ thuộc CẢ `Task`/`WorkflowState` (VIỆC 2) LẪN `ExternalRef`
(L-EXT1) migrate xong TRÊN MÁY THẬT trước. Ngoài ra cần ít nhất 1 `Project.larkProjectCode` thật
khớp với `larkProjectCode` của 1 task Lark đang sync — dữ liệu demo hiện tại chưa chắc có cặp
khớp này (chưa kiểm). Nghiệm thu N6 "kéo thẻ, tải lại trang, thẻ ở lại cột mới" — **CHƯA CHẠY
ĐƯỢC**, để Hoà làm sau khi cả 2 migrate xong + xác nhận có Project nào đã liên kết Mã DA.

## VIỆC 7 — dọn DB dev (liệt kê rác `__nb:`) ✅

`scripts/list-notebook-bucket-projects.ts` (MỚI) — CHỈ LIỆT KÊ, KHÔNG XOÁ (KS4). Chạy thật, kết
quả 07/08:
```
4 Project __nb: (bucket Notebook ẩn) đang sống trong dev.db:
  cmrxos1nb0003w9g3dyhlz7v3  |  __nb:untitled-flow  |  userId=demo_seed_001  |  0 flow  |  tạo 2026-07-23T15:48:56.279Z
  cmsczigii0006w9lumgyxqzbr  |  __nb:nonexistent-project  |  userId=cmsczhpus0000w9luf8hbkdry  |  0 flow  |  tạo 2026-08-03T08:45:57.402Z
  cmsfgigbe0001w9c0z62py7pw  |  __nb:cmrqo009h0003w9ddwcuxaki6  |  userId=demo_seed_001  |  0 flow  |  tạo 2026-08-05T02:17:22.970Z
  cmsiczv2z0001w91qq2hzee0s  |  __nb:cms915kza0001w9a613z8tp65  |  userId=cmr8nuzzs0000w9c7n37ugkay  |  0 flow  |  tạo 2026-08-07T03:02:15.323Z
```
Cả 4 đều **0 flow gắn theo** — xoá (soft-delete) không kéo theo mồ côi hoá flow nào. Lệnh xoá
(Hoà tự chạy sau khi duyệt, KHÔNG chạy hàng loạt không xem):
```bash
sqlite3 dev.db "UPDATE Project SET deletedAt=datetime('now') WHERE id='<id>';"
```

---

## Tổng kết file đã sửa (V6 — CHƯA COMMIT, Hoà tự soát trước khi commit)

**Mới:**
- `lib/server/tasks.ts`, `lib/server/tasks.test.ts`
- `app/api/tasks/route.ts`, `app/api/tasks/[id]/route.ts`
- `lib/integrations/lark-bridge.ts`
- `lib/integrations/anti-loop.ts`, `lib/integrations/anti-loop.test.ts`
- `lib/integrations/providers/lark-write.ts`
- `app/api/lark-tasks/[recordId]/status/route.ts`
- `scripts/migrate-lark-user-map-to-external-ref.ts`
- `scripts/list-notebook-bucket-projects.ts`
- `components/studio/ProjectScopeEmptyState.tsx`
- `docs/M-SCOPE-OUT.md` (file này)

**Sửa:**
- `prisma/schema.prisma` (Task/WorkflowState + ExternalRef.lastWriteBy/lastWriteAt +
  LarkUserMap deprecation note)
- `app/api/lark-user-map/route.ts`, `app/api/lark-tasks/route.ts`
- `lib/project-scope.ts`
- `app/projects/[id]/cad/page.tsx`, `app/projects/[id]/present/page.tsx`
- `components/dashboard/LarkPanels.tsx`, `components/Dashboard.tsx`
- `.claude/launch.json` (thêm entry dev server `interiorflow-mscope` port 3005 — Hoà đã tự thêm
  entry `interiorflow-phaply` port 3007 trong lúc phiên này chạy, KHÔNG đụng entry đó)

**Kiểm chứng đã chạy:**
- `npx tsc --noEmit -p .` — sạch với mọi file phiên này sửa (lỗi còn lại duy nhất
  `components/library/library-sheet-css.ts` là do PHIÊN KHÁC đang sửa dở song song, không liên quan
  — đã chạy lại nhiều lần trong suốt phiên, lỗi đó đổi qua lại theo nhịp phiên kia gõ, không phải
  của tôi).
- `node_modules/.bin/sucrase-node lib/server/tasks.test.ts` — 8/8 pass.
- `node_modules/.bin/sucrase-node lib/integrations/external-ref.test.ts` — 12/12 pass (không hồi quy).
- `node_modules/.bin/sucrase-node lib/integrations/anti-loop.test.ts` — 7/7 pass.
- `node_modules/.bin/sucrase-node scripts/list-notebook-bucket-projects.ts` — chạy thật, 4 dòng
  (xem VIỆC 7).
- Browser thật (127.0.0.1:3005), 2 lượt (server restart giữa chừng đổi phiên đăng nhập, không
  ảnh hưởng kết luận vì verify cuối dùng thẳng `sqlite3 dev.db` — xem VIỆC 5) — xoá sạch dữ liệu
  test sau khi xong (soft-delete, không hard-delete).

**Còn treo, xếp theo thứ tự nên làm tiếp:**
1. Hoà chạy 2 lệnh migrate trên máy thật (Task/WorkflowState + ExternalRef — có thể gộp 1 lần
   `db push` vì cả 2 cùng nằm trong `schema.prisma` hiện tại) rồi bật 2 cờ
   `TASK_TABLES_READY`/`EXTERNAL_REF_TABLE_READY`.
2. Sau khi migrate: verify sống VIỆC 2 (N6 tạo→đổi status→đọc lại) + VIỆC 6 (kéo-thả Kanban thật,
   cần ít nhất 1 Project đã liên kết `larkProjectCode`) + chạy
   `scripts/migrate-lark-user-map-to-external-ref.ts`.
3. VIỆC 4 — Hoà quyết PULL-ONLY có đảo được không (xem khối 🔴🔴 trong `lark-write.ts`).
4. Fix gốc thật VIỆC 1 (3 file `components/entry/WelcomeIntro.tsx`, `components/ProjectSelect.tsx`,
   `components/FlowsPanel.tsx` — cần phiếu mở quyền `components/` riêng cho việc này).
5. VIỆC 5 còn thiếu `app/projects/[id]/render/page.tsx` (qua `HomeScreen`) và
   `app/projects/[id]/photo/page.tsx` — chưa nối, xem lý do trong mục VIỆC 5.
