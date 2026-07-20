# NGHIÊN CỨU · Cộng tác nhóm — Comment bất đồng bộ (CAD+Rendering) & Real-time (Presenting) — InteriorFlow

> **Trạng thái: ĐỀ XUẤT, CHƯA THỰC THI.** Tài liệu này KHÔNG kèm thay đổi schema/API/UI nào.
> Mọi khối code bên dưới là **mẫu minh hoạ**, chưa áp vào repo.
>
> Nhánh: `feat/research-team-collaboration` · Ngày: 2026-07-20 · Mọi khẳng định về code đã verify
> bằng đọc file thật (đường dẫn + số dòng trích dẫn trực tiếp) trong repo chính
> (`/Users/tranben/Downloads/interiorflow`, HEAD `5342820`), không đoán.

## Mục lục

0. [Tóm tắt cho người bận](#0-tóm-tắt-cho-người-bận)
1. [Hiện trạng đã verify](#1-hiện-trạng-đã-verify)
   - 1.1 [CommentLayer cũ — công cụ dev-review, KHÁC mục đích](#11-commentlayer-cũ--công-cụ-dev-review-khác-mục-đích)
   - 1.2 [Presence/live-cursor hiện có — chỉ 1/3 chặng, chỉ con trỏ](#12-presencelive-cursor-hiện-có--chỉ-13-chặng-chỉ-con-trỏ)
   - 1.3 [Schema DB — chưa có `Comment`, chưa có `ProjectMember`](#13-schema-db--chưa-có-comment-chưa-có-projectmember)
   - 1.4 [Hạ tầng — 0 real-time backend](#14-hạ-tầng--0-real-time-backend)
   - 1.5 [Presenting — model phẳng, KHÔNG có server source-of-truth](#15-presenting--model-phẳng-không-có-server-source-of-truth)
   - 1.6 [`IF1_IF2_BIGPICTURE.md` — verify trạng thái tài liệu](#16-if1_if2_bigpicturemd--verify-trạng-thái-tài-liệu)
2. [Đề xuất kiến trúc — Phần A: comment/ghim bất đồng bộ (CAD+Rendering)](#2-đề-xuất-kiến-trúc--phần-a-commentghim-bất-đồng-bộ-cadrendering)
3. [Đề xuất kiến trúc — Phần B: real-time multi-user (Presenting)](#3-đề-xuất-kiến-trúc--phần-b-real-time-multi-user-presenting)
4. [Rủi ro & giới hạn](#4-rủi-ro--giới-hạn)
5. [Phân kỳ đề xuất](#5-phân-kỳ-đề-xuất)
6. [Đối chiếu với yêu cầu gốc](#6-đối-chiếu-với-yêu-cầu-gốc)
7. [Câu hỏi cần chủ dự án quyết](#7-câu-hỏi-cần-chủ-dự-án-quyết)

---

## 0. TÓM TẮT CHO NGƯỜI BẬN

**InteriorFlow có 2 mảnh "cộng tác" đã tồn tại, nhưng CẢ HAI đều không phải thứ brief này cần —
chỉ dùng được làm bài học/nguyên liệu, không phải nền tảng cắm thẳng vào.**

| # | Phát hiện | Mức |
|---|---|---|
| 1 | 🟡 **"Góp ý" (`CommentLayer.tsx`) là công cụ dev-review nội bộ** (Claude Code đọc file JSON để tự sửa app qua tunnel điện thoại), lưu vào 1 file JSON phẳng **không có `projectId`**, **toàn app dùng chung 1 danh sách**, ghim theo **% viewport** (trôi khi đổi màn hình — đúng bài học đã ghi trong `docs/HANDOFF-gop-y-redesign.md`). Không tái dùng được cho comment dự án thật — phải xây `Comment` Prisma model mới. |
| 2 | 🟡 **Hệ live-cursor/presence (`lib/collabStore.ts` + `app/api/cursors`) CHỈ mount ở `FlowCanvas.tsx`** (`components/FlowCanvas.tsx:343-344`) — tức chặng **Rendering** (`/`, node canvas). **KHÔNG có ở `/cad-editor` lẫn `/present-editor`.** Đây là nghịch lý đáng báo: hạ tầng real-time-nhẹ (con trỏ sống) đang nằm SẴN ở đúng chặng mà brief mới muốn chuyển thành **bất đồng bộ** (Rendering, cùng nhóm với CAD), còn chặng brief muốn **real-time thật** (Presenting) thì **0 hạ tầng**. Xem câu hỏi Q6 (§7). |
| 3 | 🔴 **Presenting KHÔNG có server source-of-truth nào cho deck** — `lib/sheets-persist.ts` lưu 100% vào **IndexedDB của trình duyệt**, khoá theo `userId::route` (1 máy, 1 người). `app/api/present/` chỉ có `text/route.ts` (trợ lý AI viết chữ) — không có route lưu/đọc deck, không có model `Deck` trong `prisma/schema.prisma`. **Trước khi bàn CRDT/Yjs, Presenting còn thiếu cả bước cơ bản hơn: 1 tài liệu tồn tại trên server để nhiều người cùng trỏ vào.** |

**Đề xuất cốt lõi:** Phần A (comment CAD+Rendering) là việc **rẻ, độc lập, làm được ngay** — 1
Prisma model mới + poll khi mở trang (không cần loop liên tục). Phần B (real-time Presenting) là
**đầu tư hạ tầng thật** — không chỉ "thêm CRDT" mà còn phải **dựng server-side Deck trước**, rồi mới
tính tới kênh đồng bộ (tự host / hosted / polling giả-real-time). Khuyến nghị: ship A trước, đo
nhu cầu B bằng polling giả-real-time (M1 rẻ) trước khi cam kết hạ tầng Yjs thật (đắt, có phụ thuộc
bên thứ 3 nếu chọn hosted) — cùng tinh thần "chỉ đề xuất, đo nhu cầu thật trước khi xây hạ tầng
nặng" đã dùng ở `RESEARCH-MATERIAL-BRIDGE.md §4.2`.

---

## 1. HIỆN TRẠNG ĐÃ VERIFY

### 1.1 CommentLayer cũ — công cụ dev-review, KHÁC mục đích

`docs/HANDOFF-gop-y-redesign.md` (đọc toàn văn) tự mô tả rất rõ mục đích thật: *"Claude Code trên
máy đọc file JSON rồi sửa app theo góp ý... vòng review từ xa: xem app qua tunnel trên phone → ghim
góp ý → dev sửa"* — đây là công cụ **nội bộ đội dev**, không phải tính năng cộng tác cho khách
hàng/đồng nghiệp KTS dùng trong dự án thật. Verify khớp code:

- `components/CommentLayer.tsx` (430 dòng, đọc toàn văn) — mount ở `app/page.tsx` và
  `app/present-editor/page.tsx` (theo handoff doc), gate tắt mặc định qua
  `NEXT_PUBLIC_COMMENT_LAYER !== '1'`.
- `app/api/comments/route.ts` (127 dòng) — lưu vào **1 file JSON phẳng** `comments-review.json` ở
  gốc repo (`FILE = path.join(process.cwd(), 'comments-review.json')`, dòng 19), **không phải DB**,
  **không có `projectId`/`flowId` FK** — chỉ có `route: string` (đường dẫn URL) làm ngữ cảnh. Toàn
  app (mọi dự án, mọi user) đọc/ghi CHUNG 1 danh sách.
- ✅ **Đã có auth** (khác với phát hiện 🔴#1 của `RESEARCH-ACCESS-CONTROL.md §0`, tài liệu đó verify
  trước đợt `fix-api-auth-p0`) — GET/POST/PATCH/DELETE đều gọi `getSessionUser()` đầu hàm
  (`route.ts:62,68,100,114`), và `DELETE ?all=1` giờ đòi `user.isAdmin` (`route.ts:118-119`). Đây
  là tiến bộ thật kể từ báo cáo trước, đáng ghi nhận.
- **Ghim %viewport, không bám phần tử sống** — `startDraftAt()` (`CommentLayer.tsx:81-88`) tính
  `xPct = clientX/window.innerWidth*100` rồi lưu thẳng vào `draft.x/y`; `elementHint` chỉ là **chuỗi
  mô tả tĩnh** chụp 1 lần lúc tạo (`` `${el.tagName}.${class} · "${text.slice(0,40)}"` ``,
  `CommentLayer.tsx:85`) — **không phải selector sống**, không re-anchor khi resize/đổi DOM. Đúng
  y hệt bài học #3 đã ghi trong `HANDOFF-gop-y-redesign.md` ("ghim theo %viewport → đổi kích thước
  màn/điện thoại là ghim trôi"). Vào chế độ ghim hiện dùng **⌥Option+click** (`CommentLayer.tsx:92-101`,
  không phải chế độ "chặn mọi click" mà bài học #2 mô tả — có thể handoff doc mô tả bản trước khi
  sửa, hoặc đây đã là bản đỡ xâm lấn hơn; dù sao vẫn còn 2 nút nổi `💬 n` + "Góp ý" theo mô tả handoff).
- Đính ảnh: `image` là **1 data URL duy nhất** nhúng thẳng trong payload lúc gửi (FileReader →
  base64), server giải mã ghi ra `public/comments-images/<id>.<ext>` (`route.ts:38-46`) rồi trả về
  URL — tức payload gửi lên nặng (base64), nhưng lưu trữ cuối cùng nhẹ (URL).

**Kết luận:** đúng như brief đã chỉ ra — đây là công cụ dev-review, không phải input trực tiếp
để build tính năng chat nhóm thật. Giá trị dùng được: **5 bài học UX** trong handoff doc (đã đọc,
áp vào §2 dưới) + mẫu hình kỹ thuật "elementHint mô tả + fallback toạ độ" (dùng làm điểm khởi đầu,
KHÔNG lặp lại lỗi %viewport-thuần).

### 1.2 Presence/live-cursor hiện có — chỉ 1/3 chặng, chỉ con trỏ

`lib/collabStore.ts` (147 dòng, đọc toàn văn) + `app/api/cursors/route.ts` (89 dòng) +
`components/collab/LiveCursors.tsx` (69 dòng) + `components/collab/PresenceBar.tsx` (85 dòng):

- **Cơ chế:** poll `POLL_MS = 900` (`collabStore.ts:53`) — mỗi tick vừa POST cursor cục bộ vừa GET
  cursor người khác (`collabStore.ts:100-136`). Server lưu **in-memory `Map` cấp module**
  (`cursors/route.ts:24`, comment dòng 8-9 tự ghi rõ: *"reset mỗi lần server restart... presence
  chỉ mang tính tức thời nên mất hết khi restart là CHẤP NHẬN ĐƯỢC"*), prune sau `STALE_MS = 6000`.
  Đây là **presence thuần** — chỉ phát toạ độ/tên/màu con trỏ, **KHÔNG mang nội dung tài liệu**
  (không đồng bộ node/element nào).
- **Auth đã đúng chuẩn:** cả GET/POST đều `getSessionUser()` bắt buộc (`cursors/route.ts:40,70`),
  danh tính lấy từ session **không tin client** (comment dòng 37: *"chặn giả danh presence"*) — đây
  là điểm khớp với phát hiện 🟠#3 của `RESEARCH-ACCESS-CONTROL.md` đã được vá.
- **Toạ độ theo flow-space, tự quy đổi màn hình:** `LiveCursors.tsx:17,23-24` —
  `screen = flow*zoom + pan` dùng `useViewport()` của React Flow — cursor bám đúng vị trí khi
  pan/zoom canvas. **Đây là mẫu hình toạ độ đáng tái dùng cho ghim comment ở §2** (khác hẳn %viewport
  lỗi của CommentLayer cũ).
- **🟡 Phạm vi mount — CHỈ 1 nơi:** `grep` toàn repo xác nhận `LiveCursors`/`PresenceBar` chỉ được
  import ở `components/FlowCanvas.tsx:25-26` (dùng ở `:343-344`), và `FlowCanvas` chỉ được dùng ở
  `app/page.tsx:17,358` — tức route `/` (chặng **Rendering**, node-canvas). **`/cad-editor` và
  `/present-editor` không có dòng nào import 2 component này.**
- **Ý nghĩa cho brief:** hạ tầng poll-nhẹ này **kỹ thuật tốt, đáng học theo** (auth đúng, toạ độ
  đúng, degrade an toàn khi mất kết nối), nhưng (a) nó đang nằm **sai chặng** so với khung nghiệp vụ
  mới (Rendering giờ được xếp vào nhóm "bất đồng bộ" cùng CAD, không phải nhóm "real-time" — xem
  câu hỏi Q6 §7), và (b) nó **không mang nội dung** nên không thể "nâng cấp" trực tiếp thành đồng bộ
  tài liệu Presenting — chỉ tái dùng được **kỹ thuật poll + đổi toạ độ**, không tái dùng được
  **luồng dữ liệu**.

### 1.3 Schema DB — chưa có `Comment`, chưa có `ProjectMember`

`prisma/schema.prisma` (132 dòng, đọc toàn văn) — models hiện có: `User, IntegrationAccount,
Project, Flow, FlowVersion, CreditTransaction, ChatMessage, LibraryAsset`. **Không có `Comment`,
không có `ProjectMember`, không có `Deck`.**

- `Project` (`schema.prisma:52-61`) chỉ `{id, userId, name, clientName, createdAt}` — 1 chủ sở hữu
  duy nhất, không có khái niệm thành viên. `RESEARCH-ACCESS-CONTROL.md §2.3` đã đề xuất
  `ProjectMember{projectId,userId,role}` nhưng **CHƯA áp vào schema** (verify: không thấy model này
  trong file thật) — đây là báo cáo *"ĐỀ XUẤT, CHƯA THỰC THI"* giống báo cáo này.
- → **Comment.projectId cần FK tới `Project` đã có sẵn** (dùng được ngay), nhưng **lọc "chỉ thành
  viên dự án thấy"** (yêu cầu brief) phụ thuộc `ProjectMember` **CHƯA tồn tại**. Nếu
  `RESEARCH-ACCESS-CONTROL.md` chưa được duyệt/triển khai, comment M1 chỉ lọc được theo
  `Project.userId` (đúng 1 chủ sở hữu thấy, không phải "nhiều thành viên dự án" như brief mô tả) —
  đây là **phụ thuộc chéo thật**, không phải giả định — xem câu hỏi Q1 (§7).

### 1.4 Hạ tầng — 0 real-time backend

`package.json` (đọc toàn văn `dependencies`) — **không có** `socket.io`, `ws`, `redis`, `yjs`,
`y-websocket`, `liveblocks`, `partykit`, hay bất kỳ package real-time nào. Stack:
`next@14.2.35` (App Router), `@prisma/client`, `@xyflow/react`, `zustand`, `react@18`.

`prisma/schema.prisma:5-9` (comment tại chỗ): *"SQLite cho bản chạy nội bộ/LAN — lên cloud chỉ cần
đổi provider sang postgresql (Supabase)"* — datasource là **file SQLite cục bộ** (`prisma/dev.db`).
Dev server chạy bằng `npm run dev` — **1 process Next.js duy nhất**, không tìm thấy file server
WebSocket/worker riêng nào trong repo (không `server.js` custom, không thư mục `ws/`).

**Ý nghĩa:** mọi phương án CRDT/Yjs ở Phần B đều là **hạ tầng MỚI HOÀN TOÀN**, không phải mở rộng
cái đã có — khác hẳn Phần A (chỉ cần 1 Prisma model + route, dùng đúng stack hiện tại).

### 1.5 Presenting — model phẳng, KHÔNG có server source-of-truth

`lib/present-editor/model.ts` (đọc toàn văn 489 dòng, header comment dòng 4-6: *"Nguyên tắc: model
PHẲNG, serialize được (JSON)"*):

```ts
// lib/present-editor/model.ts:300-306
export interface EditorSlide {
  id: string;
  background: string;
  backgroundImage?: string | null;
  backgroundAdjust?: ImageAdjust;
  elements: SlideElement[];   // ← mảng phẳng, thứ tự = thứ tự vẽ
  templateId?: string;
  transition?: SlideTransition;
  reveal?: ElementReveal;
}
```

`TextElement.text` (`model.ts:194`) là **`string` thuần** — không phải cấu trúc rich-text theo
đoạn/ký tự nào. Muốn đồng bộ ký tự-theo-ký tự thật (2 người gõ cùng lúc, không đè chữ nhau) sẽ cần
đổi field này sang `Y.Text` khi lên Yjs — không "cắm thẳng" được model hiện tại.

**Editing state:** `components/present-editor/useEditor.ts` — comment đầu file dòng 7: *"undo/redo
nằm trong hook này (useReducer)"*, dùng `useReducer` (`useEditor.ts:16,112`) — **state cục bộ 1
trình duyệt, single-writer**, đúng mẫu hình React chuẩn, KHÔNG có khái niệm merge/CRDT nào.

**Persistence — 100% CLIENT-SIDE:** `lib/sheets-persist.ts` (đọc toàn văn) — comment đầu file (dòng
2-7): *"PERSISTENCE MULTI-SHEET vào IndexedDB... khoá theo `userId::route` — mỗi user mỗi bộ, mỗi
chặng (CAD/Present) một bản ghi riêng"*. Key format `${userId}::${route}` (`sheets-persist.ts:40`)
— **1 user, 1 trình duyệt, 1 máy**. `app/api/present/` (kiểm tra toàn thư mục) chỉ có
`text/route.ts` (trợ lý AI viết chữ cho slide, không phải lưu deck). **Không có model `Deck` trong
Prisma, không có API route lưu/tải deck lên server.**

So sánh với chặng Rendering — **CÓ** autosave server: `lib/store.ts:919-933` (comment dòng 919:
*"Autosave (Phase 3-lite): debounce 2s"*) — `persistNow()` gọi `PUT /api/flows/{id}` với
`graphJson` **ghi đè toàn bộ** (`store.ts:923-933`), **không có version/ETag check nào** — đúng
khớp ghi chú memory dự án *"mỗi flow hiện 1 người sửa, chưa detect conflict"*: 2 tab/2 người PUT
gần nhau → ai gọi API sau cùng thắng, không cảnh báo, không merge.

**Kết luận quan trọng nhất cho Phần B:** Presenting **còn thiếu bước cơ bản hơn CRDT** — chưa có
"1 tài liệu sống trên server" để nhiều người cùng trỏ vào. Việc cần làm KHÔNG chỉ là "thêm kênh
đồng bộ real-time" mà còn phải **dựng `Deck` Prisma model + API lưu/tải trước**, một việc mà chặng
Rendering đã có sẵn (`Flow.graphJson`) nhưng Presenting thì chưa từng làm.

### 1.6 `IF1_IF2_BIGPICTURE.md` — verify trạng thái tài liệu

Verify đúng như chủ dự án mô tả: `git status --porcelain` xác nhận file này **KHÔNG track trong
git** (`?? IF1_IF2_BIGPICTURE.md`, untracked). Nội dung dòng 38 file này viết: *"model pipeline
(sequential relay), KHÔNG phải real-time multiplayer (không làm CRDT/Yjs kiểu Figma ở giai đoạn
này)"*. Đây là quyết định của 1 phiên Cowork khác, không track trong git, và theo chỉ đạo trực tiếp
của chủ dự án trong brief này, **quyết định CRDT/Yjs cho Presenting ở tài liệu này GHI ĐÈ** nội
dung đó. Ghi nhận ở đây chỉ để truy vết (traceability), không phải rào cản.

---

## 2. ĐỀ XUẤT KIẾN TRÚC — PHẦN A: COMMENT/GHIM BẤT ĐỒNG BỘ (CAD+RENDERING)

### 2.1 Data model (MẪU — additive, chưa áp)

```prisma
// ══ MỚI ══ Góp ý bất đồng bộ, gắn theo dự án — KHÁC HẲN comments-review.json (dev-review nội bộ,
// giữ nguyên song song, không đụng — xem §2.5).
model Comment {
  id          String   @id @default(cuid())
  projectId   String
  flowId      String?             // gắn 1 Flow cụ thể (Rendering) trong project — null = comment cấp dự án
  docId       String?             // dự phòng multi-sheet CAD (xem docs/MULTI-SHEET-PROPOSAL.md) — sheet id
  x           Float               // toạ độ FLOW-SPACE (không phải %viewport — xem §2.1 "bài học ghim")
  y           Float
  anchorRef   String?             // id entity CAD (HatchEntity.id…) hoặc id node Rendering (FlowNode.id) — anchor SỐNG
  elementHint String?             // mô tả tĩnh cho ngữ cảnh (giống CommentLayer cũ) — KHÔNG dùng để re-anchor
  text        String
  authorId    String
  resolved    Boolean  @default(false)
  images      String   @default("") // JSON string[] — URL nhẹ (path public/…), KHÔNG base64 trong record
  createdAt   DateTime @default(now())

  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  author  User    @relation(fields: [authorId],  references: [id], onDelete: Cascade)

  @@index([projectId, flowId])
  @@index([projectId, resolved])
}
```

So với schema JSON cũ của `CommentLayer` (`route/stage/x%/y%/image 1 data-URL`): đổi `route`(string)
→ `projectId+flowId+docId` (FK thật, lọc DB được thay vì string-match); thêm `anchorRef` (bài học
ghim bám phần tử — không lặp lỗi %viewport); `image` số ít → `images` mảng URL nhẹ (nhất quán
nguyên tắc "lưu-theo-tham-chiếu" đã dùng ở `lib/refingest.ts`, trích trong
`RESEARCH-MATERIAL-BRIDGE.md §3.3`).

### 2.2 Bài học ghim — bám phần tử, tái dùng toán toạ độ đã có

`anchorRef` lưu **id entity/node thật**:
- CAD: mọi entity (`HatchEntity`, `TextEntity`, …) đều `extends Base` có `id: string`
  (`lib/cad/model.ts:66`) — dùng thẳng.
- Rendering: `FlowNode = Node<InteriorNodeData>` (`lib/store.ts:25`, kiểu của `@xyflow/react`) —
  React Flow node luôn có `id` ổn định — dùng thẳng.

Toạ độ `x/y` lưu ở **flow-space** (không phải %viewport) — khi hiển thị lại, quy đổi
`screen = x*zoom + pan` **ĐÚNG CÔNG THỨC** `LiveCursors.tsx:23-24` đã dùng cho con trỏ sống — tái
dùng nguyên hàm quy đổi này (không viết lại), chỉ đổi input từ "cursor người khác" sang "toạ độ
ghim đã lưu DB". Nếu entity/node có `anchorRef` bị xoá khỏi tài liệu → fallback hiển thị pin mờ tại
toạ độ cuối đã biết + badge "phần tử gốc không còn" (tránh mất góp ý hoàn toàn).

### 2.3 UX — không xâm lấn, không bắt buộc mobile-first

Theo đúng đối tượng dùng (KTS trên máy công ty, không phải tunnel-điện-thoại như bản cũ):

- **Vào/thoát rõ ràng:** 1 nút "Góp ý" trong toolbar cố định (không phải nút nổi đè lên canvas như
  `CommentLayer.tsx` — bài học #1), có icon trạng thái bật/tắt rõ (khác nút mờ dễ quên đang bật —
  bài học #2).
- **Không chặn thao tác app khi tắt:** pin overlay `pointer-events: none` trừ đúng vùng pin (giống
  cách `LiveCursors.tsx:20` đã làm `pointer-events-none` cho toàn overlay).
- **Dùng token có sẵn** (`--bg/--panel/--t1..t5`, `app/globals.css`) — không hardcode màu accent
  riêng (bài học #5, tránh lặp lỗi `#e0603a`).
- **Responsive nhưng KHÔNG mobile-first** — layout desktop là chính (panel bên phải/dưới), co gọn
  tốt trên màn hẹp nếu cần xem qua điện thoại (khác use-case dev-review cũ), không thiết kế ngược
  từ mobile lên.

### 2.4 Polling hay WebSocket — chọn mức rẻ nhất

Đúng tinh thần "bất đồng bộ" của brief: **không cần loop liên tục kiểu `collabStore` (900ms)**.
Đề xuất:

- `GET /api/projects/{id}/comments?since=<ts>` gọi khi: (a) mở trang/flow, (b) mở panel "Góp ý",
  (c) poll chậm (~30-60s) **CHỈ khi panel đang mở**, dừng hẳn khi đóng panel/rời tab (khác
  `collabStore` — không có interval nền chạy suốt phiên làm việc).
- Badge "N góp ý mới" tính bằng đếm `createdAt > lastSeenAt` (lưu `lastSeenAt` per user per
  project/flow ở localStorage hoặc 1 field nhẹ) — không cần WebSocket, không cần backend mới ngoài
  1 API route Next.js chuẩn.

### 2.5 Quyền & song song với CommentLayer cũ

- Route mới hoàn toàn tách biệt (`/api/projects/[id]/comments`), **không đụng**
  `app/api/comments/route.ts` (giữ nguyên nó sống cho mục đích dev-review qua
  `NEXT_PUBLIC_COMMENT_LAYER`, đúng như brief xác nhận 2 việc khác mục đích, không cần hợp nhất).
- Lọc theo `projectId`: M1 nếu `ProjectMember` **chưa** có (§1.3) → tạm lọc theo
  `Project.userId === user.id` (chỉ chủ dự án thấy, đúng hiện trạng), migrate sang lọc theo
  `ProjectMember` **miễn phí** (chỉ đổi where-clause) khi `RESEARCH-ACCESS-CONTROL.md` được
  triển khai — không cần đổi schema `Comment` (đã có `projectId` sẵn).
- Auth: mọi route mới `getSessionUser()` đầu hàm — đúng bài học P0 đã tự sửa trong chính
  `/api/comments` hiện tại (§1.1) và bài học đã ghi ở `RESEARCH-MATERIAL-BRIDGE.md §2.3`.

---

## 3. ĐỀ XUẤT KIẾN TRÚC — PHẦN B: REAL-TIME MULTI-USER (PRESENTING)

### 3.1 Đây là hạ tầng lớn — không phải 1 API route

Nhắc lại phát hiện §1.5: Presenting hiện **KHÔNG có tài liệu nào sống trên server** — deck chỉ tồn
tại trong IndexedDB của 1 trình duyệt. Trước khi bàn "đồng bộ real-time giữa nhiều người", phải trả
lời trước: **"tài liệu đó đang ở đâu để nhiều người cùng trỏ vào?"** — câu hỏi này chưa có hạ tầng
trả lời, bất kể chọn CRDT hay không.

### 3.2 Tuỳ chọn hạ tầng kênh đồng bộ

| | **(a) Tự host `y-websocket`** | **(b) Dịch vụ hosted** (Liveblocks/PartyKit/…) | **(c) Polling giả-real-time** |
|---|---|---|---|
| Cách làm | 1 Node process riêng chạy `y-websocket` (hoặc server ws tự viết), luôn bật | Gọi API/SDK của dịch vụ ngoài — Liveblocks có Yjs storage adapter chính thức, PartyKit chạy trên Cloudflare Durable Objects cũng có Yjs provider | Tái dùng đúng mẫu hình `collabStore.ts` (poll 900ms) nhưng poll **nội dung deck** thay vì chỉ toạ độ cursor |
| Hạ tầng cần thêm | 1 process luôn-on, tách khỏi `npm run dev` — **mâu thuẫn** với mô hình hiện tại "app chạy trên máy KTS" (không phải server luôn bật); cần VPS/máy luôn bật hoặc dịch vụ hỗ trợ WS dài hơi (Vercel serverless — mục tiêu Sprint 4, `STATUS.md` — KHÔNG giữ được WebSocket sống lâu kiểu `y-websocket` cần trên tier phổ thông) | Không cần tự vận hành hạ tầng — nhưng **thêm phụ thuộc bên thứ 3** (ngoài phạm vi stack hiện tại, §1.4 xác nhận 0 package loại này) | 0 hạ tầng mới ngoài 1 API route + (bắt buộc) `Deck` model/server storage đã thiếu ở §1.5 |
| Chi phí | Nhân công vận hành + máy chủ | **Có phí theo MAU/connection** (giá cụ thể cần tra tại thời điểm quyết định — biến động) | Rẻ nhất — dùng lại hạ tầng Next.js/Prisma hiện có |
| Đúng nghĩa CRDT/merge tự động | ✅ | ✅ | ❌ — vẫn là ghi đè bản mới nhất (như `store.ts:923-933` đang làm cho Rendering), chỉ nhanh hơn autosave 2s hiện tại, KHÔNG merge 2 chỉnh sửa đồng thời trên cùng field |
| Độ trễ thực tế | Thấp (WS thật) | Thấp (WS thật, hạ tầng dịch vụ tối ưu sẵn) | Trung bình (900ms-2s theo chu kỳ poll) — đủ cho "gần real-time", không đủ cho gõ chữ đồng thời mượt |
| Rủi ro | Vận hành/uptime do team tự chịu | Phụ thuộc uptime/pricing bên ngoài, dữ liệu dự án đi qua bên thứ 3 (cân nhắc bảo mật hồ sơ khách hàng) | Vẫn có "va chạm" nếu 2 người sửa cùng giây — cần banner cảnh báo tối thiểu (không phải merge thật) |

**Khuyến nghị:** làm **(c) trước làm M1** — vừa lấp lỗ hổng thật sự cấp thiết hơn CRDT (Deck chưa
có server-side tồn tại), vừa cho chủ dự án thấy luồng multi-user hoạt động ở mức "gần đủ dùng" với
chi phí thấp nhất, trước khi cam kết (a)/(b) — đúng tinh thần đo nhu cầu trước khi xây hạ tầng nặng
(`RESEARCH-MATERIAL-BRIDGE.md §4.2`). Nếu sau khi dùng thật thấy va chạm 2-người-sửa-cùng-lúc xảy
ra thường xuyên (nhiều slide, nhiều buổi present cùng lúc), mới nâng lên (a)/(b) ở M-sau.

### 3.3 Tương thích model dữ liệu

`EditorSlide.elements: SlideElement[]` (`model.ts:306`) là **mảng phẳng JSON thuần** — ánh xạ sang
Yjs cần: `Y.Doc` cấp deck → `Y.Array<Y.Map>` cho `slides` → `Y.Array<Y.Map>` lồng cho `elements`
mỗi slide → riêng `TextElement.text` (`model.ts:194`, hiện là `string` thuần) cần đổi thành
**`Y.Text`** nếu muốn đồng bộ ký tự-theo-ký tự thật (2 người gõ cùng ô chữ không đè nhau) — nếu giữ
`string` thường thì dù chạy trên Yjs, field đó vẫn là "ai ghi sau thắng" ở cấp field, không phải
merge ký tự thật.

**Undo/redo hiện tại là `useReducer` cục bộ** (`useEditor.ts:7,16,112`) — 1 hệ thống đang hoạt động
tốt, single-writer. Yjs có `Y.UndoManager` riêng (multi-writer aware) — chuyển sang Yjs **không
phải chỉ thêm sync**, mà là **thay thế cả cơ chế undo/redo hiện có**, cần thiết kế lại luồng
`dispatch()` hiện tại (`useEditor.ts`) thành thao tác trên `Y.Doc` quan sát được (thường qua
`y-react`/hook tuỳ biến) — đây là phần việc lớn nhất về công sức viết lại code, không phải phần
"kết nối mạng".

### 3.4 Xung đột với autosave hiện có

Rendering đã có tiền lệ **"KHÔNG detect conflict"**: `persistNow()` (`store.ts:923-933`) PUT toàn bộ
`graphJson` ghi đè, không version check — đúng khớp ghi chú *"mỗi flow hiện 1 người sửa, chưa
detect conflict"*. Presenting hiện **còn tệ hơn** — không có bước PUT-lên-server nào cả (§1.5). Nếu
làm (c) polling giả-real-time, khoảng cách tối thiểu cần lấp: **(i)** thêm `Deck` Prisma model +
API lưu/tải (chưa có), **(ii)** thêm 1 field version/`updatedAt` để phát hiện "người khác vừa sửa
sau lần bạn tải" → banner cảnh báo (chưa có ở cả Rendering lẫn Presenting hôm nay), **(iii)** tái
dùng cặp poll + toạ độ `LiveCursors` nếu muốn hiện con trỏ sống trong lúc soạn (UX cộng thêm đã có
sẵn kỹ thuật, chỉ cần mount ở `/present-editor` — hiện chưa mount, xem §1.2).

---

## 4. RỦI RO & GIỚI HẠN

| Rủi ro | Phần | Chi tiết | Giảm thiểu |
|---|---|---|---|
| `ProjectMember` chưa tồn tại | A | `Comment.projectId` lọc đúng nhưng "thành viên dự án" chưa có bảng — M1 chỉ lọc theo `Project.userId` (owner-only) | Thiết kế `Comment` để migrate sang lọc `ProjectMember` **miễn phí** khi báo cáo kia được duyệt (không đổi schema Comment) |
| `anchorRef` trỏ tới entity/node đã bị xoá | A | Người dùng xoá tường/node sau khi đã có góp ý gắn vào đó | Fallback hiển thị tại toạ độ cuối + badge "phần tử gốc không còn" (§2.2) — không mất góp ý |
| 2 danh sách comment song song (`comments-review.json` cũ + `Comment` DB mới) gây nhầm cho dev | A | Dev quen dùng file JSON cũ có thể quên còn 1 hệ mới trong DB | Đặt tên UI rõ ràng khác nhau ("Ghi chú review nội bộ" cho tool cũ vs "Góp ý dự án" cho tính năng mới), không hợp nhất UI 2 hệ |
| CRDT hosted đưa dữ liệu dự án (khách hàng, hồ sơ) qua bên thứ 3 | B | Liveblocks/PartyKit lưu nội dung deck (có thể chứa ảnh/brief khách hàng nhạy cảm) trên hạ tầng ngoài | Cần xác nhận chính sách bảo mật dữ liệu khách hàng trước khi chọn (b) — câu hỏi Q4 (§7) |
| Tự host `y-websocket` cần process luôn-on | B | Mâu thuẫn mô hình hiện tại (app chạy trên máy KTS, không phải server luôn bật) | Chờ hạ tầng cloud Sprint 4 (Vercel+Supabase, `STATUS.md`) — nhưng cần xác nhận nền tảng đó hỗ trợ WS dài hơi hay phải tách riêng dịch vụ (Fly.io/Render/VPS nhỏ) |
| Polling (c) tạo cảm giác "gần real-time" nhưng vẫn ghi-đè khi va chạm thật | B | 2 người sửa CÙNG field trong cùng chu kỳ poll → 1 người mất thay đổi âm thầm (như Rendering hôm nay) | Bắt buộc kèm banner cảnh báo version-mismatch tối thiểu (§3.4-ii) ngay từ M1, không được im lặng ghi đè |
| Rewrite `useEditor.ts` reducer → Yjs-aware là việc lớn, đụng toàn bộ luồng chỉnh sửa Presenting đang chạy ổn định | B | Rủi ro regression cao cho tính năng đang dùng thật (đã ship nhiều đợt — Sketch-Pro, typography, PS-1..PS-4) | Chỉ làm khi đã xác nhận nhu cầu thật qua M1 polling; cân nhắc chạy song song 2 nhánh (feature flag) một thời gian trước khi thay hẳn |
| Live-cursor hiện tại "sai chặng" so với khung nghiệp vụ mới | Cả 2 | `LiveCursors`/`PresenceBar` đang ở Rendering (giờ xếp nhóm bất đồng bộ) — giữ nguyên hay gỡ đi là quyết định UX, không chỉ kỹ thuật | Câu hỏi Q6 (§7) — không tự quyết |

---

## 5. PHÂN KỲ ĐỀ XUẤT

| Mốc | Nội dung | Phụ thuộc | Rủi ro |
|---|---|---|---|
| **A-M1** | `Comment` Prisma model + API `/api/projects/[id]/comments` (lọc tạm theo `Project.userId`) + UI toolbar-entry (không nút nổi) + ghim theo `anchorRef`+flow-space coord (tái dùng toán `LiveCursors`) — áp cho cả CAD và Rendering | Không (độc lập hoàn toàn với B) | Thấp — additive, route mới, không đụng `comments-review.json` cũ |
| **A-M2** | Badge "N góp ý mới" (poll chậm khi mở panel) + resolve/reply + migrate lọc quyền sang `ProjectMember` khi `RESEARCH-ACCESS-CONTROL.md` triển khai | A-M1 + (tuỳ chọn) `RESEARCH-ACCESS-CONTROL.md` M1 | Thấp |
| **B-M1** | `Deck` Prisma model + API lưu/tải deck lên server (lấp lỗ hổng §1.5 — CẦN LÀM DÙ CHỌN PHƯƠNG ÁN NÀO Ở §3.2) + polling giả-real-time (c) + banner version-mismatch tối thiểu | Không (nhưng nên làm SAU khi đã thấy nhu cầu qua A, vì rẻ hơn nhiều so với CRDT thật) | Trung bình — đổi persistence Presenting từ client-only sang có server, cần test kỹ autosave/khôi phục cũ (IndexedDB) không vỡ |
| **B-M2** | Nếu B-M1 cho thấy va chạm thật xảy ra thường xuyên → chọn (a) hoặc (b) ở §3.2 (cần Q3-Q5 §7 trả lời trước), dựng kênh WS/hosted thật, còn model dữ liệu vẫn `EditorSlide` phẳng (chưa đổi sang Yjs types) | B-M1 + quyết định hạ tầng | Cao — hạ tầng mới, chi phí vận hành/phí dịch vụ |
| **B-M3** | Chuyển `TextElement.text` và cấu trúc `elements` sang kiểu Yjs-native (`Y.Text`/`Y.Array`/`Y.Map`) + thay `useReducer` bằng `Y.UndoManager` — merge ký tự thật, không chỉ "field ghi đè nhanh hơn" | B-M2 | Cao — rewrite lớn `useEditor.ts`, rủi ro regression tính năng Presenting đang chạy ổn định |

**Không ước lượng ngày công cụ thể** (khác `RESEARCH-ACCESS-CONTROL.md`) vì phạm vi B-M2/B-M3 phụ
thuộc trực tiếp câu trả lời §7 (chọn hạ tầng nào, có chấp nhận phụ thuộc bên thứ 3 không) — đề xuất
ước lượng công cụ thể sau khi chủ dự án chọn hướng.

---

## 6. ĐỐI CHIẾU VỚI YÊU CẦU GỐC

| Yêu cầu chủ dự án | Trả lời ở |
|---|---|
| "CAD+Rendering = cộng tác bất đồng bộ, để lại comment/ghim kiểu Miro" | §2 (toàn bộ) |
| "Presenting = sửa real-time nhiều người cùng lúc, đã chốt CRDT/Yjs" | §3 (toàn bộ) — nêu rõ CRDT là đích cuối, nhưng hạ tầng phải qua §3.2(c) trước |
| "Ghi đè `IF1_IF2_BIGPICTURE.md` (không CRDT giai đoạn này) — tài liệu đó không track git, phụ" | §1.6 — verify đúng, không track git, quyết định của brief này ghi đè |
| "Xem lại `HANDOFF-gop-y-redesign.md` — 5 bài học UX" | §1.1 (verify từng lỗi trong code thật) + §2.2/§2.3 (áp vào thiết kế mới) |
| "Xác nhận cursor/presence hiện có là gì, tái dùng được không" | §1.2 — chỉ tái dùng TOÁN TOẠ ĐỘ + mẫu poll, không tái dùng LUỒNG DỮ LIỆU (presence không mang nội dung); và nó đang ở SAI CHẶNG so với khung mới (câu hỏi Q6) |
| "Kiểm tra schema DB — có `Comment` chưa" | §1.3 — chưa có, đề xuất mới ở §2.1, phụ thuộc chéo `ProjectMember` |
| "Đọc lướt `RESEARCH-ACCESS-CONTROL.md`, quyền xem/sửa theo dự án" | §1.3 + câu hỏi Q1 (§7) — 2 báo cáo có phụ thuộc thứ tự |
| "Hạ tầng hiện tại — SQLite local, không Redis/Socket.io — đánh giá khả thi CRDT" | §1.4 + §3.2 — khả thi nhưng là hạ tầng mới hoàn toàn, không phải mở rộng |
| "Model `EditorSlide.elements`/`model.ts` có tương thích Yjs không" | §3.3 — không tương thích trực tiếp, cần lớp chuyển đổi hoặc viết lại field rich-text |
| "Conflict với autosave hiện có — 1 người sửa/flow, chưa detect conflict" | §1.5 (verify `store.ts:923-933`) + §3.4 |

---

## 7. CÂU HỎI CẦN CHỦ DỰ ÁN QUYẾT

| # | Câu hỏi | Khuyến nghị |
|---|---|---|
| **Q1** | `RESEARCH-ACCESS-CONTROL.md` (`ProjectMember`) có được ưu tiên làm TRƯỚC Phần A của báo cáo này không? Comment M1 có chấp nhận tạm lọc theo `Project.userId` (owner-only, không phải "nhiều thành viên") trong lúc chờ không? | Khuyến nghị: làm A-M1 song song, không chờ — migrate quyền sau (đã thiết kế để migrate rẻ, §2.5). Nếu chủ dự án muốn "thành viên dự án" đúng nghĩa ngay từ đầu thì cần làm `ProjectMember` trước. |
| **Q2** | Ưu tiên thật giữa Phần A (rẻ, làm ngay được) và Phần B (đắt, cần quyết hạ tầng trước)? | Khuyến nghị làm A trước — độc lập, giá trị dùng được ngay cho CAD/Rendering; B cần quyết Q3-Q5 trước khi bắt đầu bất kỳ dòng code nào. |
| **Q3** | Phần B — chấp nhận **phụ thuộc bên thứ 3 có phí** (Liveblocks/PartyKit) để có real-time thật nhanh hơn, hay ưu tiên **tự chủ hạ tầng** (tự host, cần máy luôn-on) dù chậm triển khai hơn? | Chưa đủ dữ liệu để khuyến nghị — phụ thuộc ngân sách + chính sách dữ liệu khách hàng (Q4) chưa biết. |
| **Q4** | Dữ liệu dự án (deck Presenting có thể chứa brief/ảnh khách hàng nhạy cảm) có được phép đi qua hạ tầng bên thứ 3 (nếu chọn hosted) không? | Nếu KHÔNG được phép → loại phương án (b) ngay, chỉ còn (a) tự host hoặc (c) polling. |
| **Q5** | Sprint 4 (PWA Vercel+Supabase, đã khoá trong `STATUS.md`) có tính luôn hạ tầng WebSocket dài hơi cho Yjs không, hay đó là 1 dịch vụ tách riêng cần bổ sung? | Cần xác nhận trước khi chốt (a) — Vercel serverless function không giữ WS sống lâu kiểu `y-websocket` cần trên tier phổ thông. |
| **Q6** | Live-cursor/presence hiện tại (`LiveCursors`/`PresenceBar`) đang mount ở Rendering — chặng giờ được xếp vào nhóm "bất đồng bộ" theo khung nghiệp vụ mới của báo cáo này. Giữ nguyên nó ở Rendering như 1 UX-bonus (biết ai đang mở cùng flow, dù không cần real-time nội dung), hay gỡ đi vì không còn khớp định hướng "bất đồng bộ"? | Khuyến nghị **giữ** — presence (biết ai đang xem) khác với real-time content-sync (brief phản đối), không xung đột với "CAD+Rendering = bất đồng bộ" (bất đồng bộ nói về NỘI DUNG, không phải biết-ai-đang-online). Nhưng là quyết định UX, cần xác nhận. |
| **Q7** | Phần B-M1 (polling giả-real-time, §3.2c) có đủ "real-time" theo kỳ vọng thật của chủ dự án/đội Presenting, hay ngay từ đầu đã cần độ trễ thấp hơn poll 900ms-2s cho phép (VD nhiều KTS cùng dựng slide trong 1 buổi present gấp)? | Cần xác nhận — nếu use-case thật là "2-3 người cùng ngồi dựng deck trước giờ present" (độ trễ thấp quan trọng), nên bỏ qua B-M1 polling, đi thẳng B-M2 hạ tầng WS thật. |

---

*Hết. Không có thay đổi code nào kèm theo tài liệu này.*
