# AUDIT HẠ TẦNG BACKEND — InteriorFlow
**Ngày:** 03/08/2026 · **Vai:** COWORK-BACKEND · **Phạm vi:** `app/api/` (55 route) · `prisma/schema.prisma` (17 model) · `lib/server/*` · `lib/notebook/*` · `lib/ai/*` · `lib/integrations/*`
**Phương pháp:** đọc code trực tiếp, mọi khẳng định kèm `file:dòng`. Không chạy app, không chạy git, không sửa code.
**Chỗ chưa kiểm được ghi rõ `CHƯA VERIFY`.**

---

## §0 · TÓM TẮT ĐIỀU HÀNH

| # | Lỗ | Mức | Ở đâu |
|---|---|---|---|
| 1 | **Tự nạp credit vô hạn** — `POST /api/credits {action:'refund', amount:999999}` cộng thẳng vào số dư, không đối chiếu job nào | 🔴 | `app/api/credits/route.ts:30-34` |
| 2 | **Đốt tiền provider không mất credit** — `/api/jobs` submit fal/ComfyUI mà KHÔNG kiểm/trừ credit; kế toán nằm ở client | 🔴 | `app/api/jobs/route.ts:7-55` vs `lib/execution.ts:108-137` |
| 3 | **XSS lưu trữ qua upload thư viện** — không whitelist MIME khi upload, khi tải về trả đúng `Content-Type` client tự khai | 🔴 | `app/api/library/route.ts:63-73` + `app/api/library/[id]/file/route.ts:16` |
| 4 | **SSRF** — `/api/library/clip` fetch URL người dùng đưa, không chặn host nội bộ, không timeout | 🔴 | `app/api/library/clip/route.ts:30` |
| 5 | Render trả phí chạy đồng bộ 120s trong khi hạ tầng cắt ở 60s → **trừ tiền rồi mất kết quả, không hoàn** | 🔴 | `app/api/render/premium/route.ts:53-60` + `vercel.json` `maxDuration: 60` |

**Route chết (không nơi nào gọi): 4** — `atlas-materials/sync`, `auth/apple`, `boq/[projectId]`, `auth/google/callback`+`microsoft/callback` (chỉ provider gọi, không tính là chết).
**Trục ② — có IDOR không?** **KHÔNG có IDOR đọc chéo dự án** ở nhóm route đi qua `assertProjectAccess` (`boq`, `projects/[id]/*`). Nhưng có **4 khuyết phân quyền khác** (chi tiết §2): (a) không có middleware chung, 51/55 route tự kiểm; (b) `library`/`specs`/`lark-*`/`dashboard` = "đăng nhập là toàn quyền", bất kỳ ai xoá/sửa được dữ liệu giá của cả team; (c) notebook kiểm `Project.userId` chứ **không** kiểm `ProjectMember` → thành viên dự án bị chặn oan và bị âm thầm chuyển sang bucket riêng; (d) `PUT /api/flows/[id]` nhận `projectId` bất kỳ, không kiểm quyền trên project đích.

---

## §1 · TRỤC ① — ROUTE CHẾT / GIẢ / TRÙNG

### 1.1 · Bảng toàn bộ 55 route

Cột "Ai gọi" = grep `fetch(`/`window.location.assign` trong `app/` (trừ `app/api`), `components/`, `lib/`, `extension/`.
Cột "Thật/Giả": **Thật** = đọc-ghi DB/provider thật · **Nửa** = có nhánh trả mock/placeholder · **Khung** = chưa chạy thật lần nào.

