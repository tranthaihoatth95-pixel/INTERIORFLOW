# H11 — rev optimistic-concurrency enforcement (19/08)

## ① Việc được giao
Phiếu MAIN: `rev` sống ở 4 model (`Project`,`ProjectProfile`,`Flow`,`LibraryAsset`), tăng bằng
`{ increment: 1 }` ở 7+ chỗ nhưng **0 chỗ dùng `where: { id, rev: expectedRev }`** — 2 người sửa
cùng lúc, người sau ghi đè âm thầm người trước. Làm ĐÚNG 1 route chuẩn nếu phạm vi 4 model quá
rộng cho 1 phiếu; đề xuất `app/api/flows/[id]/route.ts`.

## ② Tiền đề tự đo lại (⓪)
- `grep -n "rev.*increment" app/api/**/*.ts` xác nhận **6 chỗ** trong 3 route: `projects/[id]/members`
  (3), `library/[id]` (1), `flows/[id]` (4). `flows/[id]` là trung tâm nhất — 4/6 điểm, có client
  writer rõ ràng (`lib/store.ts` autosave debounce 2s).
- 🔴 **Đính chính premise của MAIN**: đo `prisma/schema.prisma` — 4 model có `rev` thật là
  `Project`, `ProjectMember`, `Flow`, `LibraryAsset`. **`ProjectProfile` KHÔNG có field `rev`**
  (model 150-163, không có dòng `rev`). MAIN ghi nhầm `ProjectProfile` thay vì `ProjectMember`.
  Không chặn việc (Flow vẫn đúng đối tượng), nhưng cần sửa lại sổ nếu phiếu sau đọc lại.
- Client: `lib/workspace.ts openFlow()` **KHÔNG lưu `rev` vào state khi mở flow** — đúng như MAIN
  cảnh báo, "client hoàn toàn không có khái niệm rev hiện tại tôi đang cầm" TRƯỚC lượt sửa này.
  Đây là lý do việc này là thay đổi 2 phía bắt buộc, không chỉ server.
- Không REFUSE: phạm vi 1 route (Flow) đủ nhỏ để làm trọn 2 phía (server + client) trong 1 phiếu.

## ③ Đã làm (phạm vi thật: 1 route — `flows/[id]`, KHÔNG đụng 3 route/model còn lại)
**Server — `app/api/flows/[id]/route.ts`:**
- `RevConflictError` + `updateFlowWithRevCheck(flowId, expectedRev, data)`: dùng Prisma "extended
  whereUnique" `where: { id, rev: expectedRev }` (Prisma ≥4.5, @prisma/client 6.19 xác nhận qua
  test tích hợp) — 0 hàng khớp ném `P2025`, bắt riêng thành `RevConflictError` → HTTP 409
  `{ error, code: 'REV_CONFLICT' }`.
- Áp cho **cả 3 nhánh PUT** (snapshot / share-unshare / autosave mặc định) — tất cả đều tăng
  `rev` nên đều cần bảo vệ. Không gửi `expectedRev` (body không có, hoặc không phải number) →
  `revWhere` trả về `{ id }` thuần, hành vi y hệt trước giờ (backward-compatible).
- Cả 3 nhánh trả `rev` mới trong response để client cập nhật lại state đúng số đang có trên DB.
- Tác dụng phụ bắt buộc: đổi kiểu `data` từ `Record<string, unknown>` sang `Prisma.FlowUpdateInput`
  (cần cho `Prisma.PrismaClientKnownRequestError`) → lộ ra `data.projectId = target` không hợp lệ
  với kiểu quan hệ Prisma sinh; sửa thành `data.project = target ? { connect } : { disconnect: true }`
  — CÙNG hành vi DB, chỉ đổi cách Prisma diễn đạt field quan hệ.
- **DELETE KHÔNG đụng** — nằm ngoài phạm vi phiếu ("PATCH/PUT"), và rủi ro race của xoá khác hẳn
  race của ghi nội dung; để lại nguyên vẹn.