| # | Route | Method | Ai gọi (`file:dòng`) | Thật/Giả | Đề nghị |
|---|---|---|---|---|---|
| 1 | `/api/ai-assist-chat` | POST | `components/studio/VitalsGesture.tsx:129` · `components/ProjectSelect.tsx:425` | Thật | Giữ |
| 2 | `/api/atlas-materials/sync` | POST | **KHÔNG AI GỌI** | Khung (route tự ghi "CHƯA CHẠY THẬT LẦN NÀO" — `route.ts:16`) | Giữ nhưng gắn nút, hoặc chuyển thành script |
| 3 | `/api/auth/apple` | GET | **KHÔNG AI GỌI** | Giả (luôn 503, `route.ts:15-19`) | **Xoá** hoặc để lại có ghi TODO rõ |
| 4 | `/api/auth/google` | GET | `components/entry/LoginForm.tsx:141` | Thật | Giữ |
| 5 | `/api/auth/google/callback` | GET | Google redirect (không phải client) | Thật | Giữ |
| 6 | `/api/auth/login` | POST | `components/entry/LoginForm.tsx` | Thật | Giữ |
| 7 | `/api/auth/me` | GET·DELETE | `components/studio/SessionWatch.tsx`, `AccountMenu.tsx`, `MobileMenu.tsx`, `home/HomeScreen.tsx`… | Thật | Giữ |
| 8 | `/api/auth/microsoft` | GET | `components/entry/LoginForm.tsx:152` | Thật | Giữ |
| 9 | `/api/auth/microsoft/callback` | GET | MS redirect | Thật | Giữ |
| 10 | `/api/auth/providers` | GET | `components/entry/LoginForm.tsx` | Thật | Giữ |
| 11 | `/api/auth/register` | POST | `components/entry/LoginForm.tsx` | Thật | Giữ |
| 12 | `/api/boq/[projectId]` | POST | **KHÔNG AI GỌI** (chỉ được nhắc trong comment `lib/boq/from-project.ts:18`) | Thật (logic đúng) | Giữ — nối UI (hàng đợi PHU mục 7) |
| 13 | `/api/chat` | GET·POST | `components/ChatPanel.tsx:33,60` | Thật | Giữ |
| 14 | `/api/comments` | GET·POST·PATCH·DELETE | `components/CommentLayer.tsx:57,123,137,147` — nhưng layer **tắt mặc định** (`CommentLayer.tsx:158`, cần `NEXT_PUBLIC_COMMENT_LAYER=1`) | Thật (ghi file JSON, không DB) | Giữ (công cụ nội bộ) — vá quyền xoá |
| 15 | `/api/credits` | GET·POST | `lib/execution.ts:111,161` · `lib/present-editor/print-upscale.ts:88,109` | Thật | 🔴 **Sửa gấp** (§5) |
| 16 | `/api/cursors` | GET·POST | `lib/collabStore.ts:106,121` | Thật (RAM, không DB) | Giữ — biết giới hạn (§4.5) |
| 17 | `/api/dashboard` | GET | `components/Dashboard.tsx:156` · `components/collab/PresenceBar.tsx:114` | Thật | Giữ — thu hẹp field (§2.4) |
| 18 | `/api/flows` | GET·POST | `lib/workspace.ts:22,46,58` · `components/ProjectSelect.tsx:179` | Thật | Giữ |
| 19 | `/api/flows/[id]` | GET·PUT·DELETE | `lib/workspace.ts:28` · `components/ProjectSelect.tsx:626,699` | Thật | Giữ — vá `projectId` (§2.5) |
| 20 | `/api/gu/[kind]` | GET·PUT | `lib/gu/gu-model-sync.ts:36,49` | Thật | Giữ |
| 21 | `/api/health` | GET | `lib/ai/client.ts:108` | Thật | Giữ |
| 22 | `/api/illustration` | POST | `app/library/ingest/page.tsx:152` | Thật | Giữ — thêm timeout (§4.4) |
| 23 | `/api/integrations/[provider]/callback` | GET | provider redirect (`lib/integrations/oauth-core.ts:16`) | Thật | Giữ |
| 24 | `/api/integrations/[provider]/connect` | GET | **Không thấy caller trực tiếp** (chỉ `status` được gọi ở `components/ProjectSelect.tsx:309`) | Thật | Giữ (mở bằng link tay) — CHƯA VERIFY có nút UI nào không |
| 25 | `/api/integrations/[provider]/disconnect` | POST | **Không thấy caller** | Thật | Giữ |
| 26 | `/api/integrations/[provider]/status` | GET | `components/ProjectSelect.tsx:309` | Thật | Giữ |
| 27 | `/api/jobs` | POST | `lib/ai/client.ts:46` | Thật | 🔴 **Sửa gấp** (§5) |
| 28 | `/api/jobs/[id]` | GET | `lib/ai/client.ts:71` | Thật | Giữ |
| 29 | `/api/lark-tasks` | GET | `components/dashboard/LarkPanels.tsx` | Thật (đọc mirror) | Giữ |
| 30 | `/api/lark-tasks/sync` | POST | `components/ProjectSelect.tsx:319` | Thật | Giữ — gate admin (§2.4) |
| 31 | `/api/lark-user-map` | POST·DELETE | `components/dashboard/LarkPanels.tsx:229` | Thật | Giữ — gate admin |
| 32 | `/api/library` | GET·POST | `components/LibraryPanel.tsx:66,199` · `ReferencePane.tsx:31` · `form/shared.tsx:122` · `ProjectSelect.tsx:605,660` | Thật | 🔴 whitelist MIME (§6.2) |
| 33 | `/api/library/[id]` | DELETE | `components/LibraryPanel.tsx:305` · `present-editor/PresentEditor.tsx:1124` | Thật | Giữ |
| 34 | `/api/library/[id]/file` | GET | nhiều nơi (URL nhúng `<img>`) | Thật | 🔴 ép `Content-Type` an toàn (§6.2) |
| 35 | `/api/library/clip` | POST | `extension/background.js:18` | Thật | 🔴 vá SSRF (§6.3) |
| 36 | `/api/notebook/[projectId]/query` | POST | `components/notebook/useNotebook.ts:222` | Thật | Giữ |
| 37 | `/api/notebook/[projectId]/source` | POST | `components/notebook/useNotebook.ts:118,148` | Thật | Giữ — xử lý nền (§4.2) |
| 38 | `/api/notebook/[projectId]/source/[sourceId]` | DELETE | `components/notebook/useNotebook.ts:191` | Thật | Giữ |
| 39 | `/api/notebook/[projectId]/source/[sourceId]/file` | GET | `components/notebook/NotebookSourceViewer.tsx` | Thật | Ép `Content-Type` (§6.2) |
| 40 | `/api/notebook/[projectId]/sources` | GET | `components/notebook/useNotebook.ts:67` | Thật | Giữ |
| 41 | `/api/pdf/extract` | POST | `lib/refingest.ts:128` | Thật | Giữ — thêm giới hạn dung lượng (§6.4) |
| 42 | `/api/present/text` | POST | `components/present-editor/TextToolbar.tsx:151` | Thật | Giữ |
| 43 | `/api/projects/[id]/members` | GET·POST·PATCH·DELETE | `components/dashboard/ProjectMembersPanel.tsx:55,77` · `components/collab/PresenceBar.tsx:71,123` | Thật | Giữ — **route mẫu mực nhất repo** |
| 44 | `/api/projects/[id]/overview` | GET | `app/projects/[id]/overview/page.tsx:71` | Thật | Giữ |
| 45 | `/api/render/fbx` | POST | `components/nodes/NodeExtras.tsx:383` | Thật (cần Blender local) | Giữ |
| 46 | `/api/render/nvidia-image` | POST | `lib/nodes/defs/render-v2.ts:153` | Thật | Giữ — chưa tính credit (§5.3) |
| 47 | `/api/render/premium` | POST | `lib/nodes/defs/compare-models.ts:11` | Nửa (placeholder SVG khi fal lỗi — `route.ts:12-24`) | 🔴 bỏ vòng lặp đồng bộ (§4.1) |
| 48 | `/api/share/[token]` | GET | `app/share/[token]/page.tsx:19` | Thật | Giữ |
| 49 | `/api/specs` | GET·POST | `components/cad/SchedulePanel.tsx:53` · `NodeLibraryPanel.tsx` | Thật | Giữ — gate ghi (§2.4) |
| 50 | `/api/specs/[id]` | GET·PATCH·DELETE | `components/cad/SchedulePanel.tsx` | Thật | Giữ — gate ghi |
| 51 | `/api/stock-photos` | GET·POST | `components/common/StockPhotoPicker.tsx:63,83,105,129` | Thật | Giữ — **chuẩn tham chiếu** về timeout/SSRF |
| 52 | `/api/stock-photos/proxy` | GET | `components/entry/LoginBackdrop.tsx:186` | Thật | Giữ |
| 53 | `/api/strategy/scenarios` | POST | `app/library/ingest/page.tsx:132` | Thật | Giữ |
| 54 | `/api/user/avatar` | GET·PATCH | `app/settings/avatar/page.tsx:24,33` | Thật | Giữ |
| 55 | `/api/vision/caption` | POST | `app/library/ingest/page.tsx:104` | Thật | Giữ |

### 1.2 · Route CHẾT (không caller nào trong repo)

| Route | Bằng chứng | Đề nghị |
|---|---|---|
| `/api/atlas-materials/sync` | grep `api/atlas-materials` trong `app|components|lib|extension` = 0 hit | Nối nút "Đồng bộ ATLAS" cạnh nút Lark (`components/ProjectSelect.tsx:319` là mẫu), hoặc hạ thành `scripts/sync-atlas.ts`. Route tự khai chưa từng chạy thật (`route.ts:16-20`) |
| `/api/auth/apple` | grep `api/auth/apple` = 0 hit; `LoginForm.tsx` chỉ gọi google/microsoft (`:141,:152`) | **Xoá** — stub luôn 503, `appleConfigured()` không bao giờ đủ env |
| `/api/boq/[projectId]` | grep `api/boq/` = 1 hit duy nhất và là **comment** (`lib/boq/from-project.ts:18`) | Giữ — đây là việc đang chờ nối UI (§3 sổ tổng, PHU mục 7). Không xoá |
| `/api/integrations/[provider]/connect` + `/disconnect` | không thấy `fetch`/`assign` nào trỏ tới | CHƯA VERIFY hết (có thể mở bằng `<a href>` dựng động). Cần soát `components/settings/*` bằng mắt |

### 1.3 · Route trả DỮ LIỆU GIẢ

| Route | Nhánh giả | `file:dòng` | Nhận xét |
|---|---|---|---|
| `/api/render/premium` | trả SVG placeholder khi `!falConfigured()` hoặc job FAILED/timeout | `route.ts:12-24,36-37,45-48` | **Có nhãn rõ** ("mock — nạp fal balance") và có hoàn credit → chấp nhận được, không phải mock lén |
| `/api/atlas-materials/sync` | `ATLAS_FIELD_NAMES` là PLACEHOLDER, chưa đối chiếu cột thật | `route.ts:17-20` + `lib/lark/atlas-material-map.ts` | Nếu chạy được sẽ ghi **giá sai** vào `ProductSpec.priceVnd` → sai tiền BOQ. Phải verify tên cột trước khi bật |
| `/api/auth/apple` | luôn 503 | `route.ts:15-19` | Stub |

### 1.4 · Route TRÙNG chức năng

| Cặp | Trùng ở đâu | Đề nghị |
|---|---|---|
| `/api/stock-photos` (action `search`) ↔ `/api/illustration` (tầng ②/②b) | cả hai tự gọi Openverse + Unsplash bằng URL dựng tay: `stock-photos/route.ts:125-141` vs `illustration/route.ts:57,85-87` | **Gộp**: `illustration` nên gọi lại hàm chung trong `lib/stock-photos.ts` thay vì dựng URL riêng — hiện `illustration` thiếu timeout mà `stock-photos` có (`route.ts:34-46`) |
| `/api/dashboard` ↔ `/api/flows` (GET) | cả hai trả roster team + danh sách project: `dashboard/route.ts:71-80` vs `flows/route.ts:42-53` | Giữ cả hai (khác scope) nhưng thống nhất ngưỡng online: `flows/route.ts:11` = 45s, `dashboard/route.ts:15` = 120s — **hai màn hiện trạng thái online khác nhau cho cùng một người** |
| `/api/chat` ↔ `/api/ai-assist-chat` | tên gần giống, chức năng khác hẳn (người↔người vs người↔AI) | Giữ — đã có comment phân biệt (`ai-assist-chat/route.ts:14-15`). Chỉ là bẫy tên |
| `/api/comments` ↔ `components/nodes/CommentPin.tsx` | hai hệ góp ý song song | Ghi rõ vào sổ, không gộp vội |

---

## §2 · TRỤC ② — XÁC THỰC & PHÂN QUYỀN

### 2.1 · Không có middleware chung

`middleware.ts` **KHÔNG TỒN TẠI** (ls gốc repo = không có). Mỗi route tự gọi `getSessionUser()` dòng đầu.
Repo đã tự biết rủi ro này: `app/api/lark-tasks/sync/route.ts:15-16` ghi *"getSessionUser() bắt buộc DÒNG ĐẦU TIÊN — bài học P0… /api/comments từng thiếu auth"*.

**Kết quả kiểm 55 route:** 51 route CÓ kiểm phiên. 4 route KHÔNG kiểm, và cả 4 đều **đúng thiết kế**:

| Route không kiểm phiên | Lý do | Có ổn không |
|---|---|---|
| `/api/auth/login`, `/api/auth/register` | cửa đăng nhập/đăng ký | ✅ (nhưng xem §2.6 — không có rate limit) |
| `/api/auth/google|microsoft|apple` + callback | luồng OAuth | ✅ (state CSRF: `auth/google/route.ts:28-33`, verify `callback/route.ts:44-46`) |
| `/api/auth/providers` | chỉ trả 3 boolean, không lộ key (`route.ts:12-16`) | ✅ |
| `/api/share/[token]` | link chia sẻ công khai có chủ ý | ✅ — token 12 byte ngẫu nhiên (`flows/[id]/route.ts:66`), lọc `deletedAt: null`, chỉ trả `name/graphJson/version/owner.name` (`share/[token]/route.ts:9`) |
| `/api/health` | trả 3 boolean cấu hình provider | 🟡 lộ "server này có FAL/ComfyUI/SD hay không" cho người chưa đăng nhập — thấp, nhưng nên gate |

### 2.2 · Cửa quyền dự án — thiết kế ĐÚNG

`lib/server/access.ts:32-54` `assertProjectAccess()` là cửa duy nhất, làm đúng cả 4 việc khó:
- lọc `deletedAt: null` cho member (`:41`) và cho project (`:46,48`);
- admin = owner (`:49`);
- **404 chứ không 403** khi không phải member (`:48,50`) → không lộ "dự án này có tồn tại";
- thứ bậc vai bằng `ROLE_RANK` (`:52`, bảng ở `access-policy.ts:15-21`).

Có test bảng chân trị đầy đủ 5 vai × 3 chặng: `lib/server/access.test.ts:49-62`.

### 2.3 · Kiểm từng route nhạy cảm theo yêu cầu

| Route | Kiểm phiên | Kiểm `ProjectMember` | Kết luận |
|---|---|---|---|
| `boq/[projectId]` | `route.ts:26` | ✅ `assertProjectAccess(user.id, projectId, 'viewer')` — `route.ts:33`, bắt `AccessError` → 404 (`:34-39`) | **KHÔNG IDOR** |
| `projects/[id]/overview` | `route.ts:22` | ✅ `route.ts:30`; nhánh dự phòng Flow.id có kiểm `flow.userId === user.id` (`:95`); chặn lộ bucket ẩn `__nb:` (`:59-61`) | **KHÔNG IDOR** |
| `projects/[id]/members` | `route.ts:33,72,120,158` | ✅ GET viewer (`:36`), POST/PATCH owner (`:83,:131`), DELETE `targetId===user.id ? 'viewer' : 'owner'` (`:164`) + chặn gỡ owner cuối (`:137,:170`) | **KHÔNG IDOR — route mẫu** |
| `notebook/[projectId]/*` | ✅ mọi method | ❌ **không dùng `ProjectMember`** — dùng `resolveNotebookProjectId()` kiểm `real.userId !== userId` (`lib/notebook/resolveProject.ts:39`) | **Không rò dữ liệu** (rơi xuống bucket riêng, `:40-45`) nhưng **SAI NGHIỆP VỤ** — xem §2.3a |
| `library/[id]` (DELETE) | `route.ts:12` | n/a | ✅ chỉ chủ upload hoặc admin (`:16-18`) |
| `library/[id]/file` (GET) | `route.ts:8` | n/a | 🟡 **bất kỳ ai đăng nhập đọc được MỌI asset** — đúng chủ ý "thư viện dùng chung cả team" (`library/route.ts:10`), nhưng nghĩa là ảnh dự án khách A hiện với người chỉ làm dự án B |
| `share/[token]` | không (cố ý) | n/a | ✅ token ngẫu nhiên, `deletedAt: null` (`route.ts:8`), `dashboard/route.ts:91-93` cố ý KHÔNG trả token thô |
| `flows/[id]` | `route.ts:8` | ❌ chỉ `flow.userId !== user.id` (`:12`) — **không** đi qua ProjectMember | Đọc/sửa flow người khác: KHÔNG được. Nhưng xem §2.5 |
| `credits` | `route.ts:10,42` | n/a | ✅ phiên; ❌ nghiệp vụ (§5) |

### 2.3a · 🟡 Notebook dùng sai nguồn chân lý quyền

`lib/notebook/resolveProject.ts:39` so `real.userId !== userId`. Theo `prisma/schema.prisma:102-104`, nguồn chân lý DUY NHẤT cho "ai thấy dự án nào" là `ProjectMember`.
**Hệ quả cụ thể:** Hoà tạo dự án X, mời Nam vai `crea`. Nam mở `/projects/X/notebook` → `resolveNotebookProjectId` thấy `X.userId !== Nam.id` → **âm thầm tạo project ẩn `__nb:X` của Nam** (`:48-66`) → Nam thấy notebook TRỐNG, upload tài liệu vào một kho khác hẳn, không ai báo lỗi. Đúng bệnh "hai người cùng dự án nhìn hai nguồn khác nhau".
**Sửa:** thay `real.userId !== userId` bằng `assertProjectAccess(userId, clean, 'viewer')`; chỉ rơi xuống bucket ẩn khi `paramId` **không phải** Project.id thật (đúng ca slug mà fix gốc nhắm tới).

### 2.4 · "Đăng nhập là toàn quyền" — 8 route ghi dữ liệu chung không có bậc quyền

| Route | Ai làm được gì | `file:dòng` | Rủi ro |
|---|---|---|---|
| `DELETE /api/specs/[id]` | **bất kỳ ai đăng nhập** xoá vĩnh viễn 1 dòng ProductSpec (giá vật liệu của cả công ty) | `specs/[id]/route.ts:36-44` | 🔴 mất dữ liệu giá, không xoá mềm, không log |
| `PATCH /api/specs/[id]` | sửa `priceVnd` bất kỳ spec nào | `specs/[id]/route.ts:16-32` | 🔴 sai tiền BOQ, âm thầm |
| `POST /api/specs` | thêm spec vào kho chung | `specs/route.ts:30-47` | 🟡 |
| `POST /api/lark-tasks/sync` | ai cũng kích được full sync Larkbase | `lark-tasks/sync/route.ts:18-20` | 🟡 đốt quota Lark, không rate limit |
| `POST /api/atlas-materials/sync` | như trên | `atlas-materials/sync/route.ts:22-24` | 🟡 |
| `POST/DELETE /api/lark-user-map` | ai cũng ánh xạ/gỡ Lark account ↔ User.id của người khác | `lark-user-map/route.ts:14-33,37-44` | 🟡 sai quy kết "Chủ trì" |
| `DELETE /api/comments?id=` | ai cũng xoá góp ý của người khác (chỉ `?all=1` mới cần admin) | `comments/route.ts:117-126` | 🟢 |
| `GET /api/dashboard` | ai cũng thấy **số dư credit + isAdmin + tên mọi user + mọi project của cả công ty** | `dashboard/route.ts:18-33,35-49` | 🟡 có chủ ý ("app nội bộ LAN", `:7-8`) nhưng `credits`/`isAdmin` là thừa cho UI |