**Client — `lib/store.ts` + `lib/workspace.ts`:**
- `FlowState.currentFlowRev: number | null` — rev flow đang mở đang cầm trên máy.
- `loadGraph(...)` nhận thêm tham số `rev?: number`; `openFlow()` (`lib/workspace.ts`) đọc
  `body.flow.rev` từ GET và truyền vào — client bắt đầu phiên làm việc với đúng rev server có.
- `persistNow()` (autosave debounce 2s, writer chính gây race): gửi `expectedRev: currentFlowRev`
  khi có (null → không gửi, coi như client cũ). Nhận **409** → gọi `setNotice(...)` báo người dùng
  bằng tiếng Việt, **KHÔNG tự động ghi lại / không âm thầm ghi đè**. Nhận 200 → đọc `rev` mới từ
  response, cập nhật `currentFlowRev` — vòng tiếp theo autosave dùng đúng số mới. Có chặn race
  "chuyển flow giữa lúc request đang bay" bằng chốt `flowIdAtRequest` trước khi ghi state.
- `snapshotFlow()`/`toggleShare()` (`lib/workspace.ts`) **CHƯA sửa gửi `expectedRev`** — cố ý để
  nguyên (không phải writer chính gây race nội dung, và đổi thêm sẽ vượt phạm vi 1 phiên); vẫn
  chạy đúng vì server coi thiếu `expectedRev` là hành vi cũ.

## ④ Nghiệm thu
- `npm run tsc` — **pass, 0 lỗi** (chạy 2 lần, sau cả 2 vòng sửa).
- Test mới `app/api/flows/[id]/route.test.ts` (khuôn `lib/server/draft-project.test.ts` — không
  dựng được route handler thật qua sucrase-node vì `ownFlow()` cần session/cookie, đúng giới hạn
  đã ghi lại trong repo trước đó):
  - **① Integration, Prisma thật trên dev.db** (không mock) — tạo user+flow tạm, tự dọn:
    (a) rev khớp → update chạy, rev tăng đúng 1, ghi đúng dữ liệu.
    (b) rev lệch → `prisma.flow.update({ where: { id, rev: 0 } })` ném đúng **P2025** trên DB
        thật (điểm rủi ro kỹ thuật thật sự của cả cơ chế — nếu Prisma âm thầm bỏ qua điều kiện
        `rev` thừa thì mọi thứ vô nghĩa); DB **không đổi** sau lần ghi bị chặn.
    (c) không truyền `rev` vào `where` → luôn ghi được bất kể rev hiện tại — xác nhận nhánh
        backward-compat.
  - **② Cấu trúc, đọc source thật**: route.ts có `RevConflictError` + bắt đúng mã `P2025`; cả 3
    nhánh PUT đều `return REV_CONFLICT_RESPONSE()` (đếm bằng regex, không sót nhánh) và đều trả
    `rev` mới; `store.ts` có `currentFlowRev`, gửi `expectedRev`, xử `res.status === 409`;
    `workspace.ts` đọc `body.flow.rev` truyền vào `loadGraph`.
  - Chạy: `node_modules/.bin/sucrase-node "app/api/flows/[id]/route.test.ts"` → **10/10 PASS**.
- **BROWSER-PENDING** (chưa chạy, cần trình duyệt thật):
  1. Đăng nhập, mở 1 flow ở tab A và tab B (cùng URL flow).
  2. Tab A sửa graph (kéo 1 node), đợi >2s cho autosave chạy — tab A giờ cầm `currentFlowRev = N+1`
     đúng.
  3. Tab B (vẫn đang cầm `currentFlowRev = N` từ lúc mở) sửa graph, đợi autosave — kỳ vọng: request
     PUT của tab B nhận **409**, `notice` hiện *"Ai đó vừa sửa flow này trước bạn — tải lại trang
     để lấy bản mới nhất."*, và **graphJson trên DB vẫn là bản của tab A**, KHÔNG bị tab B ghi đè
     im lặng.
  4. Tab B tải lại trang → mở đúng flow → `openFlow` nạp lại `rev` mới từ server → sửa tiếp bình
     thường, autosave chạy lại được.