**Chuẩn có sẵn để noi theo:** `User.isAdmin` đã được dùng đúng ở `comments/route.ts:119` và `library/[id]/route.ts:16`. Chỉ cần áp cùng một dòng cho 6 route trên.

### 2.5 · 🟡 `PUT /api/flows/[id]` gán `projectId` không kiểm quyền

`app/api/flows/[id]/route.ts:77`: `if ('projectId' in body) data.projectId = body.projectId ?? null;` — không kiểm người gọi có quyền trên project đích. Tương tự `flows/route.ts:89` lúc tạo.
**Kịch bản:** người ngoài dự án gán flow rác của mình vào `projectId` của dự án khách → flow đó **hiện trong** `projects/[id]/overview` của nạn nhân (`overview/route.ts:44-45` chỉ lọc theo `projectId`). Không đọc trộm được gì, nhưng là **ghi chéo ranh giới dự án**.
**Sửa:** trước khi set, gọi `assertProjectAccess(user.id, body.projectId, 'drafter')`.

### 2.6 · Thiếu chống dò mật khẩu

`app/api/auth/login/route.ts:10-18` — không đếm số lần sai, không khoá, không delay. `grep -i ratelimit app lib` = 0 hit (chỉ là chữ trong thông báo lỗi NVIDIA). Với đăng ký công khai đã mở (`auth/register/route.ts:8-11`) thì đây là 🟡 thật, không lý thuyết.

---

## §3 · TRỤC ③ — SCHEMA & TRUY VẤN

### 3.1 · Model nào chết / bán chết

| Model | Ghi | Đọc | Kết luận |
|---|---|---|---|
| `FlowVersion` | `flows/[id]/route.ts:41` (create), `:48` (đọc **chỉ id+createdAt để tỉa**), `:57` (delete) | **KHÔNG NƠI NÀO đọc `graphJson`** — grep `prisma.flowVersion` chỉ ra 3 hit, đều trong 1 file | 🟡 **Dữ liệu ghi-rồi-bỏ**. Có snapshot, có thang lưu giữ (`lib/flow-version-retention.ts`), nhưng **không có route/nút khôi phục**. Người dùng bấm "Đánh dấu bản này" mà không bao giờ quay lại được |
| `LarkPersonRef` | `lark-tasks/sync/route.ts:77` | `lark-tasks/route.ts:20` | ✅ sống |
| `GuModel` | `gu/[kind]/route.ts:45` | `:24` | ✅ sống |
| `IntegrationAccount` | `lib/integrations/oauth-core.ts` | idem | ✅ sống |
| `ProjectNotebook`/`NotebookSource`/`NotebookChunk` | notebook routes | `lib/notebook/rag.ts:69` | ✅ sống |
| 12 model còn lại | — | — | ✅ sống |

**Không có model nào chết hẳn.** `FlowVersion` là ca "nửa chết" đáng sửa.

### 3.2 · Index thiếu cho truy vấn ĐANG chạy

| Truy vấn thật | `file:dòng` | Index hiện có | Thiếu |
|---|---|---|---|
| `creditTransaction.findMany({where:{userId}, orderBy:{createdAt desc}, take:30})` | `credits/route.ts:44-48` | **KHÔNG CÓ index nào** trên `CreditTransaction` (`schema.prisma:223-232`) | `@@index([userId, createdAt])` |
| `creditTransaction.aggregate({where:{amount<0, createdAt>=…}})` | `dashboard/route.ts:65-68` | như trên | `@@index([createdAt])` |
| `flow.findMany({where:{userId, deletedAt:null}, orderBy:{updatedAt}})` | `flows/route.ts:14-16` | chỉ `@@index([deletedAt])` (`schema.prisma:209`) | `@@index([userId, deletedAt])` |
| `flow.findMany({where:{projectId, deletedAt:null}})` | `overview/route.ts:44-45` | không có | `@@index([projectId, deletedAt])` |
| `project.findMany({where:{userId, deletedAt:null, NOT name startsWith}})` | `flows/route.ts:31-37` | `larkProjectCode`, `deletedAt` (`:98-99`) | `@@index([userId, deletedAt])` |
| `project.findFirst({where:{userId, name, deletedAt:null}})` | `lib/notebook/resolveProject.ts:49-52` | như trên | idem — chạy **mỗi request notebook** |
| `chatMessage.findMany({where:{createdAt > after}, orderBy asc, take 200})` | `chat/route.ts:10-15` | **KHÔNG CÓ** (`schema.prisma:234-241`) | `@@index([createdAt])` — polling liên tục |
| `user.findMany({where:{lastSeenAt > …}})` | `chat/route.ts:16-19` | không có | `@@index([lastSeenAt])` — cũng dùng ở `flows/route.ts:42`, `dashboard/route.ts:18` |
| `libraryAsset.findMany({where:{deletedAt:null}, orderBy createdAt})` | `library/route.ts:14-18` | `deletedAt` (`:279`) | `@@index([deletedAt, createdAt])` |

Ghi chú: SQLite + quy mô studio thì chưa gãy hôm nay; nhưng `chat` và `cursors` là **polling** nên là chỗ đau đầu tiên khi số hàng lên.

### 3.3 · N+1 / vòng lặp gọi DB

| Chỗ | `file:dòng` | Mô tả |
|---|---|---|
| Sync Lark task | `lark-tasks/sync/route.ts:38-62` | `for` từng record → `await prisma.larkTaskRef.upsert` **tuần tự**. 1449 bản ghi = 1449 round-trip nối đuôi (sổ tổng §3 PHU-2 ghi con số này) |
| Sync Lark nhân sự | `lark-tasks/sync/route.ts:65-83` | idem |
| Sync ATLAS | `atlas-materials/sync/route.ts:51-63` | idem |
| Chunk notebook | `notebook/[projectId]/source/route.ts:91-104` | ✅ **làm đúng** — gom vào một `$transaction`. Đây là mẫu nên nhân bản cho 3 chỗ trên |

Sửa: gom theo lô (`$transaction` mỗi 100-200 upsert). SQLite mỗi write là một transaction ngầm → khác biệt rất lớn.

### 3.4 · `select`/`include` kéo thừa

| Chỗ | `file:dòng` | Kéo thừa gì |
|---|---|---|
| `library.findMany` | `library/route.ts:14-18` | không `select` → kéo **cả `content`** (chữ bóc từ PDF, tới 20.000 ký tự/hàng — `schema.prisma:262`, `library/route.ts:86`) cho MỌI asset, trong khi response chỉ dùng `hasContent: !!a.content` (`:37`). Với 200 ref có PDF = ~4MB đọc thừa mỗi lần mở thư viện |
| `flows/[id]` GET | `flows/[id]/route.ts:11,20` | `findUnique` không `select` → kéo cả `graphJson`; ở `PUT` cũng kéo full flow chỉ để lấy `version`+`graphJson` (`:11,39,42`) |
| `productSpec.findMany({kind:'material'})` | `boq/[projectId]/route.ts:53` | kéo cả `raw` (JSON gốc Larkbase) rồi mới `specToDto` |
| `larkTaskRef.findMany()` | `lark-tasks/route.ts:19` | kéo cả cột `raw` (`schema.prisma:328`) rồi response bỏ đi (`:31-43`) |
| `notebookChunk.findMany` | `lib/notebook/rag.ts:69-72` | **kéo TOÀN BỘ chunk + embedding JSON** của notebook về RAM mỗi câu hỏi. Có ghi chú thừa nhận trong `schema.prisma:133-135` ("hàng nghìn chunk vẫn nhanh trong Node") — đúng ở quy mô nhỏ, nhưng 1 PDF 200 trang ≈ 600 chunk × 1024 float ≈ 5MB JSON parse **mỗi lượt chat** |
| `user.findMany` (roster) | `flows/route.ts:42-45` | trả **mọi user trong DB** cho mỗi lần mở Gallery, không phân trang |

### 3.5 · Trường JSON tự do đáng lẽ nên là bảng

| Trường | `schema.prisma:` | Nhận xét |
|---|---|---|
| `NotebookChunk.embedding` (JSON float[]) | `:175` | Đây là **quyết định đã ghi rõ lý do** (`:133-135`, không thêm pgvector). Chấp nhận ở Pha 1; nêu lại làm nợ, không phải lỗi |
| `LibraryAsset.palette` (JSON string[]) | `:260` | 🟢 nhỏ, để yên |
| `ProductSpec.materials` / `finishes` / `styleTags` (JSON string[]) | `:371,372,394` | 🟡 Không lọc/nhóm/đếm được theo tag bằng SQL. Khi Gu Engine cần "mọi spec có `styleTags` chứa X" sẽ phải quét cả bảng. Nên tách `SpecTag(specId, kind, value)` khi có nhu cầu thật |
| `LarkTaskRef.raw` / `LarkPersonRef.raw` / `ProductSpec.raw` | `:328,349,379` | ✅ ĐÚNG — mirror pull-only, cố ý giữ nguyên văn |
| `Flow.graphJson` | `:188` | ✅ ĐÚNG với Pha 1 "Doc chỉ sống ở client" (`boq/[projectId]/route.ts:11-14`). Nhưng vì thế **server không truy vấn được gì bên trong flow** — mọi tính toán phải để client gửi lên (đó là lý do BOQ phải là POST) |
| `User.avatar` (JSON) | `:32` | ✅ nhỏ, có schema ghi trong comment |
| `GuModel.weightsJson` | `:298` | ✅ có giải thích tại sao không tách cột (`:285-288`) |

### 3.6 · Bẫy schema đã biết mà chưa vá hết

`ProjectMember.@@unique([projectId,userId])` không gồm `deletedAt` (`schema.prisma:113-116`). Route members ĐÃ xử đúng bằng "hồi sinh hàng cũ" (`members/route.ts:86-111`). Nhưng `resolveProject.ts:55-65` tạo Project + member mà **không** phòng ca này — CHƯA VERIFY có tái hiện được không (bucket ẩn hiếm khi bị gỡ member).

---

## §4 · TRỤC ④ — VIỆC NẶNG & HÀNG ĐỢI

**Kết luận chung: KHÔNG CÓ HÀNG ĐỢI NÀO.** Không có bảng Job trong Prisma, không có worker, không có retry ngoài Lark. Mọi việc nặng chạy trong vòng đời request hoặc "bắn rồi quên" trong tiến trình web.

### 4.1 · 🔴 `/api/render/premium` — vòng lặp đồng bộ 120s trên hạ tầng cắt 60s

`app/api/render/premium/route.ts:53-60`:
```
const started = Date.now();
for (;;) {
  if (Date.now() - started > 120_000) return refundThenMock();
  await new Promise((r) => setTimeout(r, 1500));
  const st = await jobStatus(m.fal, jobId);
  ...
}
```
`vercel.json` khai `"app/api/**/route.ts": { "maxDuration": 60 }`.
**Hệ quả:** credit đã bị trừ ở `:41` **trước** vòng lặp; nhánh hoàn tiền `:55` chỉ chạy ở mốc 120s — mà tiến trình đã bị giết ở 60s. → **Người dùng mất 4 credit, không có ảnh, không được hoàn.** Xảy ra với MỌI job fal chạy quá 60 giây (fal FLUX Pro thường 20-60s → nằm ngay ranh giới).
**Sửa:** đổi ngưỡng vòng lặp xuống dưới `maxDuration` (vd 45s) rồi trả `jobId` cho client tự poll qua `/api/jobs/[id]` (cơ chế poll đã có sẵn ở `lib/ai/client.ts:66-90`), hoàn credit ở nhánh timeout ngắn.

### 4.2 · 🔴 Notebook ingest — "bắn rồi quên", không hàng đợi, không retry

`app/api/notebook/[projectId]/source/route.ts:222` `void processSource(...)` rồi `:231` trả 202 ngay.
- Trên server thường (Electron/LAN) thì chạy được.
- Trên serverless, tiến trình đóng băng ngay sau response → `NotebookSource` **kẹt `status:'processing'` vĩnh viễn** (`:201`), không ai dọn, không có retry, không có timeout.
- Embed gọi theo lô 32 (`:83-89`) — với PDF 200 trang là ~19 lượt gọi NVIDIA nối tiếp, mỗi lượt **không có timeout** (`lib/notebook/embed.ts:55`).
**Sửa tối thiểu:** thêm cột `startedAt` + job dọn "processing quá 10 phút → error", và nút "Thử lại" trên UI.

### 4.3 · Việc nặng khác — chạy đồng bộ trong request

| Việc | `file:dòng` | Rủi ro timeout |
|---|---|---|
| Convert FBX bằng Blender headless | `app/api/render/fbx/route.ts:40` → `lib/server/blender.ts` | 🔴 Blender khởi động + convert dễ vượt 60s với OBJ 20MB (giới hạn ở `:25`). CHƯA VERIFY có timeout trong `lib/server/blender.ts` |
| Sync Lark 1449 bản ghi tuần tự | `lark-tasks/sync/route.ts:38-83` | 🔴 gần như chắc chắn vượt 60s (retry backoff tới 8s/lần, `lib/integrations/providers/lark.ts:76`) |
| Bóc chữ PDF | `pdf/extract/route.ts:15-16` | 🟡 không giới hạn dung lượng file (§6.4) |
| RAG: load hết chunk + cosine + gọi LLM | `lib/notebook/rag.ts:69` + `/query` route | 🟡 |
| BOQ compute | `boq/[projectId]/route.ts:56` — hàm thuần, có cache | ✅ ổn |
| Xuất PDF / xlsx / capture video | **không chạy ở server** — `lib/pptx.ts`, `lib/pdf-font.ts`, `lib/three/capture.ts` là client-side | ✅ đúng thiết kế Pha 1 |

### 4.4 · Gọi API bên thứ ba KHÔNG có timeout

| File:dòng | Đích | Timeout | Bắt lỗi |
|---|---|---|---|
| `lib/ai/providers/nvidia.ts:29` | NVIDIA chat | ❌ | ✅ typed error |
| `lib/ai/providers/nvidia.ts:197` | NVIDIA genai (ảnh) | ❌ | ✅ |
| `lib/notebook/embed.ts:55` | NVIDIA embed | ❌ | ✅ |
| `lib/ai/providers/fal.ts:25` | tải media fal | ❌ | ⚠️ |
| `lib/ai/providers/comfyui.ts:42,49,121,147` | ComfyUI | ❌ | ⚠️ |
| `lib/ai/providers/sd.ts:34,105` | SD WebUI | ❌ | ⚠️ |
| `lib/integrations/providers/lark.ts:92` | Lark REST | ❌ (**có retry+jitter** `:71-105`) | ✅ |
| `lib/integrations/oauth-core.ts:67,114` | token endpoint | ❌ | ✅ |
| `lib/integrations/providers/{google,ms365,zoom,zalo,spotify,youtube,team}.ts` | các API ngoài | ❌ | ⚠️ |
| `app/api/illustration/route.ts:58,88` | Openverse/Unsplash | ❌ | ✅ |
| `app/api/library/clip/route.ts:30` | URL người dùng đưa | ❌ | ✅ |
| `app/api/auth/google/callback/route.ts:50,66` | Google | ❌ | ✅ |
| **`lib/ai/providers/ollama.ts:88-110`** | Ollama | ✅ `AbortController` | ✅ |
| **`app/api/stock-photos/route.ts:34-46`** | Openverse/Unsplash | ✅ 9s | ✅ |
| **`app/api/stock-photos/proxy/route.ts:26-27`** | ảnh ngoài | ✅ 15s | ✅ |

→ **3/16 chỗ có timeout.** Nhà cung cấp treo = request treo tới khi hạ tầng cắt. Đã có 2 mẫu đúng ngay trong repo (`stock-photos`, `ollama`) — chỉ cần nhân bản.