## ⑤ Rủi ro / giới hạn còn lại (khai thẳng, không phải phiếu này giải)
- **3/4 model còn lại chưa có rev-enforcement**: `Project` (route `projects/[id]`?), `ProjectMember`
  (`app/api/projects/[id]/members/route.ts`, 3 chỗ increment), `LibraryAsset`
  (`app/api/library/[id]/route.ts`, 1 chỗ). Cùng risk y hệt Flow, cùng cách sửa (đã có
  `updateFlowWithRevCheck` làm khuôn mẫu — đổi tên thành hàm chung theo model khi làm tiếp), nhưng
  MỖI route có client writer khác nhau cần rà riêng (vd `members` có thể có nhiều nơi gọi
  PATCH role/xoá thành viên hơn Flow) — để phiếu riêng, không cố nhét vào phiếu này.
- `snapshotFlow()` và `toggleShare()` chưa gửi `expectedRev` — race hiếm hơn (bấm "Đánh dấu bản
  này" / bật share không xảy ra liên tục như autosave), nhưng vẫn có thể conflict nếu 2 tab bấm
  gần nhau; nâng cấp rẻ (đọc `useFlowStore.getState().currentFlowRev` y hệt persistNow) — để lại
  cho phiếu sau nếu Hoà muốn phủ hết.
- `DELETE` chưa có rev check — xoá đè lên bản đang sửa dở của tab khác vẫn có thể xảy ra (khác
  loại race, chưa xử ở phiếu này).
- Test ② (cấu trúc) đọc source bằng regex/string match — chặt với thay đổi format code (đổi
  `return REV_CONFLICT_RESPONSE();` thành dạng khác làm test đỏ dù logic vẫn đúng); chấp nhận vì
  đây là khuôn đã có tiền lệ trong repo (`draft-project.test.ts`), không phải tự chế.

## ⑥ Kết luận
Phạm vi thật đã làm: **1 route** (`app/api/flows/[id]/route.ts`) + phần client tương ứng
(`lib/store.ts`, `lib/workspace.ts`) — đúng như MAIN cho phép khi phạm vi 4 model vượt quá 1
phiếu. `Project`/`ProjectMember`/`LibraryAsset` còn nguyên rủi ro cũ, khai rõ ở ⑤ cho phiếu sau.

## ⑦b Chưa chắc / chưa kiểm
- Chưa chạy kịch bản 2-tab thật trên trình duyệt (kịch bản đã viết ở ④, chưa thực thi).
- Chưa kiểm `res.json()` trong `.catch(() => null)` của `persistNow` có silently swallow lỗi parse
  hợp lệ hay không trong mọi trình duyệt — logic hiện tại: parse lỗi → `body` null → bỏ qua cập
  nhật `currentFlowRev` (an toàn, không throw), nhưng chưa test riêng case response 200 với body
  JSON hỏng (không thực tế xảy ra vì server luôn trả JSON hợp lệ, nhưng chưa chứng minh bằng test).
- Chưa đo ảnh hưởng hiệu năng của thêm 1 điều kiện `rev` vào WHERE (không đáng kể về lý thuyết vì
  `id` đã là primary key, nhưng chưa benchmark).

## ⑦c Hạn dùng kết luận
Kết luận "3 route còn lại (`Project`, `ProjectMember`, `LibraryAsset`) chưa có rev-enforcement"
đúng tại thời điểm 19/08. Hết hạn ngay khi có phiếu H11-phần-2 hoặc tương đương làm tiếp — kiểm
lại bằng `grep -n "rev.*expectedRev\|RevConflictError" app/api/projects/\[id\]/members/route.ts
app/api/library/\[id\]/route.ts` trước khi tin sổ này.