### 4.5 · Presence để trong RAM tiến trình

`app/api/cursors/route.ts:24` `const cursors = new Map(...)` ở module scope. Route tự thừa nhận reset khi restart (`:8-10`). Ở LAN 1 tiến trình thì đúng; **nhiều instance/serverless thì mỗi instance một Map** → người dùng thấy nhau lúc có lúc không. Ghi rõ giới hạn này vào sổ trước khi lên cloud.

### 4.6 · Cơ chế thử lại

Chỉ Lark có (`lib/integrations/providers/lark.ts:71-105`, backoff 1→8s + jitter, whitelist mã lỗi). **Mọi chỗ khác: không có retry.** `flows/[id]` PUT có chỗ nuốt lỗi tỉa version có chủ ý (`:59-61` — đúng).

---

## §5 · TRỤC ⑤ — CREDIT & TIỀN

### 5.1 · 🔴 Tự nạp credit vô hạn

`app/api/credits/route.ts:30-34`:
```
} else {
  await prisma.user.update({ where: { id: user.id }, data: { credits: { increment: amt } } });
  await prisma.creditTransaction.create({ data: { userId: user.id, amount: amt, reason: …, jobRef } });
}
```
`amt` = `Math.abs(Number(amount)||0)` từ body (`:13`), không trần, không đối chiếu `jobRef` với giao dịch trừ nào, không kiểm đã hoàn chưa.
**Kịch bản:** bất kỳ tài khoản đăng nhập nào chạy `curl -X POST /api/credits -d '{"action":"refund","amount":1000000}'` → số dư triệu credit → tiêu thoải mái vào fal/NVIDIA thật.
**Sửa:** `refund` chỉ được gọi từ server (`lib/server/credits.ts:30`), bỏ nhánh `refund` khỏi route công khai; hoặc bắt buộc `jobRef` phải trỏ tới một `CreditTransaction` âm cùng user, cùng số tiền, chưa hoàn.

### 5.2 · 🔴 `/api/jobs` không kiểm/trừ credit

`app/api/jobs/route.ts:7-55` — có chặn ẩn danh (`:9-10`), chặn tier (`:22-32`), chặn video tier thấp (`:27`), nhưng **không một dòng nào đụng credit**. Việc trừ nằm ở client: `lib/execution.ts:108-137` gọi `/api/credits` action `spend` **rồi mới** gọi `def.execute()`.
**Kịch bản:** `curl -X POST /api/jobs -d '{"task":"...","tier":4,"input":{...}}'` lặp lại → đốt balance fal thật, credit không giảm một đơn vị.
Route `/api/render/premium` đã làm ĐÚNG (`:39-44`, kế toán tại server, có ghi chú "node compare creditCost=0 client bypass được"). Bài học đó chưa được áp cho `/api/jobs`.
**Sửa:** đưa `spendCredits(user.id, costOf(task, tier), …)` (`lib/server/credits.ts:10`) vào `/api/jobs` **trước** `submitJob` (`:51`), và `refundCredits` khi `submitJob` ném lỗi (`:53`).

### 5.3 · 🟡 `/api/render/nvidia-image` không tính credit

`app/api/render/nvidia-image/route.ts:17-48` — gọi NVIDIA sinh ảnh, chỉ chặn ẩn danh (`:18-20`). Quota free NVIDIA là tài nguyên chung của cả team, không ai bị tính. Chấp nhận được nếu là "tầng free có chủ ý" — **cần Hoà chốt**, hiện không có dòng nào nói rõ.

### 5.4 · Trừ credit CÓ nguyên tử — phần này làm đúng

`lib/server/credits.ts:18-22` và `app/api/credits/route.ts:20-26` đều dùng `updateMany({ where: { id, credits: { gte: amt } }, data: { decrement } })` rồi kiểm `count === 0`. Đây là **compare-and-set trong một câu SQL** → chạy song song không tiêu quá số dư. ✅

### 5.5 · Nhưng "trừ tiền" và "tạo giao dịch" KHÔNG cùng transaction

`lib/server/credits.ts:18-26` — `updateMany` xong mới `creditTransaction.create` ở lệnh riêng. Giống hệt ở `credits/route.ts:20-29`.
**Hệ quả:** tiến trình chết giữa hai lệnh → **số dư đã giảm nhưng sổ cái không có dòng nào**. Không đối soát được, không hoàn được (không có `jobRef`). Với SQLite thì cửa sổ hẹp, nhưng đây đúng là câu hỏi "trừ tiền và tạo job có thể lệch nhau không" → **CÓ**.
**Sửa:** bọc `prisma.$transaction([...])`. Mẫu `$transaction` đã có ở `notebook/source/route.ts:91`.

### 5.6 · Đường đi của tiền còn lệch nữa

| Vấn đề | `file:dòng` |
|---|---|
| Hoàn tiền khi job lỗi là lời gọi **fire-and-forget từ client** (`.then().catch(()=>{})`) — đóng tab giữa chừng là mất tiền | `lib/execution.ts:161-168` |
| `creditCost` do client khai (`def.creditCost`) — server không có bảng giá | `lib/execution.ts:102,114` |
| Không có trần chi tiêu/ngày, không có cảnh báo số dư âm bất thường | — |
| `CreditTransaction` không có index (§3.2) và không bao giờ được đối soát với `User.credits` | `schema.prisma:223-232` |

---

## §6 · TRỤC ⑥ — RÒ RỈ & AN TOÀN

### 6.1 · Secret ra client — SẠCH ✅

`grep -rn "NEXT_PUBLIC_" app components lib electron scripts next.config.mjs` = 6 hit, **không hit nào là khoá/token**:
`app/cad-library-demo/page.tsx:14` và `app/demo-resort/page.tsx:162` (`NEXT_PUBLIC_DEMO`), `components/CommentLayer.tsx:158` (`NEXT_PUBLIC_COMMENT_LAYER`), còn lại là comment.
Trong `components/` chỉ còn `process.env.NODE_ENV` (`PWARegister.tsx:13`).
`.gitignore:3-4,30-31` có `.env`, `.env.local`, `.env*.bak*` → 4 file env ở gốc (`.env`, `.env.local`, 2 bản `.bak`) đều bị bỏ qua. ✅
Token OAuth mã hoá AES-256-GCM at-rest, khoá tách khỏi DB, **thiếu khoá thì ném lỗi chứ không lưu thô** (`lib/integrations/crypto.ts:13-23`). ✅
`auth/providers/route.ts:12-16` chỉ trả boolean. `dashboard/route.ts:91-93` cố ý cắt `shareToken`. ✅

### 6.2 · 🔴 Upload: không whitelist loại tệp → XSS lưu trữ

**Upload** — `app/api/library/route.ts:60-73`: chỉ kiểm `dataUrl.startsWith('data:')` và regex `^data:([^;]+);base64,(.+)$`. `mime` là **chuỗi client tự khai**, lưu thẳng vào DB (`:80`). Giới hạn 25MB có (`:67`). **Không có whitelist `image/*`.**
**Tải về** — `app/api/library/[id]/file/route.ts:14-19`: trả `'Content-Type': asset.mime`, **không** `X-Content-Type-Options: nosniff`, **không** `Content-Disposition: attachment`.
**Kịch bản khai thác:** người dùng đã đăng nhập POST `/api/library` với `dataUrl = "data:text/html;base64,<script>…"` → lấy id → dụ đồng nghiệp mở `/api/library/<id>/file` → **script chạy trên chính origin của app**. Cookie `if_session` là `httpOnly` (`lib/server/auth.ts:73`) nên không đọc được token, nhưng script vẫn `fetch()` được mọi API **với tư cách nạn nhân** — gồm `DELETE /api/specs/[id]`, `POST /api/credits refund`, `PUT /api/flows/[id]`. Cùng hình dạng với `image/svg+xml` (SVG chứa `<script>`).
Cùng lỗ ở notebook: `mimeType = f.type` (`notebook/[projectId]/source/route.ts:162`) → trả lại `inline` với chính chuỗi đó (`.../file/route.ts:45-46`).
**Đối chiếu chỗ làm ĐÚNG:** `comments/route.ts:39` whitelist cứng `/^data:image\/(png|jpe?g|webp|gif);base64,/`.
**Sửa:** whitelist MIME lúc upload (dùng lại regex của `comments`), và ở route trả file: ép `Content-Type` về whitelist, thêm `X-Content-Type-Options: nosniff`, `Content-Disposition: attachment` cho mọi thứ không phải ảnh raster.

### 6.3 · 🔴 SSRF ở `/api/library/clip`

`app/api/library/clip/route.ts:29-34`: `fetch(imageUrl)` với `imageUrl` chỉ qua kiểm `/^https?:\/\//`. **Không chặn host nội bộ, không timeout, không giới hạn kích thước trước khi buffer** (kiểm 25MB ở `:41`, sau khi đã tải hết vào RAM).
Chỉ cần dụ được một người dùng đã đăng nhập (hoặc dùng chính extension) → server tự gọi `http://127.0.0.1:8188/...` (ComfyUI local), `http://192.168.x.x/...`, hoặc endpoint metadata cloud; nội dung trả về được **lưu thành asset và đọc lại được** qua `/api/library/[id]/file`.
**Đối chiếu:** `app/api/stock-photos/proxy/route.ts:23` dùng `isFetchableImageUrl()` (chặn host nội bộ), `:26-27` có AbortController 15s, `:38-42` kiểm `content-length` **trước** khi đọc body. **Hàm và mẫu đã có sẵn** — `library/clip` chỉ đơn giản là chưa dùng.

### 6.4 · Giới hạn dung lượng upload — bảng đối chiếu

| Route | Giới hạn | Kiểm loại tệp | `file:dòng` |
|---|---|---|---|
| `/api/library` POST | ✅ 25MB | ❌ | `:67-69` |
| `/api/library/clip` | ⚠️ 25MB nhưng **sau khi đã buffer hết** | ⚠️ chỉ với nhánh `imageUrl` (`:33`), nhánh `dataUrl` không kiểm | `:41` |
| `/api/notebook/.../source` | ✅ 20MB PDF / 5MB ảnh | ⚠️ kiểm `kind` (`:148`), không kiểm nội dung/MIME thật | `:26-27,155-161` |
| `/api/pdf/extract` | ❌ **KHÔNG CÓ** | ❌ chỉ `file instanceof File` | `:10-16` |
| `/api/render/fbx` | ✅ 20MB | ✅ kiểm có `\nv ` (OBJ) | `:21-27` |
| `/api/comments` (ảnh) | ❌ không giới hạn | ✅ whitelist 4 định dạng | `:38-45` |
| `/api/stock-photos/proxy` | ✅ 12MB, kiểm header trước | ✅ `image/*` | `:38-42` |

→ `/api/pdf/extract` nhận file bao nhiêu cũng được, nạp cả vào `Uint8Array` (`:14`) rồi đưa unpdf parse → **treo/OOM bằng một file 2GB**.

### 6.5 · SQL thô — SẠCH ✅

`grep -rn "\$queryRaw|\$executeRaw|queryRawUnsafe" app lib scripts prisma` = **0 hit**. Toàn bộ đi qua Prisma client. Không có ghép chuỗi vào truy vấn.

### 6.6 · Đường dẫn tệp — SẠCH ✅

`library/[id]/file/route.ts:13` join `uploads` với `asset.path`, mà `path` là **tên do server sinh** (`library/route.ts:71-72`: timestamp + random + ext đã lọc `[^a-z0-9]`). Notebook cũng vậy (`source/route.ts:209` dùng `source.id`). Không nhận tên tệp từ client → không path traversal.

### 6.7 · Log

`grep -rnE "console\.(log|warn|error)\(.*(token|secret|password|apiKey|API_KEY)"` trong `app lib components` = **1 hit và là file test** (`lib/ai/providers/nvidia.test.ts:77`). ✅
Cảnh báo môi trường ở `lib/server/auth.ts:48-54` chỉ in TÊN cookie, không in secret. ✅
🟡 Nhỏ: thông báo lỗi trả ra client đôi khi chứa message nguyên văn của provider (`jobs/route.ts:54`, `lark-tasks/sync/route.ts:95`, `notebook/query/route.ts:46`) — có thể lộ đường dẫn nội bộ/tên host. Nên cắt ngắn (query route đã `slice(0,300)`, chỗ khác thì không).

### 6.8 · Cookie phiên

`lib/server/auth.ts:72-77`: `httpOnly: true`, `sameSite: 'lax'`, path `/`, JWT HS256 exp 30d.
🟡 **Thiếu `secure: true`** kể cả khi production. Trên LAN http thì đúng; nhưng khi lên cloud (vercel.json đã có), cookie phiên sẽ đi được qua HTTP nếu có ai ép downgrade.
🟡 `AUTH_SECRET` rơi về `'dev-secret-change-me'` khi thiếu env (`:46`) — đã cách ly bằng đổi tên cookie (`:44`, cơ chế thông minh, có giải thích 20 dòng), nhưng **không chặn production thiếu secret**. Nên `throw` khi `NODE_ENV==='production' && !AUTH_SECRET`.

---

## §7 · XẾP HẠNG VIỆC PHẢI LÀM

### 🔴 VỠ / NGUY HIỂM — làm trước mọi thứ

| # | Việc | Sửa ở file nào | Nghiệm thu bằng gì |
|---|---|---|---|
| R1 | **Bịt lỗ tự nạp credit.** Bỏ nhánh `action:'refund'` khỏi route công khai (chỉ `lib/server/credits.refundCredits` gọi từ server); hoặc bắt `jobRef` phải khớp một giao dịch trừ chưa hoàn | `app/api/credits/route.ts:30-34` · `lib/execution.ts:161-168` (đổi sang để server hoàn) | `curl -X POST /api/credits -d '{"action":"refund","amount":999999}'` phải trả 400/403; số dư trong `GET /api/credits` không đổi |
| R2 | **Trừ credit tại server cho `/api/jobs`.** Gọi `spendCredits()` trước `submitJob`, `refundCredits()` khi submit lỗi. Bảng giá theo `task+tier` để ở server, không tin `def.creditCost` | `app/api/jobs/route.ts:50-55` · `lib/server/credits.ts` · bảng giá mới trong `lib/ai/tiers.ts` | `curl -X POST /api/jobs` với tài khoản 0 credit → 402; với tài khoản có credit → `GET /api/credits` giảm đúng số |
| R3 | **Whitelist MIME upload + ép Content-Type khi trả file.** Chỉ nhận `image/(png\|jpe?g\|webp\|gif)` (+ `application/pdf` cho notebook); trả file kèm `nosniff` + `attachment` cho mọi thứ ngoài ảnh raster | `app/api/library/route.ts:60-73` · `app/api/library/[id]/file/route.ts:14-19` · `app/api/notebook/[projectId]/source/route.ts:162` · `.../[sourceId]/file/route.ts:42-48` | Upload `data:text/html;base64,...` → 400. Với asset cũ, `curl -I /api/library/<id>/file` phải thấy `X-Content-Type-Options: nosniff` |
| R4 | **Vá SSRF `/api/library/clip`.** Dùng `isFetchableImageUrl()` + `AbortController` 15s + kiểm `content-length` trước khi buffer — copy nguyên mẫu từ `stock-photos/proxy` | `app/api/library/clip/route.ts:29-41` (dùng `lib/stock-photos.ts` `isFetchableImageUrl`) | `POST /api/library/clip {"imageUrl":"http://127.0.0.1:8188/"}` → 400 "host nội bộ"; ảnh public vẫn clip được |
| R5 | **Render trả phí không được mất tiền khi hết giờ.** Hạ ngưỡng vòng lặp xuống < `maxDuration` (45s) và hoàn credit ở nhánh đó; hoặc trả `jobId` cho client poll `/api/jobs/[id]` | `app/api/render/premium/route.ts:53-60` · `vercel.json` | Giả lập fal chậm (model chậm nhất) → hoặc có ảnh, hoặc credit về nguyên. Không có ca "mất tiền không có ảnh" |
| R6 | **Trừ tiền + ghi sổ trong MỘT transaction** | `lib/server/credits.ts:18-26` · `app/api/credits/route.ts:20-34` | Test: `SUM(CreditTransaction.amount)` của 1 user + 200 (khởi tạo) luôn khớp `User.credits` sau 100 lượt spend/refund song song |
| R7 | **Notebook đọc quyền qua `ProjectMember`**, không qua `Project.userId` | `lib/notebook/resolveProject.ts:31-46` (thay bằng `assertProjectAccess`) | Hoà tạo dự án + mời Nam `crea` → Nam mở notebook thấy **cùng** danh sách nguồn với Hoà, không tạo bucket `__nb:` mới (đếm `Project` trước/sau) |

### 🟡 NỢ KỸ THUẬT — làm sau khi 🔴 sạch

| # | Việc | Sửa ở file nào | Nghiệm thu |
|---|---|---|---|
| Y1 | Gate quyền cho dữ liệu chung: `specs` PATCH/DELETE, `lark-user-map`, 2 route `sync` → yêu cầu `isAdmin` (mẫu: `library/[id]/route.ts:16`) | `app/api/specs/[id]/route.ts:16,36` · `app/api/specs/route.ts:30` · `app/api/lark-user-map/route.ts:14,37` · `app/api/lark-tasks/sync/route.ts:18` · `app/api/atlas-materials/sync/route.ts:22` | Tài khoản thường `DELETE /api/specs/<id>` → 403; admin → 200 |
| Y2 | Thêm timeout cho 13 chỗ fetch bên thứ ba (mẫu `stock-photos/route.ts:34-46`) | `lib/ai/providers/{nvidia,fal,comfyui,sd}.ts` · `lib/notebook/embed.ts:55` · `lib/integrations/providers/*.ts` · `lib/integrations/oauth-core.ts:67,114` · `app/api/illustration/route.ts:58,88` · `app/api/library/clip/route.ts:30` | Chỉ vào host giả treo (`nc -l`) → route trả lỗi trong ≤15s, không treo |
| Y3 | `PUT/POST /api/flows` kiểm quyền trên `projectId` đích | `app/api/flows/[id]/route.ts:77` · `app/api/flows/route.ts:89` | Người ngoài dự án gán flow vào project đó → 404; overview của nạn nhân không xuất hiện flow lạ |
| Y4 | Thêm 9 index còn thiếu (§3.2) | `prisma/schema.prisma` (`CreditTransaction`, `ChatMessage`, `Flow`, `Project`, `LibraryAsset`, `User.lastSeenAt`) | `prisma migrate` sạch; `EXPLAIN QUERY PLAN` của `GET /api/credits` dùng index thay vì SCAN |
| Y5 | Notebook ingest: cột `startedAt` + dọn "processing quá 10 phút → error" + nút Thử lại | `prisma/schema.prisma:148-165` · `app/api/notebook/[projectId]/source/route.ts:222` · `components/notebook/useNotebook.ts` | Giết tiến trình giữa lúc ingest → mở lại thấy nguồn `error` có nút Thử lại, không kẹt `processing` |
| Y6 | Gom sync Lark/ATLAS thành lô `$transaction` (mẫu `notebook/source/route.ts:91`) | `app/api/lark-tasks/sync/route.ts:38-83` · `app/api/atlas-materials/sync/route.ts:51-63` | Sync 1449 bản ghi xong dưới 60s; số bản ghi trước/sau khớp |
| Y7 | `select` gọn: bỏ `content` khỏi list thư viện, bỏ `raw` khỏi list lark-tasks, bỏ `graphJson` khỏi GET flow list | `app/api/library/route.ts:14-18` · `app/api/lark-tasks/route.ts:19` · `app/api/flows/[id]/route.ts:11` | Kích thước response `GET /api/library` giảm rõ với DB có PDF |
| Y8 | Cookie `secure: true` khi production + `throw` nếu production thiếu `AUTH_SECRET` | `lib/server/auth.ts:44-46,72-77` | Build production thiếu `AUTH_SECRET` → server không khởi động (chứ không im lặng dùng secret mặc định) |
| Y9 | Chống dò mật khẩu ở `/api/auth/login` (đếm theo IP+identifier, khoá tạm) | `app/api/auth/login/route.ts:10` | 10 lần sai liên tiếp → 429 |
| Y10 | Giới hạn dung lượng cho `/api/pdf/extract` | `app/api/pdf/extract/route.ts:10-16` | File 100MB → 413, không OOM |
| Y11 | `FlowVersion` — làm đường khôi phục (route `GET /api/flows/[id]/versions` + `PUT action:'restore'`) hoặc chốt bỏ tính năng | `app/api/flows/[id]/route.ts` | Bấm "Đánh dấu bản này" → quay lại được bản cũ trong UI |
| Y12 | Thống nhất ngưỡng online (45s vs 120s) | `app/api/flows/route.ts:11` · `app/api/dashboard/route.ts:15` | Cùng một người hiện cùng trạng thái ở Gallery và Dashboard |

### 🟢 DỌN DẸP

| # | Việc | Sửa ở file nào | Nghiệm thu |
|---|---|---|---|
| G1 | Xoá `/api/auth/apple` (stub luôn 503, không ai gọi) | `app/api/auth/apple/route.ts` · `lib/server/oauth.ts` (`appleConfigured`) | `grep -rn "api/auth/apple" app components lib` = 0; `LoginForm` không đổi hành vi |
| G2 | Nối nút cho `/api/atlas-materials/sync` (hoặc hạ thành script) — kèm verify `ATLAS_FIELD_NAMES` trước khi bật | `components/ProjectSelect.tsx` (cạnh `:319`) · `lib/lark/atlas-material-map.ts` | Bấm nút → có số bản ghi thật; tên cột đối chiếu đúng 8 cột ATLAS |
| G3 | Gộp tầng tìm ảnh của `/api/illustration` về hàm chung `lib/stock-photos.ts` | `app/api/illustration/route.ts:52-111` | Hai route trả cùng shape ảnh; xoá được ~50 dòng trùng |
| G4 | `DELETE /api/comments?id=` chỉ cho người tạo hoặc admin | `app/api/comments/route.ts:123-126` | Người khác xoá góp ý → 403 |
| G5 | Gate `/api/health` sau đăng nhập (hoặc bỏ bớt field) | `app/api/health/route.ts:6` | Gọi khi chưa đăng nhập → 401 |
| G6 | Cắt ngắn message lỗi provider trả ra client | `app/api/jobs/route.ts:54` · `app/api/lark-tasks/sync/route.ts:95` · `app/api/atlas-materials/sync/route.ts:68` | Không có đường dẫn máy chủ/tên host trong response lỗi |
| G7 | Ghi vào sổ tổng §1 giới hạn của `/api/cursors` (RAM, 1 tiến trình) trước khi lên cloud | `docs/SO-KIEM-TONG.md` | Có dòng trong sổ |

---

## §8 · CHƯA VERIFY (ghi để phiên sau làm nốt)

1. `lib/server/blender.ts` — có timeout cho tiến trình Blender không? (chỉ đọc route gọi, chưa đọc file).
2. `/api/integrations/[provider]/connect` + `/disconnect` — có nút UI nào mở bằng `<a href>` dựng động không? grep `fetch` không thấy.
3. `lib/ai/providers/index.ts` `submitJob()`/`providerConfigured()` — chưa đọc kỹ; kết luận "không tính credit" dựa trên route, không dựa trên provider layer.
4. `ProjectMember` unique + soft-delete: `resolveProject.ts:55-65` có tái hiện được lỗi constraint không.
5. Không chạy app, không chạy test — mọi kết luận là ĐỌC CODE. Các con số hiệu năng (4MB, 5MB JSON) là ước lượng từ giới hạn ghi trong code, không phải đo thật.
